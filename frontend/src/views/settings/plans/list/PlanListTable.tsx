'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import classnames from 'classnames'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnDef
} from '@tanstack/react-table'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import PlanForm from '../form/PlanForm'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'

// Type Imports
import { PlanResponse } from '@/types/plans'
import { planService } from '@/services/plans/planService'

// Util Imports
import { toast } from 'react-hot-toast'

const columnHelper = createColumnHelper<PlanResponse>()

const PlanListTable = () => {
    // Hooks
    const router = useRouter()

    // States
    const [data, setData] = useState<PlanResponse[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [planToDelete, setPlanToDelete] = useState<number | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const plans = await planService.getAllPlans()
            setData(plans)
        } catch (error) {
            console.error('Error fetching plans:', error)
            toast.error('Error al cargar planes')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDeleteClick = (id: number) => {
        setPlanToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (planToDelete === null) return

        try {
            await planService.deletePlan(planToDelete)
            toast.success('Plan eliminado exitosamente')
            setDeleteDialogOpen(false)
            setPlanToDelete(null)
            fetchData()
        } catch (error) {
            console.error('Error deleting plan:', error)
            toast.error('Error al eliminar plan')
            setDeleteDialogOpen(false)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setPlanToDelete(null)
    }

    const handleToggleStatus = async (id: number) => {
        try {
            await planService.togglePlanStatus(id)
            toast.success('Estado actualizado')
            fetchData()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error('Error al actualizar estado')
        }
    }

    const handleEdit = (plan: PlanResponse) => {
        router.push(`/administracion/planes/${plan.id}/editar`)
    }

    const handleCreate = () => {
        router.push('/administracion/planes/nuevo')
    }

    const columns = useMemo<ColumnDef<PlanResponse, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Nombre',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.name}
                    </Typography>
                )
            }),
            columnHelper.accessor('description', {
                header: 'Descripción',
                cell: ({ row }) => (
                    <Typography variant='body2' className='truncate max-w-xs'>
                        {row.original.description}
                    </Typography>
                )
            }),
            columnHelper.accessor('price', {
                header: 'Precio',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        ${row.original.price}
                    </Typography>
                )
            }),
            columnHelper.accessor('durationDays', {
                header: 'Duración (Días)',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.durationDays}
                    </Typography>
                )
            }),
            columnHelper.accessor('isActive', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Switch
                        checked={row.original.isActive}
                        onChange={() => handleToggleStatus(row.original.id)}
                    />
                )
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <IconButton onClick={() => handleEdit(row.original)}>
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(row.original.id)}>
                            <i className='tabler-trash text-textSecondary' />
                        </IconButton>
                    </div>
                )
            })
        ],
        []
    )

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 10
            }
        }
    })

    return (
        <Card>
            <CardHeader title='Planes de Suscripción' className='pbe-4' />
            <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
                <CustomTextField
                    select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className='max-sm:is-full sm:is-[70px]'
                >
                    <MenuItem value='10'>10</MenuItem>
                    <MenuItem value='25'>25</MenuItem>
                    <MenuItem value='50'>50</MenuItem>
                </CustomTextField>
                <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
                    <CustomTextField
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder='Buscar...'
                        className='max-sm:is-full'
                    />
                    <Button
                        variant='contained'
                        startIcon={<i className='tabler-plus' />}
                        onClick={handleCreate}
                        className='max-sm:is-full'
                    >
                        Nuevo Plan
                    </Button>
                </div>
            </div>
            <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={classnames({
                                                    'flex items-center': header.column.getIsSorted(),
                                                    'cursor-pointer select-none': header.column.getCanSort()
                                                })}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <i className='tabler-chevron-up text-xl' />,
                                                    desc: <i className='tabler-chevron-down text-xl' />
                                                }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    {table.getFilteredRowModel().rows.length === 0 ? (
                        <tbody>
                            <tr>
                                <td colSpan={table.getVisibleFlatColumns().length} className='text-center p-4'>
                                    {isLoading ? 'Cargando...' : 'No data available'}
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody>
                            {table
                                .getRowModel()
                                .rows.slice(0, table.getState().pagination.pageSize)
                                .map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    )}
                </table>
            </div>
            <TablePagination
                component={() => <TablePaginationComponent table={table} />}
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => table.setPageIndex(page)}
            />

            <PlanForm
                open={isFormOpen}
                setOpen={setIsFormOpen}
                onClose={fetchData}
                data={selectedPlan}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title='Eliminar Plan'
                message='¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer.'
                confirmText='Eliminar'
                cancelText='Cancelar'
                confirmColor='error'
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </Card>
    )
}

export default PlanListTable
