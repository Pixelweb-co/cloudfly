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
import { ChannelConfig, ChannelConfigType, ChannelTypeConfig } from '@/types/apps/channelConfigTypes'
import { axiosInstance } from '@/utils/axiosInstance'

const ChannelSettings = () => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activating, setActivating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [channelTypes, setChannelTypes] = useState<ChannelTypeConfig[]>([])

    const [config, setConfig] = useState<ChannelConfig>({
        instanceName: '',
        channelType: 'SALES',
        isActive: false,
        n8nWebhookUrl: '',
        context: '',
        agentName: '',
        apiKey: ''
    })

    useEffect(() => {
        fetchConfig()
        fetchChannelTypes()
    }, [])

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/channel-config/config')
            if (response.data && response.data.id) {
                setConfig(response.data)
                if (response.data.qrCode) {
                    setQrCode(response.data.qrCode)
                }
            } else {
                // No configuration exists yet - use defaults
                setConfig({
                    instanceName: '',
                    channelType: 'SALES',
                    isActive: false,
                    n8nWebhookUrl: '',
                    context: '',
                    agentName: '',
                    apiKey: ''
                })
            }
        } catch (error) {
            console.error('Error fetching channel config:', error)
            // On error, also set defaults so UI renders
            setConfig({
                instanceName: '',
                channelType: 'SALES',
                isActive: false,
                n8nWebhookUrl: '',
                context: '',
                agentName: '',
                apiKey: ''
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchChannelTypes = async () => {
        try {
            const response = await axiosInstance.get('/api/channel-types/active')
            setChannelTypes(response.data)
        } catch (error) {
            console.error('Error fetching channel types:', error)
        }
    }

    const handleChannelTypeChange = (newType: ChannelConfigType) => {
        // Find the corresponding channel type config
        const typeConfig = channelTypes.find(t => t.typeName === newType)

        // Update both the type and the webhook URL
        setConfig(prev => ({
            ...prev,
            channelType: newType,
            n8nWebhookUrl: typeConfig?.webhookUrl || prev.n8nWebhookUrl
        }))
    }

    const handleActivate = async () => {
        try {
            setActivating(true)
            setMessage(null)
            const response = await axiosInstance.post('/api/channel-config/activate')
            setConfig(response.data)
            if (response.data.qrCode) {
                setQrCode(response.data.qrCode)
                setMessage({ type: 'info', text: 'Escanea el código QR para conectar tu WhatsApp' })
            } else {
                setMessage({ type: 'success', text: 'Instancia creada correctamente. Verifica la conexión.' })
            }
        } catch (error) {
            console.error('Error activating channel:', error)
            setMessage({ type: 'error', text: 'Error al activar el canal' })
        } finally {
            setActivating(false)
        }
    }

    const handleCheckQr = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/channel-config/qr')
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
            const response = await axiosInstance.post('/api/channel-config/config', config)
            setConfig(response.data)
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
        } catch (error) {
            console.error('Error saving config:', error)
            setMessage({ type: 'error', text: 'Error al guardar la configuración' })
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        if (!confirm('¿Estás seguro de que quieres desconectar el canal?')) return

        try {
            setLoading(true)
            setMessage(null)
            const response = await axiosInstance.post('/api/channel-config/logout')
            setConfig(response.data)
            setQrCode(null)
            setMessage({ type: 'success', text: 'Canal desconectado exitosamente' })
        } catch (error) {
            console.error('Error disconnecting channel:', error)
            setMessage({ type: 'error', text: 'Error al desconectar el canal' })
        } finally {
            setLoading(false)
        }
    }

    const handleRestart = async () => {
        try {
            setLoading(true)
            setMessage(null)
            const response = await axiosInstance.post('/api/channel-config/restart')
            setConfig(response.data)
            if (response.data.qrCode) {
                setQrCode(response.data.qrCode)
                setMessage({ type: 'info', text: 'Canal reiniciado. Escanea el nuevo código QR' })
            } else {
                setMessage({ type: 'success', text: 'Canal reiniciado exitosamente' })
            }
        } catch (error) {
            console.error('Error restarting channel:', error)
            setMessage({ type: 'error', text: 'Error al reiniciar el canal' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres ELIMINAR la instancia del canal? Esta acción no se puede deshacer.')) return

        try {
            setLoading(true)
            setMessage(null)
            await axiosInstance.delete('/api/channel-config')
            setConfig({
                id: undefined,
                tenantId: undefined,
                instanceName: '',
                channelType: 'SALES',
                isActive: false,
                n8nWebhookUrl: '',
                context: '',
                agentName: '',
                qrCode: undefined
            })
            setQrCode(null)
            setMessage({ type: 'success', text: 'Instancia eliminada exitosamente' })
            fetchConfig() // Refresh
        } catch (error) {
            console.error('Error deleting channel:', error)
            setMessage({ type: 'error', text: 'Error al eliminar la instancia' })
        } finally {
            setLoading(false)
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
                        title='Configuración de Canales IA'
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
                                    Activa tu Canal de Comunicación IA para comenzar
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
                                    {activating ? <CircularProgress size={24} /> : 'Activar Canal Ahora'}
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
                                                    label={config.isActive ? 'Canal Habilitado' : 'Canal Deshabilitado'}
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
                                                    <InputLabel>Tipo de Canal</InputLabel>
                                                    <Select
                                                        value={config.channelType}
                                                        label='Tipo de Canal'
                                                        onChange={e => handleChannelTypeChange(e.target.value as ChannelConfigType)}
                                                    >
                                                        {channelTypes.map(type => (
                                                            <MenuItem key={type.id} value={type.typeName}>
                                                                {type.description || type.typeName}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label='Nombre del Agente'
                                                    value={config.agentName || ''}
                                                    onChange={e => setConfig({ ...config, agentName: e.target.value })}
                                                    placeholder='Ej: María, Asistente Virtual, Bot de Ventas'
                                                    helperText='Nombre con el que se presentará el agente a los usuarios'
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

                                            {/* Gestión de Instancia */}
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant='h6' sx={{ mb: 3 }}>
                                                    Gestión de Instancia
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    <Button
                                                        variant='outlined'
                                                        color='warning'
                                                        onClick={handleLogout}
                                                        disabled={loading || !config.isActive}
                                                    >
                                                        🔌 Desconectar WhatsApp
                                                    </Button>
                                                    <Button
                                                        variant='outlined'
                                                        color='info'
                                                        onClick={handleRestart}
                                                        disabled={loading}
                                                    >
                                                        🔄 Reconectar / Generar Nuevo QR
                                                    </Button>
                                                    <Button
                                                        variant='outlined'
                                                        color='error'
                                                        onClick={handleDelete}
                                                        disabled={loading}
                                                    >
                                                        🗑️ Eliminar Instancia
                                                    </Button>
                                                </Box>
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

export default ChannelSettings
