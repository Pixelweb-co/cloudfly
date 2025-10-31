'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

import axios from 'axios'
import dotenv from "dotenv";

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
  phone: yup.string().required('telefono es obligatorio'),
  email: yup.string().email('Email inválido').required('email es obligatorio'),
  address: yup.string().required('direccion es obligatorio'),
  contact: yup.string().required('El contacto es obligatorio'),
  position: yup.string().required('El cargo es obligatorio')
})

const FormCustomer = () => {
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
      position: ''
    }
  })

  const [editData, setEditData] = useState<any>(null)

  const router = useRouter()

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('AuthToken')

      console.log('token ', token)

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

      const method = 'post' // Actualización o Creación
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/customers/account-setup` // Creación

      const response = await axios({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: { userId: userMethods.getUserLogin().id, form: { ...data, status: '1', type: '1' } },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      setValue('name', '')
      setValue('nit', '')
      setValue('phone', '')
      setValue('email', '')
      setValue('address', '')
      setValue('contact', '')
      setValue('position', '')

      reset()
      localStorage.setItem('UserLogin', JSON.stringify(response.data))

      router.push('/home')
    } catch (error) {
      console.error('Error al enviar los datos:', error)
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
                value={editData ? editData.name : ''}
                onChange={e => {
                  setEditData({ ...editData, name: e.target.value })
                  setValue('name', e.target.value)
                }}
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
      </Grid>
      <Button type='submit' fullWidth variant='contained' className='mbe-6 mt-5'>
        Finalizar
      </Button>
    </Box>
  )
}

export default FormCustomer
