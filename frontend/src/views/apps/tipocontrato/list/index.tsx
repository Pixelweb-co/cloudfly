'use client'

import { useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TablePagination from '@mui/material/TablePagination'
import { Button, TextField, Grid } from '@mui/material'
import type { Row } from '@tanstack/react-table'
import { createColumnHelper, useReactTable, getCoreRowModel, filterFns } from '@tanstack/react-table'

import axios from 'axios'
import dotenv from "dotenv";

import type { TipoContrato } from '@/types/apps/tipoContrato'
// eslint-disable-next-line import/no-unresolved
import tableStyles from '@core/styles/table.module.css'
import FormTipoContrato from '../form/page'

type TabData = 'tipocontratos'

const columnHelper = createColumnHelper<TipoContrato>()

const TipoContratos = () => {
  const [data, setData] = useState<TipoContrato[]>([])
  const [filteredData, setFilteredData] = useState<TipoContrato[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedTipoContrato, setSelectedTipoContrato] = useState<TipoContrato | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false) // Estado para controlar si el formulario está abierto

  const columns = useMemo(
    () => [
      columnHelper.accessor('tipo_contrato', { header: 'Nombre', cell: info => info.getValue() }),
      columnHelper.accessor('estado', { header: 'Estado', cell: info => info.getValue() }),
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
    fetchData('tipocontratos')
  }, [])

  // Manejar la edición
  const handleEdit = (tipocontrato: TipoContrato) => {
    setSelectedTipoContrato(tipocontrato)
    setIsFormOpen(true) // Abrir el formulario en modo edición
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Desplazar hacia el inicio donde está el formulario
  }

  // Función para manejar la creación de un nuevo registro
  const handleNewRecord = () => {
    setSelectedTipoContrato(null) // Restablecer el formulario para un nuevo registro
    setIsFormOpen(true) // Abrir el formulario en modo creación
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Desplazar hacia el inicio donde está el formulario
  }

  const handleFormSubmit = () => {
    setSelectedTipoContrato(null) // Resetear el tipocontrato seleccionado
    setIsFormOpen(false) // Cerrar el formulario después de una presentación exitosa
    fetchData('tipocontratos')
  }

  const handleCancel = () => {
    setSelectedTipoContrato(null) // Resetear el tipocontrato seleccionado
    setIsFormOpen(false) // Cerrar el formulario si se cancela
  }

  const handleDelete = (id: any) => {
    return id
  }

  return (
    <Card>
      <CardHeader title='Tipo de Contratos' />

      {/* Botón para crear un nuevo registro */}
      <div className='p-4'>
        <Button variant='contained' color='primary' onClick={handleNewRecord}>
          Crear Nuevo Registro
        </Button>
      </div>

      {/* Formulario de creación/edición, solo se muestra cuando el formulario está abierto */}
      {isFormOpen && (
        <div className='p-4'>
          <FormTipoContrato
            entity={'tipocontratos'}
            onSubmit={handleFormSubmit}
            tipocontrato={selectedTipoContrato}
            onCancel={handleCancel}
          />
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
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {cell.column.id === 'acciones' && typeof cell.column.columnDef.cell === 'function' ? cell.column.columnDef.cell(cell.getContext()) : cell.getValue()}
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

export default TipoContratos
