'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Grid, Typography, Box, CircularProgress, IconButton, Button, Card, CardContent } from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { campaignService } from '@/services/marketing/campaignService'
import { sendingListService } from '@/services/marketing/sendingListService'
import { pipelineService } from '@/services/marketing/pipelineService'
import { channelService } from '@/services/marketing/channelService'
import { Campaign } from '@/types/marketing/campaignTypes'
import { SendingList } from '@/types/marketing/sendingListTypes'
import { Channel } from '@/types/marketing'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import CampaignFormPanel from './CampaignFormPanel'
import CampaignMetricsPanel from './CampaignMetricsPanel'
import CampaignLogsPanel from './CampaignLogsPanel'
import { showSuccessNotification } from '@/utils/notifications'

export default function CampaignDetailView() {
  const params = useParams()
  const router = useRouter()
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = idStr === 'new'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  
  // Lookups
  const [channels, setChannels] = useState<Channel[]>([])
  const [lists, setLists] = useState<SendingList[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const [chData, listData, pipeData] = await Promise.all([
          channelService.getChannels(),
          sendingListService.getAll(),
          pipelineService.getAllPipelines()
        ])
        
        setChannels(chData)
        setLists(listData)
        setPipelines(pipeData)

        if (!isNew) {
          const data = await campaignService.getById(Number(idStr))
          setCampaign(data)
        }
      } catch (err) {
        console.error(err)
        toast.error('Error al cargar datos iniciales')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [idStr, isNew])

  const handleSave = async (formData: any) => {
    try {
      setSaving(true)
      const activeTenantId = localStorage.getItem('activeTenantId')
      const activeCompanyId = localStorage.getItem('activeCompanyId')
      const dataWithContext = {
        ...formData,
        tenantId: activeTenantId ? Number(activeTenantId) : undefined,
        companyId: activeCompanyId ? Number(activeCompanyId) : undefined
      }

      if (isNew) {
        const created = await campaignService.create(dataWithContext)
        showSuccessNotification('Campaña creada y programada')
        router.replace(`/marketing/campaigns/${created.id}`)
      } else if (campaign) {
        const updated = await campaignService.update(campaign.id, dataWithContext)
        setCampaign(updated)
        showSuccessNotification('Campaña actualizada correctamente')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar la campaña')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return
    try {
      const updated = await campaignService.updateStatus(campaign.id, newStatus)
      setCampaign(updated)
      showSuccessNotification(`Campaña marcada como ${newStatus}`)
    } catch (err) {
      toast.error('No se pudo cambiar el estado')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Box display="flex" alignItems="center" gap={3}>
          <IconButton onClick={() => router.push('/marketing/campaigns/list')} sx={{ bgcolor: 'action.hover' }}>
            <Icon icon="tabler:arrow-left" />
          </IconButton>
          <Box>
            <Typography variant="h4" className="font-semibold text-textPrimary">
              {isNew ? 'Nueva Campaña Operacional' : `Campaña: ${campaign?.name}`}
            </Typography>
            {!isNew && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">ID: {campaign?.id}</Typography>
                <Icon icon="tabler:point-filled" fontSize={8} style={{ opacity: 0.3 }} />
                <Typography variant="body2" color="primary">{campaign?.status}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {!isNew && campaign?.status === 'DRAFT' && (
          <Button 
            variant='contained' 
            color='success'
            startIcon={<Icon icon='tabler:player-play' />}
            onClick={() => handleStatusChange('RUNNING')}
          >
            Lanzar Ahora
          </Button>
        )}
      </Box>

      {/* Metrics Row */}
      {!isNew && campaign && (
        <Box sx={{ mb: 6 }}>
          <CampaignMetricsPanel campaign={campaign} />
        </Box>
      )}

      {/* Main Content */}
      <Grid container spacing={6}>
        <Grid item xs={12} lg={6}>
          <CampaignFormPanel 
            campaign={campaign}
            channels={channels}
            sendingLists={lists}
            pipelines={pipelines}
            onSave={handleSave}
            saving={saving}
          />
        </Grid>
        
        <Grid item xs={12} lg={6}>
          {!isNew && (
            <CampaignLogsPanel campaignId={Number(idStr)} />
          )}
          {isNew && (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 10, border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Box textAlign="center" sx={{ opacity: 0.5 }}>
                <Icon icon='tabler:chart-bar-off' fontSize='4rem' />
                <Typography variant='h6' sx={{ mt: 4 }}>Las métricas aparecerán al crear la campaña</Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
