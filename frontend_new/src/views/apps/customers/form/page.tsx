'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'


// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Box, Button, TextField } from '@mui/material'

// React Hook Form and Yup
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { axiosInstance } from '@/utils/axiosInstance'

import { userMethods } from '@/utils/userMethods'
import CustomTextField from '@core/components/mui/TextField'

const schema = yup.object().shape({
    name: yup.string().required('El nombre es obligatorio'),
    nit: yup.string().required('El NIT es obligatorio'),
    phone: yup.string().required('Teléfono es obligatorio'),
    email: yup.string().email('Email inválido').required('Email es obligatorio'),
    address: yup.string().required('Dirección es obligatorio'),
    contact: yup.string().required('El contacto es obligatorio'),
    position: yup.string().required('El cargo es obligatorio'),
    businessType: yup.string().required('El tipo de negocio es obligatorio'),
    objetoSocial: yup.string().required('La descripción es obligatoria').min(10, 'Debe tener al menos 10 caracteres')
})

interface FormCustomerProps {
    onSuccess?: (customerData: any) => void
}

const BUSINESS_TYPES = [
    { value: 'beauty_salon', label: '💇 Salón de Belleza / Spa', model: 'Agendamiento' },
    { value: 'medical_clinic', label: '🏥 Clínica / Consultorio Médico', model: 'Agendamiento' },
    { value: 'fitness_gym', label: '💪 Gimnasio / Centro Fitness', model: 'Suscripciones' },
    { value: 'ecommerce', label: '🛒 Tienda Online / eCommerce', model: 'Venta' },
    { value: 'restaurant', label: '🍽️ Restaurante / Cafetería', model: 'Venta' },
    { value: 'dental_clinic', label: '🦷 Clínica Dental / Odontología', model: 'Agendamiento' },
    { value: 'software_saas', label: '💻 Software / SaaS', model: 'Suscripciones' },
    { value: 'education', label: '📚 Academia / Centro Educativo', model: 'Suscripciones' },
    { value: 'retail', label: '🏪 Tienda de Retail', model: 'Venta' },
    { value: 'automotive', label: '🔧 Taller Automotriz', model: 'Agendamiento' },
    { value: 'real_estate', label: '🏠 Inmobiliaria', model: 'Venta' },
    { value: 'legal', label: '⚖️ Despacho Jurídico', model: 'Agendamiento' }
]

const FormCustomer = ({ onSuccess }: FormCustomerProps) => {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            nit: '',
            phone: '',
            email: '',
            address: '',
            contact: '',
            position: '',
            businessType: '',
            objetoSocial: ''
        }
    })

    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const user = userMethods.getUserLogin()

        if (!user || !user.id) {
            router.push('/login')
        }
    }, [router])

    const onSubmit = async (data: any) => {
        try {
            setLoading(true)
            const user = userMethods.getUserLogin()

            if (!user || !user.id) {
                router.push('/login')
                
return
            }

            const response = await axiosInstance.post('/customers/account-setup', {
                userId: user.id,
                form: { ...data, status: 'true', type: 'Juridica' }
            })

            // Actualizar datos del usuario en localStorage (ahora tiene Customer)
            localStorage.setItem('userData', JSON.stringify(response.data))

            if (onSuccess) {
                // Notificar éxito al Wizard para avanzar de step
                onSuccess(response.data)
            } else {
                // Fallback si se usa fuera del Wizard
                router.push('/home')
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name='name'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Nombre del Negocio'
                                placeholder='Mi Empresa S.A.S'
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name='nit'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='NIT / Identificación'
                                placeholder='900123456-1'
                                error={!!errors.nit}
                                helperText={errors.nit?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name='phone'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Teléfono'
                                placeholder='3001234567'
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name='email'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Email Corporativo'
                                placeholder='contacto@empresa.com'
                                error={!!errors.email}
                                helperText={errors.email?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Controller
                        name='address'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Dirección Física'
                                placeholder='Calle 123 # 45-67, Ciudad'
                                error={!!errors.address}
                                helperText={errors.address?.message}
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                        Tipo de Negocio
                    </Typography>
                    <Controller
                        name='businessType'
                        control={control}
                        render={({ field }) => (
                            <Box>
                                <Grid container spacing={2}>
                                    {BUSINESS_TYPES.map(type => (
                                        <Grid item xs={12} sm={6} md={4} key={type.value}>
                                            <Box
                                                onClick={() => field.onChange(type.value)}
                                                sx={{
                                                    p: 3,
                                                    border: '1px solid',
                                                    borderColor: field.value === type.value ? 'primary.main' : 'divider',
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    bgcolor: field.value === type.value ? 'primary.lightOpacity' : 'background.paper',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        boxShadow: 1
                                                    }
                                                }}
                                            >
                                                <Typography variant='body1' sx={{ fontWeight: field.value === type.value ? 600 : 400 }}>
                                                    {type.label}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    Modelo: {type.model}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                                {errors.businessType && (
                                    <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                                        {errors.businessType.message}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Controller
                        name='objetoSocial'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Descripción del Negocio'
                                placeholder='Describe brevemente qué hace tu empresa...'
                                multiline
                                rows={3}
                                error={!!errors.objetoSocial}
                                helperText={errors.objetoSocial?.message || 'Esta información ayuda a la IA a entender tu negocio.'}
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Controller
                        name='contact'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Nombre del Contacto'
                                placeholder='Juan Pérez'
                                error={!!errors.contact}
                                helperText={errors.contact?.message}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name='position'
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                label='Cargo'
                                placeholder='Gerente / Propietario'
                                error={!!errors.position}
                                helperText={errors.position?.message}
                            />
                        )}
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type='submit'
                    variant='contained'
                    size='large'
                    disabled={loading}
                    startIcon={loading ? <i className='tabler-loader animate-spin' /> : null}
                >
                    {loading ? 'Procesando...' : 'Siguiente'}
                </Button>
            </Box>
        </Box>
    )
}

export default FormCustomer
