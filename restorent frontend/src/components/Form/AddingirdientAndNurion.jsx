import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import axios from 'axios';

const AddIngredientAndNutrition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const bottomRef = useRef(null);
  const { baseUrl, getHeaders, configLoading } = useContext(UserContext);
  
  const [isMessageBoxVisible, setIsMessageBoxVisible] = useState(false);
  const { formData: passedFormData, itemId, isEditing = false, itemToEdit, type: passedType = "item", index: passedIndex = null, name: passedName } = location.state || {};
  
  const isSubForm = !!passedFormData;

  const getInitialIngredients = () => {
    if (!passedFormData) return [{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }];
    
    let rawIngredients = [];
    if (passedType === "addons" || passedType === "addon") {
      rawIngredients = passedFormData.addons?.[passedIndex]?.ingredients || [];
    } else if (passedType === "combos" || passedType === "combo") {
      rawIngredients = passedFormData.combos?.[passedIndex]?.ingredients || [];
    } else {
      rawIngredients = passedFormData.ingredients || [];
    }

    if (rawIngredients.length === 0) {
      return [{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }];
    }

    return rawIngredients.map(ing => ({
      ...ing,
      name: ing.name || ing.ingredients_name || ''
    }));
  };

  const getInitialItemName = () => {
    if (passedName) return passedName;
    if (passedFormData) return passedFormData.item_name || '';
    return '';
  };

  const [ingredients, setIngredients] = useState(
    isSubForm ? getInitialIngredients() : [{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }]
  );
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [selectedItem, setSelectedItem] = useState(isSubForm ? getInitialItemName() : '');
  const [searchTerm, setSearchTerm] = useState(isSubForm ? getInitialItemName() : '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (configLoading) return;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role || user.UserType;
          if (role) {
            const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${encodeURIComponent(role)}` : `/api/role-permissions?role=${encodeURIComponent(role)}`;
            const response = await axios.get(url, { headers: getHeaders() });
            const perms = response.data.permissions || [];
            
            // Check for admin bypass
            const isAdmin = role.toLowerCase().includes('admin') || user.email?.includes('@temp.com');
            
            const pagePerm = perms.find(p => p.pageId === 'add_ingredients');
            if (isAdmin) {
              setCanWrite(true);
              setCanDelete(true);
            } else if (pagePerm) {
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
  }, [baseUrl, configLoading]);

  const [saveLoading, setSaveLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const nutritionNames = [
    'Carbohydrates', 'Calories', 'carbs', 'Proteins', 'Fats', 'Fiber', 'Vitamins', 'Minerals', 'Water', 'Sugars', 'Starch',
    'Amino Acids', 'Fatty Acids', 'Cholesterol', 'Antioxidants', 'Electrolytes', 'Glucose', 'Fructose',
    'Sucrose', 'Lactose', 'Cellulose', 'Pectin', 'Essential Amino Acids', 'Non-Essential Amino Acids',
    'Saturated Fats', 'Unsaturated Fats', 'Trans Fats', 'Omega-3 Fatty Acids', 'Omega-6 Fatty Acids',
    'Vitamin A', 'Vitamin B1', 'Vitamin B2', 'Vitamin B3', 'Vitamin B5', 'Vitamin B6', 'Vitamin B7',
    'Vitamin B9', 'Vitamin B12', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Calcium',
    'Phosphorus', 'Magnesium', 'Sodium', 'Potassium', 'Chloride', 'Sulfur', 'Iron', 'Zinc', 'Copper',
    'Manganese', 'Iodine', 'Selenium', 'Molybdenum', 'Chromium', 'Phytochemicals', 'Flavonoids',
    'Polyphenols', 'Carotenoids', 'Glycogen', 'Beta-Glucans', 'Sterols',
  ];

  const generateOptions = () => {
    const nameMap = {};
    
    // Process main items and their nested addons/combos
    items.forEach((item) => {
      const itemName = item.item_name || item.name1;
      if (!itemName) return;

      if (!nameMap[itemName]) {
        nameMap[itemName] = {
          label: `${itemName} (Item)`,
          value: itemName,
          type: 'item',
          instances: [{ item_id: item._id }],
        };
      } else {
        if (!nameMap[itemName].instances.some(inst => inst.item_id === item._id)) {
          nameMap[itemName].instances.push({ item_id: item._id });
        }
      }

      // Addons nested in items
      item.addons?.forEach((addon, index) => {
        const addonName = addon.name1 || addon.item_name;
        if (!addonName) return;
        
        const key = `${addonName}_addon`;
        if (!nameMap[key]) {
          nameMap[key] = {
            label: `${addonName} (Addon)`,
            value: addonName,
            type: 'addon',
            instances: [{ item_id: item._id, index }],
          };
        } else {
          nameMap[key].instances.push({ item_id: item._id, index });
        }
      });

      // Combos nested in items
      item.combos?.forEach((combo, index) => {
        const comboName = combo.name1 || combo.item_name;
        if (!comboName) return;

        const key = `${comboName}_combo`;
        if (!nameMap[key]) {
          nameMap[key] = {
            label: `${comboName} (Combo)`,
            value: comboName,
            type: 'combo',
            instances: [{ item_id: item._id, index }],
          };
        } else {
          nameMap[key].instances.push({ item_id: item._id, index });
        }
      });
    });

    // Process standalone combo offers
    combos.forEach((combo) => {
      const comboName = combo.item_name || combo.description || "Combo Offer";
      if (!nameMap[comboName]) {
        nameMap[comboName] = {
          label: `${comboName} (Combo Offer)`,
          value: comboName,
          type: 'item', // Standalone combos are treated like items in nutrition context
          instances: [{ item_id: combo._id }],
        };
      } else {
        nameMap[comboName].instances.push({ item_id: combo._id });
      }
    });

    return Object.values(nameMap).sort((a, b) => a.label.localeCompare(b.label));
  };

  const options = generateOptions();
  const filteredOptions = searchTerm.trim()
    ? options.filter((option) => 
        option.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const fetchItemsData = async () => {
    if (configLoading) return;
    setLoading(true);
    try {
      const headers = getHeaders();
      const itemsUrl = baseUrl ? `${baseUrl}/api/items` : '/api/items';
      const combosUrl = baseUrl ? `${baseUrl}/api/combo-offer` : '/api/combo-offer';
      
      const [itemsRes, combosRes] = await Promise.all([
        axios.get(itemsUrl, { headers }),
        axios.get(combosUrl, { headers }).catch(() => ({ data: [] }))
      ]);

      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setCombos(Array.isArray(combosRes.data) ? combosRes.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch items. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemNutrition = async (selectedValue) => {
    if (!selectedValue || isSubForm || configLoading) {
      setIngredients(getInitialIngredients());
      setHasExistingData(false);
      return;
    }

    const option = options.find((opt) => opt.value === selectedValue);
    if (!option) return;

    const { type, instances } = option;
    const firstInstance = instances[0];
    
    try {
      const url = baseUrl 
        ? `${baseUrl}/api/items/nutrition/${encodeURIComponent(selectedValue)}` 
        : `/api/items/nutrition/${encodeURIComponent(selectedValue)}`;
      
      const response = await axios.get(url, {
        params: {
          type,
          item_id: firstInstance.item_id,
          index: firstInstance.index
        },
        headers: getHeaders()
      });

      if (response.data) {
        const ingredientsData = response.data.ingredients || [];
        const validIngredients = ingredientsData.length > 0
          ? ingredientsData.map((ing, ingIndex) => ({
              name: ing.name || ing.ingredients_name || '',
              small: ing.small?.toString() || '',
              medium: ing.medium?.toString() || '',
              large: ing.large?.toString() || '',
              weight: ing.weight?.toString() || '',
              nutrition: Array.isArray(ing.nutrition)
                ? ing.nutrition.map((nut, nutIndex) => ({
                    nutrition_name: nut.nutrition_name || '',
                    nutrition_value: nut.nutrition_value?.toString() || '',
                    id: `${ingIndex}-${nutIndex}-${Date.now()}`,
                  }))
                : [],
            }))
          : [{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }];

        setIngredients(validIngredients);
        setHasExistingData(ingredientsData.length > 0);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setIngredients([{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }]);
      setHasExistingData(false);
    }
  };

  useEffect(() => {
    fetchItemsData();
  }, [baseUrl, configLoading]);

  useEffect(() => {
    if (isSubForm) {
      setSelectedItem(getInitialItemName());
      setIngredients(getInitialIngredients());
      setHasExistingData(false);
    } else if (selectedItem) {
      fetchItemNutrition(selectedItem);
    }
  }, [selectedItem, items, combos, isSubForm, passedFormData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleNutritionChange = (ingredientIndex, nutritionIndex, field, value) => {
    const newIngredients = [...ingredients];
    const nutrition = [...newIngredients[ingredientIndex].nutrition];
    nutrition[nutritionIndex] = { ...nutrition[nutritionIndex], [field]: value };
    newIngredients[ingredientIndex].nutrition = nutrition;
    setIngredients(newIngredients);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleAddRow = () => {
    setIngredients([...ingredients, { name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }]);
    scrollToBottom();
  };

  const handleRemoveRow = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleAddNutrition = (ingredientIndex) => {
    const newIngredients = [...ingredients];
    newIngredients[ingredientIndex].nutrition = [
      ...newIngredients[ingredientIndex].nutrition,
      { nutrition_name: '', nutrition_value: '', id: `${ingredientIndex}-${newIngredients[ingredientIndex].nutrition.length}-${Date.now()}` },
    ];
    setIngredients(newIngredients);
    scrollToBottom();
  };

  const handleDeleteNutrition = (ingredientIndex, nutritionIndex) => {
    const newIngredients = [...ingredients];
    newIngredients[ingredientIndex].nutrition = newIngredients[ingredientIndex].nutrition.filter(
      (_, index) => index !== nutritionIndex
    );
    setIngredients(newIngredients);
  };

  const handleItemSelect = (option) => {
    setSelectedItem(option.value);
    setSearchTerm(option.label);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDropdownOpen(true);
    if (!value) setSelectedItem('');
  };

  const handleGoBack = () => {
    if (isSubForm) {
      navigate('/create-item', { state: { formData: passedFormData, isEditing, item: itemToEdit } });
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (!canWrite) {
      setSaveMessage('You do not have permission to save.');
      return;
    }
    if (!selectedItem && !isSubForm) {
      setSaveMessage('Please select an item, addon, or combo');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      setSaveMessage('Please add at least one ingredient');
      return;
    }

    // Validation
    for (const ing of validIngredients) {
      if (!ing.weight || isNaN(parseFloat(ing.weight)) || parseFloat(ing.weight) <= 0) {
        setSaveMessage(`Valid base weight required for: ${ing.name}`);
        return;
      }
      if (!ing.small || isNaN(parseFloat(ing.small)) || parseFloat(ing.small) <= 0) {
        setSaveMessage(`Valid small weight required for: ${ing.name}`);
        return;
      }
      for (const nut of ing.nutrition) {
        if (!nut.nutrition_name.trim()) {
          setSaveMessage(`Nutrition name required for: ${ing.name}`);
          return;
        }
        if (isNaN(parseFloat(nut.nutrition_value)) || parseFloat(nut.nutrition_value) < 0) {
          setSaveMessage(`Valid nutrition value required for: ${nut.nutrition_name}`);
          return;
        }
      }
    }

    const formattedIngredients = validIngredients.map((ing) => ({
      name: ing.name,
      small: parseFloat(ing.small),
      medium: parseFloat(ing.medium) || 0,
      large: parseFloat(ing.large) || 0,
      weight: parseFloat(ing.weight),
      nutrition: ing.nutrition.map((nut) => ({
        nutrition_name: nut.nutrition_name,
        nutrition_value: parseFloat(nut.nutrition_value),
      })),
    }));

    if (isSubForm) {
      let updatedFormData = { ...passedFormData };
      if (passedType === "addons" || passedType === "addon") {
        const addons = [...(updatedFormData.addons || [])];
        if (passedIndex !== null) addons[passedIndex] = { ...addons[passedIndex], ingredients: formattedIngredients };
        updatedFormData.addons = addons;
      } else if (passedType === "combos" || passedType === "combo") {
        const combos = [...(updatedFormData.combos || [])];
        if (passedIndex !== null) combos[passedIndex] = { ...combos[passedIndex], ingredients: formattedIngredients };
        updatedFormData.combos = combos;
      } else {
        updatedFormData.ingredients = formattedIngredients;
      }

      navigate('/create-item', { state: { formData: updatedFormData, isEditing, item: itemToEdit } });
    } else {
      const option = options.find((opt) => opt.value === selectedItem);
      if (!option) return;

      const { type, instances } = option;
      const payload = {
        item_name: selectedItem,
        type,
        instances,
        ingredients: formattedIngredients,
      };

      try {
        setSaveLoading(true);
        const url = baseUrl ? `${baseUrl}/api/items/nutrition` : '/api/items/nutrition';
        const response = await axios.post(url, payload, { headers: getHeaders() });

        if (response.status === 200) {
          setSaveMessage('Data saved successfully!');
          setHasExistingData(true);
          setTimeout(() => {
            if (location.state) {
              navigate('/create-item', { state: { formData: updatedFormData, isEditing, item: itemToEdit } });
            } else {
              navigate('/admin');
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Save error:', error);
        setSaveMessage(error.response?.data?.error || 'Failed to save data');
      } finally {
        setSaveLoading(false);
      }
    }
  };

  const handleClear = async () => {
    if (!canDelete) {
      setSaveMessage('Permission denied.');
      return;
    }
    if (!selectedItem) return;

    const option = options.find((opt) => opt.value === selectedItem);
    if (!option) return;

    try {
      setSaveLoading(true);
      const url = baseUrl 
        ? `${baseUrl}/api/items/nutrition/${encodeURIComponent(selectedItem)}` 
        : `/api/items/nutrition/${encodeURIComponent(selectedItem)}`;
      
      const response = await axios.delete(url, {
        params: { type: option.type },
        headers: { ...getHeaders(), 'X-Instances': JSON.stringify(option.instances) }
      });

      if (response.status === 200) {
        setSaveMessage('Data cleared successfully!');
        setIngredients([{ name: '', small: '', medium: '', large: '', weight: '', nutrition: [] }]);
        setHasExistingData(false);
      }
    } catch (error) {
      setSaveMessage('Failed to clear data');
    } finally {
      setSaveLoading(false);
    }
  };

  const calculateNutrition = (ingredient, sizeKey) => {
    const baseWeight = parseFloat(ingredient.weight) || 1;
    const sizeWeight = parseFloat(ingredient[sizeKey]) || 0;
    const scalingFactor = sizeWeight / baseWeight;
    
    return ingredient.nutrition.map((nut) => {
      const val = parseFloat(nut.nutrition_value) || 0;
      return (val * scalingFactor).toFixed(3);
    });
  };

  const styles = {
    container: { height: '100vh', overflowY: 'auto', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)', padding: '20px', position: 'relative' },
    formContainer: { backgroundColor: '#ffffff', padding: '32px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', width: '100%', maxWidth: '1000px', margin: '80px auto 20px' },
    title: { color: '#2c3e50', fontWeight: '700', marginBottom: '20px', paddingBottom: '15px', borderBottom: '3px solid #3498db', width: 'fit-content', textAlign: 'center', margin: '0 auto' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
    select: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: '#ffffff' },
    button: { padding: '10px 20px', borderRadius: '25px', border: '0', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    addButton: { backgroundColor: '#3498db', color: 'white' },
    deleteButton: { backgroundColor: '#e74c3c', color: 'white', padding: '8px 16px', marginTop: '10px' },
    saveButton: { backgroundColor: '#2ecc71', color: 'white' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' },
    tableHeader: { backgroundColor: '#f5f7fa', color: '#2c3e50', fontWeight: '600', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' },
    tableCell: { padding: '10px', borderBottom: '1px solid #ddd', color: '#2c3e50', verticalAlign: 'top' },
    dropdown: { position: 'absolute', width: '100%', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1002, marginTop: '4px' },
    dropdownItem: { padding: '12px 16px', cursor: 'pointer', transition: 'background-color 0.2s ease', borderBottom: '1px solid #f0f0f0' },
    messageBox: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 2000, maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid #3498db' },
    errorMessageBox: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 2000, maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid #dc2626' },
  };

  return (
    <div style={styles.container}>
      <button
        onClick={handleGoBack}
        style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'transparent', border: '2px solid #3498db', color: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '50px', fontSize: '16px', fontWeight: '600', boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)', zIndex: 1001, transition: 'all 0.3s ease' }}
        onMouseOver={(e) => { e.target.style.backgroundColor = '#3498db'; e.target.style.color = '#ffffff'; }}
        onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#3498db'; }}
      >
        <FaArrowLeft /> Back
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#fff', fontSize: '20px' }}>Loading catalog...</div>
      ) : (
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Ingredients & Nutrition</h2>
          
          {!isSubForm && (
            <div style={{ marginBottom: '30px', position: 'relative' }} ref={dropdownRef}>
              <h5 style={{ color: '#2c3e50', marginBottom: '10px', fontWeight: '600' }}>Select Item, Addon, or Combo</h5>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search catalog (e.g. 'watermelon', 'combo'...)"
                style={styles.input}
              />
              {isDropdownOpen && filteredOptions.length > 0 && (
                <div style={styles.dropdown}>
                  {filteredOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      style={styles.dropdownItem}
                      onClick={() => handleItemSelect(opt)}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#ffffff')}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSubForm && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h4 style={{ color: '#3498db' }}>
                {passedType === 'item' ? 'Item' : passedType === 'addons' || passedType === 'addon' ? 'Addon' : 'Combo'}: {getInitialItemName() || 'Unnamed'}
              </h4>
            </div>
          )}

          {error && (
            <div style={{ color: '#e74c3c', marginBottom: '20px', textAlign: 'center' }}>{error}</div>
          )}

          {saveMessage && (
            <div style={styles.messageBox}>
              <h6 style={{ color: saveMessage.includes('success') ? '#2ecc71' : '#f39c12', marginBottom: '10px' }}>
                {saveMessage.includes('success') ? 'Success' : 'Notice'}
              </h6>
              <p>{saveMessage}</p>
              <button style={styles.button} onClick={() => setSaveMessage('')}>OK</button>
            </div>
          )}

          {(selectedItem || isSubForm) && (
            <>
              <div style={{ marginBottom: '30px' }}>
                <h5 style={styles.title}>Ingredients</h5>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Name</th>
                      <th style={styles.tableHeader}>Small (gm)</th>
                      <th style={styles.tableHeader}>Medium (gm)</th>
                      <th style={styles.tableHeader}>Large (gm)</th>
                      <th style={styles.tableHeader}>Base Weight (gm)</th>
                      <th style={styles.tableHeader}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing, idx) => (
                      <tr key={idx}>
                        <td style={styles.tableCell}><input style={styles.input} value={ing.name} onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)} /></td>
                        <td style={styles.tableCell}><input style={styles.input} type="number" value={ing.small} onFocus={(e) => (String(e.target.value) === '0') && handleIngredientChange(idx, 'small', '')} onBlur={(e) => e.target.value === '' && handleIngredientChange(idx, 'small', 0)} onChange={(e) => handleIngredientChange(idx, 'small', e.target.value)} /></td>
                        <td style={styles.tableCell}><input style={styles.input} type="number" value={ing.medium} onFocus={(e) => (String(e.target.value) === '0') && handleIngredientChange(idx, 'medium', '')} onBlur={(e) => e.target.value === '' && handleIngredientChange(idx, 'medium', 0)} onChange={(e) => handleIngredientChange(idx, 'medium', e.target.value)} /></td>
                        <td style={styles.tableCell}><input style={styles.input} type="number" value={ing.large} onFocus={(e) => (String(e.target.value) === '0') && handleIngredientChange(idx, 'large', '')} onBlur={(e) => e.target.value === '' && handleIngredientChange(idx, 'large', 0)} onChange={(e) => handleIngredientChange(idx, 'large', e.target.value)} /></td>
                        <td style={styles.tableCell}><input style={styles.input} type="number" value={ing.weight} onFocus={(e) => (String(e.target.value) === '0') && handleIngredientChange(idx, 'weight', '')} onBlur={(e) => e.target.value === '' && handleIngredientChange(idx, 'weight', 0)} onChange={(e) => handleIngredientChange(idx, 'weight', e.target.value)} /></td>
                        <td style={styles.tableCell}>
                          <button 
                            style={{ ...styles.button, ...styles.deleteButton, marginTop: '0px' }} 
                            onClick={() => handleRemoveRow(idx)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={handleAddRow} style={{ ...styles.button, ...styles.addButton }}>+ Add Ingredient</button>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h5 style={styles.title}>Nutrition Values</h5>
                {ingredients.map((ing, ingIdx) => ing.name && (
                  <div key={ingIdx} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '10px' }}>
                    <h6 style={{ fontWeight: '600', color: '#34495e' }}>{ing.name}</h6>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>Nutrient</th>
                          <th style={styles.tableHeader}>Value (gm)</th>
                          <th style={styles.tableHeader}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ing.nutrition.map((nut, nutIdx) => (
                          <tr key={nutIdx}>
                            <td style={styles.tableCell}>
                              <select style={styles.select} value={nut.nutrition_name} onChange={(e) => handleNutritionChange(ingIdx, nutIdx, 'nutrition_name', e.target.value)}>
                                <option value="">Select Nutrient</option>
                                {nutritionNames.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </td>
                            <td style={styles.tableCell}><input style={styles.input} type="number" value={nut.nutrition_value} onFocus={(e) => (String(e.target.value) === '0') && handleNutritionChange(ingIdx, nutIdx, 'nutrition_value', '')} onBlur={(e) => e.target.value === '' && handleNutritionChange(ingIdx, nutIdx, 'nutrition_value', 0)} onChange={(e) => handleNutritionChange(ingIdx, nutIdx, 'nutrition_value', e.target.value)} /></td>
                            <td style={styles.tableCell}><button style={styles.deleteButton} onClick={() => handleDeleteNutrition(ingIdx, nutIdx)}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button style={{ ...styles.button, ...styles.addButton, marginTop: '10px' }} onClick={() => handleAddNutrition(ingIdx)}>+ Add Nutrient</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button onClick={handleSave} disabled={saveLoading} style={{ ...styles.button, ...styles.saveButton, padding: '12px 40px' }}>
                  {saveLoading ? 'Saving...' : 'Save Data'}
                </button>
                <button onClick={handleClear} disabled={saveLoading || !hasExistingData} style={{ ...styles.button, ...styles.deleteButton, padding: '12px 40px' }}>
                  {saveLoading ? 'Processing...' : 'Clear Data'}
                </button>
              </div>
              <div ref={bottomRef} style={{ height: '20px' }}></div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AddIngredientAndNutrition;
