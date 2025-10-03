class CustomerApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://woodfire.food/api/v1';
    this.token = this.getAuthToken();
  }

  // Get stored auth token
  getAuthToken() {
    return localStorage.getItem('customer_token');
  }

  // Set auth token
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('customer_token', token);
  }

  // Remove auth token
  removeAuthToken() {
    this.token = null;
    localStorage.removeItem('customer_token');
  }

  // Get default headers with auth token
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Make API request
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`, error);
      throw error;
    }
  }

  // Customer Authentication APIs
  async registerCustomer(customerData) {
    try {
      const response = await this.makeRequest('/auth/customer/register', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      if (response.status === 'success') {
        this.setAuthToken(response.data.token);
        return {
          success: true,
          customer: response.data.customer,
          token: response.data.token,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loginCustomer(email, password) {
    try {
      const response = await this.makeRequest('/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 'success') {
        this.setAuthToken(response.data.token);
        return {
          success: true,
          customer: response.data.customer,
          token: response.data.token,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logoutCustomer() {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.removeAuthToken();
    }
  }

  // Customer Profile APIs
  async getCustomerProfile() {
    try {
      const response = await this.makeRequest('/customer/profile');
      
      if (response.status === 'success') {
        return {
          success: true,
          customer: response.data,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateCustomerProfile(profileData) {
    try {
      const response = await this.makeRequest('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (response.status === 'success') {
        return {
          success: true,
          customer: response.data,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Customer Dashboard APIs
  async getCustomerDashboard() {
    try {
      const response = await this.makeRequest('/customer/dashboard');
      
      if (response.status === 'success') {
        return {
          success: true,
          dashboard: response.data,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Customer Announcements APIs
  async getCustomerAnnouncements() {
    try {
      const response = await this.makeRequest('/customer/announcements');
      
      if (response.status === 'success') {
        return {
          success: true,
          announcements: response.data,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async dismissAnnouncement(announcementId) {
    try {
      const response = await this.makeRequest(`/customer/announcements/${announcementId}/dismiss`, {
        method: 'POST',
      });

      return {
        success: response.status === 'success',
        message: response.message,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Customer Rewards APIs
  async redeemReward(rewardId) {
    try {
      const response = await this.makeRequest('/customer/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ reward_id: rewardId }),
      });

      if (response.status === 'success') {
        return {
          success: true,
          reward: response.data.reward,
          remaining_points: response.data.remaining_points,
          message: response.message,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Customer Preferences APIs
  async updateCustomerPreferences(preferences) {
    try {
      const response = await this.makeRequest('/customer/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      });

      if (response.status === 'success') {
        return {
          success: true,
          preferences: response.data.preferences,
        };
      }

      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods for data transformation
  transformCustomerData(apiCustomer) {
    return {
      id: apiCustomer.id,
      name: apiCustomer.name,
      firstName: apiCustomer.first_name,
      lastName: apiCustomer.last_name,
      email: apiCustomer.email,
      phone: apiCustomer.phone || '',
      homeLocation: apiCustomer.home_location || '',
      loyaltyPoints: apiCustomer.loyalty_points || 0,
      loyaltyTier: apiCustomer.loyalty_tier || 'Bronze',
      totalOrders: apiCustomer.total_orders || 0,
      totalSpent: parseFloat(apiCustomer.total_spent) || 0,
      preferences: apiCustomer.preferences || {
        notifications: true,
        marketing: false,
      },
      locations: apiCustomer.locations || [],
      lastVisit: apiCustomer.last_visit,
      createdAt: apiCustomer.created_at,
      status: apiCustomer.status || 'ACTIVE',
    };
  }

  transformAnnouncementData(apiAnnouncement) {
    return {
      id: apiAnnouncement.id,
      title: apiAnnouncement.title,
      message: apiAnnouncement.message,
      type: apiAnnouncement.type,
      priority: apiAnnouncement.priority,
      startDate: apiAnnouncement.start_date,
      endDate: apiAnnouncement.end_date,
      actionText: apiAnnouncement.action_text,
      actionUrl: apiAnnouncement.action_url,
      dismissible: apiAnnouncement.is_dismissible,
      createdAt: apiAnnouncement.created_at,
      createdBy: apiAnnouncement.created_by,
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get customer ID from current session (through API profile)
  async getCustomerId() {
    try {
      const response = await this.getCustomerProfile()
      return response.success ? response.customer.id : null
    } catch (error) {
      console.error('Error getting customer ID:', error)
      return null
    }
  }
}

// Create singleton instance
const customerApiService = new CustomerApiService();

export default customerApiService;
