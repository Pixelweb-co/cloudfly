'use client'

import { useMemo } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'

import type { Contact } from '@/types/marketing/contactTypes'

interface CRMStatsCardsProps {
  contactsData: Contact[]
}

const CRMStatsCards = ({ contactsData = [] }: CRMStatsCardsProps) => {
  const theme = useTheme()

  // CRM Calculations
  const stats = useMemo(() => {
    const total = contactsData.length
    const active = contactsData.filter((c) => c.isActive !== false).length
    const inactive = total - active
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0

    // Data completeness (Name, Email, Phone, taxId/documentNumber)
    let totalPoints = 0
    let earnedPoints = 0
    contactsData.forEach((c) => {
      totalPoints += 4
      if (c.name) earnedPoints++
      if (c.email) earnedPoints++
      if (c.phone) earnedPoints++
      if (c.taxId || c.documentNumber) earnedPoints++
    })
    const completenessPercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Segment distribution
    const lead = contactsData.filter((c) => c.type === 'LEAD').length
    const customer = contactsData.filter((c) => c.type === 'CUSTOMER' || c.type === 'CLIENT').length
    const potential = contactsData.filter((c) => c.type === 'POTENTIAL_CUSTOMER').length
    const supplier = contactsData.filter((c) => c.type === 'SUPPLIER').length
    const other = total - (lead + customer + potential + supplier)

    // Channels distribution
    const hasEmail = contactsData.filter((c) => c.email).length
    const hasPhone = contactsData.filter((c) => c.phone).length
    const hasDoc = contactsData.filter((c) => c.taxId || c.documentNumber).length

    return {
      total,
      active,
      inactive,
      activePercent,
      completenessPercent,
      segments: { lead, customer, potential, supplier, other },
      channels: { hasEmail, hasPhone, hasDoc }
    }
  }, [contactsData])

  return (
    <Grid container spacing={6} sx={{ mb: 6 }}>
      {/* Card 1: Total & Active Status */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant='rounded' sx={{ backgroundColor: 'success.light', color: 'success.main', width: 38, height: 38 }}>
                  <i className='tabler-users text-xl' />
                </Avatar>
                <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
                  Total Contactos
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant='h4' color='text.primary' sx={{ fontWeight: 'bold' }}>
                  {stats.total}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {stats.active} Activos / {stats.inactive} Inactivos
                </Typography>
              </Box>
            </Box>
            
            {/* Elegant Circular Progress */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
              <CircularProgress
                variant='determinate'
                value={100}
                size={64}
                thickness={4.5}
                sx={{ color: theme.palette?.action?.hover || '#f1f1f2', position: 'absolute' }}
              />
              <CircularProgress
                variant='determinate'
                value={stats.activePercent}
                size={64}
                thickness={4.5}
                sx={{ color: 'success.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant='caption' component='div' color='text.primary' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {`${stats.activePercent}%`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 2: CRM Data Quality Index */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant='rounded' sx={{ backgroundColor: 'primary.light', color: 'primary.main', width: 38, height: 38 }}>
                  <i className='tabler-shield-check text-xl' />
                </Avatar>
                <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
                  Salud de Datos CRM
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant='h4' color='text.primary' sx={{ fontWeight: 'bold' }}>
                  {stats.completenessPercent}%
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Índice de completitud
                </Typography>
              </Box>
            </Box>
            
            {/* Elegant Circular Progress */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
              <CircularProgress
                variant='determinate'
                value={100}
                size={64}
                thickness={4.5}
                sx={{ color: theme.palette?.action?.hover || '#f1f1f2', position: 'absolute' }}
              />
              <CircularProgress
                variant='determinate'
                value={stats.completenessPercent}
                size={64}
                thickness={4.5}
                sx={{ color: 'primary.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant='caption' component='div' color='text.primary' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {`${stats.completenessPercent}%`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 3: Segments Breakdown */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant='rounded' sx={{ backgroundColor: 'info.light', color: 'info.main', width: 38, height: 38 }}>
                  <i className='tabler-hierarchy-2 text-xl' />
                </Avatar>
                <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
                  Segmentación CRM
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant='h4' color='text.primary' sx={{ fontWeight: 'bold' }}>
                  {stats.segments.customer} Clientes
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {stats.segments.lead} Leads / {stats.segments.potential} Potenciales
                </Typography>
              </Box>
            </Box>
            
            {/* Elegant Segment Bar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 110, mr: 1 }}>
              <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: theme.palette?.action?.hover || '#f1f1f2', width: '100%' }}>
                <Tooltip title={`Leads: ${stats.segments.lead}`}>
                  <Box sx={{ bgcolor: 'warning.main', width: `${stats.total > 0 ? (stats.segments.lead / stats.total) * 100 : 0}%` }} />
                </Tooltip>
                <Tooltip title={`Clientes Potenciales: ${stats.segments.potential}`}>
                  <Box sx={{ bgcolor: 'primary.main', width: `${stats.total > 0 ? (stats.segments.potential / stats.total) * 100 : 0}%` }} />
                </Tooltip>
                <Tooltip title={`Clientes: ${stats.segments.customer}`}>
                  <Box sx={{ bgcolor: 'success.main', width: `${stats.total > 0 ? (stats.segments.customer / stats.total) * 100 : 0}%` }} />
                </Tooltip>
                <Tooltip title={`Proveedores: ${stats.segments.supplier}`}>
                  <Box sx={{ bgcolor: 'info.main', width: `${stats.total > 0 ? (stats.segments.supplier / stats.total) * 100 : 0}%` }} />
                </Tooltip>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    Leads: {Math.round(stats.total > 0 ? (stats.segments.lead / stats.total) * 100 : 0)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    Clie: {Math.round(stats.total > 0 ? (stats.segments.customer / stats.total) * 100 : 0)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Card 4: Channels & Completeness */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant='rounded' sx={{ backgroundColor: 'warning.light', color: 'warning.main', width: 38, height: 38 }}>
                  <i className='tabler-devices text-xl' />
                </Avatar>
                <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
                  Canales Registrados
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant='h4' color='text.primary' sx={{ fontWeight: 'bold' }}>
                  {stats.channels.hasPhone} Móviles
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {stats.channels.hasEmail} Emails / {stats.channels.hasDoc} Documentos
                </Typography>
              </Box>
            </Box>
            
            {/* Elegant Channels Micro Progress Rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: 110, mr: 1 }}>
              {/* Celular Progress */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 500 }} color='text.secondary'>Móvil</Typography>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 600 }} color='text.primary'>
                    {Math.round(stats.total > 0 ? (stats.channels.hasPhone / stats.total) * 100 : 0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant='determinate' 
                  value={stats.total > 0 ? (stats.channels.hasPhone / stats.total) * 100 : 0} 
                  color='warning'
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
              {/* Email Progress */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 500 }} color='text.secondary'>Email</Typography>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 600 }} color='text.primary'>
                    {Math.round(stats.total > 0 ? (stats.channels.hasEmail / stats.total) * 100 : 0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant='determinate' 
                  value={stats.total > 0 ? (stats.channels.hasEmail / stats.total) * 100 : 0} 
                  color='warning'
                  sx={{ height: 4, borderRadius: 2, opacity: 0.7 }}
                />
              </Box>
              {/* Documento Progress */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 500 }} color='text.secondary'>Doc</Typography>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 600 }} color='text.primary'>
                    {Math.round(stats.total > 0 ? (stats.channels.hasDoc / stats.total) * 100 : 0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant='determinate' 
                  value={stats.total > 0 ? (stats.channels.hasDoc / stats.total) * 100 : 0} 
                  color='warning'
                  sx={{ height: 4, borderRadius: 2, opacity: 0.4 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CRMStatsCards
