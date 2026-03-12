'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { toast } from 'react-hot-toast'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import { companyService } from '@/services/companies/companyService'
import type { CompanyDTO } from '@/types/companies'
import CompanyForm from '../CompanyForm'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const columnHelper = createColumnHelper<CompanyDTO>()

const CompanyListTable = () => {
    const [data, setData] = useState<CompanyDTO[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [companyToDelete, setCompanyToDelete] = useState<number | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [selectedCompany, setSelectedCompany] = useState<CompanyDTO | undefined>(undefined)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const companies = await companyService.getAllCompanies()
            setData(companies)
        } catch (error) {
            console.error('Error fetching companies:', error)
            toast.error('Error al cargar compañías')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDeleteClick = (id: number) => {
        setCompanyToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (companyToDelete === null) return
        try {
            await companyService.deleteCompany(companyToDelete)
            toast.success('Compañía eliminada exitosamente')
            setDeleteDialogOpen(false)
            setCompanyToDelete(null)
            fetchData()
        } catch (error) {
            console.error('Error deleting company:', error)
            toast.error('Error al eliminar compañía')
            setDeleteDialogOpen(false)
        }
    }

    const handleCreate = () => {
        setSelectedCompany(undefined)
        setFormOpen(true)
    }

    const handleEdit = (company: CompanyDTO) => {
        setSelectedCompany(company)
        setFormOpen(true)
    }

    const columns = useMemo<ColumnDef<CompanyDTO, any>[]>(
        () => [
            columnHelper.accessor('name', {
                header: 'Nombre',
                cell: ({ row }) => (
                    <div>
                        <Typography color='text.primary' className='font-medium'>
                            {row.original.name}
                        </Typography>
                        {row.original.isPrincipal && (
                            <Chip label='Principal' size='small' color='primary' variant='tonal' className='mt-1' />
                        )}
                    </div>
                )
            }),
            columnHelper.accessor('nit', {
                header: 'NIT',
                cell: ({ row }) => <Typography color='text.secondary'>{row.original.nit}</Typography>
            }),
            columnHelper.accessor('phone', {
                header: 'Teléfono',
                cell: ({ row }) => <Typography color='text.secondary'>{row.original.phone || '-'}</Typography>
            }),
            columnHelper.accessor('status', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status ? 'Activo' : 'Inactivo'}
                        size='small'
                        variant='tonal'
                        color={row.original.status ? 'success' : 'secondary'}
                    />
                )
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center gap-1'>
                        <IconButton size='small' onClick={() => handleEdit(row.original)} title='Editar'>
                            <i className='tabler-edit text-textSecondary' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDeleteClick(row.original.id)} title='Eliminar'>
                            <i className='tabler-trash text-textSecondary' />
                        </IconButton>
                    </div>
                )
            })
        ],
        []
    )

    const table = useReactTable({
        data,
        columns,
        filterFns: { fuzzy: fuzzyFilter },
        state: { globalFilter },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        initialState: { pagination: { pageSize: 10 } }
    })

    return (
        <>
            <Card>
                <CardHeader
                    title='Mis Compañías'
                    subheader='Gestiona las sedes o empresas de tu organización'
                    action={
                        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleCreate}>
                            Nueva Compañía
                        </Button>
                    }
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
                    <CustomTextField
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder='Buscar compañía...'
                        className='max-sm:is-full'
                    />
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
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className='text-center p-4'>Cargando...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className='text-center p-4'>No hay compañías registradas</td>
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
                    component={() => <TablePaginationComponent table={table as any} />}
                    count={table.getFilteredRowModel().rows.length}
                    rowsPerPage={table.getState().pagination.pageSize}
                    page={table.getState().pagination.pageIndex}
                    onPageChange={(_, page) => table.setPageIndex(page)}
                />
            </Card>

            <CompanyForm
                open={formOpen}
                setOpen={setFormOpen}
                company={selectedCompany}
                refreshData={fetchData}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
                title='Eliminar Compañía'
                message='¿Estás seguro de que deseas eliminar esta compañía? Esta acción no se puede deshacer.'
                confirmText='Eliminar'
                confirmColor='error'
            />
        </>
    )
}

export default CompanyListTable
