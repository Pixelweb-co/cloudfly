'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender, getPaginationRowModel } from '@tanstack/react-table'

import TablePaginationComponent from '@components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'

const DebitNoteListTable = () => {
    const [data, setData] = useState([])
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId
            if (!tenantId) return
            try {
                const res = await axiosInstance.get(`/api/v1/notas-debito?tenantId=${tenantId}`)
                setData(res.data)
            } catch (e) { console.error(e) }
        }
        load()
    }, [])

    const columnHelper = createColumnHelper<any>()
    const columns = useMemo(() => [
        columnHelper.accessor('consecutive', { header: 'Consecutivo' }),
        columnHelper.accessor('invoiceNumber', { header: 'Fac. Ref' }),
        columnHelper.accessor('issueDate', { header: 'Fecha', cell: info => new Date(info.getValue()).toLocaleDateString() }),
        columnHelper.accessor('total', { header: 'Total', cell: info => `$${info.getValue().toFixed(2)}` }),
        columnHelper.accessor('status', { header: 'Estado' }),
        columnHelper.accessor('dianStatus', { header: 'DIAN', cell: info => info.getValue() || '-' }),
        columnHelper.accessor('id', {
            header: 'Acciones',
            cell: info => (
                <IconButton onClick={() => router.push(`/ventas/notas-debito/form/${info.getValue()}`)}>
                    <i className="tabler-eye" />
                </IconButton>
            )
        })
    ], [])

    const table = useReactTable({
        data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel()
    })

    return (
        <Card>
            <CardHeader title="Notas de Débito" action={
                <Button variant="contained" onClick={() => router.push('/ventas/notas-debito/form')}>
                    Nueva Nota Débito
                </Button>
            } />
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
        </Card>
    )
}

export default DebitNoteListTable
