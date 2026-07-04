// src/components/Form/Addemployee.jsx
// Updated to handle return from sub-pages (Designation, Type, Department) correctly.
// Also includes "Required Fields" modal and confirmation dialog.
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUserPlus, FaArrowLeft, FaBriefcase, FaBuilding, FaUserCircle, FaMoneyBillWave, FaSave, FaExclamationTriangle, FaCheckCircle, FaUsers, FaPlus, FaClock, FaIdCard, FaUniversity, FaGraduationCap, FaTools, FaStethoscope, FaUserShield, FaUserTie, FaTimes, FaUser, FaUpload, FaCog } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import CustomerCustomizationModal from "./CustomerCustomizationModal";
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

const AddEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [metadata, setMetadata] = useState(null);
  const [linkedData, setLinkedData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    gender: '',
    date_of_birth: '',
    date_of_joining: '',
    company: 'POS 8',
    status: 'Active',
    salutation: '',
    marital_status: '',
    id_number: '',
    id_expiry: '',
    address: '',
    employee_designation: '',
    employee_type: '',
    basic_salary: '',
    hra: '',
    ta: '',
    oa: '',
    total_salary: '',
    username: '',
    password: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    branch_code: '',
    nationality: '',
    education: '',
    previous_experience: '',
    skills: '',
    health_info: '',
    family_details: '',
    profile_image: '',
    department: '',
    employee_id: '',
  });
  
  // Tab mapping for dynamic fields
  const getFieldTab = (fieldId) => {
    if (metadata && metadata.fields) {
      let currentSection = 'details';
      for (let i = 0; i < metadata.fields.length; i++) {
        const f = metadata.fields[i];
        if (f.type === 'Section Break') {
          currentSection = f.id;
        }
        if (f.id === fieldId) {
          return currentSection;
        }
      }
    }
    
    const mapping = {
      name: 'details', employee_id: 'details', phone_number: 'details', email: 'details', status: 'details', profile_image: 'details', 
      username: 'credentials', password: 'credentials',
      gender: 'personal', date_of_birth: 'personal', salutation: 'personal', marital_status: 'personal', id_number: 'personal', id_expiry: 'personal', nationality: 'personal', address: 'personal',
      date_of_joining: 'employment', employee_designation: 'employment', employee_type: 'employment', department: 'employment',
      basic_salary: 'salary', hra: 'salary', ta: 'salary', oa: 'salary', total_salary: 'salary',
      education: 'professional', previous_experience: 'professional', skills: 'professional',
      bank_name: 'other', account_holder_name: 'other', account_number: 'other', branch_code: 'other', health_info: 'other', family_details: 'other'
    };
    return mapping[fieldId] || 'details';
  };

  const getTabs = () => {
    if (metadata && metadata.fields) {
      const sections = metadata.fields.filter(f => f.type === 'Section Break' && !f.hidden);
      if (sections.length > 0) {
        return sections.map(s => ({ key: s.id, label: s.label }));
      }
    }
    return [
      { key: 'details', label: 'Basic Details' },
      { key: 'personal', label: 'Personal Info' },
      { key: 'employment', label: 'Employment' },
      { key: 'salary', label: 'Salary' },
      { key: 'professional', label: 'Professional' },
      { key: 'other', label: 'Other Details' },
      { key: 'credentials', label: 'Credentials' }
    ];
  };

  // State for phone number country code
  const [selectedISDCode, setSelectedISDCode] = useState("+971");
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  // ISD Codes array
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  // Digit lengths per country for dynamic validation
  const digitLengths = {
    '+91': 10,
    '+1': 10,
    '+44': 10,
    '+971': 9,
    '+61': 9,
  };
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'personal', 'employment', 'salary', 'professional', 'other', 'credentials'
  const [loading, setLoading] = useState(false);
  const [nextIdLoading, setNextIdLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // NEW: Confirmation modal before submit
  const [showConfirmation, setShowConfirmation] = useState(false);
  // NEW: Required Fields Modal
  const [showRequiredFields, setShowRequiredFields] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Permission States
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");
  const [showPermModal, setShowPermModal] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  // --- Branch Assignment State ---
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  // Dynamic API URL and User Context
  const { baseUrl, configLoading, user, getHeaders } = useContext(UserContext);
  const [userBranch, setUserBranch] = useState("");
  const [userCompany, setUserCompany] = useState("");


  const fetchMetadata = async (currentBaseUrl = baseUrl) => {
    try {
      const url = `${currentBaseUrl}/api/doctypes/Employee`;
      const response = await axios.get(url, { headers: getHeaders() });
      setMetadata(response.data);
      
      const sections = response.data.fields.filter(f => f.type === 'Section Break' && !f.hidden);
      if (sections.length > 0) {
        setActiveTab(sections[0].id);
      } else {
        setActiveTab('details');
      }

      // Fetch linked data for any Table fields
      const tableFields = response.data.fields.filter(f => f.type === 'Table' && f.link_doctype);
      for (const field of tableFields) {
        fetchLinkedData(field.link_doctype, currentBaseUrl);
      }
    } catch (err) {
      console.error("Error fetching Employee metadata:", err);
    }
  };

  const fetchLinkedData = async (docTypeName, currentBaseUrl = baseUrl) => {
    try {
      const endpointMap = {
        'Employee Designation': 'employee-designations',
        'Employee Type': 'employee-types',
        'Employee Department': 'departments'
      };
      const endpoint = endpointMap[docTypeName] || docTypeName.toLowerCase().replace(/\s+/g, '-');
      const url = `${currentBaseUrl}/api/${endpoint}`;
      const response = await axios.get(url, { headers: getHeaders() });
      setLinkedData(prev => ({ ...prev, [docTypeName]: response.data }));
    } catch (err) {
      console.error(`Error fetching linked data for ${docTypeName}:`, err);
    }
  };

  // Fetch Permissions
  const fetchPermissions = async (currentBaseUrl = baseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const isAdminRole = checkIsAdmin(userObj);
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);
        
        setIsGroupAdmin(isGroupAdminRole);
        setIsCompanyAdmin(isAdminRole);
        const roleRaw = userObj.role || "";
        const isBA = roleRaw.toLowerCase().includes('branch') || roleRaw.toLowerCase().includes('manager');
        setIsBranchAdmin(isBA);

        if (isAdminRole || isGroupAdminRole) {
          fetchCompanies(currentBaseUrl);
        } else {
          const activeContext = localStorage.getItem('active_company');
          const comp = userObj.company_name || userObj.company || "";
          setSelectedCompanies([activeContext || comp]);
        }

        if (roleRaw) {
          const url = `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`;
          const response = await axios.get(url, { headers: getHeaders() });
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'add_employee');

          if (isAdminRole || isGroupAdminRole) {
            setCanRead(true);
            setCanWrite(true);
            setCanCreate(true);
          } else if (pagePerm) {
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
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

  useEffect(() => {
    if (!configLoading) {
      const url = baseUrl || "";
      const empId = location.state?.editingEmployee?._id || location.state?.editingEmployee?.id || location.state?.editingId;

      // NEW: Auto-populate company and branch from user context if not editing
      const userStr = localStorage.getItem('user');
      if (!empId && userStr) {
         const userObj = JSON.parse(userStr);
         const companyName = userObj.company_name || userObj.company;
         if (companyName) {
            if (Array.isArray(companyName)) {
               setSelectedCompanies(companyName);
            } else {
               setSelectedCompanies([companyName]);
            }
         }
         
         // Robust Branch Auto-selection for Branch Logins
         const activeBranch = localStorage.getItem('active_branch');
         const userBranch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : (userObj.branch_name || userObj.branch || "");
         const isUserAdmin = checkIsAdmin(userObj) && (!userBranch || userBranch === 'All Branches');

         if (!isUserAdmin && userBranch && userBranch !== 'All Branches') {
           setSelectedBranches([userBranch]);
           console.log("Auto-selected branch for non-admin user:", userBranch);
         }
         setUserBranch(userBranch);
         setUserCompany(companyName || "");
      }

      const promises = [
        fetchPermissions(url),
        fetchCompanies(url),
        fetchMetadata(url)
      ];

      if (empId && !location.state?.formData) {
        setEditingId(empId);
        promises.push(fetchSingleEmployee(empId, url));
      }

      Promise.all(promises);
    }
  }, [configLoading, baseUrl, user]);

  const [editingId, setEditingId] = useState(null);
  // NEW: For image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  // UPDATED: Company options state
  const [companyOptions, setCompanyOptions] = useState([]); // Dynamic options
  // Status options
  const statusOptions = ['Active', 'Inactive'];
  // Salutation options
  const salutationOptions = ['', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
  // Marital Status options
  const maritalOptions = ['', 'Single', 'Married', 'Divorced', 'Widowed'];
  // Nationality options (example; can be select or text)
  const nationalityOptions = ['', 'Indian', 'American', 'British', 'Emirati', 'Australian', 'Other'];
  // Gender options
  const genderOptions = ['', 'Male', 'Female', 'Other'];

  // NEW: Compute total salary when components change
  useEffect(() => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const ta = parseFloat(formData.ta) || 0;
    const oa = parseFloat(formData.oa) || 0;
    const total = basic + hra + ta + oa;
    setFormData(prev => ({ ...prev, total_salary: total.toFixed(2) }));
  }, [formData.basic_salary, formData.hra, formData.ta, formData.oa]);

  // NEW: Auto-populate department when designation is selected
  useEffect(() => {
    if (formData.employee_designation && linkedData['Employee Designation']) {
      const selectedDesig = linkedData['Employee Designation'].find(
        d => (d.name === formData.employee_designation || d.designation_name === formData.employee_designation)
      );
      if (selectedDesig) {
        const autoDept = selectedDesig.reportTo || selectedDesig.report_to || selectedDesig.department || selectedDesig.department_name;
        if (autoDept && formData.department !== autoDept) {
          setFormData(prev => ({ ...prev, department: autoDept }));
        }
      }
    }
  }, [formData.employee_designation, linkedData]);


  // NEW: Fetch Companies from CompanyDetails API
  const fetchCompanies = async (url = baseUrl) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      
      let comps = [];
      const activeContext = localStorage.getItem('active_company');
      
      if (activeContext === 'All' || (!userObj.companies && !userObj.company_name && !userObj.company)) {
        const res = await axios.get(`${url || baseUrl}/api/user-companies`, { headers: getHeaders() });
        const details = res.data.companies || res.data || [];
        comps = details.map(d => d.restaurantName || d.company_name).filter(n => n);
      } else if (userObj.companies && userObj.companies.length > 0) {
        comps = userObj.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
      } else if (userObj.company_name || userObj.company) {
        comps = [userObj.company_name || userObj.company];
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : ['POS 8'];
      setCompanyOptions(finalComps);


      if (selectedCompanies.length === 0 && finalComps.length > 0) {
        if (activeContext && activeContext !== 'All' && finalComps.includes(activeContext)) {
          setSelectedCompanies([activeContext]);
        } else if (activeContext === 'All') {
          setSelectedCompanies(finalComps);
        } else if (!activeContext && finalComps.length === 1) {
          setSelectedCompanies([finalComps[0]]);
        }
      }

      if (finalComps.length > 0) {
        const branchPromises = finalComps.map(comp => 
          axios.get(`${url || baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: { "X-Company-Name": comp, ...getHeaders() } })
            .then(res => ({ comp, data: res.data }))
        );
        const results = await Promise.all(branchPromises);
        const newMap = {};
        const allB = [];
        results.forEach(res => {
           const branches = res.data.map(b => typeof b === 'string' ? b : b.branch_name || b.branch || b.name || '').filter(b => b);
           newMap[res.comp] = branches;
           allB.push(...branches);
        });
        setCompanyBranchesMap(newMap);
        setAvailableBranches([...new Set(allB)]);
      }
    } catch (e) { console.error(e); }
  };

  const toggleCompanySelection = (comp) => {
    setSelectedCompanies(prev => {
      const isRemoving = prev.some(c => String(c).toLowerCase() === String(comp).toLowerCase());
      const next = isRemoving 
        ? prev.filter(c => String(c).toLowerCase() !== String(comp).toLowerCase()) 
        : [...prev, comp];
      
      // Update primary company field for ID generation
      const specificComps = next.filter(c => String(c).toLowerCase() !== 'all' && String(c) !== 'POS 8');
      if (specificComps.length > 0) {
        setFormData(p => ({ ...p, company: specificComps[0] }));
      }
      
      return next;
    });
  };

  // Helper str function for safety
  const str = (val) => String(val || '');





  // fetchNextEmployeeId:
  //   branchName = ""      → no branch selected at all (company-based ID)
  //   branchName = "test1" → branch selected (branch-based ID: TEST10001)
  //   skipLocalFallback = true → called from branch-selection aware effect; don't fall back to localStorage
  const fetchNextEmployeeId = async (companyName, branchName = "", skipLocalFallback = false) => {
    if (editingId) return;
    try {
      setNextIdLoading(true);
      let finalBranch = branchName;

      // Only fall back to localStorage when we are NOT explicitly tracking branch selection
      if (!finalBranch && !skipLocalFallback) {
        const activeBranch = localStorage.getItem('active_branch');
        const userStr = localStorage.getItem('user');
        let userObj = {};
        try { if (userStr) userObj = JSON.parse(userStr); } catch (_) {}
        finalBranch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All')
          ? activeBranch
          : (userObj.branch_name || userObj.branch || "");
      }

      const url = `${baseUrl}/api/next-employee-id?company_name=${encodeURIComponent(companyName || "")}&branch_name=${encodeURIComponent(finalBranch || "")}`;
      const response = await axios.get(url, { headers: getHeaders() });
      if (response.data && response.data.nextId) {
        setFormData(prev => ({ ...prev, employee_id: response.data.nextId }));
      }
    } catch (err) {
      console.error("Error fetching next ID:", err);
    } finally {
      setNextIdLoading(false);
    }
  };

  // Re-fetch employee ID whenever company OR branch selection changes.
  useEffect(() => {
    if (!editingId && baseUrl !== null) {
      const primaryComp = selectedCompanies.find(c => String(c).toLowerCase() !== 'all' && String(c) !== 'POS 8') || selectedCompanies[0] || "";
      const activeBr = selectedBranches.length > 0 ? selectedBranches[0] : "";
      
      // If the user has explicitly selected companies OR branches, we SKIP the local fallback.
      // This ensures that if they check a Company but NOT a Branch, they get the Company ID prefix.
      const userInteracted = selectedCompanies.length > 0 || selectedBranches.length > 0;
      
      fetchNextEmployeeId(primaryComp, activeBr, userInteracted);
    }
  }, [selectedCompanies, selectedBranches, editingId, baseUrl]);

  // NEW: Fetch single employee details (to ensure all fields like department are loaded)
  const fetchSingleEmployee = async (id, currentBaseUrl = baseUrl) => {
    try {
      const url = `${currentBaseUrl}/api/add-employee/${id}`;
      const response = await axios.get(url, { headers: getHeaders() });
      const emp = response.data;
      if (emp) {
        setFormData(prev => {
          let phoneIdxVal = emp.phone_number || emp.phoneNumber || prev.phone_number;
          if (emp.phone_number || emp.phoneNumber) {
            const phone = emp.phone_number || emp.phoneNumber;
            const isdMatch = isdCodes.find(c => phone.startsWith(c.code));
            if (isdMatch) {
              setSelectedISDCode(isdMatch.code);
              phoneIdxVal = phone.slice(isdMatch.code.length);
            }
          }
          const normalized = normalizeEmployeeData(emp);
          return {
            ...prev,
            ...normalized,
            phone_number: phoneIdxVal,
            password: '',
          };
        });
        setSelectedBranches(resolveList(emp, ['branch_names', 'branch_name', 'branches', 'branch']));
        setSelectedCompanies(resolveList(emp, ['company_names', 'company_name', 'companies', 'company']));
        
        const userCompanies = resolveList(emp, ['company_names', 'company_name', 'companies', 'company']);
        if (userCompanies.length > 0) {
          // Set primary company from first entry to ensure ID generation context is correct
          const specific = userCompanies.find(c => String(c).toLowerCase() !== 'all' && String(c) !== 'POS 8');
          if (specific) {
            setFormData(p => ({ ...p, company: specific }));
          }
        }
        if (emp.profile_image && emp.profile_image.startsWith('data:')) {
          setImagePreview(emp.profile_image);
        } else if (emp.profileImage && emp.profileImage.startsWith('data:')) {
          setImagePreview(emp.profileImage);
        }
      }
    } catch (err) {
      console.error("Error fetching full employee details:", err);
    }
  };



  // NEW: Robust normalization of employee data between camelCase (backend) and snake_case (metadata)
  const normalizeEmployeeData = (emp) => {
    if (!emp) return {};
    const keyMap = {
      phoneNumber: 'phone_number',
      employeeId: 'employee_id',
      employeeDesignation: 'employee_designation',
      employeeType: 'employee_type',
      dateOfBirth: 'date_of_birth',
      dateOfJoining: 'date_of_joining',
      maritalStatus: 'marital_status',
      idNumber: 'id_number',
      idExpiry: 'id_expiry',
      basicSalary: 'basic_salary',
      totalSalary: 'total_salary',
      bankName: 'bank_name',
      accountHolderName: 'account_holder_name',
      accountNumber: 'account_number',
      branchCode: 'branch_code',
      previousExperience: 'previous_experience',
      healthInfo: 'health_info',
      familyDetails: 'family_details',
      profileImage: 'profile_image',
      profile_image: 'profile_image'
    };
    
    const normalized = { ...emp };
    Object.entries(keyMap).forEach(([camel, snake]) => {
      if (emp[camel] !== undefined) normalized[snake] = emp[camel];
      if (emp[snake] !== undefined) normalized[snake] = emp[snake];
    });
    
    // Ensure department is handled (it seems consistent but just in case)
    if (emp.department) normalized.department = emp.department;
    
    return normalized;
  };

  // NEW: Helper to resolve lists (companies/branches) from various possible fields
  const resolveList = (emp, fields) => {
    for (const field of fields) {
      const val = emp[field];
      if (val) {
        if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(v => v);
        if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(v => v);
      }
    }
    return [];
  };

  // Unified restore logic for formData (handles initial edit, restore from sub-pages like Designation/Department/Company, preserves editing state)
  useEffect(() => {
    if (location.state?.editingEmployee) {
      // Initial edit load
      const emp = location.state.editingEmployee;
      const parsedId = emp._id || emp.id || emp.employeeId || emp.employee_id;
      const normalizedData = normalizeEmployeeData(emp);
      
      const parsedFormData = { 
        ...normalizedData, 
        password: ''
      };
      
      setEditingId(parsedId);
      setIsEditingDraft(false);
      setFormData(parsedFormData);
      // Set image preview
      if (emp.profileImage) {
        setImagePreview(emp.profileImage.startsWith('data:') ? emp.profileImage : null);
      }
      setSelectedBranches(resolveList(emp, ['branch_names', 'branch_name', 'branches', 'branch']));
      setSelectedCompanies(resolveList(emp, ['company_names', 'company_name', 'companies', 'company']));
    } else if (location.state?.formData) {
      // Restore from sub-page (designation/type/department/company)
      const restored = location.state.formData;
      const savedCompany = location.state.newCompanyName;

      // Capture new items from sub-pages
      const savedDesignation = location.state.newEmployeeDesignation || location.state.newDesignation;
      const savedType = location.state.newEmployeeType || location.state.newType;
      const savedDepartment = location.state.newDepartment || location.state.newDepartmentName;

      // Set ISD if provided in state
      if (location.state.selectedISDCode) {
        setSelectedISDCode(location.state.selectedISDCode);
      }

      // Check if editing (has _id OR passed isEditing flag)
      if (restored._id || location.state.editingId) {
        setEditingId(restored._id || location.state.editingId);
        setIsEditingDraft(false);
        // Set image preview
        if (restored.profileImage) {
          setImagePreview(restored.profileImage.startsWith('data:') ? restored.profileImage : null);
        }
      } else {
        setEditingId(null);
      }

      // If we got a new company (or just returned), update it and switch tab
      if (savedCompany) {
        restored.company = savedCompany;
        setActiveTab('personal');
      }

      // Update Designation, Type, Department if created and switch to Employment tab
      if (savedDesignation) {
        restored.employeeDesignation = savedDesignation;
        setActiveTab('employment');
      }
      if (savedType) {
        restored.employeeType = savedType;
        setActiveTab('employment');
      }
      if (savedDepartment) {
        restored.department = savedDepartment;
        setActiveTab('employment');
      }

      if (restored.branch_names) {
        setSelectedBranches(restored.branch_names);
      }
      setFormData(restored);

      // Refetch lists to include new items immediately
      const url = baseUrl || "";
      fetchMetadata(url);
      fetchCompanies(url); // Refresh companies
    }
  }, [location.state, baseUrl]);



  const toggleBranchSelection = (branch) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };
  // NEW: Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result })); // Base64
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code);
    setShowISDCodeDropdown(false);
  };
  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    const maxDigits = digitLengths[selectedISDCode] || 10;
    if (v.length <= maxDigits) {
      setFormData(prev => ({ ...prev, phone_number: v }));
    }
  };
  const getMaxDigits = () => digitLengths[selectedISDCode] || 10;
  const handleLinkCreateNew = (docTypeName) => {
    const endpointMap = {
      'Employee Designation': '/employee-designations',
      'Employee Type': '/employee-types',
      'Employee Department': '/employee-departments'
    };
    const path = endpointMap[docTypeName] || '/';
    navigate(path, {
      state: {
        fromAddEmployee: true,
        formData: formData,
        selectedISDCode: selectedISDCode,
        isEditing: !!editingId,
        editingId: editingId
      }
    });
  };

  const renderField = (field) => {
    if (field.hidden) return null;

    // Specialized handling for ID and Phone
    if (field.id === 'phone_number') {
       return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', width: '100px' }}>
              <button
                type="button"
                onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}
                style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {selectedISDCode}
              </button>
              {showISDCodeDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, width: '200px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                  {isdCodes.map(c => (
                    <div key={c.code} onClick={() => handleISDCodeSelect(c.code)} style={{ padding: '10px 15px', cursor: 'pointer' }} className="isd-option">
                      {c.code} ({c.country})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handlePhoneNumberChange}
              placeholder={`Enter ${getMaxDigits()} digits`}
              style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              required={field.mandatory}
            />
          </div>
       );
    }

    const commonProps = {
      id: field.id,
      name: field.id,
      value: formData[field.id] || '',
      onChange: handleChange,
      required: field.mandatory,
      className: "form-input-dynamic",
      style: { width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px' }
    };

    switch (field.type) {
      case 'Select':
        return (
          <select {...commonProps}>
             <option value="">Select {field.label}</option>
             {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'Date':
        return <input type="date" {...commonProps} />;
      case 'Password':
        return (
          <input 
            type="password" 
            {...commonProps} 
            placeholder={editingId ? "Leave blank to keep current" : `Enter ${field.label}`}
            required={field.mandatory && !editingId}
          />
        );
      case 'Number':
        return <input type="number" {...commonProps} />;
      case 'Text':
        return <textarea {...commonProps} rows="3" />;
      case 'Attach Image':
        return (
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: '#f1f5f9', borderRadius: '12px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}>
               <FaUpload /> Upload Image
               <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
             </label>
             {imagePreview && (
               <div style={{ position: 'relative' }}>
                 <img src={imagePreview} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                 <button onClick={() => {setImagePreview(null); setFormData(p => ({...p, profile_image: ''}))}} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '18px', height: '18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', fontSize: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                   <FaTimes />
                 </button>
               </div>
             )}
           </div>
        );
      case 'Table':
        if (field.link_doctype) {
           const options = linkedData[field.link_doctype] || [];
           return (
             <select {...commonProps} onChange={(e) => {
               if (e.target.value === 'create_new') {
                 handleLinkCreateNew(field.link_doctype);
               } else {
                 handleChange(e);
               }
             }}>
               <option value="">Select {field.label}</option>
               {options.map(opt => {
                 const val = typeof opt === 'string' ? opt : (opt.name || opt.department_name || opt.restaurantName || opt._id);
                 return <option key={val} value={val}>{val}</option>;
               })}
               <option value="create_new" style={{ fontWeight: 'bold', color: '#2563eb' }}>+ Create New {field.label}</option>
             </select>
           );
        }
        return <input type="text" {...commonProps} />;
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  // Helper to handle Company Selection from Dropdown
  const handleCompanyChange = (e) => {
    const value = e.target.value;
    if (value === 'create_new') {
      navigate('/company-details', {
        state: {
          returnTo: '/add-employee',
          preservedState: {
            formData: { ...formData, company: '' },
            selectedISDCode: selectedISDCode,
            isEditing: !!editingId,
            editingId: editingId
          }
        }
      });
    } else {
      setFormData(prev => ({ ...prev, company: value }));
    }
  };
  // Validation - Full for submit
  const validateForm = () => {
    const active_company = localStorage.getItem('active_company');
    const isGroupOrCompanyAdmin = isGroupAdmin || isCompanyAdmin;
    
    if (isGroupOrCompanyAdmin) {
      if (isGroupAdmin && selectedCompanies.length === 0) {
        setError('Please select at least one company.');
        return false;
      }
    }
    if (baseUrl === null) {
      setError('Server configuration is loading. Please wait...');
      return false;
    }

    if (!metadata) return true;

    // Minimal required fields from metadata
    let required = metadata.fields.filter(f => f.mandatory && !f.hidden).map(f => f.id);
    
    if (editingId) {
      // If editing, password is not mandatory even if metadata says so
      required = required.filter(id => id !== 'password');
    } else {
      // If creating, ensure password is in the list
      if (!required.includes('password')) {
        required.push('password');
      }
    }

    const missingFields = required.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      const labels = missingFields.map(id => {
        const field = metadata.fields.find(f => f.id === id);
        return field ? field.label : (id === 'password' ? 'Password' : id);
      });
      setError(`Please fill in the following required fields: ${labels.join(', ')}.`);
      return false;
    }

    // Validate salary fields only if provided (optional now)
    const salaryFields = ['basic_salary', 'hra', 'ta', 'oa'];
    for (const field of salaryFields) {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) < 0)) {
        setError(`${field.replace(/_/g, ' ').toUpperCase()} must be a valid positive number if provided.`);
        return false;
      }
    }

    const phoneMaxDigits = getMaxDigits();
    if (formData.phone_number.length !== phoneMaxDigits) {
      setError(`Phone number must be exactly ${phoneMaxDigits} digits.`);
      return false;
    }

    // Date validations only if provided
    const dates = ['date_of_birth', 'date_of_joining', 'id_expiry'];
    for (const dateField of dates) {
      if (formData[dateField]) {
        const date = new Date(formData[dateField]);
        if (isNaN(date.getTime())) {
          setError(`Invalid date format for ${dateField.replace(/_/g, ' ').toLowerCase()}. Use YYYY-MM-DD.`);
          return false;
        }
      }
    }

    // Email validation (always required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };
  // Handle confirmation submit
  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    if (!validateForm()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      let url, method, dataToSend;
      // Normal create/update
      url = baseUrl ? `${baseUrl}/api/add-employee` : '/api/add-employee';
      method = editingId ? 'put' : 'post';
      if (editingId) url += `/${editingId}`;
      // Map metadata-driven snake_case keys to camelCase keys expected by the backend
      const keyMap = {
        phone_number: 'phoneNumber',
        employee_id: 'employeeId',
        employee_designation: 'employeeDesignation',
        employee_type: 'employeeType',
        date_of_birth: 'dateOfBirth',
        date_of_joining: 'dateOfJoining',
        marital_status: 'maritalStatus',
        id_number: 'idNumber',
        id_expiry: 'idExpiry',
        basic_salary: 'basicSalary',
        total_salary: 'totalSalary',
        bank_name: 'bankName',
        account_holder_name: 'accountHolderName',
        account_number: 'accountNumber',
        branch_code: 'branchCode',
        previous_experience: 'previousExperience',
        health_info: 'healthInfo',
        family_details: 'familyDetails',
        profile_image: 'profileImage'
      };

      const mappedData = { ...formData };
      Object.entries(keyMap).forEach(([snake, camel]) => {
        if (mappedData[snake] !== undefined) {
          mappedData[camel] = mappedData[snake];
        }
      });

      const activeContext = localStorage.getItem('active_company') || 'All';
      const activeBranchContext = localStorage.getItem('active_branch') || 'All Branches';
      
      let finalCompanies = selectedCompanies;
      if (finalCompanies.length === 0 && (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 0) {
        finalCompanies = ['All Companies'];
      }
      
      let finalBranches = selectedBranches;
      if (finalBranches.length === 0 && (isGroupAdmin || isCompanyAdmin) && availableBranches.length > 0) {
        finalBranches = ['All Branches'];
      }

      dataToSend = {
        ...mappedData,
        phoneNumber: `${selectedISDCode}${formData.phone_number}`,
        hra: formData.hra || '',
        ta: formData.ta || '',
        oa: formData.oa || '',
        basicSalary: formData.basic_salary || '',
        branch_name: finalBranches[0] || "",
        branch_names: finalBranches,
        company: finalCompanies[0] || "", // Ensure 'company' is synced with finalCompanies
        company_name: finalCompanies[0] || "",
        company_names: finalCompanies,
      };
      if (editingId && !dataToSend.password) {
        delete dataToSend.password;
      }

      const headers = getHeaders();
      const response = await axios({
        method,
        url,
        data: dataToSend,
        headers,
      });
      const successMsg = editingId ? 'Employee updated successfully!' : 'Employee created successfully!';
      // Reset form
      setFormData({
        name: '', phone_number: '', email: '', gender: '', date_of_birth: '', date_of_joining: '', company: 'POS 8', status: 'Active', salutation: '', marital_status: '', id_number: '', id_expiry: '', address: '', employee_designation: '', employee_type: '',
        basic_salary: '', hra: '', ta: '', oa: '', total_salary: '', username: '', password: '', bank_name: '', account_holder_name: '', account_number: '', branch_code: '',
        nationality: '', education: '', previous_experience: '', skills: '', health_info: '', family_details: '', profile_image: '', department: '', employee_id: '',
      });
      setImagePreview(null);
      setSelectedISDCode("+971");
      setEditingId(null);

      setTimeout(() => {
        // NEW: Check for returnTo state
        if (location.state && location.state.returnTo) {
          const newId = response.data._id || response.data.employee?._id || response.data.id;
          navigate(location.state.returnTo, {
            state: {
              newGeneralEmployeeId: newId,
              preservedState: location.state.preservedState
            }
          });
        } else {
          navigate('/admin'); // Navigate to employee list page on success
        }
      }, 2000);
      setMessage(successMsg);
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} employee`;
      // If error, do not navigate, stay on form
      setError(errorMsg);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId && !canWrite) {
      setPermModalMsg("You do not have permission to edit employees.");
      setShowPermModal(true);
      return;
    }
    if (!editingId && !canCreate) {
      setPermModalMsg("You do not have permission to create employees.");
      setShowPermModal(true);
      return;
    }
    if (!validateForm()) return;
    setShowConfirmation(true);
  };
  const cancelEdit = () => {
    setEditingId(null);
    // Reset form to snake_case IDs
    setFormData({
      name: '', phone_number: '', email: '', gender: '', date_of_birth: '', date_of_joining: '', company: 'POS 8', status: 'Active', salutation: '', marital_status: '', id_number: '', id_expiry: '', address: '', employee_designation: '', employee_type: '',
      basic_salary: '', hra: '', ta: '', oa: '', total_salary: '', username: '', password: '', bank_name: '', account_holder_name: '', account_number: '', branch_code: '',
      nationality: '', education: '', previous_experience: '', skills: '', health_info: '', family_details: '', profile_image: '', department: '', employee_id: '',
    });
    setImagePreview(null);
    setSelectedISDCode("+971");
    setActiveTab('details');
  };

  const getFieldsForTab = (tabKey) => {
    if (!metadata) return [];
    return metadata.fields.filter(field => getFieldTab(field.id) === tabKey);
  };

  // NEW: Get required fields list dynamically
  const getRequiredFields = () => {
    if (!metadata) return ['Full Name', 'Phone', 'Email', 'Username', 'Password'];
    const required = metadata.fields.filter(f => f.mandatory && !f.hidden).map(f => f.label);
    if (!editingId) {
      required.push('Password');
    }
    return required;
  };
  const TabButton = ({ tabKey, label, icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabKey)}
      style={{
        padding: '10px 20px',
        backgroundColor: activeTab === tabKey ? '#3498db' : '#ecf0f1',
        color: activeTab === tabKey ? '#fff' : '#2c3e50',
        border: 'none',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: activeTab === tabKey ? '600' : 'normal',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
      disabled={loading}
    >
      {icon && icon} {label}
    </button>
  );
  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}>
          <FaUserTie style={{ fontSize: '48px', marginBottom: '20px', color: '#fff' }} />
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Access Denied</h2>
          <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>You do not have permission to view the Add Employee page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none', color: '#fff' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  const showCompanyAssign = (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 0;
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  const showBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && availableBranches.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {showAssignmentModal && (
        <div className="add-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="add-modal" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Employee Scope Assignments</span>
              <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body">
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '15px' }}><FaUsers style={{ marginRight: '8px' }}/> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedCompanies.includes(comp)} 
                          onChange={(e) => { 
                            if (e.target.checked) setSelectedCompanies(prev => [...prev, comp]);
                            else setSelectedCompanies(prev => prev.filter(c => c !== comp));
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
                  <h4 style={{ color: '#10b981', marginBottom: '15px' }}><FaMapMarkerAlt style={{ marginRight: '8px' }}/> Select Branch</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branchName, idx) => {
                      const bName = typeof branchName === 'string' ? branchName : (branchName.branch_name || branchName.name || branchName);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedBranches.includes(bName)} 
                            onChange={(e) => { 
                              if (e.target.checked) setSelectedBranches(prev => [...prev, bName]);
                              else setSelectedBranches(prev => prev.filter(b => b !== bName));
                            }} 
                            style={{ width: '18px', height: '18px', accentColor: '#10b981' }} 
                          />
                          {bName}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignmentModal(false)} style={{ padding: '12px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Permission Denied Modal */}
      {showPermModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
          }}>
            <div style={{ color: '#e74c3c', fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Permission Denied</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>{permModalMsg}</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowPermModal(false)}
              style={{ background: '#3498db', border: 'none', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
      {/* Fixed Back Button */}
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
      {/* Main Container - Increased width to 1200px */}
      <div style={{
        maxWidth: '1200px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
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
            <FaUserTie style={{ color: '#3498db', fontSize: '2rem' }} />
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {(isGroupAdmin || isCompanyAdmin || checkIsAdmin(user || JSON.parse(localStorage.getItem('user') || '{}'))) && (
              <button
                type="button"
                onClick={() => setShowCustomizeModal(true)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: 'rgb(46, 204, 113)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                disabled={loading}
              >
                <FaCog /> Customize
              </button>
            )}
            {/* NEW: Required Fields Button */}
            <button
              type="button"
              onClick={() => setShowRequiredFields(true)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#f39c12',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#e67e22')}
              disabled={loading}
            >
              <FaExclamationTriangle /> Required Fields
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#7f8c8d')}
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              form="employeeForm"
              disabled={loading}
              style={{
                padding: '10px 15px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => !loading && (
                e.target.style.transform = 'translateY(-2px)',
                e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)'
              )}
              onMouseOut={(e) => !loading && (
                e.target.style.transform = 'translateY(0)',
                e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)'
              )}
            >
              <FaSave /> {loading ? 'Processing...' : (editingId ? 'Update Employee' : 'Save Employee')}
            </button>
          </div>
        </div>
        {/* Alerts */}
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
            <FaTimes style={{ fontSize: '1.2rem' }} />
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
            <FaClock style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {message}
          </div>
        )}
        <form id="employeeForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
          {/* Tab Navigation - Expanded, no overflow */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #bdc3c7', overflow: 'hidden' }}>
            {getTabs().map(tab => (
              <TabButton key={tab.key} tabKey={tab.key} label={tab.label} />
            ))}
          </div>
          {/* Tab Content */}
          <div style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {metadata ? (
              <div style={{ border: '1px solid #bdc3c7', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '1.2rem', textTransform: 'capitalize' }}>
                  {getTabs().find(t => t.key === activeTab)?.label || 'Details'}
                </h3>
                
                {/* Employee ID Display */}
                {activeTab === getTabs()[0].key && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaIdCard style={{ color: '#3498db' }} /> Employee ID {nextIdLoading && <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>(Updating...)</span>}
                    </label>
                    <input 
                      type="text" 
                      value={formData.employee_id || formData.employeeId || ''} 
                      readOnly 
                      placeholder="Auto-generated based on company & branch"
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        border: '1.5px solid #3498db', 
                        borderRadius: '12px', 
                        fontSize: '1rem', 
                        backgroundColor: '#f0f8ff',
                        color: '#2c3e50',
                        fontWeight: '600',
                        outline: 'none',
                        cursor: 'not-allowed'
                      }} 
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {getFieldsForTab(activeTab).filter(f => f.id !== 'employee_id' && f.type !== 'Section Break').map(field => (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: field.type === 'Text' ? 'span 2' : 'auto' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50' }}>{field.label} {field.mandatory ? '*' : ''}</label>
                      {renderField(field)}
                    </div>
                  ))}
                  
                  {/* Password field fallback for credentials tab if not in metadata */}
                  {(activeTab === 'credentials' || (getTabs().find(t => t.key === activeTab)?.label.toLowerCase().includes('credentials'))) && metadata && !metadata.fields.find(f => f.id === 'password') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50' }}>Password {editingId ? '(Leave blank to keep current)' : '*'}</label>
                      {renderField({ id: 'password', label: 'Password', type: 'Password', mandatory: !editingId })}
                    </div>
                  )}
                </div>

                {/* Company Selection */}
                {activeTab === getTabs()[0].key && showCompanyAssign && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
                      <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBuilding style={{ color: '#3498db' }} /> Company Assignment *
                      </label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '12px',
                        border: '1.5px solid #bdc3c7',
                        borderRadius: '8px',
                        minHeight: '50px',
                        backgroundColor: '#ffffff'
                      }}>
                        {companyOptions.map((comp, i) => (
                          <div key={i} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '6px 12px',
                            backgroundColor: selectedCompanies.some(c => String(c).toLowerCase() === String(comp).toLowerCase()) ? '#e3f2fd' : '#f5f5f5',
                            borderRadius: '20px',
                            border: `1px solid ${selectedCompanies.some(c => String(c).toLowerCase() === String(comp).toLowerCase()) ? '#3498db' : '#e0e0e0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => toggleCompanySelection(comp)}
                          >
                            <input
                              type="checkbox"
                              id={`company-${i}`}
                              checked={selectedCompanies.some(c => String(c).toLowerCase() === String(comp).toLowerCase())}
                              onChange={() => {}} 
                              style={{ cursor: 'pointer' }}
                            />
                            <label htmlFor={`company-${i}`} style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', fontWeight: selectedCompanies.includes(comp) ? '600' : 'normal', color: '#333' }}>{comp}</label>
                          </div>
                        ))}
                      </div>
                  </div>
                )}
                
                {/* Branch Selection */}
                {activeTab === getTabs()[0].key && showBranchAssign && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
                    <label style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaBuilding style={{ color: '#3498db' }} /> Branch Assignment *
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px',
                      border: '1.5px solid #bdc3c7',
                      borderRadius: '8px',
                      minHeight: '50px',
                      backgroundColor: '#ffffff'
                    }}>
                      {availableBranches.map((branch, i) => (
                        <div key={branch} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '6px 12px',
                            backgroundColor: selectedBranches.some(b => String(b).toLowerCase() === String(branch).toLowerCase()) ? '#e3f2fd' : '#f5f5f5',
                            borderRadius: '20px',
                            border: `1px solid ${selectedBranches.some(b => String(b).toLowerCase() === String(branch).toLowerCase()) ? '#3498db' : '#e0e0e0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => toggleBranchSelection(branch)}
                        >
                          <input
                            type="checkbox"
                            id={`branch-cb-${branch}`}
                            checked={selectedBranches.some(b => String(b).toLowerCase() === String(branch).toLowerCase())}
                            onChange={() => {}} 
                            style={{ cursor: 'pointer' }}
                          />
                          <label htmlFor={`branch-cb-${branch}`} style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', fontWeight: selectedBranches.some(b => String(b).toLowerCase() === String(branch).toLowerCase()) ? '600' : 'normal', color: '#333' }}>{branch}</label>
                        </div>
                      ))}
                    </div>
                    <small style={{ color: '#7f8c8d', marginTop: '5px' }}>Assign this employee to one or more branches.</small>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '20px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#7f8c8d', fontWeight: '500' }}>Loading Employee Configuration...</p>
              </div>
            )}
          </div>
        </form>
      </div>
      {/* NEW: Required Fields Modal */}
      {showRequiredFields && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowRequiredFields(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'left',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              position: 'relative',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                color: '#f39c12',
                fontSize: '1.5rem',
                marginBottom: '15px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <FaExclamationTriangle /> Required Fields
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {getRequiredFields().map((field, index) => (
                <li
                  key={index}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #ecf0f1',
                    color: '#2c3e50',
                    fontSize: '1rem'
                  }}
                >
                  • {field}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setShowRequiredFields(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#7f8c8d')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#95a5a6')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal - Warning before submit */}
      {showConfirmation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowConfirmation(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              maxWidth: '450px',
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                color: '#f39c12',
                fontSize: '1.5rem',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}
            >
              Confirm Action
            </div>
            <p style={{ margin: 0, color: '#2c3e50', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to {editingId ? 'update' : 'save'} this employee? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={handleConfirmSubmit}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
              >
                Submit
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#7f8c8d')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#95a5a6')}
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
        onRefresh={() => fetchMetadata(baseUrl)}
        targetDocType="Employee"
      />
    </div>
  );
};

export default AddEmployee;
