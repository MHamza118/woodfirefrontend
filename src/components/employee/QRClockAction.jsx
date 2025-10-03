import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentLocation } from '../../utils/locationVerification'
import { 
  processClockIn, 
  processClockOut, 
  getEmployeeClockStatus,
  getCurrentTimeEntry 
} from '../../services/timeTrackingService'

const QRClockAction = () => {
  const { action } = useParams() // 'clock-in' or 'clock-out'
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [locationInfo, setLocationInfo] = useState(null)
  const [employeeData, setEmployeeData] = useState(null)

  // Get employee data from local storage based on logged-in user
  useEffect(() => {
    if (user) {
      // In a real system, this would come from the API
      // For now, we'll use the user data as employee data
      setEmployeeData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        location: user.location
      })
    }
  }, [user])

  // Check location on component mount
  useEffect(() => {
    const location = getCurrentLocation()
    setLocationInfo(location)
  }, [])

  // Process the QR action automatically when component mounts
  useEffect(() => {
    if (employeeData && locationInfo && !isProcessing && !result) {
      handleClockAction()
    }
  }, [employeeData, locationInfo, action])

  const handleClockAction = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    
    try {
      let actionResult
      
      if (action === 'clock-in') {
        actionResult = await processClockIn(employeeData, 'CLOCK_IN_RESTAURANT_GENERAL')
      } else if (action === 'clock-out') {
        actionResult = await processClockOut(employeeData, 'CLOCK_OUT_RESTAURANT_GENERAL')
      } else {
        actionResult = {
          success: false,
          error: 'Invalid QR code action. Please use a valid clock-in or clock-out QR code.',
          errorType: 'INVALID_ACTION'
        }
      }
      
      setResult(actionResult)
      
    } catch (error) {
      setResult({
        success: false,
        error: `Clock operation failed: ${error.message}`,
        errorType: 'SYSTEM_ERROR'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoToDashboard = () => {
    navigate('/employee/dashboard')
  }

  const handleRetry = () => {
    setResult(null)
    setIsProcessing(false)
    // Re-trigger the action
    setTimeout(() => {
      handleClockAction()
    }, 100)
  }

  const getActionTitle = () => {
    return action === 'clock-in' ? 'Clock In' : 'Clock Out'
  }

  const getActionIcon = () => {
    return action === 'clock-in' ? 'text-green-600' : 'text-red-600'
  }

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-8 h-8 text-gold animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Processing {getActionTitle()}</h2>
          <p className="text-charcoal/60">Please wait while we process your request...</p>
        </div>
      </div>
    )
  }

  // Show result
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result?.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result?.success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-charcoal mb-2">
            {getActionTitle()} {result?.success ? 'Successful' : 'Failed'}
          </h2>
        </div>

        {/* Result Message */}
        <div className={`border rounded-lg p-4 mb-6 ${
          result?.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`font-medium ${
            result?.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result?.message || result?.error}
          </p>
          
          {result?.success && result?.requiresApproval && result?.timeEntry && (
            <div className="mt-2">
              {result.timeEntry.approvalReason === 'LATE_CLOCK_IN' ? (
                <div className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  <p className="font-medium">You're late—notify manager reason.</p>
                  <p className="text-xs mt-1">Manager approval has been requested for your late clock-in.</p>
                </div>
              ) : (
                <p className="text-sm text-yellow-700">
                  Manager approval required for early clock-in
                </p>
              )}
            </div>
          )}
          
          {result?.success && result?.hoursWorked && (
            <p className="text-sm text-green-700 mt-2">
              Hours worked: {result.hoursWorked}
            </p>
          )}
        </div>

        {/* Employee Info */}
        {employeeData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-charcoal mb-2">Employee Information</h4>
            <div className="text-sm text-charcoal/70 space-y-1">
              <p>Name: {employeeData.name}</p>
              <p>ID: {employeeData.id}</p>
              <p>Time: {new Date().toLocaleString()}</p>
              {locationInfo?.verified && (
                <p>Location: {locationInfo.locationName}</p>
              )}
            </div>
          </div>
        )}

        {/* Location Status */}
        {locationInfo && (
          <div className={`flex items-center gap-3 p-3 rounded-lg border mb-6 ${
            locationInfo.verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              locationInfo.verified ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">Network Status</p>
              <p className={`text-xs ${
                locationInfo.verified ? 'text-green-700' : 'text-red-700'
              }`}>
                {locationInfo.verified 
                  ? `On-site: ${locationInfo.locationName}` 
                  : 'Not on restaurant network'
                }
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-brand-navy text-white py-3 px-4 rounded-lg font-medium hover:bg-brand-navy/90 transition-colors"
          >
            Go to Dashboard
          </button>
          
          {!result?.success && (
            <button
              onClick={handleRetry}
              className="w-full bg-gray-100 text-charcoal py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Additional Info for Errors */}
        {!result?.success && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Troubleshooting:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {!user && <li>• Make sure you are logged in to the system</li>}
              {!locationInfo?.verified && <li>• Ensure you are connected to the restaurant network</li>}
              {result?.errorType === 'ALREADY_CLOCKED_IN' && <li>• You are already clocked in. Use clock-out QR code instead.</li>}
              {result?.errorType === 'NOT_CLOCKED_IN' && <li>• You are not currently clocked in. Use clock-in QR code first.</li>}
              {result?.errorType === 'NO_SHIFT_SCHEDULED' && <li>• Contact your manager about today's schedule</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRClockAction
