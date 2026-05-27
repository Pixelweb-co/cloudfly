'use client'

import React from 'react'
import { Card, CardContent, Grid, Typography, Box, Avatar, LinearProgress } from '@mui/material'
import { Icon } from '@iconify/react'
import { Campaign } from '@/types/marketing/campaignTypes'

interface Props {
  campaign: Campaign
}

export default function CampaignMetricsPanel({ campaign }: Props) {
  const stats = [
    { 
      label: 'Enviados', 
      value: campaign.totalSent, 
      icon: 'tabler:send', 
      color: 'primary.main',
      bg: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)' 
    },
    { 
      label: 'Entregados', 
      value: campaign.totalDelivered, 
      icon: 'tabler:circle-check', 
      color: 'success.main',
      bg: 'rgba(var(--mui-palette-success-mainChannel) / 0.1)' 
    },
    { 
      label: 'Leídos', 
      value: campaign.totalRead, 
      icon: 'tabler:eye', 
      color: 'info.main',
      bg: 'rgba(var(--mui-palette-info-mainChannel) / 0.1)' 
    },
    { 
      label: 'Fallidos', 
      value: campaign.totalFailed, 
      icon: 'tabler:alert-circle', 
      color: 'error.main',
      bg: 'rgba(var(--mui-palette-error-mainChannel) / 0.1)' 
    }
  ]

  const deliveryRate = campaign.totalSent > 0 
    ? (campaign.totalDelivered / campaign.totalSent) * 100 
    : 0

  const openRate = campaign.totalDelivered > 0 
    ? (campaign.totalRead / campaign.totalDelivered) * 100 
    : 0

  return (
    <Grid container spacing={6}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Avatar sx={{ bgcolor: stat.bg, color: stat.color, borderRadius: '8px' }}>
                  <Icon icon={stat.icon} />
                </Avatar>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 600 }}>{stat.value}</Typography>
                  <Typography variant='caption' color='text.secondary'>{stat.label}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='subtitle2' sx={{ mb: 4 }}>Tasa de Entrega</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
              <LinearProgress 
                variant='determinate' 
                value={deliveryRate} 
                color='success' 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} 
              />
              <Typography variant='body2' className='font-medium'>{deliveryRate.toFixed(1)}%</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant='subtitle2' sx={{ mb: 4 }}>Tasa de Apertura (Read Rate)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
              <LinearProgress 
                variant='determinate' 
                value={openRate} 
                color='info' 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} 
              />
              <Typography variant='body2' className='font-medium'>{openRate.toFixed(1)}%</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
