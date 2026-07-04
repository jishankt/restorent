// BackupPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaTable } from 'react-icons/fa';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
function BackupPage() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [maxBackups, setMaxBackups] = useState(parseInt(localStorage.getItem('numberOfBackups')) || 5);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('warning');
  const [pendingAction, setPendingAction] = useState(null);
  const [backupInterval, setBackupInterval] = useState(6);
  const [newInterval, setNewInterval] = useState(6);
  const [baseUrl, setBaseUrl] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);
  
  // Branch & Multi-tenancy State
  const [branches, setBranches] = useState([]);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [selectedBackupTypes, setSelectedBackupTypes] = useState(['all']);
  // Permissions
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");

  const fetchPermissions = async (currentBaseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const roleRaw = userObj.role || userObj.UserType || '';
        
        const isAdminRole = checkIsAdmin(userObj);
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);
        
        setUserRole(roleRaw);

        if (roleRaw) {
          const url = `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`;
          const response = await axios.get(url);
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'backup');

          if (isAdminRole || isGroupAdminRole) {
            setCanRead(true);
            setCanWrite(true);
            setCanDelete(true);
            setCanCreate(true);
          } else if (pagePerm) {
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
            setCanDelete(pagePerm.canDelete === true);
            setCanCreate(pagePerm.canCreate === true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermsLoading(false);
    }
  };

  const fetchBranches = async (currentBaseUrl, targetCompany = null) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const company_name = targetCompany || (selectedCompanies.length > 0 ? selectedCompanies.join(',') : "") || userObj.company || "";
      
      if (!company_name) {
        setBranches([]);
        return;
      }

      const response = await axios.get(`${currentBaseUrl || baseUrl}/api/branches`, {
        headers: { 'X-Company-Name': company_name }
      });
      setBranches(response.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };
  const computeTotalHours = (opening, closing) => {
    if (!opening || !closing) return 0;
    const [oh, om] = opening.split(':').map(Number);
    const [ch, cm] = closing.split(':').map(Number);
    let totalMin = (ch * 60 + cm) - (oh * 60 + om);
    if (totalMin < 0) totalMin += 1440;
    return totalMin / 60;
  };
  const totalHours = companyDetails ? computeTotalHours(companyDetails.openingTime, companyDetails.closingTime) : 0;
  const extendedHours = totalHours + 2;
  const numBackupsPreview = newInterval > 0 ? Math.floor(extendedHours / newInterval) : 0;
  useEffect(() => {
    const fetchConfig = async () => {
      let currentBaseUrl = "";
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          currentBaseUrl = `http://${appConfig.server_ip}:6034`;
          setBaseUrl(currentBaseUrl);
        } else {
          setBaseUrl("");
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl("");
      } finally {
        // Fetch data using currentBaseUrl
        fetchBackupInfo(currentBaseUrl);
        fetchBackupInterval(currentBaseUrl);
        fetchCompanyDetails(currentBaseUrl);
        fetchPermissions(currentBaseUrl);
        // Initialize Multi-tenant context
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role);
          const comps = userObj.companies || (userObj.company ? [userObj.company] : []);
          setAssignedCompanies(comps);
          const initialComp = (userObj.role === 'group_admin') ? "" : (userObj.company || (comps.length > 0 ? comps[0] : ""));
          setSelectedCompanies(initialComp ? [initialComp] : []);
          if (initialComp) {
            fetchBranches(currentBaseUrl, initialComp);
            fetchBackupInfo(currentBaseUrl, initialComp);
          } else if (userObj.role === 'group_admin') {
            // For group admins, we don't fetch branches or backup info until companies are selected
            setBranches([]);
            setBackups([]);
          }
        }
        // Set maxBackups from localStorage (local operation, no URL needed)
        const storedMax = parseInt(localStorage.getItem('numberOfBackups')) || 5;
        setMaxBackups(storedMax);
      }
    };
    fetchConfig();
  }, []);
  const fetchCompanyDetails = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (response.data.companyDetails && response.data.companyDetails.length > 0) {
        const latest = response.data.companyDetails[response.data.companyDetails.length - 1];
        setCompanyDetails(latest);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };
  const fetchBackupInterval = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/get-backup-interval`);
      setBackupInterval(response.data.interval);
      setNewInterval(response.data.interval);
    } catch (error) {
      console.error('Error fetching backup interval:', error);
      setWarningMessage(`Failed to fetch backup interval: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleSetInterval = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to change backup settings.");
      setShowPermModal(true);
      return;
    }
    try {
      await axios.post(`${baseUrl}/api/set-backup-interval`, { interval: newInterval });
      setBackupInterval(newInterval);
      setWarningMessage('Backup interval updated successfully!');
      setWarningType('success');
    } catch (error) {
      console.error('Error setting backup interval:', error);
      setWarningMessage(`Failed to set backup interval: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage('');
    setWarningType('warning');
  };
  const fetchBackupInfo = async (currentBaseUrl, targetCompany = null) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const company_name = targetCompany || (selectedCompanies.length > 0 ? selectedCompanies.join(',') : "") || userObj.company;
      
      if (!company_name || company_name.toLowerCase() === 'all companies') {
        setBackups([]);
        return;
      }

        const isAdmin = checkIsAdmin(userObj);
        const isGlobal = checkIsGlobalAdmin(userObj);

        const headers = {
          'X-Company-Name': company_name,
          'X-Branch-Name': (isAdmin || isGlobal) ? (selectedBranches.length > 0 ? selectedBranches.join(',') : "") : (userObj.branch_name || "")
        };


      const response = await axios.get(`${currentBaseUrl || baseUrl}/api/backup-info`, { headers });
      const sortedData = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const limitedData = sortedData.slice(0, maxBackups);
      setBackups(limitedData);
    } catch (error) {
      console.error('Error fetching backup info:', error);
      setWarningMessage(`Failed to fetch backup info: ${error.message}`);
      setWarningType('warning');
    }
  };
  const handleGoBack = () => {
    navigate('/admin');
  };
  const handleBackup = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to create backups.");
      setShowPermModal(true);
      return;
    }
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const companyHeaders = selectedCompanies.length > 0 ? selectedCompanies.join(',') : (userObj.company || "");
      const branchHeaders = selectedBranches.length > 0 ? selectedBranches.join(',') : (userObj.branch_name || "");

      const isAdmin = checkIsAdmin(userObj);
      const isGlobal = checkIsGlobalAdmin(userObj);

      const headers = {
        'X-Company-Name': companyHeaders,
        'X-Branch-Name': (isAdmin || isGlobal) ? branchHeaders : userObj.branch_name,
        'X-Backup-Collections': selectedBackupTypes.length > 0 ? selectedBackupTypes.join(',') : 'all'
      };

      const response = await axios.get(`${baseUrl}/api/backup-to-excel`, {
        responseType: 'blob',
        headers: headers
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const filename = `backup_restaurant_data_${timestamp}.xlsx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setWarningMessage('Backup created successfully! Excel file downloaded and sent to configured email.');
      setWarningType('success');
      setPendingAction(() => () => fetchBackupInfo(baseUrl));
    } catch (error) {
      console.error('Backup error:', error);
      let errorMessage = 'Failed to create backup';
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.error || text;
        } catch (e) {
          console.error("Failed to parse blob error response", e);
        }
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setWarningMessage(errorMessage);
      setWarningType('warning');
    }
  };
  const handleDownloadBackup = async (filename) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to download backups.");
      setShowPermModal(true);
      return;
    }
    try {
      const response = await axios.post(`${baseUrl}/api/download-backup`, { filename }, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setWarningMessage('Backup downloaded successfully!');
      setWarningType('success');
    } catch (error) {
      console.error('Download backup error:', error);
      let errorMessage = 'Failed to download backup';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setWarningMessage(errorMessage);
      setWarningType('warning');
    }
  };
  const handleSetMaxBackups = (newMax) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to change backup settings.");
      setShowPermModal(true);
      return;
    }
    setMaxBackups(newMax);
    localStorage.setItem('numberOfBackups', newMax);
    fetchBackupInfo(baseUrl); // Refresh the list with new limit using baseUrl
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
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isGlobalRole = checkIsGlobalAdmin(userObj);
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
          <p>You do not have permission to view Backup Management.</p>
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Centered Permission Denied Modal */}
      {showPermModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '40px', borderRadius: '24px', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '450px', width: '90%',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔐</div>
            <h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '1.8rem' }}>Access Restricted</h3>
            <p style={{ color: '#636e72', marginBottom: '30px', lineHeight: '1.6' }}>{permModalMsg}</p>
            <button
              onClick={() => setShowPermModal(false)}
              style={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                border: 'none', borderRadius: '12px', padding: '12px 40px',
                fontWeight: 'bold', color: '#fff', cursor: 'pointer',
                boxShadow: '0 8px 15px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Understand
            </button>
          </div>
        </div>
      )}

      {/* Back Button Styled like CustomerListPage */}
      <button
        onClick={handleGoBack}
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

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#2c3e50',
            marginBottom: '10px',
            background: 'linear-gradient(to right, #2c3e50, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            System Backup Center
          </h1>
          <p style={{ color: '#636e72', fontSize: '1.1rem' }}>
            Manage your restaurant data backups and configuration
          </p>
        </div>

        {/* Status Alerts */}
        {warningMessage && (
          <div className={`status-alert ${warningType}`} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 25px',
            borderRadius: '16px',
            marginBottom: '30px',
            animation: 'slideIn 0.5s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.4rem' }}>
                {warningType === 'success' ? '✅' : '⚠️'}
              </span>
              <span style={{ fontWeight: '500' }}>{warningMessage}</span>
            </div>
            <button onClick={handleWarningOk} className="alert-ok-btn">Dismiss</button>
          </div>
        )}

        {/* Main Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '30px' }}>

          {/* Create Backup Card - Hero */}
          <div className="glass-card hero-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 30px' }}>
            <div style={{
              width: '80px', height: '80px', background: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 25px', color: '#3498db', fontSize: '2.2rem'
            }}>
              📦
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#2c3e50', marginBottom: '15px' }}>Instant Data Snapshot</h2>
            <p style={{ color: '#636e72', maxWidth: '500px', margin: '0 auto 30px', lineHeight: '1.6' }}>
              Create a comprehensive backup of all restaurant records, menus, and transactions. An Excel report will be generated and mailed.
            </p>
            <button className="primary-gradient-btn" onClick={handleBackup}>
              Generate New System Backup
            </button>
          </div>

          {isGlobalRole && (


            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '25px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '24px', border: '1px solid rgba(52, 152, 219, 0.1)' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#2980b9', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🏢 TARGET COMPANIES SELECTION:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '20px', 
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllBackupComps"
                    checked={selectedCompanies.length === assignedCompanies.length && assignedCompanies.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCompanies(assignedCompanies);
                        fetchBranches(baseUrl, assignedCompanies.join(','));
                        fetchBackupInfo(baseUrl, assignedCompanies.join(','));
                      } else {
                        setSelectedCompanies([]);
                        setBranches([]);
                        setSelectedBranches([]);
                        setBackups([]);
                      }
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3498db' }}
                  />
                  <label htmlFor="selectAllBackupComps" style={{ fontWeight: '700', fontSize: '1rem', cursor: 'pointer', color: '#2c3e50' }}>ENABLE ALL ASSIGNED COMPANIES</label>
                </div>

                {assignedCompanies.map((comp, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    minWidth: '220px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: selectedCompanies.includes(comp) ? 'rgba(52, 152, 219, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      id={`comp-backup-${idx}`}
                      checked={selectedCompanies.includes(comp)}
                      onChange={(e) => {
                        let newComps;
                        if (e.target.checked) {
                          newComps = [...selectedCompanies, comp];
                        } else {
                          newComps = selectedCompanies.filter(c => c !== comp);
                        }
                        setSelectedCompanies(newComps);
                        if (newComps.length > 0) {
                          fetchBranches(baseUrl, newComps.join(','));
                          fetchBackupInfo(baseUrl, newComps.join(','));
                        } else {
                          setBranches([]);
                          setSelectedBranches([]);
                          setBackups([]);
                        }
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3498db' }}
                    />
                    <label htmlFor={`comp-backup-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#34495e', fontWeight: selectedCompanies.includes(comp) ? '600' : '400' }}>{comp}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADAPTIVE BRANCH UI: Visible for Company Admins or when Companies are selected for Group Admin */}
          {branches.length > 0 && (selectedCompanies.length > 0 || !isGlobalRole) && (isAdminRole || isGlobalRole) && (


            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '25px', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '24px', border: '1px solid rgba(46, 204, 113, 0.1)' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#27ae60', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📍 TARGET BRANCHES SELECTION:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '20px', 
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllBackupBranches"
                    checked={selectedBranches.length === branches.length && branches.length > 0}
                    onChange={(e) => {
                      const newBranches = e.target.checked ? branches.map(b => b.branch_name || b) : [];
                      setSelectedBranches(newBranches);
                      // Trigger backup info refresh when branches change
                      setTimeout(() => fetchBackupInfo(baseUrl), 100);
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#27ae60' }}
                  />
                  <label htmlFor="selectAllBackupBranches" style={{ fontWeight: '700', fontSize: '1rem', cursor: 'pointer', color: '#2d3748' }}>SELECT ALL BRANCHES</label>
                </div>

                {branches.map((branch, idx) => {
                  const branchName = branch.branch_name || branch;
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      minWidth: '220px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: selectedBranches.includes(branchName) ? 'rgba(46, 204, 113, 0.05)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        id={`branch-backup-${idx}`}
                        checked={selectedBranches.includes(branchName)}
                        onChange={(e) => {
                          let newBranches;
                          if (e.target.checked) {
                            newBranches = [...selectedBranches, branchName];
                          } else {
                            newBranches = selectedBranches.filter(b => b !== branchName);
                          }
                          setSelectedBranches(newBranches);
                          // Trigger backup info refresh when branches change
                          setTimeout(() => fetchBackupInfo(baseUrl), 100);
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#27ae60' }}
                      />
                      <label htmlFor={`branch-backup-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#2c3e50', fontWeight: selectedBranches.includes(branchName) ? '600' : '400' }}>{branchName}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selective Backup Section */}
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '25px', background: 'rgba(155, 89, 182, 0.05)', borderRadius: '24px', border: '1px solid rgba(155, 89, 182, 0.1)' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#8e44ad', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🛠️ TARGET DATASETS SELECTION:
            </label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px', 
              background: '#fff', 
              padding: '20px', 
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  id="selectAllBackupTypes"
                  checked={selectedBackupTypes.includes('all') || selectedBackupTypes.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedBackupTypes(['all']);
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#8e44ad' }}
                />
                <label htmlFor="selectAllBackupTypes" style={{ fontWeight: '700', fontSize: '1rem', cursor: 'pointer', color: '#2c3e50' }}>BACKUP ALL DATA (Full System Backup)</label>
              </div>

              {/* Items */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                minWidth: '220px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: selectedBackupTypes.includes('items') ? 'rgba(155, 89, 182, 0.05)' : 'transparent',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  id="backup-type-items"
                  checked={selectedBackupTypes.includes('items')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBackupTypes(prev => prev.filter(t => t !== 'all').concat('items'));
                    } else {
                      setSelectedBackupTypes(prev => prev.filter(t => t !== 'items'));
                    }
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8e44ad' }}
                />
                <label htmlFor="backup-type-items" style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#34495e', fontWeight: selectedBackupTypes.includes('items') ? '600' : '400' }}>Items (Excludes Price)</label>
              </div>

              {/* Purchase Items */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                minWidth: '220px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: selectedBackupTypes.includes('purchase_items') ? 'rgba(155, 89, 182, 0.05)' : 'transparent',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  id="backup-type-purchase-items"
                  checked={selectedBackupTypes.includes('purchase_items')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBackupTypes(prev => prev.filter(t => t !== 'all').concat('purchase_items'));
                    } else {
                      setSelectedBackupTypes(prev => prev.filter(t => t !== 'purchase_items'));
                    }
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8e44ad' }}
                />
                <label htmlFor="backup-type-purchase-items" style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#34495e', fontWeight: selectedBackupTypes.includes('purchase_items') ? '600' : '400' }}>Purchase Items (Excludes Price)</label>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="glass-card">
            <h3 className="section-title">⏱️ Auto-Interval</h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '20px' }}>
              Define how frequently the system should trigger automatic backups.
            </p>
            <div className="input-row">
              <input
                type="number"
                value={newInterval}
                onChange={(e) => setNewInterval(parseInt(e.target.value) || 1)}
                min={1}
                className="modern-input"
              />
              <button className="action-btn" onClick={handleSetInterval}>Update</button>
            </div>
            <div className="info-badge">
              Current: every {backupInterval} hours
            </div>
          </div>

          <div className="glass-card">
            <h3 className="section-title">📋 History Limit</h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '20px' }}>
              Choose how many recent backups to keep visible in the dashboard.
            </p>
            <div className="input-row">
              <input
                type="number"
                value={maxBackups}
                onChange={(e) => handleSetMaxBackups(parseInt(e.target.value) || 5)}
                min={1}
                className="modern-input"
              />
            </div>
            <div className="info-badge">
              Displaying {maxBackups} snapshots
            </div>
          </div>

          {/* Import Section */}
          <div className="glass-card">
            <h3 className="section-title">📥 Data Import</h3>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '20px' }}>
              Restore or migrate data from Excel/JSON files with multi-table preview.
            </p>
            <div className="input-row">
              <button 
                className="action-btn" 
                style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => navigate('/import-data')}
              >
                <FaTable style={{ marginRight: '8px' }} /> Go to Import Wizard
              </button>
            </div>
            <div className="info-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              Supports Excel & JSON
            </div>
          </div>

          {/* Operating Info Section */}
          <div className="glass-card info-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.8rem' }}>💡</div>
              <div>
                <h4 style={{ color: '#2c3e50', marginBottom: '10px' }}>Operating Context</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {companyDetails ? (
                    <>
                      <div>
                        <small style={{ color: '#7f8c8d', display: 'block' }}>Store Timings</small>
                        <strong>{companyDetails.openingTime || 'N/A'} - {companyDetails.closingTime || 'N/A'}</strong>
                      </div>
                      <div>
                        <small style={{ color: '#7f8c8d', display: 'block' }}>Operational Span</small>
                        <strong>{totalHours.toFixed(1)} hrs</strong>
                      </div>
                      <div>
                        <small style={{ color: '#7f8c8d', display: 'block' }}>Backup Preview</small>
                        <strong>~{numBackupsPreview} backups per cycle</strong>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontStyle: 'italic', color: '#95a5a6' }}>Company details pending configuration...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Previous Backups */}
          <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>🗄️ Recent Backups</h3>
              <span className="count-badge">{backups.length} stored</span>
            </div>

            {backups.length > 0 ? (
              <div className="backup-grid">
                {backups.map((backup) => (
                  <div key={backup.filename} className="backup-item" onClick={() => handleDownloadBackup(backup.filename)}>
                    <div className="backup-icon">📁</div>
                    <div style={{ flex: 1 }}>
                      <div className="backup-name">{backup.date}</div>
                      <div className="backup-meta">Size: {backup.size} • Excel Format</div>
                    </div>
                    <button className="download-icon-btn">
                      <FaDownload />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📂</div>
                <p>No prior backup snapshots found on the server.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hero-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(52, 152, 219, 0.15);
        }

        .section-title {
          font-size: 1.25rem;
          color: '#2c3e50';
          margin-bottom: 20px;
          font-weight: 700;
        }

        .glass-button {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(52, 152, 219, 0.3);
          color: #3498db;
          padding: 10px 25px;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .glass-button:hover {
          background: #3498db;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(52, 152, 219, 0.2);
        }

        .primary-gradient-btn {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          border: none;
          padding: 18px 45px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(52, 152, 219, 0.3);
        }

        .primary-gradient-btn:hover {
          transform: scale(1.02) translateY(-3px);
          box-shadow: 0 15px 30px rgba(52, 152, 219, 0.4);
        }

        .status-alert {
          backdrop-filter: blur(10px);
          border: 1px solid transparent;
        }

        .status-alert.success {
          background: rgba(46, 213, 115, 0.15);
          color: #1e8449;
          border-color: rgba(46, 213, 115, 0.2);
        }

        .status-alert.warning {
          background: rgba(231, 76, 60, 0.1);
          color: #c0392b;
          border-color: rgba(231, 76, 60, 0.2);
        }

        .alert-ok-btn {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid currentColor;
          color: inherit;
          padding: 6px 18px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .modern-input {
          flex: 1;
          background: rgba(255,255,255,0.9);
          border: 2px solid #edeff2;
          border-radius: 14px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .modern-input:focus {
          border-color: #3498db;
        }

        .input-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .action-btn {
          background: #f1f4f8;
          color: #2c3e50;
          border: none;
          padding: 0 20px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: #e2e8f0;
        }

        .info-badge {
          display: inline-block;
          background: rgba(52, 152, 219, 0.1);
          color: #3498db;
          padding: 6px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .backup-grid {
          display: grid;
          gap: 15px;
        }

        .backup-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 18px 25px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid #edeff2;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .backup-item:hover {
          background: white;
          border-color: #3498db;
          transform: translateX(10px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .backup-icon {
          font-size: 1.5rem;
          background: #f8f9fa;
          width: 50px;
          height: 50px;
          display: flex;
          alignItems: center;
          justifyContent: center;
          borderRadius: 14px;
        }

        .backup-name {
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 4px;
          font-size: 1.05rem;
        }

        .backup-meta {
          color: #95a5a6;
          font-size: 0.85rem;
        }

        .download-icon-btn {
          background: transparent;
          border: none;
          color: #3498db;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.3s;
        }

        .backup-item:hover .download-icon-btn {
          opacity: 1;
        }

        .count-badge {
          background: #2c3e50;
          color: white;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

export default BackupPage;
