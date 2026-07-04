import React, { useState, useEffect, useMemo, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import axios from 'axios';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
  FaUtensils, FaPlus, FaTrash, FaEdit, FaSave, FaTimes,
  FaSearch, FaArrowLeft, FaExclamationTriangle, FaCheckCircle,
  FaStore, FaClock, FaCogs, FaUsers, FaMapMarkerAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import CustomerCustomizationModal from './CustomerCustomizationModal';
import './CreateCustomerPage.css';

const AddKitchenPage = () => {
  const { baseUrl, configLoading: contextConfigLoading, getHeaders } = useContext(UserContext);
  // Basic state
  const [kitchenName, setKitchenName] = useState('');
  const [kitchens, setKitchens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('active_branch') || 'All Branches');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(localStorage.getItem('active_company') || 'All Companies');
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);

  // Multi-Company State
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});

  // DocType State
  const [doctypeData, setDoctypeData] = useState(null);
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // UI indicators
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Role and Permission status
  const [isAdmin, setIsAdmin] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [allCompanies, setAllCompanies] = useState([]);

  // Edit/Delete Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [kitchenToEdit, setKitchenToEdit] = useState(null);
  const [editKitchenName, setEditKitchenName] = useState('');
  const [editBranches, setEditBranches] = useState([]);
  const [editCompanies, setEditCompanies] = useState([]);
  const [originalBranch, setOriginalBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kitchenToDelete, setKitchenToDelete] = useState(null);

  const navigate = useNavigate();
  // baseUrl and configLoading are now consumed from UserContext

  // Shared getHeaders is now consumed from UserContext

  // INITIALIZATION: Load user role, permissions, and data
  useEffect(() => {
    const initializePage = async () => {
      console.log("Adding Kitchen Page Initialization Called...");
      try {
        setPageLoading(true);
        const userStr = localStorage.getItem('user');
        console.log("Raw user data from localStorage:", userStr);

        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role || user.UserType || '';
          const company = user.company_name || user.company || '';
          const activeBranch = localStorage.getItem('active_branch');
          const branch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : (user.branch_name || user.branch || "");

          setCompanyName(company);
          setUserBranch(branch);

          const isGroupAdminRole = checkIsGlobalAdmin(user);
          setIsGroupAdmin(isGroupAdminRole);
          const isAdminRole = checkIsAdmin(user);
          const isBA = role.toLowerCase().includes('branch') || role.toLowerCase().includes('manager');

          setIsAdmin(isAdminRole);
          setIsBranchAdmin(isBA);
          console.log(`User Role: ${role}, User Branch: ${branch}, Is Admin? ${isAdminRole}`);

          if (isAdminRole || isGroupAdminRole) {
            fetchCompanies();
          } else {
            const activeContext = localStorage.getItem('active_company');
            setSelectedCompanies([activeContext || company]);
            setSelectedBranch(branch || 'All Branches');
            setSelectedAddBranches(branch ? [branch] : []);
          }

          if (role) {
            const url = `${baseUrl}/api/role-permissions?role=${encodeURIComponent(role)}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];

            const pagePerm = perms.find(p => p.pageId === 'add_kitchen');

            if (isAdminRole || isGroupAdminRole) {
              setCanRead(true);
              setCanWrite(true);
              setCanDelete(true);
            } else if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
            } else {
              setCanRead(false);
            }
          }

          await fetchDoctype();
          await fetchKitchens();
        } else {
          console.error("No user found in localStorage. Please login again.");
          setError("No user authenticated. Please login again.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load user configuration: " + (err.response?.data?.error || err.message));
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [baseUrl, contextConfigLoading]);

  const fetchCompanies = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      
      let comps = [];
      if (userObj.companies && userObj.companies.length > 0) {
        comps = userObj.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
      } else if (userObj.company_name || userObj.company) {
        comps = [userObj.company_name || userObj.company];
      } else {
        const res = await axios.get(`${baseUrl}/api/company-details`, { headers: getHeaders() });
        const details = res.data.companyDetails || [];
        comps = details.map(d => d.restaurantName).filter(n => n);
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : ['POS 8'];
      setCompanyOptions(finalComps);
      setAllCompanies(finalComps);

      // Auto select companies
      const activeContext = localStorage.getItem('active_company');
      if (selectedCompanies.length === 0 && finalComps.length > 0) {
        if (activeContext && activeContext !== 'All' && finalComps.includes(activeContext)) {
          setSelectedCompanies([activeContext]);
        } else if (activeContext === 'All') {
          setSelectedCompanies(finalComps);
        } else if (!activeContext && finalComps.length === 1) {
          setSelectedCompanies([finalComps[0]]);
        }
      }

      // Fetch branches aggressively
      if (finalComps.length > 0) {
        const branchPromises = finalComps.map(comp => 
          axios.get(`${baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: getHeaders(null, comp) })
            .then(res => ({ comp, data: res.data }))
        );
        const results = await Promise.all(branchPromises);
        const newMap = {};
        const allBranches = [];
        results.forEach(res => {
           const branches = res.data.map(b => typeof b === 'string' ? b : b.branch_name || b.branch || b.name || '').filter(b => b);
           newMap[res.comp] = branches;
           allBranches.push(...branches);
        });
        setCompanyBranchesMap(newMap);
        setBranches([...new Set(allBranches)]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchKitchens = async () => {
    try {
      const headers = getHeaders();
      console.log(`Fetching kitchens for company: ${headers['X-Company-Name'] || 'Default'} and branch: ${headers['X-Branch-Name'] || 'All Branches'}...`);
      const response = await axios.get(`${baseUrl}/api/kitchens`, { headers });
      console.log("Kitchens fetched:", response.data);
      setKitchens(response.data);
    } catch (err) {
      console.error('Error fetching kitchens:', err);
    }
  };

  const fetchDoctype = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/doctypes/Kitchen`, { headers: getHeaders() });
      setDoctypeData(response.data);
    } catch (err) {
      console.error("Error fetching kitchen doctype:", err);
    }
  };

  const handleCustomFieldChange = (id, value) => {
    setCustomFieldsData(prev => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const handleStorage = () => {
      setSelectedBranch(localStorage.getItem('active_branch') || 'All Branches');
      setSelectedCompanyFilter(localStorage.getItem('active_company') || 'All Companies');
    };
    window.addEventListener('local-storage-change', handleStorage);
    return () => window.removeEventListener('local-storage-change', handleStorage);
  }, []);

  useEffect(() => {
    if (!contextConfigLoading) {
      fetchKitchens();
    }
  }, [selectedBranch, selectedCompanyFilter, contextConfigLoading]);

  const handleGoBack = () => navigate('/admin');

  const handleSaveKitchen = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError('You do not have permission to add kitchens.');
      return;
    }
    
    // Validate required custom fields instead of hard-coded kitchen name
    let hasError = false;
    doctypeData?.fields?.filter(f => !f.is_default && f.mandatory && !f.hidden).forEach(f => {
      if (!customFieldsData[f.id]) {
        hasError = true;
        setError(`${f.label} is required`);
      }
    });
    if (hasError) return;

    const kitchenPayload = {
      kitchen_name: customFieldsData.kitchen_name || customFieldsData.name || customFieldsData.kitchen || `Kitchen-${Date.now()}`,
      company_name: isAdmin ? (selectedCompanies.length > 0 ? selectedCompanies : ['All Companies']) : companyName,
      branch_name: userBranch !== 'All Branches' ? userBranch : (isAdmin ? (selectedAddBranches.length > 0 ? selectedAddBranches : ['All Branches']) : 'All Branches'),
      ...customFieldsData
    };

    const activeContext = localStorage.getItem('active_company');
    const validBranches = (isAdmin || isGroupAdmin)
      ? selectedAddBranches.filter(b => b && b.trim() !== "")
      : (userBranch ? [userBranch] : []);

    if (!showAssignmentModal && (showCompanyAssign || showBranchAssign)) {
      setShowAssignmentModal(true);
      return;
    }

    if (showAssignmentModal && showCompanyAssign && selectedCompanies.length === 0) {
      setError("Please select at least one company.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    let successCount = 0;
    let errorsMsgs = [];

    try {
      const companiesToProcess = activeContext === 'All' ? selectedCompanies : [activeContext || companyName];
      const branchesToProcess = validBranches.length > 0 ? validBranches : [""];

      // Process with a unified payload using arrays for multi-tenancy
      const payload = {
        ...kitchenPayload,
        company_names: companiesToProcess.length > 0 ? companiesToProcess : undefined,
        branch_names: branchesToProcess.filter(b => b).length > 0 ? branchesToProcess.filter(b => b) : undefined,
        company_name: companiesToProcess[0] || "",
        branch_name: branchesToProcess[0] || ""
      };

      try {
        const headers = getHeaders();
        if (companiesToProcess.length > 0) headers['X-Company-Name'] = companiesToProcess[0];

        await axios.post(`${baseUrl}/api/kitchens`, payload, { headers });
        successCount = 1;
      } catch (err) {
        errorsMsgs.push(`Global/Primary: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setMessage(`Successfully added kitchen.`);
        setCustomFieldsData({});
        if (isAdmin) setSelectedAddBranches([]);
        fetchKitchens();
      } else {
        setError(`Failed: ${errorsMsgs.join(", ")}`);
      }
    } catch (err) {
      console.error("Critical error saving kitchens:", err);
      setError('An unexpected error occurred while saving.');
    } finally {
      setLoading(false);
      setShowAssignmentModal(false);
      setShowAddModal(false);
    }
  };

  const handleDeleteKitchen = async (kitchenId) => {
    try {
      console.log(`Deleting kitchen with ID: ${kitchenId}`);
      setLoading(true);
      setError(null);
      setMessage('');
      const response = await axios.delete(`${baseUrl}/api/kitchens/${kitchenId}`, { headers: getHeaders() });
      setMessage(response.data.message);
      fetchKitchens();
    } catch (err) {
      console.error("Delete failed:", err);
      setError(`Failed to delete kitchen: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setKitchenToDelete(null);
    }
  };

  const handleUpdateKitchen = async (e) => {
    e.preventDefault();

    const validEditBranches = (isAdmin || isGroupAdmin)
      ? editBranches.filter(b => b && b.trim() !== "")
      : (userBranch ? [userBranch] : []);

    try {
      setLoading(true);
      setError(null);

      const comp = kitchenToEdit.company_name || kitchenToEdit.company || "";
      const b = kitchenToEdit.branch_names || kitchenToEdit.branch_name || [];
      const existingBranches = Array.isArray(b) ? [...b] : (b ? b.split(',').map(s => s.trim()) : []);

      const kitchenPayload = {
        kitchen_name: customFieldsData.kitchen_name || customFieldsData.name || customFieldsData.kitchen || `Kitchen-${Date.now()}`,
        branch_names: validEditBranches.length > 0 ? validEditBranches : undefined,
        branch_name: validEditBranches.length > 0 ? validEditBranches[0] : "",
        company_names: [comp],
        company_name: comp,
        ...customFieldsData
      };

      const headerBranch = originalBranch || kitchenToEdit.branch_name;
      const baseUrlFull = baseUrl || '';
      let successCount = 0;

      // Update original record via PUT
      const putUrl = kitchenToEdit.global_ref_id ? `${baseUrlFull}/api/kitchens/bulk/${kitchenToEdit.global_ref_id}` : `${baseUrlFull}/api/kitchens/${kitchenToEdit._id}`;
      await axios.put(putUrl, kitchenPayload, { headers: getHeaders(headerBranch) });
      successCount++;

      // Clone to newly checked branches
      const newBranches = validEditBranches.filter(b => !existingBranches.includes(b));
      if (newBranches.length > 0) {
        try {
          const newBranchPayload = { ...kitchenPayload, branch_names: newBranches, branch_name: newBranches[0] };
          await axios.post(`${baseUrlFull}/api/kitchens`, newBranchPayload, { 
            headers: { ...getHeaders(headerBranch), 'X-Company-Name': comp } 
          });
          successCount++;
        } catch (err) {
          console.warn(`Failed to create new branch records:`, err);
        }
      }

      // Delete if the user unchecked the branch they are currently editing
      const removedBranches = existingBranches.filter(b => !validEditBranches.includes(b));
      if (removedBranches.includes(kitchenToEdit.branch_name || kitchenToEdit.branch || 'All Branches')) {
        try {
          await axios.delete(`${baseUrlFull}/api/kitchens/${kitchenToEdit._id}`, { headers: getHeaders(headerBranch) });
        } catch (err) {
          console.warn(`Failed to delete unchecked branch record:`, err);
        }
      }

      setMessage(`Update processed successfully (${successCount} updates)`);
      setShowEditModal(false);
      fetchKitchens();
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.response?.data?.error || 'Failed to update kitchen');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (kitchen) => {
    setKitchenToEdit(kitchen);
    const b = kitchen.branch_names || kitchen.branch_name || [];
    const initialBranches = Array.isArray(b) ? [...b] : (b ? b.split(',').map(s => s.trim()) : []);
    setEditBranches(initialBranches);
    
    const comps = kitchen.company_names || kitchen.company_name || [];
    const initialComps = Array.isArray(comps) ? [...comps] : (comps ? comps.split(',').map(s => s.trim()) : []);
    setEditCompanies(initialComps);

    const customFields = {};
    if (doctypeData && doctypeData.fields) {
      doctypeData.fields.forEach(f => {
        customFields[f.id] = kitchen[f.id] || '';
      });
    }
    setCustomFieldsData(customFields);

    setOriginalBranch(initialBranches[0] || null);
    setShowEditModal(true);
  };

  const openDeleteModal = (id) => {
    setKitchenToDelete(id);
    setShowDeleteModal(true);
  };

  const filteredKitchens = useMemo(() => {
    if (!Array.isArray(kitchens)) return [];

    const searched = kitchens.filter(kitchen =>
      (kitchen.kitchen_name && kitchen.kitchen_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (kitchen.kitchen_value && kitchen.kitchen_value.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const specificAssignments = new Set();
    searched.forEach(k => {
      const kName = (k.kitchen_name || "").toString().toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
      const compRaw = Array.isArray(k.company_names) && k.company_names.length > 0 ? k.company_names[0] : (Array.isArray(k.company_name) ? k.company_name[0] : k.company_name || k.company || "");
      const comp = compRaw.toString().toLowerCase().trim();
      if (comp !== 'all' && comp !== 'global' && comp !== '') {
        specificAssignments.add(kName);
      }
    });

    return searched.filter(k => {
      const kName = (k.kitchen_name || "").toString().toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
      const compRaw = Array.isArray(k.company_names) && k.company_names.length > 0 ? k.company_names[0] : (Array.isArray(k.company_name) ? k.company_name[0] : k.company_name || k.company || "");
      const comp = compRaw.toString().toLowerCase().trim();
      const kBranchRaw = k.branch_name || k.branch || "Global Access";
      const kBranches = Array.isArray(kBranchRaw) ? kBranchRaw : kBranchRaw.split(',').map(b => b.trim());

      const isGlobal = comp === 'all' || comp === 'global' || comp === '';
      if (isGlobal && specificAssignments.has(kName)) {
        return false;
      }

      // STRICT UI FILTERING (Company)
      const activeComp = (selectedCompanyFilter || "All Companies").toLowerCase().trim();
      const compMatch = activeComp === 'all companies' || activeComp === 'all' || comp === 'all' || comp === 'global' || comp === activeComp;
      if (!compMatch) return false;

      // STRICT UI FILTERING (Branch)
      const activeBranch = (selectedBranch || "All Branches").toLowerCase().trim();
      const branchMatch = activeBranch === 'all branches' || activeBranch === 'all' || kBranches.some(b => {
        const bl = b.toLowerCase().trim();
        return bl === activeBranch;
      });
      if (!branchMatch) return false;

      return true;
    });
  }, [kitchens, searchTerm, selectedCompanyFilter, selectedBranch]);

  const handleAddBranchToggle = (branchName) => {
    setSelectedAddBranches(prev =>
      prev.includes(branchName)
        ? prev.filter(b => b !== branchName)
        : [...prev, branchName]
    );
  };

  const handleEditBranchToggle = (branchName) => {
    setEditBranches(prev =>
      prev.includes(branchName)
        ? prev.filter(b => b !== branchName)
        : [...prev, branchName]
    );
  };

  const availableBranches = useMemo(() => {
    if (selectedCompanies.length === 0) return branches;
    let bList = [];
    selectedCompanies.forEach(c => {
      if (companyBranchesMap[c]) bList.push(...companyBranchesMap[c]);
    });
    return [...new Set(bList)];
  }, [selectedCompanies, branches, companyBranchesMap]);

  const editAvailableBranches = useMemo(() => {
    if (!kitchenToEdit) return [];
    const comp = kitchenToEdit.company_name || kitchenToEdit.company || "";
    return companyBranchesMap[comp] ? [...companyBranchesMap[comp]] : [];
  }, [kitchenToEdit, companyBranchesMap]);
  const uniqueEditAvailableBranches = [...new Set(editAvailableBranches)];

  if (contextConfigLoading) {
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
          <FaClock className="fa-spin" style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading Configuration...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isAdmin && !pageLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1a202c', color: 'white', padding: '20px' }}>
        <FaExclamationTriangle style={{ fontSize: '4rem', color: '#f56565', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: '#a0aec0' }}>You do not have permission to view the Kitchen Management module. (Role: {isAdmin ? 'Admin' : 'Regular User'})</p>
        <button onClick={handleGoBack} style={{ marginTop: '30px', padding: '10px 25px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          Go Back
        </button>
      </div>
    );
  }

  const activeCompanyLocal = (localStorage.getItem('active_company') || 'All').trim();
  const isSpecificCompanyActive = activeCompanyLocal.toLowerCase() !== 'all companies' && activeCompanyLocal.toLowerCase() !== 'all' && activeCompanyLocal.toLowerCase() !== 'global' && activeCompanyLocal !== '';
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  
  const showCompanyAssign = (isGroupAdmin || isAdmin) && companyOptions.length > 1 && !isSpecificCompanyActive && !isSpecificBranchActive;
  const showBranchAssign = (isGroupAdmin || isAdmin) && !isSpecificBranchActive && selectedCompanies.length > 0 && availableBranches.length > 0;
  
  const showEditCompanyAssign = false; // Disable company reassignment in edit modal
  const showEditBranchAssign = (isGroupAdmin || isAdmin) && !isSpecificBranchActive && uniqueEditAvailableBranches.length > 0;

  return (
    <div className="create-customer-container main-customer-page">
      <div className="customer-header-section">
        <div className="header-left">
          <button onClick={handleGoBack} className="header-back-btn" disabled={loading}>
            <FaArrowLeft /> Back to Admin
          </button>
        </div>

        <div className="header-center">
          <h1>Kitchen Management</h1>
        </div>

        <div className="header-right">
          <div className="header-actions">
            {showCompanyAssign && (
              <button 
                type="button"
                className="customize-btn" 
                onClick={() => setShowAssignmentModal(true)} 
                style={{ 
                  background: '#eff6ff', 
                  color: '#3b82f6', 
                  border: '1.5px solid #dbeafe', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '0 24px', 
                  height: '48px', 
                  minWidth: '140px', 
                  borderRadius: '14px', 
                  fontWeight: '700', 
                  fontSize: '15px', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease', 
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' 
                }}
              >
                <FaUsers /> Company
              </button>
            )}

            {showBranchAssign && (
              <button 
                type="button"
                className="customize-btn branch-btn" 
                onClick={() => setShowAssignmentModal(true)}
                style={{
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1.5px solid #ffedd5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 24px',
                  height: '48px',
                  minWidth: '140px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1)'
                }}
              >
                <FaMapMarkerAlt /> Branches
              </button>
            )}

            <button 
              type="button"
              className="customize-btn" 
              onClick={(e) => { e.preventDefault(); setShowCustomizeModal(true); }}
              style={{
                background: 'rgb(46, 204, 113)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '48px',
                minWidth: '140px',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(46, 204, 113, 0.2)'
              }}
            >
              <FaCogs /> Customize
            </button>
            {canWrite && (
              <button className="save-btn" onClick={handleSaveKitchen} disabled={loading}>
                {loading ? "Adding..." : <><FaPlus /> Add Kitchen</>}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="header-divider"></div>

      {showAssignmentModal && (
        <div className="add-modal-overlay">
          <div className="add-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span>Kitchen Assignments</span>
              <button className="close-modal-btn" onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body" style={{ marginTop: '20px' }}>
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6' }}><FaUsers /> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedCompanies.includes(comp)} 
                          onChange={(e) => { 
                            setSelectedCompanies(prev => e.target.checked ? [...prev, comp] : prev.filter(c => c !== comp)); 
                          }} 
                          style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} 
                        />
                        {comp}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showBranchAssign && (
                <div className="assignment-card" style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                  <h4 style={{ color: '#10b981', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}><FaMapMarkerAlt /> Select Branches</h4>
                  <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {availableBranches.map((branchName, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedAddBranches.includes(branchName)} 
                          onChange={(e) => { 
                            setSelectedAddBranches(prev => e.target.checked ? [...prev, branchName] : prev.filter(b => b !== branchName)); 
                          }} 
                          style={{ width: '18px', height: '18px', accentColor: '#10b981' }} 
                        />
                        {branchName}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={handleSaveKitchen} disabled={loading || (localStorage.getItem('active_company') === 'All' && selectedCompanies.length === 0)}>
                {loading ? "Adding..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="customer-scroll-body">
        <div className="form-sections-wrapper" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>

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

        <form onSubmit={handleSaveKitchen} style={{ marginBottom: '30px' }}>
          <div className="form-section-card theme-blue">
            <div className="section-header">
              <div className="section-icon"><FaUtensils /></div>
              <h2>Add Kitchen</h2>
            </div>
            <div className="form-grid" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: (isAdmin || (doctypeData && doctypeData.fields && doctypeData.fields.filter(f => !f.hidden).length > 0)) ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Dynamic Custom Fields */}
            {doctypeData && doctypeData.fields && doctypeData.fields.map(field => {
              if (field.hidden === true) return null;

              return (
                <div key={field.id}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                    {field.label}
                    {field.mandatory && <span style={{ color: '#e74c3c' }}> *</span>}
                  </label>
                  <div style={{ width: '100%' }}>
                    {field.type === 'Check' ? (
                      <input
                        type="checkbox"
                        checked={customFieldsData[field.id] || false}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                        style={{ width: '20px', height: '20px' }}
                      />
                    ) : field.type === 'Select' ? (
                      field.allow_create_new ? (
                        <CreatableSelect
                          placeholder={`Select or type to create ${field.label}...`}
                          options={
                            (field.options && field.options.trim())
                              ? field.options.split('\n').map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                              : ((field.link_doctype && field.link_doctype.trim())
                                ? field.link_doctype.split(/[\n,]+/).map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                : [])
                          }
                          value={customFieldsData[field.id] ? { value: customFieldsData[field.id], label: customFieldsData[field.id] } : null}
                          onChange={(selected) => handleCustomFieldChange(field.id, selected ? selected.value : '')}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            })
                          }}
                        />
                      ) : (
                        <Select
                          placeholder={`Select ${field.label}...`}
                          options={
                            (field.options && field.options.trim())
                              ? field.options.split('\n').map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                              : ((field.link_doctype && field.link_doctype.trim())
                                ? field.link_doctype.split(/[\n,]+/).map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                : [])
                          }
                          value={customFieldsData[field.id] ? { value: customFieldsData[field.id], label: customFieldsData[field.id] } : null}
                          onChange={(selected) => handleCustomFieldChange(field.id, selected ? selected.value : '')}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            })
                          }}
                        />
                      )
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #bfdbfe'
                      }}>
                        <input
                          type={field.type === 'Number' ? 'number' : 'text'}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label}`}
                          required={field.mandatory}
                          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#2c3e50' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          </div>
        </form>


        <div className="form-section-card theme-green" style={{ marginTop: '20px' }}>
          <div className="section-header">
            <div className="section-icon"><FaUtensils /></div>
            <h2>Active Kitchens ({filteredKitchens.length})</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {/* Branch/Company Filter: Only visible for Group Admins in 'All' mode or if multiple branches are available */}
              {((localStorage.getItem('active_company') === 'All' && isAdmin) || (branches.length > 1)) && (
                localStorage.getItem('active_company') === 'All' ? (
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCompanyFilter(val);
                      localStorage.setItem('active_company', val);
                      window.dispatchEvent(new Event('local-storage-change'));
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '15px',
                      border: '1px solid #3498db',
                      color: '#3498db',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  >
                    <option value="All Companies">All Companies</option>
                    {companyOptions.map((comp, idx) => <option key={idx} value={comp}>{comp}</option>)}
                  </select>
                ) : (
                  isAdmin && (
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBranch(val);
                        localStorage.setItem('active_branch', val);
                        window.dispatchEvent(new Event('local-storage-change'));
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '15px',
                        border: '1px solid #3498db',
                        color: '#3498db',
                        outline: 'none',
                        fontWeight: '600'
                      }}
                    >
                      <option value="All Branches">All Branches</option>
                      {branches.map((branchName, idx) => <option key={idx} value={branchName}>{branchName}</option>)}
                    </select>
                  )
                )
              )}
            </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8f9fa',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #e9ecef',
            marginBottom: '15px'
          }}>
            <FaSearch style={{ color: '#7f8c8d' }} />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#2c3e50' }}
            />
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e9ecef',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredKitchens.length === 0 ? (
                <li style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No Kitchen Stations Cataloged Yet.</li>
              ) : (
                filteredKitchens.map((kitchen, index) => (
                  <li
                    key={kitchen._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px 20px',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      borderBottom: index === filteredKitchens.length - 1 ? 'none' : '1px solid #e9ecef'
                    }}
                  >
                    <div>
                      <span style={{ color: '#2c3e50', fontWeight: '500', display: 'block' }}>
                        {kitchen.kitchen_name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {doctypeData?.fields?.filter(f => !f.is_default && !f.hidden).map(f => (
                          <small key={f.id} style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            | {f.label}: {kitchen[f.id] || 'N/A'}
                          </small>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <small style={{ color: '#3498db', fontSize: '0.75rem', fontWeight: '600' }}>
                          Company: {kitchen.company_name || 'All'}
                        </small>
                        {isAdmin && (
                          <small style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>
                            | Branch: {Array.isArray(kitchen.branch_name) ? kitchen.branch_name.join(', ') : (kitchen.branch_name || 'Global Access')}
                          </small>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => openEditModal(kitchen)}
                        disabled={loading}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(241, 196, 15, 0.3)'
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openDeleteModal(kitchen._id)}
                        disabled={loading}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          </div>
        </div>
        </div>
      </div>

      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px',
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit style={{ color: '#f1c40f' }} /> Edit Kitchen Details
              </h3>
              <FaTimes onClick={() => setShowEditModal(false)} style={{ cursor: 'pointer', color: '#7f8c8d' }} />
            </div>
            <form onSubmit={handleUpdateKitchen}>
              {/* Dynamic Custom Fields for Edit Modal */}
              {doctypeData && doctypeData.fields && doctypeData.fields.map(field => {
                if (field.hidden === true) return null;

                return (
                  <div key={field.id} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>
                      {field.label}
                      {field.mandatory && <span style={{ color: '#e74c3c' }}> *</span>}
                    </label>
                    <div style={{ width: '100%' }}>
                      {field.type === 'Check' ? (
                        <input
                          type="checkbox"
                          checked={customFieldsData[field.id] || false}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                          style={{ width: '20px', height: '20px' }}
                        />
                      ) : field.type === 'Select' ? (
                        field.allow_create_new ? (
                          <CreatableSelect
                            placeholder={`Select or type to create ${field.label}...`}
                            options={
                              (field.options && field.options.trim())
                                ? field.options.split('\n').map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                : ((field.link_doctype && field.link_doctype.trim())
                                  ? field.link_doctype.split(/[\n,]+/).map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                  : [])
                            }
                            value={customFieldsData[field.id] ? { value: customFieldsData[field.id], label: customFieldsData[field.id] } : null}
                            onChange={(selected) => handleCustomFieldChange(field.id, selected ? selected.value : '')}
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: '10px',
                                borderColor: '#bfdbfe',
                                backgroundColor: '#f8fafc',
                                boxShadow: 'none',
                                '&:hover': { borderColor: '#3b82f6' }
                              })
                            }}
                          />
                        ) : (
                          <Select
                            placeholder={`Select ${field.label}...`}
                            options={
                              (field.options && field.options.trim())
                                ? field.options.split('\n').map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                : ((field.link_doctype && field.link_doctype.trim())
                                  ? field.link_doctype.split(/[\n,]+/).map(opt => ({ value: opt.trim(), label: opt.trim() })).filter(o => o.value)
                                  : [])
                            }
                            value={customFieldsData[field.id] ? { value: customFieldsData[field.id], label: customFieldsData[field.id] } : null}
                            onChange={(selected) => handleCustomFieldChange(field.id, selected ? selected.value : '')}
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: '10px',
                                borderColor: '#bfdbfe',
                                backgroundColor: '#f8fafc',
                                boxShadow: 'none',
                                '&:hover': { borderColor: '#3b82f6' }
                              })
                            }}
                          />
                        )
                      ) : (
                        <input
                          type={field.type === 'Number' ? 'number' : 'text'}
                          value={customFieldsData[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label}`}
                          required={field.mandatory}
                          style={{
                            width: '100%', padding: '12px', borderRadius: '10px',
                            border: '1px solid #e9ecef', background: '#f8f9fa', outline: 'none'
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {showEditCompanyAssign && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Assign to Company *</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    backgroundColor: '#f8f9fa',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef',
                    maxHeight: '100px',
                    overflowY: 'auto'
                  }}>
                    {companyOptions.map((comp, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={editCompanies.includes(comp)}
                          onChange={() => {
                            setEditCompanies(prev =>
                              prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
                            );
                          }}
                          id={`edit-comp-${idx}`}
                        />
                        <label htmlFor={`edit-comp-${idx}`} style={{ fontSize: '0.85rem', color: '#2c3e50', cursor: 'pointer' }}>{comp}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showEditBranchAssign && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Branch Access</label>
                  <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {uniqueEditAvailableBranches.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input
                          type="checkbox"
                          id={`edit-branch-${i}`}
                          checked={editBranches.includes(b)}
                          onChange={(e) => {
                            if (e.target.checked) setEditBranches(prev => [...prev, b]);
                            else setEditBranches(prev => prev.filter(branch => branch !== b));
                          }}
                        />
                        <label htmlFor={`edit-branch-${i}`} style={{ fontSize: '0.9rem', color: '#2c3e50', cursor: 'pointer' }}>
                          {b}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, padding: '12px', background: '#27ae60', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  {loading ? 'Updating...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1, padding: '12px', background: '#7f8c8d', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div style={{
            backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px',
            width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #e9ecef'
          }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontWeight: '800' }}>Confirm Delete</h3>
            <p style={{ color: '#2c3e50', marginBottom: '25px' }}>Are you sure you want to delete this kitchen station? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleDeleteKitchen(kitchenToDelete)}
                disabled={loading}
                style={{
                  padding: '10px 20px', background: '#e74c3c', color: 'white',
                  border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 20px', background: '#3498db', color: 'white',
                  border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600'
                }}
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
        onRefresh={() => window.location.reload()}
        targetDocType="Kitchen"
      />
    </div>
  );
};

export default AddKitchenPage;
