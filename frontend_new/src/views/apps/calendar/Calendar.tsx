'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import DialogContentText from '@mui/material/DialogContentText'

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

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    title: string;
    content: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null)

  useEffect(() => {
    if (calendarApi === null) {
      // @ts-ignore
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  const handleConfirmAction = (confirm: boolean) => {
    if (confirm && confirmData) {
      confirmData.onConfirm()
    } else if (confirmData) {
      confirmData.onCancel()
    }
    setConfirmOpen(false)
    setConfirmData(null)
  }

  // calendarOptions(Props)
  const calendarOptions: CalendarOptions = {
    events: calendarStore.events as any,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'timeGridWeek',
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
    dayMaxEvents: 5,
    navLinks: true,
    slotDuration: '00:15:00',
    slotLabelInterval: '00:30:00',
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short'
    },

    eventClassNames({ event: calendarEvent }: any) {
      // @ts-ignore
      const colorName = calendarsColor[calendarEvent._def.extendedProps.status] || 'primary'
      return [`event-bg-${colorName}`]
    },

    eventContent: (eventInfo) => {
      const { event } = eventInfo
      const props = event.extendedProps
      
      return (
        <div className="flex flex-col w-full p-1 overflow-hidden text-xs">
          <div className="flex items-center justify-between font-bold truncate">
            <span>{event.title}</span>
            {props.status === 'RESERVED' && <i className='tabler-lock text-[10px]' />}
          </div>
          <div className="opacity-75 text-[10px] uppercase">{props.status}</div>
          {props.description && (
            <div className="truncate italic text-[10px]">{props.description}</div>
          )}
        </div>
      )
    },

    async eventClick({ event: clickedEvent }: any) {
      onEventClick(clickedEvent)
    },

    dateClick(info: any) {
      onDateClick(info)
    },

    eventDrop: (info: any) => {
      setConfirmData({
        title: 'Actualizar Fecha',
        content: '¿Desea actualizar la fecha de este evento?',
        onConfirm: () => onEventDrop(info.event),
        onCancel: () => info.revert()
      })
      setConfirmOpen(true)
    },

    eventResize: (info: any) => {
      setConfirmData({
        title: 'Actualizar Duración',
        content: '¿Desea actualizar la duración de este evento?',
        onConfirm: () => onEventResize(info.event),
        onCancel: () => info.revert()
      })
      setConfirmOpen(true)
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

      <Dialog
        open={confirmOpen}
        onClose={() => handleConfirmAction(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmData?.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmData?.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmAction(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={() => handleConfirmAction(true)} variant="contained" autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Calendar
