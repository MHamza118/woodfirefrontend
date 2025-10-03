import { useNavigate } from 'react-router-dom'
import { MapPin, Home, Utensils, Clock } from 'lucide-react'
import Logo from '../Logo'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-gold/10 flex flex-col">
      {/* Header */}
      <div className="w-full bg-brand-navy/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-center gap-4">
            <Logo size="sm" />
            <div className="text-center">
              <h1 className="font-display text-2xl xs:text-xl font-bold text-gold">
                Woodfire.food
              </h1>
              <p className="text-cream/80 text-base xs:text-sm">
                Order Tracking & Seating
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          
          {/* Welcome Message and Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* Welcome Message */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-charcoal font-display">
                Welcome!
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Thank you for visiting us today. How can we help you?
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-4">
            {/* Seating Notification Button */}
            <button
              onClick={() => navigate('/seating')}
              className="w-full bg-gold-gradient text-charcoal py-6 px-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group mobile-landing-button"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-charcoal/10 rounded-xl flex items-center justify-center group-hover:bg-charcoal/20 transition-colors mobile-hide-landing-icons">
                    <MapPin className="w-7 h-7 text-charcoal" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-charcoal font-display">
                      Let us know where you are sitting
                    </h3>
                    <p className="text-charcoal/70 text-sm mt-1">
                      Help us deliver your order to your table
                    </p>
                  </div>
                </div>
                <div className="text-charcoal/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Customer Account Button */}
            <button
              onClick={() => navigate('/customer/login')}
              className="w-full bg-white border-2 border-gold/30 text-charcoal py-6 px-8 rounded-2xl hover:border-gold hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] group mobile-landing-button"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors mobile-hide-landing-icons">
                    <Home className="w-7 h-7 text-gold" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-charcoal font-display">
                      Customer Account
                    </h3>
                    <p className="text-charcoal/70 text-sm mt-1">
                      Sign in or join rewards program
                    </p>
                  </div>
                </div>
                <div className="text-charcoal/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-charcoal/5 border-t border-gold/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-charcoal/70">
              Questions? Our team is here to help!
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>Bartlesville • Tulsa</span>
              <span>•</span>
              <span>Woodfire.food</span>
              <span>•</span>
              <button
                onClick={() => navigate('/admin/login')}
                className="text-blue-600 hover:text-blue-700 transition-colors underline"
              >
                Employee Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
