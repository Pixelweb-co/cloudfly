'use client'

import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
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
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// RBAC Imports
import type { Role, ModulePermission, RoleRequest, PermissionGrant } from '@/types/rbac'
import { getRoleById, getAllModules, createRole, updateRole } from '@/services/rbac/rbacService'
import { usePermissions } from '@/contexts/PermissionContext'

interface PermissionState {
    [moduleCode: string]: {
        [actionCode: string]: boolean
    }
}

const RoleFormPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const roleId = searchParams.get('id')
    const isEditMode = !!roleId

    const { isSuperAdmin } = usePermissions()

    // Form state
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    // Modules and permissions
    const [modules, setModules] = useState<ModulePermission[]>([])
    const [permissions, setPermissions] = useState<PermissionState>({})
    const [existingRole, setExistingRole] = useState<Role | null>(null)

    // UI state
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Load modules and role data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Load all modules with actions
                const modulesData = await getAllModules()

                setModules(modulesData)

                // Initialize permissions state
                const initialPermissions: PermissionState = {}

                modulesData.forEach(m => {
                    initialPermissions[m.moduleCode] = {}
                    m.actions.forEach(a => {
                        initialPermissions[m.moduleCode][a.code] = false
                    })
                })

                // If editing, load role data
                if (roleId) {
                    const roleData = await getRoleById(parseInt(roleId))

                    setExistingRole(roleData)
                    setCode(roleData.code)
                    setName(roleData.name)
                    setDescription(roleData.description || '')

                    // Set existing permissions
                    roleData.modulePermissions?.forEach(mp => {
                        if (initialPermissions[mp.moduleCode]) {
                            mp.actions.forEach(a => {
                                if (a.granted) {
                                    initialPermissions[mp.moduleCode][a.code] = true
                                }
                            })
                        }
                    })
                }

                setPermissions(initialPermissions)
            } catch (err) {
                console.error('Error loading data:', err)
                setError('Error al cargar los datos')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [roleId])

    // Handle permission toggle
    const togglePermission = (moduleCode: string, actionCode: string) => {
        setPermissions(prev => ({
            ...prev,
            [moduleCode]: {
                ...prev[moduleCode],
                [actionCode]: !prev[moduleCode]?.[actionCode]
            }
        }))
    }

    // Toggle all permissions for a module
    const toggleModuleAll = (moduleCode: string, checked: boolean) => {
        const module = modules.find(m => m.moduleCode === moduleCode)

        if (!module) return

        setPermissions(prev => ({
            ...prev,
            [moduleCode]: module.actions.reduce((acc, a) => {
                acc[a.code] = checked

                return acc
            }, {} as { [key: string]: boolean })
        }))
    }

    // Check if all permissions for a module are selected
    const isModuleFullySelected = (moduleCode: string): boolean => {
        const module = modules.find(m => m.moduleCode === moduleCode)

        if (!module) return false

        return module.actions.every(a => permissions[moduleCode]?.[a.code])
    }

    // Check if some permissions for a module are selected
    const isModulePartiallySelected = (moduleCode: string): boolean => {
        const module = modules.find(m => m.moduleCode === moduleCode)

        if (!module) return false
        const selected = module.actions.filter(a => permissions[moduleCode]?.[a.code]).length

        return selected > 0 && selected < module.actions.length
    }

    // Handle form submit
    const handleSubmit = async () => {
        try {
            setIsSaving(true)
            setError(null)
            setSuccess(null)

            // Build permissions array
            const permissionGrants: PermissionGrant[] = []

            modules.forEach(m => {
                m.actions.forEach(a => {
                    if (permissions[m.moduleCode]?.[a.code]) {
                        permissionGrants.push({
                            moduleCode: m.moduleCode,
                            actionCode: a.code,
                            granted: true
                        })
                    }
                })
            })

            const request: RoleRequest = {
                code: code.toUpperCase(),
                name,
                description,
                permissions: permissionGrants
            }

            if (isEditMode && existingRole) {
                await updateRole(existingRole.id, request)
                setSuccess('Rol actualizado correctamente')
            } else {
                await createRole(request)
                setSuccess('Rol creado correctamente')

                // Redirect to list after creation
                setTimeout(() => {
                    router.push('/settings/roles/list')
                }, 1500)
            }
        } catch (err) {
            console.error('Error saving role:', err)
            setError('Error al guardar el rol')
        } finally {
            setIsSaving(false)
        }
    }

    // Get unique action codes across all modules
    const allActionCodes = useMemo(() => {
        const actions = new Set<string>()

        modules.forEach(m => m.actions.forEach(a => actions.add(a.code)))

        return Array.from(actions)
    }, [modules])

    // Get action name from code
    const getActionName = (code: string): string => {
        const names: { [key: string]: string } = {
            read: 'Ver',
            create: 'Crear',
            update: 'Editar',
            delete: 'Eliminar',
            approve: 'Aprobar',
            void: 'Anular',
            liquidate: 'Liquidar',
            pay: 'Pagar',
            send: 'Enviar',
            cancel: 'Cancelar',
            export: 'Exportar',
            process: 'Procesar'
        }

        return names[code] || code
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        )
    }

    const isReadOnly = isEditMode && existingRole?.isSystem

    return (
        <Card>
            <CardHeader
                title={isEditMode ? (isReadOnly ? 'Ver Rol' : 'Editar Rol') : 'Nuevo Rol'}
                subheader={isReadOnly ? 'Los roles del sistema no pueden ser modificados' : 'Configure el rol y sus permisos'}
                action={
                    <Button
                        variant="outlined"
                        component={Link}
                        href="/settings/roles/list"
                        startIcon={<i className="tabler-arrow-left" />}
                    >
                        Volver
                    </Button>
                }
            />
            <CardContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                {/* Basic Info */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Código"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isEditMode}
                            placeholder="VENDEDOR"
                            helperText="Código único del rol (mayúsculas)"
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Vendedor"
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Acceso a ventas y clientes"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Permissions Matrix */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Matriz de Permisos
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Seleccione los permisos que tendrá este rol en cada módulo del sistema.
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Módulo</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, minWidth: 80 }}>Todos</TableCell>
                                {allActionCodes.map(action => (
                                    <TableCell key={action} align="center" sx={{ fontWeight: 600, minWidth: 80 }}>
                                        {getActionName(action)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modules.map((module) => (
                                <TableRow key={module.moduleCode} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {module.icon && <i className={module.icon} />}
                                            <Typography variant="body2" fontWeight={500}>
                                                {module.moduleName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Checkbox
                                            checked={isModuleFullySelected(module.moduleCode)}
                                            indeterminate={isModulePartiallySelected(module.moduleCode)}
                                            onChange={(e) => toggleModuleAll(module.moduleCode, e.target.checked)}
                                            disabled={isReadOnly}
                                            size="small"
                                        />
                                    </TableCell>
                                    {allActionCodes.map(actionCode => {
                                        const action = module.actions.find(a => a.code === actionCode)

                                        if (!action) {
                                            return <TableCell key={actionCode} align="center">-</TableCell>
                                        }

                                        return (
                                            <TableCell key={actionCode} align="center">
                                                <Checkbox
                                                    checked={permissions[module.moduleCode]?.[actionCode] || false}
                                                    onChange={() => togglePermission(module.moduleCode, actionCode)}
                                                    disabled={isReadOnly}
                                                    size="small"
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Actions */}
                {!isReadOnly && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                        <Button
                            variant="outlined"
                            component={Link}
                            href="/settings/roles/list"
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isSaving || !code || !name}
                            startIcon={isSaving ? <CircularProgress size={20} /> : <i className="tabler-device-floppy" />}
                        >
                            {isSaving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Rol')}
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}

export default RoleFormPage
