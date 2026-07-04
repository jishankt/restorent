import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../../Context/UserContext";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

function Booking() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const { setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [bookedTables, setBookedTables] = useState(() => {
    const saved = localStorage.getItem("bookedTables");
    return saved ? JSON.parse(saved) : [];
  });
  const [bookedChairs, setBookedChairs] = useState({});
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
          res.chairs &&
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

  const [selectedTable, setSelectedTable] = useState(null);
  const [reservationForm, setReservationForm] = useState({
    tableNumber: "",
    customerName: "",
    phoneNumber: "",
    email: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    chairs: [],
    chairsInput: "",
  });
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [verifyPhoneNumber, setVerifyPhoneNumber] = useState("");
  const [showReservedChairPopup, setShowReservedChairPopup] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showTomorrowReservationsPopup, setShowTomorrowReservationsPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  // Floor Selection State
  const [selectedFloor, setSelectedFloor] = useState("");
  const [floors, setFloors] = useState([]);
  const [vatRate, setVatRate] = useState(0.10);
  const [baseUrl, setBaseUrl] = useState("");

  // Reservation List Filter State
  const [filterDate, setFilterDate] = useState("today"); // "today", "tomorrow", "all"

  useEffect(() => {
    const controller = new AbortController();
    const fetchTables = async () => {
      try {
        const active_company = localStorage.getItem('active_company');
        const active_branch = localStorage.getItem('active_branch');
        const token = localStorage.getItem('token');

        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Company-Name": active_company || "",
          "X-Branch-Name": active_branch || ""
        };

        const response = await fetch("/api/tables", {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const sortedTables = (data.message || []).sort(
          (a, b) => parseInt(a.table_number) - parseInt(b.table_number)
        );
        setTables(sortedTables);

        // Extract unique floors
        const uniqueFloors = [...new Set(sortedTables.map(t => t.floor).filter(Boolean))].sort();
        setFloors(uniqueFloors);

        // UPDATED: Priority to location.state floor, then uniqueFloors[0]
        const { floor: initialFloor } = location.state || {};
        if (initialFloor && uniqueFloors.includes(initialFloor)) {
          setSelectedFloor(initialFloor);
        } else if (uniqueFloors.length > 0 && !selectedFloor) {
          setSelectedFloor(uniqueFloors[0]);
        }

        setLoading(false);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLoading(false);
        }
      }
    };
    fetchTables();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const fetchVat = async () => {
      try {
        const response = await axios.get('/api/get-vat');
        setVatRate(response.data.vat / 100 || 0.1);
      } catch (error) {
        console.error('Failed to fetch VAT:', error);
      }
    };
    fetchVat();
  }, []);

  useEffect(() => {
    const { tableNumber, totalChairs, availableChairNumbers, reservationToVerify, floor: passedFloor } = location.state || {};
    if (tableNumber && totalChairs && availableChairNumbers) {
      const isFullyReserved = isTableFullyReserved(tableNumber, totalChairs);
      if (!isFullyReserved) {
        setReservationForm((prev) => ({ ...prev, tableNumber }));
        // UPDATED: Filter by both tableNumber AND floor for accurate lookup
        const targetFloor = passedFloor || selectedFloor;
        if (table) {
          // UPDATED: Prioritize visual chair count over number_of_chairs
          const capacity = (Array.isArray(table.chairs) && table.chairs.length > 0) ? table.chairs.length : (table.number_of_chairs || 4);
          setSelectedTable({
            table_number: tableNumber,
            number_of_chairs: capacity,
            availableChairs: availableChairNumbers.length,
            availableChairNumbers,
            floor: targetFloor,
            // also store raw chairs for visualization
            chairs: table.chairs
          });
        }
      }
    }
    if (reservationToVerify) {
      setSelectedReservation(reservationToVerify);
      setShowReservedChairPopup(true);
    }
  }, [location.state, tables]);

  // UPDATED: Sync bookedChairs with savedOrders and current floor
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];

    // UPDATED: Filter both saved and paid orders (if not truly paid/ended) for the CURRENT floor
    const activeSaved = savedOrders.filter(order => String(order.floor) === String(selectedFloor) && !order.paid);
    const activePaid = paidOrders.filter(order => String(order.floor) === String(selectedFloor) && !order.paid);
    const allFloorOrders = [...activeSaved, ...activePaid];

    const updatedBookedChairs = {};
    allFloorOrders.forEach((order) => {
      const tableNum = String(order.tableNumber);
      const chairs = Array.isArray(order.chairsBooked) ? order.chairsBooked : [];
      if (tableNum && tableNum !== "N/A") {
        if (!updatedBookedChairs[tableNum]) {
          updatedBookedChairs[tableNum] = [];
        }
        updatedBookedChairs[tableNum] = [
          ...new Set([...(updatedBookedChairs[tableNum] || []), ...chairs]),
        ].map(Number);
      }
    });
    setBookedChairs(updatedBookedChairs);
  }, [selectedFloor, tables]);

  useEffect(() => {
    const tableNum = reservationForm.tableNumber;
    if (tableNum) {
      // UPDATED: Filter by both tableNumber AND selectedFloor
      const table = tables.find((t) => String(t.table_number) === String(tableNum) && String(t.floor) === String(selectedFloor));
      if (table) {
        // UPDATED: Prioritize visual chair count
        const capacity = (Array.isArray(table.chairs) && table.chairs.length > 0) ? table.chairs.length : (table.number_of_chairs || 4);

        const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
        const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];
        const tableOrders = [...savedOrders, ...paidOrders].filter(
          (order) => String(order.tableNumber) === String(tableNum) && String(order.floor) === String(selectedFloor)
        );
        const availableChairNumbers = getAvailableChairNumbers(
          tableNum,
          capacity,
          reservationForm.date,
          reservationForm.startTime,
          reservationForm.endTime
        );
        setSelectedTable({
          table_number: tableNum,
          number_of_chairs: capacity,
          availableChairs: availableChairNumbers.length,
          availableChairNumbers,
          tableOrders,
          floor: selectedFloor,
          type: table.type,
          chairs: table.chairs
        });
      } else {
        setSelectedTable(null);
      }
    } else {
      setSelectedTable(null);
    }
  }, [reservationForm.tableNumber, reservationForm.date, tables, bookedChairs, reservations, selectedFloor]);

  const isTableFullyReserved = (tableNumber, tableChairs, date, startTime, endTime) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return reservations.some((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Invalid reservation data in isTableFullyReserved:", res);
        return false;
      }
      try {
        const [resStartHour, resStartMinute] = res.startTime.split(":").map(Number);
        const [resEndHour, resEndMinute] = res.endTime.split(":").map(Number);
        const resStartTime = resStartHour * 60 + resStartMinute;
        const resEndTime = resEndHour * 60 + resEndMinute;
        const preReservationTime = resStartTime - 60;

        if (date && startTime && endTime) {
          const [inputStartHour, inputStartMinute] = startTime.split(":").map(Number);
          const [inputEndHour, inputEndMinute] = endTime.split(":").map(Number);
          const inputStartTime = inputStartHour * 60 + inputStartMinute;
          const inputEndTime = inputEndHour * 60 + inputEndMinute;

          return (
            String(res.tableNumber) === String(tableNumber) &&
            res.floor === (selectedFloor || res.floor) && // Check floor match
            res.date === date &&
            !(
              inputEndTime <= resStartTime ||
              inputStartTime >= resEndTime
            ) &&
            res.chairs.length >= tableChairs
          );
        }

        return (
          String(res.tableNumber) === String(tableNumber) &&
          res.floor === (selectedFloor || res.floor) && // Check floor match
          res.date === currentDate &&
          currentTime >= preReservationTime &&
          currentTime <= resEndTime &&
          res.chairs.length >= tableChairs
        );
      } catch (e) {
        console.warn("Error processing reservation:", res, e);
        return false;
      }
    });
  };

  const getReservedChairNumbers = (tableNumber, date, startTime, endTime) => {
    let reservedChairs = [];
    reservations.forEach((res) => {
      if (!res.startTime || !res.endTime) {
        console.warn("Skipping invalid reservation in getReservedChairNumbers:", res);
        return;
      }
      try {
        const [resStartHour, resStartMinute] = res.startTime.split(":").map(Number);
        const [resEndHour, resEndMinute] = res.endTime.split(":").map(Number);
        const resStartTime = resStartHour * 60 + resStartMinute;
        const resEndTime = resEndHour * 60 + resEndMinute;

        if (startTime && endTime) {
          const [inputStartHour, inputStartMinute] = startTime.split(":").map(Number);
          const [inputEndHour, inputEndMinute] = endTime.split(":").map(Number);
          const inputStartTime = inputStartHour * 60 + inputStartMinute;
          const inputEndTime = inputEndHour * 60 + inputEndMinute;

          if (
            String(res.tableNumber) === String(tableNumber) &&
            res.floor === (selectedFloor || res.floor) && // Check floor match
            res.date === date &&
            !(
              inputEndTime <= resStartTime ||
              inputStartTime >= resEndTime
            )
          ) {
            reservedChairs.push(...res.chairs);
          }
        } else {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const preReservationTime = resStartTime - 60;
          if (
            String(res.tableNumber) === String(tableNumber) &&
            res.floor === (selectedFloor || res.floor) && // Check floor match
            res.date === date &&
            (date > now.toISOString().split("T")[0] ||
              (date === now.toISOString().split("T")[0] &&
                currentTime >= preReservationTime &&
                currentTime <= resEndTime))
          ) {
            reservedChairs.push(...res.chairs);
          }
        }
      } catch (e) {
        console.warn("Error processing reservation in getReservedChairNumbers:", res, e);
      }
    });
    return reservedChairs;
  };

  const getAvailableChairNumbers = (tableNumber, totalChairs, date, startTime, endTime) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const validTotalChairs = Number(totalChairs) || 4;

    // Only consider booked chairs for the current date
    const bookedChairNumbers = date === currentDate ? (bookedChairs[tableNumber] || []) : [];
    const reservedChairNumbers = getReservedChairNumbers(tableNumber, date, startTime, endTime);
    const occupiedChairs = [...new Set([...bookedChairNumbers, ...reservedChairNumbers])].map(Number);

    const availableChairs = [];
    for (let i = 1; i <= validTotalChairs; i++) {
      if (!occupiedChairs.includes(i)) {
        availableChairs.push(i);
      }
    }
    return availableChairs;
  };

  // UPDATED: Default chair positions based on table type (standardized with Table.jsx)
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
          x = centerX - w / 2 + currentPos;
          y = centerY - h / 2 - chairSize / 2 - 10;
        } else if (currentPos < w + h) {
          x = centerX + w / 2 + chairSize / 2 + 10;
          y = centerY - h / 2 + (currentPos - w);
        } else if (currentPos < 2 * w + h) {
          x = centerX + w / 2 - (currentPos - w - h);
          y = centerY + h / 2 + chairSize / 2 + 10;
        } else {
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
        const y = centerY + 20 / 2 + chairSize / 2 + 10;
        positions.push({ x, y });
      }
    }
    return positions;
  };

  const getTableColor = (tableNumber) => {
    const type = tableNumber % 3;
    switch (type) {
      case 0:
        return "#6B4E31"; // Darker wood tone
      case 1:
        return "#8B5A2B"; // Medium wood tone
      case 2:
        return "#A0522D"; // Lighter wood tone
      default:
        return "#6B4E31";
    }
  };

  const getChairStatus = (table, chairNumber, date, startTime, endTime) => {
    const tableNumber = table.table_number;
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const chairNum = Number(chairNumber);

    const booked = date === currentDate && (bookedChairs[tableNumber] || []).map(Number).includes(chairNum);
    const reserved = getReservedChairNumbers(tableNumber, date, startTime, endTime).map(Number).includes(chairNum);

    const isWithinCapacity = chairNum <= (Number(table.number_of_chairs) || 4);

    if (booked) return "booked";
    if (reserved) return "reserved";
    if (!booked && !reserved && isWithinCapacity) return "available";
    return "unknown";
  };

  const renderChairs = (table, date, startTime, endTime) => {
    const totalChairs = table.number_of_chairs;
    const centerX = 90; // Center of 180x180 container
    const centerY = 90;
    const radius = 60;
    const chairSize = 24;

    // UPDATED: Use shape-aware positions if available, otherwise fallback
    const chairPositions = table.chairs || getDefaultChairPositions(
      table.type || "Round",
      totalChairs,
      centerX,
      centerY,
      radius,
      chairSize
    );

    return chairPositions.map((chairPos, i) => {
      const chairNumber = i + 1;
      const status = getChairStatus(table, chairNumber, date, startTime, endTime);
      const isSelected = reservationForm.chairs.includes(chairNumber);

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
            cursor: status === "available" ? 'pointer' : 'default',
            transition: 'transform 0.2s',
            zIndex: 10
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (status === "available") {
              setReservationForm((prev) => {
                const newChairs = prev.chairs.includes(chairNumber)
                  ? prev.chairs.filter((c) => c !== chairNumber)
                  : [...prev.chairs, chairNumber].sort((a, b) => a - b);
                return {
                  ...prev,
                  chairs: newChairs,
                  chairsInput: newChairs.join(", "),
                };
              });
            }
          }}
          title={`Chair ${chairNumber} - ${status}`}
        />
      );
    });
  };

  const parseChairInput = (input) => {
    if (!input.trim()) return [];
    return input
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num));
  };

  const generateEndTimeOptions = () => {
    if (!reservationForm.startTime) return [];
    try {
      const [startHour, startMinute] = reservationForm.startTime.split(":").map(Number);
      let currentTime = startHour * 60 + startMinute + 30;
      const maxTime = 24 * 60;
      const options = [];
      while (currentTime <= maxTime && currentTime <= (startHour * 60 + startMinute + 4 * 60)) {
        const hours = Math.floor(currentTime / 60).toString().padStart(2, "0");
        const minutes = (currentTime % 60).toString().padStart(2, "0");
        options.push(`${hours}:${minutes}`);
        currentTime += 30;
      }
      return options;
    } catch (e) {
      console.warn("Error generating end time options:", e);
      return [];
    }
  };

  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    if (name === "chairsInput") {
      const chairs = parseChairInput(value);
      setReservationForm((prev) => ({ ...prev, chairsInput: value, chairs }));
    } else {
      setReservationForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReserveTable = () => {
    const {
      tableNumber,
      customerName,
      phoneNumber,
      email,
      date,
      startTime,
      endTime,
      chairs,
    } = reservationForm;

    if (
      !tableNumber ||
      !customerName ||
      !phoneNumber ||
      !email ||
      !date ||
      !startTime ||
      !endTime ||
      chairs.length === 0
    ) {
      setWarningMessage("Please fill in all reservation details and select at least one chair.");
      return;
    }

    if (!startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
      setWarningMessage("Start Time and End Time must be in HH:MM format.");
      return;
    }

    // UPDATED: Filter by both tableNumber AND selectedFloor
    const table = tables.find((t) => String(t.table_number) === String(tableNumber) && String(t.floor) === String(selectedFloor));
    if (!table) {
      setWarningMessage(
        `Selected table ${tableNumber} not found. Available tables: ${tables
          .map((t) => t.table_number)
          .join(", ")}`
      );
      return;
    }

    const availableChairNumbers = getAvailableChairNumbers(
      tableNumber,
      table.number_of_chairs,
      date,
      startTime,
      endTime
    );
    const invalidChairs = chairs.filter(
      (chair) => !availableChairNumbers.includes(chair)
    );
    if (invalidChairs.length > 0) {
      setWarningMessage(
        `Chairs ${invalidChairs.join(", ")} are not available for reservation on ${date}.`
      );
      return;
    }

    const outOfRangeChairs = chairs.filter(
      (chair) => chair < 1 || chair > table.number_of_chairs
    );
    if (outOfRangeChairs.length > 0) {
      setWarningMessage(
        `Chairs ${outOfRangeChairs.join(
          ", "
        )} are out of range for Table ${tableNumber} (1-${table.number_of_chairs}).`
      );
      return;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

    if (duration <= 0) {
      setWarningMessage("End Time must be after Start Time.");
      return;
    }

    const newReservation = {
      id: uuidv4(),
      tableNumber,
      customerName,
      phoneNumber,
      email,
      date,
      startTime,
      endTime,
      duration,
      chairs,
      floor: selectedFloor, // Save the floor
    };

    const updatedReservations = [...reservations, newReservation];
    setReservations(updatedReservations);
    localStorage.setItem("reservations", JSON.stringify(updatedReservations));

    setReservationForm({
      tableNumber: "",
      customerName: "",
      phoneNumber: "",
      email: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      chairs: [],
      chairsInput: "",
    });
    setSelectedTable(null);
    setWarningMessage(
      `Table ${tableNumber} reserved successfully for ${customerName} on ${date} from ${startTime} to ${endTime}. Chairs: ${chairs.join(
        ", "
      )}`
    );
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
      setShowReservedChairPopup(false);

      setCartItems([]);
      navigate(`/frontpage`, {
        state: {
          tableNumber: selectedReservation.tableNumber,
          chairsBooked: selectedReservation.chairs,
          orderType: "Dine In",
          cartItems: [],
          customerName: selectedReservation.customerName,
          phoneNumber: selectedReservation.phoneNumber,
          email: selectedReservation.email,
          floor: selectedReservation.floor, // UPDATED: Use floor from reservation
        },
      });
    } else {
      setWarningMessage("Verification failed. Please check the customer name and phone number.");
    }
  };

  const handleVerifyPopup = (reservation) => {
    setSelectedReservation(reservation);
    setShowVerifyPopup(true);
    setSelectedCustomer("");
    setVerifyPhoneNumber("");
  };

  const handleShowTomorrowReservations = () => {
    setShowTomorrowReservationsPopup(true);
  };

  const handleDeleteReservation = (id) => {
    setReservationToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReservation = () => {
    if (reservationToDelete) {
      const updatedReservations = reservations.filter(res => res.id !== reservationToDelete);
      setReservations(updatedReservations);
      localStorage.setItem("reservations", JSON.stringify(updatedReservations));
      // If the deleted reservation was selected for verification, clear it
      if (selectedReservation && selectedReservation.id === reservationToDelete) {
        setSelectedReservation(null);
        setShowVerifyPopup(false);
        setShowReservedChairPopup(false);
      }
      setReservationToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const ensureItemTotals = (item, rate) => {
    const qty = Number(item.quantity) || 1;
    const base = Number(item.basePrice) || 0;
    const ice = Number(item.icePrice) || 0;
    const spicy = Number(item.spicyPrice) || 0;
    const customVariantsTotal = item.customVariantsDetails ? Object.entries(item.customVariantsDetails).reduce((sum, [_, v]) => sum + (Number(v.price) || 0), 0) : 0;
    const addonsTotal = item.addonPrices ? Object.entries(item.addonPrices).reduce((sum, [_, p]) => sum + (Number(p) || 0), 0) : 0;
    const combosTotal = item.comboPrices ? Object.entries(item.comboPrices).reduce((sum, [_, p]) => sum + (Number(p) || 0), 0) : 0;

    const exclTotal = (base + ice + spicy + customVariantsTotal + addonsTotal + combosTotal) * qty;
    const taxTotal = exclTotal * rate;

    return {
      ...item,
      exclTotal: item.exclTotal || exclTotal,
      taxTotal: item.taxTotal || taxTotal,
      totalPrice: item.totalPrice || (exclTotal + taxTotal)
    };
  };

  const handleViewOrder = (tableNumber, chairsBooked) => {
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders")) || [];
    const paidOrders = JSON.parse(localStorage.getItem("paidOrders")) || [];
    const allOrders = [...savedOrders, ...paidOrders];

    const existingOrder = allOrders.find(
      (order) =>
        String(order.tableNumber) === String(tableNumber) &&
        order.floor === selectedFloor &&
        Array.isArray(order.chairsBooked) &&
        order.chairsBooked.some((chair) => chairsBooked.includes(chair))
    );

    if (!existingOrder) {
      setWarningMessage("Order not found or has already been paid.");
      return;
    }

    const formattedCartItems = existingOrder.cartItems.map((item) => ensureItemTotals({
      ...item,
      addonQuantities: item.addonQuantities || {},
      addonVariants: item.addonVariants || {},
      addonPrices: item.addonPrices || {},
      addonSizePrices: item.addonSizePrices || {},
      addonIcePrices: item.addonIcePrices || {},
      addonSpicyPrices: item.addonSpicyPrices || {},
      addonImages: item.addonImages || {},
      selectedAddons: item.selectedAddons || [],
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

    navigate(`/frontpage`, {
      state: {
        tableNumber: existingOrder.tableNumber,
        floor: selectedFloor,
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
        email: existingOrder.email || "",
      },
    });
  };

  const cancelDeleteReservation = () => {
    setReservationToDelete(null);
    setShowDeleteConfirm(false);
  };

  const getFilteredReservations = () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    return reservations.filter((res) => {
      // UPDATED: Filter reservations by floor
      const floorMatch = !selectedFloor || String(res.floor) === String(selectedFloor);
      if (!floorMatch) return false;

      if (filterDate === "today") return res.date === today;
      if (filterDate === "tomorrow") return res.date === tomorrowDate;
      return true; // "all"
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA - dateB;
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getTomorrowReservations = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    return reservations.filter((res) => res.date === tomorrowDate);
  };

  const getAvailableTables = (date, startTime, endTime) => {
    return tables.filter((table) => {
      const tableNumber = table.table_number;
      const totalChairs = table.number_of_chairs;

      if (date && startTime && endTime) {
        const availableChairs = getAvailableChairNumbers(
          tableNumber,
          totalChairs,
          date,
          startTime,
          endTime
        );
        return availableChairs.length > 0;
      }

      const isFullyReserved = isTableFullyReserved(tableNumber, totalChairs, date, startTime, endTime);
      return !isFullyReserved;
    });
  };

  if (loading) return <div className="loading">Loading tables...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="booking-page">
      <div className="back-button">
        <button className="btn btn-back" onClick={handleBack}>
          Back
        </button>
      </div>
      <style>
        {`
          /* Page Wrapper */
          .booking-page {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            min-height: 100vh;
            position: relative;
          }

          /* General Container */
          .booking-container {
            padding: 30px;
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
          }

          /* Header for Tomorrow Button and Back Button */
          .header-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 20px;
            position: relative;
            z-index: 10;
          }

          /* Tomorrow and Back Buttons */
          .header-buttons {
            display: flex;
            gap: 10px;
          }

          .tomorrow-button, .back-button {
            z-index: 100;
          }

          /* Flexbox Row for Form and Table Visualization */
          .row {
            display: flex;
            flex-wrap: wrap;
            margin: 0 -15px;
          }

          /* Column Layout */
          .col-md-6 {
            flex: 0 0 50%;
            max-width: 50%;
            padding: 15px;
            box-sizing: border-box;
          }

          /* Reservation Section */
          .reservation-section {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            margin-bottom: 20px;
            transition: transform 0.3s ease;
            position: relative;
          }

          .reservation-section:hover {
            transform: translateY(-5px);
          }

          /* Table Visualization Section */
          .table-visualization-section {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            margin-bottom: 20px;
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }

          .table-visualization-section:hover {
            transform: translateY(-5px);
          }

          /* Chair Status Legend Inside Form */
          .chair-legend {
            position: absolute;
            bottom: 78%;
            right: 25px;
            background: #ffffff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 100;
          }

          .chair-legend h6 {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
          }

          .chair-legend .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            color: #34495e;
          }

          /* Headings */
          h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 26px;
            font-weight: 600;
            text-align: center;
          }

          /* Form Inputs */
          .form-control {
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
          }

          .form-control:focus {
            border-color: #007bff;
            box-shadow: 0 0 8px rgba(0,123,255,0.2);
            outline: none;
          }

          /* Labels */
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #34495e;
            font-size: 14px;
          }

          /* Buttons */
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            margin-left: 40px;
            transition: background-color 0.3s ease, transform 0.2s ease;
          }

          .btn:hover {
            transform: translateY(-2px);
          }

          .btn-primary {
            background-color: #007bff;
            color: #fff;
          }

          .btn-primary:hover {
            background-color: #0056b3;
          }

          .btn-secondary {
            background-color: #6c757d;
            color: #fff;
          }

          .btn-secondary:hover {
            background-color: #5a6268;
          }

          .btn-info {
            background-color: #17a2b8;
            color: #fff;
          }

          .btn-info:hover {
            background-color: #138496;
          }

          .btn-back {
            background-color: #343a40;
            color: #fff;
          }

          .btn-back:hover {
            background-color: #23272b;
          }

          /* Warning Box */
          .warning-box {
            background-color: #fff8e1;
            color: #664d03;
            padding: 15px;
            border: 1px solid #ffecb3;
            border-radius: 8px;
            margin-bottom: 20px;
            position: relative;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .warning-text {
            margin: 0;
            font-size: 14px;
          }

          .close-warning {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #664d03;
          }

          /* Modal Overlay */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          /* Modal Content */
          .modal-content {
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            max-width: 550px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            animation: zoomIn 0.3s ease;
          }

          @keyframes zoomIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .modal-buttons {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 10px;
          }

          /* Reservation Details */
          .reservation-detail {
            margin-bottom: 15px;
            padding: 10px;
            border-left: 4px solid #007bff;
            background: #f8f9fa;
            border-radius: 4px;
          }

          .reservation-detail p {
            margin: 5px 0;
            font-size: 14px;
            color: #2c3e50;
          }

          /* Table Container */
          .table-container {
            position: relative;
            width: 180px;
            height: 180px;
            padding: 20px;
            border: 2px solid #2c3e50;
            border-radius: 12px;
            background-color: #ecf0f1;
            margin: 20px auto;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          .table-shape {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
          }

          .table-shape:hover {
            transform: scale(1.05);
          }

          /* Chair Styling */
          .chair {
            position: absolute;
            font-size: 20px;
            cursor: pointer;
            transition: transform 0.3s ease, color 0.3s ease;
          }

          .chair.booked {
            color: #e74c3c;
          }

          .chair.reserved {
            color: #E91E63;
          }

          .chair.available {
            color: #2ecc71;
          }

          .chair:hover {
            transform: scale(1.3);
          }

          /* Color Legend */
          .color-box {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            margin-right: 8px;
          }

          .color-box.booked {
            background-color: #e74c3c;
          }

          .color-box.reserved {
            background-color: #E91E63;
          }

          .color-box.available {
            background-color: #2ecc71;
          }

          /* Loading and Error States */
          .loading, .error {
            text-align: center;
            font-size: 18px;
            color: #2c3e50;
            padding: 50px;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .col-md-6 {
              flex: 0 0 100%;
              max-width: 100%;
            }

            .booking-container {
              padding: 15px;
            }

            .reservation-section, .table-visualization-section {
              padding: 20px;
            }

            .table-container {
              width: 150px;
              height: 150px;
            }

            .table-shape {
              width: 70px;
              height: 70px;
            }

            .chair {
              font-size: 16px;
            }

            .chair-legend {
              top: 15px;
              right: 15px;
              padding: 10px;
            }

            .header-buttons {
              flex-direction: column;
              align-items: flex-end;
              gap: 5px;
            }

            .btn-info, .btn-back {
              padding: 10px 16px;
              font-size: 14px;
            }
          }

          @media (max-width: 576px) {
            .btn {
              padding: 10px 16px;
              font-size: 14px;
            }

            .form-control {
              font-size: 14px;
            }

            h2 {
              font-size: 22px;
            }

            .chair-legend {
              font-size: 10px;
              padding: 8px;
              top: 10px;
              right: 10px;
            }

            .chair-legend h6 {
              font-size: 12px;
            }

            .chair-legend .legend-item {
              font-size: 10px;
            }

            .color-box {
              width: 14px;
              height: 14px;
            }
          }


          /* Reservation List Styles */
          .reservation-list-container {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            margin-top: 20px;
          }

          .filter-tabs {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
          }

          .filter-tabs .btn {
             margin-left: 0;
             padding: 8px 16px;
             font-size: 14px;
          }

          .reservation-table-wrapper {
            overflow-x: auto;
          }

          .reservation-table {
            width: 100%;
            border-collapse: collapse;
          }

          .reservation-table th, .reservation-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
          }

          .reservation-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
          }

          .reservation-table tr:hover {
            background-color: #f1f1f1;
          }

          .btn-delete {
            background-color: #e74c3c;
            color: white;
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 4px;
            margin-left: 0;
          }

          .booking-container {
             /* Ensure padding at bottom */
             padding-bottom: 50px; 
          }
        `}
      </style>
      <div className="booking-container">
        {/* Header with Tomorrow and Back Buttons */}
        <div className="header-container">
          <div className="header-buttons">
            <div className="tomorrow-button">
              <button
                className="btn btn-info"
                onClick={handleShowTomorrowReservations}
              >
                Show Tomorrow's Reservations
              </button>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <div className="warning-box">
            <p className="warning-text">{warningMessage}</p>
            <button
              className="close-warning"
              onClick={() => setWarningMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content Row */}
        <div className="row">
          {/* Reservation Form Column */}
          <div className="col-md-6 reservation-section">
            <h2>Reserve a Table</h2>
            <div className="reservation-details">
              <div className="mb-3">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={reservationForm.date}
                  onChange={handleReservationChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="mb-3">
                <label>Start Time (HH:MM):</label>
                <input
                  type="time"
                  name="startTime"
                  className="form-control"
                  value={reservationForm.startTime}
                  onChange={handleReservationChange}
                />
              </div>
              <div className="mb-3">
                <label>End Time (HH:MM):</label>
                <select
                  name="endTime"
                  className="form-control"
                  value={reservationForm.endTime}
                  onChange={handleReservationChange}
                  disabled={!reservationForm.startTime}
                >
                  <option value="">Select End Time</option>
                  {generateEndTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label>Floor:</label>
                <select
                  className="form-control"
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setReservationForm(prev => ({ ...prev, tableNumber: "" }));
                  }}
                >
                  {floors.map(floor => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label>Table Number:</label>
                <select
                  name="tableNumber"
                  className="form-control"
                  value={reservationForm.tableNumber}
                  onChange={handleReservationChange}
                >
                  <option value="">Select Table</option>
                  {getAvailableTables(reservationForm.date, reservationForm.startTime, reservationForm.endTime)
                    .filter(t => !selectedFloor || t.floor === selectedFloor)
                    .map((table) => (
                      <option key={table.table_number} value={table.table_number}>
                        Table {table.table_number}
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-3">
                <label>Customer Name:</label>
                <input
                  type="text"
                  name="customerName"
                  className="form-control"
                  value={reservationForm.customerName}
                  onChange={handleReservationChange}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="mb-3">
                <label>Phone Number:</label>
                <input
                  type="text"
                  name="phoneNumber"
                  className="form-control"
                  value={reservationForm.phoneNumber}
                  onChange={handleReservationChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="mb-3">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={reservationForm.email}
                  onChange={handleReservationChange}
                  placeholder="Enter email"
                />
              </div>
              <div className="mb-3">
                <label>Chair Numbers (e.g., 1,2,3):</label>
                <input
                  type="text"
                  name="chairsInput"
                  className="form-control"
                  value={reservationForm.chairsInput}
                  onChange={handleReservationChange}
                  placeholder="e.g., 1,2,3"
                />
              </div>
              <div className="modal-buttons">
                <button className="btn btn-primary" onClick={handleReserveTable}>
                  Reserve
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setReservationForm({
                      tableNumber: "",
                      customerName: "",
                      phoneNumber: "",
                      email: "",
                      date: new Date().toISOString().split("T")[0],
                      startTime: "",
                      endTime: "",
                      chairs: [],
                      chairsInput: "",
                    })
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Table Visualization Column */}
          <div className="col-md-6 table-visualization-section">
            <div className="chair-legend">
              <h6 className="fw-bold">Chair Status Legend</h6>
              <div className="legend-item">
                <div className="color-box booked"></div>
                <span className="small">Booked</span>
              </div>
              <div className="legend-item">
                <div className="color-box reserved"></div>
                <span className="small">Reserved</span>
              </div>
              <div className="legend-item">
                <div className="color-box available"></div>
                <span className="small">Available</span>
              </div>
            </div>

            {selectedTable ? (
              <div className="text-center">
                <h2>Table {selectedTable.table_number}</h2>
                <div
                  className="table-container position-relative d-inline-block"
                  style={{ width: "180px", height: "180px" }}
                >
                  <div
                    className="table-shape position-absolute top-50 start-50 translate-middle"
                    style={{
                      width: selectedTable.type === "Rectangle" || selectedTable.type === "Oval" ? "120px" :
                        selectedTable.type === "Long" || selectedTable.type === "Bar" ? "160px" : "90px",
                      height: selectedTable.type === "Rectangle" || selectedTable.type === "Oval" ? "60px" :
                        selectedTable.type === "Long" ? "40px" :
                          selectedTable.type === "Bar" ? "20px" : "90px",
                      backgroundColor: getTableColor(selectedTable.table_number),
                      borderRadius: selectedTable.type === "Square" || selectedTable.type === "Rectangle" || selectedTable.type === "Bar" ? "4px" : "50%",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
                    }}
                  ></div>
                  {renderChairs(selectedTable, reservationForm.date, reservationForm.startTime, reservationForm.endTime)}
                </div>
                <p>
                  Total Chairs: {selectedTable.number_of_chairs}, Available Chairs:{" "}
                  {selectedTable.availableChairs}
                </p>
                <p>
                  Available Chair Numbers:{" "}
                  {selectedTable.availableChairNumbers.join(", ") || "None"}
                </p>
              </div>
            ) : (
              <p>Select a table to view its layout.</p>
            )}
          </div>
        </div>

        {/* Reservation List Section */}
        <div className="reservation-list-container">
          <h2>Reservation List</h2>
          <div className="filter-tabs">
            <button
              className={`btn ${filterDate === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterDate('today')}
            >
              Today
            </button>
            <button
              className={`btn ${filterDate === 'tomorrow' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterDate('tomorrow')}
            >
              Tomorrow
            </button>
            <button
              className={`btn ${filterDate === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterDate('all')}
            >
              All
            </button>
          </div>

          <div className="reservation-table-wrapper">
            {getFilteredReservations().length > 0 ? (
              <table className="reservation-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Floor</th>
                    <th>Table</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Chairs</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredReservations().map((res) => (
                    <tr key={res.id}>
                      <td>{res.date}</td>
                      <td>{res.startTime} - {res.endTime}</td>
                      <td>{res.floor}</td>
                      <td>{res.tableNumber}</td>
                      <td>{res.customerName}</td>
                      <td>{res.phoneNumber}</td>
                      <td>{res.chairs.join(", ")}</td>
                      <td>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDeleteReservation(res.id)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No reservations found for {filterDate}.</p>
            )}
          </div>
        </div>

        {/* Tomorrow Reservations Popup */}
        {showTomorrowReservationsPopup && (
          <div className="                                    -overlay">
            <div className="modal-content">
              <h2>Tomorrow's Reservations</h2>
              {getTomorrowReservations().length > 0 ? (
                getTomorrowReservations().map((res, index) => (
                  <div key={index} className="reservation-detail">
                    <p><strong>Table:</strong> {res.tableNumber}</p>
                    <p><strong>Customer:</strong> {res.customerName}</p>
                    <p><strong>Phone:</strong> {res.phoneNumber}</p>
                    <p><strong>Email:</strong> {res.email}</p>
                    <p><strong>Date:</strong> {res.date}</p>
                    <p><strong>Start Time:</strong> {res.startTime}</p>
                    <p><strong>End Time:</strong> {res.endTime}</p>
                    <p><strong>Chairs:</strong> {res.chairs.join(", ")}</p>
                    <hr />
                  </div>
                ))
              ) : (
                <p>No reservations for tomorrow.</p>
              )}
              <div className="modal-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowTomorrowReservationsPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reserved Chair Popup */}
        {showReservedChairPopup && selectedReservation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Reserved Table {selectedReservation.tableNumber}</h2>
              <p>Chairs: {selectedReservation.chairs.join(", ")}</p>
              <p>Customer: {selectedReservation.customerName}</p>
              <p>Email: {selectedReservation.email}</p>
              <p>Date: {selectedReservation.date}</p>
              <p>Start Time: {selectedReservation.startTime}</p>
              <p>End Time: {selectedReservation.endTime}</p>
              <div className="modal-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => handleVerifyPopup(selectedReservation)}
                >
                  Verify Customer
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReservedChairPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verify Customer Popup */}
        {showVerifyPopup && selectedReservation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Verify Customer for Table {selectedReservation.tableNumber}</h2>
              <div className="mb-3">
                <label>Customer Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="mb-3">
                <label>Phone Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={verifyPhoneNumber}
                  onChange={(e) => setVerifyPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="modal-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleVerifyCustomer}
                >
                  Verify
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowVerifyPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Cancel Reservation</h2>
              <p>Are you sure you want to cancel this reservation?</p>
              <div className="modal-buttons">
                <button
                  className="btn btn-delete"
                  onClick={confirmDeleteReservation}
                >
                  Yes
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={cancelDeleteReservation}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Booking;
