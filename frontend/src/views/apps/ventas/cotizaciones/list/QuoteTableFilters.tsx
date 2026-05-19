'use client'

import { useState, useEffect } from 'react'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import type { QuoteType } from '@/types/apps/quoteType'

const QuoteTableFilters = ({ setData, tableData }: { setData: any; tableData: QuoteType[] }) => {
    const [quoteSearch, setQuoteSearch] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [status, setStatus] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    // Debounce para los campos de texto
    const [debouncedQuote, setDebouncedQuote] = useState('')
    const [debouncedCustomer, setDebouncedCustomer] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuote(quoteSearch), 300)
        return () => clearTimeout(t)
    }, [quoteSearch])

    useEffect(() => {
        const t = setTimeout(() => setDebouncedCustomer(customerSearch), 300)
        return () => clearTimeout(t)
    }, [customerSearch])

    // Filtro reactivo acumulativo
    useEffect(() => {
        const filtered = tableData?.filter((c: QuoteType) => {
            // Filtro por Número de Cotización
            if (debouncedQuote && !(c.quoteNumber || '').toLowerCase().includes(debouncedQuote.toLowerCase())) return false

            // Filtro por Nombre de Cliente
            if (debouncedCustomer && !(c.customerName || '').toLowerCase().includes(debouncedCustomer.toLowerCase())) return false

            // Filtro por Estado
            if (status && c.status !== status) return false

            // Filtro por Rango de Fechas (comparando con quoteDate)
            if (c.quoteDate) {
                const quoteTime = new Date(c.quoteDate).getTime()
                if (startDate) {
                    const start = new Date(startDate + 'T00:00:00').getTime()
                    if (quoteTime < start) return false
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59').getTime()
                    if (quoteTime > end) return false
                }
            }

            return true
        })
        setData(filtered)
    }, [debouncedQuote, debouncedCustomer, status, startDate, endDate, tableData, setData])

    return (
        <CardContent>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Buscar Cotización'
                        placeholder='Ej: COT-001...'
                        value={quoteSearch}
                        onChange={e => setQuoteSearch(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Buscar Cliente'
                        placeholder='Nombre del cliente...'
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Estado'
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value=''>Todos</MenuItem>
                        <MenuItem value='DRAFT'>Borrador</MenuItem>
                        <MenuItem value='SENT'>Enviada</MenuItem>
                        <MenuItem value='ACCEPTED'>Aceptada</MenuItem>
                        <MenuItem value='REJECTED'>Rechazada</MenuItem>
                        <MenuItem value='EXPIRED'>Vencida</MenuItem>
                    </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        type='date'
                        label='Fecha Desde'
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        type='date'
                        label='Fecha Hasta'
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default QuoteTableFilters
