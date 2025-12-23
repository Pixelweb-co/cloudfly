'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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
    Box
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { Plus, Trash, Save, ArrowLeft, Search } from 'lucide-react'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'
import { ProductService, ContactService } from '@/views/apps/pos/services/api'
import { Contact } from '@/views/apps/pos/types'
import { ProductType } from '@/types/apps/productType'

const InvoiceForm = () => {
    const router = useRouter()
    const params = useParams()
    const id = params?.id
    const searchParams = useSearchParams()
    const orderIdParam = searchParams.get('orderId')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Contact[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        orderId: '',
        dueDate: '',
        status: 'DRAFT',
        notes: ''
    })

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        loadInitialData()
        if (id) {
            loadInvoice(id as string)
        } else if (orderIdParam) {
            loadOrderData(orderIdParam)
        }
    }, [id, orderIdParam])

    const loadOrderData = async (oId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/orders/${oId}`)
            const order = res.data

            setFormData({
                customerId: order.customerId || '',
                orderId: order.id,
                dueDate: '',
                status: 'DRAFT',
                notes: `Factura generada desde Pedido #${order.invoiceNumber}`
            })

            setItems(order.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName || item.product?.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                subtotal: item.subtotal,
                total: item.total
            })))
            toast.success('Datos cargados desde el pedido')
        } catch (error) {
            console.error('Error loading order:', error)
            toast.error('Error al cargar datos del pedido')
        } finally {
            setLoading(false)
        }
    }
    // ... (rest of the file)

    const loadInitialData = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer.id

            const [contactsData, productsData] = await Promise.all([
                ContactService.getAll(tenantId),
                ProductService.getAll()
            ])

            setCustomers(contactsData.filter(c => c.type === 'CUSTOMER'))
            setProducts(productsData)
        } catch (error) {
            console.error('Error loading initial data:', error)
            toast.error('Error al cargar datos')
        }
    }

    const loadInvoice = async (invoiceId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/invoices/${invoiceId}`)
            const invoice = res.data

            setFormData({
                customerId: invoice.customerId || '',
                dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
                status: invoice.status,
                notes: invoice.notes || ''
            })

            setItems(invoice.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                subtotal: item.subtotal,
                total: item.total
            })))
        } catch (error) {
            console.error('Error loading invoice:', error)
            toast.error('Error al cargar la factura')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = (product: ProductType) => {
        const existingItem = items.find(item => item.productId === product.id)

        if (existingItem) {
            toast.error('El producto ya está en la lista')
            return
        }

        const newItem = {
            productId: product.id,
            productName: product.productName,
            quantity: 1,
            unitPrice: product.salePrice || product.price || 0,
            discount: 0,
            subtotal: product.salePrice || product.price || 0,
            total: product.salePrice || product.price || 0
        }

        setItems([...items, newItem])
        setSearchTerm('')
    }

    const handleUpdateItem = (index: number, field: string, value: number) => {
        const newItems = [...items]
        const item = newItems[index]

        if (field === 'quantity') item.quantity = value
        if (field === 'unitPrice') item.unitPrice = value
        if (field === 'discount') item.discount = value

        item.subtotal = item.quantity * item.unitPrice
        item.total = item.subtotal - item.discount

        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const calculateTotals = () => {
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
        const discount = items.reduce((acc, item) => acc + item.discount, 0)
        const total = items.reduce((acc, item) => acc + item.total, 0)
        return { subtotal, discount, total }
    }

    const handleSubmit = async () => {
        if (!formData.customerId) {
            toast.error('Seleccione un cliente')
            return
        }
        if (items.length === 0) {
            toast.error('Agregue al menos un producto')
            return
        }

        try {
            setLoading(true)
            const user = userMethods.getUserLogin()

            const payload = {
                tenantId: user.tenantId || (user.customer ? user.customer.id : 1),
                customerId: Number(formData.customerId),
                orderId: formData.orderId ? Number(formData.orderId) : null,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                status: formData.status,
                notes: formData.notes,
                discount: calculateTotals().discount,
                tax: 0,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount
                }))
            }

            if (id) {
                toast.error('La edición de facturas aún no está implementada en el backend')
                setLoading(false)
                return
            }

            await axiosInstance.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/invoices`, payload)

            toast.success('Factura guardada exitosamente')
            router.push('/ventas/facturas/list')
        } catch (error) {
            console.error('Error saving invoice:', error)
            toast.error('Error al guardar factura')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    ).slice(0, 5)

    const totals = calculateTotals()

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowLeft />}
                            onClick={() => router.push('/ventas/facturas/list')}
                        >
                            Volver
                        </Button>
                        <Typography variant="h4">{id ? 'Editar Factura' : 'Nueva Factura'}</Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </Grid>

            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Información General" />
                    <CardContent className="flex flex-col gap-4">
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
                            <MenuItem value="DRAFT">Borrador</MenuItem>
                            <MenuItem value="ISSUED">Emitida</MenuItem>
                            <MenuItem value="PAID">Pagada</MenuItem>
                            <MenuItem value="CANCELLED">Anulada</MenuItem>
                        </CustomTextField>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={8}>
                <Card className="h-full">
                    <CardHeader title="Productos" />
                    <CardContent>
                        <div className="relative mb-6">
                            <CustomTextField
                                fullWidth
                                placeholder="Buscar producto por nombre o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search className="mr-2 text-gray-400" size={20} />
                                }}
                            />
                            {searchTerm.length > 1 && (
                                <Paper className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b flex justify-between items-center"
                                            onClick={() => handleAddItem(product)}
                                        >
                                            <div>
                                                <div className="font-bold">{product.productName}</div>
                                                <div className="text-sm text-gray-500">Stock: {product.inventoryQty || 0}</div>
                                            </div>
                                            <div className="font-bold text-blue-600">
                                                ${product.salePrice || product.price || 0}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-3 text-center text-gray-500">No se encontraron productos</div>
                                    )}
                                </Paper>
                            )}
                        </div>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell width={100}>Cant.</TableCell>
                                        <TableCell width={120}>Precio</TableCell>
                                        <TableCell width={120}>Desc.</TableCell>
                                        <TableCell width={120}>Total</TableCell>
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
                                                    onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    size="small"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    size="small"
                                                    value={item.discount}
                                                    onChange={(e) => handleUpdateItem(index, 'discount', Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>${(item.total || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                                    <Trash size={18} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" className="py-8 text-gray-500">
                                                Agregue productos usando el buscador
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <div className="mt-4 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-500">
                                    <span>Descuento:</span>
                                    <span>-${totals.discount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span>${totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Notas" />
                    <CardContent>
                        <CustomTextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Notas"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default InvoiceForm
