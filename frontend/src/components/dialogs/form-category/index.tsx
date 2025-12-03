'use client'
import type { SyntheticEvent } from 'react'
import React, { useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  MenuItem,
  Grid,
  CardContent,
  Card,
  Tab,
  Divider,
  Typography,
  CardHeader,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import dotenv from "dotenv";
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

import { toast, ToastContainer } from 'react-toastify'

import TabList from '@mui/lab/TabList'

import CustomTextField from '@/@core/components/mui/TextField'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'

const schema = yup.object().shape({
  nombreCategoria: yup.string().notRequired(),
  description: yup.string().notRequired(),
  parentCategory: yup.string().notRequired(),
  status: yup.string().notRequired()
})

const CategoryForm = ({ open, onClose, rowSelect }: any) => {
  const [id, setId] = useState(0)
  const [valueT, setValueT] = useState('itemsf')

  const [editData, setEditData] = useState<any>({
    nombreCategoria: '',
    parentCategory: '0',
    status: 'true',
    description: ''
  })

  const [categoryList, setCategoriesList] = useState<any[]>([])
  const [disabledAdd, setDisabledAdd] = useState(true)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const [formTemplate, setFormTemplate] = useState<any[]>([])

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      //tenantId
      const user = userMethods.getUserLogin();
      const id_customer = user.customer.id

      const [categoriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/categorias/customer/${id_customer}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      console.log('categoriesRes:', categoriesRes.data)
      setCategoriesList(categoriesRes.data)


      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombreCategoria: '',
      parentCategory: '0',
      status: 'true',
      description: ''
    },
    mode: 'onSubmit'
  })

  useEffect(() => {
    console.log('errors ', errors)
  }, [errors])

  const onSubmit = async (data: any) => {
    try {

      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo
      console.log('data to submit:', data)
      if (rowSelect.id) {
        console.log('Actualizando categoría con ID:', id)
      } else {
        console.log('Creando nueva categoría')
      }

      const method = rowSelect.id ? 'put' : 'post' // Actualización o Creación

      const apiUrl = rowSelect.id ? `${API_BASE_URL}/categorias/${rowSelect.id}` : `${API_BASE_URL}/categorias` // Creación

      const response = await axiosInstance({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: {
          nombreCategoria: data.nombreCategoria,
          parentCategory: data.parentCategory,
          status: data.status,
          description: data.description,
          tenantId: userMethods.getUserLogin().customer.id
        }
      })

      // Procesar la respuesta
      toast.success('Hey 👋!', {
        position: 'top-right',
      });
      console.log('Plantilla guardado con éxito:', response.data)

      fetchOptions()

      // Aquí puedes redirigir o mostrar un mensaje de éxito


      setValue('nombreCategoria', '')
      setValue('parentCategory', '0')
      setValue('status', 'true')
      setValue('description', '')
      reset()
      setId(0)
      setEditData({
        nombreCategoria: '',
        parentCategory: '0',
        status: 'true',
        description: ''
      })

      onClose()
    } catch (error) {
      console.error('Error al enviar los datos:', error)
    }
  }




  useEffect(() => {
    if (rowSelect.id) {
      console.log('rowSelect:', rowSelect)
      setEditData(rowSelect)
      setId(rowSelect.id)
      setValue('nombreCategoria', rowSelect.nombreCategoria)
      setValue('parentCategory', rowSelect.parentCategory)
      setValue('status', rowSelect.status)
      setValue('description', rowSelect.description)





    }
  }, [rowSelect, setValue])

  const handleTabChange = (event: SyntheticEvent, newValue: string) => setValueT(newValue)

  const handleReset = () => {
    setEditData({
      nombreCategoria: '',
      parentCategory: '0',
      status: 'true',
      description: ''
    })

    setValue('nombreCategoria', '')
    setValue('parentCategory', '0')
    setValue('status', 'true')
    setValue('description', '')
  }

  useEffect(() => {

    console.log('formTemplate:', formTemplate);

  }, [formTemplate]);

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Categoria</DialogTitle>

      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={12}>
            <Controller
              name='nombreCategoria'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  value={
                    editData?.nombreCategoria ? editData?.nombreCategoria : ''
                  }
                  onChange={e => {
                    setEditData({ ...editData, nombreCategoria: e.target.value })
                    setValue('nombreCategoria', e.target.value)
                  }}
                  label='Nombre de la Categoría'
                  error={Boolean(errors.nombreCategoria)}
                  helperText={errors.nombreCategoria?.message}
                />
              )}
            />


            <Controller
              name='parentCategory'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-2'
                  select
                  fullWidth
                  value={editData?.parentCategory ? editData?.parentCategory : '0'}
                  onChange={e => {
                    setEditData({ ...editData, parentCategory: e.target.value })
                    setValue('parentCategory', e.target.value)

                  }}
                  label='Categoría Padre'
                  error={Boolean(errors.parentCategory)}
                  helperText={errors.parentCategory?.message}
                >
                  <MenuItem key={0} value={'0'}>
                    Ninguna ...
                  </MenuItem>

                  {categoryList.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nombreCategoria}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />

            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-2'
                  label='Estado'
                  select
                  fullWidth
                  value={editData?.status ? editData?.status : 'true'}
                  onChange={e => {
                    setEditData({ ...editData, status: e.target.value })
                    setValue('status', e.target.value)

                  }}
                  error={Boolean(errors.status)}
                  helperText={errors.status?.message}
                >
                  <MenuItem key={1} value='false'>
                    Inactivo
                  </MenuItem>
                  <MenuItem key={2} value='true'>
                    Activo
                  </MenuItem>

                </CustomTextField>
              )}
            />

            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-4'
                  multiline
                  rows={4}
                  fullWidth
                  label='Descripción'
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
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
            Guardar datos
          </Button>
        </DialogActions>
      </Box>
      <ToastContainer />
    </Dialog>
  )
}

export default CategoryForm
