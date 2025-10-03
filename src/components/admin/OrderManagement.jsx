import React, { useState, useEffect } from 'react'
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  User,
  Calendar,
  Hash,
  Navigation,
  Star,
  MessageSquare,
  Edit,
  RefreshCw,
  Users,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react'
import { hasPermission } from '../../utils/permissions'
import { useAuth } from '../../contexts/AuthContext'
import tableTrackingService from '../../services/tableTrackingService'

const OrderManagement = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const currentUserType = user?.userType || 'General User'
  
  // Check permissions
  const canAssignOrders = hasPermission(currentUserType, 'orderManagement', 'assign')
  const canManageStatus = hasPermission(currentUserType, 'orderManagement', 'manage_status')
  const canEditOrders = hasPermission(currentUserType, 'orderManagement', 'edit')

  // Load data
  useEffect(() => {
    loadData()
    // Poll for updates every 15 seconds
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setRefreshing(true)
      
      // Load orders from notifications
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
      const orderNotifications = allNotifications.filter(notif => notif.type === 'order')
      
      // Convert notifications to order format
      const orderData = orderNotifications.map(notif => ({
        id: notif.id,
        orderId: notif.orderId || `ORD-${notif.id.slice(-4).toUpperCase()}`,
        customerName: notif.customerName || 'Guest',
        tableNumber: notif.tableNumber || 'N/A',
        phoneNumber: notif.phoneNumber || 'Not provided',
        status: notif.orderStatus || 'pending',
        items: notif.items || [],
        totalAmount: notif.totalAmount || 0,
        orderTime: notif.timestamp,
        estimatedDelivery: notif.estimatedDelivery,
        specialInstructions: notif.specialInstructions || '',
        assignedTo: notif.assignedTo || null,
        assignedToName: notif.assignedToName || null,
        location: notif.location || 'Main Dining',
        priority: notif.priority || 'medium'
      }))
      
      // Load employees
      const employeesData = JSON.parse(localStorage.getItem('employees') || '[]')
      
      setOrders(orderData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading order data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    if (!canManageStatus) {
      alert('You do not have permission to update order status.')
      return
    }

    // Find the order to get the order number for tableTrackingService sync
    const currentOrder = orders.find(o => o.id === orderId)
    if (!currentOrder) {
      console.error('Order not found:', orderId)
      return
    }

    // Extract order number from orderId (remove ORD- prefix if present)
    const orderNumber = currentOrder.orderId.replace('ORD-', '')

    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedNotifications = allNotifications.map(notif => {
      if (notif.id === orderId) {
        return { 
          ...notif, 
          orderStatus: newStatus, 
          lastUpdated: Date.now(),
          updatedBy: user?.name || 'Admin'
        }
      }
      return notif
    })
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
    
    // IMPORTANT: Also update tableTrackingService to sync with employee dashboard
    try {
      tableTrackingService.updateOrderStatus(orderNumber, newStatus)
      console.log(`Synced order ${orderNumber} status to ${newStatus} in tableTrackingService`)
    } catch (error) {
      console.error('Failed to sync order status with tableTrackingService:', error)
    }
    
    // Update local state
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))

    // Create status update notification
    const statusNotification = {
      id: Date.now().toString(),
      type: 'status_update',
      title: `Order ${currentOrder.orderId} Updated`,
      message: `Status changed to ${newStatus} by ${user?.name}`,
      timestamp: Date.now(),
      isRead: false,
      priority: 'medium'
    }
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    notifications.unshift(statusNotification)
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }

  // Assign order to employee
  const assignOrder = (orderId, employeeId) => {
    if (!canAssignOrders) {
      alert('You do not have permission to assign orders.')
      return
    }

    const employee = employees.find(emp => emp.id === employeeId)
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedNotifications = allNotifications.map(notif => {
      if (notif.id === orderId) {
        return { 
          ...notif, 
          assignedTo: employeeId,
          assignedToName: employee?.name || 'Unknown Employee',
          lastUpdated: Date.now(),
          assignedBy: user?.name || 'Admin'
        }
      }
      return notif
    })
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
    
    // Update local state
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, assignedTo: employeeId, assignedToName: employee?.name }
        : order
    ))

    // Create assignment notification
    const assignmentNotification = {
      id: Date.now().toString(),
      type: 'order_assignment',
      title: `Order ${orders.find(o => o.id === orderId)?.orderId} Assigned`,
      message: `Order assigned to ${employee?.name} by ${user?.name}`,
      timestamp: Date.now(),
      isRead: false,
      priority: 'medium',
      employeeId
    }
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    notifications.unshift(assignmentNotification)
    localStorage.setItem('notifications', JSON.stringify(notifications))

    setShowAssignModal(false)
    setSelectedOrder(null)
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber.toString().includes(searchTerm)
    
    return matchesStatus && matchesSearch
  }).sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'preparing': return <Package className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'out_for_delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { 
            title: 'Total Orders', 
            value: orders.length, 
            icon: Hash, 
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            title: 'Pending Orders', 
            value: orders.filter(o => o.status === 'pending').length, 
            icon: Clock, 
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
          },
          { 
            title: 'Ready for Delivery', 
            value: orders.filter(o => o.status === 'ready').length, 
            icon: Package, 
            color: 'green',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
          },
          { 
            title: 'Assigned Orders', 
            value: orders.filter(o => o.assignedTo).length, 
            icon: Users, 
            color: 'purple',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
          }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`${stat.bgColor} rounded-xl p-4 sm:p-6 border border-opacity-20`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-semibold ${stat.textColor} opacity-70`}>
                    {stat.title}
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${stat.textColor} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 bg-white rounded-lg shadow-sm`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Orders', shortLabel: 'All', count: orders.length },
              { value: 'pending', label: 'Pending', shortLabel: 'Pend.', count: orders.filter(o => o.status === 'pending').length },
              { value: 'preparing', label: 'Preparing', shortLabel: 'Prep.', count: orders.filter(o => o.status === 'preparing').length },
              { value: 'ready', label: 'Ready', shortLabel: 'Ready', count: orders.filter(o => o.status === 'ready').length },
              { value: 'out_for_delivery', label: 'Out for Delivery', shortLabel: 'Deliv.', count: orders.filter(o => o.status === 'out_for_delivery').length },
              { value: 'delivered', label: 'Delivered', shortLabel: 'Done', count: orders.filter(o => o.status === 'delivered').length }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center gap-1 sm:gap-2 justify-center ${
                  statusFilter === filter.value
                    ? 'bg-gold text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.shortLabel}</span>
                <span className="bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors disabled:opacity-50 justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Package className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">
              {statusFilter === 'all' 
                ? "There are no orders to display at the moment."
                : `No orders match the "${statusFilter}" filter.`}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-gold-50 rounded-lg flex-shrink-0">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-charcoal">
                          Order {order.orderId}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`text-xs font-semibold ${getPriorityColor(order.priority)}`}>
                            ● {order.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="truncate">{order.customerName}</span>
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Table {order.tableNumber}
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="truncate">{order.phoneNumber}</span>
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="truncate">{new Date(order.orderTime).toLocaleString()}</span>
                        </span>
                      </div>

                      {order.items.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600 font-medium">Items:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {order.specialInstructions && (
                        <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-start">
                            <MessageSquare className="w-4 h-4 text-amber-600 mr-2 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-amber-800">Special Instructions:</span>
                              <p className="text-sm text-amber-700 mt-1">{order.specialInstructions}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.assignedTo && (
                        <div className="flex items-center text-sm text-green-600 mb-2">
                          <User className="w-4 h-4 mr-1" />
                          <span>Assigned to: {order.assignedToName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {canAssignOrders && !order.assignedTo && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowAssignModal(true)
                        }}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <span className="hidden sm:inline">Assign Employee</span>
                        <span className="sm:hidden">Assign</span>
                      </button>
                    )}
                    
                    {canManageStatus && (
                      <>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            <span className="hidden sm:inline">Start Preparing</span>
                            <span className="sm:hidden">Start Prep</span>
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Mark Ready
                          </button>
                        )}
                        
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                            className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            <span className="hidden sm:inline">Out for Delivery</span>
                            <span className="sm:hidden">Out for Del.</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Employee Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">
                Assign Order {selectedOrder.orderId}
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {employees.filter(emp => emp.status === 'active').map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => assignOrder(selectedOrder.id, employee.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gold hover:bg-gold-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-charcoal">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.designation}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedOrder(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
