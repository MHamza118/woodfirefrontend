// Forgot to Clock Out Detection Service
import { 
  getEmployeeTimeEntries, 
  getEmployeeClockStatus,
  getCurrentDaySchedule 
} from './timeTrackingService'
import { getCurrentLocation } from '../utils/locationVerification'

/**
 * Service to detect employees who forgot to clock out
 */
class ClockOutDetectionService {
  constructor() {
    this.checkInterval = null
    this.lastNetworkCheck = null
    this.networkLossDetected = false
  }

  /**
   * Start monitoring for clock-out issues
   */
  startMonitoring() {
    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkForForgottenClockOuts()
      this.monitorNetworkStatus()
    }, 5 * 60 * 1000)

    // Initial check
    this.checkForForgottenClockOuts()
    this.monitorNetworkStatus()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Monitor network status changes
   */
  monitorNetworkStatus() {
    const currentNetworkInfo = getCurrentLocation()
    const lastNetworkInfo = JSON.parse(localStorage.getItem('lastNetworkInfo') || 'null')

    // If we were on network and now we're not
    if (lastNetworkInfo?.verified && !currentNetworkInfo.verified) {
      this.networkLossDetected = true
      this.handleNetworkLoss()
    }
    // If we're back on network after being off
    else if (!lastNetworkInfo?.verified && currentNetworkInfo.verified) {
      if (this.networkLossDetected) {
        this.handleNetworkReconnection()
        this.networkLossDetected = false
      }
    }

    // Store current network status
    localStorage.setItem('lastNetworkInfo', JSON.stringify(currentNetworkInfo))
  }

  /**
   * Handle when device goes off network
   */
  handleNetworkLoss() {
    const currentTime = new Date()
    const employees = JSON.parse(localStorage.getItem('employees') || '[]')
    const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE')

    activeEmployees.forEach(employee => {
      const clockStatus = getEmployeeClockStatus(employee.id)
      
      if (clockStatus.isCurrentlyClocked) {
        // Record potential clock-out time
        this.recordPotentialClockOut(employee.id, currentTime)
      }
    })
  }

  /**
   * Handle when device reconnects to network
   */
  handleNetworkReconnection() {
    const potentialClockOuts = JSON.parse(localStorage.getItem('potentialClockOuts') || '[]')
    
    potentialClockOuts.forEach(potential => {
      this.sendClockOutNudge(potential.employeeId, potential.time)
    })

    // Clear potential clock-outs after processing
    localStorage.removeItem('potentialClockOuts')
  }

  /**
   * Record potential clock-out time when going off network
   */
  recordPotentialClockOut(employeeId, time) {
    const potentials = JSON.parse(localStorage.getItem('potentialClockOuts') || '[]')
    
    // Don't duplicate entries
    const existing = potentials.find(p => p.employeeId === employeeId)
    if (existing) return

    potentials.push({
      employeeId,
      time: time.toISOString(),
      recordedAt: new Date().toISOString()
    })

    localStorage.setItem('potentialClockOuts', JSON.stringify(potentials))
  }

  /**
   * Send nudge notification to employee about missed clock-out
   */
  sendClockOutNudge(employeeId, potentialClockOutTime) {
    const employees = JSON.parse(localStorage.getItem('employees') || '[]')
    const employee = employees.find(emp => emp.id === employeeId)
    
    if (!employee) return

    // Check if they're still clocked in
    const clockStatus = getEmployeeClockStatus(employeeId)
    if (!clockStatus.isCurrentlyClocked) {
      // They already clocked out, no nudge needed
      return
    }

    // Get their scheduled shift end time
    const todayShifts = getCurrentDaySchedule(employee)
    const clockOutTime = new Date(potentialClockOutTime)
    
    let suggestedEndTime = null
    if (todayShifts.length > 0) {
      // Find the shift that matches the potential clock-out time
      const shift = todayShifts.find(s => {
        const [endHour, endMinute] = s.endTime.split(':').map(Number)
        const shiftEnd = new Date(clockOutTime)
        shiftEnd.setHours(endHour, endMinute, 0, 0)
        
        // If clock-out time is within 30 minutes of shift end
        const timeDiff = Math.abs(clockOutTime - shiftEnd) / (1000 * 60)
        return timeDiff <= 30
      })
      
      if (shift) {
        suggestedEndTime = shift.endTime
      }
    }

    // Create nudge notification
    const nudge = {
      id: 'nudge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      employeeId: employeeId,
      type: 'FORGOT_CLOCK_OUT',
      title: 'Did you forget to clock out?',
      message: `Your shift ended at ${suggestedEndTime ? this.formatTime(suggestedEndTime) : this.formatTime(clockOutTime)}. Did you clock out then?`,
      potentialClockOutTime: clockOutTime.toISOString(),
      suggestedTime: suggestedEndTime,
      createdAt: new Date().toISOString(),
      status: 'PENDING', // 'PENDING', 'CONFIRMED', 'NEEDS_MANAGER'
      responses: null
    }

    // Store the nudge
    const nudges = JSON.parse(localStorage.getItem('clockOutNudges') || '[]')
    nudges.push(nudge)
    localStorage.setItem('clockOutNudges', JSON.stringify(nudges))

    // Add to employee notifications
    this.addEmployeeNotification(employeeId, nudge)
  }

  /**
   * Check for employees who should have clocked out but haven't
   */
  checkForForgottenClockOuts() {
    const currentTime = new Date()
    const employees = JSON.parse(localStorage.getItem('employees') || '[]')
    const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE')

    activeEmployees.forEach(employee => {
      const clockStatus = getEmployeeClockStatus(employee.id)
      
      if (clockStatus.isCurrentlyClocked) {
        const todayShifts = getCurrentDaySchedule(employee)
        
        todayShifts.forEach(shift => {
          if (this.isShiftOverdue(shift, currentTime)) {
            this.handleOverdueShift(employee.id, shift, currentTime)
          }
        })
      }
    })
  }

  /**
   * Check if a shift is overdue (employee should have clocked out)
   */
  isShiftOverdue(shift, currentTime) {
    const [endHour, endMinute] = shift.endTime.split(':').map(Number)
    const shiftEnd = new Date(currentTime)
    shiftEnd.setHours(endHour, endMinute, 0, 0)
    
    // If it's an overnight shift and end time is earlier than current hour
    if (endHour < currentTime.getHours() - 6) {
      shiftEnd.setDate(shiftEnd.getDate() + 1)
    }
    
    // Check if shift ended more than 15 minutes ago
    const timeDiff = (currentTime - shiftEnd) / (1000 * 60)
    return timeDiff > 15
  }

  /**
   * Handle overdue shift (missed clock-out)
   */
  handleOverdueShift(employeeId, shift, currentTime) {
    // Check if we already sent a nudge for this shift today
    const nudges = JSON.parse(localStorage.getItem('clockOutNudges') || '[]')
    const today = currentTime.toDateString()
    
    const existingNudge = nudges.find(n => 
      n.employeeId === employeeId && 
      new Date(n.createdAt).toDateString() === today &&
      n.type === 'SHIFT_OVERDUE'
    )
    
    if (existingNudge) return // Already sent nudge today

    // Send overdue shift notification
    const nudge = {
      id: 'nudge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      employeeId: employeeId,
      type: 'SHIFT_OVERDUE',
      title: 'Clock-out reminder',
      message: `Your shift was scheduled to end at ${this.formatTime(shift.endTime)}. Please clock out or contact your manager.`,
      scheduledEndTime: shift.endTime,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    }

    nudges.push(nudge)
    localStorage.setItem('clockOutNudges', JSON.stringify(nudges))

    this.addEmployeeNotification(employeeId, nudge)
  }

  /**
   * Handle employee response to clock-out nudge
   */
  handleNudgeResponse(nudgeId, response, clockOutTime = null) {
    const nudges = JSON.parse(localStorage.getItem('clockOutNudges') || '[]')
    const nudge = nudges.find(n => n.id === nudgeId)
    
    if (!nudge) return { success: false, error: 'Nudge not found' }

    if (response === 'YES') {
      // Employee confirms they clocked out at the suggested time
      nudge.status = 'CONFIRMED'
      nudge.confirmedClockOut = clockOutTime || nudge.potentialClockOutTime
      
      // Automatically set the punch (no manager action needed)
      this.autoSetClockOut(nudge.employeeId, clockOutTime || nudge.potentialClockOutTime)
      
    } else if (response === 'NO') {
      // Employee says they didn't clock out then - notify manager
      nudge.status = 'NEEDS_MANAGER'
      nudge.requiresManagerAction = true
      
      // Create manager notification
      this.notifyManagerForCorrection(nudge)
    }

    // Update nudge
    localStorage.setItem('clockOutNudges', JSON.stringify(nudges))

    return { success: true }
  }

  /**
   * Automatically set clock-out time when employee confirms
   */
  autoSetClockOut(employeeId, clockOutTime) {
    // Find the current time entry
    const timeEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]')
    const today = new Date().toISOString().split('T')[0]
    
    const currentEntry = timeEntries.find(entry => 
      entry.employeeId === employeeId && 
      entry.date === today && 
      !entry.clockOutTime
    )

    if (currentEntry) {
      const clockOutDate = new Date(clockOutTime)
      currentEntry.clockOutTime = this.formatTime(clockOutDate)
      currentEntry.totalHours = this.calculateHours(currentEntry.clockInTime, currentEntry.clockOutTime)
      currentEntry.autoClockOut = true
      currentEntry.autoClockOutReason = 'Employee confirmed via network loss detection'
      currentEntry.updatedAt = new Date().toISOString()

      // Update employee status
      const clockStatuses = JSON.parse(localStorage.getItem('employeeClockStatuses') || '{}')
      clockStatuses[employeeId] = {
        ...clockStatuses[employeeId],
        isCurrentlyClocked: false,
        currentTimeEntryId: null,
        lastClockOut: currentEntry.clockOutTime,
        currentShift: null
      }

      localStorage.setItem('timeEntries', JSON.stringify(timeEntries))
      localStorage.setItem('employeeClockStatuses', JSON.stringify(clockStatuses))
    }
  }

  /**
   * Notify manager for manual correction
   */
  notifyManagerForCorrection(nudge) {
    const managerNotifications = JSON.parse(localStorage.getItem('managerNotifications') || '[]')
    
    const employees = JSON.parse(localStorage.getItem('employees') || '[]')
    const employee = employees.find(emp => emp.id === nudge.employeeId)
    
    const notification = {
      id: 'mgr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'CLOCK_OUT_CORRECTION_NEEDED',
      title: 'Clock-out correction needed',
      message: `${employee?.personalInfo?.firstName} ${employee?.personalInfo?.lastName} needs help with clock-out time correction.`,
      employeeId: nudge.employeeId,
      nudgeId: nudge.id,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    }

    managerNotifications.push(notification)
    localStorage.setItem('managerNotifications', JSON.stringify(managerNotifications))
  }

  /**
   * Add notification to employee's notification list
   */
  addEmployeeNotification(employeeId, nudge) {
    const notifications = JSON.parse(localStorage.getItem('employeeNotifications') || '[]')
    
    const notification = {
      id: nudge.id,
      employeeId: employeeId,
      type: nudge.type,
      title: nudge.title,
      message: nudge.message,
      createdAt: nudge.createdAt,
      read: false,
      actionRequired: true,
      nudgeId: nudge.id
    }

    notifications.push(notification)
    localStorage.setItem('employeeNotifications', JSON.stringify(notifications))
  }

  /**
   * Get pending nudges for an employee
   */
  getPendingNudges(employeeId) {
    const nudges = JSON.parse(localStorage.getItem('clockOutNudges') || '[]')
    return nudges.filter(n => n.employeeId === employeeId && n.status === 'PENDING')
  }

  /**
   * Get manager notifications for clock-out corrections
   */
  getManagerNotifications() {
    return JSON.parse(localStorage.getItem('managerNotifications') || '[]')
      .filter(n => n.type === 'CLOCK_OUT_CORRECTION_NEEDED' && n.status === 'PENDING')
  }

  // Helper methods
  formatTime(timeInput) {
    if (typeof timeInput === 'string' && timeInput.includes(':')) {
      return timeInput
    }
    
    const date = new Date(timeInput)
    return date.toTimeString().split(' ')[0].substring(0, 5)
  }

  calculateHours(clockIn, clockOut) {
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
}

// Create singleton instance
const clockOutDetectionService = new ClockOutDetectionService()

export default clockOutDetectionService

// Export individual functions for direct use
export const {
  startMonitoring,
  stopMonitoring,
  handleNudgeResponse,
  getPendingNudges,
  getManagerNotifications
} = clockOutDetectionService