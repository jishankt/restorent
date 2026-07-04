import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft, FaUsers, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaCogs, FaChevronDown, FaTimes, FaDatabase, FaMapMarkerAlt, FaIdCard, FaAddressBook, FaFileAlt, FaStar } from 'react-icons/fa';
import { UserContext } from "../../Context/UserContext";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import "./CreateCustomerGroup.css";
import CustomerCustomizationModal from "./CustomerCustomizationModal";

const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    (option || "").toLowerCase().includes((search || "").toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) setShowList(true);
    if (allowCreateNew && !onAddNewValue) {
      if (onChange) onChange(newSearch);
    }
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) onChange(option);
    setShowList(false);
  };

  const handleCreateNewOption = async () => {
    if (onCreateRequest) {
      onCreateRequest(search);
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      const valToCreate = search.trim() || (createNewLabel ? `New ${createNewLabel}` : "New Item");
      const success = await onAddNewValue(valToCreate);
      if (success) {
        setSearch(valToCreate);
        if (onChange) onChange(valToCreate);
        setShowList(false);
      }
      return;
    }
    if (allowCreateNew) {
      handleSelectOption(search.trim());
    }
  };

  const handleFocus = () => {
    setShowList(true);
    if (value) {
      setSearch('');
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowList(false);
      setSearch(value || '');
    }, 200);
  };

  const isExactMatch = filteredOptions.some(option => (option || "").toLowerCase() === (search.trim()).toLowerCase());
  const showCreateOption = allowCreateNew && !isExactMatch;

  return (
    <div className="searchable-select" style={{ position: 'relative', width: '100%' }}>
      <div className="input-wrapper" style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
          <FaChevronDown />
        </div>

        {showList && (
          <ul className="searchable-list" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#ffffff', border: '2px solid #cbd5e1', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'block', borderRadius: '12px', marginTop: '5px', padding: 0, listStyle: 'none', overflowY: 'auto', maxHeight: '300px', boxSizing: 'border-box' }}>
            {showCreateOption && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreateNewOption();
                }}
                style={{
                  padding: '14px 16px',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  fontWeight: '800',
                  cursor: 'pointer',
                  borderBottom: filteredOptions.length > 0 ? '2px solid #dbeafe' : 'none'
                }}
              >
                {search.trim()
                  ? `+ Add "${search.trim()}"`
                  : `+ Add New ${createNewLabel || 'Item'}`}
              </li>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const displayLabel = String(option || "");
                return (
                  <li
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(option);
                    }}
                    style={{
                      padding: '12px 16px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: '700',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLabel}
                  </li>
                );
              })
            ) : (
              !showCreateOption && (
                <li className="no-options" style={{ padding: '20px', color: '#475569', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                  {options.length === 0 ? "Loading Data..." : "No items found"}
                </li>
              )
            )}
          </ul>
        )}
      </div>
      {showList && <div className="expansion-spacer" style={{ height: filteredOptions.length > 5 ? '280px' : filteredOptions.length > 0 ? `${filteredOptions.length * 50 + 60}px` : '100px' }}></div>}
    </div>
  );
};



const CreateCustomerGroup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);

  const getSectionTheme = (index) => {
    const themes = [
      { icon: <FaUsers />, class: 'theme-blue' },
      { icon: <FaDatabase />, class: 'theme-green' },
      { icon: <FaMapMarkerAlt />, class: 'theme-orange' },
      { icon: <FaIdCard />, class: 'theme-purple' },
      { icon: <FaAddressBook />, class: 'theme-teal' },
      { icon: <FaFileAlt />, class: 'theme-pink' },
      { icon: <FaStar />, class: 'theme-indigo' }
    ];
    return themes[index % themes.length];
  };

  // Permissions State
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Business State

  const [customerGroups, setCustomerGroups] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Address State
  const [addressDoctypeFields, setAddressDoctypeFields] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    country: "",
  });
  const [addressStructure, setAddressStructure] = useState({ structure: { countries: {} }, linkedValues: {} });
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalOnSave, setModalOnSave] = useState(null);

  // Dynamic DocType State
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});
  const [tableOptions, setTableOptions] = useState({});

  // Multi-Company State
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  // Multi-Branch State
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  // 1. Fetch Permissions & Initial Data
  useEffect(() => {
    if (configLoading) return;

    const initialize = async () => {
      setPermsLoading(true);
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role || user.UserType || "";
          const roleNorm = role.toLowerCase().replace(/[\s_]/g, '');
          const isGA = checkIsGlobalAdmin(user);
          const isCA = roleNorm === 'companyadmin';
          const isBA = roleNorm.includes('branch') || (!isGA && !isCA);
          
            const isGroupAdminRole = checkIsGlobalAdmin(user);
          const isAdminRole = isGroupAdminRole || (roleNorm === 'companyadmin');
          setIsGroupAdmin(isGroupAdminRole);

          if (role) {
            const url = `${baseUrl}/api/role-permissions?role=${encodeURIComponent(role)}`;
            const response = await axios.get(url);
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'create_customer_group');

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

          if (activeContext === 'All' || isGroupAdminRole) {
            fetchCompanies();
          } else {
            const comp = user.company_name || user.company || "";
            setSelectedCompanies([activeContext || comp].filter(c => c));
          }
        }
        // Fetch groups and doctype once permissions are checked
        await fetchCustomerGroups();
        await fetchDoctype();
        await fetchAddressDoctype();
        await fetchAddressStructure();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setPermsLoading(false);
      }
    };

    initialize();
  }, [baseUrl, configLoading]);

  useEffect(() => {
    const handleStorage = () => {
      fetchCustomerGroups();
      fetchDoctype();
      fetchAddressDoctype();
      fetchAddressStructure();
    };
    window.addEventListener('local-storage-change', handleStorage);
    return () => window.removeEventListener('local-storage-change', handleStorage);
  }, [baseUrl]);

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
      const finalComps = comps.length > 0 ? [...new Set(comps)] : [];
      setCompanyOptions(finalComps);

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
    } catch (e) { 
      console.error('Error fetching companies:', e); 
      setCompanyOptions([]);
    }
  };

  const fetchBranches = async () => {
    if (selectedCompanies.length === 0) {
      setAvailableBranches([]);
      return;
    }
    try {
      const branchPromises = selectedCompanies.map(comp =>
        axios.get(`${baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`, {
          headers: { ...getHeaders(), 'X-Company-Name': comp }
        })
      );
      const results = await Promise.all(branchPromises);
      const allBranches = results.flatMap(res =>
        (res.data || []).map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name))
      ).filter(b => b);
      setAvailableBranches([...new Set(allBranches)]);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  useEffect(() => {
    if (selectedCompanies.length > 0) {
      fetchBranches();
    } else {
      setAvailableBranches([]);
    }
  }, [selectedCompanies]);

  const fetchCustomerGroups = async () => {
    try {
      const activeComp   = (localStorage.getItem('active_company') || '').trim();
      const activeBranch = (localStorage.getItem('active_branch')  || '').trim();

      const headers = {
        ...getHeaders(),
        ...(activeComp   ? { 'X-Company-Name': activeComp   } : {}),
        ...(activeBranch ? { 'X-Branch-Name':  activeBranch } : {}),
      };

      const res = await axios.get(`${baseUrl}/api/customer-groups`, { headers });
      // Backend already filters by company + branch — just use the result
      setCustomerGroups(res.data || []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
    }
  };

  const fetchDoctype = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/doctypes/Customer%20Group`, { headers: getHeaders() });
      const fields = response.data.fields || [];
      setDoctypeFields(fields);

      // Fetch data for Table/Link fields
      const tableFields = fields.filter(f => f.type === 'Table' && f.link_doctype);
      for (const field of tableFields) {
        fetchTableData(field);
      }
    } catch (error) {
      console.error('Error fetching doctype:', error);
    }
  };

  const getFieldHidden = (fieldName, defaultValue = false) => {
    const docField = doctypeFields.find(f => f.id === fieldName);
    return docField ? docField.hidden : defaultValue;
  };

  const fetchTableData = async (field) => {
    try {
      const doctypeApiMap = {
        "Customer": "/api/customers",
        "Customer Group": "/api/customer-groups"
      };
      const endpoint = doctypeApiMap[field.link_doctype] || `/api/${field.link_doctype.toLowerCase().replace(/\s+/g, '-')}`;
      const res = await axios.get(`${baseUrl}${endpoint}`, { headers: getHeaders() });
      
      let tableData = res.data || [];
      const activeBranch = (localStorage.getItem('active_branch') || 'All Branches').toLowerCase().trim();
      const activeComp = (localStorage.getItem('active_company') || 'All Companies').toLowerCase().trim();

      tableData = tableData.filter(item => {
        const compArray = Array.isArray(item.company_names) ? item.company_names : (item.company_names ? [item.company_names] : []);
        const compRaw = compArray.length > 0 ? compArray.join(",") : (item.company_name || item.company || "Global Access");
        const comp = String(compRaw).toLowerCase();
        const branchArray = Array.isArray(item.branch_names) ? item.branch_names : (item.branch_names ? [item.branch_names] : []);
        const branchRaw = branchArray.length > 0 ? branchArray : (item.branch_name || item.branch || "Global Access");
        const branches = Array.isArray(branchRaw) ? branchRaw : String(branchRaw).split(',').map(b => b.trim());

        const compMatch = activeComp === 'all companies' || activeComp === 'all' || comp.includes('all') || comp.includes('global') || comp.includes(activeComp);
        if (!compMatch) return false;

        const activeBranchClean = activeBranch.includes("|") ? activeBranch.split("|")[1].trim() : activeBranch;
        const branchMatch = activeBranch === 'all branches' || activeBranch === 'all' || branches.some(b => {
          const bl = b.toLowerCase().trim();
          return bl === activeBranch || bl === activeBranchClean || activeBranchClean === bl;
        });
        if (!branchMatch) return false;

        return true;
      });

      setTableOptions(prev => ({ ...prev, [field.id]: tableData }));
    } catch (e) {
      console.error(`Failed to fetch data for ${field.link_doctype}`, e);
    }
  };

  const fetchAddressDoctype = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/doctypes/Address Structure`, { headers: getHeaders() });
      setAddressDoctypeFields(res.data.fields || []);
    } catch (e) { console.error(e); }
  };

  const fetchAddressStructure = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/address-structures`, { headers: getHeaders() });
      setAddressStructure(res.data);
    } catch (e) { console.error(e); }
  };

  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewAddressValue = async (field, newValue) => {
    const country = deliveryAddress.country;
    if (!country) return false;
    let parent = "";
    const fieldNum = parseInt(field.replace('field', ''));
    if (fieldNum > 1) {
      const parentKey = `field${fieldNum - 1}`;
      parent = deliveryAddress[parentKey] || "";
    }
    try {
      const res = await axios.post(`${baseUrl}/api/add-address-value`, { country, field, value: newValue, parent_value: parent || undefined }, { headers: getHeaders() });
      if (res.status === 200) { await fetchAddressStructure(); return true; }
    } catch (e) { return false; }
    return false;
  };

  const countryAddressHierarchy = {
    "United Arab Emirates": ["Emirate", "City", "Area"],
    "India": ["State/UT", "District", "Taluk"],
    "USA": ["State", "County", "City"],
    "UK": ["Country", "County", "Borough"],
    "Australia": ["State/Territory", "Local Government Area", "Suburb"],
    "Saudi Arabia": ["Province", "Governorate", "Area"],
    "Qatar": ["Municipality", "Zone", "Area"],
    "Oman": ["Governorate", "Wilayat", "Area"],
    "Bahrain": ["Governorate", "Municipality", "Area"],
    "Kuwait": ["Governorate", "Area", "Block"],
  };

  const sortedAddressFieldIds = addressDoctypeFields.length > 0
    ? addressDoctypeFields
      .map(f => f.id)
      .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
      .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
      .sort((a, b) => parseInt(a.replace('field', '')) - parseInt(b.replace('field', '')))
    : ['field1', 'field2', 'field3'];

  const getAddressLabels = (country) => {
    if (!country) return {};
    const hierarchyLabels = countryAddressHierarchy[country] || [];
    const countryData = addressStructure.structure?.countries?.[country];
    const labels = {};

    sortedAddressFieldIds.forEach((fid, idx) => {
      if (countryData?.[fid]?.label) {
        labels[fid] = countryData[fid].label;
      } else if (hierarchyLabels[idx]) {
        labels[fid] = hierarchyLabels[idx];
      } else {
        labels[fid] = `Field ${idx + 1}`;
      }
    });
    return labels;
  };

  const getOptionsForField = (field, country, parentValue) => {
    if (!country) return [];
    if (!parentValue && field !== 'field1') return [];
    const linkVals = addressStructure.linkedValues || {};
    return (linkVals[country]?.[field]?.[parentValue || 'root'] || []).map(v => v.value);
  };

  const countryList = addressStructure.structure?.countries
    ? Object.keys(addressStructure.structure.countries).sort()
    : ["India", "United Arab Emirates", "USA", "UK", "Australia", "Saudi Arabia", "Qatar", "Oman", "Bahrain", "Kuwait"];

  const getDisplayValueForTable = (record, doctype) => {
    if (!record) return "";
    if (doctype === "Customer") return record.customer_name;
    if (doctype === "Customer Group") return record.group_name;
    return record.name || record.label || record.group_name || record.customer_name || record._id || "";
  };

  const isMandatory = (id) => {
    const field = doctypeFields.find(f => f.id === id);
    return field ? field.mandatory : false;
  };

  const handleSaveGroup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!canWrite && !canCreate) {
      showWarning("You do not have permission to save customer groups.", "warning");
      return;
    }

    if (!(dynamicValues['group_name'] || "").trim()) {
      showWarning("Group name is required.", "warning");
      return;
    }

    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : {};
    const showCompanyAssign = (isGroupAdmin || checkIsGlobalAdmin(userObj)) && companyOptions.length > 0;

    let finalBranches = selectedBranches;
    let finalCompanies = selectedCompanies;
    const activeBranchLoc = (localStorage.getItem('active_branch') || 'All Branches').trim();
    const activeCompLoc = (localStorage.getItem('active_company') || 'All Companies').trim();
    const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
    const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';

    if (isSpecBranch && finalBranches.length === 0) finalBranches = [activeBranchLoc];
    if (isSpecComp && finalCompanies.length === 0) finalCompanies = [activeCompLoc];

    if (!showAssignmentModal) {
      if (showCompanyAssign && finalCompanies.length === 0) {
        setShowAssignmentModal(true);
        return;
      }
      if (finalBranches.length === 0 && finalCompanies.length > 0 && availableBranches.length > 0 && !isSpecBranch) {
        setShowAssignmentModal(true);
        return;
      }
    } else {
      if (showCompanyAssign && finalCompanies.length === 0) {
        showWarning("Company selection is required", "warning");
        return;
      }
      // Branch is explicitly optional, so we do NOT block saving here!
    }

    setLoading(true);
    try {
      const activeContext    = localStorage.getItem('active_company') || '';
      const activeBranchCtx = localStorage.getItem('active_branch')  || '';

      // Always ensure company is resolved — never save an empty company_names
      let finCompanies = finalCompanies.length > 0
        ? finalCompanies
        : (activeContext && activeContext !== 'All' && activeContext !== 'All Companies' ? [activeContext] : []);

      // Always ensure branch is resolved when a specific branch is active
      let finBranches = finalBranches.length > 0
        ? finalBranches
        : (activeBranchCtx && activeBranchCtx !== 'All Branches' && activeBranchCtx !== 'All' ? [activeBranchCtx] : []);

      const payload = {
        group_name: (dynamicValues['group_name'] || "").trim(),
        company_name:  finCompanies[0] || "",
        company_names: finCompanies,
        branch_name:   finBranches[0] || "",
        branch_names:  finBranches,
        address_data:  deliveryAddress,
        ...dynamicValues
      };
      let url    = `${baseUrl}/api/customer-groups`;
      let method = editingGroupId ? 'PUT' : 'POST';

      if (editingGroupId) url += `/${editingGroupId}`;

      const response = await axios({ method, url, data: payload, headers: getHeaders() });

      if (response.status === 200 || response.status === 201) {
        showWarning(editingGroupId ? "Group updated successfully!" : "Group created successfully!", "success");
        resetForm();
        fetchCustomerGroups();

        // If redirected from Create Customer page, go back with new ID
        if (location.state?.fromCreateCustomer && !editingGroupId) {
          setTimeout(() => {
            navigate('/create-customer', {
              state: {
                newGroupId: response.data._id,
                formState: location.state.formState
              }
            });
          }, 1500);
        }
      }
    } catch (error) {
      showWarning("Failed to save group. " + (error.response?.data?.error || ""), "warning");
    } finally {
      setLoading(false); setShowAssignmentModal(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!canDelete) {
      showWarning("Permission denied: Cannot delete groups.", "warning");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      await axios.delete(`${baseUrl}/api/customer-groups/${groupId}`);
      showWarning("Group deleted successfully!", "success");
      fetchCustomerGroups();
    } catch (error) {
      showWarning("Error deleting group.", "warning");
    }
  };

  const showWarning = (msg, type) => {
    setWarningMessage(msg);
    setWarningType(type);
  };

  const resetForm = () => {

    setEditingGroupId(null);
    setSelectedBranches([]);
    setDynamicValues({});
  };

  if (configLoading || permsLoading) {
    return (
      <div className="create-customer-container customer-group-page">
        <div style={{ padding: '50px', fontSize: '18px', fontWeight: '600', color: '#64748b', textAlign: 'center', width: '100%' }}>
          Loading Permissions...
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdminRole = checkIsAdmin(userObj);

  if (!canRead && !isAdminRole && !permsLoading) {
    return (
      <div className="create-customer-container customer-group-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="warning-modal" style={{ maxWidth: '480px' }}>
          <div className="warning-modal-icon" style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' }}>
            <FaExclamationTriangle />
          </div>
          <h3>Access Denied</h3>
          <p>You do not have permission to view Customer Groups.</p>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-ok" onClick={() => navigate('/admin')} style={{ background: '#ef4444' }}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  const showCompanyAssign = !isSpecificBranchActive && (isGroupAdmin || checkIsGlobalAdmin(userObj)) && companyOptions.length > 0;
  const showBranchAssign = !isSpecificBranchActive && selectedCompanies.length > 0 && availableBranches.length > 0;

  return (
    <div className="create-customer-container customer-group-page main-customer-page">
      {/* Header section */}
      <div className="customer-header-section">
        <div className="header-left">
          <button onClick={() => navigate("/admin")} className="header-back-btn">
            <FaArrowLeft /> Back to Admin
          </button>
        </div>

        <div className="header-center">
          <h1>Customer Group Management</h1>
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
            {checkIsAdmin(userObj) && (
              <button 
                type="button"
                className="customize-btn" 
                onClick={() => setShowCustomizeModal(true)}
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
            )}
            <button className="save-btn" onClick={handleSaveGroup} disabled={loading}>
              {loading ? "Saving..." : (editingGroupId ? <><FaEdit /> Update</> : <><FaPlus /> Save</>)}
            </button>
          </div>
        </div>
      </div>
      <div className="header-divider"></div>

      {/* Modern Dialog/Status overlay */}
      {warningMessage && (
        <div className="warning-modal-overlay">
          <div className="warning-modal">
            <div className="warning-modal-icon" style={{ background: warningType === 'success' ? '#ecfdf5' : '#fffbeb', color: warningType === 'success' ? '#10b981' : '#f59e0b', borderColor: warningType === 'success' ? '#d1fae5' : '#fef3c7' }}>
              {warningType === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            </div>
            <h3>{warningType === 'success' ? "Success" : "Notice"}</h3>
            <p>{warningMessage}</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setWarningMessage("")}>Cancel</button>
              <button className="modal-btn modal-btn-ok" onClick={() => {
                setWarningMessage("");
              }} style={{ background: warningType === 'success' ? '#10b981' : '#3b82f6' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Body scroll view */}
      <div className="customer-scroll-body">
        <div className="form-sections-wrapper">
          {(() => {
            const sections = [];
            let currentSection = null;

            currentSection = { label: "General Information", fields: [] };
            
            doctypeFields.filter(f => !f.is_default).forEach(f => {
              if (f.type === 'Section Break') {
                if (currentSection && currentSection.fields.length > 0) {
                  sections.push(currentSection);
                }
                currentSection = { label: f.label, fields: [], id: f.id };
              } else {
                currentSection.fields.push(f);
              }
            });
            if (currentSection && currentSection.fields.length > 0) {
              sections.push(currentSection);
            }

            return sections.map((section, sidx) => {
              const theme = getSectionTheme(sidx);
              const visibleFields = section.fields.filter(f => !f.hidden);
              if (visibleFields.length === 0) return null;

              return (
                <div className={`form-section-card ${theme.class}`} key={section.id || sidx} style={{ marginBottom: '40px' }}>
                  <div className="section-header">
                    <div className="section-icon">{theme.icon}</div>
                    <h2>{section.label === "General Information" && editingGroupId ? "Update Existing Group" : section.label === "General Information" ? "Create New Group" : section.label}</h2>
                  </div>

                  <div className="form-grid">
                    {section.fields.map(field => {
                      if (field.hidden) return null;

                      return (
                        <div key={field.id} className="form-group">
                          <label>
                            {field.label} {field.mandatory && <span className="required">*</span>}
                          </label>
                          {field.type === 'Check' ? (
                            <div className="form-check form-switch" style={{ marginTop: '8px' }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={!!dynamicValues[field.id]}
                                onChange={(e) => setDynamicValues({ ...dynamicValues, [field.id]: e.target.checked })}
                                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                              />
                            </div>
                          ) : field.allow_create_new ? (
                            <SearchableSelect
                              options={[...new Set(customerGroups.map(g => g[field.id]).filter(Boolean))].sort()}
                              value={dynamicValues[field.id] || ""}
                              onChange={(val) => setDynamicValues({ ...dynamicValues, [field.id]: val })}
                              placeholder={`Select / Create ${field.label}`}
                              allowCreateNew={true}
                            />
                          ) : field.type === 'Table' ? (
                            (() => {
                              if (field.link_doctype === 'Address Structure' || ['address_data', 'adress_', 'address', 'adress'].includes(field.id)) {
                                const labels = getAddressLabels(deliveryAddress.country);
                                return (
                                  <React.Fragment key={field.id}>
                                    {addressDoctypeFields.map((af) => {
                                      if (af.hidden) return null;

                                      if (af.id === 'country_name') {
                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                            <SearchableSelect
                                              options={countryList}
                                              value={deliveryAddress.country}
                                              onChange={(v) => handleDeliveryAddressChange("country", v)}
                                              placeholder={`Select ${af.label}`}
                                            />
                                          </div>
                                        );
                                      }

                                      if (af.id === 'flat_villa_no' || af.id === 'building_name') {
                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                            <input type="text" value={deliveryAddress[af.id] || ""} onChange={(e) => handleDeliveryAddressChange(af.id, e.target.value)} placeholder={af.label} />
                                          </div>
                                        );
                                      }

                                      if (af.id.toLowerCase().includes('field') && af.id.toLowerCase().includes('label')) {
                                        if (!deliveryAddress.country) return null;
                                        const fid = af.id.toLowerCase().replace('_label', '').replace('label', '').replace('_', '');
                                        const label = labels[fid];
                                        if (!label || ["N/A", "None", ""].includes(label) || label.toLowerCase().includes("label")) return null;

                                        const aidx = sortedAddressFieldIds.indexOf(fid);
                                        const parentFid = aidx > 0 ? sortedAddressFieldIds[aidx - 1] : null;
                                        const parentVal = parentFid ? deliveryAddress[parentFid] : null;

                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{label}</label>
                                            <SearchableSelect
                                              options={getOptionsForField(fid, deliveryAddress.country, parentVal)}
                                              value={deliveryAddress[fid] || ""}
                                              placeholder={`Select ${label}`}
                                              onChange={(v) => {
                                                const newAddr = { ...deliveryAddress, [fid]: v };
                                                for (let i = aidx + 1; i < sortedAddressFieldIds.length; i++) {
                                                  newAddr[sortedAddressFieldIds[i]] = "";
                                                }
                                                setDeliveryAddress(newAddr);
                                              }}
                                              allowCreateNew={true}
                                              onAddNewValue={(v) => handleAddNewAddressValue(fid, v)}
                                              onCreateRequest={(s) => {
                                                setModalField(label);
                                                setModalOnSave(() => (nv) => handleAddNewAddressValue(fid, nv));
                                                setShowAddModal(true);
                                                setModalValue(s);
                                              }}
                                            />
                                          </div>
                                        );
                                      }

                                      return (
                                          <div className="form-group" key={af.id}>
                                              <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                              <input 
                                                  type={af.type === 'Number' ? 'number' : af.type === 'Date' ? 'date' : af.type === 'Time' ? 'time' : 'text'} 
                                                  value={deliveryAddress[af.id] || ""} 
                                                  onChange={(e) => handleDeliveryAddressChange(af.id, e.target.value)} 
                                                  placeholder={af.label} 
                                              />
                                          </div>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              }
                              return (
                                <SearchableSelect
                                  options={(tableOptions[field.id] || []).map(item => getDisplayValueForTable(item, field.link_doctype))}
                                  value={dynamicValues[field.id] || ""}
                                  onChange={(val) => setDynamicValues({ ...dynamicValues, [field.id]: val })}
                                  placeholder={`Select ${field.link_doctype}`}
                                />
                              );
                            })()
                          ) : field.type === 'Select' ? (
                            <SearchableSelect 
                              options={(field.link_doctype || "").split(',').map(o => o.trim()).filter(o => o)} 
                              value={dynamicValues[field.id] || ""} 
                              onChange={(val) => setDynamicValues({ ...dynamicValues, [field.id]: val })} 
                              placeholder={`Select ${field.label}`} 
                              allowCreateNew={field.allow_create_new} 
                            />
                          ) : (
                            <input
                              type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'}
                              value={dynamicValues[field.id] || ""}
                              onChange={(e) => setDynamicValues({ ...dynamicValues, [field.id]: e.target.value })}
                              required={field.mandatory}
                              placeholder={field.label}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {section.is_core && editingGroupId && (
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#64748b', 
                        fontWeight: '700', 
                        fontSize: '14px', 
                        marginTop: '20px', 
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px' 
                      }}
                    >
                      <FaTimes /> Cancel Edit
                    </button>
                  )}
                </div>
              );
            });
          })()}

          {/* Card 2: Existing Groups Cards Layout */}
          <div className="table-section-card theme-green">
            <div className="section-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="section-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#ffffff' }}><FaUsers /></div>
                <h2>Existing Groups</h2>
              </div>
              <span className="badge-count">{customerGroups.length} Groups</span>
            </div>

            {customerGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '20px', border: '1.5px dashed #e2e8f0' }}>
                No customer groups available yet.
              </div>
            ) : (
              <div className="groups-card-grid">
                {customerGroups.map((group) => {
                  const activeCompLoc = (localStorage.getItem('active_company') || '').trim();
                  const activeBranchLoc = (localStorage.getItem('active_branch') || '').trim();
                  const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';
                  const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
                  
                  const displayCompanies = group.company_names ? group.company_names.filter(c => !isSpecComp || c.toLowerCase() === activeCompLoc.toLowerCase()) : [];
                  const displayBranches = group.branch_names ? group.branch_names.filter(b => !isSpecBranch || b.toLowerCase() === activeBranchLoc.toLowerCase()) : [];

                  return (
                  <div key={group._id} className="group-premium-card">
                    {/* Glowing Top Accent Bar */}
                    <div className="card-accent-bar" />

                    <div className="card-main-header">
                      <div className="card-title-group">
                        <h3 className="card-group-name">{group.group_name}</h3>
                        <span className="card-group-id">ID: {group._id ? group._id.substring(group._id.length - 8) : ''}</span>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-icon-btn group-edit-btn"
                          onClick={() => { 
                            setEditingGroupId(group._id); 
                            setSelectedCompanies(group.company_names || []);
                            setSelectedBranches(group.branch_names || []);
                            
                            // Populate dynamic values
                            const dynVals = {};
                            doctypeFields.forEach(f => {
                              if (group[f.id] !== undefined) dynVals[f.id] = group[f.id];
                            });
                            dynVals['group_name'] = group.group_name;
                            setDynamicValues(dynVals);

                            document.querySelector('.customer-scroll-body').scrollTo({ top: 0, behavior: 'smooth' }); 
                          }}
                          title="Edit Group"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          onClick={() => handleDeleteGroup(group._id)}
                          title="Delete Group"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="card-details-section">
                      {/* Companies Info */}
                      <div className="detail-row">
                        <span className="detail-label">
                          <FaUsers className="detail-icon-company" /> Assigned Companies
                        </span>
                        <div className="detail-tags-group">
                          {displayCompanies.length > 0 ? (
                            displayCompanies.map((c, i) => (
                              <span key={i} className="detail-tag tag-company">{c}</span>
                            ))
                          ) : (
                            <span className="no-assignments">No companies assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Branches Info */}
                      <div className="detail-row">
                        <span className="detail-label">
                          <FaUsers className="detail-icon-branch" /> Assigned Branches
                        </span>
                        <div className="detail-tags-group">
                          {displayBranches.length > 0 ? (
                            displayBranches.map((b, i) => (
                              <span key={i} className="detail-tag tag-branch">{b}</span>
                            ))
                          ) : (
                            <span className="no-assignments">No branches assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Custom Attributes Fields */}
                      {doctypeFields.filter(f => !f.is_default && f.type !== 'Section Break').length > 0 && (
                        <div className="card-attributes-divider">
                          <div className="attributes-grid">
                            {doctypeFields.filter(f => !f.is_default && f.type !== 'Section Break').map(f => (
                              <div key={f.id} className="attribute-item">
                                <span className="attribute-label">{f.label}</span>
                                <span className="attribute-value">
                                  {group[f.id] !== undefined ? String(group[f.id]) : "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerCustomizationModal 
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={fetchDoctype}
        targetDocType="Customer Group"
      />

      {showAssignmentModal && (
        <div className="add-modal-overlay">
          <div className="add-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span>Customer Group Assignments</span>
              <button className="close-modal-btn" onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body" style={{ marginTop: '20px' }}>
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}><FaUsers /> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e40af', transition: 'all 0.2s ease' }}>
                        <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={(e) => { setSelectedCompanies(prev => e.target.checked ? [...prev, comp] : prev.filter(c => c !== comp)); }} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                        {comp}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {showBranchAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}><FaMapMarkerAlt /> Select Branch (Optional)</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branch, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#065f46', transition: 'all 0.2s ease' }}>
                        <input type="checkbox" checked={selectedBranches.includes(branch)} onChange={(e) => { setSelectedBranches(prev => e.target.checked ? [...prev, branch] : prev.filter(b => b !== branch)); }} style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }} />
                        {branch}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={handleSaveGroup} disabled={loading || selectedCompanies.length === 0}>
                {loading ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCustomerGroup;
