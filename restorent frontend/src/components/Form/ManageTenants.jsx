import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';

function ManageTenants() {
  const navigate = useNavigate();
  const { baseUrl } = useContext(UserContext);
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Expanded state
  const [expandedTenants, setExpandedTenants] = useState({});
  const [expandedCompanies, setExpandedCompanies] = useState({});

  // Inline Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', admin_username: '', admin_password: '' });

  // -- Standard Headers Helper --
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchHierarchy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl || ''}/api/tenants-hierarchy`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHierarchy(data);
      } else {
        setError("Failed to fetch tenants hierarchy");
      }
    } catch (err) {
      setError("Failed to fetch tenants hierarchy");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleDelete = async (tenantId) => {
    if (!window.confirm("DATA LOSS WARNING: Are you sure you want to delete this tenant and ALL associated companies, branches, and operational data? This action cannot be undone.")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl || ''}/api/tenants-public/${tenantId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        setSuccess("Tenant and all data deleted successfully");
        fetchHierarchy();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      setError("Failed to delete tenant");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`DATA LOSS WARNING: Are you sure you want to delete company "${companyName}" and ALL its branches and data? This action cannot be undone.`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl || ''}/api/companies-public/${companyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        setSuccess("Company and its data deleted successfully");
        fetchHierarchy();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      setError("Failed to delete company");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`DATA LOSS WARNING: Are you sure you want to delete branch "${branchName}" and ALL its data? This action cannot be undone.`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl || ''}/api/branches-public/${branchId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        setSuccess("Branch and its data deleted successfully");
        fetchHierarchy();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      setError("Failed to delete branch");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTenant = (tenantId) => {
    setExpandedTenants(prev => ({ ...prev, [tenantId]: !prev[tenantId] }));
  };

  const toggleCompany = (companyId) => {
    setExpandedCompanies(prev => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const openInlineEdit = (tenant) => {
    setEditingTenant(tenant);
    setEditForm({ 
      email: tenant.email || '', 
      admin_username: tenant.admin_username || '', 
      admin_password: tenant.admin_password || '' 
    });
    setIsEditModalOpen(true);
  };

  const submitInlineEdit = async () => {
    if (!editingTenant) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl || ''}/api/tenants-public/${editingTenant._id || editingTenant.tenant_id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        setSuccess("Tenant credentials updated successfully");
        setIsEditModalOpen(false);
        fetchHierarchy();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      setError("Failed to update tenant credentials");
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' },
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    cardTitle: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
    badge: { display: 'inline-block', marginTop: '8px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: '#e0e7ff', color: '#4338ca' },
    actions: { display: 'flex', gap: '8px' },
    actionBtn: { padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    editBtn: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    fullEditBtn: { backgroundColor: '#f3e8ff', color: '#7e22ce', fontWeight: '600', padding: '8px 16px', fontSize: '14px' },
    deleteBtn: { backgroundColor: '#fee2e2', color: '#ef4444' },
    detailRow: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', fontSize: '14px' },
    label: { color: '#64748b', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' },
    value: { color: '#1e293b', fontWeight: '500' },
    hierarchySection: { marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
    compHeader: { display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px', cursor: 'pointer' },
    compTitle: { margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' },
    branchList: { paddingLeft: '40px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
    branchItem: { padding: '10px 16px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '400px', maxWidth: '90%' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 style={styles.title}>Manage Tenants</h1>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: '#10b981', marginBottom: '20px', padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>{success}</div>}

      {isLoading && !isEditModalOpen ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading hierarchy...</div>
      ) : (
        <div>
          {hierarchy.map((item, idx) => {
            const t = item.tenant;
            const tId = t._id || t.tenant_id;
            const isExpanded = expandedTenants[tId];
            return (
              <div key={idx} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle} onClick={() => toggleTenant(tId)}>
                      {isExpanded ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                      {t.tenant_name}
                    </h3>
                    <span style={styles.badge}>{t.subscription_plan} Plan</span>
                  </div>
                  <div style={styles.actions}>
                    <button style={{ ...styles.actionBtn, ...styles.fullEditBtn }} onClick={() => navigate(`/onboard-organization?tenantId=${tId}`)} title="Full Organization Edit">
                      <Settings size={16} style={{marginRight: '6px'}}/> Full Edit
                    </button>
                    <button style={{ ...styles.actionBtn, ...styles.editBtn }} onClick={() => openInlineEdit(t)} title="Quick Edit Credentials">
                      <Edit2 size={18} />
                    </button>
                    <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(tId)} title="Delete Tenant">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '10px' }}>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Email Address</span>
                    <span style={styles.value}>{t.email}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Phone Number</span>
                    <span style={styles.value}>{t.phone || 'N/A'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.label}>Status</span>
                    <span style={{ ...styles.value, color: t.status === 'Active' ? '#10b981' : '#f59e0b' }}>{t.status || 'Active'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.hierarchySection}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Companies ({item.companies.length})</h4>
                    {item.companies.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No companies onboarded for this tenant.</p>
                    ) : (
                      item.companies.map((compObj, cIdx) => {
                        const c = compObj.company;
                        const cId = c._id;
                        const isCompExpanded = expandedCompanies[cId];
                        return (
                          <div key={cIdx}>
                            <div style={{...styles.compHeader, display: 'flex', alignItems: 'center'}} onClick={() => toggleCompany(cId)}>
                              <div style={{ flex: 1 }}>
                                <h5 style={styles.compTitle}>
                                  {isCompExpanded ? <ChevronUp size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/> : <ChevronDown size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/>}
                                  {c.company_name} <span style={{color: '#94a3b8', fontWeight: '400', fontSize: '12px'}}>({c.company_code})</span>
                                </h5>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{fontSize: '12px', color: '#64748b'}}>{compObj.branches.length} Branches</span>
                                <button 
                                  style={{ ...styles.actionBtn, ...styles.deleteBtn, padding: '4px', borderRadius: '4px' }} 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCompany(cId, c.company_name); }} 
                                  title="Delete Company"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            {isCompExpanded && (
                              <div style={styles.branchList}>
                                {compObj.branches.length === 0 ? (
                                  <div style={{...styles.branchItem, borderStyle: 'solid', backgroundColor: '#f8fafc', color: '#94a3b8'}}>No branches found</div>
                                ) : (
                                  compObj.branches.map((b, bIdx) => (
                                    <div key={bIdx} style={{...styles.branchItem, alignItems: 'center'}}>
                                      <span><strong>{b.branch_name}</strong> <span style={{color: '#94a3b8'}}>({b.branch_code})</span></span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span>{b.status || 'Active'}</span>
                                        <button 
                                          style={{ ...styles.actionBtn, ...styles.deleteBtn, padding: '4px', borderRadius: '4px' }} 
                                          onClick={() => handleDeleteBranch(b._id, b.branch_name)} 
                                          title="Delete Branch"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {hierarchy.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
              No tenants found
            </div>
          )}
        </div>
      )}

      {/* Inline Edit Modal */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{marginTop: 0, color: '#0f172a'}}>Quick Edit Credentials</h2>
            <p style={{color: '#64748b', fontSize: '14px', marginBottom: '20px'}}>Update details for <strong>{editingTenant?.tenant_name}</strong></p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tenant Email</label>
              <input type="email" style={styles.input} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email address" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Username (Optional)</label>
              <input type="text" style={styles.input} value={editForm.admin_username} onChange={e => setEditForm({...editForm, admin_username: e.target.value})} placeholder="New admin username" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Password (Optional)</label>
              <input type="text" style={styles.input} value={editForm.admin_password} onChange={e => setEditForm({...editForm, admin_password: e.target.value})} placeholder="New password" />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                onClick={submitInlineEdit}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTenants;
