// Employee utility functions for tenure tracking and training management

// Calculate employee tenure in days
export const calculateTenure = (hireDate) => {
  if (!hireDate) return 0
  const hire = new Date(hireDate)
  const today = new Date()
  const diffTime = today - hire
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Format tenure for display
export const formatTenure = (days) => {
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''}`
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
  } else {
    const years = Math.floor(days / 365)
    const remainingMonths = Math.floor((days % 365) / 30)
    return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`
  }
}

// Get next anniversary milestone
export const getNextAnniversary = (hireDate) => {
  if (!hireDate) return null
  
  const hire = new Date(hireDate)
  const today = new Date()
  const tenureDays = calculateTenure(hireDate)
  
  const milestones = [
    { days: 30, label: '1 Month' },
    { days: 90, label: '3 Months' },
    { days: 180, label: '6 Months' },
    { days: 365, label: '1 Year' },
    { days: 730, label: '2 Years' },
    { days: 1095, label: '3 Years' },
    { days: 1460, label: '4 Years' },
    { days: 1825, label: '5 Years' }
  ]
  
  for (const milestone of milestones) {
    if (tenureDays < milestone.days) {
      const targetDate = new Date(hire)
      targetDate.setDate(targetDate.getDate() + milestone.days)
      return {
        milestone: milestone.label,
        date: targetDate,
        daysRemaining: milestone.days - tenureDays
      }
    }
  }
  
  return null
}

// Check if employee has upcoming anniversary (within next 7 days)
export const hasUpcomingAnniversary = (hireDate) => {
  const nextAnniversary = getNextAnniversary(hireDate)
  if (!nextAnniversary) return false
  
  const today = new Date()
  const diffTime = nextAnniversary.date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays <= 7 && diffDays >= 0
}

// Get completed anniversaries/milestones
export const getCompletedMilestones = (hireDate) => {
  if (!hireDate) return []
  
  const tenureDays = calculateTenure(hireDate)
  const milestones = [
    { days: 30, label: '1 Month' },
    { days: 90, label: '3 Months' },
    { days: 180, label: '6 Months' },
    { days: 365, label: '1 Year' },
    { days: 730, label: '2 Years' },
    { days: 1095, label: '3 Years' },
    { days: 1460, label: '4 Years' },
    { days: 1825, label: '5 Years' }
  ]
  
  return milestones.filter(milestone => tenureDays >= milestone.days)
}

// Update employee data structure with new fields (migration helper)
export const migrateEmployeeData = (employees) => {
  return employees.map(employee => {
    const updatedEmployee = { ...employee }
    
    // Add training assignments if not present
    if (!updatedEmployee.trainingAssignments) {
      updatedEmployee.trainingAssignments = []
    }
    
    // Add hire date if not present (use createdAt as fallback)
    if (!updatedEmployee.hireDate && updatedEmployee.createdAt) {
      updatedEmployee.hireDate = updatedEmployee.createdAt
    }
    
    // Add anniversary tracking if not present
    if (!updatedEmployee.anniversaryMilestones) {
      updatedEmployee.anniversaryMilestones = []
    }
    
    // Add training notification preferences if not present
    if (!updatedEmployee.trainingNotificationPrefs) {
      updatedEmployee.trainingNotificationPrefs = {
        emailReminders: true,
        reminderFrequency: 24, // hours
        overdueAlerts: true
      }
    }
    
    // Add last training check timestamp
    if (!updatedEmployee.lastTrainingCheck) {
      updatedEmployee.lastTrainingCheck = new Date().toISOString()
    }
    
    // Add department assignments if not present
    if (!updatedEmployee.assignments) {
      updatedEmployee.assignments = {
        departments: [],
        areas: [],
        roles: [],
        assignedAt: null,
        assignedBy: null,
        lastModified: null
      }
    }
    
    return updatedEmployee
  })
}

// Check for overdue training assignments
export const getOverdueTraining = (employee) => {
  if (!employee.trainingAssignments) return []
  
  const today = new Date()
  return employee.trainingAssignments.filter(assignment => {
    if (!assignment.dueDate) return false
    if (assignment.completedAt) return false
    
    const dueDate = new Date(assignment.dueDate)
    return today > dueDate
  })
}

// Check training assignment status
export const getTrainingAssignmentStatus = (employee, moduleId) => {
  if (!employee.trainingAssignments) return 'not-assigned'
  
  const assignment = employee.trainingAssignments.find(a => a.moduleId === moduleId)
  if (!assignment) return 'not-assigned'
  
  if (assignment.completedAt) return 'completed'
  
  if (assignment.dueDate) {
    const today = new Date()
    const dueDate = new Date(assignment.dueDate)
    if (today > dueDate) return 'overdue'
  }
  
  return 'assigned'
}

// Add training assignment to employee
export const assignTrainingToEmployee = (employee, moduleId, moduleTitle, dueDate = null, assignedBy = null) => {
  const updatedEmployee = { ...employee }
  
  if (!updatedEmployee.trainingAssignments) {
    updatedEmployee.trainingAssignments = []
  }
  
  // Check if already assigned
  const existingIndex = updatedEmployee.trainingAssignments.findIndex(a => a.moduleId === moduleId)
  
  const assignment = {
    moduleId,
    moduleTitle,
    assignedAt: new Date().toISOString(),
    assignedBy,
    dueDate,
    status: 'assigned',
    remindersCount: 0
  }
  
  if (existingIndex >= 0) {
    // Update existing assignment
    updatedEmployee.trainingAssignments[existingIndex] = {
      ...updatedEmployee.trainingAssignments[existingIndex],
      ...assignment
    }
  } else {
    // Add new assignment
    updatedEmployee.trainingAssignments.push(assignment)
  }
  
  return updatedEmployee
}

// Reset training progress for employee
export const resetEmployeeTrainingProgress = (employee, moduleId) => {
  const updatedEmployee = { ...employee }
  
  // Remove from completed training
  if (updatedEmployee.completedTraining) {
    updatedEmployee.completedTraining = updatedEmployee.completedTraining.filter(
      completion => completion.moduleId !== moduleId
    )
  }
  
  // Remove from unlocked training  
  if (updatedEmployee.unlockedTraining) {
    updatedEmployee.unlockedTraining = updatedEmployee.unlockedTraining.filter(
      moduleIdInArray => moduleIdInArray !== moduleId
    )
  }
  
  // Update assignment status if exists
  if (updatedEmployee.trainingAssignments) {
    const assignmentIndex = updatedEmployee.trainingAssignments.findIndex(a => a.moduleId === moduleId)
    if (assignmentIndex >= 0) {
      updatedEmployee.trainingAssignments[assignmentIndex] = {
        ...updatedEmployee.trainingAssignments[assignmentIndex],
        status: 'assigned',
        completedAt: null,
        resetAt: new Date().toISOString(),
        resetCount: (updatedEmployee.trainingAssignments[assignmentIndex].resetCount || 0) + 1
      }
    }
  }
  
  return updatedEmployee
}

// Get training statistics for employee
export const getEmployeeTrainingStats = (employee) => {
  const stats = {
    assigned: 0,
    completed: 0,
    overdue: 0,
    pending: 0
  }
  
  if (employee.trainingAssignments) {
    stats.assigned = employee.trainingAssignments.length
    stats.completed = employee.trainingAssignments.filter(a => a.completedAt).length
    stats.overdue = getOverdueTraining(employee).length
    stats.pending = stats.assigned - stats.completed
  }
  
  return stats
}

// Mark anniversary milestone as celebrated
export const markAnniversaryCelebrated = (employee, milestone) => {
  const updatedEmployee = { ...employee }
  
  if (!updatedEmployee.anniversaryMilestones) {
    updatedEmployee.anniversaryMilestones = []
  }
  
  const celebration = {
    milestone,
    celebratedAt: new Date().toISOString(),
    tenureAtCelebration: calculateTenure(employee.hireDate)
  }
  
  // Check if already celebrated
  const existingIndex = updatedEmployee.anniversaryMilestones.findIndex(m => m.milestone === milestone)
  
  if (existingIndex >= 0) {
    updatedEmployee.anniversaryMilestones[existingIndex] = celebration
  } else {
    updatedEmployee.anniversaryMilestones.push(celebration)
  }
  
  return updatedEmployee
}

// Department assignment utility functions

// Assign roles to employee
export const assignRolesToEmployee = (employee, roleAssignments, assignedBy = 'admin') => {
  const updatedEmployee = { ...employee }
  
  if (!updatedEmployee.assignments) {
    updatedEmployee.assignments = {
      departments: [],
      areas: [],
      roles: [],
      assignedAt: null,
      assignedBy: null,
      lastModified: null
    }
  }
  
  // Extract unique departments and areas from role assignments
  const departments = [...new Set(roleAssignments.map(assignment => assignment.department))]
  const areas = [...new Set(roleAssignments.map(assignment => assignment.area))]
  
  updatedEmployee.assignments = {
    departments,
    areas,
    roles: roleAssignments,
    assignedAt: updatedEmployee.assignments.assignedAt || new Date().toISOString(),
    assignedBy: assignedBy,
    lastModified: new Date().toISOString()
  }
  
  return updatedEmployee
}

// Remove role assignment from employee
export const removeRoleFromEmployee = (employee, departmentId, areaId, roleId) => {
  const updatedEmployee = { ...employee }
  
  if (!updatedEmployee.assignments || !updatedEmployee.assignments.roles) {
    return updatedEmployee
  }
  
  // Remove the specific role assignment
  updatedEmployee.assignments.roles = updatedEmployee.assignments.roles.filter(
    assignment => !(assignment.department === departmentId && assignment.area === areaId && assignment.role === roleId)
  )
  
  // Update departments and areas based on remaining assignments
  const departments = [...new Set(updatedEmployee.assignments.roles.map(assignment => assignment.department))]
  const areas = [...new Set(updatedEmployee.assignments.roles.map(assignment => assignment.area))]
  
  updatedEmployee.assignments.departments = departments
  updatedEmployee.assignments.areas = areas
  updatedEmployee.assignments.lastModified = new Date().toISOString()
  
  return updatedEmployee
}

// Get employee's assigned departments
export const getEmployeeAssignedDepartments = (employee) => {
  return employee.assignments?.departments || []
}

// Get employee's assigned roles
export const getEmployeeAssignedRoles = (employee) => {
  return employee.assignments?.roles || []
}

// Check if employee is assigned to specific role
export const isEmployeeAssignedToRole = (employee, departmentId, areaId, roleId) => {
  if (!employee.assignments || !employee.assignments.roles) {
    return false
  }
  
  return employee.assignments.roles.some(
    assignment => assignment.department === departmentId && assignment.area === areaId && assignment.role === roleId
  )
}

// Get employee assignment summary
export const getEmployeeAssignmentSummary = (employee) => {
  if (!employee.assignments) {
    return {
      hasAssignments: false,
      departmentCount: 0,
      areaCount: 0,
      roleCount: 0,
      departments: [],
      lastModified: null
    }
  }
  
  return {
    hasAssignments: employee.assignments.roles.length > 0,
    departmentCount: employee.assignments.departments.length,
    areaCount: employee.assignments.areas.length,
    roleCount: employee.assignments.roles.length,
    departments: employee.assignments.departments,
    lastModified: employee.assignments.lastModified
  }
}
