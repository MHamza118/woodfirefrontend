import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://woodfire.food/api/v1'

class TimeOffApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })

    this.api.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  getToken() {
    return localStorage.getItem('employee_token') || localStorage.getItem('admin_token')
  }

  clearToken() {
    // Do not clear tokens globally here; keep consistent with app auth workflow
  }

  // Employee endpoints
  async getMyRequests(filters = {}) {
    const response = await this.api.get('/employee/time-off', { params: filters })
    return response.data
  }

  async createRequest(payload) {
    const response = await this.api.post('/employee/time-off', payload)
    return response.data
  }

  async cancelRequest(id) {
    const response = await this.api.post(`/employee/time-off/${id}/cancel`)
    return response.data
  }

  // Admin endpoints
  async getRequests(filters = {}) {
    const response = await this.api.get('/admin/time-off', { params: filters })
    return response.data
  }

  async updateStatus(id, { status, decision_notes }) {
    const response = await this.api.post(`/admin/time-off/${id}/status`, { status, decision_notes })
    return response.data
  }

  // Helpers
  transformForEmployee(list) {
    return list.map(this.transformOneForEmployee)
  }

  transformOneForEmployee = (item) => ({
    id: item.id?.toString() || item.id,
    employeeId: item.employee_id,
    startDate: item.start_date,
    endDate: item.end_date,
    type: item.type,
    reason: item.reason,
    notes: item.notes,
    status: item.status,
    submittedDate: item.submitted_at ? new Date(item.submitted_at).toISOString().split('T')[0] : null,
  })

  handleApiError(error) {
    if (error.response?.data?.message) return error.response.data.message
    if (error.message) return error.message
    return 'An unexpected error occurred'
  }
}

const timeOffApiService = new TimeOffApiService()
export default timeOffApiService
