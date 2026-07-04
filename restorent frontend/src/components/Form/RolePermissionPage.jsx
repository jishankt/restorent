// src/components/Form/RolePermissionPage.jsx
// RolePermissionPage.jsx - Updated: Manages role-based access control for all modules.
// Includes 'Delivery Persons' (delivery_persons) in the Employee module group.
// Hierarchy Access Assignment: Defines which designations a role can access (data scoping).

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserShield, FaSave, FaArrowLeft, FaCheckDouble, FaTimes,
    FaInfoCircle, FaSearch, FaLayerGroup, FaSitemap, FaTrashAlt
} from 'react-icons/fa';

const RolePermissionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [permissions, setPermissions] = useState({});
    const [isAdminRole, setIsAdminRole] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [workflowSettings, setWorkflowSettings] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(() => {
        const uStr = localStorage.getItem('user');
        const u = uStr ? JSON.parse(uStr) : {};
        const uComp = u.company_name || u.company;
        const isGlobal = !uComp || uComp === 'All' || u.role === 'System Admin' || u.role === 'Super Admin';
        
        // PRIORITY: User Login Context (if restricted) -> Navigation State -> LocalStorage -> Default
        if (!isGlobal && uComp) return uComp;
        
        const navComp = location.state?.company;
        if (navComp && navComp !== 'All') return navComp;
        return localStorage.getItem('active_company') || 'All';
    });
    const [companies, setCompanies] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(() => {
        const uStr = localStorage.getItem('user');
        const u = uStr ? JSON.parse(uStr) : {};
        const uComp = u.company_name || u.company;
        const isGlobal = !uComp || uComp === 'All' || u.role === 'System Admin' || u.role === 'Super Admin';
        const userBranch = u.branch_name || u.branch;
        
        // PRIORITY: User Login Context (if restricted) -> Navigation State -> LocalStorage -> Default
        if (!isGlobal && userBranch && userBranch !== 'All') return userBranch;
        
        const navBranch = location.state?.branch === 'N/A' ? 'All' : location.state?.branch;
        return navBranch || 'All';
    });
    const [branches, setBranches] = useState([]);
    
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const currentUserCompany = currentUser.company_name || currentUser.company;
    const isGlobalMaster = !currentUserCompany || currentUserCompany === 'All' || currentUser.role === 'System Admin' || currentUser.role === 'Super Admin';
    const currentUserBranch = currentUser.branch_name || currentUser.branch;

    // Helper to get headers with tenancy
    const getHeaders = (branch = null, comp = null) => {
        const headers = { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        const activeContext = localStorage.getItem('active_company');
        const token = localStorage.getItem('token');
      
      // Authorization
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Resolve Company Priority: 
      // 1. Explicit argument
      // 2. State-level selectedCompany (from User List or Toggle)
      // 3. LocalStorage active_company
      // 4. User default
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const defaultCompany = user.company_name || user.company;
      
      const resolvedCompany = comp || selectedCompany || activeContext || defaultCompany || 'All';
      if (resolvedCompany) headers['X-Company-Name'] = resolvedCompany;
      
      const resolvedBranch = branch || selectedBranch || (user.branch_name || user.branch || null);
      if (resolvedBranch && !['all', 'all branches', 'any', 'n/a', 'all branches (shared)'].includes(String(resolvedBranch).toLowerCase())) {
          headers['X-Branch-Name'] = resolvedBranch;
      }
      
      return headers;
    };

    // Hierarchy / Designation Access State
    const [showHierarchyModal, setShowHierarchyModal] = useState(false);
    const [allDesignations, setAllDesignations] = useState([]);
    const [accessibleDesignations, setAccessibleDesignations] = useState([]);

    const [activeModalPageId, setActiveModalPageId] = useState(null);

    // Define Grouped Modules - Ensure 'Delivery Persons' is present
    const moduleGroups = [
        {
            name: 'Multi-Branch Management',
            pages: [
                { id: 'manage_companies', name: 'Manage Companies' },
                { id: 'manage_branches', name: 'Manage Branches' },
                { id: 'company_details', name: 'Company Details' }
            ]
        },
        {
            name: 'Daily Operations',
            pages: [
                { id: 'home', name: 'Home Screen' },
                { id: 'opening', name: 'Opening Entry' },
                { id: 'closing', name: 'Closing Entry' }
            ]
        },
        {
            name: 'Billing & POS',
            pages: [
                { id: 'cash', name: 'Cash Page' },
                { id: 'card', name: 'Card Page' },
                { id: 'saved_orders', name: 'Saved Orders' }
            ]
        },
        {
            name: 'Order Management',
            pages: [
                { id: 'tables', name: 'Table Management / Booking' },
                { id: 'active_orders', name: 'Active Orders' },
                { id: 'kitchen', name: 'Kitchen Display' },
                { id: 'bearer', name: 'Bearer View' },
                { id: 'frontpage', name: 'Front Page' }
            ]
        },
        {
            name: 'Master',
            pages: [
                { id: 'customer_list', name: 'View All Customers' },
                { id: 'create_customer', name: 'Create Customer' },
                { id: 'create_customer_group', name: 'Customer Groups' },
                { id: 'item_list', name: 'View All Items' },
                { id: 'create_item', name: 'Add Item' },
                { id: 'add_item_group', name: 'Item Groups' },
                { id: 'add_kitchen', name: 'Kitchens' },
                { id: 'add_ingredients', name: 'Ingredients' },
                { id: 'create_variant', name: 'Variants' },
                { id: 'combo_offer', name: 'Combo Offers' },
                { id: 'hidden_items', name: 'Hidden Items' },
                { id: 'address_structure', name: 'Address Structure' }
            ]
        },
        {
            name: 'Employee',
            pages: [
                { id: 'employee_list', name: 'Employee List' },
                { id: 'delivery_persons', name: 'Delivery Persons' }, // Ensure this matches Employee.jsx check
                { id: 'user_management', name: 'Users' },
                { id: 'add_employee', name: 'Add New Employee' },
                { id: 'employee_designations', name: 'Designations' },
                { id: 'employee_types', name: 'Types' },
                { id: 'employee_departments', name: 'Departments' }
            ]
        },
        {
            name: 'Roaster App',
            pages: [
                { id: 'roaster', name: 'Roaster' }
            ]
        },
        {
            name: 'Vehicle Management',
            pages: [
                { id: 'vehicle_management', name: 'Vehicle Mgt' }
            ]
        },
        {
            name: 'Schedule',
            pages: [
                { id: 'schedule_master', name: 'Schedule Master' },
                { id: 'schedule_assign', name: 'Schedule Assign' },
                { id: 'schedule_rule', name: 'Schedule Rules' },
                { id: 'extended_doctype', name: 'Extended Doctype' }
            ]
        },
        {
            name: 'Attendance Management',
            pages: [
                { id: 'create_attendance', name: 'Create Attendance' },
                { id: 'view_attendance', name: 'View Attendance' }
            ]
        },
        {
            name: 'Leave Management',
            pages: [
                { id: 'leave_types', name: 'Leave Types' },
                { id: 'leave_allocation', name: 'Leave Allocation' },
                { id: 'leave_apply', name: 'Apply Leave' },
                { id: 'holiday_list', name: 'Holiday List' }
            ]
        },
        {
            name: 'Salary Management',
            pages: [
                { id: 'salary_slip', name: 'Salary Receipt' },
                { id: 'salary_list', name: 'Salary List' }
            ]
        },
        {
            name: 'Add New Table',
            pages: [
                { id: 'add_table', name: 'Add New Table' }
            ]
        },
        {
            name: 'Settings',
            pages: [
                { id: 'company_details', name: 'Company Details' },
                { id: 'print_settings', name: 'Print Settings' },
                { id: 'email_settings', name: 'Email Settings' },
                { id: 'backup', name: 'Backups' },
                { id: 'system_settings', name: 'System Settings' },
                { id: 'import_data', name: 'Advanced Import' },
                { id: 'working', name: 'Working Days' },
                { id: 'doctype', name: 'DocType Management' },
                { id: 'tax_master', name: 'Tax Master' }
            ]
        },
        {
            name: 'Purchase Module',
            pages: [
                { id: 'purchase', name: 'Purchase Module' }
            ]
        },
        {
            name: 'Sales',
            pages: [
                { id: 'pos', name: 'Sales Invoice' },
                { id: 'sales_report', name: 'Sales Report' },
                { id: 'sales_kanban', name: 'Sales Kanban' }
            ]
        },
        {
            name: 'Reports & Analytics',
            pages: [
                { id: 'trip_report', name: 'Trip Report' },
                { id: 'pos_balance', name: 'POS Balance' }
            ]
        },
        {
            name: 'Notifications Control',
            pages: [
                { id: 'notifications', name: 'General Notifications' },
                { id: 'leave_apply_notif', name: 'Leave Apply Notification' },
                { id: 'schedule_assign_notif', name: 'Schedule Assign Notification' },
                { id: 'voice_support', name: 'Voice Support' }
            ]
        },
        {
            name: 'Role Management',
            pages: [
                { id: 'RolePermissions', name: 'Role Permissions' }
            ]
        },
        {
            name: 'Admin Dashboard Control',
            pages: [
                { id: 'dashboard', name: 'Main Dashboard' },
                { id: 'admin', name: 'Admin Panel Access' }
            ]
        }

    ];

    const allPages = moduleGroups.flatMap(g => g.pages);

    useEffect(() => {
        fetchCompanies();
    }, []); // Only fetch these once on mount

    useEffect(() => {
        if (selectedCompany && selectedCompany !== 'All') {
            fetchBranches(selectedCompany);
        } else {
            setBranches([]);
        }
    }, [selectedCompany]);

    useEffect(() => {
        fetchRoles();
        fetchUsers();
        
        const updateSettings = () => {
            if (selectedCompany) {
                fetchWorkflowSettings(selectedCompany, selectedBranch);
            }
        };
        
        updateSettings();
        
        window.addEventListener('visibilityChange', updateSettings);
        window.addEventListener('companyChange', updateSettings);
        
        return () => {
            window.removeEventListener('visibilityChange', updateSettings);
            window.removeEventListener('companyChange', updateSettings);
        };
    }, [selectedCompany, selectedBranch]);

    useEffect(() => {
        if (location.state?.role) {
            setSelectedRole(location.state.role);
        }
        // Force context update if navigation state changes
        if (location.state?.company && location.state.company !== 'All') {
            let navComp = location.state.company;
            // FIX: If the user's company is "All, companyone", extract just "companyone" 
            // so we don't send unauthorized comma-separated strings to the backend.
            if (navComp.includes(',')) {
                const parts = navComp.split(',').map(p => p.trim()).filter(p => p.toLowerCase() !== 'all');
                if (parts.length > 0) {
                    navComp = parts[0];
                } else {
                    navComp = 'All';
                }
            }
            setSelectedCompany(navComp);
        }
        if (location.state?.branch) {
            const branchVal = location.state.branch === 'N/A' ? 'All' : location.state.branch;
            setSelectedBranch(branchVal);
        }
    }, [location.state]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/companies-public', { headers: getHeaders() });
            const companyList = response.data || [];
            setCompanies(companyList);
            
            // If restricted to a single company, auto-select it
            if (companyList.length === 1 && (!selectedCompany || selectedCompany === 'All')) {
                setSelectedCompany(companyList[0].name);
            }
        } catch (err) {
            console.error("Failed to fetch companies", err);
        }
    };

    const fetchBranches = async (companyName) => {
        try {
            const response = await axios.get(`/api/branches-public/${companyName}`, { headers: getHeaders() });
            setBranches(response.data || []);
        } catch (err) {
            console.error("Failed to fetch branches", err);
            setBranches([]);
        }
    };

    const fetchWorkflowSettings = async (comp, branch) => {
        try {
            const params = { company: comp || 'All' };
            if (branch && branch !== 'All') {
                params.branch = branch;
            }
            const response = await axios.get(`/api/workflow-visibility`, { 
                params, 
                headers: getHeaders(branch, comp) 
            });
            setWorkflowSettings(response.data.settings?.global_modules || {});
        } catch (err) {
            console.error("Failed to fetch workflow settings", err);
            setWorkflowSettings({}); // Fallback
        }
    };

    const isFeatureAllowed = (pageId) => {
        if (!workflowSettings) return true; // Still loading

        // Mapping Role-Permissions Page IDs to exact { modId, pageKey } in workflowSettings
        const permissionToPageMap = {
            // Multi-Branch Management
            'manage_companies': { modId: 'multi_branch', pageKey: 'ManageCompanies' },
            'manage_branches': { modId: 'multi_branch', pageKey: 'ManageBranches' },
            
            // Daily Operations (POS Billing)
            'home': { modId: 'pos_billing', pageKey: 'HomeDashboard' },
            'opening': { modId: 'pos_billing', pageKey: 'OpeningEntry' },
            'closing': { modId: 'pos_billing', pageKey: 'ClosingEntry' },
            
            // Billing & POS
            'cash': { modId: 'pos_billing', pageKey: 'CashPayment' },
            'card': { modId: 'pos_billing', pageKey: 'CardPayment' },
            'saved_orders': { modId: 'pos_billing', pageKey: 'SavedOrders' },
            
            // Order Management
            'tables': { modId: 'table_management', pageKey: 'TableView' },
            'active_orders': { modId: 'tracking', pageKey: 'ActiveOrders' },
            'kitchen': { modId: 'kitchen_display', pageKey: 'KitchenView' },
            'bearer': { modId: 'pos_billing', pageKey: 'BearerPage' },
            'frontpage': { modId: 'table_management', pageKey: 'FrontPage' },
            
            // Master (Inventory & Customers)
            'customer_list': { modId: 'customer_module', pageKey: 'CustomerList' },
            'create_customer': { modId: 'customer_module', pageKey: 'CreateCustomer' },
            'create_customer_group': { modId: 'customer_module', pageKey: 'CustomerGroup' },
            'item_list': { modId: 'inventory', pageKey: 'ItemsList' },
            'create_item': { modId: 'inventory', pageKey: 'CreateItem' },
            'add_item_group': { modId: 'inventory', pageKey: 'AddItemGroup' },
            'add_kitchen': { modId: 'kitchen_display', pageKey: 'AddKitchen' },
            'add_ingredients': { modId: 'inventory', pageKey: 'AddIngredients&Nutrition' },
            'create_variant': { modId: 'inventory', pageKey: 'CreateVariant' },
            'combo_offer': { modId: 'inventory', pageKey: 'ComboOffer' },
            'hidden_items': { modId: 'inventory', pageKey: 'HiddenItems' },
            'address_structure': { modId: 'address_module', pageKey: 'AddressStructure' },
            
            // Employee / HR
            'employee_list': { modId: 'hr_payroll', pageKey: 'EmployeeList' },
            'delivery_persons': { modId: 'hr_payroll', pageKey: 'DeliveryPersons' },
            'user_management': { modId: 'hr_payroll', pageKey: 'Users' },
            'add_employee': { modId: 'hr_payroll', pageKey: 'AddEmployee' },
            'employee_designations': { modId: 'hr_payroll', pageKey: 'EmployeeDesignations' },
            'employee_types': { modId: 'hr_payroll', pageKey: 'EmployeeTypes' },
            'employee_departments': { modId: 'hr_payroll', pageKey: 'EmployeeDepartments' },
            
            // Roaster App
            'roaster': { modId: 'hr_payroll', pageKey: 'Roaster' },
            
            // Vehicle
            'vehicle_management': { modId: 'vehicle_module', pageKey: 'VehicleManagement' },
            
            // Schedule
            'schedule_master': { modId: 'hr_payroll', pageKey: 'ScheduleMaster' },
            'schedule_assign': { modId: 'hr_payroll', pageKey: 'ScheduleAssignEmployee' },
            'schedule_rule': { modId: 'hr_payroll', pageKey: 'ScheduleMaster' }, // Fallback to master
            'extended_doctype': { modId: 'hr_payroll', pageKey: 'ExtendedDocType' },
            
            // Attendance
            'create_attendance': { modId: 'hr_payroll', pageKey: 'Attendance' },
            'view_attendance': { modId: 'hr_payroll', pageKey: 'AttendanceView' },
            
            // Leave Management
            'leave_types': { modId: 'hr_payroll', pageKey: 'LeaveType' },
            'leave_allocation': { modId: 'hr_payroll', pageKey: 'LeaveAllocation' },
            'leave_apply': { modId: 'hr_payroll', pageKey: 'LeaveApply' },
            'holiday_list': { modId: 'hr_payroll', pageKey: 'HolidayList' },
            
            // Salary Management
            'salary_slip': { modId: 'hr_payroll', pageKey: 'SalarySlip' },
            'salary_list': { modId: 'hr_payroll', pageKey: 'SalaryReceiptList' },
            
            // Add Table
            'add_table': { modId: 'table_management', pageKey: 'AddTable' },
            
            // Settings
            'company_details': { modId: 'settings', pageKey: 'CompanyDetails' }, // Or multi_branch
            'print_settings': { modId: 'settings', pageKey: 'PrintSettings' },
            'email_settings': { modId: 'settings', pageKey: 'EmailSettings' },
            'backup': { modId: 'settings', pageKey: 'Backups' },
            'system_settings': { modId: 'settings', pageKey: 'SystemSettings' },
            'import_data': { modId: 'settings', pageKey: 'AdvancedImport' },
            'working': { modId: 'settings', pageKey: 'WorkingDays' },
            'doctype': { modId: 'settings', pageKey: 'DocTypeManagement' },
            'tax_master': { modId: 'settings', pageKey: 'TaxMaster' },
            
            // Purchase
            'purchase': { modId: 'purchase', pageKey: 'PurchaseOrder' },
            
            // Sales / Reports
            'pos': { modId: 'reports', pageKey: 'SalesInvoice' },
            'sales_report': { modId: 'reports', pageKey: 'SalesReport' },
            'sales_kanban': { modId: 'reports', pageKey: 'SalesKanban' },
            'trip_report': { modId: 'reports', pageKey: 'TripReport' },
            'pos_balance': { modId: 'pos_billing', pageKey: 'POSBalance' },
            
            // Notifications
            'notifications': { modId: 'notifications', pageKey: 'Notifications' },
            'leave_apply_notif': { modId: 'notifications', pageKey: 'Notifications' },
            'schedule_assign_notif': { modId: 'notifications', pageKey: 'Notifications' },
            'voice_support': { modId: 'notifications', pageKey: 'VoiceSupport' },
            
            // Roles
            'RolePermissions': { modId: 'roles', pageKey: 'RolePermissions' },
            
            // Admin
            'dashboard': { modId: 'admin_dashboard', pageKey: 'Dashboard' },
            'admin': { modId: 'admin_dashboard', pageKey: 'AdminPanel' }
        };

        const mapEntry = permissionToPageMap[pageId];
        if (!mapEntry) return true; // Unmapped paths are allowed or handled by role

        // SPECIAL CASE: 'company_details' exists in both Multi-Branch and Settings groups.
        if (pageId === 'company_details') {
            const mbSet = workflowSettings['multi_branch'];
            const sSet = workflowSettings['settings'];
            const mbAllowed = mbSet && mbSet.enabled !== false && mbSet.pages && mbSet.pages['CompanyDetails'] !== false;
            const sAllowed = sSet && sSet.enabled !== false && sSet.pages && sSet.pages['CompanyDetails'] !== false;
            return mbAllowed || sAllowed;
        }

        const { modId, pageKey } = mapEntry;
        const modSet = workflowSettings[modId];
        
        // Check if entire module is disabled or missing
        if (!modSet || modSet.enabled === false) return false;

        // Check if specific page is disabled
        if (modSet.pages && modSet.pages[pageKey] === false) return false;

        return true;
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users', {
                headers: getHeaders()
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const isTestContext = !!location.state?.isTest;

    useEffect(() => {
        if (selectedRole) {
            if (isTestContext) {
                const fullPermObj = {};
                allPages.forEach(p => {
                    fullPermObj[p.id] = {
                        read: true, write: true, create: true, delete: true, update: true,
                        dataAccess: 'ALL'
                    };
                });
                setPermissions(fullPermObj);
                setAccessibleDesignations(['All Designations (System Bypass)']);
                setLoading(false);
            } else {
                fetchPermissions(selectedRole);
            }
        } else {
            setPermissions({});
            setAccessibleDesignations([]);
        }
    }, [selectedRole, isTestContext, selectedCompany, selectedBranch]);

    const fetchRoles = async () => {
        try {
            const usersRes = await axios.get('/api/users', { headers: getHeaders() }).catch(e => ({ data: [] }));

            // Exclude Test Users from role discovery
            const validUsers = (usersRes.data || []).filter(u => !(u.is_test === true || u.is_test === 'true' || u.is_test === 1));
            const userRoles = validUsers.map(u => u.role).filter(Boolean);

            const designationsRes = await axios.get('/api/employee-designations', { 
                headers: getHeaders(),
                params: {
                    company: selectedCompany !== 'All' ? selectedCompany : undefined,
                    branch: selectedBranch !== 'All' ? selectedBranch : undefined
                }
            }).catch(e => ({ data: [] }));
            const designationRoles = (designationsRes.data || []).map(d => d.name).filter(Boolean);

            // NEW: Fallback to include user roles in the designations list so the Hierarchy Map is never empty
            setAllDesignations([...new Set([...designationRoles, ...userRoles])].sort());

            const baseRoles = [''];
            const uniqueRoles = [...new Set([
                ...baseRoles,
                ...userRoles,
                ...designationRoles
            ])];

            const sortedRoles = uniqueRoles
                .filter(r => r && typeof r === 'string')
                .sort((a, b) => a.localeCompare(b));

            setRoles(sortedRoles);
        } catch (err) {
            console.error("Failed to fetch roles", err);
            setRoles(['']);
        }
    };

    const fetchPermissions = async (role) => {
        if (!role) return;
        setLoading(true);
        setPermissions({}); // CRITICAL: Clear UI state before fetching new context
        setAccessibleDesignations([]);
        setError('');
        setIsAdminRole(false);
        try {
            // CRITICAL FIX: Pass the selected branch and company explicitly to getHeaders!
            // If selectedBranch is 'All', pass 'All' to ensure it scopes correctly instead of inheriting undefined from localStorage.
            const headersUsed = getHeaders(
                selectedBranch && selectedBranch !== '' ? selectedBranch : 'All', 
                selectedCompany && selectedCompany !== '' ? selectedCompany : 'All'
            );
            console.log(`[RolePermissions] Fetching for Role: ${role}, Company: ${headersUsed['X-Company-Name']}, Branch: ${headersUsed['X-Branch-Name']}`);
            const response = await axios.get(`/api/role-permissions?role=${role}&t=${Date.now()}`, { headers: headersUsed });
            console.log(`[RolePermissions] Fetched Data:`, response.data);
            const perms = response.data.permissions || [];
            setIsAdminRole(response.data.isAdmin === true);
            if (response.data.accessible_designations) {
                setAccessibleDesignations(response.data.accessible_designations);
            }

            const permObj = {};
            allPages.forEach(p => {
                const found = perms.find(item => item.pageId === p.id);
                permObj[p.id] = {
                    read: found ? found.canRead : false,
                    write: found ? found.canWrite : false,
                    create: found ? found.canCreate : false,
                    delete: found ? found.canDelete : false,
                    dataAccess: found ? (found.dataAccess || 'ALL') : 'ALL',
                    // Status Permissions for Apply Leave - Unchecked by default
                    showPending: found ? (found.showPending !== false) : false,
                    showApproved: found ? (found.showApproved !== false) : false,
                    showRejected: found ? (found.showRejected !== false) : false
                };
            });
            setPermissions(permObj);
        } catch (err) {
            console.error("Failed to fetch permissions", err);
            setError("Could not load permissions for this role.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (pageId, type) => {
        if (isTestContext) return;
        setPermissions(prev => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [type]: !prev[pageId]?.[type]
            }
        }));
    };

    const handleDataAccessChange = (pageId, value) => {
        if (isTestContext) return;
        setPermissions(prev => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                dataAccess: value
            }
        }));
    };

    const handleResetAll = () => {
        if (isTestContext) return;
        const newPerms = {};
        allPages.forEach(p => {
            newPerms[p.id] = {
                read: false, write: false, create: false, delete: false, dataAccess: 'ALL',
                showPending: true, showApproved: true, showRejected: true
            };
        });
        setPermissions(newPerms);
        setMessage('All permissions cleared. Click Save to apply.');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSave = async () => {
        if (!selectedRole) {
            setError("Please select a role first.");
            return;
        }
        if (isAdminRole) return; // Prevent saving for hardcoded admin roles
        setSaving(true);
        setMessage('');
        setError('');

        const permissionsArray = Object.keys(permissions).map(pageId => ({
            pageId,
            canRead: permissions[pageId].read,
            canWrite: permissions[pageId].write,
            canCreate: permissions[pageId].create,
            canDelete: permissions[pageId].delete,
            dataAccess: permissions[pageId].dataAccess || 'ALL',
            showPending: permissions[pageId].showPending,
            showApproved: permissions[pageId].showApproved,
            showRejected: permissions[pageId].showRejected
        }));

        try {
            // CRITICAL FIX: Save using the selected dropdown values, NOT the admin's current branch!
            const headersUsed = getHeaders(
                selectedBranch && selectedBranch !== '' ? selectedBranch : 'All', 
                selectedCompany && selectedCompany !== '' ? selectedCompany : 'All'
            );
            console.log(`[RolePermissions] Saving for Role: ${selectedRole}, Company: ${headersUsed['X-Company-Name']}, Branch: ${headersUsed['X-Branch-Name']}`);
            console.log(`[RolePermissions] Payload:`, permissionsArray);
            await axios.post('/api/role-permissions', {
                role: selectedRole,
                permissions: permissionsArray,
                accessible_designations: accessibleDesignations
            }, { headers: headersUsed });
            setMessage(`Permissions for '${selectedRole}' saved successfully!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error("Failed to save permissions", err);
            setError("Failed to save permissions.");
        } finally {
            setSaving(false);
        }
    };

    // Toggle accessible designation
    const handleToggleDesignation = (desigName) => {
        setAccessibleDesignations(prev => {
            if (prev.includes(desigName)) {
                return prev.filter(d => d !== desigName);
            } else {
                return [...prev, desigName];
            }
        });
    };

    const handleSelectAllDesignations = () => {
        if (accessibleDesignations.length === allDesignations.length) {
            setAccessibleDesignations([]);
        } else {
            setAccessibleDesignations([...allDesignations]);
        }
    };

    const usersWithRole = users.filter(u => {
        const isTestUser = (u.is_test === true || u.is_test === 'true' || u.is_test === 1);
        if (isTestUser) return false;

        const uRole = String(u.role || '').toLowerCase();
        const uProfile = String(u.pos_profile || '').toLowerCase();
        const selRole = String(selectedRole || '').toLowerCase();
        const matchesRole = uRole === selRole || uProfile === selRole;
        if (!matchesRole) return false;

        // NEW: Filter by Company
        if (selectedCompany && selectedCompany !== 'All') {
            const selComps = String(selectedCompany).toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
            
            let uComps = [];
            if (Array.isArray(u.company_names) && u.company_names.length > 0) {
                uComps = u.company_names.map(c => String(c || '').toLowerCase().trim());
            } else {
                uComps = String(u.company_name || u.company || '').toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
            }
            
            const hasCompMatch = selComps.some(sc => uComps.includes(sc));
            if (!hasCompMatch) return false;
        }

        // NEW: Filter by Branch if selected
        if (selectedBranch && !['all', 'all branches', 'any', 'n/a', 'all branches (shared)'].includes(String(selectedBranch).toLowerCase().trim())) {
            const selBranches = String(selectedBranch).toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
            const uBranches = String(u.branch_name || u.branch || u.pos_profile || '').toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
            
            // Allow if user branch is empty (Unassigned) or explicitly 'all'/'unassigned'
            const isUserShared = uBranches.length === 0 || uBranches.some(b => ['all', 'unassigned', 'all branches', 'any'].includes(b));
            
            if (!isUserShared) {
                const hasBranchMatch = selBranches.some(sb => uBranches.includes(sb));
                if (!hasBranchMatch) return false;
            }
        }

        return true;
    });

    const HierarchyModal = () => {
        if (!showHierarchyModal) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '500px', maxWidth: '90%', height: '600px',
                    display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaSitemap style={{ color: '#e67e22' }} />
                            Hierarchy Access Assignment
                        </h3>
                        <button onClick={() => setShowHierarchyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#7f8c8d' }}><FaTimes /></button>
                    </div>
                    <div style={{ marginBottom: '15px', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        Select designations that <strong>{selectedRole}</strong> can access.
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <button onClick={handleSelectAllDesignations} style={{ padding: '6px 12px', backgroundColor: '#f1f2f6', border: '1px solid #ced6e0', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer', color: '#2f3542', fontWeight: '600' }}>
                            {accessibleDesignations.length === allDesignations.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                        {allDesignations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No designations found.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10px' }}>
                                {allDesignations.map(desig => (
                                    <label key={desig} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                                        backgroundColor: accessibleDesignations.includes(desig) ? '#ebfbee' : '#f8f9fa',
                                        border: accessibleDesignations.includes(desig) ? '1px solid #2ecc71' : '1px solid #e0e0e0',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                        <input type="checkbox" checked={accessibleDesignations.includes(desig)} onChange={() => handleToggleDesignation(desig)} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                                        <span style={{ fontWeight: accessibleDesignations.includes(desig) ? '600' : '400', color: '#2c3e50' }}>{desig}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '20px', textAlign: 'right', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <button onClick={() => setShowHierarchyModal(false)} style={{
                            padding: '10px 25px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer'
                        }}>Done</button>
                    </div>
                </div>
            </div>
        );
    };

    const PermissionModal = ({ isOpen, onClose, pageId, pageName, perms, onToggle }) => {
        if (!isOpen) return null;
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '500px', maxWidth: '90%',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>Permissions for <span style={{ color: '#3498db' }}>{pageName}</span></h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#7f8c8d' }}><FaTimes /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        {(['leave_apply_notif', 'schedule_assign_notif'].includes(pageId)) ? (
                            <label key="read" style={{
                                display: 'flex', alignItems: 'center', gap: '10px', cursor: isAdminRole ? 'not-allowed' : 'pointer', padding: '10px',
                                border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f8f9fa'
                            }}>
                                <input type="checkbox" disabled={isAdminRole} checked={perms?.read || false} onChange={() => onToggle(pageId, 'read')} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                                <span style={{ fontWeight: '500', color: '#34495e' }}>Enable Notifications</span>
                            </label>
                        ) : (
                            ['read', 'write', 'create', 'delete'].map(type => (
                                <label key={type} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', cursor: isAdminRole ? 'not-allowed' : 'pointer', padding: '10px',
                                    border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f8f9fa'
                                }}>
                                    <input type="checkbox" disabled={isAdminRole} checked={perms?.[type] || false} onChange={() => onToggle(pageId, type)} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                                    <span style={{ fontWeight: '500', color: '#34495e', textTransform: 'capitalize' }}>{type === 'write' ? 'Write (Update)' : type}</span>
                                </label>
                            ))
                        )}
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#2c3e50' }}>Data Access Scope</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAdminRole ? 'not-allowed' : 'pointer' }}>
                                <input type="radio" disabled={isAdminRole} name={`dataAccess-${pageId}`} checked={perms?.dataAccess === 'ALL'} onChange={() => handleDataAccessChange(pageId, 'ALL')} style={{ width: '18px', height: '18px', accentColor: '#27ae60' }} />
                                <span style={{ color: '#2c3e50' }}>All Data</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAdminRole ? 'not-allowed' : 'pointer' }}>
                                <input type="radio" disabled={isAdminRole} name={`dataAccess-${pageId}`} checked={perms?.dataAccess === 'OWN'} onChange={() => handleDataAccessChange(pageId, 'OWN')} style={{ width: '18px', height: '18px', accentColor: '#e67e22' }} />
                                <span style={{ color: '#2c3e50' }}>Own Data Only</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAdminRole ? 'not-allowed' : 'pointer' }}>
                                <input type="radio" disabled={isAdminRole} name={`dataAccess-${pageId}`} checked={perms?.dataAccess === 'HIERARCHY'} onChange={() => handleDataAccessChange(pageId, 'HIERARCHY')} style={{ width: '18px', height: '18px', accentColor: '#3498db' }} />
                                <span style={{ color: '#2c3e50' }}>Map Hierarchy (Designation & Own Data)</span>
                            </label>
                        </div>
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#7f8c8d' }}>
                            {perms?.dataAccess === 'HIERARCHY' && "User will see their own data + data from users with designations mapped in 'Map Hierarchy Access'."}
                            {perms?.dataAccess === 'OWN' && "User will only see data they created."}
                            {perms?.dataAccess === 'ALL' && "User will see all data from everyone."}
                        </div>
                    </div>

                    {pageId === 'leave_apply' && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#2c3e50' }}>Status Visibility</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                {[
                                    { key: 'showPending', label: 'Show Pending' },
                                    { key: 'showApproved', label: 'Show Approved' },
                                    { key: 'showRejected', label: 'Show Rejected' }
                                ].map(status => (
                                    <label key={status.key} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', cursor: isAdminRole ? 'not-allowed' : 'pointer', padding: '10px',
                                        border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f0f4f8'
                                    }}>
                                        <input
                                            type="checkbox"
                                            disabled={isAdminRole}
                                            checked={perms?.[status.key] !== false}
                                            onChange={() => onToggle(pageId, status.key)}
                                            style={{ width: '18px', height: '18px', accentColor: '#27ae60' }}
                                        />
                                        <span style={{ fontWeight: '500', color: '#34495e' }}>{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: '25px', textAlign: 'right' }}>
                        <button onClick={onClose} style={{
                            padding: '10px 25px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                            color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer'
                        }}>Done</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
            <header style={{
                backgroundColor: '#ffffff', padding: '15px 30px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/admin')} style={{
                        border: 'none', background: 'transparent', fontSize: '1.2rem', color: '#34495e',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                    }}><FaArrowLeft /> Back</button>
                    <h2 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaUserShield style={{ color: '#3498db' }} /> Role Permissions
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 15px', backgroundColor: '#f0f4f8', borderRadius: '30px', border: '1px solid #dcdde1' }}>
                            <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: '600' }}>Company:</span>
                            <select 
                                value={selectedCompany} 
                                onChange={(e) => {
                                    setSelectedCompany(e.target.value);
                                    setSelectedBranch('All'); // Reset branch on company change
                                }}
                                disabled={!isGlobalMaster && !!currentUserCompany}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    backgroundColor: (!isGlobalMaster && !!currentUserCompany) ? '#e2e8f0' : 'transparent',
                                    color: (!isGlobalMaster && !!currentUserCompany) ? '#94a3b8' : '#2980b9',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    cursor: (!isGlobalMaster && !!currentUserCompany) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isGlobalMaster ? (
                                    <>
                                        {companies.length !== 1 && <option value="All">All Companies</option>}
                                        {companies.map((c, idx) => (
                                            <option key={idx} value={c.name}>{c.name}</option>
                                        ))}
                                    </>
                                ) : (
                                    <option value={currentUserCompany}>{currentUserCompany}</option>
                                )}
                            </select>
                        </div>

                        {selectedCompany && selectedCompany !== 'All' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 15px', backgroundColor: '#f0f4f8', borderRadius: '30px', border: '1px solid #dcdde1' }}>
                                <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: '600' }}>Branch:</span>
                                <select 
                                    value={selectedBranch} 
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    disabled={!isGlobalMaster && !!currentUserBranch && currentUserBranch !== 'All'}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '15px',
                                        border: 'none',
                                        backgroundColor: (!isGlobalMaster && !!currentUserBranch && currentUserBranch !== 'All') ? '#e2e8f0' : 'transparent',
                                        color: (!isGlobalMaster && !!currentUserBranch && currentUserBranch !== 'All') ? '#94a3b8' : '#e67e22',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        cursor: (!isGlobalMaster && !!currentUserBranch && currentUserBranch !== 'All') ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {(!isGlobalMaster && !!currentUserBranch && currentUserBranch !== 'All') ? (
                                        <option value={currentUserBranch}>{currentUserBranch}</option>
                                    ) : (
                                        <>
                                            <option value="All">All Branches (Shared)</option>
                                            {branches.map((b, idx) => {
                                                const bName = typeof b === 'string' ? b : (b.branch_name || b.name);
                                                return <option key={idx} value={bName}>{bName}</option>;
                                            })}
                                        </>
                                    )}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#95a5a6' }} />
                        <input type="text" placeholder="Search modules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 10px 8px 35px', borderRadius: '20px', border: '1px solid #bdc3c7', outline: 'none', width: '250px' }} />
                    </div>

                    {selectedRole && !isTestContext && (
                        <button onClick={handleResetAll} disabled={saving} style={{
                            padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '50px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', gap: '8px', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                        }}>
                            <FaTrashAlt /> Reset All Perms
                        </button>
                    )}

                    <button onClick={handleSave} disabled={saving || !selectedRole || isAdminRole} style={{
                        padding: '10px 20px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                        color: 'white', border: 'none', borderRadius: '50px', cursor: (saving || !selectedRole || isAdminRole) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', fontWeight: '600', gap: '8px', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                        opacity: (saving || !selectedRole || isAdminRole) ? 0.7 : 1
                    }}>
                        <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ width: '300px', backgroundColor: '#ffffff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.05)', zIndex: 5 }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '1px' }}>Select Role</h3>
                        <select 
                            value={roles.find(r => String(r || '').toLowerCase() === String(selectedRole || '').toLowerCase()) || selectedRole} 
                            onChange={(e) => setSelectedRole(e.target.value)} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem', outline: 'none', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        >
                            <option value="">-- Choose Role --</option>
                            {roles.map((role, idx) => (
                                <option key={idx} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {selectedRole && (
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <button onClick={() => setShowHierarchyModal(true)} style={{
                                width: '100%', padding: '10px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(230, 126, 34, 0.2)'
                            }}><FaSitemap /> Map Hierarchy Access</button>
                            <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#95a5a6' }}>Define which designations this role can manage/view.</div>
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {selectedRole && (
                            <>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#34495e', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                    Users with Role: <span style={{ color: '#3498db' }}>{selectedRole}</span>
                                </h4>
                                {usersWithRole.length === 0 ? (
                                    <div style={{ color: '#95a5a6', fontStyle: 'italic', fontSize: '0.9rem' }}>No users assigned</div>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {usersWithRole.map(u => (
                                            <li key={u.id} style={{ padding: '10px 15px', borderBottom: '1px solid #f1f2f6', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>{u.firstName || u.fullName}</span>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{u.email || u.id}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '30px', position: 'relative' }}>
                    {error && (
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 10, padding: '15px', borderRadius: '8px', marginBottom: '20px',
                            backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}><FaTimes /> {error}</div>
                    )}
                    {message && (
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 10, padding: '15px', borderRadius: '8px', marginBottom: '20px',
                            backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}><FaCheckDouble /> {message}</div>
                    )}

                    {!selectedRole ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bdc3c7' }}>
                            <FaUserShield style={{ fontSize: '5rem', marginBottom: '20px', opacity: 0.5 }} />
                            <h2 style={{ color: '#95a5a6' }}>Select a Role to Configure Permissions</h2>
                            <p>Choose a role from the sidebar to start editing access controls.</p>
                        </div>
                    ) : (
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            {isAdminRole && (
                                <div style={{
                                    padding: '15px 20px', backgroundColor: '#fff3cd', border: '1px solid #ffe69c', borderRadius: '10px', marginBottom: '20px', color: '#664d03',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaUserShield size={24} style={{ color: '#d39e00' }} />
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>SYSTEM ADMINISTRATOR ROLE</div>
                                            <div style={{ fontSize: '0.9rem' }}>This role has hardcoded full system access. Custom permissions cannot be applied.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {isTestContext ? (
                                <div style={{
                                    padding: '15px 20px', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '10px', marginBottom: '20px', color: '#1565c0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaUserShield size={24} />
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>SYSTEM TEST USER ACCESS</div>
                                            <div style={{ fontSize: '0.9rem' }}>This user (<strong>{location.state.user}</strong>) has automatic Full Access.</div>
                                        </div>
                                    </div>
                                    <span style={{ backgroundColor: '#1565c0', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>LOCKED</span>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '12px 20px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', marginBottom: '20px', color: '#92400e',
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <FaInfoCircle />
                                    <span><strong>Permission Logic:</strong> Users marked as Test User: No only get access unchecked by default.</span>
                                </div>
                            )}

                            {moduleGroups.map((group, groupIdx) => {
                                 const visiblePages = group.pages.filter(p => {
                                    const isSearched = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
                                    const isAllowed = isFeatureAllowed(p.id);
                                    return isSearched && isAllowed;
                                });
                                if (visiblePages.length === 0) return null;

                                const allFullAccess = visiblePages.every(page => {
                                    const p = permissions[page.id];
                                    return p && p.read && p.write && p.create && p.delete && p.dataAccess === 'ALL';
                                });

                                const handleGroupToggle = () => {
                                    if (isTestContext) return;
                                    const newPerms = { ...permissions };
                                    visiblePages.forEach(page => {
                                        if (allFullAccess) {
                                            newPerms[page.id] = { read: false, write: false, create: false, delete: false, dataAccess: 'ALL' };
                                        } else {
                                            newPerms[page.id] = { read: true, write: true, create: true, delete: true, dataAccess: 'ALL' };
                                        }
                                    });
                                    setPermissions(newPerms);
                                };

                                return (
                                    <div key={groupIdx} style={{ marginBottom: '30px', backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '2px solid #f0f0f0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaLayerGroup style={{ color: '#3498db' }} /> {group.name}
                                            <button onClick={handleGroupToggle} disabled={isTestContext || isAdminRole} style={{
                                                marginLeft: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid',
                                                borderColor: allFullAccess ? '#e74c3c' : '#27ae60', backgroundColor: allFullAccess ? '#fce8e6' : '#e8f5e9',
                                                color: allFullAccess ? '#c0392b' : '#27ae60', cursor: (isTestContext || isAdminRole) ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: (isTestContext || isAdminRole) ? 0.6 : 1
                                            }}>{allFullAccess ? 'Deselect All' : 'Select All'}</button>
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                            {visiblePages.map(page => {
                                                const p = permissions[page.id] || { read: false, write: false, create: false, delete: false, dataAccess: 'ALL' };
                                                const isActive = p.read || p.write || p.create || p.delete;
                                                const isModalOpen = activeModalPageId === page.id;
                                                return (
                                                    <div key={page.id} style={{
                                                        border: isActive ? '1px solid #3498db' : '1px solid #eee', borderRadius: '10px', padding: '15px',
                                                        backgroundColor: isActive ? '#f8fbfe' : '#fff', transition: 'all 0.3s', position: 'relative'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                            <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}>{page.name}</div>
                                                            {p.dataAccess === 'OWN' && <div title="Restricted to Own Data" style={{ fontSize: '0.7rem', backgroundColor: '#e67e22', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>OWN</div>}
                                                            {p.dataAccess === 'HIERARCHY' && <div title="Hierarchical Access" style={{ fontSize: '0.7rem', backgroundColor: '#3498db', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>HIERARCHY</div>}
                                                            {p.dataAccess === 'ALL' && isActive && <div title="Full Data Access" style={{ fontSize: '0.7rem', backgroundColor: '#27ae60', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>ALL</div>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                                            {p.read && <span style={{ fontSize: '0.75rem', backgroundColor: '#e1f5fe', color: '#0288d1', padding: '3px 8px', borderRadius: '10px' }}>Read</span>}
                                                            {p.write && <span style={{ fontSize: '0.75rem', backgroundColor: '#fff8e1', color: '#ff8f00', padding: '3px 8px', borderRadius: '10px' }}>Write</span>}
                                                            {p.create && <span style={{ fontSize: '0.75rem', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '10px' }}>Create</span>}
                                                            {p.delete && <span style={{ fontSize: '0.75rem', backgroundColor: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '10px' }}>Delete</span>}
                                                            {!isActive && <span style={{ fontSize: '0.75rem', color: '#95a5a6', fontStyle: 'italic' }}>No Access</span>}
                                                        </div>
                                                        <button onClick={() => setActiveModalPageId(page.id)} style={{
                                                            width: '100%', padding: '8px', backgroundColor: isActive ? '#3498db' : '#ecf0f1', color: isActive ? 'white' : '#7f8c8d',
                                                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                                                        }}>{isActive ? (isAdminRole ? 'View Permissions' : 'Edit Permissions') : (isAdminRole ? 'View Permissions' : 'Grant Access')}</button>
                                                        <PermissionModal isOpen={isModalOpen} onClose={() => setActiveModalPageId(null)} pageId={page.id} pageName={page.name} perms={p} onToggle={handleToggle} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <HierarchyModal />
        </div>
    );
};

export default RolePermissionPage;
