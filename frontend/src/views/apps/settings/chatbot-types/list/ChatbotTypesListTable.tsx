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
import { toast } from 'react-toastify'
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
import type { ChatbotTypeConfig } from '@/types/apps/chatbotTypes'
import ChatbotTypeForm from '@/components/dialogs/form-chatbot-type'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import { userMethods } from '@/utils/userMethods'
import { Chip, Tooltip } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'
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

type ChatbotTypeConfigWithAction = ChatbotTypeConfig & {
    action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({
        itemRank
    })
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

const columnHelper = createColumnHelper<ChatbotTypeConfigWithAction>()

const ChatbotTypesListTable = ({ reload, tableData }: any) => {
    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState(tableData.sort((a: any, b: any) => b.id - a.id))
    const [filteredData, setFilteredData] = useState(data)
    const [globalFilter, setGlobalFilter] = useState('')
    const [loadForm, setLoadForm] = useState(false)
    const [errorDeleteItem, setErrorDeleteItem] = useState<any | null>(null)
    const [selectedRow, setSelectedRow] = useState<any>(null)
    const router = useRouter()

    const deleteItem = async (id: any) => {
        if (!confirm('¿Estás seguro de eliminar este tipo de chatbot?')) return

        try {
            await axiosInstance.delete(`${API_BASE_URL}/chatbot-types/${id}`)
            toast.success('Tipo de chatbot eliminado correctamente')
            reload(true)
        } catch (error: any) {
            console.log('Error al eliminar:', error)
            setErrorDeleteItem(error.response?.data?.message || 'Error al eliminar el tipo de chatbot')
        }
    }

    const toggleStatus = async (id: number) => {
        try {
            await axiosInstance.patch(`${API_BASE_URL}/chatbot-types/${id}/toggle-status`)
            toast.success('Estado actualizado correctamente')
            reload(true)
        } catch (error: any) {
            console.error('Error al cambiar estado:', error)
            toast.error('Error al actualizar el estado')
        }
    }

    const columns = useMemo<ColumnDef<ChatbotTypeConfigWithAction, any>[]>(
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

            columnHelper.accessor('typeName', {
                header: 'Tipo',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.typeName}
                    </Typography>
                )
            }),

            columnHelper.accessor('description', {
                header: 'Descripción',
                cell: ({ row }) => (
                    <Typography className='font-medium' color='text.primary'>
                        {row.original.description || '-'}
                    </Typography>
                )
            }),

            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status ? 'Activo' : 'Inactivo'}
                        color={row.original.status ? 'success' : 'default'}
                        size='small'
                        variant='tonal'
                        onClick={() => toggleStatus(row.original.id!)}
                        style={{ cursor: 'pointer' }}
                    />
                )
            }),

            columnHelper.accessor('action', {
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('ADMIN')) ? (
                            <Tooltip title='Editar'>
                                <IconButton
                                    onClick={() => {
                                        setSelectedRow(row.original)
                                        setLoadForm(true)
                                    }}
                                >
                                    <i className='tabler-edit text-textSecondary' />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                        {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('ADMIN')) ? (
                            <Tooltip title='Eliminar'>
                                <IconButton onClick={() => deleteItem(row.original.id)}>
                                    <i className='tabler-trash text-textSecondary' />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                    </div>
                ),
                enableSorting: false
            })
        ],
        [data, filteredData]
    )

    useEffect(() => {
        setData(tableData)
        setFilteredData(tableData)
    }, [tableData])

    const table = useReactTable({
        data: filteredData as ChatbotTypeConfig[],
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
                <CardHeader title='Tipos de Chatbot' className='pbe-4' />
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
                            placeholder='Buscar'
                            className='max-sm:is-full'
                        />

                        {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('ADMIN')) && (
                            <Button
                                onClick={() => {
                                    setLoadForm(true)
                                    setSelectedRow({
                                        id: undefined,
                                        typeName: '',
                                        description: '',
                                        webhookUrl: '',
                                        status: true
                                    })
                                }}
                                variant='contained'
                                startIcon={<i className='tabler-plus' />}
                                className='max-sm:is-full'
                            >
                                Agregar Tipo
                            </Button>
                        )}
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
                                        No hay datos disponibles
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

            {loadForm && (
                <ChatbotTypeForm
                    open={loadForm}
                    onClose={() => {
                        setLoadForm(false)
                        reload(true)
                        setSelectedRow(null)
                    }}
                    rowSelect={selectedRow}
                />
            )}

            {errorDeleteItem && (
                <ErrorDialog
                    entitYName='Eliminar tipo de chatbot'
                    open={errorDeleteItem}
                    error={errorDeleteItem}
                    setOpen={setErrorDeleteItem}
                />
            )}
        </>
    )
}

export default ChatbotTypesListTable
