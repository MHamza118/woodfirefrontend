// Automated Notification Scheduler Service
// Handles periodic checks for training reminders, overdue training, and anniversary notifications

import notificationService from './notificationService'
import emailService from './EmailService'
import { 
  calculateTenure, 
  getCompletedMilestones, 
  hasUpcomingAnniversary,
  getOverdueTraining,
  markAnniversaryCelebrated,
  formatTenure 
} from '../utils/employeeUtils'

class NotificationScheduler {
  constructor() {
    this.intervals = {}
    this.isRunning = false
    this.checkInterval = 60000 // 1 minute for development, can be changed to 1 hour in production
    this.lastChecks = {
      training: null,
      anniversaries: null,
      dailyReminders: null
    }
  }

  // Start the notification scheduler
  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running')
      return
    }

    this.isRunning = true
    console.log('Starting notification scheduler...')

    // Check immediately on start
    this.runAllChecks()

    // Set up periodic checks
    this.intervals.main = setInterval(() => {
      this.runAllChecks()
    }, this.checkInterval)

    // Set up daily check at a specific time (for production)
    this.intervals.daily = setInterval(() => {
      this.runDailyChecks()
    }, 24 * 60 * 60 * 1000) // 24 hours
  }

  // Stop the notification scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Notification scheduler is not running')
      return
    }

    this.isRunning = false
    console.log('Stopping notification scheduler...')

    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval)
    })
    this.intervals = {}
  }

  // Run all notification checks
  async runAllChecks() {
    try {
      await this.checkTrainingReminders()
      await this.checkAnniversaries()
      await this.checkOverdueTraining()
    } catch (error) {
      console.error('Error running notification checks:', error)
    }
  }

  // Run daily-specific checks
  async runDailyChecks() {
    try {
      console.log('Running daily notification checks...')
      await this.sendDailySummary()
      await this.cleanupOldNotifications()
    } catch (error) {
      console.error('Error running daily checks:', error)
    }
  }

  // Check for training reminders
  async checkTrainingReminders() {
    try {
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
      const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE')

      for (const employee of activeEmployees) {
        if (!employee.trainingAssignments) continue

        const now = new Date()
        
        for (const assignment of employee.trainingAssignments) {
          if (assignment.completedAt) continue // Skip completed training
          
          // Check if reminder is due
          if (assignment.dueDate) {
            const dueDate = new Date(assignment.dueDate)
            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60)
            
            const prefs = employee.trainingNotificationPrefs || { reminderFrequency: 24 }
            
            // Send reminder if within reminder frequency window
            if (hoursUntilDue <= prefs.reminderFrequency && hoursUntilDue > 0) {
              const lastReminder = assignment.lastReminderSent ? new Date(assignment.lastReminderSent) : null
              const hoursSinceLastReminder = lastReminder ? (now - lastReminder) / (1000 * 60 * 60) : Infinity
              
              // Only send if enough time has passed since last reminder
              if (hoursSinceLastReminder >= prefs.reminderFrequency) {
                await this.sendTrainingReminder(employee, assignment)
                
                // Update last reminder timestamp
                assignment.lastReminderSent = now.toISOString()
                assignment.remindersCount = (assignment.remindersCount || 0) + 1
              }
            }
          }
        }
      }

      // Update employees data
      localStorage.setItem('employees', JSON.stringify(employees))
      this.lastChecks.training = new Date().toISOString()

    } catch (error) {
      console.error('Error checking training reminders:', error)
    }
  }

  // Check for anniversary notifications
  async checkAnniversaries() {
    try {
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
      const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE' && emp.hireDate)

      for (const employee of activeEmployees) {
        const completedMilestones = getCompletedMilestones(employee.hireDate)
        const celebratedMilestones = employee.anniversaryMilestones || []

        // Check for new milestones
        for (const milestone of completedMilestones) {
          const alreadyCelebrated = celebratedMilestones.some(c => c.milestone === milestone.label)
          
          if (!alreadyCelebrated) {
            await this.sendAnniversaryNotification(employee, milestone)
            
            // Mark as celebrated
            const updatedEmployee = markAnniversaryCelebrated(employee, milestone.label)
            Object.assign(employee, updatedEmployee)
          }
        }

        // Check for upcoming anniversaries (advance notice)
        if (hasUpcomingAnniversary(employee.hireDate)) {
          const lastUpcomingAlert = employee.lastUpcomingAnniversaryAlert ? new Date(employee.lastUpcomingAnniversaryAlert) : null
          const daysSinceLastAlert = lastUpcomingAlert ? (new Date() - lastUpcomingAlert) / (1000 * 60 * 60 * 24) : Infinity

          if (daysSinceLastAlert >= 7) { // Send weekly reminders for upcoming anniversaries
            await this.sendUpcomingAnniversaryNotification(employee)
            employee.lastUpcomingAnniversaryAlert = new Date().toISOString()
          }
        }
      }

      localStorage.setItem('employees', JSON.stringify(employees))
      this.lastChecks.anniversaries = new Date().toISOString()

    } catch (error) {
      console.error('Error checking anniversaries:', error)
    }
  }

  // Check for overdue training
  async checkOverdueTraining() {
    try {
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
      const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE')

      for (const employee of activeEmployees) {
        const overdueTraining = getOverdueTraining(employee)
        
        if (overdueTraining.length > 0) {
          const prefs = employee.trainingNotificationPrefs || { overdueAlerts: true }
          
          if (prefs.overdueAlerts) {
            const lastOverdueAlert = employee.lastOverdueAlert ? new Date(employee.lastOverdueAlert) : null
            const daysSinceLastAlert = lastOverdueAlert ? (new Date() - lastOverdueAlert) / (1000 * 60 * 60 * 24) : Infinity

            // Send overdue alert every 3 days
            if (daysSinceLastAlert >= 3) {
              await this.sendOverdueTrainingNotification(employee, overdueTraining)
              employee.lastOverdueAlert = new Date().toISOString()
            }
          }
        }
      }

      localStorage.setItem('employees', JSON.stringify(employees))

    } catch (error) {
      console.error('Error checking overdue training:', error)
    }
  }

  // Send training reminder notification
  async sendTrainingReminder(employee, assignment) {
    const employeeName = `${employee.personalInfo?.firstName || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
    const dueDate = new Date(assignment.dueDate).toLocaleDateString()
    
    // Send in-app notification
    notificationService.notifyTrainingReminder({
      id: employee.id,
      name: employeeName,
      email: employee.email
    }, assignment.moduleTitle, dueDate)

    // Send email notification
    if (employee.personalInfo?.email) {
      const emailTemplate = emailService.getEmailTemplate('trainingReminder', {
        employeeName,
        trainingTitle: assignment.moduleTitle,
        dueDate,
        description: assignment.description,
        priority: assignment.priority || 'Medium'
      })
      
      if (emailTemplate) {
        await emailService.sendEmail(
          employee.personalInfo.email,
          emailTemplate.subject,
          emailTemplate,
          'trainingReminder',
          { employeeId: employee.id, assignmentId: assignment.id }
        )
      }
    }

    console.log(`Training reminder sent to ${employeeName} for ${assignment.moduleTitle}`)
  }

  // Send anniversary notification
  async sendAnniversaryNotification(employee, milestone) {
    const employeeName = `${employee.personalInfo?.firstName || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
    
    // Send in-app notification
    notificationService.notifyEmployeeAnniversary({
      id: employee.id,
      name: employeeName,
      email: employee.email
    }, milestone.label)

    // Send email notification
    if (employee.personalInfo?.email) {
      const emailTemplate = emailService.getEmailTemplate('anniversaryNotification', {
        employeeName,
        milestone: milestone.label,
        hireDate: employee.hireDate
      })
      
      if (emailTemplate) {
        await emailService.sendEmail(
          employee.personalInfo.email,
          emailTemplate.subject,
          emailTemplate,
          'anniversaryNotification',
          { employeeId: employee.id, milestone: milestone.label }
        )
      }
    }

    console.log(`Anniversary notification sent to ${employeeName} for ${milestone.label}`)
  }

  // Send upcoming anniversary notification
  async sendUpcomingAnniversaryNotification(employee) {
    const employeeName = `${employee.personalInfo?.firstName || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
    
    notificationService.addNotification({
      type: 'anniversary_upcoming',
      title: 'Upcoming Anniversary',
      message: `${employeeName}'s work anniversary is coming up soon!`,
      priority: 'medium',
      employeeId: employee.id,
      metadata: {
        employeeName,
        hireDate: employee.hireDate
      }
    })

    console.log(`Upcoming anniversary notification sent for ${employeeName}`)
  }

  // Send overdue training notification
  async sendOverdueTrainingNotification(employee, overdueTraining) {
    const employeeName = `${employee.personalInfo?.firstName || 'Employee'} ${employee.personalInfo?.lastName || ''}`.trim()
    const overdueCount = overdueTraining.length
    const moduleNames = overdueTraining.map(t => t.moduleTitle).join(', ')
    
    // Send in-app notification
    notificationService.addNotification({
      type: 'training_overdue',
      title: 'Overdue Training Alert',
      message: `${employeeName} has ${overdueCount} overdue training module(s): ${moduleNames}`,
      priority: 'high',
      employeeId: employee.id,
      metadata: {
        employeeName,
        overdueCount,
        modules: overdueTraining
      }
    })

    // Send email notification for each overdue training
    if (employee.personalInfo?.email) {
      for (const training of overdueTraining) {
        const emailTemplate = emailService.getEmailTemplate('trainingOverdue', {
          employeeName,
          trainingTitle: training.moduleTitle,
          dueDate: new Date(training.dueDate).toLocaleDateString(),
          description: training.description,
          priority: 'HIGH'
        })
        
        if (emailTemplate) {
          await emailService.sendEmail(
            employee.personalInfo.email,
            emailTemplate.subject,
            emailTemplate,
            'trainingOverdue',
            { employeeId: employee.id, trainingId: training.id }
          )
        }
      }
    }

    console.log(`Overdue training notification sent for ${employeeName} (${overdueCount} modules)`)
  }

  // Send daily summary to administrators
  async sendDailySummary() {
    try {
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
      const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE')
      
      let totalOverdue = 0
      let upcomingAnniversaries = 0
      let trainingDueSoon = 0

      for (const employee of activeEmployees) {
        // Count overdue training
        const overdue = getOverdueTraining(employee)
        totalOverdue += overdue.length

        // Count upcoming anniversaries
        if (employee.hireDate && hasUpcomingAnniversary(employee.hireDate)) {
          upcomingAnniversaries++
        }

        // Count training due soon (within 3 days)
        if (employee.trainingAssignments) {
          const now = new Date()
          trainingDueSoon += employee.trainingAssignments.filter(assignment => {
            if (assignment.completedAt || !assignment.dueDate) return false
            const dueDate = new Date(assignment.dueDate)
            const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24)
            return daysUntilDue <= 3 && daysUntilDue >= 0
          }).length
        }
      }

      // Send summary notification
      notificationService.addNotification({
        type: 'daily_summary',
        title: 'Daily Training & HR Summary',
        message: `${totalOverdue} overdue training items, ${upcomingAnniversaries} upcoming anniversaries, ${trainingDueSoon} training items due soon`,
        priority: 'medium',
        metadata: {
          totalOverdue,
          upcomingAnniversaries,
          trainingDueSoon,
          activeEmployees: activeEmployees.length
        }
      })

      console.log('Daily summary sent')

    } catch (error) {
      console.error('Error sending daily summary:', error)
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

      // Keep only notifications from the last 30 days
      const recentNotifications = notifications.filter(notification => {
        const createdAt = new Date(notification.createdAt)
        return createdAt > thirtyDaysAgo
      })

      if (recentNotifications.length !== notifications.length) {
        localStorage.setItem('notifications', JSON.stringify(recentNotifications))
        console.log(`Cleaned up ${notifications.length - recentNotifications.length} old notifications`)
      }

    } catch (error) {
      console.error('Error cleaning up notifications:', error)
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastChecks: this.lastChecks,
      intervalsActive: Object.keys(this.intervals).length
    }
  }

  // Update check interval (for testing purposes)
  setCheckInterval(intervalMs) {
    this.checkInterval = intervalMs
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }
}

// Create singleton instance
const notificationScheduler = new NotificationScheduler()

export default notificationScheduler
