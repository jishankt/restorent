import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSave, FaSearch, FaImage, FaPlus, FaMinus, FaEdit, FaTrash, FaUtensils } from 'react-icons/fa';

/**
 * Standardized Combo Modal for Item Creation
 * Handles branch-scoped pricing, availability, and item variants.
 */
const ComboModal = ({
  isOpen,
  onClose,
  onSave,
  comboData,
  isCompanyAdmin,
  isGroupAdmin,
  availableBranches,
  userBranch,
  itemGroups,
  kitchens,
  customVariants,
  baseUrl,
  allItems = [],
  handleEditImage,
  setCropTarget,
  setCropModalOpen,
  setCurrentImageToCrop,
  setOriginalFile,
  setShowNewItemGroupModal,
  setShowNewKitchenModal,
  navigate
}) => {
  const [comboType, setComboType] = useState('existing'); // 'existing' or 'new'
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [data, setData] = useState({
    selectedId: '',
    name1: '',
    newName: '',
    combo_price: 0,
    tax_applicable: false,
    tax_rate: 0,
    combo_image: '',
    imagePreview: '',
    kitchen: '',
    item_group: '',
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
    ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
  });

  const [selectedVariant, setSelectedVariant] = useState('');

  useEffect(() => {
    if (comboData) {
      setData({
        ...data,
        ...comboData,
        branch_names: comboData.branch_names || [],
        branch_prices: comboData.branch_prices || {},
        variants: comboData.variants || data.variants
      });
      setComboType(comboData.selectedId ? 'existing' : 'new');
      if (comboData.selectedId) {
        const item = allItems.find(i => i._id === comboData.selectedId);
        if (item) setSearchTerm(item.item_name);
      }
    } else {
      setData({
        selectedId: '',
        name1: '',
        newName: '',
        combo_price: 0,
        tax_applicable: false,
        tax_rate: 0,
        combo_image: '',
        imagePreview: '',
        kitchen: '',
        item_group: '',
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
        branch_names: (!isGroupAdmin && userBranch) ? [userBranch] : [],
        branch_prices: {},
        ingredients: [{ ingredients_name: "", small: 0, medium: 0, large: 0, weight: 0, nutrition: [] }],
      });
      setComboType('existing');
      setSearchTerm('');
    }
  }, [comboData, isOpen, isCompanyAdmin, userBranch, allItems]);

  const filteredOptions = useMemo(() => {
    return allItems
      .filter(item => (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .map(item => ({ label: item.item_name, value: item._id }));
  }, [allItems, searchTerm]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);
    
    if (val === "create_new") {
      if (name === "kitchen") setShowNewKitchenModal(true);
      if (name === "item_group") setShowNewItemGroupModal(true);
      return;
    }

    if (name.includes('.')) {
      const parts = name.split('.');
      setData(prev => {
        const newData = JSON.parse(JSON.stringify(prev)); 
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = val;
        return newData;
      });
    } else {
      setData(prev => ({
        ...prev,
        [name]: val
      }));
    }
  };

  const toggleBranch = (branch) => {
    setData(prev => {
      const branches = prev.branch_names || [];
      if (branches.includes(branch)) {
        const newBranches = branches.filter(b => b !== branch);
        const newPrices = { ...prev.branch_prices };
        delete newPrices[branch];
        return { ...prev, branch_names: newBranches, branch_prices: newPrices };
      } else {
        return { ...prev, branch_names: [...branches, branch] };
      }
    });
  };

  const handleBranchPriceChange = (branch, price) => {
    setData(prev => ({
      ...prev,
      branch_prices: {
        ...prev.branch_prices,
        [branch]: price === '' ? undefined : Number(price)
      }
    }));
  };

  const handleImageUpload = (e, variant = null, subField = null) => {
    const file = e.target.files[0];
    if (!file) return;
    setOriginalFile(file);
    const localUrl = URL.createObjectURL(file);
    setCurrentImageToCrop(localUrl);
    setCropTarget({ field: 'combo_image', subField, variantId: variant, isModal: true });
    setCropModalOpen(true);
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...data };
    if (comboType === 'new') {
      finalData.name1 = data.newName;
      finalData.selectedId = '';
    } else {
      const selectedItem = allItems.find(i => i._id === data.selectedId);
      finalData.name1 = selectedItem ? selectedItem.item_name : data.name1;
    }
    
    if (!finalData.name1?.trim()) return alert("Combo name is required");
    onSave(finalData);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '95%', maxWidth: '600px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>{comboData ? 'Edit Combo' : 'Add New Combo'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#95a5a6' }}>
            <FaTimes />
          </button>
        </div>

        {/* --- Image Preview Section (Mela) --- */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8fafc', 
          borderRadius: '10px', 
          border: '1px dashed #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {data.imagePreview || data.combo_image ? (
              <img 
                src={data.imagePreview || (data.combo_image?.startsWith('data:') ? data.combo_image : `${baseUrl}/api/images/${data.combo_image}`)} 
                alt="Combo Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <FaImage style={{ fontSize: '3rem', color: '#cbd5e1' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label className="btn-primary" style={{ 
              backgroundColor: '#3498db', color: '#fff', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' 
            }}>
              <FaImage /> {data.combo_image ? 'Change' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            {(data.imagePreview || data.combo_image) && (
              <>
                <button type="button" onClick={() => handleEditImage(data.imagePreview || data.combo_image, 'combo_image', null, null, null, true)} style={{ padding: '6px 15px', fontSize: '0.85rem', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                <button type="button" onClick={() => setData({ ...data, combo_image: '', imagePreview: '' })} style={{ padding: '6px 15px', fontSize: '0.85rem', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Recommended size: 768x768px</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Combo Type</label>
            <select 
              value={comboType} 
              onChange={(e) => setComboType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="existing">Select Existing Item</option>
              <option value="new">Create New Combo</option>
            </select>
          </div>

          {comboType === 'existing' ? (
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Search Item *</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Type to search..."
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                <button type="button" style={{ padding: '10px', borderRadius: '6px', border: 'none', background: '#3498db', color: '#fff' }}>
                  <FaSearch />
                </button>
              </div>
              {isDropdownOpen && filteredOptions.length > 0 && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff',
                  border: '1px solid #ddd', borderRadius: '0 0 6px 6px', maxHeight: '150px', overflowY: 'auto',
                  zIndex: 3001, listStyle: 'none', padding: 0, margin: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {filteredOptions.map(opt => (
                    <li key={opt.value} onClick={() => {
                      setData({ ...data, selectedId: opt.value, name1: opt.label });
                      setSearchTerm(opt.label);
                      setIsDropdownOpen(false);
                    }} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>New Combo Name *</label>
              <input 
                type="text" 
                name="newName" 
                value={data.newName} 
                onChange={handleChange} 
                placeholder="e.g. Burger + Drink"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                required 
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Price (Default) *</label>
              <input 
                type="number" 
                name="combo_price" 
                value={data.combo_price} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Kitchen</label>
              <select 
                name="kitchen" 
                value={data.kitchen} 
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="">Select Kitchen</option>
                <option value="create_new" style={{ fontWeight: 'bold', color: '#3498db' }}>+ Create New</option>
                {kitchens.map(k => <option key={k._id} value={k.kitchen_name}>{k.kitchen_name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Item Group</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                name="item_group" 
                value={data.item_group} 
                onChange={handleChange}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="">Select Group</option>
                <option value="create_new" style={{ fontWeight: 'bold', color: '#2ecc71' }}>+ Create New</option>
                {itemGroups.map(g => <option key={g._id} value={g.group_name}>{g.group_name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewItemGroupModal(true)} style={{
                padding: '5px 15px', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#fff', fontSize: '0.8rem'
              }}>+ New</button>
            </div>
          </div>

          {/* Variants Section */}
          <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#34495e' }}>Variants</label>
            <select 
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px' }}
            >
              <option value="">Select Variant Type</option>
              <option value="size">Size</option>
              <option value="cold">Cold</option>
              <option value="spicy">Spicy</option>
              <option value="sugar">Sugar</option>
            </select>

            {selectedVariant === 'size' && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input type="checkbox" name="variants.size.enabled" checked={data.variants.size.enabled} onChange={handleChange} />
                  Enable Size Variant
                </label>
                {data.variants.size.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Small Px</label>
                      <input type="number" name="variants.size.small_price" value={data.variants.size.small_price} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Medium Px</label>
                      <input type="number" name="variants.size.medium_price" value={data.variants.size.medium_price} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Large Px</label>
                      <input type="number" name="variants.size.large_price" value={data.variants.size.large_price} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {selectedVariant === 'cold' && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input type="checkbox" name="variants.cold.enabled" checked={data.variants.cold.enabled} onChange={handleChange} />
                  Enable Cold Variant
                </label>
                {data.variants.cold.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Ice Preference</label>
                      <select name="variants.cold.ice_preference" value={data.variants.cold.ice_preference} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                        <option value="without_ice">Without Ice</option>
                        <option value="with_ice">With Ice</option>
                      </select>
                    </div>
                    {data.variants.cold.ice_preference === 'with_ice' && (
                      <div>
                        <label style={{ fontSize: '0.8rem' }}>Ice Price (₹)</label>
                        <input type="number" name="variants.cold.ice_price" value={data.variants.cold.ice_price} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedVariant === 'sugar' && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input type="checkbox" name="variants.sugar.enabled" checked={data.variants.sugar.enabled} onChange={handleChange} />
                  Enable Sugar Variant
                </label>
                {data.variants.sugar.enabled && (
                  <div>
                    <label style={{ fontSize: '0.8rem' }}>Sugar Level</label>
                    <select name="variants.sugar.level" value={data.variants.sugar.level} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="less">Less Sugar</option>
                      <option value="medium">Medium Sugar</option>
                      <option value="extra">Extra Sugar</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Branch Assignment - Visible for Group/Company Admins */}
          {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && availableBranches.length > 0 && (
            <div style={{ marginBottom: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Branch Assignment & Overrides</label>
              <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'grid', gap: '10px' }}>
                {availableBranches.map(branch => (
                  <div key={branch} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <input type="checkbox" checked={data.branch_names.includes(branch)} onChange={() => toggleBranch(branch)} />
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{branch}</span>
                    {data.branch_names.includes(branch) && (
                      <input 
                        type="number" 
                        placeholder="Override" 
                        value={data.branch_prices[branch] || ''} 
                        onChange={(e) => handleBranchPriceChange(branch, e.target.value)}
                        style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', cursor: 'pointer'
            }}>Cancel</button>
            <button type="button" onClick={() => navigate("/add-ingredients-nutrition", { state: { formData: data, isEditing: !!comboData, type: "combo" } })} style={{
              padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#e67e22', color: '#fff', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FaUtensils /> Ingredients
            </button>
            <button type="submit" style={{
              padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2ecc71', color: '#fff', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FaSave /> Save Combo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComboModal;
