import { useState, useEffect } from 'react'
import { Users, Eye, UserCheck, UserX, Clock, AlertTriangle, CheckCircle, FileText, Download, PauseCircle, PlayCircle, Power, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { calculateTenure, formatTenure, hasUpcomingAnniversary, migrateEmployeeData, markAnniversaryCelebrated } from '../../utils/employeeUtils'
import notificationService from '../../services/notificationService'
import adminApiService from '../../services/adminApiService'
import AddEmployeeModal from './AddEmployeeModal'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [backendStats, setBackendStats] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [locations, setLocations] = useState([])
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [showQuestionnaireResponses, setShowQuestionnaireResponses] = useState(false)

  // Load employees from API
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminApiService.getEmployees()
        
        if (response.success) {
          setEmployees(response.employees || [])
        } else {
          setError(response.error || 'Failed to load employees')
          notificationService.showError('Failed to load employees: ' + (response.error || 'Unknown error'))
        }
      } catch (err) {
        setError('Failed to load employees')
        notificationService.showError('Failed to load employees: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    
    const loadEmployeeStatistics = async () => {
      try {
        setStatsError(null)
        const result = await adminApiService.getEmployeeStatistics()
        if (result.success && result.statistics) {
          setBackendStats(transformBackendStats(result.statistics))
        } else if (!result.success) {
          setStatsError(result.error || 'Failed to load employee statistics')
        }
      } catch (e) {
        setStatsError(e.message)
      }
    }

    const loadLocations = async () => {
      try {
        const result = await adminApiService.getLocations()
        if (result.success) {
          setLocations(result.locations || [])
        } else {
          console.error('Failed to load locations:', result.error)
        }
      } catch (error) {
        console.error('Error loading locations:', error)
      }
    }

    loadEmployees()
    loadEmployeeStatistics()
    loadLocations()
  }, [])

  // Update employee status via API
  const updateEmployeeStatus = async (employeeId, action) => {
    try {
      let response
      if (action === 'approve') {
        response = await adminApiService.approveEmployee(employeeId)
      } else if (action === 'reject') {
        const rejectionReason = prompt('Please provide a reason for rejection:')
        if (!rejectionReason) return
        response = await adminApiService.rejectEmployee(employeeId, rejectionReason)
      }
      
      if (response.success) {
        // Update the employee in the local state
        const updatedEmployees = employees.map(emp => 
          emp.id === employeeId ? response.employee : emp
        )
        setEmployees(updatedEmployees)
        notificationService.showSuccess(response.message || 'Employee status updated successfully')
        
        // Close details modal if it was open for this employee
        if (selectedEmployee && selectedEmployee.id === employeeId) {
          setSelectedEmployee(response.employee)
        }
      } else {
        notificationService.showError(response.error || 'Failed to update employee status')
      }
    } catch (error) {
      notificationService.showError('Failed to update employee status: ' + error.message)
    }
  }

  // Lifecycle: pause/resume/activate/deactivate
  const updateEmployeeLifecycle = async (employeeId, action) => {
    try {
      let result
      if (action === 'pause') {
        const reason = prompt('Reason for pausing (optional):') || undefined
        result = await adminApiService.pauseEmployee(employeeId, reason)
      } else if (action === 'resume') {
        result = await adminApiService.resumeEmployee(employeeId)
      } else if (action === 'deactivate') {
        const reason = prompt('Reason for marking inactive (optional):') || undefined
        result = await adminApiService.deactivateEmployee(employeeId, reason)
      } else if (action === 'activate') {
        result = await adminApiService.activateEmployee(employeeId)
      }

      if (result?.success) {
        const updated = employees.map(emp => emp.id === employeeId ? (result.employee || { ...emp, status: action === 'activate' ? 'approved' : action === 'deactivate' ? 'inactive' : action === 'pause' ? 'paused' : 'approved' }) : emp)
        setEmployees(updated)
        if (selectedEmployee && selectedEmployee.id === employeeId) {
          setSelectedEmployee(result.employee || updated.find(e => e.id === employeeId))
        }
        notificationService.showSuccess(result.message || 'Employee status updated')
      } else {
        notificationService.showError(result?.error || 'Failed to update employee')
      }
    } catch (err) {
      notificationService.showError('Failed to update employee: ' + err.message)
    }
  }

  // Handle new employee addition from modal
  const handleEmployeeAdded = (newEmployee) => {
    setEmployees(prev => [newEmployee, ...prev])
    // Refresh stats to get updated counts
    const loadEmployeeStatistics = async () => {
      try {
        setStatsError(null)
        const result = await adminApiService.getEmployeeStatistics()
        if (result.success && result.statistics) {
          setBackendStats(transformBackendStats(result.statistics))
        }
      } catch (e) {
        setStatsError(e.message)
      }
    }
    loadEmployeeStatistics()
  }

  const viewEmployeeDetails = (employee) => {
    setSelectedEmployee(employee)
    setShowDetails(true)
  }

  // Unified: Map backend employee fields to UI status category
  const getEmployeeUiStatus = (emp) => {
    const s = (emp?.status || '').toLowerCase()
    const stage = (emp?.stage || '').toLowerCase()

    if (s === 'approved' || s === 'active' || emp?.can_access_dashboard) return 'ACTIVE'
    if (s === 'paused' || stage.includes('paused')) return 'PAUSED'
    if (s === 'rejected' || s === 'inactive') return 'INACTIVE'
    if (stage.includes('interview') || s.includes('interview')) return 'INTERVIEW'
    if (s === 'pending_approval' || stage.includes('questionnaire') || s === 'new') return 'NEW'
    return 'NEW'
  }

  const getStatusBadge = (emp) => {
    const statusConfig = {
      'NEW': { color: 'bg-blue-100 text-blue-800', icon: Users },
      'INTERVIEW': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'ACTIVE': { color: 'bg-green-100 text-green-800', icon: UserCheck },
      'PAUSED': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'INACTIVE': { color: 'bg-red-100 text-red-800', icon: UserX }
    }

    const key = getEmployeeUiStatus(emp)
    const config = statusConfig[key] || statusConfig['INACTIVE']
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {key}
      </span>
    )
  }

  // Helper: location label
  const getLocationLabel = (emp) => {
    return emp.location?.name || emp.location || emp.department || 'Not Assigned'
  }

  // Helper: employee type label
  const getEmployeeTypeLabel = (emp) => {
    return emp.employee_type || emp.type || emp.role || 'Not Set'
  }

  // Helper: personal info completeness badge
  const getPersonalInfoBadge = (emp) => {
    const info = emp.personal_info || emp.profile_data?.personal_info || emp.personalInfo || {}
    const keys = Object.keys(info || {})
    const isComplete = keys.length > 0 && Object.values(info).some(v => !!v)
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
        isComplete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}>
        {isComplete ? 'Complete' : 'Incomplete'}
      </span>
    )
  }

  // Helper: onboarding status badge
  const getOnboardingBadge = (emp) => {
    const label = emp.onboarding_progress?.status || emp.stage?.replace(/_/g, ' ') || emp.status?.replace(/_/g, ' ') || 'Not started'
    const normalized = (label || '').toLowerCase()
    let classes = 'bg-gray-50 text-gray-700 border-gray-200'
    if (normalized.includes('complete') || normalized === 'approved') classes = 'bg-green-50 text-green-700 border-green-200'
    else if (normalized.includes('in progress') || normalized.includes('interview')) classes = 'bg-blue-50 text-blue-700 border-blue-200'
    else if (normalized.includes('paused')) classes = 'bg-orange-50 text-orange-700 border-orange-200'
    else if (normalized.includes('rejected') || normalized.includes('inactive')) classes = 'bg-red-50 text-red-700 border-red-200'
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${classes}`}>
        {label}
      </span>
    )
  }

  // Helper: joined date and tenure
  const getJoinedDate = (emp) => emp.hireDate || emp.hired_at || emp.approved_at || emp.created_at || emp.createdAt || null
  const getJoinedLabel = (emp) => {
    const d = getJoinedDate(emp)
    return d ? new Date(d).toLocaleDateString() : '—'
  }
  const getTenureLabel = (emp) => {
    const d = getJoinedDate(emp)
    if (!d) return '—'
    const days = calculateTenure(d)
    return formatTenure(days)
  }

  // Classify employee using unified mapper
  const classifyEmployee = (emp) => getEmployeeUiStatus(emp)

  // Helpers to normalize numbers from backend (handles numeric strings)
  const normalizeNumber = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v)
    return null
  }

  // Backend stats transformer (robust to different field names)
  const transformBackendStats = (raw) => {
    const num = (...keys) => {
      for (const k of keys) {
        const direct = raw?.[k]
        const n1 = normalizeNumber(direct)
        if (n1 !== null) return n1
        const lower = raw && typeof k === 'string' ? raw[k.toLowerCase?.()] : undefined
        const n2 = normalizeNumber(lower)
        if (n2 !== null) return n2
      }
      return null
    }

    const total = num('total', 'total_employees')
    const NEW = num('NEW', 'new', 'new_employees', 'pending', 'pending_approval')
    const INTERVIEW = num('INTERVIEW', 'interview', 'in_interview')
    const ACTIVE = num('ACTIVE', 'active', 'approved')
    const PAUSED = num('PAUSED', 'paused') ?? 0
    const inactiveParts = [num('INACTIVE', 'inactive'), num('rejected'), num('disabled')].filter(v => v !== null)
    const INACTIVE = inactiveParts.length ? inactiveParts.reduce((a,b)=>a+b,0) : null

    return {
      total: total ?? ( [NEW, INTERVIEW, ACTIVE, PAUSED, INACTIVE].filter(v=>v!==null).reduce((a,b)=>a+b,0) ),
      NEW, INTERVIEW, ACTIVE, PAUSED, INACTIVE
    }
  }

  // Derive counts for status cards (always compute from employees; overlay backend when valid)
  const computedCounts = { NEW: 0, INTERVIEW: 0, ACTIVE: 0, PAUSED: 0, INACTIVE: 0 }
  employees.forEach(e => {
    const key = classifyEmployee(e)
    computedCounts[key] = (computedCounts[key] || 0) + 1
  })

  const pick = (backendValue, fallbackValue) => {
    const n = normalizeNumber(backendValue)
    return n !== null ? n : fallbackValue
  }

  const counts = {
    NEW: pick(backendStats?.NEW, computedCounts.NEW),
    INTERVIEW: pick(backendStats?.INTERVIEW, computedCounts.INTERVIEW),
    ACTIVE: pick(backendStats?.ACTIVE, computedCounts.ACTIVE),
    PAUSED: pick(backendStats?.PAUSED, computedCounts.PAUSED),
    INACTIVE: pick(backendStats?.INACTIVE, computedCounts.INACTIVE),
  }

  const totalCount = normalizeNumber(backendStats?.total) ?? employees.length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20">
          {/* Responsive header: stack on <=480px, side-by-side above that */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-display text-cream">Employee Management</h2>
              <p className="text-sm text-cream/80 mt-1">Manage employee profiles and status</p>
            </div>
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gold text-brand-navy rounded-lg hover:bg-gold/90 transition-all duration-200 font-medium text-sm md:text-base"
              title="Add new employee with direct dashboard access"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Employee Directory Stats Cards */}
        <div className="px-6 py-4">
          {/* Use mobile-grid so <=480px renders in a 2-column grid (classes already defined in project) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mobile-grid">
            {/* TOTAL */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">TOTAL</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{totalCount}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>

            {/* NEW */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">NEW</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{counts.NEW}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>

            {/* INTERVIEW */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">INTERVIEW</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{counts.INTERVIEW}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>

            {/* ACTIVE */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">ACTIVE</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{counts.ACTIVE}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>

            {/* PAUSED */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">PAUSED</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{counts.PAUSED}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>

            {/* INACTIVE */}
            <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">INACTIVE</span>
              </div>
              <div className="text-2xl font-bold text-charcoal leading-none">{counts.INACTIVE}</div>
              <div className="text-sm text-charcoal/70">Employees</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Employee Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Personal Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Onboarding
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Tenure
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.map((employee) => (
                <tr 
                  key={employee.id} 
                  onClick={() => viewEmployeeDetails(employee)}
                  className="hover:bg-gold/5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold font-body text-charcoal">
                        {employee.personalInfo?.firstName || employee.first_name} {employee.personalInfo?.lastName || employee.last_name}
                      </div>
                      <div className="text-xs text-charcoal/60 font-medium">
                        ID: {String(employee.id).slice(-8)}
                      </div>
                      <div className="text-xs text-charcoal/70 font-medium mt-1">
                        {employee.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-charcoal">
                    {getLocationLabel(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-charcoal">
                    {getEmployeeTypeLabel(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getPersonalInfoBadge(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getOnboardingBadge(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-charcoal">
                    {getJoinedLabel(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-charcoal">
                    {getTenureLabel(employee)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          viewEmployeeDetails(employee)
                        }}
                        className="p-2 text-gold hover:text-gold-dark hover:bg-gold/10 rounded-lg transition-all duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(employee.status === 'pending_approval' || employee.stage === 'questionnaire_completed') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateEmployeeStatus(employee.id, 'approve')
                            }}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg"
                            title="Approve Employee"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateEmployeeStatus(employee.id, 'reject')
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg"
                            title="Reject Employee"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
            <p className="text-gray-500">Loading employees...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Employees</h3>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-navy text-cream rounded-lg hover:bg-brand-navy/90"
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500">Employees will appear here after they complete onboarding.</p>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showDetails && selectedEmployee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowDetails(false)
            setSelectedEmployee(null)
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 px-4 sm:px-8 py-4 sm:py-6 border-b border-gold/20 relative flex-shrink-0">
              {/* Close button - positioned absolutely at top-right */}
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedEmployee(null)
                }}
                className="absolute top-4 right-4 text-cream/60 hover:text-cream hover:bg-cream/10 rounded-lg p-2 transition-all duration-200 z-10"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-12">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold font-display text-cream truncate">
                    {selectedEmployee.personalInfo?.firstName || selectedEmployee.first_name} {selectedEmployee.personalInfo?.lastName || selectedEmployee.last_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-cream/80">{selectedEmployee.email}</p>
                    <div className="transform scale-90 origin-left">{getStatusBadge(selectedEmployee)}</div>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {(selectedEmployee.status === 'pending_approval' || selectedEmployee.stage === 'questionnaire_completed') && (
                      <>
                        <button
                          onClick={async () => {
                            await updateEmployeeStatus(selectedEmployee.id, 'approve')
                            setShowDetails(false)
                            setSelectedEmployee(null)
                          }}
                          className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Employee
                        </button>
                        <button
                          onClick={async () => {
                            await updateEmployeeStatus(selectedEmployee.id, 'reject')
                            setShowDetails(false)
                            setSelectedEmployee(null)
                          }}
                          className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Reject Employee
                        </button>
                      </>
                    )}

                    {(() => {
                      const ui = getEmployeeUiStatus(selectedEmployee)
                      if (ui === 'ACTIVE') {
                        return (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateEmployeeLifecycle(selectedEmployee.id, 'pause')} className="px-3 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2">
                              <PauseCircle className="w-4 h-4" /> Pause
                            </button>
                            <button onClick={() => updateEmployeeLifecycle(selectedEmployee.id, 'deactivate')} className="px-3 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2">
                              <UserX className="w-4 h-4" /> Mark Inactive
                            </button>
                          </div>
                        )
                      }
                      if (ui === 'PAUSED') {
                        return (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateEmployeeLifecycle(selectedEmployee.id, 'resume')} className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2">
                              <PlayCircle className="w-4 h-4" /> Resume
                            </button>
                            <button onClick={() => updateEmployeeLifecycle(selectedEmployee.id, 'deactivate')} className="px-3 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2">
                              <UserX className="w-4 h-4" /> Mark Inactive
                            </button>
                          </div>
                        )
                      }
                      if (ui === 'INACTIVE') {
                        return (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateEmployeeLifecycle(selectedEmployee.id, 'activate')} className="px-3 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
                              <Power className="w-4 h-4" /> Activate
                            </button>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto scrollable-modal flex-1 min-h-0">
              <div className="space-y-8">

              {/* Questionnaire Responses */}
              {selectedEmployee.questionnaire_responses && (
                <div className="bg-white rounded-xl border-2 border-gold shadow-sm p-5">
                  <button
                    onClick={() => setShowQuestionnaireResponses(!showQuestionnaireResponses)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <h4 className="font-medium text-charcoal text-left">Questionnaire Responses</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal/60">
                        {Object.keys(selectedEmployee.questionnaire_responses).length} response(s)
                      </span>
                      {showQuestionnaireResponses ? (
                        <ChevronDown className="w-4 h-4 text-charcoal transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-charcoal transition-transform duration-200" />
                      )}
                    </div>
                  </button>
                  
                  {showQuestionnaireResponses && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                      {Object.entries(selectedEmployee.questionnaire_responses).map(([questionId, response]) => (
                        <div key={questionId} className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4 min-w-0">
                          <div className="text-sm font-semibold text-charcoal mb-3">
                            Question {questionId}
                          </div>
                          <div className="text-sm text-charcoal/80">
                            {typeof response === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(response).map(([key, value]) => (
                                  <div key={key} className="flex flex-col min-w-0">
                                    <span className="font-medium text-charcoal/70 capitalize text-xs mb-1">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-charcoal break-all overflow-hidden leading-tight">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-charcoal break-all overflow-hidden leading-tight">{response || 'No response'}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Files and Onboarding Progress Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Uploaded Files */}
                {selectedEmployee.questionnaire_files && selectedEmployee.questionnaire_files.length > 0 && (
                  <div className="bg-white rounded-xl border-2 border-gold shadow-sm p-5">
                  <h4 className="font-medium text-charcoal mb-4">Uploaded Files</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedEmployee.questionnaire_files.map((file) => (
                      <div key={file.id} className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-brand-navy/10 rounded-lg">
                            <FileText className="w-5 h-5 text-brand-navy" />
                          </div>
                          <button
                            onClick={async () => {
                              const result = await adminApiService.downloadFile(file.id, file.original_filename)
                              if (!result.success) {
                                notificationService.showError('Failed to download file: ' + result.error)
                              }
                            }}
                            className="p-2 text-brand-navy hover:bg-brand-navy/10 rounded-lg transition-colors"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-charcoal leading-tight break-words">
                            {file.original_filename}
                          </div>
                          <div className="text-xs text-charcoal/60 space-y-1">
                            <div>Question {file.question_index}</div>
                            <div>{(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}</div>
                            <div>Uploaded {new Date(file.uploaded_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                )}

                {/* Onboarding Progress */}
                {selectedEmployee.onboarding_progress && (
                  <div className="bg-white rounded-xl border-2 border-gold shadow-sm p-5">
                  <h4 className="font-medium text-charcoal mb-4">Onboarding Progress</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
                      <div className="text-xs font-semibold text-charcoal/70 mb-2">Current Stage</div>
                      <div className="text-sm font-medium text-charcoal capitalize">{selectedEmployee.stage?.replace(/_/g, ' ') || 'Unknown'}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
                      <div className="text-xs font-semibold text-charcoal/70 mb-2">Status</div>
                      <div className="text-sm font-medium text-charcoal capitalize">{selectedEmployee.status?.replace(/_/g, ' ') || 'Unknown'}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
                      <div className="text-xs font-semibold text-charcoal/70 mb-2">Location</div>
                      <div className="text-sm font-medium text-charcoal">{selectedEmployee.location || 'Not selected'}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
                      <div className="text-xs font-semibold text-charcoal/70 mb-2">Dashboard Access</div>
                      <div className="text-sm font-medium text-charcoal">{selectedEmployee.can_access_dashboard ? 'Yes' : 'No'}</div>
                    </div>
                    {selectedEmployee.approved_by && (
                      <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4 min-w-0">
                        <div className="text-xs font-semibold text-charcoal/70 mb-2">Approved By</div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-charcoal leading-tight break-words">{selectedEmployee.approved_by.name}</div>
                          <div className="text-xs text-charcoal/60 leading-snug break-all overflow-hidden">({selectedEmployee.approved_by.email})</div>
                        </div>
                      </div>
                    )}
                    {selectedEmployee.approved_at && (
                      <div className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4 min-w-0">
                        <div className="text-xs font-semibold text-charcoal/70 mb-2">Approved At</div>
                        <div className="text-sm font-semibold text-charcoal whitespace-pre-line break-words leading-snug">{new Date(selectedEmployee.approved_at).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              {(selectedEmployee.personalInfo || selectedEmployee.personal_info || (selectedEmployee.profile_data && selectedEmployee.profile_data.personal_info)) && (
                <div className="bg-white rounded-xl border-2 border-gold shadow-sm p-5">
                  <h4 className="font-medium text-charcoal mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Object.entries(
                      selectedEmployee.personal_info || 
                      selectedEmployee.profile_data?.personal_info || 
                      selectedEmployee.personalInfo || 
                      {}
                    ).map(([key, value]) => {
                      // Format field names nicely
                      const formattedKey = key
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                      
                      return (
                        <div key={key} className="bg-white rounded-xl border border-gold/20 shadow-sm hover:shadow transition-all p-4">
                          <div className="text-xs font-semibold text-charcoal/70 mb-2">{formattedKey}</div>
                          <div className="text-sm font-medium text-charcoal">{value || 'Not provided'}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onEmployeeAdded={handleEmployeeAdded}
        locations={locations}
      />
    </div>
  )
}

export default EmployeeManagement
