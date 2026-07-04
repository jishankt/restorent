import React, { useState, useEffect } from "react";
import axios from 'axios';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";

const PrintSettingsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: "",
    street: "",
    city: "",
    pincode: "",
    phone: "",
    gstin: "",
    thankYouMessage: "",
    poweredBy: "",
    branch_name: "",
  });
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showList, setShowList] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [baseUrl, setBaseUrl] = useState("");
  // Permissions
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);

  // Branch Selection
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [userBranch, setUserBranch] = useState(null);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  // Fetch logo for preview
  const fetchLogo = async (currentBaseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/logo`);
      if (response.data.logo) {
        setLogoUrl(currentBaseUrl + response.data.logo);
      }
    } catch (err) {
      console.error("Failed to fetch logo for preview:", err);
    }
  };

  const fetchPermissions = async (currentBaseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const isAdminRole = checkIsAdmin(userObj);
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);
        const branch = userObj.branch_name || userObj.branch || "";
        const role = userObj.role || userObj.UserType || "";

        setIsCompanyAdmin(isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);
        setUserBranch(branch);

        if (isGroupAdminRole) {
          const comps = userObj.companies || (userObj.company ? [userObj.company] : []);
          setAssignedCompanies(comps);
        } else if (isAdminRole) {
          setSelectedCompanies(userObj.company ? [userObj.company] : []);
        }
        
        if (!isAdminRole && branch) {
          setSelectedBranches([branch]);
          setFormData(prev => ({ ...prev, branch_name: branch }));
        }

        if (role) {
          const url = `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(role)}`;
          // Get headers using a helper or manually since getHeaders might not be available here yet
          const token = localStorage.getItem('token');
          const company = userObj.company_name || userObj.company || "";
          const response = await axios.get(url, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'X-Company-Name': company,
              'X-Branch-Name': branch
            }
          });
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'print_settings');

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
        setAvailableBranches([]);
        return;
      }

      const response = await axios.get(`${currentBaseUrl || baseUrl}/api/branches`, {
        headers: { 'X-Company-Name': company_name }
      });
      setAvailableBranches(response.data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchAllSettings = async () => {
    const currentBaseUrl = baseUrl || '';
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const headers = {
        'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company)
      };
      if (!isCompanyAdmin && userBranch) {
        headers['X-Branch-Name'] = userBranch;
      }

      const response = await axios.get(`${currentBaseUrl}/api/print_settings`, { headers });
      setSettingsList(response.data);
      const activeSetting = response.data.find(setting => setting.active);
      if (activeSetting) {
        setSelectedId(activeSetting._id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSetting = async (id) => {
    const currentBaseUrl = baseUrl || '';
    setLoading(true);
    try {
      const response = await axios.get(`${currentBaseUrl}/api/print_settings/${id}`);
      const data = response.data;
      setFormData(data);
      setSelectedBranches([data.branch_name]);
      setEditId(id);
      setShowForm(true);
      setShowList(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setMessage({ type: 'error', text: "You do not have permission to update print settings." });
      return;
    }

    if (isGroupAdmin && selectedCompanies.length === 0) {
      setMessage({ type: 'error', text: "Please select at least one company." });
      return;
    }

    const currentBaseUrl = baseUrl || '';
    setLoading(true);
    setMessage(null);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};

      if (editId) {
        const activeComp = selectedCompanies[0] || userObj.company;
        const activeBranch = selectedBranches[0] || userBranch || "";
        const url = `${currentBaseUrl}/api/print_settings/${editId}`;
        await axios.put(url, { ...formData, branch_name: activeBranch }, { 
          headers: { 
            'X-Company-Name': activeComp,
            'X-Branch-Name': activeBranch
          } 
        });
      } else {
        const companiesToSave = isGroupAdmin ? selectedCompanies : [userObj.company];
        for (const company of companiesToSave) {
          const branchesToSave = selectedBranches.length > 0 ? selectedBranches : [""];
          for (const branch of branchesToSave) {
            const url = `${currentBaseUrl}/api/print_settings`;
            await axios.post(url, { ...formData, branch_name: branch }, { 
              headers: { 
                'X-Company-Name': company,
                'X-Branch-Name': branch
              } 
            });
          }
        }
      }

      setMessage({ type: 'success', text: editId ? "Print settings updated successfully" : "Print settings saved successfully" });
      resetForm();
      fetchAllSettings();
      setShowList(true);
      setShowForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      setMessage({ type: 'error', text: "You do not have permission to delete print settings." });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this setting?")) return;
    const currentBaseUrl = baseUrl || '';
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const response = await axios.delete(`${currentBaseUrl}/api/print_settings/${id}`, {
        headers: { 'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company) }
      });
      setMessage({ type: 'success', text: response.data.message });
      fetchAllSettings();
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async () => {
    if (!canWrite) {
      setMessage({ type: 'error', text: "You do not have permission to change active settings." });
      return;
    }
    const currentBaseUrl = baseUrl || '';
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const headers = {
        'X-Company-Name': (selectedCompanies.length > 0 ? selectedCompanies.join(',') : userObj.company)
      };

      if (selectedId) {
        const setting = settingsList.find(s => s._id === selectedId);
        if (setting && setting.branch_name) headers['X-Branch-Name'] = setting.branch_name;
        const response = await axios.put(`${currentBaseUrl}/api/print_settings/set_active/${selectedId}`, {}, { headers });
        setMessage({ type: 'success', text: response.data.message });
      } else {
        const response = await axios.put(`${currentBaseUrl}/api/print_settings/deactivate_all`, {}, { headers });
        setMessage({ type: 'success', text: response.data.message });
      }
      fetchAllSettings();
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      restaurantName: "",
      street: "",
      city: "",
      pincode: "",
      phone: "",
      gstin: "",
      thankYouMessage: "",
      poweredBy: "",
      branch_name: "",
    });
    setEditId(null);
    setSelectedBranches(!isCompanyAdmin && userBranch ? [userBranch] : []);
  };

  const toggleToList = () => { fetchAllSettings(); setShowList(true); setShowForm(false); };
  const toggleToForm = () => { resetForm(); setShowList(false); setShowForm(true); };
  const handleBack = () => { if (showList) toggleToForm(); else window.history.back(); };

  const fetchConfig = async () => {
    let currentBaseUrl = '';
    try {
      const response = await axios.get("/api/network_info");
      const { config: appConfig } = response.data;
      if (appConfig.mode === "client") {
        currentBaseUrl = `http://${appConfig.server_ip}:6034`;
        setBaseUrl(currentBaseUrl);
      }
    } catch (error) { console.error("Failed to fetch config:", error); }
    finally { fetchLogo(currentBaseUrl); fetchPermissions(currentBaseUrl); fetchBranches(currentBaseUrl); }
  };

  useEffect(() => { fetchConfig(); }, []);

  if (permsLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}><p>Loading...</p></div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '10px' }}>Access Denied</h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '50px', background: '#3498db', color: '#fff', border: 'none' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px' }}>
      <button onClick={handleBack} style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent', border: '2px solid #3498db', color: '#3498db', padding: '8px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1001 }}> <FaArrowLeft /> Back </button>

      <div style={{ maxWidth: '1250px', margin: '80px auto', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1565c0', textAlign: 'center', marginBottom: '30px', textTransform: 'uppercase' }}>🖨️ Print Settings</h1>

        {message && <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '4px', textAlign: 'center', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>{message.text}</div>}

        {isGroupAdmin && (
          <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(52,152,219,0.05)', borderRadius: '16px', border: '1px solid rgba(52,152,219,0.2)' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#1565c0', marginBottom: '10px' }}>🏢 SELECT TARGET COMPANIES:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <div style={{ width: '100%', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <input type="checkbox" id="all-comp" checked={selectedCompanies.length === assignedCompanies.length} onChange={(e) => { e.target.checked ? setSelectedCompanies(assignedCompanies) : setSelectedCompanies([]); fetchBranches(baseUrl, e.target.checked ? assignedCompanies.join(',') : ""); fetchAllSettings(); }} />
                <label htmlFor="all-comp" style={{ marginLeft: '8px', fontWeight: 'bold' }}>SELECT ALL COMPANIES</label>
              </div>
              {assignedCompanies.map((comp, i) => (
                <div key={i} style={{ minWidth: '150px' }}>
                  <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={(e) => { const next = e.target.checked ? [...selectedCompanies, comp] : selectedCompanies.filter(c => c !== comp); setSelectedCompanies(next); fetchBranches(baseUrl, next.join(',')); fetchAllSettings(); }} />
                  <label style={{ marginLeft: '8px' }}>{comp}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, padding: '25px', border: '1px solid #edf2f7', borderRadius: '16px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {(isGroupAdmin || (isCompanyAdmin && !localStorage.getItem('branch_name'))) && availableBranches.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontWeight: 'bold' }}>📍 SELECT BRANCHES (OPTIONAL):</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                      {availableBranches.map((b, i) => { const n = b.branch_name || b; return ( <div key={i}><input type="checkbox" checked={selectedBranches.includes(n)} onChange={(e) => e.target.checked ? setSelectedBranches([...selectedBranches, n]) : setSelectedBranches(selectedBranches.filter(x => x !== n))} /> <label>{n}</label></div> ); })}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: 'span 2' }}><label style={{ fontWeight: 'bold' }}>Restaurant Name:</label> <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div><label>Street:</label> <input type="text" name="street" value={formData.street} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div><label>City:</label> <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div><label>Pincode:</label> <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div><label>Phone:</label> <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div><label>GSTIN:</label> <input type="text" name="gstin" value={formData.gstin || ""} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div style={{ gridColumn: 'span 2' }}><label>Thank You Message:</label> <input type="text" name="thankYouMessage" value={formData.thankYouMessage || ""} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div style={{ gridColumn: 'span 2' }}><label>Powered By:</label> <input type="text" name="poweredBy" value={formData.poweredBy} onChange={handleChange} style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #3498db' }} /></div>
                <div style={{ gridColumn: 'span 2', textAlign: 'center', marginTop: '20px' }}><button type="submit" style={{ padding: '10px 30px', borderRadius: '50px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 'bold' }}>Save</button> <button type="button" onClick={toggleToList} style={{ padding: '10px 30px', borderRadius: '50px', background: '#10b981', color: '#fff', border: 'none', marginLeft: '10px' }}>View List</button></div>
              </form>
            </div>
            <div style={{ width: '400px', padding: '20px', border: '1px solid #3498db', borderRadius: '16px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>Receipt Preview</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                {logoUrl && <img src={logoUrl} alt="logo" style={{ width: '60px' }} />}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{formData.restaurantName || "Restaurant Name"}</div>
                  {formData.street && <div>{formData.street}</div>}
                  <div>{formData.city}{formData.pincode ? ` - ${formData.pincode}` : ''}</div>
                  {formData.phone && <div>Ph: {formData.phone}</div>}
                  {formData.gstin && <div>GSTIN: {formData.gstin}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}><div>{formData.thankYouMessage}</div><div style={{ fontSize: '12px' }}>Powered by {formData.poweredBy}</div></div>
            </div>
          </div>
        )}

        {showList && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}><button onClick={toggleToForm} style={{ padding: '10px 20px', borderRadius: '50px', background: '#3b82f6', color: '#fff', border: 'none' }}>+ Create New</button> <button onClick={handleUse} style={{ padding: '10px 20px', borderRadius: '50px', background: '#ffcc00', border: 'none', marginLeft: '10px' }}>Activate Selected</button></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>No.</th><th></th>
                    {isGroupAdmin && <th style={{ padding: '12px' }}>Company</th>}
                    {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && <th style={{ padding: '12px' }}>Branch</th>}
                    <th style={{ padding: '12px' }}>Restaurant</th><th>Active</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settingsList.map((s, i) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #edf2f7', background: s.active ? '#f0fff4' : '#fff' }}>
                      <td style={{ padding: '12px' }}>{i + 1}</td>
                      <td><input type="radio" checked={selectedId === s._id} onChange={() => setSelectedId(s._id)} /></td>
                      {isGroupAdmin && <td style={{ padding: '12px' }}>{s.company_name || s.company}</td>}
                      {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && <td style={{ padding: '12px' }}>{s.branch_name || 'All'}</td>}
                      <td style={{ padding: '12px' }}>{s.restaurantName}</td>
                      <td>{s.active ? '✅' : ''}</td>
                      <td><button onClick={() => fetchSetting(s._id)} style={{ padding: '5px 10px', background: '#4f46e5', color: '#fff', borderRadius: '4px', border: 'none' }}>Edit</button> <button onClick={() => handleDelete(s._id)} style={{ padding: '5px 10px', background: '#ef4444', color: '#fff', borderRadius: '4px', border: 'none', marginLeft: '5px' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintSettingsPage;
