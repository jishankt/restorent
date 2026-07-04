import os
import re
import json
import sqlite3
import logging
import requests
import jwt
from flask import Blueprint, request, jsonify
from extensions import limiter
from tools import TOOL_SCHEMAS, execute_tool

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
# Force UTF-8 on the stream handler so non-ASCII characters (e.g. ₹) never crash the logger
for handler in logging.getLogger().handlers:
    if hasattr(handler, 'stream'):
        handler.stream.reconfigure(encoding='utf-8', errors='replace')

logger = logging.getLogger('chatbot_api')

chatbot_bp = Blueprint('chatbot', __name__)

# ─────────────────────────────────────────────
# CONFIG  (all env-overridable)
# ─────────────────────────────────────────────
OLLAMA_CHAT_URL   = os.environ.get('OLLAMA_URL',           'http://127.0.0.1:11434/api/chat')
LLM_MODEL         = os.environ.get('OLLAMA_MODEL',         'llama3.1:latest')
MAX_ITERATIONS    = int(os.environ.get('MAX_TOOL_ITERATIONS', 5))
MAX_MSG_LEN       = int(os.environ.get('MAX_MSG_LEN',       2000))   # guard against context-window bombing
DB_PATH           = os.path.join(os.path.dirname(__file__), 'chatbot.db')

# JWT_SECRET — load from the same config.json that app1.py uses so both processes
# share the same signing key. An explicit JWT_SECRET env var takes priority (e.g. for Docker).
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config.json')

def _load_secret_key():
    # 1. Explicit env var wins (12-factor / Docker / CI deployments)
    env_secret = os.environ.get('JWT_SECRET', '').strip()
    if env_secret:
        return env_secret
    # 2. Shared config.json — same file app1.py reads at startup
    try:
        with open(_CONFIG_PATH, 'r') as f:
            cfg = json.load(f)
        secret = cfg.get('jwt_secret', '').strip()
        if secret:
            return secret
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Could not read config.json: {e}")
    # 3. No secret found — hard fail so the problem is obvious at startup
    raise RuntimeError(
        "JWT_SECRET not found. Set the JWT_SECRET environment variable "
        "or ensure config.json contains a 'jwt_secret' key."
    )

SECRET_KEY = _load_secret_key()
logger.info("JWT_SECRET loaded successfully.")

# ─────────────────────────────────────────────
# DATABASE  (chatbot's own local history DB only — NOT restaurant.db)
# ─────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    try:
        conn = get_db()
        conn.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                user_id    TEXT,
                role       TEXT,
                content    TEXT,
                name       TEXT,
                tool_calls TEXT,
                timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to init DB: {e}")

init_db()

def get_history(session_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT role, content, name, tool_calls FROM chat_history WHERE session_id = ? ORDER BY id ASC',
            (session_id,)
        )
        history = []
        for role, content, name, tc_json in cursor.fetchall():
            msg = {"role": role}
            if content:  msg["content"]    = content
            if name:     msg["name"]       = name
            if tc_json:  msg["tool_calls"] = json.loads(tc_json)
            history.append(msg)
        return history
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return []

def save_message(session_id, user_id, message_obj):
    try:
        conn = get_db()
        tc = message_obj.get("tool_calls")
        conn.execute(
            'INSERT INTO chat_history (session_id, user_id, role, content, name, tool_calls) VALUES (?,?,?,?,?,?)',
            (
                session_id,
                user_id,
                message_obj.get("role"),
                message_obj.get("content"),
                message_obj.get("name"),
                json.dumps(tc) if tc else None,
            )
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving message: {e}")

# ─────────────────────────────────────────────
# AUTH — server-side JWT verification
# ─────────────────────────────────────────────
def get_verified_role(req, data):
    """
    Derive role from a verified JWT.

    Priority:
      1. Authorization: Bearer <token>  header   (preferred — never trust client body for auth)
      2. data['token']                            (legacy / browser fallback)

    Returns:
      (role: str, user_id: str, is_verified: bool)
      role is 'Guest' and is_verified=False when no valid token is present.
    """
    auth_header = req.headers.get('Authorization', '')
    token = auth_header.removeprefix('Bearer ').strip()
    if not token and data:
        token = data.get('token', '').strip()

    if not token:
        return 'Guest', 'guest', False

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        role    = payload.get('role', 'Guest')
        user_id = payload.get('user_id', 'unknown')
        return role, user_id, True
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token")
        return 'Guest', 'guest', False
    except jwt.InvalidTokenError:
        logger.warning("Invalid JWT token")
        return 'Guest', 'guest', False

# ─────────────────────────────────────────────
# SYSTEM PROMPT  (single source of truth)
# ─────────────────────────────────────────────
BASE_PROMPT = """\
You are 'DineBot', a warm and efficient AI ordering assistant for a Restaurant POS system.
{persona_line}

{cart_context}
{menu_context}
{page_context}

═══════════════════════════════════════════
🧠 CORE RULES (ALWAYS FOLLOW)
═══════════════════════════════════════════
1. USE TOOLS: If the user asks to see the menu, you MUST call the `get_menu` tool. DO NOT hallucinate items from memory.
2. BE PROACTIVE: If the user says "I want 3 hotdog burgers", add 3 immediately — no confirmation needed.
3. AUTO-RESOLVE TYPOS: Use fuzzy matching silently. Never say "I couldn't find that" for obvious typos.
3. BATCH ACTIONS: Add multiple items in one single `add_to_cart` call using the `items` array.
4. TRUST REAL-TIME CONTEXT: Always report from the REAL-TIME CART STATE above, never from memory.
5. NEVER output raw JSON. Always use your tools natively.
6. ALWAYS EXECUTE TOOLS: If you say you are adding an item or registering a customer, you MUST execute the corresponding tool. Do NOT just say you did it conversationally without using the tool!
7. NEVER expose technical errors. Handle failures gracefully and conversationally.
8. PAGE AWARENESS: Use the CURRENT PAGE context to give relevant, page-specific help.
9. NEVER PASTE RAW CONTEXT BLOCKS: The REAL-TIME CART STATE and AVAILABLE MENU ITEMS blocks are for YOUR internal use only. Summarize naturally when asked.
10. SCOPE: You ONLY handle ordering, customer registration, and sales reports. You do NOT manage the kitchen, active orders, admin settings, or any backend configuration.

═══════════════════════════════════════════
🍽️ ORDERING WORKFLOWS (STRICT FLOWS)
═══════════════════════════════════════════

👀 CLARIFY ORDER TYPE FIRST: When a user asks to start a new order without specifying type,
   ALWAYS ask: "Is this for Dine In, Take Away, or Delivery?" and append |ACTIONS:Dine In,Take Away,Delivery|
   SKIP THIS if the user already said the type.

🪡 DINE IN (table service):
   i.   Ask which table number (if not given).
   ii.  Ask how many guests/chairs (if not given). NEVER guess.
   iii. Only when BOTH table AND chairs are known: call `set_table_booking` ONCE.
        Do NOT also call `navigate_ui` — set_table_booking already navigates.
   iv.  Confirm: "Table [N] booked for [X] guests! What would you like to order?"
   v.   Add items → save_order to send to kitchen OR place_order for checkout.

🧳 TAKE AWAY (walkaway):
   i.   Call `navigate_ui` with path='/frontpage' and orderType='Take Away'.
   ii.  Immediately ask what they'd like to order.
   iii. Add items → save_order OR place_order.

📖 SHOW MENU: When user asks to "Show Menu" or see what's available:
   - ALWAYS call the `get_menu` tool immediately. NEVER hallucinate menu items.

🚵 DELIVERY:
   i.   Call `navigate_ui` with path='/frontpage' and orderType='Online Delivery'.
   ii.  Optionally ask for customer name/phone to attach to order (use get_customer or add_customer).
   iii. Add items → save_order OR place_order.

💾 SAVE ORDER: When user says 'save', 'send to kitchen', 'done':
   Call `save_order`. Staff STAYS on the current page — do NOT navigate away.
   Reply with EXACTLY ONE short line like: "✅ Order saved and sent to the kitchen!"

💳 CHECKOUT: When user says 'checkout', 'pay', 'place order':
   Call `place_order` to open the payment screen.

👤 ADD CUSTOMER (guided):
   - If the user says "Add Customer", ask for their full name and phone number.
   - Example: "Please provide the customer's full name and phone number."
   - If they provide them separately, remember the previous details from the chat history.
   - DO NOT call `add_customer` until you have BOTH the name and phone number. Once you have both, you MUST EXECUTE the `add_customer` tool. Do not just reply conversationally that it was added; actually call the tool!

═══════════════════════════════════════════
📈 SALES REPORTS (only on /sales-reports page):
═══════════════════════════════════════════
Use `get_sales_summary` for a quick total. Use `get_detailed_sales` for breakdowns by period or order type.

═══════════════════════════════════════════
💬 COMMUNICATION STYLE
═══════════════════════════════════════════
- Warm, concise, natural. One short sentence per action.
- NEVER repeat the same confirmation twice in one reply.
- NEVER list the full cart unless the user explicitly asks.
- If the cart is empty, you MUST end with exactly: |ACTIONS:Show Menu|
- If the cart has items, you MUST end with exactly: |ACTIONS:Show Menu,Add New Items,Add Customer,Save,Checkout|
- Suggest items from the REAL-TIME MENU CONTEXT when asked for recommendations.
"""

# ─────────────────────────────────────────────
# SAFETY NET — strip raw context-block leaks from replies
# ─────────────────────────────────────────────
# FIX: prompt instructions (Rule 8) tell the model not to paste the raw
# REAL-TIME CART STATE / table-booking summary back verbatim, but small local
# models don't reliably follow that — especially once a leaked example is
# already sitting in the session's chat history, reinforcing the bad pattern.
# This regex-based scrubber removes the leak pattern from the FINAL reply
# regardless of what the model does, and before it's ever saved to history,
# so it can't poison future turns in the same session either.
_LEAK_PATTERN = re.compile(
    r"Table:\s*\S+\s*\n?"
    r"Chairs:\s*\S+\s*\n?"
    r"Items:\s*\n?"
    r"(?:\s*-\s*.+\n?)+"
    r"\s*Total:\s*₹\S+",
    re.IGNORECASE
)


def sanitize_reply(text):
    if not text:
        return text
    cleaned = _LEAK_PATTERN.sub(
        "your order details", text
    ).strip()
    # Collapse any resulting double blank lines/whitespace left behind
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
    return cleaned if cleaned else text


# ─────────────────────────────────────────────
# CHATBOT ROUTE
# ─────────────────────────────────────────────
@chatbot_bp.route('/message', methods=['POST'])
@limiter.limit("20 per minute;200 per hour")   # real decorator — enforced per-IP by Flask-Limiter
def handle_message():

    # ── Input validation ─────────────────────────────────────────────────────
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"reply": "Invalid request body"}), 400

    # ── Auth — role is NEVER taken from the body ─────────────────────────────
    role, verified_user_id, is_verified = get_verified_role(request, data)
    is_admin = is_verified and ('admin' in role.lower() or 'manager' in role.lower())

    user_msg   = str(data.get('message', ''))[:MAX_MSG_LEN]
    session_id = str(data.get('sessionId',  'default_session'))
    user_id    = verified_user_id if verified_user_id != 'guest' else str(data.get('userId', 'guest'))
    cart_items = data.get('cart',      [])
    order_type = data.get('orderType', 'Dine In')
    menu_items = data.get('menu',      [])

    # ── Current page context (sent by ChatbotModal.jsx via postMessage → script.js → here)
    current_page  = str(data.get('current_page', '')).strip()
    page_label    = str(data.get('page_label',   '')).strip()
    if not page_label and current_page:
        # Fallback: humanise the raw path
        page_label = current_page.replace('/', ' ').replace('-', ' ').strip().title() or 'Unknown'
    elif not page_label:
        page_label = 'Unknown'

    # Build a concise context string injected into the system prompt
    page_context_text = (
        f"[CURRENT PAGE: The user is currently on the '{page_label}' page ({current_page}). "
        "Use this to give relevant, page-specific help without asking where they are. "
        "If asked to help with the current page, use this info directly.]"
    ) if current_page else ""

    # auth_context forwarded to downstream tool calls
    # The token here comes from the body only for DOWNSTREAM calls;
    # role-gating is already done above from the verified JWT — so a spoofed token
    # in the body only affects the downstream API call, which will reject it on its own.
    auth_context = {
        'activeCompany': data.get('activeCompany', ''),
        'activeBranch':  data.get('activeBranch',  ''),
        'token':         data.get('token', ''),
    }

    logger.debug(f"Request: user={user_id} role={role} verified={is_verified} cart={len(cart_items)} msg_len={len(user_msg)}")

    # ── Tool allowlist ────────────────────────────────────────────────────────
    # Ordering-focused tools available to all authenticated users on POS pages
    allowed_tool_names = [
        "navigate_ui", "add_to_cart", "remove_from_cart", "clear_cart",
        "view_cart", "place_order", "save_order", "get_menu",
        "get_table_status", "set_table_booking", "get_customer", "add_customer",
    ]

    # Sales tools: only unlocked when the user is on the sales-reports page
    if current_page in ('/sales-reports', '/sales-kanban'):
        allowed_tool_names.extend(["get_sales_summary", "get_detailed_sales"])

    filtered_tool_schemas = [
        s for s in TOOL_SCHEMAS if s["function"]["name"] in allowed_tool_names
    ]

    # ── Context strings ───────────────────────────────────────────────────────
    cart_text  = "Empty"
    cart_total = 0
    if cart_items:
        cart_text  = ", ".join(
            f"{i.get('quantity',1)}x {i.get('name','?')} (₹{i.get('price',0)})"
            for i in cart_items
        )
        cart_total = sum(i.get('price', 0) * i.get('quantity', 1) for i in cart_items)

    cart_context = (
        f"[REAL-TIME CART STATE (internal use only — do not paste this block back to the user): "
        f"{len(cart_items)} item(s) in cart: {cart_text}. "
        f"Order Type: {order_type}. Subtotal: ₹{cart_total}. "
        "This is the cart BEFORE this message. "
        "If the user wants to ADD items, you MUST call add_to_cart — even if the cart looks empty. "
        "If the user asks what's in their cart, summarize it in one natural sentence — do not reprint this block verbatim.]"
    )

    menu_context = ""
    if menu_items:
        menu_text    = ", ".join(f"{i.get('name','?')} (₹{i.get('price',0)})" for i in menu_items)
        menu_context = (
            f"\n[AVAILABLE MENU ITEMS (internal use only): {menu_text}]\n"
            "CRITICAL: If a generic term matches multiple items, ask the user to clarify before calling add_to_cart."
        )

    persona_line = (
        f"You are helping a restaurant staff member process orders. Role: '{role}'."
    )

    # FIX (bug #1): page_context kwarg was previously missing from .format(),
    # which caused every request to raise KeyError('page_context') and 500.
    dynamic_system_prompt = BASE_PROMPT.format(
        persona_line=persona_line,
        cart_context=cart_context,
        menu_context=menu_context,
        page_context=page_context_text,
    )

    # ── History + LLM loop ───────────────────────────────────────────────────
    messages = get_history(session_id)
    messages.insert(0, {"role": "system", "content": dynamic_system_prompt})

    user_msg_obj = {"role": "user", "content": user_msg}
    messages.append(user_msg_obj)
    save_message(session_id, user_id, user_msg_obj)

    accumulated_actions = []
    iterations = 0

    # ── Fast path for "Show Menu" ────────────────────────────────────────────
    # Bypasses the LLM entirely for instant rendering of the menu cards.
    if user_msg.strip().lower() in ("show menu", "show me the menu", "menu", "what's on the menu", "show me the full menu"):
        from tools import get_menu
        # Execute the tool manually
        get_menu({}, accumulated_actions, auth_context)
        # Create a dummy bot reply
        reply_msg = {"role": "assistant", "content": "Here is our menu!"}
        messages.append(reply_msg)
        save_message(session_id, user_id, reply_msg)
        return jsonify({"reply": "Here is our menu!", "actions": accumulated_actions})

    try:
        while iterations < MAX_ITERATIONS:
            iterations += 1

            response = requests.post(
                OLLAMA_CHAT_URL,
                json={"model": LLM_MODEL, "messages": messages, "tools": filtered_tool_schemas, "stream": False},
                timeout=60,
            )
            if response.status_code != 200:
                logger.error(f"Ollama {response.status_code}: {response.text[:200]}")
                return jsonify({"reply": f"LLM error ({response.status_code})"}), 500

            response_msg = response.json().get('message', {})
            content_str  = response_msg.get("content", "").strip()
            tool_calls   = response_msg.get("tool_calls", [])

            # Hallucinated JSON fallback
            if not tool_calls and content_str.startswith('{') and content_str.endswith('}'):
                try:
                    parsed = json.loads(content_str)
                    if "name" in parsed:
                        tool_calls = [{"function": {"name": parsed["name"], "arguments": parsed.get("parameters", {})}}]
                        response_msg["content"] = ""
                except json.JSONDecodeError:
                    pass

            logger.debug(f"[iter {iterations}] tool_calls={[tc.get('function',{}).get('name') for tc in tool_calls]}")

            messages.append(response_msg)
            save_message(session_id, user_id, response_msg)

            if tool_calls:
                for tc in tool_calls:
                    tool_name = tc.get("function", {}).get("name", "unknown")

                    # Double-check: enforce allowlist even if LLM ignores schema filtering
                    if tool_name not in allowed_tool_names:
                        tool_result = (
                            f"Security: role '{role}' is not authorised to call '{tool_name}'. "
                            "Please tell the user they don't have permission."
                        )
                        logger.warning(f"Blocked unauthorized tool '{tool_name}' for user {user_id} (role={role})")
                    else:
                        tool_result = execute_tool(tc, accumulated_actions, menu_items, auth_context)

                    tool_msg = {"role": "tool", "content": tool_result, "name": tool_name}
                    logger.debug(f"[iter {iterations}] {tool_name} → {tool_result[:120]}")
                    messages.append(tool_msg)
                    save_message(session_id, user_id, tool_msg)
                continue

            # No tool calls → final reply
            final_reply = sanitize_reply(response_msg.get('content', ''))
            if final_reply != response_msg.get('content', ''):
                logger.warning(f"Scrubbed a leaked context block from reply (session={session_id})")
                # Overwrite what was already saved to history for this turn so the
                # leak can't be picked up as a few-shot pattern on the next message.
                response_msg['content'] = final_reply
                save_message(session_id, user_id, response_msg)
            return jsonify({"reply": final_reply, "actions": accumulated_actions})

        return jsonify({
            "reply": "I couldn't complete that — it required too many steps. Please try a simpler request.",
            "actions": accumulated_actions,
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection error: {e}")
        return jsonify({"reply": "Could not reach the local AI. Is Ollama running?"}), 500
    except Exception as e:
        logger.exception(f"Internal error: {e}")
        return jsonify({"reply": "Something went wrong internally. Please try again."}), 500
