'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    Grid,
    Button,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    MenuItem,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { axiosInstance } from '@/utils/axiosInstance'
import { productService } from '@/services/ventas/productService'
import { contactService } from '@/services/marketing/contactService'
import type { Contact } from '@/types/marketing/contactTypes'
import type { Product } from '@/types/ventas/productTypes'
import type { InvoiceType, BillingType, BillingPeriod } from '@/types/ventas/invoiceTypes'

const InvoiceForm = () => {
    const router = useRouter()
    const params = useParams()
    const id = params?.id

    const [loading, setLoading] = useState(false)
    const submitting = useRef(false)
    const [customers, setCustomers] = useState<Contact[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'PENDIENTE',
        billingType: 'PAGO_UNICO' as BillingType,
        billingPeriod: 'MENSUAL' as BillingPeriod,
        notes: '',
        currency: 'COP',
        tax: 0
    })

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        loadInitialData()
        if (id) {
            loadInvoice(id as string)
        }
    }, [id])

    const loadInitialData = async () => {
        try {
            const [contactsData, productsData] = await Promise.all([
                contactService.getAllContacts(),
                productService.getAllProducts()
            ])

            setCustomers(contactsData.filter(c => c.type === 'CUSTOMER' || c.type === 'LEAD'))
            setProducts(productsData)
        } catch (error) {
            console.error('Error loading initial data:', error)
            toast.error('Error al cargar datos iniciales')
        }
    }

    const loadInvoice = async (invoiceId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`/internal/billing/invoices/${invoiceId}`)
            const invoice: InvoiceType = res.data

            setFormData({
                customerId: '', // Necesitaríamos cargar el cliente asociado si no viene en el invoice
                issueDate: invoice.issueDate.split('T')[0],
                dueDate: invoice.dueDate.split('T')[0],
                status: invoice.status,
                billingType: invoice.billingType,
                billingPeriod: invoice.billingPeriod || 'MENSUAL',
                notes: '',
                currency: invoice.currency,
                tax: invoice.tax
            })

            // Facturas suelen venir del backend con sus items ya procesados
            // Aquí simularíamos la carga de items si el modelo los incluyera
        } catch (error) {
            console.error('Error loading invoice:', error)
            toast.error('Error al cargar la factura')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = (product: Product) => {
        const newItem = {
            productId: product.id,
            productName: product.productName,
            quantity: 1,
            unitPrice: product.salePrice || product.price || 0,
            subtotal: product.salePrice || product.price || 0,
            total: product.salePrice || product.price || 0
        }
        setItems([...items, newItem])
        setSearchTerm('')
    }

    const calculateTotals = () => {
        const subtotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0)
        const total = subtotal + (formData.tax || 0)
        return { subtotal, total }
    }

    const handleSubmit = async () => {
        if (submitting.current) return
        
        try {
            submitting.current = true
            setLoading(true)

            const totals = calculateTotals()
            const payload = {
                ...formData,
                subtotal: totals.subtotal,
                total: totals.total,
                items: items
            }

            if (id) {
                await axiosInstance.put(`/internal/billing/invoices/${id}`, payload)
                toast.success('Factura actualizada exitosamente')
            } else {
                await axiosInstance.post('/internal/billing/invoices/generate-subscription', payload)
                toast.success('Factura generada exitosamente')
            }
            router.push('/ventas/facturas/list')
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.error('Error al guardar la factura')
        } finally {
            setLoading(false)
            submitting.current = false
        }
    }

    const totals = calculateTotals()

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <IconButton onClick={() => router.push('/ventas/facturas/list')}>
                            <i className='tabler-arrow-left' />
                        </IconButton>
                        <Typography variant="h4">{id ? 'Editar Factura' : 'Nueva Factura'}</Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<i className='tabler-device-floppy' />}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Factura'}
                    </Button>
                </div>
            </Grid>

            {/* Configuración de Cobro */}
            <Grid item xs={12} md={4}>
                <Card className="mb-6">
                    <CardHeader title="Configuración de Cobro" />
                    <Divider />
                    <CardContent className="flex flex-col gap-5">
                        <FormControl>
                            <FormLabel id="billing-type-label">Tipo de Factura</FormLabel>
                            <RadioGroup
                                aria-labelledby="billing-type-label"
                                value={formData.billingType}
                                onChange={(e) => setFormData({ ...formData, billingType: e.target.value as BillingType })}
                            >
                                <FormControlLabel value="PAGO_UNICO" control={<Radio />} label="Pago Único" />
                                <FormControlLabel value="RECURRENTE" control={<Radio />} label="Recurrente (Suscripción)" />
                            </RadioGroup>
                        </FormControl>

                        {formData.billingType === 'RECURRENTE' && (
                            <FormControl>
                                <FormLabel id="billing-period-label">Periodo de Recurrencia</FormLabel>
                                <RadioGroup
                                    aria-labelledby="billing-period-label"
                                    value={formData.billingPeriod}
                                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as BillingPeriod })}
                                    row
                                >
                                    <FormControlLabel value="MENSUAL" control={<Radio />} label="Mensual" />
                                    <FormControlLabel value="SEMESTRAL" control={<Radio />} label="Semestral" />
                                    <FormControlLabel value="ANUAL" control={<Radio />} label="Anual" />
                                </RadioGroup>
                            </FormControl>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Información General" />
                    <Divider />
                    <CardContent className="flex flex-col gap-5">
                        <CustomTextField
                            select
                            fullWidth
                            label="Cliente"
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        >
                            {customers.map((customer) => (
                                <MenuItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                </MenuItem>
                            ))}
                        </CustomTextField>

                        <CustomTextField
                            type="date"
                            fullWidth
                            label="Fecha de Emisión"
                            InputLabelProps={{ shrink: true }}
                            value={formData.issueDate}
                            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        />

                        <CustomTextField
                            type="date"
                            fullWidth
                            label="Fecha de Vencimiento"
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />

                        <CustomTextField
                            select
                            fullWidth
                            label="Estado"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                            <MenuItem value="PAGADA">Pagada</MenuItem>
                            <MenuItem value="VENCIDA">Vencida</MenuItem>
                            <MenuItem value="ANULADA">Anulada</MenuItem>
                        </CustomTextField>
                    </CardContent>
                </Card>
            </Grid>

            {/* Items de la Factura */}
            <Grid item xs={12} md={8}>
                <Card>
                    <CardHeader title="Detalle de Factura" />
                    <Divider />
                    <CardContent>
                        <div className="relative mb-6">
                            <CustomTextField
                                fullWidth
                                placeholder="Buscar producto o servicio..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <i className='tabler-search mr-2 text-textSecondary' />
                                }}
                            />
                            {searchTerm.length > 1 && (
                                <Paper className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto border shadow-lg">
                                    {products
                                        .filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-3 hover:bg-actionHover cursor-pointer border-b flex justify-between items-center"
                                                onClick={() => handleAddItem(product)}
                                            >
                                                <Typography className="font-bold">{product.productName}</Typography>
                                                <Typography className="font-bold text-primary">
                                                    ${product.salePrice || product.price || 0}
                                                </Typography>
                                            </div>
                                        ))}
                                </Paper>
                            )}
                        </div>

                        <TableContainer component={Paper} variant="outlined" className="border-none shadow-none">
                            <Table size="small">
                                <TableHead className="bg-actionHover">
                                    <TableRow>
                                        <TableCell>Descripción</TableCell>
                                        <TableCell width={80}>Cant.</TableCell>
                                        <TableCell width={120}>Precio</TableCell>
                                        <TableCell width={100} align="right">Total</TableCell>
                                        <TableCell width={50}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    size="small"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...items]
                                                        newItems[index].quantity = Number(e.target.value)
                                                        newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice
                                                        newItems[index].total = newItems[index].subtotal
                                                        setItems(newItems)
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell align="right">${(item.total || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => {
                                                    const newItems = [...items]
                                                    newItems.splice(index, 1)
                                                    setItems(newItems)
                                                }}>
                                                    <i className='tabler-trash' />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider className="my-4" />
                        <div className="flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between">
                                    <Typography color="textSecondary">Subtotal:</Typography>
                                    <Typography className="font-bold">${totals.subtotal.toLocaleString()}</Typography>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <Typography variant="h6">Total:</Typography>
                                    <Typography variant="h6" color="primary">${totals.total.toLocaleString()}</Typography>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default InvoiceForm
