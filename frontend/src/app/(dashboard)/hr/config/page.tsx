'use client'

import { useState, useEffect } from 'react'
import { PayrollConfiguration, payrollConfigService } from '@/services/hr/payrollConfigService'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    InputAdornment,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip
} from '@mui/material'
import {
    Settings,
    Save,
    Refresh,
    ExpandMore,
    CalendarMonth,
    Percent,
    AttachMoney,
    Receipt,
    AccountBalance,
    Email,
    WhatsApp
} from '@mui/icons-material'

export default function ConfigPage() {
    const [config, setConfig] = useState<PayrollConfiguration | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<string | false>('prestaciones')
    const customerId = 1

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await payrollConfigService.getConfig(customerId)
            setConfig(data)
        } catch (err) {
            setError('Error al cargar la configuración')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!config) return
        try {
            setSaving(true)
            setError(null)
            await payrollConfigService.updateConfig(customerId, config)
            setSuccess('Configuración guardada exitosamente')
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        if (!confirm('¿Estás seguro de restaurar la configuración a valores por defecto?')) return
        try {
            setLoading(true)
            const result = await payrollConfigService.resetConfig(customerId)
            setConfig(result.config)
            setSuccess('Configuración restaurada a valores por defecto')
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError('Error al restaurar la configuración')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof PayrollConfiguration, value: any) => {
        if (!config) return
        setConfig({ ...config, [field]: value })
    }

    const handleAccordionChange = (panel: string) => (_: any, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false)
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={3}>
                <CardHeader
                    avatar={<Settings sx={{ fontSize: 40, color: 'primary.main' }} />}
                    title={
                        <Typography variant="h4" fontWeight="bold">
                            Configuración de Nómina
                        </Typography>
                    }
                    subheader="Configura los parámetros generales para el cálculo de nómina"
                    action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={handleReset}
                                disabled={saving}
                            >
                                Restaurar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </Box>
                    }
                />
                <CardContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    {config && (
                        <Box>
                            {/* PRESTACIONES SOCIALES */}
                            <Accordion expanded={expanded === 'prestaciones'} onChange={handleAccordionChange('prestaciones')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
                                    <Typography variant="h6">Prestaciones Sociales</Typography>
                                    <Chip label="Obligatorio" size="small" color="primary" sx={{ ml: 2 }} />
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Días de Aguinaldo"
                                                value={config.aguinaldoDays}
                                                onChange={(e) => handleChange('aguinaldoDays', parseInt(e.target.value))}
                                                helperText="Mínimo legal: 15 días"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Días de Vacaciones por Año"
                                                value={config.vacationDaysPerYear}
                                                onChange={(e) => handleChange('vacationDaysPerYear', parseInt(e.target.value))}
                                                helperText="Mínimo legal: 15 días (Colombia)"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Prima Vacacional"
                                                value={config.vacationPremiumPercentage}
                                                onChange={(e) => handleChange('vacationPremiumPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                                helperText="Mínimo legal: 25%"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* IMPUESTOS Y DEDUCCIONES */}
                            <Accordion expanded={expanded === 'impuestos'} onChange={handleAccordionChange('impuestos')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Percent sx={{ mr: 2, color: 'error.main' }} />
                                    <Typography variant="h6">Impuestos y Deducciones</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.applyIsr}
                                                        onChange={(e) => handleChange('applyIsr', e.target.checked)}
                                                    />
                                                }
                                                label="Aplicar Retención en la Fuente / ISR"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.applyImss}
                                                        onChange={(e) => handleChange('applyImss', e.target.checked)}
                                                    />
                                                }
                                                label="Aplicar Seguridad Social (Salud/Pensión)"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 2 }}>
                                                <Chip label="Porcentajes Colombia" size="small" />
                                            </Divider>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Salud Empleado"
                                                value={config.healthPercentageEmployee}
                                                onChange={(e) => handleChange('healthPercentageEmployee', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Salud Empleador"
                                                value={config.healthPercentageEmployer}
                                                onChange={(e) => handleChange('healthPercentageEmployer', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Pensión Empleado"
                                                value={config.pensionPercentageEmployee}
                                                onChange={(e) => handleChange('pensionPercentageEmployee', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Pensión Empleador"
                                                value={config.pensionPercentageEmployer}
                                                onChange={(e) => handleChange('pensionPercentageEmployer', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% ARL (según riesgo)"
                                                value={config.arlPercentage}
                                                onChange={(e) => handleChange('arlPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                                helperText="Riesgo I: 0.522%, II: 1.044%, III: 2.436%"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Fondo Solidaridad (>4 SMMLV)"
                                                value={config.solidarityFundPercentage}
                                                onChange={(e) => handleChange('solidarityFundPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* PARAFISCALES */}
                            <Accordion expanded={expanded === 'parafiscales'} onChange={handleAccordionChange('parafiscales')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Receipt sx={{ mr: 2, color: 'warning.main' }} />
                                    <Typography variant="h6">Aportes Parafiscales</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% Caja de Compensación"
                                                value={config.parafiscalCajaPercentage}
                                                onChange={(e) => handleChange('parafiscalCajaPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% SENA"
                                                value={config.parafiscalSenaPercentage}
                                                onChange={(e) => handleChange('parafiscalSenaPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="% ICBF"
                                                value={config.parafiscalIcbfPercentage}
                                                onChange={(e) => handleChange('parafiscalIcbfPercentage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* SALARIOS DE REFERENCIA */}
                            <Accordion expanded={expanded === 'salarios'} onChange={handleAccordionChange('salarios')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <AttachMoney sx={{ mr: 2, color: 'success.main' }} />
                                    <Typography variant="h6">Salarios de Referencia</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Salario Mínimo (SMMLV)"
                                                value={config.minimumWage}
                                                onChange={(e) => handleChange('minimumWage', parseFloat(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                                helperText="2024 Colombia: $1,300,000"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Auxilio de Transporte"
                                                value={config.transportAllowance}
                                                onChange={(e) => handleChange('transportAllowance', parseFloat(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                                helperText="2024 Colombia: $162,000"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="UMA / UVT"
                                                value={config.umaValue}
                                                onChange={(e) => handleChange('umaValue', parseFloat(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                }}
                                                helperText="2024 Colombia UVT: $47,065"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* INTEGRACIÓN CONTABLE */}
                            <Accordion expanded={expanded === 'contabilidad'} onChange={handleAccordionChange('contabilidad')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <AccountBalance sx={{ mr: 2, color: 'info.main' }} />
                                    <Typography variant="h6">Integración Contable</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.enableAccountingIntegration}
                                                        onChange={(e) => handleChange('enableAccountingIntegration', e.target.checked)}
                                                    />
                                                }
                                                label="Integrar con módulo de contabilidad (generar pólizas automáticas)"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Cuenta Gasto de Nómina"
                                                value={config.payrollExpenseAccount || ''}
                                                onChange={(e) => handleChange('payrollExpenseAccount', e.target.value)}
                                                placeholder="Ej: 5105"
                                                disabled={!config.enableAccountingIntegration}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Cuenta Impuestos por Pagar"
                                                value={config.taxesPayableAccount || ''}
                                                onChange={(e) => handleChange('taxesPayableAccount', e.target.value)}
                                                placeholder="Ej: 2365"
                                                disabled={!config.enableAccountingIntegration}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Cuenta Sueldos por Pagar"
                                                value={config.salariesPayableAccount || ''}
                                                onChange={(e) => handleChange('salariesPayableAccount', e.target.value)}
                                                placeholder="Ej: 2505"
                                                disabled={!config.enableAccountingIntegration}
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* NOTIFICACIONES */}
                            <Accordion expanded={expanded === 'notificaciones'} onChange={handleAccordionChange('notificaciones')}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Email sx={{ mr: 2, color: 'secondary.main' }} />
                                    <Typography variant="h6">Notificaciones</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.sendReceiptsByEmail}
                                                        onChange={(e) => handleChange('sendReceiptsByEmail', e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Email fontSize="small" />
                                                        Enviar colillas de pago por Email
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.sendReceiptsByWhatsapp}
                                                        onChange={(e) => handleChange('sendReceiptsByWhatsapp', e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <WhatsApp fontSize="small" />
                                                        Enviar colillas por WhatsApp
                                                        <Chip label="Próximamente" size="small" color="warning" />
                                                    </Box>
                                                }
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    )
}
