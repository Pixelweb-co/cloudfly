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

const SupportDocumentListTable = () => {
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

            const res = await axiosInstance.get(`${API_BASE_URL}/api/v1/documentos-soporte?tenantId=${tenantId}`)
            setData(res.data)
        } catch (error) {
            console.error('Error loading documents', error)
        }
    }

    const columnHelper = createColumnHelper<any>()
    const columns = useMemo(() => [
        columnHelper.accessor('numeroDocumento', {
            header: 'Número',
            cell: info => <Typography className="font-bold">{info.getValue()}</Typography>
        }),
        columnHelper.accessor('proveedorRazonSocial', { header: 'Proveedor' }),
        columnHelper.accessor('fecha', { header: 'Fecha' }),
        columnHelper.accessor('total', {
            header: 'Total',
            cell: info => `$${info.getValue().toFixed(2)}`
        }),
        columnHelper.accessor('estado', {
            header: 'Estado',
            cell: info => {
                const status = info.getValue()
                let color: "default" | "success" | "warning" | "error" = 'default'
                if (status === 'APROBADO' || status === 'ENVIADO') color = 'success'
                if (status === 'BORRADOR') color = 'warning'
                return <Chip label={status} color={color} size="small" variant="outlined" />
            }
        }),
        columnHelper.accessor('mensajeDian', { header: 'Respuesta DIAN' }),
        columnHelper.accessor('id', {
            header: 'Acciones',
            cell: info => (
                <div className="flex gap-2">
                    <Tooltip title="Ver Detalles">
                        <IconButton onClick={() => router.push(`/compras/documentos-soporte/form/${info.getValue()}`)}>
                            <i className="tabler-eye text-textSecondary" />
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
            <CardHeader title="Documentos Soporte" action={
                <Button variant="contained" startIcon={<i className="tabler-plus" />} onClick={() => router.push('/compras/documentos-soporte/form')}>
                    Nuevo Documento
                </Button>
            } />
            <div className="p-4">
                <CustomTextField
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
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

export default SupportDocumentListTable
