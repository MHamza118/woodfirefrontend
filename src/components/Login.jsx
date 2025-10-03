import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FloatingLabelInput from './FloatingLabelInput'
import { ArrowLeft } from 'lucide-react'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the intended destination based on user role and status
  const getDefaultRedirect = (user) => {
    // Admin roles: owner, admin, manager, hiring_manager, expo
    const adminRoles = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
    if (adminRoles.includes(user.role)) return '/admin/dashboard'
    
    if (user.role === 'customer') return '/customer/dashboard'
    
    // Employee routing based on stage and status
    if (user.role === 'employee') {
      if (user.can_access_dashboard) return '/employee/dashboard'
      
      // Route based on current stage
      switch (user.stage) {
        case 'interview':
          return '/employee/qr-scan'
        case 'location_selected':
          return '/employee/questionnaire'
        case 'questionnaire_completed':
          return '/confirmation'
        default:
          return '/employee/qr-scan'
      }
    }
    
    // Legacy fallback for existing users
    if (user.status === 'ACTIVE') return '/employee/dashboard'
    if (user.status === 'INTERVIEW') return '/confirmation'
    return '/employee/qr-scan'
  }
  
  const from = location.state?.from?.pathname

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

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    const result = await login(formData.email, formData.password, 'employee')
    
    if (result.success) {
      const redirectTo = from || getDefaultRedirect(result.user)
      navigate(redirectTo, { replace: true })
    } else {
      setErrors({ general: result.error })
    }
    
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center px-3 xs:px-4 py-6 xs:py-12">
      <div className="max-w-md w-full">
        {/* Login Form */}
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
                Employee Login
              </h2>
            </div>
            <p className="text-charcoal/70 text-sm xs:text-base">
              Sign in to your employee account
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 xs:px-4 py-2 xs:py-3 rounded-md text-xs xs:text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-gradient text-charcoal py-2.5 xs:py-3 px-3 xs:px-4 rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm xs:text-base"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center">
            <p className="text-charcoal/70 text-xs xs:text-sm">
              Don't have an account?{' '}
              <Link 
                to="/admin/signup" 
                className="text-gold hover:text-gold-dark font-medium transition-colors duration-200"
              >
                Employee Sign up here
              </Link>
            </p>
            
            <div className="text-center pt-3 xs:pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                Customer?{' '}
                <Link 
                  to="/customer/login" 
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Customer Login
                </Link>
              </p>
              <p className="text-xs text-gray-500">
                Manager/Admin?{' '}
                <Link 
                  to="/admin-login" 
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </form>


      </div>
    </div>
  )
}

export default Login