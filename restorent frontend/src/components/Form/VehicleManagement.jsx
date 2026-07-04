// src/components/Form/VehicleManagement.jsx
// UPDATED: Full detailed Vehicle Management component aligned to schema with File Uploads.
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaCar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaBuilding,
  FaUser,
  FaFileUpload,
  FaFileAlt,
  FaEye,
  FaFilter,
  FaCheckCircle
} from 'react-icons/fa';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

const VehicleManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);

  // Global State
  const { baseUrl, configLoading, user } = useContext(UserContext);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Filter state for dynamic branches

  // Permissions State
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  
  // Custom State
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
  const [formBranches, setFormBranches] = useState([]);

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
        const resp = await axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`);
        setFilterBranches([...new Set(resp.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name)).filter(Boolean))]);
      } catch (err) {
        console.error("Error fetching filter branches:", err);
      }
    };
    fetchFilterBranches();
  }, [selectedViewCompany, baseUrl, availableBranches]);

  // Auto-open modal based on nav state
  useEffect(() => {
    if (location.state && (location.state.action === 'create' || location.state.openAddModal)) {
      setShowAddModal(true);
    }
  }, [location.state]);

  // Initial Data Fetching - ROBUST FIX for Infinite Loading
  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    const currentBaseUrl = baseUrl || '';

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchVehicles(currentBaseUrl),
          fetchPermissions(currentBaseUrl),
          fetchBranches(currentBaseUrl)
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPermissions = async (url) => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const roleRaw = userData.role || userData.UserType || '';
          const branch = userData.branch || userData.branch_name || "";
          const company = userData.company || userData.company_name || "";
          
          const isAdminRole = checkIsAdmin(userData);
          const isGroupAdminRole = checkIsGlobalAdmin(userData);
          const is_Admin = isAdminRole && (!branch || branch === 'All Branches' || branch === "");
          
          setIsCompanyAdmin(is_Admin);
          setIsGroupAdmin(isGroupAdminRole);
          setUserBranch(userData.branch_name || userData.branch || "");

          if (roleRaw) {
            const headers = {};
            if (company) headers['X-Company-Name'] = company;
            if (branch) headers['X-Branch-Name'] = branch;

            const response = await axios.get(`${url}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`, { headers });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'vehicle_management');

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

          const activeContext = localStorage.getItem('active_company');
          fetchCompanies(url);
          if (activeContext && activeContext !== 'All') {
            setSelectedCompanies([activeContext || company]);
          }
        }
      } catch (error) {
        console.warn("Error fetching permissions:", error);
      }
    };

    const fetchCompanies = async (url) => {
      try {
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : {};
        
        let comps = [];
        if (userObj.companies && Array.isArray(userObj.companies) && userObj.companies.length > 0) {
            comps = userObj.companies.map(c => typeof c === 'string' ? c : c.company_name || c.name).filter(Boolean);
        } else if (userObj.company_name) {
            comps = [userObj.company_name];
        }

        if (comps.length > 0) {
            setAllCompanies(comps);
            setCompanyOptions(comps);
            return;
        }

        const resp = await axios.get(`${url}/api/branches`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (Array.isArray(resp.data)) {
          const companies = [...new Set(resp.data.map(b => b.company_name || b.company).filter(Boolean))].filter(c => c !== 'POS 8');
          setAllCompanies(companies);
          setCompanyOptions(companies);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };

    const fetchBranches = async (url) => {
      try {
        const userStr = localStorage.getItem('user');
        const headers = {};
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData.company_name) headers['X-Company-Name'] = userData.company_name;
        }
        const response = await axios.get(`${url}/api/branches`, { headers });
        const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchData();
  }, [baseUrl, configLoading, selectedViewCompany, selectedBranchFilter]);

  // Form State
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    brand: '',
    model: '',
    fuel_type: '',
    is_company_owned: true,
    rc_number: '',
    rc_expiry: '',
    insurance_number: '',
    insurance_expiry: '',
    insurance_doc: null, // File object
    pollution_expiry: '',
    pollution_doc: null, // File object
    status: 'ACTIVE',
    branch_names: [],
  });


  // Fetch all vehicles
  const fetchVehicles = async (url) => {
    try {
      const headers = {};
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        const branchToUse = selectedBranchFilter || (userData.branch_name || '');
        if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
        
        const companyToUse = selectedViewCompany || localStorage.getItem('active_company') || (userData.company_name || '');
        if (companyToUse && companyToUse !== 'All') headers['X-Company-Name'] = companyToUse;
      }
      const response = await axios.get(`${url}/api/vehicle/management`, { headers });
      let data = response.data || [];
      
      setVehicles(data);
    } catch (err) {
      console.error('Fetch vehicles error:', err);
      setError(`Failed to fetch vehicles: ${err.message}`);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] // Store only the first file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Helper to append form data
  const createFormData = (data) => {
    const form = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== '') {
        if (Array.isArray(data[key])) {
          data[key].forEach(val => form.append(`${key}[]`, val));
        } else {
          form.append(key, data[key]);
        }
      }
    });
    return form;
  }

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

  useEffect(() => {
    if (!isCompanyAdmin || selectedCompanies.length === 0) {
      setFormBranches(availableBranches);
      return;
    }
    const fetchFormBranches = async () => {
      try {
        const branchPromises = selectedCompanies.map(comp => axios.get(`${baseUrl || ''}/api/branches?company_name=${encodeURIComponent(comp)}`));
        const results = await Promise.all(branchPromises);
        let branches = [];
        results.forEach(res => {
          branches = [...branches, ...res.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name))];
        });
        setFormBranches([...new Set(branches.filter(Boolean))]);
      } catch(err) { console.error(err); }
    };
    fetchFormBranches();
  }, [selectedCompanies, isCompanyAdmin, baseUrl, availableBranches]);

  const handleCompanyToggle = (company) => {
    setSelectedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  // Add new vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      setError("You do not have permission to add vehicles.");
      return;
    }
    const currentBaseUrl = baseUrl || '';

    try {
      setLoading(true);
      const activeContext = localStorage.getItem('active_company');
      if (activeContext === 'All' && selectedCompanies.length === 0) {
        setError("Please select at least one company.");
        setLoading(false);
        return;
      }

      const finalBranchNames = (formData.branch_names && formData.branch_names.length > 0)
        ? formData.branch_names
        : (user && user.branch_name ? [user.branch_name] : []);

      const companiesToProcess = activeContext === 'All' ? selectedCompanies : [activeContext || user.company_name];
      let successCount = 0;
      let errorMsgs = [];

      const payload = {
        ...formData,
        branch_names: finalBranchNames,
        company_names: companiesToProcess
      };

      const data = createFormData(payload);
      const headers = {
        'Content-Type': 'multipart/form-data'
      };

      try {
        await axios.post(`${currentBaseUrl}/api/vehicle/management`, data, { headers });
        successCount++;
      } catch (err) {
        errorMsgs.push(`Failed: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setMessage(`Successfully added ${successCount} vehicle entries! ${errorMsgs.length > 0 ? "Errors: " + errorMsgs.join(", ") : ""}`);
        
        if (location.state && location.state.returnTo && errorMsgs.length === 0) {
          navigate(location.state.returnTo, {
            state: {
              newVehicleNumber: formData.vehicle_number,
              preservedState: location.state.preservedState
            }
          });
          return;
        }

        setShowAddModal(false);
        resetForm();
        fetchVehicles(currentBaseUrl);
      } else {
        setError(`Failed to add: ${errorMsgs.join(", ")}`);
      }

      // Check for returnTo state
      if (location.state && location.state.returnTo) {
        navigate(location.state.returnTo, {
          state: {
            newVehicleNumber: formData.vehicle_number,
            preservedState: location.state.preservedState
          }
        });
        return; // Skip the rest as we are navigating away
      }

      setShowAddModal(false);
      resetForm();
      fetchVehicles(currentBaseUrl);
    } catch (err) {
      setError(`Failed to add vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit vehicle
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to edit vehicles.");
      return;
    }
    if (!selectedVehicle) return;
    const currentBaseUrl = baseUrl || '';

    try {
      setLoading(true);
      
      const payload = { ...formData };
      if (!payload.company_names || payload.company_names.length === 0) {
         payload.company_names = selectedVehicle.company_names || [selectedVehicle.company_name];
      }

      const data = createFormData(payload);
      const headers = {
        'Content-Type': 'multipart/form-data'
      };
      
      const endpoint = selectedVehicle.global_ref_id 
          ? `${currentBaseUrl}/api/vehicle/management/bulk/${selectedVehicle.global_ref_id}`
          : `${currentBaseUrl}/api/vehicle/management/${selectedVehicle._id}`;

      await axios.put(endpoint, data, { headers });
      setMessage('Vehicle updated successfully!');
      setShowEditModal(false);
      setSelectedVehicle(null);
      fetchVehicles(currentBaseUrl);
    } catch (err) {
      setError(`Failed to update vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete vehicles.");
      return;
    }
    if (!selectedVehicle) return;
    const currentBaseUrl = baseUrl || '';

    try {
      setLoading(true);
      const headers = {};
      const endpoint = selectedVehicle.global_ref_id 
          ? `${currentBaseUrl}/api/vehicle/management/bulk/${selectedVehicle.global_ref_id}`
          : `${currentBaseUrl}/api/vehicle/management/${selectedVehicle._id}`;
      await axios.delete(endpoint, { headers });
      setMessage('Vehicle deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedVehicle(null);
      fetchVehicles(currentBaseUrl);
    } catch (err) {
      setError(`Failed to delete vehicle: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: '',
      brand: '',
      model: '',
      fuel_type: '',
      is_company_owned: true,
      rc_number: '',
      rc_expiry: '',
      insurance_number: '',
      insurance_expiry: '',
      insurance_doc: null,
      pollution_expiry: '',
      pollution_doc: null,
      status: 'ACTIVE',
      branch_names: [],
    });
  }

  // Helper to resolve branches from any record
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

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
    setError(null);
    setMessage('');
  };

  // Open edit modal
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.company_names && vehicle.company_names.length > 0) {
      setSelectedCompanies(vehicle.company_names);
    } else if (vehicle.company_name) {
      setSelectedCompanies([vehicle.company_name]);
    } else {
      setSelectedCompanies([]);
    }
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_type: vehicle.vehicle_type || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      fuel_type: vehicle.fuel_type || '',
      is_company_owned: vehicle.is_company_owned,
      rc_number: vehicle.rc_number || '',
      rc_expiry: vehicle.rc_expiry ? vehicle.rc_expiry.split('T')[0] : '',
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry ? vehicle.insurance_expiry.split('T')[0] : '',
      insurance_doc: vehicle.insurance_doc || null,
      pollution_expiry: vehicle.pollution_expiry ? vehicle.pollution_expiry.split('T')[0] : '',
      pollution_doc: vehicle.pollution_doc || null,
      status: vehicle.status || 'ACTIVE',
      branch_names: resolveBranches(vehicle),
    });
    setShowEditModal(true);
    setError(null);
    setMessage('');
  };

  // Open delete confirmation
  const openDeleteConfirm = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  // Close modals
  const closeModal = (modal) => {
    if (modal === 'add') setShowAddModal(false);
    if (modal === 'edit') {
      setShowEditModal(false);
      setSelectedVehicle(null);
    }
    if (modal === 'delete') setShowDeleteConfirm(false);
    setError(null);
    setMessage('');
  };

  // Filtered vehicles based on search and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = (vehicle.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (vehicle.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (vehicle.model || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCompany = true;
    if (selectedViewCompany) {
      matchesCompany = vehicle.company_names ? vehicle.company_names.includes(selectedViewCompany) : vehicle.company_name === selectedViewCompany;
    }

    let matchesBranch = true;
    if (selectedBranchFilter) {
      const vBranches = vehicle.branch_names || [];
      matchesBranch = vBranches.includes(selectedBranchFilter) || vehicle.branch_name === selectedBranchFilter;
    }

    return matchesSearch && matchesCompany && matchesBranch;
  });

  // Pagination
  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status badge style
  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: { bg: '#d4edda', color: '#155724' },
      INACTIVE: { bg: '#f8d7da', color: '#721c24' },
      IN_MAINTENANCE: { bg: '#fff3cd', color: '#856404' },
    };
    return colors[status] || colors.ACTIVE;
  };

  const getOwnedBadge = (isCompanyOwned) => {
    return isCompanyOwned ? <><FaBuilding /> Company</> : <><FaUser /> Employee</>;
  };

  // Helper for rendering file link (Text) - Used in Edit Modal fallback
  const renderFileLink = (path, label) => {
    if (!path) return <span style={{ color: '#95a5a6', fontSize: '0.8rem' }}>No file</span>;
    // Use baseUrl || '' here too
    const currentBaseUrl = baseUrl || '';
    return (
      <a href={`${currentBaseUrl}/api/images/${path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3498db', textDecoration: 'none' }}>
        <FaEye /> View {label}
      </a>
    );
  };

  // NEW: Helper for rendering file IMAGE PREVIEW - Used in Table
  const renderFilePreview = (path, label) => {
    if (!path) return <span style={{ color: '#95a5a6', fontSize: '0.8rem' }}>No file</span>;

    const isImage = (fileName) => /\.(jpg|jpeg|png|gif|webp|jfif|ico|svg)$/i.test(fileName);
    const isPdf = (fileName) => /\.pdf$/i.test(fileName);
    const currentBaseUrl = baseUrl || '';

    const previewStyle = {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #dfe6e9',
      cursor: 'pointer',
      backgroundColor: '#f1f2f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      color: '#7f8c8d'
    };

    if (isImage(path)) {
      return (
        <div
          style={previewStyle}
          onClick={() => window.open(`${currentBaseUrl}/api/images/${path}`, '_blank')}
          title={`View ${label}`}
        >
          <img
            src={`${currentBaseUrl}/api/images/${path}`}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              // Fallback to generic icon if image fails
              e.target.parentNode.children[1].style.display = 'block';
            }}
          />
          <FaFileAlt style={{ display: 'none' }} />
        </div>
      );
    } else {
      return (
        <div
          style={previewStyle}
          onClick={() => window.open(`${currentBaseUrl}/api/images/${path}`, '_blank')}
          title={`View ${label}`}
        >
          {isPdf(path) ? <FaFileAlt style={{ color: '#e74c3c' }} /> : <FaFileAlt style={{ color: '#3498db' }} />}
        </div>
      );
    }
  };

  // Common Form Content - UPDATED: No required attributes
  const renderFormContent = () => {
    const currentBaseUrl = baseUrl || '';
    return (
      <>
        
              {/* --- Company and Branch Assignment Section --- */}
              {isCompanyAdmin && (
                <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBuilding style={{ color: '#3b82f6' }} /> Assign to Companies *
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {(companyOptions.length > 0 ? companyOptions : allCompanies).map((comp, idx) => {
                      const isSelected = selectedCompanies.includes(comp);
                      return (
                        <div key={idx} style={{ border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', padding: '10px', borderRadius: '8px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                          if (isSelected) setSelectedCompanies(prev => prev.filter(c => c !== comp));
                          else setSelectedCompanies(prev => [...prev, comp]);
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={isSelected} readOnly style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                            <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.9rem' }}>{comp}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCompanyAdmin && selectedCompanies.length > 0 && formBranches.length > 0 && (
                <div style={{ marginTop: '10px', background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBuilding style={{ color: '#10b981' }} /> Assign to Branches
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {formBranches.map((brName, idx) => {
                      const isSelected = (formData.branch_names || []).includes(brName);
                      return (
                        <div key={idx} style={{ border: isSelected ? '1.5px solid #10b981' : '1.5px solid #e2e8f0', padding: '10px', borderRadius: '8px', backgroundColor: isSelected ? '#ecfdf5' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleBranchToggle(brName)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={isSelected} readOnly style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} />
                            <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '0.9rem' }}>{brName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

        <input type="text"
          name="vehicle_number"
          placeholder="Vehicle Number (e.g., TN60X1234)"
          value={formData.vehicle_number}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <select
          name="vehicle_type"
          value={formData.vehicle_type}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        >
          <option value="">Select Vehicle Type</option>
          <option value="BIKE">BIKE</option>
          <option value="SCOOTER">SCOOTER</option>
          <option value="CAR">CAR</option>
          <option value="VAN">VAN</option>
        </select>
        <input
          type="text"
          name="brand"
          placeholder="Brand (e.g., Honda)"
          value={formData.brand}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <input
          type="text"
          name="model"
          placeholder="Model (e.g., Activa)"
          value={formData.model}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <select
          name="fuel_type"
          value={formData.fuel_type}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        >
          <option value="">Select Fuel Type</option>
          <option value="PETROL">PETROL</option>
          <option value="DIESEL">DIESEL</option>
          <option value="ELECTRIC">ELECTRIC</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            name="is_company_owned"
            checked={formData.is_company_owned}
            onChange={handleInputChange}
            style={{ marginRight: '10px' }}
          />
          Company Owned
        </label>
        <input
          type="text"
          name="rc_number"
          placeholder="RC Number"
          value={formData.rc_number}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>RC Expiry Date:</label>
        <input
          type="date"
          name="rc_expiry"
          value={formData.rc_expiry}
          onChange={handleInputChange}
          onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />

        <input
          type="text"
          name="insurance_number"
          placeholder="Insurance Number"
          value={formData.insurance_number}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Insurance Expiry Date:</label>
        <input
          type="date"
          name="insurance_expiry"
          value={formData.insurance_expiry}
          onChange={handleInputChange}
          onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
          style={{ width: '100%', padding: '10px', marginBottom: '5px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '5px', backgroundColor: '#fafafa' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>
            <FaFileUpload /> Upload Insurance Document
          </label>
          {formData.insurance_doc && typeof formData.insurance_doc === 'string' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              background: '#f1f2f6',
              borderRadius: '5px',
              border: '1px solid #dfe6e9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FaFileAlt style={{ color: '#3498db' }} />
                <a
                  href={`${currentBaseUrl}/api/images/${formData.insurance_doc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: '#2980b9', fontSize: '0.9rem', whiteWhiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
                >
                  View Existing Document
                </a>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, insurance_doc: null, delete_insurance_doc: true })}
                style={{
                  border: 'none',
                  background: '#e74c3c',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaTrash /> Delete
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                name="insurance_doc"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.svg"
                onChange={handleInputChange}
                style={{ width: '100%' }}
              />
              {formData.insurance_doc && typeof formData.insurance_doc === 'object' && (
                <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCheckCircle /> Selected: {formData.insurance_doc.name}
                </div>
              )}
            </>
          )}
        </div>

        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Pollution (PUC) Expiry Date:</label>
        <input
          type="date"
          name="pollution_expiry"
          value={formData.pollution_expiry}
          onChange={handleInputChange}
          onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }}
          style={{ width: '100%', padding: '10px', marginBottom: '5px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        />
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '5px', backgroundColor: '#fafafa' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>
            <FaFileUpload /> Upload Pollution Document
          </label>
          {formData.pollution_doc && typeof formData.pollution_doc === 'string' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              background: '#f1f2f6',
              borderRadius: '5px',
              border: '1px solid #dfe6e9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FaFileAlt style={{ color: '#3498db' }} />
                <a
                  href={`${currentBaseUrl}/api/images/${formData.pollution_doc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: '#2980b9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
                >
                  View Existing Document
                </a>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pollution_doc: null, delete_pollution_doc: true })}
                style={{
                  border: 'none',
                  background: '#e74c3c',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaTrash /> Delete
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                name="pollution_doc"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.svg"
                onChange={handleInputChange}
                style={{ width: '100%' }}
              />
              {formData.pollution_doc && typeof formData.pollution_doc === 'object' && (
                <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCheckCircle /> Selected: {formData.pollution_doc.name}
                </div>
              )}
            </>
          )}
        </div>

        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #bdc3c7', borderRadius: '5px' }}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="IN_MAINTENANCE">IN_MAINTENANCE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </>
    );
  };

  if (loading && vehicles.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa' // Clean background for loading
      }}>
        <div style={{
          textAlign: 'center',
          color: '#3498db',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Custom Spinner */}
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid #e9ecef',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontFamily: 'Segoe UI, sans-serif', fontSize: '1.2rem', color: '#7f8c8d' }}>Loading vehicles...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdminRole = checkIsAdmin(userObj);


  if (!canRead && !isAdminRole && !loading && !configLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <FaExclamationTriangle size={50} style={{ marginBottom: '15px' }} />
          <h2 style={{ marginBottom: '10px' }}>Access Denied</h2>
          <p>You do not have permission to view Vehicle Management.</p>
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Match Employee List Gradient
      padding: '20px',
      position: 'relative',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList */}
      <button
        onClick={() => {
          if (location.state && location.state.returnTo) {
            navigate(location.state.returnTo, { state: { preservedState: location.state.preservedState } });
          } else {
            navigate('/admin');
          }
        }}
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
          borderRadius: '30px',
          fontSize: '15px',
          fontWeight: '600',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        }}
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Container - Like EmployeeList Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with Title and Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f1f2f6'
        }}>
          <div></div> {/* Empty left for balance */}
          <h2 style={{
            textAlign: 'center',
            color: '#2d3436',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <FaCar style={{ color: '#3498db', fontSize: '2rem' }} />
            Vehicle Management ({vehicles.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canCreate && (
              <button
                onClick={openAddModal}
                style={{
                  background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 25px',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(46, 204, 113, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.3)';
                }}
                disabled={loading}
              >
                <FaPlus /> Add New Vehicle
              </button>
            )}
          </div>
        </div>

        {/* Error and Message - Styled like EmployeeList Alerts */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            borderLeft: '5px solid #dc2626',
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
            background: '#dcfce7',
            color: '#16a34a',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            borderLeft: '5px solid #16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaCheck style={{ fontSize: '1.2rem' }} />
            {message}
          </div>
        )}

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', background: '#f8f9fa', padding: '20px', borderRadius: '15px', border: '1px solid #e9ecef' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search Vehicles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #dfe6e9', outline: 'none' }} />
          </div>

          {/* Company Filter for Multi-Tenant Admins */}
          {companyOptions.length > 1 && (
            <div style={{ width: '200px' }}>
              <select
                value={selectedViewCompany}
                onChange={(e) => setSelectedViewCompany(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #28a745', outline: 'none', backgroundColor: '#fff', fontWeight: '500' }}
              >
                <option value="">All Companies</option>
                {companyOptions.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
          )}

          {/* Branch Filter */}
          {((companyOptions.length > 1 && selectedViewCompany) || companyOptions.length <= 1) && !userBranch && (
            <div style={{ width: '200px' }}>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                style={{ padding: '12px 20px', width: '100%', borderRadius: '12px', border: '1px solid #3498db', outline: 'none', background: 'white', fontWeight: '600' }}
              >
                <option value="">All Branches</option>
                {(filterBranches.length > 0 ? filterBranches : availableBranches).map(br => <option key={br} value={br}>{br}</option>)}
              </select>
            </div>
          )}
        </div>


        {/* Vehicles Table - Styled like EmployeeList Table */}
        <div style={{
          overflowX: 'auto',
          borderRadius: '15px',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)',
          border: '1px solid #f1f2f6',
          marginBottom: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', color: '#2d3436' }}>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Vehicle Number</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Type</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Brand</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Model</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Owned</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>RC Expiry</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Insurance</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Pollution</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Status</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Companies</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Branches</th>
                <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #dfe6e9' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentVehicles.length > 0 ? (
                currentVehicles.map((vehicle, index) => (
                  <tr key={vehicle._id} style={{
                    borderBottom: '1px solid #f1f2f6',
                    transition: 'all 0.2s ease',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
                    }}
                  >
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#2c3e50', fontWeight: '600' }}>{vehicle.vehicle_number}</td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72' }}>{vehicle.vehicle_type}</td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72' }}>{vehicle.brand}</td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72' }}>{vehicle.model}</td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: vehicle.is_company_owned ? '#e3f2fd' : '#fce4ec',
                        color: vehicle.is_company_owned ? '#1565c0' : '#c2185b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}>
                        {getOwnedBadge(vehicle.is_company_owned)}
                      </span>
                    </td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72' }}>{vehicle.rc_expiry ? new Date(vehicle.rc_expiry).toLocaleDateString() : 'N/A'}</td>
                    {/* Insurance & Pollution Columns with Image Previews */}
                    <td style={{ padding: '15px', whiteSpace: 'normal', color: '#636e72' }}>
                      <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#2d3436' }}>
                        {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A'}
                      </div>
                      {renderFilePreview(vehicle.insurance_doc, 'Doc')}
                    </td>
                    <td style={{ padding: '15px', whiteSpace: 'normal', color: '#636e72' }}>
                      <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#2d3436' }}>
                        {vehicle.pollution_expiry ? new Date(vehicle.pollution_expiry).toLocaleDateString() : 'N/A'}
                      </div>
                      {renderFilePreview(vehicle.pollution_doc, 'Doc')}
                    </td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', color: '#636e72', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: getStatusBadge(vehicle.status).bg,
                        color: getStatusBadge(vehicle.status).color,
                      }}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {vehicle.company_names && vehicle.company_names.length > 0
                        ? vehicle.company_names.join(', ')
                        : vehicle.company_name || 'N/A'}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {vehicle.branch_names && vehicle.branch_names.length > 0
                        ? vehicle.branch_names.join(', ')
                        : vehicle.branch_name || 'All Branches'}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {canWrite && (
                          <button
                            onClick={() => openEditModal(vehicle)}
                            style={{
                              padding: '8px',
                              background: '#edf2f7',
                              color: '#2b6cb0',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            title="Edit"
                            onMouseOver={(e) => { e.currentTarget.style.background = '#bee3f8'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#edf2f7'; }}
                          >
                            <FaEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => openDeleteConfirm(vehicle)}
                            style={{
                              padding: '8px',
                              background: '#fff5f5',
                              color: '#c53030',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            title="Delete"
                            onMouseOver={(e) => { e.currentTarget.style.background = '#fed7d7'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ padding: '50px', textAlign: 'center', color: '#95a5a6' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <FaCar style={{ fontSize: '3rem', color: '#e0e0e0' }} />
                      <p style={{ margin: 0, fontSize: '1.1rem' }}>{loading ? 'Loading vehicles...' : 'No vehicles found to display.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Styled like EmployeeList */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '8px' }}>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  backgroundColor: currentPage === index + 1 ? '#3498db' : '#f1f2f6',
                  color: currentPage === index + 1 ? 'white' : '#636e72',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: currentPage === index + 1 ? '0 4px 10px rgba(52, 152, 219, 0.3)' : 'none'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal - Styled like EmployeeList Modals */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('add'); }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.3s'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: '#2d3436', borderBottom: '2px solid #f1f2f6', paddingBottom: '15px' }}>
              <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '50%', color: '#27ae60' }}><FaPlus /></div>
              Add New Vehicle
            </h2>
            <form onSubmit={handleAddVehicle}>
              {renderFormContent()}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => closeModal('add')}
                  style={{
                    padding: '12px 25px',
                    background: '#f1f2f6',
                    color: '#636e72',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 25px',
                    background: loading ? '#bdc3c7' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)'
                  }}
                >
                  {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />} Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Styled like EmployeeList Modals */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('edit'); }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.3s'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: '#2d3436', borderBottom: '2px solid #f1f2f6', paddingBottom: '15px' }}>
              <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '50%', color: '#2980b9' }}><FaEdit /></div>
              Edit Vehicle
            </h2>
            <form onSubmit={handleEditVehicle}>
              {renderFormContent()}
              {/* Show Existing Files in Edit Mode */}
              {selectedVehicle && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                  <p style={{ fontWeight: '700', marginBottom: '10px', color: '#2d3436' }}>Current Documents:</p>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#636e72', fontWeight: '600' }}>Insurance:</span>
                      <div style={{ marginTop: '5px' }}>{renderFileLink(selectedVehicle.insurance_doc, 'Insurance')}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#636e72', fontWeight: '600' }}>Pollution:</span>
                      <div style={{ marginTop: '5px' }}>{renderFileLink(selectedVehicle.pollution_doc, 'Pollution')}</div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => closeModal('edit')}
                  style={{
                    padding: '12px 25px',
                    background: '#f1f2f6',
                    color: '#636e72',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 25px',
                    background: loading ? '#bdc3c7' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)'
                  }}
                >
                  {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />} Update Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Styled like EmployeeList */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal('delete'); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            padding: '40px 30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{ width: '80px', height: '80px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <FaExclamationTriangle style={{ fontSize: '2.5rem', color: '#dc2626' }} />
            </div>
            <h3 style={{ color: '#2d3436', marginBottom: '10px', fontSize: '1.5rem', fontWeight: '700' }}>Confirm Deletion</h3>
            <p style={{ color: '#636e72', marginBottom: '30px', lineHeight: '1.5' }}>
              Are you sure you want to delete vehicle <strong>{selectedVehicle?.vehicle_number}</strong>? <br />This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => closeModal('delete')}
                style={{
                  padding: '12px 25px',
                  background: '#f1f2f6',
                  color: '#636e72',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  flex: 1,
                  fontSize: '1rem'
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                disabled={loading}
                style={{
                  padding: '12px 25px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VehicleManagement;
