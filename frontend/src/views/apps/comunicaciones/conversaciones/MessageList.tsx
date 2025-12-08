'use client'

import { useEffect, useRef } from 'react'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { useChatMessages } from '@/hooks/useChatMessages'
import MessageBubble from './MessageBubble'

interface Props {
    conversationId: string
}

export default function MessageList({ conversationId }: Props) {
    const { messages, loading, hasMore, loadMore } = useChatMessages({
        conversationId,
        autoJoin: true
    })

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll al último mensaje cuando llega uno nuevo
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleScroll = () => {
        if (!scrollContainerRef.current) return

        const { scrollTop } = scrollContainerRef.current

        // Si está cerca del top, cargar más mensajes
        if (scrollTop < 100 && hasMore && !loading) {
            loadMore()
        }
    }

    if (loading && messages.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}
            >
                <CircularProgress />
            </Box>
        )
    }

    if (messages.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    gap: 2,
                    px: 3
                }}
            >
                <i className="tabler-message-circle" style={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="body1" color="text.secondary">
                    No hay mensajes en esta conversación
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Los nuevos mensajes aparecerán aquí automáticamente
                </Typography>
            </Box>
        )
    }

    return (
        <Box
            ref={scrollContainerRef}
            onScroll={handleScroll}
            sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Botón cargar más mensajes antiguos */}
            {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Button
                        size="small"
                        onClick={loadMore}
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={16} />}
                    >
                        {loading ? 'Cargando...' : 'Cargar mensajes anteriores'}
                    </Button>
                </Box>
            )}

            {/* Lista de mensajes */}
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}

            {/* Referencia para auto-scroll */}
            <div ref={messagesEndRef} />
        </Box>
    )
}
