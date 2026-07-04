import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
    Container,
    Card,
    Spinner,
    Button,
    Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./salesreport.css";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import CurrencySymbol from "../CurrencySymbol";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    FaArrowLeft,
    FaEraser
} from "react-icons/fa";
// Reusable Multi-select Checkbox Dropdown Component
const CheckboxDropdown = ({ label, options, selectedValues, onToggle, placeholder, searchPlaceholder, showSearch = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        else document.removeEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                                        <Form.Check type="checkbox" checked={isChecked} readOnly label={lbl} />
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

const SalesKanban = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
    const [filterOrderType, setFilterOrderType] = useState("");
    const [filterPaymentMode, setFilterPaymentMode] = useState("");
    const [branches, setBranches] = useState([]);
    const [filterBranches, setFilterBranches] = useState([]);
    const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
    const [isGroupAdmin, setIsGroupAdmin] = useState(false);
    const [availableCompanies, setAvailableCompanies] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);

    const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
    const [canRead, setCanRead] = useState(false);
    const [permsLoading, setPermsLoading] = useState(true);

    const [settings, setSettings] = useState({
        currency: 'AED',
        currencyPrecision: 2,
        dateFormat: 'dd-mm-yyyy',
        timeFormat: 'HH:mm:ss',
        timeZone: 'Asia/Dubai',
        useCurrencySymbol: false,
    });

    const navigate = useNavigate();
    const location = useLocation();

    // Robust Date Formatting
    const getFormattedDate = (dateInput, dateFormat = settings.dateFormat, timeZone = settings.timeZone) => {
        if (!dateInput) return '';
        let date;
        if (dateInput instanceof Date) { date = dateInput; }
        else if (typeof dateInput === 'string') {
            if (dateInput.includes('T')) {
                date = new Date(dateInput);
            } else {
                const parts = dateInput.split(/[-/]/);
                if (parts[0].length === 4) {
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
            }
        }
        else { return dateInput || ''; }
        if (isNaN(date.getTime())) return dateInput || '';

        const tzOptions = { timeZone: timeZone || 'UTC' };
        const numericFormatter = new Intl.DateTimeFormat('en', { ...tzOptions, year: 'numeric', month: '2-digit', day: 'numeric' });
        const parts = numericFormatter.formatToParts(date);
        const year = parts.find((p) => p.type === 'year')?.value || '';
        const month = parts.find((p) => p.type === 'month')?.value || '';
        const day = parts.find((p) => p.type === 'day')?.value || '';

        switch (dateFormat) {
            case 'dd-mm-yyyy': return `${day.padStart(2, '0')}-${month}-${year}`;
            case 'yyyy-mm-dd': return `${year}-${month}-${day.padStart(2, '0')}`;
            default: return `${day.padStart(2, '0')}-${month}-${year}`;
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
        const fetchData = async () => {
            setLoading(true);
            try {
                let userObj = null;
                let userRole = null;
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    userObj = JSON.parse(userStr);
                    userRole = userObj.role;
                    const API_URL = baseUrl || "";
                    const lowRole = userRole?.toLowerCase().replace(/[\s_]+/g, '');
                    const isGroup = lowRole === 'superadmin' || lowRole === 'groupadmin' || lowRole === 'tenantadmin';
                    const isComp = (lowRole === 'companyadmin' || lowRole === 'admin') && !userObj.branch && !userObj.branch_name;

                    setIsGroupAdmin(isGroup);
                    setIsCompanyAdmin(isComp);

                    const response = await axios.get(`${API_URL}/api/role-permissions?role=${userRole}`);
                    const perms = response.data.permissions || [];
                    const pagePerm = perms.find(p => p.pageId === 'sales_report') || perms.find(p => p.pageId === 'pos');

                    if (pagePerm && pagePerm.canRead) {
                        setCanRead(true);
                        const endpoints = [
                            { key: 'settings', url: `${API_URL}/api/settings` },
                            {
                                key: 'branches',
                                url: `${API_URL}/api/branches`,
                                headers: userObj?.company ? { 'X-Company-Name': userObj.company } : {}
                            }
                        ];
                        const results = await Promise.allSettled(endpoints.map(ep => axios.get(ep.url, { headers: ep.headers || {} })));
                        const data = {};
                        results.forEach((r, i) => { if (r.status === 'fulfilled') data[endpoints[i].key] = r.value.data; });

                        if (data.settings) setSettings({ ...settings, ...data.settings });
                        if (data.branches && Array.isArray(data.branches)) {
                            setBranches(data.branches.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)));
                        }

                        if (isGroup) {
                            try {
                                const compRes = await axios.get(`${API_URL}/api/user-companies`, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                });
                                const comps = compRes.data.companies || (Array.isArray(compRes.data) ? compRes.data : []);
                                setAvailableCompanies([...new Set(comps.map(c => c.company_name || c.company).filter(Boolean))].sort());
                            } catch (err) {
                                console.error("Failed to fetch companies:", err);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Kanban Init Error", err);
            } finally {
                setLoading(false);
                setPermsLoading(false);
            }
        };
        fetchData();
    }, [baseUrl, configLoading]);

    // RE-FETCH Sales data when company/branch filters change
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
                setSalesData(cleanData(response.data));
            } catch (err) {
                console.error("Error re-fetching sales kanban:", err);
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
                console.error("Error fetching branches in kanban:", err);
            }
        };
        fetchBranchesForCompanies();
    }, [selectedCompanies, baseUrl, isGroupAdmin]);

    const getCurrencyFormatter = (invoiceCurrency = null, invoicePrecision = null, asHtml = false, asReact = false) => {
        const currency = invoiceCurrency || settings.currency || 'AED';
        const precision = invoicePrecision !== null ? parseInt(invoicePrecision) : parseInt(settings.currencyPrecision) || 2;
        const useSymbol = true; // Force useSymbol
        return {
            format: (value) => {
                const numValue = parseFloat(value) || 0;
                const fixedValue = numValue.toFixed(precision);
                if (useSymbol) {
                    if (currency?.toUpperCase() === 'AED' && asHtml) {
                        return `<img src="/assets/Dirham Currency Symbol - Black.svg" style="height: 12px; vertical-align: middle; margin-right: 2px; filter: brightness(0.1);" alt="AED"/> ${fixedValue}`;
                    }
                    if (asReact) {
                        return (
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '2px', transform: 'translateY(1px)' }}>
                                    <CurrencySymbol currencyCode={currency} size={14} />
                                </span>
                                {fixedValue}
                            </span>
                        );
                    }
                    const symbols = {
                        INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥",
                        SGD: "$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
                        QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "$", AUD: "$", NZD: "$",
                        CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦"
                    };
                    const symbolStr = symbols[currency?.toUpperCase()] || currency;
                    return `${symbolStr} ${fixedValue}`;
                } else {
                    return `${currency} ${fixedValue}`;
                }
            }
        };
    };

    const formatCurrency = (value, sale = null) => {
        const currency = settings.currency || "AED";
        const precision = settings.currencyPrecision || 2;
        return getCurrencyFormatter(currency, precision, false, true).format(value);
    };

    const calculateGrandTotal = (sale) => {
        if (sale.grand_total && parseFloat(sale.grand_total) > 0) return parseFloat(sale.grand_total);
        if (sale.grandTotal && parseFloat(sale.grandTotal) > 0) return parseFloat(sale.grandTotal);
        const subtotal = (sale.total && parseFloat(sale.total) > 0) ? parseFloat(sale.total) : (sale.items || []).reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.quantity || 1)), 0);
        return subtotal + (parseFloat(sale.vat_amount) || 0);
    };

    const filteredSales = salesData.filter((sale) => {
        const parseSDate = (s) => { const p = s.split('-'); return new Date(p[2], p[1] - 1, p[0]); };
        const sDate = parseSDate(sale.date);
        const from = fromDate ? new Date(fromDate) : null;
        if (from) from.setHours(0, 0, 0, 0);
        const to = toDate ? new Date(toDate) : null;
        if (to) to.setHours(23, 59, 59, 999);

        if ((from && sDate < from) || (to && sDate > to)) return false;

        const matchesInvoice = !filterInvoiceNo || sale.invoice_no.toLowerCase().includes(filterInvoiceNo.toLowerCase());

        // Improved Order Type Matching
        let matchesOrderType = true;
        if (filterOrderType) {
            const type = (sale.orderType || "").toUpperCase();
            if (filterOrderType === "DIN") {
                matchesOrderType = type.includes("DIN") || type.includes("DINE");
            } else if (filterOrderType === "TAK") {
                matchesOrderType = type.includes("TAK") || type.includes("TAKE");
            } else if (filterOrderType === "OND") {
                matchesOrderType = type.includes("OND") || type.includes("ONLINE") || type.includes("DELIVERY");
            } else {
                matchesOrderType = type.includes(filterOrderType.toUpperCase());
            }
        }

        // Payment Mode Filter (Used for row-level filtering)
        let matchesPaymentMode = true;
        if (filterPaymentMode) {
            const pm = (sale.payments?.[0]?.mode_of_payment || sale.paymentMode || sale.payment_mode || "CASH").toUpperCase();
            matchesPaymentMode = pm.includes(filterPaymentMode.toUpperCase());
        }

        return matchesInvoice && matchesOrderType && matchesPaymentMode;
    });

    // Static Column Definitions
    const allColumns = [
        { id: "TAK", title: "Takeaway", type: "orderType", search: ["TAK", "TAKE", "AWAY"] },
        { id: "DIN", title: "Dine In", type: "orderType", search: ["DIN", "DINE"] },
        { id: "OND", title: "Online Delivery", type: "orderType", search: ["OND", "ONLINE", "DELIVERY"] },
        { id: "CASH", title: "Cash", type: "paymentMode", search: ["CASH"] },
        { id: "UPI", title: "UPI", type: "paymentMode", search: ["UPI"] },
        { id: "CARD", title: "Card", type: "paymentMode", search: ["CARD", "DEBIT", "CREDIT"] }
    ];

    // UPDATED DYNAMIC COLUMN FILTERING:
    const activeColumns = allColumns.filter(col => {
        const hasOrderFilter = !!filterOrderType;
        const hasPaymentFilter = !!filterPaymentMode;

        if (hasOrderFilter && hasPaymentFilter) {
            return col.id === filterOrderType || col.id === filterPaymentMode;
        }
        if (hasOrderFilter) {
            return col.id === filterOrderType;
        }
        if (hasPaymentFilter) {
            return col.id === filterPaymentMode;
        }
        return true; // Show all if no filters
    });

    if (permsLoading || loading) return <div className="text-center mt-5"><Spinner animation="border" /><p>Loading Sales Kanban...</p></div>;
    if (!canRead) return <Container className="text-center mt-5"><div className="alert alert-danger">No Permission</div><Button onClick={() => navigate('/home')}>Home</Button></Container>;

    return (
        <Container fluid className="sales-report-container pt-4">
            <div id="datepicker-portal" />

            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <Button variant="outline-primary" onClick={() => navigate("/sales-reports", { state: location.state })} className="back-btn"><FaArrowLeft /> Back</Button>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => {
                        setFromDate(null); setToDate(null); setFilterInvoiceNo(""); setFilterOrderType(""); setFilterPaymentMode("");
                        setFilterBranches([]); setSelectedCompanies([]);
                    }} className="back-btn"><FaEraser /> Clear</Button>
                    <Button variant="success" onClick={() => navigate("/sales-reports", { state: location.state })} className="back-btn text-white fw-bold">Table View</Button>
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
                <div className="filter-item"> <Form.Label className="fw-bold">Invoice No:</Form.Label> <Form.Control value={filterInvoiceNo} onChange={e => setFilterInvoiceNo(e.target.value)} placeholder="INV-..." /> </div>
                <div className="filter-item">
                    <Form.Label className="fw-bold">Order Type:</Form.Label>
                    <Form.Select value={filterOrderType} onChange={e => setFilterOrderType(e.target.value)}>
                        <option value="">All</option>
                        <option value="DIN">Dine In</option>
                        <option value="TAK">Takeaway</option>
                        <option value="OND">Online Delivery</option>
                    </Form.Select>
                </div>
                <div className="filter-item">
                    <Form.Label className="fw-bold">Payment Mode:</Form.Label>
                    <Form.Select value={filterPaymentMode} onChange={e => setFilterPaymentMode(e.target.value)}>
                        <option value="">All</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                    </Form.Select>
                </div>

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

            <div className="kanban-board-container">
                <div className="kanban-board">
                    {activeColumns.map(col => {
                        const colSales = filteredSales.filter(sale => {
                            const ot = (sale.orderType || "").toUpperCase();
                            const pm = (sale.payments?.[0]?.mode_of_payment || sale.paymentMode || sale.payment_mode || "CASH").toUpperCase();
                            const match = (val, terms) => terms.some(t => val.includes(t));
                            return col.type === "orderType" ? match(ot, col.search) : match(pm, col.search);
                        });
                        return (
                            <div key={col.id} className="kanban-column">
                                <h5 className="kanban-column-header">{col.title} ({colSales.length})</h5>
                                <div className="kanban-cards">
                                    {colSales.map(sale => (
                                        <div key={sale.invoice_no} className="kanban-card">
                                            <div className="kanban-card-invoice">#{sale.invoice_no}</div>
                                            <div className="kanban-card-details d-flex justify-content-between">
                                                <span className="kanban-card-date">{sale.date}</span>
                                                <span className="kanban-card-time">{sale.time}</span>
                                            </div>
                                            <div className="kanban-card-footer d-flex justify-content-between align-items-center mt-2">
                                                <span className="kanban-card-payment badge bg-info text-dark">{sale.payments?.[0]?.mode_of_payment || sale.paymentMode || "CASH"}</span>
                                                <span className="kanban-card-total fw-bold text-primary">{formatCurrency(calculateGrandTotal(sale), sale)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {colSales.length === 0 && <div className="kanban-empty">No sales</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Container>
    );
};

export default SalesKanban;
