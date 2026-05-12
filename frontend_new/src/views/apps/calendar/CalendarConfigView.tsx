'use client'

import React, { useState, useEffect } from 'react'
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
import { productService } from '@/services/ventas/productService'
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
  const [services, setServices] = useState<any[]>([])
  const [serviceId, setServiceId] = useState<number | ''>('')
  const [genMode, setGenMode] = useState('range') // 'range' or 'indefinite'
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 30))
  const [exceptions, setExceptions] = useState<any[]>([])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await productService.getProductsByType('SERVICE')
        setServices(data)
        if (data.length > 0) setServiceId(data[0].id)
      } catch (error) {
        console.error('Error fetching service products:', error)
      }
    }
    fetchServices()
  }, [])

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
        exceptions: JSON.stringify(exceptions),
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
          <InputLabel>Servicio (Producto tipo Servicio)</InputLabel>
          <Select 
            value={serviceId} 
            label='Servicio (Producto tipo Servicio)'
            onChange={(e) => setServiceId(e.target.value as number)}
          >
            {services.map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.productName}
              </MenuItem>
            ))}
            {services.length === 0 && <MenuItem disabled>No hay productos tipo servicio creados</MenuItem>}
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
          <Box>
            <Typography variant='h6'>Excepciones (Días especiales)</Typography>
            <Typography variant='body2' color='textSecondary'>Configura bloqueos o cambios de horario por fechas específicas</Typography>
          </Box>
          <Button 
            variant='tonal' 
            size='small'
            startIcon={<Icon icon='tabler:plus' />}
            onClick={() => setExceptions([...exceptions, { 
              detail: '', 
              startDate: format(new Date(), 'yyyy-MM-dd'), 
              endDate: format(new Date(), 'yyyy-MM-dd'), 
              allDay: true, 
              enabled: false // Default: Blocked
            }])}
          >
            Nueva Excepción
          </Button>
        </Box>
        <Stack spacing={4}>
          {exceptions.map((exc, idx) => (
            <Card key={idx} variant='outlined' className='p-4 bg-gray-50/50'>
              <Grid container spacing={4} alignItems='center'>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    size='small' 
                    label='Detalle / Motivo' 
                    placeholder='Ej: Cita Médica'
                    value={exc.detail}
                    onChange={(e) => {
                      const newExc = [...exceptions]
                      newExc[idx].detail = e.target.value
                      setExceptions(newExc)
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4} className='flex gap-2'>
                  <TextField 
                    type='date' 
                    size='small' 
                    label='Desde'
                    InputLabelProps={{ shrink: true }}
                    value={exc.startDate} 
                    onChange={(e) => {
                      const newExc = [...exceptions]
                      newExc[idx].startDate = e.target.value
                      setExceptions(newExc)
                    }}
                  />
                  <TextField 
                    type='date' 
                    size='small' 
                    label='Hasta'
                    InputLabelProps={{ shrink: true }}
                    value={exc.endDate} 
                    onChange={(e) => {
                      const newExc = [...exceptions]
                      newExc[idx].endDate = e.target.value
                      setExceptions(newExc)
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3} className='flex items-center gap-4'>
                  <Box className='flex flex-col items-center'>
                    <Typography variant='caption'>Todo el día</Typography>
                    <Switch 
                      size='small'
                      checked={exc.allDay} 
                      onChange={(e) => {
                        const newExc = [...exceptions]
                        newExc[idx].allDay = e.target.checked
                        setExceptions(newExc)
                      }} 
                    />
                  </Box>
                  <Box className='flex flex-col items-center'>
                    <Typography variant='caption'>Habilitado</Typography>
                    <Switch 
                      size='small'
                      checked={exc.enabled} 
                      onChange={(e) => {
                        const newExc = [...exceptions]
                        newExc[idx].enabled = e.target.checked
                        setExceptions(newExc)
                      }} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={1} className='flex justify-end'>
                  <IconButton color='error' onClick={() => setExceptions(exceptions.filter((_, i) => i !== idx))}>
                    <Icon icon='tabler:trash' />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}
          {exceptions.length === 0 && (
            <Box className='flex flex-col items-center p-8 border-2 border-dashed rounded-lg bg-gray-50'>
              <Icon icon='tabler:calendar-cancel' fontSize={40} className='text-gray-300 mb-2' />
              <Typography color='textSecondary'>No hay excepciones configuradas</Typography>
            </Box>
          )}
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
