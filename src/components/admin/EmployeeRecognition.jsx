import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Gift, 
  Star, 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Heart,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  ChevronRight,
  Medal,
  Target,
  Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import employeeRecognitionService from '../../services/employeeRecognitionService'

const EmployeeRecognition = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [employees, setEmployees] = useState([])
  const [shoutouts, setShoutouts] = useState([])
  const [rewards, setRewards] = useState([])
  const [achievements, setAchievements] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [stats, setStats] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalType, setModalType] = useState('shoutout') // 'shoutout', 'reward', 'badge'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Load employees from localStorage
    const employeeData = JSON.parse(localStorage.getItem('employees') || '[]')
    setEmployees(employeeData)

    // Load recognition data
    setShoutouts(employeeRecognitionService.getRecentShoutouts(20))
    setRewards(employeeRecognitionService.getAllRewards().slice(0, 20))
    setAchievements(employeeRecognitionService.getAllAchievements().slice(0, 20))
    setTopPerformers(employeeRecognitionService.getTopPerformers(10))
    setStats(employeeRecognitionService.getRecognitionStats())
  }

  const handleCreateRecognition = (type) => {
    setModalType(type)
    setShowCreateModal(true)
  }

  const filteredData = () => {
    let allData = []
    
    if (filterType === 'all' || filterType === 'shoutouts') {
      allData = [...allData, ...shoutouts.map(s => ({ ...s, type: 'shoutout' }))]
    }
    if (filterType === 'all' || filterType === 'rewards') {
      allData = [...allData, ...rewards.map(r => ({ ...r, type: 'reward' }))]
    }
    if (filterType === 'all' || filterType === 'badges') {
      allData = [...allData, ...achievements.map(a => ({ ...a, type: 'badge' }))]
    }

    if (searchQuery) {
      return allData.filter(item =>
        item.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return allData.sort((a, b) => 
      new Date(b.createdAt || b.awardedAt) - new Date(a.createdAt || b.awardedAt)
    )
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

  const getCategoryColor = (category) => {
    const categories = employeeRecognitionService.getShoutoutCategories()
    const cat = categories.find(c => c.id === category)
    return cat ? cat.color : 'gray'
  }

  const getCategoryIcon = (category) => {
    const categories = employeeRecognitionService.getShoutoutCategories()
    const cat = categories.find(c => c.id === category)
    return cat ? cat.icon : '📋'
  }

  const StatCard = ({ icon: Icon, title, value, trend, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
              <span className="text-green-600">{trend}% this month</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full bg-${color}-100 flex-shrink-0`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const RecognitionItem = ({ item }) => {
    const isShoutout = item.type === 'shoutout'
    const isReward = item.type === 'reward'
    const isBadge = item.type === 'badge'

    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isShoutout ? 'bg-blue-100' : isReward ? 'bg-green-100' : 'bg-purple-100'
            }`}>
              {isShoutout && <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
              {isReward && <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
              {isBadge && <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                {item.employeeName}
                <span className="block xs:inline">
                  {isShoutout && (
                    <span className="text-xs sm:text-sm text-gray-600 ml-0 xs:ml-2">
                      • {getCategoryIcon(item.category)} {employeeRecognitionService.getShoutoutCategories().find(c => c.id === item.category)?.name}
                    </span>
                  )}
                  {isReward && (
                    <span className="text-xs sm:text-sm text-gray-600 ml-0 xs:ml-2">
                      • {item.rewardName || item.name}
                    </span>
                  )}
                  {isBadge && (
                    <span className="text-xs sm:text-sm text-gray-600 ml-0 xs:ml-2">
                      • {item.badge.icon} {item.badge.name}
                    </span>
                  )}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {isShoutout && `Recognized by ${item.recognizedBy}`}
                {isReward && `Rewarded by ${item.givenBy}`}
                {isBadge && `Badge awarded by ${item.awardedBy}`}
                {' • '}{formatDate(item.createdAt || item.awardedAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 xs:flex-shrink-0">
            {isShoutout && item.likes > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-sm">{item.likes}</span>
              </div>
            )}
            {isReward && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {item.status}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-sm sm:text-base text-gray-700 mb-4 break-words">
          {item.message || item.reason}
        </p>
        
        {isReward && item.value && (
          <div className="bg-green-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon || '🎁'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 text-sm sm:text-base break-words">{item.name}</p>
                <p className="text-xs sm:text-sm text-green-600 break-words">{item.description}</p>
              </div>
            </div>
          </div>
        )}
        
        {isBadge && (
          <div className={`bg-${item.badge.color}-50 rounded-lg p-3 mb-3 border-2 border-${item.badge.color}-200`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{item.badge.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm sm:text-base break-words">{item.badge.name}</p>
                <p className="text-xs sm:text-sm text-gray-600 break-words">{item.badge.description}</p>
                <p className="text-xs text-gray-500 mt-1 break-words">Criteria: {item.badge.criteria}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const CreateRecognitionModal = () => {
    const [formData, setFormData] = useState({
      employeeId: '',
      employeeName: '',
      message: '',
      reason: '',
      category: 'customer_service',
      rewardType: 'points_50',
      badgeId: 'customer_service_star'
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      
      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId)
      if (!selectedEmployee) return

      const baseData = {
        employeeId: formData.employeeId,
        employeeName: selectedEmployee.name,
        recognizedBy: user.name,
        givenBy: user.name,
        awardedBy: user.name
      }

      if (modalType === 'shoutout') {
        employeeRecognitionService.createShoutout({
          ...baseData,
          message: formData.message,
          category: formData.category
        })
      } else if (modalType === 'reward') {
        const rewardTypes = employeeRecognitionService.getRewardTypes()
        const selectedReward = rewardTypes.find(r => r.id === formData.rewardType)
        
        employeeRecognitionService.giveReward({
          ...baseData,
          ...selectedReward,
          reason: formData.reason
        })
      } else if (modalType === 'badge') {
        employeeRecognitionService.awardBadge(
          formData.employeeId,
          formData.badgeId,
          user.name,
          formData.reason
        )
      }

      setShowCreateModal(false)
      setFormData({
        employeeId: '',
        employeeName: '',
        message: '',
        reason: '',
        category: 'customer_service',
        rewardType: 'points_50',
        badgeId: 'customer_service_star'
      })
      loadData()
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                {modalType === 'shoutout' && 'Give Shout-out'}
                {modalType === 'reward' && 'Give Reward'}
                {modalType === 'badge' && 'Award Badge'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                  ))}
                </select>
              </div>

              {/* Shout-out specific fields */}
              {modalType === 'shoutout' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {employeeRecognitionService.getShoutoutCategories().map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recognition Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Share what made this employee stand out..."
                      required
                    />
                  </div>
                </>
              )}

              {/* Reward specific fields */}
              {modalType === 'reward' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reward Type
                    </label>
                    <select
                      value={formData.rewardType}
                      onChange={(e) => setFormData({...formData, rewardType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {employeeRecognitionService.getRewardTypes().map(reward => (
                        <option key={reward.id} value={reward.id}>
                          {reward.icon} {reward.name} - {reward.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Reward
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Why is this employee receiving this reward?"
                      required
                    />
                  </div>
                </>
              )}

              {/* Badge specific fields */}
              {modalType === 'badge' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Badge Type
                    </label>
                    <select
                      value={formData.badgeId}
                      onChange={(e) => setFormData({...formData, badgeId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {employeeRecognitionService.getBadgeTypes().map(badge => (
                        <option key={badge.id} value={badge.id}>
                          {badge.icon} {badge.name} - {badge.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Badge
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Explain why this employee deserves this badge..."
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {modalType === 'shoutout' && 'Give Shout-out'}
                  {modalType === 'reward' && 'Give Reward'}
                  {modalType === 'badge' && 'Award Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Employee Recognition</h1>
              <p className="text-sm sm:text-base text-gray-600">Celebrate achievements and motivate your team</p>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
              <button
                onClick={() => handleCreateRecognition('shoutout')}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 xs:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm xs:text-base"
              >
                <MessageSquare className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden xs:inline">Give </span>Shout-out
              </button>
              <button
                onClick={() => handleCreateRecognition('reward')}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 xs:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm xs:text-base"
              >
                <Gift className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden xs:inline">Give </span>Reward
              </button>
              <button
                onClick={() => handleCreateRecognition('badge')}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 xs:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm xs:text-base"
              >
                <Award className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden xs:inline">Award </span>Badge
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-nowrap gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', name: 'Overview', icon: TrendingUp },
            { id: 'activity', name: 'Activity', icon: Calendar },
            { id: 'leaderboard', name: 'Leaders', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg transition-colors text-xs sm:text-base whitespace-nowrap min-w-fit ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline sm:hidden lg:inline">{tab.name}</span>
              <span className="xs:hidden sm:inline lg:hidden">{tab.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={MessageSquare}
                title="Total Shout-outs"
                value={stats.totalShoutouts || 0}
                trend={12}
                color="blue"
              />
              <StatCard
                icon={Gift}
                title="Rewards Given"
                value={stats.totalRewards || 0}
                trend={8}
                color="green"
              />
              <StatCard
                icon={Award}
                title="Badges Awarded"
                value={stats.totalBadges || 0}
                trend={15}
                color="purple"
              />
              <StatCard
                icon={Users}
                title="Active Employees"
                value={employees.length}
                trend={3}
                color="orange"
              />
            </div>

            {/* Recent Recognition */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Recent Recognition</h2>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm sm:text-base"
                >
                  <span className="hidden xs:inline">View </span>All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {stats.recentActivity?.slice(0, 5).map((item, index) => (
                  <RecognitionItem key={index} item={item} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full sm:w-auto pl-9 sm:pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm sm:text-base"
                  >
                    <option value="all">All</option>
                    <option value="shoutouts">Shout-outs</option>
                    <option value="rewards">Rewards</option>
                    <option value="badges">Badges</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recognition Feed */}
            <div className="space-y-4">
              {filteredData().length > 0 ? (
                filteredData().map((item, index) => (
                  <RecognitionItem key={index} item={item} />
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Recognition Found</h3>
                  <p className="text-sm sm:text-base text-gray-500">Start recognizing your team's great work!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Top Performers</h2>
              
              <div className="space-y-3 sm:space-y-4">
                {topPerformers.map((performer, index) => {
                  const employee = employees.find(emp => emp.id === performer.employeeId)
                  return (
                    <div key={performer.employeeId} className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{employee?.name || 'Unknown Employee'}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">{employee?.position || 'Position not set'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 xs:gap-6 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                            <span className="font-bold">{performer.totalPoints}</span>
                          </div>
                          <span className="text-gray-500 text-xs">Points</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-bold">{performer.totalShoutouts}</span>
                          </div>
                          <span className="text-gray-500 text-xs">Shout-outs</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-purple-600">
                            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-bold">{performer.totalBadges}</span>
                          </div>
                          <span className="text-gray-500 text-xs">Badges</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Recognition Modal */}
      {showCreateModal && <CreateRecognitionModal />}
    </div>
  )
}

export default EmployeeRecognition
