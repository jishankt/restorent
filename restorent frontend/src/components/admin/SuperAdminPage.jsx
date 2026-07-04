import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserShield, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaPlus, FaTrash, FaTimes, FaGlobe, FaBuilding, FaCodeBranch, FaUsers, FaExclamationTriangle, FaCheckCircle, FaFileDownload, FaEdit } from 'react-icons/fa';

const SuperAdminPage = () => {
  const [credentials, setCredentials] = useState(null);
  const [additionalAdmins, setAdditionalAdmins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCredentialsAndAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      const credRes = await axios.get('/api/super-admin-credentials');
      setCredentials(credRes.data);

      const adminRes = await axios.get('/api/super-admins', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Context': encodeURIComponent(userStr)
        }
      });
      setAdditionalAdmins(adminRes.data || []);

      const statsRes = await axios.get('/api/superadmin/dashboard', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Context': encodeURIComponent(userStr)
        }
      });
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to load super admin dashboard details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentialsAndAdmins();
  }, []);

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (editingAdmin) {
        await axios.put(`/api/super-admins/${editingAdmin._id}`, newAdmin, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Context': encodeURIComponent(userStr) 
          }
        });
      } else {
        await axios.post('/api/super-admins', newAdmin, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Context': encodeURIComponent(userStr) 
          }
        });
      }
      
      setIsModalOpen(false);
      setEditingAdmin(null);
      setNewAdmin({ username: '', email: '', password: '' });
      fetchCredentialsAndAdmins();
    } catch (err) {
      setModalError(err.response?.data?.error || (editingAdmin ? 'Failed to update super admin' : 'Failed to create super admin'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this super admin?")) return;
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      await axios.delete(`/api/super-admins/${adminId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Context': encodeURIComponent(userStr) 
        }
      });
      fetchCredentialsAndAdmins();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete super admin');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1', backgroundColor: '#0f172a', minHeight: '100vh' }}>Loading Dashboard Data...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', color: '#f87171', textAlign: 'center', backgroundColor: '#0f172a', minHeight: '100vh' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#f1f5f9' }}>
      
      {/* SaaS Dashboard Stats Overview */}
      {stats && (
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '25px', color: '#ffffff' }}>SaaS Super Admin Dashboard</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '1.5rem' }}>
                <FaGlobe />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Tenants</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff' }}>{stats.total_tenants}</div>
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                <FaBuilding />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Companies</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff' }}>{stats.total_companies}</div>
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#7c2d12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', fontSize: '1.5rem' }}>
                <FaCodeBranch />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Branches</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff' }}>{stats.total_branches}</div>
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#581c87', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontSize: '1.5rem' }}>
                <FaUsers />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Users</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff' }}>{stats.total_users}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Subscription Distribution */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '700' }}>Subscription Plans Overview</h3>
              {Object.entries(stats.plans_distribution).map(([plan, count]) => (
                <div key={plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#cbd5e1' }}>{plan} Plan</span>
                  <span style={{ fontWeight: '700', color: '#6366f1' }}>{count} tenants</span>
                </div>
              ))}
            </div>

            {/* Profile Survey Distribution */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '700' }}>Profiling Survey Metrics</h3>
              {Object.entries(stats.survey_operation_types).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#cbd5e1' }}>{type}</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>{count} restaurants</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Alerts Table */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaExclamationTriangle style={{ color: '#eab308' }} /> Compliance & Registrations Alerts
            </h3>
            {stats.compliance_alerts.length === 0 ? (
              <div style={{ padding: '20px', background: '#0f172a', borderRadius: '10px', color: '#94a3b8', textAlign: 'center' }}>
                All registered tenants compliance documents are active and valid.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px', fontWeight: '600' }}>Tenant Name</th>
                      <th style={{ padding: '12px', fontWeight: '600' }}>Doc Type</th>
                      <th style={{ padding: '12px', fontWeight: '600' }}>Reg Number</th>
                      <th style={{ padding: '12px', fontWeight: '600' }}>Expiry Date</th>
                      <th style={{ padding: '12px', fontWeight: '600' }}>Status / Days Left</th>
                      <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center' }}>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.compliance_alerts.map((alert, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>{alert.tenant_name}</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{alert.doc_type}</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{alert.reg_number}</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{alert.expiry_date}</td>
                        <td style={{ padding: '12px' }}>
                          {alert.days_left < 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: '700' }}>Expired ({Math.abs(alert.days_left)} days ago)</span>
                          ) : alert.days_left <= 30 ? (
                            <span style={{ color: '#f97316', fontWeight: '700' }}>Expires soon ({alert.days_left} days left)</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: '700' }}>Active ({alert.days_left} days left)</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {alert.file_name ? (
                            <a href={`/static/uploads/${alert.file_name}`} target="_blank" rel="noreferrer" style={{ color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaFileDownload size={18} />
                            </a>
                          ) : (
                            <span style={{ color: '#475569' }}>No File</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Master Credentials Card */}
      <div style={{
        backgroundColor: '#1e293b', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        padding: '30px', border: '1px solid #334155', borderTop: '6px solid #6366f1', marginBottom: '30px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#312e81',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
            color: '#6366f1', fontSize: '2rem'
          }}>
            <FaUserShield />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.4rem', margin: '0 0 5px 0' }}>Master Credentials</h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>System-wide master super admin logins</p>
        </div>

        {credentials && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaEnvelope /> Master Admin Email
              </label>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.95rem' }}>
                {credentials.email}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaLock /> Master Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  readOnly
                  style={{
                    width: '100%', padding: '12px 40px 12px 12px', backgroundColor: '#0f172a',
                    border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9',
                    fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Admins Section */}
      <div style={{
        backgroundColor: '#1e293b', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', padding: '30px', border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.2rem', margin: 0 }}>Additional Super Admins</h2>
          <button 
            onClick={() => {
              setEditingAdmin(null);
              setNewAdmin({ username: '', email: '', password: '' });
              setIsModalOpen(true);
            }}
            style={{
              backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            <FaPlus /> Create New
          </button>
        </div>

        {additionalAdmins.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#0f172a', borderRadius: '8px' }}>
            No additional super admins created yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px', fontWeight: '600' }}>Username</th>
                  <th style={{ padding: '12px', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center' }}>Role</th>
                  <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {additionalAdmins.map((admin) => (
                  <tr key={admin._id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', color: '#ffffff', fontWeight: '500' }}>{admin.username}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{admin.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#312e81', color: '#6366f1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                        Super Admin
                      </span>
                    </td>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setEditingAdmin(admin);
                          setNewAdmin({ username: admin.username, email: admin.email, password: '' });
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Super Admin"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteAdmin(admin._id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Super Admin"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem' }}>{editingAdmin ? 'Edit Super Admin' : 'Create Super Admin'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingAdmin(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <FaTimes size={20} />
              </button>
            </div>

            {modalError && <div style={{ padding: '10px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>{modalError}</div>}

            <form onSubmit={handleSubmitAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>Username *</label>
                <input 
                  type="text" 
                  value={newAdmin.username} 
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #475569', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: '#0f172a', color: '#ffffff' }}
                  placeholder="admin_name"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>Email Address *</label>
                <input 
                  type="email" 
                  value={newAdmin.email} 
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #475569', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: '#0f172a', color: '#ffffff' }}
                  placeholder="admin@kylesolution.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>Password {editingAdmin ? '(Leave blank to keep current)' : '*'}</label>
                <input 
                  type="password" 
                  value={newAdmin.password} 
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required={!editingAdmin}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #475569', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: '#0f172a', color: '#ffffff' }}
                  placeholder={editingAdmin ? "Leave blank to keep current password" : "••••••••"}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingAdmin(null); }} style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? (editingAdmin ? 'Updating...' : 'Creating...') : (editingAdmin ? 'Update Admin' : 'Create Admin')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
