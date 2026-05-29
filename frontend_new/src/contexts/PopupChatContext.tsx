'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from './SocketContext'
import { Contact } from '@/types/marketing/contactTypes'
import { contactService } from '@/services/marketing/contactService'
import { mapSocketContact } from '@/utils/normalizeSocketPayload'

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

/** No abrir popup si el usuario ya está en la ficha de ese contacto */
function isViewingContactDetail(pathname: string, contactId: number | string): boolean {
  return new RegExp(`/marketing/contacts/${contactId}(/|$)`).test(pathname)
}

export const PopupChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePopups, setActivePopups] = useState<PopupChat[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { lastInbound } = useSocket()
  const processedInboundSeq = useRef(0)

  const openPopupForContact = useCallback((contact: Contact) => {
    setActivePopups(prev => {
      const exists = prev.some(p => p.contact.id === contact.id)
      if (exists) {
        return prev.map(p => (p.contact.id === contact.id ? { ...p, state: 'open' as const } : p))
      }
      return [...prev, { contact, state: 'open' }]
    })
  }, [])

  const fetchContactAndOpenPopup = useCallback(
    async (contactId: string | number) => {
      try {
        const contact = await contactService.getContactById(Number(contactId))
        setActivePopups(prev => {
          if (prev.some(p => p.contact.id == contactId)) {
            return prev.map(p => (p.contact.id == contactId ? { ...p, state: 'open' as const } : p))
          }
          return [...prev, { contact, state: 'open' }]
        })
      } catch (error) {
        console.error('Error fetching contact for popup:', error)
      }
    },
    []
  )

  // Mensaje entrante no leído → abrir popup en dashboard
  useEffect(() => {
    if (!lastInbound) return
    if (lastInbound.seq === processedInboundSeq.current) return
    processedInboundSeq.current = lastInbound.seq

    const { message, contact: embeddedContact } = lastInbound
    const contactId = message.contactId ?? embeddedContact?.id
    if (!contactId) return

    if (isViewingContactDetail(pathname, contactId)) {
      return
    }

    setUnreadCount(prev => prev + 1)

    const mapped = embeddedContact || mapSocketContact(message as unknown as Record<string, unknown>)
    if (mapped) {
      openPopupForContact(mapped)
    } else {
      fetchContactAndOpenPopup(contactId)
    }
  }, [lastInbound, pathname, openPopupForContact, fetchContactAndOpenPopup])

  const openPopup = (contact: Contact) => {
    openPopupForContact(contact)
  }

  const closePopup = (contactId: number | string) => {
    setActivePopups(prev => prev.filter(p => p.contact.id != contactId))
  }

  const minimizePopup = (contactId: number | string) => {
    setActivePopups(prev => prev.map(p => (p.contact.id == contactId ? { ...p, state: 'minimized' } : p)))
  }

  const clearUnreadCount = () => {
    setUnreadCount(0)
  }

  return (
    <PopupChatContext.Provider
      value={{
        activePopups,
        openPopup,
        closePopup,
        minimizePopup,
        unreadCount,
        clearUnreadCount
      }}
    >
      {children}
    </PopupChatContext.Provider>
  )
}

export const usePopupChat = () => {
  const context = useContext(PopupChatContext)
  if (!context) throw new Error('usePopupChat must be used within PopupChatProvider')
  return context
}
