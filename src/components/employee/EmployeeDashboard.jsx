import { useAuth } from '../../contexts/AuthContext'
import { useEmployee } from '../../App'
import employeeApiService from '../../services/employeeApiService'
import { useState, useEffect, useRef } from 'react'
import HamburgerMenuIcon from '../common/HamburgerMenuIcon'
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Award, 
  TrendingUp,
  CreditCard,
  CalendarDays,
  Bell,
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Edit,
  CheckCircle,
  BookOpen,
  X,
  Save,
  MessageSquare,
  HelpCircle,
  QrCode,
  PlayCircle,
  LogOut,
  Settings,
  ChevronDown,
  Hash,
  Gift,
  Target,
  Star,
  Activity,
  BarChart3,
  Ticket,
  Trophy,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import PersonalInfoModal from './PersonalInfoModal'
import PersonalInfoSection from './PersonalInfoSection'
import OnboardingSection from './OnboardingSection'
import TrainingSection from './TrainingSection'
import CommunicationSection from './CommunicationSection'
import FAQSection from './FAQSection'
import OnboardingReminder from './OnboardingReminder'
import EmployeeNotificationCenter from './EmployeeNotificationCenter'
import ErrorBoundary from '../ErrorBoundary'
import TimeOffRequestSection from './TimeOffRequestSection'
import PayslipSection from './PayslipSection'
import OrderTrackingSection from './OrderTrackingSection'
import PerformanceSection from './PerformanceSection'
import TicketSection from './TicketSection'
import EmployeeRecognitionDashboard from './EmployeeRecognitionDashboard'
import RoleAssignmentSection from './RoleAssignmentSection'
import EmployeeClockStatusBanner from './EmployeeClockStatusBanner'
import ClockInOutSystem from './ClockInOutSystem'
import Logo from '../Logo'
import { 
  calculateTenure, 
  formatTenure, 
  getCompletedMilestones, 
  hasUpcomingAnniversary, 
  getEmployeeTrainingStats,
  getOverdueTraining 
} from '../../utils/employeeUtils'
import employeeDashboardApiService from '../../services/employeeDashboardApiService'
import '../../styles/responsive.css'

const EmployeeDashboard = () => {
  const { user, logout } = useAuth()
  const { employee } = useEmployee()
  const [employeeData, setEmployeeData] = useState(null)
  const [onboardingProgress, setOnboardingProgress] = useState(null)
  const [onboardingPages, setOnboardingPages] = useState([])
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(72)
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const dropdownRef = useRef(null)
  const sidebarRef = useRef(null)
  const headerRef = useRef(null)
  const refreshIntervalRef = useRef(null)
  // Ensure we only set the initial sidebar state once, regardless of resize events
  const sidebarInitializedRef = useRef(false)

  // Initialize sidebar state once and track viewport/header sizing on resize
  useEffect(() => {
    const handleResize = () => {
      // Only set initial sidebar state once: closed by default on all screen sizes
      if (!sidebarInitializedRef.current) {
        setSidebarOpen(false)
        sidebarInitializedRef.current = true
      }
      // Update header height
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      // Track viewport width
      setViewportWidth(window.innerWidth)
    }

    // Set initial state and measures
    handleResize()

    // Listen for resize events (do not auto-open/close on resize)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update header height when content changes
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    
    updateHeaderHeight()
    
    // Use ResizeObserver for more precise height tracking
    if (headerRef.current && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(updateHeaderHeight)
      resizeObserver.observe(headerRef.current)
      
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [sidebarOpen, activeSection, showProfileDropdown])

  // Handle sidebar navigation and auto-close on mobile
  const handleSidebarNavigation = (section) => {
    setActiveSection(section)
    // Close sidebar when a navigation item is selected (unified behavior)
    setSidebarOpen(false)
    
    // Refresh onboarding data when navigating to onboarding section
    if (section === 'onboarding') {
      refreshOnboardingData()
    }
  }

  // Load employee data from API
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (user) {
        try {
          // Load employee profile data
          const profileResponse = await employeeApiService.getEmployeeProfile()
          if (profileResponse.success) {
            console.log('Employee profile loaded:', profileResponse.data)
            setEmployeeData(profileResponse.data)
            
            // Load onboarding pages and progress data separately
            try {
              const pagesResponse = await employeeApiService.getOnboardingPages()
              
              if (pagesResponse && pagesResponse.success && pagesResponse.data) {
                const pages = pagesResponse.data.pages || []
                const progress = pagesResponse.data.progress || {}
                const summary = pagesResponse.data.summary || {}
                const personalInfoComplete = pagesResponse.data.personal_info_complete
                
                setOnboardingPages(pages)
                setOnboardingProgress(progress)
                
                // Update employee data with enhanced API response data
                if (profileResponse.success) {
                  setEmployeeData(prev => ({
                    ...prev,
                    onboarding_pages_progress: summary,
                    is_personal_info_complete: personalInfoComplete
                  }))
                }
              } else {
                console.error('API Error - Full response:', pagesResponse)
                console.error('API Error - Error message:', pagesResponse?.error || pagesResponse?.message || 'Unknown error')
                setOnboardingPages([])
                setOnboardingProgress({})
              }
            } catch (pagesError) {
              console.error('Critical API Error:', pagesError)
              console.error('Error details:', pagesError.message)
              setOnboardingPages([])
              setOnboardingProgress({})
            }
          } else {
            console.error('Failed to load employee profile:', profileResponse.error)
          }
        } catch (error) {
          console.error('Error loading employee profile:', error)
        }
      }
      setLoading(false)
    }
    
    loadEmployeeData()
  }, [user])
  
  // Set up periodic refresh for onboarding data to detect new documents
  useEffect(() => {
    if (user && employeeData) {
      // Refresh onboarding data every 60 seconds to detect new documents
      refreshIntervalRef.current = setInterval(() => {
        refreshOnboardingData()
      }, 60000) // 1 minute
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [user, employeeData])

  // Function to refresh onboarding progress and pages data
  const refreshOnboardingData = async () => {
    if (user) {
      try {
        const pagesResponse = await employeeApiService.getOnboardingPages()
        if (pagesResponse && pagesResponse.success && pagesResponse.data) {
          const pages = pagesResponse.data.pages || []
          const progress = pagesResponse.data.progress || {}
          const summary = pagesResponse.data.summary || {}
          const personalInfoComplete = pagesResponse.data.personal_info_complete
          
          setOnboardingPages(pages)
          setOnboardingProgress(progress)
          
          // Update employee data with fresh API response data
          setEmployeeData(prev => ({
            ...prev,
            onboarding_pages_progress: summary,
            is_personal_info_complete: personalInfoComplete
          }))
        }
      } catch (error) {
        console.log('Error refreshing onboarding data:', error)
      }
    }
  }

  // No longer needed - QR codes now point to dedicated clock page

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        const hamburgerButton = document.querySelector('[aria-label="Open menu"], [aria-label="Close menu"]')
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setSidebarOpen(false)
        }
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
  }

  // Check if personal info is complete
  const isPersonalInfoComplete = () => {
    // Check API data structure: employeeData.personal_info contains the actual data
    const personalInfo = employeeData?.personal_info || employeeData?.employee?.personal_info || employeeData?.employee?.profile_data?.personal_info
    if (!personalInfo) return false
    const { mailing_address, requested_hours } = personalInfo
    return mailing_address && requested_hours
  }

  // Check onboarding completion status
  const getOnboardingProgress = () => {
    if (!onboardingProgress) return { completed: 0, total: onboardingPages.length }
    const completed = Object.values(onboardingProgress).filter(status => status === 'completed').length
    return { completed, total: onboardingPages.length }
  }

  // Onboarding pages are now loaded from API and stored in state

  // We will load dashboard data via API instead of hardcoding it

  // Determine if employee has access to schedule/clock features
  const hasActiveAccess = (() => {
    const status = (employeeData?.status || employeeData?.employee?.status || '').toLowerCase()
    const stage = (employeeData?.stage || employeeData?.employee?.stage || '').toLowerCase()
    const canAccess = !!(employeeData?.can_access_dashboard || employeeData?.employee?.can_access_dashboard)
    return canAccess || status === 'approved' || stage === 'active'
  })()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Overlay - only show on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 block md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`w-64 bg-brand-navy text-cream shadow-2xl border-r border-gold border-opacity-20 flex flex-col h-full z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed`}
        style={{ width: '256px', maxWidth: '256px', minWidth: '256px', left: 0, top: 0, bottom: 0 }}
      >
        {/* Logo and Company Name */}
        <div className="p-6 border-b border-gold border-opacity-20">
          <div className="flex items-center gap-3">
            <div>
              <Logo size="sm" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gold">
                Woodfire.food
              </h1>
              <p className="text-cream text-opacity-80 text-sm font-medium tracking-wide">
                Employee Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-2">
            <button
              onClick={() => handleSidebarNavigation('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'dashboard'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('personal-info')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'personal-info'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Personal Info</span>
              {!isPersonalInfoComplete() && (
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              )}
            </button>

            <button
              onClick={() => handleSidebarNavigation('onboarding')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'onboarding'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Onboarding</span>
              {getOnboardingProgress().completed < getOnboardingProgress().total && (
                <div className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getOnboardingProgress().total - getOnboardingProgress().completed}
                </div>
              )}
            </button>

            <button
              onClick={() => handleSidebarNavigation('training')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'training'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              <span className="font-medium">Training</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('communication')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'communication'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Communication</span>
            </button>

            {/* Show Roles section only for employees with access */}
            {hasActiveAccess && (
              <button
                onClick={() => handleSidebarNavigation('roles')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeSection === 'roles'
                    ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                    : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Roles</span>
                {(
                  !employeeData?.assignments || employeeData?.assignments?.departments?.length === 0
                ) && (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}

            {/* Clock In/Out System - Only for employees with access */}
            {hasActiveAccess && (
              <button
                onClick={() => handleSidebarNavigation('clock')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeSection === 'clock'
                    ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                    : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Time Clock</span>
              </button>
            )}


            <button
              onClick={() => handleSidebarNavigation('order-tracking')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'order-tracking'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <Hash className="w-5 h-5" />
              <span className="font-medium">Order Tracking</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('time-off')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'time-off'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium">Time Off</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('payslips')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'payslips'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Payslips</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('performance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'performance'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Performance</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('recognition')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'recognition'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Recognition</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('tickets')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'tickets'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <Ticket className="w-5 h-5" />
              <span className="font-medium">Tickets</span>
            </button>

            <button
              onClick={() => handleSidebarNavigation('faq')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeSection === 'faq'
                  ? 'bg-gold bg-opacity-20 text-gold border border-gold border-opacity-30'
                  : 'text-cream text-opacity-80 hover:bg-cream hover:bg-opacity-10 hover:text-cream'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">FAQ</span>
            </button>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gold border-opacity-20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-cream text-opacity-80 hover:bg-red-600 hover:bg-opacity-20 hover:text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Onboarding Reminder Modal */}
      <OnboardingReminder 
        employeeData={employeeData}
        onboardingProgress={onboardingProgress}
        onboardingPages={onboardingPages}
        onNavigateToOnboarding={() => setActiveSection('onboarding')}
        onNavigateToPersonalInfo={() => setActiveSection('personal-info')}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div ref={headerRef} className="bg-brand-navy text-cream shadow-lg border-b border-gold border-opacity-20 fixed top-0 right-0 z-20" style={{ left: viewportWidth >= 768 ? (sidebarOpen ? 256 : 0) : 0 }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              
              {/* Left side - Mobile Menu Button and Title */}
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Mobile Hamburger Menu (≤540px) */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-cream hover:bg-gold hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-30 block sm:hidden"
                  aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                {/* Mobile-only compact page title (≤540px) */}
                <div className="block sm:hidden flex-1 min-w-0 hide-1024-down">
                  <h1 className="text-lg font-bold text-gold truncate">
                    {activeSection === 'dashboard' && 'Dashboard'}
                    {activeSection === 'personal-info' && 'Profile'}
                    {activeSection === 'onboarding' && 'Onboarding'}
                    {activeSection === 'training' && 'Training'}
                    {activeSection === 'communication' && 'Chat'}
                    {activeSection === 'roles' && 'Roles'}
                    {activeSection === 'order-tracking' && 'Orders'}
                    {activeSection === 'performance' && 'Performance'}
                    {activeSection === 'recognition' && 'Recognition'}
                    {activeSection === 'tickets' && 'Support'}
                    {activeSection === 'faq' && 'FAQ'}
                    {activeSection === 'time-off' && 'Time Off'}
                    {activeSection === 'payslips' && 'Payslips'}
                  </h1>
                </div>
                
                {/* Tablet/Desktop Toggle Button (541px+) */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-cream hover:bg-gold hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-30 hidden sm:block md:block"
                  aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                
                {/* Page Title */}
                <div className="flex-1 min-w-0">
                  <h1 className="hide-mobile-540 hide-1024-down text-xl md:text-2xl font-bold text-gold">
                  {activeSection === 'dashboard' && 'Dashboard'}
                  {activeSection === 'personal-info' && 'Personal Information'}
                  {activeSection === 'onboarding' && 'Onboarding'}
                  {activeSection === 'training' && 'Training Center'}
                  {activeSection === 'communication' && 'Communication'}
                  {activeSection === 'roles' && 'Role Management'}
                  {activeSection === 'order-tracking' && 'Order Tracking'}
                  {activeSection === 'performance' && 'Performance Reports'}
                  {activeSection === 'recognition' && 'My Recognition'}
                  {activeSection === 'tickets' && 'Support Tickets'}
                  {activeSection === 'faq' && 'FAQ'}
                  {activeSection === 'time-off' && 'Time Off Requests'}
                  {activeSection === 'payslips' && 'Payslips & Earnings'}
                  </h1>
                  <p className="hide-mobile-540 hide-1024-down text-sm md:text-base text-cream text-opacity-70">
                    {activeSection === 'dashboard' && 'Welcome to your employee portal'}
                    {activeSection === 'personal-info' && 'Manage your personal information'}
                    {activeSection === 'onboarding' && 'Complete your onboarding requirements'}
                    {activeSection === 'training' && 'Access your training materials'}
                    {activeSection === 'communication' && 'Connect with your team'}
                    {activeSection === 'roles' && 'View your role assignments and department information'}
                    {activeSection === 'order-tracking' && 'Monitor and deliver customer orders'}
                    {activeSection === 'performance' && 'View your performance evaluations and feedback'}
                    {activeSection === 'recognition' && 'View your achievements, shout-outs, rewards, and badges'}
                    {activeSection === 'tickets' && 'Submit and track your support requests'}
                    {activeSection === 'faq' && 'Find answers to common questions'}
                    {activeSection === 'time-off' && 'Submit and track your vacation requests'}
                    {activeSection === 'payslips' && 'View and download your pay stubs'}
                  </p>
                </div>
              </div>
              
              {/* Right side - Notifications and Profile */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <ErrorBoundary>
                    <EmployeeNotificationCenter employeeId={user?.id} />
                  </ErrorBoundary>
                </div>
                
                {/* Profile Avatar with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-cream hover:bg-gold hover:bg-opacity-20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-30"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gold bg-opacity-20 rounded-full flex items-center justify-center border-2 border-gold border-opacity-30">
                      <span className="text-sm font-bold text-gold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                      </span>
                    </div>
                    
                    {/* Name and Role - Hidden on very small screens */}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-cream whitespace-nowrap">{user?.name || 'Employee'}</p>
                      <p className="text-xs text-cream text-opacity-60 whitespace-nowrap">{employee?.designation || 'Team Member'}</p>
                    </div>
                    
                    {/* Dropdown Arrow */}
                    <ChevronDown className={`w-4 h-4 text-cream text-opacity-70 transition-transform duration-200 ${
                      showProfileDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-fadeIn">
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleSidebarNavigation('personal-info')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gold hover:bg-opacity-10 hover:text-charcoal transition-colors duration-150"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleSidebarNavigation('onboarding')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gold hover:bg-opacity-10 hover:text-charcoal transition-colors duration-150"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Onboarding</span>
                        {getOnboardingProgress().completed < getOnboardingProgress().total && (
                          <div className="ml-auto bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {getOnboardingProgress().total - getOnboardingProgress().completed}
                          </div>
                        )}
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 p-4 sm:p-6 overflow-y-auto relative"
          style={{
            paddingTop: `${headerHeight + 16}px`,
            // Only push content when the sidebar is open on desktop; otherwise keep default padding
            ...(viewportWidth >= 768 && sidebarOpen ? { paddingLeft: 256 } : {}),
            contain: 'layout style'
          }}
        >

          {activeSection === 'dashboard' && (
            <DashboardHome 
              employeeData={employeeData}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'personal-info' && (
            <PersonalInfoSection 
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
            />
          )}
          {activeSection === 'onboarding' && (
            <OnboardingSection 
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
              onboardingPages={onboardingPages}
              onboardingProgress={onboardingProgress}
              refreshOnboardingData={refreshOnboardingData}
            />
          )}
          {activeSection === 'training' && (
            <TrainingSection 
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
            />
          )}
          {activeSection === 'communication' && (
            <CommunicationSection 
              user={user}
              employeeData={employeeData}
            />
          )}
          {activeSection === 'roles' && (
            <RoleAssignmentSection employeeData={employeeData} />
          )}
          {activeSection === 'clock' && (
            <ClockInOutSystem 
              employeeData={employeeData}
          onStatusChange={async () => {
                // Refresh employee data when clock status changes from API
                try {
                  const profileResponse = await employeeApiService.getEmployeeProfile()
                  if (profileResponse.success) {
                    setEmployeeData(profileResponse.data)
                  }
                } catch (error) {
                  console.error('Error refreshing employee data:', error)
                }
              }}
            />
          )}
          {activeSection === 'order-tracking' && (
            <OrderTrackingSection 
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
            />
          )}
          {activeSection === 'time-off' && (
            <TimeOffRequestSection 
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
            />
          )}
          {activeSection === 'payslips' && (
            <PayslipSection 
              employeeData={employeeData}
            />
          )}
          {activeSection === 'performance' && (
            <PerformanceSection 
              employeeData={employeeData}
            />
          )}
          {activeSection === 'recognition' && (
            <EmployeeRecognitionDashboard />
          )}
          {activeSection === 'tickets' && (
            <TicketSection 
              employeeData={employeeData}
            />
          )}
          {activeSection === 'faq' && (
            <FAQSection />
          )}

        </div>
      </div>
    </div>
  )
}

// Dashboard Home Component
const DashboardHome = ({ employeeData, setActiveSection }) => {
  const [trainingStats, setTrainingStats] = useState(null)
  const [anniversaryInfo, setAnniversaryInfo] = useState(null)
  const [overdueAlerts, setOverdueAlerts] = useState([])
  const [upcomingShifts, setUpcomingShifts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [workStats, setWorkStats] = useState({
    hours_this_week: 0,
    shifts_completed_this_month: 0,
    hours_change_from_last_week: 0
  })
  const [performanceStats, setPerformanceStats] = useState({
    rating: 0,
    rating_text: 'No data available',
    last_review_date: null
  })
  const [loading, setLoading] = useState({
    shifts: true,
    announcements: true,
    workStats: true,
    performance: true,
    training: true,
    anniversary: true
  })

  // Determine if clock features should be shown
  const canUseClock = () => {
    const status = (employeeData?.status || '').toLowerCase()
    const stage = (employeeData?.stage || '').toLowerCase()
    const canAccess = !!employeeData?.can_access_dashboard
    return canAccess || status === 'approved' || stage === 'active'
  }

  // Clock action handler
  const handleClockAction = () => {
    setActiveSection('clock')
  }

  // Load training stats function (extracted for reuse)
  const loadTrainingStats = async () => {
    try {
      const response = await employeeDashboardApiService.getTrainingStats()
      if (response.success) {
        setTrainingStats(response.data)
      } else {
        // Fallback to utility function if API fails
        const stats = getEmployeeTrainingStats(employeeData)
        setTrainingStats(stats)
      }
    } catch (error) {
      console.error('Error loading training stats:', error)
      // Fallback to utility function
      const stats = getEmployeeTrainingStats(employeeData)
      setTrainingStats(stats)
    } finally {
      setLoading(prev => ({ ...prev, training: false }))
    }
  }

  // Expose refresh function globally for TrainingSection to use
  useEffect(() => {
    window.refreshDashboardStats = () => {
      console.log('Refreshing dashboard stats...')
      if (employeeData) {
        loadTrainingStats()
      }
    }
    
    return () => {
      // Cleanup global function when component unmounts
      delete window.refreshDashboardStats
    }
  }, [employeeData])

  // Load dashboard data from API
  useEffect(() => {
    if (employeeData) {
      // Load work stats (hours, shifts)
      const loadWorkStats = async () => {
        try {
          const response = await employeeDashboardApiService.getWorkStats()
          if (response.success) {
            setWorkStats(response.data)
          }
        } catch (error) {
          console.error('Error loading work stats:', error)
        } finally {
          setLoading(prev => ({ ...prev, workStats: false }))
        }
      }
      
      // Load performance stats
      const loadPerformanceStats = async () => {
        try {
          const response = await employeeDashboardApiService.getPerformanceStats()
          if (response.success) {
            setPerformanceStats(response.data)
          }
        } catch (error) {
          console.error('Error loading performance stats:', error)
        } finally {
          setLoading(prev => ({ ...prev, performance: false }))
        }
      }
      
      // Load upcoming shifts
      const loadUpcomingShifts = async () => {
        try {
          const response = await employeeDashboardApiService.getUpcomingShifts()
          if (response.success) {
            setUpcomingShifts(response.data)
          }
        } catch (error) {
          console.error('Error loading upcoming shifts:', error)
        } finally {
          setLoading(prev => ({ ...prev, shifts: false }))
        }
      }
      
      // Load announcements
      const loadAnnouncements = async () => {
        try {
          const response = await employeeDashboardApiService.getAnnouncements()
          if (response.success) {
            setAnnouncements(response.data)
          }
        } catch (error) {
          console.error('Error loading announcements:', error)
        } finally {
          setLoading(prev => ({ ...prev, announcements: false }))
        }
      }
      
      // Load anniversary information
      const loadAnniversaryInfo = async () => {
        try {
          // Try from API first
          const response = await employeeDashboardApiService.getAnniversaryInfo()
          if (response.success && response.data) {
            setAnniversaryInfo(response.data)
          } else {
            // Fallback to utility functions
            if (employeeData.hireDate) {
              const tenureDays = calculateTenure(employeeData.hireDate)
              const formattedTenure = formatTenure(tenureDays)
              const milestones = getCompletedMilestones(employeeData.hireDate)
              const upcomingAnniversary = hasUpcomingAnniversary(employeeData.hireDate)
              
              setAnniversaryInfo({
                tenure: formattedTenure,
                tenureDays,
                milestones,
                upcomingAnniversary,
                hireDate: employeeData.hireDate
              })
            }
          }
        } catch (error) {
          console.error('Error loading anniversary info:', error)
          // Fallback to utility functions
          if (employeeData.hireDate) {
            const tenureDays = calculateTenure(employeeData.hireDate)
            const formattedTenure = formatTenure(tenureDays)
            const milestones = getCompletedMilestones(employeeData.hireDate)
            const upcomingAnniversary = hasUpcomingAnniversary(employeeData.hireDate)
            
            setAnniversaryInfo({
              tenure: formattedTenure,
              tenureDays,
              milestones,
              upcomingAnniversary,
              hireDate: employeeData.hireDate
            })
          }
        } finally {
          setLoading(prev => ({ ...prev, anniversary: false }))
        }
      }
      
      // Load overdue training
      const loadOverdueTraining = async () => {
        try {
          // Try from API first
          const response = await employeeDashboardApiService.getOverdueTraining()
          if (response.success) {
            setOverdueAlerts(response.data)
          } else {
            // Fallback to utility function
            const overdue = getOverdueTraining(employeeData)
            setOverdueAlerts(overdue)
          }
        } catch (error) {
          console.error('Error loading overdue training:', error)
          // Fallback to utility function
          const overdue = getOverdueTraining(employeeData)
          setOverdueAlerts(overdue)
        }
      }
      
      // Load all data in parallel
      loadWorkStats()
      loadTrainingStats() // Now using the extracted function
      loadPerformanceStats()
      loadUpcomingShifts()
      loadAnnouncements()
      loadAnniversaryInfo()
      loadOverdueTraining()
    }
  }, [employeeData])

  return (
    <div>
      {/* Clock Status Banner - Only for employees with access */}
      {canUseClock() && (
        <EmployeeClockStatusBanner 
          employeeData={employeeData}
          onClockAction={handleClockAction}
        />
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-charcoal mb-2">
          Welcome Back, {employeeData?.personal_info?.first_name || employeeData?.employee?.personal_info?.first_name || 'Team Member'}!
        </h1>
        <div className="flex flex-row gap-4 items-start">
          <p className="text-lg text-charcoal text-opacity-70 font-body flex-1">
            Here's your personalized dashboard with training progress, anniversaries, and important updates.
          </p>
          {anniversaryInfo?.upcomingAnniversary && (
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <Gift className="w-5 h-5 text-gold hide-md-down" />
              <div>
                <p className="text-sm font-semibold text-charcoal">Anniversary Coming Soon!</p>
                <p className="text-xs text-gold">{anniversaryInfo.tenure} of service</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Training & Anniversary Alerts */}
      {(overdueAlerts.length > 0 || anniversaryInfo?.upcomingAnniversary) && (
        <div className="mb-8">
          <div className="grid-2-responsive">
            {/* Overdue Training Alerts */}
            {overdueAlerts.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 hide-md-down" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Training Overdue</h4>
                    <div className="space-y-1">
                      {overdueAlerts.slice(0, 2).map((training, idx) => (
                        <p key={idx} className="text-sm text-red-700">
                          • {training.title} (Due: {new Date(training.dueDate).toLocaleDateString()})
                        </p>
                      ))}
                      {overdueAlerts.length > 2 && (
                        <p className="text-sm text-red-600 font-medium">+{overdueAlerts.length - 2} more overdue</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveSection('training')}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      Complete Training →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Anniversary Milestone */}
            {anniversaryInfo && (
              <div className="bg-gradient-to-r from-gold/10 to-amber-50 border border-gold/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-gold mt-0.5 hide-md-down" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Service Milestone</h4>
                    <p className="text-sm text-amber-700 mb-1">
                      <strong>{anniversaryInfo.tenure}</strong> of dedicated service
                    </p>
                    {anniversaryInfo.milestones.length > 0 && (
                      <p className="text-xs text-amber-600">
                        Achievements: {anniversaryInfo.milestones.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid-stats mb-8">
        {[
          { 
            key: 'hours', 
            title: 'HOURS THIS WEEK', 
            value: loading.workStats ? '...' : workStats.hours_this_week?.toString() || '0', 
            change: loading.workStats ? 'Loading...' : 
                    workStats.hours_change_from_last_week > 0 ? `+${workStats.hours_change_from_last_week} from last week` :
                    workStats.hours_change_from_last_week < 0 ? `${workStats.hours_change_from_last_week} from last week` :
                    'Same as last week', 
            changeType: loading.workStats ? 'neutral' : 
                       workStats.hours_change_from_last_week > 0 ? 'positive' : 
                       workStats.hours_change_from_last_week < 0 ? 'negative' : 'neutral', 
            icon: Clock, 
            bgClass: 'bg-amber-50', 
            iconClass: 'text-amber-600', 
            iconBgClass: 'bg-gradient-to-br from-amber-400 to-gold' 
          },
          { 
            key: 'shifts', 
            title: 'SHIFTS COMPLETED', 
            value: loading.workStats ? '...' : workStats.shifts_completed_this_month?.toString() || '0', 
            change: loading.workStats ? 'Loading...' : 'This month', 
            changeType: 'neutral', 
            icon: Calendar, 
            bgClass: 'bg-green-50', 
            iconClass: 'text-green-600', 
            iconBgClass: 'bg-gradient-to-br from-emerald-400 to-green-600' 
          },
          { 
            key: 'training', 
            title: 'TRAINING PROGRESS', 
            value: loading.training ? '...' : 
                  trainingStats ? `${Math.round(trainingStats.completion_percentage || 0)}%` : '0%', 
            change: loading.training ? 'Loading...' : 
                    trainingStats?.completion_percentage >= 90 ? 'Almost complete' : 
                    trainingStats?.completion_percentage >= 60 ? 'Good progress' : 'Getting started',
            changeType: loading.training ? 'neutral' : 
                        trainingStats?.completion_percentage >= 60 ? 'positive' : 'neutral', 
            icon: TrendingUp, 
            bgClass: 'bg-blue-50', 
            iconClass: 'text-blue-600', 
            iconBgClass: 'bg-gradient-to-br from-blue-400 to-blue-600',
            showProgressBar: true,
            progressValue: loading.training ? 0 : (trainingStats?.completion_percentage || 0)
          },
          { 
            key: 'performance', 
            title: 'PERFORMANCE', 
            value: loading.performance ? '...' : `${performanceStats.rating} / 5`,
            change: loading.performance ? 'Loading...' : performanceStats.rating_text, 
            changeType: loading.performance ? 'neutral' : 
                       performanceStats.rating >= 4 ? 'positive' : 
                       performanceStats.rating >= 3 ? 'neutral' : 'negative', 
            icon: Award, 
            bgClass: 'bg-purple-50', 
            iconClass: 'text-purple-600', 
            iconBgClass: 'bg-gradient-to-br from-purple-400 to-purple-600' 
          }
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.key} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 border border-gray-100 hover:border-gold-200">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgClass} hide-md-down`}>
                  <Icon className={`w-4 h-4 ${stat.iconClass}`} />
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${stat.bgClass} ${stat.iconClass} border hide-md-down`}>
                  {stat.title.split(' ')[0]}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-charcoal text-opacity-70 uppercase tracking-wider mb-1">{stat.title}</p>
                <p className="text-xl font-bold font-display text-charcoal mb-1">{stat.value}</p>
                {stat.showProgressBar && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300" style={{width: `${stat.progressValue || 0}%`}}></div>
                  </div>
                )}
                <p className={`text-xs font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' :
                  'text-charcoal text-opacity-60'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          )
        })}
      </div>

        {/* Main Dashboard Grid */}
        <div className="grid-main gap-8">
          {/* Upcoming Shifts */}
          <div className="col-span-2">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gold-light to-gold bg-opacity-15 px-4 py-3 border-b border-gold border-opacity-40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                    <div className="p-1.5 bg-gold bg-opacity-30 rounded-lg hide-md-down">
                      <Calendar className="w-4 h-4 text-gold-dark" />
                    </div>
                    Upcoming Shifts
                  </h3>
                  <button className="text-gold-dark hover:text-gold text-xs font-semibold px-3 py-1.5 bg-white bg-opacity-80 rounded-lg hover:bg-opacity-100 transition-colors border border-gold border-opacity-30">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {loading.shifts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-2"></div>
                    <p className="text-sm text-charcoal text-opacity-70">Loading shifts...</p>
                  </div>
                ) : upcomingShifts.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-charcoal/60 text-sm">No upcoming shifts scheduled</p>
                  </div>
                ) : (
                  upcomingShifts.map((shift, index) => (
                    <div key={index} className="group relative bg-gradient-to-r from-white to-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-gold-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md group-hover:scale-105 transition-transform">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-charcoal text-sm">
                              {shift.date ? new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                            </p>
                            <p className="text-xs text-gray-600 font-medium">
                              {shift.time || shift.start_time && shift.end_time ? `${shift.start_time} - ${shift.end_time}` : 'Time TBD'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                (shift.status || 'pending') === 'confirmed' ? 'bg-green-500' : 
                                (shift.status || 'pending') === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}></div>
                              <span className={`text-xs font-semibold ${
                                (shift.status || 'pending') === 'confirmed' ? 'text-green-600' : 
                                (shift.status || 'pending') === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {(shift.status || 'pending').charAt(0).toUpperCase() + (shift.status || 'pending').slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-charcoal text-sm">{shift.location || shift.department || 'Restaurant'}</p>
                          <p className="text-xs text-gray-500 font-medium">Location</p>
                          <div className="mt-1 px-2 py-0.5 bg-gold-50 text-gold rounded-full text-xs font-semibold">
                            {shift.duration || shift.hours || '8'} hours
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100">
                <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  Announcements
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {loading.announcements ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300 mx-auto mb-2"></div>
                    <p className="text-sm text-charcoal text-opacity-70">Loading announcements...</p>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-charcoal/60 text-sm">No recent announcements</p>
                  </div>
                ) : (
                  announcements.map((announcement, index) => {
                    // Map API data structure to expected format
                    const mappedAnnouncement = {
                      title: announcement.title || announcement.subject || 'Announcement',
                      type: announcement.type || announcement.category || 'General',
                      date: announcement.date || announcement.published_at || announcement.created_at,
                      priority: announcement.priority || 'medium',
                      icon: announcement.icon || (
                        (announcement.type || announcement.category) === 'Training' ? '📚' :
                        (announcement.type || announcement.category) === 'Meeting' ? '👥' :
                        (announcement.type || announcement.category) === 'Schedule' ? '📅' :
                        '📢'
                      )
                    }
                    
                    return (
                    <div key={index} className="group relative bg-gradient-to-r from-white to-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="text-lg">{mappedAnnouncement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-charcoal text-sm group-hover:text-blue-700 transition-colors">{mappedAnnouncement.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              mappedAnnouncement.type === 'Training' ? 'bg-green-100 text-green-700' :
                              mappedAnnouncement.type === 'Meeting' ? 'bg-blue-100 text-blue-700' :
                              mappedAnnouncement.type === 'Schedule' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {mappedAnnouncement.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            {mappedAnnouncement.date ? new Date(mappedAnnouncement.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'No date'}
                          </p>
                          <div className={`inline-block mt-1 w-1.5 h-1.5 rounded-full ${
                            mappedAnnouncement.priority === 'high' ? 'bg-red-500' :
                            mappedAnnouncement.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-purple-100">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="grid-quick-actions">
                <button 
                  onClick={() => setActiveSection('personal-info')}
                  className="group relative bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform hide-md-down">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-charcoal text-lg group-hover:text-blue-700 transition-colors">Update Profile</p>
                        <p className="text-sm text-gray-600 font-medium">Manage your information</p>
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600 text-sm font-semibold">
                      <span>Go to Profile</span>
                      <div className="ml-2 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSection('time-off')}
                  className="group relative bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 border border-green-100 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-green-300 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform hide-md-down">
                        <CalendarDays className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-charcoal text-lg group-hover:text-green-700 transition-colors">Request Time Off</p>
                        <p className="text-sm text-gray-600 font-medium">Submit vacation requests</p>
                      </div>
                    </div>
                    <div className="flex items-center text-green-600 text-sm font-semibold">
                      <span>Make Request</span>
                      <div className="ml-2 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveSection('payslips')}
                  className="group relative bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 border border-amber-100 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 bg-gradient-to-br from-amber-400 to-gold rounded-2xl shadow-lg group-hover:scale-110 transition-transform hide-md-down">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-charcoal text-lg group-hover:text-amber-700 transition-colors">View Payslips</p>
                        <p className="text-sm text-gray-600 font-medium">Access pay information</p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-600 text-sm font-semibold">
                      <span>View Earnings</span>
                      <div className="ml-2 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-brand-navy to-slate-800 text-cream rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gold-100 to-amber-200 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -ml-16 -mb-16"></div>
            <div className="relative">
              <h3 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3">
                <div className="p-3 bg-gold-100 rounded-xl hide-md-down">
                  <HelpCircle className="w-6 h-6 text-gold" />
                </div>
                Need Help?
              </h3>
              <div className="grid-quick-actions">
                <div className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 hover:bg-opacity-20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg hide-md-down">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cream">HR Department</p>
                      <p className="text-xs text-gold font-medium">(918) 555-0123</p>
                    </div>
                  </div>
                </div>
                <div className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 hover:bg-opacity-20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg hide-md-down">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cream">Email Support</p>
                      <p className="text-xs text-gold font-medium break-all">hr@309311restaurants.com</p>
                    </div>
                  </div>
                </div>
                <div className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 hover:bg-opacity-20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg hide-md-down">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cream">Your Location</p>
                      <p className="text-xs text-gold font-medium">Bartlesville</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


export default EmployeeDashboard
