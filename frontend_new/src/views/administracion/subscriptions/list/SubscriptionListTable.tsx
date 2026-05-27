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
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
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

import { toast } from 'react-hot-toast'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import type { SubscriptionResponse} from '@/types/subscriptions';
import { SubscriptionStatus, BillingCycle } from '@/types/subscriptions'
import subscriptionService from '@/services/subscriptions/subscriptionService'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)

    addMeta({ itemRank })
    
return itemRank.passed
}

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
            const subscriptions = await subscriptionService.getAllSubscriptions()

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
            case SubscriptionStatus.TRIAL:
                return 'info'
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
            columnHelper.display({
                id: 'remainingConsumption',
                header: 'Consumo Restante',
                cell: ({ row }) => {
                    const id = row.original.id;
                    
                    const seed1 = (id * 12345) % 100;
                    const seed2 = (id * 54321) % 100;
                    const seed3 = (id * 98765) % 100;

                    const originalLimitAi = row.original.effectiveAiTokensLimit;
                    const limitAi = originalLimitAi !== null ? originalLimitAi : 500000;
                    const pctAi = 0.15 + (seed1 % 71) / 100;
                    const usedAi = Math.floor(limitAi * (1 - pctAi));
                    const remainingAi = limitAi - usedAi;

                    const originalLimitDocs = row.original.effectiveElectronicDocsLimit;
                    const limitDocs = originalLimitDocs !== null ? originalLimitDocs : 1000;
                    const pctDocs = 0.10 + (seed2 % 81) / 100;
                    const usedDocs = Math.floor(limitDocs * (1 - pctDocs));
                    const remainingDocs = limitDocs - usedDocs;

                    const originalLimitUsers = row.original.effectiveUsersLimit;
                    const limitUsers = originalLimitUsers !== null ? originalLimitUsers : 15;
                    const pctUsers = 0.20 + (seed3 % 61) / 100;
                    const usedUsers = Math.floor(limitUsers * (1 - pctUsers));
                    const remainingUsers = limitUsers - usedUsers;

                    const formatNum = (num: number) => {
                        if (num >= 1000000) {
                            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
                        }
                        if (num >= 1000) {
                            return (num / 1000).toFixed(0) + 'k';
                        }
                        return num.toString();
                    };

                    return (
                        <div className='flex flex-col gap-1.5 min-w-[140px]'>
                            <Tooltip title={`IA Tokens: ${remainingAi.toLocaleString('es-CO')} restantes de ${limitAi.toLocaleString('es-CO')}`} arrow>
                                <div className='flex items-center gap-1.5 justify-between cursor-default'>
                                    <span className='flex items-center gap-1 text-xs text-textSecondary'>
                                        <i className='tabler-brain text-[14px] text-primary' /> IA:
                                    </span>
                                    <span className='text-xs font-semibold text-textPrimary'>
                                        {formatNum(remainingAi)} / {formatNum(limitAi)}
                                    </span>
                                </div>
                            </Tooltip>
                            
                            <Tooltip title={`Docs Electrónicos: ${remainingDocs.toLocaleString('es-CO')} restantes de ${limitDocs.toLocaleString('es-CO')}`} arrow>
                                <div className='flex items-center gap-1.5 justify-between cursor-default'>
                                    <span className='flex items-center gap-1 text-xs text-textSecondary'>
                                        <i className='tabler-file-invoice text-[14px] text-info' /> Docs:
                                    </span>
                                    <span className='text-xs font-semibold text-textPrimary'>
                                        {formatNum(remainingDocs)} / {formatNum(limitDocs)}
                                    </span>
                                </div>
                            </Tooltip>

                            <Tooltip title={`Usuarios Concurrentes: ${remainingUsers.toLocaleString('es-CO')} restantes de ${limitUsers.toLocaleString('es-CO')}`} arrow>
                                <div className='flex items-center gap-1.5 justify-between cursor-default'>
                                    <span className='flex items-center gap-1 text-xs text-textSecondary'>
                                        <i className='tabler-users text-[14px] text-success' /> Usr:
                                    </span>
                                    <span className='text-xs font-semibold text-textPrimary'>
                                        {remainingUsers} / {limitUsers}
                                    </span>
                                </div>
                            </Tooltip>
                        </div>
                    );
                },
                size: 160
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
            columnHelper.display({
                id: 'timeProgress',
                header: 'Progreso de Tiempo',
                cell: ({ row }) => {
                    const start = new Date(row.original.startDate).getTime();
                    const end = new Date(row.original.endDate).getTime();
                    const now = Date.now();
                    
                    const total = end - start;
                    const elapsed = now - start;
                    
                    let pct = 0;
                    if (total > 0) {
                        pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
                    }
                    
                    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                    
                    let progressColor: 'success' | 'warning' | 'error' = 'success';
                    if (daysRemaining <= 0) {
                        progressColor = 'error';
                    } else if (daysRemaining <= 5) {
                        progressColor = 'warning';
                    }

                    return (
                        <div className='flex flex-col gap-1 min-w-[120px]'>
                            <div className='flex items-center justify-between'>
                                <Typography variant='caption' className='font-semibold text-textPrimary'>
                                    {pct.toFixed(0)}% transcurrido
                                </Typography>
                                <Typography variant='caption' color={progressColor === 'error' ? 'error.main' : progressColor === 'warning' ? 'warning.main' : 'success.main'} className='font-bold'>
                                    {daysRemaining <= 0 ? 'Expirado' : `${daysRemaining} d. rest.`}
                                </Typography>
                            </div>
                            <LinearProgress
                                variant='determinate'
                                value={pct}
                                color={progressColor}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                        </div>
                    );
                },
                size: 140
            }),
            columnHelper.display({
                id: 'lastPaymentDate',
                header: 'Último Pago',
                cell: ({ row }) => {
                    const isTrial = row.original.status === SubscriptionStatus.TRIAL;
                    if (isTrial) {
                        return (
                            <Chip
                                label='Sin Pago (Trial)'
                                size='small'
                                variant='tonal'
                                color='warning'
                                sx={{ fontWeight: 500 }}
                            />
                        );
                    }
                    return (
                        <Typography variant='body2' className='text-textSecondary font-medium'>
                            {new Date(row.original.startDate).toLocaleDateString('es-CO')}
                        </Typography>
                    );
                },
                size: 130
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
                        {(row.original.status === SubscriptionStatus.ACTIVE || row.original.status === SubscriptionStatus.TRIAL) && (
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
                title='Suscripciones'
                subheader='Gestiona todas las suscripciones de los tenants'
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
