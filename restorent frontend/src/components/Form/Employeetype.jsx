import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaArrowLeft, 
  FaUsersCog, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaSave,
  FaTimes,
  FaExclamationCircle,
  FaCog
,
  FaBuilding,
  FaMapMarkerAlt
} from 'react-icons/fa';
import CustomerCustomizationModal from "./CustomerCustomizationModal";
import { UserContext } from '../../Context/UserContext';

/**
 * EmployeeType Page
 * Manages employee classifications with dynamic metadata support.
 */
const EmployeeType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);

  // Data States
  const [types, setTypes] = useState([]);
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [permissions, setPermissions] = useState({ canWrite: false, canDelete: false });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
// Form & Multi-Tenancy States
  const [formData, setFormData] = useState({});
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);


  // Filter state for dynamic branches
  const [filterBranches, setFilterBranches] = useState([]);
  const [selectedViewCompany, setSelectedViewCompany] = useState('');

  useEffect(() => {
    const fetchFilterBranches = async () => {
      try {
        const url = baseUrl || "";
        const comp = selectedViewCompany || localStorage.getItem('active_company');
        if (!comp || comp === 'All') {
            setFilterBranches(availableBranches); // fallback
            return;
        }
        
        const localGetHeaders = () => {
          const token = localStorage.getItem('token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        };
        const headersFunc = typeof getHeaders === 'function' ? getHeaders : localGetHeaders;

        const resp = await axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: { ...headersFunc(), "X-Company-Name": comp }});
        setFilterBranches([...new Set(resp.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name)).filter(Boolean))]);
      } catch (err) {
        console.error("Error fetching filter branches:", err);
      }
    };
    fetchFilterBranches();
  }, [selectedViewCompany, baseUrl, availableBranches]);


  
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);

  // Fetch DocType Metadata
  const fetchMetadata = async (url) => {
    try {
      const response = await axios.get(`${url}/api/doctypes/${encodeURIComponent('Employee Type')}`, { headers: getHeaders() });
      const fields = response.data.fields || [];
      setDoctypeFields(fields);

      // Initialize form data with default values from metadata
      const initialForm = { branch_names: [] };
      fields.forEach(f => {
        const type = (f.type || '').toLowerCase();
        if (type === 'check') initialForm[f.id] = f.default_value !== undefined ? f.default_value : false;
        else initialForm[f.id] = f.default_value || '';
      });
      setFormData(initialForm);
    } catch (err) {
      console.error("Metadata Fetch Error:", err);
      // Fallback to basic fields if API fails
      const fallbackFields = [
        { id: 'type_name', label: 'Department / Type', type: 'Data', mandatory: true },
        { id: 'description', label: 'Description', type: 'Text', mandatory: true },
        { id: 'salary_range', label: 'Salary Range', type: 'Data', mandatory: true }
      ];
      setDoctypeFields(fallbackFields);
      const initialForm = { branch_names: [] };
      fallbackFields.forEach(f => initialForm[f.id] = '');
      setFormData(initialForm);
    }
  };

  // Fetch All Types
  const fetchTypesData = async (url) => {
    try {
      const response = await axios.get(`${url}/api/employee-types`, { headers: getHeaders() });
      setTypes(response.data);
    } catch (err) {
      console.error("Fetch Types Error:", err);
      setError("Failed to load employee types.");
    }
  };

  // Fetch Permissions & Context
  const fetchContext = async (url) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const roleRaw = user.role?.toLowerCase() || user.UserType?.toLowerCase() || '';
      const role = roleRaw.replace(' ', '_');
      const branch = user.branch_name || user.branch || "";
      
      const is_Admin = ['company_admin', 'admin', 'group_admin', 'groupadmin', 'tenant_admin', 'super_admin'].includes(role) && (!branch || branch === 'All Branches' || branch === "");
      const is_Group = ['group_admin', 'groupadmin', 'tenant_admin', 'super_admin'].includes(role);
      
      setIsGroupAdmin(is_Group);
      setIsCompanyAdmin(is_Admin);

      // Admin bypass for permissions
      if (is_Admin || role === 'branch_admin') {
        setPermissions({ canWrite: true, canDelete: true });
      } else {
        const resp = await axios.get(`${url}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`, { headers: getHeaders() });
        const perms = resp.data.permissions || [];
        const pagePerm = perms.find(p => p.pageId === 'employee_types');
        setPermissions({
          canWrite: pagePerm?.canWrite || false,
          canDelete: pagePerm?.canDelete || false
        });
      }

      // Handle Multi-Tenancy Selection
      let comps = [];
      if (user.companies && user.companies.length > 0) {
        comps = user.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
      } else if (user.company_name || user.company) {
        comps = [user.company_name || user.company];
      } else {
        const res = await axios.get(`${url}/api/company-details`, { headers: typeof getHeaders === 'function' ? getHeaders() : {} });
        const details = res.data.companyDetails || [];
        comps = details.map(d => d.restaurantName || d.company_name).filter(n => n);
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : [];
      setCompanyOptions(finalComps);

      const activeContext = localStorage.getItem('active_company');
      if (activeContext && activeContext !== 'All') {
        setSelectedCompanies([activeContext || user.company_name || ""]);
      } else if (activeContext === 'All' || !activeContext) {
        setSelectedCompanies([]); // Let user select in the modal
      }

      // Fetch Branches per company (SaaS: must pass company_name)
      const allBranchNames = [];
      await Promise.all(finalComps.map(async comp => {
        try {
          const res = await axios.get(
            `${url}/api/branches?company_name=${encodeURIComponent(comp)}`,
            { headers: { ...getHeaders(), 'X-Company-Name': comp } }
          );
          (res.data || []).forEach(b => {
            const n = typeof b === 'string' ? b : (b.branch_name || b.name || '');
            if (n && !allBranchNames.includes(n)) allBranchNames.push(n);
          });
        } catch (e) { console.warn('Branch fetch error', comp, e); }
      }));
      setAvailableBranches(allBranchNames);

    } catch (err) {
      console.error("Context Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (configLoading) return;
    const url = baseUrl || "";
    
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchMetadata(url),
        fetchTypesData(url),
        fetchContext(url)
      ]);
      setLoading(false);
    };
    init();
  }, [baseUrl, configLoading]);

  // Handle Navigation State
  useEffect(() => {
    if (location.state?.fromAddEmployee) {
      setShowForm(true);
      if (location.state.selectedBranches) {
        setFormData(prev => ({ ...prev, branch_names: location.state.selectedBranches }));
      }
    }
  }, [location.state]);

  const handleBack = () => {
    if (location.state?.fromAddEmployee) {
      navigate('/add-employee', { state: location.state?.originalAddEmployeeState || location.state });
    } else if (showForm) {
      setShowForm(false);
      setEditingId(null);
      setFormData({});
    } else {
      navigate('/admin');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleBranchSelection = (branchName) => {
    setFormData(prev => {
      const current = prev.branch_names || [];
      return {
        ...prev,
        branch_names: current.includes(branchName) 
          ? current.filter(b => b !== branchName) 
          : [...current, branchName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canWrite) return setError("Unauthorized access.");

    // Validation
    const missing = doctypeFields.filter(f => f.mandatory && !formData[f.id]);
    if (missing.length > 0) return setError(`Missing required fields: ${missing.map(f => f.label).join(', ')}`);

    try {
      setLoading(true);
      const url = `${baseUrl || ""}/api/employee-types`;
      const activeContext = localStorage.getItem('active_company');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const finalCompanies = activeContext === 'All' ? selectedCompanies : [activeContext || user.company_name || ""];

      const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
      const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
      const branchesToProcess = isSpecificBranchActive ? [activeBranchLocal] : (formData.branch_names || []);
      const payload = {
        ...formData,
        company_names: finalCompanies,
        company_name: finalCompanies[0] || "",
        branch_names: branchesToProcess,
        branch_name: branchesToProcess[0] || ""
      };

      if (editingId) {
        const itemToEdit = types.find(t => (t._id || t.id) === editingId);
        if (itemToEdit?.global_ref_id) {
          await axios.put(`${url}/bulk/${itemToEdit.global_ref_id}`, payload, { headers: getHeaders() });
        } else {
          await axios.put(`${url}/${editingId}`, payload, { headers: getHeaders() });
        }
        setSuccessMessage("Type updated successfully.");
      } else {
        await axios.post(url, payload, { headers: getHeaders() });
        setSuccessMessage("Type added successfully.");
      }

      if (location.state?.fromAddEmployee) {
        setTimeout(() => navigate('/add-employee', { 
          state: { 
            formData: { ...location.state.formData, employeeType: formData.name },
            newEmployeeType: formData.name
          }
        }), 1500);
      } else {
        setTimeout(() => {
          setShowForm(false);
          setEditingId(null);
          setSuccessMessage('');
          fetchTypesData(baseUrl || "");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save type.");
    } finally {
      setLoading(false);
    }
  };

  const initiateEdit = (type) => {
    let relatedTypes = [type];
    if (type.global_ref_id) {
      relatedTypes = types.filter(t => t.global_ref_id === type.global_ref_id);
    }
    
    setEditingId(type._id || type.id);
    
    const comps = new Set();
    const brs = new Set();
    
    relatedTypes.forEach(t => {
      if (t.company_names && Array.isArray(t.company_names)) t.company_names.forEach(c => comps.add(c));
      else if (t.company_name) comps.add(t.company_name);
      
      if (t.branch_names && Array.isArray(t.branch_names)) t.branch_names.forEach(b => brs.add(b));
      else if (t.branch_names && typeof t.branch_names === 'string') t.branch_names.split(',').forEach(b => brs.add(b.trim()));
      else if (t.branch_name) brs.add(t.branch_name);
    });
    
    setSelectedCompanies(Array.from(comps));
    const finalBranches = Array.from(brs);

    setFormData({
      ...type,
      branch_names: finalBranches
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  
  // Dynamic form branches based on selected companies
  const [formBranches, setFormBranches] = useState([]);
  useEffect(() => {
    const fetchFormBranches = async () => {
      try {
        const url = baseUrl || "";
        const compsToFetch = selectedCompanies.length > 0 ? selectedCompanies : companyOptions;
        if (!compsToFetch || compsToFetch.length === 0) {
          setFormBranches(availableBranches);
          return;
        }
        
        const localGetHeaders = () => {
          const token = localStorage.getItem('token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        };
        const headersFunc = typeof getHeaders === 'function' ? getHeaders : localGetHeaders;

        const branchPromises = compsToFetch.map(comp => 
          axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, {
            headers: { ...headersFunc(), "X-Company-Name": comp }
          }).then(res => res.data)
        );
        
        const results = await Promise.all(branchPromises);
        const allBranches = [];
        results.forEach(data => {
          const branches = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)).filter(Boolean);
          allBranches.push(...branches);
        });
        
        setFormBranches([...new Set(allBranches)]);
      } catch (err) {
        console.error("Error fetching form branches:", err);
      }
    };
    fetchFormBranches();
  }, [selectedCompanies, companyOptions, baseUrl, availableBranches]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this type?")) return;
    try {
      const itemToDel = types.find(t => (t._id || t.id) === id);
      const url = baseUrl || "";
      const endpoint = itemToDel?.global_ref_id 
        ? `${url}/api/employee-types/bulk/${itemToDel.global_ref_id}`
        : `${url}/api/employee-types/${id}`;
      await axios.delete(endpoint, { headers: getHeaders() });
      setSuccessMessage("Type deleted.");
      fetchTypesData(baseUrl || "");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete type.");
    }
  };

  const filteredTypes = types.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (t.name || '').toLowerCase().includes(query) || 
      (t.description || '').toLowerCase().includes(query);
    
    let matchesCompany = true;
    if (selectedViewCompany) {
      const tComps = t.company_names || (t.company_name ? [t.company_name] : []);
      matchesCompany = tComps.includes(selectedViewCompany);
    }
    
    let matchesBranch = true;
    if (selectedBranchFilter) {
      const tBranches = t.branch_names || (t.branch_name ? [t.branch_name] : []);
      matchesBranch = tBranches.includes(selectedBranchFilter);
    }
    
    return matchesSearch && matchesCompany && matchesBranch;
  });

  if (loading && types.length === 0) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '30px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={handleBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }}>
              <FaArrowLeft />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}><FaUsersCog /> Employee Types</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {(isGroupAdmin || isCompanyAdmin) && (
              <button onClick={() => setShowCustomizeModal(true)} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCog /> Customize
              </button>
            )}
            {!showForm && permissions.canWrite && (
              <button onClick={() => setShowForm(true)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
                <FaPlus /> Add New
              </button>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        <div style={{ padding: '0 30px' }}>
          {error && <div style={{ marginTop: '20px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}><FaExclamationCircle /> {error}</div>}
          {successMessage && <div style={{ marginTop: '20px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}><FaCheckCircle /> {successMessage}</div>}
        </div>

        <div style={{ padding: '30px' }}>
          {showForm ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }}>
                {doctypeFields.filter(f => !f.hidden).map(field => {
                  const type = (field.type || '').toLowerCase();
                  const isDisabled = field.disabled || field.read_only;

                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      {type === 'check' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: isDisabled ? 'not-allowed' : 'pointer', marginTop: '32px', background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <input type="checkbox" name={field.id} checked={!!formData[field.id]} onChange={handleInputChange} disabled={isDisabled} />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{field.label}</span>
                        </label>
                      ) : (
                        <>
                          <label style={{ marginBottom: '10px', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>
                            {field.label} {field.mandatory && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {type === 'text' ? (
                            <textarea name={field.id} value={formData[field.id] || ''} onChange={handleInputChange} disabled={isDisabled} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', outline: 'none' }} />
                          ) : (
                            <input type={type === 'number' ? 'number' : 'text'} name={field.id} value={formData[field.id] || ''} onChange={handleInputChange} disabled={isDisabled} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} placeholder={`Enter ${field.label}`} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Multi-Tenancy UI */}
              <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                {companyOptions.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: '700', color: '#1e293b' }}>Assign to Companies *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      {companyOptions.map((comp, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', margin: 0, padding: '8px 16px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(comp)}
                            onChange={() => {
                              setSelectedCompanies(prev => 
                                prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
                              );
                            }}
                          />
                          {comp}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(isGroupAdmin || (isCompanyAdmin && !localStorage.getItem('branch_name'))) && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: '700', color: '#1e293b' }}>Assign to Branches</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(formBranches && formBranches.length > 0 ? formBranches : availableBranches).map(br => (
                        <button key={br} type="button" onClick={() => toggleBranchSelection(br)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid', background: formData.branch_names?.includes(br) ? '#3b82f6' : 'white', color: formData.branch_names?.includes(br) ? 'white' : '#64748b', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                          {br}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleBack} style={{ padding: '12px 30px', borderRadius: '30px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '12px 40px', borderRadius: '30px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Processing...' : (editingId ? 'Update Type' : 'Save Type')}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Filter Bar */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" placeholder="Search by name or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>
                
                {companyOptions.length > 1 && (
                  <div style={{ width: '200px' }}>
                    <select
                      value={selectedViewCompany}
                      onChange={(e) => setSelectedViewCompany(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontWeight: '500' }}
                    >
                      <option value="">All Companies</option>
                      {companyOptions.map(comp => <option key={comp} value={comp}>{comp}</option>)}
                    </select>
                  </div>
                )}
                
                {(!localStorage.getItem('active_branch') || localStorage.getItem('active_branch') === 'All' || localStorage.getItem('active_branch') === 'All Branches') && (
                  <div style={{ width: '200px' }}>
                    <select
                      value={selectedBranchFilter}
                      onChange={(e) => setSelectedBranchFilter(e.target.value)}
                      style={{ padding: '12px 20px', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontWeight: '600' }}
                    >
                      <option value="">All Branches</option>
                      {(filterBranches.length > 0 ? filterBranches : availableBranches).map(br => <option key={br} value={br}>{br}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      {doctypeFields.filter(f => !f.hidden).slice(0, 4).map(f => (
                        <th key={f.id} style={{ padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>{f.label}</th>
                      ))}
                      <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Companies</th>
                      <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Branches</th>
                      <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTypes.map(t => (
                      <tr key={t._id || t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {doctypeFields.filter(f => !f.hidden).slice(0, 4).map(f => (
                          <td key={f.id} style={{ padding: '15px', color: f.id === 'name' ? '#1e293b' : '#64748b', fontWeight: f.id === 'name' ? '600' : 'normal' }}>
                            {t[f.id] || '-'}
                          </td>
                        ))}
                        <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                          {(t.company_names || (t.company_name ? [t.company_name] : [])).join(', ') || '-'}
                        </td>
                        <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                          {(t.branch_names || (t.branch_name ? [t.branch_name] : [])).join(', ') || '-'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right' }}>
                          <button onClick={() => initiateEdit(t)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '5px', fontSize: '1.1rem' }}><FaEdit /></button>
                          <button onClick={() => handleDelete(t._id || t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px', fontSize: '1.1rem', marginLeft: '10px' }}><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => fetchMetadata(baseUrl || "")}
        targetDocType="Employee Type"
      />
    </div>
  );
};

export default EmployeeType;
