import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import {
  ArrowLeft,
  Home,
  Truck,
  Armchair,
  ChefHat,
  CircleDollarSign,
  BarChart3,
  LogOut,
  CircleUser,
  Power,
  CircleAlert,
  Check,
  X,
  Bell
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: navigationState } = location;
  const fromAdmin = navigationState?.fromAdmin || false;

  // Get user from Redux or fallback to localStorage
  const reduxUser = useSelector((state) => state.user.user);
  const storedUser = JSON.parse(localStorage.getItem('user')) || { email: "Guest" };
  const user = reduxUser || storedUser;

  // Date and Time state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("success");
  const [pendingAction, setPendingAction] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // System settings state with defaults
  const [settings, setSettings] = useState({
    country: 'Japan',
    language: 'English',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'JPY',
    dateFormat: 'dd-mm-yyyy',
    timeFormat: 'hh:mm a',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
  });

  const [disabledPages, setDisabledPages] = useState([]);
  const [workflowSettings, setWorkflowSettings] = useState({});

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load system settings on mount with fallback
  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('systemSettings'));
    if (storedSettings) {
      setSettings((prev) => ({ ...prev, ...storedSettings }));
    }
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);
  const { baseUrl } = useContext(UserContext);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj || !userObj.role) {
          console.warn("Navbar: No user found for unread count");
          return;
        }

        const activeComp = localStorage.getItem('active_company') || userObj.company_name || userObj.company;
        const activeBranch = userObj.branch_name || userObj.branch;

        const headers = {};
        if (activeComp) headers['X-Company-Name'] = activeComp;
        if (activeBranch && activeBranch !== 'All Branches') headers['X-Branch-Name'] = activeBranch;

        const safeBaseUrl = baseUrl || '';
        const notifUrl = `${safeBaseUrl}/api/notifications`;
        const permUrl = `${safeBaseUrl}/api/role-permissions?role=${encodeURIComponent(userObj.role)}&t=${Date.now()}`;

        const [notifRes, permRes] = await Promise.all([
          axios.get(notifUrl, { headers }).catch(() => ({ data: [] })),
          axios.get(permUrl, { headers }).catch(() => ({ data: { permissions: [] } }))
        ]);

        const allNotifs = notifRes.data || [];
        const perms = permRes.data?.permissions || [];
        const leaveNotifPerm = perms.find(p => p.pageId === 'leave_apply_notif');
        const scheduleNotifPerm = perms.find(p => p.pageId === 'schedule_assign_notif');

        const isAdmin = userObj.role?.toLowerCase().includes('admin') || userObj.is_test;
        const userEmpId = String(userObj.employeeId || userObj.employeeIdCode || userObj.id);

        const currentUserId = String(userObj.id || userObj._id);
        const filtered = allNotifs.filter(n => {
          if (n.deleted_by && n.deleted_by.includes(currentUserId)) return false;
          if (n.read_by && n.read_by.includes(currentUserId)) return false;

          if (isAdmin) return true;

          // Always show notifications explicitly assigned to this user
          if (String(n.employeeId) === userEmpId || String(n.userId) === String(userObj.id)) {
            return true;
          }

          const category = n.category || 'general';
          if (category === 'leave') {
            if (!leaveNotifPerm || !leaveNotifPerm.canRead) return false;
            if (leaveNotifPerm.dataAccess === 'OWN') return false; // Handled above
            return true;
          }
          if (category === 'schedule') {
            if (!scheduleNotifPerm || !scheduleNotifPerm.canRead) return false;
            if (scheduleNotifPerm.dataAccess === 'OWN') return false; // Handled above
            return true;
          }
          return true; // Show other categories by default
        });
        setUnreadCount(filtered.length);
      } catch (err) {
        // Silently handle error
      }
    };
    if (baseUrl !== undefined) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 120000);
      window.addEventListener('notificationUpdate', fetchUnread);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationUpdate', fetchUnread);
      };
    }
  }, [user, baseUrl]);

  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj) return;

        const activeComp = localStorage.getItem('active_company') || userObj.company;
        const activeBranch = localStorage.getItem('active_branch');
        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        // Fetch both legacy module visibility and new hierarchical workflow visibility
        const [visRes, workRes] = await Promise.all([
          axios.get('/api/module-visibility', { params }).catch(() => ({ data: { disabled_pages: [] } })),
          axios.get('/api/workflow-visibility', { params }).catch(() => ({ data: { settings: {} } }))
        ]);

        setDisabledPages(visRes.data.disabled_pages || []);
        setWorkflowSettings(workRes.data.settings || {});
      } catch (err) {
        console.error("Navbar: Failed to fetch visibility", err);
      }
    };

    fetchVisibility();
    window.addEventListener('visibilityChange', fetchVisibility);
    window.addEventListener('companyChange', fetchVisibility);
    return () => {
      window.removeEventListener('visibilityChange', fetchVisibility);
      window.removeEventListener('companyChange', fetchVisibility);
    };
  }, [user?.email, user?.company]);

  const isPageEnabled = (path) => {
    // 1. Check legacy manual suppression
    if (disabledPages && disabledPages.includes(path)) return false;

    // 2. Check Aggressive Workflow Suppression (Global Modules)
    const settings = workflowSettings?.global_modules;
    if (!settings) return true;

    // Mapping active Navbar paths to Global Module Keys
    const pathMap = {
      "/frontpage": { mod: "table_management", page: "FrontPage" },
      "/home": { mod: "pos_billing", page: "HomeDashboard" },
      "/table": { mod: "table_management", page: "TableView" },
      "/kitchen": { mod: "kitchen_display", page: "KitchenView" },
      "/salespage": { mod: "reports", page: "SalesInvoice" },
      "/sales-reports": { mod: "reports", page: "SalesReport" },
      "/pos-balance": { mod: "pos_billing", page: "POSBalance" },
      "/opening-entry": { mod: "pos_billing", page: "OpeningEntry" },
      "/closing-entry": { mod: "pos_billing", page: "ClosingEntry" },
      "/bearer": { mod: "pos_billing", page: "BearerPage" },
      "/notifications": { mod: "notifications", page: "Notifications" }
    };

    if (!pathMap[path]) return true; // Essential or unmapped paths remain visible
    const { mod, page } = pathMap[path];
    
    const modSet = settings[mod];
    if (!modSet) return false;
    if (modSet.enabled === false) return false;
    if (page && modSet.pages && modSet.pages[page] === false) return false;

    return true;
  };

  // Dynamic date formatting logic
  const getFormattedDate = (date, dateFormat) => {
    if (!date) return "";
    if (!dateFormat) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const numericFormatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: 'numeric' });
    const parts = numericFormatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';

    switch (dateFormat) {
      case 'dd-mm-yyyy': return `${day.padStart(2, '0')}-${month}-${year}`;
      case 'mm-dd-yyyy': return `${month}-${day.padStart(2, '0')}-${year}`;
      case 'yyyy-mm-dd': return `${year}-${month}-${day.padStart(2, '0')}`;
      case 'dd/mm/yyyy': return `${day.padStart(2, '0')}/${month}/${year}`;
      case 'mm/dd/yyyy': return `${month}/${day.padStart(2, '0')}/${year}`;
      case 'yyyy/mm/dd': return `${year}/${month}/${day.padStart(2, '0')}`;
      default: return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // Dynamic time formatting logic
  const getFormattedTime = (date, timeFormat) => {
    if (!date) return "";
    if (!timeFormat) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: is12Hour,
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const formattedDate = getFormattedDate(currentTime, 'dd-mm-yyyy');
  const formattedTime = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Handle OK button click for warning messages
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("success");
  };

  // Logout handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Navigation handlers
  const handleOpeningEntryNavigation = () => navigate('/opening-entry');
  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    navigate('/closing-entry', { state: { posOpeningEntry } });
  };
  const handleSalesReportNavigation = () => navigate('/sales-reports');

  return (
    <>
      <div className="navbar-wrapper">
        {/* Alert Component (Existing) */}
        {warningMessage && (
          <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
            {warningMessage}
            <button type="button" className="btn btn-primary ms-3" onClick={handleWarningOk}>OK</button>
          </div>
        )}

        {/* Main Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm" style={{ height: '80px', minHeight: '80px' }}>
          <div className="container-fluid">
            {/* Left Side: Back Button */}
            <div className="navbar-left-section d-flex align-items-center">
              <button
                className="back-nav-btn"
                onClick={() => {
                  if (fromAdmin) {
                    navigate('/admin');
                  } else {
                    navigate('/frontpage');
                  }
                }}
                title="Go Back"
              >
                <ArrowLeft size={20} />
                <span className="ms-2 d-none d-sm-inline">Back</span>
              </button>
            </div>

            <button
              className="navbar-toggler bg-light"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              {/* Centered Navigation */}
              <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex justify-content-center">
                {!fromAdmin && isPageEnabled('/frontpage') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/frontpage' ? 'active' : ''}`} onClick={() => navigate('/frontpage')} title="Home">
                      <Home className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/home') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`} onClick={() => navigate('/home')} title="Delivery Type">
                      <Truck className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/table') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/table' ? 'active' : ''}`} onClick={() => navigate('/table')} title="Table">
                      <Armchair className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/kitchen') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/kitchen' ? 'active' : ''}`} onClick={() => navigate('/kitchen')} title="Kitchen">
                      <ChefHat className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/salespage') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/salespage' ? 'active' : ''}`} onClick={() => navigate('/salespage')} title="Sales">
                      <CircleDollarSign className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/sales-reports') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/sales-reports' ? 'active' : ''}`} onClick={handleSalesReportNavigation} title="Reports">
                      <BarChart3 className="digital-icon" />
                    </a>
                  </li>
                )}
                {!fromAdmin && isPageEnabled('/closing-entry') && (
                  <li className="nav-item">
                    <a className={`nav-link ${location.pathname === '/closing-entry' ? 'active' : ''}`} onClick={handleClosingEntryNavigation} title="Closing">
                      <LogOut className="digital-icon" />
                    </a>
                  </li>
                )}
              </ul>

              {/* Right Side Info & Logout */}
              <div className="d-flex align-items-center ms-auto pe-3">
                {isPageEnabled('/notifications') && (
                  <div
                    className="notification-nav-btn me-3"
                    onClick={() => navigate('/notifications')}
                    title="Notifications"
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: '#fff',
                      padding: '5px',
                      borderRadius: '50%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <Bell size={24} style={{ color: '#3498db' }} />
                    {unreadCount > 0 && (
                      <span className="position-absolute" style={{
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                        animation: 'pulse-notif 2s infinite',
                        zIndex: 10
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
                <div className="user-info text-end me-3">
                  {user.role === 'group_admin' && location.pathname !== '/salespage' && location.pathname !== '/sales-reports' && (
                    <div className="company-selector-wrapper mb-1">
                      <select 
                        className="form-select form-select-sm"
                        value={localStorage.getItem('active_company') || user.company}
                        onChange={(e) => {
                          const newCompany = e.target.value;
                          localStorage.setItem('active_company', newCompany);
                          // Trigger a custom event for other components to listen to
                          window.dispatchEvent(new Event('companyChange'));
                        }}
                        style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 5px', minWidth: '120px' }}
                      >
                        <option value="All">All Companies (Aggregate View)</option>
                        {user.companies && user.companies.map((c, i) => {
                          const cName = typeof c === 'object' ? (c.company_name || c.company || c.name) : c;
                          return <option key={i} value={cName}>{cName}</option>;
                        })}
                      </select>
                    </div>
                  )}
                  <div className="d-flex align-items-center justify-content-end">
                    <CircleUser size={24} className="me-2 text-primary" />
                    <span className="fw-bold text-black mb-0">{user.email}</span>
                  </div>
                  <small className="d-block text-muted fw-bold" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {formattedDate}:{formattedTime}
                  </small>
                </div>
                <div className="navbar-logout-btn-wrapper">
                  <a className="frontpage-header-logout" onClick={handleLogoutClick} title="Logout">
                    <Power className="digital-icon logout-icon" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Placeholder to reserve space and prevent content overlap */}
      <div className="navbar-placeholder"></div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="custom-modal-overlay">
          <div className="custom-logout-modal">
            <div className="modal-icon">
              <CircleAlert size={60} />
            </div>
            <h2 className="modal-title">Logout Confirmation</h2>
            <p className="modal-text">Are you sure you want to logout from the system?</p>
            <div className="modal-buttons">
              <button className="modal-btn confirm-btn" onClick={confirmLogout}>
                <Check size={20} /> YES
              </button>
              <button className="modal-btn cancel-btn" onClick={cancelLogout}>
                <X size={20} /> NO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .navbar-wrapper { 
          width: 100%; 
          position: fixed; 
          top: 0; 
          left: 0;
          z-index: 2000; 
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .navbar-placeholder {
          height: 80px;
          width: 100%;
          visibility: hidden;
          pointer-events: none;
        }
        
        .digital-icon {
          width: 34px;
          height: 34px;
          color: #555;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar-nav {
          gap: 1.5rem;
        }

        .nav-link { 
          padding: 0.75rem 1rem;
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          position: relative; 
        }

        .nav-link:hover .digital-icon { 
          color: #007bff;
          transform: translateY(-3px);
        }

        .nav-link.active .digital-icon {
          color: #007bff;
        }

        .nav-link.active::after { 
          content: ''; 
          position: absolute; 
          bottom: 0; 
          left: 50%; 
          transform: translateX(-50%); 
          width: 34px; 
          height: 3px;
          background: #007bff; 
          border-radius: 10px; 
        }

        @keyframes pulse-notif {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Logout Button Style - Exact Sync with Front.jsx/front.css (Reduced Size) */
        .navbar-logout-btn-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
        }

        .frontpage-header-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 6px; /* Reduced from 10px */
          border-radius: 50%;
          transition: all 0.2s ease;
          background: #f3f4f6; /* Matching var(--bg-tertiary) */
          margin-left: 10px;
          border: none;
          text-decoration: none;
        }

        .frontpage-header-logout:hover {
          background: #ef4444; /* Matching var(--danger-color) */
          transform: scale(1.1);
        }

        .logout-icon {
          width: 28px; /* Reduced from 48px to match header standard */
          height: 28px; /* Reduced from 48px to match header standard */
          color: #ef4444; /* Matching var(--danger-color) */
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .frontpage-header-logout:hover .logout-icon {
          color: #ffffff;
          transform: scale(1.1);
        }
        
        .navbar-left-section { margin-right: 15px; }
        .back-nav-btn {
          background-color: transparent;
          border: 2px solid #3498db;
          color: #3498db;
          padding: 8px 20px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 2px 10px rgba(52, 152, 219, 0.1);
        }
        .back-nav-btn:hover {
          background-color: #3498db;
          color: #ffffff;
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }

        /* Modal Styles */
        .custom-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 3000; animation: fadeIn 0.3s ease-out;
        }
        .custom-logout-modal {
          background: #ffffff; padding: 40px; border-radius: 24px;
          width: 90%; max-width: 400px; text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); border: 2px solid #ef4444;
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-icon { color: #ef4444; margin-bottom: 20px; display: flex; justify-content: center; }
        .modal-title { font-size: 1.5rem; font-weight: 800; color: #333; margin-bottom: 12px; }
        .modal-text { font-size: 1rem; color: #666; margin-bottom: 30px; line-height: 1.5; }
        .modal-buttons { display: flex; gap: 15px; justify-content: center; }
        .modal-btn { padding: 12px 25px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; border: none; }
        .confirm-btn { background: #ef4444; color: #ffffff; }
        .confirm-btn:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); }
        .cancel-btn { background: rgba(0, 0, 0, 0.05); color: #333; }
        .cancel-btn:hover { background: rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse-notif {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @media (max-width: 991px) { 
          .navbar-placeholder { height: 100px; }
          .nav-item { margin: 5px 0; }
          .back-nav-btn span { display: none; }
          .back-nav-btn { padding: 8px; }
          .digital-icon { width: 28px; height: 28px; }
          .logout-icon { width: 24px; height: 24px; }
          .frontpage-header-logout { margin-left: 5px; padding: 5px; }
          .navbar-nav { gap: 0.5rem; }
        }
      `}</style>
    </>
  );
}

export default Navbar;


