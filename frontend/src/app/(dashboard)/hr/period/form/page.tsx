'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import { employeeService } from '@/services/hr/employeeService'
import { payrollConfigService } from '@/services/hr/payrollConfigService'
import { PayrollPeriod, Employee } from '@/types/hr'
import {
    Card,
    CardHeader,
    CardContent,
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
    Chip,
    Divider,
    CircularProgress
} from '@mui/material'
import {
    PersonRemove,
    Save,
    ArrowBack,
    CalendarMonth,
    People,
    AttachMoney
} from '@mui/icons-material'

export default function PeriodFormPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const periodId = searchParams.get('id')

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [period, setPeriod] = useState<PayrollPeriod | null>(null)
    const [allEmployees, setAllEmployees] = useState<Employee[]>([])
    const [includedEmployees, setIncludedEmployees] = useState<Employee[]>([])
    const [selectedToRemove, setSelectedToRemove] = useState<number[]>([])
    const [searchFilter, setSearchFilter] = useState('')
    const currentYear = new Date().getFullYear()
    const isEditMode = !!periodId

    const [formData, setFormData] = useState({
        periodType: 'BIWEEKLY',
        periodNumber: 1,
        year: currentYear,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentDate: '',
        description: ''
    })

    const [payrollConfig, setPayrollConfig] = useState<any>(null)

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData()
    }, [periodId])

    const loadInitialData = async () => {
        setLoadingData(true)
        try {
            // Cargar configuración de nómina (opcional)
            try {
                const configData = await payrollConfigService.getConfig(1)
                setPayrollConfig(configData)
            } catch (configErr) {
                console.warn('Config not found, using defaults')
            }

            // Cargar empleados
            const empResponse = await employeeService.getAll(1, 0, 1000, true)
            const activeEmployees = empResponse.content || []
            setAllEmployees(activeEmployees)

            // Si es modo edición, cargar el período
            if (periodId) {
                const periodData = await payrollPeriodService.getById(parseInt(periodId), 1)
                setPeriod(periodData)
                setFormData({
                    periodType: periodData.periodType || 'BIWEEKLY',
                    periodNumber: periodData.periodNumber || 1,
                    year: periodData.year || currentYear,
                    startDate: periodData.startDate ? periodData.startDate.toString().split('T')[0] : '',
                    endDate: periodData.endDate ? periodData.endDate.toString().split('T')[0] : '',
                    paymentDate: periodData.paymentDate ? periodData.paymentDate.toString().split('T')[0] : '',
                    description: periodData.description || ''
                })
                // Cargar empleados del período
                if (periodData.employeeIds && periodData.employeeIds.length > 0) {
                    const included = activeEmployees.filter(e => periodData.employeeIds?.includes(e.id))
                    setIncludedEmployees(included)
                }
            } else {
                // Modo crear: incluir todos los empleados
                setIncludedEmployees(activeEmployees)

                // Calcular el siguiente número de período
                const nextNumber = await calculateNextPeriodNumber(formData.periodType, formData.year)
                setFormData(prev => ({ ...prev, periodNumber: nextNumber }))
            }
        } catch (err) {
            console.error('Error loading data:', err)
            setError('Error al cargar datos. Verifique la configuración de nómina.')
        } finally {
            setLoadingData(false)
        }
    }

    const calculateNextPeriodNumber = async (periodType: string, year: number) => {
        try {
            const response = await payrollPeriodService.getAll(1, 0, 1000)
            const periods = response.content || []
            const samePeriods = periods.filter(
                (p: any) => p.periodType === periodType && p.year === year
            )
            const maxNumber = samePeriods.length > 0
                ? Math.max(...samePeriods.map((p: any) => p.periodNumber || 0))
                : 0
            return maxNumber + 1
        } catch (err) {
            console.error('Error calculating period number:', err)
            return 1
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })

        // Auto-calcular número de período cuando cambia tipo o año (solo en modo crear)
        if ((name === 'periodType' || name === 'year') && !periodId) {
            const newPeriodType = name === 'periodType' ? value : formData.periodType
            const newYear = name === 'year' ? parseInt(value) : formData.year
            const nextNumber = await calculateNextPeriodNumber(newPeriodType, newYear)
            setFormData(prev => ({ ...prev, [name]: value, periodNumber: nextNumber }))
        }
    }

    const handleToggleSelect = (employeeId: number) => {
        setSelectedToRemove(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        )
    }

    const handleSelectAll = () => {
        if (selectedToRemove.length === filteredEmployees.length) {
            setSelectedToRemove([])
        } else {
            setSelectedToRemove(filteredEmployees.map(e => e.id))
        }
    }

    const handleRemoveSelected = () => {
        setIncludedEmployees(prev => prev.filter(e => !selectedToRemove.includes(e.id)))
        setSelectedToRemove([])
    }

    // Filtrar empleados en la tabla
    const filteredEmployees = includedEmployees.filter(emp => {
        if (searchFilter.length < 3) return true
        const search = searchFilter.toLowerCase()
        return (
            emp.nationalId?.toLowerCase().includes(search) ||
            emp.fullName?.toLowerCase().includes(search) ||
            emp.phone?.toLowerCase().includes(search)
        )
    })

    const ARL_PERCENTAGES: Record<string, number> = {
        'RIESGO_I': 0.522,
        'RIESGO_II': 1.044,
        'RIESGO_III': 2.436,
        'RIESGO_IV': 4.350,
        'RIESGO_V': 6.960
    }

    // Calcular días del período
    const calculatePeriodDays = () => {
        if (!formData.startDate || !formData.endDate) return 30
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    const periodDays = calculatePeriodDays()
    const DAYS_IN_MONTH = 30

    // Calcular nómina de un empleado
    const calculatePayroll = (emp: Employee) => {
        if (!payrollConfig) return {
            salarioMensual: 0,
            salarioPeriodo: 0,
            auxilioTransporte: 0,
            totalDeducciones: 0,
            netoPagar: 0,
            totalAportesEmpleador: 0,
            totalProvisiones: 0,
            costoTotal: 0
        }

        const salarioMensual = emp.baseSalary || 0
        const factorPeriodo = periodDays / DAYS_IN_MONTH
        const salarioPeriodo = salarioMensual * factorPeriodo

        const aplicaAuxTransporte = (emp.hasTransportAllowance !== false) && (salarioMensual <= payrollConfig.minimumWage * 2)
        const auxilioTransporte = aplicaAuxTransporte ? (payrollConfig.transportAllowance * factorPeriodo) : 0

        const baseCalculo = salarioPeriodo

        // Deducciones empleado
        const saludEmpleado = baseCalculo * (payrollConfig.healthPercentageEmployee / 100)
        const pensionEmpleado = baseCalculo * (payrollConfig.pensionPercentageEmployee / 100)
        const totalDeducciones = saludEmpleado + pensionEmpleado

        // Neto a pagar
        const netoPagar = salarioPeriodo + auxilioTransporte - totalDeducciones

        // Aportes empleador
        const saludEmpleador = baseCalculo * (payrollConfig.healthPercentageEmployer / 100)
        const pensionEmpleador = baseCalculo * (payrollConfig.pensionPercentageEmployer / 100)
        const arlRiskLevel = emp.arlRiskLevel || 'RIESGO_I'
        const arlPercentage = ARL_PERCENTAGES[arlRiskLevel] || 0.522 // TODO: Traer ARL de config también si es posible, o dejar mapa
        const arl = baseCalculo * (arlPercentage / 100)
        const cajaCompensacion = baseCalculo * (payrollConfig.parafiscalCajaPercentage / 100)
        const icbf = baseCalculo * (payrollConfig.parafiscalIcbfPercentage / 100)
        const sena = baseCalculo * (payrollConfig.parafiscalSenaPercentage / 100)
        const totalAportesEmpleador = saludEmpleador + pensionEmpleador + arl + cajaCompensacion + icbf + sena

        // Provisiones
        const baseProvisiones = salarioPeriodo + auxilioTransporte
        const prima = baseProvisiones * (payrollConfig.primaPercentage / 100)
        const cesantias = baseProvisiones * (payrollConfig.cesantiasPercentage / 100)
        const interesesCesantias = cesantias * (payrollConfig.interesesCesantiasPercentage / 100 / 12)
        const vacaciones = salarioPeriodo * (payrollConfig.vacacionesPercentage / 100)
        const totalProvisiones = prima + cesantias + interesesCesantias + vacaciones

        // Costo total
        const costoTotal = salarioPeriodo + auxilioTransporte + totalAportesEmpleador + totalProvisiones

        return {
            salarioMensual,
            salarioPeriodo,
            auxilioTransporte,
            totalDeducciones,
            netoPagar,
            totalAportesEmpleador,
            totalProvisiones,
            costoTotal
        }
    }

    // Calcular totales del período
    const calculatePeriodTotals = () => {
        let totalSalarios = 0
        let totalAuxTransporte = 0
        let totalDeducciones = 0
        let totalNeto = 0

        // Totales Aportes Empleador
        let totalSaludEmpleador = 0
        let totalPensionEmpleador = 0
        let totalArl = 0
        let totalParafiscales = 0 // Caja + ICBF + SENA
        let totalAportesEmpleador = 0

        // Totales Provisiones
        let totalPrima = 0
        let totalCesantias = 0
        let totalInteresesCesantias = 0
        let totalVacaciones = 0
        let totalProvisiones = 0

        let costoTotalPeriodo = 0

        includedEmployees.forEach(emp => {
            const payroll = calculatePayroll(emp)
            totalSalarios += payroll.salarioPeriodo
            totalAuxTransporte += payroll.auxilioTransporte
            totalDeducciones += payroll.totalDeducciones
            totalNeto += payroll.netoPagar

            // Aportes detalle
            if (payrollConfig) {
                totalSaludEmpleador += (payroll.salarioPeriodo * (payrollConfig.healthPercentageEmployer / 100))
                totalPensionEmpleador += (payroll.salarioPeriodo * (payrollConfig.pensionPercentageEmployer / 100))

                const arlRisk = emp.arlRiskLevel || 'RIESGO_I'
                const arlPct = ARL_PERCENTAGES[arlRisk] || 0.522
                totalArl += (payroll.salarioPeriodo * (arlPct / 100))

                const caja = payroll.salarioPeriodo * (payrollConfig.parafiscalCajaPercentage / 100)
                const icbf = payroll.salarioPeriodo * (payrollConfig.parafiscalIcbfPercentage / 100)
                const sena = payroll.salarioPeriodo * (payrollConfig.parafiscalSenaPercentage / 100)
                totalParafiscales += (caja + icbf + sena)
            }

            totalAportesEmpleador += payroll.totalAportesEmpleador

            // Provisiones detalle
            if (payrollConfig) {
                const baseProv = payroll.salarioPeriodo + payroll.auxilioTransporte
                totalPrima += (baseProv * (payrollConfig.primaPercentage / 100))
                totalCesantias += (baseProv * (payrollConfig.cesantiasPercentage / 100))

                const cesantiasCalc = baseProv * (payrollConfig.cesantiasPercentage / 100)
                totalInteresesCesantias += (cesantiasCalc * (payrollConfig.interesesCesantiasPercentage / 100 / 12))
                totalVacaciones += (payroll.salarioPeriodo * (payrollConfig.vacacionesPercentage / 100))
            }

            totalProvisiones += payroll.totalProvisiones
            costoTotalPeriodo += payroll.costoTotal
        })

        return {
            totalSalarios,
            totalAuxTransporte,
            totalDeducciones,
            totalNeto,
            totalSaludEmpleador,
            totalPensionEmpleador,
            totalArl,
            totalParafiscales,
            totalAportesEmpleador,
            totalPrima,
            totalCesantias,
            totalInteresesCesantias,
            totalVacaciones,
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
            const periodData: Omit<PayrollPeriod, 'id' | 'periodName' | 'workingDays'> = {
                periodType: formData.periodType as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
                periodNumber: formData.periodNumber,
                year: formData.year,
                startDate: formData.startDate,
                endDate: formData.endDate,
                paymentDate: formData.paymentDate,
                description: formData.description,
                employeeIds: includedEmployees.map(e => e.id),
                status: 'OPEN'
            }

            if (isEditMode && periodId) {
                await payrollPeriodService.update(parseInt(periodId), periodData as Partial<PayrollPeriod>, 1)
                setSuccess('Período actualizado exitosamente')
            } else {
                await payrollPeriodService.create(periodData, 1)
                setSuccess('Período creado exitosamente')
            }

            setTimeout(() => {
                router.push('/hr/periods')
            }, 1500)
        } catch (err: any) {
            setError(err.message || 'Error al guardar el período')
        } finally {
            setLoading(false)
        }
    }

    if (loadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => router.push('/hr/periods')}
                        >
                            Volver
                        </Button>
                        <Typography variant="h4" fontWeight="bold">
                            {isEditMode ? '✏️ Editar Período de Nómina' : '📅 Nuevo Período de Nómina'}
                        </Typography>
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        disabled={loading || includedEmployees.length === 0}
                    >
                        {loading ? 'Guardando...' : 'Guardar Período'}
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <Grid container spacing={3}>
                    {/* Datos del Período */}
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader
                                avatar={<CalendarMonth color="primary" />}
                                title={<Typography variant="h6">Datos del Período</Typography>}
                            />
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Tipo de Periodo"
                                            name="periodType"
                                            value={formData.periodType}
                                            onChange={handleChange}
                                            required
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
                                            disabled={!periodId}
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
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={5}>
                                        <TextField
                                            fullWidth
                                            label="Descripción"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Ej: Nómina Quincenal Enero 2025"
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
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Empleados */}
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader
                                avatar={<People color="primary" />}
                                title={<Typography variant="h6">Empleados del Período</Typography>}
                                action={
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        {selectedToRemove.length > 0 && (
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                startIcon={<PersonRemove />}
                                                onClick={handleRemoveSelected}
                                            >
                                                Eliminar {selectedToRemove.length}
                                            </Button>
                                        )}
                                        <Chip label={`${includedEmployees.length} empleados`} color="primary" />
                                        <Chip label={`${periodDays} días`} color="info" />
                                    </Box>
                                }
                            />
                            <CardContent>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Buscar empleado por identificación, nombre o teléfono..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={selectedToRemove.length > 0 && selectedToRemove.length < filteredEmployees.length}
                                                        checked={filteredEmployees.length > 0 && selectedToRemove.length === filteredEmployees.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                </TableCell>
                                                <TableCell>Identificación</TableCell>
                                                <TableCell>Nombre</TableCell>
                                                <TableCell>Cargo</TableCell>
                                                <TableCell align="right">Salario Mensual</TableCell>
                                                <TableCell align="right">Salario Período</TableCell>
                                                <TableCell align="right">Neto</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredEmployees.map(emp => {
                                                const payroll = calculatePayroll(emp)
                                                return (
                                                    <TableRow
                                                        key={emp.id}
                                                        hover
                                                        selected={selectedToRemove.includes(emp.id)}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={selectedToRemove.includes(emp.id)}
                                                                onChange={() => handleToggleSelect(emp.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{emp.nationalId}</TableCell>
                                                        <TableCell>{emp.fullName}</TableCell>
                                                        <TableCell>{emp.jobTitle}</TableCell>
                                                        <TableCell align="right">{formatCurrency(emp.baseSalary)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(payroll.salarioPeriodo)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                            {formatCurrency(payroll.netoPagar)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Resumen de Nómina */}
                    <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'grey.50' }}>
                            <CardHeader
                                avatar={<AttachMoney color="success" />}
                                title={<Typography variant="h6">📊 Resumen de Nómina del Período ({periodDays} días)</Typography>}
                            />
                            <CardContent>
                                <Grid container spacing={2}>
                                    {/* Devengados */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                                                💰 DEVENGADOS
                                            </Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Salarios:</Typography>
                                                <Typography variant="body2" fontWeight="bold">{formatCurrency(periodTotals.totalSalarios)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Aux. Transporte:</Typography>
                                                <Typography variant="body2" fontWeight="bold">{formatCurrency(periodTotals.totalAuxTransporte)}</Typography>
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">Total Devengado:</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                    {formatCurrency(periodTotals.totalSalarios + periodTotals.totalAuxTransporte)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Deducciones */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'error.light' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="error.dark">
                                                📤 DEDUCCIONES EMPLEADO
                                            </Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Salud (4%):</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {formatCurrency(periodTotals.totalSalarios * 0.04)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Pensión (4%):</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {formatCurrency(periodTotals.totalSalarios * 0.04)}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">Total Deducciones:</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="error.dark">
                                                    {formatCurrency(periodTotals.totalDeducciones)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Neto */}
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                💵 NETO A PAGAR
                                            </Typography>
                                            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.3)' }} />
                                            <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ my: 2 }}>
                                                {formatCurrency(periodTotals.totalNeto)}
                                            </Typography>
                                            <Typography variant="caption" textAlign="center" display="block">
                                                Total a pagar a {includedEmployees.length} empleados
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    {/* Aportes Empleador */}
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'warning.light' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
                                                🏢 APORTES DEL EMPLEADOR
                                            </Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">Salud (8.5%)</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalSaludEmpleador)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">Pensión (12%)</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalPensionEmpleador)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">ARL + Parafiscales</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalArl + periodTotals.totalParafiscales)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">Total Aportes:</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="warning.dark">
                                                    {formatCurrency(periodTotals.totalAportesEmpleador)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Provisiones */}
                                    <Grid item xs={12} md={6}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'info.light' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
                                                📅 PROVISIONES
                                            </Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">Prima (8.33%)</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalPrima)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">Cesantías (8.33%)</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalCesantias)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">Int. Cesantías + Vacaciones</Typography>
                                                </Grid>
                                                <Grid item xs={6} textAlign="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatCurrency(periodTotals.totalInteresesCesantias + periodTotals.totalVacaciones)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">Total Provisiones:</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="info.dark">
                                                    {formatCurrency(periodTotals.totalProvisiones)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Costo Total */}
                                    <Grid item xs={12}>
                                        <Paper elevation={3} sx={{ p: 3, bgcolor: 'secondary.main', color: 'white', textAlign: 'center' }}>
                                            <Typography variant="h6" fontWeight="bold">
                                                💼 COSTO TOTAL DEL PERÍODO PARA LA EMPRESA
                                            </Typography>
                                            <Typography variant="h3" fontWeight="bold" sx={{ my: 2 }}>
                                                {formatCurrency(periodTotals.costoTotalPeriodo)}
                                            </Typography>
                                            <Typography variant="body2">
                                                Incluye: Salarios + Aux. Transporte + Aportes Empleador + Provisiones
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </form>
        </Box>
    )
}
