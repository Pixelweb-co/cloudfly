'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Type Imports
import type { DianOperationMode, DianResolution, DianCertificate, DianOperationModeRequest, DianResolutionRequest } from '@/types/dian'
import { DianDocumentType, DianEnvironment, CertificateType } from '@/types/dian'

// Component Imports
import DianOperationModeList from '@/components/dian/DianOperationModeList'
import DianOperationModeForm from '@/components/dian/DianOperationModeForm'
import DianResolutionsSection from '@/components/dian/DianResolutionsSection'
import DianCertificatesSection from '@/components/dian/DianCertificatesSection'

// Service Imports
import { dianOperationModeService } from '@/services/dian/operationModeService'
import { dianResolutionService } from '@/services/dian/resolutionService'
import { dianCertificateService } from '@/services/dian/certificateService'

const DianSettings = () => {
    // Session
    const { data: session } = useSession()

    // States
    const [activeTab, setActiveTab] = useState('modes')
    const [loading, setLoading] = useState(true)
    const [modes, setModes] = useState<DianOperationMode[]>([])
    const [resolutions, setResolutions] = useState<DianResolution[]>([])
    const [certificates, setCertificates] = useState<DianCertificate[]>([])
    const [openModeForm, setOpenModeForm] = useState(false)
    const [editingMode, setEditingMode] = useState<DianOperationMode | null>(null)

    // Tenant/Company context (Assuming mapping logic: TenantID = CustomerID)
    // In a real scenario, this should come from a context or session selector
    // For now, using session.user.id or a mapped value if available
    // The user instruction said: "Customer id es el tenant id"
    // We need to fetch data passing this tenantId
    // Usually the services handle this via axiosInterceptor using the token, 
    // but the controller expects headers or params.
    // We will assume the axios instance or service handles the header, 
    // or we pass it explicitly if needed. 
    // The services imported are likely configured to use the global axios instance.

    const fetchData = async () => {
        try {
            setLoading(true)
            const [modesData, resolutionsData, certificatesData] = await Promise.all([
                dianOperationModeService.getAll(),
                dianResolutionService.getAll(),
                dianCertificateService.getAll()
            ])

            setModes(modesData)
            setResolutions(resolutionsData)
            setCertificates(certificatesData)
        } catch (error) {
            console.error('Error fetching DIAN settings:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // --- Handlers for Operation Modes ---

    const handleSaveMode = async (data: DianOperationModeRequest) => {
        // Validation: Single active mode per Type + Environment
        if (data.active) {
            const exists = modes.some(m =>
                m.documentType === data.documentType &&
                m.environment === data.environment &&
                m.active &&
                m.id !== (editingMode?.id || -1)
            )

            if (exists) {
                alert(`Ya existe un modo de operación ACTIVO para ${data.documentType} en ${data.environment}. Desactívelo primero.`)
                return
            }
        }

        // Validation: Production Mode requires Active Certificate
        if (data.active && data.environment === DianEnvironment.PRODUCTION) {
            const hasActiveCert = certificates.some(c => c.active && c.isValid)
            if (!hasActiveCert) {
                alert('Para activar un modo en PRODUCCIÓN, debe tener al menos un Certificado Digital activo y válido cargado en la pestaña de Certificados.')
                return
            }
        }

        try {
            if (editingMode) {
                await dianOperationModeService.update(editingMode.id, data)
            } else {
                await dianOperationModeService.create(data)
            }
            await fetchData()
            setOpenModeForm(false)
            setEditingMode(null)
        } catch (error) {
            console.error('Error saving mode:', error)
        }
    }

    const handleDeleteMode = async (id: number) => {
        try {
            await dianOperationModeService.delete(id)
            await fetchData()
        } catch (error) {
            console.error('Error deleting mode:', error)
        }
    }

    // --- Handlers for Resolutions ---

    const handleCreateResolution = async (data: DianResolutionRequest) => {
        // Validation: Check for overlaps (simplified check for same Prefix + Type active)
        if (data.active) {
            const overlap = resolutions.some(r =>
                r.active &&
                r.prefix === data.prefix &&
                r.documentType === data.documentType
            )
            if (overlap) {
                if (!confirm('Ya existe una resolución activa con este prefijo. ¿Desea continuar?')) return
            }
        }

        try {
            await dianResolutionService.create(data)
            await fetchData()
        } catch (error) {
            console.error('Error create resolution', error)
        }
    }

    const handleUpdateResolution = async (id: number, data: DianResolutionRequest) => {
        try {
            await dianResolutionService.update(id, data)
            await fetchData()
        } catch (error) {
            console.error('Error update resolution', error)
        }
    }

    const handleDeleteResolution = async (id: number) => {
        try {
            await dianResolutionService.delete(id)
            await fetchData()
        } catch (error) {
            console.error('Error delete resolution', error)
        }
    }


    // --- Handlers for Certificates ---

    const handleUploadCertificate = async (file: File, alias: string, type: CertificateType, password: string) => {
        try {
            await dianCertificateService.upload(file, {
                alias,
                type,
                password,
                companyId: 1 // TODO: Get real company ID
            })
            await fetchData()
        } catch (error) {
            console.error('Error uploading cert', error)
            alert('Error al subir certificado')
        }
    }

    const handleActivateCertificate = async (id: number) => {
        try {
            await dianCertificateService.activate(id)
            await fetchData()
        } catch (error) {
            console.error('Error activating cert', error)
        }
    }

    const handleDeactivateCertificate = async (id: number) => {
        try {
            await dianCertificateService.deactivate(id)
            await fetchData()
        } catch (error) {
            console.error('Error deactivating cert', error)
        }
    }

    const handleDeleteCertificate = async (id: number) => {
        try {
            await dianCertificateService.delete(id)
            await fetchData()
        } catch (error) {
            console.error('Error deleting cert', error)
        }
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue)
    }

    return (
        <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabContext value={activeTab}>
                    <TabList onChange={handleTabChange} aria-label="dian settings tabs">
                        <Tab label="Modos de Operación" value="modes" />
                        <Tab label="Resoluciones" value="resolutions" />
                        <Tab label="Certificados Digitales" value="certificates" />
                    </TabList>

                    <TabPanel value="modes">
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Typography variant="body2" sx={{ mr: 2, alignSelf: 'center' }}>
                                Configure aquí los modos de operación (Software ID, PIN) para pruebas y producción.
                            </Typography>
                            <button
                                className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium css-1hw9j7s"
                                onClick={() => { setEditingMode(null); setOpenModeForm(true); }}
                                type="button"
                            >
                                Nuevo Modo
                            </button>
                        </Box>

                        {loading ? <CircularProgress /> : (
                            <DianOperationModeList
                                modes={modes}
                                onEdit={(mode) => { setEditingMode(mode); setOpenModeForm(true); }}
                                onDelete={handleDeleteMode}
                            />
                        )}
                    </TabPanel>

                    <TabPanel value="resolutions">
                        <DianResolutionsSection
                            resolutions={resolutions}
                            companyId={1} // TODO: Get real company ID
                            loading={loading}
                            onCreate={handleCreateResolution}
                            onUpdate={handleUpdateResolution}
                            onDelete={handleDeleteResolution}
                        />
                    </TabPanel>

                    <TabPanel value="certificates">
                        <DianCertificatesSection
                            certificates={certificates}
                            companyId={1}
                            loading={loading}
                            onUpload={handleUploadCertificate}
                            onActivate={handleActivateCertificate}
                            onDeactivate={handleDeactivateCertificate}
                            onDelete={handleDeleteCertificate}
                        />
                    </TabPanel>
                </TabContext>
            </Box>

            <DianOperationModeForm
                open={openModeForm}
                mode={editingMode}
                companyId={1}
                onClose={() => setOpenModeForm(false)}
                onSave={handleSaveMode}
            />
        </Card>
    )
}

export default DianSettings
