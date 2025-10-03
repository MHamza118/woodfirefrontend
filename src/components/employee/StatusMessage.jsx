import { useAuth } from '../../contexts/AuthContext'
import { AlertTriangle, Phone, Mail, Clock } from 'lucide-react'

const StatusMessage = ({ status }) => {
  const { user, logout } = useAuth()

  const getStatusInfo = () => {
    switch (status) {
      case 'PAUSED':
        return {
          icon: <Clock className="w-12 h-12 text-yellow-600" />,
          title: 'Account Temporarily Paused',
          message: 'Your account has been temporarily paused. This may be due to scheduling adjustments or administrative requirements.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        }
      case 'INACTIVE':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-600" />,
          title: 'Account Inactive',
          message: 'Your account is currently inactive. Please contact HR to resolve any issues and reactivate your account.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-gray-600" />,
          title: 'Account Access Restricted',
          message: 'Your account access is currently restricted. Please contact HR for assistance.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-brand-navy text-cream shadow-2xl border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div>
              <h1 className="font-display text-2xl xs:text-xl md:text-2xl font-bold text-gold">
                Woodfire.food
              </h1>
              <p className="text-cream/80 text-base xs:text-sm font-medium">
                Employee Portal
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="text-cream/90">{user?.name}</p>
                <p className="text-cream/60">Status: {status}</p>
              </div>
              <button
                onClick={logout}
                className="bg-charcoal text-cream px-4 py-2 rounded-md hover:bg-charcoal/80 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${statusInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {statusInfo.icon}
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-4">
            {statusInfo.title}
          </h2>
        </div>

        {/* Status Message */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-6 mb-8`}>
          <div className="flex items-start gap-4">
            <AlertTriangle className={`w-6 h-6 ${statusInfo.textColor} mt-1`} />
            <div>
              <h3 className={`font-semibold ${statusInfo.textColor} mb-2`}>
                Account Status: {status}
              </h3>
              <p className={statusInfo.textColor}>
                {statusInfo.message}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4">Contact HR Department</h3>
          <p className="text-charcoal/70 mb-6">
            Please reach out to our HR team for assistance with your account status:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-cream/50 rounded-lg">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Phone className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-charcoal">Phone</p>
                <p className="text-charcoal/70">(918) 555-0123</p>
                <p className="text-sm text-charcoal/60">Monday - Friday, 9:00 AM - 5:00 PM</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-cream/50 rounded-lg">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-charcoal">Email</p>
                <p className="text-charcoal/70">hr@309311restaurants.com</p>
                <p className="text-sm text-charcoal/60">Response within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-brand-navy text-cream rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gold mb-4">What to Expect</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gold rounded-full mt-2"></div>
              <p>HR will review your account status and any pending requirements</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gold rounded-full mt-2"></div>
              <p>You may be contacted for additional information or documentation</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gold rounded-full mt-2"></div>
              <p>Once resolved, you'll receive access to your employee dashboard</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gold rounded-full mt-2"></div>
              <p>Check your email regularly for updates on your status</p>
            </div>
          </div>
        </div>

        {/* Employee ID Reference */}
        {user?.id && (
          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal/60">
              Employee Reference ID: <span className="font-mono font-medium">{user.id}</span>
            </p>
            <p className="text-xs text-charcoal/50 mt-1">
              Please reference this ID when contacting HR
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusMessage