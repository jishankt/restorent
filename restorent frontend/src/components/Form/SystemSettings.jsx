import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaList, FaGlobe, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import './SystemSettings.css';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    phoneNumber: '',
    roleProfile: 'User',
    password: '',
  });

  const [settings, setSettings] = useState({
    country: 'India', // Updated: Default to India
    language: 'English',
    timeZone: 'Asia/Dubai',
    currency: 'INR', // Updated: Default to INR (Indian Rupee)
    dateFormat: 'yyyy/mm/dd',
    timeFormat: 'HH:mm:ss',
    numberFormat: '#,##,###.##',
    useNumberFormatFromCurrency: false,
    firstDayOfWeek: 'Monday',
    floatPrecision: 3,
    currencyPrecision: 4,
    useCurrencySymbol: false, // NEW: Toggle between Symbol and Code
    sessionExpiry: '',
    documentShareKeyExpiry: '',
    denyMultipleSessions: false,
    disableUserPassLogin: false,
    allowLoginUsingMobileNumber: false,
    allowLoginUsingUserName: false,
    loginWithEmailLink: false,
    allowConsecutiveLoginAttempts: 0,
    allowLoginAfterFail: 0,
    enableTwoFactorAuth: false,
    totalWorkingDays: 30, // NEW: Default total working days per month (kept for backend compatibility, but input removed)
    applyCompanyLeaves: false, // NEW: Checkbox to apply company leaves deduction
    voiceLanguage: 'en-US', // NEW: Default voice language
    voiceName: '', // NEW: Selected voice name
    voiceRate: 1.0, // NEW: Default voice speed
    voiceRepeatCount: 2, // NEW: Default voice repetition count
    voiceRepeatIntervalHours: 0,
    voiceRepeatIntervalMinutes: 0,
    voiceRepeatIntervalSeconds: 10,
    font_family: 'Dubai Regular', // NEW: Global font setting
    // NEW: Payment settings for different order types
    paymentSettings: {
      takeaway: { pay: true, payLater: true },
      dinein: { pay: true, payLater: true },
      onlinedelivery: { pay: true, payLater: true }
    }
  });

  const [availableVoices, setAvailableVoices] = useState([]);

  const [clickCount, setClickCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false); // NEW: To distinguish success vs error messages
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userBranchState, setUserBranchState] = useState("");
  const [userRole, setUserRole] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  // UPDATED: Persist multi-selection to localStorage
  const [selectedCompanies, setSelectedCompanies] = useState(() => {
    const saved = localStorage.getItem('selectedCompanies');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selectedBranch') || '');
  const [selectedBranches, setSelectedBranches] = useState(() => {
    const saved = localStorage.getItem('selectedBranches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSettingsList, setShowSettingsList] = useState(false);
  const [allSettingsHistory, setAllSettingsHistory] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showSettingsDeleteConfirm, setShowSettingsDeleteConfirm] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState(null);

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('User from LocalStorage:', user);
      const isGlobal = checkIsGlobalAdmin(user);

      // Consistent check for both 'company' and 'company_name' (backend uses 'company' at login)
      const userCompany = user.company_name || user.company;
      const companyToUse = (isGlobal && selectedCompanies.length > 0 ? selectedCompanies[0] : null) || userCompany;
      if (companyToUse) headers['X-Company-Name'] = companyToUse;
      
      const userBranch = user.branch_name || (user.branches && user.branches.length > 0 ? user.branches[0].branch : user.branch);
      const branchToUse = selectedBranch || userBranch;
      if (branchToUse) headers['X-Branch-Name'] = branchToUse;

      // Pass authentication context for strict endpoints (like DELETE)
      headers['X-User-Context'] = encodeURIComponent(userStr);
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  };

  const fetchPermissions = async (currentBaseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const roleRaw = user.role || user.UserType || '';
        setUserRole(roleRaw);


        const isAdminRole = checkIsAdmin(user);
        const isGroupAdminRole = checkIsGlobalAdmin(user);

        setIsCompanyAdmin(isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);
        setUserBranchState(user.branch_name || user.branch || "");

        if (roleRaw) {
          const url = currentBaseUrl ? `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}` : `/api/role-permissions?role=${encodeURIComponent(roleRaw)}`;
          const response = await axios.get(url, { headers: getHeaders() });
          const perms = response.data.permissions || [];
          console.log('Received Permissions:', perms);
          const pagePerm = perms.find(p => p.pageId === 'system_settings');
          
          if (isAdminRole || isGroupAdminRole) {
            setCanRead(true);
            setCanWrite(true);
          } else if (pagePerm) {
            console.log('System Settings Permission:', pagePerm);
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermsLoading(false);
    }
  };

  const fetchBranches = async (currentBaseUrl, companyOverride) => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const headers = {};
        const companyToUse = companyOverride || (selectedCompanies.length > 0 ? selectedCompanies[0] : null) || user.company_name;
        if (companyToUse) headers['X-Company-Name'] = companyToUse;
        const url = currentBaseUrl ? `${currentBaseUrl}/api/branches` : '/api/branches';
        const response = await axios.get(url, { headers });
        const data = response.data;
        const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchCompanies = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/company-details` : '/api/company-details';
      const response = await axios.get(url);
      const data = response.data;
      
      // FIX: Handle nested object response structure {"companyDetails": [...]}
      const details = data.companyDetails || (Array.isArray(data) ? data : []);
      
      if (Array.isArray(details)) {
        // Extract unique company names
        const names = [...new Set(details.map(c => c.company_name).filter(Boolean))];
        setAvailableCompanies(names);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAllSettings = async (currentBaseUrl) => {
    try {
      setIsLoadingList(true);
      const url = currentBaseUrl ? `${currentBaseUrl}/api/settings/list` : '/api/settings/list';
      const headers = getHeaders();
      console.log('Fetching Settings List with Headers:', headers);
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) throw new Error('Failed to fetch settings list');
      const data = await response.json();
      console.log('Fetched Settings List Data:', data);
      setAllSettingsHistory(data);
    } catch (error) {
      console.error('Error fetching all settings:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (warningMessage && isSuccessMessage) {
      const timer = setTimeout(() => {
        setWarningMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage, isSuccessMessage]);

  // Fetch config to determine baseUrl
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
      // Fetch users and settings after determining baseUrl
      fetchPermissions(currentBaseUrl);
      fetchBranches(currentBaseUrl);
      fetchUsers(currentBaseUrl);
      fetchSettings(currentBaseUrl);

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'group_admin' || user.role === 'superadmin') {
          fetchCompanies(currentBaseUrl);
        }
      }
    }
  };

  const fetchUsers = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/users` : '/api/users';
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(
        data.map((user) => ({
          fullName: user.firstName || 'Unknown',
          status: user.status || 'Active',
          userType: user.role,
          phoneNumber: user.phone_number || 'N/A',
          id: user.email,
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      setWarningMessage('Failed to fetch users');
      setIsSuccessMessage(false);
    }
  };

  const fetchSettings = async (currentBaseUrl) => {
    try {
      const url = currentBaseUrl ? `${currentBaseUrl}/api/settings` : '/api/settings';
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Removed setWarningMessage to avoid unwanted overlays during rapid role switching/loading
      setIsSuccessMessage(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchSettings(baseUrl);
    fetchUsers(baseUrl);
    fetchBranches(baseUrl);
  }, [selectedBranch, selectedCompanies, baseUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (baseUrl) {
        fetchUsers(baseUrl);
      } else {
        fetchUsers("");
      }
    }, 30000);

    // Load available voices for settings
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => clearInterval(interval);
  }, [baseUrl]); // Depend on baseUrl to ensure it runs after baseUrl is set

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      setSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            [grandChild]: type === 'checkbox' ? checked : value
          }
        }
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleCompanyChange = (e) => {
    const { value, checked } = e.target;
    let updated;
    if (checked) {
      updated = [...selectedCompanies, value];
    } else {
      updated = selectedCompanies.filter(c => c !== value);
    }
    setSelectedCompanies(updated);
    localStorage.setItem('selectedCompanies', JSON.stringify(updated));
    
    // Reset branch when context changes significantly
    setSelectedBranch('');
    localStorage.removeItem('selectedBranch');
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setSelectedBranch(value);
    localStorage.setItem('selectedBranch', value);
  };

  const handleBranchCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let updated;
    if (checked) {
      updated = [...selectedBranches, value];
    } else {
      updated = selectedBranches.filter(b => b !== value);
    }
    setSelectedBranches(updated);
    localStorage.setItem('selectedBranches', JSON.stringify(updated));
  };

  const loadSavedSetting = (setting) => {
    // Only pick the keys that exist in the settings state default to avoid corrupting with metadata
    const sanitizedData = {};
    Object.keys(settings).forEach(key => {
      if (key in setting) sanitizedData[key] = setting[key];
    });
    
    setSettings(prev => ({ ...prev, ...sanitizedData }));
    
    if (setting.company_name) {
      const updated = [setting.company_name];
      setSelectedCompanies(updated);
      localStorage.setItem('selectedCompanies', JSON.stringify(updated));
    }
    if (setting.branch_name) {
      setSelectedBranch(setting.branch_name);
      localStorage.setItem('selectedBranch', setting.branch_name);
    }
    setShowSettingsList(false);
    setWarningMessage(`Loaded settings for ${setting.company_name || 'Global'}${setting.branch_name ? ' - ' + setting.branch_name : ''}`);
    setIsSuccessMessage(true);
  };

  const deleteSavedSetting = (item) => {
    if (!canWrite && !isCompanyAdmin && !isGroupAdmin) {
      setPermModalMsg("You do not have permission to delete settings.");
      setShowPermModal(true);
      return;
    }
    setSettingToDelete(item);
    setShowSettingsDeleteConfirm(true);
  };

  const confirmDeleteSetting = async () => {
    if (!settingToDelete) return;
    try {
      const url = baseUrl ? `${baseUrl}/api/settings/${settingToDelete._id}` : `/api/settings/${settingToDelete._id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete setting');
      }
      // Refresh the list
      fetchAllSettings(baseUrl);
      setWarningMessage(`Deleted settings successfully.`);
      setIsSuccessMessage(true);
      setShowSettingsDeleteConfirm(false);
      setSettingToDelete(null);
    } catch (error) {
      console.error('Error deleting setting:', error);
      setWarningMessage(`Failed to delete: ${error.message}`);
      setIsSuccessMessage(false);
      setShowSettingsDeleteConfirm(false);
      setSettingToDelete(null);
    }
  };

  const renderSavedSettingsList = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '25px',
        width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f2f5', paddingBottom: '15px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaList style={{ color: '#3498db' }} /> Saved System Settings
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{
              padding: '8px 16px', backgroundColor: '#e8f4fd', color: '#3498db', border: '1px solid #3498db',
              borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }} onClick={() => fetchAllSettings(baseUrl)}>
              Refresh
            </button>
            <button onClick={() => setShowSettingsList(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#95a5a6', cursor: 'pointer' }}>&times;</button>
          </div>
        </div>
        
        {isLoadingList ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#7f8c8d' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <table className="settings-list-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', color: '#34495e' }}>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Company</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Branch</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Country</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Currency</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Time Zone</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Date Format</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Time Format</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>Font</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e9ecef', fontWeight: '600', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allSettingsHistory.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#7f8c8d', fontSize: '15px' }}>No saved settings found.</td></tr>
                ) : (
                  allSettingsHistory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f2f6', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 15px', fontWeight: '600', color: '#3498db' }}>{item.company_name || 'Global'}</td>
                      <td style={{ padding: '12px 15px', color: '#2c3e50', fontWeight: '500' }}>{item.branch_name || 'All Branches'}</td>
                      <td style={{ padding: '12px 15px', color: '#7f8c8d' }}>{item.country}</td>
                      <td style={{ padding: '12px 15px', color: '#7f8c8d', fontWeight: '600' }}>{item.currency}</td>
                      <td style={{ padding: '12px 15px', color: '#7f8c8d', fontSize: '13px' }}>{item.timeZone}</td>
                      <td style={{ padding: '12px 15px', color: '#7f8c8d' }}>{item.dateFormat}</td>
                      <td style={{ padding: '12px 15px', color: '#7f8c8d' }}>{item.timeFormat}</td>
                      <td style={{ padding: '12px 15px', fontFamily: item.font_family, color: '#7f8c8d' }}>{item.font_family?.split(',')[0]}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button style={{ 
                            padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', 
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }} 
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#bbdefb'} 
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                          onClick={() => loadSavedSetting(item)}>Edit</button>

                          <button style={{ 
                            padding: '6px 12px', backgroundColor: '#ffebee', color: '#d32f2f', 
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }} 
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffcdd2'} 
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffebee'}
                          onClick={() => deleteSavedSetting(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #f0f2f5' }}>
          <button onClick={() => setShowSettingsList(false)} style={{ padding: '10px 25px', backgroundColor: '#f1f2f6', color: '#2f3640', border: '1px solid #dcdde1', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#dcdde1'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f2f6'}>Cancel</button>
          <button onClick={() => setShowSettingsList(false)} style={{ padding: '10px 25px', backgroundColor: '#3498db', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#2980b9'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#3498db'}>OK</button>
        </div>
      </div>
    </div>
  );

  const handleGoBack = () => navigate('/admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to update system settings.");
      setShowPermModal(true);
      return;
    }
    try {
      const url = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
      
      // If multi-select is active (Group Admin), save to all selected companies      
      if (isGroupAdmin && selectedCompanies.length > 0) {
        setWarningMessage('Saving settings for multiple companies...');
        setIsSuccessMessage(true);
        
        let successCount = 0;
        for (const company of selectedCompanies) {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...getHeaders(),
              'X-Company-Name': company,
              'X-Branch-Name': '' // Saving multi-company usually at global company level
            },
            body: JSON.stringify(settings),
          });
          if (response.ok) successCount++;
        }
        
        setWarningMessage(`Settings saved successfully for ${successCount} companies!`);
        setIsSuccessMessage(true);
      } else if ((isCompanyAdmin || isGroupAdmin) && selectedBranches.length > 0) {
        setWarningMessage('Saving settings for multiple branches...');
        setIsSuccessMessage(true);
        
        let successCount = 0;
        for (const branch of selectedBranches) {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...getHeaders(),
              'X-Branch-Name': branch
            },
            body: JSON.stringify(settings),
          });
          if (response.ok) successCount++;
        }
        
        setWarningMessage(`Settings saved successfully for ${successCount} branches!`);
        setIsSuccessMessage(true);
      } else {
        // Standard single save
        const response = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to save settings');
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        setWarningMessage('Settings saved successfully!');
        setIsSuccessMessage(true);
      }

      // If font was changed, reload to apply globally immediately
      if (activeTab === 'Font') {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setWarningMessage(`Failed to save settings: ${error.message}`);
      setIsSuccessMessage(false); // NEW: Mark as error
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
  };

  const handleDropdownClick = () => {
    setShowUserList(true);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to add users.");
      setShowPermModal(true);
      return;
    }
    if (newUser.email && newUser.firstName && newUser.phoneNumber && newUser.password) {
      const newUserData = {
        email: newUser.email,
        firstName: newUser.firstName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.roleProfile.toLowerCase(),
        password: newUser.password,
        status: 'Active',
        company: 'POS 8',
        pos_profile: 'POS-001',
      };

      try {
        const url = baseUrl ? `${baseUrl}/api/register` : '/api/register';
        const response = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(newUserData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add user');
        }

        await fetchUsers(baseUrl);
        setNewUser({ email: '', firstName: '', phoneNumber: '', roleProfile: 'User', password: '' });
        setShowAddUserForm(false);
        setWarningMessage('User added successfully! You can now login with these credentials.');
        setIsSuccessMessage(true); // NEW: Mark as success
      } catch (error) {
        console.error('Error adding user:', error);
        setWarningMessage(`Failed to add user: ${error.message}`);
        setIsSuccessMessage(false); // NEW: Mark as error
      }
    } else {
      setWarningMessage('Please fill in all required fields.');
      setIsSuccessMessage(false); // NEW: Mark as error
    }
  };

  const handleDeleteUser = (email) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to delete users.");
      setShowPermModal(true);
      return;
    }
    setUserToDelete(email);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const url = baseUrl ? `${baseUrl}/api/users/${userToDelete}` : `/api/users/${userToDelete}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      await fetchUsers(baseUrl);
      setWarningMessage('User deleted successfully!');
      setIsSuccessMessage(true); // NEW: Mark as success
    } catch (error) {
      console.error('Error deleting user:', error);
      setWarningMessage(`Failed to delete user: ${error.message}`);
      setIsSuccessMessage(false); // NEW: Mark as error
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const dateFormatOptions = [
    'dd-mm-yyyy',
    'mm-dd-yyyy',
    'yyyy-mm-dd',
    'dd/mm/yyyy',
    'mm/dd/yyyy',
    'yyyy/mm/dd',
    'yyyy-long-mm-dd' // New: yyyy longmonth dd, e.g., 2025 October 29
  ];

  const timeFormatOptions = [
    'HH:mm:ss', // 24-hour with seconds
    'hh:mm:ss a', // 12-hour with seconds and AM/PM
    'HH:mm', // 24-hour without seconds
    'hh:mm a' // 12-hour without seconds and AM/PM
  ];

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const roleProfileOptions = ['User', 'Admin', 'Bearer'];

  const renderUserList = () => (
    <div className="user-list-container">
      <div className="sidebar">
        <h3>Filters</h3>
        <div>
          <label>Filter By</label>
          <input type="text" placeholder="Begin typing" />
        </div>
        <button className="edit-filters-btn">Edit Filters</button>
        <label>
          <input type="checkbox" /> Show Tags
        </label>
        <div>
          <label>Save Filter</label>
          <input type="text" placeholder="Filter Name" />
        </div>
      </div>
      <div className="main-content">
        <div className="user-list-header">
          <h3>User List</h3>
          <button className="add-user-btn" onClick={() => setShowAddUserForm(true)}>Add User</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Status</th>
              <th>User Type</th>
              <th>Phone Number</th>
              <th>ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.fullName}</td>
                <td>{user.status}</td>
                <td>{user.userType}</td>
                <td>{user.phoneNumber}</td>
                <td>{user.id}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{users.length} of {users.length}</div>

        {showAddUserForm && (
          <div className="add-user-form">
            <h3>Add New User</h3>
            <div className="form-content">
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  placeholder="e.g., test@example.com"
                  required
                />
              </div>
              <div>
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleNewUserChange}
                  placeholder="e.g., Test"
                  required
                />
              </div>
              <div>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={handleNewUserChange}
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              <div>
                <label>Role Profile</label>
                <select name="roleProfile" value={newUser.roleProfile} onChange={handleNewUserChange}>
                  {roleProfileOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>
            <div className="form-buttons">
              <button className="cancel-btn" onClick={() => setShowAddUserForm(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddUser}>Save</button>
            </div>
          </div>
        )}

        <button className="back-btn" onClick={() => setShowUserList(false)}>Back to Settings</button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (showUserList) return renderUserList();
    switch (activeTab) {
      case 'Details':
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            {isGroupAdmin && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #d0e7ff' }}>
                <label style={{ fontWeight: 'bold', color: '#0056b3', marginBottom: '10px', display: 'block' }}>Target Companies</label>
                <div className="targets-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#fff',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  {availableCompanies.map((comp, idx) => (
                    <label key={idx} className="target-checkbox" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #f0f0f0',
                      backgroundColor: selectedCompanies.includes(comp) ? '#e6f7ff' : '#fafafa'
                    }}>
                      <input
                        type="checkbox"
                        value={comp}
                        checked={selectedCompanies.includes(comp)}
                        onChange={handleCompanyChange}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{comp}</span>
                    </label>
                  ))}
                </div>
                <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                  Settings will be saved for all selected Companies.
                </small>
              </div>
            )}
            {(isGroupAdmin || (isCompanyAdmin && !userBranchState)) && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f0ff', borderRadius: '8px', border: '1px solid #e9d0ff' }}>
                <label style={{ fontWeight: 'bold', color: '#6a00b3', marginBottom: '10px', display: 'block' }}>Target Branches</label>
                <div className="targets-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#fff',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  {availableBranches.map((br, idx) => (
                    <label key={idx} className="target-checkbox" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #f0f0f0',
                      backgroundColor: selectedBranches.includes(br) ? '#f3e6ff' : '#fafafa'
                    }}>
                      <input
                        type="checkbox"
                        value={br}
                        checked={selectedBranches.includes(br)}
                        onChange={handleBranchCheckboxChange}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{br}</span>
                    </label>
                  ))}
                </div>
                <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                  Settings will be saved for all selected Branches.
                </small>
              </div>
            )}
            <div>
              <label htmlFor="country">Country</label>
              <input type="text" id="country" name="country" value={settings.country} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="language">Language</label>
              <input type="text" id="language" name="language" value={settings.language} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="timeZone">Time Zone</label>
              <input type="text" id="timeZone" name="timeZone" value={settings.timeZone} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" value={settings.currency} onChange={handleInputChange}>
                <option value="INR">INR (₹) - India</option>
                <option value="USD">USD ($) - USA</option>
                <option value="EUR">EUR (€) - Eurozone</option>
                <option value="GBP">GBP (£) - UK</option>
                <option value="AED">AED (د.إ) - UAE</option>
                <option value="JPY">JPY (¥) - Japan</option>
                <option value="CNY">CNY (¥) - China</option>
                <option value="SGD">SGD ($) - Singapore</option>
                <option value="MYR">MYR (RM) - Malaysia</option>
                <option value="THB">THB (฿) - Thailand</option>
                <option value="IDR">IDR (Rp) - Indonesia</option>
                <option value="KRW">KRW (₩) - South Korea</option>
                <option value="PHP">PHP (₱) - Philippines</option>
                <option value="SAR">SAR (﷼) - Saudi Arabia</option>
                <option value="QAR">QAR (﷼) - Qatar</option>
                <option value="KWD">KWD (د.ك) - Kuwait</option>
                <option value="OMR">OMR (﷼) - Oman</option>
                <option value="BHD">BHD (.د.ب) - Bahrain</option>
                <option value="CAD">CAD ($) - Canada</option>
                <option value="AUD">AUD ($) - Australia</option>
                <option value="NZD">NZD ($) - New Zealand</option>
                <option value="CHF">CHF (CHF) - Switzerland</option>
                <option value="ZAR">ZAR (R) - South Africa</option>
                <option value="BRL">BRL (R$) - Brazil</option>
                <option value="PKR">PKR (₨) - Pakistan</option>
                <option value="LKR">LKR (Rs) - Sri Lanka</option>
                <option value="NGN">NGN (₦) - Nigeria</option>
              </select>
            </div>
            <div>
              <label>
                <input type="checkbox" name="useCurrencySymbol" checked={settings.useCurrencySymbol} onChange={handleInputChange} />
                Display Currency directly as Symbol (e.g. ₹ instead of INR)
              </label>
            </div>
            <div>
              <label htmlFor="dateFormat">Date Format</label>
              <select id="dateFormat" name="dateFormat" value={settings.dateFormat} onChange={handleInputChange}>
                {dateFormatOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeFormat">Time Format</label>
              <select id="timeFormat" name="timeFormat" value={settings.timeFormat} onChange={handleInputChange}>
                {timeFormatOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="numberFormat">Number Format</label>
              <input type="text" id="numberFormat" name="numberFormat" value={settings.numberFormat} onChange={handleInputChange} />
            </div>
            <div>
              <label>
                <input type="checkbox" name="useNumberFormatFromCurrency" checked={settings.useNumberFormatFromCurrency} onChange={handleInputChange} />
                Use Number Format from Currency
              </label>
            </div>
            <div>
              <label htmlFor="firstDayOfWeek">First Day of the Week</label>
              <select id="firstDayOfWeek" name="firstDayOfWeek" value={settings.firstDayOfWeek} onChange={handleInputChange}>
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="floatPrecision">Float Precision</label>
              <input type="number" id="floatPrecision" name="floatPrecision" value={settings.floatPrecision} onChange={handleInputChange} min="1" max="10" />
            </div>
            <div>
              <label htmlFor="currencyPrecision">Currency Precision</label>
              <input type="number" id="currencyPrecision" name="currencyPrecision" value={settings.currencyPrecision} onChange={handleInputChange} placeholder="Depends on number format" />
            </div>
            <button type="submit" className="save-settings-btn">Save Settings</button>
          </form>
        );
      case 'Login':
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <div>
              <label htmlFor="sessionExpiry">Session Expiry (HH:MM)</label>
              <input type="text" id="sessionExpiry" name="sessionExpiry" value={settings.sessionExpiry} onChange={handleInputChange} placeholder="e.g., 24:00" />
              <small>Example: 24:00 logs out after 24 hours of inactivity</small>
            </div>
            <div>
              <label htmlFor="documentShareKeyExpiry">Document Share Key Expiry (Days)</label>
              <input type="number" id="documentShareKeyExpiry" name="documentShareKeyExpiry" value={settings.documentShareKeyExpiry} onChange={handleInputChange} min="1" />
              <small>Days until Web View link expires</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="denyMultipleSessions" checked={settings.denyMultipleSessions} onChange={handleInputChange} />
                Allow Only One Session Per User
              </label>
              <small>Multiple sessions allowed on mobile</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="disableUserPassLogin" checked={settings.disableUserPassLogin} onChange={handleInputChange} />
                Disable Username/Password Login
              </label>
              <small>Configure Social Login first</small>
            </div>
            <div>
              <label>
                <input type="checkbox" name="allowLoginUsingMobileNumber" checked={settings.allowLoginUsingMobileNumber} onChange={handleInputChange} />
                Allow Login Using Mobile Number
              </label>
            </div>
            <div>
              <label>
                <input type="checkbox" name="allowLoginUsingUserName" checked={settings.allowLoginUsingUserName} onChange={handleInputChange} />
                Allow Login Using User Name
              </label>
            </div>
            <div>
              <label>
                <input type="checkbox" name="loginWithEmailLink" checked={settings.loginWithEmailLink} onChange={handleInputChange} />
                Login with Email Link
              </label>
              <small>Passwordless login via email</small>
            </div>
            <div>
              <label htmlFor="allowConsecutiveLoginAttempts">Allow Consecutive Login Attempts</label>
              <input type="number" id="allowConsecutiveLoginAttempts" name="allowConsecutiveLoginAttempts" value={settings.allowConsecutiveLoginAttempts} onChange={handleInputChange} min="0" />
            </div>
            <div>
              <label htmlFor="allowLoginAfterFail">Allow Login After Fail (Seconds)</label>
              <input type="number" id="allowLoginAfterFail" name="allowLoginAfterFail" value={settings.allowLoginAfterFail} onChange={handleInputChange} min="0" />
            </div>
            <div>
              <label>
                <input type="checkbox" name="enableTwoFactorAuth" checked={settings.enableTwoFactorAuth} onChange={handleInputChange} />
                Enable Two Factor Authentication
              </label>
            </div>
            <button type="submit" className="save-settings-btn">Save Settings</button>
          </form>
        );

      case 'Voice': // NEW: Voice Settings tab
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <div style={{ marginBottom: '20px' }}>
              <label>Voice Language</label>
              <select
                name="voiceLanguage"
                value={settings.voiceLanguage}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="en-US">English (English)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="ml-IN">Malayalam (മലയാളം)</option>
                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="ur-PK">Urdu (اردو)</option>
                <option value="ar-SA">Arabic (العربية)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Voice Model</label>
              <select
                name="voiceName"
                value={settings.voiceName}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="">Browser Default</option>
                {availableVoices
                  .filter(v => v.lang.startsWith(settings.voiceLanguage.split('-')[0]))
                  .map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
              <small style={{ color: '#666' }}>If no voices appear, your browser/OS might not support this language natively.</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Voice Speed (Rate: {settings.voiceRate})</label>
              <input
                type="range"
                name="voiceRate"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.voiceRate}
                onChange={handleInputChange}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>Voice Repetition Count</label>
              <input
                type="number"
                name="voiceRepeatCount"
                min="1"
                max="10"
                value={settings.voiceRepeatCount}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <small style={{ color: '#666' }}>How many times the order announcement should be repeated.</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Repetition Interval Delay</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>Hours</label>
                  <input
                    type="number"
                    name="voiceRepeatIntervalHours"
                    min="0"
                    max="23"
                    value={settings.voiceRepeatIntervalHours || 0}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>Minutes</label>
                  <input
                    type="number"
                    name="voiceRepeatIntervalMinutes"
                    min="0"
                    max="59"
                    value={settings.voiceRepeatIntervalMinutes || 0}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>Seconds</label>
                  <input
                    type="number"
                    name="voiceRepeatIntervalSeconds"
                    min="0"
                    max="59"
                    value={settings.voiceRepeatIntervalSeconds || 10}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>Set the specific time interval between each voice repetition.</small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance("This is a test announcement.");
                  const voice = availableVoices.find(v => v.name === settings.voiceName);
                  if (voice) utterance.voice = voice;
                  utterance.lang = settings.voiceLanguage;
                  utterance.rate = parseFloat(settings.voiceRate) || 1.0;
                  window.speechSynthesis.speak(utterance);
                }}
                className="test-voice-btn"
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f1f1',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Test Voice
              </button>
              <button
                type="submit"
                className="save-settings-btn"
                style={{ flex: 2 }}
              >
                Save Voice Settings
              </button>
            </div>
          </form>
        );
      case 'Font': // NEW: Font Settings tab
        return (
          <form onSubmit={handleSubmit} className="settings-form">
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Global Font Settings
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="font_family">Select Application Font</label>
              <select
                id="font_family"
                name="font_family"
                value={settings.font_family}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '1rem', appearance: 'none', background: 'white' }}
              >
                <option value="Dubai Regular" style={{ fontFamily: 'Dubai Regular' }}>Dubai Regular (Default)</option>
                <option value="'Roboto', sans-serif" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                <option value="'Open Sans', sans-serif" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                <option value="'Montserrat', sans-serif" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                <option value="'Poppins', sans-serif" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                <option value="'Inter', sans-serif" style={{ fontFamily: 'Inter' }}>Inter</option>
                <option value="Arial, sans-serif" style={{ fontFamily: 'Arial' }}>Arial</option>
                <option value="Georgia, serif" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                <option value="system-ui, -apple-system, sans-serif">System Default</option>
              </select>
              <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
                This font will be applied globally across all pages and reports.
              </small>
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              border: '1px dashed #ccc',
              borderRadius: '8px',
              fontFamily: settings.font_family,
              backgroundColor: '#f9f9f9'
            }}>
              <h4 style={{ marginBottom: '10px' }}>Font Preview</h4>
              <p>The quick brown fox jumps over the lazy dog.</p>
              <p style={{ fontWeight: 'bold' }}>Bold: The quick brown fox jumps over the lazy dog.</p>
              <p style={{ fontStyle: 'italic' }}>Italic: The quick brown fox jumps over the lazy dog.</p>
            </div>

            <button type="submit" className="save-settings-btn" style={{ marginTop: '20px' }}>
              Save Font Settings
            </button>
          </form>
        );
      case 'Payment':
        return (
          <div className="settings-form">
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Order Type Payment Button Settings
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Order Type</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Pay Button</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Pay Later Button</th>
                </tr>
              </thead>
              <tbody>
                {['takeaway', 'dinein', 'onlinedelivery'].map((type) => (
                  <tr key={type} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '500', textTransform: 'capitalize' }}>
                      {type === 'onlinedelivery' ? 'Online Delivery' : type === 'dinein' ? 'Dine In' : type}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        name={`paymentSettings.${type}.pay`}
                        checked={settings.paymentSettings[type].pay}
                        onChange={handleInputChange}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        name={`paymentSettings.${type}.payLater`}
                        checked={settings.paymentSettings[type].payLater}
                        onChange={handleInputChange}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleSubmit} className="save-settings-btn">
              Save Payment Settings
            </button>
          </div>
        );
      default:
        return <div className="coming-soon">Coming soon...</div>;
    }
  };

  const tabs = ['Details', 'Login', 'Voice', 'Font', 'Payment']; // UPDATED: Removed 'Working Days'

  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '10px' }}>Access Denied</h2>
          <p>You do not have permission to view System Settings.</p>
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
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
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
      {/* Fixed Back Button - Styled like EmployeeList */}
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

      {/* Main Container - Styled like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        // overflow: 'hidden' - REMOVED to allow scrolling
      }}>
        {/* Header with Title - Styled like EmployeeList */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h2 style={{
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaList onClick={() => { setShowSettingsList(true); fetchAllSettings(baseUrl); }} style={{ cursor: 'pointer', color: '#3498db' }} title="Show Saved Settings List" />
            System Settings
          </h2>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(isGroupAdmin || (isCompanyAdmin && !userBranchState)) && (
              <>
                {isGroupAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBuilding style={{ color: '#3498db' }} />
                    <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>Companies:</label>
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: '1.5px solid #e0e0e0', 
                      background: '#f8f9fa',
                      fontSize: '13px',
                      color: '#666',
                      maxWidth: '250px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {selectedCompanies.length === 0 ? "Global / None" : selectedCompanies.join(', ')}
                    </div>
                  </div>
                )}

                <button 
                  className="add-user-btn" 
                  onClick={() => { setShowSettingsList(true); fetchAllSettings(baseUrl); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaList /> List View
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Container */}
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search (e.g., userlist)"
          />
          {showDropdown && (
            <div className="dropdown">
              <div className="dropdown-item" onClick={handleDropdownClick}>User List</div>
            </div>
          )}
        </div>

        {warningMessage && (
          <div
            className={`message-overlay ${isSuccessMessage ? 'success-overlay' : 'error-overlay'}`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className={`message-box ${isSuccessMessage ? 'success-box' : 'error-box'}`}
              style={{
                backgroundColor: isSuccessMessage ? '#4CAF50' : '#f44336',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                position: 'relative',
              }}
            >
              <p className="message-text" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                {warningMessage}
              </p>
              <button
                className="close-message"
                onClick={() => setWarningMessage('')}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {!showUserList && (
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'active-tab' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="content">
          {renderTabContent()}
          {showSettingsList && renderSavedSettingsList()}
        </div>

        {showDeleteConfirm && (
          <>
            <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} />
            <div className="confirm-modal">
              <p className="confirm-text">Are you sure you want to delete user {userToDelete}?</p>
              <div className="modal-button-group">
                <button className="confirm-delete-btn" onClick={confirmDelete}>
                  Yes, Delete
                </button>
                <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>
                  No, Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {showSettingsDeleteConfirm && settingToDelete && (
          <>
            <div className="modal-overlay" onClick={() => setShowSettingsDeleteConfirm(false)} style={{ zIndex: 10001 }} />
            <div className="confirm-modal" style={{ zIndex: 10002 }}>
              <p className="confirm-text">Are you sure you want to delete the settings for {settingToDelete.company_name || 'Global'} - {settingToDelete.branch_name || 'All Branches'}?</p>
              <div className="modal-button-group">
                <button className="confirm-delete-btn" onClick={confirmDeleteSetting}>
                  Yes, Delete
                </button>
                <button className="cancel-delete-btn" onClick={() => setShowSettingsDeleteConfirm(false)}>
                  No, Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
