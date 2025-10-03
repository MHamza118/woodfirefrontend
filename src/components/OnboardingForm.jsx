import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, Upload, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import FloatingLabelInput from './FloatingLabelInput'
import employeeApiService from '../services/employeeApiService'

const OnboardingForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [questionnaire, setQuestionnaire] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  // Load questionnaire and employee data
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        setLoading(true)
        const response = await employeeApiService.getQuestionnaire()
        
        if (response.success) {
          setQuestionnaire(response.questionnaire)
          setEmployee(response.employee)
        } else {
          console.error('Failed to load questionnaire:', response.error)
          
          // Handle different stage-related errors more gracefully
          if (response.error.includes('QR scan and location selection') || 
              response.error.includes('not in correct stage')) {
            // Employee needs to complete earlier stages
            navigate('/employee/qr-scan')
          } else if (response.error.includes('No active questionnaire')) {
            // No questionnaire available - show appropriate message
            setSubmitError('No questionnaire is currently available. Please contact support.')
          } else {
            // Generic error - redirect to QR scan
            navigate('/employee/qr-scan')
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error)
        
        // Parse error messages for better user experience
        const errorMessage = error.message || 'Unknown error'
        if (errorMessage.includes('QR scan and location selection')) {
          navigate('/employee/qr-scan')
        } else {
          setSubmitError('Failed to load questionnaire. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'employee') {
      // If employee has already completed questionnaire, redirect to confirmation
      if (user.stage === 'questionnaire_completed') {
        navigate('/confirmation')
        return
      }
      loadOnboardingData()
    } else {
      navigate('/login')
    }
  }, [user, navigate])

  // Initialize form data when questionnaire loads
  useEffect(() => {
    if (questionnaire?.questions) {
      const initialFormData = {}
      questionnaire.questions.forEach((question, index) => {
        const fieldName = `question_${index}`
        if (question.type === 'multiple_choice') {
          initialFormData[fieldName] = []
        } else {
          initialFormData[fieldName] = ''
        }
      })
      setFormData(initialFormData)
    }
  }, [questionnaire])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error when user interacts
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || []
      return {
        ...prev,
        [name]: currentValues.includes(value)
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value]
      }
    })

    // Clear error when user selects
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const formatPhoneNumber = (value) => {
    let phoneNumber = value.replace(/[^\d+]/g, '')
    if (phoneNumber.includes('+')) {
      const parts = phoneNumber.split('+')
      phoneNumber = '+' + parts.join('')
    }

    if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.slice(0, 16)
    } else {
      phoneNumber = phoneNumber.slice(0, 15)
    }
    return phoneNumber
  }

  const handleAvailabilityChange = (day, shift) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [shift]: !prev.availability[day][shift]
        }
      }
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({ ...prev, driversLicense: file }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!questionnaire?.questions) {
      return false
    }

    questionnaire.questions.forEach((question, index) => {
      const fieldName = `question_${index}`
      const value = formData[fieldName]

      if (question.required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          newErrors[fieldName] = `This question is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!validateForm()) {
      setSubmitError('Please answer all required questions')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare form data for API (including files)
      const submitData = new FormData()
      const responses = {}
      
      questionnaire.questions.forEach((question, index) => {
        const fieldName = `question_${index}`
        const value = formData[fieldName]
        
        if (question.type === 'file' && value instanceof File) {
          // Add file to FormData
          submitData.append(`file_${index}`, value)
          // Add file info to responses
          responses[index] = {
            question: question.question,
            answer: value.name,
            type: 'file',
            file_field: `file_${index}`
          }
        } else {
          // Regular form data
          responses[index] = {
            question: question.question,
            answer: value
          }
        }
      })
      
      // Add responses as JSON to FormData
      submitData.append('responses', JSON.stringify(responses))

      const result = await employeeApiService.submitQuestionnaireWithFiles(submitData)

      if (result.success) {
        // Navigate to confirmation page after questionnaire submission
        navigate('/confirmation')
      } else {
        setSubmitError(result.error || 'Failed to submit questionnaire')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
      setSubmitError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question, index) => {
    const fieldName = `question_${index}`

    switch (question.type) {
      case 'text':
        return (
          <div key={index} className="space-y-3 xs:space-y-4">
            <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-3 xs:mb-4">
              {question.question} {question.required && '*'}
            </h3>
            <textarea
              name={fieldName}
              value={formData[fieldName] || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-charcoal/20 rounded-lg xs:rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent transition-all resize-none text-sm xs:text-base"
              placeholder="Type your answer here..."
            />
            {errors[fieldName] && (
              <p className="text-accent text-xs mt-1">{errors[fieldName]}</p>
            )}
          </div>
        )

      case 'single_choice':
        return (
          <div key={index} className="space-y-3 xs:space-y-4">
            <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-3 xs:mb-4">
              {question.question} {question.required && '*'}
            </h3>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 xs:gap-3 cursor-pointer p-2 xs:p-3 rounded-lg xs:rounded-xl hover:bg-gold/5 transition-colors">
                  <input
                    type="radio"
                    name={fieldName}
                    value={option}
                    checked={formData[fieldName] === option}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gold border-charcoal/30 focus:ring-gold"
                  />
                  <span className="text-charcoal font-medium text-sm xs:text-base">{option}</span>
                </label>
              ))}
            </div>
            {errors[fieldName] && (
              <p className="text-accent text-xs mt-1">{errors[fieldName]}</p>
            )}
          </div>
        )

      case 'multiple_choice':
        return (
          <div key={index} className="space-y-3 xs:space-y-4">
            <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-3 xs:mb-4">
              {question.question} {question.required && '*'}
            </h3>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 xs:gap-3 cursor-pointer p-2 xs:p-3 rounded-lg xs:rounded-xl hover:bg-gold/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={(formData[fieldName] || []).includes(option)}
                    onChange={() => handleMultiSelectChange(fieldName, option)}
                    className="w-4 h-4 text-gold border-charcoal/30 rounded focus:ring-gold"
                  />
                  <span className="text-charcoal font-medium text-sm xs:text-base">{option}</span>
                </label>
              ))}
            </div>
            {errors[fieldName] && (
              <p className="text-accent text-xs mt-1">{errors[fieldName]}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={index} className="space-y-3 xs:space-y-4">
            <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-3 xs:mb-4">
              {question.question} {question.required && '*'}
            </h3>
            <div className="space-y-2">
              {['Yes', 'No'].map((option) => (
                <label key={option} className="flex items-center gap-2 xs:gap-3 cursor-pointer p-2 xs:p-3 rounded-lg xs:rounded-xl hover:bg-gold/5 transition-colors">
                  <input
                    type="radio"
                    name={fieldName}
                    value={option.toLowerCase()}
                    checked={formData[fieldName] === option.toLowerCase()}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gold border-charcoal/30 focus:ring-gold"
                  />
                  <span className="text-charcoal font-medium text-sm xs:text-base">{option}</span>
                </label>
              ))}
            </div>
            {errors[fieldName] && (
              <p className="text-accent text-xs mt-1">{errors[fieldName]}</p>
            )}
          </div>
        )

      case 'file':
        return (
          <div key={index} className="space-y-3 xs:space-y-4">
            <h3 className="font-display text-lg xs:text-xl font-semibold text-charcoal mb-3 xs:mb-4">
              {question.question} {question.required && '*'}
            </h3>
            {question.description && (
              <p className="text-charcoal/70 text-sm xs:text-base mb-3">{question.description}</p>
            )}
            <div className="border-2 border-dashed border-charcoal/20 rounded-lg xs:rounded-xl p-4 xs:p-6 hover:border-gold/50 transition-colors">
              <input
                type="file"
                name={fieldName}
                id={fieldName}
                accept={question.accept || '.pdf,.jpg,.jpeg,.png,.doc,.docx'}
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    // Check file size if specified
                    if (question.max_size) {
                      const maxSizeMB = parseInt(question.max_size.replace('MB', ''))
                      const fileSizeMB = file.size / (1024 * 1024)
                      if (fileSizeMB > maxSizeMB) {
                        alert(`File size must be less than ${question.max_size}`)
                        e.target.value = ''
                        return
                      }
                    }
                    setFormData(prev => ({ ...prev, [fieldName]: file }))
                  }
                  if (errors[fieldName]) {
                    setErrors(prev => ({ ...prev, [fieldName]: '' }))
                  }
                }}
                className="hidden"
              />
              <label 
                htmlFor={fieldName} 
                className="cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <Upload className="w-8 h-8 xs:w-12 xs:h-12 text-gold mb-2 xs:mb-4" />
                <div className="text-charcoal font-medium mb-1 xs:mb-2 text-sm xs:text-base">
                  {formData[fieldName] ? formData[fieldName].name : 'Click to upload your document'}
                </div>
                <div className="text-charcoal/60 text-xs xs:text-sm">
                  {question.accept ? `Supported formats: ${question.accept}` : 'PDF, JPG, PNG, DOC files'}
                  {question.max_size && ` (Max: ${question.max_size})`}
                </div>
              </label>
            </div>
            {errors[fieldName] && (
              <p className="text-accent text-xs mt-1">{errors[fieldName]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal">Questionnaire not available</p>
          <button 
            onClick={() => navigate('/employee/qr-scan')}
            className="mt-4 px-4 py-2 bg-gold text-charcoal rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-charcoal py-1 xs:py-4 px-3 xs:px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header with Intro Text */}
        <div className="text-center mb-4 xs:mb-6">
          <h1 className="font-display text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-bold text-cream mb-1 xs:mb-4 px-2 xs:px-0">
            WORKING INTERVIEW SHIFT INFORMATION
          </h1>

          {/*Introductory Text */}
          <div className="bg-cream/50 rounded-xl xs:rounded-2xl p-4 xs:p-6 md:p-8 mb-3 xs:mb-4 text-left max-w-4xl mx-auto">
            <div className="space-y-3 xs:space-y-4 text-charcoal/90 leading-relaxed text-sm xs:text-base">
              <p>
                Thank you for joining the team at <strong>309+311 Properties!</strong> Before officially bringing new team members on board, we conduct a working interview to ensure it's a great fit for both you and us. We want you to experience the company firsthand and decide if it's the right place for you.
              </p>

              <p>
                During your first two to three shifts, which will serve as your working interview, you may be trying out various positions to get a feel for different roles within the team. Each shift will last 3 to 4 hours and be paid at minimum wage. If you're officially brought on after this period, you will transition to the base pay offered to you. From there, as you grow and excel within the company, you will have opportunities for raises and advancement.
              </p>

              <p>
                On your start days, we will guide you through orientation and provide all necessary information. We look forward to working with you!
              </p>
            </div>
          </div>

          {/* Confirmation Line */}
          <div className="text-center mb-6 xs:mb-8">
            <p className="font-bold text-base xs:text-lg px-2 xs:px-0" style={{ color: '#1C1C1C' }}>
              Before getting started, please fill out the following information.
            </p>
          </div>
          
          {/* Progress Indicator - Step 2 of 3 */}
          <div className="flex items-center justify-center gap-2 xs:gap-4">
            <div className="flex items-center gap-1 xs:gap-2">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gold rounded-full flex items-center justify-center text-charcoal font-bold text-xs xs:text-sm shadow-lg">✓</div>
              <span className="text-xs xs:text-sm text-charcoal font-medium hidden xs:inline">QR Scan</span>
              <span className="text-xs text-charcoal font-medium xs:hidden">Scan</span>
            </div>
            <div className="w-8 xs:w-16 h-1 rounded-full bg-gold"></div>
            <div className="flex items-center gap-1 xs:gap-2">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gold rounded-full flex items-center justify-center text-charcoal font-bold text-xs xs:text-sm shadow-lg animate-pulse">2</div>
              <span className="text-xs xs:text-sm text-charcoal font-bold hidden xs:inline">Application Form</span>
              <span className="text-xs text-charcoal font-bold xs:hidden">Form</span>
            </div>
            <div className="w-8 xs:w-16 h-1 bg-charcoal/20 rounded-full"></div>
            <div className="flex items-center gap-1 xs:gap-2">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-charcoal/20 rounded-full flex items-center justify-center text-charcoal font-bold text-xs xs:text-sm">3</div>
              <span className="text-xs xs:text-sm text-charcoal font-medium hidden xs:inline">Confirmation</span>
              <span className="text-xs text-charcoal font-medium xs:hidden">Done</span>
            </div>
          </div>

          {/* Step Label */}
          <div className="text-center mt-3 xs:mt-4">
            <p className="font-semibold text-base xs:text-lg" style={{ color: '#D4AF37' }}>Step 2 of 3</p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl xs:rounded-3xl shadow-2xl overflow-hidden text-charcoal">
          <div className="grid md:grid-cols-2 gap-0">
            
            {/* Left Side - Restaurant Lifestyle Image */}
            <div className="relative bg-restaurant-gradient p-6 xs:p-8 md:p-12 flex flex-col justify-center items-center text-center overflow-hidden">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
                }}
              />

              {/* Content */}
              <div className="relative z-10 mb-6 xs:mb-8">
                <div className="w-24 h-24 xs:w-32 xs:h-32 bg-gold/20 rounded-full flex items-center justify-center mb-4 xs:mb-6 backdrop-blur-sm">
                  <Briefcase className="w-12 h-12 xs:w-16 xs:h-16 text-gold" />
                </div>
                <h3 className="font-display text-xl xs:text-2xl font-bold text-cream mb-3 xs:mb-4">
                  Your Culinary Journey Starts Here
                </h3>
                <p className="text-cream leading-relaxed text-sm xs:text-base" style={{ opacity: 0.9 }}>
                  Join our passionate team of culinary professionals. We're looking for dedicated individuals who share our commitment to exceptional dining experiences.
                </p>
              </div>
              
              <div className="relative z-10 space-y-3 xs:space-y-4 text-cream text-xs xs:text-sm" style={{ opacity: 0.9 }}>
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4AF37' }}></div>
                  <span>Competitive wages & tips</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4AF37' }}></div>
                  <span>Flexible scheduling</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4AF37' }}></div>
                  <span>Career advancement opportunities</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4AF37' }}></div>
                  <span>Employee meal discounts</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-4 xs:p-6 md:p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl xs:text-2xl font-bold text-charcoal mb-2">
                    {questionnaire?.title || 'Onboarding Questionnaire'}
                  </h2>
                  {questionnaire?.description && (
                    <p className="text-charcoal/70 text-sm xs:text-base">
                      {questionnaire.description}
                    </p>
                  )}
                </div>

                {/* Render all questionnaire questions */}
                {questionnaire?.questions?.map((question, index) => renderQuestion(question, index))}

                {/* Error Message */}
                {submitError && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg xs:rounded-xl p-3 xs:p-4 flex items-center gap-2 xs:gap-3">
                    <AlertCircle className="w-4 h-4 xs:w-5 xs:h-5 text-accent flex-shrink-0" />
                    <p className="text-accent text-xs xs:text-sm">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold-gradient text-charcoal font-bold px-6 xs:px-8 py-3 xs:py-4 rounded-xl xs:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] inline-flex items-center justify-center gap-2 xs:gap-3 text-base xs:text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></div>
                      <span className="hidden xs:inline">Submitting Application...</span>
                      <span className="xs:hidden">Submitting...</span>
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingForm
