import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, ChefHat, Trash2, Calendar, Users, Package, FileText, 
  BarChart3, Bell, Lock, MapPin, Car, UserCheck, ShieldCheck, 
  LayoutDashboard, Calculator, Zap, Globe, X, Info, ChevronDown, 
  ChevronRight, CreditCard, Wallet, Smartphone, Archive, CheckCircle,
  XCircle, Power, Settings, ShieldAlert, Layers, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import { useContext } from 'react';

const MODULES_CONFIG = [
  {
    module: "💰 POS Billing",
    id: "pos_billing",
    color: "#3b82f6",
    pages: [
      { name: "Home Dashboard", route: "/home" },
      { name: "Opening Entry", route: "/opening-entry" },
      { name: "Closing Entry", route: "/closing-entry" },
      { name: "Bearer Page", route: "/bearer" },
      { name: "Cash Payment", route: "/cash" },
      { name: "Card Payment", route: "/card" },
      { name: "Saved Orders", route: "/savedorders" },
      { name: "POS Balance", route: "/pos-balance" },
      { name: "Combo Offer", route: "/combo-offer" }
    ]
  },
  {
    module: "👨‍🍳 Kitchen Display",
    id: "kitchen_display",
    color: "#f59e0b",
    pages: [
      { name: "Kitchen View", route: "/kitchen" },
      { name: "Add Kitchen", route: "/add-kitchen" }
    ]
  },
  {
    module: "🍽️ Table Management",
    id: "table_management",
    color: "#10b981",
    pages: [
      { name: "Table View", route: "/table" },
      { name: "Booking", route: "/booking" },
      { name: "Front Page", route: "/frontpage" },
      { name: "Add Table", route: "/add-table" }
    ]
  },
  {
    module: "👤 Customer Module",
    id: "customer_module",
    color: "#06b6d4",
    pages: [
      { name: "Customer List", route: "/customers" },
      { name: "Create Customer", route: "/create-customer" },
      { name: "Customer Group", route: "/create-customer-group" }
    ]
  },
  {
    module: "📦 Inventory",
    id: "inventory",
    color: "#8b5cf6",
    pages: [
      { name: "Items List", route: "/items" },
      { name: "Create Item", route: "/create-item" },
      { name: "Hidden Items", route: "/hidden-items" },
      { name: "Add Item Group", route: "/add-item-group" },
      { name: "Create Variant", route: "/create-variant" },
      { name: "Add Ingredients & Nutrition", route: "/add-ingredients-nutrition" },
      { name: "Combo Offer", route: "/combo-offer" }
    ]
  },
  {
    module: "🛒 Purchase",
    id: "purchase",
    color: "#f59e0b",
    pages: [
      { name: "Suppliers", route: "/purchase?tab=supplier" },
      { name: "Items", route: "/purchase?tab=item" },
      { name: "Supplier Group List", route: "/purchase?tab=supplier_group_list" },
      { name: "PurchaseOrder", route: "/purchase?tab=order" },
      { name: "PurchaseReceipt", route: "/purchase?tab=receipt" },
      { name: "PurchaseInvoice", route: "/purchase?tab=invoice" },
      { name: "Reports", route: "/purchase?tab=report" }
    ]
  },
  {
    module: "👨‍💼 HR & Payroll",
    id: "hr_payroll",
    color: "#ec4899",
    pages: [
      { name: "Add Employee", route: "/add-employee" },
      { name: "Employee List", route: "/employee-list" },
      { name: "Delivery Persons", route: "/employees" },
      { name: "Employee Details", route: "/employee-details/:id" },
      { name: "Employee Designations", route: "/employee-designations" },
      { name: "Employee Types", route: "/employee-types" },
      { name: "Employee Departments", route: "/employee-departments" },
      { name: "Attendance", route: "/attendance" },
      { name: "Attendance View", route: "/attendance-view" },
      { name: "Salary Slip", route: "/salary-slip" },
      { name: "Salary Receipt List", route: "/salary-receipt-list" },
      { name: "Leave Type", route: "/leave-type" },
      { name: "Leave Allocation", route: "/leave-allocation" },
      { name: "Leave Apply", route: "/leave-apply" },
      { name: "Schedule Master", route: "/schedule-master" },
      { name: "Schedule Assign Employee", route: "/schedule-assign-employee" },
      { name: "Roaster", route: "/roaster" },
      { name: "Users", route: "/users" },
      { name: "Holiday List", route: "/holiday-doctype" },
      { name: "Extended DocType", route: "/extended-doctype" }
    ]
  },
  {
    module: "🚗 Vehicle Module",
    id: "vehicle_module",
    color: "#475569",
    pages: [
      { name: "Vehicle Management", route: "/vehicle-management" }
    ]
  },
  {
    module: "🌍 Address Module",
    id: "address_module",
    color: "#14b8a6",
    pages: [
      { name: "Address Structure", route: "/address-structure" }
    ]
  },
  {
    module: "📊 Reports",
    id: "reports",
    color: "#6366f1",
    pages: [
      { name: "Sales Invoice", route: "/salespage" },
      { name: "Sales Report", route: "/sales-reports" },
      { name: "Sales Kanban", route: "/sales-kanban" },
      { name: "Trip Report", route: "/trip-report" }
    ]
  },
  {
    module: "⚙️ Settings",
    id: "settings",
    color: "#64748b",
    pages: [
      { name: "System Settings", route: "/system-settings" },
      { name: "Email Settings", route: "/email-settings" },
      { name: "Print Settings", route: "/print-settings" },
      { name: "Backups", route: "/backup" },
      { name: "Advanced Import", route: "/import-data" },
      { name: "Working Days", route: "/working" },
      { name: "DocType Management", route: "/doctype" },
      { name: "Tax Master", route: "/tax-master" }
    ]
  },
  {
    module: "🏢 Multi-Branch Support",
    id: "multi_branch",
    color: "#0f172a",
    pages: [
      { name: "Manage Tenants", route: "/manage-tenants" },
      { name: "Manage Companies", route: "/manage-companies" },
      { name: "Manage Branches", route: "/manage-branches" },
      { name: "Company Details", route: "/company-details" }
    ]
  },
  {
    module: "🔐 Authentication",
    id: "auth",
    color: "#0284c7",
    pages: [
      { name: "Login", route: "/" },
      { name: "Register", route: "/register" }
    ]
  },
  {
    module: "🔑 Role Management",
    id: "roles",
    color: "#7c3aed",
    pages: [
      { name: "Role Permissions", route: "/role-permissions" }
    ]
  },
  {
    module: "🔔 Notifications & Voice",
    id: "notifications",
    color: "#f43f5e",
    pages: [
      { name: "Notifications", route: "/notifications" },
      { name: "Voice Support", route: "/voice" }
    ]
  },
  {
    module: "📦 Order Tracking",
    id: "tracking",
    color: "#0ea5e9",
    pages: [
      { name: "Active Orders", route: "/active-orders" }
    ]
  },
  {
    module: "📊 Admin Dashboard",
    id: "admin_dashboard",
    color: "#4f46e5",
    pages: [
      { name: "Dashboard", route: "/dashboard" },
      { name: "Admin Panel", route: "/admin" },
      { name: "Main Page", route: "/main" }
    ]
  }
];

function Manages() {
  const navigate = useNavigate();
  const { companyName, branchName } = useParams();
  const [disabledPages, setDisabledPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [workflowSettings, setWorkflowSettings] = useState({});
  const { baseUrl } = useContext(UserContext);

  useEffect(() => {
    fetchVisibility();
    fetchWorkflowSettings();
  }, [companyName, branchName]);

  const fetchVisibility = async () => {
    setIsLoading(true);
    try {
      const userObj = JSON.parse(localStorage.getItem('user')) || {};
      const params = { company: companyName || userObj.company };
      if (branchName && branchName !== 'All Branches') params.branch = branchName;
      const response = await axios.get(`${baseUrl}/api/module-visibility`, { params });
      setDisabledPages(response.data.disabled_pages || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchWorkflowSettings = async () => {
    try {
      const userObj = JSON.parse(localStorage.getItem('user')) || {};
      const params = { company: companyName || userObj.company };
      if (branchName && branchName !== 'All Branches') params.branch = branchName;
      
      console.log(`[Manages Sync] Fetching configuration for ${params.company} / ${params.branch}`);
      const response = await axios.get(`${baseUrl}/api/workflow-visibility`, { params });
      console.log("[Manages Sync] Fetched settings:", response.data.settings);
      setWorkflowSettings(response.data.settings || {});
    } catch (err) { console.error("[Manages Sync] Fetch Error:", err); }
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const updateWorkflowSettingFor = (workflow, path, value) => {
    setWorkflowSettings(prev => {
      const newSettings = { ...prev };
      if (!newSettings[workflow]) newSettings[workflow] = { enabled: true };
      
      let current = newSettings[workflow];
      const keys = path.split('.');
      
      if (path === 'enabled') {
        newSettings[workflow].enabled = value;
      } else {
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        
        // Auto-enable top level if sub-item is clicked and was false
        if (value === true) {
            newSettings[workflow].enabled = true;
        }
      }
      
      // Sync logic for Workflow Feature Management
      if (value === true) {
        if (!newSettings.global_modules) newSettings.global_modules = {};
        
        // Every core experience requires POS Billing to be enabled
        if (['Takeaway', 'Dine In', 'Online Delivery'].includes(workflow)) {
           if (!newSettings.global_modules.pos_billing) newSettings.global_modules.pos_billing = {};
           newSettings.global_modules.pos_billing.enabled = true;
           if (!newSettings.global_modules.pos_billing.pages) newSettings.global_modules.pos_billing.pages = {};
           newSettings.global_modules.pos_billing.pages.HomeDashboard = true;
           newSettings.global_modules.pos_billing.pages.OpeningEntry = true; 
           newSettings.global_modules.pos_billing.pages.ClosingEntry = true;
           newSettings.global_modules.pos_billing.pages.BearerPage = true;

           // Automatically enable basic internal flows for this experience
           if (!newSettings[workflow].save) newSettings[workflow].save = {};
           newSettings[workflow].save.kitchen = true;
           newSettings[workflow].save.activeorders = true;
        }

        if (path.startsWith('pay.')) {
           if (!newSettings.global_modules.pos_billing) newSettings.global_modules.pos_billing = {};
           newSettings.global_modules.pos_billing.enabled = true;
           if (!newSettings.global_modules.pos_billing.pages) newSettings.global_modules.pos_billing.pages = {};
           
           if (path.includes('cash')) newSettings.global_modules.pos_billing.pages.CashPayment = true;
           if (path.includes('card')) newSettings.global_modules.pos_billing.pages.CardPayment = true;
        }

        if (path === 'save.kitchen') {
          if (!newSettings.global_modules.kitchen_display) newSettings.global_modules.kitchen_display = {};
          newSettings.global_modules.kitchen_display.enabled = true;
          if (!newSettings.global_modules.kitchen_display.pages) newSettings.global_modules.kitchen_display.pages = {};
          newSettings.global_modules.kitchen_display.pages.KitchenView = true;
          newSettings.global_modules.kitchen_display.pages.AddKitchen = true;
        }
        
        if (path === 'save.activeorders') {
          if (!newSettings.global_modules.tracking) newSettings.global_modules.tracking = {};
          newSettings.global_modules.tracking.enabled = true;
          if (!newSettings.global_modules.tracking.pages) newSettings.global_modules.tracking.pages = {};
          newSettings.global_modules.tracking.pages.ActiveOrders = true;
        }
      }

      return newSettings;
    });
  };

  const handleSelectAll = () => {
    setWorkflowSettings(prev => {
      const newSettings = { ...prev };
      
      // 1. Enable Workflow Experiences (Takeaway, Dine In, Online Delivery)
      ['Takeaway', 'Dine In', 'Online Delivery'].forEach(wf => {
        newSettings[wf] = {
          enabled: true,
          pay: { cash: true, card: true, upi: true },
          save: { kitchen: true, activeorders: true }
        };
      });

      // 2. Enable Global Modules and their pages
      if (!newSettings.global_modules) newSettings.global_modules = {};
      MODULES_CONFIG.forEach(mod => {
        newSettings.global_modules[mod.id] = {
          enabled: true,
          pages: mod.pages.reduce((acc, p) => {
            acc[p.name.replace(/\s+/g, '')] = true;
            return acc;
          }, {})
        };
      });

      return newSettings;
    });
  };

  const handleUnselectAll = () => {
    setWorkflowSettings(prev => {
      const newSettings = { ...prev };
      
      // 1. Disable Workflow Experiences
      ['Takeaway', 'Dine In', 'Online Delivery'].forEach(wf => {
        newSettings[wf] = {
          enabled: false,
          pay: { cash: false, card: false, upi: false },
          save: { kitchen: false, activeorders: false }
        };
      });

      // 2. Disable Global Modules and their pages
      if (!newSettings.global_modules) newSettings.global_modules = {};
      MODULES_CONFIG.forEach(mod => {
        newSettings.global_modules[mod.id] = {
          enabled: false,
          pages: mod.pages.reduce((acc, p) => {
            acc[p.name.replace(/\s+/g, '')] = false;
            return acc;
          }, {})
        };
      });

      return newSettings;
    });
  };

  const updateGlobalModule = (path, value) => {
    setWorkflowSettings(prev => {
      const newSettings = { ...prev };
      if (!newSettings.global_modules) newSettings.global_modules = {};
      let current = newSettings.global_modules;
      const keys = path.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const getWorkflowSettingFor = (workflow, path) => {
    try {
      const keys = path.split('.');
      let current = workflowSettings[workflow];
      
      // If no config for this workflow, default to true
      if (current === undefined) return true;
      
      if (path === 'enabled') return current.enabled !== false;

      for (const key of keys) {
        if (current === undefined || current[key] === undefined) return true;
        current = current[key];
      }
      return current !== false;
    } catch { return true; }
  };

  const getGlobalModuleSetting = (path) => {
    try {
      const keys = path.split('.');
      let current = workflowSettings.global_modules;

      // If the global_modules object is missing, default to true
      if (current === undefined) return true;

      for (const key of keys) {
        if (current === undefined || current[key] === undefined) return true;
        current = current[key];
      }
      return current !== false;
    } catch { return true; }
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      console.log(`[Manages Sync] Deploying configuration for ${companyName} / ${branchName}`);
      console.log("[Manages Sync] Payload Keys:", Object.keys(workflowSettings));
      await axios.post(`${baseUrl}/api/workflow-visibility`, {
        company_name: companyName,
        branch_name: branchName && branchName !== 'All Branches' ? branchName : null,
        settings: workflowSettings
      });
      console.log("[Manages Sync] Deployment Successful");
      setShowGroupModal(false);
      setMessage({ text: 'Workflow Configuration Applied!', type: 'success' });
      window.dispatchEvent(new Event('visibilityChange'));
    } catch (err) { 
      setMessage({ text: 'Failed to apply configuration.', type: 'error' }); 
    } finally { 
      setIsSaving(false); 
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const styles = {
    container: { padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" },
    glassCard: { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
    modalContent: { background: '#ffffff', borderRadius: '32px', width: '90%', maxWidth: '1400px', height: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    headerGradient: { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '30px 50px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tableHeader: { backgroundColor: '#f8fafc', color: '#64748b', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', padding: '16px 24px', textAlign: 'left', letterSpacing: '0.05em' },
    tableCell: { padding: '24px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
    checkbox: { width: '22px', height: '22px', cursor: 'pointer', accentColor: '#4f46e5', borderRadius: '6px', border: '2px solid #e2e8f0', transition: 'all 0.2s' },
    actionButton: { padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' },
    wfRow: { transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f8fafc' } },
    statusBadge: (active) => ({
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '800',
        backgroundColor: active ? '#dcfce7' : '#fee2e2',
        color: active ? '#166534' : '#991b1b',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    })
  };

  return (
    <div style={styles.container}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => navigate(-1)} style={{ ...styles.glassCard, padding: '12px', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={20} color="#4f46e5" />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>Workflow & Feature Management</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Aggressively control system visibility for {companyName}</p>
            </div>
         </div>
         <button onClick={() => setShowGroupModal(true)} style={{ ...styles.actionButton, backgroundColor: '#4f46e5', color: '#fff', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>
           <Settings size={20} /> Open Workflow Control
         </button>
       </div>

       {/* Quick Overview Section */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          <div style={{ ...styles.glassCard, padding: '30px' }}>
             <div style={{ backgroundColor: '#e0e7ff', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Layers size={24} color="#4f46e5" />
             </div>
             <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>Feature Scoping</h3>
             <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Precisely define which payment methods and internal flows are active for each ordering context.</p>
          </div>
          <div style={{ ...styles.glassCard, padding: '30px' }}>
             <div style={{ backgroundColor: '#ffedd5', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <ShieldAlert size={24} color="#f97316" />
             </div>
             <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>Global Suppression</h3>
             <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Force-hide entire modules or specific pages from sidebars and dashboards across the whole company.</p>
          </div>
          <div style={{ ...styles.glassCard, padding: '30px' }}>
             <div style={{ backgroundColor: '#dcfce7', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Zap size={24} color="#10b981" />
             </div>
             <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>Auto-Activation</h3>
             <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Enabling a feature automatically activates the necessary base modules for a seamless experience.</p>
          </div>
       </div>

      {showGroupModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.headerGradient}>
               <div>
                 <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>Aggressive Workflow Integration</h2>
                 <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '13px' }}>Disabled items will be completely removed from sidebars and dashboards.</p>
               </div>
               <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button 
                     onClick={handleSelectAll}
                     style={{ ...styles.actionButton, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px' }}
                  >
                     <CheckCircle size={16} /> Select All
                  </button>
                  <button 
                     onClick={handleUnselectAll}
                     style={{ ...styles.actionButton, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 16px' }}
                  >
                     <XCircle size={16} /> Unselect All
                  </button>
                  <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                  <X onClick={() => setShowGroupModal(false)} cursor="pointer" size={28} />
               </div>
            </div>

            <div style={{ flex: 1, padding: '50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
               {/* Workflow Transformation Table */}
               <section style={{ marginBottom: '60px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                     <Zap size={24} color="#4f46e5" />
                     <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>Workflow Feature Management</h3>
                  </div>

                  <div style={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead>
                         <tr>
                           <th style={{ ...styles.tableHeader, width: '30%' }}>CONTEXT / EXPERIENCE</th>
                           <th style={{ ...styles.tableHeader, width: '35%' }}>CHECKOUT CONTROL (PAY)</th>
                           <th style={{ ...styles.tableHeader, width: '35%' }}>INTERNAL FLOW (SAVE)</th>
                         </tr>
                       </thead>
                       <tbody>
                         {['Takeaway', 'Dine In', 'Online Delivery'].map(wf => {
                            const isRowEnabled = getWorkflowSettingFor(wf, 'enabled');
                            return (
                               <tr key={wf} style={{ ...styles.wfRow, opacity: isRowEnabled ? 1 : 0.6 }}>
                                 <td style={styles.tableCell}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                       <input 
                                         type="checkbox" 
                                         style={{ ...styles.checkbox, accentColor: '#10b981' }}
                                         checked={isRowEnabled}
                                         onChange={(e) => updateWorkflowSettingFor(wf, 'enabled', e.target.checked)}
                                       />
                                       <div>
                                          <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '16px' }}>{wf}</div>
                                          <div style={{ ...styles.statusBadge(isRowEnabled), marginTop: '8px', width: 'fit-content' }}>
                                             {isRowEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                                             {isRowEnabled ? 'VISIBLE' : 'HIDDEN'}
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td style={styles.tableCell}>
                                    <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                                       {['Cash', 'Card', 'UPI'].map(pay => (
                                         <label key={pay} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isRowEnabled ? 'pointer' : 'default', fontWeight: '700', color: '#475569', fontSize: '13px' }}>
                                            <input 
                                              type="checkbox" 
                                              disabled={!isRowEnabled}
                                              style={styles.checkbox}
                                              checked={getWorkflowSettingFor(wf, `pay.${pay.toLowerCase()}`)} 
                                              onChange={(e) => updateWorkflowSettingFor(wf, `pay.${pay.toLowerCase()}`, e.target.checked)} 
                                            />
                                            {pay}
                                         </label>
                                       ))}
                                    </div>
                                 </td>
                                 <td style={styles.tableCell}>
                                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                                       {['Kitchen', 'Active Orders'].map(save => (
                                          <label key={save} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isRowEnabled ? 'pointer' : 'default', fontWeight: '700', color: '#475569', fontSize: '13px' }}>
                                             <input 
                                               type="checkbox" 
                                               disabled={!isRowEnabled}
                                               style={styles.checkbox}
                                               checked={getWorkflowSettingFor(wf, `save.${save.replace(' ','').toLowerCase()}`)} 
                                               onChange={(e) => updateWorkflowSettingFor(wf, `save.${save.replace(' ','').toLowerCase()}`, e.target.checked)} 
                                             />
                                             {save}
                                          </label>
                                       ))}
                                    </div>
                                 </td>
                               </tr>
                            );
                         })}
                       </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: '#eef2ff', padding: '15px 20px', borderRadius: '12px', width: 'fit-content' }}>
                    <Info size={18} color="#4f46e5" />
                    <span style={{ fontSize: '13px', color: '#4338ca', fontWeight: '600' }}>Toggling the Master Switch (left checkbox) force-hides the experience from the Home Dashboard.</span>
                  </div>
               </section>

               {/* Global Route Suppression */}
               <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                     <ShieldAlert size={24} color="#f97316" />
                     <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e293b' }}>Global System Suppression</h3>
                  </div>
                  <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '35px' }}>Unchecked modules or pages below will be force-hidden across all menus, sidebars, and dashboards for {companyName}.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' }}>
                    {MODULES_CONFIG.map(mod => (
                      <div key={mod.id} style={{ borderRadius: '24px', border: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                         <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfcfc' }}>
                            <div onClick={() => toggleModuleExpansion(mod.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>
                               {expandedModules[mod.id] ? <ChevronDown size={20} color={mod.color} /> : <ChevronRight size={20} color={mod.color} />}
                               {mod.module}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <span style={{ fontSize: '11px', fontWeight: '700', color: getGlobalModuleSetting(`${mod.id}.enabled`) ? '#10b981' : '#ef4444' }}>
                                 {getGlobalModuleSetting(`${mod.id}.enabled`) ? 'ACTIVE' : 'HIDDEN'}
                               </span>
                               <input type="checkbox" checked={getGlobalModuleSetting(`${mod.id}.enabled`)} onChange={(e) => {
                                   const isChecked = e.target.checked;
                                   updateGlobalModule(`${mod.id}.enabled`, isChecked);
                                   mod.pages.forEach(p => {
                                       const pageKey = p.name.replace(/\s+/g, '');
                                       updateGlobalModule(`${mod.id}.pages.${pageKey}`, isChecked);
                                   });
                                }} style={styles.checkbox} />
                            </div>
                         </div>
                         {expandedModules[mod.id] && getGlobalModuleSetting(`${mod.id}.enabled`) && (
                           <div style={{ padding: '25px 30px', backgroundColor: '#f9fafb', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              {mod.pages.map(p => (
                                <label key={p.name} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={getGlobalModuleSetting(`${mod.id}.pages.${p.name.replace(/\s+/g, '')}`)} 
                                    onChange={(e) => updateGlobalModule(`${mod.id}.pages.${p.name.replace(/\s+/g, '')}`, e.target.checked)} 
                                    style={{ ...styles.checkbox, width: '16px', height: '16px' }}
                                  />
                                  {p.name}
                                </label>
                              ))}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
               </section>
            </div>

            <div style={{ padding: '30px 50px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '20px', backgroundColor: '#ffffff' }}>
               <button onClick={() => setShowGroupModal(false)} style={{ ...styles.actionButton, background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
               <button 
                 onClick={handleSaveWorkflow} 
                 disabled={isSaving}
                 style={{ ...styles.actionButton, backgroundColor: '#4f46e5', color: '#fff', padding: '12px 60px', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}
               >
                 {isSaving ? 'Applying Changes...' : 'Deploy Configuration'}
                 {!isSaving && <CheckCircle size={20} />}
               </button>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', padding: '20px 30px', borderRadius: '20px', backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '15px', animation: 'slideUp 0.3s ease-out' }}>
          {message.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
          <span style={{ fontSize: '16px' }}>{message.text}</span>
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          input[type="checkbox"]:checked {
            background-color: #4f46e5;
          }
        `}
      </style>
    </div>
  );
}

export default Manages;
