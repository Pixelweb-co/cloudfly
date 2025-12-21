'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import OutlinedInput from '@mui/material/OutlinedInput'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CustomTextField from '@core/components/mui/TextField'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import subscriptionService from '@/services/subscriptions/subscriptionService'
import { planService } from '@/services/plans/planService'
import { rbacService } from '@/services/rbac/rbacService'
import customerService from '@/services/customers/customerService'
import { BillingCycle } from '@/types/subscriptions'
import type { PlanResponse } from '@/types/plans'
import type { Customer } from '@/types/customers'

interface SubscriptionFormValues {
    planId: number
    tenantId: number
    billingCycle: BillingCycle
    isAutoRenew: boolean
    customModuleIds: number[]
    customAiTokensLimit?: number
    customElectronicDocsLimit?: number
    customUsersLimit?: number
    customMonthlyPrice?: number
    discountPercent?: number
    notes?: string
}

const NewSubscriptionPage = () => {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [plans, setPlans] = useState<PlanResponse[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [availableModules, setAvailableModules] = useState<any[]>([])
    const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null)
    const [customizeLimits, setCustomizeLimits] = useState(false)
    const [customizeModules, setCustomizeModules] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue
    } = useForm<SubscriptionFormValues>({
        defaultValues: {
            planId: 0,
            tenantId: 0,
            billingCycle: BillingCycle.MONTHLY,
            isAutoRenew: false,
            customModuleIds: [],
            notes: ''
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansData, modulesData, customersData] = await Promise.all([
                    planService.getAllPlans(),
                    rbacService.getModulesList(),
                    customerService.getActiveCustomers()
                ])
                setPlans(plansData)
                setAvailableModules(modulesData)
                setCustomers(customersData)
            } catch (error) {
                console.error('Error fetching data:', error)
                toast.error('Error al cargar datos')
            }
        }
        fetchData()
    }, [])

    const watchPlanId = watch('planId')
    const watchBillingCycle = watch('billingCycle')

    // Calculate total price based on plan and billing cycle
    const calculateTotalPrice = (planPrice: number, billingCycle: BillingCycle): number => {
        switch (billingCycle) {
            case BillingCycle.MONTHLY:
                return planPrice * 1
            case BillingCycle.QUARTERLY:
                return planPrice * 3
            case BillingCycle.SEMI_ANNUAL:
                return planPrice * 6
            case BillingCycle.ANNUAL:
                return planPrice * 12
            case BillingCycle.CUSTOM:
                return planPrice
            default:
                return planPrice
        }
    }

    useEffect(() => {
        if (watchPlanId) {
            const plan = plans.find(p => p.id === watchPlanId)
            setSelectedPlan(plan || null)
            if (plan && !customizeModules) {
                setValue('customModuleIds', plan.moduleIds || [])
            }
        }
    }, [watchPlanId, plans, customizeModules, setValue])

    // Auto-calculate price when plan or billing cycle changes
    useEffect(() => {
        if (selectedPlan && watchBillingCycle) {
            const calculatedPrice = calculateTotalPrice(selectedPlan.price, watchBillingCycle)
            setValue('customMonthlyPrice', calculatedPrice)
        }
    }, [selectedPlan, watchBillingCycle, setValue])

    const onSubmit = async (formData: SubscriptionFormValues) => {
        try {
            setIsSubmitting(true)

            const payload = {
                planId: formData.planId,
                tenantId: formData.tenantId,
                billingCycle: formData.billingCycle,
                isAutoRenew: formData.isAutoRenew,
                customModuleIds: customizeModules ? formData.customModuleIds : undefined,
                customAiTokensLimit: customizeLimits ? formData.customAiTokensLimit : undefined,
                customElectronicDocsLimit: customizeLimits ? formData.customElectronicDocsLimit : undefined,
                customUsersLimit: customizeLimits ? formData.customUsersLimit : undefined,
                customMonthlyPrice: formData.customMonthlyPrice,
                discountPercent: formData.discountPercent,
                notes: formData.notes
            }

            await subscriptionService.createSubscription(payload)
            toast.success('Suscripción creada exitosamente')
            router.push('/administracion/suscripciones')
        } catch (error) {
            console.error('Error creating subscription:', error)
            toast.error('Error al crear suscripción')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <Typography variant='h4' className='font-semibold mb-1'>
                        Nueva Suscripción
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Crear una suscripción basada en un plan con opciones de customización
                    </Typography>
                </div>
                <Button
                    variant='outlined'
                    color='secondary'
                    onClick={() => router.push('/administracion/suscripciones')}
                >
                    Cancelar
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={6}>
                    {/* Columna Izquierda */}
                    <Grid item xs={12} md={8}>
                        {/* Información Básica */}
                        <Card className='mb-6'>
                            <CardHeader
                                title='Información Básica'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <Grid container spacing={5}>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='tenantId'
                                            control={control}
                                            rules={{ required: 'El cliente es requerido', min: { value: 1, message: 'Selecciona un cliente' } }}
                                            render={({ field }) => (
                                                <FormControl fullWidth error={!!errors.tenantId}>
                                                    <InputLabel>Cliente (Tenant)</InputLabel>
                                                    <Select {...field} label='Cliente (Tenant)'>
                                                        <MenuItem value={0}>Seleccionar...</MenuItem>
                                                        {customers.map(customer => (
                                                            <MenuItem key={customer.id} value={customer.id}>
                                                                {customer.name} {customer.nit ? `- ${customer.nit}` : ''}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.tenantId && (
                                                        <Typography variant='caption' color='error' className='mt-1'>
                                                            {errors.tenantId.message}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='planId'
                                            control={control}
                                            rules={{ required: 'El plan es requerido', min: { value: 1, message: 'Selecciona un plan' } }}
                                            render={({ field }) => (
                                                <FormControl fullWidth error={!!errors.planId}>
                                                    <InputLabel>Plan Base</InputLabel>
                                                    <Select {...field} label='Plan Base'>
                                                        <MenuItem value={0}>Seleccionar...</MenuItem>
                                                        {plans.map(plan => (
                                                            <MenuItem key={plan.id} value={plan.id}>
                                                                {plan.name} - ${plan.price}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='billingCycle'
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel>Ciclo de Facturación</InputLabel>
                                                    <Select {...field} label='Ciclo de Facturación'>
                                                        <MenuItem value={BillingCycle.MONTHLY}>Mensual</MenuItem>
                                                        <MenuItem value={BillingCycle.QUARTERLY}>Trimestral</MenuItem>
                                                        <MenuItem value={BillingCycle.SEMI_ANNUAL}>Semestral</MenuItem>
                                                        <MenuItem value={BillingCycle.ANNUAL}>Anual</MenuItem>
                                                        <MenuItem value={BillingCycle.CUSTOM}>Personalizado</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='customMonthlyPrice'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Precio Total del Periodo'
                                                    placeholder='Se calcula automáticamente'
                                                    helperText='Calculado según plan y periodo. Editable manualmente.'
                                                    InputProps={{
                                                        startAdornment: <Typography className='mr-1'>$</Typography>,
                                                        inputProps: { min: 0, step: 0.01 }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='discountPercent'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Descuento (%)'
                                                    placeholder='0'
                                                    InputProps={{
                                                        endAdornment: <Typography className='ml-1'>%</Typography>,
                                                        inputProps: { min: 0, max: 100, step: 0.01 }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='isAutoRenew'
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label='Renovación Automática'
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Controller
                                            name='notes'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label='Notas'
                                                    placeholder='Información adicional...'
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Customización de Límites */}
                        <Card className='mb-6'>
                            <CardHeader
                                title='Límites de Consumo'
                                subheader={customizeLimits ? 'Límites customizados' : 'Se usarán los límites del plan seleccionado'}
                                titleTypographyProps={{ variant: 'h6' }}
                                action={
                                    <Switch
                                        checked={customizeLimits}
                                        onChange={(e) => setCustomizeLimits(e.target.checked)}
                                    />
                                }
                            />
                            {customizeLimits && (
                                <CardContent>
                                    <Grid container spacing={5}>
                                        <Grid item xs={12} sm={4}>
                                            <Controller
                                                name='customAiTokensLimit'
                                                control={control}
                                                render={({ field }) => (
                                                    <CustomTextField
                                                        {...field}
                                                        fullWidth
                                                        type='number'
                                                        label='Tokens IA Custom'
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Controller
                                                name='customElectronicDocsLimit'
                                                control={control}
                                                render={({ field }) => (
                                                    <CustomTextField
                                                        {...field}
                                                        fullWidth
                                                        type='number'
                                                        label='Docs Electrónicos Custom'
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Controller
                                                name='customUsersLimit'
                                                control={control}
                                                render={({ field }) => (
                                                    <CustomTextField
                                                        {...field}
                                                        fullWidth
                                                        type='number'
                                                        label='Usuarios Custom'
                                                        InputProps={{ inputProps: { min: 1 } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            )}
                        </Card>
                    </Grid>

                    {/* Columna Derecha */}
                    <Grid item xs={12} md={4}>
                        {/* Módulos */}
                        <Card className='mb-6'>
                            <CardHeader
                                title='Módulos'
                                subheader={customizeModules ? 'Módulos customizados' : 'Módulos del plan'}
                                titleTypographyProps={{ variant: 'h6' }}
                                action={
                                    <Switch
                                        checked={customizeModules}
                                        onChange={(e) => setCustomizeModules(e.target.checked)}
                                    />
                                }
                            />
                            <CardContent>
                                <Controller
                                    name='customModuleIds'
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel>Módulos</InputLabel>
                                            <Select
                                                {...field}
                                                multiple
                                                disabled={!customizeModules}
                                                input={<OutlinedInput label='Módulos' />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {availableModules
                                                            .filter(m => selected.includes(m.id))
                                                            .map(m => (
                                                                <Chip key={m.id} label={m.name} size='small' />
                                                            ))}
                                                    </Box>
                                                )}
                                            >
                                                {availableModules.map((module) => (
                                                    <MenuItem key={module.id} value={module.id}>
                                                        <Checkbox checked={field.value.indexOf(module.id) > -1} />
                                                        {module.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Resumen del Plan Seleccionado */}
                        {selectedPlan && (
                            <Card>
                                <CardHeader
                                    title='Resumen de Suscripción'
                                    titleTypographyProps={{ variant: 'h6' }}
                                />
                                <CardContent>
                                    <Typography variant='body2' color='text.secondary' className='mb-2'>
                                        <strong>Plan Base:</strong> {selectedPlan.name}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' className='mb-2'>
                                        <strong>Precio Mensual:</strong> ${selectedPlan.price}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' className='mb-2'>
                                        <strong>Periodo:</strong> {watchBillingCycle === BillingCycle.MONTHLY ? 'Mensual' :
                                            watchBillingCycle === BillingCycle.QUARTERLY ? 'Trimestral (3 meses)' :
                                                watchBillingCycle === BillingCycle.SEMI_ANNUAL ? 'Semestral (6 meses)' :
                                                    watchBillingCycle === BillingCycle.ANNUAL ? 'Anual (12 meses)' : 'Personalizado'}
                                    </Typography>
                                    <Typography variant='body2' color='primary.main' className='mb-3'>
                                        <strong>Precio Total:</strong> ${watch('customMonthlyPrice') || 0}
                                    </Typography>
                                    <hr className='my-3' />
                                    <Typography variant='body2' color='text.secondary' className='mb-2'>
                                        <strong>Tokens IA:</strong> {selectedPlan.aiTokensLimit?.toLocaleString() || 'Sin límite'}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' className='mb-2'>
                                        <strong>Docs:</strong> {selectedPlan.electronicDocsLimit || 'Sin límite'}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        <strong>Usuarios:</strong> {selectedPlan.usersLimit || 'Sin límite'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

                {/* Footer */}
                <Box className='mt-6 flex items-center justify-end gap-4'>
                    <Button
                        variant='outlined'
                        color='secondary'
                        onClick={() => router.push('/administracion/suscripciones')}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <i className='tabler-loader-2 animate-spin' /> : <i className='tabler-check' />}
                    >
                        {isSubmitting ? 'Creando...' : 'Crear Suscripción'}
                    </Button>
                </Box>
            </form>
        </div>
    )
}

export default NewSubscriptionPage
