import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import LocationModal from './LocationModal'
import adminApiService from '../../services/adminApiService'

const LocationManagement = ({ locations, setLocations }) => {
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load locations from API on mount
  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    setLoading(true)
    try {
      const result = await adminApiService.getLocations()
      if (result.success) {
        setLocations(result.locations)
      } else {
        console.error('Error loading locations:', result.error)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLocation = async (locationData) => {
    try {
      const result = await adminApiService.createLocation(locationData)
      if (result.success) {
        setLocations([...locations, result.location])
        setShowAddLocation(false)
        alert('Location added successfully!')
      } else {
        alert(`Failed to add location: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding location:', error)
      alert(`Error adding location: ${error.message}`)
    }
  }

  const updateLocation = async (locationId, locationData) => {
    try {
      const result = await adminApiService.updateLocation(locationId, locationData)
      if (result.success) {
        const updatedLocations = locations.map(location => 
          location.id === locationId ? result.location : location
        )
        setLocations(updatedLocations)
        setEditingLocation(null)
        alert('Location updated successfully!')
      } else {
        alert(`Failed to update location: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating location:', error)
      alert(`Error updating location: ${error.message}`)
    }
  }

  const toggleLocationStatus = async (locationId) => {
    const location = locations.find(loc => loc.id === locationId)
    if (!location) return

    try {
      const result = await adminApiService.updateLocation(locationId, {
        ...location,
        active: !location.active
      })
      if (result.success) {
        const updatedLocations = locations.map(loc => 
          loc.id === locationId ? { ...loc, active: !loc.active } : loc
        )
        setLocations(updatedLocations)
        alert(`Location ${!location.active ? 'activated' : 'deactivated'} successfully!`)
      } else {
        alert(`Failed to update location: ${result.error}`)
      }
    } catch (error) {
      console.error('Error toggling location status:', error)
      alert(`Error updating location: ${error.message}`)
    }
  }

  const deleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      try {
        const result = await adminApiService.deleteLocation(locationId)
        if (result.success) {
          const updatedLocations = locations.filter(location => location.id !== locationId)
          setLocations(updatedLocations)
          alert('Location deleted successfully!')
        } else {
          alert(`Failed to delete location: ${result.error}`)
        }
      } catch (error) {
        console.error('Error deleting location:', error)
        alert(`Error deleting location: ${error.message}`)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-charcoal">Location Management</h2>
        <button
          onClick={() => setShowAddLocation(true)}
          className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${location.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MapPin className={`w-5 h-5 ${location.active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">{location.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    location.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {location.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingLocation(location)}
                  className="text-gold hover:text-gold-dark"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLocation(location.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-charcoal/70">
                <strong>Address:</strong> {location.address}
              </p>
              {location.phone && (
                <p className="text-sm text-charcoal/70">
                  <strong>Phone:</strong> {location.phone}
                </p>
              )}
              {location.email && (
                <p className="text-sm text-charcoal/70">
                  <strong>Email:</strong> {location.email}
                </p>
              )}
            </div>

            <button
              onClick={() => toggleLocationStatus(location.id)}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                location.active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {location.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first location.</p>
          <button
            onClick={() => setShowAddLocation(true)}
            className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all"
          >
            Add Location
          </button>
        </div>
      )}

      {/* Add/Edit Location Modal */}
      {(showAddLocation || editingLocation) && (
        <LocationModal
          location={editingLocation}
          onSave={editingLocation ? (data) => updateLocation(editingLocation.id, data) : addLocation}
          onClose={() => {
            setShowAddLocation(false)
            setEditingLocation(null)
          }}
        />
      )}
    </div>
  )
}

export default LocationManagement