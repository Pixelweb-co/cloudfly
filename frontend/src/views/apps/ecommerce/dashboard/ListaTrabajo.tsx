'use client'

// React Imports
import { Fragment, useEffect, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'
import LinearProgress from '@mui/material/LinearProgress'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Utils
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

// Types mínimos del backend
type SolicitudItem = {
  idSolicitud: number
  fecha: string
  hora: string
  descripcion?: string
  nombreEquipo?: string
  nombreTipoServicio?: string
  nombreEntidad?: string
  nombreEstadoSolicitud?: string
}

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': { display: 'none' }
  },
  '& .MuiTimelineDot-root': { border: 0, padding: 0 }
})

const ListaTrabajo = () => {
  // tab state (por clave de estado)
  const [value, setValue] = useState<'abierta' | 'proceso' | 'finalizada'>('abierta')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<{ abierta: SolicitudItem[]; proceso: SolicitudItem[]; finalizada: SolicitudItem[] }>({ abierta: [], proceso: [], finalizada: [] })

  const user = userMethods.getUserLogin?.()
  const userId = user?.id as number | undefined
  const router = useRouter()

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue as any)
  }

  const fetchData = async () => {
    if (!userId) {
      setError('No hay usuario en sesión')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [abiertasRes, procesoRes, finalizadasRes] = await Promise.all([
        axiosInstance.get<SolicitudItem[]>(`/solicitudes/worklist/${userId}`),
        axiosInstance.get<SolicitudItem[]>(`/solicitudes/worklist/in-process/${userId}`),
        axiosInstance.get<SolicitudItem[]>(`/solicitudes/worklist/closed/${userId}`)
      ])
      setItems({
        abierta: abiertasRes.data || [],
        proceso: procesoRes.data || [],
        finalizada: finalizadasRes.data || []
      })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const currentList = useMemo(() => items[value] || [], [items, value])

  return (
    <Card>
      <CardHeader
        title='Mis solicitudes asignadas'
        subheader='Hoy'
        action={<OptionMenu options={[
          { text: 'Ver solicitudes', menuItemProps: { onClick: () => router.push('/solicitudes/list?worklist=1') } },
          { text: 'Refrescar', menuItemProps: { onClick: () => fetchData() } }
        ]} />}
        className='pbe-4'
      />
      <TabContext value={value}>
        <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
          <Tab value='abierta' label='Abiertas' />
          <Tab value='proceso' label='En proceso' />
          <Tab value='finalizada' label='Finalizadas' />
        </TabList>
        <TabPanel value={value} className='pbs-0'>
          <CardContent>
            {loading && <LinearProgress color='info' />}
            {!loading && error && (
              <Typography variant='body2' color='error'>
                {error}
              </Typography>
            )}
            {!loading && !error && currentList.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                No hay solicitudes para mostrar.
              </Typography>
            )}
            {!loading && !error && currentList.map((item, index) => (
              <Fragment key={item.idSolicitud ?? index}>
                <Timeline>
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot variant='outlined' className='mlb-0'>
                        <i className='tabler-clock text-xl text-success' />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent className='flex flex-col gap-0.5 pbs-0 pis-5 pbe-5'>
                      <Typography variant='body2' className='uppercase' color='success.main'>
                        {item.hora || '--:--'}
                      </Typography>
                      <Typography color='text.primary' className='font-medium'>
                        {item.nombreEntidad || item.nombreEquipo || 'Solicitud'}
                      </Typography>
                      <Typography className='text-ellipsis overflow-hidden whitespace-nowrap max-w-[260px]'>
                        {item.descripcion || item.nombreTipoServicio || ''}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
                {index !== currentList.length - 1 && <Divider className='mlb-4 border-dashed' />}
              </Fragment>
            ))}
          </CardContent>
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default ListaTrabajo
