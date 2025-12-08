'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, TextField, IconButton, InputAdornment } from '@mui/material'
import { useSocket } from '@/contexts/SocketContext'

interface Props {
    conversationId: string
}

export default function MessageInput({ conversationId }: Props) {
    const [message, setMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const { sendMessage, startTyping, stopTyping } = useSocket()
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleTyping = (value: string) => {
        setMessage(value)

        // Indicar que está escribiendo
        if (value.length > 0 && !isTyping) {
            setIsTyping(true)
            startTyping(conversationId)
        }

        // Reset del timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Si deja de escribir por 2 segundos, indicar stop typing
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            stopTyping(conversationId)
        }, 2000)
    }

    const handleSend = () => {
        if (message.trim().length === 0) return

        // Enviar mensaje
        sendMessage(conversationId, message.trim())

        // Limpiar
        setMessage('')
        setIsTyping(false)
        stopTyping(conversationId)

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            if (isTyping) {
                stopTyping(conversationId)
            }
        }
    }, [conversationId, isTyping, stopTyping])

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                variant="outlined"
                size="small"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton size="small" sx={{ p: 0.5 }}>
                                <i className="tabler-mood-smile" style={{ fontSize: 20 }} />
                            </IconButton>
                            <IconButton size="small" sx={{ p: 0.5 }}>
                                <i className="tabler-paperclip" style={{ fontSize: 20 }} />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 3
                    }
                }}
            />

            <IconButton
                color="primary"
                onClick={handleSend}
                disabled={message.trim().length === 0}
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                        bgcolor: 'primary.dark'
                    },
                    '&:disabled': {
                        bgcolor: 'action.disabledBackground'
                    }
                }}
            >
                <i className="tabler-send" />
            </IconButton>
        </Box>
    )
}
