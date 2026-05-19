'use client'

import { useState, useEffect } from 'react'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import type { OrderResponse } from '@/views/apps/pos/types'

const OrderTableFilters = ({ setData, tableData }: { setData: any; tableData: OrderResponse[] }) => {
    const [invoiceSearch, setInvoiceSearch] = useState('')
    const [status, setStatus] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    // Debounce para el buscador de texto
    const [debouncedInvoice, setDebouncedInvoice] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setDebouncedInvoice(invoiceSearch), 300)
        return () => clearTimeout(t)
    }, [invoiceSearch])

    // Filtro reactivo acumulativo
    useEffect(() => {
        const filtered = tableData?.filter((c: OrderResponse) => {
            // Filtro por Número de Factura/Pedido
            if (debouncedInvoice && !(c.invoiceNumber || '').toLowerCase().includes(debouncedInvoice.toLowerCase())) return false

            // Filtro por Estado
            if (status && c.status !== status) return false

            // Filtro por Método de Pago
            if (paymentMethod && c.paymentMethod !== paymentMethod) return false

            // Filtro por Rango de Fechas
            if (c.createdAt) {
                const orderTime = new Date(c.createdAt).getTime()
                if (startDate) {
                    const start = new Date(startDate + 'T00:00:00').getTime()
                    if (orderTime < start) return false
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59').getTime()
                    if (orderTime > end) return false
                }
            }

            return true
        })
        setData(filtered)
    }, [debouncedInvoice, status, paymentMethod, startDate, endDate, tableData, setData])

    return (
        <CardContent>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Buscar por Factura/Pedido'
                        placeholder='Ej: CF-001...'
                        value={invoiceSearch}
                        onChange={e => setInvoiceSearch(e.target.value)}
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
                        <MenuItem value='PENDING'>Pendiente</MenuItem>
                        <MenuItem value='COMPLETED'>Completado</MenuItem>
                        <MenuItem value='CANCELLED'>Cancelado</MenuItem>
                    </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Método Pago'
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value=''>Todos</MenuItem>
                        <MenuItem value='CASH'>Efectivo</MenuItem>
                        <MenuItem value='CREDIT_CARD'>Tarjeta Crédito</MenuItem>
                        <MenuItem value='DEBIT_CARD'>Tarjeta Débito</MenuItem>
                        <MenuItem value='TRANSFER'>Transferencia</MenuItem>
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

export default OrderTableFilters
