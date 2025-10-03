const API_BASE_URL = 'https://woodfire.food/api/v1'

class TableTrackingApiService {
    constructor() {
        this.baseURL = API_BASE_URL
    }

    // Helper method to get auth header - checks both admin and employee tokens
    getAuthHeader() {
        const adminToken = localStorage.getItem('admin_token')
        const employeeToken = localStorage.getItem('employee_token')
        const token = adminToken || employeeToken
        return token ? { 'Authorization': `Bearer ${token}` } : {}
    }

    // Helper method to check if user is admin
    isAdmin() {
        return !!localStorage.getItem('admin_token')
    }

    // Helper method to check if user is employee
    isEmployee() {
        return !!localStorage.getItem('employee_token') && !this.isAdmin()
    }

    // Helper method to make API requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...this.getAuthHeader()
            }
        }

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        }

        try {
            const response = await fetch(url, requestOptions)
            const data = await response.json()

            if (!response.ok) {
                // Handle validation errors (422) with detailed messages
                if (response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join(', ')
                    throw new Error(`Validation failed: ${errorMessages}`)
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`)
            }

            return data
        } catch (error) {
            console.error('Table Tracking API Request failed:', error)
            throw error
        }
    }

    /**
     * Submit table mapping (Customer seating page)
     */
    async submitTableMapping(tableNumber, orderNumber) {
        try {
            // Generate unique submission ID to prevent duplicate order replacement
            const submissionId = `${orderNumber.toString()}_${tableNumber.toString().toUpperCase()}_${Date.now()}`
            const response = await this.makeRequest('/table-tracking/submit', {
                method: 'POST',
                body: JSON.stringify({ 
                    table_number: tableNumber.toString().toUpperCase(),
                    order_number: orderNumber.toString(),
                    submission_id: submissionId,
                    submitted_at: new Date().toISOString(),
                    source: 'customer_walk_in'
                })
            })

            if (response.success) {
                return {
                    success: true,
                    mapping: response.data.mapping,
                    order: response.data.order,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to submit table mapping' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all orders (admin or employee)
     */
    async getAllOrders() {
        try {
            const endpoint = this.isEmployee() 
                ? '/employee/table-tracking/orders'
                : '/admin/table-tracking/orders'
                
            const response = await this.makeRequest(endpoint)

            if (response.success) {
                return {
                    success: true,
                    orders: response.data.orders,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get orders' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all mappings (admin or employee)
     */
    async getAllMappings() {
        try {
            const endpoint = this.isEmployee()
                ? '/employee/table-tracking/mappings'
                : '/admin/table-tracking/mappings'
                
            const response = await this.makeRequest(endpoint)

            if (response.success) {
                return {
                    success: true,
                    mappings: response.data.mappings,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get mappings' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get analytics for admin
     */
    async getAnalytics() {
        try {
            const response = await this.makeRequest('/admin/table-tracking/analytics')

            if (response.success) {
                return {
                    success: true,
                    analytics: response.data.analytics,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get analytics' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Add order manually (Admin)
     */
    async addOrder(orderData) {
        try {
            // Generate unique order creation ID to prevent conflicts
            const creationId = `order_${orderData.orderNumber}_${Date.now()}`
            const response = await this.makeRequest('/admin/table-tracking/orders', {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderData.orderNumber,
                    customer_name: orderData.customerName || 'Walk-in Customer',
                    status: orderData.status || 'pending',
                    creation_id: creationId,
                    created_at: new Date().toISOString(),
                    source: 'admin_manual_order'
                })
            })

            if (response.success) {
                return {
                    success: true,
                    order: response.data.order,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to add order' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Update order status (Admin or Employee) - Updated to support specific order targeting
     */
    async updateOrderStatus(orderNumber, status, mappingId = null, tableNumber = null) {
        try {
            const requestBody = { status }
            if (mappingId) {
                requestBody.mapping_id = mappingId
            }
            if (tableNumber) {
                requestBody.table_number = tableNumber
            }
            
            // Use appropriate endpoint based on user type
            const endpoint = this.isEmployee()
                ? `/employee/table-tracking/orders/${orderNumber}/status`
                : `/admin/table-tracking/orders/${orderNumber}/status`
            
            const response = await this.makeRequest(endpoint, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            })

            if (response.success) {
                return {
                    success: true,
                    order: response.data.order,
                    mapping: response.data.mapping,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to update order status' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark order as delivered (Admin or Employee)
     */
    async markDelivered(orderNumber, deliveredBy, mappingId = null, tableNumber = null) {
        try {
            const requestBody = { delivered_by: deliveredBy }
            if (mappingId) {
                requestBody.mapping_id = mappingId
            }
            if (tableNumber) {
                requestBody.table_number = tableNumber
            }
            
            // Use appropriate endpoint based on user type
            const endpoint = this.isEmployee()
                ? `/employee/table-tracking/orders/${orderNumber}/delivered`
                : `/admin/table-tracking/orders/${orderNumber}/delivered`
            
            const response = await this.makeRequest(endpoint, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            })

            if (response.success) {
                return {
                    success: true,
                    order: response.data.order,
                    mapping: response.data.mapping,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to mark as delivered' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete order (Admin)
     */
    async deleteOrder(orderNumber, mappingId = null, tableNumber = null) {
        try {
            const requestBody = {}
            if (mappingId) {
                requestBody.mapping_id = mappingId
            }
            if (tableNumber) {
                requestBody.table_number = tableNumber
            }
            
            const response = await this.makeRequest(`/admin/table-tracking/orders/${orderNumber}`, {
                method: 'DELETE',
                body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to delete order' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Submit manual table mapping (Admin)
     */
    async submitManualMapping(tableNumber, orderNumber) {
        try {
            // Generate unique submission ID to prevent duplicate order replacement
            const submissionId = `${orderNumber.toString()}_${tableNumber.toString().toUpperCase()}_${Date.now()}_manual`
            const response = await this.makeRequest('/admin/table-tracking/manual-mapping', {
                method: 'POST',
                body: JSON.stringify({ 
                    table_number: tableNumber.toString().toUpperCase(),
                    order_number: orderNumber.toString(),
                    submission_id: submissionId,
                    submitted_at: new Date().toISOString(),
                    source: 'admin_manual'
                })
            })

            if (response.success) {
                return {
                    success: true,
                    mapping: response.data.mapping,
                    order: response.data.order,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to submit manual mapping' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Clear mapping (Admin)
     */
    async clearMapping(orderNumber, reason) {
        try {
            const response = await this.makeRequest(`/admin/table-tracking/mappings/${orderNumber}/clear`, {
                method: 'PUT',
                body: JSON.stringify({ reason })
            })

            if (response.success) {
                return {
                    success: true,
                    mapping: response.data.mapping,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to clear mapping' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get notifications for employees
     */
    async getEmployeeNotifications(employeeId) {
        try {
            const response = await this.makeRequest(`/employee/table-tracking/notifications`)

            if (response.success) {
                return {
                    success: true,
                    notifications: response.data.notifications,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get employee notifications' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark notification as read for employee
     */
    async markNotificationAsRead(notificationId) {
        try {
            const response = await this.makeRequest(`/employee/table-tracking/notifications/${notificationId}/read`, {
                method: 'PUT'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to mark notification as read' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark all notifications as read for employee
     */
    async markAllNotificationsAsRead() {
        try {
            const response = await this.makeRequest('/employee/table-tracking/notifications/mark-all-read', {
                method: 'PUT'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to mark all notifications as read' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete notification for employee
     */
    async deleteNotification(notificationId) {
        try {
            const response = await this.makeRequest(`/employee/table-tracking/notifications/${notificationId}`, {
                method: 'DELETE'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to delete notification' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get admin notifications 
     */
    async getAdminNotifications() {
        try {
            const response = await this.makeRequest('/admin/table-tracking/notifications')

            if (response.success) {
                return {
                    success: true,
                    notifications: response.data.notifications,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get admin notifications' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark admin notification as read
     */
    async markAdminNotificationAsRead(notificationId) {
        try {
            const response = await this.makeRequest(`/admin/table-tracking/notifications/${notificationId}/read`, {
                method: 'PUT'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to mark admin notification as read' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete admin notification
     */
    async deleteAdminNotification(notificationId) {
        try {
            const response = await this.makeRequest(`/admin/table-tracking/notifications/${notificationId}`, {
                method: 'DELETE'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to delete admin notification' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get table settings (valid table numbers, areas)
     */
    async getTableSettings() {
        try {
            const response = await this.makeRequest('/table-tracking/settings')

            if (response.success) {
                return {
                    success: true,
                    settings: response.data.settings,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get table settings' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
}

const tableTrackingApiService = new TableTrackingApiService()
export default tableTrackingApiService
