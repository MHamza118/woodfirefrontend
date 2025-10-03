import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FloatingLabelInput from '../FloatingLabelInput'
import { ArrowLeft, User } from 'lucide-react'
import Logo from '../Logo'

const CustomerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { customerLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the intended destination or default to customer dashboard
  const from = location.state?.from?.pathname || '/customer/dashboard'

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
    
    const result = await customerLogin(formData.email, formData.password)
    
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setErrors({ general: result.error })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-gold/10 flex flex-col">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Logo size="sm" />
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-gold">
                Customer Sign In
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center mb-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-charcoal transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-charcoal mb-2">
                  Welcome Back!
                </h3>
              </div>
              <p className="text-charcoal/70 mb-2">
                Sign in to your account to access rewards, order history, and exclusive offers
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
              className="w-full bg-gold-gradient text-charcoal py-4 px-6 rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-charcoal/70 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/customer/signup" 
                  className="text-gold hover:text-gold-dark font-medium transition-colors duration-200"
                >
                  Join now
                </Link>
              </p>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <Link 
                  to="/employee/login" 
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Employee Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Woodfire.food • Secure Customer Login
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin
