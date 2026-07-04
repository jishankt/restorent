// src/components/Form/salaryreceptlist.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaPrint, FaEdit, FaTrashAlt, FaFileInvoiceDollar, FaArrowLeft, FaTimes, FaCheck, FaPlus } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

const SalaryReceiptList = ({ permissions: propPermissions }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Global State
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);

  const [slips, setSlips] = useState([]);
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currency, setCurrency] = useState('₹');
  const [companyName, setCompanyName] = useState('My Company');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Permissions
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [dataScope, setDataScope] = useState("All Data"); // NEW: Data scope for filtering
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");

  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    const fetchPermissions = async () => {
      try {
        setPermsLoading(true);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const roleRaw = userObj.role || userObj.UserType || '';
          const branch = userObj.branch_name || userObj.branch || "";
          const isAdminRole = checkIsAdmin(userObj);

          const isGroupAdminRole = checkIsGlobalAdmin(userObj);

          if (roleRaw) {
            const userEmail = userObj.email || '';
            const url = `${baseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}&email=${userEmail}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'salary_slip' || p.pageId === 'salary_list');
            
            if (isAdminRole || isGroupAdminRole) {
              setCanRead(true);
              setCanWrite(true);
              setCanDelete(true);
              setCanCreate(true);
              setDataScope("All Data");
            } else if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
              setCanCreate(pagePerm.canCreate === true);
              const scope = pagePerm.dataAccess || pagePerm.dataScope || "All Data";
              setDataScope(scope);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setPermsLoading(false);
      }
    };
    fetchPermissions();
  }, [baseUrl, configLoading]);

  const itemsPerPage = 10;

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    // Wait for config
    if (configLoading) return;
    const currentBaseUrl = baseUrl || '';

    const fetchData = async () => {
      try {
        // Parallelize independent fetches
        await Promise.all([
          getSettings(),
          getCompany()
        ]);
        // Fetch slips regardless of explicit canRead (backend handles security)
        // or we check canRead if we want strict UI hiding, but let's try to load if allowed.
        // We will respect the previous logic which waited for canRead, 
        // BUT we need to make sure we don't block on baseUrl.
        if (canRead) {
          await fetchSlips();
        } else {
          // If we can't read yet (maybe permissions are loading slow?), 
          // we might want to try anyways or rely on the permission effect to trigger a re-render
        }
      } catch (err) {
        console.error(err);
      }
    };

    const getSettings = async () => {
      try {
        const res = await axios.get(`${currentBaseUrl}/api/settings`, { headers: getHeaders() });
        const map = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 'AED': 'AED' };
        setCurrency(map[res.data.currency] || res.data.currency || '₹');
      } catch { }
    };

    const getCompany = async () => {
      try {
        const res = await axios.get(`${currentBaseUrl}/api/company-details`, { headers: getHeaders() });
        if (res.data.companyDetails?.length) setCompanyName(res.data.companyDetails.slice(-1)[0].restaurantName);
      } catch { }
    };

    fetchData();
  }, [baseUrl, configLoading, canRead, dataScope]);

  useEffect(() => {
    if (location.state?.fromSave) {
      setMessage("Salary slip saved successfully!");
      setTimeout(() => setMessage(''), 5000);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const uId = userObj.userId || userObj._id || userObj.id;
      const uRole = userObj.role;

      console.log("FETCHING SLIPS - Params:", { userId: uId, role: uRole });

      const res = await axios.get(`${baseUrl}/api/salary-slip`, {
        headers: getHeaders(),
        params: {
          userId: uId,
          id: uId,
          role: uRole
        }
      });

      const slipList = res.data || [];
      console.log("FETCHED SLIPS COUNT:", slipList.length);
      console.log("FETCHED SLIPS DATA:", slipList);

      // We remove the manual frontend-side filtering here because the backend 
      // is now handling the hierarchical filtering (Own data + accessible designations).
      // This allows the Manager to see both their own slips AND slips of employees they manage (like Cooks).

      setSlips(slipList);
      setFilteredSlips(slipList);
    } catch (e) {
      console.error('Error fetching slips:', e);
      setError('Failed to fetch salary slips');
      setTimeout(() => setError(''), 5000);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = slips.filter(s =>
      (s.employeeName || '').toLowerCase().includes(q) ||
      (s.employeeIdCode || '').toLowerCase().includes(q) ||
      (s.month || '').toLowerCase().includes(q)
    );
    setFilteredSlips(filtered);
    setCurrentPage(1);
  }, [searchQuery, slips]);

  const totalPages = Math.ceil(filteredSlips.length / itemsPerPage);
  const currentItems = filteredSlips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete salary slips.");
      setShowPermModal(true);
      return;
    }
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/api/salary-slip/${deletingId}`, { headers: getHeaders() });
      fetchSlips();
      setMessage("Salary slip deleted successfully!");
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError("Delete failed. Please try again.");
      setTimeout(() => setError(''), 5000);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setLoading(false);
    }
  };

  const handlePrint = async (id) => {
    try {
      const res = await axios.get(`${baseUrl}/api/salary-slip/${id}`, { headers: getHeaders() });
      const slip = res.data;
      const rosterDeductions = slip.rosterDeductions || slip.rosterAdditions || [];

      const w = window.open('', '_blank');
      w.document.write(`
        <html>
        <head>
          <title>Salary Slip - ${slip.employeeName}</title>
          <style>
             body { font-family: 'Arial', sans-serif; padding: 40px; }
             .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;}
             .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
             .sub-header { font-size: 14px; margin-top: 5px; }
             .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px; font-size: 13px; }
             .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
             table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
             th { background: #f9f9f9; }
             .right { text-align: right; }
             .total-box { border: 2px solid #eee; padding: 15px; margin-top: 20px; }
             .net-pay { font-size: 18px; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
           <div class="header">
              <h1>${companyName}</h1>
              <div class="sub-header">Salary Slip for ${slip.month}</div>
           </div>
           
           <div class="grid">
              <div>
                 <div class="row"><strong>Employee ID:</strong> ${slip.employeeIdCode || slip.employeeId}</div>
                 <div class="row"><strong>Name:</strong> ${slip.employeeName}</div>
                 <div class="row"><strong>Designation:</strong> ${slip.designation}</div>
                 <div class="row"><strong>Date of Joining:</strong> ${slip.postingDate}</div>
              </div>
              <div>
                 <div class="row"><strong>Status:</strong> ${slip.status}</div>
                 <div class="row"><strong>Payroll Mode:</strong> ${slip.modeOfPayment}</div>
                 <div class="row"><strong>Working Days:</strong> ${slip.workingDays}</div>
                 <div class="row"><strong>Paid Days:</strong> ${slip.paymentDays}</div>
              </div>
           </div>

           <h3>Earnings</h3>
           <table>
             <thead><tr><th>Component</th><th class="right">Amount</th></tr></thead>
             <tbody>
                ${(slip.earnings || []).map(e => `<tr><td>${e.component}</td><td class="right">${currency} ${formatCurrency(e.amount)}</td></tr>`).join('')}
                <tr style="font-weight:bold; background:#f0f8ff;">
                   <td>Total Gross Pay</td>
                   <td class="right">${currency} ${formatCurrency(slip.grossPay || slip.grossSalary)}</td>
                </tr>
             </tbody>
           </table>

           <h3>Deductions</h3>
           <table>
             <thead><tr><th>Component</th><th class="right">Amount</th></tr></thead>
             <tbody>
                ${(slip.leaveWithoutPay || 0) > 0 ? `<tr><td>Leave Without Pay</td><td class="right">${currency} ${formatCurrency(slip.leaveWithoutPay * (slip.dailyRate || 0))}</td></tr>` : ''}
                ${(slip.deductions || [])
          .filter(d => !d.component.includes('Roster')) // Filter out roster to avoid duplicates
          .map(d => `<tr><td>${d.component}</td><td class="right">${currency} ${formatCurrency(d.amount)}</td></tr>`)
          .join('')
        }
                ${rosterDeductions.map(r => `<tr><td>Roster: ${r.description || 'Roster Duty'} (${r.date || ''})</td><td class="right">${currency} ${formatCurrency(r.amount)}</td></tr>`).join('')}
                
                <tr style="font-weight:bold; background:#fff0f0;">
                   <td>Total Deductions</td>
                   <td class="right">${currency} ${formatCurrency(slip.totalDeductions)}</td>
                </tr>
             </tbody>
           </table>

           <div class="total-box">
              <div class="net-pay">Net Payable: ${currency} ${formatCurrency(slip.netPay)}</div>
              <div style="text-align:center; font-style:italic; margin-top:5px;">In Words: ${currency} ${formatCurrency(slip.netPay)} Only</div>
           </div>
           
           <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:12px;">
              <div>Employee Signature</div>
              <div>Authorised Signatory</div>
           </div>

           <script>
             window.onload = function() { window.print(); }
           </script>
        </body>
        </html>
      `);
      w.document.close();
    } catch (e) {
      setError("Print failed");
      setTimeout(() => setError(''), 5000);
    }
  };

  if (permsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <p>Checking Permissions...</p>
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdminRole = checkIsAdmin(userObj);


  if (!canRead && !isAdminRole && !permsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '10px' }}>Access Denied</h2>
          <p>You do not have permission to view Salary Receipts.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin')}
            style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '50px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f2f6', padding: '20px', position: 'relative' }}>
      {/* Centered Permission Denied Modal */}
      {showPermModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
          }}>
            <div style={{ color: '#e74c3c', fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Permission Denied</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>{permModalMsg}</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowPermModal(false)}
              style={{ background: '#3498db', border: 'none', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaFileInvoiceDollar style={{ color: '#3498db', fontSize: '2rem' }} />
            Salary Receipts ({filteredSlips.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              style={{
                padding: '10px 15px',
                width: '250px',
                borderRadius: '50px',
                border: '2px solid #3498db',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              placeholder="🔍 Search by name, ID, month..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.3)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
            <button
              onClick={() => {
                if (!canCreate) {
                  setPermModalMsg("You do not have permission to create salary slips.");
                  setShowPermModal(true);
                  return;
                }
                navigate('/salary-slip');
              }}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(39, 174, 96, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.3)';
              }}
            >
              <FaPlus /> New Slip
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            padding: '15px 20px',
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            color: '#155724',
            marginBottom: '20px',
            borderRadius: '12px',
            border: '2px solid #c3e6cb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(39, 174, 96, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaCheck style={{ fontSize: '20px' }} /> {message}
            </div>
            <FaTimes style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setMessage('')} />
          </div>
        )}
        {error && (
          <div style={{
            padding: '15px 20px',
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            color: '#721c24',
            marginBottom: '20px',
            borderRadius: '12px',
            border: '2px solid #f5c6cb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaTimes style={{ fontSize: '20px' }} /> {error}
            </div>
            <FaTimes style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setError('')} />
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#3498db' }}>Loading Slips...</div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', borderTopLeftRadius: '10px' }}>ID</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Month</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Gross</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Deductions</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Net Pay</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', borderTopRightRadius: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((s, i) => (
                  <tr
                    key={s._id}
                    style={{
                      background: i % 2 === 0 ? '#f8f9fa' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : 'white'}
                  >
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#2c3e50', fontWeight: '500' }}>
                      {s.employeeIdCode || s.employeeId}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#2c3e50', fontWeight: '500' }}>
                      {s.employeeName}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#555' }}>
                      {s.month}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'right', color: '#27ae60', fontWeight: '600' }}>
                      {currency} {formatCurrency(s.grossPay || s.grossSalary)}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'right', color: '#e74c3c', fontWeight: '600' }}>
                      {currency} {formatCurrency(s.totalDeductions)}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'right', color: '#2c3e50', fontWeight: '700', fontSize: '15px' }}>
                      {currency} {formatCurrency(s.netPay)}
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: s.status === 'Submitted' ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                        color: s.status === 'Submitted' ? '#155724' : '#856404',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: s.status === 'Submitted' ? '1px solid #c3e6cb' : '1px solid #ffeaa7'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            if (!canWrite) {
                              setPermModalMsg("You do not have permission to edit salary slips.");
                              setShowPermModal(true);
                              return;
                            }
                            navigate(`/salary-slip?id=${s._id}`);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600',
                            boxShadow: '0 2px 5px rgba(52, 152, 219, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          title="Edit"
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handlePrint(s._id)}
                          style={{
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600',
                            boxShadow: '0 2px 5px rgba(243, 156, 18, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          title="Print"
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <FaPrint />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          style={{
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '600',
                            boxShadow: '0 2px 5px rgba(231, 76, 60, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          title="Delete"
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#95a5a6', fontSize: '16px', fontStyle: 'italic' }}>
                      No salary slips found. {searchQuery && `Try a different search term.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredSlips.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #e9ecef'
          }}>
            {Array.from({ length: totalPages }, (_, k) => (
              <button
                key={k}
                onClick={() => setCurrentPage(k + 1)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  border: currentPage === k + 1 ? '2px solid #3498db' : '2px solid #e9ecef',
                  background: currentPage === k + 1 ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' : 'white',
                  color: currentPage === k + 1 ? 'white' : '#2c3e50',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (currentPage !== k + 1) {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#3498db';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== k + 1) {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e9ecef';
                  }
                }}
              >
                {k + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
          }}>
            <div style={{ color: '#e74c3c', fontSize: '3rem', marginBottom: '15px' }}>🗑️</div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Are you sure you want to delete this salary slip? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingId(null);
                }}
                style={{
                  background: '#95a5a6', color: '#fff', border: 'none', borderRadius: '50px',
                  padding: '10px 25px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50px',
                  padding: '10px 25px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryReceiptList;
