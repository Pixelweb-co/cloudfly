'use client'
import React, { use, useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Card,
  CardContent,
  Chip
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import CustomTextField from '@/@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const schema = yup.object().shape({
  fecha: yup.string().required("La fecha es obligatoria"),
  fechafin: yup.string().required("La fecha final es obligatoria"),
  numero: yup
    .string()
    .matches(/^\d+$/, "El número de mantenimientos debe ser numérico")
    .required("El número de mantenimientos es obligatorio"),
});


const SheduleForm = ({ open, onClose, rowSelect, onSuccess }: { open: boolean; onClose: () => void; rowSelect: any; onSuccess?: () => void }) => {
  const [fechas, setFechas] = useState<any[]>([])
  const [checked, setChecked] = useState<number[]>([])

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      numero: '',
      fecha: '',
      fechafin: rowSelect.fecha_fin || '' // Establecer la fecha final desde rowSelect
    }
  })

  useEffect(() => {
    if (fechas.length > 0) {
      // Seleccionar todas las fechas por defecto
      setChecked(fechas.map((_, index) => index))
    }
  }, [fechas])

  // Función para generar las fechas entre la fecha de inicio y la fecha de fin
  const generarFechasServicio = (fechaInicio: string, fechaFin: string, numVeces: number, idServicio: number) => {
    console.log('Generando fechas con:', { fechaInicio, fechaFin, numVeces, idServicio })

    if (!fechaInicio || !fechaFin || isNaN(numVeces) || numVeces <= 0) {
      console.error('Datos de entrada inválidos.')
      return []
    }

    const startDate = new Date(fechaInicio)
    const endDate = new Date(fechaFin)
    const diffTime = endDate.getTime() - startDate.getTime()

    if (diffTime < 0) {
      console.error('La fecha de inicio es mayor que la fecha de fin.')
      return []
    }

    const fechasGeneradas = []

    // Generar las fechas distribuidas entre la fecha de inicio y la fecha de fin
    if (numVeces === 1) {
      fechasGeneradas.push({ fecha: startDate.toISOString().split('T')[0], id_servicio: idServicio })
    } else {
      const interval = diffTime / (numVeces - 1)
      for (let i = 0; i < numVeces; i++) {
        const fecha = new Date(startDate.getTime() + interval * i)
        fechasGeneradas.push({ fecha: fecha.toISOString().split('T')[0], id_servicio: idServicio })
      }
    }

    console.log('Fechas generadas:', fechasGeneradas)
    setFechas(fechasGeneradas)
  }

  // Manejo del envío del formulario
  const onSubmit = async (data: any) => {
    console.log('data', data)
    generarFechasServicio(data.fecha, data.fechafin, parseInt(data.numero, 10), rowSelect.id)
  }

  // Manejar la selección de elementos
  const handleToggle = (index: number) => {
    setChecked(prevChecked =>
      prevChecked.includes(index) ? prevChecked.filter(item => item !== index) : [...prevChecked, index]
    )
  }

  const doShedule = async () => {
    // Obtener las fechas seleccionadas
    const fechasSeleccionadas = fechas.filter((_, index) => checked.includes(index)).map(value => value.fecha)

    if (fechasSeleccionadas.length === 0) {
      alert('Debe seleccionar al menos una fecha.')
      return
    }

    try {
      // Enviar las fechas seleccionadas al servidor

      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedule/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fechas: fechasSeleccionadas,
          deviceId: rowSelect.id
        })
      })

      if (response.ok) {
        alert('Mantenimiento programado con éxito')
        onClose()
        if (onSuccess) onSuccess()
      } else {
        alert('Error al programar el mantenimiento')
      }
    } catch (error) {
      console.error('Error en la solicitud:', error)
      alert('Hubo un error al programar el mantenimiento')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Programación de mantenimiento</DialogTitle>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <h3>Programación de mantenimiento</h3>

              <Controller
                name='fecha'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    className='mt-2'
                    fullWidth
                    type='date'
                    label='Fecha'
                    error={Boolean(errors.fecha)}
                    helperText={errors.fecha?.message}
                  />
                )}
              />

              <Controller
                name='fechafin'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    className='mt-2'
                    fullWidth
                    type='date'
                    label='Fecha final'
                    error={Boolean(errors.fechafin)}
                    helperText={errors.fechafin?.message?.toString()}
                  />
                )}
              />

              <Controller
                name='numero'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    className='mt-4'
                    fullWidth
                    type='number'
                    label='Número de mantenimientos'
                    error={!!errors.numero}
                    helperText={errors.numero?.message}
                  />
                )}
              />
              <Button className='mt-4' type='submit' variant='contained' color='warning'>
                Obtener fechas
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <h3>Fechas</h3>
              <Card>
                <CardContent>
                  <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                    {fechas.map((value, index) => {
                      return (
                        <ListItem key={index} disablePadding>
                          <ListItemButton>
                            <ListItemIcon>
                              <Checkbox
                                edge='start'
                                checked={checked.includes(index)}
                                disableRipple
                                onClick={() => handleToggle(index)}
                              />
                            </ListItemIcon>

                            <CustomTextField
            value={value.fecha}
            className="mt-2"
            fullWidth
            type="date"
            onChange={(e) => {
              const newFecha = e.target.value;

              // Obtener el nuevo valor

               setFechas(

                fechas.map((item, i) =>

                  i === index ? { ...item, fecha: newFecha } : item

                )

              );

            }}
          />
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='secondary'>
            Cerrar
          </Button>

          <Button onClick={doShedule} color='primary' variant='contained' disabled={fechas.length === 0}>
            Programar equipo
          </Button>
        </DialogActions>{' '}
      </Box>
    </Dialog>
  )
}

export default SheduleForm
