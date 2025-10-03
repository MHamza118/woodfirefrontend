import { useState, useEffect } from 'react'
import { Hash, MapPin, Clock, CheckCircle, Truck, ChefHat, AlertCircle, RefreshCw } from 'lucide-react'
import tableTrackingService from '../../services/tableTrackingService'
import orderNotificationService from '../../services/orderNotificationService'

const OrderTrackingSection = ({ employeeData }) => {
  // Extract employee ID from employee data
  const employeeId = employeeData?.id || employeeData?.employee?.id;
  const [orders, setOrders] = useState([])
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ready') // 'all', 'ready', 'preparing'
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()
    // Set up polling for real-time updates
    const interval = setInterval(loadOrders, 60000) // Every 60 seconds
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      setRefreshing(true)
      
      const allOrders = await tableTrackingService.getAllOrders()
      const allMappings = await tableTrackingService.getAllMappings()
      
      // Use all mappings, not just active ones
      setOrders(allOrders)
      setMappings(allMappings)
      
    } catch (error) {
      console.error('Error loading employee orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleOrderStatusUpdate = async (orderNumber, newStatus, tableNumber, mappingId) => {
    try {
      // Update order status with proper context so backend can resolve the specific order
      await tableTrackingService.updateOrderStatus(orderNumber, newStatus, mappingId, tableNumber)
      
      // If delivered, mark mapping as delivered
      if (newStatus === 'delivered') {
        await tableTrackingService.markDelivered(orderNumber, `Employee ${employeeId}`, mappingId, tableNumber)
      }
      
      // Reload data
      await loadOrders()
      
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  // Combine orders with their mapping info - use specific_order from API
  const ordersWithMappings = mappings.map(mapping => {
    const orderStatus = mapping.specific_order?.status || 'pending'
    
    return {
      ...mapping,
      orderNumber: mapping.order_number,
      orderStatus: orderStatus,
      orderTimestamp: mapping.specific_order?.created_at || mapping.created_at,
      mappingId: mapping.id
    }
  })

  // Calculate stats from ALL orders (not just filtered ones)
  const allOrdersCount = ordersWithMappings.length
  const readyOrdersCount = ordersWithMappings.filter(order => order.orderStatus === 'ready').length
  const preparingOrdersCount = ordersWithMappings.filter(order => order.orderStatus === 'preparing').length
  const pendingOrdersCount = ordersWithMappings.filter(order => order.orderStatus === 'pending').length
  const deliveredOrdersCount = ordersWithMappings.filter(order => order.orderStatus === 'delivered').length
  const completedOrdersCount = ordersWithMappings.filter(order => order.orderStatus === 'completed').length

  // Filter orders based on selected filter
  const filteredOrders = ordersWithMappings.filter(order => {
    if (filter === 'all') return true
    if (filter === 'ready') return order.orderStatus === 'ready'
    if (filter === 'preparing') return order.orderStatus === 'preparing'
    if (filter === 'pending') return order.orderStatus === 'pending'
    if (filter === 'delivered') return order.orderStatus === 'delivered'
    if (filter === 'completed') return order.orderStatus === 'completed'
    return true
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'preparing': return 'text-blue-600 bg-blue-100'
      case 'ready': return 'text-purple-600 bg-purple-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAreaColor = (area) => {
    switch (area) {
      case 'dining': return 'text-purple-600 bg-purple-100'
      case 'patio': return 'text-green-600 bg-green-100'
      case 'bar': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
  }

  // Stats are calculated above from all orders, not just filtered ones

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
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 mobile-card-padding">
        <div className="mobile-header-container">
          <div className="w-full">
            <h3 className="text-base sm:text-lg font-semibold text-charcoal mobile-main-header">Order Tracking</h3>
            <p className="text-gray-600 text-sm mobile-subtitle">Monitor and deliver customer orders</p>
          </div>
          <button
            onClick={loadOrders}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gold/10 text-gold rounded-md hover:bg-gold/20 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center mobile-primary-button mt-3 sm:mt-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 role-assignment-stats-grid">
          <div className="bg-purple-50 p-3 rounded-lg text-center mobile-stat-content">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{readyOrdersCount}</div>
            <div className="text-xs sm:text-sm text-purple-600">Ready for Delivery</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center mobile-stat-content">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{preparingOrdersCount}</div>
            <div className="text-xs sm:text-sm text-blue-600">Being Prepared</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center mobile-stat-content">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">{allOrdersCount}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Active</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 mt-4">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pend.</span>
            <span className="ml-1">({pendingOrdersCount})</span>
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'preparing'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">Preparing</span>
            <span className="sm:hidden">Prep.</span>
            <span className="ml-1">({preparingOrdersCount})</span>
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'ready'
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ready ({readyOrdersCount})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'delivered'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">Delivered</span>
            <span className="sm:hidden">Deliv.</span>
            <span className="ml-1">({deliveredOrdersCount})</span>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-gray-100 text-gray-700 border border-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Comp.</span>
            <span className="ml-1">({completedOrdersCount})</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-200 text-gray-800 border border-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({allOrdersCount})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 sm:p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">
              {filter === 'ready' && 'No orders are ready for delivery right now.'}
              {filter === 'preparing' && 'No orders are currently being prepared.'}
              {filter === 'all' && 'No active orders at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={`${order.mappingId || order.id}_${order.orderNumber}_${order.table_number || order.tableNumber}`}
                className={`border-2 rounded-lg p-3 sm:p-4 transition-all ${
                  order.orderStatus === 'ready' 
                    ? 'border-purple-200 bg-purple-50' 
                    : 'border-gray-200 bg-white hover:border-gold/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Order Info */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mobile-hide-hero-icon">
                      <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg font-semibold text-charcoal">
                          Order #{order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Table {order.table_number || order.tableNumber}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getAreaColor(order.area)}`}>
                            {order.area || 'dining'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {order.orderStatus === 'preparing' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.orderNumber, 'ready', order.table_number || order.tableNumber, order.mappingId)}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                        title="Mark as Ready"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span className="hidden sm:inline">Mark Ready</span>
                        <span className="sm:hidden">Ready</span>
                      </button>
                    )}
                    
                    {order.orderStatus === 'ready' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.orderNumber, 'delivered', order.table_number || order.tableNumber, order.mappingId)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-2 font-medium w-full sm:w-auto justify-center"
                        title="Mark as Delivered"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Deliver</span>
                      </button>
                    )}

                    {order.orderStatus === 'delivered' && (
                      <div className="flex items-center gap-2 text-green-600 justify-center sm:justify-start w-full sm:w-auto">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-sm font-medium">Delivered</span>
                      </div>
                    )}

                    {order.orderStatus === 'pending' && (
                      <div className="flex items-center gap-2 text-yellow-600 justify-center sm:justify-end w-full sm:w-auto">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-sm">Waiting...</span>
                      </div>
                    )}

                    {order.orderStatus === 'completed' && (
                      <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start w-full sm:w-auto">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500">
                  <span>Submitted: {formatTime(order.createdAt)}</span>
                  {order.updateCount > 0 && (
                    <span className="text-orange-600">Updated {order.updateCount} time(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTrackingSection
