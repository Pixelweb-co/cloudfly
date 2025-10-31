import { useEffect } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { Button, TextField, Grid, Card, MenuItem, Select, InputLabel, FormControl, FormHelperText } from '@mui/material'
import axios from 'axios'
import dotenv from "dotenv";

import type { Cargo } from '@/types/apps/cargo'

interface FormCargoProps {
  entity: string
  onSubmit: () => void
  onCancel: () => void // Added onCancel prop
  cargo?: Cargo | null
}

const FormCargo = ({ entity, onSubmit, onCancel, cargo }: FormCargoProps) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<Cargo>({
    defaultValues: {
      id: 0,
      nombre: '',
      salario: 0,
      estado: ''
    }
  })

  useEffect(() => {
    if (cargo) {
      Object.keys(cargo).forEach(key => {
        setValue(key as keyof Cargo, cargo[key as keyof Cargo] || '')
      })
    }
  }, [cargo, setValue])

  const onSubmitHandler = async (data: Cargo) => {
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
          <Controller
            name='salario'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Salario'
                error={!!errors.salario}
                helperText={errors.salario ? 'Este campo es obligatorio' : ''}
              />
            )}
            rules={{ required: 'El salario es obligatorio' }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.estado}>
            <InputLabel>Estado</InputLabel>
            <Controller
              name='estado'
              control={control}
              render={({ field }) => (
                <Select {...field} label='Estado'>
                  <MenuItem key={0} value={'Activo'}>
                    Activo
                  </MenuItem>

                  <MenuItem key={1} value={'Inactivo'}>
                    Inactivo
                  </MenuItem>
                </Select>
              )}
              rules={{ required: 'El estado es obligatorio' }}
            />
            {errors.estado && <FormHelperText>{errors.estado.message}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} className='text-right'>
          <Button variant='contained' color='primary' onClick={handleSubmit(onSubmitHandler)}>
            {cargo?.id ? 'Actualizar' : 'Crear'}
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

export default FormCargo
