'use client'

import { useState, useEffect } from 'react'
import { Grid, Typography, Card, CardContent, Button, Box, TextField, MenuItem, Divider, Radio, Avatar } from '@mui/material'
import { useSubscription } from '@/hooks/useSubscription'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-toastify'

interface StepBillingPlanProps {
    handleNext: () => void
    handleBack: () => void
    tenantId: number
    userId: number
}

const StepBillingPlan = ({ handleNext, handleBack, tenantId, userId }: StepBillingPlanProps) => {
    const { plans, fetchActivePlans, loading: loadingPlans } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState('CARD')
    const [loading, setLoading] = useState(false)
    
    // Billing Info State
    const [billingInfo, setBillingInfo] = useState({
        firstName: '',
        lastName: '',
        country: 'Colombia'
    })

    // Payment Data State
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' })
    const [nequiPhone, setNequiPhone] = useState('')

    useEffect(() => {
        fetchActivePlans().then(data => {
            if (data && data.length > 0) setSelectedPlan(data[0])
        })
    }, [fetchActivePlans])

    const handleConfirm = async () => {
        if (!selectedPlan) return toast.error('Selecciona un plan')
        
        setLoading(true)
        try {
            // Simulación de validación Wompi para los números de prueba proporcionados
            const cleanNumber = cardData.number.replace(/\s/g, '')
            if (paymentMethod === 'CARD') {
                if (cleanNumber === '4111111111111111') {
                    toast.error('Transacción declinada.')
                    setLoading(false)
                    return
                }
                if (cleanNumber !== '4242424242424242' && cleanNumber !== '') {
                    toast.error('Número de tarjeta no válido para pruebas.')
                    setLoading(false)
                    return
                }
            }

            // Flujo de activación de Trial (Lógica existente)
            const paymentMethodPayload = {
                tenantId,
                provider: 'WOMPI',
                paymentSourceId: `src_${paymentMethod.toLowerCase()}_` + Math.random().toString(36).substr(2, 9),
                token: 'tok_test_' + Math.random().toString(36).substr(2, 15),
                brand: paymentMethod === 'CARD' ? 'VISA' : paymentMethod,
                last4: paymentMethod === 'CARD' ? cleanNumber.slice(-4) : '0000',
                expMonth: 12,
                expYear: 28,
                isDefault: true
            }

            await axiosInstance.post('/internal/billing/payment-methods', paymentMethodPayload)
            const subRes = await axiosInstance.post(`/api/v1/subscriptions/users/${userId}/subscribe`, {
                planId: selectedPlan.id,
                isAutoRenew: true
            })
            
            await axiosInstance.post(`/internal/billing/subscriptions/${subRes.data.id}/activate-trial`)
            const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14)
            
            await axiosInstance.post('http://scheduler-service:8080/api/scheduler/billing/init', {
                tenantId,
                subscriptionId: subRes.data.id,
                trialEndsAt: trialEnd.toISOString()
            })

            toast.success('¡Trial de 30 días activado correctamente!')
            handleNext()
        } catch (err) {
            toast.error('Error al activar el plan.')
        } finally {
            setLoading(false)
        }
    }

    if (loadingPlans) return <Box sx={{ p: 10, textAlign: 'center' }}>Cargando planes...</Box>

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
            <Box sx={{ mb: 6 }}>
                <Typography variant='h4' fontWeight='800' color='primary' sx={{ mb: 1 }}>
                    Prueba CloudFly Studio AI GRATIS
                </Typography>
                <Typography variant='body1' color='textSecondary' display='flex' alignItems='center' gap={1}>
                    <i className='tabler-gift text-primary' /> Trial de 14 días incluido, cancela cuando quieras.
                </Typography>
            </Box>

            <Grid container spacing={6}>
                {/* COLUMN 1: BILLING INFO */}
                <Grid item xs={12} md={4}>
                    <Typography variant='subtitle1' fontWeight='700' sx={{ mb: 3 }}>Información de Facturación</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <TextField 
                            fullWidth label="Nombre (opcional)" variant="filled" 
                            value={billingInfo.firstName} onChange={e => setBillingInfo({...billingInfo, firstName: e.target.value})}
                        />
                        <TextField 
                            fullWidth label="Apellidos (opcional)" variant="filled" 
                            value={billingInfo.lastName} onChange={e => setBillingInfo({...billingInfo, lastName: e.target.value})}
                        />
                        <TextField 
                            fullWidth select label="País" variant="filled" 
                            value={billingInfo.country} onChange={e => setBillingInfo({...billingInfo, country: e.target.value})}
                        >
                            <MenuItem value="Colombia">Colombia</MenuItem>
                            <MenuItem value="Mexico">México</MenuItem>
                            <MenuItem value="USA">USA</MenuItem>
                        </TextField>
                    </Box>
                </Grid>

                {/* COLUMN 2: PAYMENT METHOD */}
                <Grid item xs={12} md={4}>
                    <Typography variant='subtitle1' fontWeight='700' sx={{ mb: 3 }}>Método de Pago</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* CARD OPTION */}
                        <Box 
                            onClick={() => setPaymentMethod('CARD')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'CARD' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'CARD' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <i className='tabler-credit-card text-xl text-slate-500' />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>Tarjeta de Crédito / Débito</Typography>
                            <Radio checked={paymentMethod === 'CARD'} size='small' />
                        </Box>

                        {paymentMethod === 'CARD' && (
                            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                <TextField size='small' fullWidth label="Número de Tarjeta" placeholder="4242 4242 4242 4242" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField size='small' label="MM/YY" placeholder="12/28" value={cardData.expiry} onChange={e => setCardData({...cardData, expiry: e.target.value})} />
                                    <TextField size='small' label="CVC" placeholder="123" value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value})} />
                                </Box>
                            </Box>
                        )}

                        {/* NEQUI OPTION */}
                        <Box 
                            onClick={() => setPaymentMethod('NEQUI')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'NEQUI' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'NEQUI' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Avatar src='/images/payments/nequi.png' sx={{ width: 32, height: 32, borderRadius: 1 }} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>Nequi</Typography>
                            <Radio checked={paymentMethod === 'NEQUI'} size='small' />
                        </Box>

                        {paymentMethod === 'NEQUI' && (
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                <TextField fullWidth size='small' label="Número de Celular Nequi" placeholder="3001234567" value={nequiPhone} onChange={e => setNequiPhone(e.target.value)} />
                            </Box>
                        )}

                        {/* BANCOLOMBIA OPTION */}
                        <Box 
                            onClick={() => setPaymentMethod('BANCOLOMBIA')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'BANCOLOMBIA' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'BANCOLOMBIA' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Avatar src='/images/payments/bancolombia.png' sx={{ width: 32, height: 32, borderRadius: 1 }} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>Bancolombia (Transferencia)</Typography>
                            <Radio checked={paymentMethod === 'BANCOLOMBIA'} size='small' />
                        </Box>

                        {/* PSE OPTION */}
                        <Box 
                            onClick={() => setPaymentMethod('PSE')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'PSE' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'PSE' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Avatar src='/images/payments/pse.png' sx={{ width: 32, height: 32, borderRadius: 1 }} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>PSE (Cualquier Banco)</Typography>
                            <Radio checked={paymentMethod === 'PSE'} size='small' />
                        </Box>
                    </Box>
                </Grid>

                {/* COLUMN 3: ORDER DETAILS */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', boxShadow: theme => theme.shadows[4] }}>
                        <CardContent sx={{ p: 6 }}>
                            <Typography variant='h6' fontWeight='700' sx={{ mb: 4 }}>Detalles del Pedido</Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-between', mb: 2 }}>
                                <Typography sx={{ flexGrow: 1 }}>{selectedPlan?.name || 'Suscripción Mensual'}</Typography>
                                <Typography fontWeight='700' color='success.main'>FREE TRIAL!</Typography>
                            </Box>
                            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 2 }}>
                                Costo posterior: $99.000 / mes
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-between', mb: 4 }}>
                                <Typography sx={{ flexGrow: 1 }} color='textSecondary'>Total hoy</Typography>
                                <Typography fontWeight='900' variant='h6'>$0.00</Typography>
                            </Box>

                            <Divider sx={{ my: 4 }} />
                            
                            <Button variant='text' color='primary' size='small' sx={{ mb: 6, textTransform: 'none' }}>
                                ¿Tienes un código promocional?
                            </Button>

                            <Button 
                                fullWidth variant='contained' size='large' color='success'
                                onClick={handleConfirm} disabled={loading}
                                sx={{ py: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: '800', textTransform: 'none' }}
                            >
                                {loading ? 'Activando...' : 'Activar Trial Gratuito ($0.00)'}
                            </Button>
                            
                            <Typography variant='caption' display='block' textAlign='center' sx={{ mt: 2, color: 'text.secondary' }}>
                                Cancela en cualquier momento
                            </Typography>

                            <Box sx={{ mt: 6 }}>
                                <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1.5, display: 'block' }}>
                                    <b>CloudFly Trial:</b> Tendrás acceso completo a todas las herramientas de IA. El trial se renovará automáticamente por <b>$99.000/mes</b> después de 14 días. Puedes cancelar antes de que termine el periodo de prueba para evitar cargos.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                <Button onClick={handleBack} startIcon={<i className='tabler-chevron-left' />}>Volver</Button>
                <Typography variant='caption'>Pagos procesados de forma segura por Wompi</Typography>
            </Box>
        </Box>
    )
}

export default StepBillingPlan
