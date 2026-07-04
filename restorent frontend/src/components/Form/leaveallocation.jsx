// src/components/Form/LeaveAllocation.jsx
// Full and Complete Functional Component for Leave Allocation
// Includes fetch, create, update, delete with validation and proper UI feedback.

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaClipboardList, FaCheckCircle, FaExclamationTriangle, FaCog , FaBuilding, FaMapMarkerAlt} from 'react-icons/fa';
import CustomerCustomizationModal from "./CustomerCustomizationModal";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import useCustomization from '../../hooks/useCustomization';
import { UserContext } from '../../Context/UserContext';

const LeaveAllocation = () => {
  const navigate = useNavigate();
  const { user, getHeaders } = useContext(UserContext);
  const { visibleFields, isFieldVisible, handleCustomizationRefresh } = useCustomization('Leave Allocation');
  const containerRef = useRef(null); // Ref for scrolling
  const [allocations, setAllocations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({
    leave_type_id: '',
    monthly_credit: 0,
    yearly_credit: 0,
    credit_unit: 'DAYS',
    is_active: true
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const activeBranchLocalUI = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActiveUI = activeBranchLocalUI.toLowerCase() !== 'all branches' && activeBranchLocalUI.toLowerCase() !== 'all' && activeBranchLocalUI !== '';
  const showCompanyAssign = !isSpecificBranchActiveUI && (isGroupAdmin || isCompanyAdmin);
  const showBranchAssign = !isSpecificBranchActiveUI && (isGroupAdmin || isCompanyAdmin);

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Fetch Permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const role = userObj.role || userObj.UserType || "";
          const roleNorm = role.toLowerCase().replace(/[\s_]/g, '');
          const isGA = checkIsGlobalAdmin(userObj);
          const isCA = roleNorm === 'companyadmin' || roleNorm === 'admin' || roleNorm === 'manager';
          
          const isAdmin = isGA || isCA;
          setIsCompanyAdmin(isAdmin);
          setIsGroupAdmin(isGA);
          const user = userObj;

          const activeContext = localStorage.getItem('active_company');
          let comps = [];
          if (user.companies && user.companies.length > 0) {
            comps = user.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
          } else if (user.company_name || user.company) {
            comps = [user.company_name || user.company];
          } else {
            const currentBaseUrl = baseUrl || '';
            const res = await axios.get(`${currentBaseUrl}/api/company-details`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            const details = res.data.companyDetails || [];
            comps = details.map(d => d.restaurantName || d.company_name).filter(n => n);
          }
          const finalComps = comps.length > 0 ? [...new Set(comps)] : [];
          setAllCompanies(finalComps);

          if (activeContext && activeContext !== 'All') {
            setSelectedCompanies([activeContext || user.company_name || ""]);
          } else if (activeContext === 'All' || !activeContext) {
            setSelectedCompanies([]); // Let user select in the modal
          }

          if (role) {
            const headers = {};
            if (user.company_name) headers['X-Company-Name'] = user.company_name;
            if (user.branch_name) headers['X-Branch-Name'] = user.branch_name;

            const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${role}` : `/api/role-permissions?role=${role}`;
            const response = await axios.get(url, { headers });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'leave_allocation');
            if (pagePerm) {
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    const fetchBranches = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const headers = {};
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        }
        const currentBaseUrl = baseUrl || '';
        const response = await axios.get(`${currentBaseUrl}/api/branches`, { headers });
        const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchPermissions();
    fetchBranches();
  }, [baseUrl, selectedBranchFilter]);

  // Fetch baseUrl on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:6034`);
        } else {
          setBaseUrl('');
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl(window.location.origin || '');
      }
    };
    fetchConfig();
  }, []);

  const baseUrlResolved = baseUrl || '';

  useEffect(() => {
    if (baseUrlResolved !== undefined) {
      fetchInitialData();
    }
  }, [baseUrlResolved]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchLeaveTypes(), fetchAllocations()]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get(`${baseUrlResolved}/api/leave-types`, { headers: getHeaders() });
      const activeTypes = (res.data || []).filter(type => type.is_active);
      setLeaveTypes(activeTypes);
    } catch (err) {
      console.error('Error fetching leave types:', err);
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await axios.get(`${baseUrlResolved}/api/leave-allocations`, { headers: getHeaders() });
      setAllocations(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching allocations:', err);
      if (err.response && err.response.status !== 404) {
        setError('Failed to load leave allocations.');
      }
    }
  };

  // Helper handlers for input UX
  const handleFocus = (field) => {
    if (form[field] === 0 || form[field] === '0') {
      setForm(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field) => {
    if (form[field] === '' || form[field] === null || form[field] === undefined) {
      setForm(prev => ({ ...prev, [field]: 0 }));
    }
  };

  const handleChange = (field, value) => {
    // Allow empty string, decimals, etc.
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to manage leave allocations.");
      setTimeout(() => setError(''), 3000);
      return;
    }
    setLoading(true);
    setError('');

    // Convert inputs to numbers safely
    const activeContext = localStorage.getItem('active_company');
    const userStrLocal = localStorage.getItem('user');
    const userDataLocal = userStrLocal ? JSON.parse(userStrLocal) : null;
    const userCompLocal = userDataLocal ? (userDataLocal.company_name || userDataLocal.company) : "";
    const companiesToProcess = activeContext === 'All' ? selectedCompanies : [activeContext || userCompLocal || ""];

    const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
    const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
    const branchesToProcess = isSpecificBranchActive ? [activeBranchLocal] : selectedAddBranches;

    if (companiesToProcess.length === 0 && showCompanyAssign) {
      setError("Company selection is required");
      setTimeout(() => setError(''), 3000);
      return;
    }

    const payload = {
      ...form,
      monthly_credit: Number(form.monthly_credit) || 0,
      yearly_credit: Number(form.yearly_credit) || 0,
      company_names: companiesToProcess,
      company_name: companiesToProcess[0] || "",
      branch_names: branchesToProcess,
      branch_name: branchesToProcess[0] || ""
    };

    console.log("Submitting payload:", payload);

    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const headers = {};
      if (userData) {
        if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        const branchToUse = selectedBranchFilter || userData.branch_name;
        if (branchToUse) headers['X-Branch-Name'] = branchToUse;
      }

      if (editingId) {
        await axios.put(`${baseUrlResolved}/api/leave-allocations/${editingId}`, payload, { headers });
        setMessage('Allocation updated successfully!');
      } else {
        await axios.post(`${baseUrlResolved}/api/leave-allocations`, payload, { headers });
        setMessage('Allocation created successfully!');
      }
      setForm({
        leave_type_id: '',
        monthly_credit: 0,
        yearly_credit: 0,
        credit_unit: 'DAYS',
        is_active: true
      });
      setEditingId(null);
      fetchAllocations();
    } catch (err) {
      console.error("API Error details:", err.response);
      const errorMessage = err.response?.data?.error || 'Operation failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (alloc) => {
    setForm({
      leave_type_id: alloc.leave_type_id,
      monthly_credit: alloc.monthly_credit,
      yearly_credit: alloc.yearly_credit,
      credit_unit: alloc.credit_unit,
      is_active: alloc.is_active
    });
    setEditingId(alloc.allocation_id || alloc._id);
    // Scroll to top
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete leave allocations.");
      setTimeout(() => setError(''), 3000);
      setShowDeleteConfirm(false);
      return;
    }
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const headers = {};
      if (userData) {
        if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        const branchToUse = selectedBranchFilter || userData.branch_name;
        if (branchToUse) headers['X-Branch-Name'] = branchToUse;
      }
      await axios.delete(`${baseUrlResolved}/api/leave-allocations/${deletingId}`, { headers });
      setMessage('Allocation deleted successfully!');
      fetchAllocations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete allocation.');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setLoading(false);
    }
  };

  const closeDeleteConfirm = (e) => {
    if (e.target === e.currentTarget) {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const clearForm = () => {
    setForm({
      leave_type_id: '',
      monthly_credit: 0,
      yearly_credit: 0,
      credit_unit: 'DAYS',
      is_active: true
    });
    setEditingId(null);
    setMessage('');
    setError('');
  };

  useEffect(() => {
    const fetchDynamicBranches = async () => {
      try {
        const url = baseUrl || "";
        const compsToFetch = selectedCompanies.length > 0 ? selectedCompanies : allCompanies;
        if (!compsToFetch || compsToFetch.length === 0) {
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
        
        setAvailableBranches([...new Set(allBranches)]);
      } catch (err) {
        console.error("Error fetching dynamic branches:", err);
      }
    };
    fetchDynamicBranches();
  }, [selectedCompanies, allCompanies, baseUrl]);
  if (loading && allocations.length === 0 && leaveTypes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#3498db',
          fontSize: '18px'
        }}>
          <FaClipboardList style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button */}
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      {/* Main Container */}
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
            <FaClipboardList style={{ color: '#3498db', fontSize: '2rem' }} />
            Leave Type Allocation ({allocations.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(isGroupAdmin || isCompanyAdmin) && (
              <button
                type="button"
                onClick={() => setShowCustomizeModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                  boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                disabled={loading}
              >
                <FaCog /> Customize
              </button>
            )}
            <button
              onClick={() => navigate('/leave-type')}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', // Different color to distinguish
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
                boxShadow: '0 4px 8px rgba(46, 204, 113, 0.3)',
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            >
              <FaClipboardList /> Go to Leave Type
            </button>
            <button
              onClick={clearForm}
              style={{
                background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
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
                boxShadow: '0 4px 8px rgba(149, 165, 166, 0.3)',
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            color: '#c0392b',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #e74c3c',
            boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaExclamationTriangle style={{ fontSize: '1.2rem' }} />
            {error}
          </div>
        )}
        {message && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)',
            color: '#155724',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #28a745',
            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaCheckCircle style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: 0, color: '#2c3e50', fontWeight: '600', marginBottom: '20px' }}>
            <FaPlus style={{ color: '#3498db', marginRight: '8px' }} /> {editingId ? 'Edit Allocation' : 'Create New Allocation'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {isFieldVisible('leave_type_id') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Select Leave Type</label>
                <select
                  value={form.leave_type_id}
                  onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map(type => (
                    <option key={type.leave_type_id || type._id} value={type.leave_type_id || type._id}>
                      {type.leave_code} - {type.leave_name}
                    </option>
                  ))}
                </select>
              </div>
              )}
              {isFieldVisible('credit_unit') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Unit</label>
                <select
                  value={form.credit_unit}
                  onChange={(e) => setForm({ ...form, credit_unit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                >
                  <option value="DAYS">Days</option>
                  <option value="MINUTES">Minutes</option>
                </select>
              </div>
              )}
              {isFieldVisible('monthly_credit') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Monthly Credit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthly_credit}
                  onChange={(e) => handleChange('monthly_credit', e.target.value)}
                  onFocus={() => handleFocus('monthly_credit')}
                  onBlur={() => handleBlur('monthly_credit')}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                />
              </div>
              )}
              {isFieldVisible('yearly_credit') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Yearly Credit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.yearly_credit}
                  onChange={(e) => handleChange('yearly_credit', e.target.value)}
                  onFocus={() => handleFocus('yearly_credit')}
                  onBlur={() => handleBlur('yearly_credit')}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                />
              </div>
              )}
              {isFieldVisible('is_active') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                  <input
                    type="checkbox"
                    id="is_active_alloc"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active_alloc" style={{ fontWeight: '500', color: '#2c3e50' }}>Active</label>
                </div>
              </div>
              )}
            </div>
            
            {/* --- Company and Branch Assignment Section --- */}
            {showCompanyAssign && (
              <div style={{ marginTop: '30px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaBuilding style={{ color: '#3b82f6' }} /> Assign to Companies *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {(allCompanies.length > 0 ? allCompanies : selectedCompanies).map((comp, idx) => {
                    const isSelected = selectedCompanies.includes(comp);
                    return (
                      <div key={idx} style={{ border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', padding: '15px', borderRadius: '12px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                        if (isSelected) setSelectedCompanies(prev => prev.filter(c => c !== comp));
                        else setSelectedCompanies(prev => [...prev, comp]);
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSelected} readOnly style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{comp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showBranchAssign && selectedCompanies.length > 0 && availableBranches.length > 0 && (
              <div style={{ marginTop: '20px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaMapMarkerAlt style={{ color: '#f97316' }} /> Assign to Branches *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  {availableBranches.map((branch, idx) => {
                    const isSelected = selectedAddBranches.includes(branch);
                    return (
                      <div key={idx} style={{ border: isSelected ? '1.5px solid #f97316' : '1.5px solid #e2e8f0', padding: '15px', borderRadius: '12px', backgroundColor: isSelected ? '#fff7ed' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                        if (isSelected) setSelectedAddBranches(prev => prev.filter(b => b !== branch));
                        else setSelectedAddBranches(prev => [...prev, branch]);
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSelected} readOnly style={{ width: '18px', height: '18px', accentColor: '#f97316', cursor: 'pointer' }} />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{branch}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading || !form.leave_type_id}
                style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                }}
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'} Allocation
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={clearForm}
                  style={{
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        {/* Table */}
        {allocations.length > 0 ? (
          <div style={{
            overflowX: 'auto',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1000px'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff'
                }}>
                  {isFieldVisible('leave_type_id') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Leave Type</th>}
                  {isFieldVisible('leave_type_id') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Code</th>}
                  {isFieldVisible('company') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Companies</th>}
                  {isFieldVisible('branch') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Branches</th>}
                  {isFieldVisible('monthly_credit') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Monthly</th>}
                  {isFieldVisible('yearly_credit') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Yearly</th>}
                  {isFieldVisible('credit_unit') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Unit</th>}
                  {isFieldVisible('is_active') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Status</th>}
                  <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc, index) => (
                  <tr key={alloc.allocation_id || alloc._id} style={{
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'; }}
                  >
                    {isFieldVisible('leave_type_id') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{alloc.leave_name || 'N/A'}</td>}
                    {isFieldVisible('leave_type_id') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{alloc.leave_code || 'N/A'}</td>}
                    {isFieldVisible('company') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#3498db', fontWeight: '600' }}>{(alloc.company_names || (alloc.company_name ? [alloc.company_name] : [])).join(', ') || 'All'}</td>}
                    {isFieldVisible('branch') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#3498db', fontWeight: '600' }}>{(alloc.branch_names || (alloc.branch_name ? [alloc.branch_name] : [])).join(', ') || 'All Branches'}</td>}
                    {isFieldVisible('monthly_credit') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{alloc.monthly_credit}</td>}
                    {isFieldVisible('yearly_credit') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{alloc.yearly_credit}</td>}
                    {isFieldVisible('credit_unit') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{alloc.credit_unit}</td>}
                    {isFieldVisible('is_active') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        backgroundColor: alloc.is_active ? '#d4edda' : '#f8d7da',
                        color: alloc.is_active ? '#155724' : '#721c24'
                      }}>
                        {alloc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>}
                    <td style={{ padding: '15px 12px', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(alloc)}
                          style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)'
                          }}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(alloc.allocation_id || alloc._id)}
                          style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                          }}
                          title="Delete"
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: '1.2rem',
            marginTop: '50px',
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '10px',
            border: '2px dashed #bdc3c7'
          }}>
            <FaClipboardList style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
            No leave allocations found.
            <button
              onClick={clearForm}
              style={{
                color: '#3498db',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: '600',
                textDecoration: 'underline',
                marginLeft: '5px'
              }}
            >
              Allocate Rules
            </button>.
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
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
            zIndex: 1000
          }}
          onClick={closeDeleteConfirm}
        >
          <div style={{
            backgroundColor: '#ffffff',
            padding: '30px',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              color: '#e74c3c',
              marginBottom: '15px',
              fontSize: '1.5rem'
            }}>
              <FaTrash style={{ fontSize: '1.5rem', marginRight: '10px' }} />
              Confirm Delete
            </h3>
            <p style={{
              color: '#2c3e50',
              marginBottom: '25px',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>Are you sure you want to delete this allocation? This action cannot be undone.</p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(231, 76, 60, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.3)';
                }}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={closeDeleteConfirm}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={handleCustomizationRefresh}
        targetDocType="Leave Allocation"
      />
    </div>
  );
};

export default LeaveAllocation;
