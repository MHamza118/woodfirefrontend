import axios from 'axios'

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.woodfire.food/api/v1'

class TicketsApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        })

        // Add token to requests
        this.api.interceptors.request.use((config) => {
            const token = this.getToken()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        // Handle response errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired, redirect to login
                    this.clearToken()
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }
        )
    }

    getToken() {
        // Try employee token first, then admin token
        return localStorage.getItem('employee_token') || localStorage.getItem('admin_token')
    }

    clearToken() {
        localStorage.removeItem('employee_token')
        localStorage.removeItem('admin_token')
    }

    // Admin API methods
    async getTickets(filters = {}) {
        try {
            const response = await this.api.get('/admin/tickets', { params: filters })
            return response.data
        } catch (error) {
            console.error('Error fetching tickets:', error)
            throw error
        }
    }

    async getTicketById(id) {
        try {
            const response = await this.api.get(`/admin/tickets/${id}`)
            return response.data
        } catch (error) {
            console.error('Error fetching ticket:', error)
            throw error
        }
    }

    async updateTicket(id, updates) {
        try {
            const response = await this.api.put(`/admin/tickets/${id}`, updates)
            return response.data
        } catch (error) {
            console.error('Error updating ticket:', error)
            throw error
        }
    }

    async archiveTicket(id) {
        try {
            const response = await this.api.post(`/admin/tickets/${id}/archive`)
            return response.data
        } catch (error) {
            console.error('Error archiving ticket:', error)
            throw error
        }
    }

    async deleteTicket(id) {
        try {
            const response = await this.api.delete(`/admin/tickets/${id}`)
            return response.data
        } catch (error) {
            console.error('Error deleting ticket:', error)
            throw error
        }
    }

    async addTicketResponse(id, responseData) {
        try {
            const response = await this.api.post(`/admin/tickets/${id}/responses`, responseData)
            return response.data
        } catch (error) {
            console.error('Error adding ticket response:', error)
            throw error
        }
    }

    async getTicketStatistics() {
        try {
            const response = await this.api.get('/admin/tickets/statistics')
            return response.data
        } catch (error) {
            console.error('Error fetching ticket statistics:', error)
            throw error
        }
    }

    // Employee API methods
    async getEmployeeTickets(filters = {}) {
        try {
            const response = await this.api.get('/employee/tickets', { params: filters })
            return response.data
        } catch (error) {
            console.error('Error fetching employee tickets:', error)
            throw error
        }
    }

    async createTicket(ticketData) {
        try {
            const response = await this.api.post('/employee/tickets', ticketData)
            return response.data
        } catch (error) {
            console.error('Error creating ticket:', error)
            throw error
        }
    }

    async getEmployeeTicketById(id) {
        try {
            const response = await this.api.get(`/employee/tickets/${id}`)
            return response.data
        } catch (error) {
            console.error('Error fetching employee ticket:', error)
            throw error
        }
    }

    // Shared methods
    async getTicketConfiguration() {
        try {
            const response = await this.api.get('/admin/tickets/configuration')
            return response.data
        } catch (error) {
            console.error('Error fetching ticket configuration:', error)
            throw error
        }
    }

    // Helper methods for frontend compatibility
    transformTicketForFrontend(ticket) {
        return {
            id: ticket.id?.toString() || ticket.id,
            employeeId: ticket.employee_id,
            employeeName: ticket.employee_name,
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            location: ticket.location,
            archived: ticket.archived,
            createdAt: ticket.created_at,
            updatedAt: ticket.updated_at,
            responses: ticket.responses?.map(response => ({
                id: response.id?.toString() || response.id,
                message: response.message,
                respondedBy: response.responded_by,
                respondedAt: response.responded_at,
                internal: response.internal
            })) || [],
            employee: ticket.employee || null
        }
    }

    transformTicketsForFrontend(tickets) {
        return tickets.map(ticket => this.transformTicketForFrontend(ticket))
    }

    // Status helpers to match frontend expectations
    getStatusColor(status) {
        const statusColors = {
            'open': 'bg-blue-100 text-blue-700',
            'in-progress': 'bg-yellow-100 text-yellow-700',
            'resolved': 'bg-green-100 text-green-700',
            'closed': 'bg-gray-100 text-gray-700'
        }
        return statusColors[status] || statusColors['open']
    }

    getPriorityColor(priority) {
        const priorityColors = {
            'low': 'bg-green-100 text-green-700',
            'medium': 'bg-yellow-100 text-yellow-700',
            'high': 'bg-orange-100 text-orange-700',
            'urgent': 'bg-red-100 text-red-700'
        }
        return priorityColors[priority] || priorityColors['medium']
    }

    getCategoryIcon(category) {
        const categoryIcons = {
            'broken-equipment': 'Wrench',
            'software-issue': 'Monitor',
            'pos-problem': 'CreditCard',
            'kitchen-equipment': 'Utensils',
            'facility-issue': 'AlertTriangle',
            'other': 'Tag'
        }
        return categoryIcons[category] || categoryIcons['other']
    }

    // Error handling helper
    handleApiError(error) {
        if (error.response?.data?.message) {
            return error.response.data.message
        } else if (error.message) {
            return error.message
        } else {
            return 'An unexpected error occurred'
        }
    }
}

// Export singleton instance
const ticketsApiService = new TicketsApiService()
export default ticketsApiService
