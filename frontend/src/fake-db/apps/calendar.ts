// Third-party Imports
import axiosInstance from '@/utils/axiosInterceptor'
import type { EventInput } from '@fullcalendar/core'

// Vars
const date = new Date()
const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)

const nextMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1)

const prevMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() - 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() - 1, 1)

export const events: EventInput[] = [
  {
    id: '1',
    url: '',
    title: 'Equipo',
    start: date,
    end: nextDay,
    allDay: false,
    extendedProps: {
      calendar: 'Equipos',
      guests: [],
      description: 'Evento de prueba',
      nombreCliente: 'Cliente 1',
      nombreProducto: 'Producto 1',
      brand: 'Marca 1',
      model: 'Modelo 1',
      licencePlate: 'ABC123'
    }
  },
  {
    id: '2',
    url: '',
    title: 'otro',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    extendedProps: {
      calendar: 'Solicitudes'
    }
  }
]
