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
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import { ProductService, ContactService } from '@/views/apps/pos/services/api'
import { Contact } from '@/views/apps/pos/types'
import { ProductType } from '@/types/apps/productType'

const OrderForm = () => {
    const router = useRouter()
    const params = useParams()
    const id = params?.id
    const searchParams = useSearchParams()
    const quoteId = searchParams.get('quoteId')

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Contact[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        status: 'PENDING',
        paymentMethod: 'CASH',
        notes: ''
    })

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        loadInitialData()
        if (id) {
            loadOrder(id as string)
        } else if (quoteId) {
            loadQuoteData(quoteId)
        }
    }, [id, quoteId])

    const loadInitialData = async () => {
        try {
            const user = userMethods.getUserLogin()
            // Fix seguro para tenantId
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

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

    const loadQuoteData = async (qId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/quotes/${qId}`)
            const quote = res.data

            setFormData({
                customerId: quote.customerId || '',
                status: 'PENDING',
                paymentMethod: 'CASH',
                notes: `Generado desde Cotización #${quote.quoteNumber}`
            })

            setItems(quote.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName || item.product?.productName, // Back may return nested product
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                subtotal: item.subtotal,
                total: item.total
            })))
            toast.success('Datos cargados desde la cotización')
        } catch (error) {
            console.error('Error loading quote:', error)
            toast.error('Error al cargar datos de la cotización')
        } finally {
            setLoading(false)
        }
    }

    const loadOrder = async (orderId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/orders/${orderId}`)
            const order = res.data

            setFormData({
                customerId: order.customerId || '',
                status: order.status,
                paymentMethod: order.paymentMethod,
                notes: '' // Order entity doesn't have notes field in backend yet, but keeping for UI consistency
            })

            // Fix tenantId extraction for existing order if needed or just display

            setItems(order.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                subtotal: item.subtotal,
                total: item.total
            })))
        } catch (error) {
            console.error('Error loading order:', error)
            toast.error('Error al cargar el pedido')
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
        if (!formData.customerId && !id) { // Customer required for new orders
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
                tenantId: user.customer.id,
                customerId: Number(formData.customerId),
                paymentMethod: formData.paymentMethod,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    discount: item.discount
                }))
            }

            if (id) {
                toast.error('La edición de pedidos aún no está implementada en el backend')
                setLoading(false)
                return
            }

            await axiosInstance.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/orders`, payload)

            toast.success('Pedido guardado exitosamente')
            router.push('/ventas/pedidos')
        } catch (error) {
            console.error('Error saving order:', error)
            toast.error('Error al guardar pedido')
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
                            onClick={() => router.push('/ventas/pedidos')}
                        >
                            Volver
                        </Button>
                        <Typography variant="h4">{id ? 'Ver Pedido' : 'Nuevo Pedido'}</Typography>
                    </div>
                    {!id && (
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    )}
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
                            disabled={!!id}
                        >
                            {customers.map((customer) => (
                                <MenuItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                </MenuItem>
                            ))}
                        </CustomTextField>

                        <CustomTextField
                            select
                            fullWidth
                            label="Método de Pago"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            disabled={!!id}
                        >
                            <MenuItem value="CASH">Efectivo</MenuItem>
                            <MenuItem value="CARD">Tarjeta</MenuItem>
                            <MenuItem value="TRANSFER">Transferencia</MenuItem>
                        </CustomTextField>

                        <CustomTextField
                            select
                            fullWidth
                            label="Estado"
                            value={formData.status}
                            disabled // Status change usually via workflow, not direct edit here for now
                        >
                            <MenuItem value="PENDING">Pendiente</MenuItem>
                            <MenuItem value="COMPLETED">Completado</MenuItem>
                            <MenuItem value="CANCELLED">Cancelado</MenuItem>
                        </CustomTextField>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={8}>
                <Card className="h-full">
                    <CardHeader title="Productos" />
                    <CardContent>
                        {!id && (
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
                        )}

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell width={100}>Cant.</TableCell>
                                        <TableCell width={120}>Precio</TableCell>
                                        <TableCell width={120}>Desc.</TableCell>
                                        <TableCell width={120}>Total</TableCell>
                                        {!id && <TableCell width={50}></TableCell>}
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
                                                    disabled={!!id}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    size="small"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                                                    disabled={!!id}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CustomTextField
                                                    type="number"
                                                    size="small"
                                                    value={item.discount}
                                                    onChange={(e) => handleUpdateItem(index, 'discount', Number(e.target.value))}
                                                    disabled={!!id}
                                                />
                                            </TableCell>
                                            <TableCell>${item.total.toFixed(2)}</TableCell>
                                            {!id && (
                                                <TableCell>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                                        <Trash size={18} />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" className="py-8 text-gray-500">
                                                {id ? 'No hay productos' : 'Agregue productos usando el buscador'}
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
        </Grid>
    )
}

export default OrderForm
