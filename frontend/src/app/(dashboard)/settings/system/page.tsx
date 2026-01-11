'use client'

import { useState, useEffect } from 'react'
import {
    Box, Card, CardContent, Tabs, Tab, Typography,
    TextField, Button, Alert, CircularProgress,
    Grid, Switch, FormControlLabel, Divider
} from '@mui/material'
import {
    Settings as SettingsIcon,
    Facebook as FacebookIcon,
    Save as SaveIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`config-tabpanel-${index}`}
            aria-labelledby={`config-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

interface SystemConfig {
    id?: number
    systemName?: string
    systemDescription?: string
    logoUrl?: string
    supportEmail?: string
    supportPhone?: string
    termsOfService?: string
    privacyPolicy?: string
    facebookAppId?: string
    facebookAppSecret?: string
    facebookRedirectUri?: string
    facebookWebhookVerifyToken?: string
    facebookApiVersion?: string
    facebookEnabled?: boolean
}

export default function SystemConfigPage() {
    const [activeTab, setActiveTab] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Estado para el switch de DIAN (por Tenant)
    const [customerId, setCustomerId] = useState<number | null>(null)
    const [dianEnabled, setDianEnabled] = useState(false)

    const [config, setConfig] = useState<SystemConfig>({
        systemName: '',
        systemDescription: '',
        logoUrl: '',
        supportEmail: '',
        supportPhone: '',
        termsOfService: '',
        privacyPolicy: '',
        facebookAppId: '',
        facebookAppSecret: '',
        facebookRedirectUri: '',
        facebookWebhookVerifyToken: '',
        facebookApiVersion: 'v18.0',
        facebookEnabled: false
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)

            // 1. Cargar Configuración del Sistema (Global)
            try {
                const response = await axiosInstance.get<SystemConfig>('/api/system/config')
                if (response.data) {
                    setConfig(response.data)
                }
            } catch (err) {
                console.warn('No se pudo cargar la configuración del sistema (posible falta de permisos o no existe)', err)
            }

            // 2. Cargar Estado DIAN del Customer (Tenant)
            const user = userMethods.getUserLogin()
            if (user && user.customer) {
                setCustomerId(user.customer.id)
                // Obtenemos los datos frescos del cliente para asegurar el estado de esEmisorFE
                try {
                    const customerRes = await axiosInstance.get(`/customers/${user.customer.id}`)
                    if (customerRes.data) {
                        setDianEnabled(!!customerRes.data.esEmisorFE)
                    }
                } catch (e) {
                    console.error('Error cargando datos del cliente:', e)
                }
            }

        } catch (error: any) {
            console.error('Error loading data:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al cargar datos'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setMessage(null)

            const promises = []

            // Guardar Configuración Global
            // Solo intentamos guardar si tenemos algún dato cargado, aunque el endpoint debería manejar updates parciales si fuera necesario
            promises.push(axiosInstance.put('/api/system/config', config))

            // Guardar Configuración DIAN del Customer
            if (customerId) {
                // Primero obtenemos el cliente actual para no perder otros datos al hacer PUT
                const currentCustRes = await axiosInstance.get(`/customers/${customerId}`)
                const currentCust = currentCustRes.data

                const updatedCust = {
                    ...currentCust,
                    esEmisorFE: dianEnabled
                }

                promises.push(axiosInstance.put(`/customers/${customerId}`, updatedCust))
            }

            await Promise.all(promises)

            setMessage({
                type: 'success',
                text: '✅ Configuración guardada exitosamente'
            })

            // Recargar para obtener valores actualizados
            await loadData()
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

    const handleChange = (field: keyof SystemConfig) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value

        setConfig(prev => ({
            ...prev,
            [field]: value
        }))
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
                    ⚙️ Configuración del Sistema
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gestiona la configuración global, facturación electrónica e integraciones
                </Typography>
            </Box>

            {/* Message Alert */}
            {message && (
                <Alert
                    severity={message.type}
                    sx={{ mb: 3 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            {/* Tabs */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        aria-label="config tabs"
                    >
                        <Tab
                            icon={<SettingsIcon />}
                            label="Configuración General"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<FacebookIcon />}
                            label="Integración Facebook"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Tab 1: Configuración General */}
                <TabPanel value={activeTab} index={0}>
                    <CardContent>
                        {/* Sección Facturación Electrónica */}
                        {customerId && (
                            <>
                                <Box display="flex" alignItems="center" mb={3}>
                                    <ReceiptIcon sx={{ fontSize: 40, color: '#2e7d32', mr: 2 }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight="600">
                                            Facturación Electrónica DIAN
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Habilita o deshabilita la emisión de facturas electrónicas para tu organización
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={dianEnabled}
                                                    onChange={(e) => setDianEnabled(e.target.checked)}
                                                    color="success"
                                                />
                                            }
                                            label={
                                                <Typography fontWeight="500">
                                                    {dianEnabled ? 'Habilitado (Emisor de Facturación Electrónica)' : 'Deshabilitado'}
                                                </Typography>
                                            }
                                        />
                                        {dianEnabled && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                Al habilitar esta opción, se mostrarán los campos DIAN en la creación de clientes y facturas.
                                                Asegúrate de configurar tus resoluciones y certificados en la sección de Configuración DIAN.
                                            </Alert>
                                        )}
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 4 }} />
                            </>
                        )}

                        <Typography variant="h6" gutterBottom fontWeight="600">
                            Información del Sistema
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Configura los datos generales de tu instancia de CloudFly
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nombre del Sistema"
                                    value={config.systemName || ''}
                                    onChange={handleChange('systemName')}
                                    placeholder="CloudFly ERP"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Logo URL"
                                    value={config.logoUrl || ''}
                                    onChange={handleChange('logoUrl')}
                                    placeholder="https://example.com/logo.png"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Descripción"
                                    value={config.systemDescription || ''}
                                    onChange={handleChange('systemDescription')}
                                    placeholder="Sistema ERP Multi-tenant con IA"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom fontWeight="600">
                                    Información de Soporte
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email de Soporte"
                                    type="email"
                                    value={config.supportEmail || ''}
                                    onChange={handleChange('supportEmail')}
                                    placeholder="support@cloudfly.com"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono de Soporte"
                                    value={config.supportPhone || ''}
                                    onChange={handleChange('supportPhone')}
                                    placeholder="+57 300 123 4567"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom fontWeight="600">
                                    Políticas Legales
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Términos de Servicio (URL)"
                                    value={config.termsOfService || ''}
                                    onChange={handleChange('termsOfService')}
                                    placeholder="https://cloudfly.com/terms"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Política de Privacidad (URL)"
                                    value={config.privacyPolicy || ''}
                                    onChange={handleChange('privacyPolicy')}
                                    placeholder="https://cloudfly.com/privacy"
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </TabPanel>

                {/* Tab 2: Integración Facebook */}
                <TabPanel value={activeTab} index={1}>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={3}>
                            <FacebookIcon sx={{ fontSize: 40, color: '#1877F2', mr: 2 }} />
                            <Box>
                                <Typography variant="h6" fontWeight="600">
                                    Configuración de Facebook Messenger
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Configura los datos de tu App de Facebook para OAuth
                                </Typography>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                📋 ¿Dónde obtener estos datos?
                            </Typography>
                            <Typography variant="body2">
                                1. Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener">Facebook for Developers</a><br />
                                2. Selecciona tu app<br />
                                3. Ve a "Configuración → Básica"<br />
                                4. Copia el App ID y App Secret<br />
                                5. Configura el Redirect URI y Webhook Verify Token
                            </Typography>
                        </Alert>

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.facebookEnabled || false}
                                            onChange={handleChange('facebookEnabled')}
                                            color="primary"
                                        />
                                    }
                                    label="Habilitar integración de Facebook"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Facebook App ID"
                                    value={config.facebookAppId || ''}
                                    onChange={handleChange('facebookAppId')}
                                    placeholder="123456789012345"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Facebook App Secret"
                                    type="password"
                                    value={config.facebookAppSecret || ''}
                                    onChange={handleChange('facebookAppSecret')}
                                    placeholder="abc123def456..."
                                    required
                                    helperText="Se mostrará enmascarado por seguridad"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Redirect URI (OAuth Callback)"
                                    value={config.facebookRedirectUri || ''}
                                    onChange={handleChange('facebookRedirectUri')}
                                    placeholder="https://cloudfly.com/api/channels/facebook/callback"
                                    required
                                    helperText="Debe coincidir con el configurado en Facebook App"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Webhook Verify Token"
                                    value={config.facebookWebhookVerifyToken || ''}
                                    onChange={handleChange('facebookWebhookVerifyToken')}
                                    placeholder="cloudfly-webhook-secret-2025"
                                    required
                                    helperText="Token secreto para verificar webhooks"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Facebook API Version"
                                    value={config.facebookApiVersion || ''}
                                    onChange={handleChange('facebookApiVersion')}
                                    placeholder="v18.0"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                        📡 URL del Webhook (copiar a Facebook)
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontFamily: 'monospace',
                                            bgcolor: 'background.paper',
                                            p: 1,
                                            borderRadius: 1,
                                            mt: 1
                                        }}
                                    >
                                        https://api.cloudfly.com.co/webhooks/facebook
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                        Configura esta URL en: Facebook App → Messenger → Configuración → Webhooks
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </TabPanel>

                {/* Save Button */}
                <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                </Box>
            </Card>
        </Box>
    )
}
