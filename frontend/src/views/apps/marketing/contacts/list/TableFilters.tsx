'use client'

import { useState, useEffect } from 'react'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import type { ContactType } from '@/types/apps/contactType'

const TableFilters = ({ setData, tableData }: { setData: any; tableData: ContactType[] }) => {
    const [type, setType] = useState<string>('')

    useEffect(() => {
        const filteredData = tableData?.filter((contact: ContactType) => {
            if (type && contact.type !== type) return false
            return true
        })

        setData(filteredData)
    }, [type, tableData, setData])

    return (
        <CardContent>
            <Grid container spacing={6}>
                <Grid item xs={12} sm={4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Filtrar por Tipo'
                        value={type}
                        onChange={e => setType(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value=''>Todos</MenuItem>
                        <MenuItem value='LEAD'>Lead</MenuItem>
                        <MenuItem value='POTENTIAL_CUSTOMER'>Cliente Potencial</MenuItem>
                        <MenuItem value='CUSTOMER'>Cliente</MenuItem>
                        <MenuItem value='SUPPLIER'>Proveedor</MenuItem>
                        <MenuItem value='OTHER'>Otro</MenuItem>
                    </CustomTextField>
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default TableFilters
