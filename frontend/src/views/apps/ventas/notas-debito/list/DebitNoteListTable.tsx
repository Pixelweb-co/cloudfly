'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
    createColumnHelper,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel
} from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'
import { AccountingVoucherModal } from '@/components/accounting/AccountingVoucherModal'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const DebitNoteListTable = () => {
    const [data] = useState([])
    const [accountingModalOpen, setAccountingModalOpen] = useState(false)
    const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)

    const columnHelper = createColumnHelper<any>()
    const columns = [
        columnHelper.accessor('id', { header: 'ID' })
    ]

    const table = useReactTable({
        data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    return (
        <Card>
            <CardContent>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Lista de Notas de Débito
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Componente en desarrollo
                    </Typography>
                </Box>

                <AccountingVoucherModal
                    open={accountingModalOpen}
                    onOpenChange={setAccountingModalOpen}
                    voucherId={selectedVoucherId}
                />
            </CardContent>
        </Card>
    )
}

export default DebitNoteListTable
