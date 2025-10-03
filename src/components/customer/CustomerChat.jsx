import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, X, Paperclip, File, Image, FileText, Download, Minimize2, Maximize2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const CustomerChat = ({ isOpen, onToggle }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadMessages()
    }
  }, [isOpen, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = () => {
    if (!user?.id) return
    
    const storedMessages = JSON.parse(localStorage.getItem('customerMessages') || '[]')
    const customerMessages = storedMessages.filter(msg => 
      msg.customerId === user.id || msg.recipientId === user.id
    )
    setMessages(customerMessages)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() && attachments.length === 0) return
    if (!user?.id) return

    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customerId: user.id,
      customerName: user.name,
      senderId: user.id,
      senderName: user.name,
      senderRole: 'Customer',
      recipientId: 'admin',
      type: 'customer_to_admin',
      content: newMessage.trim(),
      attachments: attachments,
      timestamp: new Date().toISOString(),
      read: false
    }

    // Save to customer messages
    const allCustomerMessages = JSON.parse(localStorage.getItem('customerMessages') || '[]')
    allCustomerMessages.push(message)
    localStorage.setItem('customerMessages', JSON.stringify(allCustomerMessages))

    // Also save to employee messages for admin to see
    const allEmployeeMessages = JSON.parse(localStorage.getItem('employeeMessages') || '[]')
    allEmployeeMessages.push({
      ...message,
      type: 'customer_inquiry'
    })
    localStorage.setItem('employeeMessages', JSON.stringify(allEmployeeMessages))

    // Create admin notification
    const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
    const notification = {
      id: Date.now().toString() + '_customer_msg',
      type: 'CUSTOMER_MESSAGE',
      title: 'New Customer Message',
      message: `${user.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      timestamp: message.timestamp,
      read: false,
      customerId: user.id,
      customerName: user.name
    }
    adminNotifications.unshift(notification)
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications))

    setNewMessage('')
    setAttachments([])
    loadMessages()

    // Simulate typing indicator for admin response
    setTimeout(() => setIsTyping(true), 1000)
    setTimeout(() => {
      setIsTyping(false)
      // Simulate auto-response
      const autoResponse = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        customerId: user.id,
        customerName: user.name,
        senderId: 'admin',
        senderName: 'Restaurant Support',
        senderRole: 'Support',
        recipientId: user.id,
        type: 'admin_to_customer',
        content: "Thank you for reaching out! We've received your message and our team will get back to you shortly. Our typical response time is 15-30 minutes during business hours.",
        attachments: [],
        timestamp: new Date().toISOString(),
        read: false
      }
      
      const updatedMessages = JSON.parse(localStorage.getItem('customerMessages') || '[]')
      updatedMessages.push(autoResponse)
      localStorage.setItem('customerMessages', JSON.stringify(updatedMessages))
      loadMessages()
    }, 3000)
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    const newAttachments = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      data: URL.createObjectURL(file),
      file: file
    }))
    
    setAttachments(prev => [...prev, ...newAttachments])
    event.target.value = ''
  }

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-3 h-3" />
    if (type.includes('pdf')) return <FileText className="w-3 h-3" />
    return <File className="w-3 h-3" />
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now - date
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60))
      return minutes === 0 ? 'Just now' : `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed bottom-3 xs:bottom-4 right-3 xs:right-4 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 ${
      isMinimized ? 'w-72 xs:w-80 h-16' : 'w-72 xs:w-80 h-80 xs:h-96'
    } transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 xs:p-4 border-b border-gray-200 bg-gradient-to-r from-gold/10 to-gold/5 rounded-t-xl">
        <div className="flex items-center gap-2 xs:gap-3">
          <div className="p-1.5 xs:p-2 bg-gold/20 rounded-lg">
            <MessageSquare className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-charcoal text-xs xs:text-sm">Restaurant Support</h3>
            <p className="text-xs text-gray-600">We're here to help!</p>
          </div>
        </div>
        <div className="flex items-center gap-1 xs:gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> : <Minimize2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 p-3 xs:p-4 max-h-48 xs:max-h-64 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-6 xs:py-8">
                <MessageSquare className="w-6 h-6 xs:w-8 xs:h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs xs:text-sm text-gray-500 mb-2">Start a conversation</p>
                <p className="text-xs text-gray-400">Ask us anything about your order, menu, or dining experience!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm ${
                        message.senderId === user?.id
                          ? 'bg-gold text-charcoal'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        {message.senderId !== user?.id && (
                          <div className="mb-1">
                            <span className="text-xs font-medium text-blue-600">
                              {message.senderName}
                            </span>
                          </div>
                        )}
                        
                        {message.content && <p>{message.content}</p>}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-white/20 rounded text-xs">
                                {getFileIcon(attachment.type)}
                                <span className="truncate">{attachment.name}</span>
                                {attachment.data && (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a')
                                      link.href = attachment.data
                                      link.download = attachment.name
                                      link.click()
                                    }}
                                    className="hover:text-blue-300"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-1 text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">Support is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-2 xs:p-3 border-t border-gray-200">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1 xs:gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-1 bg-gray-100 rounded px-1.5 xs:px-2 py-1 text-xs">
                      {getFileIcon(attachment.type)}
                      <span className="truncate max-w-16 xs:max-w-20">{attachment.name}</span>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-1 xs:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 xs:p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none text-xs xs:text-sm"
                rows={1}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
                className="px-2 xs:px-3 py-1.5 xs:py-2 bg-gold-gradient text-charcoal rounded-lg hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CustomerChat
