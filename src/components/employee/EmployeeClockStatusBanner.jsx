import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertTriangle, Calendar, MapPin, Play, Pause } from 'lucide-react'
import { 
  getEmployeeClockStatus, 
  getCurrentTimeEntry, 
  getCurrentDaySchedule 
} from '../../services/timeTrackingService'

const EmployeeClockStatusBanner = ({ employeeData, onClockAction }) => {
  const [clockStatus, setClockStatus] = useState(null)
  const [currentTimeEntry, setCurrentTimeEntry] = useState(null)
  const [todayShifts, setTodayShifts] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

  // Load clock status and schedule data
  useEffect(() => {
    if (!employeeData) return

    const loadData = () => {
      const status = getEmployeeClockStatus(employeeData.id)
      setClockStatus(status)

      if (status?.isCurrentlyClocked) {
        const timeEntry = getCurrentTimeEntry(employeeData)
        setCurrentTimeEntry(timeEntry)
      } else {
        setCurrentTimeEntry(null)
      }

      const shifts = getCurrentDaySchedule(employeeData)
      setTodayShifts(shifts)
    }

    loadData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [employeeData])

  // Calculate elapsed time since clock-in
  const getElapsedTime = () => {
    if (!currentTimeEntry?.clockInTime) return null
    
    const [hours, minutes] = currentTimeEntry.clockInTime.split(':').map(Number)
    const clockInTime = new Date(currentTime)
    clockInTime.setHours(hours, minutes, 0, 0)
    
    const elapsed = Math.floor((currentTime - clockInTime) / (1000 * 60))
    const elapsedHours = Math.floor(elapsed / 60)
    const elapsedMinutes = elapsed % 60
    
    return { hours: elapsedHours, minutes: elapsedMinutes, total: elapsed }
  }

  // Get next shift info
  const getNextShiftInfo = () => {
    if (todayShifts.length === 0) return null
    
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    
    for (const shift of todayShifts) {
      const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number)
      const shiftStart = shiftHour * 60 + shiftMinute
      
      if (shiftStart > now) {
        return shift
      }
    }
    
    return todayShifts[0] // Return first shift if all have passed (for next day)
  }

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const elapsedTime = getElapsedTime()
  const nextShift = getNextShiftInfo()

  if (!employeeData) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Currently Clocked In Banner */}
      {clockStatus?.isCurrentlyClocked ? (
        <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 shadow-sm">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-start gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-green-800 leading-none">You're Clocked In</h3>
                </div>
                
                <div className="space-y-1 text-sm text-green-700">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Started at {currentTimeEntry ? formatTime(currentTimeEntry.clockInTime) : 'Unknown'}</span>
                  </p>
                  
                  {elapsedTime && (
                    <p className="flex items-center gap-2">
                      <Play className="w-4 h-4 flex-shrink-0" />
                      <span>Working for {elapsedTime.hours}h {elapsedTime.minutes}m</span>
                    </p>
                  )}
                  
                  {currentTimeEntry?.scheduledShift && (
                    <p className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">
                        Scheduled: {formatTime(currentTimeEntry.scheduledShift.startTime)} - {formatTime(currentTimeEntry.scheduledShift.endTime)}
                      </span>
                    </p>
                  )}
                  
                  {currentTimeEntry?.status === 'PENDING_APPROVAL' && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-100 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-yellow-800 text-xs break-words">
                        Waiting for manager approval due to {currentTimeEntry.approvalReason === 'EARLY_CLOCK_IN' ? 'early' : 'late'} clock-in
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-green-800">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-green-600">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <button
              onClick={() => onClockAction?.('clock_out')}
              className="bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium flex items-center gap-2 w-auto justify-center"
            >
              <Pause className="w-4 h-4" />
              Clock Out
            </button>
          </div>
        </div>
      ) : (
        /* Not Clocked In Banner */
        <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 shadow-sm">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-start gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-800 leading-none">You're Not Clocked In</h3>
                </div>
                
                <div className="space-y-1 text-sm text-gray-700">
                  {nextShift ? (
                    <>
                      <p className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          Next shift: {formatTime(nextShift.startTime)} - {formatTime(nextShift.endTime)}
                        </span>
                      </p>
                      
                      <p className="flex items-start gap-2 text-blue-600">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">
                          {nextShift.source === 'manual_schedule' ? 'Manual Schedule' : `${nextShift.shiftType} shift`}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-yellow-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>No shifts scheduled for today</span>
                    </p>
                  )}
                  
                  {clockStatus?.lastClockOut && (
                    <p className="flex items-start gap-2 text-gray-600">
                      <Pause className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="truncate">Last clocked out at {formatTime(clockStatus.lastClockOut)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-gray-800">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-gray-600">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
          
          {/* QR Clock-In Reminder */}
          {nextShift && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Play className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-blue-800 break-words">
                    Use QR code to clock in for your shift
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shift Task Popup - Only show when clocked in */}
      {clockStatus?.isCurrentlyClocked && currentTimeEntry && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-blue-800 text-sm mb-1">Shift Tasks</h4>
              <p className="text-blue-700 text-xs break-words">
                Don't forget to complete your opening/closing checklists and any assigned tasks for this shift.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-xs underline mt-1 break-words">
                View shift tasks →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeClockStatusBanner