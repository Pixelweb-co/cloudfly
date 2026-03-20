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
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

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
    type ColumnDef,
    type FilterFn
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import PipelineForm from './PipelineForm'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Type & Service Imports
import type { Pipeline } from '@/types/marketing/pipelineTypes'
import { pipelineService } from '@/services/marketing/pipelineService'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const columnHelper = createColumnHelper<Pipeline>()

const PipelineListTable = () => {
    const router = useRouter()

    const [data, setData] = useState<Pipeline[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [pipelineToDelete, setPipelineToDelete] = useState<number | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const pipelines = await pipelineService.getAllPipelines()
            setData(pipelines)
        } catch (error) {
            console.error('Error fetching pipelines:', error)
            toast.error('Error al cargar pipelines')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDeleteClick = (id: number) => {
        setPipelineToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (pipelineToDelete === null) return
        try {
            await pipelineService.deletePipeline(pipelineToDelete)
            toast.success('Pipeline eliminado exitosamente')
            setDeleteDialogOpen(false)
            setPipelineToDelete(null)
            fetchData()
        } catch (error) {
            console.error('Error deleting pipeline:', error)
            toast.error('Error al eliminar pipeline')
            setDeleteDialogOpen(false)
        }
    }

    const handleToggleStatus = async (id: number) => {
        try {
            await pipelineService.toggleStatus(id)
            toast.success('Estado actualizado')
            fetchData()
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error('Error al actualizar estado')
        }
    }

    const handleEdit = (pipeline: Pipeline) => {
        setSelectedPipeline(pipeline)
        setFormOpen(true)
    }

    const handleCreate = () => {
        setSelectedPipeline(null)
        setFormOpen(true)
    }

    const columns = useMemo<ColumnDef<Pipeline, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Nombre',
                cell: ({ row }) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.original.color || '#6366F1' }} />
                            <Typography color='text.primary' className='font-medium'>
                                {row.original.name}
                            </Typography>
                            {row.original.isDefault && <Chip label='Default' size='small' color='primary' variant='outlined' />}
                        </Box>
                        <Typography variant='body2' color='text.secondary' className='truncate max-w-xs'>
                            {row.original.description}
                        </Typography>
                    </Box>
                )
            }),
            columnHelper.accessor('type', {
                header: 'Tipo',
                cell: ({ row }) => <Typography>{row.original.type}</Typography>
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
            columnHelper.accessor('createdAt', {
                header: 'Creado',
                cell: ({ row }) => <Typography>{format(new Date(row.original.createdAt), 'dd/MM/yyyy')}</Typography>
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <IconButton onClick={() => router.push(`/marketing/pipelines/kanban?id=${row.original.id}`)} title='Ver Kanban'>
                            <i className='tabler-layout-kanban text-textSecondary' />
                        </IconButton>
                        <IconButton onClick={() => handleEdit(row.original)} title='Editar'>
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(row.original.id)} title='Eliminar'>
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
        filterFns: { fuzzy: fuzzyFilter },
        state: { globalFilter },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        initialState: { pagination: { pageSize: 10 } }
    })

    return (
        <Card>
            <CardHeader title='Embudos (Pipelines) de Marketing' className='pbe-4' />
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
                        Nuevo Embudo
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
                                    {isLoading ? 'Cargando...' : 'No se encontraron embudos'}
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody>
                            {table.getRowModel().rows.map(row => (
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

            <ConfirmDialog
                open={deleteDialogOpen}
                title='Eliminar Pipeline'
                message='¿Estás seguro de que deseas eliminar este embudo? Esta acción no se puede deshacer.'
                confirmText='Eliminar'
                cancelText='Cancelar'
                confirmColor='error'
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
            />

            {formOpen && (
                <PipelineForm
                    open={formOpen}
                    handleClose={() => setFormOpen(false)}
                    selectedPipeline={selectedPipeline}
                    onSuccess={fetchData}
                />
            )}
        </Card>
    )
}

export default PipelineListTable
