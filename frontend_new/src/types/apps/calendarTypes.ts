import type { ThemeColor } from '@core/types'
import type { EventInput } from '@fullcalendar/core'

export type CalendarColors = {
  NOTIFICATION: ThemeColor
  REST_ACTION: ThemeColor
  WHATSAPP_CAMPAIGN: ThemeColor
  [key: string]: ThemeColor
}

export type CalendarType = {
  events: EventInput[]
  selectedEvent: null | any
  loading: boolean
  error: string | null
}
