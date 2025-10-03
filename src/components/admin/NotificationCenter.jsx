import { useState, useEffect, useCallback } from 'react'
import { Bell, X, User, CheckCircle, Clock, Hash, MapPin, ChefHat, Truck } from 'lucide-react'
import tableTrackingApiService from '../../services/tableTrackingApiService'

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load admin notifications from API
      const result = await tableTrackingApiService.getAdminNotifications()
      if (result.success) {
        // Sort by created_at (newest first) and limit to recent ones
        const allNotifications = (result.notifications || [])
          .filter(notif => notif && typeof notif === 'object') // Filter out invalid notifications
          .sort((a, b) => {
            try {
              const dateA = new Date(a.created_at || a.timestamp)
              const dateB = new Date(b.created_at || b.timestamp)
              return dateB - dateA
            } catch (dateError) {
              console.error('Error sorting notifications by date:', dateError)
              return 0
            }
          })
          .slice(0, 20) // Keep only the latest 20 notifications
        
        setNotifications(allNotifications)
      } else {
        throw new Error(result.error || 'Failed to load notifications')
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    
    // Set up interval to check for new notifications from API
    const interval = setInterval(() => {
      try {
        loadNotifications()
      } catch (error) {
        console.error('Error in notification interval:', error)
      }
    }, 10000) // Check every 10 seconds for new notifications
    
    return () => {
      clearInterval(interval)
    }
  }, [loadNotifications])

  const markAsRead = async (notificationId) => {
    try {
      const result = await tableTrackingApiService.markAdminNotificationAsRead(notificationId)
      if (result.success) {
        const updated = notifications.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true, read: true } : notif
        )
        setNotifications(updated)
      } else {
        console.error('Failed to mark notification as read:', result.error)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(notif => !notif.is_read && !notif.read)
      
      for (const notification of unreadNotifications) {
        await tableTrackingApiService.markAdminNotificationAsRead(notification.id)
      }
      
      // Update local state
      const updated = notifications.map(notif => ({ ...notif, is_read: true, read: true }))
      setNotifications(updated)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const result = await tableTrackingApiService.deleteAdminNotification(notificationId)
      if (result.success) {
        const updated = notifications.filter(notif => notif.id !== notificationId)
        setNotifications(updated)
      } else {
        console.error('Failed to delete notification:', result.error)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length

  const getNotificationIcon = (type) => {
    switch (type) {
      // User/Employee notifications
      case 'NEW_SIGNUP':
        return <User className="w-4 h-4 text-blue-600" />
      case 'ONBOARDING_COMPLETE':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      
      // Order notifications
      case 'new_order':
        return <Hash className="w-4 h-4 text-blue-600" />
      case 'order_updated':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'order_ready':
        return <ChefHat className="w-4 h-4 text-purple-600" />
      case 'order_delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'table_changed':
        return <MapPin className="w-4 h-4 text-orange-600" />
      
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp || Date.now())
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-cream/80 hover:text-cream transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Modal */}
      {showNotifications && (
        <>
          {/* Desktop dropdown - shows on screens 481px and larger */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden notification-desktop-modal">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-charcoal">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-gold hover:text-gold-dark">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.is_read && !notification.read ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-charcoal text-sm break-words flex-1">{notification.title}</p>
                              <button onClick={() => deleteNotification(notification.id)} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-charcoal/70 text-sm mt-1 break-words">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">{formatTime(notification.created_at || notification.timestamp)}</p>
                              {!notification.is_read && !notification.read && (
                                <button onClick={() => markAsRead(notification.id)} className="text-xs text-gold hover:text-gold-dark">
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Mobile full-screen modal - shows on screens 480px and below */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 notification-mobile-modal" onClick={() => setShowNotifications(false)}>
            <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="font-semibold text-charcoal">Notifications</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-gold hover:text-gold-dark px-2 py-1 bg-gold/10 rounded">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.is_read && !notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-start justify-between">
                                <p className="font-medium text-charcoal text-sm break-words flex-1">{notification.title}</p>
                                <button onClick={() => deleteNotification(notification.id)} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-charcoal/70 text-sm mt-1 break-words">{notification.message}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{formatTime(notification.created_at || notification.timestamp)}</p>
                                {!notification.is_read && !notification.read && (
                                  <button onClick={() => markAsRead(notification.id)} className="text-xs text-gold hover:text-gold-dark px-2 py-1 bg-gold/10 rounded">
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter