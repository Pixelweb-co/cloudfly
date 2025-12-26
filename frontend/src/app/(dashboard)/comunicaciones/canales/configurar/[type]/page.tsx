'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Divider
} from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import {
    WhatsApp,
    Facebook,
    Instagram,
    MusicNote,
    ArrowBack,
    Save,
    CheckCircle
} from '@mui/icons-material'

interface ChannelConfig {
    type: string
    name: string
    phoneNumber?: string
    pageId?: string
    username?: string
    accessToken?: string
    instanceName?: string
    webhookUrl?: string
    apiKey?: string
}

const CHANNEL_INFO: Record<string, any> = {
    whatsapp: {
        name: 'WhatsApp Business',
        icon: <WhatsApp sx={{ fontSize: 60 }} />,
        color: '#25D366',
        steps: ['Información Básica', 'Configuración de Conexión', 'Finalizar'],
        description: 'Configura tu cuenta de WhatsApp Business para automatizar respuestas'
    },
    facebook: {
        name: 'Facebook Messenger',
        icon: <Facebook sx={{ fontSize: 60 }} />,
        color: '#0084FF',
        steps: ['Información Básica', 'Conectar Página', 'Finalizar'],
        description: 'Conecta tu página de Facebook para responder mensajes automáticamente'
    },
    instagram: {
        name: 'Instagram Direct',
        icon: <Instagram sx={{ fontSize: 60 }} />,
        color: '#E4405F',
        steps: ['Información Básica', 'Conectar Cuenta', 'Finalizar'],
        description: 'Automatiza respuestas de mensajes directos en Instagram'
    },
    tiktok: {
        name: 'TikTok Business',
        icon: <MusicNote sx={{ fontSize: 60 }} />,
        color: '#000000',
        steps: ['Información Básica', 'Conectar Cuenta Business', 'Finalizar'],
        description: 'Gestiona mensajes de tu cuenta de TikTok Business con IA'
    }
}

const SPANISH_COUNTRIES = [
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+34', name: 'España', flag: '🇪🇸' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
]

const ConfigureChannelPage = () => {
    const router = useRouter()
    const params = useParams()
    const channelType = params?.type as string

    const [activeStep, setActiveStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

    // Estados del formulario
    const [countryCode, setCountryCode] = useState('+57')
    const [localNumber, setLocalNumber] = useState('')
    const [config, setConfig] = useState<ChannelConfig>({
        type: channelType?.toUpperCase() || '',
        name: '',
        phoneNumber: '',
        pageId: '',
        username: '',
        accessToken: '',
        instanceName: '',
        webhookUrl: '',
        apiKey: ''
    })

    useEffect(() => {
        if (!channelType || !CHANNEL_INFO[channelType]) {
            router.push('/comunicaciones/canales')
            return
        }

        // WhatsApp tiene su propia página con Evolution API
        if (channelType === 'whatsapp') {
            router.push('/comunicaciones/canales/configurar/whatsapp')
            return
        }

        // Setear nombre por defecto
        setConfig(prev => ({
            ...prev,
            type: channelType.toUpperCase(),
            name: CHANNEL_INFO[channelType].name
        }))
    }, [channelType, router])

    const handleNext = () => {
        if (activeStep === CHANNEL_INFO[channelType].steps.length - 1) {
            handleSubmit()
        } else {
            setActiveStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setActiveStep(prev => prev - 1)
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)
            setMessage(null)

            // Preparar datos según el tipo de canal
            const payload: any = {
                type: config.type,
                name: config.name
            }

            if (channelType === 'whatsapp') {
                payload.phoneNumber = `${countryCode}${localNumber}`
                // instanceName se genera automáticamente en el backend como cloudfly_{customerId}
                payload.apiKey = config.apiKey
            } else if (channelType === 'facebook') {
                payload.pageId = config.pageId
                payload.accessToken = config.accessToken
            } else if (channelType === 'instagram') {
                payload.username = config.username
                payload.accessToken = config.accessToken
            } else if (channelType === 'tiktok') {
                payload.username = config.username
                payload.accessToken = config.accessToken
            }

            const response = await axiosInstance.post('/api/channels', payload)

            setMessage({
                type: 'success',
                text: `✅ Canal ${CHANNEL_INFO[channelType].name} configurado correctamente`
            })

            // Redirigir después de 2 segundos
            setTimeout(() => {
                router.push('/comunicaciones/canales')
            }, 2000)
        } catch (error: any) {
            console.error('Error saving channel:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al guardar la configuración'
            })
        } finally {
            setSaving(false)
        }
    }

    if (!channelType || !CHANNEL_INFO[channelType]) {
        return null
    }

    const channelInfo = CHANNEL_INFO[channelType]

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                // Información Básica
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" icon="💡">
                                <Typography variant="body2" fontWeight="600" gutterBottom>
                                    {channelInfo.description}
                                </Typography>
                                <Typography variant="caption">
                                    Completa la información básica de tu canal de comunicación
                                </Typography>
                            </Alert>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Canal"
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                placeholder={channelInfo.name}
                                helperText="Nombre personalizado para identificar este canal"
                                required
                            />
                        </Grid>
                    </Grid>
                )

            case 1:
                // Configuración específica por canal
                if (channelType === 'whatsapp') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Alert severity="info" icon="📱">
                                    <Typography variant="body2" fontWeight="600" gutterBottom>
                                        Configura tu número de WhatsApp Business
                                    </Typography>
                                    <Typography variant="caption">
                                        Este será el número desde el cual tu chatbot responderá a los clientes
                                    </Typography>
                                </Alert>
                            </Grid>

                            <Grid item xs={12} container spacing={2}>
                                <Grid item xs={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>País</InputLabel>
                                        <Select
                                            value={countryCode}
                                            label="País"
                                            onChange={(e) => setCountryCode(e.target.value)}
                                        >
                                            {SPANISH_COUNTRIES.map(country => (
                                                <MenuItem key={country.code} value={country.code}>
                                                    {country.flag} {country.code}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={8}>
                                    <TextField
                                        fullWidth
                                        label="Número WhatsApp"
                                        value={localNumber}
                                        onChange={(e) => setLocalNumber(e.target.value)}
                                        placeholder="300 123 4567"
                                        helperText="Sin código de país"
                                        required
                                    />
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="API Key (Opcional)"
                                    value={config.apiKey}
                                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                    placeholder="tu-api-key-aqui"
                                    helperText="API key del proveedor de WhatsApp Business"
                                    type="password"
                                />
                            </Grid>
                        </Grid>
                    )
                } else if (channelType === 'facebook') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Alert severity="info" icon="📘">
                                    <Typography variant="body2" fontWeight="600" gutterBottom>
                                        Conecta tu Página de Facebook
                                    </Typography>
                                    <Typography variant="caption">
                                        Necesitarás el ID de tu página y un token de acceso
                                    </Typography>
                                </Alert>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Page ID"
                                    value={config.pageId}
                                    onChange={(e) => setConfig({ ...config, pageId: e.target.value })}
                                    placeholder="123456789012345"
                                    helperText="ID de tu página de Facebook Business"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Access Token"
                                    value={config.accessToken}
                                    onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                                    placeholder="EAAxxxxxxxxxxxxxxx"
                                    helperText="Token de acceso de la API de Facebook"
                                    type="password"
                                    required
                                />
                            </Grid>
                        </Grid>
                    )
                } else if (channelType === 'instagram') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Alert severity="info" icon="📸">
                                    <Typography variant="body2" fontWeight="600" gutterBottom>
                                        Conecta tu cuenta de Instagram Business
                                    </Typography>
                                    <Typography variant="caption">
                                        Debe ser una cuenta de Instagram Business conectada a Facebook
                                    </Typography>
                                </Alert>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre de Usuario"
                                    value={config.username}
                                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                    placeholder="@tu_negocio"
                                    helperText="Nombre de usuario de Instagram sin @"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Access Token"
                                    value={config.accessToken}
                                    onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                                    placeholder="IGQVJxxxxxxxxxxxxxxx"
                                    helperText="Token de acceso de Instagram Graph API"
                                    type="password"
                                    required
                                />
                            </Grid>
                        </Grid>
                    )
                } else if (channelType === 'tiktok') {
                    return (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Alert severity="info" icon="🎵">
                                    <Typography variant="body2" fontWeight="600" gutterBottom>
                                        Conecta tu cuenta de TikTok Business
                                    </Typography>
                                    <Typography variant="caption">
                                        Requiere una cuenta de TikTok Business con API habilitada
                                    </Typography>
                                </Alert>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre de Usuario"
                                    value={config.username}
                                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                    placeholder="@tu_negocio"
                                    helperText="Nombre de usuario de TikTok sin @"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Access Token"
                                    value={config.accessToken}
                                    onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                                    placeholder="act.xxxxxxxxxxxxxxx"
                                    helperText="Token de acceso de TikTok for Business API"
                                    type="password"
                                    required
                                />
                            </Grid>
                        </Grid>
                    )
                }
                return null

            case 2:
                // Resumen y finalizar
                return (
                    <Box>
                        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                                ¡Listo para configurar!
                            </Typography>
                            <Typography variant="body2">
                                Revisa la información y haz clic en "Finalizar" para activar tu canal
                            </Typography>
                        </Alert>

                        <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="600">
                                Resumen de Configuración
                            </Typography>
                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Tipo de Canal
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {channelInfo.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Nombre
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {config.name}
                                    </Typography>
                                </Grid>

                                {channelType === 'whatsapp' && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">
                                            Número WhatsApp
                                        </Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            {countryCode} {localNumber}
                                        </Typography>
                                    </Grid>
                                )}

                                {channelType === 'facebook' && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">
                                            Page ID
                                        </Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            {config.pageId}
                                        </Typography>
                                    </Grid>
                                )}

                                {(channelType === 'instagram' || channelType === 'tiktok') && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">
                                            Usuario
                                        </Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            @{config.username}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Box>
                )

            default:
                return null
        }
    }

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/comunicaciones/canales')}
                    sx={{ mb: 2 }}
                >
                    Volver a Canales
                </Button>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{ color: channelInfo.color }}>
                        {channelInfo.icon}
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Configurar {channelInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sigue los pasos para conectar tu canal
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Stepper */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {channelInfo.steps.map((label: string, index: number) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            {/* Messages */}
            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            {/* Form Content */}
            <Card>
                <CardContent sx={{ p: 4 }}>
                    {renderStepContent(activeStep)}

                    {/* Navigation Buttons */}
                    <Box display="flex" justifyContent="space-between" mt={4}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            size="large"
                        >
                            Atrás
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : activeStep === channelInfo.steps.length - 1 ? <Save /> : null}
                            size="large"
                        >
                            {saving ? 'Guardando...' : activeStep === channelInfo.steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default ConfigureChannelPage
