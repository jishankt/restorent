// src/components/Form/Employee.jsx
// EmployeePage.jsx - Updated: Robust Admin Permission Bypass & Reliable Data Fetching.
// FIXES: 
// 1. Data loading no longer waits for a non-empty baseUrl (defaults to relative paths).
// 2. Admin users (by role or specific email) get immediate permission access.
// 3. Excessive logging removed.
// 4. Vehicle/Employee dropdowns populate automatically.

import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlusCircle, FaUsers, FaEdit, FaTrash, FaKey, FaCheck, FaTimes, FaUserTie, FaSearch, FaCar, FaSync } from 'react-icons/fa';

function EmployeePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Global State
  const { baseUrl, configLoading, user } = useContext(UserContext);

  const [employees, setEmployees] = useState([]);
  const [generalEmployees, setGeneralEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    selectedGeneralEmployeeId: '',
    name: '',
    countryCode: '+91',
    phoneNumber: '',
    vehicleNumber: '',
    role: 'Delivery Boy',
    email: '',
    secretKey: '',
    assignmentType: 'Short Term',
    startDate: '',
    endDate: '',
    branch_names: [],
  });

  const [editMode, setEditMode] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Custom Delete Confirmation State
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState(() => {
    try {
      const stored = localStorage.getItem('selectedBranches_employee');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Permission State - Initialize based on User Context immediately if possible
  const isUserAdmin = (u) => {
    if (!u) return false;
    const role = u.role || '';
    const email = u.email || '';
    const branch = u.branch_name || u.branch || "";
    
    const isAdmin = role.toLowerCase().includes('admin') || email === 'admin@gmail.com';
    
    // Standardization: detect if company admin or branch user
    const is_Admin = (role === 'company_admin' || role === 'admin' || role === 'group_admin') && (!branch || branch === 'All Branches');
    setIsCompanyAdmin(is_Admin);
    setIsGroupAdmin(role === 'group_admin');
    
    return isAdmin;
  };

  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  // Update permissions immediately when user context changes
  useEffect(() => {
    if (user && isUserAdmin(user)) {
      setCanWrite(true);
      setCanDelete(true);
      setCanCreate(true);
    }
  }, [user]);

  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+971', country: 'UAE (Dubai)' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
  ];

  // Initial Data Fetching
  useEffect(() => {
    // If config is still loading, wait.
    if (configLoading) return;

    // Use baseUrl if available, otherwise relative path (empty string)
    const effectiveBaseUrl = baseUrl || '';

    const fetchData = async () => {
      setLoading(true);
      try {
        // If NOT admin, fetch permissions from API. Admin permissions are handled by the other useEffect or immediate check.
        if (!isUserAdmin(user)) {
          await fetchPermissions(effectiveBaseUrl);
        } else {
          // Ensure admin perms are set if not already
          setCanWrite(true);
          setCanDelete(true);
          setCanCreate(true);
          
          // For admins, handle company context
          const activeContext = localStorage.getItem('active_company');
          if (activeContext === 'All') {
            await fetchCompanies(effectiveBaseUrl);
          } else {
            setSelectedCompanies([activeContext || user?.company_name || ""]);
          }
        }

        // Fetch all required data in parallel
        await Promise.all([
          fetchDeliveryEmployees(effectiveBaseUrl),
          fetchGeneralEmployees(effectiveBaseUrl),
          fetchVehicles(effectiveBaseUrl),
          fetchBranches(effectiveBaseUrl)
        ]);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        // Do not block UI with full page error for partial failures
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, configLoading, user]);

  useEffect(() => {
    if (!configLoading) {
      const effectiveBaseUrl = baseUrl || '';
      fetchDeliveryEmployees(effectiveBaseUrl);
      fetchGeneralEmployees(effectiveBaseUrl);
    }
  }, [selectedBranches, selectedCompanies]);

  useEffect(() => {
    if (!configLoading) {
      const effectiveBaseUrl = baseUrl || '';
      fetchBranches(effectiveBaseUrl);
    }
  }, [selectedCompanies]);

  // Handle return from creation pages
  useEffect(() => {
    if (location.state) {
      const effectiveBaseUrl = baseUrl || '';
      if (location.state.newGeneralEmployeeId) {
        fetchGeneralEmployees(effectiveBaseUrl);
        setFormData(prev => ({ ...prev, selectedGeneralEmployeeId: location.state.newGeneralEmployeeId }));
      }
      if (location.state.newVehicleNumber) {
        fetchVehicles(effectiveBaseUrl);
        setFormData(prev => ({ ...prev, vehicleNumber: location.state.newVehicleNumber }));
      }
      if (location.state.preservedState) {
        setFormData(prev => ({
          ...prev,
          ...location.state.preservedState,
          selectedGeneralEmployeeId: location.state.newGeneralEmployeeId || location.state.preservedState.selectedGeneralEmployeeId,
          vehicleNumber: location.state.newVehicleNumber || location.state.preservedState.vehicleNumber
        }));
      }
    }
  }, [location.state, baseUrl]);

  // Fetch Permissions (Non-Admin Fallback)
  const fetchPermissions = async (url) => {
    try {
      let currentUser = user;
      if (!currentUser) {
        const userStr = localStorage.getItem('user');
        if (userStr) currentUser = JSON.parse(userStr);
      }

      if (currentUser && currentUser.role) {
        const role = currentUser.role.toLowerCase();
        const branch = currentUser.branch_name || currentUser.branch || "";
        
        // Standardization: detect if company admin or branch user
        const is_Admin = (role === 'company_admin' || role === 'admin' || role === 'group_admin') && (!branch || branch === 'All Branches');
        setIsCompanyAdmin(is_Admin);
        setIsGroupAdmin(role === 'group_admin');

        const activeContext = localStorage.getItem('active_company');
        if (activeContext === 'All') {
          await fetchCompanies(url);
        } else {
          setSelectedCompanies([activeContext || currentUser.company_name || ""]);
        }

        // Bypass permissions for company and branch admins
        if (role === 'company_admin' || role === 'admin' || role === 'branch_admin' || role === 'company' || role === 'branch' || role === 'group_admin') {
          setCanWrite(true);
          setCanDelete(true);
          setCanCreate(true);
          return;
        }

        const headers = {};
        if (currentUser.company_name) headers['X-Company-Name'] = currentUser.company_name;
        if (currentUser.branch_name) headers['X-Branch-Name'] = currentUser.branch_name;

        const response = await axios.get(`${url}/api/role-permissions?role=${currentUser.role}`, { headers });
        const perms = response.data.permissions || [];
        const pagePerm = perms.find(p => p.pageId === 'delivery_persons');

        if (pagePerm) {
          setCanWrite(pagePerm.canWrite === true);
          setCanDelete(pagePerm.canDelete === true);
          setCanCreate(pagePerm.canCreate === true);
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  // Helper to resolve branches from any record (employee, vehicle, etc.)
  const resolveBranches = (item) => {
    if (!item) return [];
    
    // Check for array fields first
    const arrayFields = ['branch_names', 'branch_name', 'branches', 'Branches', 'BranchNames', 'branch_ids'];
    for (const field of arrayFields) {
      if (Array.isArray(item[field]) && item[field].length > 0) {
        return item[field].map(s => String(s).trim());
      }
    }

    // Check for comma-separated string fields
    const stringFields = ['branch_names', 'branch_name', 'branch', 'branchName', 'BranchNames', 'branches', 'branchNameList'];
    for (const field of stringFields) {
      const val = item[field];
      if (typeof val === 'string' && val.trim() !== '') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    return [];
  };

  const fetchCompanies = async (url) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      
      if (userObj.role === 'group_admin' && userObj.companies && userObj.companies.length > 0) {
        setCompanyOptions(userObj.companies);
        return;
      }

      const headers = {};
      if (userObj.company_name || userObj.company) headers['X-Company-Name'] = userObj.company_name || userObj.company;
      
      const response = await axios.get(`${url}/api/company-details`, { headers });
      const details = response.data.companyDetails || [];
      const names = details.map(d => d.restaurantName).filter(n => n);
      const uniqueNames = [...new Set(names)];
      setCompanyOptions(uniqueNames);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };


  const fetchBranches = async (url) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const companyToUse = isGroupAdmin && selectedCompanies.length > 0 ? selectedCompanies[0] : (userData.company_name || '');
        if (companyToUse) headers['X-Company-Name'] = companyToUse;
      }
      const response = await axios.get(`${url}/api/branches`, { headers });
      const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
      setAvailableBranches(branchData);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchDeliveryEmployees = async (url) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const companyToUse = isGroupAdmin && selectedCompanies.length > 0 ? selectedCompanies[0] : (userData.company_name || '');
        if (companyToUse) headers['X-Company-Name'] = companyToUse;
        
        const branchToUse = selectedBranches.length > 0 ? selectedBranches[0] : (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
      }
      const response = await axios.get(`${url}/api/delivery-employees`, {
        headers,
        params: { branch_names: selectedBranches.join(',') }
      });
      
      let data = Array.isArray(response.data) ? response.data : [];
      
      // Frontend refinement: Ensure records from other branches don't leak in
      if (selectedBranches.length > 0) {
        data = data.filter(emp => {
          const empBranches = resolveBranches(emp);
          return selectedBranches.some(sb => 
            empBranches.some(rb => String(rb).trim().toLowerCase() === String(sb).trim().toLowerCase())
          );
        });
      }
      
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching delivery employees:", err);
    }
  };

  const fetchGeneralEmployees = async (url) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const companyToUse = isGroupAdmin && selectedCompanies.length > 0 ? selectedCompanies[0] : (userData.company_name || '');
        if (companyToUse) headers['X-Company-Name'] = companyToUse;
        
        const branchToUse = selectedBranches.length > 0 ? selectedBranches[0] : (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
      }
      let params = {};
      const currentUser = user || JSON.parse(userStr || '{}');
      if (currentUser && (currentUser.id || currentUser.userId || currentUser._id)) {
        const uid = currentUser.id || currentUser.userId || currentUser._id;
        params = { 
          userId: uid, 
          role: currentUser.role, 
          id: uid,
          ...(selectedBranches.length > 0 ? { branch_name: selectedBranches.join(',') } : {})
        };
      }

      const response = await axios.get(`${url}/api/employees`, { headers, params });
      if (Array.isArray(response.data)) {
        let data = response.data.filter(emp => !emp.isDraft);
        
        // Frontend refinement: Ensure records from other branches don't leak in
        if (selectedBranches.length > 0) {
          data = data.filter(emp => {
            const empBranches = resolveBranches(emp);
            // Show if it belongs to any selected branch (case-insensitive) OR has no branch (unassigned candidate)
            return empBranches.length === 0 || selectedBranches.some(sb => 
              empBranches.some(rb => String(rb).trim().toLowerCase() === String(sb).trim().toLowerCase())
            );
          });
        }
        
        setGeneralEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching general employees:', err);
    }
  };

  const fetchVehicles = async (url) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const companyToUse = isGroupAdmin && selectedCompanies.length > 0 ? selectedCompanies[0] : (userData.company_name || '');
        if (companyToUse) headers['X-Company-Name'] = companyToUse;
        
        const branchToUse = selectedBranches.length > 0 ? selectedBranches[0] : (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
      }
      const response = await axios.get(`${url}/api/vehicle/management`, { headers });
      if (Array.isArray(response.data)) {
        const validVehicles = response.data.filter(v => v.vehicle_number && v.status === 'ACTIVE');
        setVehicles(validVehicles);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const validateSecretKey = (key) => {
    return key.length === 6 && /^\d+$/.test(key);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'secretKey' && error && error.includes('Secret key')) {
      setError(null);
    }
  };

  const handleGeneralEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'create_new') {
      navigate('/add-employee', {
        state: { returnTo: '/employees', preservedState: formData }
      });
      return;
    }

    setFormData(prev => ({ ...prev, selectedGeneralEmployeeId: selectedId }));
    if (selectedId) {
      const selectedEmp = generalEmployees.find(emp => String(emp._id) === String(selectedId));
      if (selectedEmp) {
        setFormData(prev => ({
          ...prev,
          selectedGeneralEmployeeId: selectedId,
          name: selectedEmp.name || '',
          email: selectedEmp.email || '',
          phoneNumber: selectedEmp.phoneNumber?.replace(/\D/g, '') || '',
          branch_names: resolveBranches(selectedEmp),
          employeeCompany: selectedEmp.company || selectedEmp.company_name || 'Unassigned'
        }));
      }
    }
  };

  const handleVehicleSelect = (e) => {
    const selectedVehicleNumber = e.target.value;
    if (selectedVehicleNumber === 'create_new') {
      navigate('/vehicle-management', {
        state: { returnTo: '/employees', action: 'create', preservedState: formData }
      });
      return;
    }
    setFormData(prev => ({ ...prev, vehicleNumber: selectedVehicleNumber }));
  };

  const handleBranchToggle = (branch) => {
    setFormData(prev => {
      const branches = prev.branch_names || [];
      const lowerBranch = String(branch).trim().toLowerCase();
      const index = branches.findIndex(b => String(b).trim().toLowerCase() === lowerBranch);
      if (index !== -1) {
        return { ...prev, branch_names: branches.filter((_, i) => i !== index) };
      } else {
        return { ...prev, branch_names: [...branches, branch] };
      }
    });
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();

    // Final Safe Permission Check
    if (!canCreate && !isUserAdmin(user)) {
      setError("You do not have permission to assign delivery profiles.");
      return;
    }

    if (!formData.selectedGeneralEmployeeId || !formData.vehicleNumber || !formData.secretKey) {
      setError('Please select an employee, vehicle, and provide a 6-digit secret key.');
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;

    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const url = baseUrl || '';

      const headers = {};
      const userStr = localStorage.getItem('user');
      let currentUser = user;
      if (!currentUser && userStr) {
        currentUser = JSON.parse(userStr);
      }

      // Automatically assign current branch if not company admin
      const finalBranchNames = (formData.branch_names && formData.branch_names.length > 0) 
        ? formData.branch_names 
        : (currentUser && currentUser.branch_name ? [currentUser.branch_name] : []);

      const response = await axios.post(`${url}/api/delivery-employees`, {
        name: formData.name,
        generalEmployeeId: formData.selectedGeneralEmployeeId,
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber,
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey,
        assignmentType: formData.assignmentType,
        startDate: formData.startDate,
        endDate: formData.assignmentType === 'Long Term' ? (formData.endDate || null) : formData.endDate,
        branch_names: finalBranchNames,
        branch_name: finalBranchNames[0] || '',
        company: formData.employeeCompany,
        company_name: formData.employeeCompany
      }, { headers });

      const newEmployee = response.data.employee;
      setMessage(`Delivery profile assigned successfully! Secret Key: ${newEmployee.secretKey}`);

      // Reset form
      setFormData({
        selectedGeneralEmployeeId: '',
        name: '',
        countryCode: '+91',
        phoneNumber: '',
        vehicleNumber: '',
        role: 'Delivery Boy',
        email: '',
        secretKey: '',
        assignmentType: 'Short Term',
        startDate: '',
        endDate: '',
        branch_names: []
      });
      fetchDeliveryEmployees(url);
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data);
      setError(`Failed to assign delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditMode(true);
    setEditEmployeeId(employee.employeeId);

    const countryCode = countryCodes.find(code => employee.phoneNumber.startsWith(code.code))?.code || '+91';
    const phoneNumber = employee.phoneNumber.slice(countryCode.length);
    const generalEmp = generalEmployees.find(emp => String(emp._id) === String(employee.generalEmployeeId));

    setFormData({
      selectedGeneralEmployeeId: employee.generalEmployeeId || '',
      name: generalEmp ? generalEmp.name : employee.name || '',
      countryCode,
      phoneNumber,
      vehicleNumber: employee.vehicleNumber || '',
      role: employee.role,
      email: employee.email || '',
      secretKey: employee.secretKey || '',
      assignmentType: employee.assignmentType || 'Short Term',
      startDate: employee.startDate || '',
      endDate: employee.endDate || '',
      branch_names: resolveBranches(employee),
    });
    setSelectedEmployee(employee);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!canWrite && !isUserAdmin(user)) {
      setError("You do not have permission to update delivery profiles.");
      return;
    }
    if (!validateSecretKey(formData.secretKey)) {
      setError('Secret key must be exactly 6 digits');
      return;
    }

    const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;

    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const url = baseUrl || '';
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        const branchToUse = selectedBranches.length > 0 ? selectedBranches[0] : (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
      }

      const response = await axios.put(`${url}/api/delivery-employees/${editEmployeeId}`, {
        name: formData.name,
        generalEmployeeId: formData.selectedGeneralEmployeeId,
        phoneNumber: fullPhoneNumber,
        vehicleNumber: formData.vehicleNumber,
        role: formData.role,
        email: formData.email,
        secretKey: formData.secretKey,
        assignmentType: formData.assignmentType,
        startDate: formData.startDate,
        endDate: formData.assignmentType === 'Long Term' ? (formData.endDate || null) : formData.endDate,
        branch_names: formData.branch_names,
        branch_name: formData.branch_names[0] || '',
        company: formData.employeeCompany,
        company_name: formData.employeeCompany
      }, { headers });

      const updatedEmployee = response.data.employee;
      setMessage(`Delivery profile updated successfully! Secret Key: ${updatedEmployee.secretKey}`);

      setFormData({
        selectedGeneralEmployeeId: '',
        name: '',
        countryCode: '+91',
        phoneNumber: '',
        vehicleNumber: '',
        role: 'Delivery Boy',
        email: '',
        secretKey: '',
        assignmentType: 'Short Term',
        startDate: '',
        endDate: '',
        branch_names: []
      });
      setEditMode(false);
      setEditEmployeeId(null);
      setSelectedEmployee(null);
      fetchDeliveryEmployees(effectiveBaseUrl);
    } catch (err) {
      setError(`Failed to update delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = (employeeId) => {
    if (!canDelete && !isUserAdmin(user)) {
      setError("You do not have permission to delete delivery profiles.");
      return;
    }
    setEmployeeToDelete(employeeId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        const branchToUse = selectedBranches.length > 0 ? selectedBranches[0] : (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
      }
      const effectiveBaseUrl = baseUrl || '';
      await axios.delete(`${effectiveBaseUrl}/api/delivery-employees/${employeeToDelete}`, { headers });
      setMessage('Delivery profile deleted successfully');
      setSelectedEmployee(null);
      fetchDeliveryEmployees(effectiveBaseUrl);
    } catch (err) {
      setError(`Failed to delete delivery profile: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditMode(false);
    setFormData({
      selectedGeneralEmployeeId: '',
      name: '',
      countryCode: '+91',
      phoneNumber: '',
      vehicleNumber: '',
      role: 'Delivery Boy',
      email: '',
      secretKey: '',
      assignmentType: 'Short Term',
      startDate: '',
      endDate: '',
      branch_names: []
    });
  };

  // Safe manual refresh handlers
  const handleRefreshEmployees = () => {
    const url = baseUrl || '';
    fetchGeneralEmployees(url);
  };

  const handleRefreshVehicles = () => {
    const url = baseUrl || '';
    fetchVehicles(url);
  };

  if (loading && employees.length === 0 && generalEmployees.length === 0 && vehicles.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <FaUsers style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading delivery employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', position: 'relative' }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent',
          border: '2px solid #3498db', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '8px', padding: '8px 20px', borderRadius: '50px', fontSize: '16px', fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)', zIndex: 1001, transition: 'all 0.3s ease'
        }}
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{ maxWidth: '1250px', margin: '80px auto 20px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #3498db' }}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', margin: 0, fontSize: '1.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <FaUsers style={{ color: '#3498db', fontSize: '2rem' }} /> Delivery Employee Management
          </h2>
        </div>

        {/* Role-based Company and Branch Filters */}
        {isGroupAdmin && localStorage.getItem('active_company') === 'All' && companyOptions.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #3498db',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 2px 4px rgba(52, 152, 219, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUsers style={{ color: '#3498db', fontSize: '1.2rem' }} />
              <span style={{ fontWeight: '600', color: '#2c3e50' }}>Filter by Companies:</span>
              <button 
                onClick={() => setSelectedCompanies([])}
                style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #dfe6e9' }}>
              {companyOptions.map(comp => (
                <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: selectedCompanies.includes(comp) ? '#e3f2fd' : '#f8f9fa', padding: '5px 12px', borderRadius: '20px', border: '1px solid', borderColor: selectedCompanies.includes(comp) ? '#3498db' : '#dfe6e9' }}>
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(comp)}
                    onChange={() => {
                      setSelectedCompanies(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);
                    }}
                    style={{ cursor: 'pointer', accentColor: '#3498db' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#2c3e50' }}>{comp}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(isGroupAdmin || (isCompanyAdmin && !localStorage.getItem('branch_name'))) && availableBranches.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid #3498db',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 2px 4px rgba(52, 152, 219, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUsers style={{ color: '#3498db', fontSize: '1.2rem' }} />
              <span style={{ fontWeight: '600', color: '#2c3e50' }}>Filter by Branches:</span>
              <button 
                onClick={() => {
                  setSelectedBranches([]);
                  localStorage.removeItem('selectedBranches_employee');
                }}
                style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}
              >
                Clear All
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px', 
              maxHeight: '120px', 
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #dfe6e9'
            }}>
              {availableBranches.map(branch => (
                <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: selectedBranches.some(sb => String(sb).toLowerCase() === String(branch).toLowerCase()) ? '#e3f2fd' : '#f8f9fa', padding: '5px 12px', borderRadius: '20px', border: '1px solid', borderColor: selectedBranches.some(sb => String(sb).toLowerCase() === String(branch).toLowerCase()) ? '#3498db' : '#dfe6e9', transition: 'all 0.2s ease' }}>
                  <input
                    type="checkbox"
                    checked={selectedBranches.some(sb => String(sb).toLowerCase() === String(branch).toLowerCase())}
                    onChange={() => {
                      setSelectedBranches(prev => {
                        const isSelected = prev.some(sb => String(sb).toLowerCase() === String(branch).toLowerCase());
                        const next = isSelected 
                          ? prev.filter(sb => String(sb).toLowerCase() !== String(branch).toLowerCase()) 
                          : [...prev, branch];
                        localStorage.setItem('selectedBranches_employee', JSON.stringify(next));
                        return next;
                      });
                    }}
                    style={{ cursor: 'pointer', accentColor: '#3498db', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#2c3e50', fontWeight: selectedBranches.some(sb => String(sb).toLowerCase() === String(branch).toLowerCase()) ? '600' : '400' }}>{branch}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', color: '#c0392b', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e74c3c', boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <FaTimes style={{ fontSize: '1.2rem' }} /> {error}
          </div>
        )}
        {message && (
          <div style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)', color: '#155724', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #28a745', boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <FaCheck style={{ fontSize: '1.2rem', color: '#27ae60' }} /> {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '300px', border: '1px solid #e9ecef' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
              {editMode ? 'Edit Delivery Profile' : 'Assign Delivery Profile'}
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); editMode ? handleUpdateEmployee(e) : handleCreateEmployee(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Select Employee
                  <button type="button" onClick={handleRefreshEmployees} style={{ marginLeft: '10px', border: 'none', background: 'transparent', color: '#3498db', cursor: 'pointer' }} title="Refresh List">
                    <FaSync />
                  </button>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #3498db' }}>
                  <FaUserTie style={{ color: '#3498db', fontSize: '1rem' }} />
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select name="selectedGeneralEmployeeId" value={formData.selectedGeneralEmployeeId} onChange={handleGeneralEmployeeSelect} required style={{ flex: 1, padding: '5px 0', border: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2c3e50', outline: 'none' }}>
                    <option value="">Search and Select Employee...</option>
                    <option value="create_new" style={{ fontWeight: 'bold', color: '#3498db' }}>+ Create New Employee</option>
                    {generalEmployees.length > 0 ? (
                      generalEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.employeeId} - {emp.employeeDesignation}) [{emp.company || emp.company_name || 'N/A'}]
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No employees found</option>
                    )}
                  </select>
                </div>
              </div>

              {formData.employeeCompany && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '10px', 
                  border: '1px solid #bbdefb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ backgroundColor: '#1976d2', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                    <FaSync style={{ fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#546e7a', display: 'block', fontWeight: '500' }}>Assigned Company Context</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0d47a1' }}>{formData.employeeCompany}</strong>
                  </div>
                </div>
              )}

              {(isGroupAdmin || (isCompanyAdmin && !localStorage.getItem('branch_name'))) && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Select Branches</label>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    border: '1px solid #3498db', 
                    borderRadius: '10px', 
                    padding: '12px', 
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {availableBranches.map(branch => (
                      <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        <input
                          type="checkbox"
                          checked={formData.branch_names?.some(bn => String(bn).trim().toLowerCase() === String(branch).trim().toLowerCase())}
                          onChange={() => handleBranchToggle(branch)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3498db' }}
                        />
                        <span style={{ fontSize: '0.95rem', color: '#2c3e50' }}>{branch}</span>
                      </label>
                    ))}
                    {availableBranches.length === 0 && <span style={{ color: '#7f8c8d' }}>No branches available</span>}
                  </div>
                </div>
              )}

              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address (Auto-filled)" required style={{ padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff' }} />

              <div style={{ display: 'flex', gap: '10px' }}>
                <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} style={{ padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', width: '150px', color: '#2c3e50' }}>
                  {countryCodes.map(({ code, country }) => (
                    <option key={code} value={code}>{`${country} (${code})`}</option>
                  ))}
                </select>
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" required style={{ flex: '1', padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Select Vehicle
                  <button type="button" onClick={handleRefreshVehicles} style={{ marginLeft: '10px', border: 'none', background: 'transparent', color: '#3498db', cursor: 'pointer' }} title="Refresh Vehicles">
                    <FaSync />
                  </button>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #3498db' }}>
                  <FaCar style={{ color: '#3498db', fontSize: '1rem' }} />
                  <FaSearch style={{ color: '#7f8c8d', fontSize: '1rem' }} />
                  <select name="vehicleNumber" value={formData.vehicleNumber} onChange={handleVehicleSelect} required style={{ flex: 1, padding: '5px 0', border: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2c3e50', outline: 'none' }}>
                    <option value="">Search and Select Vehicle...</option>
                    <option value="create_new" style={{ fontWeight: 'bold', color: '#27ae60' }}>+ Create New Vehicle</option>
                    {vehicles.length > 0 ? (
                      vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle.vehicle_number}>
                          {vehicle.vehicle_number} {vehicle.brand || vehicle.model ? ` (${vehicle.brand || ''} ${vehicle.model || ''})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No vehicles found</option>
                    )}
                  </select>
                </div>
              </div>

              <select name="role" value={formData.role} onChange={handleInputChange} style={{ padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', color: '#2c3e50' }}>
                <option value="Delivery Boy">Delivery Boy</option>
              </select>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: '#f0f7ff', borderRadius: '10px', border: '1px solid #cce4ff' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0056b3', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaSync /> Assignment Details
                </h4>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Assignment Type</label>
                  <select 
                    name="assignmentType" 
                    value={formData.assignmentType} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', color: '#2c3e50' }}
                  >
                    <option value="Short Term">Short Term</option>
                    <option value="Long Term">Long Term</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>Start Date</label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={formData.startDate} 
                      onChange={handleInputChange} 
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      required 
                      style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', cursor: 'pointer' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                      End Date {formData.assignmentType === 'Long Term' ? '(Optional)' : ''}
                    </label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={formData.endDate} 
                      onChange={handleInputChange} 
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      required={formData.assignmentType === 'Short Term'} 
                      style={{ width: '100%', padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', cursor: 'pointer' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaKey style={{ color: '#f39c12', fontSize: '1.2rem' }} />
                <input type="text" name="secretKey" value={formData.secretKey} onChange={handleInputChange} placeholder="6-Digit Secret Key" maxLength={6} required style={{ flex: 1, padding: '12px', border: '1px solid #3498db', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: '#ffffff', textAlign: 'center', fontWeight: 'bold' }} />
              </div>

              <button type="submit" disabled={loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber} style={{ padding: '12px 24px', background: loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: '#ffffff', border: 'none', borderRadius: '50px', cursor: loading || !validateSecretKey(formData.secretKey) || !formData.selectedGeneralEmployeeId || !formData.vehicleNumber ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FaPlusCircle /> {loading ? 'Processing...' : editMode ? 'Update Profile' : 'Assign Profile'}
              </button>

              {editMode && (
                <button type="button" onClick={() => {
                  setEditMode(false);
                  setFormData({ selectedGeneralEmployeeId: '', name: '', countryCode: '+91', phoneNumber: '', vehicleNumber: '', role: 'Delivery Boy', email: '', secretKey: '' });
                  setEditEmployeeId(null);
                }} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)', color: '#ffffff', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', boxShadow: '0 2px 4px rgba(149, 165, 166, 0.3)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Cancel
                </button>
              )}
            </form>
          </div>

          <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '300px', border: '1px solid #e9ecef', maxHeight: '500px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
              Delivery Profiles ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1rem' }}>No delivery profiles assigned.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0', margin: 0 }}>
                {employees.map((employee) => (
                  <li key={employee.employeeId} style={{ padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSelectEmployee(employee)}>
                      <FaUsers style={{ marginRight: '10px', color: '#3498db', fontSize: '1.2rem' }} />
                      <div>
                        <span style={{ fontWeight: '500', color: '#2c3e50', display: 'block' }}>{employee.name}</span>
                        <small style={{ color: '#7f8c8d' }}>Vehicle: {employee.vehicleNumber}</small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditEmployee(employee)} style={{ padding: '8px 12px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: '#ffffff', border: 'none', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)' }}><FaEdit /></button>
                      <button onClick={() => handleDeleteEmployee(employee.employeeId)} style={{ padding: '8px 12px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: '#ffffff', border: 'none', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)' }}><FaTrash /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {selectedEmployee && (
          <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>Delivery Profile Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Linked Employee:</strong> {selectedEmployee.name}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Email:</strong> {selectedEmployee.email || 'N/A'}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Phone Number:</strong> {selectedEmployee.phoneNumber}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Vehicle Number:</strong> {selectedEmployee.vehicleNumber}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Role:</strong> {selectedEmployee.role}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Secret Key:</strong> {selectedEmployee.secretKey || 'N/A'}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Assignment:</strong> <span style={{ padding: '2px 8px', borderRadius: '12px', background: selectedEmployee.assignmentType === 'Long Term' ? '#e8f5e9' : '#fff3e0', color: selectedEmployee.assignmentType === 'Long Term' ? '#2e7d32' : '#e65100', fontWeight: '600', fontSize: '0.85rem' }}>{selectedEmployee.assignmentType || 'Short Term'}</span></p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>Start Date:</strong> {selectedEmployee.startDate || 'N/A'}</p>
              <p style={{ margin: 0, color: '#2c3e50' }}><strong>End Date:</strong> {selectedEmployee.endDate || (selectedEmployee.assignmentType === 'Long Term' ? 'Ongoing' : 'N/A')}</p>
              {selectedEmployee.generalEmployeeId && (
                <p style={{ margin: 0, color: '#2c3e50', gridColumn: '1 / -1' }}><strong>General Employee ID:</strong> {selectedEmployee.generalEmployeeId}</p>
              )}
              <p style={{ margin: 0, color: '#2c3e50', gridColumn: '1 / -1' }}><strong>Assigned Branches:</strong> {resolveBranches(selectedEmployee).join(', ') || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}>
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)', textAlign: 'center', border: '1px solid #e9ecef' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '1.5rem' }}><FaTrash style={{ fontSize: '1.5rem', marginRight: '10px' }} /> Confirm Delete</h3>
            <p style={{ color: '#2c3e50', marginBottom: '25px', fontSize: '1.1rem', lineHeight: '1.5' }}>Are you sure you want to delete this delivery profile? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={confirmDelete} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)', transition: 'all 0.3s ease', minWidth: '120px' }}>{loading ? 'Deleting...' : 'Yes, Delete'}</button>
              <button onClick={cancelDelete} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)', transition: 'all 0.3s ease', minWidth: '120px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeePage;
