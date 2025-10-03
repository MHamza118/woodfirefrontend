import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowLeft, AlertCircle, CheckCircle, Hash, Users } from 'lucide-react'
import Logo from '../Logo'
import tableTrackingService from '../../services/tableTrackingService'
import notificationService from '../../services/notificationService'
import orderNotificationService from '../../services/orderNotificationService'

const SeatingPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tableNumber: '',
    orderNumber: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Table number validation
    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required'
    }

    // Order number validation
    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required'
    } else if (!tableTrackingService.isValidOrderNumber(formData.orderNumber)) {
      newErrors.orderNumber = 'Please enter a valid order number (numbers only)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate table number async
    const tableNumberValid = await tableTrackingService.isValidTableNumber(formData.tableNumber)
    if (!tableNumberValid) {
      setErrors({ tableNumber: 'Invalid table number. Please check the number displayed at your table' })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const tableNumber = formData.tableNumber.toUpperCase()
      const orderNumber = formData.orderNumber
      
      console.log('🚀 Starting order submission:', { tableNumber, orderNumber })
      
      // Submit table mapping via API - this handles everything
      const mapping = await tableTrackingService.submitTableMapping(
        tableNumber, 
        orderNumber, 
        'customer'
      )
      
      const area = mapping?.area || 'dining'
      console.log('✅ Table mapping created:', { tableNumber, orderNumber, area })
      
      // Notifications are handled automatically by the API
      console.log('✅ Notifications sent automatically by API')

      // Show success and navigate
      console.log('🎉 Order submission completed successfully!')

      // Navigate to success page
      navigate('/success', { 
        state: { 
          tableNumber: tableNumber,
          orderNumber: orderNumber 
        }
      })
    } catch (error) {
      console.error('❌ Order submission error:', error)
      setErrors({ 
        general: error.message || 'Something went wrong. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-gold/10 flex flex-col">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4 mobile-content-padding">
          <div className="flex items-center justify-center gap-3">
            <Logo size="sm" />
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-gold mobile-main-header">
                Seating Notification
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 mobile-content-padding">
        <div className="w-full max-w-lg space-y-8">
          
          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 mobile-seating-form">
            {/* Header Section with Back Arrow */}
            <div className="text-center space-y-4">
              <div className="relative mobile-seating-header">
                <button
                  onClick={() => navigate('/')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-charcoal transition-colors mobile-back-arrow"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-charcoal font-display mobile-seating-title">
                  Let us know where you are sitting
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed mobile-subtitle">
                We'll deliver your order directly to your table
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Unable to submit</p>
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Table Number Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-charcoal mobile-form-label">
                Table Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mobile-input-icon">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.tableNumber}
                  onChange={(e) => handleInputChange('tableNumber', e.target.value.toUpperCase())}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors mobile-form-input ${
                    errors.tableNumber 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-white hover:border-gold/30 focus:border-gold'
                  }`}
                  placeholder="Table 12"
                  disabled={isSubmitting}
                />
              </div>
              {errors.tableNumber && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.tableNumber}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Find this number displayed on your table (e.g., "12", "P3", "B1")
              </p>
            </div>

            {/* Order Number Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-charcoal mobile-form-label">
                Order Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mobile-input-icon">
                  <Hash className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors mobile-form-input ${
                    errors.orderNumber 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-white hover:border-gold/30 focus:border-gold'
                  }`}
                  placeholder="4837"
                  disabled={isSubmitting}
                />
              </div>
              {errors.orderNumber && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.orderNumber}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Found on your receipt from the counter (e.g., "#4837")
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.tableNumber || !formData.orderNumber}
              className="w-full bg-gold-gradient text-charcoal py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none mobile-submit-button"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit</span>
                </div>
              )}
            </button>
            </form>
            
            {/* Privacy Notice */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                No personal information required. We only use this to deliver your order.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20">
        <div className="max-w-4xl mx-auto px-6 py-4 mobile-content-padding">
          <div className="text-center">
            <p className="text-xs text-gray-500 mobile-footer-text">
              Woodfire.food • Secure Table Tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeatingPage
