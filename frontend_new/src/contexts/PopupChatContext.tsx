'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from './SocketContext'
import { Contact } from '@/types/marketing/contactTypes'
import { Message } from '@/types/apps/chatTypes'
import axiosInstance from '@/utils/axiosInstance'

export interface PopupChat {
  contact: Contact
  state: 'open' | 'minimized'
}

interface PopupChatContextType {
  activePopups: PopupChat[]
  openPopup: (contact: Contact) => void
  closePopup: (contactId: number | string) => void
  minimizePopup: (contactId: number | string) => void
  unreadCount: number
  clearUnreadCount: () => void
}

const PopupChatContext = createContext<PopupChatContextType | undefined>(undefined)

export const PopupChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePopups, setActivePopups] = useState<PopupChat[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { messages } = useSocket()
  
  // Use a ref to track processed messages to avoid double-processing
  const processedMessageIds = useRef<Set<string | number>>(new Set())

  // This effect listens to new messages arriving in SocketContext
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    
    // Check if we already processed this message
    if (processedMessageIds.current.has(lastMessage.id)) return
    
    // Only process inbound messages
    if (lastMessage.direction === 'OUTBOUND') {
      processedMessageIds.current.add(lastMessage.id)
      return
    }

    processedMessageIds.current.add(lastMessage.id)

    // Check if the current route is the contact's detail page
    // Route usually looks like: /marketing/contacts/56
    // We need the contactId from the message. The message might have contactId or conversationId
    const messageContactId = (lastMessage as any).contactId || (lastMessage as any).contact?.id

    if (messageContactId && pathname.includes(`/marketing/contacts/${messageContactId}`)) {
      // User is currently viewing this contact, do not open popup
      return
    }

    // Increment unread count
    setUnreadCount(prev => prev + 1)

    // Open or update popup
    if (messageContactId) {
      // Check if popup already exists
      const exists = activePopups.some(p => p.contact.id == messageContactId)
      if (exists) {
        // Just make sure it's open
        setActivePopups(prev => prev.map(p => p.contact.id == messageContactId ? { ...p, state: 'open' } : p))
      } else {
        // We need to fetch the contact details if we don't have them in the message
        // If the message brings contact data, use it
        const contactData = (lastMessage as any).contact
        if (contactData) {
          setActivePopups(prev => [...prev, { contact: contactData, state: 'open' }])
        } else {
          // Fetch from API
          fetchContactAndOpenPopup(messageContactId)
        }
      }
    }
  }, [messages, pathname]) // Run when messages or pathname changes

  const fetchContactAndOpenPopup = async (contactId: string | number) => {
    try {
      const response = await axiosInstance.get(`/api/contacts/${contactId}`)
      const contact = response.data.data || response.data
      
      setActivePopups(prev => {
        // Double check it wasn't added while fetching
        if (prev.some(p => p.contact.id == contactId)) return prev
        return [...prev, { contact, state: 'open' }]
      })
    } catch (error) {
      console.error('Error fetching contact for popup:', error)
    }
  }

  const openPopup = (contact: Contact) => {
    setActivePopups(prev => {
      const exists = prev.some(p => p.contact.id === contact.id)
      if (exists) {
        return prev.map(p => p.contact.id === contact.id ? { ...p, state: 'open' } : p)
      }
      return [...prev, { contact, state: 'open' }]
    })
  }

  const closePopup = (contactId: number | string) => {
    setActivePopups(prev => prev.filter(p => p.contact.id != contactId))
  }

  const minimizePopup = (contactId: number | string) => {
    setActivePopups(prev => prev.map(p => p.contact.id == contactId ? { ...p, state: 'minimized' } : p))
  }

  const clearUnreadCount = () => {
    setUnreadCount(0)
  }

  return (
    <PopupChatContext.Provider value={{
      activePopups,
      openPopup,
      closePopup,
      minimizePopup,
      unreadCount,
      clearUnreadCount
    }}>
      {children}
    </PopupChatContext.Provider>
  )
}

export const usePopupChat = () => {
  const context = useContext(PopupChatContext)
  if (!context) throw new Error('usePopupChat must be used within PopupChatProvider')
  return context
}
