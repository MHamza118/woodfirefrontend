import { useState } from 'react'
import { X, Save, MapPin, Clock } from 'lucide-react'
import FloatingLabelInput from '../FloatingLabelInput'
import employeeApiService from '../../services/employeeApiService'

const PersonalInfoModal = ({ employeeData, onClose, onSave }) => {
  // Check multiple possible data structures from API
  const personalInfo = employeeData?.personal_info || employeeData?.employee?.personal_info || employeeData?.personalInfo || {}
  
  const [formData, setFormData] = useState({
    mailingAddress: personalInfo?.mailing_address || personalInfo?.mailingAddress || '',
    requestedHours: personalInfo?.requested_hours || personalInfo?.requestedHours || '',
    emergencyContact: personalInfo?.emergency_contact || personalInfo?.emergencyContact || '',
    emergencyPhone: personalInfo?.emergency_phone || personalInfo?.emergencyPhone || ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

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

    if (!formData.mailingAddress.trim()) {
      newErrors.mailingAddress = 'Mailing address is required'
    }

    if (!formData.requestedHours.trim()) {
      newErrors.requestedHours = 'Requested hours per week is required'
    } else if (isNaN(formData.requestedHours) || parseInt(formData.requestedHours) < 1 || parseInt(formData.requestedHours) > 60) {
      newErrors.requestedHours = 'Please enter a valid number between 1-60'
    }

    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency contact name is required'
    }

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)

    try {
      // Convert form data to API format
      const personalInfoUpdate = {
        mailing_address: formData.mailingAddress,
        requested_hours: formData.requestedHours,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone
      }

      // Update via API
      const response = await employeeApiService.updatePersonalInfo(personalInfoUpdate)
      
      if (response.success) {
        // Call parent callback with updated data
        onSave(response.employee)
        onClose()
      } else {
        console.error('Failed to update personal info:', response.error)
        alert('Failed to save personal information. Please try again.')
      }
    } catch (error) {
      console.error('Error saving personal info:', error)
      alert('Error saving personal information. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 mobile-modal-padding">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mobile-card">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 mobile-modal-header-container">
          <h3 className="text-xl font-semibold text-charcoal flex items-center gap-2 mobile-modal-header">
            <MapPin className="w-5 h-5 text-gold mobile-hide-header-icons" />
            Complete Personal Information
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 mobile-card-padding">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mobile-card-padding">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5 mobile-hide-header-icons" />
              <div>
                <h4 className="font-semibold text-orange-800 mobile-subsection-header">Required Information</h4>
                <p className="text-orange-700 text-sm mobile-subtitle">
                  Please complete all fields below to gain full access to your employee dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <FloatingLabelInput
              name="mailingAddress"
              value={formData.mailingAddress}
              onChange={handleChange}
              label="Mailing Address *"
              error={errors.mailingAddress}
              required
              placeholder="123 Main St, City, State, ZIP"
            />

            <FloatingLabelInput
              name="requestedHours"
              type="number"
              value={formData.requestedHours}
              onChange={handleChange}
              label="Requested Hours per Week *"
              error={errors.requestedHours}
              required
              min="1"
              max="60"
              placeholder="e.g., 25"
            />

            <FloatingLabelInput
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              label="Emergency Contact Name *"
              error={errors.emergencyContact}
              required
              placeholder="Full name of emergency contact"
            />

            <FloatingLabelInput
              name="emergencyPhone"
              type="tel"
              value={formData.emergencyPhone}
              onChange={handleChange}
              label="Emergency Contact Phone *"
              error={errors.emergencyPhone}
              required
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 mobile-button-container mobile-card-padding">
          <button
            onClick={onClose}
            className="px-4 py-2 text-charcoal bg-gray-100 hover:bg-gray-200 rounded-md transition-colors mobile-secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gold-gradient text-charcoal font-semibold rounded-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mobile-hide-button-icons mobile-primary-button"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></div>
                <span className="mobile-desktop-text">Saving...</span>
                <span className="mobile-short-text">Save</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="mobile-desktop-text">Save Information</span>
                <span className="mobile-short-text">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoModal
