'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Switch,
  TextField,
  Divider,
  Grid,
  IconButton,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useSession } from 'next-auth/react'
import calendarService from '@/services/calendarService'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`calendar-config-tabpanel-${index}`}
      aria-labelledby={`calendar-config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 4 }}>{children}</Box>}
    </div>
  )
}

const CalendarConfigView = () => {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Card className='shadow-lg'>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
        <Typography variant='h5' className='mb-4 font-bold'>
          Configuración de Disponibilidad
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label='calendar configuration tabs'>
          <Tab label='Disponibilidad' icon={<Icon icon='tabler:calendar-time' />} iconPosition='start' />
          <Tab label='Parámetros Generales' icon={<Icon icon='tabler:settings' />} iconPosition='start' />
          <Tab label='Integraciones' icon={<Icon icon='tabler:link' />} iconPosition='start' />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <AvailabilityTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <GeneralParamsTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <IntegrationsTab />
      </TabPanel>
    </Card>
  )
}

const AvailabilityTab = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      setLoading(true)
      const user = session?.user as any
      const tenantId = user?.tenantId || 1
      const companyId = user?.companyId || 1

      // Dummy template data for now, ideally populated from form state
      const templateData = {
        tenantId,
        companyId,
        name: 'Default Template',
        weeklySchedule: '{}', // Simplified
        durationDefault: 30,
        bufferBefore: 0,
        bufferAfter: 0,
        minAnticipation: 24,
        maxFutureRange: 30,
        allowWeekends: false
      }

      const savedTemplate = await calendarService.saveTemplate(templateData)
      await calendarService.generateSlots(savedTemplate.id)
      
      alert('Disponibilidad generada correctamente')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al generar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h6' className='mb-4'>Horario Semanal</Typography>
        <Stack spacing={4}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
            <Card key={day} variant='outlined' className='p-4 border-l-4 border-l-primary'>
              <Box className='flex items-center justify-between'>
                <Box className='flex items-center gap-4'>
                  <Switch defaultChecked color='primary' />
                  <Typography variant='h6' className='font-bold'>{day}</Typography>
                </Box>
                <Box className='flex items-center gap-4'>
                  <Typography variant='body2' color='textSecondary'>08:00 → 12:00</Typography>
                  <Typography variant='body2' color='textSecondary'>14:00 → 18:00</Typography>
                  <IconButton color='primary' size='small'>
                    <Icon icon='tabler:plus' />
                  </IconButton>
                  <IconButton color='secondary' size='small'>
                    <Icon icon='tabler:copy' />
                  </IconButton>
                </Box>
              </Box>
              <Box className='mt-2'>
                <Typography variant='caption' color='textSecondary'>Duración slot: 30 min</Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Divider className='my-4' />
        <Typography variant='h6' className='mb-4'>Disponibilidad Especial (Excepciones)</Typography>
        <Button variant='tonal' startIcon={<Icon icon='tabler:calendar-plus' />}>
          Agregar Excepción
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Typography variant='h6' className='mb-4'>Vista Previa de Slots</Typography>
        <Box className='flex flex-wrap gap-2'>
          {['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00'].map(slot => (
            <Chip key={slot} label={slot} variant='outlined' color='success' />
          ))}
          <Typography variant='body2' color='textSecondary' className='w-full mt-2'>...y 12 slots más</Typography>
        </Box>
      </Grid>

      <Grid item xs={12} className='flex justify-end mt-4'>
        <Button 
          variant='contained' 
          size='large' 
          startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Icon icon='tabler:device-floppy' />}
          onClick={handleSave}
          disabled={loading}
        >
          Guardar y generar disponibilidad
        </Button>
      </Grid>
    </Grid>
  )
}

const GeneralParamsTab = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <TextField fullWidth label='Zona Horaria' defaultValue='America/Bogota' />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Duración Default (min)' defaultValue={30} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Buffer antes de cita (min)' defaultValue={5} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Buffer después de cita (min)' defaultValue={5} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Anticipación mínima reserva (horas)' defaultValue={24} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Tiempo máximo reserva futura (días)' defaultValue={30} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField fullWidth type='number' label='Límite diario de citas' defaultValue={10} />
      </Grid>
      <Grid item xs={12} md={6} className='flex items-center'>
        <Switch defaultChecked />
        <Typography>Permitir fines de semana</Typography>
      </Grid>
      <Grid item xs={12} className='flex justify-end'>
        <Button variant='contained'>Guardar Parámetros</Button>
      </Grid>
    </Grid>
  )
}

const IntegrationsTab = () => {
  const integrations = [
    { title: 'Chatbot IA', desc: 'Permitir reservas automáticas desde chatbot', icon: 'tabler:robot' },
    { title: 'WhatsApp', desc: 'Permitir reservas desde conversaciones', icon: 'tabler:brand-whatsapp' },
    { title: 'Página Pública', desc: 'Generar URL pública tipo Calendly', icon: 'tabler:world' },
    { title: 'Google Calendar', desc: 'Sincronización bidireccional', icon: 'tabler:brand-google' }
  ]

  return (
    <Grid container spacing={6}>
      {integrations.map((item) => (
        <Grid item xs={12} md={6} key={item.title}>
          <Card variant='outlined' className='h-full'>
            <CardContent className='flex items-center gap-4'>
              <Box sx={{ p: 2, borderRadius: 1, backgroundColor: 'primary.light' }}>
                <Icon icon={item.icon} fontSize={32} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant='h6'>{item.title}</Typography>
                <Typography variant='body2' color='textSecondary'>{item.desc}</Typography>
              </Box>
              <Switch color='primary' />
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Typography variant='body2' className='bg-gray-100 p-4 rounded'>
          URL Pública: <Typography component='span' color='primary' className='font-bold underline cursor-pointer'>cloudfly.com/agenda/pixelweb</Typography>
        </Typography>
      </Grid>
    </Grid>
  )
}

export default CalendarConfigView
