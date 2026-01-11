'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardContent, Grid, Button, Typography, MenuItem, CircularProgress } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const SupplierForm = () => {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        tipoDocumento: '31', // NIT
        numeroDocumento: '',
        dv: '',
        razonSocial: '',
        nombreComercial: '',
        direccion: '',
        telefono: '',
        email: '',
        ciudad: '',
        departamento: '',
        pais: 'CO',
        responsabilidadesFiscales: '',
        regimenFiscal: '48', // Resp. IVA
        activo: true,
        esFacturadorElectronico: false
    })

    useEffect(() => {
        if (id) {
            loadSupplier(id as string)
        }
    }, [id])

    const loadSupplier = async (supplierId: string) => {
        try {
            setLoading(true)
            const res = await axiosInstance.get(`${API_BASE_URL}/api/v1/proveedores/${supplierId}`)
            setFormData(res.data)
        } catch (e) {
            console.error(e)
            toast.error('Error cargando proveedor')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        // Validations
        if (!formData.tipoDocumento) return toast.error('Tipo de documento es obligatorio')
        if (!formData.numeroDocumento) return toast.error('Número de documento es obligatorio')
        if (!formData.razonSocial) return toast.error('Razón Social es obligatoria')
        if (!formData.ciudad || !formData.departamento) return toast.error('Ubicación es obligatoria')
        if (!formData.email && !formData.telefono) return toast.error('Email o Teléfono es obligatorio')

        try {
            setLoading(true)
            const user = userMethods.getUserLogin()
            const tenantId = user.customer?.id || user.tenantId

            const payload = { ...formData, tenantId }

            if (id) {
                await axiosInstance.put(`${API_BASE_URL}/api/v1/proveedores/${id}`, payload)
                toast.success('Proveedor actualizado')
            } else {
                await axiosInstance.post(`${API_BASE_URL}/api/v1/proveedores?tenantId=${tenantId}`, payload)
                toast.success('Proveedor creado')
            }
            router.push('/compras/proveedores/list')
        } catch (e) {
            console.error(e)
            toast.error('Error al guardar proveedor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader
                title={id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                action={
                    <Button variant='outlined' startIcon={<ArrowLeft />} onClick={() => router.push('/compras/proveedores/list')}>
                        Volver
                    </Button>
                }
            />
            <CardContent>
                <Grid container spacing={5}>
                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            select
                            fullWidth
                            label="Tipo Documento"
                            value={formData.tipoDocumento}
                            onChange={e => handleChange('tipoDocumento', e.target.value)}
                        >
                            <MenuItem value="31">NIT</MenuItem>
                            <MenuItem value="13">Cédula de Ciudadanía</MenuItem>
                            <MenuItem value="22">Cédula de Extranjería</MenuItem>
                            <MenuItem value="42">Documento Extranjero</MenuItem>
                        </CustomTextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            fullWidth
                            label="Número Documento"
                            value={formData.numeroDocumento}
                            onChange={e => handleChange('numeroDocumento', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <CustomTextField
                            fullWidth
                            label="DV"
                            value={formData.dv}
                            onChange={e => handleChange('dv', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            fullWidth
                            label="Razón Social"
                            value={formData.razonSocial}
                            onChange={e => handleChange('razonSocial', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            fullWidth
                            label="Nombre Comercial"
                            value={formData.nombreComercial}
                            onChange={e => handleChange('nombreComercial', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            fullWidth
                            label="Email"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            fullWidth
                            label="Teléfono"
                            value={formData.telefono}
                            onChange={e => handleChange('telefono', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={12}>
                        <CustomTextField
                            fullWidth
                            label="Dirección"
                            value={formData.direccion}
                            onChange={e => handleChange('direccion', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            fullWidth
                            label="País"
                            value={formData.pais}
                            onChange={e => handleChange('pais', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            fullWidth
                            label="Departamento"
                            value={formData.departamento}
                            onChange={e => handleChange('departamento', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomTextField
                            fullWidth
                            label="Ciudad"
                            value={formData.ciudad}
                            onChange={e => handleChange('ciudad', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <CustomTextField
                            select
                            fullWidth
                            label="Régimen Fiscal"
                            value={formData.regimenFiscal}
                            onChange={e => handleChange('regimenFiscal', e.target.value)}
                        >
                            <MenuItem value="48">Responsable de Impuesto (48)</MenuItem>
                            <MenuItem value="49">No Responsable de IVA (49)</MenuItem>
                        </CustomTextField>
                    </Grid>

                    <Grid item xs={12} sm={6} className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.esFacturadorElectronico}
                                onChange={e => handleChange('esFacturadorElectronico', e.target.checked)}
                                className="w-4 h-4"
                            />
                            <Typography>Es Facturador Electrónico</Typography>
                        </label>
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Proveedor'}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default SupplierForm
