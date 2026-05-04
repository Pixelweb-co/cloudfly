import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Grid, Button, MenuItem, 
  Typography, Divider, Box, CircularProgress, Tab, Tabs,
  Autocomplete, Avatar
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'
import { Campaign } from '@/types/marketing/campaignTypes'
import { SendingList } from '@/types/marketing/sendingListTypes'
import { Channel } from '@/types/marketing'
import { Pipeline, Stage } from '@/types/marketing/pipelineTypes'
import { productService } from '@/services/ventas/productService'
import { categoryService } from '@/services/ventas/categoryService'
import { Product } from '@/types/ventas/productTypes'
import { Category } from '@/types/apps/Types'

interface Props {
  campaign: Campaign | null
  channels: Channel[]
  sendingLists: SendingList[]
  pipelines: Pipeline[]
  onSave: (data: any) => Promise<void>
  saving: boolean
}

const formatDateTime = (date: Date) => {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const schema = yup.object().shape({
  name: yup.string().required('El nombre de la campaña es obligatorio').min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: yup.string().nullable().max(500, 'La descripción es muy larga'),
  channelId: yup.string().required('Debe seleccionar un canal de envío'),
  audienceType: yup.string().oneOf(['LIST', 'PIPELINE']).required(),
  
  // Validación condicional para Audiencia
  sendingListId: yup.string().when('audienceType', {
    is: 'LIST',
    then: (s) => s.required('Debe seleccionar una lista de envío para esta audiencia')
  }),
  pipelineId: yup.string().when('audienceType', {
    is: 'PIPELINE',
    then: (s) => s.required('Debe seleccionar un pipeline')
  }),
  pipelineStage: yup.string().when('audienceType', {
    is: 'PIPELINE',
    then: (s) => s.required('Debe seleccionar una etapa del pipeline')
  }),

  // Contenido y Medios
  message: yup.string().required('El mensaje es obligatorio').min(10, 'El mensaje debe ser más descriptivo (mín. 10 caracteres)'),
  mediaUrl: yup.string().url('Debe ser una URL válida').nullable(),
  mediaType: yup.string().oneOf(['IMAGE', 'VIDEO', 'DOCUMENT', 'NONE']).default('IMAGE'),
  mediaCaption: yup.string().nullable(),

  // Programación
  scheduledAt: yup.string().required('Debe programar una fecha y hora')
    .test('is-future', 'La fecha de programación debe ser en el futuro', function(value) {
      const { campaign } = this.options.context as any
      // Si estamos editando y el valor no ha cambiado, es válido aunque sea pasado
      if (campaign && campaign.scheduledAt && value) {
        const currentScheduled = campaign.scheduledAt.substring(0, 16)
        const newScheduled = value.substring(0, 16)
        if (currentScheduled === newScheduled) return true
      }
      
      if (!value) return false
      return new Date(value) > new Date()
    }),
  recurrence: yup.string().oneOf(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).required(),

  // Referencia a Catálogo
  refType: yup.string().oneOf(['NONE', 'PRODUCT', 'CATEGORY']).required(),
  productId: yup.string().when('refType', {
    is: 'PRODUCT',
    then: (s) => s.required('Debe seleccionar un producto del catálogo')
  }),
  categoryId: yup.string().when('refType', {
    is: 'CATEGORY',
    then: (s) => s.required('Debe seleccionar una categoría del catálogo')
  })
})

export default function CampaignFormPanel({ campaign, channels, sendingLists, pipelines, onSave, saving }: Props) {
  const [availableStages, setAvailableStages] = useState<Stage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { campaign },
    defaultValues: {
      name: '',
      description: '',
      channelId: '',
      audienceType: 'LIST',
      sendingListId: '',
      pipelineId: '',
      pipelineStage: '',
      message: '',
      mediaUrl: '',
      mediaType: 'IMAGE',
      mediaCaption: '',
      refType: 'NONE',
      productId: '',
      categoryId: '',
      scheduledAt: formatDateTime(new Date(Date.now() + 60000)),
      recurrence: 'NONE'
    }
  })

  const watchAudienceType = watch('audienceType')
  const watchPipelineId = watch('pipelineId')
  const watchRefType = watch('refType')
  const watchProductId = watch('productId')
  const watchCategoryId = watch('categoryId')

  useEffect(() => {
    if (campaign) {
      reset({
        ...campaign,
        audienceType: campaign.pipelineId ? 'PIPELINE' : 'LIST',
        refType: campaign.productId ? 'PRODUCT' : (campaign.categoryId ? 'CATEGORY' : 'NONE'),
        recurrence: campaign.recurrence || 'NONE'
      } as any)
    }
  }, [campaign, reset])

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true)
        const [prodData, catData] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategories()
        ])
        const enrichedProducts = (prodData || []).map((p: any) => ({
          ...p,
          name: p.productName || p.name,
          code: p.sku || p.barcode,
          categories: (p.categoryIds || []).map((id: number) => {
            const cat = catData.find((c: any) => c.id === id)
            return cat?.nombreCategoria || cat?.name || ''
          }).filter(Boolean).join(', ')
        }))
        setProducts(enrichedProducts)
        setCategories(catData || [])
      } catch (err) {
        console.error('Error loading catalog:', err)
      } finally {
        setLoadingCatalog(false)
      }
    }
    loadCatalog()
  }, [])

  useEffect(() => {
    if (watchPipelineId) {
      const selectedPipeline = pipelines.find(p => p.id === watchPipelineId)
      setAvailableStages(selectedPipeline?.stages || [])
    } else {
      setAvailableStages([])
    }
  }, [watchPipelineId, pipelines])

  const truncateDescription = (desc: string) => {
    if (!desc) return 'Sin descripción disponible.'
    const words = desc.split(/\s+/)
    if (words.length <= 10) return desc
    return words.slice(0, 10).join(' ') + '...'
  }

  const getImgUrl = (url?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'
    if (!url) return '/images/avatars/1.png'
    if (url.startsWith('http')) return url
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const onSubmit = (data: any) => {
    const submission = { ...data }
    if (data.audienceType === 'LIST') {
      submission.pipelineId = null
      submission.pipelineStage = null
    } else {
      submission.sendingListId = null
    }

    if (data.refType === 'NONE') {
      submission.productId = null
      submission.categoryId = null
    } else if (data.refType === 'PRODUCT') {
      submission.categoryId = null
    } else {
      submission.productId = null
    }

    onSave(submission)
  }

  const selectedProduct = products.find(p => p.id === watchProductId)
  const selectedCategory = categories.find(c => c.id === watchCategoryId)

  return (
    <Card>
      <CardHeader 
        title='Configuración de la Campaña' 
        avatar={<Icon icon='tabler:settings-automation' fontSize='1.5rem' />}
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            {/* Sección 1: Identificación */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>1. Identificación y Canal</Typography>
              <Grid container spacing={5}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name='name'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Nombre de la Campaña'
                        placeholder='Ej: Promoción de Verano'
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        sx={{ mb: 4 }}
                      />
                    )}
                  />
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        multiline
                        rows={2}
                        label='Descripción Interna'
                        placeholder='Notas sobre el objetivo de esta campaña...'
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name='channelId'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        label='Canal de Envío'
                        error={!!errors.channelId}
                        helperText={errors.channelId?.message}
                      >
                        {channels.length === 0 && <MenuItem disabled>Cargando canales...</MenuItem>}
                        {channels.map(ch => (
                          <MenuItem key={ch.id} value={ch.id}>{ch.name} ({ch.platform})</MenuItem>
                        ))}
                      </CustomTextField>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Sección 2: Audiencia */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>2. Segmentación de Audiencia</Typography>
              <Controller
                name='audienceType'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label='Tipo de Audiencia'
                    sx={{ mb: 4 }}
                  >
                    <MenuItem value='LIST'>Lista de Envío</MenuItem>
                    <MenuItem value='PIPELINE'>Etapa de Pipeline (CRM)</MenuItem>
                  </CustomTextField>
                )}
              />

              {watchAudienceType === 'LIST' ? (
                <Controller
                  name='sendingListId'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      label='Seleccionar Lista'
                      error={!!errors.sendingListId}
                      helperText={errors.sendingListId?.message}
                    >
                      {sendingLists.length === 0 && <MenuItem disabled>No hay listas creadas</MenuItem>}
                      {sendingLists.map(list => (
                        <MenuItem key={list.id} value={list.id}>{list.name} ({list.totalContacts} contactos)</MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              ) : (
                <Grid container spacing={5}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name='pipelineId'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          fullWidth
                          label='Seleccionar Pipeline'
                          error={!!errors.pipelineId}
                          helperText={errors.pipelineId?.message}
                          onChange={(e) => {
                            field.onChange(e)
                            setValue('pipelineStage', '')
                          }}
                        >
                          {pipelines.length === 0 && <MenuItem disabled>Cargando pipelines...</MenuItem>}
                          {pipelines.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name='pipelineStage'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          fullWidth
                          label='Etapa (Stage)'
                          error={!!errors.pipelineStage}
                          helperText={errors.pipelineStage?.message}
                          disabled={!watchPipelineId}
                        >
                          {availableStages.length === 0 && <MenuItem disabled>Selecciona un pipeline</MenuItem>}
                          {availableStages.map(s => (
                            <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Sección 3: Contenido */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>3. Contenido del Mensaje</Typography>
              <Controller
                name='message'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label='Cuerpo del Mensaje'
                    placeholder='Hola {{nombre}}, tenemos una oferta para ti...'
                    error={!!errors.message}
                    helperText={errors.message?.message || 'Usa {{nombre}}, {{email}}, {{telefono}} como variables.'}
                  />
                )}
              />
            </Grid>

            {/* Sección 4: Referencia a Catálogo */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>4. Vincular Producto Chatbot (Catálogo)</Typography>
              <Controller
                name='refType'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label='Vincular con'
                    sx={{ mb: 4 }}
                  >
                    <MenuItem value='NONE'>Ninguno</MenuItem>
                    <MenuItem value='PRODUCT'>Producto Específico</MenuItem>
                    <MenuItem value='CATEGORY'>Categoría Completa</MenuItem>
                  </CustomTextField>
                )}
              />

              {watchRefType === 'PRODUCT' && (
                <>
                  <Autocomplete
                    fullWidth
                    options={products}
                    getOptionLabel={(option) => `${option.productName || option.name} (${option.sku || option.code || ''})`}
                    value={products.find(p => p.id === watchProductId) || null}
                    onChange={(_, newValue) => setValue('productId', newValue?.id || '')}
                    renderInput={(params) => (
                      <CustomTextField 
                        {...params} 
                        label='Buscar Producto' 
                        error={!!errors.productId}
                        helperText={errors.productId?.message}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                          <Avatar 
                            variant='rounded'
                            src={getImgUrl(option.imageUrls?.[0])} 
                            sx={{ width: 40, height: 40, bgcolor: 'background.default' }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>{option.productName || option.name}</Typography>
                            <Typography variant='caption' color='text.secondary'>SKU: {option.sku || option.code || 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                  />
                  {selectedProduct && (
                    <Box sx={{ mt: 4, p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', gap: 4, alignItems: 'center', bgcolor: 'action.hover' }}>
                      <Box 
                        component='img' 
                        src={getImgUrl(selectedProduct.imageUrls?.[0])} 
                        sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                        onError={(e: any) => { e.target.src = '/images/avatars/1.png' }}
                      />
                      <Box>
                        <Typography variant='h6' color='primary'>{selectedProduct.productName || selectedProduct.name}</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                          {truncateDescription(selectedProduct.productDescription || selectedProduct.description)}
                        </Typography>
                        <Typography variant='caption' sx={{ mt: 2, display: 'block', fontWeight: 600 }}>
                          SKU: {selectedProduct.sku || selectedProduct.code || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}

              {watchRefType === 'CATEGORY' && (
                <>
                  <Autocomplete
                    fullWidth
                    options={categories}
                    getOptionLabel={(option) => option.nombreCategoria || option.name || ''}
                    value={categories.find(c => c.id === watchCategoryId) || null}
                    onChange={(_, newValue) => setValue('categoryId', newValue?.id || '')}
                    renderInput={(params) => (
                      <CustomTextField 
                        {...params} 
                        label='Buscar Categoría' 
                        error={!!errors.categoryId}
                        helperText={errors.categoryId?.message}
                      />
                    )}
                  />
                  {selectedCategory && (
                    <Box sx={{ mt: 4, p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', gap: 4, alignItems: 'center', bgcolor: 'action.hover' }}>
                      <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light', color: 'primary.main' }}>
                        <Icon icon='tabler:category' fontSize='2rem' />
                      </Avatar>
                      <Box>
                        <Typography variant='h6' color='primary'>{selectedCategory.nombreCategoria || selectedCategory.name}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {truncateDescription(selectedCategory.descripcion || '')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Sección 5: Programación */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>5. Programación de Envío</Typography>
              <Grid container spacing={5}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name='scheduledAt'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        type='datetime-local'
                        label='Fecha y Hora de Envío'
                        error={!!errors.scheduledAt}
                        helperText={errors.scheduledAt?.message}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: formatDateTime(new Date())
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name='recurrence'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        label='Recurrencia'
                      >
                        <MenuItem value='NONE'>No se repite</MenuItem>
                        <MenuItem value='DAILY'>Diario</MenuItem>
                        <MenuItem value='WEEKLY'>Semanal</MenuItem>
                        <MenuItem value='MONTHLY'>Mensual</MenuItem>
                      </CustomTextField>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Button 
                type='submit' 
                variant='contained' 
                fullWidth 
                size='large'
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Icon icon='tabler:send' />}
              >
                {campaign ? 'Actualizar Campaña' : 'Crear y Programar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

