'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

import { axiosInstance } from '@/utils/axiosInstance'
import dotenv from "dotenv"

// MUI Imports
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

// React Hook Form and Yup
import { useForm, Controller, useFormState } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Components Imports

import { Box, Button, FormControl, InputLabel, Select, TextField, Typography } from '@mui/material'

import type { CustomersType } from '@/types/apps/customerType'

import { userMethods } from '@/utils/userMethods'

const schema = yup.object().shape({
  name: yup.string().required('El nombre es obligatorio'),
  nit: yup.string().required('El NIT es obligatorio'),
  phone: yup
    .string()
    .required('El teléfono es obligatorio')
    .matches(/^\d{12,15}$/, 'El número debe incluir el código de país (ej. 57) y tener entre 12 y 15 dígitos'),
  email: yup.string().email('Email inválido').required('El email es obligatorio'),
  address: yup.string().required('La dirección es obligatorio'),
  contact: yup.string().required('El contacto es obligatorio'),
  position: yup.string().required('El cargo es obligatorio'),
  businessType: yup.string().required('El tipo de negocio es obligatorio'),
  objetoSocial: yup.string().required('El objeto social es obligatorio').min(20, 'Debe tener al menos 20 caracteres')
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

const FormCustomer = ({ onSuccess }: FormCustomerProps = {}) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
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

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const user = userMethods.getUserLogin()
    if (!user || !user.id) {
      router.push('/login')
    }
  }, [router])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)

      // Verificar que el usuario esté logueado
      const user = userMethods.getUserLogin()
      if (!user || !user.id) {
        // Redirigir al login si no hay sesión
        router.push('/login')
        return
      }

      // Creación del customer
      const response = await axiosInstance.post(
        '/customers/account-setup',
        {
          userId: user.id,
          form: { ...data, status: '1', type: '1' }
        }
      )

      setValue('name', '')
      setValue('nit', '')
      setValue('phone', '')
      setValue('email', '')
      setValue('address', '')
      setValue('contact', '')
      setValue('position', '')

      reset()
      localStorage.setItem('UserLogin', JSON.stringify(response.data))

      // Llamar a onSuccess si existe
      if (onSuccess && response.data && response.data.customer) {
        onSuccess(response.data.customer)
      } else {
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
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Nombre de el negocio'
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
              <TextField
                {...field}
                fullWidth
                label='NIT'
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
              <TextField
                {...field}
                fullWidth
                label='Teléfono'
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
              <TextField
                {...field}
                fullWidth
                label='Email'
                type='email'
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
              <TextField
                {...field}
                fullWidth
                label='Dirección'
                multiline
                maxRows={4}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
          />
        </Grid>

        {/* Business Type - Visual Radio Cards */}
        <Grid item xs={12}>
          <Typography variant='subtitle1' className='mb-3 font-semibold'>
            Tipo de Negocio
          </Typography>
          <Controller
            name='businessType'
            control={control}
            render={({ field }) => (
              <Box>
                {/* Agendamiento Category */}
                <Typography variant='body2' color='text.secondary' className='mb-2 font-medium'>
                  📅 Negocios de Agendamiento
                </Typography>
                <Grid container spacing={2} className='mb-4'>
                  {BUSINESS_TYPES.filter(t => t.model === 'Agendamiento').map(type => (
                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                      <Box
                        onClick={() => {
                          field.onChange(type.value)
                        }}
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor: field.value === type.value ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: field.value === type.value ? 'primary.lighter' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Box display='flex' alignItems='center' gap={1.5}>
                          <input
                            type='radio'
                            checked={field.value === type.value}
                            onChange={() => { }}
                            style={{ accentColor: 'var(--mui-palette-primary-main)' }}
                          />
                          <Typography fontSize='1.5rem'>{type.label.split(' ')[0]}</Typography>
                          <Typography variant='body2' fontWeight={field.value === type.value ? 600 : 400}>
                            {type.label.substring(type.label.indexOf(' ') + 1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Venta Category */}
                <Typography variant='body2' color='text.secondary' className='mb-2 font-medium'>
                  💰 Negocios de Venta
                </Typography>
                <Grid container spacing={2} className='mb-4'>
                  {BUSINESS_TYPES.filter(t => t.model === 'Venta').map(type => (
                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                      <Box
                        onClick={() => {
                          field.onChange(type.value)
                        }}
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor: field.value === type.value ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: field.value === type.value ? 'primary.lighter' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Box display='flex' alignItems='center' gap={1.5}>
                          <input
                            type='radio'
                            checked={field.value === type.value}
                            onChange={() => { }}
                            style={{ accentColor: 'var(--mui-palette-primary-main)' }}
                          />
                          <Typography fontSize='1.5rem'>{type.label.split(' ')[0]}</Typography>
                          <Typography variant='body2' fontWeight={field.value === type.value ? 600 : 400}>
                            {type.label.substring(type.label.indexOf(' ') + 1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Suscripciones Category */}
                <Typography variant='body2' color='text.secondary' className='mb-2 font-medium'>
                  📱 Negocios de Suscripciones
                </Typography>
                <Grid container spacing={2}>
                  {BUSINESS_TYPES.filter(t => t.model === 'Suscripciones').map(type => (
                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                      <Box
                        onClick={() => {
                          field.onChange(type.value)
                        }}
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor: field.value === type.value ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: field.value === type.value ? 'primary.lighter' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Box display='flex' alignItems='center' gap={1.5}>
                          <input
                            type='radio'
                            checked={field.value === type.value}
                            onChange={() => { }}
                            style={{ accentColor: 'var(--mui-palette-primary-main)' }}
                          />
                          <Typography fontSize='1.5rem'>{type.label.split(' ')[0]}</Typography>
                          <Typography variant='body2' fontWeight={field.value === type.value ? 600 : 400}>
                            {type.label.substring(type.label.indexOf(' ') + 1)}
                          </Typography>
                        </Box>
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

        {/* Objeto Social - Business Description */}
        <Grid item xs={12}>
          <Controller
            name='objetoSocial'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth

                label='Objeto Social / Descripción del Negocio'
                placeholder='Describe tu negocio, productos o servicios principales. Ej: Somos un salón de belleza especializado en cortes modernos, colorimetría y tratamientos capilares...'
                multiline
                rows={4}
                error={!!errors.objetoSocial}
                helperText={errors.objetoSocial?.message || 'Esta descripción será usada por el chatbot IA para entender mejor tu negocio'}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='contact'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Contacto'
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
              <TextField
                {...field}
                fullWidth
                label='Cargo'
                error={!!errors.position}
                helperText={errors.position?.message}
              />
            )}
          />
        </Grid>
      </Grid>
      <Button
        type='submit'
        fullWidth
        variant='contained'
        size='large'
        disabled={loading}
        className='mbe-6 mt-5'
      >
        {loading ? (
          <>
            <i className='tabler-loader-2 animate-spin mr-2' />
            Un momento por favor...
          </>
        ) : (
          'Siguiente'
        )}
      </Button>
    </Box>
  )
}

export default FormCustomer

