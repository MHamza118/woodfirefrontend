import { useEffect, useState } from 'react'
import { Calendar, Filter, Search, CheckCircle, XCircle, AlertTriangle, Clock, User, Eye, X as CloseIcon, FileText } from 'lucide-react'
import timeOffApiService from '../../services/timeOffApiService'

const TimeOffManagement = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Modal state for viewing full reason/details
  const [viewOpen, setViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { loadRequests() }, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [status, type, search, dateRange.start, dateRange.end])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (status !== 'all') params.status = status
      if (type !== 'all') params.type = type
      if (search.trim()) params.search = search.trim()
      if (dateRange.start) params.start_date = dateRange.start
      if (dateRange.end) params.end_date = dateRange.end
      const resp = await timeOffApiService.getRequests(params)
      if (resp?.success) {
        // Admin resource includes employee info; reuse transform for shape
        const list = (resp.data.requests || []).map(item => ({
          id: item.id?.toString() || item.id,
          employeeId: item.employee?.id || item.employee_id,
          employeeName: item.employee?.name || item.employee_name || 'Employee',
          startDate: item.start_date,
          endDate: item.end_date,
          type: item.type,
          reason: item.reason,
          notes: item.notes,
          status: item.status,
          submittedAt: item.submitted_at,
          decidedAt: item.decided_at,
        }))
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

  const updateStatus = async (id, newStatus, decision_notes = '') => {
    try {
      setError(null)
      const resp = await timeOffApiService.updateStatus(id, { status: newStatus, decision_notes })
      if (resp?.success) {
        // Refresh list
        loadRequests()
      } else {
        setError('Failed to update status')
      }
    } catch (err) {
      setError(timeOffApiService.handleApiError(err))
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    const icons = {
      approved: <CheckCircle className="w-4 h-4" />, 
      rejected: <XCircle className="w-4 h-4" />, 
      pending: <AlertTriangle className="w-4 h-4" />, 
      cancelled: <Clock className="w-4 h-4" />
    }
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
        {icons[status] || icons.pending}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-charcoal">Time Off Requests</h3>
              <p className="text-sm text-charcoal/60">Review and manage employee time off requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-100">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Start date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm hidden sm:inline">to</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="End date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Submitted</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-center text-red-600" colSpan={7}>{error}</td></tr>
            ) : requests.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No time off requests found</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-gold/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center"><User className="w-4 h-4" /></div>
                      <div className="text-sm text-charcoal font-medium">{r.employeeName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm capitalize text-charcoal/80">{r.type}</td>
                  <td className="px-4 py-3 text-sm text-charcoal/80 max-w-xs whitespace-normal break-words" title={r.reason}>
                    {r.reason || '-'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-sm text-charcoal/60">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Only a View icon button; actions moved to modal */}
                      <button
                        type="button"
                        onClick={() => { setViewItem(r); setViewOpen(true) }}
                        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
                        title="View details"
                        aria-label="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Reason/Details Modal */}
      {viewOpen && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl border border-gray-200 mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-md"><FileText className="w-4 h-4 text-blue-600" /></div>
                <h4 className="text-charcoal font-semibold">Time Off Details</h4>
              </div>
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setViewOpen(false)} aria-label="Close">
                <CloseIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-charcoal/60">Employee</span><div className="font-medium">{viewItem.employeeName}</div></div>
                <div><span className="text-charcoal/60">Type</span><div className="font-medium capitalize">{viewItem.type}</div></div>
                <div><span className="text-charcoal/60">Dates</span><div className="font-medium">{new Date(viewItem.startDate).toLocaleDateString()} - {new Date(viewItem.endDate).toLocaleDateString()}</div></div>
                <div><span className="text-charcoal/60">Submitted</span><div className="font-medium">{viewItem.submittedAt ? new Date(viewItem.submittedAt).toLocaleString() : '-'}</div></div>
                <div className="sm:col-span-2"><span className="text-charcoal/60">Status</span><div className="mt-1">{getStatusBadge(viewItem.status)}</div></div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-charcoal mb-1">Reason</h5>
                <textarea
                  readOnly
                  rows={6}
                  className="w-full text-sm text-charcoal/90 bg-gray-50 border border-gray-200 rounded-md p-3 resize-y"
                  value={viewItem.reason || ''}
                />
              </div>

              <div>
                <h5 className="text-sm font-semibold text-charcoal mb-1">Additional Notes</h5>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full text-sm text-charcoal/90 bg-gray-50 border border-gray-200 rounded-md p-3 resize-y"
                  value={viewItem.notes || ''}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => setViewOpen(false)}>Close</button>
              {viewItem.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { updateStatus(viewItem.id, 'approved'); setViewOpen(false) }} className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Approve</button>
                  <button onClick={() => { updateStatus(viewItem.id, 'rejected'); setViewOpen(false) }} className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeOffManagement
