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
import { format } from 'date-fns'

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
}

const AddEventSidebar = (props: Props) => {
  // Props
  const { 
    calendarStore, 
    addEventSidebarOpen, 
    handleAddEventSidebarToggle,
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent
  } = props

  // Session
  const { data: session } = useSession()

  // States
  const [values, setValues] = useState<DefaultStateType>(defaultState)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  
  // Dialog State for missing info
  const [missingInfoDialogOpen, setMissingInfoDialogOpen] = useState(false)
  const [currentEditingContact, setCurrentEditingContact] = useState<Contact | null>(null)
  const [tempContactInfo, setTempContactInfo] = useState({ email: '', phone: '' })

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
      />
    )
  })

  // Hooks
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const {
    control,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues: { title: '' } })

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
    setValues(defaultState)
    setSelectedContacts([])
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
    if (values.notifyVia === 'email' && !contact.email) {
      setCurrentEditingContact(contact)
      setTempContactInfo({ email: '', phone: contact.phone || '' })
      setMissingInfoDialogOpen(true)
      return false
    }
    if (values.notifyVia === 'whatsapp' && !contact.phone) {
      setCurrentEditingContact(contact)
      setTempContactInfo({ email: contact.email || '', phone: '' })
      setMissingInfoDialogOpen(true)
      return false
    }
    return true
  }

  const onSubmit = (data: { title: string }) => {
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
      body: values.description,
      remindBefore: values.remindBefore,
      remindUnit: values.remindUnit,
      notifyVia: values.notifyVia
    }

    const eventData = {
      title: data.title,
      calendarId: values.calendarId,
      startTime: format(values.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endTime: format(values.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      allDay: values.allDay,
      description: values.description,
      eventType: 'NOTIFICATION',
      payload: JSON.stringify(payload),
      status: 'SCHEDULED'
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
      } else {
        resetToEmptyValues()
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
                    {...(errors.title && { error: true, helperText: 'Este campo es requerido' })}
                  />
                )}
              />
              
              <CustomTextField
                select
                fullWidth
                label='Calendario'
                value={values.calendar}
                onChange={e => setValues({ ...values, calendar: e.target.value })}
              >
                <MenuItem value='Business'>Business</MenuItem>
                <MenuItem value='Personal'>Personal</MenuItem>
                <MenuItem value='Family'>Family</MenuItem>
                <MenuItem value='Holiday'>Holiday</MenuItem>
                <MenuItem value='Equipos'>Equipos</MenuItem>
              </CustomTextField>

              <Box className='flex gap-4'>
                <AppReactDatepicker
                  id='event-start-date'
                  selected={values.startDate}
                  showTimeSelect={!values.allDay}
                  timeIntervals={5}
                  todayButton='Hoy'
                  dateFormat={!values.allDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
                  customInput={<PickersComponent label='Fecha Inicio' />}
                  onChange={(date: Date | null) => date && setValues({ ...values, startDate: date })}
                />
                
                <AppReactDatepicker
                  id='event-end-date'
                  selected={values.endDate}
                  minDate={values.startDate}
                  showTimeSelect={!values.allDay}
                  timeIntervals={5}
                  todayButton='Hoy'
                  dateFormat={!values.allDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
                  customInput={<PickersComponent label='Fecha Fin' />}
                  onChange={(date: Date | null) => date && setValues({ ...values, endDate: date })}
                />
              </Box>
              
              <FormControlLabel
                label='Todo el día'
                control={<Switch checked={values.allDay} onChange={e => setValues({ ...values, allDay: e.target.checked })} />}
              />

              <CustomTextField
                rows={3}
                multiline
                fullWidth
                label='Descripción'
                placeholder='Detalles del recordatorio...'
                value={values.description}
                onChange={e => setValues({ ...values, description: e.target.value })}
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
                  <CustomTextField {...params} label='Notificar a (Contactos)' placeholder='Buscar por nombre, cédula...' />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} size='small' color='primary' variant='outlined' key={option.id} />
                  ))
                }
              />

              <Box className='flex items-center gap-4'>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Avisar antes'
                  value={values.remindBefore}
                  onChange={e => setValues({ ...values, remindBefore: parseInt(e.target.value) })}
                />
                <CustomTextField
                  select
                  fullWidth
                  label='Unidad'
                  value={values.remindUnit}
                  onChange={e => setValues({ ...values, remindUnit: e.target.value })}
                >
                  <MenuItem value='MINUTES'>Minutos</MenuItem>
                  <MenuItem value='HOURS'>Horas</MenuItem>
                  <MenuItem value='DAYS'>Días</MenuItem>
                  <MenuItem value='WEEKS'>Semanas</MenuItem>
                </CustomTextField>
              </Box>

              <CustomTextField
                select
                fullWidth
                label='Enviar por'
                value={values.notifyVia}
                onChange={e => setValues({ ...values, notifyVia: e.target.value as any })}
              >
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='whatsapp'>WhatsApp</MenuItem>
              </CustomTextField>

              <div className='flex gap-4 mbs-4'>
                <Button type='submit' variant='contained'>
                  {calendarStore.selectedEvent ? 'Actualizar' : 'Guardar Recordatorio'}
                </Button>
                <Button variant='outlined' color='secondary' onClick={handleSidebarClose}>
                  Cancelar
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
            El contacto <strong>{currentEditingContact?.name}</strong> no tiene {values.notifyVia === 'email' ? 'correo electrónico' : 'teléfono'} registrado.
          </Typography>
          <Box className='flex flex-col gap-4'>
            {values.notifyVia === 'email' && (
              <CustomTextField
                fullWidth
                label='Email'
                value={tempContactInfo.email}
                onChange={e => setTempContactInfo({ ...tempContactInfo, email: e.target.value })}
              />
            )}
            {values.notifyVia === 'whatsapp' && (
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
