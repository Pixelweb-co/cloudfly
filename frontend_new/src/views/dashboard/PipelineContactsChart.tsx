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
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Service Imports
import dashboardService, { PipelineStats } from '@/services/dashboardService'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const PipelineContactsChart = () => {
    // Hooks
    const theme = useTheme()
    const [data, setData] = useState<PipelineStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await dashboardService.getPipelineStats()
                setData(res)
            } catch (err) {
                console.error('Error fetching pipeline stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardContent className='flex justify-center items-center' sx={{ height: 400 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        )
    }

    if (!data || !data.stages || data.stages.length === 0) {
        return null
    }

    const categories = data.stages.map(s => s.name)
    const seriesData = data.stages.map(s => s.contactCount)
    const colors = data.stages.map(s => s.color || theme.palette.primary.main)

    const options: ApexOptions = {
        chart: {
            parentHeightOffset: 0,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                distributed: true,
                barHeight: '60%',
                dataLabels: {
                    position: 'bottom'
                }
            }
        },
        colors: colors,
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: ['#fff']
            },
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val
            },
            offsetX: 0,
            dropShadow: {
                enabled: true
            }
        },
        grid: {
            xaxis: {
                lines: { show: true }
            },
            yaxis: {
                lines: { show: false }
            }
        },
        xaxis: {
            categories: categories,
            labels: {
                show: true,
                style: { colors: 'var(--mui-palette-text-disabled)' }
            }
        },
        yaxis: {
            labels: {
                show: false
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                title: {
                    formatter: () => 'Contactos'
                }
            }
        }
    }

    return (
        <Card>
            <CardHeader 
                title={data.pipelineName || 'Contactos por Etapa'} 
                subheader="Estadísticas en tiempo real del embudo de ventas"
            />
            <CardContent>
                <AppReactApexCharts type='bar' height={400} width='100%' options={options} series={[{ data: seriesData }]} />
            </CardContent>
        </Card>
    )
}

export default PipelineContactsChart
