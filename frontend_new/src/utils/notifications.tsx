import toast from 'react-hot-toast'
import { Box, Typography, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'

/**
 * Muestra una notificación premium al estilo Cloudfly.
 */
export const showSuccessNotification = (message: string) => {
  toast.custom((t) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2ECC71',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '320px',
        animation: t.visible ? 'enter 0.3s ease-out' : 'leave 0.3s ease-in',
        position: 'relative'
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
            <Icon icon="tabler:check" fontSize="1.2rem" />
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
  ), {
    duration: 4000,
    position: 'bottom-right'
  })
}
