'use client'

/**
 * Página Principal: Configuración DIAN
 * Ruta: /settings/system/dian
 */

import React, { useState, useEffect } from 'react'
import {
    Box,
    Container,
    Card,
    CardHeader,
    CardContent,
    Divider,
    Button,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material'
import {
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Description as DescriptionIcon
} from '@mui/icons-material'
import DianOperationModeList from '@/components/dian/DianOperationModeList'
import DianOperationModeForm from '@/components/dian/DianOperationModeForm'
import DianCertificatesSection from '@/components/dian/DianCertificatesSection'
import DianResolutionsSection from '@/components/dian/DianResolutionsSection'
import { dianOperationModeService } from '@/services/dian/operationModeService'
import { dianCertificateService } from '@/services/dian/certificateService'
import { dianResolutionService } from '@/services/dian/resolutionService'
import type {
    DianOperationMode,
    DianOperationModeRequest,
    DianCertificate,
    DianResolution,
    DianResolutionRequest,
    CertificateType
} from '@/types/dian'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    )
}

export default function DianConfigPage() {
    // Estados
    const [currentTab, setCurrentTab] = useState(0)
    const [companyId] = useState(1) // TODO: Obtener del contexto/sesión

    // Operation Modes
    const [operationModes, setOperationModes] = useState<DianOperationMode[]>([])
    const [loadingModes, setLoadingModes] = useState(false)
    const [modeFormOpen, setModeFormOpen] = useState(false)
    const [editingMode, setEditingMode] = useState<DianOperationMode | null>(null)

    // Certificates
    const [certificates, setCertificates] = useState<DianCertificate[]>([])
    const [loadingCerts, setLoadingCerts] = useState(false)

    // Resolutions
    const [resolutions, setResolutions] = useState<DianResolution[]>([])
    const [loadingResolutions, setLoadingResolutions] = useState(false)

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        open: boolean
        message: string
        severity: 'success' | 'error' | 'info'
    }>({
        open: false,
        message: '',
        severity: 'info'
    })

    // ============================================================================
    // EFFECTS
    // ============================================================================

    useEffect(() => {
        loadOperationModes()
        loadCertificates()
        loadResolutions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ============================================================================
    // OPERATION MODES
    // ============================================================================

    const loadOperationModes = async () => {
        setLoadingModes(true)
        try {
            const data = await dianOperationModeService.getAll(companyId)
            setOperationModes(data)
        } catch (error) {
            console.error('Error cargando modos:', error)
            showSnackbar('Error cargando modos de operación', 'error')
        } finally {
            setLoadingModes(false)
        }
    }

    const handleCreateMode = async (data: DianOperationModeRequest) => {
        try {
            await dianOperationModeService.create(data)
            showSnackbar('Modo de operación creado exitosamente', 'success')
            loadOperationModes()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error creando modo', 'error')
            throw error
        }
    }

    const handleUpdateMode = async (data: DianOperationModeRequest) => {
        if (!editingMode) return
        try {
            await dianOperationModeService.update(editingMode.id, data)
            showSnackbar('Modo de operación actualizado exitosamente', 'success')
            loadOperationModes()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error actualizando modo', 'error')
            throw error
        }
    }

    const handleDeleteMode = async (id: number) => {
        try {
            await dianOperationModeService.delete(id)
            showSnackbar('Modo de operación eliminado', 'success')
            loadOperationModes()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error eliminando modo', 'error')
        }
    }

    const handleEditMode = (mode: DianOperationMode) => {
        setEditingMode(mode)
        setModeFormOpen(true)
    }

    const handleCloseForm = () => {
        setModeFormOpen(false)
        setEditingMode(null)
    }

    // ============================================================================
    // CERTIFICATES
    // ============================================================================

    const loadCertificates = async () => {
        setLoadingCerts(true)
        try {
            const data = await dianCertificateService.getAll(companyId)
            setCertificates(data)
        } catch (error) {
            console.error('Error cargando certificados:', error)
            showSnackbar('Error cargando certificados', 'error')
        } finally {
            setLoadingCerts(false)
        }
    }

    const handleUploadCertificate = async (
        file: File,
        alias: string,
        type: CertificateType,
        password: string
    ) => {
        try {
            await dianCertificateService.upload(file, {
                companyId,
                alias,
                type,
                password,
                active: true
            })
            showSnackbar('Certificado subido exitosamente', 'success')
            loadCertificates()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error subiendo certificado', 'error')
            throw error
        }
    }

    const handleActivateCertificate = async (id: number) => {
        try {
            await dianCertificateService.activate(id)
            showSnackbar('Certificado activado', 'success')
            loadCertificates()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error activando certificado', 'error')
        }
    }

    const handleDeactivateCertificate = async (id: number) => {
        try {
            await dianCertificateService.deactivate(id)
            showSnackbar('Certificado desactivado', 'success')
            loadCertificates()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error desactivando certificado', 'error')
        }
    }

    const handleDeleteCertificate = async (id: number) => {
        try {
            await dianCertificateService.delete(id)
            showSnackbar('Certificado eliminado', 'success')
            loadCertificates()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error eliminando certificado', 'error')
        }
    }

    // ============================================================================
    // RESOLUTIONS
    // ============================================================================

    const loadResolutions = async () => {
        setLoadingResolutions(true)
        try {
            const data = await dianResolutionService.getAll(companyId)
            setResolutions(data)
        } catch (error) {
            console.error('Error cargando resoluciones:', error)
            showSnackbar('Error cargando resoluciones', 'error')
        } finally {
            setLoadingResolutions(false)
        }
    }

    const handleCreateResolution = async (data: DianResolutionRequest) => {
        try {
            await dianResolutionService.create(data)
            showSnackbar('Resolución creada exitosamente', 'success')
            loadResolutions()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error creando resolución', 'error')
            throw error
        }
    }

    const handleUpdateResolution = async (id: number, data: DianResolutionRequest) => {
        try {
            await dianResolutionService.update(id, data)
            showSnackbar('Resolución actualizada exitosamente', 'success')
            loadResolutions()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error actualizando resolución', 'error')
            throw error
        }
    }

    const handleDeleteResolution = async (id: number) => {
        try {
            await dianResolutionService.delete(id)
            showSnackbar('Resolución eliminada', 'success')
            loadResolutions()
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || 'Error eliminando resolución', 'error')
        }
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity })
    }

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Card elevation={2}>
                <CardHeader
                    title="Configuración DIAN"
                    subheader="Configure el software propio DIAN, certificados digitales y resoluciones de facturación electrónica"
                    avatar={<SettingsIcon color="primary" sx={{ fontSize: 40 }} />}
                />

                <Divider />

                <CardContent>
                    <Tabs
                        value={currentTab}
                        onChange={(_, newValue) => setCurrentTab(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                        <Tab icon={<SettingsIcon />} label="Modos de Operación" />
                        <Tab icon={<SecurityIcon />} label="Certificados Digitales" />
                        <Tab icon={<DescriptionIcon />} label="Resoluciones" />
                    </Tabs>

                    {/* TAB 1: Modos de Operación */}
                    <TabPanel value={currentTab} index={0}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Los modos de operación definen cómo se conecta el ERP con la DIAN para cada tipo de documento.
                            Configure el Software ID, PIN y Test Set ID proporcionados por la DIAN.
                        </Alert>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setEditingMode(null)
                                    setModeFormOpen(true)
                                }}
                                disabled={loadingModes}
                            >
                                Agregar Modo
                            </Button>
                        </Box>

                        {loadingModes ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <DianOperationModeList
                                modes={operationModes}
                                onEdit={handleEditMode}
                                onDelete={handleDeleteMode}
                            />
                        )}
                    </TabPanel>

                    {/* TAB 2: Certificados */}
                    <TabPanel value={currentTab} index={1}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            El certificado digital es necesario para firmar los documentos electrónicos que se envían a la DIAN.
                            Solo puede haber un certificado activo a la vez por empresa.
                        </Alert>

                        <DianCertificatesSection
                            certificates={certificates}
                            companyId={companyId}
                            loading={loadingCerts}
                            onUpload={handleUploadCertificate}
                            onActivate={handleActivateCertificate}
                            onDeactivate={handleDeactivateCertificate}
                            onDelete={handleDeleteCertificate}
                        />
                    </TabPanel>

                    {/* TAB 3: Resoluciones */}
                    <TabPanel value={currentTab} index={2}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Las resoluciones de facturación definen los rangos de numeración autorizados por la DIAN.
                            Cada resolución tiene una vigencia y un rango de números consecutivos.
                        </Alert>

                        <DianResolutionsSection
                            resolutions={resolutions}
                            companyId={companyId}
                            loading={loadingResolutions}
                            onCreate={handleCreateResolution}
                            onUpdate={handleUpdateResolution}
                            onDelete={handleDeleteResolution}
                        />
                    </TabPanel>
                </CardContent>
            </Card>

            {/* Formulario de Modo de Operación */}
            <DianOperationModeForm
                open={modeFormOpen}
                mode={editingMode}
                companyId={companyId}
                onClose={handleCloseForm}
                onSave={editingMode ? handleUpdateMode : handleCreateMode}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    )
}
