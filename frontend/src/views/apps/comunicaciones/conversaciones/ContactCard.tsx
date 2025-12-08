'use client'

import { Card, CardContent, Box, Typography, Avatar, Badge, Chip } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ContactCard as ContactCardType } from '@/types/apps/chatTypes'

interface Props {
    contact: ContactCardType
    onClick: () => void
}

export default function ContactCard({ contact, onClick }: Props) {
    const timeAgo = formatDistanceToNow(new Date(contact.lastMessageTime), {
        addSuffix: true,
        locale: es
    })

    return (
        <Card
            onClick={onClick}
            sx={{
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                }
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Avatar con badge de mensajes no leídos */}
                    <Badge
                        badgeContent={contact.unreadCount}
                        color="error"
                        overlap="circular"
                    >
                        <Avatar
                            src={contact.avatarUrl}
                            sx={{ width: 48, height: 48 }}
                        >
                            {contact.name.charAt(0).toUpperCase()}
                        </Avatar>
                    </Badge>

                    {/* Información del contacto */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                {contact.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                                {timeAgo}
                            </Typography>
                        </Box>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 1
                            }}
                        >
                            {contact.lastMessage}
                        </Typography>

                        {/* Chips de plataform y external ID */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={contact.platform}
                                size="small"
                                color={
                                    contact.platform === 'WHATSAPP' ? 'success' :
                                        contact.platform === 'FACEBOOK_MESSENGER' ? 'primary' :
                                            contact.platform === 'INSTAGRAM_DM' ? 'secondary' :
                                                'default'
                                }
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            {contact.externalId && (
                                <Chip
                                    label={contact.externalId}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}
