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
}

const Calendar = (props: CalenderProps) => {
  // Props
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize
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
      const type = event.extendedProps.eventType
      
      return (
        <div className="flex flex-col w-full p-1 overflow-hidden text-xs">
          <div className="font-bold truncate">{event.title}</div>
          {type && <div className="opacity-75">[{type}]</div>}
          {event.extendedProps.description && (
            <div className="truncate italic">{event.extendedProps.description}</div>
          )}
        </div>
      )
    },

    eventClick({ event }: any) {
      onEventClick(event)
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

  return <FullCalendar {...calendarOptions} />
}

export default Calendar
