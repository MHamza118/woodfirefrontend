import employeeApiService from './employeeApiService'

class EmployeeDashboardApiService {
    constructor() {
        this.employeeApiService = employeeApiService
    }

    /**
     * Get comprehensive employee dashboard data
     */
    async getDashboardData() {
        try {
            const response = await this.employeeApiService.getDashboard()

            if (response.success) {
                // Normalize shape to always be { data: { employee, dashboard_data } }
                const normalized = response.data ? response.data : {
                    employee: response.employee,
                    dashboard_data: response.dashboard_data
                }

                return {
                    success: true,
                    data: normalized,
                    message: response.message
                }
            }

            return {
                success: false,
                error: response.message || 'Failed to fetch dashboard data'
            }
        } catch (error) {
            console.error('Dashboard API Error:', error)
            return {
                success: false,
                error: error.message || 'Network error while fetching dashboard data'
            }
        }
    }

    /**
     * Get work statistics (hours, shifts)
     */
    async getWorkStats() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.work_stats || {
                        hours_this_week: 0,
                        shifts_completed_this_month: 0,
                        hours_change_from_last_week: 0
                    }
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get training statistics
     */
    async getTrainingStats() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.training_stats || {
                        total_assigned: 0,
                        completed: 0,
                        overdue: 0,
                        completion_percentage: 0
                    }
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get performance statistics
     */
    async getPerformanceStats() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.performance_stats || {
                        rating: 0,
                        rating_text: 'No data available',
                        last_review_date: null
                    }
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get upcoming shifts
     */
    async getUpcomingShifts() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.upcoming_shifts || []
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get announcements
     */
    async getAnnouncements() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.announcements || []
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get anniversary information
     */
    async getAnniversaryInfo() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.anniversary_info || null
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get overdue training
     */
    async getOverdueTraining() {
        try {
            const dashboardData = await this.getDashboardData()
            
            if (dashboardData.success) {
                return {
                    success: true,
                    data: dashboardData.data.dashboard_data?.overdue_training || []
                }
            }
            
            return dashboardData
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Check if employee dashboard API endpoint exists and is working
     */
    async checkDashboardEndpoint() {
        try {
            const response = await this.getDashboardData()
            return response.success
        } catch (error) {
            return false
        }
    }
}

// Create singleton instance
const employeeDashboardApiService = new EmployeeDashboardApiService()
export default employeeDashboardApiService
