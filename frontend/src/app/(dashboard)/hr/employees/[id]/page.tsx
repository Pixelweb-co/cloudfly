'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    Tabs,
    Tab,
    Button,
    Grid,
    Paper,
    Divider,
    IconButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    LinearProgress,
    Tooltip
} from '@mui/material'
import {
    ArrowBack,
    Edit,
    Person,
    Work,
    HealthAndSafety,
    Receipt,
    AttachMoney,
    Email,
    Phone,
    LocationOn,
    CalendarMonth,
    AccountBalance,
    Badge,
    Download
} from '@mui/icons-material'

// Types
interface Employee {
    id: number
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
    nationalId: string
    rfc: string
    curp: string
    address: string
    city: string
    state: string
    postalCode: string
    birthDate: string
    employeeNumber: string
    hireDate: string
    terminationDate: string | null
    department: string
    jobTitle: string
    contractType: string
    baseSalary: number
    paymentFrequency: string
    paymentMethod: string
    bankName: string
    bankAccount: string
    clabe: string
    // Colombia
    eps: string
    arl: string
    afp: string
    cesantiasBox: string
    nss: string
    salaryType: string
    hasTransportAllowance: boolean
    contractTypeEnum: string
    isActive: boolean
}

interface PayrollHistory {
    id: number
    period: string
    baseSalary: number
    perceptions: number
    deductions: number
    netPay: number
    status: string
    receiptNumber: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Tab Panel Component
function TabPanel({ children, value, index }: { children: React.ReactNode, value: number, index: number }) {
    return (
        <div hidden={value !== index} style={{ paddingTop: '24px' }}>
            {value === index && children}
        </div>
    )
}

export default function EmployeeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const employeeId = params?.id as string

    const [loading, setLoading] = useState(true)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [payrollHistory, setPayrollHistory] = useState<PayrollHistory[]>([])
    const [tabValue, setTabValue] = useState(0)

    useEffect(() => {
        if (employeeId) {
            loadEmployee()
            loadPayrollHistory()
        }
    }, [employeeId])

    const loadEmployee = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE}/api/hr/employees/${employeeId}?customerId=1`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setEmployee(data)
            }
        } catch (error) {
            console.error('Error loading employee:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadPayrollHistory = async () => {
        // Mock data for now - would be an API call
        setPayrollHistory([
            { id: 1, period: 'Dic 2024 Q1', baseSalary: 2500000, perceptions: 2800000, deductions: 420000, netPay: 2380000, status: 'PAID', receiptNumber: 'RN-2024-12-001' },
            { id: 2, period: 'Nov 2024 Q2', baseSalary: 2500000, perceptions: 2650000, deductions: 400000, netPay: 2250000, status: 'PAID', receiptNumber: 'RN-2024-11-002' },
            { id: 3, period: 'Nov 2024 Q1', baseSalary: 2500000, perceptions: 2750000, deductions: 410000, netPay: 2340000, status: 'PAID', receiptNumber: 'RN-2024-11-001' },
        ])
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
    }

    // Info Row Component
    const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null | undefined }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Box sx={{ color: 'primary.main' }}>{icon}</Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
            </Box>
        </Box>
    )

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress sx={{ borderRadius: 2 }} />
                <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                    Cargando información del empleado...
                </Typography>
            </Box>
        )
    }

    if (!employee) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">Empleado no encontrado</Typography>
                <Button onClick={() => router.push('/hr/employees')} sx={{ mt: 2 }}>
                    Volver a Empleados
                </Button>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push('/hr/employees')}
                sx={{ mb: 2 }}
            >
                Volver a Empleados
            </Button>

            {/* Header Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Avatar */}
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: 'primary.main',
                                fontSize: '2rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {getInitials(employee.fullName)}
                        </Avatar>

                        {/* Info */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h4" fontWeight="bold">
                                    {employee.fullName}
                                </Typography>
                                <Chip
                                    label={employee.isActive ? 'Activo' : 'Inactivo'}
                                    color={employee.isActive ? 'success' : 'error'}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                {employee.jobTitle} • {employee.department}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <Chip icon={<Email sx={{ fontSize: 16 }} />} label={employee.email || 'Sin email'} variant="outlined" size="small" />
                                <Chip icon={<Phone sx={{ fontSize: 16 }} />} label={employee.phone || 'Sin teléfono'} variant="outlined" size="small" />
                                <Chip icon={<Badge sx={{ fontSize: 16 }} />} label={`#${employee.employeeNumber}`} variant="outlined" size="small" />
                            </Stack>
                        </Box>

                        {/* Salary Summary */}
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, textAlign: 'center', minWidth: 180 }}>
                            <Typography variant="caption" color="text.secondary">Salario Base</Typography>
                            <Typography variant="h5" color="primary" fontWeight="bold">
                                {formatCurrency(employee.baseSalary)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {employee.paymentFrequency === 'MONTHLY' ? 'Mensual' :
                                    employee.paymentFrequency === 'BIWEEKLY' ? 'Quincenal' : 'Semanal'}
                            </Typography>
                        </Paper>

                        {/* Edit Button */}
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => router.push(`/hr/employees?edit=${employee.id}`)}
                        >
                            Editar
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<Person />} label="Datos Personales" iconPosition="start" />
                    <Tab icon={<Work />} label="Datos Laborales" iconPosition="start" />
                    <Tab icon={<HealthAndSafety />} label="Seguridad Social" iconPosition="start" />
                    <Tab icon={<Receipt />} label="Historial de Nómina" iconPosition="start" />
                </Tabs>

                <CardContent>
                    {/* Tab 0: Datos Personales */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Información Personal
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <InfoRow icon={<Person />} label="Nombre Completo" value={employee.fullName} />
                                    <Divider />
                                    <InfoRow icon={<Badge />} label="Cédula / Documento" value={employee.nationalId} />
                                    <Divider />
                                    <InfoRow icon={<CalendarMonth />} label="Fecha de Nacimiento" value={formatDate(employee.birthDate)} />
                                    <Divider />
                                    <InfoRow icon={<Email />} label="Correo Electrónico" value={employee.email} />
                                    <Divider />
                                    <InfoRow icon={<Phone />} label="Teléfono" value={employee.phone} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Dirección
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <InfoRow icon={<LocationOn />} label="Dirección" value={employee.address} />
                                    <Divider />
                                    <InfoRow icon={<LocationOn />} label="Ciudad" value={employee.city} />
                                    <Divider />
                                    <InfoRow icon={<LocationOn />} label="Estado/Departamento" value={employee.state} />
                                    <Divider />
                                    <InfoRow icon={<LocationOn />} label="Código Postal" value={employee.postalCode} />
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 1: Datos Laborales */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Información Laboral
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <InfoRow icon={<Badge />} label="Número de Empleado" value={employee.employeeNumber} />
                                    <Divider />
                                    <InfoRow icon={<Work />} label="Cargo" value={employee.jobTitle} />
                                    <Divider />
                                    <InfoRow icon={<Work />} label="Departamento" value={employee.department} />
                                    <Divider />
                                    <InfoRow icon={<CalendarMonth />} label="Fecha de Ingreso" value={formatDate(employee.hireDate)} />
                                    <Divider />
                                    <InfoRow icon={<Work />} label="Tipo de Contrato" value={employee.contractType || employee.contractTypeEnum} />
                                    <Divider />
                                    <InfoRow icon={<AttachMoney />} label="Tipo de Salario" value={employee.salaryType === 'ORDINARIO' ? 'Ordinario' : 'Integral'} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Información de Pago
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <InfoRow icon={<AttachMoney />} label="Salario Base" value={formatCurrency(employee.baseSalary)} />
                                    <Divider />
                                    <InfoRow icon={<CalendarMonth />} label="Frecuencia de Pago" value={
                                        employee.paymentFrequency === 'MONTHLY' ? 'Mensual' :
                                            employee.paymentFrequency === 'BIWEEKLY' ? 'Quincenal' : 'Semanal'
                                    } />
                                    <Divider />
                                    <InfoRow icon={<AccountBalance />} label="Método de Pago" value={
                                        employee.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia Bancaria' :
                                            employee.paymentMethod === 'CHECK' ? 'Cheque' : 'Efectivo'
                                    } />
                                    <Divider />
                                    <InfoRow icon={<AccountBalance />} label="Banco" value={employee.bankName} />
                                    <Divider />
                                    <InfoRow icon={<AccountBalance />} label="Cuenta Bancaria" value={employee.bankAccount} />
                                    <Divider />
                                    <InfoRow icon={<AccountBalance />} label="CLABE" value={employee.clabe} />
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Seguridad Social (Colombia) */}
                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Seguridad Social Colombia
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <InfoRow icon={<HealthAndSafety />} label="EPS (Salud)" value={employee.eps} />
                                    <Divider />
                                    <InfoRow icon={<HealthAndSafety />} label="ARL (Riesgos Laborales)" value={employee.arl} />
                                    <Divider />
                                    <InfoRow icon={<HealthAndSafety />} label="AFP (Fondo de Pensiones)" value={employee.afp} />
                                    <Divider />
                                    <InfoRow icon={<AccountBalance />} label="Caja de Cesantías" value={employee.cesantiasBox} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                    Beneficios
                                </Typography>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                                        <AttachMoney color="primary" />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary">Auxilio de Transporte</Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {employee.hasTransportAllowance ?
                                                    <Chip label="Aplica" color="success" size="small" /> :
                                                    <Chip label="No aplica" color="default" size="small" />
                                                }
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Divider />
                                    <InfoRow icon={<Badge />} label="NSS (México)" value={employee.nss} />
                                    <Divider />
                                    <InfoRow icon={<Badge />} label="RFC" value={employee.rfc} />
                                    <Divider />
                                    <InfoRow icon={<Badge />} label="CURP" value={employee.curp} />
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 3: Historial de Nómina */}
                    <TabPanel value={tabValue} index={3}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            Últimos Recibos de Nómina
                        </Typography>

                        {payrollHistory.length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                No hay historial de nómina disponible
                            </Typography>
                        ) : (
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell><strong>Periodo</strong></TableCell>
                                            <TableCell><strong>Recibo</strong></TableCell>
                                            <TableCell align="right"><strong>Salario Base</strong></TableCell>
                                            <TableCell align="right"><strong>Percepciones</strong></TableCell>
                                            <TableCell align="right"><strong>Deducciones</strong></TableCell>
                                            <TableCell align="right"><strong>Neto a Pagar</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {payrollHistory.map((record) => (
                                            <TableRow key={record.id} hover>
                                                <TableCell>{record.period}</TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {record.receiptNumber}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{formatCurrency(record.baseSalary)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                                    {formatCurrency(record.perceptions)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main' }}>
                                                    {formatCurrency(record.deductions)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(record.netPay)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={record.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                                        color={record.status === 'PAID' ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Descargar PDF">
                                                        <IconButton size="small" color="primary">
                                                            <Download fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => router.push('/hr/receipts')}
                            >
                                Ver Todos los Recibos
                            </Button>
                        </Box>
                    </TabPanel>
                </CardContent>
            </Card>
        </Box>
    )
}
