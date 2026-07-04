// src/components/Form/attendanceview.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import {
  FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaCheck, FaTimes,
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaBriefcase, FaBed,
  FaStar, FaExclamationTriangle, FaHourglassHalf, FaSignOutAlt, FaSignInAlt,
  FaBusinessTime, FaCheckDouble
} from 'react-icons/fa';

const AttendanceView = () => {
  const navigate = useNavigate();
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]); // Add logic to fetch shifts
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summary, setSummary] = useState(null);
  const [leaveApps, setLeaveApps] = useState([]); // NEW: Store leaves

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Global State

  // Modal States
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // Stores ID of record to delete

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [dataScope, setDataScope] = useState("All Data");
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Initial Fetch: Permissions, Employees & Shifts
  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    const init = async () => {
      setLoading(true);
      try {
        const currentBaseUrl = baseUrl || '';
        const scope = await fetchPermissions(currentBaseUrl);

        const empRes = await axios.get(`${baseUrl}/api/add-employee`, {
          headers: getHeaders(),
          params: {
            userId: user?.userId || user?._id || user?.id,
            role: user?.role,
            pageId: 'view_attendance',
            branch_name: selectedBranchFilter
          }
        });
        let employeeList = empRes.data || [];

        if (employeeList.length === 1 && !selectedEmployee) {
          const onlyEmp = employeeList[0];
          setSelectedEmployee(onlyEmp._id || onlyEmp.id);
        }

        setEmployees(employeeList);

        const shiftRes = await axios.get(`${currentBaseUrl}/api/schedules`, { headers: getHeaders() });
        setShifts(shiftRes.data || []);

      } catch (err) {
        console.error("Init Error:", err);
        setError("Failed to initialize. Ensure server is running.");
      }
    };

    const fetchPermissions = async (currentBaseUrl) => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const role = u.role;
          setIsCompanyAdmin(role === 'company_admin' || role === 'admin');
          setIsGroupAdmin(role === 'group_admin' || role === 'Super Admin' || u.isGlobalAdmin === true);
          setUserBranch(u.branch_name || u.branch || "");
          if (role) {
            const userEmail = u.email || '';
            const url = `${currentBaseUrl}/api/role-permissions?role=${role}&email=${userEmail}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'view_attendance');
            if (pagePerm) {
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
              const scope = pagePerm.dataAccess || pagePerm.dataScope || "All Data";
              setDataScope(scope);
              return scope;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
      return "All Data";
    };

    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/branches`, { headers: getHeaders() });
        const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    init();
    fetchBranches();
  }, [baseUrl, configLoading, user, selectedBranchFilter]);

  // Fetch Attendance when filters change
  useEffect(() => {
    // Only fetch if month is selected. 
    // baseUrl can be an empty string in server mode, so we don't check for truthiness,
    // but we ensure it's not undefined (meaning useState has initialized)
    if (selectedMonth && baseUrl !== undefined) {
      fetchData();
    } else {
      setAttendances([]);
      setSummary(null);
    }
  }, [baseUrl, selectedEmployee, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${baseUrl}/api/attendance`;
      const response = await axios.get(url, {
        headers: getHeaders(),
        params: {
          employee_id: selectedEmployee,
          month: selectedMonth,
          userId: user?.userId || user?._id || user?._id,
          role: user?.role
        }
      });

      // NEW: Fetch Approved Leaves
      try {
        const leaveRes = await axios.get(`${baseUrl}/api/leave-applications`, {
          headers: getHeaders(),
          params: {
            employee_id: selectedEmployee,
            // Backend supports filtering by employee_id when access is ALL, or logic handles OWN
            userId: user?.userId || user?._id || user?.id,
            role: user?.role
          }
        });
        // Filter strictly for this view if needed, but backend should handle scope
        setLeaveApps(leaveRes.data || []);
      } catch (err) {
        console.warn("Failed to fetch leaves", err);
      }

      let data = [];
      if (response.data.summary && response.data.records) {
        data = response.data.records;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.records) {
        data = response.data.records;
      }

      setAttendances(data);
      calculateSummary(data);

      setLoading(false);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`Failed to fetch data: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  // Helper to get plan time
  const getPlannedTimeDisplay = (att) => {
    return `${att.planned_start_time || '--:--'} - ${att.planned_end_time || '--:--'}`;
  };

  // Helper to get days in month
  const getDaysInMonth = (monthStr) => {
    if (!monthStr) return [];
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date).toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // Group records by Employee + Date
  const getGroupedAttendances = () => {
    // If no employee selected, just show raw list (admin view typically)
    // But if "Own Data" user, selectedEmployee is auto-set.
    if (!selectedEmployee) {
      const groups = {};
      attendances.forEach(att => {
        const key = `${att.attendance_date}_${att.employee_id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(att);
      });
      return Object.values(groups).map(group => processGroup(group)).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
    }

    // If Employee Selected: Generate Full Calendar
    let days = getDaysInMonth(selectedMonth);
    const employeeDetails = employees.find(e => e._id === selectedEmployee || e.id === selectedEmployee);

    // NEW: Filter out future dates (Stop at today)
    const today = new Date().toISOString().split('T')[0];
    days = days.filter(d => d <= today);

    return days.map(date => {
      // Find existing records for this date
      const dayRecords = attendances.filter(a => a.attendance_date === date && (a.employee_id === selectedEmployee || a.employee?._id === selectedEmployee));

      if (dayRecords.length > 0) {
        return processGroup(dayRecords);
      }

      // Check for Approved Leave
      const approvedLeave = leaveApps.find(l => {
        // Handle date string formats
        const start = l.from_date.split('T')[0];
        const end = l.to_date.split('T')[0];
        // Match employee and date range and status
        const isEmpMatch = !selectedEmployee || (l.employee_id === selectedEmployee || l.employee_id?._id === selectedEmployee || l.employee?._id === selectedEmployee);
        return isEmpMatch && l.status === 'APPROVED' && date >= start && date <= end;
      });

      if (approvedLeave) {
        return {
          attendance_date: date,
          employee_id: selectedEmployee,
          employee: employeeDetails || { name: 'Unknown', employeeId: 'N/A' },
          status: approvedLeave.leave_name || 'Paid Leave',
          planned_time_display: 'On Leave',
          actual_time_display: '---',
          worked_minutes: 0,
          overtime_minutes: 0,
          late_minutes: 0,
          early_exit_minutes: 0,
          notes: `Leave: ${approvedLeave.leave_name} (${approvedLeave.leave_mode})`,
          is_virtual: true,
          color: '#e67e22' // Orange/Carrot for leave
        };
      }

      // No record? Generate placeholder
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun (0), Sat (6)

      return {
        attendance_date: date,
        employee_id: selectedEmployee,
        employee: employeeDetails || { name: 'Unknown', employeeId: 'N/A' },
        status: isWeekend ? 'WeeklyOff' : 'N/A', // Default to WeeklyOff for Sat/Sun
        planned_time_display: '--:-- - --:--',
        actual_time_display: '---',
        worked_minutes: 0,
        overtime_minutes: 0,
        late_minutes: 0,
        early_exit_minutes: 0,
        notes: isWeekend ? 'Weekly Off' : 'No Record',
        is_virtual: true // Mark as virtual so we don't try to edit/delete
      };
    }).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  };

  const processGroup = (group) => {
    const base = { ...group[0] }; // Clone first record as base

    // Ensure numeric fields are numbers
    base.worked_minutes = Number(base.worked_minutes) || 0;
    base.overtime_minutes = Number(base.overtime_minutes) || 0;
    base.late_minutes = Number(base.late_minutes) || 0;
    base.early_exit_minutes = Number(base.early_exit_minutes) || 0;

    if (group.length > 1) {
      // It's a split shift day with multiple EXISTING records
      // Sort by time
      group.sort((a, b) => (a.planned_start_time || '').localeCompare(b.planned_start_time || ''));

      // Merge Fields for Display
      base.planned_time_display = group.map(g => `${g.planned_start_time}-${g.planned_end_time}`).join(', ');
      base.actual_time_display = group.map(g => `${g.actual_check_in || 'N/A'}-${g.actual_check_out || 'N/A'}`).join(', ');

      // Summing up numeric stats for the day
      base.worked_minutes = group.reduce((sum, g) => sum + (Number(g.worked_minutes) || 0), 0);
      base.overtime_minutes = group.reduce((sum, g) => sum + (Number(g.overtime_minutes) || 0), 0);
      base.late_minutes = group.reduce((sum, g) => sum + (Number(g.late_minutes) || 0), 0);
      base.early_exit_minutes = group.reduce((sum, g) => sum + (Number(g.early_exit_minutes) || 0), 0);

      // Combine unique notes
      const allNotes = [...new Set(group.map(g => g.notes).filter(n => n))].join('; ');
      base.notes = allNotes;

      // Mark as merged
      base.isMerged = true;
      base.relatedRecords = group;
    } else {
      // Single Record
      base.planned_time_display = getPlannedTimeDisplay(base);
      // Only show actual times if Status is Present/Late/HalfDay etc, or if data exists
      if (base.actual_check_in || base.actual_check_out) {
        base.actual_time_display = `${base.actual_check_in || 'N/A'} - ${base.actual_check_out || 'N/A'}`;
      } else {
        base.actual_time_display = '---';
      }
    }
    return base;
  };

  const groupedAttendances = getGroupedAttendances();

  const calculateSummary = (data) => {
    const stats = {
      total_days: 0,
      working_days: 0,
      present_days: 0,
      absent_days: 0,
      weekly_offs: 0,
      holidays: 0,
      leave_days: 0,
      half_days: 0,
      total_overtime_mins: 0,
      total_late_mins: 0,
      total_early_mins: 0
    };

    // If we have groupedAttendances (which includes virtual days), use that for summary!
    // But calculateSummary is called in fetchData with raw data. 
    // We should probably rely on groupedAttendances for the summary to be accurate with the view.
    // However, recalculating summary from render data is safer.

    // Let's use the generated groupedAttendances for summary if available
    const sourceData = groupedAttendances.length > 0 ? groupedAttendances : data;

    const uniqueDays = new Set();

    sourceData.forEach(att => {
      const key = `${att.attendance_date}_${att.employee_id}`;
      // Logic: For numeric aggregates (OT, Late), we sum ALL records (even split shifts). 
      // For Day Counts, we simpler logic: we count the day once based on "primary" status 
      // OR we just iterate all records but handle the "Day" count uniquely.

      // Let's iterate all records for Minutes summation
      stats.total_overtime_mins += (Number(att.overtime_minutes) || 0);
      stats.total_late_mins += (Number(att.late_minutes) || 0);
      stats.total_early_mins += (Number(att.early_exit_minutes) || 0);

      if (!uniqueDays.has(key)) {
        uniqueDays.add(key);
        stats.total_days++;

        const status = att.status;
        const specialType = att.special_day_type;

        // Categorize Status (Prioritize Holidays and Weekly Offs)
        if (status === 'Holiday' || specialType === 'Holiday') stats.holidays++;
        else if (status === 'WeeklyOff' || specialType === 'WeeklyOff') stats.weekly_offs++;
        else if (status === 'Present') stats.present_days++;
        else if (status === 'Absent') stats.absent_days++;
        else if (['On Leave', 'Leave', 'Paid Leave'].includes(status)) stats.leave_days++;
        else if (status === 'HalfDay' || specialType === 'HalfDay') stats.half_days++;

        // Generic Working Days (Present, HalfDay, Extended)
        const nonWorkingStatuses = ['Absent', 'On Leave', 'Leave', 'Paid Leave', 'WeeklyOff', 'Holiday', 'N/A'];
        if (!nonWorkingStatuses.includes(status)) {
          stats.working_days++;
        }
      }
    });

    setSummary(stats);
  };

  // Convert minutes to HH:MM
  const minsToTime = (mins) => {
    if (!mins) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Delete Handlers
  const initiateDelete = (id) => setItemToDelete(id);
  const confirmDelete = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete attendance records.");
      setItemToDelete(null);
      return;
    }
    if (!itemToDelete) return;
    try {
      await axios.delete(`${baseUrl}/api/attendance`, {
        data: { _id: itemToDelete },
        headers: getHeaders()
      });
      setMessage('Record deleted successfully');
      fetchData();
    } catch (err) {
      setError(`Delete failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setItemToDelete(null);
    }
  };
  const cancelDelete = () => setItemToDelete(null);

  const handleEdit = (rec) => {
    if (!canWrite) {
      setError("You do not have permission to edit attendance records.");
      return;
    }
    // Navigate by Employee & Date
    navigate(`/attendance?employee_id=${rec.employee_id}&date=${rec.attendance_date}`, {
      state: { attendance: rec.isMerged ? rec.relatedRecords[0] : rec }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return '#27ae60';
      case 'Absent': return '#e74c3c';
      case 'WeeklyOff': return '#95a5a6';
      case 'Holiday': return '#8e44ad';
      case 'Extended': return '#f39c12';
      case 'HalfDay': return '#d35400';
      case 'On Leave':
      case 'Leave': return '#e67e22';
      case 'Paid Leave': return '#16a085';
      default: return '#2c3e50';
    }
  };

  // Trigger summary calculation when groupedAttendances changes
  useEffect(() => {
    if (groupedAttendances.length > 0) {
      calculateSummary(groupedAttendances);
    }
  }, [JSON.stringify(groupedAttendances)]); // Deep compare to avoid loops

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed', top: '20px', left: '20px',
          background: 'white', color: '#3498db', border: 'none',
          padding: '10px 20px', borderRadius: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer',
          fontWeight: '600', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{
        maxWidth: '1400px', margin: '60px auto', background: 'white',
        borderRadius: '15px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f0f2f5', paddingBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClock style={{ color: '#3498db' }} /> Detailed Attendance View
          </h2>
          <button
            onClick={() => {
              if (!canWrite) {
                setError("You do not have permission to create attendance records.");
                return;
              }
              navigate('/attendance');
            }}
            style={{
              padding: '10px 25px', background: '#3498db', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(52, 152, 219, 0.3)'
            }}
          >
            <FaEdit /> Add / Manual Entry
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '1rem' }}
            />
          </div>
          {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Select Branch</label>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '1rem', background: 'white' }}
              >
                <option value="">All Branches</option>
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#7f8c8d' }}>Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '1rem', background: 'white' }}
            >
              <option value="">-- Select Employee --</option>
              {employees.length > 1 && !(['Own Data', 'OWN', 'Own'].includes(dataScope)) && (
                <option value="">-- All Employees --</option>
              )}
              {employees.map(emp => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.name || emp.employeeName || 'No Name'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages - CENTRED OVERLAY */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            color: '#e74c3c',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 2000,
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            minWidth: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <FaExclamationTriangle size={40} />
            <div>{error}</div>
            <button
              onClick={() => setError('')}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                alignSelf: 'center'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {message && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            color: '#27ae60',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            zIndex: 2000,
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            minWidth: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <FaCheckDouble size={40} />
            <div>{message}</div>
            <button
              onClick={() => setMessage('')}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                alignSelf: 'center'
              }}
            >
              OK
            </button>
          </div>
        )}

        {/* Detailed Summary Dashboard */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <SummaryWidget title="Total Days" value={summary.total_days} color="#3498db" icon={<FaCalendarAlt />} />
            <SummaryWidget title="Present" value={summary.present_days} color="#27ae60" icon={<FaCheck />} />
            <SummaryWidget title="Absent" value={summary.absent_days} color="#e74c3c" icon={<FaTimes />} />
            <SummaryWidget title="Week Offs" value={summary.weekly_offs} color="#95a5a6" icon={<FaBed />} />
            <SummaryWidget title="Holidays" value={summary.holidays} color="#8e44ad" icon={<FaStar />} />
            <SummaryWidget title="Leaves" value={summary.leave_days} color="#e67e22" icon={<FaSignOutAlt />} />
            <SummaryWidget title="Late Mins" value={summary.total_late_mins} color="#d35400" icon={<FaHourglassHalf />} />
            <SummaryWidget title="Early Exit Mins" value={summary.total_early_mins} color="#c0392b" icon={<FaSignInAlt />} />
            <SummaryWidget title="Overtime" value={minsToTime(summary.total_overtime_mins)} color="#f39c12" icon={<FaBusinessTime />} />
          </div>
        )}

        {/* Detailed Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #f1f2f6', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', color: '#2c3e50', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Plan Time</th>
                <th style={thStyle}>Actual Time</th>
                <th style={thStyle}>Worked</th>
                <th style={thStyle}>Overtime</th>
                <th style={thStyle}>Late</th>
                <th style={thStyle}>Early Exit</th>
                <th style={thStyle}>Notes</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Loading data...</td></tr>
              ) : groupedAttendances.length > 0 ? (
                groupedAttendances.map((att, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f2f6', background: idx % 2 === 0 ? 'white' : '#fcfcfc' }}>

                    {/* Date */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600' }}>{att.attendance_date}</div>
                      <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>{new Date(att.attendance_date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                    </td>

                    {/* Employee */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>{att.employee?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{att.employee?.employeeId || 'N/A'}</div>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                        backgroundColor: getStatusColor(att.status) + '20', color: getStatusColor(att.status),
                        border: `1px solid ${getStatusColor(att.status)}30`
                      }}>
                        {att.status}
                      </span>
                      {att.isMerged && <div style={{ fontSize: '0.7rem', color: '#3498db', marginTop: '4px' }}>(Split Shift)</div>}
                      {att.is_roster && <div style={{ fontSize: '0.7rem', backgroundColor: '#8e44ad', color: 'white', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>Roster Duty</div>}
                    </td>

                    {/* Plan Time */}
                    <td style={tdStyle}>{att.planned_time_display}</td>

                    {/* Actual Time */}
                    <td style={tdStyle}>{att.actual_time_display}</td>

                    {/* Worked */}
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{minsToTime(att.worked_minutes)}</td>

                    {/* Overtime */}
                    <td style={{ ...tdStyle, color: att.overtime_minutes > 0 ? '#27ae60' : 'inherit', fontWeight: att.overtime_minutes > 0 ? '600' : '400' }}>
                      {att.overtime_minutes > 0 ? minsToTime(att.overtime_minutes) : '-'}
                    </td>

                    {/* Late */}
                    <td style={{ ...tdStyle, color: att.late_minutes > 0 ? '#e74c3c' : 'inherit', fontWeight: att.late_minutes > 0 ? '600' : '400' }}>
                      {att.late_minutes > 0 ? `${att.late_minutes} min` : '-'}
                    </td>

                    {/* Early Exit */}
                    <td style={{ ...tdStyle, color: att.early_exit_minutes > 0 ? '#d35400' : 'inherit', fontWeight: att.early_exit_minutes > 0 ? '600' : '400' }}>
                      {att.early_exit_minutes > 0 ? `${att.early_exit_minutes} min` : '-'}
                    </td>

                    {/* Notes */}
                    <td style={{ ...tdStyle, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={att.notes}>{att.notes || '-'}</td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <ActionButton icon={<FaEye />} color="#3498db" onClick={() => setSelectedAttendance(att)} title="View Details" />
                        {!att.is_virtual && <ActionButton icon={<FaEdit />} color="#f39c12" onClick={() => handleEdit(att)} title="Edit" />}
                        {!att.is_virtual && <ActionButton icon={<FaTrash />} color="#e74c3c" onClick={() => initiateDelete(att._id)} title="Delete" />}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>No records found for the selected month.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedAttendance && (
        <div style={itemsModalOverlay} onClick={() => setSelectedAttendance(null)}>
          <div style={itemsModalContent} onClick={e => e.stopPropagation()}>
            <div style={itemsModalHeader}>
              <h3>Full Details</h3>
              <button onClick={() => setSelectedAttendance(null)} style={closeBtn}><FaTimes /></button>
            </div>
            <div style={itemsModalBody}>
              <div style={gridContainer}>
                <DetailBox label="Date" value={selectedAttendance.attendance_date} />
                <DetailBox label="Employee" value={selectedAttendance.employee?.name || '--'} />
                <DetailBox label="Status" value={selectedAttendance.status} color={getStatusColor(selectedAttendance.status)} bold />
                <DetailBox label="Special Type" value={selectedAttendance.special_day_type} />
                <DetailBox label="Shift ID" value={selectedAttendance.shift_id || 'N/A'} small />
                <DetailBox label="Schedule ID" value={selectedAttendance.schedule_id || 'N/A'} small />
                <DetailBox label="Planned Time" value={selectedAttendance.planned_time_display} />
                <DetailBox label="Actual Time" value={selectedAttendance.actual_time_display} />
                <DetailBox label="Start (Plan)" value={selectedAttendance.planned_start_time} small />
                <DetailBox label="End (Plan)" value={selectedAttendance.planned_end_time} small />
                <DetailBox label="Log In" value={selectedAttendance.actual_check_in || 'N/A'} small />
                <DetailBox label="Log Out" value={selectedAttendance.actual_check_out || 'N/A'} small />
                <DetailBox label="Worked Mins" value={selectedAttendance.worked_minutes} highlight />
                <DetailBox label="Overtime Mins" value={selectedAttendance.overtime_minutes} color="#f39c12" />
                <DetailBox label="Late Mins" value={selectedAttendance.late_minutes} color="#e74c3c" />
                <DetailBox label="Early Exit Mins" value={selectedAttendance.early_exit_minutes} color="#d35400" />
                <DetailBox label="Overnight?" value={selectedAttendance.is_overnight ? 'YES' : 'NO'} />
                <DetailBox label="Roster Duty?" value={selectedAttendance.is_roster ? 'YES' : 'NO'} highlight={selectedAttendance.is_roster} />
                <DetailBox label="Type" value={selectedAttendance.is_virtual ? 'Projected (Virtual)' : 'Actual Record'} />
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={detailLabel}>Notes</label>
                  <div style={noteBox}>{selectedAttendance.notes || 'No notes available.'}</div>
                </div>
                {!selectedAttendance.is_virtual && (
                  <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: '#bdc3c7', marginTop: '10px' }}>
                    Record ID: {selectedAttendance._id} <br />
                    Created At: {selectedAttendance.created_at || 'Unknown'}
                  </div>
                )}
              </div>
            </div>
            <div style={itemsModalFooter}>
              <button onClick={() => setSelectedAttendance(null)} style={primaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {itemToDelete && (
        <div style={itemsModalOverlay}>
          <div style={{ ...itemsModalContent, maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '15px' }} />
              <h3 style={{ color: '#2c3e50' }}>Delete Record?</h3>
              <p style={{ color: '#7f8c8d' }}>Are you sure you want to delete this attendance entry? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button onClick={cancelDelete} style={secondaryBtn}>Cancel</button>
                <button onClick={confirmDelete} style={{ ...primaryBtn, background: '#e74c3c' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- STYLES & SUB-COMPONENTS ---

const thStyle = {
  padding: '15px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '12px 15px', color: '#34495e', borderBottom: '1px solid #f1f2f6'
};

const SummaryWidget = ({ title, value, color, icon }) => (
  <div style={{
    background: 'white', padding: '15px', borderRadius: '12px',
    border: `1px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: '5px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#95a5a6', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{title}</span>
      <span style={{ color: color, fontSize: '1.2rem' }}>{icon}</span>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>{value}</div>
  </div>
);

const ActionButton = ({ icon, color, onClick, title }) => (
  <button onClick={onClick} title={title} style={{
    background: 'white', color: color, border: `1px solid ${color}`,
    width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem'
  }}
    onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}
  >
    {icon}
  </button>
);

const DetailBox = ({ label, value, color, bold, small, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '0.75rem', color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase' }}>{label}</label>
    <div style={{
      fontSize: small ? '0.85rem' : '1rem',
      fontWeight: bold || highlight ? '700' : '500',
      color: color || (highlight ? '#3498db' : '#2c3e50')
    }}>
      {value || (small ? '' : 'N/A')}
    </div>
  </div>
);

// New Modal Styles (Clean & Modern)
const itemsModalOverlay = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
  backdropFilter: 'blur(3px)'
};
const itemsModalContent = {
  background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
  animation: 'fadeIn 0.2s ease-out'
};
const itemsModalHeader = {
  padding: '20px 25px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const itemsModalBody = {
  padding: '25px', maxHeight: '70vh', overflowY: 'auto'
};
const itemsModalFooter = {
  padding: '15px 25px', background: '#f8f9fa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end'
};
const closeBtn = {
  background: 'none', border: 'none', fontSize: '1.2rem', color: '#95a5a6', cursor: 'pointer'
};
const gridContainer = {
  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'
};
const detailLabel = {
  display: 'block', fontSize: '0.75rem', color: '#95a5a6', fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase'
};
const noteBox = {
  background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '0.9rem', color: '#495057'
};
const primaryBtn = {
  padding: '10px 25px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
};
const secondaryBtn = {
  padding: '10px 25px', background: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
};

export default AttendanceView;
