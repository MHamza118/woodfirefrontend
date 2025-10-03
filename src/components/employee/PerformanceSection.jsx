import { useState, useEffect } from 'react'
import { Star, MessageCircle, Calendar, TrendingUp, Award, FileText, Eye, ChevronDown, ChevronUp, Target, CheckCircle, Clock, User, BarChart3 } from 'lucide-react'

const PerformanceSection = ({ employeeData }) => {
  const [performanceReports, setPerformanceReports] = useState([])
  const [interactions, setInteractions] = useState([])
  const [expandedReport, setExpandedReport] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllInteractions, setShowAllInteractions] = useState(false)

  useEffect(() => {
    loadPerformanceData()
  }, [employeeData])

  const loadPerformanceData = () => {
    // Load performance reports
    const storedReports = localStorage.getItem('performanceReports')
    if (storedReports) {
      const allReports = JSON.parse(storedReports)
      const myReports = allReports.filter(report => report.employeeId === employeeData.id)
      setPerformanceReports(myReports)
    }

    // Load interactions/feedback
    const storedInteractions = localStorage.getItem('performanceInteractions')
    if (storedInteractions) {
      const allInteractions = JSON.parse(storedInteractions)
      const myInteractions = allInteractions.filter(interaction => interaction.employeeId === employeeData.id)
      setInteractions(myInteractions)
    }
  }

  const getLatestReport = () => {
    if (performanceReports.length === 0) return null
    return performanceReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  }

  const getPerformanceTrend = () => {
    if (performanceReports.length < 2) return null
    
    const sortedReports = performanceReports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const latest = sortedReports[sortedReports.length - 1]
    const previous = sortedReports[sortedReports.length - 2]
    
    const trend = latest.overallRating - previous.overallRating
    return {
      trend,
      isImproving: trend > 0,
      isDecreasing: trend < 0,
      isStable: trend === 0
    }
  }

  const getAverageRating = () => {
    if (performanceReports.length === 0) return 0
    const sum = performanceReports.reduce((acc, report) => acc + report.overallRating, 0)
    return (sum / performanceReports.length).toFixed(1)
  }

  const getRecentInteractions = () => {
    return interactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, showAllInteractions ? interactions.length : 3)
  }

  const getCategoryAverage = (category) => {
    if (performanceReports.length === 0) return 0
    const sum = performanceReports.reduce((acc, report) => acc + (report.ratings[category] || 0), 0)
    return (sum / performanceReports.length).toFixed(1)
  }

  const latestReport = getLatestReport()
  const trend = getPerformanceTrend()
  const averageRating = getAverageRating()

  const ratingCategories = [
    { key: 'punctuality', label: 'Punctuality & Attendance', icon: Clock },
    { key: 'workQuality', label: 'Work Quality & Accuracy', icon: Target },
    { key: 'teamwork', label: 'Teamwork & Collaboration', icon: User },
    { key: 'communication', label: 'Communication Skills', icon: MessageCircle },
    { key: 'customerService', label: 'Customer Service', icon: Award },
    { key: 'initiative', label: 'Initiative & Problem Solving', icon: TrendingUp }
  ]

  const renderStarRating = (rating, size = 'w-4 h-4') => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      ))}
      <span className="text-sm font-medium text-charcoal ml-2">{rating}</span>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Hero Section */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden xs:block p-2 sm:p-3 bg-gold/20 backdrop-blur-sm rounded-lg">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Performance Dashboard</h3>
                <p className="text-cream/80 text-xs sm:text-sm mb-4 leading-relaxed">
                  Track your performance reviews, ratings, and feedback from management. 
                  Use this information to understand your strengths and areas for growth.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-gold/90 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{performanceReports.length} reviews</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{interactions.length} interactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Dashboard */}
      {performanceReports.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-charcoal/70">Current Rating</p>
                  <p className="text-xl sm:text-2xl font-bold text-charcoal">{latestReport?.overallRating || '0.0'}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {renderStarRating(latestReport?.overallRating || 0, 'w-3 h-3')}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-charcoal/70">Average Rating</p>
                  <p className="text-xl sm:text-2xl font-bold text-charcoal">{averageRating}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-charcoal/60">Across {performanceReports.length} reviews</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-charcoal/70">Trend</p>
                  <p className={`text-xl sm:text-2xl font-bold ${
                    trend?.isImproving ? 'text-green-600' : 
                    trend?.isDecreasing ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {trend ? (trend.isImproving ? '+' : '') + trend.trend.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl ${
                  trend?.isImproving ? 'bg-green-100' : 
                  trend?.isDecreasing ? 'bg-red-100' : 
                  'bg-gray-100'
                }`}>
                  <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    trend?.isImproving ? 'text-green-600' : 
                    trend?.isDecreasing ? 'text-red-600' : 
                    'text-gray-600'
                  }`} />
                </div>
              </div>
              <p className="text-xs text-charcoal/60">
                {trend?.isImproving ? 'Improving' : 
                 trend?.isDecreasing ? 'Needs attention' : 
                 trend?.isStable ? 'Stable performance' : 
                 'Not enough data'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-charcoal/70">Last Review</p>
                  <p className="text-xs sm:text-sm font-bold text-charcoal">
                    {latestReport ? new Date(latestReport.createdAt).toLocaleDateString() : 'None'}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-charcoal/60">
                {latestReport ? latestReport.type : 'No reviews yet'}
              </p>
            </div>
          </div>

          {/* Performance Categories Chart */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-charcoal mb-4 sm:mb-6">Performance by Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {ratingCategories.map(category => {
                const CategoryIcon = category.icon
                const avgRating = getCategoryAverage(category.key)
                const latestRating = latestReport?.ratings[category.key] || 0

                return (
                  <div key={category.key} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg">
                        <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-charcoal text-xs sm:text-sm truncate">{category.label}</h4>
                        <p className="text-xs text-charcoal/60">Average: {avgRating}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-charcoal/70">Current</span>
                        <span className="font-medium text-charcoal">{latestRating}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(latestRating / 5) * 100}%` }}
                        />
                      </div>
                      {renderStarRating(latestRating, 'w-3 h-3')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'border-gold text-gold bg-gold/5'
                    : 'border-transparent text-charcoal/60 hover:text-charcoal hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Performance Reports ({performanceReports.length})</span>
                  <span className="sm:hidden">Reports ({performanceReports.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'feedback'
                    ? 'border-gold text-gold bg-gold/5'
                    : 'border-transparent text-charcoal/60 hover:text-charcoal hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Feedback & Interactions ({interactions.length})</span>
                  <span className="sm:hidden">Feedback ({interactions.length})</span>
                </div>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {performanceReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Reports</h3>
                      <p className="text-gray-500">Your performance reports will appear here once they are created by management.</p>
                    </div>
                  ) : (
                    performanceReports
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((report) => (
                        <div key={report.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div 
                            className="p-3 sm:p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-current" />
                                  <span className="font-bold text-charcoal text-base sm:text-lg">{report.overallRating}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-charcoal text-sm sm:text-base truncate">{report.type}</h4>
                                  <p className="text-xs sm:text-sm text-charcoal/60 truncate">
                                    {new Date(report.createdAt).toLocaleDateString()} • by {report.createdBy}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  report.overallRating >= 4.5 ? 'bg-green-100 text-green-700' :
                                  report.overallRating >= 3.5 ? 'bg-blue-100 text-blue-700' :
                                  report.overallRating >= 2.5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {report.overallRating >= 4.5 ? 'Excellent' :
                                   report.overallRating >= 3.5 ? 'Good' :
                                   report.overallRating >= 2.5 ? 'Satisfactory' :
                                   'Needs Improvement'}
                                </span>
                                {expandedReport === report.id ? (
                                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {expandedReport === report.id && (
                            <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                  <h5 className="font-semibold text-charcoal text-sm sm:text-base mb-3 sm:mb-4">Individual Ratings</h5>
                                  <div className="space-y-3">
                                    {Object.entries(report.ratings).map(([key, rating]) => {
                                      const category = ratingCategories.find(cat => cat.key === key)
                                      if (!category) return null
                                      
                                      return (
                                        <div key={key} className="flex justify-between items-center">
                                          <span className="text-xs sm:text-sm text-charcoal pr-2 truncate">{category.label}</span>
                                          {renderStarRating(rating, 'w-3 h-3')}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                  {report.strengths && (
                                    <div>
                                      <h5 className="font-semibold text-charcoal text-sm mb-2">Strengths & Achievements</h5>
                                      <p className="text-xs sm:text-sm text-charcoal/80 bg-green-50 p-3 rounded border border-green-200">
                                        {report.strengths}
                                      </p>
                                    </div>
                                  )}

                                  {report.areasForImprovement && (
                                    <div>
                                      <h5 className="font-semibold text-charcoal text-sm mb-2">Areas for Improvement</h5>
                                      <p className="text-xs sm:text-sm text-charcoal/80 bg-yellow-50 p-3 rounded border border-yellow-200">
                                        {report.areasForImprovement}
                                      </p>
                                    </div>
                                  )}

                                  {report.goals && (
                                    <div>
                                      <h5 className="font-semibold text-charcoal text-sm mb-2">Goals & Action Items</h5>
                                      <p className="text-xs sm:text-sm text-charcoal/80 bg-blue-50 p-3 rounded border border-blue-200">
                                        {report.goals}
                                      </p>
                                    </div>
                                  )}

                                  {report.notes && (
                                    <div>
                                      <h5 className="font-semibold text-charcoal text-sm mb-2">Additional Notes</h5>
                                      <p className="text-xs sm:text-sm text-charcoal/80 bg-gray-50 p-3 rounded border border-gray-200">
                                        {report.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {interactions.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
                      <p className="text-gray-500">Feedback and interactions from your manager will appear here.</p>
                    </div>
                  ) : (
                    <>
                      {getRecentInteractions().map((interaction) => (
                        <div key={interaction.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                interaction.type === 'recognition' ? 'bg-green-100 text-green-700' :
                                interaction.type === 'coaching' ? 'bg-blue-100 text-blue-700' :
                                interaction.type === 'correction' ? 'bg-orange-100 text-orange-700' :
                                interaction.type === 'development' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                interaction.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                interaction.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                interaction.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {interaction.priority}
                              </span>
                            </div>
                            <div className="text-xs text-charcoal/60">
                              {new Date(interaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-charcoal text-sm sm:text-base mb-2">{interaction.subject}</h4>
                          <p className="text-xs sm:text-sm text-charcoal/80 mb-3">{interaction.message}</p>
                          
                          {interaction.followUpRequired && (
                            <div className="flex items-center gap-2 text-xs text-orange-600">
                              <Clock className="w-3 h-3" />
                              <span>Follow-up required{interaction.followUpDate ? ` by ${new Date(interaction.followUpDate).toLocaleDateString()}` : ''}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {interactions.length > 3 && (
                        <div className="text-center">
                          <button
                            onClick={() => setShowAllInteractions(!showAllInteractions)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-gradient text-charcoal rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                          >
                            {showAllInteractions ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show All ({interactions.length - 3} more)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // No performance data state
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-4">No Performance Data Yet</h3>
            <p className="text-charcoal/70 mb-6 leading-relaxed">
              Your performance reports and feedback will appear here once your manager creates them. 
              This section will help you track your progress and understand areas for growth.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">What you'll see here:</h4>
              <ul className="text-sm text-blue-700 text-left space-y-1">
                <li>• Performance review ratings and feedback</li>
                <li>• Individual category breakdowns</li>
                <li>• Strengths and improvement areas</li>
                <li>• Goals and action items</li>
                <li>• Manager feedback and coaching</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceSection
