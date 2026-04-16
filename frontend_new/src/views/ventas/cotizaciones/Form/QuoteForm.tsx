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
    Divider,
    Autocomplete,
    CircularProgress
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { axiosInstance } from '@/utils/axiosInstance'
import { productService } from '@/services/ventas/productService'
import { contactService } from '@/services/marketing/contactService'
import type { Contact } from '@/types/marketing/contactTypes'
import type { Product } from '@/types/ventas/productTypes'
import type { QuoteType, QuoteItemType } from '@/types/ventas/quoteTypes'
import { useDebounce } from 'use-debounce'

const QuoteForm = () => {
    const router = useRouter()
    const params = useParams()
    const id = params?.id

    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
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
        terms: '',
        discount: 0,
        tax: 0
    })

    const [items, setItems] = useState<Partial<QuoteItemType>[]>([])

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
            // Cargar iniciales si está vacío
            loadInitialContacts()
        }
    }, [debouncedCustomerSearch])

    const loadInitialData = async () => {
        try {
            const productsData = await productService.getAllProducts()
            setProducts(productsData)
            loadInitialContacts()
        } catch (error) {
            console.error('Error loading initial data:', error)
            toast.error('Error al cargar datos iniciales')
        }
    }

    const loadInitialContacts = async () => {
        try {
            const contactsData = await contactService.getAllContacts()
            setCustomerOptions(contactsData.filter(c => c.type === 'CUSTOMER' || c.type === 'LEAD').slice(0, 10))
        } catch (error) {
            console.error('Error loading initial contacts:', error)
        }
    }

    const handleSearchCustomers = async (query: string) => {
        try {
            setCustomerLoading(true)
            const res = await axiosInstance.get(`/api/v1/contacts/search`, {
                params: {
                    query: query
                }
            })
            setCustomerOptions(res.data.filter((c: any) => c.type === 'CUSTOMER' || c.type === 'LEAD'))
        } catch (error) {
            console.error('Error searching customers:', error)
        } finally {
            setCustomerLoading(false)
        }
    }

    const loadQuote = async (quoteId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`/quotes/${quoteId}`)
            const quote: QuoteType = res.data

            setFormData({
                customerId: quote.customerId?.toString() || '',
                expirationDate: quote.expirationDate ? quote.expirationDate.split('T')[0] : '',
                status: quote.status,
                notes: quote.notes || '',
                terms: quote.terms || '',
                discount: quote.discount || 0,
                tax: quote.tax || 0
            })

            // Para que el Autocomplete muestre el cliente actual en edición
            if (quote.customerId) {
                const customerRes = await axiosInstance.get(`/api/v1/contacts/${quote.customerId}`)
                setCustomerOptions([customerRes.data])
            }

            setItems(quote.items.map(item => ({
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

    const handleAddItem = (product: Product) => {
        const existingItem = items.find(item => item.productId === product.id)

        if (existingItem) {
            toast.error('El producto ya está en la lista')
            return
        }

        const newItem: Partial<QuoteItemType> = {
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

        // Recalcular
        item.subtotal = (item.quantity || 0) * (item.unitPrice || 0)
        item.total = (item.subtotal || 0) - (item.discount || 0)

        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const calculateTotals = () => {
        const subtotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0)
        const discount = items.reduce((acc, item) => acc + (item.discount || 0), 0)
        const total = items.reduce((acc, item) => acc + (item.total || 0), 0)
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

            const totals = calculateTotals()
            const payload = {
                customerId: Number(formData.customerId),
                expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
                status: formData.status,
                notes: formData.notes,
                terms: formData.terms,
                subtotal: totals.subtotal,
                discount: totals.discount,
                tax: 0,
                total: totals.total,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    subtotal: item.subtotal
                }))
            }

            if (id) {
                await axiosInstance.put(`/quotes/${id}`, payload)
            } else {
                await axiosInstance.post('/quotes', payload)
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
    ).slice(0, 5)

    const totals = calculateTotals()

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <IconButton onClick={() => router.push('/ventas/cotizaciones/list')}>
                            <i className='tabler-arrow-left' />
                        </IconButton>
                        <Typography variant="h4">{id ? 'Editar Cotización' : 'Nueva Cotización'}</Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<i className='tabler-device-floppy' />}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cotización'}
                    </Button>
                </div>
            </Grid>

            {/* Datos Generales */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Información General" />
                    <Divider />
                    <CardContent className="flex flex-col gap-5">
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
                    <CardHeader title="Productos y Servicios" />
                    <Divider />
                    <CardContent>
                        {/* Buscador */}
                        <div className="relative mb-6">
                            <CustomTextField
                                fullWidth
                                placeholder="Buscar producto por nombre o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <i className='tabler-search mr-2 text-textSecondary' />
                                }}
                            />
                            {searchTerm.length > 1 && (
                                <Paper className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto border shadow-lg">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="p-3 hover:bg-actionHover cursor-pointer border-b flex justify-between items-center"
                                            onClick={() => handleAddItem(product)}
                                        >
                                            <div>
                                                <Typography className="font-bold">{product.productName}</Typography>
                                                <Typography variant="caption" color="textSecondary">Stock: {product.inventoryQty || 0}</Typography>
                                            </div>
                                            <Typography className="font-bold text-primary">
                                                ${product.salePrice || product.price || 0}
                                            </Typography>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-3 text-center text-textSecondary">No se encontraron productos</div>
                                    )}
                                </Paper>
                            )}
                        </div>

                        {/* Tabla */}
                        <TableContainer component={Paper} variant="outlined" className="border-none shadow-none">
                            <Table size="small">
                                <TableHead className="bg-actionHover">
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell width={80}>Cant.</TableCell>
                                        <TableCell width={120}>Precio</TableCell>
                                        <TableCell width={100}>Desc.</TableCell>
                                        <TableCell width={100} align="right">Total</TableCell>
                                        <TableCell width={50}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Typography variant="body2" className="font-medium">{item.productName}</Typography>
                                            </TableCell>
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
                                            <TableCell align="right">
                                                <Typography variant="body2" className="font-bold">${(item.total || 0).toLocaleString()}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                                    <i className='tabler-trash' />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" className="py-12">
                                                <Typography color="textSecondary">Agregue productos usando el buscador superior</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Totales */}
                        <Divider className="my-4" />
                        <div className="flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between">
                                    <Typography color="textSecondary">Subtotal:</Typography>
                                    <Typography className="font-bold">${totals.subtotal.toLocaleString()}</Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography color="error">Descuento:</Typography>
                                    <Typography color="error" className="font-bold">-${totals.discount.toLocaleString()}</Typography>
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

            {/* Notas y Términos */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader title="Notas y Términos" />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={5}>
                            <Grid item xs={12} md={6}>
                                <CustomTextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Notas internas"
                                    placeholder="Estas notas no son visibles para el cliente"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomTextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Términos y Condiciones"
                                    placeholder="Términos legales, garantías, etc."
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
