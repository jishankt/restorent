// src/components/Form/scheduleassignemployee.jsx
import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaUserTag, FaSave, FaEdit, FaTrash, FaTimes, FaCheck, FaBan, FaCalendarCheck, FaGift, FaClock, FaMoon, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaPlus, FaSun, FaCog } from 'react-icons/fa';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import CustomerCustomizationModal from "./CustomerCustomizationModal";

// --- Helper Functions for Format Conversion ---
const to12h = (h, m) => {
  let hour = parseInt(h);
  const minute = m.toString().padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // 0 becomes 12
  return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
};
const to24h = (h, m, p) => {
  let hour = parseInt(h);
  if (p === 'PM' && hour !== 12) hour += 12;
  if (p === 'AM' && hour === 12) hour = 0;
  return { h: hour.toString().padStart(2, '0'), m: m.toString().padStart(2, '0') };
};

// --- Custom Time Picker Component ---
const CustomTimePicker = ({ value, onChange, format24, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const pickerId = useRef(Math.random().toString(36).substr(2, 9));

  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [p, setP] = useState('AM');

  useEffect(() => {
    if (!value) {
      setH(''); setM(''); setP('AM');
      return;
    }
    const match = value.match(/^(\d{1,2})[:.]?(\d{0,2})\s*([AP]M)?$/i);
    if (match) {
      let hour = match[1];
      let minute = match[2] || '00';
      let period = match[3] ? match[3].toUpperCase() : 'AM';
      if (format24) {
        const { h: h24, m: m24 } = to24h(hour, minute, period);
        setH(h24);
        setM(m24);
        setP('');
      } else {
        setH(hour.toString().padStart(2, '0'));
        setM(minute.toString().padStart(2, '0'));
        setP(period);
      }
    }
  }, [value, format24]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hElem = document.getElementById(`h-${pickerId.current}-${parseInt(h)}`);
        const mElem = document.getElementById(`m-${pickerId.current}-${parseInt(m)}`);
        const pElem = document.getElementById(`p-${pickerId.current}-${p}`);
        if (hElem) hElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (mElem) mElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (pElem) pElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, h, m, p]);

  const notifyChange = (newH, newM, newP) => {
    if (format24) {
      if (newH !== '' && newM !== '') {
        const val12 = to12h(newH, newM);
        onChange(val12);
      } else {
        if (newH === '' && newM === '') onChange('');
      }
    } else {
      const hh = newH.padStart(2, '0');
      const mm = newM.padStart(2, '0');
      if (newH && newM) onChange(`${hh}:${mm} ${newP}`);
      else if (!newH && !newM) onChange('');
    }
  };

  const handleHChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    setH(val);
    notifyChange(val, m, p);
    setIsOpen(true);
  };
  const handleMChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    setM(val);
    notifyChange(h, val, p);
    setIsOpen(true);
  };
  const handlePChange = (e) => {
    if (format24) return;
    let val = e.target.value.toUpperCase();
    if (val.length > 2) val = val.slice(-2);
    let nextP = p;
    if (val.includes('A')) nextP = 'AM';
    else if (val.includes('P')) nextP = 'PM';
    setP(nextP);
    notifyChange(h, m, nextP);
  };

  const handleSelect = (type, val) => {
    let newH = h;
    let newM = m;
    let newP = p;
    if (type === 'h') newH = val.toString().padStart(2, '0');
    if (type === 'm') newM = val.toString().padStart(2, '0');
    if (type === 'p') newP = val;
    setH(newH);
    setM(newM);
    setP(newP);
    notifyChange(newH, newM, newP);
  };

  const handleFocus = (e) => e.target.select();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const hours = format24
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: isOpen ? '1px solid #3498db' : '1px solid #bdc3c7',
          borderRadius: '8px',
          padding: '10px 10px',
          backgroundColor: '#fff',
          cursor: 'text',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : 'none',
          width: '100%',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            placeholder="HH"
            value={h}
            onChange={handleHChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '30px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          <span style={{ fontWeight: 'bold', userSelect: 'none', color: '#95a5a6', margin: '0 2px' }}>:</span>
          <input
            type="text"
            placeholder="MM"
            value={m}
            onChange={handleMChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '30px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          {!format24 && (
            <input
              type="text"
              value={p}
              onChange={handlePChange}
              onFocus={handleFocus}
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              style={{ border: 'none', width: '40px', textAlign: 'center', fontSize: '0.85rem', marginLeft: 'auto', outline: 'none', color: '#fff', background: p === 'AM' ? '#f1c40f' : '#34495e', borderRadius: '4px', cursor: 'pointer', padding: '2px 0', fontWeight: 'bold' }}
            />
          )}
        </div>
        <FaClock style={{ color: isOpen ? '#3498db' : '#95a5a6', cursor: 'pointer', marginLeft: '10px' }} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} />
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          zIndex: 1500,
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          height: '220px',
          overflow: 'hidden',
          width: '100%',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #f0f0f0', scrollbarWidth: 'thin' }}>
            <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>HH</div>
            {hours.map(hr => (
              <div
                key={hr}
                id={`h-${pickerId.current}-${hr}`}
                onClick={() => handleSelect('h', hr)}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  backgroundColor: parseInt(h) === hr ? '#ebf5fb' : 'transparent',
                  color: parseInt(h) === hr ? '#3498db' : '#333',
                  fontWeight: parseInt(h) === hr ? 'bold' : 'normal'
                }}
              >
                {hr.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', borderRight: format24 ? 'none' : '1px solid #f0f0f0', scrollbarWidth: 'thin' }}>
            <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>MM</div>
            {minutes.map(mn => (
              <div
                key={mn}
                id={`m-${pickerId.current}-${mn}`}
                onClick={() => handleSelect('m', mn)}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  backgroundColor: parseInt(m) === mn ? '#ebf5fb' : 'transparent',
                  color: parseInt(m) === mn ? '#3498db' : '#333',
                  fontWeight: parseInt(m) === mn ? 'bold' : 'normal'
                }}
              >
                {mn.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
          {!format24 && (
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', background: '#f8f9fa', borderBottom: '1px solid #eee', color: '#7f8c8d', fontSize: '0.8rem' }}>AM/PM</div>
              {periods.map(per => (
                <div
                  key={per}
                  id={`p-${pickerId.current}-${per}`}
                  onClick={() => handleSelect('p', per)}
                  style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    backgroundColor: p === per ? '#ebf5fb' : 'transparent',
                    color: p === per ? '#3498db' : '#333',
                    fontWeight: p === per ? 'bold' : 'normal'
                  }}
                >
                  {per}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const ScheduleAssignEmployee = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const active = localStorage.getItem('active_company');
    return active && active !== 'All' ? active : 'All';
  });
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => {
    const active = localStorage.getItem('active_branch');
    return active && active !== 'All Branches' && active !== 'All' ? active : 'All';
  });
  const [branchOptions, setBranchOptions] = useState([]);
  const [leaves, setLeaves] = useState([]); // NEW: Leaves state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const editingIdRef = useRef(null);
  const [use24Hour, setUse24Hour] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [modalData, setModalData] = useState({
    date: '',
    type: 'Holiday',
    description: '',
    scope: 'employee',
    start_time: '',
    end_time: '',
    extended_start: '',
    extended_end: '',
    shift_id: '',
    // NEW: Substitute Fields
    substitute_employee_id: '',
  });

  // NEW: State for available substitutes
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);

  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    schedule_id: '',
    assigned_date: '',
    is_active: true,
    notes: '',
    special_day_assignments: []
  });

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  // Global State
  const { user, baseUrl, configLoading, getHeaders } = useContext(UserContext);

  const isGlobalMaster = checkIsGlobalAdmin(user) || checkIsGlobalAdmin({ role: localStorage.getItem('role') });

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchData(),
          fetchPermissions()
        ]);
      } catch (err) {
        console.error("Error in initial fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role;
          if (role) {
            const currentBaseUrl = baseUrl || '';
            const userEmail = user.email || '';
            const url = `${currentBaseUrl}/api/role-permissions?role=${role}&email=${userEmail}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'schedule_assign');
            
            if (checkIsAdmin(user)) {
              setCanWrite(true);
              setCanDelete(true);
            } else if (pagePerm) {
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
            }

          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    initData();
  }, [baseUrl, configLoading]);

  const fetchData = async () => {
    // Logic handled in parent effect for initial load
    // But we set loading here for manual refreshes
    try {
      const active_company = selectedCompany !== 'All' ? selectedCompany : (localStorage.getItem('active_company') !== 'All' ? localStorage.getItem('active_company') : null);
      const activeBranchLocal = selectedBranch !== 'All' ? selectedBranch : localStorage.getItem('active_branch');
      const active_branch = activeBranchLocal && activeBranchLocal !== 'All Branches' && activeBranchLocal !== 'All' ? activeBranchLocal : null;
      
      const headers = getHeaders(active_branch, active_company);

      let assignRes = { data: [] };
      let empRes = { data: [] };
      let schedRes = { data: [] };
      let leavesRes = { data: [] };

      try { assignRes = await axios.get(`${baseUrl}/api/schedule-assignments`, { params: { company: active_company, pageId: 'schedule_assign' }, headers }); } catch(e) { console.error("Failed to load assignments", e);  setError("Failed to load some assignments."); }
      try { 
        empRes = await axios.get(`${baseUrl}/api/add-employee`, {
          params: {
            userId: user?.userId || user?._id || user?.id,
            role: user?.role,
            company: active_company,
            pageId: 'schedule_assign'
          },
          headers
        }); 
      } catch(e) { console.error("Failed to load employees", e); }
      try { schedRes = await axios.get(`${baseUrl}/api/schedules`, { params: { company: active_company, pageId: 'schedule_assign' }, headers }); } catch(e) { console.error("Failed to load schedules", e); setError("Failed to load core schedules."); }
      try { leavesRes = await axios.get(`${baseUrl}/api/leave-applications`, { params: { company: active_company, pageId: 'schedule_assign' }, headers }); } catch(e) { console.error("Failed to load leaves", e); }

      setAssignments(assignRes.data || []);
      const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      setEmployees(empData);

      // Both state variables get the same unified data
      setSchedules(schedRes.data || []);
      setShifts(schedRes.data || []);

      setLeaves(leavesRes.data || []);
      
      // Better Company and Branch Options Logic
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      if (isGlobalMaster || checkIsAdmin(currentUser)) {
          let comps = [];
          if (isGlobalMaster) {
              const companies = new Set();
              empData.forEach(emp => {
                  const c = emp.companies || emp.company_names || [emp.company_name || emp.company];
                  if (Array.isArray(c)) c.forEach(x => x && companies.add(x));
                  else if (c) companies.add(c);
              });
              comps = Array.from(companies).sort();
              setCompanyOptions(comps);
          } else {
              comps = currentUser.companies || [currentUser.company_name || currentUser.company].filter(Boolean);
          }

          // Fetch branches via API for the active company context
          const allBranchNames = new Set();
          const compsToFetch = (active_company && active_company !== 'All') ? [active_company] : comps;
          
          await Promise.all(compsToFetch.map(async comp => {
              if (!comp) return;
              try {
                  const res = await axios.get(`${baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`, {
                      headers: { ...headers, 'X-Company-Name': comp }
                  });
                  (res.data || []).forEach(b => {
                      const n = typeof b === 'string' ? b : (b.branch_name || b.name || '');
                      if (n) allBranchNames.add(n);
                  });
              } catch (e) {
                  console.warn('Branch fetch error for', comp, e);
              }
          }));
          setBranchOptions(Array.from(allBranchNames).sort());
      }
      
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to fetch data: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!configLoading) {
      fetchData();
    }
  }, [selectedCompany, selectedBranch, configLoading]);

  useEffect(() => {
    const { employee_id, schedule_id } = formData;
    let currentRule = null;

    if (schedule_id) {
      currentRule = schedules.find(s => String(s._id || s.id) === String(schedule_id));
      if (!selectedScheduleDetails || String(selectedScheduleDetails._id || selectedScheduleDetails.id) !== String(schedule_id)) {
        setSelectedScheduleDetails(currentRule || null);
      }
    } else {
      setSelectedScheduleDetails(null);
    }

    if (employee_id && schedule_id) {
      const existing = assignments.find(a =>
        String(a.employee_id) === String(employee_id) &&
        String(a.schedule_id) === String(schedule_id)
      );
      if (existing) {
        if (editingId !== existing._id) {
          setEditingId(existing._id);
          editingIdRef.current = existing._id;
          setFormData(prev => ({
            ...prev,
            assigned_date: existing.assigned_date,
            is_active: existing.is_active !== undefined ? existing.is_active : true,
            notes: existing.notes || '',
            special_day_assignments: existing.special_day_assignments || []
          }));
        }
        return;
      }
    }

    if (editingId) {
      setEditingId(null);
      editingIdRef.current = null;
    }

    if (schedule_id && currentRule) {
      if (currentRule.special_days) {
        const initialSpecialDays = currentRule.special_days.map(sd => ({
          ...sd,
          is_observed: sd.type === 'Holiday' || sd.is_observed === true
        })).filter(sd => sd.is_observed);
        setFormData(prev => ({
          ...prev,
          special_day_assignments: initialSpecialDays,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          special_day_assignments: []
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, special_day_assignments: [] }));
    }
  }, [formData.employee_id, formData.schedule_id, assignments, schedules]);

  const displayedSpecialDays = useMemo(() => {
    const combined = new Map();
    if (selectedScheduleDetails && selectedScheduleDetails.special_days) {
      selectedScheduleDetails.special_days.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        combined.set(key, { ...sd, source: 'rule' });
      });
    }
    if (formData.special_day_assignments) {
      formData.special_day_assignments.forEach(sd => {
        const key = `${sd.date}-${sd.description}`;
        const existing = combined.get(key) || {};
        combined.set(key, { ...existing, ...sd, source: 'assignment' });
      });
    }
    return Array.from(combined.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedScheduleDetails, formData.special_day_assignments]);

  const getEmpCompanyAndBranch = useCallback((id) => {
    if (!id) return { company: 'N/A', branch: 'All Branches' };
    const idStr = String(id).trim();
    const emp = employees.find(e => String(e.id || e._id || '').trim() === idStr);
    if (!emp) return { company: 'N/A', branch: 'All Branches' };
    
    const comps = emp.companies || emp.company_names || [emp.company_name || emp.company];
    const company = (Array.isArray(comps) ? comps.filter(Boolean)[0] : comps) || 'N/A';
    
    const brs = emp.branches || emp.branch_names || [emp.branch_name || emp.branch];
    let branch = 'All Branches';
    const validBranch = (Array.isArray(brs) ? brs : []).find(b => b && b !== 'All Branches' && b !== 'All');
    if (validBranch) branch = validBranch;

    return { company, branch };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let result = employees.filter(e => {
      const { company, branch } = getEmpCompanyAndBranch(e.id || e._id);
      if (selectedCompany !== 'All' && company !== selectedCompany) return false;
      if (selectedBranch !== 'All' && branch !== selectedBranch) return false;
      return true;
    });

    // If a schedule is selected, filter employees by that schedule's shift department
    if (formData.schedule_id) {
      const rule = schedules.find(s => String(s._id || s.id) === String(formData.schedule_id));
      if (rule) {
        const shift = shifts.find(s => String(s._id || s.id) === String(rule.shift_id));
        if (shift && shift.department) {
          result = result.filter(e => e.department === shift.department);
        } else if (rule.department) {
          result = result.filter(e => e.department === rule.department);
        }
      }
    }
    return result;
  }, [employees, formData.schedule_id, schedules, shifts, selectedCompany, selectedBranch]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const { company, branch } = getEmpCompanyAndBranch(a.employee_id);
      if (selectedCompany !== 'All' && company !== selectedCompany) return false;
      if (selectedBranch !== 'All' && branch !== selectedBranch) return false;
      return true;
    });
  }, [assignments, selectedCompany, selectedBranch, employees]);

  const filteredSchedules = useMemo(() => {
    // If an employee is selected, filter schedules by that employee's department
    if (formData.employee_id) {
      const empId = String(formData.employee_id).trim();
      const emp = employees.find(e => String(e.id || e._id || '').trim() === empId);
      if (emp && emp.department) {
        return schedules.filter(s => {
          const shift = shifts.find(sh => String(sh._id || sh.id) === String(s.shift_id));
          // Show if:
          // 1. Shift has NO department OR matches
          // 2. OR Rule has NO shift_id (Self-contained) implies Global (unless rule has department, which we checked?)
          // Assuming self-contained are global for now unless s.department exists
          const dept = (shift && shift.department) || s.department;
          return !dept || dept === emp.department;
        });
      }
    }
    return schedules;
  }, [schedules, formData.employee_id, employees, shifts]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSpecialDay = (specialDay) => {
    setFormData(prev => {
      const exists = prev.special_day_assignments.find(sd => sd.date === specialDay.date && sd.description === specialDay.description);
      let newAssignments;
      if (exists) {
        newAssignments = prev.special_day_assignments.filter(sd => !(sd.date === specialDay.date && sd.description === specialDay.description));
      } else {
        newAssignments = [...prev.special_day_assignments, { ...specialDay, is_observed: true }];
      }
      return { ...prev, special_day_assignments: newAssignments };
    });
  };

  const isSpecialDayChecked = (specialDay) => {
    return formData.special_day_assignments?.some(sd => sd.date === specialDay.date && sd.description === specialDay.description);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to assign schedules.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!formData.employee_id || !formData.schedule_id || !formData.assigned_date) {
      setError("Please fill all required fields.");
      return;
    }
    try {
      const active_company = selectedCompany !== 'All' ? selectedCompany : (localStorage.getItem('active_company') !== 'All' ? localStorage.getItem('active_company') : null);
      
      // Look up the selected employee to determine their branch level
      const selectedEmp = employees.find(e => String(e.id || e._id) === String(formData.employee_id));
      let emp_branch = null;
      if (selectedEmp) {
          const brs = selectedEmp.branches || selectedEmp.branch_names || [selectedEmp.branch_name || selectedEmp.branch];
          // Find the first valid branch name that isn't 'All Branches'
          const validBranch = (Array.isArray(brs) ? brs : []).find(b => b && b !== 'All Branches' && b !== 'All');
          if (validBranch) {
              emp_branch = validBranch;
          }
      }

      // If employee belongs to a branch, save to that branch. Otherwise, save to company (null branch)
      const active_branch = emp_branch;

      const url = `${baseUrl}/api/schedule-assignments${editingId ? `/${editingId}` : ''}`;
      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, { headers: getHeaders(active_branch, active_company) });

      const empName = getEmpName(formData.employee_id);
      const fullTimingDetail = getRuleName(formData.schedule_id);

      // Better department fetching
      const rule = schedules.find(s => String(s._id || s.id) === String(formData.schedule_id));
      const shift = rule?.shift_id ? shifts.find(sh => String(sh._id || sh.id) === String(rule.shift_id)) : null;
      let dept = shift?.department || rule?.department || employees.find(e => String(e.id || e._id) === String(formData.employee_id))?.department || '';

      const deptString = (dept && dept !== 'N/A') ? ` in ${dept} department` : '';

      // Trigger Notification
      await axios.post(`${baseUrl}/api/notifications`, {
        type: editingId ? 'info' : 'success',
        title: editingId ? 'Schedule Assignment Updated' : 'New Schedule Assignment',
        message: `Employee ${empName} has been assigned to ${fullTimingDetail}${deptString} starting from ${formData.assigned_date}.`,
        category: 'schedule',
        userId: user?.userId || user?._id || user?.id,
        employeeId: formData.employee_id,
        data: {
          schedule_id: formData.schedule_id,
          date: formData.assigned_date,
          timing: fullTimingDetail,
          department: (dept && dept !== 'N/A') ? dept : undefined
        }
      }, { headers: getHeaders(active_branch, active_company) });
      window.dispatchEvent(new Event('notificationUpdate'));

      setMessage(`Assignment ${editingId ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to save: ${err.response?.data?.error || err.message}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    editingIdRef.current = null;
    setFormData({ employee_id: '', schedule_id: '', assigned_date: '', is_active: true, notes: '', special_day_assignments: [] });
    setSelectedScheduleDetails(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    editingIdRef.current = item._id || item.id;
    const rule = schedules.find(s => String(s._id || s.id) === String(item.schedule_id));
    setSelectedScheduleDetails(rule || null);
    setFormData({
      employee_id: item.employee_id || '',
      schedule_id: item.schedule_id || '',
      assigned_date: item.assigned_date || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
      notes: item.notes || '',
      special_day_assignments: item.special_day_assignments || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleExecuteDelete = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete assignments.");
      setTimeout(() => setError(null), 3000);
      setDeleteId(null);
      return;
    }
    if (!deleteId) return;
    try {
      const active_company = selectedCompany !== 'All' ? selectedCompany : (localStorage.getItem('active_company') !== 'All' ? localStorage.getItem('active_company') : null);
      
      // Determine branch from the assignment we are deleting
      const assignToDelete = assignments.find(a => a._id === deleteId || a.id === deleteId);
      const emp_id = assignToDelete ? assignToDelete.employee_id : null;
      let target_branch = null;
      if (emp_id) {
          const emp = employees.find(e => String(e.id || e._id) === String(emp_id));
          if (emp) {
              const brs = emp.branches || emp.branch_names || [emp.branch_name || emp.branch];
              const validBranch = (Array.isArray(brs) ? brs : []).find(b => b && b !== 'All Branches' && b !== 'All');
              if (validBranch) target_branch = validBranch;
          }
      }

      await axios.delete(`${baseUrl}/api/schedule-assignments/${deleteId}`, { headers: getHeaders(target_branch, active_company) });
      setMessage("Deleted successfully!");
      setDeleteId(null);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
      setDeleteId(null);
    }
  };

  const getEmpName = (id) => {
    if (!id) return 'Unknown Employee';
    const idStr = String(id).trim();
    const emp = employees.find(e => String(e.id || e._id || '').trim() === idStr);
    return emp ? (emp.name || emp.employeeName) : 'Unknown Employee';
  };



  const getShiftName = (shiftId) => {
    if (!shiftId) return 'No Shift';
    const idStr = String(shiftId).trim();
    const shift = shifts.find(s => String(s._id || s.id).trim() === idStr);
    if (!shift) return 'Unknown Shift';
    const slotsStr = shift.time_slots ? shift.time_slots.map(t => `${t.start_time}-${t.end_time}${t.is_overnight ? ' (O)' : ''}`).join(', ') : '';
    const deptStr = shift.department ? ` [${shift.department}]` : '';
    return `${shift.schedule_name || shift.shift_name} (${slotsStr})${deptStr}`;
  };

  const getRuleName = (ruleId) => {
    if (!ruleId) return 'Unknown Schedule';
    const idStr = String(ruleId).trim();
    const rule = schedules.find(s => String(s._id || s.id).trim() === idStr);
    if (!rule) return 'Unknown Schedule';
    const shiftStr = rule.shift_id ? getShiftName(rule.shift_id) : `${rule.schedule_name || rule.rule_name || 'No Rule Name'} (${rule.time_slots ? rule.time_slots.map(t => `${t.start_time}-${t.end_time}`).join(', ') : ''})`;
    return `${rule.schedule_name || rule.rule_name || 'Schedule'} - ${shiftStr}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    return { days, startOffset };
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDayStatus = (day) => {
    if (!selectedScheduleDetails) return null;
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    const dateObj = new Date(year, calendarMonth.getMonth(), day);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];

    const special = displayedSpecialDays.find(sd => sd.date === dateStr);

    // Check for Approved Leave
    if (formData.employee_id) {
      const approvedLeave = leaves.find(l =>
        l.employee_id === formData.employee_id &&
        l.status === 'APPROVED' &&
        l.from_date <= dateStr && // Assuming single date or range logic
        l.to_date >= dateStr
      );
      if (approvedLeave) {
        return { type: 'Leave', color: '#f39c12', tooltip: `On Leave: ${approvedLeave.leave_name || 'Approved Leave'}` };
      }
    }

    if (special) {
      if (special.type === 'Holiday') {
        return { type: 'Holiday', color: '#e74c3c', tooltip: `Holiday: ${special.description}` };
      }
      if (special.type === 'Extended') {
        return { type: 'Extended', color: '#e67e22', tooltip: `Extended: ${special.extended_start} - ${special.extended_end} (${special.description})` };
      }
      if (special.type === 'Half-Day') {
        return { type: 'Half-Day', color: '#9b59b6', tooltip: `Half-Day: ${special.start_time} - ${special.end_time}` };
      }
      if (special.type === 'Special-Shift') {
        return { type: 'Special-Shift', color: '#3498db', tooltip: `Special Shift: ${special.description}` };
      }
    }

    // Safe guard for working_days (old shifts might not have it)
    const workingDays = selectedScheduleDetails.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (!workingDays.includes(dayName)) {
      return { type: 'Weekly Off', color: '#e74c3c', tooltip: 'Weekly Off' };
    }

    return { type: 'Working', color: '#2ecc71', tooltip: 'Regular Shift' };
  };

  const getAvailableSubstitutes = (dateStr, department) => {
    return employees.filter(e => {
      // Allow all employees EXCEPT:
      // 1. Current Employee
      if (String(e.id || e._id) === String(formData.employee_id)) return false;

      // 2. On Provided Date check if they are on leave? 
      // (Maybe we allow substituting even if on leave? No, likely not).
      const onLeave = leaves.some(l =>
        l.employee_id === (e.id || e._id) &&
        l.status === 'APPROVED' &&
        l.from_date <= dateStr &&
        l.to_date >= dateStr
      );
      if (onLeave) return false;

      // 3. Allow if already assigned (we just show their shift in dropdown as handled below)
      // So no filtering based on existing assignments.

      return true;
    });
  };

  const handleDayClick = (day) => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;

    const status = getDayStatus(day);

    if (status && status.type === 'Leave') {
      // Substitute Mode
      const currentEmp = employees.find(e => String(e.id || e._id) === String(formData.employee_id));
      const dept = currentEmp ? currentEmp.department : '';
      const subs = getAvailableSubstitutes(fullDate, dept);

      setAvailableSubstitutes(subs);
      setModalData({
        date: fullDate,
        type: 'Substitute',
        description: `Substitution for ${currentEmp ? currentEmp.name : 'Employee'}`,
        scope: 'employee',
        start_time: '',
        end_time: '',
        extended_start: '',
        extended_end: '',
        shift_id: '',
        substitute_employee_id: ''
      });
      setShowModal(true);
      return;
    }

    setModalData({
      date: fullDate,
      type: 'Holiday',
      description: '',
      scope: 'employee',
      start_time: '',
      end_time: '',
      extended_start: '',
      extended_end: '',
      shift_id: '',
      substitute_employee_id: ''
    });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!canWrite) {
      alert("You do not have permission to manage schedules.");
      return;
    }
    if (!modalData.description) {
      alert("Please enter a description/reason.");
      return;
    }

    const newSpecialDay = {
      date: modalData.date,
      type: modalData.type,
      description: modalData.description,
      is_observed: true
    };

    if (modalData.type === 'Extended') {
      newSpecialDay.extended_start = modalData.extended_start;
      newSpecialDay.extended_end = modalData.extended_end;
    } else if (modalData.type === 'Half-Day') {
      newSpecialDay.start_time = modalData.start_time;
      newSpecialDay.end_time = modalData.end_time;
    } else if (modalData.type === 'Special-Shift') {
      newSpecialDay.shift_id = modalData.shift_id;
    } else if (modalData.type === 'Substitute') {
      // Handle Substitute Assignment
      if (!modalData.substitute_employee_id) {
        alert("Please select a substitute employee.");
        return;
      }
      try {
        const active_company = selectedCompany !== 'All' ? selectedCompany : (localStorage.getItem('active_company') !== 'All' ? localStorage.getItem('active_company') : null);
        const originalEmp = employees.find(e => String(e.id || e._id) === String(formData.employee_id));
        const substituteEmp = employees.find(e => String(e.id || e._id) === String(modalData.substitute_employee_id));
        
        let target_branch = null;
        if (substituteEmp) {
            const brs = substituteEmp.branches || substituteEmp.branch_names || [substituteEmp.branch_name || substituteEmp.branch];
            const validBranch = (Array.isArray(brs) ? brs : []).find(b => b && b !== 'All Branches' && b !== 'All');
            if (validBranch) target_branch = validBranch;
        }

        // Create NEW Assignment for Substitute
        await axios.post(`${baseUrl}/api/schedule-assignments`, {
          employee_id: modalData.substitute_employee_id,
          schedule_id: formData.schedule_id, // Assign same schedule
          assigned_date: modalData.date, // Start from this date
          is_active: true,
          notes: `Substitute for ${getEmpName(formData.employee_id)} on ${modalData.date}`
        }, { headers: getHeaders(target_branch, active_company) });
        const fullTimingDetail = getRuleName(formData.schedule_id);

        // Better department fetching for substitution
        const subRule = schedules.find(s => String(s._id || s.id) === String(formData.schedule_id));
        const subShift = subRule?.shift_id ? shifts.find(sh => String(sh._id || sh.id) === String(subRule.shift_id)) : null;
        let subDept = originalEmp?.department || subShift?.department || subRule?.department || '';

        const deptString = (subDept && subDept !== 'N/A') ? ` in ${subDept} department` : '';

        // Trigger Detailed Notification for Substitution
        await axios.post(`${baseUrl}/api/notifications`, {
          type: 'warning',
          title: 'Substitute Assigned',
          message: `Substitution Alert: ${substituteEmp?.name || 'Substitute'} assigned for ${originalEmp?.name || 'Original Employee'}${deptString} on ${modalData.date}. Timing: ${fullTimingDetail}. Reason: ${modalData.description}`,
          category: 'schedule',
          userId: user?.userId || user?._id || user?.id,
          employeeId: modalData.substitute_employee_id,
          data: {
            original_employee: originalEmp?.name,
            department: (subDept && subDept !== 'N/A') ? subDept : undefined,
            substitute: substituteEmp?.name,
            description: modalData.description,
            date: modalData.date,
            timing: fullTimingDetail
          }
        }, { headers: getHeaders(target_branch, active_company) });
        window.dispatchEvent(new Event('notificationUpdate'));

        setMessage(`Substitute Assigned Successfully!`);
        fetchData();
      } catch (err) {
        setError("Failed to assign substitute: " + err.message);
      }
      setShowModal(false);
      return;
    }

    if (modalData.scope === 'master') {
      if (!selectedScheduleDetails) return;
      try {
        const active_company = selectedCompany !== 'All' ? selectedCompany : (localStorage.getItem('active_company') !== 'All' ? localStorage.getItem('active_company') : null);
        const ruleId = selectedScheduleDetails._id || selectedScheduleDetails.id;
        const updatedSpecialDays = [...(selectedScheduleDetails.special_days || []), newSpecialDay];
        
        let target_branch = null;
        if (selectedScheduleDetails.branch_names && selectedScheduleDetails.branch_names.length > 0) {
            target_branch = selectedScheduleDetails.branch_names[0];
        } else if (selectedScheduleDetails.branch_name && selectedScheduleDetails.branch_name !== 'All Branches') {
            target_branch = selectedScheduleDetails.branch_name;
        }

        await axios.put(`${baseUrl}/api/schedule-rules/${ruleId}`, {
          ...selectedScheduleDetails,
          special_days: updatedSpecialDays
        }, { headers: getHeaders(target_branch, active_company) });
        setMessage("Master Schedule Updated Successfully!");
        fetchData();
      } catch (err) {
        setError("Failed to update Master Schedule: " + err.message);
      }
    } else {
      setFormData(prev => {
        const others = prev.special_day_assignments.filter(sd => sd.date !== newSpecialDay.date);
        return {
          ...prev,
          special_day_assignments: [...others, newSpecialDay]
        };
      });
    }
    setShowModal(false);
  };

  const renderCalendar = () => {
    if (!selectedScheduleDetails) return <div style={{ padding: '20px', color: '#7f8c8d', textAlign: 'center' }}>Select a schedule to view calendar</div>;
    const { days, startOffset } = getDaysInMonth(calendarMonth);
    const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const grid = [];

    for (let i = 0; i < startOffset; i++) {
      grid.push(<div key={`empty-${i}`} style={{ background: '#f8f9fa' }}></div>);
    }

    for (let d = 1; d <= days; d++) {
      const status = getDayStatus(d);
      const isToday = new Date().toDateString() === new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d).toDateString();
      grid.push(
        <div
          key={d}
          title={status?.tooltip}
          onClick={() => handleDayClick(d)}
          style={{
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: status?.color || 'white',
            color: status?.color ? 'white' : '#2c3e50',
            borderRadius: '4px',
            fontWeight: isToday ? 'bold' : 'normal',
            border: isToday ? '2px solid #34495e' : 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'transform 0.1s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {d}
        </div>
      );
    }

    return (
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3498db' }}><FaChevronLeft /></button>
          <h4 style={{ margin: 0, color: '#2c3e50' }}>{monthName}</h4>
          <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3498db' }}><FaChevronRight /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '5px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={i} style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {grid}
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#f39c12', borderRadius: '50%' }}></div> On Leave</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#e74c3c', borderRadius: '50%' }}></div> Off/Holiday</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#e67e22', borderRadius: '50%' }}></div> Extended</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#9b59b6', borderRadius: '50%' }}></div> Half-Day</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#3498db', borderRadius: '50%' }}></div> Special Shift</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#2ecc71', borderRadius: '50%' }}></div> Working</div>
        </div>
      </div>
    );
  };

  if (loading && !baseUrl) return <div style={{ padding: '50px', textAlign: 'center' }}>Initializing...</div>;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'linear-gradient(135deg, #e0eaFC 0%, #cfdef3 100%)', padding: '20px' }}>
      <button onClick={() => navigate('/admin')} style={{ ...buttonStyle, position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <FaArrowLeft /> Back
      </button>
      <div style={{ maxWidth: '1200px', margin: '60px auto', background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ borderBottom: '2px solid #3498db', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserTag style={{ color: '#3498db' }} /> Assign Employee Schedule
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {(isGlobalMaster || checkIsAdmin(user || JSON.parse(localStorage.getItem('user') || '{}'))) && (
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
            {(isGlobalMaster || checkIsAdmin(user || JSON.parse(localStorage.getItem('user') || '{}'))) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isGlobalMaster && (
                      <>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>Company:</span>
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: '1px solid #e67e22',
                                fontSize: '13px',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="All">All Companies</option>
                            {companyOptions.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                      </>
                    )}

                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', marginLeft: '10px' }}>Branch:</span>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid #2ecc71',
                            fontSize: '13px',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Branches</option>
                        {branchOptions.map(br => (
                            <option key={br} value={br}>{br}</option>
                        ))}
                    </select>
                </div>
            )}
            <span style={{ background: '#3498db', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem' }}>
              {assignments.length} Active Assignments
            </span>
          </div>
        </div>

        {error && <div style={{ background: '#ffdddd', color: '#c0392b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {message && <div style={{ background: '#ddffdd', color: '#27ae60', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '4px', background: '#e0e0e0', borderRadius: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
            <button type="button" onClick={() => setUse24Hour(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', background: !use24Hour ? '#3498db' : 'transparent', color: !use24Hour ? '#fff' : '#7f8c8d', transition: 'all 0.2s' }}>
              12 Hour
            </button>
            <button type="button" onClick={() => setUse24Hour(true)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', background: use24Hour ? '#3498db' : 'transparent', color: use24Hour ? '#fff' : '#7f8c8d', transition: 'all 0.2s' }}>
              24 Hour
            </button>
          </div>

          <h3 style={{ marginTop: 0, color: '#34495e', borderBottom: '1px dashed #bdc3c7', paddingBottom: '10px', marginBottom: '20px' }}>
            {editingId ? 'Edit Assignment' : 'New Assignment'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignContent: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Select Employee</label>
                  <select required name="employee_id" value={formData.employee_id} onChange={handleInputChange} style={inputStyle}>
                    <option value="">-- Choose Employee --</option>
                    {filteredEmployees.map((e, index) => {
                      const empId = String(e.id || e._id || `emp-${index}`).trim();
                      return <option key={empId} value={empId}>{e.name || e.employeeName || 'Unnamed'} ({e.employeeDesignation || 'N/A'}) {e.department ? `- ${e.department}` : ''}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Select Schedule Rule</label>
                  <select required name="schedule_id" value={formData.schedule_id} onChange={handleInputChange} style={inputStyle}>
                    <option value="">-- Choose Schedule --</option>
                    {filteredSchedules.map((s, idx) => (
                      <option key={s._id || s.id || `sch-${idx}`} value={s._id || s.id}>{getRuleName(s._id || s.id)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Assigned Date (Start)</label>
                <input required type="date" name="assigned_date" value={formData.assigned_date} onChange={handleInputChange} onClick={(e) => { try { e.target.showPicker(); } catch (err) { } }} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ ...labelStyle, marginBottom: 0, marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                  Active Assignment
                </label>
              </div>

              {displayedSpecialDays.length > 0 && (
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #dcdcdc' }}>
                  <h4 style={{ marginTop: 0, color: '#e67e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaGift /> Special Days & Exceptions
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                    Showing special days for the selected rule. Check to apply.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {displayedSpecialDays.map((sd, idx) => {
                      const isChecked = isSpecialDayChecked(sd);
                      return (
                        <div key={idx}
                          onClick={() => toggleSpecialDay(sd)}
                          style={{
                            display: 'flex', alignItems: 'center', padding: '10px', borderRadius: '6px',
                            border: isChecked ? '1px solid #2ecc71' : '1px solid #ecf0f1',
                            background: isChecked ? '#f0fff4' : '#fcfcfc',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            border: isChecked ? 'none' : '2px solid #bdc3c7',
                            background: isChecked ? '#2ecc71' : 'white',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            marginRight: '10px', color: 'white', fontSize: '12px'
                          }}>
                            {isChecked && <FaCheck />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>
                              {sd.date} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>({sd.type})</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#34495e' }}>{sd.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Notes (Optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional details..." style={{ ...inputStyle, minHeight: '80px' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>
                  <FaSave /> {editingId ? 'Update Assignment' : 'Assign Schedule'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} style={{ ...buttonStyle, background: '#95a5a6' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Schedule Preview</label>
              {renderCalendar()}
              <div style={{ marginTop: '20px', padding: '15px', background: '#ecf0f1', borderRadius: '8px', fontSize: '0.85rem', color: '#7f8c8d' }}>
                <p><strong>Interactive Calendar:</strong> Click on any date to add a Holiday, Extended Hour, Half-Day, or Special Shift. You can apply it to this employee only or update the master schedule.</p>
              </div>
            </div>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: '#34495e', color: 'white' }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Branch</th>
                <th style={thStyle}>Schedule Rule</th>
                <th style={thStyle}>Assigned On</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>No assignments yet.</td></tr>
              ) : filteredAssignments.map((a, i) => {
                const { company, branch } = getEmpCompanyAndBranch(a.employee_id);
                return (
                <tr key={a._id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{getEmpName(a.employee_id)}</td>
                  <td style={tdStyle}>{company}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: branch === 'All Branches' ? '#3498db' : '#9b59b6',
                      color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem',
                      display: 'inline-block'
                    }}>
                      {branch}
                    </span>
                  </td>
                  <td style={tdStyle}>{getRuleName(a.schedule_id)}</td>
                  <td style={tdStyle}>{a.assigned_date}</td>
                  <td style={tdStyle}>
                    {a.is_active ?
                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}><FaCheck /> Active</span> :
                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}><FaBan /> Inactive</span>
                    }
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button type="button" onClick={() => handleEdit(a)} style={iconBtnStyle} title="Edit"><FaEdit /></button>
                    <button type="button" onClick={() => confirmDelete(a._id)} style={{ ...iconBtnStyle, color: '#e74c3c' }} title="Delete"><FaTrash /></button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Day Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Add Exception for {modalData.date}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '8px', border: '1px solid #bddeff' }}>
                <label style={labelStyle}>Apply Changes To:</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input type="radio" name="scope" value="employee" checked={modalData.scope === 'employee'} onChange={(e) => setModalData({ ...modalData, scope: e.target.value })} style={{ marginRight: '5px' }} />
                    Current Employee Only
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input type="radio" name="scope" value="master" checked={modalData.scope === 'master'} onChange={(e) => setModalData({ ...modalData, scope: e.target.value })} style={{ marginRight: '5px' }} />
                    Master Schedule (All)
                  </label>
                </div>
              </div>

              {modalData.type === 'Substitute' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Original Employee</label>
                    <input type="text" readOnly value={modalData.description.replace('Substitution for ', '')} style={{ ...inputStyle, background: '#e9ecef' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Department</label>
                    <input type="text" readOnly value={employees.find(e => String(e.id || e._id) === String(formData.employee_id))?.department || 'N/A'} style={{ ...inputStyle, background: '#e9ecef' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Assign Substitute (All Deparments)</label>
                    <select
                      style={inputStyle}
                      value={modalData.substitute_employee_id}
                      onChange={(e) => setModalData({ ...modalData, substitute_employee_id: e.target.value })}
                    >
                      <option value="">-- Select Substitute --</option>
                      {availableSubstitutes.map((emp, index) => {
                        // Find basic shift info if any
                        const existingAssign = assignments.find(a =>
                          String(a.employee_id) === String(emp.id || emp._id) &&
                          a.is_active &&
                          a.assigned_date <= modalData.date
                        );
                        let shiftInfo = "Unassigned";
                        if (existingAssign) {
                          const sch = schedules.find(s => String(s._id || s.id) === String(existingAssign.schedule_id));
                          const sh = sch ? shifts.find(sh => String(sh._id || sh.id) === String(sch.shift_id)) : null;
                          shiftInfo = sh ? sh.schedule_name : (sch ? sch.schedule_name : 'Assigned');
                        }

                        return (
                          <option key={emp.id || emp._id || `sub-${index}`} value={emp.id || emp._id}>
                            {emp.name || emp.employeeName} - {shiftInfo} ({emp.department || 'No Dept'})
                          </option>
                        );
                      })}
                    </select>
                    {availableSubstitutes.length === 0 && (
                      <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '5px' }}>No available employees found.</p>
                    )}
                  </div>
                </>
              )}

              {modalData.type !== 'Substitute' && (
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={modalData.type} onChange={(e) => setModalData({ ...modalData, type: e.target.value })} style={inputStyle}>
                    <option value="Holiday">Holiday</option>
                    <option value="Extended">Extended Hours</option>
                    <option value="Half-Day">Half Day</option>
                    <option value="Special-Shift">Special Shift</option>
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Description / Reason</label>
                <input type="text" value={modalData.description} onChange={(e) => setModalData({ ...modalData, description: e.target.value })} placeholder="e.g. Festival, Extra Work" style={inputStyle} />
              </div>

              {modalData.type === 'Extended' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.extended_start} onChange={(val) => setModalData({ ...modalData, extended_start: val })} format24={use24Hour} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.extended_end} onChange={(val) => setModalData({ ...modalData, extended_end: val })} format24={use24Hour} />
                  </div>
                </div>
              )}

              {modalData.type === 'Half-Day' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.start_time} onChange={(val) => setModalData({ ...modalData, start_time: val })} format24={use24Hour} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End {use24Hour ? '(24h)' : '(12h)'}</label>
                    <CustomTimePicker value={modalData.end_time} onChange={(val) => setModalData({ ...modalData, end_time: val })} format24={use24Hour} />
                  </div>
                </div>
              )}

              {modalData.type === 'Special-Shift' && (
                <div>
                  <label style={labelStyle}>Replacement Shift</label>
                  <select value={modalData.shift_id} onChange={(e) => setModalData({ ...modalData, shift_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Select Shift --</option>
                    {shifts.map(s => <option key={s._id} value={s._id}>{s.schedule_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleModalSave} style={{ ...buttonStyle, flex: 1, background: '#27ae60' }}>Save Exception</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...buttonStyle, flex: 1, background: '#95a5a6' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }} />
            <h3 style={{ color: '#2c3e50', margin: '0 0 15px 0' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to delete this assignment? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={handleExecuteDelete} style={{ padding: '10px 25px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)} style={{ padding: '10px 25px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => {}}
        targetDocType="Schedule Assignment"
      />
    </div>
  );
};

const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #bdc3c7', width: '100%', fontSize: '0.95rem' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' };
const buttonStyle = { padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s', background: '#3498db' };
const thStyle = { padding: '12px 15px', textAlign: 'left', fontWeight: '600' };
const tdStyle = { padding: '12px 15px', color: '#2c3e50' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#3498db', fontSize: '1.1rem', margin: '0 5px' };

export default ScheduleAssignEmployee;
