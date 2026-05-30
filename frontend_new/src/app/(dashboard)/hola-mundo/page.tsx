'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Fade from '@mui/material/Fade'
import Slide from '@mui/material/Slide'
import Grow from '@mui/material/Grow'
import Zoom from '@mui/material/Zoom'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'

// Icon Imports
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import CodeIcon from '@mui/icons-material/Code'
import FavoriteIcon from '@mui/icons-material/Favorite'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TerminalIcon from '@mui/icons-material/Terminal'
import CloudIcon from '@mui/icons-material/Cloud'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import LanguageIcon from '@mui/icons-material/Language'
import GitHubIcon from '@mui/icons-material/GitHub'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

// Util Imports
import { userMethods } from '@/utils/userMethods'

const HolaMundoPage = () => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const isDark = theme.palette.mode === 'dark'
    const [mounted, setMounted] = useState(false)
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null)
    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        const user = userMethods.getUserLogin()
        setActiveTenantId(user?.activeTenantId || null)
        setActiveCompanyId(user?.activeCompanyId || user?.company_id || null)
    }, [])

    if (!mounted) return null

    // HSL-based color palette for the hero section
    const accentHue = 220
    const accentColor = `hsl(${accentHue}, 85%, 60%)`
    const accentColorLight = `hsl(${accentHue}, 85%, 75%)`
    const accentColorDark = `hsl(${accentHue}, 85%, 40%)`
    const glowColor = `hsl(${accentHue}, 100%, 70%)`

    const features = [
        {
            icon: <TerminalIcon sx={{ fontSize: 28 }} />,
            title: 'Python Backend',
            description: 'Script main.py ejecutándose correctamente con salida en consola.',
            color: 'hsl(142, 76%, 45%)',
            status: 'Activo'
        },
        {
            icon: <CloudIcon sx={{ fontSize: 28 }} />,
            title: 'CloudFly Platform',
            description: 'Plataforma SaaS de automatización empresarial todo-en-uno.',
            color: 'hsl(220, 85%, 60%)',
            status: 'Conectado'
        },
        {
            icon: <SpeedIcon sx={{ fontSize: 28 }} />,
            title: 'Next.js 14 Frontend',
            description: 'App Router, React Server Components, TypeScript y Tailwind CSS.',
            color: 'hsl(280, 70%, 60%)',
            status: 'Renderizando'
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 28 }} />,
            title: 'Multi-Tenant',
            description: 'Aislamiento por tenant y company con persistencia en localStorage.',
            color: 'hsl(35, 90%, 55%)',
            status: 'Aislado'
        },
        {
            icon: <LanguageIcon sx={{ fontSize: 28 }} />,
            title: 'Evolution API',
            description: 'WhatsApp messaging via webhook en puerto 8080 con PostgreSQL.',
            color: 'hsl(190, 80%, 50%)',
            status: 'Escuchando'
        },
        {
            icon: <CodeIcon sx={{ fontSize: 28 }} />,
            title: 'Kafka Messaging',
            description: 'Broker Apache Kafka en puerto 9092 con topic whatsapp-notifications.',
            color: 'hsl(0, 75%, 60%)',
            status: 'Produciendo'
        }
    ]

    const techStack = [
        { name: 'Next.js 14', color: 'hsl(0, 0%, 90%)' },
        { name: 'React 18', color: 'hsl(190, 80%, 55%)' },
        { name: 'TypeScript', color: 'hsl(210, 80%, 60%)' },
        { name: 'MUI v5', color: 'hsl(220, 85%, 60%)' },
        { name: 'Tailwind CSS', color: 'hsl(170, 70%, 50%)' },
        { name: 'Python', color: 'hsl(50, 80%, 55%)' },
        { name: 'Docker', color: 'hsl(200, 85%, 55%)' },
        { name: 'PostgreSQL', color: 'hsl(220, 60%, 55%)' },
        { name: 'Kafka', color: 'hsl(0, 0%, 70%)' },
        { name: 'Evolution API', color: 'hsl(142, 76%, 45%)' }
    ]

    return (
        <Box sx={{ position: 'relative' }}>
            {/* ===== HERO SECTION ===== */}
            <Fade in={mounted} timeout={800}>
                <Box
                    sx={{
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        mb: 6,
                        background: isDark
                            ? `linear-gradient(135deg, hsl(${accentHue}, 30%, 8%) 0%, hsl(${accentHue}, 40%, 12%) 50%, hsl(${accentHue + 40}, 35%, 10%) 100%)`
                            : `linear-gradient(135deg, hsl(${accentHue}, 60%, 95%) 0%, hsl(${accentHue}, 50%, 92%) 50%, hsl(${accentHue + 40}, 45%, 94%) 100%)`,
                        border: `1px solid ${isDark ? `hsl(${accentHue}, 30%, 20%)` : `hsl(${accentHue}, 40%, 85%)`}`,
                        p: { xs: 4, md: 8 }
                    }}
                >
                    {/* Animated background orbs */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '-20%',
                            right: '-10%',
                            width: { xs: 200, md: 400 },
                            height: { xs: 200, md: 400 },
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)`,
                            animation: 'pulse 4s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
                                '50%': { transform: 'scale(1.1)', opacity: 0.8 }
                            }
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '-15%',
                            left: '-5%',
                            width: { xs: 150, md: 300 },
                            height: { xs: 150, md: 300 },
                            borderRadius: '50%',
                            background: `radial-gradient(circle, hsl(${accentHue + 60}, 80%, 60%)12 0%, transparent 70%)`,
                            animation: 'pulse 5s ease-in-out infinite reverse',
                        }}
                    />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={4}
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            justifyContent="space-between"
                        >
                            <Box sx={{ flex: 1 }}>
                                <Slide in={mounted} direction="up" timeout={1000}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: accentColorDark,
                                                color: '#fff',
                                                fontWeight: 700,
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            C
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: accentColorLight,
                                                    fontWeight: 600,
                                                    letterSpacing: 1.5,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                CloudFly AI — CLOUD-191
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: 'hsl(142, 76%, 45%)',
                                                        animation: 'blink 2s ease-in-out infinite',
                                                        '@keyframes blink': {
                                                            '0%, 100%': { opacity: 1 },
                                                            '50%': { opacity: 0.3 }
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Sistema operativo
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Slide>

                                <Slide in={mounted} direction="up" timeout={1200}>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: '2.5rem', md: '4rem' },
                                            lineHeight: 1.1,
                                            mb: 2,
                                            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColorLight} 50%, hsl(${accentHue + 60}, 80%, 70%) 100%)`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        Hola Mundo
                                    </Typography>
                                </Slide>

                                <Slide in={mounted} direction="up" timeout={1400}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: 'text.secondary',
                                            fontWeight: 400,
                                            maxWidth: 600,
                                            lineHeight: 1.6,
                                            mb: 4
                                        }}
                                    >
                                        Bienvenido a la plataforma CloudFly AI. Tu entorno de desarrollo está configurado
                                        y funcionando correctamente. El backend Python imprime{' '}
                                        <Box
                                            component="code"
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                color: accentColor,
                                                fontFamily: 'monospace',
                                                fontSize: '0.9em'
                                            }}
                                        >
                                            "hola mundo"
                                        </Box>{' '}
                                        en consola y el frontend Next.js renderiza esta interfaz.
                                    </Typography>
                                </Slide>

                                <Slide in={mounted} direction="up" timeout={1600}>
                                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                        <Button
                                            variant="contained"
                                            startIcon={<RocketLaunchIcon />}
                                            sx={{
                                                bgcolor: accentColorDark,
                                                color: '#fff',
                                                px: 3,
                                                py: 1.2,
                                                borderRadius: 2,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                fontSize: '0.95rem',
                                                boxShadow: `0 4px 20px ${accentColorDark}40`,
                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                '&:hover': {
                                                    bgcolor: accentColor,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 8px 30px ${accentColorDark}60`
                                                }
                                            }}
                                        >
                                            Comenzar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            endIcon={<OpenInNewIcon />}
                                            sx={{
                                                borderColor: accentColorDark,
                                                color: accentColor,
                                                px: 3,
                                                py: 1.2,
                                                borderRadius: 2,
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                '&:hover': {
                                                    borderColor: accentColor,
                                                    bgcolor: `${accentColorDark}10`,
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            Documentación
                                        </Button>
                                    </Stack>
                                </Slide>
                            </Box>

                            {/* Code Preview Card */}
                            <Zoom in={mounted} timeout={1800}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        minWidth: { xs: '100%', md: 340 },
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                        bgcolor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
                                        backdropFilter: 'blur(20px)'
                                    }}
                                >
                                    {/* Terminal Header */}
                                    <Box
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#febc2e' }} />
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28c840' }} />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                ml: 'auto',
                                                fontFamily: 'monospace',
                                                color: 'text.secondary',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            main.py
                                        </Typography>
                                    </Box>
                                    {/* Terminal Body */}
                                    <Box sx={{ p: 3 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                                fontSize: '0.9rem',
                                                lineHeight: 1.8,
                                                color: isDark ? '#e2e8f0' : '#334155'
                                            }}
                                        >
                                            <Box component="span" sx={{ color: 'hsl(280, 70%, 65%)' }}>print</Box>
                                            <Box component="span" sx={{ color: isDark ? '#e2e8f0' : '#334155' }}>(</Box>
                                            <Box component="span" sx={{ color: 'hsl(142, 76%, 55%)' }}>"hola mundo"</Box>
                                            <Box component="span" sx={{ color: isDark ? '#e2e8f0' : '#334155' }}>)</Box>
                                        </Typography>
                                        <Box
                                            sx={{
                                                mt: 3,
                                                pt: 2,
                                                borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                                    fontSize: '0.85rem',
                                                    color: 'hsl(142, 76%, 55%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                                                hola mundo
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                color: 'text.secondary',
                                                    mt: 0.5,
                                                    display: 'block'
                                                }}
                                            >
                                                {'>'} Proceso finalizado exitosamente
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Zoom>
                        </Stack>
                    </Box>
                </Box>
            </Fade>

            {/* ===== TENANT INFO BAR ===== */}
            <Grow in={mounted} timeout={2000}>
                <Paper
                    elevation={0}
                    sx={{
                        mb: 6,
                        p: 3,
                        borderRadius: 3,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                TENANT ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                {activeTenantId || 'No configurado'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                COMPANY ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                {activeCompanyId || 'No configurado'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                                TICKET
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                CLOUD-191
                            </Typography>
                        </Box>
                    </Stack>
                    <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                        label="Completado"
                        color="success"
                        size="small"
                        variant="tonal"
                        sx={{ fontWeight: 600 }}
                    />
                </Paper>
            </Grow>

            {/* ===== FEATURES GRID ===== */}
            <Box sx={{ mb: 6 }}>
                <Slide in={mounted} direction="up" timeout={1200}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            Arquitectura del Sistema
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Componentes principales que conforman el ecosistema CloudFly AI
                        </Typography>
                    </Box>
                </Slide>

                <Grid container spacing={3}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={feature.title}>
                            <Grow in={mounted} timeout={1400 + index * 150}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: `linear-gradient(90deg, ${feature.color}, transparent)`,
                                            opacity: 0,
                                            transition: 'opacity 0.3s ease'
                                        },
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 12px 40px ${feature.color}15`,
                                            borderColor: `${feature.color}30`,
                                            '&::before': {
                                                opacity: 1
                                            }
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            sx={{ mb: 2 }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    bgcolor: `${feature.color}15`,
                                                    color: feature.color,
                                                    borderRadius: 2
                                                }}
                                            >
                                                {feature.icon}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {feature.title}
                                                </Typography>
                                                <Chip
                                                    label={feature.status}
                                                    size="small"
                                                    variant="tonal"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        bgcolor: `${feature.color}12`,
                                                        color: feature.color,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grow>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* ===== TECH STACK ===== */}
            <Fade in={mounted} timeout={2200}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 3,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
                        mb: 6
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                        <CodeIcon sx={{ color: accentColor }} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Stack Tecnológico
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        {techStack.map((tech, index) => (
                            <Grow in={mounted} timeout={2400 + index * 80} key={tech.name}>
                                <Chip
                                    label={tech.name}
                                    variant="outlined"
                                    sx={{
                                        borderColor: `${tech.color}40`,
                                        color: tech.color,
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        py: 2.5,
                                        px: 1,
                                        borderRadius: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            bgcolor: `${tech.color}12`,
                                            borderColor: tech.color,
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                />
                            </Grow>
                        ))}
                    </Stack>
                </Paper>
            </Fade>

            {/* ===== FOOTER MESSAGE ===== */}
            <Fade in={mounted} timeout={2800}>
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 4,
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5
                        }}
                    >
                        Hecho con
                        <FavoriteIcon sx={{ fontSize: 14, color: 'hsl(0, 75%, 60%)' }} />
                        por el equipo CloudFly AI
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        CLOUD-191 — Ticket completado exitosamente
                    </Typography>
                </Box>
            </Fade>
        </Box>
    )
}

export default HolaMundoPage
