'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, Grid, Button, Typography, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Search, Trash } from 'lucide-react'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const CreditNoteForm = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    // Form fields
    const [invoiceId, setInvoiceId] = useState('')
    const [motivo, setMotivo] = useState('')
    const [codigoMotivo, setCodigoMotivo] = useState('1') // Default 1 (Devolución)

    useEffect(() => {
        loadInvoices()
    }, [])

    const loadInvoices = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId
            const res = await axiosInstance.get(`${API_BASE_URL}/invoices/tenant/${tenantId}`)
            // Filter only issued invoices
            setInvoices(res.data.filter((inv: any) => inv.status === 'ISSUED' || inv.status === 'PAID'))
        } catch (e) {
            console.error('Error loading invoices', e)
        }
    }

    const handleInvoiceChange = async (invId: string) => {
        setInvoiceId(invId)
        if (!invId) {
            setSelectedInvoice(null)
            setItems([])
            return
        }

        try {
            const res = await axiosInstance.get(`${API_BASE_URL}/invoices/${invId}`)
            setSelectedInvoice(res.data)
            // Pre-fill items from invoice
            setItems(res.data.items.map((item: any) => ({
                ...item,
                creditQuantity: item.quantity, // Default to full return
                creditTotal: item.total
            })))
        } catch (e) {
            console.error('Error loading invoice details', e)
        }
    }

    const handleUpdateItem = (index: number, qty: number) => {
        const newItems = [...items]
        const item = newItems[index]

        if (qty > item.quantity) {
            toast.error(`Cantidad no puede superar la original (${item.quantity})`)
            return
        }

        item.creditQuantity = qty
        // Simple proportional calculation (ignores complex tax logic for MVP)
        const ratio = qty / item.quantity
        item.creditTotal = item.total * ratio

        setItems(newItems)
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (!selectedInvoice) return toast.error('Seleccione una factura')
        if (!motivo) return toast.error('Ingrese un motivo')
        if (items.length === 0) return toast.error('Debe haber al menos un item')

        try {
            setLoading(true)
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId

            const payload = {
                invoiceIdReferencia: selectedInvoice.id,
                numeroFacturaOriginal: selectedInvoice.invoiceNumber,
                cufeFacturaOriginal: selectedInvoice.cufe,
                fechaFacturaOriginal: selectedInvoice.issueDate.split('T')[0],
                motivo,
                codigoMotivoDian: codigoMotivo,
                fechaEmision: new Date().toISOString().split('T')[0],
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.creditQuantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.unitPrice * item.creditQuantity, // Simplified
                    total: item.creditTotal,
                    // DIAN fields
                    unidadMedida: item.unitMeasure || '94',
                    descripcion: item.descriptionDian || item.productName,
                    porcentajeImpuesto: item.taxRate || 0
                }))
            }

            // Create
            const createRes = await axiosInstance.post(`${API_BASE_URL}/api/v1/notas-credito?tenantId=${tenantId}`, payload)
            const noteId = createRes.data.id

            // Auto-Approve for simplicity in this flow, or redirect to review
            await axiosInstance.post(`${API_BASE_URL}/api/v1/notas-credito/${noteId}/aprobar`)

            toast.success('Nota de crédito creada y aprobada')
            router.push('/ventas/notas-credito/list')

        } catch (e) {
            console.error('Error creating credit note', e)
            toast.error('Error al crear nota de crédito')
        } finally {
            setLoading(false)
        }
    }

    const totalCredit = items.reduce((acc, item) => acc + (item.creditTotal || 0), 0)

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => router.push('/ventas/notas-credito/list')}>
                        Volver
                    </Button>
                    <Typography variant='h4'>Nueva Nota de Crédito</Typography>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Procesando...' : 'Crear Nota'}
                    </Button>
                </div>
            </Grid>

            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Referencia" />
                    <CardContent className="flex flex-col gap-4">
                        <CustomTextField
                            select
                            fullWidth
                            label="Factura Origen"
                            value={invoiceId}
                            onChange={e => handleInvoiceChange(e.target.value)}
                        >
                            {invoices.map(inv => (
                                <MenuItem key={inv.id} value={inv.id}>
                                    {inv.invoiceNumber} - {inv.customerName} - ${inv.total}
                                </MenuItem>
                            ))}
                        </CustomTextField>
                        {selectedInvoice && (
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><strong>Fecha:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                                <p><strong>CUFE:</strong> {selectedInvoice.cufe || 'N/A'}</p>
                            </div>
                        )}
                        <CustomTextField
                            select
                            fullWidth
                            label="Código Motivo DIAN"
                            value={codigoMotivo}
                            onChange={e => setCodigoMotivo(e.target.value)}
                        >
                            <MenuItem value="1">1. Devolución parcial de los bienes y/o no aceptación parcial del servicio</MenuItem>
                            <MenuItem value="2">2. Anulación de factura electrónica</MenuItem>
                            <MenuItem value="3">3. Rebaja o descuento parcial o total</MenuItem>
                            <MenuItem value="4">4. Ajuste de precio</MenuItem>
                            <MenuItem value="5">5. Otros</MenuItem>
                        </CustomTextField>
                        <CustomTextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Motivo / Observación"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={8}>
                <Card>
                    <CardHeader title="Items a Acreditar" />
                    <CardContent>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Cant. Orig.</TableCell>
                                    <TableCell width={100}>Cant. Nota</TableCell>
                                    <TableCell>Total Orig.</TableCell>
                                    <TableCell>Total Nota</TableCell>
                                    <TableCell>Accion</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            <CustomTextField
                                                type="number"
                                                size="small"
                                                value={item.creditQuantity}
                                                onChange={e => handleUpdateItem(idx, Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>${item.total.toFixed(2)}</TableCell>
                                        <TableCell>${(item.creditTotal || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <IconButton color="error" size="small" onClick={() => removeItem(idx)}>
                                                <Trash size={16} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {selectedInvoice && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">Todos los items removidos</TableCell>
                                    </TableRow>
                                )}
                                {!selectedInvoice && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">Seleccione factura</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end mt-4">
                            <Typography variant="h6">Total Nota: ${totalCredit.toFixed(2)}</Typography>
                        </div>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default CreditNoteForm
