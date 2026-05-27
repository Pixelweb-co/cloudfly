'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'

import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

// Third-party Importss
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
import type { CheckTemplateType } from '@/types/apps/checkTemplateType'

import ChecktemplateForm from '@/components/dialogs/form-checklist/index'

// Component Imports
import TableFilters from './TableFilters'

//import AddChecktemplateDrawer from './AddChecktemplateDrawer'

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

type ChecktemplateTypeWithAction = CheckTemplateType & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
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
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column Definitions
const columnHelper = createColumnHelper<ChecktemplateTypeWithAction>()

const ChecktemplatesListTable = ({ reload, tableData }: any) => {
  // States
  // const [addChecktemplateOpen, setAddChecktemplateOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loadForm, setLoadForm] = useState(false)
  const router = useRouter()

  const columns = useMemo<ColumnDef<ChecktemplateTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('checktemplateName', {
        header: 'Nombre',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.checktemplateName}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('model', {
        header: 'Modelo',

        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.model}
          </Typography>
        )
      }),
      columnHelper.accessor('brand', {
        header: 'Marca',

        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.brand}
          </Typography>
        )
      }),

      columnHelper.accessor('checktemplateCode', {
        header: 'Serial',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.checktemplateCode}
          </Typography>
        )
      }),

      columnHelper.accessor('licensePlate', {
        header: 'Placa',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.licensePlate}
          </Typography>
        )
      }),
      columnHelper.accessor('location', {
        header: 'Sede',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.location}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() => {
                localStorage.removeItem('checktemplateview')
                console.log('asignando p', row.original)

                localStorage.setItem('checktemplateview', JSON.stringify(row.original))
                setTimeout(() => {
                  router.push('/checktemplateos/view')
                }, 500)
              }}
            >
              <i className='tabler-eye text-textSecondary' />
            </IconButton>

            <IconButton
              onClick={() => {
                console.log('row', row.original)
                setRowSelection(row.original)
                setLoadForm(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>

            <IconButton
              onClick={() =>
                setData(data?.filter((checktemplate: CheckTemplateType) => checktemplate.id !== row.original.id))
              }
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData]
  )

  useEffect(() => {
    console.log('data in table reload', tableData)
    setData(tableData)
  }, [tableData])

  const table = useReactTable({
    data: filteredData as CheckTemplateType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setFilteredData} tableData={data} />
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
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Buscar'
              className='max-sm:is-full'
            />
            {/* <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='max-sm:is-full'
            >
              Exportar
            </Button>

            <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-download' />}
              className='max-sm:is-full'
            >
              Importar
            </Button> */}

            <Button
              onClick={() => {
                setLoadForm(true)
                setRowSelection({
                  id: undefined,
                  checktemplateType: '',
                  checktemplateCode: '',
                  checktemplateName: '',
                  brand: '',
                  model: '',
                  licensePlate: '',
                  checktemplateClass: '',
                  classification: '',
                  clientId: null,
                  status: '1',
                  dateAdded: null,
                  inventoryRegister: '',
                  origin: '',
                  voltage: '',
                  power: '',
                  frequency: '',
                  amperage: '',
                  purchaseDate: '',
                  bookValue: 0,
                  supplier: '',
                  warranty: '',
                  warrantyStartDate: '',
                  warrantyEndDate: '',
                  manual: '',
                  periodicity: '',
                  location: '',
                  placement: ''
                })
              }}
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              className='max-sm:is-full'
            >
              Agregar checktemplateo
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
                        <>
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
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
      {/* <AddChecktemplateDrawer
        open={addChecktemplateOpen}
        handleClose={() => setAddChecktemplateOpen(!addChecktemplateOpen)}
        checktemplateData={data}
        setData={setData}
      /> */}

      <ChecktemplateForm
        open={loadForm}
        onClose={() => {
          setLoadForm(false)
          reload(true)

          setRowSelection({
            name: '',
            nit: '',
            phone: '',
            email: '',
            address: '',
            contact: '',
            position: '',
            type: '',
            fhcinicial: '',
            fchfinal: '',
            descripcion: '',
            status: '1'
          })
        }}
        setOpen={() => setLoadForm(true)}
        rowSelect={rowSelection}
      />
    </>
  )
}

export default ChecktemplatesListTable
