'use client'

import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    MenuItem,
    Grid
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast, ToastContainer } from 'react-toastify'
import CustomTextField from '@/@core/components/mui/TextField'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'

const schema = yup.object().shape({
    name: yup.string().required('El nombre es obligatorio').min(3, 'Mínimo 3 caracteres'),
    email: yup.string().email('Email inválido').nullable(),
    phone: yup.string().nullable(),
    address: yup.string().nullable(),
    taxId: yup.string().nullable(),
    type: yup.string().required('El tipo es obligatorio')
})

const ContactForm = ({ open, onClose, rowSelect }: any) => {
    const [editData, setEditData] = useState<any>({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        type: 'CUSTOMER'
    })

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            taxId: '',
            type: 'CUSTOMER'
        },
        mode: 'onSubmit'
    })

    const onSubmit = async (data: any) => {
        try {
            const method = rowSelect.id ? 'put' : 'post'
            const apiUrl = rowSelect.id ? `${API_BASE_URL}/contacts/${rowSelect.id}` : `${API_BASE_URL}/contacts`

            const requestData = {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                taxId: data.taxId || null,
                type: data.type,
                tenantId: userMethods.getUserLogin().customer.id
            }

            const response = await axiosInstance({
                method: method,
                url: apiUrl,
                data: requestData
            })

            toast.success(rowSelect.id ? 'Contacto actualizado exitosamente!' : 'Contacto creado exitosamente!', {
                position: 'top-right'
            })

            console.log('Contacto guardado con éxito:', response.data)

            reset()
            setEditData({
                name: '',
                email: '',
                phone: '',
                address: '',
                taxId: '',
                type: 'CUSTOMER'
            })

            onClose()
        } catch (error: any) {
            console.error('Error al enviar los datos:', error)
            toast.error(error?.response?.data?.message || 'Error al guardar el contacto', {
                position: 'top-right'
            })
        }
    }

    useEffect(() => {
        if (rowSelect.id) {
            setEditData(rowSelect)
            setValue('name', rowSelect.name)
            setValue('email', rowSelect.email || '')
            setValue('phone', rowSelect.phone || '')
            setValue('address', rowSelect.address || '')
            setValue('taxId', rowSelect.taxId || '')
            setValue('type', rowSelect.type)
        }
    }, [rowSelect, setValue])

    const handleReset = () => {
        setEditData({
            name: '',
            email: '',
            phone: '',
            address: '',
            taxId: '',
            type: 'CUSTOMER'
        })

        setValue('name', '')
        setValue('email', '')
        setValue('phone', '')
        setValue('address', '')
        setValue('taxId', '')
        setValue('type', 'CUSTOMER')
    }

    return (
        <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='md'>
            <DialogTitle>{rowSelect.id ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>

            <DialogContent>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name='name'
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    fullWidth
                                    value={editData?.name || ''}
                                    onChange={e => {
                                        setEditData({ ...editData, name: e.target.value })
                                        setValue('name', e.target.value)
                                    }}
                                    label='Nombre *'
                                    error={Boolean(errors.name)}
                                    helperText={errors.name?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Controller
                            name='type'
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    select
                                    fullWidth
                                    value={editData?.type || 'CUSTOMER'}
                                    onChange={e => {
                                        setEditData({ ...editData, type: e.target.value })
                                        setValue('type', e.target.value)
                                    }}
                                    label='Tipo *'
                                    error={Boolean(errors.type)}
                                    helperText={errors.type?.message}
                                >
                                    <MenuItem value='LEAD'>Lead</MenuItem>
                                    <MenuItem value='POTENTIAL_CUSTOMER'>Cliente Potencial</MenuItem>
                                    <MenuItem value='CUSTOMER'>Cliente</MenuItem>
                                    <MenuItem value='SUPPLIER'>Proveedor</MenuItem>
                                    <MenuItem value='OTHER'>Otro</MenuItem>
                                </CustomTextField>
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
                                    value={editData?.phone || ''}
                                    onChange={e => {
                                        setEditData({ ...editData, phone: e.target.value })
                                        setValue('phone', e.target.value)
                                    }}
                                    label='Teléfono'
                                    error={Boolean(errors.phone)}
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
                                    type='email'
                                    value={editData?.email || ''}
                                    onChange={e => {
                                        setEditData({ ...editData, email: e.target.value })
                                        setValue('email', e.target.value)
                                    }}
                                    label='Email'
                                    error={Boolean(errors.email)}
                                    helperText={errors.email?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Controller
                            name='taxId'
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    value={editData?.taxId || ''}
                                    onChange={e => {
                                        setEditData({ ...editData, taxId: e.target.value })
                                        setValue('taxId', e.target.value)
                                    }}
                                    label='RUC/DNI'
                                    error={Boolean(errors.taxId)}
                                    helperText={errors.taxId?.message}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={12}>
                        <Controller
                            name='address'
                            control={control}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    multiline
                                    rows={3}
                                    fullWidth
                                    value={editData?.address || ''}
                                    onChange={e => {
                                        setEditData({ ...editData, address: e.target.value })
                                        setValue('address', e.target.value)
                                    }}
                                    label='Dirección'
                                    error={Boolean(errors.address)}
                                    helperText={errors.address?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                <DialogActions>
                    <Button color='error' onClick={handleReset}>
                        Limpiar
                    </Button>
                    <Button onClick={onClose} color='secondary'>
                        Cerrar
                    </Button>
                    <Button type='submit' variant='contained' color='primary'>
                        Guardar
                    </Button>
                </DialogActions>
            </Box>
            <ToastContainer />
        </Dialog>
    )
}

export default ContactForm
