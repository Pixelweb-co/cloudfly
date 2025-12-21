'use client'

import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import OutlinedInput from '@mui/material/OutlinedInput'
import CustomTextField from '@core/components/mui/TextField'
import { PlanValues, PlanResponse } from '@/types/plans'
import { planService } from '@/services/plans/planService'
import { rbacService } from '@/services/rbac/rbacService'
import { useForm, Controller } from 'react-hook-form'

type Props = {
    open: boolean
    setOpen: (open: boolean) => void
    onClose: () => void
    data?: PlanResponse | null
}

const PlanForm = ({ open, setOpen, onClose, data }: Props) => {
    const [selectedModules, setSelectedModules] = useState<number[]>([])
    const [availableModules, setAvailableModules] = useState<any[]>([])
    const [allowOverage, setAllowOverage] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        watch
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
        const fetchModules = async () => {
            try {
                const modules = await rbacService.getAllModules()
                setAvailableModules(modules)
            } catch (error) {
                console.error('Error fetching modules:', error)
            }
        }
        if (open) {
            fetchModules()
        }
    }, [open])

    useEffect(() => {
        if (data) {
            reset({
                name: data.name,
                description: data.description,
                price: data.price,
                durationDays: data.durationDays,
                aiTokensLimit: data.aiTokensLimit,
                electronicDocsLimit: data.electronicDocsLimit,
                usersLimit: data.usersLimit,
                allowOverage: data.allowOverage,
                aiOveragePricePer1k: data.aiOveragePricePer1k,
                docOveragePriceUnit: data.docOveragePriceUnit,
                moduleIds: data.moduleIds ? Array.from(data.moduleIds) : []
            })
            setSelectedModules(data.moduleIds ? Array.from(data.moduleIds) : [])
            setAllowOverage(data.allowOverage || false)
        } else {
            reset({
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
            })
            setSelectedModules([])
            setAllowOverage(false)
        }
    }, [data, reset, open])

    const onSubmit = async (formData: PlanValues) => {
        try {
            const payload = {
                ...formData,
                moduleIds: selectedModules
            }

            if (data?.id) {
                await planService.updatePlan(data.id, payload)
            } else {
                await planService.createPlan(payload)
            }
            onClose()
            setOpen(false)
        } catch (error) {
            console.error('Error saving plan:', error)
        }
    }

    const handleClose = () => {
        setOpen(false)
        reset()
        setSelectedModules([])
    }

    const handleModuleChange = (event: any) => {
        const value = event.target.value
        setSelectedModules(typeof value === 'string' ? value.split(',').map(Number) : value)
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
            <DialogTitle>{data ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <div className='flex flex-col gap-5'>
                        {/* Información Básica */}
                        <div>
                            <h3 className='text-sm font-semibold mb-3'>Información Básica</h3>
                            <div className='flex flex-col gap-4'>
                                <Controller
                                    name='name'
                                    control={control}
                                    rules={{ required: 'El nombre es requerido' }}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            label='Nombre del Plan'
                                            placeholder='Ej. Plan Premium'
                                            error={!!errors.name}
                                            helperText={errors.name?.message}
                                        />
                                    )}
                                />

                                <Controller
                                    name='description'
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label='Descripción'
                                            placeholder='Detalles del plan...'
                                        />
                                    )}
                                />

                                <div className='flex gap-4'>
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
                                                label='Precio (COP)'
                                                InputProps={{ inputProps: { min: 0 } }}
                                                error={!!errors.price}
                                                helperText={errors.price?.message}
                                            />
                                        )}
                                    />

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
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Límites SaaS */}
                        <div>
                            <h3 className='text-sm font-semibold mb-3'>Límites de Consumo</h3>
                            <div className='flex flex-col gap-4'>
                                <Controller
                                    name='aiTokensLimit'
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            type='number'
                                            label='Límite Tokens IA (mensual)'
                                            placeholder='Ej. 100000'
                                            helperText='Tokens de IA incluidos por mes. Dejar vacío para sin límite.'
                                            InputProps={{ inputProps: { min: 0 } }}
                                        />
                                    )}
                                />

                                <Controller
                                    name='electronicDocsLimit'
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            type='number'
                                            label='Límite Documentos Electrónicos (mensual)'
                                            placeholder='Ej. 50'
                                            helperText='Facturas/nóminas electrónicas a DIAN por mes.'
                                            InputProps={{ inputProps: { min: 0 } }}
                                        />
                                    )}
                                />

                                <Controller
                                    name='usersLimit'
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            type='number'
                                            label='Límite de Usuarios'
                                            placeholder='Ej. 10'
                                            helperText='Número máximo de usuarios permitidos'
                                            InputProps={{ inputProps: { min: 1 } }}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <Divider />

                        {/* Sobrecostos */}
                        <div>
                            <h3 className='text-sm font-semibold mb-3'>Configuración de Sobrecostos</h3>
                            <div className='flex flex-col gap-4'>
                                <Controller
                                    name='allowOverage'
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={<Switch {...field} checked={field.value} />}
                                            label='Permitir Excedentes'
                                        />
                                    )}
                                />

                                {allowOverage && (
                                    <>
                                        <Controller
                                            name='aiOveragePricePer1k'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Precio por 1k Tokens IA (COP)'
                                                    placeholder='Ej. 500'
                                                    helperText='Costo por cada 1000 tokens adicionales'
                                                    InputProps={{ inputProps: { min: 0, step: '0.01' } }}
                                                />
                                            )}
                                        />

                                        <Controller
                                            name='docOveragePriceUnit'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Precio por Doc. Electrónico Adicional (COP)'
                                                    placeholder='Ej. 1000'
                                                    helperText='Costo por cada documento electrónico adicional'
                                                    InputProps={{ inputProps: { min: 0, step: '0.01' } }}
                                                />
                                            )}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <Divider />

                        {/* Selector de Módulos */}
                        <div>
                            <h3 className='text-sm font-semibold mb-3'>Módulos Incluidos</h3>
                            <FormControl fullWidth>
                                <InputLabel id='modules-label'>Módulos</InputLabel>
                                <Select
                                    labelId='modules-label'
                                    multiple
                                    value={selectedModules}
                                    onChange={handleModuleChange}
                                    input={<OutlinedInput label='Módulos' />}
                                    renderValue={(selected) =>
                                        availableModules
                                            .filter(m => selected.includes(m.moduleId))
                                            .map(m => m.moduleName)
                                            .join(', ')
                                    }
                                >
                                    {availableModules.map((module) => (
                                        <MenuItem key={module.moduleId} value={module.moduleId}>
                                            <Checkbox checked={selectedModules.indexOf(module.moduleId) > -1} />
                                            {module.moduleName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className='p-6 pt-0'>
                    <Button onClick={handleClose} variant='tonal' color='secondary'>
                        Cancelar
                    </Button>
                    <Button type='submit' variant='contained'>
                        {data ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default PlanForm
