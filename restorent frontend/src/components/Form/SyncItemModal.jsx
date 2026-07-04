import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSearch, FaSync, FaImage, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import CurrencySymbol, { resolveCurrencyCode } from '../CurrencySymbol';

const SyncItemModal = ({
  isOpen,
  onClose,
  onSync,
  baseUrl,
  getHeaders,
  activeCompany,
  activeBranch,
  existingItems = [],
  currency = 'INR',
  getCurrencySymbol
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');

  // Detail view state
  const [selectedItem, setSelectedItem] = useState(null);

  // Main Item Overrides
  const [syncData, setSyncData] = useState({
    price_list_rate: 0,
    kitchen_name: '',
    item_group: ''
  });

  // Variants Overrides (Main Item)
  const [itemVariantsData, setItemVariantsData] = useState({
    size: { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
    cold: { enabled: false, ice_preference: 'without_ice', ice_price: 0 },
    spicy: { enabled: false, spicy_price: 0, non_spicy_price: 0 },
    sugar: { enabled: false, level: 'medium' },
    custom_variants: []
  });

  // Addons and Combos Overrides
  const [addonsData, setAddonsData] = useState([]);
  const [combosData, setCombosData] = useState([]);

  const [kitchens, setKitchens] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchSyncableItems();
      fetchDropdowns();
      setSelectedItem(null);
      setSearchTerm('');
    }
  }, [isOpen, activeCompany, activeBranch]);

  const fetchDropdowns = async () => {
    try {
      const kRes = await axios.get(`${baseUrl}/api/kitchens`, { headers: getHeaders(), timeout: 5000 });
      setKitchens(kRes.data || []);
      const igRes = await axios.get(`${baseUrl}/api/item-groups`, { headers: getHeaders(), timeout: 5000 });
      setItemGroups(igRes.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  const fetchSyncableItems = async () => {
    setLoading(true);
    try {
      // Backend handles: (1) role-based company isolation, (2) excluding current-branch items
      // We just pass the normal headers (which include the current X-Company-Name and X-Branch-Name)
      // and add the special X-Fetch-Sync-Catalog flag.
      const headers = {
        ...getHeaders(),
        'X-Fetch-Sync-Catalog': 'true'
      };
      const response = await axios.get(`${baseUrl}/api/items`, { headers, timeout: 10000 });

      const allFetchedItems = response.data || [];

      // Only deduplicate by item name (backend handles all other filtering)
      const existingItemNames = new Set(existingItems.map(item => (item.item_name || '').trim().toLowerCase()));

      const filtered = allFetchedItems.filter(item => {
        // Allow deleted (is_hidden) items to show in sync list so they can be re-synced!
        // Skip if the same item name already exists in this branch
        const itemNameNorm = (item.item_name || '').trim().toLowerCase();
        if (existingItemNames.has(itemNameNorm)) return false;
        return true;
      });

      // Deduplicate by _id
      const uniqueMap = new Map();
      filtered.forEach(it => { if (!uniqueMap.has(it._id)) uniqueMap.set(it._id, it); });

      setAvailableItems(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching syncable items:", error);
    } finally {
      setLoading(false);
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:")) return imagePath;

    let cleanPath = (imagePath || "").toString().trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
    const fileName = cleanPath.split("/").pop();

    if (cleanPath.startsWith("api/")) return `${baseUrl}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
    if (cleanPath.includes("addon-images") || cleanPath.includes("addon_images")) return `${baseUrl}/api/images/${fileName}`;
    if (cleanPath.includes("combo-images") || cleanPath.includes("combo_images")) return `${baseUrl}/api/combo-images/${fileName}`;

    return `${baseUrl}/api/images/${fileName}`;
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);

    setSyncData({
      price_list_rate: item.price_list_rate || 0,
      kitchen_name: item.kitchen_name || item.kitchen || '',
      item_group: item.item_group || ''
    });

    setItemVariantsData({
      size: item.size ? { ...item.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
      cold: item.cold ? { ...item.cold } : { enabled: false, ice_preference: 'without_ice', ice_price: 0 },
      spicy: item.spicy ? { ...item.spicy } : { enabled: false, spicy_price: 0, non_spicy_price: 0 },
      sugar: item.sugar ? { ...item.sugar } : { enabled: false, level: 'medium' },
      custom_variants: (Array.isArray(item.custom_variants) ? item.custom_variants : []).map(v => ({ ...v, subheadings: (Array.isArray(v.subheadings) ? v.subheadings : []).map(s => ({ ...s })) }))
    });

    setAddonsData((item.addons || []).map(addon => ({
      selected: true,
      price: addon.addon_price || addon.price || 0,
      kitchen_name: addon.kitchen_name || addon.kitchen || '',
      item_group: addon.item_group || '',
      size: addon.size ? { ...addon.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
      cold: addon.cold ? { ...addon.cold } : { enabled: false, ice_preference: 'without_ice', ice_price: 0 },
      spicy: addon.spicy ? { ...addon.spicy } : { enabled: false, spicy_price: 0, non_spicy_price: 0 },
      sugar: addon.sugar ? { ...addon.sugar } : { enabled: false, level: 'medium' },
      custom_variants: (Array.isArray(addon.custom_variants) ? addon.custom_variants : []).map(v => ({ ...v, subheadings: (Array.isArray(v.subheadings) ? v.subheadings : []).map(s => ({ ...s })) }))
    })));

    setCombosData((item.combos || []).map(combo => ({
      selected: true,
      price: combo.combo_price || combo.price || 0,
      kitchen_name: combo.kitchen_name || combo.kitchen || '',
      item_group: combo.item_group || '',
      size: combo.size ? { ...combo.size } : { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
      cold: combo.cold ? { ...combo.cold } : { enabled: false, ice_preference: 'without_ice', ice_price: 0 },
      spicy: combo.spicy ? { ...combo.spicy } : { enabled: false, spicy_price: 0, non_spicy_price: 0 },
      sugar: combo.sugar ? { ...combo.sugar } : { enabled: false, level: 'medium' },
      custom_variants: (Array.isArray(combo.custom_variants) ? combo.custom_variants : []).map(v => ({ ...v, subheadings: (Array.isArray(v.subheadings) ? v.subheadings : []).map(s => ({ ...s })) }))
    })));
  };

  const handleUpdateAddon = (index, field, value) => {
    setAddonsData(prev => {
      const newAddons = [...prev];
      if (!newAddons[index]) {
        newAddons[index] = { selected: false, price: 0, kitchen_name: '', item_group: '' };
      }
      newAddons[index] = { ...newAddons[index], [field]: value };
      return newAddons;
    });
  };

  const handleUpdateCombo = (index, field, value) => {
    setCombosData(prev => {
      const newCombos = [...prev];
      if (!newCombos[index]) {
        newCombos[index] = { selected: false, price: 0, kitchen_name: '', item_group: '' };
      }
      newCombos[index] = { ...newCombos[index], [field]: value };
      return newCombos;
    });
  };

  const handleUpdateItemVariant = (variantGroup, field, value) => {
    setItemVariantsData(prev => ({
      ...prev,
      [variantGroup]: { ...prev[variantGroup], [field]: value }
    }));
  };

  const handleUpdateItemCustomVariant = (cvIndex, field, value, subIdx = null) => {
    setItemVariantsData(prev => {
      const newCv = [...prev.custom_variants];
      if (subIdx !== null) {
        newCv[cvIndex].subheadings[subIdx][field] = value;
      } else {
        newCv[cvIndex][field] = value;
      }
      return { ...prev, custom_variants: newCv };
    });
  };

  const handleUpdateAddonVariant = (index, variantGroup, field, value) => {
    setAddonsData(prev => {
      const newArr = [...prev];
      newArr[index][variantGroup][field] = value;
      return newArr;
    });
  };

  const handleUpdateAddonCustomVariant = (index, cvIndex, field, value, subIdx = null) => {
    setAddonsData(prev => {
      const newArr = [...prev];
      if (subIdx !== null) {
        newArr[index].custom_variants[cvIndex].subheadings[subIdx][field] = value;
      } else {
        newArr[index].custom_variants[cvIndex][field] = value;
      }
      return newArr;
    });
  };

  const handleUpdateComboVariant = (index, variantGroup, field, value) => {
    setCombosData(prev => {
      const newArr = [...prev];
      newArr[index][variantGroup][field] = value;
      return newArr;
    });
  };

  const handleUpdateComboCustomVariant = (index, cvIndex, field, value, subIdx = null) => {
    setCombosData(prev => {
      const newArr = [...prev];
      if (subIdx !== null) {
        newArr[index].custom_variants[cvIndex].subheadings[subIdx][field] = value;
      } else {
        newArr[index].custom_variants[cvIndex][field] = value;
      }
      return newArr;
    });
  };

  const handleSyncSubmit = async () => {
    if (!selectedItem) return;
    setSyncing(true);

    const existingGroups = new Set(itemGroups.map(g => (g.group_name || '').toLowerCase().trim()));
    const existingKitchens = new Set(kitchens.map(k => (k.kitchen_name || '').toLowerCase().trim()));

    const createGroupIfNeeded = async (groupName) => {
      if (!groupName) return;
      const normalized = groupName.toLowerCase().trim();
      if (!existingGroups.has(normalized)) {
        try {
          await axios.post(`${baseUrl}/api/item-groups`, {
            group_name: groupName,
            company_name: activeCompany === 'All Companies' || activeCompany === 'All' ? '' : activeCompany,
            branch_name: activeBranch === 'All Branches' || activeBranch === 'All' ? '' : activeBranch
          }, { headers: getHeaders() });
          existingGroups.add(normalized);
        } catch (e) { console.error("Auto-create group failed", e); }
      }
    };

    const createKitchenIfNeeded = async (kitchenName) => {
      if (!kitchenName) return;
      const normalized = kitchenName.toLowerCase().trim();
      if (!existingKitchens.has(normalized)) {
        try {
          await axios.post(`${baseUrl}/api/kitchens`, {
            kitchen_name: kitchenName,
            company_name: activeCompany === 'All Companies' || activeCompany === 'All' ? '' : activeCompany,
            branch_name: activeBranch === 'All Branches' || activeBranch === 'All' ? '' : activeBranch
          }, { headers: getHeaders() });
          existingKitchens.add(normalized);
        } catch (e) { console.error("Auto-create kitchen failed", e); }
      }
    };

    // Ensure primary item-level group and kitchen exist
    await createGroupIfNeeded(syncData.item_group);
    await createKitchenIfNeeded(syncData.kitchen_name);

    const actCompName = activeCompany === 'All Companies' || activeCompany === 'All' ? '' : activeCompany;
    const actBranchName = activeBranch === 'All Branches' || activeBranch === 'All' ? '' : activeBranch;

    const finalAddons = [];
    if (selectedItem.addons) {
      for (let i = 0; i < selectedItem.addons.length; i++) {
        if (!addonsData[i]?.selected) continue;
        await createGroupIfNeeded(addonsData[i].item_group);
        await createKitchenIfNeeded(addonsData[i].kitchen_name);

        finalAddons.push({
          ...selectedItem.addons[i],
          addon_price: Number(addonsData[i].price),
          kitchen: addonsData[i].kitchen_name,
          kitchen_name: addonsData[i].kitchen_name,
          item_group: addonsData[i].item_group,
          size: addonsData[i].size,
          cold: addonsData[i].cold,
          spicy: addonsData[i].spicy,
          sugar: addonsData[i].sugar,
          custom_variants: addonsData[i].custom_variants,
          company_name: actCompName,
          branch_name: actBranchName,
          company_names: actCompName ? [actCompName] : [],
          branch_names: actBranchName ? [actBranchName] : [],
          company: actCompName,
          companies: actCompName ? [actCompName] : [],
          branch: actBranchName,
          branches: actBranchName ? [actBranchName] : [],
          suppliers: "",
          company_prices: {},
          branch_prices: {}
        });
      }
    }

    const finalCombos = [];
    if (selectedItem.combos) {
      for (let i = 0; i < selectedItem.combos.length; i++) {
        if (!combosData[i]?.selected) continue;
        await createGroupIfNeeded(combosData[i].item_group);
        await createKitchenIfNeeded(combosData[i].kitchen_name);

        finalCombos.push({
          ...selectedItem.combos[i],
          combo_price: Number(combosData[i].price),
          kitchen: combosData[i].kitchen_name,
          kitchen_name: combosData[i].kitchen_name,
          item_group: combosData[i].item_group,
          size: combosData[i].size,
          cold: combosData[i].cold,
          spicy: combosData[i].spicy,
          sugar: combosData[i].sugar,
          custom_variants: combosData[i].custom_variants,
          company_name: actCompName,
          branch_name: actBranchName,
          company_names: actCompName ? [actCompName] : [],
          branch_names: actBranchName ? [actBranchName] : [],
          company: actCompName,
          companies: actCompName ? [actCompName] : [],
          branch: actBranchName,
          branches: actBranchName ? [actBranchName] : [],
          suppliers: "",
          company_prices: {},
          branch_prices: {}
        });
      }
    }

    const newItemData = {
      ...selectedItem,
      price_list_rate: Number(syncData.price_list_rate),
      kitchen_name: syncData.kitchen_name,
      item_group: syncData.item_group,
      size: itemVariantsData.size,
      cold: itemVariantsData.cold,
      spicy: itemVariantsData.spicy,
      sugar: itemVariantsData.sugar,
      custom_variants: itemVariantsData.custom_variants,
      addons: finalAddons,
      combos: finalCombos,
      custom_addon_applicable: finalAddons.length > 0 || selectedItem.custom_addon_applicable,
      custom_combo_applicable: finalCombos.length > 0 || selectedItem.custom_combo_applicable,
      has_variant_pricing: (itemVariantsData.custom_variants && itemVariantsData.custom_variants.length > 0) || selectedItem.has_variant_pricing,
      company_name: actCompName,
      branch_name: actBranchName,
      company_names: actCompName ? [actCompName] : [],
      branch_names: actBranchName ? [actBranchName] : [],
      company: actCompName,
      companies: actCompName ? [actCompName] : [],
      branch: actBranchName,
      branches: actBranchName ? [actBranchName] : [],
      suppliers: "", // Prevent supplier-based elevation leaks
      company_prices: {},
      branch_prices: {}
    };

    delete newItemData._id; // Ensure new item creation

    try {
      const response = await axios.post(`${baseUrl}/api/items`, newItemData, { headers: getHeaders(), timeout: 10000 });
      if (response.status === 201 || response.status === 200) {
        try {
           const updatePayload = {
               branch_prices: { ...(selectedItem.branch_prices || {}) },
               company_prices: { ...(selectedItem.company_prices || {}) }
           };
           if (actBranchName) {
               updatePayload.branch_prices[actBranchName] = Number(syncData.price_list_rate);
           }
           if (actCompName && !actBranchName) {
               updatePayload.company_prices[actCompName] = Number(syncData.price_list_rate);
           }
           
           const globalHeaders = getHeaders();
           delete globalHeaders['X-Branch-Name'];
           delete globalHeaders['X-Branch-Id'];

           await axios.put(`${baseUrl}/api/items/${selectedItem._id}`, updatePayload, { headers: globalHeaders });
        } catch (e) {
           console.error("Failed to update global item reference:", e);
        }

        onSync(response.data);
        onClose();
      }
    } catch (err) {
      console.error("Error syncing item:", err);
      alert("Failed to sync item. " + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const uniqueGroups = useMemo(() => {
    const groups = new Set(availableItems.map(item => item.item_group).filter(Boolean));
    return ['All', ...Array.from(groups).sort()];
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchesSearch = (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroupFilter === 'All' || item.item_group === selectedGroupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [availableItems, searchTerm, selectedGroupFilter]);

  // Determine button target name
  let syncTargetName = "Current Scope";
  if (activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All' && activeBranch !== 'any') {
    syncTargetName = activeBranch;
  } else if (activeCompany && activeCompany !== 'All Companies' && activeCompany !== 'All' && activeCompany !== 'any') {
    syncTargetName = activeCompany;
  } else {
    syncTargetName = "Global System";
  }

  if (!isOpen) return null;

  // PREMIUM UI STYLES
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s', fontSize: '0.9rem', color: '#334155', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };

  const renderVariants = (variantsData, onUpdateVariant, onUpdateCustomVariant) => {
    const hasSize = variantsData?.size && (variantsData.size.enabled || variantsData.size.small_price > 0 || variantsData.size.medium_price > 0 || variantsData.size.large_price > 0);
    const hasCold = variantsData?.cold && (variantsData.cold.enabled || variantsData.cold.ice_price > 0);
    const hasSpicy = variantsData?.spicy && (variantsData.spicy.enabled || variantsData.spicy.spicy_price > 0 || variantsData.spicy.non_spicy_price > 0);
    const hasSugar = variantsData?.sugar && (variantsData.sugar.enabled || variantsData.sugar.level);
    const hasCustom = variantsData?.custom_variants?.length > 0;

    if (!hasSize && !hasCold && !hasSpicy && !hasSugar && !hasCustom) return null;

    return (
      <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', transition: 'all 0.2s' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.95rem', fontWeight: '600' }}>Variants Included</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Size Variant */}
          {hasSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.size.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.size.enabled} onChange={(e) => onUpdateVariant('size', 'enabled', e.target.checked)} /> Size
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Small:</span>
                  <input type="number" placeholder="Price" value={variantsData.size.small_price || ''} onChange={(e) => onUpdateVariant('size', 'small_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Medium:</span>
                  <input type="number" placeholder="Price" value={variantsData.size.medium_price || ''} onChange={(e) => onUpdateVariant('size', 'medium_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Large:</span>
                  <input type="number" placeholder="Price" value={variantsData.size.large_price || ''} onChange={(e) => onUpdateVariant('size', 'large_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                </div>
              </div>
            </div>
          )}

          {/* Cold Variant */}
          {hasCold && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.cold.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.cold.enabled} onChange={(e) => onUpdateVariant('cold', 'enabled', e.target.checked)} /> Cold
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ice Price:</span>
                <input type="number" placeholder="Price" value={variantsData.cold.ice_price || ''} onChange={(e) => onUpdateVariant('cold', 'ice_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
              </div>
            </div>
          )}

          {/* Spicy Variant */}
          {hasSpicy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.spicy.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.spicy.enabled} onChange={(e) => onUpdateVariant('spicy', 'enabled', e.target.checked)} /> Spicy
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Spicy:</span>
                  <input type="number" placeholder="Price" value={variantsData.spicy.spicy_price || ''} onChange={(e) => onUpdateVariant('spicy', 'spicy_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Non-Spicy:</span>
                  <input type="number" placeholder="Price" value={variantsData.spicy.non_spicy_price || ''} onChange={(e) => onUpdateVariant('spicy', 'non_spicy_price', e.target.value)} onFocus={(e) => e.target.select()} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                </div>
              </div>
            </div>
          )}

          {/* Sugar Variant */}
          {hasSugar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', opacity: variantsData.sugar.enabled ? 1 : 0.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', width: '80px', cursor: 'pointer' }}>
                <input type="checkbox" checked={variantsData.sugar.enabled} onChange={(e) => onUpdateVariant('sugar', 'enabled', e.target.checked)} /> Sugar
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Level:</span>
                <select value={variantsData.sugar.level || 'medium'} onChange={(e) => onUpdateVariant('sugar', 'level', e.target.value)} style={{ ...inputStyle, width: '130px', padding: '6px', fontSize: '0.85rem' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="without_sugar">Without Sugar</option>
                </select>
              </div>
            </div>
          )}

          {/* Custom Variants */}
          {variantsData.custom_variants?.map((cv, cvIdx) => (
            <div key={cv._id || cvIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', opacity: cv.enabled ? 1 : 0.6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.9rem', color: '#0f172a', cursor: 'pointer' }}>
                <input type="checkbox" checked={cv.enabled} onChange={(e) => onUpdateCustomVariant(cvIdx, 'enabled', e.target.checked)} /> {cv.heading}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '5px', pointerEvents: cv.enabled ? 'auto' : 'none' }}>
                {cv.subheadings?.map((sub, subIdx) => (
                  <div key={subIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }} title={sub.name}>{sub.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                      <span style={{ padding: '4px 6px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #cbd5e1' }}>
                        <CurrencySymbol currencyCode={resolveCurrencyCode(null, activeCompany, activeBranch)} size={10} />
                      </span>
                      <input type="number" value={sub.price === null ? '' : sub.price} onChange={(e) => onUpdateCustomVariant(cvIdx, 'price', e.target.value, subIdx)} onFocus={(e) => e.target.select()} style={{ width: '60px', padding: '4px 6px', border: 'none', outline: 'none', fontSize: '0.8rem' }} />
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
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      {/* Explicitly using large width and minWidth to force a wide popup */}
      <div className="custom-sync-modal" style={{
        backgroundColor: '#ffffff', borderRadius: '16px',
        width: '1100px', maxWidth: '95vw', minWidth: '800px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: '700' }}>
            <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0ea5e9', display: 'flex' }}><FaSync size={18} /></div>
            {selectedItem ? 'Customize & Sync Item' : 'Sync Catalog Items'}
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        {/* Added custom scrollbar styling for the body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: '#fcfcfd' }}>
          <style>{`
            .sync-scroll::-webkit-scrollbar { width: 8px; }
            .sync-scroll::-webkit-scrollbar-track { background: transparent; }
            .sync-scroll::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
            .sync-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
          <div className="sync-scroll" style={{ height: '100%' }}>

            {!selectedItem ? (
              // LIST VIEW
              <>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaSearch style={{ position: 'absolute', top: '14px', left: '16px', color: '#94a3b8', fontSize: '1.2rem' }} />
                    <input
                      type="text"
                      placeholder="Search available items across network..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.05rem', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                      onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                    />
                  </div>
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    style={{ padding: '0 15px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1.05rem', backgroundColor: '#fff', outline: 'none', minWidth: '200px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                  >
                    {uniqueGroups.map(group => (
                      <option key={group} value={group}>{group === 'All' ? 'All Item Groups' : group}</option>
                    ))}
                  </select>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>Fetching authorized items...</div>
                ) : filteredItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px', color: '#e2e8f0' }}><FaSearch /></div>
                    No new items available to sync.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredItems.map(item => (
                      <div
                        key={item._id}
                        onClick={() => handleSelectItem(item)}
                        style={{
                          backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                          cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', gap: '16px', alignItems: 'center',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)'; e.currentTarget.style.borderColor = '#bae6fd'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.03)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        <div style={{ width: '60px', height: '60px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                          {getImageUrl(item.image) ? (
                            <img src={getImageUrl(item.image)} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <FaImage color="#cbd5e1" size={26} />
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.item_name}</h4>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '12px', fontWeight: '500' }}>{item.company_name || 'Global'}</span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '12px', fontWeight: '500' }}>{item.branch_name || 'Global'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // DETAIL/CUSTOMIZE VIEW
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                {/* Main Item Card */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '35px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '140px', height: '140px', borderRadius: '12px', backgroundColor: '#f8fafc', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    {getImageUrl(selectedItem.image) ? (
                      <img src={getImageUrl(selectedItem.image)} alt={selectedItem.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage color="#cbd5e1" size={45} /></div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.8rem', fontWeight: '800' }}>{selectedItem.item_name}</h2>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>Source: {selectedItem.company_name || 'Global'}</span>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #bae6fd' }}>{selectedItem.branch_name || 'Global'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                      <div>
                        <label style={labelStyle}>Override Price</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                          <span style={{ padding: '10px 14px', backgroundColor: '#e2e8f0', color: '#475569', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>
                            <CurrencySymbol currencyCode={resolveCurrencyCode(null, activeCompany, activeBranch)} size={14} />
                          </span>
                          <input type="number" value={syncData.price_list_rate} onChange={(e) => setSyncData({ ...syncData, price_list_rate: e.target.value })} onFocus={(e) => e.target.select()} style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '500' }} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Override Group</label>
                        <select value={syncData.item_group} onChange={(e) => setSyncData({ ...syncData, item_group: e.target.value })} style={inputStyle}>
                          <option value="">{selectedItem.item_group || 'No Group'}</option>
                          {itemGroups.map(ig => <option key={ig._id} value={ig.group_name}>{ig.group_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Override Kitchen</label>
                        <select value={syncData.kitchen_name} onChange={(e) => setSyncData({ ...syncData, kitchen_name: e.target.value })} style={inputStyle}>
                          <option value="">{selectedItem.kitchen_name || selectedItem.kitchen || 'No Kitchen'}</option>
                          {kitchens.map(k => <option key={k._id} value={k.kitchen_name}>{k.kitchen_name}</option>)}
                        </select>
                      </div>
                    </div>
                    {renderVariants(itemVariantsData, handleUpdateItemVariant, handleUpdateItemCustomVariant)}
                  </div>
                </div>

                {/* Addons Overrides */}
                {selectedItem.addons && selectedItem.addons.length > 0 && (
                  <div style={{ marginBottom: '35px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                      <div style={{ width: '5px', height: '22px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                      Addons Included
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {selectedItem.addons.map((addon, idx) => {
                        const isSelected = addonsData[idx]?.selected;
                        return (
                          <div key={idx} style={{
                            display: 'flex', flexDirection: 'column', gap: '15px', padding: '18px 20px', borderRadius: '12px',
                            backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                            border: `1px solid ${isSelected ? '#6ee7b7' : '#e2e8f0'}`,
                            boxShadow: isSelected ? '0 4px 10px rgba(16, 185, 129, 0.05)' : 'none',
                            transition: 'all 0.2s', opacity: isSelected ? 1 : 0.6
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', width: '100%' }}>
                              {/* Toggle & Image */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '0 0 auto', minWidth: '250px', maxWidth: '300px' }}>
                                <div onClick={() => handleUpdateAddon(idx, 'selected', !isSelected)} style={{ cursor: 'pointer', flexShrink: 0, width: '26px', height: '26px', borderRadius: '6px', border: `2px solid ${isSelected ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#10b981' : 'transparent', transition: 'all 0.2s' }}>
                                  {isSelected && <FaCheckCircle color="#fff" size={16} />}
                                </div>
                                <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                  {getImageUrl(addon.addon_image || addon.image) ? <img src={getImageUrl(addon.addon_image || addon.image)} alt="Addon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage color="#cbd5e1" size={24} /></div>}
                                </div>
                                <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.2' }}>{addon.name1 || addon.item_name}</span>
                              </div>

                              {/* Inputs */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', flex: '1 1 auto', pointerEvents: isSelected ? 'auto' : 'none' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                    <span style={{ padding: '9px 12px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.9rem', borderRight: '1px solid #cbd5e1' }}>
                                      <CurrencySymbol currencyCode={resolveCurrencyCode(null, activeCompany, activeBranch)} size={12} />
                                    </span>
                                    <input type="number" value={addonsData[idx]?.price || ''} onChange={(e) => handleUpdateAddon(idx, 'price', e.target.value)} onFocus={(e) => e.target.select()} style={{ flex: 1, padding: '9px', border: 'none', outline: 'none', fontSize: '0.95rem' }} placeholder="Price" />
                                  </div>
                                </div>
                                <select value={addonsData[idx]?.item_group || ''} onChange={(e) => handleUpdateAddon(idx, 'item_group', e.target.value)} style={{ ...inputStyle, padding: '10px' }}>
                                  <option value="">{addon.item_group || 'No Group'}</option>
                                  {itemGroups.map(ig => <option key={ig._id} value={ig.group_name}>{ig.group_name}</option>)}
                                </select>
                                <select value={addonsData[idx]?.kitchen_name || ''} onChange={(e) => handleUpdateAddon(idx, 'kitchen_name', e.target.value)} style={{ ...inputStyle, padding: '10px' }}>
                                  <option value="">{addon.kitchen_name || addon.kitchen || 'No Kitchen'}</option>
                                  {kitchens.map(k => <option key={k._id} value={k.kitchen_name}>{k.kitchen_name}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Variants rendering for Addon */}
                            {isSelected && addonsData[idx] && renderVariants(addonsData[idx],
                              (field, subField, value) => handleUpdateAddonVariant(idx, field, subField, value),
                              (cvIdx, subField, value, subIdx) => handleUpdateAddonCustomVariant(idx, cvIdx, subField, value, subIdx)
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Combos Overrides */}
                {selectedItem.combos && selectedItem.combos.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                      <div style={{ width: '5px', height: '22px', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
                      Combos Included
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {selectedItem.combos.map((combo, idx) => {
                        const isSelected = combosData[idx]?.selected;
                        return (
                          <div key={idx} style={{
                            display: 'flex', flexDirection: 'column', gap: '15px', padding: '18px 20px', borderRadius: '12px',
                            backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                            border: `1px solid ${isSelected ? '#fcd34d' : '#e2e8f0'}`,
                            boxShadow: isSelected ? '0 4px 10px rgba(245, 158, 11, 0.05)' : 'none',
                            transition: 'all 0.2s', opacity: isSelected ? 1 : 0.6
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', width: '100%' }}>
                              {/* Toggle & Image */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '0 0 auto', minWidth: '250px', maxWidth: '300px' }}>
                                <div onClick={() => handleUpdateCombo(idx, 'selected', !isSelected)} style={{ cursor: 'pointer', flexShrink: 0, width: '26px', height: '26px', borderRadius: '6px', border: `2px solid ${isSelected ? '#f59e0b' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#f59e0b' : 'transparent', transition: 'all 0.2s' }}>
                                  {isSelected && <FaCheckCircle color="#fff" size={16} />}
                                </div>
                                <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                  {getImageUrl(combo.combo_image || combo.image) ? <img src={getImageUrl(combo.combo_image || combo.image)} alt="Combo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage color="#cbd5e1" size={24} /></div>}
                                </div>
                                <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1rem', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.2' }}>{combo.name1 || combo.item_name}</span>
                              </div>

                              {/* Inputs */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', flex: '1 1 auto', pointerEvents: isSelected ? 'auto' : 'none' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                    <span style={{ padding: '9px 12px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.9rem', borderRight: '1px solid #cbd5e1' }}>
                                      <CurrencySymbol currencyCode={resolveCurrencyCode(null, activeCompany, activeBranch)} size={12} />
                                    </span>
                                    <input type="number" value={combosData[idx]?.price || ''} onChange={(e) => handleUpdateCombo(idx, 'price', e.target.value)} onFocus={(e) => e.target.select()} style={{ flex: 1, padding: '9px', border: 'none', outline: 'none', fontSize: '0.95rem' }} placeholder="Price" />
                                  </div>
                                </div>
                                <select value={combosData[idx]?.item_group || ''} onChange={(e) => handleUpdateCombo(idx, 'item_group', e.target.value)} style={{ ...inputStyle, padding: '10px' }}>
                                  <option value="">{combo.item_group || 'No Group'}</option>
                                  {itemGroups.map(ig => <option key={ig._id} value={ig.group_name}>{ig.group_name}</option>)}
                                </select>
                                <select value={combosData[idx]?.kitchen_name || ''} onChange={(e) => handleUpdateCombo(idx, 'kitchen_name', e.target.value)} style={{ ...inputStyle, padding: '10px' }}>
                                  <option value="">{combo.kitchen_name || combo.kitchen || 'No Kitchen'}</option>
                                  {kitchens.map(k => <option key={k._id} value={k.kitchen_name}>{k.kitchen_name}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Variants rendering for Combo */}
                            {isSelected && combosData[idx] && renderVariants(combosData[idx],
                              (field, subField, value) => handleUpdateComboVariant(idx, field, subField, value),
                              (cvIdx, subField, value, subIdx) => handleUpdateComboCustomVariant(idx, cvIdx, subField, value, subIdx)
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px', backgroundColor: '#f8fafc' }}>
          {selectedItem ? (
            <>
              <button onClick={() => setSelectedItem(null)} disabled={syncing} style={{ padding: '12px 28px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => !syncing && (e.target.style.backgroundColor = '#f1f5f9')} onMouseLeave={e => !syncing && (e.target.style.backgroundColor = '#fff')}>
                Back to List
              </button>
              <button onClick={handleSyncSubmit} disabled={syncing} style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#fff', cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.2)' }} onMouseEnter={e => !syncing && (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={e => !syncing && (e.currentTarget.style.transform = 'translateY(0)')}>
                {syncing ? (
                  <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Syncing...</>
                ) : (
                  <><FaSync /> Sync to {syncTargetName}</>
                )}
              </button>
            </>
          ) : (
            <button onClick={onClose} style={{ padding: '12px 28px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.target.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.target.style.backgroundColor = '#fff'}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncItemModal;
