import os

with open('top_part.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_imports = "import { FaClipboardList, FaUtensils, FaDesktop, FaChartLine, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';\nimport { FcGoogle } from 'react-icons/fc';\n"
lines.insert(5, new_imports)

return_jsx = """  return (
    <div className="login-page-wrapper">
      {/* Alert Component */}
      {warningMessage && (
        <div className="alert-float">
          <span>{warningMessage}</span>
          <button onClick={() => setWarningMessage('')}>X</button>
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

                <div className="options-row">
                  <label className="remember-me">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>

                {/* Hidden admin toggle preserved for logic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
                   <input type="checkbox" checked={isAdminLogin} onChange={(e) => setIsAdminLogin(e.target.checked)} id="admin-check" />
                   <label htmlFor="admin-check" style={{color: '#64748b'}}>Login as Admin</label>
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
                Don't have an account? <a href="/onboard-organization">Register Now</a>
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
"""

with open('c:/manoj/frontend/restaurant-pos-FE/src/components/BearerLoginPage.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
    f.write(return_jsx)

print("Rewrite complete.")
