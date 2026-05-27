'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Box,
  InputAdornment,
  FormHelperText,
  CircularProgress,
  Avatar,
  Autocomplete,
  Chip
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Contact, ContactCreateRequest, Tag } from '@/types/marketing/contactTypes'
import { Pipeline, Stage } from '@/types/marketing/pipelineTypes'
import { Icon } from '@iconify/react'
import { contactService } from '@/services/marketing/contactService'
import { tagService } from '@/services/marketing/tagService'
import TagManagementModal from './TagManagementModal'
import { userMethods } from '@/utils/userMethods'
import userService, { User } from '@/services/userService'
import toast from 'react-hot-toast'

interface Props {
  contact: Contact | null;
  pipelines: Pipeline[];
  onSave: (data: ContactCreateRequest) => Promise<void>;
  saving: boolean;
}

const COUNTRY_CODES = [
  { value: '+57', label: '🇨🇴 +57' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+54', label: '🇦🇷 +54' },
  { value: '+56', label: '🇨🇱 +56' },
  { value: '+51', label: '🇵🇪 +51' },
  { value: '+58', label: '🇻🇪 +58' },
  { value: '+507', label: '🇵🇦 +507' },
  { value: '+593', label: '🇪🇨 +593' },
]

export default function ContactFormPanel({ contact, pipelines, onSave, saving }: Props) {
  const [availableStages, setAvailableStages] = useState<Stage[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  
  // Tag-related states
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)

  const loadAvailableTags = async () => {
    try {
      const allTags = await tagService.getAllTags()
      setAvailableTags(allTags || [])
    } catch (err) {
      console.error('Error fetching available tags:', err)
    }
  }

  useEffect(() => {
    loadAvailableTags()
  }, [])

  useEffect(() => {
    if (contact) {
      if (contact.tags) {
        setSelectedTags(contact.tags)
      } else {
        const fetchContactTags = async () => {
          try {
            const cTags = await tagService.getContactTags(contact.id)
            setSelectedTags(cTags || [])
          } catch (err) {
            console.error('Error fetching contact tags:', err)
          }
        }
        fetchContactTags()
      }
    } else {
      setSelectedTags([])
    }
  }, [contact])

  const user = userMethods.getUserLogin()
  const companyId = user?.activeCompanyId || user?.company_id

  // Validation Schema
  const schema = useMemo(() => {
    return yup.object({
      name: yup.string().required('El nombre es obligatorio').min(3, 'Mínimo 3 caracteres'),
      email: yup.string().email('Correo electrónico inválido').nullable().test(
        'checkEmail',
        'Este correo ya está registrado en esta compañía',
        async (value) => {
          if (!value) return true
          const currentEmail = (contact?.email || '').toLowerCase().trim()
          const newEmail = (value || '').toLowerCase().trim()
          
          if (contact && currentEmail === newEmail) return true
          
          setIsValidating(true)
          try {
            const isDuplicate = await contactService.checkEmailAvailability(newEmail)
            return !isDuplicate
          } catch (e) {
            return true // Allow if service fails
          } finally {
            setIsValidating(false)
          }
        }
      ),
      phone: yup.string().required('El teléfono es obligatorio').matches(/^[0-9]+$/, 'Solo números').test(
        'checkPhone',
        'Este número ya está registrado en esta compañía',
        async (value, context) => {
          if (!value) return true
          const prefix = context.parent.countryPrefix || '+57'
          const finalPhone = value.startsWith(prefix.replace('+', '')) ? `+${value}` : `${prefix}${value}`
          
          const normalize = (p?: string | null) => (p || '').replace(/\D/g, '')
          
          if (contact && normalize(contact.phone) === normalize(finalPhone)) return true
          
          setIsValidating(true)
          try {
            const isDuplicate = await contactService.checkPhoneAvailability(finalPhone)
            return !isDuplicate
          } catch (e) {
            return true
          } finally {
            setIsValidating(false)
          }
        }
      ),
      countryPrefix: yup.string().default('+57'),
      address: yup.string().nullable(),
      documentType: yup.string().default('CC'),
      documentNumber: yup.string().nullable().test(
        'checkDocument',
        'Este número de documento ya está registrado en esta compañía',
        async (value) => {
          if (!value) return true
          const currentDoc = (contact?.documentNumber || '').trim()
          const newDoc = (value || '').trim()
          
          if (contact && currentDoc === newDoc) return true
          
          setIsValidating(true)
          try {
            const isDuplicate = await contactService.checkDocumentAvailability(newDoc, contact?.id)
            return !isDuplicate
          } catch (e) {
            return true
          } finally {
            setIsValidating(false)
          }
        }
      ),
      type: yup.string().default('LEAD'),
      pipelineId: yup.number().nullable(),
      stageId: yup.number().nullable(),
      isActive: yup.boolean().default(true),
      assignedUserIds: yup.string().nullable()
    })
  }, [contact, companyId])

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      countryPrefix: '+57',
      address: '',
      documentType: 'CC',
      documentNumber: '',
      type: 'LEAD',
      pipelineId: undefined,
      stageId: undefined,
      isActive: true,
      assignedUserIds: ''
    }
  })

  const watchedPipelineId = watch('pipelineId')

  // Fetch active database users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.getAllUsers()
        const active = users.filter(u => u.isEnabled)
        setActiveUsers(active)
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    fetchUsers()
  }, [])

  // Load initial data
  useEffect(() => {
    if (contact) {
      let phoneOnly = contact.phone || ''
      let prefix = '+57'
      
      if (phoneOnly.startsWith('+')) {
        const found = COUNTRY_CODES.find(cc => phoneOnly.startsWith(cc.value))
        if (found) {
          prefix = found.value
          phoneOnly = phoneOnly.replace(found.value, '')
        }
      }

      reset({
        name: contact.name,
        email: contact.email || '',
        phone: phoneOnly,
        countryPrefix: prefix,
        address: contact.address || '',
        documentType: contact.documentType || 'CC',
        documentNumber: contact.documentNumber || '',
        type: contact.type || 'LEAD',
        pipelineId: contact.pipelineId,
        stageId: contact.stageId,
        isActive: contact.isActive !== undefined ? contact.isActive : true,
        assignedUserIds: contact.assignedUserIds || ''
      })
    } else {
      // Default pipeline for new contact
      const defaultPipeline = pipelines.find(p => p.isDefault)
      if (defaultPipeline) {
        setValue('pipelineId', defaultPipeline.id)
        const initialStage = defaultPipeline.stages?.find(s => s.isInitial) || defaultPipeline.stages?.[0]
        if (initialStage) setValue('stageId', initialStage.id)
      }
    }
  }, [contact, pipelines, reset, setValue])

  // Update available stages when pipeline changes
  useEffect(() => {
    if (watchedPipelineId) {
      const pipeline = pipelines.find(p => p.id === watchedPipelineId)
      setAvailableStages(pipeline?.stages || [])
    } else {
      setAvailableStages([])
    }
  }, [watchedPipelineId, pipelines])

  const onFormSubmit = async (data: any) => {
    try {
      const finalPhone = data.phone.startsWith(data.countryPrefix.replace('+', '')) 
        ? `+${data.phone}` 
        : `${data.countryPrefix}${data.phone.replace(/\D/g, '')}`

      const stageName = availableStages.find(s => s.id === data.stageId)?.name || 'LEAD'

      await onSave({
        ...data,
        phone: finalPhone,
        stage: stageName,
        status: 'ACTIVE',
        tagIds: selectedTags.map(t => t.id)
      })
    } catch (err: any) {
        // Validation errors are already handled by Hook Form, but 409 Conflict can come here
        console.error('Submission error:', err)
    }
  }

  return (
    <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
      <CardHeader 
        title={contact ? "Editar Contacto" : "Información del Contacto"} 
        titleTypographyProps={{ variant: 'h5', className: 'font-semibold' }}
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Icon icon="tabler:user-plus" /></Avatar>}
        sx={{ borderBottom: 1, borderColor: 'divider', pb: 4 }}
      />
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent sx={{ pt: 6 }}>
          <Box mb={6}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 600, letterSpacing: 1.2 }}>
              Datos Personales
            </Typography>
            <Divider sx={{ mt: 1, mb: 4, width: '40px', borderBottomWidth: 3, borderRadius: 1, borderColor: 'primary.main' }} />
          </Box>
          
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre Completo / Razón Social *"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="Ej: Juan Pérez o Empresa SAS"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono / WhatsApp"
                    placeholder="3001234567"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Controller
                            name="countryPrefix"
                            control={control}
                            render={({ field: prefixField }) => (
                              <Select
                                {...prefixField}
                                variant="standard"
                                sx={{ 
                                  '& .MuiSelect-select': { py: 0, pl: 0, pr: '20px !important' },
                                  '&:before, &:after': { display: 'none' }
                                }}
                              >
                                {COUNTRY_CODES.map(c => (
                                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                ))}
                              </Select>
                            )}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: isValidating ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} color="inherit" />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Correo Electrónico"
                    placeholder="juan@ejemplo.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      endAdornment: isValidating ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} color="inherit" />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Documento</InputLabel>
                <Controller
                  name="documentType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo de Documento">
                      <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                      <MenuItem value="NIT">NIT</MenuItem>
                      <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                      <MenuItem value="PP">Pasaporte</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="documentNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Documento"
                    placeholder="123456789"
                    error={!!errors.documentNumber}
                    helperText={errors.documentNumber?.message}
                    InputProps={{
                      endAdornment: isValidating ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} color="inherit" />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección"
                    multiline
                    rows={2}
                    placeholder="Carrera 1 # 2 - 3"
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box mt={8} mb={6}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 600, letterSpacing: 1.2 }}>
              Etapa en el Embudo
            </Typography>
            <Divider sx={{ mt: 1, mb: 4, width: '40px', borderBottomWidth: 3, borderRadius: 1, borderColor: 'primary.main' }} />
          </Box>

          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.pipelineId}>
                <InputLabel>Embudo (Pipeline)</InputLabel>
                <Controller
                  name="pipelineId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Embudo (Pipeline)" value={field.value || ''}>
                      <MenuItem value=""><em>Ninguno</em></MenuItem>
                      {pipelines.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.pipelineId && <FormHelperText>{errors.pipelineId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!watchedPipelineId} error={!!errors.stageId}>
                <InputLabel>Etapa Actual</InputLabel>
                <Controller
                  name="stageId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Etapa Actual" value={field.value || ''}>
                      <MenuItem value=""><em>Seleccionar Etapa</em></MenuItem>
                      {availableStages.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.stageId && <FormHelperText>{errors.stageId.message}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Contacto</InputLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo de Contacto">
                      <MenuItem value="LEAD">Lead / Prospecto</MenuItem>
                      <MenuItem value="CLIENT">Cliente</MenuItem>
                      <MenuItem value="VENDOR">Proveedor</MenuItem>
                      <MenuItem value="OTHER">Otro</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} color="success" />}
                    label={field.value ? "Contacto Habilitado" : "Contacto Deshabilitado"}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="assignedUserIds"
                control={control}
                render={({ field: { value, onChange } }) => {
                  const selectedIds = value ? String(value).split(',') : [];
                  const selectedOptions = activeUsers.filter(u => selectedIds.includes(String(u.id)));

                  return (
                    <Autocomplete
                      multiple
                      options={activeUsers}
                      value={selectedOptions}
                      getOptionLabel={(option) => `${option.nombres} ${option.apellidos} (${option.username})`}
                      isOptionEqualToValue={(option, val) => option.id === val.id}
                      onChange={(_, newValue) => {
                        onChange(newValue.map(u => u.id).join(','));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Asignar Usuarios"
                          placeholder="Buscar y seleccionar usuarios..."
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            label={`${option.nombres} ${option.apellidos}`}
                            {...getTagProps({ index })}
                            key={option.id}
                            variant="outlined"
                            color="primary"
                            size="small"
                          />
                        ))
                      }
                    />
                  );
                }}
              />
            </Grid>

            {/* Tag Selection Field */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box flexGrow={1}>
                  <Autocomplete
                    multiple
                    options={availableTags}
                    value={selectedTags}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    onChange={(_, newValue) => {
                      setSelectedTags(newValue)
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Etiquetas (Tags)"
                        placeholder="Buscar y seleccionar etiquetas..."
                      />
                    )}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                          size="small"
                          sx={{
                            backgroundColor: `${option.color || '#7367F0'}1e`,
                            color: option.color || '#7367F0',
                            borderColor: `${option.color || '#7367F0'}3f`,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            fontWeight: 500
                          }}
                        />
                      ))
                    }
                  />
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setIsTagModalOpen(true)}
                  sx={{ minWidth: '48px', height: '48px', p: 0 }}
                >
                  <Icon icon="tabler:settings" fontSize="20px" />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ px: 6, pb: 8, pt: 4, justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', mt: 4, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            * Campos obligatorios
          </Typography>
          <Button 
            variant="contained" 
            type="submit"
            disabled={saving || isValidating || Object.keys(errors).length > 0}
            size="large"
            sx={{ px: 10, py: 3, fontWeight: 600, borderRadius: '8px' }}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Icon icon="tabler:device-floppy" />}
          >
            {contact ? 'Guardar Cambios' : 'Crear Contacto Nuevo'}
          </Button>
        </CardActions>

        <TagManagementModal
          open={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          onTagsUpdated={loadAvailableTags}
        />
      </form>
    </Card>
  )
}
