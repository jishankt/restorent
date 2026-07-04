import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaSearch,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaCog,
  FaMapMarkerAlt,
  FaCodeBranch
} from 'react-icons/fa';
import CustomerCustomizationModal from "./CustomerCustomizationModal";

/**
 * EmployeeDepartment — SaaS Production Version
 *
 * DB schema per record:
 *   Company-level: { _id, tenant_id, company_id, company_name, department_name }
 *   Branch-level:  { _id, tenant_id, company_id, company_name, branch_id, branch_name, department_name }
 *
 * The frontend groups multiple DB rows with the same department_name into one UI row.
 */
const EmployeeDepartment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [branchesMap, setBranchesMap] = useState({});     // { "CompanyName": ["Branch1", "Branch2"] }
  const [availableBranches, setAvailableBranches] = useState([]);

  // ─── Auth / Permissions ───────────────────────────────────────────────────────
  const [permissions, setPermissions] = useState({ canWrite: false, canDelete: false });
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  // ─── UI ───────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ─── Form ─────────────────────────────────────────────────────────────────────
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [formData, setFormData] = useState({ department_name: '', is_active: true, description: '' });
  const [editingId, setEditingId] = useState(null);

  // Multi-tenant selection in form
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);   // branch names chosen in form
  const [formBranches, setFormBranches] = useState([]);            // branches available for selected companies

  // ─── Filters (list view) ──────────────────────────────────────────────────────
  const [selectedViewCompany, setSelectedViewCompany] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');

  // ─── Navigation origin ────────────────────────────────────────────────────────
  const [fromDesignation, setFromDesignation] = useState(location.state?.fromDesignation || false);
  const [fromAddEmployee, setFromAddEmployee] = useState(location.state?.fromAddEmployee || false);

  // ─────────────────────────────────────────────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (configLoading) return;
    const url = baseUrl || '';
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchPermissions(url),
          fetchDepartments(url),
          fetchMetadata(url),
          fetchAllBranches(url),
        ]);
      } catch (err) {
        setError('Failed to load department data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [baseUrl, configLoading]);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.fromDesignation) setFromDesignation(true);
    if (location.state?.fromAddEmployee) setFromAddEmployee(true);
    if (location.state?.fromDesignation || location.state?.fromAddEmployee) {
      setShowForm(true);
    }
  }, [location.state]);

  // When selected companies change → refresh form branches
  useEffect(() => {
    const branches = [];
    selectedCompanies.forEach(comp => {
      const b = branchesMap[comp] || [];
      b.forEach(br => { if (!branches.includes(br)) branches.push(br); });
    });
    setFormBranches(branches);
    // Remove any selected branches that no longer belong to chosen companies
    setSelectedBranches(prev => prev.filter(b => branches.includes(b)));
  }, [selectedCompanies, branchesMap]);



  // ─────────────────────────────────────────────────────────────────────────────
  //  DATA FETCHERS
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchDepartments = async (url) => {
    try {
      const res = await axios.get(`${url}/api/departments`, { headers: getHeaders() });
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Fetch Departments Error:', err);
    }
  };

  const fetchMetadata = async (url) => {
    try {
      const res = await axios.get(`${url}/api/doctypes/${encodeURIComponent('Employee Department')}`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setDoctypeFields(fields);
    } catch {
      setDoctypeFields([
        { id: 'department_name', label: 'Department Name', type: 'Data', mandatory: true },
        { id: 'is_active', label: 'Active', type: 'Check' },
        { id: 'description', label: 'Description', type: 'Text' }
      ]);
    }
  };

  const fetchPermissions = async (url) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const roleRaw = (user.role || user.UserType || '').toLowerCase().replace(' ', '_');
      const branch = user.branch_name || user.branch || '';

      const isGroup = ['group_admin', 'groupadmin', 'tenant_admin', 'super_admin'].includes(roleRaw);
      const isAdmin = ['company_admin', 'admin', 'group_admin', 'groupadmin', 'tenant_admin', 'super_admin'].includes(roleRaw) &&
        (!branch || branch === 'All Branches' || branch === '');

      setIsGroupAdmin(isGroup);
      setIsCompanyAdmin(isAdmin);

      // Build companyOptions
      let comps = [];
      if (user.companies && user.companies.length > 0) {
        comps = user.companies.map(c =>
          typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c
        ).filter(Boolean);
      } else if (user.company_name || user.company) {
        comps = [user.company_name || user.company];
      } else {
        try {
          const res = await axios.get(`${url}/api/company-details`, { headers: getHeaders() });
          comps = (res.data.companyDetails || []).map(d => d.restaurantName || d.company_name).filter(Boolean);
        } catch { /* ignore */ }
      }
      const uniqueComps = [...new Set(comps)];
      setCompanyOptions(uniqueComps);

      // Pre-select company
      const activeCtx = localStorage.getItem('active_company');
      if (activeCtx && activeCtx !== 'All') {
        setSelectedCompanies([activeCtx]);
      } else {
        setSelectedCompanies(uniqueComps.length === 1 ? [uniqueComps[0]] : []);
      }

      // Permissions
      if (['company_admin', 'admin', 'branch_admin', 'group_admin', 'tenant_admin', 'master_admin', 'owner'].includes(roleRaw)) {
        setPermissions({ canWrite: true, canDelete: true });
      } else {
        try {
          const res = await axios.get(`${url}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`, { headers: getHeaders() });
          const pagePerm = (res.data.permissions || []).find(p => p.pageId === 'employee_departments');
          if (pagePerm) setPermissions({ canWrite: !!pagePerm.canWrite, canDelete: !!pagePerm.canDelete });
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn('Permissions error:', err);
    }
  };

  const fetchAllBranches = async (url) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const activeCtx = localStorage.getItem('active_company');

      // Build a comma-separated list of companies to fetch branches for
      let compsToFetch = [];
      if (activeCtx && activeCtx !== 'All') {
        compsToFetch = [activeCtx];
      } else if (userObj.companies && userObj.companies.length > 0) {
        compsToFetch = userObj.companies.map(c =>
          typeof c === 'object' ? (c.company_name || c.company || '') : c
        ).filter(Boolean);
      } else if (userObj.company_name || userObj.company) {
        compsToFetch = [userObj.company_name || userObj.company];
      }

      if (!compsToFetch.length) return;

      const map = {};
      const allNames = [];

      await Promise.all(compsToFetch.map(async comp => {
        try {
          const res = await axios.get(
            `${url}/api/branches?company_name=${encodeURIComponent(comp)}`,
            { headers: { ...getHeaders(), 'X-Company-Name': comp } }
          );
          const names = (res.data || []).map(b =>
            typeof b === 'string' ? b : (b.branch_name || b.name || '')
          ).filter(Boolean);
          map[comp] = names;
          names.forEach(n => { if (!allNames.includes(n)) allNames.push(n); });
        } catch (e) { console.warn('Branch fetch error for', comp, e); }
      }));

      setBranchesMap(map);
      setAvailableBranches(allNames);
    } catch (err) {
      console.error('Fetch branches error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  FORM HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleCompany = (comp) => {
    setSelectedCompanies(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  const toggleBranch = (brName) => {
    setSelectedBranches(prev =>
      prev.includes(brName) ? prev.filter(b => b !== brName) : [...prev, brName]
    );
  };

  const resetForm = () => {
    setFormData({ department_name: '', is_active: true, description: '' });
    setEditingId(null);
    setSelectedBranches([]);
    const activeCtx = localStorage.getItem('active_company');
    if (activeCtx && activeCtx !== 'All') {
      setSelectedCompanies([activeCtx]);
    } else {
      setSelectedCompanies(companyOptions.length === 1 ? [companyOptions[0]] : []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canWrite) {
      setError('Permission Denied: You cannot create or edit departments.');
      return;
    }
    if (!formData.department_name?.trim()) {
      setError('Department Name is required.');
      return;
    }

    // Determine companies to save
    const activeCtx = localStorage.getItem('active_company');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    const userComp = userData.company_name || userData.company || '';
    const companiesToProcess = activeCtx === 'All'
      ? selectedCompanies
      : [activeCtx || userComp || ''].filter(Boolean);

    if (!companiesToProcess.length) {
      setError('Please select at least one company.');
      return;
    }

    // Determine branches
    const activeBranchLocal = localStorage.getItem('active_branch');
    const isSpecificBranch = activeBranchLocal &&
      activeBranchLocal !== 'All Branches' &&
      activeBranchLocal !== 'All' &&
      activeBranchLocal !== '';
    const branchesToProcess = isSpecificBranch ? [activeBranchLocal] : selectedBranches;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const url = baseUrl || '';
      const headers = getHeaders();
      if (companiesToProcess[0]) headers['X-Company-Name'] = companiesToProcess[0];
      if (branchesToProcess[0]) headers['X-Branch-Name'] = branchesToProcess[0];

      const payload = {
        name: formData.department_name.trim(),
        department_name: formData.department_name.trim(),
        is_active: formData.is_active !== false,
        description: formData.description || '',
        company_names: companiesToProcess,
        company_name: companiesToProcess[0] || '',
        branch_names: branchesToProcess,
        branch_name: branchesToProcess[0] || ''
      };

      if (editingId) {
        const itemToEdit = departments.find(d => (d._id || d.id) === editingId);
        if (itemToEdit?.global_ref_id) {
          await axios.put(`${url}/api/departments/bulk/${itemToEdit.global_ref_id}`, payload, { headers });
        } else {
          await axios.put(`${url}/api/departments/${editingId}`, payload, { headers });
        }
        setSuccessMessage('Department updated successfully!');
      } else {
        await axios.post(`${url}/api/departments`, payload, { headers });
        setSuccessMessage('Department created successfully!');
      }

      await fetchDepartments(url);
      const savedName = formData.department_name.trim();

      if (fromDesignation) {
        navigate('/employee-designations', { state: { ...location.state, departmentCreated: true, newDepartmentName: savedName } });
        return;
      }
      if (fromAddEmployee) {
        navigate('/add-employee', { state: { ...location.state, formData: { ...location.state?.formData, department: savedName } } });
        return;
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save department.');
    } finally {
      setLoading(false);
    }
  };

  const initiateEdit = (dept) => {
    let relatedDepts = [dept];
    if (dept.global_ref_id) {
      relatedDepts = departments.filter(d => d.global_ref_id === dept.global_ref_id);
    }
    
    setEditingId(dept._id || dept.id);
    setFormData({
      department_name: dept.department_name || dept.name || '',
      is_active: dept.is_active !== false,
      description: dept.description || ''
    });
    
    const comps = new Set();
    const brs = new Set();
    
    relatedDepts.forEach(t => {
      if (t.company_names && Array.isArray(t.company_names)) t.company_names.forEach(c => comps.add(c));
      else if (t.company_name) comps.add(t.company_name);
      
      if (t.branch_names && Array.isArray(t.branch_names)) t.branch_names.forEach(b => brs.add(b));
      else if (t.branch_names && typeof t.branch_names === 'string') t.branch_names.split(',').forEach(b => brs.add(b.trim()));
      else if (t.branch_name) brs.add(t.branch_name);
      else if (t.branch) brs.add(t.branch);
    });
    
    setSelectedCompanies(Array.from(comps));
    setSelectedBranches(Array.from(brs));
    setShowForm(true);
  };

  const executeDelete = async () => {
    if (!permissions.canDelete) {
      setError('Permission Denied: You cannot delete.');
      setShowDeleteConfirm(false);
      return;
    }
    try {
      const url = baseUrl || '';
      const endpoint = `${url}/api/departments/${deleteId}`;
      await axios.delete(endpoint, { headers: getHeaders() });
      setSuccessMessage('Department deleted successfully.');
      setDepartments(prev => prev.filter(d => d._id !== deleteId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleBack = () => {
    if (fromDesignation) {
      navigate('/employee-designations', { state: location.state?.originalAddEmployeeState || location.state });
    } else if (fromAddEmployee) {
      navigate('/add-employee', { state: location.state?.originalAddEmployeeState || location.state });
    } else if (showForm) {
      setShowForm(false);
      resetForm();
    } else {
      navigate('/admin');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  FILTERED LIST
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredDepts = departments.filter(d => {
    const matchSearch = (d.department_name || d.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchComp = !selectedViewCompany || (d.company_name || d.company) === selectedViewCompany;
    const matchBranch = !selectedBranchFilter || (d.branch_name || d.branch) === selectedBranchFilter;
    return matchSearch && matchComp && matchBranch;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading && !departments.length && !showForm) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#555', fontFamily: 'sans-serif' }}>Loading Departments...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '30px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ backgroundColor: '#2c3e50', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={handleBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }}>
              <FaArrowLeft />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}><FaBuilding /> Departments</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {(isGroupAdmin || isCompanyAdmin) && (
              <button onClick={() => setShowCustomizeModal(true)}
                style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCog /> Customize
              </button>
            )}
            {!showForm && permissions.canWrite && (
              <button onClick={() => { resetForm(); setShowForm(true); }}
                style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPlus /> Add New
              </button>
            )}
          </div>
        </div>

        {/* ── Alerts ── */}
        <div style={{ padding: '0 30px' }}>
          {error && (
            <div style={{ marginTop: '20px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaExclamationCircle /> {error}
            </div>
          )}
          {successMessage && (
            <div style={{ marginTop: '20px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCheckCircle /> {successMessage}
            </div>
          )}
        </div>

        <div style={{ padding: '30px' }}>
          {showForm ? (
            /* ══════════════ FORM ══════════════ */
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' }}>
                {doctypeFields.filter(f => !f.hidden).map(field => {
                  const type = (field.type || '').toLowerCase();
                  const isDisabled = field.disabled || field.read_only;
                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      {type === 'check' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '32px', background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <input
                            type="checkbox"
                            name={field.id}
                            checked={!!formData[field.id]}
                            onChange={handleInputChange}
                            disabled={isDisabled}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{field.label}</span>
                        </label>
                      ) : (
                        <>
                          <label style={{ marginBottom: '8px', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>
                            {field.label} {field.mandatory && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {type === 'text' ? (
                            <textarea
                              name={field.id}
                              value={formData[field.id] || ''}
                              onChange={handleInputChange}
                              disabled={isDisabled}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '90px', fontSize: '15px', resize: 'vertical', backgroundColor: isDisabled ? '#f1f5f9' : '#fff' }}
                            />
                          ) : (
                            <input
                              type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
                              name={field.id}
                              value={formData[field.id] || ''}
                              onChange={handleInputChange}
                              disabled={isDisabled}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', backgroundColor: isDisabled ? '#f1f5f9' : '#fff' }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Company Assignment ── */}
              {companyOptions.length > 0 && (
                <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 18px 0', color: '#1e293b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaBuilding style={{ color: '#3b82f6' }} /> Company Assignment *
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {companyOptions.map((comp, idx) => {
                      const isSel = selectedCompanies.includes(comp);
                      return (
                        <div key={idx}
                          onClick={() => toggleCompany(comp)}
                          style={{
                            border: `1.5px solid ${isSel ? '#3b82f6' : '#e2e8f0'}`,
                            padding: '14px 18px',
                            borderRadius: '12px',
                            backgroundColor: isSel ? '#eff6ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '12px'
                          }}>
                          <input type="checkbox" checked={isSel} readOnly
                            style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{comp}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Company level</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Branch Assignment ── */}
              {(isGroupAdmin || isCompanyAdmin) && formBranches.length > 0 && (
                <div style={{ marginBottom: '28px', background: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaMapMarkerAlt style={{ color: '#22c55e' }} /> Branch Assignment
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#4ade80' }}>
                    Select branches to create branch-level department records with tenant_id, company_id &amp; branch_id
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {formBranches.map((br, idx) => {
                      const isSel = selectedBranches.includes(br);
                      return (
                        <div key={idx}
                          onClick={() => toggleBranch(br)}
                          style={{
                            border: `1.5px solid ${isSel ? '#22c55e' : '#d1fae5'}`,
                            padding: '14px 18px',
                            borderRadius: '12px',
                            backgroundColor: isSel ? '#dcfce7' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '12px'
                          }}>
                          <input type="checkbox" checked={isSel} readOnly
                            style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontWeight: '700', color: '#15803d', fontSize: '0.95rem' }}>{br}</div>
                            <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '2px' }}>Branch level</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Submit Buttons ── */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit"
                  style={{ padding: '12px 28px', backgroundColor: loading ? '#93c5fd' : '#3498db', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                  disabled={loading}>
                  <FaSave /> {loading ? 'Saving...' : editingId ? 'Update Department' : 'Save Department'}
                </button>
                <button type="button" onClick={handleBack}
                  style={{ padding: '12px 28px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ══════════════ LIST ══════════════ */
            <>
              {/* Filter bar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" placeholder="Search departments..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem' }} />
                </div>

                {companyOptions.length > 1 && (
                  <select value={selectedViewCompany} onChange={e => setSelectedViewCompany(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #3b82f6', outline: 'none', fontWeight: '600', cursor: 'pointer' }}>
                    <option value="">All Companies</option>
                    {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}

                {availableBranches.length > 0 && (!localStorage.getItem('active_branch') || localStorage.getItem('active_branch') === 'All Branches') && (
                  <select value={selectedBranchFilter} onChange={e => setSelectedBranchFilter(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #22c55e', outline: 'none', fontWeight: '600', cursor: 'pointer' }}>
                    <option value="">All Branches</option>
                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>Department Name</th>
                      <th style={{ padding: '15px 20px', textAlign: 'center', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>Status</th>
                      <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>Company</th>
                      <th style={{ padding: '15px 20px', textAlign: 'left', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>Branch</th>
                      <th style={{ padding: '15px 20px', textAlign: 'right', color: '#475569', fontWeight: '700', fontSize: '0.9rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.length > 0 ? filteredDepts.map((dept, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>{dept.department_name || dept.name}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                            backgroundColor: dept.is_active ? '#dcfce7' : '#fee2e2',
                            color: dept.is_active ? '#16a34a' : '#dc2626'
                          }}>
                            {dept.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.9rem' }}>
                          <span style={{ display: 'inline-block', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: '600', marginRight: '5px', marginBottom: '3px' }}>
                            {dept.company_name || dept.company || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.9rem' }}>
                          {dept.branch_name && dept.branch_name !== 'All Branches'
                            ? <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#22c55e', borderRadius: '20px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: '600', marginRight: '5px', marginBottom: '3px' }}>{dept.branch_name}</span>
                            : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>All Branches</span>}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button onClick={() => initiateEdit(dept)}
                            style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', fontSize: '1rem' }}>
                            <FaEdit />
                          </button>
                          <button onClick={() => { setDeleteId(dept._id); setShowDeleteConfirm(true); }}
                            style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>
                          No departments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Confirm Deletion</h3>
            <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>Are you sure you want to delete this department? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#fff', fontWeight: '600' }}>
                Cancel
              </button>
              <button onClick={executeDelete}
                style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => fetchMetadata(baseUrl || '')}
        targetDocType="Employee Department"
      />
    </div>
  );
};

export default EmployeeDepartment;
