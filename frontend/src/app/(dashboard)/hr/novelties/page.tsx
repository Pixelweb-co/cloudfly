'use client'

import { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material'
import {
    Add,
    Delete,
    Edit,
    Search,
    EventNote,
    Refresh
} from '@mui/icons-material'
import { noveltyService, PayrollNovelty } from '@/services/hr/noveltyService'
import { employeeService } from '@/services/hr/employeeService'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import { Employee, PayrollPeriod } from '@/types/hr'

const NOVELTY_TYPES = [
    { value: 'EXTRA_HOUR_DAY', label: 'Hora Extra Diurna' },
    { value: 'EXTRA_HOUR_NIGHT', label: 'Hora Extra Nocturna' },
    { value: 'EXTRA_HOUR_SUNDAY', label: 'Hora Extra Dominical/Festiva' },
    { value: 'BONUS_SALARY', label: 'Bonificación Salarial' },
    { value: 'BONUS_NON_SALARY', label: 'Bonificación No Salarial' },
    { value: 'COMMISSION', label: 'Comisiones' },
    { value: 'TRANSPORT_AID', label: 'Auxilio Transporte Extra' },
    { value: 'DEDUCTION_LOAN', label: 'Préstamo' },
    { value: 'DEDUCTION_OTHER', label: 'Otra Deducción' },
    { value: 'SICK_LEAVE', label: 'Incapacidad' },
    { value: 'LICENSE_MATERNITY', label: 'Licencia Maternidad' },
    { value: 'LICENSE_UNPAID', label: 'Licencia No Remunerada' }
]

export default function NoveltiesPage() {
    const [loading, setLoading] = useState(false)
    const [novelties, setNovelties] = useState<PayrollNovelty[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [openDialog, setOpenDialog] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [dialogError, setDialogError] = useState<string | null>(null)

    // Form data
    const [formData, setFormData] = useState<PayrollNovelty>({
        employeeId: 0,
        type: 'EXTRA_HOUR_DAY',
        description: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        quantity: 0,
        status: 'PENDING'
    })

    const customerId = 1 // TODO: Get from session

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [noveltiesRes, employeesRes, periodsRes] = await Promise.all([
                noveltyService.getAll(customerId),
                employeeService.getAll(customerId, 0, 1000, true),
                payrollPeriodService.getAll(customerId, 0, 100)
            ])
            setNovelties(noveltiesRes.content || [])
            setEmployees(employeesRes.content || [])
            setPeriods(periodsRes.content || [])
        } catch (err) {
            console.error(err)
            setError('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setFormData({
            employeeId: 0,
            type: 'EXTRA_HOUR_DAY',
            description: '',
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            quantity: 0,
            status: 'PENDING'
        })
        setDialogError(null)
        setOpenDialog(true)
    }

    const handleSubmit = async () => {
        if (!formData.employeeId || !formData.date || !formData.type) {
            setDialogError('Complete los campos obligatorios')
            return
        }

        try {
            await noveltyService.create(formData, customerId)
            setSuccess('Novedad registrada correctamente')
            setOpenDialog(false)
            setDialogError(null)
            loadData()
        } catch (err: any) {
            setDialogError(err.message || 'Error al guardar novedad')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar esta novedad?')) return
        try {
            await noveltyService.delete(id, customerId)
            setSuccess('Novedad eliminada')
            loadData()
        } catch (err: any) {
            setError(err.message || 'Error al eliminar')
        }
    }

    const getTypeLabel = (type: string) => {
        return NOVELTY_TYPES.find(t => t.value === type)?.label || type
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    📝 Novedades de Nómina
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreate}
                >
                    Registrar Novedad
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Empleado</TableCell>
                                    <TableCell>Período</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell align="right">Cantidad</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center"><CircularProgress /></TableCell>
                                    </TableRow>
                                ) : novelties.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">No hay novedades registradas</TableCell>
                                    </TableRow>
                                ) : (
                                    novelties.map((novelty) => (
                                        <TableRow key={novelty.id} hover>
                                            <TableCell>{novelty.date}</TableCell>
                                            <TableCell>{novelty.employeeName}</TableCell>
                                            <TableCell>
                                                {novelty.periodName ? (
                                                    <Chip label={novelty.periodName} size="small" variant="outlined" color="primary" />
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getTypeLabel(novelty.type)}
                                                    size="small"
                                                    color={novelty.type.includes('DEDUCTION') || novelty.type.includes('SICK') ? 'error' : 'success'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{novelty.description}</TableCell>
                                            <TableCell align="right">{novelty.quantity || '-'}</TableCell>
                                            <TableCell align="right">
                                                {novelty.amount ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(novelty.amount) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={novelty.status === 'PENDING' ? 'Pendiente' : 'Procesada'}
                                                    color={novelty.status === 'PENDING' ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {novelty.status === 'PENDING' && (
                                                    <IconButton color="error" size="small" onClick={() => handleDelete(novelty.id!)}>
                                                        <Delete />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Dialog Create */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar Nueva Novedad</DialogTitle>
                <DialogContent>
                    {dialogError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError(null)}>
                            {dialogError}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            select
                            label="Empleado"
                            fullWidth
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                        >
                            <MenuItem value={0} disabled>Seleccione un empleado</MenuItem>
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {emp.nationalId} - {emp.fullName}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Tipo de Novedad"
                            fullWidth
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {NOVELTY_TYPES.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Fecha"
                            type="date"
                            fullWidth
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        {/* Mostrar campos según tipo */}
                        {(formData.type.includes('HOUR') || formData.type.includes('DAYS') || formData.type.includes('LEAVE') || formData.type.includes('LICENSE')) && (
                            <TextField
                                label={formData.type.includes('HOUR') ? "Cantidad Horas" : "Cantidad Días"}
                                type="number"
                                fullWidth
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            />
                        )}

                        {(!formData.type.includes('LEAVE') && !formData.type.includes('LICENSE')) && (
                            <TextField
                                label="Valor ($)"
                                type="number"
                                fullWidth
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                helperText="Dejar en 0 si se calcula automáticamente por horas"
                            />
                        )}

                        <TextField
                            select
                            label="Asociar a Período (Opcional)"
                            fullWidth
                            value={formData.payrollPeriodId || ''}
                            onChange={(e) => setFormData({ ...formData, payrollPeriodId: e.target.value ? Number(e.target.value) : undefined })}
                        >
                            <MenuItem value=""><em>Ninguno (Automático por fecha)</em></MenuItem>
                            {periods.filter(p => p.status === 'OPEN').map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.periodName} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Descripción / Observación"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
