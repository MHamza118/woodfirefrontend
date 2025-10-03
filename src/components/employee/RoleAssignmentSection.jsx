import { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Badge,
  Calendar,
  User
} from 'lucide-react'
import { getDepartments, getAreas, getRoles } from '../../data/departmentStructure'

const RoleAssignmentSection = ({ employeeData }) => {
  const [departments, setDepartments] = useState([])
  
  useEffect(() => {
    setDepartments(getDepartments())
  }, [])

  // Get employee's role assignments
  const assignments = employeeData?.assignments || {
    departments: [],
    areas: [],
    roles: [],
    assignedAt: null,
    assignedBy: null,
    lastModified: null
  }

  const hasAssignments = assignments.departments.length > 0

  // Get department details
  const getAssignmentDetails = () => {
    if (!hasAssignments) return []

    const assignmentDetails = []
    
    assignments.departments.forEach(deptId => {
      const department = departments.find(d => d.id === deptId)
      if (department) {
        const areas = getAreas(deptId)
        
        // Get roles for this department
        const departmentRoles = assignments.roles.filter(roleAssignment => {
          const areas = getAreas(deptId)
          return areas.some(area => {
            const roles = getRoles(deptId, area.id)
            return roles.some(role => role.name === roleAssignment)
          })
        })

        assignmentDetails.push({
          department,
          areas: areas.filter(area => {
            const roles = getRoles(deptId, area.id)
            return roles.some(role => assignments.roles.includes(role.name))
          }),
          roles: departmentRoles
        })
      }
    })

    return assignmentDetails
  }

  const assignmentDetails = getAssignmentDetails()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gold/10 rounded-lg mobile-hide-hero-icon">
            <Building2 className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-charcoal">My Role Assignments</h2>
            <p className="text-charcoal/60">Your current departments, areas, and roles assigned by management</p>
          </div>
        </div>

        {/* Assignment Status - Between Description and Cards */}
        <div className="flex items-center gap-2 mb-4">
          {hasAssignments ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Assignments Active</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700 font-medium">No Assignments Yet</span>
            </>
          )}
        </div>

        {/* Last Modified Info */}
        {hasAssignments && assignments.lastModified && (
          <div className="text-right mb-4">
            <span className="text-sm text-charcoal/60">
              Last updated {new Date(assignments.lastModified).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Assignment Summary */}
        {hasAssignments && (() => {
          // Calculate actual assigned areas count
          const totalAreas = assignmentDetails.reduce((total, detail) => total + detail.areas.length, 0)
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xl font-bold text-purple-700">{assignments.departments.length}</div>
                <div className="text-xs text-purple-600 font-medium">Department{assignments.departments.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xl font-bold text-blue-700">{totalAreas}</div>
                <div className="text-xs text-blue-600 font-medium">Area{totalAreas !== 1 ? 's' : ''}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl font-bold text-green-700">{assignments.roles.length}</div>
                <div className="text-xs text-green-600 font-medium">Role{assignments.roles.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Assignment Details - Horizontal Layout */}
      {hasAssignments ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assignmentDetails.map((detail, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Department Header - Compact */}
              <div className={`px-4 py-3 ${detail.department.id === 'FOH' ? 'bg-purple-50 border-b border-purple-200' : 'bg-orange-50 border-b border-orange-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${detail.department.id === 'FOH' ? 'bg-purple-100' : 'bg-orange-100'} mobile-hide-section-header-icon`}>
                    <Building2 className={`w-4 h-4 ${detail.department.id === 'FOH' ? 'text-purple-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${detail.department.id === 'FOH' ? 'text-purple-900' : 'text-orange-900'}`}>
                      {detail.department.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Areas and Roles - Mobile Card Layout */}
              <div className="p-3">
                <div className="space-y-3">
                  {detail.areas.map((area, areaIndex) => {
                    const areaRoles = getRoles(detail.department.id, area.id).filter(role => 
                      assignments.roles.includes(role.name)
                    )

                    return (
                      <div key={area.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {/* Area Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-charcoal">{area.name}</span>
                        </div>
                        
                        {/* Roles */}
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-600 mb-1">Assigned Roles:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {areaRoles.map((role) => (
                              <span key={role.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700 border border-green-200">
                                <Badge className="w-2 h-2" />
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // No Assignments State
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-amber-50 rounded-full w-fit mx-auto mb-4">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No Role Assignments Yet</h3>
            <p className="text-charcoal/60 mb-4">
              Your manager hasn't assigned you to any departments or roles yet. Role assignments will appear here once they're made by management.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">What happens when you get assigned?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll see your assigned departments (FOH/BOH)</li>
                <li>• Your specific work areas will be listed</li>
                <li>• All your job roles will be displayed</li>
                <li>• This will affect your scheduling eligibility</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default RoleAssignmentSection
