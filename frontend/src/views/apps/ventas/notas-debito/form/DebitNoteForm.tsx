'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, Grid, Button, Typography, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Trash } from 'lucide-react'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const DebitNoteForm = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    const [invoiceId, setInvoiceId] = useState('')
    const [motivo, setMotivo] = useState('')
    const [codigoMotivo, setCodigoMotivo] = useState('1') // 1. Intereses, 2. Gastos por cobrar, 3. Cambio valor

    useEffect(() => {
        loadInvoices()
    }, [])

    const loadInvoices = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId
            const res = await axiosInstance.get(`${API_BASE_URL}/invoices/tenant/${tenantId}`)
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
            // For Debit Note we usually ADD value/items, not necessarily return items.
            // But often it references invoice items to increase price.
            // For MVP let's allow copying items to "increase value" or add generic debit note items.
            // For now, simpler: copy items and allow user to edit "Debit Value"
            setItems(res.data.items.map((item: any) => ({
                ...item,
                debitQuantity: item.quantity,
                debitTotal: 0 // User must input the debit amount
            })))
        } catch (e) { console.error(e) }
    }

    const handleUpdateItem = (index: number, val: number) => {
        const newItems = [...items]
        newItems[index].debitTotal = val
        setItems(newItems)
    }

    const removeItem = (idx: number) => {
        const newItems = [...items]
        newItems.splice(idx, 1)
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (!selectedInvoice) return toast.error('Seleccione factura')
        if (!motivo) return toast.error('Ingrese motivo')

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
                items: items.filter(i => i.debitTotal > 0).map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.debitQuantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.debitTotal, // In debit note, total is the extra charge
                    total: item.debitTotal,
                    unidadMedida: item.unitMeasure || '94',
                    descripcion: item.descriptionDian || item.productName,
                    porcentajeImpuesto: item.taxRate || 0
                }))
            }

            if (payload.items.length === 0) return toast.error('Ingrese valor > 0 para al menos un item')

            const createRes = await axiosInstance.post(`${API_BASE_URL}/api/v1/notas-debito?tenantId=${tenantId}`, payload)
            const noteId = createRes.data.id

            await axiosInstance.post(`${API_BASE_URL}/api/v1/notas-debito/${noteId}/aprobar`)

            toast.success('Nota de débito creada')
            router.push('/ventas/notas-debito/list')
        } catch (e) {
            console.error(e)
            toast.error('Error al crear nota débito')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => router.push('/ventas/notas-debito/list')}>
                        Volver
                    </Button>
                    <Typography variant='h4'>Nueva Nota de Débito</Typography>
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
                            label="Código Motivo DIAN (Débito)"
                            value={codigoMotivo}
                            onChange={e => setCodigoMotivo(e.target.value)}
                        >
                            <MenuItem value="1">1. Intereses</MenuItem>
                            <MenuItem value="2">2. Gastos por cobrar</MenuItem>
                            <MenuItem value="3">3. Cambio del valor</MenuItem>
                            <MenuItem value="4">4. Otros</MenuItem>
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
                    <CardHeader title="Items a Debitar (Cargar Mayor Valor)" />
                    <CardContent>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Total Orig.</TableCell>
                                    <TableCell width={150}>Valor Adicional (Débito)</TableCell>
                                    <TableCell>Accion</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>${item.total.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <CustomTextField
                                                type="number"
                                                size="small"
                                                value={item.debitTotal}
                                                onChange={e => handleUpdateItem(idx, Number(e.target.value))}
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton color="error" size="small" onClick={() => removeItem(idx)}>
                                                <Trash size={16} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!selectedInvoice && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">Seleccione factura</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default DebitNoteForm
