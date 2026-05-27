'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Box, Tooltip, IconButton } from '@mui/material'
import { AccountingVoucherModal } from '@/components/accounting/AccountingVoucherModal'

const CreditNoteListTable = () => {
    const [accountingModalOpen, setAccountingModalOpen] = useState(false)
    const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)

    const handleViewAccounting = (voucherId: number) => {
        setSelectedVoucherId(voucherId)
        setAccountingModalOpen(true)
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Lista de Notas de Crédito
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

export default CreditNoteListTable
