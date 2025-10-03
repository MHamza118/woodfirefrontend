import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Gift, Home, Clock, MapPin } from 'lucide-react'
import Logo from '../Logo'

const SuccessPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the submitted data from the previous page
  const { tableNumber = 'N/A', orderNumber = 'N/A' } = location.state || {}

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cream to-gold/10 flex flex-col">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Logo size="sm" />
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-gold">
                Order Confirmed!
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Success Message Container */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-green-700 font-display mb-4">
              Perfect!
            </h2>
            <p className="text-xl text-charcoal font-medium leading-relaxed">
              Thanks for letting us know where you are. Your order will be delivered soon.
            </p>
          </div>

          {/* Delivery Details and Rewards - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="font-semibold text-charcoal mb-4 flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-gold" />
                Delivery Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-bold text-charcoal">#{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Table</span>
                  <span className="font-bold text-charcoal">{tableNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Submitted</span>
                  <span className="font-medium text-charcoal">{currentTime}</span>
                </div>
              </div>
            </div>

            {/* Rewards CTA */}
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 rounded-2xl p-6 border-2 border-gold/30">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                  <Gift className="w-7 h-7 text-gold" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-charcoal font-display">
                    Want perks?
                  </h3>
                  <p className="text-gold-dark text-sm">
                    Join our rewards program
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/customer/signup')}
                className="w-full bg-gold-gradient text-charcoal py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign up for rewards
              </button>
              
              <p className="text-xs text-gray-600 mt-3">
                Earn points, get exclusive offers, and track your order history
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white border-2 border-gray-200 text-charcoal py-3 px-6 rounded-xl font-medium hover:border-gold/50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </div>
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Need to update your table? Submit the form again with your new location
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-charcoal/70">
              Thank you for dining with us today!
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>Order delivered to your table</span>
              <span>•</span>
              <span>Woodfire.food</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage
