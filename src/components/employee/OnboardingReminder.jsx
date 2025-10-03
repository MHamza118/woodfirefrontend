import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, X, BookOpen, CheckCircle, User } from 'lucide-react'

const OnboardingReminder = ({ employeeData, onboardingProgress, onboardingPages, onClose, onNavigateToOnboarding, onNavigateToPersonalInfo }) => {
  const [showModal, setShowModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Use dynamic onboarding pages from props (loaded from API)

  const getOnboardingProgress = useCallback(() => {
    // First check if the API already provides detailed progress information
    if (employeeData?.onboarding_pages_progress) {
      return employeeData.onboarding_pages_progress
    }
    
    // Fallback to calculating from props
    const totalPages = onboardingPages?.length || 0
    if (!onboardingProgress || totalPages === 0) {
      return { completed: 0, total: totalPages, is_complete: false }
    }
    
    const completed = Object.values(onboardingProgress).filter(status => status === 'completed').length
    return { completed, total: totalPages, is_complete: completed >= totalPages && totalPages > 0 }
  }, [employeeData, onboardingPages, onboardingProgress])

  const getPageStatus = (pageId) => {
    return onboardingProgress?.[pageId] || 'not-started'
  }

  // Check if personal info is complete (memoized for performance)
  const isPersonalInfoComplete = useCallback(() => {
    // First check if the API already provides this information
    if (employeeData?.is_personal_info_complete !== undefined) {
      return employeeData.is_personal_info_complete
    }
    
    // Fallback to manual checking
    const personalInfo = employeeData?.personal_info || employeeData?.employee?.personal_info || employeeData?.employee?.profile_data?.personal_info
    if (!personalInfo) return false
    
    // Check core required fields (first_name, last_name, email, phone)
    const coreFields = [
      employeeData?.first_name || employeeData?.employee?.first_name,
      employeeData?.last_name || employeeData?.employee?.last_name,
      employeeData?.email || employeeData?.employee?.email,
      employeeData?.phone || employeeData?.employee?.phone
    ]
    
    // Check if all core fields are filled
    const coreComplete = coreFields.every(field => field && String(field).trim())
    
    // Additional fields check (mailing_address, requested_hours)
    const { mailing_address, requested_hours } = personalInfo
    const additionalComplete = !!(mailing_address && String(mailing_address).trim()) && 
                              !!(requested_hours && String(requested_hours).trim())
    
    return coreComplete && additionalComplete
  }, [employeeData])

  const progress = getOnboardingProgress()
  const isOnboardingComplete = progress.is_complete || (progress.total === 0 || progress.completed >= progress.total)
  const isPersonalComplete = isPersonalInfoComplete()
  const isFullyComplete = isOnboardingComplete && isPersonalComplete

  // Effect to show/hide modal based on completion status
  useEffect(() => {
    if (!isFullyComplete && employeeData) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [isFullyComplete, employeeData, onboardingPages, onboardingProgress, refreshTrigger])
  
  // Effect to trigger refresh when onboarding pages change (new documents added)
  useEffect(() => {
    if (onboardingPages?.length > 0) {
      setRefreshTrigger(prev => prev + 1)
    }
  }, [onboardingPages?.length])

  const handleDismiss = () => {
    setShowModal(false)
    if (onClose) onClose()
  }
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
    // Force a re-check of completion status
    setTimeout(() => {
      const newProgress = getOnboardingProgress()
      const newPersonalComplete = isPersonalInfoComplete()
      const newFullyComplete = (newProgress.is_complete || (newProgress.total === 0 || newProgress.completed >= newProgress.total)) && newPersonalComplete
      
      if (!newFullyComplete) {
        setShowModal(true)
      }
    }, 100)
  }

  const handleStartOnboarding = () => {
    setShowModal(false)
    if (onNavigateToOnboarding) {
      onNavigateToOnboarding()
    }
  }

  const handleCompletePersonalInfo = () => {
    setShowModal(false)
    if (onNavigateToPersonalInfo) {
      onNavigateToPersonalInfo()
    }
  }

  if (!showModal || isFullyComplete) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Profile Incomplete
              </h3>
              <p className="text-sm text-gray-600">Complete to access all features</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 scrollable-modal p-6 space-y-4">
          {/* Personal Info Status */}
          {!isPersonalComplete && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Personal Information Missing</h4>
                  <p className="text-orange-700 text-sm mt-1">Please complete your mailing address and requested hours.</p>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800">Onboarding Progress</h4>
                <p className="text-blue-700 text-sm mt-1">
                  {progress.total === 0 
                    ? 'No onboarding documents configured'
                    : `${progress.completed} of ${progress.total} pages completed (${progress.percentage || Math.round((progress.completed / progress.total) * 100)}%)`
                  }
                </p>
                {progress.total > 0 && (
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress.percentage || (progress.total > 0 ? (progress.completed / progress.total) * 100 : 0)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requirements List */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Required Items:</h4>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${
                isPersonalComplete ? 'text-green-700' : 'text-gray-700'
              }`}>
                {isPersonalComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                )}
                <span>Personal Information</span>
              </div>
              {onboardingPages && onboardingPages.length > 0 ? onboardingPages.map((page) => {
                const isCompleted = getPageStatus(page.id) === 'completed'
                return (
                  <div key={page.id} className={`flex items-center gap-2 text-sm ${
                    isCompleted ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                    )}
                    <span>{page.title}</span>
                  </div>
                )
              }) : (
                <div className="text-sm text-gray-500 italic">
                  No onboarding documents available. Please contact your administrator.
                </div>
              )}
            </div>
          </div>

          {/* Important Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> You must complete your profile and onboarding to access all employee features. This notification will appear each time you log in until completed.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          {!isPersonalComplete ? (
            <button
              onClick={handleCompletePersonalInfo}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Complete Personal Info
            </button>
          ) : progress.total > 0 ? (
            <button
              onClick={handleStartOnboarding}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Onboarding
            </button>
          ) : (
            <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-medium">
              Profile Complete
            </div>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingReminder
