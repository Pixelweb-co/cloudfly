'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import TablePaginationComponent from '@components/TablePaginationComponent'
import type { OrderType } from '@/types/ventas/orderTypes'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-hot-toast'

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

type OrderTypeWithAction = OrderType & {
    action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & any) => {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value])

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper<OrderTypeWithAction>()

const OrdersListTable = ({ tableData, onReload }: { tableData: OrderType[], onReload: () => void }) => {
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const router = useRouter()

    const deleteItem = async (id: number) => {
        try {
            await axiosInstance.delete(`/orders/${id}`)
            toast.success('Pedido eliminado correctamente')
            onReload()
        } catch (error: any) {
            console.error('Error al eliminar el pedido:', error)
            toast.error('No se pudo eliminar el pedido')
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, any> = {
            PROCESANDO: 'secondary',
            DESPACHADO: 'info',
            FACTURADO: 'success',
            PROCESANDO: 'error',
            PROCESANDO: 'warning'
        }
        return colors[status] || 'secondary'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PROCESANDO: 'Procesando',
            DESPACHADO: 'Despachado',
            ENTREGADO: 'Entregado',
            FACTURADO: 'Facturado'
        }
        return labels[status] || status
    }

    const columns = useMemo<ColumnDef<OrderTypeWithAction, any>[]>(
        () => [
            columnHelper.accessor('orderNumber', {
                header: 'Número',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.orderNumber}
                    </Typography>
                )
            }),
            columnHelper.accessor('customerName', {
                header: 'Cliente',
                cell: ({ row }) => (
                    <Typography className='font-medium' color='text.primary'>
                        {row.original.customerName || '-'}
                    </Typography>
                )
            }),
            columnHelper.accessor('orderDate', {
                header: 'Fecha',
                cell: ({ row }) => (
                    <Typography className='font-medium' color='text.primary'>
                        {new Date(row.original.orderDate).toLocaleDateString()}
                    </Typography>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <div className={classnames('flex items-center gap-2')}>
                         <i className={classnames('tabler-circle-filled text-[10px]', {
                            'text-secondary': row.original.status === 'PROCESANDO',
                            'text-info': row.original.status === 'DESPACHADO',
                            'text-success': row.original.status === 'FACTURADO',
                            'text-error': row.original.status === 'PROCESANDO',
                            'text-warning': row.original.status === 'PROCESANDO',
                         })} />
                        <Typography color='text.primary'>
                            {getStatusLabel(row.original.status)}
                        </Typography>
                    </div>
                )
            }),
            columnHelper.accessor('total', {
                header: 'Total',
                cell: ({ row }) => (
                    <Typography className='font-medium' color='text.primary'>
                        ${row.original.total?.toLocaleString()}
                    </Typography>
                )
            }),
            columnHelper.accessor('action', {
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <Tooltip title='Editar'>
                            <IconButton onClick={() => router.push(`/ventas/pedidos/form/${row.original.id}`)}>
                                <i className='tabler-edit text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Eliminar'>
                            <IconButton onClick={() => deleteItem(row.original.id)}>
                                <i className='tabler-trash text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                    </div>
                ),
                enableSorting: false
            })
        ],
        [tableData]
    )

    const table = useReactTable({
        data: tableData,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            rowSelection,
            globalFilter
        },
        initialState: {
            pagination: {
                pageSize: 10
            }
        },
        enableRowSelection: true,
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    return (
        <Card>
            <CardHeader 
                title='Pedidos' 
                action={
                    <Button
                        onClick={() => router.push('/ventas/pedidos/form')}
                        variant='contained'
                        startIcon={<i className='tabler-plus' />}
                    >
                        Nuevo Pedido
                    </Button>
                }
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
                    <DebouncedInput
                        value={globalFilter ?? ''}
                        onChange={value => setGlobalFilter(String(value))}
                        placeholder='Buscar Pedido'
                        className='max-sm:is-full'
                    />
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
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                    No hay pedidos disponibles
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <TablePagination
                component={() => <TablePaginationComponent table={table} />}
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => {
                    table.setPageIndex(page)
                }}
            />
        </Card>
    )
}

export default OrdersListTable
