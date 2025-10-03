// Notification Service for handling real system events - now uses API

import tableTrackingApiService from './tableTrackingApiService'

class NotificationService {
  constructor() {
    this.listeners = new Set()
  }

  // Add a listener for notification updates
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }

  // Create a notification - table tracking notifications are now handled by API
  createNotification(type, data = {}) {
    // For table tracking notifications, these are handled automatically by the API
    // when table submissions and status updates occur, so we just log them
    const notification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    }

    console.log(`Table tracking notification created:`, notification)
    
    // Notify listeners about the update for real-time UI updates
    this.notifyListeners()
    
    return notification
  }

  // Determine which storage key to use based on notification type
  // Deprecated: localStorage key logic removed
  getStorageKey() {
    return 'adminNotifications'
  }

  // Create notification for new employee signup
  notifyNewEmployeeSignup(employeeData) {
    return this.createNotification('NEW_SIGNUP', {
      title: 'New Employee Registration',
      message: `${employeeData.name} has submitted their registration for ${employeeData.location}`,
      employeeName: employeeData.name,
      employeeEmail: employeeData.email,
      location: employeeData.location,
      designation: employeeData.designation
    })
  }

  // Create notification for employee onboarding completion
  notifyOnboardingComplete(employeeData) {
    return this.createNotification('ONBOARDING_COMPLETE', {
      title: 'Onboarding Completed',
      message: `${employeeData.name} has completed their onboarding process`,
      employeeName: employeeData.name,
      employeeId: employeeData.id
    })
  }

  // Create notification for new customer registration
  notifyNewCustomerSignup(customerData) {
    return this.createNotification('NEW_CUSTOMER', {
      title: 'New Customer Registration',
      message: `${customerData.name} has signed up as a customer`,
      customerName: customerData.name,
      customerEmail: customerData.email
    })
  }

  // Create employee-specific notifications
  notifyEmployee(employeeId, type, data) {
    return this.createNotification(type, {
      ...data,
      employeeId
    })
  }

  // Create onboarding reminder for specific employee
  notifyOnboardingReminder(employeeId, employeeName, remainingSteps) {
    return this.notifyEmployee(employeeId, 'ONBOARDING_REMINDER', {
      title: 'Complete Your Onboarding',
      message: `You have ${remainingSteps} onboarding step${remainingSteps !== 1 ? 's' : ''} remaining`,
      remainingSteps
    })
  }

  // Create profile update reminder
  notifyProfileUpdateRequired(employeeId, employeeName, missingFields) {
    return this.notifyEmployee(employeeId, 'PROFILE_UPDATE_REQUIRED', {
      title: 'Profile Update Required',
      message: `Please complete your profile: ${missingFields.join(', ')}`,
      missingFields
    })
  }

  // Create training assignment notification
  notifyTrainingAssigned(employeeId, trainingTitle, dueDate = null) {
    return this.notifyEmployee(employeeId, 'TRAINING_ASSIGNED', {
      title: 'New Training Assigned',
      message: `You have been assigned: ${trainingTitle}${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`,
      trainingTitle,
      dueDate
    })
  }

  // Create training reminder notification
  notifyTrainingReminder(employeeId, employeeName, trainingTitle, dueDate) {
    return this.createNotification('TRAINING_REMINDER', {
      title: 'Training Reminder',
      message: `${employeeName} has an overdue training: ${trainingTitle}`,
      employeeId,
      employeeName,
      trainingTitle,
      dueDate
    })
  }

  // Create training reset notification
  notifyTrainingReset(employeeId, trainingTitle) {
    return this.notifyEmployee(employeeId, 'TRAINING_RESET', {
      title: 'Training Progress Reset',
      message: `Your progress for "${trainingTitle}" has been reset. Please complete it again.`,
      trainingTitle
    })
  }

  // Get all notifications for admin - now uses API
  async getAdminNotifications() {
    try {
      const result = await tableTrackingApiService.getAdminNotifications()
      if (result.success) {
        return result.notifications || []
      }
      console.error('Failed to get admin notifications:', result.error)
      return []
    } catch (error) {
      console.error('Error getting admin notifications:', error)
      return []
    }
  }

  // Get all notifications for employee
  getEmployeeNotifications(employeeId) {
    try {
      if (!employeeId) return []
      return this.employeeNotifications.get(employeeId) || []
    } catch (error) {
      console.error('Error getting employee notifications:', error)
      return []
    }
  }

  // Mark notification as read
  markAsRead(notificationId, employeeId = null) {
    try {
      const list = employeeId ? (this.employeeNotifications.get(employeeId) || []) : this.adminNotifications
      const updated = list.map(notif => 
        notif.id === notificationId ? { ...notif, read: true, readAt: new Date().toISOString() } : notif
      )
      if (employeeId) this.employeeNotifications.set(employeeId, updated)
      else this.adminNotifications = updated
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Delete notification
  deleteNotification(notificationId, employeeId = null) {
    try {
      if (employeeId) {
        const list = this.employeeNotifications.get(employeeId) || []
        const updated = list.filter(notif => notif.id !== notificationId)
        this.employeeNotifications.set(employeeId, updated)
      } else {
        this.adminNotifications = this.adminNotifications.filter(notif => notif.id !== notificationId)
      }
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  // Ticket notifications (added to remove errors and avoid localStorage)
  notifyNewTicket(ticket) {
    // Accept either a ticket object or fields
    const t = typeof ticket === 'object' && ticket ? ticket : {}
    const employeeId = t.employeeId || t.employee_id || null
    const title = t.title || 'New Support Ticket'
    const message = t.description || 'A new support ticket has been created.'
    return this.createNotification('NEW_TICKET', {
      title,
      message,
      employeeId,
      ticketId: t.id || t.ticketId || undefined,
      priority: t.priority || undefined,
      category: t.category || undefined,
    })
  }

  notifyTicketArchived(employeeId, title) {
    return this.createNotification('TICKET_ARCHIVED', {
      title: 'Ticket Archived',
      message: `Ticket \"${title || ''}\" was archived by admin`,
      employeeId
    })
  }

  notifyTicketStatusUpdate(employeeId, title, newStatus) {
    return this.createNotification('TICKET_STATUS_UPDATE', {
      title: 'Ticket Status Updated',
      message: `Your ticket \"${title || ''}\" status changed to ${newStatus}`,
      employeeId,
      status: newStatus
    })
  }

  notifyTicketResponse(employeeId, title, responseMessage) {
    return this.createNotification('TICKET_RESPONSE', {
      title: 'New Response from Management',
      message: `Update on \"${title || ''}\" — ${responseMessage}`,
      employeeId
    })
  }

  // UI Toast Notifications (for immediate user feedback)
  showSuccess(message, duration = 3000) {
    this.showToast(message, 'success', duration)
  }

  showError(message, duration = 5000) {
    this.showToast(message, 'error', duration)
  }

  showInfo(message, duration = 3000) {
    this.showToast(message, 'info', duration)
  }

  showWarning(message, duration = 4000) {
    this.showToast(message, 'warning', duration)
  }

  showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div')
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    toast.id = toastId
    
    // Style based on type
    const baseClasses = 'fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300 transform translate-x-full'
    const typeClasses = {
      success: 'border-green-500 text-green-800 bg-green-50',
      error: 'border-red-500 text-red-800 bg-red-50',
      warning: 'border-yellow-500 text-yellow-800 bg-yellow-50',
      info: 'border-blue-500 text-blue-800 bg-blue-50'
    }
    
    toast.className = baseClasses + ' ' + (typeClasses[type] || typeClasses.info)
    
    // Add content
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <div class="text-sm font-medium">${this.escapeHtml(message)}</div>
        </div>
        <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
          <span class="sr-only">Close</span>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `
    
    // Add to DOM
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full')
      toast.classList.add('translate-x-0')
    }, 10)
    
    // Auto-remove after duration
    setTimeout(() => {
      this.hideToast(toastId)
    }, duration)
  }

  hideToast(toastId) {
    const toast = document.getElementById(toastId)
    if (toast) {
      toast.classList.add('translate-x-full')
      setTimeout(() => {
        toast.remove()
      }, 300)
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService