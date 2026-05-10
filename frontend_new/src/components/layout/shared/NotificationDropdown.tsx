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
import Button from '@mui/material/Button'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

interface NotificationItem {
  id: number
  title: string
  time: string
  read: boolean
}

const NotificationDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, title: 'Nuevo pedido recibido', time: 'Hace 5 minutos', read: false },
    { id: 2, title: 'Nueva cotización generada', time: 'Hace 25 minutos', read: false },
    { id: 3, title: 'Campaña de marketing finalizada', time: 'Hace 1 hora', read: false }
  ])

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

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <IconButton
        ref={anchorRef}
        color='inherit'
        aria-haspopup='true'
        onClick={handleDropdownOpen}
      >
        <Badge badgeContent={unreadCount} color='error'>
          <i className='tabler-bell text-2xl' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[320px] !mbs-3 z-[1]'
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
                <MenuList sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 3 }}>
                    <Typography variant='h6' sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      Notificaciones
                    </Typography>
                    {unreadCount > 0 && (
                      <Badge 
                        badgeContent={unreadCount} 
                        color='primary' 
                        sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} 
                      />
                    )}
                  </Box>
                  <Divider sx={{ m: 0 }} />
                  
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>No hay notificaciones</Typography>
                    </Box>
                  ) : (
                    notifications.map((notification) => (
                      <Box key={notification.id}>
                        <MenuItem 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-start',
                            py: 3,
                            px: 4,
                            gap: 1,
                            backgroundColor: notification.read ? 'transparent' : 'action.hover',
                            '&:hover': { backgroundColor: 'action.selected' }
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Typography variant='body2' sx={{ fontWeight: notification.read ? 400 : 600, color: 'text.primary' }}>
                              {notification.title}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {notification.time}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            {!notification.read && (
                              <Typography 
                                variant='caption' 
                                sx={{ 
                                  color: 'primary.main', 
                                  cursor: 'pointer', 
                                  fontWeight: 600,
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                Leído
                              </Typography>
                            )}
                            <Typography 
                              variant='caption' 
                              sx={{ 
                                color: 'error.main', 
                                cursor: 'pointer', 
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              onClick={(e) => handleDelete(notification.id, e)}
                            >
                              Eliminar
                            </Typography>
                          </Box>
                        </MenuItem>
                        <Divider sx={{ m: 0 }} />
                      </Box>
                    ))
                  )}

                  <MenuItem 
                    sx={{ 
                      justifyContent: 'center', 
                      color: 'primary.main', 
                      py: 3,
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                    onClick={e => handleDropdownClose(e)}
                  >
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
