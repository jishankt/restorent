// src/components/Form/salaryslip.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import { FaCalendarAlt, FaUser, FaSave, FaPrint, FaFileInvoiceDollar, FaArrowLeft, FaTimes, FaCheck, FaTrash, FaCog } from 'react-icons/fa';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import CustomerCustomizationModal from "./CustomerCustomizationModal";

// Simple Field Component
const Field = ({ label, value }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px', textTransform: 'uppercase' }}>{label}</label>
    <div style={{
      padding: '8px 12px',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      minHeight: '20px'
    }}>
      {value || '-'}
    </div>
  </div>
);

const SalarySlip = ({ permissions: propPermissions }) => {
  const navigate = useNavigate();
  // Global State
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const slipId = searchParams.get('id');

  // Core Data
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Selections & Dates
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalWorkingDays, setTotalWorkingDays] = useState(30);

  // Stats
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  // Config
  const [companyName, setCompanyName] = useState('My Company');
  const [currency, setCurrency] = useState('₹');

  // Permissions
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [dataScope, setDataScope] = useState("All Data"); // NEW: Data scope for filtering
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  useEffect(() => {
    if (configLoading) return;

    const fetchPermissions = async () => {
      try {
        setPermsLoading(true);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const roleRaw = userObj.role || userObj.UserType || '';
          const branch = userObj.branch_name || userObj.branch || "";
          const isAdminRole = checkIsAdmin(userObj);

          const isGroupAdminRole = checkIsGlobalAdmin(userObj);

          if (roleRaw) {
            const userEmail = userObj.email || '';
            const url = `${baseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}&email=${userEmail}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'salary_slip' || p.pageId === 'salary_list');
            
            if (isAdminRole || isGroupAdminRole) {
              setCanRead(true);
              setCanWrite(true);
              setCanDelete(true);
              setCanCreate(true);
              setDataScope("All Data");
            } else if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
              setCanCreate(pagePerm.canCreate === true);
              const scope = pagePerm.dataAccess || pagePerm.dataScope || "All Data";
              setDataScope(scope);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setPermsLoading(false);
      }
    };
    fetchPermissions();
  }, [baseUrl, configLoading]);

  // Form Fields
  const [designation, setDesignation] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Bank Transfer');
  const [postingDate, setPostingDate] = useState('');
  const [salaryStructure, setSalaryStructure] = useState('Kyle New');
  const [payrollFrequency, setPayrollFrequency] = useState('Monthly');
  const [letterHead, setLetterHead] = useState('Kyle');
  const [status, setStatus] = useState('Submitted');

  // Financials
  const [earnings, setEarnings] = useState([]);
  const [grossPay, setGrossPay] = useState(0);
  const [dailyRate, setDailyRate] = useState(0);
  const [leaveWithoutPayAmount, setLeaveWithoutPayAmount] = useState(0);

  // Roster (Deductions)
  const [rosterDeductions, setRosterDeductions] = useState([]);
  const [totalRosterDeduction, setTotalRosterDeduction] = useState(0);

  // Totals
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netPay, setNetPay] = useState(0);
  const [totalInWords, setTotalInWords] = useState('');
  const [grossYearToDate, setGrossYearToDate] = useState(0);
  const [monthToDate, setMonthToDate] = useState(0);

  const [preventAttendanceFetch, setPreventAttendanceFetch] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Details');

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Initial Data Fetching
  useEffect(() => {
    if (configLoading) return;
    const currentBaseUrl = baseUrl || '';

    const fetchData = async () => {
      try {
        await Promise.all([
          getSettings(),
          getCompany(),
          getEmployees()
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    const getSettings = async () => {
      try {
        const res = await axios.get(`${currentBaseUrl}/api/settings`, { headers: getHeaders() });
        const map = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£', 'AED': 'AED' };
        setCurrency(map[res.data.currency] || res.data.currency || '₹');
      } catch { }
    };

    const getCompany = async () => {
      try {
        const res = await axios.get(`${currentBaseUrl}/api/company-details`, { headers: getHeaders() });
        if (res.data.companyDetails?.length) setCompanyName(res.data.companyDetails.slice(-1)[0].restaurantName);
      } catch { }
    };

    const getEmployees = async () => {
      try {
        const res = await axios.get(`${currentBaseUrl}/api/add-employee`, {
          headers: getHeaders(),
          params: {
            userId: user?.userId,
            role: user?.role,
            pageId: 'salary_slip' // Pass context for hierarchy filtering
          }
        });
        let employeeList = res.data || [];

        // Backend now handles all data scope and hierarchy filtering via /api/add-employee
        setEmployees(employeeList);
      } catch { setError('Failed to fetch employees.'); }
    };

    fetchData();
  }, [baseUrl, configLoading, user, dataScope]);

  // Load Slip
  useEffect(() => {
    const loadSlip = async () => {
      if (!slipId || !employees.length) return;
      try {
        const res = await axios.get(`${baseUrl}/api/salary-slip/${slipId}`, { headers: getHeaders() });
        const data = res.data;

        const emp = employees.find(e => e._id === data.employeeId);
        if (emp) setSelectedEmployee(emp);

        setPreventAttendanceFetch(true);
        setSelectedMonth(data.month);

        setEarnings(data.earnings || []);
        setRosterDeductions(data.rosterDeductions || data.rosterAdditions || []);

        setDesignation(data.designation);
        setLetterHead(data.letterHead);
        setModeOfPayment(data.modeOfPayment);
        setPayrollFrequency(data.payrollFrequency || 'Monthly');
        setSalaryStructure(data.salaryStructure || 'Kyle New');
        setStatus(data.status);
        setPostingDate(data.postingDate);
        setStartDate(data.startDate);
        setEndDate(data.endDate);

        setGrossPay(data.grossPay || 0);
        setNetPay(data.netPay || 0);
        setTotalDeductions(data.totalDeductions || 0);
        setGrossYearToDate(data.grossYearToDate || 0);
        setMonthToDate(data.netPay || 0);

        setAttendanceSummary({
          presentCount: data.presentCount,
          halfDayCount: data.halfDayCount,
          weeklyOffCount: data.weeklyOffCount,
          holidayCount: data.holidayCount,
          paidLeaveCount: data.paidLeaveCount,
          unpaidLeaveCount: data.unpaidLeaveCount,
          absentCount: data.absentCount,
          workingDays: data.workingDays,
          paymentDays: data.paymentDays
        });

      } catch (e) { console.error(e); setError('Failed to load salary slip.'); }
    };
    loadSlip();
  }, [slipId, employees, baseUrl]);

  // Month
  useEffect(() => {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0);
      setTotalWorkingDays(lastDay.getDate());
      setStartDate(`${y}-${m}-01`);

      // If current month, default end date to today (Pro-rata)
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === parseInt(y) && (today.getMonth() + 1) === parseInt(m);
      if (isCurrentMonth) {
        setEndDate(today.toISOString().slice(0, 10));
        // Also update total working days?? No, denominator usually stays 30/31. 
        // But "Payment Days" will be partial.
      } else {
        setEndDate(lastDay.toISOString().slice(0, 10));
      }
    }
  }, [selectedMonth]);

  // Fetch Attendance
  const fetchAttendance = async () => {
    if (!selectedEmployee) return;
    try {
      const [attRes, leaveRes] = await Promise.all([
        axios.get(`${baseUrl}/api/attendance`, {
          headers: getHeaders(),
          params: { month: selectedMonth, employee_id: selectedEmployee._id }
        }),
        axios.get(`${baseUrl}/api/leave-applications`, {
          headers: getHeaders(),
          params: {
            employee_id: selectedEmployee._id,
            status: 'APPROVED',
            // Note: Filter by date range ideally, but client side filter is okay for now
            userId: user?.userId || user?._id || user?.id,
            role: user?.role
          }
        })
      ]);

      const records = Array.isArray(attRes.data) ? attRes.data : (attRes.data.records || []);
      const allLeaves = leaveRes.data || [];
      // Filter only approved leaves (Case Insensitive)
      const leaves = allLeaves.filter(l => (l.status || '').toLowerCase() === 'approved');

      const recordsByDate = {};
      records.forEach(r => {
        const date = r.attendance_date;
        if (!recordsByDate[date]) recordsByDate[date] = [];
        recordsByDate[date].push(r);
      });

      let presentDays = 0;
      let halfDays = 0;
      let offDays = 0;
      let holidayDays = 0;
      let paidLeaveDays = 0;
      let unpaidDays = 0;
      let absentDays = 0;
      const rosterDates = [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Loop from Start Date to End Date (Pro-rata)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);

        let status = ''; // Default to empty
        const dayRecords = recordsByDate[dateStr];

        // 1. Check Attendance Record
        if (dayRecords && dayRecords.length > 0) {
          const primary = dayRecords[0];
          status = (primary.status || '').toLowerCase();
          const hasRoster = dayRecords.some(r => {
            return r.is_roster === true || r.is_roster === 'true' || r.isRoster === true || r.isRoster === 'true';
          });
          if (hasRoster) rosterDates.push(dateStr);
        } else {
          // 2. Check Leaves
          const leave = leaves.find(l => {
            const s = l.from_date.split('T')[0];
            const e = l.to_date.split('T')[0];
            return dateStr >= s && dateStr <= e;
          });
          if (leave) {
            status = 'paid leave';
          } else {
            // 3. Check Weekend (If no record and no leave)
            const dayNum = d.getDay();
            if (dayNum === 0 || dayNum === 6) status = 'weekly off';
          }
        }

        if (status.includes('present') || status === 'full day' || status === 'extended') {
          presentDays++;
        } else if (status.includes('half') || status.includes('halfday')) {
          halfDays++;
        } else if (status.includes('weekly') || status.includes('off day')) {
          offDays++;
        } else if (status.includes('holiday')) {
          holidayDays++;
        } else if (status.includes('paid leave')) {
          paidLeaveDays++;
        } else if (status.includes('leave without pay') || status.includes('on leave') || status === 'leave') {
          unpaidDays++;
        } else if (status.includes('absent')) {
          absentDays++;
        }
      }

      // Summation Method for correct Pro-rata
      const working = presentDays + (halfDays * 0.5) + paidLeaveDays;
      // Payment Days = Work + Offs + Holidays
      // Note: This excludes "Absent" days and "Unpaid Leave" days naturally.
      const payment = working + offDays + holidayDays;

      setAttendanceSummary({
        presentCount: presentDays,
        halfDayCount: halfDays,
        weeklyOffCount: offDays,
        holidayCount: holidayDays,
        paidLeaveCount: paidLeaveDays,
        unpaidLeaveCount: unpaidDays,
        absentCount: absentDays,
        workingDays: working,
        paymentDays: payment
      });

      const newRosterDeductions = rosterDates.map(date => ({
        date: date,
        amount: 0,
        description: 'Roster Duty'
      }));

      setRosterDeductions(prev => {
        const merged = newRosterDeductions.map(newItem => {
          const existing = prev.find(p => p.date === newItem.date);
          return existing ? existing : newItem;
        });
        return merged.length > 0 ? merged : prev;
      });

      try {
        const yRes = await axios.get(`${baseUrl}/api/salary-slip/year-to-date`, {
          headers: getHeaders(),
          params: { employeeId: selectedEmployee._id, month: selectedMonth }
        });
        setGrossYearToDate(yRes.data.gross_year_to_date || 0);
      } catch { setGrossYearToDate(0); }

    } catch (e) {
      console.error('❌ ATTENDANCE FETCH ERROR:', e);
      setError('Failed to fetch attendance');
    }
  };

  useEffect(() => {
    if (selectedEmployee && selectedMonth && !preventAttendanceFetch) {
      fetchAttendance();
    }
  }, [selectedEmployee, selectedMonth, startDate, endDate, totalWorkingDays]);

  // Calculations
  useEffect(() => {
    if (!attendanceSummary) return;

    const baseGross = earnings.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const rosterAddition = rosterDeductions.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    setTotalRosterDeduction(rosterAddition);

    const g = baseGross + rosterAddition;
    setGrossPay(g);

    const rate = totalWorkingDays > 0 ? baseGross / totalWorkingDays : 0;
    setDailyRate(rate);

    const unpaidDays = totalWorkingDays - attendanceSummary.paymentDays;
    const lop = Math.max(0, unpaidDays * rate);
    setLeaveWithoutPayAmount(lop);

    const totalD = lop + rosterAddition;
    setTotalDeductions(totalD);

    const net = Math.max(0, g - totalD);
    setNetPay(net);
    setMonthToDate(net);
    setTotalInWords(numberToWords(net));

  }, [earnings, attendanceSummary, rosterDeductions, totalWorkingDays]);

  const numberToWords = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return "Zero";
    return `${currency} ${num.toFixed(2)}`;
  };

  const handleEmployeeSelect = (e) => {
    const emp = employees.find(ep => ep._id === e.target.value);
    setSelectedEmployee(emp);
    setPreventAttendanceFetch(false);

    setRosterDeductions([]);
    setAttendanceSummary(null);

    if (emp && !slipId) {
      setEarnings([
        { component: 'Basic', amount: emp.basicSalary || 0 },
        { component: 'House Rent Allowance', amount: emp.hra || 0 },
        { component: 'Commuting Expenses', amount: emp.ta || 0 },
        ...(emp.oa ? [{ component: 'Other Allowances', amount: emp.oa }] : [])
      ]);
      setDesignation(emp.employeeDesignation);
      setPostingDate(emp.dateOfJoining);
    }
  };

  const updateRosterRow = (idx, field, val) => {
    const arr = [...rosterDeductions];
    arr[idx][field] = val;
    setRosterDeductions(arr);
  };

  const updateEarning = (idx, val) => {
    const arr = [...earnings];
    arr[idx].amount = val;
    setEarnings(arr);
  };

  const handleSave = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to save salary slips.");
      setShowPermModal(true);
      return;
    }
    if (!selectedEmployee) { setError("Select Employee"); return; }
    try {
      const payload = {
        employeeId: selectedEmployee._id,
        employeeName: selectedEmployee.name,
        employeeIdCode: selectedEmployee.employeeId,
        month: selectedMonth,
        grossSalary: grossPay,
        totalSalary: grossPay,
        netPay,
        grossPay,
        grossYearToDate,
        totalDeductions,
        dailyRate,
        fullCount: attendanceSummary?.presentCount || 0,
        offCount: attendanceSummary?.weeklyOffCount || 0,
        leaveWithoutPay: attendanceSummary?.unpaidLeaveCount || 0,
        absentCount: attendanceSummary?.absentCount || 0,
        paymentDays: attendanceSummary?.paymentDays || 0,
        presentCount: attendanceSummary?.presentCount || 0,
        halfDayCount: attendanceSummary?.halfDayCount || 0,
        weeklyOffCount: attendanceSummary?.weeklyOffCount || 0,
        holidayCount: attendanceSummary?.holidayCount || 0,
        paidLeaveCount: attendanceSummary?.paidLeaveCount || 0,
        unpaidLeaveCount: attendanceSummary?.unpaidLeaveCount || 0,
        workingDays: attendanceSummary?.workingDays || 0,
        designation,
        postingDate,
        payrollFrequency,
        startDate,
        endDate,
        salaryStructure,
        modeOfPayment,
        letterHead,
        status,
        earnings,
        deductions: [
          { component: 'Leave Without Pay', amount: leaveWithoutPayAmount },
          ...rosterDeductions.map(r => ({ component: `Roster: ${r.description || 'Roster Duty'} (${r.date})`, amount: parseFloat(r.amount || 0) }))
        ],
        rosterAdditions: rosterDeductions,
        rosterDeductions: rosterDeductions,
        totalRosterAmount: totalRosterDeduction
      };

      const url = slipId ? `${baseUrl}/api/salary-slip/${slipId}` : `${baseUrl}/api/salary-slip`;
      const method = slipId ? 'put' : 'post';
      await axios({ method, url, data: payload, headers: getHeaders() });

      setMessage("Saved Successfully!");
      setTimeout(() => setMessage(''), 3000);
      if (!slipId) navigate('/salary-receipt-list', { state: { fromSave: true } });

    } catch (e) {
      console.error('Save error:', e.response?.data || e.message);
      setError(e.response?.data?.error || "Error saving");
      setTimeout(() => setError(''), 5000);
    }
  };

  const handlePrint = () => {
    if (!selectedEmployee) return;

    const w = window.open('', '_blank');
    w.document.write(`
      <html>
      <head>
        <title>Salary Slip - ${selectedEmployee.name}</title>
        <style>
           body { font-family: 'Arial', sans-serif; padding: 40px; }
           .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;}
           .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
           .sub-header { font-size: 14px; margin-top: 5px; }
           .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px; font-size: 13px; }
           .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
           table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
           th { background: #f9f9f9; }
           .right { text-align: right; }
           .total-box { border: 2px solid #eee; padding: 15px; margin-top: 20px; }
           .net-pay { font-size: 18px; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
         <div class="header">
            <h1>${companyName}</h1>
            <div class="sub-header">Salary Slip for ${selectedMonth}</div>
         </div>
         
         <div class="grid">
            <div>
               <div class="row"><strong>Employee ID:</strong> ${selectedEmployee.employeeId || ''}</div>
               <div class="row"><strong>Name:</strong> ${selectedEmployee.name}</div>
               <div class="row"><strong>Designation:</strong> ${designation}</div>
               <div class="row"><strong>Date of Joining:</strong> ${postingDate}</div>
            </div>
            <div>
               <div class="row"><strong>Status:</strong> ${status}</div>
               <div class="row"><strong>Payroll Mode:</strong> ${modeOfPayment}</div>
               <div class="row"><strong>Working Days:</strong> ${attendanceSummary?.workingDays || 0}</div>
               <div class="row"><strong>Paid Days:</strong> ${attendanceSummary?.paymentDays || 0}</div>
            </div>
         </div>

         <h3>Earnings</h3>
         <table>
           <thead><tr><th>Component</th><th class="right">Amount</th></tr></thead>
           <tbody>
              ${earnings.map(e => `<tr><td>${e.component}</td><td class="right">${currency} ${formatCurrency(e.amount)}</td></tr>`).join('')}
              <tr style="font-weight:bold; background:#f0f8ff;">
                 <td>Total Gross Pay</td>
                 <td class="right">${currency} ${formatCurrency(grossPay)}</td>
              </tr>
           </tbody>
         </table>

         <h3>Deductions</h3>
         <table>
           <thead><tr><th>Component</th><th class="right">Amount</th></tr></thead>
           <tbody>
              ${leaveWithoutPayAmount > 0 ? `<tr><td>Leave Without Pay</td><td class="right">${currency} ${formatCurrency(leaveWithoutPayAmount)}</td></tr>` : ''}
              
              ${rosterDeductions.map(r => `<tr><td>Roster: ${r.description || 'Roster Duty'} (${r.date || ''})</td><td class="right">${currency} ${formatCurrency(r.amount)}</td></tr>`).join('')}
              
              <tr style="font-weight:bold; background:#fff0f0;">
                 <td>Total Deductions</td>
                 <td class="right">${currency} ${formatCurrency(totalDeductions)}</td>
              </tr>
           </tbody>
         </table>

         <div class="total-box">
            <div class="net-pay">Net Payable: ${currency} ${formatCurrency(netPay)}</div>
            <div style="text-align:center; font-style:italic; margin-top:5px;">In Words: ${totalInWords}</div>
         </div>
         
         <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:12px;">
            <div>Employee Signature</div>
            <div>Authorised Signatory</div>
         </div>

         <script>
           window.onload = function() { window.print(); }
         </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  if (permsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <p>Checking Permissions...</p>
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdminRole = checkIsAdmin(userObj);


  if (!canRead && !isAdminRole && !permsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', padding: '30px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '10px' }}>Access Denied</h2>
          <p>You do not have permission to view Salary Slip details.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin')}
            style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '50px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f2f6', padding: '20px', position: 'relative' }}>
      {/* Centered Permission Denied Modal */}
      {showPermModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
          }}>
            <div style={{ color: '#e74c3c', fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Permission Denied</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>{permModalMsg}</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowPermModal(false)}
              style={{ background: '#3498db', border: 'none', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/salary-receipt-list')}
        className="print-hidden"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
        }}
      >
        <FaArrowLeft /> Back to List
      </button>

      {/* Main Card */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaFileInvoiceDollar style={{ color: '#3498db', fontSize: '2rem' }} />
            {slipId ? 'Edit' : 'New'} Salary Slip
          </h2>
          <div style={{ display: 'flex', gap: '10px' }} className="print-hidden">
            {(isAdminRole || isGroupAdminRole) && (
              <button
                type="button"
                onClick={() => setShowCustomizeModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaCog /> Customize
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(39, 174, 96, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaSave /> Save
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 8px rgba(243, 156, 18, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="print-hidden" style={{
            padding: '15px',
            background: '#ffebee',
            color: '#c62828',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #ffcdd2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <FaTimes /> {error}
          </div>
        )}
        {message && (
          <div className="print-hidden" style={{
            padding: '15px',
            background: '#e8f5e9',
            color: '#2e7d32',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #c8e6c9',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px'
          }}>
            <FaCheck /> {message}
          </div>
        )}

        {/* Controls */}
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="print-hidden">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px', textTransform: 'uppercase' }}>Month</label>
            <input
              type="month"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              disabled={!!slipId}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px', textTransform: 'uppercase' }}>Employee</label>
            <select
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
              value={selectedEmployee?._id || ''}
              onChange={handleEmployeeSelect}
              disabled={!!slipId}
            >
              <option value="">-- Select Employee --</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
            </select>
          </div>
        </div>

        {/* Load Data Message */}
        {employees.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#3498db' }}>Loading Employees...</div>
        )}

        {/* Tabs */}
        {employees.length > 0 && (
          <div style={{ display: 'flex', borderBottom: '2px solid #3498db', marginBottom: '20px', gap: '2px' }} className="print-hidden">
            {['Details', 'Payment Days', 'Earnings & Deductions', 'Net Pay Info'].map(t => (
              <div
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '12px 24px',
                  cursor: 'pointer',
                  background: activeTab === t ? '#3498db' : '#f8f9fa',
                  color: activeTab === t ? '#fff' : '#2c3e50',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: activeTab === t ? '700' : '500',
                  transition: 'all 0.3s ease'
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}

        {selectedEmployee && attendanceSummary && (
          <div className="salary-content">
            {/* TAB 1: DETAILS */}
            <div style={{ display: activeTab === 'Details' ? 'block' : 'none' }} className="tab-pane">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <Field label="Employee ID" value={selectedEmployee.employeeId} />
                  <Field label="Name" value={selectedEmployee.name} />
                  <Field label="Designation" value={designation} />
                  <Field label="Join Date" value={postingDate} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#555', marginBottom: '2px', textTransform: 'uppercase' }}>Start</label>
                      <input type="date" style={{ width: '100%', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#555', marginBottom: '2px', textTransform: 'uppercase' }}>End</label>
                      <input type="date" style={{ width: '100%', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px', textTransform: 'uppercase' }}>Mode of Payment</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} value={modeOfPayment} onChange={e => setModeOfPayment(e.target.value)}>
                    <option>Bank Transfer</option><option>Cash</option><option>Cheque</option>
                  </select>
                  <div style={{ height: '15px' }}></div>
                  <Field label="Payroll Freq" value={payrollFrequency} />
                  <Field label="Status" value={status} />
                </div>
              </div>
            </div>

            {/* TAB 2: DAYS */}
            <div style={{ display: activeTab === 'Payment Days' ? 'block' : 'none' }} className="tab-pane">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#1976d2', fontWeight: 'bold', marginBottom: '8px' }}>TOTAL DAYS</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>{totalWorkingDays}</div>
                </div>
                <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '8px' }}>PRESENT</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>{attendanceSummary.presentCount}</div>
                </div>
                <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#ef6c00', fontWeight: 'bold', marginBottom: '8px' }}>HALF DAYS</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>{attendanceSummary.halfDayCount}</div>
                </div>
                <div style={{ background: '#e0f2f1', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#00695c', fontWeight: 'bold', marginBottom: '8px' }}>PAID LEAVES</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#00897b' }}>{attendanceSummary.paidLeaveCount}</div>
                </div>
                <div style={{ background: '#fce4ec', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#c2185b', fontWeight: 'bold', marginBottom: '8px' }}>UNPAID / ABSENT</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#c62828' }}>{attendanceSummary.unpaidLeaveCount + attendanceSummary.absentCount}</div>
                </div>
              </div>
              <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600' }}>Final Payment Days:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#27ae60' }}>{attendanceSummary.paymentDays} / {totalWorkingDays}</span>
                </div>
              </div>
            </div>

            {/* TAB 3: EARNINGS & DEDUCTIONS */}
            <div style={{ display: activeTab === 'Earnings & Deductions' ? 'block' : 'none' }} className="tab-pane">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div>
                  <h5 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>Earnings</h5>
                  {earnings.map((earning, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555' }}>{earning.component}</span>
                      <input
                        type="number"
                        value={earning.amount}
                        onChange={(e) => updateEarning(idx, parseFloat(e.target.value) || 0)}
                        style={{ width: '120px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h5 style={{ borderBottom: '2px solid #e74c3c', paddingBottom: '10px' }}>Deductions</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#c0392b' }}>
                    <span>Loss of Pay ({totalWorkingDays - attendanceSummary.paymentDays} days)</span>
                    <span style={{ fontWeight: '600' }}>{currency} {formatCurrency(leaveWithoutPayAmount)}</span>
                  </div>
                  {rosterDeductions.length > 0 && (
                    <>
                      <h6 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginTop: '15px' }}>Roster Deductions</h6>
                      {rosterDeductions.map((rd, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ flex: 1, fontSize: '13px' }}>{rd.date}</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={rd.amount}
                            onChange={(e) => updateRosterRow(i, 'amount', parseFloat(e.target.value) || 0)}
                            style={{ width: '100px', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TAB 4: NET PAY */}
            <div style={{ display: activeTab === 'Net Pay Info' ? 'block' : 'none' }} className="tab-pane">
              <div style={{ background: '#2c3e50', color: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>NET PAYABLE FOR {selectedMonth}</div>
                <div style={{ fontSize: '48px', fontWeight: '800' }}>{currency} {formatCurrency(netPay)}</div>
                <div style={{ marginTop: '15px', fontStyle: 'italic', opacity: 0.9 }}>{totalInWords}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>GROSS PAY</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#27ae60' }}>{currency} {formatCurrency(grossPay)}</div>
                </div>
                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>TOTAL DEDUCTIONS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#e74c3c' }}>{currency} {formatCurrency(totalDeductions)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedEmployee && (
          <div style={{ padding: '80px', textAlign: 'center', color: '#bdc3c7' }}>
            <FaUser style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.3 }} />
            <h4>Please select an employee to generate salary slip</h4>
          </div>
        )}
      </div>
      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => {}}
        targetDocType="Salary Slip"
      />
    </div>
  );
};

export default SalarySlip;
