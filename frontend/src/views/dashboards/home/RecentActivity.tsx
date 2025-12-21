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
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Icon Imports
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import WarningIcon from '@mui/icons-material/Warning'
import DescriptionIcon from '@mui/icons-material/Description'

interface Activity {
    id: string
    type: 'venta' | 'cliente' | 'chatbot' | 'inventario' | 'cotizacion'
    icon: React.ReactNode
    iconColor: string
    iconBg: string
    text: string
    detail?: string
    time: string
    link: string
}

const RecentActivity = () => {
    const [activities, setActivities] = useState<Activity[]>([])

    useEffect(() => {
        fetchActivities()
    }, [])

    const fetchActivities = async () => {
        // TODO: Fetch real data from API
        const mockActivities: Activity[] = [
            {
                id: '1',
                type: 'venta',
                icon: <AttachMoneyIcon />,
                iconColor: '#fff',
                iconBg: '#4A90E2',
                text: 'Venta #1234 completada',
                detail: '$150.00',
                time: 'Hace 5 min',
                link: '/orders/1234'
            },
            {
                id: '2',
                type: 'cliente',
                icon: <PersonAddIcon />,
                iconColor: '#fff',
                iconBg: '#28a745',
                text: 'Nuevo cliente registrado',
                detail: 'María López',
                time: 'Hace 15 min',
                link: '/customers/45'
            },
            {
                id: '3',
                type: 'chatbot',
                icon: <SmartToyIcon />,
                iconColor: '#fff',
                iconBg: '#667eea',
                text: 'Chatbot atendió consultas',
                detail: '8 conversaciones',
                time: 'Hace 1 hora',
                link: '/api/chat'
            },
            {
                id: '4',
                type: 'inventario',
                icon: <WarningIcon />,
                iconColor: '#fff',
                iconBg: '#ffc107',
                text: 'Stock bajo detectado',
                detail: 'Coca Cola 350ml',
                time: 'Hace 2 horas',
                link: '/productos/1'
            },
            {
                id: '5',
                type: 'cotizacion',
                icon: <DescriptionIcon />,
                iconColor: '#fff',
                iconBg: '#17a2b8',
                text: 'Nueva cotización enviada',
                detail: 'Cliente: Juan Pérez',
                time: 'Hace 3 horas',
                link: '/quotes/56'
            }
        ]

        setActivities(mockActivities)
    }

    const handleActivityClick = (link: string) => {
        window.location.href = link
    }

    const getRelativeTime = (time: string) => {
        return time
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title='Actividad Reciente'
                subheader='Últimos eventos del sistema'
            />
            <CardContent sx={{ pt: 0 }}>
                <List sx={{ py: 0 }}>
                    {activities.map((activity, index) => (
                        <ListItem
                            key={activity.id}
                            sx={{
                                px: 0,
                                cursor: 'pointer',
                                borderRadius: 2,
                                mb: index < activities.length - 1 ? 1 : 0,
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                },
                                transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleActivityClick(activity.link)}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        backgroundColor: activity.iconBg,
                                        color: activity.iconColor
                                    }}
                                >
                                    {activity.icon}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                secondaryTypographyProps={{ component: 'div' }}
                                primaryTypographyProps={{ component: 'div' }}
                                primary={
                                    <Typography variant='body2' fontWeight={600}>
                                        {activity.text}
                                    </Typography>
                                }
                                secondary={
                                    <Box display='flex' alignItems='center' gap={1} mt={0.5}>
                                        {activity.detail && (
                                            <Chip
                                                label={activity.detail}
                                                size='small'
                                                variant='outlined'
                                                sx={{ height: 20, fontSize: '0.75rem' }}
                                            />
                                        )}
                                        <Typography variant='caption' color='text.secondary'>
                                            {getRelativeTime(activity.time)}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
                <Button
                    fullWidth
                    variant='outlined'
                    sx={{ mt: 2 }}
                    onClick={() => (window.location.href = '/actividad')}
                >
                    Ver Todas las Actividades
                </Button>
            </CardContent>
        </Card>
    )
}

export default RecentActivity
