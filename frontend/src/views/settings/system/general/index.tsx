'use client'

import React, { useEffect, useState } from 'react'
import {
    Card,
    CardHeader,
    CardContent,
    FormControlLabel,
    Switch,
    Typography,
    Alert,
    CircularProgress,
    Button
} from '@mui/material'
import { useSession } from 'next-auth/react'

// You might need a service to fetch/update "My Company" or "Current Customer"
// Assuming customerService has methods for this, or we create a specific one
import { customerService } from '@/services/customers/customerService'

const GeneralSettings = () => {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDianEnabled, setIsDianEnabled] = useState(false)
    const [companyData, setCompanyData] = useState<any>(null)

    // TODO: Determine how to get the current tenant's company ID
    // Often it's session.user.companyId or similar
    // For now we might need to fetch by tenantId or just assume ID 1 for dev if not available
    const tenantId = 1; // Placeholder/Logic to get real ID

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch current company data
                // This endpoint needs to exist on backend: GET /api/customers/me or similar
                // Or fetch list and find by tenant

                // Mocking implementation plan:
                // We will add a logic to get the "Self" customer.
                // For now, let's assume we can fetch customer by ID 1
                const data = await customerService.getCustomerById(1)
                setCompanyData(data)
                setIsDianEnabled(data.esEmisorFE || false)
            } catch (error) {
                console.error('Error fetching settings', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleToggle = async (checked: boolean) => {
        setIsDianEnabled(checked) // Optimistic update

        try {
            setSaving(true)
            // Update only the esEmisorFE field
            // dependent on how the update API works (PUT vs PATCH)
            if (companyData) {
                await customerService.updateCustomer(companyData.id, {
                    ...companyData,
                    esEmisorFE: checked
                })
                // Ideally, trigger a context refresh here so the Menu updates immediately
                window.location.reload() // Simple brute force refresh for menu to catch up
            }
        } catch (error) {
            console.error('Error updating DIAN status', error)
            setIsDianEnabled(!checked) // Revert
            alert('Error al actualizar la configuración')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <CircularProgress />

    return (
        <Card>
            <CardHeader title="Configuración General" />
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Facturación Electrónica DIAN</Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    Al activar esta opción, se habilitarán los módulos de configuración DIAN,
                    y los campos de facturación electrónica en el módulo de Ventas.
                </Alert>

                <FormControlLabel
                    control={
                        <Switch
                            checked={isDianEnabled}
                            onChange={(e) => handleToggle(e.target.checked)}
                            disabled={saving}
                        />
                    }
                    label={isDianEnabled ? "Habilitada" : "Deshabilitada"}
                />

                {saving && <Typography variant="caption" sx={{ ml: 2 }}>Guardando...</Typography>}
            </CardContent>
        </Card>
    )
}

export default GeneralSettings
