'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { Button, Card, CardContent, CardHeader, Checkbox, Grid, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Divider, Chip } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { RoleFormData, RoleAction } from '@/types/apps/roleType'

interface Props {
    id?: string // 'new' or numeric id
}

const RoleForm = ({ id }: Props) => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState<RoleFormData | null>(null)

    const { control, handleSubmit, setValue, reset } = useForm<RoleFormData>({
        defaultValues: {
            name: '',
            description: '',
            modules: []
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const roleId = id || 'new'
                const response = await axiosInstance.get(`/api/roles/form/${roleId}`)
                setFormData(response.data)
                reset(response.data)
            } catch (error) {
                console.error('Error loading role form:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, reset])

    const onSubmit = async (data: RoleFormData) => {
        try {
            const payload = {
                ...data,
                modules: formData?.modules
            }

            await axiosInstance.post('/api/roles', payload)
            router.push('/accounts/roles/list')
        } catch (error) {
            console.error('Error saving role:', error)
            alert('Error guardando rol')
        }
    }

    const handleActionChange = (moduleIndex: number, actionId: number, checked: boolean) => {
        if (!formData) return
        const updatedModules = [...formData.modules]
        // Encontrar la acción por ID en el array plano
        const actionIndex = updatedModules[moduleIndex].actions.findIndex(a => a.id === actionId)
        if (actionIndex !== -1) {
            updatedModules[moduleIndex].actions[actionIndex].granted = checked
            setFormData({ ...formData, modules: updatedModules })
        }
    }

    const renderActions = (actions: RoleAction[], moduleIndex: number) => {
        const standardCodes = ['ACCESS', 'CREATE', 'UPDATE', 'DELETE'];
        const standardActions = actions.filter(a => standardCodes.includes(a.code));
        const subItemActions = actions.filter(a => !standardCodes.includes(a.code));

        return (
            <div className="flex flex-col gap-2">
                {/* Acciones Generales */}
                <div className="flex flex-wrap gap-4 items-center">
                    {standardActions.map(action => (
                        <div key={action.id} className="flex items-center">
                            <Checkbox
                                checked={action.granted}
                                onChange={(e) => handleActionChange(moduleIndex, action.id, e.target.checked)}
                                size='small'
                            />
                            <Typography variant='body2' fontWeight={action.code === 'ACCESS' ? 'bold' : 'normal'}>
                                {action.name}
                            </Typography>
                        </div>
                    ))}
                </div>

                {/* Subitems */}
                {subItemActions.length > 0 && (
                    <>
                        <Divider className="my-1" />
                        <Typography variant="caption" color="textSecondary">Acceso a Sub-Módulos:</Typography>
                        <Grid container spacing={1}>
                            {subItemActions.map(action => (
                                <Grid item xs={6} md={4} key={action.id}>
                                    <div className="flex items-center">
                                        <Checkbox
                                            checked={action.granted}
                                            onChange={(e) => handleActionChange(moduleIndex, action.id, e.target.checked)}
                                            size='small'
                                        />
                                        <Typography variant='body2' noWrap title={action.name}>
                                            {action.name.replace('Acceso a ', '').replace('Ver ', '')}
                                        </Typography>
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </div>
        )
    }

    if (loading) return (
        <div className='flex justify-center items-center h-full p-10'>
            <CircularProgress />
        </div>
    )

    return (
        <Card>
            <CardHeader title={id === 'new' ? 'Crear Nuevo Rol' : `Editar Rol: ${formData?.name}`} />
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={5}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name='name'
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label='Nombre del Rol' placeholder='EJ: VENDEDOR' />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name='description'
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label='Descripción' placeholder='Descripción del rol...' />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant='h6' sx={{ mb: 2 }}>Permisos de Módulos</Typography>
                            <TableContainer component={Paper} variant='outlined'>
                                <Table size='small'>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="25%">Módulo</TableCell>
                                            <TableCell>Permisos</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData?.modules.map((module, mIndex) => (
                                            <TableRow key={module.moduleId}>
                                                <TableCell component="th" scope="row" sx={{ verticalAlign: 'top' }}>
                                                    <Typography variant='subtitle2'>{module.moduleName}</Typography>
                                                    <Typography variant='caption' color='textSecondary'>{module.moduleCode}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {renderActions(module.actions, mIndex)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant='outlined' color='secondary' onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type='submit' variant='contained'>
                                Guardar Cambios
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    )
}

export default RoleForm
