'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// RBAC Imports
import type { Role } from '@/types/rbac'
import { getAllRoles, deleteRole } from '@/services/rbac/rbacService'
import { usePermissions } from '@/contexts/PermissionContext'

const RolesListPage = () => {
    const router = useRouter()
    const { isSuperAdmin } = usePermissions()

    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchRoles = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await getAllRoles()

            setRoles(data)
        } catch (err) {
            console.error('Error fetching roles:', err)
            setError('Error al cargar los roles')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!roleToDelete) return

        try {
            setIsDeleting(true)
            await deleteRole(roleToDelete.id)
            setDeleteDialogOpen(false)
            setRoleToDelete(null)
            fetchRoles() // Refresh list
        } catch (err) {
            console.error('Error deleting role:', err)
            setError('Error al eliminar el rol')
        } finally {
            setIsDeleting(false)
        }
    }

    const getPermissionCount = (role: Role): number => {
        return role.modulePermissions?.reduce((acc, mp) => acc + mp.actions.length, 0) || 0
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <>
            <Card>
                <CardHeader
                    title="Gestión de Roles y Permisos"
                    subheader="Administra los roles del sistema y sus permisos"
                    action={
                        isSuperAdmin() && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<i className="tabler-plus" />}
                                component={Link}
                                href="/settings/roles/form"
                            >
                                Nuevo Rol
                            </Button>
                        )
                    }
                />
                <CardContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Código</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell align="center">Permisos</TableCell>
                                    <TableCell align="center">Tipo</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body2" color="textSecondary">
                                                No hay roles disponibles
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => (
                                        <TableRow key={role.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {role.code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{role.name}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 250 }}>
                                                    {role.description || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={getPermissionCount(role)}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={role.isSystem ? 'Sistema' : 'Personalizado'}
                                                    size="small"
                                                    color={role.isSystem ? 'info' : 'default'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={role.isActive ? 'Activo' : 'Inactivo'}
                                                    size="small"
                                                    color={role.isActive ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Ver permisos">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => router.push(`/settings/roles/form?id=${role.id}`)}
                                                    >
                                                        <i className="tabler-eye" />
                                                    </IconButton>
                                                </Tooltip>
                                                {isSuperAdmin() && !role.isSystem && (
                                                    <>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => router.push(`/settings/roles/form?id=${role.id}`)}
                                                            >
                                                                <i className="tabler-edit" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteClick(role)}
                                                            >
                                                                <i className="tabler-trash" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar el rol <strong>{roleToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <CircularProgress size={20} /> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default RolesListPage
