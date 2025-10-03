import { useState, useEffect } from 'react'
import { PlayCircle, Edit, Save, X, Plus, QrCode, Eye, Trash2, Clock, CheckCircle, Users, RotateCcw, Send, AlertTriangle, Calendar, ChevronDown } from 'lucide-react'
import notificationService from '../../services/notificationService'
import adminApiService from '../../services/adminApiService'

const TrainingModuleManagement = () => {
  const [trainingModules, setTrainingModules] = useState([])
  const [editingModule, setEditingModule] = useState(null)
  const [showAddModule, setShowAddModule] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(null)
  const [showResetModal, setShowResetModal] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState(['Safety', 'Service', 'Technology', 'Operations', 'Leadership', 'Other'])


  useEffect(() => {
    loadTrainingModules()
    loadEmployees()
    loadCategories()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await adminApiService.getEmployees()
      if (response.success) {
        const employees = response.employees || []
        setEmployees(employees)
      } else {
        console.error('Failed to load employees:', response.error)
        setError('Failed to load employees')
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      setError('Failed to load employees')
    }
  }

  const loadTrainingModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApiService.getTrainingModules()
      if (response.success) {
        setTrainingModules(response.modules || [])
      } else {
        console.error('Failed to load training modules:', response.error)
        setError(response.error || 'Failed to load training modules')
      }
    } catch (error) {
      console.error('Error loading training modules:', error)
      setError('Failed to load training modules')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await adminApiService.getTrainingCategories()
      if (response.success && response.categories.length > 0) {
        // Merge API categories with default ones
        const apiCategories = response.categories
        const defaultCategories = ['Safety', 'Service', 'Technology', 'Operations', 'Leadership', 'Other']
        const allCategories = [...new Set([...apiCategories, ...defaultCategories])]
        setCategories(allCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Keep default categories on error
    }
  }

  const saveModule = async (moduleData) => {
    try {
      setLoading(true)
      setError(null)

      // Ensure duration is a string as expected by backend validation
      const processedData = {
        ...moduleData,
        duration: typeof moduleData.duration === 'number' 
          ? `${moduleData.duration} minutes` 
          : moduleData.duration || ''
      }

      let response
      if (editingModule) {
        // Update existing module
        response = await adminApiService.updateTrainingModule(editingModule.id, processedData)
      } else {
        // Create new module
        response = await adminApiService.createTrainingModule(processedData)
      }

      if (response.success) {
        await loadTrainingModules() // Reload modules to get updated data
        setEditingModule(null)
        setShowAddModule(false)
        notificationService.showSuccess(
          editingModule ? 'Training module updated successfully' : 'Training module created successfully'
        )
      } else {
        setError(response.error || 'Failed to save training module')
        notificationService.showError(response.error || 'Failed to save training module')
      }
    } catch (error) {
      console.error('Error saving module:', error)
      const errorMessage = 'Failed to save training module'
      setError(errorMessage)
      notificationService.showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteModule = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this training module? This action cannot be undone.')) {
      try {
        setLoading(true)
        const response = await adminApiService.deleteTrainingModule(moduleId)
        if (response.success) {
          await loadTrainingModules() // Reload modules to get updated data
          notificationService.showSuccess('Training module deleted successfully')
        } else {
          notificationService.showError(response.error || 'Failed to delete training module')
        }
      } catch (error) {
        console.error('Error deleting module:', error)
        notificationService.showError('Failed to delete training module')
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleModuleActive = async (moduleId) => {
    try {
      const module = trainingModules.find(m => m.id === moduleId)
      if (!module) return

      const updatedModule = {
        ...module,
        active: !module.active
      }

      const response = await adminApiService.updateTrainingModule(moduleId, updatedModule)
      if (response.success) {
        await loadTrainingModules() // Reload modules to get updated data
        notificationService.showSuccess(
          `Training module ${updatedModule.active ? 'activated' : 'deactivated'} successfully`
        )
      } else {
        notificationService.showError(response.error || 'Failed to update training module')
      }
    } catch (error) {
      console.error('Error toggling module active status:', error)
      notificationService.showError('Failed to update training module')
    }
  }

  const generateQRCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `TRAIN_MODULE_${timestamp}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-charcoal">Training Module Management</h2>
          <p className="text-charcoal/70 text-sm">Create and manage training modules with QR code access control</p>
        </div>
        <button
          onClick={() => setShowAddModule(true)}
          className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-charcoal/70">Total Modules</p>
              <p className="text-xl sm:text-2xl font-bold text-charcoal">{trainingModules.length}</p>
            </div>
            <PlayCircle className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-charcoal/70">Active Modules</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{trainingModules.filter(m => m.active).length}</p>
            </div>
            <CheckCircle className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-charcoal/70">Categories</p>
              <p className="text-xl sm:text-2xl font-bold text-charcoal">{[...new Set(trainingModules.map(m => m.category))].length}</p>
            </div>
            <QrCode className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-charcoal/70">Total Duration</p>
              <p className="text-lg sm:text-lg font-bold text-charcoal">
                {trainingModules.reduce((total, module) => {
                  const duration = parseInt(module.duration) || 0
                  return total + duration
                }, 0)} min
              </p>
            </div>
            <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {trainingModules
          .sort((a, b) => a.order - b.order)
          .map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${module.active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <PlayCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${module.active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-charcoal text-sm sm:text-base">{module.title}</h3>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          module.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {module.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          {module.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-charcoal/70 mb-3">{module.description}</p>
                
                <div className="space-y-2 text-xs text-charcoal/60 mb-4">
                  <div className="flex justify-between items-center">
                    <span>Duration:</span>
                    <span className="font-medium">{module.duration}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="flex-shrink-0">QR Code:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all">{module.qrCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Created:</span>
                    <span>{new Date(module.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Enhanced Action Section */}
                <div className="space-y-3">
                  {/* Preview and Quick Stats */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <button
                      onClick={() => setShowPreview(module)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">Preview Content</span>
                      <span className="sm:hidden">Preview</span>
                    </button>
                    {employees.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-charcoal/60">
                        <Users className="w-3 h-3" />
                        <span>{employees.filter(emp => emp.training_assignments?.some(a => a.module_id === module.id && a.status !== 'removed')).length} assigned</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Training Management Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowAssignModal(module)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-all duration-200 border border-blue-200"
                      title="Assign to Employees"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Assign</span>
                    </button>
                    <button
                      onClick={() => setShowResetModal(module)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100 transition-all duration-200 border border-orange-200"
                      title="Reset Progress"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                  
                  {/* Module Management Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => toggleModuleActive(module.id)}
                        className={`p-1.5 rounded-md text-xs ${
                          module.active 
                            ? 'text-orange-600 hover:bg-orange-50 border border-orange-200' 
                            : 'text-green-600 hover:bg-green-50 border border-green-200'
                        }`}
                        title={module.active ? 'Deactivate' : 'Activate'}
                      >
                        {module.active ? <X className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setEditingModule(module)}
                        className="p-1.5 text-gold hover:bg-gold/10 rounded-md border border-gold/30 text-xs"
                        title="Edit Module"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => deleteModule(module.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-200 text-xs"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Add/Edit Module Modal */}
      {(showAddModule || editingModule) && (
        <ModuleEditorModal
          module={editingModule}
          categories={categories}
          onSave={saveModule}
          onClose={() => {
            setShowAddModule(false)
            setEditingModule(null)
          }}
          generateQRCode={generateQRCode}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ModulePreviewModal
          module={showPreview}
          onClose={() => setShowPreview(null)}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <TrainingAssignmentModal
          module={showAssignModal}
          employees={employees}
          onClose={() => setShowAssignModal(null)}
          onAssign={async (assignments) => {
            try {
              setLoading(true)
              const employeeIds = assignments.map(a => a.employeeId)
              const dueDate = assignments[0]?.dueDate || null
              
              const assignmentData = {
                employee_ids: employeeIds,
                due_date: dueDate,
                assignment_type: dueDate ? 'scheduled' : 'immediate',
                notes: 'Assigned via training management interface'
              }
              
              const response = await adminApiService.assignTrainingModule(showAssignModal.id, assignmentData)
              
              if (response.success) {
                notificationService.showSuccess(
                  `Training assigned to ${response.total_assigned} employee${response.total_assigned !== 1 ? 's' : ''} successfully`
                )
                
                // Show warnings if any
                if (response.warnings && response.warnings.length > 0) {
                  response.warnings.forEach(warning => {
                    notificationService.showWarning(warning)
                  })
                }
                
                // Refresh employees data
                await loadEmployees()
              } else {
                notificationService.showError(response.error || 'Failed to assign training')
              }
            } catch (error) {
              console.error('Error assigning training:', error)
              notificationService.showError('Failed to assign training')
            } finally {
              setLoading(false)
            }
            
            setShowAssignModal(null)
          }}
        />
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <TrainingResetModal
          module={showResetModal}
          employees={employees}
          onClose={() => setShowResetModal(null)}
          onReset={async (employeeIds) => {
            try {
              setLoading(true)
              
              const response = await adminApiService.resetTrainingProgress(showResetModal.id, employeeIds)
              
              if (response.success) {
                notificationService.showSuccess(
                  `Training progress reset for ${response.reset_count} employee${response.reset_count !== 1 ? 's' : ''} successfully`
                )
                
                // Refresh employees data to get updated assignments
                await loadEmployees()
              } else {
                notificationService.showError(response.error || 'Failed to reset training progress')
              }
            } catch (error) {
              console.error('Error resetting training progress:', error)
              notificationService.showError('Failed to reset training progress')
            } finally {
              setLoading(false)
            }
            
            setShowResetModal(null)
          }}
        />
      )}
    </div>
  )
}

// Module Editor Modal Component
const ModuleEditorModal = ({ module, categories, onSave, onClose, generateQRCode }) => {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || '',
    qrCode: module?.qrCode || generateQRCode(),
    videoUrl: module?.videoUrl || '',
    duration: module?.duration || '',
    category: module?.category || 'Other',
    content: module?.content || '',
    order: module?.order || 1
  })

  const handleSave = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-charcoal">
            {module ? 'Edit Training Module' : 'Add New Training Module'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter module title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the training module"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            {/* QR Code and Video */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  QR Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.qrCode}
                    onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                    placeholder="QR code for unlocking module"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-mono"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, qrCode: generateQRCode() })}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    title="Generate new QR code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 15 minutes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Video URL (Optional)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or direct video URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
              <p className="text-xs text-charcoal/60 mt-1">
                Supports YouTube, Vimeo, and direct video file URLs (.mp4, .webm, .ogg). YouTube URLs will be automatically converted to embeddable format.
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Training Content * (HTML supported)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the training module content (HTML tags are supported)"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-mono text-sm resize-none"
              />
              <p className="text-xs text-charcoal/60 mt-1">
                You can use HTML tags for formatting. Common tags: &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </p>
            </div>

            {/* Preview */}
            {formData.content && (
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Content Preview
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <div 
                    className="prose max-w-none text-charcoal"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-gold-gradient text-charcoal rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium order-1 sm:order-2"
          >
            <Save className="w-4 h-4" />
            <span>{module ? 'Update Module' : 'Create Module'}</span>
          </button>
        </div>
      </div>
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

// Module Preview Modal Component
const ModulePreviewModal = ({ module, onClose }) => {
  const videoUrl = module.video_url || module.videoUrl
  const embeddableVideoUrl = getEmbeddableVideoUrl(videoUrl)
  const isDirectVideo = isDirectVideoUrl(videoUrl)
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">{module.title}</h3>
            <p className="text-sm text-charcoal/60">{module.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Module Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-charcoal/70">QR Code:</span>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded mt-1">{module.qr_code || module.qrCode}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-charcoal/70">Duration:</span>
                <p className="text-sm mt-1">{module.duration}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-charcoal/70">Category:</span>
                <p className="text-sm mt-1">{module.category}</p>
              </div>
            </div>

            {/* Video */}
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
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                      <div className="text-center text-gray-500">
                        <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
                  <strong>Original URL:</strong> 
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
                className="prose max-w-none text-charcoal bg-white p-4 rounded-lg border border-gray-200"
                dangerouslySetInnerHTML={{ __html: module.content }}
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-charcoal rounded-md hover:bg-gray-300 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}

// Training Assignment Modal Component
const TrainingAssignmentModal = ({ module, employees, onClose, onAssign }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [globalDueDate, setGlobalDueDate] = useState('')
  const [assignmentType, setAssignmentType] = useState('immediate') // 'immediate' or 'scheduled'
  const [individualDates, setIndividualDates] = useState({})

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAll = () => {
    const availableEmployees = employees.filter(emp => 
      (emp.status === 'approved' || emp.status === 'ACTIVE') && 
      !emp.trainingAssignments?.some(a => a.moduleId === module.id && !a.completedAt)
    )
    setSelectedEmployees(availableEmployees.map(emp => emp.id))
  }

  const clearSelection = () => {
    setSelectedEmployees([])
  }

  const handleAssign = () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee')
      return
    }

    const assignments = selectedEmployees.map(employeeId => ({
      employeeId,
      dueDate: assignmentType === 'scheduled' 
        ? (individualDates[employeeId] || globalDueDate)
        : null
    }))

    onAssign(assignments)
  }

  const isEmployeeAssigned = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.training_assignments?.some(a => 
      a.module_id === module.id && a.status !== 'removed' && a.status !== 'completed'
    ) || false
  }

  const getEmployeeName = (employee) => {
    return `${employee.personalInfo?.firstName || employee.name || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
  }

  const availableEmployees = employees.filter(emp => emp.status === 'approved' || emp.status === 'ACTIVE')
  const assignableEmployees = availableEmployees.filter(emp => !isEmployeeAssigned(emp.id))
  const alreadyAssigned = availableEmployees.filter(emp => isEmployeeAssigned(emp.id))

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20 mobile-navy-header">
          <div className="flex justify-between items-center mobile-modal-header-container">
            <div className="mobile-header-container">
              <h3 className="text-lg font-bold font-display text-cream mobile-modal-header mobile-text-left">Assign Training Module</h3>
              <p className="text-sm text-cream/80 mobile-subtitle mobile-text-left">{module.title}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-cream/60 hover:text-cream hover:bg-cream/10 rounded-lg p-2 transition-all duration-200 mobile-icon-button"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)] mobile-modal-padding">
          <div className="space-y-4 sm:space-y-6">
            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3 mobile-form-label">Assignment Type</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setAssignmentType('immediate')}
                  className={`p-2 sm:p-3 rounded-lg border text-left transition-all mobile-card ${
                    assignmentType === 'immediate'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm mobile-card-title">Immediate</div>
                  <div className="text-xs text-gray-500 mobile-card-subtitle">Start training right away</div>
                </button>
                <button
                  onClick={() => setAssignmentType('scheduled')}
                  className={`p-2 sm:p-3 rounded-lg border text-left transition-all mobile-card ${
                    assignmentType === 'scheduled'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm mobile-card-title">Scheduled</div>
                  <div className="text-xs text-gray-500 mobile-card-subtitle">Set due date</div>
                </button>
              </div>
            </div>

            {/* Due Date Settings */}
            {assignmentType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2 mobile-form-label">Due Date</label>
                <input
                  type="date"
                  value={globalDueDate}
                  onChange={(e) => setGlobalDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-form-input"
                />
              </div>
            )}

            {/* Employee Selection */}
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                <label className="text-sm font-medium text-charcoal mobile-form-label mobile-text-left">
                  Select Employees ({assignableEmployees.length} available)
                </label>
                <div className="flex gap-2 mobile-button-container">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 mobile-link-button"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-600 hover:text-gray-800 mobile-link-button"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Assignable Employees */}
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {assignableEmployees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-charcoal">
                        {getEmployeeName(employee)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.location?.name || 'No location'} • {employee.status}
                      </div>
                    </div>
                  </label>
                ))}
                
                {assignableEmployees.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No employees available for assignment</p>
                  </div>
                )}
              </div>

              {/* Already Assigned */}
              {alreadyAssigned.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Already Assigned ({alreadyAssigned.length})
                  </label>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {alreadyAssigned.map((employee) => (
                      <div key={employee.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div className="text-sm text-gray-600">
                          {getEmployeeName(employee)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 mobile-modal-padding">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-gray-600 mobile-subtitle mobile-text-left order-2 sm:order-1">
              {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3 order-1 sm:order-2">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-charcoal border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mobile-secondary-button"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedEmployees.length === 0}
                className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mobile-primary-button"
              >
                <Send className="w-4 h-4" />
                Assign Training
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Training Reset Modal Component
const TrainingResetModal = ({ module, employees, onClose, onReset }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [resetType, setResetType] = useState('progress') // 'progress' or 'assignment'

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAll = () => {
    const affectedEmployees = getAffectedEmployees()
    setSelectedEmployees(affectedEmployees.map(emp => emp.id))
  }

  const clearSelection = () => {
    setSelectedEmployees([])
  }

  const handleReset = () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee')
      return
    }

    const confirmMessage = `Are you sure you want to reset training for ${selectedEmployees.length} employee${selectedEmployees.length !== 1 ? 's' : ''}? This will remove their progress and they will need to complete the training again.`
    
    if (window.confirm(confirmMessage)) {
      onReset(selectedEmployees)
    }
  }

  const getAffectedEmployees = () => {
    return employees.filter(employee => {
      const hasAssignment = employee.training_assignments?.some(a => a.module_id === module.id && a.status !== 'removed')
      const hasProgress = employee.training_progress?.some(p => p.module_id === module.id) || 
                         employee.training_assignments?.some(a => a.module_id === module.id && (a.status === 'unlocked' || a.status === 'in_progress' || a.status === 'completed'))
      return hasAssignment || hasProgress
    })
  }

  const getEmployeeName = (employee) => {
    return `${employee.personalInfo?.firstName || employee.name || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
  }

  const getEmployeeStatus = (employee) => {
    const assignment = employee.training_assignments?.find(a => a.module_id === module.id && a.status !== 'removed')
    
    if (!assignment) {
      return { status: 'No Assignment', color: 'text-gray-600' }
    }
    
    switch (assignment.status) {
      case 'completed':
        return { status: 'Completed', color: 'text-green-600', date: assignment.completed_at }
      case 'overdue':
        return { status: 'Overdue', color: 'text-red-600', date: assignment.due_date }
      case 'in_progress':
        return { status: 'In Progress', color: 'text-orange-600', date: assignment.started_at }
      case 'unlocked':
        return { status: 'Unlocked', color: 'text-blue-600', date: assignment.unlocked_at }
      case 'assigned':
        if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
          return { status: 'Overdue', color: 'text-red-600', date: assignment.due_date }
        }
        return { status: 'Assigned', color: 'text-blue-600', date: assignment.assigned_at }
      default:
        return { status: 'Unknown', color: 'text-gray-600' }
    }
  }

  const affectedEmployees = getAffectedEmployees()

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-brand-navy to-brand-navy/90 border-b border-gold/20 mobile-navy-header">
          <div className="flex justify-between items-center mobile-modal-header-container">
            <div className="mobile-header-container">
              <h3 className="text-lg font-bold font-display text-cream mobile-modal-header mobile-text-left">Reset Training Progress</h3>
              <p className="text-sm text-cream/80 mobile-subtitle mobile-text-left">{module.title}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-cream/60 hover:text-cream hover:bg-cream/10 rounded-lg p-2 transition-all duration-200 mobile-icon-button"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 sm:p-6 bg-orange-50 border-b border-orange-200 mobile-modal-padding">
          <div className="flex items-start gap-3 mobile-warning-container">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0 mobile-warning-icon" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-orange-800 mb-2 mobile-form-label mobile-warning-text">
                Warning: This action cannot be undone
              </h4>
              <p className="text-sm leading-relaxed text-orange-700 mobile-subtitle mobile-warning-text">
                Resetting will remove all training progress, completion records, and unlock status for selected employees. 
                They will need to complete the training again from the beginning.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-280px)] mobile-modal-padding">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <label className="text-sm font-medium text-charcoal mobile-form-label mobile-text-left">
                Select Employees to Reset ({affectedEmployees.length} have progress)
              </label>
              <div className="flex gap-2 mobile-button-container">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 mobile-link-button"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-600 hover:text-gray-800 mobile-link-button"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {affectedEmployees.map((employee) => {
                const employeeStatus = getEmployeeStatus(employee)
                return (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-charcoal">
                        {getEmployeeName(employee)}
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className={`font-medium ${employeeStatus.color}`}>
                          {employeeStatus.status}
                        </span>
                        {employeeStatus.date && (
                          <span className="text-gray-500">
                            {new Date(employeeStatus.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}

              {affectedEmployees.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No employees have progress to reset</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 mobile-modal-padding">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-sm text-gray-600 mobile-subtitle mobile-text-left order-2 sm:order-1">
              {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected for reset
            </div>
            <div className="flex gap-3 order-1 sm:order-2">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-charcoal border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mobile-secondary-button"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={selectedEmployees.length === 0}
                className="flex-1 sm:flex-none px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mobile-primary-button"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingModuleManagement
