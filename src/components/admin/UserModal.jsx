import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import FloatingLabelInput from '../FloatingLabelInput'

const UserModal = ({ user, locations, userTypes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: '',
    location: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        userType: user.userType || '',
        location: user.location || '',
        password: '' // Don't pre-fill password for editing
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.userType) {
      newErrors.userType = 'User type is required'
    }

    // Location is not required for owner user type (they can access all locations)
    if (!formData.location && formData.userType !== 'owner') {
      newErrors.location = 'Location is required'
    }

    // Password is required for new users, optional for editing
    if (!user && !formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Don't include password in update if it's empty (for editing)
    const dataToSave = { ...formData }
    // Normalize owner location to null (owner has all locations)
    if (dataToSave.userType === 'owner') {
      dataToSave.location = null
    }
    if (user && !formData.password) {
      delete dataToSave.password
    }

    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-charcoal">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FloatingLabelInput
            id="name"
            name="name"
            type="text"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <FloatingLabelInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-charcoal mb-1">
              User Type
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              required
            >
              <option value="">Select User Type</option>
              {userTypes.map(type => {
                const displayName = {
                  'owner': 'Owner',
                  'admin': 'Admin',
                  'manager': 'Manager', 
                  'hiring_manager': 'Hiring Manager',
                  'expo': 'Expo'
                }[type] || type
                return (
                  <option key={type} value={type}>{displayName}</option>
                )
              })}
            </select>
            {errors.userType && (
              <p className="mt-1 text-sm text-red-600">{errors.userType}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-charcoal mb-1">
              Location {formData.userType === 'owner' && <span className="text-gray-400 font-normal">(Owner can access all locations)</span>}
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              required={formData.userType !== 'owner'}
              disabled={formData.userType === 'owner'}
            >
              <option value="">{formData.userType === 'owner' ? 'All Locations' : 'Select Location'}</option>
              {console.log('Rendering locations in dropdown:', locations) || locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          <FloatingLabelInput
            id="password"
            name="password"
            type="password"
            label={user ? "New Password (leave blank to keep current)" : "Password"}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={!user}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-charcoal bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all"
            >
              {user ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal