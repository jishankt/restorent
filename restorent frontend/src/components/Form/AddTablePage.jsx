import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { UserContext } from '../../Context/UserContext';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import { FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';

const AddTablePage = () => {
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [tableNumber, setTableNumber] = useState("");

  const [floor, setFloor] = useState("");
  const [numberOfChairs, setNumberOfChairs] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [tables, setTables] = useState([]);
  const [uniqueFloors, setUniqueFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableBranch, setSelectedTableBranch] = useState(null); // Branch-aware selection
  const [showModal, setShowModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false); // NEW
  const [isSubmitMode, setIsSubmitMode] = useState(null); // 'add' or 'edit'
  // baseUrl is now consumed from UserContext
  const [loading, setLoading] = useState(false); // Double submission prevention

  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");

  // Branch and Multi-tenancy State
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false); // Track Group Admin status
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [selectedAddBranches, setSelectedAddBranches] = useState([]); // Array for multi-select checkboxes
  const [selectedBranch, setSelectedBranch] = useState(""); // For filtering view
  const [userBranch, setUserBranch] = useState("");
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyName, setCompanyName] = useState("");

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [editTableNumber, setEditTableNumber] = useState("");
  const [editFloor, setEditFloor] = useState("");
  const [editChairs, setEditChairs] = useState("");
  const [editCompanies, setEditCompanies] = useState([]);
  const [editBranches, setEditBranches] = useState([]);
  const [selectedViewCompany, setSelectedViewCompany] = useState("");
  const [kitchenOptions, setKitchenOptions] = useState([]);
  const [selectedKitchen, setSelectedKitchen] = useState("");
  const [editKitchen, setEditKitchen] = useState("");



  // Shared getHeaders is now consumed from UserContext

  const fetchPermissions = async (currentBaseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = user.role || user.UserType || '';
        const company = user.company_name || user.company || '';
        const activeBranch = localStorage.getItem('active_branch');
        const branch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : (user.branch_name || user.branch || "");
        const isAdminRole = checkIsAdmin(user);
        const isGroupAdminRole = checkIsGlobalAdmin(user);
        const isBA = role.toLowerCase().includes('branch') || role.toLowerCase().includes('manager');
        
        setIsCompanyAdmin(isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);
        setIsBranchAdmin(isBA);
        setCompanyName(company);
        setUserBranch(branch);
        
        // STRICT BRANCH ISOLATION: 
        // 1. Initialize view filter to user's branch for non-group admins
        if (!isGroupAdminRole && branch) {
          setSelectedBranch(branch);
        }

        if (selectedAddBranches.length === 0 && branch && branch !== 'All Branches') {
          setSelectedAddBranches([branch]);
        }
        
        if (isAdminRole || isGroupAdminRole) {
          fetchCompanies(currentBaseUrl || baseUrl);
        } else {
          const activeContext = localStorage.getItem('active_company');
          setSelectedCompanies([activeContext || company]);
        }

        if (role) {
          try {
            const url = currentBaseUrl ? `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(role)}` : `/api/role-permissions?role=${encodeURIComponent(role)}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'add_table');
            
            if (isAdminRole || isGroupAdminRole) {
              setCanRead(true);
              setCanWrite(true);
              setCanDelete(true);
            } else if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canWrite === true || pagePerm.canDelete === true);
            }
          } catch (e) {
            console.error("Permission fetch error:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermsLoading(false);
    }
  };

  const navigate = useNavigate();

  // Clear selection when floor changes
  useEffect(() => {
    setSelectedTableNumber(null);
  }, [selectedFloor]);

  // Format floor for display
  const formatFloor = (f) => {
    if (f.toLowerCase() === "ground floor") return "Ground Floor";
    return `Floor ${f}`;
  };

  // Default chair positions based on table type
  const getDefaultChairPositions = (type, numChairs, centerX = 120, centerY = 140, radius = 80, chairSize = 24) => {
    const positions = [];
    if (type === "Round" || type === "Oval") {
      let rx = radius;
      let ry = radius;
      if (type === "Oval") {
        rx = radius * 1.2;
        ry = radius * 0.8;
      }
      for (let i = 0; i < numChairs; i++) {
        const angleDeg = (360 * i) / numChairs;
        const angleRad = (angleDeg * Math.PI) / 180;
        const chairX = centerX + rx * Math.cos(angleRad);
        const chairY = centerY + ry * Math.sin(angleRad);
        positions.push({ x: chairX, y: chairY });
      }
    } else if (type === "Square" || type === "Rectangle" || type === "Long") {
      let w = type === "Square" ? 80 : type === "Rectangle" ? 120 : 160;
      let h = type === "Square" ? 80 : type === "Rectangle" ? 60 : 40;
      const perimeter = 2 * (w + h);
      const spacing = perimeter / numChairs;
      let currentPos = 0;
      for (let i = 0; i < numChairs; i++) {
        let x, y;
        if (currentPos < w) {
          // Top side
          x = centerX - w / 2 + currentPos;
          y = centerY - h / 2 - chairSize / 2 - 10;
        } else if (currentPos < w + h) {
          // Right side
          x = centerX + w / 2 + chairSize / 2 + 10;
          y = centerY - h / 2 + (currentPos - w);
        } else if (currentPos < 2 * w + h) {
          // Bottom side
          x = centerX + w / 2 - (currentPos - w - h);
          y = centerY + h / 2 + chairSize / 2 + 10;
        } else {
          // Left side
          x = centerX - w / 2 - chairSize / 2 - 10;
          y = centerY + h / 2 - (currentPos - 2 * w - h);
        }
        positions.push({ x, y });
        currentPos += spacing;
      }
    } else if (type === "Bar") {
      const barWidth = 160;
      const spacing = barWidth / (numChairs + 1);
      for (let i = 1; i <= numChairs; i++) {
        const x = centerX - barWidth / 2 + i * spacing;
        const y = centerY + 20 / 2 + chairSize / 2 + 10; // Below the bar (tableHeight=20)
        positions.push({ x, y });
      }
    }
    return positions;
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
        const compRes = await axios.get(`${url || baseUrl}/api/company-details`, { headers: getHeaders() });
        const details = compRes.data.companyDetails || [];
        comps = details.map(c => c.company_name || c.restaurantName).filter(Boolean);
      }
      
      const finalComps = comps.length > 0 ? [...new Set(comps)] : [];
      setAllCompanies(finalComps);

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
          axios.get(`${url || baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: { ...getHeaders(), "X-Company-Name": comp } })
            .then(res => ({ comp, data: res.data }))
        );
        const results = await Promise.all(branchPromises);
        const newMap = {};
        const allB = [];
        results.forEach(res => {
           const branches = Array.isArray(res.data) ? res.data.map(b => typeof b === 'string' ? b : b.branch_name || b.branch || b.name || '').filter(Boolean) : [];
           newMap[res.comp] = branches;
           allB.push(...branches);
        });
        setCompanyBranchesMap(newMap);
      }
    } catch (e) { console.error("Error fetching user-companies:", e); }
  };

  const fetchKitchens = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/kitchens`, { headers: getHeaders() });
      const names = response.data.map(k => k.kitchen_name).filter(Boolean);
      setKitchenOptions([...new Set(names)]);
    } catch (err) {
      console.error("Failed to fetch kitchens:", err);
    }
  };

  const handleCompanyToggle = (company) => {
    setSelectedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  useEffect(() => {
    // We will dynamically compute branches in the JSX instead to support both Add and Edit modals independently
  }, [selectedCompanies, companyBranchesMap]);

  const getBranchesForCompanies = (comps) => {
    const branches = [];
    comps.forEach(comp => {
      if (companyBranchesMap[comp]) {
        branches.push(...companyBranchesMap[comp]);
      }
    });
    return [...new Set(branches)];
  };

  // baseUrl and role initialization are now managed by UserContext

  // Fetch tables from backend (updated to use baseUrl and branch filtering)
  const fetchTables = async () => {
    try {
      let apiUrl = baseUrl ? `${baseUrl}/api/tables` : "/api/tables";
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branch_name", selectedBranch);
      if (selectedViewCompany) params.append("company_name", selectedViewCompany);
      
      const qString = params.toString();
      if (qString) apiUrl += `?${qString}`;

      const response = await axios.get(apiUrl, {
        headers: getHeaders()
      });
      let fetchedTables = response.data.message || [];
      // Handle tables without floor by assigning "Ground Floor" and default type to "Round"
      fetchedTables = fetchedTables.map(t => ({
        ...t,
        floor: t.floor ? t.floor.trim() : "Ground Floor",
        type: t.type ? t.type : "Round",
        chairs: Array.isArray(t.chairs) ? t.chairs : null
      }));

      // Initialize chairs ONLY if missing or count mismatch
      for (const t of fetchedTables) {
        if (!t.chairs || t.chairs.length === 0 || t.chairs.length !== parseInt(t.number_of_chairs)) {
          console.log(`Initializing default chairs for Table ${t.table_number} (${t.number_of_chairs} chairs)`);
          const defaultChairs = getDefaultChairPositions(t.type, parseInt(t.number_of_chairs));
          t.chairs = defaultChairs;
          // Persist the default positions to backend immediately if they were missing
          updateTableChairs(t.floor, t.table_number, defaultChairs, t.branch_name, t.company_name)
            .catch(err => console.error("Failed to persist default chairs:", err));
        }
      }
      setTables(fetchedTables);

      const floors = [...new Set(fetchedTables.map(t => t.floor))];
      setUniqueFloors(floors);
      if (floors.length > 0 && !selectedFloor) {
        setSelectedFloor(floors[0]);
      } else if (selectedFloor && !floors.includes(selectedFloor)) {
        setSelectedFloor(floors.length > 0 ? floors[0] : "");
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
      setMessage(err.response?.data?.error || err.message || "Failed to fetch tables");
      setMessageType('error');
    }
  };

  // Run fetchConfig and fetchTables on component mount
  // Run fetchPermissions and fetchBranches after context is ready
  useEffect(() => {
    if (!configLoading) {
      fetchPermissions(baseUrl);
      fetchKitchens();
    }
  }, [configLoading, baseUrl, companyName]);

  useEffect(() => {
    if (!configLoading) {
      fetchTables();
    }
  }, [configLoading, baseUrl, selectedBranch, selectedViewCompany]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset form fields when modal opens
  const openModal = () => {
    setTableNumber("");
    setFloor("");
    setNumberOfChairs("");
    
    // Resolve the best default branch to "tick"
    const activeBr = localStorage.getItem('active_branch');
    const profileBr = userBranch;
    // Prioritize active context, fallback to profile branch
    const branchToTick = (activeBr && activeBr !== 'All' && activeBr !== 'All Branches') ? activeBr : profileBr;

    if (branchToTick && branchToTick.trim() !== "" && branchToTick.toLowerCase() !== 'all') {
      setSelectedAddBranches([branchToTick]);
    } else {
      setSelectedAddBranches([]);
    }
    setSelectedKitchen("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault && e.preventDefault();
    if (loading) return; 
    
    if (!canWrite) {
      setPermModalMsg("You do not have permission to add tables.");
      setShowPermModal(true);
      return;
    }
    setMessage(null);
    setMessageType(null);
    const inputFloor = floor.trim();
    const trimmedTableNumber = tableNumber.trim();
    const trimmedChairs = numberOfChairs.trim();

    if (!trimmedTableNumber || !inputFloor || !trimmedChairs) {
      setMessage("Please fill all required fields (Table Number, Floor, Chairs).");
      setMessageType('error');
      return;
    }

    const activeContext = localStorage.getItem('active_company');
    const isSpecComp = activeContext && activeContext !== 'All' && activeContext !== 'All Companies';
    const activeBranchLoc = localStorage.getItem('active_branch') || '';
    const isSpecBranch = activeBranchLoc && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All';

    let finalCompanies = selectedCompanies.length > 0 ? selectedCompanies : (isSpecComp ? [activeContext] : []);
    let finalBranches = selectedAddBranches.length > 0 ? selectedAddBranches : (isSpecBranch ? [activeBranchLoc] : []);

    const showCompanyAssignLocal = (isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0;
    if (finalCompanies.length === 0 && showCompanyAssignLocal) {
      setMessage("Company selection is required");
      setMessageType("warning");
      return;
    }

    let normalizedFloor = inputFloor;
    if (inputFloor.toLowerCase() === "ground" || inputFloor.toLowerCase() === "ground floor" || inputFloor === "0") {
      normalizedFloor = "Ground Floor";
    }

    try {
      setLoading(true);
      const apiUrl = baseUrl ? `${baseUrl}/api/tables` : "/api/tables";
      
      const tableData = {
        table_number: trimmedTableNumber,
        floor: normalizedFloor,
        number_of_chairs: parseInt(trimmedChairs),
        branch_name: finalBranches[0] || "",
        branch_names: finalBranches,
        company_name: finalCompanies[0] || "",
        company_names: finalCompanies,
        type: "Round",
        x: 0,
        y: 0,
        kitchen: selectedKitchen
      };

      await axios.post(apiUrl, tableData, { headers: getHeaders(finalBranches[0] || "", finalCompanies[0] || "") });

      setMessage(`Table added successfully.`);
      setMessageType('success');
      setSelectedFloor(normalizedFloor);
      setTableNumber("");
      setFloor("");
      setNumberOfChairs("");
      setShowModal(false);
      fetchTables();
    } catch (err) {
      setMessage(`Failed: ${err.response?.data?.error || err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault && e.preventDefault();
    if (loading) return;

    const activeContext = localStorage.getItem('active_company');
    const isSpecComp = activeContext && activeContext !== 'All' && activeContext !== 'All Companies';
    const activeBranchLoc = localStorage.getItem('active_branch') || '';
    const isSpecBranch = activeBranchLoc && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All';

    let finalCompanies = editCompanies.length > 0 ? editCompanies : (isSpecComp ? [activeContext] : []);
    let finalBranches = editBranches.length > 0 ? editBranches : (isSpecBranch ? [activeBranchLoc] : []);

    const showCompanyAssignLocal = (isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0;
    if (finalCompanies.length === 0 && showCompanyAssignLocal) {
      setMessage("Company selection is required");
      setMessageType("warning");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = baseUrl ? `${baseUrl}/api/tables` : "/api/tables";
      
      const newChairCount = parseInt(editChairs);
      const needsChairUpdate = newChairCount !== parseInt(tableToEdit.number_of_chairs) || editFloor !== tableToEdit.floor;
      
      const payload = {
        table_number: editTableNumber,
        floor: editFloor.trim(),
        number_of_chairs: newChairCount,
        original_floor: tableToEdit.floor,
        original_branch_name: tableToEdit.branch_name,
        branch_name: finalBranches[0] || "",
        branch_names: finalBranches,
        company_name: finalCompanies[0] || "",
        company_names: finalCompanies,
        kitchen: editKitchen,
        ...(needsChairUpdate ? { chairs: getDefaultChairPositions(tableToEdit.type || "Round", newChairCount) } : {})
      };

      const putUrl = `${apiUrl}/${tableToEdit.table_number}`;
      await axios.put(putUrl, payload, { headers: getHeaders(finalBranches[0] || "", finalCompanies[0] || "") });

      setMessage(`Update processed successfully.`);
      setMessageType('success');
      setShowEditModal(false);
      fetchTables();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update table");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (table) => {
    setTableToEdit(table);
    setEditTableNumber(table.table_number);
    setEditFloor(table.floor);
    setEditChairs(table.number_of_chairs);
    setEditCompanies(table.company_name ? [table.company_name] : []);
    setEditBranches(table.branch_name ? [table.branch_name] : []);
    setEditKitchen(table.kitchen || "");
    setShowEditModal(true);
  };



  const handleDelete = async (tableNumber, floor, branch, tableId = null) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete tables.");
      setShowPermModal(true);
      return;
    }
    
    const confirmMsg = `Are you sure you want to delete Table ${tableNumber} on ${formatFloor(floor)}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      // Use _id if available for precise deletion, fallback to tableNumber
      const identification = tableId || tableNumber;
      const apiUrl = baseUrl ? `${baseUrl}/api/tables/${identification}` : `/api/tables/${identification}`;
      
      const response = await axios.delete(apiUrl, {
        headers: getHeaders(branch),
        data: { floor, branch_name: branch }, 
      });

      setMessage(response.data.message || "Table deleted successfully");
      setMessageType('success');
      fetchTables(); 
    } catch (err) {
      console.error("Delete error:", err);
      setMessage(err.response?.data?.error || "Failed to delete table");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const updateTablePosition = async (tableNumber, floor, x, y, branch, company, tableId = null) => {
    if (!canWrite) return; 
    try {
      const identification = tableId || tableNumber;
      const apiUrl = baseUrl ? `${baseUrl}/api/tables/${identification}` : `/api/tables/${identification}`;
      await axios.put(apiUrl, { floor, x: Math.round(x), y: Math.round(y), branch_name: branch, company_name: company }, {
        headers: getHeaders(branch, company),
      });
      setTables(prevTables => prevTables.map(t =>
        (t._id === tableId || (t.table_number === tableNumber && t.floor === floor && t.branch_name === branch)) ? { ...t, x: Math.round(x), y: Math.round(y) } : t
      ));
    } catch (err) {
      console.error("Error updating position:", err);
      setMessage(`Failed to update table position: ${err.response?.data?.error || err.message}`);
      setMessageType('error');
    }
  };


  const updateTableChairs = async (floor, tableNumber, chairs, branch, company, tableId = null) => {
    if (!canWrite) return;
    try {
      const identification = tableId || tableNumber;
      const apiUrl = baseUrl ? `${baseUrl}/api/tables/${identification}` : `/api/tables/${identification}`;
      await axios.put(apiUrl, { floor, chairs, branch_name: branch, company_name: company }, {
        headers: getHeaders(branch, company),
      });
      setTables(prevTables => prevTables.map(t =>
        (t._id === tableId || (t.table_number === tableNumber && t.floor === floor && t.branch_name === branch)) ? { ...t, chairs } : t
      ));
    } catch (err) {
      console.error("Error updating chairs:", err);
      setMessage(`Failed to update chairs: ${err.response?.data?.error || err.message}`);
      setMessageType('error');
    }
  };


  const updateTableType = async (tableNumber, floor, newType, currentX, currentY, branch, company, tableId = null) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to update tables.");
      setShowPermModal(true);
      return;
    }
    try {
      const identification = tableId || tableNumber;
      const newChairs = getDefaultChairPositions(newType, tables.find(t => t._id === tableId || t.table_number === tableNumber)?.number_of_chairs || 4);
      const tableData = {
        floor,
        type: newType,
        x: Math.round(currentX),
        y: Math.round(currentY),
        chairs: newChairs,
        branch_name: branch,
        company_name: company
      };
      const apiUrl = baseUrl ? `${baseUrl}/api/tables/${identification}` : `/api/tables/${identification}`;
      await axios.put(apiUrl, tableData, {
        headers: getHeaders(branch, company),
      });

      setTables(prevTables => prevTables.map(t =>
        (t._id === tableId || (t.table_number === tableNumber && t.floor === floor && t.branch_name === branch)) ? { ...t, type: newType, chairs: newChairs } : t
      ));
      setMessage("Table type updated successfully");
      setMessageType('success');
    } catch (err) {
      console.error("Error updating type:", err);
      setMessage(`Failed to update table type: ${err.response?.data?.error || err.message}`);
      setMessageType('error');
      fetchTables();
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      height: "100vh",
      background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      padding: 0,
      margin: 0,
      overflow: "hidden",
    },
    messageBar: {
      width: "100%",
      padding: "10px",
      textAlign: "center",
    },
    content: {
      display: "flex",
      flexDirection: "row",
      flex: 1,
      overflow: "hidden",
    },
    leftSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "450px",
      padding: "30px",
      boxSizing: "border-box",
      overflowY: "auto",
    },
    backButton: {
      position: "absolute",
      left: "25px",
      top: "25px",
      fontSize: "1.8rem",
      cursor: "pointer",
      color: "#2c3e50",
      transition: "color 0.3s ease",
      zIndex: 10,
    },
    backButtonHover: {
      color: "#3498db",
    },
    heading: {
      marginBottom: "30px",
      fontSize: "2.8rem",
      fontWeight: "800",
      color: "#1a365d",
      letterSpacing: "-0.5px",
      textShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    addButton: {
      padding: "14px 28px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1.1rem",
      fontWeight: "700",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: "25px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    addButtonHover: {
      backgroundColor: "#27ae60",
    },
    deleteButton: {
      padding: "6px 12px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.95rem",
      transition: "background-color 0.3s ease",
    },
    deleteButtonHover: {
      backgroundColor: "#c0392b",
    },
    error: {
      color: "#e74c3c",
      backgroundColor: "#fceaea",
      padding: "10px",
      borderRadius: "5px",
      textAlign: "center",
    },
    success: {
      color: "#27ae60",
      backgroundColor: "#eafaf1",
      padding: "10px",
      borderRadius: "5px",
      textAlign: "center",
    },
    tableContainer: {
      marginTop: "25px",
      maxWidth: "750px",
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(12px)",
      padding: "25px",
      borderRadius: "18px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #ecf0f1",
    },
    th: {
      backgroundColor: "#3498db",
      color: "white",
      padding: "12px",
      border: "1px solid #2980b9",
      textAlign: "left",
      fontWeight: "600",
    },
    td: {
      padding: "12px",
      border: "1px solid #ecf0f1",
      textAlign: "left",
      color: "#2c3e50",
    },
    noTables: {
      color: "#7f8c8d",
      fontStyle: "italic",
      textAlign: "center",
      marginTop: "20px",
    },
    floorPlan: {
      flex: 1,
      height: "100%",
      backgroundColor: "#ffffff",
      borderLeft: "2px solid #ccc",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    floorSelect: {
      marginBottom: "20px",
      padding: "10px",
      fontSize: "1rem",
      width: "100%",
      maxWidth: "450px",
    },
    sidebar: {
      position: "absolute",
      right: 0,
      top: 0,
      width: "150px",
      height: "100%",
      backgroundColor: "#f9f9f9",
      padding: "15px",
      boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
      zIndex: 5,
      overflowY: "auto",
    },
    sidebarHeading: {
      textAlign: "center",
      marginBottom: "15px",
      fontSize: "1.2rem",
      color: "#2c3e50",
    },
    typeButton: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "50px",
      margin: "5px 2.5px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontSize: "0.8rem",
    },
    typeButtonSelected: {
      backgroundColor: "#e67e22",
      color: "white",
    },
    typeButtonNormal: {
      backgroundColor: "white",
      color: "#2c3e50",
    },
    typeIcon: {
      marginBottom: "3px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      padding: "35px",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.05)",
      maxWidth: "450px",
      width: "90%",
      maxHeight: "85vh",
      overflowY: "auto",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    modalHeading: {
      marginBottom: "20px",
      fontSize: "1.8rem",
      color: "#2c3e50",
      textAlign: "center",
    },
    modalFormGroup: {
      display: "flex",
      flexDirection: "column",
      marginBottom: "15px",
    },
    modalLabel: {
      marginBottom: "8px",
      fontWeight: "600",
      color: "#34495e",
      fontSize: "1rem",
    },
    modalInput: {
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "5px",
      fontSize: "0.95rem",
      outline: "none",
      transition: "border-color 0.3s ease",
    },
    modalInputFocus: {
      borderColor: "#3498db",
      boxShadow: "0 0 5px rgba(52, 152, 219, 0.3)",
    },
    modalButtons: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "20px",
    },
    modalSaveButton: {
      padding: "10px 20px",
      backgroundColor: "#2ecc71",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s ease",
    },
    modalSaveButtonHover: {
      backgroundColor: "#27ae60",
    },
    modalCancelButton: {
      padding: "10px 20px",
      backgroundColor: "#95a5a6",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.3s ease",
    },
    modalCancelButtonHover: {
      backgroundColor: "#7f8c8d",
    },
  };

  const ChairItem = ({ index, initialPosition, onSavePosition, tableCenter }) => {
    const [pos, setPos] = useState(initialPosition);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef(null);
    useEffect(() => {
      setPos(initialPosition);
    }, [initialPosition]);
    const handleMouseDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setDragging(true);
      }
    };
    useEffect(() => {
      const handleMouseMove = (e) => {
        if (dragging && ref.current) {
          const parent = ref.current.parentNode;
          const parentRect = parent.getBoundingClientRect();
          let newX = e.clientX - parentRect.left - offset.x;
          let newY = e.clientY - parentRect.top - offset.y;
          // Constrain to around the table center (circular boundary)
          const dx = newX - tableCenter.x;
          const dy = newY - tableCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150; // Adjustable max distance from center
          if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            newX = tableCenter.x + maxDist * Math.cos(angle);
            newY = tableCenter.y + maxDist * Math.sin(angle);
          }
          setPos({ x: newX, y: newY });
        }
      };
      const handleMouseUp = () => {
        setDragging(false);
        onSavePosition(index, pos);
      };
      if (dragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, offset, tableCenter, onSavePosition, pos]);
    return (
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
          width: 32, // Slightly larger for better drag handle
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "move",
          userSelect: "none",
          zIndex: 10,
        }}
        title={`Chair ${index + 1}`}
      >
        <img
          src="/menuIcons/chair.svg"
          alt="Chair"
          style={{
            width: "24px",
            height: "24px",
            pointerEvents: "none", // Prevent image drag interference
            filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.2))",
          }}
        />
        <span style={{
          position: "absolute",
          fontSize: "10px",
          fontWeight: "bold",
          color: "black",
          bottom: "-5px",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderRadius: "4px",
          padding: "0 2px"
        }}>
          {index + 1}
        </span>
      </div>
    );
  };

  const TableItem = ({ table, onSavePosition, onSelect }) => {
    const [pos, setPos] = useState({ x: table.x || 0, y: table.y || 0 });
    const [localChairPositions, setLocalChairPositions] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const ref = useRef(null);
    const centerX = 120;
    const centerY = 140;
    const radius = 80;
    const chairSize = 24;
    useEffect(() => {
      setPos({ x: table.x || 0, y: table.y || 0 });
    }, [table.x, table.y]);
    useEffect(() => {
      let initPositions;
      if (table.chairs) {
        initPositions = table.chairs;
      } else {
        initPositions = getDefaultChairPositions(table.type, table.number_of_chairs, centerX, centerY, radius, chairSize);
      }
      setLocalChairPositions(initPositions);
    }, [table.type, table.number_of_chairs, table.chairs]);
    useEffect(() => {
      const handleMouseMove = (e) => {
        if (dragging && ref.current) {
          const ele = ref.current;
          const parentRect = ele.parentNode.getBoundingClientRect();
          const tableWidth = 240;
          const tableHeight = 280;
          const newX = e.clientX - parentRect.left - offset.x;
          const newY = e.clientY - parentRect.top - offset.y;
          const boundedX = Math.max(0, Math.min(parentRect.width - tableWidth, newX));
          const boundedY = Math.max(0, Math.min(parentRect.height - tableHeight, newY));
          setPos({ x: boundedX, y: boundedY });
        }
      };
      const handleMouseUp = (e) => {
        setDragging(false);
        if (ref.current) {
          const ele = ref.current;
          const parentRect = ele.parentNode.getBoundingClientRect();
          const tableWidth = 240;
          const tableHeight = 280;
          const newX = e.clientX - parentRect.left - offset.x;
          const newY = e.clientY - parentRect.top - offset.y;
          const boundedX = Math.max(0, Math.min(parentRect.width - tableWidth, newX));
          const boundedY = Math.max(0, Math.min(parentRect.height - tableHeight, newY));
          setPos({ x: boundedX, y: boundedY });
          onSavePosition(table.table_number, table.floor, boundedX, boundedY, table.branch_name, table.company_name); // Pass branch and company

        }
      };
      if (dragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, offset, table.table_number, table.floor, onSavePosition]);
    const handleMouseDown = (e) => {
      e.preventDefault();
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setDragging(true);
      }
    };
    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onSelect(table.table_number, table.floor, table.branch_name, table._id); // Pass branch and id
    };
    const handleSaveChairPosition = (index, newPos) => {
      const newPositions = [...localChairPositions];
      newPositions[index] = newPos;
      setLocalChairPositions(newPositions);
      updateTableChairs(table.floor, table.table_number, newPositions, table.branch_name, table.company_name, table._id); // Pass branch, company and id
      // Update local tables state to reflect saved chairs
      setTables(prevTables => prevTables.map(t =>
        (t._id === table._id || (t.table_number === table.table_number && t.floor === table.floor && t.branch_name === table.branch_name)) ? { ...t, chairs: newPositions } : t // Branch-aware local update
      ));
    };
    // Determine table dimensions and style based on type
    let tableWidth = 80;
    let tableHeight = 80;
    let tableBorderRadius = "50%";
    switch (table.type) {
      case "Round":
        tableBorderRadius = "50%";
        break;
      case "Square":
        tableBorderRadius = "0";
        break;
      case "Rectangle":
        tableWidth = 120;
        tableHeight = 60;
        tableBorderRadius = "0";
        break;
      case "Long":
        tableWidth = 160;
        tableHeight = 40;
        tableBorderRadius = "5px";
        break;
      case "Oval":
        tableWidth = 120;
        tableHeight = 60;
        tableBorderRadius = "50%";
        break;
      case "Bar":
        tableWidth = 160;
        tableHeight = 20;
        tableBorderRadius = "0";
        break;
      default:
        break;
    }
    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "240px",
          height: "320px",
          background: "transparent",
          cursor: "move",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", top: 20, left: 0, width: "100%", height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 240, height: 220 }}>
              <div
                style={{
                  position: "absolute",
                  left: centerX,
                  top: centerY,
                  transform: "translate(-50%, -50%)",
                  width: tableWidth,
                  height: tableHeight,
                  borderRadius: tableBorderRadius,
                  backgroundColor: "transparent",
                  border: "2px solid black",
                }}
              />
              {localChairPositions.map((chairPos, i) => (
                <ChairItem
                  key={i}
                  index={i}
                  initialPosition={chairPos}
                  onSavePosition={handleSaveChairPosition}
                  tableCenter={{ x: centerX, y: centerY }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 15,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: "1rem",
              fontWeight: "bold",
              color: "#5a6268",
            }}
          >
            Table {table.table_number}
          </div>
        </div>
      </div>
    );
  };

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    
    // Step 1: Filter by search/floor/company
    let byFloor = tables.filter((table) => table.floor === selectedFloor);
    
    // If a specific company is selected in Group Admin view, filter by it
    if (selectedViewCompany) {
      byFloor = byFloor.filter(t => (t.company_name || "").toLowerCase().trim() === selectedViewCompany.toLowerCase().trim());
    }

    // Step 2: Group by Table Number and Floor to find specific branch assignments

    const specificAssignments = new Set();
    byFloor.forEach(t => {
      const tKey = `${t.table_number}-${t.floor}`.toLowerCase().trim();
      const comp = (t.company_name || t.company || "").toLowerCase().trim();
      const branch = (t.branch_name || "").toLowerCase().trim();
      
      // If table is assigned to a specific branch or non-global company
      if (branch !== "" || (comp !== 'all' && comp !== 'global' && comp !== '')) {
        specificAssignments.add(tKey);
      }
    });

    // Step 3: Filter by Branch if selected
    let branchFiltered = byFloor;
    if (selectedBranch) {
      branchFiltered = byFloor.filter(t => (t.branch_name || "").toLowerCase().trim() === selectedBranch.toLowerCase().trim());
    } else {
      // If no branch selected, show all but apply Global vs Specific precedence
      branchFiltered = byFloor.filter(t => {
        const tKey = `${t.table_number}-${t.floor}`.toLowerCase().trim();
        const branch = (t.branch_name || "").toLowerCase().trim();
        const comp = (t.company_name || t.company || "").toLowerCase().trim();
        const isGlobal = (comp === 'all' || comp === 'global' || comp === '') && branch === "";
        
        if (isGlobal && specificAssignments.has(tKey)) {
          return false;
        }
        return true;
      });
    }

    // Step 4: Final Deduplication for visual safety
    // If multiple records for the same table number exist in this filtered set, 
    // we keep only the most specific one.
    const uniqueMap = new Map();
    branchFiltered.forEach(t => {
      const tKey = `${t.table_number}-${t.floor}`.toLowerCase().trim();
      const branch = (t.branch_name || "").toLowerCase().trim();
      
      if (!uniqueMap.has(tKey)) {
        uniqueMap.set(tKey, t);
      } else {
        const existing = uniqueMap.get(tKey);
        const existingBranch = (existing.branch_name || "").toLowerCase().trim();
        // Priority: Current selectedBranch matches > Specific branch > Global
        if (selectedBranch && branch === selectedBranch.toLowerCase().trim()) {
           uniqueMap.set(tKey, t);
        } else if (branch !== "" && existingBranch === "") {
           uniqueMap.set(tKey, t);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [tables, selectedFloor, selectedBranch, selectedViewCompany]);




  const handleViewTable = (table) => {
    setSelectedFloor(table.floor);
    // Use a small timeout to ensure floor changes before branch/selection if needed
    setSelectedBranch(table.branch_name || "");
    setSelectedViewCompany(table.company_name || "");
    setSelectedTableNumber(table.table_number);
    setSelectedTableId(table._id);
    setSelectedTableBranch(table.branch_name);
    
    setMessage(`Focusing on Table ${table.table_number} (${table.company_name})`);
    setMessageType('success');
  };


  const selectedTable = tables.find((t) => (t._id && t._id === selectedTableId) || (t.table_number === selectedTableNumber && t.floor === selectedFloor && t.branch_name === selectedTableBranch)); // Branch-aware selection
  const tableTypes = ["Round", "Square", "Rectangle", "Long", "Oval", "Bar"];
  const getTypeIcon = (type) => {
    let iconStyle = {
      width: 25,
      height: 25,
      border: "1px solid black",
      background: "transparent",
    };
    switch (type) {
      case "Round":
        iconStyle.borderRadius = "50%";
        break;
      case "Square":
        iconStyle.borderRadius = "0";
        break;
      case "Rectangle":
        iconStyle.width = 35;
        iconStyle.height = 18;
        iconStyle.borderRadius = "0";
        break;
      case "Long":
        iconStyle.width = 45;
        iconStyle.height = 13;
        iconStyle.borderRadius = "0";
        break;
      case "Oval":
        iconStyle.width = 35;
        iconStyle.height = 18;
        iconStyle.borderRadius = "50%";
        break;
      case "Bar":
        iconStyle.width = 13;
        iconStyle.height = 45;
        iconStyle.borderRadius = "0";
        break;
      default:
        break;
    }
    return <div style={iconStyle} />;
  };
  const handleChangeType = (newType) => {
    if (!selectedTableNumber || !selectedTable || !selectedFloor) return; // Ensure floor is selected
    if (newType === selectedTable.type) {
      setMessage(`The table is already of type ${newType}. No changes to update.`);
      setMessageType('error');
      return;
    }
    // Optimistic update - floor-specific
    const newChairs = getDefaultChairPositions(newType, selectedTable.number_of_chairs);
    setTables(prevTables => prevTables.map(t =>
      t.table_number === selectedTableNumber && t.floor === selectedFloor
        ? { ...t, type: newType, chairs: newChairs }
        : t
    ));
    // Call server with floor, branch, and ID
    updateTableType(selectedTableNumber, selectedFloor, newType, selectedTable.x || 0, selectedTable.y || 0, selectedTable.branch_name, selectedTable.company_name, selectedTable._id);
  };
  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ textAlign: 'center', color: '#2c3e50', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>Access Denied</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>You do not have permission to view the Tables page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none', color: '#fff' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  const showCompanyAssign = (isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0;
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  const showBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && Object.values(companyBranchesMap).flat().length > 0;

  const renderPermModal = () => (
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
          style={{ background: '#3498db', border: 'none', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold' }}
        >
          Understood
        </button>
      </div>
    </div>
  );

  const renderAssignmentModal = () => {
    if (!showAssignmentModal) return null;
    
    // Use the appropriate state arrays based on whether we are adding or editing
    const currentSelectedCompanies = isSubmitMode === 'edit' ? editCompanies : selectedCompanies;
    const currentSelectedBranches = isSubmitMode === 'edit' ? editBranches : selectedAddBranches;
    
    const setLocalSelectedCompanies = isSubmitMode === 'edit' ? setEditCompanies : setSelectedCompanies;
    const setLocalSelectedBranches = isSubmitMode === 'edit' ? setEditBranches : setSelectedAddBranches;

    const currentCompanyAssign = (isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0;
    const currentBranchAssign = (isGroupAdmin || isCompanyAdmin) && currentSelectedCompanies.length > 0;

    return (
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000}}>
        <div style={{width: '90%', maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '30px', maxHeight: '90vh', overflowY: 'auto'}}>
          <h2 style={{margin: '0 0 15px 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', color: '#1e293b'}}>Assignments</h2>
          
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {currentCompanyAssign && (
              <div style={{ padding: '15px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ color: '#1d4ed8', margin: '0 0 10px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span role="img" aria-label="company">🏢</span> Select Company *
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {allCompanies.map((comp, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                      <input 
                        type="checkbox" 
                        checked={currentSelectedCompanies.includes(comp)} 
                        onChange={(e) => { 
                          setLocalSelectedCompanies(prev => e.target.checked ? [...prev, comp] : prev.filter(c => c !== comp)); 
                        }} 
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} 
                      />
                      {comp}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {currentBranchAssign && (
              <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ color: '#15803d', margin: '0 0 10px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span role="img" aria-label="branch">📍</span> Select Branch
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {getBranchesForCompanies(currentSelectedCompanies).map((branch, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                      <input 
                        type="checkbox" 
                        checked={currentSelectedBranches.includes(branch)} 
                        onChange={(e) => { 
                          setLocalSelectedBranches(prev => e.target.checked ? [...prev, branch] : prev.filter(b => b !== branch)); 
                        }} 
                        style={{ width: '16px', height: '16px', accentColor: '#22c55e' }} 
                      />
                      {branch}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}>
            <button 
              type="button" 
              style={{padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1'}} 
              onClick={() => {
                setShowAssignmentModal(false);
                if (isSubmitMode === 'add') setShowModal(true);
                else setShowEditModal(true);
              }}
            >
              Back
            </button>
            <button 
              type="button" 
              style={{padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', color: '#fff', backgroundColor: '#3b82f6'}} 
              onClick={isSubmitMode === 'add' ? handleSubmit : handleEditSubmit}
              disabled={loading || currentSelectedCompanies.length === 0}
            >
              {loading ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Centered Permission Denied Modal */}
      {showPermModal && renderPermModal()}
      
      <i
        className="fas fa-arrow-left"
        style={styles.backButton}
        onClick={() => navigate("/admin")}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === "Enter" && navigate("/admin")}
        onMouseOver={(e) => (e.target.style.color = styles.backButtonHover.color)}
        onMouseOut={(e) => (e.target.style.color = styles.backButton.color)}
      ></i>
      <div style={styles.messageBar}>
        {message && <div style={{...(messageType === 'error' ? styles.error : styles.success), padding: '10px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>{message}</div>}
      </div>
      <div style={styles.content}>
        <div style={styles.leftSection}>
          <h1 style={styles.heading}>Table Management</h1>
          <button
            style={styles.addButton}
            onClick={openModal}
            onMouseOver={(e) => (e.target.style.backgroundColor = styles.addButtonHover.backgroundColor)}
            onMouseOut={(e) => (e.target.style.backgroundColor = styles.addButton.backgroundColor)}
          >
            + Add New Table
          </button>
          <div style={styles.tableContainer}>
            {/* Company Filter */}
            {(isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ ...styles.modalLabel, display: "block", marginBottom: "8px" }}>Filter by Company:</label>
                <select
                  style={styles.floorSelect}
                  value={selectedViewCompany}
                  onChange={(e) => {
                    setSelectedViewCompany(e.target.value);
                    setSelectedBranch(""); // Reset branch when company changes
                  }}
                >
                  <option value="">All Companies</option>
                  {allCompanies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch Filter */}
            {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ ...styles.modalLabel, display: "block", marginBottom: "8px" }}>Filter by Branch:</label>
                <select
                  style={styles.floorSelect}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  {(selectedViewCompany ? (companyBranchesMap[selectedViewCompany] || []) : Object.values(companyBranchesMap).flat()).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {uniqueFloors.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ ...styles.modalLabel, display: "block", marginBottom: "8px" }}>Select Floor:</label>
                <select
                  style={styles.floorSelect}
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                >
                  {uniqueFloors.map((f) => (
                    <option key={f} value={f}>
                      {formatFloor(f)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <h2 style={{ ...styles.heading, fontSize: "1.5rem", borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
              Existing Tables
            </h2>
            {filteredTables.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Table</th>
                    <th style={styles.th}>Context</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTables.map((table, index) => (
                    <tr key={`${table.floor}-${table.table_number}-${index}`}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{table.table_number}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{formatFloor(table.floor)} ({table.number_of_chairs} Chairs)</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3498db', display: 'block' }}>{table.company_name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>{table.branch_name || 'Global'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            style={{...(styles.addButton), backgroundColor: '#3498db', padding: '6px 12px', fontSize: '0.85rem', marginBottom: 0}}
                            onClick={() => handleViewTable(table)}
                            title="View / Arrange Layout"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            style={{...(styles.addButton), backgroundColor: '#f39c12', padding: '6px 12px', fontSize: '0.85rem', marginBottom: 0}}
                            onClick={() => openEditModal(table)}
                            title="Edit Details"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            style={{...(styles.deleteButton), padding: '6px 12px', fontSize: '0.85rem'}}
                            onClick={() => handleDelete(table.table_number, table.floor, table.branch_name, table._id)}
                            title="Delete Table"
                            disabled={loading}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.noTables}>
                {selectedFloor ? `No tables found on ${formatFloor(selectedFloor)}.` : "No tables added yet."}
              </p>
            )}
          </div>
        </div>
        <div style={styles.floorPlan}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid #eee', position: 'absolute', top: 0, width: '100%', zIndex: 5, fontSize: '0.85rem', color: '#7f8c8d' }}>
            <i className="fas fa-info-circle"></i> <strong>Layout:</strong> {formatFloor(selectedFloor)} | {selectedBranch || 'Global'}
          </div>
          {filteredTables
            .map((table) => (

              <TableItem
                key={table._id || `${table.floor}-${table.table_number}-${table.branch_name}`}

                table={table}
                onSavePosition={(tn, fl, x, y, br, co) => updateTablePosition(tn, fl, x, y, br, co, table._id)}
                onSelect={(tn, fl, br, id) => { 
                  setSelectedTableNumber(tn);
                  setSelectedTableBranch(br);
                  setSelectedTableId(id);
                }} 
              />
            ))}
          {selectedTableNumber && selectedTable && (
            <div style={styles.sidebar}>
              <h3 style={styles.sidebarHeading}>Table Shape</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                {tableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChangeType(type)}
                    style={{
                      ...styles.typeButton,
                      width: '100%',
                      ...(selectedTable.type === type ? styles.typeButtonSelected : styles.typeButtonNormal),
                    }}
                  >
                    <div style={styles.typeIcon}>{getTypeIcon(type)}</div>
                    <span>{type}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {setSelectedTableNumber(null); setSelectedTableId(null); setSelectedTableBranch(null);}}
                style={{ marginTop: '20px', width: '100%', padding: '8px', background: '#ecf0f1', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalHeading}>Add New Table</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalFormGroup}>
                <label htmlFor="floor" style={styles.modalLabel}>Floor *</label>
                <input
                  list="floors"
                  type="text"
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. Ground Floor, 1, 2"
                  style={styles.modalInput}
                  required
                />
                <datalist id="floors">
                  {uniqueFloors.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              
              {/* COMPANY ASSIGNMENT */}
              {(isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0 && (
                <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBuilding style={{ color: '#3b82f6' }} /> Company Assignment *
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {allCompanies.map((comp, idx) => {
                      const isSel = selectedCompanies.includes(comp);
                      return (
                        <div key={idx} onClick={() => setSelectedCompanies(prev => isSel ? prev.filter(c => c !== comp) : [...prev, comp])} style={{ border: `1.5px solid ${isSel ? '#3b82f6' : '#e2e8f0'}`, padding: '10px', borderRadius: '12px', backgroundColor: isSel ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSel} readOnly style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{comp}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BRANCH ASSIGNMENT */}
              {(isGroupAdmin || isCompanyAdmin) && selectedCompanies.length > 0 && getBranchesForCompanies(selectedCompanies).length > 0 && (
                <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMapMarkerAlt style={{ color: '#22c55e' }} /> Branch Assignment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {getBranchesForCompanies(selectedCompanies).map((br, idx) => {
                      const isSel = selectedAddBranches.includes(br);
                      return (
                        <div key={idx} onClick={() => setSelectedAddBranches(prev => isSel ? prev.filter(b => b !== br) : [...prev, br])} style={{ border: `1.5px solid ${isSel ? '#22c55e' : '#e2e8f0'}`, padding: '10px', borderRadius: '12px', backgroundColor: isSel ? '#dcfce7' : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSel} readOnly style={{ width: '16px', height: '16px', accentColor: '#22c55e', cursor: 'pointer' }} />
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{br}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              <div style={styles.modalFormGroup}>
                <label htmlFor="tableNumber" style={styles.modalLabel}>Table Number *</label>
                <input
                  type="text"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter table number"
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.modalFormGroup}>
                <label htmlFor="numberOfChairs" style={styles.modalLabel}>Number of Chairs *</label>
                <input
                  type="number"
                  id="numberOfChairs"
                  value={numberOfChairs}
                  onChange={(e) => setNumberOfChairs(e.target.value)}
                  placeholder="Enter number of chairs"
                  min="1"
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.modalButtons}>
                <button type="button" style={styles.modalCancelButton} onClick={closeModal}>Cancel</button>
                <button type="submit" disabled={loading} style={{...styles.modalSaveButton, opacity: loading ? 0.7 : 1}}>
                  {loading ? "Processing..." : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalHeading}>Edit Table</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Floor *</label>
                <input
                  type="text"
                  value={editFloor}
                  onChange={(e) => setEditFloor(e.target.value)}
                  style={styles.modalInput}
                  required
                />
              </div>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Table Number *</label>
                <input
                  type="text"
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value.replace(/\D/g, ""))}
                  style={styles.modalInput}
                  required
                />
              </div>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>Number of Chairs *</label>
                <input
                  type="number"
                  value={editChairs}
                  onChange={(e) => setEditChairs(e.target.value)}
                  min="1"
                  style={styles.modalInput}
                  required
                />
              </div>

              
              {/* COMPANY ASSIGNMENT */}
              {(isGroupAdmin || isCompanyAdmin) && allCompanies.length > 0 && (
                <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e3a8a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBuilding style={{ color: '#3b82f6' }} /> Company Assignment *
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {allCompanies.map((comp, idx) => {
                      const isSel = editCompanies.includes(comp);
                      return (
                        <div key={idx} onClick={() => setEditCompanies(prev => isSel ? prev.filter(c => c !== comp) : [...prev, comp])} style={{ border: `1.5px solid ${isSel ? '#3b82f6' : '#e2e8f0'}`, padding: '10px', borderRadius: '12px', backgroundColor: isSel ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSel} readOnly style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{comp}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BRANCH ASSIGNMENT */}
              {(isGroupAdmin || isCompanyAdmin) && editCompanies.length > 0 && getBranchesForCompanies(editCompanies).length > 0 && (
                <div style={{ marginBottom: '20px', background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMapMarkerAlt style={{ color: '#22c55e' }} /> Branch Assignment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {getBranchesForCompanies(editCompanies).map((br, idx) => {
                      const isSel = editBranches.includes(br);
                      return (
                        <div key={idx} onClick={() => setEditBranches(prev => isSel ? prev.filter(b => b !== br) : [...prev, br])} style={{ border: `1.5px solid ${isSel ? '#22c55e' : '#e2e8f0'}`, padding: '10px', borderRadius: '12px', backgroundColor: isSel ? '#dcfce7' : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={isSel} readOnly style={{ width: '16px', height: '16px', accentColor: '#22c55e', cursor: 'pointer' }} />
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{br}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              <div style={styles.modalButtons}>

                <button type="button" style={styles.modalCancelButton} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} style={{...styles.modalSaveButton, backgroundColor: '#f39c12'}}>
                  {loading ? "Updating..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddTablePage;
