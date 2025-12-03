import { useState, useEffect } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

import CustomTextField from '@core/components/mui/TextField'
import type { ProductType } from '@/types/apps/productType'
import { userMethods } from '@/utils/userMethods'

const TableFilters = ({
  setData,
  tableData
}: {
  setData: (data: ProductType[]) => void
  tableData?: ProductType[]
}) => {
  const [status, setStatus] = useState<string>('0')
  const [customers, setCustomers] = useState<any[]>([])
  const [userLoginRole, setUserLoginRole] = useState<string | null>(null)
  const [customer, setCustomer] = useState<string>('')

  useEffect(() => {
    if (!Array.isArray(tableData)) return;

    const filteredData = tableData.filter((product: any) => {
      // Verificar el estado seleccionado (status)

      console.log('status:', status)
      console.log('product:', product.status)
      const matchStatus = status !== '0' ? product.status === status : true;

      // Verificar el cliente seleccionado (customer) solo si el rol es 'SUPERADMIN'
      const matchCustomer =
        userLoginRole === 'SUPERADMIN' && customer ? product.customer === customer : true;

      // Retornar si cumple ambas condiciones
      return matchStatus && matchCustomer;
    });

    setData(filteredData);
  }, [status, customer, tableData, setData, userLoginRole]);

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
        {/* Filtro por estado */}
        <Grid item xs={12} sm={6}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='0'>Todos los estados</MenuItem>
            <MenuItem value='2'>Activo</MenuItem>
            <MenuItem value='1'>Inactivo</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filtro por cliente (solo para SUPERADMIN) */}
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
