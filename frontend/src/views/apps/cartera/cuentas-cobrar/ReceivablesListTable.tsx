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
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

import TablePaginationComponent from '@components/TablePaginationComponent'
import type { PortfolioDocument } from '@/types/portfolio'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import ColumnSelector from '@/components/ColumnSelector'
import PaymentRegistrationDialog from './PaymentRegistrationDialog'

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

const columnHelper = createColumnHelper<PortfolioDocument>()

const ReceivablesListTable = ({ tableData, reload }: { tableData: PortfolioDocument[]; reload: () => void }) => {
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const [data, setData] = useState(tableData)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<PortfolioDocument | undefined>(undefined)
    const router = useRouter()

    useEffect(() => {
        setData(tableData)
    }, [tableData])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'warning'
            case 'PARTIAL': return 'info'
            case 'PAID': return 'success'
            case 'OVERDUE': return 'error'
            case 'VOID': return 'default'
            default: return 'default'
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const columns = useMemo<ColumnDef<PortfolioDocument, any>[]>(
        () => [
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
            columnHelper.accessor('documentNumber', {
                header: 'Número',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.documentNumber}
                    </Typography>
                )
            }),
            columnHelper.accessor('contactName', {
                header: 'Cliente',
                cell: ({ row }) => (
                    <Typography className='font-medium' color='text.primary'>
                        {row.original.contactName || 'Sin nombre'}
                    </Typography>
                )
            }),
            columnHelper.accessor('issueDate', {
                header: 'Emisión',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {new Date(row.original.issueDate).toLocaleDateString()}
                    </Typography>
                )
            }),
            columnHelper.accessor('dueDate', {
                header: 'Vencimiento',
                cell: ({ row }) => (
                    <Typography color={new Date(row.original.dueDate) < new Date() && row.original.status !== 'PAID' ? 'error.main' : 'text.primary'}>
                        {new Date(row.original.dueDate).toLocaleDateString()}
                    </Typography>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status}
                        color={getStatusColor(row.original.status)}
                        size='small'
                        variant='tonal'
                    />
                )
            }),
            columnHelper.accessor('totalAmount', {
                header: 'Total',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {formatCurrency(row.original.totalAmount)}
                    </Typography>
                )
            }),
            columnHelper.accessor('balance', {
                header: 'Saldo',
                cell: ({ row }) => (
                    <Typography className='font-bold' color={row.original.balance > 0 ? 'error.main' : 'success.main'}>
                        {formatCurrency(row.original.balance)}
                    </Typography>
                )
            }),
            columnHelper.accessor('id', {
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <Tooltip title='Ver Factura'>
                            <IconButton onClick={() => row.original.invoiceId && router.push(`/ventas/facturas/form/${row.original.invoiceId}`)}>
                                <i className='tabler-eye text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Registrar Pago'>
                            <IconButton
                                color='primary'
                                onClick={() => {
                                    setSelectedDoc(row.original)
                                    setPaymentDialogOpen(true)
                                }}
                            >
                                <i className='tabler-cash text-primary' />
                            </IconButton>
                        </Tooltip>
                    </div>
                ),
                enableSorting: false
            })
        ],
        []
    )

    const table = useReactTable({
        data,
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
        getPaginationRowModel: getPaginationRowModel()
    })

    return (
        <Card>
            <CardHeader title='Cuentas por Cobrar (Cartera)' className='pbe-4' />
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
                        placeholder='Buscar por número o cliente'
                        className='max-sm:is-full'
                    />
                    <Button
                        variant='contained'
                        startIcon={<i className='tabler-file-download' />}
                        className='max-sm:is-full'
                    >
                        Exportar
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
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                ))}
                            </tr>
                        ))}
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

            <PaymentRegistrationDialog
                open={paymentDialogOpen}
                setOpen={setPaymentDialogOpen}
                selectedDoc={selectedDoc}
                onSuccess={() => reload()}
            />
        </Card>
    )
}

export default ReceivablesListTable
