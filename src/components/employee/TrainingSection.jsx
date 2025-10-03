import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { QrCode, Play, CheckCircle, Lock, AlertTriangle, FileText, Clock, Camera, Upload, TrendingUp } from 'lucide-react'
import QRCodeDisplay from '../QRCodeDisplay'
import { BrowserMultiFormatReader } from '@zxing/library'
import employeeApiService from '../../services/employeeApiService'
import notificationService from '../../services/notificationService'

const TrainingSection = ({ employeeData, setEmployeeData }) => {
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRModule, setSelectedQRModule] = useState(null)
  const [scannerMode, setScannerMode] = useState('manual') // 'manual' or 'camera'
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)

  // Get completed training modules
  const getCompletedTraining = () => {
    if (!Array.isArray(allTrainingModules) || allTrainingModules.length === 0) {
      return employeeData?.training_assignments?.filter(a => a.status === 'completed') || []
    }
    // Use allTrainingModules which is loaded from database
    const completedModules = allTrainingModules.filter(m => m.assignment_status === 'completed')
    return completedModules
  }

  // Get unlocked training modules (those that have been scanned)
  const getUnlockedTraining = () => {
    if (!Array.isArray(allTrainingModules) || allTrainingModules.length === 0) {
      return employeeData?.training_assignments?.filter(a => a.status === 'unlocked' || a.status === 'in_progress') || []
    }
    // Use allTrainingModules which is loaded from database
    const unlockedModules = allTrainingModules.filter(m => 
      ['unlocked', 'in_progress'].includes(m.assignment_status)
    )
    return unlockedModules
  }

  // Load training modules from API
  const [allTrainingModules, setAllTrainingModules] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadTrainingModules()
  }, [])

  const loadTrainingModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await employeeApiService.getTrainingModules()
      
      if (response.success) {
        // The backend now returns both 'modules' and 'assignments'
        const modules = response.modules || []
        const assignments = response.assignments || []
        
        console.log('Loaded training modules from database:', modules)
        console.log('Training assignments:', assignments)
        
        setAllTrainingModules(modules)
        
        
      } else {
        console.error('Failed to load training modules:', response.error)
        setError(response.error || 'Failed to load training modules')
        notificationService.showError(response.error || 'Failed to load training modules')
      }
    } catch (error) {
      console.error('Error loading training modules:', error)
      setError('Failed to load training modules')
      notificationService.showError('Failed to load training modules')
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async () => {
    try {
      setLoading(true)
      const code = scannedCode.trim().toUpperCase()
      
      console.log('Attempting to unlock training module with QR code:', code)
      
      if (!code) {
        notificationService.showError('Please enter a QR code')
        return
      }
      
      const response = await employeeApiService.unlockTrainingModule(code)
      
      console.log('QR unlock response:', response)
      
      if (response.success) {
        const moduleName = response.assignment?.module?.title || response.module?.title || 'Training module'
        notificationService.showSuccess(`Training module "${moduleName}" has been unlocked!`)
        
        // Reload training modules from database to get updated status
        await loadTrainingModules()
        
        // Update employee data if setEmployeeData is available
        if (setEmployeeData) {
          const profileResponse = await employeeApiService.getEmployeeProfile()
          if (profileResponse.success) {
            setEmployeeData(profileResponse.employee || profileResponse.data)
          }
        }
        
        // Trigger dashboard refresh if available
        if (window.refreshDashboardStats) {
          window.refreshDashboardStats()
        }
      } else {
        const errorMessage = response.error || 'Invalid QR code. Please try again.'
        console.error('QR unlock failed:', errorMessage)
        notificationService.showError(errorMessage)
      }
    } catch (error) {
      console.error('Error scanning QR code:', error)
      const errorMessage = error.message || 'Failed to scan QR code'
      notificationService.showError(errorMessage)
    } finally {
      setLoading(false)
    }
    
    setScannedCode('')
    setShowQRScanner(false)
  }

  const updateEmployeeData = async (updatedEmployee) => {
    try {
      // Update via API if needed, or just update local state
      if (setEmployeeData) {
        setEmployeeData(updatedEmployee)
      }
      
      // Optionally sync with server
      const response = await employeeApiService.getEmployeeProfile()
      if (response.success && setEmployeeData) {
        setEmployeeData(response.employee || response.data)
      }
    } catch (error) {
      console.error('Error updating employee data:', error)
    }
  }

  const handleCompleteTraining = async (moduleId) => {
    try {
      setLoading(true)
      
      // Calculate time spent (you could track this more accurately)
      const timeSpent = Math.floor(Math.random() * 30) + 15 // Random between 15-45 minutes for demo
      
      
      const response = await employeeApiService.completeTrainingModule(moduleId, {
        timeSpent,
        video_watched: true,
        content_reviewed: true
      })
      
      if (response.success) {
        notificationService.showSuccess('Training module completed successfully!')
        
        // Reload training modules from database
        await loadTrainingModules()
        
        // Refresh employee profile data
        if (setEmployeeData) {
          const profileResponse = await employeeApiService.getEmployeeProfile()
          if (profileResponse.success) {
            setEmployeeData(profileResponse.employee || profileResponse.data)
          }
        }
        
        // Trigger dashboard refresh if available
        if (window.refreshDashboardStats) {
          window.refreshDashboardStats()
        }
        
        
      } else {
        notificationService.showError(response.error || 'Failed to complete training')
      }
    } catch (error) {
      console.error('Error completing training:', error)
      notificationService.showError('Failed to complete training: ' + error.message)
    } finally {
      setLoading(false)
    }
    
    setShowVideoModal(false)
    setSelectedTraining(null)
  }

  const isModuleUnlocked = (moduleId) => {
    // Check both from loaded modules and employee data for reliability
    const module = allTrainingModules.find(m => m.id === moduleId)
    if (module && ['unlocked', 'in_progress', 'completed'].includes(module.assignment_status)) {
      return true
    }
    return employeeData?.training_assignments?.some(a => 
      a.module_id === moduleId && (a.status === 'unlocked' || a.status === 'in_progress' || a.status === 'completed')
    ) || false
  }

  const isModuleCompleted = (moduleId) => {
    // Check both from loaded modules and employee data for reliability
    const module = allTrainingModules.find(m => m.id === moduleId)
    if (module && module.assignment_status === 'completed') {
      return true
    }
    return employeeData?.training_assignments?.some(a => 
      a.module_id === moduleId && a.status === 'completed'
    ) || false
  }

  const getCompletionDate = (moduleId) => {
    // Check both from loaded modules and employee data for reliability
    const module = allTrainingModules.find(m => m.id === moduleId)
    if (module && module.completed_at) {
      return module.completed_at
    }
    const assignment = employeeData?.training_assignments?.find(a => 
      a.module_id === moduleId && a.status === 'completed'
    )
    return assignment ? assignment.completed_at : null
  }

  const completedCount = getCompletedTraining().length
  const unlockedCount = getUnlockedTraining().length

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading training modules...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-red-800 font-medium">Failed to load training modules</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={loadTrainingModules}
                className="mt-2 text-blue-600 text-sm underline hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Instructions */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-6">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-gold/20 backdrop-blur-sm rounded-lg flex-shrink-0 mobile-hide-hero-icon">
                <QrCode className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Training Instructions</h3>
                <p className="text-cream/80 text-xs mb-4 leading-relaxed">
                  Access training modules by scanning QR codes located throughout the restaurant. 
                  Each training station has a unique code that unlocks specific content.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQRScanner(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gold text-brand-navy rounded-lg text-sm font-medium hover:bg-gold/90 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto sm:flex-shrink-0"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Training Progress Dashboard */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-purple-100 training-header-mobile">
          <h3 className="text-2xl font-bold text-charcoal flex items-center gap-3 mobile-section-header">
            <div className="p-2 bg-purple-100 rounded-xl mobile-hide-section-header-icon">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            Training Progress
          </h3>
        </div>
        
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100/50 rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-charcoal mb-1">{allTrainingModules.length}</p>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Modules</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                <span>Available for training</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-xl shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{unlockedCount}</p>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Unlocked</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-md">
                  <Lock className="w-6 h-6 text-white transform rotate-180" />
                </div>
              </div>
              <div className="flex items-center text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>Ready to start</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-green-600 mb-1">{completedCount}</p>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Completed</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Certification earned</span>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-charcoal text-lg">Overall Progress</h4>
              <span className="text-2xl font-bold text-charcoal">
                {allTrainingModules.length > 0 ? Math.round((completedCount / allTrainingModules.length) * 100) : 0}%
              </span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden" 
                  style={{ width: `${allTrainingModules.length > 0 ? (completedCount / allTrainingModules.length) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-sm text-gray-600">
              <span>Start your journey</span>
              <span>Become certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Training Modules */}
      <div className="space-y-6">
        <div className="training-modules-header">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold text-charcoal flex items-center gap-3 mobile-section-header training-modules-title flex-1">
              <div className="p-2 bg-indigo-100 rounded-xl mobile-hide-section-header-icon">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              Available Training Modules
            </h3>
            <div className="text-sm text-gray-500 training-modules-count flex-shrink-0">
              {allTrainingModules.length} modules available
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 training-modules-grid">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading training modules...</span>
            </div>
          ) : allTrainingModules.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Modules Available</h3>
                <p className="text-gray-600">No training modules have been assigned to you yet. Please contact your administrator.</p>
              </div>
            </div>
          ) : (
            allTrainingModules.map((module) => {
              // Use the assignment_status from database if available, otherwise check employee data
              const assignmentStatus = module.assignment_status || 'not_assigned'
              const isUnlocked = ['unlocked', 'in_progress', 'completed'].includes(assignmentStatus) || isModuleUnlocked(module.id)
              const isCompleted = assignmentStatus === 'completed' || isModuleCompleted(module.id)
              const completionDate = module.completed_at || getCompletionDate(module.id)
            
            return (
              <div key={module.id} className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Status Bar */}
                <div className={`h-1 bg-gradient-to-r ${
                  isCompleted 
                    ? 'from-green-400 to-emerald-500' 
                    : isUnlocked 
                      ? 'from-blue-400 to-indigo-500' 
                      : 'from-gray-300 to-gray-400'
                }`} />
                
                <div className="p-4 md:p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    {/* Status Icon */}
                    <div className={`p-2 md:p-3 rounded-xl shadow-md transition-all duration-200 flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200' 
                        : isUnlocked 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200' 
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                      ) : isUnlocked ? (
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                      ) : (
                        <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-charcoal mb-1 line-clamp-2">{module.title}</h4>
                      <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
                        {isCompleted 
                          ? `Completed on ${new Date(completionDate).toLocaleDateString()}`
                          : isUnlocked 
                            ? 'Ready to start training'
                            : 'Scan QR code to unlock'
                        }
                      </p>
                      
                      {/* Duration info */}
                        <div className="flex items-center gap-1 text-blue-600 text-xs mb-2">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{typeof module.duration === 'number' ? `${module.duration} minutes` : module.duration}</span>
                        </div>
                      
                      {isCompleted && completionDate && (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-medium">
                            Completed {new Date(completionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* QR Code Section for Locked Modules */}
                  {!isUnlocked && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">Scan QR to Unlock</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{module.qr_code || module.qrCode}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedQRModule(module)
                            setShowQRModal(true)
                          }}
                          className="ml-3 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Show QR
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Area - Bottom */}
                  <div className="mt-auto flex justify-between items-center">
                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : isUnlocked 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                    
                    {/* Action Button */}
                    {!isUnlocked ? (
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <QrCode className="w-3 h-3" />
                        <span className="hidden sm:inline">Scan</span>
                      </button>
                    ) : !isCompleted ? (
                      <button
                        onClick={async () => {
                          try {
                            // Fetch content to mark as in_progress and start a progress session on the server
                            await employeeApiService.getTrainingModuleContent(module.id)
                          } catch (e) {
                            console.warn('Could not load module content before starting:', e)
                          }
                          setSelectedTraining(module)
                          setShowVideoModal(true)
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Play className="w-3 h-3" />
                        <span className="hidden sm:inline">Start</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // Safe to call as well; backend will allow for completed modules, no-op for progress
                            await employeeApiService.getTrainingModuleContent(module.id)
                          } catch (e) {
                            // ignore
                          }
                          setSelectedTraining(module)
                          setShowVideoModal(true)
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="hidden sm:inline">Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          onClose={() => {
            setShowQRScanner(false)
            setScannedCode('')
            setScannerMode('manual')
            setIsScanning(false)
          }}
          onScan={handleQRScan}
          scannedCode={scannedCode}
          setScannedCode={setScannedCode}
        />
      )}

      {/* Video/Content Modal */}
      {showVideoModal && selectedTraining && (
        <TrainingVideoModal
          module={selectedTraining}
          isCompleted={isModuleCompleted(selectedTraining.id)}
          onClose={() => {
            setShowVideoModal(false)
            setSelectedTraining(null)
          }}
          onComplete={() => handleCompleteTraining(selectedTraining.id)}
        />
      )}

      {/* QR Code Display Modal */}
      {showQRModal && selectedQRModule && (
        <QRDisplayModal
          module={selectedQRModule}
          onClose={() => {
            setShowQRModal(false)
            setSelectedQRModule(null)
          }}
        />
      )}
    </div>
  )
}

// Helper function to convert video URLs to embeddable format
const getEmbeddableVideoUrl = (url) => {
  if (!url) return null
  
  console.log('Converting video URL:', url)
  
  // YouTube URL patterns - improved to handle youtu.be links better
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
    console.log('YouTube video ID extracted:', videoId)
    console.log('Generated embed URL:', embedUrl)
    return embedUrl
  }
  
  // Vimeo URL patterns
  const vimeoRegex = /vimeo\.com\/(?:channels\/[A-z]+\/)?([0-9]+)/
  const vimeoMatch = url.match(vimeoRegex)
  
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return `https://player.vimeo.com/video/${videoId}`
  }
  
  // If it's already an embed URL or direct video file, return as-is
  if (url.includes('/embed/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
    return url
  }
  
  // For other URLs, try to use them directly (might work for some platforms)
  return url
}

// Helper function to check if URL is a direct video file
const isDirectVideoUrl = (url) => {
  if (!url) return false
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.endsWith('.avi') || url.endsWith('.mov')
}

// Training Video Modal Component
const TrainingVideoModal = ({ module, isCompleted, onClose, onComplete }) => {
  const [hasWatchedVideo, setHasWatchedVideo] = useState(isCompleted)
  // Handle both videoUrl and video_url from database
  const videoUrl = module.video_url || module.videoUrl
  const embeddableVideoUrl = getEmbeddableVideoUrl(videoUrl)
  const isDirectVideo = isDirectVideoUrl(videoUrl)
  
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
          <h3 className="text-lg sm:text-xl font-semibold text-charcoal line-clamp-1 flex-1 mr-4">{module.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Video Section */}
          {videoUrl && (
            <div>
              <h4 className="font-medium text-charcoal mb-3">Training Video</h4>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {isDirectVideo ? (
                  <video
                    width="100%"
                    height="100%"
                    controls
                    className="rounded-lg object-cover"
                    preload="metadata"
                    onLoadedData={() => setHasWatchedVideo(true)}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/webm" />
                    <source src={videoUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                ) : embeddableVideoUrl ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={embeddableVideoUrl}
                    title={module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-lg"
                    loading="lazy"
                    onLoad={() => setHasWatchedVideo(true)}
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Unable to display video</p>
                      <p className="text-xs mt-1">
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Open video in new tab
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <strong>Video URL:</strong> 
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  {videoUrl}
                </a>
              </div>
            </div>
          )}

          {/* Text Content */}
          <div>
            <h4 className="font-medium text-charcoal mb-3">Training Material</h4>
            <div 
              className="prose max-w-none text-charcoal bg-gray-50 p-4 rounded-lg"
              dangerouslySetInnerHTML={{ __html: module.content }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 flex-shrink-0">
          {!isCompleted && (
            <div className="space-y-4">
              {!hasWatchedVideo && videoUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    Please watch the video and review the material before completing the training.
                  </p>
                </div>
              )}
              
              {!videoUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">
                    Please review the training material below and click "Mark as Completed" when finished.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={onComplete}
                  disabled={videoUrl && !hasWatchedVideo}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          )}
          
          {isCompleted && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Training Completed</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// QR Scanner Modal Component
const QRScannerModal = ({ onClose, onScan, scannedCode, setScannedCode }) => {
  const [scannerMode, setScannerMode] = useState('manual')
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)

  useEffect(() => {
    if (scannerMode === 'camera' && isScanning) {
      startCameraScanning()
    }
    return () => {
      stopCameraScanning()
    }
  }, [scannerMode, isScanning])

  const startCameraScanning = async () => {
    try {
      setCameraError(null)
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices()
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found')
      }

      const selectedDeviceId = videoInputDevices[0].deviceId
      
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            setScannedCode(result.getText())
            stopCameraScanning()
            setScannerMode('manual')
            setIsScanning(false)
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error(error)
          }
        }
      )
    } catch (error) {
      console.error('Error starting camera:', error)
      setCameraError(error.message || 'Failed to access camera')
      setIsScanning(false)
      setScannerMode('manual')
    }
  }

  const stopCameraScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
  }

  const handleScanModeChange = (mode) => {
    setScannerMode(mode)
    if (mode === 'camera') {
      setIsScanning(true)
    } else {
      setIsScanning(false)
      stopCameraScanning()
    }
  }

  const handleScan = () => {
    onScan()
    onClose()
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
      <div className="bg-white rounded-lg shadow-xl w-[90%] sm:w-full sm:max-w-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-charcoal">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => handleScanModeChange('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              scannerMode === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Manual Entry
          </button>
          <button
            onClick={() => handleScanModeChange('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              scannerMode === 'camera'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera Scan
          </button>
        </div>

        {/* Manual Entry Mode */}
        {scannerMode === 'manual' && (
          <div>
            <p className="text-sm text-charcoal/70 mb-4">
              Enter the QR code from the training station:
            </p>
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value.trim())}
              placeholder="Enter QR code (e.g., TRAIN_FOOD_SAFETY_001)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && scannedCode.trim()) {
                  handleQRScan()
                }
              }}
            />
          </div>
        )}

        {/* Camera Scan Mode */}
        {scannerMode === 'camera' && (
          <div className="mb-4">
            {cameraError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-800 text-sm mb-2">Camera Error</p>
                <p className="text-red-600 text-xs">{cameraError}</p>
                <button
                  onClick={() => handleScanModeChange('manual')}
                  className="mt-2 text-blue-600 text-sm underline"
                >
                  Switch to manual entry
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-charcoal/70 mb-3 text-center">
                  {isScanning ? 'Position QR code in camera view' : 'Preparing camera...'}
                </p>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scanned Code Display */}
        {scannedCode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Scanned Code:</p>
            <p className="font-mono text-green-700">{scannedCode}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={!scannedCode.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed order-1 sm:order-2"
          >
            Unlock Training
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// QR Display Modal Component
const QRDisplayModal = ({ module, onClose }) => {
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
      <div className="bg-white rounded-lg shadow-xl w-[90%] sm:w-full sm:max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-charcoal">Training QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Module Info */}
          <div className="text-center">
            <h4 className="font-medium text-charcoal mb-2">{module.title}</h4>
            <p className="text-sm text-gray-600 mb-4">{module.description}</p>
            <div className="flex items-center justify-center gap-2 text-blue-600 text-sm mb-4">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{module.duration}</span>
            </div>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center bg-gray-50 rounded-lg p-6">
            <QRCodeDisplay data={module.qr_code || module.qrCode} size={200} />
          </div>
          
          {/* QR Code Text */}
          <div className="text-center">
            <p className="text-xs font-medium text-gray-700 mb-1">QR Code:</p>
            <p className="text-sm font-mono text-gray-800 bg-gray-100 px-3 py-2 rounded border break-all">
              {module.qr_code || module.qrCode}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TrainingSection
