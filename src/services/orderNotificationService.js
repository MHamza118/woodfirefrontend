// Order Notification Service - API-based notifications for table submissions and order updates

import tableTrackingApiService from './tableTrackingApiService'

// Notification types
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATED: 'order_updated', 
  ORDER_DELIVERED: 'order_delivered',
  ORDER_READY: 'order_ready',
  TABLE_CHANGED: 'table_changed'
}

// Notification priorities
const PRIORITIES = {
  HIGH: 'high',     // New orders, urgent updates
  MEDIUM: 'medium', // Status changes
  LOW: 'low'        // Delivered confirmations
}

// Storage keys for localStorage
const STORAGE_KEYS = {
  NOTIFICATIONS: 'orderNotifications',
  EMPLOYEE_READ_STATUS: 'employeeNotificationReadStatus',
  SETTINGS: 'notificationSettings'
}

class OrderNotificationService {
  constructor() {
    // Settings cache
    this._settingsCache = {
      soundEnabled: true,
      desktopNotifications: true,
      showToasts: true,
      autoMarkReadAfter: 300000, // 5 minutes
      maxNotifications: 100 // Keep last 100 notifications
    }
  }

  // Get notifications for specific employee - now uses API
  async getNotificationsForEmployee(employeeId, location = null, limit = 50) {
    try {
      const result = await tableTrackingApiService.getEmployeeNotifications(employeeId)
      if (result.success) {
        let notifications = result.notifications || []
        
        // Filter by location if specified
        if (location) {
          notifications = notifications.filter(notification => 
            !notification.location || notification.location === location
          )
        }
        
        return notifications
          .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))
          .slice(0, limit)
      }
      console.error('Failed to get employee notifications:', result.error)
      return []
    } catch (error) {
      console.error('Error getting employee notifications:', error)
      return []
    }
  }

  // Get unread count for employee
  async getUnreadCount(employeeId) {
    try {
      const notifications = await this.getNotificationsForEmployee(employeeId)
      return notifications.filter(notification => !notification.is_read).length
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const result = await tableTrackingApiService.markNotificationAsRead(notificationId)
      return result
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead() {
    try {
      const result = await tableTrackingApiService.markAllNotificationsAsRead()
      return result
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const result = await tableTrackingApiService.deleteNotification(notificationId)
      return result
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Create a new notification
  createNotification({
    type,
    title,
    message,
    orderNumber,
    tableNumber,
    customerName = null,
    location = null,
    priority = PRIORITIES.MEDIUM,
    data = {}
  }) {
    const notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      orderNumber,
      tableNumber,
      customerName,
      location,
      priority,
      data,
      timestamp: new Date().toISOString(),
      isActive: true
    }

    const notifications = this.getAllNotifications()
    notifications.unshift(notification) // Add to beginning

    // Keep only the last maxNotifications
    const settings = this.getSettings()
    if (notifications.length > settings.maxNotifications) {
      notifications.splice(settings.maxNotifications)
    }

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications))
    
    // Trigger browser/system notification if enabled
    this.triggerSystemNotification(notification)
    
    return notification
  }

  // Create notification for new table submission
  notifyNewTableSubmission(tableNumber, orderNumber, customerName = null, location = null) {
    return this.createNotification({
      type: NOTIFICATION_TYPES.NEW_ORDER,
      title: 'New Table Assignment',
      message: `Customer seated at Table ${tableNumber} with Order #${orderNumber}`,
      orderNumber,
      tableNumber,
      customerName,
      location,
      priority: PRIORITIES.HIGH,
      data: {
        area: this.getTableArea(tableNumber),
        submitTime: new Date().toISOString()
      }
    })
  }

  // Create notification for order status change
  notifyOrderStatusChange(orderNumber, tableNumber, oldStatus, newStatus, updatedBy = 'System') {
    const statusMessages = {
      'pending': 'Order is pending',
      'preparing': 'Order is being prepared',
      'ready': 'Order is ready for delivery',
      'delivered': 'Order has been delivered',
      'completed': 'Order completed'
    }

    return this.createNotification({
      type: NOTIFICATION_TYPES.ORDER_UPDATED,
      title: `📋 Order Status Updated`,
      message: `Order #${orderNumber} at Table ${tableNumber}: ${statusMessages[newStatus]}`,
      orderNumber,
      tableNumber,
      priority: newStatus === 'ready' ? PRIORITIES.HIGH : PRIORITIES.MEDIUM,
      data: {
        oldStatus,
        newStatus,
        updatedBy,
        updateTime: new Date().toISOString()
      }
    })
  }

  // Create notification for table change
  notifyTableChange(orderNumber, oldTable, newTable, reason = 'Customer request') {
    return this.createNotification({
      type: NOTIFICATION_TYPES.TABLE_CHANGED,
      title: '🔄 Table Changed',
      message: `Order #${orderNumber} moved from Table ${oldTable} to Table ${newTable}`,
      orderNumber,
      tableNumber: newTable,
      priority: PRIORITIES.MEDIUM,
      data: {
        oldTable,
        newTable,
        reason,
        changeTime: new Date().toISOString()
      }
    })
  }

  // Create notification for order ready for delivery
  notifyOrderReady(orderNumber, tableNumber, preparedBy = 'Kitchen') {
    return this.createNotification({
      type: NOTIFICATION_TYPES.ORDER_READY,
      title: '🔔 Order Ready!',
      message: `Order #${orderNumber} is ready for delivery to Table ${tableNumber}`,
      orderNumber,
      tableNumber,
      priority: PRIORITIES.HIGH,
      data: {
        preparedBy,
        readyTime: new Date().toISOString(),
        requiresDelivery: true
      }
    })
  }

  // Create notification for successful delivery
  notifyOrderDelivered(orderNumber, tableNumber, deliveredBy = 'Staff') {
    return this.createNotification({
      type: NOTIFICATION_TYPES.ORDER_DELIVERED,
      title: '✅ Order Delivered',
      message: `Order #${orderNumber} successfully delivered to Table ${tableNumber}`,
      orderNumber,
      tableNumber,
      priority: PRIORITIES.LOW,
      data: {
        deliveredBy,
        deliveryTime: new Date().toISOString()
      }
    })
  }

  // Mark notification as read for specific employee
  markAsRead(notificationId, employeeId) {
    const readStatus = this.getEmployeeReadStatus(employeeId)
    readStatus[notificationId] = {
      readAt: new Date().toISOString(),
      readBy: employeeId
    }
    
    localStorage.setItem(
      STORAGE_KEYS.EMPLOYEE_READ_STATUS, 
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEE_READ_STATUS) || '{}'),
        [employeeId]: readStatus
      })
    )
  }

  // Mark all notifications as read for employee
  markAllAsRead(employeeId) {
    const notifications = this.getNotificationsForEmployee(employeeId)
    const readStatus = this.getEmployeeReadStatus(employeeId)
    const readTime = new Date().toISOString()
    
    notifications.forEach(notification => {
      readStatus[notification.id] = {
        readAt: readTime,
        readBy: employeeId
      }
    })
    
    const allReadStatuses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEE_READ_STATUS) || '{}')
    allReadStatuses[employeeId] = readStatus
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_READ_STATUS, JSON.stringify(allReadStatuses))
  }

  // Get employee read status
  getEmployeeReadStatus(employeeId) {
    const allReadStatuses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEE_READ_STATUS) || '{}')
    return allReadStatuses[employeeId] || {}
  }

  // Dismiss notification (remove from active list)
  dismissNotification(notificationId) {
    const notifications = this.getAllNotifications()
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isActive: false, dismissedAt: new Date().toISOString() }
        : notification
    )
    
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications))
  }

  // Get active notifications only
  getActiveNotifications(employeeId, location = null) {
    return this.getNotificationsForEmployee(employeeId, location)
      .filter(notification => notification.isActive !== false)
  }

  // Trigger system/browser notification
  triggerSystemNotification(notification) {
    const settings = this.getSettings()
    
    if (!settings.desktopNotifications) return

    // Don't show toast notifications for customer-facing pages
    // Only show them on admin/employee dashboards
    const currentPath = window.location.pathname
    const isCustomerPage = currentPath.includes('/seating') || currentPath.includes('/success') || currentPath === '/'
    
    if (!isCustomerPage) {
      // Only show toast notification on admin/employee pages
      this.showToastNotification(notification)
    }

    // Play sound if enabled (but only on admin/employee pages)
    if (settings.soundEnabled && !isCustomerPage) {
      this.playNotificationSound(notification.priority)
    }
  }

  // Show toast notification
  showToastNotification(notification) {
    // Create a toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #fff;
      color: #333;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      max-width: 300px;
      font-family: system-ui, -apple-system, sans-serif;
      transition: opacity 0.3s ease-in-out;
      border-left: 4px solid ${notification.priority === PRIORITIES.HIGH ? '#f44336' : notification.priority === PRIORITIES.MEDIUM ? '#ff9800' : '#4caf50'};
    `;

    // Create and style title
    const title = document.createElement('div');
    title.textContent = notification.title;
    title.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
    toast.appendChild(title);

    // Create and style message
    const message = document.createElement('div');
    message.textContent = notification.message;
    message.style.cssText = 'font-size: 14px;';
    toast.appendChild(message);

    // Add to document
    document.body.appendChild(toast);

    // Auto remove after 5 seconds for non-high priority, 10 seconds for high priority
    const timeout = notification.priority === PRIORITIES.HIGH ? 10000 : 5000;
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, timeout);
  }

  // Play notification sound based on priority
  playNotificationSound(priority) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different tones for different priorities
      if (priority === PRIORITIES.HIGH) {
        // Urgent: Higher pitch, longer
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      } else if (priority === PRIORITIES.MEDIUM) {
        // Normal: Medium pitch, shorter
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } else {
        // Low: Lower pitch, brief
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      }
    } catch (error) {
      console.log('Audio notification not available:', error)
    }
  }

  // Get all notifications from localStorage
  getAllNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]')
    } catch (error) {
      console.error('Error getting notifications from localStorage:', error)
      return []
    }
  }

  // Get notification settings
  getSettings() {
    const defaultSettings = {
      soundEnabled: true,
      desktopNotifications: true,
      showToasts: true,
      autoMarkReadAfter: 300000,
      maxNotifications: 100
    }
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
      return { ...defaultSettings, ...stored }
    } catch (error) {
      console.error('Error getting notification settings:', error)
      return defaultSettings
    }
  }

  // Update notification settings
  updateSettings(newSettings) {
    const currentSettings = this.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
  }

  // Helper method to get table area (reuse from tableTrackingService)
  getTableArea(tableNumber) {
    const upperTable = tableNumber.toString().toUpperCase()
    
    if (/^[0-9]+$/.test(upperTable)) return 'dining'
    if (upperTable.startsWith('P')) return 'patio'
    if (upperTable.startsWith('B')) return 'bar'
    return 'unknown'
  }

  // Clean up old notifications (maintenance function)
  cleanupOldNotifications(daysToKeep = 7) {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000))
    const notifications = this.getAllNotifications()
    
    const recentNotifications = notifications.filter(notification => 
      new Date(notification.timestamp) > cutoffDate
    )
    
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(recentNotifications))
  }

  // Get notification statistics
  getNotificationStats(days = 7) {
    const notifications = this.getAllNotifications()
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
    
    const recentNotifications = notifications.filter(notification => 
      new Date(notification.timestamp) > cutoffDate
    )
    
    return {
      total: recentNotifications.length,
      byType: recentNotifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1
        return acc
      }, {}),
      byPriority: recentNotifications.reduce((acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1
        return acc
      }, {}),
      dailyBreakdown: recentNotifications.reduce((acc, notification) => {
        const date = new Date(notification.timestamp).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})
    }
  }
}

// Create singleton instance
const orderNotificationService = new OrderNotificationService()

// Export the service and constants
export default orderNotificationService
export { NOTIFICATION_TYPES, PRIORITIES }
