'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchUnreadSummary, markContactAsRead } from '@/redux/slices/unreadMessagesSlice'

// MUI Imports
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
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const UnreadMessagesDropdown = () => {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()
  const { items: contacts, totalUnread } = useAppSelector(state => state.unreadMessages)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const { settings } = useSettings()
  const router = useRouter()

  useEffect(() => {
    dispatch(fetchUnreadSummary())
  }, [dispatch])

  const handleDropdownOpen = () => {
    setOpen(!open)
  }

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent)) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }
    setOpen(false)
  }

  const handleContactClick = (contactId: number) => {
    // Mark as read in DB + Evolution API
    dispatch(markContactAsRead(contactId))
    setOpen(false)
    // Navigate to contact detail
    router.push(`/marketing/contacts/${contactId}`)
  }

  const handleMarkAsRead = (contactId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(markContactAsRead(contactId))
  }

  return (
    <>
      <IconButton
        ref={anchorRef}
        color='inherit'
        aria-haspopup='true'
        onClick={handleDropdownOpen}
      >
        <Badge badgeContent={totalUnread} color='success'>
          <i className='tabler-message-2 text-2xl' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[340px] !mbs-3 z-[1]'
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
                      Mensajes
                    </Typography>
                    {totalUnread > 0 && (
                      <Chip 
                        label={`${totalUnread} sin leer`}
                        color='success'
                        size='small'
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                  <Divider sx={{ m: 0 }} />

                  <Box sx={{ maxHeight: '50vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'action.hover', borderRadius: '10px' } }}>
                    {contacts.length === 0 ? (
                      <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>No hay mensajes sin leer</Typography>
                      </Box>
                    ) : (
                      contacts.map((contact) => (
                        <Box key={contact.contactId}>
                          <MenuItem
                            onClick={() => handleContactClick(contact.contactId)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              py: 3,
                              px: 4,
                              '&:hover': { backgroundColor: 'action.selected' }
                            }}
                          >
                            <Avatar
                              src={contact.avatarUrl || undefined}
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                bgcolor: 'primary.main',
                                fontSize: '0.9rem',
                                fontWeight: 600 
                              }}
                            >
                              {contact.contactName?.charAt(0)?.toUpperCase() || '?'}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                                {contact.contactName}
                              </Typography>
                              <Typography variant='caption' color='text.secondary' noWrap>
                                {contact.phone || 'Sin teléfono'}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                              <Badge 
                                badgeContent={contact.unreadCount} 
                                color='success' 
                                sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', fontWeight: 700 } }}
                              />
                              <Typography 
                                variant='caption' 
                                sx={{ 
                                  color: 'primary.main', 
                                  cursor: 'pointer', 
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                  textTransform: 'uppercase',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={(e) => handleMarkAsRead(contact.contactId, e)}
                              >
                                Leído
                              </Typography>
                            </Box>
                          </MenuItem>
                          <Divider sx={{ m: 0 }} />
                        </Box>
                      ))
                    )}
                  </Box>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UnreadMessagesDropdown
