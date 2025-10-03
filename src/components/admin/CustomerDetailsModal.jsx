import { useState } from 'react'
import { X, User, Mail, Phone, MapPin, Calendar, Edit, ToggleLeft, ToggleRight, MessageCircle, ShoppingBag, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const CustomerDetailsModal = ({ customer, locations, onClose, onEdit, onStatusChange }) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState(customer.status)

  if (!customer) return null

  // Get location names for customer's locations
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.name : 'Unknown Location'
  }

  const getLocationAddress = (locationId) => {
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.address : 'Address not found'
  }

  const getHomeLocation = () => {
    const homeLocation = locations.find(loc => loc.id === customer.homeLocation)
    return homeLocation || null
  }

  const getCustomerHomeLocationName = (customer) => {
    // First try to get home location from the locations relationship (homeLocation ID)
    if (customer.homeLocation) {
      const location = locations.find(loc => loc.id === customer.homeLocation)
      if (location) return location.name
    }
    
    // Fallback to the home_location string field from the database
    if (customer.home_location) {
      return customer.home_location
    }
    
    // If no home location is set, try to find it from location_details
    if (customer.location_details && customer.location_details.length > 0) {
      const homeLocationDetail = customer.location_details.find(loc => loc.is_home)
      if (homeLocationDetail) return homeLocationDetail.name
    }
    
    return 'No Home Location'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100'
      case 'INACTIVE':
        return 'text-red-600 bg-red-100'
      case 'SUSPENDED':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle
      case 'INACTIVE':
        return AlertCircle
      case 'SUSPENDED':
        return Clock
      default:
        return AlertCircle
    }
  }

  const handleStatusChange = () => {
    if (newStatus !== customer.status) {
      onStatusChange(customer.id, newStatus)
    }
    setIsChangingStatus(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatusIcon = getStatusIcon(customer.status)
  const homeLocation = getHomeLocation()

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gold/10 to-gold/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center hidden sm:flex">
              <User className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusIcon className={`w-4 h-4`} />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="p-2 bg-gold/10 hover:bg-gold/20 rounded-lg transition-colors"
              title="Edit Customer"
            >
              <Edit className="w-5 h-5 text-gold" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gold" />
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-charcoal">{customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-charcoal">{customer.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Customer Since</p>
                    <p className="font-medium text-charcoal">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" />
                Location Access
              </h3>
              
              {/* Home Location */}
              {(homeLocation || getCustomerHomeLocationName(customer) !== 'No Home Location') && (
                <div className="mb-4 p-3 bg-gold/10 rounded-lg border-l-4 border-gold">
                  <p className="text-sm text-gold-dark font-medium mb-1">Home Location</p>
                  <p className="font-semibold text-charcoal">
                    {homeLocation ? homeLocation.name : getCustomerHomeLocationName(customer)}
                  </p>
                  {homeLocation && homeLocation.address && (
                    <p className="text-sm text-gray-600">{homeLocation.address}</p>
                  )}
                </div>
              )}

              {/* All Accessible Locations */}
              <div>
                {/* Show count from location_details if available, otherwise use locations array */}
                <p className="text-sm text-gray-600 mb-2">
                  Accessible Locations ({customer.location_details?.length || customer.locations?.length || 0})
                </p>
                <div className="space-y-2">
                  {/* Use location_details if available (more detailed), otherwise fallback to locations array */}
                  {customer.location_details?.length > 0 ? (
                    customer.location_details.map(locationDetail => {
                      const isHome = locationDetail.is_home
                      return (
                        <div 
                          key={locationDetail.id} 
                          className={`p-2 rounded border ${isHome ? 'bg-gold/5 border-gold/20' : 'bg-white border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-charcoal">{locationDetail.name}</p>
                              {locationDetail.address && (
                                <p className="text-xs text-gray-500">{locationDetail.address}</p>
                              )}
                            </div>
                            {isHome && (
                              <span className="text-xs bg-gold text-charcoal px-2 py-1 rounded">
                                HOME
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    customer.locations?.map(locationId => {
                      const isHome = locationId === customer.homeLocation
                      return (
                        <div 
                          key={locationId} 
                          className={`p-2 rounded border ${isHome ? 'bg-gold/5 border-gold/20' : 'bg-white border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-charcoal">{getLocationName(locationId)}</p>
                              <p className="text-xs text-gray-500">{getLocationAddress(locationId)}</p>
                            </div>
                            {isHome && (
                              <span className="text-xs bg-gold text-charcoal px-2 py-1 rounded">
                                HOME
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <ToggleRight className="w-5 h-5 text-gold" />
                Status Management
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-charcoal">Current Status</p>
                    <p className="text-sm text-gray-600">
                      {customer.status === 'ACTIVE' && 'Customer receives all communications and can access services'}
                      {customer.status === 'INACTIVE' && 'Customer does not receive communications or access services'}
                      {customer.status === 'SUSPENDED' && 'Customer account is temporarily suspended'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsChangingStatus(true)}
                    className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all text-sm font-medium"
                  >
                    Change Status
                  </button>
                  {customer.status !== 'ACTIVE' && (
                    <button
                      onClick={() => onStatusChange(customer.id, 'ACTIVE')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      Reactivate
                    </button>
                  )}
                </div>

                {/* Status Change Modal */}
                {isChangingStatus && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setIsChangingStatus(false)
                        setNewStatus(customer.status)
                      }
                    }}
                  >
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h4 className="text-lg font-semibold text-charcoal mb-4">Change Customer Status</h4>
                      
                      <div className="space-y-3 mb-4">
                        {[
                          { value: 'ACTIVE', label: 'Active', desc: 'Customer receives communications and can access services' },
                          { value: 'INACTIVE', label: 'Inactive', desc: 'Customer will not receive any communications' },
                          { value: 'SUSPENDED', label: 'Suspended', desc: 'Customer account is temporarily suspended' }
                        ].map(statusOption => (
                          <label key={statusOption.value} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              value={statusOption.value}
                              checked={newStatus === statusOption.value}
                              onChange={(e) => setNewStatus(e.target.value)}
                              className="w-4 h-4 text-gold focus:ring-gold"
                            />
                            <div>
                              <span className="font-medium text-charcoal">{statusOption.label}</span>
                              <p className="text-sm text-gray-600">{statusOption.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setIsChangingStatus(false)
                            setNewStatus(customer.status)
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleStatusChange}
                          className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all font-medium"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Features */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold" />
                Available Features
              </h3>
              
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg ${customer.status === 'ACTIVE' ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <MessageCircle className={`w-4 h-4 ${customer.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${customer.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>
                      Communications
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${customer.status === 'ACTIVE' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {customer.status === 'ACTIVE' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${customer.status === 'ACTIVE' ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className={`w-4 h-4 ${customer.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${customer.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>
                      Table Registration & Ordering
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${customer.status === 'ACTIVE' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {customer.status === 'ACTIVE' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      Loyalty Program
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-yellow-200 text-yellow-800">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {customer.notes && (
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Additional Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Customer ID: {customer.id} | Created: {formatDate(customer.createdAt)} at {formatTime(customer.createdAt)}
            {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
              <> | Last Updated: {formatDate(customer.updatedAt)} at {formatTime(customer.updatedAt)}</>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-charcoal text-cream rounded-md hover:bg-charcoal/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetailsModal
