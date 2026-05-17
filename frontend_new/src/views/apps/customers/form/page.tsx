'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Typography, Box, Button, TextField, FormControlLabel, Switch, InputAdornment, MenuItem } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'

const BUSINESS_TYPES = [
    { value: 'software_saas', label: '💻 Software / SaaS', model: 'Suscripciones' },
    { value: 'medical_clinic', label: '🏥 Clínica / Consultorio Médico', model: 'Agendamiento' },
    { value: 'beauty_salon', label: '💇 Salón de Belleza / Spa', model: 'Agendamiento' },
    { value: 'fitness_gym', label: '💪 Gimnasio / Centro Fitness', model: 'Suscripciones' },
    { value: 'ecommerce', label: '🛒 Tienda Online / eCommerce', model: 'Venta' },
    { value: 'restaurant', label: '🍽️ Restaurante / Cafetería', model: 'Venta' },
    { value: 'retail', label: '🏪 Tienda de Retail', model: 'Venta' },
    { value: 'automotive', label: '🔧 Taller Automotriz', model: 'Agendamiento' },
    { value: 'real_estate', label: '🏠 Inmobiliaria', model: 'Venta' },
    { value: 'legal', label: '⚖️ Despacho Jurídico', model: 'Agendamiento' }
]

const COUNTRY_CODES = [
    { code: '57', label: '🇨🇴 +57' },
    { code: '52', label: '🇲🇽 +52' },
    { code: '1', label: '🇺🇸 +1' },
    { code: '34', label: '🇪🇸 +34' },
    { code: '54', label: '🇦🇷 +54' },
    { code: '56', label: '🇨🇱 +56' },
    { code: '51', label: '🇵🇪 +51' },
    { code: '593', label: '🇪🇨 +593' }
]

const schema = yup.object().shape({
    name: yup.string().required('El nombre es obligatorio'),
    nit: yup.string().required('El NIT es obligatorio')
    .matches(/^[0-9]+$/, 'Solo se permiten números')
    .test('checkNit', 'Este NIT ya está registrado', async (value) => {
        if (!value || value.length < 5) return true
        
        // Si el NIT es el mismo que el que ya tenemos hidratado, es válido (estamos editando)
        if (initialData && initialData.nit === value) return true

        try {
            const res = await axiosInstance.get(`/customers/validate/nit?nit=${value}`)
            return !res.data.exists
        } catch { return true }
    }),
    countryCode: yup.string().required('Requerido'),
    phone: yup.string().required('El número de WhatsApp es obligatorio').matches(/^[0-9]+$/, 'Solo números').min(10, 'Mínimo 10 dígitos')
    .test('checkWhatsApp', 'Este número no parece tener WhatsApp activo', async (value, context) => {
        if (!value || value.length < 10) return true
        const fullNumber = `${context.parent.countryCode}${value}`
        try {
            const res = await axiosInstance.get(`/customers/validate/whatsapp?number=${fullNumber}`)
            return res.data.exists
        } catch { return true } // Si falla la API de Evolution, permitimos continuar por precaución
    }),
    email: yup.string().email('Email inválido').required('Email es obligatorio')
    .test('checkEmail', 'Este email ya está en uso', async (value) => {
        if (!value) return true
        try {
            const res = await axiosInstance.get(`/customers/validate/email?email=${value}`)
            return !res.data.exists
        } catch { return true }
    }),
    address: yup.string().required('Dirección es obligatorio'),
    contact: yup.string().required('El contacto es obligatorio'),
    position: yup.string().required('El cargo es obligatorio'),
    isEmployee: yup.boolean(),
    businessType: yup.string().required('El tipo de negocio es obligatorio'),
    objetoSocial: yup.string().required('La descripción es obligatoria').min(10, 'Debe tener al menos 10 caracteres')
})

interface FormCustomerProps {
    onSuccess?: (customerData: any) => void
    onBack?: () => void
    initialData?: any
}

const FormCustomer = ({ onSuccess, onBack, initialData }: FormCustomerProps) => {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            nit: '',
            countryCode: '57',
            phone: '',
            email: '',
            address: '',
            contact: '',
            position: '',
            isEmployee: true,
            businessType: '',
            objetoSocial: ''
        }
    })

    // Hydration logic
    useEffect(() => {
        if (initialData) {
            console.log('🔄 [FORM-CUSTOMER] Hydrating with initial data:', initialData.name)
            
            // Extract phone and country code (e.g., "57300..." -> "57" and "300...")
            let countryCode = '57'
            let phone = initialData.phone || ''
            
            const commonCodes = ['57', '52', '1', '34', '54', '56', '51', '593']
            for (const code of commonCodes) {
                if (phone.startsWith(code)) {
                    countryCode = code
                    phone = phone.substring(code.length)
                    break
                }
            }

            reset({
                name: initialData.name || '',
                nit: initialData.nit || '',
                countryCode: countryCode,
                phone: phone,
                email: initialData.email || '',
                address: initialData.address || '',
                contact: initialData.contact || '',
                position: initialData.position || '',
                isEmployee: initialData.isEmployee !== undefined ? initialData.isEmployee : true,
                businessType: initialData.businessType || '',
                objetoSocial: initialData.businessDescription || ''
            })
        }
    }, [initialData, reset])

    useEffect(() => {
        const user = userMethods.getUserLogin()
        if (!user || !user.id) router.push('/login')
    }, [router])

    const onSubmit = async (data: any) => {
        try {
            setLoading(true)
            const user = userMethods.getUserLogin()
            const fullPhone = `${data.countryCode}${data.phone}`

            const response = await axiosInstance.post('/customers/account-setup', {
                userId: user.id,
                form: { 
                    ...data, 
                    phone: fullPhone,
                    status: 'true', 
                    type: 'Juridica' 
                }
            })

            localStorage.setItem('userData', JSON.stringify(response.data))
            if (response.data.activeCompanyId) localStorage.setItem('activeCompanyId', response.data.activeCompanyId.toString())
            if (response.data.customerId) localStorage.setItem('activeTenantId', response.data.customerId.toString())

            if (onSuccess) onSuccess(response.data)
            else router.push('/home')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Ocurrió un error al guardar los datos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                    <Controller name='name' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Nombre del Negocio' placeholder='Mi Empresa S.A.S' error={!!errors.name} helperText={errors.name?.message} />
                    )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller name='nit' control={control} render={({ field }) => (
                        <CustomTextField 
                            {...field} 
                            onChange={(e) => {
                                const sanitizedValue = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(sanitizedValue)
                            }}
                            fullWidth 
                            label='NIT / Identificación' 
                            placeholder='9001234561' 
                            error={!!errors.nit} 
                            helperText={errors.nit?.message} 
                        />
                    )} />
                </Grid>

                {/* WHATSAPP FIELD WITH COUNTRY SELECTOR */}
                <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Controller name='countryCode' control={control} render={({ field }) => (
                            <CustomTextField {...field} select label='País' sx={{ width: '130px' }}>
                                {COUNTRY_CODES.map(c => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}
                            </CustomTextField>
                        )} />
                        <Controller name='phone' control={control} render={({ field }) => (
                            <CustomTextField {...field} fullWidth label='Número WhatsApp' placeholder='3001234567' error={!!errors.phone} helperText={errors.phone?.message} 
                                InputProps={{ startAdornment: <InputAdornment position="start"><i className='tabler-brand-whatsapp text-success'/></InputAdornment> }}
                            />
                        )} />
                    </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Controller name='email' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Email Corporativo' placeholder='contacto@empresa.com' error={!!errors.email} helperText={errors.email?.message} />
                    )} />
                </Grid>
                
                <Grid item xs={12}>
                    <Controller name='address' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Dirección Física' placeholder='Calle 123 # 45-67, Ciudad' error={!!errors.address} helperText={errors.address?.message} />
                    )} />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>Tipo de Negocio</Typography>
                    <Controller name='businessType' control={control} render={({ field }) => (
                        <Box>
                            <Grid container spacing={2}>
                                {BUSINESS_TYPES.map(type => (
                                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                                        <Box onClick={() => field.onChange(type.value)} sx={{ p: 3, border: '1px solid', borderColor: field.value === type.value ? 'primary.main' : 'divider', borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s', bgcolor: field.value === type.value ? 'primary.lightOpacity' : 'background.paper' }}>
                                            <Typography variant='body1' sx={{ fontWeight: field.value === type.value ? 600 : 400 }}>{type.label}</Typography>
                                            <Typography variant='caption' color='text.secondary'>Modelo: {type.model}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                            {errors.businessType && <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>{errors.businessType.message}</Typography>}
                        </Box>
                    )} />
                </Grid>

                <Grid item xs={12}>
                    <Controller name='objetoSocial' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Descripción del Negocio (IA Training)' multiline rows={3} error={!!errors.objetoSocial} helperText={errors.objetoSocial?.message || 'Ayuda a la IA a entender tu propuesta de valor.'} />
                    )} />
                </Grid>

                <Grid item xs={12} sm={5}>
                    <Controller name='contact' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Nombre del Contacto' placeholder='Juan Pérez' error={!!errors.contact} helperText={errors.contact?.message} />
                    )} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Controller name='position' control={control} render={({ field }) => (
                        <CustomTextField {...field} fullWidth label='Cargo / Función' placeholder='Director de Marketing' error={!!errors.position} helperText={errors.position?.message} />
                    )} />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Controller name='isEmployee' control={control} render={({ field }) => (
                        <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Empleado Interno" sx={{ mt: 3, ml: 1 }} />
                    )} />
                </Grid>
            </Grid>

            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant='outlined' size='large' onClick={onBack}>Atrás</Button>
                <Button type='submit' variant='contained' size='large' disabled={loading} startIcon={loading ? <i className='tabler-loader animate-spin' /> : null}>
                    {loading ? 'Validando datos...' : 'Guardar y Continuar'}
                </Button>
            </Box>
        </Box>
    )
}

export default FormCustomer
