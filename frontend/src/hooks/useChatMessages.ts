'use client'

import { useState, useEffect, useCallback } from 'react'
import { axiosInstance } from '@/utils/axiosInstance'
import { useSocket } from '@/contexts/SocketContext'
import type { Message } from '@/types/apps/chatTypes'

interface UseChatMessagesOptions {
    conversationId: string | null
    autoJoin?: boolean
}

export const useChatMessages = ({ conversationId, autoJoin = true }: UseChatMessagesOptions) => {
    const { joinConversation, leaveConversation, messages: socketMessages } = useSocket()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Cargar historial de mensajes
    const loadMessages = useCallback(async (pageNum: number = 0) => {
        if (!conversationId) return

        try {
            setLoading(true)
            setError(null)

            const response = await axiosInstance.get(`/api/chat/messages/${conversationId}`, {
                params: {
                    page: pageNum,
                    size: 50
                }
            })

            const newMessages = response.data.content as Message[]

            if (pageNum === 0) {
                setMessages(newMessages)
            } else {
                setMessages(prev => [...newMessages, ...prev])
            }

            setHasMore(!response.data.last)
            setPage(pageNum)

        } catch (err: any) {
            console.error('Error loading messages:', err)
            setError(err.message || 'Error al cargar mensajes')
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    // Cargar más mensajes (scroll infinito)
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadMessages(page + 1)
        }
    }, [loading, hasMore, page, loadMessages])

    // Cuando cambia la conversación
    useEffect(() => {
        if (!conversationId) {
            setMessages([])
            return
        }

        // Cargar mensajes históricos
        loadMessages(0)

        // Unirse a la conversación en Socket.IO
        if (autoJoin) {
            joinConversation(conversationId)
        }

        return () => {
            if (autoJoin && conversationId) {
                leaveConversation(conversationId)
            }
        }
    }, [conversationId, autoJoin, joinConversation, leaveConversation, loadMessages])

    // Combinar mensajes históricos con nuevos del socket (OPTIMIZADO)
    useEffect(() => {
        if (!conversationId || socketMessages.length === 0) return

        const lastSocketMessage = socketMessages[socketMessages.length - 1]

        // Solo procesar si el mensaje es de esta conversación
        if (lastSocketMessage.conversationId !== conversationId) return

        setMessages(prev => {
            // Verificar si ya existe
            const exists = prev.some(m => m.id === lastSocketMessage.id)
            if (exists) return prev

            // Agregar al final (ya viene ordenado)
            return [...prev, lastSocketMessage]
        })
    }, [conversationId, socketMessages.length]) // Solo cuando cambia la cantidad

    return {
        messages,
        loading,
        error,
        hasMore,
        loadMore,
        refreshMessages: () => loadMessages(0)
    }
}
