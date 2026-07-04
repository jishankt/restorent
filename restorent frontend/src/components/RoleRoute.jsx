import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../Context/UserContext';

const isAdminRole = (r, userObj = null) => {
    if (!r && !userObj) return false;
    const roleToUse = r || userObj?.role || userObj?.user_role || "";
    const norm = String(roleToUse).toLowerCase().replace(/[\s_]/g, '');
    const adminRoles = [
        'admin', 'superadmin', 'companyadmin', 'groupadmin', 
        'branchadmin', 'branchmanager', 'manager', 'owner',
        'restaurantmanager', 'shopmanager', 'generalmanager',
        'branch'
    ];
    const isActuallyAdmin = adminRoles.includes(norm) || 
                            norm.includes('admin') || 
                            norm.includes('super') || 
                            norm.includes('manager') ||
                            norm.includes('owner') ||
                            norm.includes('branch') ||
                            norm === 'branch' ||
                            (userObj?.email && String(userObj.email).includes('@temp.com'));
    return isActuallyAdmin;
};

const RoleRoute = ({ children, pageId }) => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);
    const [permissionData, setPermissionData] = useState(null);

    useEffect(() => {
        const checkPermission = async () => {
            setLoading(true);
            if (!user) {
                setLoading(false);
                return;
            }
            const isAdmin = isAdminRole(user.role, user);
            if (isAdmin) {
                setPermissionData({ canRead: true, canWrite: true, canCreate: true, canDelete: true });
                setHasPermission(true);
                setLoading(false);
                return;
            }

            // --- FETCH SETTINGS ---
            let perms = [];
            let workflowSettings = {};
            let localDisabledPages = [];

            try {
                const roleLower = (user?.role || '').toLowerCase();
                const isGroupAdmin = roleLower.includes('group') || roleLower.includes('super') || roleLower === 'admin';
                
                console.log("[RoleRoute Debug] Resolving context for:", { role: user.role, id: user.userId || user._id });
                console.log("[RoleRoute Debug] User profile companies:", { name: user.company_name, comp: user.company, list: user.companies });

                // For Group/System Admins, we allow the active_company from localStorage (which can be 'All')
                // For standard employees/managers, we MUST force their profile company to ensure strict isolation
                // and prevent 400 errors from endpoints that don't support 'All' for non-admins.
                let activeComp = isGroupAdmin 
                    ? (localStorage.getItem('active_company') || user.company_name || user.company)
                    : (user.company_name || user.company);

                console.log("[RoleRoute Debug] Initial activeComp:", activeComp);

                // AGGRESSIVE SANITIZATION: Non-group admins MUST NEVER use 'All' context for visibility APIs
                if (!isGroupAdmin && (!activeComp || String(activeComp).toLowerCase() === 'all')) {
                    // Fallback to the first non-'All' company in their profile if available
                    const profileComps = user.companies || [];
                    activeComp = profileComps.find(c => String(c).toLowerCase() !== 'all') || user.company_name || user.company;
                }

                const activeBranch = localStorage.getItem('active_branch') || localStorage.getItem('branch_name') || user.branch_name || user.branch;
                const headers = { 'Content-Type': 'application/json' };
                if (activeComp) headers['X-Company-Name'] = activeComp;
                if (activeBranch && activeBranch !== 'All Branches') headers['X-Branch-Name'] = activeBranch;
                
                const params = { company: activeComp };
                if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

                const [permRes, visRes, workRes] = await Promise.all([
                    axios.get(`/api/role-permissions?role=${encodeURIComponent(user.role)}`, { headers }),
                    axios.get('/api/module-visibility', { params, headers }),
                    axios.get('/api/workflow-visibility', { params, headers })
                ]);

                perms = permRes.data.permissions || [];
                localDisabledPages = visRes.data.disabled_pages || [];
                workflowSettings = workRes.data.settings || {};
            } catch (error) {
                console.error("Error fetching permissions/visibility:", error);
            }

            // --- HIERARCHICAL WORKFLOW SUPPRESSION CHECK ---
            const currentPath = location.pathname;
            
            // 1. Check direct manual suppression
            if (localDisabledPages.includes(currentPath)) {
                setIsModuleEnabled(false);
            } 
            // 2. Check Global Workflow Suppression
            else {
                const pathMap = {
                    // 📦 Order Tracking
                    "/active-orders": { mod: "tracking", page: "ActiveOrders" },
                    // 👨‍🍳 Kitchen Display
                    "/kitchen": { mod: "kitchen_display", page: "KitchenView" },
                    "/add-kitchen": { mod: "kitchen_display", page: "AddKitchen" },
                    // 📦 Inventory
                    "/items": { mod: "inventory", page: "ItemsList" },
                    "/inventory": { mod: "inventory", page: "ItemsList" },
                    "/create-item": { mod: "inventory", page: "CreateItem" },
                    "/add-item-group": { mod: "inventory", page: "AddItemGroup" },
                    "/add-ingredients-nutrition": { mod: "inventory", page: "AddIngredients&Nutrition" },
                    "/create-variant": { mod: "inventory", page: "CreateVariant" },
                    "/combo-offer": { mod: "inventory", page: "ComboOffer" },
                    "/hidden-items": { mod: "inventory", page: "HiddenItems" },
                    "/purchase": { mod: "purchase", page: "Purchase" },
                    // 👨‍💼 HR & Payroll
                    "/add-employee": { mod: "hr_payroll", page: "AddEmployee" },
                    "/employee-list": { mod: "hr_payroll", page: "EmployeeList" },
                    "/employees": { mod: "hr_payroll", page: "DeliveryPersons" },
                    "/employee-details/:id": { mod: "hr_payroll", page: "EmployeeDetails" },
                    "/users": { mod: "hr_payroll", page: "Users" },
                    "/employee-designations": { mod: "hr_payroll", page: "EmployeeDesignations" },
                    "/employee-types": { mod: "hr_payroll", page: "EmployeeTypes" },
                    "/employee-departments": { mod: "hr_payroll", page: "EmployeeDepartments" },
                    "/attendance": { mod: "hr_payroll", page: "Attendance" },
                    "/attendance-view": { mod: "hr_payroll", page: "AttendanceView" },
                    "/salary-slip": { mod: "hr_payroll", page: "SalarySlip" },
                    "/salary-receipt-list": { mod: "hr_payroll", page: "SalaryReceiptList" },
                    "/leave-type": { mod: "hr_payroll", page: "LeaveType" },
                    "/leave-allocation": { mod: "hr_payroll", page: "LeaveAllocation" },
                    "/leave-apply": { mod: "hr_payroll", page: "LeaveApply" },
                    "/schedule-master": { mod: "hr_payroll", page: "ScheduleMaster" },
                    "/schedule-assign-employee": { mod: "hr_payroll", page: "ScheduleAssignEmployee" },
                    "/roaster": { mod: "hr_payroll", page: "Roaster" },
                    "/holiday-doctype": { mod: "hr_payroll", page: "HolidayList" },
                    "/extended-doctype": { mod: "hr_payroll", page: "ExtendedDocType" },
                    // ⚙️ Admin / Dashboard
                    "/admin": { mod: "admin_dashboard", page: "AdminPanel" },
                    "/dashboard": { mod: "admin_dashboard", page: "Dashboard" },
                    "/main": { mod: "admin_dashboard", page: "MainPage" },
                    "/record": { mod: "admin_dashboard", page: "AuditRecords" },
                    // 👤 Customer Module
                    "/customers": { mod: "customer_module", page: "CustomerList" },
                    "/create-customer": { mod: "customer_module", page: "CreateCustomer" },
                    "/create-customer-group": { mod: "customer_module", page: "CustomerGroup" },
                    // 🍽️ Table Management
                    "/add-table": { mod: "table_management", page: "AddTable" },
                    "/table": { mod: "table_management", page: "TableView" },
                    "/frontpage": { mod: "table_management", page: "FrontPage" },
                    "/booking": { mod: "table_management", page: "Booking" },
                    // 🚗 Vehicle Module
                    "/vehicle-management": { mod: "vehicle_module", page: "VehicleManagement" },
                    "/vehicle-management-page": { mod: "vehicle_module", page: "VehicleManagement" },
                    // 🌍 Address Module
                    "/address-structure": { mod: "address_module", page: "AddressStructure" },
                    "/address-structure-page": { mod: "address_module", page: "AddressStructure" },
                    // 📊 Reports
                    "/salespage": { mod: "reports", page: "SalesInvoice" },
                    "/sales-reports": { mod: "reports", page: "SalesReport" },
                    "/sales-kanban": { mod: "reports", page: "SalesKanban" },
                    "/trip-report": { mod: "reports", page: "TripReport" },
                    // 💰 POS Billing
                    "/home": { mod: "pos_billing", page: "HomeDashboard" },
                    "/savedorders": { mod: "pos_billing", page: "SavedOrders" },
                    "/pos-balance": { mod: "pos_billing", page: "POSBalance" },
                    "/opening-entry": { mod: "pos_billing", page: "OpeningEntry" },
                    "/closing-entry": { mod: "pos_billing", page: "ClosingEntry" },
                    "/bearer": { mod: "pos_billing", page: "BearerPage" },
                    // ⚙️ Settings
                    "/system-settings": { mod: "settings", page: "SystemSettings" },
                    "/tax-master": { mod: "settings", page: "TaxMaster" },
                    "/email-settings": { mod: "settings", page: "EmailSettings" },
                    "/print-settings": { mod: "settings", page: "PrintSettings" },
                    "/backup": { mod: "settings", page: "Backups" },
                    "/import-data": { mod: "settings", page: "AdvancedImport" },
                    "/working": { mod: "settings", page: "WorkingDays" },
                    // 🏢 Multi-Branch Support
                    "/manage-tenants": { mod: "multi_branch", page: "ManageTenants" },
                    "/manage-companies": { mod: "multi_branch", page: "ManageCompanies" },
                    "/manage-branches": { mod: "multi_branch", page: "ManageBranches" },
                    "/company-details": { mod: "multi_branch", page: "CompanyDetails" },
                    // 🔑 Role Management
                    "/role-permissions": { mod: "roles", page: "RolePermissions" },
                    // 🔔 Notifications & Voice
                    "/notifications": { mod: "notifications", page: "Notifications" },
                    "/voice": { mod: "notifications", page: "VoiceSupport" }
                };

                const map = pathMap[currentPath];
                if (map) {
                    const CORE_MODULES = ["admin_dashboard", "settings", "multi_branch", "auth", "pos_billing", "roles", "hr_payroll"];
                    const isCore = CORE_MODULES.includes(map.mod);

                    // 1. SYSTEM BYPASS: Administrators ALWAYS get access to core modules
                    // OR: Super Admins/Group Admins ALWAYS get access to everything
                    const roleLower = (user?.role || '').toLowerCase();
                    const isSuperAdmin = roleLower.includes('super') || roleLower.includes('group');
                    if ((isAdmin && isCore) || isSuperAdmin) {
                        setIsModuleEnabled(true);
                    } 
                    // 2. AGGRESSIVE WORKFLOW CHECK: Strictly respect toggles for ALL users for non-core modules
                    else if (workflowSettings && workflowSettings.global_modules) {
                        const modSet = workflowSettings.global_modules[map.mod];
                        
                        // 4. AGGRESSIVE MODULE CHECK (Applies to Admins for non-essential modules)
                        if (!modSet) {
                            setIsModuleEnabled(false);
                        } else if (modSet.enabled === false) {
                            setIsModuleEnabled(false);
                        } else if (modSet.pages && modSet.pages[map.page] === false) {
                            setIsModuleEnabled(false);
                        }
                    } else {
                        // If no global hierarchical workflow is configured, default to ENABLED.
                        // Individual branch-level suppression is already handled by the 'localDisabledPages' check above.
                        setIsModuleEnabled(true);
                    }
                } else {
                    // Unmapped path = Allowed by default
                    setIsModuleEnabled(true);
                }
            }

            // MASTER BYPASS: Check if user is an admin or has an "all" permission pageId
            const hasAllPerm = perms.some(p => p.pageId === 'all');

            if (isAdmin || hasAllPerm) {
                setHasPermission(true);
            } else {
                const pagePerm = perms.find(p => p.pageId === pageId);
                if (pagePerm) {
                    setHasPermission(pagePerm.canRead);
                } else {
                    const essentialPages = ['home', 'dashboard', 'frontpage', 'item_list', 'customer_list', 'opening', 'closing', 'bearer'];
                    if (essentialPages.includes(pageId)) {
                        setHasPermission(true);
                    } else {
                        setHasPermission(false);
                    }
                }
            }

            const pagePerm = perms.find(p => p.pageId === pageId) || perms.find(p => p.pageId === 'all');
            setPermissionData(pagePerm);
            setLoading(false);
        };

        checkPermission();
        window.addEventListener('visibilityChange', checkPermission);
        window.addEventListener('companyChange', checkPermission);
        
        return () => {
            window.removeEventListener('visibilityChange', checkPermission);
            window.removeEventListener('companyChange', checkPermission);
        };
    }, [user, pageId, location.pathname]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading permissions...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!isModuleEnabled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-red-500">
                    <h2 className="text-3xl font-extrabold text-red-600 mb-4">Module Restricted</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">This module has been suppressed for your current workflow or branch context. Please contact your administrator if you believe this is an error.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-red-200 transition-all active:scale-95"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-orange-500">
                    <h2 className="text-3xl font-extrabold text-orange-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">Your current role does not have permission to access this module.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-200 transition-all active:scale-95"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isAdmin = isAdminRole(user.role);
    const isSuperAdmin = String(user.role).toLowerCase().includes('super') || String(user.role).toLowerCase().includes('group');

    const permissionObject = {
        canRead: true,
        canWrite: (isAdmin || isSuperAdmin) ? true : (permissionData?.canWrite || false),
        canCreate: (isAdmin || isSuperAdmin) ? true : (permissionData?.canCreate || false),
        canDelete: (isAdmin || isSuperAdmin) ? true : (permissionData?.canDelete || false),
        dataAccess: (isAdmin || isSuperAdmin) ? 'ALL' : (permissionData?.dataAccess || 'ALL')
    };

    return React.cloneElement(children, { permissions: permissionObject });
};

export default RoleRoute;
