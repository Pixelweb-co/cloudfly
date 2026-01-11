'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, Grid, Button, Typography, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Send, Trash, Plus } from 'lucide-react'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import { AccountingVoucherModal } from '@/components/accounting/AccountingVoucherModal'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const SupportDocumentForm = () => {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        proveedorId: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        status: 'BORRADOR'
    })

    const [items, setItems] = useState<any[]>([])

    // Accounting
    const [accountingModalOpen, setAccountingModalOpen] = useState(false)
    const [docData, setDocData] = useState<any>(null)

    // Item input state
    const [newItem, setNewItem] = useState({
        productName: '',
        descripcion: '',
        quantity: 1,
        unitPrice: 0,
        unidadMedida: '94',
        porcentajeImpuesto: 0
    })

    useEffect(() => {
        loadSuppliers()
        if (id) {
            loadDocument(id as string)
        }
    }, [id])

    const loadSuppliers = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId
            const res = await axiosInstance.get(`${API_BASE_URL}/api/v1/proveedores?tenantId=${tenantId}&soloActivos=true`)
            setSuppliers(res.data)
        } catch (e) { console.error(e) }
    }

    const loadDocument = async (docId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${API_BASE_URL}/api/v1/documentos-soporte/${docId}`)
            const doc = res.data
            setDocData(doc)
            setFormData({
                proveedorId: doc.proveedorId,
                fecha: doc.fecha,
                observaciones: doc.mensajeDian || '', // Or other field
                status: doc.estado
            })
            setItems(doc.items)
        } catch (e) {
            console.error(e)
            toast.error('Error al cargar documento')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = () => {
        if (!newItem.productName) return toast.error('Nombre de producto requerido')
        if (newItem.quantity <= 0) return toast.error('Cantidad inválida')
        if (newItem.unitPrice <= 0) return toast.error('Precio inválido')

        setItems([...items, { ...newItem }])
        setNewItem({
            productName: '',
            descripcion: '',
            quantity: 1,
            unitPrice: 0,
            unidadMedida: '94',
            porcentajeImpuesto: 0
        })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (!formData.proveedorId) return toast.error('Seleccione proveedor')
        if (items.length === 0) return toast.error('Agregue al menos un item')

        try {
            setLoading(true)
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId

            const payload = {
                fecha: formData.fecha,
                proveedorId: Number(formData.proveedorId),
                observaciones: formData.observaciones,
                items: items
            }

            // Only Create supported for now (Updating items is complex without ID logic, assume CREATE only for MVP)
            if (id) {
                toast.error('Edición no soportada, cree uno nuevo')
                setLoading(false)
                return
            }

            await axiosInstance.post(`${API_BASE_URL}/api/v1/documentos-soporte?tenantId=${tenantId}`, payload)
            toast.success('Documento guardado')
            router.push('/compras/documentos-soporte/list')

        } catch (e) {
            console.error(e)
            toast.error('Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!id) return
        try {
            setLoading(true)
            await axiosInstance.post(`${API_BASE_URL}/api/v1/documentos-soporte/${id}/aprobar`)
            toast.success('Aprobado y enviado a DIAN')
            loadDocument(id as string)
        } catch (e) {
            console.error(e)
            toast.error('Error al aprobar')
        } finally {
            setLoading(false)
        }
    }

    // Totals
    const subtotal = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)
    const tax = items.reduce((acc, i) => acc + ((i.quantity * i.unitPrice) * (i.porcentajeImpuesto / 100)), 0)
    const total = subtotal + tax

    const isReadOnly = formData.status !== 'BORRADOR' && !!id

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2 items-center">
                        <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => router.push('/compras/documentos-soporte/list')}>
                            Volver
                        </Button>
                        <Typography variant='h4'>{id ? 'Detalle Documento Soporte' : 'Nuevo Documento Soporte'}</Typography>
                        {formData.status && <Chip label={formData.status} color={formData.status === 'BORRADOR' ? 'warning' : 'success'} />}
                    </div>
                    <div className="flex gap-2">
                        {!id && (
                            <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={loading}>
                                Guardar Borrador
                            </Button>
                        )}
                        {id && formData.status === 'BORRADOR' && (
                            <Button variant="contained" color="success" startIcon={<Send />} onClick={handleApprove} disabled={loading}>
                                Aprobar y Enviar a DIAN
                            </Button>
                        )}
                        {docData?.accountingGenerated && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => setAccountingModalOpen(true)}
                                size="small"
                            >
                                Ver Contabilidad
                            </Button>
                        )}
                    </div>
                </div>
            </Grid>

            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader title="Información General" />
                    <CardContent className="flex flex-col gap-4">
                        <CustomTextField
                            select
                            fullWidth
                            label="Proveedor"
                            value={formData.proveedorId}
                            onChange={e => setFormData({ ...formData, proveedorId: e.target.value })}
                            disabled={isReadOnly}
                        >
                            {suppliers.map(s => (
                                <MenuItem key={s.id} value={s.id}>{s.razonSocial} ({s.numeroDocumento})</MenuItem>
                            ))}
                        </CustomTextField>
                        <CustomTextField
                            type="date"
                            fullWidth
                            label="Fecha"
                            value={formData.fecha}
                            onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                            disabled={isReadOnly}
                        />
                        <CustomTextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Observaciones"
                            value={formData.observaciones}
                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={8}>
                <Card>
                    <CardHeader title="Items" />
                    <CardContent>
                        {!isReadOnly && (
                            <div className="flex gap-2 mb-4 items-end flex-wrap bg-gray-50 p-3 rounded">
                                <CustomTextField
                                    label="Producto/Servicio"
                                    className="flex-grow"
                                    value={newItem.productName}
                                    onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                                />
                                <CustomTextField
                                    label="Cant."
                                    type="number"
                                    className="w-24"
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                />
                                <CustomTextField
                                    label="Precio Unit."
                                    type="number"
                                    className="w-32"
                                    value={newItem.unitPrice}
                                    onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                                />
                                <CustomTextField
                                    label="IVA %"
                                    type="number"
                                    className="w-24"
                                    value={newItem.porcentajeImpuesto}
                                    onChange={e => setNewItem({ ...newItem, porcentajeImpuesto: Number(e.target.value) })}
                                />
                                <Button variant="contained" onClick={handleAddItem}><Plus /></Button>
                            </div>
                        )}

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Cant.</TableCell>
                                    <TableCell>Precio</TableCell>
                                    <TableCell>Subtotal</TableCell>
                                    <TableCell>Impuesto</TableCell>
                                    <TableCell>Total</TableCell>
                                    {!isReadOnly && <TableCell></TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, idx) => {
                                    const sub = item.quantity * item.unitPrice
                                    const imp = sub * (item.porcentajeImpuesto / 100)
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                                            <TableCell>${sub.toFixed(2)}</TableCell>
                                            <TableCell>${imp.toFixed(2)} ({item.porcentajeImpuesto}%)</TableCell>
                                            <TableCell>${(sub + imp).toFixed(2)}</TableCell>
                                            {!isReadOnly && (
                                                <TableCell>
                                                    <IconButton color="error" size="small" onClick={() => handleRemoveItem(idx)}>
                                                        <Trash size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>

                        <div className="flex justify-end mt-4">
                            <div className="w-64">
                                <div className="flex justify-between">
                                    <Typography>Subtotal:</Typography>
                                    <Typography>${subtotal.toFixed(2)}</Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography>Impuestos:</Typography>
                                    <Typography>${tax.toFixed(2)}</Typography>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <Typography>Total:</Typography>
                                    <Typography>${total.toFixed(2)}</Typography>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Grid>

            {docData?.accountingVoucherId && (
                <AccountingVoucherModal
                    open={accountingModalOpen}
                    onOpenChange={setAccountingModalOpen}
                    voucherId={docData.accountingVoucherId}
                />
            )}
        </Grid>
    )
}

export default SupportDocumentForm
