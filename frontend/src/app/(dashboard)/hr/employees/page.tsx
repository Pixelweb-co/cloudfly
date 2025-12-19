'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Employee } from '@/types/hr'
import { employeeService } from '@/services/hr/employeeService'
import EmployeeFormDialog from '@/components/hr/EmployeeFormDialog'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    CircularProgress,
    Pagination,
    InputAdornment,
    Stack,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material'
import {
    Search,
    PersonAdd,
    Edit,
    Delete,
    ToggleOn,
    ToggleOff,
    Visibility
} from '@mui/icons-material'

export default function EmployeesPage() {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)

    // TODO: Get customerId from auth context
    const customerId = 1

    useEffect(() => {
        loadEmployees()
    }, [page])

    const loadEmployees = async () => {
        try {
            setLoading(true)
            console.log('Loading employees with customerId:', customerId, typeof customerId)
            const response = search
                ? await employeeService.search(customerId, search, page - 1, 10)
                : await employeeService.getAll(customerId, page - 1, 10, false)

            setEmployees(response.content)
            setTotalPages(response.totalPages)
        } catch (error) {
            console.error('Error loading employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        loadEmployees()
    }

    const handleToggleStatus = async (id: number) => {
        try {
            await employeeService.toggleStatus(id, customerId)
            loadEmployees()
        } catch (error) {
            console.error('Error toggling status:', error)
        }
    }

    const handleDeleteClick = (employee: Employee) => {
        setEmployeeToDelete(employee)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (employeeToDelete) {
            try {
                await employeeService.delete(employeeToDelete.id, customerId)
                loadEmployees()
            } catch (error) {
                console.error('Error deleting employee:', error)
            }
        }
        setDeleteDialogOpen(false)
        setEmployeeToDelete(null)
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setEmployeeToDelete(null)
    }

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee)
        setDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedEmployee(null)
        setDialogOpen(true)
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        setSelectedEmployee(null)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-MX')
    }

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            WEEKLY: 'Semanal',
            BIWEEKLY: 'Quincenal',
            MONTHLY: 'Mensual'
        }
        return labels[freq] || freq
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={3}>
                <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            👥 Empleados
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<PersonAdd />}
                            color="primary"
                            onClick={handleAddNew}
                        >
                            Agregar Empleado
                        </Button>
                    </Box>

                    {/* Search Bar */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por nombre, número de empleado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Button onClick={handleSearch} variant="contained" size="small">
                                            Buscar
                                        </Button>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ maxWidth: 600 }}
                        />
                    </Box>

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                            <CircularProgress size={60} />
                            <Typography sx={{ mt: 2 }} color="text.secondary">
                                Cargando empleados...
                            </Typography>
                        </Box>
                    ) : employees.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>
                                No hay empleados registrados
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                sx={{ mt: 2 }}
                            >
                                Agregar Primer Empleado
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell><strong>#</strong></TableCell>
                                            <TableCell><strong>Nombre</strong></TableCell>
                                            <TableCell><strong>Puesto</strong></TableCell>
                                            <TableCell><strong>Departamento</strong></TableCell>
                                            <TableCell><strong>Salario</strong></TableCell>
                                            <TableCell><strong>Periodicidad</strong></TableCell>
                                            <TableCell><strong>Ingreso</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align="right"><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {employees.map((employee) => (
                                            <TableRow
                                                key={employee.id}
                                                hover
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: 'action.selected' }
                                                }}
                                                onClick={() => router.push(`/hr/employees/${employee.id}`)}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {employee.employeeNumber || employee.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {employee.fullName}
                                                        </Typography>
                                                        {employee.email && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {employee.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{employee.jobTitle || '-'}</TableCell>
                                                <TableCell>{employee.department || '-'}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        {formatCurrency(employee.baseSalary)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getFrequencyLabel(employee.paymentFrequency)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(employee.hireDate)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={employee.isActive ? 'Activo' : 'Inactivo'}
                                                        color={employee.isActive ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="Ver Perfil">
                                                            <IconButton
                                                                size="small"
                                                                color="info"
                                                                onClick={() => router.push(`/hr/employees/${employee.id}`)}
                                                            >
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title={employee.isActive ? 'Desactivar' : 'Activar'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleToggleStatus(employee.id)}
                                                                color={employee.isActive ? 'success' : 'default'}
                                                            >
                                                                {employee.isActive ? <ToggleOn /> : <ToggleOff />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleEdit(employee)}
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteClick(employee)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={(_, value) => setPage(value)}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <EmployeeFormDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                onSuccess={() => {
                    loadEmployees()
                    setSelectedEmployee(null)
                }}
                employee={selectedEmployee}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
                    ⚠️ Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        ¿Estás seguro de que deseas eliminar al empleado{' '}
                        <strong>{employeeToDelete?.fullName || employeeToDelete?.firstName + ' ' + employeeToDelete?.lastName}</strong>?
                        <br /><br />
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
