'use client'

// React Imports
import { useState, useEffect, forwardRef, useCallback } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useSession } from 'next-auth/react'
import { format, addMinutes } from 'date-fns'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// Type Imports
import type { CalendarType } from '@/types/apps/calendarTypes'
import type { Contact } from '@/types/marketing/contactTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Service Imports
import { contactService } from '@/services/marketing/contactService'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

interface PickerProps {
  label?: string
  error?: boolean
  disabled?: boolean
}

interface DefaultStateType {
  title: string
  allDay: boolean
  calendar: string
  calendarId: number
  description: string
  endDate: Date
  startDate: Date
  remindBefore: number
  remindUnit: string
  notifyVia: 'email' | 'whatsapp'
}

const defaultState: DefaultStateType = {
  title: '',
  allDay: false,
  description: '',
  endDate: new Date(),
  calendar: 'Business',
  calendarId: 1,
  startDate: new Date(),
  remindBefore: 15,
  remindUnit: 'MINUTES',
  notifyVia: 'email'
}

type Props = {
  calendarStore: CalendarType
  addEventSidebarOpen: boolean
  handleAddEventSidebarToggle: () => void
  onAddEvent: (event: any) => void
  onUpdateEvent: (event: any) => void
  onDeleteEvent: (id: number) => void
  tenantId: number
  companyId: number
}

const AddEventSidebar = (props: Props) => {
  // Props
  const { 
    calendarStore, 
    addEventSidebarOpen, 
    handleAddEventSidebarToggle,
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent,
    tenantId,
    companyId
  } = props

  // Session
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  
  console.log('Current User Role:', userRole)

  // States
  const [values, setValues] = useState<DefaultStateType>(defaultState)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  
  // Dialog State for missing info
  const [missingInfoDialogOpen, setMissingInfoDialogOpen] = useState(false)
  const [currentEditingContact, setCurrentEditingContact] = useState<Contact | null>(null)
  const [tempContactInfo, setTempContactInfo] = useState({ email: '', phone: '' })
  const [isPastEvent, setIsPastEvent] = useState(false)

  // Refs
  const PickersComponent = forwardRef(({ ...props }: PickerProps, ref) => {
    return (
      <CustomTextField
        inputRef={ref}
        fullWidth
        {...props}
        label={props.label || ''}
        className='is-full'
        error={props.error}
        disabled={props.disabled}
      />
    )
  })

  // Hooks
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const schema = yup.object().shape({
    title: yup.string().required('El título es requerido'),
    startDate: yup.date().required('La fecha de inicio es requerida'),
    endDate: yup.date().required('La fecha de fin es requerida').min(
      yup.ref('startDate'),
      'La fecha de fin debe ser posterior a la de inicio'
    ),
    allDay: yup.boolean(),
    description: yup.string(),
    calendar: yup.string(),
    remindBefore: yup.number().positive().required(),
    remindUnit: yup.string().required(),
    notifyVia: yup.string().oneOf(['email', 'whatsapp']).required()
  })

  const {
    control,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    mode: 'onBlur',
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      startDate: new Date(),
      endDate: addMinutes(new Date(), 30),
      allDay: false,
      description: '',
      calendar: 'Business',
      remindBefore: 15,
      remindUnit: 'MINUTES',
      notifyVia: 'email'
    }
  })

  // Watch fields for dynamic behavior
  const watchedStartDate = watch('startDate')
  const watchedAllDay = watch('allDay')
  const watchedNotifyVia = watch('notifyVia')
  
  useEffect(() => {
    if (session?.user) {
      console.log('Session User:', session.user)
    }
  }, [session])

  const isAdminOrManager = (session?.user as any)?.role?.toLowerCase().includes('admin') || 
                          (session?.user as any)?.role?.toLowerCase().includes('manager') ||
                          (session?.user as any)?.roles?.some((r: any) => 
                            r.name?.toLowerCase().includes('admin') || 
                            r.name?.toLowerCase().includes('manager') || 
                            r.role_name?.toLowerCase().includes('admin') || 
                            r.role_name?.toLowerCase().includes('manager'))

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true)
    try {
      const data = await contactService.getAllContacts()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }, [])

  useEffect(() => {
    if (addEventSidebarOpen) {
      fetchContacts()
    }
  }, [addEventSidebarOpen, fetchContacts])

  const parsePayloadToState = (payloadStr: string) => {
    try {
      const payload = JSON.parse(payloadStr)
      return {
        remindBefore: payload.remindBefore || 15,
        remindUnit: payload.remindUnit || 'MINUTES',
        notifyVia: payload.notifyVia || 'email'
      }
    } catch (e) {
      return {
        remindBefore: 15,
        remindUnit: 'MINUTES',
        notifyVia: 'email'
      }
    }
  }

  const resetToStoredValues = useCallback(() => {
    if (calendarStore.selectedEvent !== null) {
      const event = calendarStore.selectedEvent
      setValue('title', event.title || '')
      const extra = parsePayloadToState(event.extendedProps?.payload || '{}')
      
      setValues({
        title: event.title || '',
        allDay: event.allDay || false,
        description: event.extendedProps?.description || '',
        calendar: event.extendedProps?.calendar || 'Business',
        calendarId: event.extendedProps?.calendarId || 1,
        endDate: event.end ? new Date(event.end) : (event.start ? new Date(event.start) : new Date()),
        startDate: event.start ? new Date(event.start) : new Date(),
        ...extra
      })
      
      const start = event.start ? new Date(event.start) : new Date()
      const end = event.end ? new Date(event.end) : (event.start ? addMinutes(new Date(event.start), 30) : addMinutes(new Date(), 30))
      
      setValue('startDate', start)
      setValue('endDate', end)
      setValue('allDay', event.allDay || false)
      setValue('description', event.extendedProps?.description || '')
      setValue('calendar', event.extendedProps?.calendar || 'Business')
      setValue('remindBefore', extra.remindBefore)
      setValue('remindUnit', extra.remindUnit)
      setValue('notifyVia', extra.notifyVia as any)

      // Try to resolve selected contacts from payload
      try {
        const payload = JSON.parse(event.extendedProps?.payload || '{}')
        const toEmails = payload.to || []
        const toPhones = payload.phones || []
        // This is a simplified resolution, ideally we'd have IDs
        const matched = contacts.filter(c => toEmails.includes(c.email) || toPhones.includes(c.phone))
        setSelectedContacts(matched)
      } catch (e) {}
    }
  }, [setValue, calendarStore.selectedEvent, contacts])

  const resetToEmptyValues = useCallback(() => {
    setValue('title', '')
    setValue('startDate', new Date())
    setValue('endDate', addMinutes(new Date(), 30))
    setValues(defaultState)
    setSelectedContacts([])
    setIsPastEvent(false)
    reset({
      title: '',
      startDate: new Date(),
      endDate: addMinutes(new Date(), 30),
      allDay: false,
      description: '',
      calendar: 'Business',
      remindBefore: 15,
      remindUnit: 'MINUTES',
      notifyVia: 'email'
    })
  }, [setValue])

  const handleSidebarClose = () => {
    setValues(defaultState)
    clearErrors()
    handleAddEventSidebarToggle()
  }

  const handleUpdateContactInfo = async () => {
    if (!currentEditingContact) return
    
    try {
      const updated = await contactService.updateContact(currentEditingContact.id, {
        ...currentEditingContact,
        email: tempContactInfo.email,
        phone: tempContactInfo.phone
      })
      
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
      setSelectedContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
      setMissingInfoDialogOpen(false)
    } catch (error) {
      console.error('Error updating contact:', error)
    }
  }

  const validateContactData = (contact: Contact) => {
    if (watchedNotifyVia === 'email' && !contact.email) {
      setCurrentEditingContact(contact)
      setTempContactInfo({ email: '', phone: contact.phone || '' })
      setMissingInfoDialogOpen(true)
      return false
    }
    if (watchedNotifyVia === 'whatsapp' && !contact.phone) {
      setCurrentEditingContact(contact)
      setTempContactInfo({ email: contact.email || '', phone: '' })
      setMissingInfoDialogOpen(true)
      return false
    }
    return true
  }

  const onSubmit = (data: any) => {
    // Construct payload
    const to = selectedContacts.map(c => c.email).filter(Boolean) as string[]
    const phones = selectedContacts.map(c => c.phone).filter(Boolean) as string[]
    
    // Add current user
    if (session?.user?.email && !to.includes(session.user.email)) {
      to.push(session.user.email)
    }

    const payload = {
      to,
      phones,
      subject: `Recordatorio: ${data.title}`,
      body: data.description,
      remindBefore: data.remindBefore,
      remindUnit: data.remindUnit,
      notifyVia: data.notifyVia
    }

    const eventData = {
      title: data.title,
      calendarId: 1, // Default or selected
      startTime: format(data.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endTime: format(data.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      allDay: data.allDay,
      description: data.description,
      eventType: 'NOTIFICATION',
      payload: JSON.stringify(payload),
      status: 'SCHEDULED',
      tenantId,
      companyId
    }

    if (calendarStore.selectedEvent === null) {
      onAddEvent(eventData)
    } else {
      onUpdateEvent({ ...eventData, id: calendarStore.selectedEvent.id })
    }
    handleSidebarClose()
  }

  const handleDeleteButtonClick = () => {
    if (calendarStore.selectedEvent) {
      onDeleteEvent(Number(calendarStore.selectedEvent.id))
    }
    handleSidebarClose()
  }

  useEffect(() => {
    if (addEventSidebarOpen) {
      if (calendarStore.selectedEvent !== null) {
        resetToStoredValues()
        const eventStart = calendarStore.selectedEvent.start
        if (eventStart) {
          setIsPastEvent(new Date(eventStart) < new Date())
        } else {
          setIsPastEvent(false)
        }
      } else {
        resetToEmptyValues()
        setIsPastEvent(false)
      }
    }
  }, [addEventSidebarOpen, resetToStoredValues, resetToEmptyValues, calendarStore.selectedEvent])

  const ScrollWrapper = isBelowSmScreen ? 'div' : PerfectScrollbar

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        onClose={handleSidebarClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 450] } }}
      >
        <Box className='flex justify-between items-center sidebar-header plb-5 pli-6 border-be'>
          <Typography variant='h5'>
            {calendarStore.selectedEvent ? 'Actualizar Recordatorio' : 'Nuevo Recordatorio'}
          </Typography>
          <Box className='flex items-center gap-1'>
            {calendarStore.selectedEvent && (
              <IconButton size='small' onClick={handleDeleteButtonClick}>
                <i className='tabler-trash text-2xl text-textPrimary' />
              </IconButton>
            )}
            <IconButton size='small' onClick={handleSidebarClose}>
              <i className='tabler-x text-2xl text-textPrimary' />
            </IconButton>
          </Box>
        </Box>
        <ScrollWrapper
          {...(isBelowSmScreen
            ? { className: 'bs-full overflow-y-auto overflow-x-hidden' }
            : { options: { wheelPropagation: false, suppressScrollX: true } })}
        >
          <Box className='sidebar-body plb-5 pli-6'>
            <form onSubmit={handleSubmit(onSubmit)} autoComplete='off' className='flex flex-col gap-6'>
              <Controller
                name='title'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <CustomTextField
                    fullWidth
                    label='Título del Evento'
                    placeholder='Ej: Cita Médica, Reunión Spa...'
                    value={value}
                    onChange={onChange}
                    disabled={isPastEvent}
                    {...(errors.title && { error: true, helperText: errors.title.message })}
                  />
                )}
              />
              
              <Controller
                name='calendar'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='Calendario'
                    {...field}
                    disabled={isPastEvent}
                  >
                    <MenuItem value='Business'>Business</MenuItem>
                    <MenuItem value='Personal'>Personal</MenuItem>
                    <MenuItem value='Family'>Family</MenuItem>
                    <MenuItem value='Holiday'>Holiday</MenuItem>
                    <MenuItem value='Equipos'>Equipos</MenuItem>
                  </CustomTextField>
                )}
              />

              <Box className='flex gap-4'>
                <Controller
                  name='startDate'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <AppReactDatepicker
                      id='event-start-date'
                      selected={value}
                      showTimeSelect={!watchedAllDay}
                      timeIntervals={5}
                      todayButton='Hoy'
                      dateFormat={!watchedAllDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
                      customInput={<PickersComponent label='Fecha Inicio' disabled={isPastEvent} error={!!errors.startDate} />}
                      onChange={(date) => {
                        onChange(date)
                        if (date) {
                          const newEndDate = addMinutes(new Date(date), 30)
                          setValue('endDate', newEndDate)
                        }
                      }}
                      disabled={isPastEvent}
                    />
                  )}
                />
                
                <Controller
                  name='endDate'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <AppReactDatepicker
                      id='event-end-date'
                      selected={value}
                      minDate={watchedStartDate}
                      showTimeSelect={!watchedAllDay}
                      timeIntervals={5}
                      todayButton='Hoy'
                      dateFormat={!watchedAllDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
                      customInput={<PickersComponent label='Fecha Fin' disabled={isPastEvent} error={!!errors.endDate} />}
                      onChange={onChange}
                      disabled={isPastEvent}
                    />
                  )}
                />
              </Box>
              {errors.endDate && <Typography color='error' variant='caption'>{errors.endDate.message}</Typography>}
              
              <Controller
                name='allDay'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    label='Todo el día'
                    control={<Switch checked={value} onChange={onChange} disabled={isPastEvent} />}
                  />
                )}
              />

              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    rows={3}
                    multiline
                    fullWidth
                    label='Descripción'
                    placeholder='Detalles del recordatorio...'
                    {...field}
                    disabled={isPastEvent}
                  />
                )}
              />

              <Divider />
              <Typography variant='h6' color='primary'>Configuración de Notificación</Typography>

              <Autocomplete
                multiple
                options={contacts}
                loading={loadingContacts}
                getOptionLabel={(option) => `${option.name} (${option.documentNumber || 'No ID'})`}
                value={selectedContacts}
                onChange={(_, newValue) => {
                  const lastAdded = newValue.find(c => !selectedContacts.includes(c))
                  if (lastAdded) {
                    if (validateContactData(lastAdded)) {
                      setSelectedContacts(newValue)
                    }
                  } else {
                    setSelectedContacts(newValue)
                  }
                }}
                renderInput={(params) => (
                  <CustomTextField {...params} label='Notificar a (Contactos)' placeholder='Buscar por nombre, cédula...' disabled={isPastEvent} />
                )}
                disabled={isPastEvent}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} size='small' color='primary' variant='outlined' key={option.id} />
                  ))
                }
              />

              <Box className='flex items-center gap-4'>
                <Controller
                  name='remindBefore'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Avisar antes'
                      {...field}
                      disabled={isPastEvent}
                    />
                  )}
                />
                <Controller
                  name='remindUnit'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      select
                      fullWidth
                      label='Unidad'
                      {...field}
                      disabled={isPastEvent}
                    >
                      <MenuItem value='MINUTES'>Minutos</MenuItem>
                      <MenuItem value='HOURS'>Horas</MenuItem>
                      <MenuItem value='DAYS'>Días</MenuItem>
                      <MenuItem value='WEEKS'>Semanas</MenuItem>
                    </CustomTextField>
                  )}
                />
              </Box>

              <Controller
                name='notifyVia'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='Enviar por'
                    {...field}
                    disabled={isPastEvent}
                  >
                    <MenuItem value='email'>Email</MenuItem>
                    <MenuItem value='whatsapp'>WhatsApp</MenuItem>
                  </CustomTextField>
                )}
              />

              {isPastEvent && (
                <Typography color='error' variant='body2' className='mbe-2'>
                  Este evento ya ha pasado y no puede ser editado.
                </Typography>
              )}

              <Box className='flex gap-4 mbs-4'>
                {isAdminOrManager && (
                  <>
                    <CustomTextField
                      fullWidth
                      label='Tenant ID'
                      value={tenantId}
                      disabled
                      variant='filled'
                      size='small'
                    />
                    <CustomTextField
                      fullWidth
                      label='Company ID'
                      value={companyId}
                      disabled
                      variant='filled'
                      size='small'
                    />
                  </>
                )}
              </Box>
              
              <div className='flex gap-4 mbs-4'>
                {!isPastEvent && (
                  <Button type='submit' variant='contained'>
                    {calendarStore.selectedEvent ? 'Actualizar' : 'Guardar Recordatorio'}
                  </Button>
                )}
                <Button variant='outlined' color='secondary' onClick={handleSidebarClose}>
                  {isPastEvent ? 'Cerrar' : 'Cancelar'}
                </Button>
              </div>
            </form>
          </Box>
        </ScrollWrapper>
      </Drawer>

      <Dialog open={missingInfoDialogOpen} onClose={() => setMissingInfoDialogOpen(false)}>
        <DialogTitle>Información Faltante</DialogTitle>
        <DialogContent>
          <Typography className='mbe-4'>
            El contacto <strong>{currentEditingContact?.name}</strong> no tiene {watchedNotifyVia === 'email' ? 'correo electrónico' : 'teléfono'} registrado.
          </Typography>
          <Box className='flex flex-col gap-4'>
            {watchedNotifyVia === 'email' && (
              <CustomTextField
                fullWidth
                label='Email'
                value={tempContactInfo.email}
                onChange={e => setTempContactInfo({ ...tempContactInfo, email: e.target.value })}
              />
            )}
            {watchedNotifyVia === 'whatsapp' && (
              <CustomTextField
                fullWidth
                label='Teléfono'
                placeholder='Ej: 57311...'
                value={tempContactInfo.phone}
                onChange={e => setTempContactInfo({ ...tempContactInfo, phone: e.target.value })}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMissingInfoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdateContactInfo} variant='contained'>Guardar y Agregar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AddEventSidebar
