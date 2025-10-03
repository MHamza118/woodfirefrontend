import { useState, useEffect } from 'react'
import { BookOpen, Edit, Save, X, Plus, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import adminApiService from '../../services/adminApiService'

const OnboardingContentManagement = () => {
  const [onboardingPages, setOnboardingPages] = useState([])
  const [editingPage, setEditingPage] = useState(null)
  const [showAddPage, setShowAddPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load onboarding pages from API
  const loadOnboardingPages = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminApiService.getOnboardingPages()
      
      if (response.success) {
        setOnboardingPages(response.pages || [])
      } else {
        setError(response.error || 'Failed to load onboarding pages')
        console.error('Failed to load onboarding pages:', response.error)
      }
    } catch (error) {
      setError('Error loading onboarding pages')
      console.error('Error loading onboarding pages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOnboardingPages()
  }, [])

  const savePage = async (pageData) => {
    try {
      setError('')
      let response
      
      if (editingPage) {
        // Update existing page
        response = await adminApiService.updateOnboardingPage(editingPage.id, pageData)
      } else {
        // Add new page
        const newPageData = {
          ...pageData,
          active: true,
          order: onboardingPages.length + 1
        }
        response = await adminApiService.createOnboardingPage(newPageData)
      }
      
      if (response.success) {
        // Reload pages to get fresh data
        await loadOnboardingPages()
        setEditingPage(null)
        setShowAddPage(false)
      } else {
        setError(response.error || 'Failed to save page')
      }
    } catch (error) {
      setError('Error saving page')
      console.error('Error saving page:', error)
    }
  }

  const deletePage = async (pageId) => {
    if (window.confirm('Are you sure you want to delete this onboarding page?')) {
      try {
        setError('')
        const response = await adminApiService.deleteOnboardingPage(pageId)
        
        if (response.success) {
          // Reload pages to get fresh data
          await loadOnboardingPages()
        } else {
          setError(response.error || 'Failed to delete page')
        }
      } catch (error) {
        setError('Error deleting page')
        console.error('Error deleting page:', error)
      }
    }
  }

  const togglePageActive = async (pageId) => {
    try {
      setError('')
      const response = await adminApiService.toggleOnboardingPageStatus(pageId)
      
      if (response.success) {
        // Reload pages to get fresh data
        await loadOnboardingPages()
      } else {
        setError(response.error || 'Failed to toggle page status')
      }
    } catch (error) {
      setError('Error toggling page status')
      console.error('Error toggling page status:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-charcoal">Onboarding Content Management</h2>
          <p className="text-charcoal/70 text-sm">Manage onboarding pages and content that employees must acknowledge</p>
        </div>
        <button
          onClick={() => setShowAddPage(true)}
          disabled={loading}
          className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-3 text-charcoal/70">Loading onboarding pages...</span>
        </div>
      )}

      {/* Pages Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {onboardingPages
          .sort((a, b) => a.order - b.order)
          .map((page) => (
            <div key={page.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${page.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <BookOpen className={`w-5 h-5 ${page.active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-charcoal line-clamp-2">{page.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          page.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {page.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">Order: {page.order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => togglePageActive(page.id)}
                      className={`p-2 rounded-md ${
                        page.active 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={page.active ? 'Deactivate' : 'Activate'}
                    >
                      {page.active ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingPage(page)}
                      className="p-2 text-gold hover:bg-gold/10 rounded-md"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePage(page.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div 
                    className="prose prose-sm max-w-none text-charcoal/80 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: page.content.substring(0, 200) + (page.content.length > 200 ? '...' : '')
                    }}
                  />
                </div>
                
                <div className="text-sm text-charcoal/60">
                  Content length: {page.content.length} characters
                </div>
              </div>
            </div>
          ))
        }
        </div>
      )}

      {/* Add/Edit Page Modal */}
      {(showAddPage || editingPage) && (
        <PageEditorModal
          page={editingPage}
          onSave={savePage}
          onClose={() => {
            setShowAddPage(false)
            setEditingPage(null)
          }}
        />
      )}
    </div>
  )
}

// Page Editor Modal Component
const PageEditorModal = ({ page, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: page?.title || '',
    content: page?.content || '',
    icon: page?.icon || 'BookOpen',
    order: page?.order || 1
  })

  const iconOptions = [
    'BookOpen', 'Calendar', 'Award', 'User', 'FileText', 'Bell', 'Clock', 'Shield'
  ]

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
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
          <h3 className="text-base sm:text-lg font-semibold text-charcoal line-clamp-1 flex-1 mr-4">
            {page ? 'Edit Onboarding Page' : 'Add New Onboarding Page'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter page title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.icon === icon
                        ? 'bg-gold text-charcoal'
                        : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Page Content * (HTML supported)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the page content (HTML tags are supported)"
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
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
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
            <span>{page ? 'Update Page' : 'Create Page'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingContentManagement
