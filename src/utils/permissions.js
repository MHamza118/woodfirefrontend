// User Permission System for Restaurant Admin Dashboard

// Define permissions for each user type
export const USER_PERMISSIONS = {
  'owner': {
    // Full permissions - can access everything
    employees: ['view', 'create', 'edit', 'delete', 'manage_status'],
    users: ['view', 'create', 'edit', 'delete'],
    locations: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete', 'manage_status'],
    onboarding: ['view', 'create', 'edit', 'delete'],
    training: ['view', 'create', 'edit', 'delete'],
    communication: ['view', 'create', 'edit', 'delete'],
    tableTracking: ['view', 'create', 'edit', 'delete'],
    performance: ['view', 'create', 'edit', 'delete', 'manage_reports'],
    tickets: ['view', 'create', 'edit', 'delete', 'assign', 'manage_status'],
    recognition: ['view', 'create', 'edit', 'delete', 'give_shoutouts', 'give_rewards', 'award_badges'],
    faq: ['view', 'create', 'edit', 'delete'],
    timeTracking: ['view', 'manage_approvals', 'view_reports'],
    timeOff: ['view', 'manage_approvals'],
    notifications: ['view', 'create', 'edit', 'delete'],
    allLocations: true, // Can access all locations
    canManageUsers: true,
    canViewReports: true,
    canManageSystem: true
  },
  
  'admin': {
    // Full admin permissions similar to owner but may be location-restricted
    employees: ['view', 'create', 'edit', 'delete', 'manage_status'],
    users: ['view', 'create', 'edit', 'delete'],
    locations: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete', 'manage_status'],
    onboarding: ['view', 'create', 'edit', 'delete'],
    training: ['view', 'create', 'edit', 'delete'],
    communication: ['view', 'create', 'edit', 'delete'],
    tableTracking: ['view', 'create', 'edit', 'delete'],
    performance: ['view', 'create', 'edit', 'delete', 'manage_reports'],
    tickets: ['view', 'create', 'edit', 'delete', 'assign', 'manage_status'],
    recognition: ['view', 'create', 'edit', 'delete', 'give_shoutouts', 'give_rewards', 'award_badges'],
    faq: ['view', 'create', 'edit', 'delete'],
    timeTracking: ['view', 'manage_approvals', 'view_reports'],
    timeOff: ['view', 'manage_approvals'],
    notifications: ['view', 'create', 'edit', 'delete'],
    allLocations: false, // Admin may be location-restricted unlike Owner
    canManageUsers: true,
    canViewReports: true,
    canManageSystem: true
  },
  
  'manager': {
    // Manage onboarding and communication within assigned location
    employees: [],
    users: [],
    locations: [],
    customers: ['view', 'create', 'edit', 'manage_status'],
    onboarding: ['view', 'create', 'edit'],
    training: [],
    communication: ['view', 'create', 'edit', 'delete'],
    tableTracking: ['view', 'edit'],
    performance: ['view', 'create', 'edit'],
    tickets: ['view', 'create', 'edit', 'assign'],
    recognition: ['view', 'create', 'give_shoutouts', 'give_rewards', 'award_badges'],
    faq: [],
    timeTracking: ['view', 'manage_approvals'],
    timeOff: ['view'],
    notifications: [],
    allLocations: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSystem: false
  },
  
  'hiring_manager': {
    // Manage employee onboarding, interviews, and candidate status
    employees: ['view', 'manage_status'],
    users: [],
    locations: [],
    customers: ['view'],
    onboarding: ['view', 'create', 'edit'],
    training: [],
    communication: [],
    tableTracking: [],
    faq: [],
    timeTracking: [],
    notifications: ['view'],
    allLocations: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSystem: false
  },
  
  'expo': {
    // Table management only - restrict from admin modules
    employees: [],
    users: [],
    locations: [],
    customers: [],
    onboarding: [],
    training: [],
    communication: [],
    tableTracking: [],
    faq: [],
    timeTracking: [],
    notifications: [],
    allLocations: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSystem: false,
    isExpoOnly: true
  }
}

// Check if a user has specific permission for a module
export const hasPermission = (userType, module, action) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  const permissions = USER_PERMISSIONS[userType]
  const modulePermissions = permissions[module] || []
  
  return modulePermissions.includes(action)
}

// Check if user can access a specific tab/module
export const canAccessModule = (userType, module) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  const permissions = USER_PERMISSIONS[userType]
  const modulePermissions = permissions[module] || []
  
  // If user has any permissions for the module, they can access it
  return modulePermissions.length > 0
}

// Get all accessible modules for a user type
export const getAccessibleModules = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return []
  }
  
  const permissions = USER_PERMISSIONS[userType]
  const accessibleModules = []
  
  // Define the valid module names that should be checked
  const moduleNames = ['employees', 'users', 'locations', 'customers', 'onboarding', 'training', 'timeTracking', 'timeOff', 'communication', 'tableTracking', 'performance', 'tickets', 'recognition', 'faq', 'notifications']
  
  // Check each module
  moduleNames.forEach(module => {
    const modulePermissions = permissions[module]
    if (Array.isArray(modulePermissions) && modulePermissions.length > 0) {
      accessibleModules.push(module)
    }
  })
  return accessibleModules
}

// Check if user can manage other users
export const canManageUsers = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  return USER_PERMISSIONS[userType].canManageUsers === true
}

// Check if user can access all locations
export const canAccessAllLocations = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  return USER_PERMISSIONS[userType].allLocations === true
}

// Check if user can view reports
export const canViewReports = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  return USER_PERMISSIONS[userType].canViewReports === true
}

// Check if user can manage system settings
export const canManageSystem = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  return USER_PERMISSIONS[userType].canManageSystem === true
}

// Check if user is Expo only (special handling)
export const isExpoUser = (userType) => {
  if (!userType || !USER_PERMISSIONS[userType]) {
    return false
  }
  
  return USER_PERMISSIONS[userType].isExpoOnly === true
}

// Filter data based on user's location access
export const filterDataByLocation = (data, userType, userLocation) => {
  // Owners can see all data
  if (canAccessAllLocations(userType)) {
    return data
  }
  
  // Other users only see data for their assigned location
  return data.filter(item => 
    item.location === userLocation || 
    item.location?.name === userLocation ||
    !item.location // Include items without location assignment
  )
}

// Get user-specific dashboard configuration without using icons directly
export const getDashboardConfig = (userType) => {
  const accessibleModules = getAccessibleModules(userType)
  
  // Map modules to dashboard configuration without icons to avoid import issues
  const moduleConfig = {
    employees: { id: 'employees', title: 'Employees' },
    users: { id: 'users', title: 'Admin Users' },
    locations: { id: 'locations', title: 'Locations' },
    customers: { id: 'customers', title: 'Customers' },
    onboarding: { id: 'onboarding', title: 'Onboarding' },
    training: { id: 'training', title: 'Training' },
    communication: { id: 'communication', title: 'Communication' },
    tableTracking: { id: 'table-tracking', title: 'Table Tracking' },
    performance: { id: 'performance', title: 'Performance' },
    tickets: { id: 'tickets', title: 'Tickets' },
    recognition: { id: 'recognition', title: 'Recognition' },
    faq: { id: 'faq', title: 'FAQ' },
    timeTracking: { id: 'time-tracking', title: 'Time Tracking' },
    timeOff: { id: 'time-off', title: 'Time Off' }
  }
  
  const modules = accessibleModules
    .map(module => moduleConfig[module])
    .filter(config => config) // Remove undefined mappings
  
  return {
    modules,
    accessibleTabs: modules.map(m => m.id),
    defaultTab: modules[0]?.id || 'employees', // Default to first accessible tab
    permissions: USER_PERMISSIONS[userType] || {},
    isExpoOnly: isExpoUser(userType)
  }
}
