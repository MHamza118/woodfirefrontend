// Email Service for sending notification emails
// In production, this would integrate with services like SendGrid, Mailgun, or AWS SES

class EmailService {
  constructor() {
    this.apiKey = process.env.REACT_APP_EMAIL_API_KEY || 'demo-api-key'
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@309311restaurants.com'
    this.fromName = process.env.REACT_APP_FROM_NAME || 'Woodfire.food'
    this.isProduction = process.env.NODE_ENV === 'production'
    this.sentEmails = this.loadSentEmails()
  }

  // Load sent emails from storage
  loadSentEmails() {
    try {
      return JSON.parse(localStorage.getItem('sentEmails') || '[]')
    } catch {
      return []
    }
  }

  // Save sent email record
  saveSentEmail(emailData) {
    this.sentEmails.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    })
    localStorage.setItem('sentEmails', JSON.stringify(this.sentEmails))
  }

  // Email templates
  getEmailTemplate(type, data) {
    const templates = {
      trainingReminder: {
        subject: `Training Reminder: ${data.trainingTitle} - Due ${data.dueDate}`,
        html: this.generateTrainingReminderHTML(data),
        text: this.generateTrainingReminderText(data)
      },
      
      trainingOverdue: {
        subject: `🚨 Urgent: Training Overdue - ${data.trainingTitle}`,
        html: this.generateTrainingOverdueHTML(data),
        text: this.generateTrainingOverdueText(data)
      },

      anniversaryNotification: {
        subject: `🎉 Congratulations on your ${data.milestone}!`,
        html: this.generateAnniversaryHTML(data),
        text: this.generateAnniversaryText(data)
      },

      upcomingAnniversary: {
        subject: `Your work anniversary is approaching!`,
        html: this.generateUpcomingAnniversaryHTML(data),
        text: this.generateUpcomingAnniversaryText(data)
      },

      onboardingReminder: {
        subject: `Welcome! Complete your onboarding checklist`,
        html: this.generateOnboardingReminderHTML(data),
        text: this.generateOnboardingReminderText(data)
      },

      dailySummary: {
        subject: `Daily HR Summary - ${new Date().toLocaleDateString()}`,
        html: this.generateDailySummaryHTML(data),
        text: this.generateDailySummaryText(data)
      }
    }

    return templates[type] || null
  }

  // Send email function
  async sendEmail(to, subject, content, type = 'notification', metadata = {}) {
    try {
      if (!to || !subject || !content.html) {
        throw new Error('Missing required email parameters')
      }

      const emailData = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        html: content.html,
        text: content.text || this.stripHtml(content.html),
        type,
        metadata,
        attemptedAt: new Date().toISOString()
      }

      if (this.isProduction) {
        // In production, send actual email
        const result = await this.sendProductionEmail(emailData)
        this.saveSentEmail({ ...emailData, success: true, result })
        return { success: true, emailId: result.id }
      } else {
        // In development, simulate email sending
        console.log('📧 EMAIL SIMULATION:')
        console.log('To:', to)
        console.log('Subject:', subject)
        console.log('Content Preview:', content.html.substring(0, 200) + '...')
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.saveSentEmail({ ...emailData, success: true, simulated: true })
        return { success: true, emailId: 'sim-' + Date.now() }
      }

    } catch (error) {
      console.error('Failed to send email:', error)
      this.saveSentEmail({ 
        to, subject, type, metadata,
        success: false, 
        error: error.message,
        attemptedAt: new Date().toISOString()
      })
      return { success: false, error: error.message }
    }
  }

  // Send production email (placeholder for actual service integration)
  async sendProductionEmail(emailData) {
    // This would integrate with your email service provider
    // Example for SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(this.apiKey)
    
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    }
    
    return await sgMail.send(msg)
    */
    
    throw new Error('Production email service not configured')
  }

  // HTML template generators
  generateTrainingReminderHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Training Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${this.fromName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p>Dear ${data.employeeName},</p>
          
          <p>This is a friendly reminder about your upcoming training:</p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0;">${data.trainingTitle}</h3>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p><strong>Priority:</strong> ${data.priority || 'Medium'}</p>
            ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          </div>
          
          <p>Please log in to the employee portal to complete this training module.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl || window.location.origin + '/login'}" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Training
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            If you have any questions, please contact HR at ${data.hrEmail || 'hr@309311restaurants.com'} or ${data.hrPhone || '(918) 555-0123'}.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            © 2025 ${this.fromName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  generateTrainingOverdueHTML(data) {
    const daysOverdue = Math.ceil((new Date() - new Date(data.dueDate)) / (1000 * 60 * 60 * 24))
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Training Overdue</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 Training Overdue</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${this.fromName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #fef2f2;">
          <p>Dear ${data.employeeName},</p>
          
          <p><strong>Important:</strong> Your required training is now overdue and requires immediate attention:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin-top: 0;">${data.trainingTitle}</h3>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
            <p><strong>Priority:</strong> <span style="color: #dc2626; font-weight: bold;">HIGH</span></p>
            ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          </div>
          
          <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Action Required:</strong> Please complete this training immediately to maintain compliance.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl || window.location.origin + '/login'}" 
               style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Training Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            This is an automated reminder. If you have completed this training, please ensure it's properly marked as complete in the system.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  generateAnniversaryHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Work Anniversary Celebration</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${this.fromName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; background: #fffbeb;">
          <p>Dear ${data.employeeName},</p>
          
          <p>Today marks a special milestone in your journey with us!</p>
          
          <div style="background: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
            <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 28px;">🎊 ${data.milestone}</h2>
            <p style="color: #92400e; font-size: 16px; margin: 0;">of dedicated service</p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #78716c;">
              Since ${new Date(data.hireDate).toLocaleDateString()}
            </p>
          </div>
          
          <p>Your dedication, hard work, and commitment to excellence have not gone unnoticed. You are a valued member of our team, and we're grateful for everything you bring to ${this.fromName}.</p>
          
          <p>Thank you for being an integral part of our success. Here's to many more years of growth and achievement together!</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              🏆 Achievement unlocked: ${data.milestone} milestone!
            </p>
          </div>
          
          <p style="margin-top: 30px;">
            Congratulations once again, and thank you for your continued dedication!
          </p>
          
          <p style="font-weight: bold; margin-top: 30px;">
            Best regards,<br>
            The Management Team<br>
            ${this.fromName}
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  generateOnboardingReminderHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Onboarding</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to the Team! 👋</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${this.fromName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p>Dear ${data.employeeName},</p>
          
          <p>Welcome to ${this.fromName}! We're excited to have you on our team.</p>
          
          <p>To help you get started, please complete the following onboarding requirements:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">Incomplete Items:</h3>
            <ul style="color: #475569; line-height: 1.6;">
              ${data.incompleteItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <p>Completing these items will ensure you have all the information and resources you need to succeed in your new role.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl || window.location.origin + '/login'}" 
               style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Onboarding
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            If you need assistance or have any questions, please don't hesitate to contact HR at ${data.hrEmail || 'hr@309311restaurants.com'} or ${data.hrPhone || '(918) 555-0123'}.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  generateDailySummaryHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily HR Summary</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📊 Daily HR Summary</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p>Daily summary for ${this.fromName}:</p>
          
          <div style="display: grid; gap: 15px; margin: 30px 0;">
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <h4 style="margin: 0 0 5px 0; color: #dc2626;">Overdue Training</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626;">${data.totalOverdue}</p>
            </div>
            
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0 0 5px 0; color: #d97706;">Upcoming Anniversaries</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #d97706;">${data.upcomingAnniversaries}</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 5px 0; color: #2563eb;">Training Due Soon</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">${data.trainingDueSoon}</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <h4 style="margin: 0 0 5px 0; color: #16a34a;">Active Employees</h4>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a;">${data.activeEmployees}</p>
            </div>
          </div>
          
          ${data.alerts && data.alerts.length > 0 ? `
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626;">Attention Required:</h4>
            <ul style="margin: 0; color: #991b1b;">
              ${data.alerts.map(alert => `<li>${alert}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            This summary is generated automatically. For detailed reports, please access the admin dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  // Text versions for email clients that don't support HTML
  generateTrainingReminderText(data) {
    return `
Training Reminder - ${this.fromName}

Dear ${data.employeeName},

This is a friendly reminder about your upcoming training:

Training: ${data.trainingTitle}
Due Date: ${data.dueDate}
Priority: ${data.priority || 'Medium'}

Please log in to the employee portal to complete this training module.

Portal: ${data.portalUrl || window.location.origin + '/login'}

If you have questions, contact HR at ${data.hrEmail || 'hr@309311restaurants.com'}

© 2025 ${this.fromName}
    `.trim()
  }

  generateTrainingOverdueText(data) {
    const daysOverdue = Math.ceil((new Date() - new Date(data.dueDate)) / (1000 * 60 * 60 * 24))
    
    return `
🚨 TRAINING OVERDUE - ${this.fromName}

Dear ${data.employeeName},

IMPORTANT: Your required training is now overdue and requires immediate attention:

Training: ${data.trainingTitle}
Due Date: ${data.dueDate}
Days Overdue: ${daysOverdue}
Priority: HIGH

ACTION REQUIRED: Please complete this training immediately to maintain compliance.

Portal: ${data.portalUrl || window.location.origin + '/login'}

This is an automated reminder. If you have completed this training, please ensure it's properly marked as complete in the system.
    `.trim()
  }

  generateAnniversaryText(data) {
    return `
🎉 CONGRATULATIONS! - ${this.fromName}

Dear ${data.employeeName},

Today marks a special milestone in your journey with us!

🎊 ${data.milestone} of dedicated service!
Since: ${new Date(data.hireDate).toLocaleDateString()}

Your dedication, hard work, and commitment to excellence have not gone unnoticed. You are a valued member of our team, and we're grateful for everything you bring to ${this.fromName}.

Thank you for being an integral part of our success. Here's to many more years of growth and achievement together!

🏆 Achievement unlocked: ${data.milestone} milestone!

Best regards,
The Management Team
${this.fromName}
    `.trim()
  }

  generateOnboardingReminderText(data) {
    return `
Welcome to the Team! - ${this.fromName}

Dear ${data.employeeName},

Welcome to ${this.fromName}! We're excited to have you on our team.

To help you get started, please complete the following onboarding requirements:

${data.incompleteItems.map(item => `• ${item}`).join('\n')}

Completing these items will ensure you have all the information and resources you need to succeed.

Portal: ${data.portalUrl || window.location.origin + '/login'}

If you need assistance, contact HR at ${data.hrEmail || 'hr@309311restaurants.com'}
    `.trim()
  }

  generateDailySummaryText(data) {
    return `
Daily HR Summary - ${new Date().toLocaleDateString()}
${this.fromName}

Daily summary:

• Overdue Training: ${data.totalOverdue}
• Upcoming Anniversaries: ${data.upcomingAnniversaries}  
• Training Due Soon: ${data.trainingDueSoon}
• Active Employees: ${data.activeEmployees}

${data.alerts && data.alerts.length > 0 ? `
Attention Required:
${data.alerts.map(alert => `• ${alert}`).join('\n')}
` : ''}

This summary is generated automatically. For detailed reports, please access the admin dashboard.
    `.trim()
  }

  // Utility functions
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  // Get email statistics
  getEmailStats() {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recent24h = this.sentEmails.filter(email => new Date(email.sentAt) > last24Hours)
    const recent7d = this.sentEmails.filter(email => new Date(email.sentAt) > last7Days)
    const recent30d = this.sentEmails.filter(email => new Date(email.sentAt) > last30Days)

    const stats = {
      total: this.sentEmails.length,
      last24Hours: recent24h.length,
      last7Days: recent7d.length,
      last30Days: recent30d.length,
      successRate: this.sentEmails.filter(e => e.success).length / Math.max(this.sentEmails.length, 1),
      byType: {},
      failed: this.sentEmails.filter(e => !e.success).length
    }

    // Count by type
    for (const email of recent30d) {
      stats.byType[email.type] = (stats.byType[email.type] || 0) + 1
    }

    return stats
  }

  // Get sent emails with filtering
  getSentEmails(options = {}) {
    let emails = [...this.sentEmails]

    // Filter by date range
    if (options.startDate) {
      emails = emails.filter(email => new Date(email.sentAt) >= new Date(options.startDate))
    }
    if (options.endDate) {
      emails = emails.filter(email => new Date(email.sentAt) <= new Date(options.endDate))
    }

    // Filter by type
    if (options.type) {
      emails = emails.filter(email => email.type === options.type)
    }

    // Filter by success status
    if (options.success !== undefined) {
      emails = emails.filter(email => email.success === options.success)
    }

    // Sort by date (newest first)
    emails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

    // Limit results
    if (options.limit) {
      emails = emails.slice(0, options.limit)
    }

    return emails
  }

  // Clear old emails (for maintenance)
  clearOldEmails(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    const emailsToKeep = this.sentEmails.filter(email => new Date(email.sentAt) > cutoffDate)
    
    const removed = this.sentEmails.length - emailsToKeep.length
    this.sentEmails = emailsToKeep
    localStorage.setItem('sentEmails', JSON.stringify(this.sentEmails))
    
    return removed
  }
}

// Create singleton instance
const emailService = new EmailService()

export default emailService
export { EmailService }
