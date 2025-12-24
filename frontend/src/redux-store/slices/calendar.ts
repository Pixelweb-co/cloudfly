  // Third-party Imports
  import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

  import type { EventInput } from '@fullcalendar/core'

  // Type Imports
  import type { CalendarType } from '@/types/apps/calendarTypes'

  type CalendarFiltersType = 'Equipos';

  // Data Imports
  import { axiosInstance } from '@/utils/axiosInstance'

  // Async Thunk para cargar eventos desde la API
  export const fetchEvents = createAsyncThunk<EventInput[]>('calendar/fetchEvents', async () => {
    try {
      const response = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL}/schedule`)

      console.log("sh data ",response.data);
      

      const events: EventInput[] = response.data.map((schedule:any) => ({
        id: schedule.id.toString(),
        url: '',
        status:schedule.status,
        title: schedule.productName, // Nombre del producto asociado
        start: schedule.date, // Fecha del evento
        end: new Date(new Date(schedule.date).setDate(new Date(schedule.date).getDate() + 1)).toISOString().split('T')[0], // Siguiente día
        allDay: false,
        extendedProps: {
          calendar: 'Equipos',
          guests: [],
          description: '',
          nombreCliente: schedule.nombreCliente, // Nombre del cliente asociado
          nombreProducto: schedule.nombreProducto, // Nombre del producto asociado
          brand: schedule.brand, // Marca del producto
          model: schedule.model, // Modelo del producto
          licencePlate: schedule.placaProducto // Placa del producto
        }
      }))

      console.log("events frm ",events);

      return events
    } catch (error) {
      console.error('Error fetching Calendar data:', error)
      throw error
    }
  })

  // Estado inicial
  const initialState: CalendarType = {
    events: [],
    filteredEvents: [],
    selectedEvent: null,
    selectedCalendars:['Equipos'] as CalendarFiltersType[],
    loading: false, // Agregado para manejar el estado de carga
    error: null as string | null
  }

  // Función para filtrar eventos por etiquetas seleccionadas
  const filterEventsUsingCheckbox = (events: EventInput[], selectedCalendars: CalendarFiltersType[]) => {
    return events.filter(event => selectedCalendars.includes(event.extendedProps?.calendar as CalendarFiltersType))
  }

  // Slice de Redux
  export const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
      addEvent: (state, action: PayloadAction<EventInput>) => {
        state.events.push(action.payload)
      },
      updateEvent: (state, action: PayloadAction<EventInput>) => {
        state.events = state.events.map(event => (event.id === action.payload.id ? action.payload : event))
      },
      deleteEvent: (state, action: PayloadAction<string>) => {
        state.events = state.events.filter(event => event.id !== action.payload)
      },
      selectedEvent: (state, action: PayloadAction<EventInput | null>) => {
        state.selectedEvent = action.payload
      },
      filterCalendarLabel: (state, action: PayloadAction<CalendarFiltersType>) => {
        const index = state.selectedCalendars.indexOf(action.payload)

        if (index !== -1) {
          state.selectedCalendars.splice(index, 1)
        } else {
          state.selectedCalendars.push(action.payload)
        }

        state.filteredEvents = filterEventsUsingCheckbox(state.events, state.selectedCalendars)
      },
      filterAllCalendarLabels: (state, action: PayloadAction<boolean>) => {
        state.selectedCalendars = action.payload ? ['Equipos'] : []
        state.filteredEvents = filterEventsUsingCheckbox(state.events, state.selectedCalendars)
      }
    },
    extraReducers: builder => {
      builder
        .addCase(fetchEvents.pending, state => {
          state.loading = true
          state.error = null
        })
        .addCase(fetchEvents.fulfilled, (state, action) => {
          state.loading = false
          state.events = action.payload
          state.filteredEvents = action.payload
        })
        .addCase(fetchEvents.rejected, (state, action) => {
          if (state !== undefined) {
            state.loading = false
            state.error = action.error.message || 'Error al cargar los eventos'
          }
        })
    }
  })

  // Exportar acciones y reducer
  export const {
    addEvent,
    updateEvent,
    deleteEvent,
    selectedEvent,
    filterCalendarLabel,
    filterAllCalendarLabels,

  } = calendarSlice.actions

  export default calendarSlice.reducer
