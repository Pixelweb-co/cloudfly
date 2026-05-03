'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Grid, Button, MenuItem, 
  Typography, Divider, Box, CircularProgress, Alert, Tab, Tabs,
  Autocomplete
} from '@mui/material'
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

export default function CampaignFormPanel({ campaign, channels, sendingLists, pipelines, onSave, saving }: Props) {
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    channelId: '',
    audienceType: 'LIST', // LIST or PIPELINE
    sendingListId: '',
    pipelineId: '',
    pipelineStage: '',
    message: '',
    mediaUrl: '',
    mediaType: 'IMAGE',
    mediaCaption: '',
    refType: 'NONE', // NONE, PRODUCT, CATEGORY
    productId: '',
    categoryId: '',
    scheduledAt: ''
  })

  const [availableStages, setAvailableStages] = useState<Stage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  useEffect(() => {
    if (campaign) {
      setFormData({
        ...campaign,
        audienceType: campaign.pipelineId ? 'PIPELINE' : 'LIST',
        refType: campaign.productId ? 'PRODUCT' : (campaign.categoryId ? 'CATEGORY' : 'NONE')
      })
    }
  }, [campaign])

  // Load Catalog Data
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
          // Map backend fields to frontend-friendly ones or ensure they are present
          name: p.productName,
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

  // Update stages when pipeline changes
  useEffect(() => {
    if (formData.pipelineId) {
      const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId)
      setAvailableStages(selectedPipeline?.stages || [])
    } else {
      setAvailableStages([])
    }
  }, [formData.pipelineId, pipelines])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clean data based on exclusivity
    const submission = { ...formData }
    if (formData.audienceType === 'LIST') {
      submission.pipelineId = null
      submission.pipelineStage = null
    } else {
      submission.sendingListId = null
    }

    if (formData.refType === 'NONE') {
      submission.productId = null
      submission.categoryId = null
    } else if (formData.refType === 'PRODUCT') {
      submission.categoryId = null
    } else {
      submission.productId = null
    }

    onSave(submission)
  }

  return (
    <Card>
      <CardHeader 
        title='Configuración de la Campaña' 
        avatar={<Icon icon='tabler:settings-automation' fontSize='1.5rem' />}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Sección 1: Identificación */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>1. Identificación y Canal</Typography>
              <Grid container spacing={5}>
                <Grid item xs={12} md={6}>
                  <CustomTextField
                    fullWidth
                    label='Nombre de la Campaña'
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Canal de Envío'
                    value={formData.channelId}
                    onChange={e => setFormData({ ...formData, channelId: e.target.value })}
                    required
                  >
                    {channels.length === 0 && <MenuItem disabled>Cargando canales...</MenuItem>}
                    {channels.map(ch => (
                      <MenuItem key={ch.id} value={ch.id}>{ch.name} ({ch.platform})</MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Sección 2: Audiencia (Exclusiva) */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>2. Segmentación de Audiencia</Typography>
              <CustomTextField
                select
                fullWidth
                label='Tipo de Audiencia'
                value={formData.audienceType}
                onChange={e => setFormData({ ...formData, audienceType: e.target.value })}
                sx={{ mb: 4 }}
              >
                <MenuItem value='LIST'>Lista de Envío</MenuItem>
                <MenuItem value='PIPELINE'>Etapa de Pipeline (CRM)</MenuItem>
              </CustomTextField>

              {formData.audienceType === 'LIST' ? (
                <CustomTextField
                  select
                  fullWidth
                  label='Seleccionar Lista'
                  value={formData.sendingListId}
                  onChange={e => setFormData({ ...formData, sendingListId: e.target.value })}
                  required
                >
                  {sendingLists.length === 0 && <MenuItem disabled>No hay listas creadas</MenuItem>}
                  {sendingLists.map(list => (
                    <MenuItem key={list.id} value={list.id}>{list.name} ({list.totalContacts} contactos)</MenuItem>
                  ))}
                </CustomTextField>
              ) : (
                <Grid container spacing={5}>
                  <Grid item xs={12} md={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Seleccionar Pipeline'
                      value={formData.pipelineId}
                      onChange={e => setFormData({ ...formData, pipelineId: e.target.value, pipelineStage: '' })}
                      required
                    >
                      {pipelines.length === 0 && <MenuItem disabled>Cargando pipelines...</MenuItem>}
                      {pipelines.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CustomTextField
                      select
                      fullWidth
                      label='Etapa (Stage)'
                      value={formData.pipelineStage}
                      onChange={e => setFormData({ ...formData, pipelineStage: e.target.value })}
                      disabled={!formData.pipelineId}
                    >
                      {availableStages.length === 0 && <MenuItem disabled>Selecciona un pipeline</MenuItem>}
                      {availableStages.map(s => (
                        <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Sección 3: Contenido */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>3. Contenido del Mensaje</Typography>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label='Cuerpo del Mensaje'
                placeholder='Hola {{nombre}}, tenemos una oferta para ti...'
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                helperText='Usa {{nombre}}, {{email}}, {{telefono}} como variables.'
              />
            </Grid>

            {/* Sección 4: Referencia a Catálogo */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>4. Referencia de Catálogo (Opcional)</Typography>
              <CustomTextField
                select
                fullWidth
                label='Vincular con'
                value={formData.refType}
                onChange={e => setFormData({ ...formData, refType: e.target.value })}
                sx={{ mb: 4 }}
              >
                <MenuItem value='NONE'>Ninguno</MenuItem>
                <MenuItem value='PRODUCT'>Producto Específico</MenuItem>
                <MenuItem value='CATEGORY'>Categoría Completa</MenuItem>
              </CustomTextField>

              {formData.refType === 'PRODUCT' && (
                <Autocomplete
                  fullWidth
                  options={products}
                  getOptionLabel={(option) => `${option.productName || option.name} (${option.sku || option.code || ''})`}
                  filterOptions={(options, { inputValue }) => {
                    const search = inputValue.toLowerCase()
                    return options.filter(option => 
                      (option.productName || option.name || '').toLowerCase().includes(search) ||
                      (option.sku || option.code || '').toLowerCase().includes(search) ||
                      (option.barcode || '').toLowerCase().includes(search) ||
                      (option.categories || '').toLowerCase().includes(search)
                    )
                  }}
                  value={products.find(p => p.id === formData.productId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, productId: newValue?.id || '' })}
                  renderInput={(params) => (
                    <CustomTextField 
                      {...params} 
                      label='Buscar Producto' 
                      placeholder='Nombre, código o categoría...'
                    />
                  )}
                  renderOption={(props, option) => {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'
                    const getImgUrl = (url?: string) => {
                      if (!url) return '/images/avatars/1.png'
                      if (url.startsWith('http')) return url
                      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
                    }

                    return (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                          <Box 
                            component='img' 
                            src={getImgUrl(option.imageUrls?.[0])} 
                            sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', bgcolor: 'background.default' }}
                            onError={(e: any) => { e.target.src = '/images/avatars/1.png' }}
                          />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>{option.productName || option.name}</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant='caption' color='text.secondary'>SKU: {option.sku || option.code || 'N/A'}</Typography>
                            <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 500 }}>{option.categories || 'Sin categoría'}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </li>
                  )}
                />
              )}

              {formData.refType === 'CATEGORY' && (
                <Autocomplete
                  fullWidth
                  options={categories}
                  getOptionLabel={(option) => option.nombreCategoria || option.name || ''}
                  value={categories.find(c => c.id === formData.categoryId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, categoryId: newValue?.id || '' })}
                  renderInput={(params) => (
                    <CustomTextField 
                      {...params} 
                      label='Buscar Categoría' 
                      placeholder='Nombre de categoría...'
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>{option.nombreCategoria || option.name}</Typography>
                      </Box>
                    </li>
                  )}
                />
              )}
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

