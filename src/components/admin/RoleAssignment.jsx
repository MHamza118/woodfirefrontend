import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  Save, 
  RotateCcw,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Settings
} from 'lucide-react'
import { 
  getDepartments, 
  getAreas, 
  getRoles,
  createDefaultAssignments,
  validateAssignment
} from '../../data/departmentStructure'
import {
  assignRolesToEmployee,
  getEmployeeAssignedRoles,
  getEmployeeAssignedDepartments,
  getEmployeeAssignmentSummary,
  migrateEmployeeData
} from '../../utils/employeeUtils'
import adminApiService from '../../services/adminApiService'

const RoleAssignment = () => {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showRolesModal, setShowRolesModal] = useState(false)
  const [selectedEmployeeForRoles, setSelectedEmployeeForRoles] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Prefer backend employees; fall back to localStorage
    try {
      const resp = await adminApiService.getEmployees()
      if (resp?.success) {
        const apiEmployees = (resp.employees || []).map(e => ({
          id: e.id,
          email: e.email,
          personalInfo: e.personal_info || e.personalInfo || { firstName: e.first_name || e.firstName, lastName: e.last_name || e.lastName },
          assignments: e.assignments || createDefaultAssignments()
        }))
        setEmployees(apiEmployees)
      } else {
        // Fallback to localStorage
        const storedEmployees = localStorage.getItem('employees')
        if (storedEmployees) {
          const employeeData = JSON.parse(storedEmployees)
          const employeesWithAssignments = employeeData.map(emp => ({
            ...emp,
            assignments: emp.assignments || createDefaultAssignments()
          }))
          setEmployees(employeesWithAssignments)
        } else {
          setEmployees([])
        }
      }
    } catch (err) {
      const storedEmployees = localStorage.getItem('employees')
      if (storedEmployees) {
        const employeeData = JSON.parse(storedEmployees)
        const employeesWithAssignments = employeeData.map(emp => ({
          ...emp,
          assignments: emp.assignments || createDefaultAssignments()
        }))
        setEmployees(employeesWithAssignments)
      } else {
        setEmployees([])
      }
    }

    // Load department structure
    setDepartments(getDepartments())
  }

  const saveEmployeeAssignments = () => {
    localStorage.setItem('employees', JSON.stringify(employees))
    setUnsavedChanges(false)
  }

  const updateEmployeeAssignment = (employeeId, newAssignment) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, assignments: { ...newAssignment, lastUpdated: new Date().toISOString() } }
        : emp
    ))
    setUnsavedChanges(true)
  }

  const getEmployeeCurrentRoles = (employee) => {
    if (!employee.assignments || !employee.assignments.roles) return []
    return employee.assignments.roles
  }

  const getEmployeeDepartmentDisplay = (employee) => {
    if (!employee.assignments || !employee.assignments.departments || employee.assignments.departments.length === 0) {
      return 'Not Assigned'
    }
    
    if (employee.assignments.departments.length === 1) {
      return employee.assignments.departments[0]
    }
    
    return `${employee.assignments.departments[0]} +${employee.assignments.departments.length - 1}`
  }

  const getAssignmentStatus = (employee) => {
    if (!employee.assignments) return { status: 'none', color: 'gray' }
    
    const validation = validateAssignment(employee.assignments)
    
    if (!validation.isValid) {
      return { status: 'incomplete', color: 'red' }
    }
    
    if (employee.assignments.departments.length > 1 || employee.assignments.roles.length > 2) {
      return { status: 'flexible', color: 'blue' }
    }
    
    return { status: 'assigned', color: 'green' }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || 
      (emp.assignments?.departments?.includes(filterDepartment))
    
    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-6">

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 role-stats-mobile">
        {[
          { label: 'Total Employees', value: employees.length, color: 'blue' },
          { label: 'Fully Assigned', value: employees.filter(emp => getAssignmentStatus(emp).status === 'assigned').length, color: 'green' },
          { label: 'Multi-Role', value: employees.filter(emp => getAssignmentStatus(emp).status === 'flexible').length, color: 'purple' },
          { label: 'Incomplete', value: employees.filter(emp => getAssignmentStatus(emp).status === 'incomplete').length, color: 'red' }
        ].map((stat, index) => (
          <div key={index} className="role-stat-card bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-50' :
                stat.color === 'green' ? 'bg-green-50' :
                stat.color === 'purple' ? 'bg-purple-50' : 'bg-red-50'
              }`}>
                <Users className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'purple' ? 'text-purple-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-charcoal/70">{stat.label}</p>
                <p className="text-xl font-bold text-charcoal">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Assignment Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold font-display text-cream">Employee Role Assignments</h4>
              <p className="text-sm text-cream/80">Manage role assignments and scheduling eligibility</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {unsavedChanges && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unsaved Changes</span>
                </div>
              )}
              <button
                onClick={saveEmployeeAssignments}
                disabled={!unsavedChanges}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto ${
                  unsavedChanges 
                    ? 'bg-gold text-charcoal hover:bg-gold/90' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
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
                  Departments
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Current Roles
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Assignment Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-charcoal uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.map((employee) => {
                const assignmentStatus = getAssignmentStatus(employee)
                const currentRoles = getEmployeeCurrentRoles(employee)
                
                return (
                  <tr key={employee.id} className="hover:bg-gold/5 hover:shadow-sm transition-all duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold font-body text-charcoal">
                          {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                        </div>
                        <div className="text-xs text-charcoal/60 font-medium">
ID: {String(employee.id).slice(-8)}
                        </div>
                        <div className="text-xs text-charcoal/70 font-medium mt-1">
                          {employee.email}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {getEmployeeDepartmentDisplay(employee)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      {currentRoles.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedEmployeeForRoles(employee)
                            setShowRolesModal(true)
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-all duration-200"
                          title="View Roles Details"
                        >
                          <Eye className="w-3 h-3" />
                          {currentRoles.length} Role{currentRoles.length > 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-xs text-charcoal/60">No roles assigned</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {assignmentStatus.status === 'assigned' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Complete</span>
                          </>
                        )}
                        {assignmentStatus.status === 'flexible' && (
                          <>
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Multi-Role</span>
                          </>
                        )}
                        {assignmentStatus.status === 'incomplete' && (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-red-700">Incomplete</span>
                          </>
                        )}
                        {assignmentStatus.status === 'none' && (
                          <>
                            <AlertTriangle className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-medium text-gray-700">Not Set</span>
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-charcoal/70">
                      {employee.assignments?.lastUpdated ? 
                        new Date(employee.assignments.lastUpdated).toLocaleDateString() : 
                        'Never'
                      }
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setShowAssignmentModal(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gold hover:text-gold-dark hover:bg-gold/10 rounded-lg transition-all duration-200 mobile-secondary-button"
                        title="Manage Assignments"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedEmployee && (
        <AssignmentModal
          employee={selectedEmployee}
          departments={departments}
          onClose={() => {
            setShowAssignmentModal(false)
            setSelectedEmployee(null)
          }}
          onSave={(newAssignment) => {
            updateEmployeeAssignment(selectedEmployee.id, newAssignment)
            setShowAssignmentModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}

      {/* Roles Details Modal */}
      {showRolesModal && selectedEmployeeForRoles && (
        <RolesDetailsModal
          employee={selectedEmployeeForRoles}
          departments={departments}
          onClose={() => {
            setShowRolesModal(false)
            setSelectedEmployeeForRoles(null)
          }}
        />
      )}
    </div>
  )
}

// Assignment Modal Component
const AssignmentModal = ({ employee, departments, onClose, onSave }) => {
  const [assignments, setAssignments] = useState(
    employee.assignments || createDefaultAssignments()
  )
  const [validationErrors, setValidationErrors] = useState([])

  const handleDepartmentChange = (deptId, checked) => {
    const newDepartments = checked
      ? [...assignments.departments, deptId]
      : assignments.departments.filter(id => id !== deptId)
    
    setAssignments(prev => ({
      ...prev,
      departments: newDepartments,
      primaryDepartment: newDepartments.length === 1 ? newDepartments[0] : prev.primaryDepartment
    }))
  }

  const handleAreaChange = (areaId, checked) => {
    const newAreas = checked
      ? [...assignments.areas, areaId]
      : assignments.areas.filter(id => id !== areaId)
    
    setAssignments(prev => ({ ...prev, areas: newAreas }))
  }

  const handleRoleChange = (role, checked) => {
    const newRoles = checked
      ? [...assignments.roles, role]
      : assignments.roles.filter(r => r !== role)
    
    setAssignments(prev => ({
      ...prev,
      roles: newRoles,
      primaryRole: newRoles.length === 1 ? newRoles[0] : prev.primaryRole
    }))
  }

  const handleSave = () => {
    const validation = validateAssignment(assignments)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    onSave(assignments)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 px-8 py-6 border-b border-gold/20 mobile-navy-header mobile-modal-padding">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold font-display text-cream mobile-modal-header">Role Assignment</h3>
              <p className="text-sm text-cream/80 mt-1 mobile-subtitle">
                {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-cream/60 hover:text-cream hover:bg-cream/10 rounded-lg p-2 transition-all duration-200 mobile-icon-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 overflow-y-auto" style={{maxHeight: 'calc(90vh - 220px)'}}>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Assignment Issues</h4>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Departments Selection */}
          <div>
            <h4 className="font-medium text-charcoal mb-3">Departments</h4>
            <div className="space-y-3">
              {departments.map(dept => (
                <label key={dept.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignments.departments.includes(dept.id)}
                    onChange={(e) => handleDepartmentChange(dept.id, e.target.checked)}
                    className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                  />
                  <div className={`p-2 rounded-lg ${dept.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
                    <Building2 className={`w-4 h-4 ${dept.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <span className="font-medium text-charcoal">{dept.name}</span>
                    <p className="text-xs text-charcoal/60">{dept.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Areas and Roles for selected departments */}
          {assignments.departments.map(deptId => {
            const dept = departments.find(d => d.id === deptId)
            if (!dept) return null

            return (
              <div key={deptId}>
                <h4 className="font-medium text-charcoal mb-3">{dept.name} - Areas & Roles</h4>
                <div className="space-y-4">
                  {getAreas(deptId).map(area => (
                    <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h5 className="font-medium text-charcoal">{area.name}</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {getRoles(deptId, area.id).map(role => (
                          <label key={role.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assignments.roles.includes(role.name)}
                              onChange={(e) => handleRoleChange(role.name, e.target.checked)}
                              className="w-3 h-3 text-gold border-gray-300 rounded focus:ring-gold"
                            />
                            <span className="text-sm text-charcoal">{role.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 sm:px-8 py-4 border-t border-gray-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="text-xs text-charcoal/60 text-center sm:text-left">
              * Assignments determine shift eligibility in the scheduling system
            </div>
            <div className="flex justify-center sm:justify-end">
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-6 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold/90 transition-colors"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Roles Details Modal Component
const RolesDetailsModal = ({ employee, departments, onClose }) => {
  const currentRoles = employee.assignments?.roles || []
  const currentDepartments = employee.assignments?.departments || []

  // Group roles by their departments and areas
  const groupedRoles = []
  
  currentDepartments.forEach(deptId => {
    const dept = departments.find(d => d.id === deptId)
    if (!dept) return
    
    const areas = getAreas(deptId)
    areas.forEach(area => {
      const areaRoles = getRoles(deptId, area.id)
      const employeeRolesInArea = areaRoles
        .filter(role => currentRoles.includes(role.name))
        .map(role => role.name)
      
      if (employeeRolesInArea.length > 0) {
        groupedRoles.push({
          department: dept.name,
          departmentColor: dept.color,
          area: area.name,
          roles: employeeRolesInArea
        })
      }
    })
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 px-6 py-4 border-b border-gold/20 mobile-navy-header mobile-modal-padding">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold font-display text-cream mobile-modal-header">Role Details</h3>
              <p className="text-sm text-cream/80 mt-1 mobile-subtitle">
                {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-cream/60 hover:text-cream hover:bg-cream/10 rounded-lg p-2 transition-all duration-200 mobile-icon-button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{maxHeight: 'calc(80vh - 140px)'}}>
          {/* Employee Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-charcoal">Assignment Summary</h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-charcoal/60">Total Roles:</span>
                <span className="ml-2 font-semibold text-charcoal">{currentRoles.length}</span>
              </div>
              <div>
                <span className="text-charcoal/60">Departments:</span>
                <span className="ml-2 font-semibold text-charcoal">{currentDepartments.length}</span>
              </div>
            </div>
          </div>

          {/* Roles by Department and Area */}
          {groupedRoles.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-charcoal">Current Role Assignments</h4>
              {groupedRoles.map((group, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${group.departmentColor === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
                      <Building2 className={`w-4 h-4 ${group.departmentColor === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h5 className="font-medium text-charcoal">{group.department}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">{group.area}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.roles.map((role, roleIndex) => (
                      <span 
                        key={roleIndex} 
                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-lg bg-green-50 text-green-700 border border-green-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Roles Assigned</h4>
              <p className="text-gray-500">This employee currently has no role assignments.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end mobile-modal-padding">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold/90 transition-colors mobile-primary-button mobile-gold-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleAssignment
