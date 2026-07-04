import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { 
  FaArrowLeft, FaPlus, FaTrash, FaSave, FaEdit, 
  FaUser, FaUsers, FaCheckCircle, FaExclamationCircle,
  FaMapMarkerAlt, FaChevronRight, FaCogs, FaBox, FaUtensils, FaLeaf, FaPlusCircle, FaLayerGroup, FaInfoCircle,
  FaUserTie, FaBriefcase, FaIdCard, FaBuilding, FaClock, FaUmbrellaBeach, FaMoneyBillWave, FaCalendarCheck, FaCalendarAlt, FaTools
} from 'react-icons/fa';
import { UserContext } from "../../Context/UserContext";
import { checkIsGlobalAdmin } from "../../utils/authUtils";

const DocType = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { baseUrl, getHeaders } = useContext(UserContext);
    
    // Check for direct jump params (e.g. ?name=Customer&return=/create-customer)
    const searchParams = new URLSearchParams(location.search);
    const initialDocType = searchParams.get('name');
    const returnUrl = searchParams.get('return');
    
    const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' or 'fields'
    const [selectedDocType, setSelectedDocType] = useState("Customer");
    const [doctypeData, setDoctypeData] = useState({ name: "", fields: [] });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showAddField, setShowAddField] = useState(false);
    
    const [newField, setNewField] = useState({
        label: "",
        type: "Data",
        mandatory: false,
        allow_create_new: false,
        hidden: false
    });

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [userCompany, setUserCompany] = useState("");
    const [selectedCompanies, setSelectedCompanies] = useState([]); // Initialize empty
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

    const fieldTypes = ["Data", "Select", "Date", "Time", "Datetime", "Check", "Number", "Text", "Table", "Attach Image", "Section Break"];
    const coreDocTypes = [
        "Customer", "Customer Group", "Address Structure", "Item", 
        "Kitchen", "Item Group", "Variant", "Ingredient & Nutrition",
        "Addon", "Combo", "Combo Offer", "Employee", "Employee Designation",
        "Employee Type", "Employee Department", "Attendance", "Leave Type",
        "Leave Allocation", "Leave Apply", "Salary Slip", "Holiday List",
        "Roaster", "Schedule Master", "Schedule Assign Employee",
        "Purchase Item", "Supplier", "Purchase Order", "Purchase Receipt", 
        "Purchase Invoice", "Purchase Report", "Purchase Taxes and Charges",
        "Purchase Receipt Item", "Purchase Invoice Item", "Purchase Order Item",
        "Tax Master"
    ];
    const [availableDocTypes, setAvailableDocTypes] = useState(coreDocTypes);

    const [editingField, setEditingField] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const fetchAllDoctypes = async () => {
            try {
                const targetComp = (selectedCompanies && selectedCompanies.length > 0) ? selectedCompanies[0] : null;
                const url = `${baseUrl || ""}/api/doctypes`;
                const response = await axios.get(url, { headers: getHeaders(null, targetComp) });
                if (response.data && Array.isArray(response.data)) {
                    const dynamicNames = response.data.map(d => d.name).filter(n => n);
                    const merged = [...new Set([...coreDocTypes, ...dynamicNames])];
                    setAvailableDocTypes(merged);
                }
            } catch (error) {
                console.error("Error fetching dynamic doctypes:", error);
            }
        };

        if (selectedCompanies.length > 0) {
            fetchAllDoctypes();
        }
    }, [selectedCompanies, baseUrl]);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const userObj = JSON.parse(userStr);
            const isGA = checkIsGlobalAdmin(userObj);
            setIsGlobalAdmin(isGA);
            setUserCompany(userObj.company_name || userObj.company || "");
            
            if (isGA) {
                fetchCompanies();
                // Default to the user's own group/company instead of 'All' to prevent accidental global leaks
                const comp = userObj.company_name || userObj.company;
                if (comp) {
                    setSelectedCompanies([comp]);
                } else {
                    setSelectedCompanies(["All"]);
                }
            } else if (userObj.company_name || userObj.company) {
                const comp = userObj.company_name || userObj.company;
                console.log("Setting userCompany to:", comp);
                setSelectedCompanies([comp]); // Force company for CA
                fetchBranches(comp);
            }

            // Handle direct jumping to a specific DocType
            if (initialDocType) {
                setSelectedDocType(initialDocType);
                setViewMode("fields");
            }
        }
    }, [initialDocType]);

    useEffect(() => {
        if (viewMode === 'fields') {
            fetchDoctypeData(selectedDocType);
        }
        // Only trigger on selectedDocType or viewMode changes to prevent the company-selection loop
    }, [selectedDocType, viewMode]);

    const fetchCompanies = async () => {
        try {
            const url = `${baseUrl || ""}/api/company-details`;
            const response = await axios.get(url, { headers: getHeaders() });
            const details = Array.isArray(response.data) ? response.data : (response.data?.companyDetails || []);
            const names = details.map(d => d.company_name).filter(n => n);
            setCompanies([...new Set(names)]);

            // Group Admin resolution handled by auth
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const fetchBranches = async (companyName) => {
        try {
            const url = `${baseUrl || ""}/api/branches`;
            const response = await axios.get(url, { headers: getHeaders() });
            const details = response.data || [];
            // Filter branches for the specific company
            const companyBranches = details
                .filter(d => (d.company_name === companyName || d.company === companyName) && d.branch_name && d.branch_name !== 'All Branches')
                .map(d => d.branch_name);
            setBranches([...new Set(companyBranches)]);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    const fetchDoctypeData = async (name) => {
        setLoading(true);
        try {
            // Use the first selected company for tenancy context during fetch
            const targetComp = (selectedCompanies && selectedCompanies.length > 0) ? selectedCompanies[0] : null;
            const url = `${baseUrl || ""}/api/doctypes/${name}`;
            const response = await axios.get(url, { headers: getHeaders(null, targetComp) });
            let docData = response.data;
            
            // HYDRATE DEFAULT FIELDS
            if (!docData.fields) docData.fields = [];
            
            const getDefaultFields = (docType) => {
                switch (docType) {
                    case 'Customer':
                        return [
                            { id: 'sec_general', label: 'General Information', type: 'Section Break' },
                            { id: 'customer_name', label: 'Customer Name', type: 'Data', mandatory: true },
                            { id: 'phone_number', label: 'Phone Number', type: 'Data', mandatory: true },
                            { id: 'whatsapp_number', label: 'WhatsApp Number', type: 'Data', mandatory: false },
                            { id: 'email', label: 'Email', type: 'Data', mandatory: false },
                            { id: 'sec_address', label: 'Address', type: 'Section Break' },
                            { id: 'address_data', label: 'Address Data', type: 'Table', link_doctype: 'Address Structure', mandatory: false },
                            { id: 'sec_group', label: 'Customer Group', type: 'Section Break' },
                            { id: 'customer_group', label: 'Customer Group', type: 'Table', link_doctype: 'Customer Group', mandatory: false }
                        ];
                    case 'Purchase Order':
                        return [
                            { id: 'sec_po_basic', label: 'Basic Details', type: 'Section Break' },
                            { id: 'serial_no', label: 'Serial No', type: 'Data', mandatory: true },
                            { id: 'date', label: 'Date', type: 'Date', mandatory: true },
                            { id: 'supplier', label: 'Supplier', type: 'Link', link_doctype: 'Supplier', mandatory: true },
                            { id: 'supplier_code', label: 'Supplier Code', type: 'Data', mandatory: false },
                            { id: 'currency', label: 'Currency', type: 'Select', mandatory: false },
                            { id: 'supplier_group', label: 'Supplier Group', type: 'Select', mandatory: false },
                            { id: 'company', label: 'Company', type: 'Link', link_doctype: 'Company', mandatory: true },
                            { id: 'sec_po_items', label: 'Purchase Items Details', type: 'Section Break' },
                            { id: 'items', label: 'Purchase Items', type: 'Table', link_doctype: 'Purchase Order Item', mandatory: true },
                            { id: 'sec_po_taxes', label: 'Taxes and Charges', type: 'Section Break' },
                            { id: 'taxes', label: 'Purchase Taxes and Charges', type: 'Table', link_doctype: 'Purchase Taxes and Charges', mandatory: false }
                        ];
                    case 'Purchase Item':
                        return [
                            { id: 'sec_pi_basic', label: 'Basic Details', type: 'Section Break' },
                            { id: 'brand', label: 'Brand', type: 'Link', link_doctype: 'Brand', mandatory: true, allow_create_new: true },
                            { id: 'item_name', label: 'Item Name', type: 'Data', mandatory: true },
                            { id: 'sec_pi_measure', label: 'Measurements', type: 'Section Break' },
                            { id: 'grams', label: 'Grams', type: 'Number', mandatory: false },
                            { id: 'packets_per_box', label: 'Packets per Box', type: 'Number', mandatory: true },
                            { id: 'units_per_packet', label: 'Units per Packet', type: 'Number', mandatory: true },
                            { id: 'total_units_per_box', label: 'Total Units per Box', type: 'Number', mandatory: false },
                            { id: 'sec_pi_supp', label: 'Supplier Details', type: 'Section Break' },
                            { id: 'supplier', label: 'Supplier', type: 'Link', link_doctype: 'Supplier', mandatory: false }
                        ];
                    case 'Purchase Order Item':
                        return [
                            { id: 'item_code', label: 'Item Code', type: 'Link', link_doctype: 'Item', mandatory: true },
                            { id: 'quantity', label: 'Quantity', type: 'Number', mandatory: true },
                            { id: 'uom', label: 'UOM', type: 'Select', mandatory: true },
                            { id: 'rate', label: 'Rate ($AED)', type: 'Number', mandatory: true },
                            { id: 'amount', label: 'Amount ($AED)', type: 'Number', mandatory: true }
                        ];
                    case 'Purchase Taxes and Charges':
                        return [
                            { id: 'type', label: 'Type', type: 'Select', mandatory: true },
                            { id: 'tax_rate', label: 'Tax Rate', type: 'Number', mandatory: false },
                            { id: 'amount', label: 'Amount', type: 'Number', mandatory: false },
                            { id: 'total', label: 'Total', type: 'Number', mandatory: false }
                        ];
                    case 'Supplier':
                        return [
                            { id: 'sec_sup_basic', label: 'Basic Details', type: 'Section Break' },
                            { id: 'supplier_code', label: 'Supplier Code', type: 'Data', mandatory: false },
                            { id: 'supplier_name', label: 'Supplier Name', type: 'Data', mandatory: true },
                            { id: 'supplier_group', label: 'Supplier Group', type: 'Select', mandatory: false },
                            { id: 'currency', label: 'Currency', type: 'Select', mandatory: false },
                            { id: 'sec_sup_contact', label: 'Contact Details', type: 'Section Break' },
                            { id: 'phone_number', label: 'Phone Number', type: 'Data', mandatory: false },
                            { id: 'mobile_number', label: 'Mobile Number', type: 'Data', mandatory: false },
                            { id: 'email', label: 'Email', type: 'Data', mandatory: false },
                            { id: 'country', label: 'Country', type: 'Select', mandatory: false },
                            { id: 'sec_sup_other', label: 'Other Details', type: 'Section Break' },
                            { id: 'is_transporter', label: 'Is Transporter', type: 'Check', mandatory: false },
                            { id: 'internal_supplier', label: 'Internal Supplier', type: 'Check', mandatory: false },
                            { id: 'payment_terms', label: 'Payment Terms', type: 'Data', mandatory: false }
                        ];
                    case 'Purchase Receipt':
                        return [
                            { id: 'sec_pr_basic', label: 'Basic Details', type: 'Section Break' },
                            { id: 'series', label: 'Series', type: 'Data', mandatory: true },
                            { id: 'date', label: 'Date', type: 'Date', mandatory: true },
                            { id: 'company', label: 'Company', type: 'Link', link_doctype: 'Company', mandatory: true },
                            { id: 'purchase_order', label: 'Purchase Order', type: 'Link', link_doctype: 'Purchase Order', mandatory: true },
                            { id: 'supplier', label: 'Supplier', type: 'Link', link_doctype: 'Supplier', mandatory: true },
                            { id: 'supplier_code', label: 'Supplier Code', type: 'Data', mandatory: false },
                            { id: 'currency', label: 'Currency', type: 'Select', mandatory: false },
                            { id: 'supplier_group', label: 'Supplier Group', type: 'Select', mandatory: false },
                            { id: 'sec_pr_items', label: 'Purchase Items Details', type: 'Section Break' },
                            { id: 'items', label: 'Purchase Items', type: 'Table', link_doctype: 'Purchase Receipt Item', mandatory: true },
                            { id: 'sec_pr_taxes', label: 'Taxes and Charges', type: 'Section Break' },
                            { id: 'taxes', label: 'Purchase Taxes and Charges', type: 'Table', link_doctype: 'Purchase Taxes and Charges', mandatory: false }
                        ];
                    case 'Purchase Receipt Item':
                        return [
                            { id: 'item', label: 'Item', type: 'Link', link_doctype: 'Item', mandatory: true },
                            { id: 'accepted_quantity', label: 'Accepted Quantity', type: 'Number', mandatory: true },
                            { id: 'rejected_quantity', label: 'Rejected Quantity', type: 'Number', mandatory: false },
                            { id: 'rate', label: 'Rate ($)', type: 'Number', mandatory: true },
                            { id: 'amount', label: 'Amount ($)', type: 'Number', mandatory: true },
                            { id: 'uom', label: 'UOM', type: 'Select', mandatory: false }
                        ];
                    case 'Purchase Invoice':
                        return [
                            { id: 'sec_pi_basic', label: 'Basic Details', type: 'Section Break' },
                            { id: 'series', label: 'Series', type: 'Data', mandatory: true },
                            { id: 'date', label: 'Date', type: 'Date', mandatory: true },
                            { id: 'supplier', label: 'Supplier', type: 'Link', link_doctype: 'Supplier', mandatory: true },
                            { id: 'supplier_code', label: 'Supplier Code', type: 'Data', mandatory: false },
                            { id: 'currency', label: 'Currency', type: 'Select', mandatory: false },
                            { id: 'supplier_group', label: 'Supplier Group', type: 'Select', mandatory: false },
                            { id: 'purchase_order', label: 'Purchase Order', type: 'Link', link_doctype: 'Purchase Order', mandatory: false },
                            { id: 'purchase_receipt', label: 'Purchase Receipt', type: 'Link', link_doctype: 'Purchase Receipt', mandatory: true },
                            { id: 'company', label: 'Company', type: 'Link', link_doctype: 'Company', mandatory: true },
                            { id: 'sec_pi_items', label: 'Purchase Items Details', type: 'Section Break' },
                            { id: 'items', label: 'Purchase Items', type: 'Table', link_doctype: 'Purchase Invoice Item', mandatory: true },
                            { id: 'sec_pi_taxes', label: 'Taxes and Charges', type: 'Section Break' },
                            { id: 'taxes', label: 'Purchase Taxes and Charges', type: 'Table', link_doctype: 'Purchase Taxes and Charges', mandatory: false }
                        ];
                    case 'Purchase Invoice Item':
                        return [
                            { id: 'item', label: 'Item', type: 'Link', link_doctype: 'Item', mandatory: true },
                            { id: 'accepted_quantity', label: 'Accepted Quantity', type: 'Number', mandatory: true },
                            { id: 'uom', label: 'UOM', type: 'Select', mandatory: false },
                            { id: 'rate', label: 'Rate ($)', type: 'Number', mandatory: true },
                            { id: 'amount', label: 'Amount ($)', type: 'Number', mandatory: true }
                        ];
                    case 'Purchase Report':
                        return [
                            { id: 'sec_rep_basic', label: 'Report Details', type: 'Section Break' },
                            { id: 'report_type', label: 'Report Type', type: 'Select', mandatory: true },
                            { id: 'from_date', label: 'From Date', type: 'Date', mandatory: true },
                            { id: 'to_date', label: 'To Date', type: 'Date', mandatory: true },
                            { id: 'supplier', label: 'Supplier', type: 'Link', link_doctype: 'Supplier', mandatory: false },
                            { id: 'item', label: 'Item', type: 'Link', link_doctype: 'Item', mandatory: false }
                        ];
                    case 'Item Group':
                        return [
                            { id: 'group_name', label: 'Group Name', type: 'Data', mandatory: true }
                        ];
                    default:
                        return [];
                }
            };

            if (name === "Employee") {
                const hasSections = docData.fields.some(f => f.type === 'Section Break');
                if (!hasSections) {
                    const newFields = [];
                    const sectionsList = [
                        { label: "Basic Details", key: "details" },
                        { label: "Personal Info", key: "personal" },
                        { label: "Employment", key: "employment" },
                        { label: "Salary", key: "salary" },
                        { label: "Professional", key: "professional" },
                        { label: "Other Details", key: "other" },
                        { label: "Credentials", key: "credentials" }
                    ];

                    const mapping = {
                        name: 'details', employee_id: 'details', phone_number: 'details', email: 'details', status: 'details', profile_image: 'details', 
                        username: 'credentials', password: 'credentials',
                        gender: 'personal', date_of_birth: 'personal', salutation: 'personal', marital_status: 'personal', id_number: 'personal', id_expiry: 'personal', nationality: 'personal', address: 'personal',
                        date_of_joining: 'employment', employee_designation: 'employment', employee_type: 'employment', department: 'employment',
                        basic_salary: 'salary', hra: 'salary', ta: 'salary', oa: 'salary', total_salary: 'salary',
                        education: 'professional', previous_experience: 'professional', skills: 'professional',
                        bank_name: 'other', account_holder_name: 'other', account_number: 'other', branch_code: 'other', health_info: 'other', family_details: 'other'
                    };

                    sectionsList.forEach(sec => {
                        newFields.push({
                            id: sec.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now() + Math.floor(Math.random()*1000),
                            label: sec.label,
                            type: 'Section Break',
                            mandatory: false,
                            hidden: false,
                            idx: newFields.length
                        });
                        
                        docData.fields.forEach(f => {
                            if (f.type !== 'Section Break') {
                                const fTab = mapping[f.id] || 'details';
                                if (fTab === sec.key) {
                                    newFields.push(f);
                                }
                            }
                        });
                    });
                    docData.fields = newFields;
                }
            } else {
                const defaultFields = getDefaultFields(name);
                
                // Cleanup unwanted fields for Purchase Item
                if (name === 'Purchase Item') {
                    docData.fields = docData.fields.filter(f => {
                        const isItemCode = f.id === 'item_code' || (f.label && f.label.toLowerCase() === 'item code');
                        const isTargetComp = f.id.includes('target') || (f.label && f.label.toLowerCase().includes('target'));
                        return !isItemCode && !isTargetComp;
                    }).map(f => {
                        if (f.id === 'brand') {
                            return { ...f, type: 'Link', link_doctype: 'Brand', allow_create_new: true };
                        }
                        return f;
                    });
                }
                
                if (defaultFields.length > 0) {
                    defaultFields.forEach((df, index) => {
                        const exists = docData.fields.some(f => 
                            f.id === df.id || 
                            (f.label && df.label && f.label.toLowerCase() === df.label.toLowerCase())
                        );
                        if (!exists) {
                            docData.fields.splice(index, 0, {
                                ...df,
                                is_default: true,
                                hidden: false,
                                idx: index
                            });
                        }
                    });
                    docData.fields = docData.fields.map((f, i) => ({ ...f, idx: i }));
                }
            }

            setDoctypeData(docData);
            
            // Only Global Admins should have their targeting context updated from the loaded record
            // Company Admins should stay locked to their company/branch targeting
            if (isGlobalAdmin) {
                if (response.data.company_names && response.data.company_names.length > 0) {
                    setSelectedCompanies(response.data.company_names);
                } else {
                    setSelectedCompanies(["All"]);
                }
            } else {
                // For Company Admins, ensure their company is selected if no specific branch/company is set
                setSelectedCompanies(prev => {
                    const filtered = prev.filter(c => c !== "All");
                    return filtered.length > 0 ? filtered : [userCompany];
                });
            }
            
            // Show specialized message for Variant and Ingredient & Nutrition
            if (name === 'Variant' || name === 'Ingredient & Nutrition') {
                showToast(`Note: ${name} fields are integrated with the Item creation module.`, "info");
            }
        } catch (error) {
            console.error("Error fetching doctype:", error);
            showToast("Failed to fetch doctype configuration", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCompanies || selectedCompanies.length === 0) {
            showToast("Please select at least one target entity (Company or Branch)", "error");
            return;
        }
        setSaving(true);
        try {
            const url = `${baseUrl || ""}/api/doctypes`;
            // Create a clean copy and remove legacy fields that cause contamination
            const cleanData = { ...doctypeData };
            delete cleanData.company;
            delete cleanData.company_name;
            
            // CRITICAL: If targeting a specific company/group, but editing a Global DocType,
            // clear the _id so a new isolated record is created instead of overwriting "All".
            const isTargetingSpecific = selectedCompanies.length > 0 && !selectedCompanies.includes('All');
            const isEditingGlobal = doctypeData?.company_names?.includes('All') || !doctypeData?.company_names;

            const payload = {
                ...cleanData,
                company_names: selectedCompanies
            };

            if (isTargetingSpecific && isEditingGlobal) {
                delete payload._id;
            }

            console.log("Saving payload (Cleaned):", JSON.stringify(payload, null, 2));
            await axios.post(url, payload, { headers: getHeaders() });
            showToast("DocType updated successfully", "success");
            fetchDoctypeData(selectedDocType);
            
            // If we came from a specific page, return after a short delay
            if (returnUrl) {
                setTimeout(() => navigate(returnUrl), 1500);
            }
        } catch (error) {
            console.error("Error saving doctype:", error);
            showToast("Failed to save doctype configuration", "error");
        } finally {
            setSaving(false);
        }
    };

    const addField = () => {
        if (!newField.label.trim()) {
            showToast("Field label is required", "error");
            return;
        }

        if (newField.type === 'Table' && !newField.link_doctype) {
            showToast("Linked DocType is required for Table type", "error");
            return;
        }

        const fieldId = newField.label.toLowerCase().replace(/\s+/g, '_');
        
        if (doctypeData.fields.some(f => f.id === fieldId)) {
            showToast("Field with this name already exists", "error");
            return;
        }

        const updatedFields = [
            ...doctypeData.fields,
            {
                ...newField,
                id: fieldId,
                is_default: false
            }
        ];

        setDoctypeData({ ...doctypeData, fields: updatedFields });
        setNewField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false });
        setShowAddField(false);
    };

    const deleteField = (id) => {
        if (window.confirm("Are you sure you want to delete this field?")) {
            const updatedFields = doctypeData.fields.filter(f => f.id !== id);
            setDoctypeData({ ...doctypeData, fields: updatedFields });
        }
    };

    const startEditing = (field) => {
        setEditingField({ ...field });
        setShowEditModal(true);
    };

    const saveEdit = () => {
        if (!editingField.label.trim()) {
            showToast("Field label is required", "error");
            return;
        }
        const updatedFields = doctypeData.fields.map(f => f.id === editingField.id ? editingField : f);
        setDoctypeData({ ...doctypeData, fields: updatedFields });
        setShowEditModal(false);
        setEditingField(null);
    };

    const toggleMandatory = (id) => {
        const updatedFields = doctypeData.fields.map(f => {
            if (f.id === id) {
                return { ...f, mandatory: !f.mandatory };
            }
            return f;
        });
        setDoctypeData({ ...doctypeData, fields: updatedFields });
    };

    const toggleHidden = (id) => {
        const updatedFields = doctypeData.fields.map(f => {
            if (f.id === id) {
                return { ...f, hidden: !f.hidden };
            }
            return f;
        });
        setDoctypeData({ ...doctypeData, fields: updatedFields });
    };

    const updateFieldType = (id, newType) => {
        const updatedFields = doctypeData.fields.map(f => {
            if (f.id === id) {
                return { ...f, type: newType, link_doctype: newType === 'Table' ? (f.link_doctype || availableDocTypes[0]) : undefined };
            }
            return f;
        });
        setDoctypeData({ ...doctypeData, fields: updatedFields });
    };

    const updateFieldLink = (id, linkDocType) => {
        const updatedFields = doctypeData.fields.map(f => {
            if (f.id === id) {
                return { ...f, link_doctype: linkDocType };
            }
            return f;
        });
        setDoctypeData({ ...doctypeData, fields: updatedFields });
    };

    const showToast = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    const handleBoxClick = (type) => {
        setSelectedDocType(type);
        setViewMode('fields');
    };

    const getIcon = (type) => {
        switch(type) {
            case 'Customer': return <FaUser style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Customer Group': return <FaUsers style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Address Structure': return <FaMapMarkerAlt style={{ fontSize: '32px', color: '#f59e0b' }} />;
            case 'Item': return <FaBox style={{ fontSize: '32px', color: '#ec4899' }} />;
            case 'Kitchen': return <FaUtensils style={{ fontSize: '32px', color: '#f59e0b' }} />;
            case 'Item Group': return <FaBox style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Variant': return <FaCogs style={{ fontSize: '32px', color: '#6366f1' }} />;
            case 'Ingredient & Nutrition': return <FaLeaf style={{ fontSize: '32px', color: '#8b5cf6' }} />;
            case 'Addon': return <FaPlusCircle style={{ fontSize: '32px', color: '#ef4444' }} />;
            case 'Combo': return <FaLayerGroup style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Combo Offer': return <FaPlusCircle style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Employee': return <FaUserTie style={{ fontSize: '32px', color: '#1e293b' }} />;
            case 'Employee Designation': return <FaBriefcase style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Employee Type': return <FaIdCard style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Employee Department': return <FaBuilding style={{ fontSize: '32px', color: '#f59e0b' }} />;
            case 'Attendance': return <FaClock style={{ fontSize: '32px', color: '#ec4899' }} />;
            case 'Leave Type': return <FaUmbrellaBeach style={{ fontSize: '32px', color: '#8b5cf6' }} />;
            case 'Leave Allocation': return <FaCheckCircle style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Leave Apply': return <FaPlusCircle style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Salary Slip': return <FaMoneyBillWave style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Holiday List': return <FaCalendarCheck style={{ fontSize: '32px', color: '#ef4444' }} />;
            case 'Roaster': return <FaCalendarAlt style={{ fontSize: '32px', color: '#6366f1' }} />;
            case 'Schedule Master': return <FaTools style={{ fontSize: '32px', color: '#475569' }} />;
            case 'Schedule Assign Employee': return <FaUsers style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Purchase Item': return <FaBox style={{ fontSize: '32px', color: '#ec4899' }} />;
            case 'Supplier': return <FaUserTie style={{ fontSize: '32px', color: '#f59e0b' }} />;
            case 'Purchase Order': return <FaCheckCircle style={{ fontSize: '32px', color: '#10b981' }} />;
            case 'Purchase Receipt': return <FaBox style={{ fontSize: '32px', color: '#3b82f6' }} />;
            case 'Purchase Invoice': return <FaMoneyBillWave style={{ fontSize: '32px', color: '#6366f1' }} />;
            case 'Purchase Report': return <FaLayerGroup style={{ fontSize: '32px', color: '#8b5cf6' }} />;
            case 'Tax Master': return <FaMoneyBillWave style={{ fontSize: '32px', color: '#10b981' }} />;
            default: return <FaCogs style={{ fontSize: '32px', color: '#6366f1' }} />;
        }
    };

    const getDescription = (type) => {
        switch(type) {
            case 'Customer': return 'Manage custom fields for customer profiles and details.';
            case 'Customer Group': return 'Configure groups and categories for customer segmentation.';
            case 'Address Structure': return 'Define country-wise address hierarchies and structures.';
            case 'Item': return 'Configure custom fields for menu items and products.';
            case 'Kitchen': return 'Manage kitchen stations and preparation areas.';
            case 'Item Group': return 'Configure categories and groups for item classification.';
            case 'Variant': return 'Define product variants like size, color, or portion.';
            case 'Ingredient & Nutrition': return 'Manage ingredient lists and nutritional facts for items.';
            case 'Addon': return 'Configure optional extras and addons for items.';
            case 'Combo': return 'Define combined offers and meal packages.';
            case 'Combo Offer': return 'Manage special promotional combo offers with unique pricing.';
            case 'Employee': return 'Manage custom fields for employee profiles and staff details.';
            case 'Employee Designation': return 'Configure staff roles and organizational designations.';
            case 'Employee Type': return 'Define employment categories like Full-time, Part-time, or Contract.';
            case 'Employee Department': return 'Manage organizational departments and divisions.';
            case 'Attendance': return 'Configure attendance tracking fields and validation rules.';
            case 'Leave Type': return 'Define types of leaves like Sick Leave, Annual Leave, etc.';
            case 'Leave Allocation': return 'Manage leave balance assignments for employees.';
            case 'Leave Apply': return 'Configure leave application forms and workflows.';
            case 'Salary Slip': return 'Manage custom fields for payroll and salary generation.';
            case 'Holiday List': return 'Configure public holidays and weekly-off structures.';
            case 'Roaster': return 'Manage staff rosters and shift rotations.';
            case 'Schedule Master': return 'Define work schedules and time-slot templates.';
            case 'Schedule Assign Employee': return 'Manage schedule assignments for individual staff members.';
            case 'Purchase Item': return 'Manage custom fields for items purchased from suppliers.';
            case 'Supplier': return 'Configure custom fields for supplier profiles and details.';
            case 'Purchase Order': return 'Manage custom fields and structures for Purchase Orders.';
            case 'Purchase Receipt': return 'Configure custom fields for receiving purchased goods.';
            case 'Purchase Invoice': return 'Manage custom fields for supplier billing and invoices.';
            case 'Purchase Report': return 'Configure custom filters and fields for purchase reports.';
            case 'Tax Master': return 'Configure tax rates, types, and active status for your tax module.';
            default: return 'Configure custom fields for system modules.';
        }
    };

    return (
        <div className="doctype-manager" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '40px 20px',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Header Area */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <button
                    onClick={() => {
                        if (returnUrl) {
                            navigate(returnUrl);
                        } else if (viewMode === 'fields') {
                            setViewMode('dashboard');
                        } else {
                            navigate('/admin');
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 28px',
                        borderRadius: '16px',
                        border: 'none',
                        background: '#ffffff',
                        color: '#1e293b',
                        fontWeight: '700',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <FaArrowLeft /> {returnUrl ? 'Back to Form' : (viewMode === 'fields' ? 'Back to Dashboard' : 'Back to Admin')}
                </button>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '32px',
                        fontWeight: '900',
                        color: '#0f172a',
                        letterSpacing: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <div style={{ width: '45px', height: '45px', background: '#3b82f6', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                            <FaCogs style={{ fontSize: '24px' }} />
                        </div>
                        DocType Configuration
                    </h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0', fontWeight: '500' }}>Customize system modules and data structures</p>
                </div>

                {viewMode === 'fields' ? (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ 
                            padding: '12px 25px', 
                            backgroundColor: saving ? '#95a5a6' : '#2ecc71', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: saving ? 'not-allowed' : 'pointer', 
                            fontSize: '1rem', 
                            fontWeight: '600', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            transition: 'all 0.3s ease',
                            pointerEvents: saving ? 'none' : 'auto'
                        }}
                    >
                        <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                ) : <div style={{ width: '180px' }}></div>}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {viewMode === 'dashboard' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '60px' }}>
                        {/* Customer Management Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                    <FaUsers />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Customer Management</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '30px',
                                padding: '10px'
                            }}>
                                {availableDocTypes.filter(t => ["Customer", "Customer Group", "Address Structure"].includes(t)).map(type => (
                                    <div
                                        key={type}
                                        onClick={() => handleBoxClick(type)}
                                        className="doctype-card"
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '32px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '24px',
                                            transition: 'all 0.4s ease'
                                        }} className="icon-container">
                                            {getIcon(type)}
                                        </div>
                                        
                                        <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                        <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                            {getDescription(type)}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                                            borderBottomLeftRadius: '100px',
                                            zIndex: 0
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Item & Product Management Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#ec4899', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                    <FaBox />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Item & Product Management</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '30px',
                                padding: '10px'
                            }}>
                                {availableDocTypes.filter(t => [
                                    "Item", "Kitchen", "Item Group", "Variant", 
                                    "Ingredient & Nutrition", "Addon", "Combo", "Combo Offer"
                                ].includes(t)).map(type => (
                                    <div
                                        key={type}
                                        onClick={() => handleBoxClick(type)}
                                        className="doctype-card"
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '32px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '24px',
                                            transition: 'all 0.4s ease'
                                        }} className="icon-container">
                                            {getIcon(type)}
                                        </div>
                                        
                                        <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                        <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                            {getDescription(type)}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, transparent 100%)',
                                            borderBottomLeftRadius: '100px',
                                            zIndex: 0
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tax Management Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#10b981', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                    <FaMoneyBillWave />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Tax Management</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '30px',
                                padding: '10px'
                            }}>
                                {availableDocTypes.filter(t => ["Tax Master"].includes(t)).map(type => (
                                    <div
                                        key={type}
                                        onClick={() => handleBoxClick(type)}
                                        className="doctype-card"
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '32px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '24px',
                                            transition: 'all 0.4s ease'
                                        }} className="icon-container">
                                            {getIcon(type)}
                                        </div>
                                        
                                        <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                        <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                            {getDescription(type)}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Employee Management Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#1e293b', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                    <FaUserTie />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Employee Management</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '30px',
                                padding: '10px'
                            }}>
                                {availableDocTypes.filter(t => [
                                    "Employee", "Employee Designation", "Employee Type", "Employee Department",
                                    "Attendance", "Leave Type", "Leave Allocation", "Leave Apply",
                                    "Salary Slip", "Holiday List", "Roaster", "Schedule Master", "Schedule Assign Employee"
                                ].includes(t)).map(type => (
                                    <div
                                        key={type}
                                        onClick={() => handleBoxClick(type)}
                                        className="doctype-card"
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '32px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '24px',
                                            transition: 'all 0.4s ease'
                                        }} className="icon-container">
                                            {getIcon(type)}
                                        </div>
                                        
                                        <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                        <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                            {getDescription(type)}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.1) 0%, transparent 100%)',
                                            borderBottomLeftRadius: '100px',
                                            zIndex: 0
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Purchase Management Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f59e0b', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                    <FaMoneyBillWave />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Purchase Management</h2>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '30px',
                                padding: '10px'
                            }}>
                                {availableDocTypes.filter(t => [
                                    "Purchase Item", "Supplier", "Purchase Order", "Purchase Receipt", "Purchase Invoice", "Purchase Report"
                                ].includes(t)).map(type => (
                                    <div
                                        key={type}
                                        onClick={() => handleBoxClick(type)}
                                        className="doctype-card"
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '32px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '24px',
                                            transition: 'all 0.4s ease'
                                        }} className="icon-container">
                                            {getIcon(type)}
                                        </div>
                                        
                                        <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                        <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                            {getDescription(type)}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            fontSize: '14px'
                                        }}>
                                            Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '100px',
                                            height: '100px',
                                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)',
                                            borderBottomLeftRadius: '100px',
                                            zIndex: 0
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Other / Custom DocTypes Section */}
                        {availableDocTypes.filter(t => !coreDocTypes.includes(t)).length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#8b5cf6', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                        <FaCogs />
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Other / Custom DocTypes</h2>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: '30px',
                                    padding: '10px'
                                }}>
                                    {availableDocTypes.filter(t => !coreDocTypes.includes(t)).map(type => (
                                        <div
                                            key={type}
                                            onClick={() => handleBoxClick(type)}
                                            className="doctype-card"
                                            style={{
                                                background: '#ffffff',
                                                borderRadius: '32px',
                                                padding: '40px',
                                                cursor: 'pointer',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                border: '2px solid transparent',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                background: '#f8fafc',
                                                borderRadius: '24px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: '24px',
                                                transition: 'all 0.4s ease'
                                            }} className="icon-container">
                                                {getIcon(type)}
                                            </div>
                                            
                                            <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{type}</h3>
                                            <p style={{ color: '#64748b', margin: '0 0 24px', lineHeight: '1.6', fontSize: '15px' }}>
                                                {getDescription(type)}
                                            </p>
    
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                color: '#3b82f6',
                                                fontWeight: '700',
                                                fontSize: '14px'
                                            }}>
                                                Configure Fields <FaChevronRight style={{ fontSize: '12px' }} />
                                            </div>
    
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: '100px',
                                                height: '100px',
                                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 100%)',
                                                borderRadius: '0 0 0 100px',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        animation: 'fadeIn 0.4s ease-out'
                    }}>
                        <div style={{ padding: '40px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                background: '#f8fafc',
                                padding: '24px 32px',
                                borderRadius: '24px'
                            }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', fontWeight: '800' }}>
                                        Field Management: {selectedDocType}
                                    </h2>
                                    <p style={{ color: '#64748b', margin: '5px 0 0', fontSize: '14px' }}>Add, edit or remove custom attributes</p>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        padding: '12px 20px', 
                                        background: '#fff', 
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#334155',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            checked={doctypeData.settings?.enable_otp_on_edit || false} 
                                            onChange={() => setDoctypeData(prev => ({
                                                ...prev,
                                                settings: {
                                                    ...prev.settings,
                                                    enable_otp_on_edit: !prev.settings?.enable_otp_on_edit
                                                }
                                            }))}
                                        />
                                        OTP on Edit
                                    </label>

                                    {/* Targeting UI */}
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b' }}>TARGET ENTITIES:</span>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCompanies.includes("All")} 
                                                    disabled={!isGlobalAdmin} // Only GA can save to Global
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCompanies(["All"]);
                                                        else setSelectedCompanies([]);
                                                    }} 
                                                />
                                                Global (All)
                                            </label>

                                            {/* Group/Company Option */}
                                            {userCompany && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: '#3b82f6', opacity: selectedCompanies.includes("All") ? 0.5 : 1 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        disabled={selectedCompanies.includes("All")}
                                                        checked={selectedCompanies.includes(userCompany)} 
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedCompanies(prev => [...prev.filter(c => c !== "All"), userCompany]);
                                                            else setSelectedCompanies(prev => prev.filter(c => c !== userCompany));
                                                        }} 
                                                    />
                                                    {userCompany} ({isGlobalAdmin ? 'Group' : 'Company'})
                                                </label>
                                            )}

                                            {/* Branches Option (Visible for Company Admins and Tenant Admins) */}
                                            {branches.map(br => (
                                                <label key={br} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: '#10b981', opacity: selectedCompanies.includes("All") ? 0.5 : 1 }}>
                                                    <input 
                                                        type="checkbox" 
                                                        disabled={selectedCompanies.includes("All")}
                                                        checked={selectedCompanies.includes(`${userCompany}:${br}`)} 
                                                        onChange={(e) => {
                                                            const key = `${userCompany}:${br}`;
                                                            if (e.target.checked) setSelectedCompanies(prev => [...prev.filter(c => c !== "All"), key]);
                                                            else setSelectedCompanies(prev => prev.filter(c => c !== key));
                                                        }} 
                                                    />
                                                    {br} (Branch)
                                                </label>
                                            ))}

                                            {/* GA View: Only show 'All' and the Group Name as per user request */}
                                            {/* (Sub-companies are hidden to keep UI clean as requested) */}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowAddField(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 24px',
                                            borderRadius: '14px',
                                            border: '2px dashed #cbd5e1',
                                            background: '#fff',
                                            color: '#64748b',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <FaPlus /> Add New Field
                                    </button>
                                </div>
                            </div>

                            {/* Specialized DocType Warning Banner */}
                            {(selectedDocType === 'Variant' || selectedDocType === 'Ingredient & Nutrition') && (
                                <div style={{
                                    marginBottom: '30px',
                                    padding: '15px 25px',
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    borderLeft: '5px solid #3b82f6',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    color: '#1e40af',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <FaInfoCircle style={{ fontSize: '18px', color: '#3b82f6' }} />
                                    <span>Specialized components for <strong>{selectedDocType}</strong> are managed directly within the <strong>Item Creation</strong> flow. Updates made here will be reflected in the dynamic attribute selectors.</span>
                                </div>
                            )}

                            {/* Fields Table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            <th style={{ padding: '0 24px', width: '40px' }}></th>
                                            <th style={{ padding: '0 24px' }}>Label</th>
                                            <th style={{ padding: '0 24px' }}>Identifier</th>
                                            <th style={{ padding: '0 24px' }}>Data Type</th>
                                            <th style={{ padding: '0 24px' }}>Required</th>
                                            <th style={{ padding: '0 24px' }}>Allow Create</th>
                                            <th style={{ padding: '0 24px' }}>Hide</th>
                                            <th style={{ padding: '0 24px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody onDragOver={(e) => e.preventDefault()}>
                                        {doctypeData.fields.map((field, index) => {
                                            const isSection = field.type === 'Section Break';
                                            return (
                                                <tr 
                                                    key={field.id} 
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData("index", index)}
                                                    onDrop={(e) => {
                                                        const fromIdx = parseInt(e.dataTransfer.getData("index"));
                                                        const toIdx = index;
                                                        if (fromIdx === toIdx) return;
                                                        const newFields = [...doctypeData.fields];
                                                        const [movedItem] = newFields.splice(fromIdx, 1);
                                                        newFields.splice(toIdx, 0, movedItem);
                                                        setDoctypeData({ ...doctypeData, fields: newFields });
                                                    }}
                                                    style={{
                                                        background: isSection ? 'linear-gradient(90deg, #eff6ff 0%, #ffffff 100%)' : '#ffffff',
                                                        borderRadius: '20px',
                                                        boxShadow: isSection ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                                                        transition: 'all 0.2s',
                                                        border: isSection ? '1px solid #bfdbfe' : '1px solid transparent',
                                                        cursor: 'grab'
                                                    }}
                                                >
                                                    <td style={{ padding: '24px', color: '#cbd5e1', fontSize: '18px', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>
                                                        <FaLayerGroup style={{ opacity: 0.5 }} />
                                                    </td>
                                                    <td style={{ padding: '24px', fontWeight: '700', color: isSection ? '#1e40af' : '#1e293b' }}>
                                                        {field.label}
                                                        {field.is_default && <span style={{ marginLeft: '10px', fontSize: '9px', background: isSection ? '#dbeafe' : '#f1f5f9', padding: '3px 10px', borderRadius: '6px', color: isSection ? '#1e40af' : '#64748b', verticalAlign: 'middle' }}>CORE FIELD</span>}
                                                    </td>
                                                    <td style={{ padding: '24px', color: '#64748b', fontFamily: "'Fira Code', monospace", fontSize: '13px' }}>
                                                        {field.id}
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <select
                                                            value={field.type}
                                                            onChange={(e) => updateFieldType(field.id, e.target.value)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: '#f8fafc',
                                                                borderRadius: '10px',
                                                                fontSize: '13px',
                                                                color: '#334155',
                                                                border: '1px solid #e2e8f0',
                                                                fontWeight: '600',
                                                                outline: 'none'
                                                            }}
                                                        >
                                                            {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        {(field.type === 'Date' || field.type === 'Datetime') && (
                                                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={field.type === 'Datetime'} 
                                                                    onChange={(e) => updateFieldType(field.id, e.target.checked ? 'Datetime' : 'Date')}
                                                                    id={`include_time_${field.id}`}
                                                                />
                                                                <label htmlFor={`include_time_${field.id}`} style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', cursor: 'pointer' }}>INCLUDE TIME</label>
                                                            </div>
                                                        )}
                                                        {(field.type === 'Table' || field.type === 'Link') && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <select
                                                                    value={field.link_doctype || ""}
                                                                    onChange={(e) => updateFieldLink(field.id, e.target.value)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #cbd5e1',
                                                                        background: '#fff',
                                                                        fontWeight: '600',
                                                                        width: '100%'
                                                                    }}
                                                                >
                                                                    <option value="">Select DocType</option>
                                                                    {[...new Set([...availableDocTypes])].sort().map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                        {field.type === 'Select' && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Option1, Option2..."
                                                                    value={field.link_doctype || ""}
                                                                    onChange={(e) => updateFieldLink(field.id, e.target.value)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #cbd5e1',
                                                                        background: '#fff',
                                                                        width: '100%'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <button
                                                            onClick={() => toggleMandatory(field.id)}
                                                            disabled={isSection}
                                                            style={{
                                                                border: 'none',
                                                                background: isSection ? '#f1f5f9' : (field.mandatory ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                                                                color: isSection ? '#cbd5e1' : (field.mandatory ? '#10b981' : '#ef4444'),
                                                                padding: '8px 16px',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                fontWeight: '800',
                                                                cursor: isSection ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {isSection ? 'N/A' : (field.mandatory ? 'YES' : 'NO')}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <button
                                                            onClick={() => {
                                                                const updatedFields = doctypeData.fields.map(f => f.id === field.id ? { ...f, allow_create_new: !f.allow_create_new } : f);
                                                                setDoctypeData({ ...doctypeData, fields: updatedFields });
                                                            }}
                                                            disabled={isSection}
                                                            style={{
                                                                border: 'none',
                                                                background: isSection ? '#f1f5f9' : (field.allow_create_new ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9'),
                                                                color: isSection ? '#cbd5e1' : (field.allow_create_new ? '#3b82f6' : '#64748b'),
                                                                padding: '8px 16px',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                fontWeight: '800',
                                                                cursor: isSection ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {isSection ? 'N/A' : (field.allow_create_new ? 'ENABLED' : 'DISABLED')}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <button
                                                            onClick={() => toggleHidden(field.id)}
                                                            style={{
                                                                border: 'none',
                                                                background: isSection ? '#f8fafc' : (field.hidden ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                                                color: isSection ? '#cbd5e1' : (field.hidden ? '#ef4444' : '#10b981'),
                                                                padding: '8px 16px',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                fontWeight: '800',
                                                                cursor: isSection ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            disabled={isSection}
                                                        >
                                                            {isSection ? 'N/A' : (field.hidden ? 'HIDDEN' : 'VISIBLE')}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'right', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                            <button
                                                                onClick={() => startEditing(field)}
                                                                style={{
                                                                    background: isSection ? '#dbeafe' : '#f1f5f9',
                                                                    border: 'none',
                                                                    color: isSection ? '#1e40af' : '#475569',
                                                                    cursor: 'pointer',
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '10px',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteField(field.id)}
                                                                disabled={field.is_default}
                                                                style={{
                                                                    background: field.is_default ? '#f8fafc' : '#fee2e2',
                                                                    border: 'none',
                                                                    color: field.is_default ? '#cbd5e1' : '#ef4444',
                                                                    cursor: field.is_default ? 'not-allowed' : 'pointer',
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '10px',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Field Modal */}
            {showAddField && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#ffffff', width: '100%', maxWidth: '500px',
                        borderRadius: '32px', padding: '48px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h3 style={{ margin: '0 0 32px', fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>Add New Field</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Field Label</label>
                            <input
                                type="text"
                                value={newField.label}
                                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                placeholder="e.g. Loyalty Points"
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600', outline: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Field Type</label>
                            <select
                                value={newField.type}
                                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600', outline: 'none' }}
                            >
                                {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        {newField.type === 'Table' && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Linked DocType</label>
                                <select
                                    value={newField.link_doctype || ""}
                                    onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })}
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600' }}
                                >
                                    <option value="">Select DocType</option>
                                    {availableDocTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={newField.mandatory} onChange={(e) => setNewField({ ...newField, mandatory: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Mandatory
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={newField.allow_create_new} onChange={(e) => setNewField({ ...newField, allow_create_new: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Create New
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={newField.hidden} onChange={(e) => setNewField({ ...newField, hidden: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Hide Field
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setShowAddField(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                            <button onClick={addField} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s' }}>Add Field</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Field Modal */}
            {showEditModal && editingField && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#ffffff', width: '100%', maxWidth: '500px',
                        borderRadius: '32px', padding: '48px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h3 style={{ margin: '0 0 32px', fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>Edit Field</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Field Label</label>
                            <input
                                type="text"
                                value={editingField.label}
                                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Field Type</label>
                            <select
                                value={editingField.type}
                                onChange={(e) => setEditingField({ ...editingField, type: e.target.value, link_doctype: e.target.value === 'Table' ? (editingField.link_doctype || availableDocTypes[0]) : undefined })}
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600' }}
                            >
                                {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        {editingField.type === 'Table' && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#475569', fontWeight: '700', fontSize: '14px' }}>Linked DocType</label>
                                <select
                                    value={editingField.link_doctype || ""}
                                    onChange={(e) => setEditingField({ ...editingField, link_doctype: e.target.value })}
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '600' }}
                                >
                                    <option value="">Select DocType</option>
                                    {availableDocTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={editingField.mandatory} onChange={(e) => setEditingField({ ...editingField, mandatory: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Mandatory
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={editingField.allow_create_new} onChange={(e) => setEditingField({ ...editingField, allow_create_new: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Create New
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#475569' }}>
                                <input type="checkbox" checked={editingField.hidden} onChange={(e) => setEditingField({ ...editingField, hidden: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                Hide Field
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveEdit} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Message */}
            {message.text && (
                <div style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: message.type === 'success' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : (message.type === 'info' ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'),
                    color: '#ffffff',
                    padding: '18px 36px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    zIndex: 2000,
                    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {message.type === 'success' ? <FaCheckCircle style={{ fontSize: '18px' }} /> : (message.type === 'info' ? <FaInfoCircle style={{ fontSize: '18px' }} /> : <FaExclamationCircle style={{ fontSize: '18px' }} />)}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.3px' }}>
                            {message.type === 'success' ? 'SUCCESS' : (message.type === 'info' ? 'INFORMATION' : 'WARNING')}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', opacity: 0.9 }}>{message.text}</p>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translate(-50%, 30px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                
                .doctype-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    border-color: #3b82f6 !important;
                    box-shadow: 0 30px 60px -12px rgba(59, 130, 246, 0.15) !important;
                }
                
                .doctype-card:hover .icon-container {
                    background: #3b82f6 !important;
                }
                
                .doctype-card:hover .icon-container svg {
                    color: #ffffff !important;
                    transform: scale(1.1);
                }

                input::placeholder { color: #cbd5e1; }
                
                select { cursor: pointer; }
                
                button:active { transform: scale(0.98); }
                
                button:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Custom scrollbar */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #f1f5f9; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default DocType;
