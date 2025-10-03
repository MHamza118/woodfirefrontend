import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Users, MapPin, Settings, Plus, Edit, Trash2, QrCode, LogOut, UserCheck, Bell, ChevronDown, ChevronLeft, ChevronRight, BookOpen, PlayCircle, HelpCircle, MessageSquare, Clock, UserPlus, Table, AlertTriangle, TrendingUp, Calendar, Gift, CheckCircle, Target, Activity, BarChart3, Ticket, Trophy } from 'lucide-react'
import HamburgerMenuIcon from '../common/HamburgerMenuIcon'
import UserModal from './UserModal'
import LocationManagement from './LocationManagement'
import EmployeeManagement from './EmployeeManagement'
import DepartmentManagement from './DepartmentManagement'
import RoleAssignment from './RoleAssignment'
import NotificationCenter from './NotificationCenter'
import ErrorBoundary from '../ErrorBoundary'
import OnboardingContentManagement from './OnboardingContentManagement'
import TrainingModuleManagement from './TrainingModuleManagement'
import FAQManagement from './FAQManagement'
import AdminChatInterface from './AdminChatInterface'
import CustomerManagement from './CustomerManagement'
import TableTrackingManagement from './TableTrackingManagement'
import PerformanceManagement from './PerformanceManagement'
import TicketManagement from './TicketManagement'
import EmployeeRecognition from './EmployeeRecognition'
import TimeTrackingManagement from './TimeTrackingManagement'
import TimeOffManagement from './TimeOffManagement'
import SettingsModal from './SettingsModal'
import Logo from '../Logo'
import { getDashboardConfig, hasPermission } from '../../utils/permissions'
import adminApiService from '../../services/adminApiService'
import { 
  calculateTenure, 
  formatTenure, 
  getCompletedMilestones, 
  hasUpcomingAnniversary, 
  getOverdueTraining, 
  getEmployeeTrainingStats 
} from '../../utils/employeeUtils'
import '../../styles/responsive.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const dropdownRef = useRef(null)
  const sidebarRef = useRef(null)
  
  // Get user type - use the actual role from the user object directly
  const currentUserType = user?.role || 'manager'
  
  // Get dashboard configuration based on user permissions
  const dashboardConfig = getDashboardConfig(currentUserType)
  
  // Add Dashboard as first module, then add icons to all modules
  const dashboardModule = { id: 'dashboard', title: 'Dashboard', icon: TrendingUp }
  const modulesWithIcons = [dashboardModule, ...dashboardConfig.modules.map(module => {
    let icon
    switch(module.id) {
      case 'employees': icon = Users; break;
      case 'users': icon = UserCheck; break;
      case 'locations': icon = MapPin; break;
      case 'customers': icon = UserPlus; break;
      case 'onboarding': icon = BookOpen; break;
      case 'training': icon = PlayCircle; break;
      case 'communication': icon = MessageSquare; break;
      case 'table-tracking': icon = Table; break;
      case 'performance': icon = BarChart3; break;
      case 'tickets': icon = Ticket; break;
      case 'recognition': icon = Trophy; break;
      case 'faq': icon = HelpCircle; break;
      case 'time-tracking': icon = Clock; break;
      case 'time-off': icon = Calendar; break;
      default: icon = Users;
    }
    return { ...module, icon }
  })]
  
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Handle sidebar navigation and auto-close on mobile
  const handleSidebarNavigation = (moduleId) => {
    setActiveTab(moduleId)
    // Close sidebar on mobile when navigation item is selected
    setSidebarOpen(false)
  }

  // Ensure activeTab is set to first available module when permissions change
  useEffect(() => {
    if (!activeTab && modulesWithIcons.length > 0) {
      setActiveTab(modulesWithIcons[0].id)
    }
    // If current activeTab is no longer available, reset to first
    if (activeTab && !modulesWithIcons.find(m => m.id === activeTab)) {
      setActiveTab(modulesWithIcons[0]?.id || null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesWithIcons.map(m => m.id).join('|')])

  // State for admin users and locations - these will be loaded from API
  const [adminUsers, setAdminUsers] = useState([])
  const [locations, setLocations] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employeesSubTab, setEmployeesSubTab] = useState('employees')

  const userTypes = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
  
  // Load dashboard data and locations from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const response = await adminApiService.getDashboard()
        
        if (response.success) {
          setDashboardData(response.data)
          console.log('Dashboard data loaded:', response.data)
        } else {
          console.error('Failed to load dashboard data:', response.error)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const loadLocations = async () => {
      try {
        console.log('Loading locations...')
        const result = await adminApiService.getLocations()
        console.log('Locations API response:', result)
        if (result.success) {
          console.log('Setting locations:', result.locations)
          setLocations(result.locations)
        } else {
          console.error('Failed to load locations:', result.error)
        }
      } catch (error) {
        console.error('Error loading locations:', error)
      }
    }
    
    loadDashboardData()
    loadLocations()
  }, [])

  const handleLogout = () => {
    logout()
  }

  // Initialize responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      
      // Only auto-close sidebar when going to mobile
      if (width <= 640 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    
    // Set initial state - start with sidebar closed
    setViewportWidth(window.innerWidth)
    setSidebarOpen(false)
    
    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showProfileDropdown])
  
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

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Overlay - show whenever sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`w-64 bg-brand-navy text-cream shadow-2xl border-r border-gold/20 flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Company Name */}
        <div className="p-6 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div className="show-540-up">
              <Logo size="sm" />
            </div>
            <div className="show-540-up">
              <h1 className="font-display text-xl font-bold text-gold">
                Woodfire.food
              </h1>
              <p className="text-cream/80 text-sm font-medium tracking-wide">
                Admin Dashboard
              </p>
            </div>
            {/* Mobile logo removed per unified header spec */}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-2">
            {modulesWithIcons.map((module) => {
              const IconComponent = module.icon
              return (
                <button
                  key={module.id}
                  onClick={() => handleSidebarNavigation(module.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === module.id
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'text-cream/80 hover:bg-cream/10 hover:text-cream'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{module.title}</span>
                </button>
              )
            })}
          </div>
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-brand-navy text-cream shadow-lg border-b border-gold/20 fixed top-0 w-full z-20">
          <div className="px-4 py-4">
            <div className="flex justify-between items-center">
              {/* Mobile Hamburger Menu (<=640px) */}
              {viewportWidth <= 640 && (
                <div className="mr-2">
                  <HamburgerMenuIcon 
                    isOpen={sidebarOpen} 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                  />
                </div>
              )}

              {/* Desktop/Tablet Sidebar Toggle (>640px) */}
              {viewportWidth > 640 && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-cream hover:bg-gold/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold/30 mr-2"
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              )}
              
              {/* Left side - Title */}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gold hide-1024-down">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'employees' && 'Employee Management'}
                  {activeTab === 'users' && 'Admin User Management'}
                  {activeTab === 'locations' && 'Location Management'}
                  {activeTab === 'customers' && 'Customer Management'}
                  {activeTab === 'onboarding' && 'Onboarding Content Management'}
                  {activeTab === 'training' && 'Training Module Management'}
                  {activeTab === 'communication' && 'Communication Management'}
                  {activeTab === 'table-tracking' && 'Table Tracking Management'}
                  {activeTab === 'performance' && 'Performance Management'}
                  {activeTab === 'tickets' && 'Ticket Management'}
                  {activeTab === 'recognition' && 'Employee Recognition'}
                  {activeTab === 'faq' && 'FAQ Management'}
                  {activeTab === 'time-tracking' && 'Time Tracking'}
                  {activeTab === 'time-off' && 'Time Off'}
                </h1>
                <p className="text-sm text-cream/70 hide-1024-down">
                  {activeTab === 'dashboard' && 'Overview of restaurant operations and key metrics'}
                  {activeTab === 'employees' && 'Manage employee profiles and onboarding status'}
                  {activeTab === 'users' && 'Manage admin users and their permissions'}
                  {activeTab === 'locations' && 'Configure restaurant locations'}
                  {activeTab === 'customers' && 'Manage customer accounts, status, and location access'}
                  {activeTab === 'onboarding' && 'Manage onboarding pages and content'}
                  {activeTab === 'training' && 'Create and manage training modules with QR codes'}
                  {activeTab === 'communication' && 'Communicate with employees and manage messages'}
                  {activeTab === 'table-tracking' && 'Track customer seating and order delivery'}
                  {activeTab === 'performance' && 'Track employee performance reports, feedback, and ratings'}
                  {activeTab === 'tickets' && 'Manage support tickets and employee assistance requests'}
                  {activeTab === 'recognition' && 'Recognize employee achievements with shout-outs, rewards, and badges'}
                  {activeTab === 'faq' && 'Manage frequently asked questions'}
                  {activeTab === 'time-tracking' && 'Manage employee time tracking, approvals, and reports'}
                  {activeTab === 'time-off' && 'Review and manage employee time off requests'}
                </p>
              </div>
              
              {/* Right side - Notifications and Profile */}
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <div className="relative">
                  <ErrorBoundary>
                    <NotificationCenter />
                  </ErrorBoundary>
                </div>
                
                {/* Profile Avatar with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-cream hover:bg-gold/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center border-2 border-gold/30">
                      <span className="text-sm font-bold text-gold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    
                    {/* Name and Role - Hidden on small screens */}
                    <div className="hide-900-down text-left">
                      <p className="text-sm font-medium text-cream">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-cream/60">{currentUserType}</p>
                    </div>
                    
                    {/* Dropdown Arrow */}
                    <ChevronDown className={`w-4 h-4 text-cream/70 transition-transform duration-200 ${
                      showProfileDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-fadeIn">
                      {/* User info section - visible on mobile */}
                      {viewportWidth <= 900 && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                          <p className="text-xs text-gray-500">{currentUserType}</p>
                          <p className="text-xs text-gray-400">
                            {currentUserType === 'Owner' ? 'All Locations' : (user?.location || 'Location not set')}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false)
                          setShowSettingsModal(true)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gold/10 hover:text-charcoal transition-colors duration-150"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
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

        {/* Content Area with proper scrolling */}
        <div className="flex-1 overflow-y-auto" style={{marginTop: '80px'}}>
          {/* Main Content */}
          <div className="p-4">
          {modulesWithIcons.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              You do not have access to any admin modules. Please contact an Owner for permissions.
            </div>
          )}
          {activeTab === 'dashboard' && (
            <DashboardWidgets dashboardData={dashboardData} loading={loading} />
          )}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              {/* Employees sub-tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 w-full overflow-x-auto">
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => setEmployeesSubTab('employees')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${employeesSubTab === 'employees' ? 'bg-gold text-charcoal border-gold' : 'bg-white text-charcoal/70 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Employees
                  </button>
                  <button
                    onClick={() => setEmployeesSubTab('departments')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${employeesSubTab === 'departments' ? 'bg-gold text-charcoal border-gold' : 'bg-white text-charcoal/70 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Department Structure
                  </button>
                  <button
                    onClick={() => setEmployeesSubTab('roles')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${employeesSubTab === 'roles' ? 'bg-gold text-charcoal border-gold' : 'bg-white text-charcoal/70 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Role Assignments
                  </button>
                </div>
              </div>

              {/* Employees sub-tab content */}
              {employeesSubTab === 'employees' && <EmployeeManagement />}
              {employeesSubTab === 'departments' && <DepartmentManagement />}
              {employeesSubTab === 'roles' && <RoleAssignment />}
            </div>
          )}
          {activeTab === 'users' && (
            <UserManagement 
              users={adminUsers} 
              setUsers={setAdminUsers}
              locations={locations}
              userTypes={userTypes}
            />
          )}
          {activeTab === 'locations' && (
            <LocationManagement 
              locations={locations} 
              setLocations={setLocations}
            />
          )}
          {activeTab === 'customers' && <CustomerManagement />}
          {activeTab === 'onboarding' && <OnboardingContentManagement />}
          {activeTab === 'training' && <TrainingModuleManagement />}
          {activeTab === 'communication' && <AdminChatInterface />}
          {activeTab === 'table-tracking' && <TableTrackingManagement />}
          {activeTab === 'performance' && <PerformanceManagement />}
          {activeTab === 'tickets' && <TicketManagement />}
          {activeTab === 'recognition' && <EmployeeRecognition />}
          {activeTab === 'faq' && <FAQManagement />}
          {activeTab === 'time-tracking' && <TimeTrackingManagement />}
          {activeTab === 'time-off' && <TimeOffManagement />}
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userTypes={userTypes}
      />
    </div>
  )
}

// User Management Component
const UserManagement = ({ users, setUsers, locations, userTypes }) => {
  const { user: currentUser } = useAuth()
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  // Permission checks for current user - use role directly
  const currentUserType = currentUser?.role || 'manager'
     
  const canCreateUsers = hasPermission(currentUserType, 'users', 'create')
  const canEditUsers = hasPermission(currentUserType, 'users', 'edit')
  const canDeleteUsers = hasPermission(currentUserType, 'users', 'delete')
  const canModifyUsers = canEditUsers || canDeleteUsers
  
  // Load admin users from backend on component mount
  useEffect(() => {
    const loadAdminUsers = async () => {
      try {
        const result = await adminApiService.getAdminUsers()
        if (result.success) {
          const transformedUsers = result.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            userType: user.role,
            location: user.location ? user.location.name : user.department || 'Not Assigned'
          }))
          setUsers(transformedUsers)
        }
      } catch (error) {
        console.error('Error loading admin users:', error)
      }
    }
    
    loadAdminUsers()
  }, [])

  const addUser = async (userData) => {
    if (!canCreateUsers) {
      alert('You do not have permission to add users.')
      return
    }
    
    try {
      // Prepare data for backend API
      const apiData = {
        first_name: userData.name.split(' ')[0] || userData.name,
        last_name: userData.name.split(' ').slice(1).join(' ') || 'User',
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password,
        role: userData.userType,
        phone: userData.phone || null,
        location_id: userData.location && userData.location !== '' ? parseInt(userData.location) : null,
        department: userData.location ? locations.find(loc => loc.id === parseInt(userData.location))?.name : null,
        notes: `Created by ${currentUser?.name || 'Admin'}`
      }
      
      const result = await adminApiService.createAdminUser(apiData)
      
      if (result.success) {
        // Add the new user to the list
        const newUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          userType: result.user.role,
          location: result.user.location ? result.user.location.name : result.user.department || 'Not Assigned'
        }
        setUsers([...users, newUser])
        setShowAddUser(false)
        alert('Admin user created successfully!')
      } else {
        alert(`Failed to create user: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Error creating user: ${error.message}`)
    }
  }

  const updateUser = async (userId, userData) => {
    if (!canEditUsers) {
      alert('You do not have permission to edit users.')
      return
    }
    
    try {
      // For now, we'll update permissions based on role change
      const permissions = [] // This could be expanded based on role requirements
      const result = await adminApiService.updateAdminPermissions(userId, permissions)
      
      if (result.success) {
        // Update the user in the list
        const updatedUsers = users.map(user => 
          user.id === userId ? {
            ...user,
            name: userData.name,
            email: userData.email,
            userType: userData.userType,
            location: userData.location
          } : user
        )
        setUsers(updatedUsers)
        setEditingUser(null)
        alert('User updated successfully!')
      } else {
        alert(`Failed to update user: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert(`Error updating user: ${error.message}`)
    }
  }

  const deleteUser = async (userId) => {
    if (!canDeleteUsers) {
      alert('You do not have permission to delete users.')
      return
    }
    
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        const result = await adminApiService.deactivateAdminUser(userId)
        
        if (result.success) {
          // Remove the user from the list
          const updatedUsers = users.filter(user => user.id !== userId)
          setUsers(updatedUsers)
          alert('User deactivated successfully!')
        } else {
          alert(`Failed to deactivate user: ${result.error}`)
        }
      } catch (error) {
        console.error('Error deactivating user:', error)
        alert(`Error deactivating user: ${error.message}`)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-charcoal">Admin Users</h2>
        {canCreateUsers && (
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-gold-gradient text-charcoal px-4 py-2 rounded-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto mobile-table-container">
          <table className="min-w-full divide-y divide-gray-200 mobile-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              {canModifyUsers && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{
                    'owner': 'Owner',
                    'admin': 'Admin',
                    'manager': 'Manager',
                    'hiring_manager': 'Hiring Manager',
                    'expo': 'Expo'
                  }[user.userType] || user.userType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.userType === 'owner' ? (
                    <span className="text-gold font-medium">All Locations</span>
                  ) : (
                    user.location || 'Not Assigned'
                  )}
                </td>
                {canModifyUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {canEditUsers && (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-gold hover:text-gold-dark mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteUsers && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No admin users found. Add your first user to get started.
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {(showAddUser || editingUser) && (
        <UserModal
          user={editingUser}
          locations={console.log('Passing locations to UserModal:', locations) || locations}
          userTypes={userTypes}
          onSave={editingUser ? (data) => updateUser(editingUser.id, data) : addUser}
          onClose={() => {
            setShowAddUser(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}

// Dashboard Widgets Component
const DashboardWidgets = ({ dashboardData, loading }) => {
  const [employeeStats, setEmployeeStats] = useState(null)
  const [trainingStats, setTrainingStats] = useState(null)
  const [anniversaryData, setAnniversaryData] = useState(null)
  const [overdueAlerts, setOverdueAlerts] = useState([])

  // Process dashboard data when it changes
  useEffect(() => {
    if (dashboardData?.dashboard_data?.statistics) {
      const stats = dashboardData.dashboard_data.statistics
      
      // Process employee statistics
      const empStats = {
        total: stats.total_employees || 0,
        active: stats.approved_employees || 0,
        new: stats.pending_employees || 0,
        interview: stats.employees_by_stage?.interview || 0,
        onboarding: (stats.employees_by_stage?.location_selected || 0) + (stats.employees_by_stage?.questionnaire_completed || 0),
        fullyOnboarded: stats.employees_by_stage?.active || 0
      }
      
      // Process training statistics
      const trainingStatsData = {
        totalAssigned: stats.training?.total_assignments || 0,
        totalCompleted: stats.training?.completed_assignments || 0,
        totalOverdue: stats.training?.overdue_assignments || 0,
        totalPending: stats.training?.pending_assignments || 0,
        completionRate: stats.training?.completion_rate || 0,
        moduleStats: [] // This can be expanded later
      }
      
      // Placeholder anniversary data
      const anniversaryStatsData = {
        upcomingAnniversaries: 0,
        thisMonthAnniversaries: 0,
        newMilestones: 0,
        recentMilestones: []
      }
      
      setEmployeeStats(empStats)
      setTrainingStats(trainingStatsData)
      setAnniversaryData(anniversaryStatsData)
      setOverdueAlerts([]) // Empty for now
      
      console.log('Dashboard stats processed:', { empStats, trainingStatsData })
    }
  }, [dashboardData])


  if (loading || !employeeStats || !trainingStats || !anniversaryData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mobile-grid">
        {/* Employee Overview */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-charcoal">{employeeStats.total}</span>
          </div>
          <h3 className="font-semibold text-charcoal mb-2">Total Employees</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">{employeeStats.active} Active</span>
            <span className="text-yellow-600 font-medium">{employeeStats.new} New</span>
          </div>
        </div>

        {/* Training Overview */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-charcoal">{trainingStats.completionRate}%</span>
          </div>
          <h3 className="font-semibold text-charcoal mb-2">Training Completion</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">{trainingStats.totalCompleted} Done</span>
            <span className="text-gray-600 font-medium">{trainingStats.totalPending} Pending</span>
          </div>
        </div>

        {/* Anniversary Overview */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gold/10 rounded-lg">
              <Gift className="w-6 h-6 text-gold" />
            </div>
            <span className="text-2xl font-bold text-charcoal">{anniversaryData.upcomingAnniversaries}</span>
          </div>
          <h3 className="font-semibold text-charcoal mb-2">Upcoming Anniversaries</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gold font-medium">{anniversaryData.thisMonthAnniversaries} This Month</span>
            <span className="text-blue-600 font-medium">{anniversaryData.newMilestones} New</span>
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-charcoal">{trainingStats.totalOverdue}</span>
          </div>
          <h3 className="font-semibold text-charcoal mb-2">Overdue Training</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-red-600 font-medium">{overdueAlerts.length} Employees</span>
            <span className="text-orange-600 font-medium">Need Action</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Employee Status Breakdown */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal">Employee Status Breakdown</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'Active', count: employeeStats.active, color: 'bg-green-500', textColor: 'text-green-700' },
              { label: 'New Applicants', count: employeeStats.new, color: 'bg-blue-500', textColor: 'text-blue-700' },
              { label: 'In Interview', count: employeeStats.interview, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              { label: 'Onboarding', count: employeeStats.onboarding, color: 'bg-purple-500', textColor: 'text-purple-700' },
              { label: 'Fully Onboarded', count: employeeStats.fullyOnboarded, color: 'bg-green-600', textColor: 'text-green-800' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-charcoal">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Milestones */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal">Recent Anniversary Milestones</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          {anniversaryData.recentMilestones.length > 0 ? (
            <div className="space-y-3">
              {anniversaryData.recentMilestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20">
                  <Gift className="w-4 h-4 text-gold flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{milestone.employeeName}</p>
                    <p className="text-xs text-gold font-semibold">{milestone.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No recent milestones</p>
            </div>
          )}
        </div>

        {/* Overdue Training Alerts */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal">Overdue Training Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          {overdueAlerts.length > 0 ? (
            <div className="space-y-3">
              {overdueAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{alert.employeeName}</p>
                    <p className="text-xs text-red-600 font-semibold">
                      {alert.totalOverdue} overdue module{alert.totalOverdue !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
              <p className="text-sm">No overdue training!</p>
            </div>
          )}
        </div>
      </div>

      {/* Training Module Performance */}
      {trainingStats.moduleStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-charcoal">Training Module Performance</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingStats.moduleStats.slice(0, 6).map((module, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-charcoal truncate flex-1 mr-2">{module.moduleTitle}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    module.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                    module.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {module.completionRate}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{module.completed}/{module.assigned} completed</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      module.completionRate >= 80 ? 'bg-green-500' :
                      module.completionRate >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${module.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
