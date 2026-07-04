import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCommentDots, FaTimes } from 'react-icons/fa';
import { UserContext } from '../Context/UserContext';

const ChatbotModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    // Tracks the active order type selected by the user (Dine In / Take Away / Online Delivery)
    // Persisted in React state so it survives navigation and is re-sent with every PAGE_CONTEXT
    const [selectedOrderType, setSelectedOrderType] = useState('');
    const navigate  = useNavigate();
    const iframeRef = useRef(null);

    const { user } = useContext(UserContext);

    const userId = user ? (user._id || "guest") : "guest";
    const role   = user ? (user.role || user.username || "Guest") : "Guest";

    // ─── Auth / tenant context from Redux ───────────────────────────────────
    // CONFIRMED store shape (from store.js / userSlice.js): the only slice is
    // `user`, containing { user, session, posProfile, allowedItemGroups,
    // allowedCustomerGroups, filteredItems, filteredCustomers }.
    //
    // STILL NEEDS CONFIRMATION: the exact field names inside `posProfile` and
    // `session` for company/branch/token. Update the three lines below once
    // that shape is known — e.g. if posProfile looks like
    // { company: 'Acme Corp', branch: 'Main St' } and session is a raw JWT
    // string, these are already correct; if posProfile nests differently
    // (e.g. posProfile.company_name, posProfile.default_branch) or session
    // is an object like { token: '...' }, adjust accordingly.
    const activeCompany = useSelector((state) => state.user?.posProfile?.company || '');
    const activeBranch  = useSelector((state) => state.user?.posProfile?.branch  || '');
    const authToken     = useSelector((state) => state.user?.session || '');

    // ─── Menu context from Redux ─────────────────────────────────────────────
    // CONFIRMED: state.user.filteredItems is the allowed/filtered menu item
    // list set by loginSuccess — this is the real menu source.
    const menuItems  = useSelector((state) => state.user?.filteredItems || []);

    // ─── Cart context ─────────────────────────────────────────────────────
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const handleCartUpdate = (e) => setCartItems(e.detail || []);
        window.addEventListener('pos_cart_updated', handleCartUpdate);
        return () => window.removeEventListener('pos_cart_updated', handleCartUpdate);
    }, []);

    const orderType  = '';

    const location     = useLocation();

    // ─── Pages where the chatbot is ALLOWED to appear ─────────────────────────
    // Chatbot only shows on these 5 operational pages.
    // ALL other pages (admin, kitchen, active-orders, settings, etc.) are excluded.
    const ALLOWED_ROUTES = [
        '/home',
        '/frontpage',
        '/table',
        '/online_delivery',
        '/sales-reports',
    ];

    // Check if current path matches any allowed route (supports prefix match for dynamic sub-routes)
    const isAllowedPage = ALLOWED_ROUTES.some(
        (allowed) => location.pathname === allowed || location.pathname.startsWith(allowed + '/')
    );

    // ─── Page label map: route → human-readable name ───────────────────────
    // Only includes the 5 pages where the chatbot is shown.
    const PAGE_LABELS = {
        '/home':            'Home',
        '/frontpage':       'POS Ordering',
        '/table':           'Table Selection (Dine In)',
        '/online_delivery': 'Online Delivery',
        '/sales-reports':   'Sales Reports',
    };

    const getCurrentPageLabel = useCallback((pathname) => {
        if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
        // Partial match for dynamic routes like /customers/123
        for (const [path, label] of Object.entries(PAGE_LABELS)) {
            if (pathname.startsWith(path + '/')) return label;
        }
        // Humanise unknown routes
        return pathname.replace(/\//g, ' ').replace(/-/g, ' ').trim() || 'Home';
    }, []);

    // ─── Send current page + auth/tenant context to iframe ─────────────────
    // FIX (bug #5): now also posts activeCompany/activeBranch/token so the
    // chatbot's own JS can include them in the POST body to
    // /api/chatbot/message (as data.activeCompany / data.activeBranch / data.token),
    // which routes.py reads directly into auth_context.
    const sendPageContext = useCallback((pathname) => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;
        const pageLabel = getCurrentPageLabel(pathname);
        iframe.contentWindow.postMessage({
            type:          'PAGE_CONTEXT',
            path:          pathname,
            pageLabel:     pageLabel,
            activeCompany: activeCompany,
            activeBranch:  activeBranch,
            token:         authToken,
            cart:          cartItems,
            // Use the React-state orderType (set when user picks an order type via the chatbot)
            // Falls back to empty string if no order type has been selected yet
            orderType:     selectedOrderType,
            menu:          menuItems,
        }, '*');
    }, [getCurrentPageLabel, activeCompany, activeBranch, authToken, cartItems, selectedOrderType, menuItems]);

    // Whenever the route changes, inform the chatbot iframe
    useEffect(() => {
        sendPageContext(location.pathname);
    }, [location.pathname, sendPageContext]);

    // Also re-send whenever the tenant context itself changes (e.g. the user
    // switches active company/branch without navigating), so a stale/empty
    // context isn't stuck in the iframe for the rest of the session.
    useEffect(() => {
        sendPageContext(location.pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCompany, activeBranch, authToken]);

    // Re-send whenever the cart, order type, or menu changes, so the chatbot
    // always has the CURRENT cart state — not just whatever it was when the
    // page last loaded. This is what was missing before: cart edits made
    // through the normal UI never reached the chatbot at all.
    useEffect(() => {
        sendPageContext(location.pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartItems, orderType, menuItems]);

    // ─── Handle open/close — send page context when opening ─────────────────
    const handleToggle = () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        if (nextOpen) {
            // Small delay to let iframe mount before posting
            setTimeout(() => sendPageContext(location.pathname), 300);
        }
    };

    // ─── Listen for action messages from the chatbot iframe ──────────────────
    useEffect(() => {
        const handleMessage = (event) => {
            const data = event.data;
            if (!data || !data.type) return;

            if (data.type === 'NAVIGATE') {
                if (data.path) {
                    navigate(data.path);
                }
                // Capture the order type so it persists across page navigations
                // and is re-sent with every subsequent PAGE_CONTEXT postMessage
                if (data.orderType) {
                    setSelectedOrderType(data.orderType);
                }
            } else if (data.type === 'ADD_TO_CART') {
                console.log("Chatbot requested adding to cart:", data.item);
            } else if (data.type === 'SET_ORDER_TYPE') {
                console.log("Chatbot requested setting order type:", data.orderType);
            } else if (data.type === 'SET_TABLE') {
                console.log("Chatbot requested setting table:", data);
                // FIX: previously this only navigated (and applied table/chair state)
                // if the user was NOT already on /frontpage. If they were already there,
                // the table selection was silently dropped, and any NAVIGATE action that
                // followed would then push a bare navigation with no state, wiping it out
                // entirely. Now we always apply the state, using `replace` when already on
                // /frontpage so it doesn't stack an extra history entry.
                const chairsArray = Array.from({length: parseInt(data.chairs) || 1}, (_, i) => i + 1);
                const alreadyOnFrontpage = window.location.pathname === '/frontpage';
                navigate('/frontpage', {
                    state: {
                        tableNumber: data.tableNumber,
                        chairsBooked: chairsArray,
                        chairsCount: parseInt(data.chairs) || 1,
                        orderType: "Dine In"
                    },
                    replace: alreadyOnFrontpage
                });
            } else if (data.type === 'REFRESH_ORDERS') {
                // Trigger a page refresh if we're on the active orders page
                console.log("Chatbot requested orders refresh");
                window.dispatchEvent(new CustomEvent('chatbot_refresh_orders'));
            } else if (data.type === 'SHOW_CUSTOMERS') {
                console.log("Chatbot showing customers:", data.count);
            } else if (data.type === 'SHOW_TABLES') {
                console.log("Chatbot showing tables:", data.count);
            } else if (data.type === 'SHOW_MENU') {
                console.log("Chatbot showing menu:", data.count);
            } else if (data.type === 'SET_CUSTOMER') {
                console.log("Chatbot requested setting customer:", data);
                window.dispatchEvent(new CustomEvent('chatbot_set_customer', { detail: data }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    // Only render the chatbot if:
    // 1. A valid logged-in user exists
    // 2. We are on one of the 5 allowed operational pages
    if (!user || role === "Guest" || !isAllowedPage) {
        return null;
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleToggle}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                }}
            >
                {isOpen ? <FaTimes /> : <FaCommentDots />}
            </button>

            {/* Chatbot Modal */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    width: '350px',
                    height: '500px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', zIndex: 10 }}
                    >
                        <FaTimes />
                    </button>
                    {/* Iframe content */}
                    <iframe
                        ref={iframeRef}
                        id="chatbot-iframe"
                        src={`/chatbot/index.html?v=20260703c&userId=${userId}&role=${encodeURIComponent(role)}`}
                        style={{
                            width: '100%',
                            flex: 1,
                            border: 'none'
                        }}
                        title="AI Assistant"
                        onLoad={() => sendPageContext(location.pathname)}
                    />
                </div>
            )}
        </>
    );
};

export default ChatbotModal;
