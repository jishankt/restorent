// C:\manoj\webrestaurant\frontend\restaurant-pos-FE\src\components\Bearer\OpeningEntry.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
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
  Bell,
  Building,
  Layers,
  CheckCircle2,
  ClipboardList,
  Lock
} from "lucide-react";
import { UserContext } from '../../Context/UserContext';
import CurrencySymbol, { resolveCurrencyCode } from '../CurrencySymbol';
// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function OpeningEntryWithNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);
  const reduxUser = useSelector((state) => state.user.user);
  const posProfile = useSelector((state) => state.user.pos_profile);

  // Get user from Redux or fallback to localStorage
  const storedUser = JSON.parse(localStorage.getItem('user')) || { email: 'bearer@gmail.com' };
  const currentUser = user || reduxUser || storedUser;

  // Date and Time state for Navbar
  const [currentTime, setCurrentTime] = useState(new Date());

  // Base URL state
  const [baseUrl, setBaseUrl] = useState('');

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const userObj = currentUser;
        if (!userObj || !userObj.role) return;

        const safeBaseUrl = baseUrl || '';
        const notifUrl = `${safeBaseUrl}/api/notifications`;
        const permUrl = `${safeBaseUrl}/api/role-permissions?role=${encodeURIComponent(userObj.role)}`;

        const [notifRes, permRes] = await Promise.all([
          axios.get(notifUrl).catch(() => ({ data: [] })),
          axios.get(permUrl).catch(() => ({ data: { permissions: [] } }))
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

          if (String(n.employeeId) === userEmpId || String(n.userId) === String(userObj.id)) {
            return true;
          }

          const category = n.category || 'general';
          if (category === 'leave') {
            if (!leaveNotifPerm || !leaveNotifPerm.canRead) return false;
            if (leaveNotifPerm.dataAccess === 'OWN') return false;
            return true;
          }
          if (category === 'schedule') {
            if (!scheduleNotifPerm || !scheduleNotifPerm.canRead) return false;
            if (scheduleNotifPerm.dataAccess === 'OWN') return false;
            return true;
          }
          return true;
        });
        setUnreadCount(filtered.length);
      } catch (err) {
        // Silently handle error
      }
    };
    if (baseUrl !== undefined && baseUrl !== '') {
      fetchUnread();
      const interval = setInterval(fetchUnread, 120000);
      window.addEventListener('notificationUpdate', fetchUnread);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationUpdate', fetchUnread);
      };
    }
  }, [currentUser, baseUrl]);

  // Permission State
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  // System settings state
  const [settings, setSettings] = useState({
    country: 'India',
    language: 'English',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'AED',
    useCurrencySymbol: false,
    dateFormat: 'dd-MMM-yy',
    timeFormat: 'hh:mm a',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
  });

  // Warning message states
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('warning');
  const [pendingAction, setPendingAction] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  // Fetch Network Info for BaseUrl
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:6034`);
        } else {
          setBaseUrl('');
        }
      } catch (error) {
        console.error("Failed to fetch network config:", error);
        setBaseUrl('');
      }
    };
    fetchConfig();
  }, []);

  const [workflowSettings, setWorkflowSettings] = useState({});

  // Fetch Workflow Visibility Settings
  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const userObj = currentUser;
        const activeComp = localStorage.getItem('active_company') || userObj.company;
        const activeBranch = localStorage.getItem('active_branch');
        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        const response = await axios.get(`${baseUrl}/api/workflow-visibility`, { params });
        setWorkflowSettings(response.data.settings || {});
      } catch (err) {
        console.error("OpeningEntry: Failed to fetch visibility", err);
      }
    };

    if (baseUrl !== undefined && baseUrl !== '') {
      fetchVisibility();
    }
  }, [baseUrl, currentUser]);

  const isPageEnabled = (path) => {
    const settings = workflowSettings?.global_modules;
    if (!settings) return true;

    const pathMap = {
      "/home": { mod: "pos_billing", page: "HomeDashboard" },
      "/opening-entry": { mod: "pos_billing", page: "OpeningEntry" },
      "/closing-entry": { mod: "pos_billing", page: "ClosingEntry" },
    };

    if (!pathMap[path]) return true;
    const { mod, page } = pathMap[path];

    const modSet = settings[mod];
    if (!modSet) return false;
    if (modSet.enabled === false) return false;
    if (page && modSet.pages && modSet.pages[page] === false) return false;

    return true;
  };

  // Check for existing active opening entry on mount
  useEffect(() => {
    // Redirection to Home is now handled strictly by BearerLogin.jsx 
    // to prevent UI flicker. However, we'll keep a passive check here 
    // to ensure the UI is ready.
    if (baseUrl !== undefined) {
      setIsCheckingExisting(false);
    }
  }, [baseUrl]);

  // Fetch Permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const role = userObj.role;
          if (role) {
            const url = `${baseUrl}/api/role-permissions?role=${role}`;
            const response = await axios.get(url);
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'opening');
            if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
              setCanCreate(pagePerm.canCreate === true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    if (baseUrl !== undefined) fetchPermissions();
  }, [baseUrl]);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/settings`);
        setSettings((prev) => ({ ...prev, ...response.data }));
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    if (baseUrl !== undefined) fetchSettings();
  }, [baseUrl]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const formattedDate = getFormattedDate(currentTime);
  const formattedTime = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  const getCurrencyFormatter = (invoiceCurrency = null, invoicePrecision = null, asHtml = false, asReact = false) => {
    // Resolve currency from active context using currency_map if not explicitly provided
    const activeComp = localStorage.getItem('active_company') || '';
    const activeBranch = localStorage.getItem('active_branch') || '';
    const currency = invoiceCurrency || resolveCurrencyCode(null, activeComp, activeBranch);
    const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : parseInt(settings.currencyPrecision) || 2;
    return {
      format: (value) => {
        const numValue = parseFloat(value) || 0;
        const fixedValue = numValue.toFixed(precision);
        if (asReact) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ marginRight: '2px', transform: 'translateY(1px)' }}>
                <CurrencySymbol currencyCode={currency} size={14} />
              </span>
              {fixedValue}
            </span>
          );
        } else if (asHtml) {
          if (currency?.toUpperCase() === 'AED') {
            return `<img src="/assets/Dirham Currency Symbol - Black.svg" style="height: 12px; vertical-align: middle; margin-right: 2px; filter: brightness(0.1);" alt="AED"/> ${fixedValue}`;
          } else {
            const symbols = {
              INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
              SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
              QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
              CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
            };
            return `${symbols[currency?.toUpperCase()] || currency} ${fixedValue}`;
          }
        } else {
          const symbols = {
            INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥",
            SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
            QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
            CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
          };
          return `${symbols[currency?.toUpperCase()] || currency} ${fixedValue}`;
        }
      }
    };
  };

  const formatCurrency = (amount) => {
    return getCurrencyFormatter(null, 2, false, true).format(amount);
  };

  const renderCurrencySymbolOnly = () => {
    const currency = resolveCurrencyCode(null, localStorage.getItem('active_company'), localStorage.getItem('active_branch'));
    return <CurrencySymbol currencyCode={currency} size={16} />;
  };

  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage('');
    setWarningType('warning');
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleClosingEntryNavigation = () => {
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    navigate('/closing-entry', { state: { posOpeningEntry } });
  };

  const [periodStartDate, setPeriodStartDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [postingDate, setPostingDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [company, setCompany] = useState('');
  const [username, setUsername] = useState('');
  const [balanceDetails, setBalanceDetails] = useState([{ mode_of_payment: 'Cash', opening_amount: '0' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [branchesDetailed, setBranchesDetailed] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  useEffect(() => {
    const fetchCompaniesDetailed = async () => {
      const allowedRoles = ['superadmin', 'admin', 'group_admin', 'company_admin'];
      const userRole = currentUser.role?.toLowerCase() || '';

      if (!allowedRoles.includes(userRole) || (company && company !== 'All')) return;

      try {
        setCompaniesLoading(true);
        const response = await axios.get(`${baseUrl}/api/company-details`);
        setCompanies(response.data.companyDetails || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setCompaniesLoading(false);
      }
    };
    if (baseUrl !== undefined) fetchCompaniesDetailed();
  }, [baseUrl, company, currentUser.role]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUsername(storedUser.username || storedUser.email?.split('@')[0] || 'Guest');
      setCompany(storedUser.company || 'MyCompany');
    }
  }, []);

  const validateForm = () => {
    const missingFields = [];
    if (!periodStartDate) missingFields.push('Period Start Date');
    if (!postingDate) missingFields.push('Posting Date');
    if (!company) missingFields.push('Company');
    if (!username) missingFields.push('User');
    if (balanceDetails.length === 0 || balanceDetails.some((d) => !d.mode_of_payment || !d.opening_amount)) {
      missingFields.push('Balance Details (complete all rows)');
    }
    if (missingFields.length > 0) {
      setWarning(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }
    setWarning('');
    return true;
  };

  const handleAddBalanceDetail = () => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify balance details.");
      return;
    }
    setBalanceDetails((prev) => [...prev, { mode_of_payment: '', opening_amount: '0' }]);
  };

  const handleBalanceDetailChange = (index, field, value) => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify balance details.");
      return;
    }
    setBalanceDetails((prev) =>
      prev.map((detail, i) => (i === index ? { ...detail, [field]: value } : detail))
    );
  };

  const handleRemoveBalanceDetail = (index) => {
    if (!canDelete) {
      setWarningMessage("You do not have permission to remove balance details.");
      return;
    }
    setBalanceDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canCreate) {
      setError("You do not have permission to create opening entries.");
      setWarningMessage("Permission Denied: canCreate level required.");
      return;
    }

    if (!validateForm()) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');
    const payload = {
      period_start_date: periodStartDate,
      posting_date: postingDate,
      company,
      user: username,
      balance_details: balanceDetails,
      status: 'Open',
      docstatus: 0,
    };

    try {
      const response = await axios.post(`${baseUrl}/api/create_opening_entry`, payload);
      if (response.data && response.data.message.status === 'success') {
        const openingEntryName = response.data.message.name;
        localStorage.setItem('openingEntryName', openingEntryName);
        localStorage.setItem('posOpeningEntry', openingEntryName);
        setSuccessMessage(`Terminal Session ${openingEntryName} started successfully!`);
        setShowSuccessModal(true);
      } else {
        setWarningMessage(response.data.message || 'Server error');
        setWarningType('error');
      }
    } catch (error) {
      console.error('OpeningEntry Error:', error);
      setWarningMessage(error.response?.data?.message || error.message || 'Network error occurred.');
      setWarningType('error');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = balanceDetails.reduce((sum, detail) => sum + (parseFloat(detail.opening_amount) || 0), 0);

  return (
    <div className="opening-entry-wrapper min-vh-100 overflow-hidden" style={{ backgroundColor: '#f8fafc', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      {/* PRECISE NAVBAR AS PER IMAGE */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom py-2 sticky-top shadow-sm">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between w-100">
            {/* Left: Back Button */}
            <div className="navbar-left">
              <button
                className="btn btn-outline-primary rounded-pill px-3 py-1 d-flex align-items-center gap-2 fw-bold shadow-sm hover-up transition-all"
                onClick={() => navigate('/')}
                style={{ border: '2px solid #3b82f6', color: '#3b82f6', fontSize: '0.9rem' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            {/* Center: Icons List */}
            <div className="navbar-center d-none d-lg-flex align-items-center gap-4">
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/home')} title="Home">
                <Home size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/frontpage', { state: { orderType: 'Online Delivery' } })} title="Delivery">
                <Truck size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/table')} title="Dine In">
                <Armchair size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/frontpage')} title="Kitchen">
                <ChefHat size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/salespage')} title="POS">
                <CircleDollarSign size={24} strokeWidth={1.5} className="text-primary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/sales-reports')} title="Reports">
                <BarChart3 size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
              <button className="btn btn-link p-2 text-dark hover-scale transition-all" onClick={() => navigate('/')} title="Go Back">
                <LogOut size={24} strokeWidth={1.5} className="text-secondary" />
              </button>
            </div>

            {/* Right: User Info & Notification */}
            <div className="navbar-right d-flex align-items-center gap-3">
              <div className="notification-bell p-2 bg-light rounded-circle shadow-sm position-relative hover-scale cursor-pointer transition-all">
                <Bell size={20} className="text-primary" />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger animate-pulse" style={{ fontSize: '0.6rem' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="user-info text-end d-none d-sm-block">
                <div className="fw-bold text-dark small" style={{ fontSize: '0.8rem' }}>{currentUser.email}</div>
                <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>{formattedDate}:{formattedTime}</small>
              </div>
              <button className="btn btn-link p-0 text-danger hover-scale transition-all" onClick={handleLogoutClick} title="Logout">
                <Power size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid mt-4 px-lg-5">
        {isCheckingExisting ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '50vh' }}>
            <div className="spinner-grow text-primary mb-3" role="status"></div>
            <p className="fw-bold text-primary animate-pulse">Initializing Terminal...</p>
          </div>
        ) : (
          <div className="max-width-1400 mx-auto">
            <div className="text-center mb-4 animate__animated animate__fadeInDown">
              <h2 className="fw-black text-dark mb-0" style={{ letterSpacing: '-1.5px', fontSize: '2.5rem' }}>Create Opening Entry</h2>
            </div>

            {error && <div className="alert alert-danger rounded-4 shadow border-0 mb-3 py-2 small">{error}</div>}

            <div className="opening-form-section animate__animated animate__fadeInUp">
              {/* TOP HEADER ROW: 4 COLUMNS AS REQUESTED */}
              <div className="row g-3 mb-4">
                {[
                  { label: 'Period Start Date', val: periodStartDate, onChange: setPeriodStartDate, type: 'date', icon: <Layers size={14} className="text-primary me-2" /> },
                  { label: 'Posting Date', val: postingDate, onChange: setPostingDate, type: 'date', icon: <Layers size={14} className="text-primary me-2" /> },
                  { label: 'Company', val: company, readOnly: true, type: 'text', icon: <Building size={14} className="text-primary me-2" /> },
                  { label: 'Active User Terminal', val: username, readOnly: true, type: 'text', icon: <CircleUser size={14} className="text-primary me-2" /> }
                ].map((f, i) => (
                  <div className="col-md-3" key={i}>
                    <div className="glass-card p-3 rounded-4 shadow-sm border bg-white hover-shadow transition-all">
                      <label className="form-label small fw-black text-primary text-uppercase mb-2 d-flex align-items-center" style={{ letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                        {f.icon} {f.label}
                      </label>
                      <input
                        type={f.type}
                        className={`form-control border-0 bg-light p-2 rounded-3 fw-bold small ${f.readOnly ? 'text-muted' : ''}`}
                        value={f.val}
                        readOnly={f.readOnly}
                        onChange={(e) => f.onChange && f.onChange(e.target.value)}
                        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* UNIFIED PAYMENT CARD */}
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4 bg-white mx-auto" style={{ maxWidth: '900px' }}>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0 align-middle">
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th className="px-4 py-3 text-start fw-black small text-primary text-uppercase border-0" style={{ width: '45%', fontSize: '0.75rem' }}>Mode of Payment</th>
                        <th className="px-4 py-3 text-start fw-black small text-primary text-uppercase border-0" style={{ width: '45%', fontSize: '0.75rem' }}>Opening Amount</th>
                        <th className="px-4 py-3 text-center fw-black small text-primary text-uppercase border-0" style={{ width: '10%', fontSize: '0.75rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceDetails.map((detail, index) => (
                        <tr key={index} className="border-bottom border-light">
                          <td className="p-3">
                            <select
                              className="form-select border-0 bg-light p-3 rounded-3 fw-bold shadow-sm"
                              value={detail.mode_of_payment}
                              onChange={(e) => handleBalanceDetailChange(index, 'mode_of_payment', e.target.value)}
                            >
                              <option value="">-- Mode --</option>
                              <option value="Cash">💵 Cash</option>
                              <option value="Card">💳 Card</option>
                              <option value="UPI">📱 UPI</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <div className="input-group shadow-sm rounded-3 overflow-hidden">
                              <span className="input-group-text border-0 bg-light fw-black text-primary px-3">{renderCurrencySymbolOnly()}</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="form-control border-0 bg-light p-3 rounded-0 fw-black text-start fs-5"
                                value={detail.opening_amount}
                                onFocus={(e) => {
                                  if (detail.opening_amount === '0' || detail.opening_amount === '0.00' || parseFloat(detail.opening_amount) === 0) {
                                    handleBalanceDetailChange(index, 'opening_amount', '');
                                  }
                                }}
                                onBlur={(e) => {
                                  let val = detail.opening_amount;
                                  if (!val || val.trim() === '' || parseFloat(val) === 0) {
                                    handleBalanceDetailChange(index, 'opening_amount', '0');
                                  } else {
                                    const num = parseFloat(val);
                                    if (!isNaN(num)) {
                                      handleBalanceDetailChange(index, 'opening_amount', val);
                                    }
                                  }
                                }}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  handleBalanceDetailChange(index, 'opening_amount', val);
                                }}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              className="btn btn-outline-danger border-0 p-2 rounded-circle hover-scale transition-all"
                              onClick={() => handleRemoveBalanceDetail(index)}
                              disabled={balanceDetails.length === 1}
                              style={{ background: 'rgba(239, 68, 68, 0.05)' }}
                            >
                              <X size={18} strokeWidth={3} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-light border-top">
                  <button
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 hover-up transition-all"
                    onClick={handleAddBalanceDetail}
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', fontSize: '0.85rem' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Add New Payment Mode</span>
                  </button>
                </div>
              </div>

              {/* ACTION BAR: COMPACT FOR VIEWPORT */}
              <div className="row align-items-center g-3 mx-auto" style={{ maxWidth: '900px' }}>
                <div className="col-md-6">
                  <div className="d-flex align-items-center bg-white p-3 rounded-4 border shadow-sm" style={{ borderLeft: '6px solid #3b82f6 !important' }}>
                    <div className="me-3 opacity-20"><CircleDollarSign size={32} /></div>
                    <div>
                      <span className="fw-black text-primary text-uppercase" style={{ fontSize: '0.65rem' }}>Terminal Balance</span>
                      <div className="d-flex align-items-baseline">
                        <span className="fw-black fs-5 text-dark me-1" style={{ display: 'inline-flex', alignItems: 'center' }}>{renderCurrencySymbolOnly()}</span>
                        <span className="fw-black fs-3 text-dark">{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-success px-4 py-3 rounded-4 fw-black shadow-lg hover-up transition-all"
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: 'none', fontSize: '1rem', minWidth: '220px' }}
                    >
                      {loading ? '...' : <Power className="me-2" size={18} />}
                      {loading ? 'INITIALIZING' : 'SUBMIT OPENING'}
                    </button>
                    <button
                      className="btn btn-white px-4 py-3 rounded-4 fw-bold shadow-sm border-0 hover-scale transition-all"
                      onClick={() => navigate('/')}
                      style={{ color: '#64748b', background: '#fff', fontSize: '0.9rem' }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .fw-black { font-weight: 900 !important; }
        .hover-up:hover { transform: translateY(-3px); }
        .hover-scale:hover { transform: scale(1.05); }
        .hover-shadow:hover { box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05) !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .max-width-1400 { max-width: 1400px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s infinite; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="custom-modal-overlay">
          <div className="custom-logout-modal animate__animated animate__zoomIn">
            <div className="modal-icon text-danger mb-3">
              <CircleAlert size={64} />
            </div>
            <h2 className="modal-title fw-bold">Sign Out?</h2>
            <p className="modal-text text-muted mb-4">Are you sure you want to exit the POS terminal?</p>
            <div className="modal-buttons d-flex gap-3 w-100">
              <button className="modal-btn cancel-btn flex-grow-1 border rounded-pill py-3 fw-bold" onClick={cancelLogout}>CANCEL</button>
              <button className="modal-btn confirm-btn flex-grow-1 bg-danger text-white border-0 rounded-pill py-3 fw-bold shadow-sm" onClick={confirmLogout}>LOGOUT</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="custom-modal-overlay">
          <div className="custom-logout-modal animate__animated animate__zoomIn text-center" style={{ borderTop: '10px solid #2ecc71' }}>
            <div className="modal-icon text-success mb-3">
              <Check size={80} strokeWidth={3} />
            </div>
            <h2 className="modal-title fw-black text-dark" style={{ fontSize: '2rem' }}>SUCCESS!</h2>
            <p className="modal-text text-muted mb-4 fs-5">{successMessage}</p>
            <button
              className="modal-btn confirm-btn w-100 bg-success text-white border-0 rounded-pill py-3 fw-black shadow-lg hover-up transition-all"
              onClick={() => navigate('/home')}
              style={{ fontSize: '1.2rem', letterSpacing: '1px' }}
            >
              GO TO HOME
            </button>
          </div>
        </div>
      )}

      {/* Warning/Error Modal */}
      {warningMessage && (
        <div className="custom-modal-overlay">
          <div className="custom-logout-modal animate__animated animate__shakeX text-center" style={{ borderTop: `10px solid ${warningType === 'error' ? '#e74c3c' : '#f1c40f'}` }}>
            <div className={`modal-icon ${warningType === 'error' ? 'text-danger' : 'text-warning'} mb-3`}>
              {warningType === 'error' ? <X size={80} strokeWidth={3} /> : <CircleAlert size={80} strokeWidth={3} />}
            </div>
            <h2 className="modal-title fw-black text-dark" style={{ fontSize: '2rem' }}>{warningType === 'error' ? 'ERROR' : 'WARNING'}</h2>
            <p className="modal-text text-muted mb-4 fs-5">{warningMessage}</p>
            <button
              className={`modal-btn w-100 ${warningType === 'error' ? 'bg-danger' : 'bg-warning'} text-white border-0 rounded-pill py-3 fw-black shadow-lg hover-up transition-all`}
              onClick={handleWarningOk}
              style={{ fontSize: '1.2rem', letterSpacing: '1px' }}
            >
              OKAY
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        .custom-logout-modal {
          background: #fff;
          padding: 40px;
          border-radius: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .modal-icon {
          animation: scaleIn 0.5s ease-out;
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default OpeningEntryWithNavbar;
