import axios from 'axios'

const CALENDAR_API_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://calendar.cloudfly.com.co'

export interface CalendarEvent {
  id?: number
  tenantId: number
  companyId: number
  calendarId: number
  title: string
  description?: string
  eventType: 'NOTIFICATION' | 'REST_ACTION' | 'WHATSAPP_CAMPAIGN'
  eventSubtype?: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  startTime: string
  endTime?: string
  allDay?: boolean
  relatedEntityType?: string
  relatedEntityId?: number
  payload?: string
  recurrence?: string
}

const calendarService = {
  getEvents: async (tenantId: number, companyId: number, startDate?: string, endDate?: string) => {
    const params: any = { tenantId, companyId }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await axios.get<CalendarEvent[]>(`${CALENDAR_API_URL}/api/events`, { params })
    return response.data
  },

  getEventById: async (id: number) => {
    const response = await axios.get<CalendarEvent>(`${CALENDAR_API_URL}/api/events/${id}`)
    return response.data
  },

  createEvent: async (event: CalendarEvent) => {
    const response = await axios.post<CalendarEvent>(`${CALENDAR_API_URL}/api/events`, event)
    return response.data
  },

  updateEvent: async (id: number, event: Partial<CalendarEvent>) => {
    const response = await axios.put<CalendarEvent>(`${CALENDAR_API_URL}/api/events/${id}`, event)
    return response.data
  },

  deleteEvent: async (id: number) => {
    await axios.delete(`${CALENDAR_API_URL}/api/events/${id}`)
  }
}

export default calendarService
