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

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import Tooltip from '@mui/material/Tooltip'

import CustomTextField from '@core/components/mui/TextField'

import SolicitudForm from '@/components/dialogs/form-solicitud'

// Component Imports
import TableFilters from './TableFilters'

//import AddSolicitudDrawer from './AddSolicitudDrawer'

import type { SolicitudType } from '@/types/apps/solicitudType'
import { userMethods } from '@/utils/userMethods'
import { AuthManager } from '@/utils/authManager'
import ReporteForm from '../components/page'
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog'
import axiosInstance from '@/utils/axiosInterceptor'


declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type SolicitudTypeWithAction = SolicitudType & {
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
const columnHelper = createColumnHelper<SolicitudTypeWithAction>()

const SolicitudListTable = ({ reload, tableData }: any) => {
  // States
  // const [addSolicitudOpen, setAddSolicitudOpen] = useState(false)

  const [loadForm, setOpenForm] = useState(false)
  const [loadFormPlanilla, setOpenFormPlanilla] = useState(false)

  const [rowSelection, setRowSelection] = useState<any>({
    id: '',
    entidad: '',
    fecha: '',
    hora: '',
    tipo_servicio: '',
    descr: '',
    asig: '',
    fchasg: '',
    horasg: '',
    nombreEquipo: '',
    nombreEntidad: '',
    nombreTipoServicio: ''
  })

  const [data, setData] = useState<SolicitudType[]>(
    tableData.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  )

  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [deleteSolicitud, setDelete] = useState(false)

  const DodeleteSolicitud = async (id: any) => {
    try {
      const token = localStorage.getItem('AuthToken')

      const res = await axiosInstance.delete(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes/${id}`, {
        headers: {
          'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
          Authorization: `Bearer ${token}` // Añade el token en el encabezado
        }
      })

      console.log('Delete', res.data)
      reload(true)
    } catch (error) {
      console.error('Error fetching Solicitud data:', error)
      throw error
    }
  }


  const columns = useMemo<ColumnDef<SolicitudTypeWithAction, any>[]>(
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
      columnHelper.accessor('fecha', {
        header: 'Fecha',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.fecha}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('nombreEquipo', {
        header: 'Equipo',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.nombreEquipo}
          </Typography>
        )
      }),

      columnHelper.accessor('nombreTipoServicio', {
        header: 'Tipo servicio',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.nombreTipoServicio}
          </Typography>
        )
      }),

      columnHelper.accessor('nombreEntidad', {
        header: 'Entidad',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.nombreEntidad}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              label={row.original.nombreEstadoSolicitud}
              size='small'
              color={row.original.status?.id === 1 ? 'success' : row.original.status?.id === 2 ? 'default':'error'} // Cambiar color dinámicamente
              className='capitalize'
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) =>
          (
            <div className='flex items-center'>
            {userMethods.isRole("SUPERADMIN") && (
               <Tooltip title="Eliminar">

              <IconButton
              onClick={() =>{

                setRowSelection(row.original),

                setDelete(true)
                console.log("row",row.original)
              }}
              >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>

          </Tooltip>
          )}



            {userMethods.isRole("SUPERADMIN") && (
              <Tooltip title="Editar">

                  <IconButton
                    onClick={() => {
                      setRowSelection(row.original)
                      setOpenForm(true)
                    }}
                  >
                    <i className='tabler-edit text-textSecondary' />
                  </IconButton>

              </Tooltip>
            )}

            {(userMethods.isRole("SUPERADMIN") || userMethods.isRole("BIOMEDICAL")) && row.original.status?.id == 1 && (
            <Tooltip title="Crear reporte">

              <IconButton
              onClick={() => {
                setRowSelection(row.original)
                setOpenFormPlanilla(true)
              }}
            >
              <i className='tabler-list text-textSecondary' />
            </IconButton>


          </Tooltip>
          )}
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData]
  )

  useEffect(() => {
    setData(tableData)
  }, [tableData])

  const table = useReactTable({
    data: filteredData as SolicitudType[],
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
                setOpenForm(true)
                setRowSelection({
                  entidad: '',
                  fecha: '',
                  hora: '',
                  tipo_servicio: '',
                  descr: '',
                  asig: '',
                  fchasg: '',
                  horasg: '',
                  nombreEquipo: '',
                  nombreEntidad: '',
                  nombreTipoServicio: ''
                })
              }}
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              className='max-sm:is-full'
            >
              Agregar solicitud
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
      {/* <AddSolicitudDrawer
        open={addSolicitudOpen}
        handleClose={() => setAddSolicitudOpen(!addSolicitudOpen)}
        solicitudData={data}
        setData={setData}
      /> */}

      <ReporteForm openForm={loadFormPlanilla} RecordData={rowSelection}
        closeForm={() => {
          setOpenFormPlanilla(false)
          reload(true)

        }}
      />

      <SolicitudForm
        open={loadForm}
        onClose={() => {
          setOpenForm(false)
          reload(true)
          setRowSelection({
            id: '',
            entidad: '',
            fecha: '',
            hora: '',
            tipo_servicio: '',
            descr: '',
            asig: '',
            fchasg: '',
            horasg: '',
            nombreEquipo: '',
            nombreEntidad: '',
            nombreTipoServicio: ''
          })
        }}
        setOpen={() => setOpenForm(true)}
        rowSelect={rowSelection}
      />

      <ConfirmationDialog
      entitYName={`Solicitud ${rowSelection?.nombreTipoServicio}`}
      open={deleteSolicitud}
      setOpen={(p: any) => setDelete(p)}
      onConfirmation={() => {
        console.log('Delete', rowSelection)
        setDelete(false)
        DodeleteSolicitud(rowSelection?.idSolicitud)
      }}
      name={rowSelection?.nombreTipoServicio}

      />
    </>
  )
}

export default SolicitudListTable
