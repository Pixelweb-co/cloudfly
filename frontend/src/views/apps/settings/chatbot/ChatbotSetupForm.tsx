'use client'

import React, { useState, useEffect } from 'react'
import {
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Typography,
    Alert,
    CircularProgress,
    Box
} from '@mui/material'
import { ChatbotConfig, ChatbotType, ChatbotTypeConfig } from '@/types/apps/chatbotTypes'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'

interface ChatbotSetupFormProps {
    onSuccess?: () => void
}

// Mapeo de tipos de negocio a tipos de chatbot
const BUSINESS_TYPE_TO_CHATBOT: Record<string, ChatbotType> = {
    'beauty_salon': 'SCHEDULING',
    'medical_clinic': 'SCHEDULING',
    'dental_clinic': 'SCHEDULING',
    'automotive': 'SCHEDULING',
    'legal': 'SCHEDULING',
    'ecommerce': 'SALES',
    'restaurant': 'SALES',
    'retail': 'SALES',
    'real_estate': 'SALES',
    'fitness_gym': 'SUBSCRIPTIONS',
    'software_saas': 'SUBSCRIPTIONS',
    'education': 'SUBSCRIPTIONS'
}

// Países de habla hispana
const SPANISH_SPEAKING_COUNTRIES = [
    { code: '+34', name: 'España', flag: '🇪🇸' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
    { code: '+51', name: 'Perú', flag: '🇵🇪' },
    { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
    { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
    { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
    { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
    { code: '+53', name: 'Cuba', flag: '🇨🇺' },
    { code: '+1', name: 'República Dominicana', flag: '🇩🇴' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' }
]

const ChatbotSetupForm = ({ onSuccess }: ChatbotSetupFormProps) => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activating, setActivating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [chatbotTypes, setChatbotTypes] = useState<ChatbotTypeConfig[]>([])

    // Estados para número de WhatsApp separado
    const [countryCode, setCountryCode] = useState('+57') // Colombia por defecto
    const [localPhoneNumber, setLocalPhoneNumber] = useState('')

    const [config, setConfig] = useState<ChatbotConfig>({
        instanceName: '',
        chatbotType: 'SALES',
        isActive: true, // Activo por defecto
        n8nWebhookUrl: '',
        context: '',
        agentName: '',
        apiKey: ''
    })

    useEffect(() => {
        fetchConfig()
        fetchChatbotTypes()
        setInitialChatbotType()
    }, [])

    // Auto-verificar cada 5 segundos si hay QR code visible
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null

        // Solo hacer polling si hay QR y no está activo
        if (qrCode && !config.isActive) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axiosInstance.get('/api/chatbot/qr')
                    if (response.data) {
                        setConfig(response.data)

                        // Si ya no hay QR o está activo, mostrar mensaje de éxito
                        if (!response.data.qrCode || response.data.isActive) {
                            setQrCode(null)
                            setMessage({
                                type: 'success',
                                text: '✅ WhatsApp conectado correctamente'
                            })
                        } else if (response.data.qrCode) {
                            // Actualizar QR si cambió
                            setQrCode(response.data.qrCode)
                        }
                    }
                } catch (error) {
                    console.error('Error en auto-verificación:', error)
                }
            }, 5000) // Cada 5 segundos
        }

        // Cleanup: limpiar interval cuando el componente se desmonte o cambie el estado
        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [qrCode, config.isActive]) // Re-ejecutar cuando cambie qrCode o isActive

    // Establecer tipo de chatbot basado en el tipo de negocio del customer
    const setInitialChatbotType = () => {
        const user = userMethods.getUserLogin()
        if (user && user.customer && user.customer.businessType) {
            const chatbotType = BUSINESS_TYPE_TO_CHATBOT[user.customer.businessType]
            if (chatbotType) {
                setConfig(prev => ({ ...prev, chatbotType }))
            }
        }
    }

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/chatbot/config')
            if (response.data && response.data.id) {
                setConfig(response.data)
                if (response.data.qrCode) {
                    setQrCode(response.data.qrCode)
                }
            }
        } catch (error) {
            console.error('Error fetching chatbot config:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchChatbotTypes = async () => {
        try {
            const response = await axiosInstance.get('/chatbot-types/active')
            setChatbotTypes(response.data)
        } catch (error) {
            console.error('Error fetching chatbot types:', error)
        }
    }

    const handleChatbotTypeChange = (newType: ChatbotType) => {
        const typeConfig = chatbotTypes.find(t => t.typeName === newType)
        setConfig(prev => ({
            ...prev,
            chatbotType: newType,
            n8nWebhookUrl: typeConfig?.webhookUrl || prev.n8nWebhookUrl
        }))
    }

    const handleActivate = async () => {
        try {
            setActivating(true)
            setMessage(null)
            const response = await axiosInstance.post('/api/chatbot/activate')
            setConfig(response.data)
            if (response.data.qrCode) {
                setQrCode(response.data.qrCode)
                setMessage({ type: 'info', text: 'Escanea el código QR para conectar tu WhatsApp' })
            } else {
                setMessage({ type: 'success', text: 'Instancia creada correctamente' })
            }
        } catch (error) {
            console.error('Error activating chatbot:', error)
            setMessage({ type: 'error', text: 'Error al activar el chatbot' })
        } finally {
            setActivating(false)
        }
    }

    const handleCheckQr = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/chatbot/qr')
            if (response.data) {
                setConfig(response.data)
                if (response.data.qrCode) {
                    setQrCode(response.data.qrCode)
                } else {
                    setQrCode(null)
                    setMessage({ type: 'success', text: '✅ WhatsApp conectado exitosamente' })
                }
            }
        } catch (error) {
            console.error('Error checking QR:', error)
            setMessage({ type: 'error', text: 'Error al verificar QR' })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAndContinue = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            setMessage(null)

            // Combinar código de país + número local
            const fullPhoneNumber = countryCode + localPhoneNumber

            // Actualizar config con el número completo
            const configToSave = {
                ...config,
                phoneNumber: fullPhoneNumber
            }

            const response = await axiosInstance.post('/api/chatbot/config', configToSave)
            setConfig(response.data)
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' })

            // Llamar onSuccess después de guardar
            setTimeout(() => {
                if (onSuccess) onSuccess()
            }, 1000)
        } catch (error) {
            console.error('Error saving config:', error)
            setMessage({ type: 'error', text: 'Error al guardar la configuración' })
        } finally {
            setSaving(false)
        }
    }

    if (loading && !config.id) {
        return (
            <div className='flex justify-center items-center p-10'>
                <CircularProgress />
            </div>
        )
    }

    return (
        <Box>
            {message && (
                <Alert severity={message.type} sx={{ mb: 4 }}>
                    {message.text}
                </Alert>
            )}

            {!config.id ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography fontSize='4rem' className='mb-4'>🤖</Typography>
                    <Typography variant='h5' sx={{ mb: 3 }}>
                        Activa tu Chatbot IA
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
                        Se creará una instancia dedicada para tu WhatsApp Business
                    </Typography>
                    <Button
                        variant='contained'
                        size='large'
                        onClick={handleActivate}
                        disabled={activating}
                        startIcon={activating ? <CircularProgress size={20} /> : undefined}
                    >
                        {activating ? 'Activando...' : 'Activar Chatbot Ahora'}
                    </Button>
                </Box>
            ) : (
                <form onSubmit={handleSaveAndContinue}>
                    <Grid container spacing={4}>
                        {/* QR Code Section */}
                        {qrCode && !config.isActive && (
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
                            </Grid>
                        )}

                        {/* Campos ocultos pero con valores automáticos */}
                        {/* isActive: true por defecto */}
                        {/* instanceName: generado automáticamente */}
                        {/* chatbotType: seleccionado según tipo de negocio */}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Nombre del Agente'
                                value={config.agentName || ''}
                                onChange={e => setConfig({ ...config, agentName: e.target.value })}
                                placeholder='Ej: María, Bot de Ventas'
                                helperText='Nombre con el que se presentará el chatbot'
                            />
                        </Grid>

                        {/* Número de WhatsApp dividido en código de país y número local */}
                        <Grid item xs={12} sm={6} container spacing={1}>
                            <Grid item xs={5}>
                                <FormControl fullWidth>
                                    <InputLabel>País</InputLabel>
                                    <Select
                                        value={countryCode}
                                        label='País'
                                        onChange={e => setCountryCode(e.target.value)}
                                    >
                                        {SPANISH_SPEAKING_COUNTRIES.map(country => (
                                            <MenuItem key={country.code} value={country.code}>
                                                {country.flag} {country.code}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={7}>
                                <TextField
                                    fullWidth
                                    label='Número WhatsApp'
                                    value={localPhoneNumber}
                                    onChange={e => setLocalPhoneNumber(e.target.value)}
                                    placeholder='300 123 4567'
                                    helperText='Sin código de país'
                                />
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label='Contexto / Prompt del Sistema'
                                value={config.context}
                                onChange={e => setConfig({ ...config, context: e.target.value })}
                                placeholder='Eres un asistente de ventas experto en...'
                                helperText='Instrucciones para la IA sobre cómo comportarse'
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                type='submit'
                                variant='contained'
                                size='large'
                                disabled={saving}
                                fullWidth
                            >
                                {saving ? 'Guardando...' : 'Guardar y Continuar'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            )}
        </Box>
    )
}

export default ChatbotSetupForm
