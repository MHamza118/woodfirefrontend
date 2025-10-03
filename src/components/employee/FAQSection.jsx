import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronRight, HelpCircle, Phone, Mail, Clock } from 'lucide-react'
import employeeApiService from '../../services/employeeApiService'

const FAQSection = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [faqData, setFaqData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    loadFaqData()
    loadCategories()
  }, [])
  
  // Reload FAQs when search term or category changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      loadFaqData()
    }, 300)
    
    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, selectedCategory])
  
  const loadFaqData = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (selectedCategory !== 'all') filters.category = selectedCategory
      if (searchTerm) filters.search = searchTerm
      
      const response = await employeeApiService.getFaqs(filters)
      
      if (response.success) {
        setFaqData(response.data)
      } else {
        console.error('Failed to load FAQs:', response.error)
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadCategories = async () => {
    try {
      const response = await employeeApiService.getFaqCategories()
      
      if (response.success) {
        const categoryOptions = [
          { id: 'all', name: 'All Questions', icon: HelpCircle },
          ...Object.entries(response.data).map(([id, name]) => ({ 
            id, 
            name, 
            icon: HelpCircle 
          }))
        ]
        setCategories(categoryOptions)
      } else {
        // Fallback categories if API fails
        setCategories([
          { id: 'all', name: 'All Questions', icon: HelpCircle },
          { id: 'payroll', name: 'Pay & Tips', icon: Clock },
          { id: 'scheduling', name: 'Scheduling', icon: Clock },
          { id: 'benefits', name: 'Benefits', icon: HelpCircle },
          { id: 'uniform', name: 'Uniform & Dress Code', icon: HelpCircle },
          { id: 'training', name: 'Training', icon: HelpCircle },
          { id: 'policies', name: 'Policies', icon: HelpCircle }
        ])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Set fallback categories
      setCategories([
        { id: 'all', name: 'All Questions', icon: HelpCircle },
        { id: 'payroll', name: 'Pay & Tips', icon: Clock },
        { id: 'scheduling', name: 'Scheduling', icon: Clock },
        { id: 'benefits', name: 'Benefits', icon: HelpCircle },
        { id: 'uniform', name: 'Uniform & Dress Code', icon: HelpCircle },
        { id: 'training', name: 'Training', icon: HelpCircle },
        { id: 'policies', name: 'Policies', icon: HelpCircle }
      ])
    }
  }

  // Since we now filter on the backend, we can directly use faqData
  const filteredFAQs = faqData

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-charcoal font-medium">
          {part}
        </span>
      ) : part
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-navy rounded-xl shadow-lg overflow-hidden border border-gold/20">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="hidden xs:block p-2 sm:p-3 bg-gold/20 backdrop-blur-sm rounded-lg">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gold mb-2">Frequently Asked Questions</h3>
              <p className="text-cream/80 text-xs sm:text-sm mb-4 leading-relaxed">
                Find answers to common questions about working at Woodfire.food. 
                Can't find what you're looking for? Contact management for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-100">
          <h3 className="text-base sm:text-lg font-semibold font-display text-charcoal flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:block p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            Search & Filter
          </h3>
          <p className="text-charcoal/70 text-xs sm:text-sm mt-1">Find specific questions and answers</p>
        </div>
        <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQ questions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <p className="text-xs sm:text-sm font-medium text-charcoal/70 mb-2 sm:mb-3">Filter by category:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-charcoal hover:bg-blue-100'
                    }`}
                  >
                    <IconComponent className="hidden xs:inline-block w-3 h-3 sm:w-4 sm:h-4" />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results count */}
          {searchTerm && (
            <p className="text-xs sm:text-sm text-charcoal/70">
              Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          )}
        </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-base sm:text-lg font-medium text-charcoal">Loading FAQs...</p>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 p-6 sm:p-8 text-center">
            <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base sm:text-lg font-medium text-charcoal mb-2">No questions found</p>
            <p className="text-xs sm:text-sm text-charcoal/60">
              {searchTerm 
                ? `No FAQ items match your search for "${searchTerm}"`
                : 'No questions available in this category'
              }
            </p>
          </div>
        ) : (
          filteredFAQs.map((faq) => {
            const isExpanded = expandedItems.has(faq.id)
            
            return (
              <div key={faq.id} className="bg-white rounded-xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gold/5 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-inset rounded-xl transition-colors"
                >
                  <div className="flex-1 pr-3 sm:pr-4">
                    <h4 className="text-sm sm:text-base font-medium text-charcoal">
                      {highlightText(faq.question, searchTerm)}
                    </h4>
                    <p className="text-xs sm:text-sm text-charcoal/60 mt-1 capitalize">
                      {faq.category.replace('-', ' ')}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal/50 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-charcoal/50 flex-shrink-0" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-4">
                      <div className="prose prose-sm max-w-none text-charcoal/80 text-xs sm:text-sm">
                        {highlightText(faq.answer, searchTerm)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Contact Information */}
      <div className="bg-brand-navy text-cream rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Still Need Help?</h3>
        <p className="text-cream/80 text-xs sm:text-sm mb-3 sm:mb-4">
          If you can't find the answer to your question, don't hesitate to reach out to management.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
            <div>
              <p className="font-medium">Restaurant Phone</p>
              <p className="text-cream/80">(918) 555-0100</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
            <div>
              <p className="font-medium">HR Email</p>
              <p className="text-cream/80 break-all">hr@309311restaurants.com</p>
            </div>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gold/10 rounded-lg">
          <p className="text-cream text-xs">
            <strong>Emergency Contact:</strong> For urgent matters outside business hours, 
            call the emergency line at (918) 555-0199
          </p>
        </div>
      </div>

    </div>
  )
}

export default FAQSection
