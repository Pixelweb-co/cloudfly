'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Icon Imports
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import PeopleIcon from '@mui/icons-material/People'
import ChatIcon from '@mui/icons-material/Chat'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import NightsStayIcon from '@mui/icons-material/NightsStay'
import CloudIcon from '@mui/icons-material/Cloud'

// Hook Imports
import usePermissions from '@/hooks/usePermissions'

interface QuickAction {
    icon: React.ReactNode
    label: string
    path: string
    color: string
    moduleCode?: string
}

const WelcomeBanner = () => {
    const theme = useTheme()
    const router = useRouter()
    const { menu, modules, loading } = usePermissions()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [userName, setUserName] = useState('Usuario')
    const [greeting, setGreeting] = useState('Bienvenido')
    const [quickActions, setQuickActions] = useState<QuickAction[]>([])

    // Obtener nombre de usuario del localStorage
    useEffect(() => {
        const userDataStr = localStorage.getItem('userData')
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr)
                const nombres = userData.userEntity?.nombres || userData.nombres || ''
                const apellidos = userData.userEntity?.apellidos || userData.apellidos || ''
                const fullName = `${nombres} ${apellidos}`.trim() || 'Usuario'
                setUserName(fullName)
            } catch (err) {
                console.error('Error parsing user data:', err)
            }
        }
    }, [])

    // Actualizar saludo según hora del día
    useEffect(() => {
        const updateGreeting = () => {
            const hour = currentTime.getHours()
            if (hour >= 5 && hour < 12) {
                setGreeting('Buenos días')
            } else if (hour >= 12 && hour < 19) {
                setGreeting('Buenas tardes')
            } else {
                setGreeting('Buenas noches')
            }
        }
        updateGreeting()
    }, [currentTime])

    // Timer para actualizar hora
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Extraer acciones rápidas del menú dinámico
    useEffect(() => {
        if (loading || !menu || menu.length === 0) return

        const actions: QuickAction[] = []
        const maxActions = 6 // Máximo de acciones rápidas a mostrar

        // Función para buscar rutas en el menú (incluyendo children)
        const findPaths = (menuItems: any[], actionList: QuickAction[]) => {
            for (const item of menuItems) {
                if (actionList.length >= maxActions) break

                // Backend usa 'href' no 'path'
                if (item.href && item.href !== '#' && item.href !== '/') {
                    // Determinar el ícono según el módulo o título
                    let icon = <DashboardIcon />
                    let color = theme.palette.primary.main

                    const title = (item.label || '').toLowerCase()

                    if (title.includes('venta') || title.includes('pos') || title.includes('pedido')) {
                        icon = <PointOfSaleIcon />
                        color = theme.palette.primary.main
                    } else if (title.includes('producto') || title.includes('inventario')) {
                        icon = <Inventory2Icon />
                        color = theme.palette.success.main
                    } else if (title.includes('cliente') || title.includes('usuario')) {
                        icon = <PersonAddIcon />
                        color = theme.palette.info.main
                    } else if (title.includes('reporte') || title.includes('dashboard')) {
                        icon = <AssessmentIcon />
                        color = theme.palette.warning.main
                    } else if (title.includes('contab') || title.includes('comprobante')) {
                        icon = <AccountBalanceIcon />
                        color = theme.palette.secondary.main
                    } else if (title.includes('empleado') || title.includes('nómina')) {
                        icon = <PeopleIcon />
                        color = theme.palette.error.main
                    } else if (title.includes('conversaci') || title.includes('chat') || title.includes('mensaje')) {
                        icon = <ChatIcon />
                        color = theme.palette.success.main
                    }

                    actionList.push({
                        icon,
                        label: item.label,
                        path: item.href,  // Backend usa href
                        color,
                        moduleCode: item.moduleCode
                    })
                }

                // Buscar en children recursivamente
                if (item.children && item.children.length > 0) {
                    findPaths(item.children, actionList)
                }
            }
        }

        findPaths(menu, actions)
        console.log('Acciones rápidas encontradas:', actions)
        setQuickActions(actions.slice(0, maxActions))
    }, [menu, loading, theme])

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
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getTimeIcon = () => {
        const hour = currentTime.getHours()
        if (hour >= 5 && hour < 12) return <WbSunnyIcon sx={{ fontSize: 40, color: '#FFD700' }} />
        if (hour >= 12 && hour < 19) return <CloudIcon sx={{ fontSize: 40, color: '#FF8C00' }} />
        return <NightsStayIcon sx={{ fontSize: 40, color: '#9370DB' }} />
    }

    const handleQuickAction = (path: string) => {
        router.push(path)
    }

    return (
        <Card
            sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4
            }}
        >
            {/* Background Decoration - Círculos decorativos */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -80,
                    right: -80,
                    width: 250,
                    height: 250,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    filter: 'blur(50px)'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -60,
                    left: -60,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    filter: 'blur(40px)'
                }}
            />

            <CardContent sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                <Grid container spacing={4} alignItems='center'>
                    {/* Welcome Message & Info */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {getTimeIcon()}
                            <Box>
                                <Typography
                                    variant='h4'
                                    fontWeight={800}
                                    sx={{
                                        mb: 0.5,
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {greeting}
                                </Typography>
                                <Typography
                                    variant='h5'
                                    fontWeight={600}
                                    sx={{
                                        opacity: 0.95,
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {userName}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 2,
                            p: 2,
                            mt: 2
                        }}>
                            <Typography
                                variant='body1'
                                sx={{
                                    opacity: 0.95,
                                    fontWeight: 500,
                                    mb: 0.5
                                }}
                                suppressHydrationWarning
                            >
                                {formatDate(currentTime)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant='h4'
                                    sx={{
                                        opacity: 0.98,
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        letterSpacing: 2
                                    }}
                                    suppressHydrationWarning
                                >
                                    {formatTime(currentTime)}
                                </Typography>
                                <Chip
                                    label="LIVE"
                                    size="small"
                                    sx={{
                                        backgroundColor: '#FF4444',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        animation: 'pulse 2s infinite'
                                    }}
                                />
                            </Box>
                        </Box>

                        {modules.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='caption' sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                                    Módulos activos:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {modules.slice(0, 4).map((module, idx) => (
                                        <Chip
                                            key={idx}
                                            label={module}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}
                                        />
                                    ))}
                                    {modules.length > 4 && (
                                        <Chip
                                            label={`+${modules.length - 4}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 700
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Grid>

                    {/* Quick Actions */}
                    <Grid item xs={12} md={8}>
                        <Typography
                            variant='h6'
                            fontWeight={700}
                            sx={{ mb: 2, opacity: 0.95 }}
                        >
                            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Acciones Rápidas
                        </Typography>
                        <Grid container spacing={2}>
                            {quickActions.length > 0 ? (
                                quickActions.map((action, index) => (
                                    <Grid item xs={6} sm={4} md={4} lg={2} key={index}>
                                        <Button
                                            fullWidth
                                            variant='contained'
                                            onClick={() => handleQuickAction(action.path)}
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                py: 2.5,
                                                px: 1,
                                                flexDirection: 'column',
                                                gap: 1,
                                                minHeight: 100,
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255, 255, 255, 0.4)'
                                                },
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            <Box sx={{
                                                fontSize: 36,
                                                display: 'flex',
                                                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                                            }}>
                                                {action.icon}
                                            </Box>
                                            <Typography
                                                variant='caption'
                                                fontWeight={700}
                                                sx={{
                                                    textAlign: 'center',
                                                    lineHeight: 1.2,
                                                    fontSize: '0.75rem',
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                {action.label}
                                            </Typography>
                                        </Button>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Box sx={{
                                        textAlign: 'center',
                                        py: 3,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 2
                                    }}>
                                        <Typography variant='body2' sx={{ opacity: 0.8 }}>
                                            Cargando acciones disponibles...
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>

            {/* CSS para animación */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </Card>
    )
}

export default WelcomeBanner
