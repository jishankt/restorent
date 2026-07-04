import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Chart from 'chart.js/auto';
import './PosBalance.css';

function PosBalance() {
    const navigate = useNavigate();
    const [balanceData, setBalanceData] = useState({
        dineIn: { totalOrders: 0, totalRevenue: 0 },
        onlineDelivery: { totalOrders: 0, totalRevenue: 0 },
        takeAway: { totalOrders: 0, totalRevenue: 0 },
    });
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [hourlyBreakdown, setHourlyBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [filterOrderType, setFilterOrderType] = useState('');
    const [filterPaymentMode, setFilterPaymentMode] = useState('');
    const [showList, setShowList] = useState(false);
    const [chartInstance, setChartInstance] = useState(null);

    // Permissions
    const [canRead, setCanRead] = useState(false);
    const [canWrite, setCanWrite] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [canCreate, setCanCreate] = useState(false);

    // NEW: Context for global config
    const { baseUrl, configLoading } = useContext(UserContext);


    // Combined Fetcher
    useEffect(() => {
        if (configLoading) return;

        const initializeData = async () => {
            // First fetch permissions if not already handled
            await fetchPermissions();
            // Then initial sales data (if permissions allow)
            if (canRead) {
                fetchSalesData();
            }
        };

        initializeData();
    }, [baseUrl, configLoading, fromDate, toDate, filterOrderType, filterPaymentMode, canRead]);

    useEffect(() => {
        if (hourlyBreakdown.length > 0) {
            renderChart();
        }
    }, [hourlyBreakdown]);

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
            const pagePerm = perms.find(p => p.pageId === 'pos_balance');
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

    const fetchSalesData = async () => {
        setLoading(true);
        // Using the verified backend IP
        let url = `${baseUrl}/api/sales`;
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate.toISOString().split('T')[0]);
        if (toDate) params.append('toDate', toDate.toISOString().split('T')[0]);
        if (filterOrderType) params.append('orderType', filterOrderType);
        if (filterPaymentMode) params.append('paymentMode', filterPaymentMode);
        if (params.toString()) url += `?${params.toString()}`;

        try {
            const response = await axios.get(url);
            const cleanedData = cleanData(response.data);
            processSalesData(cleanedData);
            setLoading(false);
        } catch (err) {
            setError('Error fetching sales data: ' + err.message);
            setLoading(false);
        }
    };

    const normalizeOrderType = (orderType) => {
        if (!orderType) return 'N/A';
        const normalized = orderType.trim().toLowerCase();
        const orderTypeMap = {
            'dine in': 'Dine In',
            'dine-in': 'Dine In',
            takeaway: 'Takeaway',
            'take away': 'Takeaway',
            'take-away': 'Takeaway',
            'online delivery': 'Online Delivery',
            delivery: 'Online Delivery',
        };
        return orderTypeMap[normalized] || 'N/A';
    };

    const normalizePaymentMode = (paymentMode) => {
        if (!paymentMode) return 'N/A';
        const normalized = paymentMode.trim().toLowerCase();
        const paymentModeMap = {
            cash: 'Cash',
            card: 'Card',
            upi: 'UPI',
        };
        return paymentModeMap[normalized] || 'N/A';
    };

    const cleanData = (data) => {
        if (!Array.isArray(data)) return [];
        const validOrderTypes = ['Dine In', 'Takeaway', 'Online Delivery'];
        const validPaymentModes = ['Cash', 'Card', 'UPI'];
        return data
            .filter((sale) => {
                const isValid =
                    sale.items &&
                    sale.items.length > 0 &&
                    !isNaN(sale.grand_total) &&
                    sale.grand_total !== null &&
                    !isNaN(sale.total) &&
                    sale.total !== null &&
                    sale.invoice_no &&
                    sale.date;
                return isValid;
            })
            .map((sale) => ({
                ...sale,
                orderType: normalizeOrderType(sale.orderType),
                paymentMode: normalizePaymentMode(sale.payments?.[0]?.mode_of_payment),
                date: sale.date,
            }));
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
    };

    const isDateInRange = (saleDate, from, to) => {
        const saleDateObj = parseDate(saleDate);
        if (!saleDateObj) return false;
        const fromDateObj = from ? new Date(from) : null;
        const toDateObj = to ? new Date(to) : null;

        if (!fromDateObj && !toDateObj) return true;
        if (fromDateObj && !toDateObj) return saleDateObj >= fromDateObj;
        if (!fromDateObj && toDateObj) return saleDateObj <= toDateObj;
        return saleDateObj >= fromDateObj && saleDateObj <= toDateObj;
    };

    const processSalesData = (salesData) => {
        const dineIn = { totalOrders: 0, totalRevenue: 0 };
        const onlineDelivery = { totalOrders: 0, totalRevenue: 0 };
        const takeAway = { totalOrders: 0, totalRevenue: 0 };
        const hourlyData = {};
        let totalRev = 0;

        const filteredData = salesData.filter((sale) => {
            const dateMatch = isDateInRange(sale.date, fromDate, toDate);
            const orderTypeMatch = filterOrderType
                ? sale.orderType === filterOrderType
                : true;
            const paymentModeMatch = filterPaymentMode
                ? sale.paymentMode === filterPaymentMode
                : true;
            return dateMatch && orderTypeMatch && paymentModeMatch;
        });

        filteredData.forEach((sale) => {
            const grandTotal = parseFloat(sale.grand_total) || 0;
            const orderType = sale.orderType;

            if (orderType === 'Dine In') {
                dineIn.totalOrders += 1;
                dineIn.totalRevenue += grandTotal;
            } else if (orderType === 'Online Delivery') {
                onlineDelivery.totalOrders += 1;
                onlineDelivery.totalRevenue += grandTotal;
            } else if (orderType === 'Takeaway') {
                takeAway.totalOrders += 1;
                takeAway.totalRevenue += grandTotal;
            }

            totalRev += grandTotal;

            const time = sale.time || '00:00:00';
            const hour = parseInt(time.split(':')[0], 10);
            const hourKey = `${hour.toString().padStart(2, '0')}-${(hour + 1)
                .toString()
                .padStart(2, '0')}`;
            if (!hourlyData[hourKey]) {
                hourlyData[hourKey] = { totalOrders: 0, totalRevenue: 0, paymentMode: sale.paymentMode };
            }
            hourlyData[hourKey].totalOrders += 1;
            hourlyData[hourKey].totalRevenue += grandTotal;
        });

        const fullHourlyBreakdown = [];
        for (let i = 0; i < 24; i++) {
            const hourKey = `${i.toString().padStart(2, '0')}-${(i + 1)
                .toString()
                .padStart(2, '0')}`;
            fullHourlyBreakdown.push({
                timeSlot: hourKey,
                totalOrders: hourlyData[hourKey]?.totalOrders || 0,
                totalRevenue: hourlyData[hourKey]?.totalRevenue || 0,
                paymentMode: hourlyData[hourKey]?.paymentMode || 'All',
            });
        }

        setBalanceData({ dineIn, onlineDelivery, takeAway });
        setTotalRevenue(totalRev);
        setHourlyBreakdown(fullHourlyBreakdown);
    };

    const renderChart = () => {
        const ctx = document.getElementById('salesChart').getContext('2d');
        if (chartInstance) {
            chartInstance.destroy();
        }
        const newChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourlyBreakdown.map((hour) => hour.timeSlot),
                datasets: [
                    {
                        label: 'Total Orders',
                        data: hourlyBreakdown.map((hour) => hour.totalOrders),
                        backgroundColor: '#26abff', // Maatched blue
                        borderColor: '#26abff',
                        borderWidth: 1,
                        yAxisID: 'y',
                        borderRadius: 5,
                    },
                    {
                        label: 'Total Revenue (₹)',
                        data: hourlyBreakdown.map((hour) => hour.totalRevenue),
                        type: 'line',
                        fill: true,
                        borderColor: '#ff7e5f', // nice orange contrast
                        backgroundColor: 'rgba(255, 126, 95, 0.2)',
                        tension: 0.4,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12, family: "'Poppins', sans-serif" },
                            color: '#333',
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { family: "'Poppins', sans-serif" },
                        bodyFont: { family: "'Poppins', sans-serif" },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: "'Poppins', sans-serif" } },
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: { display: false },
                    },
                },
            },
        });
        setChartInstance(newChart);
    };

    const handleBackToFirstTab = () => {
        navigate('/home');
    };

    const handleResetFilters = () => {
        setFromDate(null);
        setToDate(null);
        setFilterOrderType('');
        setFilterPaymentMode('');
    };

    const toggleList = () => {
        setShowList(!showList);
    };

    if (loading || configLoading) {
        return (
            <div className="pos-balance-container loading-state">
                <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-2 text-light">Loading Analytics Data...</div>
            </div>
        );
    }

    if (!canRead) {
        return (
            <div className="pos-balance-container container text-center mt-5">
                <div className="alert alert-danger shadow-lg">
                    <h3>Access Denied</h3>
                    <p>You do not have permission to view POS Balance & Analytics.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate("/home")}>
                    Back to Home
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pos-balance-container error-state">
                <div className="alert alert-danger shadow-lg" role="alert">
                    <i className="fa-solid fa-triangle-exclamation me-2"></i> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="pos-balance-container">
            {/* Back Button */}
            <button
                className="nav-icon-button back-button"
                onClick={handleBackToFirstTab}
                aria-label="Back to Home"
            >
                <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="content-wrapper container-fluid">

                <div className="header-row text-center mb-5">
                    <h1 className="page-title">POS Balance & Analytics</h1>
                    <p className="page-subtitle">Track your sales performance in real-time</p>
                </div>

                <div className="row g-4 justify-content-center">
                    {/* Left Column: Filters */}
                    <div className="col-lg-3 col-md-12">
                        <div className="glass-card filter-card">
                            <div className="card-header-custom">
                                <h3 className="card-title-custom"><i className="fa-solid fa-filter me-2"></i> Filters</h3>
                            </div>
                            <div className="card-body-custom">
                                <div className="mb-3">
                                    <label>From Date</label>
                                    <DatePicker
                                        selected={fromDate}
                                        onChange={(date) => setFromDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control"
                                        placeholderText="Start Date"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label>To Date</label>
                                    <DatePicker
                                        selected={toDate}
                                        onChange={(date) => setToDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control"
                                        placeholderText="End Date"
                                        minDate={fromDate}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label>Order Type</label>
                                    <select
                                        value={filterOrderType}
                                        onChange={(e) => setFilterOrderType(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">All Types</option>
                                        <option value="Dine In">Dine In</option>
                                        <option value="Takeaway">Takeaway</option>
                                        <option value="Online Delivery">Online Delivery</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label>Payment Mode</label>
                                    <select
                                        value={filterPaymentMode}
                                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">All Modes</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                                <button className="btn btn-reset w-100" onClick={handleResetFilters}>
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Charts */}
                    <div className="col-lg-9 col-md-12">
                        {/* Summary Header */}
                        <div className="glass-card summary-card mb-4 d-flex justify-content-between align-items-center">
                            <div className="revenue-diplay">
                                <span className="label">Total Revenue</span>
                                <span className="value">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <button className="btn btn-primary-custom" onClick={toggleList}>
                                {showList ? <><i className="fa-solid fa-eye-slash me-2"></i> Hide List</> : <><i className="fa-solid fa-eye me-2"></i> Show List</>}
                            </button>
                        </div>

                        {/* Top Cards Row */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="stat-card">
                                    <div className="icon-wrapper dine-in">
                                        <i className="fa-solid fa-utensils"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h4>Dine In</h4>
                                        <p>{balanceData.dineIn.totalOrders} Orders</p>
                                        <h5>₹{balanceData.dineIn.totalRevenue.toFixed(2)}</h5>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-card">
                                    <div className="icon-wrapper delivery">
                                        <i className="fa-solid fa-truck"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h4>Delivery</h4>
                                        <p>{balanceData.onlineDelivery.totalOrders} Orders</p>
                                        <h5>₹{balanceData.onlineDelivery.totalRevenue.toFixed(2)}</h5>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-card">
                                    <div className="icon-wrapper takeaway">
                                        <i className="fa-solid fa-bag-shopping"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h4>Take Away</h4>
                                        <p>{balanceData.takeAway.totalOrders} Orders</p>
                                        <h5>₹{balanceData.takeAway.totalRevenue.toFixed(2)}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="glass-card chart-section p-4 mb-4">
                            <h3 className="section-title mb-4">Sales Trends</h3>
                            <div className="chart-container-wrapper">
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>

                        {/* Breakdown List (Conditional) */}
                        {showList && (
                            <div className="glass-card table-section p-4">
                                <h3 className="section-title mb-3">Hourly Breakdown</h3>
                                <div className="table-responsive">
                                    <table className="table custom-table">
                                        <thead>
                                            <tr>
                                                <th>Time Slot</th>
                                                <th>Orders</th>
                                                <th>Revenue</th>
                                                <th>Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hourlyBreakdown.map((hour) => (
                                                <tr key={hour.timeSlot}>
                                                    <td>{hour.timeSlot}</td>
                                                    <td>{hour.totalOrders}</td>
                                                    <td>₹{hour.totalRevenue.toFixed(2)}</td>
                                                    <td>{hour.paymentMode}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PosBalance;
