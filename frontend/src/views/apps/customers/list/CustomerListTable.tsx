'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import type { CustomersType } from '@/types/customers'
import ClienteForm from '@/components/dialogs/form-customer'

// Component Imports
import TableFilters from './TableFilters'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type CustomersTypeWithAction = CustomersType & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)
    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper<CustomersTypeWithAction>()

const CustomersListTable = ({ reload, tableData }: any) => {
  const [loadForm, setOpenForm] = useState(false)
  const [rowSelection, setRowSelection] = useState<any>({
    name: '',
    nit: '',
    phone: '',
    email: '',
    address: '',
    contact: '',
    position: '',
    type: '',
    status: '1',
    esEmisorFE: false,
    esEmisorPrincipal: false,
    tipoDocumentoDian: '',
    digitoVerificacion: '',
    razonSocial: '',
    nombreComercial: '',
    responsabilidadesFiscales: '',
    regimenFiscal: '',
    codigoDaneCiudad: '',
    ciudadDian: '',
    codigoDaneDepartamento: '',
    departamentoDian: '',
    contrato: {
      fechaInicio: '',
      fechaFinal: '',
      descripcionContrato: '',
      estado: 1
    }
  })

  const [data, setData] = useState<CustomersType[]>(tableData)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<CustomersTypeWithAction, any>[]>(
    () => [
      // 1. CLIENTE
      columnHelper.accessor('name', {
        header: 'Cliente',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium' sx={{ fontWeight: 600 }}>
              {row.original.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.contact}
            </Typography>
          </div>
        )
      }),

      // 2. IDENTIFICACIÓN / DIAN
      columnHelper.accessor('nit', {
        header: 'Identificación DIAN',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2' className='font-medium'>
              {row.original.nit}
              {row.original.digitoVerificacion ? `-${row.original.digitoVerificacion}` : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
              {row.original.tipoDocumentoDian && (
                <Typography variant='caption' sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>
                  {row.original.tipoDocumentoDian === '31' ? 'NIT' : 'CC'}
                </Typography>
              )}
              {row.original.esEmisorFE && (
                <Chip label="Emisor FE" color="primary" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </Box>
          </div>
        )
      }),

      // 3. CONTACTO
      columnHelper.accessor('email', {
        header: 'Contacto',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2' noWrap>{row.original.email}</Typography>
            <Typography variant='caption'>{row.original.phone}</Typography>
          </div>
        )
      }),

      // 4. UBICACIÓN
      columnHelper.accessor('ciudadDian', {
        header: 'Ubicación',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2'>{row.original.ciudadDian || row.original.address}</Typography>
            <Typography variant='caption'>{row.original.departamentoDian}</Typography>
          </div>
        )
      }),

      // 5. ESTADO
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: ({ row }) => (
          <Chip
            size='small'
            label={row.original.status ? 'Activo' : 'Inactivo'}
            color={row.original.status ? 'success' : 'secondary'}
            variant='tonal'
          />
        )
      }),

      // ACCIONES
      columnHelper.accessor('action', {
        header: 'Acción',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton
              size="small"
              onClick={() => {
                setRowSelection(row.original)
                setOpenForm(true)
              }}
            >
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
    data: filteredData as CustomersTypeWithAction[],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  useEffect(() => {
    setData(tableData)
    setFilteredData(tableData)
  }, [tableData])

  return (
    <>
      <ClienteForm
        open={loadForm}
        setOpen={() => setOpenForm(true)}
        onClose={() => {
          setOpenForm(false)
          if (reload) reload(true)
          setRowSelection({
            name: '', nit: '', phone: '', email: '', address: '', contact: '', position: '', type: '', status: '1',
            esEmisorFE: false, esEmisorPrincipal: false, tipoDocumentoDian: '', digitoVerificacion: '', razonSocial: '',
            nombreComercial: '', responsabilidadesFiscales: '', regimenFiscal: '', codigoDaneCiudad: '', ciudadDian: '',
            codigoDaneDepartamento: '', departamentoDian: '',
            contrato: { fechaInicio: '', fechaFinal: '', descripcionContrato: '', estado: 1 }
          })
        }}
        rowSelect={rowSelection}
      />

      <Card>
        <CardHeader title='Gestión de Clientes (DIAN)' className='flex flex-wrap gap-4' />
        <div className='flex items-center justify-between p-6 gap-4 border-bs'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Buscar Cliente, NIT, Email...'
            className='sm:is-auto'
          />
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setRowSelection({})
              setOpenForm(true)
            }}
          >
            Nuevo Cliente
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No hay clientes registrados
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
    </>
  )
}

export default CustomersListTable
