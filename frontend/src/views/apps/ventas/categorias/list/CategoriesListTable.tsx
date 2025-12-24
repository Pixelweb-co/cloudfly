'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
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
import dotenv from 'dotenv'

// Third-party Imports

import { toast } from 'react-toastify'

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

import TablePaginationComponent from '@components/TablePaginationComponent'
import type { CategoryType } from '@/types/apps/categoryType'

import CategoryForm from '@/components/dialogs/form-category'
import ColumnSelector from '@/components/ColumnSelector'

// Component Imports
import TableFilters from './TableFilters'

//import AddCategoryDrawer from './AddCategoryDrawer'

import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import CheckListForm from '@/components/dialogs/form-checklist'
import { userMethods } from '@/utils/userMethods'
import { Badge, Switch, Tooltip } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import ErrorDialog from '@/components/dialogs/ErrorDialog'
import ProgramacionMantenimiento from '@/components/dialogs/form-shedule/index'
import { describe } from 'node:test'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type CategoryTypeWithAction = CategoryType & {
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
const columnHelper = createColumnHelper<CategoryTypeWithAction>()

const CategoriesListTable = ({ reload, tableData }: any) => {
  // States
  // const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData.sort((a: any, b: any) => b.id - a.id))
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loadForm, setLoadForm] = useState(false)
  const [errorUpdateItem, setErrorUpdateItem] = useState<any | null>(null)
  const [errorDeleteItem, setErrorDeleteItem] = useState<any | null>(null)

  const [programacionModal, setProgramacionModal] = useState(false)

  const [loadFormCheck, setLoadFormCheck] = useState<any | null>(null)
  const router = useRouter()

  const categoryGetName = (id: number) => {
    const category = data.find((cat: CategoryType) => cat.id === id)
    return category ? category.nombreCategoria : 'Sin categoría'
  }

  const handleInputChange = async (id: number, value: any) => {
    console.log('value:', value)

    try {

      const res = await axiosInstance.put(`${API_BASE_URL}/categories/verification/${id}`, JSON.stringify({ verification: value }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("res.data", res.data)
      setErrorUpdateItem("Actualizada correctamente!")

      reload(true)

    } catch (error: any) {
      console.log('Actualizar la categoria:', error)
      setErrorUpdateItem(error.response.data)

    }


  }

  const deleteItem = async (id: any) => {

    try {

      const res = await axiosInstance.delete(`${API_BASE_URL}/categories/${id}`)

      //console.log("res.data", res.data)
      setErrorDeleteItem("Eliminada correctamente!")

      reload(true)

    } catch (error: any) {
      console.log('Eliminar la categoria:', error)
      setErrorDeleteItem(" Esta categoria no se puede eliminar, tiene mantenimientos/solicitudes programados")

    }

  }

  const columns = useMemo<ColumnDef<CategoryTypeWithAction, any>[]>(
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

      columnHelper.accessor('nombreCategoria', {
        header: 'Nombre',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.nombreCategoria}
          </Typography>
        )
      }),
      columnHelper.accessor('parentCategory', {
        header: 'Categoría Padre',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {categoryGetName(parseInt(row.original.parentCategory ? row.original.parentCategory.toString() : '0'))}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.status === '1' ? 'Activo' : 'Inactivo'}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>


            {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL') || userMethods.isRole('ADMIN')) ? (
              <Tooltip title='Editar'>
                <IconButton
                  onClick={() => {
                    console.log('row', row.original)
                    setRowSelection(row.original)
                    setLoadForm(true)
                  }}
                >
                  <i className='tabler-edit text-textSecondary' />
                </IconButton>
              </Tooltip>
            ) : null}
            {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL') || userMethods.isRole('ADMIN')) ? (
              <Tooltip title='Eliminar'>
                <IconButton onClick={() => deleteItem(row.original.id)}>
                  <i className='tabler-trash text-textSecondary' />
                </IconButton>
              </Tooltip>
            ) : null}

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
    data: filteredData as CategoryType[],
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
      },
      columnVisibility: {
        categoryName: true,    // Nombre
        status: true,          // Estado
        parentCategory: true, // Categoría padre
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

  useEffect(() => {
    console.log('columnas visibles ', table)
  }, [])

  return (
    <>
      <Card>
        <CardHeader title='Categorías' className='pbe-4' />
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

          <ColumnSelector table={table} />

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

            {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL') || userMethods.isRole('ADMIN')) && (
              <Button
                onClick={() => {
                  setLoadForm(true)
                  setRowSelection({
                    id: undefined,
                    nombreCategoria: '',
                    parentCategory: null,
                    description: '',
                    cliente: null,
                    status: '1',
                    dateAdded: null
                  })
                }}
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                className='max-sm:is-full'
              >
                Agregar categoria
              </Button>
            )}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <div className='px-1 border-b border-black'></div>

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
      {/* <AddCategoryDrawer
        open={addCategoryOpen}
        handleClose={() => setAddCategoryOpen(!addCategoryOpen)}
        categoryData={data}
        setData={setData}
      /> */}

      {loadForm && <CategoryForm
        open={loadForm}
        onClose={() => {
          setLoadForm(false)
          reload(true)

          setRowSelection({
            id: undefined,
            categoryName: '',
            parentCategory: null,
            description: '',
            cliente: null,
            status: '1',
            dateAdded: null
          })
        }}
        setOpen={() => setLoadForm(true)}
        rowSelect={rowSelection}
      />

      }

      {programacionModal && <ProgramacionMantenimiento
        open={programacionModal}
        onClose={() => setProgramacionModal(false)}
        onSuccess={() => reload(true)}
        rowSelect={rowSelection}
      />}

      {errorDeleteItem && <ErrorDialog entitYName='Eliminar categoria' open={errorDeleteItem} error={errorDeleteItem} setOpen={setErrorDeleteItem} />}

      {loadFormCheck && <CheckListForm
        open={loadFormCheck}
        onClose={() => setLoadFormCheck(false)}
        setOpen={() => setLoadFormCheck(true)}
        rowSelect={rowSelection}
      />
      }
    </>
  )
}

export default CategoriesListTable
