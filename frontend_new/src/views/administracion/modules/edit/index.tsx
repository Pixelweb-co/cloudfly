'use client'

import React, { useEffect, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-hot-toast'

import CustomTextField from '@core/components/mui/TextField'
import { moduleService } from '@/services/modules/moduleService'
import type { ModuleCreateRequest } from '@/types/modules'

// Esquema de validación con Yup
const schema = yup.object().shape({
    name: yup.string().required('El nombre es requerido'),
    code: yup.string()
        .required('El código es requerido')
        .matches(/^[A-Z0-9_]+$/, 'Solo mayúsculas, números y guiones bajos'),
    description: yup.string(),
    icon: yup.string().required('Debe seleccionar un icono'),
    menuPath: yup.string().required('La ruta principal es requerida'),
    displayOrder: yup.number().typeError('Debe ser un número').min(0, 'No puede ser negativo'),
    menuItemsList: yup.array().of(
        yup.object().shape({
            name: yup.string().required('Nombre del item requerido'),
            path: yup.string().required('La ruta es requerida')
        })
    )
})

interface FormType extends Omit<ModuleCreateRequest, 'menuItems'> {
    menuItemsList: { name: string; path: string }[]
}

const EditModuleView = () => {
    const router = useRouter()
    const params = useParams()
    const moduleId = Number(params.id)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm<FormType>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            name: '',
            code: '',
            description: '',
            icon: '',
            menuPath: '',
            displayOrder: 0,
            menuItemsList: []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'menuItemsList'
    })

    const selectedIcon = watch('icon')

    useEffect(() => {
        const fetchModule = async () => {
            try {
                setIsLoading(true)
                const moduleData = await moduleService.getModuleById(moduleId)

                let parsedMenuItems: { name: string; path: string }[] = []

                if (moduleData.menuItems) {
                    try {
                        const rawItems = JSON.parse(moduleData.menuItems)
                        parsedMenuItems = rawItems.map((item: any) => ({
                            name: item.label || item.name || '',
                            path: item.href || item.path || ''
                        }))
                    } catch (e) {
                        console.error('Error parsing menuItems:', e)
                    }
                }

                reset({
                    name: moduleData.name,
                    code: moduleData.code,
                    description: moduleData.description || '',
                    icon: moduleData.icon || '',
                    menuPath: moduleData.menuPath || '',
                    displayOrder: moduleData.displayOrder,
                    menuItemsList: parsedMenuItems
                })
            } catch (error) {
                console.error('Error fetching module:', error)
                toast.error('Error al cargar el módulo')
            } finally {
                setIsLoading(false)
            }
        }

        fetchModule()
    }, [moduleId, reset])

    const onSubmit = async (formData: FormType) => {
        try {
            setIsSubmitting(true)

            // Serialize menuItemsList to JSON string (label/href format for backend)
            const dbMenuItems = formData.menuItemsList.map(item => ({
                label: item.name,
                href: item.path
            }))

            const menuItemsJson = dbMenuItems.length > 0 ? JSON.stringify(dbMenuItems) : undefined

            const { menuItemsList, ...rest } = formData

            await moduleService.updateModule(moduleId, {
                ...rest,
                menuItems: menuItemsJson
            })

            toast.success('Módulo actualizado exitosamente')
            router.push('/administracion/modules')
        } catch (error) {
            console.error('Error updating module:', error)
            toast.error('Error al actualizar módulo')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <Box className='flex items-center justify-center min-h-screen'>
                <Typography>Cargando módulo...</Typography>
            </Box>
        )
    }

    return (
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <Typography variant='h4' className='font-semibold mb-1'>
                        Editar Módulo
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Modifica la configuración de este módulo del sistema
                    </Typography>
                </div>
                <Button
                    variant='outlined'
                    color='secondary'
                    onClick={() => router.push('/administracion/modules')}
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
                                title='Información del Módulo'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <Grid container spacing={5}>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='name'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Nombre del Módulo'
                                                    error={!!errors.name}
                                                    helperText={errors.name?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='code'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Código Único'
                                                    placeholder='VENTAS'
                                                    error={!!errors.code}
                                                    helperText={errors.code?.message}
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                                                    rows={3}
                                                    label='Descripción'
                                                    error={!!errors.description}
                                                    helperText={errors.description?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={8}>
                                        <Controller
                                            name='menuPath'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Ruta del Menú'
                                                    placeholder='/ventas'
                                                    error={!!errors.menuPath}
                                                    helperText={errors.menuPath?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <Controller
                                            name='displayOrder'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Orden'
                                                    error={!!errors.displayOrder}
                                                    helperText={errors.displayOrder?.message}
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Items del Menú */}
                        <Card>
                            <CardHeader
                                title='Items del Menú'
                                subheader='Agrega sub-items para este módulo (opcional)'
                                titleTypographyProps={{ variant: 'h6' }}
                                action={
                                    <Button
                                        variant='contained'
                                        size='small'
                                        startIcon={<i className='tabler-plus' />}
                                        onClick={() => append({ name: '', path: '' })}
                                    >
                                        Agregar Item
                                    </Button>
                                }
                            />
                            <CardContent>
                                {fields.length === 0 ? (
                                    <Box className='p-6 text-center border-2 border-dashed rounded-lg'>
                                        <Typography variant='body2' color='text.secondary'>
                                            No hay items agregados. Haz clic en "Agregar Item" para comenzar.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <div className='flex flex-col gap-4'>
                                        {fields.map((item, index) => (
                                            <Box key={item.id} className='p-4 border rounded-lg'>
                                                <div className='flex items-start gap-4'>
                                                    <div className='flex-1'>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} sm={6}>
                                                                <Controller
                                                                    name={`menuItemsList.${index}.name`}
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <CustomTextField
                                                                            {...field}
                                                                            fullWidth
                                                                            size='small'
                                                                            label='Nombre del Item'
                                                                            error={!!errors.menuItemsList?.[index]?.name}
                                                                            helperText={errors.menuItemsList?.[index]?.name?.message}
                                                                        />
                                                                    )}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Controller
                                                                    name={`menuItemsList.${index}.path`}
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <CustomTextField
                                                                            {...field}
                                                                            fullWidth
                                                                            size='small'
                                                                            label='Ruta'
                                                                            error={!!errors.menuItemsList?.[index]?.path}
                                                                            helperText={errors.menuItemsList?.[index]?.path?.message}
                                                                        />
                                                                    )}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </div>
                                                    <IconButton
                                                        color='error'
                                                        onClick={() => remove(index)}
                                                        size='small'
                                                        className='mt-6'
                                                    >
                                                        <i className='tabler-trash' />
                                                    </IconButton>
                                                </div>
                                            </Box>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Selector de Icono */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardHeader
                                title='Icono del Módulo'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                {/* Preview del icono */}
                                {selectedIcon && (
                                    <Box className='mb-4 p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-actionHover'>
                                        <i className={`${selectedIcon} text-6xl text-primary mb-2`} />
                                        <Typography variant='caption' color='text.secondary'>
                                            {selectedIcon}
                                        </Typography>
                                    </Box>
                                )}

                                <Typography variant='caption' color='error' className='block mb-2'>
                                    {errors.icon?.message}
                                </Typography>

                                <Box className='mt-4'>
                                    <Controller
                                        name='icon'
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                fullWidth
                                                size='small'
                                                label='Ingresa clase del icono (Tabler)'
                                                placeholder='tabler-smart-home'
                                                error={!!errors.icon}
                                                helperText={errors.icon?.message}
                                            />
                                        )}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Footer Buttons */}
                <Box className='mt-6 flex items-center justify-end gap-4'>
                    <Button
                        variant='outlined'
                        color='secondary'
                        onClick={() => router.push('/administracion/modules')}
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
                        {isSubmitting ? 'Actualizando...' : 'Actualizar Módulo'}
                    </Button>
                </Box>
            </form>
        </div>
    )
}

export default EditModuleView
