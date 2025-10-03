import { fetchCSRFCookie } from './csrfHelper.js';

const API_BASE_URL = 'https://woodfire.food/api/v1'

class EmployeeApiService {
    constructor() {
        this.baseURL = API_BASE_URL
        this.token = localStorage.getItem('employee_token')
    }

    // Helper method to set auth header
    getAuthHeader() {
        const token = localStorage.getItem('employee_token')
        return token ? { 'Authorization': `Bearer ${token}` } : {}
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
            credentials: 'include', // Include cookies for CSRF/Sanctum
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
            console.error('API Request failed:', error)
            throw error
        }
    }

    // Employee Registration
    async registerEmployee(employeeData) {
        try {
            // Fetch CSRF cookie before registration
            const csrfResult = await fetchCSRFCookie();
            if (!csrfResult.success) {
                console.warn('CSRF cookie fetch failed, proceeding anyway:', csrfResult.error);
            }
            const { name, email, password, password_confirmation, phone, position, department } = employeeData
            
            // Split name into first and last name
            const nameParts = name.trim().split(' ')
            const firstName = nameParts[0] || ''
            // If no last name provided, use first name as last name to satisfy validation
            const lastName = nameParts.slice(1).join(' ') || firstName

            const payload = {
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                password_confirmation,
                phone: phone || null,
                position: position || null,
                department: department || null
            }

            const response = await this.makeRequest('/auth/employee/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            })

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Registration failed' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Employee Login
    async loginEmployee(email, password) {
        try {
            // Fetch CSRF cookie before login
            const csrfResult = await fetchCSRFCookie();
            if (!csrfResult.success) {
                console.warn('CSRF cookie fetch failed, proceeding anyway:', csrfResult.error);
            }

            const response = await this.makeRequest('/auth/employee/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })

            if (response.success) {
                // Store token for authenticated requests
                localStorage.setItem('employee_token', response.data.token)
                
                // Employee login response
                return {
                    success: true,
                    user_type: response.data.user_type || 'employee',
                    employee: response.data.employee,
                    token: response.data.token,
                    stage: response.data.stage,
                    status: response.data.status,
                    can_access_dashboard: response.data.can_access_dashboard,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Login failed' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Employee Profile
    async getEmployeeProfile() {
        try {
            const response = await this.makeRequest('/employee/profile')

            if (response.success) {
                return {
                    success: true,
                    data: response.data
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Generate QR Code (Interview Stage)
    async generateQR() {
        try {
            const response = await this.makeRequest('/employee/qr')

            if (response.success) {
                return {
                    success: true,
                    qr_code: response.data.qr_code,
                    employee: response.data.employee,
                    stage_info: response.data.stage_info
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Submit Location Selection
    async submitLocation(location) {
        try {
            const response = await this.makeRequest('/employee/location', {
                method: 'POST',
                body: JSON.stringify({ location })
            })

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Questionnaire
    async getQuestionnaire() {
        try {
            const response = await this.makeRequest('/employee/questionnaire')

            if (response.success) {
                return {
                    success: true,
                    questionnaire: response.data.questionnaire,
                    employee: response.data.employee
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Submit Questionnaire Responses
    async submitQuestionnaire(responses) {
        try {
            const response = await this.makeRequest('/employee/questionnaire', {
                method: 'POST',
                body: JSON.stringify({ responses })
            })

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Submit Questionnaire Responses with File Uploads
    async submitQuestionnaireWithFiles(formData) {
        try {
            // For FormData, we need to remove Content-Type header to let browser set it
            const authHeaders = this.getAuthHeader()
            const response = await fetch(`${this.baseURL}/employee/questionnaire`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    ...authHeaders
                    // Don't set Content-Type for FormData - browser will set it with boundary
                },
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join(', ')
                    throw new Error(`Validation failed: ${errorMessages}`)
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`)
            }

            if (data.success) {
                return {
                    success: true,
                    employee: data.data,
                    message: data.message
                }
            }

            return { success: false, error: data.message }
        } catch (error) {
            console.error('File upload failed:', error)
            return { success: false, error: error.message }
        }
    }

    // Get Welcome Page Data
    async getWelcomePage() {
        try {
            const response = await this.makeRequest('/employee/welcome')

            if (response.success) {
                return {
                    success: true,
                    employee: response.data.employee,
                    stage_info: response.data.stage_info
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Confirmation Page Data
    async getConfirmationPage() {
        try {
            const response = await this.makeRequest('/employee/confirmation')

            if (response.success) {
                return {
                    success: true,
                    employee: response.data.employee,
                    confirmation_info: response.data.confirmation_info
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Dashboard Data (for approved employees)
    async getDashboard() {
        try {
            const response = await this.makeRequest('/employee/dashboard')

            if (response.success) {
                return {
                    success: true,
                    employee: response.data.employee,
                    dashboard_data: response.data.dashboard_data
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Update Personal Information (for approved employees)
    async updatePersonalInfo(personalInfo) {
        try {
            const response = await this.makeRequest('/employee/personal-info', {
                method: 'PUT',
                body: JSON.stringify(personalInfo)
            })

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Onboarding Pages
    async getOnboardingPages() {
        try {
            const response = await this.makeRequest('/employee/onboarding-pages')

            if (response.success) {
                return {
                    success: true,
                    data: response.data, // Return the full data object
                    pages: response.data.pages,
                    progress: response.data.progress,
                    details: response.data.details,
                    summary: response.data.summary,
                    personal_info_complete: response.data.personal_info_complete
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Complete Onboarding Page
    async completeOnboardingPage(pageId, signature) {
        try {
            const response = await this.makeRequest('/employee/onboarding-pages/complete', {
                method: 'POST',
                body: JSON.stringify({ 
                    page_id: pageId, 
                    signature: signature 
                })
            })

            if (response.success) {
                return {
                    success: true,
                    progress: response.data.progress,
                    employee: response.data.employee,
                    message: response.message
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Get Onboarding Progress
    async getOnboardingProgress() {
        try {
            const response = await this.makeRequest('/employee/onboarding-progress')

            if (response.success) {
                return {
                    success: true,
                    progress: response.data.progress,
                    completions: response.data.completions,
                    signatures: response.data.signatures
                }
            }

            return { success: false, error: response.message }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Employee Logout
    async logoutEmployee() {
        try {
            const response = await this.makeRequest('/employee/logout', {
                method: 'POST'
            })

            // Clear token regardless of response
            localStorage.removeItem('employee_token')

            if (response.success) {
                return { success: true, message: response.message }
            }

            return { success: false, error: response.message || 'Logout failed' }
        } catch (error) {
            // Clear token even if request fails
            localStorage.removeItem('employee_token')
            return { success: false, error: error.message }
        }
    }

    // Helper method to check if employee is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('employee_token')
    }

    // Helper method to clear employee session
    clearSession() {
        localStorage.removeItem('employee_token')
    }

    // =================== TRAINING MODULE METHODS ===================
    
    /**
     * Get training modules for authenticated employee
     */
    async getTrainingModules() {
        try {
            const response = await this.makeRequest('/employee/training-modules')

            if (response.success || response.status === 'success') {
                return {
                    success: true,
                    modules: response.data?.modules || response.modules || [],
                    statistics: response.data?.statistics || response.statistics || {},
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get training modules' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Unlock training module via QR code
     */
    async unlockTrainingModule(qrCode) {
        try {
            const response = await this.makeRequest('/employee/training-modules/unlock', {
                method: 'POST',
                body: JSON.stringify({ qr_code: qrCode })
            })

            if (response.success || response.status === 'success') {
                return {
                    success: true,
                    module: response.data?.module || response.module,
                    assignment: response.data?.assignment || response.assignment,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to unlock training module' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get training module content (only if unlocked)
     */
    async getTrainingModuleContent(moduleId) {
        try {
            const response = await this.makeRequest(`/employee/training-modules/${moduleId}/content`)

            if (response.success || response.status === 'success') {
                return {
                    success: true,
                    module: response.data || response.module,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get training module content' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Mark training module as completed
     */
    async completeTrainingModule(moduleId, completionData = {}) {
        try {
            const requestBody = {
                completion_data: {
                    video_watched: true,
                    content_reviewed: true,
                    time_spent_minutes: completionData.timeSpent || 0,
                    quiz_score: completionData.quizScore || null,
                    ...completionData
                }
            }
            
            const response = await this.makeRequest(`/employee/training-modules/${moduleId}/complete`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            })

            if (response.success || response.status === 'success') {
                return {
                    success: true,
                    assignment: response.data?.assignment || response.assignment,
                    message: response.message
                }
            }
            
            return { success: false, error: response.message || 'Failed to complete training module' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get employee training notifications
     */
    async getTrainingNotifications() {
        try {
            const response = await this.makeRequest('/notifications/training')

            if (response.success || response.status === 'success') {
                return {
                    success: true,
                    notifications: response.data || response.notifications || [],
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get training notifications' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all active FAQs (Employee Read ONly)
     */
    async getFaqs(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = queryParams ? `/employee/faqs?${queryParams}` : '/employee/faqs'
            const response = await this.makeRequest(endpoint)

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    categories: response.categories,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get FAQs' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get FAQ categories
     */
    async getFaqCategories() {
        try {
            const response = await this.makeRequest('/employee/faqs/categories')

            if (response.success) {
                return {
                    success: true,
                    data: response.data
                }
            }

            return { success: false, error: response.message || 'Failed to get FAQ categories' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Helper method to transform employee data for consistent format
    transformEmployeeData(employee) {
        return {
            id: employee.id,
            name: employee.full_name,
            firstName: employee.first_name,
            lastName: employee.last_name,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            department: employee.department,
            stage: employee.stage,
            status: employee.status,
            location: employee.location,
            canAccessDashboard: employee.can_access_dashboard,
            nextStage: employee.next_stage,
            approvedAt: employee.approved_at,
            createdAt: employee.created_at,
            updatedAt: employee.updated_at,
            // Training-related data
            training_assignments: employee.training_assignments || [],
            training_progress: employee.training_progress || [],
            completed_training: employee.completed_training || []
        }
    }
}

const employeeApiService = new EmployeeApiService()
export default employeeApiService
