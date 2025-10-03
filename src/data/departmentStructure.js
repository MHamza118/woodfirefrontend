// Department structure data for restaurant operations
export const departmentStructure = {
  FOH: {
    id: 'FOH',
    name: 'Front of House',
    description: 'Customer-facing operations and service',
    color: 'purple',
    areas: {
      'dining-room': {
        id: 'dining-room',
        name: 'Dining Room',
        description: 'Main dining area service',
        roles: [
          { id: 'server', name: 'Server', description: 'Takes orders and serves customers' },
          { id: 'host', name: 'Host', description: 'Greets and seats customers' },
          { id: 'busser', name: 'Busser', description: 'Clears and sets tables' }
        ]
      },
      'patio': {
        id: 'patio',
        name: 'Patio',
        description: 'Outdoor dining area service',
        roles: [
          { id: 'server', name: 'Server', description: 'Takes orders and serves customers' },
          { id: 'host', name: 'Host', description: 'Greets and seats customers' }
        ]
      },
      'bar': {
        id: 'bar',
        name: 'Bar',
        description: 'Bar and beverage service',
        roles: [
          { id: 'bartender', name: 'Bartender', description: 'Prepares and serves beverages' },
          { id: 'barback', name: 'Barback', description: 'Supports bartender operations' },
          { id: 'server', name: 'Server', description: 'Serves drinks to tables' }
        ]
      }
    }
  },
  BOH: {
    id: 'BOH',
    name: 'Back of House',
    description: 'Kitchen and food preparation operations',
    color: 'orange',
    areas: {
      'kitchen-line': {
        id: 'kitchen-line',
        name: 'Kitchen Line',
        description: 'Main cooking and food preparation',
        roles: [
          { id: 'line-cook', name: 'Line Cook', description: 'Prepares food on the cooking line' },
          { id: 'kitchen-staff', name: 'Kitchen Staff', description: 'General kitchen duties' },
          { id: 'expediter', name: 'Expediter', description: 'Coordinates food orders' }
        ]
      },
      'pizza-station': {
        id: 'pizza-station',
        name: 'Pizza Station',
        description: 'Pizza preparation and cooking',
        roles: [
          { id: 'pizza-cook', name: 'Pizza Cook', description: 'Prepares and cooks pizzas' },
          { id: 'dough-prep', name: 'Dough Prep', description: 'Prepares pizza dough and toppings' }
        ]
      },
      'prep': {
        id: 'prep',
        name: 'Prep',
        description: 'Food preparation and ingredient prep',
        roles: [
          { id: 'prep-cook', name: 'Prep Cook', description: 'Prepares ingredients and components' },
          { id: 'baker', name: 'Baker', description: 'Prepares bread and baked goods' },
          { id: 'kitchen-staff', name: 'Kitchen Staff', description: 'General kitchen duties' }
        ]
      },
      'dishwasher': {
        id: 'dishwasher',
        name: 'Dishwasher',
        description: 'Cleaning and sanitation',
        roles: [
          { id: 'dishwasher', name: 'Dishwasher', description: 'Washes dishes and maintains cleanliness' },
          { id: 'utility', name: 'Utility', description: 'General cleaning and maintenance' }
        ]
      }
    }
  }
}

// Helper functions for working with department structure
export const getDepartments = () => {
  return Object.keys(departmentStructure).map(key => ({
    id: key,
    ...departmentStructure[key]
  }))
}

export const getDepartment = (departmentId) => {
  return departmentStructure[departmentId] || null
}

export const getAreas = (departmentId) => {
  const department = getDepartment(departmentId)
  if (!department) return []
  
  return Object.keys(department.areas).map(key => ({
    id: key,
    departmentId,
    ...department.areas[key]
  }))
}

export const getArea = (departmentId, areaId) => {
  const department = getDepartment(departmentId)
  if (!department || !department.areas[areaId]) return null
  
  return {
    id: areaId,
    departmentId,
    ...department.areas[areaId]
  }
}

export const getRoles = (departmentId, areaId = null) => {
  if (areaId) {
    const area = getArea(departmentId, areaId)
    return area ? area.roles : []
  }
  
  // Get all roles from all areas in a department
  const department = getDepartment(departmentId)
  if (!department) return []
  
  const allRoles = []
  Object.values(department.areas).forEach(area => {
    area.roles.forEach(role => {
      // Avoid duplicates
      if (!allRoles.find(r => r.id === role.id)) {
        allRoles.push(role)
      }
    })
  })
  
  return allRoles
}

export const getAllRoles = () => {
  const allRoles = []
  Object.keys(departmentStructure).forEach(deptId => {
    const deptRoles = getRoles(deptId)
    deptRoles.forEach(role => {
      if (!allRoles.find(r => r.id === role.id)) {
        allRoles.push({
          ...role,
          department: deptId
        })
      }
    })
  })
  return allRoles
}

// Default employee assignments structure
export const createDefaultAssignments = () => ({
  departments: [],
  areas: [],
  roles: [],
  primaryDepartment: null,
  primaryArea: null,
  primaryRole: null,
  isFlexible: false, // Can work in multiple areas/roles
  lastUpdated: new Date().toISOString()
})

// Validation functions
export const validateAssignment = (assignment) => {
  const errors = []
  
  if (!assignment.departments || assignment.departments.length === 0) {
    errors.push('At least one department must be assigned')
  }
  
  if (!assignment.primaryDepartment) {
    errors.push('Primary department must be specified')
  }
  
  if (!assignment.roles || assignment.roles.length === 0) {
    errors.push('At least one role must be assigned')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default departmentStructure
