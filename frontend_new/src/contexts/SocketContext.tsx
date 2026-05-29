'use client'

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react'

import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'

import type { Message } from '@/types/apps/chatTypes'
import type { Contact } from '@/types/marketing/contactTypes'
import { userMethods } from '@/utils/userMethods'
import {
  normalizeInboundSocketMessage,
  type ConversationUpdatedPayload,
  isInboundUnreadConversationUpdate
} from '@/utils/normalizeSocketPayload'

// Redux
import { useDispatch } from 'react-redux'
import { fetchNotifications } from '@/redux/slices/notificationSlice'
import { fetchUnreadSummary } from '@/redux/slices/unreadMessagesSlice'
import { fetchDashboardData } from '@/redux/slices/dashboardSlice'
import type { AppDispatch } from '@/redux/store'
import { toast } from 'react-hot-toast'

export interface InboundChatNotification {
    seq: number
    message: Message
    contact?: Contact
    source: 'new-message' | 'conversation-updated'
}

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    messages: Message[]
    /** Último mensaje entrante (para popups / badge en dashboard) */
    lastInbound: InboundChatNotification | null
    sendMessage: (conversationId: string, body: string, messageType?: string, platform?: string) => void
    joinConversation: (conversationId: string) => void
    leaveConversation: (conversationId: string) => void
    subscribePlatform: (platform: string) => void
    markAsRead: (messageIds: number[], conversationId: string) => void
    startTyping: (conversationId: string) => void
    stopTyping: (conversationId: string) => void

    // Dashboard events
    subscribeDashboard: () => void
    unsubscribeDashboard: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
    children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [lastInbound, setLastInbound] = useState<InboundChatNotification | null>(null)
    const inboundSeqRef = React.useRef(0)
    const dispatch = useDispatch<AppDispatch>()

    const pushInboundNotification = (
        message: Message,
        source: InboundChatNotification['source'],
        contact?: Contact
    ) => {
        inboundSeqRef.current += 1
        setLastInbound({
            seq: inboundSeqRef.current,
            message,
            contact,
            source
        })
    }

    useEffect(() => {
        const connectSocket = () => {
            const token = localStorage.getItem('jwt')
            const user = userMethods.getUserLogin()
            const tenantId = user?.tenant?.id || user?.tenantId || user?.customerId
            const companyId = user?.activeCompanyId || user?.company_id || localStorage.getItem('activeCompanyId')

            if (!token || !tenantId) {
                console.log('⏳ Postponing Socket.IO connection: missing token or tenantId', { hasToken: !!token, tenantId })
                return null
            }

            // URL dinámica según entorno
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
                (typeof window !== 'undefined' && window.location.hostname === 'localhost'
                    ? 'http://localhost:3001'
                    : 'https://chat.cloudfly.com.co')

            console.log('🔌 Conectando a Socket.IO:', socketUrl, 'Tenant:', tenantId, 'Company:', companyId)

            const newSocket = io(socketUrl, {
                auth: {
                    token,
                    tenantId: Number(tenantId),
                    companyId: companyId ? Number(companyId) : undefined
                },
                reconnection: true
            })

            newSocket.on('connect', () => {
                console.log('✅ Socket conectado:', newSocket.id, 'Room:', `tenant_${tenantId}`)
                setIsConnected(true)
            })

            newSocket.on('disconnect', () => {
                console.log('❌ Socket desconectado')
                setIsConnected(false)
            })

            // ... (rest of listeners)
            setupListeners(newSocket)

            return newSocket
        }

        const setupListeners = (socketInstance: Socket) => {
            const refreshDashboard = () => {
                const companyId = localStorage.getItem('activeCompanyId')
                dispatch(fetchDashboardData(companyId ? parseInt(companyId) : undefined))
            }

            // Deduplication: track recent notification keys to prevent double toasts
            const recentNotifications = new Set<string>()

            socketInstance.on('new-message', (payload: unknown) => {
                console.log('🆕 Mensaje recibido por socket:', payload)

                const normalized = normalizeInboundSocketMessage(payload)
                if (normalized) {
                    const { message, contact } = normalized
                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === message.id)
                        if (exists) return prev
                        return [...prev, message]
                    })
                    pushInboundNotification(message, 'new-message', contact)
                    dispatch(fetchUnreadSummary())
                } else {
                    const legacy = payload as Message
                    if (legacy?.id != null) {
                        setMessages((prev) => {
                            const exists = prev.some(m => m.id === legacy.id)
                            if (exists) return prev
                            return [...prev, legacy]
                        })
                        if (String((legacy as any).direction || '').toUpperCase() === 'INBOUND') {
                            pushInboundNotification(legacy, 'new-message')
                            dispatch(fetchUnreadSummary())
                        }
                    }
                }
                refreshDashboard()
            })

            socketInstance.on('conversation-updated', (payload: ConversationUpdatedPayload) => {
                console.log('💬 Conversación actualizada:', payload)
                if (!isInboundUnreadConversationUpdate(payload)) return

                const message: Message = {
                    id: Date.now(),
                    conversationId: payload.conversationId || '',
                    contactId: payload.contactId,
                    direction: 'INBOUND',
                    messageType: 'TEXT',
                    body: payload.lastMessage || '',
                    status: 'RECEIVED',
                    sentAt: payload.updatedAt || new Date().toISOString(),
                    createdAt: payload.updatedAt || new Date().toISOString()
                }

                pushInboundNotification(message, 'conversation-updated')
                dispatch(fetchUnreadSummary())
                refreshDashboard()
            })

            socketInstance.on('new-web-notification', (notification: any) => {
                // Deduplicate: skip if same notification arrived in the last 5 seconds
                const notifKey = `${notification.title}_${notification.description}`
                if (recentNotifications.has(notifKey)) {
                    console.log('⚠️ Notificación duplicada, ignorando:', notifKey)
                    return
                }
                recentNotifications.add(notifKey)
                setTimeout(() => recentNotifications.delete(notifKey), 5000)

                console.log('🔔 Nueva notificación web recibida:', notification)
                toast(
                    (t) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <b style={{ fontSize: '0.9rem' }}>{notification.title}</b>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{notification.description}</span>
                        </div>
                    ),
                    {
                        duration: 5000,
                        icon: '🔔',
                        style: {
                            borderRadius: '10px',
                            background: '#fff',
                            color: '#333',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: '1px solid #eee'
                        },
                    }
                );
                dispatch(fetchNotifications())
                // Small delay to let DB transaction commit before refreshing dashboard
                setTimeout(() => refreshDashboard(), 1500)
            })

            socketInstance.on('contact-update', () => refreshDashboard())
            socketInstance.on('message-status-update', () => refreshDashboard())
            socketInstance.on('dashboard-update', () => refreshDashboard())
        }

        let socketInstance = connectSocket()

        // Si no hay socket (porque faltaba tenantId), intentar de nuevo cada 2 segundos hasta que esté disponible
        // Esto es útil durante la hidratación de la sesión
        const checkInterval = setInterval(() => {
            if (!socketInstance) {
                socketInstance = connectSocket()
                if (socketInstance) {
                    setSocket(socketInstance)
                    clearInterval(checkInterval)
                }
            }
        }, 2000)

        setSocket(socketInstance)

        return () => {
            if (socketInstance) socketInstance.close()
            clearInterval(checkInterval)
        }
    }, [])

    const sendMessage = (conversationId: string, body: string, messageType = 'TEXT', platform = 'WHATSAPP') => {
        console.log('📤 Intentando enviar mensaje:', { conversationId, body, platform, socket: !!socket, isConnected })

        if (!socket) {
            console.error('❌ Socket no disponible')
            
return
        }

        console.log('✅ Emitiendo evento send-message')
        socket.emit('send-message', { conversationId, body, messageType, platform })
    }

    const joinConversation = (conversationId: string) => {
        if (!socket) return
        socket.emit('join-conversation', { conversationId })
    }

    const leaveConversation = (conversationId: string) => {
        if (!socket) return
        socket.emit('leave-conversation', { conversationId })
    }

    const subscribePlatform = (platform: string) => {
        if (!socket) return
        socket.emit('subscribe-platform', platform)
    }

    const markAsRead = (messageIds: number[], conversationId: string) => {
        if (!socket) return
        socket.emit('mark-as-read', { messageIds, conversationId })
    }

    const startTyping = (conversationId: string) => {
        if (!socket) return
        socket.emit('typing', { conversationId })
    }

    const stopTyping = (conversationId: string) => {
        if (!socket) return
        socket.emit('stop-typing', { conversationId })
    }

    const subscribeDashboard = () => {
        if (!socket) return
        console.log('📊 Suscribiendo a updates del dashboard')
        socket.emit('subscribe-dashboard')
    }

    const unsubscribeDashboard = () => {
        if (!socket) return
        console.log('📊 Desuscribiendo de updates del dashboard')
        socket.emit('unsubscribe-dashboard')
    }

    return (
        <SocketContext.Provider value={{
            socket, isConnected, messages, lastInbound, sendMessage, joinConversation,
            leaveConversation, subscribePlatform, markAsRead, startTyping, stopTyping,
            subscribeDashboard, unsubscribeDashboard
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext)

    if (!context) throw new Error('useSocket must be used within SocketProvider')
    
return context
}
