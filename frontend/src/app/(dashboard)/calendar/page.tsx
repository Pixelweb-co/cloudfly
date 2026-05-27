// MUI Imports
import Card from '@mui/material/Card'

// Component Imports
import CalendarWrapper from '@views/apps/calendar/CalendarWrapper'

// Styled Component Imports
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import ReduxProvider from '@/redux-store/ReduxProvider'

const CalendarApp = () => {
  return (
    <Card className='overflow-visible'>
      <ReduxProvider>
      <AppFullCalendar className='app-calendar'>
        <CalendarWrapper />
      </AppFullCalendar>
      </ReduxProvider>
    </Card>
  )
}

export default CalendarApp
