import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { UserContext } from '../../Context/UserContext';
import CurrencySymbol from '../CurrencySymbol';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft, FaTrash, FaCloudUploadAlt, FaImage, FaCalendarAlt, FaSave,
  FaCog, FaTimes, FaUsers, FaMapMarkerAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./CreateItemPage.css";
import CustomerCustomizationModal from "./CustomerCustomizationModal";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";

const initialFormState = {
  description: "",
  total_price: 0,
  offer_price: "",
  offer_start_time: "",
  offer_end_time: "",
  items: [],
  images: [],
};

const ComboOffer = () => {
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState(initialFormState);
  const [rawItems, setRawItems] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [canWrite, setCanWrite] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [currency, setCurrency] = useState("INR");

  const showCompanyAssign = (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 1;

  const getCurrencySymbol = (currCode) => {
    const code = currCode?.toUpperCase();
    return <CurrencySymbol currencyCode={code} size={14} />;
  };

  const formatPrice = (price) => {
    const symbol = getCurrencySymbol(currency);
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}{(Number(price) || 0).toFixed(2)}</span>;
  };
  const activeBranchLocal = (localStorage.getItem('active_branch') || 'All Branches').trim();
  const isSpecificBranchActive = activeBranchLocal.toLowerCase() !== 'all branches' && activeBranchLocal.toLowerCase() !== 'all' && activeBranchLocal !== '';
  const showBranchAssign = (isGroupAdmin || isCompanyAdmin) && !isSpecificBranchActive && selectedCompanies.length > 0 && availableBranches.length > 0;

  const fetchDoctypeFields = async (currentBaseUrl = "") => {
    try {
      const response = await axios.get(`${currentBaseUrl || ""}/api/doctypes/Combo Offer`, { headers: getHeaders() });
      if (response.data && response.data.fields) setDoctypeFields(response.data.fields);
    } catch (error) { console.error(error); }
  };

  const getFieldHidden = (id) => doctypeFields.find(f => f.id === id)?.hidden === true;
  const getFieldLabel = (id, def) => doctypeFields.find(f => f.id === id)?.label || def;

  const getImageUrl = (path) => {
    if (!path) return "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
    if (path.startsWith('http')) return path;
    return `${baseUrl || ''}/api/combo-images/${path.split('/').pop()}`;
  };

  const toggleCompanySelection = (comp) => {
    setSelectedCompanies(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);
  };

  const fetchCompanies = async (url, userObj) => {
    try {
      let comps = [];
      if (userObj.companies && userObj.companies.length > 0) {
        comps = userObj.companies.map(c => typeof c === 'object' && c !== null ? (c.company_name || c.company || c.name || '') : c).filter(c => c && typeof c === 'string');
      } else if (userObj.company_name || userObj.company) {
        comps = [userObj.company_name || userObj.company];
      } else {
        const res = await axios.get(`${url}/api/company-details`, { headers: getHeaders() });
        const details = res.data.companyDetails || [];
        comps = details.map(d => d.restaurantName).filter(n => n);
      }
      const finalComps = comps.length > 0 ? [...new Set(comps)] : ['POS 8'];
      setCompanyOptions(finalComps);

      const activeContext = localStorage.getItem('active_company');
      if (selectedCompanies.length === 0 && finalComps.length > 0) {
        if (activeContext && activeContext !== 'All' && finalComps.includes(activeContext)) {
          setSelectedCompanies([activeContext]);
        } else if (activeContext === 'All') {
          setSelectedCompanies(finalComps);
        } else if (!activeContext && finalComps.length === 1) {
          setSelectedCompanies([finalComps[0]]);
        }
      }

      if (finalComps.length > 0) {
        const branchPromises = finalComps.map(comp =>
          axios.get(`${url}/api/branches?company_name=${encodeURIComponent(comp)}`, { headers: { "X-Company-Name": comp, ...getHeaders() } })
            .then(res => ({ comp, data: res.data }))
        );
        const results = await Promise.all(branchPromises);
        const newMap = {};
        const allBranches = [];
        results.forEach(res => {
          const branches = res.data.map(b => typeof b === 'string' ? b : b.branch_name || b.branch || b.name || '').filter(b => b);
          newMap[res.comp] = branches;
          allBranches.push(...branches);
        });
        setCompanyBranchesMap(newMap);
        setAvailableBranches([...new Set(allBranches)]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!configLoading) {
      fetchDoctypeFields(baseUrl);

      const fetchCurrency = async () => {
        try {
          const apiPath = baseUrl ? `${baseUrl}/api/settings` : '/api/settings';
          const response = await axios.get(apiPath, { headers: getHeaders() });
          const { currency: fetchedCurrency = "INR" } = response.data || {};
          setCurrency(fetchedCurrency.toUpperCase());
        } catch (error) {
          console.error("Error fetching currency settings", error);
          setCurrency("INR");
        }
      };
      fetchCurrency();

      const fetchComponents = async () => {
        try {
          const headers = getHeaders();
          const [itemsRes, combosRes] = await Promise.all([
            axios.get(`${baseUrl}/api/items`, { headers }),
            axios.get(`${baseUrl}/api/combo-offer`, { headers })
          ]);

          const items = itemsRes.data || [];
          const combos = combosRes.data || [];

          const now = new Date();
          const validCombos = combos.filter(c => {
            if (c.offer_end_time && new Date(c.offer_end_time) < now) return false;
            return true;
          });

          const extractedItems = [];

          const expandItem = (comp, type = 'Item') => {
            const variations = [];
            const companies = Array.isArray(comp.company_names) ? comp.company_names : (comp.company_name ? [comp.company_name] : []);
            const branches = Array.isArray(comp.branch_names) ? comp.branch_names : (comp.branch_name ? [comp.branch_name] : []);

            let basePrice = 0;
            if (type === 'Addon') basePrice = Number(comp.addon_price || comp.price || 0);
            else if (type === 'Combo') basePrice = Number(comp.offer_price || comp.total_price || comp.price || 0);
            else basePrice = Number(comp.price_list_rate || comp.price || 0);

            let possibleCompanies = companies.length > 0 ? companies : ['Global'];
            let possibleBranches = branches.length > 0 ? branches : ['Global'];

            possibleCompanies.forEach(cName => {
              if (String(cName).toLowerCase() !== 'global' && String(cName).toLowerCase() !== 'all companies') {
                let cPrice = basePrice;
                if (comp.company_prices && comp.company_prices[cName] !== undefined) {
                  cPrice = Number(comp.company_prices[cName]);
                }
                variations.push({
                  ...comp,
                  _id: `${comp._id}_${cName}`,
                  item_name: `${comp.name1 || comp.item_name || comp.description || 'Combo'} - ${cName}`,
                  price: cPrice,
                  company_names: [cName]
                });
              }

              possibleBranches.forEach(bName => {
                if (String(bName).toLowerCase() !== 'global' && String(bName).toLowerCase() !== 'all branches') {
                  let bPrice = basePrice;
                  if (comp.company_prices && comp.company_prices[cName] !== undefined) {
                    bPrice = Number(comp.company_prices[cName]);
                  }
                  if (comp.branch_prices && comp.branch_prices[bName] !== undefined) {
                    bPrice = Number(comp.branch_prices[bName]);
                  }

                  const branchKey = `${comp._id}_${bName}`;
                  if (!variations.some(v => v._id === branchKey)) {
                    variations.push({
                      ...comp,
                      _id: branchKey,
                      item_name: `${comp.name1 || comp.item_name || comp.description || 'Combo'} - ${bName}`,
                      price: bPrice,
                      branch_names: [bName]
                    });
                  }
                }
              });
            });

            if (variations.length === 0) {
              variations.push({
                ...comp,
                _id: comp._id,
                item_name: comp.name1 || comp.item_name || comp.description || 'Combo',
                price: basePrice
              });
            }

            return variations.map(v => ({ ...v, component_type: type }));
          };

          items.forEach(it => {
            const baseType = (it.type || 'Item').toLowerCase() === 'addon' ? 'Addon' : 'Item';
            extractedItems.push(...expandItem(it, baseType));

            if (it.addons && Array.isArray(it.addons)) {
              it.addons.forEach(addon => {
                if (addon.name1?.trim().toLowerCase() === it.item_name?.trim().toLowerCase()) return;
                const addonBase = {
                  ...addon,
                  _id: addon._id || `addon_${it._id}_${Math.random()}`,
                  company_names: addon.company_names || it.company_names,
                  branch_names: addon.branch_names || it.branch_names
                };
                extractedItems.push(...expandItem(addonBase, 'Addon'));
              });
            }
          });

          const combined = [
            ...extractedItems,
            ...validCombos.flatMap(c => expandItem(c, 'Combo'))
          ];

          setRawItems(combined);
        } catch (e) {
          console.error("Error fetching components:", e);
        }
      };
      fetchComponents();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isGroupAdminRole = user.role === 'group_admin' || checkIsGlobalAdmin(user);
      const isCA = checkIsAdmin(user);
      const isBA = user.role?.toLowerCase().includes('branch') || user.role?.toLowerCase().includes('manager');

      setIsGroupAdmin(isGroupAdminRole);
      setIsCompanyAdmin(isCA || isGroupAdminRole);
      setIsBranchAdmin(isBA);

      if (isGroupAdminRole || isCA) {
        fetchCompanies(baseUrl, user);
      } else {
        const activeContext = localStorage.getItem('active_company') || '';
        setSelectedCompanies([activeContext || user.company_name || user.company]);
      }
      setCanWrite(true);
    }
  }, [configLoading, baseUrl]);

  const allItems = useMemo(() => {
    return rawItems.filter(item => {
      const itemCompanies = Array.isArray(item.company_names) ? item.company_names : (item.company_name ? [item.company_name] : []);
      const itemBranches = Array.isArray(item.branch_names) ? item.branch_names : (item.branch_name ? [item.branch_name] : []);

      const activeComp = localStorage.getItem('active_company') || '';
      const activeBranch = localStorage.getItem('active_branch') || '';

      const isAllComp = activeComp === '' || activeComp === 'All' || activeComp === 'All Companies';
      const isAllBranch = activeBranch === '' || activeBranch === 'All' || activeBranch === 'All Branches';

      const normalize = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/gi, '');
      const matchTenancy = (a, b) => normalize(a) === normalize(b);

      const matchesCompany = isAllComp || itemCompanies.length === 0 || itemCompanies.some(c => matchTenancy(c, activeComp) || matchTenancy(c, 'Global') || matchTenancy(c, 'All Companies'));
      const matchesBranch = isAllBranch || itemBranches.length === 0 || itemBranches.some(b => matchTenancy(b, activeBranch) || matchTenancy(b, 'Global') || matchTenancy(b, 'All Branches'));

      return matchesCompany && matchesBranch;
    });
  }, [rawItems]);

  useEffect(() => {
    if (location.state?.combo) {
      const c = location.state.combo;
      setIsEdit(true);
      setFormData({ ...initialFormState, ...c });
      setSelectedComponents(c.items || []);
      setPreviewUrls((c.images || []).map(img => getImageUrl(img)));
      if (c.company_names) setSelectedCompanies(c.company_names);
      else if (c.company_name) setSelectedCompanies([c.company_name]);

      if (c.branch_names) setSelectedBranches(c.branch_names);
      else if (c.branch_name) setSelectedBranches([c.branch_name]);
    }
  }, [location.state, baseUrl]);

  const handleSelection = (type, id) => {
    const it = allItems.find(i => i._id === id);
    if (!it) return;
    const price = it.price || 0;
    const comp = { type: "item", data: it, price: Number(price) };
    const newItems = [...selectedComponents, comp];
    setSelectedComponents(newItems);
    setFormData(prev => ({ ...prev, items: newItems, total_price: (prev.total_price || 0) + comp.price }));
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const removeSelection = (idx) => {
    const removed = selectedComponents[idx];
    const newItems = selectedComponents.filter((_, i) => i !== idx);
    setSelectedComponents(newItems);
    setFormData(prev => ({ ...prev, items: newItems, total_price: (prev.total_price || 0) - (removed?.price || 0) }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      try {
        const response = await axios.post(`${baseUrl}/api/upload-combo-image`, uploadFormData, {
          headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
        });
        setImages(prev => [...prev, response.data.filename]);
        setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
      } catch (error) { toast.error("Upload failed"); }
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleModalSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);

      let finalBranches = selectedBranches;
      let finalCompanies = selectedCompanies;
      const activeBranchLoc = (localStorage.getItem('active_branch') || 'All Branches').trim();
      const activeCompLoc = (localStorage.getItem('active_company') || 'All Companies').trim();
      const isSpecBranch = activeBranchLoc.toLowerCase() !== 'all branches' && activeBranchLoc.toLowerCase() !== 'all' && activeBranchLoc !== '';
      const isSpecComp = activeCompLoc.toLowerCase() !== 'all companies' && activeCompLoc.toLowerCase() !== 'all' && activeCompLoc !== '';

      if (isSpecBranch && finalBranches.length === 0) finalBranches = [activeBranchLoc];
      if (isSpecComp && finalCompanies.length === 0) finalCompanies = [activeCompLoc];

      if (finalCompanies.length === 0 && (isGroupAdmin || isCompanyAdmin) && companyOptions.length > 0) {
        finalCompanies = ['All Companies'];
      }
      if (finalBranches.length === 0 && (isGroupAdmin || isCompanyAdmin) && availableBranches.length > 0) {
        finalBranches = ['All Branches'];
      }

      const payload = {
        ...formData,
        item_group: "Combos Offer",
        total_price: parseFloat(formData.total_price) || 0,
        offer_price: parseFloat(formData.offer_price) || 0,
        branch_name: finalBranches[0] || "",
        branch_names: finalBranches,
        company_name: finalCompanies[0] || "",
        company_names: finalCompanies,
        images: images.length > 0 ? images : formData.images
      };
      if (isEdit) {
        if (payload.global_ref_id) {
          await axios.put(`${baseUrl}/api/combo-offer/bulk/${payload.global_ref_id}`, payload, { headers: getHeaders() });
        } else {
          await axios.put(`${baseUrl}/api/combo-offer/${payload._id}`, payload, { headers: getHeaders() });
        }
      } else {
        await axios.post(`${baseUrl}/api/combo-offer`, payload, { headers: getHeaders() });
      }
      toast.success("Saved!");
      navigate("/admin");
    } catch (err) { toast.error("Save failed"); }
    finally { setLoading(false); setShowAssignmentModal(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const activeContext = localStorage.getItem('active_company') || 'All';
    if (activeContext === 'All' && selectedCompanies.length === 0 && showCompanyAssign) {
      setShowAssignmentModal(true);
      return;
    }

    if (selectedBranches.length === 0 && showBranchAssign && !isEdit) {
      setShowAssignmentModal(true);
      return;
    }

    await handleModalSave(e);
  };

  return (
    <div className="create-item-page">
      <div className="header sticky-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(-1)} style={{ margin: 0 }}>
            <FaArrowLeft /> Go Back
          </button>
        </div>

        <div className="header-center">
          <h2 className="page-title">{isEdit ? "Edit Offer" : "New Combo Offer"}</h2>
        </div>

        <div className="header-right">
          <div className="header-actions" style={{ display: 'flex', gap: '15px' }}>
            {showCompanyAssign && (
              <button
                type="button"
                className="customize-btn"
                onClick={() => setShowAssignmentModal(true)}
                style={{ background: '#eff6ff', color: '#3b82f6', border: '1.5px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 24px', height: '48px', minWidth: '130px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}
              >
                <FaUsers /> Company
              </button>
            )}

            {showBranchAssign && (
              <button
                type="button"
                className="customize-btn branch-btn"
                onClick={() => setShowAssignmentModal(true)}
                style={{ background: '#fff7ed', color: '#ea580c', border: '1.5px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 24px', height: '48px', minWidth: '130px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1)' }}
              >
                <FaMapMarkerAlt /> Branches
              </button>
            )}

            {isCompanyAdmin && (
              <button
                className="customize-btn"
                onClick={() => setShowCustomizeModal(true)}
                style={{ background: 'rgb(46, 204, 113)', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 24px', height: '48px', minWidth: '130px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(46, 204, 113, 0.2)' }}
              >
                <FaCog /> Customize
              </button>
            )}
            <button
              className="submit-btn"
              onClick={handleSave}
              disabled={loading}
              style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 24px', height: '48px', minWidth: '130px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', margin: 0, opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}
            >
              <FaSave />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="form-container" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px', padding: '30px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          {!getFieldHidden("description") && (
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: '800' }}>{getFieldLabel("description", "OFFER NAME").toUpperCase()}</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            </div>
          )}

          {!getFieldHidden("items") && (
            <div style={{ marginBottom: '25px' }} ref={dropdownRef}>
              <label style={{ display: 'block', fontWeight: '800' }}>{getFieldLabel("items", "COMPONENTS").toUpperCase()}</label>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} style={{ width: '100%', padding: '15px', border: '1px solid #3b82f6', borderRadius: '12px' }} />
              {isDropdownOpen && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto' }}>
                  {allItems.filter(i => (i.item_name || "").toLowerCase().includes(searchTerm.toLowerCase())).map(it => (
                    <div key={it._id} onClick={() => handleSelection('item', it._id)} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{it.item_name}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: it.component_type === 'Combo' ? '#fef08a' : it.component_type === 'Addon' ? '#bfdbfe' : '#e2e8f0', color: it.component_type === 'Combo' ? '#854d0e' : it.component_type === 'Addon' ? '#1e3a8a' : '#475569', fontWeight: '700' }}>
                          {it.component_type}
                        </span>
                      </div>
                      <span style={{ fontWeight: '700', color: '#3b82f6', fontSize: '13px' }}>{formatPrice(it.price || 0)}</span>
                    </div>
                  ))}
                  {allItems.filter(i => (i.item_name || "").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No components match your selection. Try assigning a different company/branch.</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            {selectedComponents.map((comp, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                background: '#f8fafc',
                borderRadius: '16px',
                marginBottom: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <img
                  src={getImageUrl(comp.data.image || comp.data.addon_image || comp.data.combo_image)}
                  alt=""
                  style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', background: '#fff' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>
                    {comp.data.item_name || comp.data.name1}
                  </div>
                  <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>
                    {formatPrice(comp.price)}
                  </div>
                </div>
                <button onClick={() => removeSelection(idx)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}>
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Dynamic Fields Section */}
          {doctypeFields
            .filter(f => !['description', 'items', 'total_price', 'offer_price', 'offer_start_time', 'offer_end_time', 'images'].includes(f.id))
            .filter(f => !f.hidden)
            .map(field => (
              <div key={field.id} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                  {field.label.toUpperCase()}
                </label>
                {field.type === 'Date' ? (
                  <input
                    type="date"
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                ) : field.type === 'Time' ? (
                  <input
                    type="time"
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                ) : field.type === 'Datetime' ? (
                  <input
                    type="datetime-local"
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                )}
              </div>
            ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
            {!getFieldHidden("total_price") && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800' }}>{getFieldLabel("total_price", "TOTAL VALUE").toUpperCase()}</label>
                <input type="number" value={formData.total_price || 0} disabled style={{ width: '100%', padding: '12px', background: '#f1f5f9', borderRadius: '10px' }} />
              </div>
            )}
            {!getFieldHidden("offer_price") && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6' }}>{getFieldLabel("offer_price", "OFFER PRICE").toUpperCase()}</label>
                <input type="number" value={formData.offer_price || ""} onChange={(e) => setFormData({ ...formData, offer_price: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #3b82f6', borderRadius: '10px' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {(!getFieldHidden("offer_start_time") || !getFieldHidden("offer_end_time")) && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800' }}><FaCalendarAlt /> Schedule</h3>
              {!getFieldHidden("offer_start_time") && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '5px' }}>{getFieldLabel("offer_start_time", "START TIME").toUpperCase()}</label>
                  <input type="datetime-local" value={formData.offer_start_time || ""} onChange={(e) => setFormData({ ...formData, offer_start_time: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </div>
              )}
              {!getFieldHidden("offer_end_time") && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '5px' }}>{getFieldLabel("offer_end_time", "END TIME").toUpperCase()}</label>
                  <input type="datetime-local" value={formData.offer_end_time || ""} onChange={(e) => setFormData({ ...formData, offer_end_time: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </div>
              )}
            </div>
          )}

          {!getFieldHidden("images") && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800' }}><FaImage /> {getFieldLabel("images", "OFFER IMAGES").toUpperCase()}</h3>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '15px', padding: '20px', textAlign: 'center', position: 'relative' }}>
                <FaCloudUploadAlt size={30} color="#3b82f6" />
                <div style={{ fontSize: '12px', fontWeight: '700' }}>Upload New Images</div>
                <input type="file" multiple onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                {previewUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', height: '80px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px' }}><FaTrash size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssignmentModal && (
        <div className="add-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="add-modal" style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800' }}>Company & Branch Assignments</span>
              <button onClick={() => setShowAssignmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>
            <div className="modal-body" style={{ marginTop: '20px' }}>
              {showCompanyAssign && (
                <div className="assignment-card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '10px' }}><FaUsers /> Select Company *</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {companyOptions.map((comp, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#eff6ff', borderRadius: '12px', border: '1.5px solid #dbeafe', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input type="checkbox" checked={selectedCompanies.includes(comp)} onChange={(e) => { setSelectedCompanies(prev => e.target.checked ? [...prev, comp] : prev.filter(c => c !== comp)); }} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                        {comp}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {showBranchAssign && (
                <div className="assignment-card">
                  <h4 style={{ color: '#10b981', marginBottom: '10px' }}><FaMapMarkerAlt /> Select Branch</h4>
                  <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {availableBranches.map((branch, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #d1fae5', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                        <input type="checkbox" checked={selectedBranches.includes(branch)} onChange={(e) => { setSelectedBranches(prev => e.target.checked ? [...prev, branch] : prev.filter(b => b !== branch)); }} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                        {branch}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => setShowAssignmentModal(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#f1f5f9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleModalSave} disabled={loading} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerCustomizationModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onRefresh={() => fetchDoctypeFields(baseUrl)}
        targetDocType="Combo Offer"
      />
    </div>
  );
};

export default ComboOffer;
