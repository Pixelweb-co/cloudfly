'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  Divider,
  alpha,
  useTheme,
  Slide,
  CircularProgress,
  Popover
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { HexColorPicker } from 'react-colorful'
import { motion, AnimatePresence } from 'framer-motion'
import axiosInstance from '@/utils/axiosInstance'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import React from 'react'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />
})

const schema = yup.object().shape({
  name: yup.string().required('El nombre del embudo es obligatorio').min(3, 'Mínimo 3 caracteres'),
  description: yup.string().optional(),
  color: yup.string().required('El color es obligatorio'),
  type: yup.string().required('El tipo de embudo es obligatorio'),
  isActive: yup.boolean(),
  isDefault: yup.boolean(),
  stages: yup.array().of(
    yup.object().shape({
      name: yup.string().required('El nombre de la etapa es obligatorio'),
      color: yup.string().default('#9CA3AF'),
      position: yup.number()
    })
  ).min(1, 'Debe haber al menos una etapa')
})

interface PipelineFormProps {
  open: boolean
  handleClose: () => void
  selectedPipeline: any | null
  onSuccess: () => void
}

const PipelineForm = ({ open, handleClose, selectedPipeline, onSuccess }: PipelineFormProps) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      color: '#7367F0',
      type: 'SALES',
      isActive: true,
      isDefault: false,
      stages: [{ name: 'Prospecto', color: '#9CA3AF', position: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stages'
  })

  useEffect(() => {
    if (selectedPipeline) {
      console.log('📝 [PIPELINE-DEBUG] Resetting for edit:', selectedPipeline);
      reset({
        name: selectedPipeline.name,
        description: selectedPipeline.description || '',
        color: selectedPipeline.color || '#7367F0',
        type: selectedPipeline.type || 'SALES',
        isActive: selectedPipeline.isActive,
        isDefault: selectedPipeline.isDefault,
        stages: selectedPipeline.stages && selectedPipeline.stages.length > 0 
          ? selectedPipeline.stages 
          : [{ name: 'Prospecto', color: '#9CA3AF', position: 0 }]
      })
    } else {
      console.log('📝 [PIPELINE-DEBUG] Resetting for create');
      reset({
        name: '',
        description: '',
        color: '#7367F0',
        type: 'SALES',
        isActive: true,
        isDefault: false,
        stages: [{ name: 'Prospecto', color: '#9CA3AF', position: 0 }]
      })
    }
  }, [selectedPipeline, reset])

  const onSubmit = async (data: any) => {
    console.log('🚀 [PIPELINE-DEBUG] handleSubmit triggered. Data:', data);
    try {
      setLoading(true)
      // Get companyId from localStorage (userData)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const companyId = userData.company_id || userData.activeCompanyId

      const payload = {
        ...data,
        companyId: companyId,
        stages: data.stages.map((s: any, idx: number) => ({
          ...s,
          position: s.position ?? idx
        }))
      }
      
      console.log('📦 [PIPELINE-DEBUG] Payload to send:', JSON.stringify(payload, null, 2));

      let response;
      if (selectedPipeline) {
        console.log(`🔄 [PIPELINE-DEBUG] Sending PUT to /api/pipelines/${selectedPipeline.id}`);
        response = await axiosInstance.put(`/api/pipelines/${selectedPipeline.id}`, payload);
      } else {
        console.log('✨ [PIPELINE-DEBUG] Sending POST to /api/pipelines');
        response = await axiosInstance.post('/api/pipelines', payload);
      }

      console.log('✅ [PIPELINE-DEBUG] SUCCESS:', response.data);
      toast.success(selectedPipeline ? 'Embudo actualizado' : 'Embudo creado exitosamente')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('❌ [PIPELINE-DEBUG] SAVE FAILED:', error);
      console.error('❌ [PIPELINE-DEBUG] Trace:', error.response?.data || error.message);
      toast.error('Ocurrió un error al guardar el embudo. Revisa la consola.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseColorPicker = () => {
    setAnchorEl(null)
  }

  const currentColor = watch('color')

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ p: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                display: 'flex',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              }}
            >
              <Icon icon='tabler-adjustments-horizontal' fontSize={24} />
            </Box>
            <Typography variant='h5' fontWeight={700}>
              {selectedPipeline ? 'Editar Embudo Premium' : 'Nuevo Embudo Premium'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }}>
            <Icon icon='tabler-x' fontSize={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 6, pt: 0 }}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    id='pipeline-name'
                    fullWidth
                    label='Nombre del Embudo'
                    placeholder='Ej: Pipelines de Ventas 2024'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.2)}` }
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
                    id='pipeline-description'
                    fullWidth
                    multiline
                    rows={2}
                    label='Descripción'
                    placeholder='Define el propósito de este flujo...'
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant='caption' sx={{ display: 'block', mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                IDENTIFICADOR VISUAL
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconButton
                  onClick={handleOpenColorPicker}
                  sx={{
                    width: 44,
                    height: 44,
                    backgroundColor: currentColor,
                    border: `3px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[3],
                    '&:hover': { backgroundColor: currentColor, transform: 'scale(1.1)' },
                    transition: 'transform 0.2s'
                  }}
                />
                <Typography variant='body2' sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {currentColor.toUpperCase()}
                </Typography>
              </Box>
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleCloseColorPicker}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{ sx: { p: 2, borderRadius: '12px', mt: 1 } }}
              >
                <Controller
                  name='color'
                  control={control}
                  render={({ field }) => <HexColorPicker color={field.value} onChange={field.onChange} />}
                />
              </Popover>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant='caption' fontWeight={700} color='primary'>
                  ETAPAS DEL PROCESO
                </Typography>
              </Divider>

              <Box sx={{ mt: 2, maxHeight: 250, overflowY: 'auto', pr: 2 }}>
                <AnimatePresence mode='popLayout'>
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ marginBottom: '12px' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: 'text.disabled', display: 'flex' }}>
                          <Icon icon='tabler-grip-vertical' fontSize={20} />
                        </Box>
                        <Controller
                          name={`stages.${index}.name` as const}
                          control={control}
                          render={({ field: stageField }) => (
                            <CustomTextField
                              {...stageField}
                              fullWidth
                              placeholder={`Etapa ${index + 1}`}
                              error={!!errors.stages?.[index]?.name}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                          )}
                        />
                        <IconButton
                          color='error'
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          sx={{
                            backgroundColor: alpha(theme.palette.error.main, 0.08),
                            '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.15) }
                          }}
                        >
                          <Icon icon='tabler-trash' fontSize={18} />
                        </IconButton>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>

              <Button
                id='add-stage-btn'
                fullWidth
                variant='outlined'
                startIcon={<Icon icon='tabler-plus' />}
                onClick={() => append({ name: '', color: '#9CA3AF', position: fields.length })}
                sx={{
                  mt: 4,
                  borderRadius: '12px',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  py: 2,
                  '&:hover': { borderWidth: 2, backgroundColor: alpha(theme.palette.primary.main, 0.04) }
                }}
              >
                Agregar Etapa
              </Button>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 6, pt: 0 }}>
          <Button onClick={handleClose} color='secondary' variant='tonal' sx={{ borderRadius: '12px', px: 6 }}>
            Cancelar
          </Button>
          <Button
            id='pipeline-submit'
            type='submit'
            variant='contained'
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
            sx={{
              borderRadius: '12px',
              px: 8,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`,
              '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.45)}` },
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Guardando...' : selectedPipeline ? 'Actualizar Embudo' : 'Guardar Embudo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PipelineForm
