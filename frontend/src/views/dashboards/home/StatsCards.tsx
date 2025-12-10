// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Icon Imports
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import SmartToyIcon from '@mui/icons-material/SmartToy'

interface StatCard {
    title: string
    value: string
    change: string
    comparison: string
    icon: React.ReactNode
    color: string
    trend: 'up' | 'down' | 'neutral'
    alert?: string
    link: string
}

const StatsCards = () => {
    const theme = useTheme()
    const [stats, setStats] = useState<StatCard[]>([])

    useEffect(() => {
        // TODO: Fetch real data from API
        fetchStats()
    }, [])

    const fetchStats = async () => {
        // Mock data - reemplazar con llamada a API real
        const mockStats: StatCard[] = [
            {
                title: 'Ventas Hoy',
                value: '$2,450.00',
                change: '+15%',
                comparison: 'vs ayer',
                icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
                color: theme.palette.primary.main,
                trend: 'up',
                link: '/orders'
            },
            {
                title: 'Clientes Activos',
                value: '45',
                change: '+8%',
                comparison: 'esta semana',
                icon: <PeopleIcon sx={{ fontSize: 40 }} />,
                color: theme.palette.success.main,
                trend: 'up',
                link: '/customers'
            },
            {
                title: 'Productos',
                value: '234',
                change: '5 bajos',
                comparison: 'stock',
                icon: <InventoryIcon sx={{ fontSize: 40 }} />,
                color: theme.palette.warning.main,
                trend: 'neutral',
                alert: '5 productos con stock bajo',
                link: '/productos'
            },
            {
                title: 'Chatbot IA',
                value: '12',
                change: 'Activo ✓',
                comparison: 'conversaciones',
                icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
                color: '#667eea',
                trend: 'up',
                link: '/api/chat'
            }
        ]

        setStats(mockStats)
    }

    const handleCardClick = (link: string) => {
        window.location.href = link
    }

    return (
        <Grid container spacing={3}>
            {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                        onClick={() => handleCardClick(stat.link)}
                        sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[8]
                            }
                        }}
                    >
                        <CardContent>
                            {/* Icon and Title */}
                            <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={2}>
                                <Box>
                                    <Typography variant='body2' color='text.secondary' gutterBottom>
                                        {stat.title}
                                    </Typography>
                                    <Typography variant='h4' fontWeight={700} color={stat.color}>
                                        {stat.value}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        backgroundColor: `${stat.color}15`,
                                        borderRadius: 2,
                                        p: 1.5,
                                        color: stat.color
                                    }}
                                >
                                    {stat.icon}
                                </Box>
                            </Box>

                            {/* Change Indicator */}
                            <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                                {stat.trend !== 'neutral' && (
                                    <Chip
                                        icon={stat.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                        label={stat.change}
                                        size='small'
                                        color={stat.trend === 'up' ? 'success' : 'error'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                                {stat.trend === 'neutral' && (
                                    <Chip
                                        label={stat.change}
                                        size='small'
                                        color='warning'
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                                <Typography variant='caption' color='text.secondary'>
                                    {stat.comparison}
                                </Typography>
                            </Box>

                            {/* Alert */}
                            {stat.alert && (
                                <Typography
                                    variant='caption'
                                    color='warning.main'
                                    sx={{
                                        display: 'block',
                                        mt: 1,
                                        fontWeight: 600
                                    }}
                                >
                                    ⚠️ {stat.alert}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}

export default StatsCards
