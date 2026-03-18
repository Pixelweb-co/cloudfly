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
import type { MarketingCampaign, CampaignStatus } from '@/types/marketing'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<MarketingCampaign>()

const statusColors: Record<CampaignStatus, 'default' | 'primary' | 'success' | 'secondary' | 'warning' | 'error' | 'info'> = {
    DRAFT: 'secondary',
    ACTIVE: 'success',
    PAUSED: 'warning',
    COMPLETED: 'info'
}

const CampaignListTable = ({ tableData, reload }: { tableData: MarketingCampaign[], reload?: () => void }) => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [data, setData] = useState<MarketingCampaign[]>(tableData)

    useEffect(() => {
        setData(tableData)
    }, [tableData])

    const columns = useMemo<ColumnDef<MarketingCampaign, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Campaña',
                cell: ({ row }) => (
                    <div className='flex flex-col'>
                        <Typography color='text.primary' className='font-medium' sx={{ fontWeight: 600 }}>
                            {row.original.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                            {row.original.description || 'Sin descripción'}
                        </Typography>
                    </div>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        size='small'
                        label={row.original.status}
                        color={statusColors[row.original.status as CampaignStatus] || 'default'}
                        variant='tonal'
                    />
                )
            }),
            columnHelper.accessor('budget', {
                header: 'Presupuesto',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {row.original.budget ? `$${row.original.budget.toLocaleString()}` : 'N/A'}
                    </Typography>
                )
            }),
            columnHelper.accessor('startDate', {
                header: 'Inicio',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : '-'}
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
            <CardHeader title='Campañas de Marketing' className='flex flex-wrap gap-4' />
            <div className='flex items-center justify-between p-6 gap-4 border-bs'>
                <CustomTextField
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder='Buscar campaña...'
                    className='sm:is-auto'
                />
                <Button
                    variant='contained'
                    startIcon={<i className='tabler-plus' />}
                >
                    Nueva Campaña
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
                                    No hay campañas registradas
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

export default CampaignListTable
