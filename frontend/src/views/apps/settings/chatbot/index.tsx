'use client'

import React, { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
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
    Divider,
    Box
} from '@mui/material'
import { ChatbotConfig, ChatbotType } from '@/types/apps/chatbotTypes'
import axiosInstance from '@/utils/axiosInterceptor'

const ChatbotSettings = () => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activating, setActivating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)

    const [config, setConfig] = useState<ChatbotConfig>({
        instanceName: '',
        chatbotType: 'SALES',
        isActive: false,
        n8nWebhookUrl: '',
        context: '',
        apiKey: ''
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/chatbot/config')
            if (response.data) {
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
                setMessage({ type: 'success', text: 'Instancia creada correctamente. Verifica la conexión.' })
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
                    setMessage({ type: 'info', text: 'Código QR actualizado' })
                } else {
                    setQrCode(null)
                    setMessage({ type: 'success', text: 'Conexión establecida (No se requiere QR)' })
                }
            }
        } catch (error) {
            console.error('Error checking QR:', error)
            setMessage({ type: 'error', text: 'Error al obtener el código QR' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setMessage(null)
            const response = await axiosInstance.post('/api/chatbot/config', config)
            setConfig(response.data)
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
        } catch (error) {
            console.error('Error saving config:', error)
            setMessage({ type: 'error', text: 'Error al guardar la configuración' })
        } finally {
            setSaving(false)
        }
    }

    if (loading && !config.id) {
        return (
            <div className='flex justify-center items-center h-full p-10'>
                <CircularProgress />
            </div>
        )
    }

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Card>
                    <CardHeader
                        title='Configuración de Chatbot IA'
                        subheader='Gestiona tu asistente virtual inteligente'
                        action={
                            config.id ? (
                                <Button
                                    variant='outlined'
                                    color={config.isActive ? 'success' : 'warning'}
                                    onClick={fetchConfig}
                                >
                                    {config.isActive ? 'Activo' : 'Inactivo / Desconectado'}
                                </Button>
                            ) : null
                        }
                    />
                    <Divider />
                    <CardContent>
                        {message && (
                            <Alert severity={message.type} sx={{ mb: 4 }}>
                                {message.text}
                            </Alert>
                        )}

                        {!config.id ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Typography variant='h5' sx={{ mb: 3 }}>
                                    Activa tu Chatbot IA para comenzar
                                </Typography>
                                <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
                                    Al activar, se creará una instancia dedicada para tu negocio y podrás conectar tu WhatsApp.
                                </Typography>
                                <Button
                                    variant='contained'
                                    size='large'
                                    onClick={handleActivate}
                                    disabled={activating}
                                >
                                    {activating ? <CircularProgress size={24} /> : 'Activar Chatbot Ahora'}
                                </Button>
                            </Box>
                        ) : (
                            <Grid container spacing={6}>
                                {/* QR Code Section */}
                                {qrCode && !config.isActive && (
                                    <Grid item xs={12} display='flex' justifyContent='center' flexDirection='column' alignItems='center'>
                                        <Typography variant='h6' sx={{ mb: 2 }}>
                                            Escanea este código QR con tu WhatsApp
                                        </Typography>
                                        <Box
                                            component='img'
                                            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                            alt='WhatsApp QR Code'
                                            sx={{ width: 250, height: 250, mb: 2, border: '1px solid #ddd', borderRadius: 1 }}
                                        />
                                        <Button variant='outlined' onClick={handleCheckQr} sx={{ mt: 2 }}>
                                            Actualizar QR / Verificar Conexión
                                        </Button>
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                                        <Grid container spacing={5}>
                                            <Grid item xs={12}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={config.isActive}
                                                            onChange={e => setConfig({ ...config, isActive: e.target.checked })}
                                                        />
                                                    }
                                                    label={config.isActive ? 'Chatbot Habilitado' : 'Chatbot Deshabilitado'}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label='Nombre de Instancia'
                                                    value={config.instanceName}
                                                    disabled
                                                    helperText='Generado automáticamente por el sistema'
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Tipo de Chatbot</InputLabel>
                                                    <Select
                                                        value={config.chatbotType}
                                                        label='Tipo de Chatbot'
                                                        onChange={e => setConfig({ ...config, chatbotType: e.target.value as ChatbotType })}
                                                    >
                                                        <MenuItem value='SALES'>Ventas (Ecommerce)</MenuItem>
                                                        <MenuItem value='SUPPORT'>Soporte al Cliente</MenuItem>
                                                        <MenuItem value='SCHEDULING'>Agendamiento</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label='URL del Webhook n8n'
                                                    value={config.n8nWebhookUrl}
                                                    onChange={e => setConfig({ ...config, n8nWebhookUrl: e.target.value })}
                                                    placeholder='https://autobot.cloudfly.com.co/webhook/...'
                                                    helperText='URL predeterminada para el flujo de trabajo'
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={6}
                                                    label='Contexto / Prompt del Sistema'
                                                    value={config.context}
                                                    onChange={e => setConfig({ ...config, context: e.target.value })}
                                                    placeholder='Eres un asistente de ventas experto en...'
                                                    helperText='Instrucciones base para la IA sobre cómo comportarse.'
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Button type='submit' variant='contained' size='large' disabled={saving}>
                                                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </Grid>
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default ChatbotSettings
