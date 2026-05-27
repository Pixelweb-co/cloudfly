'use client'

import { useState, useEffect } from 'react'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import { employeeService } from '@/services/hr/employeeService'
import { PayrollPeriod, Employee } from '@/types/hr'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Alert,
    Box,
    Typography,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip
} from '@mui/material'
import { PersonRemove } from '@mui/icons-material'

interface PeriodFormDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    period?: PayrollPeriod | null
}

export default function PeriodFormDialog({ open, onClose, onSuccess, period }: PeriodFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]) // Todos los empleados disponibles
    const [includedEmployees, setIncludedEmployees] = useState<Employee[]>([]) // Empleados incluidos en el período
    const [selectedToRemove, setSelectedToRemove] = useState<number[]>([]) // IDs seleccionados para eliminar
    const [searchFilter, setSearchFilter] = useState('') // Filtro de búsqueda
    const currentYear = new Date().getFullYear()
    const isEditMode = !!period

    const [formData, setFormData] = useState({
        periodType: 'BIWEEKLY',
        periodNumber: 1,
        year: currentYear,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentDate: '',
        description: ''
    })

    // Cargar empleados al abrir el diálogo
    useEffect(() => {
        if (open) {
            loadEmployees()
        }
    }, [open])

    useEffect(() => {
        if (period) {
            setFormData({
                periodType: period.periodType || 'BIWEEKLY',
                periodNumber: period.periodNumber || 1,
                year: period.year || currentYear,
                startDate: period.startDate ? period.startDate.toString().split('T')[0] : '',
                endDate: period.endDate ? period.endDate.toString().split('T')[0] : '',
                paymentDate: period.paymentDate ? period.paymentDate.toString().split('T')[0] : '',
                description: period.description || ''
            })
            // En modo edición, cargar los empleados que ya están en el período
            if (period.employeeIds && period.employeeIds.length > 0) {
                const included = allEmployees.filter(e => period.employeeIds?.includes(e.id))
                setIncludedEmployees(included)
            }
        } else {
            setFormData({
                periodType: 'BIWEEKLY',
                periodNumber: 1,
                year: currentYear,
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                paymentDate: '',
                description: ''
            })
            // En modo crear, incluir TODOS los empleados activos
            setIncludedEmployees([...allEmployees])
        }
        setSelectedToRemove([])
        setError(null)
    }, [period, open, currentYear, allEmployees])

    const loadEmployees = async () => {
        try {
            const response = await employeeService.getAll(1, 0, 1000, true)
            const activeEmployees = response.content || []
            setAllEmployees(activeEmployees)
            // Si no es modo edición, incluir todos por defecto
            if (!period) {
                setIncludedEmployees(activeEmployees)
            }
        } catch (err) {
            console.error('Error loading employees:', err)
            setError('Error al cargar empleados')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleToggleSelect = (employeeId: number) => {
        setSelectedToRemove(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        )
    }

    const handleSelectAll = () => {
        if (selectedToRemove.length === includedEmployees.length) {
            setSelectedToRemove([])
        } else {
            setSelectedToRemove(includedEmployees.map(e => e.id))
        }
    }

    const handleRemoveSelected = () => {
        // Quitar los seleccionados de la lista de incluidos
        setIncludedEmployees(prev => prev.filter(e => !selectedToRemove.includes(e.id)))
        setSelectedToRemove([])
    }

    // Filtrar empleados en la tabla por búsqueda
    const filteredEmployees = includedEmployees.filter(emp => {
        if (searchFilter.length < 4) return true // Mostrar todos si menos de 4 caracteres
        const search = searchFilter.toLowerCase()
        return (
            emp.nationalId?.toLowerCase().includes(search) ||
            emp.fullName?.toLowerCase().includes(search) ||
            emp.phone?.toLowerCase().includes(search)
        )
    })

    // ============ CONFIGURACIÓN DE NÓMINA (valores por defecto Colombia 2025) ============
    // TODO: En producción, cargar desde payrollConfigService.getConfig(customerId)
    const config = {
        minimumWage: 1423500,
        transportAllowance: 200000,
        healthPercentageEmployee: 4,
        pensionPercentageEmployee: 4,
        healthPercentageEmployer: 8.5,
        pensionPercentageEmployer: 12,
        parafiscalCajaPercentage: 4,
        parafiscalSenaPercentage: 2,
        parafiscalIcbfPercentage: 3,
        primaPercentage: 8.33,
        cesantiasPercentage: 8.33,
        interesesCesantiasPercentage: 12, // anual
        vacacionesPercentage: 4.17
    }

    // Mapeo de niveles de riesgo ARL a porcentajes
    const ARL_PERCENTAGES: Record<string, number> = {
        'RIESGO_I': 0.522,
        'RIESGO_II': 1.044,
        'RIESGO_III': 2.436,
        'RIESGO_IV': 4.350,
        'RIESGO_V': 6.960
    }

    // Calcular días del período basado en fechas
    const calculatePeriodDays = () => {
        if (!formData.startDate || !formData.endDate) return 30 // Default
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos días
        return diffDays
    }

    const periodDays = calculatePeriodDays()
    const DAYS_IN_MONTH = 30 // Base de cálculo mensual

    // Calcular desglose de nómina para un empleado según los días del período
    const calculatePayroll = (emp: Employee) => {
        const salarioMensual = emp.baseSalary || 0
        const diasTrabajados = emp.monthlyWorkedDays || periodDays

        // Calcular salario proporcional al período
        const factorPeriodo = periodDays / DAYS_IN_MONTH
        const salarioPeriodo = salarioMensual * factorPeriodo

        // Auxilio de transporte (aplica si gana <= 2 SMMLV)
        const aplicaAuxTransporte = (emp.hasTransportAllowance !== false) && (salarioMensual <= config.minimumWage * 2)
        const auxilioTransporte = aplicaAuxTransporte ? (config.transportAllowance * factorPeriodo) : 0

        // Base de cálculo para seguridad social
        const baseCalculo = salarioPeriodo

        // ====== DEDUCCIONES DEL EMPLEADO ======
        const saludEmpleado = baseCalculo * (config.healthPercentageEmployee / 100)
        const pensionEmpleado = baseCalculo * (config.pensionPercentageEmployee / 100)
        const totalDeducciones = saludEmpleado + pensionEmpleado

        // ====== NETO A PAGAR ======
        const netoPagar = salarioPeriodo + auxilioTransporte - totalDeducciones

        // ====== APORTES DEL EMPLEADOR ======
        const saludEmpleador = baseCalculo * (config.healthPercentageEmployer / 100)
        const pensionEmpleador = baseCalculo * (config.pensionPercentageEmployer / 100)

        // ARL según nivel de riesgo del empleado
        const arlRiskLevel = emp.arlRiskLevel || 'RIESGO_I'
        const arlPercentage = ARL_PERCENTAGES[arlRiskLevel] || 0.522
        const arl = baseCalculo * (arlPercentage / 100)

        // Parafiscales
        const cajaCompensacion = baseCalculo * (config.parafiscalCajaPercentage / 100)
        const icbf = baseCalculo * (config.parafiscalIcbfPercentage / 100)
        const sena = baseCalculo * (config.parafiscalSenaPercentage / 100)
        const totalAportesEmpleador = saludEmpleador + pensionEmpleador + arl + cajaCompensacion + icbf + sena

        // ====== PROVISIONES (calculadas sobre salario + aux transporte) ======
        const baseProvisiones = salarioPeriodo + auxilioTransporte
        const prima = baseProvisiones * (config.primaPercentage / 100)
        const cesantias = baseProvisiones * (config.cesantiasPercentage / 100)
        const interesesCesantias = cesantias * (config.interesesCesantiasPercentage / 100 / 12) // Mensualizado
        const vacaciones = salarioPeriodo * (config.vacacionesPercentage / 100)
        const totalProvisiones = prima + cesantias + interesesCesantias + vacaciones

        // ====== COSTO TOTAL PARA LA EMPRESA ======
        const costoTotal = salarioPeriodo + auxilioTransporte + totalAportesEmpleador + totalProvisiones

        return {
            // Info del período
            diasPeriodo: periodDays,
            factorPeriodo,
            // Salario
            salarioMensual,
            salarioPeriodo,
            auxilioTransporte,
            aplicaAuxTransporte,
            // Deducciones empleado
            saludEmpleado,
            pensionEmpleado,
            totalDeducciones,
            // Neto
            netoPagar,
            // Aportes empleador
            saludEmpleador,
            pensionEmpleador,
            arl,
            arlRiskLevel,
            arlPercentage,
            cajaCompensacion,
            icbf,
            sena,
            totalAportesEmpleador,
            // Provisiones
            prima,
            cesantias,
            interesesCesantias,
            vacaciones,
            totalProvisiones,
            // Total
            costoTotal
        }
    }

    // Calcular totales del período
    const calculatePeriodTotals = () => {
        let totalSalarios = 0
        let totalAuxTransporte = 0
        let totalDeducciones = 0
        let totalNeto = 0
        let totalAportesEmpleador = 0
        let totalProvisiones = 0
        let costoTotalPeriodo = 0

        includedEmployees.forEach(emp => {
            const payroll = calculatePayroll(emp)
            totalSalarios += payroll.salarioPeriodo
            totalAuxTransporte += payroll.auxilioTransporte
            totalDeducciones += payroll.totalDeducciones
            totalNeto += payroll.netoPagar
            totalAportesEmpleador += payroll.totalAportesEmpleador
            totalProvisiones += payroll.totalProvisiones
            costoTotalPeriodo += payroll.costoTotal
        })

        return {
            totalSalarios,
            totalAuxTransporte,
            totalDeducciones,
            totalNeto,
            totalAportesEmpleador,
            totalProvisiones,
            costoTotalPeriodo,
            diasPeriodo: periodDays
        }
    }

    const periodTotals = calculatePeriodTotals()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const periodData = {
                ...formData,
                periodType: formData.periodType as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
                periodNumber: parseInt(formData.periodNumber.toString()),
                year: parseInt(formData.year.toString()),
                status: 'OPEN' as const,
                employeeIds: includedEmployees.map(e => e.id)
            }

            if (isEditMode && period) {
                await payrollPeriodService.update(period.id, periodData, 1)
            } else {
                await payrollPeriodService.create(periodData, 1)
            }

            onSuccess()
            handleClose()
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar periodo'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            periodType: 'BIWEEKLY',
            periodNumber: 1,
            year: currentYear,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            paymentDate: '',
            description: ''
        })
        setIncludedEmployees([])
        setSelectedToRemove([])
        setError(null)
        onClose()
    }

    const isAllSelected = includedEmployees.length > 0 && selectedToRemove.length === includedEmployees.length

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                    {isEditMode ? '✏️ Editar Periodo' : '📅 Nuevo Periodo de Nómina'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        {/* Datos del Período */}
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Periodo"
                                name="periodType"
                                value={formData.periodType}
                                onChange={handleChange}
                                required
                                size="small"
                            >
                                <MenuItem value="WEEKLY">Semanal</MenuItem>
                                <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                                <MenuItem value="MONTHLY">Mensual</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                            <TextField
                                fullWidth
                                label="Número"
                                name="periodNumber"
                                type="number"
                                value={formData.periodNumber}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 1, max: 24 }}
                            />
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                            <TextField
                                fullWidth
                                label="Año"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 2020, max: 2030 }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={5}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ej: Quincena 1 - Enero 2025"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Fecha Inicio"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Fecha Fin"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Fecha de Pago"
                                name="paymentDate"
                                type="date"
                                value={formData.paymentDate}
                                onChange={handleChange}
                                required
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Sección de Empleados */}
                        <Grid item xs={12}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 2,
                                mb: 1
                            }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    👥 Empleados Incluidos en el Período
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    {selectedToRemove.length > 0 && (
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            startIcon={<PersonRemove />}
                                            onClick={handleRemoveSelected}
                                        >
                                            Eliminar {selectedToRemove.length} Seleccionado{selectedToRemove.length > 1 ? 's' : ''}
                                        </Button>
                                    )}
                                    <Chip
                                        label={`${includedEmployees.length} empleados`}
                                        color="primary"
                                        size="small"
                                    />
                                    <Chip
                                        label={`${periodTotals.diasPeriodo} días`}
                                        color="info"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Neto: ${formatCurrency(periodTotals.totalNeto)}`}
                                        color="success"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Costo: ${formatCurrency(periodTotals.costoTotalPeriodo)}`}
                                        color="secondary"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Grid>

                        {/* Filtro de búsqueda en la tabla */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Buscar por identificación, nombre o teléfono... (mín. 4 caracteres)"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                            🔍
                                        </Box>
                                    ),
                                }}
                                helperText={searchFilter.length > 0 && searchFilter.length < 4
                                    ? `Escribe ${4 - searchFilter.length} caracteres más...`
                                    : searchFilter.length >= 4
                                        ? `${filteredEmployees.length} empleados encontrados`
                                        : ''
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{ maxHeight: 300 }}
                            >
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" sx={{ bgcolor: 'primary.main' }}>
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    indeterminate={selectedToRemove.length > 0 && selectedToRemove.length < includedEmployees.length}
                                                    onChange={handleSelectAll}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                                                Identificación
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                                                Nombre Completo
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                                                Departamento
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                                                Puesto
                                            </TableCell>
                                            <TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                                                Salario Base
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredEmployees.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        {searchFilter.length >= 4
                                                            ? 'No se encontraron empleados con ese criterio'
                                                            : 'No hay empleados incluidos en el período'
                                                        }
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEmployees.map((emp) => {
                                                const isSelected = selectedToRemove.includes(emp.id)
                                                return (
                                                    <TableRow
                                                        key={emp.id}
                                                        hover
                                                        onClick={() => handleToggleSelect(emp.id)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            bgcolor: isSelected ? 'error.light' : 'inherit',
                                                            '&:hover': {
                                                                bgcolor: isSelected ? 'error.main' : 'action.hover'
                                                            }
                                                        }}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={() => handleToggleSelect(emp.id)}
                                                                color="error"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {emp.nationalId || '—'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="medium"
                                                                sx={{ textDecoration: isSelected ? 'line-through' : 'none' }}
                                                            >
                                                                {emp.fullName}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {emp.department || '—'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {emp.jobTitle || '—'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="medium"
                                                                color={isSelected ? 'error.dark' : 'text.primary'}
                                                                sx={{ textDecoration: isSelected ? 'line-through' : 'none' }}
                                                            >
                                                                {formatCurrency(emp.baseSalary || 0)}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        {/* Resumen de Nómina */}
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    📊 Resumen de Nómina del Período
                                </Typography>

                                <Grid container spacing={2}>
                                    {/* Columna 1: Devengados */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'success.light' }}>
                                            <Typography variant="caption" color="white" fontWeight="bold">
                                                💰 DEVENGADOS
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="white">Salarios Base:</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="white">Aux. Transporte:</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalAuxTransporte)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.5)' }}>
                                                    <Typography variant="body2" color="white" fontWeight="bold">Total Devengado:</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios + periodTotals.totalAuxTransporte)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Columna 2: Deducciones */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light' }}>
                                            <Typography variant="caption" color="white" fontWeight="bold">
                                                📤 DEDUCCIONES (Empleado)
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="white">Salud (4%):</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.04)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="white">Pensión (4%):</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.04)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.5)' }}>
                                                    <Typography variant="body2" color="white" fontWeight="bold">Total Deducciones:</Typography>
                                                    <Typography variant="body2" color="white" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalDeducciones)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Columna 3: Neto */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'primary.main' }}>
                                            <Typography variant="caption" color="white" fontWeight="bold">
                                                💵 NETO A PAGAR
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="h4" color="white" fontWeight="bold" textAlign="center">
                                                    {formatCurrency(periodTotals.totalNeto)}
                                                </Typography>
                                                <Typography variant="caption" color="rgba(255,255,255,0.8)" textAlign="center" display="block">
                                                    {includedEmployees.length} empleados
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Fila 2: Aportes del empleador */}
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'warning.light' }}>
                                            <Typography variant="caption" fontWeight="bold">
                                                🏢 APORTES EMPLEADOR
                                            </Typography>
                                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">Salud (8.5%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.085)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">Pensión (12%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.12)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">ARL (0.52%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.00522)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">Caja Comp. (4%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.04)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">ICBF (3%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.03)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption">SENA (2%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.02)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.2)' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Total: {formatCurrency(periodTotals.totalAportesEmpleador)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Provisiones */}
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light' }}>
                                            <Typography variant="caption" color="white" fontWeight="bold">
                                                📅 PROVISIONES MENSUALES
                                            </Typography>
                                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="white">Prima (8.33%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="white">
                                                        {formatCurrency((periodTotals.totalSalarios + periodTotals.totalAuxTransporte) * 0.0833)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="white">Cesantías (8.33%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="white">
                                                        {formatCurrency((periodTotals.totalSalarios + periodTotals.totalAuxTransporte) * 0.0833)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="white">Int. Cesantías (1%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="white">
                                                        {formatCurrency((periodTotals.totalSalarios + periodTotals.totalAuxTransporte) * 0.0833 * 0.01)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="white">Vacaciones (4.17%)</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="white">
                                                        {formatCurrency(periodTotals.totalSalarios * 0.0417)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.5)' }}>
                                                <Typography variant="body2" fontWeight="bold" color="white">
                                                    Total: {formatCurrency(periodTotals.totalProvisiones)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Costo Total */}
                                    <Grid item xs={12}>
                                        <Paper elevation={3} sx={{ p: 2, bgcolor: 'secondary.main', textAlign: 'center' }}>
                                            <Typography variant="caption" color="white" fontWeight="bold">
                                                💼 COSTO TOTAL DEL PERÍODO PARA LA EMPRESA
                                            </Typography>
                                            <Typography variant="h3" color="white" fontWeight="bold">
                                                {formatCurrency(periodTotals.costoTotalPeriodo)}
                                            </Typography>
                                            <Typography variant="caption" color="rgba(255,255,255,0.8)">
                                                Incluye: Nómina + Aportes Empleador + Provisiones
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Button onClick={handleClose} disabled={loading} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || includedEmployees.length === 0}
                        size="large"
                    >
                        {loading ? 'Guardando...' : isEditMode ? '💾 Actualizar Periodo' : '💾 Crear Periodo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
