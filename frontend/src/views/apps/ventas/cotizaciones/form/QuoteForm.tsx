'use client'

import React, { useState, useEffect } from 'react'
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
    Box,
    Autocomplete,
    CircularProgress
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { Plus, Trash, Save, ArrowLeft, Search } from 'lucide-react'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import { ProductService, ContactService } from '@/views/apps/pos/services/api'
import { Contact } from '@/views/apps/pos/types'
import { ProductType } from '@/types/apps/productType'
import { useDebounce } from 'use-debounce'

const QuoteForm = () => {
    const router = useRouter()
    const params = useParams()
    const id = params?.id

    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<Contact[]>([])
    const [products, setProducts] = useState<ProductType[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Typeahead state for customers
    const [openCustomers, setOpenCustomers] = useState(false)
    const [customerOptions, setCustomerOptions] = useState<Contact[]>([])
    const [customerLoading, setCustomerLoading] = useState(false)
    const [customerSearch, setCustomerSearch] = useState('')
    const [debouncedCustomerSearch] = useDebounce(customerSearch, 500)

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        expirationDate: '',
        status: 'DRAFT',
        notes: '',
        terms: ''
    })

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        loadInitialData()
        if (id) {
            loadQuote(id as string)
        }
    }, [id])

    // Search customers when debounced input changes
    useEffect(() => {
        if (debouncedCustomerSearch.length > 1) {
            handleSearchCustomers(debouncedCustomerSearch)
        } else if (debouncedCustomerSearch === '') {
            setCustomerOptions([])
        }
    }, [debouncedCustomerSearch])

    const loadInitialData = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const productsData = await ProductService.getAll()
            setProducts(productsData)
            
            // Cargar una lista inicial de clientes sugeridos
            const initialContacts = await ContactService.getAll(tenantId)
            setCustomerOptions(initialContacts.filter(c => c.type === 'CUSTOMER').slice(0, 10))
        } catch (error) {
            console.error('Error loading initial data:', error)
            toast.error('Error al cargar productos')
        }
    }

    const handleSearchCustomers = async (query: string) => {
        try {
            setCustomerLoading(true)
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const res = await axiosInstance.get(`/contacts/search`, {
                params: {
                    tenantId,
                    query: query
                }
            })
            setCustomerOptions(res.data.filter((c: any) => c.type === 'CUSTOMER'))
        } catch (error) {
            console.error('Error searching customers:', error)
        } finally {
            setCustomerLoading(false)
        }
    }

    const loadQuote = async (quoteId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/quotes/${quoteId}`)
            const quote = res.data

            setFormData({
                customerId: quote.customerId || '',
                expirationDate: quote.expirationDate ? quote.expirationDate.split('T')[0] : '',
                status: quote.status,
                notes: quote.notes || '',
                terms: quote.terms || ''
            })

            // Para que el Autocomplete muestre el cliente actual en edición
            if (quote.customerId) {
                const customerRes = await axiosInstance.get(`/contacts/${quote.customerId}`)
                setCustomerOptions([customerRes.data])
            }

            setItems(quote.items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                total: item.total
            })))
        } catch (error) {
            console.error('Error loading quote:', error)
            toast.error('Error al cargar la cotización')
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
        setSearchTerm('') // Limpiar búsqueda
    }

    const handleUpdateItem = (index: number, field: string, value: number) => {
        const newItems = [...items]
        const item = newItems[index]

        if (field === 'quantity') item.quantity = value
        if (field === 'unitPrice') item.unitPrice = value
        if (field === 'discount') item.discount = value

        // Recalcular
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
                expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
                status: formData.status,
                notes: formData.notes,
                terms: formData.terms,
                discount: calculateTotals().discount,
                tax: 0, // Por ahora 0
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount
                }))
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
            const url = id ? `${baseUrl}/quotes/${id}` : `${baseUrl}/quotes`

            if (id) {
                await axiosInstance.put(url, payload)
            } else {
                await axiosInstance.post(url, payload)
            }

            toast.success(id ? 'Cotización actualizada exitosamente' : 'Cotización guardada exitosamente')
            router.push('/ventas/cotizaciones/list')
        } catch (error) {
            console.error('Error saving quote:', error)
            toast.error('Error al guardar cotización')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    ).slice(0, 5) // Limitar a 5 resultados

    const totals = calculateTotals()

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowLeft />}
                            onClick={() => router.push('/ventas/cotizaciones/list')}
                        >
                            Volver
                        </Button>
                        <Typography variant="h4">{id ? 'Editar Cotización' : 'Nueva Cotización'}</Typography>
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

            {/* Datos Generales */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Información General" />
                    <CardContent className="flex flex-col gap-4">
                        <Autocomplete
                            open={openCustomers}
                            onOpen={() => setOpenCustomers(true)}
                            onClose={() => setOpenCustomers(false)}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            getOptionLabel={(option) => `${option.name} (${option.documentNumber || 'Sin ID'}) - ${option.phone || ''}`}
                            options={customerOptions}
                            loading={customerLoading}
                            value={customerOptions.find(c => c.id === Number(formData.customerId)) || null}
                            onChange={(event, newValue) => {
                                setFormData({ ...formData, customerId: newValue ? newValue.id.toString() : '' })
                            }}
                            onInputChange={(event, newInputValue) => {
                                setCustomerSearch(newInputValue)
                            }}
                            renderInput={(params) => (
                                <CustomTextField
                                    {...params}
                                    label="Cliente"
                                    placeholder="Buscar por nombre, ID o teléfono..."
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {customerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <CustomTextField
                            type="date"
                            fullWidth
                            label="Fecha de Vencimiento"
                            InputLabelProps={{ shrink: true }}
                            value={formData.expirationDate}
                            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        />

                        <CustomTextField
                            select
                            fullWidth
                            label="Estado"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="DRAFT">Borrador</MenuItem>
                            <MenuItem value="SENT">Enviada</MenuItem>
                            <MenuItem value="ACCEPTED">Aceptada</MenuItem>
                            <MenuItem value="REJECTED">Rechazada</MenuItem>
                        </CustomTextField>
                    </CardContent>
                </Card>
            </Grid>

            {/* Buscador y Tabla de Items */}
            <Grid item xs={12} md={8}>
                <Card className="h-full">
                    <CardHeader title="Productos" />
                    <CardContent>
                        {/* Buscador */}
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

                        {/* Tabla */}
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

                        {/* Totales */}
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

            {/* Notas y Términos */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Notas y Términos" />
                    <CardContent>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <CustomTextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Notas"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomTextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Términos y Condiciones"
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default QuoteForm
