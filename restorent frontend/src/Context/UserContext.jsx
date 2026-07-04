import React, { createContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    // Global Network Config State
    const [baseUrl, setBaseUrl] = useState("");
    const [configLoading, setConfigLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const response = await fetch("/api/network_info");
            const data = await response.json();
            const { config: appConfig } = data;
            if (appConfig.mode === "client") {
                setBaseUrl(`http://${appConfig.server_ip}:6034`);
            } else {
                setBaseUrl("");
            }
        } catch (error) {
            console.error("Failed to fetch global config:", error);
            setBaseUrl("");
        } finally {
            setConfigLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            
            // --- SINGLE COMPANY MODE AUTO-LOCK ---
            // If the user logs in and only has exactly 1 company assigned,
            // we should automatically lock their active context to that single company
            // instead of falling back to "All" (which confuses single-tenant scenarios).
            if (user.companies && user.companies.length === 1) {
                const singleCompany = typeof user.companies[0] === 'object' ? user.companies[0].company_name : user.companies[0];
                const currentActive = localStorage.getItem("active_company");
                if (!currentActive || currentActive === "All" || currentActive === "All Companies") {
                    localStorage.setItem("active_company", singleCompany);
                    // Also lock the branch if there's only 1 branch
                    if (user.branches && user.branches.length === 1) {
                        const singleBranch = typeof user.branches[0] === 'object' ? user.branches[0].branch_name : user.branches[0];
                        localStorage.setItem("active_branch", singleBranch);
                    }
                }
            }
        } else {
            localStorage.removeItem("user");
            localStorage.removeItem("selectedOrderType");
            localStorage.removeItem("isOrderTypeSelected");
        }
    }, [user]);

    // --- SHARED MULTI-TENANT HEADER UTILITY ---
    const getHeaders = (branch = null, comp = null) => {
        const headers = { 'Content-Type': 'application/json' };
        const activeContext = localStorage.getItem('active_company');
        const activeBranch = localStorage.getItem('active_branch');
        const token = localStorage.getItem('token');
        
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const role = (user?.role || '').toLowerCase().replace(/[\s_]/g, '');
        const isGroupAdmin = role === 'groupadmin' || role === 'superadmin' || role === 'tenantadmin' || role === 'tenant';

        const isCompanyAdmin = role === 'companyadmin';

        // 1. Resolve Company
        let resolvedCompany = comp;
        if (!resolvedCompany) {
            if (isGroupAdmin && activeContext && activeContext !== 'All') {
                resolvedCompany = activeContext;
            } else if (!isGroupAdmin) {
                // For standard admins, force their profile company
                resolvedCompany = user?.company_name || user?.company;
            } else {
                // Group Admin in 'All' mode
                resolvedCompany = 'All';
            }
        }
        
        if (resolvedCompany) {
            headers['X-Company-Name'] = resolvedCompany;
        }

        // 2. Resolve Branch
        const profileBranch = user?.branch_name || user?.branch || user?.branchId;
        // If the user is restricted to a specific branch, enforce it unless they are a group admin or company admin
        let resolvedBranch = branch || (activeBranch && activeBranch !== 'All Branches' ? activeBranch : null);
        
        if (!isGroupAdmin && !isCompanyAdmin && profileBranch && profileBranch.toLowerCase() !== 'all') {
             resolvedBranch = profileBranch;
        }

        if (resolvedBranch && resolvedBranch !== 'All Branches') {
            headers['X-Branch-Name'] = resolvedBranch;
        }

        // 3. Add User Context for Backend Role Identification
        if (user) {
            const { tenants, companies, branches, ...safeUser } = user;
            headers['X-User-Context'] = encodeURIComponent(JSON.stringify(safeUser));
        }

        return headers;
    };
    const [cartItems, setCartItems] = useState([]);
    const [selectedItemDetails, setSelectedItemDetails] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [preparedItems, setPreparedItems] = useState([]);
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [bearerOrders, setBearerOrders] = useState([]);
    const [quantity, setQuantity] = useState([]);
    const [savedOrders, setSavedOrders] = useState(() => {
        const saved = localStorage.getItem("savedOrders");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("savedOrders", JSON.stringify(savedOrders));
    }, [savedOrders]);

    const addToCart = (item) => {
        const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            setCartItems(prevItems =>
                prevItems.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
            );
        } else {
            setCartItems(prevItem => [...prevItem, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (item) => {
        setCartItems(prevItems => prevItems.filter(cartItem => cartItem !== item));
    };

    const setItemDetails = (item) => {
        setSelectedItemDetails(item);
    };

    const updateCartItem = (updatedItem) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.name === updatedItem.name
                    ? {
                        ...item,
                        quantity: updatedItem.quantity,
                        totalPrice: updatedItem.totalPrice,
                        addons: updatedItem.addon,
                    }
                    : item
            )
        );
    };

    const updateOrderStatus = (id, status) => {
        setSavedOrders(prevOrders =>
            prevOrders.map(order => ({
                ...order,
                cartItems: order.cartItems.map(item =>
                    item.id === id ? { ...item, status } : item
                ),
            }))
        );

        if (status === "Prepared") {
            setPreparedItems(prev => (!prev.includes(id) ? [...prev, id] : prev));
        } else {
            setPreparedItems(prev =>
                prev.filter(preparedItemId => preparedItemId !== id)
            );
        }
    };

    const markAsPickedUp = (id) => {
        setPreparedItems(prev => prev.filter(itemId => itemId !== id));
        setBearerOrders(prev => prev.filter(item => item.id !== id));
    };

    const addKitchenOrder = (order) => {
        const filteredCartItems = order.cartItems.filter(
            item => item.category !== "Drinks"
        );
        if (filteredCartItems.length === 0) {
            alert(
                "No items to send to the kitchen as all items belong to the 'Drinks' category."
            );
            return;
        }
        const kitchenOrder = {
            ...order,
            cartItems: filteredCartItems,
        };
        setSavedOrders(prevOrders => {
            const updatedOrders = [...prevOrders, kitchenOrder];
            localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
            return updatedOrders;
        });
        alert("Order successfully sent to the kitchen!");
    };

    const informBearer = (item) => {
        if (!item || (!item.id && !item.name)) {
            console.error("Invalid item passed to informBearer.");
            return;
        }
        setBearerOrders(prevOrders => [...prevOrders, { ...item, status: "Prepared" }]);
        setPreparedItems(prev =>
            prev.filter(preparedItem => preparedItem.id !== item.id)
        );
    };

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                cartItems,
                addToCart,
                removeFromCart,
                setItemDetails,
                selectedItemDetails,
                updateCartItem,
                totalPrice,
                setTotalPrice,
                updateOrderStatus,
                setCartItems,
                markAsPickedUp,
                addKitchenOrder,
                preparedItems,
                kitchenOrders,
                bearerOrders,
                informBearer,
                savedOrders,
                setSavedOrders,
                baseUrl,
                configLoading,
                getHeaders
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
