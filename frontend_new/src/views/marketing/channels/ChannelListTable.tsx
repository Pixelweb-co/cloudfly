'use client'

import { useEffect, useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import TablePaginationComponent from '@components/TablePaginationComponent'
import type { Channel } from '@/types/marketing'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<Channel>()

const platformIcons: Record<string, string> = {
    WHATSAPP: 'tabler-brand-whatsapp',
    FACEBOOK: 'tabler-brand-facebook',
    INSTAGRAM: 'tabler-brand-instagram',
    TIKTOK: 'tabler-brand-tiktok',
    WEB: 'tabler-world'
}

const ChannelListTable = ({ tableData, reload }: { tableData: Channel[], reload?: () => void }) => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [data, setData] = useState<Channel[]>(tableData)

    useEffect(() => {
        setData(tableData)
    }, [tableData])

    const columns = useMemo<ColumnDef<Channel, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Canal',
                cell: ({ row }) => (
                    <div className='flex items-center gap-3'>
                        <i className={`${platformIcons[row.original.platform] || 'tabler-link'} text-xl text-primary`} />
                        <div className='flex flex-col'>
                            <Typography color='text.primary' className='font-medium' sx={{ fontWeight: 600 }}>
                                {row.original.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                                {row.original.platform} - {row.original.provider}
                            </Typography>
                        </div>
                    </div>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        size='small'
                        label={row.original.status ? 'Activo' : 'Inactivo'}
                        color={row.original.status ? 'success' : 'secondary'}
                        variant='tonal'
                    />
                )
            }),
            columnHelper.accessor('createdAt', {
                header: 'Creado',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
                    </Typography>
                )
            }),
            columnHelper.accessor('id', {
                header: 'Acción',
                cell: ({ row }) => (
                    <div className='flex items-center gap-2'>
                        <IconButton size="small">
                            <i className='tabler-edit text-[22px] text-textSecondary' />
                        </IconButton>
                        <IconButton size="small">
                            <i className='tabler-trash text-[22px] text-textSecondary' />
                        </IconButton>
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
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } }
    })

    return (
        <Card>
            <CardHeader title='Canales de Comunicación' className='flex flex-wrap gap-4' />
            <div className='flex items-center justify-between p-6 gap-4 border-bs'>
                <CustomTextField
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder='Buscar canal...'
                    className='sm:is-auto'
                />
                <Button
                    variant='contained'
                    startIcon={<i className='tabler-plus' />}
                >
                    Nuevo Canal
                </Button>
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
                                                onClick={header.column.getToggleSortingHandler()}
                                                className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
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
                                <td colSpan={columns.length} className='text-center'>
                                    No hay canales registrados
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
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
                onPageChange={(_, page) => table.setPageIndex(page)}
            />
        </Card>
    )
}

export default ChannelListTable
