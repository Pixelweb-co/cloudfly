'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import classnames from 'classnames'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnDef,
    type FilterFn
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import { SubscriptionResponse, SubscriptionStatus, BillingCycle } from '@/types/subscriptions'
import subscriptionService from '@/services/subscriptions/subscriptionService'
import { toast } from 'react-hot-toast'

const columnHelper = createColumnHelper<SubscriptionResponse>()

const SubscriptionListTable = () => {
    const router = useRouter()
    const [data, setData] = useState<SubscriptionResponse[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [subscriptionToCancel, setSubscriptionToCancel] = useState<number | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const subscriptions = await subscriptionService.getActiveSubscriptions()
            setData(subscriptions)
        } catch (error) {
            console.error('Error fetching subscriptions:', error)
            toast.error('Error al cargar suscripciones')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCancelClick = (id: number) => {
        setSubscriptionToCancel(id)
        setDeleteDialogOpen(true)
    }

    const handleCancelConfirm = async () => {
        if (subscriptionToCancel === null) return

        try {
            await subscriptionService.cancelSubscription(subscriptionToCancel)
            toast.success('Suscripción cancelada exitosamente')
            setDeleteDialogOpen(false)
            setSubscriptionToCancel(null)
            fetchData()
        } catch (error) {
            console.error('Error canceling subscription:', error)
            toast.error('Error al cancelar suscripción')
            setDeleteDialogOpen(false)
        }
    }

    const handleCancelDecline = () => {
        setDeleteDialogOpen(false)
        setSubscriptionToCancel(null)
    }

    const handleRenew = async (id: number) => {
        try {
            await subscriptionService.renewSubscription(id)
            toast.success('Suscripción renovada exitosamente')
            fetchData()
        } catch (error) {
            console.error('Error renewing subscription:', error)
            toast.error('Error al renovar suscripción')
        }
    }

    const handleCreate = () => {
        router.push('/administracion/suscripciones/nueva')
    }

    const handleEdit = (id: number) => {
        router.push(`/administracion/suscripciones/${id}/editar`)
    }

    const getStatusColor = (status: SubscriptionStatus) => {
        switch (status) {
            case SubscriptionStatus.ACTIVE:
                return 'success'
            case SubscriptionStatus.CANCELLED:
                return 'error'
            case SubscriptionStatus.EXPIRED:
                return 'warning'
            case SubscriptionStatus.SUSPENDED:
                return 'secondary'
            default:
                return 'default'
        }
    }

    const getBillingCycleLabel = (cycle: BillingCycle) => {
        switch (cycle) {
            case BillingCycle.MONTHLY:
                return 'Mensual'
            case BillingCycle.QUARTERLY:
                return 'Trimestral'
            case BillingCycle.SEMI_ANNUAL:
                return 'Semestral'
            case BillingCycle.ANNUAL:
                return 'Anual'
            case BillingCycle.CUSTOM:
                return 'Personalizado'
            default:
                return cycle
        }
    }

    const columns = useMemo<ColumnDef<SubscriptionResponse, any>[]>(
        () => [
            columnHelper.accessor('tenantName', {
                header: 'Tenant',
                cell: ({ row }) => (
                    <div>
                        <Typography color='text.primary' className='font-medium'>
                            {row.original.tenantName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                            ID: {row.original.tenantId}
                        </Typography>
                    </div>
                )
            }),
            columnHelper.accessor('planName', {
                header: 'Plan',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.planName}
                        size='small'
                        variant='tonal'
                        color='primary'
                    />
                )
            }),
            columnHelper.accessor('billingCycle', {
                header: 'Ciclo',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {getBillingCycleLabel(row.original.billingCycle)}
                    </Typography>
                )
            }),
            columnHelper.accessor('moduleNames', {
                header: 'Módulos',
                cell: ({ row }) => (
                    <Chip
                        label={`${row.original.moduleNames.length} módulos`}
                        size='small'
                        variant='tonal'
                        color='info'
                        icon={<i className='tabler-apps' />}
                    />
                ),
                size: 120
            }),
            columnHelper.accessor('startDate', {
                header: 'Inicio',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {new Date(row.original.startDate).toLocaleDateString('es-CO')}
                    </Typography>
                )
            }),
            columnHelper.accessor('endDate', {
                header: 'Fin',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        {new Date(row.original.endDate).toLocaleDateString('es-CO')}
                    </Typography>
                )
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status}
                        size='small'
                        variant='tonal'
                        color={getStatusColor(row.original.status)}
                    />
                ),
                size: 100
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center gap-1'>
                        {row.original.status === SubscriptionStatus.ACTIVE && (
                            <>
                                <IconButton
                                    size='small'
                                    onClick={() => handleEdit(row.original.id)}
                                    title='Gestionar'
                                >
                                    <i className='tabler-settings text-textSecondary' />
                                </IconButton>
                                <IconButton
                                    size='small'
                                    onClick={() => handleCancelClick(row.original.id)}
                                    title='Cancelar'
                                >
                                    <i className='tabler-ban text-error' />
                                </IconButton>
                            </>
                        )}
                        {row.original.status === SubscriptionStatus.EXPIRED && (
                            <IconButton
                                size='small'
                                onClick={() => handleRenew(row.original.id)}
                                title='Renovar'
                            >
                                <i className='tabler-refresh text-success' />
                            </IconButton>
                        )}
                    </div>
                ),
                size: 120
            })
        ],
        [router]
    )

    const table = useReactTable({
        data,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            globalFilter
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        initialState: {
            pagination: {
                pageSize: 10
            }
        }
    })

    return (
        <Card>
            <CardHeader
                title='Suscripciones Activas'
                subheader='Gestiona las suscripciones de los tenants'
                className='pbe-4'
            />
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
                    <CustomTextField
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder='Buscar...'
                        className='max-sm:is-full'
                    />
                    <Button
                        variant='contained'
                        startIcon={<i className='tabler-plus' />}
                        onClick={handleCreate}
                        className='max-sm:is-full'
                    >
                        Nueva Suscripción
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
                    {table.getFilteredRowModel().rows.length === 0 ? (
                        <tbody>
                            <tr>
                                <td colSpan={table.getVisibleFlatColumns().length} className='text-center p-4'>
                                    {isLoading ? 'Cargando...' : 'No hay suscripciones disponibles'}
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody>
                            {table
                                .getRowModel()
                                .rows.slice(0, table.getState().pagination.pageSize)
                                .map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    )}
                </table>
            </div>
            <TablePagination
                component={() => <TablePaginationComponent table={table as any} />}
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => table.setPageIndex(page)}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title='Cancelar Suscripción'
                message='¿Estás seguro de que deseas cancelar esta suscripción? El tenant perderá acceso a sus módulos.'
                confirmText='Cancelar Suscripción'
                cancelText='No, mantener'
                confirmColor='error'
                onConfirm={handleCancelConfirm}
                onCancel={handleCancelDecline}
            />
        </Card>
    )
}

export default SubscriptionListTable
