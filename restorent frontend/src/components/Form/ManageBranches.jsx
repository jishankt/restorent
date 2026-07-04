import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Settings, Building2, Store, Eye, EyeOff } from 'lucide-react';

function ManageBranches() {
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
    if (comp) headers['X-Company-Name'] = comp;
    return headers;
  };

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingCompany, setEditingCompany] = useState('');
  const [editForm, setEditForm] = useState({ email: '', username: '', password: '' });
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
      setError("Failed to fetch branches hierarchy");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleEditClick = async (branch, companyName) => {
    setEditingBranch(branch.branch_name);
    setEditingCompany(companyName);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/branch-user-details/${encodeURIComponent(companyName)}/${encodeURIComponent(branch.branch_name)}`, {
        headers: getHeaders(companyName)
      });
      if (response.ok) {
        const data = await response.json();
        setEditForm({
          email: data.email || '',
          username: data.username || '',
          password: data.password || ''
        });
        setShowEditModal(true);
      } else if (response.status === 404) {
        // No user found, open modal with empty fields so they can create one
        setEditForm({
          email: '',
          username: '',
          password: ''
        });
        setShowEditModal(true);
      } else {
        setError("Failed to fetch branch details");
      }
    } catch (err) {
      setError("Failed to fetch branch details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/branches-public/${encodeURIComponent(editingCompany)}/${encodeURIComponent(editingBranch)}`, {
        method: 'PUT',
        headers: getHeaders(editingCompany),
        body: JSON.stringify(editForm)
      });
      if (!response.ok) throw new Error("Update failed");
      setSuccess("Branch updated successfully");
      setShowEditModal(false);
      fetchHierarchy();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (branchName, companyName) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/branches-public/${encodeURIComponent(companyName)}/${encodeURIComponent(branchName)}`, {
        method: 'DELETE',
        headers: getHeaders(companyName)
      });
      if (!response.ok) throw new Error("Delete failed");
      setSuccess("Branch deleted successfully");
      fetchHierarchy();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a' },
    backBtn: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '600', border: 'none', background: 'none' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
    branchName: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    parentInfo: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '20px', fontSize: '13px', color: '#475569' },
    actions: { display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
    actionBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
    editBtn: { backgroundColor: '#e0f2fe', color: '#0284c7' },
    manageBtn: { backgroundColor: '#f3e8ff', color: '#7e22ce' },
    deleteBtn: { backgroundColor: '#fee2e2', color: '#ef4444' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
    submitBtn: { width: '100%', padding: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
    cancelBtn: { width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }
  };

  // Flatten branches from hierarchy
  let allBranches = [];
  hierarchy.forEach(tItem => {
    tItem.companies.forEach(cItem => {
      cItem.branches.forEach(b => {
        allBranches.push({
          ...b,
          parent_company: cItem.company,
          parent_tenant: tItem.tenant
        });
      });
    });
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 style={styles.title}>Manage Branches</h1>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: '#10b981', marginBottom: '20px', padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>{success}</div>}

      {isLoading && !showEditModal ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading branches...</div>
      ) : (
        <div style={styles.grid}>
          {allBranches.map((br, idx) => (
            <div key={idx} style={styles.card}>
              <h3 style={styles.branchName}><Store size={20} color="#059669" /> {br.branch_name}</h3>
              
              <div style={styles.parentInfo}>
                <div><strong>Tenant:</strong> {br.parent_tenant.tenant_name}</div>
                <div><strong>Company:</strong> <Building2 size={14} style={{display:'inline', verticalAlign:'middle'}}/> {br.parent_company.company_name}</div>
                {br.branch_code && <div><strong>Code:</strong> {br.branch_code}</div>}
              </div>

              <div style={styles.actions}>
                <button style={{ ...styles.actionBtn, ...styles.editBtn }} onClick={() => handleEditClick(br, br.parent_company.company_name)} title="Edit Admin">
                  <Edit size={16} /> Edit
                </button>
                <button style={{ ...styles.actionBtn, ...styles.manageBtn }} onClick={() => navigate(`/onboard-organization?tenantId=${br.parent_tenant._id || br.parent_tenant.id}&step=4`)} title="Upgrade / Manage Modules">
                  <Settings size={16} /> Upgrade
                </button>
                <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(br.branch_name, br.parent_company.company_name)} title="Delete Branch">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {allBranches.length === 0 && !isLoading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
              No branches found
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>Edit Branch Admin</h2>
            <p style={{ marginBottom: '20px', color: '#64748b' }}>Updating: <b>{editingBranch}</b> ({editingCompany})</p>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={styles.label}>Email Address</label>
                  <input style={styles.input} type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={styles.label}>Username</label>
                  <input style={styles.input} value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} required />
                </div>
                  <label style={styles.label}>Update Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} style={{ ...styles.input, paddingRight: '40px', width: '100%', boxSizing: 'border-box' }} value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

export default ManageBranches;
