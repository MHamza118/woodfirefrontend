import { createContext, useContext, useState, useEffect } from 'react'
import notificationService from '../services/notificationService'
import customerApiService from '../services/customerApiService'
import employeeApiService from '../services/employeeApiService'
import adminApiService from '../services/adminApiService'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Check for existing user session on app load
    useEffect(() => {
        // Check for existing user session ONLY if it exists
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser)
                // Only set user if it's a valid session
                if (parsedUser && parsedUser.id && parsedUser.email) {
                    setUser(parsedUser)
                } else {
                    // Clear invalid session
                    localStorage.removeItem('user')
                }
            } catch (error) {
                console.error('Error parsing stored user:', error)
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
    }, [])

    const login = async (email, password, userType = 'employee') => {
        try {
            // If this is a customer login, use the API service
            if (userType === 'customer') {
                return await customerLogin(email, password)
            }

            // If this is an explicit employee login, use the Employee API service
            if (userType === 'employee') {
                return await employeeLogin(email, password)
            }

            // If this is an explicit admin login, use the Admin API service
            if (userType === 'admin') {
                return await adminLogin(email, password)
            }

            // For other user types, return error
            throw new Error(`Login for user type '${userType}' not implemented yet`)
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const signup = async (userData) => {
        try {
            const { name, phone, email, password, confirmPassword, locations, role = 'employee' } = userData

            // If this is a customer signup, use the API service
            if (role === 'customer') {
                return await customerSignup(userData)
            }

            // If this is an employee signup, use the Employee API service
            if (role === 'employee') {
                return await employeeSignup(userData)
            }

            // For admin signup, you'll need to implement admin API later
            // For now, return error for non-employee/non-customer signups
            throw new Error('Admin signup not implemented yet')
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Employee-specific signup using API
    const employeeSignup = async (employeeData) => {
        try {
            const response = await employeeApiService.registerEmployee(employeeData)
            
            if (response.success) {
                // After successful registration, automatically log the employee in
                const loginResult = await employeeLogin(employeeData.email, employeeData.password)
                
                if (loginResult.success) {
                    return loginResult
                } else {
                    // Registration succeeded but login failed - this is unexpected
                    return { 
                        success: false, 
                        error: 'Registration successful but auto-login failed. Please login manually.' 
                    }
                }
            }
            
            return { success: false, error: response.error }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Employee-specific login using API
    const employeeLogin = async (email, password) => {
        try {
            const response = await employeeApiService.loginEmployee(email, password)
            
            if (response.success) {
                // This should only be an employee login now
                const employee = response.employee
                
                // Create user session for employee
                const userSession = {
                    id: employee.id,
                    email: employee.email,
                    name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
                    role: 'employee',
                    status: employee.status,
                    stage: response.stage, // Use stage from response root
                    can_access_dashboard: response.can_access_dashboard
                }

                setUser(userSession)
                localStorage.setItem('user', JSON.stringify(userSession))

                return { success: true, user: userSession }
            }
            
            return { success: false, error: response.error }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Admin-specific login using API
    const adminLogin = async (email, password, expectedRole = null) => {
        try {
            const response = await adminApiService.loginAdmin(email, password)
            
            if (response.success) {
                const admin = response.admin
                const actualRole = response.role
                
                // Validate role if expectedRole is provided
                if (expectedRole && actualRole !== expectedRole) {
                    return { 
                        success: false, 
                        error: `Role mismatch. Your account role is '${actualRole}', but you selected '${expectedRole}'.`
                    }
                }
                
                // Create user session for admin
                const userSession = {
                    id: admin.id,
                    email: admin.email,
                    name: admin.full_name || `${admin.first_name} ${admin.last_name}`,
                    role: actualRole, // Use the actual role from backend (owner, admin, manager, hiring_manager, expo)
                    status: admin.status,
                    admin_role: actualRole, // Store admin-specific role for reference
                    can_access_dashboard: response.can_access_dashboard
                }

                setUser(userSession)
                localStorage.setItem('user', JSON.stringify(userSession))

                return { success: true, user: userSession }
            }
            
            return { success: false, error: response.error }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Customer-specific signup using API
    const customerSignup = async (customerData) => {
        try {
            const response = await customerApiService.registerCustomer(customerData)
            
            if (response.success) {
                const transformedCustomer = customerApiService.transformCustomerData(response.customer)
                
                // Create user session for customer
                const userSession = {
                    id: transformedCustomer.id,
                    email: transformedCustomer.email,
                    name: transformedCustomer.name,
                    role: 'customer',
                    status: 'ACTIVE'
                }

                setUser(userSession)
                localStorage.setItem('user', JSON.stringify(userSession))

                return { success: true, user: userSession }
            }
            
            return { success: false, error: response.error }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Customer-specific login using API
    const customerLogin = async (email, password) => {
        try {
            const response = await customerApiService.loginCustomer(email, password)
            
            if (response.success) {
                const transformedCustomer = customerApiService.transformCustomerData(response.customer)
                
                // Create user session for customer
                const userSession = {
                    id: transformedCustomer.id,
                    email: transformedCustomer.email,
                    name: transformedCustomer.name,
                    role: 'customer',
                    status: 'ACTIVE'
                }

                setUser(userSession)
                localStorage.setItem('user', JSON.stringify(userSession))

                return { success: true, user: userSession }
            }
            
            return { success: false, error: response.error }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const logout = async () => {
        // If user is a customer, logout via API
        if (user && user.role === 'customer') {
            await customerApiService.logoutCustomer()
        }
        
        // If user is an employee, logout via API
        if (user && user.role === 'employee') {
            await employeeApiService.logoutEmployee()
        }
        
        // If user is an admin, logout via API
        const adminRoles = ['owner', 'admin', 'manager', 'hiring_manager', 'expo']
        if (user && adminRoles.includes(user.role)) {
            await adminApiService.logoutAdmin()
        }
        
        setUser(null)
        localStorage.removeItem('user')
    }

    const clearAllData = () => {
        setUser(null)
        localStorage.removeItem('user')
    }

    const value = {
        user,
        login,
        signup,
        logout,
        clearAllData,
        loading,
        customerLogin,
        customerSignup,
        employeeLogin,
        employeeSignup,
        adminLogin
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}