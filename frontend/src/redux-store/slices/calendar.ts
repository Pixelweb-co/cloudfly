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
      // Usar el nuevo endpoint del microservicio de scheduler
      // Se asume tenantId=1 y companyId=1 por defecto para la vista master
      const response = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL}/api/events?tenantId=1&companyId=1`)

      console.log("scheduler data ", response.data);

      const events: EventInput[] = response.data.map((event: any) => ({
        id: event.id.toString(),
        url: '',
        status: event.status,
        title: event.title, // Ahora usamos el título directamente
        start: event.startTime, // Antes era 'date'
        end: event.endTime || new Date(new Date(event.startTime).getTime() + 3600000).toISOString(), // 1 hora después por defecto si no hay end
        allDay: event.allDay || false,
        extendedProps: {
          calendar: 'Equipos',
          guests: [],
          description: event.description || '',
          eventType: event.eventType,
          eventSubtype: event.eventSubtype,
          // Mapeo inverso para compatibilidad con la vista de mantenimiento si los datos vienen en el payload
          ...parsePayload(event.payload)
        }
      }))

      return events
    } catch (error) {
      console.error('Error fetching Calendar data:', error)
      throw error
    }
  })

  // Función auxiliar para parsear el payload si contiene info de mantenimiento
  const parsePayload = (payload: string) => {
    try {
      if (!payload) return {};
      const data = JSON.parse(payload);
      return {
        nombreCliente: data.nombreCliente || '',
        nombreProducto: data.nombreProducto || '',
        brand: data.brand || '',
        model: data.model || '',
        licencePlate: data.licencePlate || ''
      };
    } catch (e) {
      return {};
    }
  }

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
