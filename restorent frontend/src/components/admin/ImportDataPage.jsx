import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    FaUpload, FaTrash, FaTable, FaCheckCircle,
    FaExclamationTriangle, FaArrowLeft, FaFileExcel,
    FaFileCode, FaSearch, FaLayerGroup, FaTimes, FaEye, FaGlobe, FaBoxOpen, FaSave, FaCloudUploadAlt
} from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';

const ImportDataPage = () => {
    const navigate = useNavigate();
    const { user, baseUrl, getHeaders: getAuthHeaders } = useContext(UserContext);
    const [importData, setImportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // DYNAMIC CONTEXT HELPERS
    const getActiveCompany = () => localStorage.getItem('active_company') || user?.company_name || user?.company || 'All';
    const getActiveBranch = () => localStorage.getItem('active_branch') || user?.branch_name || user?.branch || 'All Branches';
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [importStats, setImportStats] = useState(null);
    const [activeTable, setActiveTable] = useState(null);
    const [isBulkUpdateMode, setIsBulkUpdateMode] = useState(false);
    const [showUploadConfirmModal, setShowUploadConfirmModal] = useState(false);
    const [showFinishUpdateModal, setShowFinishUpdateModal] = useState(false);
    const [pendingUploadData, setPendingUploadData] = useState(null);
    const fileInputRef = useRef(null);
    
    // Drop zone state
    const [companies, setCompanies] = useState([]);
    const [companyBranches, setCompanyBranches] = useState({});
    const [expandedCompanies, setExpandedCompanies] = useState([]);
    
    // New Hierarchy State for Super/Group Admins
    const [tenantsHierarchy, setTenantsHierarchy] = useState([]);
    const [expandedTenants, setExpandedTenants] = useState([]);
    const [userRoleParsed, setUserRoleParsed] = useState('');

    const [mappedTables, setMappedTables] = useState({});
    const [draggedTable, setDraggedTable] = useState(null);
    const [hasSavedMappings, setHasSavedMappings] = useState(false);
    const [recentlyDropped, setRecentlyDropped] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [selectedRows, setSelectedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchContextData = async () => {
            try {
                const userRole = user?.role?.toLowerCase().replace('_', '').replace(' ', '') || '';
                setUserRoleParsed(userRole);
                
                if (['superadmin', 'groupadmin', 'tenantadmin'].includes(userRole)) {
                    // Fetch full hierarchy
                    const hierarchyRes = await axios.get(`${baseUrl}/api/tenants-hierarchy`, { headers: getAuthHeaders() });
                    let hierarchyData = Array.isArray(hierarchyRes.data) ? hierarchyRes.data : [];
                    
                    // Defensive filter: If not superadmin/groupadmin, restrict strictly to their own tenant
                    if (!['superadmin', 'groupadmin'].includes(userRole)) {
                        const userTenantId = user?.tenant_id;
                        const userTenantName = user?.tenant_name;
                        if (userTenantId || userTenantName) {
                            hierarchyData = hierarchyData.filter(h => 
                                (userTenantId && h.tenant._id === userTenantId) || 
                                (userTenantName && h.tenant.tenant_name === userTenantName)
                            );
                        }
                    }
                    setTenantsHierarchy(hierarchyData);
                } else {
                    // Fetch normal company structure
                    const compRes = await axios.get(`${baseUrl}/api/user-companies`, { headers: getAuthHeaders() });
                    const comps = compRes.data.companies || [];
                    setCompanies(comps);
                    
                    const userCompany = user?.company_name || user?.company;
                    if (userCompany) {
                        fetchBranchesForCompany(userCompany);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch context data", err);
            }
        };
        fetchContextData();
    }, [baseUrl, user]);

    const fetchBranchesForCompany = async (companyName) => {
        if (!companyName || companyName === 'POS 8') return;
        try {
            const branchRes = await axios.get(`${baseUrl}/api/branches`, {
                headers: { ...getAuthHeaders(), 'X-Company-Name': companyName }
            });
            const brs = Array.isArray(branchRes.data) ? branchRes.data : [];
            setCompanyBranches(prev => ({ ...prev, [companyName]: brs }));
        } catch (err) {
            console.error("Failed to fetch branches", err);
        }
    };

    const toggleCompany = (companyName) => {
        if (expandedCompanies.includes(companyName)) {
            setExpandedCompanies(expandedCompanies.filter(c => c !== companyName));
        } else {
            setExpandedCompanies([...expandedCompanies, companyName]);
            if (!companyBranches[companyName] && !['superadmin', 'groupadmin', 'tenantadmin'].includes(userRoleParsed)) {
                fetchBranchesForCompany(companyName);
            }
        }
    };

    const toggleTenant = (tenantName) => {
        if (expandedTenants.includes(tenantName)) {
            setExpandedTenants(expandedTenants.filter(t => t !== tenantName));
        } else {
            setExpandedTenants([...expandedTenants, tenantName]);
        }
    };

    
    const handleDirectImport = async () => {
        setShowUploadConfirmModal(false);
        setLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/bulk-update`, { tables: pendingUploadData }, {
                headers: { ...getAuthHeaders(), 'X-Company-Name': getActiveCompany(), 'X-Branch-Name': getActiveBranch() }
            });
            setMessage(res.data.message || 'Bulk Update Successful!');
            setError(null);
        } catch (err) {
            console.error("Bulk update error:", err);
            setError(err.response?.data?.error || "Error processing Bulk Update");
        } finally {
            setLoading(false);
            setPendingUploadData(null);
            if(document.getElementById('bulkPriceUpload')) document.getElementById('bulkPriceUpload').value = null;
        }
    };

    const handleReviewAndEdit = () => {
        setShowUploadConfirmModal(false);
        setIsBulkUpdateMode(true);
        setImportData(pendingUploadData);
        setActiveTable(Object.keys(pendingUploadData)[0]);
        setMappedTables({}); // Reset zones
        setHasSavedMappings(true); // Treat as saved since it's pending upload data
        setError(null);
        setPendingUploadData(null);
        if(document.getElementById('bulkPriceUpload')) document.getElementById('bulkPriceUpload').value = null;
    };

    const stripTenancyFields = (data) => {
        const cleaned = {};
        Object.keys(data).forEach(tableName => {
            cleaned[tableName] = data[tableName].map(row => {
                const newRow = { ...row };
                Object.keys(newRow).forEach(key => {
                    const k = key.toLowerCase();
                    if (k.includes('company') || k.includes('branch')) {
                        delete newRow[key];
                    }
                });
                return newRow;
            });
        });
        return cleaned;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();
        setLoading(true);
        if (extension === 'json') {
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    let rawData = Array.isArray(json) ? { "imported_data": json } : json;
                    const cleanedData = stripTenancyFields(rawData);
                    setImportData(cleanedData);
                    setActiveTable(null);
                    setMappedTables({});
                    setHasSavedMappings(false);
                    setError(null);
                } catch (err) { setError("Invalid JSON file format"); }
                finally { setLoading(false); }
            };
            reader.readAsText(file);
        } else if (['xlsx', 'xls'].includes(extension)) {
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetsData = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                        if (jsonData.length > 0) sheetsData[sheetName] = jsonData;
                    });
                    const cleanedData = stripTenancyFields(sheetsData);
                    setImportData(cleanedData);
                    setActiveTable(null);
                    setMappedTables({});
                    setHasSavedMappings(false);
                    setError(null);
                } catch (err) { setError("Error parsing Excel file"); }
                finally { setLoading(false); }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setError("Unsupported format. Use Excel or JSON.");
            setLoading(false);
        }
    };

    const handleDeleteTable = (tableName) => {
        const newData = { ...importData };
        delete newData[tableName];
        setImportData(Object.keys(newData).length > 0 ? newData : null);
        if (activeTable === tableName) setActiveTable(Object.keys(newData)[0] || null);
        // remove from zones
        setMappedTables(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                if (next[k]) next[k] = next[k].filter(t => t !== tableName);
            });
            return next;
        });
    };

    // --- Drag and Drop Logic ---
    const onDragStart = (e, tableName) => {
        e.dataTransfer.setData('tableName', tableName);
        setDraggedTable(tableName);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const onDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const onDropToZone = (e, zoneKey) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const tableName = e.dataTransfer.getData('tableName');
        if (!tableName) return;

        setMappedTables(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                if (next[k]) next[k] = next[k].filter(t => t !== tableName);
            });
            if (!next[zoneKey]) next[zoneKey] = [];
            next[zoneKey].push(tableName);
            return next;
        });
        setDraggedTable(null);
        setActiveTable(tableName); // Always set as active table for preview

        const dropId = Date.now();
        setRecentlyDropped({ table: tableName, zoneKey, id: dropId });
        setTimeout(() => {
            setRecentlyDropped(prev => (prev?.id === dropId ? null : prev));
        }, 1500);
    };

    const onDropToSidebar = (e) => {
        e.preventDefault();
        const tableName = e.dataTransfer.getData('tableName');
        if (!tableName) return;
        setMappedTables(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                if (next[k]) next[k] = next[k].filter(t => t !== tableName);
            });
            return next;
        });
        setDraggedTable(null);
    };

    const handleSaveMappings = () => {
        const hasAnyMapping = Object.values(mappedTables).some(arr => arr && arr.length > 0);
        if (!hasAnyMapping) {
            setError("No tables have been mapped! Please drag tables into mapping boxes first.");
            setTimeout(() => setError(null), 4000);
            return;
        }

        const mappedPayload = {};
        Object.keys(mappedTables).forEach(zoneKey => {
            const tablesInZone = mappedTables[zoneKey] || [];
            
            let targetCompany = '';
            let targetBranch = 'all';
            
            if (zoneKey.startsWith('tenant::')) {
                // Mapped to entire tenant
                targetCompany = 'all';
                targetBranch = 'all';
            } else if (zoneKey.startsWith('comp::')) {
                const parts = zoneKey.split('::');
                targetCompany = parts[parts.length - 1]; // Handles both "comp::Company" and "comp::Tenant::Company"
            } else if (zoneKey.startsWith('branch::')) {
                const parts = zoneKey.split('::');
                targetBranch = parts[parts.length - 1];
                targetCompany = parts[parts.length - 2];
            }

            tablesInZone.forEach(tableName => {
                if (importData[tableName]) {
                    mappedPayload[tableName] = importData[tableName].map(row => {
                        const newRow = { ...row };
                        Object.keys(newRow).forEach(k => {
                            const lk = k.toLowerCase();
                            if (lk.includes('company') || lk.includes('branch')) delete newRow[k];
                        });
                        newRow.company = targetCompany;
                        if (targetBranch !== 'all') {
                            newRow.branch = targetBranch;
                        }
                        return newRow;
                    });
                }
            });
        });

        setImportData(mappedPayload);
        setActiveTable(Object.keys(mappedPayload)[0] || null);
        
        setMappedTables({});
        setHasSavedMappings(true);
        setMessage("Mappings saved successfully! You can now review the applied changes or finish the import.");
        setTimeout(() => setMessage(''), 4000);
        setShowFinishUpdateModal(true);
    };



    // --- Cell Editing Logic ---
    const handleCellEdit = (table, rowIdx, key, value) => {
        setImportData(prev => {
            const newData = { ...prev };
            const rows = [...newData[table]];
            rows[rowIdx] = { ...rows[rowIdx], [key]: value };
            newData[table] = rows;
            return newData;
        });
    };

    const handleNestedArrayEdit = (table, rowIdx, key, arrIdx, field, val) => {
        setImportData(prev => {
            const newData = { ...prev };
            const rows = [...newData[table]];
            let currentVal = rows[rowIdx][key];
            let isString = typeof currentVal === 'string';
            let arr = [];
            try {
                if (isString) {
                    let s = currentVal.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/'/g, '"');
                    arr = JSON.parse(s);
                } else {
                    arr = JSON.parse(JSON.stringify(currentVal)); 
                }
            } catch(e) { return prev; }

            if (Array.isArray(arr) && arr[arrIdx]) {
                arr[arrIdx][field] = Number(val) || 0;
                rows[rowIdx] = { ...rows[rowIdx], [key]: isString ? JSON.stringify(arr) : arr };
                newData[table] = rows;
            }
            return newData;
        });
    };

    const handleNestedArrayRemove = (table, rowIdx, key, arrIdx) => {
        setImportData(prev => {
            const newData = { ...prev };
            const rows = [...newData[table]];
            let currentVal = rows[rowIdx][key];
            let isString = typeof currentVal === 'string';
            let arr = [];
            try {
                if (isString) {
                    let s = currentVal.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/'/g, '"');
                    arr = JSON.parse(s);
                } else {
                    arr = JSON.parse(JSON.stringify(currentVal)); 
                }
            } catch(e) { return prev; }

            if (Array.isArray(arr)) {
                arr.splice(arrIdx, 1);
                rows[rowIdx] = { ...rows[rowIdx], [key]: isString ? JSON.stringify(arr) : arr };
                newData[table] = rows;
            }
            return newData;
        });
    };

    const handleDeleteRow = (tableName, index) => {
        const newData = { ...importData };
        newData[tableName] = newData[tableName].filter((_, i) => i !== index);
        if (newData[tableName].length === 0) {
            delete newData[tableName];
            setActiveTable(Object.keys(newData)[0] || null);
        }
        setImportData(Object.keys(newData).length > 0 ? newData : null);
    };

    const handleDeleteSelected = () => {
        if (!activeTable || !selectedRows[activeTable]?.length) return;
        const indices = new Set(selectedRows[activeTable]);
        const newData = { ...importData };
        newData[activeTable] = newData[activeTable].filter((_, i) => !indices.has(i));
        if (newData[activeTable].length === 0) {
            delete newData[activeTable];
            setActiveTable(Object.keys(newData)[0] || null);
        }
        setImportData(Object.keys(newData).length > 0 ? newData : null);
        setSelectedRows({ ...selectedRows, [activeTable]: [] });
    };

    const handleRowSelect = (index) => {
        const current = selectedRows[activeTable] || [];
        setSelectedRows({
            ...selectedRows,
            [activeTable]: current.includes(index) ? current.filter(i => i !== index) : [...current, index]
        });
    };

    const confirmProceedBulkUpdate = async () => {
        setShowFinishUpdateModal(false);
        setLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/bulk-update`, { tables: importData }, {
                headers: { ...getAuthHeaders(), 'X-Company-Name': getActiveCompany(), 'X-Branch-Name': getActiveBranch() }
            });
            setMessage(res.data.message || 'Bulk Update Successful!');
            setImportData(null);
            setIsBulkUpdateMode(false);
            setError(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Bulk update error:", err);
            setError(err.response?.data?.error || "Error saving Bulk Update");
        } finally {
            setLoading(false);
        }
    };

    const handleProceedImport = async () => {
        if (!importData) return;
        setShowFinishUpdateModal(false);
        setLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/import-advanced`, { tables: importData }, {
                headers: { ...getAuthHeaders(), 'X-Company-Name': getActiveCompany(), 'X-Branch-Name': getActiveBranch() }
            });
            setMessage(res.data.message);
            setImportStats(res.data.stats);
            setImportData(null);
            setShowSuccessModal(true);
        } catch (err) { setError(err.response?.data?.error || "Import failed"); }
        finally { setLoading(false); }
    };

    const handleBulkImageUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('images', file));
        setLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/bulk-upload-images`, formData, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data', 'X-Company-Name': getActiveCompany(), 'X-Branch-Name': getActiveBranch() }
            });
            setMessage(`Images uploaded! Matched: ${res.data.stats.matched}, Unmatched: ${res.data.stats.unmatched}`);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Error uploading images");
        } finally {
            setLoading(false);
            if(e.target) e.target.value = null;
        }
    };

    const handleBulkPriceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!['xlsx', 'xls'].includes(extension)) {
            setError("Only Excel backups are supported for Bulk Price Update.");
            return;
        }
        setLoading(true);
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetsData = {};
                workbook.SheetNames.forEach(sheetName => {
                    if (['items', 'purchase_items'].includes(sheetName)) {
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                        if (jsonData.length > 0) sheetsData[sheetName] = jsonData;
                    }
                });
                if (Object.keys(sheetsData).length === 0) {
                    setError("Excel file must contain 'items' or 'purchase_items' sheets.");
                    setLoading(false);
                    if(e.target) e.target.value = null;
                    return;
                }
                setPendingUploadData(sheetsData);
                setShowUploadConfirmModal(true);
            } catch (err) {
                setError(err.response?.data?.error || "Error processing Bulk Update");
            } finally {
                setLoading(false);
                if(e.target) e.target.value = null;
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const getHeaders = (tableName) => {
        if (isBulkUpdateMode) {
            const allowedColumns = ['item_name', 'item_code', 'price', 'price_list_rate', 'item_group', 'combo_offers', 'combos', 'combo_price', 'addons', 'company', 'branch'];
            const headers = new Set();
            importData[tableName]?.forEach(row => {
                Object.keys(row).forEach(k => {
                    if (allowedColumns.includes(k.toLowerCase())) headers.add(k);
                });
            });
            const arr = Array.from(headers);
            return arr.length > 0 ? arr : ['item_name', 'item_code'];
        }
        const headers = new Set();
        importData[tableName]?.forEach(row => {
            Object.keys(row).forEach(k => {
                const lk = k.toLowerCase();
                if (lk === 'company' || lk === 'branch' || (!lk.includes('company') && !lk.includes('branch'))) headers.add(k);
            });
        });
        return Array.from(headers);
    };

    const filteredData = (activeTable && importData && importData[activeTable]) ?
        importData[activeTable].map((r, i) => ({ ...r, originalIdx: i }))
            .filter(r => !searchTerm || Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))) : [];

    const unassignedTables = importData 
        ? Object.keys(importData).filter(t => !Object.values(mappedTables).flat().includes(t))
        : [];

    const tablesToPreview = importData
        ? (hasSavedMappings 
            ? Object.keys(importData) 
            : Object.keys(importData).filter(t => Object.values(mappedTables).flat().includes(t)))
        : [];

    return (
        <div className="import-page">
            <style>{`
                .import-page { padding: 1.5rem; background: #f1f5f9; min-height: 100vh; font-family: 'Inter', sans-serif; position: relative; }
                .top-nav { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .main-container { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; height: calc(100vh - 180px); }
                .sidebar { background: #fff; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-height: 100%; overflow: hidden; }
                .sidebar-list { flex: 1; overflow-y: auto; padding-right: 5px; }
                .sidebar-list::-webkit-scrollbar { width: 5px; }
                .sidebar-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .sidebar-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .sidebar-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                .preview-area { background: #fff; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
                
                .bulk-section { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 12px; margin-bottom: 0; flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0; }
                .preview-bottom-section { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; border-top: 1px solid #e2e8f0; margin-top: 1rem; padding-top: 1rem; }
                
                .bulk-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; flex-shrink: 0; }
                .bulk-item { display: flex; align-items: center; gap: 0.5rem; }
                .bulk-item label { font-weight: 600; color: #64748b; font-size: 0.8rem; }
                .bulk-select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 8px; min-width: 160px; font-size: 0.85rem; }
                
                .zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
                .zone-box { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 1rem; background: #f8fafc; min-height: 120px; display: flex; flex-direction: column; transition: 0.2s; position: relative; }
                .zone-box h4 { margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
                .zone-box.drag-over { border-color: #3b82f6; background: #eff6ff; box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.2); transform: scale(1.02); z-index: 10; }
                .remove-zone { position: absolute; top: 0.5rem; right: 0.5rem; color: #94a3b8; cursor: pointer; border: none; background: transparent; padding: 2px; }
                .remove-zone:hover { color: #ef4444; }
                
                .draggable-table { padding: 0.5rem 0.75rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 0.5rem; font-size: 0.8rem; cursor: grab; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: 0.2s; }
                .draggable-table:hover { border-color: #94a3b8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .draggable-table:active { cursor: grabbing; opacity: 0.7; }
                
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes floatUp {
                    0% { transform: translate(-50%, 10px); opacity: 0; }
                    20% { transform: translate(-50%, 0); opacity: 1; }
                    80% { transform: translate(-50%, -10px); opacity: 1; }
                    100% { transform: translate(-50%, -20px); opacity: 0; }
                }
                .animate-drop {
                    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    border-color: #10b981 !important;
                    background: #ecfdf5 !important;
                    color: #065f46 !important;
                }
                .drop-animation-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    pointer-events: none;
                    animation: floatUp 1.5s ease-out forwards;
                    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                
                .table-box { flex: 1; overflow: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 1rem; position: relative; }
                table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                th { background: #f8fafc; padding: 0.75rem 1rem; text-align: left; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #e2e8f0; white-space: nowrap; color: #475569; }
                td { padding: 0.6rem 1rem; border-bottom: 1px solid #f1f5f9; white-space: nowrap; max-width: 250px; overflow: hidden; text-overflow: ellipsis; }
                
                .btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; transition: 0.2s; }
                .btn-primary { background: #3b82f6; color: #fff; }
                .btn-primary:hover { background: #2563eb; }
                .btn-success { background: #10b981; color: #fff; }
                .btn-danger { background: #ef4444; color: #fff; }
                .btn-secondary { background: #f1f5f9; color: #475569; }
                
                .upload-zone { background: #fff; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 5rem 2rem; text-align: center; cursor: pointer; transition: 0.3s; max-width: 700px; margin: 4rem auto; }
                .upload-zone:hover { border-color: #3b82f6; background: #f0f9ff; }
                
                .row-btn { padding: 4px; border: none; background: transparent; color: #94a3b8; cursor: pointer; }
                .row-btn:hover { color: #ef4444; }
                
                .table-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.5rem; background: #f8fafc; transition: 0.2s; border: 1px solid transparent; }
                .table-item:hover { background: #f1f5f9; border-color: #e2e8f0; }
                .table-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; border: 1px solid #3b82f6; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1); }
                
                /* Fullscreen Loading Overlay */
                .fullscreen-loader { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
                .loader-core { position: relative; width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; }
                .loader-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 4px solid transparent; border-top-color: #3b82f6; border-bottom-color: #10b981; animation: spin-fast 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; }
                .loader-ring::before { content: ''; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; border-radius: 50%; border: 4px solid transparent; border-left-color: #8b5cf6; border-right-color: #ec4899; animation: spin-reverse 1.5s linear infinite; }
                .loader-icon { font-size: 3rem; color: #fff; animation: pulse-icon 1.5s ease-in-out infinite; z-index: 2; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)); }
                @keyframes spin-fast { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
                @keyframes pulse-icon { 0% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8)); } 100% { transform: scale(0.9); opacity: 0.8; } }
                .loader-text { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: 1px; margin-bottom: 0.5rem; animation: pulse-text 2s ease-in-out infinite; }
                .loader-subtext { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
                @keyframes pulse-text { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; text-shadow: 0 0 15px rgba(255, 255, 255, 0.5); } }
                .data-bit { position: absolute; width: 6px; height: 6px; border-radius: 50%; bottom: -20px; opacity: 0; z-index: 1; }
                @keyframes fly-up { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 20% { opacity: 1; transform: translateY(-30px) scale(1); } 80% { opacity: 1; transform: translateY(-80px) scale(1); } 100% { transform: translateY(-120px) scale(0); opacity: 0; } }
                .data-table-name { position: absolute; bottom: -40px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(16, 185, 129, 0.9)); padding: 0.3rem 0.8rem; border-radius: 20px; color: white; font-size: 0.75rem; font-weight: 700; white-space: nowrap; opacity: 0; z-index: 1; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4); display: flex; align-items: center; gap: 0.4rem; }
                @keyframes fly-up-table { 0% { transform: translate(-50%, 20px) scale(0.5); opacity: 0; } 15% { opacity: 1; transform: translate(-50%, -20px) scale(1); } 85% { opacity: 1; transform: translate(-50%, -70px) scale(1); } 100% { transform: translate(-50%, -100px) scale(0); opacity: 0; } }
            `}</style>

            {loading && (
                <div className="fullscreen-loader">
                    <div className="loader-core">
                        <div className="loader-ring"></div>
                        <FaCloudUploadAlt className="loader-icon" />
                        {(() => {
                            const tables = importData ? Object.keys(importData) : (pendingUploadData ? Object.keys(pendingUploadData) : []);
                            if (tables.length === 0) {
                                return (
                                    <>
                                        <div className="data-bit" style={{ left: '30%', animation: 'fly-up 1.5s ease-in infinite 0s', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>
                                        <div className="data-bit" style={{ left: '50%', animation: 'fly-up 1.5s ease-in infinite 0.5s', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                                        <div className="data-bit" style={{ left: '70%', animation: 'fly-up 1.5s ease-in infinite 1s', background: '#ec4899', boxShadow: '0 0 8px #ec4899' }}></div>
                                    </>
                                );
                            }
                            return tables.map((t, i) => {
                                const delay = (i * 0.6) % 3;
                                const leftPos = 30 + ((i * 25) % 50);
                                return (
                                    <div key={t} className="data-table-name" style={{ left: `${leftPos}%`, animation: `fly-up-table 2.5s ${delay}s infinite ease-in` }}>
                                        <FaTable /> {t}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="loader-text">Syncing Data to Server...</div>
                    <div className="loader-subtext">Please wait, do not close this window</div>
                </div>
            )}

            {showSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10b981', animation: 'pulse-icon 2s infinite' }} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#064e3b', fontWeight: 800 }}>Data Imported Successfully!</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Your data has been perfectly synced and saved into the database. What would you like to do next?
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={() => { setShowSuccessModal(false); navigate('/admin'); }} style={{ flex: 1, justifyContent: 'center', background: '#10b981' }}>
                                Okay (Go to Admin)
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setShowSuccessModal(false); setMessage(''); setImportStats(null); }} style={{ flex: 1, justifyContent: 'center' }}>
                                Cancel (Stay Here)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFinishUpdateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '12px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Finish Import</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Your mappings have been saved successfully.<br/><br/>
                            Click <strong>Proceed</strong> to finalize the import and send the data to the database.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={isBulkUpdateMode ? confirmProceedBulkUpdate : handleProceedImport}>
                                Proceed
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowFinishUpdateModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUploadConfirmModal && pendingUploadData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '12px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <FaExclamationTriangle style={{ fontSize: '3.5rem', color: '#f59e0b', marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Confirm Bulk Update</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            Found <strong>{pendingUploadData['items']?.length || 0}</strong> Items and <strong>{pendingUploadData['purchase_items']?.length || 0}</strong> Purchase Items.<br/><br/>
                            Do you want to directly import and update the database now, or map and edit the data first?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={handleDirectImport}>
                                <FaCheckCircle style={{ marginRight: '0.5rem' }} /> Direct Import
                            </button>
                            <button className="btn btn-warning" onClick={handleReviewAndEdit} style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                                <FaEye style={{ marginRight: '0.5rem' }} /> Map & Edit
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setShowUploadConfirmModal(false); setPendingUploadData(null); if(document.getElementById('bulkPriceUpload')) document.getElementById('bulkPriceUpload').value = null; }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FaLayerGroup color="#3b82f6" size={24} />
                    <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Master Import Utility</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!importData && (
                        <>
                            <button className="btn btn-primary" onClick={() => document.getElementById('bulkImageUpload').click()} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
                                <FaUpload style={{ marginRight: '0.5rem' }} /> Bulk Image Upload
                            </button>
                            <input type="file" id="bulkImageUpload" style={{ display: 'none' }} accept="image/*" multiple onChange={handleBulkImageUpload} />
                            
                            <button className="btn btn-warning" onClick={() => document.getElementById('bulkPriceUpload').click()} style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                                <FaFileExcel style={{ marginRight: '0.5rem' }} /> Bulk Price & Qty Update
                            </button>
                            <input type="file" id="bulkPriceUpload" style={{ display: 'none' }} accept=".xlsx, .xls" onChange={handleBulkPriceUpload} />
                        </>
                    )}
                    <button className="btn btn-secondary" onClick={() => { setImportData(null); setIsBulkUpdateMode(false); navigate('/admin'); }}><FaArrowLeft /> Exit</button>
                </div>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}><FaExclamationTriangle /> {error}</div>}
            {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}><FaCheckCircle /> {message}</div>}

            {!importData && !message && (
                <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .json" onChange={handleFileChange} />
                    <FaUpload size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                    <h2>Select your file to begin</h2>
                    <p>Excel or JSON files are supported for multi-table import</p>
                </div>
            )}

            {importData && (
                <div className="main-container">
                    {/* Unassigned Tables Sidebar */}
                    <div className="sidebar" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDropToSidebar}>
                        <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Unmapped Tables</h3>
                        <div className="sidebar-list">
                            {unassignedTables.map(t => (
                                <div 
                                    key={t} 
                                    className="draggable-table" 
                                    draggable 
                                    onDragStart={(e) => onDragStart(e, t)}
                                    title="Drag me to a Box!"
                                >
                                    <FaTable color="#cbd5e1" />
                                    <span>{t} ({importData[t].length})</span>
                                </div>
                            ))}
                            {unassignedTables.length === 0 && (
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>All tables mapped!</div>
                            )}
                        </div>
                    </div>

                    <div className="preview-area">
                        {/* Drag and Drop Mapping Area */}
                        <div className="bulk-section">
                            <div className="bulk-controls">
                                <div className="bulk-item">
                                    <FaGlobe color="#3b82f6" />
                                    <span style={{ fontWeight: 700 }}>Map Tables to Companies & Branches:</span>
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                    <button className="btn btn-success" onClick={handleSaveMappings}><FaSave /> Save Mappings & Import</button>
                                </div>
                            </div>
                            
                            <div className="zones-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {tenantsHierarchy.length > 0 ? (
                                    tenantsHierarchy.map(item => {
                                        const t = item.tenant;
                                        const tenantName = t.tenant_name;
                                        const tenantKey = `tenant::${tenantName}`;
                                        const isTenantExpanded = expandedTenants.includes(tenantName);

                                        return (
                                            <div key={tenantName} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                                                {/* Tenant Drop Zone */}
                                                <div 
                                                    className="zone-box"
                                                    style={{ border: 'none', borderRadius: 0, minHeight: '80px', background: '#e0f2fe', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', borderBottom: isTenantExpanded ? '1px solid #e2e8f0' : 'none' }}
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={(e) => onDropToZone(e, tenantKey)}
                                                >
                                                    <div style={{ minWidth: '200px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleTenant(tenantName)}>
                                                            <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🏢 {tenantName}</h4>
                                                            <span style={{ color: '#0284c7', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{isTenantExpanded ? 'Hide Companies' : 'Show Companies'}</span>
                                                        </div>
                                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Drag here to apply to ALL Companies & Branches</p>
                                                    </div>
                                                    
                                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', position: 'relative' }}>
                                                        {!(mappedTables[tenantKey]?.length > 0) ? (
                                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0.5rem', width: '100%', textAlign: 'center', alignSelf: 'center' }}>Drop tables here for entire Organization</div>
                                                        ) : (
                                                            mappedTables[tenantKey].map(t => {
                                                                const isJustDropped = recentlyDropped?.table === t && recentlyDropped?.zoneKey === tenantKey;
                                                                return (
                                                                    <div key={t} className={`draggable-table ${isJustDropped ? 'animate-drop' : ''}`} draggable onDragStart={(e) => onDragStart(e, t)}>
                                                                        <FaTable color={isJustDropped ? '#059669' : '#64748b'} /> {t}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                        {recentlyDropped?.zoneKey === tenantKey && (
                                                            <div className="drop-animation-text"><FaCheckCircle /> {recentlyDropped.table} Mapped!</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isTenantExpanded && (
                                                    <div style={{ padding: '1rem', background: '#f8fafc' }}>
                                                        {item.companies.length === 0 ? (
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>No companies found in this organization.</div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                                {item.companies.map(compObj => {
                                                                    const c = compObj.company;
                                                                    const compName = c.company_name;
                                                                    const compKey = `comp::${tenantName}::${compName}`;
                                                                    const isCompExpanded = expandedCompanies.includes(compName);
                                                                    const branchesList = compObj.branches || [];

                                                                    return (
                                                                        <div key={compName} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                                                                            {/* Company Drop Zone */}
                                                                            <div 
                                                                                className="zone-box"
                                                                                style={{ border: 'none', borderRadius: 0, minHeight: '120px', background: '#fff', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: isCompExpanded ? '320px' : '100%', flexShrink: 0, transition: 'width 0.3s' }}
                                                                                onDragOver={onDragOver}
                                                                                onDragLeave={onDragLeave}
                                                                                onDrop={(e) => onDropToZone(e, compKey)}
                                                                            >
                                                                                <div>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleCompany(compName)}>
                                                                                        <h4 style={{ margin: 0 }}>{compName}</h4>
                                                                                        <span style={{ color: '#3b82f6', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{isCompExpanded ? 'Hide Branches' : 'Show Branches'}</span>
                                                                                    </div>
                                                                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Drag here to apply to ALL branches</p>
                                                                                </div>
                                                                                
                                                                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', position: 'relative', alignContent: 'flex-start' }}>
                                                                                    {!(mappedTables[compKey]?.length > 0) ? (
                                                                                        <div style={{ color: '#cbd5e1', fontSize: '0.8rem', padding: '0.5rem', width: '100%', textAlign: 'center' }}>Drop tables here for Company</div>
                                                                                    ) : (
                                                                                        mappedTables[compKey].map(t => {
                                                                                            const isJustDropped = recentlyDropped?.table === t && recentlyDropped?.zoneKey === compKey;
                                                                                            return (
                                                                                                <div key={t} className={`draggable-table ${isJustDropped ? 'animate-drop' : ''}`} draggable onDragStart={(e) => onDragStart(e, t)}>
                                                                                                    <FaTable color={isJustDropped ? '#059669' : '#64748b'} /> {t}
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    )}
                                                                                    {recentlyDropped?.zoneKey === compKey && (
                                                                                        <div className="drop-animation-text"><FaCheckCircle /> {recentlyDropped.table} Mapped!</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Branches Grid */}
                                                                            {isCompExpanded && (
                                                                                <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e2e8f0', background: '#fafafa', overflowY: 'auto' }}>
                                                                                    <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>Specific Branches:</h5>
                                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                                                        {branchesList.length === 0 ? (
                                                                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No branches found.</span>
                                                                                        ) : (
                                                                                            branchesList.map(bObj => {
                                                                                                const b = bObj.branch_name;
                                                                                                const branchKey = `branch::${tenantName}::${compName}::${b}`;
                                                                                                return (
                                                                                                    <div 
                                                                                                        key={b} 
                                                                                                        className="zone-box"
                                                                                                        onDragOver={onDragOver}
                                                                                                        onDragLeave={onDragLeave}
                                                                                                        onDrop={(e) => onDropToZone(e, branchKey)}
                                                                                                        style={{ border: '1px dashed #cbd5e1', padding: '0.75rem', minHeight: '80px', display: 'flex', flexDirection: 'column', background: '#fff' }}
                                                                                                    >
                                                                                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>{b}</h4>
                                                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                                                                                                            {!(mappedTables[branchKey]?.length > 0) ? (
                                                                                                                <div style={{ color: '#cbd5e1', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>Drop here</div>
                                                                                                            ) : (
                                                                                                                mappedTables[branchKey].map(t => {
                                                                                                                    const isJustDropped = recentlyDropped?.table === t && recentlyDropped?.zoneKey === branchKey;
                                                                                                                    return (
                                                                                                                        <div key={t} className={`draggable-table ${isJustDropped ? 'animate-drop' : ''}`} draggable onDragStart={(e) => onDragStart(e, t)}>
                                                                                                                            <FaTable color={isJustDropped ? '#059669' : '#64748b'} /> {t}
                                                                                                                        </div>
                                                                                                                    );
                                                                                                                })
                                                                                                            )}
                                                                                                            {recentlyDropped?.zoneKey === branchKey && (
                                                                                                                <div className="drop-animation-text" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}><FaCheckCircle /> {recentlyDropped.table} Mapped!</div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    companies.map(c => {
                                        const compName = c.company_name || c.company;
                                        const compKey = `comp::${compName}`;
                                        const isExpanded = expandedCompanies.includes(compName);
                                        const branchesList = companyBranches[compName] || [];

                                        return (
                                            <div key={compName} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                                                <div 
                                                    className="zone-box"
                                                    style={{ border: 'none', borderRadius: 0, minHeight: '120px', background: '#f8fafc', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: isExpanded ? '320px' : '100%', flexShrink: 0, transition: 'width 0.3s' }}
                                                    onDragOver={onDragOver}
                                                    onDragLeave={onDragLeave}
                                                    onDrop={(e) => onDropToZone(e, compKey)}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleCompany(compName)}>
                                                            <h4 style={{ margin: 0 }}>{compName}</h4>
                                                            <span style={{ color: '#3b82f6', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{isExpanded ? 'Hide Branches' : 'Show Branches'}</span>
                                                        </div>
                                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Drag here to apply to ALL branches</p>
                                                    </div>
                                                    
                                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', position: 'relative', alignContent: 'flex-start' }}>
                                                        {!(mappedTables[compKey]?.length > 0) ? (
                                                            <div style={{ color: '#cbd5e1', fontSize: '0.8rem', padding: '0.5rem', width: '100%', textAlign: 'center' }}>Drop tables here for Company</div>
                                                        ) : (
                                                            mappedTables[compKey].map(t => {
                                                                const isJustDropped = recentlyDropped?.table === t && recentlyDropped?.zoneKey === compKey;
                                                                return (
                                                                    <div key={t} className={`draggable-table ${isJustDropped ? 'animate-drop' : ''}`} draggable onDragStart={(e) => onDragStart(e, t)}>
                                                                        <FaTable color={isJustDropped ? '#059669' : '#64748b'} /> {t}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                        {recentlyDropped?.zoneKey === compKey && (
                                                            <div className="drop-animation-text"><FaCheckCircle /> {recentlyDropped.table} Mapped!</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e2e8f0', background: '#fff', overflowY: 'auto' }}>
                                                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>Specific Branches:</h5>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                            {branchesList.length === 0 ? (
                                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No branches found.</span>
                                                            ) : (
                                                                branchesList.map(b => {
                                                                    const branchKey = `branch::${compName}::${b}`;
                                                                    return (
                                                                        <div 
                                                                            key={b} 
                                                                            className="zone-box"
                                                                            onDragOver={onDragOver}
                                                                            onDragLeave={onDragLeave}
                                                                            onDrop={(e) => onDropToZone(e, branchKey)}
                                                                            style={{ border: '1px dashed #cbd5e1', padding: '0.75rem', minHeight: '80px', display: 'flex', flexDirection: 'column' }}
                                                                        >
                                                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>{b}</h4>
                                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                                                                                {!(mappedTables[branchKey]?.length > 0) ? (
                                                                                    <div style={{ color: '#cbd5e1', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>Drop here</div>
                                                                                ) : (
                                                                                    mappedTables[branchKey].map(t => {
                                                                                        const isJustDropped = recentlyDropped?.table === t && recentlyDropped?.zoneKey === branchKey;
                                                                                        return (
                                                                                            <div key={t} className={`draggable-table ${isJustDropped ? 'animate-drop' : ''}`} draggable onDragStart={(e) => onDragStart(e, t)}>
                                                                                                <FaTable color={isJustDropped ? '#059669' : '#64748b'} /> {t}
                                                                                            </div>
                                                                                        );
                                                                                    })
                                                                                )}
                                                                                {recentlyDropped?.zoneKey === branchKey && (
                                                                                    <div className="drop-animation-text" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}><FaCheckCircle /> {recentlyDropped.table} Mapped!</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                
                                {companies.length === 0 && tenantsHierarchy.length === 0 && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                        No organizations or companies available.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="preview-bottom-section">
                            {/* Preview Area Footer / Editor */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ fontSize: '1rem', margin: 0 }}>Review Data Before Import</h2>
                                    {activeTable && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{activeTable}</span>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <FaSearch style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input type="text" placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '0.5rem 1rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
                                </div>
                            </div>

                        {/* Horizontal list of mapped tables for preview since sidebar is unassigned */}
                        {importData && (
                             <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem', flexShrink: 0 }}>
                                {tablesToPreview.map(t => (
                                    <div key={t} className={`table-item ${activeTable === t ? 'active' : ''}`} onClick={() => setActiveTable(t)} style={{ minWidth: '150px', marginBottom: 0, justifyContent: 'center' }}>
                                        <span>{t} ({importData[t].length})</span>
                                    </div>
                                ))}
                                {tablesToPreview.length === 0 && (
                                    <div style={{ padding: '1rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', width: '100%', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                                        Please drag and drop tables into the boxes above to preview their data here.
                                    </div>
                                )}
                             </div>
                        )}

                        {tablesToPreview.length > 0 && (
                        <div className="table-box">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={!!(activeTable && selectedRows[activeTable]?.length === filteredData.length && filteredData.length > 0)}
                                                onChange={(e) => setSelectedRows({
                                                    ...selectedRows,
                                                    [activeTable]: e.target.checked ? filteredData.map(r => r.originalIdx) : []
                                                })}
                                            />
                                        </th>
                                        <th>#</th>
                                        {activeTable && getHeaders(activeTable).map(h => <th key={h}>{h}</th>)}
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={!!(activeTable && selectedRows[activeTable]?.includes(row.originalIdx))}
                                                    onChange={() => handleRowSelect(row.originalIdx)}
                                                />
                                            </td>
                                            <td>{row.originalIdx + 1}</td>
                                            {activeTable && getHeaders(activeTable).map(h => {
                                                const hl = h.toLowerCase();
                                                const isEditable = isBulkUpdateMode && ['item_code', 'item_name', 'price', 'price_list_rate', 'selling_price', 'purchase_price', 'rate', 'standard_rate', 'qty', 'uom'].includes(hl);
                                                const isNestedArr = hl === 'addons' || hl === 'combos' || hl === 'combo_offers';
                                                
                                                let parsedArr = null;
                                                if (isNestedArr) {
                                                    try {
                                                        const val = row[h];
                                                        if (typeof val === 'string') {
                                                            parsedArr = JSON.parse(val.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/'/g, '"'));
                                                        } else {
                                                            parsedArr = val;
                                                        }
                                                    } catch(e) {}
                                                }

                                                return (
                                                    <td key={h} title={typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h] ?? '')}>
                                                        {isNestedArr && Array.isArray(parsedArr) && parsedArr.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {parsedArr.map((item, arrIdx) => {
                                                                    const nameField = item.name1 || item.name || `Item ${arrIdx+1}`;
                                                                    const priceField = hl === 'addons' ? 'addon_price' : 'combo_price';
                                                                    const priceVal = item[priceField] !== undefined ? item[priceField] : 0;
                                                                    
                                                                    return (
                                                                        <div key={arrIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#f8fafc', padding: '2px 4px', borderRadius: '4px' }}>
                                                                            <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }} title={nameField}>{nameField}</span>
                                                                            {isBulkUpdateMode ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                    <input 
                                                                                        type="number" 
                                                                                        value={priceVal} 
                                                                                        onChange={(e) => handleNestedArrayEdit(activeTable, row.originalIdx, h, arrIdx, priceField, e.target.value)}
                                                                                        style={{ width: '50px', padding: '2px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fef9c3', outline: 'none' }}
                                                                                    />
                                                                                    <button type="button" onClick={() => handleNestedArrayRemove(activeTable, row.originalIdx, h, arrIdx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }} title="Remove item">
                                                                                        <FaTimes />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{priceVal}</span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : isEditable ? (
                                                            <input
                                                                type="text"
                                                                value={row[h] || ''}
                                                                onChange={(e) => handleCellEdit(activeTable, row.originalIdx, h, e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    minWidth: '80px',
                                                                    padding: '0.25rem',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '4px',
                                                                    background: '#fef9c3',
                                                                    outline: 'none',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            />
                                                        ) : (
                                                            typeof row[h] === 'object' ?
                                                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{Array.isArray(row[h]) ? `[${row[h].length}]` : '{obj}'}</span>
                                                                : String(row[h] ?? '')
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td>
                                                <button className="row-btn" onClick={() => handleDeleteRow(activeTable, row.originalIdx)}><FaTrash /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportDataPage;