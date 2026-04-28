'use client'

// React Imports
import { useEffect, useRef, useState, useCallback } from 'react'

// MUI Imports
import { useMediaQuery } from '@mui/material'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

// Component Imports
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

// Service Imports
import calendarService from '@/services/calendarService'
import { useSession } from 'next-auth/react'

// CalendarColors Object
const calendarsColor: CalendarColors = {
  Equipos: 'danger',
  NOTIFICATION: 'primary',
  REST_ACTION: 'warning',
  WHATSAPP_CAMPAIGN: 'success',
  Personal: 'danger',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info'
}

// Aux function to parse maintenance payload
const parsePayload = (payload: string) => {
  try {
    if (!payload) return {}
    const data = JSON.parse(payload)
    return {
      nombreCliente: data.nombreCliente || '',
      nombreProducto: data.nombreProducto || '',
      brand: data.brand || '',
      model: data.model || '',
      licencePlate: data.licencePlate || ''
    }
  } catch (e) {
    return {}
  }
}

const AppCalendar = () => {
  // States
  const [calendarApi, setCalendarApi] = useState<null | any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState<boolean>(false)
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(['Equipos', 'NOTIFICATION', 'REST_ACTION', 'WHATSAPP_CAMPAIGN'])
  
  const [calendarStore, setCalendarStore] = useState<CalendarType>({
    events: [],
    selectedEvent: null,
    loading: false,
    error: null
  })

  // Hooks
  const { data: session } = useSession()
  const mdAbove = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  // IDs del usuario desde localStorage
  const [tenantId, setTenantId] = useState<number>(1)
  const [companyId, setCompanyId] = useState<number>(1)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateIds = () => {
        const storedTenantId = localStorage.getItem('tenantId')
        const storedCompanyId = localStorage.getItem('activeCompanyId') || localStorage.getItem('companyId')
        
        if (storedTenantId && parseInt(storedTenantId) !== tenantId) setTenantId(parseInt(storedTenantId))
        if (storedCompanyId && parseInt(storedCompanyId) !== companyId) setCompanyId(parseInt(storedCompanyId))
      }

      updateIds()
      const interval = setInterval(updateIds, 2000) // Poll every 2s for context switches
      return () => clearInterval(interval)
    }
  }, [tenantId, companyId])

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)
  const handleAddEventSidebarToggle = () => setAddEventSidebarOpen(!addEventSidebarOpen)

  const fetchEvents = useCallback(async () => {
    setCalendarStore(prev => ({ ...prev, loading: true }))
    try {
      const data = await calendarService.getEvents(tenantId, companyId)
      const mappedEvents = data.map(event => ({
        id: event.id?.toString(),
        title: event.title,
        start: event.startTime,
        end: event.endTime || new Date(new Date(event.startTime).getTime() + 3600000).toISOString(),
        allDay: event.allDay,
        extendedProps: {
          calendar: (event.eventType === 'REST_ACTION' && event.eventSubtype === 'MAINTENANCE') ? 'Equipos' : (event.eventType || 'Business'),
          description: event.description,
          eventType: event.eventType,
          calendarId: event.calendarId,
          status: event.status,
          payload: event.payload,
          recurrence: event.recurrence,
          ...parsePayload(event.payload || '')
        }
      }))
      setCalendarStore(prev => ({ ...prev, events: mappedEvents, loading: false }))
    } catch (error: any) {
      setCalendarStore(prev => ({ ...prev, error: error.message, loading: false }))
    }
  }, [tenantId, companyId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAddEvent = async (eventData: any) => {
    try {
      await calendarService.createEvent({ ...eventData, tenantId, companyId })
      fetchEvents()
      alert("Evento guardado correctamente")
    } catch (error) {
      console.error('Error creating event:', error)
      alert("Error al guardar el evento")
    }
  }

  const handleUpdateEvent = async (event: any) => {
    try {
      let eventData: any = {}
      let id: number

      // Detect if it's a FullCalendar event object or a plain object from Sidebar
      if (event.id && event._def) {
        // FullCalendar Event
        id = parseInt(event.id)
        eventData = {
          title: event.title,
          startTime: event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : null,
          endTime: event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm:ss") : (event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : null),
          allDay: event.allDay,
          ...event.extendedProps
        }
      } else {
        // Plain object from Sidebar
        id = parseInt(event.id)
        eventData = { ...event }
        delete eventData.id // Remove ID from payload body
      }
      
      await calendarService.updateEvent(id, eventData)
      fetchEvents()
      alert("Evento actualizado")
    } catch (error) {
      console.error('Error updating event:', error)
      alert("Error al actualizar el evento")
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await calendarService.deleteEvent(id)
      fetchEvents()
      alert("Evento eliminado")
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleEventClick = (event: any) => {
    setCalendarStore(prev => ({ ...prev, selectedEvent: event }))
    setAddEventSidebarOpen(true)
  }

  const handleDateClick = (info: any) => {
    setCalendarStore(prev => ({ ...prev, selectedEvent: null }))
    setAddEventSidebarOpen(true)
  }

  const handleFilterChange = (label: string) => {
    setSelectedCalendars(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleFilterAll = (val: boolean) => {
    setSelectedCalendars(val ? ['Equipos', 'NOTIFICATION', 'REST_ACTION', 'WHATSAPP_CAMPAIGN'] : [])
  }

  const filteredEvents = calendarStore.events.filter(event => 
    selectedCalendars.includes(event.extendedProps?.calendar)
  )

  return (
    <div className='flex bs-full overflow-hidden'>
      <SidebarLeft
        mdAbove={mdAbove}
        calendarApi={calendarApi}
        calendarsColor={calendarsColor}
        leftSidebarOpen={leftSidebarOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        selectedCalendars={selectedCalendars}
        onFilterChange={handleFilterChange}
        onFilterAll={handleFilterAll}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
      <div className='p-6 pbe-0 flex-grow overflow-visible bg-backgroundPaper rounded'>
        <Calendar
          calendarApi={calendarApi}
          setCalendarApi={setCalendarApi}
          calendarStore={{ ...calendarStore, events: filteredEvents }}
          calendarsColor={calendarsColor}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          handleAddEventSidebarToggle={handleAddEventSidebarToggle}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onEventDrop={handleUpdateEvent}
          onEventResize={handleUpdateEvent}
          refreshEvents={fetchEvents}
        />
      </div>
      <AddEventSidebar
        calendarStore={calendarStore}
        addEventSidebarOpen={addEventSidebarOpen}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  )
}

export default AppCalendar
