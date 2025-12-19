'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { employeeService } from '@/services/hr/employeeService'
import { Employee } from '@/types/hr'
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
    Divider,
    Typography,
    Switch,
    FormControlLabel,
    Box
} from '@mui/material'

interface EmployeeFormDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    employee?: Employee | null // Optional employee for edit mode
}

// Opciones de EPS en Colombia
const EPS_OPTIONS = [
    'Sura EPS',
    'Nueva EPS',
    'Sanitas',
    'Compensar',
    'Famisanar',
    'Salud Total',
    'Coomeva',
    'Coosalud',
    'Mutual Ser',
    'Otra'
]

// Opciones de Fondos de Pensiones
const AFP_OPTIONS = [
    'Porvenir',
    'Protección',
    'Colfondos',
    'Old Mutual',
    'Colpensiones',
    'Otra'
]

// Opciones de ARL
const ARL_OPTIONS = [
    'Sura ARL',
    'Positiva',
    'Colmena',
    'Bolívar',
    'Liberty',
    'Equidad',
    'Otra'
]

// Opciones de Cajas de Cesantías
const CESANTIAS_OPTIONS = [
    'Porvenir',
    'Protección',
    'Colfondos',
    'FNA',
    'Otra'
]

export default function EmployeeFormDialog({ open, onClose, onSuccess, employee }: EmployeeFormDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getInitialFormData = () => ({
        // Datos Personales
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationalId: '',
        rfc: '',
        curp: '',

        // Datos Laborales
        jobTitle: '',
        department: '',
        hireDate: new Date().toISOString().split('T')[0],
        contractTypeEnum: 'INDEFINIDO',

        // Datos de Nómina
        baseSalary: '',
        paymentFrequency: 'BIWEEKLY',
        paymentMethod: 'BANK_TRANSFER',
        salaryType: 'ORDINARIO',
        hasTransportAllowance: true,

        // Datos Bancarios
        bankName: '',
        bankAccount: '',
        clabe: '',

        // Seguridad Social (Colombia)
        nss: '',
        eps: '',
        arl: '',
        afp: '',
        cesantiasBox: ''
    })

    const [formData, setFormData] = useState(getInitialFormData())

    // Populate form when editing an employee
    useEffect(() => {
        if (employee && open) {
            setFormData({
                firstName: employee.firstName || '',
                lastName: employee.lastName || '',
                email: employee.email || '',
                phone: employee.phone || '',
                nationalId: employee.nationalId || '',
                rfc: employee.rfc || '',
                curp: employee.curp || '',
                jobTitle: employee.jobTitle || '',
                department: employee.department || '',
                hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
                contractTypeEnum: employee.contractTypeEnum || 'INDEFINIDO',
                baseSalary: employee.baseSalary?.toString() || '',
                paymentFrequency: employee.paymentFrequency || 'BIWEEKLY',
                paymentMethod: employee.paymentMethod || 'BANK_TRANSFER',
                salaryType: employee.salaryType || 'ORDINARIO',
                hasTransportAllowance: employee.hasTransportAllowance ?? true,
                bankName: employee.bankName || '',
                bankAccount: employee.bankAccount || '',
                clabe: employee.clabe || '',
                nss: employee.nss || '',
                eps: employee.eps || '',
                arl: employee.arl || '',
                afp: employee.afp || '',
                cesantiasBox: employee.cesantiasBox || ''
            })
        } else if (!open) {
            // Reset form when dialog closes
            setFormData(getInitialFormData())
        }
    }, [employee, open])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const employeeData = {
                ...formData,
                baseSalary: parseFloat(formData.baseSalary),
                hireDate: formData.hireDate
            }

            if (employee?.id) {
                // Update existing employee
                await employeeService.update(employee.id, employeeData, 1)
            } else {
                // Create new employee
                await employeeService.create(employeeData, 1)
            }
            onSuccess()
            handleClose()
        } catch (err: any) {
            setError(err.message || (employee ? 'Error al actualizar empleado' : 'Error al crear empleado'))
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setFormData(getInitialFormData())
        setError(null)
        onClose()
    }

    const isEditMode = !!employee

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 2
                }}>
                    <Typography variant="h5" fontWeight="bold">
                        {isEditMode ? '✏️ Editar Empleado' : '➕ Nuevo Empleado'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* ========== DATOS PERSONALES ========== */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                📋 Datos Personales
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Apellidos"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                helperText="Para envío de colilla de pago"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Cédula / Documento"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                required
                                helperText="Número de identificación"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="RFC (México)"
                                name="rfc"
                                value={formData.rfc}
                                onChange={handleChange}
                                inputProps={{ maxLength: 13 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="CURP (México)"
                                name="curp"
                                value={formData.curp}
                                onChange={handleChange}
                                inputProps={{ maxLength: 18 }}
                            />
                        </Grid>

                        {/* ========== DATOS LABORALES ========== */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                💼 Datos Laborales
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cargo / Puesto"
                                name="jobTitle"
                                value={formData.jobTitle}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Departamento / Área"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Ingreso"
                                name="hireDate"
                                type="date"
                                value={formData.hireDate}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Contrato"
                                name="contractTypeEnum"
                                value={formData.contractTypeEnum}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="INDEFINIDO">Indefinido</MenuItem>
                                <MenuItem value="FIJO">Término Fijo</MenuItem>
                                <MenuItem value="OBRA_LABOR">Obra o Labor</MenuItem>
                                <MenuItem value="TEMPORAL">Temporal</MenuItem>
                                <MenuItem value="APRENDIZAJE">Aprendizaje SENA</MenuItem>
                                <MenuItem value="PRESTACION_SERVICIOS">Prestación de Servicios</MenuItem>
                            </TextField>
                        </Grid>

                        {/* ========== DATOS DE NÓMINA ========== */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                💰 Datos de Nómina
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Salario Base Mensual"
                                name="baseSalary"
                                type="number"
                                value={formData.baseSalary}
                                onChange={handleChange}
                                required
                                InputProps={{ startAdornment: <Box sx={{ mr: 1 }}>$</Box> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                select
                                label="Frecuencia de Pago"
                                name="paymentFrequency"
                                value={formData.paymentFrequency}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="WEEKLY">Semanal</MenuItem>
                                <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                                <MenuItem value="MONTHLY">Mensual</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Salario"
                                name="salaryType"
                                value={formData.salaryType}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="ORDINARIO">Ordinario</MenuItem>
                                <MenuItem value="INTEGRAL">Integral (&gt;13 SMMLV)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Método de Pago"
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                            >
                                <MenuItem value="BANK_TRANSFER">Transferencia Bancaria</MenuItem>
                                <MenuItem value="CASH">Efectivo</MenuItem>
                                <MenuItem value="CHECK">Cheque</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.hasTransportAllowance}
                                        onChange={(e) => setFormData({ ...formData, hasTransportAllowance: e.target.checked })}
                                        name="hasTransportAllowance"
                                    />
                                }
                                label="Aplica Auxilio de Transporte"
                            />
                        </Grid>

                        {/* ========== SEGURIDAD SOCIAL (Colombia) ========== */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                🏥 Seguridad Social (Colombia)
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="EPS"
                                name="eps"
                                value={formData.eps}
                                onChange={handleChange}
                            >
                                {EPS_OPTIONS.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Fondo de Pensiones (AFP)"
                                name="afp"
                                value={formData.afp}
                                onChange={handleChange}
                            >
                                {AFP_OPTIONS.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="ARL"
                                name="arl"
                                value={formData.arl}
                                onChange={handleChange}
                            >
                                {ARL_OPTIONS.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Caja de Cesantías"
                                name="cesantiasBox"
                                value={formData.cesantiasBox}
                                onChange={handleChange}
                            >
                                {CESANTIAS_OPTIONS.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* ========== DATOS BANCARIOS ========== */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                🏦 Datos Bancarios
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Banco"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Número de Cuenta"
                                name="bankAccount"
                                value={formData.bankAccount}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="CLABE (México)"
                                name="clabe"
                                value={formData.clabe}
                                onChange={handleChange}
                                inputProps={{ maxLength: 18 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={handleClose} disabled={loading} size="large">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading} size="large">
                        {loading ? 'Guardando...' : (isEditMode ? '💾 Actualizar Empleado' : '💾 Guardar Empleado')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
