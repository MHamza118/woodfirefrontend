import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, BookOpen, Clock, AlertTriangle, FileText, Edit2, TrendingUp, Users, Calendar, Award, User, Bell } from 'lucide-react'
import notificationService from '../../services/notificationService'
import employeeApiService from '../../services/employeeApiService'

const OnboardingSection = ({ employeeData, setEmployeeData, onboardingPages, onboardingProgress, refreshOnboardingData }) => {
  const [selectedPage, setSelectedPage] = useState(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [apiOnboardingPages, setApiOnboardingPages] = useState([])
  const [currentProgress, setCurrentProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  // Icon mapping for onboarding pages
  const getIconComponent = (iconName) => {
    const iconMap = {
      'BookOpen': BookOpen,
      'Calendar': Calendar,
      'Award': Award,
      'User': User,
      'FileText': FileText,
      'Bell': Bell,
      'Clock': Clock,
      'AlertTriangle': AlertTriangle
    }
    return iconMap[iconName] || BookOpen
  }

  // Load onboarding data from API
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await employeeApiService.getOnboardingPages()
        
        if (response.success) {
          setApiOnboardingPages(response.pages || [])
          const progressData = response.progress || {}
          setCurrentProgress(progressData)
          const completedCount = Object.values(progressData).filter(status => status === 'completed').length
          setProgress({ completed: completedCount, total: response.pages?.length || 0 })
        } else {
          setError(response.error || 'Failed to load onboarding data')
          // Fallback to legacy data structure if API fails
          const fallbackProgress = getProgress()
          setProgress(fallbackProgress)
        }
      } catch (error) {
        setError('Error loading onboarding data')
        console.error('Error loading onboarding data:', error)
        // Fallback to legacy data structure if API fails
        const fallbackProgress = getProgress()
        setProgress(fallbackProgress)
      } finally {
        setLoading(false)
      }
    }
    
    loadOnboardingData()
  }, [employeeData, onboardingProgress])

  const getPageStatus = (pageId) => {
    return currentProgress[pageId] || 'not_started'
  }

  const getCompletedDate = (pageId) => {
    return employeeData?.onboardingCompletions?.[pageId]
  }

  const getProgress = () => {
    const progressData = Object.keys(currentProgress).length > 0 ? currentProgress : onboardingProgress
    if (!progressData) return { completed: 0, total: onboardingPages?.length || 0 }
    const completed = Object.values(progressData).filter(status => status === 'completed').length
    return { completed, total: onboardingPages?.length || 0 }
  }

  const handlePageClick = (page) => {
    setSelectedPage(page)
    setShowSignatureModal(true)
  }

  const handleAcknowledge = async (pageId, signature) => {
    try {
      setError('')
      const response = await employeeApiService.completeOnboardingPage(pageId, signature)
      
      if (response.success) {
        // Update employee data with fresh data from API
        if (response.employee) {
          setEmployeeData(response.employee)
        }
        
        // Refresh onboarding data from parent component
        if (refreshOnboardingData) {
          await refreshOnboardingData()
        }
        
        // Update progress state
        if (response.progress) {
          setCurrentProgress(response.progress)
          const completedCount = Object.values(response.progress).filter(status => status === 'completed').length
          setProgress({ completed: completedCount, total: apiOnboardingPages.length || onboardingPages?.length || 0 })
        }
        
        setShowSignatureModal(false)
        setSelectedPage(null)

        // Notify admin of onboarding page completion
        const employeeName = `${employeeData.personalInfo?.firstName || employeeData.name || 'Employee'} ${employeeData.personalInfo?.lastName || ''}`
        notificationService.createNotification('ONBOARDING_PROGRESS', {
          title: 'Onboarding Page Completed',
          message: `${employeeName.trim()} completed: ${selectedPage.title}`,
          employeeId: employeeData.id,
          employeeName: employeeName.trim(),
          completedPage: selectedPage.title
        })
        
        // Check if all onboarding is complete and notify if so
        const totalPages = apiOnboardingPages.length || onboardingPages?.length || 0
        const completedCount = response.progress ? Object.values(response.progress).filter(status => status === 'completed').length : 0
        
        if (completedCount === totalPages) {
          notificationService.notifyOnboardingComplete({
            id: employeeData.id,
            name: employeeName.trim()
          })
        }
      } else {
        setError(response.error || 'Failed to complete onboarding page')
        alert('Failed to complete onboarding page. Please try again.')
      }
    } catch (error) {
      setError('Error completing onboarding page')
      console.error('Error completing onboarding page:', error)
      alert('Error completing onboarding page. Please try again.')
    }
  }

  // Use API pages if available, fallback to prop pages
  const displayPages = apiOnboardingPages.length > 0 ? apiOnboardingPages : (onboardingPages || [])
  const displayProgress = loading ? { completed: 0, total: 0 } : progress

  // Show empty state if no pages are available and not loading
  if (!loading && displayPages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Onboarding Pages Available</h3>
        <p className="text-gray-500 text-center max-w-md">
          Please contact your administrator to set up onboarding documents.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        <span className="ml-3 text-charcoal/70">Loading onboarding data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section with Instructions */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-6">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-gold/20 backdrop-blur-sm rounded-lg flex-shrink-0 mobile-hide-header-icons">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Employee Onboarding</h3>
                <p className="text-cream/80 text-xs mb-4 leading-relaxed">
                  Complete your onboarding by reading and acknowledging all required documents. 
                  Each document provides essential information about policies, procedures, and expectations.
                </p>
              </div>
            </div>
              <div className="flex items-center gap-3 text-gold/90 text-sm flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gold rounded-full"></div>
                  <span>{displayProgress.completed} of {displayProgress.total} completed</span>
                </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Digital signature required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-100">
          <h3 className="text-2xl font-bold text-charcoal flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl mobile-hide-header-icons">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            Onboarding Progress
          </h3>
        </div>
        
        <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 mobile-grid">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100/50 rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-charcoal mb-1">{displayProgress.total}</p>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Pages</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                <span>Required to complete</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-100/50 rounded-xl shadow-lg p-6 border border-amber-100">
              <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-amber-600 mb-1">{displayProgress.total - displayProgress.completed}</p>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Remaining</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-xs text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                <span>Awaiting completion</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-green-600 mb-1">{displayProgress.completed}</p>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Completed</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Successfully acknowledged</span>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-charcoal text-lg">Overall Progress</h4>
              <span className="text-2xl font-bold text-charcoal">{Math.round((displayProgress.completed / (displayProgress.total || 1)) * 100)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-indigo-500 h-4 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden" 
                  style={{ width: `${(displayProgress.completed / (displayProgress.total || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-sm text-gray-600">
              <span>Start onboarding</span>
              <span>Ready to work</span>
            </div>
          </div>

          {/* Status Messages */}
          {displayProgress.completed < displayProgress.total && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl mobile-hide-header-icons">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 text-lg mb-1">Complete Your Onboarding</h4>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    You have {displayProgress.total - displayProgress.completed} remaining onboarding pages to complete. 
                    Each document requires your digital signature to acknowledge understanding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {displayProgress.completed === displayProgress.total && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl mobile-hide-header-icons">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-green-800 text-lg mb-1">Onboarding Complete!</h4>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Congratulations! You have completed all onboarding requirements and are ready to begin working.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Pages */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-charcoal flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl mobile-hide-header-icons">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            Onboarding Documents
          </h3>
          <div className="text-sm text-gray-500">
            {displayPages.length} documents required
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayPages.map((page, index) => {
            const status = getPageStatus(page.id)
            const completedDate = getCompletedDate(page.id)
            const IconComponent = getIconComponent(page.icon || 'BookOpen')
            
            return (
              <div key={page.id} className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Status Bar */}
                <div className={`h-1 bg-gradient-to-r ${
                  status === 'completed' 
                    ? 'from-green-400 to-emerald-500' 
                    : 'from-amber-400 to-orange-500'
                }`} />
                
                <div className="p-4 md:p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    {/* Status Icon */}
                    <div className={`p-2 md:p-3 rounded-xl shadow-md transition-all duration-200 flex-shrink-0 ${
                      status === 'completed' 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200' 
                        : 'bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                      ) : (
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-charcoal mb-1 line-clamp-2">{page.title}</h4>
                      <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
                        {status === 'completed' 
                          ? `Acknowledged on ${new Date(completedDate).toLocaleDateString()}`
                          : 'Review and digitally sign to acknowledge understanding'
                        }
                      </p>
                      
                      {/* Digital signature required text */}
                      <div className="flex items-center gap-1 text-blue-600 text-xs mb-2">
                        <Edit2 className="w-3 h-3" />
                        <span className="font-medium">Digital signature required</span>
                      </div>
                      
                      {status === 'completed' && completedDate && (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-medium">
                            Signed {new Date(completedDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Area - Bottom */}
                  <div className="mt-auto flex justify-between items-center">
                    {status === 'completed' ? (
                      <div></div>
                    ) : (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-amber-100 text-amber-700`}>
                        PENDING
                      </div>
                    )}
                    
                    {status === 'completed' ? (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-green-100 text-green-700`}>
                        COMPLETED
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePageClick(page)}
                        className="inline-flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-gold text-brand-navy rounded-lg text-xs font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Read &</span> Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedPage && (
        <OnboardingPageModal
          page={selectedPage}
          onClose={() => {
            setShowSignatureModal(false)
            setSelectedPage(null)
          }}
          onAcknowledge={handleAcknowledge}
          apiOnboardingPages={apiOnboardingPages}
        />
      )}
    </div>
  )
}

// Individual Onboarding Page Modal
const OnboardingPageModal = ({ page, onClose, onAcknowledge, apiOnboardingPages = [] }) => {
  const [signature, setSignature] = useState('')
  const [hasRead, setHasRead] = useState(false)

  const getPageContent = () => {
    // Use the page data passed as prop, which should come from API
    return {
      title: page.title || 'Onboarding Content',
      content: page.content || '<p>Please complete this onboarding step. Contact your administrator if you need assistance.</p>'
    }
  }

  const pageContent = getPageContent()

  const handleAcknowledge = () => {
    if (!signature.trim()) {
      alert('Please enter your digital signature')
      return
    }
    onAcknowledge(page.id, signature)
  }

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-[100%] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[75vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-charcoal line-clamp-1 flex-1 mr-4">{pageContent.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div 
            className="prose max-w-none text-charcoal"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
            onScroll={(e) => {
              const element = e.target
              const threshold = 0.8
              if ((element.scrollTop + element.clientHeight) / element.scrollHeight >= threshold) {
                setHasRead(true)
              }
            }}
          />
        </div>

        {/* Acknowledgment Section */}
        <div className="border-t border-gray-100 p-4 sm:p-8 bg-gradient-to-br from-gray-50/50 to-white flex-shrink-0">
          <div className="space-y-6">
            {!hasRead && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg mobile-hide-header-icons">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-amber-800 text-sm font-medium">
                    Please scroll through the entire document to continue.
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="readConfirm"
                  checked={hasRead}
                  onChange={(e) => setHasRead(e.target.checked)}
                  className="w-5 h-5 text-gold focus:ring-gold focus:ring-2 rounded"
                />
                <label htmlFor="readConfirm" className="text-sm font-medium text-charcoal select-none cursor-pointer">
                  I have read and understand the above information
                </label>
              </div>
            </div>

            {hasRead && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-semibold text-charcoal mb-3">
                    Digital Signature
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-200 text-charcoal font-medium"
                    placeholder="Type your full name to acknowledge"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    By signing below, you acknowledge that you have read and understood this document.
                  </p>
                </div>
                
                <div className="flex justify-between gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcknowledge}
                    disabled={!signature.trim()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                      signature.trim() 
                        ? 'bg-gold text-brand-navy hover:bg-gold/90 shadow-lg hover:shadow-xl' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    I Acknowledge
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default OnboardingSection