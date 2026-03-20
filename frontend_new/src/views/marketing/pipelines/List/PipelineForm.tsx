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
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Icon } from '@iconify/react'
import { IconButton, Typography, Divider } from '@mui/material'

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
  } = useForm<CreatePipelineDto>({
    defaultValues: {
      name: '',
      description: '',
      color: '#6366F1',
      type: 'SALES',
      isActive: true,
      isDefault: false,
      stages: [
        { name: 'Lead', color: '#9CA3AF', order: 0 },
        { name: 'En Proceso', color: '#3B82F6', order: 1 },
        { name: 'Cerrado', color: '#10B981', order: 2 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stages'
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
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <div className='flex items-center justify-between mb-2'>
                <Typography variant='h6'>Etapas del Embudo</Typography>
                <Button 
                  size='small' 
                  startIcon={<Icon icon='tabler:plus' />} 
                  onClick={() => append({ name: '', color: '#9CA3AF', order: fields.length })}
                  id='add-stage-btn'
                >
                  Agregar Etapa
                </Button>
              </div>
              {fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} sx={{ mb: 2, alignItems: 'center' }}>
                  <Grid item xs={8}>
                    <Controller
                      name={`stages.${index}.name`}
                      control={control}
                      rules={{ required: 'Obligatorio' }}
                      render={({ field: stageField }) => (
                        <CustomTextField
                          {...stageField}
                          fullWidth
                          size='small'
                          placeholder='Nombre de la etapa'
                          error={!!(errors as any).stages?.[index]?.name}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Controller
                      name={`stages.${index}.color`}
                      control={control}
                      render={({ field: colorField }) => (
                        <CustomTextField
                          {...colorField}
                          fullWidth
                          size='small'
                          type='color'
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton color='error' onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Icon icon='tabler:trash' />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
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
