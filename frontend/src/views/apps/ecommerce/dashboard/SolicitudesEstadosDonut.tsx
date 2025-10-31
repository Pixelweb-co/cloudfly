'use client'

// Next Imports
import dynamic from 'next/dynamic'

// React
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Utils
import axiosInstance from '@/utils/axiosInterceptor'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type StatusCount = { status: string; total: number }

const SolicitudesDonut = () => {
  const theme = useTheme()
  const [data, setData] = useState<StatusCount[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosInstance.get<StatusCount[]>('/solicitudes/resumen-mensual', { params: { year, month } })
        setData(res.data || [])
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [year, month])

  const series = useMemo(() => {
    const map: Record<string, number> = { Abiertas: 0, 'En proceso': 0, Cerradas: 0, Canceladas: 0 }
    data.forEach(d => {
      const key = (d.status || '').toUpperCase()
      if (key.includes('ABIER')) map.Abiertas += Number(d.total || 0)
      else if (key.includes('PROCES')) map['En proceso'] += Number(d.total || 0)
      else if (key.includes('FINAL') || key.includes('CERRA')) map.Cerradas += Number(d.total || 0)
      else if (key.includes('CANCEL')) map.Canceladas += Number(d.total || 0)
    })
    return [map.Abiertas, map['En proceso'], map.Cerradas, map.Canceladas]
  }, [data])

  const total = series.reduce((a, b) => a + b, 0)

  // Vars
  const textSecondary = 'var(--mui-palette-text-secondary)'
  const successColor = 'var(--mui-palette-success-main)'

  const options: ApexOptions = {
    colors: [
      successColor,
      'rgba(var(--mui-palette-success-mainChannel) / 0.7)',
      'rgba(var(--mui-palette-success-mainChannel) / 0.5)',
      'var(--mui-palette-success-lightOpacity)'
    ],
    stroke: { width: 0 },
    legend: { show: false },
    tooltip: { enabled: true, theme: 'false' },
    dataLabels: { enabled: false },
    labels: ['Abiertas', 'En proceso', 'Cerradas', 'Canceladas'],
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    grid: { padding: { top: -22, bottom: -18 } },
    plotOptions: {
      pie: {
        customScale: 0.8,
        expandOnClick: false,
        donut: {
          size: '73%',
          labels: {
            show: true,
            name: { offsetY: 25, color: textSecondary, fontFamily: theme.typography.fontFamily },
            value: {
              offsetY: -15,
              fontWeight: 500,
              formatter: val => `${val}`,
              color: 'var(--mui-palette-text-primary)',
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.h3.fontSize as string
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              color: successColor,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body1.fontSize as string
            }
          }
        }
      }
    },
    responsive: [
      { breakpoint: theme.breakpoints.values.xl, options: { chart: { width: 200, height: 237 } } },
      { breakpoint: theme.breakpoints.values.md, options: { chart: { width: 150, height: 199 } } }
    ]
  }

  return (
    <Card className='overflow-visible'>
      <CardContent className='flex justify-between gap-4'>
        <div className='flex flex-col justify-between'>
          <div className='flex flex-col'>
            <Typography variant='h5'>Solicitudes</Typography>
            <Typography>Reporte mensual</Typography>
          </div>
          <div className='flex flex-col items-start'>
            <Typography variant='h3'>{loading ? '—' : total}</Typography>
            <div className='flex items-center gap-1'>
              <i className='tabler-chevron-up text-success text-xl'></i>
              <Typography color='success.main' component='span'>
                {/* Placeholder de porcentaje mensual (si luego calculamos delta) */}
                0%
              </Typography>
            </div>
          </div>
        </div>
        <AppReactApexCharts type='donut' width={150} height={177} series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default SolicitudesDonut
