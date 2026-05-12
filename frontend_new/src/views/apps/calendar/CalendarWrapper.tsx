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
  AVAILABLE: 'success',
  RESERVED: 'primary',
  BLOCKED: 'error',
  COMPLETED: 'secondary',
  CANCELLED: 'warning',
  NOTIFICATION: 'info',
  EQUIPOS: 'danger'
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
      const start = format(new Date(), "yyyy-MM-dd'T'00:00:00")
      const end = format(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'23:59:59")
      
      const [slots, legacyEvents] = await Promise.all([
        calendarService.getSlots(tenantId, companyId, start, end),
        calendarService.getEvents(tenantId, companyId)
      ])

      const mappedSlots = slots.map((slot: any) => ({
        id: `slot-${slot.id}`,
        title: slot.status === 'AVAILABLE' ? 'Disponible' : (slot.status === 'RESERVED' ? 'Cita Reservada' : 'Bloqueado'),
        start: slot.startTime,
        end: slot.endTime,
        allDay: false,
        extendedProps: {
          calendar: slot.status,
          status: slot.status,
          appointmentId: slot.appointmentId,
          templateId: slot.templateId,
          isSlot: true
        }
      }))

      const mappedLegacy = legacyEvents.map((event: any) => ({
        id: `legacy-${event.id}`,
        title: event.title,
        start: event.startTime,
        end: event.endTime,
        allDay: event.allDay,
        extendedProps: {
          calendar: 'NOTIFICATION',
          status: event.status,
          isSlot: false,
          ...event
        }
      }))

      setCalendarStore(prev => ({ ...prev, events: [...mappedSlots, ...mappedLegacy], loading: false }))
    } catch (error: any) {
      setCalendarStore(prev => ({ ...prev, error: error.message, loading: false }))
    }
  }, [tenantId, companyId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleCloseSidebar = () => setAddEventSidebarOpen(false)

  const handleAddEvent = async (data: any) => {
    try {
      if (data.isNotification) {
        delete data.isNotification
        await calendarService.createEvent({ ...data, tenantId, companyId })
        alert("Notificación guardada correctamente")
      } else {
        await calendarService.bookAppointment(data)
        alert("Cita reservada correctamente")
      }
      await fetchEvents()
    } catch (error) {
      console.error('Error handling event creation:', error)
      alert("Error al procesar la solicitud")
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
          startTime: event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : '',
          endTime: event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm:ss") : (event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : ''),
          allDay: event.allDay,
          ...event.extendedProps
        }
      } else {
        // Plain object from Sidebar
        id = parseInt(event.id)
        eventData = { ...event }
        delete eventData.id // Remove ID from payload body
      }
      
      await calendarService.updateEvent(id, tenantId, companyId, { ...eventData, tenantId, companyId })
      await fetchEvents()
      alert("Evento actualizado")
    } catch (error) {
      console.error('Error updating event:', error)
      alert("Error al actualizar el evento")
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await calendarService.deleteEvent(id, tenantId, companyId)
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
    // En el nuevo sistema, no se permiten eventos libres.
    // Solo se puede interactuar con slots existentes.
    console.log("Date click ignored. Please click on an AVAILABLE slot.")
  }

  const handleFilterChange = (label: string) => {
    setSelectedCalendars(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleFilterAll = (val: boolean) => {
    setSelectedCalendars(val ? ['Equipos', 'NOTIFICATION', 'REST_ACTION', 'WHATSAPP_CAMPAIGN'] : [])
  }

  const filteredEvents = calendarStore.events

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
        handleAddEventSidebarToggle={handleCloseSidebar}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        tenantId={tenantId}
        companyId={companyId}
      />
    </div>
  )
}

export default AppCalendar
