'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Tooltip,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { campaignService } from '@/services/marketing/campaignService'
import { Campaign } from '@/types/marketing/campaignTypes'

export default function CampaignListTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await campaignService.getAll()
      setCampaigns(data)
    } catch (e) {
      console.error('Error al cargar campañas:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (campaign: Campaign) => {
    router.push(`/marketing/campaigns/${campaign.id}`)
  }

  const handleAdd = () => {
    router.push(`/marketing/campaigns/new`)
  }

  const getStatusChip = (status: string) => {
    const colors: any = {
      DRAFT: 'secondary',
      SCHEDULED: 'primary',
      RUNNING: 'success',
      PAUSED: 'warning',
      COMPLETED: 'info',
      CANCELLED: 'error',
      FAILED: 'error'
    }
    return <Chip label={status} size='small' color={colors[status] || 'default'} variant='tonal' />
  }

  return (
    <Card>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5'>Campañas Operacionales</Typography>
        <Button 
          variant='contained' 
          startIcon={<Icon icon='tabler:plus' />}
          onClick={handleAdd}
        >
          Nueva Campaña
        </Button>
      </Box>
      
      {loading && <LinearProgress sx={{ height: 2 }} />}
      
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Campaña</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Métricas (E/D/L)</TableCell>
              <TableCell>Programación</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} align='center' sx={{ py: 10 }}>
                  <Typography color='text.secondary'>No se encontraron campañas</Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant='body1' sx={{ fontWeight: 500 }}>{campaign.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{campaign.description || 'Sin descripción'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(campaign.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title='Enviados'>
                        <Chip label={campaign.totalSent} size='small' variant='outlined' />
                      </Tooltip>
                      <Tooltip title='Entregados'>
                        <Chip label={campaign.totalDelivered} size='small' color='success' variant='outlined' />
                      </Tooltip>
                      <Tooltip title='Leídos'>
                        <Chip label={campaign.totalRead} size='small' color='info' variant='outlined' />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {campaign.scheduledAt ? format(new Date(campaign.scheduledAt), 'dd/MM/yyyy HH:mm') : 'Manual'}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Ver detalle / Métricas'>
                      <IconButton onClick={() => handleEdit(campaign)}>
                        <Icon icon='tabler:chart-bar' />
                      </IconButton>
                    </Tooltip>
                    <IconButton size='small'>
                      <Icon icon='tabler:dots-vertical' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
