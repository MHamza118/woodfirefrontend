// Table Tracking Service - API-based table tracking without localStorage

import tableTrackingApiService from './tableTrackingApiService'

class TableTrackingService {
  constructor() {
    // Cache for settings to avoid repeated API calls
    this._settingsCache = null
  }

  // Order management - now uses API
  async getAllOrders() {
    try {
      const result = await tableTrackingApiService.getAllOrders()
      if (result.success) {
        return result.orders || []
      }
      console.error('Failed to get orders:', result.error)
      return []
    } catch (error) {
      console.error('Error getting orders:', error)
      return []
    }
  }

  async getOrder(orderNumber) {
    try {
      const orders = await this.getAllOrders()
      return orders.find(order => order.order_number === orderNumber)
    } catch (error) {
      console.error('Error getting order:', error)
      return null
    }
  }

  isValidOrderNumber(orderNumber) {
    // Accept any non-empty order number that contains only numbers
    const trimmed = orderNumber.toString().trim()
    return trimmed.length > 0 && /^[0-9]+$/.test(trimmed)
  }

  async addOrder(orderData) {
    try {
      const result = await tableTrackingApiService.addOrder(orderData)
      if (result.success) {
        return result.order
      }
      throw new Error(result.error)
    } catch (error) {
      console.error('Error adding order:', error)
      throw error
    }
  }

  async updateOrderStatus(orderNumber, status, mappingId = null, tableNumber = null) {
    try {
      const result = await tableTrackingApiService.updateOrderStatus(orderNumber, status, mappingId, tableNumber)
      if (result.success) {
        return result.order
      }
      throw new Error(result.error)
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  // Delete order completely
  async deleteOrder(orderNumber, mappingId = null, tableNumber = null) {
    try {
      const result = await tableTrackingApiService.deleteOrder(orderNumber, mappingId, tableNumber)
      if (result.success) {
        return { orderNumber, deleted: true }
      }
      throw new Error(result.error)
    } catch (error) {
      console.error('Error deleting order:', error)
      throw error
    }
  }

  // Table validation - now uses API
  async getSettings() {
    if (this._settingsCache) {
      return this._settingsCache
    }
    
    try {
      const result = await tableTrackingApiService.getTableSettings()
      if (result.success) {
        this._settingsCache = result.settings
        return this._settingsCache
      }
      console.error('Failed to get settings:', result.error)
      return {}
    } catch (error) {
      console.error('Error getting settings:', error)
      return {}
    }
  }

  async isValidTableNumber(tableNumber) {
    try {
      const trimmed = tableNumber.toString().trim().toUpperCase()
      // Accept numeric tables (1+ digits), P+numeric, or B+numeric
      return trimmed.length > 0 && (
        /^[0-9]+$/.test(trimmed) ||
        /^P[0-9]+$/.test(trimmed) ||
        /^B[0-9]+$/.test(trimmed)
      )
    } catch (error) {
      console.error('Error validating table number:', error)
      return false
    }
  }

  async getTableArea(tableNumber) {
    try {
      const upperTable = tableNumber.toString().trim().toUpperCase()
      
      // Pattern-based area detection (matches backend logic)
      if (/^[0-9]+$/.test(upperTable)) return 'dining'
      if (/^P[0-9]+$/.test(upperTable)) return 'patio'
      if (/^B[0-9]+$/.test(upperTable)) return 'bar'
      return 'unknown'
    } catch (error) {
      console.error('Error getting table area:', error)
      return 'unknown'
    }
  }

  // Table-Order mappings - now uses API
  async getAllMappings() {
    try {
      const result = await tableTrackingApiService.getAllMappings()
      if (result.success) {
        return result.mappings || []
      }
      console.error('Failed to get mappings:', result.error)
      return []
    } catch (error) {
      console.error('Error getting mappings:', error)
      return []
    }
  }

  async getActiveMapping(orderNumber) {
    try {
      const mappings = await this.getAllMappings()
      return mappings.find(mapping => 
        mapping.order_number === orderNumber && mapping.status === 'active'
      )
    } catch (error) {
      console.error('Error getting active mapping:', error)
      return null
    }
  }

  async getMappingByTable(tableNumber) {
    try {
      const mappings = await this.getAllMappings()
      return mappings.filter(mapping => 
        mapping.table_number.toString().toUpperCase() === tableNumber.toString().toUpperCase() && 
        mapping.status === 'active'
      )
    } catch (error) {
      console.error('Error getting mapping by table:', error)
      return []
    }
  }

  // Create or update table-order mapping
  async submitTableMapping(tableNumber, orderNumber, source = 'customer') {
    try {
      // Validate inputs
      if (!this.isValidOrderNumber(orderNumber)) {
        throw new Error('Please enter a valid order number (numbers only).')
      }

      if (!(await this.isValidTableNumber(tableNumber))) {
        throw new Error('Invalid table number. Please check your table number and try again.')
      }

      // Use API to submit - rate limiting is handled by backend
      if (source === 'customer') {
        const result = await tableTrackingApiService.submitTableMapping(tableNumber, orderNumber)
        if (result.success) {
          return result.mapping
        }
        throw new Error(result.error)
      } else {
        // Admin manual mapping
        const result = await tableTrackingApiService.submitManualMapping(tableNumber, orderNumber)
        if (result.success) {
          return result.mapping
        }
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error submitting table mapping:', error)
      throw error
    }
  }

  // Mark order as delivered
  async markDelivered(orderNumber, deliveredBy = 'staff', mappingId = null, tableNumber = null) {
    try {
      const result = await tableTrackingApiService.markDelivered(orderNumber, deliveredBy, mappingId, tableNumber)
      if (result.success) {
        return result.mapping
      }
      throw new Error(result.error)
    } catch (error) {
      console.error('Error marking as delivered:', error)
      throw error
    }
  }

  // Clear/override mapping (Manager function)
  async clearMapping(orderNumber, reason = 'manual_clear') {
    try {
      const result = await tableTrackingApiService.clearMapping(orderNumber, reason)
      if (result.success) {
        return result.mapping
      }
      throw new Error(result.error)
    } catch (error) {
      console.error('Error clearing mapping:', error)
      throw error
    }
  }

  // Analytics - now uses API
  async getAnalytics() {
    try {
      const result = await tableTrackingApiService.getAnalytics()
      if (result.success) {
        return result.analytics
      }
      console.error('Failed to get analytics:', result.error)
      return {}
    } catch (error) {
      console.error('Error getting analytics:', error)
      return {}
    }
  }

  // Export functionality
  async exportDailyLog() {
    try {
      const [orders, mappings] = await Promise.all([
        this.getAllOrders(),
        this.getAllMappings()
      ])
      
      const today = new Date().toISOString().split('T')[0]
      const todayMappings = mappings.filter(mapping => {
        const mappingDate = new Date(mapping.created_at).toISOString().split('T')[0]
        return mappingDate === today
      })
      
      return {
        date: today,
        mappings: todayMappings,
        orders: orders.filter(order => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0]
          return orderDate === today
        }),
        summary: {
          totalSubmissions: todayMappings.length,
          delivered: todayMappings.filter(m => m.status === 'delivered').length,
          active: todayMappings.filter(m => m.status === 'active').length
        }
      }
    } catch (error) {
      console.error('Error exporting daily log:', error)
      return { date: new Date().toISOString().split('T')[0], mappings: [], orders: [], summary: {} }
    }
  }

  generateCSVContent(data) {
    if (!data.mappings || data.mappings.length === 0) {
      return 'No data available for export'
    }
    
    const headers = ['Date', 'Time', 'Order Number', 'Table Number', 'Area', 'Status', 'Source', 'Customer Name']
    const csvRows = [headers.join(',')]
    
    data.mappings.forEach(mapping => {
      const createdAt = new Date(mapping.created_at)
      const row = [
        createdAt.toISOString().split('T')[0],
        createdAt.toLocaleTimeString(),
        mapping.order_number,
        mapping.table_number,
        mapping.area || 'unknown',
        mapping.status || 'unknown',
        mapping.source || 'unknown',
        mapping.customer_name || 'Walk-in Customer'
      ]
      csvRows.push(row.join(','))
    })
    
    csvRows.push('') // Empty row
    csvRows.push(`Summary for ${data.date}`)
    csvRows.push(`Total Submissions,${data.summary.totalSubmissions || 0}`)
    csvRows.push(`Delivered,${data.summary.delivered || 0}`)
    csvRows.push(`Active,${data.summary.active || 0}`)
    
    return csvRows.join('\n')
  }

  // NOTE: localStorage clearing has been removed as the system is now fully API-based
  // All data persistence is handled by the backend database
  // No client-side storage cleanup is needed

}

// Create singleton instance
const tableTrackingService = new TableTrackingService()

// No localStorage cleanup needed - system is fully API-based
export default tableTrackingService
