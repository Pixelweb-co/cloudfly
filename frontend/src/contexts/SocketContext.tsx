'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Message } from '@/types/apps/chatTypes'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    messages: Message[]
    sendMessage: (conversationId: string, body: string, messageType?: string) => void
    joinConversation: (conversationId: string) => void
    leaveConversation: (conversationId: string) => void
    subscribePlatform: (platform: string) => void
    markAsRead: (messageIds: number[], conversationId: string) => void
    startTyping: (conversationId: string) => void
    stopTyping: (conversationId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
    children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])

    useEffect(() => {
        const token = localStorage.getItem('AuthToken')
        if (!token) return

        // URL dinámica según entorno
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
            (typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : 'https://chat.cloudfly.com.co')

        console.log('🔌 Conectando a Socket.IO:', socketUrl)

        const newSocket = io(socketUrl, {
            auth: { token },
            reconnection: true
        })

        newSocket.on('connect', () => {
            console.log('✅ Socket conectado:', newSocket.id)
            setIsConnected(true)
        })

        newSocket.on('disconnect', () => {
            console.log('❌ Socket desconectado')
            setIsConnected(false)
        })

        // Escuchar nuevo mensaje
        newSocket.on('new-message', (message: Message) => {
            console.log('🆕 Mensaje recibido por socket:', message)
            setMessages((prev) => {
                const exists = prev.some(m => m.id === message.id)
                if (exists) {
                    console.log('⚠️ Mensaje duplicado, ignorando')
                    return prev
                }
                console.log('✅ Agregando mensaje nuevo a la lista')
                return [...prev, message]
            })
        })

        setSocket(newSocket)

        return () => { newSocket.close() }
    }, [])

    const sendMessage = (conversationId: string, body: string, messageType = 'TEXT') => {
        console.log('📤 Intentando enviar mensaje:', { conversationId, body, socket: !!socket, isConnected })
        if (!socket) {
            console.error('❌ Socket no disponible')
            return
        }
        console.log('✅ Emitiendo evento send-message')
        socket.emit('send-message', { conversationId, body, messageType })
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

    return (
        <SocketContext.Provider value={{
            socket, isConnected, messages, sendMessage, joinConversation,
            leaveConversation, subscribePlatform, markAsRead, startTyping, stopTyping
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
