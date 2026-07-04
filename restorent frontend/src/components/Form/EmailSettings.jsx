// EmailSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaServer, FaUserLock, FaCog, FaList, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

// Move InputField outside to prevent focus loss on re-render
const InputField = ({ label, value, onChange, placeholder, type = "text", required = false, description = "" }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      fontSize: '0.9rem',
      color: '#2c3e50',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px',
        border: '1px solid #ced4da',
        borderRadius: '8px',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        background: '#f8f9fa'
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3498db';
        e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
        e.target.style.background = '#fff';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#ced4da';
        e.target.style.boxShadow = 'none';
        e.target.style.background = '#f8f9fa';
      }}
    />
    {description && (
      <small style={{ display: 'block', marginTop: '5px', color: '#7f8c8d' }}>
        {description}
      </small>
    )}
  </div>
);

function EmailSettings() {
  const navigate = useNavigate();

  // General State
  const [emailType, setEmailType] = useState('gmail'); // 'gmail' or 'webmail'
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  // Gmail Specific State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  // Web Mail Specific State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('');
  const [username, setUsername] = useState('');
  const [webmailPassword, setWebmailPassword] = useState('');
  
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [userBranch, setUserBranch] = useState(null);
  const [savedSettingsList, setSavedSettingsList] = useState([]);

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
        const branch = userObj.branch_name || userObj.branch || "";

        const isAdminRole = checkIsAdmin(userObj);
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);

        setIsCompanyAdmin(isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);
        setUserBranch(branch);

        if (isGroupAdminRole) {
          const comps = userObj.companies || (userObj.company ? [userObj.company] : []);
          setAssignedCompanies(comps);
        }

        if (roleRaw) {
          const response = await axios.get(`${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`);
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'email_settings');
          
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

  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchBranches = async (currentBaseUrl, targetCompany = null) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const company_name = targetCompany || (selectedCompanies.length > 0 ? selectedCompanies.join(',') : "") || userObj.company || "";
      const role = userObj.role?.toLowerCase();
      const branch_name = userObj.branch_name;

      if (!company_name) {
        setBranches([]);
        return;
      }

      const is_Admin = checkIsAdmin(userObj) && (!branch_name || branch_name === 'All Branches' || branch_name === '');


      const response = await axios.get(`${currentBaseUrl || baseUrl}/api/branches`, {
        headers: { 'X-Company-Name': company_name }
      });
      // Handle both object and string responses from branches API
      const processedBranches = (response.data || []).map((b, idx) => {
        if (typeof b === 'string') return { _id: `b-${idx}`, branch_name: b };
        return { 
          _id: b._id || b.id || `b-${idx}`, 
          branch_name: b.branch_name || b.branch || b.name || `Branch ${idx + 1}` 
        };
      });
      setBranches(processedBranches);

      if (!is_Admin && branch_name) {
        setSelectedBranches([branch_name]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchEmailSettings = async (currentBaseUrl, branch = null) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const companyHeaders = selectedCompanies.length > 0 ? selectedCompanies.join(',') : (userObj.company || "");
        headers['X-Company-Name'] = companyHeaders;
        const active_branch = branch || (!isCompanyAdmin ? userBranch : null);
        if (active_branch) headers['X-Branch-Name'] = active_branch;
      }

      const response = await axios.get(`${currentBaseUrl || baseUrl}/api/get-email-settings`, { headers });
      if (response.data.success && response.data.settings) {
        const s = response.data.settings;
        const type = s.email_type || 'gmail';
        setEmailType(type);

        if (type === 'gmail') {
          setEmail(s.email || '');
          setFromEmail(s.from_email || '');
          setPassword(s.password || '');
        } else {
          setSenderName(s.sender_name || '');
          setSenderEmail(s.sender_email || '');
          setSmtpServer(s.smtp_server || '');
          setSmtpPort(s.smtp_port ? s.smtp_port.toString() : '587');
          setImapServer(s.imap_server || '');
          setImapPort(s.imap_port ? s.imap_port.toString() : '993');
          setUsername(s.username || '');
          setWebmailPassword(s.password || '');
        }
      } else {
        // Handle success: false (No settings found)
        resetForm();
      }
      // Always fetch the list of existing settings
      fetchSavedSettingsList(currentBaseUrl);
    } catch (error) {
      resetForm();
      // Even on error, try to fetch the list
      fetchSavedSettingsList(currentBaseUrl);
      
      // Don't show error for 404/Not Found as it's a valid state (just no settings yet)
      if (error.response && error.response.status === 404) {
        console.log("No email settings found, ready for new entry.");
      } else if (error.response?.data?.message) {
        console.log(error.response.data.message);
      } else {
        setMessage(`Failed to fetch email settings: ${error.message}`);
        setMessageType('error');
      }
    }
  };

  const fetchSavedSettingsList = async (currentBaseUrl) => {
    try {
      const activeUrl = currentBaseUrl || baseUrl;
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      
      // Ensure we have a company name for the header
      const companyHeader = selectedCompanies.length > 0 
        ? selectedCompanies.join(',') 
        : (userObj.company || "");

      if (!companyHeader) {
        console.warn("fetchSavedSettingsList: No company selected, skipping fetch.");
        setSavedSettingsList([]);
        return;
      }

      const headers = { 
        'X-Company-Name': companyHeader
      };

      if (!isCompanyAdmin && userBranch) {
        headers['X-Branch-Name'] = userBranch;
      }
      
      const response = await axios.get(`${activeUrl}/api/list-email-settings`, { headers });
      setSavedSettingsList(response.data || []);
    } catch (error) {
      console.error("Error listing settings:", error);
      setSavedSettingsList([]);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFromEmail('');
    setPassword('');
    setSenderName('');
    setSenderEmail('');
    setSmtpServer('');
    setSmtpPort('587');
    setImapServer('');
    setImapPort('993');
    setUsername('');
    setWebmailPassword('');
    setEditingId(null);
    if (!isCompanyAdmin && userBranch) {
      setSelectedBranches([userBranch]);
    } else {
      setSelectedBranches([]);
    }
  };

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
        currentBaseUrl = "";
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
      setBaseUrl("");
      currentBaseUrl = "";
    } finally {
      fetchPermissions(currentBaseUrl);
      fetchBranches(currentBaseUrl);
      fetchEmailSettings(currentBaseUrl);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (baseUrl) {
      fetchEmailSettings(baseUrl);
    }
  }, [selectedCompanies, baseUrl]);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTestSettings = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to test email settings.");
      setShowPermModal(true);
      return;
    }

    let payload = { email_type: emailType };
    if (emailType === 'gmail') {
      if (!email || !password) {
        setMessage('Please provide email and app password to test');
        setMessageType('error');
        return;
      }
      payload = { ...payload, email, password };
    } else {
      if (!username || !webmailPassword || !smtpServer || !smtpPort) {
        setMessage('Please provide username, password, SMTP server and port');
        setMessageType('error');
        return;
      }
      payload = { ...payload, username, password: webmailPassword, smtp_server: smtpServer, smtp_port: smtpPort };
    }

    setTesting(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const headers = {
        'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company),
        'X-Branch-Name': (selectedBranches.length > 0 ? selectedBranches.join(',') : (!isCompanyAdmin ? userBranch : ""))
      };
      
      const response = await axios.post(`${baseUrl}/api/test-email-settings`, payload, { headers });
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to save email settings.");
      setShowPermModal(true);
      return;
    }

    let payload = { 
      email_type: emailType,
      branch_names: selectedBranches,
      editingId: editingId
    };

    if (emailType === 'gmail') {
      if (!email || !password || !fromEmail) {
        setMessage('Please provide email, app password, and from email');
        setMessageType('error');
        return;
      }
      if (!validateEmail(email) || !validateEmail(fromEmail)) {
        setMessage('Please enter valid email addresses');
        setMessageType('error');
        return;
      }
      payload = { ...payload, email, password, from_email: fromEmail };
    } else {
      if (!senderEmail || !smtpServer || !smtpPort || !username || !webmailPassword) {
        setMessage('Please fill in all required fields marked with *');
        setMessageType('error');
        return;
      }
      if (!validateEmail(senderEmail)) {
        setMessage('Please enter a valid sender email');
        setMessageType('error');
        return;
      }
      payload = {
        ...payload,
        sender_name: senderName,
        sender_email: senderEmail,
        smtp_server: smtpServer,
        smtp_port: smtpPort,
        imap_server: imapServer,
        imap_port: imapPort,
        username: username,
        password: webmailPassword
      };
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const headers = {
        'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company),
        'X-Branch-Name': (selectedBranches.length > 0 ? selectedBranches.join(',') : (!isCompanyAdmin ? userBranch : ""))
      };

      const response = await axios.post(`${baseUrl}/api/save-email-settings`, payload, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      resetForm();
      fetchSavedSettingsList(baseUrl);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEmailType(item.email_type || 'gmail');
    setEditingId(item._id);
    setSelectedBranches(item.branch_names || []);
    
    if (item.email_type === 'gmail') {
      setEmail(item.email || '');
      setFromEmail(item.from_email || '');
      setPassword(item.password || '');
    } else {
      setSenderName(item.sender_name || '');
      setSenderEmail(item.sender_email || '');
      setSmtpServer(item.smtp_server || '');
      setSmtpPort(item.smtp_port ? item.smtp_port.toString() : '587');
      setImapServer(item.imap_server || '');
      setImapPort(item.imap_port ? item.imap_port.toString() : '993');
      setUsername(item.username || '');
      setWebmailPassword(item.password || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete these email settings?")) return;
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      await axios.delete(`${baseUrl}/api/delete-email-settings/${id}`, {
        headers: { 'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company) }
      });
      setMessage("Settings deleted successfully");
      setMessageType('success');
      fetchSavedSettingsList(baseUrl);
    } catch (error) {
       setMessage(error.response?.data?.error || "Delete failed");
       setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarget = async (item, targetBranch, targetCompany) => {
    const branches = item.branch_names || [];
    const companies = item.company_name ? item.company_name.split(',').map(c => c.trim()) : [];

    // If it's the absolute last target, delete the whole record
    if (branches.length <= 1 && companies.length <= 1) {
      return handleDelete(item._id);
    }

    if (!window.confirm(`Are you sure you want to remove settings for ${targetBranch || targetCompany}?`)) return;

    try {
      setLoading(true);
      
      // Filter out the deleted target
      const newBranches = branches.filter(b => b !== targetBranch);
      const newCompanies = companies.filter(c => c !== targetCompany);

      // If we removed a company, we need to update the X-Company-Name header
      // If we removed a branch, we update branch_names payload
      const payload = {
        ...item,
        branch_names: newBranches,
        editingId: item._id,
        password: item.password // Ensure password is sent for update
      };

      const headers = {
        'X-Company-Name': (newCompanies.length > 0 ? newCompanies.join(',') : companies.join(','))
      };

      await axios.post(`${baseUrl}/api/save-email-settings`, payload, { headers });
      setMessage(`Removed settings for ${targetBranch || targetCompany}`);
      setMessageType('success');
      fetchSavedSettingsList(baseUrl);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to remove target");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleBranchSelection = (branch) => {
    setSelectedBranches(prev =>
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
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

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
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
          <p>You do not have permission to view Email Settings.</p>
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px',
      position: 'relative',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
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

      <button
        onClick={handleGoBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#fff',
          border: 'none',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '50px',
          fontSize: '15px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateX(-5px)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }}
        disabled={loading || testing}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{
        maxWidth: '750px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '40px 40px 30px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{
            color: '#1a2a3a',
            margin: '0 0 10px',
            fontSize: '1.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FaEnvelope style={{ color: '#3498db' }} />
            Email Configuration
          </h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
            Configure your SMTP and IMAP settings to use the Email Center. Usually for Gmail, use <strong>smtp.gmail.com</strong> (587/465) and <strong>imap.gmail.com</strong> (993) with an App Password.
          </p>
        </div>


        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#f8f9fa',
          padding: '10px 40px 0'
        }}>
          <div
            onClick={() => setEmailType('gmail')}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              color: emailType === 'gmail' ? '#3498db' : '#7f8c8d',
              borderBottom: emailType === 'gmail' ? '3px solid #3498db' : '3px solid transparent',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Gmail
          </div>
          <div
            onClick={() => setEmailType('webmail')}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              color: emailType === 'webmail' ? '#3498db' : '#7f8c8d',
              borderBottom: emailType === 'webmail' ? '3px solid #3498db' : '3px solid transparent',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Web Mail
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          {isGroupAdmin && (
            <div style={{ padding: '20px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '16px', border: '1px solid rgba(52, 152, 219, 0.2)', marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#2980b9', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏢 SELECT TARGET COMPANIES:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {/* Select All Companies */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllCompanies"
                    checked={selectedCompanies.length === assignedCompanies.length && assignedCompanies.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCompanies(assignedCompanies);
                        fetchBranches(baseUrl, assignedCompanies.join(','));
                      } else {
                        setSelectedCompanies([]);
                        setBranches([]);
                        setSelectedBranches([]);
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="selectAllCompanies" style={{ fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', color: '#2c3e50' }}>SELECT ALL COMPANIES</label>
                </div>

                {assignedCompanies.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                    <input
                      type="checkbox"
                      id={`company-${idx}`}
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
                        } else {
                          setBranches([]);
                          setSelectedBranches([]);
                        }
                      }}
                      style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                    />
                    <label htmlFor={`company-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#34495e' }}>{comp}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADAPTIVE BRANCH UI: Hide completely if no branches found */}
          {branches.length > 0 && isCompanyAdmin && (!isGroupAdmin || (isGroupAdmin && selectedCompanies.length > 0)) && (
            <div style={{ padding: '20px', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '16px', border: '1px solid rgba(46, 204, 113, 0.2)', marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#27ae60', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 SELECT BRANCHES:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {/* Select All Branch Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid #edf2f7', paddingBottom: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllBranches"
                    checked={selectedBranches.length === branches.length && branches.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBranches(branches.map(b => b.branch_name || b));
                      } else {
                        setSelectedBranches([]);
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="selectAllBranches" style={{ fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', color: '#2d3748' }}>SELECT ALL BRANCHES</label>
                </div>

                {branches.map((branch, idx) => {
                  const branchName = branch.branch_name || branch;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                      <input
                        type="checkbox"
                        id={`branch-${idx}`}
                        checked={selectedBranches.includes(branchName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBranches([...selectedBranches, branchName]);
                          } else {
                            setSelectedBranches(selectedBranches.filter(b => b !== branchName));
                          }
                        }}
                        style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`branch-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#2c3e50' }}>{branchName}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {message && (
            <div style={{
              background: messageType === 'success' ? '#eef9f1' : '#fff5f5',
              color: messageType === 'success' ? '#2ecc71' : '#e74c3c',
              padding: '15px 20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: `1px solid ${messageType === 'success' ? '#dcf3e5' : '#fed7d7'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: '500' }}>{message}</span>
              <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          )}

          {emailType === 'gmail' ? (
            <div>
              <InputField
                label="Email Address"
                value={email}
                onChange={setEmail}
                placeholder="e.g. yourname@gmail.com"
                required
              />
              <InputField
                label="From Email Address"
                value={fromEmail}
                onChange={setFromEmail}
                placeholder="e.g. noreply@restaurant.com"
                required
              />
              <InputField
                label="App Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="16-character google app password"
                required
                description={
                  <span>
                    Use an App Password from your Google Account settings. <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'none' }}>Learn more</a>
                  </span>
                }
              />
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <InputField
                  label="Sender Name"
                  value={senderName}
                  onChange={setSenderName}
                  placeholder=""
                />
                <InputField
                  label="Sender Email"
                  value={senderEmail}
                  onChange={setSenderEmail}
                  placeholder=""
                  required
                />
              </div>

              <div style={{ margin: '30px 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '1px' }}>Sending (SMTP)</span>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '20px' }}>
                <InputField
                  label="SMTP Server"
                  value={smtpServer}
                  onChange={setSmtpServer}
                  placeholder=""
                  required
                />
                <InputField
                  label="Port"
                  value={smtpPort}
                  onChange={setSmtpPort}
                  placeholder=""
                  required
                />
              </div>

              <div style={{ margin: '30px 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '1px' }}>Receiving (IMAP)</span>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '20px' }}>
                <InputField
                  label="IMAP Server"
                  value={imapServer}
                  onChange={setImapServer}
                  placeholder=""
                />
                <InputField
                  label="Port"
                  value={imapPort}
                  onChange={setImapPort}
                  placeholder=""
                />
              </div>

              <div style={{ margin: '30px 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '1px' }}>Auth</span>
                <div style={{ height: '1px', flex: 1, background: '#e9ecef' }}></div>
              </div>

              <InputField
                label="SMTP/IMAP Username"
                value={username}
                onChange={setUsername}
                placeholder=""
                required
              />
              <InputField
                label="App Password / Password"
                type="password"
                value={webmailPassword}
                onChange={setWebmailPassword}
                placeholder=""
                required
              />
            </div>
          )}
              
          {isGroupAdmin && (
            <div style={{ padding: '20px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '16px', border: '1px solid rgba(52, 152, 219, 0.2)', marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#2980b9', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏢 SELECT TARGET COMPANIES:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {/* Select All Companies */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllCompanies"
                    checked={selectedCompanies.length === assignedCompanies.length && assignedCompanies.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCompanies(assignedCompanies);
                        fetchBranches(baseUrl, assignedCompanies.join(','));
                      } else {
                        setSelectedCompanies([]);
                        setBranches([]);
                        setSelectedBranches([]);
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="selectAllCompanies" style={{ fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', color: '#2c3e50' }}>SELECT ALL COMPANIES</label>
                </div>

                {assignedCompanies.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                    <input
                      type="checkbox"
                      id={`company-${idx}`}
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
                        } else {
                          setBranches([]);
                          setSelectedBranches([]);
                        }
                      }}
                      style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                    />
                    <label htmlFor={`company-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#34495e' }}>{comp}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADAPTIVE BRANCH UI: Hide completely if no branches found */}
          {branches.length > 0 && isCompanyAdmin && (!isGroupAdmin || (isGroupAdmin && selectedCompanies.length > 0)) && (
            <div style={{ padding: '20px', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '16px', border: '1px solid rgba(46, 204, 113, 0.2)', marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#27ae60', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 SELECT BRANCHES:
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                {/* Select All Branch Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid #edf2f7', paddingBottom: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id="selectAllBranches"
                    checked={selectedBranches.length === branches.length && branches.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBranches(branches.map(b => b.branch_name || b));
                      } else {
                        setSelectedBranches([]);
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="selectAllBranches" style={{ fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', color: '#2d3748' }}>SELECT ALL BRANCHES</label>
                </div>

                {branches.map((branch, idx) => {
                  const branchName = branch.branch_name || branch;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                      <input
                        type="checkbox"
                        id={`branch-${idx}`}
                        checked={selectedBranches.includes(branchName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBranches([...selectedBranches, branchName]);
                          } else {
                            setSelectedBranches(selectedBranches.filter(b => b !== branchName));
                          }
                        }}
                        style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`branch-${idx}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#2c3e50' }}>{branchName}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '40px'
          }}>
            <button
              onClick={handleTestSettings}
              disabled={testing || loading}
              style={{
                flex: 1,
                padding: '14px',
                background: '#fff',
                color: '#4a5568',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!(testing || loading)) {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }
              }}
              onMouseOut={(e) => {
                if (!(testing || loading)) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              {testing ? 'Testing...' : 'Test Settings'}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading || testing}
              style={{
                flex: 2,
                padding: '14px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!(loading || testing)) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!(loading || testing)) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  padding: '14px 25px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Saved Configurations List */}
        <div style={{ marginTop: '40px', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
           <h3 style={{ margin: '0 0 25px', color: '#1a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaList style={{ color: '#3498db' }} /> Saved Email Configurations
           </h3>
           <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '15px 10px', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Context / Branches</th>
                    <th style={{ padding: '15px 10px', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '15px 10px', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email/User</th>
                    <th style={{ padding: '15px 10px', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const expandedList = [];
                    savedSettingsList.forEach(item => {
                      const compRaw = item.company_name || item.company;
                      const companies = compRaw ? compRaw.split(',').map(c => c.trim()) : ['Default Company'];
                      
                      let branches = [null];
                      if (item.branch_names && Array.isArray(item.branch_names) && item.branch_names.length > 0) {
                        branches = item.branch_names;
                      } else if (typeof item.branch_names === 'string' && item.branch_names.trim()) {
                        branches = item.branch_names.split(',').map(b => b.trim());
                      }
                      
                      companies.forEach(comp => {
                        branches.forEach(branch => {
                          expandedList.push({
                            ...item,
                            displayCompany: comp,
                            displayBranch: branch,
                            isDefault: !branch || branch === "Company-wide (Default)"
                          });
                        });
                      });
                    });

                    return expandedList.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              padding: '4px 10px', 
                              background: '#f8fafc', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: '#475569'
                            }}>
                              {item.displayCompany}
                            </div>
                            <span style={{ color: '#cbd5e1' }}>→</span>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              fontSize: '0.7rem', 
                              background: item.isDefault ? '#fef3c7' : '#e0f2fe',
                              color: item.isDefault ? '#92400e' : '#0369a1',
                              fontWeight: 'bold'
                            }}>
                              {item.isDefault ? 'Company Default' : item.displayBranch}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '15px 10px', textTransform: 'capitalize', color: '#334155' }}>{item.email_type}</td>
                        <td style={{ padding: '15px 10px', color: '#334155' }}>{item.email || item.username || item.sender_email}</td>
                        <td style={{ padding: '15px 10px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => handleEdit(item)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit All</button>
                             <button 
                               onClick={() => handleDeleteTarget(item, item.displayBranch, item.displayCompany)} 
                               style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                             >
                               Delete
                             </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                  {savedSettingsList.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No saved configurations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>

    </div>
  );
}

export default EmailSettings;
