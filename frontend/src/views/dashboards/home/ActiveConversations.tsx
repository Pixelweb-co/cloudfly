'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Icon Imports
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

interface Conversation {
    id: string
    contactName: string
    lastMessage: string
    time: string
    unreadCount: number
    avatar?: string
    link: string
    status: 'active' | 'pending' | 'resolved'
}

const ActiveConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [totalConversations, setTotalConversations] = useState(0)

    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        // TODO: Fetch real data from API
        const mockConversations: Conversation[] = [
            {
                id: '123',
                contactName: 'Carlos Méndez',
                lastMessage: '¿Tienen en stock el producto X?',
                time: 'Hace 3 min',
                unreadCount: 2,
                link: '/api/chat/conversation/123',
                status: 'active'
            },
            {
                id: '124',
                contactName: 'Ana Rodríguez',
                lastMessage: 'Gracias por la información',
                time: 'Hace 10 min',
                unreadCount: 0,
                link: '/api/chat/conversation/124',
                status: 'resolved'
            },
            {
                id: '125',
                contactName: 'Luis García',
                lastMessage: '¿Cuánto cuesta el envío?',
                time: 'Hace 25 min',
                unreadCount: 1,
                link: '/api/chat/conversation/125',
                status: 'pending'
            },
            {
                id: '126',
                contactName: 'María Pérez',
                lastMessage: 'Quiero hacer un pedido',
                time: 'Hace 1 hora',
                unreadCount: 3,
                link: '/api/chat/conversation/126',
                status: 'active'
            }
        ]

        setConversations(mockConversations)
        setTotalConversations(12) // Total conversations including those not shown
    }

    const handleConversationClick = (link: string) => {
        window.location.href = link
    }

    const getStatusColor = (status: Conversation['status']) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'pending':
                return 'warning'
            case 'resolved':
                return 'default'
        }
    }

    const getStatusLabel = (status: Conversation['status']) => {
        switch (status) {
            case 'active':
                return 'Activa'
            case 'pending':
                return 'Pendiente'
            case 'resolved':
                return 'Resuelta'
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Card>
            <CardHeader
                title={
                    <Box display='flex' alignItems='center' gap={1}>
                        <WhatsAppIcon sx={{ color: '#25D366' }} />
                        <Typography variant='h6'>Conversaciones WhatsApp</Typography>
                    </Box>
                }
                subheader={`${totalConversations} conversaciones activas`}
                action={
                    <Chip
                        label='En vivo'
                        size='small'
                        color='success'
                        sx={{
                            '& .MuiChip-label': {
                                fontWeight: 600
                            }
                        }}
                    />
                }
            />
            <CardContent sx={{ pt: 0 }}>
                <List sx={{ py: 0 }}>
                    {conversations.map((conversation, index) => (
                        <ListItem
                            key={conversation.id}
                            sx={{
                                px: 0,
                                cursor: 'pointer',
                                borderRadius: 2,
                                mb: index < conversations.length - 1 ? 1 : 0,
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                },
                                transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleConversationClick(conversation.link)}
                        >
                            <ListItemAvatar>
                                <Badge
                                    badgeContent={conversation.unreadCount}
                                    color='error'
                                    overlap='circular'
                                >
                                    <Avatar
                                        sx={{
                                            backgroundColor: 'primary.main',
                                            fontWeight: 700
                                        }}
                                    >
                                        {getInitials(conversation.contactName)}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primaryTypographyProps={{ component: 'div' }}
                                secondaryTypographyProps={{ component: 'div' }}
                                primary={
                                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                                        <Typography variant='body2' fontWeight={600}>
                                            {conversation.contactName}
                                        </Typography>
                                        <Chip
                                            label={getStatusLabel(conversation.status)}
                                            size='small'
                                            color={getStatusColor(conversation.status)}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box mt={0.5}>
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                            sx={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                mb: 0.5
                                            }}
                                        >
                                            {conversation.lastMessage}
                                        </Typography>
                                        <Typography variant='caption' color='text.disabled'>
                                            {conversation.time}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
                <Button
                    fullWidth
                    variant='contained'
                    startIcon={<WhatsAppIcon />}
                    sx={{
                        mt: 2,
                        backgroundColor: '#25D366',
                        '&:hover': {
                            backgroundColor: '#1fb855'
                        }
                    }}
                    onClick={() => (window.location.href = '/api/chat')}
                >
                    Ver Todas las Conversaciones
                </Button>
            </CardContent>
        </Card>
    )
}

export default ActiveConversations
