import { useState, useEffect } from 'react'
import QRCodeSVG from 'react-qr-code'
import { Clock, Play, Pause, MapPin, Wifi, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { getCurrentLocation, isOnRestaurantNetwork } from '../../utils/locationVerification'
import { 
  processClockIn, 
  processClockOut, 
  getEmployeeClockStatus,
  getCurrentTimeEntry 
} from '../../services/timeTrackingService'
import { useAuth } from '../../contexts/AuthContext'

const ClockInOutSystem = ({ employeeData, onStatusChange }) => {
  const { user } = useAuth()
  const [clockStatus, setClockStatus] = useState(null)
  const [locationInfo, setLocationInfo] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(null)
  const [currentTimeEntry, setCurrentTimeEntry] = useState(null)

  // Load employee clock status
  useEffect(() => {
    if (employeeData) {
      const status = getEmployeeClockStatus(employeeData.id)
      setClockStatus(status)
      
      if (status.isCurrentlyClocked) {
        const timeEntry = getCurrentTimeEntry(employeeData)
        setCurrentTimeEntry(timeEntry)
      }
    }
  }, [employeeData])

  // Check location status
  useEffect(() => {
    const checkLocation = () => {
      const location = getCurrentLocation()
      setLocationInfo(location)
    }
    
    checkLocation()
    const interval = setInterval(checkLocation, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Handle QR code scan
  const handleQRScan = async (qrData) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setShowResult(null)

    try {
      let result
      
      if (qrData === 'CLOCK_IN_RESTAURANT_GENERAL') {
        result = await processClockIn(employeeData, qrData)
      } else if (qrData === 'CLOCK_OUT_RESTAURANT_GENERAL') {
        result = await processClockOut(employeeData, qrData)
      } else {
        result = {
          success: false,
          error: 'Invalid QR code. Please use the correct clock-in/out QR code.',
          errorType: 'INVALID_QR'
        }
      }

      setShowResult(result)
      
      if (result.success) {
        // Update local state
        const newStatus = getEmployeeClockStatus(employeeData.id)
        setClockStatus(newStatus)
        
        if (newStatus.isCurrentlyClocked) {
          const timeEntry = getCurrentTimeEntry(employeeData)
          setCurrentTimeEntry(timeEntry)
        } else {
          setCurrentTimeEntry(null)
        }
        
        // Notify parent component
        if (onStatusChange) {
          onStatusChange(newStatus)
        }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowResult(null)
        }, 3000)
      }
      
    } catch (error) {
      setShowResult({
        success: false,
        error: `Clock operation failed: ${error.message}`,
        errorType: 'SYSTEM_ERROR'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Dismiss result message
  const dismissResult = () => {
    setShowResult(null)
  }

  const isOnSite = locationInfo?.verified || false
  const isLoggedIn = !!user && !!employeeData
  const canUseClock = isLoggedIn && isOnSite

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-navy rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Time Clock</h3>
            <p className="text-sm text-charcoal/60">Scan QR code to clock in/out</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            clockStatus?.isCurrentlyClocked ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span className="text-sm font-medium text-charcoal">
            {clockStatus?.isCurrentlyClocked ? 'Clocked In' : 'Not Clocked In'}
          </span>
        </div>
      </div>

      {/* Prerequisites Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Login Status */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          isLoggedIn 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isLoggedIn ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal">Login Status</p>
            <p className={`text-xs ${
              isLoggedIn ? 'text-green-700' : 'text-red-700'
            } truncate`}>
              {isLoggedIn ? `Logged in as ${user.name}` : 'Not logged in'}
            </p>
          </div>
        </div>

        {/* Network Status */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          isOnSite 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isOnSite ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal">Network Status</p>
            <p className={`text-xs ${
              isOnSite ? 'text-green-700' : 'text-red-700'
            } truncate`}>
              {isOnSite 
                ? `On-site: ${locationInfo?.locationName}` 
                : 'Not on restaurant network'
              }
            </p>
          </div>
          <Wifi className={`w-4 h-4 ${
            isOnSite ? 'text-green-600' : 'text-red-600'
          } flex-shrink-0`} />
        </div>
      </div>

      {/* Current Status Banner */}
      {clockStatus?.isCurrentlyClocked && currentTimeEntry && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-green-800 mb-1 text-base">Currently Clocked In</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Started at: {currentTimeEntry.clockInTime}</p>
                {currentTimeEntry.scheduledShift && (
                  <p className="truncate">Scheduled shift: {currentTimeEntry.scheduledShift.startTime} - {currentTimeEntry.scheduledShift.endTime}</p>
                )}
                {currentTimeEntry.status === 'PENDING_APPROVAL' && (
                  <p className="text-yellow-700 flex items-start gap-1">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Waiting for manager approval</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {showResult && (
        <div className={`border rounded-lg p-4 mb-6 ${
          showResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {showResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-base ${
                showResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {showResult.message || showResult.error}
              </p>
              
              {showResult.success && showResult.requiresApproval && (
                <p className="text-sm text-yellow-700 mt-1">
                  Manager approval required for early/late clock-in
                </p>
              )}
              
              {showResult.success && showResult.hoursWorked && (
                <p className="text-sm text-green-700 mt-1">
                  Hours worked: {showResult.hoursWorked}
                </p>
              )}
            </div>
            <button
              onClick={dismissResult}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* QR Codes */}
      <div className="grid grid-cols-2 gap-6">
        {/* Clock In QR */}
        <div className="text-center">
          <div className="mb-4">
            <h4 className="font-semibold text-charcoal mb-2 flex items-center justify-center gap-2 text-base">
              <Play className="w-4 h-4 text-green-600" />
              Clock In
            </h4>
          </div>
          
          <div className={`bg-white p-4 rounded-lg border-2 inline-block ${
            canUseClock && !clockStatus?.isCurrentlyClocked 
              ? 'border-green-200 hover:border-green-300 cursor-pointer' 
              : 'border-gray-200 opacity-50'
          }`}
          onClick={() => {
            if (canUseClock && !clockStatus?.isCurrentlyClocked && !isProcessing) {
              handleQRScan('CLOCK_IN_RESTAURANT_GENERAL')
            }
          }}
          >
            <QRCodeSVG
              value={`${window.location.origin}/qr/clock-in`}
              size={150}
              level="M"
              includeMargin={false}
            />
          </div>
          
          <p className="text-xs text-charcoal/60 mt-2">
            Scan to start your shift
          </p>
          
          {!canUseClock && (
            <p className="text-xs text-red-600 mt-1">
              {!isLoggedIn ? 'Login required' : 'Must be on restaurant network'}
            </p>
          )}
          
          {clockStatus?.isCurrentlyClocked && (
            <p className="text-xs text-yellow-600 mt-1">
              Already clocked in
            </p>
          )}
        </div>

        {/* Clock Out QR */}
        <div className="text-center">
          <div className="mb-4">
            <h4 className="font-semibold text-charcoal mb-2 flex items-center justify-center gap-2 text-base">
              <Pause className="w-4 h-4 text-red-600" />
              Clock Out
            </h4>
          </div>
          
          <div className={`bg-white p-4 rounded-lg border-2 inline-block ${
            canUseClock && clockStatus?.isCurrentlyClocked 
              ? 'border-red-200 hover:border-red-300 cursor-pointer' 
              : 'border-gray-200 opacity-50'
          }`}
          onClick={() => {
            if (canUseClock && clockStatus?.isCurrentlyClocked && !isProcessing) {
              handleQRScan('CLOCK_OUT_RESTAURANT_GENERAL')
            }
          }}
          >
            <QRCodeSVG
              value={`${window.location.origin}/qr/clock-out`}
              size={150}
              level="M"
              includeMargin={false}
            />
          </div>
          
          <p className="text-xs text-charcoal/60 mt-2">
            Scan to end your shift
          </p>
          
          {!canUseClock && (
            <p className="text-xs text-red-600 mt-1">
              {!isLoggedIn ? 'Login required' : 'Must be on restaurant network'}
            </p>
          )}
          
          {!clockStatus?.isCurrentlyClocked && (
            <p className="text-xs text-yellow-600 mt-1">
              {clockStatus === null ? 'Loading...' : 'Not clocked in'}
            </p>
          )}
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Processing...</span>
        </div>
      )}

    </div>
  )
}

export default ClockInOutSystem