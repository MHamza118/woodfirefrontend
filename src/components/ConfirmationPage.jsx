import { useEmployee } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { Phone, Mail, MapPin, ChefHat, ArrowLeft, Calendar, Clock, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import employeeApiService from '../services/employeeApiService'

const ConfirmationPage = () => {
  const { employee, updateEmployee } = useEmployee()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [employeeData, setEmployeeData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load employee data from API
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (user?.role === 'employee') {
        try {
          const response = await employeeApiService.getConfirmationPage()
          
          if (response.success) {
            setEmployeeData({
              personalInfo: {
                firstName: response.employee.first_name,
                lastName: response.employee.last_name,
                email: response.employee.email,
                phone: response.employee.phone
              },
              location: {
                name: response.employee.location
              },
              status: response.employee.stage,
              confirmationInfo: response.confirmation_info
            })
            
            // Also update the employee context
            updateEmployee({
              id: response.employee.id,
              status: response.employee.stage,
              location: response.employee.location,
              designation: response.employee.position
            })
          } else {
            console.error('Failed to load confirmation data:', response.error)
          }
        } catch (error) {
          console.error('Error loading confirmation data:', error)
        }
      }
      setLoading(false)
    }
    
    loadEmployeeData()
  }, [user, updateEmployee])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    )
  }

  // If no employee data found, show error
  if (!employeeData || !employeeData.personalInfo?.firstName) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-charcoal mb-4">
            No application data found
          </h2>
          <p className="text-charcoal/60">
            Please complete the application form first.
          </p>
        </div>
      </div>
    )
  }

  const { personalInfo, location } = employeeData

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="max-w-4xl mx-auto p-3 xs:p-6">

        <div className="bg-white rounded-xl xs:rounded-2xl shadow-xl p-4 xs:p-6 md:p-8 border border-gold/10">
          
          {/* Company Header with Contact Info */}
          <div className="mb-4 xs:mb-6 text-center">
            <h1 className="font-display text-xl xs:text-3xl md:text-4xl font-bold text-charcoal mb-2 xs:mb-3">
              Woodfire.food
            </h1>
            <div className="bg-charcoal/5 rounded-lg xs:rounded-xl p-2 xs:p-3 mb-3 xs:mb-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 text-xs xs:text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-3 h-3 xs:w-4 xs:h-4 text-gold" />
                  <span className="text-charcoal">hr@309311restaurants.com</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-3 h-3 xs:w-4 xs:h-4 text-gold" />
                  <span className="text-charcoal">(918) 555-0123</span>
                </div>
              </div>
            </div>
            
            {/* Responsive Layout: Stacked on mobile, horizontal on larger screens */}
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-0 mb-3 xs:mb-4">
              <h2 className="font-display text-lg xs:text-xl md:text-2xl text-gold">
                Hi {personalInfo.firstName} {personalInfo.lastName}! 👋
              </h2>
            </div>
            
            {/* Status Bar */}
            <div className="flex justify-between items-center bg-blue-100 text-blue-800 px-2 xs:px-3 py-2 rounded-lg mb-3 xs:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs xs:text-sm font-medium">Status:</span>
              </div>
              <span className="text-xs xs:text-sm font-medium">Interview</span>
            </div>
          </div>

          {/* Exact Requirements Confirmation Message */}
          <div className="bg-cream/50 rounded-lg xs:rounded-xl p-3 xs:p-4 md:p-6 mb-4 xs:mb-6 text-left">
            <div className="text-charcoal/90 leading-relaxed space-y-2 xs:space-y-3 text-sm xs:text-base">
              <p>
                <strong>We're excited you're interested in joining our team.</strong>
              </p>

              <p>
                <strong>You will receive a link from our scheduling software shortly — please log in and update your availability ASAP so we can get you on a shift.</strong>
              </p>

              <p>
                <strong>Your first few shifts will be working interviews (3–4 hours each, paid minimum wage). If we're a good fit, we'll add you to the regular schedule and begin formal training.</strong>
              </p>

              <p>
                <strong>For now, please wear a plain black t-shirt and non-ripped jeans. If you don't have one, a dark shirt is fine. A uniform will be provided once you're officially hired.</strong>
              </p>

              <p className="text-gold font-bold text-base xs:text-lg">
                <strong>We look forward to seeing you soon!</strong>
              </p>
            </div>
          </div>

          {/* Application Summary */}
          <div className="bg-charcoal/5 rounded-lg xs:rounded-xl p-3 xs:p-4 mb-4 xs:mb-6">
            <h3 className="font-display text-base xs:text-lg font-semibold text-charcoal mb-2 xs:mb-3 flex items-center justify-center gap-2">
              <ChefHat className="w-4 h-4 xs:w-5 xs:h-5 text-gold" />
              Application Summary
            </h3>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 text-xs xs:text-sm">
              <div className="flex items-center gap-2 xs:gap-3">
                <MapPin className="w-3 h-3 xs:w-4 xs:h-4 text-gold flex-shrink-0" />
                <span className="text-charcoal/70">Location:</span>
                <span className="font-medium text-charcoal truncate">{location?.name || personalInfo.preferredLocation}</span>
              </div>

              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-3 h-3 xs:w-4 xs:h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="text-charcoal/70">Status:</span>
                <span className="font-medium text-blue-700">Interview</span>
              </div>

              <div className="flex items-center gap-2 xs:gap-3">
                <Mail className="w-3 h-3 xs:w-4 xs:h-4 text-gold flex-shrink-0" />
                <span className="text-charcoal/70">Email:</span>
                <span className="font-medium text-charcoal truncate">{personalInfo.email}</span>
              </div>

              <div className="flex items-center gap-2 xs:gap-3">
                <Phone className="w-3 h-3 xs:w-4 xs:h-4 text-gold flex-shrink-0" />
                <span className="text-charcoal/70">Phone:</span>
                <span className="font-medium text-charcoal">{personalInfo.phone}</span>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="bg-gold/5 rounded-lg xs:rounded-xl p-3 xs:p-4 md:p-6 mb-4 xs:mb-6 border border-gold/20">
            <div className="text-center">
              <h3 className="font-display text-base xs:text-lg font-semibold text-charcoal mb-2 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 xs:w-5 xs:h-5 text-gold" />
                Set Your Availability
              </h3>
              
              <p className="text-charcoal/70 mb-3 xs:mb-4 text-xs xs:text-sm">
                Please set your availability to help us schedule your working interview.
              </p>
              
              <div className="mb-3 xs:mb-4">
                {employeeData.schedule ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg xs:rounded-xl p-3 xs:p-4 mb-3 xs:mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" />
                      <span className="text-green-800 font-medium text-sm xs:text-base">Schedule Submitted!</span>
                    </div>
                    <p className="text-green-700 text-xs xs:text-sm">
                      You submitted your availability on{' '}
                      {new Date(employeeData.schedule.submittedAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => navigate('/employee/schedule')}
                      className="mt-2 xs:mt-3 text-green-700 hover:text-green-800 font-medium text-xs xs:text-sm underline"
                    >
                      Update Schedule
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              <button
                onClick={() => navigate('/employee/schedule')}
                className={`inline-flex items-center gap-2 xs:gap-3 px-4 xs:px-6 py-2 xs:py-3 rounded-lg xs:rounded-xl font-medium transition-all duration-200 text-sm xs:text-base ${
                  employeeData.schedule 
                    ? 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20' 
                    : 'bg-gold-gradient text-charcoal shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                <Calendar className="w-4 h-4 xs:w-5 xs:h-5" />
                {employeeData.schedule ? 'Update Schedule' : 'Set My Schedule'}
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-charcoal/10 pt-3 xs:pt-4 text-center">
            <h4 className="font-display text-sm xs:text-base font-semibold text-charcoal mb-2 xs:mb-3">
              Questions? We're Here to Help!
            </h4>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3 text-xs xs:text-sm">
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-3 h-3 xs:w-4 xs:h-4 text-gold" />
                <span className="text-charcoal">hr@309311restaurants.com</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-3 h-3 xs:w-4 xs:h-4 text-gold" />
                <span className="text-charcoal">(918) 555-0123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPage
