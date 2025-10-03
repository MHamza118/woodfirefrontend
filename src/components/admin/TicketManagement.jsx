import { useState, useEffect } from 'react'
import { Ticket, AlertTriangle, CheckCircle, Clock, User, MessageSquare, Wrench, Monitor, CreditCard, Utensils, Search, Filter, Eye, Edit, Trash2, Send, Calendar, ChevronDown, Tag, Plus, Archive } from 'lucide-react'
import ticketsApiService from '../../services/ticketsApiService'
import notificationService from '../../services/notificationService'

const TicketManagement = () => {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchivedTickets, setShowArchivedTickets] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const ticketCategories = [
    { id: 'broken-equipment', label: 'Broken Equipment', icon: Wrench, color: 'text-red-600' },
    { id: 'software-issue', label: 'Software Issue', icon: Monitor, color: 'text-blue-600' },
    { id: 'pos-problem', label: 'POS Problem', icon: CreditCard, color: 'text-purple-600' },
    { id: 'kitchen-equipment', label: 'Kitchen Equipment', icon: Utensils, color: 'text-orange-600' },
    { id: 'facility-issue', label: 'Facility Issue', icon: AlertTriangle, color: 'text-yellow-600' },
    { id: 'other', label: 'Other', icon: Tag, color: 'text-gray-600' }
  ]

  const priorityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
  ]

  const statusOptions = [
    { id: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
    { id: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    { id: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    { id: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
  ]

  useEffect(() => {
    loadTickets()
  }, [showArchivedTickets])

  useEffect(() => {
    if (searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all') {
      const delayedSearch = setTimeout(() => {
        loadTickets()
      }, 300)
      return () => clearTimeout(delayedSearch)
    }
  }, [searchTerm, filterStatus, filterCategory, filterPriority])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        archived: showArchivedTickets ? 'true' : 'false',
        status: filterStatus,
        category: filterCategory,
        priority: filterPriority,
        search: searchTerm
      }
      
      const response = await ticketsApiService.getTickets(filters)
      
      if (response.success) {
        const transformedTickets = ticketsApiService.transformTicketsForFrontend(response.data.tickets)
        setTickets(transformedTickets)
      } else {
        setError('Failed to load tickets')
      }
    } catch (err) {
      console.error('Error loading tickets:', err)
      setError(ticketsApiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const updateTicket = async (ticketId, updates) => {
    try {
      const response = await ticketsApiService.updateTicket(ticketId, updates)
      if (response.success) {
        const transformedTicket = ticketsApiService.transformTicketForFrontend(response.data)
        setTickets(tickets.map(ticket => 
          ticket.id === ticketId ? transformedTicket : ticket
        ))
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      setError(ticketsApiService.handleApiError(error))
    }
  }

  const archiveTicket = async (ticketId) => {
    try {
      const response = await ticketsApiService.archiveTicket(ticketId)
      if (response.success) {
        const ticket = tickets.find(t => t.id === ticketId)
        if (ticket) {
          notificationService.notifyTicketArchived(ticket.employeeId, ticket.title)
        }
        // Refresh tickets list
        loadTickets()
      }
    } catch (error) {
      console.error('Error archiving ticket:', error)
      setError(ticketsApiService.handleApiError(error))
    }
  }

  const deleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to permanently delete this ticket? This action cannot be undone.')) {
      try {
        const response = await ticketsApiService.deleteTicket(ticketId)
        if (response.success) {
          setTickets(tickets.filter(ticket => ticket.id !== ticketId))
        }
      } catch (error) {
        console.error('Error deleting ticket:', error)
        setError(ticketsApiService.handleApiError(error))
      }
    }
  }

  const getEmployeeName = (employeeId) => {
    // For API data, employee name should already be available in the ticket
    const ticket = tickets.find(t => t.employeeId === employeeId)
    if (ticket?.employeeName) {
      return ticket.employeeName
    }
    return 'Unknown Employee'
  }

  const getCategoryInfo = (categoryId) => {
    return ticketCategories.find(cat => cat.id === categoryId) || ticketCategories[ticketCategories.length - 1]
  }

  const getPriorityInfo = (priorityId) => {
    return priorityLevels.find(p => p.id === priorityId) || priorityLevels[1]
  }

  const getStatusInfo = (statusId) => {
    return statusOptions.find(s => s.id === statusId) || statusOptions[0]
  }

  const getFilteredTickets = () => {
    // Backend already handles filtering, so just return tickets as-is
    // The sorting is also handled by the backend
    return tickets
  }

  const getTicketStats = () => {
    const activeTickets = tickets.filter(t => !t.archived)
    return {
      total: activeTickets.length,
      open: activeTickets.filter(t => t.status === 'open').length,
      inProgress: activeTickets.filter(t => t.status === 'in-progress').length,
      resolved: activeTickets.filter(t => t.status === 'resolved').length,
      urgent: activeTickets.filter(t => t.priority === 'urgent').length,
      avgResponseTime: '2.3 hours' // This could be calculated from actual data
    }
  }

  const stats = getTicketStats()

  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-3 text-charcoal">Loading tickets...</span>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">Error: {error}</span>
          </div>
          <button 
            onClick={() => { setError(null); loadTickets(); }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">Total Tickets</p>
              <p className="text-xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">Open</p>
              <p className="text-xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">In Progress</p>
              <p className="text-xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">Resolved</p>
              <p className="text-xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">Urgent</p>
              <p className="text-xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-charcoal/70">Avg Response</p>
              <p className="text-sm font-bold text-charcoal">{stats.avgResponseTime}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets by employee, title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white text-sm"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white text-sm"
            >
              <option value="all">All Categories</option>
              {ticketCategories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent bg-white text-sm"
            >
              <option value="all">All Priorities</option>
              {priorityLevels.map(priority => (
                <option key={priority.id} value={priority.id}>{priority.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowArchivedTickets(!showArchivedTickets)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showArchivedTickets 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-gold-gradient text-charcoal hover:shadow-lg'
              } flex items-center gap-2`}
            >
              <Archive className="w-4 h-4" />
              {showArchivedTickets ? 'Show Active' : 'Show Archived'}
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-cream">Support Tickets</h3>
              <p className="text-sm text-cream/80">
                {showArchivedTickets ? 'Archived tickets' : 'Active support tickets from employees'}
              </p>
            </div>
            <div className="text-right text-cream/80">
              <p className="text-sm">
                Showing {getFilteredTickets().length} of {showArchivedTickets ? tickets.filter(t => t.archived).length : tickets.filter(t => !t.archived).length} tickets
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Priority</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Ticket</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Employee</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Category</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Created</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {getFilteredTickets().map((ticket) => {
                const categoryInfo = getCategoryInfo(ticket.category)
                const priorityInfo = getPriorityInfo(ticket.priority)
                const statusInfo = getStatusInfo(ticket.status)
                const CategoryIcon = categoryInfo.icon
                const StatusIcon = statusInfo.icon

                return (
                  <tr key={ticket.id} className="hover:bg-gold/5 transition-all duration-200">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 ${categoryInfo.color} hidden sm:block`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-charcoal line-clamp-1">
                            {ticket.title}
                          </div>
                          <div className="text-xs text-charcoal/70 line-clamp-2 mt-1">
                            {ticket.description}
                          </div>
                          {ticket.location && (
                            <div className="text-xs text-charcoal/50 mt-1">
                              📍 {ticket.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full items-center justify-center hidden sm:flex">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-charcoal">
                            {getEmployeeName(ticket.employeeId)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                        <CategoryIcon className={`w-3 h-3 ${categoryInfo.color} hidden sm:inline`} />
                        {categoryInfo.label}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={ticket.status}
                          onChange={(e) => {
                            updateTicket(ticket.id, { status: e.target.value })
                            // Notify employee of status change
                            notificationService.notifyTicketStatusUpdate(
                              ticket.employeeId,
                              ticket.title,
                              e.target.value
                            )
                          }}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-gold ${statusInfo.color}`}
                        >
                          {statusOptions.map(status => (
                            <option key={status.id} value={status.id}>{status.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-charcoal">
                      <div>
                        <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-charcoal/60">
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowTicketDetails(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowResponseModal(true)
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Send Response"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {!showArchivedTickets && (
                          <button
                            onClick={() => archiveTicket(ticket.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Archive Ticket"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {getFilteredTickets().length === 0 && (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchivedTickets ? 'No archived tickets' : 'No tickets found'}
              </h3>
              <p className="text-gray-500">
                {showArchivedTickets 
                  ? 'No tickets have been archived yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTicketDetails && selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          employee={employees.find(emp => emp.id === selectedTicket.employeeId)}
          onClose={() => {
            setShowTicketDetails(false)
            setSelectedTicket(null)
          }}
          onUpdateStatus={(status) => {
            updateTicket(selectedTicket.id, { status })
            notificationService.notifyTicketStatusUpdate(
              selectedTicket.employeeId,
              selectedTicket.title,
              status
            )
          }}
        />
      )}

      {showResponseModal && selectedTicket && (
        <TicketResponseModal
          ticket={selectedTicket}
          onClose={() => {
            setShowResponseModal(false)
            setSelectedTicket(null)
          }}
          onSendResponse={async (response) => {
            try {
              const responseData = {
                message: response.message,
                internal: response.internal || false,
                update_status: response.updateStatus || false,
                new_status: response.newStatus
              }

              const result = await ticketsApiService.addTicketResponse(selectedTicket.id, responseData)
              
              if (result.success) {
                // Refresh the ticket data
                loadTickets()
                
                if (!response.internal) {
                  notificationService.notifyTicketResponse(
                    selectedTicket.employeeId,
                    selectedTicket.title,
                    response.message
                  )
                }

                setShowResponseModal(false)
                setSelectedTicket(null)
              }
            } catch (error) {
              console.error('Error sending response:', error)
              setError(ticketsApiService.handleApiError(error))
            }
          }}
        />
      )}
    </div>
  )
}

// Ticket Details Modal
const TicketDetailsModal = ({ ticket, employee, onClose, onUpdateStatus }) => {
  const getCategoryInfo = (categoryId) => {
    const categories = [
      { id: 'broken-equipment', label: 'Broken Equipment', icon: Wrench, color: 'text-red-600' },
      { id: 'software-issue', label: 'Software Issue', icon: Monitor, color: 'text-blue-600' },
      { id: 'pos-problem', label: 'POS Problem', icon: CreditCard, color: 'text-purple-600' },
      { id: 'kitchen-equipment', label: 'Kitchen Equipment', icon: Utensils, color: 'text-orange-600' },
      { id: 'facility-issue', label: 'Facility Issue', icon: AlertTriangle, color: 'text-yellow-600' },
      { id: 'other', label: 'Other', icon: Tag, color: 'text-gray-600' }
    ]
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1]
  }

  const categoryInfo = getCategoryInfo(ticket.category)
  const CategoryIcon = categoryInfo.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-100 ${categoryInfo.color}`}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-charcoal">{ticket.title}</h3>
              <p className="text-sm text-charcoal/60">Ticket #{ticket.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="font-semibold text-charcoal mb-3">Description</h4>
                <p className="text-charcoal/80 bg-gray-50 p-4 rounded-lg">{ticket.description}</p>
              </div>

              {ticket.responses && ticket.responses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-charcoal mb-3">Response History</h4>
                  <div className="space-y-3">
                    {ticket.responses.map((response) => (
                      <div key={response.id} className={`p-4 rounded-lg ${response.internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-charcoal">
                            {response.respondedBy}
                            {response.internal && <span className="text-xs text-orange-600 ml-2">(Internal Note)</span>}
                          </span>
                          <span className="text-xs text-charcoal/60">
                            {new Date(response.respondedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-charcoal/80">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-charcoal mb-3">Employee Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-charcoal">
                      {employee?.personalInfo?.firstName || employee?.name || 'Unknown'} {employee?.personalInfo?.lastName || ''}
                    </span>
                  </div>
                  <div className="text-sm text-charcoal/70">{employee?.email}</div>
                  <div className="text-sm text-charcoal/70">{employee?.location?.name}</div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-charcoal mb-3">Ticket Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-charcoal/70">Category:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryIcon className={`w-4 h-4 ${categoryInfo.color}`} />
                      <span className="text-sm text-charcoal">{categoryInfo.label}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-charcoal/70">Priority:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-charcoal/70">Status:</span>
                    <select
                      value={ticket.status}
                      onChange={(e) => onUpdateStatus(e.target.value)}
                      className="block w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gold focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {ticket.location && (
                    <div>
                      <span className="text-sm font-medium text-charcoal/70">Location:</span>
                      <p className="text-sm text-charcoal mt-1">{ticket.location}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-charcoal/70">Created:</span>
                    <p className="text-sm text-charcoal mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                    <div>
                      <span className="text-sm font-medium text-charcoal/70">Last Updated:</span>
                      <p className="text-sm text-charcoal mt-1">
                        {new Date(ticket.updatedAt).toLocaleDateString()} at {new Date(ticket.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ticket Response Modal
const TicketResponseModal = ({ ticket, onClose, onSendResponse }) => {
  const [response, setResponse] = useState({
    message: '',
    internal: false,
    updateStatus: false,
    newStatus: 'in-progress'
  })

  const handleSend = () => {
    if (!response.message.trim()) {
      alert('Please enter a response message')
      return
    }
    onSendResponse(response)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-charcoal">
            Respond to: {ticket.title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-2">Response Message</label>
            <textarea
              value={response.message}
              onChange={(e) => setResponse({ ...response, message: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              placeholder="Type your response to the employee..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={response.internal}
                onChange={(e) => setResponse({ ...response, internal: e.target.checked })}
                className="w-4 h-4 text-gold focus:ring-gold rounded"
              />
              <span className="text-sm text-charcoal">Internal note (not sent to employee)</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={response.updateStatus}
                onChange={(e) => setResponse({ ...response, updateStatus: e.target.checked })}
                className="w-4 h-4 text-gold focus:ring-gold rounded"
              />
              <span className="text-sm text-charcoal">Update ticket status</span>
            </label>

            {response.updateStatus && (
              <select
                value={response.newStatus}
                onChange={(e) => setResponse({ ...response, newStatus: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              >
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
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
            onClick={handleSend}
            className="px-6 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Response
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketManagement
