// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party imports
import type { Dispatch } from '@reduxjs/toolkit'
import 'bootstrap-icons/font/bootstrap-icons.css'

import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import axios from 'axios'

// Type Imports
import type { AddEventType, CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

// Slice Imports
import { fetchEvents, selectedEvent, updateEvent } from '@/redux-store/slices/calendar'

type CalenderProps = {
  calendarStore: CalendarType
  calendarApi: any
  setCalendarApi: (val: any) => void
  calendarsColor: CalendarColors
  dispatch: Dispatch
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
}

const blankEvent: AddEventType = {
  title: '',
  start: '',
  end: '',
  status:'INACTIVE',
  allDay: false,
  url: '',
  extendedProps: {
    calendar: '',
    guests: [],
    description: '',
    nombreCliente: '',
    nombreProducto: '',
    brand: '',
    model: '',
    licencePlate: ''
  }
}

const Calendar = (props: CalenderProps) => {
  // Props
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    dispatch,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // calendarOptions(Props)
  const calendarOptions: CalendarOptions = {
    events: calendarStore.events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'listMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'listMonth'
    },
    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
      }
    },

    /*
      Enable dragging and resizing event
      ? Docs: https://fullcalendar.io/docs/editable
    */
    editable: true,

    /*
      Enable resizing event from start
      ? Docs: https://fullcalendar.io/docs/eventResizableFromStart
    */
    eventResizableFromStart: true,

    /*
      Automatically scroll the scroll-containers during event drag-and-drop and date selecting
      ? Docs: https://fullcalendar.io/docs/dragScroll
    */
    dragScroll: true,

    /*
      Max number of events within a given day
      ? Docs: https://fullcalendar.io/docs/dayMaxEvents
    */
    dayMaxEvents: 2,

    /*
      Determines if day names and week names are clickable
      ? Docs: https://fullcalendar.io/docs/navLinks
    */
    navLinks: true,

    eventClassNames({ event: calendarEvent }: any) {
      // @ts-ignore
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

      return [
        // Background Color
        `event-bg-${colorName}`
      ]
    },
    eventContent: (eventInfo) => {
      console.log("eventInfo", eventInfo.event);
      
  const status = eventInfo.event.extendedProps.status

  const statusColor =
    status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500' 
  return (
    <div className=" items-center justify-between w-full pr-2">
      <div><b>Cliente:</b> {eventInfo.event.extendedProps.nombreCliente}</div>
      <div><b>Equipo:</b> {eventInfo.event.extendedProps.nombreProducto}</div>
      <div className='flex items-center justify-between'>
        <span><b>Marca: </b> {eventInfo.event.extendedProps.brand} </span> <span><b> Modelo: </b> {eventInfo.event.extendedProps.model} </span>

      </div>
      <div className='flex items-center justify-between'>
        <span><b> Serial: </b> {eventInfo.event.extendedProps.licencePlate} </span>
        <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
      </div>
      
    </div>
  )
},

  async eventClick({ event: clickedEvent, jsEvent }: any) {
      
      console.log("clickedEvent", clickedEvent.id)

      const id = clickedEvent.id

      if(clickedEvent.extendedProps.status === 'INACTIVE') {

        alert("El mantenimiento ya ha sido confirmado!")
        return
      }

      jsEvent.preventDefault()

      
      const text = "Deseas confirmar el mantenimiento?";
       if (confirm(text) != true) {
        return
       }


          try {
            const token = localStorage.getItem('AuthToken')
      
            console.log('token ', token)
      
            if (!token) {
              throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
            }
      
            // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo
      
            const method = 'post' // Actualización o Creación
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schedule/set_mantenimiento` // Creación
      
            const response = await axios({
              method: method, // Usa 'put' para actualización o 'post' para creación
              url: apiUrl,
              data: {id: id},
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              }
            })
      
            // Procesar la respuesta
            if (response.data.result === 'success') {
              console.log('Customer guardado con éxito:', response.data)
              dispatch(fetchEvents() as any)
              alert("Mantenimiento conirmado correctamente!")
              
              // Aquí puedes redirigir o mostrar un mensaje de éxito
            } else {
              console.error('Error en la respuesta:', response.data.message)
            }
      
          } catch (error) {
            console.error('Error al enviar los datos:', error)
          }
      
      //dispatch(selectedEvent(clickedEvent))
      //handleAddEventSidebarToggle()

      if (clickedEvent.url) {
        // Open the URL in a new tab
        //window.open(clickedEvent.url, '_blank')
      }

      //* Only grab required field otherwise it goes in infinity loop
      //! Always grab all fields rendered by form (even if it get `undefined`)
      // event.value = grabEventDataFromEventApi(clickedEvent)
      // isAddNewEventSidebarActive.value = true
    },

    customButtons: {
      sidebarToggle: {
        icon: 'tabler tabler-menu-2',
        click() {
          console.log("side toggle");
          
          handleLeftSidebarToggle()
        }
      }
    },

    dateClick(info: any) {
      const ev = { ...blankEvent }

      ev.start = info.date
      ev.end = info.date
      ev.allDay = true

      dispatch(selectedEvent(ev))
      //handleAddEventSidebarToggle()
    },

    /*
      Handle event drop (Also include dragged event)
      ? Docs: https://fullcalendar.io/docs/eventDrop
      ? We can use `eventDragStop` but it doesn't return updated event so we have to use `eventDrop` which returns updated event
    */
    eventDrop({ event: droppedEvent }: any) {
      dispatch(updateEvent(droppedEvent))
     // dispatch(filterEvents())
    },

    /*
      Handle event resize
      ? Docs: https://fullcalendar.io/docs/eventResize
    */
    eventResize({ event: resizedEvent }: any) {
      dispatch(updateEvent(resizedEvent))
     // dispatch(filterEvents())
    },

    // @ts-ignore
    ref: calendarRef,

    direction: theme.direction
  }

  return <FullCalendar {...calendarOptions} />
}

export default Calendar
