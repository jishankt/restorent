import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';

/**
 * RegisterPage Component
 * Provides a tabbed interface for:
 * 1. Single Company Management
 * 2. Multiple Companies (Group Admin)
 * 3. Branch Management
 */
function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editCompany = location.state?.editCompany;

  // -- Core State --
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'branch', or 'multiple'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -- Standard Headers Helper --
  const getHeaders = (comp = null) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const token = localStorage.getItem('token');
    const activeContext = localStorage.getItem('active_company');
    
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const defaultCompany = user.company_name || user.company;
    
    // Resolve Company: Prioritize passed 'comp' > activeContext > user default
    const resolvedCompany = comp || activeContext || defaultCompany;
    if (resolvedCompany) {
      headers['X-Company-Name'] = resolvedCompany;
    }
    
    return headers;
  };

  // -- Data States --
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableBranches, setAvailableBranches] = useState({});

  // -- Form States --
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    adminUsername: '',
    adminPassword: '',
    isExisting: false
  });

  const [branchForm, setBranchForm] = useState({
    companyName: '',
    branchName: '',
    firstName: '',
    email: '',
    phone_number: '',
    username: '',
    password: '',
    isExisting: false
  });

  const [multipleForm, setMultipleForm] = useState({
    groupCompanyName: '',
    companies: [{ name: '', username: '', password: '', email: '' }],
    email: '',
    firstName: '',
    phone_number: '',
    username: '',
    password: ''
  });

  // --- API: Fetchers ---

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies-public', {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // Handle both old string array and new object array for backward compatibility
        setAvailableCompanies(data.map(c => {
          const name = typeof c === 'string' ? c : c.name;
          return { value: name, label: name };
        }));
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const fetchBranchesForCompany = async (companyName) => {
    if (!companyName) return;
    try {
      const response = await fetch(`/api/branches-public/${encodeURIComponent(companyName)}`, {
        headers: getHeaders(companyName)
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} branches for ${companyName}`, data);
        setAvailableBranches(prev => ({
          ...prev,
          [companyName]: data.map(b => ({ value: b, label: b }))
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to fetch branches for ${companyName}:`, errorData);
      }
    } catch (err) {
      console.error(`Failed to fetch branches for ${companyName}:`, err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    
    // Auto-populate form if editCompany state is passed
    if (editCompany) {
      if (editCompany.type === 'single' || editCompany.type === 'group_member') {
        setActiveTab('company');
        setCompanyForm(prev => ({ ...prev, name: editCompany.name, isExisting: true }));
        // Trigger handleCompanyChange-like behavior
        fetch(`/api/company-admin-details/${encodeURIComponent(editCompany.name)}`, { headers: getHeaders(editCompany.name) })
          .then(res => res.json())
          .then(data => {
             setCompanyForm(prev => ({ 
               ...prev, 
               adminUsername: data.username || '', 
               adminPassword: data.password || '', // Using plain_password if available
               email: data.email || '' 
             }));
          }).catch(console.error);
      } else if (editCompany.type === 'group_admin') {
        setActiveTab('multiple');
        setMultipleForm(prev => ({ ...prev, groupCompanyName: editCompany.name, isExisting: true }));
        
        // Fetch group admin details
        fetch(`/api/company-admin-details/${encodeURIComponent(editCompany.name)}`, { headers: getHeaders(editCompany.name) })
          .then(res => res.json())
          .then(data => {
            setMultipleForm(prev => ({
              ...prev,
              firstName: data.firstName || '',
              username: data.username || '',
              password: data.password || '',
              email: data.email || '',
              phone_number: data.phone_number || ''
            }));
          }).catch(console.error);

        // Populate children companies
        if (editCompany.children && editCompany.children.length > 0) {
          Promise.all(editCompany.children.map(child => 
            fetch(`/api/company-admin-details/${encodeURIComponent(child.name)}`, { headers: getHeaders(child.name) })
              .then(res => res.json())
              .then(data => ({
                name: child.name,
                username: data.username || '',
                password: data.password || '',
                email: data.email || '',
                isExisting: true
              })).catch(() => ({
                name: child.name, username: '', password: '', email: '', isExisting: true
              }))
          )).then(populatedChildren => {
            setMultipleForm(prev => ({ ...prev, companies: populatedChildren }));
          });
        }
      }
      
      // Clear the state so a page refresh doesn't keep populating the form
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  // --- Handlers: Company Tab ---

  const handleCompanyChange = async (newValue) => {
    const name = newValue ? newValue.value : '';
    const isExisting = availableCompanies.some(c => c.value === name);

    setCompanyForm(prev => ({ ...prev, name, isExisting, adminUsername: '', adminPassword: '' }));
    setError('');
    setSuccess('');

    if (isExisting) {
      // Fetch admin username for selected company
      try {
        const response = await fetch(`/api/company-admin-details/${encodeURIComponent(name)}`, {
          headers: getHeaders(name)
        });
        if (response.ok) {
          const data = await response.json();
          setCompanyForm(prev => ({ ...prev, adminUsername: data.username || '', email: data.email || '' }));
        }
      } catch (err) {
        console.error("Failed to fetch admin details:", err);
      }
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (companyForm.isExisting) {
        // Update existing company
        response = await fetch(`/api/companies-public/${encodeURIComponent(companyForm.name)}`, {
          method: 'PUT',
          headers: getHeaders(companyForm.name),
          body: JSON.stringify({
            adminUsername: companyForm.adminUsername,
            adminPassword: companyForm.adminPassword,
            email: companyForm.email
          })
        });
      } else {
        // Create new company
        response = await fetch('/api/companies-public', {
          method: 'POST',
          headers: getHeaders(companyForm.name),
          body: JSON.stringify({
            company_name: companyForm.name,
            email: companyForm.email,
            adminUsername: companyForm.adminUsername,
            adminPassword: companyForm.adminPassword
          })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Operation failed');

      setSuccess(companyForm.isExisting ? 'Company profile updated successfully!' : 'Company created successfully!');
      setCompanyForm({ name: '', email: '', adminUsername: '', adminPassword: '', isExisting: false });
      fetchCompanies(); // Refresh list always after modify
      setTimeout(() => navigate('/manage-companies'), 1000);
    } catch (err) {
      setError(err.message);
      // Special focus if it's a password error
      if (err.message.toLowerCase().includes('password')) {
        console.warn("Password uniqueness error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyDelete = async () => {
    if (!companyForm.name || !window.confirm(`Are you sure you want to delete the company "${companyForm.name}" and all its associated data? This action cannot be undone.`)) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/companies-public/${encodeURIComponent(companyForm.name)}`, {
        method: 'DELETE',
        headers: getHeaders(companyForm.name)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete company');

      setSuccess('Company and associated data deleted successfully.');
      setCompanyForm({ name: '', email: '', adminUsername: '', adminPassword: '', isExisting: false });
      fetchCompanies(); // Refresh the list
      setTimeout(() => navigate('/manage-companies'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers: Branch Tab ---

  const handleBranchCompanySelect = (e) => {
    const companyName = e.target.value;
    setBranchForm({ ...branchForm, companyName, branchName: '', isExisting: false, username: '', password: '', firstName: '', email: '', phone_number: '' });
    fetchBranchesForCompany(companyName);
  };

  const handleBranchSelect = async (newValue) => {
    const name = newValue ? newValue.value : '';
    const isExisting = (availableBranches[branchForm.companyName] || []).some(b => b.value === name);

    setBranchForm(prev => ({ ...prev, branchName: name, isExisting, username: '', password: '', firstName: '', email: '', phone_number: '' }));
    setError('');
    setSuccess('');

    if (isExisting && name) {
      // Fetch branch user details
      try {
        const response = await fetch(`/api/branch-user-details/${encodeURIComponent(branchForm.companyName)}/${encodeURIComponent(name)}`, {
          headers: getHeaders(branchForm.companyName)
        });
        if (response.ok) {
          const data = await response.json();
          setBranchForm(prev => ({
            ...prev,
            firstName: data.firstName || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            username: data.username || ''
          }));
        }
      } catch (err) {
        console.error("Failed to fetch branch details:", err);
      }
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      const payload = {
        branch_name: branchForm.branchName,
        firstName: branchForm.firstName,
        email: branchForm.email,
        phone_number: branchForm.phone_number,
        username: branchForm.username,
        password: branchForm.password
      };

      if (branchForm.isExisting) {
        // Update Branch
        response = await fetch(`/api/branches-public/${encodeURIComponent(branchForm.companyName)}/${encodeURIComponent(branchForm.branchName)}`, {
          method: 'PUT',
          headers: getHeaders(branchForm.companyName),
          body: JSON.stringify(payload)
        });
      } else {
        // Create Branch
        response = await fetch(`/api/branches-public/${encodeURIComponent(branchForm.companyName)}`, {
          method: 'POST',
          headers: getHeaders(branchForm.companyName),
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Operation failed');

      setSuccess(branchForm.isExisting ? 'Branch credentials updated!' : 'Branch created successfully!');
      if (!branchForm.isExisting) fetchBranchesForCompany(branchForm.companyName);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchDelete = async () => {
    if (!branchForm.companyName || !branchForm.branchName || !window.confirm(`Are you sure you want to delete the branch "${branchForm.branchName}"? This will also remove associated branch local users.`)) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/branches-public/${encodeURIComponent(branchForm.companyName)}/${encodeURIComponent(branchForm.branchName)}`, {
        method: 'DELETE',
        headers: getHeaders(branchForm.companyName)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete branch');

      setSuccess('Branch deleted successfully.');
      const compName = branchForm.companyName;
      setBranchForm({ companyName: compName, branchName: '', isExisting: false, username: '', password: '', firstName: '', email: '', phone_number: '' });
      fetchBranchesForCompany(compName); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers: Multiple Companies Tab ---

  const handleAddMultipleCompany = () => {
    setMultipleForm(prev => ({ ...prev, companies: [...prev.companies, { name: '', username: '', password: '', email: '' }] }));
  };

  const handleRemoveMultipleCompany = (index) => {
    if (multipleForm.companies.length <= 1) return;
    const newComps = [...multipleForm.companies];
    newComps.splice(index, 1);
    setMultipleForm(prev => ({ ...prev, companies: newComps }));
  };

  const handleMultipleCompanyChange = (index, field, value) => {
    const newComps = [...multipleForm.companies];
    newComps[index][field] = value;
    setMultipleForm(prev => ({ ...prev, companies: newComps }));
  };

  const handleMultipleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        main_company: multipleForm.groupCompanyName,
        firstName: multipleForm.firstName,
        email: multipleForm.email,
        phone_number: multipleForm.phone_number,
        username: multipleForm.username,
        password: multipleForm.password,
        role: 'group_admin',
        companies: multipleForm.companies.filter(c => c.name.trim()).map(c => ({
           name: c.name.trim(),
           adminUsername: c.username.trim(),
           adminPassword: c.password.trim(),
           email: c.email.trim(),
           isExisting: c.isExisting || false
        })),
        branches: []
      };

      let response;
      if (multipleForm.isExisting) {
        response = await fetch(`/api/register/group/${encodeURIComponent(multipleForm.groupCompanyName)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Registration failed');

      setSuccess(`Group Admin and associated companies ${multipleForm.isExisting ? 'updated' : 'created'} successfully!`);
      setMultipleForm({ groupCompanyName: '', companies: [{ name: '', username: '', password: '', email: '', isExisting: false }], email: '', firstName: '', phone_number: '', username: '', password: '', isExisting: false });
      fetchCompanies();
      setTimeout(() => navigate('/manage-companies'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Styles ---

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: "20px",
      fontFamily: "'Inter', sans-serif"
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.05)",
      width: "100%",
      maxWidth: "700px",
      overflow: "hidden"
    },
    header: {
      padding: "30px 40px 10px 40px",
      textAlign: "center"
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "800",
      color: "#0f172a",
      marginBottom: "8px",
      letterSpacing: "-0.5px"
    },
    subtitle: {
      color: "#64748b",
      fontSize: "0.95rem"
    },
    tabs: {
      display: "flex",
      padding: "0 40px",
      borderBottom: "1px solid #e2e8f0",
      gap: "20px",
      flexWrap: "wrap"
    },
    tab: (active) => ({
      padding: "15px 5px",
      fontSize: "14px",
      fontWeight: "600",
      color: active ? "#0284c7" : "#64748b",
      borderBottom: active ? "3px solid #0284c7" : "3px solid transparent",
      cursor: "pointer",
      transition: "all 0.2s ease"
    }),
    formBody: {
      padding: "30px 40px"
    },
    group: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "8px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      backgroundColor: "#fff",
      color: "#1e293b",
      outline: "none",
      transition: "border-color 0.2s ease"
    },
    row: {
      display: "flex",
      gap: "20px"
    },
    buttonRow: {
      display: "flex",
      gap: "15px",
      marginTop: "10px"
    },
    button: (color = "#0284c7") => ({
      flex: 2,
      padding: "14px",
      backgroundColor: color,
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: `0 4px 12px ${color}33`,
    }),
    deleteButton: {
      flex: 1,
      padding: "14px",
      backgroundColor: "#fff",
      color: "#ef4444",
      border: "1px solid #fecaca",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    error: {
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      padding: "12px 16px",
      borderRadius: "10px",
      fontSize: "14px",
      marginBottom: "20px",
      border: "1px solid #fee2e2"
    },
    success: {
      backgroundColor: "#f0fdf4",
      color: "#15803d",
      padding: "12px 16px",
      borderRadius: "10px",
      fontSize: "14px",
      marginBottom: "20px",
      border: "1px solid #dcfce7"
    },
    linkButton: {
      width: "100%",
      padding: "12px",
      background: "none",
      border: "none",
      color: "#64748b",
      fontSize: "14px",
      fontWeight: "500",
      textDecoration: "underline",
      cursor: "pointer",
      marginTop: "15px"
    },
    addLink: {
      color: "#0284c7",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "inline-block",
      marginTop: "10px"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>System Registration</h1>
          <p style={styles.subtitle}>Manage your enterprise workspace settings</p>
        </div>

        <div style={styles.tabs}>
          <div
            style={styles.tab(activeTab === 'company')}
            onClick={() => { setActiveTab('company'); setError(''); setSuccess(''); }}
          >
            Single Company
          </div>
          <div
            style={styles.tab(activeTab === 'multiple')}
            onClick={() => { setActiveTab('multiple'); setError(''); setSuccess(''); }}
          >
            Multiple Companies
          </div>
          <div
            style={styles.tab(activeTab === 'branch')}
            onClick={() => { setActiveTab('branch'); setError(''); setSuccess(''); }}
          >
            Branches & Logins
          </div>
        </div>

        <div style={styles.formBody}>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {activeTab === 'company' ? (
            <form onSubmit={handleCompanySubmit}>
              <div style={styles.group}>
                <label style={styles.label}>Company Level Name</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <CreatableSelect
                      isClearable
                      value={companyForm.name ? { label: companyForm.name, value: companyForm.name } : null}
                      onChange={handleCompanyChange}
                      options={availableCompanies}
                      placeholder="Type or select company..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "12px",
                          borderColor: "#e2e8f0",
                          padding: "2px",
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#cbd5e1' }
                        }),
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Admin Email Address (Unique ID)</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  placeholder="e.g. admin@company.com"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>Master Admin Username</label>
                  <input
                    type="text"
                    value={companyForm.adminUsername}
                    onChange={(e) => setCompanyForm({ ...companyForm, adminUsername: e.target.value })}
                    placeholder="e.g. admin"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>
                    {companyForm.isExisting ? "Update Password" : "Master Password"}
                  </label>
                  <input
                    type="password"
                    value={companyForm.adminPassword}
                    onChange={(e) => setCompanyForm({ ...companyForm, adminPassword: e.target.value })}
                    placeholder="••••••••"
                    style={styles.input}
                    required={!companyForm.isExisting}
                  />
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={styles.button()}
                  disabled={isLoading || !companyForm.name}
                >
                  {isLoading ? "Processing..." : companyForm.isExisting ? "Update Profile" : "Create New Company"}
                </button>
                {companyForm.isExisting && (
                  <button
                    type="button"
                    onClick={handleCompanyDelete}
                    style={styles.deleteButton}
                    disabled={isLoading}
                  >
                    Delete Company
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" style={styles.button("#64748b")} onClick={() => navigate('/manage-companies')}>Manage Companies</button>
              </div>
            </form>
          ) : activeTab === 'multiple' ? (
            <form onSubmit={handleMultipleSubmit}>
              <div style={styles.group}>
                <label style={styles.label}>Companies to Manage</label>
                {multipleForm.companies.map((comp, idx) => (
                  <div key={idx} style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    marginBottom: '20px',
                    position: 'relative',
                    backgroundColor: '#f8fafc'
                  }}>
                    {multipleForm.companies.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMultipleCompany(idx)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >✕</button>
                    )}
                    <div style={styles.group}>
                      <label style={styles.label}>Company {idx + 1} Name</label>
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleMultipleCompanyChange(idx, 'name', e.target.value)}
                        placeholder="Company Name"
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={styles.row}>
                      <div style={{ ...styles.group, flex: 1 }}>
                        <label style={styles.label}>Admin Username</label>
                        <input
                          type="text"
                          value={comp.username}
                          onChange={(e) => handleMultipleCompanyChange(idx, 'username', e.target.value)}
                          placeholder="Admin Username"
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={{ ...styles.group, flex: 1 }}>
                        <label style={styles.label}>Admin Email</label>
                        <input
                          type="email"
                          value={comp.email}
                          onChange={(e) => handleMultipleCompanyChange(idx, 'email', e.target.value)}
                          placeholder="admin@company.com"
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={{ ...styles.group, flex: 1 }}>
                        <label style={styles.label}>Admin Password</label>
                        <input
                          type="password"
                          value={comp.password}
                          onChange={(e) => handleMultipleCompanyChange(idx, 'password', e.target.value)}
                          placeholder="••••••••"
                          style={styles.input}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <span style={styles.addLink} onClick={handleAddMultipleCompany}>+ Add Another Company</span>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Main Group / Parent Company Name</label>
                <input
                  type="text"
                  value={multipleForm.groupCompanyName}
                  onChange={(e) => setMultipleForm({ ...multipleForm, groupCompanyName: e.target.value })}
                  placeholder="e.g. My Global Enterprise"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>Group Admin Name</label>
                  <input
                    type="text"
                    value={multipleForm.firstName}
                    onChange={(e) => setMultipleForm({ ...multipleForm, firstName: e.target.value })}
                    placeholder="Full Name"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    value={multipleForm.phone_number}
                    onChange={(e) => setMultipleForm({ ...multipleForm, phone_number: e.target.value })}
                    placeholder="Contact info"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Admin Email</label>
                <input
                  type="email"
                  value={multipleForm.email}
                  onChange={(e) => setMultipleForm({ ...multipleForm, email: e.target.value })}
                  placeholder="admin@group.com"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>Shared Username</label>
                  <input
                    type="text"
                    value={multipleForm.username}
                    onChange={(e) => setMultipleForm({ ...multipleForm, username: e.target.value })}
                    placeholder="Group Admin Username"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={{ ...styles.group, flex: 1 }}>
                  <label style={styles.label}>Shared Password</label>
                  <input
                    type="password"
                    value={multipleForm.password}
                    onChange={(e) => setMultipleForm({ ...multipleForm, password: e.target.value })}
                    placeholder="••••••••"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={styles.button("#0284c7")}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : multipleForm.isExisting ? "Update Group" : "Create Multi-Company Group"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBranchSubmit}>
              <div style={styles.group}>
                <label style={styles.label}>Select Parent Company</label>
                <select
                  value={branchForm.companyName}
                  onChange={handleBranchCompanySelect}
                  style={styles.input}
                  required
                >
                  <option value="">Select Company</option>
                  {availableCompanies.map((c, i) => (
                    <option key={i} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Branch Name</label>
                <CreatableSelect
                  isClearable
                  isDisabled={!branchForm.companyName}
                  value={branchForm.branchName ? { label: branchForm.branchName, value: branchForm.branchName } : null}
                  onChange={handleBranchSelect}
                  options={availableBranches[branchForm.companyName] || []}
                  placeholder="Select or Type Branch..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "12px",
                      borderColor: "#e2e8f0",
                      padding: "2px",
                      backgroundColor: branchForm.companyName ? "#fff" : "#f1f5f9"
                    }),
                  }}
                />
              </div>

              {branchForm.branchName && (
                <>
                  <div style={styles.row}>
                    <div style={{ ...styles.group, flex: 1 }}>
                      <label style={styles.label}>Authorized Name</label>
                      <input
                        type="text"
                        value={branchForm.firstName}
                        onChange={(e) => setBranchForm({ ...branchForm, firstName: e.target.value })}
                        placeholder="Manager Name"
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={{ ...styles.group, flex: 1 }}>
                      <label style={styles.label}>Contact Phone</label>
                      <input
                        type="text"
                        value={branchForm.phone_number}
                        onChange={(e) => setBranchForm({ ...branchForm, phone_number: e.target.value })}
                        placeholder="Phone"
                        style={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.group}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      placeholder="branch@email.com"
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.row}>
                    <div style={{ ...styles.group, flex: 1 }}>
                      <label style={styles.label}>Login Username</label>
                      <input
                        type="text"
                        value={branchForm.username}
                        onChange={(e) => setBranchForm({ ...branchForm, username: e.target.value })}
                        placeholder="Username"
                        style={styles.input}
                        required
                      />
                    </div>
                    <div style={{ ...styles.group, flex: 1 }}>
                      <label style={styles.label}>
                        {branchForm.isExisting ? "Update Password" : "Login Password"}
                      </label>
                      <input
                        type="password"
                        value={branchForm.password}
                        onChange={(e) => setBranchForm({ ...branchForm, password: e.target.value })}
                        placeholder="••••••••"
                        style={styles.input}
                        required={!branchForm.isExisting}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  style={styles.button("#059669")}
                  disabled={isLoading || !branchForm.branchName}
                >
                  {isLoading ? "Processing..." : branchForm.isExisting ? "Update Credentials" : "Initialize Branch"}
                </button>
                {branchForm.isExisting && (
                  <button
                    type="button"
                    onClick={handleBranchDelete}
                    style={{ ...styles.deleteButton, flex: 1 }}
                    disabled={isLoading}
                  >
                    Delete Branch
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" style={styles.button("#64748b")} onClick={() => navigate('/manage-branches')}>Manage Branches</button>
              </div>
            </form>
          )}

          <button type="button" style={styles.linkButton} onClick={() => navigate('/')}>
            Ready to log in? Back to Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
