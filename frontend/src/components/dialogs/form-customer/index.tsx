'use client'
import React, { useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  InputLabel,
  Select,
  FormControl,
  Typography,
  Divider
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import dotenv from "dotenv";

import type { CustomersType } from '@/types/apps/customerType'

// Opciones de tipo de negocio
const BUSINESS_TYPE_OPTIONS = [
  { value: 'VENTAS', label: '🛒 Ventas', description: 'Venta de productos físicos o digitales' },
  { value: 'AGENDAMIENTO', label: '📅 Agendamiento', description: 'Servicios con citas o reservas' },
  { value: 'SUSCRIPCION', label: '🔄 Suscripción', description: 'Modelo de suscripción recurrente' },
  { value: 'MIXTO', label: '🎯 Mixto', description: 'Combinación de varios tipos' }
]

const schema = yup.object().shape({
  name: yup.string().required('El nombre es obligatorio'),
  nit: yup.string().required('El NIT es obligatorio'),
  phone: yup.string().required('telefono es obligatorio'),
  email: yup.string().email('Email inválido').required('email es obligatorio'),
  address: yup.string().required('direccion es obligatorio'),
  contact: yup.string().required('El contacto es obligatorio'),
  position: yup.string().required('El cargo es obligatorio'),
  type: yup.string().required('El tipo es obligatorio'),
  businessType: yup.string().optional(),
  businessDescription: yup.string().optional(),
  fechaInicio: yup.string().required('La fecha inicial es obligatoria'),
  fechaFinal: yup.string().required('La fecha final es obligatoria'),
  descripcionContrato: yup.string().optional(),
  status: yup.string().required('El estado es obligatorio')
})

const ClienteForm = ({
  open,
  onClose,
  setOpen,
  rowSelect
}: {
  open: boolean
  onClose: () => void
  setOpen: () => void
  rowSelect: CustomersType
}) => {
  const [id, setId] = useState<any>(null)

  const [editData, setEditData] = useState<any>(null)

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
      nit: '',
      phone: '',
      email: '',
      address: '',
      contact: '',
      position: '',
      type: '',
      businessType: '',
      businessDescription: '',
      fechaInicio: '',
      fechaFinal: '',
      descripcionContrato: '',
      status: '1'
    }
  })

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('AuthToken')

      console.log('token ', token)

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

      const method = id ? 'put' : 'post' // Actualización o Creación
      const apiUrl = id ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${id}` : `${process.env.NEXT_PUBLIC_API_URL}/customers` // Creación

      const response = await axios({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      // Procesar la respuesta
      if (response.data.result === 'success') {
        console.log('Customer guardado con éxito:', response.data)

        // Aquí puedes redirigir o mostrar un mensaje de éxito
      } else {
        console.error('Error en la respuesta:', response.data.message)
      }

      setEditData(null)
      setValue('name', '')
      setValue('nit', '')
      setValue('phone', '')
      setValue('email', '')
      setValue('address', '')
      setValue('contact', '')
      setValue('position', '')
      setValue('type', '')
      setValue('businessType', '')
      setValue('businessDescription', '')
      setValue('fechaInicio', '')
      setValue('fechaFinal', '')
      setValue('descripcionContrato', '')
      setValue('status', '1')
      reset()
      setId(null)

      onClose()
    } catch (error) {
      console.error('Error al enviar los datos:', error)
    }
  }

  useEffect(() => {
    console.log('rsl ', rowSelect)

    if (rowSelect.id) {
      console.log('rowSelect', rowSelect)
      setId(rowSelect.id)
      setValue('name', rowSelect.name || '')
      setValue('nit', rowSelect.nit || '')
      setValue('phone', rowSelect.phone || '')
      setValue('email', rowSelect.email || '')
      setValue('address', rowSelect.address || '')
      setValue('contact', rowSelect.contact || '')
      setValue('position', rowSelect.position || '')
      setValue('type', rowSelect.type || '')
      setValue('businessType', rowSelect.businessType || '')
      setValue('businessDescription', rowSelect.businessDescription || '')
      setValue('fechaInicio', rowSelect.contrato?.fechaInicio || '')
      setValue('fechaFinal', rowSelect.contrato?.fechaFinal || '')
      setValue('descripcionContrato', rowSelect.contrato?.descripcionContrato || '')
      setValue('status', typeof rowSelect.status === 'boolean' ? rowSelect.status.toString() : rowSelect.status || '0')
      setEditData(rowSelect)
    } else {
      setValue('name', '')
      setValue('nit', '')
      setValue('phone', '')
      setValue('email', '')
      setValue('address', '')
      setValue('contact', '')
      setValue('position', '')
      setValue('type', '')
      setValue('businessType', '')
      setValue('businessDescription', '')
      setValue('fechaInicio', '')
      setValue('fechaFinal', '')
      setValue('descripcionContrato', '')
      setValue('status', '1')
      reset()
      setId(null)
      setEditData({
        id: null,
        name: '',
        nit: '',
        phone: '',
        email: '',
        address: '',
        contact: '',
        position: '',
        type: '',
        businessType: '',
        businessDescription: '',
        fechaInicio: '',
        fechaFinal: '',
        descripcionContrato: '',
        status: '1'
      })
    }
  }, [rowSelect])

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Agregar nuevo cliente</DialogTitle>
      <DialogContent>
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
                    value={editData ? editData.name : ''}
                    onChange={e => {
                      setEditData({ ...editData, name: e.target.value })
                      setValue('name', e.target.value)
                    }}
                    label='Nombre'
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
                    value={editData ? editData.nit : ''}
                    onChange={e => {
                      setEditData({ ...editData, nit: e.target.value })
                      setValue('nit', e.target.value)
                    }}
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
                    value={editData ? editData.phone : ''}
                    onChange={e => {
                      setEditData({ ...editData, phone: e.target.value })
                      setValue('phone', e.target.value)
                    }}
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
                    value={editData ? editData.email : ''}
                    onChange={e => {
                      setEditData({ ...editData, email: e.target.value })
                      setValue('email', e.target.value)
                    }}
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
                    value={editData ? editData.address : ''}
                    onChange={e => {
                      setEditData({ ...editData, address: e.target.value })
                      setValue('address', e.target.value)
                    }}
                    label='Dirección'
                    multiline
                    maxRows={4}
                    error={!!errors.address}
                    helperText={errors.address?.message}
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
                    value={editData ? editData.contact : ''}
                    onChange={e => {
                      setEditData({ ...editData, contact: e.target.value })
                      setValue('contact', e.target.value)
                    }}
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
                    value={editData ? editData.position : ''}
                    onChange={e => {
                      setEditData({ ...editData, position: e.target.value })

                      setValue('position', e.target.value)
                    }}
                    error={!!errors.position}
                    helperText={errors.position?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='type'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      {...field}
                      value={editData ? editData.type : ''}
                      onChange={e => {
                        setEditData({ ...editData, type: e.target.value })
                        setValue('type', e.target.value)
                      }}
                    >
                      <MenuItem value=''>-- Selecciona tipo --</MenuItem>
                      <MenuItem value='1'>Externa</MenuItem>
                      <MenuItem value='0'>Interna</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='status'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      {...field}
                      value={editData ? editData.status : '0'}
                      onChange={e => {
                        setEditData({ ...editData, status: e.target.value })
                        setValue('status', e.target.value)
                      }}
                    >
                      <MenuItem value=''>-- Selecciona estado --</MenuItem>
                      <MenuItem value='1'>Activo</MenuItem>
                      <MenuItem value='0'>Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* === SECCIÓN TIPO DE NEGOCIO === */}
            <Grid item xs={12} className='mt-4'>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                🏢 Tipo de Negocio
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='businessType'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Negocio</InputLabel>
                    <Select
                      {...field}
                      value={editData ? editData.businessType || '' : ''}
                      onChange={e => {
                        setEditData({ ...editData, businessType: e.target.value })
                        setValue('businessType', e.target.value)
                      }}
                    >
                      <MenuItem value=''>-- Selecciona tipo de negocio --</MenuItem>
                      {BUSINESS_TYPE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, height: '100%' }}>
                {editData?.businessType ? (
                  <Typography variant="body2" color="text.secondary">
                    {BUSINESS_TYPE_OPTIONS.find(o => o.value === editData.businessType)?.description || 'Selecciona un tipo de negocio'}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Selecciona el tipo de negocio para ver la descripción
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name='businessDescription'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    value={editData ? editData.businessDescription || '' : ''}
                    onChange={e => {
                      setEditData({ ...editData, businessDescription: e.target.value })
                      setValue('businessDescription', e.target.value)
                    }}
                    label='Descripción del Negocio / Objeto Social'
                    placeholder='Describe brevemente a qué se dedica tu negocio, productos o servicios que ofreces...'
                    multiline
                    rows={3}
                    helperText='Esta información ayuda a personalizar la experiencia del sistema'
                  />
                )}
              />
            </Grid>

            {/* === SECCIÓN CONTRATO === */}
            <Grid item xs={12} sm={12} className='my-4'>
              <Typography>
                <b>Contrato</b>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fechaInicio'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha inicial'
                    value={editData?.contrato?.fechaInicio ? editData.contrato?.fechaInicio : ''}
                    onChange={e => {
                      setEditData({
                        ...editData,
                        contrato: {
                          ...editData.contrato,
                          fechaInicio: e.target.value
                        }
                      })
                      setValue('fechaInicio', e.target.value)
                    }}
                    type='date'
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.fechaInicio}
                    helperText={errors.fechaInicio?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fechaFinal'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    value={editData?.contrato?.fechaFinal ? editData.contrato?.fechaFinal : ''}
                    onChange={e => {
                      setEditData({
                        ...editData,
                        contrato: {
                          ...editData.contrato,
                          fechaFinal: e.target.value
                        }
                      })
                      setValue('fechaFinal', e.target.value)
                    }}
                    label='Fecha final'
                    type='date'
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.fechaFinal}
                    helperText={errors.fechaFinal?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider className='my-4' />
              <Controller
                name='descripcionContrato'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    value={editData?.contrato?.descripcionContrato ? editData.contrato.descripcionContrato : ''}
                    onChange={e => {
                      setEditData({
                        ...editData,
                        contrato: {
                          ...editData.contrato,
                          descripcionContrato: e.target.value
                        }
                      })
                      setValue('descripcionContrato', e.target.value)
                    }}
                    label='Descripción'
                    multiline
                    maxRows={4}
                    error={!!errors.descripcionContrato}
                    helperText={errors.descripcionContrato?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cerrar
        </Button>
        <Button type='submit' variant='contained' color='primary' onClick={handleSubmit(onSubmit)}>
          Guardar datos
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ClienteForm
