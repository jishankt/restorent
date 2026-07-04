import React, { useState, useEffect, useRef, useContext } from 'react';
import './firstTab.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import { UserContext } from '../../Context/UserContext';

function FirstTab() {
    const navigate = useNavigate();
    // Default theme is 'light' (Blue Gradient)
    const [theme, setTheme] = useState('light');
    const [showThemeDropdown, setShowThemeDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [workflowSettings, setWorkflowSettings] = useState({});
    const [visibleButtons, setVisibleButtons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { baseUrl, getHeaders } = useContext(UserContext);
    const dropdownRef = useRef(null);

    // Button Data Definition
    const buttonData = [
        { label: 'Take Away', icon: 'fa-bag-shopping', path: '/frontpage', type: 'Take Away', description: 'Order & pick up', workflowKey: 'Takeaway' },
        { label: 'Dine In', icon: 'fa-utensils', path: '/table', type: 'Dine In', description: 'Enjoy your meal', workflowKey: 'Dine In' },
        { label: 'Online Delivery', icon: 'fa-truck', path: '/frontpage', type: 'Online Delivery', description: 'Doorstep delivery', workflowKey: 'Online Delivery' },
        { label: 'Booking', icon: 'fa-calendar-check', path: '/booking', type: 'Booking', description: 'Reserve a table', workflowKey: 'Booking' },
        { label: 'Trip Report', icon: 'fa-file-invoice', path: '/trip-report', type: 'Trip Report', description: 'Delivery reports', workflowKey: 'TripReport' },
        { label: 'POS Balance', icon: 'fa-wallet', path: '/pos-balance', type: 'POS Balance', description: 'Check system balance', workflowKey: 'POSBalance' },
        { label: 'Voice', icon: 'fa-volume-high', path: '/voice', type: 'Voice', description: 'Voice commands', workflowKey: 'Voice' },
    ];

    const handleNavigation = (path, orderType) => {
        localStorage.setItem('selectedOrderType', orderType);
        localStorage.setItem('isOrderTypeSelected', 'true'); 
        navigate(path, { state: { orderType } });
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("active_company");
        localStorage.removeItem("active_branch");
        localStorage.removeItem("pos_profile");
        localStorage.removeItem("selectedOrderType");
        localStorage.removeItem("isOrderTypeSelected");
        // Clear all redirect flags on logout
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('hasRedirectedToOpening_')) {
                sessionStorage.removeItem(key);
            }
        });
        navigate("/");
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const handleThemeSelect = (selectedTheme) => {
        setTheme(selectedTheme);
        setShowThemeDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowThemeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    // Fetch Workflow Visibility Settings
    const fetchWorkflowData = async () => {
        setIsLoading(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem('user')) || {};
            const activeComp = localStorage.getItem('active_company') || storedUser.company || storedUser.company_name;
            const activeBranch = localStorage.getItem('active_branch') || storedUser.branch || storedUser.branch_name;
            
            if (!activeComp) {
                setIsLoading(false);
                setVisibleButtons(buttonData);
                return;
            }

            const params = { company: activeComp };
            if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

            console.log(`[FirstTab Sync] Fetching for ${activeComp} / ${activeBranch}`);
            const response = await axios.get(`${baseUrl}/api/workflow-visibility`, { 
                params,
                headers: getHeaders ? getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeComp) : {}
            });
            const settings = response.data.settings || {};
            console.log("[FirstTab Sync] Received Settings Keys:", Object.keys(settings));
            console.log("[FirstTab Sync] Takeaway Setting:", settings['Takeaway']);
            setWorkflowSettings(settings);

            const coreKeys = ['Takeaway', 'Dine In', 'Online Delivery'];
            const hasAnyCoreConfig = coreKeys.some(key => settings[key] !== undefined);
            const hasAnyGlobalConfig = settings.global_modules && Object.keys(settings.global_modules).length > 0;
            const hasAnyConfigAtAll = hasAnyCoreConfig || hasAnyGlobalConfig;

            console.log(`[FirstTab] Filtering for ${activeComp}/${activeBranch}. hasAnyConfigAtAll=${hasAnyConfigAtAll}`);

            const filtered = buttonData.filter(btn => {
                const category = btn.workflowKey;
                const g = settings.global_modules;
                
                // If NO config at all exists for this company, show everything (First Run)
                if (!hasAnyConfigAtAll) return true;

                // 1. Core experiences (Takeaway, Dine In, Online Delivery)
                if (coreKeys.includes(category)) {
                    const s = settings[category];
                    
                    // Strict Whitelist: Only show if explicitly enabled
                    if (!s || s.enabled !== true) return false;
                    
                    // Cross-check with Global Module Suppression
                    if (category === 'Dine In' && g?.table_management?.enabled !== true) return false;
                    if (['Takeaway', 'Online Delivery'].includes(category) && g?.pos_billing?.enabled !== true) return false;

                    return true;
                }

                // 2. Extra features (Booking, TripReport, POSBalance, Voice)
                // Strict visibility mapping to global modules
                if (category === "Booking") {
                    return g?.table_management?.enabled === true && g?.table_management?.pages?.Booking === true;
                }
                if (category === "TripReport") {
                    return g?.reports?.enabled === true && g?.reports?.pages?.TripReport === true;
                }
                if (category === "POSBalance") {
                    return g?.pos_billing?.enabled === true && g?.pos_billing?.pages?.POSBalance === true;
                }
                if (category === "Voice") {
                    return g?.notifications?.enabled === true && g?.notifications?.pages?.VoiceSupport === true;
                }

                return false;
            });

            setVisibleButtons(filtered);
        } catch (error) {
            console.error("Error fetching workflow settings:", error);
            setVisibleButtons(buttonData);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflowData();
        window.addEventListener('companyChange', fetchWorkflowData);
        window.addEventListener('visibilityChange', fetchWorkflowData);
        return () => {
            window.removeEventListener('companyChange', fetchWorkflowData);
            window.removeEventListener('visibilityChange', fetchWorkflowData);
        };
    }, []);

    // Nuclear Redirection Logic: Ensure a session is active before allowing access to the Home dashboard
    useEffect(() => {
        const verifySessionAndWorkflow = async () => {
            if (isLoading) return;

            try {
                const storedUser = JSON.parse(localStorage.getItem('user')) || {};
                const activeComp = localStorage.getItem('active_company') || storedUser.company || storedUser.company_name;
                const activeBranch = localStorage.getItem('active_branch') || storedUser.branch || storedUser.branch_name;

                const workflowRes = await axios.get(`${baseUrl || ''}/api/workflow-visibility`, {
                    params: {
                        company: activeComp,
                        branch: activeBranch
                    },
                    headers: getHeaders ? getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeComp) : {}
                });
                const w = workflowRes.data.settings || {};
                const g = w.global_modules;
                const isOpeningEntryEnabled = g?.pos_billing?.enabled === true && g?.pos_billing?.pages?.OpeningEntry === true;

                console.log("[FirstTab SessionCheck] Opening Entry Enabled:", isOpeningEntryEnabled);
                if (!isOpeningEntryEnabled) return; // Requirement is disabled, allow access

                // 2. Requirement is enabled, now check if we have an active session
                const checkUrl = `${baseUrl || ''}/api/get_pos_opening_entries`;
                const userObj = JSON.parse(localStorage.getItem('user')) || {};
                const openingRes = await axios.post(checkUrl, { 
                    pos_profile: localStorage.getItem('pos_profile') || "POS-001",
                    userId: userObj.email || userObj.username,
                    role: userObj.role
                }, {
                    headers: {
                        ...(getHeaders ? getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeComp) : {}),
                        'X-Company-Name': activeComp || 'All',
                        'X-Branch-Name': activeBranch || 'All'
                    }
                });

                const userIdentifier = userObj.username || (userObj.email ? userObj.email.split('@')[0] : 'Guest');
                const activeEntries = (openingRes.data?.message || []).filter(e => 
                    e.status === 'Open' && e.user === userIdentifier
                );
                console.log(`[FirstTab SessionCheck] Active Sessions found for ${userIdentifier}:`, activeEntries.length);

                if (activeEntries.length === 0) {
                    // Check if this user's role actually has permission to view Opening Entry!
                    let isOpeningAllowed = false;
                    try {
                        const rolePermRes = await axios.get(`${baseUrl || ''}/api/role-permissions?role=${encodeURIComponent(userObj.role)}&t=${Date.now()}`, {
                            headers: getHeaders ? getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeComp) : {}
                        });
                        const perms = rolePermRes.data.permissions || [];
                        const hasAllPerm = perms.some(p => p.pageId === 'all');
                        const openingPerm = perms.find(p => p.pageId === 'opening');
                        
                        if (hasAllPerm) {
                            isOpeningAllowed = true;
                        } else if (openingPerm && (openingPerm.canRead === true || openingPerm.canRead === 'true')) {
                            isOpeningAllowed = true;
                        }
                    } catch (permErr) {
                        console.error("HomeDashboard: Failed to fetch role permissions", permErr);
                        isOpeningAllowed = false; // Fail secure
                    }

                    if (!isOpeningAllowed) {
                        console.log("HomeDashboard: User lacks permission for Opening Entry. Skipping redirect to /opening-entry -> Staying on /home.");
                        return; // Bypass forced redirect
                    }

                    console.warn("HomeDashboard: No active session found. Redirecting to /opening-entry");
                    navigate("/opening-entry", { replace: true });
                }
            } catch (err) {
                console.error("HomeDashboard: Session verification failed", err);
            }
        };

        verifySessionAndWorkflow();
    }, [isLoading, navigate, baseUrl]);

    // Keyboard Navigation for Action Cards
    useEffect(() => {
        const isKeyboardShortcutsEnabled = localStorage.getItem("isKeyboardShortcutsEnabled") === "true";
        if (!isKeyboardShortcutsEnabled) return;

        const handleKeyDown = (e) => {
            const getCards = () => Array.from(document.querySelectorAll('.action-card'));
            const activeEl = document.activeElement;
            const isCardActive = activeEl && activeEl.classList.contains('action-card');

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    if (isCardActive) {
                        const cards = getCards();
                        const idx = cards.indexOf(activeEl);
                        if (idx > 0) cards[idx - 1].focus();
                    } else {
                        const cards = getCards();
                        if (cards.length > 0) cards[cards.length - 1].focus();
                    }
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    if (isCardActive) {
                        const cards = getCards();
                        const idx = cards.indexOf(activeEl);
                        if (idx >= 0 && idx < cards.length - 1) cards[idx + 1].focus();
                    } else {
                        const cards = getCards();
                        if (cards.length > 0) cards[0].focus();
                    }
                    break;
                case 'Enter':
                    if (isCardActive) {
                        e.preventDefault();
                        activeEl.click();
                    }
                    break;
                case 'Backspace':
                    if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        navigate(-1);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
        return () => {
            document.body.className = '';
        };
    }, [theme]);

    return (
        <div className={`first-tab-container theme-${theme}`}>
            <div className="top-right-section">
                <div className="theme-wrapper" ref={dropdownRef}>
                    <button
                        className={`nav-icon-button theme-toggle-button ${showThemeDropdown ? 'active' : ''}`}
                        onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                        aria-label="Change Theme"
                        title="Change Theme"
                    >
                        <i className="fa-solid fa-palette"></i>
                    </button>

                    {showThemeDropdown && (
                        <div className="theme-dropdown">
                            <div className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => handleThemeSelect('light')}>
                                <span className="icon-span"><i className="fa-solid fa-sun"></i></span> Light
                            </div>
                            <div className={`theme-option ${theme === 'ocean' ? 'active' : ''}`} onClick={() => handleThemeSelect('ocean')}>
                                <span className="icon-span"><i className="fa-solid fa-water"></i></span> Ocean
                            </div>
                            <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeSelect('dark')}>
                                <span className="icon-span"><i className="fa-solid fa-moon"></i></span> Dark
                            </div>
                            <div className={`theme-option ${theme === 'sunset' ? 'active' : ''}`} onClick={() => handleThemeSelect('sunset')}>
                                <span className="icon-span"><i className="fa-solid fa-cloud-sun"></i></span> Sunset
                            </div>
                        </div>
                    )}
                </div>

                <button className="logout-button" onClick={handleLogoutClick} title="Logout" aria-label="Logout">
                    <img src="/menuIcons/poweroff.svg" alt="Logout" className="logout-icon" />
                </button>
            </div>

            <div className="content-layout">
                <div className="header-section">
                    <h1 className="title">Choose Your Experience</h1>
                    <p className="subtitle">Select how you'd like to enjoy your order</p>
                </div>

                <div className="cards-container">
                    {isLoading ? (
                        <div className="loading-container">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="loading-text">Synchronizing Workflow...</p>
                        </div>
                    ) : (
                        <div className="cards-flex-layout">
                            {visibleButtons.map((btn, index) => (
                                <div
                                    key={index}
                                    tabIndex="0"
                                    className="action-card"
                                    onClick={() => handleNavigation(btn.path, btn.type)}
                                >
                                    <div className="card-icon">
                                        <i className={`fa-solid ${btn.icon}`}></i>
                                    </div>
                                    <h3 className="card-title">{btn.label}</h3>
                                    <p className="card-description">{btn.description}</p>
                                    <div className="card-arrow">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="logout-modal">
                        <div className="modal-icon">
                            <i className="fa-solid fa-circle-exclamation"></i>
                        </div>
                        <h2 className="modal-title">Logout Confirmation</h2>
                        <p className="modal-text">Are you sure you want to logout from the system?</p>
                        <div className="modal-buttons">
                            <button className="modal-btn confirm-btn" onClick={confirmLogout}>
                                <i className="fa-solid fa-check"></i> YES
                            </button>
                            <button className="modal-btn cancel-btn" onClick={cancelLogout}>
                                <i className="fa-solid fa-xmark"></i> NO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FirstTab;
