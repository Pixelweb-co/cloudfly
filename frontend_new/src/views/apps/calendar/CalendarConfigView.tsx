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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useSession } from 'next-auth/react'
import calendarService from '@/services/calendarService'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { addDays, format } from 'date-fns'

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
  const [serviceId, setServiceId] = useState(1)
  const [genMode, setGenMode] = useState('range') // 'range' or 'indefinite'
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 30))
  const [exceptions, setExceptions] = useState<any[]>([])

  const handleSave = async () => {
    try {
      setLoading(true)
      const user = session?.user as any
      const tenantId = user?.tenantId || 1
      const companyId = user?.companyId || 1

      const templateData = {
        tenantId,
        companyId,
        serviceId,
        name: `Template Service ${serviceId}`,
        weeklySchedule: JSON.stringify({
          lunes: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
          martes: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
          miercoles: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
          jueves: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
          viernes: { enabled: true, ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] }
        }),
        exceptions: JSON.stringify(
          exceptions.reduce((acc: any, curr: any) => {
            acc[curr.date] = { enabled: curr.enabled, ranges: curr.ranges }
            return acc
          }, {})
        ),
        durationDefault: 30,
        bufferAfter: 5,
        maxFutureRange: genMode === 'indefinite' ? 365 : 30,
        allowWeekends: false
      }

      const savedTemplate = await calendarService.saveTemplate(templateData)
      
      const sDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined
      const eDate = genMode === 'indefinite' ? format(addDays(new Date(), 365), 'yyyy-MM-dd') : (endDate ? format(endDate, 'yyyy-MM-dd') : undefined)
      
      await calendarService.generateSlots(savedTemplate.id, sDate, eDate)
      
      alert('Disponibilidad y Servicio configurados correctamente')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al procesar la configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Servicio Asociado</InputLabel>
          <Select 
            value={serviceId} 
            label='Servicio Asociado'
            onChange={(e) => setServiceId(e.target.value as number)}
          >
            <MenuItem value={1}>Consulta General</MenuItem>
            <MenuItem value={2}>Asesoría Técnica</MenuItem>
            <MenuItem value={3}>Soporte Premium</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <Box className='flex items-center gap-4 h-full'>
          <Typography>Modo de generación:</Typography>
          <Chip 
            label='Rango de Fechas' 
            variant={genMode === 'range' ? 'filled' : 'outlined'} 
            color='primary' 
            onClick={() => setGenMode('range')} 
          />
          <Chip 
            label='Indefinido (1 año)' 
            variant={genMode === 'indefinite' ? 'filled' : 'outlined'} 
            color='primary' 
            onClick={() => setGenMode('indefinite')} 
          />
        </Box>
      </Grid>

      {genMode === 'range' && (
        <Grid item xs={12} className='flex gap-4'>
          <AppReactDatepicker
            selected={startDate}
            onChange={(date: Date) => setStartDate(date)}
            customInput={<TextField label='Desde' fullWidth />}
          />
          <AppReactDatepicker
            selected={endDate}
            onChange={(date: Date) => setEndDate(date)}
            customInput={<TextField label='Hasta' fullWidth />}
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider />
        <Typography variant='h6' className='my-4'>Horario Semanal</Typography>
        <Stack spacing={4}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
            <Card key={day} variant='outlined' className='p-4 border-l-4 border-l-primary'>
              <Box className='flex items-center justify-between'>
                <Box className='flex items-center gap-4'>
                  <Switch defaultChecked color='primary' />
                  <Typography variant='h6' className='font-bold'>{day}</Typography>
                </Box>
                <Box className='flex items-center gap-4'>
                  <Typography variant='body2' color='textSecondary'>08:00 → 12:00</Typography>
                  <Typography variant='body2' color='textSecondary'>14:00 → 18:00</Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Divider className='my-4' />
        <Box className='flex items-center justify-between mb-4'>
          <Typography variant='h6'>Excepciones (Días específicos)</Typography>
          <Button 
            variant='tonal' 
            size='small'
            startIcon={<Icon icon='tabler:plus' />}
            onClick={() => setExceptions([...exceptions, { date: format(new Date(), 'yyyy-MM-dd'), enabled: false, ranges: [] }])}
          >
            Agregar Excepción
          </Button>
        </Box>
        <Stack spacing={2}>
          {exceptions.map((exc, idx) => (
            <Box key={idx} className='flex items-center gap-4 bg-gray-50 p-2 rounded'>
              <TextField 
                type='date' 
                size='small' 
                value={exc.date} 
                onChange={(e) => {
                  const newExc = [...exceptions]
                  newExc[idx].date = e.target.value
                  setExceptions(newExc)
                }}
              />
              <Chip 
                label={exc.enabled ? 'Abierto' : 'Cerrado (Bloqueado)'} 
                color={exc.enabled ? 'success' : 'error'} 
                onClick={() => {
                  const newExc = [...exceptions]
                  newExc[idx].enabled = !newExc[idx].enabled
                  setExceptions(newExc)
                }}
              />
              <IconButton color='error' onClick={() => setExceptions(exceptions.filter((_, i) => i !== idx))}>
                <Icon icon='tabler:trash' />
              </IconButton>
            </Box>
          ))}
          {exceptions.length === 0 && <Typography color='textSecondary'>No hay excepciones configuradas</Typography>}
        </Stack>
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
