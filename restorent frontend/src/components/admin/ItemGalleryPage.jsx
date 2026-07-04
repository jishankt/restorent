import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaImage, FaEdit, FaTrash, FaArrowLeft, FaFileExcel, FaUpload, FaTimes } from 'react-icons/fa';
import { UserContext } from '../../Context/UserContext';
import * as XLSX from 'xlsx';

const ItemGalleryPage = () => {
  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { baseUrl } = useContext(UserContext);
  const navigate = useNavigate();

  const [importData, setImportData] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const itemsReq = axios.get(`${baseUrl}/api/item-gallery`, { headers: { 'Authorization': `Bearer ${token}` } });
      const groupsReq = axios.get(`${baseUrl}/api/item-group-gallery`, { headers: { 'Authorization': `Bearer ${token}` } });
      
      const [itemsRes, groupsRes] = await Promise.all([itemsReq, groupsReq]);
      
      setItems(itemsRes.data.items || []);
      setItemGroups(groupsRes.data.item_groups || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, [baseUrl]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      setError("Unsupported format. Use Excel.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetsData = {};
        workbook.SheetNames.forEach(sheetName => {
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          if (jsonData.length > 0) sheetsData[sheetName] = jsonData;
        });
        
        if (Object.keys(sheetsData).length === 0) {
          setError("No data found in the Excel file.");
          return;
        }

        setImportData(sheetsData);
        setSelectedSheets(Object.keys(sheetsData)); // Select all by default
        setShowImportModal(true);
      } catch (err) {
        setError("Error parsing Excel file");
      }
      if(e.target) e.target.value = null; // reset
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    try {
      setIsImporting(true);
      setError('');
      
      let allItemsToImport = [];
      selectedSheets.forEach(sheetName => {
        allItemsToImport = [...allItemsToImport, ...importData[sheetName]];
      });

      if (allItemsToImport.length === 0) {
        setError("No items selected for import.");
        setIsImporting(false);
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post(`${baseUrl}/api/item-gallery/bulk`, allItemsToImport, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShowImportModal(false);
      setImportData(null);
      setSelectedSheets([]);
      alert(`Successfully imported ${allItemsToImport.length} items!`);
      fetchGalleryItems();
    } catch (err) {
      console.error(err);
      const serverError = err.response?.data?.error || "Failed to import items from Excel.";
      setError(`Import Error: ${serverError}`);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSheetSelection = (sheetName) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) return;
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      await axios.delete(`${baseUrl}/api/item-gallery/${itemId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Context': encodeURIComponent(userStr)
        }
      });
      fetchGalleryItems();
    } catch (err) {
      console.error(err);
      alert('Failed to delete item.');
    }
  };

  const allCategories = ["All Items", ...new Set([
    ...itemGroups.map(g => g.group_name),
    ...items.map(i => i.item_group).filter(Boolean)
  ])];

  const normalizeIngredients = (ingredients) => {
    if (Array.isArray(ingredients)) return ingredients;
    if (typeof ingredients === 'string' && ingredients.trim() !== '') return [{ name: ingredients }];
    if (typeof ingredients === 'object' && ingredients !== null && Object.keys(ingredients).length > 0) return [ingredients];
    return [];
  };

  const displayedItems = selectedCategory === "All Items" 
    ? items 
    : items.filter(item => item.item_group === selectedCategory);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#64748b' }}>Loading Item Gallery...</div>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer', fontSize: '1rem', fontWeight: '600', marginBottom: '20px', padding: '0', transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
      >
        <FaArrowLeft /> Back to Admin
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FaImage color="#6366f1" /> Item Gallery
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Manage master template items that are available to all tenants</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
          />
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              backgroundColor: '#ffffff', color: '#10b981', border: '1px solid #10b981', padding: '12px 24px', borderRadius: '10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700',
              fontSize: '0.95rem', transition: 'all 0.2s'
            }}
          >
            <FaFileExcel /> Import from Excel
          </button>
          <button
            onClick={() => navigate('/create-item?source=gallery')}
            style={{
              backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700',
              fontSize: '0.95rem', boxShadow: '0 4px 14px 0 rgba(99,102,241,0.39)', transition: 'all 0.2s'
            }}
          >
            <FaPlus /> Create New Item
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '15px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', flexShrink: 0, backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#1e293b' }}>Item Groups</h3>
          {allCategories.map(cat => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 15px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: selectedCategory === cat ? '700' : '500',
                backgroundColor: selectedCategory === cat ? '#6366f1' : 'transparent',
                color: selectedCategory === cat ? '#ffffff' : '#64748b',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#334155';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {displayedItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
              No gallery items found in this category. Click "Create New Item" to add a global template.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {displayedItems.map((item) => (
                <div key={item._id || item.item_code} style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                  <div style={{ height: '180px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.image ? (
                      <img src={item.image.startsWith('data:') ? item.image : `${baseUrl}/api/images/${item.image}`} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FaImage size={40} color="#cbd5e1" />
                    )}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>{item.item_name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '5px' }}>Code: <span style={{ fontWeight: '600', color: '#334155' }}>{item.item_code}</span></div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Group: <span style={{ fontWeight: '600', color: '#334155' }}>{item.item_group}</span></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                      <button onClick={() => navigate(`/create-item?id=${item._id}&source=gallery`, { state: { item: { ...item, ingredients: normalizeIngredients(item.ingredients) } } })} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.85rem' }}>
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => handleDelete(item._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.85rem' }}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal for Sheet Selection */}
      {showImportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUpload color="#6366f1" /> Select Tables to Import
              </h2>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <FaTimes size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#64748b', margin: 0, maxWidth: '75%' }}>
                We found multiple sheets (tables) in your Excel file. Please select the ones you want to import into the Item Gallery.
              </p>
              <button 
                onClick={() => {
                  if (importData) {
                    const allKeys = Object.keys(importData);
                    if (selectedSheets.length === allKeys.length) {
                      setSelectedSheets([]);
                    } else {
                      setSelectedSheets(allKeys);
                    }
                  }
                }}
                style={{ 
                  background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', 
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#475569', transition: 'all 0.2s' 
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              >
                {importData && selectedSheets.length === Object.keys(importData).length ? 'Unselect All' : 'Select All'}
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
              {importData && Object.keys(importData).map(sheetName => (
                <label key={sheetName} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSheets.includes(sheetName)}
                    onChange={() => toggleSheetSelection(sheetName)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '600', color: '#334155' }}>{sheetName}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: 'auto' }}>({importData[sheetName].length} items)</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                onClick={() => setShowImportModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmImport}
                disabled={isImporting || selectedSheets.length === 0}
                style={{ 
                  padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: selectedSheets.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', 
                  backgroundColor: selectedSheets.length === 0 ? '#cbd5e1' : '#10b981', color: 'white',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {isImporting ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemGalleryPage;
