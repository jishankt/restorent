// src/components/ItemListPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { UserContext } from '../../Context/UserContext';
import CurrencySymbol, { resolveCurrencyCode } from '../CurrencySymbol';
import { Modal, Button, Card, Form, Badge, ListGroup, Table } from "react-bootstrap";
import { FaArrowLeft, FaPlusCircle, FaEye, FaEyeSlash, FaTrash, FaSync, FaCloudDownloadAlt, FaList, FaTh, FaEdit } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
import SyncItemModal from "./SyncItemModal";
import 'bootstrap/dist/css/bootstrap.min.css';

// Premium Scrollbar Styling
const scrollbarStyles = `
  .custom-sidebar-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .custom-sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-sidebar-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
    background: #28a745;
  }
  .custom-modal-90w {
    max-width: 90% !important;
    width: 90% !important;
  }
  .custom-modal-80w {
    max-width: 80% !important;
    width: 80% !important;
  }
`;
const ItemListPage = () => {
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [itemList, setItemList] = useState([]);
  const [comboList, setComboList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [gallerySearchQuery, setGallerySearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [offerItem, setOfferItem] = useState(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerStartTime, setOfferStartTime] = useState("");
  const [offerEndTime, setOfferEndTime] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [nutritionData, setNutritionData] = useState({ ingredients: [], nutrition: {} });
  const [itemSales, setItemSales] = useState([]);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [showPermModal, setShowPermModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null, isList: false, message: "" });
  
  const executeDelete = async () => {
    const { item, isList } = deleteConfirm;
    setDeleteConfirm({ ...deleteConfirm, show: false });
    
    try {
      if (isList) setLoading(true);
      
      const isComboItem = item.isCombo || item.type === 'combo_offer' || item.item_group === 'Combos Offer';
      const endpoint = isComboItem
        ? `${baseUrl}/api/combo-offer/${item._id}`
        : `${baseUrl}/api/items/${item._id}`;
        
      const deleteHeaders = getHeaders();
      const response = await axios.delete(endpoint, { headers: deleteHeaders });
      
      if (response.status === 200 || (response.data && response.data.success)) {
        if (!isList) {
          handleCloseModal();
        } else {
          setSelectedItem(null);
        }
        // Always fetch to keep data consistent
        handleViewItems();
        handleViewCombos();
      } else {
        alert("Failed to delete item.");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert(error.response?.data?.message || "An error occurred while deleting.");
    } finally {
      if (isList) setLoading(false);
    }
  };

  const [permModalMsg, setPermModalMsg] = useState("");
  const [useCurrencySymbol, setUseCurrencySymbol] = useState(false);
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(() => localStorage.getItem("active_branch") || "All Branches");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(() => {
    const active = localStorage.getItem("active_company");
    return (active === "All" || !active) ? "All Companies" : active;
  });
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [isListView, setIsListView] = useState(false);
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});

  const fetchAllCompanyBranches = async (companies) => {
    try {
      const branchPromises = companies.map((comp) => {
        let url = `${baseUrl}/api/branches?company_name=${encodeURIComponent(comp)}`;
        const headers = { ...getHeaders(), "X-Company-Name": comp };
        return axios.get(url, { headers })
          .then(res => ({ comp, data: res.data.branches || res.data || [] }))
          .catch(err => {
            console.error(`Error fetching branches for company ${comp}:`, err);
            return { comp, data: [] };
          });
      });
      const results = await Promise.all(branchPromises);
      const newCompanyBranchesMap = {};
      const allBranchesSet = new Set();
      results.forEach((res) => {
        const branches = res.data.map((b) => (typeof b === "string" ? b : b.branch_name || b.branch || b.name || "")).map(b => b.trim()).filter(b => b);
        newCompanyBranchesMap[res.comp] = branches;
        branches.forEach(b => allBranchesSet.add(b));
      });
      setCompanyBranchesMap(newCompanyBranchesMap);
      setAvailableBranches(Array.from(allBranchesSet));
    } catch (err) {
      console.warn("Failed to fetch all company branches:", err);
    }
  };

  useEffect(() => {
    if (baseUrl !== null && (companyOptions.length > 0 || userCompany)) {
      const companiesToFetch = companyOptions.length > 0 ? companyOptions : [userCompany];
      fetchAllCompanyBranches(companiesToFetch);
    }
  }, [baseUrl, companyOptions, userCompany]);

  const fetchDoctype = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/doctypes/Item`, { headers: getHeaders() });
      setDoctypeFields(response.data.fields || []);
    } catch (e) {
      console.error("Error fetching Item doctype:", e);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();

  const getImageUrl = (imagePath, baseUrl) => {
    if (!imagePath) return "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
    if (imagePath && imagePath.startsWith("data:")) return imagePath;

    // Standardize path - remove leading slash
    let cleanPath = (imagePath || "").toString().trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    // Extract filename for API routes
    const fileName = cleanPath.split("/").pop();

    if (cleanPath.startsWith("api/")) return `${baseUrl}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;

    // Explicitly check for upload directory prefix or match common patterns
    if (cleanPath.includes("addon-images") || cleanPath.includes("addon_images")) {
      return `${baseUrl}/api/images/${fileName}`;
    }
    if (cleanPath.includes("combo-images") || cleanPath.includes("combo_images")) {
      return `${baseUrl}/api/combo-images/${fileName}`;
    }

    // Default to item images
    return `${baseUrl}/api/images/${fileName}`;
  };

  const getUploadedImages = (item) => {
    if (!item.images) return [];
    try {
      if (Array.isArray(item.images)) return item.images.map(img => `/api/images/${img}`);
      if (typeof item.images === 'string' && item.images.startsWith('[')) {
        return JSON.parse(item.images).map(img => `/api/images/${img}`);
      }
      return [`/api/images/${item.images}`];
    } catch (e) { return []; }
  };

  const getComboItemsWithImages = (combo) => {
    if (!combo.items || !Array.isArray(combo.items)) return [];
    return combo.items.map(ci => ({
      name: ci.data?.item_name || ci.data?.name1 || "Item",
      image: ci.data?.image || ""
    }));
  };

  // Helper for resilient tenancy matching (ignores spaces and casing)
  const normalize = (val) => (val || "").toString().toLowerCase().replace(/\s/g, '').trim();
  const matchTenancy = (val1, val2, strict = false) => {
    if (!val1 || !val2) return false;
    const n1 = normalize(val1);
    const n2 = normalize(val2);
    const masterLabels = ['all', 'global', 'any', 'allbranches'];
    const isMaster1 = masterLabels.includes(n1);
    const isMaster2 = masterLabels.includes(n2);

    if (strict) {
      // In strict mode, 'global'/'all' only match each other. They do not match specific branches.
      if (isMaster1 && isMaster2) return true;
      return n1 === n2;
    }

    // Broad match for master/template labels (Symmetric)
    if (isMaster1 || isMaster2) return true;
    return n1 === n2;
  };

  const displayItems = React.useMemo(() => {
    const activeCompHeader = localStorage.getItem('active_company');
    const allCandidates = [];

    const processItems = (items) => {
      const activeCompHeader = localStorage.getItem('active_company') || "";
      const activeBranchHeader = localStorage.getItem('active_branch') || "Global";
      const activeUIBranch = selectedBranchFilter;
      const isSpecificBranchActive = activeUIBranch && activeUIBranch !== 'All Branches' && activeUIBranch !== 'All';

      // PRE-PROCESS: Identify all specific companies we are currently viewing
      const expansionTargets = new Set();
      (companyOptions || []).forEach(c => {
        const cNorm = normalize(c);
        if (cNorm && !['all', 'global'].includes(cNorm)) {
          expansionTargets.add(c.trim());
        }
      });
      const systemCompanies = Array.from(expansionTargets);

      items.forEach(item => {
        // Resolve all companies this item belongs to
        const rawComps = (item.company_names || []).concat(item.company_name ? [item.company_name] : []).concat(item.company ? [item.company] : []);
        // Flatmap to support comma-separated strings natively
        const flattenedComps = rawComps.flatMap(c => typeof c === 'string' ? c.split(',').map(s => s.trim()) : c);
        const cleanedComps = [...new Set(flattenedComps.filter(c => c))];

        // REFINEMENT: If we have specific company names, ignore generic "All"/"Global" tags to avoid redundancy
        const specificComps = cleanedComps.filter(c => !['all', 'global', 'pos 8', 'pos8'].includes(c.toLowerCase().trim()));
        const isUniversal = cleanedComps.length > 0 && specificComps.length === 0;

        // Expansion: If item is Universal, expand it to ALL system companies
        let possibleCompanies = [];
        if (isUniversal) {
          possibleCompanies = [...systemCompanies];
        } else {
          possibleCompanies = [...specificComps];
        }

        // Resolve all branches this item belongs to
        const pricedBranches = item.branch_prices ? Object.keys(item.branch_prices).filter(k => item.branch_prices[k] !== undefined && item.branch_prices[k] !== null && item.branch_prices[k] !== "") : [];
        const itemBranchesRaw = (item.branch_names || []).concat(item.branches || []).concat(pricedBranches).concat(item.branch_name ? [item.branch_name] : []).concat(item.branch ? [item.branch] : []);
        const flattenedBranches = itemBranchesRaw.flatMap(b => typeof b === 'string' ? b.split(',').map(s => s.trim()) : b);
        const itemBranches = flattenedBranches.length > 0 ? flattenedBranches : ["Global"];

        // Filter companies based on active header and UI filter
        const isAllComp = !activeCompHeader || activeCompHeader === 'All';

        const displayCompanies = possibleCompanies.filter(c => {
          const n1 = normalize(c);
          const isUniversalEntry = ['all', 'global', 'any', 'allbranches', 'allcompanies'].includes(n1);

          const matchesActiveHeader = isAllComp || isUniversalEntry || matchTenancy(c, activeCompHeader);
          const matchesUIFilter = selectedCompanyFilter === 'All Companies' || isUniversalEntry || matchTenancy(c, selectedCompanyFilter);

          return matchesActiveHeader && matchesUIFilter;
        });

        if (displayCompanies.length === 0) return;

        // 2. Branch Filtering & Company Assignment Isolation
        displayCompanies.forEach(displayCompany => {
          const companyBranches = companyBranchesMap[displayCompany] || [];

          // Find which branches of this item belong to displayCompany
          // IMPORTANT: If item explicitly lists a branch in branch_names, always include it.
          // Don't restrict by companyBranchesMap because a branch can be shared across companies.
          const validBranchesForCompany = itemBranches.filter(branch => {
            const isUniversalBranch = branch.toLowerCase() === 'global' || branch.toLowerCase() === 'all' || branch.toLowerCase() === 'all branches';
            const pricedBranches = item.branch_prices ? Object.keys(item.branch_prices).filter(k => item.branch_prices[k] !== undefined && item.branch_prices[k] !== null && item.branch_prices[k] !== "") : [];
            const isExplicitlyListed = (item.branch_names || []).concat(item.branches || []).concat(pricedBranches).some(b => matchTenancy(b, branch));
            return isUniversalBranch || isExplicitlyListed || companyBranches.some(b => matchTenancy(b, branch));
          });

          // Resolve branches to process for this displayCompany context
          let companyBranchesToProcess = [];
          if (isSpecificBranchActive) {
            // STRICT ISOLATION: Only show items explicitly matching the active branch.
            // Do NOT fallback to 'Global' (Company-level items) if the user wants branch-specific items.
            companyBranchesToProcess = validBranchesForCompany.filter(b => matchTenancy(b, activeUIBranch, true));
          } else {
            // All Branches view: User ONLY wants to see company-level items to avoid duplicates.
            // Branch-exclusive items will NOT be shown here. They only show when their branch is specifically selected.
            const hasGlobal = validBranchesForCompany.some(b => b.toLowerCase() === 'global' || b.toLowerCase() === 'all' || b.toLowerCase() === 'all branches') || itemBranches.length === 0 || itemBranches.some(b => ['global', 'all', 'all branches', 'any'].includes(b.toLowerCase().trim()));
            if (hasGlobal) {
              companyBranchesToProcess = ['Global'];
            } else {
              companyBranchesToProcess = [];
            }
          }

          companyBranchesToProcess.forEach(branch => {
            const isAllBranch = !activeBranchHeader || ['all branches', 'all', 'any', 'global'].includes(activeBranchHeader.toLowerCase());

            const matchesActiveBranch = isAllBranch || matchTenancy(branch, activeBranchHeader, true);
            const matchesUIBranch = selectedBranchFilter === 'All Branches' || matchTenancy(branch, selectedBranchFilter, true);

            if (!matchesActiveBranch || !matchesUIBranch) return;

            const isGlobalItem = branch.toLowerCase() === 'global';
            const isCompanyGlobal = possibleCompanies.length > 1;
            const normalizedKey = `item_${item._id}_${displayCompany}_${branch}`;

            // Isolate price overrides: Branch override active ONLY when that branch is explicitly selected
            let finalPrice = item.price_list_rate;
            if (isSpecificBranchActive && item.branch_prices && item.branch_prices[activeUIBranch] !== undefined) {
              finalPrice = Number(item.branch_prices[activeUIBranch]);
            } else if (item.company_prices && item.company_prices[displayCompany] !== undefined) {
              finalPrice = Number(item.company_prices[displayCompany]);
            } else if (item.branch_prices && item.branch_prices[branch] !== undefined && !isSpecificBranchActive) {
              if (item.company_prices && item.company_prices[displayCompany] !== undefined) {
                finalPrice = Number(item.company_prices[displayCompany]);
              } else {
                finalPrice = Number(item.price_list_rate);
              }
            } else if (item.branch_prices && item.branch_prices[branch] !== undefined) {
              finalPrice = Number(item.branch_prices[branch]);
            }

            const isNativeClone = normalize(item.branch_name || item.branch) === normalize(branch) && normalize(branch) !== 'global';

            allCandidates.push({
              ...item,
              normalized_key: normalizedKey,
              type: item.type || 'item',
              company_name: displayCompany,
              branch_name: branch,
              display_branch: isSpecificBranchActive ? activeUIBranch : branch,
              price_list_rate: finalPrice,
              specificity: (isGlobalItem ? 0 : 10) + (isCompanyGlobal ? 0 : 1) + (isNativeClone ? 50 : 0)
            });

            // Process Addons
            if (item.addons) {
              item.addons.forEach((addon, idx) => {
                if (addon.name1?.trim().toLowerCase() === item.item_name?.trim().toLowerCase()) return;

                const addonCompanies = (addon.company_names || []).concat(addon.company_name ? [addon.company_name] : []).concat(addon.company ? [addon.company] : []);
                const addonBranches = (addon.branch_names || []).concat(addon.branch_name ? [addon.branch_name] : []).concat(addon.branch ? [addon.branch] : []).map(b => b.trim());

                const isGlobalAddon = addonCompanies.length === 0 && addonBranches.length === 0;
                if (!isGlobalAddon) {
                  if (addonCompanies.length > 0 && !addonCompanies.some(c => matchTenancy(c, displayCompany))) return;
                  if (!addonBranches.some(b => matchTenancy(b, branch))) return;
                }

                let addonPrice = addon.addon_price;
                if (isSpecificBranchActive && addon.branch_prices && addon.branch_prices[activeUIBranch] !== undefined) {
                  addonPrice = Number(addon.branch_prices[activeUIBranch]);
                } else if (addon.company_prices && addon.company_prices[displayCompany] !== undefined) {
                  addonPrice = Number(addon.company_prices[displayCompany]);
                } else {
                  addonPrice = Number(addon.addon_price);
                }

                const isNativeAddonClone = normalize(addon.branch_name || addon.branch) === normalize(branch) && normalize(branch) !== 'global';

                allCandidates.push({
                  ...addon,
                  normalized_key: `${item._id}_addon_${idx}_${displayCompany}_${branch}`,
                  item_name: addon.name1,
                  image: addon.addon_image || addon.image,
                  price_list_rate: addonPrice,
                  type: 'addon',
                  parentId: item._id,
                  company_name: displayCompany,
                  branch_name: branch,
                  display_branch: isSpecificBranchActive ? activeUIBranch : branch,
                  specificity: (isGlobalItem ? 0 : 10) + (isCompanyGlobal ? 0 : 1) + (isNativeAddonClone ? 50 : 0),
                  item_group: addon.item_group || 'Addons'
                });
              });
            }

            // Process Combos
            if (item.combos) {
              item.combos.forEach((combo, idx) => {
                if (combo.name1?.trim().toLowerCase() === item.item_name?.trim().toLowerCase()) return;

                const comboCompanies = (combo.company_names || []).concat(combo.company_name ? [combo.company_name] : []).concat(combo.company ? [combo.company] : []);
                const comboBranches = (combo.branch_names || []).concat(combo.branch_name ? [combo.branch_name] : []).concat(combo.branch ? [combo.branch] : []);

                const isGlobalCombo = comboCompanies.length === 0 && comboBranches.length === 0;
                if (!isGlobalCombo) {
                  if (comboCompanies.length > 0 && !comboCompanies.some(c => matchTenancy(c, displayCompany))) return;
                  if (!comboBranches.some(b => matchTenancy(b, branch))) return;
                }

                let comboPrice = combo.combo_price;
                if (isSpecificBranchActive && combo.branch_prices && combo.branch_prices[activeUIBranch] !== undefined) {
                  comboPrice = Number(combo.branch_prices[activeUIBranch]);
                } else if (combo.company_prices && combo.company_prices[displayCompany] !== undefined) {
                  comboPrice = Number(combo.company_prices[displayCompany]);
                } else {
                  comboPrice = Number(combo.combo_price);
                }

                const isNativeComboClone = normalize(combo.branch_name || combo.branch) === normalize(branch) && normalize(branch) !== 'global';

                allCandidates.push({
                  ...combo,
                  normalized_key: `${item._id}_combo_${idx}_${displayCompany}_${branch}`,
                  item_name: combo.name1,
                  image: combo.combo_image || combo.image,
                  price_list_rate: comboPrice,
                  type: 'item_combo',
                  parentId: item._id,
                  company_name: displayCompany,
                  branch_name: branch,
                  display_branch: isSpecificBranchActive ? activeUIBranch : branch,
                  specificity: (isGlobalItem ? 0 : 10) + (possibleCompanies.length > 1 ? 0 : 1) + (isNativeComboClone ? 50 : 0),
                  item_group: combo.item_group || 'Combos'
                });
              });
            }
          });
        });
      });
    };

    processItems(itemList || []);

    const now = new Date();
    comboList.forEach(combo => {
      if (combo.offer_end_time && new Date(combo.offer_end_time) < now) return;
      const comboCompanies = (combo.company_names || []).concat(combo.company_name ? [combo.company_name] : []).concat(combo.company ? [combo.company] : []);
      const comboBranches = (combo.branch_names || []).concat(combo.branch_name ? [combo.branch_name] : []).concat(combo.branch ? [combo.branch] : []);

      const isAllComp = !activeCompHeader || activeCompHeader === 'All';
      const matchesComp = isAllComp || comboCompanies.length === 0 || comboCompanies.some(c => matchTenancy(c, activeCompHeader));

      const isUIAllComp = selectedCompanyFilter === 'All Companies';
      const matchesUIComp = isUIAllComp || comboCompanies.length === 0 || comboCompanies.some(c => matchTenancy(c, selectedCompanyFilter));

      const isAllBranch = !selectedBranchFilter || selectedBranchFilter === 'All Branches';

      let matchesBranch = false;
      if (!isAllBranch) {
        // Strict isolation: only show combo if explicitly assigned to this specific branch
        matchesBranch = comboBranches.some(b => matchTenancy(b, selectedBranchFilter, true));
      } else {
        // All branches view: show everything
        matchesBranch = true;
      }

      if (matchesComp && matchesUIComp && matchesBranch) {
        allCandidates.push({
          ...combo,
          type: combo.type || 'combo_offer',
          item_name: combo.description || combo.item_name || "Combo",
          company_name: combo.company_name || combo.company || (comboCompanies.length > 0 ? comboCompanies[0] : "Global"),
          branch_name: combo.branch_name || combo.branch || (comboBranches.length > 0 ? comboBranches[0] : "Global"),
          display_branch: combo.branch_name || combo.branch || (comboBranches.length > 0 ? comboBranches[0] : "Global"),
          specificity: (comboBranches.length === 0 || matchTenancy(comboBranches[0], 'Global') ? 0 : 10),
          item_group: combo.item_group || 'Combos Offer'
        });
      }
    });

    // Final Deduplication and Aggressive Suffix Sanitization
    const uniqueItemMap = new Map();
    allCandidates.forEach(candidate => {
      const rawName = (candidate.item_name || candidate.name || candidate.description || "").toString();

      // SANITIZATION: Aggressively strip any branch-related suffixes (like branch codes or names)
      let cleanName = rawName.trim();

      const branchSuffixes = new Set();
      if (candidate.branch_name) branchSuffixes.add(candidate.branch_name.toString().trim().toLowerCase());
      if (candidate.display_branch) branchSuffixes.add(candidate.display_branch.toString().trim().toLowerCase());

      (availableBranches || []).forEach(b => {
        if (b) branchSuffixes.add(b.toString().trim().toLowerCase());
      });

      branchSuffixes.add('all');
      branchSuffixes.add('any');
      branchSuffixes.add('global');
      branchSuffixes.add('all branches');

      const sortedSuffixes = Array.from(branchSuffixes).sort((a, b) => b.length - a.length);

      sortedSuffixes.forEach(suffix => {
        if (suffix && suffix.length > 0) {
          const lowerName = cleanName.toLowerCase();
          if (lowerName.endsWith(suffix)) {
            cleanName = cleanName.substring(0, cleanName.length - suffix.length).trim();
          }
          const separators = ['-', '_', ' '];
          separators.forEach(sep => {
            if (cleanName.toLowerCase().endsWith(sep)) {
              cleanName = cleanName.substring(0, cleanName.length - sep.length).trim();
            }
          });
        }
      });

      candidate.item_name = cleanName;

      const normalizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const typeKey = candidate.type || 'item';

      const idPart = candidate.item_code || normalizedName;
      const key = `${idPart}-${typeKey}-${normalize(candidate.company_name)}-${normalize(candidate.branch_name)}`;

      if (!uniqueItemMap.has(key)) {
        uniqueItemMap.set(key, candidate);
      } else {
        const existing = uniqueItemMap.get(key);
        const currentScore = candidate.specificity;
        const exitingScore = existing.specificity;

        if (currentScore > exitingScore) {
          uniqueItemMap.set(key, candidate);
        }
      }
    });

    // Template Shadowing Pass: Deduplicate items to show the most specific version available
    const shadowedMap = new Map();
    uniqueItemMap.forEach((item, key) => {
      const idPart = item.item_code || item.item_name.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const typeKey = item.type || 'item';

      const groupKey = `${idPart}-${typeKey}`;

      if (!shadowedMap.has(groupKey)) {
        shadowedMap.set(groupKey, [item]);
      } else {
        shadowedMap.get(groupKey).push(item);
      }
    });

    const finalResults = [];
    shadowedMap.forEach((items, groupKey) => {
      // 1. Shadow Global Companies (POS 8)
      let specificItems = items.filter(it =>
        !['all', 'global', 'pos 8', 'pos8'].includes(normalize(it.company_name))
      );
      if (specificItems.length === 0) specificItems = items;

      // 2. Shadow Global Branches
      const isAllBranches = selectedBranchFilter === 'All Branches' || selectedBranchFilter === 'All';
      let branchSpecificItems = specificItems.filter(it =>
        !['all', 'global', 'all branches', 'any'].includes(normalize(it.branch_name))
      );

      let itemsToProcess = specificItems;
      if (!isAllBranches && branchSpecificItems.length > 0) {
        // If we are in a specific branch view, hide the global branch item if a specific one exists
        itemsToProcess = branchSpecificItems;
      }

      if (isAllBranches && itemsToProcess.length > 0) {
        // Push only one representative to prevent duplicate rows in Company view
        const representative = { ...itemsToProcess[0] };

        // Aggregate branch and company names/prices so the user can see where it exists and edit it correctly
        const allBranches = new Set();
        const branchPrices = {};
        const cloneBranches = new Set();
        
        const allCompanies = new Set();
        const companyPrices = {};
        const cloneCompanies = new Set();

        // Pass 1: Extract direct clones which are the ultimate source of truth for branch/company prices
        itemsToProcess.forEach(it => {
          const bName = it.branch_name || it.branch || '';
          if (bName && normalize(bName) !== 'global' && normalize(bName) !== 'allbranches' && normalize(bName) !== 'all') {
            allBranches.add(bName);
            cloneBranches.add(bName);
            branchPrices[bName] = it.price_list_rate || 0;
          }

          const cName = it.company_name || it.company || '';
          if (cName && normalize(cName) !== 'global' && normalize(cName) !== 'all' && normalize(cName) !== 'pos8' && normalize(cName) !== 'pos 8') {
            allCompanies.add(cName);
            cloneCompanies.add(cName);
            companyPrices[cName] = it.price_list_rate || 0;
          }
        });

        // Pass 2: Extract embedded arrays, yielding to direct clones
        itemsToProcess.forEach(it => {
          if (it.branch_names && Array.isArray(it.branch_names)) {
              it.branch_names.forEach(bn => {
                  if (bn && normalize(bn) !== 'global' && normalize(bn) !== 'allbranches' && normalize(bn) !== 'all') {
                      allBranches.add(bn);
                      if (!cloneBranches.has(bn)) {
                          if (it.branch_prices && it.branch_prices[bn] !== undefined) {
                              branchPrices[bn] = it.branch_prices[bn];
                          } else if (branchPrices[bn] === undefined) {
                              branchPrices[bn] = it.price_list_rate || 0;
                          }
                      }
                  }
              });
          }
          if (it.branch_prices && typeof it.branch_prices === 'object') {
              Object.keys(it.branch_prices).forEach(bn => {
                  if (it.branch_prices[bn] !== undefined && it.branch_prices[bn] !== null && it.branch_prices[bn] !== '') {
                      if (bn && normalize(bn) !== 'global' && normalize(bn) !== 'allbranches' && normalize(bn) !== 'all') {
                          allBranches.add(bn);
                          if (!cloneBranches.has(bn)) {
                              branchPrices[bn] = it.branch_prices[bn];
                          }
                      }
                  }
              });
          }

          if (it.company_names && Array.isArray(it.company_names)) {
              it.company_names.forEach(cn => {
                  if (cn && normalize(cn) !== 'global' && normalize(cn) !== 'all' && normalize(cn) !== 'pos8' && normalize(cn) !== 'pos 8') {
                      allCompanies.add(cn);
                      if (!cloneCompanies.has(cn)) {
                          if (it.company_prices && it.company_prices[cn] !== undefined) {
                              companyPrices[cn] = it.company_prices[cn];
                          } else if (companyPrices[cn] === undefined) {
                              companyPrices[cn] = it.price_list_rate || 0;
                          }
                      }
                  }
              });
          }
        });

        if (allBranches.size > 0) {
          representative.display_branch = Array.from(allBranches).join(', ');
          representative.branch_names = Array.from(allBranches);
          representative.branch_prices = branchPrices;
        } else if (itemsToProcess.some(it => normalize(it.branch_name) === 'global' || normalize(it.branch_name) === 'allbranches')) {
          representative.display_branch = 'Global';
        }

        if (allCompanies.size > 0) {
          representative.company_names = Array.from(allCompanies);
          representative.company_prices = companyPrices;
        }

        finalResults.push(representative);
      } else {
        finalResults.push(...itemsToProcess);
      }
    });

    let isolatedResults = [...finalResults];
    if (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All') {
      isolatedResults = isolatedResults.filter(it =>
        matchTenancy(it.company_name, selectedCompanyFilter)
      );
    }
    
    // Strict isolation based on UI Branch selection
    if (selectedBranchFilter && selectedBranchFilter !== 'All Branches' && selectedBranchFilter !== 'All') {
      isolatedResults = isolatedResults.filter(it =>
        matchTenancy(it.branch_name, selectedBranchFilter, true) ||
        (it.branch_names && it.branch_names.some(bn => matchTenancy(bn, selectedBranchFilter, true))) ||
        // NEW: Allow the item to show up if it has a price override assigned for this specific branch
        (it.branch_prices && Object.keys(it.branch_prices).some(bn => matchTenancy(bn, selectedBranchFilter, true) && it.branch_prices[bn] !== undefined && it.branch_prices[bn] !== null && it.branch_prices[bn] !== ''))
      );
    }

    return isolatedResults;
  }, [itemList, comboList, selectedCompanyFilter, selectedBranchFilter, localStorage.getItem('active_company'), companyOptions, companyBranchesMap]);

  // Consolidated Initialization: Roles, Permissions, and Company Options
  useEffect(() => {
    const initializePage = async () => {
      if (configLoading) return;

      try {
        setPermsLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const userObj = JSON.parse(userStr);
        const roleRaw = userObj.role || userObj.UserType || '';
        const roleNorm = roleRaw.toLowerCase().replace(/[\s_]/g, '');
        const isCompanyAdminLocal = roleNorm === 'companyadmin';
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);
        const isAdminRole = checkIsAdmin(userObj);

        setIsCompanyAdmin(isCompanyAdminLocal || isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);

        const branch = (!isGroupAdminRole && !isCompanyAdminLocal) ? (userObj.branch_name || userObj.branch || "") : "";
        setUserBranch(branch);
        setUserCompany(userObj.company_name || userObj.company || "");

        if (branch && branch !== "All Branches") {
          setSelectedBranchFilter(branch);
        }

        // 2. Fetch Company Options for Group Admin
        if (isGroupAdminRole) {
          if (userObj.companies && userObj.companies.length > 0) {
            const safeCompanies = userObj.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
            setCompanyOptions(safeCompanies);
          } else {
            try {
              const headers = {};
              if (userObj.company_name || userObj.company) headers['X-Company-Name'] = userObj.company_name || userObj.company;
              const compResp = await axios.get(`${baseUrl}/api/company-details`, { headers: getHeaders() });
              const names = (compResp.data.companyDetails || []).map(d => d.restaurantName).filter(n => n);
              setCompanyOptions([...new Set(names)]);
            } catch (err) {
              console.error("Error fetching company options:", err);
            }
          }
        }

        // 3. Fetch Detailed Permissions
        if (roleRaw) {
          const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${encodeURIComponent(roleRaw)}` : `/api/role-permissions?role=${encodeURIComponent(roleRaw)}`;
          const response = await axios.get(url, { headers: getHeaders() });
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'item_list');

          // Robust Admin Bypass logic
          const isActuallyAdmin = checkIsAdmin(userObj) || (userObj?.email && String(userObj.email).includes('@temp.com'));

          if (isActuallyAdmin) {
            setCanRead(true);
            setCanWrite(true);
            setCanDelete(true);
            setCanCreate(true);
          } else if (pagePerm) {
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
            setCanDelete(pagePerm.canDelete === true);
            setCanCreate(pagePerm.canCreate === true);
          }
        }
      } catch (error) {
        console.error("Initialization Error:", error);
      } finally {
        setPermsLoading(false);
      }
    };

    initializePage();
  }, [baseUrl, configLoading]);

  const getCurrencySymbol = (currCode) => {
    // Resolve using the page's active filter state first, then localStorage fallback
    const activeComp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : localStorage.getItem('active_company');
    const activeBr = (selectedBranchFilter && selectedBranchFilter !== 'All Branches' && selectedBranchFilter !== 'All') ? selectedBranchFilter : localStorage.getItem('active_branch');
    const resolvedCode = currCode || resolveCurrencyCode(null, activeComp, activeBr);
    return <CurrencySymbol currencyCode={resolvedCode} size={14} />;
  };

  const formatPrice = (price) => {
    const symbol = getCurrencySymbol();
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}{(Number(price) || 0).toFixed(2)}</span>;
  };


  const handleViewItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/items`, { headers: getHeaders() });
      const items = response.data.map(item => ({
        ...item,
        company_name: item.company_name || item.company || "Unknown"
      }));
      setItemList(items);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setWarningMessage("Error while fetching items");
      setLoading(false);
    }
  };
  // Fetch all combo offers
  const handleViewCombos = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/combo-offer`, { headers: getHeaders() });
      setComboList(response.data);
    } catch (error) {
      console.error("Error:", error);
      setWarningMessage("Error while fetching combo offers");
    }
  };

  // Fetch branches for filter
  const fetchBranches = async (companyFilter = null) => {
    try {
      let url = `${baseUrl}/api/branches`;
      if (companyFilter && companyFilter !== 'All Companies' && companyFilter !== 'All') {
        url += `?company_name=${encodeURIComponent(companyFilter)}`;
      }
      const response = await axios.get(url, { headers: getHeaders() });
      const branchData = response.data.branches || response.data || [];
      if (Array.isArray(branchData)) {
        setAvailableBranches(branchData.map(b => (typeof b === 'string' ? b : (b.branch_name || b.name || "")).trim()).filter(b => b));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };
  // Fetch sales for selected item
  const fetchItemSales = async (itemId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/items/${itemId}/sales`, { headers: getHeaders() });
      setItemSales(response.data);
    } catch (error) {
      console.error("Error fetching item sales:", error);
      setWarningMessage("Error while fetching sales for this item");
    }
  };
  // Handle item or combo click to view details
  const handleItemClick = async (item, isCombo = false) => {
    const normalizedIngredients = normalizeIngredients(item.ingredients);
    setSelectedItem({ ...item, isCombo });
    setNutritionData({
      ingredients: normalizedIngredients,
      nutrition: item.nutrition || {},
    });
    if (!isCombo) {
      await fetchItemSales(item._id); // Fetch sales only for non-combo items
    }
    setShowModal(true);
  };
  // Handle sale click to view details
  const handleSaleClick = (sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };
  // Delete sale
  const handleDeleteSale = async () => {
    if (selectedSale) {
      try {
        const response = await axios.delete(`${baseUrl}/api/sales/${selectedSale.invoice_no}`);
        if (response.status === 200) {
          setItemSales(itemSales.filter(sale => sale.invoice_no !== selectedSale.invoice_no));
          setShowSaleModal(false);
          setSelectedSale(null);
          setWarningMessage("Sale deleted successfully!");
          // Refresh item sales
          if (selectedItem) {
            await fetchItemSales(selectedItem._id);
          }
        } else {
          setWarningMessage(`Failed to delete sale: ${response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting sale:', error);
        setWarningMessage(error.response?.data?.error || 'Error while deleting sale');
      }
    }
  };
  // Close the item details modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setItemSales([]);
  };
  // Close the sale details modal
  const handleCloseSaleModal = () => {
    setShowSaleModal(false);
    setSelectedSale(null);
  };
  // Close the offer modal
  const handleCloseOfferModal = () => {
    setShowOfferModal(false);
    setOfferItem(null);
    setSearchTerm("");
    setOfferPrice("");
    setOfferStartTime("");
    setOfferEndTime("");
  };
  // Close the nutrition modal
  const handleCloseNutritionModal = () => {
    setShowNutritionModal(false);
  };

  // Go back to the previous page
  const goBack = () => {
    navigate('/admin');
  };
  // Delete item or combo - Modified to hide if has sales
  const handleDeleteItem = async () => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete items.");
      setShowPermModal(true);
      return;
    }
    if (selectedItem) {
      const activeContext = localStorage.getItem('active_company');
      const activeBranch = localStorage.getItem('active_branch');
      const isGlobalView = !activeContext || activeContext === 'All';
      const isGlobalBranchView = !activeBranch || activeBranch === 'All Branches';

      const itemCompanies = selectedItem.company_names || (selectedItem.company_name ? [selectedItem.company_name] : []);
      const itemBranches = selectedItem.branch_names || (selectedItem.branch_name ? [selectedItem.branch_name] : []);

      const isSharedCompany = itemCompanies.length > 1;
      const isSharedBranch = itemBranches.length > 1 || itemCompanies.length > 1;

      // 1. Safety Check for Global View
      if (isGlobalView && isGlobalBranchView && itemCompanies.length > 0) {
        setWarningMessage(`Delete Protected: Item "${selectedItem.item_name || selectedItem.name1}" is assigned to specific companies (${itemCompanies.join(', ')}). To prevent accidental loss of data for other companies, global deletion is blocked from the 'All' view. Please switch to a specific company view to remove its association.`);
        return;
      }

      // 2. Context-Aware Confirmation
      let confirmMsg = `Are you sure you want to delete "${selectedItem.item_name || selectedItem.name1}"?`;

      const specificBranches = itemBranches.filter(b => !['global', 'all', 'all branches'].includes(b.toLowerCase().trim()));
      const hasGlobal = itemBranches.some(b => ['global', 'all', 'all branches'].includes(b.toLowerCase().trim()));

      if (!isGlobalView && isGlobalBranchView && specificBranches.length > 0 && !hasGlobal) {
        confirmMsg = `WARNING: "${selectedItem.item_name || selectedItem.name1}" is specifically assigned to branches (${specificBranches.join(', ')}). Deleting it from 'All Branches' will completely remove it from this company AND those branches. Are you sure you want to proceed?`;
      } else if (!isGlobalBranchView && isSharedBranch) {
        confirmMsg = `This item is shared with other branches/companies. Deleting it here will ONLY remove it from branch "${activeBranch}". The item will remain available elsewhere. Are you sure?`;
      } else if (!isGlobalView && isSharedCompany) {
        confirmMsg = `This item is shared with other companies. Deleting it here will ONLY remove it from company "${activeContext}" and its branches. The item will remain available for other companies. Are you sure?`;
      }

      setDeleteConfirm({ show: true, item: selectedItem, isList: false, message: confirmMsg }); return;
      try {
        const endpoint = selectedItem.isCombo
          ? `${baseUrl}/api/combo-offer/${selectedItem._id}`
          : `${baseUrl}/api/items/${selectedItem._id}`;

        const deleteHeaders = getHeaders(); // Uses active_branch and active_company from localStorage
        const response = await axios.delete(endpoint, { headers: deleteHeaders });
        if (response.status === 200) {
          if (selectedItem.isCombo) {
            setComboList(comboList.filter(combo => combo._id !== selectedItem._id));
          } else {
            // Refresh items to reflect hide/delete
            await handleViewItems();
          }
          handleCloseModal();
          setWarningMessage(response.data.message || (selectedItem.isCombo ? "Combo offer deleted successfully!" : "Item handled successfully!"));
        } else {
          const errorData = response.data;
          setWarningMessage(`Failed to handle: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setWarningMessage(error.response?.data?.error || 'Error while handling item');
      }
    }
  };
  // Edit item or combo
  
  const onEditFromList = (item) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to edit items.");
      setShowPermModal(true);
      return;
    }
    if (item.type === 'combo_offer') {
      navigate("/combo-offer", { state: { combo: item } });
    } else {
      navigate("/create-item", { state: { item: item } });
    }
  };

  const onDeleteFromList = async (item) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete items.");
      setShowPermModal(true);
      return;
    }
    if (item.type !== 'combo_offer' && item.sales_count > 0) {
      setWarningMessage(`Cannot delete ${item.item_name || item.name1}. It is associated with ${item.sales_count} sales invoices.`);
      return;
    }
    setDeleteConfirm({ show: true, item: item, isList: true, message: `Are you sure you want to delete ${item.item_name || item.name1 || 'this item'}?` });
  };

  const handleEditItem = () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to edit items.");
      setShowPermModal(true);
      return;
    }

    if (selectedItem.isCombo) {
      navigate("/combo-offer", {
        state: { combo: selectedItem },
      });
    } else if (selectedItem.type === 'addon' || selectedItem.type === 'item_combo') {
      // Find parent item to edit correctly
      const parentItem = itemList.find(i => i._id === selectedItem.parentId);
      if (parentItem) {
        const typeKey = selectedItem.type === 'addon' ? 'addons' : 'combos';
        // Match by name within the parent's array
        const listToSearch = parentItem[typeKey] || [];
        const subIndex = listToSearch.findIndex(sub => (sub.name1 || sub.item_name) === (selectedItem.item_name || selectedItem.name1));

        navigate("/create-item", {
          state: {
            item: { ...parentItem, ingredients: normalizeIngredients(parentItem.ingredients) },
            editSubItem: { type: typeKey, index: subIndex }
          },
        });
      } else {
        // Fallback if parent not found
        navigate("/create-item", {
          state: { item: { ...selectedItem, ingredients: normalizeIngredients(selectedItem.ingredients) } },
        });
      }
    } else {
      navigate("/create-item", {
        state: { item: { ...selectedItem, ingredients: normalizeIngredients(selectedItem.ingredients) } },
      });
    }
  };
  // Handle offer button click
  const handleOfferClick = () => {
    setShowOfferModal(true);
  };
  // Handle selecting an item for offer
  const handleOfferItemSelect = (item) => {
    setOfferItem(item);
    setOfferPrice("");
    setOfferStartTime("");
    setOfferEndTime("");
  };
  // Submit offer
  const handleOfferSubmit = async () => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to add offers.");
      setShowPermModal(true);
      return;
    }
    if (!offerItem || !offerPrice || !offerStartTime || !offerEndTime) {
      setWarningMessage("Please fill all offer details");
      return;
    }
    try {
      const startTime = new Date(offerStartTime);
      const endTime = new Date(offerEndTime);
      if (startTime >= endTime) {
        setWarningMessage("Offer start time must be before end time");
        return;
      }
      const offerData = {
        offer_price: parseFloat(offerPrice),
        offer_start_time: startTime.toISOString(),
        offer_end_time: endTime.toISOString(),
      };
      const response = await axios.put(`${baseUrl}/api/items/${offerItem._id}/offer`, offerData, { headers: getHeaders() });
      if (response.status === 200) {
        await handleViewItems();
        handleCloseOfferModal();
        setWarningMessage("Offer added successfully!");
      } else {
        const errorData = response.data;
        setWarningMessage(`Failed to add offer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setWarningMessage('Error while adding offer');
    }
  };
  // Handle Ingredients & Nutrition button click
  const handleNutritionClick = () => {
    setShowNutritionModal(true);
  };
  // Handle Add New Item button click
  const handleAddNewItem = () => {
    if (!canCreate) {
      setPermModalMsg("You do not have permission to add new items.");
      setShowPermModal(true);
      return;
    }
    navigate('/create-item');
  };

  const handleGalleryImportClick = async () => {
    if (!canCreate) {
      setPermModalMsg("You do not have permission to add new items.");
      setShowPermModal(true);
      return;
    }
    setShowGalleryModal(true);
    setGalleryLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/item-gallery`, { headers: getHeaders() });
      setGalleryItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      setWarningMessage("Error fetching items from gallery.");
    } finally {
      setGalleryLoading(false);
    }
  };

  const importGalleryItem = (item) => {
    const itemToImport = {
      ...item,
      _id: undefined,
      company_names: [],
      branch_names: [],
      company_name: undefined,
      branch_name: undefined,
      created_at: undefined,
      updated_at: undefined,
      addons: (item.addons || []).map(a => ({ ...a, _selected: true })),
      combos: (item.combos || []).map(c => ({ ...c, _selected: true }))
    };
    setImportData(itemToImport);
    setShowCustomizeModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImportData({...importData, image: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const executeImport = async () => {
    try {
      setImportSubmitting(true);
      const postData = { ...importData };

      // Ensure item groups are created for current company/branch
      try {
          const actCompName = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : (localStorage.getItem('active_company') || '');
          const actBranchName = (selectedBranchFilter && selectedBranchFilter !== 'All Branches' && selectedBranchFilter !== 'All') ? selectedBranchFilter : (localStorage.getItem('active_branch') || '');
          
          const igRes = await axios.get(`${baseUrl}/api/item-groups`, { headers: getHeaders(), timeout: 5000 });
          const existingGroups = new Set((igRes.data || []).map(g => (g.group_name || "").toLowerCase().trim()));
          
          const ensureGroup = async (gName) => {
              if (!gName) return;
              const norm = String(gName).toLowerCase().trim();
              if (existingGroups.has(norm)) return;
              try {
                  await axios.post(`${baseUrl}/api/item-groups`, {
                      group_name: gName,
                      company_name: actCompName === 'All Companies' || actCompName === 'All' ? '' : actCompName,
                      branch_name: actBranchName === 'All Branches' || actBranchName === 'All' ? '' : actBranchName
                  }, { headers: getHeaders() });
                  existingGroups.add(norm);
              } catch(e) { console.error("Auto-create group failed", e); }
          };
          
          await ensureGroup(postData.item_group);
          if (postData.addons) {
              for (const a of postData.addons) { if (a._selected !== false) await ensureGroup(a.item_group); }
          }
          if (postData.combos) {
              for (const c of postData.combos) { if (c._selected !== false) await ensureGroup(c.item_group); }
          }
      } catch (err) { console.error("Error auto-creating item groups:", err); }

      // Use the page's current filter values, falling back to localStorage
      const activeCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') 
        ? selectedCompanyFilter 
        : localStorage.getItem('active_company');
      const activeBranch = (selectedBranchFilter && selectedBranchFilter !== 'All Branches' && selectedBranchFilter !== 'All')
        ? selectedBranchFilter
        : localStorage.getItem('active_branch');
      
      if (!activeCompany || activeCompany === 'All Companies' || activeCompany === 'All') {
          setWarningMessage("Please select a specific company to import into.");
          setImportSubmitting(false);
          return;
      }

      const isSpecificBranch = activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All';
      
      postData.company_name = activeCompany;
      postData.company_names = [activeCompany];
      postData.company = activeCompany;
      postData.companies = [activeCompany];
      postData.company_prices = {};
      
      if (isSpecificBranch) {
          // Branch-level import: item scoped strictly to this branch
          postData.branch_name = activeBranch;
          postData.branch_names = [activeBranch];
          postData.branch = activeBranch;
          postData.branches = [activeBranch];
          postData.branch_prices = { [activeBranch]: Number(postData.price_list_rate) || 0 };
      } else {
          // Company-level import: no specific branch, show globally within company
          postData.branch_name = "";
          postData.branch_names = [];
          postData.branch = "";
          postData.branches = [];
          postData.branch_prices = {};
          postData.company_prices = { [activeCompany]: Number(postData.price_list_rate) || 0 };
      }

      // Filter out unchecked addons/combos
      postData.addons = (importData.addons || []).filter(a => a._selected !== false).map(({ _selected, ...rest }) => rest);
      postData.combos = (importData.combos || []).filter(c => c._selected !== false).map(({ _selected, ...rest }) => rest);
      postData.custom_addon_applicable = postData.addons.length > 0;
      postData.custom_combo_applicable = postData.combos.length > 0;
      
      // Remove the _id to ensure a fresh create
      delete postData._id;

      const response = await axios.post(`${baseUrl}/api/items`, postData, { headers: getHeaders() });
      if (response.status === 201 || response.status === 200) {
        setWarningMessage("Item imported successfully!");
        setShowCustomizeModal(false);
        setShowGalleryModal(false);
        handleViewItems();
      } else {
        setWarningMessage("Failed to import item.");
      }
    } catch (error) {
      console.error("Error importing item:", error);
      setWarningMessage(error.response?.data?.error || "Error importing item");
    } finally {
      setImportSubmitting(false);
    }
  };
  // REMOVED: handleHiddenItemsClick - Button removed as per request
  // Normalize ingredients to always be an array
  const normalizeIngredients = (ingredients) => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string' && ingredients.trim() !== '') {
      return [{ name: ingredients }];
    }
    if (typeof ingredients === 'object' && ingredients !== null && Object.keys(ingredients).length > 0) {
      return [ingredients];
    }
    return [];
  };
  // Initial fetch - CONSOLIDATED for stability
  useEffect(() => {
    if (baseUrl !== null) {
      handleViewItems();
      handleViewCombos();
      fetchDoctype();
      if (isCompanyAdmin) {
        fetchBranches();
      }
    }
  }, [baseUrl, isCompanyAdmin]); // Only on base load or admin status change

  // Listen for company context changes from Sidebar/Navbar
  useEffect(() => {
    const handleContextChange = () => {
      console.log("Context change detected, re-fetching items...");
      handleViewItems();
      handleViewCombos();
    };

    window.addEventListener('companyChange', handleContextChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'active_company' || e.key === 'active_branch') {
        handleContextChange();
      }
    });

    return () => {
      window.removeEventListener('companyChange', handleContextChange);
      window.removeEventListener('storage', handleContextChange);
    };
  }, [handleViewItems, handleViewCombos]);

  // Re-fetch on navigation (coming back from Edit/Create)
  useEffect(() => {
    if (baseUrl !== null) {
      handleViewItems();
      handleViewCombos();
    }
  }, [baseUrl, location.key]); // Depend on location.key for robust refresh after edit/create
  // Inline styles
  const sidebarStyle = {
    position: "fixed",
    top: "70px",
    left: "0",
    width: "240px",
    height: "calc(100vh - 70px)",
    backgroundColor: "#f8f9fa",
    borderRight: "1px solid #e2e8f0",
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "2px 0 10px rgba(0,0,0,0.03)",
  };
  const categoryBoxStyle = {
    padding: "12px 18px",
    marginBottom: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    fontWeight: "600",
    color: "#4a5568",
    fontSize: "0.92rem",
  };
  const selectedCategoryBoxStyle = {
    ...categoryBoxStyle,
    backgroundColor: "#28a745",
    color: "#ffffff",
    borderColor: "#28a745",
    boxShadow: "0 4px 12px rgba(40, 167, 69, 0.25)",
  };
  // UPDATED: Regular item card style
  const cardStyle = {
    border: "1px solid #eee",
    backgroundColor: "#fdfdfd",
    padding: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  };
  // UPDATED: Regular item card hover style
  const cardHoverStyle = {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 10px rgba(0, 0, 0, 0.15)",
    borderColor: "#28a745"
  };
  const imgStyle = {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "8px",
  };
  const contentStyle = {
    marginLeft: "250px", // Adjusted to align with sidebar width
    padding: "20px",
  };
  const priceStyle = {
    fontSize: "1rem",
    marginTop: "5px",
  };
  const strikethroughStyle = {
    textDecoration: "line-through",
    color: "#888",
    marginRight: "10px",
  };
  const offerPriceStyle = {
    color: "#ff4500",
    fontWeight: "bold",
  };
  const warningBoxOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  };
  const warningBoxStyle = {
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    color: "#155724",
    padding: "30px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
  };
  const warningTextStyle = {
    margin: 0,
    fontSize: "18px",
    fontWeight: "500",
  };
  const closeWarningButtonStyle = {
    padding: "8px 30px",
    fontSize: "16px",
    fontWeight: "bold",
  };
  // UPDATED: multipleImagesStyle to center content
  const multipleImagesStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
    justifyContent: "center", // Center the images
  };
  const nutritionModalStyle = {
    padding: "20px",
  };
  const nutritionItemStyle = {
    marginBottom: "10px",
    fontSize: "1rem",
  };
  // Style for the fixed back button
  const backButtonStyle = {
    position: "fixed",
    top: "20px",
    left: "20px",
    backgroundColor: "transparent",
    border: "2px solid #3498db",
    color: "#3498db",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    borderRadius: "50px",
    fontSize: "16px",
    fontWeight: "600",
    boxShadow: "0 2px 10px rgba(52, 152, 219, 0.2)",
    zIndex: 1001,
    transition: "all 0.3s ease"
  };
  // UPDATED: Poster style for combo offers
  const posterStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    color: "#ffffff",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    height: "auto",
  };
  // UPDATED: Logo style for new combo card
  const logoStyle = {
    position: "absolute",
    top: "8px",
    left: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)"
  };
  // UPDATED: Offer name for new combo card
  const offerNameStyle = {
    fontSize: "22px",
    marginBottom: "8px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
    fontFamily: 'ui-sans-serif',
    color: "#ffffff",
    fontWeight: "600",
  };
  // UPDATED: Offer period for new combo card
  const offerPeriodStyle = {
    fontSize: "13px",
    color: "#ffffff",
    marginBottom: "8px",
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  };
  // NEW: Style for uploaded multiple images - centered, larger thumbs
  const uploadedImagesStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
    justifyContent: "center",
  };
  const uploadedImageThumbStyle = {
    width: "60px", // Slightly larger for neat display
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  // UPDATED: Items list for new combo card - full width, centered
  const itemsListStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "8px",
    textAlign: "left",
  };
  // NEW: Item list item with image next to name - flex row
  const itemsListItemStyle = {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: "6px",
    listStyleType: "none",
    paddingLeft: "0",
  };
  const itemImageStyle = {
    width: "30px",
    height: "30px",
    objectFit: "cover",
    borderRadius: "4px",
    marginRight: "8px",
    border: "1px solid rgba(255, 255, 255, 0.5)",
  };
  // UPDATED: Total price for new combo card
  const totalPriceStyle = {
    fontSize: "18px",
    margin: "12px 0",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: "8px",
    borderRadius: "8px",
    color: "#fdd835", // Bright yellow for price
    fontWeight: "bold",
    textAlign: "center",
  };
  // UPDATED: Limited offer for new combo card
  const limitedOfferStyle = {
    fontSize: "13px",
    color: "#fdd835", // Bright yellow
    marginTop: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  };
  // UPDATED: View button for new combo card
  const viewButtonStyle = {
    marginTop: "8px",
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    color: "#764ba2", // Match gradient
    fontWeight: "bold",
    padding: "6px 12px",
    borderRadius: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "block",
    margin: "8px auto 0",
    transition: "all 0.3s ease",
  };

  const formatNutritionLabel = (key) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  const renderIngredients = (ingredients) => {
    if (!ingredients) return null;
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      return (
        <ul>
          {ingredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.name || 'Unnamed ingredient'}
              {ingredient.quantity && ingredient.unit ? ` (${ingredient.quantity} ${ingredient.unit})` : ''}
              {ingredient.optional ? ' (Optional)' : ''}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof ingredients === 'string' && ingredients.trim() !== '') return <p>{ingredients}</p>;
    if (typeof ingredients === 'object' && ingredients !== null && Object.keys(ingredients).length > 0) {
      return (
        <ul>
          <li>
            {ingredients.name || 'Unnamed ingredient'}
            {ingredients.quantity && ingredients.unit ? ` (${ingredients.quantity} ${ingredients.unit})` : ''}
            {ingredients.optional ? ' (Optional)' : ''}
          </li>
        </ul>
      );
    }
    return null;
  };

  const hasValidData = () => {
    const hasIngredients =
      (Array.isArray(nutritionData.ingredients) && nutritionData.ingredients.length > 0) ||
      (typeof nutritionData.ingredients === 'string' && nutritionData.ingredients.trim() !== '') ||
      (typeof nutritionData.ingredients === 'object' && nutritionData.ingredients !== null && Object.keys(nutritionData.ingredients).length > 0);
    const hasNutrition =
      nutritionData.nutrition &&
      Object.keys(nutritionData.nutrition).length > 0 &&
      Object.entries(nutritionData.nutrition).some(([_, value]) => value !== '' && value !== null && value !== undefined);
    return hasIngredients || hasNutrition;
  };

  const hasActiveOffer = (item) => {
    if (!item.offer_price || !item.offer_start_time || !item.offer_end_time) return false;
    const now = new Date();
    return new Date(item.offer_start_time) <= now && now <= new Date(item.offer_end_time);
  };

  const handleCategoryClick = (category) => {
    const cleanCategory = category.replace(/\s*\(\d+\)\s*$/, '');
    setSelectedCategory(cleanCategory);
  };

  const categoriesWithCounts = React.useMemo(() => {
    const counts = {};
    const topLevelTypes = ['item', 'combo', 'product', 'service'];
    const subItemTypes = ['addon', 'item_combo'];

    if (activeTab === 'combos') {
      const comboItems = displayItems.filter(it => it.type === 'combo_offer' || it.item_group === 'Combos Offer');
      comboItems.forEach(item => {
        const group = item.item_group || "Combos Offer";
        counts[group] = (counts[group] || 0) + 1;
      });
      const uniqueGroups = Object.keys(counts).sort();
      const result = [`All Items (${comboItems.length})`];
      uniqueGroups.forEach(group => {
        result.push(`${group} (${counts[group]})`);
      });
      return result;
    } else {
      const tabItems = displayItems.filter(it => it.type !== 'combo_offer' && it.item_group !== 'Combos Offer');

      const itemsByGroup = {};
      tabItems.forEach(item => {
        const group = item.item_group || "Uncategorized";
        if (!itemsByGroup[group]) itemsByGroup[group] = [];
        itemsByGroup[group].push(item);
      });

      const uniqueGroups = Object.keys(itemsByGroup).sort();
      const topLevelItems = tabItems.filter(item => topLevelTypes.includes(item.type));
      const result = [`All Items (${topLevelItems.length})`];

      uniqueGroups.forEach(group => {
        const itemsInThisGroup = itemsByGroup[group];
        const subItems = itemsInThisGroup.filter(it => subItemTypes.includes(it.type));
        const topItems = itemsInThisGroup.filter(it => topLevelTypes.includes(it.type));

        const count = subItems.length > 0 ? subItems.length : topItems.length;
        if (count > 0) {
          result.push(`${group} (${count})`);
        }
      });
      return result;
    }
  }, [displayItems, activeTab]);

  const filteredItems = React.useMemo(() => {
    let result = displayItems;
    const topLevelTypes = ['item', 'combo', 'product', 'service'];
    const subItemTypes = ['addon', 'item_combo'];

    // Filter by Tab
    if (activeTab === 'combos') {
      result = result.filter(item => item.type === 'combo_offer' || item.item_group === 'Combos Offer');
      if (selectedCategory !== "All Items") {
        result = result.filter(item => (item.item_group || "Combos Offer") === selectedCategory);
      }
    } else {
      // Menu Items tab
      result = result.filter(item => item.type !== 'combo_offer' && item.item_group !== 'Combos Offer');

      if (selectedCategory === "All Items") {
        // "All Items" → ONLY top-level items (no addons/combos)
        result = result.filter(item => topLevelTypes.includes(item.type));
      } else {
        // Specific category selected
        const catLower = (selectedCategory || "").toLowerCase().trim();

        // Check if this category has any sub-items (addons/combos)
        const subItemsInCategory = result.filter(item =>
          subItemTypes.includes(item.type) &&
          (item.item_group || "Uncategorized").toLowerCase().trim() === catLower
        );

        if (subItemsInCategory.length > 0) {
          // Category contains sub-items → show ONLY sub-items, not top-level items
          result = subItemsInCategory;
        } else {
          // Category has no sub-items → show only top-level items matching this category
          result = result.filter(item =>
            topLevelTypes.includes(item.type) &&
            (item.item_group || "Uncategorized").toLowerCase().trim() === catLower
          );
        }
      }
    }

    if (globalSearchText) {
      const search = globalSearchText.toLowerCase().trim();
      result = result.filter(item =>
        (item.item_name || "").toLowerCase().includes(search) ||
        (item.item_code || "").toLowerCase().includes(search) ||
        (item.item_group || "").toLowerCase().includes(search) ||
        (item.description || "").toLowerCase().includes(search)
      );
    }
    return result;
  }, [displayItems, selectedCategory, globalSearchText, activeTab]);

  const searchedItems = React.useMemo(() => {
    if (!searchTerm) return [];
    const search = searchTerm.toLowerCase().trim();
    return displayItems.filter(item =>
      (item.item_name || "").toLowerCase().includes(search) ||
      (item.item_code || "").toLowerCase().includes(search)
    );
  }, [displayItems, searchTerm]);

  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', color: '#3498db', fontSize: '1.2rem', fontWeight: '600' }}>
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
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>You do not have permission to view the Item List.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none' }}>Back to Admin</button>
        </div>
      </div>
    );
  }


  const renderVariantsUI = (variantsData, onUpdateVariant, onUpdateCustomVariant) => {
    if (!variantsData) return null;
    const hasSize = variantsData.size && (variantsData.size.enabled || variantsData.size.small_price > 0 || variantsData.size.medium_price > 0 || variantsData.size.large_price > 0);
    const hasCold = variantsData.cold && (variantsData.cold.enabled || variantsData.cold.ice_price > 0);
    const hasSpicy = variantsData.spicy && (variantsData.spicy.enabled || variantsData.spicy.spicy_price > 0 || variantsData.spicy.non_spicy_price > 0);
    const hasSugar = variantsData.sugar && variantsData.sugar.enabled;
    const hasCustom = variantsData.custom_variants && variantsData.custom_variants.length > 0;
    const hasVariants = hasSize || hasCold || hasSpicy || hasSugar || hasCustom;
    if (!hasVariants) return null;

    return (
      <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', width: '100%' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.95rem', fontWeight: '600' }}>Variants Included</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hasSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.size.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.size.enabled || false} onChange={(e) => onUpdateVariant('size', 'enabled', e.target.checked)} style={{ accentColor: '#8b5cf6' }} /> Size
              </label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {['small_price', 'medium_price', 'large_price'].map(field => (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{field.replace('_price', '').replace(/^./, c => c.toUpperCase())}:</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                      <span style={{ padding: '4px 6px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #cbd5e1' }}>{getCurrencySymbol()}</span>
                      <input type="number" value={variantsData.size[field] || ''} onChange={(e) => onUpdateVariant('size', field, parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px 6px', border: 'none', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCold && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.cold.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.cold.enabled || false} onChange={(e) => onUpdateVariant('cold', 'enabled', e.target.checked)} style={{ accentColor: '#8b5cf6' }} /> Cold
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ice Price:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                  <span style={{ padding: '4px 6px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #cbd5e1' }}>{getCurrencySymbol()}</span>
                  <input type="number" value={variantsData.cold.ice_price || ''} onChange={(e) => onUpdateVariant('cold', 'ice_price', parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px 6px', border: 'none', outline: 'none', fontSize: '0.8rem' }} />
                </div>
              </div>
            </div>
          )}

          {hasSpicy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.spicy.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.spicy.enabled || false} onChange={(e) => onUpdateVariant('spicy', 'enabled', e.target.checked)} style={{ accentColor: '#8b5cf6' }} /> Spicy
              </label>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {[['spicy_price', 'Spicy'], ['non_spicy_price', 'Non-Spicy']].map(([field, label]) => (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}:</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                      <span style={{ padding: '4px 6px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #cbd5e1' }}>{getCurrencySymbol()}</span>
                      <input type="number" value={variantsData.spicy[field] || ''} onChange={(e) => onUpdateVariant('spicy', field, parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px 6px', border: 'none', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCustom && variantsData.custom_variants.map((cv, cvIdx) => (
            <div key={cvIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', opacity: cv.enabled ? 1 : 0.6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', color: '#0f172a', cursor: 'pointer' }}>
                <input type="checkbox" checked={cv.enabled || false} onChange={(e) => onUpdateCustomVariant(cvIdx, 'enabled', e.target.checked)} style={{ accentColor: '#8b5cf6' }} /> {cv.heading}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '5px', pointerEvents: cv.enabled ? 'auto' : 'none' }}>
                {cv.subheadings?.map((sub, subIdx) => (
                  <div key={subIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }} title={sub.name}>{sub.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                      <span style={{ padding: '4px 6px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #cbd5e1' }}>{getCurrencySymbol()}</span>
                      <input type="number" value={sub.price === null ? '' : sub.price} onChange={(e) => onUpdateCustomVariant(cvIdx, 'price', parseFloat(e.target.value) || 0, subIdx)} style={{ width: '60px', padding: '4px 6px', border: 'none', outline: 'none', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid mt-5" style={{ fontFamily: "'Gilroy', 'Outfit', 'Inter', sans-serif", color: "#302D3D" }}>
      <style>{scrollbarStyles}</style>
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
      <button
        onClick={goBack}
        style={backButtonStyle}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      <div style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "5px 15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0",
        marginBottom: "20px",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto 20px auto",
        gap: "10px"
      }}>
        {isGroupAdmin && (
          <Form.Select
            value={selectedCompanyFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCompanyFilter(val);
              localStorage.setItem('active_company', val === 'All Companies' ? 'All' : val);

              // If the selected company has no branches, reset the branch filter to "All Branches"
              const hasBranches = val === 'All Companies' || val === 'All'
                ? true
                : (companyBranchesMap[val] && companyBranchesMap[val].length > 0);

              if (!hasBranches || val === 'All Companies' || val === 'All') {
                setSelectedBranchFilter('All Branches');
                localStorage.setItem('active_branch', 'All Branches');
              } else {
                // If the user selects a company and the current branch does NOT belong to it, reset to All Branches
                const branchesForComp = companyBranchesMap[val] || [];
                if (!branchesForComp.includes(selectedBranchFilter)) {
                  setSelectedBranchFilter('All Branches');
                  localStorage.setItem('active_branch', 'All Branches');
                }
              }

              handleViewItems();
              handleViewCombos();
            }}
            style={{
              width: "auto",
              minWidth: "160px",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              borderRadius: "0",
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#2c3e50"
            }}
          >
            <option value="All Companies">All Companies</option>
            {companyOptions.map((comp, idx) => (
              <option key={idx} value={comp}>{comp}</option>
            ))}
          </Form.Select>
        )}

        {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && (() => {
          if (selectedCompanyFilter === 'All Companies' || selectedCompanyFilter === 'All') {
            return availableBranches.length > 0;
          }
          return companyBranchesMap[selectedCompanyFilter] && companyBranchesMap[selectedCompanyFilter].length > 0;
        })() && (
            <Form.Select
              value={selectedBranchFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBranchFilter(val);
                localStorage.setItem('active_branch', val === 'All Branches' ? 'All Branches' : val);
                handleViewItems();
                handleViewCombos();
              }}
              style={{
                width: "auto",
                minWidth: "160px",
                border: "none",
                borderRight: "1px solid #e0e0e0",
                borderRadius: "0",
                backgroundColor: "transparent",
                boxShadow: "none",
                cursor: "pointer",
                fontWeight: "600",
                color: "#2c3e50"
              }}
            >
              <option value="All Branches">All Branches</option>
              {(() => {
                const branchesToList = selectedCompanyFilter === 'All Companies' || selectedCompanyFilter === 'All'
                  ? availableBranches
                  : (companyBranchesMap[selectedCompanyFilter] || []);
                return branchesToList.map((branch, idx) => (
                  <option key={idx} value={branch}>{branch}</option>
                ));
              })()}
            </Form.Select>
          )}
        <Form.Control
          type="text"
          placeholder="Search items, categories or codes..."
          value={globalSearchText}
          onChange={(e) => setGlobalSearchText(e.target.value)}
          style={{
            border: "none",
            backgroundColor: "transparent",
            boxShadow: "none",
            fontSize: "16px",
            padding: "8px 10px",
            color: "#333",
            width: "100%"
          }}
        />
        {globalSearchText && (
          <button
            onClick={() => setGlobalSearchText("")}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#999",
              fontSize: "20px",
              padding: "0 5px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        )}
      </div>

<div style={{ display: "flex", gap: "10px", zIndex: 1000, justifyContent: "flex-end", marginBottom: "20px", width: "100%", paddingRight: "20px" }}>
        <button
          onClick={() => setShowSyncModal(true)}
          style={{
            backgroundColor: "#3498db",
            border: "none",
            color: "white",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2980b9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3498db";
          }}
        >
          <FaSync style={{ marginRight: "5px" }} /> Sync
        </button>
        <button
          onClick={handleGalleryImportClick}
          style={{
            backgroundColor: "#f39c12",
            border: "none",
            color: "white",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            marginRight: "10px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e67e22";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f39c12";
          }}
        >
          <FaCloudDownloadAlt style={{ marginRight: "5px" }} /> Import from Gallery
        </button>
        <button
          onClick={handleAddNewItem}
          style={{
            backgroundColor: "#3b82f6",
            border: "none",
            color: "white",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          <FaPlusCircle style={{ marginRight: "5px" }} /> Add New Item
        </button>



      </div>
      {warningMessage && (
        <div style={warningBoxOverlayStyle}>
          <div style={warningBoxStyle}>
            <p style={warningTextStyle}>{warningMessage}</p>
            <Button
              variant="success"
              style={closeWarningButtonStyle}
              onClick={() => setWarningMessage("")}
            >
              OK
            </Button>
          </div>
        </div>
      )}
      <div style={sidebarStyle} className="custom-sidebar-scroll">
        <div style={{ padding: "20px" }}>
          <h4>Categories</h4>
          {categoriesWithCounts.map((category) => {
            const parts = category.split(' (');
            const catName = parts[0];
            const count = parts[1] ? parts[1].replace(')', '') : null;
            const isSelected = catName === selectedCategory;

            return (
              <div
                key={catName}
                style={isSelected ? selectedCategoryBoxStyle : categoryBoxStyle}
                onClick={() => handleCategoryClick(catName)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                    e.currentTarget.style.borderColor = "#28a745";
                    e.currentTarget.style.color = "#28a745";
                    e.currentTarget.style.transform = "translateX(5px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(40, 167, 69, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#4a5568";
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                  }
                }}
              >
                <span>{catName}</span>
                {count && (
                  <Badge
                    pill
                    bg={isSelected ? "light" : "success"}
                    text={isSelected ? "dark" : "white"}
                    style={{
                      fontSize: "0.8rem",
                      padding: "5px 10px",
                      fontWeight: "bold",
                      minWidth: "28px"
                    }}
                  >
                    {count}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={contentStyle}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #edf2f7',
          paddingBottom: '10px'
        }}>
          <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => { setActiveTab("items"); setSelectedCategory("All Items"); }}
            style={{
              padding: '12px 25px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'items' ? '#3b82f6' : 'transparent',
              color: activeTab === 'items' ? '#fff' : '#64748b',
              fontWeight: '800',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            🍽️ Menu Items
          </button>
          <button
            onClick={() => { setActiveTab("combos"); setSelectedCategory("All Items"); }}
            style={{
              padding: '12px 25px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'combos' ? '#10b981' : 'transparent',
              color: activeTab === 'combos' ? '#fff' : '#64748b',
              fontWeight: '800',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            🎁 Combo Offers
          </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '600', color: '#64748b', fontSize: '15px' }}>List View</span>
            <div 
              style={{
                width: '44px', height: '24px', backgroundColor: isListView ? '#4F46E5' : '#cbd5e1', 
                borderRadius: '12px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s',
                display: 'inline-flex', alignItems: 'center', justifyContent: isListView ? 'flex-end' : 'flex-start'
              }}
              onClick={() => setIsListView(!isListView)}
            >
              <div style={{ width: '20px', height: '20px', backgroundColor: '#ffffff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
            {activeTab === 'combos' ? 'Special Combo Offers' : `${selectedCategory} Items`}
          </h2>
          <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#475569' }}>
            Total: {filteredItems.length}
          </div>
        </div>
        {filteredItems.length === 0 ? (
          <p>No items to display.</p>
        ) : isListView ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr style={{ fontSize: '15px' }}>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px 24px', fontWeight: '700', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>Name</th>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px', fontWeight: '700' }}>Price</th>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px', fontWeight: '700' }}>Category</th>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px', fontWeight: '700' }}>Name of Kitchen</th>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px', fontWeight: '700', textAlign: 'center' }}>Available</th>
                  <th style={{ backgroundColor: '#10D194', color: '#ffffff', padding: '16px 24px', fontWeight: '700', textAlign: 'center', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const isAvailable = !item.disabled;
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>
                        {item.item_name || item.name1 || "Unnamed Item"}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>
                        {getCurrencySymbol()} {item.price_list_rate || item.price || 0}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', color: '#64748b', fontSize: '0.85rem', width: 'max-content' }}>
                          <span style={{ flex: 1, marginRight: '10px' }}>{item.item_group || 'N/A'}</span>
                          
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                        {item.kitchen || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div 
                          style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: isAvailable ? 'flex-end' : 'flex-start',
                            width: '44px', height: '24px', backgroundColor: isAvailable ? '#4F46E5' : '#cbd5e1', 
                            borderRadius: '12px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s'
                          }}
                        >
                          <div style={{ width: '20px', height: '20px', backgroundColor: '#ffffff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                          <button 
                            onClick={() => onEditFromList(item)}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fbbf24', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <FaEdit size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteFromList(item)}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f87171', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="row">
            {filteredItems.map((item) => {
              if (item.type === 'combo_offer') {
                return (
                  <div key={item.normalized_key} className="col-md-3 mb-4">
                    <Card
                      style={posterStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
                        e.currentTarget.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                      }}
                    >
                      <div style={logoStyle}>K</div>
                      {isGroupAdmin && (
                        <Badge bg="light" text="dark" style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', opacity: 0.9 }}>
                          {item.company_name || item.company}
                        </Badge>
                      )}
                      <h4 style={offerNameStyle}>
                        {`${item.description || item.item_name || "Combo"} - ${(item.company_name || item.company || "").toUpperCase()}${item.branch_name && item.branch_name !== 'All Branches' ? ` / ${item.branch_name.toUpperCase()}` : ''}`}
                      </h4>
                      {hasActiveOffer(item) && (
                        <p style={offerPeriodStyle}>
                          <strong>Offer Period:</strong> {new Date(item.offer_start_time).toLocaleDateString()} {new Date(item.offer_start_time).toLocaleTimeString()} to {new Date(item.offer_end_time).toLocaleDateString()} {new Date(item.offer_end_time).toLocaleTimeString()}
                        </p>
                      )}
                      {(() => {
                        const uploadedImages = getUploadedImages(item);
                        if (uploadedImages.length > 0) {
                          return (
                            <div style={uploadedImagesStyle}>
                              {uploadedImages.map((imgPath, idx) => {
                                const src = `${baseUrl}${imgPath}`;
                                return (
                                  <img
                                    key={idx}
                                    src={src}
                                    alt={`Uploaded combo image ${idx + 1}`}
                                    style={uploadedImageThumbStyle}
                                    onError={(e) => {
                                      e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
                                    }}
                                  />
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <ul style={itemsListStyle}>
                        {getComboItemsWithImages(item).map((itemWithImage, idx) => (
                          <li key={idx} style={itemsListItemStyle}>
                            {itemWithImage.image && (
                              <img
                                src={`${baseUrl}${itemWithImage.image}`}
                                alt={itemWithImage.name}
                                style={itemImageStyle}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            {itemWithImage.name}
                          </li>
                        ))}
                      </ul>
                      <p style={totalPriceStyle}>
                        Total Price: {hasActiveOffer(item) ? (
                          <>
                            <span style={{ ...strikethroughStyle, color: "#aaa", fontSize: "16px" }}>{formatPrice(item.price_list_rate || item.total_price)}</span>
                            <span style={{ color: "#fdd835", fontSize: "18px" }}>{formatPrice(item.offer_price)}</span>
                          </>
                        ) : (
                          <span style={{ color: "#ffffff", fontSize: "18px" }}>{formatPrice(item.price_list_rate || item.total_price)}</span>
                        )}
                      </p>
                      {hasActiveOffer(item) && <p style={limitedOfferStyle}>LIMITED OFFERS! Place Your Order</p>}
                      <Button
                        variant="success"
                        onClick={() => handleItemClick(item, true)}
                        style={viewButtonStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0f0f0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }}
                      >
                        View
                      </Button>
                    </Card>
                  </div>
                );
              }

              return (
                <div key={item.normalized_key} className="col-md-2 mb-4">
                  <Card
                    style={cardStyle}
                    onMouseEnter={(e) => (e.currentTarget.style = { ...cardStyle, ...cardHoverStyle })}
                    onMouseLeave={(e) => (e.currentTarget.style = cardStyle)}
                  >
                    <div style={{ position: 'relative' }}>
                      <Card.Img
                        variant="top"
                        src={getImageUrl(item.image, baseUrl)}
                        alt={item.item_name || item.name}
                        style={imgStyle}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
                        }}
                      />
                      {item.type === 'addon' && (
                        <Badge bg="info" style={{ position: 'absolute', top: '5px', right: '5px' }}>Addon</Badge>
                      )}
                      {item.type === 'item_combo' && (
                        <Badge bg="warning" text="dark" style={{ position: 'absolute', top: '5px', right: '5px' }}>Combo</Badge>
                      )}
                    </div>
                    <Card.Body style={{ textAlign: "center", padding: "0.75rem" }}>
                      <Card.Title style={{ fontSize: "0.95rem", color: "black", marginBottom: "0.5rem", minHeight: "45px", overflow: "hidden", position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="fw-bold">{item.item_name || item.name}</span>
                        {/* Only show company badge if not specifically filtered to that company */}
                        {isGroupAdmin && (selectedCompanyFilter === 'All Companies' || selectedCompanyFilter === 'All') && (
                          <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '3px' }}>
                            {(item.company_name || item.company || "").toUpperCase()}
                          </span>
                        )}
                      </Card.Title>
                      {item.parentName && (
                        <small className="text-muted d-block mb-1">
                          of {item.parentName}
                        </small>
                      )}
                      <div style={priceStyle}>
                        {hasActiveOffer(item) ? (
                          <>
                            <span style={strikethroughStyle}>{formatPrice(item.price_list_rate || item.total_price)}</span>
                            <span style={offerPriceStyle}>{formatPrice(item.offer_price)}</span>
                          </>
                        ) : (
                          <span>{formatPrice(item.price_list_rate || item.total_price)}</span>
                        )}
                      </div>
                      <Button variant="success" onClick={() => handleItemClick(item, false)}
                        className="w-100"
                        style={{ marginTop: "10px", backgroundColor: "#28a745", borderColor: "#28a745" }}
                      >
                        View
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedItem && (
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {`${selectedItem.item_name || selectedItem.description || "Item"} ${(selectedItem.company_name || selectedItem.company || "").toUpperCase()}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0 }}>
            {/* ── Sticky Action Bar ── */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderBottom: '1.5px solid #e2e8f0',
              padding: '12px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}>
              {/* Left: Ingredients & Nutrition */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!selectedItem.isCombo && (
                  <button
                    onClick={handleNutritionClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #93c5fd',
                      backgroundColor: '#eff6ff', color: '#2563eb',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                      transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(37,99,235,0.08)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                  >
                    🥗 Ingredients &amp; Nutrition
                  </button>
                )}
              </div>

              {/* Right: Delete/Hide | Edit */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handleDeleteItem}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #fca5a5',
                    backgroundColor: '#fff5f5', color: '#dc2626',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(220,38,38,0.08)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff5f5'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                >
                  🗑 Delete / Hide
                </button>
                <button
                  onClick={handleEditItem}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #6ee7b7',
                    backgroundColor: '#f0fdf4', color: '#16a34a',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(22,163,74,0.08)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#16a34a'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.borderColor = '#6ee7b7'; }}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="container" style={{ padding: '20px' }}>
              {/* --- UPDATED LAYOUT: START --- */}
              <div className="row">
                {/* Left Column: Image */}
                <div className="col-md-5">
                  <h6>Image:</h6>
                  <img
                    src={`${baseUrl}${selectedItem.image}` || "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E"}
                    alt={selectedItem.item_name || selectedItem.description}
                    className="img-fluid"
                    style={{ ...imgStyle, height: "auto", maxHeight: "300px" }} // Adjusted style
                  />
                </div>
                {/* Right Column: Details */}
                <div className="col-md-7">
                  {!selectedItem.isCombo && (
                    <>
                      <h5>Item Code: {selectedItem.item_code}</h5>
                      <h5>Item Group: {selectedItem.item_group}</h5>
                      <h5>Kitchen: {selectedItem.kitchen || "Not specified"}</h5>
                      {/* Dynamic Fields from Doctype */}
                      {doctypeFields
                        .filter(f => !['item_code', 'item_name', 'item_group', 'price_list_rate', 'tax_applicable', 'tax_rate', 'has_offer', 'offer_price', 'offer_start_time', 'offer_end_time', 'kitchen', 'image', 'images', 'variant_table', 'ingredients'].includes(f.id))
                        .map(f => {
                          const val = selectedItem[f.id];
                          if (val === undefined || val === null || val === '') return null;

                          if (f.type === 'Attach Image') {
                            return (
                              <div key={f.id} className="mt-2">
                                <h5>{f.label}:</h5>
                                <img
                                  src={`${baseUrl}/api/images/${val}`}
                                  alt={f.label}
                                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                  onError={(e) => {
                                    e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
                                  }}
                                />
                              </div>
                            );
                          }

                          return (
                            <h5 key={f.id}>
                              {f.label}: {f.type === 'Check' ? (val ? 'Yes' : 'No') : val}
                            </h5>
                          );
                        })
                      }
                    </>
                  )}
                  <h5>
                    Price:{" "}
                    {hasActiveOffer(selectedItem) ? (
                      <>
                        <span style={strikethroughStyle}>{formatPrice(selectedItem.price_list_rate || selectedItem.total_price)}</span>{" "}
                        <span style={offerPriceStyle}>{formatPrice(selectedItem.offer_price)}</span>
                      </>
                    ) : (
                      <>{formatPrice(selectedItem.price_list_rate || selectedItem.total_price)}</>
                    )}
                  </h5>
                  {hasActiveOffer(selectedItem) && (
                    <>
                      <h5>Offer Starts: {new Date(selectedItem.offer_start_time).toLocaleString()}</h5>
                      <h5>Offer Ends: {new Date(selectedItem.offer_end_time).toLocaleString()}</h5>
                    </>
                  )}
                </div>
              </div>
              {/* Bottom Row: Additional Images (Centered) */}
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Additional Images:</h6>
                    <div style={multipleImagesStyle}>
                      {(() => {
                        let imagesArray = [];
                        if (Array.isArray(selectedItem.images)) {
                          imagesArray = selectedItem.images;
                        } else if (typeof selectedItem.images === 'string' && selectedItem.images.trim().startsWith('[')) {
                          try {
                            imagesArray = JSON.parse(selectedItem.images);
                          } catch (e) {
                            imagesArray = [];
                          }
                        }

                        if (!Array.isArray(imagesArray)) return null;

                        return imagesArray.map((img, idx) => {
                          const src = selectedItem.isCombo
                            ? `${baseUrl}/api/combo-images/${img}`
                            : `${baseUrl}/api/images/${img}`;
                          return (
                            <img
                              key={idx}
                              src={src}
                              alt={`${selectedItem.item_name || selectedItem.description} additional ${idx + 1}`}
                              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
                              }}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {/* --- UPDATED LAYOUT: END --- */}
              {/* Other details (Addons, Combos, Variants, etc.) can go here in new rows */}
              <div className="row mt-3">
                <div className="col-12">
                  {(() => {
                    const filteredAddons = (Array.isArray(selectedItem.addons) ? selectedItem.addons : []).filter(addon => {
                      const addonBranches = (addon.branch_names || []).concat(addon.branch_name ? [addon.branch_name] : []).concat(addon.branch ? [addon.branch] : []);
                      const addonCompanies = (addon.company_names || []).concat(addon.company_name ? [addon.company_name] : []).concat(addon.company ? [addon.company] : []);

                      const currentCompany = selectedItem.company_name || selectedItem.company || "";
                      const currentBranch = selectedItem.branch_name || selectedItem.branch || "";

                      // Use UI filter context if available for more accurate filtering in branch-specific views
                      const contextBranch = (selectedBranchFilter && selectedBranchFilter !== 'All Branches') ? selectedBranchFilter : currentBranch;
                      const contextCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All') ? selectedCompanyFilter : currentCompany;

                      const isGlobalAddon = addonCompanies.length === 0 && addonBranches.length === 0;
                      const isCompanyMatch = addonCompanies.length === 0 || addonCompanies.some(c => matchTenancy(c, contextCompany));
                      const isBranchMatch = addonBranches.length === 0 || addonBranches.some(b => matchTenancy(b, contextBranch));

                      // Robust validation: must have identifying info and match tenancy
                      const hasData = addon.name1 || (addon.addon_price !== undefined && addon.addon_price !== null) || addon.addon_image;
                      return hasData && (isGlobalAddon || (isCompanyMatch && isBranchMatch));
                    });

                    if (filteredAddons.length === 0) return null;

                    return (
                      <div className="mb-4">
                        <h6 className="fw-bold text-primary">Addons:</h6>
                        <ul className="list-unstyled">
                          {filteredAddons.map((addon, idx) => {
                            const currentCompany = selectedItem.company_name || selectedItem.company || "";
                            const contextCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All') ? selectedCompanyFilter : currentCompany;
                            const activeUIBranch = selectedBranchFilter;
                            const isSpecificBranchActive = activeUIBranch && activeUIBranch !== 'All Branches' && activeUIBranch !== 'All';

                            let displayPrice = addon.addon_price;
                            if (isSpecificBranchActive && addon.branch_prices && addon.branch_prices[activeUIBranch] !== undefined) {
                              displayPrice = addon.branch_prices[activeUIBranch];
                            } else if (contextCompany && addon.company_prices && addon.company_prices[contextCompany] !== undefined) {
                              displayPrice = addon.company_prices[contextCompany];
                            } else {
                              displayPrice = addon.addon_price;
                            }

                            return (
                              <li key={idx} style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                {addon.name1 && <strong className="d-block">{addon.name1}</strong>}
                                {displayPrice > 0 && <p className="mb-1 text-success fw-bold">Price: {formatPrice(displayPrice)}</p>}
                                {addon.addon_image && (
                                  <img
                                    src={getImageUrl(addon.addon_image, baseUrl)}
                                    alt={addon.name1}
                                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: '5px', border: '1px solid #dee2e6' }}
                                  />
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}

                  {(() => {
                    const filteredCombos = (Array.isArray(selectedItem.combos) ? selectedItem.combos : []).filter(combo => {
                      const comboBranches = (combo.branch_names || []).concat(combo.branch_name ? [combo.branch_name] : []).concat(combo.branch ? [combo.branch] : []);
                      const comboCompanies = (combo.company_names || []).concat(combo.company_name ? [combo.company_name] : []).concat(combo.company ? [combo.company] : []);

                      const currentCompany = selectedItem.company_name || selectedItem.company || "";
                      const currentBranch = selectedItem.branch_name || selectedItem.branch || "";

                      // Use UI filter context if available
                      const contextBranch = (selectedBranchFilter && selectedBranchFilter !== 'All Branches') ? selectedBranchFilter : currentBranch;
                      const contextCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All') ? selectedCompanyFilter : currentCompany;

                      const isGlobalCombo = comboCompanies.length === 0 && comboBranches.length === 0;
                      const isCompanyMatch = comboCompanies.length === 0 || comboCompanies.some(c => matchTenancy(c, contextCompany));
                      const isBranchMatch = comboBranches.length === 0 || comboBranches.some(b => matchTenancy(b, contextBranch));

                      const hasData = combo.name1 || (combo.combo_price !== undefined && combo.combo_price !== null) || combo.combo_image;
                      return hasData && (isGlobalCombo || (isCompanyMatch && isBranchMatch));
                    });

                    if (filteredCombos.length === 0) return null;

                    return (
                      <div className="mb-4">
                        <h6 className="fw-bold text-primary">Combos:</h6>
                        <ul className="list-unstyled">
                          {filteredCombos.map((combo, idx) => {
                            const currentCompany = selectedItem.company_name || selectedItem.company || "";
                            const contextCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All') ? selectedCompanyFilter : currentCompany;
                            const activeUIBranch = selectedBranchFilter;
                            const isSpecificBranchActive = activeUIBranch && activeUIBranch !== 'All Branches' && activeUIBranch !== 'All';

                            let displayPrice = combo.combo_price;
                            if (isSpecificBranchActive && combo.branch_prices && combo.branch_prices[activeUIBranch] !== undefined) {
                              displayPrice = combo.branch_prices[activeUIBranch];
                            } else if (contextCompany && combo.company_prices && combo.company_prices[contextCompany] !== undefined) {
                              displayPrice = combo.company_prices[contextCompany];
                            } else {
                              displayPrice = combo.combo_price;
                            }

                            return (
                              <li key={idx} style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                {combo.name1 && <strong className="d-block">{combo.name1}</strong>}
                                {displayPrice > 0 && <p className="mb-1 text-success fw-bold">Price: {formatPrice(displayPrice)}</p>}
                                {combo.combo_image && (
                                  <img
                                    src={getImageUrl(combo.combo_image, baseUrl)}
                                    alt={combo.name1}
                                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: '5px', border: '1px solid #dee2e6' }}
                                  />
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                  {Array.isArray(selectedItem.items) && selectedItem.items.length > 0 && selectedItem.isCombo && (
                    <div>
                      <h6>Items in Combo:</h6>
                      <ul>
                        {selectedItem.items.map((comboItem, idx) => (
                          <li key={idx}>
                            {comboItem.data.item_name || comboItem.data.name1} - {formatPrice(comboItem.price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(selectedItem.variants) && selectedItem.variants.length > 0 && (
                    <div>
                      <h6>Variants:</h6>
                      <ul>
                        {selectedItem.variants
                          .filter(variant => variant.type_of_variants || variant.variant_image)
                          .map((variant, idx) => (
                            <li key={idx}>
                              {variant.type_of_variants && <p>Type: {variant.type_of_variants}</p>}
                              {variant.variant_image && (
                                <img
                                  src={`${baseUrl}/api/images/${variant.variant_image}`} // FIXED: Added /api/images/ prefix
                                  alt={variant.type_of_variants}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(selectedItem.custom_fields) && selectedItem.custom_fields.length > 0 && (
                    <div>
                      <h6>Custom Fields:</h6>
                      <ul>
                        {selectedItem.custom_fields.map((field, idx) => (
                          <li key={idx}>
                            <p>
                              {field.name}:{" "}
                              {field.type === "image" ? (
                                <img
                                  src={field.value ? `${baseUrl}/api/images/${field.value}` : "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E"}
                                  alt={field.name}
                                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                />
                              ) : field.type === "checkbox" ? (
                                field.value ? "Yes" : "No"
                              ) : (
                                field.value
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
      {/* Sale Details Modal */}
      {selectedSale && (
        <Modal show={showSaleModal} onHide={handleCloseSaleModal} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Sale Details - {selectedSale.invoice_no}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="container">
              <h5>Customer: {selectedSale.customer || 'N/A'}</h5>
              <h5>Date: {selectedSale.date}</h5>
              <h5>Time: {selectedSale.time}</h5>
              <h5>Payment Method: {selectedSale.payment_method || 'CASH'}</h5>
              <h5>Subtotal: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getCurrencySymbol(selectedSale.invoice_currency)}{selectedSale.total}</span></h5>
              <h5>VAT: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getCurrencySymbol(selectedSale.invoice_currency)}{selectedSale.vat_amount}</span></h5>
              <h5>Grand Total: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getCurrencySymbol(selectedSale.invoice_currency)}{selectedSale.grand_total}</span></h5>
              <h6>Items:</h6>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getCurrencySymbol(selectedSale.invoice_currency)}{item.basePrice}</span></td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{getCurrencySymbol(selectedSale.invoice_currency)}{item.amount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseSaleModal}>Close</Button>
            <Button variant="danger" onClick={handleDeleteSale}>
              <FaTrash /> Delete Sale
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Nutrition Modal */}
      {selectedItem && (
        <Modal show={showNutritionModal} onHide={handleCloseNutritionModal}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedItem.item_name} - Ingredients & Nutrition</Modal.Title>
          </Modal.Header>
          <Modal.Body style={nutritionModalStyle}>
            {hasValidData() ? (
              <div>
                {(nutritionData.ingredients || Array.isArray(nutritionData.ingredients)) && (
                  <div style={nutritionItemStyle}>
                    <h6>Ingredients:</h6>
                    {renderIngredients(nutritionData.ingredients)}
                  </div>
                )}
                {nutritionData.nutrition && Object.keys(nutritionData.nutrition).length > 0 && (
                  <div style={nutritionItemStyle}>
                    <h6>Nutrition Information:</h6>
                    <ul>
                      {Object.entries(nutritionData.nutrition)
                        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
                        .map(([key, value]) => (
                          <li key={key}>
                            <strong>{formatNutritionLabel(key)}:</strong> {value}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>No ingredients or nutrition data available for this item.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseNutritionModal}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Offer Modal */}
      {showOfferModal && (
        <Modal show={showOfferModal} onHide={handleCloseOfferModal}>
          <Modal.Header closeButton>
            <Modal.Title>Create Offer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Search Items</Form.Label>
                <Form.Control
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for items..."
                />
              </Form.Group>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {searchedItems.length === 0 && searchTerm && (
                  <p>No items found.</p>
                )}
                {searchedItems.map((item) => (
                  <Card
                    key={item.normalized_key || item._id}
                    style={{
                      marginBottom: "10px",
                      cursor: "pointer",
                      backgroundColor: offerItem?._id === item._id ? "#e9ecef" : "white",
                    }}
                    onClick={() => handleOfferItemSelect(item)}
                  >
                    <Card.Body>
                      <Card.Title>{item.item_name}</Card.Title>
                      <Card.Text>Price: {formatPrice(item.price_list_rate)}</Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </div>
              {offerItem && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Selected Item: {offerItem.item_name}</Form.Label>
                    <Form.Text className="d-block">Current Price: {formatPrice(offerItem.price_list_rate)}</Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer Price</Form.Label>
                    <Form.Control
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Enter offer price"
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer Start Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={offerStartTime}
                      onChange={(e) => setOfferStartTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Offer End Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={offerEndTime}
                      onChange={(e) => setOfferEndTime(e.target.value)}
                      min={offerStartTime || new Date().toISOString().slice(0, 16)}
                    />
                  </Form.Group>
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseOfferModal}>Close</Button>
            <Button variant="primary" onClick={handleOfferSubmit} disabled={!offerItem}>
              Create Offer
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <SyncItemModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSync={(newItem) => {
          handleViewItems();
        }}
        baseUrl={baseUrl}
        getHeaders={getHeaders}
        activeCompany={localStorage.getItem('active_company')}
        activeBranch={localStorage.getItem('active_branch')}
        existingItems={displayItems}
        getCurrencySymbol={getCurrencySymbol}
      />
      {/* Gallery Import Modal - Custom Overlay (matches SyncItemModal design) */}
      {showGalleryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            width: '1200px', maxWidth: '96vw', minWidth: '800px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '700' }}>
                <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#f59e0b', display: 'flex' }}>
                  <FaCloudDownloadAlt size={18} />
                </div>
                Import from Item Gallery
              </h3>
              <button onClick={() => setShowGalleryModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '15px 30px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '14px', left: '16px', color: '#94a3b8', fontSize: '1.1rem' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search gallery by item name or group..."
                  value={gallerySearchQuery}
                  onChange={(e) => setGallerySearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#fcfcfd' }}>
              {galleryLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
                  Fetching gallery items...
                </div>
              ) : galleryItems.filter(item => {
                  if(!gallerySearchQuery) return true;
                  const q = gallerySearchQuery.toLowerCase();
                  return (item.item_name && item.item_name.toLowerCase().includes(q)) ||
                         (item.item_group && item.item_group.toLowerCase().includes(q));
                }).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏪</div>
                  No items found in the gallery.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {galleryItems.filter(item => {
                    if(!gallerySearchQuery) return true;
                    const q = gallerySearchQuery.toLowerCase();
                    return (item.item_name && item.item_name.toLowerCase().includes(q)) ||
                           (item.item_group && item.item_group.toLowerCase().includes(q));
                  }).map((item, idx) => (
                    <div key={idx} style={{
                      backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
                      overflow: 'hidden', transition: 'all 0.3s ease',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#fde68a'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <div style={{ height: '200px', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                        {item.image ? (
                          <img src={item.image.startsWith('data:') ? item.image : `${baseUrl}/api/images/${item.image}`} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '3rem' }}>🍽️</div>
                        )}
                        <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(30,41,59,0.85)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.3px' }}>
                          {item.item_group}
                        </div>
                      </div>
                      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', lineHeight: '1.3' }}>{item.item_name}</h4>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#16a34a', marginBottom: '14px' }}>{formatPrice(item.price_list_rate)}</div>
                        <div style={{ flex: 1, fontSize: '0.85rem', marginBottom: '16px' }}>
                          {(() => {
                            const hasSize = item.size && item.size.enabled;
                            const hasCold = item.cold && item.cold.enabled;
                            const hasSpicy = item.spicy && item.spicy.enabled;
                            const hasCustom = item.custom_variants && item.custom_variants.length > 0;
                            const hasVariants = hasSize || hasCold || hasSpicy || hasCustom;
                            return (<>
                              {hasVariants && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}><span>Variants</span><span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', color: '#475569' }}>{[hasSize && 'Size', hasCold && 'Cold', hasSpicy && 'Spicy', hasCustom && `${item.custom_variants.length} custom`].filter(Boolean).join(', ')}</span></div>}
                              {item.addons && item.addons.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}><span>Addons</span><span style={{ backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', color: '#16a34a' }}>{item.addons.length}</span></div>}
                              {item.combos && item.combos.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}><span>Combos</span><span style={{ backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', color: '#2563eb' }}>{item.combos.length}</span></div>}
                            </>);
                          })()}
                        </div>
                        <button
                          onClick={() => importGalleryItem(item)}
                          style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d97706'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f59e0b'}
                        >
                          Customize &amp; Import
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customize & Import Modal - Custom Overlay */}
      {showCustomizeModal && importData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3100
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            width: '1100px', maxWidth: '96vw', minWidth: '800px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', backgroundColor: '#d1fae5', borderRadius: '8px', color: '#059669', display: 'flex' }}>
                  <FaCloudDownloadAlt size={18} />
                </div>
                Customize &amp; Import
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  backgroundColor: (() => {
                    const comp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : localStorage.getItem('active_company');
                    const hasTarget = comp && comp !== 'All Companies' && comp !== 'All';
                    return hasTarget ? '#dbeafe' : '#fee2e2';
                  })(),
                  color: (() => {
                    const comp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : localStorage.getItem('active_company');
                    const hasTarget = comp && comp !== 'All Companies' && comp !== 'All';
                    return hasTarget ? '#1d4ed8' : '#dc2626';
                  })(),
                  padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600'
                }}>
                  Importing to: {(() => {
                    const comp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') ? selectedCompanyFilter : localStorage.getItem('active_company');
                    const branch = (selectedBranchFilter && selectedBranchFilter !== 'All Branches' && selectedBranchFilter !== 'All') ? selectedBranchFilter : localStorage.getItem('active_branch');
                    const compName = (!comp || comp === 'All Companies' || comp === 'All') ? null : comp;
                    const branchName = (!branch || branch === 'All Branches' || branch === 'All') ? null : branch;
                    if (!compName) return '⚠ Please select a company first';
                    return branchName ? `${compName} → ${branchName}` : compName;
                  })()}
                </span>
                <button onClick={() => setShowCustomizeModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#fcfcfd' }}>
              {/* Image + Main Info */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                {/* Image Upload */}
                <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.querySelector('.upload-overlay').style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.querySelector('.upload-overlay').style.opacity = 0}>
                  {importData.image ? (
                    <img src={importData.image.startsWith('data:') ? importData.image : `${baseUrl}/api/images/${importData.image}`} alt={importData.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#cbd5e1', fontSize: '3rem' }}>🍽️</div>
                  )}
                  <div className="upload-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <label style={{ color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', padding: '8px' }}>
                      📷 Upload New
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {/* Fields */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Name</label>
                      <input type="text" value={importData.item_name || ""} onChange={(e) => setImportData({...importData, item_name: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Group</label>
                      <input type="text" value={importData.item_group || ""} onChange={(e) => setImportData({...importData, item_group: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none', fontSize: '0.95rem', color: '#334155' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Price</label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                        <span style={{ padding: '12px 14px', backgroundColor: '#e2e8f0', color: '#475569', borderRight: '1px solid #cbd5e1', fontWeight: '600', fontSize: '0.9rem' }}>{getCurrencySymbol()}</span>
                        <input type="number" value={importData.price_list_rate || 0} onChange={(e) => setImportData({...importData, price_list_rate: parseFloat(e.target.value) || 0})}
                          style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600', fontSize: '1rem' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax Applicable</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                        <input type="checkbox" checked={importData.tax_applicable || false} onChange={(e) => setImportData({...importData, tax_applicable: e.target.checked})}
                          style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{importData.tax_applicable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    {importData.tax_applicable && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax Rate</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                          <input type="number" value={importData.tax_rate || 0} onChange={(e) => setImportData({...importData, tax_rate: parseFloat(e.target.value) || 0})}
                            style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600', fontSize: '1rem' }} />
                          <span style={{ padding: '12px 14px', backgroundColor: '#e2e8f0', color: '#475569', borderLeft: '1px solid #cbd5e1', fontWeight: '600' }}>%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Item Variants */}
              {renderVariantsUI(importData, 
                (variantGroup, field, value) => {
                  setImportData(prev => ({ ...prev, [variantGroup]: { ...prev[variantGroup], [field]: value } }));
                },
                (cvIdx, field, value, subIdx = null) => {
                  setImportData(prev => {
                    const newCv = [...prev.custom_variants];
                    if (subIdx !== null) newCv[cvIdx].subheadings[subIdx][field] = value;
                    else newCv[cvIdx][field] = value;
                    return { ...prev, custom_variants: newCv };
                  });
                }
              )}

              {/* Addons Section */}
              {importData.addons && importData.addons.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                    <div style={{ width: '5px', height: '22px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                    Addons
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', marginLeft: '8px' }}>
                      ({importData.addons.filter(a => a._selected !== false).length}/{importData.addons.length} selected)
                    </span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {importData.addons.map((addon, i) => {
                      const isSelected = addon._selected !== false;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', backgroundColor: isSelected ? '#fff' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isSelected ? '#d1fae5' : '#e2e8f0'}`, boxShadow: isSelected ? '0 2px 4px rgba(16,185,129,0.04)' : 'none', opacity: isSelected ? 1 : 0.6, transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div onClick={() => {
                            const newAddons = [...importData.addons];
                            newAddons[i]._selected = !isSelected;
                            setImportData({...importData, addons: newAddons});
                          }} style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '6px', border: `2px solid ${isSelected ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#10b981' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
                            {isSelected && <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '700' }}>✓</span>}
                          </div>
                          <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, backgroundColor: '#f8fafc' }}>
                            {(addon.addon_image || addon.image) ? (
                              <img src={`${baseUrl}/api/images/${addon.addon_image || addon.image}`} alt="Addon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '1.5rem' }}>🍱</div>
                            )}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" value={addon.name1 || addon.item_name || ""} placeholder="Addon Name"
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newAddons = [...importData.addons];
                                if ('name1' in addon) newAddons[i].name1 = e.target.value;
                                else newAddons[i].item_name = e.target.value;
                                setImportData({...importData, addons: newAddons});
                              }}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: isSelected ? '#f8fafc' : '#f1f5f9', outline: 'none', fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', cursor: isSelected ? 'text' : 'not-allowed' }} />
                            <input type="text" value={addon.item_group || ""} placeholder="Item Group"
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newAddons = [...importData.addons];
                                newAddons[i].item_group = e.target.value;
                                setImportData({...importData, addons: newAddons});
                              }}
                              style={{ width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: isSelected ? '#fff' : '#f1f5f9', outline: 'none', fontSize: '0.85rem', color: '#475569', cursor: isSelected ? 'text' : 'not-allowed' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', minWidth: '130px', alignSelf: 'flex-start', marginTop: '4px' }}>
                            <span style={{ padding: '10px 12px', backgroundColor: '#f1f5f9', color: '#64748b', borderRight: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>{getCurrencySymbol()}</span>
                            <input type="number" value={addon.addon_price || 0}
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newAddons = [...importData.addons];
                                newAddons[i].addon_price = parseFloat(e.target.value) || 0;
                                setImportData({...importData, addons: newAddons});
                              }}
                              style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: isSelected ? 'text' : 'not-allowed' }} />
                          </div>
                          </div>
                          {/* Addon Variants */}
                          {isSelected && renderVariantsUI(addon,
                            (variantGroup, field, value) => {
                              const newAddons = [...importData.addons];
                              if (!newAddons[i][variantGroup]) newAddons[i][variantGroup] = {};
                              newAddons[i][variantGroup][field] = value;
                              setImportData({...importData, addons: newAddons});
                            },
                            (cvIdx, field, value, subIdx = null) => {
                              const newAddons = [...importData.addons];
                              if (!newAddons[i].custom_variants) newAddons[i].custom_variants = [];
                              if (subIdx !== null) newAddons[i].custom_variants[cvIdx].subheadings[subIdx][field] = value;
                              else newAddons[i].custom_variants[cvIdx][field] = value;
                              setImportData({...importData, addons: newAddons});
                            }
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Combos Section */}
              {importData.combos && importData.combos.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                    <div style={{ width: '5px', height: '22px', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
                    Combos
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', marginLeft: '8px' }}>
                      ({importData.combos.filter(c => c._selected !== false).length}/{importData.combos.length} selected)
                    </span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {importData.combos.map((combo, i) => {
                      const isSelected = combo._selected !== false;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', backgroundColor: isSelected ? '#fff' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}`, boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.04)' : 'none', opacity: isSelected ? 1 : 0.6, transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div onClick={() => {
                            const newCombos = [...importData.combos];
                            newCombos[i]._selected = !isSelected;
                            setImportData({...importData, combos: newCombos});
                          }} style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '6px', border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#2563eb' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
                            {isSelected && <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '700' }}>✓</span>}
                          </div>
                          <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, backgroundColor: '#f8fafc' }}>
                            {(combo.combo_image || combo.image) ? (
                              <img src={`${baseUrl}/api/images/${combo.combo_image || combo.image}`} alt="Combo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '1.5rem' }}>🍔</div>
                            )}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" value={combo.name1 || combo.item_name || ""} placeholder="Combo Name"
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newCombos = [...importData.combos];
                                if ('name1' in combo) newCombos[i].name1 = e.target.value;
                                else newCombos[i].item_name = e.target.value;
                                setImportData({...importData, combos: newCombos});
                              }}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: isSelected ? '#f8fafc' : '#f1f5f9', outline: 'none', fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', cursor: isSelected ? 'text' : 'not-allowed' }} />
                            <input type="text" value={combo.item_group || ""} placeholder="Item Group"
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newCombos = [...importData.combos];
                                newCombos[i].item_group = e.target.value;
                                setImportData({...importData, combos: newCombos});
                              }}
                              style={{ width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: isSelected ? '#fff' : '#f1f5f9', outline: 'none', fontSize: '0.85rem', color: '#475569', cursor: isSelected ? 'text' : 'not-allowed' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', minWidth: '130px', alignSelf: 'flex-start', marginTop: '4px' }}>
                            <span style={{ padding: '10px 12px', backgroundColor: '#f1f5f9', color: '#64748b', borderRight: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>{getCurrencySymbol()}</span>
                            <input type="number" value={combo.combo_price || 0}
                              disabled={!isSelected}
                              onChange={(e) => {
                                const newCombos = [...importData.combos];
                                newCombos[i].combo_price = parseFloat(e.target.value) || 0;
                                setImportData({...importData, combos: newCombos});
                              }}
                              style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: isSelected ? 'text' : 'not-allowed' }} />
                          </div>
                          </div>
                          {/* Combo Variants */}
                          {isSelected && renderVariantsUI(combo,
                            (variantGroup, field, value) => {
                              const newCombos = [...importData.combos];
                              if (!newCombos[i][variantGroup]) newCombos[i][variantGroup] = {};
                              newCombos[i][variantGroup][field] = value;
                              setImportData({...importData, combos: newCombos});
                            },
                            (cvIdx, field, value, subIdx = null) => {
                              const newCombos = [...importData.combos];
                              if (!newCombos[i].custom_variants) newCombos[i].custom_variants = [];
                              if (subIdx !== null) newCombos[i].custom_variants[cvIdx].subheadings[subIdx][field] = value;
                              else newCombos[i].custom_variants[cvIdx][field] = value;
                              setImportData({...importData, combos: newCombos});
                            }
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 30px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button onClick={() => setShowCustomizeModal(false)}
                style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>
                Cancel
              </button>
              <button onClick={executeImport} disabled={importSubmitting}
                style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: importSubmitting ? '#86efac' : '#22c55e', color: 'white', fontWeight: '700', cursor: importSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(34,197,94,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { if(!importSubmitting) e.currentTarget.style.backgroundColor = '#16a34a'; }}
                onMouseLeave={e => { if(!importSubmitting) e.currentTarget.style.backgroundColor = '#22c55e'; }}>
                {importSubmitting ? "Importing..." : "✓ Confirm & Import"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm({ ...deleteConfirm, show: false })} centered>
        <Modal.Body style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <FaTrash style={{ color: '#ef4444', fontSize: '24px' }} />
            </div>
          </div>
          <h4 style={{ fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>Confirm Deletion</h4>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px' }}>
            {deleteConfirm.message}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteConfirm({ ...deleteConfirm, show: false })}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              Cancel
            </button>
            <button
              onClick={executeDelete}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Delete Item
            </button>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
};
export default ItemListPage;