'use client'

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import { toast } from 'react-hot-toast'

import CustomTextField from '@core/components/mui/TextField'
import { portfolioService } from '@/services/portfolioService'
import type { PortfolioDocument } from '@/types/portfolio'
import { userMethods } from '@/utils/userMethods'

interface Props {
    open: boolean
    setOpen: (open: boolean) => void
    onSuccess: () => void
    selectedDoc?: PortfolioDocument
}

const PaymentRegistrationDialog = ({ open, setOpen, onSuccess, selectedDoc }: Props) => {
    const [amount, setAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState('Efectivo')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (selectedDoc) {
            setAmount(selectedDoc.balance)
        }
    }, [selectedDoc])

    const handleClose = () => {
        setOpen(false)
        setAmount(0)
        setReference('')
        setNotes('')
    }

    const handleSubmit = async () => {
        if (amount <= 0) {
            toast.error('El monto debe ser mayor a 0')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            if (!user?.customer?.id) throw new Error('No tenant found')

            const paymentData = {
                tenantId: user.customer.id,
                contactId: selectedDoc?.contactId,
                type: 'INCOMING',
                amount: amount,
                paymentDate: new Date().toISOString(),
                paymentMethod: paymentMethod,
                reference: reference,
                notes: notes,
                applications: selectedDoc ? [{
                    documentId: selectedDoc.id,
                    amount: amount
                }] : []
            }

            await portfolioService.createPayment(paymentData)
            toast.success('Pago registrado correctamente')
            onSuccess()
            handleClose()
        } catch (error: any) {
            console.error(error)
            toast.error('Error al registrar el pago')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
            <DialogTitle>Registrar Pago / Recaudo</DialogTitle>
            <DialogContent>
                <Grid container spacing={4} className='mt-2'>
                    <Grid item xs={12}>
                        <Typography variant='body2' className='mb-2'>
                            Documento: <strong>{selectedDoc?.documentNumber}</strong>
                        </Typography>
                        <Typography variant='body2' className='mb-4'>
                            Cliente: <strong>{selectedDoc?.contactName}</strong>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            fullWidth
                            label='Monto'
                            type='number'
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            InputProps={{
                                startAdornment: <InputAdornment position='start'>$</InputAdornment>,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            select
                            fullWidth
                            label='Medio de Pago'
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <MenuItem value='Efectivo'>Efectivo</MenuItem>
                            <MenuItem value='Transferencia'>Transferencia</MenuItem>
                            <MenuItem value='Tarjeta'>Tarjeta</MenuItem>
                            <MenuItem value='Cheque'>Cheque</MenuItem>
                        </CustomTextField>
                    </Grid>
                    <Grid item xs={12}>
                        <CustomTextField
                            fullWidth
                            label='Referencia'
                            placeholder='Número de comprobante, hash, etc.'
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <CustomTextField
                            fullWidth
                            multiline
                            rows={2}
                            label='Observaciones'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color='secondary' disabled={loading}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} variant='contained' disabled={loading}>
                    {loading ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default PaymentRegistrationDialog
