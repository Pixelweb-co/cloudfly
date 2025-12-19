'use client'

import { useState, useEffect } from 'react'
import { PayrollPeriod } from '@/types/hr'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import PeriodFormDialog from '@/components/hr/PeriodFormDialog'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Stack,
    Pagination
} from '@mui/material'
import {
    CalendarMonth,
    Add
} from '@mui/icons-material'

export default function PeriodsPage() {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [dialogOpen, setDialogOpen] = useState(false)
    const customerId = 1

    useEffect(() => {
        loadPeriods()
    }, [page])

    const loadPeriods = async () => {
        try {
            setLoading(true)
            const response = await payrollPeriodService.getAll(customerId, page - 1, 10)
            setPeriods(response.content)
            setTotalPages(response.totalPages)
        } catch (error) {
            console.error('Error loading periods:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
            OPEN: 'info',
            CALCULATED: 'warning',
            APPROVED: 'success',
            PAID: 'success',
            CLOSED: 'default'
        }
        return colors[status] || 'default'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            OPEN: 'Abierto',
            CALCULATED: 'Calculado',
            APPROVED: 'Aprobado',
            PAID: 'Pagado',
            CLOSED: 'Cerrado'
        }
        return labels[status] || status
    }

    const getPeriodTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            WEEKLY: 'Semanal',
            BIWEEKLY: 'Quincenal',
            MONTHLY: 'Mensual'
        }
        return labels[type] || type
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-MX')
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            📅 Periodos de Nómina
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                            Nuevo Periodo
                        </Button>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : periods.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>
                                No hay periodos registrados
                            </Typography>
                            <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
                                Crear Primer Periodo
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell><strong>Periodo</strong></TableCell>
                                            <TableCell><strong>Tipo</strong></TableCell>
                                            <TableCell><strong>Año</strong></TableCell>
                                            <TableCell><strong>Inicio</strong></TableCell>
                                            <TableCell><strong>Fin</strong></TableCell>
                                            <TableCell><strong>Pago</strong></TableCell>
                                            <TableCell><strong>Días</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {periods.map((period) => (
                                            <TableRow key={period.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {period.periodName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getPeriodTypeLabel(period.periodType)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{period.year}</TableCell>
                                                <TableCell>{formatDate(period.startDate)}</TableCell>
                                                <TableCell>{formatDate(period.endDate)}</TableCell>
                                                <TableCell>{formatDate(period.paymentDate)}</TableCell>
                                                <TableCell align="center">{period.workingDays}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(period.status)}
                                                        color={getStatusColor(period.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={(_, value) => setPage(value)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            <PeriodFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={() => {
                    loadPeriods()
                }}
            />
        </Box>
    )
}

