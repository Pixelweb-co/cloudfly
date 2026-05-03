'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Grid, Button, MenuItem, 
  Typography, Divider, Box, CircularProgress, Alert, Tab, Tabs
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'
import { Campaign } from '@/types/marketing/campaignTypes'
import { SendingList } from '@/types/marketing/sendingListTypes'
import { Channel } from '@/types/marketing'
import { Pipeline } from '@/types/marketing/pipelineTypes'

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

  useEffect(() => {
    if (campaign) {
      setFormData({
        ...campaign,
        audienceType: campaign.pipelineId ? 'PIPELINE' : 'LIST',
        refType: campaign.productId ? 'PRODUCT' : (campaign.categoryId ? 'CATEGORY' : 'NONE')
      })
    }
  }, [campaign])

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
                      onChange={e => setFormData({ ...formData, pipelineId: e.target.value })}
                      required
                    >
                      {pipelines.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </CustomTextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CustomTextField
                      fullWidth
                      label='Etapa (Stage)'
                      value={formData.pipelineStage}
                      onChange={e => setFormData({ ...formData, pipelineStage: e.target.value })}
                      placeholder='Ej: LEAD, CONTACTADO'
                    />
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
                <CustomTextField
                  fullWidth
                  label='ID del Producto'
                  value={formData.productId}
                  onChange={e => setFormData({ ...formData, productId: e.target.value })}
                />
              )}

              {formData.refType === 'CATEGORY' && (
                <CustomTextField
                  fullWidth
                  label='ID de la Categoría'
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
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
