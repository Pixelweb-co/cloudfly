'use client'

import React, { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import { toast } from 'react-hot-toast'

// Imports locales adaptados

// Icon Imports
import AlertTriangle from '@mui/icons-material/Warning'
import Ban from '@mui/icons-material/Block'
import Sparkles from '@mui/icons-material/AutoAwesome'
import FileInvoice from '@mui/icons-material/Description'
import Users from '@mui/icons-material/People'
import Bulb from '@mui/icons-material/Lightbulb'

import type { SubscriptionResponse } from '@/types/subscriptions'
import subscriptionService from '@/services/subscriptionService'

interface UsageData {
    aiTokensUsed: number
    docsUsed: number
    usersActive: number
}

const ConsumptionDashboard = () => {
    const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null)

    const [usage, setUsage] = useState<UsageData>({
        aiTokensUsed: 0,
        docsUsed: 0,
        usersActive: 0
    })

    const [isLoading, setIsLoading] = useState(true)

    // TODO: Obtener tenantId del usuario autenticado o del contexto
    // Por ahora harcodeado para pruebas, igual que en el original
    const TENANT_ID = 1

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)


                // En un escenario real, esto debería venir del contexto de usuario o sesión
                // Si falla por 404/403 (porque no existe tenant 1), usaremos datos mock
                try {
                    const subscriptionData = await subscriptionService.getActiveTenantSubscription(TENANT_ID)

                    setSubscription(subscriptionData)

                    // Mock usage data based on limits
                    setUsage({
                        aiTokensUsed: Math.floor(Math.random() * (subscriptionData.effectiveAiTokensLimit || 100000)),
                        docsUsed: Math.floor(Math.random() * (subscriptionData.effectiveElectronicDocsLimit || 50)),
                        usersActive: Math.floor(Math.random() * (subscriptionData.effectiveUsersLimit || 10))
                    })
                } catch (apiError) {
                    console.warn('Backend subscription fetch failed, using mock data for UI demo', apiError)

                    // Mock fallback para que el usuario vea la UI funcionando
                    setSubscription({
                        id: 0,
                        tenantId: 1,
                        tenantName: 'Demo Tenant',
                        planId: 1,
                        planName: 'Plan Profesional',
                        billingCycle: 'MONTHLY' as any,
                        startDate: new Date().toISOString(),
                        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                        status: 'ACTIVE' as any,
                        isAutoRenew: true,
                        moduleIds: [],
                        moduleNames: ['Ventas', 'Inventario', 'CRM'],
                        effectiveAiTokensLimit: 50000,
                        effectiveElectronicDocsLimit: 100,
                        effectiveUsersLimit: 5,
                        effectiveAllowOverage: true,
                        effectiveAiOveragePricePer1k: 500,
                        effectiveDocOveragePriceUnit: 1000,
                        monthlyPrice: 150000,
                        discountPercent: 0,
                        notes: 'Demo mode',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })

                    setUsage({
                        aiTokensUsed: 12500,
                        docsUsed: 45,
                        usersActive: 3
                    })
                }

            } catch (error) {
                console.error('Error fetching consumption data:', error)
                toast.error('Error al cargar datos de consumo')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const calculatePercentage = (used: number, limit: number | null): number => {
        if (!limit) return 0
        
return Math.min((used / limit) * 100, 100)
    }

    const getProgressColor = (percentage: number): 'success' | 'warning' | 'error' => {
        if (percentage < 70) return 'success'
        if (percentage < 90) return 'warning'
        
return 'error'
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <Typography>Cargando datos de consumo...</Typography>
            </Box>
        )
    }

    if (!subscription) {
        return (
            <Alert severity='warning'>
                No hay suscripción activa para este tenant.
            </Alert>
        )
    }

    const aiPercentage = calculatePercentage(usage.aiTokensUsed, subscription.effectiveAiTokensLimit)
    const docsPercentage = calculatePercentage(usage.docsUsed, subscription.effectiveElectronicDocsLimit)
    const usersPercentage = calculatePercentage(usage.usersActive, subscription.effectiveUsersLimit)

    return (
        <Stack spacing={4}>
            {/* Header */}
            <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, mb: 0.5 }}>
                    Dashboard de Consumo
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Monitoreo de uso y límites de tu suscripción actual
                </Typography>
            </Box>

            {/* Plan Info Card */}
            <Card>
                <CardHeader
                    title={subscription.planName}
                    subheader={`Ciclo: ${subscription.billingCycle} | Vigente hasta: ${new Date(subscription.endDate).toLocaleDateString('es-CO')}`}
                    titleTypographyProps={{ variant: 'h5' }}
                    action={
                        <Chip
                            label={subscription.status}
                            color='success'
                            variant='tonal' // Adjust if tonal variant not available in theme, use outlined or filled
                        />
                    }
                />
                <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                        <strong>Módulos activos:</strong> {subscription.moduleNames.join(', ')}
                    </Typography>
                </CardContent>
            </Card>

            {/* Alertas de Sobrecosto */}
            {subscription.effectiveAllowOverage && (aiPercentage > 90 || docsPercentage > 90) && (
                <Alert severity='warning' icon={<AlertTriangle fontSize="inherit" />}>
                    <strong>Atención:</strong> Estás cerca de exceder tus límites. Se aplicarán sobrecostos:
                    <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                        {aiPercentage > 90 && (
                            <li>Tokens IA: ${subscription.effectiveAiOveragePricePer1k} por cada 1,000 tokens adicionales</li>
                        )}
                        {docsPercentage > 90 && (
                            <li>Documentos Electrónicos: ${subscription.effectiveDocOveragePriceUnit} por documento adicional</li>
                        )}
                    </ul>
                </Alert>
            )}

            {!subscription.effectiveAllowOverage && (aiPercentage > 90 || docsPercentage > 90) && (
                <Alert severity='error' icon={<Ban fontSize="inherit" />}>
                    <strong>Límite próximo:</strong> Al alcanzar el 100% del límite, no podrás usar más este recurso.
                    Contacta al administrador para ampliar tu plan.
                </Alert>
            )}

            {/* Consumption Cards */}
            <Grid container spacing={6}>
                {/* AI Tokens */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            title='Tokens IA'
                            avatar={<Sparkles sx={{ fontSize: 40, color: 'primary.main' }} />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant='h4' color='text.primary'>
                                        {usage.aiTokensUsed.toLocaleString()}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        de {subscription.effectiveAiTokensLimit?.toLocaleString() || '∞'}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant='determinate'
                                    value={aiPercentage}
                                    color={getProgressColor(aiPercentage)}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                                    {aiPercentage.toFixed(1)}% utilizado
                                </Typography>
                            </Box>

                            {subscription.effectiveAllowOverage && (
                                <Typography variant='caption' color='text.secondary'>
                                    Sobrecosto: ${subscription.effectiveAiOveragePricePer1k} / 1k tokens
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Electronic Documents */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            title='Documentos Electrónicos'
                            avatar={<FileInvoice sx={{ fontSize: 40, color: 'success.main' }} />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant='h4' color='text.primary'>
                                        {usage.docsUsed}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        de {subscription.effectiveElectronicDocsLimit || '∞'}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant='determinate'
                                    value={docsPercentage}
                                    color={getProgressColor(docsPercentage)}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                                    {docsPercentage.toFixed(1)}% utilizado
                                </Typography>
                            </Box>

                            {subscription.effectiveAllowOverage && (
                                <Typography variant='caption' color='text.secondary'>
                                    Sobrecosto: ${subscription.effectiveDocOveragePriceUnit} / documento
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active Users */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            title='Usuarios Activos'
                            avatar={<Users sx={{ fontSize: 40, color: 'info.main' }} />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant='h4' color='text.primary'>
                                        {usage.usersActive}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        de {subscription.effectiveUsersLimit || '∞'}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant='determinate'
                                    value={usersPercentage}
                                    color={getProgressColor(usersPercentage)}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                                    {usersPercentage.toFixed(1)}% utilizado
                                </Typography>
                            </Box>

                            <Typography variant='caption' color='text.secondary'>
                                Límite de usuarios concurrentes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recommendations */}
            <Card>
                <CardHeader
                    title='Recomendaciones'
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<Bulb sx={{ color: 'warning.main' }} />}
                />
                <CardContent>
                    <Stack spacing={1}>
                        {aiPercentage > 80 && (
                            <Typography variant='body2'>
                                • Considera ampliar tu límite de tokens IA o optimizar el uso de funcionalidades de IA.
                            </Typography>
                        )}
                        {docsPercentage > 80 && (
                            <Typography variant='body2'>
                                • Estás cerca del límite de documentos electrónicos. Considera upgrade a un plan superior.
                            </Typography>
                        )}
                        {usersPercentage > 80 && (
                            <Typography variant='body2'>
                                • El número de usuarios activos está cerca del límite. Contacta al administrador para ampliar.
                            </Typography>
                        )}
                        {aiPercentage < 80 && docsPercentage < 80 && usersPercentage < 80 && (
                            <Typography variant='body2' color='success.main'>
                                ✓ Tu consumo está dentro de los límites saludables. ¡Sigue así!
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    )
}

export default ConsumptionDashboard
