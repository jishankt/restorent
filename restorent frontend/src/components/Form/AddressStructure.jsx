import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft, FaTimes, FaMapMarkerAlt, FaEdit, FaTrash, FaSearch, FaCogs, FaChevronDown, FaCheckCircle, FaExclamationCircle, FaPlus } from 'react-icons/fa';
import { checkIsAdmin } from "../../utils/authUtils";
import CustomerCustomizationModal from "./CustomerCustomizationModal";

// Reusing SearchableSelect pattern
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
    const [search, setSearch] = useState(value || '');
    const [showList, setShowList] = useState(false);
    useEffect(() => {
        setSearch(value || '');
    }, [value]);
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(search.toLowerCase())
    );
    const handleInputChange = (e) => {
        const newSearch = e.target.value;
        setSearch(newSearch);
        if (!showList) {
            setShowList(true);
        }
        if (allowCreateNew && !onAddNewValue && !onCreateRequest) {
            if (onChange) onChange(newSearch);
        }
    };
    const handleSelectOption = (option) => {
        setSearch(option);
        if (onChange) {
            onChange(option);
        }
        setShowList(false);
    };
    const handleCreateNewOption = async () => {
        if (onCreateRequest) {
            onCreateRequest(search);
            setShowList(false);
            return;
        }
        if (onAddNewValue) {
            if (!search.trim()) {
                setShowList(false);
                return;
            }
            const success = await onAddNewValue(search);
            if (success) {
                setSearch(search);
                if (onChange) {
                    onChange(search);
                }
                setShowList(false);
            }
        }
    };
    const handleFocus = () => {
        setShowList(true);
    };
    const handleBlur = () => {
        setTimeout(() => {
            setShowList(false);
        }, 200);
    };
    return (
        <div className="searchable-select">
            <input
                type="text"
                value={search}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
            />
            {showList && (
                <ul className="searchable-list">
                    {allowCreateNew && (onAddNewValue || onCreateRequest) && (
                        (() => {
                            const isExactMatch = filteredOptions.some(option => option.toLowerCase() === search.toLowerCase());
                            const hasSearch = !!search.trim();
                            if ((onCreateRequest && !isExactMatch) || (onAddNewValue && hasSearch && !isExactMatch)) {
                                // Prioritize Create New
                                let createText;
                                if (hasSearch) {
                                    createText = createNewLabel ? `Create New ${createNewLabel}: "${search.trim()}"` : `Create New: "${search.trim()}"`;
                                } else {
                                    createText = createNewLabel ? `Create New ${createNewLabel}` : `Create New`;
                                }

                                return (
                                    <li
                                        key="create-new"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCreateNewOption();
                                        }}
                                        style={{ fontStyle: 'italic', color: '#007bff' }}
                                    >
                                        {createText}
                                    </li>
                                );
                            }
                            return null;
                        })()
                    )}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectOption(option);
                                }}
                            >
                                {option}
                            </li>
                        ))
                    ) : (
                        !allowCreateNew && <li className="no-options">No matching options</li>
                    )}
                </ul>
            )}
        </div>
    );
};

// CustomizeDropdown component removed - inline CustomerCustomizationModal integrated instead

const AddressStructure = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [baseUrl, setBaseUrl] = useState("");
    const [addressStructure, setAddressStructure] = useState({
        structure: { countries: {} },
        linkedValues: {}
    });

    // State for permissions
    const [canWrite, setCanWrite] = useState(false);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const role = user.role;
                    if (role) {
                        const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${role}` : `/api/role-permissions?role=${role}`;
                        const response = await axios.get(url);
                        const perms = response.data.permissions || [];
                        const pagePerm = perms.find(p => p.pageId === 'address_structure');
                        if (pagePerm) {
                            setCanWrite(pagePerm.canWrite === true);
                            setCanDelete(pagePerm.canDelete === true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching permissions:", error);
            }
        };
        fetchPermissions();
    }, [baseUrl]);

    // Selection State
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedValues, setSelectedValues] = useState({}); // { field1: '...', field2: '...' }

    // DocType State
    const [doctypeFields, setDoctypeFields] = useState([]);
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);

    // Modal State for Adding
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalField, setModalField] = useState('');
    const [modalValue, setModalValue] = useState('');
    const [modalOnSave, setModalOnSave] = useState(null);

    // Modal State for Editing
    const [showEditModal, setShowEditModal] = useState(false);
    const [editField, setEditField] = useState('');
    const [editValue, setEditValue] = useState('');
    const [editOriginalValue, setEditOriginalValue] = useState('');
    const [countrySearch, setCountrySearch] = useState("");

    // New Modal State for Label Editing
    const [showLabelEditModal, setShowLabelEditModal] = useState(false);
    const [editingCountry, setEditingCountry] = useState("");
    const [labelEdits, setLabelEdits] = useState({}); // { field1: "...", ... }

    const [warningMessage, setWarningMessage] = useState("");
    const [warningType, setWarningType] = useState("warning");

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Derived Field IDs from DocType
    const fieldIds = doctypeFields.length > 0
        ? doctypeFields
            .map(f => f.id)
            .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
            .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
        : ['field1', 'field2', 'field3'];

    const sortedFieldIds = Array.from(new Set(fieldIds)).sort((a, b) => {
        const numA = parseInt(a.replace('field', ''));
        const numB = parseInt(b.replace('field', ''));
        return numA - numB;
    });

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

    useEffect(() => {
        const fetchConfig = async () => {
            let currentBaseUrl = "";
            try {
                const response = await axios.get("/api/network_info");
                const { config: appConfig } = response.data;
                if (appConfig.mode === "client") {
                    currentBaseUrl = `http://${appConfig.server_ip}:6034`;
                    setBaseUrl(currentBaseUrl);
                } else {
                    setBaseUrl("");
                }
            } catch (error) {
                setBaseUrl("");
            } finally {
                fetchAddressStructure(currentBaseUrl || "");
                fetchDoctype(currentBaseUrl || "");
            }
        };
        fetchConfig();
    }, []);

    const fetchAddressStructure = async (currentBaseUrl = baseUrl) => {
        try {
            const res = await axios.get(`${currentBaseUrl}/api/address-structures`);
            setAddressStructure(res.data);
        } catch (e) {
            console.error("Failed to fetch structure:", e);
        }
    };

    const fetchDoctype = async (currentBaseUrl = baseUrl) => {
        try {
            const res = await axios.get(`${currentBaseUrl}/api/doctypes/Address Structure`);
            setDoctypeFields(res.data.fields || []);
        } catch (e) {
            console.error("Failed to fetch doctype:", e);
        }
    };

    const getFieldHidden = (id, defaultValue = false) => {
        const field = doctypeFields.find(f => f.id === id);
        return field ? field.hidden : defaultValue;
    };

    const getAddressLabels = (country) => {
        if (!country) return {};
        const hierarchyLabels = countryAddressHierarchy[country] || [];
        const dynamicCountry = addressStructure.structure?.countries?.[country];

        const labels = {};
        const fieldsToProcess = doctypeFields.length > 0
            ? doctypeFields
                .map(f => f.id)
                .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
                .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
            : ['field1', 'field2', 'field3'];

        // Remove duplicates and sort
        const fieldIds = Array.from(new Set(fieldsToProcess)).sort((a, b) => {
            const numA = parseInt(a.replace('field', ''));
            const numB = parseInt(b.replace('field', ''));
            return numA - numB;
        });

        fieldIds.forEach((fid, idx) => {
            if (getFieldHidden(fid)) {
                labels[fid] = "";
                return;
            }
            if (dynamicCountry?.[fid]?.label) {
                labels[fid] = dynamicCountry[fid].label;
            } else if (hierarchyLabels[idx] && hierarchyLabels[idx] !== "N/A") {
                labels[fid] = hierarchyLabels[idx];
            } else {
                // If it's a custom country or no label is explicitly set, hide it
                labels[fid] = "";
            }
        });
        return labels;
    };

    const getOptionsForField = (field, country, parentValue = null) => {
        const dynamicCountry = addressStructure.structure.countries[country];
        if (!dynamicCountry) return [];

        const globalOpts = dynamicCountry[field]?.values || [];
        let linkedOpts = [];

        if (parentValue && addressStructure.linkedValues[country] && addressStructure.linkedValues[country][parentValue]) {
            linkedOpts = addressStructure.linkedValues[country][parentValue][field] || [];
        }

        const allOpts = new Set([...linkedOpts, ...globalOpts]);
        return Array.from(allOpts).sort();
    };

    const handleAddNewAddressValue = async (field, newValue) => {
        let countryToUse = selectedCountry;
        if (field === 'country') {
            countryToUse = newValue;
        }

        if (!countryToUse && field !== 'country') return false;

        let parent_value = '';
        if (field !== 'field1' && field.startsWith('field')) {
            const fieldNum = parseInt(field.replace('field', ''));
            const parentField = `field${fieldNum - 1}`;
            parent_value = selectedValues[parentField];
        }

        try {
            const res = await axios.post(`${baseUrl}/api/add-address-value`, {
                country: countryToUse,
                field,
                value: newValue,
                parent_value: parent_value || undefined
            });
            if (res.status === 200) {
                setWarningMessage(`Successfully added ${newValue}`);
                setWarningType("success");

                // Optimistic Update
                setAddressStructure((prev) => {
                    const newStruct = {
                        structure: { ...prev.structure },
                        linkedValues: { ...prev.linkedValues },
                    };
                    const countryData = newStruct.structure.countries[countryToUse] || (newStruct.structure.countries[countryToUse] = {});

                    if (field === "country") {
                        // Initialize labels for the new country
                        const hierarchy = countryAddressHierarchy[newValue] || [];
                        sortedFieldIds.forEach((fid, idx) => {
                            if (!countryData[fid]) {
                                let label = hierarchy[idx] || "";
                                if (label === "N/A") label = "";
                                countryData[fid] = { label, values: [] };
                            }
                        });
                    } else if (field.startsWith('field')) {
                        if (!countryData[field]) countryData[field] = { values: [] };
                        if (!countryData[field].values.includes(newValue)) countryData[field].values.push(newValue);
                    }

                    if (field.startsWith('field') && field !== 'field1' && parent_value) {
                        const linkedCountry = newStruct.linkedValues[countryToUse] || (newStruct.linkedValues[countryToUse] = {});
                        const parentData = linkedCountry[parent_value] || (linkedCountry[parent_value] = {});
                        if (!parentData[field]) parentData[field] = [];
                        if (!parentData[field].includes(newValue)) parentData[field] = [newValue, ...parentData[field]];
                    }
                    return newStruct;
                });
                return true;
            }
        } catch (e) {
            console.error(e);
            setWarningMessage("Failed to add value");
            setWarningType("warning");
            return false;
        }
        return false;
    };

    const handleDeleteValue = (field, value) => {
        if (!canDelete) {
            setWarningMessage("You do not have permission to delete address values.");
            setWarningType("warning");
            return;
        }
        setDeleteTarget({ field, value });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const { field, value } = deleteTarget;

        let parent_value = '';
        const fieldNum = parseInt(field.replace('field', ''));
        if (fieldNum > 1) {
            parent_value = selectedValues[`field${fieldNum - 1}`];
        }

        try {
            const res = await axios.post(`${baseUrl}/api/delete-address-value`, {
                country: selectedCountry,
                field,
                value,
                parent_value: parent_value || undefined
            });

            if (res.status === 200) {
                setWarningMessage(`${value} deleted successfully`);
                setWarningType("success");

                setAddressStructure((prev) => {
                    const newStruct = {
                        structure: { ...prev.structure },
                        linkedValues: { ...prev.linkedValues },
                    };

                    const removeItem = (arr, val) => arr ? arr.filter(item => item !== val) : [];

                    // Update Global Structure
                    const countryData = newStruct.structure.countries[selectedCountry];
                    if (countryData && field.startsWith('field')) {
                        if (countryData[field]?.values) {
                            countryData[field].values = removeItem(countryData[field].values, value);
                        }
                    }

                    // Update Linked Values
                    if (field.startsWith('field') && field !== 'field1' && parent_value) {
                        const linkedCountry = newStruct.linkedValues[selectedCountry];
                        if (linkedCountry && linkedCountry[parent_value]?.[field]) {
                            linkedCountry[parent_value][field] = removeItem(linkedCountry[parent_value][field], value);
                        }
                    }
                    return newStruct;
                });

                const newVals = { ...selectedValues };
                if (newVals[field] === value) {
                    newVals[field] = "";
                    for (let i = fieldNum; i < activeFieldIds.length; i++) {
                        newVals[activeFieldIds[i]] = "";
                    }
                }
                setSelectedValues(newVals);
            }
        } catch (e) {
            console.error(e);
            setWarningMessage("Failed to delete value");
            setWarningType("danger");
        } finally {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        }
    };

    const handleOpenEditModal = (field, value) => {
        if (!canWrite) {
            setWarningMessage("You do not have permission to edit address values.");
            setWarningType("warning");
            return;
        }
        setEditField(field);
        setEditValue(value);
        setEditOriginalValue(value);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editValue.trim() || editValue === editOriginalValue) {
            setShowEditModal(false);
            return;
        }

        try {
            const res = await axios.put(`${baseUrl}/api/address-structures`, {
                ...addressStructure,
                structure: {
                    ...addressStructure.structure,
                    countries: {
                        ...addressStructure.structure.countries,
                        [selectedCountry]: {
                            ...addressStructure.structure.countries[selectedCountry],
                            [editField]: {
                                ...addressStructure.structure.countries[selectedCountry][editField],
                                values: addressStructure.structure.countries[selectedCountry][editField].values.map(v => v === editOriginalValue ? editValue : v)
                            }
                        }
                    }
                }
            });

            if (res.status === 200) {
                setWarningMessage(`Updated successfully`);
                setWarningType("success");
                await fetchAddressStructure();
            }
        } catch (e) {
            console.error(e);
            setWarningMessage("Failed to update value");
            setWarningType("danger");
        }
        setShowEditModal(false);
    };

    const handleEditLabels = (country) => {
        const data = addressStructure.structure.countries[country];
        setEditingCountry(country);
        const edits = {};
        sortedFieldIds.forEach(id => {
            edits[id] = data[id]?.label || "";
        });
        setLabelEdits(edits);
        setShowLabelEditModal(true);
    };

    const handleSaveLabels = async () => {
        try {
            const updatedCountryData = { ...addressStructure.structure.countries[editingCountry] };
            Object.keys(labelEdits).forEach(fid => {
                updatedCountryData[fid] = { ...updatedCountryData[fid], label: labelEdits[fid] };
            });

            const res = await axios.put(`${baseUrl}/api/address-structures`, {
                ...addressStructure,
                structure: {
                    ...addressStructure.structure,
                    countries: {
                        ...addressStructure.structure.countries,
                        [editingCountry]: updatedCountryData
                    }
                }
            });
            if (res.status === 200) {
                setWarningMessage("Labels updated successfully");
                setWarningType("success");
                await fetchAddressStructure();
                setShowLabelEditModal(false);
            }
        } catch (e) {
            console.error(e);
            setWarningMessage("Failed to update labels");
            setWarningType("danger");
        }
    };

    const handleOpenAddModal = (field, initialSearch) => {
        if (!canWrite) {
            setWarningMessage("You do not have permission to add address values.");
            setWarningType("warning");
            return;
        }
        setModalField(field);
        setModalValue(initialSearch);
        setModalOnSave(() => (newValue) => handleAddNewAddressValue(field, newValue));
        setShowAddModal(true);
    };

    const labels = getAddressLabels(selectedCountry);
    // Filter out fields that don't have a label defined for this country
    const activeFieldIds = sortedFieldIds.filter(fid => labels[fid] && labels[fid].trim() !== "");

    const handleSaveModal = async () => {
        const values = modalValue.split(',').map(v => v.trim()).filter(v => v);
        if (values.length === 0) {
            setShowAddModal(false);
            return;
        }
        if (modalOnSave) {
            let allSuccess = true;
            for (const val of values) {
                const success = await modalOnSave(val);
                if (!success) allSuccess = false;
            }
            if (allSuccess) {
                if (modalField === 'country') setSelectedCountry(values[0]);
                else if (modalField.startsWith('field')) {
                    const newVals = { ...selectedValues, [modalField]: values[0] };
                    // Reset children
                    const fieldNum = parseInt(modalField.replace('field', ''));
                    activeFieldIds.forEach((fid, idx) => {
                        if (idx > activeFieldIds.indexOf(modalField)) {
                            newVals[fid] = "";
                        }
                    });
                    setSelectedValues(newVals);
                }
            }
        }
        setShowAddModal(false);
    };

    const countryList = Array.from(new Set([
        ...Object.keys(countryAddressHierarchy),
        ...Object.keys(addressStructure.structure?.countries || {})
    ])).sort();

    const fieldOptionsMap = {};
    activeFieldIds.forEach((fid, idx) => {
        if (idx === 0) {
            fieldOptionsMap[fid] = selectedCountry ? getOptionsForField(fid, selectedCountry) : [];
        } else {
            const parentFid = activeFieldIds[idx - 1];
            fieldOptionsMap[fid] = (selectedCountry && selectedValues[parentFid]) ? getOptionsForField(fid, selectedCountry, selectedValues[parentFid]) : [];
        }
    });

    return (
        <div className="address-structure-container">
            {/* Elegant Static Top Header */}
            <div className="customer-header-section">
                <div className="header-left">
                    <button onClick={() => navigate("/admin")} className="header-back-btn">
                        <FaArrowLeft /> Back to Admin
                    </button>
                </div>

                <div className="header-center">
                    <h1>Address Structure Hierarchy</h1>
                </div>

                <div className="header-right">
                    <div className="header-actions">
                        {checkIsAdmin(JSON.parse(localStorage.getItem('user') || '{}')) && (
                            <button 
                                type="button"
                                onClick={() => setShowCustomizeModal(true)}
                                className="premium-customize-btn"
                            >
                                <FaCogs /> Customize Fields
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Dashboard Body */}
            <div className="address-structure-body">
                {/* Main Content Dashboard Card */}
                <div className="addr-main-card">

                {/* Country Search and Actions Row */}
                <div className="addr-controls-row">
                    <div className="addr-search-wrapper">
                        <FaSearch className="addr-search-icon" />
                        <input
                            type="text"
                            placeholder="Search Country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="addr-search-input"
                        />
                    </div>
                    {!getFieldHidden('country') && (
                        <button
                            onClick={() => handleOpenAddModal('country', '')}
                            className="premium-add-btn"
                        >
                            <FaPlus /> Add Country
                        </button>
                    )}
                </div>

                {/* Alerts Banner */}
                {warningMessage && (
                    <div className={`addr-alert-banner alert-${warningType}`} role="alert">
                        <span className="addr-alert-icon">
                            {warningType === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                        </span>
                        <span className="addr-alert-text">{warningMessage}</span>
                        <button type="button" className="addr-alert-close" onClick={() => setWarningMessage("")}>
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Modals Section */}
                {showAddModal && (
                    <div className="addr-modal-overlay">
                        <div className="addr-modal">
                            <div className="addr-modal-header">
                                <span>Add New {modalField === 'country' ? 'Country' : labels[modalField] || modalField}</span>
                                <button className="addr-close-modal-btn" onClick={() => setShowAddModal(false)}><FaTimes /></button>
                            </div>
                            <div className="addr-modal-body">
                                <input
                                    type="text"
                                    value={modalValue}
                                    onChange={(e) => setModalValue(e.target.value)}
                                    placeholder="Enter value (comma separated for multiple)"
                                    autoFocus
                                    className="addr-modal-input"
                                />
                            </div>
                            <div className="addr-modal-footer">
                                <button className="addr-modal-cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button className="addr-modal-save-btn" onClick={handleSaveModal}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div className="addr-modal-overlay">
                        <div className="addr-modal">
                            <div className="addr-modal-header">
                                <span>Edit Value</span>
                                <button className="addr-close-modal-btn" onClick={() => setShowEditModal(false)}><FaTimes /></button>
                            </div>
                            <div className="addr-modal-body">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="Enter new value"
                                    autoFocus
                                    className="addr-modal-input"
                                />
                            </div>
                            <div className="addr-modal-footer">
                                <button className="addr-modal-cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button className="addr-modal-save-btn" onClick={handleSaveEdit}>Update</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Columns Grid */}
                <div className="addr-columns-grid" style={{
                    gridTemplateColumns: `repeat(${Math.min(activeFieldIds.length + 1, 5)}, minmax(260px, 1fr))`
                }}>
                    {/* Country Selector Column */}
                    <div className="addr-col-card">
                        <div className="addr-col-header">
                            <h4>Country</h4>
                            <span className="addr-col-badge">{countryList.length}</span>
                        </div>
                        <div className="addr-col-body">
                            <SearchableSelect
                                options={countryList}
                                value={selectedCountry}
                                onChange={(val) => {
                                    setSelectedCountry(val);
                                    setSelectedValues({});
                                }}
                                placeholder="Select Country"
                                allowCreateNew={true}
                                onCreateRequest={(val) => handleOpenAddModal('country', val)}
                                createNewLabel="Country"
                            />
                        </div>
                        <div className="addr-col-footer-hint">
                            Select a country to view hierarchy structures
                        </div>
                    </div>

                    {/* Hierarchy Children Columns */}
                    {activeFieldIds.map((fid, index) => {
                        const options = fieldOptionsMap[fid] || [];
                        const label = labels[fid];
                        const isFirstField = index === 0;
                        const parentFid = !isFirstField ? activeFieldIds[index - 1] : null;
                        const isParentSelected = isFirstField || (parentFid && selectedValues[parentFid]);

                        return (
                            <div 
                                key={fid} 
                                className={`addr-col-card ${(!selectedCountry || !isParentSelected) ? 'disabled' : ''}`}
                            >
                                <div className="addr-col-header">
                                    <h4>{label}</h4>
                                    <span className="addr-col-badge">{options.length}</span>
                                </div>

                                <div className="addr-col-body">
                                    <SearchableSelect
                                        options={options}
                                        value={selectedValues[fid] || ""}
                                        onChange={(val) => {
                                            const newVals = { ...selectedValues, [fid]: val };
                                            // Reset children
                                            for (let i = index + 1; i < activeFieldIds.length; i++) {
                                                newVals[activeFieldIds[i]] = "";
                                            }
                                            setSelectedValues(newVals);
                                        }}
                                        placeholder={`Select ${label}`}
                                        allowCreateNew={!!(selectedCountry && isParentSelected)}
                                        onCreateRequest={(val) => handleOpenAddModal(fid, val)}
                                        createNewLabel={label}
                                        disabled={!isParentSelected}
                                    />
                                </div>

                                {selectedCountry && isParentSelected && (
                                    <div className="addr-list-scroll custom-scrollbar">
                                        <h6 className="addr-list-title">Existing List</h6>
                                        <ul className="addr-items-list">
                                            {options.map((opt, i) => (
                                                <li 
                                                    key={i} 
                                                    className={`addr-list-item-row ${selectedValues[fid] === opt ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        const newVals = { ...selectedValues, [fid]: opt };
                                                        for (let j = index + 1; j < activeFieldIds.length; j++) {
                                                            newVals[activeFieldIds[j]] = "";
                                                        }
                                                        setSelectedValues(newVals);
                                                    }}
                                                >
                                                    <span className="addr-item-text">{opt}</span>
                                                    <div className="addr-actions-cell" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleOpenEditModal(fid, opt)}
                                                            className="addr-action-btn addr-edit-btn"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteValue(fid, opt)}
                                                            className="addr-action-btn addr-delete-btn"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                            {options.length === 0 && (
                                                <li className="addr-empty-item">
                                                    {!isParentSelected ? "Select parent first." : "No items yet."}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Country List & Label Definitions Section */}
                <div className="addr-countries-section">
                    <h3 className="addr-section-subtitle">
                        Registered Countries & Label Configurations
                    </h3>
                    <div className="addr-countries-cards-grid">
                        {Object.keys(addressStructure.structure?.countries || {})
                            .sort()
                            .filter(country => country.toLowerCase().includes(countrySearch.toLowerCase()))
                            .map(country => {
                                const data = addressStructure.structure.countries[country];
                                return (
                                    <div key={country} className="addr-country-info-card">
                                        <div className="addr-country-info-header">
                                            <h4>{country}</h4>
                                            <button
                                                onClick={() => {
                                                    setSelectedCountry(country);
                                                    setSelectedValues({});
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="addr-country-select-badge-btn"
                                            >
                                                Select Country
                                            </button>
                                        </div>
                                        <div className="addr-country-info-body">
                                            {sortedFieldIds.map(fid => {
                                                const label = data[fid]?.label;
                                                if (!label || label === "N/A" || label === "None") return null;
                                                return (
                                                    <div key={fid} className="addr-country-label-row">
                                                        <span className="field-name">{fid.replace('field', 'Field ').replace('_', ' ').trim()}:</span>
                                                        <strong className="field-label-text">{label}</strong>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="addr-country-info-footer">
                                            <button
                                                onClick={() => handleEditLabels(country)}
                                                className="addr-country-labels-edit-btn"
                                            >
                                                <FaEdit /> Edit Labels
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>

            {/* Label Edit Modal */}
            {showLabelEditModal && (
                <div className="addr-modal-overlay">
                    <div className="addr-modal addr-label-modal">
                        <div className="addr-modal-header">
                            <span>Edit Labels for {editingCountry}</span>
                            <button className="addr-close-modal-btn" onClick={() => setShowLabelEditModal(false)}><FaTimes /></button>
                        </div>
                        <div className="addr-modal-body addr-modal-body-scrollable custom-scrollbar">
                            {sortedFieldIds.map((fid, index) => (
                                <div className="addr-modal-field-group" key={fid}>
                                    <label className="addr-modal-label">{fid.replace('field', 'Field ').replace('_', ' ').trim()} Label</label>
                                    <input
                                        type="text"
                                        className="addr-modal-input"
                                        value={labelEdits[fid] || ""}
                                        onChange={(e) => setLabelEdits({ ...labelEdits, [fid]: e.target.value })}
                                        placeholder={`E.g., ${fid === 'field1' ? 'Province' : fid === 'field2' ? 'District' : 'City'}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="addr-modal-footer">
                            <button className="addr-modal-cancel-btn" onClick={() => setShowLabelEditModal(false)}>Cancel</button>
                            <button className="addr-modal-save-btn" onClick={handleSaveLabels}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="addr-modal-overlay">
                    <div className="addr-modal addr-delete-confirm-modal">
                        <div className="addr-modal-body" style={{ textAlign: 'center', padding: '35px 25px 25px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: '#fef2f2',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#ef4444',
                                fontSize: '24px',
                                margin: '0 auto 20px'
                            }}>
                                <FaExclamationCircle />
                            </div>
                            <h4 style={{ margin: '0 0 10px', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Confirm Deletion</h4>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                                Are you sure you want to delete <strong>{deleteTarget?.value}</strong>? This action will permanently remove this item and cannot be undone.
                            </p>
                        </div>
                        <div className="addr-modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                                className="addr-modal-cancel-btn"
                                style={{ flex: 1 }}
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="addr-modal-save-btn"
                                style={{ flex: 1, background: '#ef4444' }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inline CustomerCustomizationModal Layout Manager */}
            <CustomerCustomizationModal 
                isOpen={showCustomizeModal}
                onClose={() => setShowCustomizeModal(false)}
                onRefresh={fetchDoctype}
                targetDocType="Address Structure"
            />

            {/* Premium Vanilla CSS Stylesheet */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');

                .address-structure-container {
                    height: 100vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    box-sizing: border-box;
                    color: #0f172a;
                    background-color: #f8fafc;
                }

                /* Static Top Header Styles */
                .customer-header-section {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 20px 5%;
                    gap: 20px;
                    background: #ffffff;
                    z-index: 2000;
                    border-bottom: 1px solid #e2e8f0;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    box-sizing: border-box;
                }
                .header-left, .header-right {
                    flex: 1;
                    display: flex;
                }
                .header-left {
                    justify-content: flex-start;
                }
                .header-right {
                    justify-content: flex-end;
                }
                .header-center {
                    flex: 2;
                    display: flex;
                    justify-content: center;
                }
                .customer-header-section h1 {
                    font-size: 28px;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.03em;
                    margin: 0;
                    white-space: nowrap;
                    font-family: 'Outfit', 'Inter', sans-serif;
                }
                .header-back-btn {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    padding: 10px 24px;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                    font-family: 'Outfit', 'Inter', sans-serif;
                }
                .header-back-btn:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    transform: translateX(-5px);
                    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.1);
                }
                .header-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                /* Customize Fields green button */
                .premium-customize-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 50px;
                    border: none;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.3);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: 'Outfit', 'Inter', sans-serif;
                }
                .premium-customize-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 25px -4px rgba(16, 185, 129, 0.45);
                    filter: brightness(1.05);
                }

                /* Scrollable Dashboard Body */
                .address-structure-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px 5%;
                    background: radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-sizing: border-box;
                }

                /* Main Dashboard Wrapper Card */
                .addr-main-card {
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto 20px;
                    background-color: #ffffff;
                    border-radius: 30px;
                    box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.05);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    padding: 45px;
                    box-sizing: border-box;
                }

                /* Controls Layout (Search country) */
                .addr-controls-row {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .addr-search-wrapper {
                    position: relative;
                    flex: 1;
                    max-width: 320px;
                }
                .addr-search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 15px;
                }
                .addr-search-input {
                    width: 100%;
                    padding: 12px 18px 12px 46px;
                    border-radius: 14px;
                    border: 1.5px solid #e2e8f0;
                    outline: none;
                    font-size: 14px;
                    font-weight: 600;
                    background: #f8fafc;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }
                .addr-search-input:focus {
                    background: #ffffff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }

                /* Add Country button style */
                .premium-add-btn {
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.3);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-add-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 25px -4px rgba(59, 130, 246, 0.45);
                    filter: brightness(1.05);
                }

                /* Alerts Banner */
                .addr-alert-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 24px;
                    border-radius: 16px;
                    margin-bottom: 30px;
                    font-weight: 600;
                    font-size: 14px;
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1.5px solid transparent;
                }
                .addr-alert-banner.alert-success {
                    background-color: #ecfdf5;
                    border-color: #a7f3d0;
                    color: #065f46;
                }
                .addr-alert-banner.alert-warning {
                    background-color: #fffbeb;
                    border-color: #fde68a;
                    color: #92400e;
                }
                .addr-alert-banner.alert-danger {
                    background-color: #fef2f2;
                    border-color: #fecdd3;
                    color: #991b1b;
                }
                .addr-alert-icon {
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                }
                .addr-alert-text {
                    flex: 1;
                }
                .addr-alert-close {
                    background: none;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .addr-alert-close:hover {
                    opacity: 1;
                }

                /* Modern Glass columns grid layout */
                .addr-columns-grid {
                    display: grid;
                    gap: 24px;
                    overflow-x: auto;
                    padding-bottom: 25px;
                    margin-bottom: 20px;
                    align-items: start;
                }

                /* Columns Cards styling */
                .addr-col-card {
                    background: #ffffff;
                    padding: 30px 24px;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.04);
                    border: 1.5px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    min-height: 480px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .addr-col-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 35px -12px rgba(15, 23, 42, 0.08);
                    border-color: #cbd5e1;
                }
                .addr-col-card.disabled {
                    opacity: 0.55;
                    pointer-events: none;
                    background: #f8fafc;
                    border-color: #f1f5f9;
                    box-shadow: none;
                }
                .addr-col-card.disabled:hover {
                    transform: none;
                }

                .addr-col-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 16px;
                    margin-bottom: 20px;
                }
                .addr-col-header h4 {
                    margin: 0;
                    color: #0f172a;
                    font-weight: 800;
                    font-size: 17px;
                    text-transform: capitalize;
                }
                .addr-col-badge {
                    background-color: #eff6ff;
                    color: #3b82f6;
                    padding: 4px 12px;
                    border-radius: 30px;
                    font-size: 12px;
                    font-weight: 700;
                    border: 1.5px solid #dbeafe;
                    transition: all 0.2s ease;
                }
                .addr-col-card.disabled .addr-col-badge {
                    background-color: #f1f5f9;
                    color: #94a3b8;
                    border-color: #e2e8f0;
                }

                .addr-col-body {
                    margin-bottom: 20px;
                }

                .addr-col-footer-hint {
                    margin-top: auto;
                    font-size: 13px;
                    color: #94a3b8;
                    text-align: center;
                    font-weight: 600;
                    padding-top: 15px;
                }

                /* Scrollable List within columns */
                .addr-list-scroll {
                    flex: 1;
                    max-height: 380px;
                    overflow-y: auto;
                    padding-right: 6px;
                }
                .addr-list-title {
                    font-size: 12px;
                    color: #94a3b8;
                    margin: 0 0 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 800;
                }
                .addr-items-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                /* Existing List Item row */
                .addr-list-item-row {
                    padding: 12px 16px;
                    border-radius: 14px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    background: #f8fafc;
                    border: 1.5px solid #f1f5f9;
                }
                .addr-list-item-row:hover {
                    background-color: #eff6ff;
                    border-color: #dbeafe;
                    transform: translateX(4px);
                }
                .addr-list-item-row.selected {
                    background-color: #eff6ff;
                    border-color: #3b82f6;
                }
                .addr-item-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 600;
                    color: #334155;
                    transition: color 0.2s;
                }
                .addr-list-item-row.selected .addr-item-text {
                    color: #2563eb;
                    font-weight: 700;
                }

                /* Action buttons in items row */
                .addr-actions-cell {
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .addr-list-item-row:hover .addr-actions-cell {
                    opacity: 1;
                }
                .addr-action-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: #ffffff;
                }
                .addr-edit-btn {
                    color: #d97706;
                }
                .addr-edit-btn:hover {
                    background: #fef3c7;
                    border-color: #f59e0b;
                    transform: scale(1.1) translateY(-1px);
                }
                .addr-delete-btn {
                    color: #ef4444;
                }
                .addr-delete-btn:hover {
                    background: #fef2f2;
                    border-color: #ef4444;
                    transform: scale(1.1) translateY(-1px);
                }

                /* Empty indicator style */
                .addr-empty-item {
                    padding: 24px;
                    text-align: center;
                    color: #94a3b8;
                    font-style: italic;
                    background: #f8fafc;
                    border: 1.5px dashed #e2e8f0;
                    border-radius: 14px;
                    font-size: 13px;
                    font-weight: 600;
                }

                /* Registered Countries details cards section */
                .addr-countries-section {
                    margin-top: 60px;
                    border-top: 2px solid #f1f5f9;
                    padding-top: 45px;
                }
                .addr-section-subtitle {
                    color: #0f172a;
                    font-size: 22px;
                    font-weight: 800;
                    margin-bottom: 30px;
                }
                .addr-countries-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }

                /* Indiv Country Card */
                .addr-country-info-card {
                    padding: 25px;
                    border-radius: 24px;
                    background-color: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.04);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .addr-country-info-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 35px -12px rgba(15, 23, 42, 0.08);
                    border-color: #cbd5e1;
                }

                .addr-country-info-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1.5px solid #f1f5f9;
                }
                .addr-country-info-header h4 {
                    margin: 0;
                    color: #2563eb;
                    font-size: 19px;
                    font-weight: 800;
                }
                .addr-country-select-badge-btn {
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 700;
                    background-color: #eff6ff;
                    color: #3b82f6;
                    border: 1.5px solid #dbeafe;
                    border-radius: 30px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .addr-country-select-badge-btn:hover {
                    background-color: #3b82f6;
                    color: #ffffff;
                    border-color: #3b82f6;
                }

                .addr-country-info-body {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                .addr-country-label-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .field-name {
                    color: #64748b;
                    font-weight: 600;
                }
                .field-label-text {
                    color: #1e293b;
                    font-weight: 700;
                    background: #f8fafc;
                    padding: 3px 10px;
                    border-radius: 8px;
                    border: 1px solid #f1f5f9;
                }

                .addr-country-info-footer {
                    margin-top: auto;
                }
                .addr-country-labels-edit-btn {
                    width: 100%;
                    padding: 10px;
                    background-color: #f59e0b;
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
                    transition: all 0.2s ease;
                }
                .addr-country-labels-edit-btn:hover {
                    background-color: #d97706;
                    box-shadow: 0 6px 15px rgba(217, 119, 6, 0.35);
                    transform: translateY(-1px);
                }

                /* Glassmorphic Overlay Modals */
                .addr-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.25s ease-out;
                }
                .addr-modal {
                    background: #ffffff;
                    border-radius: 28px;
                    width: 90%;
                    max-width: 440px;
                    overflow: hidden;
                    box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .addr-label-modal {
                    max-width: 520px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .addr-modal-header {
                    padding: 24px 30px;
                    border-bottom: 1.5px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 800;
                    color: #0f172a;
                    font-size: 18px;
                }
                .addr-close-modal-btn {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #94a3b8;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                }
                .addr-close-modal-btn:hover {
                    color: #0f172a;
                }

                .addr-modal-body {
                    padding: 30px;
                }
                .addr-modal-body-scrollable {
                    max-height: 420px;
                    overflow-y: auto;
                    padding-right: 15px;
                }

                .addr-modal-field-group {
                    margin-bottom: 20px;
                }
                .addr-modal-field-group:last-child {
                    margin-bottom: 0;
                }
                .addr-modal-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 800;
                    color: #64748b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .addr-modal-input {
                    width: 100%;
                    padding: 12px 18px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 14px;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.25s ease;
                    box-sizing: border-box;
                }
                .addr-modal-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }

                .addr-modal-footer {
                    padding: 24px 30px;
                    background: #f8fafc;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    border-top: 1.5px solid #f1f5f9;
                }

                .addr-modal-cancel-btn {
                    background: #ffffff;
                    color: #64748b;
                    border: 1.5px solid #e2e8f0;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .addr-modal-cancel-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .addr-modal-save-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                                .addr-modal-save-btn:hover {
                    background: #2563eb;
                }

                /* Searchable Select inside Columns */
                .searchable-select {
                    position: relative;
                    width: 100%;
                }
                .searchable-select input {
                    width: 100%;
                    padding: 14px 20px;
                    background-color: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                    outline: none;
                }
                .searchable-select input:focus {
                    border-color: #3b82f6;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .searchable-list {
                    position: absolute;
                    top: 100% !important;
                    left: 0;
                    right: 0;
                    background-color: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 16px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 2000;
                    list-style: none;
                    padding: 8px 0;
                    margin: 8px 0 0 0;
                    box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.1);
                    animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .searchable-list li {
                    padding: 12px 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    color: #334155;
                }
                .searchable-list li:hover {
                    background-color: #eff6ff;
                    color: #2563eb;
                    padding-left: 24px;
                }
                .searchable-list li.no-options {
                    color: #94a3b8;
                    cursor: default;
                    text-align: center;
                    font-style: italic;
                    padding: 15px;
                }

                /* Scrollbar overrides */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default AddressStructure;
