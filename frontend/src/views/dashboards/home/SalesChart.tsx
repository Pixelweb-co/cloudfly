'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useTheme } from '@mui/material/styles'

// Recharts Imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Period = '7d' | '30d' | 'year'

interface ChartData {
    date: string
    ventas: number
    ordenes: number
}

const SalesChart = () => {
    // Suppress Recharts defaultProps warning
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
        if (typeof args[0] === 'string' && /defaultProps/.test(args[0])) {
            return
        }
        originalConsoleError(...args)
    }

    const theme = useTheme()
    const [period, setPeriod] = useState<Period>('7d')
    const [data, setData] = useState<ChartData[]>([])

    useEffect(() => {
        fetchChartData(period)
    }, [period])

    const fetchChartData = async (selectedPeriod: Period) => {
        // TODO: Fetch real data from API
        const mockData: Record<Period, ChartData[]> = {
            '7d': [
                { date: 'Lun', ventas: 1200, ordenes: 8 },
                { date: 'Mar', ventas: 1900, ordenes: 12 },
                { date: 'Mié', ventas: 1500, ordenes: 10 },
                { date: 'Jue', ventas: 2200, ordenes: 15 },
                { date: 'Vie', ventas: 2800, ordenes: 18 },
                { date: 'Sáb', ventas: 3200, ordenes: 21 },
                { date: 'Dom', ventas: 2450, ordenes: 16 }
            ],
            '30d': [
                { date: 'Sem 1', ventas: 8500, ordenes: 65 },
                { date: 'Sem 2', ventas: 9200, ordenes: 72 },
                { date: 'Sem 3', ventas: 8800, ordenes: 68 },
                { date: 'Sem 4', ventas: 10500, ordenes: 82 }
            ],
            'year': [
                { date: 'Ene', ventas: 35000, ordenes: 280 },
                { date: 'Feb', ventas: 38000, ordenes: 295 },
                { date: 'Mar', ventas: 42000, ordenes: 320 },
                { date: 'Abr', ventas: 39000, ordenes: 305 },
                { date: 'May', ventas: 45000, ordenes: 350 },
                { date: 'Jun', ventas: 48000, ordenes: 370 },
                { date: 'Jul', ventas: 52000, ordenes: 395 },
                { date: 'Ago', ventas: 49000, ordenes: 380 },
                { date: 'Sep', ventas: 51000, ordenes: 390 },
                { date: 'Oct', ventas: 54000, ordenes: 410 },
                { date: 'Nov', ventas: 56000, ordenes: 425 },
                { date: 'Dic', ventas: 60000, ordenes: 450 }
            ]
        }

        setData(mockData[selectedPeriod])
    }

    const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: Period | null) => {
        if (newPeriod !== null) {
            setPeriod(newPeriod)
        }
    }

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    return (
        <Card>
            <CardHeader
                title='Ventas y Órdenes'
                subheader='Resumen del período seleccionado'
                action={
                    <ToggleButtonGroup
                        value={period}
                        exclusive
                        onChange={handlePeriodChange}
                        size='small'
                    >
                        <ToggleButton value='7d'>7 días</ToggleButton>
                        <ToggleButton value='30d'>30 días</ToggleButton>
                        <ToggleButton value='year'>Año</ToggleButton>
                    </ToggleButtonGroup>
                }
            />
            <CardContent>
                <ResponsiveContainer width='100%' height={350}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
                        <XAxis
                            dataKey='date'
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8
                            }}
                            formatter={(value: number, name: string) => [
                                name === 'ventas' ? formatValue(value) : value,
                                name === 'ventas' ? 'Ventas' : 'Órdenes'
                            ]}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                            formatter={(value) => value === 'ventas' ? 'Ventas' : 'Órdenes'}
                        />
                        <Line
                            type='monotone'
                            dataKey='ventas'
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{ fill: theme.palette.primary.main, r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                        <Line
                            type='monotone'
                            dataKey='ordenes'
                            stroke='#667eea'
                            strokeWidth={3}
                            dot={{ fill: '#667eea', r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default SalesChart
