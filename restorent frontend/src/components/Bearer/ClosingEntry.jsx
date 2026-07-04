// C:\manoj\webrestaurant\frontend\restaurant-pos-FE\src\components\Bearer\ClosingEntry.jsx
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
  Bell
} from "lucide-react";
import { UserContext } from '../../Context/UserContext';
import CurrencySymbol, { resolveCurrencyCode } from '../CurrencySymbol';
// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function ClosingEntryWithNavbar() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const userData = useSelector((state) => state.user);
  const storedUser = JSON.parse(localStorage.getItem('user')) || { email: "Guest" };
  const currentUser = userData?.user || storedUser;

  const [currentTime, setCurrentTime] = useState(new Date());
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
    currency: 'INR',
    useCurrencySymbol: false,
    dateFormat: 'yyyy-mm-dd',
    timeFormat: 'hh:mm a',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
  });

  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
            const pagePerm = perms.find(p => p.pageId === 'closing');
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

  const getFormattedDate = (date, dateFormat) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const formattedDate = getFormattedDate(currentTime, 'dd-mm-yyyy');
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

  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
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

  const [posOpeningEntry, setPosOpeningEntry] = useState(state?.posOpeningEntry || localStorage.getItem('posOpeningEntry') || '');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().slice(0, 16));
  const [company, setCompany] = useState('');
  const [user, setUserState] = useState('');
  const [posProfile, setPosProfile] = useState('');
  const [posTransactions, setPosTransactions] = useState([{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
  const [paymentReconciliation, setPaymentReconciliation] = useState([]);
  const [taxes, setTaxes] = useState([{ account_head: '', rate: '', amount: '' }]);
  const [grandTotal, setGrandTotal] = useState('');
  const [netTotal, setNetTotal] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingEntries, setOpeningEntries] = useState([]);

  useEffect(() => {
    const reduxPosProfile = userData?.pos_profile || localStorage.getItem('pos_profile') || 'POS-001';
    const reduxUserEmail = currentUser.email || 'bearer@gmail.com';
    const reduxCompany = userData?.company || localStorage.getItem('company') || 'MyCompany';
    setPosProfile(reduxPosProfile);
    setUserState(reduxUserEmail);
    setCompany(reduxCompany);
  }, [userData, currentUser]);

  useEffect(() => {
    const fetchOpeningEntries = async () => {
      if (!posProfile) return;
      try {
        const response = await axios.post(`${baseUrl}/api/get_pos_opening_entries`, { pos_profile: posProfile });
        if (response.data.status === 'success' && Array.isArray(response.data.message)) {
          setOpeningEntries(response.data.message);
        }
      } catch (error) {
        console.error('Error fetching POS Opening Entries:', error);
      }
    };
    if (posProfile && baseUrl !== undefined) fetchOpeningEntries();
  }, [posProfile, baseUrl]);

  useEffect(() => {
    const fetchPosDetails = async () => {
      if (!posOpeningEntry || !openingEntries.length) return;
      const selectedEntry = openingEntries.find(entry => entry.name === posOpeningEntry);
      if (!selectedEntry) return;

      setPeriodStartDate(selectedEntry.period_start_date?.split(' ')[0] || '');
      setPostingDate(selectedEntry.posting_date || new Date().toISOString().split('T')[0]);
      setCompany(selectedEntry.company || '');
      setUserState(selectedEntry.user || currentUser.email || 'bearer@gmail.com');
      setPosProfile(selectedEntry.pos_profile || '');

      const balanceDetails = selectedEntry.balance_details || [];
      if (balanceDetails.length > 0) {
        setPaymentReconciliation(balanceDetails.map(detail => ({
          mode_of_payment: detail.mode_of_payment || '',
          opening_amount: detail.opening_amount ? detail.opening_amount.toString() : '0',
          expected_amount: detail.opening_amount ? detail.opening_amount.toString() : '0',
          closing_amount: ''
        })));
      }

      try {
        const response = await axios.post(`${baseUrl}/api/get_pos_invoices`, { pos_opening_entry: posOpeningEntry });
        if (response.data.message && response.data.message.status === 'success') {
          const invoices = response.data.message.invoices || [];
          setPosTransactions(invoices.length > 0 ? invoices.map(inv => ({
            pos_invoice: inv.pos_invoice || '',
            grand_total: inv.grand_total || '',
            posting_date: inv.posting_date || '',
            customer: inv.customer || ''
          })) : [{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);

          setTaxes(response.data.message.taxes?.length ? response.data.message.taxes.map(tax => ({
            account_head: tax.account_head || '',
            rate: tax.rate || '',
            amount: tax.amount || ''
          })) : [{ account_head: '', rate: '', amount: '' }]);

          setGrandTotal(response.data.message.grand_total || '');
          setNetTotal(response.data.message.net_total || '');
          setTotalQuantity(response.data.message.total_quantity || '');
        }
      } catch (error) {
        console.error('Error fetching POS Invoices:', error);
      }
    };
    if (posOpeningEntry && baseUrl !== undefined) fetchPosDetails();
  }, [posOpeningEntry, openingEntries, currentUser.email, baseUrl]);

  const handleAddPosTransaction = () => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify transactions.");
      return;
    }
    setPosTransactions(prev => [...prev, { pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
  };

  const handlePosTransactionChange = (index, field, value) => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify transactions.");
      return;
    }
    setPosTransactions(prev => prev.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx)));
  };

  const handleRemovePosTransaction = (index) => {
    if (!canDelete) {
      setWarningMessage("You do not have permission to remove transactions.");
      return;
    }
    setPosTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPaymentReconciliation = () => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify payments.");
      return;
    }
    setPaymentReconciliation(prev => [...prev, { mode_of_payment: '', opening_amount: '0', expected_amount: '0', closing_amount: '' }]);
  };

  const handlePaymentReconciliationChange = (index, field, value) => {
    if (!canWrite) {
      setWarningMessage("You do not have permission to modify payments.");
      return;
    }
    setPaymentReconciliation(prev => prev.map((pr, i) => (i === index ? { ...pr, [field]: value } : pr)));
  };

  const handleRemovePaymentReconciliation = (index) => {
    if (!canDelete) {
      setWarningMessage("You do not have permission to remove payments.");
      return;
    }
    setPaymentReconciliation(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canCreate) {
      setWarningMessage("You do not have permission to create closing entries.");
      return;
    }

    setLoading(true);
    const payload = {
      pos_opening_entry: posOpeningEntry,
      posting_date: postingDate,
      period_end_date: periodEndDate,
      pos_transactions: posTransactions,
      payment_reconciliation: paymentReconciliation,
      taxes: taxes,
      grand_total: grandTotal,
      net_total: netTotal,
      total_quantity: totalQuantity,
    };

    try {
      const response = await axios.post(`${baseUrl}/api/create_closing_entry`, payload);
      if (response.data && response.data.message.status === 'success') {
        localStorage.removeItem('posOpeningEntry');
        localStorage.removeItem('openingEntryName');
        setWarningMessage("Session closed successfully. Go to login page?");
        setWarningType("success");
        setShowLogoutConfirm(true);
        setPendingAction(() => () => {
          navigate('/', { replace: true });
        });
      } else {
        setWarningMessage(response.data.message || 'Error occurred');
      }
    } catch (error) {
      console.error('ClosingEntry Error:', error);
      setWarningMessage(error.response?.data?.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!canRead && loading) return <div className="text-center mt-5">Checking Permissions...</div>;

  return (
    <div className="closing-entry-wrapper">
      <div className="navbar-fixed-container">
        {warningMessage && (
          <div className={`alert alert-${warningType} text-center alert-dismissible fade show`} role="alert">
            {warningMessage}
            {showLogoutConfirm ? (
              <div className="mt-2 text-center">
                <button type="button" className="btn btn-success me-3 px-4" onClick={() => { handleWarningOk(); setShowLogoutConfirm(false); }}>Yes</button>
                <button type="button" className="btn btn-secondary px-4" onClick={() => { setWarningMessage(""); setShowLogoutConfirm(false); }}>No</button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary ms-3" onClick={handleWarningOk}>OK</button>
            )}
          </div>
        )}
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm" style={{ height: '80px', minHeight: '80px' }}>
          <div className="container-fluid">
            {/* Left Side: Back Button */}
            <div className="navbar-left-section d-flex align-items-center">
              <button
                className="back-nav-btn"
                onClick={() => navigate(-1)}
                title="Go Back"
              >
                <ArrowLeft size={20} />
                <span className="ms-2 d-none d-sm-inline">Back</span>
              </button>
            </div>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex justify-content-center">
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/frontpage' ? 'active' : ''}`} onClick={() => navigate('/frontpage')} title="Home">
                    <Home className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`} onClick={() => navigate('/home')} title="Delivery Type">
                    <Truck className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/table' ? 'active' : ''}`} onClick={() => navigate('/table')} title="Table">
                    <Armchair className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/kitchen' ? 'active' : ''}`} onClick={() => navigate('/kitchen')} title="Kitchen">
                    <ChefHat className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/salespage' ? 'active' : ''}`} onClick={() => navigate('/salespage')} title="Sales">
                    <CircleDollarSign className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/sales-reports' ? 'active' : ''}`} onClick={() => navigate('/sales-reports')} title="Reports">
                    <BarChart3 className="digital-icon" />
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${location.pathname === '/closing-entry' ? 'active' : ''}`} onClick={() => navigate('/closing-entry')} title="Closing">
                    <LogOut className="digital-icon" />
                  </a>
                </li>
              </ul>
              <div className="d-flex align-items-center ms-auto pe-3">
                <div
                  className="notification-nav-btn me-3"
                  onClick={() => navigate('/notifications')}
                  title="Notifications"
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: '#fff',
                    padding: '8px',
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
                <div className="user-info text-end me-3">
                  <div className="d-flex align-items-center justify-content-end">
                    <CircleUser size={24} className="me-2 text-primary" />
                    <span className="fw-bold text-black mb-0">{currentUser.email}</span>
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

      <div className="container-fluid closing-entry-container mt-4">
        <h2 className="text-center my-4">Create POS Closing Entry</h2>
        {!canRead ? (
          <div className="alert alert-danger text-center">You do not have permission to view this page.</div>
        ) : (
          <div className="row">
            <div className="col-lg-12">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">POS Opening Entry</label>
                  <select
                    className="form-control"
                    value={posOpeningEntry}
                    onChange={(e) => setPosOpeningEntry(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {openingEntries.map((entry) => (
                      <option key={entry._id} value={entry.name}>{entry.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Period Start Date</label>
                  <input type="date" className="form-control" value={periodStartDate} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Posting Date</label>
                  <input type="date" className="form-control" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Period End Date</label>
                  <input type="datetime-local" className="form-control" value={periodEndDate} onChange={(e) => setPeriodEndDate(e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Company</label>
                  <input type="text" className="form-control" value={company} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">User</label>
                  <input type="text" className="form-control" value={user} disabled />
                </div>
              </div>

              <h5>POS Transactions</h5>
              <div className="table-responsive mb-3">
                <table className="table border text-start">
                  <thead>
                    <tr><th>POS Invoice</th><th>Grand Total</th><th>Date</th><th>Customer</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {posTransactions.map((tx, index) => (
                      <tr key={index}>
                        <td><input type="text" className="form-control" value={tx.pos_invoice} disabled /></td>
                        <td>{formatCurrency(tx.grand_total)}</td>
                        <td><input type="date" className="form-control" value={tx.posting_date} disabled /></td>
                        <td><input type="text" className="form-control" value={tx.customer} disabled /></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => handleRemovePosTransaction(index)}><i className="bi bi-trash"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-primary" onClick={handleAddPosTransaction}>Add Transaction</button>
              </div>

              <h5>Payment Reconciliation</h5>
              <div className="table-responsive mb-3">
                <table className="table border text-start">
                  <thead>
                    <tr><th>Mode</th><th>Opening</th><th>Expected</th><th>Closing</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {paymentReconciliation.map((pr, index) => (
                      <tr key={index}>
                        <td>{pr.mode_of_payment}</td>
                        <td>{formatCurrency(pr.opening_amount)}</td>
                        <td>{formatCurrency(pr.expected_amount)}</td>
                        <td><input type="number" className="form-control" value={pr.closing_amount} onChange={(e) => handlePaymentReconciliationChange(index, 'closing_amount', e.target.value)} /></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => handleRemovePaymentReconciliation(index)}><i className="bi bi-trash"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-primary" onClick={handleAddPaymentReconciliation}>Add Payment</button>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="grand-tot-div">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      <style jsx>{`
        .closing-entry-wrapper {
          width: 100%;
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .navbar-fixed-container {
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

        /* Logout Button Style - Exact Sync with Navbar.jsx */
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
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
          background: #f3f4f6;
          margin-left: 10px;
          border: none;
          text-decoration: none;
        }

        .frontpage-header-logout:hover {
          background: #ef4444;
          transform: scale(1.1);
        }

        .logout-icon {
          width: 28px;
          height: 28px;
          color: #ef4444;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .frontpage-header-logout:hover .logout-icon {
          color: #ffffff;
          transform: scale(1.1);
        }

        .cursor-pointer { cursor: pointer; }
        .closing-entry-container { padding: 20px; background-color: #f8f9fa; }
        .grand-tot-div { background-color: #e9ecef; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; font-weight: bold; }

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
          margin-left: 10px;
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

        @media (max-width: 991px) { 
          .navbar-placeholder { height: 100px; }
          .navbar-nav { gap: 0.5rem; }
          .back-nav-btn span { display: none; }
          .back-nav-btn { padding: 8px; }
          .digital-icon { width: 28px; height: 28px; }
          .logout-icon { width: 24px; height: 24px; }
          .frontpage-header-logout { margin-left: 5px; padding: 5px; }
        }
      `}</style>
    </div>
  );
}

export default ClosingEntryWithNavbar;
