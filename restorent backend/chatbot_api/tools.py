import json
import logging
import os
import difflib
import requests as http_requests
from datetime import datetime, timedelta

logger = logging.getLogger('chatbot_api.tools')

# ─────────────────────────────────────────────
# BACKEND CONFIG
# ─────────────────────────────────────────────
# FIX (bug #3 / #4): all tools now talk to the main POS backend over HTTP instead of
# opening restaurant.db directly. Direct DB access bypassed app1.py's multi-tenant
# scoping (get_data_scope_filter / inject_tenant_context), which meant get_menu leaked
# every tenant's items into one list and add_menu_item wrote orphaned, tenant-less rows.
# Routing everything through the backend API also removes the unlocked second SQLite
# writer that could race with app1.py's own _db_lock under concurrent load.
BACKEND_URL = os.environ.get('POS_BACKEND_URL', 'http://127.0.0.1:6034')


def _build_headers(auth_context):
    headers = {'Content-Type': 'application/json'}
    if not auth_context:
        return headers
    if auth_context.get('token'):
        headers['Authorization'] = 'Bearer ' + auth_context['token']
    if auth_context.get('activeCompany'):
        headers['X-Company-Name'] = auth_context['activeCompany']
    if auth_context.get('activeBranch'):
        headers['X-Branch-Name'] = auth_context['activeBranch']
    return headers


# ─────────────────────────────────────────────
# 1. TOOL SCHEMAS  (sent to Ollama every call)
# ─────────────────────────────────────────────
TOOL_SCHEMAS = [
    # ── Navigation ──────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "navigate_ui",
            "description": (
                "Navigate the user to a specific page or set their order type. "
                "Use when the user asks to start an order, dine in, take away, "
                "view the menu, or go to the front page."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": (
                            "URL path to navigate to. "
                            "'/frontpage' for Take Away or Online Delivery orders. "
                            "'/table' for Dine In (table selection). "
                            "'/sales-reports' for Sales Reports. "
                            "'/home' for the home/dashboard screen."
                        )
                    },
                    "orderType": {
                        "type": "string",
                        "description": "Order type: 'Take Away', 'Dine In', or 'Online Delivery'."
                    }
                },
                "required": ["path", "orderType"]
            }
        }
    },

    # ── Cart ────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": (
                "Add one or more specific menu items to the user's cart. "
                "Use when the user asks to order or add food items."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "description": "List of food items to add to the cart.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "item_name": {
                                    "type": "string",
                                    "description": "Name of the food item. E.g., 'hotdog burger'."
                                },
                                "quantity": {
                                    "type": "integer",
                                    "description": "Number of items to add. Defaults to 1."
                                }
                            },
                            "required": ["item_name"]
                        }
                    }
                },
                "required": ["items"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "remove_from_cart",
            "description": "Remove a specific item from the cart.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_name": {
                        "type": "string",
                        "description": "The name of the item to remove."
                    }
                },
                "required": ["item_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "clear_cart",
            "description": "Remove all items from the cart. Use when user says 'clear cart' or 'start over'.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "view_cart",
            "description": "Show the current items in the user's cart. This asks the UI to open the cart panel.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },

    # ── Orders ───────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "place_order",
            "description": (
                "Trigger the checkout/payment screen for the current cart. "
                "Use when the user says 'place order', 'confirm', 'checkout', 'pay', or 'proceed'."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_order",
            "description": (
                "Save the current order to Active Orders and send it to the kitchen without opening checkout. "
                "Use when the user wants to 'save' the order, or when they are done ordering but not ready to pay yet."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "Check the status of all active orders.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },

    # ── Menu ─────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_menu",
            "description": (
                "Fetch and display menu items. Can filter by category. "
                "Use when user asks 'what's on the menu', 'show me burgers', etc."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filter by category. Leave empty for full menu."
                    }
                },
                "required": []
            }
        }
    },

    # ── Customers ────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_customer",
            "description": "Look up a customer by name or phone number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Customer name or phone number to search."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_customer",
            "description": "Add a new customer to the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Customer's full name."
                    },
                    "phone": {
                        "type": "string",
                        "description": "Customer's phone number."
                    },
                    "email": {
                        "type": "string",
                        "description": "Customer's email address."
                    }
                },
                "required": ["name", "phone"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_table_booking",
            "description": "Set the table number and chairs for the current Dine-In order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_number": {
                        "type": "string",
                        "description": "The table number to book (e.g., '10', 'T-10')."
                    },
                    "chairs": {
                        "type": "integer",
                        "description": "Number of chairs to book at the table."
                    }
                },
                "required": ["table_number", "chairs"]
            }
        }
    },

    # ── Table management ─────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_table_status",
            "description": "Check which tables are free, occupied, or reserved.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_table",
            "description": "ADMIN ONLY: Configure a newly built physical table in the restaurant database. DO NOT use this for customer bookings or orders.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_number": {
                        "type": "string",
                        "description": "The table number or identifier (e.g., '10', 'T-10')."
                    },
                    "chairs": {
                        "type": "integer",
                        "description": "Number of chairs at the table. Defaults to 4."
                    }
                },
                "required": ["table_number"]
            }
        }
    },

    # ── Admin & Reporting ─────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_menu_item",
            "description": "Add a new food item to the menu database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_name": {
                        "type": "string",
                        "description": "Name of the new menu item."
                    },
                    "price": {
                        "type": "number",
                        "description": "Price of the menu item."
                    },
                    "category": {
                        "type": "string",
                        "description": "Menu category (e.g., 'Burgers', 'Drinks')."
                    }
                },
                "required": ["item_name", "price"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_sales_summary",
            "description": "Get the total sales count and revenue for today.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },

    # ── Kitchen ──────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_kitchen_status",
            "description": (
                "STAFF/ADMIN: Get the live kitchen queue - pending, in-progress, and ready items. "
                "Use when asked about kitchen orders, what is cooking, or what is ready."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "kitchen": {
                        "type": "string",
                        "description": "Optional: filter by kitchen name. Leave empty for all kitchens."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mark_order_done",
            "description": "ADMIN/MANAGER: Mark an active order as Ready, Picked Up, or Cancelled.",
            "parameters": {
                "type": "object",
                "properties": {
                    "invoice_no": {
                        "type": "string",
                        "description": "The invoice number or token to update."
                    },
                    "status": {
                        "type": "string",
                        "description": "New status: 'Ready', 'Picked Up', or 'Cancelled'."
                    }
                },
                "required": ["invoice_no", "status"]
            }
        }
    },

    # ── Detailed Sales ───────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_detailed_sales",
            "description": (
                "ADMIN/MANAGER: Get a detailed sales breakdown with period (today/week/month) "
                "and optional order type filtering. Use when asked for sales stats, revenue, or reports."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "'today', 'week', or 'month'. Defaults to 'today'."
                    },
                    "order_type": {
                        "type": "string",
                        "description": "Optional: 'Dine In', 'Take Away', or 'Online Delivery'."
                    }
                },
                "required": []
            }
        }
    }
]


# ─────────────────────────────────────────────
# 2. TOOL HANDLER FUNCTIONS
# ─────────────────────────────────────────────

def navigate_ui(arguments, accumulated_actions):
    path = arguments.get("path", "/frontpage")
    if path == "/sales":
        path = "/salespage"
    elif path == "/orders":
        path = "/active-orders"
    elif path == "/menu" or path == "/cart":
        path = "/frontpage"
    order_type = arguments.get("orderType", "Take Away")
    accumulated_actions.append({
        "type": "NAVIGATE",
        "path": path,
        "orderType": order_type
    })
    return f"Navigated to {path} with order type '{order_type}'."


def add_to_cart(arguments, accumulated_actions, menu_items=None):
    items_to_add = arguments.get("items", [])

    if isinstance(items_to_add, str):
        try:
            items_to_add = json.loads(items_to_add)
        except json.JSONDecodeError:
            items_to_add = []

    # Fallback if LLM used old schema
    if not items_to_add and "item_name" in arguments:
        items_to_add = [{"item_name": arguments.get("item_name"), "quantity": arguments.get("quantity", 1)}]

    if not items_to_add:
        return "Error: No items provided to add to cart."

    responses = []

    for item_obj in items_to_add:
        item_name = item_obj.get("item_name", "")
        try:
            quantity = int(item_obj.get("quantity", 1))
        except (ValueError, TypeError):
            quantity = 1

        # 1. Validate against Live Menu
        real_price = None
        if menu_items is not None and len(menu_items) > 0:
            found_item = None

            # Try strict name match first (case-insensitive)
            for it in menu_items:
                it_name = it.get("name", "").lower().strip()
                req_name = item_name.lower().strip()
                if it_name == req_name or it_name in req_name or req_name in it_name:
                    found_item = it
                    break

            # If no strict match, try fuzzy matching to handle typos
            if not found_item:
                item_names_list = [it.get("name", "") for it in menu_items if it.get("name")]
                fuzzy_matches = difflib.get_close_matches(
                    item_name.lower().strip(),
                    [n.lower() for n in item_names_list],
                    n=1,
                    cutoff=0.85  # Strict cutoff to prevent guessing items not in the system
                )
                if fuzzy_matches:
                    matched_lower = fuzzy_matches[0]
                    found_item = next((it for it in menu_items if it.get("name", "").lower() == matched_lower), None)
                    if found_item:
                        logger.debug(f"Fuzzy matched '{item_name}' -> '{found_item.get('name')}'")

            if not found_item:
                # Return an error to the LLM so it asks the user for clarification!
                available_names = ", ".join([it.get("name", "Unknown") for it in menu_items])
                responses.append(
                    f"Error: '{item_name}' does not exactly match any available menu items. "
                    f"The available items are: {available_names}. "
                    "Please ask the user to clarify which specific item they meant."
                )
                continue

            real_price = found_item.get("price")
            # Ensure we use the exactly matched name
            item_name = found_item.get("name", item_name)

        accumulated_actions.append({
            "type": "ADD_TO_CART",
            "item": item_name,
            "quantity": quantity
        })

        price_info = f" (Price: ₹{real_price})" if real_price is not None else ""
        responses.append(
            f"Requested UI to add {quantity}x '{item_name}'{price_info} to the cart. "
            "IMPORTANT: You MUST end your response exactly with |ACTIONS:Yes,Save,Checkout|"
        )

    return "\n".join(responses)


def remove_from_cart(arguments, accumulated_actions):
    item_name = arguments.get("item_name", "")
    accumulated_actions.append({
        "type": "REMOVE_FROM_CART",
        "item": item_name
    })
    return f"Requested UI to remove '{item_name}' from the cart."


def clear_cart(arguments, accumulated_actions):
    accumulated_actions.append({"type": "CLEAR_CART"})
    return "Requested UI to clear the cart."


def view_cart(arguments, accumulated_actions):
    accumulated_actions.append({"type": "VIEW_CART"})
    return "I've opened the cart panel for you."


def place_order(arguments, accumulated_actions):
    accumulated_actions.append({"type": "PLACE_ORDER"})
    return "I've opened the checkout screen. Please review your order."


def save_order(arguments, accumulated_actions):
    accumulated_actions.append({"type": "ACTION_SAVE"})
    # NOTE: Do NOT navigate away after saving — staff stays on the ordering
    # page so they can immediately take the next order.
    return "Order saved and sent to the kitchen successfully! Ready to take the next order."


def get_order_status(arguments, accumulated_actions, auth_context=None):
    """Fetch live active orders from the main backend.

    FIX (bug #2): app1.py's active_orders documents use the field name `status`
    (see save_active_order / update_active_order in app1.py), not `order_status`.
    Reading the wrong key meant this always fell back to 'Pending' regardless of
    the real order state. Also fixed `orderType` (was `order_type`) and
    `grand_total` (was `net_total`, which doesn't exist on these documents).
    """
    filter_status = arguments.get("filter_status", "").lower().strip()
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/activeorders', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching active orders (status " + str(res.status_code) + ")."
        orders = res.json()
        if not isinstance(orders, list):
            orders = []
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not orders:
        return "No active orders right now."

    if filter_status:
        orders = [o for o in orders if filter_status in (o.get('status') or '').lower()]
    if not orders:
        return "No active orders with status '" + filter_status + "'."

    lines = []
    for o in orders[:20]:
        inv    = o.get('orderNo') or o.get('orderId') or 'Unknown'
        cust   = o.get('customerName') or 'Guest'
        status = o.get('status') or 'Pending'
        total  = o.get('grand_total') or o.get('total') or 0
        otype  = o.get('orderType') or ''
        lines.append("  [" + str(inv) + "] " + str(cust) + " - " + str(otype) + " - " + str(status) + " - Rs." + str(total))

    return "Active orders (" + str(len(orders)) + " total):\n" + "\n".join(lines)


def get_kitchen_status(arguments, accumulated_actions, auth_context=None):
    """Fetch live kitchen queue from active orders.

    FIX (bug #2): item-level kitchen prep status in app1.py lives in each
    cart item's `kitchenStatuses` dict (values: 'Pending' / 'Prepared' / 'PickedUp'),
    not on the order's top-level `order_status`. Rewritten to read that structure
    so pending/in-progress/ready buckets reflect real kitchen state.
    """
    kitchen_filter = arguments.get("kitchen", "").strip().lower()
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/activeorders', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching kitchen orders (status " + str(res.status_code) + ")."
        orders = res.json()
        if not isinstance(orders, list):
            orders = []
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not orders:
        return "No active kitchen orders right now. The kitchen is clear!"

    pending, in_progress, ready = [], [], []
    for order in orders:
        inv   = order.get('orderNo') or order.get('orderId') or 'Unknown'
        items = order.get('cartItems') or []
        otype = order.get('orderType') or ''

        for item in items:
            iname   = item.get('name') or 'Unknown'
            qty     = item.get('quantity') or 1
            kitchen_statuses = item.get('kitchenStatuses') or {}

            for kitchen_name, k_status in kitchen_statuses.items():
                if kitchen_filter and kitchen_filter not in kitchen_name.lower():
                    continue
                entry = "  [" + str(inv) + "] " + str(otype) + ": " + str(qty) + "x " + str(iname) + " (" + str(kitchen_name) + ")"
                k_status_l = (k_status or '').lower()
                if k_status_l == 'pickedup' or k_status_l == 'prepared':
                    ready.append(entry) if k_status_l == 'pickedup' else in_progress.append(entry)
                else:
                    pending.append(entry)

    parts = []
    if pending:     parts.append("PENDING (" + str(len(pending)) + "):\n" + "\n".join(pending))
    if in_progress: parts.append("PREPARED / IN PROGRESS (" + str(len(in_progress)) + "):\n" + "\n".join(in_progress))
    if ready:       parts.append("PICKED UP (" + str(len(ready)) + "):\n" + "\n".join(ready))

    if not parts:
        lbl = " for '" + kitchen_filter + "'" if kitchen_filter else ""
        return "No kitchen orders found" + lbl + "."

    kitchen_label = " (" + kitchen_filter.title() + ")" if kitchen_filter else ""
    return "Kitchen Queue" + kitchen_label + ":\n\n" + "\n\n".join(parts)


def mark_order_done(arguments, accumulated_actions, auth_context=None):
    """Update order status via the main backend.

    FIX (bug #2): app1.py's active_orders schema has no generic `order_status`
    field to PUT — status is either the order-level `status` key or per-item
    `kitchenStatuses`. This now updates the order-level `status` field, which
    is what /api/activeorders PUT (update_active_order) actually reads/merges.
    Also matches lookup on `orderNo`/`orderId` (real keys), not `token_no`.
    """
    invoice_no = str(arguments.get("invoice_no", "")).strip()
    status     = str(arguments.get("status", "Ready")).strip()
    valid      = ["Ready", "Picked Up", "Cancelled"]

    if status not in valid:
        return "Invalid status '" + status + "'. Use one of: " + ", ".join(valid) + "."
    if not invoice_no:
        return "Error: invoice_no is required."

    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/activeorders', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching orders (status " + str(res.status_code) + ")."
        orders = res.json() if isinstance(res.json(), list) else []

        target = next(
            (o for o in orders if
             str(o.get('orderNo') or '').lower() == invoice_no.lower() or
             str(o.get('orderId') or '').lower() == invoice_no.lower()),
            None
        )
        if not target:
            ids = [o.get('orderNo') or o.get('orderId') for o in orders[:10]]
            return "Order '" + invoice_no + "' not found. Available: " + ", ".join(str(x) for x in ids)

        order_id = target.get('orderId')
        if not order_id:
            return "Error: Could not determine order ID."

        upd = http_requests.put(
            BACKEND_URL + '/api/activeorders/' + str(order_id),
            headers=headers,
            json={"status": status},
            timeout=8
        )
        if upd.status_code in (200, 201):
            accumulated_actions.append({"type": "REFRESH_ORDERS"})
            return "Order [" + invoice_no + "] marked as '" + status + "' successfully."
        else:
            detail = {}
            try:
                detail = upd.json()
            except Exception:
                pass
            msg = detail.get('error') or detail.get('message') or upd.text[:200]
            return "Failed to update order (status " + str(upd.status_code) + "): " + str(msg)
    except Exception as e:
        return "Error updating order: " + str(e)


def get_menu(arguments, accumulated_actions, auth_context=None):
    """Fetch menu items via the main backend's tenant-scoped /api/items.

    FIX (bug #3): previously read `restaurant.db` directly with no company/branch/
    tenant filter at all, which mixed every tenant's items into one list — a
    cross-tenant data leak. Now routes through the backend API, which applies
    get_data_scope_filter() and returns only items the caller's tenant/company/
    branch context is authorized to see.
    """
    category = arguments.get("category", "").lower().strip()
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/items', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching menu (status " + str(res.status_code) + ")."
        items = res.json()
        if not isinstance(items, list):
            items = []
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not items:
        return "The menu is currently empty."

    filtered = (
        [m for m in items if category in (m.get("item_group", "") or "").lower()]
        if category else items
    )
    if not filtered:
        return "No items found in '" + category + "'."

    grouped = {}
    for item in filtered:
        cat = item.get("item_group") or "Uncategorized"
        grouped.setdefault(cat, []).append(item)

    lines = []
    for cat, cat_items in grouped.items():
        lines.append("\nCategory: " + cat.upper())
        for i in cat_items:
            price = i.get('price_list_rate', i.get('standard_rate', 0))
            lines.append("  - " + str(i.get('item_name', '?')) + " Rs." + str(price))

    accumulated_actions.append({"type": "SHOW_MENU", "count": len(filtered), "items": filtered})
    return "Menu:\n" + "\n".join(lines)


def get_customer(arguments, accumulated_actions, auth_context=None):
    """Search customers from the live backend."""
    query = arguments.get("query", "").strip()
    if not query:
        return "Please provide a name or phone number to search."
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(
            BACKEND_URL + '/api/customers',
            headers=headers,
            params={"search": query},
            timeout=8
        )
        if res.status_code != 200:
            return "Error fetching customers (status " + str(res.status_code) + ")."
        data = res.json()
        customers = data if isinstance(data, list) else data.get('customers', data.get('data', []))
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not customers:
        return "No customer found matching '" + query + "'."

    q_lower = query.lower()
    results = [
        c for c in customers
        if q_lower in (c.get('customer_name') or '').lower()
        or q_lower in (c.get('mobile_no') or '')
        or q_lower in (c.get('email_id') or '').lower()
    ] or customers[:5]

    lines = [
        "  - " + str(c.get('customer_name', '?')) + " | " + str(c.get('mobile_no', '-')) + " | " + str(c.get('email_id', '-'))
        for c in results[:10]
    ]
    accumulated_actions.append({"type": "SHOW_CUSTOMERS", "count": len(results)})
    return "Found " + str(len(results)) + " customer(s):\n" + "\n".join(lines)


def get_table_status(arguments, accumulated_actions, auth_context=None):
    """Fetch live table status from the main backend."""
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/tables', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching tables (status " + str(res.status_code) + ")."
        data = res.json()
        # /api/tables returns {"message": [...]} per app1.py's get_tables()
        tables = data.get('message', data) if isinstance(data, dict) else data
        if not isinstance(tables, list):
            tables = []
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not tables:
        return "No tables configured in the database."

    free, occupied, unavail = [], [], []
    for t in tables:
        tno    = t.get('table_number') or '?'
        chairs = t.get('chairs') or []
        if isinstance(chairs, list):
            avail = sum(1 for c in chairs if c.get('status') == 'Available')
            total = len(chairs)
        else:
            avail = total = 0
        active = t.get('is_active', True)

        if not active:
            unavail.append("  Table " + str(tno) + ": Unavailable")
        elif avail == total and total > 0:
            free.append("  Table " + str(tno) + ": Free (" + str(total) + " chairs)")
        elif avail == 0 and total > 0:
            occupied.append("  Table " + str(tno) + ": Fully Occupied (" + str(total) + " chairs)")
        else:
            occupied.append("  Table " + str(tno) + ": Partial (" + str(avail) + "/" + str(total) + " chairs free)")

    parts = []
    if free:     parts.append("FREE:\n"        + "\n".join(free))
    if occupied: parts.append("OCCUPIED:\n"    + "\n".join(occupied))
    if unavail:  parts.append("UNAVAILABLE:\n" + "\n".join(unavail))

    accumulated_actions.append({"type": "SHOW_TABLES", "count": len(tables)})
    return "Table Status (" + str(len(tables)) + " tables):\n\n" + "\n\n".join(parts)


def set_table_booking(arguments, accumulated_actions, auth_context=None):
    table_number = str(arguments.get("table_number", ""))
    try:
        chairs = int(arguments.get("chairs", 1))
    except Exception:
        chairs = 1

    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/tables', headers=headers, timeout=8)
        data = res.json() if res.status_code == 200 else []
        tables = data.get('message', data) if isinstance(data, dict) else data
        if not isinstance(tables, list):
            tables = []
    except Exception:
        tables = []

    if not tables:
        accumulated_actions.append({"type": "SET_TABLE", "tableNumber": table_number, "chairs": chairs})
        accumulated_actions.append({"type": "SET_ORDER_TYPE", "orderType": "Dine In"})
        return "Booked table " + table_number + " with " + str(chairs) + " chairs."

    clean_req = table_number.lower().replace('table ', '').strip()
    target = next(
        (t for t in tables if str(t.get("table_number", "")).lower().strip() == clean_req),
        None
    )

    logger.debug("set_table_booking: requested=" + table_number + " clean=" + clean_req + " tables=" + str(len(tables)))
    if not target:
        avail = [str(t.get("table_number")) for t in tables if t.get("is_active", True)]
        return ("Error: Table " + table_number + " does not exist. Available: " +
                ", ".join(avail) + ". Advise user to select one of these.")

    chair_list = target.get("chairs", [])
    if isinstance(chair_list, list):
        avail_chairs = [c for c in chair_list if c.get("status") == "Available"]
        if len(avail_chairs) < chairs:
            return ("Error: Table " + table_number + " only has " + str(len(avail_chairs)) +
                    " available chairs, " + str(chairs) + " requested.")

    accumulated_actions.append({"type": "SET_TABLE", "tableNumber": table_number, "chairs": chairs})
    accumulated_actions.append({"type": "SET_ORDER_TYPE", "orderType": "Dine In"})
    return "Booked table " + table_number + " with " + str(chairs) + " chairs for the current order."


def add_customer(arguments, accumulated_actions, auth_context=None):
    """Add a customer via the real backend API."""
    name   = arguments.get("name", "").strip()
    mobile = arguments.get("phone", "").strip()
    email  = arguments.get("email", "").strip()

    if not name or not mobile:
        return "Error: Both customer name and phone number are required."

    payload = {
        "customer_name": name,
        "mobile_no":     mobile,
        "email_id":      email,
        "company_names": ["All Companies"],
        "branch_names":  ["All Branches"],
    }
    if auth_context:
        if auth_context.get('activeCompany'):
            payload["company_names"] = [auth_context['activeCompany']]
        if auth_context.get('activeBranch') and auth_context['activeBranch'] not in ('All Branches', 'All', ''):
            payload["branch_names"] = [auth_context['activeBranch']]

    try:
        headers = _build_headers(auth_context)
        res = http_requests.post(BACKEND_URL + '/api/customers', headers=headers, json=payload, timeout=10)
        if res.status_code in (200, 201):
            data    = res.json()
            cust_id = data.get('_id') or data.get('id') or 'unknown'
            accumulated_actions.append({"type": "CUSTOMER_ADDED", "name": name, "phone": mobile, "id": cust_id})
            # NOTE: Do NOT navigate away — staff stays on current page after adding customer.
            return "Customer " + name + " (" + mobile + ") registered successfully! ✅ ID: " + str(cust_id)
        elif res.status_code == 409:
            # Customer already exists, let's find them and attach anyway
            try:
                search_res = http_requests.get(BACKEND_URL + '/api/customers', headers=headers, params={"search": mobile}, timeout=5)
                if search_res.status_code == 200:
                    data = search_res.json()
                    customers = data if isinstance(data, list) else data.get('customers', data.get('data', []))
                    for c in customers:
                        if c.get('mobile_no') == mobile:
                            cust_id = c.get('_id') or c.get('id') or 'unknown'
                            actual_name = c.get('customer_name') or name
                            accumulated_actions.append({"type": "CUSTOMER_ADDED", "name": actual_name, "phone": mobile, "id": cust_id})
                            return "Customer already exists. Attached " + actual_name + " (" + mobile + ") to the order! ✅ ID: " + str(cust_id)
            except Exception:
                pass
            
            # Fallback if we couldn't find them
            accumulated_actions.append({"type": "CUSTOMER_ADDED", "name": name, "phone": mobile, "id": "unknown"})
            return "A customer with phone " + mobile + " already exists. Attached them to the order."
        else:
            detail = {}
            try:
                detail = res.json()
            except Exception:
                pass
            msg = detail.get('error') or detail.get('message') or res.text[:200]
            return "Failed to add customer (status " + str(res.status_code) + "): " + str(msg)
    except Exception as e:
        return "Error connecting to backend: " + str(e)


def add_table(arguments, accumulated_actions, auth_context=None):
    """Add a table via the real backend API."""
    table_number = str(arguments.get("table_number", "")).strip()
    try:
        chairs = int(arguments.get("chairs", 4))
    except Exception:
        chairs = 4
    floor = arguments.get("floor", "").strip()

    if not table_number:
        return "Error: table_number is required."

    if not auth_context or not auth_context.get('activeCompany'):
        return "Error: Cannot add table - active company context is missing. Please ensure you are logged in."

    chair_list = [{"chair_number": i + 1, "status": "Available"} for i in range(chairs)]
    payload = {
        "table_number":  table_number,
        "chairs":        chair_list,
        "number_of_chairs": chairs,
        "is_active":     True,
        "company_names": [auth_context['activeCompany']],
    }
    if floor:
        payload["floor"] = floor
    if auth_context.get('activeBranch') and auth_context['activeBranch'] not in ('All Branches', 'All', ''):
        payload["branch_names"] = [auth_context['activeBranch']]

    try:
        headers = _build_headers(auth_context)
        res = http_requests.post(BACKEND_URL + '/api/tables', headers=headers, json=payload, timeout=10)
        if res.status_code in (200, 201):
            fl = " on " + floor if floor else ""
            return "Table " + table_number + " with " + str(chairs) + " chairs" + fl + " added successfully!"
        elif res.status_code == 409:
            return "Table " + table_number + " already exists."
        else:
            detail = {}
            try:
                detail = res.json()
            except Exception:
                pass
            msg = detail.get('error') or detail.get('message') or res.text[:200]
            return "Failed to add table (status " + str(res.status_code) + "): " + str(msg)
    except Exception as e:
        return "Error connecting to backend: " + str(e)


def add_menu_item(arguments, accumulated_actions, auth_context=None):
    """Add a menu item via the main backend's tenant-scoped /api/items.

    FIX (bug #3): previously wrote a raw row straight into restaurant.db with
    no company_name/branch_name/tenant_id, producing an orphaned item invisible
    to (or leaking across) normal tenant-scoped queries. Now routes through the
    backend API so it inherits the caller's company/branch context correctly.
    """
    item_name = arguments.get("item_name", "").strip()
    price     = arguments.get("price", 0)
    category  = arguments.get("category", "Uncategorized").strip()

    if not item_name:
        return "Error: item_name is required."
    if not auth_context or not auth_context.get('activeCompany'):
        return "Error: Cannot add menu item - active company context is missing. Please ensure you are logged in."

    payload = {
        "item_name":       item_name,
        "price_list_rate": price,
        "item_group":      category,
        "is_hidden":       False,
        "company_names":   [auth_context['activeCompany']],
    }
    if auth_context.get('activeBranch') and auth_context['activeBranch'] not in ('All Branches', 'All', ''):
        payload["branch_names"] = [auth_context['activeBranch']]

    try:
        headers = _build_headers(auth_context)
        res = http_requests.post(BACKEND_URL + '/api/items', headers=headers, json=payload, timeout=10)
        if res.status_code in (200, 201):
            return "Added " + item_name + " to the menu at Rs." + str(price) + "."
        else:
            detail = {}
            try:
                detail = res.json()
            except Exception:
                pass
            msg = detail.get('error') or detail.get('message') or res.text[:200]
            return "Failed to add menu item (status " + str(res.status_code) + "): " + str(msg)
    except Exception as e:
        return "Error connecting to backend: " + str(e)


def get_sales_summary(arguments, accumulated_actions, auth_context=None):
    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/sales', headers=headers, timeout=5)
        if res.status_code == 200:
            sales = res.json()
        else:
            return "Error: Could not retrieve sales data (Status " + str(res.status_code) + ")"
    except Exception as e:
        return "Error connecting to main backend: " + str(e)

    if not sales:
        return (
            "No sales recorded yet. IMPORTANT INSTRUCTION: Simply tell the user "
            "'There are currently no sales recorded.' DO NOT generate any tables, "
            "charts, or structured reports showing $0.00."
        )

    total_revenue = sum(float(s.get("grand_total", 0)) for s in sales)
    return "Total sales: " + str(len(sales)) + " orders. Total revenue: Rs." + str(round(total_revenue, 2))


def get_detailed_sales(arguments, accumulated_actions, auth_context=None):
    """Detailed sales breakdown with period and order type filtering."""
    period     = arguments.get("period", "today").lower().strip()
    order_type = (arguments.get("order_type") or "").strip()

    try:
        headers = _build_headers(auth_context)
        res = http_requests.get(BACKEND_URL + '/api/sales', headers=headers, timeout=8)
        if res.status_code != 200:
            return "Error fetching sales (status " + str(res.status_code) + ")."
        data  = res.json()
        sales = data if isinstance(data, list) else data.get('sales', data.get('data', []))
    except Exception as e:
        return "Error connecting to backend: " + str(e)

    if not sales:
        return "No sales recorded yet."

    now = datetime.now()
    if period == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        cutoff = now - timedelta(days=7)
    elif period == "month":
        cutoff = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)

    filtered = []
    for s in sales:
        date_str = s.get('date') or s.get('created_at') or ''
        if date_str:
            try:
                sale_date = datetime.fromisoformat(date_str.split('T')[0])
                if sale_date >= cutoff:
                    filtered.append(s)
            except Exception:
                filtered.append(s)
        else:
            filtered.append(s)

    if order_type:
        filtered = [s for s in filtered if order_type.lower() in (s.get('orderType') or '').lower()]

    if not filtered:
        lbl = "for '" + period + "'" + (" / " + order_type if order_type else "")
        return "No sales found " + lbl + "."

    total_revenue = sum(float(s.get("grand_total", 0)) for s in filtered)
    count         = len(filtered)

    by_type = {}
    for s in filtered:
        ot = s.get('orderType') or 'Unknown'
        by_type.setdefault(ot, {"count": 0, "revenue": 0.0})
        by_type[ot]["count"]   += 1
        by_type[ot]["revenue"] += float(s.get("grand_total", 0))

    breakdown = [
        "  - " + ot + ": " + str(v["count"]) + " orders, Rs." + str(round(v["revenue"], 2))
        for ot, v in sorted(by_type.items(), key=lambda x: -x[1]["revenue"])
    ]

    item_counts = {}
    for s in filtered:
        items = s.get('items') or []
        for item in items:
            iname = item.get('item_name') or 'Unknown'
            qty   = item.get('quantity') or 1
            item_counts[iname] = item_counts.get(iname, 0) + int(qty)

    top_items = sorted(item_counts.items(), key=lambda x: -x[1])[:5]
    top_lines = [str(i + 1) + ". " + n + " (" + str(q) + "x)" for i, (n, q) in enumerate(top_items)]

    period_lbl = {"today": "Today", "week": "Last 7 Days", "month": "This Month"}.get(period, period.title())
    type_lbl   = " | " + order_type if order_type else ""

    result = (
        "Sales Report - " + period_lbl + type_lbl + "\n"
        "----------------------------------\n"
        "Total Orders : " + str(count) + "\n"
        "Total Revenue: Rs." + str(round(total_revenue, 2)) + "\n"
        "Avg per Order: Rs." + str(round(total_revenue / count, 2)) + "\n\n"
        "By Order Type:\n" + "\n".join(breakdown)
    )
    if top_lines:
        result += "\n\nTop Items:\n" + "\n".join(top_lines)

    return result


# ─────────────────────────────────────────────
# 4. TOOL REGISTRY + DISPATCHER
# ─────────────────────────────────────────────
TOOL_REGISTRY = {
    "navigate_ui":        navigate_ui,
    "add_to_cart":        add_to_cart,
    "remove_from_cart":   remove_from_cart,
    "clear_cart":         clear_cart,
    "view_cart":          view_cart,
    "place_order":        place_order,
    "save_order":         save_order,
    "get_order_status":   get_order_status,
    "get_kitchen_status": get_kitchen_status,
    "mark_order_done":    mark_order_done,
    "get_menu":           get_menu,
    "get_customer":       get_customer,
    "get_table_status":   get_table_status,
    "add_customer":       add_customer,
    "add_table":          add_table,
    "set_table_booking":  set_table_booking,
    "add_menu_item":      add_menu_item,
    "get_sales_summary":  get_sales_summary,
    "get_detailed_sales": get_detailed_sales,
}

# FIX (bug #3): get_menu and add_menu_item now also require auth_context
# since they route through the backend API instead of raw SQLite.
_AUTH_CONTEXT_TOOLS = {
    "get_order_status", "get_kitchen_status", "mark_order_done",
    "get_customer", "get_table_status", "add_customer", "add_table",
    "set_table_booking", "get_sales_summary", "get_detailed_sales",
    "get_menu", "add_menu_item",
}


def execute_tool(tool_call, accumulated_actions, menu_items=None, auth_context=None):
    func_name = tool_call.get("function", {}).get("name")
    args_raw  = tool_call.get("function", {}).get("arguments", "{}")

    if isinstance(args_raw, str):
        try:
            arguments = json.loads(args_raw)
        except Exception:
            arguments = {}
    else:
        arguments = args_raw

    func = TOOL_REGISTRY.get(func_name)
    if not func:
        return "Error: Tool '" + str(func_name) + "' not found."

    try:
        if func_name == "add_to_cart":
            return str(func(arguments, accumulated_actions, menu_items=menu_items))
        if func_name in _AUTH_CONTEXT_TOOLS:
            return str(func(arguments, accumulated_actions, auth_context=auth_context))
        return str(func(arguments, accumulated_actions))
    except Exception as e:
        return "Error executing '" + str(func_name) + "': " + str(e)