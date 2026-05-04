import toast from 'react-hot-toast'
import { Box, Typography, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'

/**
 * Notificación Base Premium
 */
const CustomNotification = ({ t, message, color, icon }: { t: any, message: string, color: string, icon: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: color,
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '320px',
      animation: t.visible ? 'enter 0.3s ease-out' : 'leave 0.3s ease-in',
      position: 'relative',
      zIndex: 9999
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Box 
          sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '50%', 
              width: 32, 
              height: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
          }}
      >
          <Icon icon={icon} fontSize="1.2rem" />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
        {message}
      </Typography>
    </Box>
    <IconButton 
      size="small" 
      onClick={() => toast.dismiss(t.id)}
      sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
    >
      <Icon icon="tabler:x" fontSize="1rem" />
    </IconButton>
    
    <style>{`
      @keyframes enter {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes leave {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
      }
    `}</style>
  </Box>
)

/**
 * Muestra una notificación de éxito (Verde).
 */
export const showSuccessNotification = (message: string) => {
  toast.custom((t) => (
    <CustomNotification t={t} message={message} color="#2ECC71" icon="tabler:check" />
  ), { duration: 4000, position: 'bottom-right' })
}

/**
 * Muestra una notificación de error (Rojo).
 */
export const showFailureNotification = (message: string) => {
  toast.custom((t) => (
    <CustomNotification t={t} message={message} color="#E74C3C" icon="tabler:alert-circle" />
  ), { duration: 5000, position: 'bottom-right' })
}
