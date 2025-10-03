import { useState, useEffect } from 'react'
import { AlertTriangle, Save, Edit, CheckCircle, Mail, Phone, MapPin, User, Clock } from 'lucide-react'
import employeeApiService from '../../services/employeeApiService'
import { useAuth } from '../../contexts/AuthContext'

const PersonalInfoSection = ({ employeeData, setEmployeeData }) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mailing_address: '',
    requested_hours: '',
    emergency_contact: '',
    emergency_phone: ''
  })

  useEffect(() => {
    if (employeeData) {
      // employeeData is the full profile response from API
      // employeeData.employee contains the EmployeeResource data
      const employee = employeeData.employee || employeeData
      const personalInfo = employeeData.personal_info || employee.personal_info || employee.profile_data?.personal_info || {}
      
      console.log('Employee data:', employeeData)
      console.log('Personal info:', personalInfo)
      
      setFormData({
        first_name: personalInfo.first_name || employee.first_name || '',
        last_name: personalInfo.last_name || employee.last_name || '',
        email: personalInfo.email || employee.email || '',
        phone: personalInfo.phone || employee.phone || '',
        mailing_address: personalInfo.mailing_address || '',
        requested_hours: personalInfo.requested_hours || '',
        emergency_contact: personalInfo.emergency_contact || '',
        emergency_phone: personalInfo.emergency_phone || ''
      })
    }
  }, [employeeData])

  const handleSave = async () => {
    setLoading(true)
    setSaveError('')
    setSaveSuccess(false)
    
    try {
      const response = await employeeApiService.updatePersonalInfo(formData)
      
      if (response.success) {
        // Reload the complete employee profile to get updated data
        try {
          const profileResponse = await employeeApiService.getEmployeeProfile()
          if (profileResponse.success) {
            setEmployeeData(profileResponse.data)
          }
        } catch (error) {
          console.error('Error reloading profile after update:', error)
        }
        
        setIsEditing(false)
        setSaveSuccess(true)
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } else {
        setSaveError(response.error || 'Failed to update personal information')
      }
    } catch (error) {
      console.error('Error updating personal info:', error)
      setSaveError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isComplete = formData.mailing_address && formData.requested_hours

  // Check if basic info is also complete for better validation
  const isBasicInfoComplete = formData.first_name && formData.last_name && formData.phone
  const isFullyComplete = isComplete && isBasicInfoComplete

  return (
    <div className="space-y-8">
      {/* Hero Section with Status */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gold/20 backdrop-blur-sm rounded-lg mobile-hide-header-icons">
              <User className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gold mb-1">Personal Information</h3>
              <p className="text-cream/80 text-sm mb-4 leading-relaxed">
                Keep your personal information up to date for payroll, emergency contacts, and scheduling preferences.
              </p>
              {!isComplete && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-200 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Complete required fields to continue</span>
                </div>
              )}
              {isComplete && !isEditing && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-200 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Information is complete and up to date</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Personal information updated successfully!</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{saveError}</p>
          </div>
        </div>
      )}

      {/* Personal Information Form */}
      <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg mobile-hide-header-icons">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              Edit Personal Details
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-brand-navy rounded-lg text-sm font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg mobile-hide-button-icons mobile-primary-button"
              >
                <Edit className="w-4 h-4" />
                <span className="mobile-desktop-text">Edit Information</span>
                <span className="mobile-short-text">Edit</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-charcoal rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium mobile-secondary-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-brand-navy rounded-lg text-sm font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg mobile-hide-button-icons mobile-primary-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-brand-navy/30 border-t-brand-navy rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="mobile-desktop-text">{loading ? 'Saving...' : 'Save Changes'}</span>
                  <span className="mobile-short-text">{loading ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mobile-grid">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-charcoal/70 border-b pb-2">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your first name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={true} // Email should not be editable
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact admin if needed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="+1234567890 or (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Required Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-charcoal/70 border-b pb-2">Required Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Mailing Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-charcoal/50" />
                <textarea
                  value={formData.mailing_address}
                  onChange={(e) => setFormData({ ...formData, mailing_address: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your complete mailing address"
                />
              </div>
              {!formData.mailing_address && (
                <p className="text-xs text-red-500 mt-1">This field is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Requested Hours Per Week *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="number"
                  value={formData.requested_hours}
                  onChange={(e) => setFormData({ ...formData, requested_hours: e.target.value })}
                  disabled={!isEditing}
                  min="1"
                  max="40"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter desired hours per week"
                />
              </div>
              {!formData.requested_hours && (
                <p className="text-xs text-red-500 mt-1">This field is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Emergency Contact Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Emergency contact full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Emergency Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoSection
