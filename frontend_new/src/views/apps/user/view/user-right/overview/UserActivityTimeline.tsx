'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import Typography from '@mui/material/Typography'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import Alert from '@mui/material/Alert'
import type { TimelineProps } from '@mui/lab/Timeline'

// Utils
import { userMethods } from '@/utils/userMethods'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

const UserActivityTimeLine = () => {
  const [activities, setActivities] = useState<any[]>([])

  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const tenantId = sessionUser?.customerId

  useEffect(() => {
    if (tenantId) {
      // Future integration: fetch actual user activity logs
      // axios.get(`${API_URL}/api/v1/activities/tenant/${tenantId}`)
      //   .then(res => setActivities(res.data))
      //   .catch(err => console.log("No activity logs found", err))
      setActivities([])
    }
  }, [tenantId])

  return (
    <Card>
      <CardHeader title='Línea de Tiempo de Actividad' />
      <CardContent>
        {activities.length === 0 ? (
          <Alert severity="info" icon={false}>
            <Typography variant="body2" color="text.secondary">
              No hay actividad reciente registrada en tu cuenta.
            </Typography>
          </Alert>
        ) : (
          <Timeline>
            {activities.map((activity, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color='primary' />
                  {index !== activities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                    <Typography className='font-medium' color='text.primary'>
                      {activity.title}
                    </Typography>
                    <Typography variant='caption' color='text.disabled'>
                      {activity.time}
                    </Typography>
                  </div>
                  <Typography className='mbe-2'>{activity.description}</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  )
}

export default UserActivityTimeLine
