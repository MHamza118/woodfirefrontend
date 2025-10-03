import { Phone, Mail, MapPin, Clock, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = ({ location = null }) => {
  return (
    <footer className="bg-brand-navy text-cream mt-auto border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 xs:gap-6 md:gap-8">

          {/* Company Information */}
          <div className="flex-1">
            <h3 className="font-display text-lg xs:text-sm sm:text-lg font-bold text-gold mb-2 xs:mb-3 sm:mb-4 text-center md:text-left">
              Woodfire.food
            </h3>
            <p className="text-cream/80 text-xs sm:text-sm leading-relaxed text-center md:text-left px-2 xs:px-0">
              Premium dining experiences across Oklahoma. Join our team and be part of our culinary excellence.
            </p>
          </div>

          {/* Contact Information */}
          <div className="flex-shrink-0">
            <h4 className="font-semibold text-gold mb-2 xs:mb-3 sm:mb-4 text-xs xs:text-sm sm:text-base text-center md:text-left">Contact Hiring Manager</h4>
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 xs:gap-3 justify-center md:justify-start">
                <Phone className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                <span>(918) 555-0123</span>
              </div>
              <div className="flex items-center gap-2 xs:gap-3 justify-center md:justify-start">
                <Mail className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                <span className="text-xs xs:text-sm">hr@309311restaurants.com</span>
              </div>
              <div className="flex items-center gap-2 xs:gap-3 justify-center md:justify-start">
                <Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                <span>Mon-Fri: 9AM-5PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar*/}
        <div className="border-t border-cream/20 mt-4 xs:mt-6 sm:mt-8 pt-3 xs:pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-cream/60 text-xs sm:text-sm px-2 xs:px-0 order-2 sm:order-1">
              © 2025 Woodfire.food. All rights reserved.
            </p>
            <Link
              to="/admin-login"
              className="order-1 sm:order-2 inline-flex items-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:border-gold/50 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            >
              <Shield className="w-3 h-3" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
