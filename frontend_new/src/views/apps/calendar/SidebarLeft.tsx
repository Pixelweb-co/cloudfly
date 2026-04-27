'use client'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party imports
import classnames from 'classnames'

// Types Imports
import type { CalendarColors } from '@/types/apps/calendarTypes'
import type { ThemeColor } from '@core/types'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type Props = {
  mdAbove: boolean
  leftSidebarOpen: boolean
  handleLeftSidebarToggle: () => void
  calendarApi: any
  calendarsColor: CalendarColors
  selectedCalendars: string[]
  onFilterChange: (label: string) => void
  onFilterAll: (val: boolean) => void
  handleAddEventSidebarToggle: () => void
}

const SidebarLeft = (props: Props) => {
  // Props
  const {
    mdAbove,
    leftSidebarOpen,
    handleLeftSidebarToggle,
    calendarApi,
    calendarsColor,
    selectedCalendars,
    onFilterChange,
    onFilterAll,
    handleAddEventSidebarToggle
  } = props

  const colorsArr = Object.entries(calendarsColor)

  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant={mdAbove ? 'permanent' : 'temporary'}
      ModalProps={{
        disablePortal: true,
        disableAutoFocus: true,
        disableScrollLock: true,
        keepMounted: true
      }}
      className={classnames('block', { static: mdAbove, absolute: !mdAbove })}
      PaperProps={{
        className: classnames('items-start is-[280px] shadow-none rounded rounded-se-none rounded-ee-none', {
          static: mdAbove,
          absolute: !mdAbove
        })
      }}
      sx={{
        zIndex: 3,
        '& .MuiDrawer-paper': {
          zIndex: mdAbove ? 2 : 'drawer'
        },
        '& .MuiBackdrop-root': {
          borderRadius: 1,
          position: 'absolute'
        }
      }}
    >
      <div className='p-6 is-full'>
        <Button
          fullWidth
          variant='contained'
          onClick={() => {
            handleLeftSidebarToggle()
            handleAddEventSidebarToggle()
          }}
          startIcon={<i className='tabler-plus' />}
        >
          Add Event
        </Button>
      </div>
      <Divider className='is-full' />
      <AppReactDatepicker
        inline
        onChange={date => calendarApi?.gotoDate(date)}
        boxProps={{
          className: 'flex justify-center is-full',
          sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
        }}
      />
      <Divider className='is-full' />

      <div className='flex flex-col p-6 is-full'>
        <Typography variant='h5' className='mbe-4'>
          Filtrar por etiqueta
        </Typography>
        <FormControlLabel
          className='mbe-1'
          label='Ver todos'
          control={
            <Checkbox
              color='secondary'
              checked={selectedCalendars.length === colorsArr.length}
              onChange={e => onFilterAll(e.target.checked)}
            />
          }
        />
        {colorsArr.map(([key, value]) => (
          <FormControlLabel
            className='mbe-1'
            key={key}
            label={key}
            control={
              <Checkbox
                color={value as ThemeColor}
                checked={selectedCalendars.includes(key)}
                onChange={() => onFilterChange(key)}
              />
            }
          />
        ))}
      </div>
    </Drawer>
  )
}

export default SidebarLeft
