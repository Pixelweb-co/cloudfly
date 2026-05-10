'use client'

// React Imports
import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const NotificationDropdown = () => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings } = useSettings()

  const handleDropdownOpen = () => {
    setOpen(!open)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent)) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  return (
    <>
      <IconButton
        ref={anchorRef}
        color='inherit'
        aria-haspopup='true'
        onClick={handleDropdownOpen}
      >
        <Badge badgeContent={3} color='error'>
          <i className='tabler-bell text-2xl' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[300px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2 }}>
                    <Typography variant='h6' sx={{ fontSize: '1rem' }}>
                      Notificaciones
                    </Typography>
                    <Badge badgeContent={3} color='primary' sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />
                  </Box>
                  <Divider />
                  <MenuItem onClick={e => handleDropdownClose(e)} sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        Nuevo pedido recibido
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Hace 5 minutos
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={e => handleDropdownClose(e)} sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        Nueva cotización generada
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Hace 25 minutos
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={e => handleDropdownClose(e)} sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        Campaña de marketing finalizada
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Hace 1 hora
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem sx={{ justifyContent: 'center', color: 'primary.main', py: 2 }}>
                    Ver todas las notificaciones
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationDropdown
