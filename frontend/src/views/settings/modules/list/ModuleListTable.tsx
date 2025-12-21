'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
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

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { ModuleDTO } from '@/types/modules'
import { moduleService } from '@/services/modules/moduleService'
import { toast } from 'react-hot-toast'

const columnHelper = createColumnHelper<ModuleDTO>()

const ModuleListTable = () => {
    const router = useRouter()
    const [data, setData] = useState<ModuleDTO[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const modules = await moduleService.getAllModules()
            setData(modules)
        } catch (error) {
            console.error('Error fetching modules:', error)
            toast.error('Error al cargar módulos')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este módulo? Esto puede afectar los planes que lo incluyen.')) {
            try {
                await moduleService.deleteModule(id)
                toast.success('Módulo eliminado')
                fetchData()
            } catch (error) {
                console.error('Error deleting module:', error)
                toast.error('Error al eliminar módulo')
            }
        }
    }

    const handleCreate = () => {
        router.push('/administracion/modules/nuevo')
    }

    const columns = useMemo<ColumnDef<ModuleDTO, any>[]>(
        () => [
            columnHelper.accessor('icon', {
                header: 'Icono',
                cell: ({ row }) => (
                    <div className='flex items-center justify-center'>
                        {row.original.icon ? (
                            <i className={`${row.original.icon} text-2xl text-primary`} />
                        ) : (
                            <i className='tabler-box text-2xl text-textSecondary' />
                        )}
                    </div>
                ),
                size: 80
            }),
            columnHelper.accessor('name', {
                header: 'Nombre',
                cell: ({ row }) => (
                    <div>
                        <Typography color='text.primary' className='font-medium'>
                            {row.original.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                            {row.original.code}
                        </Typography>
                    </div>
                )
            }),
            columnHelper.accessor('description', {
                header: 'Descripción',
                cell: ({ row }) => (
                    <Typography variant='body2' className='truncate max-w-xs'>
                        {row.original.description || '-'}
                    </Typography>
                )
            }),
            columnHelper.accessor('menuPath', {
                header: 'Ruta',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.menuPath || 'Sin ruta'}
                        size='small'
                        variant='tonal'
                        color={row.original.menuPath ? 'primary' : 'secondary'}
                    />
                )
            }),
            columnHelper.accessor('menuItems', {
                header: 'Items',
                cell: ({ row }) => {
                    const itemsCount = row.original.menuItems
                        ? JSON.parse(row.original.menuItems).length
                        : 0
                    return (
                        <Chip
                            label={`${itemsCount} items`}
                            size='small'
                            variant='tonal'
                            color={itemsCount > 0 ? 'info' : 'secondary'}
                            icon={<i className='tabler-list' />}
                        />
                    )
                },
                size: 100
            }),
            columnHelper.accessor('displayOrder', {
                header: 'Orden',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='text-center'>
                        {row.original.displayOrder}
                    </Typography>
                ),
                size: 80
            }),
            columnHelper.accessor('isActive', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.isActive ? 'Activo' : 'Inactivo'}
                        size='small'
                        variant='tonal'
                        color={row.original.isActive ? 'success' : 'secondary'}
                    />
                ),
                size: 100
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center gap-1'>
                        <IconButton
                            size='small'
                            onClick={() => router.push(`/administracion/modules/${row.original.id}/editar`)}
                            title='Editar'
                        >
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                        <IconButton
                            size='small'
                            onClick={() => handleDelete(row.original.id)}
                            title='Eliminar'
                        >
                            <i className='tabler-trash text-textSecondary' />
                        </IconButton>
                    </div>
                ),
                size: 100
            })
        ],
        [router]
    )

    const table = useReactTable({
        data,
        columns,
        filterFns: {},
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
            <CardHeader
                title='Módulos del Sistema'
                subheader='Gestiona los módulos que se pueden asignar a planes de suscripción'
                className='pbe-4'
            />
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
                        placeholder='Buscar módulo...'
                        className='max-sm:is-full'
                    />
                    <Button
                        variant='contained'
                        startIcon={<i className='tabler-plus' />}
                        onClick={handleCreate}
                        className='max-sm:is-full'
                    >
                        Nuevo Módulo
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
                                    {isLoading ? 'Cargando...' : 'No hay módulos disponibles'}
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
                component={() => <TablePaginationComponent table={table as any} />}
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => table.setPageIndex(page)}
            />
        </Card>
    )
}

export default ModuleListTable
