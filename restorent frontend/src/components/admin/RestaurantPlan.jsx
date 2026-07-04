import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaStar, FaCrown, FaArrowLeft, FaGripVertical, FaPlus, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RestaurantPlan = () => {
  const navigate = useNavigate();

  const basePlans = [
    {
      name: 'Basic Plan',
      basePrice: 0,
      desc: 'Ideal for single coffee shops or QSR counters. Includes Billing & Items.',
      icon: <FaCheckCircle style={{ color: '#3498db' }} />,
      bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
      border: '#bdc3c7',
      headerColor: '#34495e'
    },
    {
      name: 'Silver Plan',
      basePrice: 0,
      desc: 'Adds Purchase management, tables layout, and kitchen KOT. Best for full-service cafes.',
      icon: <FaStar style={{ color: '#f1c40f' }} />,
      bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      border: '#e67e22',
      featured: true,
      headerColor: '#d35400'
    },
    {
      name: 'Gold Plan',
      basePrice: 0,
      desc: 'Fully featured multi-tenant setup with Delivery integrations, unlimited branches.',
      icon: <FaCrown style={{ color: '#9b59b6' }} />,
      bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      border: '#9b59b6',
      headerColor: '#8e44ad'
    }
  ];

  // Master List with Nested Pages
  const initialModules = [
    {
      id: 'mod_workflows', name: 'Workflows & Experience', price: 0, isExpanded: false,
      pages: [
        { id: 'page_wf_takeaway', name: 'Takeaway', price: 0 },
        { id: 'page_wf_dinein', name: 'Dine In', price: 0 },
        { id: 'page_wf_online', name: 'Online Delivery', price: 0 }
      ]
    },
    {
      id: 'mod_pos_dashboard', name: 'POS Dashboard', price: 0, isExpanded: false,
      pages: [
        { id: 'page_posd_home', name: 'Home Dashboard', price: 0 },
        { id: 'page_posd_front', name: 'Front Page', price: 0 },
        { id: 'page_posd_bal', name: 'POS Balance', price: 0 }
      ]
    },
    {
      id: 'mod_pos_billing', name: 'POS Billing', price: 0, isExpanded: false,
      pages: [
        { id: 'page_posb_open', name: 'Opening Entry', price: 0 },
        { id: 'page_posb_close', name: 'Closing Entry', price: 0 },
        { id: 'page_posb_cash', name: 'Cash Payment', price: 0 },
        { id: 'page_posb_card', name: 'Card Payment', price: 0 },
        { id: 'page_posb_upi', name: 'UPI Payment', price: 0 }
      ]
    },
    {
      id: 'mod_table_mgmt', name: 'Table Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_tm_table', name: 'Table Page', price: 0 },
        { id: 'page_tm_add', name: 'Add Table', price: 0 },
        { id: 'page_tm_book', name: 'Table Booking', price: 0 }
      ]
    },
    {
      id: 'mod_kitchen_mgmt', name: 'Kitchen Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_km_kitchen', name: 'Kitchen Page', price: 0 },
        { id: 'page_km_add', name: 'Add Kitchen', price: 0 },
        { id: 'page_km_active', name: 'Active Orders', price: 0 }
      ]
    },
    {
      id: 'mod_customer_mgmt', name: 'Customer Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_cm_list', name: 'Customer List', price: 0 },
        { id: 'page_cm_create', name: 'Create Customer', price: 0 },
        { id: 'page_cm_group', name: 'Customer Group', price: 0 }
      ]
    },
    {
      id: 'mod_inventory_mgmt', name: 'Inventory Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_im_list', name: 'Items List', price: 0 },
        { id: 'page_im_create', name: 'Create Item', price: 0 },
        { id: 'page_im_hidden', name: 'Hidden Items', price: 0 },
        { id: 'page_im_grplist', name: 'Item Group List', price: 0 },
        { id: 'page_im_addgrp', name: 'Add Item Group', price: 0 },
        { id: 'page_im_variant', name: 'Create Variant', price: 0 },
        { id: 'page_im_ingred', name: 'Add Ingredients & Nutrition', price: 0 },
        { id: 'page_im_combo', name: 'Combo Offer', price: 0 }
      ]
    },
    {
      id: 'mod_purchase_mgmt', name: 'Purchase Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_pm_sup', name: 'Suppliers', price: 0 },
        { id: 'page_pm_grplist', name: 'Supplier Group List', price: 0 },
        { id: 'page_pm_items', name: 'Items List', price: 0 },
        { id: 'page_pm_order', name: 'Purchase Order', price: 0 },
        { id: 'page_pm_rect', name: 'Purchase Receipt', price: 0 },
        { id: 'page_pm_inv', name: 'Purchase Invoice', price: 0 },
        { id: 'page_pm_rep', name: 'Purchase Reports', price: 0 }
      ]
    },
    {
      id: 'mod_hr_payroll', name: 'HR & Payroll', price: 0, isExpanded: false,
      pages: [
        { id: 'page_hr_addemp', name: 'Add Employee', price: 0 },
        { id: 'page_hr_emplist', name: 'Employee List', price: 0 },
        { id: 'page_hr_delpersons', name: 'Delivery Persons', price: 0 },
        { id: 'page_hr_empdet', name: 'Employee Details', price: 0 },
        { id: 'page_hr_empdesig', name: 'Employee Designations', price: 0 },
        { id: 'page_hr_emptypes', name: 'Employee Types', price: 0 },
        { id: 'page_hr_empdepts', name: 'Employee Departments', price: 0 },
        { id: 'page_hr_att', name: 'Attendance', price: 0 },
        { id: 'page_hr_attview', name: 'Attendance View', price: 0 },
        { id: 'page_hr_salslip', name: 'Salary Slip', price: 0 },
        { id: 'page_hr_salrect', name: 'Salary Receipt List', price: 0 },
        { id: 'page_hr_lvtype', name: 'Leave Type', price: 0 },
        { id: 'page_hr_lvalloc', name: 'Leave Allocation', price: 0 },
        { id: 'page_hr_lvapply', name: 'Leave Apply', price: 0 },
        { id: 'page_hr_schmas', name: 'Schedule Master', price: 0 },
        { id: 'page_hr_schass', name: 'Schedule Assign Employee', price: 0 },
        { id: 'page_hr_roaster', name: 'Roaster', price: 0 },
        { id: 'page_hr_users', name: 'Users', price: 0 },
        { id: 'page_hr_hollist', name: 'Holiday List', price: 0 },
        { id: 'page_hr_extdoc', name: 'Extended DocType', price: 0 }
      ]
    },
    {
      id: 'mod_vehicle_mgmt', name: 'Vehicle Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_veh_mgmt', name: 'Vehicle Management', price: 0 }
      ]
    },
    {
      id: 'mod_address_mgmt', name: 'Address Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_add_struc', name: 'Address Structure', price: 0 }
      ]
    },
    {
      id: 'mod_reports', name: 'Reports', price: 0, isExpanded: false,
      pages: [
        { id: 'page_rep_inv', name: 'Sales Invoice', price: 0 },
        { id: 'page_rep_sal', name: 'Sales Report', price: 0 },
        { id: 'page_rep_kanban', name: 'Sales Kanban', price: 0 },
        { id: 'page_rep_trip', name: 'Trip Report', price: 0 }
      ]
    },
    {
      id: 'mod_settings', name: 'Settings', price: 0, isExpanded: false,
      pages: [
        { id: 'page_set_sys', name: 'System Settings', price: 0 },
        { id: 'page_set_email', name: 'Email Settings', price: 0 },
        { id: 'page_set_print', name: 'Print Settings', price: 0 },
        { id: 'page_set_bkp', name: 'Backups', price: 0 },
        { id: 'page_set_imp', name: 'Advanced Import', price: 0 },
        { id: 'page_set_work', name: 'Working Days', price: 0 },
        { id: 'page_set_doc', name: 'DocType Management', price: 0 },
        { id: 'page_set_tax', name: 'Tax Master', price: 0 }
      ]
    },
    {
      id: 'mod_multi_branch', name: 'Multi Branch Support', price: 0, isExpanded: false,
      pages: [
        { id: 'page_mb_tenants', name: 'Manage Tenants', price: 0 },
        { id: 'page_mb_comp', name: 'Manage Companies', price: 0 },
        { id: 'page_mb_branch', name: 'Manage Branches', price: 0 },
        { id: 'page_mb_compdet', name: 'Company Details', price: 0 }
      ]
    },
    {
      id: 'mod_auth', name: 'Authentication', price: 0, isExpanded: false,
      pages: [
        { id: 'page_auth_log', name: 'Login', price: 0 },
        { id: 'page_auth_reg', name: 'Register', price: 0 }
      ]
    },
    {
      id: 'mod_role_mgmt', name: 'Role Management', price: 0, isExpanded: false,
      pages: [
        { id: 'page_role_perm', name: 'Role Permissions', price: 0 }
      ]
    },
    {
      id: 'mod_notifications', name: 'Notifications & Voice', price: 0, isExpanded: false,
      pages: [
        { id: 'page_notif_main', name: 'Notifications', price: 0 },
        { id: 'page_notif_voice', name: 'Voice Support', price: 0 }
      ]
    },
    {
      id: 'mod_order_tracking', name: 'Order Tracking', price: 0, isExpanded: false,
      pages: [
        { id: 'page_trk_act', name: 'Active Orders', price: 0 }
      ]
    },
    {
      id: 'mod_admin_dashboard', name: 'Admin Dashboard', price: 0, isExpanded: false,
      pages: [
        { id: 'page_ad_dash', name: 'Dashboard', price: 0 },
        { id: 'page_ad_pan', name: 'Admin Panel', price: 0 },
        { id: 'page_ad_main', name: 'Main Page', price: 0 }
      ]
    }
  ];

  const [availableModules, setAvailableModules] = useState(initialModules);
  
  const [planItems, setPlanItems] = useState({
    'Basic Plan': [],
    'Silver Plan': [],
    'Gold Plan': []
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch('/api/admin/plan_config');
        if (response.ok) {
          const data = await response.json();
          if (data['MASTER_PALETTE']) {
            setAvailableModules(data['MASTER_PALETTE'].map(m => ({ ...m, isExpanded: false })));
            delete data['MASTER_PALETTE'];
          }
          setPlanItems(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (error) {
        console.error("Failed to load plan configs", error);
      }
    };
    fetchConfigs();
  }, []);

  const handleSavePlan = async (planName) => {
    try {
      const items = planItems[planName];
      const response = await fetch('/api/admin/plan_config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_name: planName,
          items: items
        })
      });
      if (response.ok) {
        alert(`${planName} saved successfully!`);
      } else {
        alert(`Failed to save ${planName}.`);
      }
    } catch (error) {
      console.error("Save error", error);
      alert(`Error saving ${planName}.`);
    }
  };

  const handleSavePalette = async () => {
    try {
      const response = await fetch('/api/admin/plan_config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_name: 'MASTER_PALETTE',
          items: availableModules
        })
      });
      if (response.ok) {
        alert(`Palette saved successfully!`);
      } else {
        alert(`Failed to save Palette.`);
      }
    } catch (error) {
      console.error("Save error", error);
      alert(`Error saving Palette.`);
    }
  };

  const getPlanPrice = (planName, basePrice) => {
    const itemsInPlan = planItems[planName] || [];
    const extraCost = itemsInPlan.reduce((sum, item) => {
      // item.price is already the sum of child pages if it's a parent,
      // so we just add item.price directly. No double counting.
      return sum + Number(item.price || 0);
    }, 0);
    return basePrice + extraCost;
  };

  // Toggle expansion of parent modules in the left sidebar
  const toggleExpand = (modId) => {
    setAvailableModules(prev => prev.map(m => 
      m.id === modId ? { ...m, isExpanded: !m.isExpanded } : m
    ));
  };

  // Handle manual price changes in the sidebar
  const handlePriceChange = (modId, pageId, newPrice) => {
    const val = newPrice === '' ? 0 : Number(newPrice);
    
    setAvailableModules(prev => prev.map(m => {
      if (m.id === modId) {
        if (!pageId) {
          // Updating parent price
          return { ...m, price: val };
        } else {
          // Updating child page price
          const updatedPages = m.pages.map(p => p.id === pageId ? { ...p, price: val } : p);
          // Automatically sum up child prices for the parent module
          const newParentPrice = updatedPages.reduce((sum, p) => sum + Number(p.price || 0), 0);
          return { ...m, pages: updatedPages, price: newParentPrice };
        }
      }
      return m;
    }));
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, itemPayload, sourcePlan) => {
    e.dataTransfer.setData('itemPayload', JSON.stringify(itemPayload));
    e.dataTransfer.setData('sourcePlan', sourcePlan); // 'available' or planName
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
    e.currentTarget.style.transform = 'scale(1.02)';
    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
  };

  const handleDrop = (e, targetPlan, targetIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
    }

    const payloadStr = e.dataTransfer.getData('itemPayload');
    const sourcePlan = e.dataTransfer.getData('sourcePlan');

    if (!payloadStr) return; 

    const item = JSON.parse(payloadStr);

    // If target is available, it means we drag OUT of a plan to delete it
    if (targetPlan === 'available') {
      if (sourcePlan !== 'available') {
        setPlanItems(prev => {
          let updatedList = prev[sourcePlan].filter(i => i.id !== item.id);
          if (item.id === 'page_km_active') {
            updatedList = updatedList.filter(i => i.id !== 'page_trk_act');
          } else if (item.id === 'mod_kitchen_mgmt') {
            updatedList = updatedList.filter(i => i.id !== 'mod_order_tracking');
          } else if (item.id === 'mod_purchase_mgmt') {
            updatedList = updatedList.filter(i => i.id !== 'page_set_tax').map(i => {
              if (i.id === 'mod_settings' && i.pages) {
                return { ...i, pages: i.pages.filter(p => p.id !== 'page_set_tax') };
              }
              return i;
            }).filter(i => !(i.id === 'mod_settings' && (!i.pages || i.pages.length === 0)));
          }
          return {
            ...prev,
            [sourcePlan]: updatedList
          };
        });
      }
      return;
    }

    // Handle reordering within the SAME plan
    if (sourcePlan === targetPlan) {
      if (targetIndex === null) return; // Dropped on the container, not on an item
      
      setPlanItems(prev => {
        const list = [...prev[targetPlan]];
        const currentIndex = list.findIndex(i => i.id === item.id);
        if (currentIndex === -1 || currentIndex === targetIndex) return prev;
        
        list.splice(currentIndex, 1);
        list.splice(targetIndex, 0, item);
        
        return {
          ...prev,
          [targetPlan]: list
        };
      });
      return;
    }

    // Add to target plan (from another plan or palette)
    setPlanItems(prev => {
      // Check if already in plan to prevent duplicates
      const exists = prev[targetPlan].find(i => i.id === item.id);
      if (exists) return prev; // Do nothing if it's already there

      // If we dragged from another plan, remove it from that source plan
      let newSourceList = prev[sourcePlan];
      if (sourcePlan !== 'available') {
        newSourceList = prev[sourcePlan].filter(i => i.id !== item.id);
        if (item.id === 'page_km_active') {
          newSourceList = newSourceList.filter(i => i.id !== 'page_trk_act');
        } else if (item.id === 'mod_kitchen_mgmt') {
          newSourceList = newSourceList.filter(i => i.id !== 'mod_order_tracking');
        } else if (item.id === 'mod_purchase_mgmt') {
          newSourceList = newSourceList.filter(i => i.id !== 'page_set_tax').map(i => {
            if (i.id === 'mod_settings' && i.pages) {
              return { ...i, pages: i.pages.filter(p => p.id !== 'page_set_tax') };
            }
            return i;
          }).filter(i => !(i.id === 'mod_settings' && (!i.pages || i.pages.length === 0)));
        }
      }

      const newTargetList = [...prev[targetPlan]];
      if (targetIndex !== null) {
        newTargetList.splice(targetIndex, 0, item);
      } else {
        newTargetList.push(item);
      }

      // Auto-include Order Tracking when Kitchen Active Orders is dragged
      if (item.id === 'page_km_active') {
        const trkPageExists = newTargetList.some(i => i.id === 'page_trk_act');
        if (!trkPageExists) {
          newTargetList.push({ id: 'page_trk_act', name: 'Active Orders', price: 0, isParent: false, parentName: 'Order Tracking' });
        }
      } else if (item.id === 'mod_kitchen_mgmt') {
        const trkModExists = newTargetList.some(i => i.id === 'mod_order_tracking');
        if (!trkModExists) {
          newTargetList.push({ id: 'mod_order_tracking', name: 'Order Tracking', price: 0, isParent: true, pages: [{ id: 'page_trk_act', name: 'Active Orders', price: 0 }] });
        }
      } else if (item.id === 'mod_purchase_mgmt') {
        const settingsModIndex = newTargetList.findIndex(i => i.id === 'mod_settings');
        if (settingsModIndex !== -1) {
          const settingsMod = newTargetList[settingsModIndex];
          const taxExists = settingsMod.pages && settingsMod.pages.some(p => p.id === 'page_set_tax');
          if (!taxExists) {
            newTargetList[settingsModIndex] = {
              ...settingsMod,
              pages: [...(settingsMod.pages || []), { id: 'page_set_tax', name: 'Tax Master', price: 0 }]
            };
          }
        } else {
          const standaloneTaxExists = newTargetList.some(i => i.id === 'page_set_tax');
          if (!standaloneTaxExists) {
            newTargetList.push({ id: 'mod_settings', name: 'Settings', price: 0, isParent: true, pages: [{ id: 'page_set_tax', name: 'Tax Master', price: 0 }] });
          }
        }
      }

      return {
        ...prev,
        ...(sourcePlan !== 'available' && { [sourcePlan]: newSourceList }),
        [targetPlan]: newTargetList
      };
    });
  };

  const handleRemoveFromPlan = (itemId, planName) => {
    setPlanItems(prev => {
      let updatedList = prev[planName].filter(i => i.id !== itemId);
      if (itemId === 'page_km_active') {
        updatedList = updatedList.filter(i => i.id !== 'page_trk_act');
      } else if (itemId === 'mod_kitchen_mgmt') {
        updatedList = updatedList.filter(i => i.id !== 'mod_order_tracking');
      } else if (itemId === 'mod_purchase_mgmt') {
        updatedList = updatedList.filter(i => i.id !== 'page_set_tax').map(i => {
          if (i.id === 'mod_settings' && i.pages) {
            return { ...i, pages: i.pages.filter(p => p.id !== 'page_set_tax') };
          }
          return i;
        }).filter(i => !(i.id === 'mod_settings' && (!i.pages || i.pages.length === 0)));
      }
      return {
        ...prev,
        [planName]: updatedList
      };
    });
  };

  const handleRemovePageFromPlan = (planName, parentId, pageId) => {
    setPlanItems(prev => {
      let planList = prev[planName].map(item => {
        if (item.id === parentId && item.pages) {
          const updatedPages = item.pages.filter(p => p.id !== pageId);
          const newPrice = updatedPages.reduce((sum, p) => sum + Number(p.price || 0), 0);
          return { ...item, pages: updatedPages, price: newPrice };
        }
        return item;
      });

      // Auto-remove Order Tracking if Kitchen Active Orders is removed
      if (pageId === 'page_km_active') {
        planList = planList.filter(i => i.id !== 'page_trk_act').map(item => {
          if (item.id === 'mod_order_tracking' && item.pages) {
            const updatedPages = item.pages.filter(p => p.id !== 'page_trk_act');
            return { ...item, pages: updatedPages, price: 0 };
          }
          return item;
        }).filter(item => {
          if (item.id === 'mod_order_tracking' && (!item.pages || item.pages.length === 0)) {
            return false;
          }
          return true;
        });
      }

      return { ...prev, [planName]: planList };
    });
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
          details.plan-card-item > summary { list-style: none; }
          details.plan-card-item > summary::-webkit-details-marker { display: none; }
          details.plan-card-item > summary .custom-arrow { transform: rotate(-90deg); transition: transform 0.2s ease; }
          details.plan-card-item[open] > summary .custom-arrow { transform: rotate(0deg); }
        `}
      </style>
      <button 
        onClick={() => navigate('/admin')}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', 
          backgroundColor: '#fff', border: '1px solid #ddd', padding: '10px 20px', 
          borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50',
          marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-5px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.8rem', color: '#2c3e50', fontWeight: '900', marginBottom: '10px' }}>
          Plan Customization
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#7f8c8d', maxWidth: '700px', margin: '0 auto' }}>
          Edit prices dynamically. Drag full modules or individual pages into a plan to automatically build the subscription tier!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'stretch' }}>
        
        {/* Left Side: Dynamic Blueprint (Palette) */}
        <div 
          style={{
            flex: '0 0 380px',
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'available')} // Trash zone basically
        >
          <h2 style={{ fontSize: '1.4rem', color: '#34495e', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '20px' }}>
            Modules & Pages Palette
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#95a5a6', marginBottom: '20px' }}>
            * Drag a module or expand it to drag specific pages. Edit prices below.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {availableModules.map(mod => (
              <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                
                {/* Parent Module Row */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, { id: mod.id, name: mod.name, price: mod.price, isParent: true, pages: mod.pages }, 'available')}
                  style={{
                    backgroundColor: '#f8fcff', border: '1px solid #d4e6f1', padding: '10px 15px',
                    borderRadius: '12px', cursor: 'grab', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#3498db'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#d4e6f1'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={() => toggleExpand(mod.id)} style={{ cursor: 'pointer', color: '#7f8c8d', padding: '5px' }}>
                      {mod.isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                    <FaGripVertical style={{ color: '#bdc3c7' }} />
                    <span style={{ fontWeight: '700', color: '#2c3e50', fontSize: '0.95rem' }}>{mod.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#2980b9' }}>$</span>
                    <input 
                      type="number" 
                      value={mod.price || ''} 
                      readOnly={true}
                      style={{ width: '50px', padding: '5px', borderRadius: '5px', border: '1px solid #bdc3c7', textAlign: 'center', fontWeight: 'bold', color: '#2980b9', backgroundColor: '#eef2f5', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                {/* Children Pages */}
                {mod.isExpanded && (
                  <div style={{ paddingLeft: '35px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mod.pages.map(page => (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { id: page.id, name: page.name, price: page.price, isParent: false, parentName: mod.name }, 'available')}
                        style={{
                          backgroundColor: '#fff', border: '1px dashed #bdc3c7', padding: '8px 12px',
                          borderRadius: '8px', cursor: 'grab', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fdfefe'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaGripVertical style={{ color: '#ecf0f1', fontSize: '0.8rem' }} />
                          <span style={{ color: '#34495e', fontSize: '0.85rem', fontWeight: '600' }}>{page.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#27ae60', fontSize: '0.8rem' }}>$</span>
                          <input 
                            type="number" 
                            value={page.price || ''} 
                            onChange={(e) => handlePriceChange(mod.id, page.id, e.target.value)}
                            style={{ width: '45px', padding: '3px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.85rem', color: '#27ae60' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleSavePalette}
            style={{
              marginTop: '25px', padding: '15px', width: '100%',
              borderRadius: '12px', border: 'none',
              backgroundColor: '#34495e',
              color: '#fff',
              fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Save Palette Config
          </button>
        </div>

        {/* Right Side: Subscription Plans Drop Zones */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
          {basePlans.map((plan, idx) => {
            const currentPrice = getPlanPrice(plan.name, plan.basePrice);
            const addedItems = planItems[plan.name];

            return (
              <div 
                key={idx}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, plan.name)}
                style={{
                  background: plan.bg,
                  borderRadius: '20px',
                  border: `2px solid ${plan.border}`,
                  padding: '30px',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Plan Header */}
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  {plan.featured && (
                    <span style={{
                      position: 'absolute', top: '-45px', right: '50%', transform: 'translateX(50%)',
                      backgroundColor: '#e74c3c', color: '#fff', padding: '5px 15px',
                      borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
                    }}>
                      MOST POPULAR
                    </span>
                  )}
                  <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{plan.icon}</div>
                  <h2 style={{ fontSize: '1.6rem', color: plan.headerColor, fontWeight: '900', margin: '0 0 5px 0' }}>{plan.name}</h2>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '5px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '2.8rem', color: '#2c3e50', fontWeight: '900' }}>${currentPrice}</span>
                    <span style={{ fontSize: '1.2rem', color: '#7f8c8d', fontWeight: 'bold' }}>/mo</span>
                  </div>
                  <p style={{ color: '#34495e', lineHeight: '1.5', fontSize: '0.95rem', margin: '0 0 20px 0', minHeight: '50px' }}>
                    {plan.desc}
                  </p>
                </div>

                {/* Drop Zone for Modules/Pages */}
                <div style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '15px',
                  padding: '15px',
                  border: '2px dashed #bdc3c7',
                  minHeight: '250px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                    Included Features
                  </h4>
                  
                  {addedItems.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', height: '150px', color: '#95a5a6', textAlign: 'center', paddingTop: '40px' }}>
                      <FaPlus style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }} />
                      <span>Drag modules or specific pages here</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {addedItems.map((item, idx) => (
                        <div 
                          key={item.id} 
                          style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.opacity = '0.5'; }}
                          onDragLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onDrop={(e) => { e.currentTarget.style.opacity = '1'; handleDrop(e, plan.name, idx); }}
                        >
                          <details 
                            className="plan-card-item"
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: '10px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                              borderLeft: item.isParent ? '4px solid #3498db' : '4px solid #2ecc71',
                              overflow: 'hidden'
                            }}
                          >
                            <summary 
                              draggable
                              onDragStart={(e) => handleDragStart(e, item, plan.name)}
                              style={{
                                padding: '12px 15px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'grab',
                                outline: 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.isParent && <FaChevronDown className="custom-arrow" style={{color: '#7f8c8d', fontSize: '0.8rem'}} />}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{item.name}</span>
                                  {!item.isParent && <span style={{ fontSize: '0.7rem', color: '#95a5a6' }}>Sub-page of {item.parentName}</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: item.isParent ? '#2980b9' : '#27ae60', fontWeight: 'bold', fontSize: '0.85rem' }}>+${item.price}</span>
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleRemoveFromPlan(item.id, plan.name); }}
                                  style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '5px' }}
                                  title="Remove"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </summary>
                            
                            {/* If the dragged item is a parent and has pages, render them as sub-items */}
                            {item.isParent && item.pages && item.pages.length > 0 && (
                              <div style={{ paddingLeft: '30px', paddingRight: '15px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {item.pages.map(page => (
                                  <div key={page.id} style={{
                                    backgroundColor: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: '6px',
                                    borderLeft: '2px dashed #bdc3c7', display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', fontSize: '0.8rem'
                                  }}>
                                    <span style={{ color: '#34495e' }}>{page.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ color: '#7f8c8d', fontWeight: '600' }}>+${page.price || 0}</span>
                                      <button 
                                        onClick={(e) => { e.preventDefault(); handleRemovePageFromPlan(plan.name, item.id, page.id); }}
                                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0 5px' }}
                                        title="Remove Sub-page"
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleSavePlan(plan.name)}
                  style={{
                  marginTop: '25px', padding: '15px', width: '100%',
                  borderRadius: '12px', border: 'none',
                  backgroundColor: plan.headerColor,
                  color: '#fff',
                  fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Save {plan.name} Config
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RestaurantPlan;
