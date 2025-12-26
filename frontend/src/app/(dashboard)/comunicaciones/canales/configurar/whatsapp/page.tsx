'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    ArrowBack,
    Save,
    CheckCircle,
    QrCode2
} from '@mui/icons-material'

const SPANISH_COUNTRIES = [
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+34', name: 'España', flag: '🇪🇸' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
]

const STEPS = ['Información Básica', 'Conexión WhatsApp', 'Finalizar']

const ConfigureWhatsAppPage = () => {
    const router = useRouter()

    const [activeStep, setActiveStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activating, setActivating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)

    // Estados del formulario
    const [countryCode, setCountryCode] = useState('+57')
    const [localNumber, setLocalNumber] = useState('')
    const [channelName, setChannelName] = useState('WhatsApp Business')
    const [agentName, setAgentName] = useState('')
    const [context, setContext] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [channelId, setChannelId] = useState<number | null>(null)

    // Auto-verificar QR cada 5 segundos
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null

        if (qrCode && !isConnected) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axiosInstance.get('/api/chatbot/qr')
                    if (response.data) {
                        if (!response.data.qrCode || response.data.isActive) {
                            setQrCode(null)
                            setIsConnected(true)
                            setMessage({
                                type: 'success',
                                text: '✅ WhatsApp conectado correctamente'
                            })
                        } else if (response.data.qrCode) {
                            setQrCode(response.data.qrCode)
                        }
                    }
                } catch (error) {
                    console.error('Error en auto-verificación:', error)
                }
            }, 5000)
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [qrCode, isConnected])

    const handleNext = () => {
        if (activeStep === STEPS.length - 1) {
            handleSubmit()
        } else {
            setActiveStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setActiveStep(prev => prev - 1)
    }

    const handleActivateEvolution = async () => {
        try {
            setActivating(true)
            setMessage(null)

            const response = await axiosInstance.post('/api/chatbot/activate')

            if (response.data.qrCode) {
                setQrCode(response.data.qrCode)
                setMessage({
                    type: 'info',
                    text: '📱 Escanea el código QR con WhatsApp para conectar'
                })
            } else {
                setIsConnected(true)
                setMessage({
                    type: 'success',
                    text: '✅ Instancia de Evolution API creada correctamente'
                })
            }
        } catch (error) {
            console.error('Error activating Evolution API:', error)
            setMessage({
                type: 'error',
                text: 'Error al activar Evolution API'
            })
        } finally {
            setActivating(false)
        }
    }

    const handleCheckQr = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/chatbot/qr')

            if (response.data) {
                if (response.data.qrCode) {
                    setQrCode(response.data.qrCode)
                } else {
                    setQrCode(null)
                    setIsConnected(true)
                    setMessage({
                        type: 'success',
                        text: '✅ WhatsApp conectado exitosamente'
                    })
                }
            }
        } catch (error) {
            console.error('Error checking QR:', error)
            setMessage({
                type: 'error',
                text: 'Error al verificar QR'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)
            setMessage(null)

            // 1. Guardar configuración del chatbot/canal
            const chatbotPayload = {
                phoneNumber: `${countryCode}${localNumber}`,
                agentName: agentName,
                context: context,
                isActive: isConnected
            }

            await axiosInstance.post('/api/chatbot/config', chatbotPayload)

            // 2. Crear/actualizar registro en channels
            const channelPayload = {
                type: 'WHATSAPP',
                name: channelName,
                phoneNumber: `${countryCode}${localNumber}`,
                // instanceName se genera automáticamente como cloudfly_{customerId}
            }

            let channelResponse
            if (channelId) {
                channelResponse = await axiosInstance.put(`/api/channels/${channelId}`, channelPayload)
            } else {
                channelResponse = await axiosInstance.post('/api/channels', channelPayload)
            }

            setMessage({
                type: 'success',
                text: '✅ Canal de WhatsApp configurado correctamente'
            })

            // Redirigir después de 2 segundos
            setTimeout(() => {
                router.push('/comunicaciones/canales')
            }, 2000)
        } catch (error: any) {
            console.error('Error saving WhatsApp channel:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al guardar la configuración'
            })
        } finally {
            setSaving(false)
        }
    }

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                // Información Básica
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" icon="💡">
                                <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Configura tu WhatsApp Business
                                </Typography>
                                <Typography variant="caption">
                                    Conecta tu número de WhatsApp para automatizar respuestas
                                </Typography>
                            </Alert>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Canal"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                placeholder="WhatsApp Business"
                                helperText="Nombre personalizado para identificar este canal"
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Agente IA"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="María, Asistente Virtual"
                                helperText="Nombre con el que se presentará el chatbot"
                            />
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
                                multiline
                                rows={4}
                                label="Contexto / Prompt del Sistema"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Eres un asistente de ventas experto en..."
                                helperText="Instrucciones para la IA sobre cómo comportarse"
                            />
                        </Grid>
                    </Grid>
                )

            case 1:
                // Conexión WhatsApp
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" icon="🤖">
                                <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Conecta tu WhatsApp
                                </Typography>
                                <Typography variant="caption">
                                    Activa la conexión y escanea el código QR para vincular tu número
                                </Typography>
                            </Alert>
                        </Grid>

                        {!qrCode && !isConnected && (
                            <Grid item xs={12} display="flex" justifyContent="center">
                                <Box textAlign="center">
                                    <Typography fontSize='4rem' className='mb-4'>🤖</Typography>
                                    <Typography variant='h5' sx={{ mb: 3 }}>
                                        Activar WhatsApp
                                    </Typography>
                                    <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
                                        Conecta tu número de WhatsApp Business
                                    </Typography>
                                    <Button
                                        variant='contained'
                                        size='large'
                                        onClick={handleActivateEvolution}
                                        disabled={activating}
                                        startIcon={activating ? <CircularProgress size={20} /> : <WhatsApp />}
                                    >
                                        {activating ? 'Activando...' : 'Activar WhatsApp'}
                                    </Button>
                                </Box>
                            </Grid>
                        )}

                        {qrCode && !isConnected && (
                            <Grid item xs={12} display='flex' justifyContent='center' flexDirection='column' alignItems='center'>
                                <Typography variant='h6' sx={{ mb: 2 }}>
                                    📱 Escanea con WhatsApp
                                </Typography>
                                <Box
                                    component='img'
                                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                    alt='WhatsApp QR Code'
                                    sx={{
                                        width: 280,
                                        height: 280,
                                        mb: 2,
                                        border: '2px solid',
                                        borderColor: 'primary.main',
                                        borderRadius: 2,
                                        padding: 2
                                    }}
                                />
                                <Button variant='outlined' onClick={handleCheckQr} sx={{ mt: 2 }}>
                                    Verificar Conexión
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                                    ⏱️ Verificación automática cada 5 segundos
                                </Typography>
                            </Grid>
                        )}

                        {isConnected && (
                            <Grid item xs={12}>
                                <Alert severity="success" icon={<CheckCircle />}>
                                    <Typography variant="body1" fontWeight="600">
                                        ✅ WhatsApp conectado correctamente
                                    </Typography>
                                    <Typography variant="body2">
                                        Tu instancia de Evolution API está lista. Puedes continuar al siguiente paso.
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                )

            case 2:
                // Resumen
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
                                        Canal
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {channelName}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Agente IA
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {agentName || 'Sin nombre'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Número WhatsApp
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {countryCode} {localNumber}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Estado
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600" color={isConnected ? 'success.main' : 'warning.main'}>
                                        {isConnected ? '✓ Conectado' : '⏸ Pendiente de conexión'}
                                    </Typography>
                                </Grid>
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
                    <Box sx={{ color: '#25D366' }}>
                        <WhatsApp sx={{ fontSize: 60 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Configurar WhatsApp Business
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Conecta tu número de WhatsApp Business
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Stepper */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {STEPS.map((label, index) => (
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
                            disabled={saving || (activeStep === 1 && !isConnected)}
                            startIcon={saving ? <CircularProgress size={20} /> : activeStep === STEPS.length - 1 ? <Save /> : null}
                            size="large"
                        >
                            {saving ? 'Guardando...' : activeStep === STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default ConfigureWhatsAppPage
