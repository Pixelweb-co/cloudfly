'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-hot-toast'
import type { InvoiceType } from '@/types/ventas/invoiceTypes'

const InvoiceView = () => {
    const { id } = useParams()
    const router = useRouter()
    const [invoice, setInvoice] = useState<InvoiceType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await axiosInstance.get(`/internal/billing/invoices/${id}`)
                setInvoice(res.data)
            } catch (error) {
                console.error('Error fetching invoice:', error)
                toast.error('No se pudo cargar la factura')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchInvoice()
    }, [id])

    if (loading) return <div className="p-6 text-center">Cargando factura...</div>
    if (!invoice) return <div className="p-6 text-center">Factura no encontrada</div>

    return (
        <Box className='p-6'>
            <Grid container spacing={6}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box className='flex justify-between items-center mb-6'>
                                <Typography variant='h5'>Factura #{invoice.invoiceNumber}</Typography>
                                <Chip label={invoice.status} color={invoice.status === 'PAGADA' ? 'success' : 'warning'} variant='tonal' />
                            </Box>
                            
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant='body2' color='textSecondary'>Fecha de Emisión</Typography>
                                    <Typography variant='body1'>{new Date(invoice.issueDate).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant='body2' color='textSecondary'>Fecha de Vencimiento</Typography>
                                    <Typography variant='body1'>{new Date(invoice.dueDate).toLocaleDateString()}</Typography>
                                </Grid>
                            </Grid>

                            <Divider className='my-6' />

                            <Box className='flex justify-between mb-2'>
                                <Typography>Subtotal</Typography>
                                <Typography>{invoice.currency} ${invoice.subtotal.toLocaleString()}</Typography>
                            </Box>
                            <Box className='flex justify-between mb-2'>
                                <Typography>IVA</Typography>
                                <Typography>{invoice.currency} ${invoice.tax.toLocaleString()}</Typography>
                            </Box>
                            <Box className='flex justify-between mt-4'>
                                <Typography variant='h6'>Total</Typography>
                                <Typography variant='h6' color='primary'>{invoice.currency} ${invoice.total.toLocaleString()}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent className='flex flex-col gap-4'>
                            <Button 
                                variant='contained' 
                                fullWidth 
                                startIcon={<i className='tabler-file-type-pdf' />}
                                onClick={() => invoice.pdfUrl && window.open(invoice.pdfUrl, '_blank')}
                                disabled={!invoice.pdfUrl}
                            >
                                Descargar PDF
                            </Button>
                            <Button 
                                variant='outlined' 
                                fullWidth
                                onClick={() => router.back()}
                            >
                                Volver
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    )
}

export default InvoiceView
