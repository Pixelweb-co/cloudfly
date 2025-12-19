'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PayrollPeriod } from '@/types/hr'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
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
    Pagination,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    LinearProgress,
    Grid,
    Alert
} from '@mui/material'
import {
    Add,
    Edit,
    Delete,
    CalendarMonth,
    AccessTime,
    Payment,
    Today,
    People,
    AttachMoney
} from '@mui/icons-material'

// Card del periodo actual con barra de progreso
function CurrentPeriodCard({ period }: { period: PayrollPeriod | null }) {
    if (!period) {
        return (
            <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                    <Typography variant="h6" color="white" textAlign="center">
                        📅 No hay un período activo actualmente
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)" textAlign="center">
                        Crea un nuevo período para comenzar a procesar la nómina
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    // Calcular progreso de días
    const today = new Date()
    const startDate = new Date(period.startDate)
    const endDate = new Date(period.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const formatCurrency = (amount: number | undefined) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0)
    }

    const getPeriodTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            WEEKLY: 'Semanal',
            BIWEEKLY: 'Quincenal',
            MONTHLY: 'Mensual'
        }
        return labels[type] || type
    }

    return (
        <Card elevation={3} sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white'
        }}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    {/* Información del período */}
                    <Grid item xs={12} md={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarMonth sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    {period.periodName}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {getPeriodTypeLabel(period.periodType)} • {period.year}
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Barra de progreso */}
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2">
                                    <Today fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {formatDate(period.startDate)}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {Math.round(progress)}%
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(period.endDate)}
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: 'white',
                                        borderRadius: 6
                                    }
                                }}
                            />
                            <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption">
                                    <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {elapsedDays} días transcurridos
                                </Typography>
                                <Typography variant="caption">
                                    {remainingDays > 0 ? `${remainingDays} días restantes` : 'Período finalizado'}
                                </Typography>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Empleados */}
                    <Grid item xs={6} md={2}>
                        <Box textAlign="center">
                            <People sx={{ fontSize: 28 }} />
                            <Typography variant="h4" fontWeight="bold">
                                {period.employeeCount || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Empleados
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Valores de nómina */}
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Stack spacing={1}>
                                <Box sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    borderRadius: 1,
                                    p: 1,
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="caption" display="block">
                                        <AttachMoney fontSize="small" sx={{ verticalAlign: 'middle' }} />
                                        Transcurrido
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatCurrency(period.elapsedPayroll)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    borderRadius: 1,
                                    p: 1,
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="caption" display="block">
                                        <Payment fontSize="small" sx={{ verticalAlign: 'middle' }} />
                                        Total Período
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatCurrency(period.totalPayroll)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default function PeriodsPage() {
    const router = useRouter()
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [periodToDelete, setPeriodToDelete] = useState<PayrollPeriod | null>(null)
    const [hasOpenPeriod, setHasOpenPeriod] = useState(false)
    const customerId = 1

    useEffect(() => {
        loadData()
    }, [page])

    const loadData = async () => {
        try {
            setLoading(true)
            const [periodsResponse, current, hasOpen] = await Promise.all([
                payrollPeriodService.getAll(customerId, page - 1, 10),
                payrollPeriodService.getCurrent(customerId),
                payrollPeriodService.hasOpenPeriod(customerId)
            ])
            setPeriods(periodsResponse.content)
            setTotalPages(periodsResponse.totalPages)
            setCurrentPeriod(current)
            setHasOpenPeriod(hasOpen)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNewPeriod = () => {
        if (hasOpenPeriod) {
            alert('Ya existe un período activo. Debe cerrar el período actual antes de crear uno nuevo.')
            return
        }
        router.push('/hr/period/form')
    }

    const handleEditPeriod = (period: PayrollPeriod) => {
        if (period.status !== 'OPEN') {
            alert('Solo se puede editar el período activo')
            return
        }
        router.push(`/hr/period/form?id=${period.id}`)
    }

    const handleDeleteClick = (period: PayrollPeriod) => {
        // Solo se puede eliminar el periodo activo
        if (period.status !== 'OPEN') {
            alert('Solo se puede eliminar el período activo')
            return
        }
        setPeriodToDelete(period)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (periodToDelete) {
            try {
                await payrollPeriodService.delete(periodToDelete.id, customerId)
                loadData()
            } catch (error: any) {
                alert(error.response?.data?.error || 'Error al eliminar el período')
            }
        }
        setDeleteDialogOpen(false)
        setPeriodToDelete(null)
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setPeriodToDelete(null)
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
            OPEN: 'Activo',
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

    const formatCurrency = (amount: number | undefined) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(amount || 0)
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Card del Período Actual */}
            <CurrentPeriodCard period={currentPeriod} />

            {/* Tabla de Períodos */}
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            📅 Historial de Periodos
                        </Typography>
                        <Tooltip title={hasOpenPeriod ? "Ya existe un período activo" : "Crear nuevo período"}>
                            <span>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleNewPeriod}
                                    disabled={hasOpenPeriod}
                                >
                                    Nuevo Periodo
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>

                    {hasOpenPeriod && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Hay un período activo. Debe cerrarlo antes de crear uno nuevo.
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : periods.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>
                                No hay periodos registrados
                            </Typography>
                            <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={handleNewPeriod}>
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
                                            <TableCell><strong>Fechas</strong></TableCell>
                                            <TableCell align="center"><strong>Empleados</strong></TableCell>
                                            <TableCell align="right"><strong>Total Nómina</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {periods.map((period) => (
                                            <TableRow
                                                key={period.id}
                                                hover
                                                onClick={() => router.push(`/hr/period/view?id=${period.id}`)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    ...(period.status === 'OPEN' ? {
                                                        bgcolor: 'success.light',
                                                        '&:hover': { bgcolor: 'success.main' }
                                                    } : {})
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {period.periodName}
                                                    </Typography>
                                                    {period.description && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {period.description}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getPeriodTypeLabel(period.periodType)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Pago: {formatDate(period.paymentDate)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        icon={<People />}
                                                        label={period.employeeCount || 0}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {formatCurrency(period.totalPayroll)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(period.status)}
                                                        color={getStatusColor(period.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {period.status === 'OPEN' ? (
                                                        <Stack direction="row" spacing={0} justifyContent="center">
                                                            <Tooltip title="Editar">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleEditPeriod(period)}
                                                                >
                                                                    <Edit />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Eliminar">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteClick(period)}
                                                                >
                                                                    <Delete />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            —
                                                        </Typography>
                                                    )}
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
                    ⚠️ Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas eliminar el período{' '}
                        <strong>{periodToDelete?.periodName}</strong>?
                        <br /><br />
                        Esta acción eliminará el período activo y no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
