// src/components/Header/ActiveOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { FaArrowLeft, FaSyncAlt, FaCheck, FaTruck, FaKey, FaPrint } from "react-icons/fa";
import "./activeorders.css";
import { UserContext } from "../../Context/UserContext";
import { useContext } from "react";
import CurrencySymbol, { resolveCurrencyCode } from "../CurrencySymbol";

function ActiveOrders() {
  // NEW: Get user from Context
  const { user } = useContext(UserContext);
  const [savedOrders, setSavedOrders] = useState([]);
  const [employees, setEmployees] = useState([]); // Will store Delivery Boys
  const [tables, setTables] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState(null);
  const [showReassignPopup, setShowReassignPopup] = useState(false); // New for re-assign
  const [secretKeyInput, setSecretKeyInput] = useState(''); // For secret key entry
  const [filterType, setFilterType] = useState("Dine In"); // Updated filters
  const [workflowSettings, setWorkflowSettings] = useState({}); // NEW: Hierarchical workflow settings
  const [baseUrl, setBaseUrl] = useState(""); // Dynamic base URL for client/server mode
  const [vatRate, setVatRate] = useState(0.10); // UPDATED: Dynamic VAT rate like in FrontPage
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const navigate = useNavigate();

  const isFeatureEnabled = (wfName, featurePath = 'enabled') => {
    const key = wfName === "Take Away" ? "Takeaway" : wfName;
    const settings = workflowSettings[key];
    const hasAnyConfig = Object.keys(workflowSettings).length > 0;

    // Default to true if no configuration has been deployed yet
    if (!settings) return !hasAnyConfig;

    if (settings.enabled === false) return false;

    // Check sub-feature path (e.g., 'save.activeorders')
    try {
      const keys = featurePath.split('.');
      let current = settings;
      for (const k of keys) {
        if (current[k] === undefined) {
          // If the setting is not defined, default to true (enabled)
          return true;
        }
        current = current[k];
      }
      return current !== false;
    } catch { return !hasAnyConfig; }
  };

  // NEW: Fetch workflow settings for dynamic tab suppression
  useEffect(() => {
    const fetchWorkflowSettings = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj) return;
        const activeComp = localStorage.getItem('active_company') || userObj.company;
        const activeBranch = localStorage.getItem('active_branch');
        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        const response = await axios.get('/api/workflow-visibility', { params });
        const settings = response.data.settings || {};
        setWorkflowSettings(settings);

        const hasAnyConfig = Object.keys(settings).length > 0;

        // Auto-initialize filterType to the first enabled experience
        const preferred = ["Dine In", "Take Away", "Online Delivery"];

        let foundDefault = false;
        for (const p of preferred) {
          const key = p === "Take Away" ? "Takeaway" : p;
          const s = settings[key];

          // If no config, default to true. If config exists, must be explicitly true.
          const isEnabled = !s ? !hasAnyConfig : (s.enabled !== false && s.save?.activeorders !== false);

          if (isEnabled) {
            setFilterType(p);
            foundDefault = true;
            break;
          }
        }
        if (!foundDefault) setFilterType("Delivered");

      } catch (err) {
        console.error("ActiveOrders: Failed to fetch workflow settings", err);
      }
    };
    fetchWorkflowSettings();
  }, [user]);

  // Fetch config for baseUrl (client/server mode)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/network_info");
        const { config: appConfig } = response.data;
        if (appConfig.mode === "client") {
          setBaseUrl(`http://${appConfig.server_ip}:6034`);
        } else {
          setBaseUrl(""); // Relative paths for server mode
        }
        console.log("API configured for", appConfig.mode, "mode. Pointing to", baseUrl || "localhost");
      } catch (error) {
        console.error("Failed to fetch config:", error);
        setBaseUrl(""); // Fallback to relative
      }
    };
    fetchConfig();
  }, []);



  // Keyboard Shortcuts Integration
  useEffect(() => {
    const isKeyboardShortcutsEnabled = localStorage.getItem("isKeyboardShortcutsEnabled") === "true";
    if (!isKeyboardShortcutsEnabled) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // UPDATED: Fetch VAT rate dynamically like in FrontPage
  useEffect(() => {
    const fetchVat = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/get-vat` : '/api/get-vat';
        const response = await axios.get(apiPath);
        setVatRate(response.data.vat / 100 || 0.10);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };
    fetchVat();
  }, [baseUrl]);

  // NEW: Fetch Print settings (for receipt)
  useEffect(() => {
    const fetchPrintSettings = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/get-print-settings` : "/api/get-print-settings";
        const response = await axios.get(apiPath);
        if (response.data.success) {
          setPrintSettings(response.data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch print settings:", err);
      }
    };
    fetchPrintSettings();
  }, [baseUrl]);

  // NEW: Fetch logo URL
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/get-logo` : "/api/get-logo";
        const response = await axios.get(apiPath);
        if (response.data.success) {
          setLogoUrl(baseUrl ? `${baseUrl}${response.data.logo_url}` : response.data.logo_url);
        }
      } catch (err) {
        console.error("Failed to fetch logo:", err);
      }
    };
    fetchLogo();
  }, [baseUrl]);

  // NEW: Helper to get currency symbol (from FrontPage)
  const getCurrencySymbol = (currCode = null, asString = false) => {
    const code = (currCode || resolveCurrencyCode(null, localStorage.getItem('active_company'), localStorage.getItem('active_branch')))?.toUpperCase();
    if (code === "AED") {
      if (asString) {
        return `<img src="${window.location.origin}/assets/Dirham Currency Symbol - Black.svg" alt="AED" style="height: 12px; width: auto; vertical-align: middle; margin-right: 2px;" />`;
      }
    }
    if (asString) {
      const symbols = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'SAR': '﷼', 'KWD': 'د.ك', 'OMR': 'ر.ع.', 'BHD': 'د.ب.', 'QAR': 'ر.ق',
      };
      return symbols[code] || '₹';
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '2px', transform: 'translateY(1px)' }}><CurrencySymbol currencyCode={code} size={14} /></span>;
  };

  // NEW: Ported from SalesPage for consistent formatting
  const getCurrencyFormatter = (invoiceCurrency = null, invoicePrecision = null, asString = false) => {
    const curr = invoiceCurrency || resolveCurrencyCode(null, localStorage.getItem('active_company'), localStorage.getItem('active_branch'));
    const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : 2;

    return {
      format: (value) => {
        if (value === null || value === undefined) return '';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '';

        const fixedValue = numValue.toFixed(precision);
        const symbol = getCurrencySymbol(curr, asString);
        if (asString) {
          // Add a space if it's text, omit if it's an image tag
          return typeof symbol === 'string' && symbol.includes('<img') ? `${symbol}${fixedValue}` : `${symbol} ${fixedValue}`;
        }
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}{fixedValue}</span>;
      }
    };
  };

  const formatCurrency = (value, currCode = null, asString = false) => {
    const formatter = getCurrencyFormatter(currCode, null, asString);
    return formatter.format(value);
  };

  // FIXED: Updated formatPrice to handle string inputs and respect useCurrencySymbol setting
  const formatPrice = (price) => {
    const symbol = getCurrencySymbol();
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}0.00</span>;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}{numPrice.toFixed(2)}</span>;
  };

  // NEW: Normalize order type to shorthands (DIN, TAK, OND)
  const normalizeOrderType = (orderType) => {
    if (!orderType) return "N/A";
    const normalized = orderType.trim().toLowerCase();
    const orderTypeMap = {
      "dine in": "DIN",
      "dine-in": "DIN",
      takeaway: "TAK",
      "take away": "TAK",
      "online delivery": "OND",
      delivery: "OND",
    };
    return orderTypeMap[normalized] || orderType;
  };

  // NEW: Standardize Token No prefixes for display (e.g., Take Away-0077 -> TAK-0077)
  const formatTokenNo = (tokenNo) => {
    if (!tokenNo) return "N/A";
    return tokenNo
      .replace(/Takeaway-/i, "TAK-")
      .replace(/Take Away-/i, "TAK-")
      .replace(/Dine In-/i, "DIN-")
      .replace(/Dine-In-/i, "DIN-")
      .replace(/Online Delivery-/i, "OND-")
      .replace(/Delivery-/i, "OND-");
  };

  const fetchData = async () => {
    try {
      const ordersResponse = await axios.get(`${baseUrl}/api/activeorders`, {
        params: {
          userId: user?.userId || user?._id,
          role: user?.role
        }
      });
      console.log("Fetched orders from server in ActiveOrders:", ordersResponse.data);
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      const sanitizedOrders = orders.map((order) => ({
        ...order,
        orderNo: order.orderNo || "N/A",
        chairsBooked: Array.isArray(order.chairsBooked) ? order.chairsBooked : [],
        cartItems: Array.isArray(order.cartItems)
          ? order.cartItems.map((item) => {
            const formattedItem = {
              ...item,
              originalBasePrice: item.originalBasePrice || null,
              served: item.served !== undefined ? item.served : false,
              servedQuantity: item.servedQuantity || (item.served ? (item.quantity || 1) : 0),
              exclTotal: Number(item.excl_amount) || Number(item.exclTotal) || 0,
              taxTotal: Number(item.tax_amount) || Number(item.taxTotal) || 0,
              taxBreakdown: item.tax_breakdown || item.taxBreakdown || {},
              isCombo: item.isCombo || item.is_combo_offer || false,
              addonQuantities: item.addonQuantities || {},
              addonVariants: item.addonVariants || {},
              addonPrices: item.addonPrices || {},
              servedAddons: item.servedAddons || {}, // NEW: Initialize servedAddons
              comboQuantities: item.comboQuantities || {},
              comboVariants: item.comboVariants || {},
              comboPrices: item.comboPrices || {},
              servedCombos: item.servedCombos || {}, // NEW: Initialize servedCombos
              servedComboItems: item.servedComboItems || {}, // NEW: Initialize servedComboItems
            };
            // Reconstruct addons if they are in array format (common for website orders)
            if (Object.keys(formattedItem.addonVariants).length === 0 && Array.isArray(item.addons)) {
              item.addons.forEach(addon => {
                const addonName = addon.name1 || addon.addon_name || addon.name || "Addon";
                formattedItem.addonQuantities[addonName] = addon.addon_quantity || 1;
                formattedItem.addonVariants[addonName] = {
                  size: addon.size || "M",
                  kitchen: addon.kitchen || "Main Kitchen"
                };
                formattedItem.addonPrices[addonName] = Number(addon.addon_price) || 0;
              });
            }
            // Reconstruct combos if they are in array format
            if (Object.keys(formattedItem.comboVariants).length === 0 && Array.isArray(item.selectedCombos)) {
              item.selectedCombos.forEach(combo => {
                const comboName = combo.name1 || combo.combo_name || combo.name || "Combo";
                formattedItem.comboQuantities[comboName] = Number(combo.combo_quantity) || 1;
                formattedItem.comboVariants[comboName] = {
                  size: combo.size || "M",
                  kitchen: combo.kitchen || "Main Kitchen"
                };
                formattedItem.comboPrices[comboName] = Number(combo.combo_price) || 0;
              });
            }
            return formattedItem;
          })
          : [],
        pickedUpTime: order.pickedUpTime || null,
        paid: order.paid || false,
        status: order.status || 'Pending', // New status field
      }));
      setSavedOrders(sanitizedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(sanitizedOrders));

      // Auto-completion check for all orders from server
      sanitizedOrders.forEach(order => {
        checkAndAutoComplete(order.orderId, sanitizedOrders);
      });
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to fetch data in ActiveOrders:", err);
      // Suppressed UI warning message as per request - do not setWarningMessage
    }
  };

  // UPDATED: Modified directly to fetch delivery employees
  const fetchEmployees = async () => {
    try {
      // Changed endpoint to specifically fetch delivery employees which contain 'employeeId', 'role', etc.
      const response = await axios.get(`${baseUrl}/api/delivery-employees`);
      console.log("Fetched Delivery Employees:", response.data);
      if (Array.isArray(response.data)) {
        // Filter is redundant if the endpoint returns only delivery employees, but kept for safety
        const deliveryBoys = response.data.filter(emp => emp.role && emp.role.toLowerCase() === 'delivery boy');
        setEmployees(deliveryBoys);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      // Suppressed UI warning message as per request
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/tables`);
      setTables(response.data.message || []);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      // Suppressed UI warning message as per request
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
    fetchTables();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [baseUrl]); // Re-fetch after baseUrl and currency are set

  const getFloor = (order) => {
    // Priority 1: Use floor stored in the order object from backend
    if (order.floor && order.floor !== "N/A") return order.floor;
    // Priority 2: Fallback to searching tables list (less reliable for duplicate table numbers)
    const table = tables.find((t) => String(t.table_number) === String(order.tableNumber));
    return table ? table.floor : "N/A";
  };

  const handleRefresh = () => {
    fetchData();
    fetchEmployees(); // Ensure employees are also refreshed
    // Suppressed UI warning message as per request
    // setWarningMessage("Orders refreshed!");
    // setWarningType("success");
  };

  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
    setIsConfirmation(false);
  };

  const handleConfirmYes = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setWarningMessage("");
    setWarningType("warning");
    setIsConfirmation(false);
  };

  const handleConfirmNo = () => {
    setWarningMessage("");
    setWarningType("warning");
    setPendingAction(null);
    setIsConfirmation(false);
  };

  const handleDeleteOrder = (orderId, tableNumber, orderNo) => {
    setWarningMessage(`Are you sure you want to delete order ${orderNo || "N/A"}?`);
    setWarningType("warning");
    setIsConfirmation(true);
    setPendingAction(() =>
      async () => {
        try {
          await axios.delete(`${baseUrl}/api/activeorders/${orderId}`);
          let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
          const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== tableNumber);
          localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
          let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
          delete bookedChairs[tableNumber];
          localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
          const updatedOrders = savedOrders.filter((order) => order.orderId !== orderId);
          setSavedOrders(updatedOrders);
          localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
          // Suppressed UI warning message as per request
          // setWarningMessage(`Order ${orderNo || "N/A"} deleted successfully!`);
          // setWarningType("success");
        } catch (err) {
          console.error("Failed to delete order:", err);
          // Suppressed UI warning message as per request
        }
      }
    );
  };

  const handleDeleteItem = async (orderId, itemId) => {
    try {
      await axios.delete(`${baseUrl}/api/activeorders/${orderId}/items/${itemId}`);
      fetchData();
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to delete item:", err);
      // Suppressed UI warning message as per request
    }
  };

  const handleDeleteAllCompleted = () => {
    setWarningMessage("Are you sure you want to delete all completed orders?");
    setWarningType("warning");
    setIsConfirmation(true);
    setPendingAction(() =>
      async () => {
        try {
          const filteredCompleted = completedFiltered;
          for (const order of filteredCompleted) {
            await axios.delete(`${baseUrl}/api/activeorders/${order.orderId}`);
            let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
            const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== order.tableNumber);
            localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
            let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
            delete bookedChairs[order.tableNumber];
            localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
          }
          fetchData();
          // Suppressed UI warning message as per request
        } catch (err) {
          console.error("Failed to delete completed orders:", err);
          // Suppressed UI warning message as per request
        }
      }
    );
  };

  const handleCompleted = async (orderId, isAuto = false, currentOrders = null) => {
    const list = currentOrders || savedOrders;
    const order = list.find((o) => o.orderId === orderId);
    if (!order) return;

    const completeAndDelele = async () => {
      try {
        await axios.delete(`${baseUrl}/api/activeorders/${orderId}`);
        let bookedTables = JSON.parse(localStorage.getItem("bookedTables")) || [];
        const updatedBookedTables = bookedTables.filter((tableNum) => tableNum !== order.tableNumber);
        localStorage.setItem("bookedTables", JSON.stringify(updatedBookedTables));
        let bookedChairs = JSON.parse(localStorage.getItem("bookedChairs")) || {};
        delete bookedChairs[order.tableNumber];
        localStorage.setItem("bookedChairs", JSON.stringify(bookedChairs));
        const updatedOrders = list.filter((o) => o.orderId !== orderId);
        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      } catch (err) {
        console.error("Failed to complete order:", err);
      }
    };

    if (isAuto) {
      await completeAndDelele();
    } else {
      const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));
      if (order.paid && allItemsCompleted) {
        setWarningMessage("Are you sure you want to mark this order as completed and delete it?");
        setWarningType("warning");
        setIsConfirmation(true);
        setPendingAction(() => completeAndDelele);
      }
    }
  };

  const checkAndAutoComplete = (orderId, currentOrders) => {
    const order = currentOrders.find(o => o.orderId === orderId);
    if (!order || !order.paid) return;

    const allItemsServed = order.cartItems.every((i) => (i.servedQuantity || 0) >= (i.quantity || 1));
    const allSubItemsServed = order.cartItems.every((i) => {
      const addonsServed = !i.addonQuantities || Object.keys(i.addonQuantities).length === 0 ||
        Object.keys(i.addonQuantities).every(a => i.servedAddons?.[a]);
      const combosServed = !i.comboQuantities || Object.keys(i.comboQuantities).length === 0 ||
        Object.keys(i.comboQuantities).every(c => i.servedCombos?.[c]);
      const comboOfferItemsServed = !i.is_combo_offer || !i.comboItems ||
        i.comboItems.every(ci => i.servedComboItems?.[ci.name]);
      return addonsServed && combosServed && comboOfferItemsServed;
    });

    if (allItemsServed && allSubItemsServed) {
      console.log("Auto-completing and deleting order:", orderId);
      handleCompleted(orderId, true, currentOrders);
    }
  };

  const checkAllItemsPickedUp = (order) => {
    if (!order.cartItems || order.cartItems.length === 0) return false;
    const allPickedUp = order.cartItems.every((item) => {
      const requiredKitchens = item.requiredKitchens || [];
      if (requiredKitchens.length === 0) return true;
      if (!item.kitchenStatuses) return false;
      return requiredKitchens.every((kitchen) => item.kitchenStatuses[kitchen] === "PickedUp");
    });
    console.log(`Check if all items picked up for order ${order.orderNo}: ${allPickedUp}`);
    return allPickedUp;
  };

  // New: Validate secret key to get employee ID
  const validateSecretKey = async (secretKey) => {
    try {
      const response = await axios.post(`${baseUrl}/api/employees/validate-secret-key`, { secretKey });
      return response.data.employeeId;
    } catch (err) {
      console.error("Invalid secret key:", err);
      return null;
    }
  };

  const handleAssignDeliveryPerson = async (orderId, deliveryPersonId) => {
    const order = savedOrders.find((o) => o.orderId === orderId);
    if (!order) {
      console.error("Order not found.");
      // Suppressed UI warning message as per request
      return;
    }
    if (order.orderType !== "Online Delivery") {
      console.error("Delivery person can only be assigned to Online Delivery orders.");
      // Suppressed UI warning message as per request
      return;
    }
    if (!checkAllItemsPickedUp(order)) {
      console.error(`Cannot assign delivery person to order ${order.orderNo}. All items, addons, and combos must be marked as Picked Up in the Kitchen page.`);
      // Suppressed UI warning message as per request
      return;
    }
    setSelectedOrderId(orderId);
    setSelectedDeliveryPersonId(deliveryPersonId);
    setShowDeliveryPopup(true);
  };

  const confirmDeliveryAssignment = async () => {
    try {
      const order = savedOrders.find((o) => o.orderId === selectedOrderId);
      if (!order) {
        console.error("Order not found.");
        // Suppressed UI warning message as per request
        setShowDeliveryPopup(false);
        return;
      }
      if (!checkAllItemsPickedUp(order)) {
        console.error(`Cannot assign delivery person to order ${order.orderNo}. All items, addons, and combos must be marked as Picked Up in the Kitchen page.`);
        // Suppressed UI warning message as per request
        setShowDeliveryPopup(false);
        return;
      }
      const employee = employees.find(emp => emp.employeeId === selectedDeliveryPersonId);
      const deliveryPersonName = employee ? employee.name : 'Unknown';
      // Updated: Set status to 'assigned' instead of deleting
      await axios.put(`${baseUrl}/api/activeorders/${selectedOrderId}`, {
        deliveryPersonId: selectedDeliveryPersonId,
        deliveryPersonName: deliveryPersonName,
        status: 'assigned', // New status
        cartItems: order.cartItems,
      });
      fetchData(); // Refresh
      // Suppressed UI warning message as per request
      setShowDeliveryPopup(false);
      setSelectedOrderId(null);
      setSelectedDeliveryPersonId(null);
    } catch (err) {
      console.error("Failed to assign delivery person:", err);
      // Suppressed UI warning message as per request
      setShowDeliveryPopup(false);
    }
  };

  // New: Handle re-assign with secret key
  const handleReassignWithSecretKey = (orderId) => {
    setSelectedOrderId(orderId);
    setShowReassignPopup(true);
  };

  const confirmReassign = async () => {
    const newEmployeeId = await validateSecretKey(secretKeyInput);
    if (!newEmployeeId) {
      setWarningMessage("Invalid secret key!");
      setWarningType("warning");
      return;
    }
    try {
      const employee = employees.find(emp => emp.employeeId === newEmployeeId);
      const deliveryPersonName = employee ? employee.name : 'Unknown';
      await axios.put(`${baseUrl}/api/activeorders/${selectedOrderId}`, {
        deliveryPersonId: newEmployeeId,
        deliveryPersonName: deliveryPersonName,
        status: 'assigned', // Reset to assigned
      });
      fetchData();
      setShowReassignPopup(false);
      setSecretKeyInput('');
      setSelectedOrderId(null);
    } catch (err) {
      console.error("Failed to reassign:", err);
    }
  };

  // UPDATED: Mark as delivered - Now calls new endpoint to move to trip_reports and updates sales record with deliveryPersonName for Online Delivery
  // FIXED: Replaced window.confirm with warning confirmation system
  const handleMarkDelivered = (orderId) => {
    setWarningMessage('Mark as delivered and move to trip reports?');
    setWarningType("warning");
    setIsConfirmation(true);
    setPendingAction(() =>
      async () => {
        try {
          const order = savedOrders.find(o => o.orderId === orderId);
          await axios.put(`${baseUrl}/api/activeorders/${orderId}/mark-delivered`);
          // NEW: If Online Delivery and has deliveryPersonName, update the corresponding sales record
          if (order && order.orderType === 'Online Delivery' && order.orderNo && order.deliveryPersonName) {
            try {
              await axios.post(`${baseUrl}/api/sales/update-delivery`, {
                orderNo: order.orderNo,
                deliveryPersonName: order.deliveryPersonName
              });
              console.log(`Updated sales record for orderNo: ${order.orderNo} with deliveryPersonName: ${order.deliveryPersonName}`);
            } catch (updateErr) {
              console.error("Failed to update sales delivery info:", updateErr);
            }
          }
          // Manual removal for instant UI update
          const updatedOrders = savedOrders.filter(o => o.orderId !== orderId);
          setSavedOrders(updatedOrders);
          localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

          fetchData();
          // Suppressed UI warning message as per request
        } catch (err) {
          console.error("Failed to mark delivered:", err);
        }
      }
    );
  };

  const cancelDeliveryPopup = () => {
    setShowDeliveryPopup(false);
    setSelectedOrderId(null);
    setSelectedDeliveryPersonId(null);
  };

  const cancelReassignPopup = () => {
    setShowReassignPopup(false);
    setSecretKeyInput('');
    setSelectedOrderId(null);
  };

  const updateOrder = async (orderId, updatedOrder) => {
    try {
      const response = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, updatedOrder);
      const updatedOrders = savedOrders.map((order) =>
        order.orderId === orderId ? { ...order, ...response.data.order } : order
      );
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      // Suppressed UI warning message as per request
    } catch (err) {
      console.error("Failed to update order:", err);
      // Suppressed UI warning message as per request
    }
  };

  const inferOrderType = (order) => {
    if (order.tableNumber && order.tableNumber !== "N/A") return "Dine In";
    else if (
      order.deliveryAddress &&
      (order.deliveryAddress.building_name || order.deliveryAddress.flat_villa_no || order.deliveryAddress.location)
    )
      return "Online Delivery";
    else return "Take Away";
  };

  const handleSelectOrder = (order) => {
    if (!order.cartItems || order.cartItems.length === 0) {
      console.error("This order has no items.");
      // Suppressed UI warning message as per request
      setIsConfirmation(false);
      return;
    }
    const baseURL = baseUrl || "";
    const cacheBuster = `?t=${new Date().getTime()}`;
    const formattedCartItems = order.cartItems.map((item) => {
      const formattedItem = {
        ...item,
        id: item.id || uuidv4(),
        item_name: item.item_name || item.name,
        name: item.name || item.item_name,
        quantity: Number(item.quantity) || 1,
        basePrice: Number(item.basePrice) || (Number(item.totalPrice) / (Number(item.quantity) || 1)) || 0,
        originalBasePrice: item.originalBasePrice || null,
        totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0,
        // FIXED: Preserve saved exclTotal and taxTotal without recalculating with current vatRate
        exclTotal: Number(item.exclTotal) || Number(item.excl_amount) || 0,
        taxTotal: Number(item.taxTotal) || Number(item.tax_amount) || 0,
        taxBreakdown: item.taxBreakdown || item.tax_breakdown || {}, // Preserve if saved
        selectedSize: item.selectedSize || "M",
        icePreference: item.icePreference || "without_ice",
        isSpicy: item.isSpicy || false,
        sugarLevel: item.sugarLevel || "medium",
        kitchen: item.kitchen || "Main Kitchen",
        addonQuantities: item.addonQuantities || {},
        addonVariants: item.addonVariants || {},
        addonPrices: item.addonPrices || {},
        addonSizePrices: item.addonSizePrices || {},
        addonIcePrices: item.addonIcePrices || {},
        addonSpicyPrices: item.addonSpicyPrices || {},
        addonImages: item.addonImages || {},
        icePrice: Number(item.icePrice) || Number(item.ice_price) || Number(item.variants?.cold?.ice_price) || 0,
        spicyPrice: Number(item.spicyPrice) || Number(item.spicy_price) || Number(item.variants?.spicy?.spicy_price) || 0,
        comboQuantities: item.comboQuantities || {},
        comboVariants: item.comboVariants || {},
        comboPrices: item.comboPrices || {},
        comboSizePrices: item.comboSizePrices || {},
        comboIcePrices: item.comboIcePrices || {},
        comboSpicyPrices: item.comboSpicyPrices || {},
        comboImages: item.comboImages || {},
        selectedCombos: item.selectedCombos || [],
        ingredients: item.ingredients || [],
        requiredKitchens: item.requiredKitchens || [],
        kitchenStatuses: item.kitchenStatuses || {},
        served: item.served || false,
        servedQuantity: item.servedQuantity || 0,
        servedAddons: item.servedAddons || {}, // NEW: Preserve servedAddons
        servedCombos: item.servedCombos || {}, // NEW: Preserve servedCombos
        servedComboItems: item.servedComboItems || {}, // NEW: Preserve servedComboItems
      };
      // Preserve existing addon details if available, reconstruct only if necessary
      formattedItem.addonQuantities = item.addonQuantities || {};
      formattedItem.addonVariants = item.addonVariants || {};
      formattedItem.addonPrices = item.addonPrices || {};
      formattedItem.addonSizePrices = item.addonSizePrices || {};
      formattedItem.addonIcePrices = item.addonIcePrices || {};
      formattedItem.addonSpicyPrices = item.addonSpicyPrices || {};
      formattedItem.addonImages = item.addonImages || {};
      formattedItem.addonCustomVariantsDetails = item.addonCustomVariantsDetails || {};
      formattedItem.icePrice = Number(item.icePrice) || Number(item.ice_price) || Number(item.variants?.cold?.ice_price) || 0;
      formattedItem.spicyPrice = Number(item.spicyPrice) || Number(item.spicy_price) || Number(item.variants?.spicy?.spicy_price) || 0;

      if (Object.keys(formattedItem.addonVariants).length === 0 && Array.isArray(item.addons)) {
        const addonQuantities = {};
        const addonVariants = {};
        const addonPrices = {};
        const addonSizePrices = {};
        const addonIcePrices = {};
        const addonSpicyPrices = {};
        const addonImages = {};
        const addonCustomVariantsDetails = {};
        item.addons.forEach((addon) => {
          const addonName = addon.name1 || addon.addon_name || addon.name || "Addon";
          addonQuantities[addonName] = addon.addon_quantity || 1;
          addonVariants[addonName] = {
            size: addon.size || "M",
            cold: addon.cold || "without_ice",
            spicy: addon.isSpicy || false,
            sugar: addon.sugar || "medium",
            kitchen: addon.kitchen || "Main Kitchen",
          };
          let addonPrice = Number(addon.addon_price) || 0;
          if (addonPrice === 0 && addon.addon_total_price) {
            addonPrice = Number(addon.addon_total_price) / (addon.addon_quantity || 1);
          } else if (addonPrice === 0 && addon.base_price) {
            addonPrice = Number(addon.base_price);
          } else if (addonPrice === 0) {
            addonPrice = Number(addon.addon_size_price) || 0;
          }
          addonPrices[addonName] = addonPrice;
          const customVariantsPrice = Object.values(addon.custom_variants || {}).reduce((sum, v) => sum + (Number(v.price) || 0), 0);
          addonSizePrices[addonName] = Number(addon.addon_size_price) || (addonPrice - (Number(addon.addon_ice_price) || 0) - (Number(addon.addon_spicy_price) || 0) - customVariantsPrice) || 0;
          addonIcePrices[addonName] = Number(addon.addon_ice_price) || 0;
          addonSpicyPrices[addonName] = Number(addon.addon_spicy_price) || 0;
          addonImages[addonName] = (addon.addon_image
            ? addon.addon_image.startsWith("http")
              ? addon.addon_image
              : `${baseURL}${addon.addon_image}`
            : "/static/images/default-addon-image.jpg") + cacheBuster;
          addonCustomVariantsDetails[addonName] = addon.custom_variants || {};
        });
        formattedItem.addonQuantities = addonQuantities;
        formattedItem.addonVariants = addonVariants;
        formattedItem.addonPrices = addonPrices;
        formattedItem.addonSizePrices = addonSizePrices;
        formattedItem.addonIcePrices = addonIcePrices;
        formattedItem.addonSpicyPrices = addonSpicyPrices;
        formattedItem.addonImages = addonImages;
        formattedItem.addonCustomVariantsDetails = addonCustomVariantsDetails;
      } else {
        Object.keys(formattedItem.addonQuantities || {}).forEach((addonName) => {
          if (!formattedItem.addonImages[addonName]) {
            formattedItem.addonImages[addonName] = "/static/images/default-addon-image.jpg" + cacheBuster;
          }
        });
      }
      // Preserve existing combo details if available, reconstruct only if necessary
      formattedItem.comboQuantities = item.comboQuantities || {};
      formattedItem.comboVariants = item.comboVariants || {};
      formattedItem.comboPrices = item.comboPrices || {};
      formattedItem.comboSizePrices = item.comboSizePrices || {};
      formattedItem.comboIcePrices = item.comboIcePrices || {};
      formattedItem.comboSpicyPrices = item.comboSpicyPrices || {};
      formattedItem.comboImages = item.comboImages || {};
      formattedItem.comboCustomVariantsDetails = item.comboCustomVariantsDetails || {};
      formattedItem.selectedCombos = item.selectedCombos || [];
      if (Object.keys(formattedItem.comboVariants).length === 0 && Array.isArray(item.selectedCombos)) {
        const comboQuantities = {};
        const comboVariants = {};
        const comboPrices = {};
        const comboSizePrices = {};
        const comboIcePrices = {};
        const comboSpicyPrices = {};
        const comboImages = {};
        const comboCustomVariantsDetails = {};
        item.selectedCombos.forEach((combo) => {
          const comboName = combo.name1 || combo.combo_name || combo.name || "Combo";
          comboQuantities[comboName] = Number(combo.combo_quantity) || 1;
          comboVariants[comboName] = {
            size: combo.size || "M",
            cold: combo.cold || "without_ice",
            spicy: combo.isSpicy || false,
            sugar: combo.sugar || "medium",
            kitchen: combo.kitchen || "Main Kitchen",
          };
          let comboPrice = Number(combo.combo_price) || 0;
          if (comboPrice === 0 && combo.combo_total_price) {
            comboPrice = Number(combo.combo_total_price) / (Number(combo.combo_quantity) || 1);
          } else if (comboPrice === 0 && combo.base_price) {
            comboPrice = Number(combo.base_price);
          } else if (comboPrice === 0 && combo.combo_size_price) {
            comboPrice = Number(combo.combo_size_price);
          } else if (comboPrice === 0 && item.basePrice) {
            comboPrice = Number(item.basePrice) / (item.comboQuantities ? Object.keys(item.comboQuantities).length : 1);
          }
          if (comboPrice === 0) {
            console.warn(`Warning: No valid price found for combo ${comboName}. Setting default to 0.00. Check backend data.`);
            comboPrice = 0;
          }
          comboPrices[comboName] = comboPrice;
          const customVariantsPrice = Object.values(combo.custom_variants || {}).reduce((sum, v) => sum + (Number(v.price) || 0), 0);
          comboSizePrices[comboName] = Number(combo.combo_size_price) || (comboPrice - (Number(combo.combo_ice_price) || 0) - (Number(combo.combo_spicy_price) || 0) - customVariantsPrice) || 0;
          comboIcePrices[comboName] = Number(combo.combo_ice_price) || 0;
          comboSpicyPrices[comboName] = Number(combo.combo_spicy_price) || 0;
          comboImages[comboName] = (combo.combo_image
            ? combo.combo_image.startsWith("http")
              ? combo.combo_image
              : `${baseURL}${combo.combo_image}`
            : "/static/images/default-combo-image.jpg") + cacheBuster;
          comboCustomVariantsDetails[comboName] = combo.custom_variants || {};
        });
        formattedItem.comboQuantities = comboQuantities;
        formattedItem.comboVariants = comboVariants;
        formattedItem.comboPrices = comboPrices;
        formattedItem.comboSizePrices = comboSizePrices;
        formattedItem.comboIcePrices = comboIcePrices;
        formattedItem.comboSpicyPrices = comboSpicyPrices;
        formattedItem.comboImages = comboImages;
        formattedItem.comboCustomVariantsDetails = comboCustomVariantsDetails;
        formattedItem.selectedCombos = item.selectedCombos;
      } else {
        formattedItem.comboImages = formattedItem.comboImages || {};
        Object.keys(formattedItem.comboQuantities || {}).forEach((comboName) => {
          if (!formattedItem.comboImages[comboName]) {
            formattedItem.comboImages[comboName] = "/static/images/default-combo-image.jpg" + cacheBuster;
          }
        });
      }
      // Custom variants for main item
      formattedItem.selectedCustomVariants = item.selectedCustomVariants || {};
      formattedItem.customVariantsDetails = item.customVariantsDetails || {};
      formattedItem.customVariantsQuantities = item.customVariantsQuantities || {};
      // FIXED: For combo offers (use is_combo_offer)
      if (item.is_combo_offer) {
        formattedItem.isCombo = true;
        formattedItem.comboItems = item.comboItems || [];
        formattedItem.offer_description = item.offer_description || item.name;
      }
      // Format comboItems images for combo offers
      if (item.is_combo_offer && Array.isArray(item.comboItems)) {
        formattedItem.comboItems = item.comboItems.map((comboItem) => ({
          ...comboItem,
          image: (comboItem.image
            ? comboItem.image.startsWith("http")
              ? comboItem.image
              : `${baseURL}${comboItem.image}`
            : "/static/images/default-combo-image.jpg") + cacheBuster,
        }));
      }
      formattedItem.image = (item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${baseURL}${item.image}`
        : "/static/images/default-item.jpg") + cacheBuster;
      // FIXED: No fallback recalculation - preserve saved exclTotal and taxTotal
      formattedItem.exclTotal = Number(item.exclTotal) || 0;
      formattedItem.taxTotal = Number(item.taxTotal) || 0;
      formattedItem.totalPrice = formattedItem.exclTotal + formattedItem.taxTotal; // Ensure totalPrice is incl
      return formattedItem;
    });
    const orderType = order.orderType || inferOrderType(order);
    const phoneNumber = order.phoneNumber?.replace(/^\+\d+/, "") || "";
    // Suppressed UI warning message as per request
    // setWarningMessage(
    // `You selected order ${order.orderNo} for ${
    // orderType === "Online Delivery" ? "Customer " + order.customerName : "Table " + (order.tableNumber || "N/A")
    // }`
    // );
    // setWarningType("success");
    // Directly navigate since warning is suppressed
    navigate("/frontpage", {
      state: {
        tableNumber: order.tableNumber || "N/A",
        phoneNumber: phoneNumber,
        customerName: order.customerName || "",
        existingOrder: { ...order, cartItems: formattedCartItems },
        cartItems: formattedCartItems,
        deliveryAddress: order.deliveryAddress || { building_name: "", flat_villa_no: "", location: "" },
        whatsappNumber: "",
        email: "",
        orderType: orderType,
        chairsBooked: Array.isArray(order.chairsBooked) ? order.chairsBooked : [],
        deliveryPersonId: order.deliveryPersonId || "",
        deliveryPersonName: order.deliveryPersonName || "", // Include deliveryPersonName for sales payload
        pickedUpTime: order.pickedUpTime || null,
        orderId: order.orderId,
        orderNo: order.orderNo,
      },
    });
  };

  const handleBack = () => {
    navigate("/frontpage");
  };

  const renderIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "No ingredients";
    return (
      <ul className="active-orders-ingredients-list">
        {ingredients.map((ing, idx) => (
          <li key={idx}>
            {ing.name}: {ing.custom_weight || ing.weight || "N/A"}g (₹{ing.calculated_price || ing.base_price || 0})
          </li>
        ))}
      </ul>
    );
  };

  const getPickedUpTick = (item, kitchen) => {
    if (!item.kitchenStatuses || !kitchen) return null;
    return item.kitchenStatuses[kitchen] === "PickedUp" ? <FaCheck style={{ color: 'green', marginLeft: '5px' }} /> : null;
  };

  const handleSubItemServiceChange = async (orderId, itemId, type, subItemName, isServed) => {
    try {
      const order = savedOrders.find((o) => o.orderId === orderId);
      if (!order) return;

      const updatedCartItems = order.cartItems.map((item) => {
        if (item.id === itemId) {
          const newItem = { ...item };
          if (type === 'addon') {
            newItem.servedAddons = { ...(newItem.servedAddons || {}), [subItemName]: isServed };
          } else if (type === 'combo') {
            newItem.servedCombos = { ...(newItem.servedCombos || {}), [subItemName]: isServed };
          } else if (type === 'comboItem') {
            newItem.servedComboItems = { ...(newItem.servedComboItems || {}), [subItemName]: isServed };
          }
          return newItem;
        }
        return item;
      });

      const response = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, { cartItems: updatedCartItems });
      if (response.data.success) {
        const updatedOrders = savedOrders.map((o) =>
          o.orderId === orderId ? { ...o, cartItems: updatedCartItems } : o
        );
        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

        // Auto-complete check
        checkAndAutoComplete(orderId, updatedOrders);
      }
    } catch (err) {
      console.error("Failed to update sub-item service status:", err);
    }
  };

  // UPDATED: FIXED Calculation - Subtotal (excl VAT sum of exclTotal), Grand Total (subtotal + sum taxTotal)
  const calculateSubtotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0; // Return number instead of string for consistency
    return cartItems.reduce((sum, item) => sum + (Number(item.exclTotal) || 0), 0);
  };

  const calculateTotalVat = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0; // Return number instead of string
    return cartItems.reduce((sum, item) => sum + (Number(item.taxTotal) || 0), 0);
  };

  const calculateGrandTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0; // Return number instead of string
    const subtotal = calculateSubtotal(cartItems);
    const vat = calculateTotalVat(cartItems);
    return subtotal + vat;
  };

  const getItemStatus = (item) => {
    if (!item.kitchenStatuses) return item.status || "Pending";
    const statuses = Object.values(item.kitchenStatuses);
    if (statuses.every((status) => status === "PickedUp")) return "PickedUp";
    else if (statuses.every((status) => status === "Prepared" || status === "PickedUp")) return "Prepared";
    else if (statuses.includes("Preparing")) return "Preparing";
    else return "Pending";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { backgroundColor: "#fff1f0", color: "#721c24" };
      case "Preparing":
        return { backgroundColor: "#fff3cd", color: "#856404" };
      case "Prepared":
        return { backgroundColor: "#d4edda", color: "#155724" };
      case "PickedUp":
        return { backgroundColor: "#e7f3ff", color: "#004085" };
      default:
        return {};
    }
  };

  // FIXED: Updated to include country, field1, field2, field3, flat_villa_no, building_name
  const formatDeliveryAddress = (deliveryAddress) => {
    if (!deliveryAddress) return "Not provided";
    const parts = [
      deliveryAddress.flat_villa_no,
      deliveryAddress.building_name,
      deliveryAddress.country,
      deliveryAddress.field1,
      deliveryAddress.field2,
      deliveryAddress.field3,
    ].filter((part) => part != null && String(part).trim() !== "");
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  const formatChairsBooked = (chairsBooked) => {
    if (!Array.isArray(chairsBooked) || chairsBooked.length === 0) return "None";
    return chairsBooked.join(", ");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const getDeliveryPersonName = (deliveryPersonId) => {
    const employee = employees.find((emp) => emp.employeeId === deliveryPersonId);
    return employee ? `${employee.name} (ID: ${employee.employeeId})` : "Not assigned";
  };

  const orderCounts = {
    "Dine In": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Dine In" && order.status !== 'assigned').length,
    "Take Away": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Take Away" && order.status !== 'assigned').length,
    "Online Delivery": savedOrders.filter((order) => (order.orderType || inferOrderType(order)) === "Online Delivery" && order.status !== 'assigned').length,
    "Delivered": savedOrders.filter((order) => order.status === 'assigned').length, // New filter for assigned/delivered
  };

  const filteredOrders = savedOrders.filter((order) => {
    const orderType = order.orderType || inferOrderType(order);
    const isDeliveredFilter = filterType === "Delivered";
    return (isDeliveredFilter ? order.status === 'assigned' : orderType === filterType && order.status !== 'assigned');
  });

  const unservedFiltered = filteredOrders.filter((order) => {
    const allItemsServed = order.cartItems.every((i) => (i.servedQuantity || 0) >= (i.quantity || 1));
    const allSubItemsServed = order.cartItems.every((i) => {
      const addonsServed = !i.addonQuantities || Object.keys(i.addonQuantities).length === 0 ||
        Object.keys(i.addonQuantities).every(a => i.servedAddons?.[a]);
      const combosServed = !i.comboQuantities || Object.keys(i.comboQuantities).length === 0 ||
        Object.keys(i.comboQuantities).every(c => i.servedCombos?.[c]);
      const comboOfferItemsServed = !i.is_combo_offer || !i.comboItems ||
        i.comboItems.every(ci => i.servedComboItems?.[ci.name]);
      return addonsServed && combosServed && comboOfferItemsServed;
    });
    return !(order.paid && allItemsServed && allSubItemsServed);
  });

  const completedFiltered = filteredOrders.filter((order) => {
    const allItemsServed = order.cartItems.every((i) => (i.servedQuantity || 0) >= (i.quantity || 1));
    const allSubItemsServed = order.cartItems.every((i) => {
      const addonsServed = !i.addonQuantities || Object.keys(i.addonQuantities).length === 0 ||
        Object.keys(i.addonQuantities).every(a => i.servedAddons?.[a]);
      const combosServed = !i.comboQuantities || Object.keys(i.comboQuantities).length === 0 ||
        Object.keys(i.comboQuantities).every(c => i.servedCombos?.[c]);
      const comboOfferItemsServed = !i.is_combo_offer || !i.comboItems ||
        i.comboItems.every(ci => i.servedComboItems?.[ci.name]);
      return addonsServed && combosServed && comboOfferItemsServed;
    });
    return order.paid && allItemsServed && allSubItemsServed;
  });

  const handleServiceChange = async (orderId, itemId, isServed) => {
    try {
      const order = savedOrders.find((o) => o.orderId === orderId);
      const item = order.cartItems.find((i) => i.id === itemId);
      if (!item) return;
      const newServedQty = isServed ? (item.quantity || 1) : 0;
      console.log(`Updating servedQuantity for item ${itemId}: ${newServedQty} (isServed: ${isServed})`);
      const response = await axios.post(`${baseUrl}/api/activeorders/${orderId}/items/${itemId}/mark-served`, { servedQuantity: newServedQty });
      if (response.data.success) {
        const updatedOrders = savedOrders.map((o) =>
          o.orderId === orderId
            ? {
              ...o,
              cartItems: o.cartItems.map((i) =>
                i.id === itemId ? { ...i, servedQuantity: newServedQty, served: isServed } : i
              ),
            }
            : o
        );
        setSavedOrders(updatedOrders);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

        // Auto-complete check
        checkAndAutoComplete(orderId, updatedOrders);
      }
    } catch (err) {
      console.error("Failed to update service status:", err);
      // Suppressed UI warning message as per request
    }
  };

  const handlePaymentChange = async (orderId, isPaid) => {
    try {
      const response = await axios.put(`${baseUrl}/api/activeorders/${orderId}`, { paid: isPaid });
      const updatedOrders = savedOrders.map((order) =>
        order.orderId === orderId ? { ...order, paid: isPaid } : order
      );
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

      // Auto-complete check
      checkAndAutoComplete(orderId, updatedOrders);
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };


  // NEW: Ported from SalesPage for detailed item price calculation
  const calculateItemPrices = (item) => {
    const baseAmount = Number(item.basePrice) || 0;

    const addonTotal = Object.entries(item.addonQuantities || {})
      .reduce((sum, [name, qty]) => sum + (Number(item.addonPrices?.[name]) || 0) * (Number(qty) || 0), 0);

    const comboTotal = Object.entries(item.comboQuantities || {})
      .reduce((sum, [name, qty]) => sum + (Number(item.comboPrices?.[name]) || 0) * (Number(qty) || 0), 0);

    const totalAmount = baseAmount * (Number(item.quantity) || 1) + addonTotal + comboTotal;
    return { baseAmount, addonTotal, comboTotal, totalAmount };
  };

  // NEW: Ported from SalesPage
  const getItemDisplayName = (item) => {
    if (item.is_combo_offer) {
      return `OFFER: ${item.offer_description || item.name || item.item_name}`;
    }
    return `${item.name || item.item_name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`;
  };

  // NEW: Ported from SalesPage
  const getVatByRate = (order) => {
    const byRate = {};
    const rate = (vatRate * 100).toFixed(0);
    const totalVat = calculateTotalVat(order.cartItems);
    byRate[rate] = totalVat;
    return byRate;
  };

  // NEW: Ported from SalesPage
  const hasDeliveryAddress = (order) => {
    if (!order?.deliveryAddress) return false;
    const addr = order.deliveryAddress;
    return !!(addr.building_name || addr.flat_villa_no || addr.country || addr.field1 || addr.field2 || addr.field3);
  };

  // NEW: Ported from SalesPage
  const getPrintDeliveryAddressHtml = (deliveryAddress) => {
    if (!deliveryAddress) return null;
    const lines = [];
    const line1 = [deliveryAddress.flat_villa_no, deliveryAddress.building_name].filter(Boolean).join(', ');
    if (line1) lines.push(line1);
    const line2 = [deliveryAddress.field3, deliveryAddress.field2].filter(Boolean).join(', ');
    if (line2) lines.push(line2);
    const line3 = [deliveryAddress.field1, deliveryAddress.country].filter(Boolean).join(', ');
    if (line3) lines.push(line3);
    return lines.length > 0 ? lines.join('<br>') : null;
  };

  // NEW: generatePrintableContent for receipt (synchronized with SalesPage.jsx)
  const generatePrintableContent = (order) => {
    if (!order) return "";
    const effectivePrintSettings = printSettings || {
      restaurantName: "Restaurant",
      street: "Kyle, calicut",
      city: "680003",
      pincode: "",
      phone: "9891608030",
      gstin: "32AAGCM5345G1Z4",
      thankYouMessage: "Thank You",
      poweredBy: "manoj"
    };

    const subtotal = calculateSubtotal(order.cartItems);
    const vatAmount = calculateTotalVat(order.cartItems);
    const grandTotal = subtotal + vatAmount;
    const formatter = getCurrencyFormatter(null, null, true);

    const formattedDate = new Date(order.timestamp).toLocaleDateString();
    const formattedTime = new Date(order.timestamp).toLocaleTimeString();

    const address = `${effectivePrintSettings.street}${effectivePrintSettings.street ? ', ' : ''}${effectivePrintSettings.city}${effectivePrintSettings.pincode ? `, ${effectivePrintSettings.pincode}` : ''}`;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by manoj";

    const deliveryAddressHtml = getPrintDeliveryAddressHtml(order.deliveryAddress);
    const hasDeliveryAddressFlag = hasDeliveryAddress(order);

    const vatByRate = getVatByRate(order);
    const vatRows = Object.entries(vatByRate).map(([rate, amt]) => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">VAT (${rate}%):</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(amt)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; width: 88mm; font-size: 12px; padding: 10px; color: #000000; box-sizing: border-box; line-height: 1.2;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
          ${logoUrl ? `<div style="flex: 0 0 auto;"><img src="${logoUrl}" alt="Logo" style="width: 30px; height: 30px; object-fit: contain; border-radius: 3px;"/></div>` : ''}
          <div style="flex: 1; text-align: right; font-family: Arial, sans-serif; font-size: 12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #000000;">${effectivePrintSettings.restaurantName}</h3>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;">Phone: ${effectivePrintSettings.phone}</p>
            <p style="margin: 2px 0;">GSTIN: ${effectivePrintSettings.gstin}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="width: 50%; text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Token No</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="width: 50%; text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${order.orderNo || order.orderId}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Customer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${order.customerName || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Phone</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${order.phoneNumber || "N/A"}</td>
            </tr>
            ${order.tableNumber && order.tableNumber !== "N/A"
        ? `<tr><td>Table</td><td>:</td><td style="text-align: right;">${order.tableNumber}</td></tr>`
        : ""
      }
            ${hasDeliveryAddressFlag && deliveryAddressHtml
        ? `
                  <tr>
                    <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; vertical-align: top;">Delivery Address</td>
                    <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
                    <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: pre-line; word-break: break-all;">${deliveryAddressHtml}</td>
                  </tr>
                `
        : ""
      }
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Payment Mode</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${order.paid ? "PAID" : "CASH"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Date</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Time</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Bearer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${user?.email || "N/A"}</td>
            </tr>
          </tbody>
        </table>
        <table style="width: 100%; margin-bottom: 10px; border-collapse: collapse; border: 1px solid #000000; table-layout: fixed;">
          <thead>
            <tr style="border-bottom: 1px dashed #000000;">
              <th style="text-align: left; width: 40%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Item</th>
              <th style="text-align: center; width: 15%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Qty</th>
              <th style="text-align: right; width: 20%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Price</th>
              <th style="text-align: right; width: 25%; padding: 4px 8px; border: none; font-size: 12px; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.cartItems.map((item) => {
        const { baseAmount } = calculateItemPrices(item);
        const displayName = getItemDisplayName(item);
        return `
                <tr>
                  <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px; vertical-align: top;">${displayName}</td>
                  <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount)}</td>
                  <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount * item.quantity)}</td>
                </tr>
                ${item.icePreference === "with_ice" && Number(item.icePrice || 0) > 0
            ? `
                      <tr>
                        <td style="text-align: left; padding: 2px 8px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">+ Ice</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${formatter.format(item.icePrice)}</td>
                        <td style="text-align: right;">${formatter.format(item.icePrice * item.quantity)}</td>
                      </tr>
                    ` : ""
          }
                ${item.isSpicy && Number(item.spicyPrice || 0) > 0
            ? `
                      <tr>
                        <td style="text-align: left; padding: 2px 8px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">+ Spicy</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${formatter.format(item.spicyPrice)}</td>
                        <td style="text-align: right;">${formatter.format(item.spicyPrice * item.quantity)}</td>
                      </tr>
                    ` : ""
          }
                ${Object.entries(item.addonQuantities || {})
            .filter(([_, q]) => q > 0)
            .map(([name, q]) => `
                    <tr>
                      <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">+ Addon: ${name}${item.addonVariants?.[name]?.size ? ` (${item.addonVariants[name].size})` : ""}</td>
                      <td style="text-align: center;">${q}</td>
                      <td style="text-align: right;">${formatter.format(item.addonPrices?.[name] || 0)}</td>
                      <td style="text-align: right;">${formatter.format((item.addonPrices?.[name] || 0) * q)}</td>
                    </tr>
                  `).join("")
          }
                ${Object.entries(item.comboQuantities || {})
            .filter(([_, q]) => q > 0)
            .map(([name, q]) => `
                    <tr>
                      <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">+ Combo: ${name}${item.comboVariants?.[name]?.size ? ` (${item.comboVariants[name].size})` : ""}</td>
                      <td style="text-align: center;">${q}</td>
                      <td style="text-align: right;">${formatter.format(item.comboPrices?.[name] || 0)}</td>
                      <td style="text-align: right;">${formatter.format((item.comboPrices?.[name] || 0) * q)}</td>
                    </tr>
                  `).join("")
          }
                ${item.is_combo_offer && item.comboItems
            ? item.comboItems.map(citem => `
                      <tr>
                        <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">- ${citem.name}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${formatter.format(0)}</td>
                        <td style="text-align: right;">${formatter.format(0)}</td>
                      </tr>
                    `).join("")
            : ""
          }
              `;
      }).join("")}
          </tbody>
        </table>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Total Quantity:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${order.cartItems.reduce((sum, item) => sum + Number(item.quantity), 0)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; font-weight: bold;">Subtotal:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; font-weight: bold;">${formatter.format(subtotal)}</td>
            </tr>
            ${vatRows}
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Total VAT:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(vatAmount)}</td>
            </tr>
            <tr style="font-weight: bold; border-top: 2px solid #000;">
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 14px;">Grand Total:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 14px;">${formatter.format(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 15px;">
          <p style="margin: 2px 0; font-size: 12px;">${thankYouMessage}</p>
          <p style="margin: 2px 0; font-size: 10px;">${poweredBy}</p>
        </div>
      </div>
    `;
  };

  const handlePrint = (order) => {
    const content = generatePrintableContent(order);
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Receipt - Order ${order.orderNo || order.orderId}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0; size: 88mm auto; }
            }
            body { margin: 0; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body onload="window.print(); window.close()">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
  };



  const renderOrderTable = (orders, tableTitle) => {
    const isOnlineDelivery = filterType === "Online Delivery";
    const isDeliveredFilter = filterType === "Delivered";
    return (
      <div className="active-orders-table-wrapper">
        <h2>{tableTitle}</h2>
        {tableTitle === "Completed Orders" && orders.length > 0 && (
          <button className="active-orders-btn active-orders-btn-danger" onClick={handleDeleteAllCompleted}>
            Clear All Completed Orders
          </button>
        )}
        {orders.length > 0 ? (
          <div className="active-orders-table-responsive">
            <table className="active-orders-table active-orders-table-striped active-orders-table-bordered">
              <thead>
                {isOnlineDelivery || isDeliveredFilter ? (
                  <tr>
                    <th>Token No</th>
                    <th>Delivery Address</th>
                    <th>Customer</th>
                    {!(isOnlineDelivery || isDeliveredFilter) && <th>Order Type</th>}
                    <th>Phone</th>
                    <th>Timestamp</th>
                    <th>Total ({getCurrencySymbol()})</th>
                    <th>Grand Total ({getCurrencySymbol()})</th>
                    <th>Payment Status</th>
                    <th>Delivery Person</th>
                    <th>Picked Up Time</th>
                    <th>Items</th>
                    <th>Details</th>
                    <th>{isDeliveredFilter ? "Completed" : "Actions"}</th>
                    <th>Print</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Token No</th>
                    {filterType !== "Take Away" && <th>Table</th>}
                    {filterType !== "Take Away" && <th>Customer</th>}
                    {filterType !== "Take Away" && <th>Order Type</th>}
                    {filterType !== "Take Away" && <th>Phone</th>}
                    {filterType !== "Take Away" && <th>Chairs</th>}
                    {filterType !== "Take Away" && <th>Timestamp</th>}
                    <th>Total ({getCurrencySymbol()})</th>
                    <th>Grand Total ({getCurrencySymbol()})</th>
                    <th>Payment Status</th>
                    <th>Items</th>
                    <th>Details</th>
                    <th>Actions</th>
                    <th>Print</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const isAllPickedUp = checkAllItemsPickedUp(order);
                  const isCompleted = tableTitle === "Completed Orders";
                  const allItemsCompleted = order.cartItems.every((item) => (item.servedQuantity || 0) >= (item.quantity || 1));
                  const canComplete = order.paid && allItemsCompleted;
                  return (
                    <tr key={order.orderId}>
                      <td style={isAllPickedUp ? { color: "green", fontWeight: "bold" } : {}}>
                        {formatTokenNo(order.orderNo || "N/A")}
                      </td>
                      {isOnlineDelivery || isDeliveredFilter ? (
                        <>
                          <td>{formatDeliveryAddress(order.deliveryAddress)}</td>
                          <td>{order.customerName || "Guest"}</td>
                          {!(isOnlineDelivery || isDeliveredFilter) && <td>{normalizeOrderType(order.orderType || inferOrderType(order))}</td>}
                          <td>{order.phoneNumber || "Not provided"}</td>
                          <td>{formatTimestamp(order.timestamp)}</td>
                          <td>{formatPrice(calculateSubtotal(order.cartItems))}</td>
                          <td>{formatPrice(calculateGrandTotal(order.cartItems))}</td>
                          <td>
                            <span className={`payment-status-badge ${order.paid ? "payment-status-paid" : "payment-status-unpaid"}`}>
                              {order.paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td>
                            {order.deliveryPersonId ? (
                              <Link
                                to={`/tripreport?employeeId=${order.deliveryPersonId}&date=${new Date().toISOString().split('T')[0]}`}
                                className="active-orders-link"
                              >
                                {getDeliveryPersonName(order.deliveryPersonId)}
                              </Link>
                            ) : (
                              <select
                                className="active-orders-select"
                                value={order.deliveryPersonId || ""}
                                onChange={(e) => handleAssignDeliveryPerson(order.orderId, e.target.value)}
                              >
                                <option value="">Select Delivery Person</option>
                                {employees.map((employee) => (
                                  <option key={employee.employeeId} value={employee.employeeId}>
                                    {employee.name} (ID: {employee.employeeId})
                                  </option>
                                ))}
                              </select>
                            )}
                            {isDeliveredFilter && order.deliveryPersonId && (
                              <button
                                className="active-orders-btn active-orders-btn-warning active-orders-btn-sm"
                                onClick={() => handleReassignWithSecretKey(order.orderId)}
                                style={{ marginTop: '5px' }}
                              >
                                Re-assign
                              </button>
                            )}
                          </td>
                          <td>{formatTimestamp(order.pickedUpTime)}</td>
                        </>
                      ) : (
                        <>
                          {filterType !== "Take Away" && <td>{order.tableNumber ? `Table ${order.tableNumber} (Floor ${getFloor(order)})` : "N/A"}</td>}
                          {filterType !== "Take Away" && <td>{order.customerName || "Guest"}</td>}
                          {filterType !== "Take Away" && <td>{normalizeOrderType(order.orderType || inferOrderType(order))}</td>}
                          {filterType !== "Take Away" && <td>{order.phoneNumber || "Not provided"}</td>}
                          {filterType !== "Take Away" && <td>{formatChairsBooked(order.chairsBooked)}</td>}
                          {filterType !== "Take Away" && <td>{formatTimestamp(order.timestamp)}</td>}
                          <td>{formatPrice(calculateSubtotal(order.cartItems))}</td>
                          <td>{formatPrice(calculateGrandTotal(order.cartItems))}</td>
                          <td>
                            <span className={`payment-status-badge ${order.paid ? "payment-status-paid" : "payment-status-unpaid"}`}>
                              {order.paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                        </>
                      )}
                      <td>
                        {order.cartItems && order.cartItems.length > 0 ? (
                          <div className="active-orders-items-list-container">
                            {order.cartItems.map((item, itemIndex) => {
                              const itemStatus = getItemStatus(item);
                              const isItemServed = (item.servedQuantity || 0) >= (item.quantity || 1);
                              const mainTick = getPickedUpTick(item, item.kitchen || "Main Kitchen");

                              return (
                                <div key={itemIndex} className="active-orders-item-row-group">
                                  {/* Main Item Line */}
                                  <div className={`active-orders-item-line status-${itemStatus.toLowerCase()}`}>
                                    <span className={`item-name ${itemStatus === 'Prepared' || itemStatus === 'PickedUp' ? 'status-prepared-text' : 'status-pending-text'}`}>
                                      {item.is_combo_offer ? (item.offer_description || item.name || item.item_name) : (item.name || item.item_name)}
                                    </span>
                                    <span className="item-qty">x{item.quantity}</span>
                                    {mainTick}
                                    {!isCompleted && (
                                      <button
                                        className={`active-orders-btn active-orders-btn-sm served-btn-align ${isItemServed ? "active-orders-btn-success" : "active-orders-btn-primary"}`}
                                        onClick={() => handleServiceChange(order.orderId, item.id, !isItemServed)}
                                        disabled={!checkAllItemsPickedUpForItem(item)}
                                      >
                                        {isItemServed ? "Served" : "Serve"}
                                      </button>
                                    )}
                                  </div>

                                  {/* Addons Lines */}
                                  {item.addonQuantities && Object.entries(item.addonQuantities)
                                    .filter(([_, qty]) => qty > 0)
                                    .map(([addonName, qty], addonIdx) => {
                                      const kitchen = item.addonVariants?.[addonName]?.kitchen || "Main Kitchen";
                                      const addonStatus = item.kitchenStatuses?.[kitchen] || "Pending";
                                      const isAddonServed = item.servedAddons?.[addonName] || false;
                                      return (
                                        <div key={`addon-${addonIdx}`} className={`active-orders-item-line sub-item status-${addonStatus.toLowerCase()}`}>
                                          <span className={`item-name ${addonStatus === 'Prepared' || addonStatus === 'PickedUp' ? 'status-prepared-text' : 'status-pending-text'}`}>
                                            + {addonName}
                                          </span>
                                          <span className="item-qty">x{qty}</span>
                                          {getPickedUpTick(item, kitchen)}
                                          {!isCompleted && (
                                            <button
                                              className={`active-orders-btn active-orders-btn-sm served-btn-align ${isAddonServed ? "active-orders-btn-success" : "active-orders-btn-primary"}`}
                                              onClick={() => handleSubItemServiceChange(order.orderId, item.id, 'addon', addonName, !isAddonServed)}
                                              disabled={item.kitchenStatuses?.[kitchen] !== "PickedUp"}
                                            >
                                              {isAddonServed ? "Served" : "Serve"}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}

                                  {/* Combos Lines (for regular items) */}
                                  {item.comboQuantities && Object.entries(item.comboQuantities)
                                    .filter(([_, qty]) => qty > 0)
                                    .map(([comboName, qty], comboIdx) => {
                                      const kitchen = item.comboVariants?.[comboName]?.kitchen || "Main Kitchen";
                                      const comboStatus = item.kitchenStatuses?.[kitchen] || "Pending";
                                      const isComboServed = item.servedCombos?.[comboName] || false;
                                      return (
                                        <div key={`combo-${comboIdx}`} className={`active-orders-item-line sub-item status-${comboStatus.toLowerCase()}`}>
                                          <span className={`item-name ${comboStatus === 'Prepared' || comboStatus === 'PickedUp' ? 'status-prepared-text' : 'status-pending-text'}`}>
                                            + {comboName}
                                          </span>
                                          <span className="item-qty">x{qty}</span>
                                          {getPickedUpTick(item, kitchen)}
                                          {!isCompleted && (
                                            <button
                                              className={`active-orders-btn active-orders-btn-sm served-btn-align ${isComboServed ? "active-orders-btn-success" : "active-orders-btn-primary"}`}
                                              onClick={() => handleSubItemServiceChange(order.orderId, item.id, 'combo', comboName, !isComboServed)}
                                              disabled={item.kitchenStatuses?.[kitchen] !== "PickedUp"}
                                            >
                                              {isComboServed ? "Served" : "Serve"}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}

                                  {/* Combo Offer Sub-Items (for combo offers) */}
                                  {item.is_combo_offer && item.comboItems && item.comboItems.map((citem, cIdx) => {
                                    const kitchen = citem.kitchen || "Main Kitchen";
                                    const cStatus = item.kitchenStatuses?.[kitchen] || "Pending";
                                    const isCItemServed = item.servedComboItems?.[citem.name] || false;
                                    return (
                                      <div key={`citem-${cIdx}`} className={`active-orders-item-line sub-item status-${cStatus.toLowerCase()}`}>
                                        <span className={`item-name ${cStatus === 'Prepared' || cStatus === 'PickedUp' ? 'status-prepared-text' : 'status-pending-text'}`}>
                                          - {citem.name}
                                        </span>
                                        <span className="item-qty">x{item.quantity}</span>
                                        {getPickedUpTick(item, kitchen)}
                                        {!isCompleted && (
                                          <button
                                            className={`active-orders-btn active-orders-btn-sm served-btn-align ${isCItemServed ? "active-orders-btn-success" : "active-orders-btn-primary"}`}
                                            onClick={() => handleSubItemServiceChange(order.orderId, item.id, 'comboItem', citem.name, !isCItemServed)}
                                            disabled={item.kitchenStatuses?.[kitchen] !== "PickedUp"}
                                          >
                                            {isCItemServed ? "Served" : "Serve"}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div>No items</div>
                        )}
                      </td>
                      <td>
                        {order.cartItems && order.cartItems.length > 0 ? (
                          <div className="active-orders-details-btn-container">
                            {order.cartItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="details-btn-group">
                                <button
                                  className="active-orders-btn active-orders-btn-info active-orders-btn-sm"
                                  onClick={() => {
                                    // Normalize item data for details popup to ensure prices show correctly
                                    const normalizedItem = {
                                      ...item,
                                      // FIXED: Fallbacks for variant prices - infer if missing but flag is true
                                      icePrice: Number(item.icePrice) || Number(item.ice_price) || (item.icePreference === 'with_ice' ? 0 : 0),
                                      spicyPrice: Number(item.spicyPrice) || Number(item.spicy_price) || (item.isSpicy ? 30 : 0),
                                      addonPrices: item.addonPrices || (item.addons || []).reduce((acc, a) => ({ ...acc, [a.name1]: a.addon_price || 0 }), {}),
                                      comboPrices: item.comboPrices || (item.selectedCombos || []).reduce((acc, c) => ({ ...acc, [c.name1]: c.combo_price || 0 }), {}),
                                      addonVariants: item.addonVariants || (item.addons || []).reduce((acc, a) => ({ ...acc, [a.name1]: { size: a.size, kitchen: a.kitchen } }), {}),
                                      comboVariants: item.comboVariants || (item.selectedCombos || []).reduce((acc, c) => ({ ...acc, [c.name1]: { size: c.size, kitchen: c.kitchen } }), {}),
                                    };
                                    setDetailsData(normalizedItem);
                                    setShowDetailsPopup(true);
                                  }}
                                  style={{ marginBottom: '0px', display: 'block', width: '100%' }}
                                >
                                  Details
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>

                      <td>
                        {isDeliveredFilter ? (
                          <button
                            className="active-orders-btn active-orders-btn-success active-orders-btn-sm"
                            onClick={() => handleMarkDelivered(order.orderId)}
                            style={{ width: '100%' }}
                          >
                            <FaCheck /> Online Delivery Completed
                          </button>
                        ) : (
                          <>
                            <button className="active-orders-btn active-orders-btn-primary active-orders-btn-sm" onClick={() => handleSelectOrder(order)}>
                              Select
                            </button>
                            <button
                              className="active-orders-btn active-orders-btn-danger active-orders-btn-sm"
                              onClick={() => handleDeleteOrder(order.orderId, order.tableNumber, order.orderNo)}
                            >
                              Delete Order
                            </button>
                          </>
                        )}
                      </td>
                      <td>
                        <button className="active-orders-btn active-orders-btn-primary active-orders-btn-sm" onClick={() => handlePrint(order)}>
                          <FaPrint /> Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div >
        ) : (
          <div className="active-orders-text-center">
            <p>No {tableTitle.toLowerCase()} orders found.</p>
          </div>
        )
        }
      </div >
    );
  };

  function checkAllItemsPickedUpForItem(item) {
    if (!item.kitchenStatuses) return false;
    return Object.values(item.kitchenStatuses).every((status) => status === "PickedUp");
  }

  return (
    <div className="active-orders-container">
      {warningMessage && (
        <div
          className={`active-orders-alert active-orders-alert-${warningType === "success" ? "success" : "warning"
            }`}
        >
          {warningMessage}
          {isConfirmation ? (
            <div className="active-orders-alert-buttons">
              <button className="active-orders-btn active-orders-btn-success" onClick={handleConfirmYes}>
                Yes
              </button>
              <button className="active-orders-btn active-orders-btn-danger" onClick={handleConfirmNo}>
                No
              </button>
            </div>
          ) : (
            <button className="active-orders-btn active-orders-btn-primary" onClick={handleWarningOk}>
              OK
            </button>
          )}
        </div>
      )}
      {showDeliveryPopup && (
        <div className="active-orders-modal-overlay">
          <div className="active-orders-modal-content">
            <p>Assign {getDeliveryPersonName(selectedDeliveryPersonId)} to the order?</p>
            <div>
              <button className="active-orders-btn active-orders-btn-success" onClick={confirmDeliveryAssignment}>
                Confirm
              </button>
              <button className="active-orders-btn active-orders-btn-danger" onClick={cancelDeliveryPopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showReassignPopup && (
        <div className="active-orders-modal-overlay">
          <div className="active-orders-modal-content">
            <p>Enter new delivery person's secret key:</p>
            <input
              type="text"
              value={secretKeyInput}
              onChange={(e) => setSecretKeyInput(e.target.value)}
              placeholder="Enter Secret Key"
              style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
            />
            <div>
              <button className="active-orders-btn active-orders-btn-success" onClick={confirmReassign}>
                Re-assign
              </button>
              <button className="active-orders-btn active-orders-btn-danger" onClick={cancelReassignPopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="active-orders-header">
        <FaArrowLeft
          className="active-orders-back-button"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && handleBack()}
        />
        <h1>Active Orders</h1>
        <button className="active-orders-btn active-orders-btn-primary active-orders-refresh-btn" onClick={handleRefresh}>
          <FaSyncAlt style={{ marginRight: "5px" }} />
          Refresh
        </button>
      </div>
      <div className="active-orders-filter-buttons">
        {isFeatureEnabled("Dine In") && (
          <button
            className={`active-orders-btn ${filterType === "Dine In" ? "active-orders-btn-success" : "active-orders-btn-primary"
              }`}
            onClick={() => setFilterType("Dine In")}
          >
            Dine In ({orderCounts["Dine In"]})
          </button>
        )}
        {isFeatureEnabled("Take Away") && (
          <button
            className={`active-orders-btn ${filterType === "Take Away" ? "active-orders-btn-success" : "active-orders-btn-primary"
              }`}
            onClick={() => setFilterType("Take Away")}
          >
            Take Away ({orderCounts["Take Away"]})
          </button>
        )}
        {isFeatureEnabled("Online Delivery") && (
          <button
            className={`active-orders-btn ${filterType === "Online Delivery" ? "active-orders-btn-success" : "active-orders-btn-primary"
              }`}
            onClick={() => setFilterType("Online Delivery")}
          >
            Online Delivery ({orderCounts["Online Delivery"]})
          </button>
        )}
        {(isFeatureEnabled("Online Delivery") || Object.keys(workflowSettings).length === 0) && (
          <button
            className={`active-orders-btn ${filterType === "Delivered" ? "active-orders-btn-success" : "active-orders-btn-primary"
              }`}
            onClick={() => setFilterType("Delivered")}
          >
            Online Delivery Completed ({orderCounts["Delivered"]})
          </button>
        )}
      </div>
      {renderOrderTable(unservedFiltered, "Unserved Orders")}
      {renderOrderTable(completedFiltered, "Completed Orders")}
      {showDetailsPopup && detailsData && (
        <div className="active-orders-details-modal">
          <div className="active-orders-details-modal-content">
            <span className="close-btn" onClick={() => setShowDetailsPopup(false)}>&times;</span>
            <h2>Item Details</h2>
            <div className="details-modal-body">
              <p><strong>Name:</strong> {detailsData.is_combo_offer ? (detailsData.offer_description || detailsData.name) : detailsData.name}</p>
              <p><strong>Size:</strong> {detailsData.selectedSize || "M"}</p>
              <p><strong>Kitchen:</strong> {detailsData.kitchen || "Main Kitchen"}</p>
              <p><strong>Ice Preference:</strong> {detailsData.icePreference || "without_ice"} (Price: {formatPrice(detailsData.icePrice || detailsData.ice_price || 0)})</p>
              <p>
                <strong>Spicy:</strong>{' '}
                {detailsData.isSpicy ? (
                  <span>
                    Yes (Price: {formatPrice(detailsData.spicyPrice || detailsData.spicy_price || 0)})
                  </span>
                ) : "No"}
              </p>
              <p><strong>Sugar Level:</strong> {detailsData.sugarLevel || "medium"}</p>

              {detailsData.addonQuantities && Object.keys(detailsData.addonQuantities).length > 0 && (
                <div className="details-sub-section">
                  <h3>Addons</h3>
                  {Object.entries(detailsData.addonQuantities).map(([name, qty], idx) => {
                    const addon = detailsData.addonVariants?.[name] || {};
                    const price = detailsData.addonPrices?.[name] || 0;
                    return (
                      <p key={idx}>+ {name} (Qty: {qty}, Size: {addon.size || "M"}, Kitchen: {addon.kitchen || "Main Kitchen"}, Price: {formatPrice(price)})</p>
                    );
                  })}
                </div>
              )}

              {detailsData.comboQuantities && Object.keys(detailsData.comboQuantities).length > 0 && (
                <div className="details-sub-section">
                  <h3>Combos</h3>
                  {Object.entries(detailsData.comboQuantities).map(([name, qty], idx) => {
                    const combo = detailsData.comboVariants?.[name] || {};
                    const price = detailsData.comboPrices?.[name] || 0;
                    return (
                      <p key={idx}>+ {name} (Qty: {qty}, Size: {combo.size || "M"}, Kitchen: {combo.kitchen || "Main Kitchen"}, Price: {formatPrice(price)})</p>
                    );
                  })}
                </div>
              )}

              {detailsData.is_combo_offer && detailsData.comboItems && (
                <div className="details-sub-section">
                  <h3>Combo Offer Items</h3>
                  {detailsData.comboItems.map((citem, idx) => (
                    <p key={idx}>- {citem.name} (Kitchen: {citem.kitchen || "Main Kitchen"})</p>
                  ))}
                </div>
              )}

              {detailsData.customVariantsDetails && Object.keys(detailsData.customVariantsDetails).length > 0 && (
                <div className="details-sub-section">
                  <h3>Custom Variants</h3>
                  {Object.entries(detailsData.customVariantsDetails).map(([name, details], idx) => (
                    <p key={idx}>+ {name} (Heading: {details.heading}, Price: {formatPrice(details.price || 0)})</p>
                  ))}
                </div>
              )}

              <div className="details-sub-section">
                <h3>Ingredients</h3>
                {renderIngredients(detailsData.ingredients)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveOrders;
