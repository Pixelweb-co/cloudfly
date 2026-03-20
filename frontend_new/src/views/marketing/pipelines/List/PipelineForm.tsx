'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Type & Service Imports
import type { Pipeline } from '@/types/marketing/pipelineTypes'
import { pipelineService } from '@/services/marketing/pipelineService'

interface Props {
  open: boolean
  handleClose: () => void
  selectedPipeline?: Pipeline | null
  onSuccess: () => void
}

const PipelineForm = ({ open, handleClose, selectedPipeline, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      color: '#6366F1',
      type: 'SALES',
      isActive: true,
      isDefault: false
    }
  })

  useEffect(() => {
    if (selectedPipeline) {
      reset({
        name: selectedPipeline.name,
        description: selectedPipeline.description || '',
        color: selectedPipeline.color || '#6366F1',
        type: selectedPipeline.type,
        isActive: selectedPipeline.isActive,
        isDefault: selectedPipeline.isDefault
      })
    } else {
      reset({
        name: '',
        description: '',
        color: '#6366F1',
        type: 'SALES',
        isActive: true,
        isDefault: false
      })
    }
  }, [selectedPipeline, reset])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      if (selectedPipeline) {
        await pipelineService.updatePipeline(selectedPipeline.id, data)
        toast.success('Pipeline actualizado')
      } else {
        await pipelineService.createPipeline(data)
        toast.success('Pipeline creado')
      }
      onSuccess()
      handleClose()
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar pipeline')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{selectedPipeline ? 'Editar Embudo' : 'Nuevo Embudo'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name='name'
                control={control}
                rules={{ required: 'El nombre es obligatorio' }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Nombre del Embudo'
                    placeholder='Ej: Ventas Inmobiliaria'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    id='pipeline-name'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label='Descripción'
                    placeholder='Opcional...'
                    id='pipeline-description'
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
                    label='Tipo de Embudo'
                    id='pipeline-type'
                  >
                    <MenuItem value='SALES'>Ventas</MenuItem>
                    <MenuItem value='SUPPORT'>Soporte</MenuItem>
                    <MenuItem value='MARKETING'>Marketing</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='color'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type='color'
                    label='Color Identificador'
                    id='pipeline-color'
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name='isActive'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} onChange={e => field.onChange(e.target.checked)} id='pipeline-active' />}
                    label='Activo'
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name='isDefault'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} onChange={e => field.onChange(e.target.checked)} id='pipeline-default' />}
                    label='Por defecto'
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant='outlined' color='secondary'>
            Cancelar
          </Button>
          <Button type='submit' variant='contained' disabled={loading} id='pipeline-submit'>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PipelineForm
