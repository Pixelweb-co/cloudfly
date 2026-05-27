import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { Button, TextField, Grid, Card, MenuItem, Select, InputLabel, FormControl, FormHelperText } from '@mui/material'
import axios from 'axios'
import dotenv from "dotenv";

import type { Tercero } from '@/types/apps/tercero'

interface FormTerceroProps {
  entity: string
  onSubmit: () => void
  onCancel: () => void // Added onCancel prop
  tercero?: Tercero | null
}

const FormTercero = ({ entity, onSubmit, onCancel, tercero }: FormTerceroProps) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<Tercero>({
    defaultValues: {
      id: 0,
      nombre: '',
      tipoDocumento: '',
      numeroDocumento: '',
      telefono: '',
      email: '',
      direccion: ''
    }
  })

  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PP', label: 'Pasaporte' },
    { value: 'PPT', label: 'Permiso especial de permanencia' },
    { value: 'NIT', label: 'Nit' }
  ]

  // Pre-fill form when editing an existing tercero
  useEffect(() => {
    if (tercero) {
      Object.keys(tercero).forEach(key => {
        setValue(key as keyof Tercero, tercero[key as keyof Tercero] || '')
      })
    }
  }, [tercero, setValue])

  const onSubmitHandler = async (data: Tercero) => {
    try {
      if (data.id) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/${entity}/${data.id}`, data)
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/${entity}`, data)
      }

      onSubmit() // Refresh data after submitting the form
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
    }
  }

  return (
    <Card className='p-4 mb-6'>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name='nombre'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Nombre'
                error={!!errors.nombre}
                helperText={errors.nombre ? 'Este campo es obligatorio' : ''}
              />
            )}
            rules={{ required: 'El nombre es obligatorio' }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.tipoDocumento}>
            <InputLabel>Tipo Documento</InputLabel>
            <Controller
              name='tipoDocumento'
              control={control}
              render={({ field }) => (
                <Select {...field} label='Tipo Documento'>
                  {documentTypes.map(docType => (
                    <MenuItem key={docType.value} value={docType.value}>
                      {docType.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
              rules={{ required: 'El tipo de documento es obligatorio' }}
            />
            {errors.tipoDocumento && <FormHelperText>{errors.tipoDocumento.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='numeroDocumento'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Número Documento'
                error={!!errors.numeroDocumento}
                helperText={errors.numeroDocumento ? 'El número de documento debe ser numérico' : ''}
              />
            )}
            rules={{
              required: 'El número de documento es obligatorio',
              pattern: {
                value: /^[0-9]+$/,
                message: 'El número de documento debe ser numérico'
              }
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='telefono'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Teléfono'
                error={!!errors.telefono}
                helperText={errors.telefono ? 'El teléfono debe empezar por 3 y tener 10 dígitos' : ''}
              />
            )}
            rules={{
              required: 'El teléfono es obligatorio',
              pattern: {
                value: /^3\d{9}$/,
                message: 'El teléfono debe empezar por 3 y tener 10 dígitos'
              }
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='email'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Email'
                error={!!errors.email}
                helperText={errors.email ? 'El email debe tener un formato válido' : ''}
              />
            )}
            rules={{
              required: 'El email es obligatorio',
              pattern: {
                value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
                message: 'El email debe tener un formato válido'
              }
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name='direccion'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Dirección'
                error={!!errors.direccion}
                helperText={errors.direccion ? 'Este campo es obligatorio' : ''}
              />
            )}
            rules={{ required: 'La dirección es obligatoria' }}
          />
        </Grid>

        <Grid item xs={12} className='text-right'>
          <Button variant='contained' color='primary' onClick={handleSubmit(onSubmitHandler)}>
            {tercero?.id ? 'Actualizar' : 'Crear'}
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={onCancel} // Cancel action
            style={{ marginLeft: '10px' }}
          >
            Cancelar
          </Button>
        </Grid>
      </Grid>
    </Card>
  )
}

export default FormTercero
