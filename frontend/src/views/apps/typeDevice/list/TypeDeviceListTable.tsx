'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'

import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import classnames from 'classnames'
import axios from 'axios'
import dotenv from "dotenv";
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

// Style Imports
import tableStyles from '../../../../@core/styles/table.module.css'

import CustomTextField from '../../../../@core/components/mui/TextField'

// Type Imports
import TablePaginationComponent from '../../../../components/TablePaginationComponent'

import type { TypeDeviceType } from '../type/typeDeviceType'

import TypeDeviceForm from '../form'
import CheckListForm from '@/components/dialogs/form-checklist'
import { FormControl, InputLabel, Select } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type TypeDeviceTypeWithAction = TypeDeviceType & {
  action?: string
  id: string
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
const columnHelper = createColumnHelper<TypeDeviceTypeWithAction>()

const TypeDeviceListTable = ({ reload, tableData }: { reload?: any; tableData?: TypeDeviceType[] }) => {
  // States
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  const [rowSelection, setRowSelection] = useState<any>({ TypeDevice: '', id: '' })
  const [data, setData] = useState<TypeDeviceTypeWithAction[]>(
    tableData?.map(item => ({ ...item, action: '', id: item.id })) || []
  )
  const [globalFilter, setGlobalFilter] = useState('')
  const [loadForm, setOpenForm] = useState(false)
  const [loadFormCheck, setLoadFormCheck] = useState<any | null>(null)
  const [verificationTemplates, setVerificationTemplates] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getTemplateName = (id: any) => {
    const strId = id == null ? '' : String(id)
    if (!strId || strId === '0') return 'No asignada'
    const found = verificationTemplates.find(t => String(t?.id) === strId)
    return found?.templateName || 'No asignada'
  }

  useEffect(() => {
    console.log('from table type service ', rowSelection)
  }, [rowSelection])

  useEffect(() => {
    const getTemplatesVerification = async () => {
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/plantillas-verificacion`)

        console.log('Datos recibidosnw:', response.data)

        setVerificationTemplates(response.data)

        return response.data
      } catch (error) {
        console.error('Error al obtener los datos:', error)
      }
    }

    getTemplatesVerification()
  }, [])


  const setTemplate = async (deviceId:any,value:any) => {


    try{

      const res = await axiosInstance.put(`${process.env.NEXT_PUBLIC_API_URL}/type-device/${deviceId}`, { plantillaVerificacion: value });

       console.log("res.data", res.data)

       reload(true)

    } catch (error:any) {
      console.log('Actualizar el item:', error)


    }



  }


  useEffect(() => {
    setData(tableData?.map(item => ({ ...item, action: '', id: item.id })) || [])

    console.log('from table type device ', tableData)
  }, [tableData])

  const deleteItem = async (id: string) => {
    try {
      const token = localStorage.getItem('AuthToken')

      console.log('token ', token)

      if (!token) {
        throw new Error('No token found')
      }

      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/type-service/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      console.log('res', res)
    } catch (error) {
      console.error('Error deleting TypeDevice:', error)
      throw error
    }
  }

  const columns = useMemo<ColumnDef<TypeDeviceTypeWithAction, any>[]>(
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
      columnHelper.accessor('typeDevice', {
        header: 'Nombre',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.typeDevice}
              </Typography>
            </div>
          </div>
        )
      }),

      // New read-only column showing assigned template name
      columnHelper.accessor('plantillaVerificacion', {
        header: 'Plantilla asignada',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <Typography color='text.primary' className='font-medium'>
              {getTemplateName(row.original.plantillaVerificacion)}
            </Typography>
          </div>
        )
      }),

      // Existing editable selector to change the assignment
      columnHelper.accessor('typeDevice', {
        header: 'Plantilla de verificación',
        cell: ({ row }) => (
          <div className=' items-center gap-4'>
            <div className='flex flex-col'>
              <FormControl variant='standard' fullWidth>

                <Select
                  value={row.original.plantillaVerificacion ? String(row.original.plantillaVerificacion) : '0'}
                  onChange={(e)=>setTemplate(row.original.id, e.target.value)}
                >
                  <MenuItem value={'0'}>No asignada</MenuItem>

                  {mounted && verificationTemplates.map((item: any) => (
                    <MenuItem key={String(item.id)} value={String(item.id)}>
                      {item.templateName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() => {
                setRowSelection(row.original)
                setLoadFormCheck(true)
              }}
            >
              <i className='tabler-list text-textSecondary' />
            </IconButton>

            <IconButton
              onClick={() => {
                setRowSelection(row.original)
                setOpenForm(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>

            <IconButton
              onClick={() => {
                console.log('delete', row.original.id)
                deleteItem(row.original.id)
                reload(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, verificationTemplates]
  )

  const table = useReactTable({
    data: data,
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
        <CardHeader title='Tipo de dispositivo' className='pbe-4' />
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

            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              className='max-sm:is-full'
              onClick={() => setOpenForm(true)}
            >
              Agregar tipo de servicio
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
                  .map((row, index) => {
                    return (
                      <tr key={index} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>

          <CheckListForm
            open={loadFormCheck}
            onClose={() => setLoadFormCheck(false)}
            setOpen={() => setLoadFormCheck(true)}
            rowSelect={rowSelection}
          />

          <TypeDeviceForm
            open={loadForm}
            onClose={() => {
              setOpenForm(false)
              reload(true)
              setRowSelection({
                id: '',
                TypeDevice: ''
              })
            }}
            setOpen={() => setOpenForm(true)}
            rowSelect={rowSelection}
          />
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
    </>
  )
}

export default TypeDeviceListTable
