import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import {
  Container,
  Table,
  Card,
  Spinner,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./salesreport.css";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import CurrencySymbol, { resolveCurrencyCode } from "../CurrencySymbol";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaEraser
} from "react-icons/fa";
import { useRef } from "react";

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

// Reusable Multi-select Checkbox Dropdown Component
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
    const lbl = opt && typeof opt === 'object' ? (opt.label || opt.name || "") : opt;
    return String(lbl).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="filter-item checkbox-dropdown-container" ref={dropdownRef}>
      <Form.Label className="fw-bold">{label}</Form.Label>
      <div className={`checkbox-dropdown-header ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
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
                const isObj = option && typeof option === 'object';
                const val = isObj ? (option.value !== undefined ? option.value : (option.userId || option.email || option)) : option;
                const lbl = isObj ? (option.label || option.name || String(option)) : String(option);
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

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterItems, setFilterItems] = useState([]); // Array for multi-select
  const [filterCategories, setFilterCategories] = useState([]); // Array for multi-select
  const [filterDeliveryPersons, setFilterDeliveryPersons] = useState([]); // Array for multi-select
  const [filterOrderTypes, setFilterOrderTypes] = useState([]); // Array for multi-select
  const [filterOffers, setFilterOffers] = useState([]); // Array for multi-select
  const [filterPaymentModes, setFilterPaymentModes] = useState([]); // Array for multi-select

  const [itemOptions, setItemOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [deliveryPersonOptions, setDeliveryPersonOptions] = useState([]);
  const [offerOptions, setOfferOptions] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [dynamicFilters, setDynamicFilters] = useState({}); // {designationName: [selectedUserIds]}
  const [branches, setBranches] = useState([]);
  const [filterBranches, setFilterBranches] = useState([]);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);

  const [printSettings, setPrintSettings] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);

  const [settings, setSettings] = useState({
    currency: 'AED',
    currencyPrecision: 2,
    language: 'en-US',
    dateFormat: 'dd-mm-yyyy',
    timeFormat: 'HH:mm:ss',
    timeZone: 'Asia/Dubai',
    useCurrencySymbol: false,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const calculateItemPrices = (item) => {
    let baseAmount = parseFloat(item.price || item.basePrice || 0);
    let totalAmount = baseAmount * (parseInt(item.quantity) || 1);
    if (item.addons) {
      item.addons.forEach(a => {
        totalAmount += parseFloat(a.addon_price || 0) * (parseInt(a.addon_quantity) || 0);
      });
    }
    if (item.selectedCombos) {
      item.selectedCombos.forEach(c => {
        totalAmount += parseFloat(c.combo_price || 0) * (parseInt(c.combo_quantity) || 0);
      });
    }
    return { baseAmount, totalAmount };
  };

  const calculateSubtotal = (sale) => {
    if (sale.total && parseFloat(sale.total) > 0) return parseFloat(sale.total);
    const gt = parseFloat(sale.grand_total || sale.grandTotal || 0);
    const vat = parseFloat(sale.vat_amount || 0);
    if (gt > 0) return gt - vat;
    return (sale.items || []).reduce((sum, item) => sum + calculateItemPrices(item).totalAmount, 0);
  };

  const calculateVAT = (sale) => parseFloat(sale.vat_amount) || 0;

  const calculateGrandTotal = (sale) => {
    if (sale.grand_total && parseFloat(sale.grand_total) > 0) return parseFloat(sale.grand_total);
    if (sale.grandTotal && parseFloat(sale.grandTotal) > 0) return parseFloat(sale.grandTotal);
    return calculateSubtotal(sale) + calculateVAT(sale);
  };

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
      default: return `${dayStr.padStart(2, '0')}-${monthStr}-${yearStr}`;
    }
  };

  const getFormattedTime = (timeInput, timeFormat = settings.timeFormat, timeZone = settings.timeZone) => {
    if (!timeInput) return '';
    let date;
    if (timeInput instanceof Date) { date = timeInput; }
    else if (typeof timeInput === 'string') {
      if (timeInput.includes('T')) {
        date = new Date(timeInput);
      } else {
        const [timePart, period] = timeInput.trim().split(' ');
        let [hours, minutes, seconds = '00'] = timePart.split(':').map(x => parseInt(x, 10) || 0);
        if (period && (period.toUpperCase() === 'PM' && hours !== 12)) hours += 12;
        else if (period && (period.toUpperCase() === 'AM' && hours === 12)) hours = 0;
        date = new Date(2023, 0, 1, hours, minutes, seconds);
      }
    } else { return timeInput || ''; }
    if (isNaN(date.getTime())) return timeInput || '';

    const tzOptions = { timeZone: timeZone || 'UTC' };
    const is12Hour = timeFormat.includes(' a') || timeFormat.startsWith('hh');
    const options = {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: is12Hour,
      ...((timeInput instanceof Date || (typeof timeInput === 'string' && timeInput.includes('T'))) && tzOptions)
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

  const cleanData = (data, currentSettings = settings) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((sale) => sale.items && sale.items.length > 0 && sale.invoice_no)
      .map((sale) => ({
        ...sale,
        rawDate: sale.date,
        date: getFormattedDate(sale.date || sale.created_at, currentSettings.dateFormat, currentSettings.timeZone),
        time: getFormattedTime(sale.time || sale.created_at, currentSettings.timeFormat, currentSettings.timeZone),
        invoice_currency: currentSettings.currency || 'AED',
        invoice_currency_precision: currentSettings.currencyPrecision || 2,
      }));
  };

  useEffect(() => {
    if (configLoading) return;

    const initializeData = async () => {
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
              const pagePerm = perms.find(p => p.pageId === 'sales_report');
              if (pagePerm) {
                setCanRead(pagePerm.canRead === true);
                setCanWrite(pagePerm.canWrite === true);
                hasReadPermission = pagePerm.canRead === true;
              }
            }
          } catch (e) {
            console.error("Error checking permissions", e);
          }
        }

        if (hasReadPermission) {
          const API_URL = baseUrl || '';
          const endpoints = [
            {
              key: 'sales',
              url: `${API_URL}/api/sales`,
              headers: getHeaders()
            },
            { key: 'settings', url: `${API_URL}/api/settings` },
            { key: 'print', url: `${API_URL}/api/print_settings/active` },
            { key: 'logo', url: `${API_URL}/api/logo` },
            { key: 'items', url: `${API_URL}/api/items` },
            { key: 'users', url: `${API_URL}/api/users` },
            { key: 'designations', url: `${API_URL}/api/employee-designations` },
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
              console.warn(`Failed to fetch ${key}:`, result.reason?.message);
            }
          });

          let fetchedSettings = { ...settings, ...(data.settings || {}) };
          setSettings(fetchedSettings);

          if (data.sales) {
            const cleaned = cleanData(data.sales, fetchedSettings);
            setSalesData(cleaned);
            if (cleaned.length === 0) {
              setShowNoDataModal(true);
            }
            setOfferOptions([...new Set(cleaned.flatMap(s => s.items.map(i => i.offer_description).filter(Boolean)))].sort());
            setDeliveryPersonOptions([...new Set(cleaned.map(s => s.deliveryPersonName).filter(Boolean))].sort());
          }

          if (data.print) setPrintSettings(data.print);
          else setPrintSettings(defaultPrintSettings);

          if (data.logo && data.logo.logo) setLogoUrl(API_URL + data.logo.logo);

          if (data.items && Array.isArray(data.items)) {
            setItemOptions(data.items.map(i => ({ name: i.item_name, category: i.item_group || "N/A" })));
            setCategoryOptions([...new Set(data.items.map(i => i.item_group))].filter(Boolean));
          }

          if (data.designations && Array.isArray(data.designations)) {
            const filterDesignations = data.designations.filter(d => d.show_in_sales_filter);
            setDesignations(filterDesignations);

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
        setError("Error fetching data: " + err.message);
      } finally {
        setLoading(false);
        setPermsLoading(false);
      }
    };

    initializeData();
  }, [baseUrl, configLoading]);

  const getCurrencyFormatter = (invoiceCurrency = null, invoicePrecision = null, asHtml = false, asReact = false) => {
    // Resolve currency: per-invoice first, then active company/branch context from currency_map
    const activeComp = selectedCompanies.length === 1 ? selectedCompanies[0] : (selectedCompanies.length > 1 ? 'All' : localStorage.getItem('active_company') || '');
    const activeBranch = filterBranches.length === 1 ? filterBranches[0] : localStorage.getItem('active_branch') || '';
    const currency = invoiceCurrency || resolveCurrencyCode(null, activeComp, activeBranch);
    const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : parseInt(settings.currencyPrecision) || 2;
    return {
      format: (value) => {
        const numValue = parseFloat(value) || 0;
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
            return `${symbols[currency?.toUpperCase()] || currency} ${fixedValue}`;
          }
        } else {
          const symbols = {
            INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥",
            SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
            QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
            CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
          };
          return `${symbols[currency?.toUpperCase()] || currency} ${fixedValue}`;
        }
      }
    };
  };

  const formatCurrency = (value, sale = null) => {
    const currency = sale?.invoice_currency || resolveCurrencyCode(null,
      selectedCompanies.length === 1 ? selectedCompanies[0] : (selectedCompanies.length > 1 ? 'All' : localStorage.getItem('active_company') || ''),
      filterBranches.length === 1 ? filterBranches[0] : localStorage.getItem('active_branch') || ''
    );
    const precision = sale?.invoice_currency_precision || settings.currencyPrecision;
    return getCurrencyFormatter(currency, precision, false, true).format(value);
  };

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
        console.error("Error re-fetching sales report:", err);
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
        console.error("Error fetching branches for companies in report:", err);
      }
    };

    fetchBranchesForCompanies();
  }, [selectedCompanies, baseUrl, isGroupAdmin]);

  const calculateAggregates = (sales) => {
    const currencyTotals = new Map();
    sales.forEach((sale) => {
      const sub = calculateSubtotal(sale);
      const vat = calculateVAT(sale);
      const grand = calculateGrandTotal(sale);
      const curr = sale.invoice_currency || settings.currency || 'AED';
      const prec = sale.invoice_currency_precision || settings.currencyPrecision || 2;
      if (!currencyTotals.has(curr)) currencyTotals.set(curr, { subtotal: 0, vat: 0, grand: 0, precision: prec });
      const t = currencyTotals.get(curr);
      t.subtotal += sub; t.vat += vat; t.grand += grand;
    });
    return { currencyTotals };
  };

  const filteredSales = salesData.filter((sale) => {
    const parseSDate = (s) => { const p = s.split('-'); return new Date(p[2], p[1] - 1, p[0]); };
    const sDate = parseSDate(sale.date);
    const from = fromDate ? new Date(fromDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const dateMatch = (!from && !to) || (from && !to && sDate >= from) || (!from && to && sDate <= to) || (from && to && sDate >= from && sDate <= to);

    let matchesTime = true;
    if (filterStartTime || filterEndTime) {
      const parseTime = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const saleT = parseTime(sale.time);
      if (filterStartTime && saleT < parseTime(filterStartTime)) matchesTime = false;
      if (filterEndTime && saleT > parseTime(filterEndTime)) matchesTime = false;
    }

    const matchesInvoice = !filterInvoiceNo || sale.invoice_no.toLowerCase().includes(filterInvoiceNo.toLowerCase());
    const matchesCustomer = !filterCustomer || (sale.customer || "").toLowerCase().includes(filterCustomer.toLowerCase());
    const matchesPhone = !filterPhone || (sale.phone || sale.customer_phone || "").includes(filterPhone);

    // Multi-select Matches
    const matchesItems = filterItems.length === 0 || (sale.items || []).some(i => filterItems.includes(i.item_name));
    const matchesCategories = filterCategories.length === 0 || (sale.items || []).some(i => filterCategories.includes(i.item_group || i.category));
    const matchesDelivery = filterDeliveryPersons.length === 0 || filterDeliveryPersons.includes(sale.deliveryPersonName);
    const matchesOffers = filterOffers.length === 0 || (sale.items || []).some(i => filterOffers.includes(i.offer_description || i.offer_name));

    // Order Type Matching (Multi-select)
    let matchesOrderTypes = filterOrderTypes.length === 0;
    if (!matchesOrderTypes) {
      const type = (sale.orderType || "").toUpperCase();
      matchesOrderTypes = filterOrderTypes.some(ft => {
        if (ft === "DIN") return type.includes("DIN") || type.includes("DINE");
        if (ft === "TAK") return type.includes("TAK") || type.includes("TAKE");
        if (ft === "OND") return type.includes("OND") || type.includes("ONLINE") || type.includes("DELIVERY");
        return type.includes(ft.toUpperCase());
      });
    }

    // Payment Mode Matching (Multi-select)
    let matchesPaymentModes = filterPaymentModes.length === 0;
    if (!matchesPaymentModes) {
      const pm = (sale.payments?.[0]?.mode_of_payment || sale.paymentMode || sale.payment_mode || "CASH").toUpperCase();
      matchesPaymentModes = filterPaymentModes.some(fpm => pm.includes(fpm.toUpperCase()));
    }

    // Dynamic Designation Filters
    let matchesDynamic = true;
    Object.entries(dynamicFilters).forEach(([designationName, selectedUserIds]) => {
      if (selectedUserIds.length > 0) {
        // Find if this sale matches any of the selected users for this designation
        const matchesThisDesignation = selectedUserIds.includes(sale.userId) ||
          selectedUserIds.includes(sale.bearerId) ||
          allEmployees.some(emp => selectedUserIds.includes(emp.userId) && (emp.name === sale.bearerName || emp.name === sale.deliveryPersonName));

        if (!matchesThisDesignation) matchesDynamic = false;
      }
    });

    const saleBranch = sale.branch_name || sale.branch;
    // Helper: detect if this sale is a company-level (no specific branch) record
    const isCompanyLevelSale = !saleBranch ||
      ['', 'all', 'all branches', 'global', 'unassigned', 'nan'].includes(String(saleBranch).trim().toLowerCase());

    let matchesBranch;
    if (filterBranches.length > 0) {
      // Branch explicitly selected → match only that branch
      matchesBranch = filterBranches.includes(saleBranch);
    } else if (selectedCompanies.length > 0) {
      // Company selected but NO branch → show only company-level (All Branches) sales
      matchesBranch = isCompanyLevelSale;
    } else {
      // No company/branch filter → show everything
      matchesBranch = true;
    }

    // Company match (client-side safety net for when backend returns mixed company data)
    const matchesCompany = selectedCompanies.length === 0 ||
      selectedCompanies.some(sc => {
        const sc_l = sc.trim().toLowerCase();
        const cn = (sale.company_name || sale.company || '').trim().toLowerCase();
        return cn === sc_l;
      });

    return dateMatch && matchesTime && matchesInvoice && matchesCustomer && matchesPhone &&
      matchesOrderTypes && matchesDelivery && matchesOffers &&
      matchesCategories && matchesItems && matchesPaymentModes && matchesDynamic && matchesBranch && matchesCompany;
  });


  const handleClearFilters = () => {
    setFromDate(null); setToDate(null);
    setFilterStartTime(""); setFilterEndTime("");
    setFilterInvoiceNo(""); setFilterCustomer("");
    setFilterPhone("");
    setFilterItems([]);
    setFilterCategories([]);
    setFilterOffers([]);
    setFilterOrderTypes([]);
    setFilterDeliveryPersons([]);
    setFilterPaymentModes([]);
    setFilterBranches([]);
    setSelectedCompanies([]);

    setDynamicFilters(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(k => newState[k] = []);
      return newState;
    });
  };

  const handleExportExcel = () => {
    const dataToExport = filteredSales.map(sale => ({
      "Invoice No": sale.invoice_no,
      "Date": sale.date,
      "Time": sale.time,
      "Order Type": sale.orderType || "N/A",
      "Total": calculateSubtotal(sale),
      "VAT Amount": calculateVAT(sale),
      "Grand Total": calculateGrandTotal(sale),
      "Employee": getEmployeeName(sale.userId)
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Sales_Report_${getFormattedDate(new Date())}.xlsx`);
  };

  if (permsLoading && loading) return <div className="text-center mt-5"><Spinner animation="border" /><p>Loading Sales Report...</p></div>;
  if (!canRead && !loading) return <div className="text-center mt-5"><div className="alert alert-danger">No Permission to view this report</div><Button variant="primary" onClick={() => navigate('/home')}>Go Home</Button></div>;

  const aggregates = calculateAggregates(filteredSales);

  return (
    <Container fluid className="sales-report-container pt-4">
      <div id="datepicker-portal" />

      <div className="d-flex justify-content-end align-items-center mb-4 no-print">

        <div className="d-flex gap-2">
          {(fromDate || toDate || filterInvoiceNo || filterCustomer || filterPhone || filterStartTime || filterEndTime ||
            filterItems.length > 0 || filterCategories.length > 0 ||
            filterDeliveryPersons.length > 0 || filterOrderTypes.length > 0 || filterOffers.length > 0 ||
            filterPaymentModes.length > 0 || filterBranches.length > 0 || selectedCompanies.length > 0 || Object.values(dynamicFilters).some(v => v.length > 0)) &&
            <Button variant="outline-secondary" onClick={handleClearFilters} className="back-btn"><FaEraser /> Clear</Button>}
          <Button variant="info" onClick={handleExportExcel} className="back-btn text-white"><FaFileExcel /> Excel</Button>
          <Button variant="danger" onClick={() => window.print()} className="back-btn"><FaFilePdf /> PDF</Button>
          <Button variant="primary" onClick={() => window.print()} className="back-btn"><FaPrint /> Print Report</Button>
          <Button variant="warning" onClick={() => navigate("/sales-kanban", { state: location.state })} className="back-btn text-white fw-bold">Kanban View</Button>
        </div>
      </div>

      <Form.Group className="mb-4 filter-grid no-print">
        <div className="filter-item">
          <Form.Label className="fw-bold">From Date:</Form.Label>
          <DatePicker
            selected={fromDate}
            onChange={setFromDate}
            dateFormat="dd-MM-yyyy"
            className="form-control"
            placeholderText="Select start date"
            isClearable
            todayButton="Today"
            portalId="datepicker-portal"
            popperProps={{ strategy: "fixed" }}
            popperPlacement="bottom-start"
          />
        </div>
        <div className="filter-item">
          <Form.Label className="fw-bold">To Date:</Form.Label>
          <DatePicker
            selected={toDate}
            onChange={setToDate}
            dateFormat="dd-MM-yyyy"
            className="form-control"
            minDate={fromDate}
            placeholderText="Select end date"
            isClearable
            todayButton="Today"
            portalId="datepicker-portal"
            popperProps={{ strategy: "fixed" }}
            popperPlacement="bottom-start"
          />
        </div>
        <div className="filter-item"> <Form.Label className="fw-bold">Start Time:</Form.Label> <Form.Control type="time" value={filterStartTime} onChange={e => setFilterStartTime(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} /> </div>
        <div className="filter-item"> <Form.Label className="fw-bold">End Time:</Form.Label> <Form.Control type="time" value={filterEndTime} onChange={e => setFilterEndTime(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} /> </div>

        <div className="filter-item"> <Form.Label className="fw-bold">Invoice No:</Form.Label> <Form.Control value={filterInvoiceNo} onChange={e => setFilterInvoiceNo(e.target.value)} placeholder="Filter by invoice no" /> </div>
        <div className="filter-item"> <Form.Label className="fw-bold">Customer Name:</Form.Label> <Form.Control value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} placeholder="Filter by customer" /> </div>
        <div className="filter-item"> <Form.Label className="fw-bold">Phone Number:</Form.Label> <Form.Control value={filterPhone} onChange={e => setFilterPhone(e.target.value)} placeholder="Filter by phone" /> </div>

        <CheckboxDropdown
          label="Item Name"
          options={itemOptions.map(i => ({ label: `${i.name} (${i.category})`, value: i.name }))}
          selectedValues={filterItems}
          onToggle={(val) => setFilterItems(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Items"
          showSearch={true}
        />

        <CheckboxDropdown
          label="Category"
          options={categoryOptions}
          selectedValues={filterCategories}
          onToggle={(val) => setFilterCategories(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Categories"
        />

        <CheckboxDropdown
          label="Offer Name"
          options={offerOptions}
          selectedValues={filterOffers}
          onToggle={(val) => setFilterOffers(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Offers"
        />

        <CheckboxDropdown
          label="Delivery Person"
          options={deliveryPersonOptions}
          selectedValues={filterDeliveryPersons}
          onToggle={(val) => setFilterDeliveryPersons(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Delivery Persons"
        />

        <CheckboxDropdown
          label="Order Type"
          options={[
            { label: "Dine In", value: "DIN" },
            { label: "Takeaway", value: "TAK" },
            { label: "Online Delivery", value: "OND" }
          ]}
          selectedValues={filterOrderTypes}
          onToggle={(val) => setFilterOrderTypes(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Types"
        />

        <CheckboxDropdown
          label="Payment Mode"
          options={["CASH", "CARD", "UPI"]}
          selectedValues={filterPaymentModes}
          onToggle={(val) => setFilterPaymentModes(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val])}
          placeholder="All Modes"
        />

        {/* Dynamic Designation Filters */}
        {designations.map((designation) => {
          const designationEmployees = allEmployees
            .filter(emp => (emp.employeeDesignation || emp.designation) === designation.name)
            .map(emp => ({
              label: emp.name || emp.firstName || emp.userId || "Unknown",
              value: emp.userId || emp.email || emp.username
            }));

          if (designationEmployees.length === 0) return null;

          return (
            <CheckboxDropdown
              key={designation.id}
              label={designation.name}
              options={designationEmployees}
              selectedValues={dynamicFilters[designation.name] || []}
              onToggle={(val) => {
                setDynamicFilters(prev => ({
                  ...prev,
                  [designation.name]: prev[designation.name].includes(val)
                    ? prev[designation.name].filter(v => v !== val)
                    : [...prev[designation.name], val]
                }));
              }}
              placeholder={`All ${designation.name}s`}
              showSearch={designationEmployees.length > 5}
              searchPlaceholder={`Search ${designation.name}...`}
            />
          );
        })}

        {isGroupAdmin && (
          <CheckboxDropdown
            label="Company"
            options={availableCompanies}
            selectedValues={selectedCompanies}
            onToggle={(val) => setSelectedCompanies(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
            placeholder="All Companies"
          />
        )}

        {(isGroupAdmin || isCompanyAdmin) && branches.length > 0 && (
          <CheckboxDropdown
            label="Branch"
            options={branches}
            selectedValues={filterBranches}
            onToggle={(val) => setFilterBranches(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])}
            placeholder="All Branches"
          />
        )}
      </Form.Group>

      <div className="print-header d-none d-print-block text-center mb-4">
        {logoUrl && <img src={logoUrl} alt="Logo" className="print-logo mb-3" />}
        <h2 className="fw-bold">{printSettings?.restaurantName || defaultPrintSettings.restaurantName}</h2>
        <p className="mb-1">{printSettings?.street || defaultPrintSettings.street}, {printSettings?.city || defaultPrintSettings.city}</p>
        <p className="mb-1">Phone: {printSettings?.phone || defaultPrintSettings.phone}</p>
        {printSettings?.gstin && <p className="mb-1">GSTIN: {printSettings.gstin}</p>}
        <hr />
        <h4 className="mt-3">SALES REPORT</h4>
        <p>{fromDate ? `From: ${getFormattedDate(fromDate)}` : ""} {toDate ? `To: ${getFormattedDate(toDate)}` : ""}</p>
      </div>

      <Card className="sales-card border-0">
        <Card.Body className="p-0 p-md-3">
          <div className="table-wrapper">
            <Table striped hover className="sales-table mb-0">
              <thead className="table-header">
                <tr> <th>Invoice No</th> <th>Date</th> <th>Time</th> <th>Order Type</th> {(isGroupAdmin || isCompanyAdmin) && <th>Company / Branch</th>} <th className="text-end">Total</th> <th className="text-end">VAT Amount</th> <th className="text-end">Grand Total</th> <th>Employee</th> </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.invoice_no}>
                    <td>{sale.invoice_no}</td> <td>{sale.date}</td> <td>{sale.time}</td> <td>{sale.orderType || "N/A"}</td>
                    {(isGroupAdmin || isCompanyAdmin) && (
                      <td>
                        {(!sale.branch_name && !sale.branch) || String(sale.branch_name || sale.branch).toLowerCase() === 'all' || String(sale.branch_name || sale.branch).toLowerCase() === 'all branches' 
                          ? (sale.company_name || sale.company || "Company Level")
                          : `${sale.company_name || sale.company || ""} - ${sale.branch_name || sale.branch || ""}`.replace(/^ - | - $/, "")}
                      </td>
                    )}
                    <td className="text-end">{formatCurrency(calculateSubtotal(sale), sale)}</td>
                    <td className="text-end">{formatCurrency(calculateVAT(sale), sale)}</td>
                    <td className="text-end">{formatCurrency(calculateGrandTotal(sale), sale)}</td>
                    <td>{getEmployeeName(sale.userId)}</td>
                  </tr>
                ))}
                {filteredSales.length === 0 && <tr><td colSpan={(isGroupAdmin || isCompanyAdmin) ? "9" : "8"} className="text-center">No results found</td></tr>}
              </tbody>
            </Table>
          </div>

          {filteredSales.length > 0 && (
            <div className="summary-print-container">
              {Array.from(aggregates.currencyTotals.entries()).map(([curr, totals]) => (
                <div key={curr} className="summary-print-row fw-bold">
                  <span className="summary-label">{curr} Total:</span>
                  <span className="summary-value">{getCurrencyFormatter(curr, totals.precision, false, true).format(totals.subtotal)}</span>
                  <span className="summary-value">{getCurrencyFormatter(curr, totals.precision, false, true).format(totals.vat)}</span>
                  <span className="summary-value">{getCurrencyFormatter(curr, totals.precision, false, true).format(totals.grand)}</span>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

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

export default SalesReport;
