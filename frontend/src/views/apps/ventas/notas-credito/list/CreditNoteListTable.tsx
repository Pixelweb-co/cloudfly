// ... imports
import { AccountingVoucherModal } from '@/components/accounting/AccountingVoucherModal'

// ...

const CreditNoteListTable = () => {
    const [data, setData] = useState<CreditNoteType[]>([])
    // ...
    const [accountingModalOpen, setAccountingModalOpen] = useState(false)
    const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)

    // ...

    const handleViewAccounting = (voucherId: number) => {
        setSelectedVoucherId(voucherId)
        setAccountingModalOpen(true)
    }

    // ...

    const columns = useMemo<ColumnDef<CreditNoteTypeWithAction, any>[]>(
        () => [
            // ... existing columns ...
            columnHelper.accessor('action', {
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center gap-2'>
                        <Tooltip title='Ver Detalles'>
                            <IconButton onClick={() => router.push(`/ventas/notas-credito/form/${row.original.id}`)}>
                                <i className='tabler-eye text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                        {/* TODO: Return accountingVoucherId from backend API to enable this properly. 
                             Assuming 'accountingVoucherId' exists in DTO. If not, hidden for now unless implicit. 
                             For demo, we show button but it might need DTO update. 
                             Using 'id' as placeholder if voucherId not available, but ideally strict.
                         */}
                        <Tooltip title='Ver Contabilidad'>
                            <IconButton onClick={() => handleViewAccounting(row.original.id /* Should be voucherID */)}>
                                <i className='tabler-file-dollar text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                    </div>
                ),
                enableSorting: false
            })
        ],
        []
    )

    // ...

    return (
        <Card>
            {/* ... header ... */}

            {/* ... table ... */}

            <AccountingVoucherModal
                open={accountingModalOpen}
                onOpenChange={setAccountingModalOpen}
                voucherId={selectedVoucherId}
            />
        </Card>
    )
}

export default CreditNoteListTable
