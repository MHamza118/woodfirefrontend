import { useState, useEffect } from 'react'
import { User, Star, MessageCircle, Edit, Eye, Trash2, Plus, Calendar, Clock, Award, TrendingUp, FileText, Send, Filter, Search, ChevronDown, ChevronUp, Target } from 'lucide-react'
import notificationService from '../../services/notificationService'

const PerformanceManagement = () => {
  const [employees, setEmployees] = useState([])
  const [performanceReports, setPerformanceReports] = useState([])
  const [interactions, setInteractions] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showNewReportModal, setShowNewReportModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showReportDetails, setShowReportDetails] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadEmployees()
    loadPerformanceData()
  }, [])

  const loadEmployees = () => {
    const storedEmployees = localStorage.getItem('employees')
    if (storedEmployees) {
      const employeeData = JSON.parse(storedEmployees)
      setEmployees(employeeData.filter(emp => emp.status === 'ACTIVE'))
    }
  }

  const loadPerformanceData = () => {
    const storedReports = localStorage.getItem('performanceReports')
    const storedInteractions = localStorage.getItem('performanceInteractions')
    
    if (storedReports) {
      setPerformanceReports(JSON.parse(storedReports))
    }
    
    if (storedInteractions) {
      setInteractions(JSON.parse(storedInteractions))
    }
  }

  const getEmployeeName = (employee) => {
    if (!employee) return 'Unknown Employee'
    return `${employee.personalInfo?.firstName || employee.name || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
  }

  const getEmployeeReports = (employeeId) => {
    return performanceReports.filter(report => report.employeeId === employeeId)
  }

  const getEmployeeInteractions = (employeeId) => {
    return interactions.filter(interaction => interaction.employeeId === employeeId)
  }

  const getFilteredEmployees = () => {
    let filtered = employees

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(employee => {
        const name = getEmployeeName(employee).toLowerCase()
        const email = (employee.email || '').toLowerCase()
        const location = (employee.location?.name || '').toLowerCase()
        return name.includes(searchTerm.toLowerCase()) || 
               email.includes(searchTerm.toLowerCase()) || 
               location.includes(searchTerm.toLowerCase())
      })
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(employee => {
        const reports = getEmployeeReports(employee.id)
        const latestReport = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        
        if (filterStatus === 'excellent') return latestReport?.overallRating >= 4.5
        if (filterStatus === 'good') return latestReport?.overallRating >= 3.5 && latestReport?.overallRating < 4.5
        if (filterStatus === 'needs-improvement') return latestReport?.overallRating < 3.5
        if (filterStatus === 'no-reports') return reports.length === 0
        return true
      })
    }

    return filtered
  }

  const getPerformanceStatus = (employee) => {
    const reports = getEmployeeReports(employee.id)
    if (reports.length === 0) return { status: 'No Reports', color: 'bg-gray-100 text-gray-600', rating: null }
    
    const latestReport = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const rating = latestReport.overallRating
    
    if (rating >= 4.5) return { status: 'Excellent', color: 'bg-green-100 text-green-700', rating }
    if (rating >= 3.5) return { status: 'Good', color: 'bg-blue-100 text-blue-700', rating }
    if (rating >= 2.5) return { status: 'Satisfactory', color: 'bg-yellow-100 text-yellow-700', rating }
    return { status: 'Needs Improvement', color: 'bg-red-100 text-red-700', rating }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Total Employees</p>
              <p className="text-2xl font-bold text-charcoal">{employees.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Total Reports</p>
              <p className="text-2xl font-bold text-charcoal">{performanceReports.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Avg Rating</p>
              <p className="text-2xl font-bold text-charcoal">
                {performanceReports.length > 0 
                  ? (performanceReports.reduce((sum, report) => sum + report.overallRating, 0) / performanceReports.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Interactions</p>
              <p className="text-2xl font-bold text-charcoal">{interactions.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white min-w-0 flex-shrink-0"
            >
              <option value="all">All Performance</option>
              <option value="excellent">Excellent (4.5+)</option>
              <option value="good">Good (3.5-4.4)</option>
              <option value="needs-improvement">Needs Improvement (&lt;3.5)</option>
              <option value="no-reports">No Reports</option>
            </select>

            <button
              onClick={() => setShowNewReportModal(true)}
              className="bg-gold-gradient text-charcoal px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-0 flex-shrink-0"
            >
              <Plus className="w-4 h-4 hidden sm:inline" />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20">
          <h3 className="text-lg font-semibold text-cream">Employee Performance Overview</h3>
          <p className="text-sm text-cream/80">Manage performance reports and feedback for all employees</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Performance Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Latest Report</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Total Reports</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Interactions</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {getFilteredEmployees().map((employee) => {
                const performanceStatus = getPerformanceStatus(employee)
                const reports = getEmployeeReports(employee.id)
                const employeeInteractions = getEmployeeInteractions(employee.id)
                const latestReport = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

                return (
                  <tr key={employee.id} className="hover:bg-gold/5 transition-all duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full items-center justify-center hidden sm:flex">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-charcoal">
                            {getEmployeeName(employee)}
                          </div>
                          <div className="text-xs text-charcoal/60">
                            {employee.email}
                          </div>
                          <div className="text-xs text-charcoal/50">
                            {employee.location?.name || 'No location'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${performanceStatus.color}`}>
                          {performanceStatus.status}
                        </span>
                        {performanceStatus.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current hidden sm:inline" />
                            <span className="text-xs font-medium text-charcoal">
                              {performanceStatus.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap text-sm text-charcoal">
                      {latestReport ? (
                        <div>
                          <div className="font-medium">{new Date(latestReport.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-charcoal/60">{latestReport.type || 'Performance Review'}</div>
                        </div>
                      ) : (
                        <span className="text-charcoal/50">No reports</span>
                      )}
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 hidden sm:inline" />
                        <span className="text-sm font-medium text-charcoal">{reports.length}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-purple-600 hidden sm:inline" />
                        <span className="text-sm font-medium text-charcoal">{employeeInteractions.length}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setShowReportDetails(employee)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setShowNewReportModal(true)
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="New Report"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setShowFeedbackModal(true)
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Add Feedback"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {getFilteredEmployees().length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewReportModal && (
        <NewPerformanceReportModal
          employee={selectedEmployee}
          onClose={() => {
            setShowNewReportModal(false)
            setSelectedEmployee(null)
          }}
          onSave={(reportData) => {
            const newReport = {
              id: Date.now().toString(),
              employeeId: selectedEmployee?.id || reportData.employeeId,
              employeeName: selectedEmployee ? getEmployeeName(selectedEmployee) : '',
              createdAt: new Date().toISOString(),
              createdBy: 'Admin', // Could be dynamic based on current user
              ...reportData
            }
            
            const updatedReports = [...performanceReports, newReport]
            setPerformanceReports(updatedReports)
            localStorage.setItem('performanceReports', JSON.stringify(updatedReports))
            
            // Notify employee
            if (newReport.employeeId) {
              notificationService.notifyPerformanceReport(
                newReport.employeeId,
                newReport.type || 'Performance Review',
                newReport.overallRating
              )
            }
            
            setShowNewReportModal(false)
            setSelectedEmployee(null)
          }}
          employees={employees}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          employee={selectedEmployee}
          onClose={() => {
            setShowFeedbackModal(false)
            setSelectedEmployee(null)
          }}
          onSave={(feedbackData) => {
            const newInteraction = {
              id: Date.now().toString(),
              employeeId: selectedEmployee.id,
              employeeName: getEmployeeName(selectedEmployee),
              type: 'feedback',
              createdAt: new Date().toISOString(),
              createdBy: 'Admin',
              ...feedbackData
            }
            
            const updatedInteractions = [...interactions, newInteraction]
            setInteractions(updatedInteractions)
            localStorage.setItem('performanceInteractions', JSON.stringify(updatedInteractions))
            
            // Notify employee
            notificationService.notifyFeedback(selectedEmployee.id, feedbackData.subject)
            
            setShowFeedbackModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}

      {showReportDetails && (
        <EmployeePerformanceDetailsModal
          employee={showReportDetails}
          reports={getEmployeeReports(showReportDetails.id)}
          interactions={getEmployeeInteractions(showReportDetails.id)}
          onClose={() => {
            setShowReportDetails(null)
            setSelectedEmployee(null)
          }}
          onDeleteReport={(reportId) => {
            const updatedReports = performanceReports.filter(report => report.id !== reportId)
            setPerformanceReports(updatedReports)
            localStorage.setItem('performanceReports', JSON.stringify(updatedReports))
          }}
          onDeleteInteraction={(interactionId) => {
            const updatedInteractions = interactions.filter(interaction => interaction.id !== interactionId)
            setInteractions(updatedInteractions)
            localStorage.setItem('performanceInteractions', JSON.stringify(updatedInteractions))
          }}
        />
      )}
    </div>
  )
}

// New Performance Report Modal
const NewPerformanceReportModal = ({ employee, employees, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employeeId: employee?.id || '',
    type: 'Performance Review',
    reviewPeriod: 'monthly',
    ratings: {
      punctuality: 3,
      workQuality: 3,
      teamwork: 3,
      communication: 3,
      customerService: 3,
      initiative: 3
    },
    strengths: '',
    areasForImprovement: '',
    goals: '',
    notes: '',
    overallRating: 3
  })

  const ratingCategories = [
    { key: 'punctuality', label: 'Punctuality & Attendance' },
    { key: 'workQuality', label: 'Work Quality & Accuracy' },
    { key: 'teamwork', label: 'Teamwork & Collaboration' },
    { key: 'communication', label: 'Communication Skills' },
    { key: 'customerService', label: 'Customer Service' },
    { key: 'initiative', label: 'Initiative & Problem Solving' }
  ]

  useEffect(() => {
    const avgRating = Object.values(formData.ratings).reduce((sum, rating) => sum + rating, 0) / Object.values(formData.ratings).length
    setFormData(prev => ({ ...prev, overallRating: Number(avgRating.toFixed(1)) }))
  }, [formData.ratings])

  const handleRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [category]: rating }
    }))
  }

  const handleSave = () => {
    if (!formData.employeeId) {
      alert('Please select an employee')
      return
    }
    onSave(formData)
  }

  const renderStarRating = (category, currentRating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => handleRatingChange(category, star)}
          className={`w-6 h-6 ${star <= currentRating ? 'text-yellow-500 fill-current' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          <Star className="w-full h-full" />
        </button>
      ))}
      <span className="text-sm font-medium text-charcoal ml-2">{currentRating}.0</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-charcoal">New Performance Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6 pb-4">
            {/* Employee Selection */}
            {!employee && (
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Select Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {`${emp.personalInfo?.firstName || emp.name || 'Employee'} ${emp.personalInfo?.lastName || ''}`.trim()} - {emp.location?.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Report Type and Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Report Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="Performance Review">Performance Review</option>
                  <option value="90-Day Review">90-Day Review</option>
                  <option value="Annual Review">Annual Review</option>
                  <option value="Disciplinary Action">Disciplinary Action</option>
                  <option value="Recognition">Recognition</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Review Period</label>
                <select
                  value={formData.reviewPeriod}
                  onChange={(e) => setFormData({ ...formData, reviewPeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            {/* Rating Categories */}
            <div>
              <h4 className="text-lg font-semibold text-charcoal mb-4">Performance Ratings</h4>
              <div className="space-y-4">
                {ratingCategories.map(category => (
                  <div key={category.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-charcoal">{category.label}</span>
                    {renderStarRating(category.key, formData.ratings[category.key])}
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Rating Display */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-charcoal">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${star <= formData.overallRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-charcoal">{formData.overallRating}</span>
                </div>
              </div>
            </div>

            {/* Text Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Strengths & Achievements</label>
                <textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="What has this employee done well?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Areas for Improvement</label>
                <textarea
                  value={formData.areasForImprovement}
                  onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="What areas need development?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Goals & Action Items</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Set specific goals and action items"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Any additional comments or observations"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <FileText className="w-4 h-4" />
            Save Report
          </button>
        </div>
      </div>
    </div>
  )
}

// Feedback Modal
const FeedbackModal = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    priority: 'medium',
    followUpRequired: false,
    followUpDate: ''
  })

  const handleSave = () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Please fill in the subject and message')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-charcoal">
            Add Feedback for {employee?.personalInfo?.firstName || employee?.name || 'Employee'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="general">General Feedback</option>
                <option value="recognition">Recognition</option>
                <option value="coaching">Coaching</option>
                <option value="correction">Correction</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Brief subject line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Detailed feedback message"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="w-4 h-4 text-gold focus:ring-gold rounded"
              />
              <span className="text-sm text-charcoal">Follow-up required</span>
            </label>

            {formData.followUpRequired && (
              <div>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  )
}

// Employee Performance Details Modal
const EmployeePerformanceDetailsModal = ({ employee, reports, interactions, onClose, onDeleteReport, onDeleteInteraction }) => {
  const [activeTab, setActiveTab] = useState('reports')

  const getEmployeeName = (employee) => {
    return `${employee.personalInfo?.firstName || employee.name || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-charcoal">{getEmployeeName(employee)} - Performance Details</h3>
            <p className="text-sm text-charcoal/60">{employee.email} • {employee.location?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'reports' 
              ? 'border-gold text-gold' 
              : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
          >
            Performance Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'interactions' 
              ? 'border-gold text-gold' 
              : 'border-transparent text-charcoal/60 hover:text-charcoal'}`}
          >
            Interactions ({interactions.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Reports</h3>
                  <p className="text-gray-500">No performance reports have been created for this employee yet.</p>
                </div>
              ) : (
                reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((report) => (
                  <div key={report.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-charcoal">{report.type}</h4>
                        <p className="text-sm text-charcoal/60">
                          {new Date(report.createdAt).toLocaleDateString()} • Created by {report.createdBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="font-semibold text-charcoal">{report.overallRating}</span>
                        </div>
                        <button
                          onClick={() => onDeleteReport(report.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-charcoal mb-3">Individual Ratings</h5>
                        <div className="space-y-2">
                          {Object.entries(report.ratings).map(([key, rating]) => {
                            const labels = {
                              punctuality: 'Punctuality & Attendance',
                              workQuality: 'Work Quality & Accuracy',
                              teamwork: 'Teamwork & Collaboration',
                              communication: 'Communication Skills',
                              customerService: 'Customer Service',
                              initiative: 'Initiative & Problem Solving'
                            }
                            return (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-sm text-charcoal">{labels[key]}</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="text-sm font-medium text-charcoal ml-1">{rating}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {report.strengths && (
                          <div>
                            <h5 className="font-medium text-charcoal mb-2">Strengths & Achievements</h5>
                            <p className="text-sm text-charcoal/80 bg-white p-3 rounded border">{report.strengths}</p>
                          </div>
                        )}

                        {report.areasForImprovement && (
                          <div>
                            <h5 className="font-medium text-charcoal mb-2">Areas for Improvement</h5>
                            <p className="text-sm text-charcoal/80 bg-white p-3 rounded border">{report.areasForImprovement}</p>
                          </div>
                        )}

                        {report.goals && (
                          <div>
                            <h5 className="font-medium text-charcoal mb-2">Goals & Action Items</h5>
                            <p className="text-sm text-charcoal/80 bg-white p-3 rounded border">{report.goals}</p>
                          </div>
                        )}

                        {report.notes && (
                          <div>
                            <h5 className="font-medium text-charcoal mb-2">Additional Notes</h5>
                            <p className="text-sm text-charcoal/80 bg-white p-3 rounded border">{report.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="space-y-4">
              {interactions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Interactions</h3>
                  <p className="text-gray-500">No feedback or interactions have been recorded for this employee yet.</p>
                </div>
              ) : (
                interactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((interaction) => (
                  <div key={interaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal/60">
                          {new Date(interaction.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => onDeleteInteraction(interaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Interaction"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-charcoal mb-2">{interaction.subject}</h4>
                    <p className="text-sm text-charcoal/80 mb-3">{interaction.message}</p>
                    
                    {interaction.followUpRequired && (
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <Clock className="w-3 h-3" />
                        <span>Follow-up required{interaction.followUpDate ? ` by ${new Date(interaction.followUpDate).toLocaleDateString()}` : ''}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceManagement
