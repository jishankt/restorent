import React, { useState, useEffect, useContext } from "react";
import axios from 'axios';
import {
    FaTimes, FaPlus, FaTrash, FaSave, FaEdit, FaCheckCircle,
    FaExclamationCircle, FaUser, FaCogs, FaInfoCircle, FaBars,
    FaChevronRight, FaGripVertical, FaLayerGroup, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { UserContext } from "../../Context/UserContext";

const CustomerCustomizationModal = ({ isOpen, onClose, onRefresh, targetDocType = "Customer" }) => {
    const { baseUrl, getHeaders } = useContext(UserContext);
    const [doctypeData, setDoctypeData] = useState({ name: targetDocType, fields: [] });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [activeSection, setActiveSection] = useState("All");
    const [addFieldContextSection, setAddFieldContextSection] = useState("All");
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [nestedDraggedInfo, setNestedDraggedInfo] = useState(null);
    const [nestedFieldsData, setNestedFieldsData] = useState({});

    const [showAddField, setShowAddField] = useState(false);
    const [newField, setNewField] = useState({
        label: "",
        type: "Data",
        mandatory: false,
        allow_create_new: false,
        hidden: false,
        link_doctype: ""
    });
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [editingFieldParent, setEditingFieldParent] = useState(null);
    const [allDoctypes, setAllDoctypes] = useState([]);

    const [saveToDocType, setSaveToDocType] = useState(targetDocType);

    const getAvailableTargetDoctypes = () => {
        const targets = [{ name: targetDocType, label: `${targetDocType} (Main)` }];
        if (activeSection === "All" || !doctypeData || !doctypeData.fields) return targets;

        const activeTable = doctypeData.fields.find(f => (f.type === 'Table' || f.type === 'Link') && f.label === activeSection);
        if (activeTable && activeTable.link_doctype) {
            targets.push({ name: activeTable.link_doctype, label: `${activeTable.link_doctype} (Table)` });
        } else {
            let inSection = false;
            for (const f of doctypeData.fields) {
                if (f.type === 'Section Break') {
                    inSection = (f.label === activeSection);
                } else if (inSection) {
                    if ((f.type === 'Table' || f.type === 'Link') && f.link_doctype) {
                        targets.push({ name: f.link_doctype, label: `${f.link_doctype} (Table)` });
                    }
                }
            }
        }
        const uniqueTargets = [];
        const seen = new Set();
        for (const t of targets) {
            if (!seen.has(t.name)) {
                seen.add(t.name);
                uniqueTargets.push(t);
            }
        }
        return uniqueTargets;
    };

    useEffect(() => {
        const targets = getAvailableTargetDoctypes();
        if (targets.length > 1) {
            setSaveToDocType(targets[1].name); // Default to first nested table doctype
        } else {
            setSaveToDocType(targetDocType);
        }
    }, [activeSection, doctypeData]);

    // Nested Modal States
    const [nestedModal, setNestedModal] = useState({
        isOpen: false,
        doctypeName: "",
        data: { name: "", fields: [] },
        loading: false,
        saving: false
    });
    const [showAddNestedField, setShowAddNestedField] = useState(false);
    const [newNestedField, setNewNestedField] = useState({
        label: "",
        type: "Data",
        mandatory: false,
        allow_create_new: false,
        hidden: false,
        link_doctype: ""
    });
    const [editingNestedFieldId, setEditingNestedFieldId] = useState(null);
    const [nestedDraggedIndex, setNestedDraggedIndex] = useState(null);

    const fieldTypes = ["Data", "Select", "Date", "Time", "Datetime", "Check", "Number", "Text", "Table", "Attach Image", "Section Break"];

    useEffect(() => {
        if (isOpen) {
            setDoctypeData({ name: targetDocType, fields: [] });
            fetchDoctypeData();
            fetchAllDoctypes();
        }
    }, [isOpen, targetDocType]);

    const fetchDoctypeData = async () => {
        setLoading(true);
        try {
            const url = `${baseUrl || ""}/api/doctypes/${encodeURIComponent(targetDocType)}`;
            const response = await axios.get(url, { headers: getHeaders() });
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

            const hydrateDocData = (doc, dtName) => {
                if (dtName === "Employee") {
                    const hasSections = doc.fields.some(f => f.type === 'Section Break');
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
                            
                            doc.fields.forEach(f => {
                                if (f.type !== 'Section Break') {
                                    const fTab = mapping[f.id] || 'details';
                                    if (fTab === sec.key) {
                                        newFields.push(f);
                                    }
                                }
                            });
                        });
                        doc.fields = newFields;
                    }
                } else {
                    const defaultFields = getDefaultFields(dtName);
                    
                    if (dtName === 'Purchase Item') {
                        doc.fields = doc.fields.filter(f => {
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
                            const exists = doc.fields.some(f => 
                                f.id === df.id || 
                                (f.label && df.label && f.label.toLowerCase() === df.label.toLowerCase())
                            );
                            if (!exists) {
                                doc.fields.splice(index, 0, {
                                    ...df,
                                    is_default: true,
                                    hidden: false,
                                    idx: index
                                });
                            }
                        });
                        doc.fields = doc.fields.map((f, i) => ({ ...f, idx: i }));
                    }
                }
            };

            hydrateDocData(docData, targetDocType);
            setDoctypeData(docData);

            // Fetch nested fields for inline preview
            const tableFields = (response.data.fields || []).filter(f => f.type === 'Table' || f.type === 'Link');
            const newNestedData = {};
            for (const f of tableFields) {
                if (f.link_doctype) {
                    try {
                        const nUrl = `${baseUrl || ""}/api/doctypes/${f.link_doctype}`;
                        const nRes = await axios.get(nUrl, { headers: getHeaders() });
                        newNestedData[f.link_doctype] = nRes.data;
                    } catch (e) {
                        console.error("Error fetching nested doctype:", f.link_doctype);
                    }
                }
            }
            setNestedFieldsData(newNestedData);
        } catch (error) {
            console.error("Error fetching doctype:", error);
            showToast(`Failed to fetch ${targetDocType} configuration`, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchNestedSingle = async (doctypeName) => {
        if (!doctypeName || nestedFieldsData[doctypeName]) return;
        try {
            const url = `${baseUrl || ""}/api/doctypes/${doctypeName}`;
            const response = await axios.get(url, { headers: getHeaders() });
            
            // Re-use the getDefaultFields logic by recreating it here for the nested scope
            let docData = response.data;
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
                    case 'Purchase Report':
                        return [
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
            
            if (doctypeName !== "Employee") {
                const defaultFields = getDefaultFields(doctypeName);
                
                if (doctypeName === 'Purchase Item') {
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
            
            setNestedFieldsData(prev => ({ ...prev, [doctypeName]: docData }));
        } catch (error) {
            console.error("Error fetching nested doctype:", doctypeName);
        }
    };

    const fetchAllDoctypes = async () => {
        try {
            const url = `${baseUrl || ""}/api/doctypes`;
            const response = await axios.get(url, { headers: getHeaders() });
            // Assuming the list of doctypes is in response.data or response.data.doctypes
            if (Array.isArray(response.data)) {
                setAllDoctypes(response.data);
            } else if (response.data.doctypes) {
                setAllDoctypes(response.data.doctypes);
            }
        } catch (error) {
            console.error("Error fetching all doctypes:", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = `${baseUrl || ""}/api/doctypes`;
            const cleanData = { ...doctypeData };
            delete cleanData.company;
            delete cleanData.company_name;

            const payload = {
                ...cleanData,
                name: targetDocType,
                // Stamp each field with its current position so backend preserves order
                fields: (cleanData.fields || []).map((f, idx) => ({ ...f, idx }))
            };

            await axios.post(url, payload, { headers: getHeaders() });

            // Also save all nested doctypes that have been loaded (may have been reordered via drag-drop)
            const nestedSavePromises = Object.entries(nestedFieldsData).map(async ([doctypeName, nestedDoc]) => {
                try {
                    const nestedClean = { ...nestedDoc };
                    delete nestedClean.company;
                    delete nestedClean.company_name;
                    const nestedPayload = {
                        ...nestedClean,
                        name: doctypeName,
                        fields: (nestedClean.fields || []).map((f, idx) => ({ ...f, idx }))
                    };
                    await axios.post(url, nestedPayload, { headers: getHeaders() });
                } catch (err) {
                    console.error(`Error saving nested doctype ${doctypeName}:`, err);
                }
            });

            await Promise.all(nestedSavePromises);

            showToast("Configuration updated successfully", "success");
            window.dispatchEvent(new CustomEvent('doctypes-updated'));
            if (onRefresh) onRefresh();
            setTimeout(onClose, 1500);
        } catch (error) {
            console.error("Error saving doctype:", error);
            showToast("Failed to save configuration", "error");
        } finally {
            setSaving(false);
        }
    };

    const addField = async (customType = null, customLabel = null) => {
        const fieldType = customType || newField.type;
        const fieldLabel = customLabel || (customType === 'Section Break' ? "New Section" : newField.label);

        if (fieldType !== 'Section Break' && !fieldLabel.trim()) {
            showToast("Field label is required", "error");
            return;
        }

        const targetParent = (fieldType === 'Section Break')
            ? null
            : (editingFieldId ? editingFieldParent : (saveToDocType !== targetDocType ? saveToDocType : null));

        if (targetParent) {
            const nestedDoc = nestedFieldsData[targetParent];
            if (!nestedDoc) {
                showToast("Nested doctype not loaded", "error");
                return;
            }

            const fieldId = editingFieldId || fieldLabel.toLowerCase().replace(/\s+/g, '_');
            const newFieldObj = {
                ...newField,
                label: fieldLabel,
                type: fieldType,
                id: fieldId,
                is_default: false
            };

            let updatedFields = [...nestedDoc.fields];
            if (editingFieldId) {
                updatedFields = updatedFields.map(f => f.id === editingFieldId ? { ...newFieldObj, id: editingFieldId } : f);
                setEditingFieldId(null);
                setEditingFieldParent(null);
            } else {
                updatedFields.push(newFieldObj);
            }

            const updatedNestedDoc = { ...nestedDoc, fields: updatedFields };
            setNestedFieldsData(prev => ({ ...prev, [targetParent]: updatedNestedDoc }));

            try {
                const url = `${baseUrl || ""}/api/doctypes`;
                const payload = { ...updatedNestedDoc };
                delete payload.company;
                delete payload.company_name;
                await axios.post(url, payload, { headers: getHeaders() });
                showToast(`Saved to ${targetParent}`, "success");
                window.dispatchEvent(new CustomEvent('doctypes-updated'));
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Error saving nested:", error);
                showToast(`Failed to save to ${targetParent}`, "error");
            }
        } else {
            if (editingFieldId) {
                const updatedFields = doctypeData.fields.map(f => {
                    if (f.id === editingFieldId) return { ...f, ...newField, label: fieldLabel, type: fieldType, id: editingFieldId };
                    return f;
                });
                setDoctypeData({ ...doctypeData, fields: updatedFields });
                setEditingFieldId(null);
                setEditingFieldParent(null);
            } else {
                const fieldId = fieldLabel.toLowerCase().replace(/\s+/g, '_') + (fieldType === 'Section Break' ? `_${Date.now()}` : "");
                const newFieldObj = {
                    ...newField,
                    label: fieldLabel,
                    type: fieldType,
                    id: fieldId,
                    is_default: false
                };

                let updatedFields = [...doctypeData.fields];
                const sectionToUse = (addFieldContextSection && addFieldContextSection !== "All") ? addFieldContextSection : activeSection;
                if (sectionToUse !== "All" && fieldType !== 'Section Break') {
                    const sectionIndex = updatedFields.findIndex(f => f.type === 'Section Break' && f.label === sectionToUse);
                    if (sectionIndex !== -1) {
                        let insertIndex = sectionIndex + 1;
                        while (insertIndex < updatedFields.length &&
                            updatedFields[insertIndex].type !== 'Section Break' &&
                            updatedFields[insertIndex].type !== 'Table' &&
                            updatedFields[insertIndex].type !== 'Link') {
                            insertIndex++;
                        }
                        updatedFields.splice(insertIndex, 0, newFieldObj);
                    } else {
                        updatedFields.push(newFieldObj);
                    }
                } else {
                    updatedFields.push(newFieldObj);
                }

                setDoctypeData({ ...doctypeData, fields: updatedFields });
            }
        }

        if (fieldType === 'Table' || fieldType === 'Link') {
            fetchNestedSingle(newField.link_doctype);
        }

        setNewField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" });
        setShowAddField(false);
    };

    const editField = (field) => {
        setNewField({
            label: field.label,
            type: field.type,
            mandatory: !!field.mandatory,
            allow_create_new: !!field.allow_create_new,
            hidden: !!field.hidden,
            link_doctype: field.link_doctype || ""
        });
        setEditingFieldId(field.id);
        setEditingFieldParent(field.isNested ? field.parentTable : null);
        setShowAddField(false);
    };

    const deleteField = async (id, parentTable = null) => {
        if (window.confirm("Are you sure you want to delete this field?")) {
            if (parentTable) {
                const nestedDoc = nestedFieldsData[parentTable];
                if (!nestedDoc) return;

                const updatedFields = nestedDoc.fields.filter(f => f.id !== id);
                const updatedNestedDoc = { ...nestedDoc, fields: updatedFields };
                setNestedFieldsData(prev => ({ ...prev, [parentTable]: updatedNestedDoc }));

                try {
                    const url = `${baseUrl || ""}/api/doctypes`;
                    const payload = { ...updatedNestedDoc };
                    delete payload.company;
                    delete payload.company_name;
                    await axios.post(url, payload, { headers: getHeaders() });
                    showToast(`Deleted from ${parentTable}`, "success");
                    if (onRefresh) onRefresh();
                } catch (error) {
                    console.error("Error deleting nested:", error);
                    showToast(`Failed to delete from ${parentTable}`, "error");
                }
            } else {
                const updatedFields = doctypeData.fields.filter(f => f.id !== id);
                setDoctypeData({ ...doctypeData, fields: updatedFields });
            }
        }
    };

    const toggleProperty = (id, prop) => {
        const updatedFields = doctypeData.fields.map(f => {
            if (f.id === id) return { ...f, [prop]: !f[prop] };
            return f;
        });
        setDoctypeData({ ...doctypeData, fields: updatedFields });
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
        if (draggedIndex === null || draggedIndex === index) return;

        const newFields = [...doctypeData.fields];
        const draggedItem = newFields[draggedIndex];
        newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        setDoctypeData({ ...doctypeData, fields: newFields });
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleInlineNestedDragStart = (e, parentTable, index) => {
        setNestedDraggedInfo({ parentTable, index });
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation();
    };

    const handleInlineNestedDragOver = (e, parentTable, index) => {
        e.preventDefault();
        e.stopPropagation();
        if (!nestedDraggedInfo || nestedDraggedInfo.parentTable !== parentTable || nestedDraggedInfo.index === index) return;

        const newNestedData = { ...nestedFieldsData };
        const doctypeToUpdate = newNestedData[parentTable];
        if (!doctypeToUpdate || !doctypeToUpdate.fields) return;

        const newFields = [...doctypeToUpdate.fields];
        const draggedItem = newFields[nestedDraggedInfo.index];
        newFields.splice(nestedDraggedInfo.index, 1);
        newFields.splice(index, 0, draggedItem);
        doctypeToUpdate.fields = newFields;

        setNestedDraggedInfo({ parentTable, index });
        setNestedFieldsData(newNestedData);
    };

    const handleInlineNestedDragEnd = (e) => {
        e.stopPropagation();
        setNestedDraggedInfo(null);
    };

    const showToast = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    // Nested Modal Functions
    const openNestedModal = async (doctypeName) => {
        if (!doctypeName) return;

        // Reset nested editing states to prevent carry-over from previous modals
        setEditingNestedFieldId(null);
        setShowAddNestedField(false);
        setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" });

        setNestedModal(prev => ({ ...prev, isOpen: true, doctypeName, loading: true }));
        try {
            const url = `${baseUrl || ""}/api/doctypes/${doctypeName}`;
            const response = await axios.get(url, { headers: getHeaders() });
            setNestedModal(prev => ({ ...prev, data: response.data, loading: false }));
        } catch (error) {
            console.error("Error fetching nested doctype:", error);
            showToast(`Failed to fetch ${doctypeName} configuration`, "error");
            setNestedModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
    };

    const handleSaveNested = async () => {
        setNestedModal(prev => ({ ...prev, saving: true }));
        try {
            const url = `${baseUrl || ""}/api/doctypes`;
            const payload = { ...nestedModal.data };
            delete payload.company;
            delete payload.company_name;

            await axios.post(url, payload, { headers: getHeaders() });
            showToast(`${nestedModal.doctypeName} updated successfully`, "success");
            window.dispatchEvent(new CustomEvent('doctypes-updated'));
            if (onRefresh) onRefresh();
            setTimeout(() => setNestedModal(prev => ({ ...prev, isOpen: false, saving: false })), 1000);
        } catch (error) {
            console.error("Error saving nested doctype:", error);
            showToast("Failed to save nested configuration", "error");
            setNestedModal(prev => ({ ...prev, saving: false }));
        }
    };

    const addNestedField = (parentTableOverride) => {
        const targetParent = parentTableOverride || nestedModal.data?.name;
        if (!targetParent) return;

        if (!newNestedField.label.trim()) {
            showToast("Field label is required", "error");
            return;
        }

        const docData = nestedModal.isOpen ? nestedModal.data : nestedFieldsData[targetParent];
        if (!docData) return;

        let updatedFields = [];
        if (editingNestedFieldId) {
            updatedFields = docData.fields.map(f => {
                if (f.id === editingNestedFieldId) return { ...f, ...newNestedField, id: editingNestedFieldId };
                return f;
            });
            setEditingNestedFieldId(null);
        } else {
            const fieldId = newNestedField.label.toLowerCase().replace(/\s+/g, '_');
            updatedFields = [
                ...docData.fields,
                { ...newNestedField, id: fieldId, is_default: false }
            ];
        }

        if (nestedModal.isOpen) {
            setNestedModal(prev => ({
                ...prev,
                data: { ...prev.data, fields: updatedFields }
            }));
        } else {
            const updatedNestedDoc = { ...docData, fields: updatedFields };
            setNestedFieldsData(prev => ({ ...prev, [targetParent]: updatedNestedDoc }));
            // Also save immediately to backend when adding from inline edit
            const url = `${baseUrl || ""}/api/doctypes`;
            const payload = { ...updatedNestedDoc };
            delete payload.company;
            delete payload.company_name;
            axios.post(url, payload, { headers: getHeaders() })
                .then(() => {
                    showToast(`Saved to ${targetParent}`, "success");
                    window.dispatchEvent(new CustomEvent('doctypes-updated'));
                    if (onRefresh) onRefresh();
                })
                .catch((err) => {
                    console.error("Error saving nested:", err);
                    showToast(`Failed to save to ${targetParent}`, "error");
                });
        }

        setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" });
        setShowAddNestedField(false);
    };

    const editNestedField = (field) => {
        setNewNestedField({
            label: field.label,
            type: field.type,
            mandatory: !!field.mandatory,
            allow_create_new: !!field.allow_create_new,
            hidden: !!field.hidden,
            link_doctype: field.link_doctype || ""
        });
        setEditingNestedFieldId(field.id);
        setShowAddNestedField(true);
    };

    const deleteNestedField = (id) => {
        if (window.confirm("Are you sure you want to delete this field?")) {
            const updatedFields = nestedModal.data.fields.filter(f => f.id !== id);
            setNestedModal(prev => ({
                ...prev,
                data: { ...prev.data, fields: updatedFields }
            }));
        }
    };

    const toggleNestedVisibility = (id, parentTable) => {
        const nestedDoc = nestedFieldsData[parentTable];
        if (!nestedDoc) return;
        const updatedFields = nestedDoc.fields.map(f => {
            if (f.id === id) return { ...f, hidden: !f.hidden };
            return f;
        });
        setNestedFieldsData(prev => ({
            ...prev,
            [parentTable]: { ...nestedDoc, fields: updatedFields }
        }));
    };

    const handleNestedDragStart = (e, index) => {
        setNestedDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleNestedDragOver = (e, index) => {
        e.preventDefault();
        if (nestedDraggedIndex === null || nestedDraggedIndex === index) return;

        const newFields = [...nestedModal.data.fields];
        const draggedItem = newFields[nestedDraggedIndex];
        newFields.splice(nestedDraggedIndex, 1);
        newFields.splice(index, 0, draggedItem);

        setNestedDraggedIndex(index);
        setNestedModal(prev => ({
            ...prev,
            data: { ...prev.data, fields: newFields }
        }));
    };

    const handleNestedDragEnd = () => {
        setNestedDraggedIndex(null);
    };

    const sections = doctypeData.fields.filter(f => f.type === 'Section Break');

    if (!isOpen) return null;

    return (
        <>
            <style>
                {`
                @keyframes tooltipFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .action-tooltip-container:hover .action-tooltip {
                    display: block;
                    animation: tooltipFadeIn 0.2s ease-out forwards;
                }
                .action-tooltip {
                    display: none;
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 5px 10px;
                    border-radius: 6px;
                    white-space: nowrap;
                    z-index: 10;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .action-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 5px solid transparent;
                    border-top-color: #1e293b;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeOverlay {
                    from { background-color: rgba(15, 23, 42, 0); backdrop-filter: blur(0px); }
                    to { background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); }
                }
            `}
            </style>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'flex-end',
                zIndex: 9999,
                padding: '0',
                fontFamily: "'Outfit', sans-serif",
                animation: 'fadeOverlay 0.3s ease-out'
            }}>
                <div style={{
                    background: '#ffffff',
                    width: '100%',
                    maxWidth: '1100px',
                    height: '100vh',
                    borderRadius: '24px 0 0 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-20px 0 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '24px 40px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                borderRadius: '14px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#fff'
                            }}>
                                <FaCogs style={{ fontSize: '20px' }} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{targetDocType} Layout Manager</h2>
                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Manage fields in a modern grid view</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <FaSave /> {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginLeft: '8px'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        {/* Sidebar */}
                        <div style={{
                            width: '280px',
                            background: '#f8fafc',
                            borderRight: '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>Sections</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                                <button
                                    onClick={() => setActiveSection("All")}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeSection === "All" ? '#3b82f6' : 'transparent',
                                        color: activeSection === "All" ? '#ffffff' : '#475569',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    All Fields
                                    {activeSection === "All" && <FaChevronRight style={{ fontSize: '10px' }} />}
                                </button>
                                {sections.map((section, sidx) => (
                                    <div
                                        key={section.id}
                                        draggable={section.label !== "All"}
                                        onDragStart={(e) => {
                                            if (section.label === "All") return;
                                            e.dataTransfer.setData("type", "section");
                                            e.dataTransfer.setData("sectionLabel", section.label);
                                            e.currentTarget.style.opacity = '0.4';
                                        }}
                                        onDragEnd={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        onClick={() => setActiveSection(section.label)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            const dragType = e.dataTransfer.types.includes("type") ? "section" : "field";
                                            if (dragType === "section") {
                                                e.currentTarget.style.borderTop = '2px solid #3b82f6';
                                            } else {
                                                e.currentTarget.style.background = '#eff6ff';
                                                e.currentTarget.style.transform = 'translateX(5px)';
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.style.borderTop = '1px solid transparent';
                                            e.currentTarget.style.background = activeSection === section.label ? '#3b82f6' : 'transparent';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderTop = '1px solid transparent';
                                            e.currentTarget.style.background = activeSection === section.label ? '#3b82f6' : 'transparent';
                                            e.currentTarget.style.transform = 'translateX(0)';

                                            const dragType = e.dataTransfer.getData("type");

                                            if (dragType === "section") {
                                                const sourceLabel = e.dataTransfer.getData("sectionLabel");
                                                const targetLabel = section.label;
                                                if (sourceLabel === targetLabel || targetLabel === "All") return;

                                                let fields = [...doctypeData.fields];

                                                // Extract source section block
                                                const sourceStart = fields.findIndex(f => f.type === 'Section Break' && f.label === sourceLabel);
                                                if (sourceStart === -1) return;
                                                let sourceEnd = sourceStart + 1;
                                                while (sourceEnd < fields.length && fields[sourceEnd].type !== 'Section Break') {
                                                    sourceEnd++;
                                                }
                                                const sourceBlock = fields.splice(sourceStart, sourceEnd - sourceStart);

                                                // Find target insertion point
                                                let targetStart = fields.findIndex(f => f.type === 'Section Break' && f.label === targetLabel);
                                                if (targetStart === -1) targetStart = fields.length;
                                                fields.splice(targetStart, 0, ...sourceBlock);

                                                setDoctypeData({ ...doctypeData, fields });
                                                showToast(`Reordered section: ${sourceLabel}`, "success");
                                            } else if (draggedIndex !== null && section.label !== "All") {
                                                // Existing Field-to-Section Drop Logic
                                                const fieldToMove = doctypeData.fields[draggedIndex];
                                                if (fieldToMove.type === 'Section Break') return;

                                                let updatedFields = [...doctypeData.fields];
                                                updatedFields.splice(draggedIndex, 1);

                                                const sectionIndex = updatedFields.findIndex(f => f.type === 'Section Break' && f.label === section.label);
                                                if (sectionIndex !== -1) {
                                                    let insertPos = sectionIndex + 1;
                                                    while (insertPos < updatedFields.length &&
                                                        updatedFields[insertPos].type !== 'Section Break') {
                                                        insertPos++;
                                                    }
                                                    updatedFields.splice(insertPos, 0, fieldToMove);
                                                    setDoctypeData({ ...doctypeData, fields: updatedFields });
                                                    showToast(`Moved ${fieldToMove.label} to ${section.label}`, "success");
                                                }
                                            }
                                        }}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            cursor: section.label === "All" ? 'pointer' : 'grab',
                                            background: activeSection === section.label ? '#3b82f6' : 'transparent',
                                            color: activeSection === section.label ? '#fff' : '#475569',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            border: activeSection === section.label ? 'none' : '1px solid transparent',
                                            borderTop: '1px solid transparent'
                                        }}
                                    >
                                        {section.label !== "All" && <FaBars style={{ fontSize: '10px', opacity: 0.5, flexShrink: 0 }} />}
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: activeSection === section.label ? '#fff' : '#cbd5e1',
                                            display: section.label === "All" ? 'block' : 'none',
                                            flexShrink: 0
                                        }}></div>
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            {section.label !== "All" && (
                                                <FaTrash
                                                    style={{
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        color: activeSection === section.label ? '#bfdbfe' : '#cbd5e1'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Are you sure you want to delete the section "${section.label}"?`)) {
                                                            const updatedFields = doctypeData.fields.filter(f => f.id !== section.id);
                                                            setDoctypeData({ ...doctypeData, fields: updatedFields });
                                                            if (activeSection === section.label) setActiveSection("All");
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = activeSection === section.label ? '#fff' : '#ef4444'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = activeSection === section.label ? '#bfdbfe' : '#cbd5e1'}
                                                    title="Delete Section"
                                                />
                                            )}
                                            {activeSection === section.label && <FaChevronRight style={{ fontSize: '10px' }} />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Add Section Button */}
                            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="New Section Name"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                addField('Section Break', e.target.value.trim());
                                                e.target.value = '';
                                            }
                                        }}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid #e2e8f0',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousSibling;
                                            if (input.value.trim()) {
                                                addField('Section Break', input.value.trim());
                                                input.value = '';
                                            } else {
                                                addField('Section Break');
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#eff6ff',
                                            color: '#3b82f6',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '800',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FaPlus /> Add Section
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#ffffff' }}>
                            {message.text && (
                                <div style={{
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: message.type === 'success' ? '#ecfdf5' : '#fff1f2',
                                    color: message.type === 'success' ? '#059669' : '#e11d48',
                                    border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
                                    fontWeight: '600',
                                    animation: 'modalFadeUp 0.3s ease-out'
                                }}>
                                    {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                    {message.text}
                                </div>
                            )}

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '20px' }}>
                                    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <div style={{ color: '#94a3b8', fontWeight: '700' }}>Loading Configuration...</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>


                                    {/* Grid of Field Tiles */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                        {(() => {
                                            const renderedItems = [];
                                            let currentSectionFields = [];
                                            let currentSectionLabel = "General Information";

                                            const renderGrid = (fields, sectionLabel) => {
                                                if (fields.length === 0 && sectionLabel === "General Information") return null;
                                                return (
                                                    <div
                                                        key={sectionLabel}
                                                        style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100px', paddingBottom: '20px' }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            if (draggedIndex === null) return;
                                                            e.stopPropagation();

                                                            const newFields = [...doctypeData.fields];
                                                            const draggedItem = newFields[draggedIndex];

                                                            const sectionBreakIndex = sectionLabel === "General Information" ? -1 : newFields.findIndex(f => f.type === 'Section Break' && f.label === sectionLabel);

                                                            let insertPos = sectionBreakIndex + 1;
                                                            while (insertPos < newFields.length && newFields[insertPos].type !== 'Section Break') {
                                                                insertPos++;
                                                            }

                                                            if (draggedIndex === insertPos - 1) return;

                                                            newFields.splice(draggedIndex, 1);
                                                            const newSectionBreakIndex = sectionLabel === "General Information" ? -1 : newFields.findIndex(f => f.type === 'Section Break' && f.label === sectionLabel);
                                                            let newInsertPos = newSectionBreakIndex + 1;
                                                            while (newInsertPos < newFields.length && newFields[newInsertPos].type !== 'Section Break') {
                                                                newInsertPos++;
                                                            }

                                                            newFields.splice(newInsertPos, 0, draggedItem);
                                                            setDraggedIndex(null);
                                                            setDoctypeData({ ...doctypeData, fields: newFields });
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '2px solid #f1f5f9' }}>
                                                            <FaBars style={{ color: '#3b82f6', fontSize: '14px' }} />
                                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sectionLabel}</h3>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: '20px' }}>{fields.filter(f => f.type !== 'Section Break').length} Fields</span>
                                                            {(() => {
                                                                const sf = fields.find(f => f.type === 'Section Break');
                                                                if (sf && !sf.is_default) {
                                                                    return (
                                                                        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>

                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                                            gap: '16px'
                                                        }}>
                                                            {fields.map((field) => {
                                                                const globalIndex = doctypeData.fields.findIndex(f => f.id === field.id);

                                                                if (field.type === 'Section Break' && editingFieldId !== field.id) return null;

                                                                if (editingFieldId === field.id) {
                                                                    return (
                                                                        <div key={`edit-${field.id}`} style={{ gridColumn: '1 / -1', background: '#f0f9ff', padding: '24px', borderRadius: '24px', border: '2px solid #3b82f6', display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 60px 60px 100px 140px', gap: '16px', alignItems: 'end' }}>
                                                                            <div style={{ gridColumn: 'span 7', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <span style={{ fontWeight: '900', color: '#1e3a8a', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Editing Field: {field.label}</span>
                                                                                <button onClick={() => { setEditingFieldId(null); setEditingFieldParent(null); setNewField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" }); }} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#ef4444', fontWeight: '800', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}>Discard Changes</button>
                                                                            </div>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>LABEL</label>
                                                                                <input type="text" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #3b82f6', fontSize: '14px', fontWeight: '700' }} />
                                                                            </div>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>TYPE</label>
                                                                                <select value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #3b82f6', fontSize: '14px', fontWeight: '700', backgroundColor: '#fff' }}>
                                                                                    {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                                </select>
                                                                            </div>
                                                                            <div style={{ position: 'relative' }}>
                                                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>
                                                                                    {(newField.type === 'Table' || newField.type === 'Link') ? 'SEARCH DOCTYPE' : 'DATA / OPTIONS'}
                                                                                </label>
                                                                                {(newField.type === 'Table' || newField.type === 'Link') ? (
                                                                                    <div style={{ position: 'relative' }}>
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder="Search & Select..."
                                                                                            value={newField.link_doctype}
                                                                                            onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })}
                                                                                            onFocus={(e) => {
                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                if (dtList) dtList.style.display = 'block';
                                                                                            }}
                                                                                            onBlur={(e) => {
                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                setTimeout(() => { if (dtList) dtList.style.display = 'none' }, 200);
                                                                                            }}
                                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #3b82f6', fontSize: '14px', fontWeight: '700', backgroundColor: '#fff' }}
                                                                                        />
                                                                                        <div style={{
                                                                                            position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', zIndex: 1000, display: 'none', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                                                        }}>
                                                                                            {allDoctypes
                                                                                                .filter(dt => (dt.name || dt).toLowerCase().includes(newField.link_doctype.toLowerCase()))
                                                                                                .sort((a, b) => (a.name || a).localeCompare(b.name || b))
                                                                                                .map(dt => (
                                                                                                    <div
                                                                                                        key={dt.name || dt}
                                                                                                        onClick={(e) => {
                                                                                                            setNewField({ ...newField, link_doctype: (dt.name || dt) });
                                                                                                            const dtList = e.target.parentElement;
                                                                                                            if (dtList) dtList.style.display = 'none';
                                                                                                        }}
                                                                                                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #f8fafc' }}
                                                                                                        onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#3b82f6'; }}
                                                                                                        onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#475569'; }}
                                                                                                    >
                                                                                                        {dt.name || dt}
                                                                                                    </div>
                                                                                                ))
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <input type="text" value={newField.link_doctype} onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #3b82f6', fontSize: '14px', fontWeight: '700' }} placeholder="Comma separated options" />
                                                                                )}
                                                                            </div>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>REQ</label>
                                                                                <input type="checkbox" checked={newField.mandatory} onChange={(e) => setNewField({ ...newField, mandatory: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                                                            </div>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>HIDE</label>
                                                                                <input type="checkbox" checked={newField.hidden} onChange={(e) => setNewField({ ...newField, hidden: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                                                            </div>
                                                                            <div style={{ textAlign: 'center' }}>
                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>CREATE NEW</label>
                                                                                <input type="checkbox" checked={newField.allow_create_new} onChange={(e) => setNewField({ ...newField, allow_create_new: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                                                            </div>
                                                                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                                                <button onClick={() => addField()} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                                                    <FaSave /> Update
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div
                                                                        key={field.isNested ? `nested-${field.parentTable}-${field.id}` : field.id}
                                                                        draggable={!field.isNested}
                                                                        onDragStart={(e) => !field.isNested && handleDragStart(e, globalIndex)}
                                                                        onDragOver={(e) => !field.isNested && handleDragOver(e, globalIndex)}
                                                                        onDragEnd={!field.isNested ? handleDragEnd : undefined}
                                                                        onDrop={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }}
                                                                        style={{
                                                                            background: field.isNested ? '#f8fafc' : '#ffffff',
                                                                            borderRadius: '20px',
                                                                            padding: '20px',
                                                                            border: `1.5px solid ${draggedIndex === globalIndex && !field.isNested ? '#3b82f6' : '#f1f5f9'}`,
                                                                            boxShadow: field.isNested ? 'inset 0 2px 4px rgba(0,0,0,0.02)' : draggedIndex === globalIndex ? '0 8px 25px -5px rgba(59,130,246,0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '16px',
                                                                            transition: 'all 0.15s ease',
                                                                            cursor: field.isNested ? 'default' : (draggedIndex !== null ? 'grabbing' : 'grab'),
                                                                            opacity: (draggedIndex === globalIndex && !field.isNested) ? 0.5 : (field.hidden ? 0.6 : 1),
                                                                            position: 'relative',
                                                                            minHeight: '120px',
                                                                            gridColumn: (field.type === 'Table' || field.type === 'Link') ? '1 / -1' : 'auto',
                                                                            transform: draggedIndex === globalIndex && !field.isNested ? 'scale(0.97)' : 'scale(1)'
                                                                        }}
                                                                    >
                                                                        {field.isNested && (
                                                                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                                                                IN {field.parentTable}
                                                                            </div>
                                                                        )}
                                                                        {field.hidden && (
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                top: '-10px',
                                                                                left: '20px',
                                                                                background: '#64748b',
                                                                                color: '#fff',
                                                                                fontSize: '9px',
                                                                                fontWeight: '900',
                                                                                padding: '4px 10px',
                                                                                borderRadius: '20px',
                                                                                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px'
                                                                            }}>
                                                                                Hidden
                                                                            </div>
                                                                        )}

                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                {field.label}
                                                                                {field.mandatory && <span style={{ color: '#ef4444', fontSize: '10px' }}>●</span>}
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' }}>
                                                                                {field.type} • {field.id}
                                                                            </div>
                                                                        </div>

                                                                        {(field.type === 'Table' || field.type === 'Link') && nestedFieldsData[field.link_doctype] && (
                                                                            <div style={{
                                                                                marginTop: '12px',
                                                                                background: '#f8fafc',
                                                                                borderRadius: '16px',
                                                                                padding: '16px',
                                                                                display: 'grid',
                                                                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                                                                gap: '12px',
                                                                                border: '1px dashed #cbd5e1'
                                                                            }}>
                                                                                <div style={{ gridColumn: '1 / -1', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Nested Fields ({field.link_doctype})</div>
                                                                                {(nestedFieldsData[field.link_doctype].fields || []).map((nf, nfIndex) => (
                                                                                    editingFieldId === nf.id ? (
                                                                                        <div key={`edit-nested-${nf.id}`} style={{ gridColumn: '1 / -1', background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '2px solid #3b82f6', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'end' }}>
                                                                                            <div style={{ flex: '1 1 200px' }}>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>FIELD LABEL</label>
                                                                                                <input type="text" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '14px', outline: 'none' }} placeholder="e.g. First Name" />
                                                                                            </div>
                                                                                            <div style={{ flex: '1 1 150px' }}>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>FIELD TYPE</label>
                                                                                                <select value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '14px', outline: 'none', background: '#fff' }}>
                                                                                                    {fieldTypes.filter(t => t !== 'Section Break' && t !== 'Table' && t !== 'Link').map(type => <option key={type} value={type}>{type}</option>)}
                                                                                                </select>
                                                                                            </div>
                                                                                            <div style={{ flex: '1 1 150px', position: 'relative' }}>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginBottom: '6px' }}>
                                                                                                    {(newField.type === 'Table' || newField.type === 'Link') ? 'SEARCH DOCTYPE' : 'DATA / OPTIONS'}
                                                                                                </label>
                                                                                                {(newField.type === 'Table' || newField.type === 'Link') ? (
                                                                                                    <div style={{ position: 'relative' }}>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Search..."
                                                                                                            value={newField.link_doctype}
                                                                                                            onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })}
                                                                                                            onFocus={(e) => {
                                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                                if (dtList) dtList.style.display = 'block';
                                                                                                            }}
                                                                                                            onBlur={(e) => {
                                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                                setTimeout(() => { if (dtList) dtList.style.display = 'none' }, 200);
                                                                                                            }}
                                                                                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
                                                                                                        />
                                                                                                        <div style={{
                                                                                                            position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '150px', overflowY: 'auto', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', zIndex: 1000, display: 'none', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                                                                        }}>
                                                                                                            {allDoctypes
                                                                                                                .filter(dt => (dt.name || dt).toLowerCase().includes(newField.link_doctype.toLowerCase()))
                                                                                                                .sort((a, b) => (a.name || a).localeCompare(b.name || b))
                                                                                                                .map(dt => (
                                                                                                                    <div
                                                                                                                        key={dt.name || dt}
                                                                                                                        onClick={(e) => {
                                                                                                                            setNewField({ ...newField, link_doctype: (dt.name || dt) });
                                                                                                                            const dtList = e.target.parentElement;
                                                                                                                            if (dtList) dtList.style.display = 'none';
                                                                                                                        }}
                                                                                                                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #f8fafc' }}
                                                                                                                        onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#3b82f6'; }}
                                                                                                                        onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#475569'; }}
                                                                                                                    >
                                                                                                                        {dt.name || dt}
                                                                                                                    </div>
                                                                                                                ))
                                                                                                            }
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <input type="text" value={newField.link_doctype} onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '14px', outline: 'none' }} placeholder="Comma separated options" />
                                                                                                )}
                                                                                            </div>
                                                                                            <div style={{ display: 'flex', gap: '16px', flex: '0 0 auto', paddingBottom: '8px' }}>
                                                                                                <div style={{ textAlign: 'center' }}>
                                                                                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#1e3a8a', marginBottom: '4px' }}>REQ</label>
                                                                                                    <input type="checkbox" checked={!!newField.mandatory} onChange={(e) => setNewField({ ...newField, mandatory: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                                                                </div>
                                                                                                <div style={{ textAlign: 'center' }}>
                                                                                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#1e3a8a', marginBottom: '4px' }}>HIDE</label>
                                                                                                    <input type="checkbox" checked={!!newField.hidden} onChange={(e) => setNewField({ ...newField, hidden: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                                                                </div>
                                                                                                <div style={{ textAlign: 'center' }}>
                                                                                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#1e3a8a', marginBottom: '4px' }}>CREATE NEW</label>
                                                                                                    <input type="checkbox" checked={!!newField.allow_create_new} onChange={(e) => setNewField({ ...newField, allow_create_new: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div style={{ flex: '0 0 100px', display: 'flex', gap: '8px' }}>
                                                                                                <button onClick={() => addField()} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                                                                                                    <FaSave /> Update
                                                                                                </button>
                                                                                                <button onClick={() => { setEditingFieldId(null); setEditingFieldParent(null); }} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                                                                                    <FaTimes />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div
                                                                                            key={`nested-${field.link_doctype}-${nf.id}`}
                                                                                            draggable={true}
                                                                                            onDragStart={(e) => handleInlineNestedDragStart(e, field.link_doctype, nfIndex)}
                                                                                            onDragOver={(e) => handleInlineNestedDragOver(e, field.link_doctype, nfIndex)}
                                                                                            onDragEnd={handleInlineNestedDragEnd}
                                                                                            style={{
                                                                                                background: '#ffffff',
                                                                                                borderRadius: '20px',
                                                                                                padding: '20px',
                                                                                                border: `1.5px solid ${(nestedDraggedInfo && nestedDraggedInfo.parentTable === field.link_doctype && nestedDraggedInfo.index === nfIndex) ? '#3b82f6' : '#f1f5f9'}`,
                                                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column',
                                                                                                gap: '16px',
                                                                                                transition: 'all 0.2s',
                                                                                                cursor: 'grab',
                                                                                                opacity: nf.hidden ? 0.6 : 1,
                                                                                                position: 'relative',
                                                                                                minHeight: '120px'
                                                                                            }}
                                                                                        >
                                                                                            {nf.hidden && (
                                                                                                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#64748b', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                                    Hidden
                                                                                                </div>
                                                                                            )}
                                                                                            <div style={{ flex: 1 }}>
                                                                                                <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                                    {nf.label}
                                                                                                    {nf.mandatory && <span style={{ color: '#ef4444', fontSize: '10px' }}>●</span>}
                                                                                                </div>
                                                                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' }}>
                                                                                                    {nf.type} • {nf.id}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                                                                                    <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                                        <button 
                                                                                                            onClick={() => toggleNestedVisibility(nf.id, field.link_doctype)}
                                                                                                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: nf.hidden ? '#f1f5f9' : '#ecfdf5', color: nf.hidden ? '#94a3b8' : '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                                        >
                                                                                                            {nf.hidden ? <FaEyeSlash style={{ fontSize: '13px' }} /> : <FaEye style={{ fontSize: '13px' }} />}
                                                                                                        </button>
                                                                                                        <span className="action-tooltip">Toggle Visibility</span>
                                                                                                    </div>
                                                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                                                    <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                                        <button onClick={() => editField({ ...nf, isNested: true, parentTable: field.link_doctype })} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                                            <FaEdit style={{ fontSize: '13px' }} />
                                                                                                        </button>
                                                                                                        <span className="action-tooltip">Edit Field</span>
                                                                                                    </div>
                                                                                                    {!nf.is_default && (
                                                                                                        <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                                            <button onClick={() => deleteField(nf.id, field.link_doctype)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                                                <FaTrash style={{ fontSize: '13px' }} />
                                                                                                            </button>
                                                                                                            <span className="action-tooltip">Delete in Table</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                ))}

                                                                                {/* Inline Add New Field Box for Nested Fields */}
                                                                                {(showAddNestedField || editingNestedFieldId) ? (
                                                                                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 40px 40px 60px 80px', gap: '10px', alignItems: 'end' }}>
                                                                                            <div style={{ gridColumn: 'span 7', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                                                                <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '13px' }}>{editingNestedFieldId ? 'Edit Nested Field' : 'Add New Nested Field'}</span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>LABEL</label>
                                                                                                <input type="text" value={newNestedField.label} onChange={(e) => setNewNestedField({ ...newNestedField, label: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px' }} />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>TYPE</label>
                                                                                                <select value={newNestedField.type} onChange={(e) => setNewNestedField({ ...newNestedField, type: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff' }}>
                                                                                                    {fieldTypes.filter(t => t !== 'Section Break' && t !== 'Table' && t !== 'Link').map(t => <option key={t} value={t}>{t}</option>)}
                                                                                                </select>
                                                                                            </div>
                                                                                            <div style={{ position: 'relative' }}>
                                                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>DATA / LINK</label>
                                                                                                {newNestedField.type === 'Link' ? (
                                                                                                    <div style={{ position: 'relative' }}>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Search..."
                                                                                                            value={newNestedField.link_doctype}
                                                                                                            onChange={(e) => setNewNestedField({ ...newNestedField, link_doctype: e.target.value })}
                                                                                                            onFocus={(e) => {
                                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                                if (dtList) dtList.style.display = 'block';
                                                                                                            }}
                                                                                                            onBlur={(e) => {
                                                                                                                const dtList = e.target.nextElementSibling;
                                                                                                                setTimeout(() => { if (dtList) dtList.style.display = 'none' }, 200);
                                                                                                            }}
                                                                                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', backgroundColor: '#fff' }}
                                                                                                        />
                                                                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '150px', overflowY: 'auto', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', zIndex: 1000, display: 'none', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                                                                                            {allDoctypes
                                                                                                                .filter(dt => (dt.name || dt).toLowerCase().includes(newNestedField.link_doctype.toLowerCase()))
                                                                                                                .sort((a, b) => (a.name || a).localeCompare(b.name || b))
                                                                                                                .map(dt => (
                                                                                                                    <div
                                                                                                                        key={dt.name || dt}
                                                                                                                        onClick={(e) => {
                                                                                                                            setNewNestedField({ ...newNestedField, link_doctype: (dt.name || dt) });
                                                                                                                            const dtList = e.target.parentElement;
                                                                                                                            if (dtList) dtList.style.display = 'none';
                                                                                                                        }}
                                                                                                                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #f8fafc', transition: 'all 0.2s' }}
                                                                                                                        onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#3b82f6'; }}
                                                                                                                        onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#475569'; }}
                                                                                                                    >
                                                                                                                        {dt.name || dt}
                                                                                                                    </div>
                                                                                                                ))
                                                                                                            }
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <input type="text" value={newNestedField.link_doctype} onChange={(e) => setNewNestedField({ ...newNestedField, link_doctype: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px' }} />
                                                                                                )}
                                                                                            </div>
                                                                                            <div style={{ textAlign: 'center' }}>
                                                                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>REQ</label>
                                                                                                <input type="checkbox" checked={!!newNestedField.mandatory} onChange={(e) => setNewNestedField({ ...newNestedField, mandatory: e.target.checked })} />
                                                                                            </div>
                                                                                            <div style={{ textAlign: 'center' }}>
                                                                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>HIDE</label>
                                                                                                <input type="checkbox" checked={!!newNestedField.hidden} onChange={(e) => setNewNestedField({ ...newNestedField, hidden: e.target.checked })} />
                                                                                            </div>
                                                                                            <div style={{ textAlign: 'center' }}>
                                                                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>CREATE NEW</label>
                                                                                                <input type="checkbox" checked={!!newNestedField.allow_create_new} onChange={(e) => setNewNestedField({ ...newNestedField, allow_create_new: e.target.checked })} />
                                                                                            </div>
                                                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                                                <button onClick={() => addNestedField(field.link_doctype)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><FaPlus /></button>
                                                                                                <button onClick={() => { setShowAddNestedField(false); setEditingNestedFieldId(null); setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" }); }} style={{ background: '#e2e8f0', color: '#64748b', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><FaTimes /></button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        onClick={() => {
                                                                                            setShowAddNestedField(true);
                                                                                            setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" });
                                                                                        }}
                                                                                        style={{
                                                                                            background: '#f8fafc',
                                                                                            borderRadius: '20px',
                                                                                            padding: '20px',
                                                                                            border: '2px dashed #cbd5e1',
                                                                                            display: 'flex',
                                                                                            flexDirection: 'column',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            cursor: 'pointer',
                                                                                            minHeight: '120px',
                                                                                            color: '#64748b',
                                                                                            transition: 'all 0.2s',
                                                                                            gridColumn: 'auto'
                                                                                        }}
                                                                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                                                                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                                                                                    >
                                                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '4px' }}>
                                                                                            <FaPlus style={{ color: '#3b82f6', fontSize: '12px' }} />
                                                                                        </div>
                                                                                        <div style={{ fontWeight: '700', fontSize: '11px' }}>Add New Nested Field</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
                                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                                <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                    <button
                                                                                        onClick={() => field.isNested ? toggleNestedVisibility(field.id, field.parentTable) : toggleProperty(field.id, 'hidden')}
                                                                                        style={{ width: '32px', height: '32px', borderRadius: '8px', background: field.hidden ? '#f1f5f9' : '#ecfdf5', color: field.hidden ? '#94a3b8' : '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                    >
                                                                                        {field.hidden ? <FaEyeSlash style={{ fontSize: '13px' }} /> : <FaEye style={{ fontSize: '13px' }} />}
                                                                                    </button>
                                                                                    <span className="action-tooltip">Toggle Visibility</span>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                                <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                    <button
                                                                                        onClick={() => editField(field)}
                                                                                        style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                    >
                                                                                        <FaEdit style={{ fontSize: '13px' }} />
                                                                                    </button>
                                                                                    <span className="action-tooltip">Edit Field</span>
                                                                                </div>
                                                                                {!field.is_default && field.type !== 'Table' && (
                                                                                    <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                                        <button
                                                                                            onClick={() => deleteField(field.id, field.parentTable)}
                                                                                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                        >
                                                                                            <FaTrash style={{ fontSize: '13px' }} />
                                                                                        </button>
                                                                                        <span className="action-tooltip">{field.isNested ? 'Delete in Table' : 'Delete Field'}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Add New Field Box for this Section */}
                                                            {(!editingFieldId && !fields.some(f => f.type === 'Table')) && (
                                                                (showAddField && addFieldContextSection === sectionLabel) ? (
                                                                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '2px dashed #e2e8f0', transition: 'all 0.3s' }}>
                                                                        {(() => {
                                                                            const targets = getAvailableTargetDoctypes();
                                                                            const showSaveTo = targets.length > 1;
                                                                            const gridColumns = showSaveTo ? '1.2fr 1.2fr 1fr 1fr 60px 60px 80px 80px' : '1.5fr 1.2fr 1fr 60px 60px 80px 80px';
                                                                            const colSpan = showSaveTo ? 8 : 7;
                                                                            return (
                                                                                <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '16px', alignItems: 'end' }}>
                                                                                    <div style={{ gridColumn: `span ${colSpan}`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                        <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '14px' }}>Add New Field</span>
                                                                                        <button onClick={() => { setShowAddField(false); setNewField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" }); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                                                                    </div>
                                                                                    {showSaveTo && (
                                                                                        <div>
                                                                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>SAVE TO</label>
                                                                                            <select
                                                                                                value={saveToDocType}
                                                                                                onChange={(e) => setSaveToDocType(e.target.value)}
                                                                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '600', boxSizing: 'border-box', backgroundColor: '#fff', cursor: 'pointer' }}
                                                                                            >
                                                                                                {targets.map(t => <option key={t.name} value={t.name}>{t.label}</option>)}
                                                                                            </select>
                                                                                        </div>
                                                                                    )}
                                                                                    <div>
                                                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>LABEL</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={newField.label}
                                                                                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                                                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '600', boxSizing: 'border-box' }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>TYPE</label>
                                                                                        <select
                                                                                            value={newField.type}
                                                                                            onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                                                                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '600', boxSizing: 'border-box' }}
                                                                                        >
                                                                                            {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                                                        </select>
                                                                                    </div>
                                                                                    <div style={{
                                                                                        position: 'relative',
                                                                                        border: (newField.type === 'Table' || newField.type === 'Link') ? '1.5px solid #3b82f6' : 'none',
                                                                                        borderRadius: '12px',
                                                                                        padding: (newField.type === 'Table' || newField.type === 'Link') ? '2px' : '0'
                                                                                    }}>
                                                                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: (newField.type === 'Table' || newField.type === 'Link') ? '#3b82f6' : '#64748b', marginBottom: '6px' }}>
                                                                                            {(newField.type === 'Table' || newField.type === 'Link') ? 'SEARCH DOCTYPE' : 'DATA / OPTIONS'}
                                                                                        </label>
                                                                                        {(newField.type === 'Table' || newField.type === 'Link') ? (
                                                                                            <div style={{ position: 'relative' }}>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    placeholder="Search & Select..."
                                                                                                    value={newField.link_doctype}
                                                                                                    onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })}
                                                                                                    onFocus={(e) => {
                                                                                                        const dtList = e.target.nextElementSibling;
                                                                                                        if (dtList) dtList.style.display = 'block';
                                                                                                    }}
                                                                                                    onBlur={(e) => {
                                                                                                        const dtList = e.target.nextElementSibling;
                                                                                                        setTimeout(() => { if (dtList) dtList.style.display = 'none' }, 200);
                                                                                                    }}
                                                                                                    style={{
                                                                                                        width: '100%',
                                                                                                        padding: '10px 14px',
                                                                                                        borderRadius: '12px',
                                                                                                        border: '1.5px solid #e2e8f0',
                                                                                                        fontSize: '14px',
                                                                                                        fontWeight: '600',
                                                                                                        boxSizing: 'border-box',
                                                                                                        backgroundColor: '#fff'
                                                                                                    }}
                                                                                                />
                                                                                                <div style={{
                                                                                                    position: 'absolute',
                                                                                                    top: '100%',
                                                                                                    left: 0,
                                                                                                    right: 0,
                                                                                                    maxHeight: '200px',
                                                                                                    overflowY: 'auto',
                                                                                                    background: '#fff',
                                                                                                    border: '1.5px solid #e2e8f0',
                                                                                                    borderRadius: '12px',
                                                                                                    zIndex: 1000,
                                                                                                    display: 'none',
                                                                                                    marginTop: '4px',
                                                                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                                                                }}>
                                                                                                    {allDoctypes
                                                                                                        .filter(dt => (dt.name || dt).toLowerCase().includes(newField.link_doctype.toLowerCase()))
                                                                                                        .sort((a, b) => (a.name || a).localeCompare(b.name || b))
                                                                                                        .map(dt => (
                                                                                                            <div
                                                                                                                key={dt.name || dt}
                                                                                                                onClick={(e) => {
                                                                                                                    setNewField({ ...newField, link_doctype: (dt.name || dt) });
                                                                                                                    const dtList = e.target.parentElement;
                                                                                                                    if (dtList) dtList.style.display = 'none';
                                                                                                                    if (newField.type === 'Table' || newField.type === 'Link') {
                                                                                                                        fetchNestedSingle(dt.name || dt);
                                                                                                                    }
                                                                                                                }}
                                                                                                                style={{
                                                                                                                    padding: '10px 16px',
                                                                                                                    cursor: 'pointer',
                                                                                                                    fontSize: '13px',
                                                                                                                    fontWeight: '600',
                                                                                                                    color: '#475569',
                                                                                                                    borderBottom: '1px solid #f8fafc',
                                                                                                                    transition: 'all 0.2s'
                                                                                                                }}
                                                                                                                onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#3b82f6'; }}
                                                                                                                onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#475569'; }}
                                                                                                            >
                                                                                                                {dt.name || dt}
                                                                                                            </div>
                                                                                                        ))
                                                                                                    }
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <input
                                                                                                type="text"
                                                                                                placeholder={newField.type === 'Select' ? "Option1, Option2, Option3" : "Additional data..."}
                                                                                                value={newField.link_doctype}
                                                                                                onChange={(e) => setNewField({ ...newField, link_doctype: e.target.value })}
                                                                                                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontWeight: '600', boxSizing: 'border-box' }}
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>REQ</label>
                                                                                        <input type="checkbox" checked={newField.mandatory} onChange={(e) => setNewField({ ...newField, mandatory: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>HIDE</label>
                                                                                        <input type="checkbox" checked={newField.hidden} onChange={(e) => setNewField({ ...newField, hidden: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>CREATE NEW</label>
                                                                                        <input type="checkbox" checked={newField.allow_create_new} onChange={(e) => setNewField({ ...newField, allow_create_new: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                                        <button onClick={() => addField()} style={{ background: '#3b82f6', color: '#fff', border: 'none', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{editingFieldId ? <FaCheckCircle /> : <FaPlus />}</button>
                                                                                        <button onClick={() => { setShowAddField(false); setEditingFieldId(null); }} style={{ background: '#e2e8f0', color: '#64748b', border: 'none', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FaTimes /></button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => {
                                                                            setShowAddField(true);
                                                                            setSaveToDocType(targetDocType);
                                                                            setAddFieldContextSection(sectionLabel);
                                                                        }}
                                                                        style={{
                                                                            background: '#f8fafc',
                                                                            borderRadius: '20px',
                                                                            padding: '20px',
                                                                            border: '2px dashed #cbd5e1',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            minHeight: '120px',
                                                                            color: '#64748b',
                                                                            transition: 'all 0.2s',
                                                                            gridColumn: 'auto'
                                                                        }}
                                                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                                                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                                                                    >
                                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                                                                            <FaPlus style={{ color: '#3b82f6' }} />
                                                                        </div>
                                                                        <div style={{ fontWeight: '700', fontSize: '13px' }}>Add New Field</div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            const filteredFields = activeSection === "All" ? doctypeData.fields : (() => {
                                                const result = [];
                                                let inSection = false;
                                                for (const f of doctypeData.fields) {
                                                    if (f.type === 'Section Break') {
                                                        inSection = (f.label === activeSection);
                                                        if (inSection) result.push(f);
                                                    } else if (inSection) {
                                                        result.push(f);
                                                    }
                                                }
                                                return result;
                                            })();

                                            const grouped = [];
                                            let currentLabel = "General Information";
                                            let currentFields = [];

                                            filteredFields.forEach((f) => {
                                                if (f.type === 'Section Break') {
                                                    if (currentFields.length > 0 || currentLabel !== "General Information") {
                                                        grouped.push({ label: currentLabel, fields: currentFields });
                                                    }
                                                    currentLabel = f.label;
                                                    currentFields = [f];
                                                } else {
                                                    currentFields.push(f);
                                                }
                                            });
                                            if (currentFields.length > 0 || currentLabel !== "General Information") {
                                                grouped.push({ label: currentLabel, fields: currentFields });
                                            }

                                            return grouped.map(g => renderGrid(g.fields, g.label));
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
                @keyframes modalFadeUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #e2e8f0; borderRadius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>

                {/* Nested Modal for Linked DocTypes */}
                {nestedModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '40px'
                    }}>
                        <div style={{
                            background: '#ffffff',
                            width: '100%',
                            maxWidth: '1000px',
                            height: '80vh',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            overflow: 'hidden',
                            animation: 'modalFadeUp 0.3s ease-out'
                        }}>
                            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '36px', height: '36px', background: '#3b82f6', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                                        <FaLayerGroup />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Manage {nestedModal.doctypeName}</h3>
                                </div>
                                <button onClick={() => setNestedModal(prev => ({ ...prev, isOpen: false }))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}><FaTimes /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                                {nestedModal.loading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading {nestedModal.doctypeName}...</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                            gap: '12px'
                                        }}>
                                            {nestedModal.data.fields.map((f, idx) => (
                                                <div
                                                    key={f.id || idx}
                                                    draggable
                                                    onDragStart={(e) => handleNestedDragStart(e, idx)}
                                                    onDragOver={(e) => handleNestedDragOver(e, idx)}
                                                    onDragEnd={handleNestedDragEnd}
                                                    style={{
                                                        background: '#fff',
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        border: `1.5px solid ${nestedDraggedIndex === idx ? '#3b82f6' : '#f1f5f9'}`,
                                                        boxShadow: nestedDraggedIndex === idx ? '0 8px 25px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '12px',
                                                        opacity: f.hidden ? 0.6 : 1,
                                                        position: 'relative',
                                                        cursor: 'grab',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {f.mandatory && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '15px',
                                                            background: '#ef4444',
                                                            color: '#fff',
                                                            fontSize: '8px',
                                                            fontWeight: '900',
                                                            padding: '3px 8px',
                                                            borderRadius: '20px',
                                                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Required
                                                        </div>
                                                    )}
                                                    {f.hidden && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            left: '15px',
                                                            background: '#64748b',
                                                            color: '#fff',
                                                            fontSize: '8px',
                                                            fontWeight: '900',
                                                            padding: '3px 8px',
                                                            borderRadius: '20px',
                                                            boxShadow: '0 4px 10px rgba(100, 116, 139, 0.2)',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Hidden
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                                                        <div style={{ color: '#cbd5e1', cursor: 'grab', paddingTop: '2px', flexShrink: 0 }}>
                                                            <FaGripVertical style={{ fontSize: '12px' }} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>{f.label}</div>
                                                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{f.type} • {f.id}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f8fafc', paddingTop: '10px' }}>
                                                        <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                            <button onClick={() => toggleNestedProperty(f.id, 'mandatory')} style={{ width: '28px', height: '28px', borderRadius: '6px', background: f.mandatory ? '#fee2e2' : '#f1f5f9', color: f.mandatory ? '#ef4444' : '#94a3b8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FaExclamationCircle style={{ fontSize: '12px' }} />
                                                            </button>
                                                            <span className="action-tooltip">Toggle Mandatory</span>
                                                        </div>
                                                        <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                            <button onClick={() => toggleNestedProperty(f.id, 'hidden')} style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f8fafc', color: f.hidden ? '#cbd5e1' : '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {f.hidden ? <FaEyeSlash style={{ fontSize: '12px' }} /> : <FaEye style={{ fontSize: '12px' }} />}
                                                            </button>
                                                            <span className="action-tooltip">Toggle Visibility</span>
                                                        </div>
                                                        <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                            <button onClick={() => editNestedField(f)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#eff6ff', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FaEdit style={{ fontSize: '12px' }} />
                                                            </button>
                                                            <span className="action-tooltip">Edit Field</span>
                                                        </div>
                                                        {!f.is_default && (
                                                            <div style={{ position: 'relative' }} className="action-tooltip-container">
                                                                <button onClick={() => deleteNestedField(f.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <FaTrash style={{ fontSize: '12px' }} />
                                                                </button>
                                                                <span className="action-tooltip">Delete Field</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add New Field Box for Nested Fields */}
                                            {(showAddNestedField || editingNestedFieldId) ? (
                                                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.2fr 40px 40px 40px 80px', gap: '10px', alignItems: 'end' }}>
                                                        <div style={{ gridColumn: 'span 7', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '13px' }}>Add New Field</span>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>LABEL</label>
                                                            <input type="text" value={newNestedField.label} onChange={(e) => setNewNestedField({ ...newNestedField, label: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>TYPE</label>
                                                            <select value={newNestedField.type} onChange={(e) => setNewNestedField({ ...newNestedField, type: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#fff' }}>
                                                                {fieldTypes.filter(t => t !== 'Section Break' && t !== 'Table' && t !== 'Link').map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>DATA / LINK</label>
                                                            {newNestedField.type === 'Link' ? (
                                                                <div style={{ position: 'relative' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Search..."
                                                                        value={newNestedField.link_doctype}
                                                                        onChange={(e) => setNewNestedField({ ...newNestedField, link_doctype: e.target.value })}
                                                                        onFocus={() => document.getElementById('nested-dt-list').style.display = 'block'}
                                                                        onBlur={() => setTimeout(() => { if (document.getElementById('nested-dt-list')) document.getElementById('nested-dt-list').style.display = 'none' }, 200)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '8px 12px',
                                                                            borderRadius: '8px',
                                                                            border: '1.5px solid #e2e8f0',
                                                                            fontSize: '13px',
                                                                            backgroundColor: '#fff'
                                                                        }}
                                                                    />
                                                                    <div id="nested-dt-list" style={{
                                                                        position: 'absolute',
                                                                        top: '100%',
                                                                        left: 0,
                                                                        right: 0,
                                                                        maxHeight: '150px',
                                                                        overflowY: 'auto',
                                                                        background: '#fff',
                                                                        border: '1.5px solid #e2e8f0',
                                                                        borderRadius: '8px',
                                                                        zIndex: 1000,
                                                                        display: 'none',
                                                                        marginTop: '4px',
                                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                                    }}>
                                                                        {allDoctypes
                                                                            .filter(dt => (dt.name || dt).toLowerCase().includes(newNestedField.link_doctype.toLowerCase()))
                                                                            .sort((a, b) => (a.name || a).localeCompare(b.name || b))
                                                                            .map(dt => (
                                                                                <div
                                                                                    key={dt.name || dt}
                                                                                    onClick={() => setNewNestedField({ ...newNestedField, link_doctype: (dt.name || dt) })}
                                                                                    style={{
                                                                                        padding: '8px 12px',
                                                                                        cursor: 'pointer',
                                                                                        fontSize: '12px',
                                                                                        fontWeight: '600',
                                                                                        color: '#475569',
                                                                                        borderBottom: '1px solid #f8fafc',
                                                                                        transition: 'all 0.2s'
                                                                                    }}
                                                                                    onMouseOver={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#3b82f6'; }}
                                                                                    onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#475569'; }}
                                                                                >
                                                                                    {dt.name || dt}
                                                                                </div>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <input type="text" value={newNestedField.link_doctype} onChange={(e) => setNewNestedField({ ...newNestedField, link_doctype: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px' }} />
                                                            )}
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>REQ</label>
                                                            <input type="checkbox" checked={!!newNestedField.mandatory} onChange={(e) => setNewNestedField({ ...newNestedField, mandatory: e.target.checked })} />
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>HIDE</label>
                                                            <input type="checkbox" checked={!!newNestedField.hidden} onChange={(e) => setNewNestedField({ ...newNestedField, hidden: e.target.checked })} />
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>CREATE NEW</label>
                                                            <input type="checkbox" checked={!!newNestedField.allow_create_new} onChange={(e) => setNewNestedField({ ...newNestedField, allow_create_new: e.target.checked })} />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button onClick={() => addNestedField()} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><FaPlus /></button>
                                                            <button onClick={() => { setShowAddNestedField(false); setEditingNestedFieldId(null); setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" }); }} style={{ background: '#e2e8f0', color: '#64748b', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><FaTimes /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => {
                                                        setShowAddNestedField(true);
                                                        setNewNestedField({ label: "", type: "Data", mandatory: false, allow_create_new: false, hidden: false, link_doctype: "" });
                                                    }}
                                                    style={{
                                                        background: '#f8fafc',
                                                        borderRadius: '16px',
                                                        padding: '16px',
                                                        border: '2px dashed #cbd5e1',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        minHeight: '100px',
                                                        color: '#64748b',
                                                        transition: 'all 0.2s',
                                                        gridColumn: 'auto'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                                                >
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                                                        <FaPlus style={{ color: '#3b82f6', fontSize: '14px' }} />
                                                    </div>
                                                    <div style={{ fontWeight: '700', fontSize: '12px' }}>Add New Field here</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setNestedModal(prev => ({ ...prev, isOpen: false }))} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: '700', cursor: 'pointer' }}>Close</button>
                                <button onClick={handleSaveNested} disabled={nestedModal.saving} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>{nestedModal.saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CustomerCustomizationModal;
