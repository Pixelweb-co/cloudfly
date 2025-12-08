'use client'

import { Box, Typography, Avatar, Paper } from '@mui/material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Message } from '@/types/apps/chatTypes'

interface Props {
    message: Message
}

export default function MessageBubble({ message }: Props) {
    const isInbound = message.direction === 'INBOUND'
    const isOutbound = message.direction === 'OUTBOUND'

    const getStatusIcon = () => {
        if (message.status === 'READ') return '✓✓'
        if (message.status === 'DELIVERED') return '✓✓'
        if (message.status === 'SENT') return '✓'
        if (message.status === 'PENDING') return '🕐'
        if (message.status === 'FAILED') return '❌'
        return ''
    }

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'HH:mm', { locale: es })
        } catch {
            return ''
        }
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isInbound ? 'flex-start' : 'flex-end',
                mb: 1.5,
                alignItems: 'flex-end',
                gap: 1
            }}
        >
            {/* Avatar solo para mensajes entrantes */}
            {isInbound && message.displayName && (
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem'
                    }}
                >
                    {message.displayName.charAt(0).toUpperCase()}
                </Avatar>
            )}

            {/* Burbuja del mensaje */}
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '75%',
                    bgcolor: isInbound
                        ? 'background.paper'
                        : 'primary.main',
                    color: isInbound ? 'text.primary' : 'primary.contrastText',
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    borderBottomLeftRadius: isInbound ? 0 : 16,
                    borderBottomRightRadius: isOutbound ? 0 : 16
                }}
            >
                {/* Nombre del remitente (solo para mensajes entrantes) */}
                {isInbound && message.displayName && (
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 'bold',
                            opacity: 0.8,
                            display: 'block',
                            mb: 0.5
                        }}
                    >
                        {message.displayName}
                    </Typography>
                )}

                {/* Contenido del mensaje */}
                {message.body && (
                    <Typography
                        variant="body1"
                        sx={{
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {message.body}
                    </Typography>
                )}

                {/* Media (imagen, video, etc.) */}
                {message.mediaUrl && (
                    <Box sx={{ mt: 1 }}>
                        {message.messageType === 'IMAGE' && (
                            <img
                                src={message.mediaUrl}
                                alt="Media"
                                style={{
                                    maxWidth: '100%',
                                    borderRadius: 8,
                                    display: 'block'
                                }}
                            />
                        )}
                        {message.messageType === 'VIDEO' && (
                            <video
                                src={message.mediaUrl}
                                controls
                                style={{
                                    maxWidth: '100%',
                                    borderRadius: 8
                                }}
                            />
                        )}
                        {message.messageType === 'AUDIO' && (
                            <audio src={message.mediaUrl} controls style={{ width: '100%' }} />
                        )}
                        {message.messageType === 'DOCUMENT' && (
                            <Box
                                component="a"
                                href={message.mediaUrl}
                                target="_blank"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <i className="tabler-file" />
                                <Typography variant="body2">Documento</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Timestamp y estado */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.5
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.7rem',
                            opacity: 0.7
                        }}
                    >
                        {formatTime(message.sentAt)}
                    </Typography>

                    {/* Estado solo para mensajes salientes */}
                    {isOutbound && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: '0.7rem',
                                opacity: message.status === 'READ' ? 1 : 0.5,
                                color: message.status === 'READ' ? 'info.light' : 'inherit'
                            }}
                        >
                            {getStatusIcon()}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Box>
    )
}
