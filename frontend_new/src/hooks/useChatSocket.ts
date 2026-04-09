'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { userMethods } from '@/utils/userMethods'

interface UseChatSocketProps {
  conversationId?: string | number
  phone?: string
  tenantId?: number
  onNewMessage?: (message: any) => void
}

export const useChatSocket = ({ conversationId, tenantId, onNewMessage }: UseChatSocketProps) => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // URL del servidor de sockets - Prioridad: Env var > Dominio Producción > Localhost
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (typeof window !== 'undefined' && window.location.hostname === 'dashboard.cloudfly.com.co' 
                      ? 'https://chat.cloudfly.com.co' 
                      : 'http://localhost:3001')

  useEffect(() => {
    const token = localStorage.getItem('jwt')
    
    if (!token || !phone) return

    // Evitar múltiples conexiones
    if (socketRef.current) {
        socketRef.current.disconnect()
    }

    // Inicializar socket
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    // Eventos básicos
    socket.on('connect', () => {
      console.log('✅ Connected to chat socket')
      setIsConnected(true)
      
      // Unirse a la habitación de la conversación usando Teléfono (soporta duplicados)
      socket.emit('join-conversation', { phone })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat socket:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket Connection Error:', err.message)
    })

    // Eventos de negocio
    socket.on('new-message', (data) => {
      console.log('📥 New real-time message received:', data)
      // Normalización: el socket a veces envía { message, contact } o solo el mensaje
      const msg = data.message || data;
      if (onNewMessage) {
        onNewMessage(msg)
      }
    })

    socket.on('joined-conversation', (data) => {
      console.log('🏠 Joined conversation room:', data.room)
    })

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...')
        socketRef.current.emit('leave-conversation', { phone })
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [conversationId, SOCKET_URL, onNewMessage])


  // Método manual para enviar mensajes (opcional, ya que usamos API)
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', data)
    }
  }, [isConnected])

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage
  }
}
