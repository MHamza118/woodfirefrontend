import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, createContext, useContext, useCallback, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ensureOnboardingPagesExist } from './utils/onboardingInit'
import OnboardingForm from './components/OnboardingForm'
import ConfirmationPage from './components/ConfirmationPage'
import Header from './components/Header'
import Footer from './components/Footer'
import QRCodeGenerator from './components/QRCodeGenerator'
import Login from './components/Login'
import Signup from './components/Signup'
import AdminDashboard from './components/admin/AdminDashboard'
import EmployeeDashboard from './components/employee/EmployeeDashboard'
import QRScanPage from './components/employee/QRScanPage'
import StatusMessage from './components/employee/StatusMessage'
import QRClockAction from './components/employee/QRClockAction'

// Customer-facing components
import LandingPage from './components/customer/LandingPage'
import SeatingPage from './components/customer/SeatingPage'
import SuccessPage from './components/customer/SuccessPage'
import CustomerLogin from './components/customer/CustomerLogin'
import CustomerSignup from './components/customer/CustomerSignup'
import CustomerDashboard from './components/customer/CustomerDashboard'
import AdminLogin from './components/admin/AdminLogin'

// Employee Context for state management
const EmployeeContext = createContext()

export const useEmployee = () => {
  const context = useContext(EmployeeContext)
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider')
  }
  return context
}

// Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
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
  
  if (!user) {
    return <Navigate to="/admin-login" replace />
  }
  
  // Check if user is admin (owner, admin, manager, hiring_manager, expo)
  const adminRoles = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
  if (!adminRoles.includes(user.role)) {
    return <Navigate to="/employee/dashboard" replace />
  }
  
  return children
}

// Protected Route Component for Employees
const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
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
  
  if (!user) {
    return <Navigate to="/employee/login" replace />
  }
  
  // Redirect admin users to admin dashboard
  const adminRoles = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
  if (adminRoles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  // For employees, check if they can access the dashboard
  if (user.role === 'employee') {
    // If employee can access dashboard (approved and active), allow access
    if (user.can_access_dashboard) {
      return children
    }
    
    // If employee cannot access dashboard, redirect based on current stage
    switch (user.stage) {
      case 'interview':
        return <Navigate to="/employee/qr-scan" replace />
      case 'location_selected':
        return <Navigate to="/employee/questionnaire" replace />
      case 'questionnaire_completed':
        return <Navigate to="/confirmation" replace />
      default:
        // For unknown stages or pending approval, redirect to QR scan
        return <Navigate to="/employee/qr-scan" replace />
    }
  }
  
  // Legacy fallback for existing users with old status system
  if (user.status === 'INTERVIEW') {
    return <Navigate to="/confirmation" replace />
  }
  
  if (user.status === 'PAUSED' || user.status === 'INACTIVE') {
    return <StatusMessage status={user.status} />
  }
  
  if (user.status === 'ACTIVE') {
    return children
  }
  
  // For new employees (NEW status) or without status, allow access to QR scan and onboarding
  return children
}

// Customer Protected Route Component
const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
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
  
  if (!user) {
    return <Navigate to="/customer/login" replace />
  }
  
  // Only allow customers
  if (user.role !== 'customer') {
    return <Navigate to="/employee/login" replace />
  }
  
  return children
}

// Public Route Component (redirects based on user role if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
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
  
  if (user) {
    // Redirect based on user role and status
    const adminRoles = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
    if (adminRoles.includes(user.role)) {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />
    } else if (user.role === 'employee') {
      // Use new employee stage-based routing
      if (user.can_access_dashboard) {
        return <Navigate to="/employee/dashboard" replace />
      } else {
        // Redirect based on current stage
        switch (user.stage) {
          case 'interview':
            return <Navigate to="/employee/qr-scan" replace />
          case 'location_selected':
            return <Navigate to="/employee/questionnaire" replace />
          case 'questionnaire_completed':
            return <Navigate to="/confirmation" replace />
          default:
            return <Navigate to="/employee/qr-scan" replace />
        }
      }
    } else if (user.status === 'ACTIVE') {
      // Legacy fallback for old status system
      return <Navigate to="/employee/dashboard" replace />
    } else if (user.status === 'INTERVIEW') {
      return <Navigate to="/confirmation" replace />
    } else {
      // New employees go to QR scan page to select location
      return <Navigate to="/employee/qr-scan" replace />
    }
  }
  
  return children
}

// Main App Layout Component (with logout button)
const AppLayout = ({ children }) => {
  const { employee } = useEmployee()
  
  return (
    <div className="min-h-screen bg-cream font-body text-charcoal flex flex-col">
      {/* Header */}
      <Header showContactInfo={true} location={employee.location} showLogout={true} />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer location={employee.location} />
    </div>
  )
}

// Public Layout Component (without logout button for login/signup)
const PublicLayout = ({ children }) => {
  const { employee } = useEmployee()
  
  return (
    <div className="min-h-screen bg-cream font-body text-charcoal flex flex-col">
      {/* Header */}
      <Header showContactInfo={true} location={employee.location} showLogout={false} />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer location={employee.location} />
    </div>
  )
}

function App() {
  const [employee, setEmployee] = useState({
    id: null,
    status: null, // 'INTERVIEW', 'ACTIVE', 'PAUSED', 'INACTIVE'
    location: null,
    designation: null, // 'Front of House', 'Back of House', 'Both'
    personalInfo: {},
    interviewInfo: {},
  })

  const updateEmployee = useCallback((updates) => {
    setEmployee(prev => ({ ...prev, ...updates }))
  }, [])

  // Initialize onboarding pages when app loads
  useEffect(() => {
    ensureOnboardingPagesExist()
  }, [])

  return (
    <AuthProvider>
      <EmployeeContext.Provider value={{ employee, updateEmployee }}>
        <Router>
          <Routes>
            {/* Customer Routes (No Auth Required) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/seating" element={<SeatingPage />} />
            <Route path="/success" element={<SuccessPage />} />
            
            {/* Customer Authentication Routes */}
            <Route path="/customer/login" element={
              <PublicRoute>
                <CustomerLogin />
              </PublicRoute>
            } />
            
            <Route path="/customer/signup" element={
              <PublicRoute>
                <CustomerSignup />
              </PublicRoute>
            } />
            
            {/* Customer Protected Routes */}
            <Route path="/customer/dashboard" element={
              <CustomerRoute>
                <CustomerDashboard />
              </CustomerRoute>
            } />
            
            {/* Admin Login Route */}
            <Route path="/admin-login" element={
              <PublicRoute>
                <AdminLogin />
              </PublicRoute>
            } />
            
            {/* Employee Login Route */}
            <Route path="/employee/login" element={
              <PublicRoute>
                <PublicLayout>
                  <Login />
                </PublicLayout>
              </PublicRoute>
            } />
            
            {/* Legacy Admin/Employee Login Route - now redirects to employee login */}
            <Route path="/admin/login" element={
              <PublicRoute>
                <PublicLayout>
                  <Login />
                </PublicLayout>
              </PublicRoute>
            } />
            
            <Route path="/admin/signup" element={
              <PublicRoute>
                <PublicLayout>
                  <Signup />
                </PublicLayout>
              </PublicRoute>
            } />
            
            {/* Legacy route redirects for existing users */}
            <Route path="/login" element={<Navigate to="/employee/login" replace />} />
            <Route path="/signup" element={<Navigate to="/admin/signup" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            <Route path="/admin/qr-generator" element={
              <AppLayout>
                <QRCodeGenerator />
              </AppLayout>
            } />

            {/* Employee Routes */}
            <Route path="/employee/dashboard" element={
              <EmployeeRoute>
                <EmployeeDashboard />
              </EmployeeRoute>
            } />
            
            <Route path="/employee/qr-scan" element={
              <AppLayout>
                <QRScanPage />
              </AppLayout>
            } />
            
            <Route path="/employee/questionnaire" element={
              <AppLayout>
                <OnboardingForm />
              </AppLayout>
            } />
            
            {/* QR Code Clock Action Routes */}
            <Route path="/qr/:action" element={<QRClockAction />} />
            
            
            {/* Public Onboarding Routes (no auth required) */}
            <Route path="/onboard/:locationId" element={
              <AppLayout>
                <OnboardingForm />
              </AppLayout>
            } />

            <Route path="/confirmation" element={
              <AppLayout>
                <ConfirmationPage />
              </AppLayout>
            } />

            {/* Catch-all route redirects to customer landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EmployeeContext.Provider>
    </AuthProvider>
  )
}

export default App
