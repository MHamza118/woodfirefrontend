// Customer Communication Service - API Only
// Handles all customer-facing communication features through backend API

import customerApiService from './customerApiService'

class CustomerCommunicationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://woodfire.food/api/v1'
  }

  // Get customer announcements (from API)
  async getAnnouncements() {
    try {
      const response = await customerApiService.getCustomerAnnouncements()
      return response.success ? response.announcements : { all: [], events: [], others: [] }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      return { all: [], events: [], others: [] }
    }
  }

  // Get announcements for current customer
  async getAnnouncementsForCustomer() {
    return this.getAnnouncements()
  }

  // Dismiss an announcement
  async dismissAnnouncement(announcementId) {
    try {
      const response = await customerApiService.dismissAnnouncement(announcementId)
      return {
        success: response.success,
        message: response.message || 'Announcement dismissed'
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error)
      return {
        success: false,
        message: 'Failed to dismiss announcement'
      }
    }
  }

  // Get customer status options (static data - no API needed)
  getCustomerStatusOptions() {
    return [
      { value: 'all', label: 'All Customers' },
      { value: 'bronze', label: 'Bronze Members' },
      { value: 'silver', label: 'Silver Members' },
      { value: 'gold', label: 'Gold Members' },
      { value: 'platinum', label: 'Platinum Members' }
    ]
  }

  // Helper method to determine customer tier
  getCustomerTier(loyaltyPoints) {
    if (loyaltyPoints >= 2500) return 'Platinum'
    if (loyaltyPoints >= 1000) return 'Gold' 
    if (loyaltyPoints >= 500) return 'Silver'
    return 'Bronze'
  }
}

const customerCommunicationService = new CustomerCommunicationService()
export default customerCommunicationService
