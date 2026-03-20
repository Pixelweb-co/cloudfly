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
import { IconButton, Typography, Divider, Box, alpha, Popover } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { motion, AnimatePresence } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'

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

const validationSchema = yup.object().shape({
  name: yup.string().required('El nombre del embudo es obligatorio').min(3, 'Mínimo 3 caracteres'),
  description: yup.string().optional(),
  type: yup.string().required('El tipo es obligatorio'),
  color: yup.string().required('El color es obligatorio'),
  isActive: yup.boolean().required(),
  isDefault: yup.boolean().required(),
  stages: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Nombre de etapa requerido'),
      color: yup.string().required(),
      order: yup.number().required()
    })
  ).min(1, 'Debe haber al menos una etapa')
})

type PipelineFormData = yup.InferType<typeof validationSchema>

const PipelineForm = ({ open, handleClose, selectedPipeline, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLButtonElement | null }>({})
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PipelineFormData>({
    resolver: yupResolver(validationSchema) as any,
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth='sm' 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, p: 6, pb: 2 }}>
        {selectedPipeline ? 'Editar Embudo' : 'Nuevo Embudo'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Nombre del Embudo'
                    placeholder='Ej: Ventas Inmobiliaria'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    id='pipeline-name'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }
                    }}
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
                  <Box>
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Color Identificador'
                      id='pipeline-color'
                      InputProps={{
                        startAdornment: (
                          <IconButton
                            size='small'
                            onClick={(e) => setAnchorEl({ ...anchorEl, main: e.currentTarget })}
                            sx={{ mr: 2, p: 0 }}
                          >
                            <Box sx={{ width: 24, height: 24, borderRadius: '4px', bgcolor: field.value }} />
                          </IconButton>
                        )
                      }}
                    />
                    <Popover
                      open={Boolean(anchorEl.main)}
                      anchorEl={anchorEl.main}
                      onClose={() => setAnchorEl({ ...anchorEl, main: null })}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 4 }}>
                        <HexColorPicker color={field.value} onChange={field.onChange} />
                      </Box>
                    </Popover>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <div className='flex items-center justify-between mb-4'>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>Etapas del Embudo</Typography>
                <Button 
                  size='small' 
                  variant='tonal'
                  startIcon={<Icon icon='tabler:plus' />} 
                  onClick={() => append({ name: '', color: '#9CA3AF', order: fields.length })}
                  id='add-stage-btn'
                  sx={{ borderRadius: '8px' }}
                >
                  Agregar Etapa
                </Button>
              </div>
              <Box sx={{ minHeight: 100 }}>
                <AnimatePresence>
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Grid container spacing={4} sx={{ mb: 4, alignItems: 'center' }}>
                        <Grid item xs={8}>
                          <Controller
                            name={`stages.${index}.name`}
                            control={control}
                            render={({ field: stageField }) => (
                              <CustomTextField
                                {...stageField}
                                fullWidth
                                size='small'
                                placeholder='Nombre de la etapa'
                                error={!!errors.stages?.[index]?.name}
                                helperText={errors.stages?.[index]?.name?.message}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Controller
                            name={`stages.${index}.color`}
                            control={control}
                            render={({ field: colorField }) => (
                              <Box>
                                <IconButton
                                  size='small'
                                  onClick={(e) => setAnchorEl({ ...anchorEl, [`stage-${index}`]: e.currentTarget })}
                                  sx={{ p: 0 }}
                                >
                                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: colorField.value, border: `1px solid ${theme.palette.divider}` }} />
                                </IconButton>
                                <Popover
                                  open={Boolean(anchorEl[`stage-${index}`])}
                                  anchorEl={anchorEl[`stage-${index}`]}
                                  onClose={() => setAnchorEl({ ...anchorEl, [`stage-${index}`]: null })}
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                >
                                  <Box sx={{ p: 4 }}>
                                    <HexColorPicker color={colorField.value} onChange={colorField.onChange} />
                                  </Box>
                                </Popover>
                              </Box>
                            )}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <IconButton 
                            color='error' 
                            onClick={() => remove(index)} 
                            disabled={fields.length <= 1}
                            sx={{ backgroundColor: alpha(theme.palette.error.main, 0.08), '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.15) } }}
                          >
                            <Icon icon='tabler:trash' />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 6, pt: 2 }}>
          <Button onClick={handleClose} variant='outlined' color='secondary' sx={{ borderRadius: '10px' }}>
            Cancelar
          </Button>
          <Button 
            type='submit' 
            variant='contained' 
            disabled={loading} 
            id='pipeline-submit'
            sx={{ 
              borderRadius: '10px',
              background: `linear-gradient(270deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              '&:hover': {
                background: `linear-gradient(270deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PipelineForm
