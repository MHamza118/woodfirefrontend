import { Phone, Mail, MapPin } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../contexts/AuthContext'

const Header = ({ showContactInfo = false, location = null, showLogout = true }) => {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="bg-brand-navy text-cream shadow-2xl border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 xs:h-20">
          {/* Logo and Company Name */}
          <div className="flex items-center gap-3 xs:gap-4">
            <Logo size="sm" />
            <div>
              <div className="hidden xs:block">
                <h1 className="font-display text-xl md:text-2xl font-bold text-gold">
                  Woodfire.food
                </h1>
              </div>
              <div className="xs:hidden">
                <h1 className="font-display text-xl font-bold text-gold leading-tight">
                  Woodfire.food
                </h1>
                <p className="font-display text-base text-gold leading-tight">
                  Restaurant
                </p>
              </div>
              {location && (
                <p className="text-cream/80 text-xs xs:text-sm font-medium tracking-wide">
                  {location.name} Location
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {showContactInfo && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>(918) 555-0123</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>hr@309311restaurants.com</span>
              </div>
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>{location.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 bg-gold hover:bg-gold/90 text-brand-navy rounded-lg xs:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm xs:text-base"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
