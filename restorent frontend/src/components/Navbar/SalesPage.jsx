import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import {
  Container,
  Table,
  Card,
  Row,
  Col,
  Spinner,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./salespage.css";
import { useNavigate } from "react-router-dom";
import {
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaTrash,
  FaWhatsapp,
} from "react-icons/fa";
import { UserContext } from "../../Context/UserContext";
import CurrencySymbol, { resolveCurrencyCode } from "../CurrencySymbol";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaPrint as FaPrintIcon, FaEnvelope, FaFilePdf as FaPdfIcon, FaFileExcel as FaExcelIcon, FaPalette } from "react-icons/fa";

const isElectron = false;
const ipcRenderer = null;

const defaultPrintSettings = {
  restaurantName: "Restaurant",
  street: "Kyle, calicut",
  city: "680003",
  pincode: "",
  phone: "9891608030",
  gstin: "32AAGCM5345G1Z4",
  thankYouMessage: "Thank You",
  poweredBy: "manoj"
};

// Reusable Multi-select Checkbox Dropdown Component (Moved outside to prevent re-mounting)
const CheckboxDropdown = ({ label, options, selectedValues, onToggle, placeholder, searchPlaceholder, showSearch = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    if (!opt) return false;
    const lbl = typeof opt === 'object' ? (opt.label || opt.name || "") : opt;
    return String(lbl).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="filter-item checkbox-dropdown-container" ref={dropdownRef}>
      <Form.Label className="fw-bold">{label}</Form.Label>
      <div className={`checkbox-dropdown-header ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)} style={{ border: '1px solid #3498db' }}>
        <div className="selected-labels-container">
          {selectedValues.length > 0 ? (
            <span className="summary-text">{selectedValues.length} Selected</span>
          ) : <span className="placeholder-text">{placeholder}</span>}
        </div>
        <span className="dropdown-arrow">▼</span>
      </div>
      {isOpen && (
        <div className="checkbox-dropdown-menu shadow-lg">
          {showSearch && (
            <div className="p-2 border-bottom">
              <Form.Control
                size="sm"
                type="text"
                placeholder={searchPlaceholder || "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                if (!option) return null;
                const val = (typeof option === 'object' && option !== null) ? (option.value !== undefined ? option.value : option) : option;
                const lbl = (typeof option === 'object' && option !== null) ? (option.label !== undefined ? option.label : (option.name || option)) : option;
                const isChecked = selectedValues.includes(val);
                return (
                  <div key={idx} className={`option-item ${isChecked ? 'selected' : ''}`} onClick={() => onToggle(val)}>
                    <Form.Check
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      label={lbl}
                    />
                  </div>
                );
              })
            ) : <div className="p-2 text-center text-muted">No options found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const SalesPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterItems, setFilterItems] = useState([]); // Changed to array
  const [filterCategories, setFilterCategories] = useState([]); // Changed to array
  const [filterDeliveryPersons, setFilterDeliveryPersons] = useState([]); // Changed to array
  const [itemOptions, setItemOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [deliveryPersonOptions, setDeliveryPersonOptions] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [filterOrderTypes, setFilterOrderTypes] = useState([]); // Changed to array
  const [filterOffers, setFilterOffers] = useState([]); // Changed to array
  const [offerOptions, setOfferOptions] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [dynamicFilters, setDynamicFilters] = useState({}); // {designationName: [selectedUserIds]}
  const navigate = useNavigate();
  const [printSettings, setPrintSettings] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [permsLoading, setPermsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [filterBranches, setFilterBranches] = useState([]);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showNoDataModal, setShowNoDataModal] = useState(false);

  const [settings, setSettings] = useState({
    currency: 'INR',
    currencyPrecision: 2,
    language: 'en-IN',
    dateFormat: 'yyyy-long-mm-dd',
    timeFormat: 'HH:mm:ss',
    timeZone: 'Asia/Dubai',
    useCurrencySymbol: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  // Removed phoneNumber from default columns
  const [columnOrder, setColumnOrder] = useState([
    { key: "invoice_no", label: "Invoice No", align: "left" },
    { key: "tableNumber", label: "Table", align: "center" },
    { key: "orderNo", label: "Token No", align: "center" },
    { key: "date", label: "Date", align: "center" },
    { key: "time", label: "Time", align: "center" },
    { key: "orderType", label: "Order Type", align: "center" },
    { key: "total", label: "Total", align: "right" },
    { key: "vat_amount", label: "VAT Amount", align: "right" },
    { key: "grand_total", label: "Grand Total", align: "right" },
    { key: "paymentReceived", label: "Payment Received", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(0);
  // Color coding state
  const [colorModeEnabled, setColorModeEnabled] = useState(false);

  const possibleColumns = [
    { key: "invoice_no", label: "Invoice No", align: "left" },
    { key: "tableNumber", label: "Table", align: "center" },
    { key: "orderNo", label: "Token No", align: "center" },
    { key: "customer", label: "Customer", align: "left" },
    { key: "date", label: "Date", align: "center" },
    { key: "time", label: "Time", align: "center" },
    { key: "phoneNumber", label: "Phone Number", align: "center" },
    { key: "whatsappNumber", label: "WhatsApp Number", align: "center" },
    { key: "email", label: "Email", align: "left" },
    { key: "tableNumber", label: "Table Number", align: "center" },
    { key: "chairsBooked", label: "Chairs Booked", align: "center" },
    { key: "deliveryAddress", label: "Delivery Address", align: "left" },
    { key: "orderType", label: "Order Type", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "orderNo", label: "Token No", align: "center" },
    { key: "deliveryPersonName", label: "Delivery Person", align: "left" },
    { key: "userId", label: "User ID", align: "left" },
    { key: "payments_mode", label: "Payment Mode", align: "center" },
    { key: "due_date", label: "Due Date", align: "center" },
    { key: "total", label: "Total", align: "right" },
    { key: "vat_amount", label: "VAT Amount", align: "right" },
    { key: "grand_total", label: "Grand Total", align: "right" },
    { key: "branch_name", label: "Branch", align: "left" },
    { key: "paymentReceived", label: "Payment Received", align: "center" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  const extractOfferOptions = (sales) => {
    const offers = [];
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.is_combo_offer && item.offer_description) {
          offers.push(item.offer_description);
        }
      });
    });
    const uniqueOffers = [...new Set(offers)].sort();
    setOfferOptions(uniqueOffers);
  };

  const extractDeliveryPersonOptions = (sales) => {
    const persons = [...new Set(sales.map((sale) => sale.deliveryPersonName).filter(Boolean))].sort();
    setDeliveryPersonOptions(persons);
  };

  useEffect(() => {
    if (configLoading) return;

    const initData = async () => {
      setLoading(true);
      setPermsLoading(true);
      setError(null);

      try {
        let hasReadPermission = false;
        let userObj = null;
        let userRole = null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            userObj = JSON.parse(userStr);
            userRole = userObj.role;
            if (userRole) {
              const API_URL = baseUrl || "";
              const lowRole = userRole?.toLowerCase().replace(/[\s_]+/g, '');
              const isGroup = lowRole === 'superadmin' || lowRole === 'groupadmin' || lowRole === 'tenantadmin';
              const isComp = (lowRole === 'companyadmin' || lowRole === 'admin') && !userObj.branch && !userObj.branch_name;

              setIsGroupAdmin(isGroup);
              setIsCompanyAdmin(isComp);
              const response = await axios.get(`${API_URL}/api/role-permissions?role=${userRole}`);
              const perms = response.data.permissions || [];
              const pagePerm = perms.find(p => p.pageId === 'sales_report') || perms.find(p => p.pageId === 'pos');
              if (pagePerm) {
                setCanRead(pagePerm.canRead === true);
                setCanWrite(pagePerm.canWrite === true);
                setCanDelete(pagePerm.canDelete === true);
                setCanCreate(pagePerm.canCreate === true);
                hasReadPermission = pagePerm.canRead === true;
              }
            }
          } catch (e) {
            console.error("Error parsing user or fetching perms", e);
          }
        }

        if (hasReadPermission) {
          const API_URL = baseUrl || "";
          const endpoints = [
            { key: 'settings', url: `${API_URL}/api/settings` },
            { key: 'print', url: `${API_URL}/api/print_settings/active` },
            { key: 'logo', url: `${API_URL}/api/logo` },
            {
              key: 'sales',
              url: `${API_URL}/api/sales`,
              headers: getHeaders()
            },
            { key: 'items', url: `${API_URL}/api/items` },
            { key: 'users', url: `${API_URL}/api/users` }, { key: 'designations', url: `${API_URL}/api/employee-designations` },
            { key: 'employees', url: `${API_URL}/api/add-employee` },
            {
              key: 'branches',
              url: `${API_URL}/api/branches`,
              headers: userObj?.company ? { 'X-Company-Name': userObj.company } : {}
            }
          ];

          const results = await Promise.allSettled(
            endpoints.map(ep => axios.get(ep.url, { headers: ep.headers || {} }))
          );

          const data = {};
          results.forEach((result, index) => {
            const key = endpoints[index].key;
            if (result.status === 'fulfilled') {
              data[key] = result.value.data;
            } else {
              console.warn(`Failed to fetch ${key}:`, result.reason?.message || result.reason);
            }
          });

          let fetchedSettings = { ...settings };
          if (data.settings) {
            fetchedSettings = {
              ...fetchedSettings,
              ...data.settings,
              currency: data.settings.currency || 'INR',
              currencyPrecision: parseInt(data.settings.currencyPrecision) || 2,
              language: data.settings.language || 'en-IN',
            };
            setSettings(fetchedSettings);
            localStorage.setItem('systemSettings', JSON.stringify(data.settings));
          }

          if (data.print) {
            setPrintSettings(data.print);
          } else {
            setPrintSettings(defaultPrintSettings);
          }

          if (data.logo && data.logo.logo) {
            setLogoUrl(API_URL + data.logo.logo);
          }

          if (data.sales) {
            const cleaned = cleanData(data.sales, fetchedSettings);
            setSalesData(cleaned);
            if (cleaned.length === 0) {
              setShowNoDataModal(true);
            }
          } else {
            console.error("Critical: Sales data failed to load");
            const salesResult = results.find((r, i) => endpoints[i].key === 'sales');
            if (salesResult?.reason?.response?.status === 404) {
              setError("Error: Sales endpoint not found (404). Please check backend connection.");
            } else {
              setError("Error fetching sales data: " + (salesResult?.reason?.message || "Unknown error"));
            }
          }

          if (data.items && Array.isArray(data.items)) {
            const items = data.items.map((item) => ({
              name: item.item_name,
              type: "Item",
              category: item.item_group || "N/A",
            }));
            const addons = data.items.flatMap(i => i.addons || []).map(a => ({ name: a.name1 || "", type: "Addon" }));
            const combos = data.items.flatMap(i => i.combos || []).map(c => ({ name: c.name1 || "", type: "Combo" }));
            const all = [...items, ...addons, ...combos];
            const unique = Array.from(new Map(all.map(o => [o.name, o])).values());
            setItemOptions(unique);

            const cats = [...new Set(data.items.map(i => i.item_group))].filter(Boolean);
            setCategoryOptions(cats);
          }

          if (data.designations && Array.isArray(data.designations)) {
            const filterDesignations = data.designations.filter(d => d.show_in_sales_filter);
            setDesignations(filterDesignations);

            // Initialize dynamic filters state if not already set
            setDynamicFilters(prev => {
              const newState = { ...prev };
              filterDesignations.forEach(d => {
                if (!newState[d.name]) newState[d.name] = [];
              });
              return newState;
            });
          }

          if (data.employees && Array.isArray(data.employees)) {
            setAllEmployees(data.employees);
          }

          if (data.branches && Array.isArray(data.branches)) {
            setBranches(data.branches.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)));
          }

          const uRole = userRole?.toLowerCase().replace(/[\s_]+/g, '');
          const isGrp = uRole === 'superadmin' || uRole === 'groupadmin' || uRole === 'tenantadmin';
          
          if (isGrp) {
            try {
              const compRes = await axios.get(`${API_URL}/api/user-companies`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              });
              const comps = compRes.data.companies || (Array.isArray(compRes.data) ? compRes.data : []);
              const allComps = [...new Set(comps.map(c => c.company_name || c.company).filter(Boolean))].sort();
              setAvailableCompanies(allComps);
            } catch (err) {
              console.error("Failed to fetch companies:", err);
            }
          }
        }
      } catch (err) {
        console.error("Init Error", err);
        setError("Error fetching data: " + err.message);
      } finally {
        setLoading(false);
        setPermsLoading(false);
      }
    };

    initData();
  }, [baseUrl, configLoading]);

  useEffect(() => {
    if (salesData.length > 0) {
      extractOfferOptions(salesData);
      extractDeliveryPersonOptions(salesData);
    }
  }, [salesData]);

  // RE-FETCH Sales data when company/branch filters change (interactive filtering)
  useEffect(() => {
    if (configLoading || permsLoading || !canRead) return;

    const fetchFilteredSales = async () => {
      try {
        const API_URL = baseUrl || "";
        // Pass selected company/branch directly into getHeaders so they take priority
        const selectedComp = selectedCompanies.length > 0 ? selectedCompanies.join(',') : null;
        const selectedBranch = filterBranches.length > 0 ? filterBranches.join(',') : null;
        const headers = getHeaders(selectedBranch, selectedComp);

        const response = await axios.get(`${API_URL}/api/sales`, { headers });
        const cleaned = cleanData(response.data);
        setSalesData(cleaned);
      } catch (err) {
        console.error("Error re-fetching sales:", err);
      }
    };

    fetchFilteredSales();
  }, [selectedCompanies, filterBranches, baseUrl, canRead, permsLoading]);

  // RE-FETCH Branches when selected companies change
  useEffect(() => {
    if (!isGroupAdmin || selectedCompanies.length === 0) return;

    const fetchBranchesForCompanies = async () => {
      try {
        const API_URL = baseUrl || "";
        const headers = { 'X-Company-Name': selectedCompanies.join(',') };
        const response = await axios.get(`${API_URL}/api/branches`, { headers });
        setBranches(response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)));
      } catch (err) {
        console.error("Error fetching branches for companies:", err);
      }
    };

    fetchBranchesForCompanies();
  }, [selectedCompanies, baseUrl, isGroupAdmin]);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const API_URL = baseUrl || '';
      if (API_URL) {
        const fetchSettings = async () => {
          try {
            const response = await axios.get(`${API_URL}/api/settings`);
            if (response.data) {
              setSettings((prevSettings) => ({
                ...prevSettings,
                ...response.data,
                currency: response.data.currency || prevSettings.currency || 'INR',
                currencyPrecision: parseInt(response.data.currencyPrecision) || 2,
                language: response.data.language || 'en-IN',
                dateFormat: response.data.dateFormat || 'yyyy-long-mm-dd',
                timeFormat: response.data.timeFormat || 'HH:mm:ss',
                timeZone: response.data.timeZone || 'Asia/Dubai',
                useCurrencySymbol: response.data.useCurrencySymbol || false,
              }));
              localStorage.setItem('systemSettings', JSON.stringify(response.data));
            }
          } catch (err) {
            console.error('Error fetching settings:', err);
            const stored = localStorage.getItem('systemSettings');
            if (stored) {
              const parsed = JSON.parse(stored);
              setSettings((prevSettings) => ({
                ...prevSettings,
                ...parsed,
                currency: parsed.currency || prevSettings.currency || 'INR',
                currencyPrecision: parseInt(parsed.currencyPrecision) || 2,
                language: parsed.language || 'en-IN',
                dateFormat: parsed.dateFormat || 'yyyy-long-mm-dd',
                timeFormat: parsed.timeFormat || 'HH:mm:ss',
                timeZone: parsed.timeZone || 'Asia/Dubai',
              }));
            }
          }
        };
        fetchSettings();
      } else {
        const stored = localStorage.getItem('systemSettings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...parsed,
            currency: parsed.currency || 'INR',
            currencyPrecision: parseInt(parsed.currencyPrecision) || 2,
            language: parsed.language || 'en-IN',
            dateFormat: parsed.dateFormat || 'yyyy-long-mm-dd',
            timeFormat: parsed.timeFormat || 'HH:mm:ss',
            timeZone: parsed.timeZone || 'Asia/Dubai',
            useCurrencySymbol: parsed.useCurrencySymbol || false,
          }));
        }
      }
    };
    const interval = setInterval(handleSettingsUpdate, 5000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  const addColumn = () => {
    const fieldKey = selectedFieldToAdd;
    if (!fieldKey) return;
    const field = possibleColumns.find(p => p.key === fieldKey);
    if (!field || columnOrder.some(c => c.key === field.key)) return;
    const pos = parseInt(selectedPosition);
    const newOrder = [...columnOrder];
    newOrder.splice(pos, 0, field);
    setColumnOrder(newOrder);
    setSelectedFieldToAdd('');
    setSelectedPosition(0);
    setWarningMessage(`Column "${field.label}" added successfully.`);
    setWarningType("success");
  };

  const removeColumn = (index) => {
    const newOrder = [...columnOrder];
    const removed = newOrder.splice(index, 1)[0];
    if (removed && removed.key === "actions") {
      newOrder.push(removed);
    }
    setColumnOrder(newOrder);
    setWarningMessage(`Column "${removed.label}" removed successfully.`);
    setWarningType("warning");
  };

  const getCurrencySymbol = (currCode) => {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'SAR': '﷼',
      'KWD': 'د.ك',
      'OMR': 'ر.ع.',
      'BHD': 'د.ب.',
      'QAR': 'ر.ق',
      'JPY': '¥',
      'CNY': '¥',
      'SGD': '$',
      'MYR': 'RM',
      'THB': '฿',
      'IDR': 'Rp',
      'KRW': '₩',
      'PHP': '₱',
      'CAD': '$',
      'AUD': '$',
      'NZD': '$',
      'CHF': 'CHF',
      'ZAR': 'R',
      'BRL': 'R$',
      'PKR': '₨',
      'LKR': 'Rs',
      'NGN': '₦'
    };
    return symbols[currCode?.toUpperCase()] || symbols['INR'];
  };

  const getCurrencyFormatter = React.useCallback((invoiceCurrency = null, invoicePrecision = null, asHtml = false, asReact = false) => {
    // Resolve currency: per-invoice currency first, then active company/branch context
    const activeComp = selectedCompanies.length === 1 ? selectedCompanies[0] : (selectedCompanies.length > 1 ? 'All' : localStorage.getItem('active_company') || '');
    const activeBranch = filterBranches.length === 1 ? filterBranches[0] : localStorage.getItem('active_branch') || '';
    const currency = invoiceCurrency || resolveCurrencyCode(null, activeComp, activeBranch);
    const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : parseInt(settings.currencyPrecision) || 2;

    return {
      format: (value) => {
        if (value === null || value === undefined) return '';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '';

        const fixedValue = numValue.toFixed(precision);

        if (asReact) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ marginRight: '2px', transform: 'translateY(1px)' }}>
                <CurrencySymbol currencyCode={currency} size={14} />
              </span>
              {fixedValue}
            </span>
          );
        } else if (asHtml) {
          if (currency?.toUpperCase() === 'AED') {
            return `<img src="/assets/Dirham Currency Symbol - Black.svg" style="height: 12px; vertical-align: middle; margin-right: 2px; filter: brightness(0.1);" alt="AED"/> ${fixedValue}`;
          } else {
            const symbols = {
              INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
              SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
              QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
              CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
            };
            const sym = symbols[currency?.toUpperCase()] || currency;
            return `${sym} ${fixedValue}`;
          }
        } else {
          const symbols = {
            INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥",
            SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
            QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
            CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
          };
          const sym = symbols[currency?.toUpperCase()] || currency;
          return `${sym} ${fixedValue}`;
        }
      }
    };
  }, [settings.currencyPrecision, selectedCompanies, filterBranches]);

  const getFormattedDate = (dateInput, dateFormat = settings.dateFormat, timeZone = settings.timeZone) => {
    if (!dateInput) return '';
    let date;
    if (dateInput instanceof Date) { date = dateInput; }
    else if (typeof dateInput === 'string') {
      if (dateInput.includes('T')) {
        date = new Date(dateInput);
      } else {
        const parts = dateInput.split(/[-/]/);
        let year, month, day;
        if (parts[0].length === 4) {
          year = parts[0]; month = parts[1]; day = parts[2];
        } else {
          year = parts[2]; month = parts[1]; day = parts[0];
        }
        // Direct string formatting to avoid timezone offset shifts
        switch (dateFormat) {
          case 'dd-mm-yyyy': return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
          case 'mm-dd-yyyy': return `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${year}`;
          case 'yyyy-mm-dd': return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          case 'dd/mm/yyyy': return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          case 'mm/dd/yyyy': return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
          case 'yyyy/mm/dd': return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
          default: return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
        }
      }
    }
    else { return dateInput || ''; }
    if (isNaN(date.getTime())) return dateInput || '';

    const tzOptions = { timeZone: timeZone || 'UTC' };
    const numericFormatter = new Intl.DateTimeFormat('en', { ...tzOptions, year: 'numeric', month: '2-digit', day: 'numeric' });
    const parts = numericFormatter.formatToParts(date);
    const yearStr = parts.find((p) => p.type === 'year')?.value || '';
    const monthStr = parts.find((p) => p.type === 'month')?.value || '';
    const dayStr = parts.find((p) => p.type === 'day')?.value || '';

    switch (dateFormat) {
      case 'dd-mm-yyyy': return `${dayStr.padStart(2, '0')}-${monthStr}-${yearStr}`;
      case 'mm-dd-yyyy': return `${monthStr}-${dayStr.padStart(2, '0')}-${yearStr}`;
      case 'yyyy-mm-dd': return `${yearStr}-${monthStr}-${dayStr.padStart(2, '0')}`;
      case 'dd/mm/yyyy': return `${dayStr.padStart(2, '0')}/${monthStr}/${yearStr}`;
      case 'mm/dd/yyyy': return `${monthStr}/${dayStr.padStart(2, '0')}/${yearStr}`;
      case 'yyyy/mm/dd': return `${yearStr}/${monthStr}/${dayStr.padStart(2, '0')}`;
      case 'yyyy-long-mm-dd':
        return `${yearStr}-${date.toLocaleString('en', { month: 'long', timeZone: tzOptions.timeZone })}-${dayStr.padStart(2, '0')}`;
      default: return `${dayStr.padStart(2, '0')}-${monthStr}-${yearStr}`;
    }
  };

  const getFormattedTime = (timeInput, timeFormat = settings.timeFormat, timeZone = settings.timeZone) => {
    if (!timeInput) return '';
    let date;
    if (timeInput instanceof Date) {
      date = timeInput;
    } else if (typeof timeInput === 'string') {
      if (timeInput.includes('T')) {
        date = new Date(timeInput);
      } else {
        const [timePart, period] = timeInput.trim().split(' ');
        let [hours, minutes, seconds = '00'] = timePart.split(':').map(x => parseInt(x, 10) || 0);
        if (period && (period.toUpperCase() === 'PM' && hours !== 12)) hours += 12;
        else if (period && (period.toUpperCase() === 'AM' && hours === 12)) hours = 0;

        date = new Date(2023, 0, 1, hours, minutes, seconds);
      }
    } else {
      return timeInput || '';
    }
    if (isNaN(date.getTime())) return timeInput || '';
    const hasSeconds = timeFormat.includes(':ss') || timeFormat.includes('ss');
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(hasSeconds && { second: '2-digit' }),
      hour12: is12Hour,
      ...(timeInput instanceof Date || (typeof timeInput === 'string' && timeInput.includes('T'))) && { timeZone: timeZone || 'UTC' }
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const getEmployeeName = (userId) => {
    if (!userId || userId === "N/A") return "N/A";
    const employee = (allEmployees || []).find(emp =>
      String(emp.userId) === String(userId) ||
      String(emp.email) === String(userId) ||
      String(emp.username) === String(userId)
    );
    return employee ? (employee.name || employee.firstName || userId) : userId;
  };

  const formatDeliveryAddress = (deliveryAddress) => {
    if (!deliveryAddress) return null;
    const parts = [
      deliveryAddress.flat_villa_no || "",
      deliveryAddress.building_name || "",
      deliveryAddress.field3 || "",
      deliveryAddress.field2 || "",
      deliveryAddress.field1 || "",
      deliveryAddress.country || ""
    ].filter(part => part.trim() !== "");
    return parts.length > 0 ? parts.join(", ") : null;
  };

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

  const hasDeliveryAddress = (sale) => {
    if (!sale?.deliveryAddress) return false;
    return (
      sale.deliveryAddress.building_name ||
      sale.deliveryAddress.flat_villa_no ||
      sale.deliveryAddress.country ||
      sale.deliveryAddress.field1 ||
      sale.deliveryAddress.field2 ||
      sale.deliveryAddress.field3
    );
  };

  const cleanData = (data, currentSettings = settings) => {
    if (!Array.isArray(data)) return [];
    const validOrderTypes = ["Dine In", "Takeaway", "Online Delivery"];
    const cleaned = data
      .filter((sale) => {
        const gt = sale.grand_total !== undefined ? sale.grand_total : sale.grandTotal;
        const tt = sale.total !== undefined ? sale.total : (sale.subtotal || sale.sub_total || gt);
        const isValid =
          sale.items &&
          sale.items.length > 0 &&
          !isNaN(gt) &&
          gt !== null &&
          !isNaN(tt) &&
          tt !== null &&
          sale.invoice_no;
        if (isValid && sale.orderType && !validOrderTypes.includes(sale.orderType)) {
          console.warn(
            `Invalid orderType found: ${sale.orderType} for invoice ${sale.invoice_no}`
          );
        }
        return isValid;
      })
      .map((sale) => {
        const items = (sale.items || []).map(item => {
          let addons = Array.isArray(item.addons) ? [...item.addons] : [];
          if (addons.length === 0 && item.addonQuantities && Object.keys(item.addonQuantities).length > 0) {
            Object.entries(item.addonQuantities).forEach(([name, qty]) => {
              if (qty > 0) {
                addons.push({
                  addon_name: name,
                  addon_quantity: qty,
                  addon_price: Number(item.addonPrices?.[name]) || 0,
                  size: item.addonVariants?.[name]?.size || ""
                });
              }
            });
          }

          let selectedCombos = Array.isArray(item.selectedCombos) ? [...item.selectedCombos] :
            (Array.isArray(item.combos) ? [...item.combos] : []);

          if (selectedCombos.length === 0 && item.comboQuantities && Object.keys(item.comboQuantities).length > 0) {
            Object.entries(item.comboQuantities).forEach(([name, qty]) => {
              if (qty > 0) {
                selectedCombos.push({
                  combo_name: name,
                  combo_quantity: qty,
                  combo_price: Number(item.comboPrices?.[name]) || 0,
                  size: item.comboVariants?.[name]?.size || ""
                });
              }
            });
          }
          return {
            ...item,
            item_name: item.item_name || item.name || 'Unknown',
            addons,
            selectedCombos,
            icePrice: Number(item.icePrice || item.ice_price || 0),
            spicyPrice: Number(item.spicyPrice || item.spicy_price || 0),
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
          };
        });

        return {
          ...sale,
          items,
          rawDate: sale.date,
          chairsBooked: Array.isArray(sale.chairsBooked) ? sale.chairsBooked : [],
          orderType: sale.orderType || "N/A",
          userId: sale.userId || "N/A",
          date: getFormattedDate(sale.date || sale.created_at, currentSettings.dateFormat, currentSettings.timeZone),
          time: getFormattedTime(sale.time || sale.created_at, currentSettings.timeFormat, currentSettings.timeZone),
          grand_total: sale.grand_total !== undefined ? sale.grand_total : (sale.grandTotal !== undefined ? sale.grandTotal : 0),
          total: sale.total !== undefined ? sale.total : (sale.subtotal || sale.sub_total || sale.grand_total || 0),
          invoice_currency: currentSettings.currency || 'AED',
          invoice_currency_precision: currentSettings.currencyPrecision || 2,
          deliveryAddress: sale.deliveryAddress || {
            building_name: "",
            flat_villa_no: "",
            country: "",
            field1: "",
            field2: "",
            field3: "",
          },
        };
      });
    const invoiceNos = cleaned.map((sale) => sale.invoice_no);
    const duplicates = invoiceNos.filter(
      (no, index) => invoiceNos.indexOf(no) !== index
    );
    if (duplicates.length > 0) {
      console.warn("Duplicate invoice numbers found:", [...new Set(duplicates)]);
    }
    return cleaned;
  };

  const handleInvoiceClick = (invoiceId, sale) => {
    if (selectedInvoice === invoiceId) {
      setSelectedInvoice(null);
      setShowModal(false);
    } else {
      setSelectedInvoice(invoiceId);
      setInvoiceDetails(sale);
      setShowModal(true);
    }
  };

  const calculateItemPrices = (item) => {
    const baseAmount = parseFloat(item.basePrice) || parseFloat(item.amount) || 0;
    const addonTotal =
      item.addons && item.addons.length > 0
        ? item.addons.reduce(
          (sum, addon) =>
            sum +
            (parseFloat(addon.addon_price) || 0) * (addon.addon_quantity || 1),
          0
        )
        : 0;
    const comboTotal =
      item.selectedCombos && item.selectedCombos.length > 0
        ? item.selectedCombos.reduce(
          (sum, combo) =>
            sum +
            (parseFloat(combo.combo_price) || 0) * (combo.combo_quantity || 1),
          0
        )
        : 0;
    const totalAmount = baseAmount * (item.quantity || 1) + addonTotal + comboTotal;
    return { baseAmount, addonTotal, comboTotal, totalAmount };
  };

  const getItemDisplayName = (item) => {
    if (item.is_combo_offer) {
      return `OFFER: ${item.offer_description || item.item_name}`;
    }
    return `${item.item_name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`;
  };

  const formatTotal = (value) => {
    return Number(value).toFixed(2);
  };

  const calculateSubtotal = (sale) => {
    if (sale.total && parseFloat(sale.total) > 0) return parseFloat(sale.total);
    const gt = parseFloat(sale.grand_total || 0);
    const vat = parseFloat(sale.vat_amount || 0);
    if (gt > 0) return gt - vat;

    return sale.items.reduce((sum, item) => {
      const { totalAmount } = calculateItemPrices(item);
      return sum + totalAmount;
    }, 0);
  };

  const getVatByRate = (sale) => {
    const byRate = {};
    sale.items.forEach((item) => {
      if (item.taxBreakdown) {
        Object.entries(item.taxBreakdown).forEach(([rate, amt]) => {
          byRate[rate] = (byRate[rate] || 0) + parseFloat(amt || 0);
        });
      }
    });
    return byRate;
  };

  const calculateVAT = (sale) => {
    return parseFloat(sale.vat_amount) || 0;
  };

  const calculateGrandTotal = (sale) => {
    if (sale.grand_total && parseFloat(sale.grand_total) > 0) return parseFloat(sale.grand_total);
    return calculateSubtotal(sale) + calculateVAT(sale);
  };

  const formatCurrency = (value, sale = null) => {
    if (sale && sale.invoice_currency) {
      const formatter = getCurrencyFormatter(sale.invoice_currency, sale.invoice_currency_precision, false, true);
      return formatter.format(Number(value));
    }
    const formatter = getCurrencyFormatter(null, null, false, true);
    return formatter.format(Number(value));
  };

  const generatePrintableContent = (sale, isPreview = false) => {
    if (!sale) return "";
    const subtotal = calculateSubtotal(sale);
    const vatAmount = calculateVAT(sale);
    const grandTotal = subtotal + vatAmount;
    const vatRate = subtotal > 0 ? (vatAmount / subtotal) : 0;
    const invoiceCurrency = sale?.invoice_currency || settings.currency;
    const invoicePrecision = sale.invoice_currency_precision || settings.currencyPrecision || 2;
    const formatter = { format: (val) => getCurrencyFormatter(invoiceCurrency, invoicePrecision, true, false).format(val) };
    const deliveryAddressHtml = getPrintDeliveryAddressHtml(sale.deliveryAddress);
    const hasDeliveryAddressFlag = hasDeliveryAddress(sale);
    const borderStyle = isPreview ? "border: none;" : "border: 1px solid #000000;";
    const effectivePrintSettings = printSettings || defaultPrintSettings;
    const restaurantName = effectivePrintSettings.restaurantName;
    const street = effectivePrintSettings.street;
    const city = effectivePrintSettings.city;
    const pincode = effectivePrintSettings.pincode;
    const address = `${street}${street ? ', ' : ''}${city}${pincode ? `, ${pincode}` : ''}`;
    const phone = effectivePrintSettings.phone;
    const gstin = effectivePrintSettings.gstin;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by manoj";
    const formattedDate = sale.date;
    const formattedTime = sale.time;
    const cashPayment = sale.payments?.[0];
    let cashGivenDisplay = "";
    if (cashPayment?.mode_of_payment === "CASH" && cashPayment?.amount) {
      const cashGiven = Number(cashPayment.amount);
      const changeReturned = Math.max(0, cashGiven - grandTotal);
      cashGivenDisplay = `
        <tr>
          <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Cash Given</td>
          <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
          <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(cashGiven)}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Change Returned</td>
          <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
          <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(changeReturned)}</td>
        </tr>
      `;
    }
    const offerRows = sale.items.filter(item => item.originalBasePrice).map(item => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${item.item_name}:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;"><span style="text-decoration: line-through;">${formatter.format((item.originalBasePrice * item.quantity))}</span> ${formatter.format((item.basePrice * item.quantity))}</td>
      </tr>
    `).join('');
    const vatByRate = getVatByRate(sale);
    const vatRows = Object.entries(vatByRate).map(([rate, amt]) => `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">VAT (${rate}%):</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${formatter.format(amt)}</td>
      </tr>
    `).join('');
    const orderNoDisplay = sale.orderType === "Online Delivery" && sale.orderNo ? `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Order No</td>
        <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.orderNo}</td>
      </tr>
    ` : "";
    const deliveryPersonDisplay = sale.orderType === "Online Delivery" && sale.deliveryPersonName ? `
      <tr>
        <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Delivery Person</td>
        <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
        <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.deliveryPersonName}</td>
      </tr>
    ` : "";
    return `
      <div style="font-family: Arial, sans-serif; width: 88mm; font-size: 12px; padding: 10px; color: #000000; ${borderStyle} box-sizing: border-box; line-height: 1.2;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
          ${logoUrl ? `<div style="flex: 0 0 auto;"><img src="${logoUrl}" alt="Logo" style="width: 30px; height: 30px; object-fit: contain; border-radius: 3px;"/></div>` : ''}
          <div style="flex: 1; text-align: right; font-family: Arial, sans-serif; font-size: 12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #000000;">${restaurantName}</h3>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;">Phone: ${phone}</p>
            <p style="margin: 2px 0;">GSTIN: ${gstin}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="width: 50%; text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Invoice No</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="width: 50%; text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${sale.invoice_no}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Customer</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.customer || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Phone</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.phoneNumber || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Email</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.email || "N/A"}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">WhatsApp</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.whatsappNumber || "N/A"}</td>
            </tr>
            ${sale.tableNumber && sale.tableNumber !== "N/A"
        ? `
                  <tr>
                    <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Table</td>
                    <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
                    <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.tableNumber}</td>
                  </tr>
                `
        : ""
      }
            ${orderNoDisplay}
            ${deliveryPersonDisplay}
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
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${sale.payments?.[0]?.mode_of_payment || "CASH"}</td>
            </tr>
            ${cashGivenDisplay}
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Date</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Time</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; white-space: nowrap;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Employee</td>
              <td style="text-align: center; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px; word-break: break-all;">${getEmployeeName(sale.userId)}</td>
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
            ${sale.items
        .map((item) => {
          const { baseAmount } = calculateItemPrices(item);
          const icePrice = Number(item.icePrice || 0);
          const spicyPrice = Number(item.spicyPrice || 0);
          const ingredients = item.ingredients || [];
          const displayName = getItemDisplayName(item);
          return `
                  <tr>
                    <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px; vertical-align: top;">${displayName}</td>
                    <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount)}</td>
                    <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #000; line-height: 1.2; font-size: 12px;">${formatter.format(baseAmount * item.quantity)}</td>
                  </tr>
                  ${item.icePreference === "with_ice" && icePrice > 0
              ? `
                        <tr>
                          <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Ice</td>
                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(icePrice)}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(icePrice * item.quantity)}</td>
                        </tr>
                      `
              : ""
            }
                  ${item.isSpicy && spicyPrice > 0
              ? `
                        <tr>
                          <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Spicy</td>
                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.quantity}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(spicyPrice)}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(spicyPrice * item.quantity)}</td>
                        </tr>
                      `
              : ""
            }
                  ${ingredients.length > 0
              ? ingredients.map(ing => `
                        <tr>
                          <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">- ${ing.name}: ${ing.custom_weight || ing.weight || "N/A"}g</td>
                          <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">1</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(ing.calculated_price || ing.base_price || 0)}</td>
                          <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(ing.calculated_price || ing.base_price || 0)}</td>
                        </tr>
                      `).join("")
              : ""
            }
                  ${item.customVariantsDetails && Object.keys(item.customVariantsDetails).length > 0
              ? Object.entries(item.customVariantsDetails)
                .map(
                  ([variantName, variant]) => `
                            <tr>
                              <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ ${variant.heading}: ${variant.name}</td>
                              <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${item.customVariantsQuantities?.[variantName] || 1}</td>
                              <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(variant.price)}</td>
                              <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(variant.price * (item.customVariantsQuantities?.[variantName] || 1))}</td>
                            </tr>
                          `
                )
                .join("")
              : ""
            }
                  ${item.addons && item.addons.length > 0
              ? item.addons
                .map(
                  (addon) =>
                    addon.addon_quantity > 0
                      ? `
                                <tr>
                                  <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Addon: ${addon.addon_name || addon.name1 || addon.name || "Addon"}${addon.size ? ` (${addon.size})` : ""}</td>
                                  <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${addon.addon_quantity}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(addon.addon_price)}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(addon.addon_price * addon.addon_quantity)}</td>
                                </tr>
                                ${addon.isSpicy && (addon.spicy_price || addon.spicyPrice) > 0
                        ? `
                                      <tr>
                                        <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                        <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${addon.addon_quantity}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(addon.spicy_price || addon.spicyPrice)}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format((addon.spicy_price || addon.spicyPrice) * addon.addon_quantity)}</td>
                                      </tr>
                                    `
                        : ""
                      }
                              `
                      : ""
                )
                .join("")
              : ""
            }
                  ${item.selectedCombos && item.selectedCombos.length > 0
              ? item.selectedCombos
                .map(
                  (combo) =>
                    combo.combo_quantity > 0
                      ? `
                                <tr>
                                  <td style="text-align: left; padding: 2px 8px 2px 16px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px; color: #666; vertical-align: top;">+ Combo: ${combo.combo_name || combo.name1 || combo.name || "Combo"}${combo.size ? ` (${combo.size})` : ""}</td>
                                  <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${combo.combo_quantity}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(combo.combo_price)}</td>
                                  <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 11px;">${formatter.format(combo.combo_price * combo.combo_quantity)}</td>
                                </tr>
                                ${combo.isSpicy && (combo.spicy_price || combo.spicyPrice) > 0
                        ? `
                                      <tr>
                                        <td style="text-align: left; padding: 2px 8px 2px 24px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px; color: #999; vertical-align: top;">+ Spicy</td>
                                        <td style="text-align: center; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${combo.combo_quantity}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format(combo.spicy_price || combo.spicyPrice)}</td>
                                        <td style="text-align: right; padding: 2px 8px; border-bottom: 1px solid #eee; line-height: 1.2; font-size: 10px;">${formatter.format((combo.spicy_price || combo.spicyPrice) * combo.combo_quantity)}</td>
                                      </tr>
                                    `
                        : ""
                      }
                              `
                      : ""
                )
                .join("")
              : ""
            }
                `;
        })
        .join("")}
          </tbody>
        </table>
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
          <tbody>
            <tr>
              <td style="text-align: left; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">Total Quantity:</td>
              <td style="text-align: right; padding: 4px 0; border: none; line-height: 1.2; font-size: 12px;">${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            </tr>
            ${offerRows}
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

  const generateReportPrintableContent = (filteredSales, filterDescription = "All Sales Data") => {
    if (filteredSales.length === 0) return "";
    const effectivePrintSettings = printSettings || defaultPrintSettings;
    const restaurantName = effectivePrintSettings.restaurantName;
    const street = effectivePrintSettings.street;
    const city = effectivePrintSettings.city;
    const pincode = effectivePrintSettings.pincode;
    const address = `${street}${street ? ', ' : ''}${city}${pincode ? `, ${pincode}` : ''}`;
    const phone = effectivePrintSettings.phone;
    const gstin = effectivePrintSettings.gstin;
    const thankYouMessage = effectivePrintSettings.thankYouMessage;
    const poweredBy = effectivePrintSettings.poweredBy ? `Powered by ${effectivePrintSettings.poweredBy}` : "Powered by manoj";
    const { currencyTotals } = calculateAggregates(filteredSales, false, null);
    let rows = filteredSales.map((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale),
      };
      return `
        <tr style="border-bottom: 1px solid #d3d3d3;">
          <td style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.invoice_no}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.date}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.time}</td>
          <td style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${sale.orderType || "N/A"}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${formatCurrency(amounts.subtotal, sale)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${formatCurrency(amounts.vat, sale)}</td>
          <td style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #d3d3d3;">${formatCurrency(amounts.grand, sale)}</td>
          <td style="text-align: left; padding: 8px; font-size: 12px;">${getEmployeeName(sale.userId)}</td>
        </tr>
      `;
    }).join("");
    let reportSummary = '';
    currencyTotals.forEach((totals, currency) => {
      const formatter = { format: (val) => getCurrencyFormatter(currency, totals.precision, true, false).format(val) };
      reportSummary += `
        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
          <table style="width: auto; border-collapse: collapse; border: 1px solid #000000; min-width: 300px;">
            <tr style="border-bottom: 2px solid #000000;">
              <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold; background-color: #f0f0f0;">${currency} Report Summary</td>
              <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold; background-color: #f0f0f0;">Amount</td>
            </tr>
            <tr style="border-bottom: 1px solid #d3d3d3;">
              <td style="text-align: left; padding: 8px; font-size: 12px;">Subtotal</td>
              <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${formatter.format(totals.subtotal)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #d3d3d3;">
              <td style="text-align: left; padding: 8px; font-size: 12px;">Total VAT</td>
              <td style="text-align: right; padding: 8px; font-size: 12px; font-weight: bold;">${formatter.format(totals.vat)}</td>
            </tr>
            <tr style="border-top: 2px solid #000000; background-color: #f9f9f9;">
              <td style="text-align: left; padding: 8px; font-size: 13px; font-weight: bold;">Grand Total</td>
              <td style="text-align: right; padding: 8px; font-size: 13px; font-weight: bold;">${formatter.format(totals.grand)}</td>
            </tr>
          </table>
        </div>
      `;
    });
    return `
      <div style="font-family: Arial, sans-serif; width: 210mm; font-size: 12px; padding: 20px; color: #000000; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          ${logoUrl ? `<div style="flex: 0 0 auto;"><img src="${logoUrl}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 3px;"/></div>` : ''}
          <div style="flex: 1; text-align: right; font-family: Arial, sans-serif; font-size: 12px;">
            <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #000000;">${restaurantName}</h3>
            <p style="margin: 2px 0;">${address}</p>
            <p style="margin: 2px 0;">Phone: ${phone}</p>
            <p style="margin: 2px 0;">GSTIN: ${gstin}</p>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0; font-size: 14px; text-align: center;">Sales Report - ${filterDescription}</h4>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000000;">
              <th style="text-align: left; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Invoice No</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Date</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Time</th>
              <th style="text-align: center; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Order Type</th>
              <th style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Total</th>
              <th style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">VAT Amount</th>
              <th style="text-align: right; padding: 8px; font-size: 12px; border-right: 1px solid #000000;">Grand Total</th>
              <th style="text-align: left; padding: 8px; font-size: 12px;">Employee</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${reportSummary}
        <div style="text-align: center; margin-top: 20px; border-top: 2px solid #000000; padding-top: 10px;">
          <p style="margin: 4px 0; font-size: 12px;">${thankYouMessage}</p>
          <p style="margin: 4px 0; font-size: 12px;">${poweredBy}</p>
        </div>
      </div>
    `;
  };

  const getFilterDescription = () => {
    const filters = [];
    if (fromDate) filters.push(`From ${getFormattedDate(fromDate, 'dd-MM-yyyy')}`);
    if (toDate) filters.push(`To ${getFormattedDate(toDate, 'dd-MM-yyyy')}`);
    if (filterStartTime) filters.push(`Start Time: ${filterStartTime}`);
    if (filterEndTime) filters.push(`End Time: ${filterEndTime}`);
    if (filterInvoiceNo) filters.push(`Invoice: ${filterInvoiceNo}`);
    if (filterCustomer) filters.push(`Customer: ${filterCustomer}`);
    if (filterPhone) filters.push(`Phone: ${filterPhone}`);
    if (filterItems.length > 0) filters.push(`Items: ${filterItems.join(', ')}`);
    if (filterCategories.length > 0) filters.push(`Categories: ${filterCategories.join(', ')}`);
    if (filterOffers.length > 0) filters.push(`Offers: ${filterOffers.join(', ')}`);
    if (filterDeliveryPersons.length > 0) filters.push(`Delivery Persons: ${filterDeliveryPersons.join(', ')}`);
    if (filterOrderTypes.length > 0) filters.push(`Order Types: ${filterOrderTypes.join(', ')}`);
    return filters.length > 0 ? filters.join(', ') : 'All Sales Data';
  };

  const handleExportExcel = () => {
    const wsData = filteredSales.map((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale),
      };
      return {
        'Invoice No': sale.invoice_no,
        'Date': sale.date,
        'Time': sale.time,
        'Order Type': sale.orderType || 'N/A',
        'Total': amounts.subtotal,
        'VAT Amount': amounts.vat,
        'Grand Total': amounts.grand,
        'Employee': getEmployeeName(sale.userId),
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
    const filterDesc = getFilterDescription().replace(/[, ]/g, '_');
    const fileName = `Sales_Report_${filterDesc}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setWarningMessage(`Excel exported successfully as ${fileName}!`);
    setWarningType("success");
  };

  const handleExportPDF = () => {
    const filterDesc = getFilterDescription();
    const content = generateReportPrintableContent(filteredSales, filterDesc);
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Sales Report PDF</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 10mm; size: A4; }
            }
            body { margin: 0; font-family: Arial, sans-serif; }
            .print-preview-content {
              width: 210mm;
              font-size: 12px;
              padding: 20px;
              color: #000000;
              box-sizing: border-box;
            }
            .print-preview-content table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000000;
            }
            .print-preview-content th,
            .print-preview-content td {
              padding: 8px;
              border-right: 1px solid #000000;
            }
            .print-preview-content th {
              background: #f0f0f0;
            }
          </style>
        </head>
        <body onload="window.print(); window.close()">
          ${content}
        </body>
      </html>
    `);
    win.document.close();
  };

  const calculateAggregates = (sales) => {
    const currencyTotals = new Map();
    sales.forEach((sale) => {
      const amounts = {
        subtotal: calculateSubtotal(sale),
        vat: calculateVAT(sale),
        grand: calculateGrandTotal(sale),
      };
      const currency = sale.invoice_currency || settings.currency || 'INR';
      const precision = sale.invoice_currency_precision || settings.currencyPrecision || 2;
      if (!currencyTotals.has(currency)) {
        currencyTotals.set(currency, { subtotal: 0, vat: 0, grand: 0, precision });
      }
      const totals = currencyTotals.get(currency);
      totals.subtotal += amounts.subtotal;
      totals.vat += amounts.vat;
      totals.grand += amounts.grand;
    });
    return { currencyTotals: new Map([...currencyTotals.entries()]) };
  };

  const handlePrint = (sale) => {
    const content = generatePrintableContent(sale);
    if (isElectron && ipcRenderer) {
      ipcRenderer.send("open-print-preview", content);
      ipcRenderer.once("print-preview-response", (event, response) => {
        if (!response.success) {
          setWarningMessage("Print preview failed: " + response.error);
          setWarningType("warning");
        }
      });
    } else {
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>Receipt - Invoice ${sale.invoice_no}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0; size: 88mm auto; }
              }
              body { margin: 0; font-family: Arial, sans-serif; }
              .print-preview-content {
                width: 88mm;
                font-size: 12px;
                padding: 10px;
                color: #000000;
                box-sizing: border-box;
                line-height: 1.2;
              }
              .print-preview-content table {
                width: 100%;
                border-collapse: collapse;
              }
              .print-preview-content th,
              .print-preview-content td {
                padding: 4px 8px;
                border: 1px solid #000000;
              }
              .print-preview-content th {
                background: #f8f9fa;
              }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            ${content}
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleEmail = async (sale) => {
    if (baseUrl === null) {
      setWarningMessage("System is not ready, please wait.");
      setWarningType("warning");
      return;
    }
    const htmlContent = generatePrintableContent(sale);
    const emailData = {
      to: sale.email || "manojmanoj.k@gmail.com",
      subject: `Invoice ${sale.invoice_no} - Restaurant`,
      html: htmlContent,
    };
    try {
      const response = await axios.post(
        `${baseUrl}/api/send-email`,
        emailData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        setWarningMessage("Invoice emailed successfully!");
        setWarningType("success");
      } else {
        setWarningMessage("Failed to send email: " + response.data.message);
        setWarningType("warning");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setWarningMessage(
        "Error sending email: " +
        (error.response?.data?.message || error.message)
      );
      setWarningType("warning");
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // Robust parsing for YYYY-MM-DD or DD-MM-YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return null;

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      // DD-MM-YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  const isTimeInRange = (saleTime, startTime, endTime) => {
    if (!startTime && !endTime) return true;
    const saleMinutes = timeToMinutes(saleTime);
    const startMinutes = startTime ? timeToMinutes(startTime) : -Infinity;
    const endMinutes = endTime ? timeToMinutes(endTime) : Infinity;
    return saleMinutes >= startMinutes && saleMinutes <= endMinutes;
  };

  const normalizeOrderType = (orderType) => {
    if (!orderType) return "";
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

  const handleDynamicFilterToggle = (designationName, userId) => {
    setDynamicFilters(prev => {
      const current = prev[designationName] || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      return { ...prev, [designationName]: updated };
    });
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


  const handleItemSearch = (e) => {
    setItemSearch(e.target.value);
    setShowItemDropdown(true);
  };

  const handleItemSelect = (name) => {
    setFilterItems(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
    setItemSearch("");
    // setShowItemDropdown(false); // Keep open for multi-select
  };

  const handleItemInputBlur = () => {
    setTimeout(() => setShowItemDropdown(false), 200);
  };

  const filteredItemOptions = itemOptions.filter((option) =>
    option.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredSales = salesData.filter((sale) => {
    const saleDate = parseDate(sale.rawDate);
    const from = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)) : null;
    const to = toDate ? new Date(toDate.setHours(23, 59, 59, 999)) : null;
    const dateMatch =
      (!from && !to) ||
      (from && !to && saleDate && saleDate >= from) ||
      (!from && to && saleDate && saleDate <= to) ||
      (from && to && saleDate && saleDate >= from && saleDate <= to);
    const timeMatch = isTimeInRange(sale.time, filterStartTime, filterEndTime);
    const invoiceMatch = filterInvoiceNo
      ? sale.invoice_no.toLowerCase().includes(filterInvoiceNo.toLowerCase())
      : true;
    const customerMatch = filterCustomer
      ? sale.customer?.toLowerCase().includes(filterCustomer.toLowerCase())
      : true;
    const phoneMatch = filterPhone
      ? sale.phoneNumber?.toLowerCase().includes(filterPhone.toLowerCase())
      : true;
    const itemMatch = filterItems.length > 0
      ? sale.items.some((item) => {
        const itemNameMatch = filterItems.some(f =>
          item.item_name.toLowerCase().includes(f.toLowerCase())
        );
        const addonMatch =
          item.addons &&
          item.addons.some((addon) =>
            filterItems.some(f => addon.addon_name.toLowerCase().includes(f.toLowerCase()))
          );
        const comboMatch =
          item.selectedCombos &&
          item.selectedCombos.some((combo) =>
            filterItems.some(f => combo.name1.toLowerCase().includes(f.toLowerCase()))
          );
        return itemNameMatch || addonMatch || comboMatch;
      })
      : true;
    const categoryMatch = filterCategories.length > 0
      ? sale.items.some((item) => {
        const itemCategory = itemOptions.find(
          (option) => option.name === item.item_name
        )?.category;
        return filterCategories.includes(itemCategory);
      })
      : true;
    const orderTypeMatch = filterOrderTypes.length > 0
      ? filterOrderTypes.some(f => normalizeOrderType(sale.orderType).toLowerCase() === normalizeOrderType(f).toLowerCase())
      : true;
    const offerMatch = filterOffers.length > 0
      ? sale.items.some((item) => item.is_combo_offer && filterOffers.includes(item.offer_description))
      : true;
    const deliveryPersonMatch = filterDeliveryPersons.length > 0
      ? filterDeliveryPersons.includes(sale.deliveryPersonName)
      : true;

    const saleBranch = sale.branch_name || sale.branch;
    // Helper: detect if this sale is a company-level (no specific branch) record
    const isCompanyLevelSale = !saleBranch ||
      ['', 'all', 'all branches', 'global', 'unassigned', 'nan'].includes(String(saleBranch).trim().toLowerCase());

    let branchMatch;
    if (filterBranches.length > 0) {
      // Branch explicitly selected → match only that branch
      branchMatch = filterBranches.includes(saleBranch);
    } else if (selectedCompanies.length > 0) {
      // Company selected but NO branch → show only company-level (All Branches) sales
      branchMatch = isCompanyLevelSale;
    } else {
      // No company/branch filter → show everything
      branchMatch = true;
    }

    // Company-level match (client-side safety net)
    const companyMatch = selectedCompanies.length === 0 ||
      selectedCompanies.some(sc => {
        const sc_l = sc.trim().toLowerCase();
        const cn = (sale.company_name || sale.company || '').trim().toLowerCase();
        return cn === sc_l;
      });

    // Dynamic Designation Filters Match
    const dynamicMatch = Object.entries(dynamicFilters).every(([designationName, selectedVals]) => {
      if (selectedVals.length === 0) return true;
      const selectedEmployees = allEmployees.filter(emp => selectedVals.includes(emp.userId || emp.email || emp.username));
      if (selectedEmployees.length === 0) {
        return selectedVals.includes(sale.userId);
      }
      return selectedEmployees.some(emp =>
        String(emp.email) === String(sale.userId) ||
        String(emp.userId) === String(sale.userId) ||
        String(emp.username) === String(sale.userId) ||
        String(emp.name) === String(sale.userId) ||
        String(emp.firstName) === String(sale.userId)
      );
    });

    return (
      dateMatch &&
      timeMatch &&
      invoiceMatch &&
      customerMatch &&
      phoneMatch &&
      itemMatch &&
      categoryMatch &&
      orderTypeMatch &&
      offerMatch &&
      deliveryPersonMatch &&
      dynamicMatch &&
      branchMatch &&
      companyMatch
    );
  });




  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.target.classList.add("dragging");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const target = e.target.closest("th");
    if (target) {
      target.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e) => {
    const target = e.target.closest("th");
    if (target) {
      target.classList.remove("drag-over");
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newOrder = [...columnOrder];
    const [draggedColumn] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    document.querySelectorAll(".table-header th").forEach((th) => {
      th.classList.remove("drag-over");
      th.classList.remove("dragging");
    });
  };

  const handleDragEnd = (e) => {
    document.querySelectorAll(".table-header th").forEach((th) => {
      th.classList.remove("drag-over");
      th.classList.remove("dragging");
    });
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return (
      fromDate ||
      toDate ||
      filterStartTime ||
      filterEndTime ||
      filterInvoiceNo ||
      filterCustomer ||
      filterPhone ||
      filterItems.length > 0 ||
      filterCategories.length > 0 ||
      filterOffers.length > 0 ||
      filterDeliveryPersons.length > 0 ||
      filterOrderTypes.length > 0 ||
      filterBranches.length > 0 ||
      Object.values(dynamicFilters).some(selected => selected.length > 0)
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setFilterStartTime("");
    setFilterEndTime("");
    setFilterInvoiceNo("");
    setFilterCustomer("");
    setFilterPhone("");
    setFilterItems([]);
    setItemSearch("");
    setFilterCategories([]);
    setFilterOffers([]);
    setFilterDeliveryPersons([]);
    setFilterOrderTypes([]);
    setFilterBranches([]);
    setDynamicFilters(prev => {
      const reset = {};
      Object.keys(prev).forEach(k => reset[k] = []);
      return reset;
    });
    setWarningMessage(""); // Optional: clear any warning
  };

  const formatter = { format: (val) => getCurrencyFormatter(null, null, false, true).format(val) };
  const formattedDeliveryAddress = invoiceDetails ? formatDeliveryAddress(invoiceDetails.deliveryAddress) : null;

  const getGrandTotalStyle = (sale) => {
    return sale.status === 'Delivered' ? { color: 'green', fontWeight: 'bold' } : {};
  };

  // Get row background color and text color based on order type when color mode is enabled
  const getRowColorStyle = (sale) => {
    if (!colorModeEnabled) return {};
    const orderType = normalizeOrderType(sale.orderType);
    switch (orderType) {
      case 'TAK':
        return {
          backgroundColor: 'rgba(255, 76, 76, 0.15)',
          color: '#e74c3c',
          fontWeight: '600'
        }; // Soft Red + Dark Red Text
      case 'OND':
        return {
          backgroundColor: 'rgba(52, 152, 219, 0.15)',
          color: '#2980b9',
          fontWeight: '600'
        }; // Soft Blue + Dark Blue Text
      case 'DIN':
        return {
          backgroundColor: 'rgba(241, 196, 15, 0.15)',
          color: '#d68910',
          fontWeight: '600'
        }; // Soft Yellow + Dark Yellow/Orange Text
      default:
        return {};
    }
  };

  // NEW: Get CSS class for row highlighting (used in modal/details)
  const getRowColorClass = (sale) => {
    if (!colorModeEnabled) return "";
    const orderType = normalizeOrderType(sale.orderType);
    return `order-type-${orderType.toLowerCase()}`;
  };

  // NEW: Render a small colored indicator box for the order type
  const renderOrderTypeIndicator = (sale) => {
    const orderType = normalizeOrderType(sale.orderType);
    let color = '#ccc';
    let label = orderType;

    switch (orderType) {
      case 'TAK':
        color = '#ff4c4c';
        break;
      case 'OND':
        color = '#3498db';
        break;
      case 'DIN':
        color = '#f1c40f';
        break;
      default:
        break;
    }

    return (
      <div className="order-type-indicator-wrapper">
        <span
          className="order-type-box"
          style={{ backgroundColor: color }}
          title={orderType}
        ></span>
        <span className="order-type-label">{label}</span>
      </div>
    );
  };

  if (permsLoading || baseUrl === null)
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" style={{ color: "#3498db" }} />
        <p>Loading Permissions...</p>
      </Container>
    );

  if (!canRead) {
    return (
      <Container className="text-center mt-5">
        <div className="alert alert-danger">
          <h3>Access Denied</h3>
          <p>You do not have permission to view Sales Invoices.</p>
        </div>
        <Button variant="primary" onClick={() => navigate("/home")}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (loading)
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" style={{ color: "#3498db" }} />
        <p>Loading Sales Data...</p>
      </Container>
    );


  return (
    <Container fluid className="mt-4 sales-page-container">
      {warningMessage && (
        <div
          className={`alert alert-${warningType} text-center alert-dismissible fade show`}
          role="alert"
        >
          {warningMessage}
          <button
            type="button"
            className="btn btn-primary ms-3"
            onClick={() => setWarningMessage("")}
          >
            OK
          </button>
        </div>
      )}
      <div className="mb-4 d-flex justify-content-end flex-wrap gap-2">

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleExportExcel} className="back-btn">
            <FaFileExcel /> Export Excel
          </Button>
          <Button variant="danger" onClick={handleExportPDF} className="back-btn">
            <FaFilePdf /> Export PDF
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowColumnModal(true)} className="back-btn">
            Manage Columns
          </Button>
          <Button
            variant={colorModeEnabled ? "success" : "outline-success"}
            onClick={() => setColorModeEnabled(!colorModeEnabled)}
            className="back-btn"
          >
            <FaPalette /> Color Code
          </Button>
        </div>
      </div>

      {/* Clear Filters Button - only visible when filters are active */}
      {hasActiveFilters() && (
        <div className="d-flex justify-content-end mb-2">
          <Button variant="outline-secondary" onClick={handleClearFilters} className="back-btn">
            Clear Filters
          </Button>
        </div>
      )}

      {/* Filter Section - Now using CSS Grid for equal width */}
      <Form.Group className="mb-4 filter-grid">
        <div className="filter-item">
          <Form.Label className="fw-bold">From Date:</Form.Label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            dateFormat="dd-MM-yyyy"
            className="form-control shadow-sm"
            wrapperClassName="w-100"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">To Date:</Form.Label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            dateFormat="dd-MM-yyyy"
            className="form-control shadow-sm"
            minDate={fromDate}
            wrapperClassName="w-100"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">Start Time:</Form.Label>
          <Form.Control
            type="time"
            value={filterStartTime}
            onChange={(e) => setFilterStartTime(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            className="shadow-sm"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">End Time:</Form.Label>
          <Form.Control
            type="time"
            value={filterEndTime}
            onChange={(e) => setFilterEndTime(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            className="shadow-sm"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">Invoice No:</Form.Label>
          <Form.Control
            type="text"
            value={filterInvoiceNo}
            onChange={(e) => setFilterInvoiceNo(e.target.value)}
            placeholder="Filter by invoice no"
            className="shadow-sm"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">Customer Name:</Form.Label>
          <Form.Control
            type="text"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            placeholder="Filter by customer"
            className="shadow-sm"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">Phone Number:</Form.Label>
          <Form.Control
            type="text"
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
            placeholder="Filter by phone"
            className="shadow-sm"
          />
        </div>
        <CheckboxDropdown
          label="Item Name:"
          options={itemOptions.map(i => ({ label: `${i.name} (${i.type})`, value: i.name }))}
          selectedValues={filterItems}
          onToggle={(val) => handleItemSelect(val)}
          placeholder="All Items"
          searchPlaceholder="Search items..."
          showSearch={true}
        />
        <CheckboxDropdown
          label="Category:"
          options={categoryOptions}
          selectedValues={filterCategories}
          onToggle={(val) => setFilterCategories(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
          placeholder="All Categories"
        />
        <CheckboxDropdown
          label="Offer Name:"
          options={offerOptions}
          selectedValues={filterOffers}
          onToggle={(val) => setFilterOffers(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
          placeholder="All Offers"
        />
        <CheckboxDropdown
          label="Delivery Person:"
          options={deliveryPersonOptions}
          selectedValues={filterDeliveryPersons}
          onToggle={(val) => setFilterDeliveryPersons(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
          placeholder="All Delivery Persons"
        />
        <CheckboxDropdown
          label="Order Type:"
          options={["DIN", "TAK", "OND"]}
          selectedValues={filterOrderTypes}
          onToggle={(val) => setFilterOrderTypes(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
          placeholder="All Types"
        />

        {/* Dynamic Designation Filters */}
        {designations.map(desig => {
          const desigEmployees = allEmployees.filter(emp => emp.employeeDesignation === desig.name);
          if (desigEmployees.length === 0) return null;

          return (
            <CheckboxDropdown
              key={desig.id}
              label={`${desig.name}:`}
              options={desigEmployees.map(emp => ({
                label: emp.name || emp.firstName || emp.email,
                value: emp.email || emp.username
              }))}
              selectedValues={dynamicFilters[desig.name] || []}
              onToggle={(val) => handleDynamicFilterToggle(desig.name, val)}
              placeholder={`All ${desig.name}s`}
              showSearch={desigEmployees.length > 5}
              searchPlaceholder={`Search ${desig.name}...`}
            />
          );
        })}

        {isGroupAdmin && (
          <CheckboxDropdown
            label="Company:"
            options={availableCompanies}
            selectedValues={selectedCompanies}
            onToggle={(val) => setSelectedCompanies(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
            placeholder="All Companies"
          />
        )}

        {(isGroupAdmin || isCompanyAdmin) && branches.length > 0 && (
          <CheckboxDropdown
            label="Branch:"
            options={branches}
            selectedValues={filterBranches}
            onToggle={(val) => setFilterBranches(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
            placeholder="All Branches"
          />
        )}
      </Form.Group>

      <Row>
        <Col>
          <Card className="shadow-lg sales-card">
            <Card.Body>
              <Card.Title className="text-primary fw-bold mb-4">
                {hasActiveFilters() ? "Filtered Sales Data" : "All Sales Data"}
                {colorModeEnabled && (
                  <span className="ms-3" style={{ fontSize: '0.9rem' }}>
                    <span className="badge bg-danger me-2">TAK</span>
                    <span className="badge bg-primary me-2">OND</span>
                    <span className="badge bg-warning text-dark">DIN</span>
                  </span>
                )}
              </Card.Title>
              {filteredSales.length === 0 ? (
                <div className="text-center" style={{ color: "#000000" }}>
                  No sales match the selected filters.
                </div>
              ) : (
                <Table responsive bordered striped hover className="sales-table">
                  <thead className="table-header">
                    <tr>
                      {columnOrder.map((col, index) => (
                        <th
                          key={col.key}
                          style={{ textAlign: col.align }}
                          draggable={col.key !== "actions"}
                          onDragStart={(e) =>
                            col.key !== "actions" && handleDragStart(e, index)
                          }
                          onDragOver={(e) => col.key !== "actions" && handleDragOver(e)}
                          onDragLeave={(e) => col.key !== "actions" && handleDragLeave(e)}
                          onDrop={(e) => col.key !== "actions" && handleDrop(e, index)}
                          onDragEnd={(e) => col.key !== "actions" && handleDragEnd(e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (col.key === "actions") return;
                            removeColumn(index);
                          }}
                          className={col.key !== "actions" ? "draggable-header" : ""}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale._id}
                        onClick={() => handleInvoiceClick(sale._id, sale)}
                        className={`table-row ${getRowColorClass(sale)}`}
                        style={{ cursor: "pointer", ...getRowColorStyle(sale) }}
                      >
                        {columnOrder.map((col) => (
                          <td key={col.key} style={{ textAlign: col.align }}>
                            {col.key === "invoice_no" && sale.invoice_no}
                            {col.key === "customer" && sale.customer}
                            {col.key === "date" && sale.date}
                            {col.key === "time" && sale.time}
                            {col.key === "phoneNumber" && (sale.phoneNumber || "N/A")}
                            {col.key === "whatsappNumber" && (sale.whatsappNumber || "N/A")}
                            {col.key === "email" && (sale.email || "N/A")}
                            {col.key === "tableNumber" && (sale.tableNumber || "N/A")}
                            {col.key === "chairsBooked" && (Array.isArray(sale.chairsBooked) ? sale.chairsBooked.length : 0)}
                            {col.key === "deliveryAddress" && (formatDeliveryAddress(sale.deliveryAddress) || "N/A")}
                            {col.key === "orderType" && renderOrderTypeIndicator(sale)}
                            {col.key === "status" && <span style={{ color: sale.status === 'Delivered' ? 'green' : 'inherit' }}>{sale.status || "N/A"}</span>}
                            {col.key === "orderNo" && formatTokenNo(sale.orderNo || "N/A")}
                            {col.key === "deliveryPersonName" && (sale.deliveryPersonName || "N/A")}
                            {col.key === "userId" && (sale.userId || "N/A")}
                            {col.key === "branch_name" && (
                              <span>
                                {(isGroupAdmin || isCompanyAdmin) ? (
                                  (!sale.branch_name && !sale.branch) || String(sale.branch_name || sale.branch).toLowerCase() === 'all' || String(sale.branch_name || sale.branch).toLowerCase() === 'all branches' 
                                  ? (sale.company_name || sale.company || "Company Level")
                                  : `${sale.company_name || sale.company || ""} - ${sale.branch_name || sale.branch || ""}`.replace(/^ - | - $/, "")
                                ) : (
                                  sale.branch_name || sale.branch || "N/A"
                                )}
                              </span>
                            )}
                            {col.key === "payments_mode" && (sale.payments?.[0]?.mode_of_payment || "N/A")}
                            {col.key === "due_date" && (sale.payment_terms?.[0]?.due_date || "N/A")}
                            {col.key === "total" && formatCurrency(calculateSubtotal(sale), sale)}
                            {col.key === "vat_amount" && formatCurrency(calculateVAT(sale), sale)}
                            {col.key === "grand_total" &&
                              <span style={getGrandTotalStyle(sale)} className={sale.status === 'Delivered' ? 'grand-total-delivered' : ''}>
                                {formatCurrency(sale.grand_total || calculateGrandTotal(sale), sale)}
                              </span>
                            }
                            {col.key === "paymentReceived" && "Payment Received"}
                            {col.key === "actions" && (
                              <div className="d-flex flex-column flex-sm-row gap-1">
                                <Button
                                  size="sm"
                                  className="action-btn flex-fill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canWrite) {
                                      setWarningMessage("You do not have permission to print.");
                                      setWarningType("danger");
                                      return;
                                    }
                                    handlePrint(sale);
                                  }}
                                >
                                  <FaPrint /> Print
                                </Button>
                                <Button
                                  size="sm"
                                  className="action-btn flex-fill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canWrite) {
                                      setWarningMessage("You do not have permission to email.");
                                      setWarningType("danger");
                                      return;
                                    }
                                    handleEmail(sale);
                                  }}
                                >
                                  <FaEnvelope /> Email
                                </Button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Invoice Details - {invoiceDetails?.invoice_no}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {invoiceDetails && (
            <div>
              <div className="mb-3">
                <label className="form-label fw-bold">Email Receipt To:</label>
                <input
                  type="email"
                  className="form-control"
                  value={invoiceDetails.email || ""}
                  onChange={(e) => { }}
                  placeholder="Enter email address"
                />
              </div>
              <table className="table table-bordered mb-3">
                <tbody>
                  <tr>
                    <td style={{ width: "50%", textAlign: "left" }}>
                      <strong>Invoice No:</strong>
                    </td>
                    <td style={{ width: "50%", textAlign: "right", whiteSpace: "nowrap" }}>{invoiceDetails.invoice_no}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Customer:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.customer}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Phone:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.phoneNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Email:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.email}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>WhatsApp:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.whatsappNumber}</td>
                  </tr>
                  {invoiceDetails.tableNumber && invoiceDetails.tableNumber !== "N/A" && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Table:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{invoiceDetails.tableNumber}</td>
                    </tr>
                  )}
                  {invoiceDetails.orderType === "Online Delivery" && invoiceDetails.orderNo && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Order No:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{formatTokenNo(invoiceDetails.orderNo)}</td>
                    </tr>
                  )}
                  {invoiceDetails.orderType === "Online Delivery" && invoiceDetails.deliveryPersonName && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Delivery Person:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{invoiceDetails.deliveryPersonName}</td>
                    </tr>
                  )}
                  {hasDeliveryAddress(invoiceDetails) && formattedDeliveryAddress && (
                    <tr>
                      <td style={{ textAlign: "left" }}>
                        <strong>Delivery Address:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>{formattedDeliveryAddress}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Payment Mode:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{invoiceDetails.payments?.[0]?.mode_of_payment || "CASH"}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Date:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{getFormattedDate(currentTime, settings.dateFormat)}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      <strong>Time:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{getFormattedTime(currentTime, settings.timeFormat)}</td>
                  </tr>
                </tbody>
              </table>
              <h5 className="mb-3">Items:</h5>
              <div className="table-responsive">
                <table className="table table-striped table-bordered" style={{ fontSize: "13px", color: "black", fontWeight: "bold" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>T.No.</th>
                      <th>Item Details</th>
                      <th style={{ width: "80px" }}>Qty</th>
                      <th style={{ width: "80px" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody className={invoiceDetails ? getRowColorClass(invoiceDetails) : ""}>
                    {invoiceDetails.items.map((item, index) => {
                      const { baseAmount, icePrice = parseFloat(item.ice_price) || 0, spicyPrice = parseFloat(item.spicy_price) || 0 } = calculateItemPrices(item);
                      return (
                        <React.Fragment key={index}>
                          <tr>
                            <td>{invoiceDetails.tableNumber || "N/A"}</td>
                            <td>
                              <strong>{getItemDisplayName(item)}</strong>
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                              {item.originalBasePrice ? (
                                <>
                                  <span style={{ textDecoration: "line-through" }}>{formatCurrency(item.originalBasePrice, invoiceDetails)}</span> {formatCurrency(baseAmount, invoiceDetails)}
                                </>
                              ) : (
                                formatCurrency(baseAmount, invoiceDetails)
                              )}
                            </td>
                          </tr>
                          {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                            <tr key={`${index}-combo-${cIndex}`}>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ {comboItem.name}</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(comboItem.price, invoiceDetails)}</td>
                            </tr>
                          ))}
                          {item.icePreference === "with_ice" && icePrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ Ice ({formatCurrency(icePrice, invoiceDetails)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(icePrice * item.quantity, invoiceDetails)}</td>
                            </tr>
                          )}
                          {item.isSpicy && spicyPrice > 0 && (
                            <tr>
                              <td></td>
                              <td>
                                <div style={{ fontSize: "12px", color: "#666" }}>+ Spicy ({formatCurrency(spicyPrice, invoiceDetails)})</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(spicyPrice * item.quantity, invoiceDetails)}</td>
                            </tr>
                          )}
                          {item.customVariantsDetails &&
                            Object.keys(item.customVariantsDetails).length > 0 &&
                            Object.entries(item.customVariantsDetails).map(([variantName, variant], idx) => (
                              <tr key={`${index}-custom-${idx}`}>
                                <td></td>
                                <td>
                                  <div style={{ color: "#888", fontSize: "12px" }}>
                                    + {variant.heading}: {variant.name} ({formatCurrency(variant.price, invoiceDetails)})
                                  </div>
                                </td>
                                <td>{item.customVariantsQuantities?.[variantName] || 1}</td>
                                <td>{formatCurrency(variant.price * (item.customVariantsQuantities?.[variantName] || 1), invoiceDetails)}</td>
                              </tr>
                            ))}
                          {item.addons &&
                            item.addons.map(
                              (addon, idx) =>
                                addon.addon_quantity > 0 && (
                                  <React.Fragment key={`${index}-addon-${idx}`}>
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div style={{ color: "#2ecc71", fontSize: "12px" }}>
                                          + Addon: {addon.addon_name || addon.name1 || addon.name || "Addon"}{addon.size ? ` (${addon.size})` : ""}
                                        </div>
                                      </td>
                                      <td>{addon.addon_quantity}</td>
                                      <td>{formatCurrency(addon.addon_price * addon.addon_quantity, invoiceDetails)}</td>
                                    </tr>
                                    {addon.isSpicy && addon.spicy_price > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy ({formatCurrency(addon.spicy_price, invoiceDetails)})
                                          </div>
                                        </td>
                                        <td>{addon.addon_quantity}</td>
                                        <td>{formatCurrency(addon.spicy_price * addon.addon_quantity, invoiceDetails)}</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                            )}
                          {item.selectedCombos &&
                            item.selectedCombos.map(
                              (combo, idx) =>
                                combo.combo_quantity > 0 && (
                                  <React.Fragment key={`${index}-combo-${idx}`}>
                                    <tr>
                                      <td></td>
                                      <td>
                                        <div style={{ color: "#e74c3c", fontSize: "12px" }}>
                                          + Combo: {combo.combo_name || combo.name1 || combo.name || "Combo"}{combo.size ? ` (${combo.size})` : ""}
                                        </div>
                                      </td>
                                      <td>{combo.combo_quantity}</td>
                                      <td>{formatCurrency(combo.combo_price * combo.combo_quantity, invoiceDetails)}</td>
                                    </tr>
                                    {combo.isSpicy && combo.spicy_price > 0 && (
                                      <tr>
                                        <td></td>
                                        <td>
                                          <div style={{ color: "#888", fontSize: "12px" }}>
                                            + Spicy ({formatCurrency(combo.spicy_price, invoiceDetails)})
                                          </div>
                                        </td>
                                        <td>{combo.combo_quantity}</td>
                                        <td>{formatCurrency(combo.spicy_price * combo.combo_quantity, invoiceDetails)}</td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                            )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p>
                  <strong>Total Quantity:</strong> {invoiceDetails.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
                <p>
                  <strong>Subtotal:</strong> {formatCurrency(calculateSubtotal(invoiceDetails), invoiceDetails)}
                </p>
                {Object.entries(getVatByRate(invoiceDetails)).map(([rate, amt]) => (
                  <p key={rate}>
                    <strong>VAT {rate}%:</strong> {formatCurrency(amt, invoiceDetails)}
                  </p>
                ))}
                <p>
                  <strong>Total VAT:</strong> {formatCurrency(calculateVAT(invoiceDetails), invoiceDetails)}
                </p>
                <p style={getGrandTotalStyle(invoiceDetails)}>
                  <strong>Grand Total:</strong> {formatCurrency(calculateGrandTotal(invoiceDetails), invoiceDetails)}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {invoiceDetails && (
            <>
              <Button variant="info" onClick={() => handleEmail(invoiceDetails)}>
                <FaEnvelope /> Send Email
              </Button>
              <Button variant="primary" onClick={() => handlePrint(invoiceDetails)}>
                <FaPrint /> Print Preview
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} className="column-modal" centered size="md">
        <Modal.Header closeButton className="bg-secondary text-white">
          <Modal.Title>Manage Table Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div className="mb-3 p-3 bg-white rounded shadow-sm">
            <h6 className="fw-bold text-primary mb-2">Add New Column</h6>
            <Form.Group className="mb-2">
              <Form.Label className="fw-bold">Select Field to Add</Form.Label>
              <Form.Select value={selectedFieldToAdd} onChange={(e) => setSelectedFieldToAdd(e.target.value)}>
                <option value="">Choose a field...</option>
                {possibleColumns
                  .filter((p) => !columnOrder.some((c) => c.key === p.key))
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-bold">Insert Position</Form.Label>
              <Form.Select value={selectedPosition} onChange={(e) => setSelectedPosition(Number(e.target.value))}>
                {Array.from({ length: columnOrder.length + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === columnOrder.length ? 'At the end' : `Before "${columnOrder[i].label}"`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" onClick={addColumn} disabled={!selectedFieldToAdd} className="mt-2 w-100">
              Add Column
            </Button>
          </div>
          <hr />
          <div className="p-3 bg-white rounded shadow-sm">
            <h6 className="fw-bold text-primary mb-2">Current Columns (Double-click headers in table to remove)</h6>
            {columnOrder.map((col, index) => (
              <div key={col.key} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-light">
                <span className="fw-medium">{col.label} ({col.align})</span>
                <Button size="sm" variant="danger" onClick={() => removeColumn(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowColumnModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* No Data Modal */}
      <Modal
        show={showNoDataModal}
        onHide={() => setShowNoDataModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <h5 className="mb-0">No sales data available.</h5>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNoDataModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SalesPage;
