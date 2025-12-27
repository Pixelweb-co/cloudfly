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
import type { ChatbotConfig } from '@/types/channels'
import {
    WhatsApp,
    ArrowBack,
    Save,
    CheckCircle,
    QrCode2
} from '@mui/icons-material'

interface MessageState {
    type: 'success' | 'error' | 'info'
    text: string
}

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

    const [activeStep, setActiveStep] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [activating, setActivating] = useState<boolean>(false)
    const [message, setMessage] = useState<MessageState | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)

    // Estados del formulario
    const [countryCode, setCountryCode] = useState<string>('+57')
    const [localNumber, setLocalNumber] = useState<string>('')
    const [channelName, setChannelName] = useState<string>('WhatsApp Business')
    const [agentName, setAgentName] = useState<string>('')
    const [context, setContext] = useState<string>('')
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [channelId, setChannelId] = useState<number | null>(null)

    // Auto-verificar QR cada 5 segundos solo si hay QR visible y no está conectado
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null

        if (qrCode && !isConnected) {
            console.log('⏱️ Iniciando polling para verificar estado de QR...')

            intervalId = setInterval(async () => {
                try {
                    const response = await axiosInstance.get('/api/chatbot/status')

                    if (response.data) {
                        const { isConnected: connected, qrCode: newQr } = response.data

                        if (connected) {
                            // QR escaneado y conectado
                            console.log('✅ WhatsApp conectado - deteniendo polling')
                            setQrCode(null)
                            setIsConnected(true)
                            setMessage({
                                type: 'success',
                                text: '✅ WhatsApp conectado exitosamente'
                            })
                        } else if (newQr && newQr !== qrCode) {
                            // QR renovado (expiró el anterior)
                            console.log('🔄 QR renovado')
                            setQrCode(newQr)
                        }
                        // Si sigue sin conectar y el QR es el mismo, no hacer nada
                    }
                } catch (error) {
                    console.error('Error en auto-verificación:', error)
                    // No mostrar error al usuario, solo log
                }
            }, 5000) // Verificar cada 5 segundos
        }

        return () => {
            if (intervalId) {
                console.log('🛑 Deteniendo polling de QR')
                clearInterval(intervalId)
            }
        }
    }, [qrCode, isConnected])

    // Verificar estado inicial al cargar la página
    useEffect(() => {
        const checkInitialStatus = async () => {
            try {
                const response = await axiosInstance.get('/api/chatbot/status')

                if (response.data) {
                    const { exists, isConnected: connected, qrCode: existingQr, phoneNumber } = response.data

                    if (exists && connected) {
                        setIsConnected(true)
                        setQrCode(null)
                        if (phoneNumber) {
                            // Extraer el número local del número completo
                            const match = phoneNumber.match(/(\+\d+)(.+)/)
                            if (match) {
                                setCountryCode(match[1])
                                setLocalNumber(match[2])
                            }
                        }
                        console.log('✅ WhatsApp ya estaba conectado')
                    } else if (exists && existingQr) {
                        setQrCode(existingQr)
                        console.log('📱 Hay un QR pendiente de escanear')
                    }
                }
            } catch (error) {
                console.error('Error checking initial status:', error)
                // No mostrar error, solo seguir con flujo normal
            }
        }

        checkInitialStatus()
    }, [])

    const handleNext = (): void => {
        if (activeStep === STEPS.length - 1) {
            handleSubmit()
        } else {
            setActiveStep(prev => prev + 1)
        }
    }

    const handleBack = (): void => {
        setActiveStep(prev => prev - 1)
    }

    const handleActivateEvolution = async (): Promise<void> => {
        try {
            setActivating(true)
            setMessage(null)

            // Primero verificar si ya existe una instancia
            const checkResponse = await axiosInstance.get('/api/chatbot/status')

            if (checkResponse.data) {
                const { exists, isConnected: connected, qrCode: existingQr } = checkResponse.data

                if (exists) {
                    if (connected) {
                        // Ya está conectado
                        setIsConnected(true)
                        setQrCode(null)
                        setMessage({
                            type: 'success',
                            text: '✅ WhatsApp ya está conectado'
                        })
                    } else if (existingQr) {
                        // Existe pero no conectado, mostrar QR existente
                        setQrCode(existingQr)
                        setMessage({
                            type: 'info',
                            text: '📱 Escanea el código QR con WhatsApp para conectar'
                        })
                    } else {
                        // Existe pero sin QR, solicitar nuevo QR
                        const qrResponse = await axiosInstance.get('/api/chatbot/qr')
                        if (qrResponse.data?.qrCode) {
                            setQrCode(qrResponse.data.qrCode)
                            setMessage({
                                type: 'info',
                                text: '📱 Escanea el código QR con WhatsApp para conectar'
                            })
                        }
                    }
                } else {
                    // No existe instancia, crear una nueva
                    const response = await axiosInstance.post('/api/chatbot/activate')

                    if (response.data?.qrCode) {
                        setQrCode(response.data.qrCode)
                        setMessage({
                            type: 'info',
                            text: '📱 Escanea el código QR con WhatsApp para conectar'
                        })
                    } else if (response.data?.isActive || response.data?.isConnected) {
                        // Se creó y ya está conectado (caso raro)
                        setIsConnected(true)
                        setQrCode(null)
                        setMessage({
                            type: 'success',
                            text: '✅ WhatsApp conectado correctamente'
                        })
                    }
                }
            }
        } catch (error: any) {
            console.error('Error activating WhatsApp:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al activar WhatsApp. Intenta nuevamente.'
            })
        } finally {
            setActivating(false)
        }
    }

    const handleCheckQr = async (): Promise<void> => {
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

    const handleSubmit = async (): Promise<void> => {
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
                isActive: isConnected, // Estado de activación
                isConnected: isConnected, // Estado de conexión con WhatsApp
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
                                <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
                                    <Typography variant="body2" fontWeight="600" gutterBottom>
                                        ⏳ Esperando escaneo del código QR
                                    </Typography>
                                    <Typography variant="caption">
                                        1. Abre WhatsApp en tu teléfono<br />
                                        2. Toca Menú (⋮) o Configuración<br />
                                        3. Toca "Dispositivos vinculados"<br />
                                        4. Escanea este código
                                    </Typography>
                                </Alert>

                                <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
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
                                        border: '3px solid',
                                        borderColor: '#25D366',
                                        borderRadius: 2,
                                        padding: 2,
                                        bgcolor: 'white',
                                        boxShadow: 3
                                    }}
                                />

                                <Box display="flex" gap={2} mt={2}>
                                    <Button
                                        variant='outlined'
                                        onClick={handleCheckQr}
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={16} /> : null}
                                    >
                                        {loading ? 'Verificando...' : 'Verificar Ahora'}
                                    </Button>
                                </Box>

                                <Box sx={{ mt: 3, textAlign: 'center', px: 2 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        ⏱️ Verificación automática cada 5 segundos
                                    </Typography>
                                    <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                                        ⚠️ No podrás continuar hasta que escanees el código
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {isConnected && (
                            <Grid item xs={12}>
                                <Alert severity="success" icon={<CheckCircle />}>
                                    <Typography variant="body1" fontWeight="600">
                                        ✅ WhatsApp conectado exitosamente
                                    </Typography>
                                    <Typography variant="body2">
                                        Tu número está vinculado correctamente. Haz clic en "Siguiente" para continuar.
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
