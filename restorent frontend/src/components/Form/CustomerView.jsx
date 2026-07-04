import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    FaArrowLeft, FaEdit, FaUser, FaPhone, FaWhatsapp, 
    FaEnvelope, FaMapMarkerAlt, FaUsers, FaBuilding,
    FaRegAddressCard, FaIdCard, FaGlobe
} from "react-icons/fa";
import { getHeaders } from "../../utils/authUtils";

const CustomerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customerGroups, setCustomerGroups] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const baseUrl = localStorage.getItem('api_base_url') || '';
                const [custRes, groupsRes] = await Promise.all([
                    axios.get(`${baseUrl}/api/customers/${id}`, { headers: getHeaders() }),
                    axios.get(`${baseUrl}/api/customer-groups`, { headers: getHeaders() })
                ]);
                setCustomer(custRes.data);
                setCustomerGroups(groupsRes.data || []);
            } catch (e) {
                console.error("Fetch failed", e);
                setError("Failed to load customer details. Please ensure you are logged in.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div style={styles.loaderContainer}>
            <div className="spinner"></div>
            <p>Loading Customer Details...</p>
        </div>
    );

    if (error) return (
        <div style={styles.errorContainer}>
            <h2 style={{color: '#ef4444'}}>Access Denied or Error</h2>
            <p>{error}</p>
            <button style={styles.backBtn} onClick={() => navigate("/customers")}>
                <FaArrowLeft /> Back to List
            </button>
        </div>
    );

    if (!customer) return (
        <div style={styles.errorContainer}>
            <h2 style={{color: '#f59e0b'}}>Customer Not Found</h2>
            <p>The requested customer record could not be found or you don't have permission to view it.</p>
            <button style={styles.backBtn} onClick={() => navigate("/customers")}>
                <FaArrowLeft /> Back to List
            </button>
        </div>
    );

    const groupName = customerGroups.find(g => g._id === customer.customer_group || g.group_name === customer.customer_group)?.group_name || customer.customer_group || "N/A";

    return (
        <div style={styles.pageWrapper}>
            {/* Header Section */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button style={styles.backBtn} onClick={() => navigate("/customers")}>
                        <FaArrowLeft /> <span style={styles.btnText}>Back</span>
                    </button>
                    <h1 style={styles.title}>Customer Profile</h1>
                </div>
                <button style={styles.editBtn} onClick={() => navigate(`/edit-customer/${id}`)}>
                    <FaEdit /> Edit Customer
                </button>
            </div>

            <div style={styles.contentGrid}>
                {/* Profile Sidebar */}
                <div style={styles.sidebar}>
                    <div style={styles.profileCard}>
                        <div style={styles.avatarWrapper}>
                            <div style={styles.avatar}>
                                <FaUser size={60} color="#fff" />
                            </div>
                        </div>
                        <h2 style={styles.customerName}>{customer.customer_name}</h2>
                        <div style={styles.groupBadge}>{groupName}</div>
                        
                        <div style={styles.quickContact}>
                            <div style={styles.contactItem}>
                                <FaPhone color="#6366f1" /> <span>{customer.phone_number || "No Phone"}</span>
                            </div>
                            {customer.whatsapp_number && (
                                <div style={styles.contactItem}>
                                    <FaWhatsapp color="#25d366" /> <span>{customer.whatsapp_number}</span>
                                </div>
                            )}
                            {customer.email && (
                                <div style={styles.contactItem}>
                                    <FaEnvelope color="#64748b" /> <span style={styles.emailText}>{customer.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.companySection}>
                        <h4 style={styles.sectionTitle}><FaBuilding /> Company Assignment</h4>
                        <div style={styles.companyList}>
                            {Array.isArray(customer.company_name) ? (
                                customer.company_name.map((c, i) => (
                                    <span key={i} style={styles.companyTag}>{c}</span>
                                ))
                            ) : (
                                <span style={styles.companyTag}>{customer.company_name || "All Companies"}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Details Area */}
                <div style={styles.mainDetails}>
                    <div style={styles.detailCard}>
                        <h3 style={styles.cardHeader}><FaIdCard /> Core Information</h3>
                        <div style={styles.grid}>
                            <DetailItem label="Full Name" value={customer.customer_name} icon={<FaUser color="#6366f1" />} />
                            <DetailItem label="Customer Group" value={groupName} icon={<FaUsers color="#8b5cf6" />} />
                            <DetailItem label="Phone Number" value={customer.phone_number} icon={<FaPhone color="#6366f1" />} />
                            <DetailItem label="WhatsApp" value={customer.whatsapp_number} icon={<FaWhatsapp color="#25d366" />} />
                            <DetailItem label="Email Address" value={customer.email} icon={<FaEnvelope color="#64748b" />} />
                        </div>
                    </div>

                    <div style={styles.detailCard}>
                        <h3 style={styles.cardHeader}><FaMapMarkerAlt /> Address Details</h3>
                        <div style={styles.grid}>
                            <DetailItem label="Country" value={customer.address_data?.country} icon={<FaGlobe color="#3b82f6" />} />
                            <DetailItem label="Building / Street" value={customer.address_data?.building_name} icon={<FaBuilding color="#94a3b8" />} />
                            <DetailItem label="Flat / Villa No" value={customer.address_data?.flat_villa_no} icon={<FaRegAddressCard color="#94a3b8" />} />
                            <DetailItem label="Province/State" value={customer.address_data?.field1} />
                            <DetailItem label="District/City" value={customer.address_data?.field2} />
                            <DetailItem label="Area/Locality" value={customer.address_data?.field3} />
                        </div>
                    </div>

                    {/* Additional Fields if any */}
                    {Object.keys(customer).some(k => !['customer_name', 'phone_number', 'whatsapp_number', 'email', 'customer_group', 'company_name', 'company_names', 'address_data', '_id', 'created_at', 'modified_at', 'createdBy', 'branch_name', 'branch_names'].includes(k)) && (
                        <div style={styles.detailCard}>
                            <h3 style={styles.cardHeader}>Extended Attributes</h3>
                            <div style={styles.grid}>
                                {Object.keys(customer).map(key => {
                                    if (['customer_name', 'phone_number', 'whatsapp_number', 'email', 'customer_group', 'company_name', 'company_names', 'address_data', '_id', 'created_at', 'modified_at', 'createdBy', 'branch_name', 'branch_names'].includes(key)) return null;
                                    return <DetailItem key={key} label={key.replace(/_/g, ' ')} value={customer[key]} />;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #6366f1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const DetailItem = ({ label, value, icon }) => (
    <div style={styles.detailItem}>
        <div style={styles.detailLabel}>
            {icon && <span style={styles.detailIcon}>{icon}</span>}
            {label}
        </div>
        <div style={styles.detailValue}>{value || "N/A"}</div>
    </div>
);

const styles = {
    pageWrapper: {
        padding: "32px 48px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: "#1e293b"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px",
        maxWidth: "1400px",
        margin: "0 auto 40px auto"
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "24px"
    },
    title: {
        fontSize: "32px",
        fontWeight: "850",
        margin: 0,
        color: "#0f172a",
        letterSpacing: "-0.025em"
    },
    backBtn: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 24px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fff",
        color: "#64748b",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    btnText: {
        fontSize: "15px"
    },
    editBtn: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 32px",
        borderRadius: "18px",
        border: "none",
        backgroundColor: "#6366f1",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "16px",
        boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    },
    contentGrid: {
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: "40px",
        maxWidth: "1400px",
        margin: "0 auto"
    },
    sidebar: {
        display: "flex",
        flexDirection: "column",
        gap: "32px"
    },
    profileCard: {
        backgroundColor: "#fff",
        borderRadius: "32px",
        padding: "48px 32px",
        textAlign: "center",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
        border: "1px solid rgba(255, 255, 255, 1)"
    },
    avatarWrapper: {
        marginBottom: "32px",
        display: "flex",
        justifyContent: "center"
    },
    avatar: {
        width: "140px",
        height: "140px",
        borderRadius: "48px",
        backgroundColor: "#6366f1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.3)",
        transform: "rotate(-3deg)"
    },
    customerName: {
        fontSize: "28px",
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: "12px",
        margin: 0,
        letterSpacing: "-0.025em"
    },
    groupBadge: {
        display: "inline-block",
        padding: "8px 20px",
        borderRadius: "24px",
        backgroundColor: "#f5f3ff",
        color: "#7c3aed",
        fontSize: "14px",
        fontWeight: "700",
        marginBottom: "32px",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
    },
    quickContact: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        borderTop: "1px solid #f1f5f9",
        paddingTop: "32px",
        alignItems: "flex-start"
    },
    contactItem: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        color: "#475569",
        fontSize: "15px",
        fontWeight: "500"
    },
    emailText: {
        wordBreak: "break-all",
        textAlign: "left",
        color: "#6366f1"
    },
    companySection: {
        backgroundColor: "#fff",
        borderRadius: "32px",
        padding: "32px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
        border: "1px solid rgba(255, 255, 255, 1)"
    },
    sectionTitle: {
        fontSize: "17px",
        fontWeight: "750",
        color: "#334155",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
        margin: 0
    },
    companyList: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px"
    },
    companyTag: {
        padding: "8px 16px",
        borderRadius: "12px",
        backgroundColor: "#f1f5f9",
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569"
    },
    mainDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "40px"
    },
    detailCard: {
        backgroundColor: "#fff",
        borderRadius: "32px",
        padding: "40px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
        border: "1px solid rgba(255, 255, 255, 1)"
    },
    cardHeader: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#0f172a",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: "1px solid #f1f5f9",
        margin: 0,
        letterSpacing: "-0.025em"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "32px"
    },
    detailItem: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    detailLabel: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    detailValue: {
        fontSize: "17px",
        fontWeight: "600",
        color: "#1e293b"
    },
    detailIcon: {
        fontSize: "16px"
    },
    loaderContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "24px",
        color: "#64748b",
        backgroundColor: "#f8fafc"
    },
    errorContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        padding: "48px",
        backgroundColor: "#f8fafc"
    }
};

export default CustomerView;
