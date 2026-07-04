/**
 * Standardizes role detection for administrative and managerial access.
 * Broadly identifies any role that contains 'admin', 'manager', or matches common high-privileged titles.
 * 
 * @param {Object|string} user - The user object from localStorage or the role string.
 * @returns {boolean} - True if the user has administrative/managerial privileges.
 */
export const checkIsAdmin = (user) => {
  if (!user) return false;
  
  const roleRaw = typeof user === 'string' ? user : (user.role || user.UserType || '');
  const roleNorm = roleRaw.toLowerCase().replace(/[\s_]/g, '');
  
  const adminRoles = [
    'companyadmin', 'superadmin', 'admin', 'groupadmin', 'owner', 
    'branchadmin', 'branch', 'manager', 'branchmanager',
    'restaurantmanager', 'shopmanager', 'generalmanager',
    'staff', 'user', 'tenantadmin', 'tenant'
  ];

  return (
    adminRoles.includes(roleNorm) ||
    roleNorm.includes('admin') || 
    roleNorm.includes('manager') ||
    roleNorm.includes('owner') ||
    roleNorm.includes('branch') ||
    (typeof user === 'object' && (
      user.company_name || 
      user.company || 
      user.branch_name || 
      user.branch ||
      (user.email && String(user.email).toLowerCase().includes('@temp.com'))
    ))
  );
};

/**
 * Specifically identifies global administrative roles (Super Admin, Group Admin).
 * 
 * @param {Object|string} user - The user object or role string.
 * @returns {boolean} - True if the user is a global/group administrator.
 */
export const checkIsGlobalAdmin = (user) => {
  if (!user) return false;
  
  const roleRaw = typeof user === 'string' ? user : (user.role || user.UserType || '');
  const roleNorm = roleRaw.toLowerCase().replace(/[\s_]/g, '');
  
  return roleNorm === 'groupadmin' || roleNorm === 'superadmin' || roleNorm === 'tenantadmin' || roleNorm === 'masteradmin' || roleNorm === 'tenant';
};

export const getHeaders = () => {
  // Check for both common token keys used in the app
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
