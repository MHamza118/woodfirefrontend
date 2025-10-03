const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://woodfire.food/api/v1'

// Helper function to get auth token
const getAuthToken = () => {
  const adminToken = localStorage.getItem('admin_token')
  const employeeToken = localStorage.getItem('employee_token')
  const token = adminToken || employeeToken
  if (!token) {
    console.warn('No authentication token found')
  }
  return token
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const createGroup = async (groupName, adminId, employeeIds = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/communication/conversations/group`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: groupName,
        employee_ids: employeeIds
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create group')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating group:', error)
    throw error
  }
}

export const getAllGroups = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/communication/conversations`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groups API error:', response.status, errorData)
      return []
    }
    
    const result = await response.json()
    if (result.success && result.data) {
      return result.data.filter(conversation => conversation.type === 'group')
    }
    return []
  } catch (error) {
    console.error('Error fetching groups:', error.message)
    return []
  }
}

export const getGroupById = async (groupId) => {
  try {
    const groups = await getAllGroups()
    return groups.find(group => group.id === groupId)
  } catch (error) {
    console.error('Error fetching group by ID:', error)
    return null
  }
}

export const addEmployeesToGroup = async (groupId, employeeIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/communication/conversations/${groupId}/participants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        employee_ids: employeeIds
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to add employees to group')
    }
    
    return true
  } catch (error) {
    console.error('Error adding employees to group:', error)
    return false
  }
}

export const removeEmployeeFromGroup = async (groupId, employeeId) => {
  // This would need a separate API endpoint for removing participants
  // For now, we'll return false as it's not commonly needed
  console.log('Remove employee from group not implemented yet')
  return false
}

export const sendGroupMessage = async (groupId, senderId, senderName, senderRole, content) => {
  try {
    let messageData

    // Normalize payload: always send a string content; include attachments when present
    if (typeof content === 'object') {
      messageData = {
        content: content.content ?? '',
        attachments: content.attachments ?? [],
        has_attachments: !!content.hasAttachments,
      }
    } else {
      messageData = {
        content: content,
        has_attachments: false,
      }
    }

    const response = await fetch(`${API_BASE_URL}/admin/communication/conversations/${groupId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    })

    if (!response.ok) {
      // Surface backend error details in console to help debugging group chat only
      const errText = await response.text().catch(() => '')
      console.error('Group message API error:', response.status, errText)
      throw new Error('Failed to send group message')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error sending group message:', error)
    throw error
  }
}

export const getGroupMessages = async (groupId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/communication/conversations/${groupId}/messages`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch group messages')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching group messages:', error)
    return []
  }
}

export const sendPrivateMessage = async (senderId, senderName, senderRole, recipientId, content, isAdmin = true) => {
  try {
    let messageData = {
      recipient_id: String(recipientId),
      content: typeof content === 'string' ? content : content.content,
      has_attachments: false
    }
    
    // Handle enhanced message with attachments
    if (typeof content === 'object' && content.hasAttachments) {
      messageData = {
        recipient_id: String(recipientId),
        content: content.content,
        attachments: content.attachments,
        has_attachments: content.hasAttachments
      }
    }
    
    // Use appropriate endpoint based on user type
    const endpoint = isAdmin
      ? `${API_BASE_URL}/admin/communication/messages/private`
      : `${API_BASE_URL}/employee/communication/messages/private`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Private message API error:', response.status, errorData)
      throw new Error(`Failed to send private message: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('Error sending private message:', error)
    throw error
  }
}

export const getPrivateMessages = async (userId) => {
  // Private messages are now handled through conversations
  // This function is kept for compatibility but should use getConversationsForUser
  try {
    const conversations = await getConversationsForUser(userId)
    const privateConversations = conversations.filter(conv => conv.type === 'private')
    
    let allMessages = []
    for (const conversation of privateConversations) {
      const messages = await getConversationMessages(conversation.id)
      allMessages = allMessages.concat(messages)
    }
    
    return allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  } catch (error) {
    console.error('Error fetching private messages:', error)
    return []
  }
}

export const getConversationsForUser = async (userId, isAdmin = false) => {
  try {
    // Use appropriate endpoint based on user type
    const endpoint = isAdmin 
      ? `${API_BASE_URL}/admin/communication/conversations`
      : `${API_BASE_URL}/employee/communication/conversations`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('Conversations API error:', response.status, errorData)
      return []
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    return []
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

export const markMessagesAsRead = async (conversationId, userId, isGroup = false, isAdmin = false) => {
  try {
    // Use appropriate endpoint based on user type
    const endpoint = isAdmin
      ? `${API_BASE_URL}/admin/communication/conversations/${conversationId}/read`
      : `${API_BASE_URL}/employee/communication/conversations/${conversationId}/read`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to mark messages as read')
    }
    
    return true
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return false
  }
}

// New function to send messages to any conversation (group or private)
export const sendConversationMessage = async (conversationId, content, isAdmin = false) => {
  try {
    let messageData

    // Normalize payload: always send a string content; include attachments when present
    if (typeof content === 'object') {
      messageData = {
        content: content.content ?? '',
        attachments: content.attachments ?? [],
        has_attachments: !!content.hasAttachments,
      }
    } else {
      messageData = {
        content: content,
        has_attachments: false,
      }
    }

    // Use appropriate endpoint based on user type
    const endpoint = isAdmin
      ? `${API_BASE_URL}/admin/communication/conversations/${conversationId}/messages`
      : `${API_BASE_URL}/employee/communication/conversations/${conversationId}/messages`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('Conversation message API error:', response.status, errText)
      throw new Error('Failed to send message')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error sending conversation message:', error)
    throw error
  }
}

// New helper function to get conversation messages
export const getConversationMessages = async (conversationId, isAdmin = false) => {
  try {
    // Use appropriate endpoint based on user type
    const endpoint = isAdmin
      ? `${API_BASE_URL}/admin/communication/conversations/${conversationId}/messages`
      : `${API_BASE_URL}/employee/communication/conversations/${conversationId}/messages`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversation messages')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return []
  }
}
