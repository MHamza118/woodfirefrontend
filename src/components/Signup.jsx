import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FloatingLabelInput from './FloatingLabelInput'
import { ArrowLeft } from 'lucide-react'

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { signup } = useAuth()
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
    
    // Prepare data for employee signup
    const employeeData = {
      ...formData,
      password_confirmation: formData.confirmPassword,
      role: 'employee'
    }
    
    const result = await signup(employeeData)
    
    if (result.success) {
      // Navigate based on employee stage
      const user = result.user
      if (user.stage === 'interview') {
        navigate('/employee/qr-scan')
      } else {
        navigate('/employee/dashboard')
      }
    } else {
      setErrors({ general: result.error })
    }
    
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center px-3 xs:px-4 py-6 xs:py-12">
      <div className="max-w-md w-full">
        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 xs:p-8 space-y-4 xs:space-y-6">
          {/* Header inside form */}
          <div className="text-center mb-4 xs:mb-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-charcoal transition-colors"
              >
                <ArrowLeft className="w-5 h-5 xs:w-6 xs:h-6" />
              </button>
              <h2 className="text-2xl xs:text-3xl font-bold text-charcoal mb-1 xs:mb-2">
                Create Account
              </h2>
            </div>
            <p className="text-charcoal/70 text-sm xs:text-base">
              Join us to get started with your restaurant management
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 xs:px-4 py-2 xs:py-3 rounded-md text-xs xs:text-sm">
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
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

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
            className="w-full bg-gold-gradient text-charcoal py-2.5 xs:py-3 px-3 xs:px-4 rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm xs:text-base"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-charcoal/70 text-xs xs:text-sm whitespace-nowrap">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-gold hover:text-gold-dark font-medium transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup