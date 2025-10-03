import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, RefreshCw, Clock, MapPin, Hash, CheckCircle, AlertTriangle, Users, ChefHat, Truck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { hasPermission } from '../../utils/permissions'
import tableTrackingService from '../../services/tableTrackingService'
import orderNotificationService from '../../services/orderNotificationService'
import notificationService from '../../services/notificationService'

const TableTrackingManagement = () => {
  const { user } = useAuth()
  const [mappings, setMappings] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [areaFilter, setAreaFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const currentUserType = user?.role || user?.userType || 'General User'
  const canCreate = hasPermission(currentUserType, 'tableTracking', 'create')
  const canEdit = hasPermission(currentUserType, 'tableTracking', 'edit')
  const canDelete = hasPermission(currentUserType, 'tableTracking', 'delete')
  
  // Debug logging
  console.log('TableTracking Debug:', { 
    user, 
    currentUserType, 
    canCreate, 
    canEdit, 
    canDelete 
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 Loading admin table tracking data...')
      
      const [mappingsData, ordersData, analyticsData] = await Promise.all([
        tableTrackingService.getAllMappings(),
        tableTrackingService.getAllOrders(),
        tableTrackingService.getAnalytics()
      ])
      
      console.log('📊 Raw API response data:', { 
        mappingsData, 
        ordersData, 
        analyticsData 
      })
      
      console.log('🔢 Data analysis:', {
        mappingsCount: mappingsData?.length || 0,
        ordersCount: ordersData?.length || 0,
        uniqueOrderNumbers: ordersData ? [...new Set(ordersData.map(o => o.orderNumber || o.order_number))] : [],
        orderNumbers: ordersData?.map(o => o.orderNumber || o.order_number) || [],
        duplicateOrders: ordersData ? ordersData.length - [...new Set(ordersData.map(o => o.orderNumber || o.order_number))].length : 0
      })
      
      // Ensure we have arrays
      setMappings(Array.isArray(mappingsData) ? mappingsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setAnalytics(analyticsData || {})
      
      console.log('✅ Admin table tracking data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading data:', error)
      // Set empty states on error
      setMappings([])
      setOrders([])
      setAnalytics({})
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const handleManualEntry = async (tableNumber, orderNumber) => {
    try {
      await tableTrackingService.submitTableMapping(tableNumber, orderNumber, 'admin')
      
      // Notifications are handled automatically by the API
      
      await loadData()
      setShowManualEntry(false)
      alert('Table mapping added successfully!')
    } catch (error) {
      alert(error.message)
    }
  }

  const handleUpdateOrderStatus = async (orderNumber, newStatus, tableNumber, mappingId) => {
    try {
      console.log('Updating order status:', { orderNumber, newStatus, tableNumber, mappingId })
      
      // Update the order status via API with mapping ID for specific targeting
      await tableTrackingService.updateOrderStatus(orderNumber, newStatus, mappingId, tableNumber)
      
      // Reload data to reflect changes
      await loadData()
      
      console.log('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status: ' + error.message)
    }
  }

  const handleMarkDelivered = async (orderNumber, mappingId, tableNumber) => {
    try {
      await tableTrackingService.markDelivered(orderNumber, user?.name || 'Admin', mappingId, tableNumber)
      await loadData()
    } catch (error) {
      alert('Error marking as delivered: ' + error.message)
    }
  }

  const handleClearMapping = async (orderNumber) => {
    if (window.confirm('Are you sure you want to clear this mapping?')) {
      try {
        await tableTrackingService.clearMapping(orderNumber, 'admin_clear')
        await loadData()
      } catch (error) {
        alert('Error clearing mapping: ' + error.message)
      }
    }
  }

  const handleDeleteOrder = async (orderNumber, mappingId = null, tableNumber = null) => {
    if (window.confirm('Are you sure you want to DELETE this order? This will permanently remove the order and clear its table mapping.')) {
      try {
        await tableTrackingService.deleteOrder(orderNumber, mappingId, tableNumber)
        
        // Notifications handled by API
        
        await loadData()
        alert('Order deleted successfully!')
      } catch (error) {
        alert('Error deleting order: ' + error.message)
      }
    }
  }

  const handleAddOrder = async (orderData) => {
    try {
      await tableTrackingService.addOrder(orderData)
      
      // Notifications handled by API
      
      await loadData()
      setShowAddOrder(false)
      alert('Order added successfully!')
    } catch (error) {
      alert('Error adding order: ' + error.message)
    }
  }

  const exportTodayReport = async () => {
    try {
      const data = await tableTrackingService.exportDailyLog()
      const csvContent = tableTrackingService.generateCSVContent(data)
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `table-tracking-report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Error exporting report: ' + error.message)
    }
  }

  // Filter mappings based on search and filters
  const filteredMappings = (mappings || []).filter(mapping => {
    try {
      const orderNumber = mapping?.order_number || mapping?.orderNumber || ''
      const tableNumber = mapping?.table_number || mapping?.tableNumber || ''
      
      const matchesSearch = orderNumber.toString().includes(searchTerm) || 
                           tableNumber.toString().toUpperCase().includes(searchTerm.toUpperCase())
      const matchesStatus = statusFilter === 'all' || mapping?.status === statusFilter
      const matchesArea = areaFilter === 'all' || (mapping?.area || 'unknown') === areaFilter
      
      return matchesSearch && matchesStatus && matchesArea
    } catch (error) {
      console.error('Error filtering mapping:', error, mapping)
      return false
    }
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'cleared': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'preparing': return 'text-blue-600 bg-blue-100'
      case 'ready': return 'text-purple-600 bg-purple-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getOrderByNumber = (orderNumber, mappingId = null) => {
    try {
      if (!orderNumber || !Array.isArray(orders)) return null
      
      // First try to find an order that matches both order number and has a specific mapping relationship
      if (mappingId) {
        const specificOrder = orders.find(order => {
          const orderNum = order?.order_number || order?.orderNumber
          return orderNum === orderNumber && (order?.mapping_id === mappingId || order?.id === mappingId)
        })
        if (specificOrder) return specificOrder
      }
      
      // Fall back to first order with matching number
      return orders.find(order => 
        order?.order_number === orderNumber || order?.orderNumber === orderNumber
      )
    } catch (error) {
      console.error('Error finding order:', error, orderNumber)
      return null
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

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return 'Invalid time'
    }
  }

  const getTimeSinceSubmission = (createdAt) => {
    if (!createdAt) return 'Unknown'
    try {
      const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
      if (minutes < 1) return 'Just now'
      if (minutes === 1) return '1 min ago'
      return `${minutes} mins ago`
    } catch (error) {
      return 'Unknown time'
    }
  }

  const todayStats = analytics.dailyStats?.[new Date().toISOString().split('T')[0]] || {
    submissions: 0,
    deliveries: 0,
    averageDeliveryTime: 0
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Table Tracking Management</h2>
          <p className="text-gray-600">Monitor and manage customer table assignments</p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 w-full sm:w-auto mobile-hide-button-icons"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="mobile-text-content">Refresh</span>
          </button>
          {canCreate && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowManualEntry(true)}
                className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none mobile-hide-button-icons"
              >
                <Plus className="w-4 h-4" />
                <span className="mobile-text-content">Manual Entry</span>
              </button>
              <button
                onClick={() => setShowAddOrder(true)}
                className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none mobile-hide-button-icons"
              >
                <Plus className="w-4 h-4" />
                <span className="mobile-text-content">Add Order</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Submissions</p>
              <p className="text-2xl font-bold text-charcoal">{todayStats.submissions}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{todayStats.deliveries}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Mappings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {mappings.filter(m => m.status === 'active').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders or tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="delivered">Delivered</option>
            <option value="cleared">Cleared</option>
          </select>

          {/* Area Filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          >
            <option value="all">All Areas</option>
            <option value="dining">Dining Room</option>
            <option value="patio">Patio</option>
            <option value="bar">Bar</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredMappings.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mappings found</h3>
            <p className="text-gray-500 mb-6">
              {mappings.length === 0 
                ? "No table mappings have been submitted yet."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table & Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mapping Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hidden-480">
                          <Hash className="w-5 h-5 text-gold" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Order #{mapping.order_number || mapping.orderNumber}
                            {(() => {
                              const orderNum = mapping.order_number || mapping.orderNumber
                              const duplicateCount = mappings.filter(m => 
                                (m.order_number || m.orderNumber) === orderNum && m.status === 'active'
                              ).length
                              return duplicateCount > 1 ? (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {duplicateCount} locations
                                </span>
                              ) : null
                            })()
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapping.updateCount > 0 && (
                              <span className="text-orange-600">Updated {mapping.updateCount} time(s)</span>
                            )}
                            {mapping.submission_id && (
                              <span className="text-xs text-gray-400 block">ID: {mapping.submission_id?.split('_')[3] || 'N/A'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mapping.customer_name || mapping.customerName || 'Walk-in Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mapping.customer_phone || mapping.customerPhone || 'No phone'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Table {mapping.table_number || mapping.tableNumber}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAreaColor(mapping.area || 'unknown')}`}>
                        {mapping.area || 'unknown'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(mapping.created_at || mapping.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTimeSinceSubmission(mapping.created_at || mapping.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mapping.status)}`}>
                        {mapping.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const orderStatus = mapping.specific_order?.status || mapping.specificOrder?.status || 'pending'
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(orderStatus)}`}>
                            {orderStatus}
                          </span>
                        )
                      })()
                    }
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mapping.source === 'customer' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'
                      }`}>
                        {mapping.source}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const orderNumber = mapping.order_number || mapping.orderNumber
                          const tableNumber = mapping.table_number || mapping.tableNumber
                          const orderStatus = mapping.specific_order?.status || mapping.specificOrder?.status || 'pending'
                          
                          return (
                            <>
                              {canEdit && mapping.status === 'active' && (
                                <select
                                  value={orderStatus}
                                  onChange={(e) => handleUpdateOrderStatus(orderNumber, e.target.value, tableNumber, mapping.id)}
                                  className={`text-xs font-medium px-2.5 py-1.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ${getOrderStatusColor(orderStatus)} min-w-[100px]`}
                                  title="Update Order Status"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="ready">Ready</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="completed">Completed</option>
                                </select>
                              )}
                              
                              {mapping.status === 'active' && canEdit && (
                                <button
                                  onClick={() => handleMarkDelivered(mapping.order_number || mapping.orderNumber, mapping.id, mapping.table_number || mapping.tableNumber)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                  title="Mark as Delivered"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteOrder(mapping.order_number || mapping.orderNumber, mapping.id, mapping.table_number || mapping.tableNumber)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )
                        })()
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntryModal
          onSubmit={handleManualEntry}
          onClose={() => setShowManualEntry(false)}
        />
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <AddOrderModal
          onSubmit={handleAddOrder}
          onClose={() => setShowAddOrder(false)}
        />
      )}
    </div>
  )
}

// Manual Entry Modal Component
const ManualEntryModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    tableNumber: '',
    orderNumber: ''
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.tableNumber) newErrors.tableNumber = 'Table number is required'
    if (!formData.orderNumber) newErrors.orderNumber = 'Order number is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData.tableNumber, formData.orderNumber)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4">Manual Table Entry</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Table Number *
            </label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="e.g., 12, P3, B1"
            />
            {errors.tableNumber && <p className="text-red-500 text-xs mt-1">{errors.tableNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Order Number *
            </label>
            <input
              type="text"
              value={formData.orderNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="e.g., 4837"
            />
            {errors.orderNumber && <p className="text-red-500 text-xs mt-1">{errors.orderNumber}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all"
            >
              Add Mapping
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Order Modal Component
const AddOrderModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    status: 'pending'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.orderNumber) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-charcoal mb-4">Add New Order</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Order Number *
            </label>
            <input
              type="text"
              value={formData.orderNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="e.g., 4840"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Walk-in Customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all"
            >
              Add Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TableTrackingManagement
