import { useState, useEffect } from 'react'
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  MapPin,
  Eye,
  User,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react'
import { 
  getPendingApprovalRequests, 
  processApprovalRequest, 
  getEmployeeTimeEntries,
  getEmployeeClockStatus 
} from '../../services/timeTrackingService'
import {
  getPendingAvailabilityChangeRequests,
  processAvailabilityChangeApproval
} from '../../services/availabilityChangeService'
import { useAuth } from '../../contexts/AuthContext'

const TimeTrackingManagement = () => {
  const { user } = useAuth()
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [pendingAvailabilityChanges, setPendingAvailabilityChanges] = useState([])
  const [liveRoster, setLiveRoster] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [timeEntries, setTimeEntries] = useState([])
  const [activeTab, setActiveTab] = useState('approvals') // 'approvals', 'roster', 'reports'
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [reportType, setReportType] = useState('timeEntries') // 'timeEntries', 'plannedVsActual', 'lateEarly', 'forgotClockOut'
  const [plannedVsActualData, setPlannedVsActualData] = useState([])
  const [lateEarlyEvents, setLateEarlyEvents] = useState([])
  const [forgotClockOutData, setForgotClockOutData] = useState([])
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    // Load pending approvals
    const approvals = getPendingApprovalRequests()
    setPendingApprovals(approvals)
    
    // Load pending availability changes
    const availabilityChanges = getPendingAvailabilityChangeRequests()
    setPendingAvailabilityChanges(availabilityChanges)

    // Load employees and their clock status
    const employeeData = JSON.parse(localStorage.getItem('employees') || '[]')
    const activeEmployees = employeeData.filter(emp => emp.status === 'ACTIVE')
    setEmployees(activeEmployees)

    // Load live roster (currently clocked in employees)
    const roster = activeEmployees.map(emp => {
      const clockStatus = getEmployeeClockStatus(emp.id)
      return {
        ...emp,
        clockStatus,
        isCurrentlyClocked: clockStatus.isCurrentlyClocked
      }
    }).filter(emp => emp.isCurrentlyClocked)
    
    setLiveRoster(roster)
  }

  // Process approval
  const handleApproval = async (requestId, approved, notes = '') => {
    try {
      const result = processApprovalRequest(requestId, approved, user.id, notes)
      
      if (result.success) {
        // Refresh data
        loadData()
        
        // Show success message
        alert(`Request ${approved ? 'approved' : 'denied'} successfully`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error processing approval: ${error.message}`)
    }
  }
  
  // Process availability change approval
  const handleAvailabilityChangeApproval = async (requestId, approved, notes = '') => {
    try {
      const result = processAvailabilityChangeApproval(requestId, approved, user.id, notes)
      
      if (result.success) {
        // Refresh data
        loadData()
        
        // Show success message
        alert(`Availability change ${approved ? 'approved' : 'denied'} successfully`)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error processing availability change: ${error.message}`)
    }
  }

  // Load employee time entries
  const loadEmployeeTimeEntries = (employeeId) => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    const entries = getEmployeeTimeEntries(employeeId, { start: startDate, end: endDate })
    setTimeEntries(entries)
    setSelectedEmployee(employeeId)
  }
  
  // Load planned vs actual report data
  const loadPlannedVsActualReport = (employeeId) => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    
    // Get employee's scheduled shifts
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]')
    const employeeSchedules = schedules.filter(schedule => 
      schedule.employeeId === employeeId &&
      new Date(schedule.date) >= startDate &&
      new Date(schedule.date) <= endDate
    )
    
    // Get actual time entries
    const actualEntries = getEmployeeTimeEntries(employeeId, { start: startDate, end: endDate })
    
    // Compare planned vs actual
    const comparisonData = employeeSchedules.map(schedule => {
      const actualEntry = actualEntries.find(entry => entry.date === schedule.date)
      
      const plannedStart = schedule.startTime
      const plannedEnd = schedule.endTime
      const actualStart = actualEntry?.clockInTime
      const actualEnd = actualEntry?.clockOutTime
      
      // Calculate planned hours
      const plannedHours = calculateHoursDifference(plannedStart, plannedEnd)
      
      // Calculate actual hours
      const actualHours = actualEntry?.totalHours || 0
      
      return {
        date: schedule.date,
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd,
        plannedHours,
        actualHours,
        variance: actualHours - plannedHours,
        status: actualEntry?.status || 'NO_SHOW'
      }
    })
    
    setPlannedVsActualData(comparisonData)
    setSelectedEmployee(employeeId)
  }
  
  // Load late/early events report
  const loadLateEarlyEventsReport = () => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    
    // Get all approval requests in date range
    const allApprovals = JSON.parse(localStorage.getItem('approvalRequests') || '[]')
    const lateEarlyEvents = allApprovals.filter(request => {
      const requestDate = new Date(request.requestedAt)
      return requestDate >= startDate && requestDate <= endDate &&
             (request.reason === 'LATE_CLOCK_IN' || request.reason === 'EARLY_CLOCK_IN')
    }).map(request => {
      const employee = employees.find(emp => emp.id === request.employeeId)
      return {
        ...request,
        employeeName: `${employee?.personalInfo?.firstName || ''} ${employee?.personalInfo?.lastName || ''}`,
        department: employee?.assignments?.departments?.join(', ') || 'Unassigned'
      }
    })
    
    setLateEarlyEvents(lateEarlyEvents)
  }
  
  // Load forgot-to-clock-out resolutions report
  const loadForgotClockOutReport = () => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    
    // Get nudge responses from localStorage
    const nudgeResponses = JSON.parse(localStorage.getItem('nudgeResponses') || '[]')
    const forgotClockOutEvents = nudgeResponses.filter(response => {
      const responseDate = new Date(response.timestamp)
      return responseDate >= startDate && responseDate <= endDate
    }).map(response => {
      const employee = employees.find(emp => emp.id === response.employeeId)
      return {
        ...response,
        employeeName: `${employee?.personalInfo?.firstName || ''} ${employee?.personalInfo?.lastName || ''}`,
        department: employee?.assignments?.departments?.join(', ') || 'Unassigned'
      }
    })
    
    setForgotClockOutData(forgotClockOutEvents)
  }
  
  // Helper function to calculate hours difference
  const calculateHoursDifference = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTotalMinutes = startHours * 60 + startMinutes
    let endTotalMinutes = endHours * 60 + endMinutes
    
    // Handle overnight shifts
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60
    }
    
    return (endTotalMinutes - startTotalMinutes) / 60
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Calculate elapsed time since clock-in
  const getElapsedTime = (clockInTime) => {
    if (!clockInTime) return 'N/A'
    
    const now = new Date()
    const [hours, minutes] = clockInTime.split(':').map(Number)
    const clockIn = new Date(now)
    clockIn.setHours(hours, minutes, 0, 0)
    
    const elapsed = Math.floor((now - clockIn) / (1000 * 60))
    const elapsedHours = Math.floor(elapsed / 60)
    const elapsedMinutes = elapsed % 60
    
    return `${elapsedHours}h ${elapsedMinutes}m`
  }
  
  // Filter roster based on selected filters
  const getFilteredRoster = () => {
    return liveRoster.filter(employee => {
      // Department filter
      if (departmentFilter !== 'all') {
        const empDepts = employee.assignments?.departments || []
        if (!empDepts.includes(departmentFilter)) return false
      }
      
      // Role filter
      if (roleFilter !== 'all') {
        const empRole = employee.personalInfo?.position || ''
        if (empRole !== roleFilter) return false
      }
      
      // Area filter
      if (areaFilter !== 'all') {
        const empArea = employee.assignments?.areas || []
        if (!empArea.includes(areaFilter)) return false
      }
      
      // Search term filter
      if (searchTerm) {
        const fullName = `${employee.personalInfo?.firstName} ${employee.personalInfo?.lastName}`.toLowerCase()
        if (!fullName.includes(searchTerm.toLowerCase())) return false
      }
      
      return true
    })
  }
  
  // Get unique departments from employees
  const getUniqueDepartments = () => {
    const departments = new Set()
    employees.forEach(emp => {
      if (emp.assignments?.departments) {
        emp.assignments.departments.forEach(dept => departments.add(dept))
      }
    })
    return Array.from(departments)
  }
  
  // Get unique roles from employees
  const getUniqueRoles = () => {
    const roles = new Set()
    employees.forEach(emp => {
      if (emp.personalInfo?.position) {
        roles.add(emp.personalInfo.position)
      }
    })
    return Array.from(roles)
  }
  
  // Get unique areas from employees
  const getUniqueAreas = () => {
    const areas = new Set()
    employees.forEach(emp => {
      if (emp.assignments?.areas) {
        emp.assignments.areas.forEach(area => areas.add(area))
      }
    })
    return Array.from(areas)
  }

  return (
    <div className="space-y-4 xs:space-y-6">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
        <div>
          <h2 className="text-xl xs:text-2xl font-bold font-display text-charcoal">Time Tracking Management</h2>
          <p className="text-charcoal/60 mt-1 text-sm xs:text-base">Manage employee time tracking, approvals, and reports</p>
        </div>
        
        <button
          onClick={loadData}
          className="bg-brand-navy text-cream px-3 xs:px-4 py-2 rounded-lg hover:bg-brand-navy/90 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 xs:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm font-medium text-charcoal/60">Pending Approvals</p>
              <p className="text-xl xs:text-2xl font-bold text-charcoal mt-1">{pendingApprovals.length + pendingAvailabilityChanges.length}</p>
            </div>
            <div className="p-2 xs:p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 xs:w-6 xs:h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 xs:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm font-medium text-charcoal/60">Currently Clocked In</p>
              <p className="text-xl xs:text-2xl font-bold text-charcoal mt-1">{liveRoster.length}</p>
            </div>
            <div className="p-2 xs:p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 xs:w-6 xs:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 xs:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm font-medium text-charcoal/60">Active Employees</p>
              <p className="text-xl xs:text-2xl font-bold text-charcoal mt-1">{employees.length}</p>
            </div>
            <div className="p-2 xs:p-3 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 xs:w-6 xs:h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 xs:space-x-8 px-3 xs:px-6 overflow-x-auto">
            {[
              { key: 'approvals', label: 'Approval Queue', icon: AlertTriangle },
              { key: 'roster', label: 'Live Roster', icon: Users },
              { key: 'reports', label: 'Time Reports', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 xs:py-4 px-1 border-b-2 font-medium text-xs xs:text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-brand-navy text-brand-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-3 h-3 xs:w-4 xs:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                {tab.key === 'approvals' && pendingApprovals.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs rounded-full px-2 py-1">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 xs:p-6">
          {/* Approval Queue Tab */}
          {activeTab === 'approvals' && (
            <div>
              {pendingApprovals.length === 0 && pendingAvailabilityChanges.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No Pending Approvals</h3>
                  <p className="text-charcoal/60">All requests are up to date</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Clock-In/Out Approvals */}
                  {pendingApprovals.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-charcoal mb-4">Clock-In Approvals</h4>
                      <div className="space-y-4">
                        {pendingApprovals.map((request) => {
                          const employee = employees.find(emp => emp.id === request.employeeId)
                          return (
                            <div key={request.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-charcoal">
                                      {employee?.personalInfo?.firstName} {employee?.personalInfo?.lastName}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      request.reason === 'EARLY_CLOCK_IN' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {request.reason === 'EARLY_CLOCK_IN' ? 'Early Clock-In' : 'Late Clock-In'}
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm text-charcoal/70 space-y-1">
                                    <p>Requested at: {new Date(request.requestedAt).toLocaleString()}</p>
                                    {request.graceStatus && (
                                      <p>
                                        {request.reason === 'EARLY_CLOCK_IN' 
                                          ? `${request.graceStatus.minutesEarly} minutes early`
                                          : `${request.graceStatus.minutesLate} minutes late`
                                        }
                                      </p>
                                    )}
                                    {request.shift && (
                                      <p>Scheduled shift: {formatTime(request.shift.startTime)} - {formatTime(request.shift.endTime)}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleApproval(request.id, true, 'Manager approved')}
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproval(request.id, false, 'Manager denied')}
                                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Deny
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Availability Change Approvals */}
                  {pendingAvailabilityChanges.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-charcoal mb-4">Schedule Change Requests</h4>
                      <div className="space-y-4">
                        {pendingAvailabilityChanges.map((request) => {
                          const employee = employees.find(emp => emp.id === request.employeeId)
                          return (
                            <div key={request.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-charcoal">
                                      {employee?.personalInfo?.firstName} {employee?.personalInfo?.lastName}
                                    </h4>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Schedule Change
                                    </span>
                                  </div>
                                  
                                  <div className="text-sm text-charcoal/70 space-y-1">
                                    <p>Requested at: {new Date(request.requestedAt).toLocaleString()}</p>
                                    <p>Reason: {request.reason}</p>
                                    <p>Change type: {request.changes?.type === 'PERMANENT_CHANGE' ? 'Permanent' : 'Temporary Override'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAvailabilityChangeApproval(request.id, true, 'Manager approved schedule change')}
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleAvailabilityChangeApproval(request.id, false, 'Manager denied schedule change')}
                                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Deny
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Roster Tab */}
          {activeTab === 'roster' && (
            <div>
              {/* Roster Filters */}
              <div className="mb-4 xs:mb-6 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
                {/* Search */}
                <div className="xs:col-span-2 lg:col-span-1">
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                    />
                  </div>
                </div>
                
                {/* Department Filter */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  >
                    <option value="all">All Departments</option>
                    {getUniqueDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                {/* Role Filter */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  >
                    <option value="all">All Roles</option>
                    {getUniqueRoles().map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                {/* Area Filter */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">Area</label>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  >
                    <option value="all">All Areas</option>
                    {getUniqueAreas().map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Filter Results Count */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-3 xs:mb-4">
                <p className="text-xs xs:text-sm text-charcoal/60">
                  Showing {getFilteredRoster().length} of {liveRoster.length} clocked-in employees
                </p>
                {(departmentFilter !== 'all' || roleFilter !== 'all' || areaFilter !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setDepartmentFilter('all')
                      setRoleFilter('all')
                      setAreaFilter('all')
                      setSearchTerm('')
                    }}
                    className="text-brand-navy hover:text-brand-navy/80 text-xs xs:text-sm flex items-center gap-1 w-full xs:w-auto justify-center xs:justify-start"
                  >
                    <Filter className="w-3 h-3 xs:w-4 xs:h-4" />
                    Clear filters
                  </button>
                )}
              </div>
              
              {liveRoster.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No One Currently Clocked In</h3>
                  <p className="text-charcoal/60">Employees will appear here when they clock in</p>
                </div>
              ) : getFilteredRoster().length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No Employees Match Filters</h3>
                  <p className="text-charcoal/60">Try adjusting your filter criteria</p>
                </div>
              ) : (
                <div>
                  <div className="hidden xs:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clock In Time
                          </th>
                          <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Elapsed Time
                          </th>
                          <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredRoster().map((employee) => (
                          <tr key={employee.id}>
                            <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
                                <div>
                                  <div className="text-xs xs:text-sm font-medium text-charcoal">
                                    {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                                  </div>
                                  <div className="text-xs text-charcoal/60">
                                    {employee.personalInfo?.position || 'Team Member'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                              {employee.assignments?.departments?.join(', ') || 'Unassigned'}
                            </td>
                            <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                              {formatTime(employee.clockStatus.lastClockIn)}
                            </td>
                            <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                              {getElapsedTime(employee.clockStatus.lastClockIn)}
                            </td>
                            <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 xs:w-4 xs:h-4 text-charcoal/60" />
                                {employee.location?.name || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Card Layout */}
                  <div className="xs:hidden space-y-3">
                    {getFilteredRoster().map((employee) => (
                      <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <div>
                              <div className="text-sm font-medium text-charcoal">
                                {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                              </div>
                              <div className="text-xs text-charcoal/60">
                                {employee.personalInfo?.position || 'Team Member'}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-charcoal/50">
                            {getElapsedTime(employee.clockStatus.lastClockIn)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-charcoal/60">Department:</span>
                            <span className="text-charcoal font-medium">
                              {employee.assignments?.departments?.join(', ') || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-charcoal/60">Clock In:</span>
                            <span className="text-charcoal font-medium">
                              {formatTime(employee.clockStatus.lastClockIn)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-charcoal/60">Location:</span>
                            <span className="text-charcoal font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-charcoal/60" />
                              {employee.location?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              {/* Report Type Selection */}
              <div className="mb-4 xs:mb-6 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  >
                    <option value="timeEntries">Time Entries</option>
                    <option value="plannedVsActual">Planned vs Actual</option>
                    <option value="lateEarly">Late/Early Events</option>
                    <option value="forgotClockOut">Forgot Clock-Out</option>
                  </select>
                </div>
                
                {/* Employee selection (for individual reports) */}
                {(reportType === 'timeEntries' || reportType === 'plannedVsActual') && (
                  <div className="xs:col-span-2 lg:col-span-1">
                    <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">
                      Select Employee
                    </label>
                    <select
                      value={selectedEmployee || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          if (reportType === 'timeEntries') {
                            loadEmployeeTimeEntries(e.target.value)
                          } else if (reportType === 'plannedVsActual') {
                            loadPlannedVsActualReport(e.target.value)
                          }
                        }
                      }}
                      className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-charcoal mb-1 xs:mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full px-3 py-2 xs:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent text-sm xs:text-base"
                  />
                </div>
              </div>
              
              {/* Generate Report Button (for aggregate reports) */}
              {(reportType === 'lateEarly' || reportType === 'forgotClockOut') && (
                <div className="mb-4 xs:mb-6">
                  <button
                    onClick={() => {
                      if (reportType === 'lateEarly') {
                        loadLateEarlyEventsReport()
                      } else if (reportType === 'forgotClockOut') {
                        loadForgotClockOutReport()
                      }
                    }}
                    className="bg-brand-navy text-cream px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg hover:bg-brand-navy/90 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center"
                  >
                    <Calendar className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              )}

              {/* Time Entries Report */}
              {reportType === 'timeEntries' && selectedEmployee && (
                <div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-3 xs:mb-4">
                    <h3 className="text-base xs:text-lg font-semibold text-charcoal">Time Entries Report</h3>
                    <button className="bg-gray-100 text-charcoal px-3 xs:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  {timeEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-charcoal mb-2">No Time Entries</h4>
                      <p className="text-charcoal/60">No time entries found for the selected date range</p>
                    </div>
                  ) : (
                    <div>
                      {/* Desktop Table */}
                      <div className="hidden xs:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Clock In
                              </th>
                              <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Clock Out
                              </th>
                              <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Hours
                              </th>
                              <th className="px-4 xs:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {timeEntries.map((entry) => (
                              <tr key={entry.id}>
                                <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                                  {new Date(entry.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                                  {formatTime(entry.clockInTime)}
                                </td>
                                <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                                  {formatTime(entry.clockOutTime)}
                                </td>
                                <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap text-xs xs:text-sm text-charcoal">
                                  {entry.totalHours || 'In Progress'}
                                </td>
                                <td className="px-4 xs:px-6 py-3 xs:py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    entry.status === 'APPROVED' 
                                      ? 'bg-green-100 text-green-800'
                                      : entry.status === 'PENDING_APPROVAL'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {entry.status.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile Card Layout */}
                      <div className="xs:hidden space-y-3">
                        {timeEntries.map((entry) => (
                          <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm font-medium text-charcoal">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.status === 'APPROVED' 
                                  ? 'bg-green-100 text-green-800'
                                  : entry.status === 'PENDING_APPROVAL'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry.status.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Clock In:</span>
                                <span className="text-charcoal font-medium">
                                  {formatTime(entry.clockInTime)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Clock Out:</span>
                                <span className="text-charcoal font-medium">
                                  {formatTime(entry.clockOutTime)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal/60">Total Hours:</span>
                                <span className="text-charcoal font-medium">
                                  {entry.totalHours || 'In Progress'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Planned vs Actual Report */}
              {reportType === 'plannedVsActual' && selectedEmployee && (
                <div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-3 xs:mb-4">
                    <h3 className="text-base xs:text-lg font-semibold text-charcoal">Planned vs Actual Hours Report</h3>
                    <button className="bg-gray-100 text-charcoal px-3 xs:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  {plannedVsActualData.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-charcoal mb-2">No Schedule Data</h4>
                      <p className="text-charcoal/60">No scheduled shifts found for the selected date range</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Planned Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actual Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {plannedVsActualData.map((data, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {new Date(data.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {data.plannedHours.toFixed(1)}h ({formatTime(data.plannedStart)} - {formatTime(data.plannedEnd)})
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {data.actualHours.toFixed(1)}h ({formatTime(data.actualStart)} - {formatTime(data.actualEnd)})
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`font-medium ${
                                  data.variance > 0 ? 'text-green-600' : data.variance < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {data.variance > 0 ? '+' : ''}{data.variance.toFixed(1)}h
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  data.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800'
                                    : data.status === 'NO_SHOW'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {data.status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Late/Early Events Report */}
              {reportType === 'lateEarly' && (
                <div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-3 xs:mb-4">
                    <h3 className="text-base xs:text-lg font-semibold text-charcoal">Late/Early Clock-In Events Report</h3>
                    <button className="bg-gray-100 text-charcoal px-3 xs:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  {lateEarlyEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-charcoal mb-2">No Late/Early Events</h4>
                      <p className="text-charcoal/60">No late or early clock-in events found for the selected date range</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Event Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Minutes Off
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date/Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lateEarlyEvents.map((event) => (
                            <tr key={event.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                                {event.employeeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {event.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.reason === 'EARLY_CLOCK_IN' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {event.reason === 'EARLY_CLOCK_IN' ? 'Early' : 'Late'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {event.graceStatus ? 
                                  (event.reason === 'EARLY_CLOCK_IN' 
                                    ? `${event.graceStatus.minutesEarly} min early`
                                    : `${event.graceStatus.minutesLate} min late`
                                  ) : 'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {new Date(event.requestedAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800'
                                    : event.status === 'DENIED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {event.status || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Forgot Clock-Out Report */}
              {reportType === 'forgotClockOut' && (
                <div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-3 xs:mb-4">
                    <h3 className="text-base xs:text-lg font-semibold text-charcoal">Forgot Clock-Out Resolutions Report</h3>
                    <button className="bg-gray-100 text-charcoal px-3 xs:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm xs:text-base w-full xs:w-auto justify-center">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  {forgotClockOutData.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-charcoal mb-2">No Forgot Clock-Out Events</h4>
                      <p className="text-charcoal/60">No forgot clock-out events found for the selected date range</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nudge Response
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clock Out Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Response Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Resolution
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {forgotClockOutData.map((event) => (
                            <tr key={event.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                                {event.employeeName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {event.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {event.response || 'No response'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {formatTime(event.clockOutTime)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                                {new Date(event.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.resolved 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {event.resolved ? 'RESOLVED' : 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Report Instructions */}
              {!selectedEmployee && (reportType === 'timeEntries' || reportType === 'plannedVsActual') && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-charcoal mb-2">Select an Employee</h4>
                  <p className="text-charcoal/60">Choose an employee to view their {reportType === 'timeEntries' ? 'time entries' : 'planned vs actual hours'} report</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimeTrackingManagement