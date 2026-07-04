const chatForm     = document.getElementById('chat-form');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

const urlParams = new URLSearchParams(window.location.search);
const userId    = urlParams.get('userId');
const sessionId = Math.random().toString(36).substring(2, 15);

// ─── Page + tenant context — updated by postMessage from parent React app ──
let currentPagePath     = window.location.pathname || '/';
let currentPageLabel    = 'Loading...';
let lastSuggestionsPath = null;

let currentActiveCompany = '';
let currentActiveBranch  = '';
let currentAuthToken     = '';
let currentCart          = [];
let currentOrderType     = '';   // updated from PAGE_CONTEXT
let currentMenu          = [];
let currentCustomerName  = '';


// ─── Session state machine ─────────────────────────────────────────────────
// 'idle'     → no active order, show 3 order-type selector buttons
// 'ordering' → order type locked, user is adding items
let sessionState     = 'idle';
let sessionOrderType = '';   // the locked order type for the current order

// ─── Order type config ─────────────────────────────────────────────────────
const ORDER_TYPES = [
    { label: '🪑 Dine In',   type: 'Dine In',         color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
    { label: '🧳 Take Away', type: 'Take Away',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
    { label: '🛵 Delivery',  type: 'Online Delivery',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)' },
];

// ─── Per-page quick action chips (shown after navigation) ─────────────────
const PAGE_QUICK_ACTIONS = {
    '/home': [],   // home always shows the order-type selector instead
    '/frontpage': [
        { label: '📖 Show Menu',    message: 'Show me the full menu' },
        { label: '💾 Save Order',   message: 'Save the current order' },
        { label: '💳 Checkout',     message: 'I want to checkout and pay' },
        { label: '👤 Add Customer', message: 'I want to add a new customer' },
    ],
    '/table': [
        { label: '🪑 Book a Table',       message: 'Help me book a table for a Dine In order' },
        { label: '🔢 Check Availability', message: 'Which tables are currently available?' },
        { label: '📖 Show Menu',          message: 'Show me the full menu' },
    ],
    '/online_delivery': [
        { label: '📖 Show Menu',     message: 'Show me the full menu' },
        { label: '👤 Find Customer', message: 'Find a customer by name or phone' },
        { label: '👤 Add Customer',  message: 'I want to add a new customer' },
    ],
    '/sales-reports': [
        { label: "📊 Today's Sales",  message: "Show me today's sales summary" },
        { label: '📈 This Week',      message: "Show me this week's sales breakdown" },
        { label: '📅 This Month',     message: "Show me this month's sales report" },
        { label: '🏆 Top Items',      message: 'What are the top selling items today?' },
        { label: '📦 By Order Type',  message: 'Show sales breakdown by Dine In, Take Away and Delivery' },
    ],
};

// ─── Update the order type badge in the header ─────────────────────────────
function updateOrderTypeBadge() {
    const badge = document.getElementById('order-type-badge');
    if (!badge) return;
    if (sessionOrderType) {
        const cfg = ORDER_TYPES.find(o => o.type === sessionOrderType);
        badge.textContent = cfg ? cfg.label : sessionOrderType;
        badge.style.background  = cfg ? cfg.bg     : 'rgba(102,126,234,0.12)';
        badge.style.color       = cfg ? cfg.color  : '#667eea';
        badge.style.borderColor = cfg ? cfg.border : 'rgba(102,126,234,0.3)';
        badge.style.display     = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Lock in an order type and start the session ─────────────────────────
function selectOrderType(orderType) {
    sessionOrderType = orderType;
    sessionState     = 'ordering';
    currentOrderType = orderType;
    updateOrderTypeBadge();

    if (orderType === 'Dine In') {
        // Dine In uses an interactive inline form — no bot round-trip needed
        showDineInTableStep();
    } else if (orderType === 'Take Away') {
        chatInput.value  = 'I want to start a Take Away order';
        sendBtn.disabled = false;
        chatForm.dispatchEvent(new Event('submit'));
    } else {
        // Online Delivery
        chatInput.value  = 'I want to start a Delivery order';
        sendBtn.disabled = false;
        chatForm.dispatchEvent(new Event('submit'));
    }
}

// ─── Dine In step 1: table number ──────────────────────────────────────────
function showDineInTableStep() {
    const old = document.getElementById('dine-in-step');
    if (old) old.remove();

    const bubble = document.createElement('div');
    bubble.id        = 'dine-in-step';
    bubble.className = 'chat-bubble bot';
    bubble.style.animation = 'fadeSlideIn 0.25s ease';
    bubble.innerHTML = `
        <div style="font-weight:700;color:#10b981;margin-bottom:6px;">🪑 Dine In &mdash; Step 1 of 2</div>
        <div style="font-size:13.5px;color:#334155;margin-bottom:10px;">Which <strong>table number</strong>?</div>
        <div style="display:flex;gap:7px;align-items:center;">
            <input id="dine-table-input" type="number" min="1" max="99" placeholder="e.g. 5"
                   style="width:90px;padding:9px 12px;border:2px solid #d1fae5;
                          border-radius:12px;font-size:15px;font-weight:700;
                          color:#059669;outline:none;background:#f0fdf4;
                          transition:border-color 0.15s;">
            <button id="dine-table-next"
                    style="padding:9px 18px;background:#10b981;color:white;
                           border:none;border-radius:12px;font-weight:700;
                           font-size:13px;cursor:pointer;transition:all 0.15s;
                           box-shadow:0 2px 6px rgba(16,185,129,0.35);">Next &rarr;</button>
        </div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const inp     = document.getElementById('dine-table-input');
    const nextBtn = document.getElementById('dine-table-next');

    // Hover effect on button
    nextBtn.addEventListener('mouseenter', () => nextBtn.style.background = '#059669');
    nextBtn.addEventListener('mouseleave', () => nextBtn.style.background = '#10b981');

    // Focus input on appear
    setTimeout(() => inp.focus(), 120);

    // Input focus ring
    inp.addEventListener('focus', () => inp.style.borderColor = '#10b981');
    inp.addEventListener('blur',  () => inp.style.borderColor = '#d1fae5');

    const proceed = () => {
        const val = parseInt(inp.value.trim(), 10);
        if (!val || val < 1) {
            inp.style.borderColor = '#ef4444';
            inp.style.background  = '#fff1f2';
            inp.placeholder       = 'Enter a number!';
            inp.focus();
            return;
        }
        bubble.remove();
        showGuestSelector(val);
    };

    nextBtn.addEventListener('click', proceed);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') proceed(); });
}

// ─── Dine In step 2: guest count ──────────────────────────────────────────
function showGuestSelector(tableNumber) {
    const bubble = document.createElement('div');
    bubble.id        = 'dine-in-step';
    bubble.className = 'chat-bubble bot';
    bubble.style.animation = 'fadeSlideIn 0.25s ease';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700;color:#10b981;margin-bottom:3px;';
    title.innerHTML = `🪡 Table <strong>${tableNumber}</strong> &mdash; Step 2 of 2`;

    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:13px;color:#64748b;margin-bottom:10px;';
    sub.textContent = 'How many guests?';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:7px;align-items:center;';

    [1, 2, 3, 4, 5, 6, 7, 8].forEach(n => {
        const btn = document.createElement('button');
        btn.textContent = n;
        btn.style.cssText = `
            width:40px;height:40px;
            border-radius:50%;
            border:2px solid #d1fae5;
            background:#f0fdf4;
            color:#059669;
            font-size:15px;
            font-weight:700;
            cursor:pointer;
            transition:all 0.15s ease;
            flex-shrink:0;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background   = '#10b981';
            btn.style.color        = 'white';
            btn.style.borderColor  = '#10b981';
            btn.style.transform    = 'scale(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background   = '#f0fdf4';
            btn.style.color        = '#059669';
            btn.style.borderColor  = '#d1fae5';
            btn.style.transform    = 'none';
        });
        btn.addEventListener('click', () => {
            bubble.remove();
            const msg = `Book table ${tableNumber} for ${n} guest${n > 1 ? 's' : ''}`;
            addMessage(msg, 'user');
            chatInput.value  = msg;
            sendBtn.disabled = false;
            chatForm.dispatchEvent(new Event('submit'));
        });
        btnRow.appendChild(btn);
    });

    // "9+" button for larger parties
    const moreBtn = document.createElement('button');
    moreBtn.textContent = '9+';
    moreBtn.title       = 'More than 8 guests';
    moreBtn.style.cssText = `
        padding:0 14px;height:40px;
        border-radius:20px;
        border:2px solid #d1fae5;
        background:#f0fdf4;
        color:#059669;
        font-size:13px;
        font-weight:700;
        cursor:pointer;
        transition:all 0.15s ease;
    `;
    moreBtn.addEventListener('mouseenter', () => {
        moreBtn.style.background  = '#10b981';
        moreBtn.style.color       = 'white';
        moreBtn.style.borderColor = '#10b981';
    });
    moreBtn.addEventListener('mouseleave', () => {
        moreBtn.style.background  = '#f0fdf4';
        moreBtn.style.color       = '#059669';
        moreBtn.style.borderColor = '#d1fae5';
    });
    moreBtn.addEventListener('click', () => {
        bubble.remove();
        // Let bot handle large parties
        const msg = `Book table ${tableNumber} for Dine In, large party`;
        addMessage(msg, 'user');
        chatInput.value  = msg;
        sendBtn.disabled = false;
        chatForm.dispatchEvent(new Event('submit'));
    });
    btnRow.appendChild(moreBtn);

    bubble.appendChild(title);
    bubble.appendChild(sub);
    bubble.appendChild(btnRow);
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Reset session after order is saved/completed ─────────────────────────
function resetSession() {
    sessionOrderType = '';
    sessionState     = 'idle';
    currentOrderType = '';
    currentCustomerName = '';
    updateOrderTypeBadge();
}

// ─── Show the 3 order-type selector buttons ────────────────────────────────
function showOrderTypeSelector(headingText) {
    // Remove any existing selector
    const existing = document.getElementById('order-type-selector');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'order-type-selector';
    wrapper.style.cssText = `
        margin: 6px 0;
        padding: 12px 14px;
        background: linear-gradient(135deg, rgba(102,126,234,0.07), rgba(118,75,162,0.07));
        border: 1px solid rgba(102,126,234,0.2);
        border-radius: 14px;
        animation: fadeSlideIn 0.3s ease;
    `;

    if (headingText) {
        const heading = document.createElement('div');
        heading.style.cssText = `
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 10px;
        `;
        heading.textContent = headingText;
        wrapper.appendChild(heading);
    }

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

    ORDER_TYPES.forEach(({ label, type, color, bg, border }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            padding: 10px 16px;
            border-radius: 22px;
            border: 1.5px solid ${border};
            background: ${bg};
            color: ${color};
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            white-space: nowrap;
            flex: 1;
            min-width: 80px;
            text-align: center;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = `0 4px 12px ${border}`;
            btn.style.background = color;
            btn.style.color = 'white';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'none';
            btn.style.boxShadow = 'none';
            btn.style.background = bg;
            btn.style.color = color;
        });
        btn.addEventListener('click', () => {
            wrapper.remove();
            selectOrderType(type);
        });
        btnRow.appendChild(btn);
    });

    // Add "Add Customer" as a secondary option
    const addCustBtn = document.createElement('button');
    addCustBtn.textContent = '👤 Add Customer';
    addCustBtn.style.cssText = `
        padding: 7px 14px;
        border-radius: 22px;
        border: 1.5px solid rgba(100,116,139,0.3);
        background: rgba(100,116,139,0.07);
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s ease;
        white-space: nowrap;
        width: 100%;
        margin-top: 6px;
    `;
    addCustBtn.addEventListener('mouseenter', () => {
        addCustBtn.style.background = 'rgba(100,116,139,0.15)';
        addCustBtn.style.color = '#334155';
    });
    addCustBtn.addEventListener('mouseleave', () => {
        addCustBtn.style.background = 'rgba(100,116,139,0.07)';
        addCustBtn.style.color = '#64748b';
    });
    addCustBtn.addEventListener('click', () => {
        wrapper.remove();
        chatInput.value = 'I want to add a new customer';
        sendBtn.disabled = false;
        chatForm.dispatchEvent(new Event('submit'));
    });

    wrapper.appendChild(btnRow);
    wrapper.appendChild(addCustBtn);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Show page-specific suggestion chips ──────────────────────────────────
function showPageSuggestions(pagePath, pageLabel) {
    // On home page (idle state), always show the order-type selector
    if (pagePath === '/home') {
        if (sessionState === 'idle') {
            showOrderTypeSelector('What would you like to do?');
        }
        return;
    }

    let actions = PAGE_QUICK_ACTIONS[pagePath];
    if (!actions) {
        for (const [key, val] of Object.entries(PAGE_QUICK_ACTIONS)) {
            if (pagePath.startsWith(key + '/') || pagePath.startsWith(key)) {
                actions = val;
                break;
            }
        }
    }
    if (!actions || actions.length === 0) return;

    const old = document.getElementById('page-suggestions-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'page-suggestions-panel';
    panel.style.cssText = `
        margin: 8px 10px 4px;
        padding: 10px;
        background: linear-gradient(135deg, rgba(102,126,234,0.10), rgba(118,75,162,0.10));
        border: 1px solid rgba(102,126,234,0.22);
        border-radius: 12px;
        animation: fadeSlideIn 0.3s ease;
    `;

    const heading = document.createElement('div');
    heading.style.cssText = `
        font-size: 10.5px;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 7px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    `;
    heading.textContent = '✨ Quick Actions';
    panel.appendChild(heading);

    const grid = document.createElement('div');
    grid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px;';

    actions.forEach(({ label, message }) => {
        const chip = document.createElement('button');
        chip.textContent = label;
        chip.style.cssText = `
            padding: 5px 11px;
            border-radius: 20px;
            border: 1.5px solid rgba(102,126,234,0.35);
            background: rgba(102,126,234,0.07);
            color: #4a5568;
            font-size: 11.5px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-weight: 500;
            white-space: nowrap;
        `;
        chip.addEventListener('mouseenter', () => {
            chip.style.background = '#667eea';
            chip.style.borderColor = '#667eea';
            chip.style.color = 'white';
            chip.style.transform = 'translateY(-1px)';
        });
        chip.addEventListener('mouseleave', () => {
            chip.style.background = 'rgba(102,126,234,0.07)';
            chip.style.borderColor = 'rgba(102,126,234,0.35)';
            chip.style.color = '#4a5568';
            chip.style.transform = 'none';
        });
        chip.addEventListener('click', () => {
            chatInput.value = message;
            sendBtn.disabled = false;
            panel.remove();
            chatForm.dispatchEvent(new Event('submit'));
        });
        grid.appendChild(chip);
    });

    panel.appendChild(grid);
    chatMessages.appendChild(panel);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Listen for PAGE_CONTEXT from parent ──────────────────────────────────
window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'PAGE_CONTEXT') return;
    const newPath  = event.data.path      || currentPagePath;
    const newLabel = event.data.pageLabel || currentPageLabel;

    const pathChanged = newPath !== currentPagePath;
    currentPagePath  = newPath;
    currentPageLabel = newLabel;

    currentActiveCompany = event.data.activeCompany || currentActiveCompany;
    currentActiveBranch  = event.data.activeBranch  || currentActiveBranch;
    currentAuthToken     = event.data.token         || currentAuthToken;
    if (Array.isArray(event.data.cart))  currentCart = event.data.cart;
    // Only update orderType from PAGE_CONTEXT if session doesn't have one locked
    if (event.data.orderType && !sessionOrderType) currentOrderType = event.data.orderType;
    if (Array.isArray(event.data.menu))  currentMenu = event.data.menu;

    // Update "Currently on:" tag in header
    const pageTag = document.getElementById('current-page-tag');
    if (pageTag) pageTag.textContent = newLabel;

    // Show a small page-change chip when navigation happens
    if (pathChanged && newPath !== '/') {
        const chip = document.createElement('div');
        chip.style.cssText = `
            text-align: center;
            margin: 4px 10px;
            font-size: 10.5px;
            color: #94a3b8;
            font-style: italic;
        `;
        chip.textContent = `📍 Now on: ${newLabel}`;
        chatMessages.appendChild(chip);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show contextual suggestions when page changes
    if (pathChanged || lastSuggestionsPath !== newPath) {
        lastSuggestionsPath = newPath;
        showPageSuggestions(newPath, newLabel);
    }
});

// ─── Input state ───────────────────────────────────────────────────────────
chatInput.addEventListener('input', () => {
    sendBtn.disabled = chatInput.value.trim() === '';
});

// ─── addMessage helper ────────────────────────────────────────────────────
function addMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    // Extract inline ACTIONS markers (|ACTIONS:Yes,Save,Checkout|)
    let actions = [];
    const actionMatch = text.match(/\|ACTIONS:([^|]+)\|/);
    if (actionMatch) {
        actions = actionMatch[1].split(',').map(a => a.trim());
        text = text.replace(/\|ACTIONS:([^|]+)\|/, '').trim();
    }

    // Parse markdown images ![alt](url)
    const parts = text.split(/!\[(.*?)\]\((.*?)\)/g);
    if (parts.length > 1) {
        for (let i = 0; i < parts.length; i++) {
            if (i % 3 === 0) {
                if (parts[i]) bubble.appendChild(document.createTextNode(parts[i]));
            } else if (i % 3 === 1) {
                const alt = parts[i];
                const url = parts[i + 1];
                const imgContainer = document.createElement('div');
                imgContainer.style.cssText = 'text-align:center;margin:8px 0;';
                const img = document.createElement('img');
                img.src = url; img.alt = alt;
                img.style.cssText = 'max-width:100%;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);';
                const caption = document.createElement('div');
                caption.innerText = alt;
                caption.style.cssText = 'font-size:12px;color:#555;margin-top:4px;font-weight:bold;';
                imgContainer.appendChild(img);
                imgContainer.appendChild(caption);
                bubble.appendChild(imgContainer);
                i++;
            }
        }
    } else {
        bubble.innerText = text;
    }

    // Inline action buttons (Yes / Save / Checkout / etc.)
    if (actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'inline-actions';
        actionsContainer.style.marginTop = '10px';

        actions.forEach(action => {
            const btn = document.createElement('button');
            let btnClass = 'inline-btn action-btn';
            if (action === 'Save')     btnClass += ' action-save-btn';
            else if (action === 'Cancel')   btnClass += ' action-cancel-btn';
            else if (action === 'Pay')      btnClass += ' action-pay-btn';
            else if (action === 'Checkout') btnClass += ' action-checkout-btn';
            btn.className = btnClass;
            btn.innerText = action;
            btn.style.marginRight = '5px';
            btn.addEventListener('click', () => {
                let type = '';
                if (action === 'Save') {
                    if (currentOrderType === 'Take Away' && !currentCustomerName) {
                        // Intercept save to ask for customer
                        addMessage('Would you like to add a customer name before saving? |ACTIONS:Add Customer,Skip & Save|', 'bot');
                        actionsContainer.remove();
                        return;
                    }
                    type = 'ACTION_SAVE';
                }
                else if (action === 'Skip & Save') type = 'ACTION_SAVE';
                else if (action === 'Cancel')   type = 'ACTION_CANCEL';
                else if (action === 'Pay')      type = 'PLACE_ORDER';
                else if (action === 'Checkout') type = 'PLACE_ORDER';

                if (type === 'ACTION_SAVE' || type === 'PLACE_ORDER') {
                    // Visual feedback
                    addMessage(type === 'ACTION_SAVE' ? '💾 Saving order...' : '💳 Opening checkout...', 'user');
                    window.parent.postMessage({ type }, '*');

                    if (type === 'ACTION_SAVE') {
                        // Reset session after save so next order starts fresh
                        setTimeout(() => {
                            resetSession();
                            showOrderTypeSelector('✅ Order saved! Start a new order:');
                        }, 900);
                    }
                } else if (type) {
                    addMessage(`${action}`, 'user');
                    window.parent.postMessage({ type }, '*');
                } else {
                    // Generic chip → treat as new chat message
                    chatInput.value = action;
                    sendBtn.disabled = false;
                    chatForm.dispatchEvent(new Event('submit'));
                }
                actionsContainer.remove();
            });
            actionsContainer.appendChild(btn);
        });
        bubble.appendChild(actionsContainer);
    }

    chatMessages.appendChild(bubble);

    const images = bubble.querySelectorAll('img');
    if (images.length > 0) {
        let loaded = 0;
        images.forEach(img => {
            img.onload = () => { loaded++; if (loaded === images.length) chatMessages.scrollTop = chatMessages.scrollHeight; };
        });
    } else {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    return bubble;
}

// ─── Chat form submit ──────────────────────────────────────────────────────
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Intercept typed "save" or "checkout" for Take Away orders without a customer
    const textLower = text.toLowerCase();
    if (textLower === 'save' || textLower === 'checkout' || textLower === 'send to kitchen' || textLower === 'done') {
        if (currentOrderType === 'Take Away' && !currentCustomerName) {
            addMessage(text, 'user');
            chatInput.value = '';
            sendBtn.disabled = true;
            addMessage('Would you like to add a customer name before saving? |ACTIONS:Add Customer,Skip & Save|', 'bot');
            return;
        }
    }

    addMessage(text, 'user');
    chatInput.value  = '';
    sendBtn.disabled = true;

    // Remove the page suggestions panel while the bot is thinking
    const sugPanel = document.getElementById('page-suggestions-panel');
    if (sugPanel) sugPanel.remove();

    const loadingBubble = addMessage('Thinking...', 'loading');

    try {
        const response = await fetch('http://127.0.0.1:6035/api/chatbot/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message:       text,
                userId:        userId,
                sessionId:     sessionId,
                current_page:  currentPagePath,
                page_label:    currentPageLabel,
                activeCompany: currentActiveCompany,
                activeBranch:  currentActiveBranch,
                token:         currentAuthToken,
                cart:          currentCart,
                // Prefer the session-locked order type, fall back to page context
                orderType:     sessionOrderType || currentOrderType,
                menu:          currentMenu,
            })
        });

        const data = await response.json();
        chatMessages.removeChild(loadingBubble);

        if (response.ok) {
            const reply = data.reply || '';
            if (reply) addMessage(reply, 'bot');

            // Forward actions to the parent React app
            if (data.actions && Array.isArray(data.actions)) {
                let savedAction = false;
                data.actions.forEach(action => {
                    window.parent.postMessage(action, '*');

                    if (action.type === 'SHOW_MENU' && action.items && action.items.length > 0) {
                        renderMenuCards(action.items);
                    }

                    // Capture NAVIGATE orderType into session
                    if (action.type === 'NAVIGATE' && action.orderType && !sessionOrderType) {
                        sessionOrderType = action.orderType;
                        sessionState     = 'ordering';
                        currentOrderType = action.orderType;
                        updateOrderTypeBadge();
                    }
                    // Track newly added customer
                    if (action.type === 'CUSTOMER_ADDED') {
                        currentCustomerName = action.name;
                        window.parent.postMessage({ type: 'SET_CUSTOMER', name: action.name, phone: action.phone, id: action.id }, '*');
                    }
                    // Detect save completion via backend action
                    if (action.type === 'ACTION_SAVE') {
                        savedAction = true;
                    }
                });

                // After save: reset session and show new order type selector
                if (savedAction) {
                    setTimeout(() => {
                        resetSession();
                        showOrderTypeSelector('✅ Order saved! Start a new order:');
                    }, 700);
                }
            }
        } else {
            addMessage(data.reply || 'Sorry, I could not reach my AI brain right now.', 'bot');
        }
    } catch (error) {
        console.error('Chatbot Error:', error);
        chatMessages.removeChild(loadingBubble);
        addMessage('Error connecting to the AI. Please try again later.', 'bot');
    }
});

// ─── Welcome static buttons (wired on page load) ──────────────────────────
document.querySelectorAll('.inline-btn[data-order]').forEach(btn => {
    btn.addEventListener('click', () => {
        const orderType = btn.getAttribute('data-order');
        // Dismiss the welcome panel
        const panel = btn.closest('#inline-actions') || document.getElementById('inline-actions');
        if (panel) panel.remove();

        if (orderType === 'add-customer') {
            chatInput.value  = 'I want to add a new customer';
            sendBtn.disabled = false;
            chatForm.dispatchEvent(new Event('submit'));
        } else {
            selectOrderType(orderType);
        }
    });
});

// ─── Keyframe animations ───────────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = `
@keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
}`;
document.head.appendChild(styleEl);

// ─── Render Menu Cards ───────────────────────────────────────────────────────
function renderMenuCards(items) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot menu-cards-bubble';
    bubble.style.background = 'transparent';
    bubble.style.border = 'none';
    bubble.style.boxShadow = 'none';
    bubble.style.padding = '0';
    bubble.style.margin = '10px 0';
    bubble.style.width = '100%';
    bubble.style.animation = 'fadeSlideIn 0.3s ease';

    const header = document.createElement('div');
    header.style.cssText = 'font-size:12px;font-weight:700;color:#667eea;margin-bottom:8px;padding-left:4px;';
    header.textContent = '🍽️ Available Menu Items';
    bubble.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'menu-cards-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:8px;width:100%;';

    items.forEach(item => {
        const price = item.price_list_rate || item.standard_rate || item.price || 0;
        const name = item.item_name || item.name || 'Unknown Item';

        const card = document.createElement('div');
        card.className = 'menu-card';
        card.style.cssText = `
            background: #fff;
            border: 1px solid rgba(102,126,234,0.2);
            border-radius: 12px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: all 0.2s ease;
        `;
        
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(102,126,234,0.15)';
            card.style.borderColor = 'rgba(102,126,234,0.4)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            card.style.borderColor = 'rgba(102,126,234,0.2)';
        });

        const title = document.createElement('div');
        title.className = 'menu-card-title';
        title.style.cssText = 'font-size:13px;font-weight:700;color:#334155;line-height:1.2;margin-bottom:4px;';
        title.textContent = name;

        const priceEl = document.createElement('div');
        priceEl.className = 'menu-card-price';
        priceEl.style.cssText = 'font-size:12px;color:#10b981;font-weight:600;margin-bottom:8px;';
        priceEl.textContent = '₹' + parseFloat(price).toFixed(2);

        const addBtn = document.createElement('button');
        addBtn.className = 'menu-card-add-btn';
        addBtn.textContent = 'Add to Cart';
        addBtn.style.cssText = `
            width: 100%;
            padding: 6px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s ease;
        `;
        addBtn.addEventListener('mouseenter', () => addBtn.style.background = '#5a67d8');
        addBtn.addEventListener('mouseleave', () => addBtn.style.background = '#667eea');

        addBtn.addEventListener('click', () => {
            // Give instant UI feedback
            addBtn.textContent = 'Added! ✓';
            addBtn.style.background = '#10b981';
            setTimeout(() => {
                addBtn.textContent = 'Add to Cart';
                addBtn.style.background = '#667eea';
            }, 1000);

            // Send ADD_TO_CART action to parent explicitly so POS updates
            window.parent.postMessage({
                type: 'ADD_TO_CART',
                item: name,
                quantity: 1
            }, '*');

            // Optionally notify chatbot visually, but without triggering another API call
            addMessage('Added ' + name + ' to cart!', 'user');
        });

        card.appendChild(title);
        card.appendChild(priceEl);
        card.appendChild(addBtn);
        grid.appendChild(card);
    });

    bubble.appendChild(grid);
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
