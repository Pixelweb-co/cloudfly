'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import CustomTextField from '@core/components/mui/TextField'
import { ModuleCreateRequest, MenuItem } from '@/types/modules'
import { moduleService } from '@/services/modules/moduleService'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'

// Lista curada de iconos Tabler comunes
const AVAILABLE_ICONS = [
    { code: 'tabler-smart-home', label: 'Home' },
    { code: 'tabler-users', label: 'Usuarios' },
    { code: 'tabler-shopping-cart', label: 'Ventas' },
    { code: 'tabler-chart-bar', label: 'Reportes' },
    { code: 'tabler-settings', label: 'Config' },
    { code: 'tabler-file-text', label: 'Documentos' },
    { code: 'tabler-calendar', label: 'Calendario' },
    { code: 'tabler-message', label: 'Mensajes' },
    { code: 'tabler-mail', label: 'Email' },
    { code: 'tabler-box', label: 'Productos' },
    { code: 'tabler-truck', label: 'Logística' },
    { code: 'tabler-cash', label: 'Finanzas' },
    { code: 'tabler-credit-card', label: 'Pagos' },
    { code: 'tabler-calculator', label: 'Contabilidad' },
    { code: 'tabler-receipt', label: 'Facturas' },
    { code: 'tabler-user-circle', label: 'Perfil' },
    { code: 'tabler-lock', label: 'Seguridad' },
    { code: 'tabler-database', label: 'Datos' },
    { code: 'tabler-phone', label: 'Contacto' },
    { code: 'tabler-building', label: 'Empresa' }
]

const NewModulePage = () => {
    const router = useRouter()
    const [selectedIcon, setSelectedIcon] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<ModuleCreateRequest>({
        defaultValues: {
            code: '',
            name: '',
            description: '',
            icon: '',
            menuPath: '',
            displayOrder: 0
        }
    })

    const handleAddMenuItem = () => {
        setMenuItems([...menuItems, { name: '', path: '' }])
    }

    const handleRemoveMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index))
    }

    const handleMenuItemChange = (index: number, field: 'name' | 'path', value: string) => {
        const updated = [...menuItems]
        updated[index][field] = value
        setMenuItems(updated)
    }

    const onSubmit = async (formData: ModuleCreateRequest) => {
        try {
            setIsSubmitting(true)

            // Filter out empty items and serialize to JSON
            const validItems = menuItems.filter(item => item.name.trim() && item.path.trim())
            const menuItemsJson = validItems.length > 0 ? JSON.stringify(validItems) : null

            await moduleService.createModule({
                ...formData,
                icon: selectedIcon || formData.icon,
                menuItems: menuItemsJson || undefined
            })
            toast.success('Módulo creado exitosamente')
            router.push('/administracion/modules')
        } catch (error) {
            console.error('Error creating module:', error)
            toast.error('Error al crear módulo')
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
                        Crear Nuevo Módulo del Sistema
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Define un módulo que podrá ser asignado a planes de suscripción
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
                                title='Información Básica'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                <Grid container spacing={5}>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='name'
                                            control={control}
                                            rules={{ required: 'El nombre es requerido' }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Nombre del Módulo'
                                                    placeholder='Ej. Gestión de Ventas'
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
                                            rules={{ required: 'El código es requerido' }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Código Único'
                                                    placeholder='VENTAS'
                                                    error={!!errors.code}
                                                    helperText={errors.code?.message || 'Mayúsculas, sin espacios'}
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
                                                    placeholder='Describe la funcionalidad de este módulo...'
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
                                                    helperText='Ruta relativa para la navegación'
                                                    InputProps={{
                                                        startAdornment: <i className='tabler-link mr-2' />
                                                    }}
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
                                                    placeholder='10'
                                                    helperText='Orden de visualización'
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Items del Menú (Sub-items) */}
                        <Card>
                            <CardHeader
                                title='Items del Menú'
                                subheader='Define los sub-items que aparecerán dentro de este módulo'
                                titleTypographyProps={{ variant: 'h6' }}
                                action={
                                    <Button
                                        variant='contained'
                                        size='small'
                                        startIcon={<i className='tabler-plus' />}
                                        onClick={handleAddMenuItem}
                                    >
                                        Agregar Item
                                    </Button>
                                }
                            />
                            <CardContent>
                                {menuItems.length === 0 ? (
                                    <Box className='p-6 text-center border-2 border-dashed rounded-lg'>
                                        <i className='tabler-menu-2 text-4xl text-textSecondary mb-2' />
                                        <Typography variant='body2' color='text.secondary'>
                                            No hay items agregados. Haz clic en "Agregar Item" para comenzar.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <div className='flex flex-col gap-4'>
                                        {menuItems.map((item, index) => (
                                            <Box key={index} className='p-4 border rounded-lg'>
                                                <div className='flex items-start gap-4'>
                                                    <div className='flex-1'>
                                                        <Grid container spacing={3}>
                                                            <Grid item xs={12} sm={6}>
                                                                <CustomTextField
                                                                    fullWidth
                                                                    size='small'
                                                                    label='Nombre del Item'
                                                                    placeholder='Ej. Cotizaciones'
                                                                    value={item.name}
                                                                    onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <CustomTextField
                                                                    fullWidth
                                                                    size='small'
                                                                    label='Ruta'
                                                                    placeholder='/ventas/cotizaciones'
                                                                    value={item.path}
                                                                    onChange={(e) => handleMenuItemChange(index, 'path', e.target.value)}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </div>
                                                    <IconButton
                                                        size='small'
                                                        color='error'
                                                        onClick={() => handleRemoveMenuItem(index)}
                                                        title='Eliminar item'
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

                    {/* Columna Derecha */}
                    <Grid item xs={12} md={4}>
                        {/* Selector de Icono */}
                        <Card>
                            <CardHeader
                                title='Icono del Módulo'
                                subheader='Selecciona un icono representativo'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                {/* Preview del icono seleccionado */}
                                {selectedIcon && (
                                    <Box className='mb-4 p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-actionHover'>
                                        <i className={`${selectedIcon} text-6xl text-primary mb-2`} />
                                        <Typography variant='caption' color='text.secondary'>
                                            {selectedIcon}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Grid de iconos */}
                                <Typography variant='caption' color='text.secondary' className='block mb-2'>
                                    Selecciona un icono:
                                </Typography>
                                <Box className='grid grid-cols-4 gap-2 max-h-96 overflow-y-auto p-2'>
                                    {AVAILABLE_ICONS.map((icon) => (
                                        <button
                                            key={icon.code}
                                            type='button'
                                            onClick={() => {
                                                setSelectedIcon(icon.code)
                                                setValue('icon', icon.code)
                                            }}
                                            className={`
                                                flex flex-col items-center justify-center p-3 rounded-lg border-2 
                                                transition-all hover:bg-actionHover
                                                ${selectedIcon === icon.code
                                                    ? 'border-primary bg-primary-light'
                                                    : 'border-divider'
                                                }
                                            `}
                                            title={icon.label}
                                        >
                                            <i className={`${icon.code} text-2xl ${selectedIcon === icon.code ? 'text-primary' : ''}`} />
                                            <Typography
                                                variant='caption'
                                                className={`mt-1 text-xs ${selectedIcon === icon.code ? 'font-semibold' : ''}`}
                                            >
                                                {icon.label}
                                            </Typography>
                                        </button>
                                    ))}
                                </Box>

                                {/* Campo manual (opcional) */}
                                <Box className='mt-4'>
                                    <Controller
                                        name='icon'
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                fullWidth
                                                size='small'
                                                label='O ingresa manualmente'
                                                placeholder='tabler-custom-icon'
                                                helperText='Clase CSS del icono'
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    setSelectedIcon(e.target.value)
                                                }}
                                            />
                                        )}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Footer con Botones */}
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
                        {isSubmitting ? 'Creando...' : 'Crear Módulo'}
                    </Button>
                </Box>
            </form>
        </div>
    )
}

export default NewModulePage
