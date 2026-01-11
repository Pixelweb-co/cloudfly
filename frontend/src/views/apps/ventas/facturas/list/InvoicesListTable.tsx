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
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
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
import type { InvoiceType } from '@/types/apps/invoiceType'
import ColumnSelector from '@/components/ColumnSelector'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'
import ErrorDialog from '@/components/dialogs/ErrorDialog'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

type InvoiceTypeWithAction = InvoiceType & {
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
} & Omit<TextFieldProps, 'onChange'>) => {
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

const columnHelper = createColumnHelper<InvoiceTypeWithAction>()

const InvoicesListTable = ({ reload, tableData }: any) => {
    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState(tableData.sort((a: any, b: any) => b.id - a.id))
    const [filteredData, setFilteredData] = useState(data)
    const [globalFilter, setGlobalFilter] = useState('')
    const [errorDeleteItem, setErrorDeleteItem] = useState<any | null>(null)
    const [isDianEnabled, setIsDianEnabled] = useState(false)
    const [sendingDian, setSendingDian] = useState<number | null>(null)

    const router = useRouter()

    useEffect(() => {
        const checkDianStatus = async () => {
            const user = userMethods.getUserLogin()
            if (user && user.customer && user.customer.id) {
                try {
                    const res = await axiosInstance.get(`${API_BASE_URL}/customers/${user.customer.id}`)
                    if (res.data && res.data.esEmisorFE) {
                        setIsDianEnabled(true)
                    }
                } catch (e) {
                    console.error('Error checking DIAN status', e)
                }
            }
        }
        checkDianStatus()
    }, [])

    const deleteItem = async (id: any) => {
        try {
            await axiosInstance.delete(`${API_BASE_URL}/invoices/${id}`)
            setErrorDeleteItem('Factura eliminada correctamente!')
            reload(true)
        } catch (error: any) {
            console.log('Error al eliminar factura:', error)
            setErrorDeleteItem('No se puede eliminar esta factura')
        }
    }

    const sendToDian = async (id: number) => {
        try {
            setSendingDian(id)
            // Endpoint provisional, backend debe implementar esto
            await axiosInstance.post(`${API_BASE_URL}/dian/invoices/${id}/send`)
            reload(true)
        } catch (error: any) {
            console.error('Error enviando a DIAN', error)
            setErrorDeleteItem('Error al enviar a la DIAN: ' + (error.response?.data?.message || 'Error desconocido'))
        } finally {
            setSendingDian(null)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: 'bg-gray-100 text-gray-700',
            ISSUED: 'bg-blue-100 text-blue-700',
            PAID: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: 'Borrador',
            ISSUED: 'Emitida',
            PAID: 'Pagada',
            CANCELLED: 'Anulada'
        }
        return labels[status] || status
    }

    const getDianStatusColor = (status: string | undefined) => {
        if (!status) return 'default'
        const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
            PENDING: 'warning',
            SENT: 'info',
            ACCEPTED: 'success',
            REJECTED: 'error'
        }
        return colors[status] || 'default'
    }

    const columns = useMemo<ColumnDef<InvoiceTypeWithAction, any>[]>(
        () => {
            const cols: ColumnDef<InvoiceTypeWithAction, any>[] = [
                {
                    id: 'select',
                    header: ({ table }) => (
                        <Checkbox
                            {...{
                                checked: table.getIsAllRowsSelected(),
                                indeterminate: table.getIsSomeRowsSelected(),
                                onChange: table.getToggleAllRowsSelectedHandler()
                            }}
                        />
                    ),
                    cell: ({ row }) => (
                        <Checkbox
                            {...{
                                checked: row.getIsSelected(),
                                disabled: !row.getCanSelect(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: row.getToggleSelectedHandler()
                            }}
                        />
                    )
                },
                columnHelper.accessor('invoiceNumber', {
                    header: 'Número',
                    cell: ({ row }) => (
                        <Typography color='text.primary' className='font-medium'>
                            {row.original.invoiceNumber}
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
                columnHelper.accessor('issueDate', {
                    header: 'Emisión',
                    cell: ({ row }) => (
                        <Typography className='font-medium' color='text.primary'>
                            {new Date(row.original.issueDate).toLocaleDateString()}
                        </Typography>
                    )
                }),
                columnHelper.accessor('status', {
                    header: 'Estado',
                    cell: ({ row }) => (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(row.original.status)}`}>
                            {getStatusLabel(row.original.status)}
                        </span>
                    )
                }),
                columnHelper.accessor('total', {
                    header: 'Total',
                    cell: ({ row }) => (
                        <Typography className='font-medium' color='text.primary'>
                            ${row.original.total.toFixed(2)}
                        </Typography>
                    )
                })
            ] as ColumnDef<InvoiceTypeWithAction, any>[]

            if (isDianEnabled) {
                cols.push(
                    columnHelper.accessor('dianStatus', {
                        header: 'Estado DIAN',
                        cell: ({ row }) => (
                            row.original.dianStatus ? (
                                <Chip
                                    label={row.original.dianStatus}
                                    color={getDianStatusColor(row.original.dianStatus)}
                                    size="small"
                                    variant="outlined"
                                />
                            ) : <span className="text-gray-400">-</span>
                        )
                    }) as any,
                    columnHelper.accessor('cufe', {
                        header: 'CUFE',
                        cell: ({ row }) => (
                            row.original.cufe ? (
                                <Tooltip title={row.original.cufe}>
                                    <Typography variant="caption" className="cursor-pointer">
                                        {row.original.cufe.substring(0, 10)}...
                                    </Typography>
                                </Tooltip>
                            ) : <span className="text-gray-400">-</span>
                        )
                    }) as any
                )
            }

            cols.push(
                columnHelper.accessor('action', {
                    header: 'Acciones',
                    cell: ({ row }) => (
                        <div className='flex items-center'>
                            {isDianEnabled && row.original.status === 'ISSUED' && row.original.dianStatus !== 'ACCEPTED' && (
                                <Tooltip title='Enviar a DIAN'>
                                    <IconButton
                                        onClick={() => sendToDian(row.original.id)}
                                        disabled={sendingDian === row.original.id}
                                        color="primary"
                                    >
                                        {sendingDian === row.original.id ? <CircularProgress size={20} /> : <i className='tabler-cloud-upload' />}
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title='Ver/Editar'>
                                <IconButton onClick={() => router.push(`/ventas/facturas/form/${row.original.id}`)}>
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
                }) as any
            )

            return cols
        },
        [data, filteredData, isDianEnabled, sendingDian]
    )

    useEffect(() => {
        setData(tableData)
        setFilteredData(tableData)
    }, [tableData])

    const table = useReactTable({
        data: filteredData as InvoiceType[],
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
        <>
            <Card>
                <CardHeader title='Facturas' className='pbe-4' />
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

                    <ColumnSelector table={table} />

                    <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Buscar'
                            className='max-sm:is-full'
                        />

                        <Button
                            onClick={() => router.push('/ventas/facturas/form')}
                            variant='contained'
                            startIcon={<i className='tabler-plus' />}
                            className='max-sm:is-full'
                        >
                            Nueva Factura
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
                                                <>
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
                                                </>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        {table.getFilteredRowModel().rows.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No hay facturas disponibles
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>
                                {table
                                    .getRowModel()
                                    .rows.slice(0, table.getState().pagination.pageSize)
                                    .map(row => {
                                        return (
                                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        )}
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

            {errorDeleteItem && (
                <ErrorDialog
                    entitYName='Eliminar factura'
                    open={errorDeleteItem}
                    error={errorDeleteItem}
                    setOpen={setErrorDeleteItem}
                />
            )}
        </>
    )
}

export default InvoicesListTable
