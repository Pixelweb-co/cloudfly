'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axiosInstance'

// Icons mapping
const ICONS: Record<string, string> = {
  Solicitudes: 'tabler-chart-pie-2',
  Clientes: 'tabler-users',
  Equipos: 'tabler-box',
  Reportes: 'tabler-report'
}

// Colors mapping
const COLORS: Record<string, ThemeColor> = {
  Solicitudes: 'primary',
  Clientes: 'info',
  Equipos: 'error',
  Reportes: 'success'
}

type OverviewStats = {
  solicitudes: number
  clientes: number
  equipos: number
  reportes: number
}

const EstadisticasGenerales = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get<OverviewStats>('/dashboard/overview')
        if (!active) return
        setStats(res.data)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudieron cargar las estadísticas')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      active = false
    }
  }, [])

  const items = [
    { key: 'Solicitudes', value: stats?.solicitudes ?? 0 },
    { key: 'Clientes', value: stats?.clientes ?? 0 },
    { key: 'Equipos', value: stats?.equipos ?? 0 },
    { key: 'Reportes', value: stats?.reportes ?? 0 }
  ]

  const subtitle = loading
    ? 'Cargando...'
    : error
      ? 'Error al cargar'
      : `Actualizado ${new Date().toLocaleString()}`

  const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n)

  return (
    <Card>
      <CardHeader title='Estadistica general' action={<Typography variant='subtitle2' color='text.disabled'>{subtitle}</Typography>} />
      <CardContent className='flex justify-between flex-wrap gap-4 md:pbs-10 max-md:pbe-6 max-[1060px]:pbe-[74px] max-[1200px]:pbe-[52px] max-[1320px]:pbe-[74px] max-[1501px]:pbe-[52px]'>
        <Grid container spacing={4}>
          {items.map((item, index) => (
            <Grid key={index} item xs className='flex items-center gap-4'>
              <CustomAvatar color={COLORS[item.key]} variant='rounded' size={40} skin='light'>
                <i className={ICONS[item.key]}></i>
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5'>{loading ? '—' : formatNumber(item.value)}</Typography>
                <Typography variant='body2'>{item.key}</Typography>
              </div>
            </Grid>
          ))}
        </Grid>
        {error && (
          <Typography variant='caption' color='error' className='mts-4'>
            {error}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default EstadisticasGenerales
