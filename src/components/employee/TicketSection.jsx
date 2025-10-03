import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Ticket, Plus, Wrench, Monitor, CreditCard, Utensils, AlertTriangle, Tag, Clock, CheckCircle, MessageSquare, Calendar, Filter, Search, Eye, X } from 'lucide-react'
import notificationService from '../../services/notificationService'
import ticketsApiService from '../../services/ticketsApiService'

const TicketSection = ({ employeeData }) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const ticketCategories = [
    { 
      id: 'broken-equipment', 
      label: 'Broken Equipment', 
      icon: Wrench, 
      color: 'text-red-600',
      description: 'Broken or malfunctioning restaurant equipment',
      examples: ['Broken chairs/tables', 'Faulty lighting', 'Broken dishware', 'Damaged cleaning equipment']
    },
    { 
      id: 'software-issue', 
      label: 'Software Issue', 
      icon: Monitor, 
      color: 'text-blue-600',
      description: 'Problems with software or digital systems',
      examples: ['Login issues', 'System crashes', 'App not working', 'Website problems']
    },
    { 
      id: 'pos-problem', 
      label: 'POS Problem', 
      icon: CreditCard, 
      color: 'text-purple-600',
      description: 'Issues with the Point of Sale system',
      examples: ['POS not responding', 'Payment processing issues', 'Receipt printer problems', 'Card reader not working']
    },
    { 
      id: 'kitchen-equipment', 
      label: 'Kitchen Equipment', 
      icon: Utensils, 
      color: 'text-orange-600',
      description: 'Kitchen appliances and equipment problems',
      examples: ['Oven not heating', 'Refrigerator issues', 'Broken utensils', 'Dishwasher problems']
    },
    { 
      id: 'facility-issue', 
      label: 'Facility Issue', 
      icon: AlertTriangle, 
      color: 'text-yellow-600',
      description: 'Building and facility maintenance issues',
      examples: ['HVAC problems', 'Plumbing issues', 'Electrical problems', 'Structural damage']
    },
    { 
      id: 'other', 
      label: 'Other', 
      icon: Tag, 
      color: 'text-gray-600',
      description: 'Any other issues not covered above',
      examples: ['Safety concerns', 'Supply shortages', 'General maintenance', 'Other concerns']
    }
  ]

  const priorityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-100 text-green-700', description: 'Minor issue, can wait' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700', description: 'Moderate issue, needs attention' },
    { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700', description: 'Important issue, affects operations' },
    { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', description: 'Critical issue, immediate attention needed' }
  ]

  const statusOptions = [
    { id: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
    { id: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    { id: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    { id: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
  ]

  useEffect(() => {
    loadTickets()
  }, [employeeData])

  // Reload when status or search changes (debounced for search)
  useEffect(() => {
    const handle = setTimeout(() => {
      loadTickets()
    }, searchTerm ? 300 : 0)
    return () => clearTimeout(handle)
  }, [filterStatus, searchTerm])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch employee tickets from API
      const params = { status: filterStatus }
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim()
      const response = await ticketsApiService.getEmployeeTickets(params)
      if (response?.success) {
        const transformed = ticketsApiService.transformTicketsForFrontend(response.data.tickets || [])
        setTickets(transformed)
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
    let filtered = tickets.filter(ticket => !ticket.archived)

    if (searchTerm.trim()) {
      filtered = filtered.filter(ticket => {
        const title = (ticket.title || '').toLowerCase()
        const description = (ticket.description || '').toLowerCase()
        const category = getCategoryInfo(ticket.category).label.toLowerCase()
        
        return title.includes(searchTerm.toLowerCase()) ||
               description.includes(searchTerm.toLowerCase()) ||
               category.includes(searchTerm.toLowerCase())
      })
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus)
    }

    return filtered.sort((a, b) => {
      // Sort by priority first (urgent first), then by creation date (newest first)
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  const getTicketStats = () => {
    const activeTickets = tickets.filter(t => !t.archived)
    return {
      total: activeTickets.length,
      open: activeTickets.filter(t => t.status === 'open').length,
      inProgress: activeTickets.filter(t => t.status === 'in-progress').length,
      resolved: activeTickets.filter(t => t.status === 'resolved').length,
      urgent: activeTickets.filter(t => t.priority === 'urgent').length
    }
  }

  const submitTicket = async (ticketData) => {
    try {
      setError(null)
      setLoading(true)
      // Create ticket via API
      const response = await ticketsApiService.createTicket(ticketData)
      if (response?.success) {
        const created = ticketsApiService.transformTicketForFrontend(response.data)
        setTickets((prev) => [created, ...prev])
        // Notify admin
        notificationService.notifyNewTicket(created)
        setShowNewTicketModal(false)
      } else {
        setError('Failed to create ticket')
      }
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError(ticketsApiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const stats = getTicketStats()

  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-8">
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
      <div className="space-y-4 sm:space-y-8">
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
    <div className="space-y-4 sm:space-y-8">
      {/* Hero Section */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden xs:block p-2 sm:p-3 bg-gold/20 backdrop-blur-sm rounded-lg">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Support Tickets</h3>
                <p className="text-cream/80 text-xs sm:text-sm mb-4 leading-relaxed">
                  Report broken equipment, software issues, POS problems, or any other concerns. 
                  Management will be notified and will work to resolve your issues quickly.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-gold/90 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <Ticket className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{stats.total} tickets</span>
              </div>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-brand-navy rounded-lg text-sm font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-charcoal/70">Total</p>
                <p className="text-lg sm:text-xl font-bold text-charcoal">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-charcoal/70">Open</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-charcoal/70">In Progress</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-charcoal/70">Resolved</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-100 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-charcoal/70">Urgent</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
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
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-cream">My Support Tickets</h3>
              <p className="text-xs sm:text-sm text-cream/80">Track and manage your submitted support requests</p>
            </div>
            {tickets.length === 0 && (
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="bg-gold text-brand-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Submit First Ticket
              </button>
            )}
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-4">No Tickets Yet</h3>
            <p className="text-charcoal/70 mb-6 leading-relaxed max-w-md mx-auto">
              When you encounter broken equipment, software issues, or other problems, 
              submit a support ticket and management will help resolve it quickly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              {ticketCategories.slice(0, 6).map(category => {
                const CategoryIcon = category.icon
                return (
                  <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-white ${category.color}`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-charcoal text-sm">{category.label}</h4>
                    </div>
                    <p className="text-xs text-charcoal/70">{category.description}</p>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowNewTicketModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-charcoal rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Submit Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {getFilteredTickets().map((ticket) => {
              const categoryInfo = getCategoryInfo(ticket.category)
              const priorityInfo = getPriorityInfo(ticket.priority)
              const statusInfo = getStatusInfo(ticket.status)
              const CategoryIcon = categoryInfo.icon

              return (
                <div key={ticket.id} className="p-4 sm:p-6 hover:bg-gold/5 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg bg-gray-100 ${categoryInfo.color} flex-shrink-0 hidden sm:block`}>
                      <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-charcoal text-base sm:text-lg truncate">{ticket.title}</h4>
                          <p className="text-xs sm:text-sm text-charcoal/60 truncate">
                            Ticket #{ticket.id.slice(-8).toUpperCase()} • {categoryInfo.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-charcoal/80 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-charcoal/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                          {ticket.location && (
                            <div className="flex items-center gap-1">
                              <span>📍</span>
                              <span className="truncate">{ticket.location}</span>
                            </div>
                          )}
                          {ticket.responses && ticket.responses.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{ticket.responses.filter(r => !r.internal).length} responses</span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowTicketDetails(true)
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-all w-full sm:w-auto justify-center"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {getFilteredTickets().length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewTicketModal && (
        <NewTicketModal
          categories={ticketCategories}
          priorityLevels={priorityLevels}
          employeeData={employeeData}
          onClose={() => setShowNewTicketModal(false)}
          onSubmit={submitTicket}
        />
      )}

      {showTicketDetails && selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          categoryInfo={getCategoryInfo(selectedTicket.category)}
          onClose={() => {
            setShowTicketDetails(false)
            setSelectedTicket(null)
          }}
        />
      )}
    </div>
  )
}

// New Ticket Modal
const NewTicketModal = ({ categories, priorityLevels, employeeData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    title: '',
    description: '',
    location: ''
  })

  const [selectedCategory, setSelectedCategory] = useState(null)

  const handleSubmit = () => {
    if (!formData.category || !formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields')
      return
    }
    onSubmit(formData)
  }

  const handleCategorySelect = (categoryId) => {
    setFormData({ ...formData, category: categoryId })
    setSelectedCategory(categories.find(cat => cat.id === categoryId))
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-charcoal">Submit Support Ticket</h3>
            <p className="text-xs sm:text-sm text-charcoal/60 mt-1 hidden sm:block">Fill out the form to report an issue</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2 sm:mb-3">Issue Category *</label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {categories.map(category => {
                  const CategoryIcon = category.icon
                  const isSelected = formData.category === category.id
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-gold bg-gold/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <CategoryIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${category.color}`} />
                        <span className="font-semibold text-charcoal text-sm sm:text-base">{category.label}</span>
                      </div>
                      <p className="text-xs text-charcoal/70">{category.description}</p>
                    </button>
                  )
                })}
              </div>
              
              {selectedCategory && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Common examples:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategory.examples.map((example, index) => (
                      <span key={index} className="text-xs bg-white px-2 py-1 rounded text-blue-700 border border-blue-200">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2 sm:mb-3">Priority Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {priorityLevels.map(priority => (
                  <button
                    key={priority.id}
                    onClick={() => setFormData({ ...formData, priority: priority.id })}
                    className={`p-2 sm:p-3 rounded-lg border-2 text-left transition-all ${
                      formData.priority === priority.id
                        ? 'border-gold bg-gold/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 sm:mb-2 ${priority.color}`}>
                      {priority.label}
                    </span>
                    <p className="text-xs text-charcoal/70">{priority.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Issue Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Detailed Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about the issue, including what happened, when it occurred, and any steps you've already taken..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Location (Optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Specific location (e.g., 'Kitchen prep area', 'Front register #2')"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-lg hover:bg-gray-300 transition-colors text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 sm:px-6 py-2 bg-gold-gradient text-charcoal rounded-lg hover:shadow-lg transition-all flex items-center gap-2 justify-center text-sm font-medium order-1 sm:order-2"
          >
            <Ticket className="w-4 h-4" />
            Submit Ticket
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Ticket Details Modal
const TicketDetailsModal = ({ ticket, categoryInfo, onClose }) => {
  const CategoryIcon = categoryInfo.icon

  const getStatusInfo = (statusId) => {
    const statusOptions = [
      { id: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700' },
      { id: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
      { id: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700' }
    ]
    return statusOptions.find(s => s.id === statusId) || statusOptions[0]
  }

  const getPriorityInfo = (priorityId) => {
    const priorityLevels = [
      { id: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
      { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
      { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
    ]
    return priorityLevels.find(p => p.id === priorityId) || priorityLevels[1]
  }

  const statusInfo = getStatusInfo(ticket.status)
  const priorityInfo = getPriorityInfo(ticket.priority)

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-lg bg-gray-100 ${categoryInfo.color} flex-shrink-0 hidden sm:block`}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-charcoal truncate">{ticket.title}</h3>
              <p className="text-xs sm:text-sm text-charcoal/60">Ticket #{ticket.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Ticket Information - Mobile First */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h4 className="font-semibold text-charcoal mb-3 text-sm sm:text-base">Ticket Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-charcoal/70">Category:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${categoryInfo.color} hidden sm:inline`} />
                    <span className="text-xs sm:text-sm text-charcoal">{categoryInfo.label}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs sm:text-sm font-medium text-charcoal/70">Priority:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>

                <div>
                  <span className="text-xs sm:text-sm font-medium text-charcoal/70">Status:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <span className="text-xs sm:text-sm font-medium text-charcoal/70">Submitted:</span>
                  <p className="text-xs sm:text-sm text-charcoal mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {ticket.location && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-xs sm:text-sm font-medium text-charcoal/70">Location:</span>
                    <p className="text-xs sm:text-sm text-charcoal mt-1">{ticket.location}</p>
                  </div>
                )}

                {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-xs sm:text-sm font-medium text-charcoal/70">Last Updated:</span>
                    <p className="text-xs sm:text-sm text-charcoal mt-1">
                      {new Date(ticket.updatedAt).toLocaleDateString()} at {new Date(ticket.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-charcoal mb-3 text-sm sm:text-base">Description</h4>
              <p className="text-charcoal/80 bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm leading-relaxed">{ticket.description}</p>
            </div>

            {/* Status Alert */}
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Ticket Resolved</h4>
                </div>
                <p className="text-xs sm:text-sm text-green-700">
                  This issue has been addressed by management. If you're still experiencing problems, 
                  please submit a new ticket.
                </p>
              </div>
            )}

            {/* Management Responses */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div>
                <h4 className="font-semibold text-charcoal mb-3 text-sm sm:text-base">Management Responses</h4>
                <div className="space-y-3">
                  {ticket.responses
                    .filter(response => !response.internal) // Only show non-internal responses to employee
                    .map((response) => (
                      <div key={response.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 mb-2">
                          <span className="font-medium text-charcoal text-xs sm:text-sm">{response.respondedBy}</span>
                          <span className="text-xs text-charcoal/60">
                            {new Date(response.respondedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-charcoal/80 text-xs sm:text-sm leading-relaxed">{response.message}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TicketSection
