'use client'

import React, { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    Grid,
    Button,
    Typography,
    MenuItem,
    FormControlLabel,
    Switch,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material'
import CustomTextField from '@/@core/components/mui/TextField'
import { axiosInstance } from '@/utils/axiosInstance'
import { useRouter } from 'next/navigation'

interface SubscriptionEditFormProps {
    subscriptionId: string
}

interface Module {
    id: number
    name: string
    description: string
}

interface Subscription {
    id: number
    tenantId: number
    tenantName: string
    planId: number
    planName: string
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    startDate: string
    endDate: string
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL'
    isAutoRenew: boolean
    moduleIds: number[]
    moduleNames: string[]
    effectiveAiTokensLimit: number
    effectiveElectronicDocsLimit: number
    effectiveUsersLimit: number
    effectiveAllowOverage: boolean
    effectiveAiOveragePricePer1k: number
    effectiveDocOveragePriceUnit: number
    monthlyPrice: number
    discountPercent: number
    notes: string | null
}

const SubscriptionEditForm: React.FC<SubscriptionEditFormProps> = ({ subscriptionId }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [availableModules, setAvailableModules] = useState<Module[]>([])
    const [selectedModules, setSelectedModules] = useState<number[]>([])

    // Cargar datos de la suscripción
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Cargar suscripción
                const subRes = await axiosInstance.get(`/api/v1/subscriptions/${subscriptionId}`)
                setSubscription(subRes.data)
                setSelectedModules(subRes.data.moduleIds || [])

                // Cargar módulos disponibles
                const modulesRes = await axiosInstance.get('/api/rbac/modules-list')
                setAvailableModules(modulesRes.data)
            } catch (err: any) {
                console.error('Error loading subscription:', err)
                setError(err.response?.data?.message || 'Error al cargar la suscripción')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [subscriptionId])

    const handleUpdateLimits = async () => {
        if (!subscription) return

        try {
            setSaving(true)
            setError(null)

            await axiosInstance.patch(`/api/v1/subscriptions/${subscriptionId}/limits`, {
                aiTokensLimit: subscription.effectiveAiTokensLimit,
                electronicDocsLimit: subscription.effectiveElectronicDocsLimit,
                usersLimit: subscription.effectiveUsersLimit
            })

            alert('Límites actualizados correctamente')
        } catch (err: any) {
            console.error('Error updating limits:', err)
            setError(err.response?.data?.message || 'Error al actualizar límites')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateModules = async () => {
        try {
            setSaving(true)
            setError(null)

            await axiosInstance.patch(`/api/v1/subscriptions/${subscriptionId}/modules`, {
                moduleIds: selectedModules
            })

            alert('Módulos actualizados correctamente')

            // Recargar suscripción
            const subRes = await axiosInstance.get(`/api/v1/subscriptions/${subscriptionId}`)
            setSubscription(subRes.data)
            setSelectedModules(subRes.data.moduleIds || [])
        } catch (err: any) {
            console.error('Error updating modules:', err)
            setError(err.response?.data?.message || 'Error al actualizar módulos')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleModule = (moduleId: number) => {
        setSelectedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        )
    }

    const handleCancelSubscription = async () => {
        if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return

        try {
            setSaving(true)
            await axiosInstance.patch(`/api/v1/subscriptions/${subscriptionId}/cancel`)
            alert('Suscripción cancelada')
            router.push('/administracion/suscripciones')
        } catch (err: any) {
            console.error('Error canceling subscription:', err)
            setError(err.response?.data?.message || 'Error al cancelar suscripción')
            setSaving(false)
        }
    }

    const handleRenewSubscription = async () => {
        try {
            setSaving(true)
            await axiosInstance.post(`/api/v1/subscriptions/${subscriptionId}/renew`)
            alert('Suscripción renovada')

            // Recargar suscripción
            const subRes = await axiosInstance.get(`/api/v1/subscriptions/${subscriptionId}`)
            setSubscription(subRes.data)
        } catch (err: any) {
            console.error('Error renewing subscription:', err)
            setError(err.response?.data?.message || 'Error al renovar suscripción')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleAutoRenew = async () => {
        if (!subscription) return

        try {
            // Actualización optimista
            const newState = !subscription.isAutoRenew
            setSubscription({ ...subscription, isAutoRenew: newState })

            await axiosInstance.patch(`/api/v1/subscriptions/${subscriptionId}/toggle-auto-renew`)
            // No necesitamos alerta, es una acción rápida
        } catch (err: any) {
            console.error('Error toggling auto-renew:', err)
            setError(err.response?.data?.message || 'Error al cambiar auto-renovación')
            // Revertir cambio
            setSubscription({ ...subscription, isAutoRenew: !subscription.isAutoRenew })
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <CircularProgress />
            </div>
        )
    }

    if (!subscription) {
        return (
            <Alert severity='error'>
                No se encontró la suscripción
            </Alert>
        )
    }

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4' sx={{ mb: 2 }}>
                    Editar Suscripción #{subscription.id}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Cliente: {subscription.tenantName} | Plan: {subscription.planName}
                </Typography>
            </Grid>

            {error && (
                <Grid item xs={12}>
                    <Alert severity='error' onClose={() => setError(null)}>
                        {error}
                    </Alert>
                </Grid>
            )}

            {/* Información General */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardHeader title='Información General' />
                    <CardContent>
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    label='Estado'
                                    value={subscription.status}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <Chip
                                                label={subscription.status}
                                                color={
                                                    subscription.status === 'ACTIVE'
                                                        ? 'success'
                                                        : subscription.status === 'TRIAL'
                                                            ? 'info'
                                                            : 'default'
                                                }
                                                size='small'
                                            />
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    label='Fecha de Inicio'
                                    value={new Date(subscription.startDate).toLocaleDateString()}
                                    InputProps={{ readOnly: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    label='Fecha de Fin'
                                    value={new Date(subscription.endDate).toLocaleDateString()}
                                    InputProps={{ readOnly: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    label='Ciclo de Facturación'
                                    value={subscription.billingCycle}
                                    InputProps={{ readOnly: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={subscription.isAutoRenew}
                                            onChange={handleToggleAutoRenew}
                                            disabled={saving}
                                        />
                                    }
                                    label='Renovación Automática'
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Límites y Configuración */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardHeader title='Límites de Uso' />
                    <CardContent>
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    type='number'
                                    label='Límite de Tokens AI'
                                    value={subscription.effectiveAiTokensLimit || ''}
                                    onChange={e =>
                                        setSubscription({
                                            ...subscription,
                                            effectiveAiTokensLimit: Number(e.target.value)
                                        })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    type='number'
                                    label='Límite de Documentos Electrónicos'
                                    value={subscription.effectiveElectronicDocsLimit || ''}
                                    onChange={e =>
                                        setSubscription({
                                            ...subscription,
                                            effectiveElectronicDocsLimit: Number(e.target.value)
                                        })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField
                                    fullWidth
                                    type='number'
                                    label='Límite de Usuarios'
                                    value={subscription.effectiveUsersLimit || ''}
                                    onChange={e =>
                                        setSubscription({
                                            ...subscription,
                                            effectiveUsersLimit: Number(e.target.value)
                                        })
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={subscription.effectiveAllowOverage}
                                            onChange={e =>
                                                setSubscription({
                                                    ...subscription,
                                                    effectiveAllowOverage: e.target.checked
                                                })
                                            }
                                        />
                                    }
                                    label='Permitir Sobrecostos'
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    onClick={handleUpdateLimits}
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Actualizar Límites'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Módulos */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader title='Módulos Incluidos' />
                    <CardContent>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                            Selecciona los módulos que estarán disponibles en esta suscripción
                        </Typography>
                        <Grid container spacing={2}>
                            {availableModules.map(module => (
                                <Grid item xs={12} sm={6} md={4} key={module.id}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            border: selectedModules.includes(module.id) ? '2px solid' : '1px solid',
                                            borderColor: selectedModules.includes(module.id) ? 'primary.main' : 'divider',
                                            bgcolor: selectedModules.includes(module.id) ? 'action.selected' : 'background.paper'
                                        }}
                                        onClick={() => handleToggleModule(module.id)}
                                    >
                                        <CardContent>
                                            <Typography variant='h6'>{module.name}</Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                {module.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Button
                            fullWidth
                            variant='contained'
                            onClick={handleUpdateModules}
                            disabled={saving}
                            sx={{ mt: 4 }}
                        >
                            {saving ? 'Guardando...' : 'Actualizar Módulos'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Acciones */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader title='Acciones de Suscripción' />
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    fullWidth
                                    variant='outlined'
                                    color='primary'
                                    onClick={handleRenewSubscription}
                                    disabled={saving || subscription.status !== 'ACTIVE'}
                                >
                                    Renovar Ahora
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    fullWidth
                                    variant='outlined'
                                    color='error'
                                    onClick={handleCancelSubscription}
                                    disabled={saving || subscription.status === 'CANCELLED'}
                                >
                                    Cancelar Suscripción
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    fullWidth
                                    variant='outlined'
                                    onClick={() => router.push('/administracion/suscripciones')}
                                >
                                    Volver
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default SubscriptionEditForm
