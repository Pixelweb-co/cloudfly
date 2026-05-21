'use client'

import { useMemo } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'

import type { ContactType } from '@/types/apps/contactType'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

interface CRMStatsCardsProps {
    contactsData: ContactType[]
}

const CRMStatsCards = ({ contactsData = [] }: CRMStatsCardsProps) => {
    const theme = useTheme()

    // calculations
    const stats = useMemo(() => {
        const total = contactsData.length
        const active = contactsData.filter((c: any) => c.isActive !== false).length
        const inactive = total - active
        const activePercent = total > 0 ? Math.round((active / total) * 100) : 0

        // Data completeness calculations (Name, Email, Phone, taxId)
        let totalPoints = 0
        let earnedPoints = 0
        contactsData.forEach(c => {
            totalPoints += 4
            if (c.name) earnedPoints++
            if (c.email) earnedPoints++
            if (c.phone) earnedPoints++
            if (c.taxId) earnedPoints++
        })
        const completenessPercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

        // Segment distribution
        const lead = contactsData.filter(c => c.type === 'LEAD').length
        const customer = contactsData.filter(c => c.type === 'CUSTOMER').length
        const potential = contactsData.filter(c => c.type === 'POTENTIAL_CUSTOMER').length
        const supplier = contactsData.filter(c => c.type === 'SUPPLIER').length
        const other = contactsData.filter(c => c.type === 'OTHER').length

        // Channels distribution
        const hasEmail = contactsData.filter(c => c.email).length
        const hasPhone = contactsData.filter(c => c.phone).length
        const hasTaxId = contactsData.filter(c => c.taxId).length

        return {
            total,
            active,
            inactive,
            activePercent,
            completenessPercent,
            segments: { lead, customer, potential, supplier, other },
            channels: { hasEmail, hasPhone, hasTaxId }
        }
    }, [contactsData])

    // Card 1: Donut for Active vs Inactive
    const cardActiveOptions = {
        chart: {
            sparkline: { enabled: true },
            animations: { enabled: true }
        },
        grid: {
            padding: { top: 10, bottom: 10 }
        },
        colors: [theme.palette.success.main, theme.palette.error.light],
        labels: ['Activos', 'Inactivos'],
        stroke: { width: 0 },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Activos',
                            formatter: () => `${stats.activePercent}%`,
                            style: {
                                fontSize: '15px',
                                color: theme.palette.text.primary,
                                fontWeight: 600
                            }
                        },
                        value: {
                            show: true,
                            formatter: (val: string) => val,
                            style: {
                                fontSize: '14px',
                                color: theme.palette.text.secondary
                            }
                        }
                    }
                }
            }
        },
        legend: { show: false },
        tooltip: { enabled: true }
    }

    const cardActiveSeries = [stats.active, stats.inactive]

    // Card 2: Radial bar for Data Completeness
    const cardCompletenessOptions = {
        chart: {
            sparkline: { enabled: true }
        },
        grid: {
            padding: { top: 10, bottom: 10 }
        },
        colors: [theme.palette.primary.main],
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '65%' },
                track: {
                    background: theme.palette.background.default,
                    strokeWidth: '97%'
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: '18px',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        formatter: (val: number) => `${Math.round(val)}%`
                    }
                }
            }
        },
        stroke: { lineCap: 'round' }
    }

    const cardCompletenessSeries = [stats.completenessPercent]

    // Card 3: Horizontal Bar Chart for Segments Distribution
    const cardSegmentsOptions = {
        chart: {
            sparkline: { enabled: true },
            toolbar: { show: false }
        },
        grid: {
            padding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        colors: [theme.palette.info.main],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: '60%',
                distributed: false
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ['Leads', 'Cl. Potenciales', 'Clientes', 'Proveedores', 'Otros'],
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { show: false }
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val} contactos`
            }
        }
    }

    const cardSegmentsSeries = [
        {
            name: 'Segmentos',
            data: [
                stats.segments.lead,
                stats.segments.potential,
                stats.segments.customer,
                stats.segments.supplier,
                stats.segments.other
            ]
        }
    ]

    // Card 4: Channel Completeness Columns
    const cardChannelsOptions = {
        chart: {
            sparkline: { enabled: true },
            toolbar: { show: false }
        },
        grid: {
            padding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        colors: [theme.palette.warning.main],
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '50%'
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ['Email', 'Teléfono', 'Documento'],
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val} con datos`
            }
        }
    }

    const cardChannelsSeries = [
        {
            name: 'Canales',
            data: [stats.channels.hasEmail, stats.channels.hasPhone, stats.channels.hasTaxId]
        }
    ]

    return (
        <Grid container spacing={6} sx={{ mb: 6 }}>
            {/* Card 1: Total & Active Status */}
            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                    <CardContent className='flex items-center justify-between gap-4 h-full'>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant='rounded' color='success' sx={{ backgroundColor: 'success.light', color: 'success.main', width: 38, height: 38 }}>
                                    <i className='tabler-users text-xl' />
                                </Avatar>
                                <Typography variant='body2' color='text.secondary' className='font-medium'>
                                    Total Contactos
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='h4' color='text.primary' className='font-bold'>
                                    {stats.total}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    {stats.active} Activos / {stats.inactive} Inactivos
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ width: 90, height: 90 }}>
                            <AppReactApexCharts
                                type='donut'
                                width={95}
                                height={95}
                                options={cardActiveOptions as any}
                                series={cardActiveSeries}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Card 2: CRM Data Quality Index */}
            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                    <CardContent className='flex items-center justify-between gap-4 h-full'>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant='rounded' color='primary' sx={{ backgroundColor: 'primary.light', color: 'primary.main', width: 38, height: 38 }}>
                                    <i className='tabler-shield-check text-xl' />
                                </Avatar>
                                <Typography variant='body2' color='text.secondary' className='font-medium'>
                                    Salud de Datos CRM
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='h4' color='text.primary' className='font-bold'>
                                    {stats.completenessPercent}%
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    Índice de completitud
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AppReactApexCharts
                                type='radialBar'
                                width={100}
                                height={100}
                                options={cardCompletenessOptions as any}
                                series={cardCompletenessSeries}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Card 3: Segments Breakdown */}
            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                    <CardContent className='flex items-center justify-between gap-4 h-full'>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant='rounded' color='info' sx={{ backgroundColor: 'info.light', color: 'info.main', width: 38, height: 38 }}>
                                    <i className='tabler-hierarchy-2 text-xl' />
                                </Avatar>
                                <Typography variant='body2' color='text.secondary' className='font-medium'>
                                    Segmentación CRM
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='h4' color='text.primary' className='font-bold'>
                                    {stats.segments.customer} Clientes
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    {stats.segments.lead} Leads / {stats.segments.potential} Potenciales
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ width: 80, height: 80 }}>
                            <AppReactApexCharts
                                type='bar'
                                width={80}
                                height={80}
                                options={cardSegmentsOptions as any}
                                series={cardSegmentsSeries}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Card 4: Channels & Completeness */}
            <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                    <CardContent className='flex items-center justify-between gap-4 h-full'>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant='rounded' color='warning' sx={{ backgroundColor: 'warning.light', color: 'warning.main', width: 38, height: 38 }}>
                                    <i className='tabler-devices text-xl' />
                                </Avatar>
                                <Typography variant='body2' color='text.secondary' className='font-medium'>
                                    Canales Registrados
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant='h4' color='text.primary' className='font-bold'>
                                    {stats.channels.hasPhone} Móviles
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    {stats.channels.hasEmail} Emails / {stats.channels.hasTaxId} Documentos
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ width: 80, height: 80 }}>
                            <AppReactApexCharts
                                type='bar'
                                width={80}
                                height={80}
                                options={cardChannelsOptions as any}
                                series={cardChannelsSeries}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default CRMStatsCards
