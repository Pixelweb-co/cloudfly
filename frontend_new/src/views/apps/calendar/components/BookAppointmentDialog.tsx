'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  IconButton
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format, parseISO, startOfDay } from 'date-fns'
import es from 'date-fns/locale/es'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-hot-toast'
import calendarService from '@/services/calendarService'
import { customerService } from '@/services/customers/customerService'
import { useSession } from 'next-auth/react'

interface BookAppointmentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialServiceId?: number
  initialDate?: Date
}

const schema = yup.object().shape({
  contactId: yup.number().nullable(),
  contactName: yup.string().required('El nombre es requerido'),
  contactEmail: yup.string().email('Email inválido').required('El email es requerido'),
  contactPhone: yup.string().nullable(),
  date: yup.string().required('La fecha es requerida'),
  slotId: yup.number().required('Debe seleccionar un horario disponible'),
  serviceId: yup.number().required('El servicio es requerido')
})

const BookAppointmentDialog = ({ open, onClose, onSuccess, initialServiceId, initialDate }: BookAppointmentDialogProps) => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      contactId: null,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      date: format(initialDate || new Date(), 'yyyy-MM-dd'),
      slotId: undefined,
      serviceId: initialServiceId || undefined
    }
  })

  const watchedServiceId = watch('serviceId')
  const watchedDate = watch('date')

  // Fetch customers for typeahead
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAllCustomers()
        setCustomers(data)
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }
    fetchCustomers()
  }, [])

  // Fetch slots when date or service changes
  const fetchAvailableSlots = useCallback(async (sId: number, dateStr: string) => {
    if (!sId || !dateStr || !session) return
    
    try {
      setFetchingSlots(true)
      const user = session?.user as any
      const tenantId = user?.tenantId || 1
      const companyId = user?.companyId || 1
      
      const start = `${dateStr}T00:00:00`
      const end = `${dateStr}T23:59:59`
      
      const data = await calendarService.getSlots(tenantId, companyId, start, end)
      // Filter only available slots for this specific service
      const filtered = data.filter((s: any) => s.status === 'AVAILABLE' && Number(s.serviceId) === Number(sId))
      setAvailableSlots(filtered)
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Error al consultar disponibilidad')
    } finally {
      setFetchingSlots(false)
    }
  }, [session])

  useEffect(() => {
    if (open && watchedServiceId && watchedDate) {
      fetchAvailableSlots(Number(watchedServiceId), watchedDate)
    }
  }, [open, watchedServiceId, watchedDate, fetchAvailableSlots])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      const user = session?.user as any
      
      const appointmentData = {
        tenantId: user?.tenantId || 1,
        companyId: user?.companyId || 1,
        slotId: data.slotId,
        serviceId: data.serviceId,
        contactId: data.contactId,
        title: `Cita: ${data.contactName}`,
        description: `Agendado manualmente desde el dashboard`,
        status: 'SCHEDULED',
        channel: 'Dashboard'
      }

      await calendarService.bookAppointment(appointmentData)
      toast.success('Cita agendada correctamente')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Error al agendar la cita. Verifique si el horario aún está disponible.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (customer: any | null) => {
    if (customer) {
      setValue('contactId', customer.id)
      setValue('contactName', `${customer.nombres} ${customer.apellidos}`)
      setValue('contactEmail', customer.email)
      setValue('contactPhone', customer.telefono || '')
    } else {
      setValue('contactId', null)
      setValue('contactName', '')
      setValue('contactEmail', '')
      setValue('contactPhone', '')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        <Box className='flex items-center justify-between'>
          <Typography variant='h6' className='font-bold'>Asignar Nueva Cita</Typography>
          <IconButton size='small' onClick={onClose}><Icon icon='tabler:x' /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: 6 }}>
          <Grid container spacing={4}>
            {/* Contact Selector - Typeahead */}
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.nombres} ${option.apellidos} (${option.identificacion || 'S/I'}) - ${option.email}`}
                onChange={(_, newValue) => handleCustomerSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Buscar Contacto (ID, Nombre, Email, Tel)'
                    variant='outlined'
                    placeholder='Escriba para buscar...'
                    helperText='Búsqueda inteligente de clientes existentes'
                  />
                )}
                filterOptions={(options, state) => {
                  const search = state.inputValue.toLowerCase()
                  return options.filter(o => 
                    o.nombres?.toLowerCase().includes(search) ||
                    o.apellidos?.toLowerCase().includes(search) ||
                    o.email?.toLowerCase().includes(search) ||
                    o.identificacion?.includes(search) ||
                    o.telefono?.includes(search)
                  )
                }}
              />
            </Grid>

            {/* Manual Fields (populated by selector or manual entry) */}
            <Grid item xs={12} md={6}>
              <Controller
                name='contactName'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Completo'
                    error={!!errors.contactName}
                    helperText={errors.contactName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name='contactEmail'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Email'
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}><Typography variant='caption'>Detalles de la Cita</Typography></Divider>
            </Grid>

            {/* Date Selection */}
            <Grid item xs={12} md={6}>
              <Controller
                name='date'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type='date'
                    label='Fecha de la Cita'
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                  />
                )}
              />
            </Grid>

            {/* Availability / Slots Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.slotId}>
                <InputLabel id='slot-select-label'>Horarios Disponibles</InputLabel>
                <Controller
                  name='slotId'
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId='slot-select-label'
                      label='Horarios Disponibles'
                      disabled={fetchingSlots || availableSlots.length === 0}
                    >
                      {fetchingSlots ? (
                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 2 }} /> Consultando...</MenuItem>
                      ) : availableSlots.length === 0 ? (
                        <MenuItem disabled>Sin disponibilidad para esta fecha</MenuItem>
                      ) : (
                        availableSlots.map((slot) => (
                          <MenuItem key={slot.id} value={slot.id}>
                            {format(parseISO(slot.startTime), 'HH:mm')} - {format(parseISO(slot.endTime), 'HH:mm')}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  )}
                />
                {errors.slotId && <FormHelperText>{errors.slotId.message}</FormHelperText>}
                {availableSlots.length > 0 && <FormHelperText color='success'>{availableSlots.length} horarios encontrados</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={onClose} color='secondary' variant='outlined'>Cancelar</Button>
          <Button 
            type='submit' 
            variant='contained' 
            disabled={loading || fetchingSlots}
            startIcon={loading && <CircularProgress size={20} color='inherit' />}
          >
            Confirmar Reserva
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default BookAppointmentDialog
