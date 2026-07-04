import React, { useState, useEffect, useMemo, useContext } from 'react';
import { UserContext } from '../../Context/UserContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserTie, FaPlus, FaTimes, FaSearch, FaUserShield, FaEdit } from 'react-icons/fa';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

const UserList = () => {
  const navigate = useNavigate();
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    phone_number: '',
    roleProfile: '',
    password: '',
    branch: '',
  });
  const [warningMessage, setWarningMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ password: '' });
  const [loading, setLoading] = useState(true);
  // baseUrl is now consumed from UserContext
  const [selectedFilter, setSelectedFilter] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [activeCompany, setActiveCompany] = useState(localStorage.getItem('active_company') || 'All');
  const [activeBranch, setActiveBranch] = useState(localStorage.getItem('active_branch') || 'All Branches');

  // Permission State
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [accessibleDesignations, setAccessibleDesignations] = useState([]); // NEW: For hierarchy access

  // Shared getHeaders is now consumed from UserContext

  // Fetch Permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const storedUser = JSON.parse(userStr);
          const role = storedUser.role;
          if (role) {
            setIsCompanyAdmin(role === 'company_admin');
            const url = baseUrl ? `${baseUrl}/api/role-permissions?role=${role}` : `/api/role-permissions?role=${role}`;
            const response = await fetch(url, { headers: getHeaders() });
            if (response.ok) {
              const data = await response.json();
              const perms = data.permissions || [];
              const accDesigs = data.accessible_designations || [];
              setAccessibleDesignations(accDesigs);
              
              const pagePerm = perms.find(p => p.pageId === 'user_management');
              if (pagePerm) {
                setCanWrite(pagePerm.canWrite === true);
                setCanDelete(pagePerm.canDelete === true);
                setCanCreate(pagePerm.canCreate === true);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions();
  }, [baseUrl]);

  // Filter options
  const filterOptions = [
    { label: 'Full Name', key: 'fullName' },
    { label: 'Status', key: 'status' },
    { label: 'User Type', key: 'userType' },
    { label: 'Phone Number', key: 'phoneNumber' },
    { label: 'ID', key: 'id' },
  ];

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply Hierarchy Filter for non-admins
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : {};
    const isAdmin = checkIsAdmin(userData);

    if (!isAdmin && accessibleDesignations && accessibleDesignations.length > 0) {
      const normalizedAcc = accessibleDesignations.map(d => String(d).trim().toLowerCase());
      result = result.filter(u => {
        if (!u) return false;
        // Always allow self
        if (u.id === userData.userId || u.id === userData._id || u.email === userData.email) return true;
        
        const uRole = String(u.userType || u.role || '').trim().toLowerCase();
        return normalizedAcc.includes(uRole);
      });
    }

    if (!selectedFilter || !filterValue.trim()) return result;
    const fieldKey = filterOptions.find(opt => opt.label === selectedFilter)?.key || '';
    if (!fieldKey) return result;
    return result.filter(user => {
      const value = user[fieldKey] || '';
      return value.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [users, selectedFilter, filterValue, filterOptions, accessibleDesignations]);

  // Use baseUrl from UserContext

  const fetchUsers = async () => {
    try {
      const apiUrl = `${baseUrl}/api/users`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      const data = await response.json();
      
      // Secondary Safety Measure: Deduplicate users by email on client-side
      const uniqueUsersMap = new Map();
      data.forEach(user => {
        const email = (user.email || '').toLowerCase().trim();
        if (email && !uniqueUsersMap.has(email)) {
          uniqueUsersMap.set(email, user);
        }
      });
      const uniqueUsersList = Array.from(uniqueUsersMap.values());

      setUsers(
        uniqueUsersList.map((user) => {
          // Robustly determine company display name from multi-tenant fields
          let displayCompany = 'All';
          if (Array.isArray(user.companies) && user.companies.length > 0) {
            displayCompany = user.companies.join(', ');
          } else if (Array.isArray(user.company_names) && user.company_names.length > 0) {
            displayCompany = user.company_names.join(', ');
          } else {
             displayCompany = user.company_name || user.company || 'All';
          }

          return {
            fullName: user.firstName || user.employeeName || user.name || 'Unknown',
            status: user.status || 'Active',
            userType: user.role || user.employeeDesignation || 'Bearer',
            phoneNumber: user.phone_number || user.phone || 'N/A',
            id: user.email,
            isTest: (user.is_test === true || user.is_test === 'true' || user.is_test === 1),
            companyName: displayCompany,
            branchName: (!user.branch_name || user.branch_name.toLowerCase() === 'all' || user.branch_name.toLowerCase() === 'all branches') 
                         ? 'N/A' 
                         : (user.branch_name || user.branch || user.pos_profile || 'N/A'),
            isEmployeeOnly: user.is_employee_only === true,
            email: user.email,
            plain_password: user.plain_password
          };
        })
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      setWarningMessage(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync Context from LocalStorage/Events
  useEffect(() => {
    const syncContext = () => {
      const comp = localStorage.getItem('active_company') || 'All';
      const br = localStorage.getItem('active_branch') || 'All Branches';
      if (comp !== activeCompany) setActiveCompany(comp);
      if (br !== activeBranch) setActiveBranch(br);
    };

    window.addEventListener('storage', syncContext);
    window.addEventListener('visibilityChange', syncContext);
    
    return () => {
      window.removeEventListener('storage', syncContext);
      window.removeEventListener('visibilityChange', syncContext);
    };
  }, [activeCompany, activeBranch]);

  // Fetch users when context or baseUrl changes
  useEffect(() => {
    if (baseUrl !== undefined) {
      fetchUsers();
      fetchBranches();
      const interval = setInterval(fetchUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [baseUrl, activeCompany, activeBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/branches`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches(branchData);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!canCreate) {
      setWarningMessage("You do not have permission to add users.");
      return;
    }
    if (!newUser.email || !newUser.firstName || !newUser.phone_number || !newUser.password || !newUser.roleProfile) {
      setWarningMessage('Please fill in all required fields.');
      return;
    }
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const active_company = localStorage.getItem('active_company');
    const active_branch = localStorage.getItem('active_branch');

    let company = 'POS 8';
    let branch = 'POS-001';

    if (userStr || active_company) {
      const storedUser = userStr ? JSON.parse(userStr) : {};
      company = active_company || storedUser.company || storedUser.company_name || 'POS 8';
      branch = active_branch || storedUser.branch || storedUser.branch_name || 'POS-001';
    }

    // SANITIZE COMPANY: Never allow 'All' for standard employees
    let finalCompany = active_company || company;
    if (finalCompany === 'All' && !isCompanyAdmin) {
        // If we are in 'All' mode but adding a standard user, fallback to the creator's primary company
        finalCompany = storedUser.company || storedUser.company_name || 'POS 8';
    }

    const newUserData = {
      email: newUser.email,
      firstName: newUser.firstName,
      phone_number: newUser.phone_number,
      role: newUser.roleProfile.toLowerCase(), 
      password: newUser.password,
      status: 'Active',
      company: finalCompany,
      companies: [finalCompany], // Ensure parity with multi-tenant structure
      pos_profile: isCompanyAdmin ? newUser.branch : (active_branch || branch),
      branch: isCompanyAdmin ? newUser.branch : (active_branch || branch)
    };
    try {
      setLoading(true);
      const apiUrl = `${baseUrl}/api/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getHeaders(isCompanyAdmin ? newUser.branch : null),
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }
      await fetchUsers();
      setNewUser({ email: '', firstName: '', phone_number: '', roleProfile: '', password: '' });
      setShowAddUserForm(false);
      setWarningMessage('User added successfully! You can now login with these credentials.');
    } catch (error) {
      console.error('Error adding user:', error);
      setWarningMessage(`Failed to add user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (email) => {
    if (!canDelete) {
      setWarningMessage("You do not have permission to delete users.");
      return;
    }
    setUserToDelete(email);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      const apiUrl = `${baseUrl}/api/users/${userToDelete}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      await fetchUsers();
      setWarningMessage('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      setWarningMessage(`Failed to delete user: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };

    const handleEditUser = (user) => {
      if (!canWrite) {
        setWarningMessage("You do not have permission to edit users.");
        return;
      }
      setEditingUser(user);
      setEditForm({ password: user.plain_password || '' });
      setIsEditModalOpen(true);
    };

    const saveEditUser = async () => {
      try {
        setLoading(true);
        const apiUrl = `${baseUrl}/api/users/${editingUser.email}`;
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(editForm),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }
        await fetchUsers();
        setWarningMessage('User credentials updated successfully!');
        setIsEditModalOpen(false);
        setEditingUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
        setWarningMessage(`Failed to update user: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const roleProfileOptions = ['Bearer', 'Admin', 'Manager', 'Captain', 'Kitchen', 'Cashier'];

  if (loading && users.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#3498db',
          fontSize: '18px'
        }}>
          <FaUserTie style={{ fontSize: '48px', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Fixed Back Button in Top-Left Corner */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
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
        disabled={loading}
      >
        <FaArrowLeft /> Back to Admin
      </button>

      {/* Main Container */}
      <div style={{
        maxWidth: '1250px',
        margin: '80px auto 20px',
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header with Title and Add New Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #3498db'
        }}>
          <div></div>
          <h2 style={{
            textAlign: 'center',
            color: '#2c3e50',
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaUserTie style={{ color: '#3498db', fontSize: '2rem' }} />
            User List ({filteredUsers.length})
          </h2>
          <button
            onClick={() => setShowAddUserForm(true)}
            style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(52, 152, 219, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(52, 152, 219, 0.3)';
            }}
            disabled={loading}
          >
            <FaPlus /> Add User
          </button>
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c8e6c9 100%)',
            color: '#155724',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #28a745',
            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            position: 'relative'
          }}>
            <FaSearch style={{ fontSize: '1.2rem', color: '#27ae60' }} />
            {warningMessage}
            <button
              onClick={() => setWarningMessage('')}
              style={{
                position: 'absolute',
                top: '5px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#27ae60',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* User List Layout - Sidebar and Main Content */}
        <div style={{
          display: 'flex',
          gap: '20px',
          minHeight: '600px'
        }}>
          {/* Sidebar - Filters */}
          <div style={{
            width: '250px',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontWeight: '600' }}>Filters</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>Filter By</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                marginBottom: '10px'
              }}>
                {filterOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedFilter(option.label)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: selectedFilter === option.label ? '#3498db' : '#ecf0f1',
                      color: selectedFilter === option.label ? '#ffffff' : '#2c3e50',
                      border: `1px solid ${selectedFilter === option.label ? '#2980b9' : '#bdc3c7'}`,
                      borderRadius: '15px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: selectedFilter === option.label ? '600' : '500',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      if (selectedFilter !== option.label) {
                        e.target.style.backgroundColor = '#d6eaf8';
                        e.target.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedFilter !== option.label) {
                        e.target.style.backgroundColor = '#ecf0f1';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedFilter && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <label style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>
                    Enter {selectedFilter}:
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      placeholder={`Search for ${selectedFilter.toLowerCase()}`}
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #3498db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                      onBlur={(e) => e.target.style.borderColor = '#3498db'}
                    />
                    <button
                      onClick={() => {
                        setSelectedFilter('');
                        setFilterValue('');
                      }}
                      disabled={loading}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - User List Table and Form */}
          <div style={{ flex: 1 }}>
            {/* User List Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>User List</h3>
            </div>

            {/* Users Table */}
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: '#ffffff'
                  }}>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Full Name</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Status</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>User Type</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Phone Number</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      minWidth: '200px',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>ID</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Test User</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Company</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Branch</th>
                    <th style={{
                      padding: '15px 12px',
                      border: 'none',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #e9ecef',
                          transition: 'all 0.2s ease',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
                        }}
                      >
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#2c3e50'
                        }}>{user.fullName}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#27ae60',
                          fontWeight: '500'
                        }}>{user.status}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#3498db',
                          fontWeight: '500'
                        }}>{user.userType}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#2c3e50'
                        }}>{user.phoneNumber}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#2c3e50'
                        }}>{user.id}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          whiteSpace: 'nowrap',
                          color: '#e67e22',
                          fontWeight: '500'
                        }}>{user.isTest ? 'Yes' : 'No'}</td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#2c3e50',
                          fontSize: '0.85rem'
                        }}>
                          {user.companyName || 'N/A'}
                        </td>
                        <td style={{
                          padding: '15px 12px',
                          borderRight: '1px solid #e9ecef',
                          color: '#2c3e50',
                          fontSize: '0.85rem'
                        }}>
                          {user.branchName || 'N/A'}
                        </td>
                        <td style={{ padding: '15px 12px' }}>
                          <button
                            onClick={() => navigate('/role-permissions', { state: { role: user.userType, user: user.fullName, isTest: user.isTest, company: user.companyName, branch: user.branchName } })}
                            style={{
                              padding: '6px 10px',
                              background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              transition: 'all 0.3s ease',
                              marginRight: '8px',
                              boxShadow: '0 2px 4px rgba(142, 68, 173, 0.3)'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(142, 68, 173, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(142, 68, 173, 0.3)';
                            }}
                            disabled={loading}
                          >
                            <FaUserShield /> Perms
                          </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              style={{
                                padding: '6px 10px',
                                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: loading || user.isTest ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: loading || user.isTest ? 0.6 : 1,
                              }}
                              disabled={loading || user.isTest}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.email)}
                            style={{
                              padding: '6px 10px',
                              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(231, 76, 60, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.3)';
                            }}
                            disabled={loading || user.isTest}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#7f8c8d',
                        fontSize: '1.1rem'
                      }}>
                        {filterValue.trim() ? `No users found matching "${filterValue}" in ${selectedFilter}.` : 'No users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div style={{
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '0.9rem',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '0 0 10px 10px'
            }}>
              Showing {filteredUsers.length} of {users.length} users
            </div>

            {/* Add User Form Modal */}
            {showAddUserForm && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowAddUserForm(false); }}
              >
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '30px',
                  borderRadius: '15px',
                  width: '90%',
                  maxWidth: '500px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  <h3 style={{
                    color: '#2c3e50',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    margin: '0 auto'
                  }}>
                    <FaPlus style={{ color: '#3498db', fontSize: '1.5rem' }} />
                    Add New User
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleNewUserChange}
                        placeholder="e.g., test@example.com"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={newUser.firstName}
                        onChange={handleNewUserChange}
                        placeholder="e.g., Test"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={newUser.phone_number}
                        onChange={handleNewUserChange}
                        placeholder="e.g., 1234567890"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        placeholder="e.g., ****"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #3498db',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          outline: 'none',
                          background: '#f8f9fa',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                        onBlur={(e) => e.target.style.borderColor = '#3498db'}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        textAlign: 'left'
                      }}>Role Profile</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          list="roles"
                          name="roleProfile"
                          value={newUser.roleProfile}
                          onChange={handleNewUserChange}
                          placeholder="Select or Type New Role..."
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #3498db',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            outline: 'none',
                            background: '#f8f9fa',
                            transition: 'border-color 0.3s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#2980b9'}
                          onBlur={(e) => e.target.style.borderColor = '#3498db'}
                        />
                        <datalist id="roles">
                          {roleProfileOptions.map((role) => (
                            <option key={role} value={role} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    {isCompanyAdmin && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          textAlign: 'left'
                        }}>Branch</label>
                        <select
                          name="branch"
                          value={newUser.branch}
                          onChange={handleNewUserChange}
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #3498db',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            outline: 'none',
                            background: '#f8f9fa',
                            transition: 'border-color 0.3s ease'
                          }}
                        >
                          <option value="">Select Branch</option>
                          {availableBranches.map(branch => (
                            <option key={branch} value={branch}>{branch}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(false)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.3s ease',
                        boxShadow: '0 2px 4px rgba(149, 165, 166, 0.3)'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddUser}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background-color 0.3s ease',
                        boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#219150'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Credentials Modal */}
            {isEditModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  width: '400px',
                  maxWidth: '90%',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Quick Edit Credentials</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: 'bold' }}>User Email</label>
                    <input type="text" value={editingUser?.email || ''} disabled style={{
                      width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#f9f9f9', color: '#7f8c8d'
                    }} />
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: 'bold' }}>New Password</label>
                    <input type="text" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Enter new password" style={{
                      width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3498db', outline: 'none'
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} style={{
                      padding: '10px 16px', backgroundColor: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}>Cancel</button>
                    <button onClick={saveEditUser} disabled={loading} style={{
                      padding: '10px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer'
                    }}>Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
              >
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '30px',
                  borderRadius: '15px',
                  width: '90%',
                  maxWidth: '400px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ color: '#c0392b', marginBottom: '15px' }}>Confirm Deletion</h3>
                  <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Are you sure you want to delete this user? This action cannot be undone.</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
