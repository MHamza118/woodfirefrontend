import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Gift, 
  Star, 
  Award, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Heart,
  Medal,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import employeeRecognitionService from '../../services/employeeRecognitionService'

const EmployeeRecognitionDashboard = () => {
  const { user } = useAuth()
  const [shoutouts, setShoutouts] = useState([])
  const [rewards, setRewards] = useState([])
  const [badges, setBadges] = useState([])
  const [performance, setPerformance] = useState({})
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadRecognitionData()
  }, [user?.id])

  const loadRecognitionData = () => {
    if (!user?.id) return

    setShoutouts(employeeRecognitionService.getShoutoutsByEmployee(user.id))
    setRewards(employeeRecognitionService.getRewardsByEmployee(user.id))
    setBadges(employeeRecognitionService.getEmployeeBadges(user.id))
    setPerformance(employeeRecognitionService.getEmployeePerformance(user.id))
  }

  const handleRedeemReward = (rewardId) => {
    employeeRecognitionService.redeemReward(rewardId, user.id)
    loadRecognitionData()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getCategoryIcon = (category) => {
    const categories = employeeRecognitionService.getShoutoutCategories()
    const cat = categories.find(c => c.id === category)
    return cat ? cat.icon : '📋'
  }

  const getCategoryName = (category) => {
    const categories = employeeRecognitionService.getShoutoutCategories()
    const cat = categories.find(c => c.id === category)
    return cat ? cat.name : 'Recognition'
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-full bg-${color}-100 flex-shrink-0`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${color}-600`} />
        </div>
        <div className="text-right flex-1">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-500 border-t pt-2 sm:pt-3 break-words">{subtitle}</p>
      )}
    </div>
  )

  const ShoutoutCard = ({ shoutout }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl sm:text-2xl flex-shrink-0">{getCategoryIcon(shoutout.category)}</span>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {getCategoryName(shoutout.category)}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 break-words">
              Recognized by {shoutout.recognizedBy} • {formatDate(shoutout.createdAt)}
            </p>
          </div>
        </div>
        
        {shoutout.likes > 0 && (
          <div className="flex items-center gap-1 text-red-500 flex-shrink-0">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{shoutout.likes}</span>
          </div>
        )}
      </div>
      
      <p className="text-sm sm:text-base text-gray-700 leading-relaxed break-words">{shoutout.message}</p>
    </div>
  )

  const RewardCard = ({ reward }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words">
              {reward.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 break-words">
              Given by {reward.givenBy} • {formatDate(reward.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 flex-shrink-0">
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            reward.status === 'pending' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {reward.status === 'pending' ? 'Available' : 'Redeemed'}
          </span>
        </div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl flex-shrink-0">{reward.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-800 text-sm sm:text-base break-words">{reward.name}</p>
            <p className="text-xs sm:text-sm text-green-600 break-words">{reward.description}</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm sm:text-base text-gray-700 mb-4 break-words">{reward.reason}</p>
      
      {reward.status === 'pending' && (
        <button
          onClick={() => handleRedeemReward(reward.id)}
          className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors text-sm sm:text-base"
        >
          Redeem Now
        </button>
      )}
      
      {reward.status === 'redeemed' && reward.redeemedAt && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-xs sm:text-sm">Redeemed on {formatDate(reward.redeemedAt)}</span>
          </div>
        </div>
      )}
    </div>
  )

  const BadgeCard = ({ achievement }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words">
              Badge Earned!
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Awarded by {achievement.awardedBy} • {formatDate(achievement.awardedAt)}
            </p>
          </div>
        </div>
      </div>
      
      <div className={`bg-${achievement.badge.color}-50 border-2 border-${achievement.badge.color}-200 rounded-lg p-3 sm:p-4 mb-4`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-3xl sm:text-4xl flex-shrink-0">{achievement.badge.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-base sm:text-lg break-words">{achievement.badge.name}</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 break-words">{achievement.badge.description}</p>
            <p className="text-xs text-gray-500 break-words">Criteria: {achievement.badge.criteria}</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm sm:text-base text-gray-700 break-words">{achievement.reason}</p>
    </div>
  )

  const pendingRewards = rewards.filter(r => r.status === 'pending')

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Recognition</h1>
        <p className="text-sm sm:text-base text-gray-600">Your achievements, rewards, and performance highlights</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', name: 'Overview', icon: TrendingUp },
          { id: 'shoutouts', name: 'Shout-outs', icon: MessageSquare },
          { id: 'rewards', name: 'Rewards', icon: Gift },
          { id: 'badges', name: 'Badges', icon: Award }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="hidden xs:block w-3 h-3 sm:w-5 sm:h-5" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Star}
              title="Recognition Points"
              value={performance.totalPoints || 0}
              subtitle="Earned from all achievements"
              color="yellow"
            />
            <StatCard
              icon={MessageSquare}
              title="Shout-outs Received"
              value={performance.totalShoutouts || 0}
              subtitle="Public recognition from managers"
              color="blue"
            />
            <StatCard
              icon={Gift}
              title="Rewards Earned"
              value={performance.totalRewards || 0}
              subtitle={`${pendingRewards.length} available to redeem`}
              color="green"
            />
            <StatCard
              icon={Award}
              title="Badges Earned"
              value={performance.totalBadges || 0}
              subtitle="Special achievements unlocked"
              color="purple"
            />
          </div>

          {/* Pending Rewards Alert */}
          {pendingRewards.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-green-800 break-words">
                    You have {pendingRewards.length} reward{pendingRewards.length !== 1 ? 's' : ''} to redeem!
                  </h3>
                  <p className="text-sm sm:text-base text-green-700 break-words">Click the Rewards tab to view and redeem your available rewards.</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Recognition</h2>
            
            <div className="space-y-3 sm:space-y-4">
              {performance.activities?.slice(0, 5).map((activity, index) => (
                <div key={activity.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.action === 'shoutout_received' ? 'bg-blue-100' :
                    activity.action === 'reward_received' ? 'bg-green-100' :
                    activity.action === 'badge_earned' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {activity.action === 'shoutout_received' && <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    {activity.action === 'reward_received' && <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                    {activity.action === 'badge_earned' && <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
                    {activity.action === 'reward_redeemed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                      {activity.action === 'shoutout_received' && `Received shout-out from ${activity.data.recognizedBy}`}
                      {activity.action === 'reward_received' && 'Earned a new reward'}
                      {activity.action === 'badge_earned' && `Earned badge: ${activity.data.badgeName}`}
                      {activity.action === 'reward_redeemed' && 'Redeemed a reward'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
              
              {(!performance.activities || performance.activities.length === 0) && (
                <div className="text-center py-6 sm:py-8">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">No recent activity yet. Keep up the great work!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shout-outs Tab */}
      {activeTab === 'shoutouts' && (
        <div className="space-y-6">
          {shoutouts.length > 0 ? (
            <div className="space-y-4">
              {shoutouts
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(shoutout => (
                  <ShoutoutCard key={shoutout.id} shoutout={shoutout} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Shout-outs Yet</h3>
              <p className="text-sm sm:text-base text-gray-500">Keep up the excellent work and you'll receive recognition soon!</p>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {rewards.length > 0 ? (
            <div className="space-y-4">
              {rewards
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(reward => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <Gift className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Rewards Yet</h3>
              <p className="text-sm sm:text-base text-gray-500">Continue your outstanding performance to earn rewards!</p>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {badges.length > 0 ? (
            <div className="space-y-4">
              {badges
                .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
                .map(badge => (
                  <BadgeCard key={badge.id} achievement={badge} />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <Award className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Badges Yet</h3>
              <p className="text-sm sm:text-base text-gray-500">Work towards earning your first achievement badge!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmployeeRecognitionDashboard
