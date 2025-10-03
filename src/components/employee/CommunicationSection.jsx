import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Users, ArrowLeft, User, Search, Paperclip, Image, FileText, X, Eye, Download } from 'lucide-react'
import { 
  getConversationsForUser, 
  sendConversationMessage, 
  getConversationMessages, 
  markMessagesAsRead,
  getAllGroups
} from '../../services/groupManagementService'

const CommunicationSection = ({ user, employeeData }) => {
  const [activeView, setActiveView] = useState('list') // 'list', 'chat'
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [selectedMessages, setSelectedMessages] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const markReadTimerRef = useRef(null)
  const messageRefreshTimerRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (!selectedConversation) return

    // Load messages immediately when opening a conversation
    loadMessages()

    // Immediately mark messages as read when opening
    setIsMarkingRead(true)
    markMessagesAsRead(selectedConversation.id, user.id, selectedConversation.type === 'group', false)
      .then(() => {
        setHasUnreadMessages(false)
        loadConversations() // Update unread counts
      })
      .catch(() => {})
      .finally(() => setIsMarkingRead(false))

    // Set up periodic message refresh (more frequent to keep chat fresh)
    messageRefreshTimerRef.current = setInterval(() => {
      loadMessages()
    }, 2000) // Refresh messages every 2 seconds for better UX

    // Set up periodic mark as read (less frequent to avoid rate limits)
    markReadTimerRef.current = setInterval(() => {
      // Only mark as read if there are potentially unread messages
      if (hasUnreadMessages) {
        markMessagesAsRead(selectedConversation.id, user.id, selectedConversation.type === 'group', false)
          .then(() => {
            setHasUnreadMessages(false)
            loadConversations() // Update unread counts immediately
          })
          .catch(() => {})
      }
    }, 10000) // Mark as read every 10 seconds

    return () => {
      if (messageRefreshTimerRef.current) {
        clearInterval(messageRefreshTimerRef.current)
        messageRefreshTimerRef.current = null
      }
      if (markReadTimerRef.current) {
        clearInterval(markReadTimerRef.current)
        markReadTimerRef.current = null
      }
    }
  }, [selectedConversation, hasUnreadMessages])

  // Messages automatically scroll within their container with proper overflow handling

  const loadConversations = async () => {
    try {
      // Pass isAdmin=false for employee interface
      const userConversations = await getConversationsForUser(user.id, false)
      setConversations(userConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
      setConversations([])
    }
  }

  const loadMessages = async () => {
    if (!selectedConversation) return
    
    try {
      // Pass isAdmin=false for employee interface
      const messages = await getConversationMessages(selectedConversation.id, false)
      
      // Parse enhanced messages and deduplicate by ID
      const parsedMessages = messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        content: msg.content,
        textContent: msg.textContent,
        attachments: msg.attachments,
        hasAttachments: msg.hasAttachments,
        timestamp: msg.timestamp
      }))
      
      // Deduplicate messages by ID to prevent duplicates
      const uniqueMessages = parsedMessages.filter((message, index, arr) => 
        arr.findIndex(m => m.id === message.id) === index
      )
      
      // Check if we have new messages
      const hasNewMessages = uniqueMessages.length > selectedMessages.length ||
        (uniqueMessages.length > 0 && selectedMessages.length > 0 && 
         uniqueMessages[uniqueMessages.length - 1].id !== selectedMessages[selectedMessages.length - 1]?.id)
      
      setSelectedMessages(uniqueMessages)
      
      // Set unread flag if we detected new messages from others
      if (hasNewMessages && uniqueMessages.length > 0) {
        const latestMessage = uniqueMessages[uniqueMessages.length - 1]
        if (String(latestMessage.senderId) !== String(user.id)) {
          setHasUnreadMessages(true)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setSelectedMessages([])
    }
  }

  // Removed scrollToBottom - messages scroll naturally within grid container

  const handleSendMessage = async (messageData) => {
    const content = typeof messageData === 'string' ? messageData : messageData.content
    if (!content.trim() || !selectedConversation) return
    
    try {
      // Reset unread flag immediately since we're sending a message
      setHasUnreadMessages(false)
      
      // Use the unified conversation message endpoint for employees
      await sendConversationMessage(selectedConversation.id, messageData, false)
      
      // Reload messages and conversations immediately to update UI
      await Promise.all([
        loadMessages(),
        loadConversations()
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      // You might want to show an error message to the user here
    }
  }

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation)
    setActiveView('chat')
    
    // Mark as read is now handled automatically in useEffect when selectedConversation changes
    // Just refresh conversations list to update unread counts
    try {
      await loadConversations()
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleBackToList = () => {
    // Clear all timers when leaving chat
    if (messageRefreshTimerRef.current) {
      clearInterval(messageRefreshTimerRef.current)
      messageRefreshTimerRef.current = null
    }
    if (markReadTimerRef.current) {
      clearInterval(markReadTimerRef.current)
      markReadTimerRef.current = null
    }
    
    setActiveView('list')
    setSelectedConversation(null)
    setSelectedMessages([])
    setHasUnreadMessages(false)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const conversationHasUnread = (conversation) => {
    return conversation.unreadCount > 0
  }

  const getFilteredConversations = () => {
    let filtered = conversations
    
    if (filterType === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0)
    } else if (filterType === 'groups') {
      filtered = filtered.filter(conv => conv.type === 'group')
    } else if (filterType === 'private') {
      filtered = filtered.filter(conv => conv.type === 'private')
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }

  // If showing chat interface
  if (activeView === 'chat' && selectedConversation) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 h-[600px] grid grid-rows-[auto,1fr,auto]">
        {/* Header */}
        <div className="bg-brand-navy border-b border-gold/20 p-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBackToList} className="p-2 hover:bg-gold/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-cream" />
            </button>
            <div className="flex items-center gap-2">
              {selectedConversation.type === 'group' ? (
                <Users className="w-5 h-5 text-gold" />
              ) : (
                <User className="w-5 h-5 text-gold" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gold">{selectedConversation.name}</h2>
                <p className="text-sm text-cream/80">
                  {selectedConversation.type === 'group' ? 'Group Chat' : 'Private Chat with Management'}
                  {isMarkingRead && <span className="ml-2 text-gold/60">• Marking as read...</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto p-4 min-h-0">
          {selectedMessages.length === 0 && !isMarkingRead ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : selectedMessages.length === 0 && isMarkingRead ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-2"></div>
                <p className="font-medium text-sm">Loading messages...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {selectedMessages.map((message) => {
                const isMyMessage = String(message.senderId) === String(user.id)
                return (
                  <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-lg shadow-sm ${
                      isMyMessage
                        ? 'bg-brand-navy text-cream rounded-br-sm'
                        : 'bg-gold/10 text-charcoal border border-gold/20 rounded-bl-sm'
                    }`}>
                      {!isMyMessage && (
                        <div className={`text-xs font-semibold mb-2 ${
                          message.senderRole === 'Admin' ? 'text-brand-navy' : 'text-gray-600'
                        }`}>
                          {message.senderName} ({message.senderRole})
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {message.attachments && message.attachments.length > 0 ? (
                          <div className="space-y-2">
                            {message.textContent && <div className="mb-3">{message.textContent}</div>}
                            {message.attachments.map((attachment, index) => (
                              <FileAttachment key={index} attachment={attachment} />
                            ))}
                          </div>
                        ) : message.content.includes('📷 Image:') || message.content.includes('📄 Document:') ? (
                          <LegacyFileMessage content={message.content} />
                        ) : (
                          message.content
                        )}
                      </div>
                      <div className={`text-xs opacity-70 mt-1 ${
                        isMyMessage ? 'text-cream/70' : 'text-charcoal/70'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200">
          <EmployeeMessageInput onSend={handleSendMessage} isMobile={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden">
      <div className="bg-brand-navy px-4 py-3 border-b border-gold/20">
        <h3 className="text-lg font-semibold font-display text-gold flex items-center gap-3">
          <div className="p-2 bg-gold/20 backdrop-blur-sm rounded-lg">
            <MessageSquare className="w-5 h-5 text-gold" />
          </div>
          My Conversations
        </h3>
        <p className="text-cream/80 text-sm mt-1">View messages from management and group discussions</p>
      </div>
      <div className="p-6">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'unread' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'groups' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setFilterType('private')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'private' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Private
          </button>
        </div>
        <div className="space-y-3">
          {getFilteredConversations().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">
                {filterType === 'unread' ? 'No unread messages' : 'No conversations found'}
              </p>
              <p className="text-sm">
                {filterType === 'unread' ? 'All conversations are up to date' : 'Try adjusting your search or filter'}
              </p>
            </div>
          ) : (
            getFilteredConversations().map((conversation) => {
              const isUnread = conversationHasUnread(conversation)
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-4 rounded-lg cursor-pointer border transition-colors ${
                    isUnread 
                      ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          conversation.type === 'group' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {conversation.type === 'group' ? (
                            <Users className="w-5 h-5 text-green-600" />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        {isUnread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isUnread ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {conversation.name}
                        </div>
                        <div className={`text-sm truncate max-w-48 ${
                          isUnread ? 'text-gray-600 font-medium' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {conversation.type === 'group' ? 'Group Chat' : 'Private Chat with Management'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const EmployeeMessageInput = ({ onSend, isMobile = false }) => {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleSend = async () => {
    if (!message.trim() && attachedFiles.length === 0) return
    
    if (attachedFiles.length > 0) {
      // Convert files to base64 for storage
      const filePromises = attachedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: e.target.result // base64 data
            })
          }
          reader.readAsDataURL(file)
        })
      })
      
      const processedFiles = await Promise.all(filePromises)
      
      // Send message with file attachments
      onSend({
        content: message.trim() || 'File attachment',
        textContent: message.trim(),
        attachments: processedFiles,
        hasAttachments: true
      })
    } else {
      // Send text message only
      onSend({
        content: message,
        textContent: message,
        attachments: [],
        hasAttachments: false
      })
    }
    
    setMessage('')
    setAttachedFiles([])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      // Allow images and common document types
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ]
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB limit
    })
    
    setAttachedFiles(prev => [...prev, ...validFiles])
    e.target.value = '' // Reset input
  }

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`border-t border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* File Preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              {file.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-blue-600" />
              ) : (
                <FileText className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input Row */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={triggerFileInput}
          className={`flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300 ${
            isMobile ? 'w-9 h-9' : 'w-10 h-10'
          }`}
          title="Attach files"
        >
          <Paperclip className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className={`flex-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isMobile ? 'py-2 h-9 text-sm' : 'py-2.5 h-10'
          }`}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() && attachedFiles.length === 0}
          className={`flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
            isMobile ? 'w-9 h-9' : 'w-10 h-10'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Component for handling file attachments with view and download functionality
const FileAttachment = ({ attachment }) => {
  const [showImageModal, setShowImageModal] = useState(false)
  
  const isImage = attachment.type.startsWith('image/')
  
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.data
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isImage ? (
            <div className="relative">
              <img 
                src={attachment.data} 
                alt={attachment.name}
                className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
          
          <div className="flex items-center gap-2 mt-2">
            {isImage && (
              <button
                onClick={() => setShowImageModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                View
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && isImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img 
              src={attachment.data} 
              alt={attachment.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {attachment.name}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for handling legacy file messages (backward compatibility)
const LegacyFileMessage = ({ content }) => {
  const isImage = content.includes('📷 Image:')
  const fileName = content.split(': ')[1] || 'Unknown file'
  
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
      {isImage ? (
        <Image className="w-4 h-4 text-blue-600" />
      ) : (
        <FileText className="w-4 h-4 text-green-600" />
      )}
      <span className="text-sm text-gray-700">{content}</span>
      <span className="text-xs text-gray-500 ml-2">(Legacy format - no preview available)</span>
    </div>
  )
}

export default CommunicationSection
