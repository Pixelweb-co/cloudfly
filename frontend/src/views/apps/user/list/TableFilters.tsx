// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { UsersType } from '@/types/apps/userType'

// Component Imports
// eslint-disable-next-line import/no-unresolved
import CustomTextField from '@core/components/mui/TextField'
import { userMethods } from '@/utils/userMethods'

const TableFilters = ({ setData, tableData }: { setData: (data: UsersType[]) => void; tableData?: UsersType[] }) => {
  // Filtros
  const [role, setRole] = useState<string>('')
  const [status, setStatus] = useState<boolean | ''>('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const user = userMethods.getUserLogin?.()
    const r = user?.roles?.[0]?.roleEnum
    if (r) setUserRole(String(r))
  }, [])

  // Opciones de rol permitidas según el rol del usuario logueado
  const roleOptions = useMemo(() => {
    const current = String(userRole || '').toUpperCase()
    if (current === 'SUPERADMIN' || current === 'BIOMEDICAL') {
      return ['SUPERADMIN', 'ADMIN', 'USER', 'BIOMEDICAL']
    }
    if (current === 'ADMIN') {
      return ['ADMIN', 'USER']
    }
    return []
  }, [userRole])

  useEffect(() => {
    if (!tableData || !Array.isArray(tableData)) return

    const filteredData = tableData.filter(user => {
      const matchRole = role ? user?.roles?.some(r => String(r.roleEnum).toUpperCase() === role.toUpperCase()) : true
      const matchStatus = status !== '' ? user.enabled === status : true
      return matchRole && matchStatus
    })

    setData(filteredData)
  }, [role, status, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Filtro por rol (limitado por el rol del usuario) */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-role'
            value={role}
            onChange={e => setRole(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Todos los roles</MenuItem>
            {roleOptions.map(r => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </CustomTextField>
        </Grid>

        {/* Filtro por estado */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status === '' ? '' : status ? 'active' : 'inactive'}
            onChange={e => {
              const v = e.target.value
              setStatus(v === '' ? '' : v === 'active' ? true : false)
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Todos los estados</MenuItem>
            <MenuItem value='active'>Activo</MenuItem>
            <MenuItem value='inactive'>Inactivo</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
