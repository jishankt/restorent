import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const Voice = () => {
    const [activeCards, setActiveCards] = useState([]); // Items speaking (Cards)
    const [tableItems, setTableItems] = useState([]);   // Items finished (Table)
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [voices, setVoices] = useState([]);
    const [voiceConfig, setVoiceConfig] = useState({ language: 'en-US', voiceName: '', rate: 1.0, repeatCount: 2 });
    const [activeOrdersData, setActiveOrdersData] = useState([]); // Store raw orders for periodic update
    const navigate = useNavigate();

    // Use a ref to track what has been announced. 
    const announcedItemsRef = useRef(new Set());

    // Load Voices & LocalStorage
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Initialize announced set from localStorage
        try {
            const stored = localStorage.getItem('voice_announced_ids');
            if (stored) {
                const ids = JSON.parse(stored);
                ids.forEach(id => announcedItemsRef.current.add(id));
            }
        } catch (e) {
            console.error("Failed to load local storage", e);
        }
    }, []);

    // Fetch config and settings
    useEffect(() => {
        const fetchAllConfig = async () => {
            try {
                // 1. Fetch Network Info for BaseUrl
                const netResponse = await axios.get("/api/network_info");
                const { config: appConfig } = netResponse.data;
                let currentBase = "";
                if (appConfig.mode === "client") {
                    currentBase = `http://${appConfig.server_ip}:6034`;
                    setBaseUrl(currentBase);
                } else {
                    setBaseUrl("");
                }

                // 2. Fetch System Settings for Voice Language/Model
                const settingsUrl = currentBase ? `${currentBase}/api/settings` : "/api/settings";
                const settingsResponse = await axios.get(settingsUrl);
                if (settingsResponse.data) {
                    setVoiceConfig({
                        language: settingsResponse.data.voiceLanguage || 'en-US',
                        voiceName: settingsResponse.data.voiceName || '',
                        rate: parseFloat(settingsResponse.data.voiceRate) || 1.0,
                        repeatCount: parseInt(settingsResponse.data.voiceRepeatCount) || 2
                    });
                }
            } catch (err) {
                console.error("Failed to fetch config:", err);
                setBaseUrl("");
            }
        };
        fetchAllConfig();
    }, []);

    const speak = useCallback((text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);

            // Priority 1: User selected voice model from settings
            let selectedVoice = voices.find(v => v.name === voiceConfig.voiceName);

            // Priority 2: If no specific voice, try to find ANY voice for the selected language
            if (!selectedVoice && voiceConfig.language) {
                selectedVoice = voices.find(v => v.lang.startsWith(voiceConfig.language.split('-')[0]));
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // Always set language for proper pronunciation
            utterance.lang = voiceConfig.language;
            utterance.rate = voiceConfig.rate || 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            window.speechSynthesis.speak(utterance);
        }
    }, [voices, voiceConfig]);

    const handleVoiceAnnouncement = useCallback((uniqueId, orderNo, orderType) => {
        if (!announcedItemsRef.current.has(uniqueId)) {
            console.log(`[Voice] Announcing: ${uniqueId}`);
            announcedItemsRef.current.add(uniqueId);

            try {
                const currentIds = Array.from(announcedItemsRef.current);
                const slicedIds = currentIds.slice(-100);
                localStorage.setItem('voice_announced_ids', JSON.stringify(slicedIds));
            } catch (e) {
                console.error("LS Error", e);
            }

            // NEW: Mapping short prefixes to full names for speech
            const typeMapping = {
                'TAK': 'Takeaway',
                'DIN': 'Dine In',
                'OND': 'Online Delivery',
                'Takeaway': 'Takeaway',
                'Dine In': 'Dine In',
                'Online Delivery': 'Online Delivery',
                'Take Away': 'Takeaway'
            };
            const normalizedOrderType = typeMapping[orderType] || orderType;

            // Clean order number for speech if it contains redundant text like "#Take Away-"
            let spokenOrderNo = orderNo;
            if (typeof orderNo === 'string' && orderNo.includes('-')) {
                const parts = orderNo.split('-');
                if (parts.length > 1) {
                    spokenOrderNo = parts[parts.length - 1]; // Take the last part (usually the number)
                }
            }
            // Remove hash if still present and leading zeros for natural speech (optional, but requested "just the number")
            spokenOrderNo = spokenOrderNo.replace('#', '').replace(/^0+/, '');
            if (spokenOrderNo === '') spokenOrderNo = '0'; // Handle case where number was '0' or '0000'

            // Full text (with Order Type) for the first announcement
            const translationsFull = {
                'en-US': `${normalizedOrderType} Order Number ${spokenOrderNo}, is prepared`,
                'ta-IN': `${normalizedOrderType} ஆர்டர் எண் ${spokenOrderNo}, தயாராக உள்ளது`,
                'ml-IN': `${normalizedOrderType} ഓർഡർ നമ്പർ ${spokenOrderNo}, തയ്യാറായിക്കഴിഞ്ഞു`,
                'kn-IN': `${normalizedOrderType} ಆರ್ಡರ್ ಸಂಖ್ಯೆ ${spokenOrderNo}, ಸಿದ್ಧವಾಗಿದೆ`,
                'te-IN': `${normalizedOrderType} ఆర్డర్ నంబర్ ${spokenOrderNo}, సిద్ధంగా ఉంది`,
                'hi-IN': `${normalizedOrderType} ऑर्डर नंबर ${spokenOrderNo}, तैयार है`,
                'ur-PK': `${normalizedOrderType} آرڈر نمبر ${spokenOrderNo} تیار ہے`,
                'ar-SA': `${normalizedOrderType} رقم الطلب ${spokenOrderNo} جاهز`,
            };

            // Short text (Order Number only) for subsequent announcements
            const translationsShort = {
                'en-US': `Order Number ${spokenOrderNo}, is prepared`,
                'ta-IN': `ஆர்டர் எண் ${spokenOrderNo}, தயாராக உள்ளது`,
                'ml-IN': `ഓർഡർ നമ്പർ ${spokenOrderNo}, തയ്യാറായിക്കഴിഞ്ഞു`,
                'kn-IN': `ಆರ್ಡರ್ ಸಂಖ್ಯೆ ${spokenOrderNo}, ಸಿದ್ಧವಾಗಿದೆ`,
                'te-IN': `ఆర్డర్ నంబర్ ${spokenOrderNo}, సిద్ధంగా ఉంది`,
                'hi-IN': `ऑर्डर नंबर ${spokenOrderNo}, तैयार है`,
                'ur-PK': `آرڈر نمبر ${spokenOrderNo} تیار ہے`,
                'ar-SA': `رقم الطلب ${spokenOrderNo} جاهز`,
            };

            const textFull = translationsFull[voiceConfig.language] || translationsFull['en-US'];
            const textShort = translationsShort[voiceConfig.language] || translationsShort['en-US'];

            const repeatCount = voiceConfig.repeatCount || 2;
            let count = 0;
            const speakRecursive = () => {
                if (count < repeatCount) {
                    // Speak full text (with Type) on first iteration, short text (Number only) on repeats
                    speak(count === 0 ? textFull : textShort);
                    count++;
                    if (count < repeatCount) {
                        setTimeout(speakRecursive, 3000);
                    }
                }
            };
            speakRecursive();
        }
    }, [speak]);

    const processOrders = useCallback((orders) => {
        const now = Date.now();
        const retentionPeriod = 24 * 60 * 60 * 1000;
        const retentionTimeLimit = new Date(now - retentionPeriod);

        // Dynamic duration: (Repeats * 4000ms per speech) + Buffer. 
        // e.g., 2 repeats * 4s = 8s + buffer => ~9-10s. Default to 10s minimum.
        const repeatCount = voiceConfig.repeatCount || 2;
        const cardDisplayDuration = Math.max(repeatCount * 4500, 5000);

        const currentCards = [];
        const currentTable = [];

        orders.forEach(order => {
            if (!order.cartItems || !Array.isArray(order.cartItems)) return;

            order.cartItems.forEach(item => {
                if (item.kitchenStatuses) {
                    Object.entries(item.kitchenStatuses).forEach(([kitchen, status]) => {
                        if (status === 'Prepared' || status === 'PickedUp' || status === 'Served') {
                            let eventTime = null;

                            if (item.kitchenPickedUpAt && item.kitchenPickedUpAt[kitchen]) {
                                eventTime = new Date(item.kitchenPickedUpAt[kitchen]);
                            } else if (item.kitchenPreparedAt && item.kitchenPreparedAt[kitchen]) {
                                eventTime = new Date(item.kitchenPreparedAt[kitchen]);
                            } else if (order.timestamp) {
                                eventTime = new Date(order.timestamp);
                            } else {
                                eventTime = new Date();
                            }

                            if (isNaN(eventTime.getTime())) eventTime = new Date();

                            const isTimestampFromBackend = !!(item.kitchenPickedUpAt && item.kitchenPickedUpAt[kitchen]);

                            if (!isTimestampFromBackend || eventTime > retentionTimeLimit) {
                                const uniqueId = `${order.orderId}-${item.id}-${kitchen}-${status.toLowerCase()}`;
                                const itemData = {
                                    uniqueId,
                                    orderNo: order.orderNo,
                                    orderType: order.orderType || "Dine In",
                                    itemName: item.name,
                                    kitchen: kitchen,
                                    status: status,
                                    eventTime: eventTime,
                                    isTimestampFromBackend
                                };

                                const timeSinceEvent = now - eventTime.getTime();
                                const alreadyAnnounced = announcedItemsRef.current.has(uniqueId);

                                if (timeSinceEvent < cardDisplayDuration) {
                                    currentCards.push(itemData);
                                    if (status === 'PickedUp' && audioEnabled && !alreadyAnnounced) {
                                        handleVoiceAnnouncement(uniqueId, order.orderNo, order.orderType || "Order");
                                    }
                                } else {
                                    currentTable.push(itemData);
                                }
                            }
                        }
                    });
                }
            });
        });

        currentTable.sort((a, b) => b.eventTime - a.eventTime);
        setActiveCards(currentCards);
        setTableItems(currentTable);
        setLoading(false);
    }, [audioEnabled, handleVoiceAnnouncement]);

    const fetchOrders = useCallback(async () => {
        try {
            const base = baseUrl || "";
            const url = `${base}/api/activeorders`;
            const response = await axios.get(url);
            if (response.data && Array.isArray(response.data)) {
                setActiveOrdersData(response.data); // Store raw data
                processOrders(response.data);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, processOrders]);

    // Interval to re-process orders every second for immediate UI updates
    useEffect(() => {
        if (activeOrdersData.length > 0) {
            const timer = setInterval(() => {
                processOrders(activeOrdersData);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activeOrdersData, processOrders]);

    useEffect(() => {
        let socketUrl = baseUrl;
        if (!socketUrl) {
            if (window.location.hostname !== 'localhost' && window.location.port !== '6034') {
                socketUrl = `${window.location.protocol}//${window.location.hostname}:6034`;
            } else {
                socketUrl = window.location.origin;
            }
        }

        const socket = io(socketUrl, {
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        socket.on("connect", () => console.log("Connected to socket server"));
        socket.on("order_update", (data) => fetchOrders());
        socket.on("connect_error", (err) => console.error("Socket error:", err));
        socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

        return () => socket.disconnect();
    }, [baseUrl, fetchOrders]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const enableAudio = () => {
        setAudioEnabled(true);
        speak("Voice system enabled.");
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            padding: "30px",
            background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
            minHeight: "100vh",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            position: "relative",
            animation: "fadeIn 0.5s ease-in-out"
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
                }
            `}</style>

            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "25px",
                padding: "15px",
                background: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
            }}>
                <FaArrowLeft
                    onClick={() => navigate(-1)}
                    style={{ fontSize: "30px", cursor: "pointer", color: "#3182ce", transition: "all 0.3s ease" }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#2b6cb0"; e.currentTarget.style.transform = "scale(1.2) rotate(-5deg)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "#3182ce"; e.currentTarget.style.transform = "scale(1)"; }}
                />
                <h1 style={{ fontSize: "2.25rem", fontWeight: 700, color: "#2d3748", margin: 0, flexGrow: 1, textAlign: "center" }}>
                    Ready For Pickup
                </h1>
                <div style={{ width: "30px" }}></div>
            </div>

            {!audioEnabled && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                    <h2>Audio Permission Required</h2>
                    <button onClick={enableAudio} style={{ padding: '12px 24px', fontSize: '18px', background: 'linear-gradient(135deg, #38a169, #68d391)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px', fontWeight: "500", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                        ENABLE VOICE NOTIFICATIONS
                    </button>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: '#cbd5e0' }}>This allows the system to speak order numbers.</p>
                </div>
            )}

            {loading && activeCards.length === 0 && tableItems.length === 0 ? (
                <p style={{ textAlign: "center", color: '#4a5568' }}>Loading orders...</p>
            ) : null}

            <div style={{ minHeight: "20px", marginBottom: "30px" }}>
                {activeCards.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                        {activeCards.map((item) => (
                            <div key={item.uniqueId} style={{ backgroundColor: "#c6f6d5", color: "#2f855a", border: "2px solid #2f855a", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 15px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "pulse 2s infinite" }}>
                                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2d3748", marginBottom: "5px", textTransform: "uppercase" }}>{item.orderType}</div>
                                <div style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "10px", lineHeight: "1", color: "#2f855a" }}>#{item.orderNo}</div>
                                <div style={{ fontSize: "1.4rem", fontWeight: "600", marginBottom: "5px", color: "#2d3748" }}>{item.itemName}</div>
                                <div style={{ fontSize: "1rem", color: "#4a5568" }}>{item.kitchen} Kitchen</div>
                                <div style={{ fontSize: "0.9rem", color: "#2f855a", marginTop: "10px", fontWeight: 'bold' }}>{item.status.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {tableItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#718096", fontSize: "16px", padding: "20px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>No recently prepared items.</div>
            ) : (
                <div style={{ borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)", background: "#ffffff", overflow: "hidden" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#2d3748", padding: "20px", margin: 0, textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>READY ORDER LIST</h2>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Order No</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Type</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Item</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Kitchen</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Status</th>
                                    <th style={{ padding: "15px", background: "linear-gradient(135deg, #2b6cb0, #3182ce)", color: "#ffffff", fontWeight: 600, textAlign: "left" }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableItems.map((item, index) => (
                                    <tr key={item.uniqueId} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f7fafc" }}>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", fontSize: "1.2rem", color: "#2f855a" }}>#{item.orderNo}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#4a5568" }}>{item.orderType}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: "600", color: "#2d3748" }}>{item.itemName}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#4a5568" }}>{item.kitchen}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", fontWeight: 'bold', color: item.status === 'PickedUp' ? '#48bb78' : '#ed8936' }}>{item.status}</td>
                                        <td style={{ padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#718096" }}>{formatTime(item.eventTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Voice;
