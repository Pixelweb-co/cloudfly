'use client'

// React Imports
import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import { useMediaQuery } from '@mui/material'
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

// Component Imports
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

// Service Imports
import calendarService, { CalendarEvent } from '@/services/calendarService'
import { useSession } from 'next-auth/react'

// CalendarColors Object
const calendarsColor: CalendarColors = {
  NOTIFICATION: 'primary',
  REST_ACTION: 'warning',
  WHATSAPP_CAMPAIGN: 'success'
}

const AppCalendar = () => {
  // States
  const [calendarApi, setCalendarApi] = useState<null | any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState<boolean>(false)
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(['NOTIFICATION', 'REST_ACTION', 'WHATSAPP_CAMPAIGN'])
  
  const [calendarStore, setCalendarStore] = useState<CalendarType>({
    events: [],
    selectedEvent: null,
    loading: false,
    error: null
  })

  // Hooks
  const { data: session } = useSession()
  const mdAbove = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  // IDs del usuario (Default 1 para demo si no hay sesión)
  const tenantId = 1
  const companyId = (session?.user as any)?.activeCompanyId || 1

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
        end: event.endTime,
        allDay: event.allDay,
        extendedProps: {
          calendar: event.eventType,
          description: event.description,
          eventType: event.eventType,
          payload: event.payload,
          recurrence: event.recurrence
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
      await calendarService.createEvent({ ...eventData, tenantId, companyId, calendarId: 1 })
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async (eventData: any) => {
    try {
      await calendarService.updateEvent(eventData.id, eventData)
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await calendarService.deleteEvent(id)
      fetchEvents()
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
    // Set default start/end in state if needed, but the sidebar handles 'new' well
    setAddEventSidebarOpen(true)
  }

  const handleFilterChange = (label: string) => {
    setSelectedCalendars(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleFilterAll = (val: boolean) => {
    setSelectedCalendars(val ? ['NOTIFICATION', 'REST_ACTION', 'WHATSAPP_CAMPAIGN'] : [])
  }

  // Filtrado local de eventos
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
