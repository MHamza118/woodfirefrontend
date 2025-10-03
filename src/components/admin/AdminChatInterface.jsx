import { useState, useEffect, useRef, useMemo } from 'react'
import { Send, MessageSquare, Users, User, Search, Filter, X, Plus, Settings, ArrowLeft, Home, FileText, Shield, UserCircle, Activity, Paperclip, Image, Download, Eye } from 'lucide-react'
import { 
  getConversationsForUser, 
  sendGroupMessage, 
  sendPrivateMessage, 
  getConversationMessages, 
  markMessagesAsRead,
  getAllGroups,
  createGroup,
  addEmployeesToGroup
} from '../../services/groupManagementService'
import adminApiService from '../../services/adminApiService'
import { useAuth } from '../../contexts/AuthContext'

// Lightweight debounce hook for inputs
const useDebounce = (value, delay = 200) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

const AdminChatInterface = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('chat')
  const [employees, setEmployees] = useState([])
  const [groups, setGroups] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [selectedMessages, setSelectedMessages] = useState([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 200)
  const [showPrivateChat, setShowPrivateChat] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const messagesContainerRef = useRef(null)
  const pollTimerRef = useRef(null)
  const markReadTimerRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedConversation) return

    // Initial load for the selected conversation
    loadMessages(selectedConversation)

    // Immediately mark as read when opening (if we have a real conversation ID)
    if (typeof selectedConversation.id === 'number') {
      markMessagesAsRead(selectedConversation.id, 'admin', selectedConversation.type === 'group', true)
        .then(() => {
          setHasUnreadMessages(false)
          refreshConversations()
        })
        .catch(() => {})
    }

    // Start lightweight polling to keep messages fresh (frequent)
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
    }
    pollTimerRef.current = setInterval(() => {
      loadMessages(selectedConversation, /*silent*/ true)
    }, 2000) // Refresh messages every 2 seconds for better UX

    // Start separate timer for marking as read (less frequent)
    if (markReadTimerRef.current) {
      clearInterval(markReadTimerRef.current)
    }
    markReadTimerRef.current = setInterval(() => {
      if (hasUnreadMessages && typeof selectedConversation.id === 'number') {
        markMessagesAsRead(selectedConversation.id, 'admin', selectedConversation.type === 'group', true)
          .then(() => {
            setHasUnreadMessages(false)
            refreshConversations() // Update unread counts immediately
          })
          .catch(() => {})
      }
    }, 10000) // Mark as read every 10 seconds

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (markReadTimerRef.current) {
        clearInterval(markReadTimerRef.current)
        markReadTimerRef.current = null
      }
    }
  }, [selectedConversation, hasUnreadMessages])

  // Removed auto-scroll useEffect - messages will now grow upward naturally

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (markReadTimerRef.current) {
        clearInterval(markReadTimerRef.current)
        markReadTimerRef.current = null
      }
    }
  }, [])

  const loadData = async () => {
    try {
      // Load employees from API
      const employeesResponse = await adminApiService.getEmployees()
      
      if (employeesResponse.success) {
        // Check if we have employees array
        if (employeesResponse.employees && Array.isArray(employeesResponse.employees)) {
          // Filter for active employees - check different possible status values
          const activeEmployees = employeesResponse.employees.filter(emp => {
            return emp.status === 'ACTIVE' || emp.status === 'active' || emp.status === 'APPROVED' || emp.status === 'approved'
          })
          // Employees loaded successfully
          setEmployees(activeEmployees)
        } else {
          // No employees array in response
          setEmployees([])
        }
      } else {
        // Failed to load employees
        setEmployees([])
      }
      
      // Load groups from API
      const groupsData = await getAllGroups()
      setGroups(groupsData)
      
      // Load conversations from API
      const conversationsData = await getConversationsForUser('admin', true)
      setConversations(conversationsData)
    } catch (error) {
      // Error loading data
      setEmployees([])
      setGroups([])
      setConversations([])
    }
  }

  // Compare two message arrays efficiently to avoid unnecessary state updates
  const haveMessagesChanged = (prev, next) => {
    if (!Array.isArray(prev) || !Array.isArray(next)) return true
    if (prev.length !== next.length) return true
    if (prev.length === 0) return false
    const p = prev[prev.length - 1]
    const n = next[next.length - 1]
    return (String(p.id) !== String(n.id)) || (String(p.timestamp) !== String(n.timestamp))
  }

  const loadMessages = async (conversationArg, silent = false) => {
    const conv = conversationArg || selectedConversation
    if (!conv) return

    try {
      if (!silent) setIsMessagesLoading(true)
      const messages = await getConversationMessages(conv.id, true)

      // Parse and deduplicate messages by ID
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
      const hasNewMessages = haveMessagesChanged(selectedMessages, uniqueMessages)
      
      setSelectedMessages(prev => hasNewMessages ? uniqueMessages : prev)
      
      // Set unread flag if we detected new messages from non-admin users
      if (hasNewMessages && uniqueMessages.length > 0) {
        const latestMessage = uniqueMessages[uniqueMessages.length - 1]
        if (latestMessage.senderRole !== 'Admin') {
          setHasUnreadMessages(true)
        }
        // Scroll to bottom when new messages arrive
        setTimeout(() => scrollToBottom(), 100)
      }
    } catch (error) {
      // Error loading messages
      if (!silent) setSelectedMessages([])
    } finally {
      if (!silent) setIsMessagesLoading(false)
    }
  }

  const scrollToBottom = () => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedMessages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [selectedMessages])

  // Helper: try to resolve a placeholder employee conversation to a real one
  const resolveConversation = (conversation) => {
    if (conversation && typeof conversation.id === 'string' && conversation.id.startsWith('employee_')) {
      const employeeId = String(conversation.id).replace('employee_', '')
      const real = conversations.find(conv => {
        if (conv.type !== 'private') return false
        if (Array.isArray(conv.members) && conv.members.some(m => String(m) === String(employeeId))) return true
        if (Array.isArray(conv.participants) && conv.participants.some(p => String(p.participant_id) === String(employeeId))) return true
        if (Array.isArray(conv.participant_ids) && conv.participant_ids.some(id => String(id) === String(employeeId))) return true
        if (conv.recipient_id && String(conv.recipient_id) === String(employeeId)) return true
        if (conv.employee_id && String(conv.employee_id) === String(employeeId)) return true
        if (conv.user_id && String(conv.user_id) === String(employeeId)) return true
        return false
      })
      return real || conversation
    }
    return conversation
  }

  const refreshConversations = async () => {
    try {
      const data = await getConversationsForUser('admin', true)
      setConversations(data)
      return data
    } catch (e) {
      return conversations
    }
  }

  const handleConversationSelect = async (conversation) => {
    const resolved = resolveConversation(conversation)
    
    // INSTANT: Set conversation and show chat interface immediately for perceived speed
    setSelectedConversation(resolved)
    
    // INSTANT: Show appropriate chat interface without waiting
    if (resolved.type === 'group') {
      setShowGroupChat(true)
      setShowPrivateChat(false)
    } else {
      setShowPrivateChat(true)
      setShowGroupChat(false)
    }
    
    // ASYNC: Load messages in background (user sees loading state)
    loadMessages(resolved).then(() => {
      // Mark as read is now handled automatically in useEffect
      loadData().catch(() => {/* Error refreshing data */})
    })
  }

  const handleSendMessage = async (messageData) => {
    const content = typeof messageData === 'string' ? messageData : messageData.content
    if (!content.trim() || !selectedConversation) return
    
    try {
      // Reset unread flag since admin is sending a message
      setHasUnreadMessages(false)
      
      // Optimistic UI update for smooth feel
      const optimistic = {
        id: `temp_${Date.now()}`,
        senderId: 'admin',
        senderName: 'Management',
        senderRole: 'Admin',
        content: typeof messageData === 'string' ? messageData : messageData.content,
        textContent: typeof messageData === 'string' ? messageData : messageData.textContent,
        attachments: typeof messageData === 'object' ? (messageData.attachments || []) : [],
        hasAttachments: typeof messageData === 'object' ? !!messageData.hasAttachments : false,
        timestamp: new Date().toISOString()
      }
      setSelectedMessages(prev => [...prev, optimistic])

      // Pass the message data directly to the API service
      if (selectedConversation.type === 'group') {
        await sendGroupMessage(selectedConversation.id, 'admin', 'Management', 'Admin', messageData)
      } else {
        // For employee conversations, use the participantId (from employee data) or extract from string ID
        const recipientId = selectedConversation.participantId || 
          (typeof selectedConversation.id === 'string' ? selectedConversation.id.replace('employee_', '') : selectedConversation.id)
        await sendPrivateMessage('admin', 'Management', 'Admin', recipientId, messageData)
      }
      
      // Immediately refresh conversations and messages
      await Promise.all([
        refreshConversations(),
        loadMessages(selectedConversation, true)
      ])
      
      // Scroll to bottom after sending message
      setTimeout(() => scrollToBottom(), 100)
      
      // If we started from a placeholder employee conversation, try to resolve to real ID now
      if (typeof selectedConversation.id === 'string' && selectedConversation.id.startsWith('employee_')) {
        const resolved = resolveConversation(selectedConversation)
        setSelectedConversation(resolved)
      }
    } catch (error) {
      // Error sending message
      alert('Failed to send message. Please try again.')
    }
  }

  const handleBackToList = () => {
    // Clear all timers when leaving chat
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (markReadTimerRef.current) {
      clearInterval(markReadTimerRef.current)
      markReadTimerRef.current = null
    }
    
    setShowPrivateChat(false)
    setShowGroupChat(false)
    setSelectedConversation(null)
    setSelectedMessages([])
    setHasUnreadMessages(false)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }


  const conversationHasUnread = (conversation) => {
    // The API now returns unreadCount directly in the conversation object
    return conversation.unreadCount > 0
  }

  // Memoized employee conversations with filters and search
  const memoEmployeeConversations = useMemo(() => {
    let employeeConversations = employees.map(employee => {
      const existingConversation = conversations.find(conv => {
        if (conv.type !== 'private') return false;
        if (conv.members && Array.isArray(conv.members)) {
          if (conv.members.some(m => String(m) === String(employee.id))) return true;
        }
        if (conv.participants && Array.isArray(conv.participants)) {
          if (conv.participants.some(p => String(p.participant_id) === String(employee.id))) return true;
        }
        if (conv.participant_ids && Array.isArray(conv.participant_ids)) {
          if (conv.participant_ids.some(id => String(id) === String(employee.id))) return true;
        }
        if (conv.recipient_id && String(conv.recipient_id) === String(employee.id)) return true;
        if (conv.employee_id && String(conv.employee_id) === String(employee.id)) return true;
        if (conv.user_id && String(conv.user_id) === String(employee.id)) return true;
        return false;
      })

      if (existingConversation) {
        return {
          ...existingConversation,
          employee: employee,
          name: `${employee.first_name || employee.personalInfo?.firstName || 'Employee'} ${employee.last_name || employee.personalInfo?.lastName || ''}`.trim()
        }
      } else {
        return {
          id: `employee_${employee.id}`,
          type: 'private',
          name: `${employee.first_name || employee.personalInfo?.firstName || 'Employee'} ${employee.last_name || employee.personalInfo?.lastName || ''}`.trim(),
          participantId: employee.id,
          employee: employee,
          lastMessage: null,
          unreadCount: 0,
          createdAt: employee.created_at || new Date().toISOString()
        }
      }
    })

    if ((debouncedSearchQuery || '').trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      employeeConversations = employeeConversations.filter(conv => 
        (conv.name || '').toLowerCase().includes(query)
      )
    }

    if (filterType === 'unread') {
      employeeConversations = employeeConversations.filter(conv => conversationHasUnread(conv))
    }

    return employeeConversations
  }, [employees, conversations, debouncedSearchQuery, filterType])

  const getFilteredEmployees = () => {
    return memoEmployeeConversations
  }

  // Memoized groups list with filters
  const memoGroupConversations = useMemo(() => {
    let groupConversations = conversations.filter(conv => conv.type === 'group')
    if (filterType === 'unread') {
      groupConversations = groupConversations.filter(conv => conversationHasUnread(conv))
    }
    return groupConversations
  }, [conversations, filterType])

  const getFilteredGroups = () => {
    return memoGroupConversations
  }

  const getLastMessage = (conversation) => {
    // The API now returns lastMessage directly in the conversation object
    return conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'
  }

  const getLastMessageTime = (conversation) => {
    // The API now returns lastMessage directly in the conversation object
    return conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''
  }

  // If showing private chat interface
  if (showPrivateChat && selectedConversation) {
    return (
      <div className="bg-white rounded-lg shadow-md w-full h-[70vh] grid grid-rows-[auto,1fr,auto]">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBackToList} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h2>
              <p className="text-sm text-gray-600">Private Chat</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="overflow-y-auto p-4 min-h-0">
          {isMessagesLoading && selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center animate-pulse">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Loading messages...</p>
              </div>
            </div>
          ) : selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {selectedMessages.map((message) => (
                <div key={message.id} className={`flex ${message.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-lg ${message.senderId === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {message.senderId !== 'admin' && (
                      <div className="text-xs font-medium mb-1">{message.senderName}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.attachments && message.attachments.length > 0 ? (
                        <div>
                          {message.textContent && <div className="mb-1">{message.textContent}</div>}
                          <div className="flex flex-wrap gap-1">
                            {message.attachments.map((attachment, index) => (
                              <AdminFileAttachment key={index} attachment={attachment} />
                            ))}
                          </div>
                        </div>
                      ) : message.content.includes('📷 Image:') || message.content.includes('📄 Document:') ? (
                        <AdminLegacyFileMessage content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200">
          <MessageInput onSend={handleSendMessage} isMobile={false} />
        </div>
      </div>
    )
  }

  // If showing group chat interface
  if (showGroupChat && selectedConversation) {
    return (
      <div className="bg-white rounded-lg shadow-md w-full h-[70vh] grid grid-rows-[auto,1fr,auto]">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBackToList} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h2>
              <p className="text-sm text-gray-600">Group Chat</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="overflow-y-auto p-4 min-h-0">
          {isMessagesLoading && selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center animate-pulse">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Loading messages...</p>
              </div>
            </div>
          ) : selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {selectedMessages.map((message) => (
                <div key={message.id} className={`flex ${message.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-lg ${message.senderId === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {message.senderId !== 'admin' && (
                      <div className="text-xs font-medium mb-1">{message.senderName}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.attachments && message.attachments.length > 0 ? (
                        <div>
                          {message.textContent && <div className="mb-1">{message.textContent}</div>}
                          <div className="flex flex-wrap gap-1">
                            {message.attachments.map((attachment, index) => (
                              <AdminFileAttachment key={index} attachment={attachment} />
                            ))}
                          </div>
                        </div>
                      ) : message.content.includes('📷 Image:') || message.content.includes('📄 Document:') ? (
                        <AdminLegacyFileMessage content={message.content} />
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200">
          <MessageInput onSend={handleSendMessage} isMobile={false} />
        </div>
      </div>
    )
  }

  // Tab definitions
  const tabs = [
    { id: 'feed', name: 'Feed', icon: Home },
    { id: 'assets', name: 'Assets', icon: FileText },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'profile', name: 'Profile', icon: UserCircle },
    { id: 'admin', name: 'Admin', icon: Shield }
  ]

  // Main interface with tab navigation
  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden xs:block bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Admin Communication Center</h1>
            <p className="text-sm md:text-base text-gray-600 hidden sm:block">Manage all communication, assets, and administrative tasks</p>
          </div>
        </div>
      </div>

      {/* Desktop Tab Navigation - Hidden on mobile */}
      <div className="hidden xs:block bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  // Reset chat states when switching tabs
                  if (tab.id !== 'chat') {
                    setShowPrivateChat(false)
                    setShowGroupChat(false)
                    setSelectedConversation(null)
                  }
                }}
                className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-center text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-xs">{tab.name.slice(0, 3)}</span>
              </button>
            )
          })}
        </div>

        {/* Desktop Tab Content */}
        <div className="w-full">
          {activeTab === 'feed' && <FeedTab />}
          {activeTab === 'assets' && <AssetsTab />}
          {activeTab === 'chat' && (
            <ChatTab 
              employees={employees}
              groups={groups}
              filterType={filterType}
              setFilterType={setFilterType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleConversationSelect={handleConversationSelect}
              getLastMessage={getLastMessage}
              getLastMessageTime={getLastMessageTime}
              getFilteredEmployees={getFilteredEmployees}
              getFilteredGroups={getFilteredGroups}
              setShowGroupModal={setShowGroupModal}
            />
          )}
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'admin' && <AdminTab />}
        </div>
      </div>

      {/* Mobile Interface - Visible only on mobile (below 480px) */}
      <div className="block xs:hidden">
        <MobileCommunicationInterface 
          employees={employees}
          groups={groups}
          filterType={filterType}
          setFilterType={setFilterType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleConversationSelect={handleConversationSelect}
          getLastMessage={getLastMessage}
          getLastMessageTime={getLastMessageTime}
          getFilteredEmployees={getFilteredEmployees}
          getFilteredGroups={getFilteredGroups}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowPrivateChat={setShowPrivateChat}
          setShowGroupChat={setShowGroupChat}
          setSelectedConversation={setSelectedConversation}
          setShowGroupModal={setShowGroupModal}
        />
      </div>

      {/* Group Management Modal */}
      {showGroupModal && (
        <GroupManagementModal
          employees={employees}
          onClose={() => setShowGroupModal(false)}
          onCreateGroup={async (groupName, selectedEmployees) => {
            try {
              await createGroup(groupName, 'admin', selectedEmployees)
              await loadData()
              setShowGroupModal(false)
            } catch (error) {
              // Error creating group
              alert('Failed to create group. Please try again.')
            }
          }}
        />
      )}
    </div>
  )
}

const MessageInput = ({ onSend, isMobile = false }) => {
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
    <div className="border-t border-gray-200 p-3 sm:p-4 w-full flex-shrink-0 bg-white">
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
      <div className="flex items-center gap-2 sm:gap-3 w-full">
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
          className="flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300 hover:border-blue-300 flex-shrink-0 w-10 h-10"
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() && attachedFiles.length === 0}
          className="flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 w-10 h-10"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  )
}

// Tab Components
const FeedTab = () => {
  return (
    <div className="p-6">
      {/* Empty - ready for future implementation */}
    </div>
  )
}

const AssetsTab = () => {
  return (
    <div className="p-6">
      {/* Empty - ready for future implementation */}
    </div>
  )
}

const ChatTab = ({ 
  employees, 
  groups, 
  filterType, 
  setFilterType, 
  searchQuery, 
  setSearchQuery, 
  handleConversationSelect, 
  getLastMessage, 
  getLastMessageTime, 
  getFilteredEmployees, 
  getFilteredGroups, 
  setShowGroupModal 
}) => {
  return (
    <div className="p-4 md:p-6">
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">Team Communication</h2>
          <p className="text-gray-600 text-xs md:text-sm hidden sm:block">Communicate with employees through private messages or group chats</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors ${
                filterType === 'all' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ALL
            </button>
            <span className="text-gray-400 mx-1">|</span>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors ${
                filterType === 'unread' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread
            </button>
            <span className="text-gray-400 mx-1">|</span>
            <button
              onClick={() => setFilterType('teams')}
              className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors ${
                filterType === 'teams' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Teams
            </button>
          </div>
        </div>
      </div>

      {/* Chat Content - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Left Container - Employees Private Chat */}
        {filterType !== 'teams' && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col w-full md:mb-4 lg:mb-0 min-h-[60vh] md:min-h-[65vh] lg:min-h-[60vh]">
            {/* Header */}
            <div className="bg-blue-50 border-b border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="hidden sm:inline">Employees Private Chat</span>
                  <span className="sm:hidden">Private Chat</span>
                </h3>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 bg-white">
              <div className="space-y-2">
                {getFilteredEmployees().map((conversation) => {
                  const isUnread = conversation.unreadCount > 0
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-2 md:p-3 rounded-lg cursor-pointer border transition-colors ${
                        isUnread 
                          ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            {isUnread && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm md:text-base font-medium truncate ${
                              isUnread ? 'text-gray-900' : 'text-gray-800'
                            }`}>
                              {conversation.name}
                            </div>
                            <div className={`text-xs md:text-sm truncate ${
                              isUnread ? 'text-gray-600 font-medium' : 'text-gray-500'
                            }`}>
                              {getLastMessage(conversation)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {getLastMessageTime(conversation)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {getFilteredEmployees().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">
                      {filterType === 'unread' ? 'No unread messages' : 'No employees found'}
                    </p>
                    <p className="text-sm">
                      {filterType === 'unread' ? 'All conversations are up to date' : 'Try adjusting your search query'}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Right Container - Group chat with Employees */}
        {filterType !== 'teams' ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col w-full min-h-[60vh] md:min-h-[65vh] lg:min-h-[60vh]">
            {/* Header */}
            <div className="bg-green-50 border-b border-gray-200 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  <span className="hidden sm:inline">Group chat with Employees</span>
                  <span className="sm:hidden">Groups</span>
                </h3>
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Create Group</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 bg-white">
              <div className="space-y-2">
                {getFilteredGroups().map((conversation) => {
                  const isUnread = conversation.unreadCount > 0
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-2 md:p-3 rounded-lg cursor-pointer border transition-colors ${
                        isUnread 
                          ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            </div>
                            {isUnread && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm md:text-base font-medium truncate ${
                              isUnread ? 'text-gray-900' : 'text-gray-800'
                            }`}>{conversation.name}</div>
                            <div className={`text-xs md:text-sm truncate ${
                              isUnread ? 'text-gray-600 font-medium' : 'text-gray-500'
                            }`}>
                              {getLastMessage(conversation)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {getLastMessageTime(conversation)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {getFilteredGroups().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">
                      {filterType === 'unread' ? 'No unread group messages' : 'No groups created'}
                    </p>
                    <p className="text-sm">
                      {filterType === 'unread' ? 'All group conversations are up to date' : 'Create your first group to get started'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Teams filter - Show only groups in full width
          <div className="lg:col-span-2 bg-gray-50 rounded-lg border border-gray-200 flex flex-col w-full min-h-[60vh] md:min-h-[65vh] lg:min-h-[60vh]">
            {/* Header */}
            <div className="bg-green-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Team Groups
                </h3>
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              </div>
            </div>

            {/* Groups List - Full Width */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {getFilteredGroups().map((conversation) => {
                  const isUnread = conversation.unreadCount > 0
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 rounded-lg cursor-pointer border transition-colors ${
                        isUnread 
                          ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium mb-1 ${
                            isUnread ? 'text-gray-900' : 'text-gray-800'
                          }`}>{conversation.name}</div>
                          <div className={`text-sm mb-2 ${
                            isUnread ? 'text-gray-600 font-medium' : 'text-gray-500'
                          }`}>
                            {conversation.members?.length || 0} members
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {getLastMessage(conversation)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {getLastMessageTime(conversation)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {getFilteredGroups().length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-lg mb-2">
                      {filterType === 'unread' ? 'No unread group messages' : 'No groups created'}
                    </p>
                    <p className="text-sm">
                      {filterType === 'unread' ? 'All group conversations are up to date' : 'Create your first group to get started'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ProfileTab = ({ user }) => {
  return (
    <div className="p-6">
      {/* Empty - ready for future implementation */}
    </div>
  )
}

const AdminTab = () => {
  return (
    <div className="p-6">
      {/* Empty - ready for future implementation */}
    </div>
  )
}

const GroupManagementModal = ({ employees, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedEmployees.length === 0) {
      alert('Please enter a group name and select at least one employee')
      return
    }
    await onCreateGroup(groupName, selectedEmployees)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employees</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-800">
                      {employee.first_name || employee.personalInfo?.firstName || 'Employee'} {employee.last_name || employee.personalInfo?.lastName || ''}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedEmployees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  )
}

// Mobile Communication Interface Component
const MobileCommunicationInterface = ({ 
  employees, 
  groups, 
  filterType, 
  setFilterType, 
  searchQuery, 
  setSearchQuery, 
  handleConversationSelect, 
  getLastMessage, 
  getLastMessageTime, 
  getFilteredEmployees, 
  getFilteredGroups,
  tabs,
  activeTab,
  setActiveTab,
  setShowPrivateChat,
  setShowGroupChat,
  setSelectedConversation,
  setShowGroupModal
}) => {
  // Combine conversations into a single list with display properties
  const getCombinedConversations = () => {
    const privateConversations = getFilteredEmployees().map(conversation => ({
      ...conversation,
      isEmployee: true,
      hasUnread: conversation.unreadCount > 0
    }))

    const groupConversations = getFilteredGroups().map(conversation => ({
      ...conversation,
      isEmployee: false,
      hasUnread: conversation.unreadCount > 0
    }))

    return [...privateConversations, ...groupConversations].sort((a, b) => {
      // Sort by unread status first, then by last message time
      if (a.hasUnread && !b.hasUnread) return -1
      if (!a.hasUnread && b.hasUnread) return 1
      
      // Sort by last message time
      const aTime = a.lastMessage?.timestamp || 0
      const bTime = b.lastMessage?.timestamp || 0
      return new Date(bTime) - new Date(aTime)
    })
  }

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 z-10 flex flex-col bg-white" style={{marginTop: '80px'}}>
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Conversations</h1>
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gold-gradient text-charcoal rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Group</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Employees or groups"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex w-full gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                filterType === 'unread' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterType('teams')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                filterType === 'teams' ? 'bg-gold text-charcoal shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Teams
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {getCombinedConversations().map((conversation) => (
          <div
            key={`${conversation.type}-${conversation.id}`}
            onClick={() => {
              // Pass the full conversation object to maintain all properties
              handleConversationSelect(conversation)
            }}
            className={`p-4 border-b border-gray-100 active:bg-gray-50 ${
              conversation.hasUnread ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {conversation.isEmployee ? (
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                  <h3 className={`font-medium text-gray-900 truncate ${
                    conversation.hasUnread ? 'font-semibold' : ''
                  }`}>
                    {conversation.name}
                  </h3>
                  {conversation.hasUnread && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                <p className={`text-sm text-gray-500 truncate ${
                  conversation.hasUnread ? 'font-medium text-gray-700' : ''
                }`}>
                  {getLastMessage(conversation)}
                </p>
              </div>
              <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                {getLastMessageTime(conversation)}
              </div>
            </div>
          </div>
        ))}
        
        {getCombinedConversations().length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">
              {filterType === 'unread' ? 'No unread messages' : 'No conversations found'}
            </p>
            <p className="text-sm">
              {filterType === 'unread' ? 'All conversations are up to date' : 'Try adjusting your search or filter'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  // Reset chat states when switching tabs
                  if (tab.id !== 'chat') {
                    setShowPrivateChat(false)
                    setShowGroupChat(false)
                    setSelectedConversation(null)
                  }
                }}
                className={`flex-1 px-2 py-2.5 text-center font-medium transition-colors flex flex-col items-center gap-1 ${
                  activeTab === tab.id
                    ? 'text-gold bg-gold/10'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Component for handling file attachments with view and download functionality (Admin version)
const AdminFileAttachment = ({ attachment }) => {
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
    <div className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs max-w-48">
      {isImage ? (
        <img 
          src={attachment.data} 
          alt={attachment.name}
          className="w-4 h-4 object-cover rounded cursor-pointer hover:opacity-80"
          onClick={() => setShowImageModal(true)}
        />
      ) : (
        <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
      )}
      <span className="truncate text-gray-700 font-medium" title={attachment.name}>
        {attachment.name.length > 15 ? attachment.name.substring(0, 15) + '...' : attachment.name}
      </span>
      {isImage && (
        <button
          onClick={() => setShowImageModal(true)}
          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
          title="View"
        >
          View
        </button>
      )}
      <button
        onClick={handleDownload}
        className="text-blue-600 hover:text-blue-800 flex-shrink-0"
        title="Download"
      >
        <Download className="w-3 h-3" />
      </button>
      
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

// Component for handling legacy file messages (Admin version)
const AdminLegacyFileMessage = ({ content }) => {
  const isImage = content.includes('📷 Image:')
  const fileName = content.split(': ')[1] || 'Unknown file'
  
  return (
    <div className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded text-xs">
      {isImage ? (
        <Image className="w-3 h-3 text-blue-600" />
      ) : (
        <FileText className="w-3 h-3 text-green-600" />
      )}
      <span className="text-gray-700">{fileName}</span>
      <span className="text-gray-400">(Legacy)</span>
    </div>
  )
}

export default AdminChatInterface
