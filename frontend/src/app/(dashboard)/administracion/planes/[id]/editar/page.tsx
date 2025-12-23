'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import OutlinedInput from '@mui/material/OutlinedInput'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CustomTextField from '@core/components/mui/TextField'
import { PlanValues, PlanResponse } from '@/types/plans'
import { planService } from '@/services/plans/planService'
import { rbacService } from '@/services/rbac/rbacService'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'

const EditPlanPage = () => {
    const router = useRouter()
    const params = useParams()
    const planId = Number(params.id)

    const [selectedModules, setSelectedModules] = useState<number[]>([])
    const [availableModules, setAvailableModules] = useState<any[]>([])
    const [allowOverage, setAllowOverage] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<PlanValues>({
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            aiTokensLimit: undefined,
            electronicDocsLimit: undefined,
            usersLimit: undefined,
            allowOverage: false,
            aiOveragePricePer1k: undefined,
            docOveragePriceUnit: undefined,
            moduleIds: []
        }
    })

    const watchAllowOverage = watch('allowOverage')

    useEffect(() => {
        setAllowOverage(watchAllowOverage || false)
    }, [watchAllowOverage])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                // Fetch modules
                const modules = await rbacService.getModulesList()
                setAvailableModules(modules)

                // Fetch plan data
                const planData = await planService.getPlanById(planId)

                // Populate form
                reset({
                    name: planData.name,
                    description: planData.description || '',
                    price: planData.price,
                    durationDays: planData.durationDays,
                    aiTokensLimit: planData.aiTokensLimit,
                    electronicDocsLimit: planData.electronicDocsLimit,
                    usersLimit: planData.usersLimit,
                    allowOverage: planData.allowOverage || false,
                    aiOveragePricePer1k: planData.aiOveragePricePer1k,
                    docOveragePriceUnit: planData.docOveragePriceUnit,
                    moduleIds: planData.moduleIds || []
                })

                setSelectedModules(planData.moduleIds || [])
            } catch (error) {
                console.error('Error fetching data:', error)
                toast.error('Error al cargar el plan')
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [planId, reset])

    const onSubmit = async (formData: PlanValues) => {
        try {
            setIsSubmitting(true)
            const payload = {
                ...formData,
                moduleIds: selectedModules
            }

            await planService.updatePlan(planId, payload)
            toast.success('Plan actualizado exitosamente')
            router.push('/administracion/planes')
        } catch (error) {
            console.error('Error updating plan:', error)
            toast.error('Error al actualizar plan')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleModuleChange = (event: any) => {
        const value = event.target.value
        setSelectedModules(typeof value === 'string' ? value.split(',').map(Number) : value)
    }

    if (isLoading) {
        return (
            <Box className='flex items-center justify-center min-h-screen'>
                <Typography>Cargando plan...</Typography>
            </Box>
        )
    }

    return (
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <Typography variant='h4' className='font-semibold mb-1'>
                        Editar Plan de Suscripción
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Modifica los límites, módulos y precios para este plan
                    </Typography>
                </div>
                <Button
                    variant='outlined'
                    color='secondary'
                    onClick={() => router.push('/administracion/planes')}
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
                                    <Grid item xs={12}>
                                        <Controller
                                            name='name'
                                            control={control}
                                            rules={{ required: 'El nombre es requerido' }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Nombre del Plan'
                                                    error={!!errors.name}
                                                    helperText={errors.name?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Controller
                                            name='description'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    label='Descripción'
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='price'
                                            control={control}
                                            rules={{
                                                required: 'El precio es requerido',
                                                min: { value: 0, message: 'El precio debe ser 0 o mayor' }
                                            }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Precio Mensual (COP)'
                                                    InputProps={{ inputProps: { min: 0, step: 1000 } }}
                                                    error={!!errors.price}
                                                    helperText={errors.price?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='durationDays'
                                            control={control}
                                            rules={{
                                                required: 'La duración es requerida',
                                                min: { value: 1, message: 'La duración debe ser al menos 1 día' }
                                            }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Duración (Días)'
                                                    InputProps={{ inputProps: { min: 1 } }}
                                                    error={!!errors.durationDays}
                                                    helperText={errors.durationDays?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Límites de Consumo */}
                        <Card className='mb-6'>
                            <CardHeader
                                title='Límites de Consumo'
                                subheader='Define las cuotas mensuales incluidas en el plan'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <Grid container spacing={5}>
                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='aiTokensLimit'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Tokens IA'
                                                    helperText='Por mes'
                                                    InputProps={{
                                                        inputProps: { min: 0 },
                                                        startAdornment: <i className='tabler-sparkles mr-2 text-primary' />
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='electronicDocsLimit'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Docs Electrónicos'
                                                    helperText='Facturas DIAN'
                                                    InputProps={{
                                                        inputProps: { min: 0 },
                                                        startAdornment: <i className='tabler-file-invoice mr-2 text-success' />
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='usersLimit'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Usuarios'
                                                    helperText='Máximo'
                                                    InputProps={{
                                                        inputProps: { min: 1 },
                                                        startAdornment: <i className='tabler-users mr-2 text-info' />
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Configuración de Sobrecostos */}
                        <Card>
                            <CardHeader
                                title='Configuración de Sobrecostos'
                                subheader='Define si se permiten excedentes y sus costos'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <Grid container spacing={5}>
                                    <Grid item xs={12}>
                                        <Controller
                                            name='allowOverage'
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            {...field}
                                                            checked={field.value}
                                                            color='primary'
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant='body1' className='font-medium'>
                                                                Permitir Excedentes
                                                            </Typography>
                                                            <Typography variant='caption' color='text.secondary'>
                                                                Los clientes podrán consumir más de lo incluido pagando el excedente
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {allowOverage && (
                                        <>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='aiOveragePricePer1k'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField
                                                            {...field}
                                                            fullWidth
                                                            type='number'
                                                            label='Precio por 1k Tokens IA'
                                                            helperText='Costo por cada 1000 tokens adicionales (COP)'
                                                            InputProps={{ inputProps: { min: 0, step: 100 } }}
                                                        />
                                                    )}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='docOveragePriceUnit'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField
                                                            {...field}
                                                            fullWidth
                                                            type='number'
                                                            label='Precio por Doc. Adicional'
                                                            helperText='Costo por documento electrónico extra (COP)'
                                                            InputProps={{ inputProps: { min: 0, step: 100 } }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                        </>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Columna Derecha */}
                    <Grid item xs={12} md={4}>
                        {/* Módulos Incluidos */}
                        <Card>
                            <CardHeader
                                title='Módulos del Sistema'
                                subheader='Selecciona los módulos que estarán disponibles'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <FormControl fullWidth>
                                    <InputLabel id='modules-label'>Módulos Incluidos</InputLabel>
                                    <Select
                                        labelId='modules-label'
                                        multiple
                                        value={selectedModules}
                                        onChange={handleModuleChange}
                                        input={<OutlinedInput label='Módulos Incluidos' />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {availableModules
                                                    .filter(m => selected.includes(m.id))
                                                    .map(m => (
                                                        <Chip
                                                            key={m.id}
                                                            label={m.name}
                                                            size='small'
                                                            color='primary'
                                                            variant='tonal'
                                                        />
                                                    ))
                                                }
                                            </Box>
                                        )}
                                    >
                                        {availableModules.map((module) => (
                                            <MenuItem key={module.id} value={module.id}>
                                                <Checkbox checked={selectedModules.indexOf(module.id) > -1} />
                                                <Box className='flex items-center gap-2'>
                                                    {module.icon && <i className={module.icon} />}
                                                    <Typography>{module.name}</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {selectedModules.length === 0 && (
                                    <Box className='mt-4 p-3 bg-warning-light rounded'>
                                        <Typography variant='caption' color='warning.main'>
                                            ⚠️ Selecciona al menos un módulo para que el plan sea funcional
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Footer con Botones */}
                <Box className='mt-6 flex items-center justify-end gap-4'>
                    <Button
                        variant='outlined'
                        color='secondary'
                        onClick={() => router.push('/administracion/planes')}
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
                        {isSubmitting ? 'Actualizando...' : 'Actualizar Plan'}
                    </Button>
                </Box>
            </form>
        </div>
    )
}

export default EditPlanPage
