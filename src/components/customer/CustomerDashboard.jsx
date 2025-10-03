import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Star, 
  Gift, 
  Clock, 
  User, 
  MapPin, 
  Heart, 
  Trophy,
  Settings,
  LogOut,
  CreditCard,
  Award,
  Calendar,
  ShoppingBag,
  Bell,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  MessageSquare
} from 'lucide-react'
import Logo from '../Logo'
import customerApiService from '../../services/customerApiService'
import CustomerChat from './CustomerChat'
import '../../styles/responsive.css'

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [customerData, setCustomerData] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [eventNotifications, setEventNotifications] = useState([])
  const [availableRewards, setAvailableRewards] = useState([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    // Load customer dashboard data from API
    const loadCustomerDashboard = async () => {
      try {
        const response = await customerApiService.getCustomerDashboard()
        
        if (response.success) {
          const dashboardData = response.dashboard
          
          // Transform API data to match component expectations
          const customer = customerApiService.transformCustomerData(dashboardData.customer)
          setCustomerData(customer)
          
          // Set announcements from API
          const transformedAnnouncements = dashboardData.announcements.map(ann => 
            customerApiService.transformAnnouncementData(ann)
          )
          setAnnouncements(transformedAnnouncements)
          
          // Set event notifications from API
          const transformedEvents = dashboardData.event_notifications.map(event => 
            customerApiService.transformAnnouncementData(event)
          )
          setEventNotifications(transformedEvents)
          
          // Set available rewards from API
          setAvailableRewards(dashboardData.available_rewards || [])
          
          // No need to manage dismissed announcements locally - handled by API
          setDismissedAnnouncements([])
        } else {
          console.error('Failed to load customer dashboard:', response.error)
          // Fallback: set empty data
          setCustomerData(null)
          setAnnouncements([])
          setEventNotifications([])
        }
      } catch (error) {
        console.error('Error loading customer dashboard:', error)
        setCustomerData(null)
        setAnnouncements([])
        setEventNotifications([])
      } finally {
        setLoading(false)
      }
    }

    if (user && customerApiService.isAuthenticated()) {
      loadCustomerDashboard()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navigateToSeating = () => {
    navigate('/seating')
  }

  const dismissAnnouncement = async (announcementId) => {
    try {
      const response = await customerApiService.dismissAnnouncement(announcementId)
      
      if (response.success) {
        // Remove the announcement from local state
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId))
        setEventNotifications(prev => prev.filter(event => event.id !== announcementId))
      } else {
        console.error('Failed to dismiss announcement:', response.error)
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error)
    }
  }

  const redeemReward = async (rewardId) => {
    try {
      const response = await customerApiService.redeemReward(rewardId)
      
      if (response.success) {
        // Update customer data with new loyalty points
        setCustomerData(prev => ({
          ...prev,
          loyaltyPoints: response.remaining_points
        }))
        
        // Refresh rewards list
        const dashboardResponse = await customerApiService.getCustomerDashboard()
        if (dashboardResponse.success) {
          setAvailableRewards(dashboardResponse.dashboard.available_rewards || [])
        }
        
        alert(`Reward redeemed successfully! ${response.message}`)
      } else {
        alert(`Failed to redeem reward: ${response.error}`)
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      alert('Failed to redeem reward. Please try again.')
    }
  }

  const getAnnouncementIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />
      case 'warning': return <AlertCircle className="w-5 h-5" />
      case 'success': return <CheckCircle className="w-5 h-5" />
      case 'event': return <Calendar className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getAnnouncementColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'event': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(announcement => 
    !dismissedAnnouncements.includes(announcement.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-charcoal">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-gold/10">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="show-540-up">
                <Logo size="sm" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-gold hide-1024-down">
                  Customer Dashboard
                </h1>
                <p className="text-cream/80 text-xs hide-1024-down">Welcome back, {customerData?.firstName}!</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-cream/80 hover:text-cream transition-colors px-2 py-2 rounded-lg hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* Customer Announcements */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-6 space-y-3">
            {visibleAnnouncements.map((announcement) => (
              <div key={announcement.id} className={`rounded-xl shadow-lg border-2 p-4 ${getAnnouncementColor(announcement.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      announcement.type === 'info' ? 'bg-blue-100' :
                      announcement.type === 'warning' ? 'bg-yellow-100' :
                      announcement.type === 'success' ? 'bg-green-100' :
                      announcement.type === 'event' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                      <p className="text-sm leading-relaxed mb-3">{announcement.message}</p>
                      {announcement.actionUrl && (
                        <a
                          href={announcement.actionUrl}
                          className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-current px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                        >
                          {announcement.actionText || 'Learn More'}
                        </a>
                      )}
                      <div className="mt-3 text-xs opacity-70">
                        {announcement.priority && (
                          <span className="inline-block bg-white/20 px-2 py-1 rounded mr-2 capitalize">
                            {announcement.priority} Priority
                          </span>
                        )}
                        Posted: {new Date(announcement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {announcement.dismissible && (
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="text-current hover:bg-white/20 p-1 rounded-full transition-colors ml-4"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Event Notifications */}
        {eventNotifications.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-charcoal font-display flex items-center gap-1">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="show-540-up">Upcoming Events</span>
                  <span className="hide-540-up">Events</span>
                </h3>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {eventNotifications.length} event{eventNotifications.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid-quick-actions">
                {eventNotifications.slice(0, 3).map((event) => (
                  <div key={event.id} className="bg-gradient-to-br from-purple-50 to-purple-25 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      {event.dismissible && (
                        <button
                          onClick={() => dismissAnnouncement(event.id)}
                          className="text-purple-400 hover:text-purple-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-purple-800 mb-2 text-sm">{event.title}</h4>
                    <p className="text-purple-700 text-xs leading-relaxed mb-3">{event.message}</p>
                    
                    {event.actionUrl && (
                      <a
                        href={event.actionUrl}
                        className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg font-medium text-xs transition-all hover:bg-purple-700 hover:shadow-md"
                      >
                        {event.actionText || 'Learn More'}
                      </a>
                    )}
                    
                    <div className="mt-3 text-xs text-purple-600">
                      {event.priority === 'high' && (
                        <span className="inline-block bg-purple-200 px-2 py-1 rounded mr-2">
                          High Priority
                        </span>
                      )}
                      Posted: {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {eventNotifications.length > 3 && (
                <div className="text-center mt-4">
                  <button className="text-purple-600 hover:text-purple-800 font-medium text-sm">
                    View All Events ({eventNotifications.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome Section & Quick Actions */}
        <div className="grid-main gap-4 mb-6">
          {/* Welcome Card */}
          <div className="col-span-2 bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-charcoal font-display mb-2">
                  Hello, {customerData?.name}! 👋
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Thank you for being a valued customer. Here's what's new:
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-gold/10 rounded-xl">
                    <div className="text-lg font-bold text-gold">{customerData?.loyaltyPoints || 0}</div>
                    <div className="text-xs text-gray-600">Loyalty Points</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-xl">
                    <div className="text-lg font-bold text-blue-600">{customerData?.totalOrders || 0}</div>
                    <div className="text-xs text-gray-600">Total Orders</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-xl">
                    <div className="text-lg font-bold text-green-600">${customerData?.totalSpent || 0}</div>
                    <div className="text-xs text-gray-600">Total Spent</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right show-540-up">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gold" />
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Status */}
          <div className="bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl shadow-lg p-4 border-2 border-gold/30">
            <div className="text-center">
              <div className="w-12 h-12 bg-gold/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-2">Gold Member</h3>
              <p className="text-xs text-gray-600 mb-3">
                You're earning 2x points on all orders!
              </p>
              <div className="bg-white/80 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-1">Next reward at 1,000 points</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gold h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((customerData?.loyaltyPoints || 0) / 1000 * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gold font-medium mt-1">
                  {Math.max(1000 - (customerData?.loyaltyPoints || 0), 0)} points to go
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid-stats gap-3 mb-6">
          <button
            onClick={navigateToSeating}
            className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center group-hover:bg-gold/30 transition-colors hide-md-down">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-sm">Table Seating</h3>
                <p className="text-xs text-gray-600">Let us know where you're sitting</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors hide-md-down">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-sm">Order Online</h3>
                <p className="text-xs text-gray-600">Browse menu & place order</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors hide-md-down">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-sm">Rewards</h3>
                <p className="text-xs text-gray-600">View available rewards</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors hide-md-down">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-sm">Settings</h3>
                <p className="text-xs text-gray-600">Manage your account</p>
              </div>
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid-2-responsive gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charcoal font-display">Recent Orders</h3>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            {customerData?.recentOrders?.length > 0 ? (
              <div className="space-y-3">
                {customerData.recentOrders.slice(0, 3).map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-charcoal text-sm">Order #{order.number}</div>
                      <div className="text-xs text-gray-600">{order.items} items • {order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-charcoal text-sm">${order.total}</div>
                      <div className="text-xs text-green-600">+{order.points} points</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3 text-sm">No recent orders yet</p>
                <button className="bg-gold-gradient text-charcoal px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all text-sm">
                  Place Your First Order
                </button>
              </div>
            )}
          </div>

          {/* Favorite Items */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charcoal font-display">Favorite Items</h3>
              <Heart className="w-5 h-5 text-red-400" />
            </div>

            {customerData?.favoriteItems?.length > 0 ? (
              <div className="space-y-3">
                {customerData.favoriteItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                      <span className="text-base">{item.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-charcoal text-sm xs:text-base">{item.name}</div>
                      <div className="text-xs xs:text-sm text-gray-600">{item.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-charcoal text-sm xs:text-base">${item.price}</div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 xs:py-8">
                <div className="w-12 h-12 xs:w-16 xs:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 xs:mb-4">
                  <Heart className="w-6 h-6 xs:w-8 xs:h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3 xs:mb-4 text-sm xs:text-base">No favorite items yet</p>
                <button className="bg-gold-gradient text-charcoal px-4 xs:px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all text-sm xs:text-base">
                  Explore Menu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Available Rewards */}
        <div className="mt-6 xs:mt-8 bg-white rounded-2xl shadow-lg p-4 xs:p-6">
          <div className="flex items-center justify-between mb-4 xs:mb-6">
            <h3 className="text-lg xs:text-xl font-bold text-charcoal font-display">Available Rewards</h3>
            <Award className="w-5 h-5 text-gold" />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
            {availableRewards.length > 0 ? (
              availableRewards.map((reward, index) => {
                const getRewardColor = () => {
                  if (reward.type === 'food') return 'from-gold/10 to-gold/5 border-gold/30'
                  if (reward.type === 'discount') return 'from-blue-50 to-blue-25 border-blue-200'
                  return 'from-purple-50 to-purple-25 border-purple-200'
                }
                
                const getRewardIcon = () => {
                  if (reward.type === 'food') return <Gift className="w-6 h-6 text-gold" />
                  if (reward.type === 'discount') return <CreditCard className="w-6 h-6 text-blue-600" />
                  return <Star className="w-6 h-6 text-purple-600" />
                }
                
                const getButtonClass = () => {
                  if (reward.type === 'food') return 'bg-gold-gradient text-charcoal'
                  if (reward.type === 'discount') return 'bg-blue-gradient text-white'
                  return 'bg-purple-gradient text-white'
                }
                
                return (
                  <div key={reward.id} className={`bg-gradient-to-br ${getRewardColor()} rounded-xl p-4 border-2`}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-3">
                        {getRewardIcon()}
                      </div>
                      <h4 className="font-semibold text-charcoal mb-1">{reward.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{reward.description}</p>
                      <p className="text-xs text-gray-600 mb-3">{reward.points_required} points required</p>
                      <button 
                        onClick={() => redeemReward(reward.id)}
                        disabled={!reward.available}
                        className={`w-full ${getButtonClass()} py-2 px-4 rounded-lg font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {reward.available ? 'Redeem Now' : 'Need More Points'}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No rewards available at the moment</p>
                <p className="text-sm text-gray-400">Keep earning points to unlock exclusive rewards!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20 mt-8 xs:mt-12">
        <div className="max-w-6xl mx-auto px-4 xs:px-6 py-4 xs:py-6">
          <div className="text-center space-y-2">
            <p className="text-xs xs:text-sm text-charcoal/70">
              Thank you for being a valued customer!
            </p>
            <div className="flex items-center justify-center gap-3 xs:gap-6 text-xs text-gray-500">
              <span>Member since {customerData && new Date(customerData.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="text-center">Woodfire.food</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-3 xs:bottom-4 right-3 xs:right-4 w-12 h-12 xs:w-14 xs:h-14 bg-gold-gradient text-charcoal rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center group"
          title="Chat with support"
        >
          <MessageSquare className="w-5 h-5 xs:w-6 xs:h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Customer Chat Component */}
      <CustomerChat 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
    </div>
  )
}

export default CustomerDashboard
