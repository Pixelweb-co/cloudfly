'use client'

import { useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TablePagination from '@mui/material/TablePagination'
import { Button, TextField, Grid } from '@mui/material'
import type { Row } from '@tanstack/react-table'
import { createColumnHelper, useReactTable, getCoreRowModel, filterFns, flexRender } from '@tanstack/react-table'

import axios from 'axios'
import dotenv from "dotenv";

import type { Tercero } from '@/types/apps/tercero'
import tableStyles from '@core/styles/table.module.css'
import FormTercero from '../form/page'

type TabData = 'eps' | 'pensiones' | 'cesantias' | 'arls' | 'cajas'

const columnHelper = createColumnHelper<Tercero>()

const Aportes = () => {
  const [activeTab, setActiveTab] = useState<TabData>('eps')
  const [data, setData] = useState<Tercero[]>([])
  const [filteredData, setFilteredData] = useState<Tercero[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedTercero, setSelectedTercero] = useState<Tercero | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false) // Estado para controlar si el formulario está abierto

const handleDelete = (rowId:any)=>(true)


  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID', cell: info => info.getValue() }),
      columnHelper.accessor('nombre', { header: 'Nombre', cell: info => info.getValue() }),
      columnHelper.accessor('tipoDocumento', { header: 'Tipo Documento', cell: info => info.getValue() }),
      columnHelper.accessor('numeroDocumento', { header: 'Número Documento', cell: info => info.getValue() }),
      columnHelper.accessor('telefono', { header: 'Teléfono', cell: info => info.getValue() }),
      columnHelper.accessor('email', { header: 'Email', cell: info => info.getValue() }),
      columnHelper.accessor('direccion', { header: 'Dirección', cell: info => info.getValue() }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: info => {
          const row = info.row.original

          return (
            <div className='flex gap-4'>
              <Button variant='contained' color='info' onClick={() => handleEdit(row)}>
                Editar
              </Button>
              <Button variant='contained' color='error' onClick={() => handleDelete(row.id)}>
                Eliminar
              </Button>
            </div>
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: filterFns.arrIncludesAll
    },
    state: {
      pagination: {
        pageIndex,
        pageSize
      }
    }
  })

  // Función para obtener los datos desde la API
  const fetchData = async (entity: TabData) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/${entity}`)

      setData(response.data)
      setFilteredData(response.data)
    } catch (error) {
      console.error(`Error fetching ${entity}:`, error)
    }
  }

  // Cargar los datos al cambiar de tab
  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  // Manejar el cambio de tab
  const handleTabChange = (_: React.SyntheticEvent, newTab: TabData) => {
    setActiveTab(newTab)
    setPageIndex(0)
    setSelectedTercero(null) // Restablecer el tercero seleccionado cuando se cambia de tab
    setIsFormOpen(false) // Cerrar el formulario al cambiar de tab
  }

  // Manejar la edición
  const handleEdit = (tercero: Tercero) => {
    setSelectedTercero(tercero)
    setIsFormOpen(true) // Abrir el formulario en modo edición
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Desplazar hacia el inicio donde está el formulario
  }

  // Función para manejar la creación de un nuevo registro
  const handleNewRecord = () => {
    setSelectedTercero(null) // Restablecer el formulario para un nuevo registro
    setIsFormOpen(true) // Abrir el formulario en modo creación
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Desplazar hacia el inicio donde está el formulario
  }

  const handleFormSubmit = () => {
    fetchData(activeTab)
    setSelectedTercero(null) // Resetear el tercero seleccionado
    setIsFormOpen(false) // Cerrar el formulario después de una presentación exitosa
  }

  const handleCancel = () => {
    setSelectedTercero(null) // Resetear el tercero seleccionado
    setIsFormOpen(false) // Cerrar el formulario si se cancela
  }

  return (
    <Card>
      <CardHeader title='Prestaciones sociales' />
      <Tabs value={activeTab} onChange={handleTabChange} aria-label='parameter-tabs'>
        <Tab label='ARLS' value='arls' />
        <Tab label='EPS' value='eps' />
        <Tab label='Fondos de Pensión' value='pensiones' />
        <Tab label='Cesantías' value='cesantias' />
        <Tab label='Cajas de Compensación' value='cajas' />
      </Tabs>

      {/* Botón para crear un nuevo registro */}
      <div className='p-4'>
        <Button variant='contained' color='primary' onClick={handleNewRecord}>
          Crear Nuevo Registro
        </Button>
      </div>

      {/* Formulario de creación/edición, solo se muestra cuando el formulario está abierto */}
      {isFormOpen && (
        <div className='p-4'>
          <FormTercero entity={activeTab} onSubmit={handleFormSubmit} tercero={selectedTercero} onCancel={()=>console.log("cancel")} />
          <Button variant='outlined' color='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Renderizar la tabla */}
      <div className='overflow-x-auto p-4'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {cell.column.id === 'acciones' ? flexRender(cell.column.columnDef.cell, cell.getContext()) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <TablePagination
        component='div'
        count={data.length}
        page={pageIndex}
        rowsPerPage={pageSize}
        onPageChange={(_, newPage) => setPageIndex(newPage)}
        onRowsPerPageChange={event => setPageSize(parseInt(event.target.value, 10))}
      />
    </Card>
  )
}

export default Aportes
