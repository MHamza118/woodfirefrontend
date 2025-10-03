// Customer Announcement Service - API Only
// Manages customer-facing announcements through backend API

import customerApiService from './customerApiService'

class CustomerAnnouncementService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.woodfire.food/api/v1'
  }

  // Get active announcements for customers
  async getActiveAnnouncements() {
    try {
      const response = await customerApiService.getCustomerAnnouncements()
      if (response.success) {
        return response.announcements.all || []
      }
      return []
    } catch (error) {
      console.error('Error loading announcements:', error)
      return []
    }
  }

  // Get announcements by type
  async getAnnouncementsByType(type = 'all') {
    try {
      const response = await customerApiService.getCustomerAnnouncements()
      if (response.success) {
        switch (type) {
          case 'events':
            return response.announcements.events || []
          case 'others':
            return response.announcements.others || []
          default:
            return response.announcements.all || []
        }
      }
      return []
    } catch (error) {
      console.error('Error loading announcements by type:', error)
      return []
    }
  }

  // Dismiss an announcement
  async dismissAnnouncement(announcementId) {
    try {
      const response = await customerApiService.dismissAnnouncement(announcementId)
      return {
        success: response.success,
        message: response.message || (response.success ? 'Announcement dismissed' : 'Failed to dismiss announcement')
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error)
      return {
        success: false,
        message: 'Failed to dismiss announcement'
      }
    }
  }

  // Get announcements for current customer (uses API to get customer-specific announcements)
  async getAnnouncementsForCustomer() {
    return this.getActiveAnnouncements()
  }

  // Helper method to determine customer tier
  getCustomerTier(loyaltyPoints) {
    if (loyaltyPoints >= 2500) return 'Platinum'
    if (loyaltyPoints >= 1000) return 'Gold' 
    if (loyaltyPoints >= 500) return 'Silver'
    return 'Bronze'
  }
}

// Create singleton instance
const customerAnnouncementService = new CustomerAnnouncementService()

export default customerAnnouncementService
