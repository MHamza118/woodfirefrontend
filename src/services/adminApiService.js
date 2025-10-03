import { fetchCSRFCookie } from './csrfHelper.js';

const API_BASE_URL = 'https://api.woodfire.food/api/v1'
class AdminApiService {
    constructor() {
        this.baseURL = API_BASE_URL
    }

    // Helper method to set auth header
    getAuthHeader() {
        const token = localStorage.getItem('admin_token')
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

    /**
     * Admin Login
     */
    async loginAdmin(email, password) {
        try {
            // Fetch CSRF cookie before login
            const csrfResult = await fetchCSRFCookie();
            if (!csrfResult.success) {
                console.warn('CSRF cookie fetch failed, proceeding anyway:', csrfResult.error);
            }

            const response = await this.makeRequest('/auth/admin/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })

            if (response.success) {
                // Store token for authenticated requests (use admin_token for clarity)
                localStorage.setItem('admin_token', response.data.token)
                
                return {
                    success: true,
                    user_type: response.data.user_type,
                    admin: response.data.admin,
                    token: response.data.token,
                    role: response.data.role,
                    status: response.data.status,
                    can_access_dashboard: response.data.can_access_dashboard,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Admin login failed' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get admin dashboard data
     */
    async getDashboard() {
        try {
            const response = await this.makeRequest('/admin/dashboard')

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get dashboard data' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get admin profile
     */
    async getProfile() {
        try {
            const response = await this.makeRequest('/admin/profile')

            if (response.success) {
                return {
                    success: true,
                    admin: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to get admin profile' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Logout admin
     */
    async logoutAdmin() {
        try {
            const response = await this.makeRequest('/admin/logout', {
                method: 'POST'
            })

            // Clear tokens regardless of response
            localStorage.removeItem('admin_token')

            if (response.success) {
                return { success: true, message: response.message }
            }

            return { success: false, error: response.message || 'Logout failed' }
        } catch (error) {
            // Clear tokens even if request fails
            localStorage.removeItem('admin_token')
            return { success: false, error: error.message }
        }
    }

    /**
     * Get all admin users
     */
    async getAdminUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
            const response = await this.makeRequest(endpoint);

            if (response.success) {
                return {
                    success: true,
                    users: response.data.users,
                    meta: response.data.meta,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get admin users' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new admin/manager user
     */
    async createAdminUser(userData) {
        try {
            const response = await this.makeRequest('/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                return {
                    success: true,
                    user: response.data.user,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to create admin user' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all FAQs (admin view)
     */
    async getFaqs(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString()
            const endpoint = queryParams ? `/admin/faqs?${queryParams}` : '/admin/faqs'
            const response = await this.makeRequest(endpoint)

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    stats: response.stats,
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
     * Create new FAQ
     */
    async createFaq(faqData) {
        try {
            const response = await this.makeRequest('/admin/faqs', {
                method: 'POST',
                body: JSON.stringify(faqData)
            })

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to create FAQ' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Update FAQ
     */
    async updateFaq(faqId, faqData) {
        try {
            const response = await this.makeRequest(`/admin/faqs/${faqId}`, {
                method: 'PUT',
                body: JSON.stringify(faqData)
            })

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to update FAQ' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete FAQ
     */
    async deleteFaq(faqId) {
        try {
            const response = await this.makeRequest(`/admin/faqs/${faqId}`, {
                method: 'DELETE'
            })

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to delete FAQ' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Toggle FAQ active status
     */
    async toggleFaqStatus(faqId) {
        try {
            const response = await this.makeRequest(`/admin/faqs/${faqId}/toggle-status`, {
                method: 'PATCH'
            })

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message
                }
            }

            return { success: false, error: response.message || 'Failed to toggle FAQ status' }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Get FAQ categories
     */
    async getFaqCategories() {
        try {
            const response = await this.makeRequest('/admin/faqs/categories')

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

    /**
     * Update admin user permissions
     */
    async updateAdminPermissions(userId, permissions) {
        try {
            const response = await this.makeRequest(`/admin/users/${userId}/permissions`, {
                method: 'PUT',
                body: JSON.stringify({ permissions })
            });

            if (response.success) {
                return {
                    success: true,
                    user: response.data.user,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to update permissions' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Deactivate admin user
     */
    async deactivateAdminUser(userId) {
        try {
            const response = await this.makeRequest(`/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                return {
                    success: true,
                    user: response.data.user,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to deactivate user' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available roles and permissions
     */
    async getRolesAndPermissions() {
        try {
            const response = await this.makeRequest('/admin/roles-permissions');

            if (response.success) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get roles and permissions' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all employees with filters
     */
    async getEmployees(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/admin/employees?${queryParams}` : '/admin/employees';
            const response = await this.makeRequest(endpoint);

            if (response.success) {
                return {
                    success: true,
                    employees: response.data.employees,
                    pagination: response.data.pagination,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get employees' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get employees pending approval
     */
    async getPendingEmployees() {
        try {
            const response = await this.makeRequest('/admin/employees/pending');

            if (response.success) {
                return {
                    success: true,
                    employees: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get pending employees' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get specific employee details
     */
    async getEmployee(employeeId) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}`);

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get employee details' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Approve employee
     */
    async approveEmployee(employeeId, note = '') {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/approve`, {
                method: 'POST',
                body: JSON.stringify({ note })
            });

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to approve employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject employee
     */
    async rejectEmployee(employeeId, rejectionReason) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ rejection_reason: rejectionReason })
            });

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to reject employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Employee lifecycle actions
    async pauseEmployee(employeeId, reason) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/pause`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (response.success) {
                return { success: true, employee: response.data, message: response.message };
            }
            return { success: false, error: response.message || 'Failed to pause employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async resumeEmployee(employeeId) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/resume`, {
                method: 'POST'
            });
            if (response.success) {
                return { success: true, employee: response.data, message: response.message };
            }
            return { success: false, error: response.message || 'Failed to resume employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deactivateEmployee(employeeId, reason) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/deactivate`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (response.success) {
                return { success: true, employee: response.data, message: response.message };
            }
            return { success: false, error: response.message || 'Failed to deactivate employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async activateEmployee(employeeId) {
        try {
            const response = await this.makeRequest(`/admin/employees/${employeeId}/activate`, {
                method: 'POST'
            });
            if (response.success) {
                return { success: true, employee: response.data, message: response.message };
            }
            return { success: false, error: response.message || 'Failed to activate employee' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get employee statistics
     */
    async getEmployeeStatistics() {
        try {
            const response = await this.makeRequest('/admin/employees/statistics');

            if (response.success) {
                return {
                    success: true,
                    statistics: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get employee statistics' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new employee with direct dashboard access (admin only)
     */
    async createEmployee(employeeData) {
        try {
            const response = await this.makeRequest('/admin/employees', {
                method: 'POST',
                body: JSON.stringify(employeeData)
            });

            if (response.success) {
                return {
                    success: true,
                    employee: response.data,
                    message: response.message || 'Employee created successfully'
                };
            }

            return { 
                success: false, 
                error: response.message || 'Failed to create employee',
                errors: response.errors // Include field-specific errors for form validation
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all locations
     */
    async getLocations() {
        try {
            const response = await this.makeRequest('/admin/locations');
            
            if (response.success) {
                return {
                    success: true,
                    locations: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to get locations' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new location
     */
    async createLocation(locationData) {
        try {
            const response = await this.makeRequest('/admin/locations', {
                method: 'POST',
                body: JSON.stringify(locationData)
            });
            
            if (response.success) {
                return {
                    success: true,
                    location: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to create location' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update location
     */
    async updateLocation(locationId, locationData) {
        try {
            const response = await this.makeRequest(`/admin/locations/${locationId}`, {
                method: 'PUT',
                body: JSON.stringify(locationData)
            });
            
            if (response.success) {
                return {
                    success: true,
                    location: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to update location' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete/deactivate location
     */
    async deleteLocation(locationId) {
        try {
            const response = await this.makeRequest(`/admin/locations/${locationId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                return {
                    success: true,
                    location: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to delete location' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all onboarding pages
     */
    async getOnboardingPages() {
        try {
            const response = await this.makeRequest('/admin/onboarding-pages');
            
            if (response.success) {
                return {
                    success: true,
                    pages: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to get onboarding pages' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new onboarding page
     */
    async createOnboardingPage(pageData) {
        try {
            const response = await this.makeRequest('/admin/onboarding-pages', {
                method: 'POST',
                body: JSON.stringify(pageData)
            });
            
            if (response.success) {
                return {
                    success: true,
                    page: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to create onboarding page' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update onboarding page
     */
    async updateOnboardingPage(pageId, pageData) {
        try {
            const response = await this.makeRequest(`/admin/onboarding-pages/${pageId}`, {
                method: 'PUT',
                body: JSON.stringify(pageData)
            });
            
            if (response.success) {
                return {
                    success: true,
                    page: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to update onboarding page' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete onboarding page
     */
    async deleteOnboardingPage(pageId) {
        try {
            const response = await this.makeRequest(`/admin/onboarding-pages/${pageId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                return {
                    success: true,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to delete onboarding page' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggle onboarding page active status
     */
    async toggleOnboardingPageStatus(pageId) {
        try {
            const response = await this.makeRequest(`/admin/onboarding-pages/${pageId}/toggle-status`, {
                method: 'PATCH'
            });
            
            if (response.success) {
                return {
                    success: true,
                    page: response.data,
                    message: response.message
                };
            }
            
            return { success: false, error: response.message || 'Failed to toggle page status' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all customers with filters
     */
    async getCustomers(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/admin/customers?${queryParams}` : '/admin/customers';
            const response = await this.makeRequest(endpoint);

            // Handle both 'success' and 'status' fields for backward compatibility
            if (response.success === true || response.status === 'success') {
                return {
                    success: true,
                    customers: response.data || response.customers || [],
                    meta: response.meta,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get customers' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new customer
     */
    async createCustomer(customerData) {
        try {
            const response = await this.makeRequest('/admin/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });

            if (response.success) {
                return {
                    success: true,
                    customer: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to create customer' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get specific customer details
     */
    async getCustomer(customerId) {
        try {
            const response = await this.makeRequest(`/admin/customers/${customerId}`);

            // Handle both 'success' and 'status' fields for backward compatibility
            if (response.success === true || response.status === 'success') {
                return {
                    success: true,
                    customer: response.data || response.customer,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get customer' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update customer
     */
    async updateCustomer(customerId, customerData) {
        try {
            const response = await this.makeRequest(`/admin/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData)
            });

            if (response.success) {
                return {
                    success: true,
                    customer: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to update customer' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete customer
     */
    async deleteCustomer(customerId) {
        try {
            const response = await this.makeRequest(`/admin/customers/${customerId}`, {
                method: 'DELETE'
            });

            // Handle both 'success' and 'status' fields for backward compatibility
            if (response.success === true || response.status === 'success') {
                return {
                    success: true,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to delete customer' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get customer statistics
     */
    async getCustomerStatistics() {
        try {
            const response = await this.makeRequest('/admin/customers/statistics');

            // Handle both 'success' and 'status' fields for backward compatibility
            if (response.success === true || response.status === 'success') {
                return {
                    success: true,
                    statistics: response.data || response.statistics,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get customer statistics' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // =================== TRAINING MODULE METHODS ===================
    
    /**
     * Get all training modules with filters
     */
    async getTrainingModules(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/admin/training-modules?${queryParams}` : '/admin/training-modules';
            const response = await this.makeRequest(endpoint);

            if (response.success) {
                return {
                    success: true,
                    modules: (response.data.modules || []).map(module => this.transformTrainingModuleData(module)),
                    statistics: response.data.statistics || {},
                    categories: response.data.categories || [],
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get training modules' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get specific training module
     */
    async getTrainingModule(moduleId) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}`);

            if (response.success) {
                return {
                    success: true,
                    module: this.transformTrainingModuleData(response.data.module || response.data),
                    assignments: response.data.assignments || [],
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get training module' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new training module
     */
    async createTrainingModule(moduleData) {
        try {
            // Transform frontend camelCase to backend snake_case
            const transformedData = this.transformToBackendFormat(moduleData);
            
            const response = await this.makeRequest('/admin/training-modules', {
                method: 'POST',
                body: JSON.stringify(transformedData)
            });

            if (response.success) {
                return {
                    success: true,
                    module: this.transformTrainingModuleData(response.data.module || response.data),
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to create training module' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update training module
     */
    async updateTrainingModule(moduleId, moduleData) {
        try {
            // Transform frontend camelCase to backend snake_case
            const transformedData = this.transformToBackendFormat(moduleData);
            
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}`, {
                method: 'PUT',
                body: JSON.stringify(transformedData)
            });

            if (response.success) {
                return {
                    success: true,
                    module: this.transformTrainingModuleData(response.data.module || response.data),
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to update training module' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete training module
     */
    async deleteTrainingModule(moduleId) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                return {
                    success: true,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to delete training module' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Assign training module to employees
     */
    async assignTrainingModule(moduleId, assignmentData) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/assign`, {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });

            if (response.success) {
                return {
                    success: true,
                    assignments: response.data.assignments,
                    total_assigned: response.data.total_assigned,
                    warnings: response.warnings,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to assign training module' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get training module assignments
     */
    async getTrainingModuleAssignments(moduleId) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/assignments`);

            if (response.success) {
                return {
                    success: true,
                    module: response.data.module,
                    assignments: response.data.assignments,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get training assignments' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset training progress for employees
     */
    async resetTrainingProgress(moduleId, employeeIds) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/reset-progress`, {
                method: 'POST',
                body: JSON.stringify({ employee_ids: employeeIds })
            });

            if (response.success) {
                return {
                    success: true,
                    reset_count: response.data.reset_count,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to reset training progress' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove training assignments for employees
     */
    async removeTrainingAssignments(moduleId, employeeIds) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/remove-assignments`, {
                method: 'POST',
                body: JSON.stringify({ employee_ids: employeeIds })
            });

            if (response.success) {
                return {
                    success: true,
                    removed_count: response.data.removed_count,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to remove training assignments' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate QR code for training module
     */
    async generateTrainingQrCode(moduleId) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/qr-code`);

            if (response.success) {
                return {
                    success: true,
                    qr_code: response.data.qr_code,
                    qr_url: response.data.qr_url,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to generate QR code' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Regenerate QR code for training module
     */
    async regenerateTrainingQrCode(moduleId) {
        try {
            const response = await this.makeRequest(`/admin/training-modules/${moduleId}/regenerate-qr`, {
                method: 'POST'
            });

            if (response.success) {
                return {
                    success: true,
                    qr_code: response.data.qr_code,
                    qr_url: response.data.qr_url,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to regenerate QR code' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get training module categories
     */
    async getTrainingCategories() {
        try {
            const response = await this.makeRequest('/admin/training-modules/categories');

            if (response.success) {
                return {
                    success: true,
                    categories: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get training categories' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get training analytics
     */
    async getTrainingAnalytics() {
        try {
            const response = await this.makeRequest('/admin/training-modules/analytics');

            if (response.success) {
                return {
                    success: true,
                    analytics: response.data,
                    message: response.message
                };
            }

            return { success: false, error: response.message || 'Failed to get training analytics' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Download employee file
     */
    async downloadFile(fileId, filename) {
        try {
            const url = `${this.baseURL}/files/${fileId}/download`
            const token = localStorage.getItem('admin_token')
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Download failed')
            }

            // Get the blob from response
            const blob = await response.blob()
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename || 'download'
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)

            return { success: true }
        } catch (error) {
            console.error('File download error:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Transform admin data for consistent usage
     */
    transformAdminData(admin) {
        if (!admin) return null;
        
        return {
            id: admin.id,
            name: admin.full_name || `${admin.first_name} ${admin.last_name}`,
            first_name: admin.first_name,
            last_name: admin.last_name,
            full_name: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            role: admin.role,
            status: admin.status,
            profile_data: admin.profile_data,
            last_login_at: admin.last_login_at,
            email_verified_at: admin.email_verified_at,
            created_at: admin.created_at,
            updated_at: admin.updated_at,
        };
    }

    /**
     * Transform training module data for consistent usage (backend -> frontend)
     */
    transformTrainingModuleData(module) {
        if (!module) return null;
        
        return {
            id: module.id,
            title: module.title,
            description: module.description,
            qrCode: module.qr_code,
            videoUrl: module.video_url,
            content: module.content,
            duration: module.duration,
            category: module.category,
            active: module.active,
            createdAt: module.created_at,
            updatedAt: module.updated_at,
            createdBy: module.created_by,
            assignmentsCount: module.assignments_count || 0,
            completionsCount: module.completions_count || 0,
            order: module.order_index || 0
        };
    }

    /**
     * Transform training module data for API requests (frontend -> backend)
     */
    transformToBackendFormat(moduleData) {
        if (!moduleData) return null;
        
        const transformed = {
            ...moduleData
        };

        // Transform camelCase fields to snake_case for backend
        if (moduleData.qrCode !== undefined) {
            transformed.qr_code = moduleData.qrCode;
            delete transformed.qrCode;
        }
        if (moduleData.videoUrl !== undefined) {
            transformed.video_url = moduleData.videoUrl;
            delete transformed.videoUrl;
        }
        
        return transformed;
    }
}

const adminApiService = new AdminApiService();
export default adminApiService;
