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
import { toast } from 'react-hot-toast'
import subscriptionService from '@/services/subscriptions/subscriptionService'
import type { SubscriptionResponse } from '@/types/subscriptions'

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

    // TODO: Obtener tenantId del usuario autenticado
    const TENANT_ID = 1

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const subscriptionData = await subscriptionService.getActiveTenantSubscription(TENANT_ID)
                setSubscription(subscriptionData)

                // TODO: Obtener datos reales de uso desde un endpoint de consumo
                // Por ahora uso datos simulados
                setUsage({
                    aiTokensUsed: Math.floor(Math.random() * (subscriptionData.effectiveAiTokensLimit || 100000)),
                    docsUsed: Math.floor(Math.random() * (subscriptionData.effectiveElectronicDocsLimit || 50)),
                    usersActive: Math.floor(Math.random() * (subscriptionData.effectiveUsersLimit || 10))
                })
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
            <Box className='flex items-center justify-center min-h-screen'>
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
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div>
                <Typography variant='h4' className='font-semibold mb-1'>
                    Dashboard de Consumo
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Monitoreo de uso y límites de tu suscripción actual
                </Typography>
            </div>

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
                            variant='tonal'
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
                <Alert severity='warning' icon={<i className='tabler-alert-triangle' />}>
                    <strong>Atención:</strong> Estás cerca de exceder tus límites. Se aplicarán sobrecostos:
                    <ul className='mt-2'>
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
                <Alert severity='error' icon={<i className='tabler-ban' />}>
                    <strong>Límite próximo:</strong> Al alcanzar el 100% del límite, no podrás usar más este recurso.
                    Contacta al administrador para ampliar tu plan.
                </Alert>
            )}

            {/* Consumption Cards */}
            <Grid container spacing={6}>
                {/* AI Tokens */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardHeader
                            title='Tokens IA'
                            avatar={<i className='tabler-sparkles text-4xl text-primary' />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box className='mb-4'>
                                <Box className='flex items-center justify-between mb-2'>
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
                                    className='h-2 rounded'
                                />
                                <Typography variant='caption' color='text.secondary' className='mt-1'>
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
                    <Card>
                        <CardHeader
                            title='Documentos Electrónicos'
                            avatar={<i className='tabler-file-invoice text-4xl text-success' />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box className='mb-4'>
                                <Box className='flex items-center justify-between mb-2'>
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
                                    className='h-2 rounded'
                                />
                                <Typography variant='caption' color='text.secondary' className='mt-1'>
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
                    <Card>
                        <CardHeader
                            title='Usuarios Activos'
                            avatar={<i className='tabler-users text-4xl text-info' />}
                            titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                            <Box className='mb-4'>
                                <Box className='flex items-center justify-between mb-2'>
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
                                    className='h-2 rounded'
                                />
                                <Typography variant='caption' color='text.secondary' className='mt-1'>
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
                    avatar={<i className='tabler-bulb text-warning' />}
                />
                <CardContent>
                    {aiPercentage > 80 && (
                        <Typography variant='body2' className='mb-2'>
                            • Considera ampliar tu límite de tokens IA o optimizar el uso de funcionalidades de IA.
                        </Typography>
                    )}
                    {docsPercentage > 80 && (
                        <Typography variant='body2' className='mb-2'>
                            • Estás cerca del límite de documentos electrónicos. Considera upgrade a un plan superior.
                        </Typography>
                    )}
                    {usersPercentage > 80 && (
                        <Typography variant='body2' className='mb-2'>
                            • El número de usuarios activos está cerca del límite. Contacta al administrador para ampliar.
                        </Typography>
                    )}
                    {aiPercentage < 80 && docsPercentage < 80 && usersPercentage < 80 && (
                        <Typography variant='body2' color='success.main'>
                            ✓ Tu consumo está dentro de los límites saludables. ¡Sigue así!
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ConsumptionDashboard
