import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Settings, Eye, EyeOff, FileEdit, Building2, GitBranch } from 'lucide-react';

function ManageCompanies() {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -- Standard Headers Helper --
  const getHeaders = (comp = null) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', adminUsername: '', adminPassword: '', email: '' });
  const [showPassword, setShowPassword] = useState(false);

  const fetchHierarchy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tenants-hierarchy', { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHierarchy(data);
      }
    } catch (err) {
      setError("Failed to fetch companies hierarchy");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleEditClick = async (companyName) => {
    setEditingCompany(companyName);
    setEditForm({ name: companyName, adminUsername: '', adminPassword: '', email: '' });
    
    // Fetch current admin details
    try {
      const response = await fetch(`/api/company-admin-details/${encodeURIComponent(companyName)}`, {
        headers: getHeaders(companyName)
      });
      if (response.ok) {
        const data = await response.json();
        setEditForm(prev => ({ 
          ...prev, 
          adminUsername: data.username || '', 
          adminPassword: data.password || '',
          email: data.email || '' 
        }));
      } else if (response.status === 404) {
        setEditForm(prev => ({
          ...prev,
          adminUsername: '',
          adminPassword: '',
          email: ''
        }));
      } else {
        console.error("Failed to fetch admin details");
      }
    } catch (err) {
      console.error("Failed to fetch admin details");
    }
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/companies-public/${encodeURIComponent(editingCompany)}`, {
        method: 'PUT',
        headers: getHeaders(editingCompany),
        body: JSON.stringify({
          adminUsername: editForm.adminUsername,
          adminPassword: editForm.adminPassword,
          email: editForm.email
        })
      });
      if (!response.ok) throw new Error("Update failed");
      setSuccess("Company updated successfully");
      setShowEditModal(false);
      fetchHierarchy();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (companyName) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}" and all its data?`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies-public/${encodeURIComponent(companyName)}`, {
        method: 'DELETE',
        headers: getHeaders(companyName)
      });
      if (!response.ok) throw new Error("Delete failed");
      setSuccess("Company deleted successfully");
      fetchHierarchy();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a' },
    backBtn: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '600', border: 'none', background: 'none' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    cardTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' },
    badge: { display: 'inline-block', marginTop: '8px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569' },
    actions: { display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' },
    actionBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
    editBtn: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    manageBtn: { backgroundColor: '#f3e8ff', color: '#7e22ce' },
    deleteBtn: { backgroundColor: '#fee2e2', color: '#ef4444' },
    parentTenant: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '16px', fontSize: '14px', color: '#475569' },
    childSection: { marginTop: 'auto', paddingTop: '16px' },
    childTitle: { fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
    branchList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    branchItem: { padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#334155', border: '1px solid #e2e8f0' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
    submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    cancelBtn: { width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }
  };

  // Flatten companies from hierarchy
  let allCompanies = [];
  hierarchy.forEach(item => {
    item.companies.forEach(compObj => {
      allCompanies.push({
        ...compObj.company,
        parent_tenant: item.tenant,
        branches: compObj.branches
      });
    });
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 style={styles.title}>Manage Companies</h1>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: '#10b981', marginBottom: '20px', padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>{success}</div>}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading companies...</div>
      ) : (
        <div style={styles.grid}>
          {allCompanies.map((comp, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.parentTenant}>
                <Building2 size={16} /> <strong>Parent Tenant:</strong> {comp.parent_tenant.tenant_name}
              </div>

              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{comp.company_name}</h3>
                  <span style={styles.badge}>{comp.company_code || 'No Code'}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button style={{ ...styles.actionBtn, ...styles.editBtn }} onClick={() => handleEditClick(comp.company_name)} title="Quick Admin Edit">
                  <Edit size={16} /> Edit
                </button>
                <button style={{ ...styles.actionBtn, ...styles.manageBtn }} onClick={() => navigate(`/onboard-organization?tenantId=${comp.parent_tenant._id || comp.parent_tenant.id}&step=4`)} title="Upgrade / Manage Modules">
                  <Settings size={16} /> Upgrade
                </button>
                <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(comp.company_name)} title="Delete Company">
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={styles.childSection}>
                <h4 style={styles.childTitle}><GitBranch size={16}/> Branches ({comp.branches.length})</h4>
                <div style={styles.branchList}>
                  {comp.branches.length === 0 ? (
                    <div style={{...styles.branchItem, borderStyle: 'dashed', color: '#94a3b8'}}>No branches onboarded</div>
                  ) : (
                    comp.branches.map((b, bIdx) => (
                      <div key={bIdx} style={styles.branchItem}>
                        <strong>{b.branch_name}</strong> {b.branch_code && <span style={{color:'#94a3b8'}}>({b.branch_code})</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
          {allCompanies.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
              No companies found
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>Edit Company Admin</h2>
            <p style={{ marginBottom: '20px', color: '#64748b' }}>Updating: <b>{editingCompany}</b></p>
            <form onSubmit={handleUpdate}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Admin Username</label>
                <input 
                  style={styles.input}
                  value={editForm.adminUsername}
                  onChange={(e) => setEditForm({...editForm, adminUsername: e.target.value})}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Admin Email Address</label>
                <input 
                  type="email"
                  style={styles.input}
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="admin@company.com"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Update Password (optional)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    value={editForm.adminPassword}
                    onChange={(e) => setEditForm({...editForm, adminPassword: e.target.value})}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" style={styles.submitBtn} disabled={isLoading}>
                {isLoading ? "Updating..." : "Save Changes"}
              </button>
              <button 
                type="button" 
                style={styles.cancelBtn} 
                onClick={() => setShowEditModal(false)}
              >Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCompanies;
