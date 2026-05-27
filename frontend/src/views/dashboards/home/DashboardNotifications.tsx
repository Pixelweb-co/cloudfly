'use client'

// React Imports
import { useEffect } from 'react'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'

// Hook Imports
import { useDashboardUpdates } from '@/hooks/useDashboardUpdates'

interface DashboardNotificationsProps {
    onNewActivity?: (activity: any) => void
}

const DashboardNotifications = ({ onNewActivity }: DashboardNotificationsProps) => {
    const theme = useTheme()
    const { newActivity, clearActivity } = useDashboardUpdates()

    useEffect(() => {
        if (newActivity && onNewActivity) {
            onNewActivity(newActivity)
        }
    }, [newActivity, onNewActivity])

    const handleClose = () => {
        clearActivity()
    }

    if (!newActivity) return null

    return (
        <Snackbar
            open={!!newActivity}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert
                onClose={handleClose}
                severity='info'
                variant='filled'
                sx={{
                    width: '100%',
                    backgroundColor: theme.palette.primary.main,
                    '& .MuiAlert-icon': {
                        fontSize: 24
                    }
                }}
            >
                <strong>{newActivity.text}</strong>
                {newActivity.detail && (
                    <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                        {newActivity.detail}
                    </div>
                )}
            </Alert>
        </Snackbar>
    )
}

export default DashboardNotifications
