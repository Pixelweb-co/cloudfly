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
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { CalendarType } from '@/types/apps/calendarTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

interface PickerProps {
  label?: string
  error?: boolean
  registername?: string
}

interface DefaultStateType {
  url: string
  title: string
  allDay: boolean
  calendar: string
  calendarId: number
  description: string
  endDate: Date
  startDate: Date
  eventType: string
  payload: string
  recurrence: string
}

const defaultState: DefaultStateType = {
  url: '',
  title: '',
  allDay: true,
  description: '',
  endDate: new Date(),
  calendar: 'Business',
  calendarId: 1,
  startDate: new Date(),
  eventType: 'NOTIFICATION',
  payload: '',
  recurrence: ''
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

  // States
  const [values, setValues] = useState<DefaultStateType>(defaultState)

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

  const resetToStoredValues = useCallback(() => {
    if (calendarStore.selectedEvent !== null) {
      const event = calendarStore.selectedEvent
      setValue('title', event.title || '')
      setValues({
        url: event.url || '',
        title: event.title || '',
        allDay: event.allDay || false,
        description: event.extendedProps?.description || '',
        calendar: event.extendedProps?.calendar || 'Business',
        calendarId: event.calendarId || 1,
        endDate: event.end ? new Date(event.end) : (event.start ? new Date(event.start) : new Date()),
        startDate: event.start ? new Date(event.start) : new Date(),
        eventType: event.extendedProps?.eventType || 'NOTIFICATION',
        payload: event.extendedProps?.payload || '',
        recurrence: event.extendedProps?.recurrence || ''
      })
    }
  }, [setValue, calendarStore.selectedEvent])

  const resetToEmptyValues = useCallback(() => {
    setValue('title', '')
    setValues(defaultState)
  }, [setValue])

  const handleSidebarClose = () => {
    setValues(defaultState)
    clearErrors()
    handleAddEventSidebarToggle()
  }

  const onSubmit = (data: { title: string }) => {
    const eventData = {
      title: data.title,
      calendarId: values.calendarId,
      startTime: values.startDate.toISOString(),
      endTime: values.endDate.toISOString(),
      allDay: values.allDay,
      description: values.description,
      eventType: values.eventType,
      payload: values.payload,
      recurrence: values.recurrence,
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
    if (calendarStore.selectedEvent !== null) {
      resetToStoredValues()
    } else {
      resetToEmptyValues()
    }
  }, [addEventSidebarOpen, resetToStoredValues, resetToEmptyValues, calendarStore.selectedEvent])

  const ScrollWrapper = isBelowSmScreen ? 'div' : PerfectScrollbar

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleSidebarClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box className='flex justify-between items-center sidebar-header plb-5 pli-6 border-be'>
        <Typography variant='h5'>
          {calendarStore.selectedEvent ? 'Update Event' : 'Add Event'}
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
                  label='Title'
                  value={value}
                  onChange={onChange}
                  {...(errors.title && { error: true, helperText: 'This field is required' })}
                />
              )}
            />
            
            <CustomTextField
              select
              fullWidth
              label='Calendar'
              value={values.calendar}
              onChange={e => setValues({ ...values, calendar: e.target.value })}
            >
              <MenuItem value='Equipos'>Equipos</MenuItem>
              <MenuItem value='Personal'>Personal</MenuItem>
              <MenuItem value='Business'>Business</MenuItem>
              <MenuItem value='Family'>Family</MenuItem>
              <MenuItem value='Holiday'>Holiday</MenuItem>
              <MenuItem value='ETC'>ETC</MenuItem>
            </CustomTextField>

            <CustomTextField
              fullWidth
              type='number'
              label='Calendar ID'
              value={values.calendarId}
              onChange={e => setValues({ ...values, calendarId: parseInt(e.target.value) })}
            />

            <AppReactDatepicker
              selectsStart
              id='event-start-date'
              endDate={values.endDate}
              selected={values.startDate}
              startDate={values.startDate}
              showTimeSelect={!values.allDay}
              dateFormat={!values.allDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
              customInput={<PickersComponent label='Start Date' registername='startDate' />}
              onChange={(date: Date | null) => date && setValues({ ...values, startDate: date })}
            />
            <AppReactDatepicker
              selectsEnd
              id='event-end-date'
              endDate={values.endDate}
              selected={values.endDate}
              minDate={values.startDate}
              startDate={values.startDate}
              showTimeSelect={!values.allDay}
              dateFormat={!values.allDay ? 'yyyy-MM-dd hh:mm aa' : 'yyyy-MM-dd'}
              customInput={<PickersComponent label='End Date' registername='endDate' />}
              onChange={(date: Date | null) => date && setValues({ ...values, endDate: date })}
            />
            
            <FormControlLabel
              label='All Day'
              control={<Switch checked={values.allDay} onChange={e => setValues({ ...values, allDay: e.target.checked })} />}
            />

            <CustomTextField
              fullWidth
              label='URL'
              value={values.url}
              onChange={e => setValues({ ...values, url: e.target.value })}
            />

            <CustomTextField
              rows={4}
              multiline
              fullWidth
              label='Description'
              value={values.description}
              onChange={e => setValues({ ...values, description: e.target.value })}
            />

            <Divider />
            <Typography variant='body2' color='textSecondary'>Advanced Scheduler Settings</Typography>

            <CustomTextField
              select
              fullWidth
              label='Event Type'
              value={values.eventType}
              onChange={e => setValues({ ...values, eventType: e.target.value })}
            >
              <MenuItem value='NOTIFICATION'>Notification</MenuItem>
              <MenuItem value='REST_ACTION'>REST Action</MenuItem>
              <MenuItem value='WHATSAPP_CAMPAIGN'>WhatsApp Campaign</MenuItem>
            </CustomTextField>

            <CustomTextField
              fullWidth
              select
              label='Recurrence'
              value={values.recurrence}
              onChange={e => setValues({ ...values, recurrence: e.target.value })}
            >
              <MenuItem value=''>None</MenuItem>
              <MenuItem value='DAILY'>Daily</MenuItem>
              <MenuItem value='WEEKLY'>Weekly</MenuItem>
              <MenuItem value='MONTHLY'>Monthly</MenuItem>
            </CustomTextField>

            <CustomTextField
              rows={4}
              multiline
              fullWidth
              label='Payload (JSON)'
              value={values.payload}
              placeholder='{"to": "311...", "body": "Hello", "type": "whatsapp"}'
              onChange={e => setValues({ ...values, payload: e.target.value })}
            />

            <div className='flex gap-4'>
              <Button type='submit' variant='contained'>
                {calendarStore.selectedEvent ? 'Update' : 'Add'}
              </Button>
              <Button variant='outlined' color='secondary' onClick={handleSidebarClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Box>
      </ScrollWrapper>
    </Drawer>
  )
}

export default AddEventSidebar
