// Availability Change Service for Post-Publish Schedule Requests
import { getCurrentDaySchedule } from './timeTrackingService'

/**
 * Submit availability change request
 */
export const submitAvailabilityChangeRequest = (employeeData, changes, reason) => {
  try {
    const changeRequest = {
      id: 'avl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      employeeId: employeeData.id,
      requestedBy: employeeData.id,
      changes: changes,
      reason: reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      type: 'AVAILABILITY_CHANGE'
    }

    // Store request
    const requests = JSON.parse(localStorage.getItem('availabilityChangeRequests') || '[]')
    requests.push(changeRequest)
    localStorage.setItem('availabilityChangeRequests', JSON.stringify(requests))

    // Create manager notification
    createManagerNotification(changeRequest)

    return {
      success: true,
      request: changeRequest,
      message: 'Availability change request submitted successfully'
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to submit request: ${error.message}`,
      errorType: 'SUBMISSION_ERROR'
    }
  }
}

/**
 * Get pending availability change requests
 */
export const getPendingAvailabilityChangeRequests = () => {
  const requests = JSON.parse(localStorage.getItem('availabilityChangeRequests') || '[]')
  return requests.filter(request => request.status === 'PENDING')
}

/**
 * Get availability change requests for an employee
 */
export const getEmployeeAvailabilityChangeRequests = (employeeId) => {
  const requests = JSON.parse(localStorage.getItem('availabilityChangeRequests') || '[]')
  return requests.filter(request => request.employeeId === employeeId)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
}

/**
 * Process availability change approval
 */
export const processAvailabilityChangeApproval = (requestId, approved, managerId, notes = '') => {
  try {
    const requests = JSON.parse(localStorage.getItem('availabilityChangeRequests') || '[]')
    const request = requests.find(req => req.id === requestId)
    
    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    // Update request status
    request.status = approved ? 'APPROVED' : 'DENIED'
    request.approvedBy = managerId
    request.approvedAt = new Date().toISOString()
    request.approvalNotes = notes

    // If approved, apply the changes to employee schedule
    if (approved) {
      applyAvailabilityChanges(request.employeeId, request.changes)
    }

    localStorage.setItem('availabilityChangeRequests', JSON.stringify(requests))

    // Notify employee of decision
    createEmployeeNotification(request)

    return { 
      success: true, 
      message: `Request ${approved ? 'approved' : 'denied'} successfully` 
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to process approval: ${error.message}`,
      errorType: 'APPROVAL_ERROR'
    }
  }
}

/**
 * Apply approved availability changes to employee schedule
 */
const applyAvailabilityChanges = (employeeId, changes) => {
  const employees = JSON.parse(localStorage.getItem('employees') || '[]')
  const employeeIndex = employees.findIndex(emp => emp.id === employeeId)
  
  if (employeeIndex === -1) return

  const employee = employees[employeeIndex]
  
  // Apply changes based on change type
  if (changes.type === 'SCHEDULE_OVERRIDE') {
    // Override specific days
    if (!employee.scheduleOverrides) {
      employee.scheduleOverrides = {}
    }
    
    Object.entries(changes.dayChanges).forEach(([day, dayData]) => {
      employee.scheduleOverrides[day] = {
        ...dayData,
        effectiveDate: changes.effectiveDate,
        approvedAt: new Date().toISOString()
      }
    })
  } else if (changes.type === 'PERMANENT_CHANGE') {
    // Update permanent schedule
    if (employee.schedule && employee.schedule.availability) {
      Object.entries(changes.dayChanges).forEach(([day, dayData]) => {
        employee.schedule.availability[day] = dayData
      })
    }
  }

  employees[employeeIndex] = employee
  localStorage.setItem('employees', JSON.stringify(employees))
}

/**
 * Create manager notification for new request
 */
const createManagerNotification = (request) => {
  const managerNotifications = JSON.parse(localStorage.getItem('managerNotifications') || '[]')
  const employees = JSON.parse(localStorage.getItem('employees') || '[]')
  const employee = employees.find(emp => emp.id === request.employeeId)
  
  const notification = {
    id: 'mgr_avl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: 'AVAILABILITY_CHANGE_REQUEST',
    title: 'Availability change request',
    message: `${employee?.personalInfo?.firstName} ${employee?.personalInfo?.lastName} has requested a schedule change.`,
    employeeId: request.employeeId,
    requestId: request.id,
    createdAt: new Date().toISOString(),
    status: 'PENDING'
  }

  managerNotifications.push(notification)
  localStorage.setItem('managerNotifications', JSON.stringify(managerNotifications))
}

/**
 * Create employee notification for approval decision
 */
const createEmployeeNotification = (request) => {
  const notifications = JSON.parse(localStorage.getItem('employeeNotifications') || '[]')
  
  const notification = {
    id: 'emp_avl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    employeeId: request.employeeId,
    type: 'AVAILABILITY_CHANGE_RESPONSE',
    title: `Schedule change ${request.status.toLowerCase()}`,
    message: request.status === 'APPROVED' 
      ? 'Your availability change request has been approved.'
      : 'Your availability change request has been denied.',
    createdAt: new Date().toISOString(),
    read: false,
    requestId: request.id
  }

  notifications.push(notification)
  localStorage.setItem('employeeNotifications', JSON.stringify(notifications))
}

/**
 * Get manager notifications for availability changes
 */
export const getAvailabilityChangeManagerNotifications = () => {
  return JSON.parse(localStorage.getItem('managerNotifications') || '[]')
    .filter(n => n.type === 'AVAILABILITY_CHANGE_REQUEST' && n.status === 'PENDING')
}
