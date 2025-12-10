'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// Icon Imports
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AssessmentIcon from '@mui/icons-material/Assessment'

interface QuickAction {
    icon: React.ReactNode
    label: string
    link: string
    color: string
}

const WelcomeBanner = () => {
    const theme = useTheme()
    const [currentTime, setCurrentTime] = useState(new Date())

    // Usuario actual (obtener del contexto/redux)
    const userName = localStorage.getItem('userName') || 'Usuario'

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const quickActions: QuickAction[] = [
        {
            icon: <PointOfSaleIcon />,
            label: 'Nueva Venta',
            link: '/apps/pos',
            color: theme.palette.primary.main
        },
        {
            icon: <Inventory2Icon />,
            label: 'Agregar Producto',
            link: '/productos/nuevo',
            color: theme.palette.success.main
        },
        {
            icon: <PersonAddIcon />,
            label: 'Nuevo Cliente',
            link: '/clientes/nuevo',
            color: theme.palette.info.main
        },
        {
            icon: <AssessmentIcon />,
            label: 'Ver Reportes',
            link: '/reportes',
            color: theme.palette.warning.main
        }
    ]

    const handleQuickAction = (link: string) => {
        window.location.href = link
    }

    return (
        <Card
            sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Decoration */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    filter: 'blur(40px)'
                }}
            />

            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Grid container spacing={3} alignItems='center'>
                    {/* Welcome Message */}
                    <Grid item xs={12} md={4}>
                        <Typography variant='h4' fontWeight={700} gutterBottom>
                            ¡Bienvenido, {userName}!
                        </Typography>
                        <Typography variant='body1' sx={{ opacity: 0.9 }}>
                            {formatDate(currentTime)}
                        </Typography>
                        <Typography variant='h6' sx={{ opacity: 0.95, mt: 1 }}>
                            {formatTime(currentTime)}
                        </Typography>
                    </Grid>

                    {/* Quick Actions */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            {quickActions.map((action, index) => (
                                <Grid item xs={6} sm={3} key={index}>
                                    <Button
                                        fullWidth
                                        variant='contained'
                                        onClick={() => handleQuickAction(action.link)}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            color: 'white',
                                            py: 2,
                                            flexDirection: 'column',
                                            gap: 1,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Box sx={{ fontSize: 32 }}>{action.icon}</Box>
                                        <Typography variant='caption' fontWeight={600}>
                                            {action.label}
                                        </Typography>
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default WelcomeBanner
