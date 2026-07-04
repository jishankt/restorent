import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaCheck,
    FaTimes,
    FaLayerGroup,
    FaListUl,
    FaUserClock,
    FaUmbrellaBeach,
    FaExchangeAlt,
    FaExclamationCircle,
    FaCog
} from 'react-icons/fa';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import CustomerCustomizationModal from "./CustomerCustomizationModal";

const Roaster = () => {
    const navigate = useNavigate();
    const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);

    // Data States
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [designations, setDesignations] = useState([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDesignation, setSelectedDesignation] = useState('All');
    const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState(() => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const isGlobal = checkIsGlobalAdmin(u) || checkIsGlobalAdmin({ role: localStorage.getItem('role') });
        if (!isGlobal && (u.branch_name || u.branch) && (u.branch_name || u.branch) !== 'All') return u.branch_name || u.branch;
        return '';
    });
    const [selectedCompany, setSelectedCompany] = useState(() => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const isGlobal = checkIsGlobalAdmin(u) || checkIsGlobalAdmin({ role: localStorage.getItem('role') });
        if (!isGlobal && (u.company_name || u.company)) return u.company_name || u.company;
        return 'All';
    });
    const [companyOptions, setCompanyOptions] = useState([]);
    const [userBranch, setUserBranch] = useState("");
    const [accessibleDesignations, setAccessibleDesignations] = useState([]); // NEW: For hierarchy access
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    
    const isGlobalMaster = checkIsGlobalAdmin(user) || checkIsGlobalAdmin({ role: localStorage.getItem('role') });

    // Dynamic Shift Slots based on configured schedules/shifts
    const timeSlots = useMemo(() => {
        if (!shifts || shifts.length === 0) return [];
        return shifts.map(s => {
            const slot = s.time_slots && s.time_slots[0];
            const timing = slot ? `${slot.start_time} - ${slot.end_time}` : '';
            return {
                id: String(s._id || s.id),
                label: timing ? `${s.schedule_name} (${timing})` : s.schedule_name
            };
        });
    }, [shifts]);

    // Helper to convert AM/PM or 24h string to comparable 24h minutes
    const convertTo24Hour = (timeStr) => {
        if (!timeStr) return 0;
        try {
            // Handle AM/PM
            if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':');
                if (hours === '12') hours = '00';
                if (modifier.toLowerCase() === 'pm') hours = parseInt(hours, 10) + 12;
                return `${String(hours).padStart(2, '0')}:${String(minutes || '00').padStart(2, '0')}`;
            }
            // Already 24h or close to it
            return timeStr.padStart(5, '0');
        } catch (e) {
            return timeStr;
        }
    };

    // Initialize Data
    useEffect(() => {
        // Wait for config to load
        if (configLoading) return;

        // Use current baseUrl or empty string (relative path)
        const currentBaseUrl = baseUrl || '';

        const fetchAllData = async () => {
            try {
                setLoading(true);

                const active_branch = selectedBranchFilter || localStorage.getItem('active_branch') || localStorage.getItem('branch_name');
                const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
                setIsCompanyAdmin(checkIsAdmin(currentUser));
                setUserBranch(currentUser.branch_name || currentUser.branch || "");

                // Clean up params based on available user data
                const params = { pageId: 'roaster' };
                if (currentUser) {
                    const userId = currentUser.userId || currentUser._id || currentUser.id;
                    if (userId) params.userId = userId;
                    if (currentUser.role) params.role = currentUser.role;
                }

                const active_company = selectedCompany !== 'All' ? selectedCompany : null;
                if (active_company) params.company = active_company;
                if (active_branch) params.branch = active_branch;

                const headers = getHeaders(active_branch, active_company);

                // Individual fetching with try/catch for resilience
                let roleRes = { data: { permissions: [], accessible_designations: [] } };
                try { roleRes = await axios.get(`${currentBaseUrl}/api/role-permissions`, { params: { role: currentUser.role }, headers }); } catch (e) { console.error("Roster: Failed to fetch permissions", e); }
                
                const accDesigs = roleRes.data?.accessible_designations || [];
                setAccessibleDesignations(accDesigs);

                let empRes = { data: [] }, assignRes = { data: [] }, schedRes = { data: [] }, leaveRes = { data: [] }, desigRes = { data: [] };
                
                await Promise.all([
                    (async () => { try { empRes = await axios.get(`${currentBaseUrl}/api/add-employee`, { params: { ...params, pageId: 'roaster' }, headers }); } catch (e) { console.error("Roster: Failed to fetch employees", e); } })(),
                    (async () => { try { assignRes = await axios.get(`${currentBaseUrl}/api/schedule-assignments`, { params: { ...params, pageId: 'roaster' }, headers }); } catch (e) { console.error("Roster: Failed to fetch assignments", e); setError("Some assignments could not be loaded."); } })(),
                    (async () => { try { schedRes = await axios.get(`${currentBaseUrl}/api/schedules`, { params: { ...params, pageId: 'schedule_master' }, headers }); } catch (e) { console.error("Roster: Failed to fetch schedules", e); setError("Core schedules could not be loaded."); } })(),
                    (async () => { try { leaveRes = await axios.get(`${currentBaseUrl}/api/leave-applications`, { params: { ...params, pageId: 'leave_apply' }, headers }); } catch (e) { console.error("Roster: Failed to fetch leaves", e); } })(),
                    (async () => { try { desigRes = await axios.get(`${currentBaseUrl}/api/employee-designations`, { params: { ...params, pageId: 'employee_designations' }, headers }); } catch (e) { console.error("Roster: Failed to fetch designations", e); } })()
                ]);

                let allEmps = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);

                // Filter employees by Data Access Scope
                let filteredEmps = allEmps;
                const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
                const currentUserId = freshUser.userId || freshUser._id || freshUser.id;
                const currentUserEmpId = freshUser.employeeId || freshUser.employee_id;

                const roasterPerms = roleRes.data?.permissions?.find(p => p.pageId === 'roaster') || {};
                const dataAccess = roasterPerms.dataAccess || 'ALL';

                if (!isCompanyAdmin) {
                    const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
                    
                    const isSelf = (emp) => {
                        return emp._id === currentUserId || 
                               emp.id === currentUserId || 
                               emp.employeeId === currentUserEmpId ||
                               (emp.email && freshUser.email && String(emp.email).toLowerCase() === String(freshUser.email).toLowerCase()) ||
                               (emp.username && freshUser.username && String(emp.username).toLowerCase() === String(freshUser.username).toLowerCase());
                    };

                    if (dataAccess === 'OWN') {
                        filteredEmps = allEmps.filter(emp => isSelf(emp));
                    } else if (dataAccess === 'HIERARCHY' && accDesigs.length > 0) {
                        const normalizedAcc = accDesigs.map(d => String(d).trim().toLowerCase());
                        
                        // Ensure user's own designation is always included
                        const myDesig = String(freshUser.designation || freshUser.role || '').trim().toLowerCase();
                        if (myDesig && !normalizedAcc.includes(myDesig)) {
                            normalizedAcc.push(myDesig);
                        }

                        filteredEmps = allEmps.filter(emp => {
                            const empDesig = String(emp.employeeDesignation || emp.designation || '').trim().toLowerCase();
                            return normalizedAcc.includes(empDesig) || isSelf(emp);
                        });
                    }
                    
                    // Always force include the current user if they were missed (for OWN and HIERARCHY)
                    if (dataAccess !== 'ALL' && !filteredEmps.some(e => isSelf(e))) {
                         const selfObj = allEmps.find(e => isSelf(e));
                         if (selfObj) filteredEmps.push(selfObj);
                    }
                }

                setEmployees(filteredEmps);
                setAssignments(assignRes.data || []);
                setSchedules(schedRes.data || []);
                setShifts(schedRes.data || []);
                setLeaves(leaveRes.data || []);

                // Filter designations by hierarchy
                let allDesigs = (desigRes.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                if (!isCompanyAdmin && accDesigs.length > 0) {
                    const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
                    // Current user's possible designation/role tokens
                    const myTokens = [
                        String(freshUser.designation || '').trim().toLowerCase(),
                        String(freshUser.employeeDesignation || '').trim().toLowerCase(),
                        String(freshUser.role || '').trim().toLowerCase()
                    ].filter(t => t !== '');

                    // Normalized accessible designations
                    const normalizedAcc = accDesigs.map(d => String(d).trim().toLowerCase());

                    allDesigs = allDesigs.filter(d => {
                        const dName = String(d.name || '').trim().toLowerCase();
                        return normalizedAcc.includes(dName) || myTokens.includes(dName);
                    });
                }
                setDesignations(allDesigs);
                
                // Extract company options from employees for filtering
                if (isGlobalMaster) {
                    const companies = new Set();
                    allEmps.forEach(emp => {
                        const comps = emp.companies || emp.company_names || [emp.company_name || emp.company];
                        if (Array.isArray(comps)) comps.forEach(c => c && companies.add(c));
                        else if (comps) companies.add(comps);
                    });
                    setCompanyOptions(Array.from(companies).sort());
                }

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load some roster data. Please check connection.");
            } finally {
                setLoading(false);
            }
        };

        const fetchBranches = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const headers = getHeaders();
                const response = await axios.get(`${currentBaseUrl}/api/branches`, { headers });
                const branchData = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
                setAvailableBranches(branchData);
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };

        fetchAllData();
        fetchBranches();
    }, [baseUrl, configLoading, user, selectedBranchFilter, selectedCompany]);

    // Filter Employees based on Selected Department
    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        let filtered = employees;

        // Apply Designation Filter
        if (selectedDesignation && selectedDesignation !== 'All') {
            filtered = filtered.filter(emp => {
                const desigName = emp.employeeDesignation || emp.designation || '';
                return String(desigName).trim().toLowerCase() === String(selectedDesignation).trim().toLowerCase();
            });
        }

        return filtered;
    }, [employees, selectedDesignation]);

    // Get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysCount = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let day = 1; day <= daysCount; day++) {
            const currentDate = new Date(year, month, day);
            days.push({
                date: currentDate,
                day: day,
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        return days;
    };

    // Get employees for a specific date and shift
    const getEmployeesForDateTime = (date, targetShiftId) => {
        const dateStr = date.toLocaleDateString('en-CA');
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const employeesAtShift = [];
        const employeesOnLeave = [];

        const substitutesForDate = [];
        assignments.forEach(a => {
            const isSubstitute = (a.notes || '').toLowerCase().includes('substitute for');
            if (isSubstitute) {
                const dateMatch = (a.notes || '').match(/on (\d{4}-\d{2}-\d{2})/);
                const assignedDate = a.assigned_date ? a.assigned_date.split('T')[0] : '';
                if (dateMatch && assignedDate === dateStr) {
                    const nameMatch = (a.notes || '').match(/substitute for ([^\s]+)/i);
                    if (nameMatch) {
                        substitutesForDate.push({
                            substituteId: (a.employee_id || a.employeeId || '').toString(),
                            coveredName: nameMatch[1].toLowerCase()
                        });
                    }
                }
            }
        });

        filteredEmployees.forEach(emp => {
            const empId = (emp._id || emp.id || '').toString();
            const empName = (emp.name || emp.employeeName || '').toString();

            const empAssignments = assignments.filter(a => {
                const aShiftId = (a.schedule_id || a.scheduleId || a.shift_id || a.shiftId || '').toString();
                const targetId = (targetShiftId || '').toString();
                if (aShiftId !== targetId) return false;

                // Robust Multi-Field Match between Assignment and Employee
                const aIdentifiers = [a.employee_id, a.employeeId, a.userId, a.createdBy].filter(Boolean).map(String);
                const eIdentifiers = [emp._id, emp.id, emp.employeeCode, emp.employeeId].filter(Boolean).map(String);
                
                return aIdentifiers.some(aid => eIdentifiers.includes(aid));
            });

            // Synthesize an assignment if the employee has a built-in assigned_schedule
            if (emp.assigned_schedule && emp.assigned_schedule.schedule_name) {
                const shiftRule = schedules.find(s => 
                    String(s.schedule_name).toLowerCase() === String(emp.assigned_schedule.schedule_name).toLowerCase()
                );
                if (shiftRule) {
                    const targetId = (targetShiftId || '').toString();
                    const sId = (shiftRule._id || shiftRule.id || '').toString();
                    if (sId === targetId) {
                        empAssignments.push({
                            schedule_id: sId,
                            employee_id: emp._id || emp.id,
                            is_active: true,
                            assigned_date: emp.assigned_schedule.start_date || '2000-01-01',
                            notes: emp.assigned_schedule.assignment_notes || ''
                        });
                    }
                }
            }

            const validAssignments = empAssignments.filter(a => {
                // If is_active is missing, assume true for robustness
                const isActive = a.is_active !== false; 
                if (!isActive) return false;

                const assignedDate = a.assigned_date ? a.assigned_date.split('T')[0] : '';
                const isSubstitute = (a.notes || '').toLowerCase().includes('substitute for');
                if (isSubstitute) {
                    const dateMatch = (a.notes || '').match(/on (\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) return assignedDate === dateStr;
                }
                return assignedDate <= dateStr;
            });

            validAssignments.forEach(assignment => {
                const rule = schedules.find(s => 
                    (s._id || s.id || '').toString() === (assignment.schedule_id || assignment.scheduleId || '').toString()
                );
                if (!rule) return;

                const workingDays = rule.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                if (!workingDays.includes(dayName)) return;

                const specialDayOverride = (assignment.special_day_assignments || []).find(sd => sd.date === dateStr);
                const specialDayRule = (rule.special_days || []).find(sd => sd.date === dateStr);
                const specialDay = specialDayOverride || (specialDayRule && specialDayRule.is_observed ? specialDayRule : null);

                if (specialDay && specialDay.type === 'Holiday') return;

                const leaveRecord = leaves.find(leave => {
                    const leaveEmpId = (leave.employeeId || leave.employee_id || leave.employee_code || '').toString();
                    if (leaveEmpId !== empId) return false;
                    if (String(leave.status || '').toLowerCase() !== 'approved') return false;
                    const leaveStartStr = (leave.from_date || '').split('T')[0];
                    const leaveEndStr = (leave.to_date || '').split('T')[0];
                    return dateStr >= leaveStartStr && dateStr <= leaveEndStr;
                });

                const isCovered = substitutesForDate.some(sub => sub.coveredName === empName.toLowerCase());
                const isSubstitute = (assignment.notes || '').toLowerCase().includes('substitute for');

                const record = {
                    name: empName,
                    id: empId,
                    designation: emp.employeeDesignation || emp.designation || 'Staff',
                    shiftName: rule.schedule_name,
                };

                if (leaveRecord) {
                    employeesOnLeave.push({ ...record, type: 'leave', leaveType: leaveRecord.leave_type || 'Leave' });
                } else if (isCovered && !isSubstitute) {
                    employeesOnLeave.push({ ...record, type: 'leave', leaveType: 'Covered' });
                } else if (isSubstitute) {
                    employeesAtShift.push({ ...record, type: 'substitute' });
                } else {
                    employeesAtShift.push({ ...record, type: 'regular' });
                }
            });
        });

        return [...employeesAtShift, ...employeesOnLeave];
    };

    const daysInMonth = useMemo(() => getDaysInMonth(calendarMonth), [calendarMonth]);

    const handlePrevMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '60px', height: '60px',
                        border: '4px solid #e9ecef',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <FaCalendarAlt style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#3498db', fontSize: '20px' }} />
                </div>
                <p style={{ marginTop: '20px', color: '#7f8c8d', fontWeight: '500' }}>Loading Roster Schedule...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f1f2f6',
            padding: '20px',
            position: 'relative',
            fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Header & Controls */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: '1px solid #dfe6e9',
                            color: '#636e72', padding: '8px 16px', borderRadius: '30px',
                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600'
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#3498db'; e.currentTarget.style.color = '#3498db'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#dfe6e9'; e.currentTarget.style.color = '#636e72'; }}
                    >
                        <FaArrowLeft /> Back
                    </button>

                    <h2 style={{ margin: 0, fontSize: '20px', color: '#2d3436', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaUserClock style={{ color: '#3498db' }} />
                        Roster Schedule
                    </h2>
                    {(isGlobalMaster || isCompanyAdmin) && (
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
                                padding: '6px 16px',
                                borderRadius: '50px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <FaCog /> Customize
                        </button>
                    )}
                </div>
                {/* Filter Bars Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, padding: '0 20px', minWidth: '400px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>Company:</span>
                            <select
                                value={!isGlobalMaster ? (user?.company_name || user?.company || 'All') : selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                disabled={!isGlobalMaster}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: '1px solid #e67e22',
                                    backgroundColor: !isGlobalMaster ? '#e2e8f0' : 'transparent',
                                    color: !isGlobalMaster ? '#94a3b8' : '#2d3436',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    outline: 'none',
                                    cursor: !isGlobalMaster ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="All">All Companies</option>
                                {isGlobalMaster ? companyOptions.map(comp => (
                                    <option key={comp} value={comp}>{comp}</option>
                                )) : (
                                    <option value={user?.company_name || user?.company}>{user?.company_name || user?.company}</option>
                                )}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>Branch:</span>
                            <select
                                value={(!isGlobalMaster && userBranch) ? userBranch : selectedBranchFilter}
                                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                                disabled={!isGlobalMaster && !!userBranch}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: '1px solid #3498db',
                                    backgroundColor: (!isGlobalMaster && !!userBranch) ? '#e2e8f0' : 'transparent',
                                    color: (!isGlobalMaster && !!userBranch) ? '#94a3b8' : '#2d3436',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    outline: 'none',
                                    cursor: (!isGlobalMaster && !!userBranch) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="">Default Branch</option>
                                {(!isGlobalMaster && userBranch) ? (
                                    <option value={userBranch}>{userBranch}</option>
                                ) : availableBranches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Designation Filter Bar */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        padding: '4px',
                        scrollbarWidth: 'none'
                    }}>
                        <button
                            onClick={() => setSelectedDesignation('All')}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', border: 'none',
                                background: selectedDesignation === 'All' ? '#e67e22' : '#f1f2f6',
                                color: selectedDesignation === 'All' ? 'white' : '#636e72',
                                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <FaListUl /> All Designations
                        </button>
                        {designations.map(desig => (
                            <button
                                key={desig._id || desig.id}
                                onClick={() => setSelectedDesignation(desig.name)}
                                style={{
                                    padding: '6px 14px', borderRadius: '20px', border: 'none',
                                    background: selectedDesignation === desig.name ? '#e67e22' : '#f1f2f6',
                                    color: selectedDesignation === desig.name ? 'white' : '#636e72',
                                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                                    boxShadow: selectedDesignation === desig.name ? '0 2px 5px rgba(230, 126, 34, 0.3)' : 'none'
                                }}
                            >
                                {desig.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f39c12' }}></span>
                        <span style={{ fontSize: '12px', color: '#636e72', fontWeight: '500' }}>Regular</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27ae60' }}></span>
                        <span style={{ fontSize: '12px', color: '#636e72', fontWeight: '500' }}>Substitute</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e74c3c' }}></span>
                        <span style={{ fontSize: '12px', color: '#636e72', fontWeight: '500' }}>Leave</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ marginTop: '80px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* Month Navigation */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid #f1f2f6',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button onClick={handlePrevMonth} style={{ background: '#f1f2f6', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#636e72', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#dfe6e9'} onMouseOut={e => e.currentTarget.style.background = '#f1f2f6'}>
                            <FaChevronLeft />
                        </button>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#2d3436', minWidth: '200px', textAlign: 'center' }}>
                            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={handleNextMonth} style={{ background: '#f1f2f6', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#636e72', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#dfe6e9'} onMouseOut={e => e.currentTarget.style.background = '#f1f2f6'}>
                            <FaChevronRight />
                        </button>
                    </div>

                    {/* Status Messages */}
                    {message && <div style={{ marginLeft: '20px', padding: '6px 12px', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '13px' }}>{message}</div>}
                    {error && (
                        <div style={{ marginLeft: '20px', padding: '6px 12px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaExclamationCircle /> {error}
                        </div>
                    )}
                </div>

                {/* Calendar Grid */}
                <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{
                                    padding: '12px 15px', background: '#ffffff', color: '#2d3436',
                                    borderBottom: '2px solid #dfe6e9', borderRight: '2px solid #dfe6e9',
                                    position: 'sticky', left: 0, zIndex: 11, minWidth: '100px', textAlign: 'left',
                                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                                }}>Date</th>
                                {timeSlots.map(slot => (
                                    <th key={slot.id} style={{
                                        padding: '10px 5px', background: '#f8f9fa', color: '#636e72',
                                        borderBottom: '2px solid #dfe6e9', borderRight: '1px solid #f1f2f6',
                                        fontSize: '12px', fontWeight: '600', minWidth: '120px'
                                    }}>{slot.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {daysInMonth.map((dayInfo, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                                    <td style={{
                                        padding: '12px 15px', borderBottom: '1px solid #f1f2f6', borderRight: '2px solid #dfe6e9',
                                        position: 'sticky', left: 0, background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc',
                                        zIndex: 9, boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2d3436' }}>{dayInfo.day}</span>
                                            <span style={{ fontSize: '12px', color: '#b2bec3', textTransform: 'uppercase' }}>{dayInfo.dayName}</span>
                                        </div>
                                    </td>
                                    {timeSlots.map(slot => {
                                        // Filter employees for this specific shift ID
                                        const employeesInShift = getEmployeesForDateTime(dayInfo.date, slot.id);
                                        return (
                                            <td key={slot.id} style={{
                                                padding: '4px', borderBottom: '1px solid #f1f2f6', borderRight: '1px solid #f1f2f6',
                                                verticalAlign: 'top', height: '60px'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {employeesInShift.length > 0 ? (
                                                        employeesInShift.map((emp, i) => {
                                                            let bg = '#dfe6e9', color = '#2d3436', shadow = 'none';
                                                            let icon = null;

                                                            if (emp.type === 'leave') {
                                                                bg = 'linear-gradient(135deg, #ff7675, #d63031)';
                                                                color = 'white';
                                                                shadow = '0 2px 4px rgba(214, 48, 49, 0.2)';
                                                                icon = <FaUmbrellaBeach size={10} />;
                                                            } else if (emp.type === 'substitute') {
                                                                bg = 'linear-gradient(135deg, #55efc4, #00b894)';
                                                                color = '#006266';
                                                                shadow = '0 2px 4px rgba(0, 184, 148, 0.2)';
                                                                icon = <FaExchangeAlt size={10} />;
                                                            } else {
                                                                bg = 'linear-gradient(135deg, #ffeaa7, #fdcb6e)';
                                                                color = '#6c5ce7';
                                                                shadow = '0 2px 4px rgba(253, 203, 110, 0.2)';
                                                            }

                                                            return (
                                                                <div key={i} title={`${emp.name} (${emp.designation})`} style={{
                                                                    background: bg, color: color,
                                                                    padding: '4px 8px', borderRadius: '4px',
                                                                    fontSize: '11px', fontWeight: '600',
                                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                    boxShadow: shadow, cursor: 'default',
                                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                                }}>
                                                                    {icon}
                                                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                                        <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</span>
                                                                        {emp.designation && <span style={{ fontSize: '9px', opacity: 0.8, fontWeight: 'normal' }}>{emp.designation}</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span style={{ display: 'block', height: '100%', width: '100%' }}></span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <CustomerCustomizationModal
                isOpen={showCustomizeModal}
                onClose={() => setShowCustomizeModal(false)}
                onRefresh={() => {}}
                targetDocType="Roaster"
            />
        </div>
    );
};

export default Roaster;
