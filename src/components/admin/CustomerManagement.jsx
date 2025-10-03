import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Trash2, Users, CheckCircle, AlertCircle, Clock, MapPin, Mail, Phone, Download, FileText } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { hasPermission, filterDataByLocation } from '../../utils/permissions'
import CustomerModal from './CustomerModal'
import CustomerDetailsModal from './CustomerDetailsModal'
import { filterCustomersByStatus, getAllCustomerStatuses, getCustomerTier } from '../../utils/customerUtils'
import adminApiService from '../../services/adminApiService'

const CustomerManagement = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [locations, setLocations] = useState([])
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [showExportModal, setShowExportModal] = useState(false)

  const currentUserType = user?.role || 'General User'
  const canCreateCustomers = hasPermission(currentUserType, 'customers', 'create')
  const canEditCustomers = hasPermission(currentUserType, 'customers', 'edit')
  const canDeleteCustomers = hasPermission(currentUserType, 'customers', 'delete')
  const canManageStatus = hasPermission(currentUserType, 'customers', 'manage_status')

  // Load data on component mount
  useEffect(() => {
    loadCustomers()
    loadLocations()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await adminApiService.getCustomers()
      
      if (response.success) {
        const customersData = response.customers || []
        setCustomers(customersData)
      } else {
        console.error('Failed to load customers:', response.error)
        alert('Failed to load customers: ' + (response.error || 'Unknown error'))
        setCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error.message || error)
      alert('Error loading customers: ' + (error.message || error))
      setCustomers([])
    }
  }

  const loadLocations = async () => {
    try {
      const response = await adminApiService.getLocations()
      if (response.success) {
        setLocations(response.locations || [])
      } else {
        console.error('Failed to load locations:', response.error)
        setLocations([])
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      setLocations([])
    }
  }

  const addCustomer = async (customerData) => {
    try {
      const response = await adminApiService.createCustomer(customerData)
      if (response.success) {
        // Reload customers to get the latest data
        await loadCustomers()
        setShowAddCustomer(false)
      } else {
        console.error('Failed to add customer:', response.error)
        alert('Failed to add customer: ' + response.error)
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Error adding customer: ' + error.message)
    }
  }

  const updateCustomer = async (customerId, customerData) => {
    try {
      const response = await adminApiService.updateCustomer(customerId, customerData)
      if (response.success) {
        // Reload customers to get the latest data
        await loadCustomers()
        setEditingCustomer(null)
        
        // Update viewing customer if it's the same one being edited
        if (viewingCustomer && viewingCustomer.id === customerId) {
          const updatedCustomer = await adminApiService.getCustomer(customerId)
          if (updatedCustomer.success) {
            setViewingCustomer(updatedCustomer.customer)
          }
        }
      } else {
        console.error('Failed to update customer:', response.error)
        alert('Failed to update customer: ' + response.error)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Error updating customer: ' + error.message)
    }
  }

  const deleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const response = await adminApiService.deleteCustomer(customerId)
        if (response.success) {
          // Reload customers to get the latest data
          await loadCustomers()
          
          // Close details modal if viewing the deleted customer
          if (viewingCustomer && viewingCustomer.id === customerId) {
            setViewingCustomer(null)
          }
        } else {
          console.error('Failed to delete customer:', response.error)
          alert('Failed to delete customer: ' + response.error)
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Error deleting customer: ' + error.message)
      }
    }
  }

  const changeCustomerStatus = async (customerId, newStatus) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      const customerData = {
        ...customer,
        status: newStatus
      }

      const response = await adminApiService.updateCustomer(customerId, customerData)
      if (response.success) {
        // Reload customers to get the latest data
        await loadCustomers()
        
        // Update viewing customer if it's the same one
        if (viewingCustomer && viewingCustomer.id === customerId) {
          const updatedCustomer = await adminApiService.getCustomer(customerId)
          if (updatedCustomer.success) {
            setViewingCustomer(updatedCustomer.customer)
          }
        }
      } else {
        console.error('Failed to change customer status:', response.error)
        alert('Failed to change customer status: ' + response.error)
      }
    } catch (error) {
      console.error('Error changing customer status:', error)
      alert('Error changing customer status: ' + error.message)
    }
  }

  const exportCustomerData = (format, includeFields, statusFilter = 'All', locationFilter = 'All') => {
    // Get filtered customers
    let customersToExport = customers.filter(customer => {
      const matchesStatus = statusFilter === 'All' || customer.status === statusFilter
      const matchesLocation = locationFilter === 'All' || 
                             customer.locations?.includes(locationFilter) ||
                             customer.homeLocation === locationFilter ||
                             (customer.location_details && customer.location_details.some(loc => loc.id === locationFilter)) ||
                             (customer.home_location && getLocationName(locationFilter) === customer.home_location)
      return matchesStatus && matchesLocation
    })

    // Apply location-based filtering for users with restricted access
    customersToExport = filterDataByLocation(customersToExport, currentUserType, user?.location)

    // Prepare export data
    const exportData = customersToExport.map(customer => {
      const tier = getCustomerTier(customer.loyaltyPoints)
      const baseData = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        loyaltyTier: tier.name,
        loyaltyPoints: customer.loyaltyPoints || 0,
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        homeLocation: getCustomerHomeLocationName(customer),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }

      // Filter fields based on selection
      if (includeFields && includeFields.length > 0) {
        const filteredData = {}
        includeFields.forEach(field => {
          if (baseData.hasOwnProperty(field)) {
            filteredData[field] = baseData[field]
          }
        })
        return filteredData
      }
      
      return baseData
    })

    // Export based on format
    if (format === 'csv') {
      exportToCSV(exportData, `customers-export-${new Date().toISOString().split('T')[0]}.csv`)
    } else if (format === 'json') {
      exportToJSON(exportData, `customers-export-${new Date().toISOString().split('T')[0]}.json`)
    }

    setShowExportModal(false)
  }

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No customer data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data, filename) => {
    if (data.length === 0) {
      alert('No customer data to export')
      return
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter customers based on search term, status, and location
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter
    
    const matchesLocation = locationFilter === 'All' || 
                           customer.locations?.includes(locationFilter) ||
                           customer.homeLocation === locationFilter ||
                           (customer.location_details && customer.location_details.some(loc => loc.id === locationFilter)) ||
                           (customer.home_location && getLocationName(locationFilter) === customer.home_location)
    
    return matchesSearch && matchesStatus && matchesLocation
  })

  // Apply location-based filtering for users with restricted access
  const accessibleCustomers = filterDataByLocation(filteredCustomers, currentUserType, user?.location)

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.name : 'Unknown Location'
  }

  const getCustomerHomeLocationName = (customer) => {
    // First try to get home location from the locations relationship (homeLocation ID)
    if (customer.homeLocation) {
      const location = locations.find(loc => loc.id === customer.homeLocation)
      if (location) return location.name
    }
    
    // Fallback to the home_location string field from the database
    if (customer.home_location && customer.home_location.trim()) {
      return customer.home_location
    }
    
    // If no home location is set, try to find it from location_details
    if (customer.location_details && customer.location_details.length > 0) {
      // Try to find a location marked as home
      const homeLocationDetail = customer.location_details.find(loc => {
        return loc.is_home === true || loc.is_home === 1 || loc.is_home === '1' ||
               loc.home === true || loc.home === 1 || loc.home === '1'
      })
      if (homeLocationDetail) return homeLocationDetail.name
      
      // If no home location found but location_details exists, use the first one as fallback
      return customer.location_details[0].name || 'Unknown Location'
    }
    
    return 'No Home Location'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return CheckCircle
      case 'INACTIVE': return AlertCircle
      case 'SUSPENDED': return Clock
      default: return AlertCircle
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100'
      case 'INACTIVE': return 'text-red-600 bg-red-100'
      case 'SUSPENDED': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCustomerStats = () => {
    const total = accessibleCustomers.length
    const active = accessibleCustomers.filter(c => c.status === 'ACTIVE').length
    const inactive = accessibleCustomers.filter(c => c.status === 'INACTIVE').length
    const suspended = accessibleCustomers.filter(c => c.status === 'SUSPENDED').length
    
    return { total, active, inactive, suspended }
  }

  const stats = getCustomerStats()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Customer Management</h2>
          <p className="text-gray-600">Manage customer accounts, status, and location access</p>
        </div>
        <div className="flex gap-3">
          {canCreateCustomers && (
            <button
              onClick={() => setShowAddCustomer(true)}
              className="bg-gold-gradient text-charcoal px-6 py-3 rounded-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gold-gradient text-charcoal px-6 py-3 rounded-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            title="Export Customer Data"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.suspended}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent appearance-none"
            >
              <option value="All">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {accessibleCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-6">
              {customers.length === 0 
                ? "Get started by adding your first customer."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {canCreateCustomers && customers.length === 0 && (
              <button
                onClick={() => setShowAddCustomer(true)}
                className="bg-gold-gradient text-charcoal px-6 py-3 rounded-md hover:shadow-lg transition-all font-medium"
              >
                Add Your First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto mobile-table-container">
            <table className="min-w-full divide-y divide-gray-200" style={{minWidth: '800px'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Home Location
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations Access
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accessibleCustomers.map((customer) => {
                  const StatusIcon = getStatusIcon(customer.status)
                  return (
                    <tr 
                      key={customer.id} 
                      onClick={() => setViewingCustomer(customer)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center hidden sm:flex">
                            <span className="text-xs sm:text-sm font-bold text-gold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-0 sm:ml-4 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">ID: {String(customer.id).slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900 flex items-center gap-1 truncate">
                          <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 truncate">
                          <Phone className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                      </td>
                      
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1 ${getStatusColor(customer.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {customer.status}
                        </span>
                      </td>
                      
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <span className="truncate block">{getCustomerHomeLocationName(customer)}</span>
                      </td>
                      
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {(customer.location_details?.length || customer.locations?.length || 0)} location{(customer.location_details?.length || customer.locations?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewingCustomer(customer)
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                          </button>
                          
                          {canEditCustomers && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingCustomer(customer)
                              }}
                              className="text-gold hover:text-gold-dark p-1 rounded hover:bg-gold/10"
                              title="Edit Customer"
                            >
                              <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                            </button>
                          )}
                          
                          {canDeleteCustomers && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteCustomer(customer.id)
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Creation/Edit Modal */}
      {(showAddCustomer || editingCustomer) && (
        <CustomerModal
          customer={editingCustomer}
          onSave={editingCustomer ? (data) => updateCustomer(editingCustomer.id, data) : addCustomer}
          onClose={() => {
            setShowAddCustomer(false)
            setEditingCustomer(null)
          }}
        />
      )}

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <CustomerDetailsModal
          customer={viewingCustomer}
          locations={locations}
          onClose={() => setViewingCustomer(null)}
          onEdit={(customer) => {
            setViewingCustomer(null)
            setEditingCustomer(customer)
          }}
          onStatusChange={canManageStatus ? changeCustomerStatus : undefined}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          totalCustomers={accessibleCustomers.length}
          locations={locations}
          onExport={exportCustomerData}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}

// Export Modal Component
const ExportModal = ({ totalCustomers, locations, onExport, onClose }) => {
  const [format, setFormat] = useState('csv')
  const [includeFields, setIncludeFields] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [selectAllFields, setSelectAllFields] = useState(true)

  const availableFields = [
    { key: 'id', label: 'Customer ID', default: true },
    { key: 'name', label: 'Name', default: true },
    { key: 'email', label: 'Email', default: true },
    { key: 'phone', label: 'Phone', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'loyaltyTier', label: 'Loyalty Tier', default: true },
    { key: 'loyaltyPoints', label: 'Loyalty Points', default: false },
    { key: 'totalOrders', label: 'Total Orders', default: false },
    { key: 'totalSpent', label: 'Total Spent', default: false },
    { key: 'homeLocation', label: 'Home Location', default: false },
    { key: 'createdAt', label: 'Created Date', default: false },
    { key: 'updatedAt', label: 'Updated Date', default: false }
  ]

  useEffect(() => {
    if (selectAllFields) {
      setIncludeFields(availableFields.map(field => field.key))
    } else {
      setIncludeFields(availableFields.filter(field => field.default).map(field => field.key))
    }
  }, [selectAllFields])

  const handleFieldToggle = (fieldKey) => {
    setIncludeFields(prev => {
      const newFields = prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
      
      // Update selectAllFields state based on current selection
      setSelectAllFields(newFields.length === availableFields.length)
      return newFields
    })
  }

  const handleExport = () => {
    if (includeFields.length === 0) {
      alert('Please select at least one field to export')
      return
    }
    onExport(format, includeFields, statusFilter, locationFilter)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Export Customer Data</h3>
            <p className="text-sm text-gray-600 mt-1">{totalCustomers} customers available for export</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FileText className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-charcoal">CSV</div>
                    <div className="text-sm text-gray-600">Excel compatible format</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-charcoal">JSON</div>
                    <div className="text-sm text-gray-600">Structured data format</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-3">
                Filters
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
                  >
                    <option value="All">All Locations</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fields Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-charcoal/70">
                  Fields to Include
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectAllFields}
                    onChange={(e) => setSelectAllFields(e.target.checked)}
                    className="mr-2"
                  />
                  Select All
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableFields.map(field => (
                  <label key={field.key} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={includeFields.includes(field.key)}
                      onChange={() => handleFieldToggle(field.key)}
                      className="mr-2"
                    />
                    {field.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {includeFields.length} of {availableFields.length} fields selected
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerManagement
