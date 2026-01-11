'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    useReactTable,
    getCoreRowModel,
    flexRender,
    getPaginationRowModel,
    getFilteredRowModel
} from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const SupplierListTable = () => {
    const [data, setData] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId
            if (!tenantId) return

            const res = await axiosInstance.get(`${API_BASE_URL}/api/v1/proveedores?tenantId=${tenantId}`)
            setData(res.data)
        } catch (error) {
            console.error('Error loading suppliers', error)
        }
    }

    const columnHelper = createColumnHelper<any>()
    const columns = useMemo(() => [
        columnHelper.accessor('numeroDocumento', {
            header: 'Documento',
            cell: info => <Typography>{info.getValue()}</Typography>
        }),
        columnHelper.accessor('razonSocial', {
            header: 'Razón Social',
            cell: info => <Typography className="font-medium">{info.getValue()}</Typography>
        }),
        columnHelper.accessor('email', {
            header: 'Email',
            cell: info => info.getValue() || '-'
        }),
        columnHelper.accessor('telefono', {
            header: 'Teléfono',
            cell: info => info.getValue() || '-'
        }),
        columnHelper.accessor('ciudad', { header: 'Ciudad' }),
        columnHelper.accessor('activo', {
            header: 'Estado',
            cell: info => (
                <Chip
                    label={info.getValue() ? 'Activo' : 'Inactivo'}
                    color={info.getValue() ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                />
            )
        }),
        columnHelper.accessor('id', {
            header: 'Acciones',
            cell: info => (
                <div className="flex gap-2">
                    <Tooltip title="Editar">
                        <IconButton onClick={() => router.push(`/compras/proveedores/form/${info.getValue()}`)}>
                            <i className="tabler-edit text-textSecondary" />
                        </IconButton>
                    </Tooltip>
                </div>
            )
        })
    ], [])

    const table = useReactTable({
        data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    return (
        <Card>
            <CardHeader title="Proveedores" action={
                <Button variant="contained" startIcon={<i className="tabler-plus" />} onClick={() => router.push('/compras/proveedores/form')}>
                    Nuevo Proveedor
                </Button>
            } />
            <div className="p-4">
                <CustomTextField
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder="Buscar proveedor..."
                    fullWidth
                    className="max-w-xs"
                />
            </div>
            <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(hg => (
                            <tr key={hg.id}>
                                {hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
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
                onPageChange={(_, page) => table.setPageIndex(page)}
            />
        </Card>
    )
}

export default SupplierListTable
