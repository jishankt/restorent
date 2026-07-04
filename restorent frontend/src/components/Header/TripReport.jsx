// TripReport.jsx - COMPLETE FIXED VERSION
// ✅ Date filtering fixed - extracts from timestamp/created_at fields
// ✅ Full-page scrolling enabled
// ✅ All syntax errors fixed
// ✅ Dynamic currency support
// ✅ Payment management with balance tracking
// ✅ Delivery Person Dropdown fixed (fetching from correct endpoint)

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import { FaArrowLeft } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TripReport.css';

function TripReport() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [employees, setEmployees] = useState([]); // Will store only delivery boys
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [tripReports, setTripReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [billNumber, setBillNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [warningMessage, setWarningMessage] = useState('');
    const [warningType, setWarningType] = useState('warning');
    const [vatRate, setVatRate] = useState(0.10);
    const [currency, setCurrency] = useState("INR");
    const [useCurrencySymbol, setUseCurrencySymbol] = useState(false);
    const API_URL = '';

    const getCurrencySymbol = (currCode) => {
        const symbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'AED': 'د.إ',
            'JPY': '¥',
            'CNY': '¥',
            'SGD': '$',
            'MYR': 'RM',
            'THB': '฿',
            'IDR': 'Rp',
            'KRW': '₩',
            'PHP': '₱',
            'SAR': '﷼',
            'QAR': '﷼',
            'KWD': 'د.ك',
            'OMR': '﷼',
            'BHD': '.د.ب',
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
        return symbols[currCode?.toUpperCase()] || '₹';
    };

    // Permissions
    const [canRead, setCanRead] = useState(false);
    const [canWrite, setCanWrite] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [canCreate, setCanCreate] = useState(false);

    // Context for global config
    const { baseUrl, configLoading } = useContext(UserContext);


    // Consolidated initial data fetching
    useEffect(() => {
        if (configLoading) return;

        const initializeData = async () => {
            try {
                const apiBase = baseUrl || "";
                // Parallelize meta-data
                const [permsRes, vatRes, settingsRes] = await Promise.all([
                    fetchPermissions(),
                    axios.get(`${apiBase}/api/get-vat`),
                    axios.get(`${apiBase}/api/settings`)
                ]);

                if (vatRes.data) {
                    setVatRate(vatRes.data.vat / 100 || 0.10);
                }
                if (settingsRes.data) {
                    setCurrency(settingsRes.data.currency?.toUpperCase() || "INR");
                    setUseCurrencySymbol(settingsRes.data.useCurrencySymbol || false);
                }

                // Initial business data
                await fetchEmployees();
            } catch (error) {
                console.error("Error in TripReport parallel fetch:", error);
            }
        };

        initializeData();
    }, [baseUrl, configLoading]);

    const fetchPermissions = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const userObj = JSON.parse(userStr);
            const role = userObj.role;
            if (!role) return;

            const url = `${baseUrl}/api/role-permissions?role=${role}`;
            const response = await axios.get(url);
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'trip_report');
            if (pagePerm) {
                setCanRead(pagePerm.canRead === true);
                setCanWrite(pagePerm.canWrite === true);
                setCanDelete(pagePerm.canDelete === true);
                setCanCreate(pagePerm.canCreate === true);
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
        }
    };

    const generateShortUUID = () => {
        return uuidv4().slice(0, 8);
    };

    // UPDATED: Fetch only delivery employees
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            // Use specialized endpoint for delivery employees
            const response = await axios.get(`${baseUrl}/api/delivery-employees`);
            const data = Array.isArray(response.data) ? response.data : [];

            // Filter just to be safe, ensuring only delivery boys are included
            const deliveryBoys = data.filter(emp => emp.role && emp.role.toLowerCase() === 'delivery boy');

            setEmployees(deliveryBoys);
        } catch (err) {
            setError(`Failed to fetch employees: ${err.message}`);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTripReports = async (employeeId, date, billNo, custName) => {
        if (!employeeId || !date) return;
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${baseUrl}/api/tripreports/${employeeId}`);
            const data = Array.isArray(response.data) ? response.data : [];
            const sanitizedReports = data.map((report) => {
                let paymentAmounts = { Cash: 0, Card: 0, UPI: 0 };
                let tenderedAmount = report.tenderedAmount || '';
                let changeAmount = report.change || 0;
                let cardDetails = report.cardDetails || '';
                let upiDetails = report.upiDetails || '';
                let paymentMethods = [];
                if (Array.isArray(report.payments)) {
                    report.payments.forEach((p) => {
                        const method = p.mode_of_payment;
                        if (['Cash', 'Card', 'UPI'].includes(method)) {
                            paymentAmounts[method] = Number(p.amount) || 0;
                            if (method === 'Cash') {
                                tenderedAmount = p.tenderedAmount || '';
                                changeAmount = Number(p.change) || 0;
                            } else if (method === 'Card') {
                                cardDetails = p.cardNumber || p.cardDetails || '';
                            } else if (method === 'UPI') {
                                upiDetails = p.upiId || p.upiDetails || '';
                            }
                            if (Number(p.amount) > 0) paymentMethods.push(method);
                        }
                    });
                }
                const sanitizedCartItems = Array.isArray(report.cartItems)
                    ? report.cartItems.map((item) => {
                        let exclTotal = Number(item.excl_amount) || Number(item.exclTotal) || 0;
                        let taxTotal = Number(item.tax_amount) || Number(item.taxTotal) || 0;
                        const qty = Number(item.quantity) || 1;
                        const amount = Number(item.amount) || 0;
                        if ((exclTotal + taxTotal) === 0 && amount > 0) {
                            const unitIncl = amount / qty;
                            exclTotal = unitIncl / (1 + vatRate);
                            taxTotal = unitIncl - exclTotal;
                        }
                        return {
                            ...item,
                            id: item.id || uuidv4(),
                            item_name: item.item_name || item.name || 'Unknown',
                            name: item.name || item.item_name || 'Unknown',
                            quantity: qty,
                            basePrice: Number(item.basePrice) || (amount / qty) || 0,
                            totalPrice: amount || ((exclTotal + taxTotal) * qty) || 0,
                            exclTotal,
                            taxTotal,
                            taxBreakdown: item.tax_breakdown || item.taxBreakdown || {},
                            selectedSize: item.selectedSize || 'M',
                            icePreference: item.icePreference || 'without_ice',
                            icePrice: Number(item.icePrice) || 0,
                            isSpicy: item.isSpicy || false,
                            spicyPrice: Number(item.spicyPrice) || 0,
                            kitchen: item.kitchen || 'Main Kitchen',
                            addonQuantities: item.addonQuantities || {},
                            addonVariants: item.addonVariants || {},
                            addonPrices: item.addonPrices || {},
                            comboQuantities: item.comboQuantities || {},
                            comboVariants: item.comboVariants || {},
                            comboPrices: item.comboPrices || {},
                            addons: Array.isArray(item.addons) ? item.addons : [],
                            selectedCombos: Array.isArray(item.selectedCombos) ? item.selectedCombos : [],
                            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                            requiredKitchens: Array.isArray(item.requiredKitchens) ? item.requiredKitchens : [],
                            kitchenStatuses: item.kitchenStatuses || {},
                        };
                    })
                    : [];
                return {
                    ...report,
                    orderNo: report.orderNo || report.invoice_no || 'N/A',
                    tripId: report._id || uuidv4(),
                    status: report.status || 'Pending',
                    chairsBooked: Array.isArray(report.chairsBooked) ? report.chairsBooked : [],
                    cartItems: sanitizedCartItems,
                    pickedUpTime: report.pickedUpTime || null,
                    paymentMethods,
                    paymentAmounts,
                    tenderedAmount,
                    change: changeAmount,
                    cardDetails,
                    upiDetails,
                    email: report.email || 'N/A',
                    customerName: report.customer || 'N/A',
                    timestamp: report.timestamp || report.date,
                    deliveryPersonName: report.deliveryPersonName || selectedEmployee?.name || 'Unknown',
                };
            });
            console.log('Sanitized reports:', sanitizedReports);
            setTripReports(sanitizedReports);
            filterReportsByDate(sanitizedReports, date, billNo, custName);
        } catch (err) {
            setError(`Failed to fetch trip reports: ${err.message}`);
            setTripReports([]);
            setFilteredReports([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Date filtering now extracts from timestamp/created_at
    const filterReportsByDate = (reports, date, billNo, custName) => {
        console.log('Filtering reports by date:', date, 'billNo:', billNo, 'custName:', custName);
        if (!date) {
            setFilteredReports([]);
            return;
        }
        let filtered = reports.filter((report) => {
            let reportDate = '';
            if (report.timestamp) {
                reportDate = report.timestamp.split('T')[0];
            } else if (report.created_at) {
                reportDate = report.created_at.split('T')[0];
            }
            console.log('Report date extracted:', reportDate, 'comparing with:', date);
            return reportDate === date;
        });
        if (billNo) {
            filtered = filtered.filter((report) => report.orderNo.toLowerCase().includes(billNo.toLowerCase()));
        }
        if (custName) {
            filtered = filtered.filter((report) =>
                report.customerName && report.customerName.toLowerCase().includes(custName.toLowerCase())
            );
        }
        console.log('Filtered reports:', filtered);
        setFilteredReports(filtered);
    };

    const calculateSubtotal = (cartItems) => {
        if (!Array.isArray(cartItems)) return 0;
        return cartItems.reduce((sum, item) => sum + ((Number(item.exclTotal) || 0) * (Number(item.quantity) || 1)), 0);
    };

    const calculateTotalVat = (cartItems) => {
        if (!Array.isArray(cartItems)) return 0;
        return cartItems.reduce((sum, item) => sum + ((Number(item.taxTotal) || 0) * (Number(item.quantity) || 1)), 0);
    };

    const calculateGrandTotal = (cartItems) => {
        if (!Array.isArray(cartItems)) return 0;
        const subtotal = calculateSubtotal(cartItems);
        const vat = calculateTotalVat(cartItems);
        let total = (subtotal + vat).toFixed(2);
        if (parseFloat(total) === 0) {
            total = cartItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2);
        }
        return total;
    };

    const calculateTotalPaid = (paymentAmounts) => {
        return Object.values(paymentAmounts).reduce((sum, amt) => sum + (Number(amt) || 0), 0);
    };

    const getBalance = (report) => {
        const grandTotal = parseFloat(calculateGrandTotal(report.cartItems));
        const totalPaid = calculateTotalPaid(report.paymentAmounts);
        return Math.max(0, grandTotal - totalPaid).toFixed(2);
    };

    const markAsDelivered = async (report) => {
        if (report.status === 'Delivered') {
            setWarningMessage('Payment is already received for this order.');
            setWarningType('warning');
            return;
        }
        const grandTotalNum = parseFloat(calculateGrandTotal(report.cartItems));
        const totalPaid = calculateTotalPaid(report.paymentAmounts);
        if (totalPaid < grandTotalNum - 0.01) {
            setWarningMessage(`Insufficient payment. Total Paid: ${getCurrencySymbol(currency)}${totalPaid.toFixed(2)}, Required: ${getCurrencySymbol(currency)}${grandTotalNum.toFixed(2)}`);
            setWarningType('warning');
            return;
        }
        try {
            const payments = [];
            ['Cash', 'Card', 'UPI'].forEach((method) => {
                const amount = Number(report.paymentAmounts[method]) || 0;
                if (amount > 0) {
                    let payObj = {
                        mode_of_payment: method,
                        amount: amount,
                    };
                    if (method === 'Cash') {
                        const tendered = parseFloat(report.tenderedAmount) || amount;
                        payObj.tenderedAmount = tendered;
                        payObj.change = Math.max(0, tendered - amount);
                    } else if (method === 'Card' && report.cardDetails) {
                        payObj.cardNumber = report.cardDetails;
                    } else if (method === 'UPI' && report.upiDetails) {
                        payObj.upiId = report.upiDetails;
                    }
                    payments.push(payObj);
                }
            });
            if (payments.length === 0) {
                setWarningMessage('No payment entered.');
                setWarningType('warning');
                return;
            }
            const payload = {
                orderNo: report.orderNo,
                status: 'Delivered',
                payments: payments,
            };
            await axios.post(`${baseUrl}/api/sales/deliver-order`, payload);
            setWarningMessage('Order marked as Payment Received successfully with payment details.');
            setWarningType('success');
            if (selectedEmployee && selectedDate) {
                fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, customerName);
            }
        } catch (err) {
            setError(`Failed to mark as Payment Received: ${err.message}`);
            setWarningType('warning');
        }
    };

    const handlePaymentAmountChange = (reportId, method, value) => {
        const report = filteredReports.find((r) => r.tripId === reportId);
        if (report?.status === 'Delivered') {
            setWarningMessage('Cannot edit payments for an order where payment is already received.');
            setWarningType('warning');
            return;
        }
        const numValue = value === '' ? 0 : parseFloat(value);
        setFilteredReports((prevReports) =>
            prevReports.map((r) => {
                if (r.tripId === reportId) {
                    const newAmounts = { ...r.paymentAmounts, [method]: numValue };
                    let newTendered = r.tenderedAmount;
                    let newChange = r.change;
                    let newCardDetails = r.cardDetails;
                    let newUpiDetails = r.upiDetails;
                    if (numValue === 0) {
                        if (method === 'Cash') newTendered = '';
                        if (method === 'Card') newCardDetails = '';
                        if (method === 'UPI') newUpiDetails = '';
                    }
                    return {
                        ...r,
                        paymentAmounts: newAmounts,
                        ...(method === 'Cash' ? { tenderedAmount: newTendered, change: newChange } : {}),
                        ...(method === 'Card' ? { cardDetails: newCardDetails } : {}),
                        ...(method === 'UPI' ? { upiDetails: newUpiDetails } : {}),
                    };
                }
                return r;
            })
        );
    };

    const handleTenderedChange = (reportId, value) => {
        const report = filteredReports.find((r) => r.tripId === reportId);
        if (report?.status === 'Delivered') {
            setWarningMessage('Cannot edit details for an order where payment is already received.');
            setWarningType('warning');
            return;
        }
        const cashAmt = Number(report.paymentAmounts.Cash) || 0;
        const tendered = value === '' ? 0 : parseFloat(value);
        const ch = Math.max(0, tendered - cashAmt);
        setFilteredReports((prevReports) =>
            prevReports.map((r) =>
                r.tripId === reportId ? { ...r, tenderedAmount: value, change: ch } : r
            )
        );
    };

    const handlePaymentDetailsInput = (reportId, field, value) => {
        const report = filteredReports.find((r) => r.tripId === reportId);
        if (report?.status === 'Delivered') {
            setWarningMessage('Cannot edit details for an order where payment is already received.');
            setWarningType('warning');
            return;
        }
        setFilteredReports((prevReports) =>
            prevReports.map((report) => {
                if (report.tripId === reportId) {
                    return {
                        ...report,
                        [field]: value,
                    };
                }
                return report;
            })
        );
    };

    // Initialize state from URL params
    useEffect(() => {
        const empId = searchParams.get('employeeId');
        const date = searchParams.get('date');
        if (empId && date && employees.length > 0) {
            const emp = employees.find((e) => e.employeeId === empId);
            if (emp) {
                setSelectedEmployee(emp);
                setSelectedDate(date);
                fetchTripReports(empId, date, '', '');
                setWarningMessage(`Loaded trip report for ${emp.name} on ${date}`);
                setWarningType('success');
            }
        }
    }, [searchParams, employees]);

    // Replaced custom search handler with simple select handler
    const handleEmployeeSelectChange = (e) => {
        const empId = e.target.value;
        if (!empId) {
            setSelectedEmployee(null);
            setTripReports([]);
            setFilteredReports([]);
            return;
        }
        const emp = employees.find(e => e.employeeId === empId);
        setSelectedEmployee(emp);
        setWarningMessage('');
        // Trigger fetch if date is already selected
        if (selectedDate) {
            fetchTripReports(empId, selectedDate, billNumber, customerName);
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        setWarningMessage('');
        if (selectedEmployee && date) {
            fetchTripReports(selectedEmployee.employeeId, date, billNumber, customerName);
        }
    };

    const handleBillNumberChange = (e) => {
        const billNo = e.target.value;
        setBillNumber(billNo);
        setWarningMessage('');
        if (selectedEmployee && selectedDate) {
            fetchTripReports(selectedEmployee.employeeId, selectedDate, billNo, customerName);
        }
    };

    const handleCustomerNameChange = (e) => {
        const custName = e.target.value;
        setCustomerName(custName);
        setWarningMessage('');
        if (selectedEmployee && selectedDate) {
            fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, custName);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setWarningMessage('');
        if (!selectedEmployee) {
            setWarningMessage('Please select delivery person');
            setWarningType('warning');
            return;
        }
        if (!selectedDate) {
            setWarningMessage('Please select a date');
            setWarningType('warning');
            return;
        }
        fetchTripReports(selectedEmployee.employeeId, selectedDate, billNumber, customerName);
        setWarningMessage(
            `Delivery Person Selected: ${selectedEmployee.name} for date ${selectedDate}${billNumber ? `, Bill No: ${billNumber}` : ''}${customerName ? `, Customer: ${customerName}` : ''}`
        );
        setWarningType('success');
    };

    const handleBack = () => {
        navigate('/home');
    };

    const handleShowDetails = (report) => {
        setSelectedReport(report);
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedReport(null);
    };

    const handleWarningOk = () => {
        setWarningMessage('');
        setWarningType('warning');
    };

    const handleWarningCancel = () => {
        setWarningMessage('');
        setWarningType('warning');
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    const formatPrice = (price) => {
        const symbol = useCurrencySymbol ? getCurrencySymbol(currency) : `${currency} `;
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice === 0) return `${symbol}0.00`;
        return `${symbol}${numPrice.toFixed(2)}`;
    };

    const calculatePendingGrandTotal = () => {
        return filteredReports
            .filter((report) => report.status !== 'Delivered')
            .reduce((sum, report) => {
                const gt = parseFloat(calculateGrandTotal(report.cartItems));
                const paid = calculateTotalPaid(report.paymentAmounts);
                return sum + Math.max(0, gt - paid);
            }, 0)
            .toFixed(2);
    };

    const calculateOverallGrandTotal = () => {
        return filteredReports.reduce((sum, report) => {
            return sum + parseFloat(calculateGrandTotal(report.cartItems));
        }, 0).toFixed(2);
    };

    const calculateTotalCollected = () => {
        return filteredReports.reduce((sum, report) => {
            return sum + calculateTotalPaid(report.paymentAmounts);
        }, 0).toFixed(2);
    };

    const renderAddonsInPopup = (item) => {
        const addons = item.addons || [];
        const addonQuantities = item.addonQuantities || {};
        const addonVariants = item.addonVariants || {};
        const addonPrices = item.addonPrices || {};

        if ((!addons || addons.length === 0) && Object.keys(addonQuantities).length === 0) return null;

        // If we have an array of addons (common for web/delivery apps)
        if (addons.length > 0) {
            return (
                <ul className="list-unstyled ms-3 mt-1">
                    {addons.map((addon, aIdx) => (
                        <li key={aIdx} className="text-muted small">
                            + {addon.addon_name || addon.name1 || addon.name || "Addon"} {addon.size ? `(${addon.size})` : ''} x{addon.addon_quantity} - {formatPrice((addon.addon_price * addon.addon_quantity) || 0)}
                        </li>
                    ))}
                </ul>
            );
        }

        // If we have structured quantities (common for POS/Internal orders)
        return (
            <ul className="list-unstyled ms-3 mt-1">
                {Object.entries(addonQuantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([name, qty], idx) => (
                        <li key={idx} className="text-muted small">
                            + {name} {addonVariants[name]?.size ? `(${addonVariants[name].size})` : ''} x{qty} - {formatPrice((addonPrices[name] || 0) * qty)}
                        </li>
                    ))}
            </ul>
        );
    };

    const renderCombosInPopup = (item) => {
        const selectedCombos = item.selectedCombos || [];
        const comboQuantities = item.comboQuantities || {};
        const comboVariants = item.comboVariants || {};
        const comboPrices = item.comboPrices || {};

        if ((!selectedCombos || selectedCombos.length === 0) && Object.keys(comboQuantities).length === 0) return null;

        if (selectedCombos.length > 0) {
            return (
                <ul className="list-unstyled ms-3 mt-1">
                    {selectedCombos.map((combo, cIdx) => (
                        <li key={cIdx} className="text-info small">
                            + {combo.combo_name || combo.name1 || combo.name || "Combo"} {combo.size ? `(${combo.size})` : ''} x{combo.combo_quantity} - {formatPrice((combo.combo_price * combo.combo_quantity) || 0)}
                        </li>
                    ))}
                </ul>
            );
        }

        return (
            <ul className="list-unstyled ms-3 mt-1">
                {Object.entries(comboQuantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([name, qty], idx) => (
                        <li key={idx} className="text-info small">
                            + {name} {comboVariants[name]?.size ? `(${comboVariants[name].size})` : ''} x{qty} - {formatPrice((comboPrices[name] || 0) * qty)}
                        </li>
                    ))}
            </ul>
        );
    };

    const renderIngredientsInPopup = (ingredients) => {
        if (!ingredients || ingredients.length === 0) return null;
        return (
            <ul className="list-unstyled ms-3 mt-1">
                {ingredients.map((ing, idx) => (
                    <li key={idx} className="text-muted small">
                        - {ing.name}: {ing.custom_weight || ing.weight || "N/A"}g ({formatPrice(ing.calculated_price || ing.base_price || 0)})
                    </li>
                ))}
            </ul>
        );
    };

    if (loading || configLoading) {
        return (
            <div className="trip-main-loading text-center text-muted fs-5 my-3">
                Loading Trip Report Data...
            </div>
        );
    }

    if (!canRead) {
        return (
            <div className="trip-main container text-center mt-5">
                <div className="alert alert-danger">
                    <h3>Access Denied</h3>
                    <p>You do not have permission to view Trip Reports.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate("/home")}>
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="trip-main">
            {warningMessage && (
                <div
                    className={`trip-main-alert alert-${warningType === 'success' ? 'success' : 'warning'} position-fixed top-50 start-50 translate-middle shadow z-3 p-4 rounded-3 text-center`}
                    style={{ minWidth: '400px', maxWidth: '600px' }}
                >
                    {warningMessage}
                    <div className="d-flex justify-content-center gap-2 mt-3">
                        <button className="btn btn-success" onClick={handleWarningOk}>
                            OK
                        </button>
                        <button className="btn btn-danger" onClick={handleWarningCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {error && (
                <div className="trip-main-error alert alert-danger my-3 text-center">
                    {error}
                </div>
            )}
            <div className="trip-main-header d-flex align-items-center mb-4">
                <FaArrowLeft
                    className="trip-main-back-button fs-3 me-3"
                    onClick={handleBack}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleBack()}
                />
                <h1 className="trip-main-title h3 mb-0">Delivery Person Trip Report</h1>
            </div>
            <div className="trip-main-content-wrapper">
                <div className="trip-main-card p-4 mb-4 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label htmlFor="deliveryPerson" className="trip-main-form-label fw-bold">
                                    Delivery Person
                                </label>
                                {/* REPLACED: Custom filtered dropdown -> Standard Select */}
                                <select
                                    className="trip-main-form-control form-select"
                                    id="deliveryPerson"
                                    value={selectedEmployee ? selectedEmployee.employeeId : ''}
                                    onChange={handleEmployeeSelectChange}
                                    required
                                >
                                    <option value="">Select Delivery Person</option>
                                    {employees.map((emp) => (
                                        <option key={emp.employeeId} value={emp.employeeId}>
                                            {emp.name} (ID: {emp.employeeId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="dateFilter" className="trip-main-form-label fw-bold">
                                    Filter by Date
                                </label>
                                <input
                                    type="date"
                                    className="trip-main-form-control"
                                    id="dateFilter"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    required
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="billNumber" className="trip-main-form-label fw-bold">
                                    Bill Number
                                </label>
                                <input
                                    type="text"
                                    className="trip-main-form-control"
                                    id="billNumber"
                                    value={billNumber}
                                    onChange={handleBillNumberChange}
                                    placeholder="Enter bill number"
                                />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="customerName" className="trip-main-form-label fw-bold">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    className="trip-main-form-control"
                                    id="customerName"
                                    value={customerName}
                                    onChange={handleCustomerNameChange}
                                    placeholder="Enter customer name"
                                />
                            </div>
                        </div>
                        <div className="row g-3 mt-3">
                            <div className="col-12">
                                <button type="submit" className="trip-main-btn-primary w-100">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                {selectedEmployee && (
                    <div className="trip-main-card p-4 mb-4 shadow-sm">
                        <h3 className="h5">Selected Delivery Person</h3>
                        <p>
                            <strong>Name:</strong> {selectedEmployee.name}
                        </p>
                        <p>
                            <strong>Delivery Person Name in Reports:</strong> {selectedEmployee.name}
                        </p>
                        {filteredReports.length > 0 && (
                            <div className="mt-3">
                                <p>
                                    <strong>Total Grand Total:</strong> {formatPrice(calculateOverallGrandTotal())}
                                </p>
                                <p>
                                    <strong>Total Collected:</strong> {formatPrice(calculateTotalCollected())}
                                </p>
                                <p>
                                    <strong>Total Pending:</strong> {formatPrice(calculatePendingGrandTotal())}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {selectedEmployee && filteredReports.length > 0 && (
                    <div className="trip-main-card p-4 shadow-sm">
                        <h2 className="h4 mb-3">Assigned Delivery Orders</h2>
                        <div className="table-responsive">
                            <table className="trip-main-table table table-striped table-bordered">
                                <thead className="trip-main-table-primary">
                                    <tr>
                                        <th>Order No</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Delivery Person Name</th>
                                        <th>Grand Total ({useCurrencySymbol ? getCurrencySymbol(currency) : currency})</th>
                                        <th>Balance ({useCurrencySymbol ? getCurrencySymbol(currency) : currency})</th>
                                        <th>Payment Method</th>
                                        <th>Actions</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((report) => (
                                        <tr key={report.tripId}>
                                            <td>{report.orderNo}</td>
                                            <td>{formatTimestamp(report.timestamp)}</td>
                                            <td>{report.customerName || 'N/A'}</td>
                                            <td>{report.email || 'N/A'}</td>
                                            <td>{report.deliveryPersonName || 'Unknown'}</td>
                                            <td>{formatPrice(calculateGrandTotal(report.cartItems))}</td>
                                            <td>{formatPrice(getBalance(report))}</td>
                                            <td>
                                                {report.status === 'Delivered' ? (
                                                    <div className="d-flex flex-column gap-1 small">
                                                        {Object.entries(report.paymentAmounts)
                                                            .filter(([, amt]) => Number(amt) > 0)
                                                            .map(([method, amt]) => (
                                                                <div key={method}>
                                                                    <strong>{method}:</strong> {formatPrice(amt.toFixed(2))}
                                                                    {method === 'Cash' && report.tenderedAmount && (
                                                                        <span>
                                                                            {' '}
                                                                            (Tendered: {formatPrice(report.tenderedAmount)}, Change: {formatPrice(report.change.toFixed(2))})
                                                                        </span>
                                                                    )}
                                                                    {method === 'Card' && report.cardDetails && (
                                                                        <span> (****{report.cardDetails.slice(-4)})</span>
                                                                    )}
                                                                    {method === 'UPI' && report.upiDetails && (
                                                                        <span> ({report.upiDetails.split('@')[0]})</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        <div className="mt-1">
                                                            <strong>Total Paid: {formatPrice(calculateTotalPaid(report.paymentAmounts).toFixed(2))}</strong>
                                                        </div>
                                                        <div>
                                                            <strong>Balance: {formatPrice(0.00)}</strong>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <label className="form-label small mb-0">Cash:</label>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                style={{ width: '80px' }}
                                                                value={report.paymentAmounts.Cash || ''}
                                                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'Cash', e.target.value)}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        {Number(report.paymentAmounts.Cash) > 0 && (
                                                            <div className="d-flex align-items-center gap-2 ps-3">
                                                                <label className="form-label small mb-0">Tendered:</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    style={{ width: '80px' }}
                                                                    value={report.tenderedAmount || ''}
                                                                    onChange={(e) => handleTenderedChange(report.tripId, e.target.value)}
                                                                    min={report.paymentAmounts.Cash || 0}
                                                                    step="0.01"
                                                                />
                                                                <small className="text-success">Change: {formatPrice(report.change.toFixed(2))}</small>
                                                            </div>
                                                        )}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <label className="form-label small mb-0">Card:</label>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                style={{ width: '80px' }}
                                                                value={report.paymentAmounts.Card || ''}
                                                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'Card', e.target.value)}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        {Number(report.paymentAmounts.Card) > 0 && (
                                                            <div className="ps-3">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="Card Number"
                                                                    value={report.cardDetails || ''}
                                                                    onChange={(e) =>
                                                                        handlePaymentDetailsInput(report.tripId, 'cardDetails', e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <label className="form-label small mb-0">UPI:</label>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                style={{ width: '80px' }}
                                                                value={report.paymentAmounts.UPI || ''}
                                                                onChange={(e) => handlePaymentAmountChange(report.tripId, 'UPI', e.target.value)}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        {Number(report.paymentAmounts.UPI) > 0 && (
                                                            <div className="ps-3">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    placeholder="UPI ID"
                                                                    value={report.upiDetails || ''}
                                                                    onChange={(e) =>
                                                                        handlePaymentDetailsInput(report.tripId, 'upiDetails', e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <hr className="my-2" />
                                                        <div className="text-end">
                                                            <strong>Total Paid: {formatPrice(calculateTotalPaid(report.paymentAmounts).toFixed(2))}</strong>
                                                        </div>
                                                        <div className="text-end">
                                                            <strong
                                                                className={getBalance(report) > 0 ? 'text-warning' : 'text-success'}
                                                            >
                                                                Balance: {formatPrice(getBalance(report))}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button className="trip-main-btn-action-details btn-sm me-2" onClick={() => handleShowDetails(report)}>
                                                    Details
                                                </button>
                                            </td>
                                            <td>
                                                {report.status === 'Delivered' ? (
                                                    <span className="badge bg-success">Payment Received</span>
                                                ) : (
                                                    <button className="btn btn-success btn-sm" onClick={() => markAsDelivered(report)}>
                                                        Payment Received
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 text-end">
                            <h5 className="text-success">Total Pending Orders: {formatPrice(calculatePendingGrandTotal())}</h5>
                        </div>
                    </div>
                )}
                {selectedEmployee && filteredReports.length === 0 && !loading && (
                    <div className="trip-main-no-orders text-center my-4 text-muted">
                        <p>
                            No delivery orders assigned to {selectedEmployee.name} for the selected date
                            {billNumber ? ` and bill number ${billNumber}` : ''}
                            {customerName ? ` and customer ${customerName}` : ''}.
                        </p>
                    </div>
                )}
                {showPopup && selectedReport && (
                    <div className="trip-main-modal modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="trip-main-modal-content modal-content">
                                <div className="trip-main-modal-header modal-header">
                                    <h5 className="modal-title">Order Details</h5>
                                    <button type="button" className="btn-close" onClick={handleClosePopup}></button>
                                </div>
                                <div className="trip-main-modal-body modal-body">
                                    <p>
                                        <strong>Order No:</strong> {selectedReport.orderNo}
                                    </p>
                                    <p>
                                        <strong>Date:</strong> {formatTimestamp(selectedReport.timestamp)}
                                    </p>
                                    <p>
                                        <strong>Customer:</strong> {selectedReport.customerName || 'N/A'}
                                    </p>
                                    <p>
                                        <strong>Email:</strong> {selectedReport.email || 'N/A'}
                                    </p>
                                    <p>
                                        <strong>Delivery Person Name:</strong> {selectedReport.deliveryPersonName || 'Unknown'}
                                    </p>
                                    <p>
                                        <strong>Status:</strong>{' '}
                                        <span className={selectedReport.status === 'Delivered' ? 'badge bg-success' : 'badge bg-warning'}>
                                            {selectedReport.status === 'Delivered' ? 'Payment Received' : selectedReport.status}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Grand Total:</strong> {formatPrice(calculateGrandTotal(selectedReport.cartItems))}
                                    </p>
                                    <p>
                                        <strong>Subtotal:</strong> {formatPrice(calculateSubtotal(selectedReport.cartItems))}
                                    </p>
                                    <p>
                                        <strong>VAT ({(vatRate * 100).toFixed(0)}%):</strong> {formatPrice(calculateTotalVat(selectedReport.cartItems))}
                                    </p>
                                    <p>
                                        <strong>Total Paid:</strong> {formatPrice(calculateTotalPaid(selectedReport.paymentAmounts).toFixed(2))}
                                    </p>
                                    <p>
                                        <strong>Balance:</strong>{' '}
                                        <span className={getBalance(selectedReport) > 0 ? 'text-warning' : 'text-success'}>
                                            {formatPrice(getBalance(selectedReport))}
                                        </span>
                                    </p>
                                    {Object.entries(selectedReport.paymentAmounts).some(([, amt]) => Number(amt) > 0) && (
                                        <>
                                            <h6>Payments:</h6>
                                            <ul className="list-unstyled">
                                                {Object.entries(selectedReport.paymentAmounts)
                                                    .filter(([, amt]) => Number(amt) > 0)
                                                    .map(([method, amt]) => (
                                                        <li key={method} className="mb-1">
                                                            <strong>{method}:</strong> {formatPrice(amt.toFixed(2))}
                                                            {method === 'Cash' && selectedReport.tenderedAmount && (
                                                                <span>
                                                                    {' '}
                                                                    (Tendered: {formatPrice(selectedReport.tenderedAmount)}, Change: {formatPrice(selectedReport.change.toFixed(2))})
                                                                </span>
                                                            )}
                                                            {method === 'Card' && selectedReport.cardDetails && (
                                                                <span> (Card: ****{selectedReport.cardDetails.slice(-4)})</span>
                                                            )}
                                                            {method === 'UPI' && selectedReport.upiDetails && (
                                                                <span> (UPI: {selectedReport.upiDetails})</span>
                                                            )}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </>
                                    )}
                                    <h6>Items:</h6>
                                    <ul className="list-unstyled">
                                        {selectedReport.cartItems.map((item, idx) => (
                                            <li key={idx} className="mb-3">
                                                <strong>
                                                    {item.name} x{item.quantity} - {formatPrice((item.exclTotal + item.taxTotal) * item.quantity)}
                                                </strong>
                                                <div>Subtotal: {formatPrice(item.exclTotal * item.quantity)}, VAT: {formatPrice(item.taxTotal * item.quantity)}</div>
                                                {renderAddonsInPopup(item)}
                                                {renderCombosInPopup(item)}
                                                {renderIngredientsInPopup(item.ingredients)}
                                                {item.icePreference === 'with_ice' && item.icePrice > 0 && (
                                                    <div className="text-muted small ms-3">
                                                        + Ice x{item.quantity} - {formatPrice((item.icePrice * item.quantity))}
                                                    </div>
                                                )}
                                                {item.isSpicy && item.spicyPrice > 0 && (
                                                    <div className="text-danger small ms-3">
                                                        + Spicy x{item.quantity} - {formatPrice((item.spicyPrice * item.quantity))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={handleClosePopup}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TripReport;
