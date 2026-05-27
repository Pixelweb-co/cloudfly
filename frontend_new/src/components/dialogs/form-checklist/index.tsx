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
import { axiosInstance } from '@/utils/axiosInstance'

const schema = yup.object().shape({
  productType: yup.string().notRequired(),
  marca: yup.string().required('La marca es obligatoria'),
  modelo: yup.string().required('El modelo es obligatorio'),
  nombreChequeo: yup.string().notRequired(),
  tipoElement: yup.string().required('El tipo de elemento es obligatorio')
})

const CheckListForm = ({ open, onClose, rowSelect }: any) => {
  const [id, setId] = useState(0)
  const [valueT, setValueT] = useState('itemsf')

  const [editData, setEditData] = useState<any>({
    productType: '1',
    marca: '',
    modelo: '',
    nombreChequeo: '',
    tipoElement: ''
  })

  const [typeDeviceList, setTypeDeviceList] = useState<any[]>([])
  const [customersList, setCustomersList] = useState<any[]>([])
  const [plantillasList, setPlantillasList] = useState<any[]>([])
  const [disabledAdd, setDisabledAdd] = useState(true)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const [formTemplate, setFormTemplate] = useState<any[]>([])

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const [typeDeviceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/type-device`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      console.log('typeDeviceRes:', typeDeviceRes.data)
      setTypeDeviceList(typeDeviceRes.data)


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
      productType: '1',
      marca: '',
      modelo: '',
      nombreChequeo: '',
      tipoElement: ''
    },
    mode: 'onSubmit'
  })

  useEffect(() => {
    console.log('errors ', errors)
  }, [errors])

  const onSubmit = async (data: any) => {
    try {

      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

      const method = 'post' // Actualización o Creación
      const apiUrl = `${API_BASE_URL}/plantillas` // Creación

      const response = await axiosInstance({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: {
          marca: data.marca,
          modelo: data.modelo,

          tipoElement: rowSelect.productType,
          campos: formTemplate // Incluye los campos dinámicos generados
        }
      })

      // Procesar la respuesta
      toast.success('Hey 👋!', {
        position: 'top-right',
      });
        console.log('Plantilla guardado con éxito:', response.data)

        fetchOptions()

        // Aquí puedes redirigir o mostrar un mensaje de éxito


      setValue('productType', '')
      setValue('marca', '')
      setValue('modelo', '')
      setValue('nombreChequeo', '')
      setValue('tipoElement', '')

      reset()
      setId(0)
      setEditData({
        productType: '1',
        marca: '',
        modelo: '',
        nombreChequeo: '',
        tipoElement: '0'
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
      setValue('productType', rowSelect.productType)
      setValue('marca', rowSelect.brand)
      setValue('modelo', rowSelect.model)
      setValue('nombreChequeo', rowSelect.productName)
      setValue('tipoElement', rowSelect.productCode)


      const getTemplates = async (item:any) => {

        console.error('item:', item);

        try {
          const response = await axiosInstance.get(`${API_BASE_URL}/plantillas?marca=${item.brand}&modelo=${item.model}&tipoElement=${item.productType}`);

          console.log('Datos recibidostp :', response.data);

          setFormTemplate(response.data.map((item:any) => ({ nom: item.nom})));

        } catch (error) {

          console.error('Error al obtener los datos:', error);
        }

      }

      getTemplates(rowSelect)




    }
  }, [rowSelect, setValue])

  const handleTabChange = (event: SyntheticEvent, newValue: string) => setValueT(newValue)

  const handleReset = () => {
    setEditData({
      productType: '1',
      marca: '',
      modelo: '',
      nombreChequeo: '',
      tipoElement: ''
    })

    setValue('productType', '')
    setValue('marca', '')
    setValue('modelo', '')
    setValue('nombreChequeo', '')
    setValue('tipoElement', '')
  }

  useEffect(() => {

    console.log('formTemplate:', formTemplate);

  }, [formTemplate]);

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Plantila de checkeo</DialogTitle>

      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='productType'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  value={
                    typeDeviceList.length > 0 && editData.productType? typeDeviceList.find(item => item.id === editData.productType).typeDevice
                      : ''
                  }
                  label='Tipo de dispositivo'
                  error={Boolean(errors.productType)}
                  helperText={errors.productType?.message}
                />
              )}
            />

            <Controller
              name='marca'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-4'
                  fullWidth
                  label='Marca'
                  error={Boolean(errors.marca)}
                  helperText={errors.marca?.message}
                />
              )}
            />

            <Controller
              name='modelo'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-4'
                  fullWidth
                  label='Modelo'
                  error={Boolean(errors.modelo)}
                  helperText={errors.modelo?.message}
                />
              )}
            />

            <Typography variant='h6' className='mt-4'>
              Agregar campo
            </Typography>
            <Divider className='mt-4' />

            <Controller
              name='nombreChequeo'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  className='mt-4'
                  fullWidth
                  onKeyUp={e => {
                    console.log('Check:', (e.target as HTMLInputElement).value)

                    if((e.target as HTMLInputElement).value === ''){
                      setDisabledAdd(true)


                    }else{
                      setDisabledAdd(false)
                    }
                  }}
                  onBlur={e => {

                    setEditData({ ...editData, nombreChequeo: e.target.value })
                    setValue('nombreChequeo', e.target.value)


                }}
                  label='Nombre del chequeo'
                  error={Boolean(errors.nombreChequeo)}
                  helperText={errors.nombreChequeo?.message}
                />
              )}
            />



            <Button
              type='button'
              variant='contained'
              color='success'
              disabled={disabledAdd}
              className='mt-4'
              onClick={() => {
                console.log('editData', editData)

                setFormTemplate([...formTemplate, { nom: editData.nombreChequeo}])
                setValue('nombreChequeo', '')
                setEditData({ ...editData, nombreChequeo: '' })

              }}
            >
              Agregar campo
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader title='Formulario de checkeo' />

              <CardContent>
                {formTemplate.length > 0 &&
                  formTemplate.map((plantillar, index) => (
                    <div key={index}>
                      <Grid container spacing={2}>
                        <Grid item xs={10} sm={10}>

                                                    <Controller
                                                      name='tipoElement'
                                                      control={control}
                                                      render={({ field }) => (
                                                        <FormControlLabel
                                                          control={
                                                            <Switch
                                                              checked={false} // Asegura que el estado refleje correctamente el valor guardado
                                                            />
                                                          }
                                                          label={plantillar.nom}
                                                        />
                                                      )}
                                                    />



                        </Grid>

                        <Grid item xs={2} sm={2}>
                          <Tooltip title='Eliminar campo' placement='top'>
                          <IconButton
                          className='mt-1'
                            onClick={() => {
                              setFormTemplate(formTemplate.filter((item, i) => i !== index))
                            }}
                          >
                            <i className='tabler-trash text-textSecondary' color='danger'/>
                          </IconButton>
                            </Tooltip>
                        </Grid>
                      </Grid>
                    </div>
                  ))}
              </CardContent>
            </Card>
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

export default CheckListForm
