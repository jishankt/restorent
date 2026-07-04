import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft, FaTimes, FaPlus, FaUsers, FaMapMarkerAlt, FaSave, FaCogs, FaChevronDown, FaPlusCircle, FaDatabase, FaIdCard, FaAddressBook, FaFileAlt, FaStar, FaChevronRight, FaChevronLeft, FaCalendarAlt, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import "./CreateCustomerPage.css";
import CustomerCustomizationModal from "./CustomerCustomizationModal";

const CustomDatePicker = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('days'); // 'days' | 'months' | 'years'
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date();
  });
  const [yearPage, setYearPage] = useState(() => Math.floor((currentDate.getFullYear()) / 12) * 12);

  // Popup quick input states
  const [popupDay, setPopupDay] = useState(() => value ? (new Date(value).getDate() || "") : "");
  const [popupMonth, setPopupMonth] = useState(() => value ? ((new Date(value).getMonth() + 1) || "") : "");
  const [popupYear, setPopupYear] = useState(() => value ? (new Date(value).getFullYear() || "") : "");

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        setCurrentDate(parsed);
        setYearPage(Math.floor(parsed.getFullYear() / 12) * 12);
        setPopupDay(parsed.getDate() || "");
        setPopupMonth((parsed.getMonth() + 1) || "");
        setPopupYear(parsed.getFullYear() || "");
      }
    } else {
      setPopupDay("");
      setPopupMonth("");
      setPopupYear("");
    }
  }, [value]);

  const handleQuickChange = (type, val) => {
    if (type === 'day') setPopupDay(val);
    if (type === 'month') setPopupMonth(val);
    if (type === 'year') setPopupYear(val);

    const newDay = type === 'day' ? val : popupDay;
    const newMonth = type === 'month' ? val : popupMonth;
    const newYear = type === 'year' ? val : popupYear;

    const parsedYear = parseInt(newYear, 10);
    const parsedMonth = parseInt(newMonth, 10);
    const parsedDay = parseInt(newDay, 10);

    if (!isNaN(parsedYear) && parsedYear > 1000 && !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 && !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
      const newDateObj = new Date(parsedYear, parsedMonth - 1, parsedDay);
      if (!isNaN(newDateObj)) {
        setCurrentDate(newDateObj);
        setYearPage(Math.floor(parsedYear / 12) * 12);
        const formattedMonth = String(parsedMonth).padStart(2, '0');
        const formattedDay = String(parsedDay).padStart(2, '0');
        onChange(`${parsedYear}-${formattedMonth}-${formattedDay}`);
      }
    } else if (!isNaN(parsedYear) && parsedYear > 1000 && !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      setCurrentDate(new Date(parsedYear, parsedMonth - 1, 1));
      setYearPage(Math.floor(parsedYear / 12) * 12);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (day, e) => {
    e.stopPropagation();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(selectedDateStr);
    setIsOpen(false);
    setView('days');
  };

  let selectedYear = null, selectedMonth = null, selectedDay = null;
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      selectedYear = parsed.getFullYear();
      selectedMonth = parsed.getMonth();
      selectedDay = parsed.getDate();
    }
  }

  return (
    <div className="custom-datepicker-container" style={{ position: 'relative', width: '100%' }}>
      <div 
        className="custom-datepicker-input"
        onClick={() => { setIsOpen(!isOpen); setView('days'); }}
        style={{ position: 'relative' }}
      >
        <input 
          type="text" 
          readOnly
          value={value || ""} 
          placeholder={placeholder || "YYYY-MM-DD"} 
          style={{ cursor: 'pointer', background: '#F3F6FB', width: '100%', height: '44px', padding: '0 16px', borderRadius: '8px', border: '1px solid transparent', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box' }}
        />
        <FaCalendarAlt 
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#604BE8', pointerEvents: 'none' }} 
        />
      </div>

      {isOpen && (
        <>
          <div className="custom-datepicker-backdrop" onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} />
          <div className="custom-datepicker-popup" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '320px', background: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: '24px', zIndex: 1001, border: '1px solid #e2e8f0', animation: 'slideDown 0.2s ease', boxSizing: 'border-box' }}>
            
            {/* Quick Input Row inside Popup */}
            <div className="popup-quick-inputs-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Enter Date</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Day</span>
                  <input 
                    type="number" 
                    value={popupDay} 
                    onChange={(e) => handleQuickChange('day', e.target.value)} 
                    placeholder="DD" 
                    min="1" 
                    max="31"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Month</span>
                  <input 
                    type="number" 
                    value={popupMonth} 
                    onChange={(e) => handleQuickChange('month', e.target.value)} 
                    placeholder="MM" 
                    min="1" 
                    max="12"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center' }} 
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Year</span>
                  <input 
                    type="number" 
                    value={popupYear} 
                    onChange={(e) => handleQuickChange('year', e.target.value)} 
                    placeholder="YYYY" 
                    min="1000" 
                    max="9999"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center' }} 
                  />
                </div>
              </div>
            </div>

            {view === 'days' && (
              <>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={handlePrevMonth} className="cal-nav-btn" style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px', transition: 'all 0.2s ease' }}>
                    <FaChevronLeft />
                  </button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span onClick={(e) => { e.stopPropagation(); setView('months'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {monthNames[month]}
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); setYearPage(Math.floor(year / 12) * 12); setView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {year}
                    </span>
                  </div>
                  <button type="button" onClick={handleNextMonth} className="cal-nav-btn" style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px', transition: 'all 0.2s ease' }}>
                    <FaChevronRight />
                  </button>
                </div>

                <div className="custom-datepicker-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '16px' }}>
                  {["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"].map((w, i) => (
                    <span key={i} style={{ fontSize: '13px', fontWeight: '700', color: '#1B1B29' }}>{w}</span>
                  ))}
                </div>

                <div className="custom-datepicker-days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px' }}>
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedYear === year && selectedMonth === month && selectedDay === day;
                    const dayOfWeek = (startOffset + i) % 7;
                    const startOfWeek = day - dayOfWeek;
                    const endOfWeek = startOfWeek + 6;
                    const isSameWeekAfterSelected = selectedYear === year && selectedMonth === month && selectedDay && selectedDay >= startOfWeek && selectedDay <= endOfWeek && day > selectedDay;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={(e) => handleSelectDate(day, e)}
                        className={`cal-day-btn ${isSelected ? 'selected' : isSameWeekAfterSelected ? 'highlighted' : ''}`}
                        style={{
                          height: '36px',
                          width: '100%',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: isSelected ? '700' : '600',
                          cursor: 'pointer',
                          background: isSelected ? '#604BE8' : isSameWeekAfterSelected ? '#F3F6FB' : 'transparent',
                          color: isSelected ? '#ffffff' : isSameWeekAfterSelected ? '#604BE8' : '#1B1B29',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'months' && (
              <div>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setView('days'); }} style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronLeft />
                  </button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29' }}>Select Month</span>
                  <div style={{ width: '36px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {monthNames.map((mName, index) => (
                    <button
                      key={mName}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(new Date(year, index, 1));
                        setView('days');
                      }}
                      style={{
                        height: '42px',
                        border: 'none',
                        borderRadius: '10px',
                        background: index === month ? '#604BE8' : '#F3F6FB',
                        color: index === month ? '#ffffff' : '#1B1B29',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {mName.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'years' && (
              <div>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setYearPage(yearPage - 12); }} style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronLeft />
                  </button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setView('days'); }}>
                    {yearPage} - {yearPage + 11}
                  </span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setYearPage(yearPage + 12); }} style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronRight />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = yearPage + i;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(y, month, 1));
                          setView('days');
                        }}
                        style={{
                          height: '42px',
                          border: 'none',
                          borderRadius: '10px',
                          background: y === year ? '#604BE8' : '#F3F6FB',
                          color: y === year ? '#ffffff' : '#1B1B29',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};


const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    (option || "").toLowerCase().includes((search || "").toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) setShowList(true);
    if (allowCreateNew && !onAddNewValue) {
      if (onChange) onChange(newSearch);
    }
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) onChange(option);
    setShowList(false);
  };

  const handleCreateNewOption = async () => {
    if (onCreateRequest) {
      onCreateRequest(search);
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      const valToCreate = search.trim() || (createNewLabel ? `New ${createNewLabel}` : "New Item");
      const success = await onAddNewValue(valToCreate);
      if (success) {
        setSearch(valToCreate);
        if (onChange) onChange(valToCreate);
        setShowList(false);
      }
      return;
    }
    if (allowCreateNew) {
      handleSelectOption(search.trim());
    }
  };

  const handleFocus = () => {
    setShowList(true);
    // If there's a value, clear the search so all options show up initially
    if (value) {
      setSearch('');
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowList(false);
      // Restore search to the current value
      setSearch(value || '');
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreateOption && search.trim() !== '') {
        handleCreateNewOption();
      } else if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      } else if (search.trim() !== '') {
        // Fallback for simple data entry if allowCreateNew is false but no options match
        onChange(search.trim());
        setShowList(false);
      }
    }
  };

  const isExactMatch = filteredOptions.some(option => (option || "").toLowerCase() === (search.trim()).toLowerCase());
  // Show create option if allowed, and either we are searching for something new OR the list is empty/just opened
  const showCreateOption = allowCreateNew && !isExactMatch;

  return (
    <div className="searchable-select" style={{ position: 'relative', width: '100%' }}>
      <div className="input-wrapper" style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
          <FaChevronDown />
        </div>

        {showList && (
          <ul className="searchable-list" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#ffffff', border: '2px solid #604BE8', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'block', borderRadius: '12px', marginTop: '5px', padding: 0, listStyle: 'none', overflowY: 'auto', maxHeight: '300px', boxSizing: 'border-box' }}>
            {showCreateOption && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreateNewOption();
                }}
                style={{
                  padding: '14px 16px',
                  background: '#eff2f9',
                  color: '#604BE8',
                  fontWeight: '800',
                  cursor: 'pointer',
                  borderBottom: filteredOptions.length > 0 ? '2px solid #C3CDE4' : 'none'
                }}
              >
                {search.trim()
                  ? `+ Add "${search.trim()}"`
                  : `+ Add New ${createNewLabel || 'Item'}`}
              </li>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const displayLabel = String(option || "");
                return (
                  <li
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(option);
                    }}
                    style={{
                      padding: '12px 16px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: '700',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {displayLabel}
                  </li>
                );
              })
            ) : (
              !showCreateOption && (
                <li className="no-options" style={{ padding: '20px', color: '#475569', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                  {options.length === 0 ? "Loading Data..." : "No items found"}
                </li>
              )
            )}
          </ul>
        )}
      </div>
      {/* Dynamic Spacer: Grows just enough to accommodate the list height without being a huge fixed block */}
      {showList && <div className="expansion-spacer" style={{ height: filteredOptions.length > 5 ? '280px' : filteredOptions.length > 0 ? `${filteredOptions.length * 50 + 60}px` : '100px' }}></div>}
    </div>
  );
};


const CreateCustomerPage = () => {
  const navigate = useNavigate();
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const { id } = useParams();
  const isEditMode = !!id;

  /* ────────────────────── STATE ────────────────────── */
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState("warning");

  // Core Fields
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedISDCode, setSelectedISDCode] = useState("+971");
  const [selectedWhatsappISDCode, setSelectedWhatsappISDCode] = useState("+971");
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false);
  const [showWhatsappISDCodeDropdown, setShowWhatsappISDCodeDropdown] = useState(false);
  const [hideWhatsappSync, setHideWhatsappSync] = useState(false);

  // Groups and Address
  const [customerGroups, setCustomerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: "",
    flat_villa_no: "",
    country: "",
  });

  // Dynamic DocType State
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [addressDoctypeFields, setAddressDoctypeFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});
  const [linkedDoctypeFields, setLinkedDoctypeFields] = useState({});
  const [tableOptions, setTableOptions] = useState({});

  // Branch and Permissions
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Address Structure Records
  const [addressStructure, setAddressStructure] = useState({ structure: { countries: {} }, linkedValues: {} });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalOnSave, setModalOnSave] = useState(null);

  const isdCodes = [
    { code: "+971", country: "UAE" },
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
  ];

  const digitLengths = { '+91': 10, '+1': 10, '+44': 10, '+971': 9, '+61': 9 };

  /* ────────────────────── DATA FETCHING ────────────────────── */

  useEffect(() => {
    const loadData = () => {
      if (!configLoading) {
        const url = baseUrl || "";
        Promise.all([
          fetchPermissions(url),
          fetchDoctype(url),
          fetchAddressDoctype(url),
          fetchCustomerGroups(url),
          fetchAddressStructure(url)
        ]).then(() => {
          if (isEditMode) fetchCustomerData(url, id);
        });
      }
    };
    
    loadData();

    const handleStorage = () => {
      loadData();
    };
    
    window.addEventListener('local-storage-change', handleStorage);
    return () => window.removeEventListener('local-storage-change', handleStorage);
  }, [configLoading, baseUrl, id]);

  const fetchCustomerData = async (url, customerId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/customers/${customerId}`, { headers: getHeaders() });
      const data = res.data;
      if (data) {
        setCustomerName(data.customer_name || "");
        const pMatch = data.phone_number ? data.phone_number.match(/^\+(\d{2,3})(\d+)$/) : null;
        if (pMatch) {
          setSelectedISDCode(`+${pMatch[1]}`);
          setPhoneNumber(pMatch[2]);
        } else {
          setPhoneNumber(data.phone_number || "");
        }
        const wMatch = data.whatsapp_number ? data.whatsapp_number.match(/^\+(\d{2,3})(\d+)$/) : null;
        if (wMatch) {
          setSelectedWhatsappISDCode(`+${wMatch[1]}`);
          setWhatsappNumber(wMatch[2]);
        } else {
          setWhatsappNumber(data.whatsapp_number || "");
        }
        setEmail(data.email || "");
        setSelectedGroup(data.customer_group || "");
        setSelectedCompanies(data.company_names || (data.company_name ? [data.company_name] : []));
        setSelectedBranches(data.branch_names || (data.branch_name ? [data.branch_name] : []));
        setDeliveryAddress(data.address_data || { country: "India" });
        const dyn = {};
        Object.keys(data).forEach(k => {
          if (!['customer_name', 'phone_number', 'whatsapp_number', 'email', 'customer_group', 'company_name', 'company_names', 'branch_name', 'branch_names', 'address_data', '_id', 'created_at', 'modified_at'].includes(k)) {
            dyn[k] = data[k];
          }
        });
        setDynamicValues(dyn);
      }
    } catch (e) {
      console.error(e);
      setWarningMessage("Failed to load customer data");
    } finally { setLoading(false); }
  };

  const fetchPermissions = async (url) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const role = userObj.role || userObj.UserType || "";
        const roleNorm = role.toLowerCase().replace(/[\s_]/g, '');
        const isGA = checkIsGlobalAdmin(userObj);
        const isCA = roleNorm === 'companyadmin' || roleNorm === 'admin' || roleNorm === 'manager';
        const isBA = roleNorm.includes('branch') || (!isGA && !isCA);
        setIsGroupAdmin(isGA); setIsCompanyAdmin(isCA || isGA); setIsBranchAdmin(isBA);
        if (isGA || isCA) fetchCompanies(url);
        const res = await axios.get(`${url}/api/role-permissions?role=${encodeURIComponent(role)}`, { headers: getHeaders() });
        const perms = res.data.permissions || [];
        const pagePerm = perms.find(p => p.pageId === 'create_customer');
        if (isGA || isCA || isBA) { setCanRead(true); setCanCreate(true); }
        else if (pagePerm) { setCanRead(pagePerm.canRead); setCanCreate(pagePerm.canCreate); }
      }
    } catch (e) { console.error(e); } finally { setPermsLoading(false); }
  };

  const fetchDoctype = async (url) => {
    try {
      const res = await axios.get(`${url}/api/doctypes/Customer`, { headers: getHeaders() });
      // Sort fields by their saved idx position so drag-drop order is respected
      const fields = (res.data.fields || []).slice().sort((a, b) => {
        if (a.idx !== undefined && b.idx !== undefined) return a.idx - b.idx;
        if (a.idx !== undefined) return -1;
        if (b.idx !== undefined) return 1;
        return 0;
      });
      setDoctypeFields(fields);
      fields.forEach(f => {
        if (f.link_doctype) {
          if (f.type === 'Table') fetchLinkedDoctype(f.link_doctype, f.id, url);
          fetchTableData(f);
        }
      });
    } catch (e) { console.error(e); }
  };

  const getFieldHidden = (fieldName, defaultValue = false) => {
    const docField = doctypeFields.find(f => f.id === fieldName);
    return docField ? docField.hidden : defaultValue;
  };

  const fetchLinkedDoctype = async (doctypeName, fieldId, url = baseUrl) => {
    try {
      const res = await axios.get(`${url}/api/doctypes/${doctypeName}`, { headers: getHeaders() });
      // Sort linked doctype fields by saved idx so nested drag-drop order is respected
      const fields = (res.data.fields || []).slice().sort((a, b) => {
        if (a.idx !== undefined && b.idx !== undefined) return a.idx - b.idx;
        if (a.idx !== undefined) return -1;
        if (b.idx !== undefined) return 1;
        return 0;
      });
      setLinkedDoctypeFields(prev => ({ ...prev, [fieldId]: fields }));
    } catch (e) { console.error(e); }
  };

  const fetchAddressDoctype = async (url) => {
    try {
      const res = await axios.get(`${url}/api/doctypes/Address Structure`, { headers: getHeaders() });
      setAddressDoctypeFields(res.data.fields || []);
    } catch (e) { console.error(e); }
  };

  const fetchTableData = async (field) => {
    if (!field.link_doctype || field.link_doctype === "Address Structure" || field.link_doctype.includes(',')) return;
    try {
      const doctypeApiMap = { "Customer Group": "/api/customer-groups" };
      const endpoint = doctypeApiMap[field.link_doctype] || `/api/${field.link_doctype.toLowerCase().replace(/\s+/g, '-')}`;
      const res = await axios.get(`${baseUrl}${endpoint}`, { headers: getHeaders() });
      
      let tableData = res.data || [];
      const activeBranch = (localStorage.getItem('active_branch') || 'All Branches').toLowerCase().trim();
      const activeComp = (localStorage.getItem('active_company') || 'All Companies').toLowerCase().trim();

      tableData = tableData.filter(item => {
        const compArray = Array.isArray(item.company_names) ? item.company_names : (item.company_names ? [item.company_names] : []);
        const compRaw = compArray.length > 0 ? compArray.join(",") : (item.company_name || item.company || "Global Access");
        const comp = String(compRaw).toLowerCase();
        const branchArray = Array.isArray(item.branch_names) ? item.branch_names : (item.branch_names ? [item.branch_names] : []);
        const branchRaw = branchArray.length > 0 ? branchArray : (item.branch_name || item.branch || "Global Access");
        const branches = Array.isArray(branchRaw) ? branchRaw : String(branchRaw).split(',').map(b => b.trim());

        const compMatch = activeComp === 'all companies' || activeComp === 'all' || comp.includes('all') || comp.includes('global') || comp.includes(activeComp);
        if (!compMatch) return false;

        const activeBranchClean = activeBranch.includes("|") ? activeBranch.split("|")[1].trim() : activeBranch;
        const branchMatch = activeBranch === 'all branches' || activeBranch === 'all' || branches.some(b => {
          const bl = b.toLowerCase().trim();
          return bl === activeBranch || bl === activeBranchClean || activeBranchClean === bl;
        });
        if (!branchMatch) return false;

        return true;
      });

      setTableOptions(prev => ({ ...prev, [field.id]: tableData }));
    } catch (e) { 
      if (e.response?.status !== 404) console.error(e); 
    }
  };

  const fetchCustomerGroups = async (url) => {
    try {
      const activeComp   = (localStorage.getItem('active_company') || '').trim();
      const activeBranch = (localStorage.getItem('active_branch')  || '').trim();

      const headers = {
        ...getHeaders(),
        ...(activeComp   ? { 'X-Company-Name': activeComp   } : {}),
        ...(activeBranch ? { 'X-Branch-Name':  activeBranch } : {}),
      };

      const res = await axios.get(`${url}/api/customer-groups`, { headers });
      // Backend already filters by company + branch
      setCustomerGroups(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAddressStructure = async (url) => {
    try {
      const res = await axios.get(`${url}/api/address-structures`, { headers: getHeaders() });
      setAddressStructure(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchCompanies = async (url) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      
      let comps = [];
      if (userObj.companies && userObj.companies.length > 0) {
        comps = userObj.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
      } else if (userObj.company_name || userObj.company) {
        comps = [userObj.company_name || userObj.company];
      } else {
        const res = await axios.get(`${url}/api/company-details`, { headers: getHeaders() });
        const details = res.data.companyDetails || [];
        comps = details.map(d => d.restaurantName).filter(n => n);
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : ['POS 8'];
      setCompanyOptions(finalComps);

      // Auto select companies
      const activeContext = localStorage.getItem('active_company');
      if (selectedCompanies.length === 0 && finalComps.length > 0) {
        if (activeContext && activeContext !== 'All' && finalComps.includes(activeContext)) {
          setSelectedCompanies([activeContext]);
        } else if (activeContext === 'All') {
          setSelectedCompanies(finalComps);
        } else if (!activeContext && finalComps.length === 1) {
          setSelectedCompanies([finalComps[0]]);
        }
      }

      // Fetch branches aggressively
      if (finalComps.length > 0) {
        const branchPromises = finalComps.map(comp => 
          axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: { ...getHeaders(), "X-Company-Name": comp } })
            .then(res => ({ comp, data: res.data }))
        );
        const results = await Promise.all(branchPromises);
        const newMap = {};
        const allBranches = [];
        results.forEach(res => {
           const branches = res.data.map(b => typeof b === 'string' ? b : b.branch_name || b.branch || b.name || '').filter(b => b);
           newMap[res.comp] = branches;
           allBranches.push(...branches);
        });
        setCompanyBranchesMap(newMap);
        setAvailableBranches([...new Set(allBranches)]);
      }
    } catch (e) { console.error(e); }
  };


  const handleCustomizationRefresh = () => {
    const url = baseUrl || "";
    fetchDoctype(url);
    fetchAddressDoctype(url);
    fetchCustomerGroups(url);
    fetchAddressStructure(url);
  };

  /* ────────────────────── HANDLERS ────────────────────── */

  const isMandatory = (id) => doctypeFields.find(f => f.id === id)?.mandatory || false;

  const handleGroupNameChange = (name) => {
    const group = customerGroups.find(g => g.group_name === name);
    const newGroupId = group ? group._id : "";
    setSelectedGroup(newGroupId);
    if (group) {
      const newDynamicValues = { ...dynamicValues };
      const excludeKeys = ['_id', 'group_name', 'created_at', 'modified_at', 'tenant_id', 'company', 'company_name', 'company_names', 'company_id', 'branch', 'branch_name', 'branch_names', 'branch_id', 'createdBy'];
      Object.keys(group).forEach(key => {
        if (!excludeKeys.includes(key)) {
          newDynamicValues[`customer_group_${key}`] = group[key];
        }
      });
      setDynamicValues(newDynamicValues);
    }
  };

  const handleCreateNewGroup = async (newName) => {
    if (!newName.trim()) return false;
    try {
      const activeBranchLoc = (localStorage.getItem('active_branch') || '').trim();
      const activeCompLoc = (localStorage.getItem('active_company') || '').trim();
      const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
      const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';

      const finCompanies = selectedCompanies.length > 0 ? selectedCompanies : (isSpecComp ? [activeCompLoc] : []);
      const finBranches = selectedBranches.length > 0 ? selectedBranches : (isSpecBranch ? [activeBranchLoc] : []);

      const payload = {
        group_name: newName,
        company_name: finCompanies[0] || "",
        company_names: finCompanies,
        branch_name: finBranches[0] || "",
        branch_names: finBranches
      };

      const res = await axios.post(`${baseUrl}/api/customer-groups`, payload, { headers: getHeaders() });
      if (res.status === 201 || res.status === 200) {
        const newGroup = { _id: res.data._id || newName, group_name: newName };
        setCustomerGroups(prev => [newGroup, ...prev]);
        setSelectedGroup(newGroup._id);
        return true;
      }
    } catch (e) {
      console.error(e);
      setWarningMessage(e.response?.data?.error || "Failed to create customer group");
      setWarningType("error");
      return false;
    }
    return false;
  };

  const handlePhoneNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (v.length <= (digitLengths[selectedISDCode] || 10)) setPhoneNumber(v);
  };

  const handleWhatsappNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (v.length <= (digitLengths[selectedWhatsappISDCode] || 10)) setWhatsappNumber(v);
  };

  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewAddressValue = async (field, newValue) => {
    const country = deliveryAddress.country;
    if (!country) return false;
    let parent = "";
    const fieldNum = parseInt(field.replace('field', ''));
    if (fieldNum > 1) {
      const parentKey = `field${fieldNum - 1}`;
      parent = deliveryAddress[parentKey] || "";
    }
    try {
      const res = await axios.post(`${baseUrl}/api/add-address-value`, { country, field, value: newValue, parent_value: parent || undefined }, { headers: getHeaders() });
      if (res.status === 200) { await fetchAddressStructure(baseUrl); return true; }
    } catch (e) { return false; }
    return false;
  };

  const handleCreateCustomer = async () => {
    if (!canCreate) return;

    // Dynamic Validation based on DocType Metadata
    if (isMandatory('customer_name') && !customerName.trim()) {
      setWarningMessage("Customer Name is required");
      setWarningType("warning");
      return;
    }

    if (isMandatory('phone_number') && !phoneNumber.trim()) {
      setWarningMessage("Phone Number is required");
      setWarningType("warning");
      return;
    }

    if (isMandatory('email') && !email.trim()) {
      setWarningMessage("Email Address is required");
      setWarningType("warning");
      return;
    }

    if (isMandatory('customer_group') && !selectedGroup) {
      setWarningMessage("Customer Group is required");
      setWarningType("warning");
      return;
    }

    // Check dynamic fields
    for (const field of doctypeFields) {
      if (!field.is_default && field.mandatory && !field.hidden) {
        // Special case for Address Structure linked fields
        if (field.link_doctype === 'Address Structure' || ['address', 'adress', 'address_data'].includes(field.id)) {
          if (!deliveryAddress.country) {
            setWarningMessage(`${field.label} is required`);
            setWarningType("warning");
            return;
          }
          // We will check nested fields next
        } else {
          const val = dynamicValues[field.id] || dynamicValues[`customer_group_${field.id}`];
          if (!val) {
            setWarningMessage(`${field.label} is required`);
            setWarningType("warning");
            return;
          }
        }
      }

      // Deep Validation for Table Fields (whether default or not)
      if (field.type === 'Table' && !field.hidden) {
        const nestedFields = linkedDoctypeFields[field.id] || [];
        for (const lf of nestedFields) {
          if (lf.mandatory && !lf.hidden) {
            let nestedVal;
            if (['address', 'address_data'].includes(field.id)) {
              nestedVal = lf.id === 'country_name' ? deliveryAddress.country : deliveryAddress[lf.id];
            } else {
              nestedVal = dynamicValues[`${field.id}_${lf.id}`];
            }

            // If the main table field is mandatory OR if the user has selected/filled something for the main table
            const isMainTableActive = field.mandatory || !!dynamicValues[field.id] || (field.id === 'customer_group' && selectedGroup) || (['address', 'address_data'].includes(field.id) && deliveryAddress.country);
            
            if (isMainTableActive && !nestedVal) {
              setWarningMessage(`${field.label} -> ${lf.label} is required`);
              setWarningType("warning");
              return;
            }
          }
        }
      }
    }

    let finalBranches = selectedBranches;
    let finalCompanies = selectedCompanies;
    const activeBranchLoc = (localStorage.getItem('active_branch') || 'All Branches').trim();
    const activeCompLoc = (localStorage.getItem('active_company') || 'All Companies').trim();
    const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
    const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';

    // Always auto-assign from active branch context (for ALL roles including company admins filtering to a branch)
    if (isSpecBranch && finalBranches.length === 0) {
      finalBranches = [activeBranchLoc];
    }
    if (isSpecComp && finalCompanies.length === 0) {
      finalCompanies = [activeCompLoc];
    }

    // If a specific branch is active, skip company/branch selection modal entirely
    // Only show modal when user is a group/company admin with ALL branches view
    const showCompanyAssignLocal = !isSpecBranch && (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 1;
    const showBranchAssignLocal = !isSpecBranch && (isGroupAdmin || isCompanyAdmin) && finalCompanies.length > 0 && availableBranches.length > 0;

    // If modal is not open, check if we need to show it
    if (!showAssignmentModal) {
      if (showCompanyAssignLocal || showBranchAssignLocal) {
        setShowAssignmentModal(true);
        return;
      }
    } else {
      // If modal is open and user clicked Confirm & Save, ensure company is selected
      if (finalCompanies.length === 0 && showCompanyAssignLocal) {
        setWarningMessage("Company selection is required");
        setWarningType("warning");
        return;
      }
      // Branch is explicitly optional, so we do NOT block saving here!
    }

    const payload = {
      customer_name: customerName,
      phone_number: `${selectedISDCode}${phoneNumber}`,
      whatsapp_number: whatsappNumber ? `${selectedWhatsappISDCode}${whatsappNumber}` : "",
      email: email,
      customer_group: selectedGroup,
      branch_name: finalBranches[0] || "",
      branch_names: finalBranches,
      company_name: finalCompanies[0] || "",
      company_names: finalCompanies,
      address_data: deliveryAddress,
      ...dynamicValues
    };

    try {
      setLoading(true);
      if (selectedGroup) {
        const groupUpdateData = { 
          group_name: customerGroups.find(g => g._id === selectedGroup)?.group_name,
          company_names: finalCompanies,
          company_name: finalCompanies[0] || "",
          branch_names: finalBranches,
          branch_name: finalBranches[0] || ""
        };
        let hasGroupUpdates = true;
        Object.keys(dynamicValues).forEach(key => {
          if (key.startsWith('customer_group_')) {
            const fieldId = key.replace('customer_group_', '');
            groupUpdateData[fieldId] = dynamicValues[key];
          }
        });
        await axios.put(`${baseUrl}/api/customer-groups/${selectedGroup}`, groupUpdateData, { headers: getHeaders() });
      }

      if (isEditMode) {
        await axios.put(`${baseUrl}/api/customers/${id}`, payload, { headers: getHeaders() });
        setWarningMessage("Customer updated successfully!");
      } else {
        await axios.post(`${baseUrl}/api/customers`, payload, { headers: getHeaders() });
        setWarningMessage("Customer created successfully!");
      }
      setWarningType("success");
      if (isEditMode) setTimeout(() => navigate("/customers"), 1500);
    } catch (e) {
      setWarningMessage(e.response?.data?.error || "Error creating customer");
      setWarningType("warning");
    } finally { setLoading(false); setShowAssignmentModal(false); }
  };

  const countryAddressHierarchy = {
    "Afghanistan": ["Province", "District", "Area"],
    "Albania": ["County", "Municipality", "Area"],
    "Algeria": ["Province", "District", "Area"],
    "Andorra": ["Parish", "Area", "N/A"],
    "Angola": ["Province", "Municipality", "Area"],
    "Antigua and Barbuda": ["Parish", "Area", "N/A"],
    "Argentina": ["Province", "Department", "Municipality"],
    "Armenia": ["Province", "Community", "Area"],
    "Australia": ["State/Territory", "Local Government Area", "Suburb"],
    "Austria": ["State", "District", "Municipality"],
    "Azerbaijan": ["Economic Region", "District", "Area"],
    "Bahamas": ["District", "Area", "N/A"],
    "Bahrain": ["Governorate", "Municipality", "Area"],
    "Bangladesh": ["Division", "District", "Upazila"],
    "Barbados": ["Parish", "Area", "N/A"],
    "Belarus": ["Region", "District", "Area"],
    "Belgium": ["Region", "Province", "Municipality"],
    "Belize": ["District", "Town", "Area"],
    "Benin": ["Department", "Commune", "Area"],
    "Bhutan": ["District", "Gewog", "Village"],
    "Bolivia": ["Department", "Province", "Municipality"],
    "Bosnia and Herzegovina": ["Entity", "Canton", "Municipality"],
    "Botswana": ["District", "Sub-District", "Area"],
    "Brazil": ["State", "Municipality", "Neighborhood"],
    "Brunei": ["District", "Mukim", "Village"],
    "Bulgaria": ["Province", "Municipality", "Area"],
    "Burkina Faso": ["Region", "Province", "Commune"],
    "Burundi": ["Province", "Commune", "Area"],
    "Cambodia": ["Province", "District", "Commune"],
    "Cameroon": ["Region", "Division", "Sub-Division"],
    "Canada": ["Province/Territory", "Municipality", "Area"],
    "Cape Verde": ["Municipality", "Area", "N/A"],
    "Central African Republic": ["Prefecture", "Sub-Prefecture", "Area"],
    "Chad": ["Province", "Department", "Area"],
    "Chile": ["Region", "Province", "Commune"],
    "China": ["Province", "Prefecture", "County"],
    "Colombia": ["Department", "Municipality", "Area"],
    "Comoros": ["Island", "Prefecture", "Area"],
    "Costa Rica": ["Province", "Canton", "District"],
    "Croatia": ["County", "Municipality", "Area"],
    "Cuba": ["Province", "Municipality", "Area"],
    "Cyprus": ["District", "Municipality", "Area"],
    "Czech Republic": ["Region", "District", "Municipality"],
    "Denmark": ["Region", "Municipality", "Area"],
    "Djibouti": ["Region", "District", "Area"],
    "Dominica": ["Parish", "Area", "N/A"],
    "Dominican Republic": ["Province", "Municipality", "Area"],
    "Ecuador": ["Province", "Canton", "Parish"],
    "Egypt": ["Governorate", "District", "Area"],
    "El Salvador": ["Department", "Municipality", "Area"],
    "Equatorial Guinea": ["Province", "District", "Area"],
    "Eritrea": ["Region", "Sub-Region", "Area"],
    "Estonia": ["County", "Municipality", "Area"],
    "Eswatini": ["Region", "Inkhundla", "Area"],
    "Ethiopia": ["Region", "Zone", "Woreda"],
    "Fiji": ["Division", "Province", "District"],
    "Finland": ["Region", "Municipality", "Area"],
    "France": ["Region", "Department", "Commune"],
    "Gabon": ["Province", "Department", "Area"],
    "Gambia": ["Region", "District", "Area"],
    "Georgia": ["Region", "Municipality", "Area"],
    "Germany": ["State", "District", "Municipality"],
    "Ghana": ["Region", "District", "Area"],
    "Greece": ["Region", "Municipality", "Area"],
    "Grenada": ["Parish", "Area", "N/A"],
    "Guatemala": ["Department", "Municipality", "Area"],
    "Guinea": ["Region", "Prefecture", "Sub-Prefecture"],
    "Guinea-Bissau": ["Region", "Sector", "Area"],
    "Guyana": ["Region", "Neighborhood Council", "Area"],
    "Haiti": ["Department", "Arrondissement", "Commune"],
    "Honduras": ["Department", "Municipality", "Area"],
    "Hungary": ["County", "District", "Municipality"],
    "Iceland": ["Region", "Municipality", "Area"],
    "India": ["State/UT", "District", "Taluk"],
    "Indonesia": ["Province", "Regency/City", "District"],
    "Iran": ["Province", "County", "District"],
    "Iraq": ["Governorate", "District", "Area"],
    "Ireland": ["County", "Municipality", "Area"],
    "Israel": ["District", "Sub-District", "Area"],
    "Italy": ["Region", "Province", "Municipality"],
    "Jamaica": ["Parish", "Area", "N/A"],
    "Japan": ["Prefecture", "City/Ward", "District"],
    "Jordan": ["Governorate", "District", "Area"],
    "Kazakhstan": ["Region", "District", "Area"],
    "Kenya": ["County", "Sub-County", "Ward"],
    "Kiribati": ["Island", "Council", "Area"],
    "Kuwait": ["Governorate", "Area", "Block"],
    "Kyrgyzstan": ["Region", "District", "Area"],
    "Laos": ["Province", "District", "Village"],
    "Latvia": ["Municipality", "Area", "N/A"],
    "Lebanon": ["Governorate", "District", "Area"],
    "Lesotho": ["District", "Community Council", "Area"],
    "Liberia": ["County", "District", "Area"],
    "Libya": ["District", "Municipality", "Area"],
    "Liechtenstein": ["Municipality", "Area", "N/A"],
    "Lithuania": ["County", "Municipality", "Area"],
    "Luxembourg": ["Canton", "Commune", "Area"],
    "Madagascar": ["Region", "District", "Commune"],
    "Malawi": ["Region", "District", "Area"],
    "Malaysia": ["State", "District", "Mukim"],
    "Maldives": ["Atoll", "Island", "Area"],
    "Mali": ["Region", "Cercle", "Commune"],
    "Malta": ["Region", "Local Council", "Area"],
    "Marshall Islands": ["Atoll", "Municipality", "Area"],
    "Mauritania": ["Region", "Department", "Area"],
    "Mauritius": ["District", "Village", "Area"],
    "Mexico": ["State", "Municipality", "Locality"],
    "Micronesia": ["State", "Municipality", "Area"],
    "Moldova": ["District", "Commune", "Area"],
    "Monaco": ["Commune", "Area", "N/A"],
    "Mongolia": ["Province", "District", "Bag"],
    "Montenegro": ["Municipality", "Area", "N/A"],
    "Morocco": ["Region", "Province", "Commune"],
    "Mozambique": ["Province", "District", "Area"],
    "Myanmar": ["Region/State", "District", "Township"],
    "Namibia": ["Region", "Constituency", "Area"],
    "Nauru": ["District", "Area", "N/A"],
    "Nepal": ["Province", "District", "Municipality"],
    "Netherlands": ["Province", "Municipality", "Area"],
    "New Zealand": ["Region", "District", "Area"],
    "Nicaragua": ["Department", "Municipality", "Area"],
    "Niger": ["Region", "Department", "Commune"],
    "Nigeria": ["State", "Local Government Area", "Ward"],
    "North Korea": ["Province", "County", "Area"],
    "North Macedonia": ["Municipality", "Area", "N/A"],
    "Norway": ["County", "Municipality", "Area"],
    "Oman": ["Governorate", "Wilayat", "Area"],
    "Pakistan": ["Province", "Division", "District"],
    "Palau": ["State", "Area", "N/A"],
    "Panama": ["Province", "District", "Corregimiento"],
    "Papua New Guinea": ["Province", "District", "Area"],
    "Paraguay": ["Department", "District", "Area"],
    "Peru": ["Region", "Province", "District"],
    "Philippines": ["Region", "Province", "City/Municipality"],
    "Poland": ["Voivodeship", "County", "Gmina"],
    "Portugal": ["District", "Municipality", "Parish"],
    "Qatar": ["Municipality", "Zone", "Area"],
    "Romania": ["County", "Municipality", "Area"],
    "Russia": ["Federal Subject", "District", "Municipality"],
    "Rwanda": ["Province", "District", "Sector"],
    "Saint Lucia": ["District", "Area", "N/A"],
    "Samoa": ["District", "Village", "Area"],
    "San Marino": ["Municipality", "Area", "N/A"],
    "Saudi Arabia": ["Province", "Governorate", "Area"],
    "Senegal": ["Region", "Department", "Arrondissement"],
    "Serbia": ["District", "Municipality", "Area"],
    "Seychelles": ["District", "Area", "N/A"],
    "Sierra Leone": ["Province", "District", "Area"],
    "Singapore": ["City-State", "N/A", "N/A"],
    "Slovakia": ["Region", "District", "Municipality"],
    "Slovenia": ["Statistical Region", "Municipality", "Area"],
    "Solomon Islands": ["Province", "Ward", "Area"],
    "Somalia": ["State", "District", "Area"],
    "South Africa": ["Province", "District", "Municipality"],
    "South Korea": ["Province", "City/County", "District"],
    "South Sudan": ["State", "County", "Payam"],
    "Spain": ["Autonomous Community", "Province", "Municipality"],
    "Sri Lanka": ["Province", "District", "Division"],
    "Sudan": ["State", "Locality", "Area"],
    "Suriname": ["District", "Resort", "Area"],
    "Sweden": ["County", "Municipality", "Area"],
    "Switzerland": ["Canton", "Municipality", "Area"],
    "Syria": ["Governorate", "District", "Area"],
    "Taiwan": ["County/City", "District", "Area"],
    "Tajikistan": ["Region", "District", "Area"],
    "Tanzania": ["Region", "District", "Ward"],
    "Thailand": ["Province", "District", "Sub-District"],
    "Togo": ["Region", "Prefecture", "Canton"],
    "Tonga": ["Division", "District", "Area"],
    "Trinidad and Tobago": ["Region", "Municipality", "Area"],
    "Tunisia": ["Governorate", "Delegation", "Sector"],
    "Turkey": ["Province", "District", "Neighborhood"],
    "Turkmenistan": ["Province", "District", "Area"],
    "Tuvalu": ["Island", "Area", "N/A"],
    "Uganda": ["Region", "District", "Sub-County"],
    "Ukraine": ["Oblast", "Raion", "Hromada"],
    "United Arab Emirates": ["Emirate", "City", "Area"],
    "United Kingdom": ["Country", "County", "Borough"],
    "United States": ["State", "County", "City"],
    "Uruguay": ["Department", "Municipality", "Area"],
    "Uzbekistan": ["Region", "District", "Area"],
    "Vanuatu": ["Province", "Municipality", "Area"],
    "Vatican City": ["None", "N/A", "N/A"],
    "Venezuela": ["State", "Municipality", "Parish"],
    "Vietnam": ["Province", "District", "Commune"],
    "Yemen": ["Governorate", "District", "Area"],
    "Zambia": ["Province", "District", "Area"],
    "Zimbabwe": ["Province", "District", "Area"]
  };

  const sortedAddressFieldIds = addressDoctypeFields.length > 0
    ? addressDoctypeFields
      .map(f => f.id)
      .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
      .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
      .sort((a, b) => parseInt(a.replace('field', '')) - parseInt(b.replace('field', '')))
    : ['field1', 'field2', 'field3'];

  const getAddressLabels = (country) => {
    if (!country) return {};
    const hierarchyLabels = countryAddressHierarchy[country] || [];
    const countryData = addressStructure.structure?.countries?.[country];
    const labels = {};

    sortedAddressFieldIds.forEach((fid, idx) => {
      if (countryData?.[fid]?.label) {
        labels[fid] = countryData[fid].label;
      } else if (hierarchyLabels[idx] && hierarchyLabels[idx] !== "N/A") {
        labels[fid] = hierarchyLabels[idx];
      } else {
        labels[fid] = "";
      }
    });
    return labels;
  };

  const getOptionsForField = (field, country, parent = null) => {
    const data = addressStructure.structure?.countries?.[country];
    if (!data) return [];
    let global = data[field]?.values || [];
    let linked = [];
    if (parent && addressStructure.linkedValues?.[country]?.[parent]) {
      linked = addressStructure.linkedValues[country][parent][field] || [];
    }
    return [...new Set([...linked, ...global])].sort();
  };

  const getDisplayValueForTable = (opt, doctype) => {
    if (typeof opt === 'string') return opt;
    if (doctype === 'Customer Group') return opt.group_name;
    return opt.name || opt.label || opt.id || "";
  };

  const getSectionTheme = (index) => {
    const themes = [
      { icon: <FaUsers />, class: 'theme-blue' },
      { icon: <FaDatabase />, class: 'theme-green' },
      { icon: <FaMapMarkerAlt />, class: 'theme-orange' },
      { icon: <FaIdCard />, class: 'theme-purple' },
      { icon: <FaAddressBook />, class: 'theme-teal' },
      { icon: <FaFileAlt />, class: 'theme-pink' },
      { icon: <FaStar />, class: 'theme-indigo' }
    ];
    return themes[index % themes.length];
  };

  const labels = getAddressLabels(deliveryAddress.country);
  const countryList = Object.keys(addressStructure.structure?.countries || {}).sort();

  if (permsLoading) return <div className="create-customer-container main-customer-page"><div style={{ padding: '50px', fontSize: '18px', fontWeight: '600', color: '#64748b' }}>Loading...</div></div>;

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const showCompanyAssign = (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 1;
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  // Show branch section for both group and company admins, unless they are locked to a specific branch context
  const showBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && selectedCompanies.length > 0 && availableBranches.length > 0;

  return (
    <div className="create-customer-container main-customer-page">
      <div className="customer-header-section">
        <div className="header-left">
          <button onClick={() => navigate("/admin")} className="header-back-btn">
            <FaArrowLeft /> Back to Admin
          </button>
        </div>

        <div className="header-center">
          <h1>{isEditMode ? "Edit Customer" : "Create Customer"}</h1>
        </div>

        <div className="header-right">
          <div className="header-actions">
            {showCompanyAssign && (
              <button 
                type="button"
                className="customize-btn" 
                onClick={() => setShowAssignmentModal(true)} 
                style={{ 
                  background: '#eff2f9', 
                  color: '#604BE8', 
                  border: '1.5px solid #C3CDE4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 24px',
                  height: '48px',
                  minWidth: '140px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(96, 75, 232, 0.1)'
                }}
              >
                <FaUsers /> Company
              </button>
            )}

            {showBranchAssign && (
              <button 
                type="button"
                className="customize-btn branch-btn" 
                onClick={() => setShowAssignmentModal(true)}
                style={{
                  background: '#fff8f0',
                  color: '#FF9F04',
                  border: '1.5px solid #FDD36D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 24px',
                  height: '48px',
                  minWidth: '140px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(255, 159, 4, 0.1)'
                }}
              >
                <FaMapMarkerAlt /> Branches
              </button>
            )}

            {checkIsAdmin(userObj) && (
              <button 
                type="button"
                className="customize-btn" 
                onClick={() => setShowCustomizeModal(true)}
                style={{
                  background: '#06D6A0',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 24px',
                  height: '48px',
                  minWidth: '140px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(6, 214, 160, 0.2)'
                }}
              >
                <FaCogs /> Customize
              </button>
            )}
            <button className="save-btn" onClick={handleCreateCustomer} disabled={loading}>
              {loading ? "Saving..." : (isEditMode ? <><FaSave /> Update</> : <><FaPlus /> Save</>)}
            </button>
          </div>
        </div>
      </div>
      <div className="header-divider"></div>

      {warningMessage && (
        <div className="premium-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="premium-modal-box" style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '40px 32px',
            width: '90%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glowing accent */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: warningType === 'success' ? 'radial-gradient(circle, rgba(6, 214, 160, 0.15) 0%, rgba(255,255,255,0) 70%)' : 'radial-gradient(circle, rgba(255, 159, 4, 0.15) 0%, rgba(255,255,255,0) 70%)',
              zIndex: 0,
              pointerEvents: 'none'
            }}></div>

            {/* Icon Container */}
            <div className="premium-modal-icon" style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: warningType === 'success' ? '#ecfdf5' : '#fffbeb',
              color: warningType === 'success' ? '#06D6A0' : '#FF9F04',
              border: `2px solid ${warningType === 'success' ? '#a7f3d0' : '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              marginBottom: '24px',
              boxShadow: warningType === 'success' ? '0 10px 25px -5px rgba(6, 214, 160, 0.2)' : '0 10px 25px -5px rgba(255, 159, 4, 0.2)',
              zIndex: 1,
              animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              {warningType === 'success' ? <FaUserCheck /> : <FaExclamationTriangle />}
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#1e293b',
              margin: '0 0 12px 0',
              zIndex: 1,
              fontFamily: `'Gilroy', 'Inter', sans-serif`
            }}>
              {warningType === 'success' ? "Success" : "Notice"}
            </h3>

            {/* Message */}
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              lineHeight: '1.6',
              margin: '0 0 32px 0',
              zIndex: 1,
              fontWeight: '500'
            }}>
              {warningMessage}
            </p>

            {/* Action Buttons */}
            <div className="premium-modal-actions" style={{
              display: 'flex',
              gap: '16px',
              width: '100%',
              zIndex: 1
            }}>
              <button 
                type="button"
                className="premium-btn-cancel" 
                onClick={() => setWarningMessage("")}
                style={{
                  flex: 1,
                  height: '48px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: `'Gilroy', 'Inter', sans-serif`
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="premium-btn-ok" 
                onClick={() => {
                  setWarningMessage("");
                  if (warningType === 'success') navigate("/customers");
                }} 
                style={{
                  flex: 1,
                  height: '48px',
                  background: warningType === 'success' ? '#06D6A0' : '#604BE8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: warningType === 'success' ? '0 10px 20px -5px rgba(6, 214, 160, 0.3)' : '0 10px 20px -5px rgba(96, 75, 232, 0.3)',
                  transition: 'all 0.2s ease',
                  fontFamily: `'Gilroy', 'Inter', sans-serif`
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = warningType === 'success' ? '0 12px 25px -5px rgba(6, 214, 160, 0.4)' : '0 12px 25px -5px rgba(96, 75, 232, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = warningType === 'success' ? '0 10px 20px -5px rgba(6, 214, 160, 0.3)' : '0 10px 20px -5px rgba(96, 75, 232, 0.3)'; }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="add-modal-overlay">
          <div className="add-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span>Customer Assignments</span>
              <button className="close-modal-btn" onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body" style={{ marginTop: '20px' }}>
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#604BE8' }}><FaUsers /> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff2f9', borderRadius: '12px', border: '1.5px solid #C3CDE4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={(e) => { setSelectedCompanies(prev => e.target.checked ? [...prev, comp] : prev.filter(c => c !== comp)); }} style={{ width: '18px', height: '18px', accentColor: '#604BE8' }} />
                        {comp}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {showBranchAssign && (
                <div className="assignment-card">
                  <h4 style={{ color: '#06D6A0' }}><FaMapMarkerAlt /> Select Branch</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branch, idx) => (
                      <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input type="checkbox" checked={selectedBranches.includes(branch)} onChange={(e) => { setSelectedBranches(prev => e.target.checked ? [...prev, branch] : prev.filter(b => b !== branch)); }} style={{ width: '18px', height: '18px', accentColor: '#06D6A0' }} />
                        {branch}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={handleCreateCustomer} disabled={loading || selectedCompanies.length === 0}>
                {loading ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="customer-scroll-body">
        <div className="form-sections-wrapper">
          {(() => {
            const sections = [];
            let currentSection = null;

            doctypeFields.forEach((f) => {
              if (f.type === 'Section Break') {
                if (currentSection) sections.push(currentSection);
                currentSection = { label: f.label, fields: [], id: f.id };
              } else {
                if (!currentSection) {
                  currentSection = { label: "General Information", fields: [], id: 'initial' };
                }
                currentSection.fields.push(f);
              }
            });
            if (currentSection) sections.push(currentSection);

            return sections.map((section, sidx) => {
              const theme = getSectionTheme(sidx);
              const visibleFields = section.fields.filter(f => !f.hidden);
              if (visibleFields.length === 0) return null;

              return (
                <div className={`form-section-card ${theme.class}`} key={section.id || sidx}>
                  <div className="section-header">
                    <h2>{section.label === "General Information" ? "Customer Details :" : `${section.label} :`}</h2>
                  </div>
                  <div className="form-grid">
                    {section.fields.map(f => {
                      if (f.hidden) return null;

                      // SPECIAL HANDLING FOR CORE FIELDS
                      if (f.id === 'customer_name') {
                        return (
                          <div className="form-group" key={f.id}>
                            <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="" />
                            <span className="sub-label">First name</span>
                          </div>
                        );
                      }
                      if (f.id === 'email') {
                        return (
                          <div className="form-group" key={f.id}>
                            <label>{f.label === 'Email' ? 'Email Id' : f.label} {f.mandatory && <span className="required">*</span>}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" />
                            <span className="sub-label">example@exmaple.com</span>
                          </div>
                        );
                      }
                      if (f.id === 'phone_number') {
                        return (
                          <div className="form-group" key={f.id}>
                            <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                            <div className="phone-group">
                              <button className="isd-btn" type="button" onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}>
                                {selectedISDCode === '+91' ? 'IN +91' : selectedISDCode === '+971' ? 'UAE +971' : selectedISDCode === '+1' ? 'US +1' : selectedISDCode === '+44' ? 'UK +44' : selectedISDCode === '+61' ? 'AU +61' : selectedISDCode} <FaChevronDown style={{ fontSize: '11px', marginLeft: '4px', color: '#64748b' }} />
                              </button>
                              {showISDCodeDropdown && (
                                <ul className="isd-list">
                                  {isdCodes.map(c => <li key={c.code} onClick={() => { setSelectedISDCode(c.code); setShowISDCodeDropdown(false); }}>{c.code} ({c.country})</li>)}
                                </ul>
                              )}
                              <input type="text" value={phoneNumber} onChange={handlePhoneNumberChange} placeholder="" />
                            </div>
                            {showISDCodeDropdown && <div className="expansion-spacer" style={{ height: '180px' }}></div>}
                            {phoneNumber && !hideWhatsappSync && !getFieldHidden('whatsapp_number') && (
                              <div style={{ fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#eff6ff', borderRadius: '10px', width: 'fit-content', border: '1px solid #dbeafe' }}>
                                <span style={{ color: '#1e40af', fontWeight: '600' }}>Same for WhatsApp?</span>
                                <button type="button" onClick={() => { setWhatsappNumber(phoneNumber); setSelectedWhatsappISDCode(selectedISDCode); setHideWhatsappSync(true); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '2px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Yes</button>
                                <button type="button" onClick={() => setHideWhatsappSync(true)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '2px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>No</button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      if (f.id === 'whatsapp_number') {
                        return (
                          <div className="form-group" key={f.id}>
                            <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                            <div className="phone-group">
                              <button className="isd-btn" type="button" onClick={() => setShowWhatsappISDCodeDropdown(!showWhatsappISDCodeDropdown)}>
                                {selectedWhatsappISDCode === '+91' ? 'IN +91' : selectedWhatsappISDCode === '+971' ? 'UAE +971' : selectedWhatsappISDCode === '+1' ? 'US +1' : selectedWhatsappISDCode === '+44' ? 'UK +44' : selectedWhatsappISDCode === '+61' ? 'AU +61' : selectedWhatsappISDCode} <FaChevronDown style={{ fontSize: '11px', marginLeft: '4px', color: '#64748b' }} />
                              </button>
                              {showWhatsappISDCodeDropdown && (
                                <ul className="isd-list">
                                  {isdCodes.map(c => <li key={c.code} onClick={() => { setSelectedWhatsappISDCode(c.code); setShowWhatsappISDCodeDropdown(false); }}>{c.code} ({c.country})</li>)}
                                </ul>
                              )}
                              <input type="text" value={whatsappNumber} onChange={handleWhatsappNumberChange} placeholder="" />
                            </div>
                            {showWhatsappISDCodeDropdown && <div className="expansion-spacer" style={{ height: '180px' }}></div>}
                          </div>
                        );
                      }

                      // TABLE FIELDS (Dynamic rendering of linked DocTypes)
                      if (f.type === 'Table') {
                        // Special handling for Address Structure
                        if (f.link_doctype === 'Address Structure' || ['address_data', 'adress_', 'address', 'adress'].includes(f.id)) {
                          return (
                            <React.Fragment key={f.id}>
                              {addressDoctypeFields.map((af) => {
                                if (af.hidden) return null;

                                // 1. Country Name
                                if (af.id === 'country_name') {
                                  return (
                                    <div className="form-group" key={af.id}>
                                      <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                      <SearchableSelect
                                        options={countryList}
                                        value={deliveryAddress.country || ""}
                                        onChange={(v) => handleDeliveryAddressChange("country", v)}
                                        placeholder={`Select ${af.label}`}
                                      />
                                    </div>
                                  );
                                }

                                // 2. Core Text Fields (Flat/Villa, Building)
                                if (af.id === 'flat_villa_no' || af.id === 'building_name') {
                                  return (
                                    <div className="form-group" key={af.id}>
                                      <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                      <input 
                                        type="text" 
                                        value={deliveryAddress[af.id] || ""} 
                                        onChange={(e) => handleDeliveryAddressChange(af.id, e.target.value)} 
                                        placeholder={`Enter ${af.label}`} 
                                      />
                                    </div>
                                  );
                                }

                                // 3. Dynamic Hierarchy Fields (field1_label, field2_label, etc.)
                                if (af.id.toLowerCase().includes('field') && af.id.toLowerCase().includes('label')) {
                                  if (!deliveryAddress.country) return null;
                                  const fid = af.id.toLowerCase().replace('_label', '').replace('label', '').replace('_', '');
                                  const label = labels[fid];
                                  if (!label || ["N/A", "None", ""].includes(label) || label.toLowerCase().includes("label")) return null;

                                  const aidx = sortedAddressFieldIds.indexOf(fid);
                                  const parentFid = aidx > 0 ? sortedAddressFieldIds[aidx - 1] : null;
                                  const parentVal = parentFid ? deliveryAddress[parentFid] : null;

                                  return (
                                    <div className="form-group" key={af.id}>
                                      <label>{label}</label>
                                      <SearchableSelect
                                        options={getOptionsForField(fid, deliveryAddress.country, parentVal)}
                                        value={deliveryAddress[fid] || ""}
                                        placeholder={`Select / Create ${label}`}
                                        onChange={(v) => {
                                          const newAddr = { ...deliveryAddress, [fid]: v };
                                          for (let i = aidx + 1; i < sortedAddressFieldIds.length; i++) {
                                            newAddr[sortedAddressFieldIds[i]] = "";
                                          }
                                          setDeliveryAddress(newAddr);
                                        }}
                                        allowCreateNew={true}
                                        createNewLabel={label}
                                        onAddNewValue={(v) => handleAddNewAddressValue(fid, v)}
                                      />
                                    </div>
                                  );
                                }

                                // 4. Generic Address Fields (pin_code, etc.)
                                return (
                                    <div className="form-group" key={af.id}>
                                        <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                        {af.allow_create_new ? (
                                          <SearchableSelect
                                            options={af.type === 'Select' 
                                              ? (af.link_doctype || "").split(',').map(o => o.trim()).filter(Boolean)
                                              : [...new Set((tableOptions[f.id] || []).map(opt => opt[af.id]).filter(Boolean))].sort()
                                            } 
                                            value={deliveryAddress[af.id] || ""}
                                            onChange={(v) => handleDeliveryAddressChange(af.id, v)}
                                            placeholder={`Select / Create ${af.label}`}
                                            allowCreateNew={true}
                                            createNewLabel={af.label}
                                          />
                                        ) : af.type === 'Date' ? (
                                          <CustomDatePicker 
                                            value={deliveryAddress[af.id] || ""} 
                                            onChange={(val) => handleDeliveryAddressChange(af.id, val)} 
                                            placeholder={`Select ${af.label}`} 
                                          />
                                        ) : (
                                          <input 
                                              type={af.type === 'Number' ? 'number' : af.type === 'Time' ? 'time' : 'text'} 
                                              value={deliveryAddress[af.id] || ""} 
                                              onChange={(e) => handleDeliveryAddressChange(af.id, e.target.value)} 
                                              placeholder={`Enter ${af.label}`} 
                                          />
                                        )}
                                    </div>
                                );
                              })}
                            </React.Fragment>
                          );
                        }

                        // Generic Table handling
                        const identifierField = (linkedDoctypeFields[f.id] || []).find(lf => lf.id === (f.link_doctype === 'Customer Group' ? 'group_name' : 'name'));
                        const isAllowCreateNew = identifierField ? identifierField.allow_create_new : f.allow_create_new;
                        const isMandatory = identifierField ? identifierField.mandatory : f.mandatory;

                        return (
                          <React.Fragment key={f.id}>
                            <div className="form-group">
                              <label>{f.label} {isMandatory && <span className="required">*</span>}</label>
                              <SearchableSelect
                                options={(tableOptions[f.id] || []).map(opt => getDisplayValueForTable(opt, f.link_doctype))}
                                value={
                                  f.id === 'customer_group' && selectedGroup 
                                    ? ((tableOptions[f.id] || []).find(g => g._id === selectedGroup || g.group_name === selectedGroup)?.group_name || dynamicValues[f.id] || "")
                                    : dynamicValues[f.id] || ""
                                }
                                onChange={(val) => {
                                  setDynamicValues({ ...dynamicValues, [f.id]: val });
                                  if (f.id === 'customer_group') handleGroupNameChange(val);
                                }}
                                placeholder={`Select / Create ${f.label}`}
                                allowCreateNew={isAllowCreateNew}
                                createNewLabel={f.label}
                                onAddNewValue={f.id === 'customer_group' ? handleCreateNewGroup : null}
                              />
                            </div>
                            {(linkedDoctypeFields[f.id] || []).filter(lf => !lf.hidden).map(lf => {
                              if (lf.id === (f.link_doctype === 'Customer Group' ? 'group_name' : 'name')) return null;

                              if (lf.type === 'Select') {
                                const selectOptions = (lf.link_doctype || "").split(',').map(o => o.trim()).filter(o => o);
                                return (
                                  <div className="form-group" key={lf.id}>
                                    <label>{lf.label} {lf.mandatory && <span className="required">*</span>}</label>
                                    <SearchableSelect
                                      options={selectOptions}
                                      value={dynamicValues[`${f.id}_${lf.id}`] || ""}
                                      onChange={(val) => setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: val })}
                                      placeholder={`Select ${lf.label}`}
                                      allowCreateNew={lf.allow_create_new}
                                      createNewLabel={lf.label}
                                      onAddNewValue={async (newVal) => {
                                        try {
                                          const parentDoctypeName = f.link_doctype;
                                          const parentDoctypeRes = await axios.get(`${baseUrl}/api/doctypes/${parentDoctypeName}`, { headers: getHeaders() });
                                          const doctypeData = parentDoctypeRes.data;
                                          const updatedFields = doctypeData.fields.map(field => {
                                            if (field.id === lf.id) {
                                              const currentOptions = (field.link_doctype || "").split(',').map(o => o.trim()).filter(o => o);
                                              if (!currentOptions.includes(newVal)) {
                                                currentOptions.push(newVal);
                                                return { ...field, link_doctype: currentOptions.join(', ') };
                                              }
                                            }
                                            return field;
                                          });
                                          doctypeData.fields = updatedFields;
                                          await axios.post(`${baseUrl}/api/doctypes`, doctypeData, { headers: getHeaders() });
                                          
                                          setLinkedDoctypeFields(prev => ({
                                            ...prev,
                                            [f.id]: updatedFields
                                          }));
                                          return true;
                                        } catch (err) {
                                          console.error("Failed to add new option to doctype", err);
                                          return false;
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              }

                              if (lf.type === 'Table' && (lf.link_doctype === 'Address Structure' || ['address_data', 'adress_', 'address', 'adress'].includes(lf.id))) {
                                const nestedAddress = dynamicValues[`${f.id}_${lf.id}`] || { country: "" };
                                const handleNestedAddressChange = (fieldId, val) => {
                                  setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: { ...nestedAddress, [fieldId]: val } });
                                };
                                const nestedLabels = getAddressLabels(nestedAddress.country);

                                return (
                                  <React.Fragment key={lf.id}>
                                    {addressDoctypeFields.map((af) => {
                                      if (af.hidden) return null;

                                      if (af.id === 'country_name') {
                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                            <SearchableSelect
                                              options={countryList}
                                              value={nestedAddress.country || ""}
                                              onChange={(v) => handleNestedAddressChange("country", v)}
                                              placeholder={`Select ${af.label}`}
                                            />
                                          </div>
                                        );
                                      }

                                      if (af.id === 'flat_villa_no' || af.id === 'building_name') {
                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                            <input type="text" value={nestedAddress[af.id] || ""} onChange={(e) => handleNestedAddressChange(af.id, e.target.value)} placeholder={`Enter ${af.label}`} />
                                          </div>
                                        );
                                      }

                                      if (af.id.toLowerCase().includes('field') && af.id.toLowerCase().includes('label')) {
                                        if (!nestedAddress.country) return null;
                                        const fid = af.id.toLowerCase().replace('_label', '').replace('label', '').replace('_', '');
                                        const label = nestedLabels[fid];
                                        if (!label || ["N/A", "None", ""].includes(label) || label.toLowerCase().includes("label")) return null;

                                        const aidx = sortedAddressFieldIds.indexOf(fid);
                                        const parentFid = aidx > 0 ? sortedAddressFieldIds[aidx - 1] : null;
                                        const parentVal = parentFid ? nestedAddress[parentFid] : null;

                                        return (
                                          <div className="form-group" key={af.id}>
                                            <label>{label}</label>
                                            <SearchableSelect
                                              options={getOptionsForField(fid, nestedAddress.country, parentVal)}
                                              value={nestedAddress[fid] || ""}
                                              placeholder={`Select / Create ${label}`}
                                              onChange={(v) => {
                                                const newAddr = { ...nestedAddress, [fid]: v };
                                                for (let i = aidx + 1; i < sortedAddressFieldIds.length; i++) {
                                                  newAddr[sortedAddressFieldIds[i]] = "";
                                                }
                                                setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: newAddr });
                                              }}
                                              allowCreateNew={true}
                                              createNewLabel={label}
                                              onAddNewValue={async (v) => {
                                                let parent = "";
                                                const fieldNum = parseInt(fid.replace('field', ''));
                                                if (fieldNum > 1) {
                                                  const parentKey = `field${fieldNum - 1}`;
                                                  parent = nestedAddress[parentKey] || "";
                                                }
                                                try {
                                                  const res = await axios.post(`${baseUrl}/api/add-address-value`, { country: nestedAddress.country, field: fid, value: v, parent_value: parent || undefined }, { headers: getHeaders() });
                                                  if (res.status === 200) { await fetchAddressStructure(baseUrl); return true; }
                                                } catch (e) { return false; }
                                                return false;
                                              }}
                                            />
                                          </div>
                                        );
                                      }

                                      return (
                                          <div className="form-group" key={af.id}>
                                              <label>{af.label} {af.mandatory && <span className="required">*</span>}</label>
                                              {af.allow_create_new ? (
                                                <SearchableSelect
                                                  options={af.type === 'Select' 
                                                    ? (af.link_doctype || "").split(',').map(o => o.trim()).filter(Boolean)
                                                    : [...new Set((tableOptions[f.id] || []).map(opt => opt[af.id]).filter(Boolean))].sort()
                                                  } 
                                                  value={nestedAddress[af.id] || ""}
                                                  onChange={(v) => handleNestedAddressChange(af.id, v)}
                                                  placeholder={`Select / Create ${af.label}`}
                                                  allowCreateNew={true}
                                                  createNewLabel={af.label}
                                                />
                                              ) : af.type === 'Date' ? (
                                                <CustomDatePicker 
                                                  value={nestedAddress[af.id] || ""} 
                                                  onChange={(val) => handleNestedAddressChange(af.id, val)} 
                                                  placeholder={`Select ${af.label}`} 
                                                />
                                              ) : (
                                                <input 
                                                    type={af.type === 'Number' ? 'number' : af.type === 'Time' ? 'time' : 'text'} 
                                                    value={nestedAddress[af.id] || ""} 
                                                    onChange={(e) => handleNestedAddressChange(af.id, e.target.value)} 
                                                    placeholder={`Enter ${af.label}`} 
                                                />
                                              )}
                                          </div>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              }

                              return (
                                <div className="form-group" key={lf.id}>
                                  <label>{lf.label} {lf.mandatory && <span className="required">*</span>}</label>
                                  {lf.allow_create_new ? (
                                    <SearchableSelect
                                      options={[...new Set((tableOptions[f.id] || []).map(opt => opt[lf.id]).filter(Boolean))].sort()}
                                      value={dynamicValues[`${f.id}_${lf.id}`] || ""}
                                      onChange={(val) => setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: val })}
                                      placeholder={`Select / Create ${lf.label}`}
                                      allowCreateNew={true}
                                      createNewLabel={lf.label}
                                    />
                                  ) : lf.type === 'Date' ? (
                                    <CustomDatePicker 
                                      value={dynamicValues[`${f.id}_${lf.id}`] || ""} 
                                      onChange={(val) => setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: val })} 
                                      placeholder={`Select ${lf.label}`} 
                                    />
                                  ) : (
                                    <input
                                      type={lf.type === 'Number' ? 'number' : lf.type === 'Time' ? 'time' : 'text'}
                                      value={dynamicValues[`${f.id}_${lf.id}`] || ""}
                                      onChange={(e) => setDynamicValues({ ...dynamicValues, [`${f.id}_${lf.id}`]: e.target.value })}
                                      placeholder={`Enter ${lf.label}`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      }

                      // GENERIC SIMPLE FIELDS
                      if (f.type === 'Select') {
                        const selectOptions = (f.link_doctype || "").split(',').map(o => o.trim()).filter(o => o);
                        return (
                          <div key={f.id} className="form-group">
                            <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                            <SearchableSelect 
                              options={selectOptions} 
                              value={dynamicValues[f.id] || ""} 
                              onChange={(val) => setDynamicValues({ ...dynamicValues, [f.id]: val })} 
                              placeholder={`Select ${f.label}`} 
                              allowCreateNew={f.allow_create_new} 
                              createNewLabel={f.label}
                            />
                          </div>
                        );
                      }

                      const opts = (tableOptions[f.id] || []).map(o => getDisplayValueForTable(o, f.link_doctype));
                      const isDateTime = f.type === 'Date' || f.type === 'Time' || f.type === 'Datetime';
                      
                      return (
                        <div key={f.id} className="form-group">
                          <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                          {f.allow_create_new ? (
                            <SearchableSelect options={opts} value={dynamicValues[f.id] || ""} onChange={(val) => setDynamicValues({ ...dynamicValues, [f.id]: val })} placeholder={`Select / Create ${f.label}`} allowCreateNew={true} createNewLabel={f.label} />
                          ) : f.type === 'Date' ? (
                            <CustomDatePicker 
                              value={dynamicValues[f.id] || ""} 
                              onChange={(val) => setDynamicValues({ ...dynamicValues, [f.id]: val })} 
                              placeholder={`Select ${f.label}`} 
                            />
                          ) : (
                            <input 
                              type={f.type === 'Number' ? 'number' : f.type === 'Time' ? 'time' : f.type === 'Datetime' ? 'datetime-local' : 'text'} 
                              value={dynamicValues[f.id] || ""} 
                              onChange={(e) => setDynamicValues({ ...dynamicValues, [f.id]: e.target.value })} 
                              placeholder={f.label} 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <CustomerCustomizationModal 
        isOpen={showCustomizeModal}
        onClose={() => {
          setShowCustomizeModal(false);
          handleCustomizationRefresh();
        }}
        onRefresh={handleCustomizationRefresh}
      />
    </div>
  );
};

export default CreateCustomerPage;
