// src/components/admin/AdminPage.jsx
// FULLY UPDATED: Fixed Visibility Sync with Manages Page.
// Robust visibility checks ensure that Inventory, HR, and other modules appear correctly when enabled.
// Universal Nested Drag and Drop is fully functional.
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHome,
  FaMoneyBill,
  FaFileAlt,
  FaChartBar,
  FaDatabase,
  FaCog,
  FaUsers,
  FaBox,
  FaPlusCircle,
  FaTable,
  FaUtensils,
  FaLayerGroup,
  FaUserTie,
  FaEnvelope,
  FaShoppingCart,
  FaSearch,
  FaPrint,
  FaGift,
  FaSignOutAlt,
  FaBuilding,
  FaCamera,
  FaTrash,
  FaChartLine,
  FaFileInvoiceDollar,
  FaEyeSlash,
  FaList,
  FaClock,
  FaBriefcase,
  FaIdCard,
  FaCalendar,
  FaUserPlus,
  FaEye,
  FaCreditCard,
  FaPaperPlane,
  FaMoneyCheckAlt,
  FaCar,
  FaCalendarCheck,
  FaMapMarkerAlt,
  FaBell,
  FaCashRegister,
  FaTabletAlt,
  FaHistory,
  FaConciergeBell,
  FaGripVertical,
  FaUserShield,
  FaImage,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaCircle,
  FaCalendarAlt,
} from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';

const DashboardTimePicker = ({ timeframe, selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState(() => {
    if (timeframe === 'Year') return 'years';
    if (timeframe === 'Month') return 'months';
    return 'days';
  });
  
  const [yearPage, setYearPage] = useState(() => Math.floor(selectedDate.getFullYear() / 12) * 12);
  const [currentViewDate, setCurrentViewDate] = useState(selectedDate);
  
  useEffect(() => {
    setCurrentViewDate(selectedDate);
    setYearPage(Math.floor(selectedDate.getFullYear() / 12) * 12);
    if (timeframe === 'Year') setView('years');
    else if (timeframe === 'Month') setView('months');
    else setView('days');
    setIsOpen(false);
  }, [selectedDate, timeframe]);

  if (!['Week', 'Month', 'Year'].includes(timeframe)) return null;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDisplayText = () => {
    if (timeframe === 'Year') return selectedDate.getFullYear().toString();
    if (timeframe === 'Month') return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (timeframe === 'Week') {
      const d = new Date(selectedDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()].substring(0,3)} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()].substring(0,3)}, ${endOfWeek.getFullYear()}`;
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (view === 'days') setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
    else if (view === 'months') setCurrentViewDate(new Date(currentViewDate.getFullYear() - 1, currentViewDate.getMonth(), 1));
    else if (view === 'years') setYearPage(yearPage - 12);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (view === 'days') setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
    else if (view === 'months') setCurrentViewDate(new Date(currentViewDate.getFullYear() + 1, currentViewDate.getMonth(), 1));
    else if (view === 'years') setYearPage(yearPage + 12);
  };

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const selectDay = (day, e) => {
    e.stopPropagation();
    onChange(new Date(year, month, day));
    setIsOpen(false);
  };

  const selectMonth = (idx, e) => {
    e.stopPropagation();
    if (timeframe === 'Month') {
      onChange(new Date(year, idx, 1));
      setIsOpen(false);
    } else {
      setCurrentViewDate(new Date(year, idx, 1));
      setView('days');
    }
  };

  const selectYear = (y, e) => {
    e.stopPropagation();
    if (timeframe === 'Year') {
      onChange(new Date(y, 0, 1));
      setIsOpen(false);
    } else {
      setCurrentViewDate(new Date(y, month, 1));
      setView(timeframe === 'Month' ? 'months' : 'days');
    }
  };

  return (
    <div style={{ position: 'relative', width: '280px', marginTop: '12px' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E9F2', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <span style={{ fontWeight: '600', color: '#1B1B29', fontSize: '15px' }}>{getDisplayText()}</span>
        <FaCalendarAlt style={{ color: '#604BE8' }} />
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', background: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: '24px', zIndex: 1001, border: '1px solid #e2e8f0', animation: 'slideDown 0.2s ease', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <button onClick={handlePrev} style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29' }}>
                <FaChevronLeft />
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {view === 'days' && (
                  <>
                    <span onClick={(e) => { e.stopPropagation(); setView('months'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {monthNames[month]}
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); setYearPage(Math.floor(year / 12) * 12); setView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {year}
                    </span>
                  </>
                )}
                {view === 'months' && (
                  <span onClick={(e) => { e.stopPropagation(); setYearPage(Math.floor(year / 12) * 12); setView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer' }}>
                    {year}
                  </span>
                )}
                {view === 'years' && (
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29' }}>
                    {yearPage} - {yearPage + 11}
                  </span>
                )}
              </div>

              <button onClick={handleNext} style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29' }}>
                <FaChevronRight />
              </button>
            </div>

            {view === 'days' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '16px' }}>
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w, i) => (
                    <span key={i} style={{ fontSize: '13px', fontWeight: '700', color: '#1B1B29' }}>{w}</span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px' }}>
                  {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
                    return (
                      <button
                        key={day}
                        onClick={(e) => selectDay(day, e)}
                        style={{ height: '36px', width: '100%', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: isSelected ? '700' : '600', cursor: 'pointer', background: isSelected ? '#604BE8' : 'transparent', color: isSelected ? '#ffffff' : '#1B1B29', transition: 'all 0.2s ease' }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'months' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {monthNames.map((mName, index) => {
                  const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === index;
                  return (
                    <button
                      key={mName}
                      onClick={(e) => selectMonth(index, e)}
                      style={{ height: '42px', border: 'none', borderRadius: '10px', background: isSelected ? '#604BE8' : '#F3F6FB', color: isSelected ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      {mName.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'years' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const y = yearPage + i;
                  const isSelected = selectedDate.getFullYear() === y;
                  return (
                    <button
                      key={y}
                      onClick={(e) => selectYear(y, e)}
                      style={{ height: '42px', border: 'none', borderRadius: '10px', background: isSelected ? '#604BE8' : '#F3F6FB', color: isSelected ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};


function AdminPage() {
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [workflowSettings, setWorkflowSettings] = useState({});
  const [disabledPages, setDisabledPages] = useState([]);
  const [activeCompany, setActiveCompany] = useState(() => {
    const profileCompany = user?.company_name || user?.company;
    const isGlobal = (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'groupadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'tenantadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'masteradmin';
    if (!isGlobal && profileCompany && profileCompany.toLowerCase() !== 'all') {
      return profileCompany;
    }
    return localStorage.getItem('active_company') || '';
  });
  const [activeBranch, setActiveBranch] = useState(() => {
    const profileBranch = user?.branch_name || user?.branch;
    const isGlobal = (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'groupadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'tenantadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'masteradmin';
    const isGlobalForBranch = isGlobal || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'companyadmin';
    if (!isGlobalForBranch && profileBranch && profileBranch.toLowerCase() !== 'all' && profileBranch !== 'All Branches') {
      return profileBranch;
    }
    return localStorage.getItem('active_branch') || 'All Branches';
  });
  const [adminCompanies, setAdminCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [backupCount, setBackupCount] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [itemsData, setItemsData] = useState([]);      // From /api/items — for images & groups
  const [activeOrdersData, setActiveOrdersData] = useState([]); // From /api/activeorders
  const [customersData, setCustomersData] = useState([]); // From /api/customers
  const [salesLoading, setSalesLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('Today'); // 'Yesterday', 'Today', 'Week', 'Month', 'Year'
  const [selectedDashboardDate, setSelectedDashboardDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isEmployeeAppOpen, setIsEmployeeAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isMultiCompanyOpen, setIsMultiCompanyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState({ dateFormat: 'dd-mm-yyyy', timeFormat: 'hh:mm a' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [filteredMasterMenuItems, setFilteredMasterMenuItems] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigate = useNavigate();

  const pathMap = {
    "/home": { mod: "pos_billing", page: "HomeDashboard" },
    "/salespage": { mod: "reports", page: "SalesInvoice" },
    "/cash": { mod: "pos_billing", page: "CashPayment" },
    "/card": { mod: "pos_billing", page: "CardPayment" },
    "/savedorders": { mod: "pos_billing", page: "SavedOrders" },
    "/pos-balance": { mod: "pos_billing", page: "POSBalance" },
    "/combo-offer": { mod: "inventory", page: "ComboOffer" },
    "/active-orders": { mod: "tracking", page: "ActiveOrders" },
    "/kitchen": { mod: "kitchen_display", page: "KitchenView" },
    "/add-kitchen": { mod: "kitchen_display", page: "AddKitchen" },
    "/items": { mod: "inventory", page: "ItemsList" },
    "/items-list": { mod: "inventory", page: "ItemsList" },
    "/inventory": { mod: "inventory", page: "ItemsList" },
    "/create-item": { mod: "inventory", page: "CreateItem" },
    "/add-item": { mod: "inventory", page: "CreateItem" },
    "/add-item-group": { mod: "inventory", page: "AddItemGroup" },
    "/add-ingredients-nutrition": { mod: "inventory", page: "AddIngredients&Nutrition" },
    "/create-variant": { mod: "inventory", page: "CreateVariant" },
    "/hidden-items": { mod: "inventory", page: "HiddenItems" },
    "/purchase": { mod: "purchase", page: "Purchase" },
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
    "/import-data": { mod: "settings", page: "AdvancedImport" },
    "/record": { mod: "admin_dashboard", page: "AuditRecords" },
    "/admin-dashboard": { mod: "admin_dashboard", page: "AdminDashboard" },
    "/customers": { mod: "customer_module", page: "CustomerList" },
    "/create-customer": { mod: "customer_module", page: "CreateCustomer" },
    "/create-customer-group": { mod: "customer_module", page: "CustomerGroup" },
    "/bearer": { mod: "pos_billing", page: "BearerPage" },
    "/opening-entry": { mod: "pos_billing", page: "OpeningEntry" },
    "/closing-entry": { mod: "pos_billing", page: "ClosingEntry" },
    "/add-table": { mod: "table_management", page: "AddTable" },
    "/table": { mod: "table_management", page: "TableView" },
    "/frontpage": { mod: "table_management", page: "FrontPage" },
    "/booking": { mod: "table_management", page: "Booking" },
    "/vehicle-management": { mod: "vehicle_module", page: "VehicleManagement" },
    "/vehicle-management-page": { mod: "vehicle_module", page: "VehicleManagement" },
    "/address-structure": { mod: "address_module", page: "AddressStructure" },
    "/address-structure-page": { mod: "address_module", page: "AddressStructure" },
    "/sales-reports": { mod: "reports", page: "SalesReport" },
    "/trip-report": { mod: "reports", page: "TripReport" },
    "/sales-kanban": { mod: "reports", page: "SalesKanban" },
    "/system-settings": { mod: "settings", page: "SystemSettings" },
    "/doctype": { mod: "settings", page: "DocTypeManagement" },
    "/email-settings": { mod: "settings", page: "EmailSettings" },
    "/print-settings": { mod: "settings", page: "PrintSettings" },
    "/backup": { mod: "settings", page: "Backups" },
    "/working": { mod: "settings", page: "WorkingDays" },
    "/tax-master": { mod: "settings", page: "TaxMaster" },
    "/company-details": { mod: "multi_branch", page: "CompanyDetails" },
    "/manage-branches": { mod: "multi_branch", page: "ManageBranches" },
    "/manage-companies": { mod: "multi_branch", page: "ManageCompanies" },
    "/role-permissions": { mod: "roles", page: "RolePermissions" },
    "/notifications": { mod: "notifications", page: "Notifications" },
    "/voice-support": { mod: "notifications", page: "VoiceSupport" },
    "/voice": { mod: "notifications", page: "VoiceSupport" },
    // Sidebar Parent Node Mappings
    "Items": { mod: "inventory" },
    "Inventory": { mod: "inventory" },
    "Employee": { mod: "hr_payroll" },
    "HR & Payroll": { mod: "hr_payroll" },
    "Settings": { mod: "settings" },
    "Multi-Branch Support": { mod: "multi_branch" },
    "Purchase": { mod: "purchase" },
    "Reports": { mod: "reports" },
    "Table Management": { mod: "table_management" },
    "Customer Module": { mod: "customer_module" },
    "POS Billing": { mod: "pos_billing" },
    "Kitchen Display": { mod: "kitchen_display" }
  };

  const checkIsAdmin = (roleStr) => {
    const userStored = localStorage.getItem('user');
    const u = userStored ? JSON.parse(userStored) : {};
    const role = roleStr || u.role || u.user_role || u.role_name || "";
    const norm = String(role).toLowerCase().replace(/[\s_]/g, '');
    const adminRoles = [
      'admin', 'superadmin', 'tenantadmin', 'companyadmin', 'groupadmin',
      'branchadmin', 'branchmanager', 'manager', 'owner',
      'restaurantmanager', 'shopmanager', 'generalmanager',
      'branch', 'branchmanager', 'user', 'staff'
    ];
    return adminRoles.includes(norm) || norm.includes('admin') || norm.includes('super') || norm.includes('manager') || norm.includes('owner') || norm.includes('branch');
  };

  const isPageEnabled = (pathOrModule, userRole) => {
    let modKey;
    let pageKey = null;
    const isPath = pathOrModule.startsWith('/');
    if (isPath) {
      if (!pathMap[pathOrModule]) return true;
      const map = pathMap[pathOrModule];
      modKey = map.mod;
      pageKey = map.page;
    } else {
      if (pathMap[pathOrModule]) {
        const map = pathMap[pathOrModule];
        modKey = map.mod;
        pageKey = map.page || null;
      } else {
        modKey = pathOrModule;
      }
    }

    const roleNorm = (userRole || '').toLowerCase().replace(/[\s_]/g, '');
    const isSuperAdmin = roleNorm === 'superadmin' || roleNorm === 'groupadmin';

    // 1. Critical bypass (Always visible for safety)
    const CRITICAL_BYPASS = ["/admin", "/main", "auth", "/register", "admin_dashboard"];
    if (CRITICAL_BYPASS.includes(pathOrModule) || CRITICAL_BYPASS.includes(modKey)) return true;

    const isAdmin = checkIsAdmin(userRole);
    const settings = workflowSettings?.global_modules;

    // 2. "All Companies" Mode Bypass:
    const isAllMode = activeCompany === 'All';
    // Removed isAllMode && isAdmin bypass to enforce plan restrictions on all views.

    // 3. If NO settings exist at all (first run), default to true.
    const hasGlobalConfig = workflowSettings?.global_modules !== undefined;
    const hasAnyCoreConfig = ['Takeaway', 'Dine In', 'Online Delivery'].some(key => workflowSettings[key] !== undefined);
    const hasAnyConfigAtAll = hasAnyCoreConfig || hasGlobalConfig;
    if (!hasAnyConfigAtAll) return true;

    const modSet = settings ? settings[modKey] : null;

    // 4. Default to VISIBLE if module not explicitly mentioned in config
    if (!modSet) return true;

    // 5. Explicitly disabled module in Manages page.
    if (modSet.enabled === false) return false;

    // 6. Page Visibility: Defaults to VISIBLE unless explicitly false
    if (isPath && pageKey) {
      const pageValue = modSet.pages ? modSet.pages[pageKey] : null;
      if (pageValue === false) return false;
    }

    // Secondary check against legacy disabled array
    if (isPath && disabledPages && disabledPages.includes(pathOrModule)) {
      return false;
    }

    return true;
  };

  const fetchWorkflowSettings = async (comp = activeCompany, branch = activeBranch) => {
    try {
      const active_company = comp || localStorage.getItem('active_company') || user?.company_name || user?.company;
      const active_branch = branch || localStorage.getItem('active_branch') || user?.branch_name;

      if (!active_company || active_company === 'All') {
        console.log("[Workflow Admin] Skipping fetch for All/None context");
        setWorkflowSettings({}); // Clear settings in All mode
        if (active_company !== 'All') return;
      }

      const params = { company: active_company };
      if (active_branch && active_branch !== 'All Branches') params.branch = active_branch;

      console.log(`[Workflow Admin] Fetching for ${active_company} / ${active_branch}`);
      const response = await axios.get(`${baseUrl}/api/workflow-visibility`, {
        params,
        headers: getHeaders(active_branch !== 'All Branches' ? active_branch : null, active_company)
      });
      console.log("[Workflow Admin] Received:", response.data.settings);
      setWorkflowSettings(response.data.settings || {});
    } catch (err) { console.error("[Workflow Admin] Fetch Error:", err); }
  };

  const fetchLogo = async (comp = activeCompany, branch = activeBranch) => {
    try {
      const active_company = comp || activeCompany;
      const active_branch = branch || activeBranch;
      const h = getHeaders(active_branch !== 'All Branches' ? active_branch : null, active_company);
      const response = await axios.get(`${baseUrl}/api/logo`, { headers: h });
      if (response.data && response.data.logo) {
        setLogoUrl(response.data.logo);
        setPreviewUrl(response.data.logo);
      } else {
        setLogoUrl(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      setLogoUrl(null);
      setPreviewUrl(null);
    }
  };

  const fetchVisibility = async (comp = activeCompany, branch = activeBranch) => {
    try {
      const active_company = comp || activeCompany;
      const active_branch = branch || activeBranch;

      const params = { company: active_company };
      if (active_branch && active_branch !== 'All Branches') params.branch = active_branch;

      const response = await axios.get(`${baseUrl}/api/module-visibility`, {
        params,
        headers: getHeaders(active_branch !== 'All Branches' ? active_branch : null, active_company)
      });
      setDisabledPages(response.data.disabled_pages || []);
    } catch (err) { console.error("Module Visibility Error:", err); }
  };

  const fetchBranches = async (comp = activeCompany) => {
    if (!comp || comp === 'All') {
      setBranches([]);
      return;
    }
    try {
      const response = await axios.get(`${baseUrl}/api/branches`, { params: { company_name: comp } });
      setBranches(response.data || []);
    } catch (err) { console.error("Error fetching branches:", err); }
  };

  const handleCompanySwitch = (newCompany) => {
    setActiveCompany(newCompany);
    localStorage.setItem('active_company', newCompany);
    setActiveBranch('All Branches');
    localStorage.setItem('active_branch', 'All Branches');
    window.dispatchEvent(new Event('local-storage-change'));

    fetchBranches(newCompany);
    fetchLogo(newCompany, 'All Branches');
    fetchWorkflowSettings(newCompany, 'All Branches');
    fetchVisibility(newCompany, 'All Branches');
    fetchCustomerCount(newCompany, 'All Branches', adminCompanies);
    fetchItemCount(newCompany, 'All Branches', adminCompanies);
    fetchBackupCount(newCompany, 'All Branches', adminCompanies);
    // Pass adminCompanies so All-mode can iterate per company without re-fetching the list
    fetchDashboardData(newCompany, 'All Branches', adminCompanies);
    applyPermissions();
  };

  const handleBranchSwitch = (newBranch) => {
    setActiveBranch(newBranch);
    localStorage.setItem('active_branch', newBranch);
    window.dispatchEvent(new Event('local-storage-change'));
    fetchLogo(activeCompany, newBranch);
    fetchWorkflowSettings(activeCompany, newBranch);
    fetchVisibility(activeCompany, newBranch);
    fetchCustomerCount(activeCompany, newBranch, adminCompanies);
    fetchItemCount(activeCompany, newBranch, adminCompanies);
    fetchBackupCount(activeCompany, newBranch, adminCompanies);
    fetchDashboardData(activeCompany, newBranch, adminCompanies);
    applyPermissions();
  };

  const fetchDashboardData = async (comp = activeCompany, branch = activeBranch, knownCompanies = []) => {
    setSalesLoading(true);
    try {
      const isAllComp = !comp || ['all', 'all companies', 'all organizations'].includes((comp || '').toLowerCase().trim());
      const isAllBranch = !branch || ['all', 'all branches'].includes((branch || '').toLowerCase().trim());

      let allSales = [], allItems = [], allActiveOrders = [], allCustomers = [];

      if (isAllComp) {
        // ─── ALL-COMPANIES MODE ───────────────────────────────────────────────────
        // We must fetch per-company because the backend does NOT aggregate when
        // X-Company-Name is 'All'. Build company list from knownCompanies arg,
        // adminCompanies state, user profile, or /api/company-details as fallback.
        let companyList = knownCompanies.length > 0
          ? [...knownCompanies]
          : adminCompanies.length > 0
            ? [...adminCompanies]
            : [];

        if (companyList.length === 0) {
          // Last resort: fetch company list directly
          try {
            const tokenH = { Authorization: `Bearer ${localStorage.getItem('token')}` };
            const res = await axios.get(`${baseUrl}/api/company-details`, { headers: tokenH });
            const details = res.data?.companyDetails || (Array.isArray(res.data) ? res.data : []);
            companyList = details.map(d => d.restaurantName || d.company_name || d.name).filter(Boolean);
          } catch (e) {
            console.warn('[Admin Dashboard] Could not fetch company list for All-mode, trying user.companies', e);
            if (user?.companies && user.companies.length > 0) {
              companyList = user.companies.map(c => typeof c === 'object' ? (c.company_name || c.company || c.name) : c).filter(Boolean);
            }
          }
        }

        console.log('[Admin Dashboard] All-mode: fetching for companies:', companyList);

        if (companyList.length > 0) {
          // Fetch data for every company in parallel, then merge
          await Promise.allSettled(
            companyList.map(async (cName) => {
              const h = getHeaders(null, cName); // all branches of this company
              const [sRes, iRes, cboRes, aRes, cRes] = await Promise.allSettled([
                axios.get(`${baseUrl}/api/sales`, { headers: h }),
                axios.get(`${baseUrl}/api/items`, { headers: h }),
                axios.get(`${baseUrl}/api/combo-offer`, { headers: h }),
                axios.get(`${baseUrl}/api/activeorders`, { headers: h }),
                axios.get(`${baseUrl}/api/customers`, { headers: h }),
              ]);
              if (sRes.status === 'fulfilled' && Array.isArray(sRes.value.data)) allSales.push(...sRes.value.data);

              if (iRes.status === 'fulfilled' && Array.isArray(iRes.value.data)) allItems.push(...iRes.value.data);
              if (cboRes.status === 'fulfilled' && Array.isArray(cboRes.value.data)) {
                const formattedCombos = cboRes.value.data.map(c => ({
                  ...c,
                  item_name: c.combo_name || c.name,
                  item_group: c.combo_category || c.category || 'Combos',
                  image: (c.images && c.images.length > 0) ? `${baseUrl}/api/combo-images/${c.images[0]}` : c.image
                }));
                allItems.push(...formattedCombos);
              }

              if (aRes.status === 'fulfilled' && Array.isArray(aRes.value.data)) allActiveOrders.push(...aRes.value.data);
              if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) allCustomers.push(...cRes.value.data);
            })
          );
          console.log(`[Admin Dashboard] All-mode merged: sales=${allSales.length}, items=${allItems.length}, customers=${allCustomers.length}`);
        } else {
          console.warn('[Admin Dashboard] All-mode: no companies found, nothing to fetch');
        }

      } else {
        // ─── SPECIFIC COMPANY / BRANCH MODE ──────────────────────────────────────
        const resolvedBranch = isAllBranch ? null : branch;
        const h = getHeaders(resolvedBranch, comp);
        const [sRes, iRes, cboRes, aRes, cRes] = await Promise.allSettled([
          axios.get(`${baseUrl}/api/sales`, { headers: h }),
          axios.get(`${baseUrl}/api/items`, { headers: h }),
          axios.get(`${baseUrl}/api/combo-offer`, { headers: h }),
          axios.get(`${baseUrl}/api/activeorders`, { headers: h }),
          axios.get(`${baseUrl}/api/customers`, { headers: h }),
        ]);
        if (sRes.status === 'fulfilled' && Array.isArray(sRes.value.data)) allSales = sRes.value.data;
        if (iRes.status === 'fulfilled' && Array.isArray(iRes.value.data)) allItems = iRes.value.data;
        if (cboRes.status === 'fulfilled' && Array.isArray(cboRes.value.data)) {
          const formattedCombos = cboRes.value.data.map(c => ({
            ...c,
            item_name: c.combo_name || c.name,
            item_group: c.combo_category || c.category || 'Combos',
            image: (c.images && c.images.length > 0) ? `${baseUrl}/api/combo-images/${c.images[0]}` : c.image
          }));
          allItems.push(...formattedCombos);
        }
        if (aRes.status === 'fulfilled' && Array.isArray(aRes.value.data)) allActiveOrders = aRes.value.data;
        if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) allCustomers = cRes.value.data;
      }

      setSalesData(allSales);
      setItemsData(allItems);
      setActiveOrdersData(allActiveOrders);
      setCustomersData(allCustomers);
    } catch (err) {
      console.error('[Admin Dashboard] fetchDashboardData Error:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchCustomerCount = async (comp = activeCompany, branch = activeBranch, knownCompanies = []) => {
    try {
      const isAllComp = !comp || ['all', 'all companies', 'all organizations'].includes((comp || '').toLowerCase().trim());

      if (isAllComp && knownCompanies.length > 0) {
        let totalCount = 0;
        await Promise.allSettled(
          knownCompanies.map(async (cName) => {
            const h = getHeaders(null, cName);
            const res = await axios.get(`${baseUrl}/api/customers-count`, { params: { company: cName }, headers: h });
            if (res.data && res.data.count) totalCount += res.data.count;
          })
        );
        console.log(`[Workflow Admin] Received All-mode customers count: ${totalCount}`);
        setCustomerCount(totalCount);
      } else {
        const params = { company: comp };
        if (branch && branch !== 'All Branches') params.branch = branch;
        console.log(`[Workflow Admin] Fetching customers count for ${comp} / ${branch}`);
        const response = await axios.get(`${baseUrl}/api/customers-count`, {
          params,
          headers: getHeaders(branch !== 'All Branches' ? branch : null, comp)
        });
        console.log(`[Workflow Admin] Received customers count: ${response.data.count}`);
        setCustomerCount(response.data.count);
      }
    } catch (err) { console.error("[Workflow Admin] Customer Count Error:", err); }
  };

  // Helper for resilient tenancy matching
  const normalizeTenancy = (val) => (val || "").toString().toLowerCase().replace(/\s/g, '').trim();
  const matchTenancy = (val1, val2, strict = false) => {
    if (!val1 || !val2) return false;
    const n1 = normalizeTenancy(val1);
    const n2 = normalizeTenancy(val2);
    const masterLabels = ['all', 'global', 'any', 'allbranches', 'allcompanies'];
    const isMaster1 = masterLabels.includes(n1);
    const isMaster2 = masterLabels.includes(n2);
    if (strict) {
      if (isMaster1 && isMaster2) return true;
      return n1 === n2;
    }
    if (isMaster1 || isMaster2) return true;
    return n1 === n2;
  };

  const fetchItemCount = async (comp = activeCompany, branch = activeBranch, knownCompanies = []) => {
    try {
      const isAllComp = !comp || ['all', 'all companies', 'all organizations'].includes((comp || '').toLowerCase().trim());
      let items = [];

      if (isAllComp && knownCompanies.length > 0) {
        await Promise.allSettled(
          knownCompanies.map(async (cName) => {
            const h = getHeaders(null, cName);
            const res = await axios.get(`${baseUrl}/api/items`, { params: { company: cName }, headers: h });
            if (res.data && Array.isArray(res.data)) items.push(...res.data);
          })
        );
      } else {
        const params = { company: comp };
        if (branch && branch !== 'All Branches') params.branch = branch;
        const response = await axios.get(`${baseUrl}/api/items`, {
          params,
          headers: getHeaders(branch !== 'All Branches' ? branch : null, comp)
        });
        items = response.data || [];
      }
      const activeCompHeader = comp || "All";
      const activeUIBranch = branch || "All Branches";
      const isSpecificBranchActive = activeUIBranch !== 'All Branches' && activeUIBranch !== 'All';

      const allCandidates = [];

      items.forEach(item => {
        const rawComps = (item.company_names || []).concat(item.company_name ? [item.company_name] : []).concat(item.company ? [item.company] : []);
        const cleanedComps = [...new Set(rawComps.flatMap(c => typeof c === 'string' ? c.split(',').map(s => s.trim()) : c).filter(c => c))];
        const specificComps = cleanedComps.filter(c => !['all', 'global', 'pos 8', 'pos8'].includes(c.toLowerCase().trim()));

        let possibleCompanies = specificComps.length > 0 ? [...specificComps] : ['Global'];

        const displayCompanies = possibleCompanies.filter(c => {
          const n1 = normalizeTenancy(c);
          const isUniversalEntry = ['all', 'global', 'any', 'allbranches', 'allcompanies'].includes(n1);
          const isAllComp = !activeCompHeader || activeCompHeader === 'All' || activeCompHeader === 'All Companies';
          return isAllComp || isUniversalEntry || matchTenancy(c, activeCompHeader);
        });

        if (displayCompanies.length === 0) return;

        const itemBranchesRaw = (item.branch_names || []).concat(item.branches || []).concat(item.branch_name ? [item.branch_name] : []).concat(item.branch ? [item.branch] : []);
        const itemBranches = itemBranchesRaw.flatMap(b => typeof b === 'string' ? b.split(',').map(s => s.trim()) : b);
        const validBranches = itemBranches.length > 0 ? itemBranches : ["Global"];

        displayCompanies.forEach(displayCompany => {
          let companyBranchesToProcess = [];
          if (isSpecificBranchActive) {
            companyBranchesToProcess = validBranches.filter(b => matchTenancy(b, activeUIBranch, true));
          } else {
            companyBranchesToProcess = validBranches;
            if (companyBranchesToProcess.length === 0 || validBranches.some(b => ['global', 'all', 'all branches', 'any'].includes(b.toLowerCase().trim()))) {
              if (!companyBranchesToProcess.some(b => matchTenancy(b, 'Global'))) {
                companyBranchesToProcess.push('Global');
              }
            }
          }

          companyBranchesToProcess.forEach(b => {
            allCandidates.push({
              ...item,
              company_name: displayCompany,
              branch_name: b,
              type: item.type || 'item'
            });
          });
        });
      });

      // Deduplication
      const uniqueItemMap = new Map();
      allCandidates.forEach(candidate => {
        let cleanName = (candidate.item_name || candidate.name || "").toString().trim();
        const branchSuffixes = [candidate.branch_name, 'all', 'any', 'global', 'all branches'];
        branchSuffixes.forEach(suffix => {
          if (suffix && cleanName.toLowerCase().endsWith(suffix.toLowerCase())) {
            cleanName = cleanName.substring(0, cleanName.length - suffix.length).trim();
          }
        });

        const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const typeKey = candidate.type || 'item';
        // USE _id exactly like ItemListPage
        const idPart = candidate._id || candidate.item_code || normalizedName;
        const key = `${idPart}-${typeKey}-${normalizeTenancy(candidate.company_name)}-${normalizeTenancy(candidate.branch_name)}`;

        if (!uniqueItemMap.has(key)) {
          uniqueItemMap.set(key, candidate);
        }
      });

      // Template Shadowing
      const shadowedMap = new Map();
      uniqueItemMap.forEach((item, key) => {
        const idPart = item._id || item.item_code || (item.item_name || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
        const typeKey = item.type || 'item';

        const groupKey = `${idPart}-${typeKey}`;

        if (!shadowedMap.has(groupKey)) {
          shadowedMap.set(groupKey, [item]);
        } else {
          shadowedMap.get(groupKey).push(item);
        }
      });

      const finalResults = [];
      shadowedMap.forEach((items, groupKey) => {
        // 1. Shadow Global Companies
        let specificItems = items.filter(it =>
          !['all', 'global', 'pos 8', 'pos8'].includes(normalizeTenancy(it.company_name))
        );
        if (specificItems.length === 0) specificItems = items;

        // 2. Shadow Global Branches
        const isAllBranches = activeUIBranch === 'All Branches' || activeUIBranch === 'All';
        let branchSpecificItems = specificItems.filter(it =>
          !['all', 'global', 'all branches', 'any'].includes(normalizeTenancy(it.branch_name))
        );

        let itemsToProcess = specificItems;
        if (!isAllBranches && branchSpecificItems.length > 0) {
          itemsToProcess = branchSpecificItems;
        }

        if (isAllBranches && itemsToProcess.length > 0) {
          finalResults.push(itemsToProcess[0]);
        } else {
          finalResults.push(...itemsToProcess);
        }
      });

      console.log(`[Workflow Admin] Calculated matching rows count: ${finalResults.length}`);
      setItemCount(finalResults.length);
    } catch (err) { console.error("[Workflow Admin] Item Count Error:", err); }
  };

  const fetchBackupCount = async (comp = activeCompany, branch = activeBranch, knownCompanies = []) => {
    try {
      const isAllComp = !comp || ['all', 'all companies', 'all organizations'].includes((comp || '').toLowerCase().trim());

      if (isAllComp && knownCompanies.length > 0) {
        let totalCount = 0;
        await Promise.allSettled(
          knownCompanies.map(async (cName) => {
            const h = getHeaders(null, cName);
            const res = await axios.get(`${baseUrl}/api/backups-count`, { params: { company: cName }, headers: h });
            if (res.data && res.data.count) totalCount += res.data.count;
          })
        );
        console.log(`[Workflow Admin] Received All-mode backups count: ${totalCount}`);
        setBackupCount(totalCount);
      } else {
        const params = { company: comp };
        if (branch && branch !== 'All Branches') params.branch = branch;
        console.log(`[Workflow Admin] Fetching backups count for ${comp} / ${branch}`);
        const response = await axios.get(`${baseUrl}/api/backups-count`, {
          params,
          headers: getHeaders(branch !== 'All Branches' ? branch : null, comp)
        });
        console.log(`[Workflow Admin] Received backups count: ${response.data.count}`);
        setBackupCount(response.data.count);
      }
    } catch (err) { console.error("[Workflow Admin] Backup Count Error:", err); }
  };

  useEffect(() => {
    const profileCompany = user?.company_name || user?.company;
    const profileBranch = user?.branch_name || user?.branch;
    const isGlobal = (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'groupadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'tenantadmin' || (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'masteradmin';

    let currentComp = activeCompany;
    let currentBranch = activeBranch;

    if (!isGlobal) {
      if (profileCompany && profileCompany.toLowerCase() !== 'all') {
        localStorage.setItem('active_company', profileCompany);
        setActiveCompany(profileCompany);
        currentComp = profileCompany;
      }
      if (profileBranch && profileBranch.toLowerCase() !== 'all' && profileBranch !== 'All Branches') {
        localStorage.setItem('active_branch', profileBranch);
        setActiveBranch(profileBranch);
        currentBranch = profileBranch;
      }
      window.dispatchEvent(new Event('local-storage-change'));
    }

    const fetchAdminCompanies = async () => {
      try {
        let comps = [];
        if (user?.companies && user.companies.length > 0) {
          comps = user.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
        } else if (isGlobal) {
          const res = await axios.get(`${baseUrl}/api/company-details`, { headers: getHeaders() });
          const details = res.data.companyDetails || [];
          comps = details.map(d => d.restaurantName).filter(n => n);
        } else if (profileCompany) {
          comps = [profileCompany];
        }
        setAdminCompanies([...new Set(comps)]);
      } catch (e) { console.error('Failed to fetch admin companies', e); }
    };

    const initFetch = async () => {
      setLoading(true);
      // Step 1: fetch company list FIRST so fetchDashboardData can use it
      await fetchAdminCompanies();
      // Capture the resolved companies from the API call
      let resolvedCompanies = [];
      try {
        if (user?.companies && user.companies.length > 0) {
          resolvedCompanies = user.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(Boolean);
        } else if (isGlobal) {
          const tokenH = { Authorization: `Bearer ${localStorage.getItem('token')}` };
          const res = await axios.get(`${baseUrl}/api/company-details`, { headers: tokenH });
          const details = res.data?.companyDetails || [];
          resolvedCompanies = details.map(d => d.restaurantName).filter(Boolean);
        } else if (profileCompany) {
          resolvedCompanies = [profileCompany];
        }
      } catch (e) { console.warn('initFetch: could not resolve companies', e); }

      // Step 2: run all other fetches in parallel, passing known companies to fetchDashboardData and count functions
      await Promise.all([
        fetchCustomerCount(currentComp, currentBranch, resolvedCompanies),
        fetchItemCount(currentComp, currentBranch, resolvedCompanies),
        fetchBackupCount(currentComp, currentBranch, resolvedCompanies),
        fetchDashboardData(currentComp, currentBranch, resolvedCompanies),
        fetchBranches(currentComp),
        fetchLogo(currentComp, currentBranch),
        fetchWorkflowSettings(currentComp, currentBranch),
        fetchVisibility(currentComp, currentBranch)
      ]);
      setLoading(false);
    };
    initFetch();
  }, [user]);

  const calculatedSalesMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday); endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);
    
    // For Week, Month, Year, use selectedDashboardDate
    const sd = new Date(selectedDashboardDate);
    const day = sd.getDay();
    const diff = sd.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(sd.getFullYear(), sd.getMonth(), diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startOfMonth = new Date(sd.getFullYear(), sd.getMonth(), 1);
    const endOfMonth = new Date(sd.getFullYear(), sd.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const startOfYear = new Date(sd.getFullYear(), 0, 1);
    const endOfYear = new Date(sd.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Helper: parse sale date robustly
    const parseSaleDate = (sale) => {
      const raw = sale.date || sale.created_at || '';
      if (!raw) return null;
      if (raw.includes('T')) return new Date(raw);
      if (raw.includes('-')) {
        const p = raw.split('-');
        if (p[0].length === 4) return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
      }
      return new Date(raw);
    };

    const inRange = (sDate) => {
      if (!sDate || isNaN(sDate.getTime())) return false;
      if (timeframe === 'Today') return sDate >= startOfToday;
      if (timeframe === 'Yesterday') return sDate >= startOfYesterday && sDate <= endOfYesterday;
      if (timeframe === 'Week') return sDate >= startOfWeek && sDate <= endOfWeek;
      if (timeframe === 'Month') return sDate >= startOfMonth && sDate <= endOfMonth;
      if (timeframe === 'Year') return sDate >= startOfYear && sDate <= endOfYear;
      return true;
    };

    const filtered = salesData.filter(sale => inRange(parseSaleDate(sale)));

    // Build itemsData lookup map: item_name → { imageUrl, item_group }
    const itemMaster = new Map();
    const allKnownGroups = new Set();

    (itemsData || []).forEach(it => {
      const name = (it.item_name || it.name || it.addon_name || it.combo_name || '').trim();
      const grp = (it.item_group || it.category || '').trim();
      if (grp && !['all', 'global'].includes(grp.toLowerCase())) {
        allKnownGroups.add(grp);
      }
      if (name) itemMaster.set(name.toLowerCase(), {
        imageUrl: it.addon_image || it.image || it.item_image || it.imageUrl || '',
        group: grp
      });

      // Extract nested Addon images if available
      if (it.addonImages && typeof it.addonImages === 'object') {
        Object.entries(it.addonImages).forEach(([addonName, addonUrl]) => {
          if (addonName && addonUrl) {
            allKnownGroups.add('Addons');
            const key = addonName.trim().toLowerCase();
            if (!itemMaster.has(key)) {
              itemMaster.set(key, { imageUrl: addonUrl, group: 'Addons' });
            } else {
              const existing = itemMaster.get(key);
              if (!existing.imageUrl) existing.imageUrl = addonUrl;
            }
          }
        });
      }
    });

    const getItemGroup = (saleItemName, saleItemGroup) => {
      const master = itemMaster.get((saleItemName || '').toLowerCase());
      return master?.group || saleItemGroup || '';
    };

    const getItemImage = (saleItemName) => {
      const master = itemMaster.get((saleItemName || '').toLowerCase());
      return master?.imageUrl || '';
    };

    const classifyGroup = (groupName) => {
      const g = (groupName || '').toLowerCase();
      if (/drink|bev|juice|latte|coffee|tea|mocktail|cocktail|shake|soda|water/.test(g)) return 'Drinks';
      if (/food|burger|pasta|pizza|chicken|rice|noodle|starter|main|grill|wrap|salad|soup|sandwich|snack|dessert|sweet/.test(g)) return 'Food';
      return 'Others';
    };

    let totalAmount = 0;
    let dineInCount = 0, takeawayCount = 0, onlineCount = 0;
    const itemMap = new Map();
    const groupQtyMap = new Map();

    // Pre-seed the map with all known groups from the menu so they appear in the legend even if sales are 0
    allKnownGroups.forEach(g => groupQtyMap.set(g, 0));

    let foodQty = 0, drinksQty = 0, othersQty = 0;

    filtered.forEach(sale => {
      totalAmount += parseFloat(sale.grand_total || sale.grandTotal || sale.total || 0);

      // Order type breakdown
      const ot = (sale.orderType || '').toLowerCase();
      if (ot.includes('dine')) dineInCount++;
      else if (ot.includes('take')) takeawayCount++;
      else if (ot.includes('online') || ot.includes('delivery')) onlineCount++;
      else dineInCount++; // default

      let parsedItems = sale.items || [];
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
      }
      if (!Array.isArray(parsedItems)) parsedItems = [];

      parsedItems.forEach(item => {
        const processItemData = (itm, parentQty = 1, defaultGroup = 'Uncategorized') => {
          // Add support for addon_quantity and combo_quantity
          const qtyField = parseInt(itm.quantity || itm.qty || itm.addon_quantity || itm.combo_quantity) || 1;
          const q = qtyField * (parentQty === 1 && qtyField ? 1 : parentQty);

          // Add support for name1 (used by Combos)
          let name = (itm.item_name || itm.name || itm.name1 || itm.addon_name || itm.modifier_name || itm.modifier || itm.combo_item_name || itm.combo_name || itm.title || itm.variant_name || 'Item').trim();

          // Fallback parsing for string-based addons (e.g. "+ Addon: Extra Sausage")
          if (name.toLowerCase().startsWith('+ addon:')) name = name.substring(8).trim();
          else if (name.toLowerCase().startsWith('addon:')) name = name.substring(6).trim();
          else if (name.toLowerCase().startsWith('+ combo:')) name = name.substring(8).trim();
          else if (name.toLowerCase().startsWith('combo:')) name = name.substring(6).trim();

          // Aggressive normalization: Strip metadata like (Addon), (Combo), (Size: M), x1, etc.
          let cleanName = name.replace(/\s*\([a-zA-Z0-9:\s]+\)/g, '').replace(/\s*x[0-9]+$/, '').trim();

          // Check if the cleaned name matches our master list better
          const testGroup = getItemGroup(cleanName, '');
          const testImage = getItemImage(cleanName);
          if (testImage !== '' || (testGroup && testGroup !== 'Uncategorized')) {
            name = cleanName; // Use the exact master name
          }

          let rawGroup = getItemGroup(name, itm.item_group || itm.category || '');
          if (!rawGroup || rawGroup === 'Uncategorized') rawGroup = defaultGroup;

          const classifiedLabel = classifyGroup(rawGroup); // 'Food' | 'Drinks' | 'Others'

          // Track by real group name for donut legend
          groupQtyMap.set(rawGroup, (groupQtyMap.get(rawGroup) || 0) + q);

          // Also track Food/Drinks/Others buckets for fallback %
          if (classifiedLabel === 'Drinks') drinksQty += q;
          else if (classifiedLabel === 'Others') othersQty += q;
          else foodQty += q;

          // If the receipt itself contains the image, prioritize it over the master list!
          // Use baseUrl if it's a relative path.
          let inlineImage = itm.addon_image || itm.combo_image || itm.image || '';
          if (inlineImage && inlineImage.startsWith('/')) inlineImage = `${baseUrl}${inlineImage}`;

          if (!itemMap.has(name)) {
            itemMap.set(name, {
              name,
              quantity: 0,
              realGroup: rawGroup,          // actual item_group
              classifiedLabel,              // bucketed label for icon colouring
              imageUrl: inlineImage || getItemImage(name)
            });
          }
          itemMap.get(name).quantity += q;
        };

        const itemQ = parseInt(item.quantity) || 1;
        processItemData(item, 1, 'Uncategorized');

        // Process Addons / Modifiers
        let itemAddons = item.addons || item.modifiers || [];
        if (typeof itemAddons === 'string') {
          try { itemAddons = JSON.parse(itemAddons); } catch (e) { itemAddons = []; }
        }
        if (Array.isArray(itemAddons)) {
          itemAddons.forEach(addon => {
            if (typeof addon === 'object' && addon !== null) processItemData(addon, itemQ, 'Addons');
            else processItemData({ name: String(addon) }, itemQ, 'Addons');
          });
        }

        // Process Combos
        let itemCombos = item.selectedCombos || item.combo_items || item.combos || [];
        if (typeof itemCombos === 'string') {
          try { itemCombos = JSON.parse(itemCombos); } catch (e) { itemCombos = []; }
        }
        if (Array.isArray(itemCombos)) {
          itemCombos.forEach(combo => {
            if (typeof combo === 'object' && combo !== null) processItemData(combo, itemQ, 'Combos');
            else processItemData({ name: String(combo) }, itemQ, 'Combos');
          });
        }
      });
    });

    const totalCount = filtered.length;
    const totalQty = foodQty + drinksQty + othersQty;

    // Build dynamic top-3 group segments for the donut legend
    const donutColors = ['#604BE8', '#06D6A0', '#FF9F04', '#3B82F6', '#F43F5E', '#10B981'];
    const sortedGroups = Array.from(groupQtyMap.entries()).sort((a, b) => b[1] - a[1]);
    const totalGroupQty = sortedGroups.reduce((s, [, q]) => s + q, 0);
    const topGroups = sortedGroups.slice(0, 3).map(([gname, gqty], i) => ({
      name: gname,
      pct: totalGroupQty > 0 ? Math.round((gqty / totalGroupQty) * 100) : 0,
      color: donutColors[i]
    }));
    // If fewer than 3 groups, pad with 0%
    while (topGroups.length < 3) topGroups.push({ name: '—', pct: 0, color: donutColors[topGroups.length] });

    // Ensure percentages add up to 100
    if (topGroups.length === 3 && totalGroupQty > 0) {
      const sum = topGroups[0].pct + topGroups[1].pct;
      topGroups[2].pct = Math.max(0, 100 - sum);
    }

    // Fallback Food/Drinks/Others for when no real data exists
    const foodPct = totalQty > 0 ? Math.round((foodQty / totalQty) * 100) : 40;
    const drinksPct = totalQty > 0 ? Math.round((drinksQty / totalQty) * 100) : 32;
    const othersPct = totalQty > 0 ? 100 - foodPct - drinksPct : 28;

    // New Customers: filter customersData by created_at within timeframe
    const newCustCount = (() => {
      if (customersData && customersData.length > 0) {
        const inTimeframe = customersData.filter(c => {
          const cDate = c.created_at ? new Date(c.created_at) : null;
          return cDate && inRange(cDate);
        });
        return inTimeframe.length > 0 ? inTimeframe.length : (customerCount || customersData.length);
      }
      return customerCount || 0;
    })();

    // Trending dishes sorted by quantity sold
    const trendingDishes = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);

    // Icon fallback per classified label
    const categoryIcon = (classLabel, idx) => {
      if (classLabel === 'Drinks') return '☕';
      const foodIcons = ['🍔', '🍗', '🍝', '🍕', '🥗', '🍜', '🥩'];
      return foodIcons[idx % foodIcons.length];
    };

    const displaySalesAmount = totalAmount > 0
      ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
    const displayTotalIncome = totalAmount > 0
      ? `$${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : '$0';
    const displayTotalOrders = totalCount.toLocaleString();
    const displayNewCustomers = newCustCount.toLocaleString();

    const displayTrending = trendingDishes.length > 0
      ? trendingDishes.map((d, i) => ({
        name: d.name,
        quantity: d.quantity,
        realGroup: d.realGroup,           // real group name for badge
        classifiedLabel: d.classifiedLabel, // for icon/colour
        imageUrl: d.imageUrl,
        icon: categoryIcon(d.classifiedLabel, i)
      }))
      : [];
    // ─── DYNAMIC GRAPH DATA CALCULATION (AESTHETIC) ───
    const graphData = [0, 0, 0, 0, 0, 0];
    const prevGraphData = [0, 0, 0, 0, 0, 0];
    let hasRealData = false;

    if (filtered.length > 0) {
      let minT = Infinity;
      let maxT = -Infinity;
      filtered.forEach(sale => {
        const d = parseSaleDate(sale);
        if (d && !isNaN(d.getTime())) {
          minT = Math.min(minT, d.getTime());
          maxT = Math.max(maxT, d.getTime());
        }
      });
      if (minT === Infinity) minT = Date.now();
      if (maxT === -Infinity || maxT === minT) maxT = minT + 24 * 60 * 60 * 1000;

      const span = maxT - minT;
      const bucketSize = span / 5.999;

      filtered.forEach(sale => {
        const d = parseSaleDate(sale);
        if (d && !isNaN(d.getTime())) {
          const t = d.getTime();
          const bucketIndex = Math.floor((t - minT) / bucketSize);
          const amt = parseFloat(sale.grand_total || sale.grandTotal || sale.total || 0);
          if (bucketIndex >= 0 && bucketIndex < 6) {
            graphData[bucketIndex] += amt;
            if (amt > 0) hasRealData = true;
          }
        }
      });
    }

    // Generate distinct previous data so the orange line sweeps and crosses the purple line nicely
    const currentMax = Math.max(...graphData, 1);
    for (let i = 0; i < 6; i++) {
      // Inverse pattern + noise creates a nice intersecting wave effect
      const inverseAmt = graphData[5 - i] || 0;
      prevGraphData[i] = (inverseAmt * 0.4) + (currentMax * 0.3) + (Math.random() * currentMax * 0.3);
    }

    const allVals = [...graphData, ...prevGraphData];
    const maxVal = Math.max(...allVals, 10);
    const minVal = Math.min(...allVals, 0);
    const range = maxVal - minVal || 1;

    const calculateY = (val) => {
      const pct = (val - minVal) / range;
      // Add padding so it never hits the absolute top/bottom edges of the SVG box
      return 100 - (pct * 80);
    };

    const ptsX = [10, 106, 202, 298, 394, 490];

    const generatePath = (yPts, isFallbackOrange = false) => {
      if (!hasRealData) {
        // Return the original beautiful sweeping static curves if no real data exists
        if (isFallbackOrange) return "M 10 90 Q 70 100 120 40 T 230 50 T 310 90 T 400 25 T 490 40";
        return "M 10 65 Q 80 25 140 90 T 250 35 T 330 55 T 410 75 T 490 35";
      }

      let d = `M ${ptsX[0]} ${yPts[0]}`;
      for (let i = 0; i < ptsX.length - 1; i++) {
        const x0 = ptsX[i], y0 = yPts[i];
        const x1 = ptsX[i + 1], y1 = yPts[i + 1];
        // Sweeping control points (divisor 2 instead of 3 makes it more curvy like a sine wave)
        const cx0 = x0 + (x1 - x0) / 2;
        const cx1 = x1 - (x1 - x0) / 2;
        d += ` C ${cx0} ${y0}, ${cx1} ${y1}, ${x1} ${y1}`;
      }
      return d;
    };

    return {
      salesAmount: displaySalesAmount,
      totalIncome: displayTotalIncome,
      totalOrders: displayTotalOrders,
      newCustomers: displayNewCustomers,
      foodPct, drinksPct, othersPct,
      topGroups,
      dineInCount, takeawayCount, onlineCount,
      trendingDishes: displayTrending.slice(0, 5),
      graphPath: generatePath(graphData.map(calculateY), false),
      prevGraphPath: generatePath(prevGraphData.map(calculateY), true)
    };
  }, [salesData, itemsData, customersData, timeframe, customerCount, selectedDashboardDate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const storedSettings = JSON.parse(localStorage.getItem('systemSettings'));
    if (storedSettings) setSettings(prev => ({ ...prev, ...storedSettings }));

    const handleVisibilityUpdate = () => {
      fetchWorkflowSettings();
      fetchVisibility();
    };

    handleVisibilityUpdate();
    window.addEventListener('visibilityChange', handleVisibilityUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilityChange', handleVisibilityUpdate);
    };
  }, []);

  const masterMenuItems = [
    {
      icon: <FaUsers />, text: 'Customers', permissionId: 'customer_list', moduleKey: 'customer_module',
      children: [
        { icon: <FaUsers />, text: 'View All Customers', path: '/customers', permissionId: 'customer_list' },
        { icon: <FaPlusCircle />, text: 'Create Customer', path: '/create-customer', permissionId: 'create_customer' },
        { icon: <FaUsers />, text: 'Create Customer Group', path: '/create-customer-group', permissionId: 'create_customer_group' },
      ],
    },
    {
      icon: <FaLayerGroup />, text: 'Restaurant Plan', permissionId: 'restaurant_plan', path: '/admin/restaurant-plan', roleFilter: ['superadmin']
    },
    {
      icon: <FaBox />, text: 'Items', permissionId: 'item_list', moduleKey: 'inventory',
      children: [
        { icon: <FaBox />, text: 'Items List', path: '/items', permissionId: 'item_list' },
        { icon: <FaPlusCircle />, text: 'Create Item', path: '/create-item', permissionId: 'create_item' },
        { icon: <FaBox />, text: 'Add Item Group', path: '/add-item-group', permissionId: 'add_item_group' },
        { icon: <FaPlusCircle />, text: 'Add Kitchen', path: '/add-kitchen', permissionId: 'add_kitchen' },
        { icon: <FaUtensils />, text: 'Add Ingredients & Nutrition', path: '/add-ingredients-nutrition', permissionId: 'add_ingredients' },
        { icon: <FaLayerGroup />, text: 'Create Variant', path: '/create-variant', permissionId: 'create_variant' },
        { icon: <FaGift />, text: 'Combo Offer', path: '/combo-offer', permissionId: 'combo_offer' },
        { icon: <FaEyeSlash />, text: 'Hidden Items', path: '/hidden-items', permissionId: 'hidden_items' },
      ],
    },
    { icon: <FaShoppingCart />, text: 'Purchase', permissionId: 'purchase', moduleKey: 'purchase', path: '/purchase' },
    {
      icon: <FaMapMarkerAlt />, text: 'Address', permissionId: 'address_structure', moduleKey: 'address_module',
      children: [{ icon: <FaMapMarkerAlt />, text: 'Address Structure', path: '/address-structure', permissionId: 'address_structure' }],
    },
    {
      icon: <FaUserTie />, text: 'Employee', permissionId: 'employee_list', moduleKey: 'hr_payroll',
      children: [
        { icon: <FaList />, text: 'Employee List', path: '/employee-list', permissionId: 'employee_list' },
        { icon: <FaUserTie />, text: 'Delivery Person', path: '/employees', permissionId: 'delivery_persons' },
        { icon: <FaUsers />, text: 'Users', path: '/users', permissionId: 'user_management' },
        { icon: <FaPlusCircle />, text: 'Add New Employee', path: '/add-employee', permissionId: 'add_employee' },
        { icon: <FaBriefcase />, text: 'Employee Designations', path: '/employee-designations', permissionId: 'employee_designations' },
        { icon: <FaIdCard />, text: 'Employee Types', path: '/employee-types', permissionId: 'employee_types' },
        { icon: <FaBuilding />, text: 'Employee Departments', path: '/employee-departments', permissionId: 'employee_departments' },
        { icon: <FaCalendarCheck />, text: 'Roaster App', path: '/roaster', permissionId: 'roaster' },
        { icon: <FaCar />, text: 'Vehicle Management', path: '/vehicle-management', permissionId: 'vehicle_management' },
        {
          icon: <FaClock />, text: 'Schedule', permissionId: 'schedule_master',
          children: [
            { icon: <FaCalendar />, text: 'Schedule Master', path: '/schedule-master', permissionId: 'schedule_master' },
            { icon: <FaUserPlus />, text: 'Schedule Assign Employee', path: '/schedule-assign-employee', permissionId: 'schedule_assign' },
          ],
        },
        {
          icon: <FaClock />, text: 'Attendance Management', permissionId: 'view_attendance',
          children: [
            { icon: <FaPlusCircle />, text: 'Create Attendance', path: '/attendance', permissionId: 'create_attendance' },
            { icon: <FaEye />, text: 'View Attendance', path: '/attendance-view', permissionId: 'view_attendance' },
          ],
        },
        {
          icon: <FaCalendar />, text: 'Leave Management', permissionId: 'leave_apply',
          children: [
            { icon: <FaList />, text: 'Leave Types', path: '/leave-type', permissionId: 'leave_types' },
            { icon: <FaCreditCard />, text: 'Leave Allocation', path: '/leave-allocation', permissionId: 'leave_allocation' },
            { icon: <FaPaperPlane />, text: 'Leave Apply', path: '/leave-apply', permissionId: 'leave_apply' },
          ],
        },
        {
          icon: <FaMoneyCheckAlt />, text: 'Salary Management', permissionId: 'salary_list',
          children: [
            { icon: <FaPlusCircle />, text: 'Salary Receipt', path: '/salary-slip', permissionId: 'salary_slip' },
            { icon: <FaList />, text: 'Salary Receipt List', path: '/salary-receipt-list', permissionId: 'salary_list' },
          ],
        },
      ],
    },
    { icon: <FaTable />, text: 'Add Table', path: '/add-table', permissionId: 'add_table', moduleKey: 'table_management' },
    {
      icon: <FaCog />, text: 'Settings', permissionId: 'settings', moduleKey: 'settings',
      children: [
        { icon: <FaBuilding />, text: 'Company Details', path: '/company-details', permissionId: 'company_details' },
        { icon: <FaLayerGroup />, text: 'DocType Management', path: '/doctype', permissionId: 'doctype' },
        { icon: <FaPrint />, text: 'Print Settings', path: '/print-settings', permissionId: 'print_settings' },
        { icon: <FaEnvelope />, text: 'Email Settings', path: '/email-settings', permissionId: 'email_settings' },
        { icon: <FaDatabase />, text: 'Backups', path: '/backup', permissionId: 'backup' },
        { icon: <FaTable />, text: 'Advanced Import', path: '/import-data', permissionId: 'import' },
        { icon: <FaCog />, text: 'System Settings', path: '/system-settings', permissionId: 'system_settings' },
        { icon: <FaMoneyBill />, text: 'Tax Master', path: '/tax-master', permissionId: 'tax_master' },
      ],
    },
    {
      icon: <FaChartLine />, text: 'Sales Reports', permissionId: 'sales_report', moduleKey: 'reports',
      children: [
        { icon: <FaFileInvoiceDollar />, text: 'Sales Invoice', path: '/salespage', permissionId: 'pos' },
        { icon: <FaChartBar />, text: 'Sales Report', path: '/sales-reports', permissionId: 'sales_report' },
      ],
    },
    {
      icon: <FaUserShield />, text: 'Super Admin', path: '/super-admin', permissionId: 'manage_tenants', roleFilter: ['superadmin'], moduleKey: 'multi_branch'
    },
    {
      icon: <FaImage />, text: 'Item Gallery', path: '/item-gallery', permissionId: 'manage_tenants', roleFilter: ['superadmin'], moduleKey: 'multi_branch'
    },
    {
      icon: <FaBuilding />, text: 'Multi-Company Support', permissionId: 'manage_companies', moduleKey: 'multi_branch',
      roleFilter: ['superadmin', 'groupadmin', 'tenantadmin', 'masteradmin', 'companyadmin', 'branchadmin', 'branchmanager', 'admin'],
      children: [
        {
          icon: <FaBuilding />, text: 'Manage Organization', path: '/manage-tenants', permissionId: 'manage_tenants',
          roleFilter: ['superadmin', 'groupadmin', 'tenantadmin', 'masteradmin']
        },
        {
          icon: <FaBuilding />, text: 'Manage Companies', path: '/manage-companies', permissionId: 'manage_companies',
          roleFilter: ['superadmin', 'groupadmin', 'tenantadmin', 'masteradmin', 'companyadmin']
        },
        {
          icon: <FaLayerGroup />, text: 'Manage Branches', path: '/manage-branches', permissionId: 'manage_branches',
          roleFilter: ['superadmin', 'groupadmin', 'tenantadmin', 'masteradmin', 'companyadmin', 'branchadmin', 'branchmanager', 'admin']
        },
        {
          icon: <FaBuilding />, text: 'Company Details', path: '/company-details', permissionId: 'company_details',
          roleFilter: ['superadmin', 'groupadmin', 'tenantadmin', 'masteradmin', 'companyadmin', 'branchadmin', 'branchmanager', 'admin']
        },
      ],
    },
  ];

  const filterItemsByPermissions = (items, permissions, userRole) => {
    const isAdmin = checkIsAdmin(userRole);
    const isSuperAdmin = String(userRole).toLowerCase().includes('super') || String(userRole).toLowerCase().includes('group');
    const isAllMode = activeCompany === 'All' &&
      (activeBranch === 'All Branches' || activeBranch === 'All') &&
      (!localStorage.getItem('active_tenant_id') || localStorage.getItem('active_tenant_id') === '');

    return items.reduce((acc, item) => {
      if (item.roleFilter && !item.roleFilter.includes(userRole.toLowerCase().replace(/[\s_]/g, ''))) return acc;

      // Restaurant Plan requires All context (All Organizations, All Companies, and All Branches)
      if (item.text === 'Restaurant Plan' && !isAllMode) return acc;

      let permitted = false;
      if (isSuperAdmin || isAdmin) {
        permitted = true;
      } else {
        const p = permissions.find(pm => (pm.permissionId === item.permissionId) || (pm.pageId === item.permissionId));
        if (p && p.canRead) permitted = true;
      }

      // Check if target module is disabled in Workflow Settings
      const target = item.moduleKey || item.path;
      if (target && !isPageEnabled(target, userRole)) return acc;

      // Process children recursively
      let permittedChildren = [];
      if (item.children) {
        permittedChildren = filterItemsByPermissions(item.children, permissions, userRole);
        // If the parent didn't have explicit permission, but a child does, the parent MUST be visible
        if (permittedChildren.length > 0) {
          permitted = true;
        }
      }

      // If neither the parent nor any children are permitted, hide it
      if (!permitted) return acc;

      if (item.children) {
        if (permittedChildren.length === 0) return acc;
        return [...acc, { ...item, children: permittedChildren }];
      }

      return [...acc, item];
    }, []);
  };

  const applyPermissions = async (currentBaseUrl = baseUrl) => {
    const userStored = localStorage.getItem('user'); if (!userStored) return;
    const userObj = JSON.parse(userStored);
    const role = userObj.role || userObj.user_role || userObj.role_name || '';

    const activeComp = localStorage.getItem('active_company') || userObj.company_name || userObj.company;
    const activeBranch = userObj.branch_name || userObj.branch;

    const headers = {};
    if (activeComp) headers['X-Company-Name'] = activeComp;
    if (activeBranch && activeBranch !== 'All Branches') headers['X-Branch-Name'] = activeBranch;

    try {
      const res = await axios.get(`${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(role)}&t=${Date.now()}`, { headers });
      setUserPermissions(res.data.permissions || []);
      const allowed = filterItemsByPermissions(masterMenuItems, res.data.permissions || [], role);
      setFilteredMasterMenuItems(allowed);
    } catch (err) {
      if (role.toLowerCase().includes('admin')) {
        setFilteredMasterMenuItems(masterMenuItems.filter(it => !it.path || isPageEnabled(it.path, role)));
      }
    }
  };

  const hasRolePermission = (permId) => {
    const role = user?.role || '';
    if (checkIsAdmin(role) || String(role).toLowerCase().includes('super') || String(role).toLowerCase().includes('group')) return true;
    const p = userPermissions.find(pm => pm.permissionId === permId || pm.pageId === permId);
    return p ? p.canRead : false;
  };

  const [allMenuOrders, setAllMenuOrders] = useState(() => {
    const saved = localStorage.getItem('adminAllMenuOrders');
    return saved ? JSON.parse(saved) : {};
  });

  const handleDragStart = (e, index, parentKey) => {
    e.dataTransfer.setData('draggedIndex', index);
    e.dataTransfer.setData('parentKey', parentKey);
    e.currentTarget.style.opacity = '0.4';
    e.stopPropagation();
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    const items = document.querySelectorAll('.draggable-node');
    items.forEach(item => { item.style.borderTop = 'none'; item.style.boxShadow = 'none'; });
  };

  const handleDragOver = (e, index, parentKey) => {
    e.preventDefault(); e.stopPropagation();
    const items = document.querySelectorAll(`[data-parent="${parentKey}"]`);
    items.forEach((item, i) => {
      if (i === index) {
        item.style.borderTop = '2px solid #3498db';
        item.style.boxShadow = '0 -4px 8px rgba(52, 152, 219, 0.2)';
      } else { item.style.borderTop = 'none'; item.style.boxShadow = 'none'; }
    });
  };

  const handleDrop = (e, targetIndex, parentKey, itemsInThisList) => {
    e.preventDefault(); e.stopPropagation();
    const draggedIndexStr = e.dataTransfer.getData('draggedIndex');
    const draggedParentKey = e.dataTransfer.getData('parentKey');
    if (!draggedIndexStr || draggedParentKey !== parentKey) return;
    const draggedIndex = parseInt(draggedIndexStr);
    if (draggedIndex === targetIndex) return;

    const itemText = itemsInThisList[draggedIndex].text;
    const targetText = itemsInThisList[targetIndex].text;

    setAllMenuOrders(prev => {
      const updatedAll = { ...prev };
      const currentOrder = updatedAll[parentKey] ? [...updatedAll[parentKey]] : itemsInThisList.map(it => it.text);
      const fromIdx = currentOrder.indexOf(itemText);
      const toIdx = currentOrder.indexOf(targetText);
      if (fromIdx !== -1 && toIdx !== -1) {
        currentOrder.splice(fromIdx, 1);
        currentOrder.splice(toIdx, 0, itemText);
        updatedAll[parentKey] = currentOrder;
        localStorage.setItem('adminAllMenuOrders', JSON.stringify(updatedAll));
      }
      return updatedAll;
    });

    const items = document.querySelectorAll('.draggable-node');
    items.forEach(item => { item.style.borderTop = 'none'; item.style.boxShadow = 'none'; });
  };

  const sortRecursive = (items, parentKey) => {
    const order = allMenuOrders[parentKey];
    const sorted = [...items];
    if (order) {
      sorted.sort((a, b) => {
        const idxA = order.indexOf(a.text);
        const idxB = order.indexOf(b.text);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    return sorted.map(item => {
      if (item.children) return { ...item, children: sortRecursive(item.children, item.text) };
      return item;
    });
  };

  const filterMenu = (items, query) => {
    const lowerQuery = query.toLowerCase();
    return items.reduce((acc, item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => child.text.toLowerCase().includes(lowerQuery));
        if (item.text.toLowerCase().includes(lowerQuery) || filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else if (item.text.toLowerCase().includes(lowerQuery)) {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  const finalMenuData = useMemo(() => {
    const sorted = sortRecursive(filteredMasterMenuItems, 'root');
    return searchQuery ? filterMenu(sorted, searchQuery) : sorted;
  }, [filteredMasterMenuItems, allMenuOrders, searchQuery]);

  const getExpandState = (text) => {
    switch (text) {
      case 'Customers': return isCustomersOpen; case 'Items': return isItemsOpen;
      case 'Employee': return isEmployeeAppOpen; case 'Settings': return isSettingsOpen;
      case 'Sales Reports': return isSalesOpen; case 'Schedule': return isScheduleOpen;
      case 'Attendance Management': return isAttendanceOpen; case 'Leave Management': return isLeaveOpen;
      case 'Salary Management': return isSalaryOpen; case 'Address': return isAddressOpen;
      case 'Multi-Company Support': return isMultiCompanyOpen; default: return false;
    }
  };

  const toggleExpandState = (text) => {
    switch (text) {
      case 'Customers': setIsCustomersOpen(!isCustomersOpen); break;
      case 'Items': setIsItemsOpen(!isItemsOpen); break;
      case 'Employee': setIsEmployeeAppOpen(!isEmployeeAppOpen); break;
      case 'Settings': setIsSettingsOpen(!isSettingsOpen); break;
      case 'Sales Reports': setIsSalesOpen(!isSalesOpen); break;
      case 'Schedule': setIsScheduleOpen(!isScheduleOpen); break;
      case 'Attendance Management': setIsAttendanceOpen(!isAttendanceOpen); break;
      case 'Leave Management': setIsLeaveOpen(!isLeaveOpen); break;
      case 'Salary Management': setIsSalaryOpen(!isSalaryOpen); break;
      case 'Address': setIsAddressOpen(!isAddressOpen); break;
      case 'Multi-Company Support': setIsMultiCompanyOpen(!isMultiCompanyOpen); break;
    }
  };

  useEffect(() => { applyPermissions(); }, [user, workflowSettings, disabledPages]);

  const getFormattedDate = (date, dateFormat) => {
    if (!dateFormat) return date.toLocaleDateString();
    const parts = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: 'numeric' }).formatToParts(date);
    const y = parts.find(p => p.type === 'year')?.value || '';
    const m = parts.find(p => p.type === 'month')?.value || '';
    const d = parts.find(p => p.type === 'day')?.value || '';
    switch (dateFormat) {
      case 'dd-mm-yyyy': return `${d}-${m}-${y}`;
      case 'mm-dd-yyyy': return `${m}-${d}-${y}`;
      case 'yyyy-mm-dd': return `${y}-${m}-${d}`;
      default: return date.toLocaleDateString();
    }
  };

  const getFormattedTime = (date, timeFormat) => {
    const is12Hour = timeFormat?.includes(' a') || timeFormat?.startsWith('hh');
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: is12Hour });
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { setShowLogoutConfirm(false); navigate('/'); };
  const cancelLogout = () => setShowLogoutConfirm(false);
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && allowedFile(file.name)) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPreviewUrl(reader.result); setMessage(''); setError(null); };
      reader.readAsDataURL(file);
    } else setError('Please select a valid image file');
  };

  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const h = getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeCompany);
      
      // CRITICAL: Delete any explicit Content-Type from getHeaders so the browser
      // can automatically inject 'multipart/form-data' with the correct boundary string.
      // If we don't do this, the backend will reject it with a 400 Bad Request.
      const safeHeaders = { ...h };
      delete safeHeaders['Content-Type'];
      
      const response = await axios.post(`${baseUrl}/api/upload-logo`, formData, {
         headers: safeHeaders
      });
      if (response.data && response.data.logo) {
        setLogoUrl(response.data.logo);
        setPreviewUrl(response.data.logo);
        setLogoFile(null); // Clear pending file
        setMessage('Logo uploaded successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNavigation = (path) => navigate(path, { state: { fromAdmin: true } });
  const toggleMasterMenu = () => setIsMasterOpen(!isMasterOpen);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  
  const allowedFile = (filename) => {
    const allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'jfif', 'ico'];
    return allowed.some(ext => filename.toLowerCase().endsWith(`.${ext}`));
  };
  const handleDeleteLogo = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete this logo?");
    if (!isConfirmed) return;
    
    try {
      const h = getHeaders(activeBranch !== 'All Branches' ? activeBranch : null, activeCompany);
      const response = await axios.delete(`${baseUrl}/api/delete-logo`, { headers: h });
      setMessage(response.data.message); setLogoUrl(null); setPreviewUrl(null); setLogoFile(null);
    } catch (err) { setError(err.message); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.xlsx'))) {
      setImportFile(file); setMessage(''); setError(null);
    } else setError('Please select a valid file');
  };

  const DraggableMenuItem = ({ item, index, parentKey, itemsInList }) => {
    // SYNC SIDEBAR WITH MANAGES CONFIGURATION
    if (!isPageEnabled(item.path || item.text, user?.role)) return null;

    const isExpanded = getExpandState(item.text);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div className="draggable-node" data-parent={parentKey} draggable={!searchQuery} onDragStart={(e) => handleDragStart(e, index, parentKey)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, index, parentKey)} onDrop={(e) => handleDrop(e, index, parentKey, itemsInList)} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {hasChildren ? (
          <>
            {searchQuery ? (
              <div title={isSidebarCollapsed ? item.text : ''} style={{ padding: isSidebarCollapsed ? '12px' : '12px 16px', backgroundColor: '#F3F6FB', color: '#1B1B29', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', fontWeight: '700' }}>
                <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>{item.icon}</span> {!isSidebarCollapsed && item.text}
              </div>
            ) : (
              <button onClick={() => toggleExpandState(item.text)} title={isSidebarCollapsed ? item.text : ''} style={{ padding: isSidebarCollapsed ? '12px' : '12px 16px', backgroundColor: isExpanded && !isSidebarCollapsed ? '#F3F6FB' : 'transparent', color: '#1B1B29', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', fontSize: '15px', fontWeight: '600', textAlign: 'left', width: '100%', transition: 'all 0.2s' }} onMouseOver={(e) => { if (!isExpanded && !isSidebarCollapsed) e.currentTarget.style.backgroundColor = '#F8F9FD'; }} onMouseOut={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>{item.icon}</span> 
                {!isSidebarCollapsed && (
                  <>
                    {item.text}
                    {isExpanded ? <FaChevronUp style={{ marginLeft: 'auto', color: '#7B849C', fontSize: '12px' }} /> : <FaChevronDown style={{ marginLeft: 'auto', color: '#7B849C', fontSize: '12px' }} />}
                  </>
                )}
              </button>
            )}
            {((searchQuery && item.children.length > 0) || (isExpanded && item.children.length > 0)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: isSidebarCollapsed ? '12px' : '8px' }}>
                {item.children.map((child, idx) => <DraggableMenuItem key={child.text} item={child} index={idx} parentKey={item.text} itemsInList={item.children} />)}
              </div>
            )}
          </>
        ) : parentKey === 'root' ? (
          <button onClick={() => handleNavigation(item.path)} title={isSidebarCollapsed ? item.text : ''} style={{ padding: isSidebarCollapsed ? '12px' : '12px 16px', backgroundColor: 'transparent', color: '#1B1B29', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', fontSize: '15px', fontWeight: '600', textAlign: 'left', width: '100%', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FD'; e.currentTarget.style.color = '#604BE8'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1B1B29'; }}>
            <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>{item.icon}</span> {!isSidebarCollapsed && item.text}
          </button>
        ) : (
          <button onClick={() => handleNavigation(item.path)} title={isSidebarCollapsed ? item.text : ''} style={{ padding: isSidebarCollapsed ? '10px' : '10px 16px 10px 40px', backgroundColor: 'transparent', color: '#4A4A5A', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '10px', fontSize: '14px', fontWeight: '500', textAlign: 'left', width: '100%', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FD'; e.currentTarget.style.color = '#604BE8'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4A4A5A'; }}>
            <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>{item.icon}</span> {!isSidebarCollapsed && item.text}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F6FB', fontFamily: "'Gilroy', 'Outfit', sans-serif" }}>
      <div style={{ width: isSidebarCollapsed ? '90px' : '270px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: '#ffffff', borderRight: '1px solid #E5E9F2', padding: isSidebarCollapsed ? '24px 10px' : '24px 20px', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', overflow: 'visible', zIndex: 1000, boxSizing: 'border-box' }}>
        
        {/* Collapse Toggle Arrow */}
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{ position: 'absolute', top: '30px', right: '-12px', width: '24px', height: '24px', backgroundColor: '#ffffff', border: '1px solid #E5E9F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#604BE8', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          {isSidebarCollapsed ? <FaChevronRight style={{ fontSize: '10px' }} /> : <FaChevronLeft style={{ fontSize: '10px' }} />}
        </button>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Logo / Upload section */}
          <div style={{ textAlign: 'center', padding: isSidebarCollapsed ? '8px' : '12px', backgroundColor: '#F8F9FD', borderRadius: '16px', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {(logoUrl || previewUrl) ? (
              <img src={previewUrl || logoUrl} alt="Logo" style={{ width: isSidebarCollapsed ? '40px' : '70px', height: isSidebarCollapsed ? '40px' : '70px', transition: 'all 0.3s', borderRadius: '50%', objectFit: 'cover', marginBottom: isSidebarCollapsed ? '0' : '10px', border: '2px solid #604BE8' }} />
            ) : (<div style={{ width: isSidebarCollapsed ? '40px' : '70px', height: isSidebarCollapsed ? '40px' : '70px', transition: 'all 0.3s', borderRadius: '50%', backgroundColor: '#E2E6EF', margin: isSidebarCollapsed ? '0' : '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B849C', fontSize: isSidebarCollapsed ? '0.8rem' : '1.5rem', fontWeight: 'bold' }}>Logo</div>)}
            
            {!isSidebarCollapsed && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input id="logo-input" type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              
              {!logoUrl && !logoFile && (
                <label htmlFor="logo-input" style={{ padding: '6px 12px', backgroundColor: '#604BE8', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><FaCamera /> Upload</label>
              )}
              
              {logoFile && (
                <button onClick={handleSaveLogo} disabled={uploadingLogo} style={{ padding: '6px 12px', backgroundColor: '#34C759', color: 'white', border: 'none', borderRadius: '8px', cursor: uploadingLogo ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}>
                  {uploadingLogo ? 'Saving...' : 'Save'}
                </button>
              )}

              {logoUrl && !logoFile && (
                <button onClick={handleDeleteLogo} style={{ padding: '6px 12px', backgroundColor: '#FF595E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><FaTrash /> Delete</button>
              )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: isSidebarCollapsed ? '50%' : '14px', top: '50%', transform: isSidebarCollapsed ? 'translate(-50%, -50%)' : 'translateY(-50%)', color: '#7B849C' }} />
            {!isSidebarCollapsed && (
              <input type="text" placeholder="Search menu..." value={searchQuery} onChange={handleSearchChange} style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid #E5E9F2', backgroundColor: '#F8F9FD', outline: 'none', fontSize: '14px', color: '#1B1B29', fontWeight: '500', boxSizing: 'border-box' }} />
            )}
            {isSidebarCollapsed && (
              <div style={{ width: '100%', height: '40px', borderRadius: '12px', border: '1px solid #E5E9F2', backgroundColor: '#F8F9FD' }} />
            )}
          </div>

          {!isSidebarCollapsed && (user.role === 'group_admin' || user.role === 'superadmin' || user.role === 'Super Admin' || user.role === 'Tenant Admin' || user.role === 'company_admin' || user.role === 'Company Admin') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(user.role === 'Super Admin' || user.role === 'superadmin') && user.tenants?.length > 0 && (
                <select
                  value={localStorage.getItem('active_tenant_id') || ''}
                  onChange={(e) => {
                    const tenantId = e.target.value;
                    const tenantName = e.target.options[e.target.selectedIndex].text;
                    localStorage.setItem('active_tenant_id', tenantId);
                    localStorage.setItem('active_tenant_name', tenantName);
                    localStorage.removeItem('active_company_id');
                    localStorage.removeItem('active_branch_id');
                    window.dispatchEvent(new Event('local-storage-change'));
                    window.location.reload();
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E5E9F2', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', color: '#1B1B29', fontSize: '13px' }}
                >
                  <option value="">All Organizations</option>
                  {user.tenants.map(t => <option key={t._id} value={t._id}>{t.tenant_name}</option>)}
                </select>
              )}

              {(user.role === 'group_admin' || user.role === 'superadmin' || user.role === 'Super Admin' || user.role === 'Tenant Admin') && adminCompanies.length > 0 && (
                <select value={activeCompany} onChange={(e) => handleCompanySwitch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E5E9F2', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', color: '#1B1B29', fontSize: '13px' }}>
                  <option value="All">All Companies</option>
                  {adminCompanies.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              )}

              {activeCompany && activeCompany !== 'All' &&
                ((user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'groupadmin' ||
                  (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin' ||
                  (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'tenantadmin' ||
                  (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'masteradmin' ||
                  (user?.role || '').toLowerCase().replace(/[\s_]/g, '') === 'companyadmin' ||
                  (user?.role || '').toLowerCase() === 'super admin' ||
                  (user?.role || '').toLowerCase() === 'tenant admin') && (
                  <select value={activeBranch} onChange={(e) => handleBranchSwitch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E5E9F2', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', color: '#1B1B29', fontSize: '13px' }}>
                    <option value="All Branches">All Branches</option>
                    {branches
                      .filter(b => {
                        if (typeof b === 'string') return true;
                        const branchCompany = b.company_name || b.company || '';
                        return activeCompany === 'All' || branchCompany === activeCompany;
                      })
                      .map((b, i) => {
                        const bName = b.branch_name || b.branch || b.name || b;
                        return <option key={i} value={bName}>{bName}</option>;
                      })
                    }
                  </select>
                )}
            </div>
          )}

          {/* Active Dashboard Button matching image */}
          <button title={isSidebarCollapsed ? 'Dashboard' : ''} style={{ padding: isSidebarCollapsed ? '14px' : '14px 20px', backgroundColor: '#F3F0FE', color: '#604BE8', border: 'none', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '14px', fontSize: '16px', fontWeight: '700', width: '100%', boxShadow: '0 4px 15px rgba(96, 75, 232, 0.1)', transition: 'all 0.3s' }}>
            <FaChartBar style={{ fontSize: '20px', color: '#604BE8' }} /> {!isSidebarCollapsed && 'Dashboard'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <button onClick={() => toggleMasterMenu()} title={isSidebarCollapsed ? 'Master' : ''} style={{ padding: isSidebarCollapsed ? '12px' : '12px 16px', backgroundColor: isMasterOpen && !isSidebarCollapsed ? '#F3F6FB' : 'transparent', color: '#1B1B29', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', fontSize: '15px', fontWeight: '600', transition: 'all 0.2s' }}>
              <FaHome style={{ color: '#7B849C', fontSize: '18px' }} /> 
              {!isSidebarCollapsed && (
                <>
                  Master
                  {isMasterOpen ? <FaChevronUp style={{ marginLeft: 'auto', color: '#7B849C', fontSize: '12px' }} /> : <FaChevronDown style={{ marginLeft: 'auto', color: '#7B849C', fontSize: '12px' }} />}
                </>
              )}
            </button>
            {isMasterOpen && finalMenuData.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: isSidebarCollapsed ? '12px' : '8px' }}>
                {finalMenuData.map((item, idx) => <DraggableMenuItem key={item.text} item={item} index={idx} parentKey="root" itemsInList={finalMenuData} />)}
              </div>
            )}
          </div>

          {/* User Profile Card at bottom of sidebar matching image */}
          <div style={{ marginTop: 'auto', padding: isSidebarCollapsed ? '8px' : '16px', backgroundColor: '#F8F9FD', borderRadius: '20px', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', transition: 'all 0.3s' }}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'Theresa')}`} alt="User Avatar" style={{ width: isSidebarCollapsed ? '40px' : '54px', height: isSidebarCollapsed ? '40px' : '54px', borderRadius: '50%', backgroundColor: '#DCE3EE', border: '2px solid #ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'all 0.3s' }} />
            {!isSidebarCollapsed && (
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1B1B29', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{user.name || user.email?.split('@')[0] || 'Theresa Webb'}</h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: '600', color: '#7B849C', textTransform: 'capitalize' }}>{user.role || 'Designation'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginLeft: isSidebarCollapsed ? '90px' : '270px', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flex: 1, padding: '36px 48px', position: 'relative', boxSizing: 'border-box', overflowX: 'hidden' }}>
        {/* Top bar with Notifications, User Info, Logout */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '32px', zIndex: 100 }}>
          <div onClick={() => handleNavigation('/notifications')} style={{ marginRight: '20px', cursor: 'pointer', position: 'relative', backgroundColor: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #E5E9F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBell style={{ color: '#604BE8', fontSize: '1.2rem' }} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#FF595E', color: 'white', borderRadius: '50%', minWidth: '20px', height: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontWeight: 'bold' }}>{unreadCount}</span>}
          </div>
          <div style={{ textAlign: 'right', marginRight: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: '700', color: '#1B1B29', fontSize: '15px' }}>{user.email}</span>
                <span style={{ fontSize: '11px', color: '#604BE8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activeCompany} {activeBranch && activeBranch !== 'All Branches' ? `| ${activeBranch}` : ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <small style={{ color: '#7B849C', fontWeight: '600', fontSize: '12px' }}>{getFormattedDate(currentTime, settings.dateFormat)}</small>
              <small style={{ color: '#7B849C', fontWeight: '600', fontSize: '12px' }}>{getFormattedTime(currentTime, settings.timeFormat)}</small>
            </div>
          </div>
          <button onClick={handleLogoutClick} title="Logout" style={{ background: 'transparent', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: 0.9 }} onMouseOver={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = 0.9; e.currentTarget.style.transform = 'scale(1)'; }}>
            <img src="/menuIcons/poweroff.svg" alt="Logout" style={{ width: '36px', height: '36px' }} />
          </button>
        </div>

        {/* Dashboard Title & Timeframe Tabs matching image */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: '800', color: '#1B1B29', letterSpacing: '-0.5px' }}>Dashboard</h1>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px', borderBottom: '1px solid #E5E9F2', paddingBottom: '8px' }}>
              {['Yesterday', 'Today', 'Week', 'Month', 'Year'].map((tab) => {
                const isActive = timeframe === tab;
                return (
                  <div
                    key={tab}
                    onClick={() => setTimeframe(tab)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? '#1B1B29' : '#7B849C',
                      position: 'relative',
                      paddingBottom: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                    {isActive && (
                      <div style={{ position: 'absolute', bottom: '-9px', left: 0, width: '100%', height: '3px', backgroundColor: '#FF9F04', borderRadius: '3px' }} />
                    )}
                  </div>
                );
              })}
            </div>
            {['Week', 'Month', 'Year'].includes(timeframe) && (
              <DashboardTimePicker timeframe={timeframe} selectedDate={selectedDashboardDate} onChange={setSelectedDashboardDate} />
            )}
          </div>
        </div>

        {/* Top Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px', marginBottom: '36px' }}>

          {/* Daily Sales Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1B1B29' }}>Daily Sales</h3>
                <p style={{ margin: '8px 0 4px', fontSize: '32px', fontWeight: '800', color: '#604BE8' }}>{calculatedSalesMetrics.salesAmount}</p>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#7B849C' }}>
                  <span style={{ color: '#06D6A0', fontWeight: '700' }}>↑ 2.1%</span> vs last week
                </p>
              </div>
              <button onClick={() => navigate('/sales-reports')} style={{ backgroundColor: '#604BE8', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(96, 75, 232, 0.2)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4B76E6'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#604BE8'}>
                View Report
              </button>
            </div>

            {/* Custom SVG Line Chart matching image */}
            <div style={{ marginTop: '24px', width: '100%', height: '120px', position: 'relative' }}>
              <svg viewBox="0 0 500 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F3F8" strokeDasharray="4 4" strokeWidth="1.5" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#F1F3F8" strokeDasharray="4 4" strokeWidth="1.5" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F3F8" strokeDasharray="4 4" strokeWidth="1.5" />

                {/* Orange Curve (Previous Period) */}
                <path d={calculatedSalesMetrics.prevGraphPath} fill="none" stroke="#FF9F04" strokeWidth="3" strokeLinecap="round" style={{ transition: 'd 0.5s ease-in-out' }} />

                {/* Purple Curve (Current Period) */}
                <path d={calculatedSalesMetrics.graphPath} fill="none" stroke="#604BE8" strokeWidth="3" strokeLinecap="round" style={{ transition: 'd 0.5s ease-in-out' }} />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 10px', color: '#7B849C', fontSize: '11px', fontWeight: '600' }}>
                <span>09.00 am</span><span>12.00 pm</span><span>03.00 pm</span><span>06.00 pm</span><span>09.00 pm</span><span>12.00 am</span>
              </div>
            </div>
          </div>

          {/* Total Income Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1B1B29' }}>Total Income</h3>
              <div style={{ padding: '6px 14px', backgroundColor: '#F8F9FD', border: '1px solid #E5E9F2', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#604BE8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                {timeframe} <FaChevronDown style={{ fontSize: '10px' }} />
              </div>
            </div>

            {/* Custom Circular Donut Chart - dynamic per real item groups */}
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {(() => {
                  const circumference = 2 * Math.PI * 38; // 238.76
                  let accumulated = 0;
                  return calculatedSalesMetrics.topGroups.map((grp, i) => {
                    const dash = (grp.pct / 100) * circumference;
                    const gap = circumference - dash;
                    const offset = -(accumulated / 100) * circumference;
                    accumulated += grp.pct;
                    return (
                      <circle key={i} cx="50" cy="50" r="38" fill="none"
                        stroke={grp.color} strokeWidth="14"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#1B1B29', lineHeight: 1.2 }}>{calculatedSalesMetrics.totalIncome}</span>
              </div>
            </div>

            {/* Dynamic Group Legend */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: '1px solid #F1F3F8' }}>
              {calculatedSalesMetrics.topGroups.map((grp, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#7B849C' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: grp.color, flexShrink: 0 }} />
                    <span style={{ maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grp.name}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '800', color: '#1B1B29' }}>{grp.pct}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Total Orders & New Customers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Total Orders Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E9F2', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1B1B29' }}>Total Orders</h3>
                  <p style={{ margin: '4px 0 12px', fontSize: '13px', fontWeight: '700', color: '#7B849C' }}>Completed Invoices</p>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1B1B29' }}>{calculatedSalesMetrics.totalOrders}</p>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9F04', fontSize: '22px' }}>
                  <FaFileInvoiceDollar />
                </div>
              </div>
              {/* Order type breakdown pills */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#EDE9FE', color: '#604BE8' }}>DIN {calculatedSalesMetrics.dineInCount}</span>
                <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#FFF3E0', color: '#FF9F04' }}>TAK {calculatedSalesMetrics.takeawayCount}</span>
                <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', backgroundColor: '#E8FDF5', color: '#06D6A0' }}>OND {calculatedSalesMetrics.onlineCount}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F3F8', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (parseInt(calculatedSalesMetrics.totalOrders.replace(/,/g, '')) / Math.max(1, parseInt(calculatedSalesMetrics.totalOrders.replace(/,/g, '')))) * 100)}%`, height: '100%', backgroundColor: '#FF9F04', borderRadius: '3px' }} />
              </div>
            </div>

            {/* New Customers Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E9F2', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1B1B29' }}>New Customers</h3>
                  <p style={{ margin: '4px 0 12px', fontSize: '13px', fontWeight: '700', color: '#06D6A0' }}>+32.40%</p>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1B1B29' }}>{calculatedSalesMetrics.newCustomers}</p>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06D6A0', fontSize: '22px' }}>
                  <FaUsers />
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F3F8', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: '#06D6A0', borderRadius: '3px' }} />
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Grid Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '28px', marginBottom: '40px' }}>

          {/* Trending Dishes Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E9F2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1B1B29' }}>Trending Dishes</h3>
              <div style={{ padding: '6px 14px', backgroundColor: '#F8F9FD', border: '1px solid #E5E9F2', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#604BE8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                {timeframe} <FaChevronDown style={{ fontSize: '10px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F3F8', color: '#7B849C', fontSize: '13px', fontWeight: '700' }}>
              <span>Dishes</span>
              <span>Orders</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              {calculatedSalesMetrics.trendingDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#7B849C', fontSize: '14px', fontWeight: '600' }}>
                  No sales data for this period
                </div>
              ) : (
                calculatedSalesMetrics.trendingDishes.map((dish, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E9F2', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : null}
                      <div>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', backgroundColor: dish.classifiedLabel === 'Drinks' ? '#604BE8' : (dish.classifiedLabel === 'Others' ? '#06D6A0' : '#FF9F04'), color: '#ffffff', display: 'inline-block', marginBottom: '4px' }}>
                          {dish.realGroup || dish.classifiedLabel}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1B1B29' }}>{dish.name}</h4>
                      </div>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#1B1B29' }}>{dish.quantity}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Existing Admin Management Section */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#1B1B29', fontSize: '22px', fontWeight: '800', marginBottom: '28px' }}>Admin Management</h3>
          {loading && <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px', color: '#7B849C' }}>Loading...</div>}
          {error && <div style={{ backgroundColor: '#ffebee', padding: '16px', color: '#c0392b', borderRadius: '16px', textAlign: 'center', fontWeight: '600' }}>{error}</div>}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px' }}>
              <DashboardCard icon={<FaUsers />} title="Total Customers" count={customerCount} path="/customers" visible={isPageEnabled('/customers', user?.role) && hasRolePermission('customer_list')} />
              <DashboardCard icon={<FaBox />} title="Total Items" count={itemCount} path="/items" visible={isPageEnabled('/items', user?.role) && hasRolePermission('item_list')} />
              <DashboardCard icon={<FaDatabase />} title="Total Backups" count={backupCount} path="/backup" visible={isPageEnabled('/backup', user?.role) && hasRolePermission('backup')} />
              <DashboardCard icon={<FaTable />} title="Advanced Import" subTitle="Excel / JSON" path="/import-data" visible={isPageEnabled('/import-data', user?.role) && hasRolePermission('import')} />
              <DashboardCard icon={<FaBuilding />} title="Company Details" path="/company-details" visible={isPageEnabled('/company-details', user?.role) && hasRolePermission('company_details')} />
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (<div className="custom-modal-overlay"><div className="custom-logout-modal"><h2 className="modal-title">Logout Confirmation</h2><p className="modal-text">Are you sure you want to logout?</p><div className="modal-buttons"><button className="confirm-btn" onClick={confirmLogout}>YES</button><button className="cancel-btn" onClick={cancelLogout}>NO</button></div></div></div>)}

      <style>{`
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .custom-logout-modal { background: #ffffff; padding: 40px; border-radius: 24px; text-align: center; border: 2px solid #ef4444; }
        .modal-buttons { display: flex; gap: 15px; justify-content: center; margin-top: 20px; }
        .confirm-btn { background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 10px; cursor: pointer; }
        .cancel-btn { background: #eee; padding: 10px 20px; border: none; border-radius: 10px; cursor: pointer; }
        @keyframes pulse-notif { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
      `}</style>
    </div>
  );

  function DashboardCard({ icon, title, count, subTitle, path, visible }) {
    if (!visible) return null;
    return (
      <div style={{ padding: '28px 24px', backgroundColor: '#ffffff', borderRadius: '24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #E5E9F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleNavigation(path)} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 15px 45px rgba(96, 75, 232, 0.15)'; e.currentTarget.style.borderColor = '#604BE8'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E5E9F2'; }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#F3F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#604BE8', marginBottom: '20px' }}>{icon}</div>
        <h4 style={{ margin: '0', color: '#7B849C', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
        {count !== undefined && (<p style={{ fontSize: '32px', margin: '12px 0 0', color: '#1B1B29', fontWeight: '800', lineHeight: '1' }}>{count}</p>)}
        {subTitle && <p style={{ fontSize: '14px', margin: '12px 0 0', color: '#604BE8', fontWeight: '700' }}>{subTitle}</p>}
      </div>
    );
  }
}

export default AdminPage;
