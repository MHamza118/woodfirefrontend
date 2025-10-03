import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import FloatingLabelInput from '../FloatingLabelInput'

const LocationModal = ({ location, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    email: '',
    description: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || '',
        country: location.country || 'USA',
        phone: location.phone || '',
        email: location.email || '',
        description: location.description || ''
      })
    }
  }, [location])

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
      newErrors.name = 'Location name is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s()-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (international format with + supported)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSave(formData)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-charcoal">
            {location ? 'Edit Location' : 'Add New Location'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {/* Main Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <FloatingLabelInput
                  id="name"
                  name="name"
                  type="text"
                  label="Location Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <FloatingLabelInput
                  id="address"
                  name="address"
                  type="text"
                  label="Address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                />
              </div>

              <FloatingLabelInput
                id="city"
                name="city"
                type="text"
                label="City (Optional)"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
              />
              
              <FloatingLabelInput
                id="state"
                name="state"
                type="text"
                label="State (Optional)"
                value={formData.state}
                onChange={handleChange}
                error={errors.state}
              />

              <FloatingLabelInput
                id="zip_code"
                name="zip_code"
                type="text"
                label="ZIP Code (Optional)"
                value={formData.zip_code}
                onChange={handleChange}
                error={errors.zip_code}
              />
              
              <FloatingLabelInput
                id="country"
                name="country"
                type="text"
                label="Country"
                value={formData.country}
                onChange={handleChange}
                error={errors.country}
                required
              />

              <FloatingLabelInput
                id="phone"
                name="phone"
                type="tel"
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <FloatingLabelInput
                id="email"
                name="email"
                type="email"
                label="Email Address (Optional)"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-charcoal bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all font-medium"
          >
            {location ? 'Update Location' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationModal