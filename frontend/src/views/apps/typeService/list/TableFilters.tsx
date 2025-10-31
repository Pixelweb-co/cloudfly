// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '../../../../@core/components/mui/TextField'

import type { TypeServiceType } from '@/views/apps/typeService/type/typeServiceType'

const TableFilters = ({ setData, tableData }: { setData: (data: TypeServiceType[]) => void; tableData?: TypeServiceType[] }) => {
  // Estados
  const [TypeService, setTypeService] = useState<string>('') // Estado para filtrar por TypeServices
  const [status, setStatus] = useState<boolean | ''>('') // Estado para filtrar por estado (activo/inactivo)

  useEffect(() => {
    if (!tableData || !Array.isArray(tableData)) return // Verificar si tableData es un array

    const filteredData = tableData.filter(typeService => {
      const matchTypeService = TypeService ? (typeService.typeService === TypeService) : true // Comparar TypeServices

      return matchTypeService
    })

    setData(filteredData)
  }, [TypeService,  tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* TypeService Filter */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-TypeService'
            value={TypeService}
            onChange={e => setTypeService(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select TypeService</MenuItem>
            <MenuItem value='admin'>Admin</MenuItem>
            <MenuItem value='user'>User</MenuItem>
            <MenuItem value='superadmin'>Superadmin</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => {
              const selectedValue = e.target.value

              setStatus(selectedValue === 'active' ? true : selectedValue === 'inactive' ? false : '')
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Status</MenuItem>
            <MenuItem value='active'>Activo</MenuItem>
            <MenuItem value='inactive'>Inactivo</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
