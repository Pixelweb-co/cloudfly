'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// Third Party Imports
import type { ApexOptions } from 'apexcharts'

// Utils
import { axiosInstance } from '@/utils/axiosInstance'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

// Types
type MonthlyCount = { month: number; total: number }

const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const RequestsByMonthBar = () => {
  const theme = useTheme()
  const [data, setData] = useState<number[]>(new Array(12).fill(0))
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const year = new Date().getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get<MonthlyCount[]>('/solicitudes/por-mes', { params: { year } })
        const counts = new Array(12).fill(0)
        res.data.forEach(item => {
          if (item && item.month >= 1 && item.month <= 12) counts[item.month - 1] = Number(item.total) || 0
        })
        setData(counts)
      } catch (err) {
        console.error('Error cargando solicitudes por mes', err)
        setError('No se pudo cargar la información')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year])

  const options: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    colors: ['var(--mui-palette-primary-main)'],
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      yaxis: { lines: { show: false } },
      padding: { left: 0, right: 0, bottom: -8 }
    },
    xaxis: {
      categories: monthLabels,
      axisTicks: { show: false },
      axisBorder: { show: false },
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '40%' }
    }
  }

  return (
    <Card>
      <CardHeader title={`Solicitudes por mes (${year})`} />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Box sx={{ color: 'error.main', textAlign: 'center', py: 4 }}>{error}</Box>
        ) : (
          <AppReactApexCharts type='bar' height={320} width='100%' series={[{ name: 'Solicitudes', data }]} options={options} />
        )}
      </CardContent>
    </Card>
  )
}

export default RequestsByMonthBar
