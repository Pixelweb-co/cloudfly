'use client'

import { useState, useEffect } from 'react'
import { Grid, Typography, Card, CardContent, Button, Box, TextField, MenuItem, Divider, Radio } from '@mui/material'
import { useSubscription } from '@/hooks/useSubscription'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-toastify'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface StepBillingPlanProps {
    handleNext: () => void
    handleBack: () => void
    tenantId: number
    userId: number
}

const schema = yup.object().shape({
    firstName: yup.string(),
    lastName: yup.string(),
    country: yup.string().default('Colombia'),
    paymentMethod: yup.string().required(),
    billingCycle: yup.string().required(),

    cardName: yup.string().when('paymentMethod', {
        is: 'CARD',
        then: (s) => s.required('El nombre en la tarjeta es obligatorio')
    }),
    cardNumber: yup.string().when('paymentMethod', {
        is: 'CARD',
        then: (s) => s.required('El número de tarjeta es obligatorio')
            .matches(/^\d{13,19}$/, 'Debe tener entre 13 y 19 dígitos numéricos')
    }),
    cardExpiry: yup.string().when('paymentMethod', {
        is: 'CARD',
        then: (s) => s.required('Fecha de expiración obligatoria')
            .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Formato inválido (MM/YY)')
    }),
    cardCvc: yup.string().when('paymentMethod', {
        is: 'CARD',
        then: (s) => s.required('CVC obligatorio')
            .matches(/^\d{3,4}$/, 'CVC debe ser de 3 o 4 dígitos')
    }),

    nequiPhone: yup.string().when('paymentMethod', {
        is: 'NEQUI',
        then: (s) => s.required('Número de celular obligatorio')
            .matches(/^3\d{9}$/, 'Debe ser un celular válido (10 dígitos empezando por 3)')
    })
})

const StepBillingPlan = ({ handleNext, handleBack, tenantId, userId }: StepBillingPlanProps) => {
    const { plans, fetchActivePlans, loading: loadingPlans } = useSubscription()
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            country: 'Colombia',
            paymentMethod: 'CARD',
            billingCycle: 'MONTHLY',
            firstName: '',
            lastName: '',
            cardName: '',
            cardNumber: '',
            cardExpiry: '',
            cardCvc: '',
            nequiPhone: ''
        }
    })

    const paymentMethod = watch('paymentMethod')
    const billingCycle = watch('billingCycle')

    useEffect(() => {
        fetchActivePlans().then(data => {
            if (data && data.length > 0) setSelectedPlan(data[0])
        })
    }, [fetchActivePlans])

    // Pricing logic
    const baseMonthlyPrice = 99000
    const getFinalPrices = () => {
        if (billingCycle === 'SEMIANNUAL') return { monthly: baseMonthlyPrice * 0.97, total: baseMonthlyPrice * 6 * 0.97, savings: baseMonthlyPrice * 6 * 0.03 }
        if (billingCycle === 'ANNUAL') return { monthly: baseMonthlyPrice * 0.95, total: baseMonthlyPrice * 12 * 0.95, savings: baseMonthlyPrice * 12 * 0.05 }
        return { monthly: baseMonthlyPrice, total: baseMonthlyPrice, savings: 0 }
    }
    const prices = getFinalPrices()

    const onSubmit = async (data: any) => {
        if (!selectedPlan) return toast.error('Selecciona un plan')
        
        setLoading(true)
        try {
            let wompiToken = ''
            let brand = 'VISA'
            let last4 = '0000'

            if (data.paymentMethod === 'CARD') {
                // 1. Tokenización directa con Wompi vía API REST
                let expMonth = ''
                let expYear = ''
                const cleanExpiry = data.cardExpiry.replace(/[^0-9/]/g, '')
                if (cleanExpiry.includes('/')) {
                    const parts = cleanExpiry.split('/')
                    expMonth = (parts[0] || '').padStart(2, '0')
                    expYear = (parts[1] || '').slice(-2)
                } else if (cleanExpiry.length === 4) {
                    expMonth = cleanExpiry.substring(0, 2)
                    expYear = cleanExpiry.substring(2, 4)
                }

                const cardHolderName = data.cardName.trim() || ((data.firstName || '') + ' ' + (data.lastName || '')).trim() || 'Cliente CloudFly'

                const tokenPayload = {
                    number: data.cardNumber.replace(/[^0-9]/g, ''),
                    cvc: data.cardCvc.replace(/[^0-9]/g, ''),
                    exp_month: expMonth,
                    exp_year: expYear,
                    card_holder: cardHolderName
                }

                const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'pub_test_fGQ5uisyUhqe79cakGHXNKbdsr4K4EVI'
                const isProd = publicKey.startsWith('pub_prod_')
                const wompiBaseUrl = isProd ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'

                console.log('💳 [WOMPI-TOKENIZE] Tokenizing card directly via REST API:', wompiBaseUrl)

                const tokenRes = await fetch(`${wompiBaseUrl}/tokens/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${publicKey}`
                    },
                    body: JSON.stringify(tokenPayload)
                })

                if (!tokenRes.ok) {
                    const errorJson = await tokenRes.json()
                    console.error('❌ [WOMPI-TOKENIZE] Wompi tokenization failed:', errorJson)
                    let reason = 'Error al procesar los datos de la tarjeta.'
                    if (errorJson.error?.messages) {
                        const msgs = errorJson.error.messages
                        const fieldErrors = Object.keys(msgs).map(field => {
                            return `${field}: ${msgs[field].join(', ')}`
                        })
                        reason = `Campos inválidos en la tarjeta: ${fieldErrors.join(' | ')}`
                    }
                    throw new Error(reason)
                }

                const responseData = await tokenRes.json()
                const cardTokenObj = responseData.data

                console.log('✅ [WOMPI-TOKENIZE] Card tokenized successfully:', cardTokenObj.id)

                wompiToken = cardTokenObj.id
                brand = cardTokenObj.brand || 'VISA'
                last4 = tokenPayload.number.slice(-4)
            }

            // 2. Guardar método de pago + crear suscripción Trial (Plan ID 2)
            const expiryClean = data.cardExpiry ? data.cardExpiry.replace(/[^0-9/]/g, '') : '1228'
            const [expMonthClean, expYearClean] = expiryClean.length > 2 ? [expiryClean.substring(0, 2), expiryClean.substring(2, 4)] : ['12', '28']

            await axiosInstance.post('/customers/account-setup/payment', {
                tenantId,
                userId,
                wompiToken,
                brand,
                last4,
                expMonth: parseInt(expMonthClean, 10) || 12,
                expYear: parseInt('20' + (expYearClean?.slice(-2) || '28'), 10),
                billingCycle: data.billingCycle
            })

            toast.success('¡Trial activado correctamente!')
            handleNext()
        } catch (err: any) {
            console.error('Wompi/Payment Error:', err)
            toast.error(err.message || 'Error al procesar el pago')
        } finally {
            setLoading(false)
        }
    }

    if (loadingPlans) return <Box sx={{ p: 10, textAlign: 'center' }}>Cargando planes...</Box>

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
            <Box sx={{ mb: 6 }}>
                <Typography variant='h4' fontWeight='800' color='primary' sx={{ mb: 1 }}>
                    Prueba CloudFly Studio AI GRATIS
                </Typography>
                <Typography variant='body1' color='textSecondary' display='flex' alignItems='center' gap={1}>
                    <span><i className='tabler-gift text-primary' /> Trial de 14 días incluido, cancela cuando quieras.</span>
                </Typography>
            </Box>

            <Grid container spacing={6}>
                {/* COLUMN 1: BILLING INFO & CYCLE */}
                <Grid item xs={12} md={4}>
                    <Typography variant='subtitle1' fontWeight='700' sx={{ mb: 3 }}>Información de Facturación</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
                        <Controller name="firstName" control={control} render={({ field }) => (
                            <TextField {...field} fullWidth label="Nombre (opcional)" variant="filled" error={!!errors.firstName} helperText={errors.firstName?.message as string} />
                        )} />
                        <Controller name="lastName" control={control} render={({ field }) => (
                            <TextField {...field} fullWidth label="Apellidos (opcional)" variant="filled" error={!!errors.lastName} helperText={errors.lastName?.message as string} />
                        )} />
                        <Controller name="country" control={control} render={({ field }) => (
                            <TextField {...field} fullWidth select label="País" variant="filled" error={!!errors.country} helperText={errors.country?.message as string}>
                                <MenuItem value="Colombia">Colombia</MenuItem>
                                <MenuItem value="Mexico">México</MenuItem>
                                <MenuItem value="USA">USA</MenuItem>
                            </TextField>
                        )} />
                    </Box>

                    <Typography variant='subtitle1' fontWeight='700' sx={{ mb: 3 }}>Ciclo de Facturación</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box 
                            onClick={() => setValue('billingCycle', 'MONTHLY')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: billingCycle === 'MONTHLY' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: billingCycle === 'MONTHLY' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontWeight: 600 }}>Mensual</Typography>
                                <Typography variant='caption' color='textSecondary'>$99.000 COP / mes</Typography>
                            </Box>
                            <Radio checked={billingCycle === 'MONTHLY'} size='small' />
                        </Box>

                        <Box 
                            onClick={() => setValue('billingCycle', 'SEMIANNUAL')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: billingCycle === 'SEMIANNUAL' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: billingCycle === 'SEMIANNUAL' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontWeight: 600 }}>
                                    <span>Semestral </span>
                                    <span className='text-success text-xs ml-2'>(Ahorra 3%)</span>
                                </Typography>
                                <Typography variant='caption' color='textSecondary'>${(prices.monthly).toLocaleString()} COP / mes</Typography>
                            </Box>
                            <Radio checked={billingCycle === 'SEMIANNUAL'} size='small' />
                        </Box>

                        <Box 
                            onClick={() => setValue('billingCycle', 'ANNUAL')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: billingCycle === 'ANNUAL' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: billingCycle === 'ANNUAL' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontWeight: 600 }}>
                                    <span>Anual </span>
                                    <span className='text-success text-xs ml-2'>(Ahorra 5%)</span>
                                </Typography>
                                <Typography variant='caption' color='textSecondary'>${(prices.monthly).toLocaleString()} COP / mes</Typography>
                            </Box>
                            <Radio checked={billingCycle === 'ANNUAL'} size='small' />
                        </Box>
                    </Box>
                </Grid>

                {/* COLUMN 2: PAYMENT METHOD */}
                <Grid item xs={12} md={4}>
                    <Typography variant='subtitle1' fontWeight='700' sx={{ mb: 3 }}>Método de Pago</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* CARD OPTION */}
                        <Box 
                            onClick={() => setValue('paymentMethod', 'CARD')}
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
                                <Controller name="cardName" control={control} render={({ field }) => (
                                    <TextField {...field} size='small' fullWidth label="Nombre en la Tarjeta" placeholder="Juan Perez" error={!!errors.cardName} helperText={errors.cardName?.message as string} />
                                )} />
                                <Controller name="cardNumber" control={control} render={({ field }) => (
                                    <TextField {...field} size='small' fullWidth label="Número de Tarjeta" placeholder="4242 4242 4242 4242" error={!!errors.cardNumber} helperText={errors.cardNumber?.message as string} />
                                )} />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Controller name="cardExpiry" control={control} render={({ field }) => (
                                        <TextField {...field} size='small' label="MM/YY" placeholder="12/28" error={!!errors.cardExpiry} helperText={errors.cardExpiry?.message as string} />
                                    )} />
                                    <Controller name="cardCvc" control={control} render={({ field }) => (
                                        <TextField {...field} size='small' label="CVC" placeholder="123" error={!!errors.cardCvc} helperText={errors.cardCvc?.message as string} />
                                    )} />
                                </Box>
                            </Box>
                        )}

                        {/* NEQUI OPTION */}
                        <Box 
                            onClick={() => setValue('paymentMethod', 'NEQUI')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'NEQUI' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'NEQUI' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box component="img" src="/images/payments/nequi.png" sx={{ width: 32, height: 32, objectFit: 'contain' }} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>Nequi</Typography>
                            <Radio checked={paymentMethod === 'NEQUI'} size='small' />
                        </Box>

                        {paymentMethod === 'NEQUI' && (
                            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                <Controller name="nequiPhone" control={control} render={({ field }) => (
                                    <TextField {...field} fullWidth size='small' label="Número de Celular Nequi" placeholder="3001234567" error={!!errors.nequiPhone} helperText={errors.nequiPhone?.message as string} />
                                )} />
                            </Box>
                        )}

                        {/* BANCOLOMBIA OPTION */}
                        <Box 
                            onClick={() => setValue('paymentMethod', 'BANCOLOMBIA')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'BANCOLOMBIA' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'BANCOLOMBIA' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box component="img" src="/images/payments/bancolombia.png" sx={{ width: 32, height: 32, objectFit: 'contain' }} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>Bancolombia (Transferencia)</Typography>
                            <Radio checked={paymentMethod === 'BANCOLOMBIA'} size='small' />
                        </Box>

                        {/* PSE OPTION */}
                        <Box 
                            onClick={() => setValue('paymentMethod', 'PSE')}
                            sx={{ 
                                p: 3, border: '1px solid', borderColor: paymentMethod === 'PSE' ? 'primary.main' : 'divider',
                                borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                bgcolor: paymentMethod === 'PSE' ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box component="img" src="/images/payments/pse.png" sx={{ width: 32, height: 32, objectFit: 'contain' }} />
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
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography sx={{ flexGrow: 1 }}>{selectedPlan?.name || 'Suscripción CloudFly'}</Typography>
                                <Typography fontWeight='700' color='success.main'>FREE TRIAL!</Typography>
                            </Box>
                            
                            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 2 }}>
                                Ciclo: {billingCycle === 'MONTHLY' ? 'Mensual' : billingCycle === 'SEMIANNUAL' ? 'Semestral' : 'Anual'}
                            </Typography>

                            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 2 }}>
                                Costo posterior: ${prices.monthly.toLocaleString()} / mes
                            </Typography>
                            
                            {prices.savings > 0 && (
                                <Typography variant='caption' color='success.main' sx={{ display: 'block', mb: 2, fontWeight: 600 }}>
                                    Ahorro total: ${prices.savings.toLocaleString()} COP
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 4 }}>
                                <Typography sx={{ flexGrow: 1 }} color='textSecondary'>Total hoy</Typography>
                                <Typography fontWeight='900' variant='h6'>$0.00</Typography>
                            </Box>

                            <Divider sx={{ my: 4 }} />
                            
                            <Button variant='text' color='primary' size='small' sx={{ mb: 6, textTransform: 'none' }}>
                                ¿Tienes un código promocional?
                            </Button>

                            <Button 
                                type="submit" fullWidth variant='contained' size='large' color='success' disabled={loading}
                                sx={{ py: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: '800', textTransform: 'none' }}
                            >
                                <span>{loading ? 'Activando...' : 'Activar Trial Gratuito ($0.00)'}</span>
                            </Button>
                            
                            <Typography variant='caption' display='block' textAlign='center' sx={{ mt: 2, color: 'text.secondary' }}>
                                Cancela en cualquier momento
                            </Typography>

                            <Box sx={{ mt: 6 }}>
                                <Typography variant='caption' color='textSecondary' sx={{ lineHeight: 1.5, display: 'block' }}>
                                    <span><b>CloudFly Trial:</b> Tendrás acceso completo a todas las herramientas de IA. El trial se renovará automáticamente por </span>
                                    <b>{`$${prices.total.toLocaleString()} ${billingCycle === 'MONTHLY' ? '/ mes' : billingCycle === 'SEMIANNUAL' ? 'cada 6 meses' : 'cada 12 meses'}`}</b>
                                    <span> después de 14 días.</span>
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                <Button onClick={handleBack} startIcon={<i className='tabler-chevron-left' />}>Volver</Button>
                <Typography variant='caption'><span>Pagos procesados de forma segura por Wompi</span></Typography>
            </Box>
        </Box>
    )
}

export default StepBillingPlan
