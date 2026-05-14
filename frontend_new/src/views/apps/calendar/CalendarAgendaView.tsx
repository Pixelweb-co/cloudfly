'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import es from 'date-fns/locale/es'
import calendarService from '@/services/calendarService'
import { productService } from '@/services/ventas/productService'
import { useSession } from 'next-auth/react'
import BookAppointmentDialog from './components/BookAppointmentDialog'
import ManageAppointmentDialog from './components/ManageAppointmentDialog'

const CalendarAgendaView = () => {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [agendaItems, setAgendaItems] = React.useState<any[]>([])
  const [services, setServices] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [serviceFilter, setServiceFilter] = React.useState<number | 'all'>('all')
  const [selectedSlot, setSelectedSlot] = React.useState<any>(null)
  const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false)

  const fetchAgenda = React.useCallback(async () => {
    try {
      setLoading(true)
      const user = session?.user as any
      const tenantId = user?.tenantId || 1
      const companyId = user?.companyId || 1
      
      const start = format(currentDate, "yyyy-MM-dd'T'00:00:00")
      const end = format(currentDate, "yyyy-MM-dd'T'23:59:59")
      
      const data = await calendarService.getSlots(tenantId, companyId, start, end)
      
      const mapped = data.map((slot: any) => {
        const dStart = parseISO(slot.startTime)
        const dEnd = parseISO(slot.endTime)
        return {
          id: slot.id,
          serviceId: slot.serviceId,
          appointmentId: slot.appointmentId,
          time: `${format(dStart, 'HH:mm')} - ${format(dEnd, 'HH:mm')}`,
          contact: slot.contactName || (slot.status === 'RESERVED' ? 'Cita (Sin contacto)' : '-'),
          user: 'Admin',
          type: slot.appointmentTitle || (slot.status === 'RESERVED' ? 'Cita' : '-'),
          channel: slot.appointmentChannel || '-',
          status: slot.status
        }
      })
      setAgendaItems(mapped)
    } catch (error) {
      console.error('Error fetching agenda:', error)
    } finally {
      setLoading(false)
    }
  }, [currentDate, session])

  const fetchServices = React.useCallback(async () => {
    try {
      const data = await productService.getProductsByType('SERVICE')
      setServices(data)
      if (data.length > 0) {
        setServiceFilter(Number(data[0].id))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }, [])

  React.useEffect(() => {
    if (session) {
      fetchAgenda()
      fetchServices()
    }
  }, [fetchAgenda, fetchServices, session])

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1))
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1))

  const handleRowClick = (item: any) => {
    setSelectedSlot(item)
    if (item.status === 'AVAILABLE') {
      setIsBookDialogOpen(true)
    } else if (item.status === 'RESERVED') {
      setIsManageDialogOpen(true)
    }
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <Chip label='Disponible' color='success' variant='tonal' size='small' />
      case 'RESERVED': return <Chip label='Reservado' color='primary' variant='tonal' size='small' />
      case 'BLOCKED': return <Chip label='Bloqueado' color='error' variant='tonal' size='small' />
      case 'COMPLETED': return <Chip label='Completado' color='secondary' variant='tonal' size='small' />
      case 'CANCELLED': return <Chip label='Cancelada' color='error' variant='tonal' size='small' />
      default: return <Chip label={status} size='small' />
    }
  }

  return (
    <Card className='shadow-lg'>
      <CardContent>
        <Box className='flex items-center justify-between mb-6'>
          <Box className='flex flex-col gap-2'>
            <Typography variant='h5' className='font-bold text-primary'>Agenda Diaria</Typography>
            <Box className='flex items-center gap-2'>
              <Typography variant='body2' color='textSecondary'>Filtrar Servicio:</Typography>
              <Select 
                size='small' 
                value={serviceFilter} 
                onChange={(e) => setServiceFilter(e.target.value as any)}
                sx={{ minWidth: 200 }}
              >
                {services.map(service => (
                  <MenuItem key={service.id} value={Number(service.id)}>
                    {service.productName}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
          <Box className='flex items-center gap-2'>
            <IconButton onClick={handlePrevDay}><Icon icon='tabler:chevron-left' /></IconButton>
            <Typography variant='h6' className='capitalize bg-primary/10 px-4 py-1 rounded-full text-primary'>{format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}</Typography>
            <IconButton onClick={handleNextDay}><Icon icon='tabler:chevron-right' /></IconButton>
          </Box>
        </Box>

        <TableContainer component={Paper} variant='outlined'>
          <Table sx={{ minWidth: 650 }} aria-label='agenda table'>
            <TableHead className='bg-gray-50'>
              <TableRow>
                <TableCell className='font-bold'>Horario</TableCell>
                <TableCell className='font-bold'>Estado</TableCell>
                <TableCell className='font-bold'>Contacto</TableCell>
                <TableCell className='font-bold'>Usuario</TableCell>
                <TableCell className='font-bold'>Tipo</TableCell>
                <TableCell className='font-bold'>Canal</TableCell>
                <TableCell className='font-bold' align='right'>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>Cargando agenda...</TableCell>
                </TableRow>
              ) : agendaItems.filter(item => serviceFilter === 'all' || Number(item.serviceId) === Number(serviceFilter)).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No hay slots programados para este día.</TableCell>
                </TableRow>
              ) : (
                agendaItems.filter(item => serviceFilter === 'all' || Number(item.serviceId) === Number(serviceFilter)).map((item) => (
                  <TableRow 
                    key={item.id} 
                    hover 
                    onClick={() => handleRowClick(item)}
                    sx={{ cursor: item.status === 'AVAILABLE' || item.status === 'RESERVED' ? 'pointer' : 'default' }}
                  >
                    <TableCell className='font-medium'>{item.time}</TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>{item.contact}</TableCell>
                    <TableCell>{item.user}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      {item.channel !== '-' && (
                        <Box className='flex items-center gap-1'>
                          <Icon icon={item.channel === 'WhatsApp' ? 'tabler:brand-whatsapp' : 'tabler:map-pin'} />
                          {item.channel}
                        </Box>
                      )}
                      {item.channel === '-' && '-'}
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Ver Detalles'>
                        <IconButton size='small'><Icon icon='tabler:eye' /></IconButton>
                      </Tooltip>
                      {item.status === 'AVAILABLE' && (
                        <Tooltip title='Reservar'>
                          <IconButton size='small' color='primary'>
                            <Icon icon='tabler:calendar-plus' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <BookAppointmentDialog
        open={isBookDialogOpen}
        onClose={() => {
          setIsBookDialogOpen(false)
          setSelectedSlot(null)
        }}
        onSuccess={() => fetchAgenda()}
        initialServiceId={serviceFilter !== 'all' ? Number(serviceFilter) : undefined}
        initialDate={currentDate}
        initialSlotId={selectedSlot?.id}
      />

      <ManageAppointmentDialog
        open={isManageDialogOpen}
        onClose={() => {
          setIsManageDialogOpen(false)
          setSelectedSlot(null)
        }}
        onSuccess={() => fetchAgenda()}
        slot={selectedSlot}
      />
    </Card>
  )
}

export default CalendarAgendaView
