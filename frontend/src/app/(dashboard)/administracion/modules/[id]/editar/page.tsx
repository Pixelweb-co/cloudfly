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
import CustomTextField from '@core/components/mui/TextField'
import { ModuleCreateRequest, ModuleDTO, MenuItem as MenuItemType } from '@/types/modules'
import { moduleService } from '@/services/modules/moduleService'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

// Lista de iconos Tabler disponibles
const iconList = [
    'tabler-shopping-cart',
    'tabler-users',
    'tabler-file-invoice',
    'tabler-package',
    'tabler-shopping-bag',
    'tabler-chart-bar',
    'tabler-settings',
    'tabler-home',
    'tabler-building-store',
    'tabler-truck-delivery',
    'tabler-currency-dollar',
    'tabler-report-analytics',
    'tabler-user-check',
    'tabler-calendar-event',
    'tabler-file-text',
    'tabler-box',
    'tabler-device-analytics'
]

const EditModulePage = () => {
    const router = useRouter()
    const params = useParams()
    const moduleId = Number(params.id)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [menuItems, setMenuItems] = useState<MenuItemType[]>([])

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<ModuleCreateRequest>({
        defaultValues: {
            name: '',
            code: '',
            description: '',
            icon: '',
            menuPath: '',
            displayOrder: 0,
            menuItems: undefined
        }
    })

    const selectedIcon = watch('icon')

    useEffect(() => {
        const fetchModule = async () => {
            try {
                setIsLoading(true)
                const moduleData = await moduleService.getModuleById(moduleId)

                // Parse menuItems if exists
                let parsedMenuItems: MenuItemType[] = []
                if (moduleData.menuItems) {
                    try {
                        parsedMenuItems = JSON.parse(moduleData.menuItems)
                    } catch (e) {
                        console.error('Error parsing menuItems:', e)
                    }
                }

                setMenuItems(parsedMenuItems)

                reset({
                    name: moduleData.name,
                    code: moduleData.code,
                    description: moduleData.description || '',
                    icon: moduleData.icon || '',
                    menuPath: moduleData.menuPath || '',
                    displayOrder: moduleData.displayOrder,
                    menuItems: moduleData.menuItems || undefined
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

    const onSubmit = async (formData: ModuleCreateRequest) => {
        try {
            setIsSubmitting(true)

            // Serialize menuItems to JSON
            const filteredMenuItems = menuItems.filter(item => item.name.trim() !== '' && item.path.trim() !== '')
            const menuItemsJson = filteredMenuItems.length > 0 ? JSON.stringify(filteredMenuItems) : undefined

            const payload: ModuleCreateRequest = {
                ...formData,
                menuItems: menuItemsJson
            }

            await moduleService.updateModule(moduleId, payload)
            toast.success('Módulo actualizado exitosamente')
            router.push('/administracion/modules')
        } catch (error) {
            console.error('Error updating module:', error)
            toast.error('Error al actualizar módulo')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddMenuItem = () => {
        setMenuItems([...menuItems, { name: '', path: '' }])
    }

    const handleRemoveMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index))
    }

    const handleMenuItemChange = (index: number, field: 'name' | 'path', value: string) => {
        const updatedItems = [...menuItems]
        updatedItems[index][field] = value
        setMenuItems(updatedItems)
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
                    {/* Información Básica */}
                    <Grid item xs={12} md={8}>
                        <Card>
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
                                            rules={{ required: 'El nombre es requerido' }}
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
                                            rules={{ required: 'El código es requerido' }}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Código'
                                                    placeholder='VENTAS'
                                                    error={!!errors.code}
                                                    helperText={errors.code?.message}
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
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='menuPath'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    label='Ruta del Menú'
                                                    placeholder='/ventas'
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name='displayOrder'
                                            control={control}
                                            render={({ field }) => (
                                                <CustomTextField
                                                    {...field}
                                                    fullWidth
                                                    type='number'
                                                    label='Orden de Visualización'
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Items del Menú */}
                        <Card className='mt-6'>
                            <CardHeader
                                title='Items del Menú'
                                subheader='Agrega sub-items para este módulo (opcional)'
                                titleTypographyProps={{ variant: 'h6' }}
                            />
                            <CardContent>
                                {menuItems.length === 0 ? (
                                    <Box className='text-center py-4'>
                                        <Typography variant='body2' color='text.secondary'>
                                            No hay items agregados
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={3}>
                                        {menuItems.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <Grid item xs={12} sm={5}>
                                                    <CustomTextField
                                                        fullWidth
                                                        label='Nombre del Item'
                                                        value={item.name}
                                                        onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                                                        placeholder='Ej: Facturación'
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomTextField
                                                        fullWidth
                                                        label='Ruta'
                                                        value={item.path}
                                                        onChange={(e) => handleMenuItemChange(index, 'path', e.target.value)}
                                                        placeholder='/ventas/facturas'
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={1} className='flex items-center'>
                                                    <IconButton
                                                        color='error'
                                                        onClick={() => handleRemoveMenuItem(index)}
                                                        size='small'
                                                    >
                                                        <i className='tabler-trash' />
                                                    </IconButton>
                                                </Grid>
                                            </React.Fragment>
                                        ))}
                                    </Grid>
                                )}
                                <Box className='mt-4'>
                                    <Button
                                        variant='outlined'
                                        startIcon={<i className='tabler-plus' />}
                                        onClick={handleAddMenuItem}
                                        size='small'
                                    >
                                        Agregar Item
                                    </Button>
                                </Box>
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
                                <Controller
                                    name='icon'
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel id='icon-select-label'>Seleccionar Icono</InputLabel>
                                            <Select
                                                {...field}
                                                labelId='icon-select-label'
                                                label='Seleccionar Icono'
                                                renderValue={(value) => (
                                                    <Box className='flex items-center gap-2'>
                                                        {value && <i className={`${value} text-xl`} />}
                                                        <span>{value || 'Sin icono'}</span>
                                                    </Box>
                                                )}
                                            >
                                                <MenuItem value=''>
                                                    <Box className='flex items-center gap-2'>
                                                        <span>Sin icono</span>
                                                    </Box>
                                                </MenuItem>
                                                {iconList.map((icon) => (
                                                    <MenuItem key={icon} value={icon}>
                                                        <Box className='flex items-center gap-2'>
                                                            <i className={`${icon} text-xl`} />
                                                            <span>{icon}</span>
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />

                                {/* Preview del icono */}
                                {selectedIcon && (
                                    <Box className='mt-6 p-6 bg-backgroundPaper rounded text-center'>
                                        <Typography variant='caption' color='text.secondary' className='block mb-2'>
                                            Vista Previa
                                        </Typography>
                                        <i className={`${selectedIcon} text-6xl text-primary`} />
                                    </Box>
                                )}
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

export default EditModulePage
