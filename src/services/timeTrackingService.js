// Time Tracking Service for Employee Clock-In/Clock-Out System
import { getCurrentLocation, isOnRestaurantNetwork } from '../utils/locationVerification'

// Grace period constants (in minutes)
const GRACE_PERIOD_BEFORE = 5
const GRACE_PERIOD_AFTER = 5

/**
 * Get current employee shifts for the day
 */
export const getCurrentDaySchedule = (employeeData, date = new Date()) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayKey = dayNames[date.getDay()]
  
  let shifts = []
  
  // Check manual schedule first
  if (employeeData.manualSchedule?.times?.[dayKey]?.isWorking) {
    const manualDay = employeeData.manualSchedule.times[dayKey]
    if (manualDay.clockIn && manualDay.clockOut) {
      shifts.push({
        type: 'manual',
        startTime: manualDay.clockIn,
        endTime: manualDay.clockOut,
        source: 'manual_schedule'
      })
    }
  }
  
  // Check automatic schedule
  if (employeeData.schedule?.availability?.[dayKey]) {
    const autoDay = employeeData.schedule.availability[dayKey]
    Object.entries(autoDay).forEach(([shiftType, available]) => {
      if (available) {
        const timeMap = {
          morning: { start: '06:00', end: '14:00' },
          afternoon: { start: '14:00', end: '22:00' },
          evening: { start: '22:00', end: '06:00' }
        }
        
        if (timeMap[shiftType]) {
          shifts.push({
            type: 'automatic',
            startTime: timeMap[shiftType].start,
            endTime: timeMap[shiftType].end,
            shiftType: shiftType,
            source: 'automatic_schedule'
          })
        }
      }
    })
  }
  
  return shifts
}

/**
 * Check if current time is within grace period for a shift
 */
export const checkGracePeriod = (shiftStartTime, currentTime = new Date()) => {
  const [startHour, startMinute] = shiftStartTime.split(':').map(Number)
  const shiftStart = new Date(currentTime)
  shiftStart.setHours(startHour, startMinute, 0, 0)
  
  const timeDiffMinutes = Math.round((currentTime - shiftStart) / (1000 * 60))
  
  const status = {
    isWithinGrace: timeDiffMinutes >= -GRACE_PERIOD_BEFORE && timeDiffMinutes <= GRACE_PERIOD_AFTER,
    isEarly: timeDiffMinutes < -GRACE_PERIOD_BEFORE,
    isLate: timeDiffMinutes > GRACE_PERIOD_AFTER,
    minutesEarly: timeDiffMinutes < 0 ? Math.abs(timeDiffMinutes) : 0,
    minutesLate: timeDiffMinutes > 0 ? timeDiffMinutes : 0,
    timeDifference: timeDiffMinutes
  }
  
  return status
}

/**
 * Validate clock-in attempt
 */
export const validateClockIn = async (employeeData, qrCodeData) => {
  try {
    // Check if QR code is valid for clock-in
    if (qrCodeData !== 'CLOCK_IN_RESTAURANT_GENERAL') {
      return {
        success: false,
        error: 'Invalid QR code for clock-in',
        errorType: 'INVALID_QR'
      }
    }
    
    // Check if employee is logged in
    if (!employeeData) {
      return {
        success: false,
        error: 'Employee must be logged in to clock in',
        errorType: 'NOT_LOGGED_IN'
      }
    }
    
    // Check location verification
    const locationVerification = getCurrentLocation()
    if (!locationVerification.verified) {
      return {
        success: false,
        error: 'Must be on restaurant network to clock in',
        errorType: 'LOCATION_VERIFICATION_FAILED',
        locationInfo: locationVerification
      }
    }
    
    // Check if already clocked in
    const currentTimeEntry = getCurrentTimeEntry(employeeData)
    if (currentTimeEntry && !currentTimeEntry.clockOutTime) {
      return {
        success: false,
        error: 'Already clocked in. Please clock out first.',
        errorType: 'ALREADY_CLOCKED_IN',
        existingEntry: currentTimeEntry
      }
    }
    
    // Get scheduled shifts for today
    const todayShifts = getCurrentDaySchedule(employeeData)
    
    if (todayShifts.length === 0) {
      return {
        success: false,
        error: 'No scheduled shift found for today',
        errorType: 'NO_SHIFT_SCHEDULED'
      }
    }
    
    // Find the closest shift and check grace period
    const currentTime = new Date()
    let closestShift = null
    let graceStatus = null
    
    for (const shift of todayShifts) {
      const grace = checkGracePeriod(shift.startTime, currentTime)
      if (!closestShift || Math.abs(grace.timeDifference) < Math.abs(graceStatus.timeDifference)) {
        closestShift = shift
        graceStatus = grace
      }
    }
    
    return {
      success: true,
      shift: closestShift,
      graceStatus: graceStatus,
      locationInfo: locationVerification,
      requiresApproval: !graceStatus.isWithinGrace
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Clock-in validation failed: ${error.message}`,
      errorType: 'VALIDATION_ERROR'
    }
  }
}

/**
 * Validate clock-out attempt
 */
export const validateClockOut = async (employeeData, qrCodeData) => {
  try {
    // Check if QR code is valid for clock-out
    if (qrCodeData !== 'CLOCK_OUT_RESTAURANT_GENERAL') {
      return {
        success: false,
        error: 'Invalid QR code for clock-out',
        errorType: 'INVALID_QR'
      }
    }
    
    // Check if employee is logged in
    if (!employeeData) {
      return {
        success: false,
        error: 'Employee must be logged in to clock out',
        errorType: 'NOT_LOGGED_IN'
      }
    }
    
    // Check location verification
    const locationVerification = getCurrentLocation()
    if (!locationVerification.verified) {
      return {
        success: false,
        error: 'Must be on restaurant network to clock out',
        errorType: 'LOCATION_VERIFICATION_FAILED',
        locationInfo: locationVerification
      }
    }
    
    // Check if currently clocked in
    const currentTimeEntry = getCurrentTimeEntry(employeeData)
    if (!currentTimeEntry || currentTimeEntry.clockOutTime) {
      return {
        success: false,
        error: 'Not currently clocked in. Please clock in first.',
        errorType: 'NOT_CLOCKED_IN'
      }
    }
    
    return {
      success: true,
      currentEntry: currentTimeEntry,
      locationInfo: locationVerification
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Clock-out validation failed: ${error.message}`,
      errorType: 'VALIDATION_ERROR'
    }
  }
}

/**
 * Process clock-in
 */
export const processClockIn = async (employeeData, qrCodeData, currentTime = new Date()) => {
  const validation = await validateClockIn(employeeData, qrCodeData)
  
  if (!validation.success) {
    return validation
  }
  
  try {
    // Create new time entry
    const timeEntry = {
      id: generateTimeEntryId(),
      employeeId: employeeData.id,
      date: formatDate(currentTime),
      clockInTime: formatTime(currentTime),
      clockOutTime: null,
      scheduledShift: validation.shift,
      graceStatus: validation.graceStatus,
      locationInfo: validation.locationInfo,
      status: validation.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      approvalRequired: validation.requiresApproval,
      approvalReason: validation.requiresApproval ? 
        (validation.graceStatus.isEarly ? 'EARLY_CLOCK_IN' : 'LATE_CLOCK_IN') : null,
      createdAt: currentTime.toISOString(),
      updatedAt: currentTime.toISOString()
    }
    
    // Save time entry
    saveTimeEntry(timeEntry)
    
    // Update employee's current status
    updateEmployeeClockStatus(employeeData.id, {
      isCurrentlyClocked: true,
      currentTimeEntryId: timeEntry.id,
      lastClockIn: timeEntry.clockInTime,
      currentShift: validation.shift
    })
    
    // If approval required, create approval request
    if (validation.requiresApproval) {
      createApprovalRequest({
        type: 'CLOCK_IN_APPROVAL',
        employeeId: employeeData.id,
        timeEntryId: timeEntry.id,
        reason: timeEntry.approvalReason,
        requestedAt: currentTime.toISOString(),
        graceStatus: validation.graceStatus,
        shift: validation.shift
      })
    }
    
    return {
      success: true,
      timeEntry: timeEntry,
      requiresApproval: validation.requiresApproval,
      message: validation.requiresApproval ? 
        'Clock-in recorded but requires manager approval' : 
        'Successfully clocked in'
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to process clock-in: ${error.message}`,
      errorType: 'PROCESSING_ERROR'
    }
  }
}

/**
 * Process clock-out
 */
export const processClockOut = async (employeeData, qrCodeData, currentTime = new Date()) => {
  const validation = await validateClockOut(employeeData, qrCodeData)
  
  if (!validation.success) {
    return validation
  }
  
  try {
    const timeEntry = validation.currentEntry
    
    // Update time entry with clock-out
    timeEntry.clockOutTime = formatTime(currentTime)
    timeEntry.totalHours = calculateHours(timeEntry.clockInTime, timeEntry.clockOutTime)
    timeEntry.updatedAt = currentTime.toISOString()
    
    // Save updated time entry
    saveTimeEntry(timeEntry)
    
    // Update employee's current status
    updateEmployeeClockStatus(employeeData.id, {
      isCurrentlyClocked: false,
      currentTimeEntryId: null,
      lastClockOut: timeEntry.clockOutTime,
      currentShift: null
    })
    
    return {
      success: true,
      timeEntry: timeEntry,
      message: 'Successfully clocked out',
      hoursWorked: timeEntry.totalHours
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to process clock-out: ${error.message}`,
      errorType: 'PROCESSING_ERROR'
    }
  }
}

/**
 * Get current time entry for employee
 */
export const getCurrentTimeEntry = (employeeData) => {
  const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
  const today = formatDate(new Date())
  
  return timeEntries.find(entry => 
    entry.employeeId === employeeData.id && 
    entry.date === today && 
    !entry.clockOutTime
  )
}

/**
 * Get employee's clock status
 */
export const getEmployeeClockStatus = (employeeId) => {
  const clockStatuses = JSON.parse(localStorage.getItem('employeeClockStatuses') || '{}')
  return clockStatuses[employeeId] || {
    isCurrentlyClocked: false,
    currentTimeEntryId: null,
    lastClockIn: null,
    lastClockOut: null,
    currentShift: null
  }
}

/**
 * Get time entries for employee
 */
export const getEmployeeTimeEntries = (employeeId, dateRange = null) => {
  const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
  let filtered = timeEntries.filter(entry => entry.employeeId === employeeId)
  
  if (dateRange) {
    filtered = filtered.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= dateRange.start && entryDate <= dateRange.end
    })
  }
  
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Helper functions
const generateTimeEntryId = () => {
  return 'te_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

const formatTime = (date) => {
  return date.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format
}

const calculateHours = (clockIn, clockOut) => {
  const [inHour, inMinute] = clockIn.split(':').map(Number)
  const [outHour, outMinute] = clockOut.split(':').map(Number)
  
  const inMinutes = inHour * 60 + inMinute
  let outMinutes = outHour * 60 + outMinute
  
  // Handle overnight shifts
  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60
  }
  
  const totalMinutes = outMinutes - inMinutes
  return (totalMinutes / 60).toFixed(2)
}

const saveTimeEntry = (timeEntry) => {
  const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
  const existingIndex = timeEntries.findIndex(entry => entry.id === timeEntry.id)
  
  if (existingIndex >= 0) {
    timeEntries[existingIndex] = timeEntry
  } else {
    timeEntries.push(timeEntry)
  }
  
  localStorage.setItem('timeEntries', JSON.stringify(timeEntries))
}

const updateEmployeeClockStatus = (employeeId, status) => {
  const clockStatuses = JSON.parse(localStorage.getItem('employeeClockStatuses') || '{}')
  clockStatuses[employeeId] = { ...clockStatuses[employeeId], ...status }
  localStorage.setItem('employeeClockStatuses', JSON.stringify(clockStatuses))
}

const createApprovalRequest = (request) => {
  const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]')
  request.id = 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  request.status = 'PENDING'
  approvalRequests.push(request)
  localStorage.setItem('approvalRequests', JSON.stringify(approvalRequests))
}

/**
 * Get pending approval requests
 */
export const getPendingApprovalRequests = () => {
  const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]')
  return approvalRequests.filter(request => request.status === 'PENDING')
}

/**
 * Process approval request
 */
export const processApprovalRequest = (requestId, approved, managerId, notes = '') => {
  const approvalRequests = JSON.parse(localStorage.getItem('approvalRequests') || '[]')
  const request = approvalRequests.find(req => req.id === requestId)
  
  if (!request) {
    return { success: false, error: 'Approval request not found' }
  }
  
  // Update approval request
  request.status = approved ? 'APPROVED' : 'DENIED'
  request.approvedBy = managerId
  request.approvedAt = new Date().toISOString()
  request.approvalNotes = notes
  
  // Update corresponding time entry
  if (request.type === 'CLOCK_IN_APPROVAL') {
    const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
    const timeEntry = timeEntries.find(entry => entry.id === request.timeEntryId)
    
    if (timeEntry) {
      timeEntry.status = approved ? 'APPROVED' : 'DENIED'
      timeEntry.approvedBy = managerId
      timeEntry.approvedAt = new Date().toISOString()
      timeEntry.approvalNotes = notes
      
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries))
    }
  }
  
  localStorage.setItem('approvalRequests', JSON.stringify(approvalRequests))
  
  return { 
    success: true, 
    message: `Request ${approved ? 'approved' : 'denied'} successfully` 
  }
}