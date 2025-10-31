// React Imports
import { useState, useEffect } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { SolicitudType } from '@/types/apps/solicitudType'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { userMethods } from '@/utils/userMethods'

const TableFilters = ({
  setData,
  tableData
}: {
  setData: (data: SolicitudType[]) => void
  tableData?: SolicitudType[]
}) => {
  // Filtro por ESTADO mostrado en la lista (ABIERTA / FINALIZADA)
  const [status, setStatus] = useState<string | ''>('')
  const [customers, setCustomers] = useState<any[]>([])
  const [userLoginRole, setUserLoginRole] = useState<string | null>(null)
  const [customer, setCustomer] = useState<string>('') 

  useEffect(() => {
    if (!tableData || !Array.isArray(tableData)) return

    const filteredData = tableData.filter((solicitud: any) => {
      const stateName = String(
        solicitud?.nombreEstadoSolicitud ?? // Valor mostrado en la columna
        solicitud?.estado ??
        solicitud?.estadoSolicitud ??
        solicitud?.status?.nombre ??
        ''
      ).toUpperCase()

      const matchStatus = status !== '' ? stateName === String(status).toUpperCase() : true

      const matchCustomer = userLoginRole === 'SUPERADMIN' && customer ? solicitud.entidad === customer : true

      return matchStatus && matchCustomer
    })

    setData(filteredData)
  }, [status, customer, tableData, setData, userLoginRole])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) throw new Error('Token no disponible.')

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (Array.isArray(response.data)) {
        setCustomers(response.data)
      } else {
        console.warn('Formato inesperado en los datos de clientes:', response.data)
      }
    } catch (error) {
      console.error('Error al obtener los clientes:', error)
    }
  }

  useEffect(() => {
    const user = userMethods.getUserLogin()

    if (user?.roles?.[0]?.roleEnum) {
      setUserLoginRole(user.roles[0].roleEnum)
    }

    fetchCustomers()
  }, [])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Status Filter */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => {
              const selectedValue = e.target.value

              setStatus(selectedValue)
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Todos los estados</MenuItem>
            <MenuItem value='ABIERTA'>ABIERTA</MenuItem>
            <MenuItem value='FINALIZADA'>FINALIZADA</MenuItem>
          </CustomTextField>
        </Grid>

        {userLoginRole === 'SUPERADMIN' && (
          <Grid item xs={12} sm={6}>
            <CustomTextField
              select
              fullWidth
              id='select-customer'
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value=''>Todos los clientes</MenuItem>
              {customers.map((item: { id: string; name: string }) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
        )}
      </Grid>
    </CardContent>
  )
}

export default TableFilters
