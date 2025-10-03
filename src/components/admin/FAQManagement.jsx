import { useState, useEffect } from 'react'
import { HelpCircle, Edit, Save, X, Plus, Trash2, Search, Filter, Eye } from 'lucide-react'
import adminApiService from '../../services/adminApiService'

const FAQManagement = () => {
  const [faqItems, setFaqItems] = useState([])
  const [editingFaq, setEditingFaq] = useState(null)
  const [showAddFaq, setShowAddFaq] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, categories: 0 })


  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Categories' }
  ])

  useEffect(() => {
    loadFaqItems()
    loadCategories()
  }, [])
  
  // Reload FAQs when search term or category changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      loadFaqItems()
    }, 300)
    
    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, selectedCategory])

  const loadFaqItems = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedCategory !== 'all') filters.category = selectedCategory
      if (searchTerm) filters.search = searchTerm
      
      const response = await adminApiService.getFaqs(filters)
      
      if (response.success) {
        setFaqItems(response.data)
        if (response.stats) {
          setStats(response.stats)
        }
      } else {
        console.error('Failed to load FAQs:', response.error)
        alert('Failed to load FAQs: ' + response.error)
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
      alert('Error loading FAQs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const loadCategories = async () => {
    try {
      const response = await adminApiService.getFaqCategories()
      
      if (response.success) {
        const categoryOptions = [
          { id: 'all', name: 'All Categories' },
          ...Object.entries(response.data).map(([id, name]) => ({ id, name }))
        ]
        setCategories(categoryOptions)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const saveFaq = async (faqData) => {
    try {
      let response
      if (editingFaq) {
        // Update existing FAQ
        response = await adminApiService.updateFaq(editingFaq.id, faqData)
      } else {
        // Add new FAQ
        response = await adminApiService.createFaq({
          ...faqData,
          active: faqData.active ?? true
        })
      }
      
      if (response.success) {
        // Reload FAQ items to get fresh data
        await loadFaqItems()
        setEditingFaq(null)
        setShowAddFaq(false)
        alert(response.message || (editingFaq ? 'FAQ updated successfully' : 'FAQ created successfully'))
      } else {
        alert('Error saving FAQ: ' + response.error)
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      alert('Error saving FAQ: ' + error.message)
    }
  }

  const deleteFaq = async (faqId) => {
    if (window.confirm('Are you sure you want to delete this FAQ item?')) {
      try {
        const response = await adminApiService.deleteFaq(faqId)
        
        if (response.success) {
          // Reload FAQ items to get fresh data
          await loadFaqItems()
          alert(response.message || 'FAQ deleted successfully')
        } else {
          alert('Error deleting FAQ: ' + response.error)
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error)
        alert('Error deleting FAQ: ' + error.message)
      }
    }
  }

  const toggleFaqActive = async (faqId) => {
    try {
      const response = await adminApiService.toggleFaqStatus(faqId)
      
      if (response.success) {
        // Reload FAQ items to get fresh data
        await loadFaqItems()
        alert(response.message || 'FAQ status updated successfully')
      } else {
        alert('Error updating FAQ status: ' + response.error)
      }
    } catch (error) {
      console.error('Error updating FAQ status:', error)
      alert('Error updating FAQ status: ' + error.message)
    }
  }

  // Since we now filter on the backend, we can directly use faqItems
  const filteredFaqs = faqItems

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-charcoal">FAQ Management</h2>
          <p className="text-charcoal/70">Manage frequently asked questions for employees</p>
        </div>
        <button
          onClick={() => setShowAddFaq(true)}
          className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mobile-hide-button-icons whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="mobile-text-content">Add FAQ</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Total FAQs</p>
              <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Active FAQs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Categories</p>
              <p className="text-2xl font-bold text-charcoal">{stats.categories}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal/70">Most Popular</p>
              <p className="text-sm font-bold text-charcoal">Uniform</p>
            </div>
            <HelpCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search FAQ questions and answers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {searchTerm && (
          <div className="mt-4">
            <p className="text-sm text-charcoal/70">
              Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          </div>
        )}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-3"></div>
            <p className="text-lg font-medium text-charcoal">Loading FAQs...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-charcoal mb-2">No FAQ items found</p>
            <p className="text-sm text-charcoal/60">
              {searchTerm 
                ? `No FAQ items match your search for "${searchTerm}"`
                : 'No FAQ items available in this category'
              }
            </p>
          </div>
        ) : (
          filteredFaqs
            .sort((a, b) => a.order - b.order)
            .map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${faq.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <HelpCircle className={`w-4 h-4 ${faq.active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            faq.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {faq.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                            {faq.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-charcoal mb-2">{faq.question}</h3>
                      <p className="text-sm text-charcoal/70 mb-3 line-clamp-2">{faq.answer}</p>
                      
                      <div className="text-xs text-charcoal/50">
                        Created: {new Date(faq.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleFaqActive(faq.id)}
                        className={`p-2 rounded-md ${
                          faq.active 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={faq.active ? 'Deactivate' : 'Activate'}
                      >
                        {faq.active ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingFaq(faq)}
                        className="p-2 text-gold hover:bg-gold/10 rounded-md"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add/Edit FAQ Modal */}
      {(showAddFaq || editingFaq) && (
        <FAQEditorModal
          faq={editingFaq}
          categories={categories.filter(c => c.id !== 'all')}
          onSave={saveFaq}
          onClose={() => {
            setShowAddFaq(false)
            setEditingFaq(null)
          }}
        />
      )}
    </div>
  )
}

// FAQ Editor Modal Component
const FAQEditorModal = ({ faq, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'other',
    order: faq?.order || 1
  })

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-charcoal">
            {faq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
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

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Question *
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the FAQ question"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            {/* Answer */}
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">
                Answer *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the detailed answer"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              />
              <p className="text-xs text-charcoal/60 mt-1">
                Provide a clear, comprehensive answer to help employees
              </p>
            </div>

            {/* Preview */}
            {formData.question && formData.answer && (
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-2">
                  Preview
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-charcoal mb-2">{formData.question}</h4>
                  <p className="text-sm text-charcoal/80">{formData.answer}</p>
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                      {formData.category.replace('-', ' ')}
                    </span>
                  </div>
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
            <span>{faq ? 'Update FAQ' : 'Create FAQ'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FAQManagement
