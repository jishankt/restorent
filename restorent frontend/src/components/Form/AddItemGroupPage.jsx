import React, { useState, useEffect, useMemo, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import { FaArrowLeft, FaBox, FaTrash, FaCheckCircle, FaExclamationTriangle, FaSearch, FaEdit, FaTimes, FaCogs, FaSave, FaPlus, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import CustomerCustomizationModal from './CustomerCustomizationModal';
import './CreateCustomerPage.css';

function AddItemGroupPage() {
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ group_name: '' });
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  // baseUrl is now consumed from UserContext

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editBranches, setEditBranches] = useState([]);
  const [editCompanies, setEditCompanies] = useState([]);
  
  // Multi-Company State
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});

  // Branch and Role State
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(localStorage.getItem('active_branch') || 'All Branches');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(localStorage.getItem('active_company') || 'All Companies');
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [editCustomFieldsData, setEditCustomFieldsData] = useState({});

  // DocType State
  const [doctypeData, setDoctypeData] = useState(null);

  // Shared getHeaders is now consumed from UserContext

  // Detect role and fetch branches
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const activeBranch = localStorage.getItem('active_branch');
      const branch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : (user.branch_name || user.branch || "");
      const company = user.company_name || user.company || "";
      setUserBranch(branch);
      setCompanyName(company);
      
      const roleLower = user.role?.toLowerCase() || '';
      const isGroupAdminRole = checkIsGlobalAdmin(user);
      const isAdminRole = checkIsAdmin(user);
      const isBA = roleLower.includes('branch') || roleLower.includes('manager');
      
      setIsCompanyAdmin(isAdminRole);
      setIsGroupAdmin(isGroupAdminRole);
      setIsBranchAdmin(isBA);
      
      if (isAdminRole || isGroupAdminRole) {
        fetchCompanies();
      } else {
        const activeContext = localStorage.getItem('active_company');
        setSelectedCompanies([activeContext || company]);
        setSelectedBranchFilter(branch || 'All Branches');
        setSelectedAddBranches(branch ? [branch] : []);
      }
    }
  }, []);

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
        try {
          const res = await axios.get(`${baseUrl}/api/companies-public`);
          const details = res.data || [];
          comps = details.map(d => d.company_name).filter(n => n);
        } catch (e) {
          const res = await axios.get(`${baseUrl}/api/company-details`, { headers: getHeaders() });
          const details = res.data.companyDetails || [];
          comps = details.map(d => d.restaurantName).filter(n => n);
        }
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : ['POS 8'];
      setCompanyOptions(finalComps);

      // Auto select companies
      const activeContext = localStorage.getItem('active_company');
      if (selectedCompanies.length === 0 && finalComps.length > 0) {
        if (activeContext && activeContext !== 'All' && finalComps.includes(activeContext)) {
          setSelectedCompanies([activeContext]);
        } else if (activeContext === 'All') {
          // DO NOT auto-select all. Leave empty so popup shows.
          setSelectedCompanies([]);
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
        setAvailableBranches([...new Set(allBranches)]);
      }
    } catch (e) { console.error(e); }
  };

  // Fetch Permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role;
          if (role) {
            const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${role}` : `/api/role-permissions?role=${role}`;
            const response = await axios.get(url);
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'add_item_group');
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
    fetchPermissions();
    fetchDoctype();
  }, [baseUrl]);

  const fetchDoctype = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/doctypes/Item%20Group`, { headers: getHeaders() });
      setDoctypeData(response.data);
    } catch (err) {
      console.error("Error fetching Item Group doctype:", err);
    }
  };

  const getFieldHidden = (id, defaultValue = false) => {
    if (!doctypeData || !doctypeData.fields) return defaultValue;
    const field = doctypeData.fields.find(f => f.id === id);
    return field ? field.hidden : defaultValue;
  };

  // baseUrl and config are now managed by UserContext

  // Fetch existing item groups when baseUrl or selectedBranch changes
  useEffect(() => {
    const handleStorage = () => {
      setSelectedBranchFilter(localStorage.getItem('active_branch') || 'All Branches');
      setSelectedCompanyFilter(localStorage.getItem('active_company') || 'All Companies');
    };
    window.addEventListener('local-storage-change', handleStorage);
    return () => window.removeEventListener('local-storage-change', handleStorage);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [selectedBranchFilter, selectedCompanyFilter, getHeaders]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    
    // Step 1: Filter by search term
    const searched = groups.filter(group =>
      group.group_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Step 2: Precedence Logic - Identify Groups with specific company assignments
    const specificAssignments = new Set();
    searched.forEach(g => {
      const gName = (g.group_name || "").toString().toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
      const compRaw = Array.isArray(g.company_names) && g.company_names.length > 0 ? g.company_names[0] : (Array.isArray(g.company_name) ? g.company_name[0] : g.company_name || g.company || "");
      const comp = compRaw.toString().toLowerCase().trim();
      if (comp !== 'all' && comp !== 'global' && comp !== '') {
        specificAssignments.add(gName);
      }
    });

    // Step 3: Final Filter - Hide "All/Global" if specific version exists
    return searched.filter(g => {
      const gName = (g.group_name || "").toString().toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
      const compRaw = Array.isArray(g.company_names) && g.company_names.length > 0 ? g.company_names[0] : (Array.isArray(g.company_name) ? g.company_name[0] : g.company_name || g.company || "");
      const comp = compRaw.toString().toLowerCase().trim();
      const gBranchRaw = g.branch_name || g.branch || "Global Access";
      const gBranches = Array.isArray(gBranchRaw) ? gBranchRaw : gBranchRaw.split(',').map(b => b.trim());
      
      const isGlobal = comp === 'all' || comp === 'global' || comp === '';
      if (isGlobal && specificAssignments.has(gName)) {
        return false; // Specific version takes precedence
      }

      // STRICT UI FILTERING (Company)
      const activeComp = (selectedCompanyFilter || "All Companies").toLowerCase().trim();
      const compMatch = activeComp === 'all companies' || activeComp === 'all' || comp === 'all' || comp === 'global' || comp === activeComp;
      if (!compMatch) return false;

      // STRICT UI FILTERING (Branch)
      const activeBranch = (selectedBranchFilter || "All Branches").toLowerCase().trim();
      const branchMatch = activeBranch === 'all branches' || activeBranch === 'all' || gBranches.some(b => {
        const bl = b.toLowerCase().trim();
        return bl === activeBranch;
      });
      if (!branchMatch) return false;

      return true;
    });
  }, [groups, searchTerm, selectedCompanyFilter, selectedBranchFilter]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const url = baseUrl ? `${baseUrl}/api/item-groups` : '/api/item-groups';
      const response = await axios.get(url, { headers: getHeaders() });
      setGroups(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch item groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigate('/admin');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (id, value, isEdit = false) => {
    if (isEdit) {
      setEditCustomFieldsData(prev => ({ ...prev, [id]: value }));
    } else {
      setCustomFieldsData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAddBranchToggle = (branchName) => {
    setSelectedAddBranches(prev => 
      prev.includes(branchName) 
        ? prev.filter(b => b !== branchName)
        : [...prev, branchName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to add item groups.");
      return;
    }

    const activeContext = localStorage.getItem('active_company');
    if (activeContext === 'All' && selectedCompanies.length === 0) {
      setShowAssignmentModal(true);
      return;
    }

    const validBranches = isCompanyAdmin 
      ? selectedAddBranches.filter(b => b && b.trim() !== "")
      : (userBranch ? [userBranch] : []);

    const groupPayload = { 
      group_name: customFieldsData.group_name || customFieldsData.ITEM_GROUP || customFieldsData.item_group || customFieldsData.name || customFieldsData.group || `Group-${Date.now()}`,
      ...customFieldsData 
    };

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    let successCount = 0;
    let errorsMsgs = [];

    try {
      const companiesToProcess = activeContext === 'All' ? selectedCompanies : [activeContext || companyName];
      const branchesToProcess = validBranches.length > 0 ? validBranches : [""];

      // Process with a unified payload using arrays for multi-tenancy
      const payload = {
        ...groupPayload,
        company_names: companiesToProcess.length > 0 ? companiesToProcess : undefined,
        branch_names: branchesToProcess.filter(b => b).length > 0 ? branchesToProcess.filter(b => b) : undefined,
        company_name: companiesToProcess[0] || "",
        branch_name: branchesToProcess[0] || ""
      };

      try {
        const headers = getHeaders();
        if (companiesToProcess.length > 0) headers['X-Company-Name'] = companiesToProcess[0];
        
        await axios.post(baseUrl ? `${baseUrl}/api/item-groups` : '/api/item-groups', payload, { headers });
        successCount = 1;
      } catch (err) {
        errorsMsgs.push(`Global/Primary: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setSuccess(`Successfully added item group.`);
        setFormData({ group_name: '' });
        setCustomFieldsData({});
        if (isCompanyAdmin) setSelectedAddBranches([]);
        fetchGroups();
      } else {
        setError(`Failed: ${errorsMsgs.join(", ")}`);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
      setShowAssignmentModal(false);
    }
  };

  const handleDelete = async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      const groupToDel = groups.find(g => g._id === groupId);
      const url = baseUrl ? (groupToDel?.global_ref_id ? `${baseUrl}/api/item-groups/bulk/${groupToDel.global_ref_id}` : `${baseUrl}/api/item-groups/${groupId}`) : `/api/item-groups/${groupId}`;
      await axios.delete(url, { headers: getHeaders() });
      setSuccess('Item group deleted successfully');
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item group');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setGroupToDelete(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Validation handled by custom fields now

    const validEditBranches = isCompanyAdmin 
      ? editBranches.filter(b => b && b.trim() !== "")
      : (userBranch ? [userBranch] : []);

    try {
      setLoading(true);
      setError(null);
      const originalCompany = (groupToEdit.company_name || groupToEdit.company || "").toString().trim().toLowerCase();
      const isMigratingFromGlobal = originalCompany === "all" || originalCompany === "global" || originalCompany === "";
      
      const headerBranch = groupToEdit.branch_name || userBranch;
      const baseUrlFull = baseUrl || '';
      
      let successCount = 0;
      let errors = [];

      const comp = groupToEdit.company_name || groupToEdit.company || "";
      const b = groupToEdit.branch_names || groupToEdit.branch_name || [];
      const existingBranches = Array.isArray(b) ? [...b] : (b ? b.split(',').map(s => s.trim()) : []);

      const payload = { 
        group_name: editCustomFieldsData.group_name || editCustomFieldsData.ITEM_GROUP || editCustomFieldsData.item_group || editCustomFieldsData.name || editCustomFieldsData.group || `Group-${Date.now()}`,
        branch_names: validEditBranches.length > 0 ? validEditBranches : undefined,
        branch_name: validEditBranches.length > 0 ? validEditBranches[0] : "",
        company_names: [comp],
        company_name: comp,
        ...editCustomFieldsData
      };

      // Update original record via PUT
      const putUrl = groupToEdit.global_ref_id ? `${baseUrlFull}/api/item-groups/bulk/${groupToEdit.global_ref_id}` : `${baseUrlFull}/api/item-groups/${groupToEdit._id}`;
      await axios.put(putUrl, payload, { headers: getHeaders(headerBranch) });
      successCount++;

      // Clone to newly checked branches
      const newBranches = validEditBranches.filter(b => !existingBranches.includes(b));
      if (newBranches.length > 0) {
        try {
          const newBranchPayload = { ...payload, branch_names: newBranches, branch_name: newBranches[0] };
          await axios.post(`${baseUrlFull}/api/item-groups`, newBranchPayload, { 
            headers: { ...getHeaders(headerBranch), 'X-Company-Name': comp } 
          });
          successCount++;
        } catch (err) {
          console.warn(`Failed to create new branch records:`, err);
        }
      }

      // Delete if the user unchecked the branch they are currently editing
      const removedBranches = existingBranches.filter(b => !validEditBranches.includes(b));
      if (removedBranches.includes(groupToEdit.branch_name || groupToEdit.branch || 'All Branches')) {
        try {
          await axios.delete(`${baseUrlFull}/api/item-groups/${groupToEdit._id}`, { headers: getHeaders(headerBranch) });
        } catch (err) {
          console.warn(`Failed to delete unchecked branch record:`, err);
        }
      }

      // GLOBAL TO SPECIFIC CLEANUP:
      // If the original was Global/All, but 'All' is NOT in the new editCompanies list,
      // we must delete the original global record to prevent duplicates.
      const newHasGlobal = editCompanies.some(c => {
        const nc = c.toLowerCase().trim();
        return nc === 'all' || nc === 'global' || nc === '';
      });

      if (isMigratingFromGlobal && !newHasGlobal) {
        console.log("Migration Cleanup: Deleting original Global/All record...");
        const delUrl = `${baseUrlFull}/api/item-groups/${groupToEdit._id}`;
        await axios.delete(delUrl, { headers: getHeaders(headerBranch) }).catch(err => {
          console.error("Cleanup failed:", err);
        });
      }

      setSuccess(`Update processed successfully (${successCount} company(ies))`);
      setShowEditModal(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item group');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (group) => {
    setGroupToEdit(group);
    
    const b = group.branch_names || group.branch_name || [];
    const existingBranches = Array.isArray(b) ? [...b] : (b ? b.split(',').map(s => s.trim()) : []);
    setEditBranches(existingBranches);
    
    const comps = group.company_names || group.company_name || [];
    const initialComps = Array.isArray(comps) ? [...comps] : (comps ? comps.split(',').map(s => s.trim()) : []);
    setEditCompanies(initialComps);
    
    // Load custom fields into edit state
    const customFields = {};
    if (doctypeData?.fields) {
      doctypeData.fields.forEach(f => {
        let val = group[f.id] || "";
        if (['group_name', 'item_group', 'name', 'group'].includes(f.id.toLowerCase()) && !val) {
          val = group.group_name || "";
        }
        customFields[f.id] = val;
      });
    }
    setEditCustomFieldsData(customFields);
    
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setGroupToEdit(null);
    setEditBranches([]);
    setEditCompanies([]);
    setEditCustomFieldsData({});
  };

  const openDeleteModal = (groupId) => {
    if (!canDelete) {
      setError("You do not have permission to delete item groups.");
      return;
    }
    setGroupToDelete(groupId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowDeleteModal(false);
      setGroupToDelete(null);
    }
  };

  const editAvailableBranches = useMemo(() => {
    if (!groupToEdit) return [];
    const comp = groupToEdit.company_name || groupToEdit.company || "";
    return companyBranchesMap[comp] ? [...companyBranchesMap[comp]] : [];
  }, [groupToEdit, companyBranchesMap]);

  if (configLoading && groups.length === 0) {
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
          <FaBox style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading item groups...</p>
        </div>
      </div>
    );
  }

  const activeCompanyLocal = (localStorage.getItem('active_company') || 'All').trim();
  const isSpecificCompanyActive = activeCompanyLocal.toLowerCase() !== 'all companies' && activeCompanyLocal.toLowerCase() !== 'all' && activeCompanyLocal.toLowerCase() !== 'global' && activeCompanyLocal !== '';
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  
  const showCompanyAssign = (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 1 && !isSpecificCompanyActive && !isSpecificBranchActive;
  const showBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && selectedCompanies.length > 0 && availableBranches.length > 0;

  const uniqueEditAvailableBranches = [...new Set(editAvailableBranches)];
  
  const showEditCompanyAssign = (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 1 && !isSpecificCompanyActive && !isSpecificBranchActive;
  const showEditBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && editCompanies.length > 0 && uniqueEditAvailableBranches.length > 0;

  return (
    <div className="create-customer-container main-customer-page">
      <div className="customer-header-section">
        <div className="header-left">
          <button onClick={handleGoBack} className="header-back-btn" disabled={loading}>
            <FaArrowLeft /> Back to Admin
          </button>
        </div>

        <div className="header-center">
          <h1>Item Groups</h1>
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
            <button className="save-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Adding..." : <><FaPlus /> Add Group</>}
            </button>
          </div>
        </div>
      </div>
      <div className="header-divider"></div>

      {showAssignmentModal && (
        <div className="add-modal-overlay">
          <div className="add-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span>Item Group Assignments</span>
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
                            if (e.target.checked) {
                              setSelectedCompanies(prev => [...prev, comp]);
                            } else {
                              setSelectedCompanies(prev => prev.filter(c => c !== comp));
                            }
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
                <div className="assignment-card">
                  <h4 style={{ color: '#10b981' }}><FaMapMarkerAlt /> Select Branch</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branchName, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedAddBranches.includes(branchName)} 
                          onChange={(e) => { 
                            if (e.target.checked) {
                              setSelectedAddBranches(prev => [...prev, branchName]);
                            } else {
                              setSelectedAddBranches(prev => prev.filter(b => b !== branchName));
                            }
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
              <button className="save-btn" onClick={handleSubmit} disabled={loading || (localStorage.getItem('active_company') === 'All' && selectedCompanies.length === 0)}>
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
        {success && (
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
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div className="form-section-card theme-blue">
            <div className="section-header">
              <div className="section-icon"><FaBox /></div>
              <h2>Add Item Group</h2>
            </div>
            <div className="form-grid" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isCompanyAdmin ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Hardcoded Group Name removed. Form is fully dynamic from Customization */}

            {doctypeData?.fields?.filter(f => !f.hidden).map(f => (
              <div key={f.id}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>{f.label}</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <input
                    type="text"
                    value={customFieldsData[f.id] || ""}
                    onChange={(e) => handleCustomFieldChange(f.id, e.target.value)}
                    required={f.mandatory}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#2c3e50' }}
                  />
                </div>
              </div>
            ))}
          </div>
          </div>
          </div>
        </form>

        <div className="form-section-card theme-green" style={{ marginTop: '20px' }}>
          <div className="section-header">
            <div className="section-icon"><FaSearch /></div>
            <h2>Existing Groups ({filteredGroups.length})</h2>
          </div>
          <div style={{ padding: '20px' }}>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups..."
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
              {filteredGroups.length === 0 ? (
                <li style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No item groups found.</li>
              ) : (
                filteredGroups.map((group, index) => (
                  <li
                    key={group._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px 20px',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      borderBottom: index === filteredGroups.length - 1 ? 'none' : '1px solid #e9ecef'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: '#1e293b', fontSize: '1.1rem', marginBottom: '5px' }}>
                        {group.group_name || group.ITEM_GROUP || group.item_group || group.name || group.group || 'Unnamed Group'}
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', marginLeft: '10px' }}>
                          ({group.company_name} - {group.branch_name})
                        </span>
                      </strong>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {isCompanyAdmin && group.branch_name && group.branch_name !== 'Global' && (
                          <small style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>
                            | Branch: {group.branch_name}
                          </small>
                        )}
                        {doctypeData?.fields?.filter(f => !f.is_default && !f.hidden).map(f => (
                          <small key={f.id} style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            | {f.label}: {group[f.id] || 'N/A'}
                          </small>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => openEditModal(group)}
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
                        onClick={() => openDeleteModal(group._id)}
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
                <FaEdit style={{ color: '#f1c40f' }} /> Edit Item Group
              </h3>
              <FaTimes onClick={closeEditModal} style={{ cursor: 'pointer', color: '#7f8c8d' }} />
            </div>
            <form onSubmit={handleUpdate}>
              {/* Fully dynamic edit modal fields */}

              {doctypeData?.fields?.filter(f => !f.hidden).map(f => (
                <div key={f.id} style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{f.label}</label>
                  <input
                    type="text"
                    value={editCustomFieldsData[f.id] || ""}
                    onChange={(e) => handleCustomFieldChange(f.id, e.target.value, true)}
                    required={f.mandatory}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  />
                </div>
              ))}

                {showEditCompanyAssign && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Company</label>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '10px', 
                      border: '1px solid #e9ecef',
                      color: '#2c3e50',
                      fontWeight: '500'
                    }}>
                      {groupToEdit?.company_name || groupToEdit?.company || 'N/A'}
                    </div>
                  </div>
                )}

              {showEditBranchAssign && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Select Branches</label>
                  <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef',
                    borderRadius: '10px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {uniqueEditAvailableBranches.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>Loading branches...</p> : 
                      uniqueEditAvailableBranches.map((branchName, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <input
                            type="checkbox"
                            id={`edit-branch-${idx}`}
                            checked={editBranches.includes(branchName)}
                            onChange={() => {
                              setEditBranches(prev => 
                                prev.includes(branchName) 
                                  ? prev.filter(b => b !== branchName)
                                  : [...prev, branchName]
                              );
                            }}
                          />
                          <label htmlFor={`edit-branch-${idx}`} style={{ fontSize: '0.9rem', color: '#2c3e50', cursor: 'pointer' }}>
                            {branchName}
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
                  onClick={closeEditModal}
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
          onClick={closeDeleteModal}
        >
          <div style={{
            backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px',
            width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #e9ecef'
          }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <FaTrash /> Confirm Delete
            </h3>
            <p style={{ color: '#2c3e50', marginBottom: '25px' }}>Are you sure you want to delete this item group?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleDelete(groupToDelete)}
                disabled={loading}
                style={{
                  padding: '10px 20px', background: '#e74c3c', color: 'white',
                  border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={closeDeleteModal}
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
        targetDocType="Item Group"
      />
    </div>
  );
}

export default AddItemGroupPage;
