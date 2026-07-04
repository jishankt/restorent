// src/components/Form/LeaveApply.jsx - Complete and Updated
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaCalendarAlt, FaUserTie, FaCheckCircle, FaExclamationTriangle, FaTimes, FaSearch, FaEdit, FaTrash, FaInfoCircle, FaCog, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import CustomerCustomizationModal from "./CustomerCustomizationModal";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import useCustomization from '../../hooks/useCustomization';
const LeaveApply = () => {
  const navigate = useNavigate();
  const { visibleFields, isFieldVisible, handleCustomizationRefresh } = useCustomization('Leave Apply');
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    leave_type_id: '',
    leave_mode: 'FULL_DAY',
    from_date: '',
    to_date: '',
    from_time: '',
    to_time: '',
    shift_id: '',
    schedule_id: '',
    total_units: 0,
    unit_type: 'DAYS',
    reason: '',
    status: 'PENDING',
    approved_by: '',
    approved_at: '',
    remarks: ''
  });
  const [applications, setApplications] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState([]); // State for summary
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [shift, setShift] = useState(null);

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [dataScope, setDataScope] = useState("All Data"); // NEW: Data scope for filtering
  const [statusPermissions, setStatusPermissions] = useState({ pending: false, approved: false, rejected: false });
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  const activeBranchLocalUI = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActiveUI = activeBranchLocalUI.toLowerCase() !== 'all branches' && activeBranchLocalUI.toLowerCase() !== 'all' && activeBranchLocalUI !== '';
  const showCompanyAssign = !isSpecificBranchActiveUI && (isGroupAdmin || isCompanyAdmin);
  const showBranchAssign = !isSpecificBranchActiveUI && (isGroupAdmin || isCompanyAdmin);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);

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
            const res = await axios.get(`${currentBaseUrl}/api/company-details`, { headers: getHeaders() });
            const details = res.data.companyDetails || [];
            comps = details.map(d => d.restaurantName || d.company_name).filter(n => n);
          }
          const finalComps = comps.length > 0 ? [...new Set(comps)] : [];
          setAllCompanies(finalComps);

          if (activeContext && activeContext !== 'All') {
            setSelectedCompanies([activeContext || user.company_name || ""]);
          } else if (activeContext === 'All' || !activeContext) {
            setSelectedCompanies([]);
          }

          if (role) {
            const userEmail = user.email || '';
            const url = `${baseUrl}/api/role-permissions?role=${role}&email=${userEmail}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'leave_apply');
            if (pagePerm) {
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
              const scope = pagePerm.dataAccess || pagePerm.dataScope || "All Data";
              setDataScope(scope);

              // Extract Status Permissions
              const sPerms = {
                pending: pagePerm.showPending !== false,
                approved: pagePerm.showApproved !== false,
                rejected: pagePerm.showRejected !== false
              };
              setStatusPermissions(sPerms);

              // Ensure form status is valid for this user
              setForm(prev => {
                if (prev.status === 'PENDING' && !sPerms.pending) {
                  if (sPerms.approved) return { ...prev, status: 'APPROVED' };
                  if (sPerms.rejected) return { ...prev, status: 'REJECTED' };
                }
                return prev;
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    const fetchBranches = async () => {
      try {
        const currentBaseUrl = baseUrl || '';
        const response = await axios.get(`${currentBaseUrl}/api/branches`, { headers: getHeaders() });
        const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    if (baseUrl !== undefined) {
      fetchPermissions();
      fetchBranches();
    }
  }, [baseUrl]);
  useEffect(() => {
    if (!configLoading && baseUrl !== undefined) {
      fetchData();
    }
  }, [configLoading, baseUrl, dataScope]);
  const fetchSummary = useCallback(async () => {
    if (!form.employee_id || configLoading) {
      setLeaveSummary([]);
      return;
    }
    try {
      const res = await axios.get(`${baseUrl}/api/leave-summary`, {
        params: { employee_id: form.employee_id },
        headers: getHeaders()
      });
      setLeaveSummary(res.data || []);
    } catch (err) {
      console.error('Error fetching leave summary:', err);
    }
  }, [form.employee_id, baseUrl, configLoading, getHeaders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);
  useEffect(() => {
    const fetchRoster = async () => {
      if (!form.employee_id || !form.from_date || configLoading) {
        setShift(null);
        setForm(prev => ({ ...prev, shift_id: '', schedule_id: '' }));
        if (form.leave_mode !== 'HOURLY') {
          setForm(prev => ({ ...prev, from_time: '', to_time: '' }));
        }
        return;
      }
      try {
        const res = await axios.get(`${baseUrl}/api/roster`, {
          params: { employee_id: form.employee_id, date: form.from_date },
          headers: getHeaders()
        });
        let shiftData = res.data;
        if (shiftData && shiftData.shift_id) {
          setShift(shiftData);
          setForm(prev => ({
            ...prev,
            shift_id: shiftData.shift_id,
            schedule_id: shiftData.schedule_id
          }));
          setError('');
        } else {
          setShift(null);
          setForm(prev => ({ ...prev, shift_id: '', schedule_id: '' }));
        }
      } catch (err) {
        console.error('Error fetching roster:', err);
        setShift(null);
      }
    };
    fetchRoster();
  }, [form.employee_id, form.from_date, baseUrl, configLoading, getHeaders]);
  // Auto-calculate logic
  useEffect(() => {
    calculateUnits();
  }, [form.from_date, form.to_date, form.leave_mode, form.from_time, form.to_time, shift]);
  const calculateUnits = () => {
    let units = 0;
    let type = 'DAYS';
    if (form.leave_mode === 'HOURLY') {
      type = 'MINUTES';
      if (form.from_time && form.to_time) {
        const [h1, m1] = form.from_time.split(':').map(Number);
        const [h2, m2] = form.to_time.split(':').map(Number);
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        units = diff > 0 ? diff : 0;
      }
    } else if (form.leave_mode === 'HALF_DAY') {
      type = 'DAYS';
      units = 0.5; // Always 0.5 days
    } else { // FULL_DAY
      type = 'DAYS';
      if (form.from_date && form.to_date) {
        const d1 = new Date(form.from_date);
        const d2 = new Date(form.to_date);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        units = diffDays > 0 ? diffDays : 0;
      }
    }
    setForm(prev => ({
      ...prev,
      total_units: units,
      unit_type: type
    }));
  };
  const fetchData = async () => {
    if (configLoading) return;
    try {
      setLoading(true);
      const headers = getHeaders();
      const empRes = await axios.get(`${baseUrl}/api/add-employee`, {
        params: {
          userId: user?.userId || user?._id || user?.id,
          role: user?.role,
          pageId: 'leave_apply'
        },
        headers
      });
      const typesRes = await axios.get(`${baseUrl}/api/leave-types`, { headers });
      const appsRes = await axios.get(`${baseUrl}/api/leave-applications`, {
        params: {
          userId: user?.userId || user?._id || user?.id,
          role: user?.role
        },
        headers
      });
      let employeeList = empRes.data || [];

      // Backend now handles all data scope and hierarchy filtering via /api/add-employee
      setEmployees(employeeList);
      // Auto-select first employee if list is populated (Fix for Own Data users seeing blank)
      if (employeeList && employeeList.length > 0 && !form.employee_id) {
        setForm(prev => ({ ...prev, employee_id: employeeList[0]._id || employeeList[0].id }));
      }
      // Filter only active leave types for dropdown
      setLeaveTypes((typesRes.data || []).filter(t => t.is_active));
      setApplications(appsRes.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to submit leave requests.");
      setTimeout(() => setError(''), 3000);
      return;
    }

    const activeCtx = localStorage.getItem('active_company') || 'All';
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    const userComp = userData.company_name || userData.company || '';
    const companiesToProcess = activeCtx === 'All'
      ? selectedCompanies
      : [activeCtx || userComp || ''].filter(Boolean);

    if (companiesToProcess.length === 0 && showCompanyAssign) {
      setError("Company selection is required");
      setTimeout(() => setError(''), 3000);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Validate dates
      if (form.from_date > form.to_date) {
        throw new Error("From Date cannot be later than To Date");
      }
      const payload = {
        ...form,
        company_names: companiesToProcess,
        branch_names: selectedAddBranches,
        applied_at: new Date().toISOString()
      };
      const headers = getHeaders();
      if (editingId) {
        await axios.put(`${baseUrl}/api/leave-applications/${editingId}`, payload, { headers });
        setMessage('Leave application updated successfully!');

        // Trigger Notification for Update
        await axios.post(`${baseUrl}/api/notifications`, {
          type: 'info',
          title: 'Leave Application Updated',
          message: `Leave application for ${employees.find(e => (e._id || e.id) === form.employee_id)?.name || 'Employee'} has been updated to ${form.status}.`,
          category: 'leave',
          userId: user?.userId || user?._id || user?.id,
          employeeId: form.employee_id,
          data: { leave_id: editingId, status: form.status }
        }, { headers });
        window.dispatchEvent(new Event('notificationUpdate'));

      } else {
        const resp = await axios.post(`${baseUrl}/api/leave-applications`, payload, { headers });
        setMessage('Leave request submitted successfully!');

        // Trigger Notification for New Application
        await axios.post(`${baseUrl}/api/notifications`, {
          type: 'success',
          title: 'New Leave Application',
          message: `${employees.find(e => (e._id || e.id) === form.employee_id)?.name || 'Employee'} has applied for ${form.leave_mode} leave.`,
          category: 'leave',
          userId: user?.userId || user?._id || user?.id,
          employeeId: form.employee_id,
          data: {
            leave_id: resp.data?.inserted_id || resp.data?._id,
            status: 'PENDING'
          }
        }, { headers });
        window.dispatchEvent(new Event('notificationUpdate'));
      }
      // Partial clear: Keep employee_id and leave_type_id for continued use, clear others
      setForm(prev => ({
        ...prev,
        leave_mode: 'FULL_DAY',
        from_date: '',
        to_date: '',
        from_time: '',
        to_time: '',
        shift_id: '',
        schedule_id: '',
        total_units: 0,
        unit_type: 'DAYS',
        reason: '',
        status: statusPermissions.pending ? 'PENDING' : (statusPermissions.approved ? 'APPROVED' : (statusPermissions.rejected ? 'REJECTED' : 'PENDING')),
        approved_by: '',
        approved_at: '',
        remarks: ''
      }));
      setEditingId(null);
      setShift(null);
      await fetchData(); // Refresh applications
      await fetchSummary(); // Explicitly refresh summary after data change
    } catch (err) {
      console.error("Submit Error:", err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to submit leave request.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (app) => {
    setForm({
      employee_id: app.employee_id || '',
      leave_type_id: app.leave_type_id || '',
      leave_mode: app.leave_mode || 'FULL_DAY',
      from_date: app.from_date || app.leave_date || '', // Fallback
      to_date: app.to_date || app.leave_date || '',
      from_time: app.from_time || '',
      to_time: app.to_time || '',
      shift_id: app.shift_id || '',
      schedule_id: app.schedule_id || '',
      total_units: app.total_units || 0,
      unit_type: app.unit_type || 'DAYS',
      reason: app.reason || '',
      status: app.status || 'PENDING',
      approved_by: app.approved_by || '',
      approved_at: app.approved_at || '',
      remarks: app.remarks || ''
    });
    setEditingId(app.leave_id || app._id);
  };
  const handleDelete = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete leave requests.");
      setTimeout(() => setError(''), 3000);
      setShowDeleteConfirm(false);
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/api/leave-applications/${deletingId}`, { headers: getHeaders() });
      setMessage('Leave application deleted successfully!');
      await fetchData();
      await fetchSummary(); // Refresh summary after delete
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete leave application.');
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
      employee_id: '',
      leave_type_id: '',
      leave_mode: 'FULL_DAY',
      from_date: '',
      to_date: '',
      from_time: '',
      to_time: '',
      shift_id: '',
      schedule_id: '',
      total_units: 0,
      unit_type: 'DAYS',
      reason: '',
      status: 'PENDING',
      approved_by: '',
      approved_at: '',
      remarks: ''
    });
    setEditingId(null);
    setShift(null);
    setMessage('');
    setError('');
  };
  if (loading && employees.length === 0 && leaveTypes.length === 0 && applications.length === 0) {
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
          <FaCalendarAlt style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading leave applications...</p>
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
        maxWidth: '1400px',
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
            <FaCalendarAlt style={{ color: '#3498db', fontSize: '2rem' }} />
            Leave Applications ({applications.length})
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
              >
                <FaCog /> Customize
              </button>
            )}
            <button
              onClick={() => navigate('/leave-type')}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
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
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(46, 204, 113, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(46, 204, 113, 0.3)';
              }}
              disabled={loading}
            >
              <FaPlus /> Manage Leave Types
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
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(149, 165, 166, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(149, 165, 166, 0.3)';
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
        {/* Leave Balance Summary Table */}
        {form.employee_id && leaveSummary.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontWeight: '600' }}>
              <FaInfoCircle style={{ color: '#3498db', marginRight: '8px' }} /> Leave Balance Summary
            </h4>
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e9ecef'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', color: '#2c3e50' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Leave Type</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Total Allocated</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Monthly Credit</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Pending</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveSummary.map((item, idx) => (
                    <tr key={idx} style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#2c3e50' }}>{item.leave_name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#3498db', fontWeight: 'bold' }}>{item.total_allocated}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#7f8c8d' }}>{item.monthly_credit}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#95a5a6' }}>{item.pending}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>{item.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <FaPlus style={{ color: '#3498db', marginRight: '8px' }} /> {editingId ? 'Edit Leave Application' : 'Submit Leave Request'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {isFieldVisible('employee_id') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Employee</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select
                    required
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.9rem',
                      color: '#2c3e50',
                      outline: 'none',
                      width: '100%'
                    }}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              )}
              {isFieldVisible('leave_type_id') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Leave Type</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select
                    required
                    value={form.leave_type_id}
                    onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.9rem',
                      color: '#2c3e50',
                      outline: 'none',
                      width: '100%'
                    }}
                  >
                    <option value="">-- Select Leave Type --</option>
                    {leaveTypes.map(lt => (
                      <option key={lt.leave_type_id || lt._id} value={lt.leave_type_id || lt._id}>
                        {lt.leave_name} ({lt.leave_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              )}
              {isFieldVisible('leave_mode') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Leave Mode</label>
                <select
                  value={form.leave_mode}
                  onChange={(e) => {
                    let newMode = e.target.value;
                    setForm({ ...form, leave_mode: newMode });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                >
                  <option value="FULL_DAY">Full Day</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
              )}
              {/* Date Ranges */}
              {isFieldVisible('from_date') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>From Date</label>
                <input
                  type="date"
                  required
                  value={form.from_date}
                  onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      console.log('Picker not supported');
                    }
                  }}
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
              {isFieldVisible('to_date') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>To Date</label>
                <input
                  type="date"
                  required
                  value={form.to_date}
                  min={form.from_date}
                  onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      console.log('Picker not supported');
                    }
                  }}
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
              {form.leave_mode === 'HOURLY' && (
                <>
                  {isFieldVisible('from_time') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>From Time</label>
                    <input
                      type="time"
                      value={form.from_time}
                      onChange={(e) => setForm({ ...form, from_time: e.target.value })}
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
                  {isFieldVisible('to_time') && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>To Time</label>
                    <input
                      type="time"
                      value={form.to_time}
                      onChange={(e) => setForm({ ...form, to_time: e.target.value })}
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
                </>
              )}
              {/* Status Field */}
              {isFieldVisible('status') && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: '#f8f9fa'
                  }}
                >
                  {statusPermissions.pending && <option value="PENDING">Pending</option>}
                  {statusPermissions.approved && <option value="APPROVED">Approved</option>}
                  {statusPermissions.rejected && <option value="REJECTED">Rejected</option>}
                  {!statusPermissions.pending && !statusPermissions.approved && !statusPermissions.rejected && (
                    <option value="">No Status Allowed</option>
                  )}
                </select>
              </div>
              )}
            </div>
            {isFieldVisible('reason') && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Reason (Optional)</label>
              <textarea
                placeholder="Enter reason for leave..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e9ecef',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  resize: 'vertical'
                }}
              />
            </div>
            )}
            {isFieldVisible('remarks') && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Remarks (Manager Only)</label>
              <textarea
                placeholder="Admin remarks..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e9ecef',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  resize: 'vertical'
                }}
              />
            </div>
            )}
            <p style={{ marginTop: '10px', fontWeight: '600', color: '#3498db' }}>Total: {form.total_units} {form.unit_type} (Calculated)</p>
            {(() => {
              const currentSummary = leaveSummary.find(s => s.leave_type_id === form.leave_type_id);
              if (currentSummary && form.total_units > currentSummary.available) {
                return (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeeba',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaExclamationTriangle />
                    <span>
                      <strong>Warning:</strong> You are exceeding your available balance ({currentSummary.available}). This may be considered as Unpaid Leave or Loss of Pay.
                    </span>
                  </div>
                );
              }
              return null;
            })()}
            {/* --- Company and Branch Assignment Section --- */}
            {showCompanyAssign && (
              <div style={{ marginTop: '30px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaBuilding style={{ color: '#3b82f6' }} /> Assign to Companies *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {allCompanies.map((comp, idx) => {
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
                disabled={loading || !form.employee_id || !form.leave_type_id || !form.from_date || !form.to_date}
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
                {loading ? 'Submitting...' : editingId ? 'Update' : 'Submit'} Leave Request
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
        {/* Applications Table */}
        <h4 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontWeight: '600' }}>
          <FaUserTie style={{ color: '#3498db', marginRight: '8px' }} /> Leave Applications
        </h4>
        {applications.length > 0 ? (
          <div style={{
            overflowX: 'auto',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1400px'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: '#ffffff'
                }}>
                  {isFieldVisible('employee_id') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Employee</th>}
                  {isFieldVisible('leave_type_id') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Type</th>}
                  {isFieldVisible('from_date') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Start Date</th>}
                  {isFieldVisible('to_date') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>End Date</th>}
                  {isFieldVisible('leave_mode') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Mode</th>}
                  {(isFieldVisible('from_time') || isFieldVisible('to_time')) && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Time</th>}
                  {isFieldVisible('total_units') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Details</th>}
                  {isFieldVisible('status') && <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Status</th>}
                  <th style={{ padding: '15px 12px', border: 'none', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: '600', fontSize: '0.95rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, index) => {
                  // Helper to get name if backend returns N/A or missing
                  const getEmployeeName = (app) => {
                    if (app.employee_name && app.employee_name !== 'N/A') return app.employee_name;
                    const emp = employees.find(e => (e._id === app.employee_id || e.id === app.employee_id));
                    return emp ? emp.name : 'Unknown Employee';
                  };

                  const getLeaveName = (app) => {
                    if (app.leave_name && app.leave_name !== 'N/A') return `${app.leave_name} (${app.leave_code || ''})`;
                    const lt = leaveTypes.find(t => (t.leave_type_id === app.leave_type_id || t._id === app.leave_type_id));
                    return lt ? `${lt.leave_name} (${lt.leave_code || ''})` : 'Unknown Type';
                  };

                  return (
                    <tr key={app.leave_id || app._id} style={{
                      borderBottom: '1px solid #e9ecef',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      transition: 'all 0.2s ease'
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'; }}
                    >
                      {isFieldVisible('employee_id') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{getEmployeeName(app)}</td>}
                      {isFieldVisible('leave_type_id') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', whiteSpace: 'nowrap', color: '#2c3e50' }}>{getLeaveName(app)}</td>}
                      {isFieldVisible('from_date') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{app.from_date || app.leave_date}</td>}
                      {isFieldVisible('to_date') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{app.to_date || app.leave_date}</td>}
                      {isFieldVisible('leave_mode') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>{app.leave_mode || 'FULL_DAY'}</td>}
                      {(isFieldVisible('from_time') || isFieldVisible('to_time')) && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                        {app.leave_mode === 'HOURLY' ? `${app.from_time || ''} - ${app.to_time || ''}` : '-'}
                      </td>}
                      {isFieldVisible('total_units') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                        {app.total_units} {app.unit_type}
                      </td>}
                      {isFieldVisible('status') && <td style={{ padding: '15px 12px', borderRight: '1px solid #e9ecef', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: app.status === 'APPROVED' ? '#d4edda' : app.status === 'REJECTED' ? '#f8d7da' : '#fff3cd',
                          color: app.status === 'APPROVED' ? '#155724' : app.status === 'REJECTED' ? '#721c24' : '#856404'
                        }}>
                          {app.status || 'PENDING'}
                        </span>
                      </td>}
                      <td style={{ padding: '15px 12px', textAlign: 'center', whiteSpace: 'nowrap', color: '#2c3e50' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              if (!canWrite) {
                                setError("You do not have permission to edit leave requests.");
                                setTimeout(() => setError(''), 3000);
                                // Scroll to error
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                return;
                              }
                              handleEdit(app);
                            }}
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
                            onClick={() => {
                              if (!canDelete) {
                                setError("You do not have permission to delete leave requests.");
                                setTimeout(() => setError(''), 3000);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                return;
                              }
                              handleDelete(app.leave_id || app._id);
                            }}
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
                  );
                })}
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
            <FaSearch style={{ fontSize: '4rem', marginBottom: '20px', color: '#3498db' }} />
            No leave applications found.
            <button
              // Focus on the form
              onClick={() => {
                document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
                document.querySelector('select').focus();
              }}
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
              Submit Request
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
            }}>Are you sure you want to delete this application? This action cannot be undone.</p>
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
        targetDocType="Leave Apply"
      />
    </div>
  );
};
export default LeaveApply;
