import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CurrencySymbol from '../CurrencySymbol';
import axios from "axios";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FaArrowLeft, FaSave, FaTimes, FaSearchPlus, FaSearchMinus, FaEdit, FaTrash, FaBox, FaColumns, FaCog, FaUtensils, FaChevronDown, FaCogs } from "react-icons/fa";
import { UserContext } from '../../Context/UserContext';
import Cropper from 'react-easy-crop';
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import "./CreateItemPage.css";
import CustomerCustomizationModal from "./CustomerCustomizationModal";

const CREATE_NEW_OPTION = { value: "create_new", label: "Create New" };

const Modal = ({ isOpen, onClose, children, title, className }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className={`modal ${className}`}>
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button className="close-button" onClick={onClose}>
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const SidePanel = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="side-panel-wrapper">
      <div className="side-panel-header">
        <h5 className="side-panel-title">{title}</h5>
        <button className="side-panel-close-btn" onClick={onClose} aria-label="Close panel">
          <FaTimes size={18} />
        </button>
      </div>
      <div className="side-panel-content">
        {children}
      </div>
    </div>
  );
};

const extractImageName = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("data:")) return imageUrl;
  const parts = imageUrl.split("/");
  return parts[parts.length - 1];
};

const getImageUrl = (image, baseUrl) => {
  if (!image) return "";
  if (image.startsWith("data:")) return image;
  return `${baseUrl}/api/images/${extractImageName(image)}`;
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImg = async (imageSrc, pixelCrop, targetWidth, targetHeight) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = targetWidth || pixelCrop.width
  canvas.height = targetHeight || pixelCrop.height

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg')
  })
}
const defaultColumnVisibility = {
  item: {
    item_code: true,
    item_name: true,
    item_group: true,
    price_list_rate: true,
    tax_applicable: true,
    has_offer: true,
    kitchen: true,
    image: true,
    multiple_images: true,
    ingredients: true,
    variants: true,
  },
  addons: {
    type: true,
    name: true,
    price: true,
    tax: true,
    kitchen: true,
    item_group: true,
    branches: true,
    companies: true,
    image: true,
    variants: true,
    ingredients: true,
  },
  combos: {
    type: true,
    name: true,
    price: true,
    tax: true,
    kitchen: true,
    item_group: true,
    branches: true,
    companies: true,
    image: true,
    variants: true,
    ingredients: true,
  }
};

const initialFormState = {
  item_code: "",
  item_name: "",
  item_group: "",
  price_list_rate: 0,
  tax_applicable: false,
  tax_rate: 0,
  excise_applicable: false,
  excise_rate: 0,
  has_offer: false,
  offer_price: "",
  offer_start_time: "",
  offer_end_time: "",
  image: "",
  images: [],
  custom_addon_applicable: false,
  custom_combo_applicable: false,
  custom_total_calories: 0,
  custom_total_protein: 0,
  kitchen: "",
  kitchen_value: "",
  selectedVariant: "",
  variants: {
    size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
    cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
    spicy: {
      enabled: false,
      is_spicy: false,
      spicy_price: 0,
      spicy_image: "",
      non_spicy_price: 0,
      non_spicy_image: "",
    },
    sugar: { enabled: false, level: "medium" },
  },
  custom_variants: [],
  addons: [],
  combos: [],
  ingredients: [
    { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
  ],
  columnVisibility: defaultColumnVisibility,
};

const normalize = (val) => (val || "").toString().toLowerCase().replace(/\s/g, '').trim();
const matchTenancy = (val1, val2) => {
  if (!val1 || !val2) return false;
  const n1 = normalize(val1);
  const n2 = normalize(val2);
  const masterLabels = ['all', 'global', 'any', 'allbranches'];
  if (masterLabels.includes(n1) || masterLabels.includes(n2)) return true;
  return n1 === n2;
};

const fieldLabels = {
  item: {
    item_code: "Item Code",
    item_name: "Item Name",
    item_group: "Item Group",
    price_list_rate: "Price",
    tax_applicable: "Tax Applicable",
    has_offer: "Has Offer",
    kitchen: "Kitchen",
    image: "Image",
    multiple_images: "Multiple Images",
    ingredients: "Ingredients",
    variants: "Variants"
  },
  addons: {
    type: "Addon Type",
    name: "Name",
    price: "Price",
    tax: "GST/VAT",
    kitchen: "Kitchen",
    item_group: "Item Group",
    branches: "Branch Assignment",
    companies: "Company Assignment",
    image: "Image",
    variants: "Variants",
    ingredients: "Ingredients"
  },
  combos: {
    type: "Combo Type",
    name: "Name",
    price: "Price",
    tax: "GST/VAT",
    kitchen: "Kitchen",
    item_group: "Item Group",
    branches: "Branch Assignment",
    companies: "Company Assignment",
    image: "Image",
    variants: "Variants",
    ingredients: "Ingredients"
  }
};

const CustomizeDropdown = ({ currentDocType, doctypeFields, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  // User requested to ONLY show Item, Addon, and Combo
  const allOptions = ["Item", "Addon", "Combo"];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="save-btn" style={{ backgroundColor: "#3b82f6", marginBottom: "15px" }}
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          background: 'rgb(46, 204, 113)',
          color: '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 15px',
          borderRadius: '10px',
          fontWeight: '600',
          cursor: 'pointer',
          height: '48px',
          boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)'
        }}
      >
        <FaCogs /> Customize <FaChevronDown style={{ fontSize: '12px', opacity: 0.8 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
          padding: '8px',
          zIndex: 2000,
          minWidth: '220px',
          animation: 'fadeIn 0.2s ease-out',
          textAlign: 'left'
        }}>
          <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>CONFIGURATIONS</div>
          {allOptions.map(opt => (
            <div
              key={opt}
              onMouseDown={() => {
                onSelect(opt);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: opt === currentDocType ? '#3b82f6' : '#475569',
                background: opt === currentDocType ? '#eff6ff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseOver={(e) => {
                if (opt !== currentDocType) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseOut={(e) => {
                if (opt !== currentDocType) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: opt === currentDocType ? '#3b82f6' : '#cbd5e1' }}></div>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateItemPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const source = queryParams.get('source');
  const isFromGallery = source === 'gallery';
  const isGalleryImport = source === 'gallery_import';
  const [formData, setFormData] = useState(initialFormState);
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [kitchenDoctypeFields, setKitchenDoctypeFields] = useState([]);
  const [itemGroupDoctypeFields, setItemGroupDoctypeFields] = useState([]);
  const [variantDoctypeFields, setVariantDoctypeFields] = useState([]);
  const [addonDoctypeFields, setAddonDoctypeFields] = useState([]);
  const [comboDoctypeFields, setComboDoctypeFields] = useState([]);
  const [ingredientsDoctypeFields, setIngredientsDoctypeFields] = useState([]);
  const [variantsData, setVariantsData] = useState([]);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizationTarget, setCustomizationTarget] = useState("Item");

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#604BE8' : 'transparent',
      minHeight: '44px',
      backgroundColor: state.isFocused ? '#ffffff' : '#F3F6FB',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(96, 75, 232, 0.1)' : 'none',
      '&:hover': { borderColor: state.isFocused ? '#604BE8' : 'transparent' },
      transition: 'all 0.2s ease',
      fontWeight: '600',
      fontSize: '14px',
      color: '#1B1B29'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#1B1B29',
      fontWeight: '600',
    }),
    input: (base) => ({
      ...base,
      color: '#1B1B29',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontWeight: '500'
    }),
    menu: (base) => ({
      ...base,
      position: 'absolute',
      zIndex: 9999,
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999
    })
  };
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "",
    addonType: "existing",
    selectedVariant: "",
    modalCustomSelectedVariantId: "",
    modalCustomSelectedVariantDetails: null,
    data: {
      selectedId: "",
      name1: "",
      newName: "",
      price: 0,
      tax_applicable: false,
      tax_rate: 0,
      image: "",
      imagePreview: "",
      kitchen: "",
      variants: {
        size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
        cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
        spicy: {
          enabled: false,
          spicy_price: 0,
          spicy_image: "",
          non_spicy_price: 0,
          non_spicy_image: "",
        },
        sugar: { enabled: false, level: "medium" },
      },
      custom_variants: [],
      branch_names: [],
      branch_prices: {},
      company_prices: {}, // NEW: Per-company price overrides for addons/combos
      ingredients: [
        { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
      ],
    },
    index: null,
  });
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [activeColumnTab, setActiveColumnTab] = useState("item");
  const [addonListModalOpen, setAddonListModalOpen] = useState(false);
  const [comboListModalOpen, setComboListModalOpen] = useState(false);
  // New modals for creating kitchen and item group
  const [showNewKitchenModal, setShowNewKitchenModal] = useState(false);
  const [newKitchenName, setNewKitchenName] = useState("");
  const [newKitchenValue, setNewKitchenValue] = useState("");
  const [showNewItemGroupModal, setShowNewItemGroupModal] = useState(false);
  const [newItemGroupName, setNewItemGroupName] = useState("");
  const [imagePreviews, setImagePreviews] = useState({
    item: "",
    spicy: "",
    non_spicy: "",
    multiple: [],
    custom_variant_images: {},
  });
  const [allItems, setAllItems] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [newKitchenFields, setNewKitchenFields] = useState({});
  const [newItemGroupFields, setNewItemGroupFields] = useState({});
  const [customVariants, setCustomVariants] = useState([]);
  const [selectedCustomVariantId, setSelectedCustomVariantId] = useState("");
  const [selectedCustomVariantDetails, setSelectedCustomVariantDetails] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [shouldNavigateOnOk, setShouldNavigateOnOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialSubItemOpened, setInitialSubItemOpened] = useState(false);
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [companyTaxRate, setCompanyTaxRate] = useState(0);
  const [nestedDoctypesData, setNestedDoctypesData] = useState({});

  // --- Branch Assignment State ---
  const [availableBranches, setAvailableBranches] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [branchNames, setBranchNames] = useState([]); // Array of selected branch names
  const [branchPrices, setBranchPrices] = useState({}); // { "Branch A": 120, "Branch B": 100 }
  const [companyPrices, setCompanyPrices] = useState({}); // { "Company A": 120, "Company B": 100 }

  // Image State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState(null);
  const [cropTarget, setCropTarget] = useState({ field: null, subField: null, variantId: null, subheading: null, isModal: false, index: null });
  const [originalFile, setOriginalFile] = useState(null);
  const [targetSize, setTargetSize] = useState({ width: 768, height: 768 });
  const [aspect, setAspect] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const itemToEdit = location.state?.item;
  const isEditing = Boolean(itemToEdit) && !isGalleryImport;
  // Helper function to prevent scroll on number inputs
  const disableNumberInputScroll = (e) => {
    e.target.blur();
  };

  const handleColumnVisibilityChange = (type, field) => {
    setFormData(prev => ({
      ...prev,
      columnVisibility: {
        ...prev.columnVisibility,
        [type]: {
          ...prev.columnVisibility[type],
          [field]: !prev.columnVisibility[type][field]
        }
      }
    }));
  };

  const [activeTabId, setActiveTabId] = useState("");

  const getTabsAndFields = () => {
    const sections = doctypeFields.filter(f => f.type === 'Section Break');

    if (sections.length === 0) {
      return [
        {
          id: "item_details",
          label: "Item Details",
          fields: [
            { name: "item_code", isStandard: true },
            { name: "item_name", isStandard: true },
            { name: "item_group", isStandard: true },
            { name: "price_list_rate", isStandard: true },
            { name: "tax_applicable", isStandard: true },
            { name: "tax_rate", isStandard: true },
            { name: "has_offer", isStandard: true },
            { name: "offer_price", isStandard: true },
            { name: "offer_start_time", isStandard: true },
            { name: "offer_end_time", isStandard: true },
            { name: "kitchen", isStandard: true },
            { name: "image", isStandard: true },
            { name: "images", isStandard: true }
          ]
        },
        {
          id: "variants",
          label: "Variants",
          fields: [
            { name: "variant_table", isStandard: true }
          ]
        },
        {
          id: "ingredients",
          label: "Ingredients",
          fields: [
            { name: "ingredients", isStandard: true }
          ]
        }
      ];
    }

    const tabsList = [];
    let currentTab = null;

    doctypeFields.forEach((f) => {
      if (f.type === 'Section Break') {
        if (currentTab) {
          tabsList.push(currentTab);
        }
        currentTab = {
          id: f.id || f.label.toLowerCase().replace(/\s+/g, '_'),
          label: f.label,
          fields: []
        };
      } else if (f.type === 'Column Break') {
        // Skip Column Breaks entirely as they are purely for layout representation
        return;
      } else {
        if (!currentTab) {
          currentTab = {
            id: "general",
            label: "General",
            fields: []
          };
        }

        const standardIds = ['item_code', 'item_name', 'item_group', 'price_list_rate', 'tax_applicable', 'tax_rate', 'has_offer', 'offer_price', 'offer_start_time', 'offer_end_time', 'kitchen', 'variant_table', 'images', 'ingredients', 'image'];
        const isStandard = standardIds.includes(f.id);
        currentTab.fields.push({
          name: f.id,
          isStandard,
          fieldConfig: f
        });
      }
    });

    if (currentTab) {
      tabsList.push(currentTab);
    }

    const allPlacedFieldNames = new Set();
    tabsList.forEach(t => t.fields.forEach(f => allPlacedFieldNames.add(f.name)));

    const criticalStandardFields = ['item_code', 'item_name', 'item_group', 'price_list_rate', 'tax_applicable', 'tax_rate', 'has_offer', 'offer_price', 'offer_start_time', 'offer_end_time', 'kitchen', 'image'];
    criticalStandardFields.forEach(fieldName => {
      if (!allPlacedFieldNames.has(fieldName)) {
        if (tabsList.length > 0) {
          tabsList[0].fields.push({ name: fieldName, isStandard: true });
        }
      }
    });

    if (!allPlacedFieldNames.has('variant_table')) {
      let varTab = tabsList.find(t => t.label.toLowerCase().includes('variant'));
      if (varTab) {
        varTab.fields.push({ name: "variant_table", isStandard: true });
      } else {
        tabsList.push({
          id: "variants",
          label: "Variants",
          fields: [{ name: "variant_table", isStandard: true }]
        });
      }
    }

    if (!allPlacedFieldNames.has('ingredients')) {
      let ingTab = tabsList.find(t => t.label.toLowerCase().includes('ingredient'));
      if (ingTab) {
        ingTab.fields.push({ name: "ingredients", isStandard: true });
      } else {
        tabsList.push({
          id: "ingredients",
          label: "Ingredients",
          fields: [{ name: "ingredients", isStandard: true }]
        });
      }
    }

    return tabsList;
  };

  useEffect(() => {
    const computedTabs = getTabsAndFields();
    if (computedTabs.length > 0 && !activeTabId) {
      setActiveTabId(computedTabs[0].id);
    }
  }, [doctypeFields, activeTabId]);
  useEffect(() => {
    const computedTabs = getTabsAndFields();
    if (computedTabs.length > 0 && !activeTabId) {
      setActiveTabId(computedTabs[0].id);
    }
  }, [doctypeFields, activeTabId]);

  const getNestedFieldsForDoctype = (doctype) => {
    if (!doctype) return [];
    if (doctype === 'Item Group') return itemGroupDoctypeFields;
    if (doctype === 'Kitchen') return kitchenDoctypeFields;
    if (doctype === 'Addon') return addonDoctypeFields;
    if (doctype === 'Combo') return comboDoctypeFields;
    if (doctype === 'Variant') return variantDoctypeFields;
    if (doctype === 'Ingredients' || doctype === 'Ingredient & Nutrition') return ingredientsDoctypeFields;
    if (doctype === 'Item') return doctypeFields;
    if (nestedDoctypesData[doctype]) return nestedDoctypesData[doctype];
    return [];
  };

  const handleTableCustomFieldAdd = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), {}]
    }));
  };

  const handleTableCustomFieldRemove = (fieldName, index) => {
    setFormData((prev) => {
      const arr = [...(prev[fieldName] || [])];
      arr.splice(index, 1);
      return { ...prev, [fieldName]: arr };
    });
  };

  const handleTableCustomFieldChange = (fieldName, index, subFieldName, value) => {
    setFormData((prev) => {
      const arr = [...(prev[fieldName] || [])];
      arr[index] = { ...arr[index], [subFieldName]: value };
      return { ...prev, [fieldName]: arr };
    });
  };

  const renderField = (field) => {
    // If field is hidden (either in doctype config or in columnVisibility), return null.
    if (formData.columnVisibility?.item?.[field.name] === false) return null;

    // Check if the field is hidden in the doctype database config
    if (getFieldHidden(field.name, false)) return null;

    // Skip Column Break layout elements from rendering as generic inputs
    if (field.fieldConfig?.type === 'Column Break' || field.fieldConfig?.type === 'Section Break') return null;

    // Standard core fields:
    if (field.name === "item_code") {
      return (
        <div key="item_code" className="form-group">
          <label>{getFieldLabel("item_code", "Item Code")} {getFieldMandatory("item_code", true) && <span>*</span>}</label>
          <input
            type={getFieldType("item_code", "text")}
            name="item_code"
            value={formData.item_code}
            onChange={handleInputChange}
            className="input"
            required={getFieldMandatory("item_code", true)}
          />
        </div>
      );
    }

    if (field.name === "item_name") {
      return (
        <div key="item_name" className="form-group">
          <label>{getFieldLabel("item_name", "Item Name")} {getFieldMandatory("item_name", true) && <span>*</span>}</label>
          <input
            type={getFieldType("item_name", "text")}
            name="item_name"
            value={formData.item_name}
            onChange={handleInputChange}
            className="input"
            required={getFieldMandatory("item_name", true)}
          />
        </div>
      );
    }

    if (field.name === "item_group") {
      const selectedVal = Array.isArray(formData.item_group) ? formData.item_group[formData.item_group.length - 1] : formData.item_group;
      const igObj = itemGroups.find(ig => ig.group_name === selectedVal);
      const excludedItemGroupFields = ['group_name', 'item_group', 'name', 'parent_item_group', 'company', 'company_name', 'is_group'];
      const groupCustomFields = igObj ? itemGroupDoctypeFields.filter(f => !excludedItemGroupFields.includes(f.id) && !f.hidden).map(f => [f.id, igObj[f.id] || ""]) : [];

      if (groupCustomFields.length === 0) {
        return (
          <div key="item_group" className="form-group">
            <label>{getFieldLabel("item_group", "Item Group")} {getFieldMandatory("item_group", true) && <span>*</span>}</label>
            {getFieldAllowCreateNew("item_group", true) ? (
              <CreatableSelect
                placeholder="Select item group..."
                options={[CREATE_NEW_OPTION, ...itemGroups.map(ig => ({ value: ig.group_name, label: ig.group_name }))]}
                value={formData.item_group ? { value: formData.item_group, label: formData.item_group } : null}
                onChange={(selected) => {
                  if (selected?.value === "create_new") {
                    setNewItemGroupName("");
                    setShowNewItemGroupModal(true);
                  } else {
                    const val = selected ? selected.value : "";
                    setFormData(prev => ({ ...prev, item_group: val }));
                  }
                }}
                onCreateOption={(inputValue) => {
                  setNewItemGroupName(inputValue);
                  setShowNewItemGroupModal(true);
                }}
                styles={selectStyles}
              />
            ) : (
              <Select
                placeholder="Select item group..."
                options={itemGroups.map(ig => ({ value: ig.group_name, label: ig.group_name }))}
                value={formData.item_group ? { value: formData.item_group, label: formData.item_group } : null}
                onChange={(selected) => {
                  const val = selected ? selected.value : "";
                  setFormData(prev => ({ ...prev, item_group: val }));
                }}
                styles={selectStyles}
              />
            )}
          </div>
        );
      }

      return (
        <div key="item-group-dynamic-group" className="grid-colspan-3" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label>{getFieldLabel("item_group", "Item Group")} {getFieldMandatory("item_group", true) && <span>*</span>}</label>
              {getFieldAllowCreateNew("item_group", true) ? (
                <CreatableSelect
                  placeholder="Select item group..."
                  options={[CREATE_NEW_OPTION, ...itemGroups.map(ig => ({ value: ig.group_name, label: ig.group_name }))]}
                  value={formData.item_group ? { value: formData.item_group, label: formData.item_group } : null}
                  onChange={(selected) => {
                    if (selected?.value === "create_new") {
                      setNewItemGroupName("");
                      setShowNewItemGroupModal(true);
                    } else {
                      const val = selected ? selected.value : "";
                      setFormData(prev => ({ ...prev, item_group: val }));
                    }
                  }}
                  onCreateOption={(inputValue) => {
                    setNewItemGroupName(inputValue);
                    setShowNewItemGroupModal(true);
                  }}
                  styles={selectStyles}
                />
              ) : (
                <Select
                  placeholder="Select item group..."
                  options={itemGroups.map(ig => ({ value: ig.group_name, label: ig.group_name }))}
                  value={formData.item_group ? { value: formData.item_group, label: formData.item_group } : null}
                  onChange={(selected) => {
                    const val = selected ? selected.value : "";
                    setFormData(prev => ({ ...prev, item_group: val }));
                  }}
                  styles={selectStyles}
                />
              )}
            </div>
            {groupCustomFields.map(([key, val]) => {
              const fieldDef = itemGroupDoctypeFields.find(f => f.id === key);
              const label = fieldDef ? fieldDef.label : key.replace(/_/g, ' ');
              return (
                <div key={key} className="form-group">
                  <label style={{ textTransform: 'capitalize' }}>{label}</label>
                  <input
                    type="text"
                    value={val?.toString() || ""}
                    readOnly
                    className="input"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: '600', color: '#0ea5e9' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.name === "kitchen") {
      const selectedVal = Array.isArray(formData.kitchen) ? formData.kitchen[formData.kitchen.length - 1] : formData.kitchen;
      const kObj = kitchens.find(k => k.kitchen_name === selectedVal);
      const excludedKitchenFields = ['kitchen_name', 'kitchen', 'name', 'company', 'company_name'];
      const kitchenCustomFields = kObj ? kitchenDoctypeFields.filter(f => !excludedKitchenFields.includes(f.id) && !f.hidden).map(f => [f.id, kObj[f.id] || ""]) : [];

      if (kitchenCustomFields.length === 0) {
        return (
          <div key="kitchen" className="form-group">
            <label>{getFieldLabel("kitchen", "Kitchen")} {getFieldMandatory("kitchen", true) && <span>*</span>}</label>
            {getFieldAllowCreateNew("kitchen", true) ? (
              <CreatableSelect
                placeholder="Select kitchen..."
                options={[CREATE_NEW_OPTION, ...kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))]}
                value={formData.kitchen ? { value: formData.kitchen, label: formData.kitchen } : null}
                onChange={(selected) => {
                  if (selected?.value === "create_new") {
                    setNewKitchenName("");
                    setShowNewKitchenModal(true);
                  } else {
                    const val = selected ? selected.value : "";
                    setFormData(prev => ({ ...prev, kitchen: val }));
                  }
                }}
                onCreateOption={(inputValue) => {
                  setNewKitchenName(inputValue);
                  setShowNewKitchenModal(true);
                }}
                styles={selectStyles}
              />
            ) : (
              <Select
                placeholder="Select kitchen..."
                options={kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))}
                value={formData.kitchen ? { value: formData.kitchen, label: formData.kitchen } : null}
                onChange={(selected) => {
                  const val = selected ? selected.value : "";
                  setFormData(prev => ({ ...prev, kitchen: val }));
                }}
                styles={selectStyles}
              />
            )}
          </div>
        );
      }

      return (
        <div key="kitchen-dynamic-group" className="grid-colspan-3" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label>{getFieldLabel("kitchen", "Kitchen")} {getFieldMandatory("kitchen", true) && <span>*</span>}</label>
              {getFieldAllowCreateNew("kitchen", true) ? (
                <CreatableSelect
                  placeholder="Select kitchen..."
                  options={[CREATE_NEW_OPTION, ...kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))]}
                  value={formData.kitchen ? { value: formData.kitchen, label: formData.kitchen } : null}
                  onChange={(selected) => {
                    if (selected?.value === "create_new") {
                      setNewKitchenName("");
                      setShowNewKitchenModal(true);
                    } else {
                      const val = selected ? selected.value : "";
                      setFormData(prev => ({ ...prev, kitchen: val }));
                    }
                  }}
                  onCreateOption={(inputValue) => {
                    setNewKitchenName(inputValue);
                    setShowNewKitchenModal(true);
                  }}
                  styles={selectStyles}
                />
              ) : (
                <Select
                  placeholder="Select kitchen..."
                  options={kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))}
                  value={formData.kitchen ? { value: formData.kitchen, label: formData.kitchen } : null}
                  onChange={(selected) => {
                    const val = selected ? selected.value : "";
                    setFormData(prev => ({ ...prev, kitchen: val }));
                  }}
                  styles={selectStyles}
                />
              )}
            </div>
            {kitchenCustomFields.map(([key, val]) => {
              const fieldDef = kitchenDoctypeFields.find(f => f.id === key);
              const label = fieldDef ? fieldDef.label : key.replace(/_/g, ' ');
              return (
                <div key={key} className="form-group">
                  <label style={{ textTransform: 'capitalize' }}>{label}</label>
                  <input
                    type="text"
                    value={val?.toString() || ""}
                    readOnly
                    className="input"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: '600', color: '#0369a1' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.name === "price_list_rate") {
      return (
        <React.Fragment key="price_list_rate_group">
          <div className="form-group">
            <label>{getFieldLabel("price_list_rate", "Base Price")} ({displaySymbol}) {getFieldMandatory("price_list_rate", true) && <span>*</span>}</label>
            <input
              type={getFieldType("price_list_rate", "number")}
              name="price_list_rate"
              value={formData.price_list_rate}
              onChange={handleInputChange}
              onFocus={handleNumericInputFocus}
              onBlur={(e) => handleNumericInputBlur(e, "price_list_rate")}
              onWheel={disableNumberInputScroll}
              className="input"
              required={getFieldMandatory("price_list_rate", true)}
              min="0"
              step="0.01"
              placeholder="Store-wide default price"
            />
          </div>
          <div className="grid-colspan-3" style={{ gridColumn: 'span 3' }}>
            {showCompanyAssign && (
              <div className="form-group mb-4" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <label className="fw-bold mb-4 d-block" style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                  Assign to Companies <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {companyOptions.map((comp, idx) => {
                    const isSelected = selectedCompanies.includes(comp);
                    return (
                      <div key={idx} style={{
                        border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                        padding: '20px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                        boxShadow: isSelected ? '0 10px 20px -5px rgba(59, 130, 246, 0.05)' : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isGroupAdmin && !isCompanyAdmin}
                            onChange={(e) => {
                              const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
                              const isGlobal = (c) => globalTags.includes(c);

                              if (e.target.checked) {
                                if (isGlobal(comp)) {
                                  setSelectedCompanies([comp]);
                                  setCompanyPrices({ [comp]: companyPrices[comp] || "" });
                                } else {
                                  setSelectedCompanies(prev => prev.filter(c => !isGlobal(c)).concat(comp));
                                  setCompanyPrices(prev => {
                                    const next = { ...prev };
                                    globalTags.forEach(gt => delete next[gt]);
                                    return next;
                                  });
                                }
                              } else {
                                setSelectedCompanies(prev => prev.filter(c => c !== comp));
                                setCompanyPrices(prev => {
                                  const newPrices = { ...prev };
                                  delete newPrices[comp];
                                  return newPrices;
                                });
                              }
                            }}
                            id={`comp-${idx}`}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                          <label htmlFor={`comp-${idx}`} style={{ margin: 0, fontWeight: '700', color: '#1e293b', cursor: 'pointer', fontSize: '15px' }}>
                            {comp}
                          </label>
                        </div>
                        {isSelected && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                              Price Override ({getCompanyDisplaySymbol(comp)})
                            </label>
                            <input
                              type="number"
                              className="input"
                              placeholder={`Base: ${formData.price_list_rate || 0}`}
                              value={companyPrices[comp] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompanyPrices(prev => ({
                                  ...prev,
                                  [comp]: val === '' ? undefined : Number(val)
                                }));
                              }}
                              style={{
                                padding: '10px',
                                fontSize: '13px',
                                width: '100%',
                                border: companyPrices[comp] ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                                borderRadius: '8px',
                                backgroundColor: companyPrices[comp] ? '#f0f9ff' : '#fff'
                              }}
                              min="0"
                              step="0.01"
                              onWheel={disableNumberInputScroll}
                            />
                          </div>
                        )}
                        {isSelected && !userBranch && companyBranchesMap[comp] && companyBranchesMap[comp].length > 0 && (
                          <div style={{ marginTop: '20px', paddingLeft: '15px', borderLeft: '2.5px solid #3b82f6' }}>
                            <h6 style={{ fontSize: '13px', color: '#1e293b', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              Branches in {comp}
                            </h6>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                              {companyBranchesMap[comp].map((branch, bIdx) => {
                                const isBranchSelected = branchNames.includes(branch);
                                return (
                                  <div key={bIdx} style={{ padding: '10px 14px', backgroundColor: isBranchSelected ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', border: isBranchSelected ? '1.5px solid #10b981' : '1.5px solid #e2e8f0', transition: 'all 0.2s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isBranchSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setBranchNames(prev => [...prev, branch]);
                                          } else {
                                            setBranchNames(prev => prev.filter(b => b !== branch));
                                            setBranchPrices(prev => {
                                              const newPrices = { ...prev };
                                              delete newPrices[branch];
                                              return newPrices;
                                            });
                                          }
                                        }}
                                        id={`branch-${idx}-${bIdx}`}
                                        style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                      />
                                      <label htmlFor={`branch-${idx}-${bIdx}`} style={{ margin: 0, fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}>
                                        {branch}
                                      </label>
                                    </div>
                                    {isBranchSelected && (
                                      <div style={{ marginTop: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                          Price Override ({getCompanyDisplaySymbol(null, branch)})
                                        </label>
                                        <input
                                          type="number"
                                          className="input"
                                          placeholder={`Base: ${formData.price_list_rate || 0}`}
                                          value={branchPrices[branch] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setBranchPrices(prev => ({
                                              ...prev,
                                              [branch]: val === '' ? null : Number(val)
                                            }));
                                          }}
                                          style={{ padding: '8px', fontSize: '12px', width: '100%', border: branchPrices[branch] ? '1.5px solid #10b981' : '1.5px solid #cbd5e1', borderRadius: '6px', backgroundColor: branchPrices[branch] ? '#f0fdf4' : '#fff' }}
                                          min="0"
                                          step="0.01"
                                          onWheel={disableNumberInputScroll}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </React.Fragment>
      );
    }

    if (field.name === "tax_applicable") {
      return (
        <div key="tax_applicable" className="form-group">
          <label>{getFieldLabel("tax_applicable", "GST/VAT Applicable")}</label>
          <select
            name="tax_applicable"
            value={formData.tax_applicable ? "Yes" : "No"}
            onChange={(e) => {
              const val = e.target.value === "Yes";
              setFormData(prev => {
                let updated = { ...prev, tax_applicable: val };
                if (val && !prev.tax_rate) {
                  updated.tax_rate = companyTaxRate;
                }
                return updated;
              });
            }}
            className="input"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      );
    }

    if (field.name === "tax_rate") {
      if (!formData.tax_applicable) return null;
      return (
        <div key="tax_rate" className="form-group">
          <label>{getFieldLabel("tax_rate", "GST/VAT Rate (%)")}</label>
          <input
            type="number"
            name="tax_rate"
            value={formData.tax_rate}
            onChange={handleInputChange}
            onFocus={handleNumericInputFocus}
            onBlur={(e) => handleNumericInputBlur(e, "tax_rate")}
            onWheel={disableNumberInputScroll}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
      );
    }

    if (field.name === "has_offer") {
      return (
        <React.Fragment key="has_offer_frag">
          <div key="excise_applicable" className="form-group">
            <label>{getFieldLabel("excise_applicable", "Excise Duty Applicable")}</label>
            <select
              name="excise_applicable"
              value={formData.excise_applicable ? "Yes" : "No"}
              onChange={(e) => {
                const val = e.target.value === "Yes";
                setFormData(prev => ({ ...prev, excise_applicable: val, excise_rate: val ? (prev.excise_rate || 50) : 0 }));
              }}
              className="input"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {formData.excise_applicable && (
            <div key="excise_rate" className="form-group">
              <label>{getFieldLabel("excise_rate", "Excise Rate (%)")}</label>
              <input
                type="number"
                name="excise_rate"
                value={formData.excise_rate || 0}
                onChange={handleInputChange}
                onFocus={handleNumericInputFocus}
                onBlur={(e) => handleNumericInputBlur(e, "excise_rate")}
                onWheel={disableNumberInputScroll}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
          )}
          <div key="has_offer" className="form-group">
            <label>{getFieldLabel("has_offer", "Enable Promotion")}</label>
            <input
              type="checkbox"
              name="has_offer"
              checked={formData.has_offer}
              onChange={handleInputChange}
              style={{ width: '20px', height: '20px' }}
            />
          </div>
        </React.Fragment>
      );
    }

    if (field.name === "offer_price") {
      if (!formData.has_offer) return null;
      return (
        <div key="offer_price" className="form-group">
          <label>{getFieldLabel("offer_price", "Promotional Price")} ({displaySymbol})</label>
          <input
            type="number"
            name="offer_price"
            value={formData.offer_price}
            onChange={handleInputChange}
            onFocus={handleNumericInputFocus}
            onBlur={(e) => handleNumericInputBlur(e, "offer_price")}
            onWheel={disableNumberInputScroll}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
      );
    }

    if (field.name === "offer_start_time") {
      if (!formData.has_offer) return null;
      return (
        <div key="offer_start_time" className="form-group">
          <label>{getFieldLabel("offer_start_time", "Offer Start Time")}</label>
          <input
            type="datetime-local"
            name="offer_start_time"
            value={formData.offer_start_time}
            onChange={handleInputChange}
            className="input"
          />
        </div>
      );
    }

    if (field.name === "offer_end_time") {
      if (!formData.has_offer) return null;
      return (
        <div key="offer_end_time" className="form-group">
          <label>{getFieldLabel("offer_end_time", "Offer End Time")}</label>
          <input
            type="datetime-local"
            name="offer_end_time"
            value={formData.offer_end_time}
            onChange={handleInputChange}
            className="input"
          />
        </div>
      );
    }

    if (field.name === "image") {
      return (
        <div key="image" className="form-group">
          <label>
            {getFieldLabel("image", "Item Image")}
            <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
              (768x768px)
            </span>
          </label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "image")} className="input" />
          {imagePreviews.item ? (
            <div className="image-container">
              <img src={imagePreviews.item} alt="Preview" className="image-preview" />
              <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  type="button"
                  className="img-edit-button"
                  onClick={() => handleEditImage(imagePreviews.item, "image")}
                  style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                >
                  <FaEdit /> Edit
                </button>
                <button type="button" className="img-delete-button" onClick={() => handleImageDelete("image")} style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No Image Uploaded</div>
          )}
        </div>
      );
    }

    if (field.name === "images") {
      return (
        <div key="images" className="form-group">
          <label>
            {getFieldLabel("images", "Multiple Images")}
            <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
              (768x768px)
            </span>
          </label>
          <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "images")} className="input" />
          {imagePreviews.multiple.length > 0 ? (
            <div className="image-gallery">
              {imagePreviews.multiple.map((img, index) => (
                <div key={index} className="image-container">
                  <img src={img} alt={`Multiple ${index}`} className="image-preview" />
                  <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <button
                      type="button"
                      className="img-edit-button"
                      onClick={() => handleEditImage(img, "images", null, null, null, false, index)}
                      style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="img-delete-button"
                      onClick={() => handleImageDelete("images", null, index)}
                      style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No additional images uploaded.</p>
          )}
        </div>
      );
    }

    if (field.name === "variant_table") {
      return (
        <div key="variant_table" className="form-group grid-colspan-3" style={{ gridColumn: 'span 3', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
          <h5 className="section-title">Variants</h5>
          <div className="nested-section" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            {variantDoctypeFields.some(f => f.id === 'predefined_variants' && !f.hidden) && (
              <>
                <label>Select Predefined Variant</label>
                <select name="selectedVariant" value={formData.selectedVariant} onChange={handleInputChange} className="input">
                  <option value="">Select a variant</option>
                  <option value="size">Size</option>
                  <option value="cold">Cold</option>
                  <option value="spicy">Spicy</option>
                  <option value="sugar">Sugar</option>
                </select>
              </>
            )}
            {formData.selectedVariant && (
              <div className="variant-toggle">
                <label>Enable {formData.selectedVariant} Variant</label>
                <input
                  type="checkbox"
                  checked={formData.variants[formData.selectedVariant].enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      variants: {
                        ...prev.variants,
                        [formData.selectedVariant]: {
                          ...prev.variants[formData.selectedVariant],
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                />
              </div>
            )}
            {formData.selectedVariant === "size" && formData.variants.size.enabled && (
              <div className="variant-section">
                <label>Small Price ({displaySymbol})</label>
                <input
                  type="number"
                  value={formData.variants.size.small_price}
                  onChange={(e) => handleVariantFieldChange("size", "small_price", e.target.value)}
                  onFocus={(e) => handleVariantNumericFieldFocus(e, "size", "small_price")}
                  onBlur={(e) => handleVariantNumericFieldBlur(e, "size", "small_price")}
                  onWheel={disableNumberInputScroll}
                  className="input"
                  min="0"
                  step="0.01"
                />
                <label>Medium Price ({displaySymbol})</label>
                <input
                  type="number"
                  value={formData.variants.size.medium_price}
                  onChange={(e) => handleVariantFieldChange("size", "medium_price", e.target.value)}
                  onFocus={(e) => handleVariantNumericFieldFocus(e, "size", "medium_price")}
                  onBlur={(e) => handleVariantNumericFieldBlur(e, "size", "medium_price")}
                  onWheel={disableNumberInputScroll}
                  className="input"
                  min="0"
                  step="0.01"
                />
                <label>Large Price ({displaySymbol})</label>
                <input
                  type="number"
                  value={formData.variants.size.large_price}
                  onChange={(e) => handleVariantFieldChange("size", "large_price", e.target.value)}
                  onFocus={(e) => handleVariantNumericFieldFocus(e, "size", "large_price")}
                  onBlur={(e) => handleVariantNumericFieldBlur(e, "size", "large_price")}
                  onWheel={disableNumberInputScroll}
                  className="input"
                  min="0"
                  step="0.01"
                />
                <button type="button" className="save-btn" onClick={() => handleVariantSave("size")} style={{ marginTop: "15px" }}>
                  Save
                </button>
              </div>
            )}
            {formData.selectedVariant === "cold" && formData.variants.cold.enabled && (
              <div className="variant-section">
                <label>Ice Preference</label>
                <select
                  value={formData.variants.cold.ice_preference}
                  onChange={(e) => handleVariantFieldChange("cold", "ice_preference", e.target.value)}
                  className="input"
                >
                  <option value="without_ice">Without Ice</option>
                  <option value="with_ice">With Ice</option>
                </select>
                {formData.variants.cold.ice_preference === "with_ice" && (
                  <div>
                    <label>Ice Price ({displaySymbol})</label>
                    <input
                      type="number"
                      value={formData.variants.cold.ice_price}
                      onChange={(e) => handleVariantFieldChange("cold", "ice_price", e.target.value)}
                      onFocus={(e) => handleVariantNumericFieldFocus(e, "cold", "ice_price")}
                      onBlur={(e) => handleVariantNumericFieldBlur(e, "cold", "ice_price")}
                      onWheel={disableNumberInputScroll}
                      className="input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                <button type="button" className="save-btn" onClick={() => handleVariantSave("cold")} style={{ marginTop: "15px" }}>
                  Save
                </button>
              </div>
            )}
            {formData.selectedVariant === "spicy" && formData.variants.spicy.enabled && (
              <div className="variant-section">
                <label>Spicy Price ({displaySymbol})</label>
                <input
                  type="number"
                  value={formData.variants.spicy.spicy_price}
                  onChange={(e) => handleVariantFieldChange("spicy", "spicy_price", e.target.value)}
                  onFocus={(e) => handleVariantNumericFieldFocus(e, "spicy", "spicy_price")}
                  onBlur={(e) => handleVariantNumericFieldBlur(e, "spicy", "spicy_price")}
                  className="input"
                />
                <label>Spicy Image <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>(768x768px)</span></label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "spicy", "spicy_image")} className="input" />
                {imagePreviews.spicy && (
                  <div className="image-container">
                    <img src={imagePreviews.spicy} alt="Spicy" className="image-preview" />
                    <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button type="button" className="img-edit-button" onClick={() => handleEditImage(imagePreviews.spicy, "spicy", "spicy_image")} style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaEdit /> Edit</button>
                      <button type="button" className="img-delete-button" onClick={() => handleImageDelete("spicy", "spicy_image")} style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaTrash /> Delete</button>
                    </div>
                  </div>
                )}
                <label>Non-Spicy Price ({displaySymbol})</label>
                <input
                  type="number"
                  value={formData.variants.spicy.non_spicy_price}
                  onChange={(e) => handleVariantFieldChange("spicy", "non_spicy_price", e.target.value)}
                  onFocus={(e) => handleVariantNumericFieldFocus(e, "spicy", "non_spicy_price")}
                  onBlur={(e) => handleVariantNumericFieldBlur(e, "spicy", "non_spicy_price")}
                  className="input"
                />
                <label>Non-Spicy Image <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>(768x768px)</span></label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "spicy", "non_spicy_image")} className="input" />
                {imagePreviews.non_spicy && (
                  <div className="image-container">
                    <img src={imagePreviews.non_spicy} alt="Non Spicy" className="image-preview" />
                    <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button type="button" className="img-edit-button" onClick={() => handleEditImage(imagePreviews.non_spicy, "spicy", "non_spicy_image")} style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaEdit /> Edit</button>
                      <button type="button" className="img-delete-button" onClick={() => handleImageDelete("spicy", "non_spicy_image")} style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaTrash /> Delete</button>
                    </div>
                  </div>
                )}
                <button type="button" className="save-btn" onClick={() => handleVariantSave("spicy")} style={{ marginTop: "15px" }}>Save</button>
              </div>
            )}
            {formData.selectedVariant === "sugar" && formData.variants.sugar.enabled && (
              <div className="variant-section">
                <label>Sugar Level</label>
                <select value={formData.variants.sugar.level} onChange={(e) => handleVariantFieldChange("sugar", "level", e.target.value)} className="input">
                  <option value="less">Less Sugar</option>
                  <option value="medium">Medium Sugar</option>
                  <option value="extra">Extra Sugar</option>
                </select>
                <button type="button" className="save-btn" onClick={() => handleVariantSave("sugar")} style={{ marginTop: "15px" }}>Save</button>
              </div>
            )}

            <div className="variant-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              {formData.variants.size.enabled && formData.selectedVariant !== "size" && (
                <div className="nested-section" style={{ margin: 0 }}>
                  <h6>Size Variant</h6>
                  <table className="variant-table">
                    <thead><tr><th>Size</th><th>Price</th></tr></thead>
                    <tbody>
                      <tr><td>Small</td><td>{displaySymbol}{formData.variants.size.small_price}</td></tr>
                      <tr><td>Medium</td><td>{displaySymbol}{formData.variants.size.medium_price}</td></tr>
                      <tr><td>Large</td><td>{displaySymbol}{formData.variants.size.large_price}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {formData.variants.cold.enabled && formData.selectedVariant !== "cold" && (
                <div className="nested-section" style={{ margin: 0 }}>
                  <h6>Cold Variant</h6>
                  <table className="variant-table">
                    <thead><tr><th>Ice Preference</th><th>Price</th></tr></thead>
                    <tbody><tr><td>{formData.variants.cold.ice_preference === "with_ice" ? "With Ice" : "Without Ice"}</td><td>{formData.variants.cold.ice_preference === "with_ice" ? <>{displaySymbol}{formData.variants.cold.ice_price}</> : <>{displaySymbol}0</>}</td></tr></tbody>
                  </table>
                </div>
              )}
              {formData.variants.spicy.enabled && formData.selectedVariant !== "spicy" && (
                <div className="nested-section" style={{ margin: 0 }}>
                  <h6>Spicy Variant</h6>
                  <table className="variant-table">
                    <thead><tr><th>Type</th><th>Price</th><th>Image</th></tr></thead>
                    <tbody>
                      <tr><td>Spicy</td><td>{displaySymbol}{formData.variants.spicy.spicy_price}</td><td>{imagePreviews.spicy ? <img src={imagePreviews.spicy} alt="Spicy" style={{ width: '40px', height: '40px', borderRadius: '4px' }} /> : "No Image"}</td></tr>
                      <tr><td>Non-Spicy</td><td>{displaySymbol}{formData.variants.spicy.non_spicy_price}</td><td>{imagePreviews.non_spicy ? <img src={imagePreviews.non_spicy} alt="Non Spicy" style={{ width: '40px', height: '40px', borderRadius: '4px' }} /> : "No Image"}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              {formData.variants.sugar.enabled && formData.selectedVariant !== "sugar" && (
                <div className="nested-section" style={{ margin: 0 }}>
                  <h6>Sugar Variant</h6>
                  <table className="variant-table">
                    <thead><tr><th>Sugar Level</th></tr></thead>
                    <tbody><tr><td>{formData.variants.sugar.level.charAt(0).toUpperCase() + formData.variants.sugar.level.slice(1)}</td></tr></tbody>
                  </table>
                </div>
              )}
            </div>

            {variantDoctypeFields.some(f => f.id === 'custom_variant' && !f.hidden) && (
              <div style={{ marginTop: '30px' }}>
                <h6 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e3a8a', marginBottom: '10px' }}>Custom Variants</h6>
                <div className="form-group">
                  <label>Select Custom Variant</label>
                  <select value={selectedCustomVariantId} onChange={(e) => handleCustomVariantSelection(e.target.value)} className="input">
                    <option value="">Select a variant</option>
                    <option value="create_new" style={{ fontWeight: "bold", color: "#3498db" }}>+ Create New Variant</option>
                    {[...new Map(customVariants.map(v => [v._id, v])).values()].map((variant) => (
                      <option key={variant._id} value={variant._id}>{variant.heading}</option>
                    ))}
                  </select>
                </div>
                {selectedCustomVariantDetails && (
                  <div className="variant-section">
                    <div className="variant-toggle">
                      <label>Enable {selectedCustomVariantDetails.heading} Variant</label>
                      <input
                        type="checkbox"
                        checked={formData.custom_variants.find((v) => v._id === selectedCustomVariantId)?.enabled || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            custom_variants: prev.custom_variants.map((variant) =>
                              variant._id === selectedCustomVariantId ? { ...variant, enabled: e.target.checked } : variant
                            ),
                          }))
                        }
                      />
                    </div>
                    {formData.custom_variants.find((v) => v._id === selectedCustomVariantId)?.enabled && (
                      <>
                        <h6>{selectedCustomVariantDetails.heading} Options</h6>
                        {renderVariantFields(formData.custom_variants.find((v) => v._id === selectedCustomVariantId))}
                        <button type="button" className="save-btn" onClick={() => handleCustomVariantSave(selectedCustomVariantId)}>Save Custom Variant</button>
                      </>
                    )}
                  </div>
                )}

                {formData.custom_variants.filter(v => v.enabled).map((variant) => (
                  variant.enabled && selectedCustomVariantId !== variant._id && (
                    <div key={variant._id} className="nested-section" style={{ marginTop: '15px' }}>
                      <h6>{variant.heading}</h6>
                      <table className="variant-table">
                        <thead><tr><th>Name</th><th>Price</th><th>Image</th></tr></thead>
                        <tbody>
                          {variant.subheadings.map((sub) => (
                            <tr key={sub.name}>
                              <td>{sub.name}</td>
                              <td>{sub.price ? <>{displaySymbol}{sub.price}</> : "N/A"}</td>
                              <td>{imagePreviews.custom_variant_images[`${variant._id}_${sub.name}_image`] ? <img src={imagePreviews.custom_variant_images[`${variant._id}_${sub.name}_image`]} alt={sub.name} style={{ width: '40px', height: '40px', borderRadius: '4px' }} /> : "No Image"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (field.name === "ingredients") {
      return (
        <div key="ingredients" className="form-group grid-colspan-3" style={{ gridColumn: 'span 3', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
          <h5 className="section-title">Ingredients & Nutrition</h5>
          <div className="nested-section" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <button
              type="button"
              className="save-btn" style={{ backgroundColor: "#3b82f6", marginBottom: "15px" }}
              onClick={() =>
                navigate("/add-ingredients-nutrition", {
                  state: {
                    formData: formData,
                    itemId: itemToEdit?._id || "new",
                    isEditing: isEditing,
                    itemToEdit: itemToEdit,
                    type: "item",
                  },
                })
              }
              style={{ backgroundColor: '#e67e22', marginBottom: '20px' }}
            >
              Manage Ingredients and Nutrition
            </button>
            {formData.ingredients.length > 0 ? (
              <table className="variant-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Small (gm)</th>
                    <th>Medium (gm)</th>
                    <th>Large (gm)</th>
                    <th>Base Weight (gm)</th>
                    <th>Nutrition</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.ingredients.map((ingredient, index) => (
                    <tr key={index}>
                      <td>{ingredient.ingredients_name || "N/A"}</td>
                      <td>{ingredient.small || 0}</td>
                      <td>{ingredient.medium || 0}</td>
                      <td>{ingredient.large || 0}</td>
                      <td>{ingredient.weight || 0}</td>
                      <td>
                        {ingredient.nutrition.length > 0 ? (
                          <ul className="nutrition-list">
                            {ingredient.nutrition.map((nut, nutIndex) => (
                              <li key={nutIndex}>
                                {nut.nutrition_name}: {nut.nutrition_value} gm
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "No Nutrition Data"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#64748b' }}>No ingredients added yet.</p>
            )}
          </div>
        </div>
      );
    }

    // Generic Custom Fields
    const config = field.fieldConfig || {};
    const isFieldRequired = isFromGallery ? false : config.required;
    return (
      <div key={field.name} className="form-group">
        <label>
          {config.label || field.name} {isFieldRequired && <span>*</span>}
        </label>
        {config.type === "select" ? (
          <Select
            placeholder={`Select ${config.label || field.name}...`}
            options={Array.isArray(config.options) ? config.options.map(opt => ({ value: opt, label: opt })) : []}
            value={formData[field.name] ? { value: formData[field.name], label: formData[field.name] } : null}
            onChange={(selected) => handleInputChange({ target: { name: field.name, value: selected ? selected.value : "" } })}
            styles={selectStyles}
          />
        ) : config.type === "checkbox" ? (
          <input
            type="checkbox"
            name={field.name}
            checked={formData[field.name] || false}
            onChange={handleInputChange}
            style={{ width: '20px', height: '20px' }}
          />
        ) : config.type === "image" ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field.name)} className="input" />
            {imagePreviews[field.name] ? (
              <div className="image-container">
                <img src={imagePreviews[field.name]} alt="Preview" className="image-preview" />
                <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <button
                    type="button"
                    className="img-edit-button"
                    onClick={() => handleEditImage(imagePreviews[field.name], field.name)}
                    style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button type="button" className="img-delete-button" onClick={() => handleImageDelete(field.name)} style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No Image Uploaded</div>
            )}
          </div>
        ) : config.type === "Table" ? (
          <div className="nested-section" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            {(!formData[field.name] || formData[field.name].length === 0) ? (
              <p style={{ fontStyle: 'italic', color: '#64748b', fontSize: '13px' }}>No data entered yet.</p>
            ) : (
              <table className="variant-table" style={{ width: '100%', marginBottom: '10px' }}>
                <thead>
                  <tr>
                    {getNestedFieldsForDoctype(config.link_doctype).filter(f => !f.hidden).map(cf => (
                      <th key={cf.id}>{cf.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData[field.name] || []).map((row, idx) => (
                    <tr key={idx}>
                      {getNestedFieldsForDoctype(config.link_doctype).filter(f => !f.hidden).map(cf => (
                        <td key={cf.id}>
                          <input
                            type={getFieldType(cf.id, "text")}
                            value={row[cf.id] || ""}
                            onChange={(e) => handleTableCustomFieldChange(field.name, idx, cf.id, e.target.value)}
                            className="input"
                            style={{ minWidth: '100px', margin: 0, padding: '8px' }}
                            placeholder={`Enter ${cf.label}`}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => handleTableCustomFieldRemove(field.name, idx)} className="img-delete-button" style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaTrash style={{ fontSize: '12px' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" onClick={() => handleTableCustomFieldAdd(field.name)} className="save-btn" style={{ backgroundColor: "#3b82f6", marginBottom: "15px" }} style={{ backgroundColor: '#e67e22', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              + Add Row
            </button>
          </div>
        ) : (
          <input
            type={config.type || "text"}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            onFocus={config.type === "number" ? handleNumericInputFocus : undefined}
            onBlur={config.type === "number" ? (e) => handleNumericInputBlur(e, field.name) : undefined}
            onWheel={config.type === "number" ? disableNumberInputScroll : undefined}
            className="input"
            required={isFieldRequired}
            min={config.min}
            step={config.step}
          />
        )}
      </div>
    );
  };

  // Permissions State
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  // NEW: Initial role-based and mode-based selection for companies
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const userObj = JSON.parse(userStr);
      const isGroupAdmin = userObj.role?.toLowerCase() === 'group_admin' || userObj.role?.toLowerCase() === 'superadmin';

      if (isEditing && itemToEdit) {
        // Mode 1: Edit - Load ALL current associations for this record
        const itemComps = (itemToEdit.company_names || []).concat(itemToEdit.company_name ? [itemToEdit.company_name] : []).concat(itemToEdit.company ? [itemToEdit.company] : []);
        const uniqueComps = [...new Set(itemComps.map(c => c.trim()).filter(c => c))];
        setSelectedCompanies(uniqueComps);

        // Initialize ALL per-company price overrides
        const existingCompPrices = itemToEdit.company_prices || {};
        // Ensure the active company has a price entry initialized if not present
        const activeComp = itemToEdit.company_name || itemToEdit.company;
        if (activeComp && existingCompPrices[activeComp] === undefined) {
          existingCompPrices[activeComp] = itemToEdit.price_list_rate || 0;
        }
        setCompanyPrices(existingCompPrices);
      } else if (!isGroupAdmin) {
        // Mode 2: Standard Admin Create - Their company should be ticked and locked
        const activeComp = localStorage.getItem('active_company') || userObj.company_name || userObj.company || "";
        if (activeComp) setSelectedCompanies([activeComp]);
      } else {
        // Mode 3: Group Admin Create
        const activeComp = localStorage.getItem('active_company');
        if (activeComp && activeComp !== 'All') {
          setSelectedCompanies([activeComp]);
        }
      }
    } catch (e) {
      console.error("Error parsing user context in CreateItemsPage:", e);
    }
  }, [isEditing, itemToEdit?._id]); // Use ID to prevent unnecessary re-runs if object ref changes
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      return checkIsAdmin(userObj);
    }
    return false;
  });
  const [isGroupAdmin, setIsGroupAdmin] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      return checkIsGlobalAdmin(userObj);
    }
    return false;
  });
  const [userBranch, setUserBranch] = useState(() => {
    const activeBranch = localStorage.getItem('active_branch');
    if (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') {
      return activeBranch;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      const rawBranch = userObj.branch_name || userObj.branch || "";
      return (rawBranch === 'All Branches' || rawBranch === 'All') ? "" : rawBranch;
    }
    return "";
  });
  const [userCompany, setUserCompany] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      return localStorage.getItem('active_company') || userObj.company_name || userObj.company || "";
    }
    return "";
  });

  const displaySymbol = (() => {
    let targetComp = (selectedCompanies && selectedCompanies.length > 0) ? selectedCompanies[0] : null;
    let targetBranch = (branchNames && branchNames.length > 0) ? branchNames[0] : null;
    return <CurrencySymbol activeCompany={targetComp} activeBranch={targetBranch} size={14} />;
  })();

  const getCompanyDisplaySymbol = (compName, branchName) => {
    return <CurrencySymbol activeCompany={compName} activeBranch={branchName} size={14} />;
  };

  const fetchNestedForFields = async (fields, currentBaseUrl) => {
    if (!fields || !Array.isArray(fields)) return;
    const tableFields = fields.filter(f => f.type === 'Table' || f.type === 'Link');
    for (const f of tableFields) {
      if (f.link_doctype) {
        try {
          const nRes = await axios.get(`${currentBaseUrl}/api/doctypes/${f.link_doctype}`, { headers: getHeaders() });
          setNestedDoctypesData(prev => ({ ...prev, [f.link_doctype]: nRes.data.fields || [] }));
        } catch (e) {
          console.error(`Error fetching nested doctype ${f.link_doctype}:`, e);
        }
      }
    }
  };

  const fetchDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Item`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Item doctype:", e);
    }
  };

  const fetchKitchenDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Kitchen`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setKitchenDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Kitchen doctype:", e);
    }
  };

  const fetchItemGroupDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Item Group`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setItemGroupDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Item Group doctype:", e);
    }
  };

  const fetchVariantDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Variant`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setVariantDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Variant doctype:", e);
    }
  };

  const fetchAddonDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Addon`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setAddonDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Addon doctype:", e);
    }
  };

  const fetchComboDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/Combo`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setComboDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Combo doctype:", e);
    }
  };

  const fetchIngredientsDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const doctypeName = encodeURIComponent("Ingredient & Nutrition");
      const res = await axios.get(`${currentBaseUrl}/api/doctypes/${doctypeName}`, { headers: getHeaders() });
      const fields = res.data.fields || [];
      setIngredientsDoctypeFields(fields);
      fetchNestedForFields(fields, currentBaseUrl);
    } catch (e) {
      console.error("Error fetching Ingredients doctype:", e);
    }
  };

  const handleRefreshCustomization = () => {
    const currentBaseUrl = baseUrl || "";
    fetchDoctype(currentBaseUrl);
    fetchKitchenDoctype(currentBaseUrl);
    fetchItemGroupDoctype(currentBaseUrl);
    fetchVariantDoctype(currentBaseUrl);
    fetchAddonDoctype(currentBaseUrl);
    fetchComboDoctype(currentBaseUrl);
    fetchIngredientsDoctype(currentBaseUrl);
  };

  const getFieldLabel = (fieldName, defaultLabel) => {
    const docField = doctypeFields.find(f => f.id === fieldName);
    return docField ? docField.label : defaultLabel;
  };

  const getFieldMandatory = (fieldName, defaultValue) => {
    if (isFromGallery) return false;
    const docField = doctypeFields.find(f => f.id === fieldName);
    return docField ? docField.mandatory : defaultValue;
  };

  const getFieldType = (fieldName, defaultType) => {
    const docField = doctypeFields.find(f => f.id === fieldName);
    if (!docField) return defaultType;
    const typeMap = {
      'Data': 'text',
      'Float': 'number',
      'Number': 'number',
      'Check': 'checkbox',
      'Select': 'select',
      'Date': 'date',
      'Text': 'textarea',
      'Attach Image': 'image',
      'Table': 'table'
    };
    if (docField.type === 'Date' && (fieldName === 'offer_start_time' || fieldName === 'offer_end_time')) {
      return 'datetime-local';
    }
    return typeMap[docField.type] || defaultType;
  };

  const getFieldAllowCreateNew = (fieldName, defaultValue) => {
    const docField = doctypeFields.find(f => f.id === fieldName);
    return docField ? docField.allow_create_new : defaultValue;
  };

  const getFieldHidden = (fieldName, defaultValue, type = 'item') => {
    let fields = doctypeFields;
    let actualFieldName = fieldName;

    if (type === 'addons') {
      fields = addonDoctypeFields;
      if (fieldName === 'price') actualFieldName = 'addon_price';
      if (fieldName === 'tax') actualFieldName = 'tax_applicable';
      if (fieldName === 'image') actualFieldName = 'addon_image';
      if (fieldName === 'variants') actualFieldName = 'variant_table';
    } else if (type === 'combos') {
      fields = comboDoctypeFields;
      if (fieldName === 'price') actualFieldName = 'combo_price';
      if (fieldName === 'tax') actualFieldName = 'tax_applicable';
      if (fieldName === 'image') actualFieldName = 'combo_image';
      if (fieldName === 'variants') actualFieldName = 'variant_table';
    }

    if (actualFieldName === 'ingredients') {
      const parentField = fields.find(f => f.id === 'ingredients' || ['ingredients', 'ingridients'].includes(f.label?.toLowerCase().trim()));

      if (type === 'item') {
        const nestedField = ingredientsDoctypeFields.find(f => ['ingredient & nutrition', 'ingredients & nutrition', 'item_name', 'ingredients_name'].includes(f.label?.toLowerCase().trim()) || f.id === 'item_name' || f.id === 'ingredients_name');
        if (parentField && parentField.hidden) return true;
        if (nestedField && nestedField.hidden) return true;
        return defaultValue;
      } else {
        return parentField ? parentField.hidden : defaultValue;
      }
    }

    const docField = fields.find(f => {
      if (f.id === actualFieldName) return true;
      return false;
    });

    // Explicitly handle addons/combos if backend schema erroneously shares Item's hidden properties
    // For variants specifically, we'll only hide it if the explicit docField is found AND hidden.
    return docField ? docField.hidden : defaultValue;
  };

  const fetchPermissions = async (currentBaseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const role = userObj.role || userObj.UserType || '';
        const roleNorm = role.toLowerCase().replace(/[\s_]/g, '');
        const isCompanyAdminLocal = roleNorm === 'companyadmin';

        const isGroupAdminRole = checkIsGlobalAdmin(userObj);

        const activeBranch = localStorage.getItem('active_branch');
        const rawBranch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : (!isGroupAdminRole && !isCompanyAdminLocal ? (userObj.branch_name || userObj.branch || "") : "");
        const branch = (rawBranch === 'All Branches' || rawBranch === 'All') ? "" : rawBranch;
        setUserBranch(branch);
        setUserCompany(userObj.company_name || "");

        const isAdminRole = checkIsAdmin(userObj);

        setIsCompanyAdmin(isCompanyAdminLocal || isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);

        const activeContext = localStorage.getItem('active_company');
        // Only set selectedCompanies here in CREATE mode.
        // In EDIT mode, the company list is loaded from itemToEdit.company_names in the dedicated useEffect.
        if (!isEditing) {
          if (activeContext === 'All') {
            fetchCompanies(currentBaseUrl);
          } else {
            const comp = userObj.company_name || userObj.company || "";
            setSelectedCompanies([activeContext || comp]);
          }
        } else {
          // In edit mode, always fetch all company options so all checkboxes are shown,
          // but never override selectedCompanies (which is already set from itemToEdit.company_names)
          fetchCompanies(currentBaseUrl);
        }

        // STRICT BRANCH ISOLATION: Auto-initialize branch mapping for new items ONLY if none selected
        if (branch && !isEditing && branchNames.length === 0) {
          setBranchNames([branch]);
          setBranchPrices({ [branch]: Number(formData.price_list_rate || 0) });
        }

        if (role) {
          const url = `${currentBaseUrl}/api/role-permissions?role=${role}`;
          const response = await axios.get(url, { headers: getHeaders() });
          const perms = response.data.permissions || [];

          const pagePerm = perms.find(p => p.pageId === 'create_item');
          if (pagePerm) {
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
            setCanCreate(pagePerm.canCreate === true);
          } else if (isAdminRole) {
            // Administrative fallback
            setCanRead(true);
            setCanWrite(true);
            setCanCreate(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermsLoading(false);
      fetchDoctype(currentBaseUrl);
      fetchKitchenDoctype(currentBaseUrl);
      fetchItemGroupDoctype(currentBaseUrl);
      fetchVariantDoctype(currentBaseUrl);
      fetchAddonDoctype(currentBaseUrl);
      fetchComboDoctype(currentBaseUrl);
      fetchIngredientsDoctype(currentBaseUrl);
    }
  };

  const fetchCompanies = async (currentBaseUrl = baseUrl) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};

      // If user has explicitly assigned companies (Tenant Admin, Group Admin, Super Admin)
      if (userObj.companies && userObj.companies.length > 0) {
        const comps = userObj.companies;
        setCompanyOptions(comps);
        // Auto-select ALL companies ONLY during CREATE mode if context is 'All', otherwise auto-select the active company
        // NEVER override selectedCompanies during edit mode - the item's own associations take priority
        if (!isEditing && selectedCompanies.length === 0 && comps.length > 0) {
          const activeContext = localStorage.getItem('active_company');
          if (activeContext && activeContext !== 'All' && comps.includes(activeContext)) {
            setSelectedCompanies([activeContext]);
          } else if (activeContext === 'All') {
            setSelectedCompanies(comps);
          }
        }
        return;
      }

      // If user is a single-company admin, just use their assigned company
      const singleComp = userObj.company_name || userObj.company;
      if (singleComp) {
        setCompanyOptions([singleComp]);
        if (!isEditing && selectedCompanies.length === 0) {
          setSelectedCompanies([singleComp]);
        }
        return;
      }

      // Final fallback if absolutely nothing in user context
      const headers = {};
      const response = await axios.get(`${currentBaseUrl}/api/companies-public`, { headers });
      const details = response.data || [];
      const names = details.map(d => d.company_name).filter(n => n);
      const uniqueNames = [...new Set(names)];
      setCompanyOptions(uniqueNames);

      if (!isEditing && localStorage.getItem('active_company') === 'All' && selectedCompanies.length === 0 && uniqueNames.length > 0) {
        setSelectedCompanies(uniqueNames);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchData = async (currentBaseUrl = baseUrl) => {
    const active_company = localStorage.getItem("active_company");

    // Resolve fallback company from localStorage/user object so we never skip fetching
    const userStr = localStorage.getItem("user");
    let fallbackCompany = "";
    let fallbackBranch = "";
    try {
      if (userStr) {
        const userObj = JSON.parse(userStr);
        fallbackCompany = userObj.company_name || userObj.company || "";
        fallbackBranch = userObj.branch_name || userObj.branch || "";
      }
    } catch (_) { }
    const effectiveActiveCompany = (active_company && active_company !== "All") ? active_company : fallbackCompany;

    const activeBranch = localStorage.getItem('active_branch');
    const effectiveBranch = (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All') ? activeBranch : fallbackBranch;

    // Resolve list of companies to query
    let targetCompanies;
    if (selectedCompanies && selectedCompanies.length > 0) {
      targetCompanies = [...selectedCompanies];
    } else if (active_company === "All") {
      // Fall back to the user's own company if no companies are selected yet
      targetCompanies = effectiveActiveCompany ? [effectiveActiveCompany] : [];
    } else {
      targetCompanies = [active_company || userCompany || fallbackCompany];
    }

    if (targetCompanies.length === 0) {
      console.log("fetchData: No resolvable company context — skipping fetch.");
      setAvailableBranches([]);
      return [];
    }

    setLoading(true);
    try {
      console.log(`fetchData: Fetching groups and kitchens for: ${targetCompanies.join(", ")} / ${effectiveBranch || "Global"}`);
      const token = localStorage.getItem("token");

      // Fetch Kitchens and Item Groups for ALL selected companies to unionize options
      const kitchenPromises = targetCompanies.map((comp) =>
        axios.get(`${currentBaseUrl}/api/kitchens`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Company-Name": comp,
            "X-Branch-Name": effectiveBranch || "",
          },
        })
      );
      const groupsPromises = targetCompanies.map((comp) =>
        axios.get(`${currentBaseUrl}/api/item-groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Company-Name": comp,
            "X-Branch-Name": effectiveBranch || "",
          },
        })
      );

      const variantsPromises = targetCompanies.map((comp) =>
        axios.get(`${currentBaseUrl}/api/variants`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Company-Name": comp,
            "X-Branch-Name": effectiveBranch || "",
          },
        })
      );

      const [kitchenResults, groupsResults, variantsResults] = await Promise.all([
        Promise.all(kitchenPromises),
        Promise.all(groupsPromises),
        Promise.all(variantsPromises),
      ]);

      const allKitchens = kitchenResults.flatMap((res) => res.data);
      const allGroups = groupsResults.flatMap((res) => res.data);
      const allVariants = variantsResults.flatMap((res) => res.data);

      // De-duplicate by name for clean UI options (since backend returns individual branch records)
      const uniqueKitchens = Array.from(new Map(allKitchens.map((k) => [k.kitchen_name, k])).values());
      const uniqueGroups = Array.from(new Map(allGroups.map((g) => [g.group_name || g.ITEM_GROUP || g.item_group || g.name || g.group, g])).values());
      const uniqueVariants = Array.from(new Map(allVariants.map((v) => [v.heading, v])).values());

      setKitchens(uniqueKitchens);
      setItemGroups(uniqueGroups);
      setVariantsData(uniqueVariants);

      const primaryHeaders = {
        Authorization: `Bearer ${token}`,
        "X-Branch-Name": effectiveBranch || "",
      };

      // Fetch Items and Variants for ALL selected companies (for existing item lookups/addons)
      const itemsPromises = targetCompanies.map(comp =>
        axios.get(`${currentBaseUrl}/api/items`, {
          headers: { ...primaryHeaders, "X-Company-Name": comp }
        }).then(res => res.data.map(item => ({ ...item, company_name: comp })))
      );

      const itemsResults = await Promise.all(itemsPromises);

      setAllItems(itemsResults.flat());
      const cvs = allVariants;
      setCustomVariants(cvs);

      const companyResponse = await axios.get(`${currentBaseUrl}/api/company-details`);
      if (companyResponse.data.companyDetails && companyResponse.data.companyDetails.length > 0) {
        setCompanyTaxRate(companyResponse.data.companyDetails[0].taxPercentage || 0);
        console.log("DEBUG: targetCompanies:", targetCompanies, "fetchData completed.");
      }

      return cvs;
    } catch (error) {
      setWarningMessage(`Error fetching data: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchItemData = async (currentBaseUrl, customVars = []) => {
    if (location.state?.formData) {
      const returnedData = location.state.formData;
      setFormData(returnedData);
      // Robust initialization with fallbacks and trimming
      const pricedBranches = returnedData.branch_prices ? Object.keys(returnedData.branch_prices).filter(k => returnedData.branch_prices[k] !== undefined && returnedData.branch_prices[k] !== null && returnedData.branch_prices[k] !== "") : [];
      const initialBranches = (returnedData.branch_names || []).concat(pricedBranches).concat(returnedData.branch_name ? [returnedData.branch_name] : []).concat(returnedData.branch ? [returnedData.branch] : []).map(b => b.trim());
      setBranchNames([...new Set(initialBranches)]);
      const initialPrices = returnedData.branch_prices || (returnedData.branch_name ? { [returnedData.branch_name]: returnedData.price_list_rate || 0 } : {});
      setBranchPrices(initialPrices);


      // Restore image previews from the returned formData
      setImagePreviews({
        item: getImageUrl(returnedData.image, currentBaseUrl),
        spicy: getImageUrl(returnedData.spicy?.spicy_image, currentBaseUrl),
        non_spicy: getImageUrl(returnedData.spicy?.non_spicy_image, currentBaseUrl),
        multiple: returnedData.images ? returnedData.images.map((img) => getImageUrl(img, currentBaseUrl)) : [],
        custom_variant_images: returnedData.custom_variants?.reduce(
          (acc, variant) => ({
            ...acc,
            ...variant.subheadings.reduce(
              (subAcc, sub) => ({
                ...subAcc,
                [`${variant._id}_${sub.name}_image`]: getImageUrl(sub.image, currentBaseUrl),
              }),
              {}
            ),
          }),
          {}
        ) || {},
      });
    } else if ((isEditing || isGalleryImport) && itemToEdit) {
      try {
        const nutritionResponse = await axios.get(
          `${currentBaseUrl}/api/items/nutrition/${encodeURIComponent(itemToEdit.item_name)}?type=item&item_id=${itemToEdit._id}`,
          { headers: getHeaders() }
        );

        // Robust initialization of branch context for filtering
        const pricedBranchesEdit = itemToEdit.branch_prices ? Object.keys(itemToEdit.branch_prices).filter(k => itemToEdit.branch_prices[k] !== undefined && itemToEdit.branch_prices[k] !== null && itemToEdit.branch_prices[k] !== "") : [];
        const initialBranches = (itemToEdit.branch_names || []).concat(pricedBranchesEdit).concat(itemToEdit.branch_name ? [itemToEdit.branch_name] : []).concat(itemToEdit.branch ? [itemToEdit.branch] : []).map(b => b.trim());

        // Use fresh local values for filtering to avoid race conditions with state updates
        const userStr = localStorage.getItem("user");
        let effectiveUserBranch = userBranch;
        let effectiveIsCompanyAdmin = isCompanyAdmin;

        if (userStr) {
          const userObj = JSON.parse(userStr);
          effectiveUserBranch = userObj.branch_name || userObj.branch || "";
          effectiveIsCompanyAdmin = ['company_admin', 'superadmin', 'admin'].includes(userObj.role?.toLowerCase()) && (!effectiveUserBranch || effectiveUserBranch === 'All Branches');
        }

        const currentItemBranches = effectiveIsCompanyAdmin ? (initialBranches || []) : (effectiveUserBranch ? [effectiveUserBranch] : []);

        const filterByBranch = (list) => {
          if (effectiveIsCompanyAdmin) return list; // Admins see everything
          return list.filter(item => {
            const itemBranches = (item.branch_names || []).concat(item.branch_name ? [item.branch_name] : []).concat(item.branch ? [item.branch] : []);
            return itemBranches.length === 0 || itemBranches.some(b => currentItemBranches.some(cb => matchTenancy(cb, b)));
          });
        };

        // Relaxed filtering for Editor Mode: Show all assigned sub-items regardless of branch filter
        const filteredAddonsInEdit = itemToEdit.addons || [];
        const filteredCombosInEdit = itemToEdit.combos || [];

        const fetchedIngredients = nutritionResponse.data?.ingredients || [];
        const formattedIngredients =
          Array.isArray(fetchedIngredients) && fetchedIngredients.length > 0
            ? fetchedIngredients.map((ing) => ({
              ingredients_name: ing.name || "",
              small: ing.small || 0,
              medium: ing.medium || 0,
              large: ing.large || 0,
              weight: ing.weight || 0,
              nutrition: Array.isArray(ing.nutrition)
                ? ing.nutrition.map((nut) => ({
                  nutrition_name: nut.nutrition_name || "",
                  nutrition_value: nut.nutrition_value || 0,
                }))
                : [],
            }))
            : initialFormState.ingredients;
        const updatedAddons = await Promise.all(
          (filteredAddonsInEdit).map(async (addon, index) => {
            try {
              const addonNutritionResponse = await axios.get(
                `${currentBaseUrl}/api/items/nutrition/${encodeURIComponent(addon.name1)}?type=addon&item_id=${itemToEdit._id}&index=${index}`,
                { headers: getHeaders() }
              );

              const addonIngredients = addonNutritionResponse.data?.ingredients || [];
              return {
                ...addon,
                tax_applicable: addon.tax_applicable || false,
                tax_rate: addon.tax_rate || 0,
                kitchen: addon.kitchen || itemToEdit.kitchen,
                custom_variants: addon.custom_variants || [],
                ingredients:
                  addonIngredients.length > 0
                    ? addonIngredients.map((ing) => ({
                      ingredients_name: ing.name || "",
                      small: ing.small || 0,
                      medium: ing.medium || 0,
                      large: ing.large || 0,
                      weight: ing.weight || 0,
                      nutrition: Array.isArray(ing.nutrition)
                        ? ing.nutrition.map((nut) => ({
                          nutrition_name: nut.nutrition_name || "",
                          nutrition_value: nut.nutrition_value || 0,
                        }))
                        : [],
                    }))
                    : addon.ingredients || [
                      { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
                    ],
                branch_names: (addon.branch_names && addon.branch_names.length > 0) ? addon.branch_names : (addon.branch_name ? [addon.branch_name] : (addon.branch ? [addon.branch] : [])),
                branch_prices: addon.branch_prices || {},
                company_prices: addon.company_prices || {}, // Load per-company prices for addons
              };
            } catch (error) {
              return {
                ...addon,
                tax_applicable: addon.tax_applicable || false,
                tax_rate: addon.tax_rate || 0,
                kitchen: addon.kitchen || itemToEdit.kitchen,
                custom_variants: addon.custom_variants || [],
                ingredients: addon.ingredients || [
                  { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
                ],
                branch_names: (addon.branch_names && addon.branch_names.length > 0) ? addon.branch_names : (addon.branch_name ? [addon.branch_name] : (addon.branch ? [addon.branch] : [])),
                branch_prices: addon.branch_prices || {},
              };
            }
          })
        );
        const updatedCombos = await Promise.all(
          (filteredCombosInEdit).map(async (combo, index) => {
            try {
              const comboNutritionResponse = await axios.get(
                `${currentBaseUrl}/api/items/nutrition/${encodeURIComponent(combo.name1)}?type=combo&item_id=${itemToEdit._id}&index=${index}`,
                { headers: getHeaders() }
              );

              const comboIngredients = comboNutritionResponse.data?.ingredients || [];
              return {
                ...combo,
                tax_applicable: combo.tax_applicable || false,
                tax_rate: combo.tax_rate || 0,
                kitchen: combo.kitchen || itemToEdit.kitchen,
                custom_variants: combo.custom_variants || [],
                ingredients:
                  comboIngredients.length > 0
                    ? comboIngredients.map((ing) => ({
                      ingredients_name: ing.name || "",
                      small: ing.small || 0,
                      medium: ing.medium || 0,
                      large: ing.large || 0,
                      weight: ing.weight || 0,
                      nutrition: Array.isArray(ing.nutrition)
                        ? ing.nutrition.map((nut) => ({
                          nutrition_name: nut.nutrition_name || "",
                          nutrition_value: nut.nutrition_value || 0,
                        }))
                        : [],
                    }))
                    : combo.ingredients || [
                      { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
                    ],
                branch_names: (combo.branch_names && combo.branch_names.length > 0) ? combo.branch_names : (combo.branch_name ? [combo.branch_name] : (combo.branch ? [combo.branch] : [])),
                branch_prices: combo.branch_prices || {},
                company_prices: combo.company_prices || {}, // Load per-company prices for combos
              };
            } catch (error) {
              return {
                ...combo,
                tax_applicable: combo.tax_applicable || false,
                tax_rate: combo.tax_rate || 0,
                kitchen: combo.kitchen || itemToEdit.kitchen,
                custom_variants: combo.custom_variants || [],
                ingredients: combo.ingredients || [
                  { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
                ],
                branch_names: (combo.branch_names && combo.branch_names.length > 0) ? combo.branch_names : (combo.branch_name ? [combo.branch_name] : (combo.branch ? [combo.branch] : [])),
                branch_prices: combo.branch_prices || {},
                company_prices: combo.company_prices || {},
              };
            }
          })
        );
        const updatedFormData = {
          ...initialFormState,
          ...itemToEdit,
          tax_applicable: itemToEdit.tax_applicable || false,
          tax_rate: itemToEdit.tax_rate || 0,
          image: extractImageName(itemToEdit.image) || "",
          images: itemToEdit.images || [],
          has_offer: !!itemToEdit.offer_price || !!itemToEdit.offer_start_time || !!itemToEdit.offer_end_time,
          offer_price: itemToEdit.offer_price || "",
          offer_start_time: itemToEdit.offer_start_time ? itemToEdit.offer_start_time.slice(0, 16) : "",
          offer_end_time: itemToEdit.offer_end_time ? itemToEdit.offer_end_time.slice(0, 16) : "",
          selectedVariant: "",
          variants: {
            size: itemToEdit.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
            cold: itemToEdit.cold || { enabled: false, ice_preference: "without_ice", ice_price: 0 },
            spicy: itemToEdit.spicy || {
              enabled: false,
              is_spicy: false,
              spicy_price: 0,
              spicy_image: "",
              non_spicy_price: 0,
              non_spicy_image: "",
            },
            sugar: itemToEdit.sugar || { enabled: false, level: "medium" },
          },
          custom_variants: itemToEdit.custom_variants || [],
          addons: updatedAddons,
          combos: updatedCombos,
          ingredients: formattedIngredients,
        };

        // Load dynamic image previews
        const dynamicPreviews = {};
        doctypeFields.forEach(f => {
          if (f.type === 'Attach Image' && itemToEdit[f.id]) {
            dynamicPreviews[f.id] = getImageUrl(itemToEdit[f.id], currentBaseUrl);
          }
        });
        setImagePreviews(prev => ({ ...prev, ...dynamicPreviews }));

        setFormData(updatedFormData);
        // Use the already calculated initialBranches
        setBranchNames([...new Set(initialBranches)]);
        const initialPrices = itemToEdit.branch_prices || (itemToEdit.branch_name ? { [itemToEdit.branch_name]: itemToEdit.price_list_rate || 0 } : {});
        setBranchPrices(initialPrices);


        // Sync custom variants with global definitions
        if (customVars && customVars.length > 0) {
          updatedFormData.custom_variants = updatedFormData.custom_variants.map((savedVariant) => {
            const globalVariant = customVars.find((v) => v._id === savedVariant._id);
            if (globalVariant) {
              return {
                ...savedVariant,
                heading: globalVariant.heading,
                activeSection: globalVariant.activeSection,
                subheadings: globalVariant.subheadings.map((globalSub) => {
                  const savedSub = savedVariant.subheadings.find((s) => s.name === globalSub.name);
                  if (savedSub) {
                    return { ...globalSub, ...savedSub, dropdown: globalSub.dropdown };
                  }
                  return {
                    name: globalSub.name,
                    price: globalSub.price,
                    image: globalSub.image,
                    dropdown: globalSub.dropdown,
                  };
                }),
              };
            }
            return savedVariant;
          });
        }
        setFormData(updatedFormData);
        setImagePreviews({
          item: getImageUrl(itemToEdit.image, currentBaseUrl),
          spicy: getImageUrl(itemToEdit.spicy?.spicy_image, currentBaseUrl),
          non_spicy: getImageUrl(itemToEdit.spicy?.non_spicy_image, currentBaseUrl),
          multiple: Array.isArray(itemToEdit.images) ? itemToEdit.images.map((img) => getImageUrl(img, currentBaseUrl)) : [],
          custom_variant_images: Array.isArray(itemToEdit.custom_variants) ? itemToEdit.custom_variants.reduce(
            (acc, variant) => ({
              ...acc,
              ...variant.subheadings.reduce(
                (subAcc, sub) => ({
                  ...subAcc,
                  [`${variant._id}_${sub.name}_image`]: getImageUrl(sub.image, currentBaseUrl),
                }),
                {}
              ),
            }),
            {}
          ) : {},
        });
      } catch (error) {
        setWarningMessage(`Error fetching nutrition data: ${error.message}`);
        setFormData({
          ...initialFormState,
          ...itemToEdit,
          tax_applicable: itemToEdit.tax_applicable || false,
          tax_rate: itemToEdit.tax_rate || 0,
          image: extractImageName(itemToEdit.image) || "",
          images: itemToEdit.images || [],
          has_offer: !!itemToEdit.offer_price || !!itemToEdit.offer_start_time || !!itemToEdit.offer_end_time,
          offer_price: itemToEdit.offer_price || "",
          offer_start_time: itemToEdit.offer_start_time ? itemToEdit.offer_start_time.slice(0, 16) : "",
          offer_end_time: itemToEdit.offer_end_time ? itemToEdit.offer_end_time.slice(0, 16) : "",
          selectedVariant: "",
          variants: {
            size: itemToEdit.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
            cold: itemToEdit.cold || { enabled: false, ice_preference: "without_ice", ice_price: 0 },
            spicy: itemToEdit.spicy || {
              enabled: false,
              is_spicy: false,
              spicy_price: 0,
              spicy_image: "",
              non_spicy_price: 0,
              non_spicy_image: "",
            },
            sugar: itemToEdit.sugar || { enabled: false, level: "medium" },
          },
          custom_variants: itemToEdit.custom_variants || [],
          addons: itemToEdit.addons?.map((addon) => ({
            ...addon,
            tax_applicable: addon.tax_applicable || false,
            tax_rate: addon.tax_rate || 0,
            kitchen: addon.kitchen || itemToEdit.kitchen,
            custom_variants: addon.custom_variants || [],
            ingredients: addon.ingredients || [
              { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
            ],
            branch_names: addon.branch_names || (addon.branch_name ? [addon.branch_name] : []),
            branch_prices: addon.branch_prices || {},
            company_prices: addon.company_prices || {},
          })) || [],
          combos: itemToEdit.combos?.map((combo) => ({
            ...combo,
            tax_applicable: combo.tax_applicable || false,
            tax_rate: combo.tax_rate || 0,
            kitchen: combo.kitchen || itemToEdit.kitchen,
            custom_variants: combo.custom_variants || [],
            ingredients: combo.ingredients || [
              { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
            ],
            branch_names: combo.branch_names || (combo.branch_name ? [combo.branch_name] : []),
            branch_prices: combo.branch_prices || {},
          })) || [],
          ingredients: initialFormState.ingredients,
        });

        // Initialize branch assignment states in catch block too
        const editPricedBranches = itemToEdit.branch_prices ? Object.keys(itemToEdit.branch_prices).filter(k => itemToEdit.branch_prices[k] !== undefined && itemToEdit.branch_prices[k] !== null && itemToEdit.branch_prices[k] !== "") : [];
        setBranchNames([...new Set([...(itemToEdit.branch_names || []), ...editPricedBranches])]);
        setBranchPrices(itemToEdit.branch_prices || {});

        setImagePreviews({
          item: getImageUrl(itemToEdit.image, currentBaseUrl),
          spicy: getImageUrl(itemToEdit.spicy?.spicy_image, currentBaseUrl),
          non_spicy: getImageUrl(itemToEdit.spicy?.non_spicy_image, currentBaseUrl),
          multiple: Array.isArray(itemToEdit.images) ? itemToEdit.images.map((img) => getImageUrl(img, currentBaseUrl)) : [],
          custom_variant_images: Array.isArray(itemToEdit.custom_variants) ? itemToEdit.custom_variants.reduce(
            (acc, variant) => ({
              ...acc,
              ...variant.subheadings.reduce(
                (subAcc, sub) => ({
                  ...subAcc,
                  [`${variant._id}_${sub.name}_image`]: getImageUrl(sub.image, currentBaseUrl),
                }),
                {}
              ),
            }),
            {}
          ) : {},
        });
      }
    } else {
      setFormData(initialFormState);
      setImagePreviews({
        item: "",
        spicy: "",
        non_spicy: "",
        multiple: [],
        custom_variant_images: {},
      });
    }
  };

  // Helper functions for refreshing data and creating new entries
  const refreshKitchens = async () => {
    try {
      const token = localStorage.getItem("token");
      if (isFromGallery) {
        const res = await axios.get(`${baseUrl}/api/kitchen-gallery`, { headers: { Authorization: `Bearer ${token}` } });
        setKitchens(res.data.kitchens || []);
        return;
      }
      const active_company = localStorage.getItem("active_company");
      let targetCompanies;
      if (selectedCompanies && selectedCompanies.length > 0) {
        targetCompanies = [...selectedCompanies];
      } else if (active_company === "All") {
        targetCompanies = [];
      } else {
        targetCompanies = [active_company || userCompany];
      }

      const promises = targetCompanies.map((comp) =>
        axios.get(`${baseUrl}/api/kitchens`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Company-Name": comp,
            "X-Branch-Name": userBranch || "",
          },
        })
      );
      const results = await Promise.all(promises);
      const all = results.flatMap((res) => res.data);
      const unique = Array.from(new Map(all.map((k) => [k.kitchen_name, k])).values());
      setKitchens(unique);
    } catch (error) {
      console.error("Failed to refresh kitchens:", error);
    }
  };

  const refreshItemGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      if (isFromGallery) {
        const res = await axios.get(`${baseUrl}/api/item-group-gallery`, { headers: { Authorization: `Bearer ${token}` } });
        setItemGroups(res.data.item_groups || []);
        return;
      }
      const active_company = localStorage.getItem("active_company");
      let targetCompanies;
      if (selectedCompanies && selectedCompanies.length > 0) {
        targetCompanies = [...selectedCompanies];
      } else if (active_company === "All") {
        targetCompanies = [];
      } else {
        targetCompanies = [active_company || userCompany];
      }

      const promises = targetCompanies.map((comp) =>
        axios.get(`${baseUrl}/api/item-groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Company-Name": comp,
            "X-Branch-Name": userBranch || "",
          },
        })
      );
      const results = await Promise.all(promises);
      const all = results.flatMap((res) => res.data);
      const unique = Array.from(new Map(all.map((k) => [k.group_name, k])).values());
      setItemGroups(unique);
    } catch (error) {
      console.error("Failed to refresh item groups:", error);
    }
  };

  const handleCreateNewKitchen = async (nameFromSelect = null) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to create kitchens.");
      setShowPermModal(true);
      return;
    }
    const nameToCreate = nameFromSelect || newKitchenName;
    if (!nameToCreate || !nameToCreate.trim()) {
      setWarningMessage("Kitchen name is required");
      return;
    }
    try {
      const activeContext = localStorage.getItem('active_company');
      const activeBranchLoc = localStorage.getItem('active_branch') || 'All Branches';

      let companiesToProcess = [];
      if (selectedCompanies && selectedCompanies.length > 0) {
        companiesToProcess = [...selectedCompanies];
      } else if (activeContext && activeContext !== "All") {
        companiesToProcess = [activeContext];
      } else if (userCompany && userCompany !== "All") {
        companiesToProcess = [userCompany];
      }

      let branchesToProcess = [...branchNames]; // Use outer state
      if (branchesToProcess.length === 0 && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All') {
        branchesToProcess = [activeBranchLoc];
      }

      let successCount = 0;
      let errors = [];

      try {
        const payload = {
          kitchen_name: nameToCreate.trim(),
          ...newKitchenFields,
          company_names: companiesToProcess.length > 0 ? companiesToProcess : undefined,
          branch_names: branchesToProcess.length > 0 ? branchesToProcess : undefined,
          company_name: companiesToProcess.length > 0 ? companiesToProcess[0] : undefined,
          branch_name: branchesToProcess.length > 0 ? branchesToProcess[0] : undefined
        };

        const headers = getHeaders();
        if (companiesToProcess.length > 0) headers['X-Company-Name'] = companiesToProcess[0];

        if (isFromGallery) {
          await axios.post(`${baseUrl}/api/kitchen-gallery`, payload, { headers });
        } else {
          await axios.post(`${baseUrl}/api/kitchens`, payload, { headers });
        }
        successCount = companiesToProcess.length || 1;
      } catch (err) {
        errors.push(`Global: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setWarningMessage(`Kitchen created successfully for ${successCount} company(ies)!`);
        setFormData(prev => {
          const current = Array.isArray(prev.kitchen) ? prev.kitchen : (prev.kitchen ? [prev.kitchen] : []);
          return { ...prev, kitchen: [...new Set([...current, nameToCreate.trim()])] };
        });
        await refreshKitchens();
      } else {
        setWarningMessage(`Failed to create kitchen: ${errors.join(", ")}`);
      }

      setNewKitchenName("");
      setNewKitchenValue("");
      setShowNewKitchenModal(false);

      if (!nameFromSelect) {
        setTimeout(() => {
          const kitchenField = document.getElementById('field-kitchen');
          if (kitchenField) {
            const nextField = kitchenField.closest('.form-group')?.nextElementSibling;
            if (nextField) {
              nextField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = nextField.querySelector('input, select, textarea');
              if (input) input.focus();
            }
          }
        }, 500);
      }

    } catch (error) {
      setWarningMessage(`Critical error creating kitchen: ${error.message}`);
    }
  };

  const handleCreateNewItemGroup = async (nameFromSelect = null) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to create item groups.");
      setShowPermModal(true);
      return;
    }
    if (!newItemGroupName || !newItemGroupName.trim()) {
      setWarningMessage("Item group name is required");
      return;
    }
    try {
      const activeContext = localStorage.getItem('active_company');
      const activeBranchLoc = localStorage.getItem('active_branch') || 'All Branches';

      let companiesToProcess = [];
      if (selectedCompanies && selectedCompanies.length > 0) {
        companiesToProcess = [...selectedCompanies];
      } else if (activeContext && activeContext !== "All") {
        companiesToProcess = [activeContext];
      } else if (userCompany && userCompany !== "All") {
        companiesToProcess = [userCompany];
      }

      let branchesToProcess = [...branchNames]; // Use outer state
      if (branchesToProcess.length === 0 && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All') {
        branchesToProcess = [activeBranchLoc];
      }

      let successCount = 0;
      let errors = [];

      try {
        const payload = {
          group_name: newItemGroupName.trim(),
          ...newItemGroupFields,
          company_names: companiesToProcess.length > 0 ? companiesToProcess : undefined,
          branch_names: branchesToProcess.length > 0 ? branchesToProcess : undefined,
          company_name: companiesToProcess.length > 0 ? companiesToProcess[0] : undefined,
          branch_name: branchesToProcess.length > 0 ? branchesToProcess[0] : undefined
        };

        const headers = getHeaders();
        if (companiesToProcess.length > 0) headers['X-Company-Name'] = companiesToProcess[0];

        if (isFromGallery) {
          await axios.post(`${baseUrl}/api/item-group-gallery`, payload, { headers });
        } else {
          await axios.post(`${baseUrl}/api/item-groups`, payload, { headers });
        }
        successCount = companiesToProcess.length || 1;
      } catch (err) {
        errors.push(`Global: ${err.response?.data?.error || err.message}`);
      }

      if (successCount > 0) {
        setWarningMessage(`Item group created successfully for ${successCount} company(ies)!`);
        setFormData(prev => ({ ...prev, item_group: newItemGroupName.trim() }));
        await refreshItemGroups();
      } else {
        setWarningMessage(`Failed to create item group: ${errors.join(", ")}`);
      }

      setNewItemGroupName("");
      setShowNewItemGroupModal(false);
    } catch (error) {
      setWarningMessage(`Critical error creating item group: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!configLoading) {
      const url = baseUrl || "";

      const promises = [
        fetchPermissions(url),
        fetchCompanies(url),
        fetchData(url).then(cvs => {
          // fetchData returns custom variants (cvs), which are needed by fetchItemData
          if (location.state?.formData || (isEditing || isGalleryImport) && itemToEdit) {
            return fetchItemData(url, cvs);
          }
          return Promise.resolve(); // Resolve immediately if not editing and no form data
        })
      ];

      Promise.all(promises);
    }
  }, [configLoading, baseUrl, location.state, isEditing, isGalleryImport, itemToEdit]);

  // Combined Reactive Effect: Fetch dropdown data when company selection, load state, or baseUrl resolves/changes
  useEffect(() => {
    if (!configLoading && selectedCompanies.length > 0 && baseUrl) {
      console.log("Re-triggering fetchData due to company selection, load state, or baseUrl change");
      fetchData(baseUrl);
    }
  }, [selectedCompanies, configLoading, baseUrl]);

  // Dedicated Branch Fetching Effect: Guaranteed to fetch branches cleanly without race conditions
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
        const isGlobal = (c) => globalTags.includes(c);

        // Use companyOptions as the absolute source of truth for aggressive branch fetching
        const allTargetCompanies = companyOptions.filter(c => c && !isGlobal(c));

        if (allTargetCompanies.length === 0) return;

        const branchPromises = allTargetCompanies.map((comp) =>
          axios.get(`${baseUrl || ''}/api/branches?company_name=${encodeURIComponent(comp)}`, {
            headers: { ...getHeaders(), "X-Company-Name": comp },
          }).then(res => ({ comp, data: res.data }))
        );

        const results = await Promise.all(branchPromises);
        const newCompanyBranchesMap = {};
        const allBranches = [];

        results.forEach((res) => {
          const branches = res.data.map((b) => (typeof b === "string" ? b : b.branch_name || b.branch || b.name || "")).filter(b => b);
          newCompanyBranchesMap[res.comp] = branches;
          allBranches.push(...branches);
        });

        setCompanyBranchesMap(newCompanyBranchesMap);
        setAvailableBranches([...new Set(allBranches)]);
      } catch (err) {
        console.warn("Failed to proactively fetch branches.", err);
      }
    };

    if (companyOptions.length > 0) {
      fetchBranches();
    }
  }, [companyOptions, baseUrl]);

  useEffect(() => {
    if (location.state?.editSubItem && !initialSubItemOpened && !loading && !permsLoading) {
      const { type, index } = location.state.editSubItem;
      if (formData[type] && formData[type][index]) {
        openModal(type, index);
        setInitialSubItemOpened(true);
      }
    }
  }, [formData, loading, permsLoading, location.state, initialSubItemOpened]);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => {
      let updated = { ...prev, [name]: newValue };
      if (name === "tax_applicable") {
        if (newValue && !prev.tax_rate) {
          updated.tax_rate = companyTaxRate;
        } else if (!newValue) {
          updated.tax_rate = 0;
        }
      }
      if (name === "has_offer" && !newValue) {
        updated.offer_price = "";
        updated.offer_start_time = "";
        updated.offer_end_time = "";
      }
      return updated;
    });

    if (name === "price_list_rate") {
      const rateVal = Number(newValue) || 0;
      const activeBranchLoc = localStorage.getItem('active_branch');
      const userStrLoc = localStorage.getItem('user');
      let userObjLoc = {};
      try { if (userStrLoc) userObjLoc = JSON.parse(userStrLoc); } catch (_) { }
      const effectiveBranchLoc = (activeBranchLoc && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All') ? activeBranchLoc : (userObjLoc.branch_name || userObjLoc.branch || "");
      if (effectiveBranchLoc) {
        setBranchPrices(prev => ({ ...prev, [effectiveBranchLoc]: rateVal }));
      }

      const activeCompanyLoc = localStorage.getItem('active_company');
      const effectiveCompanyLoc = (activeCompanyLoc && activeCompanyLoc !== 'All') ? activeCompanyLoc : (userObjLoc.company_name || userObjLoc.company || "");
      if (effectiveCompanyLoc) {
        setCompanyPrices(prev => ({ ...prev, [effectiveCompanyLoc]: rateVal }));
      }
    }
  };
  const handleNumericInputFocus = (e, defaultValue = 0) => {
    if (e.target.value === String(defaultValue)) {
      e.target.value = "";
    }
  };
  const handleNumericInputBlur = (e, name, defaultValue = 0) => {
    const value = e.target.value;
    if (value === "" || isNaN(value)) {
      setFormData((prev) => ({ ...prev, [name]: defaultValue }));
      e.target.value = String(defaultValue);
    } else {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    }
  };
  const handleVariantFieldChange = (variant, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [variant]: { ...prev.variants[variant], [field]: Number(value) || value },
      },
    }));
  };
  const handleVariantNumericFieldFocus = (e, variant, field) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };
  const handleVariantNumericFieldBlur = (e, variant, field) => {
    const value = e.target.value;
    if (value === "" || isNaN(value)) {
      setFormData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          [variant]: { ...prev.variants[variant], [field]: 0 },
        },
      }));
      e.target.value = "0";
    } else {
      handleVariantFieldChange(variant, field, value);
    }
  };
  const handleNestedChange = (field, index, key, value) => {
    setFormData((prev) => {
      const updated = [...prev[field]];
      updated[index][key] =
        key.includes("price") || key.includes("calories") || key.includes("protein") ? Number(value) : value;
      return { ...prev, [field]: updated };
    });
  };
  const handleNestedNumericFocus = (e, field, index, key) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };
  const handleNestedNumericBlur = (e, field, index, key) => {
    const value = e.target.value;
    if (value === "" || isNaN(value)) {
      setFormData((prev) => {
        const updated = [...prev[field]];
        updated[index][key] = 0;
        return { ...prev, [field]: updated };
      });
      e.target.value = "0";
    } else {
      handleNestedChange(field, index, key, value);
    }
  };
  const addNewEntry = (field, template) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], template],
    }));
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageUpload = async (e, field, subField = null, variantId = null, subheading = null) => {
    if (field === "images") {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const newImages = [];
      setLoading(true);

      try {
        await Promise.all(
          files.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                newImages.push(reader.result);
                resolve();
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newImages],
        }));
        setImagePreviews((prev) => ({
          ...prev,
          multiple: [...prev.multiple, ...newImages],
        }));
      } catch (error) {
        console.error("Error reading files:", error);
        setWarningMessage("Failed to upload some images.");
      } finally {
        setLoading(false);
      }
      e.target.value = ""; // Reset input
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setOriginalFile(file);
    const localUrl = URL.createObjectURL(file);
    setCurrentImageToCrop(localUrl);
    setCropTarget({ field, subField, variantId, subheading });
    setCropModalOpen(true);
    setZoom(1);
    setTargetSize({ width: 768, height: 768 });
    setAspect(1);
    e.target.value = "";
  };

  const handleEditImage = (imageUrl, field, subField = null, variantId = null, subheading = null, isModal = false, index = null) => {
    if (!imageUrl) return;
    setCurrentImageToCrop(imageUrl);
    setCropTarget({ field, subField, variantId, subheading, isModal, index });
    setOriginalFile(null);
    setCropModalOpen(true);
    setZoom(1);
    setTargetSize({ width: 768, height: 768 });
    setAspect(1);
  };

  const handleCropSave = async () => {
    if (!currentImageToCrop || !croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(
        currentImageToCrop,
        croppedAreaPixels,
        targetSize.width,
        targetSize.height
      );

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;

        // Modal update logic
        if (cropTarget.isModal) {
          // For Modal, variantId is actually 'variant' key, subField is the field name
          const { variantId: variant, subField } = cropTarget;

          // Logic adapted from handleModalImageUpload/handleModalImageDelete
          // Updating modalState
          setModalState(prev => ({
            ...prev,
            data: {
              ...prev.data,
              image: !subField ? result : prev.data.image, // We store result as image directly for Base64
              imagePreview: !subField ? result : prev.data.imagePreview,
              ...(subField && {
                variants: {
                  ...prev.data.variants,
                  [variant]: {
                    ...prev.data.variants[variant],
                    [subField]: result, // Store result directly
                    [subField + 'Temp']: null
                  }
                }
              })
            }
          }));
        } else {
          // Main Form update logic
          const { field, subField, variantId, subheading, index } = cropTarget;

          if (field === "image") {
            setFormData(prev => ({ ...prev, image: result }));
            setImagePreviews(prev => ({ ...prev, item: result }));
          } else if (field === "images") {
            if (index !== null) {
              setFormData(prev => {
                const newImages = [...prev.images];
                newImages[index] = result;
                return { ...prev, images: newImages };
              });
              setImagePreviews(prev => {
                const newMultiple = [...prev.multiple];
                newMultiple[index] = result;
                return { ...prev, multiple: newMultiple };
              });
            } else {
              setFormData(prev => ({ ...prev, images: [...prev.images, result] }));
              setImagePreviews(prev => ({ ...prev, multiple: [...prev.multiple, result] }));
            }
          } else if (subField === "spicy_image") {
            setFormData(prev => ({
              ...prev,
              variants: {
                ...prev.variants,
                spicy: { ...prev.variants.spicy, spicy_image: result },
              },
            }));
            setImagePreviews(prev => ({ ...prev, spicy: result }));
          } else if (subField === "non_spicy_image") {
            setFormData(prev => ({
              ...prev,
              variants: {
                ...prev.variants,
                spicy: { ...prev.variants.spicy, non_spicy_image: result },
              },
            }));
            setImagePreviews(prev => ({ ...prev, non_spicy: result }));
          } else if (subField === "customVariantImage") {
            setFormData(prev => ({
              ...prev,
              custom_variants: prev.custom_variants.map((variant) =>
                variant._id === variantId
                  ? {
                    ...variant,
                    subheadings: variant.subheadings.map((sub) =>
                      sub.name === subheading ? { ...sub, image: result } : sub
                    ),
                  }
                  : variant
              ),
            }));
            setImagePreviews(prev => ({
              ...prev,
              custom_variant_images: {
                ...prev.custom_variant_images,
                [`${variantId}_${subheading}_image`]: result,
              },
            }));
          } else {
            // Dynamic Doctype Field
            setFormData(prev => ({ ...prev, [field]: result }));
            setImagePreviews(prev => ({ ...prev, [field]: result }));
          }
        }
      };
      reader.readAsDataURL(croppedImageBlob);

      setCropModalOpen(false);
      setCurrentImageToCrop(null);
      setOriginalFile(null);
    } catch (error) {
      console.error("Crop failed:", error);
      setWarningMessage("Failed to crop image.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (field, subField = null, index = null, variantId = null, subheading = null) => {
    let filename;
    let oldPreview;
    let updateFormData;
    let updatePreview;
    if (subField === "customVariantImage") {
      const variant = formData.custom_variants.find((v) => v._id === variantId);
      filename = variant?.subheadings.find((sub) => sub.name === subheading)?.image;
      oldPreview = imagePreviews.custom_variant_images[`${variantId}_${subheading}_image`];
      if (!filename) return;
      updateFormData = () => setFormData(prev => ({
        ...prev,
        custom_variants: prev.custom_variants.map((variant) =>
          variant._id === variantId
            ? {
              ...variant,
              subheadings: variant.subheadings.map((sub) =>
                sub.name === subheading ? { ...sub, image: "" } : sub
              ),
            }
            : variant
        ),
      }));
      updatePreview = () => setImagePreviews(prev => ({
        ...prev,
        custom_variant_images: {
          ...prev.custom_variant_images,
          [`${variantId}_${subheading}_image`]: "",
        },
      }));
    } else if (subField) {
      filename = formData.variants[field][subField];
      oldPreview = subField === "spicy_image" ? imagePreviews.spicy : imagePreviews.non_spicy;
      if (!filename) return;
      updateFormData = () => setFormData(prev => ({
        ...prev,
        variants: {
          ...prev.variants,
          [field]: { ...prev.variants[field], [subField]: "" },
        },
      }));
      updatePreview = () => setImagePreviews(prev => ({
        ...prev,
        [subField === "spicy_image" ? "spicy" : "non_spicy"]: "",
      }));
    } else if (field === "images" && index !== null) {
      filename = formData.images[index];
      oldPreview = imagePreviews.multiple[index];
      if (!filename) return;
      updateFormData = () => setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
      updatePreview = () => setImagePreviews(prev => ({
        ...prev,
        multiple: prev.multiple.filter((_, i) => i !== index),
      }));
    } else {
      filename = formData[field];
      oldPreview = field === "image" ? imagePreviews.item : (imagePreviews[field] || "");
      if (!filename) return;
      updateFormData = () => setFormData(prev => ({ ...prev, [field]: "" }));
      updatePreview = () => setImagePreviews(prev => ({ ...prev, [field]: "" }));
    }
    // Optimistic update: remove immediately
    updateFormData();
    updatePreview();

    // Check if the image is actually saved in the backend (i.e., exists in itemToEdit)
    // If it's a new image (not in itemToEdit), it's not in the DB, so api/delete-image will return 404.
    // In that case, we can skip the API call (the file remains on server as orphan, or we need a different API).
    // For now, we just skip the error to satisfy the user requirement.
    let isSavedInBackend = false;
    if (itemToEdit) {
      const savedImageName = (img) => img ? extractImageName(img) : "";

      if (subField === "customVariantImage") {
        const variant = itemToEdit.custom_variants?.find((v) => v._id === variantId);
        const sub = variant?.subheadings.find((s) => s.name === subheading);
        if (sub && savedImageName(sub.image) === filename) {
          isSavedInBackend = true;
        }
      } else if (subField) {
        // spicy_image or non_spicy_image
        if (field === "variants" && itemToEdit.variants && itemToEdit.variants[field === "variants" ? "spicy" : field]) {
          // field is 'variants', subField is 'spicy_image', accessed as formData.variants.spicy.spicy_image
          // itemToEdit structure matches formData usually
          // Actually, in formData it is variants.spicy.spicy_image.
          // in itemToEdit it is likely variants.spicy.spicy_image too.
          // Let's check safely.
          const variantKey = subField.includes("spicy") ? "spicy" : "";
          if (variantKey && itemToEdit.variants[variantKey]) {
            if (savedImageName(itemToEdit.variants[variantKey][subField]) === filename) {
              isSavedInBackend = true;
            }
          }
        }
      } else if (field === "images" && index !== null) {
        // Multiple images
        // itemToEdit.images is array of strings (filenames or paths). 
        // We compare extracted names.
        if (itemToEdit.images && itemToEdit.images.some(img => savedImageName(img) === filename)) {
          isSavedInBackend = true;
        }
      } else {
        // Single image field 'image'
        if (field === "image" && savedImageName(itemToEdit.image) === filename) {
          isSavedInBackend = true;
        }
      }
    }

    if (!isSavedInBackend) {
      // Not saved in backend, so just return (optimistic delete is enough).
      // We set a message to confirm removal from UI.
      setWarningMessage(`${subField ? subField.replace("_", " ") : field} image removed.`);
      return;
    }

    try {
      await axios.delete(`${baseUrl}/api/delete-image/${filename}?field=${subField || field}&item_id=${itemToEdit?._id || "new"}`);
      setWarningMessage(`${subField ? subField.replace("_", " ") : field} image deleted successfully!`);
    } catch (error) {
      // If 404, it means image not found in backend (already deleted or never saved).
      // Treat as success (do not revert).
      if (error.response && error.response.status === 404) {
        setWarningMessage(`${subField ? subField.replace("_", " ") : field} image removed (cleanup).`);
        return;
      }

      // Revert on failure (non-404)
      if (subField === "customVariantImage") {
        setFormData(prev => ({
          ...prev,
          custom_variants: prev.custom_variants.map((variant) =>
            variant._id === variantId
              ? {
                ...variant,
                subheadings: variant.subheadings.map((sub) =>
                  sub.name === subheading ? { ...sub, image: filename } : sub
                ),
              }
              : variant
          ),
        }));
        setImagePreviews(prev => ({
          ...prev,
          custom_variant_images: {
            ...prev.custom_variant_images,
            [`${variantId}_${subheading}_image`]: oldPreview,
          },
        }));
      } else if (subField) {
        setFormData(prev => ({
          ...prev,
          variants: {
            ...prev.variants,
            [field]: { ...prev.variants[field], [subField]: filename },
          },
        }));
        setImagePreviews(prev => ({
          ...prev,
          [subField === "spicy_image" ? "spicy" : "non_spicy"]: oldPreview,
        }));
      } else if (field === "images" && index !== null) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images.slice(0, index), filename, ...prev.images.slice(index + 1)],
        }));
        setImagePreviews(prev => {
          const newMultiple = [...prev.multiple];
          newMultiple.splice(index, 0, oldPreview); // Insert back at index
          return { ...prev, multiple: newMultiple };
        });
      } else {
        setFormData(prev => ({ ...prev, [field]: filename }));
        setImagePreviews(prev => ({ ...prev, [field]: oldPreview }));
      }
      setWarningMessage(`Failed to delete ${subField ? subField.replace("_", " ") : field} image: ${error.message}`);
    }
  };
  const handleVariantSave = (variant) => {
    setWarningMessage("Saved");
    setFormData((prev) => ({
      ...prev,
      selectedVariant: "",
    }));
  };
  const handleCustomVariantSelection = async (variantId) => {
    if (variantId === "create_new") {
      navigate("/create-variant", {
        state: {
          returnPath: location.pathname,
          formData: formData,
        },
        replace: true,
      });
      return;
    }
    if (!variantId) {
      setSelectedCustomVariantDetails(null);
      setSelectedCustomVariantId("");
      return;
    }
    try {
      const response = await axios.get(`${baseUrl}/api/variants/${variantId}`);
      const variantData = response.data;
      setSelectedCustomVariantDetails(variantData);
      setSelectedCustomVariantId(variantId);
      const existingVariant = formData.custom_variants.find((v) => v._id === variantId);
      if (!existingVariant) {
        setFormData((prev) => ({
          ...prev,
          custom_variants: [
            ...prev.custom_variants,
            {
              _id: variantId,
              heading: variantData.heading,
              subheadings: variantData.subheadings.map((sub) => ({
                name: sub.name,
                price: sub.price || null,
                image: sub.image || null,
                dropdown: sub.dropdown || false,
              })),
              activeSection: variantData.activeSection,
              enabled: false,
            },
          ],
        }));
      }
    } catch (error) {
      setWarningMessage("Failed to fetch variant details");
    }
  };
  const handleCustomVariantFieldChange = (variantId, subheading, field, value) => {
    setFormData((prev) => ({
      ...prev,
      custom_variants: prev.custom_variants.map((variant) =>
        variant._id === variantId
          ? {
            ...variant,
            subheadings: variant.subheadings.map((sub) =>
              sub.name === subheading
                ? { ...sub, [field]: field === "price" ? Number(value) || null : value }
                : sub
            ),
          }
          : variant
      ),
    }));
  };
  const handleCustomVariantSave = (variantId) => {
    setWarningMessage("Custom variant saved");
    setSelectedCustomVariantId("");
    setSelectedCustomVariantDetails(null);
  };
  const renderVariantFields = (variant) => {
    if (!variant || !variant.subheadings) return null;
    const activeSection = variant.activeSection;
    if (activeSection === "dropdown") {
      return (
        <div className="form-group">
          <label className="">Select {variant.heading}</label>
          <select className="input">
            {variant.subheadings.map((sub) => (
              <option key={sub.name} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (activeSection === "price") {
      return variant.subheadings.map((sub) => (
        <div key={sub.name} className="form-group">
          <label className="">{`${sub.name} Price`}</label>
          <input
            type="number"
            value={sub.price || ""}
            onChange={(e) => handleCustomVariantFieldChange(variant._id, sub.name, "price", e.target.value)}
            onWheel={disableNumberInputScroll}
            className="input"
            placeholder="Enter price"
            min="0"
            step="0.01"
          />
        </div>
      ));
    } else if (activeSection === "priceAndImage") {
      return variant.subheadings.map((sub) => (
        <div key={sub.name} className="form-group">
          <label className="">{`${sub.name} Price`}</label>
          <input
            type="number"
            value={sub.price || ""}
            onChange={(e) => handleCustomVariantFieldChange(variant._id, sub.name, "price", e.target.value)}
            onWheel={disableNumberInputScroll}
            className="input"
            placeholder="Enter price"
            min="0"
            step="0.01"
          />
          <label className="">
            {`${sub.name} Image`}
            <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
              (Image size should be 768/768px)
            </span>
          </label>
          <input
            type="file"
            accept="image/*"
            name={sub.name}
            onChange={(e) => handleImageUpload(e, "customVariant", "customVariantImage", variant._id, sub.name)}
            className="input"
          />
          {imagePreviews.custom_variant_images[`${variant._id}_${sub.name}_image`] && (
            <div className="image-container">
              <img
                src={imagePreviews.custom_variant_images[`${variant._id}_${sub.name}_image`]}
                alt={`${sub.name} Preview`}
                className="image-preview"
              />
              <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  type="button"
                  className="img-edit-button"
                  onClick={() => handleEditImage(imagePreviews.custom_variant_images[`${variant._id}_${sub.name}_image`], "customVariant", "customVariantImage", variant._id, sub.name)}
                  style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  type="button"
                  className="img-delete-button"
                  onClick={() => handleImageDelete("customVariant", "customVariantImage", null, variant._id, sub.name)}
                  style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ));
    }
    return null;
  };
  // Modal custom variant handlers
  const handleModalCustomVariantSelection = async (variantId) => {
    if (!variantId) {
      setModalState(prev => ({
        ...prev,
        modalCustomSelectedVariantId: "",
        modalCustomSelectedVariantDetails: null
      }));
      return;
    }
    try {
      const response = await axios.get(`${baseUrl}/api/variants/${variantId}`);
      const variantData = response.data;

      setModalState(prev => ({
        ...prev,
        modalCustomSelectedVariantId: variantId,
        modalCustomSelectedVariantDetails: variantData
      }));
      const existingVariant = modalState.data.custom_variants.find(v => v._id === variantId);
      if (!existingVariant) {
        setModalState(prev => ({
          ...prev,
          data: {
            ...prev.data,
            custom_variants: [
              ...prev.data.custom_variants,
              {
                _id: variantId,
                heading: variantData.heading,
                subheadings: variantData.subheadings.map(sub => ({
                  name: sub.name,
                  price: sub.price || null,
                  image: sub.image || null,
                  dropdown: sub.dropdown || false
                })),
                activeSection: variantData.activeSection,
                enabled: false
              }
            ]
          }
        }));
      }
    } catch (error) {
      setWarningMessage("Failed to fetch variant details");
    }
  };
  const handleModalCustomVariantFieldChange = (variantId, subheading, field, value) => {
    setModalState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        custom_variants: prev.data.custom_variants.map(variant =>
          variant._id === variantId ? {
            ...variant,
            subheadings: variant.subheadings.map(sub =>
              sub.name === subheading ? {
                ...sub,
                [field]: field === "price" ? Number(value) || null : value
              } : sub
            )
          } : variant
        )
      }
    }));
  };
  const handleModalCustomVariantSave = () => {
    setWarningMessage("Custom variant saved");
    setModalState(prev => ({
      ...prev,
      modalCustomSelectedVariantId: "",
      modalCustomSelectedVariantDetails: null
    }));
  };
  const handleModalCustomVariantImageUpload = (e, variantId, subheading) => {
    const file = e.target.files[0];
    if (!file) return;

    setOriginalFile(file);
    const localUrl = URL.createObjectURL(file);
    setCurrentImageToCrop(localUrl);
    setCropTarget({ field: null, subField: "customVariantImage", variantId, subheading, isModal: true });
    setCropModalOpen(true);
    setZoom(1);
    setTargetSize({ width: 768, height: 768 });
    setAspect(1);
    e.target.value = "";
  };
  const handleModalCustomVariantImageDelete = async (variantId, subheading) => {
    const variant = modalState.data.custom_variants.find(v => v._id === variantId);
    const sub = variant?.subheadings.find(s => s.name === subheading);
    const filename = sub?.image;
    if (!filename) return;
    // Optimistic
    setModalState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        custom_variants: prev.data.custom_variants.map(v =>
          v._id === variantId ? {
            ...v,
            subheadings: v.subheadings.map(s =>
              s.name === subheading ? { ...s, image: "", imageTemp: null } : s
            )
          } : v
        )
      }
    }));
    try {
      await axios.delete(`${baseUrl}/api/delete-image/${filename}`);
    } catch (error) {
      // Revert
      setModalState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          custom_variants: prev.data.custom_variants.map(v =>
            v._id === variantId ? {
              ...v,
              subheadings: v.subheadings.map(s =>
                s.name === subheading ? { ...s, image: filename } : s
              )
            } : v
          )
        }
      }));
      setWarningMessage(`Failed to delete image: ${error.message}`);
    }
  };
  const renderModalCustomVariantFields = (variant) => {
    if (!variant) return null;
    return (
      <div className="variant-section">
        <div className="variant-toggle">
          <label>Enable {variant.heading} Variant</label>
          <input
            type="checkbox"
            checked={variant.enabled}
            onChange={e => {
              setModalState(prev => ({
                ...prev,
                data: {
                  ...prev.data,
                  custom_variants: prev.data.custom_variants.map(v =>
                    v._id === variant._id ? { ...v, enabled: e.target.checked } : v
                  )
                }
              }));
            }}
          />
        </div>

        {variant.enabled && (
          <>
            <h6>{variant.heading} Options</h6>
            {variant.subheadings.map(sub => (
              <div key={sub.name} className="form-group">
                <label className="">{`${sub.name} Price`}</label>
                <input
                  type="number"
                  value={sub.price || ""}
                  onChange={e => handleModalCustomVariantFieldChange(variant._id, sub.name, "price", e.target.value)}
                  onWheel={disableNumberInputScroll}
                  className="input"
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />

                <label className="">
                  {`${sub.name} Image`}
                  <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
                    (Image size should be 768/768px)
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleModalCustomVariantImageUpload(e, variant._id, sub.name)}
                  className="input"
                />

                {(sub.image || sub.imageTemp) && (
                  <div className="image-container">
                    <img
                      src={getImageUrl(sub.image, baseUrl)}
                      alt={`${sub.name} Preview`}
                      className="image-preview"
                    />
                    <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button
                        type="button"
                        className="img-edit-button"
                        onClick={() => handleEditImage(getImageUrl(sub.image, baseUrl), null, "customVariantImage", variant._id, sub.name, true)}
                        style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        type="button"
                        className="img-delete-button"
                        onClick={() => handleModalCustomVariantImageDelete(variant._id, sub.name)}
                        style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                      >
                        Delete Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="save-btn"
              onClick={() => handleModalCustomVariantSave()}
            >
              Save Custom Variant
            </button>
          </>
        )}
      </div>
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing && !canWrite) {
      setPermModalMsg("You do not have permission to edit items.");
      setShowPermModal(true);
      return;
    }
    if (!isEditing && !canCreate) {
      setPermModalMsg("You do not have permission to create items.");
      setShowPermModal(true);
      return;
    }

    // --- Frontend Validation ---
    if (!isFromGallery) {
      if (!formData.item_name || !formData.item_name.trim()) {
        setWarningMessage("Item name is required.");
        return;
      }
      if (!formData.item_group || !formData.item_group.trim()) {
        setWarningMessage("Item group is required.");
        return;
      }
    }
    // ---------------------------
    const filteredIngredients = formData.ingredients
      .filter((ingredient) => ingredient.ingredients_name || ingredient.nutrition.length > 0)
      .map((ingredient) => ({
        name: ingredient.ingredients_name || "",
        small: Number(ingredient.small) || 0,
        medium: Number(ingredient.medium) || 0,
        large: Number(ingredient.large) || 0,
        weight: Number(ingredient.weight) || 0,
        nutrition: ingredient.nutrition.map((nut) => ({
          nutrition_name: nut.nutrition_name,
          nutrition_value: Number(nut.nutrition_value) || 0,
        })),
      }));
    const filteredAddons = formData.addons.map((addon) => ({
      ...addon,
      addon_image: extractImageName(addon.addon_image),
      tax_applicable: addon.tax_applicable || false,
      tax_rate: addon.tax_applicable ? (addon.tax_rate || 0) : 0,
      custom_variants: addon.custom_variants.map((variant) => ({
        _id: variant._id,
        heading: variant.heading,
        subheadings: variant.subheadings.map((sub) => ({
          name: sub.name,
          price: sub.price,
          image: (sub.image && sub.image.startsWith("data:")) ? sub.image : extractImageName(sub.image),
          dropdown: sub.dropdown,
        })),
        activeSection: variant.activeSection,
        enabled: variant.enabled,
      })),
      ingredients: addon.ingredients
        .filter((ing) => ing.ingredients_name || ing.nutrition.length > 0)
        .map((ing) => ({
          name: ing.ingredients_name || "",
          small: Number(ing.small) || 0,
          medium: Number(ing.medium) || 0,
          large: Number(ing.large) || 0,
          weight: Number(ing.weight) || 0,
          nutrition: ing.nutrition.map((nut) => ({
            nutrition_name: nut.nutrition_name,
            nutrition_value: Number(nut.nutrition_value) || 0,
          })),
        })),
      branch_names: (addon.branch_names !== undefined && addon.branch_names !== null) ? addon.branch_names : (userBranch ? [userBranch] : []),
      branch_prices: (addon.branch_prices && Object.keys(addon.branch_prices).length > 0) ? addon.branch_prices : (userBranch ? { [userBranch]: addon.addon_price } : {}),
      branch_name: (addon.branch_names && addon.branch_names.length > 0) ? addon.branch_names[0] : "",
      company_names: addon.company_names || [],
      company_prices: (addon.company_prices && Object.keys(addon.company_prices).length > 0) ? addon.company_prices : {},
    }));
    const filteredCombos = formData.combos.map((combo) => ({
      ...combo,
      combo_image: extractImageName(combo.combo_image),
      tax_applicable: combo.tax_applicable || false,
      tax_rate: combo.tax_applicable ? (combo.tax_rate || 0) : 0,
      custom_variants: combo.custom_variants.map((variant) => ({
        _id: variant._id,
        heading: variant.heading,
        subheadings: variant.subheadings.map((sub) => ({
          name: sub.name,
          price: sub.price,
          image: (sub.image && sub.image.startsWith("data:")) ? sub.image : extractImageName(sub.image),
          dropdown: sub.dropdown,
        })),
        activeSection: variant.activeSection,
        enabled: variant.enabled,
      })),
      ingredients: combo.ingredients
        .filter((ing) => ing.ingredients_name || ing.nutrition.length > 0)
        .map((ing) => ({
          name: ing.ingredients_name || "",
          small: Number(ing.small) || 0,
          medium: Number(ing.medium) || 0,
          large: Number(ing.large) || 0,
          weight: Number(ing.weight) || 0,
          nutrition: ing.nutrition.map((nut) => ({
            nutrition_name: nut.nutrition_name,
            nutrition_value: Number(nut.nutrition_value) || 0,
          })),
        })),
      branch_names: (combo.branch_names !== undefined && combo.branch_names !== null) ? combo.branch_names : (userBranch ? [userBranch] : []),
      branch_prices: (combo.branch_prices && Object.keys(combo.branch_prices).length > 0) ? combo.branch_prices : (userBranch ? { [userBranch]: combo.combo_price } : {}),
      branch_name: (combo.branch_names && combo.branch_names.length > 0) ? combo.branch_names[0] : "",
      company_names: combo.company_names || [],
      company_prices: (combo.company_prices && Object.keys(combo.company_prices).length > 0) ? combo.company_prices : {},
    }));

    // --- Context & Assignment Resolution ---
    const recordName = formData.item_name.trim();
    const globalExisting = allItems.find(it =>
      (it.item_name || "").toString().trim().toLowerCase() === recordName.toLowerCase()
    );

    const activeBranchLoc = (localStorage.getItem('active_branch') || 'All Branches').trim();
    const activeCompLoc = (localStorage.getItem('active_company') || 'All Companies').trim();
    const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
    const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';

    let finalBranches = [...branchNames];

    // Auto-include any branches that have a price override set
    if (branchPrices && typeof branchPrices === 'object') {
      Object.keys(branchPrices).forEach(branch => {
        if (branchPrices[branch] !== undefined && branchPrices[branch] !== null && branchPrices[branch] !== '' && !finalBranches.includes(branch)) {
          finalBranches.push(branch);
        }
      });
    }

    if (isSpecBranch && finalBranches.length === 0) {
      finalBranches = [activeBranchLoc];
    }

    let targetCompanies = (isGroupAdmin || isCompanyAdmin)
      ? (selectedCompanies.length > 0 ? selectedCompanies : [activeCompLoc !== 'All Companies' ? activeCompLoc : userCompany])
      : [userCompany];

    if (isSpecComp && targetCompanies.length === 0) {
      targetCompanies = [activeCompLoc];
    }

    // Override for Gallery
    if (isFromGallery) {
      targetCompanies = ['All'];
      finalBranches = ['All Branches'];
    }
    // ---------------------------------------

    const dynamicData = {};
    doctypeFields.forEach(f => {
      if (!f.is_default) {
        if (f.type === 'Attach Image') {
          dynamicData[f.id] = extractImageName(formData[f.id]);
        } else {
          dynamicData[f.id] = formData[f.id];
        }
      }
    });

    const updatedData = {
      ...dynamicData,
      item_code: formData.item_code,
      item_name: formData.item_name,
      item_group: formData.item_group,
      price_list_rate: Number(formData.price_list_rate),
      tax_applicable: formData.tax_applicable,
      tax_rate: formData.tax_applicable ? formData.tax_rate : 0,
      offer_price: formData.offer_price ? Number(formData.offer_price) : null,
      offer_start_time: formData.offer_start_time ? new Date(formData.offer_start_time).toISOString() : null,
      offer_end_time: formData.offer_end_time ? new Date(formData.offer_end_time).toISOString() : null,
      image: extractImageName(formData.image),
      images: formData.images.map(img => extractImageName(img)),
      custom_addon_applicable: formData.custom_addon_applicable,
      custom_combo_applicable: formData.custom_combo_applicable,
      custom_total_calories: Number(formData.custom_total_calories),
      custom_total_protein: Number(formData.custom_total_protein),
      kitchen: formData.kitchen,
      size: formData.variants.size,
      cold: formData.variants.cold,
      spicy: {
        ...formData.variants.spicy,
        spicy_image: extractImageName(formData.variants.spicy.spicy_image),
        non_spicy_image: extractImageName(formData.variants.spicy.non_spicy_image),
      },
      branch_names: finalBranches,
      branch_prices: (() => {
        const resolvedBranchPrices = { ...branchPrices };
        const activeBranchLoc = localStorage.getItem('active_branch');
        const userStrLoc = localStorage.getItem('user');
        let userObjLoc = {};
        try { if (userStrLoc) userObjLoc = JSON.parse(userStrLoc); } catch (_) { }
        const effectiveBranchLoc = (activeBranchLoc && activeBranchLoc !== 'All Branches' && activeBranchLoc !== 'All') ? activeBranchLoc : (userObjLoc.branch_name || userObjLoc.branch || "");

        if (effectiveBranchLoc) {
          // If the user is a branch admin editing the item, their edits to formData.price_list_rate
          // should act as a direct override of their own branch_prices!
          resolvedBranchPrices[effectiveBranchLoc] = Number(formData.price_list_rate);
        }
        return resolvedBranchPrices;
      })(),
      branch_name: finalBranches.length > 0 ? finalBranches[0] : "",
      company_names: targetCompanies.filter(c => c && c !== 'All'),
      company_name: targetCompanies[0] || "",
      custom_variants: formData.custom_variants.map((variant) => ({
        _id: variant._id,
        heading: variant.heading,
        subheadings: variant.subheadings.map((sub) => ({
          name: sub.name,
          price: sub.price,
          image: extractImageName(sub.image),
          dropdown: sub.dropdown,
        })),
        activeSection: variant.activeSection,
        enabled: variant.enabled,
      })),
      addons: filteredAddons,
      combos: filteredCombos,
      ingredients: filteredIngredients,
    };

    // --- GLOBAL MULTI-COMPANY SHARING & DEDUPLICATION ---
    // We look for an existing item with this name ANYWHERE in the group.
    // This allows us to "reuse" a record when a user adds a new company to an existing item name.

    setLoading(true);
    try {
      let finalUrl = isFromGallery ? `${baseUrl}/api/item-gallery` : `${baseUrl}/api/items`;
      let method = "post";
      let recordId = isEditing ? (itemToEdit?._id) : null;

      if (recordId) {
        if (isFromGallery) {
          finalUrl = `${baseUrl}/api/item-gallery/${recordId}`;
        } else if (itemToEdit?.global_ref_id) {
          finalUrl = `${baseUrl}/api/items/bulk/${itemToEdit.global_ref_id}`;
        } else {
          finalUrl = `${baseUrl}/api/items/${recordId}`;
        }
        method = "put";
      }

      // Construct the company_prices map for this record
      // We preserve existing company_prices if they aren't being edited now
      const basePrices = (isEditing && itemToEdit) ? (itemToEdit.company_prices || {}) : (globalExisting ? (globalExisting.company_prices || {}) : {});
      const recordCompanyPrices = { ...basePrices };

      targetCompanies.forEach(comp => {
        if (companyPrices[comp] !== undefined && companyPrices[comp] !== '' && Number(companyPrices[comp]) !== 0) {
          recordCompanyPrices[comp] = Number(companyPrices[comp]);
        } else if (!recordCompanyPrices[comp] || Number(recordCompanyPrices[comp]) === 0) {
          recordCompanyPrices[comp] = Number(formData.price_list_rate);
        }
      });

      const payload = {
        ...updatedData,
        item_name: recordName, // Use trimmed name
        company_names: targetCompanies,
        company_name: targetCompanies[0], // Primary company for header
        company_prices: recordCompanyPrices,
        price_list_rate: Number(formData.price_list_rate)
      };

      await axios[method](finalUrl, payload, {
        headers: getHeaders(null, targetCompanies[0])
      });

      setWarningMessage(`Item ${recordId ? "updated" : "created"} successfully for all selected companies.`);
      setShouldNavigateOnOk(true);
    } catch (error) {
      console.error("Error saving item:", error);
      setWarningMessage(`Operation failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const openModal = (type, index = null) => {
    if (index !== null) {
      const entry = formData[type][index];
      setSearchTerm(entry.name1 || ""); // Initialize search term with existing name
      const fetchNutritionData = async () => {
        try {
          const response = await axios.get(
            `${baseUrl}/api/items/nutrition/${encodeURIComponent(entry.name1)}?type=${type.slice(0, -1)}&item_id=${itemToEdit?._id}&index=${index}`
          );
          const fetchedIngredients = response.data?.ingredients || [];
          const formattedIngredients = Array.isArray(fetchedIngredients) ? fetchedIngredients.map((ing) => ({
            ingredients_name: ing.name || "",
            small: ing.small || 0,
            medium: ing.medium || 0,
            large: ing.large || 0,
            weight: ing.weight || 0,
            nutrition: Array.isArray(ing.nutrition)
              ? ing.nutrition.map((nut) => ({
                nutrition_name: nut.nutrition_name || "",
                nutrition_value: nut.nutrition_value || 0,
              }))
              : [],
          })) : [];
          setModalState({
            isOpen: true,
            type,
            addonType: "existing",
            selectedVariant: "",
            modalCustomSelectedVariantId: "",
            modalCustomSelectedVariantDetails: null,
            data: {
              ...entry,
              selectedId: "",
              name1: entry.name1 || "",
              newName: "",
              price: entry[type === "addons" ? "addon_price" : "combo_price"] || 0,
              company_prices: entry.company_prices || {}, // NEW: Hydrate company prices
              tax_applicable: entry.tax_applicable || false,
              tax_rate: entry.tax_applicable ? (entry.tax_rate || 0) : 0,
              image: entry[type === "addons" ? "addon_image" : "combo_image"] || "",
              imagePreview: entry[type === "addons" ? "addon_image" : "combo_image"]
                ? `${baseUrl}/api/images/${extractImageName(entry[type === "addons" ? "addon_image" : "combo_image"])}`
                : "",
              kitchen: entry.kitchen || formData.kitchen,
              variants: {
                size: entry.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                cold: entry.cold || { enabled: false, ice_preference: "without_ice", ice_price: 0 },
                spicy: entry.spicy || {
                  enabled: false,
                  spicy_price: 0,
                  spicy_image: "",
                  non_spicy_price: 0,
                  non_spicy_image: "",
                },
                sugar: entry.sugar || { enabled: false, level: "medium" },
              },
              branch_names: Array.isArray(entry.branch_names) ? entry.branch_names : (entry.branch_name ? [entry.branch_name] : (entry.branch ? [entry.branch] : [])),
              branch_prices: entry.branch_prices || {},
              company_names: Array.isArray(entry.company_names) ? entry.company_names : (entry.company_name ? [entry.company_name] : (entry.company ? [entry.company] : [])),
              custom_variants: entry.custom_variants || [],
              item_group: entry.item_group || "",
              ingredients: formattedIngredients.length > 0 ? formattedIngredients : entry.ingredients,
            },
            index,
          });
        } catch (error) {
          setWarningMessage(`Error fetching nutrition for ${type.slice(0, -1)}: ${error.message}`);
          setModalState({
            isOpen: true,
            type,
            addonType: "existing",
            selectedVariant: "",
            modalCustomSelectedVariantId: "",
            modalCustomSelectedVariantDetails: null,
            data: {
              ...entry,
              selectedId: "",
              name1: entry.name1 || "",
              newName: "",
              price: entry[type === "addons" ? "addon_price" : "combo_price"] || 0,
              tax_applicable: entry.tax_applicable || false,
              tax_rate: entry.tax_applicable ? (entry.tax_rate || 0) : 0,
              image: entry[type === "addons" ? "addon_image" : "combo_image"] || "",
              imagePreview: entry[type === "addons" ? "addon_image" : "combo_image"]
                ? `${baseUrl}/api/images/${extractImageName(entry[type === "addons" ? "addon_image" : "combo_image"])}`
                : "",
              kitchen: entry.kitchen || formData.kitchen,
              item_group: entry.item_group || "",
              variants: {
                size: entry.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                cold: entry.cold || { enabled: false, ice_preference: "without_ice", ice_price: 0 },
                spicy: entry.spicy || {
                  enabled: false,
                  spicy_price: 0,
                  spicy_image: "",
                  non_spicy_price: 0,
                  non_spicy_image: "",
                },
                sugar: entry.sugar || { enabled: false, level: "medium" },
              },
              branch_names: Array.isArray(entry.branch_names) ? entry.branch_names : (entry.branch_name ? [entry.branch_name] : (entry.branch ? [entry.branch] : [])),
              branch_prices: entry.branch_prices || {},
              company_names: Array.isArray(entry.company_names) ? entry.company_names : (entry.company_name ? [entry.company_name] : (entry.company ? [entry.company] : [])),
              company_prices: entry.company_prices || {},
              custom_variants: entry.custom_variants || [],
              ingredients: entry.ingredients || [
                { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
              ],
            },
            index,
          });
        }
      };
      fetchNutritionData();
    } else {
      setModalState({
        isOpen: true,
        type,
        addonType: "new",
        selectedVariant: "",
        modalCustomSelectedVariantId: "",
        modalCustomSelectedVariantDetails: null,
        data: {
          selectedId: "",
          name1: "",
          newName: "",
          price: 0,
          tax_applicable: false,
          tax_rate: 0,
          image: "",
          imagePreview: "",
          kitchen: formData.kitchen,
          item_group: "",
          variants: {
            size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
            cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
            spicy: {
              enabled: false,
              spicy_price: 0,
              spicy_image: "",
              non_spicy_price: 0,
              non_spicy_image: "",
            },
            sugar: { enabled: false, level: "medium" },
          },
          custom_variants: [],
          branch_names: userBranch ? [userBranch] : [],
          branch_prices: {},
          company_names: selectedCompanies.length > 0 ? [...selectedCompanies] : (localStorage.getItem("active_company") && localStorage.getItem("active_company") !== "All" ? [localStorage.getItem("active_company")] : []),
          company_prices: {},
          ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
        },
        index: formData[type].length,
      });
    }
  };
  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "addonType") {
      setModalState((prev) => ({ ...prev, addonType: value }));
    } else if (name === "selectedId" && modalState.addonType === "existing") {
      let selectedData = {};
      if (value.includes("_addon_")) {
        const [itemId, _, index] = value.split("_");
        const parentItem = allItems.find((item) => item._id === itemId);
        if (parentItem) {
          const addon = parentItem.addons[parseInt(index)];
          if (addon) {
            selectedData = {
              ...addon,
              name1: addon.name1,
              price: addon.addon_price,
              tax_applicable: addon.tax_applicable || false,
              tax_rate: addon.tax_applicable ? (addon.tax_rate || 0) : 0,
              image: addon.addon_image || "",
              imagePreview: getImageUrl(addon.addon_image, baseUrl),
              kitchen: addon.kitchen || formData.kitchen,
              item_group: addon.item_group || "",
              variants: {
                size: addon.size ? { ...addon.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                cold: addon.cold ? { ...addon.cold } : { enabled: false, ice_preference: "without_ice", ice_price: 0 },
                spicy: addon.spicy ? { ...addon.spicy } : {
                  enabled: false,
                  spicy_price: 0,
                  spicy_image: addon.spicy?.spicy_image || "",
                  non_spicy_price: 0,
                  non_spicy_image: addon.spicy?.non_spicy_image || "",
                },
                sugar: addon.sugar ? { ...addon.sugar } : { enabled: false, level: "medium" },
              },
              custom_variants: addon.custom_variants ? addon.custom_variants.map(v => ({ ...v })) : [],
              ingredients: addon.ingredients ? addon.ingredients.map(ing => ({ ...ing })) : [
                { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
              ],
              branch_names: addon.branch_names || (addon.branch_name ? [addon.branch_name] : []),
              branch_prices: addon.branch_prices || {},
            };
          }
        }
      } else if (value.includes("_combo_")) {
        const [itemId, _, index] = value.split("_");
        const parentItem = allItems.find((item) => item._id === itemId);
        if (parentItem) {
          const combo = parentItem.combos[parseInt(index)];
          if (combo) {
            selectedData = {
              ...combo,
              name1: combo.name1,
              price: combo.combo_price,
              tax_applicable: combo.tax_applicable || false,
              tax_rate: combo.tax_applicable ? (combo.tax_rate || 0) : 0,
              image: combo.combo_image || "",
              imagePreview: getImageUrl(combo.combo_image, baseUrl),
              kitchen: combo.kitchen || formData.kitchen,
              item_group: combo.item_group || "",
              variants: {
                size: combo.size ? { ...combo.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                cold: combo.cold ? { ...combo.cold } : { enabled: false, ice_preference: "without_ice", ice_price: 0 },
                spicy: combo.spicy ? { ...combo.spicy } : {
                  enabled: false,
                  spicy_price: 0,
                  spicy_image: combo.spicy?.spicy_image || "",
                  non_spicy_price: 0,
                  non_spicy_image: combo.spicy?.non_spicy_image || "",
                },
                sugar: combo.sugar ? { ...combo.sugar } : { enabled: false, level: "medium" },
              },
              custom_variants: combo.custom_variants ? combo.custom_variants.map(v => ({ ...v })) : [],
              ingredients: combo.ingredients ? combo.ingredients.map(ing => ({ ...ing })) : [
                { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
              ],
              branch_names: combo.branch_names || (combo.branch_name ? [combo.branch_name] : []),
              branch_prices: combo.branch_prices || {},
            };
          }
        }
      } else {
        const selectedItem = allItems.find((item) => item._id === value);
        if (selectedItem) {
          selectedData = {
            ...selectedItem,
            name1: selectedItem.item_name,
            price: selectedItem.price_list_rate,
            tax_applicable: selectedItem.tax_applicable || false,
            tax_rate: selectedItem.tax_applicable ? (selectedItem.tax_rate || 0) : 0,
            image: selectedItem.image || "",
            imagePreview: getImageUrl(selectedItem.image, baseUrl),
            kitchen: selectedItem.kitchen || formData.kitchen,
            item_group: selectedItem.item_group || "",
            variants: {
              size: selectedItem.size ? { ...selectedItem.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
              cold: selectedItem.cold ? { ...selectedItem.cold } : { enabled: false, ice_preference: "without_ice", ice_price: 0 },
              spicy: selectedItem.spicy ? { ...selectedItem.spicy } : {
                enabled: false,
                spicy_price: 0,
                spicy_image: selectedItem.spicy?.spicy_image || "",
                non_spicy_price: 0,
                non_spicy_image: selectedItem.spicy?.non_spicy_image || "",
              },
              sugar: selectedItem.sugar ? { ...selectedItem.sugar } : { enabled: false, level: "medium" },
            },
            custom_variants: selectedItem.custom_variants ? selectedItem.custom_variants.map(v => ({ ...v })) : [],
            ingredients: selectedItem.ingredients ? selectedItem.ingredients.map(ing => ({ ...ing })) : [
              { ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] },
            ],
            branch_names: selectedItem.branch_names || (selectedItem.branch_name ? [selectedItem.branch_name] : []),
            branch_prices: selectedItem.branch_prices || {},
            company_names: (selectedItem.company_names || []).concat(selectedItem.company_name ? [selectedItem.company_name] : []).concat(selectedItem.company ? [selectedItem.company] : []),
            company_prices: selectedItem.company_prices || {},
          };
        }
      }
      // Force clear previous image preview to ensure update
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          selectedId: value,
          ...selectedData,
          image: selectedData.image || "",
          imagePreview: selectedData.imagePreview || "",
        },
      }));
    } else if (name === "newName" && modalState.addonType === "new") {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, newName: value },
      }));
    } else if (name === "price") {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, price: Number(value) },
      }));
    } else if (name === "tax_applicable") {
      setModalState((prev) => {
        const newChecked = checked;
        let updatedData = { ...prev.data, tax_applicable: newChecked };
        if (newChecked && !prev.data.tax_rate) {
          updatedData.tax_rate = companyTaxRate;
        } else if (!newChecked) {
          updatedData.tax_rate = 0;
        }
        return { ...prev, data: updatedData };
      });
    } else if (name === "tax_rate") {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, tax_rate: Number(value) },
      }));
    } else if (name === "kitchen") {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, kitchen: value },
      }));
    } else if (name === "item_group") {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, item_group: value },
      }));
    } else if (name.includes("variants.")) {
      const [_, variant, field] = name.split(".");
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          variants: {
            ...prev.data.variants,
            [variant]: {
              ...prev.data.variants[variant],
              [field]: type === "checkbox" ? checked : Number(value) || value,
            },
          },
        },
      }));
    } else if (name === "selectedVariant") {
      setModalState((prev) => ({ ...prev, selectedVariant: value }));
    } else if (name === "branch_toggle") {
      const branch = value;
      setModalState((prev) => {
        const currentBranches = prev.data.branch_names || [];
        // Use robust matching to find if this branch is already selected (handles All/Global)
        const existingIdx = currentBranches.findIndex(b => matchTenancy(b, branch));
        const isSelected = existingIdx !== -1;

        let updatedBranches;
        let updatedPrices = { ...(prev.data.branch_prices || {}) };

        if (isSelected) {
          // Robust removal: remove any entry that matches via matchTenancy
          updatedBranches = currentBranches.filter((b, idx) => idx !== existingIdx);

          // Remove price override for this branch using robust matching
          Object.keys(updatedPrices).forEach(k => {
            if (matchTenancy(k, branch)) delete updatedPrices[k];
          });
        } else {
          updatedBranches = [...currentBranches, branch];
        }

        return {
          ...prev,
          data: {
            ...prev.data,
            branch_names: updatedBranches,
            branch_prices: updatedPrices,
          },
        };
      });
    } else if (name === "branch_price_override") {
      const { branch, price } = value;
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          branch_prices: {
            ...(prev.data.branch_prices || {}),
            [branch]: price === "" ? undefined : Number(price),
          },
        },
      }));
    } else if (name === "company_toggle") {
      const company = value;
      setModalState((prev) => {
        const currentCompanies = prev.data.company_names || [];
        const isSelected = currentCompanies.includes(company);
        let updatedCompanies;
        let updatedPrices = { ...(prev.data.company_prices || {}) };

        const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
        const isGlobal = (c) => globalTags.includes(c);

        if (isSelected) {
          updatedCompanies = currentCompanies.filter((c) => c !== company);
          delete updatedPrices[company];
        } else {
          // SMART TRANSITION: Global -> Private (Replace)
          if (!isGlobal(company)) {
            // Adding a private company: remove any global tags
            updatedCompanies = currentCompanies.filter(c => !isGlobal(c)).concat(company);
            globalTags.forEach(gt => delete updatedPrices[gt]);
          } else {
            // Adding a global tag: remove all private companies
            updatedCompanies = [company];
            updatedPrices = { [company]: updatedPrices[company] || "" };
          }
        }

        return {
          ...prev,
          data: {
            ...prev.data,
            company_names: updatedCompanies,
            company_prices: updatedPrices,
          },
        };
      });
    } else if (name === "company_price_override") {
      const { company, price } = value;
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          company_prices: {
            ...(prev.data.company_prices || {}),
            [company]: price === "" ? undefined : Number(price),
          },
        },
      }));
    } else {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: type === 'checkbox' ? checked : value },
      }));
    }
  };
  const handleModalNumericFocus = (e) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };
  const handleModalNumericBlur = (e, name) => {
    const value = e.target.value;
    if (value === "" || isNaN(value)) {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: 0 },
      }));
      e.target.value = "0";
    } else {
      setModalState((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: Number(value) },
      }));
    }
  };
  const handleModalVariantNumericFocus = (e, variant, field) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };
  const handleModalVariantNumericBlur = (e, variant, field) => {
    const value = e.target.value;
    if (value === "" || isNaN(value)) {
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          variants: {
            ...prev.data.variants,
            [variant]: { ...prev.data.variants[variant], [field]: 0 },
          },
        },
      }));
      e.target.value = "0";
    } else {
      setModalState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          variants: {
            ...prev.data.variants,
            [variant]: { ...prev.data.variants[variant], [field]: Number(value) },
          },
        },
      }));
    }
  };
  const handleModalImageUpload = (e, variant = null, subField = null) => {
    const file = e.target.files[0];
    if (!file) return;

    setOriginalFile(file);
    const localUrl = URL.createObjectURL(file);
    setCurrentImageToCrop(localUrl);
    setCropTarget({ field: null, subField, variantId: variant, subheading: null, isModal: true });
    setCropModalOpen(true);
    setZoom(1);
    setTargetSize({ width: 768, height: 768 });
    setAspect(1);
    e.target.value = "";
  };
  const handleModalImageDelete = async (variant = null, subField = null) => {
    const filename = subField ? modalState.data.variants[variant][subField] : modalState.data.image;
    if (!filename) return;

    // Optimistic delete
    if (subField) {
      setModalState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          variants: {
            ...prev.data.variants,
            [variant]: {
              ...prev.data.variants[variant],
              [subField]: ""
            }
          }
        }
      }));
    } else {
      setModalState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          image: "",
          imagePreview: ""
        }
      }));
    }

    if (filename.startsWith("data:")) return; // Don't delete base64 from server

    try {
      await axios.delete(`${baseUrl}/api/delete-image/${filename}`);
      setWarningMessage("Modal image deleted successfully!");
    } catch (error) {
      // Ignore error
    }
  };
  const handleModalSave = () => {
    let newEntry;
    if (modalState.addonType === "existing") {
      newEntry = {
        name1: modalState.data.name1,
        [modalState.type === "addons" ? "addon_price" : "combo_price"]: modalState.data.price,
        tax_applicable: modalState.data.tax_applicable,
        tax_rate: modalState.data.tax_applicable ? modalState.data.tax_rate : 0,
        [modalState.type === "addons" ? "addon_image" : "combo_image"]: modalState.data.image,
        kitchen: modalState.data.kitchen,
        item_group: modalState.data.item_group,
        size: modalState.data.variants.size.enabled ? modalState.data.variants.size : undefined,
        cold: modalState.data.variants.cold.enabled ? modalState.data.variants.cold : undefined,
        spicy: modalState.data.variants.spicy.enabled
          ? {
            ...modalState.data.variants.spicy,
            spicy_image: modalState.data.variants.spicy.spicy_image,
            non_spicy_image: modalState.data.variants.spicy.non_spicy_image,
          }
          : undefined,
        sugar: modalState.data.variants.sugar.enabled ? modalState.data.variants.sugar : undefined,
        custom_variants: modalState.data.custom_variants.map(variant => ({
          _id: variant._id,
          heading: variant.heading,
          subheadings: variant.subheadings.map(sub => ({
            name: sub.name,
            price: sub.price,
            image: sub.image,
            dropdown: sub.dropdown,
          })),
          activeSection: variant.activeSection,
          enabled: variant.enabled,
        })),
        ingredients: modalState.data.ingredients,
        branch_names: (modalState.data.branch_names !== undefined && modalState.data.branch_names !== null)
          ? modalState.data.branch_names
          : (userBranch ? [userBranch] : []),
        branch_prices: (modalState.data.branch_prices && Object.keys(modalState.data.branch_prices).length > 0)
          ? modalState.data.branch_prices
          : (userBranch ? { [userBranch]: modalState.data.price } : {}),
        branch_name: (modalState.data.branch_names && modalState.data.branch_names.length > 0) ? modalState.data.branch_names[0] : "",
        company_names: modalState.data.company_names || [],
        company_prices: modalState.data.company_prices || {},
        company_name: (modalState.data.company_names && modalState.data.company_names.length > 0) ? modalState.data.company_names[0] : (formData.company_name || ""),
      };
    } else if (modalState.addonType === "new") {
      newEntry = {
        name1: modalState.data.newName,
        [modalState.type === "addons" ? "addon_price" : "combo_price"]: modalState.data.price,
        tax_applicable: modalState.data.tax_applicable,
        tax_rate: modalState.data.tax_applicable ? modalState.data.tax_rate : 0,
        [modalState.type === "addons" ? "addon_image" : "combo_image"]: modalState.data.image,
        kitchen: modalState.data.kitchen,
        item_group: modalState.data.item_group,
        size: modalState.data.variants.size.enabled ? modalState.data.variants.size : undefined,
        cold: modalState.data.variants.cold.enabled ? modalState.data.variants.cold : undefined,
        spicy: modalState.data.variants.spicy.enabled
          ? {
            ...modalState.data.variants.spicy,
            spicy_image: modalState.data.variants.spicy.spicy_image,
            non_spicy_image: modalState.data.variants.spicy.non_spicy_image,
          }
          : undefined,
        sugar: modalState.data.variants.sugar.enabled ? modalState.data.variants.sugar : undefined,
        custom_variants: modalState.data.custom_variants.map(variant => ({
          _id: variant._id,
          heading: variant.heading,
          subheadings: variant.subheadings.map(sub => ({
            name: sub.name,
            price: sub.price,
            image: sub.image,
            dropdown: sub.dropdown,
          })),
          activeSection: variant.activeSection,
          enabled: variant.enabled,
        })),
        ingredients: modalState.data.ingredients,
        branch_names: (modalState.data.branch_names !== undefined && modalState.data.branch_names !== null)
          ? modalState.data.branch_names
          : (userBranch ? [userBranch] : []),
        branch_prices: (modalState.data.branch_prices && Object.keys(modalState.data.branch_prices).length > 0)
          ? modalState.data.branch_prices
          : (userBranch ? { [userBranch]: modalState.data.price } : {}),
        branch_name: (modalState.data.branch_names && modalState.data.branch_names.length > 0) ? modalState.data.branch_names[0] : "",
        company_names: modalState.data.company_names || [],
        company_prices: modalState.data.company_prices || {},
        company_name: (modalState.data.company_names && modalState.data.company_names.length > 0) ? modalState.data.company_names[0] : (formData.company_name || ""),
      };
    }
    setFormData((prev) => {
      const updatedField = [...prev[modalState.type]];
      if (modalState.index !== null && modalState.index < updatedField.length) {
        updatedField[modalState.index] = newEntry;
      } else {
        updatedField.push(newEntry);
      }
      return { ...prev, [modalState.type]: updatedField };
    });
    setSearchTerm("");
    setModalState({
      isOpen: false,
      type: "",
      addonType: "existing",
      selectedVariant: "",
      modalCustomSelectedVariantId: "",
      modalCustomSelectedVariantDetails: null,
      data: {
        selectedId: "",
        name1: "",
        newName: "",
        price: 0,
        tax_applicable: false,
        tax_rate: 0,
        image: "",
        imagePreview: "",
        kitchen: "",
        item_group: "",
        variants: {
          size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
          cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
          spicy: {
            enabled: false,
            spicy_price: 0,
            spicy_image: "",
            non_spicy_price: 0,
            non_spicy_image: "",
          },
          sugar: { enabled: false, level: "medium" },
        },
        custom_variants: [],
        branch_prices: {},
        company_names: [],
        company_prices: {},
        ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
      },
      index: null,
    });
  };
  const handleDeleteEntry = () => {
    if (modalState.index === null) return;
    setFormData((prev) => {
      const updatedField = [...prev[modalState.type]];
      updatedField.splice(modalState.index, 1);
      return { ...prev, [modalState.type]: updatedField };
    });
    setSearchTerm("");
    setModalState({
      isOpen: false,
      type: "",
      addonType: "existing",
      selectedVariant: "",
      modalCustomSelectedVariantId: "",
      modalCustomSelectedVariantDetails: null,
      data: {
        selectedId: "",
        name1: "",
        newName: "",
        price: 0,
        tax_applicable: false,
        tax_rate: 0,
        image: "",
        imagePreview: "",
        kitchen: "",
        item_group: "",
        variants: {
          size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
          cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
          spicy: {
            enabled: false,
            spicy_price: 0,
            spicy_image: "",
            non_spicy_price: 0,
            non_spicy_image: "",
          },
          sugar: { enabled: false, level: "medium" },
        },
        custom_variants: [],
        branch_prices: {},
        company_prices: {},
        ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
      },
      index: null,
    });
    setWarningMessage(`${modalState.type === "addons" ? "Addon" : "Combo"} deleted successfully!`);
  };
  const getVariantSummary = (item) => {
    const elements = [];
    if (item.size?.enabled) {
      elements.push(<span key="size">Size: Small {displaySymbol}{item.size.small_price}, Medium {displaySymbol}{item.size.medium_price}, Large {displaySymbol}{item.size.large_price}</span>);
    }
    if (item.cold?.enabled) {
      elements.push(<span key="cold">Cold: {item.cold.ice_preference}{item.cold.ice_price ? <span> ({displaySymbol}{item.cold.ice_price})</span> : ""}</span>);
    }
    if (item.spicy?.enabled) {
      elements.push(<span key="spicy">Spicy: {displaySymbol}{item.spicy.spicy_price}, Non-Spicy: {displaySymbol}{item.spicy.non_spicy_price}</span>);
    }
    if (item.sugar?.enabled) {
      elements.push(<span key="sugar">Sugar: {item.sugar.level}</span>);
    }
    if (item.custom_variants?.length > 0 && variantDoctypeFields.some(f => f.id === 'custom_variant' && !f.hidden)) {
      item.custom_variants.forEach((variant, idx) => {
        if (variant.enabled) {
          elements.push(<span key={`custom_${idx}`}>{variant.heading}: {variant.subheadings.map(sub => sub.name).join(', ')}</span>);
        }
      });
    }
    if (elements.length === 0) return <span>No variants</span>;
    return elements.map((el, i) => <span key={i}>{el}{i < elements.length - 1 ? "; " : ""}</span>);
  };
  // Deduplicate options for the search dropdown
  const uniqueOptions = [];
  const seenOptions = new Set(); // Stores normalizedName-type

  const currentItemBranches = isCompanyAdmin ? (branchNames || []) : (userBranch ? [userBranch] : []);

  allItems.forEach((item) => {
    // 1. Filter by company context (Strict Addon/Combo Tenancy)
    const itemCompanies = (item.company_names || []).concat(item.company_name ? [item.company_name] : []).concat(item.company ? [item.company] : []);
    // MUST only show if the lookup item belongs to the company we are currently building/editing the item for
    const isCompanyRelevant = selectedCompanies.length > 0 && itemCompanies.some(c => selectedCompanies.some(sc => sc.trim().toLowerCase() === c.trim().toLowerCase()));

    if (!isCompanyRelevant) return;

    // RECURSIVE PREVENTION: Don't show current item in its own addon/combo dropdown
    const currentEditingNameNorm = itemToEdit?.item_name?.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') || "";
    const itemNameNorm = item.item_name?.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') || "";

    if (isEditing && itemToEdit && (item._id === itemToEdit._id || itemNameNorm === currentEditingNameNorm)) return;

    // 2. Filter by branch context
    const itemBranches = (item.branch_names || []).concat(item.branch_name ? [item.branch_name] : []).concat(item.branch ? [item.branch] : []);
    const isRelevant = currentItemBranches.length === 0 || itemBranches.some(b => currentItemBranches.some(cb => matchTenancy(cb, b)));

    if (!isRelevant) return;

    // 3. Add Main Item (Deduplicated by Name)
    const itemKey = `${itemNameNorm}-item`;
    if (!seenOptions.has(itemKey)) {
      seenOptions.add(itemKey);
      uniqueOptions.push({ label: `${item.item_name} (Item)`, value: item._id, type: "item" });
    }

    // 4. Add Addons
    if (item.addons) {
      item.addons.forEach((addon, index) => {
        const addonNormalized = (addon.name1 || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
        const addonKey = `${addonNormalized}-addon`;
        if (!seenOptions.has(addonKey)) {
          seenOptions.add(addonKey);
          uniqueOptions.push({
            label: `${addon.name1} (Addon)`,
            value: `${item._id}_addon_${index}`,
            type: "addon",
          });
        }
      });
    }

    // 5. Add Combos
    if (item.combos) {
      item.combos.forEach((combo, index) => {
        const comboNormalized = (combo.name1 || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
        const comboKey = `${comboNormalized}-combo`;
        if (!seenOptions.has(comboKey)) {
          seenOptions.add(comboKey);
          uniqueOptions.push({
            label: `${combo.name1} (Combo)`,
            value: `${item._id}_combo_${index}`,
            type: "combo",
          });
        }
      });
    }
  });

  const options = uniqueOptions
    .filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  const handleListButtonClick = () => {
    setAddonListModalOpen(true);
    setComboListModalOpen(true);
  };
  if (permsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#3498db',
          fontSize: '18px'
        }}>
          <FaBox style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>Access Denied</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>You do not have permission to view the Create Item page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none', color: '#fff' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  const showCompanyAssign = !isFromGallery && !isSpecificBranchActive && (isGroupAdmin || isCompanyAdmin);

  const isRightSidePanelOpen = showNewKitchenModal || showNewItemGroupModal || modalState.isOpen || comboListModalOpen;
  const isLeftSidePanelOpen = addonListModalOpen;
  const leftWidth = isLeftSidePanelOpen ? 480 : 0;
  const rightWidth = isRightSidePanelOpen ? 480 : 0;
  const totalSidePanelWidth = leftWidth + rightWidth;

  return (
    <div className="create-item-container main-item-page">
      {/* Centered Permission Denied Modal */}
      {showPermModal && (
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
      )}

      <div className="item-header-section">
        <div className="header-left">
          <button className="header-back-btn" onClick={() => {
            if (isFromGallery) navigate("/item-gallery");
            else navigate("/items");
          }}>
            <FaArrowLeft /> Go Back
          </button>
        </div>

        <div className="header-center">
          <h1 className="page-title">{isEditing ? "Edit Item" : "Create New Item"}</h1>
        </div>

        <div className="header-right header-actions">
          {/* <button
            className="cancel-btn"
            onClick={() => {
              if (isFromGallery) navigate("/item-gallery");
              else navigate("/items");
            }}
            style={{ backgroundColor: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', height: '48px', margin: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
          >
            <FaTimes style={{ marginRight: "8px" }} />
            Cancel
          </button> */}

          <button type="button" className="save-btn" style={{ backgroundColor: "#3b82f6", marginBottom: "15px" }} onClick={() => setIsColumnModalOpen(true)} style={{ backgroundColor: '#2c3e50', padding: '10px 15px', borderRadius: '10px', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', height: '48px', margin: 0, boxShadow: '0 4px 12px rgba(44, 62, 80, 0.4)' }}>
            <FaColumns style={{ marginRight: '5px' }} /> Manage Columns
          </button>

          {checkIsAdmin(JSON.parse(localStorage.getItem('user') || '{}')) && (
            <CustomizeDropdown
              currentDocType={customizationTarget}
              doctypeFields={doctypeFields}
              onSelect={(opt) => {
                setCustomizationTarget(opt);
                setShowCustomizeModal(true);
              }}
            />
          )}

          <button
            className="save-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            <FaSave style={{ marginRight: "8px" }} />
            {loading ? "Saving..." : isEditing ? "Update Item" : "Create Item"}
          </button>
        </div>
      </div>

      {warningMessage && (
        <div className="warning-modal-overlay">
          <div className="warning-modal">
            <div className="warning-modal-icon" style={{ borderColor: '#fff1f2', color: '#e11d48' }}>
              <span style={{ fontSize: '36px' }}>⚠️</span>
            </div>
            <h3>Notice</h3>
            <p>{warningMessage}</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-ok" onClick={() => {
                setWarningMessage("");
                if (shouldNavigateOnOk) {
                  setShouldNavigateOnOk(false);
                  if (isFromGallery) navigate("/item-gallery");
                  else navigate("/items");
                }
              }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      <div className="content-layout-wrapper">
        <div className={`side-panel-container left ${isLeftSidePanelOpen ? 'open' : ''}`}>
          <SidePanel
            isOpen={addonListModalOpen}
            onClose={() => setAddonListModalOpen(false)}
            title="Addons List"

          >
            <div className="list-column">
              <h6 className="list-title">Addons</h6>
              {formData.addons && formData.addons.length > 0 ? (
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Tax Applicable</th>
                      <th>Tax Rate (%)</th>
                      <th>Kitchen</th>
                      <th>Variants</th>
                      <th>Ingredients</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.addons.map((addon, index) => (
                      <tr
                        key={index}
                        onClick={() => {
                          setAddonListModalOpen(false);
                          setComboListModalOpen(false);
                          openModal("addons", index);
                        }}
                      >
                        <td>{addon.name1}</td>
                        <td>{displaySymbol}{
                          (addon.branch_prices && branchNames.length > 0 && addon.branch_prices[branchNames[0]] !== undefined)
                            ? addon.branch_prices[branchNames[0]]
                            : (addon.company_prices && selectedCompanies.length > 0 && addon.company_prices[selectedCompanies[0]] !== undefined)
                              ? addon.company_prices[selectedCompanies[0]]
                              : addon.addon_price
                        }</td>
                        <td>{addon.tax_applicable ? "Yes" : "No"}</td>
                        <td>{addon.tax_rate || 0}</td>
                        <td>{addon.kitchen || "Not Set"}</td>
                        <td>{getVariantSummary(addon)}</td>
                        <td>{addon.ingredients.length} ingredients</td>
                        <td>
                          {addon.addon_image ? (
                            <img
                              src={getImageUrl(addon.addon_image, baseUrl)}
                              alt="Addon"
                              className="image-preview"
                            />
                          ) : (
                            "No Image"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No addons added yet.</p>
              )}
            </div>
          </SidePanel>
        </div>
        <div className="item-scroll-body" style={{ flex: totalSidePanelWidth > 0 ? `0 0 calc(100% - ${totalSidePanelWidth}px)` : '1' }}>
          <div className="main-content-card">
            <div className="form-section-card theme-blue">
              <div className="section-header">
                <h2>Item Details :</h2>
                <div className="section-icon">
                  <FaBox />
                </div>
              </div>

              <div className="top-section" style={{ marginBottom: '24px' }}>
                <div className="top-button-container" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  <button type="button" className="save-btn" onClick={handleListButtonClick} style={{ height: '44px', minWidth: '100px', padding: '0 16px', borderRadius: '10px' }}>
                    List
                  </button>
                  <button type="button" className="save-btn" onClick={() => openModal("addons")} style={{ height: '44px', minWidth: '100px', padding: '0 16px', borderRadius: '10px' }}>
                    Add Addon
                  </button>
                  <button type="button" className="save-btn" onClick={() => openModal("combos")} style={{ height: '44px', minWidth: '100px', padding: '0 16px', borderRadius: '10px' }}>
                    Add Combo
                  </button>
                  {formData.columnVisibility?.item?.ingredients !== false && !getFieldHidden("ingredients", false) && (
                    <button
                      type="button"
                      className="save-btn"
                      onClick={() => navigate("/add-ingredients-nutrition", {
                        state: {
                          formData,
                          itemId: isEditing ? itemToEdit?._id : "new",
                          isEditing,
                          type: "item"
                        }
                      })}
                      style={{
                        height: '44px', minWidth: '100px', padding: '0 16px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)'
                      }}
                    >
                      <FaUtensils style={{ marginRight: '5px' }} /> Ingredient & Nutrition
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Section Tabs Navigation */}
              {(() => {
                const tabs = getTabsAndFields();
                const hasRequiredFields = (tab) => {
                  return tab.fields.some(f => {
                    if (f.fieldConfig?.required) return true;
                    const mandatoryStandards = ['item_code', 'item_name', 'item_group', 'price_list_rate'];
                    if (f.isStandard && mandatoryStandards.includes(f.name)) return true;
                    return false;
                  });
                };
                return tabs.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          background: activeTabId === tab.id ? '#eff6ff' : '#ffffff',
                          color: activeTabId === tab.id ? '#604BE8' : '#64748b',
                          border: activeTabId === tab.id ? '1px solid #604BE8' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {tab.label}
                        {hasRequiredFields(tab) && (
                          <span style={{ color: '#ef4444', marginLeft: '6px' }}>*</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Tabbed Content inside Grid */}
              {(() => {
                const tabs = getTabsAndFields();
                const activeTab = tabs.find((t) => t.id === activeTabId) || (tabs.length > 0 ? tabs[0] : null);
                if (!activeTab) return null;
                return (
                  <div className="form-grid">
                    {activeTab.fields.map((field) => renderField(field))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className={`side-panel-container right ${isRightSidePanelOpen ? 'open' : ''}`}>
          <SidePanel
            isOpen={comboListModalOpen}
            onClose={() => setComboListModalOpen(false)}
            title="Combos List"

          >
            <div className="list-column">
              <h6 className="list-title">Combos</h6>
              {formData.combos && formData.combos.length > 0 ? (
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Tax Applicable</th>
                      <th>Tax Rate (%)</th>
                      <th>Kitchen</th>
                      <th>Variants</th>
                      <th>Ingredients</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.combos.map((combo, index) => (
                      <tr
                        key={index}
                        onClick={() => {
                          setAddonListModalOpen(false);
                          setComboListModalOpen(false);
                          openModal("combos", index);
                        }}
                      >
                        <td>{combo.name1}</td>
                        <td>{displaySymbol}{
                          (combo.branch_prices && branchNames.length > 0 && combo.branch_prices[branchNames[0]] !== undefined)
                            ? combo.branch_prices[branchNames[0]]
                            : (combo.company_prices && selectedCompanies.length > 0 && combo.company_prices[selectedCompanies[0]] !== undefined)
                              ? combo.company_prices[selectedCompanies[0]]
                              : combo.combo_price
                        }</td>
                        <td>{combo.tax_applicable ? "Yes" : "No"}</td>
                        <td>{combo.tax_rate || 0}</td>
                        <td>{combo.kitchen || "Not Set"}</td>
                        <td>{getVariantSummary(combo)}</td>
                        <td>{combo.ingredients.length} ingredients</td>
                        <td>
                          {combo.combo_image ? (
                            <img
                              src={getImageUrl(combo.combo_image, baseUrl)}
                              alt="Combo"
                              className="image-preview"
                            />
                          ) : (
                            "No Image"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No combos added yet.</p>
              )}
            </div>
          </SidePanel>
          <SidePanel
            isOpen={modalState.isOpen}
            onClose={() => {
              setSearchTerm("");
              setModalState({
                isOpen: false,
                type: "",
                addonType: "existing",
                selectedVariant: "",
                modalCustomSelectedVariantId: "",
                modalCustomSelectedVariantDetails: null,
                data: {
                  selectedId: "",
                  name1: "",
                  newName: "",
                  price: 0,
                  tax_applicable: false,
                  tax_rate: 0,
                  image: "",
                  imagePreview: "",
                  kitchen: "",
                  item_group: "",
                  variants: {
                    size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                    cold: { enabled: false, ice_preference: "without_ice", ice_price: 0 },
                    spicy: {
                      enabled: false,
                      spicy_price: 0,
                      spicy_image: "",
                      non_spicy_price: 0,
                      non_spicy_image: "",
                    },
                    sugar: { enabled: false, level: "medium" },
                  },
                  custom_variants: [],
                  ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
                },
                index: null,
              });
            }}
            title={
              modalState.index !== null && modalState.index < formData[modalState.type].length
                ? `Edit ${modalState.type === "addons" ? "Addon" : "Combo"}`
                : `Add New ${modalState.type === "addons" ? "Addon" : "Combo"}`
            }
          >
            {(modalState.type === "addons" || modalState.type === "combos") && (
              <>
                {formData.columnVisibility?.[modalState.type]?.type !== false && (
                  <div className="form-group">
                    <label>{modalState.type === "addons" ? "Addon Type" : "Combo Type"}</label>
                    <select name="addonType" value={modalState.addonType} onChange={handleModalInputChange} className="input">
                      <option value="existing">Select Existing Item</option>
                      <option value="new">Create New {modalState.type === "addons" ? "Addon" : "Combo"}</option>
                    </select>
                  </div>
                )}
                {modalState.addonType === "existing" && (
                  <div className="form-group">
                    <label>Select {modalState.type === "addons" ? "Addon" : "Combo"}</label>
                    <div style={{ position: "relative", marginBottom: "15px" }}>
                      <input
                        type="text"
                        placeholder="Search or select item..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          // Clear selectedId if user types manually to ensure they pick a valid option
                          if (modalState.data.selectedId) {
                            handleModalInputChange({ target: { name: "selectedId", value: "" } });
                          }
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        // onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delayed close to allow click
                        className="input"
                        style={{ marginBottom: "0" }}
                      />
                      {isDropdownOpen && (
                        <ul
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "#fff",
                            border: "1px solid #bfdbfe",
                            borderTop: "none",
                            borderRadius: "0 0 10px 10px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1005,
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          }}
                        >
                          {options
                            .filter((option) =>
                              option.label.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((option) => (
                              <li
                                key={option.value}
                                onClick={() => {
                                  handleModalInputChange({
                                    target: { name: "selectedId", value: option.value },
                                  });
                                  setSearchTerm(option.label);
                                  setIsDropdownOpen(false);
                                }}
                                style={{
                                  padding: "10px 15px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f1f5f9",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.backgroundColor = "#e6f0fa")
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.backgroundColor = "transparent")
                                }
                              >
                                {option.label}
                              </li>
                            ))}
                          {options.filter((option) =>
                            option.label.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && (
                              <li style={{ padding: "10px 15px", color: "#64748b" }}>
                                No results found
                              </li>
                            )}
                        </ul>
                      )}
                      {/* Overlay to close dropdown when clicking outside */}
                      {isDropdownOpen && (
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1004,
                          }}
                          onClick={() => setIsDropdownOpen(false)}
                        />
                      )}
                    </div>
                  </div>
                )}
                {modalState.addonType === "new" && (
                  <>
                    {formData.columnVisibility?.[modalState.type]?.name !== false && !getFieldHidden("name1", false, modalState.type) && (
                      <div className="form-group">
                        <label>{modalState.type === "addons" ? "New Addon Name" : "New Combo Name"}</label>
                        <input
                          type="text"
                          name="newName"
                          value={modalState.data.newName}
                          onChange={handleModalInputChange}
                          className="input"
                        />
                      </div>
                    )}
                  </>
                )}
                {formData.columnVisibility?.[modalState.type]?.price !== false && !getFieldHidden("price", false, modalState.type) && (
                  <div className="form-group">
                    <label>Price ({displaySymbol})</label>
                    <input
                      type="number"
                      name="price"
                      value={modalState.data.price}
                      onChange={handleModalInputChange}
                      onFocus={handleModalNumericFocus}
                      onBlur={(e) => handleModalNumericBlur(e, "price")}
                      onWheel={disableNumberInputScroll}
                      className="input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                {formData.columnVisibility?.[modalState.type]?.tax !== false && !getFieldHidden("tax", false, modalState.type) && (
                  <div className="form-group">
                    <label>GST/VAT Applicable</label>
                    <select
                      name="tax_applicable"
                      value={modalState.data.tax_applicable ? "Yes" : "No"}
                      onChange={(e) => handleModalInputChange({ target: { name: "tax_applicable", value: e.target.value, type: "checkbox", checked: e.target.value === "Yes" } })}
                      className="input"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    {modalState.data.tax_applicable && (
                      <div style={{ marginTop: "15px" }}>
                        <label>GST/VAT Rate (%)</label>
                        <input
                          type="number"
                          name="tax_rate"
                          value={modalState.data.tax_rate}
                          onChange={handleModalInputChange}
                          onFocus={handleModalNumericFocus}
                          onBlur={(e) => handleModalNumericBlur(e, "tax_rate")}
                          onWheel={disableNumberInputScroll}
                          className="input"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                )}
                {formData.columnVisibility?.[modalState.type]?.kitchen !== false && !getFieldHidden("kitchen", false, modalState.type) && (
                  <div className="form-group">
                    <label>Kitchen</label>
                    {(() => {
                      const modalFields = modalState.type === 'addons' ? addonDoctypeFields : (modalState.type === 'combos' ? comboDoctypeFields : []);
                      const kitchenFieldDef = modalFields.find(f => f.id === "kitchen");
                      return kitchenFieldDef?.allow_create_new ? (
                        <CreatableSelect
                          placeholder="Select or type to create kitchen..."
                          options={[CREATE_NEW_OPTION, ...kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))]}
                          value={modalState.data.kitchen ? (modalState.data.kitchen === 'create_new' ? null : { value: modalState.data.kitchen, label: modalState.data.kitchen }) : null}
                          onChange={(selected) => {
                            if (selected?.value === "create_new") {
                              setNewKitchenName("");
                              setShowNewKitchenModal(true);
                            } else {
                              handleModalInputChange({ target: { name: "kitchen", value: selected ? selected.value : "" } });
                            }
                          }}
                          onCreateOption={(inputValue) => {
                            setNewKitchenName(inputValue);
                            setShowNewKitchenModal(true);
                          }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              minHeight: '45px',
                              marginBottom: '15px',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            }),
                            menu: (base) => ({
                              ...base,
                              position: 'relative',
                              zIndex: 10
                            })
                          }}
                        />
                      ) : (
                        <Select
                          placeholder="Select kitchen..."
                          options={kitchens.map(k => ({ value: k.kitchen_name, label: k.kitchen_name }))}
                          value={modalState.data.kitchen ? { value: modalState.data.kitchen, label: modalState.data.kitchen } : null}
                          onChange={(selected) => {
                            handleModalInputChange({ target: { name: "kitchen", value: selected ? selected.value : "" } });
                          }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              minHeight: '45px',
                              marginBottom: '15px',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            }),
                            menu: (base) => ({
                              ...base,
                              position: 'relative',
                              zIndex: 10
                            })
                          }}
                        />
                      );
                    })()}
                  </div>
                )}
                {formData.columnVisibility?.[modalState.type]?.item_group !== false && !getFieldHidden("item_group", false, modalState.type) && (
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label>Item Group</label>
                    {(() => {
                      const modalFields = modalState.type === 'addons' ? addonDoctypeFields : (modalState.type === 'combos' ? comboDoctypeFields : []);
                      const groupFieldDef = modalFields.find(f => f.id === "item_group");
                      return groupFieldDef?.allow_create_new ? (
                        <CreatableSelect
                          placeholder="Select or type to create group..."
                          options={[CREATE_NEW_OPTION, ...itemGroups.map(g => ({ value: g.group_name, label: g.group_name }))]}
                          value={modalState.data.item_group ? (modalState.data.item_group === 'create_new' ? null : { value: modalState.data.item_group, label: modalState.data.item_group }) : null}
                          onChange={(selected) => {
                            if (selected?.value === "create_new") {
                              setNewItemGroupName("");
                              setShowNewItemGroupModal(true);
                            } else {
                              handleModalInputChange({ target: { name: "item_group", value: selected ? selected.value : "" } });
                            }
                          }}
                          onCreateOption={(inputValue) => {
                            handleCreateNewItemGroup(inputValue);
                          }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              minHeight: '45px',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            }),
                            menu: (base) => ({
                              ...base,
                              position: 'relative',
                              zIndex: 10
                            })
                          }}
                        />
                      ) : (
                        <Select
                          placeholder="Select group..."
                          options={itemGroups.map(g => ({ value: g.group_name, label: g.group_name }))}
                          value={modalState.data.item_group ? { value: modalState.data.item_group, label: modalState.data.item_group } : null}
                          onChange={(selected) => {
                            handleModalInputChange({ target: { name: "item_group", value: selected ? selected.value : "" } });
                          }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '10px',
                              borderColor: '#bfdbfe',
                              minHeight: '45px',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#3b82f6' }
                            }),
                            menu: (base) => ({
                              ...base,
                              position: 'relative',
                              zIndex: 10
                            })
                          }}
                        />
                      );
                    })()}
                  </div>
                )}

                {/* --- Modal Company and Branch Assignment UI --- */}
                {formData.columnVisibility?.[modalState.type]?.companies !== false && showCompanyAssign && (
                  <div className="form-group mb-4" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginTop: '15px' }}>
                    <label className="fw-bold mb-4 d-block" style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                      Assign to Companies <span className="text-danger">*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {companyOptions.map((comp, idx) => {
                        const isSelected = (modalState.data.company_names || []).some(cn => matchTenancy(cn, comp));
                        return (
                          <div key={idx} style={{
                            border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                            boxShadow: isSelected ? '0 10px 20px -5px rgba(59, 130, 246, 0.05)' : 'none',
                            transition: 'all 0.3s ease',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!isGroupAdmin && !isCompanyAdmin}
                                onChange={() => handleModalInputChange({ target: { name: 'company_toggle', value: comp } })}
                                id={`modal-comp-${idx}`}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                              />
                              <label htmlFor={`modal-comp-${idx}`} style={{ margin: 0, fontWeight: '700', color: '#1e293b', cursor: 'pointer', fontSize: '14px' }}>
                                {comp}
                              </label>
                            </div>
                            {isSelected && (
                              <div style={{ marginTop: '12px' }}>
                                <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '12px' }}>
                                  Price Override ({getCompanyDisplaySymbol(comp)})
                                </label>
                                <input
                                  type="number"
                                  className="input"
                                  placeholder={`Base: ${modalState.data.price || 0}`}
                                  value={modalState.data.company_prices?.[comp] || ''}
                                  onChange={(e) => handleModalInputChange({
                                    target: {
                                      name: 'company_price_override',
                                      value: { company: comp, price: e.target.value }
                                    }
                                  })}
                                  style={{
                                    padding: '8px 10px',
                                    fontSize: '12px',
                                    width: '100%',
                                    border: modalState.data.company_prices?.[comp] ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                                    borderRadius: '8px',
                                    backgroundColor: modalState.data.company_prices?.[comp] ? '#f0f9ff' : '#fff'
                                  }}
                                  min="0"
                                  step="0.01"
                                  onWheel={disableNumberInputScroll}
                                />
                              </div>
                            )}
                            {isSelected && !userBranch && companyBranchesMap[comp] && companyBranchesMap[comp].length > 0 && formData.columnVisibility?.[modalState.type]?.branches !== false && (
                              <div style={{ marginTop: '16px', paddingLeft: '12px', borderLeft: '2px solid #3b82f6' }}>
                                <h6 style={{ fontSize: '12px', color: '#1e293b', marginBottom: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  Branches in {comp}
                                </h6>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                  {companyBranchesMap[comp].map((branch, bIdx) => {
                                    const isBranchSelected = (modalState.data.branch_names || []).some(bn => matchTenancy(bn, branch));
                                    return (
                                      <div key={bIdx} style={{ padding: '8px 12px', backgroundColor: isBranchSelected ? '#f0fdf4' : '#f8fafc', borderRadius: '6px', border: isBranchSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0', transition: 'all 0.2s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <input
                                            type="checkbox"
                                            checked={isBranchSelected}
                                            onChange={() => handleModalInputChange({ target: { name: 'branch_toggle', value: branch } })}
                                            id={`modal-branch-${idx}-${bIdx}`}
                                            style={{ width: '15px', height: '15px', accentColor: '#10b981', cursor: 'pointer' }}
                                          />
                                          <label htmlFor={`modal-branch-${idx}-${bIdx}`} style={{ margin: 0, fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}>
                                            {branch}
                                          </label>
                                        </div>
                                        {isBranchSelected && (
                                          <div style={{ marginTop: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                              Price Override ({getCompanyDisplaySymbol(null, branch)})
                                            </label>
                                            <input
                                              type="number"
                                              className="input"
                                              placeholder={`Base: ${modalState.data.price || 0}`}
                                              value={modalState.data.branch_prices?.[branch] || ''}
                                              onChange={(e) => handleModalInputChange({
                                                target: {
                                                  name: 'branch_price_override',
                                                  value: { branch, price: e.target.value }
                                                }
                                              })}
                                              style={{ padding: '6px', fontSize: '11px', width: '100%', border: modalState.data.branch_prices?.[branch] ? '1.5px solid #10b981' : '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: modalState.data.branch_prices?.[branch] ? '#f0fdf4' : '#fff' }}
                                              min="0"
                                              step="0.01"
                                              onWheel={disableNumberInputScroll}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.columnVisibility?.[modalState.type]?.image !== false && !getFieldHidden("image", false, modalState.type) && (
                  <div className="form-group">
                    <label>
                      Image
                      <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
                        (Image size should be 768/768px)
                      </span>
                    </label>
                    <input type="file" accept="image/*" onChange={(e) => handleModalImageUpload(e)} className="input" />
                    {modalState.data.imagePreview && (
                      <div className="image-container">
                        <img src={modalState.data.imagePreview} alt="Preview" className="image-preview" />
                        <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                          <button
                            type="button"
                            className="img-edit-button"
                            onClick={() => handleEditImage(modalState.data.imagePreview, null, null, null, null, true)}
                            style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button type="button" className="img-delete-button" onClick={() => handleModalImageDelete()} style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {formData.columnVisibility?.[modalState.type]?.variants !== false && !getFieldHidden("variants", false, modalState.type) && (
                  <div className="variants-wrapper">
                    <div className="nested-section form-group">
                      <label>Select Variant</label>
                      <select
                        name="selectedVariant"
                        value={modalState.selectedVariant}
                        onChange={handleModalInputChange}
                        className="input"
                      >
                        <option value="">Select a variant</option>
                        <option value="size">Size</option>
                        <option value="cold">Cold</option>
                        <option value="spicy">Spicy</option>
                        <option value="sugar">Sugar</option>
                      </select>
                      {modalState.selectedVariant === "size" && (
                        <div>
                          <div className="variant-toggle">
                            <label>Enable Size Variant</label>
                            <input
                              type="checkbox"
                              name="variants.size.enabled"
                              checked={modalState.data.variants.size.enabled}
                              onChange={handleModalInputChange}
                            />
                          </div>
                          {modalState.data.variants.size.enabled && (
                            <>
                              <label>Small Price ({displaySymbol})</label>
                              <input
                                type="number"
                                name="variants.size.small_price"
                                value={modalState.data.variants.size.small_price}
                                onChange={handleModalInputChange}
                                onFocus={(e) => handleModalVariantNumericFocus(e, "size", "small_price")}
                                onBlur={(e) => handleModalVariantNumericBlur(e, "size", "small_price")}
                                onWheel={disableNumberInputScroll}
                                className="input"
                                min="0"
                                step="0.01"
                              />
                              <label>Medium Price ({displaySymbol})</label>
                              <input
                                type="number"
                                name="variants.size.medium_price"
                                value={modalState.data.variants.size.medium_price}
                                onChange={handleModalInputChange}
                                onFocus={(e) => handleModalVariantNumericFocus(e, "size", "medium_price")}
                                onBlur={(e) => handleModalVariantNumericBlur(e, "size", "medium_price")}
                                onWheel={disableNumberInputScroll}
                                className="input"
                                min="0"
                                step="0.01"
                              />
                              <label>Large Price ({displaySymbol})</label>
                              <input
                                type="number"
                                name="variants.size.large_price"
                                value={modalState.data.variants.size.large_price}
                                onChange={handleModalInputChange}
                                onFocus={(e) => handleModalVariantNumericFocus(e, "size", "large_price")}
                                onBlur={(e) => handleModalVariantNumericBlur(e, "size", "large_price")}
                                onWheel={disableNumberInputScroll}
                                className="input"
                                min="0"
                                step="0.01"
                              />
                            </>
                          )}
                        </div>
                      )}
                      {modalState.selectedVariant === "cold" && (
                        <div>
                          <div className="variant-toggle">
                            <label>Enable Cold Variant</label>
                            <input
                              type="checkbox"
                              name="variants.cold.enabled"
                              checked={modalState.data.variants.cold.enabled}
                              onChange={handleModalInputChange}
                            />
                          </div>
                          {modalState.data.variants.cold.enabled && (
                            <>
                              <label>Ice Preference</label>
                              <select
                                name="variants.cold.ice_preference"
                                value={modalState.data.variants.cold.ice_preference}
                                onChange={handleModalInputChange}
                                className="input"
                              >
                                <option value="without_ice">Without Ice</option>
                                <option value="with_ice">With Ice</option>
                              </select>
                              {modalState.data.variants.cold.ice_preference === "with_ice" && (
                                <>
                                  <label>Ice Price ({displaySymbol})</label>
                                  <input
                                    type="number"
                                    name="variants.cold.ice_price"
                                    value={modalState.data.variants.cold.ice_price}
                                    onChange={handleModalInputChange}
                                    onFocus={(e) => handleModalVariantNumericFocus(e, "cold", "ice_price")}
                                    onBlur={(e) => handleModalVariantNumericBlur(e, "cold", "ice_price")}
                                    onWheel={disableNumberInputScroll}
                                    className="input"
                                    min="0"
                                    step="0.01"
                                  />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {modalState.selectedVariant === "spicy" && (
                        <div>
                          <div className="variant-toggle">
                            <label>Enable Spicy Variant</label>
                            <input
                              type="checkbox"
                              name="variants.spicy.enabled"
                              checked={modalState.data.variants.spicy.enabled}
                              onChange={handleModalInputChange}
                            />
                          </div>
                          {modalState.data.variants.spicy.enabled && (
                            <div className="variant-section">
                              <label>Spicy Price ({displaySymbol})</label>
                              <input
                                type="number"
                                name="variants.spicy.spicy_price"
                                value={modalState.data.variants.spicy.spicy_price}
                                onChange={handleModalInputChange}
                                onFocus={(e) => handleModalVariantNumericFocus(e, "spicy", "spicy_price")}
                                onBlur={(e) => handleModalVariantNumericBlur(e, "spicy", "spicy_price")}
                                onWheel={disableNumberInputScroll}
                                className="input"
                                min="0"
                                step="0.01"
                              />
                              <label>
                                Spicy Image
                                <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
                                  (Image size should be 768/768px)
                                </span>
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleModalImageUpload(e, "spicy", "spicy_image")}
                                className="input"
                              />
                              {(modalState.data.variants.spicy.spicy_image || modalState.data.variants.spicy.spicy_imageTemp) && (
                                <div className="image-container">
                                  <img
                                    src={getImageUrl(modalState.data.variants.spicy.spicy_image, baseUrl)}
                                    alt="Spicy Preview"
                                    className="image-preview"
                                  />
                                  <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    <button
                                      type="button"
                                      className="img-edit-button"
                                      onClick={() => handleEditImage(getImageUrl(modalState.data.variants.spicy.spicy_image, baseUrl), null, "spicy_image", "spicy", null, true)}
                                      style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                    >
                                      <FaEdit /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="img-delete-button"
                                      onClick={() => handleModalImageDelete("spicy", "spicy_image")}
                                      style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                    >
                                      <FaTrash /> Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                              <label>Non-Spicy Price ({displaySymbol})</label>
                              <input
                                type="number"
                                name="variants.spicy.non_spicy_price"
                                value={modalState.data.variants.spicy.non_spicy_price}
                                onChange={handleModalInputChange}
                                onFocus={(e) => handleModalVariantNumericFocus(e, "spicy", "non_spicy_price")}
                                onBlur={(e) => handleModalVariantNumericBlur(e, "spicy", "non_spicy_price")}
                                onWheel={disableNumberInputScroll}
                                className="input"
                                min="0"
                                step="0.01"
                              />
                              <label>
                                Non-Spicy Image
                                <span style={{ fontSize: "12px", color: "red", marginLeft: "10px" }}>
                                  (Image size should be 768/768px)
                                </span>
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleModalImageUpload(e, "spicy", "non_spicy_image")}
                                className="input"
                              />
                              {(modalState.data.variants.spicy.non_spicy_image || modalState.data.variants.spicy.non_spicy_imageTemp) && (
                                <div className="image-container">
                                  <img
                                    src={getImageUrl(modalState.data.variants.spicy.non_spicy_image, baseUrl)}
                                    alt="Non-Spicy Preview"
                                    className="image-preview"
                                  />
                                  <div className="button-group" style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    <button
                                      type="button"
                                      className="img-edit-button"
                                      onClick={() => handleEditImage(getImageUrl(modalState.data.variants.spicy.non_spicy_image, baseUrl), null, "non_spicy_image", "spicy", null, true)}
                                      style={{ flex: 1, minWidth: 0, background: '#3498db', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                    >
                                      <FaEdit /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="img-delete-button"
                                      onClick={() => handleModalImageDelete("spicy", "non_spicy_image")}
                                      style={{ flex: 1, minWidth: 0, background: '#e74c3c', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                    >
                                      <FaTrash /> Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {modalState.selectedVariant === "sugar" && (
                        <div>
                          <div className="variant-toggle">
                            <label>Enable Sugar Variant</label>
                            <input
                              type="checkbox"
                              name="variants.sugar.enabled"
                              checked={modalState.data.variants.sugar.enabled}
                              onChange={handleModalInputChange}
                            />
                          </div>
                          {modalState.data.variants.sugar.enabled && (
                            <div className="variant-section">
                              <label>Sugar Level</label>
                              <select
                                name="variants.sugar.level"
                                value={modalState.data.variants.sugar.level}
                                onChange={handleModalInputChange}
                                className="input"
                              >
                                <option value="less">Less Sugar</option>
                                <option value="medium">Medium Sugar</option>
                                <option value="extra">Extra Sugar</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="variant-section">
                        {modalState.data.variants.size.enabled && modalState.selectedVariant !== "size" && (
                          <div className="nested-section">
                            <h6>Size Variant</h6>
                            <table className="variant-table">
                              <thead>
                                <tr>
                                  <th>Size</th>
                                  <th>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Small</td>
                                  <td>{displaySymbol}{modalState.data.variants.size.small_price}</td>
                                </tr>
                                <tr>
                                  <td>Medium</td>
                                  <td>{displaySymbol}{modalState.data.variants.size.medium_price}</td>
                                </tr>
                                <tr>
                                  <td>Large</td>
                                  <td>{displaySymbol}{modalState.data.variants.size.large_price}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {modalState.data.variants.cold.enabled && modalState.selectedVariant !== "cold" && (
                          <div className="nested-section">
                            <h6>Cold Variant</h6>
                            <table className="variant-table">
                              <thead>
                                <tr>
                                  <th>Ice Preference</th>
                                  <th>Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>{modalState.data.variants.cold.ice_preference === "with_ice" ? "With Ice" : "Without Ice"}</td>
                                  <td>
                                    {modalState.data.variants.cold.ice_preference === "with_ice"
                                      ? <>{displaySymbol}{modalState.data.variants.cold.ice_price}</>
                                      : <>{displaySymbol}0</>}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {modalState.data.variants.spicy.enabled && modalState.selectedVariant !== "spicy" && (
                          <div className="nested-section">
                            <h6>Spicy Variant</h6>
                            <table className="variant-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Price</th>
                                  <th>Image</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Spicy</td>
                                  <td>{displaySymbol}{modalState.data.variants.spicy.spicy_price}</td>
                                  <td>
                                    {(modalState.data.variants.spicy.spicy_imageTemp || modalState.data.variants.spicy.spicy_image) ? (
                                      <img
                                        src={getImageUrl(modalState.data.variants.spicy.spicy_image, baseUrl)}
                                        alt="Spicy Preview"
                                        className="image-preview"
                                      />
                                    ) : (
                                      "No Image"
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td>Non-Spicy</td>
                                  <td>{displaySymbol}{modalState.data.variants.spicy.non_spicy_price}</td>
                                  <td>
                                    {(modalState.data.variants.spicy.non_spicy_imageTemp || modalState.data.variants.spicy.non_spicy_image) ? (
                                      <img
                                        src={getImageUrl(modalState.data.variants.spicy.non_spicy_image, baseUrl)}
                                        alt="Non-Spicy Preview"
                                        className="image-preview"
                                      />
                                    ) : (
                                      "No Image"
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {modalState.data.variants.sugar.enabled && modalState.selectedVariant !== "sugar" && (
                          <div className="nested-section">
                            <h6>Sugar Variant</h6>
                            <table className="variant-table">
                              <thead>
                                <tr>
                                  <th>Sugar Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    {modalState.data.variants.sugar.level.charAt(0).toUpperCase() +
                                      modalState.data.variants.sugar.level.slice(1)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                    {variantDoctypeFields.some(f => f.id === 'custom_variant' && !f.hidden) && !getFieldHidden("custom_variant", false, modalState.type) && (
                      <div className="nested-section">
                        <h5 className="section-title">Custom Variants</h5>
                        <div className="form-group">
                          <label>Select Custom Variant</label>
                          <select
                            value={modalState.modalCustomSelectedVariantId}
                            onChange={(e) => handleModalCustomVariantSelection(e.target.value)}
                            className="input"
                          >
                            <option value="">Select a variant</option>
                            {customVariants.map(variant => (
                              <option key={variant._id} value={variant._id}>
                                {variant.heading}
                              </option>
                            ))}
                          </select>
                        </div>
                        {modalState.modalCustomSelectedVariantDetails && (
                          <div className="variant-section">
                            {formData.columnVisibility?.[modalState.type]?.variants !== false && renderModalCustomVariantFields(
                              modalState.data.custom_variants.find(
                                v => v._id === modalState.modalCustomSelectedVariantId
                              )
                            )}
                          </div>
                        )}
                        {modalState.data.custom_variants
                          .filter(v => v.enabled && v._id !== modalState.modalCustomSelectedVariantId)
                          .map(variant => (
                            <div key={variant._id} className="nested-section">
                              <h6>{variant.heading}</h6>
                              <table className="variant-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Image</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {variant.subheadings.map(sub => (
                                    <tr key={sub.name}>
                                      <td>{sub.name}</td>
                                      <td>{sub.price ? <>{displaySymbol}{sub.price}</> : "N/A"}</td>
                                      <td>
                                        {(sub.imageTemp || sub.image) ? (
                                          <img
                                            src={getImageUrl(sub.image, baseUrl)}
                                            alt={`${sub.name} Preview`}
                                            className="image-preview"
                                          />
                                        ) : (
                                          "No Image"
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                {formData.columnVisibility?.[modalState.type]?.ingredients !== false && !getFieldHidden("ingredients", false, modalState.type) && (
                  <div className="form-group">
                    <button
                      type="button"
                      className="save-btn" style={{ backgroundColor: "#3b82f6", marginBottom: "15px" }}
                      onClick={() => {
                        const name = modalState.addonType === "new" ? modalState.data.newName : modalState.data.name1;
                        if (name) {
                          const type = modalState.type === "addons" ? "addon" : "combo";
                          navigate("/add-ingredients-nutrition", {
                            state: {
                              name,
                              type,
                              itemId: itemToEdit?._id || "new",
                              index: modalState.index,
                              formData: formData,
                              isEditing: isEditing,
                              itemToEdit: itemToEdit,
                            },
                          });
                        } else {
                          setWarningMessage("Please enter a name first");
                        }
                      }}
                    >
                      Manage Ingredients and Nutrition
                    </button>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="save-btn" onClick={handleModalSave}>
                    Save
                  </button>
                  {modalState.index !== null && modalState.index < formData[modalState.type].length && (
                    <button type="button" className="delete-button" onClick={handleDeleteEntry}>
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </SidePanel>
          <SidePanel isOpen={showNewKitchenModal} onClose={() => setShowNewKitchenModal(false)} title="Create New Kitchen">
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>
                  {kitchenDoctypeFields.find(f => ['kitchen_name', 'kitchen', 'name'].includes(f.id))?.label || 'Kitchen Name'}
                </label>
                <input
                  type="text"
                  value={newKitchenName}
                  onChange={(e) => setNewKitchenName(e.target.value)}
                  className="input"
                  placeholder={`e.g. ${kitchenDoctypeFields.find(f => ['kitchen_name', 'kitchen', 'name'].includes(f.id))?.label || 'Main Kitchen'}`}
                />
              </div>

              {kitchenDoctypeFields.filter(f => !['kitchen_name', 'kitchen', 'name', 'company', 'company_name'].includes(f.id) && !f.hidden).map(f => (
                <div key={f.id} className="form-group">
                  <label>{f.label}</label>
                  <input
                    type="text"
                    value={newKitchenFields[f.id] || ""}
                    onChange={(e) => setNewKitchenFields(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="input"
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {showCompanyAssign && (
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                    Assign to Companies <span className="text-danger">*</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {companyOptions.map((comp, idx) => {
                      const isSelected = selectedCompanies.includes(comp);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isGroupAdmin && !isCompanyAdmin}
                            onChange={(e) => {
                              const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
                              const isGlobal = (c) => globalTags.includes(c);
                              if (e.target.checked) {
                                if (isGlobal(comp)) setSelectedCompanies([comp]);
                                else setSelectedCompanies(prev => prev.filter(c => !isGlobal(c)).concat(comp));
                              } else {
                                setSelectedCompanies(prev => prev.filter(c => c !== comp));
                              }
                            }}
                            id={`modal-kit-comp-${idx}`}
                          />
                          <label htmlFor={`modal-kit-comp-${idx}`} style={{ margin: 0, fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>{comp}</label>
                        </div>
                      );
                    })}
                  </div>

                  {!userBranch && selectedCompanies.length > 0 && selectedCompanies.some(comp => companyBranchesMap[comp] && companyBranchesMap[comp].length > 0) && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                        Select Branches
                      </label>
                      {selectedCompanies.map(comp => (
                        companyBranchesMap[comp] && companyBranchesMap[comp].length > 0 && (
                          <div key={comp} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '5px' }}>{comp} Branches</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {companyBranchesMap[comp].map((branch, bIdx) => {
                                const isBranchSelected = branchNames.includes(branch);
                                return (
                                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: isBranchSelected ? '1px solid #10b981' : '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', backgroundColor: isBranchSelected ? '#f0fdf4' : '#ffffff' }}>
                                    <input
                                      type="checkbox"
                                      checked={isBranchSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) setBranchNames(prev => [...prev, branch]);
                                        else setBranchNames(prev => prev.filter(b => b !== branch));
                                      }}
                                      id={`modal-kit-br-${comp}-${bIdx}`}
                                    />
                                    <label htmlFor={`modal-kit-br-${comp}-${bIdx}`} style={{ margin: 0, fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>{branch}</label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="save-btn"
                onClick={() => handleCreateNewKitchen()}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Create Kitchen
              </button>
            </div>
          </SidePanel>
          <SidePanel isOpen={showNewItemGroupModal} onClose={() => setShowNewItemGroupModal(false)} title="Create New Item Group">
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>
                  {itemGroupDoctypeFields.find(f => ['group_name', 'item_group', 'name'].includes(f.id))?.label || 'Item Group Name'}
                </label>
                <input
                  type="text"
                  value={newItemGroupName}
                  onChange={(e) => setNewItemGroupName(e.target.value)}
                  className="input"
                  placeholder={`e.g. ${itemGroupDoctypeFields.find(f => ['group_name', 'item_group', 'name'].includes(f.id))?.label || 'Beverages'}`}
                />
              </div>

              {itemGroupDoctypeFields.filter(f => !['group_name', 'item_group', 'name', 'parent_item_group', 'company', 'company_name', 'is_group'].includes(f.id) && !f.hidden).map(f => (
                <div key={f.id} className="form-group">
                  <label>{f.label}</label>
                  <input
                    type="text"
                    value={newItemGroupFields[f.id] || ""}
                    onChange={(e) => setNewItemGroupFields(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="input"
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {showCompanyAssign && (
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                    Assign to Companies <span className="text-danger">*</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {companyOptions.map((comp, idx) => {
                      const isSelected = selectedCompanies.includes(comp);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', backgroundColor: isSelected ? '#eff6ff' : '#ffffff' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isGroupAdmin && !isCompanyAdmin}
                            onChange={(e) => {
                              const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
                              const isGlobal = (c) => globalTags.includes(c);
                              if (e.target.checked) {
                                if (isGlobal(comp)) setSelectedCompanies([comp]);
                                else setSelectedCompanies(prev => prev.filter(c => !isGlobal(c)).concat(comp));
                              } else {
                                setSelectedCompanies(prev => prev.filter(c => c !== comp));
                              }
                            }}
                            id={`modal-ig-comp-${idx}`}
                          />
                          <label htmlFor={`modal-ig-comp-${idx}`} style={{ margin: 0, fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>{comp}</label>
                        </div>
                      );
                    })}
                  </div>

                  {!userBranch && selectedCompanies.length > 0 && selectedCompanies.some(comp => companyBranchesMap[comp] && companyBranchesMap[comp].length > 0) && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                        Select Branches
                      </label>
                      {selectedCompanies.map(comp => (
                        companyBranchesMap[comp] && companyBranchesMap[comp].length > 0 && (
                          <div key={comp} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '5px' }}>{comp} Branches</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {companyBranchesMap[comp].map((branch, bIdx) => {
                                const isBranchSelected = branchNames.includes(branch);
                                return (
                                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: isBranchSelected ? '1px solid #10b981' : '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', backgroundColor: isBranchSelected ? '#f0fdf4' : '#ffffff' }}>
                                    <input
                                      type="checkbox"
                                      checked={isBranchSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) setBranchNames(prev => [...prev, branch]);
                                        else setBranchNames(prev => prev.filter(b => b !== branch));
                                      }}
                                      id={`modal-ig-br-${comp}-${bIdx}`}
                                    />
                                    <label htmlFor={`modal-ig-br-${comp}-${bIdx}`} style={{ margin: 0, fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>{branch}</label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="save-btn"
                onClick={() => handleCreateNewItemGroup()}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Create Item Group
              </button>
            </div>
          </SidePanel>
        </div>
      </div>





      {/* New Kitchen Modal (Dynamic Based on Kitchen DocType) */}


      {/* New Item Group Modal (Dynamic Based on Item Group DocType) */}



      <Modal isOpen={cropModalOpen} onClose={() => setCropModalOpen(false)} title="Crop Image" className="crop-modal">
        <div className="crop-container-wrapper" style={{ height: '400px', position: 'relative', width: '100%', background: '#333' }}>
          <Cropper
            image={currentImageToCrop}
            crop={crop}
            zoom={zoom}
            minZoom={0.1}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            restrictPosition={false}
          />
        </div>
        <div className="controls" style={{ padding: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', justifyContent: 'center', background: '#f8f9fa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>Zoom:</label>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="zoom-range"
              style={{ width: '100px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>Width (px):</label>
            <input
              type="number"
              value={targetSize.width}
              onChange={(e) => {
                const w = Number(e.target.value);
                setTargetSize(prev => ({ ...prev, width: w }));
                setAspect(w / targetSize.height);
              }}
              className="input"
              style={{ width: '80px', padding: '5px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>Height (px):</label>
            <input
              type="number"
              value={targetSize.height}
              onChange={(e) => {
                const h = Number(e.target.value);
                setTargetSize(prev => ({ ...prev, height: h }));
                setAspect(targetSize.width / h);
              }}
              className="input"
              style={{ width: '80px', padding: '5px' }}
            />
          </div>

          <button className="save-btn" onClick={handleCropSave} style={{ padding: '8px 20px' }}>Save Crop</button>
        </div>
        {croppedAreaPixels && (
          <div style={{ textAlign: 'center', paddingBottom: '10px', fontSize: '12px', color: '#666' }}>
            Selection Size: {Math.round(croppedAreaPixels.width)} x {Math.round(croppedAreaPixels.height)} px
          </div>
        )}
      </Modal>

      <Modal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} title="Manage Column Visibility" className="column-visibility-modal">
        <div className="tab-container">
          {['item', 'addons', 'combos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveColumnTab(tab)}
              className={`tab-button ${activeColumnTab === tab ? 'active' : ''}`}
            >
              {tab === 'item' ? 'Item Fields' : tab === 'addons' ? 'Addon Fields' : 'Combo Fields'}
            </button>
          ))}
        </div>
        <div className="field-grid">
          {Object.keys(defaultColumnVisibility[activeColumnTab]).map(field => (
            <div key={field} className="field-card">
              <input
                type="checkbox"
                checked={formData.columnVisibility[activeColumnTab][field] !== false}
                onChange={() => handleColumnVisibilityChange(activeColumnTab, field)}
                id={`vis-${activeColumnTab}-${field}`}
              />
              <label htmlFor={`vis-${activeColumnTab}-${field}`}>
                {fieldLabels[activeColumnTab][field] || field.replace(/_/g, ' ')}
              </label>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button onClick={() => setIsColumnModalOpen(false)} className="done-button">Done</button>
        </div>
      </Modal>

      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={handleRefreshCustomization}
        targetDocType={customizationTarget}
      />
    </div>
  );
};
export default CreateItemPage;
