'use client'

import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    Box,
    Switch,
    FormControlLabel,
    Divider,
    Chip,
    CircularProgress
} from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { Save, Facebook, Instagram, WhatsApp, MusicNote } from '@mui/icons-material'

interface CustomerConfig {
    id?: number
    customerId?: number

    // Facebook
    facebookAppId?: string
    facebookAppSecret?: string
    facebookLoginConfigId?: string
    facebookEnabled?: boolean

    // Instagram
    instagramAppId?: string
    instagramLoginConfigId?: string
    instagramEnabled?: boolean

    // WhatsApp
    evolutionApiUrl?: string
    evolutionApiKey?: string
    evolutionInstanceName?: string
    whatsappEnabled?: boolean

    // TikTok
    tiktokAppId?: string
    tiktokAppSecret?: string
    tiktokEnabled?: boolean

    // Helpers
    usesSharedFacebookApp?: boolean
    usesSharedEvolutionApi?: boolean
    isFacebookLoginConfigured?: boolean
    isInstagramLoginConfigured?: boolean
}

export default function IntegrationsPage() {
    const [config, setConfig] = useState<CustomerConfig>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get<CustomerConfig>('/api/customer-config')
            setConfig(response.data)
        } catch (error: any) {
            console.error('Error loading config:', error)
            setMessage({ type: 'error', text: 'Error al cargar configuración' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setMessage(null)
            await axiosInstance.put('/api/customer-config', config)
            setMessage({ type: 'success', text: '✅ Configuración guardada correctamente' })
            await loadConfig()
        } catch (error: any) {
            console.error('Error saving config:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al guardar configuración'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: keyof CustomerConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    🔗 Integraciones de Canales
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configura las credenciales y permisos para conectar canales de comunicación
                </Typography>
            </Box>

            {/* Messages */}
            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            {/* Facebook Messenger */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Facebook sx={{ fontSize: 40, color: '#0084FF' }} />
                        <Box flex={1}>
                            <Typography variant="h6" fontWeight="600">
                                Facebook Messenger
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configura Facebook Login for Business
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.facebookEnabled || false}
                                    onChange={(e) => handleChange('facebookEnabled', e.target.checked)}
                                />
                            }
                            label={config.facebookEnabled ? 'Habilitado' : 'Deshabilitado'}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {config.usesSharedFacebookApp && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            ℹ️ Actualmente usa la configuración global compartida. Deja los campos vacíos para continuar usando la configuración compartida.
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Facebook App ID (Opcional)"
                                value={config.facebookAppId || ''}
                                onChange={(e) => handleChange('facebookAppId', e.target.value)}
                                helperText="Deja vacío para usar la configuración global"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Facebook App Secret (Opcional)"
                                type="password"
                                value={config.facebookAppSecret || ''}
                                onChange={(e) => handleChange('facebookAppSecret', e.target.value)}
                                helperText="Deja vacío para usar la configuración global"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required={config.facebookEnabled}
                                label="Facebook Login Config ID"
                                value={config.facebookLoginConfigId || ''}
                                onChange={(e) => handleChange('facebookLoginConfigId', e.target.value)}
                                helperText="Obtén este ID desde Meta Developers Console → Login for Business → Configuraciones"
                                placeholder="123456789012345"
                            />
                        </Grid>
                    </Grid>

                    {config.isFacebookLoginConfigured && (
                        <Chip
                            label="✅ Configuración completa"
                            color="success"
                            sx={{ mt: 2 }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Instagram Direct */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Instagram sx={{ fontSize: 40, color: '#E4405F' }} />
                        <Box flex={1}>
                            <Typography variant="h6" fontWeight="600">
                                Instagram Direct Messages
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configura Instagram Login for Business
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.instagramEnabled || false}
                                    onChange={(e) => handleChange('instagramEnabled', e.target.checked)}
                                />
                            }
                            label={config.instagramEnabled ? 'Habilitado' : 'Deshabilitado'}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Instagram App ID (Opcional)"
                                value={config.instagramAppId || ''}
                                onChange={(e) => handleChange('instagramAppId', e.target.value)}
                                helperText="Deja vacío para usar el de Facebook"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required={config.instagramEnabled}
                                label="Instagram Login Config ID"
                                value={config.instagramLoginConfigId || ''}
                                onChange={(e) => handleChange('instagramLoginConfigId', e.target.value)}
                                helperText="Config ID específico para Instagram"
                                placeholder="987654321098765"
                            />
                        </Grid>
                    </Grid>

                    {config.isInstagramLoginConfigured && (
                        <Chip
                            label="✅ Configuración completa"
                            color="success"
                            sx={{ mt: 2 }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* WhatsApp Business */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <WhatsApp sx={{ fontSize: 40, color: '#25D366' }} />
                        <Box flex={1}>
                            <Typography variant="h6" fontWeight="600">
                                WhatsApp Business
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configura Evolution API
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.whatsappEnabled || false}
                                    onChange={(e) => handleChange('whatsappEnabled', e.target.checked)}
                                />
                            }
                            label={config.whatsappEnabled ? 'Habilitado' : 'Deshabilitado'}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {config.usesSharedEvolutionApi && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            ℹ️ Actualmente usa Evolution API compartida
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Evolution API URL (Opcional)"
                                value={config.evolutionApiUrl || ''}
                                onChange={(e) => handleChange('evolutionApiUrl', e.target.value)}
                                helperText="Deja vacío para usar la configuración global"
                                placeholder="https://api.evolution.com"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Evolution API Key (Opcional)"
                                type="password"
                                value={config.evolutionApiKey || ''}
                                onChange={(e) => handleChange('evolutionApiKey', e.target.value)}
                                helperText="Deja vacío para usar la configuración global"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* TikTok Business */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <MusicNote sx={{ fontSize: 40 }} />
                        <Box flex={1}>
                            <Typography variant="h6" fontWeight="600">
                                TikTok Business
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configura TikTok for Business API
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.tiktokEnabled || false}
                                    onChange={(e) => handleChange('tiktokEnabled', e.target.checked)}
                                />
                            }
                            label={config.tiktokEnabled ? 'Habilitado' : 'Deshabilitado'}
                        />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="TikTok App ID"
                                value={config.tiktokAppId || ''}
                                onChange={(e) => handleChange('tiktokAppId', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="TikTok App Secret"
                                type="password"
                                value={config.tiktokAppSecret || ''}
                                onChange={(e) => handleChange('tiktokAppSecret', e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Save Button */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                    variant="outlined"
                    onClick={loadConfig}
                    disabled={saving}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
            </Box>

            {/* Help Section */}
            <Card sx={{ mt: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📖 ¿Cómo obtener el Config ID?
                    </Typography>
                    <Typography variant="body2" paragraph>
                        1. Ve a <strong>Meta Developers Console</strong> (developers.facebook.com)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        2. Selecciona tu app → <strong>Login for Business</strong> → <strong>Configuraciones</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                        3. Crea una configuración con <strong>System User Access Token</strong>
                    </Typography>
                    <Typography variant="body2">
                        4. Copia el <strong>Configuration ID</strong> generado (ej: 123456789012345)
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    )
}
