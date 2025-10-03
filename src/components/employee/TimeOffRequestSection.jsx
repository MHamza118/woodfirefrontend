import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import timeOffApiService from '../../services/timeOffApiService'

const TimeOffRequestSection = ({ employeeData, setEmployeeData }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation',
    notes: ''
  })
  const [filterStatus, setFilterStatus] = useState('all')

  // Load time off requests from API
  useEffect(() => {
    loadRequests()
  }, [employeeData?.id])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus
      const resp = await timeOffApiService.getMyRequests(params)
      if (resp?.success) {
        const list = timeOffApiService.transformForEmployee(resp.data.requests || [])
        setRequests(list)
      } else {
        setError('Failed to load time off requests')
      }
    } catch (err) {
      setError(timeOffApiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      const payload = {
        start_date: formData.startDate,
        end_date: formData.endDate,
        type: formData.type,
        reason: formData.reason,
        notes: formData.notes || ''
      }
      const resp = await timeOffApiService.createRequest(payload)
      if (resp?.success) {
        const created = timeOffApiService.transformOneForEmployee(resp.data)
        setRequests(prev => [created, ...prev])
        setFormData({ startDate: '', endDate: '', reason: '', type: 'vacation', notes: '' })
        setShowRequestForm(false)
      } else {
        setError('Failed to submit time off request')
      }
    } catch (err) {
      setError(timeOffApiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      loadRequests()
    }, 300)
    return () => clearTimeout(t)
  }, [filterStatus])

  const filteredRequests = requests.filter(request => 
    filterStatus === 'all' || request.status === filterStatus
  )

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gold/20 backdrop-blur-sm rounded-lg mobile-hide-hero-icon">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Time Off Requests</h3>
              <p className="text-cream/80 text-sm mb-3 sm:mb-4 leading-relaxed">
                Submit and track your vacation and leave requests. Plan your time off and stay informed about approval status.
              </p>
              <button
                onClick={() => setShowRequestForm(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gold text-brand-navy rounded-lg text-sm font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-gray-600/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-gray-100">
            <h3 className="text-lg font-bold text-charcoal mb-4">Request Time Off</h3>
            
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Reason</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Brief reason for time off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border border-gray-300 text-charcoal rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold text-brand-navy px-6 py-2 rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2 font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
          <h3 className="text-lg font-semibold text-charcoal">Your Requests</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-charcoal/60 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 min-w-0"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="p-2 bg-yellow-100 rounded-lg mb-1 sm:mb-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-700">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="p-2 bg-green-100 rounded-lg mb-1 sm:mb-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-green-600 font-medium">Approved</p>
                <p className="text-lg sm:text-xl font-bold text-green-700">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="p-2 bg-blue-100 rounded-lg mb-1 sm:mb-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Days</p>
                <p className="text-lg sm:text-xl font-bold text-blue-700">
                  {requests.filter(r => r.status === 'approved').reduce((total, r) => 
                    total + calculateDays(r.startDate, r.endDate), 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-4 sm:p-8 text-center">
            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-charcoal/30 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-charcoal/70 mb-2">No requests found</h3>
            <p className="text-sm sm:text-base text-charcoal/50">
              {filterStatus === 'all' 
                ? "You haven't submitted any time off requests yet." 
                : `No ${filterStatus} requests found.`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-cream border-b border-gold/20">
                  <tr>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Dates</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Type</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Reason</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Days</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Status</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-charcoal text-sm">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <tr key={request.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}>
                      <td className="py-4 px-4 lg:px-6">
                        <div className="font-medium text-charcoal text-sm">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <span className="capitalize text-charcoal/80 text-sm">{request.type}</span>
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <div className="max-w-xs truncate text-charcoal/80 text-sm" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <span className="text-charcoal font-medium text-sm">
                          {calculateDays(request.startDate, request.endDate)}
                        </span>
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <span className="text-charcoal/60 text-sm">
                          {new Date(request.submittedDate).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="block sm:hidden">
              <div className="p-3 space-y-3">
                {filteredRequests.map((request, index) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                    {/* Status and Type Row */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className="text-xs text-charcoal/60 bg-gray-100 px-2 py-1 rounded-full capitalize font-medium">
                        {request.type}
                      </span>
                    </div>
                    
                    {/* Dates Row */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-charcoal/60 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-charcoal/60">
                          {calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Reason Row */}
                    <div className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-charcoal/60 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal/80 break-words">
                          {request.reason}
                        </p>
                        {request.notes && (
                          <p className="text-xs text-charcoal/60 mt-1 break-words">
                            {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Submitted Date Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Clock className="w-4 h-4 text-charcoal/60 flex-shrink-0" />
                      <span className="text-xs text-charcoal/60">
                        Submitted {new Date(request.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TimeOffRequestSection
