import { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Settings,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  getDepartments, 
  getAreas, 
  getRoles,
  departmentStructure 
} from '../../data/departmentStructure'

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([])
  const [expandedDepts, setExpandedDepts] = useState({})
  const [expandedAreas, setExpandedAreas] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'department', 'area', 'role'

  useEffect(() => {
    loadDepartments()
    
    // Add event listener for external Add Department button
    const handleAddDepartment = () => {
      handleAddItem('department')
    }
    
    const element = document.querySelector('[data-department-management]')
    if (element) {
      element.addEventListener('addDepartment', handleAddDepartment)
      
      return () => {
        element.removeEventListener('addDepartment', handleAddDepartment)
      }
    }
  }, [])

  const loadDepartments = () => {
    const deptData = getDepartments()
    setDepartments(deptData)
    
    // Expand FOH and BOH by default
    setExpandedDepts({
      FOH: true,
      BOH: true
    })
  }

  const toggleDepartment = (deptId) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }))
  }

  const toggleArea = (areaKey) => {
    setExpandedAreas(prev => ({
      ...prev,
      [areaKey]: !prev[areaKey]
    }))
  }

  const handleAddItem = (type, parent = null) => {
    setModalType(type)
    setSelectedItem(parent)
    setShowAddModal(true)
  }

  const getDepartmentStats = (deptId) => {
    const areas = getAreas(deptId)
    const totalRoles = areas.reduce((sum, area) => sum + area.roles.length, 0)
    return {
      areas: areas.length,
      roles: totalRoles
    }
  }

  const getAreaStats = (deptId, areaId) => {
    const roles = getRoles(deptId, areaId)
    return {
      roles: roles.length
    }
  }

  return (
    <div className="space-y-6" data-department-management>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 department-stats-mobile">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-charcoal/70">Total Departments</p>
              <p className="text-xl font-bold text-charcoal">{departments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-charcoal/70">Total Areas</p>
              <p className="text-xl font-bold text-charcoal">
                {departments.reduce((sum, dept) => sum + Object.keys(dept.areas).length, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-charcoal/70">Total Roles</p>
              <p className="text-xl font-bold text-charcoal">
                {departments.reduce((sum, dept) => 
                  sum + Object.values(dept.areas).reduce((areaSum, area) => 
                    areaSum + area.roles.length, 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Tree */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20 mobile-navy-header">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold font-display text-cream">Organization Structure</h4>
              <p className="text-sm text-cream/80">Hierarchical view of departments, areas, and roles</p>
            </div>
            <button
              onClick={() => handleAddItem('department')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold/90 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-6 overflow-x-auto">
          <div className="min-w-full">
            {departments.map((department) => (
              <div key={department.id} className="mb-6 last:mb-0">
                {/* Department Level */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-lg border border-gray-200 mb-3 gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleDepartment(department.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    >
                      {expandedDepts[department.id] ? 
                        <ChevronDown className="w-4 h-4 text-charcoal" /> : 
                        <ChevronRight className="w-4 h-4 text-charcoal" />
                      }
                    </button>
                    
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      department.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'
                    }`}>
                      <Building2 className={`w-4 h-4 md:w-5 md:h-5 ${
                        department.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                      }`} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-charcoal text-sm md:text-base truncate">{department.name}</h5>
                      <p className="text-xs text-charcoal/60 truncate">{department.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      {(() => {
                        const stats = getDepartmentStats(department.id)
                        return (
                          <div className="flex gap-4 text-xs">
                            <span className="text-charcoal/70">
                              {stats.areas} Areas
                            </span>
                            <span className="text-charcoal/70">
                              {stats.roles} Roles
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    
                    <div className="flex gap-2 mobile-button-container">
                      <button
                        onClick={() => handleAddItem('area', department.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors mobile-icon-button"
                        title="Add Area"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors mobile-icon-button">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Areas Level */}
                {expandedDepts[department.id] && (
                  <div className="ml-4 md:ml-8 space-y-3">
                    {getAreas(department.id).map((area) => {
                      const areaKey = `${department.id}-${area.id}`
                      return (
                        <div key={area.id} className="border-l-2 border-gray-200 pl-3 md:pl-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition-colors mb-2 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                onClick={() => toggleArea(areaKey)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              >
                                {expandedAreas[areaKey] ? 
                                  <ChevronDown className="w-3 h-3 text-charcoal" /> : 
                                  <ChevronRight className="w-3 h-3 text-charcoal" />
                                }
                              </button>
                              
                              <div className="p-1.5 bg-blue-50 rounded flex-shrink-0">
                                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h6 className="font-medium text-charcoal text-sm truncate">{area.name}</h6>
                                <p className="text-xs text-charcoal/60 truncate">{area.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <span className="text-xs text-charcoal/70">
                                {getAreaStats(department.id, area.id).roles} Roles
                              </span>
                              
                              <div className="flex gap-2 mobile-button-container">
                                <button
                                  onClick={() => handleAddItem('role', { departmentId: department.id, areaId: area.id })}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors mobile-icon-button"
                                  title="Add Role"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors mobile-icon-button">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Roles Level */}
                          {expandedAreas[areaKey] && (
                            <div className="ml-4 md:ml-6 space-y-2">
                              {getRoles(department.id, area.id).map((role) => (
                                <div key={role.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded border border-gray-100 gap-3 sm:gap-0">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-1 bg-green-50 rounded flex-shrink-0">
                                      <UserCheck className="w-3 h-3 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="text-sm font-medium text-charcoal block truncate">{role.name}</span>
                                      <p className="text-xs text-charcoal/60 truncate">{role.description}</p>
                                    </div>
                                  </div>
                                  
                                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors mobile-icon-button self-start sm:self-center">
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Add/Edit Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mobile-modal-padding">
            <h3 className="text-lg font-semibold text-charcoal mb-4 mobile-modal-header">
              Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h3>
            <p className="text-sm text-charcoal/70 mb-4 mobile-subtitle">
              This feature will be fully implemented in the next phase.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-charcoal border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mobile-secondary-button"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold/90 transition-colors mobile-primary-button mobile-gold-button"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentManagement
