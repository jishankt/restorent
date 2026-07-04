// Table.jsx (full updated code with system settings integration for currency and date/time)
import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./table.css";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center mt-5 text-danger">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "Unknown error occurred."}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
function Table() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const { baseUrl, configLoading, setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const [vatRate, setVatRate] = useState(0.10); // Initial value, will be fetched
  const [bookedTables, setBookedTables] = useState(() => {
    const saved = localStorage.getItem("bookedTables");
    return saved ? JSON.parse(saved) : [];
  });
  const [bookedChairs, setBookedChairs] = useState(() => {
    const saved = localStorage.getItem("bookedChairs");
    return saved ? JSON.parse(saved) : {};
  });
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem("reservations");
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      const validReservations = parsed.filter((res) => {
        const isValid =
          res &&
          res.tableNumber &&
          res.customerName &&
          res.phoneNumber &&
          res.email &&
          res.date &&
          res.startTime &&
          res.endTime &&
          Array.isArray(res.chairs) &&
          typeof res.startTime === "string" &&
          typeof res.endTime === "string" &&
          res.startTime.match(/^\d{2}:\d{2}$/) &&
          res.endTime.match(/^\d{2}:\d{2}$/);
        if (!isValid) {
          console.warn("Invalid reservation filtered out:", res);
        }
        return isValid;
      });
      return validReservations;
    } catch (e) {
      console.error("Error parsing reservations from localStorage:", e);
      return [];
    }
  });
  const [verifiedReservations, setVerifiedReservations] = useState(() => {
    const saved = localStorage.getItem("verifiedReservations");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedChairs, setSelectedChairs] = useState({});
  const [uniqueFloors, setUniqueFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  // Verification states
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState("");
  const [bookedGroups, setBookedGroups] = useState([]);
  const [paidGroups, setPaidGroups] = useState(() => {
    const saved = localStorage.getItem("paidOrders");
    return saved ? JSON.parse(saved) : [];
  });
  const [grandTotal, setGrandTotal] = useState(0);
  const [scale, setScale] = useState(1);
  const floorPlanRef = useRef(null);
  // New states for popup and search
  const [showListPopup, setShowListPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [localSavedOrders, setLocalSavedOrders] = useState(() => {
    const saved = localStorage.getItem("savedOrders");
    return saved ? JSON.parse(saved) : [];
  }); // Added state for reactivity
  const { user } = useContext(UserContext); // Added user for order fetching

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const token = localStorage.getItem('token');
    const activeContext = localStorage.getItem('active_company');
    const activeBranchContext = localStorage.getItem('active_branch');
    
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : {};
    
    const defaultCompany = userObj.company_name || userObj.company;
    const resolvedCompany = (activeContext && activeContext !== 'All') ? activeContext : defaultCompany;
    if (resolvedCompany) headers['X-Company-Name'] = resolvedCompany;
    
    const branchToUse = (activeBranchContext && activeBranchContext !== 'All Branches' && activeBranchContext !== 'All') ? activeBranchContext : (userObj.branch_name || userObj.branch || null);
    if (branchToUse && branchToUse !== 'All Branches') headers['X-Branch-Name'] = branchToUse;
    
    return headers;
  };
  // Currency state copied from Front.jsx
  const [currency, setCurrency] = useState("INR");
  const [useCurrencySymbol, setUseCurrencySymbol] = useState(false);

  // Maps currency codes to symbols; defaults to INR symbol if no currency or invalid
  const getCurrencySymbol = (currCode) => {
    const symbols = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      AED: "د.إ",
      JPY: "¥",
      CNY: "¥",
      SGD: "$",
      MYR: "RM",
      THB: "฿",
      IDR: "Rp",
      KRW: "₩",
      PHP: "₱",
      SAR: "﷼",
      QAR: "﷼",
      KWD: "د.ك",
      OMR: "﷼",
      BHD: ".د.ب",
      CAD: "$",
      AUD: "$",
      NZD: "$",
      CHF: "CHF",
      ZAR: "R",
      BRL: "R$",
      PKR: "₨",
      LKR: "Rs",
      NGN: "₦"
    };
    return symbols[currCode?.toUpperCase()] || '₹';
  };

  const formatPrice = (price) => {
    const symbol = useCurrencySymbol ? getCurrencySymbol(currency) : `${currency} `;
    if (isNaN(price) || price === 0) return `${symbol}0.00`;
    return `${symbol}${price.toFixed(2)}`;
  };

  // Keep settings for Date Format if needed, or remove if unused. 
  // User only asked for currency, but code uses settings.dateFormat below.
  // We keep settings state for dateFormat but remove currency related parts if distinct, 
  // or just ignore them.
  const [settings, setSettings] = useState({
    dateFormat: 'dd-mm-yyyy', // Default or from localStorage
  });

  // Dynamic date formatting based on system settings
  const getFormattedDate = (date, dateFormat) => {
    if (!dateFormat) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const numericFormatter = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: 'numeric' });
    const parts = numericFormatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    switch (dateFormat) {
      case 'dd-mm-yyyy': return `${day.padStart(2, '0')}-${month}-${year}`;
      case 'mm-dd-yyyy': return `${month}-${day.padStart(2, '0')}-${year}`;
      case 'yyyy-mm-dd': return `${year}-${month}-${day.padStart(2, '0')}`;
      case 'dd/mm/yyyy': return `${day.padStart(2, '0')}/${month}/${year}`;
      case 'mm/dd/yyyy': return `${month}/${day.padStart(2, '0')}/${year}`;
      case 'yyyy/mm/dd': return `${year}/${month}/${day.padStart(2, '0')}`;
      case 'yyyy-long-mm-dd': return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      case 'dd-MMM-yy':
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate().toString().padStart(2, '0');
        const yearShort = date.getFullYear().toString().slice(-2);
        return `${dayStr}-${monthShort}-${yearShort}`;
      default: return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const calculateOrderSubtotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => sum + (Number(item.exclTotal) || 0), 0);
  };
  const calculateOrderVat = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => sum + (Number(item.taxTotal) || 0), 0);
  };
  const calculateOrderGrandTotal = (cartItems) => {
    return calculateOrderSubtotal(cartItems) + calculateOrderVat(cartItems);
  };
  const calculateVatBreakdown = (cartItems) => {
    const breakdown = {};
    cartItems.forEach(item => {
      const excl = Number(item.exclTotal) || 0;
      const tax = Number(item.taxTotal) || 0;
      if (excl > 0) {
        const ratePercent = Math.round((tax / excl) * 100);
        if (!breakdown[ratePercent]) breakdown[ratePercent] = 0;
        breakdown[ratePercent] += tax;
      }
    });
    return breakdown;
  };

  useEffect(() => {
    // UPDATED: Robust floor and booking sync
    // We derive floor from tables if it's missing or N/A
    const getDerivedFloor = (tableNum) => {
      const table = tables.find(t => String(t.table_number) === String(tableNum));
      return table ? table.floor : null;
    };

    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];

    // Process all orders to ensure floor is set correctly
    const allProcessedOrders = [...savedOrders, ...paidOrders].map(order => {
      let floor = order.floor;
      if (!floor || floor === "N/A") {
        floor = getDerivedFloor(order.tableNumber);
      }
      return { ...order, floor };
    });

    const activeOrders = allProcessedOrders.filter(order => String(order.floor) === String(selectedFloor) && !order.paid);
    const activePaidOrders = allProcessedOrders.filter(order => String(order.floor) === String(selectedFloor) && !order.paid);
    const allFloorOrders = [...activeOrders, ...activePaidOrders];

    const booked = [...new Set(allFloorOrders.map((order) => order.tableNumber).filter(Boolean))];
    setBookedTables(booked);

    const updatedBookedChairs = {};
    allFloorOrders.forEach((order) => {
      const tableNum = String(order.tableNumber);
      const chairs = Array.isArray(order.chairsBooked) ? order.chairsBooked : [];
      if (tableNum && tableNum !== "N/A") {
        if (!updatedBookedChairs[tableNum]) updatedBookedChairs[tableNum] = [];
        updatedBookedChairs[tableNum] = [...new Set([...updatedBookedChairs[tableNum], ...chairs])].map(Number);
      }
    });
    setBookedChairs(updatedBookedChairs);

    setBookedGroups(localSavedOrders.filter(order => {
      const floor = order.floor || getDerivedFloor(order.tableNumber);
      return order.cartItems && order.cartItems.length > 0 && String(floor) === String(selectedFloor);
    }));
    setPaidGroups(paidOrders.filter(order => {
      const floor = order.floor || getDerivedFloor(order.tableNumber);
      return order.cartItems && order.cartItems.length > 0 && String(floor) === String(selectedFloor);
    }));
  }, [selectedFloor, tables, localSavedOrders]); // Depends on floor, tables, AND orders

  useEffect(() => {
    if (configLoading) return;
    const API_URL = baseUrl || "";

    const fetchVat = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/get-vat`, { headers: getHeaders() });
        setVatRate(response.data.vat / 100 || 0.1);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };

    const fetchCurrency = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings`, { headers: getHeaders() });
        const { currency: fetchedCurrency = "INR", useCurrencySymbol: fetchedUseSymbol = false } = response.data;
        setCurrency(fetchedCurrency.toUpperCase());
        setUseCurrencySymbol(fetchedUseSymbol);
        if (response.data) {
          setSettings((prev) => ({ ...prev, ...response.data }));
          localStorage.setItem('systemSettings', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Failed to fetch currency settings:", error);
        setCurrency("INR");
        const stored = localStorage.getItem('systemSettings');
        if (stored) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      }
    };

    const fetchTables = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/tables`, { headers: getHeaders() });
        const rawTables = response.data.message || [];
        const floors = [...new Set(rawTables.map(t => t.floor).filter(Boolean))];
        setUniqueFloors(floors);
        const sortedTables = [...rawTables].sort(
          (a, b) => parseInt(a.table_number) - parseInt(b.table_number)
        );
        setTables(sortedTables);
        if (floors.length > 0) {
          setSelectedFloor(current => current || floors[0]);
        }
      } catch (err) {
        setError("Error fetching tables: " + err.message);
      }
    };

    const fetchActiveOrders = async () => {
      try {
        const ordersResponse = await axios.get(`${API_URL}/api/activeorders`, {
          headers: getHeaders(),
          params: {
            userId: user?.userId || user?._id,
            role: user?.role
          }
        });
        const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
        localStorage.setItem("savedOrders", JSON.stringify(orders));
        setLocalSavedOrders(orders); // Trigger reactivity
      } catch (err) {
        console.error("Failed to fetch active orders in TableView:", err);
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchVat(),
          fetchCurrency(),
          fetchTables(),
          fetchActiveOrders()
        ]);
      } catch (err) {
        setError("Error loading data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Periodic synchronization
    const orderInterval = setInterval(fetchActiveOrders, 30000);

    // Cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === "savedOrders") {
        try {
          setLocalSavedOrders(JSON.parse(e.newValue) || []);
        } catch (err) {
          console.error("Error parsing sync savedOrders:", err);
        }
      }
      if (e.key === "paidOrders") {
        setTables(prev => [...prev]); // Trigger sync for paid orders if needed
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(orderInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [baseUrl, configLoading, user]);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const activeReservations = reservations.filter((res) => {
        if (!res.startTime || !res.endTime) {
          console.warn("Skipping invalid reservation in cleanup:", res);
          return false;
        }
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        return res.date > currentDate || (res.date === currentDate && currentTime <= endTime);
      });
      const activeVerifiedReservations = verifiedReservations.filter((vr) => {
        const res = activeReservations.find((r) => r.id === vr.reservationId);
        return !!res;
      });
      setReservations(activeReservations);
      setVerifiedReservations(activeVerifiedReservations);
      localStorage.setItem("reservations", JSON.stringify(activeReservations));
      localStorage.setItem("verifiedReservations", JSON.stringify(activeVerifiedReservations));
    }, 60000);
    return () => clearInterval(interval);
  }, [reservations, verifiedReservations]);
  // UPDATED: Use per-item VAT for grand total calculation (sum excl + sum tax across all filtered orders)
  useEffect(() => {
    const filteredGroups = [...bookedGroups, ...paidGroups].filter(order => {
      const table = tables.find(t => String(t.table_number) === String(order.tableNumber));
      return table && table.floor === selectedFloor;
    });
    const totalSubtotal = filteredGroups.reduce((sum, order) => {
      return sum + calculateOrderSubtotal(order.cartItems);
    }, 0);
    const totalVat = filteredGroups.reduce((sum, order) => {
      return sum + calculateOrderVat(order.cartItems);
    }, 0);
    const grandValue = totalSubtotal + totalVat;
    setGrandTotal(grandValue);
  }, [selectedFloor, tables, bookedGroups, paidGroups]);
  useEffect(() => {
    const updateScale = () => {
      if (floorPlanRef.current && tables.length > 0) {
        const filteredTables = tables.filter(table => table.floor === selectedFloor);
        if (filteredTables.length === 0) return;
        let maxX = 0, maxY = 0;
        filteredTables.forEach(table => {
          maxX = Math.max(maxX, (table.x || 0) + 240);
          maxY = Math.max(maxY, (table.y || 0) + 280);
        });
        const containerWidth = floorPlanRef.current.clientWidth;
        const containerHeight = floorPlanRef.current.clientHeight - 60; // Subtract legend height (approx 60px)
        const sX = containerWidth / maxX;
        const sY = containerHeight / maxY;
        setScale(Math.min(sX, sY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedFloor, tables]);
  const getActiveReservations = (tableNumber, date) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    return reservations.filter((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Invalid reservation data in getActiveReservations:", res);
        return false;
      }
      try {
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        const preReservationTime = startTime - 60;
        return (
          String(res.tableNumber) === String(tableNumber) &&
          res.floor === selectedFloor && // Check floor match
          res.date === date &&
          (date > now.toISOString().split("T")[0] ||
            (date === now.toISOString().split("T")[0] &&
              currentTime >= preReservationTime &&
              currentTime <= endTime))
        );
      } catch (e) {
        console.warn("Error processing reservation:", res, e);
        return false;
      }
    });
  };
  const getReservedChairNumbers = (tableNumber, date) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let reservedChairs = [];
    reservations.forEach((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Skipping invalid reservation in getReservedChairNumbers:", res);
        return;
      }
      try {
        const [startHour, startMinute] = res.startTime.split(":").map(Number);
        const [endHour, endMinute] = res.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        const preReservationTime = startTime - 60;
        if (
          String(res.tableNumber) === String(tableNumber) &&
          res.floor === selectedFloor && // Check floor match
          res.date === date &&
          (date > now.toISOString().split("T")[0] ||
            (date === now.toISOString().split("T")[0] &&
              currentTime >= preReservationTime &&
              currentTime <= endTime))
        ) {
          reservedChairs.push(...(Array.isArray(res.chairs) ? res.chairs : []));
        }
      } catch (e) {
        console.warn("Error processing reservation:", res, e);
      }
    });
    return reservedChairs;
  };
  const getAvailableChairNumbers = (tableNumber, totalChairs, date) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    // Ensure totalChairs is a valid number, default to 4 if missing/invalid (though DB should have it)
    const validTotalChairs = Number(totalChairs) || 4;

    const bookedChairsNumbers = Array.isArray(bookedChairs[tableNumber]) ? bookedChairs[tableNumber].map(Number) : [];
    const reservedChairNumbers = getReservedChairNumbers(tableNumber, date).map(Number);
    const occupiedChairs = [...new Set([...bookedChairsNumbers, ...reservedChairNumbers])];

    const availableChairs = [];
    for (let i = 1; i <= validTotalChairs; i++) {
      if (!occupiedChairs.includes(i)) {
        availableChairs.push(i);
      }
    }
    return availableChairs;
  };
  const getChairStatus = (table, chairNumber, date) => {
    const tableNumber = parseInt(table.table_number);
    const booked = Array.isArray(bookedChairs[tableNumber]) && bookedChairs[tableNumber].map(Number).includes(Number(chairNumber));
    const reserved = getReservedChairNumbers(tableNumber, date).includes(Number(chairNumber));

    // Strict availability check: must be within table's capacity AND not occupied
    const isWithinCapacity = Number(chairNumber) <= (Number(table.number_of_chairs) || 4);

    if (booked) return "booked";
    if (reserved) return "reserved";
    if (!booked && !reserved && isWithinCapacity) return "available";

    return "unknown"; // Should not happen for valid chairs
  };
  const handleChairClick = (tableNumber, chairNumber, status) => {
    if (status === "reserved") {
      const reservation = reservations.find(
        (res) =>
          String(res.tableNumber) === String(tableNumber) &&
          Array.isArray(res.chairs) &&
          res.chairs.includes(chairNumber)
      );
      if (reservation) handleReservedChairClick(reservation);
    } else if (status === "booked") {
      const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
      const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];
      const allOrders = [...savedOrders, ...paidOrders];
      const order = allOrders.find(
        (order) =>
          String(order.tableNumber) === String(tableNumber) &&
          order.floor === selectedFloor && // ADDED: Check floor
          Array.isArray(order.chairsBooked) &&
          order.chairsBooked.includes(chairNumber)
      );
      if (order) handleViewOrder(tableNumber, order.chairsBooked);
    } else if (status === "available") {
      setSelectedChairs((prev) => {
        const updated = { ...prev };
        if (!updated[tableNumber]) {
          updated[tableNumber] = [];
        }
        if (updated[tableNumber].includes(chairNumber)) {
          updated[tableNumber] = updated[tableNumber].filter((c) => c !== chairNumber);
          if (updated[tableNumber].length === 0) {
            delete updated[tableNumber];
          }
        } else {
          updated[tableNumber] = [...new Set([...updated[tableNumber], chairNumber])];
        }
        return updated;
      });
    }
  };
  // UPDATED: Preserve and set exclTotal/taxTotal if missing (to match ActiveOrders sanitization)
  const ensureItemTotals = (item, vatRate) => {
    if (Number(item.exclTotal) > 0 && Number(item.taxTotal) > 0) return item; // Already set
    const basePrice = Number(item.basePrice) || 0;
    const qty = Number(item.quantity) || 1;
    const addonTotal = Object.entries(item.addonQuantities || {}).reduce((sum, [name, q]) => sum + (Number(item.addonPrices?.[name] || 0) * (Number(q) || 0)), 0);
    const comboTotal = Object.entries(item.comboQuantities || {}).reduce((sum, [name, q]) => sum + (Number(item.comboPrices?.[name] || 0) * (Number(q) || 0)), 0);
    const mainExcl = (basePrice * qty) + addonTotal + comboTotal;
    const tax = mainExcl * vatRate;
    return {
      ...item,
      exclTotal: mainExcl,
      taxTotal: tax,
      totalPrice: mainExcl + tax,
    };
  };
  // UPDATED: In handleViewOrder, ensure totals are set for cartItems
  const handleViewOrder = (tableNumber, chairsBooked) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];
    const allOrders = [...savedOrders, ...paidOrders];
    const existingOrder = allOrders.find(
      (order) =>
        String(order.tableNumber) === String(tableNumber) &&
        order.floor === selectedFloor && // ADDED: Check floor
        Array.isArray(order.chairsBooked) &&
        order.chairsBooked.some((chair) => chairsBooked.includes(chair))
    );
    if (!existingOrder) {
      setWarningMessage("No existing order found for this table and chairs.");
      return;
    }
    const formattedCartItems = existingOrder.cartItems.map((item) => ensureItemTotals({
      ...item,
      id: item.id || uuidv4(),
      item_name: item.item_name || item.name,
      name: item.name || item.item_name,
      quantity: Number(item.quantity) || 1,
      basePrice: Number(item.basePrice) || (Number(item.totalPrice) / (Number(item.quantity) || 1)) || 0,
      totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0,
      selectedSize: item.selectedSize || "M",
      icePreference: item.icePreference || "without_ice",
      icePrice: Number(item.icePrice) || 0,
      isSpicy: item.isSpicy || false,
      spicyPrice: Number(item.spicyPrice) || 0,
      kitchen: item.kitchen || "Main Kitchen",
      addonQuantities: item.addonQuantities || {},
      addonVariants: item.addonVariants || {},
      addonPrices: item.addonPrices || {},
      addonSizePrices: item.addonSizePrices || {},
      addonSpicyPrices: item.addonSpicyPrices || {},
      addonImages: item.addonImages || {},
      comboQuantities: item.comboQuantities || {},
      comboVariants: item.comboVariants || {},
      comboPrices: item.comboPrices || {},
      comboSizePrices: item.comboSizePrices || {},
      comboSpicyPrices: item.comboSpicyPrices || {},
      comboImages: item.comboImages || {},
      selectedCombos: item.selectedCombos || [],
      ingredients: item.ingredients || [],
      selectedCustomVariants: item.selectedCustomVariants || {},
      customVariantsDetails: item.customVariantsDetails || {},
      customVariantsQuantities: item.customVariantsQuantities || {},
      image: item.image || "/static/images/default-item.jpg",
    }, vatRate));
    setCartItems(formattedCartItems);
    localStorage.setItem('selectedOrderType', 'Dine In');
    navigate(`/frontpage`, {
      state: {
        tableNumber: existingOrder.tableNumber,
        floor: selectedFloor, // ADDED: Floor context
        chairsBooked: existingOrder.chairsBooked,
        existingOrder: {
          ...existingOrder,
          cartItems: formattedCartItems,
          orderId: existingOrder.orderId || uuidv4(),
        },
        orderType: "Dine In",
        cartItems: formattedCartItems,
        phoneNumber: existingOrder.phoneNumber || "",
        customerName: existingOrder.customerName || "",
        deliveryAddress: existingOrder.deliveryAddress || { building_name: "", flat_villa_no: "", location: "" },
        whatsappNumber: existingOrder.whatsappNumber || "",
        email: existingOrder.email || "",
      },
    });
  };
  const handleBookTable = (tableNumber, chairsBooked) => {
    // Optimistically update local state for immediate UI feedback
    const updatedBookedChairs = { ...bookedChairs };
    if (!updatedBookedChairs[tableNumber]) {
      updatedBookedChairs[tableNumber] = [];
    }
    updatedBookedChairs[tableNumber] = [
      ...new Set([...updatedBookedChairs[tableNumber], ...chairsBooked]),
    ];
    setBookedChairs(updatedBookedChairs);

    const updatedBookedTables = [...new Set([...bookedTables, tableNumber])];
    setBookedTables(updatedBookedTables);

    // Create new order with floor context
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const newOrder = {
      tableNumber,
      floor: selectedFloor, // ADDED: Floor context
      chairsBooked: Array.isArray(chairsBooked) ? chairsBooked : [],
      cartItems: [],
      timestamp: new Date().toISOString(),
      orderType: "Dine In",
      customerName: "",
      phoneNumber: "",
      email: "",
      whatsappNumber: "",
      deliveryAddress: { building_name: "", flat_villa_no: "", location: "" },
      orderId: uuidv4(),
      paid: false,
    };
    savedOrders.push(newOrder);
    localStorage.setItem("savedOrders", JSON.stringify(savedOrders));

    // Cleanup and navigate
    setBookedGroups(savedOrders.filter(order => order.cartItems && order.cartItems.length > 0 && order.floor === selectedFloor));
    setCartItems([]);
    setSelectedChairs({});
    localStorage.setItem('selectedOrderType', 'Dine In');
    navigate(`/frontpage`, {
      state: {
        tableNumber,
        floor: selectedFloor, // ADDED: Floor context
        chairsBooked,
        orderType: "Dine In",
        cartItems: [],
      },
    });
  };
  const handleReservedChairClick = (reservation) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];
    const allOrders = [...savedOrders, ...paidOrders];
    const reservationOrders = allOrders.filter(
      (order) =>
        String(order.tableNumber) === String(reservation.tableNumber) &&
        order.floor === reservation.floor && // ADDED: Check floor (assuming reservation has floor from getActiveReservations)
        Array.isArray(order.chairsBooked) &&
        order.chairsBooked.some((chair) => reservation.chairs.includes(chair))
    );
    if (reservationOrders.length > 0) {
      handleViewOrder(reservation.tableNumber, reservationOrders[0].chairsBooked);
    } else {
      const isVerified = verifiedReservations.some(
        (vr) => vr.reservationId === reservation.id
      );
      if (isVerified) {
        setCartItems([]);
        localStorage.setItem('selectedOrderType', 'Dine In');
        navigate(`/frontpage`, {
          state: {
            tableNumber: reservation.tableNumber,
            chairsBooked: Array.isArray(reservation.chairs) ? reservation.chairs : [],
            orderType: "Dine In",
            cartItems: [],
            customerName: reservation.customerName,
            phoneNumber: reservation.phoneNumber,
            email: reservation.email,
          },
        });
      } else {
        setSelectedReservation(reservation);
        setShowVerifyPopup(true);
        setSelectedCustomer("");
        setVerifyPhoneNumber("");
      }
    }
  };
  const handleVerifyCustomer = () => {
    if (!selectedReservation) return;
    if (
      selectedCustomer.trim() === selectedReservation.customerName &&
      verifyPhoneNumber === selectedReservation.phoneNumber
    ) {
      const updatedVerifiedReservations = [
        ...verifiedReservations,
        { reservationId: selectedReservation.id },
      ];
      setVerifiedReservations(updatedVerifiedReservations);
      localStorage.setItem(
        "verifiedReservations",
        JSON.stringify(updatedVerifiedReservations)
      );
      setShowVerifyPopup(false);
      setSelectedReservation(null);
      setCartItems([]);
      localStorage.setItem('selectedOrderType', 'Dine In');
      navigate(`/frontpage`, {
        state: {
          tableNumber: selectedReservation.tableNumber,
          chairsBooked: Array.isArray(selectedReservation.chairs) ? selectedReservation.chairs : [],
          orderType: "Dine In",
          cartItems: [],
          customerName: selectedReservation.customerName,
          phoneNumber: selectedReservation.phoneNumber,
          email: selectedReservation.email,
        },
      });
    } else {
      setWarningMessage("Verification failed. Please check the customer name and phone number.");
    }
  };
  const handleGoToOrder = () => {
    const tableNumbers = Object.keys(selectedChairs);
    if (tableNumbers.length !== 1) {
      setWarningMessage("Please select chairs from exactly one table.");
      return;
    }
    const tableNumber = tableNumbers[0];
    const chairsBooked = selectedChairs[tableNumber];
    handleBookTable(tableNumber, chairsBooked);
  };
  // Assume this function is called after payment success from another component or event
  const handlePaymentSuccess = (tableNumber, chairsPaid) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const updatedSavedOrders = savedOrders.map((order) => {
      if (order.tableNumber === tableNumber && order.floor === selectedFloor && order.chairsBooked.every(chair => chairsPaid.includes(chair))) {
        return { ...order, paid: true };
      }
      return order;
    });
    localStorage.setItem("savedOrders", JSON.stringify(updatedSavedOrders));
    setBookedGroups(updatedSavedOrders.filter(order => order.cartItems && order.cartItems.length > 0));
    const paidOrder = updatedSavedOrders.find(order => order.tableNumber === tableNumber && order.paid);
    if (paidOrder) {
      paidOrders.push(paidOrder);
      localStorage.setItem("paidOrders", JSON.stringify(paidOrders));

      const floorPaidOrders = paidOrders.filter(o => o.floor === selectedFloor);
      setPaidGroups(floorPaidOrders);

      const remainingSavedOrders = updatedSavedOrders.filter(order => !order.paid);
      localStorage.setItem("savedOrders", JSON.stringify(remainingSavedOrders));

      const floorBookedOrders = remainingSavedOrders.filter(order => order.cartItems && order.cartItems.length > 0 && order.floor === selectedFloor);
      setBookedGroups(floorBookedOrders);
    }
  };

  // New function to handle table deletion
  const handleDeleteTable = async (tableNumber, floor) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableNumber} on floor ${floor}?`)) return;
    try {
      const API_URL = baseUrl || "";
      await axios.delete(`${API_URL}/api/tables/${tableNumber}`, {
        headers: getHeaders(),
        data: { floor }
      });
      setWarningMessage(`Table ${tableNumber} deleted successfully.`);
      // Refresh tables list
      const response = await axios.get(`${API_URL}/api/tables`, { headers: getHeaders() });
      const rawTables = response.data.message || [];
      const sortedTables = [...rawTables].sort(
        (a, b) => parseInt(a.table_number) - parseInt(b.table_number)
      );
      setTables(sortedTables);
    } catch (err) {
      console.error("Error deleting table:", err);
      setWarningMessage("Failed to delete table: " + (err.response?.data?.error || err.message));
    }
  };

  const totalSelectedChairs = Object.values(selectedChairs).reduce(
    (sum, chairs) => sum + (Array.isArray(chairs) ? chairs.length : 0),
    0
  );
  // Styles moved to table.css
  // Default chair positions based on table type (copied from AddTablePage for fallback)
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
  const TableItem = ({ table, onChairClick }) => {
    const currentDate = new Date().toISOString().split("T")[0];
    const centerX = 120;
    const centerY = 140;
    const radius = 80;
    const chairSize = 24;
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
    // Use stored chair positions or fallback to default
    // Use stored chair positions or fallback to default
    // UPDATED: calculate capacity from chairs array if present
    const capacity = (Array.isArray(table.chairs) && table.chairs.length > 0) ? table.chairs.length : table.number_of_chairs;
    const chairPositions = table.chairs || getDefaultChairPositions(
      table.type || "Round",
      capacity,
      centerX,
      centerY,
      radius,
      chairSize
    );
    return (
      <div
        className="table-container"
        style={{
          left: `${table.x || 0}px`,
          top: `${table.y || 0}px`,
          width: "240px",
          height: "280px",
          position: "absolute",
        }}
      >
        <div
          className="table-shape"
          style={{
            width: tableWidth,
            height: tableHeight,
            borderRadius: tableBorderRadius,
          }}
        />
        {chairPositions.map((chairPos, i) => {
          const chairNumber = i + 1;
          const status = getChairStatus(table, chairNumber, currentDate);
          const isSelected = selectedChairs[table.table_number]?.includes(chairNumber) || false;
          return (
            <img
              key={i}
              src="/menuIcons/chair.svg"
              alt="Chair"
              className={`chair ${status} ${isSelected ? "selected" : ""}`}
              style={{
                left: `${chairPos.x - chairSize / 2}px`,
                top: `${chairPos.y - chairSize / 2}px`,
                position: 'absolute',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => onChairClick(table.table_number, chairNumber, status)}
              title={`Chair ${chairNumber} - ${status}`}
            />
          );
        })}
        <div className="table-label">Table {table.table_number}</div>
      </div>
    );
  };
  if (loading) return <div className="text-center mt-5">Loading tables...</div>;
  if (error)
    return <div className="text-center mt-5 text-danger">Error: {error}</div>;
  const filteredGroups = [...bookedGroups, ...paidGroups].filter(order => {
    const table = tables.find(t => String(t.table_number) === String(order.tableNumber));
    return table && table.floor === selectedFloor;
  });
  const currentDate = new Date().toISOString().split("T")[0];
  const filteredReservations = reservations.filter(res => {
    const table = tables.find(t => String(t.table_number) === String(res.tableNumber));
    if (!res.startTime || !res.endTime || !table || table.floor !== selectedFloor || res.date !== currentDate) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = res.startTime.split(":").map(Number);
    const [endHour, endMinute] = res.endTime.split(":").map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const preReservationTime = startTime - 60;
    return currentTime >= preReservationTime && currentTime <= endTime;
  });

  // UPDATED: Filter tables and ensure deduplication for visualization to avoid overlaps
  const filteredTables = tables.filter((table) => table.floor === selectedFloor);
  const deduplicatedTables = (() => {
    const tableMap = new Map();
    filteredTables.forEach(t => {
      // Pick the latest added table if duplicates exist for same floor/number
      tableMap.set(String(t.table_number), t);
    });
    return Array.from(tableMap.values());
  })();

  const getMainItemTotal = (item) => {
    const mainItemPrice = (item.basePrice || 0) + (item.icePrice || 0) + (item.spicyPrice || 0) + getCustomVariantsTotal(item);
    return mainItemPrice * (item.quantity || 1);
  };
  const getCustomVariantsTotal = (item) => {
    if (!item.customVariantsDetails || !item.customVariantsQuantities) return 0;
    return Object.entries(item.customVariantsDetails).reduce((sum, [variantName, variant]) => {
      const qty = item.customVariantsQuantities[variantName] || 1;
      return sum + (variant.price || 0) * qty;
    }, 0);
  };
  const getAddonsTotal = (item) => {
    if (!item.addonQuantities || !item.addonPrices) return 0;
    return Object.entries(item.addonQuantities).reduce((sum, [addonName, qty]) => {
      const price = item.addonPrices[addonName] || 0;
      return sum + price * qty;
    }, 0);
  };
  const getCombosTotal = (item) => {
    if (!item.comboQuantities || !item.comboPrices) return 0;
    return Object.entries(item.comboQuantities).reduce((sum, [comboName, qty]) => {
      const price = item.comboPrices[comboName] || 0;
      return sum + price * qty;
    }, 0);
  };
  // Combine booked and paid groups with floor info
  const allGroups = [...bookedGroups, ...paidGroups].map(order => {
    const table = tables.find(t => String(t.table_number) === String(order.tableNumber));
    return { ...order, floor: table ? table.floor : 'Unknown' };
  });
  // Combine reservations with floor info
  const allReservations = reservations.map(res => {
    const table = tables.find(t => String(t.table_number) === String(res.tableNumber));
    return { ...res, floor: table ? table.floor : 'Unknown' };
  });
  // Filter based on search query
  const searchedGroups = allGroups.filter(order => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      order.floor.toLowerCase().includes(lowerQuery) ||
      String(order.tableNumber).includes(lowerQuery) ||
      order.customerName.toLowerCase().includes(lowerQuery)
    );
  });
  const searchedReservations = allReservations.filter(res => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      res.floor.toLowerCase().includes(lowerQuery) ||
      String(res.tableNumber).includes(lowerQuery) ||
      res.customerName.toLowerCase().includes(lowerQuery)
    );
  });
  const searchedTables = tables.filter(t => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      String(t.table_number).includes(lowerQuery) ||
      t.floor.toLowerCase().includes(lowerQuery)
    );
  });
  const formattedGrandTotal = formatPrice(grandTotal);
  return (
    <ErrorBoundary>
      <div className="table-page-container">
        {/* Sidebar */}
        <div className="sidebar">

          <div className="sidebar-header" style={{ marginTop: '15px' }}>
            <div style={{ background: '#00acc1', padding: '8px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.2rem', marginLeft: '10px' }}>Floor Plans</h2>
          </div>

          <div className="sidebar-content">

            {/* Floor Buttons */}
            <div className="floor-buttons-section">
              {uniqueFloors.map((floor) => (
                <button
                  key={floor}
                  className={`app-btn ${selectedFloor === floor ? 'app-btn-active' : 'app-btn-secondary'}`}
                  onClick={() => setSelectedFloor(floor)}
                  style={{ marginBottom: '10px' }}
                >
                  Floor {floor}
                </button>
              ))}
            </div>

            <button className="app-btn view-list-btn" onClick={() => setShowListPopup(true)}>
              <span style={{ marginRight: '8px' }}>☰</span> View List
            </button>
            {totalSelectedChairs > 0 && (
              <button
                className="app-btn app-btn-primary mt-2"
                style={{ background: '#28a745' }}
                onClick={handleGoToOrder}
              >
                Go to Order ({totalSelectedChairs})
              </button>
            )}

          </div>

          {/* Grand Total */}
          <div className="grand-total-section">
            <div className="grand-total-card">
              <span className="grand-total-label">GRAND TOTAL</span>
              <span className="grand-total-amount">{formattedGrandTotal}</span>
            </div>
          </div>
        </div>

        {/* Main Content (Floor Plan) */}
        <div className="main-content" ref={floorPlanRef}>

          {/* Top Legend Row */}
          <div className="legend-card">
            <div className="legend-title">CHAIR STATUS</div>
            <div className="legend-item"><div className="legend-color legend-red"></div> Booked</div>
            <div className="legend-item"><div className="legend-color legend-pink"></div> Reserved</div>
            <div className="legend-item"><div className="legend-color legend-green"></div> Available</div>
            <div className="legend-item"><div className="legend-color legend-blue"></div> Selected</div>
          </div>

          {/* Floor Plan Visualization */}
          <div className="floor-plan-container" style={{ width: '100%', height: '100%' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', width: '100%', height: '100%' }}>
              {deduplicatedTables.map((table) => (
                <TableItem
                  key={table._id || `${table.floor}-${table.table_number}`}
                  table={table}
                  onChairClick={handleChairClick}
                />
              ))}
            </div>
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: 'fit-content' }}>
              <div className="alert alert-warning alert-dismissible fade show" role="alert">
                {warningMessage}
                <button type="button" className="btn-close" onClick={() => setWarningMessage("")} aria-label="Close"></button>
              </div>
            </div>
          )}
        </div>

        {/* Popups */}
        {showVerifyPopup && selectedReservation && (
          <div className="popup-overlay">
            <div className="popup-content" style={{ maxWidth: '500px' }}>
              <div className="popup-header">
                <h3>Verify Customer</h3>
                <button className="popup-close-btn" onClick={() => setShowVerifyPopup(false)}>×</button>
              </div>
              <div className="mb-3">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-control" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" value={verifyPhoneNumber} onChange={(e) => setVerifyPhoneNumber(e.target.value)} />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary" onClick={() => setShowVerifyPopup(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleVerifyCustomer}>Verify</button>
              </div>
            </div>
          </div>
        )}

        {showListPopup && (
          <div className="popup-overlay">
            <div className="popup-content" style={{ width: '900px', maxWidth: '95%' }}>
              <div className="popup-header">
                <h3>Booked, Reserved, and All Tables</h3>
                <button className="popup-close-btn" onClick={() => setShowListPopup(false)}>×</button>
              </div>
              <div className="list-content-scrollable">
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search by table, floor, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {!selectedOrder ? (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <h5 className="fw-bold border-bottom pb-2">All Configured Tables</h5>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Floor</th>
                              <th>Table No</th>
                              <th>Chairs</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchedTables.length > 0 ? searchedTables.map((t, idx) => (
                              <tr key={t._id || idx}>
                                <td>{t.floor}</td>
                                <td>{t.table_number}</td>
                                <td>{t.number_of_chairs}</td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTable(t.table_number, t.floor);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            )) : <tr><td colSpan="4" className="text-center text-muted">No tables found.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <h5 className="fw-bold border-bottom pb-2">Active Bookings</h5>
                      <div className="row g-2">
                        {searchedGroups.length > 0 ? searchedGroups.map((order, idx) => (
                          <div key={idx} className="col-12">
                            <div className="list-card p-3 shadow-sm border" onClick={() => setSelectedOrder(order)}>
                              <strong>Table {order.tableNumber} ({order.floor})</strong>
                              <div>{order.customerName || 'Walk-in'}</div>
                              <div className="small text-muted">{order.chairsBooked?.length} Chairs • {formatPrice(calculateOrderGrandTotal(order.cartItems))}</div>
                            </div>
                          </div>
                        )) : <p className="text-muted">No active bookings.</p>}
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <h5 className="fw-bold border-bottom pb-2">Today's Reservations</h5>
                      <div className="row g-2">
                        {searchedReservations.length > 0 ? searchedReservations.map((res, idx) => (
                          <div key={idx} className="col-12">
                            <div className="list-card p-3 shadow-sm border" onClick={() => setSelectedOrder(res)}>
                              <strong>Table {res.tableNumber} - {res.startTime} ({res.floor})</strong>
                              <div>{res.customerName}</div>
                              <div className="small text-muted">{res.chairs.length} Chairs</div>
                            </div>
                          </div>
                        )) : <p className="text-muted">No reservations for today.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button className="btn btn-outline-secondary mb-3" onClick={() => setSelectedOrder(null)}>← Back to List</button>
                    <div className="card shadow-sm border-0">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Table {selectedOrder.tableNumber} - {selectedOrder.customerName || 'Walk-in'}</h5>
                        <span className={`badge ${selectedOrder.startTime ? 'bg-info' : 'bg-danger'}`}>
                          {selectedOrder.startTime ? 'RESERVED' : 'BOOKED'}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Item & Addons</th>
                                <th className="text-center">Qty</th>
                                <th className="text-end">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.cartItems?.map((item, i) => (
                                <tr key={i}>
                                  <td>
                                    <div className="fw-bold">{item.item_name || item.name}</div>
                                    {Object.entries(item.addonQuantities || {}).map(([name, qty]) => (
                                      <div key={name} className="small text-muted ms-2">+ {name} (x{qty})</div>
                                    ))}
                                    {item.kitchenNotes && Object.values(item.kitchenNotes).some(v => v) && (
                                      <div className="small text-warning mt-1 italic">
                                        <i className="fas fa-sticky-note me-1"></i>
                                        {Object.values(item.kitchenNotes).join(", ")}
                                      </div>
                                    )}
                                  </td>
                                  <td className="text-center">{item.quantity}</td>
                                  <td className="text-end fw-medium">{formatPrice(item.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                              <tr>
                                <td colSpan="2">Grand Total</td>
                                <td className="text-end text-primary">{formatPrice(calculateOrderGrandTotal(selectedOrder.cartItems || []))}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
}
export default Table;
