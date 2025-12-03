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
import type { ProductType } from '@/types/apps/productType'

import ProductoForm from '@/components/dialogs/form-product'
import ColumnSelector from '@/components/ColumnSelector'

// Component Imports
import TableFilters from './TableFilters'

//import AddProductDrawer from './AddProductDrawer'

import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import CheckListForm from '@/components/dialogs/form-checklist'
import { userMethods } from '@/utils/userMethods'
import { Badge, Switch, Tooltip } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'
import ErrorDialog from '@/components/dialogs/ErrorDialog'
import ProgramacionMantenimiento from '@/components/dialogs/form-shedule/index'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type ProductTypeWithAction = ProductType & {
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
const columnHelper = createColumnHelper<ProductTypeWithAction>()

const ProductsListTable = ({ reload, tableData }: any) => {
  // States
  // const [addProductOpen, setAddProductOpen] = useState(false)
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

  const handleInputChange = async (id: number, value: any) => {
    console.log('value:', value)

    try {
      const res = await axiosInstance.put(
        `${API_BASE_URL}/products/verification/${id}`,
        JSON.stringify({ verification: value }),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('res.data', res.data)
      setErrorUpdateItem('Actualizado correctamente!')

      reload(true)
    } catch (error: any) {
      console.log('Actualizar el producto:', error)
      setErrorUpdateItem(error.response.data)
    }
  }

  const deleteItem = async (id: any) => {
    try {
      const res = await axiosInstance.delete(`${API_BASE_URL}/products/${id}`)

      //console.log("res.data", res.data)
      setErrorDeleteItem('Eliminado correctamente!')

      reload(true)
    } catch (error: any) {
      console.log('Eliminar el producto:', error)
      setErrorDeleteItem(' Este equipo no se puede eliminar, tiene mantenimientos/solicitudes programados')
    }
  }

  const columns = useMemo<ColumnDef<ProductTypeWithAction, any>[]>(
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

      // SKU -> usa campo sku
      columnHelper.accessor('sku' as any, {
        header: 'SKU',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {(row.original as any).sku}
          </Typography>
        )
      }),

      // Nombre -> usa productName
      columnHelper.accessor('productName' as any, {
        header: 'Nombre',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {(row.original as any).productName}
          </Typography>
        )
      }),

      // Categoría (por ahora mostramos brand, si lo usas como marca/categoría comercial)
      columnHelper.accessor('brand' as any, {
        header: 'Categoría',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {(row.original as any).brand}
          </Typography>
        )
      }),

      // Valor Venta -> price
      columnHelper.accessor('price' as any, {
        header: 'Valor Venta',
        cell: ({ row }) => {
          const value = (row.original as any).price

          return (
            <Typography className='font-medium' color='text.primary'>
              {value !== null && value !== undefined
                ? Number(value).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                  })
                : '-'}
            </Typography>
          )
        }
      }),

      // Stock -> inventoryQty
      columnHelper.accessor('inventoryQty' as any, {
        header: 'Stock',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {(row.original as any).inventoryQty ?? 0}
          </Typography>
        )
      }),

      // Tipo de producto -> productType (0..5)
      columnHelper.accessor('productType' as any, {
        header: 'Tipo de producto',
        cell: ({ row }) => {
          const type = (row.original as any).productType || '0'
          const map: Record<string, string> = {
            '0': 'Producto simple',
            '1': 'Producto agrupado',
            '2': 'Producto con variantes',
            '3': 'Servicio',
            '4': 'Prod. Suscripción / Alquiler',
            '5': 'Serv. Suscripción / Alquiler'
          }

          return (
            <Typography className='font-medium' color='text.primary'>
              {map[type] || type}
            </Typography>
          )
        }
      }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            {(userMethods.isRole('SUPERADMIN') ||
              userMethods.isRole('BIOMEDICAL') ||
              userMethods.isRole('ADMIN')) && (
              <Tooltip title='Lista de checkeo'>
                <IconButton
                  onClick={() => {
                    setRowSelection(row.original)
                    setLoadFormCheck(true)
                  }}
                >
                  <i className='tabler-list text-textSecondary' />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title='Hoja de vida'>
              <IconButton
                onClick={() => {
                  localStorage.removeItem('productview')
                  console.log('asignando p', row.original)

                  localStorage.setItem('productview', JSON.stringify(row.original))
                  setTimeout(() => {
                    router.push('/productos/view')
                  }, 500)
                }}
              >
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>
            {userMethods.isRole('SUPERADMIN') ||
            userMethods.isRole('BIOMEDICAL') ||
            userMethods.isRole('ADMIN') ? (
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
            {userMethods.isRole('SUPERADMIN') ||
            userMethods.isRole('BIOMEDICAL') ||
            userMethods.isRole('ADMIN') ? (
              <Tooltip title='Eliminar'>
                <IconButton onClick={() => deleteItem(row.original.id)}>
                  <i className='tabler-trash text-textSecondary' />
                </IconButton>
              </Tooltip>
            ) : null}
            {userMethods.isRole('SUPERADMIN') ||
            userMethods.isRole('BIOMEDICAL') ||
            userMethods.isRole('ADMIN') ? (
              <>
                <Tooltip title='Programación de mantenimiento'>
                  <IconButton
                    onClick={() => {
                      setRowSelection(row.original)
                      setProgramacionModal(true)
                    }}
                  >
                    <i className='tabler-calendar text-textSecondary' />
                  </IconButton>
                </Tooltip>

                {row && row.original && (row.original.schedules?.length ?? 0) > 0 && (
                  <Tooltip title='Equipo programado'>
                    <Badge variant='dot' color='success' className='ml-4'>
                      <i className='tabler-dot' />
                    </Badge>
                  </Tooltip>
                )}
              </>
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
    setFilteredData(tableData)
  }, [tableData])

  const table = useReactTable({
    data: filteredData as ProductType[],
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
        sku: true, // SKU
        productName: true, // Nombre
        brand: true, // Categoría/Marca
        price: true, // Valor Venta
        inventoryQty: true, // Stock
        select: true, // Checkbox column
        action: true, // Action column
        productType: true // Tipo de producto
        // el resto de campos viejos los puedes limpiar luego si no los usas
      }
    },
    enableRowSelection: true, //enable row selection for all rows
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
        <CardHeader title='Inventario' className='pbe-4' />
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

            {(userMethods.isRole('SUPERADMIN') ||
              userMethods.isRole('BIOMEDICAL') ||
              userMethods.isRole('ADMIN')) && (
              <Button
                onClick={() => {
                  localStorage.setItem(
                    'productview',
                    JSON.stringify({
                      id: null,
                      tenantId: null,
                      productName: '',
                      description: '',
                      productType: '0',
                      price: '',
                      salePrice: '',
                      sku: '',
                      barcode: '',
                      manageStock: false,
                      inventoryStatus: 'IN_STOCK',
                      allowBackorders: 'NO',
                      inventoryQty: '',
                      soldIndividually: false,
                      weight: '',
                      dimensions: '',
                      upsellProducts: '',
                      crossSellProducts: '',
                      status: 'ACTIVE',
                      brand: '',
                      model: '',
                      categoryIds: [],
                      imageIds: []
                    })
                  )
                  setTimeout(() => {
                    router.push('/ventas/productos/form')
                  }, 500)
                }}
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                className='max-sm:is-full'
              >
                Agregar producto
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
      {/* <AddProductDrawer
        open={addProductOpen}
        handleClose={() => setAddProductOpen(!addProductOpen)}
        productData={data}
        setData={setData}
      /> */}

      {loadForm && (
        <ProductoForm
          open={loadForm}
          onClose={() => {
            setLoadForm(false)
            reload(true)

            setRowSelection({
              id: undefined,
              productType: '',
              productCode: '',
              productName: '',
              brand: '',
              model: '',
              licensePlate: '',
              productClass: '',
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
          setOpen={() => setLoadForm(true)}
          rowSelect={rowSelection}
        />
      )}

      {programacionModal && (
        <ProgramacionMantenimiento
          open={programacionModal}
          onClose={() => setProgramacionModal(false)}
          onSuccess={() => reload(true)}
          rowSelect={rowSelection}
        />
      )}

      {errorDeleteItem && (
        <ErrorDialog
          entitYName='Eliminar equipo'
          open={errorDeleteItem}
          error={errorDeleteItem}
          setOpen={setErrorDeleteItem}
        />
      )}

      {loadFormCheck && (
        <CheckListForm
          open={loadFormCheck}
          onClose={() => setLoadFormCheck(false)}
          setOpen={() => setLoadFormCheck(true)}
          rowSelect={rowSelection}
        />
      )}
    </>
  )
}

export default ProductsListTable
