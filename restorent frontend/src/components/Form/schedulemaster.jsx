// src/components/Form/schedulemaster.jsx
// FULLY DETAILED: Shift Master page
// Manages "shift_master" table via /api/schedules endpoint
// UPDATED: Added "height: 100vh" and "overflowY: auto" to main container to ensure full page scrolling.
// Data is ALWAYS stored as "HH:MM AM/PM" (12h format) for backend consistency.
// The UI (both Inputs and Table) handles conversions dynamically based on toggle state.
import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';
import { FaArrowLeft, FaClock, FaSave, FaEdit, FaTrash, FaTimes, FaPlus, FaMoon, FaSun, FaExclamationTriangle, FaCalendarAlt, FaCheckCircle, FaBuilding, FaCog, FaMapMarkerAlt } from 'react-icons/fa';
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
const CustomTimePicker = ({ value, onChange, format24 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const pickerId = useRef(Math.random().toString(36).substr(2, 9));

  // Internal state is separate from "value" prop logic to support smooth typing
  // We keep 'h', 'm', 'p' purely for the UI fields.
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [p, setP] = useState('AM');

  // Sync internal state with external value AND current format mode
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
        // Convert incoming 12h string to 24h parts for display
        const { h: h24, m: m24 } = to24h(hour, minute, period);
        setH(h24);
        setM(m24);
        setP(''); // Not used in 24h
      } else {
        // Use 12h parts directly
        setH(hour.toString().padStart(2, '0'));
        setM(minute.toString().padStart(2, '0'));
        setP(period);
      }
    }
  }, [value, format24]);

  // Scroll to election
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hElem = document.getElementById(`h-${pickerId.current}-${parseInt(h)}`);
        const mElem = document.getElementById(`m-${pickerId.current}-${parseInt(m)}`);
        const pElem = document.getElementById(`p-${pickerId.current}-${p}`); // Only exists in 12h

        if (hElem) hElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (mElem) mElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (pElem) pElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, h, m, p]);

  const notifyChange = (newH, newM, newP) => {
    // ALWAYS emit "HH:MM AM/PM" (12h format) back to parent
    // If in 24h mode, we must convert internal 24h parts -> 12h string first
    if (format24) {
      if (newH !== '' && newM !== '') {
        // Treat newH as 0-23
        const val12 = to12h(newH, newM);
        onChange(val12);
      } else {
        // Partial inputs? Hard to represent in strict 12h format parent expects
        // We just won't update parent until valid, or clear it.
        if (newH === '' && newM === '') onChange('');
      }
    } else {
      // 12h mode: just emit what we have
      const hh = newH.padStart(2, '0');
      const mm = newM.padStart(2, '0');
      if (newH && newM) onChange(`${hh}:${mm} ${newP}`);
      else if (!newH && !newM) onChange('');
    }
  };

  const handleHChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    // Simple push logic: typing '3' -> '3', then '6' -> '36'
    // 24h mode limits: 0-23. 12h mode limits: 1-12.
    // We let user type freely, validation/clamping happens visually or on blur if needed.
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

  // Close logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Dropdown data generation
  const hours = format24
    ? Array.from({ length: 24 }, (_, i) => i) // 0-23
    : Array.from({ length: 12 }, (_, i) => i + 1); // 1-12

  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];


  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: 'fit-content' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: isOpen ? '1px solid #3498db' : '1px solid #bdc3c7',
          borderRadius: '8px',
          padding: '6px 10px',
          backgroundColor: '#fff',
          cursor: 'text',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : '0 2px 5px rgba(0,0,0,0.05)',
          width: format24 ? '135px' : '180px', // Smaller width for 24h mode
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="HH"
            value={h}
            onChange={handleHChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '24px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          <span style={{ fontWeight: 'bold', userSelect: 'none', color: '#95a5a6', margin: '0 2px' }}>:</span>
          <input
            type="text"
            placeholder="MM"
            value={m}
            onChange={handleMChange}
            onFocus={handleFocus}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            style={{ border: 'none', width: '24px', textAlign: 'center', fontSize: '0.95rem', outline: 'none', color: '#2c3e50', background: 'transparent', fontWeight: '500' }}
          />
          {!format24 && (
            <input
              type="text"
              value={p}
              onChange={handlePChange}
              onFocus={handleFocus}
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
              style={{ border: 'none', width: '35px', textAlign: 'center', fontSize: '0.85rem', marginLeft: '8px', outline: 'none', color: '#fff', background: p === 'AM' ? '#f1c40f' : '#34495e', borderRadius: '4px', cursor: 'pointer', padding: '2px 0', fontWeight: 'bold' }}
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
          zIndex: 1000,
          backgroundColor: '#fff',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          display: 'flex',
          height: '220px',
          overflow: 'hidden',
          width: format24 ? '150px' : '240px', // Adapt dropdown width too
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
const ScheduleMaster = ({ permissions }) => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  // REMOVED: departments state
  // Using existing 'shifts' state for dropdowns as well.


  // Format Toggle State
  const [use24Hour, setUse24Hour] = useState(false); // Default to 12h

  // --- Metadata & DocType State ---
  const [metadata, setMetadata] = useState(null);
  const [doctypeFields, setDoctypeFields] = useState([]);

  const [formData, setFormData] = useState({
    schedule_name: '',
    time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
    working_days: [],
    start_date: '',
    end_date: '',
    special_days: [],
    is_active: true
  });

  // Global State
  const { baseUrl, configLoading, user } = useContext(UserContext);

  const [deleteId, setDeleteId] = useState(null);

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [userBranch, setUserBranch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Filter state for dynamic branches
  const [filterBranches, setFilterBranches] = useState([]);
  const [selectedViewCompany, setSelectedViewCompany] = useState('');

  useEffect(() => {
    const fetchFilterBranches = async () => {
      try {
        const url = baseUrl || "";
        const comp = selectedViewCompany || localStorage.getItem('active_company');
        if (!comp || comp === 'All') {
          setFilterBranches(availableBranches); // fallback
          return;
        }
        const resp = await axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: getHeaders(null, comp) });
        setFilterBranches([...new Set(resp.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name)).filter(Boolean))]);
      } catch (err) {
        console.error("Error fetching filter branches:", err);
      }
    };
    fetchFilterBranches();
  }, [selectedViewCompany, baseUrl, availableBranches]);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [selectedAddBranches, setSelectedAddBranches] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const extractCompanyNames = (companies) => {
    if (!Array.isArray(companies)) return [];
    return companies
      .map(c => (typeof c === 'string' ? c : c.company_name || c.name || ''))
      .filter(Boolean);
  };


  // Helper to get headers with tenancy
  const getHeaders = (branch = null, comp = null) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const activeContext = localStorage.getItem('active_company');
    const token = localStorage.getItem('token');

    // Authorization
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // STRICT Multi-Tenant Isolation:
    // 1. Resolve Company from active context or fallback to user default
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const defaultCompany = user.company_name || user.company;

    const resolvedCompany = comp || ((activeContext && activeContext !== 'All') ? activeContext : defaultCompany);
    if (resolvedCompany) headers['X-Company-Name'] = resolvedCompany;

    // 2. Resolve Branch from Filter or active context
    const branchToUse = branch || (user.branch_name || user.branch || null);
    if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;

    return headers;
  };

  // Initial Data Fetching
  useEffect(() => {
    // Wait for config to load
    if (configLoading) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = baseUrl || "";
        await Promise.all([
          fetchShifts(url),
          fetchPermissions(url),
          fetchDoctype(url)
        ]);
      } catch (err) {
        console.error("Error in initial fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchDoctype = async (currentBaseUrl) => {
      try {
        const url = `${currentBaseUrl}/api/doctypes/Schedule Master`;
        const response = await axios.get(url, { headers: getHeaders() });
        if (response.data && response.data.fields) {
          setMetadata(response.data);
          setDoctypeFields(response.data.fields);
        }
      } catch (err) {
        console.error("Error fetching Schedule Master DocType:", err);
      }
    };

    const fetchPermissions = async (currentBaseUrl) => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const roleRaw = (user.role || "").toLowerCase();
          const role = roleRaw.replace(' ', '_');
          const branch = user.branch || user.branch_name || "";
          const company = user.company || user.company_name || "";

          setCompanyName(company);
          setUserBranch(branch);

          const adminRoles = ['admin', 'super_admin', 'superadmin', 'company_admin', 'group_admin', 'branch_admin'];
          const isAdmin = adminRoles.includes(role);
          setIsCompanyAdmin(['company_admin', 'admin', 'super_admin', 'superadmin', 'branch_admin'].includes(role));
          setIsGroupAdmin(['group_admin', 'super_admin', 'superadmin'].includes(role));
          setUserRole(role);

          if (isAdmin) {
            setCanWrite(true);
            setCanDelete(true);
          }

          const activeContext = localStorage.getItem('active_company');
          if (activeContext === 'All' || role === 'group_admin') {
            fetchCompanies(currentBaseUrl, role);
          } else {
            setSelectedCompanies([activeContext || company]);
            fetchBranches(currentBaseUrl, activeContext || company);
          }

          if (role) {
            const url = `${currentBaseUrl}/api/role-permissions?role=${role}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'schedule_master');
            if (pagePerm) {
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canDelete === true);
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching permissions:", error);
      }
    };

    const fetchCompanies = async (currentBaseUrl, currentRole = null) => {
      try {
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : {};
        const activeRole = currentRole || userRole || (userObj.role || "").toLowerCase();

        let comps = [];
        if (userObj.companies && Array.isArray(userObj.companies) && userObj.companies.length > 0) {
          comps = extractCompanyNames(userObj.companies);
        } else if (userObj.company_name) {
          comps = [userObj.company_name];
        }

        if (comps.length > 0) {
          setAllCompanies(comps);
          setCompanyOptions(comps);
          return;
        }

        const url = `${currentBaseUrl}/api/company-details`;
        const response = await axios.get(url, { headers: getHeaders() });
        const details = response.data.companyDetails || [];
        const names = details.map(d => d.restaurantName || d.company_name).filter(Boolean);
        setAllCompanies([...new Set(names)]);
        setCompanyOptions([...new Set(names)]);
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };


    fetchData();
  }, [baseUrl, configLoading]);

  // NEW: Fetch Branches for Company Assignment
  const fetchBranches = async (currentBaseUrl = baseUrl, specificCompany = null) => {
    try {
      const comp = specificCompany || (selectedCompanies.length > 0 ? selectedCompanies[0] : companyName);
      if (!comp || comp === 'All') return;

      const url = `${currentBaseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`;
      const response = await axios.get(url, { headers: getHeaders(null, comp) });
      const branchList = response.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name)).filter(Boolean);
      setAvailableBranches([...new Set(branchList)]);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  useEffect(() => {
    if (selectedCompanies.length === 0) {
      setAvailableBranches(availableBranches);
      return;
    }
    const fetchFormBranches = async () => {
      try {
        const branchPromises = selectedCompanies.map(comp => axios.get(`${baseUrl || ''}/api/branches?company_name=${encodeURIComponent(comp)}`));
        const results = await Promise.all(branchPromises);
        let branches = [];
        results.forEach(res => {
          branches = [...branches, ...res.data.map(b => typeof b === 'string' ? b : (b.branch_name || b.name))];
        });
        setAvailableBranches([...new Set(branches.filter(Boolean))]);
      } catch (err) { console.error(err); }
    };
    fetchFormBranches();
  }, [selectedCompanies, baseUrl]);

  const [columnOrder, setColumnOrder] = useState([
    { key: "scheduleName", label: "Shift Name", align: "left" },
    { key: "company_name", label: "Companies", align: "left" },
    { key: "branch_name", label: "Branches", align: "left" },
    { key: "dateRange", label: "Date Range", align: "left" },
    { key: "workingDays", label: "Working Days", align: "left" },
    { key: "timeSlots", label: "Shift Times", align: "left" },
    { key: "specialDays", label: "Special Days", align: "left" },
    { key: "actions", label: "Actions", align: "center" },
  ]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(0);
  const possibleColumns = [
    { key: "id", label: "ID", align: "left" },
    { key: "schedule_name", label: "Schedule Name", align: "left" },
    { key: "company_name", label: "Company", align: "left" },
    { key: "branch_name", label: "Branch", align: "left" },
    { key: "start_time", label: "Start Time", align: "left" },
    { key: "end_time", label: "End Time", align: "left" },
    { key: "working_days", label: "Working Days", align: "left" },
    { key: "special_days", label: "Special Days", align: "left" },
    { key: "is_active", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" }
  ];

  const safeParse = (val, fallback = []) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (e) {
        console.error("Error parsing JSON field:", e, val);
        return fallback;
      }
    }
    return fallback;
  };

  const fetchShifts = async () => {
    try {
      // Logic handled in parent effect for initial load
      // But we set loading here for manual refreshes

      const url = baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules';
      const response = await axios.get(url, { headers: getHeaders() });

      // Parse potential JSON strings in array fields
      const parsedData = response.data.map(shift => ({
        ...shift,
        working_days: safeParse(shift.working_days),
        special_days: safeParse(shift.special_days)
      }));

      setShifts(parsedData);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch shifts: ${err.message}`);
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- New Constants & Helpers for Rule Master Logic ---
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const specialDayTypes = [
    { value: 'Holiday', label: 'Holiday (Full Leave)' },
    { value: 'Half-Day', label: 'Half Day (Custom Timing)' },
    { value: 'Extended', label: 'Extended Hours' },
    { value: 'Special-Shift', label: 'Special Shift (Replace with Another Shift)' }
  ];

  const toggleDay = (day) => {
    setFormData(prev => {
      const currentWorking = prev.working_days || [];
      const newWorking = currentWorking.includes(day)
        ? currentWorking.filter(d => d !== day)
        : [...currentWorking, day];
      // Auto-update weekly off (days not in newWorking)
      const newOff = daysOfWeek.filter(d => !newWorking.includes(d));
      return { ...prev, working_days: newWorking, weekly_off: newOff };
    });
  };

  const addSpecialDay = () => {
    setFormData(prev => ({
      ...prev,
      special_days: [...(prev.special_days || []), { date: '', type: '', description: '', start_time: '', end_time: '', extended_start: '', extended_end: '', shift_id: '', is_observed: false }]
    }));
  };

  const removeSpecialDay = (index) => {
    setFormData(prev => ({
      ...prev,
      special_days: prev.special_days.filter((_, i) => i !== index)
    }));
  };

  const addSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...(prev.time_slots || []), { start_time: '', end_time: '', is_overnight: false }]
    }));
  };

  const removeSlot = (index) => {
    if (formData.time_slots.length > 1) {
      setFormData(prev => ({
        ...prev,
        time_slots: prev.time_slots.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSlot = (index, field, value) => {
    setFormData(prev => {
      const newSlots = [...prev.time_slots];
      newSlots[index][field] = value;
      return { ...prev, time_slots: newSlots };
    });
  };

  const updateSpecialDay = (index, field, value) => {
    setFormData(prev => {
      const newSpecial = [...prev.special_days];
      newSpecial[index][field] = value;
      if (field === 'type' && value === 'Holiday') {
        newSpecial[index].is_observed = true;
      }
      return { ...prev, special_days: newSpecial };
    });
  };

  const getConditionalFields = (item, index) => {
    switch (item.type) {
      case 'Holiday': return null;
      case 'Half-Day':

        return (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Start {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker value={item.start_time} onChange={(val) => updateSpecialDay(index, 'start_time', val)} format24={use24Hour} placeholder="Start" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>End {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker value={item.end_time} onChange={(val) => updateSpecialDay(index, 'end_time', val)} format24={use24Hour} placeholder="End" />
            </div>
          </>
        );
      case 'Extended':

        return (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Ext Start {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker value={item.extended_start} onChange={(val) => updateSpecialDay(index, 'extended_start', val)} format24={use24Hour} placeholder="Start" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Ext End {use24Hour ? '(24h)' : '(12h)'}</label>
              <CustomTimePicker value={item.extended_end} onChange={(val) => updateSpecialDay(index, 'extended_end', val)} format24={use24Hour} placeholder="End" />
            </div>
          </>
        );
      case 'Special-Shift':

        return (
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Replacement Shift</label>
            <select value={item.shift_id} onChange={(e) => updateSpecialDay(index, 'shift_id', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option value="">-- Select Shift --</option>
              {shifts.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>{s.schedule_name}</option>
              ))}
            </select>
          </div>
        );
      default: return null;
    }
  };



  const normalizeScheduleData = (shift) => {
    if (!shift) return {};
    return {
      ...shift,
      working_days: safeParse(shift.working_days),
      special_days: safeParse(shift.special_days),
      time_slots: safeParse(shift.time_slots, [{ start_time: '', end_time: '', is_overnight: false }])
    };
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to add shifts.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!formData.schedule_name.trim()) {
      setError('Shift name is required.');
      return;
    }

    if (formData.time_slots.some(s => !s.start_time || !s.end_time)) {
      setError('Please fill in all start and end times.');
      return;
    }

    const activeContext = localStorage.getItem('active_company');
    if (activeContext === 'All' && isGroupAdmin && selectedCompanies.length === 0) {
      setError("Please select at least one company.");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorMsgs = [];

    try {
      const activeCtx = localStorage.getItem('active_company') || 'All';
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : {};
      const userComp = userData.company_name || userData.company || '';
      const companiesToProcess = activeCtx === 'All'
        ? selectedCompanies
        : [activeCtx || userComp || ''].filter(Boolean);
      const url = baseUrl ? `${baseUrl}/api/schedules` : '/api/schedules';

      const payload = {
        ...formData,
        company_names: companiesToProcess,
        branch_names: isSpecificBranchActive ? [(localStorage.getItem("active_branch") || "")] : selectedAddBranches
      };
      const headers = getHeaders();

      try {
        await axios.post(url, payload, { headers });
        successCount++;
      } catch (err) {
        errorMsgs.push(`Error: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setMessage(`Shift added successfully!`);
        setFormData({
          schedule_name: '', time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
          working_days: [], start_date: '', end_date: '', special_days: [], is_active: true
        });
        setSelectedBranches([]);
        fetchShifts();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(`Failed to add shift: ${errorMsgs.join(", ")}`);
      }
    } catch (err) {
      setError(`An unexpected error occurred.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyToggle = (company) => {
    setSelectedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const handleEditShift = (shift) => {
    const normalized = normalizeScheduleData(shift);
    setFormData({
      ...normalized,
      is_active: shift.is_active !== undefined ? shift.is_active : true
    });

    // Resolve Company & Branch assignments for editing
    if (shift.company_names && shift.company_names.length > 0) {
      setSelectedCompanies(shift.company_names);
    } else if (shift.company_name) {
      setSelectedCompanies(Array.isArray(shift.company_name) ? shift.company_name : [shift.company_name]);
    } else {
      setSelectedCompanies([]);
    }

    if (shift.branch_names) {
      const bArray = Array.isArray(shift.branch_names) ? shift.branch_names : [shift.branch_names];
      setSelectedBranches(bArray);
      setSelectedAddBranches(bArray);
    }

    setEditingId(shift.global_ref_id || shift.id || shift._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setError("You do not have permission to update shifts.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!formData.schedule_name.trim()) {
      setError('Schedule name is required.');
      return;
    }

    setLoading(true);
    try {
      const activeCtx = localStorage.getItem('active_company') || 'All';
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : {};
      const userComp = userData.company_name || userData.company || '';
      const companiesToProcess = activeCtx === 'All'
        ? selectedCompanies
        : [activeCtx || userComp || ''].filter(Boolean);

      const url = baseUrl ? `${baseUrl}/api/schedules/bulk/${editingId}` : `/api/schedules/bulk/${editingId}`;
      const payload = {
        ...formData,
        company_names: companiesToProcess,
        branch_names: isSpecificBranchActive ? [(localStorage.getItem("active_branch") || "")] : selectedAddBranches
      };

      await axios.put(url, payload, { headers: getHeaders() });
      setMessage('Shift updated successfully!');
      setEditingId(null);
      setFormData({
        schedule_name: '', time_slots: [{ start_time: '', end_time: '', is_overnight: false }],
        working_days: [], start_date: '', end_date: '', special_days: [], is_active: true
      });
      setSelectedBranches([]);
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to update schedule: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteShift = (shift) => {
    setDeleteId(shift);
  };

  const handleExecuteDelete = async () => {
    if (!canDelete) {
      setError("You do not have permission to delete shifts.");
      setTimeout(() => setError(null), 3000);
      setDeleteId(null);
      return;
    }
    if (!deleteId) return;
    try {
      const isBulk = !!deleteId.global_ref_id;
      const targetId = deleteId.global_ref_id || deleteId.id || deleteId._id;
      const endpoint = isBulk ? `/api/schedules/bulk/${targetId}` : `/api/schedules/${targetId}`;
      const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
      
      await axios.delete(url, { headers: getHeaders() });
      setMessage('Shift deleted successfully!');
      setDeleteId(null);
      fetchShifts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to delete shift: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 3000);
      setDeleteId(null);
    }
  };

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
  };

  const removeColumn = (index) => {
    const newOrder = [...columnOrder];
    const removed = newOrder.splice(index, 1)[0];
    if (removed && removed.key === "actions") {
      newOrder.push(removed);
    }
    setColumnOrder(newOrder);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.target.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const newOrder = [...columnOrder];
    const [draggedColumn] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    setColumnOrder(newOrder);
    document.querySelectorAll('table th').forEach(th => {
      th.style.backgroundColor = '';
    });
  };

  // Convert 12h string -> 24h string for display only
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    if (!use24Hour) return timeStr; // Return 12h as is

    // Match "06:18 PM"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1]);
      let m = match[2];
      let p = match[3].toUpperCase();

      let { h: h24, m: m24 } = to24h(h, m, p);
      return `${h24}:${m24}`;
    }
    return timeStr;
  };

  const thStyle = {
    padding: '15px 12px',
    border: 'none',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontWeight: '600',
    fontSize: '0.95rem'
  };

  const tdStyle = {
    padding: '15px 12px',
    borderRight: '1px solid #e9ecef',
    whiteSpace: 'normal',
    color: '#2c3e50'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #3498db',
    borderRadius: '10px',
    background: '#f8f9fa',
    fontSize: '1rem',
    transition: 'all 0.2s',
    outline: 'none'
  };

  const getCellContent = (shift, col) => {
    const val = shift[col.key];

    if (col.key === 'actions') {

      return (
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          {canWrite && (
            <button onClick={() => handleEditShift(shift)} style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }} title="Edit">
              <FaEdit />
            </button>
          )}
          {canDelete && (
            <button onClick={() => confirmDeleteShift(shift)} style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }} title="Delete">
              <FaTrash />
            </button>
          )}
        </div>
      );
    }

    if (col.key === 'scheduleName' || col.key === 'schedule_name') {
      return shift.schedule_name || shift.scheduleName || val || '-';
    }

    if (col.key === 'dateRange' || (col.key === 'start_date' && !shift.end_date)) {
      if (shift.start_date && shift.end_date) {
        return `${shift.start_date} to ${shift.end_date}`;
      }
      return val || '-';
    }

    if (col.key === 'working_days' || col.key === 'workingDays') {
      const days = Array.isArray(shift.working_days) ? shift.working_days : safeParse(shift.working_days);
      return days && days.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {days.map(d => <span key={d} style={{ background: '#3498db', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{d}</span>)}
        </div>
      ) : 'All Days';
    }

    if (col.key === 'timeSlots' || col.key === 'shift_times' || col.key === 'start_time' || col.key === 'end_time') {
      // Compatibility with both direct fields and old time_slots array
      if (shift.start_time && shift.end_time && col.key !== 'timeSlots' && col.key !== 'shift_times') {
        if (col.key === 'start_time') return formatTimeDisplay(shift.start_time);
        if (col.key === 'end_time') return formatTimeDisplay(shift.end_time);
      }

      const slots = Array.isArray(shift.time_slots) ? shift.time_slots : safeParse(shift.time_slots);
      if (slots && slots.length > 0) {

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#2c3e50' }}>
                <FaClock style={{ color: '#3498db', fontSize: '0.75rem' }} />
                <span>{formatTimeDisplay(s.start_time)} - {formatTimeDisplay(s.end_time)}</span>
                {s.is_overnight && <FaMoon style={{ color: '#f1c40f', fontSize: '0.75rem' }} />}
              </div>
            ))}
          </div>
        );
      }

      if (shift.start_time && shift.end_time) {

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2c3e50' }}>
            <FaClock style={{ color: '#3498db' }} /> {formatTimeDisplay(shift.start_time)} - {formatTimeDisplay(shift.end_time)}
            {shift.is_overnight && <FaMoon style={{ color: '#f1c40f', fontSize: '0.8rem' }} />}
          </div>
        );
      }
      return '-';
    }

    if (col.key === 'special_days' || col.key === 'specialDays') {
      const special = Array.isArray(shift.special_days) ? shift.special_days : safeParse(shift.special_days);
      return special && special.length > 0 ? `${special.length} Special Days` : '-';
    }

    if (col.key === 'is_active' || col.key === 'status') {
      return shift.is_active ? <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Active</span> : <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Inactive</span>;
    }
    if (col.key === 'company_name' || col.key === 'company') {
      const comps = shift.company_names && shift.company_names.length > 0 ? shift.company_names : (Array.isArray(shift.company_name) ? shift.company_name : [shift.company_name].filter(Boolean));
      return comps.length > 0 ? comps.join(", ") : '-';
    }

    if (col.key === 'branch_name' || col.key === 'branch' || col.key === 'branch_names') {
      const branches = Array.isArray(shift.branch_names) ? shift.branch_names : (shift.branch_name ? [shift.branch_name] : []);
      if (branches.length === 0 || (branches.length === 1 && branches[0] === 'All Branches')) {
        return 'All Branches';
      }
      return branches.join(", ");
    }

    return val || '-';
  };

  useEffect(() => {
    const fetchDynamicBranches = async () => {
      try {
        const url = baseUrl || "";
        const compsToFetch = selectedCompanies.length > 0 ? selectedCompanies : companyOptions;
        if (!compsToFetch || compsToFetch.length === 0) {
          return;
        }

        const localGetHeaders = () => {
          const token = localStorage.getItem('token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        };
        const headersFunc = typeof getHeaders === 'function' ? getHeaders : localGetHeaders;

        const branchPromises = compsToFetch.map(comp =>
          axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, {
            headers: { ...headersFunc(), "X-Company-Name": comp }
          }).then(res => res.data)
        );

        const results = await Promise.all(branchPromises);
        const allBranches = [];
        results.forEach(data => {
          const branches = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)).filter(Boolean);
          allBranches.push(...branches);
        });

        setAvailableBranches([...new Set(allBranches)]);
      } catch (err) {
        console.error("Error fetching dynamic branches:", err);
      }
    };
    fetchDynamicBranches();
  }, [selectedCompanies, companyOptions, baseUrl]);
  if (loading) {

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '18px' }}>
          <FaClock style={{ fontSize: '48px', marginBottom: '20px' }} />
          <p>Loading shifts...</p>
        </div>
      </div>
    );
  }


  const isGroupAdminRole = checkIsGlobalAdmin(JSON.parse(localStorage.getItem('user') || '{}'));
  const isAdminRole = checkIsAdmin(JSON.parse(localStorage.getItem('user') || '{}'));

  const activeCompanyLocal = (localStorage.getItem('active_company') || 'All').trim();
  const isSpecificCompanyActive = activeCompanyLocal.toLowerCase() !== 'all companies' && activeCompanyLocal.toLowerCase() !== 'all' && activeCompanyLocal.toLowerCase() !== 'global' && activeCompanyLocal !== '';
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';

  const showCompanyAssign = !isSpecificBranchActive && (isGroupAdminRole || isAdminRole);
  const showBranchAssign = !isSpecificBranchActive && (isGroupAdminRole || isAdminRole);


  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', position: 'relative' }}>

      {showAssignmentModal && (
        <div className="add-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="add-modal" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Schedule Assignments</span>
              <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body">
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '15px' }}><FaUsers style={{ marginRight: '8px' }} /> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(comp)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCompanies(prev => [...prev, comp]);
                            else setSelectedCompanies(prev => prev.filter(c => c !== comp));
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                        />
                        {comp}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showBranchAssign && (
                <div className="assignment-card">
                  <h4 style={{ color: '#10b981', marginBottom: '15px' }}><FaMapMarkerAlt style={{ marginRight: '8px' }} /> Select Branch</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branchName, idx) => {
                      const bName = typeof branchName === 'string' ? branchName : (branchName.branch_name || branchName.name || branchName);

                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                          <input
                            type="checkbox"
                            checked={selectedAddBranches.includes(bName)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAddBranches(prev => [...prev, bName]);
                              else setSelectedAddBranches(prev => prev.filter(b => b !== bName));
                            }}
                            style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                          />
                          {bName}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignmentModal(false)} style={{ padding: '12px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/admin')} style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent', border: '2px solid #3498db', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '50px', fontSize: '16px', fontWeight: '600', zIndex: 1001 }}>
        <FaArrowLeft /> Back to Admin
      </button>

      <div style={{ maxWidth: '1250px', margin: '80px auto 20px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #3498db' }}>
          <h2 style={{ textAlign: 'center', color: '#2c3e50', margin: 0, fontSize: '1.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClock style={{ color: '#3498db', fontSize: '2rem' }} /> Shift Master ({shifts.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(isGroupAdmin || isCompanyAdmin) && (
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
            {/* <button onClick={() => navigate('/schedule-rule-master')} style={{ background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 8px rgba(142, 68, 173, 0.3)' }}>
              Manage Schedule Rules <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
            </button> */}
            <button onClick={() => setShowColumnModal(true)} style={{ background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '50px', fontSize: '1rem', fontWeight: '600' }}>
              Manage Columns
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c0392b', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e74c3c' }}><FaTimes /> {error}</div>}
        {message && <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', border: '1px solid #28a745' }}><FaSave /> {message}</div>}

        <div style={{ background: '#ffffff', padding: '30px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #e9ecef', position: 'relative' }}>

          {/* Format Toggle Button - Absolute positioned top-left of this section */}
          <div style={{ position: 'absolute', top: '30px', left: '30px', padding: '4px', background: '#f1f2f6', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setUse24Hour(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: !use24Hour ? '#3498db' : 'transparent',
                color: !use24Hour ? '#fff' : '#7f8c8d',
                transition: 'all 0.2s'
              }}
            >
              12 Hour
            </button>
            <button
              type="button"
              onClick={() => setUse24Hour(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: use24Hour ? '#3498db' : 'transparent',
                color: use24Hour ? '#fff' : '#7f8c8d',
                transition: 'all 0.2s'
              }}
            >
              24 Hour
            </button>
          </div>

          <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '25px', fontSize: '1.5rem', fontWeight: '600' }}>{editingId ? 'Edit Schedule' : 'Add New Schedule'}</h2>

          <form onSubmit={editingId ? handleUpdateShift : handleAddShift} style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>



            {/* Shift Name - Full Width */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>Shift Name</label>
              <input
                type="text"
                name="schedule_name"
                placeholder="e.g. Morning Shift"
                value={formData.schedule_name}
                onChange={handleInputChange}
                style={{ ...inputStyle, border: '2px solid #e0e6ed', background: 'white' }}
                required
              />
            </div>

            {/* Shift Timings (Time Slots) Section */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>Shift Timings (Time Slots)</label>

              <div style={{ border: '2px solid #e0e6ed', borderRadius: '12px', padding: '25px', background: 'white' }}>
                {formData.time_slots.map((slot, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: index === formData.time_slots.length - 1 ? 0 : '25px', position: 'relative' }}>
                    <div style={{ flex: '0 0 220px' }}>
                      <label style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '8px', display: 'block' }}>Start Time (12h)</label>
                      <CustomTimePicker
                        value={slot.start_time}
                        onChange={(val) => updateSlot(index, 'start_time', val)}
                        format24={false}
                      />
                    </div>
                    <div style={{ flex: '0 0 220px' }}>
                      <label style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '8px', display: 'block' }}>End Time (12h)</label>
                      <CustomTimePicker
                        value={slot.end_time}
                        onChange={(val) => updateSlot(index, 'end_time', val)}
                        format24={false}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '22px' }}>
                      <input
                        type="checkbox"
                        checked={slot.is_overnight}
                        onChange={(e) => updateSlot(index, 'is_overnight', e.target.checked)}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span style={{ fontSize: '1rem', color: '#2c3e50' }}>Overnight?</span>
                    </label>

                    {formData.time_slots.length > 1 && (
                      <button type="button" onClick={() => removeSlot(index)} style={{ padding: '6px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', position: 'absolute', right: '-15px', top: '0' }}>
                        <FaTimes size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSlot}
                style={{
                  marginTop: '15px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                  fontSize: '0.95rem'
                }}
              >
                <FaPlus /> Add Another Slot
              </button>
            </div>

            {/* Date Range Section */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>Date Range</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, flex: 1, border: '2px solid #e0e6ed', background: 'white', borderRadius: '12px' }}
                />
                <span style={{ color: '#7f8c8d', fontWeight: '600' }}>to</span>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, flex: 1, border: '2px solid #e0e6ed', background: 'white', borderRadius: '12px' }}
                />
              </div>
            </div>

            {/* Set Working Days Section */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>Set Working Days (Unselected days become Weekly Offs)</label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '40px',
                      border: '2px solid #e0e6ed',
                      background: formData.working_days.includes(day) ? '#3498db' : '#f8f9fa',
                      color: formData.working_days.includes(day) ? 'white' : '#7f8c8d',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '80px',
                      fontSize: '0.95rem'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '500' }}>
                <strong>Weekly Offs:</strong> {daysOfWeek.filter(d => !formData.working_days.includes(d)).length > 0
                  ? daysOfWeek.filter(d => !formData.working_days.includes(d)).join(", ")
                  : "None (7 days working)"}
              </div>
            </div>

            {/* Dynamic DocType Fields (Other than the ones styled above) */}
            {doctypeFields.filter(f => !['schedule_name', 'time_slots', 'working_days', 'start_date', 'end_date', 'is_active', 'is_overnight', 'start_time', 'end_time', 'hidden'].includes(f.id) && !f.hidden).map(field => (
              <div key={field.id} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  {field.label} {field.mandatory && <span style={{ color: '#e74c3c' }}>*</span>}
                </label>

                {field.type === 'Data' || field.type === 'Number' ? (
                  <input
                    type={field.type === 'Number' ? 'number' : 'text'}
                    name={field.id}
                    value={formData[field.id] || ''}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder={field.description || ''}
                  />
                ) : field.type === 'Time' ? (
                  <CustomTimePicker
                    value={formData[field.id]}
                    onChange={(val) => setFormData(p => ({ ...p, [field.id]: val }))}
                    format24={use24Hour}
                  />
                ) : field.type === 'Check' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!formData[field.id]}
                      onChange={(e) => setFormData(p => ({ ...p, [field.id]: e.target.checked }))}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#34495e' }}>{field.label}</span>
                  </label>
                ) : field.type === 'MultiSelect' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {(field.options || daysOfWeek).map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '5px 12px', background: (formData[field.id] || []).includes(opt) ? '#3498db' : '#f8f9fa', color: (formData[field.id] || []).includes(opt) ? 'white' : '#34495e', borderRadius: '20px', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          hidden
                          checked={(formData[field.id] || []).includes(opt)}
                          onChange={() => {
                            const current = formData[field.id] || [];
                            const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
                            setFormData(p => ({ ...p, [field.id]: next }));
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {/* Active Status Toggle */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 15px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e0e6ed', width: 'fit-content' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Active (Schedule is visible and in use)</span>
              </label>
            </div>

            {/* Special Days Section */}
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaCalendarAlt style={{ color: '#3498db' }} /> Special Days (Holidays / Exceptions)
                </label>
                <button type="button" onClick={addSpecialDay} style={{ padding: '6px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <FaPlus style={{ marginRight: '5px' }} /> Add Date
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {formData.special_days.map((item, idx) => (
                  <div key={idx} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee', position: 'relative' }}>
                    <input type="date" value={item.date} onChange={(e) => updateSpecialDay(idx, 'date', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }} required />
                    <select value={item.type} onChange={(e) => updateSpecialDay(idx, 'type', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required>
                      <option value="">-- Select Type --</option>
                      {specialDayTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input type="text" placeholder="Reason" value={item.description} onChange={(e) => updateSpecialDay(idx, 'description', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '10px' }} required />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>{getConditionalFields(item, idx)}</div>
                    <button type="button" onClick={() => removeSpecialDay(idx)} style={{ position: 'absolute', top: '10px', right: '10px', color: '#e74c3c', background: 'transparent', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Section (Companies/Branches) */}
            {isGroupAdmin ? (
              <div style={{ gridColumn: '1 / -1', padding: '20px', background: '#f0f4f8', borderRadius: '12px', border: '1px solid #3498db' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaBuilding style={{ color: '#3498db' }} /> Company Assignment *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {allCompanies.map(comp => (
                    <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', background: 'white', borderRadius: '8px', border: selectedCompanies.includes(comp) ? '1.5px solid #3498db' : '1.5px solid #eee' }}>
                      <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={() => handleCompanyToggle(comp)} />
                      <span style={{ fontSize: '0.9rem' }}>{comp}</span>
                    </label>
                  ))}
                </div>
                {allCompanies.length === 0 && <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>No companies found. Please check your permissions.</p>}
              </div>
            ) : (isCompanyAdmin || userRole === 'branch_admin') && (
              <div style={{ gridColumn: '1 / -1', padding: '20px', background: '#f0f4f8', borderRadius: '12px', border: '1px solid #3498db' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaBuilding style={{ color: '#3498db' }} /> Branch Assignment *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {availableBranches.map(branch => (
                    <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', background: 'white', borderRadius: '8px', border: selectedBranches.includes(branch) ? '1.5px solid #3498db' : '1.5px solid #eee' }}>
                      <input
                        type="checkbox"
                        checked={selectedBranches.includes(branch)}
                        onChange={() => setSelectedBranches(prev => prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch])}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{branch}</span>
                    </label>
                  ))}
                </div>
                {availableBranches.length === 0 && <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>No branches found for this company.</p>}
              </div>
            )}


            {/* --- Company and Branch Assignment Section --- */}
            {showCompanyAssign && (
              <div style={{ marginTop: '30px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaBuilding style={{ color: '#3b82f6' }} /> Assign to Companies *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {(companyOptions.length > 0 ? companyOptions : selectedCompanies).map((comp, idx) => {
                    const isSelected = selectedCompanies.includes(comp);

                    return (
                      <div key={idx} style={{ border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0', padding: '15px', borderRadius: '12px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                        if (isSelected) setSelectedCompanies(prev => prev.filter(c => c !== comp));
                        else setSelectedCompanies(prev => [...prev, comp]);
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSelected} readOnly style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{comp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showBranchAssign && selectedCompanies.length > 0 && availableBranches.length > 0 && (
              <div style={{ marginTop: '20px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaMapMarkerAlt style={{ color: '#10b981' }} /> Assign to Branches
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {availableBranches.map((brName, idx) => {
                    const isSelected = selectedAddBranches.includes(brName);

                    return (
                      <div key={idx} style={{ border: isSelected ? '1.5px solid #10b981' : '1.5px solid #e2e8f0', padding: '15px', borderRadius: '12px', backgroundColor: isSelected ? '#ecfdf5' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                        if (isSelected) setSelectedAddBranches(prev => prev.filter(b => b !== brName));
                        else setSelectedAddBranches(prev => [...prev, brName]);
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSelected} readOnly style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }} />
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{brName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}




            <button type="submit" style={{ gridColumn: '1 / -1', padding: '15px', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)' }}>
              {editingId ? <><FaSave style={{ marginRight: '8px' }} /> Update Schedule</> : <><FaPlus style={{ marginRight: '8px' }} /> Create Schedule</>}
            </button>

            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ schedule_name: '', start_time: '', end_time: '', is_overnight: false, working_days: [], special_days: [], is_active: true }); setSelectedBranches([]); }} style={{ gridColumn: '1 / -1', padding: '12px', background: '#bdc3c7', color: '#2c3e50', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* --- Shift Table --- */}
        <div style={{ background: '#ffffff', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e9ecef', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', color: '#2c3e50', borderBottom: '2px solid #e9ecef' }}>
                  {columnOrder.map((col, index) => (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{ ...thStyle, cursor: 'move' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.length > 0 ? (
                  shifts.map((shift, index) => (
                    <tr key={shift.id || shift._id} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfcfc', transition: 'background-color 0.2s' }}>
                      {columnOrder.map(col => (
                        <td key={col.key} style={{ ...tdStyle, textAlign: col.align || 'left' }}>
                          {getCellContent(shift, col)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columnOrder.length} style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                      No shifts found. Create one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <FaExclamationTriangle style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }} />
            <h3 style={{ color: '#2c3e50', margin: '0 0 15px 0' }}>Confirm Deletion</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to delete this shift? This action cannot be undone.</p>
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

      {/* Column Manager Modal */}
      {showColumnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Manage Table Columns</h3>
              <FaTimes style={{ cursor: 'pointer', color: '#7f8c8d' }} onClick={() => setShowColumnModal(false)} />
            </div>

            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#34495e', fontSize: '0.9rem' }}>Add New Column</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={selectedFieldToAdd}
                  onChange={(e) => setSelectedFieldToAdd(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }}
                >
                  <option value="">Select Field...</option>
                  {possibleColumns.filter(p => !columnOrder.some(c => c.key === p.key)).map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  style={{ width: '80px', padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }}
                >
                  {columnOrder.map((_, i) => (
                    <option key={i} value={i}>Pos {i + 1}</option>
                  ))}
                  <option value={columnOrder.length}>Last</option>
                </select>
                <button
                  onClick={addColumn}
                  disabled={!selectedFieldToAdd}
                  style={{ padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: selectedFieldToAdd ? 'pointer' : 'not-allowed' }}
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#34495e', fontSize: '0.9rem' }}>Current Columns (Drag to Reorder)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {columnOrder.map((col, index) => (
                  <div
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'move',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span>{index + 1}. {col.label}</span>
                    <FaTimes
                      style={{ color: '#e74c3c', cursor: 'pointer' }}
                      title="Remove"
                      onClick={() => removeColumn(index)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setShowColumnModal(false)} style={{ padding: '10px 20px', background: '#34495e', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => { }}
        targetDocType="Schedule Master"
      />
    </div>
  );
};

export default ScheduleMaster;
