import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FloatingLabelInput from '../FloatingLabelInput'
import { ArrowLeft, Gift, Star, Clock, MapPin, Plus, X, Home } from 'lucide-react'
import Logo from '../Logo'

const CustomerSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    locations: [{ name: '', isHome: true }], // Array to handle multiple locations
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { customerSignup } = useAuth()
  const navigate = useNavigate()

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

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { name: '', isHome: false }]
    }))
  }

  const removeLocation = (index) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== index)
      }))
    }
  }

  const updateLocation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, [field]: value } : loc
      )
    }))
  }

  const setHomeLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        ({ ...loc, isHome: i === index })
      )
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\+]?[1-9][\d]{0,14}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate locations
    const hasValidLocation = formData.locations.some(loc => loc.name.trim())
    if (!hasValidLocation) {
      newErrors.locations = 'At least one location is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    // Call customer signup API
    const result = await customerSignup({
      ...formData,
      password_confirmation: formData.confirmPassword
    })
    
    if (result.success) {
      navigate('/customer/dashboard')
    } else {
      setErrors({ general: result.error })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-gold/10 flex flex-col">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 xs:px-6 py-3 xs:py-4">
          <div className="flex items-center justify-center gap-2 xs:gap-3">
            <Logo size="sm" />
            <div className="text-center">
              <h1 className="font-display text-lg xs:text-xl font-bold text-gold">
                Join Our Community
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-3 xs:px-4 py-6 xs:py-12">
        <div className="max-w-lg w-full">
          {/* Benefits Section */}
          <div className="text-center mb-4 xs:mb-6">
            <h2 className="text-xl xs:text-2xl font-bold text-charcoal font-display mb-3 xs:mb-4">
              Join Our Community
            </h2>
            <p className="text-sm xs:text-base text-gray-600 leading-relaxed mb-4 xs:mb-6 px-2 xs:px-0">
              Create your account to earn rewards and enjoy exclusive benefits
            </p>

          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-4 xs:p-8 space-y-4 xs:space-y-6">
            <div className="text-center mb-4 xs:mb-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-charcoal transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 xs:w-6 xs:h-6" />
                </button>
                <h3 className="text-xl xs:text-2xl font-bold text-charcoal mb-1 xs:mb-2">
                  Create Your Account
                </h3>
              </div>
              <p className="text-charcoal/70 text-sm xs:text-base whitespace-nowrap">
                Join thousands of satisfied customers
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-4">
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
                id="phone"
                name="phone"
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
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

              {/* Locations Section */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-charcoal">
                  Location(s) *
                </label>
                
                {formData.locations.map((location, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-3 xs:p-4 space-y-2 xs:space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 xs:gap-2">
                        <MapPin className="w-3 h-3 xs:w-4 xs:h-4 text-gray-400" />
                        <span className="text-xs xs:text-sm font-medium text-gray-700">
                          Location {index + 1}
                          {location.isHome && (
                            <span className="ml-1 xs:ml-2 inline-flex items-center gap-1 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-gold/20 text-gold text-xs rounded-full">
                              <Home className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                              Home
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 xs:gap-2">
                        {!location.isHome && (
                          <button
                            type="button"
                            onClick={() => setHomeLocation(index)}
                            className="text-xs text-gold hover:text-gold-dark transition-colors"
                          >
                            Set as Home
                          </button>
                        )}
                        {formData.locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={location.name}
                        onChange={(e) => updateLocation(index, 'name', e.target.value)}
                        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gold transition-colors text-sm xs:text-base"
                        placeholder="Enter location (e.g., Bartlesville, Tulsa)"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addLocation}
                  className="w-full flex items-center justify-center gap-1 xs:gap-2 py-2.5 xs:py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gold hover:text-gold transition-colors text-sm xs:text-base"
                >
                  <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  Add Another Location
                </button>
                
                {errors.locations && (
                  <p className="text-red-600 text-sm">{errors.locations}</p>
                )}
              </div>

              <FloatingLabelInput
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <FloatingLabelInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-gradient text-charcoal py-3 xs:py-4 px-4 xs:px-6 rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-base xs:text-lg"
            >
              {loading ? 'Creating Account...' : 'Join Now'}
            </button>

            <div className="text-center">
              <p className="text-charcoal/70 text-xs xs:text-sm">
                Already have an account?{' '}
                <Link 
                  to="/customer/login" 
                  className="text-gold hover:text-gold-dark font-medium transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="text-center pt-3 xs:pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 px-2 xs:px-0">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20">
        <div className="max-w-4xl mx-auto px-4 xs:px-6 py-3 xs:py-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Woodfire.food • Secure Customer Registration
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerSignup
