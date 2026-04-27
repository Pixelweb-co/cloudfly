'use client'

// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party imports
import 'bootstrap-icons/font/bootstrap-icons.css'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import axios from 'axios'

// Type Imports
import type { CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

type CalenderProps = {
  calendarStore: CalendarType
  calendarApi: any
  setCalendarApi: (val: any) => void
  calendarsColor: CalendarColors
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
  onEventClick: (event: any) => void
  onDateClick: (info: any) => void
  onEventDrop: (info: any) => void
  onEventResize: (info: any) => void
  refreshEvents: () => void
}

const Calendar = (props: CalenderProps) => {
  // Props
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    handleLeftSidebarToggle,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
    refreshEvents
  } = props

  // Refs
  const calendarRef = useRef()

  // Hooks
  const theme = useTheme()

  useEffect(() => {
    if (calendarApi === null) {
      // @ts-ignore
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  // calendarOptions(Props)
  const calendarOptions: CalendarOptions = {
    events: calendarStore.events as any,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
      }
    },
    editable: true,
    eventResizableFromStart: true,
    dragScroll: true,
    dayMaxEvents: 2,
    navLinks: true,

    eventClassNames({ event: calendarEvent }: any) {
      // @ts-ignore
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar] || 'primary'
      return [`event-bg-${colorName}`]
    },

    eventContent: (eventInfo) => {
      const { event } = eventInfo
      const props = event.extendedProps
      
      // Si tiene datos de mantenimiento, usar el layout viejo
      if (props.nombreCliente || props.nombreProducto) {
        const statusColor = props.status === 'COMPLETED' || props.status === 'INACTIVE' ? 'bg-green-500' : 'bg-red-500'
        return (
          <div className="items-center justify-between w-full pr-2">
            <div><b>Cliente:</b> {props.nombreCliente}</div>
            <div><b>Equipo:</b> {props.nombreProducto}</div>
            <div className='flex items-center justify-between'>
              <span><b>Marca: </b> {props.brand} </span> <span><b> Modelo: </b> {props.model} </span>
            </div>
            <div className='flex items-center justify-between'>
              <span><b> Serial: </b> {props.licencePlate} </span>
              <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
            </div>
          </div>
        )
      }

      // Layout genérico para nuevos eventos
      return (
        <div className="flex flex-col w-full p-1 overflow-hidden text-xs">
          <div className="font-bold truncate">{event.title}</div>
          <div className="opacity-75">[{props.eventType || 'EVENT'}]</div>
          {props.description && (
            <div className="truncate italic">{props.description}</div>
          )}
        </div>
      )
    },

    async eventClick({ event: clickedEvent, jsEvent }: any) {
      // Lógica vieja de confirmación de mantenimiento si aplica
      if (clickedEvent.extendedProps.nombreCliente) {
        if (clickedEvent.extendedProps.status === 'COMPLETED' || clickedEvent.extendedProps.status === 'INACTIVE') {
          alert("El mantenimiento ya ha sido confirmado!")
          return
        }

        if (confirm("Deseas confirmar el mantenimiento?")) {
          try {
            const token = localStorage.getItem('AuthToken') || localStorage.getItem('jwt')
            if (!token) throw new Error('No session token found')

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/schedule/set_mantenimiento`, 
              { id: clickedEvent.id },
              { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.result === 'success') {
              alert("Mantenimiento confirmado correctamente!")
              refreshEvents()
            }
          } catch (error) {
            console.error('Error confirming maintenance:', error)
          }
          return
        }
      }

      // Si no es mantenimiento, usar la lógica normal (abrir sidebar)
      onEventClick(clickedEvent)
    },

    dateClick(info: any) {
      onDateClick(info)
    },

    eventDrop(info: any) {
      onEventDrop(info)
    },

    eventResize(info: any) {
      onEventResize(info)
    },

    customButtons: {
      sidebarToggle: {
        icon: 'tabler tabler-menu-2',
        click() {
          handleLeftSidebarToggle()
        }
      }
    },

    // @ts-ignore
    ref: calendarRef,
    direction: theme.direction
  }

  return (
    <>
      <style jsx global>{`
        .fc .fc-button-primary {
          background-color: var(--mui-palette-primary-main) !important;
          border-color: var(--mui-palette-primary-main) !important;
          color: var(--mui-palette-primary-contrastText) !important;
        }
        .fc .fc-button-primary:hover {
          background-color: var(--mui-palette-primary-dark) !important;
          border-color: var(--mui-palette-primary-dark) !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: var(--mui-palette-primary-main) !important;
          border-color: var(--mui-palette-primary-main) !important;
          opacity: 0.65;
        }
        .fc .fc-button-active {
          background-color: var(--mui-palette-primary-dark) !important;
          border-color: var(--mui-palette-primary-dark) !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
        }
      `}</style>
      <FullCalendar {...calendarOptions} />
    </>
  )
}

export default Calendar
