// Full BearerLoginPage.jsx - UPDATED for strict branch-scoped data isolation + NORMAL SVG EYE ICON (no emoji, clean normal icon, subtle gray color only)
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../Context/UserContext';
import axios from 'axios';
import { FaClipboardList, FaUtensils, FaDesktop, FaChartLine, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import './BearerLoginPage.css';

// Define Page Mappings
const PAGE_MAPPINGS = [
  { id: 'opening', path: '/opening-entry' },
  { id: 'closing', path: '/closing-entry' },
  { id: 'dashboard', path: '/dashboard' },
  { id: 'home', path: '/home' },
  { id: 'tables', path: '/table' },
  { id: 'pos', path: '/salespage' },
  { id: 'cash', path: '/cash' },
  { id: 'card', path: '/card' },
  { id: 'active_orders', path: '/active-orders' },
  { id: 'kitchen', path: '/kitchen' },
  { id: 'saved_orders', path: '/savedorders' },
  { id: 'customer_list', path: '/customers' },
  { id: 'create_customer', path: '/create-customer' },
  { id: 'employee_list', path: '/employee-list' },
  { id: 'add_employee', path: '/add-employee' },
  { id: 'sales_report', path: '/sales-reports' },
  { id: 'trip_report', path: '/trip-report' },
  { id: 'pos_balance', path: '/pos-balance' },
  { id: 'system_settings', path: '/system-settings' },
  { id: 'company_details', path: '/company-details' },
  { id: 'item_list', path: '/items' },
  { id: 'create_item', path: '/create-item' },
  { id: 'schedule_master', path: '/schedule-master' },
  { id: 'roaster', path: '/roaster' },
  { id: 'leave_apply', path: '/leave-apply' },
  { id: 'vehicle_management', path: '/vehicle-management' },
  { id: 'frontpage', path: '/frontpage' },
  { id: 'bearer', path: '/bearer' },
  { id: 'admin', path: '/admin' }
];

function BearerLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('error');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('Unknown');

  // Password hide/show toggle state
  const [showPassword, setShowPassword] = useState(false);

  // Selection States
  const [showSelection, setShowSelection] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [tempLoginResponse, setTempLoginResponse] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('/api/network_info');
        if (response.data && response.data.database_status) {
          setDbStatus(response.data.database_status);
        }
      } catch (err) {
        setDbStatus('Unreachable');
      }
    };
    checkStatus();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setWarningMessage('');
    try {
      const response = await axios.post('/api/login', {
        email,
        password,
      });
      let { user, token, tenants, companies, branches } = response.data;

      // If the backend sent them at the top level, merge them into the user object
      if (tenants) user.tenants = tenants;
      if (companies) user.companies = companies;
      if (branches) user.branches = branches;

      localStorage.setItem('token', token);
      const primaryCompany = user.company || user.company_name || '';

      // Normalize companies
      const rawCompanies = user.companies || [];
      const cleanCompanies = rawCompanies.map(c => {
        if (typeof c === 'object' && c !== null) {
          const compName = c.company_name || c.company || c.name || '';
          return typeof compName === 'string' ? compName : String(compName);
        }
        return typeof c === 'string' ? c : String(c);
      }).filter(c => c && c !== 'null' && c !== 'undefined' && c !== '[object Object]');
      const fallbackCompanies = Array.from(new Set([...cleanCompanies, primaryCompany].filter(Boolean)));

      // Normalize branches
      const rawBranches = user.branches || [];
      const cleanBranches = rawBranches.map(b => {
        if (typeof b === 'object' && b !== null) {
          const bName = b.branch_name || b.branch || b.name || '';
          const cName = b.company_name || b.company || primaryCompany;
          return {
            company: typeof cName === 'string' ? cName : String(cName),
            branch: typeof bName === 'string' ? bName : String(bName)
          };
        }
        return { company: primaryCompany, branch: typeof b === 'string' ? b : String(b) };
      }).filter(b => b.branch && b.branch !== 'null' && b.branch !== 'undefined' && b.branch !== '' && b.branch !== '[object Object]');

      // --- NEW STRICT REDIRECTION LOGIC (UPDATED) ---
      const isGroupAdmin = user.role === 'group_admin' || user.role === 'groupadmin' || user.role === 'Super Admin' || user.role === 'Tenant Admin';
      const isCompanyAdmin = user.role === 'Company Admin';

      let forceSelection = false;
      const isSuperUser = user.role === 'admin' || user.role === 'Super Admin' || user.role === 'group_admin' || user.role === 'groupadmin' || user.role === 'Tenant Admin';

      if (isSuperUser) {
        forceSelection = false;
      } else if (fallbackCompanies.length > 1) {
        forceSelection = true;
      } else if (!isGroupAdmin && !isCompanyAdmin && !primaryCompany && cleanBranches.length > 1 && !user.branch) {
        // Normal staff with multiple branches still need to pick a branch for their shift
        forceSelection = true;
      }

      if (forceSelection) {
        setTempUser(user);
        setTempLoginResponse(response.data);
        setAvailableCompanies(fallbackCompanies);
        setAvailableBranches(cleanBranches);

        let defaultCompany = fallbackCompanies.includes(primaryCompany) ? primaryCompany : (fallbackCompanies[0] || '');
        if (isGroupAdmin && fallbackCompanies.length > 1) {
          defaultCompany = 'All';
        }
        setSelectedCompany(defaultCompany);

        const firstBranch = defaultCompany === 'All' ? null : cleanBranches.find(b => b.company === defaultCompany);
        setSelectedBranch('All Branches');
        setShowSelection(true);
      } else {
        let finalCompany = primaryCompany || fallbackCompanies[0] || 'POS 8';
        if (isGroupAdmin && fallbackCompanies.length > 1) {
          finalCompany = 'All';
        }

        let finalBranch = user.branch || user.branch_name ||
          (cleanBranches.length === 1 ?
            (typeof cleanBranches[0] === 'object' ? cleanBranches[0].branch : cleanBranches[0])
            : '');

        if (isGroupAdmin || isCompanyAdmin) {
          finalBranch = 'All Branches';
        }

        finalizeLogin(user, response.data, finalCompany, finalBranch);
      }
    } catch (err) {
      setWarningMessage(err.response?.data?.error || 'Login failed.');
      setWarningType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionSubmit = () => {
    if (!selectedCompany) {
      setWarningMessage('Please select a company');
      setWarningType('warning');
      return;
    }
    const branchesForCompany = availableBranches.filter(b => b.company === selectedCompany);
    if (branchesForCompany.length > 0 && !selectedBranch) {
      setWarningMessage('Please select a branch to continue');
      setWarningType('warning');
      return;
    }
    finalizeLogin(tempUser, tempLoginResponse, selectedCompany, selectedBranch);
  };

  const finalizeLogin = (user, loginData, company, branch) => {
    localStorage.setItem('active_tenant_id', user.tenant_id || '');
    localStorage.setItem('active_company_id', user.company_id || '');
    localStorage.setItem('active_branch_id', user.branch_id || '');
    localStorage.setItem('active_tenant_name', user.tenant_name || '');
    localStorage.setItem('active_company', company);
    localStorage.setItem('active_branch', branch);
    localStorage.setItem('pos_profile', user.pos_profile || 'POS-001');

    const finalCompanies = (user.companies || []).map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
    const finalBranches = (user.branches || []).map(b => typeof b === 'object' && b !== null ? (b.branch_name || b.branch || b.name || '') : b).filter(b => b && typeof b === 'string');

    const updatedUser = { ...user, company, branch, companies: finalCompanies, branches: finalBranches };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setWarningMessage('Login Successful!');
    setWarningType('success');
    localStorage.removeItem('user_permissions');

    setTimeout(() => {
      if (isAdminLogin) {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    }, 1000);
  };

  const branchesForSelectedCompany = selectedCompany === 'All' ? [] : availableBranches.filter(b => {
    const bComp = b.company || '';
    return bComp === selectedCompany;
  });
  const branchRequired = selectedCompany !== 'All' && branchesForSelectedCompany.length > 0;
  const canProceed = selectedCompany === 'All' || !branchRequired || (!!selectedBranch && selectedBranch !== '');

  return (
    <div className="login-page-wrapper">
      {/* Alert Component */}
      {warningMessage && (
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: warningType === 'success' ? '#dcfce7' : warningType === 'warning' ? '#fef3c7' : '#fee2e2',
          border: `2px solid ${warningType === 'success' ? '#4ade80' : warningType === 'warning' ? '#fcd34d' : '#f87171'}`,
          color: warningType === 'success' ? '#166534' : warningType === 'warning' ? '#92400e' : '#991b1b',
          padding: '16px 32px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          fontSize: '18px',
          fontWeight: '600',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          <span>{warningMessage}</span>
          <button 
            onClick={() => setWarningMessage('')}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'inherit',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >X</button>
        </div>
      )}
      {/* Server Status Badge */}
      <div className="status-badge" style={{
        backgroundColor: dbStatus === 'Connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: dbStatus === 'Connected' ? '#047857' : '#b91c1c',
        border: `1px solid ${dbStatus === 'Connected' ? '#10b981' : '#ef4444'}`
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: dbStatus === 'Connected' ? '#10b981' : '#ef4444'
        }} />
        {dbStatus}
      </div>

      <div className="login-left-panel">
        <div className="left-logo-container">
          <div className="left-logo-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M12 2a5 5 0 0 0-5 5c0 1.25.46 2.39 1.22 3.28C6.91 10.87 6 12.33 6 14v1a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1c0-1.67-.91-3.13-2.22-3.72A6.52 6.52 0 0 0 17 7a5 5 0 0 0-5-5z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 20h14" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 14h6" strokeOpacity="0.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="left-logo-text">Dine-8 POS</div>
        </div>

        <div className="features-container">
          <div className="feature-item">
            <div className="feature-icon-wrapper"><FaClipboardList size={20} /></div>
            <div className="feature-text">
              <h3>Order Management</h3>
              <p>Streamline dine-in, takeaway, and delivery orders effortlessly in one centralized place.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper"><FaUtensils size={20} /></div>
            <div className="feature-text">
              <h3>Table Tracking</h3>
              <p>Manage table statuses, reservations, and billing in real-time with smart layouts.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper"><FaDesktop size={20} /></div>
            <div className="feature-text">
              <h3>Kitchen Display</h3>
              <p>Send orders directly to the kitchen and reduce waiting times with automated routing.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper"><FaChartLine size={20} /></div>
            <div className="feature-text">
              <h3>Real-time Reports</h3>
              <p>Get live insights on revenue, staff performance, and top-selling items.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-form-container">
          {!showSelection ? (
            <>
              <div className="login-header">
                <h1>Welcome back</h1>
                <p>Sign in to your Dine-8 POS account</p>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="user@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    {showPassword ? <FaEyeSlash className="input-icon" style={{ zIndex: 1 }} /> : <FaEye className="input-icon" style={{ zIndex: 1 }} />}
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Hidden admin toggle preserved for logic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '15px', fontWeight: '600' }}>
                   <input 
                     type="checkbox" 
                     checked={isAdminLogin} 
                     onChange={(e) => setIsAdminLogin(e.target.checked)} 
                     id="admin-check"
                     style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#5949d6' }} 
                   />
                   <label htmlFor="admin-check" style={{color: '#475569', cursor: 'pointer'}}>Login as Admin</label>
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="divider">OR</div>

              <button className="google-button">
                <FcGoogle className="google-icon" />
                Sign in with Google
              </button>

              <div className="register-link">
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Register Now</a>
              </div>
            </>
          ) : (
            <>
              {/* Branch/Company Selection Form inside Right Panel */}
              <div className="login-header">
                <h1>Select Workspace</h1>
                <p>Choose your company and branch</p>
              </div>

              <div className="form-group">
                <label className="form-label">Company</label>
                <div className="input-wrapper">
                   <select
                    className="form-input"
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedBranch('All Branches');
                    }}
                    style={{ paddingLeft: '14px' }}
                  >
                    {(tempUser?.role === 'group_admin' || tempUser?.role === 'groupadmin' || tempUser?.role === 'Super Admin' || tempUser?.role === 'Tenant Admin') && availableCompanies.length > 1 && (
                      <option value="All">All Companies (Aggregate View)</option>
                    )}
                    <option value="">-- Choose Company --</option>
                    {availableCompanies.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {branchRequired && (
                <div className="form-group">
                  <label className="form-label">Branch <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="input-wrapper">
                    <select
                      className="form-input"
                      style={{ borderColor: !selectedBranch ? '#ef4444' : '#e2e8f0', paddingLeft: '14px' }}
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      {((tempUser?.role === 'group_admin' || tempUser?.role === 'groupadmin' || tempUser?.role === 'Super Admin' || tempUser?.role === 'Tenant Admin' || tempUser?.role === 'company_admin') && branchesForSelectedCompany.length > 1) && (
                        <option value="All Branches">All Branches</option>
                      )}
                      <option value="">-- Select Branch --</option>
                      {branchesForSelectedCompany.map((b, i) => (
                        <option key={i} value={typeof b === 'object' ? b.branch : b}>
                          {typeof b === 'object' ? b.branch : b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => setShowSelection(false)} style={{
                   flex: 1, padding: '14px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                 }}>Back</button>
                 <button onClick={handleSelectionSubmit} className="submit-button" style={{ flex: 1 }} disabled={!canProceed}>
                    Proceed
                 </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BearerLoginPage;
