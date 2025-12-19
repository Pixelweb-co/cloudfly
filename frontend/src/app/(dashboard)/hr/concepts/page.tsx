'use client'

import { useState, useEffect } from 'react'
import { PayrollConcept } from '@/types/hr'
import { payrollConceptService } from '@/services/hr/payrollConceptService'
import ConceptFormDialog from '@/components/hr/ConceptFormDialog'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Tabs,
    Tab,
    Stack,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material'
import {
    Add,
    Edit,
    Delete,
    CheckCircle,
    Cancel,
    Refresh
} from '@mui/icons-material'

export default function ConceptsPage() {
    const [concepts, setConcepts] = useState<PayrollConcept[]>([])
    const [loading, setLoading] = useState(true)
    const [tabValue, setTabValue] = useState(0)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedConcept, setSelectedConcept] = useState<PayrollConcept | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [conceptToDelete, setConceptToDelete] = useState<PayrollConcept | null>(null)
    const customerId = 1

    useEffect(() => {
        loadConcepts()
    }, [tabValue])

    const loadConcepts = async () => {
        try {
            setLoading(true)
            const type = tabValue === 1 ? 'PERCEPCION' : tabValue === 2 ? 'DEDUCCION' : undefined
            const data = await payrollConceptService.getAll(customerId, type)
            setConcepts(data)
        } catch (error) {
            console.error('Error loading concepts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInitialize = async () => {
        try {
            setLoading(true)
            await payrollConceptService.initializeDefaults(customerId)
            await loadConcepts()
        } catch (error) {
            console.error('Error initializing concepts:', error)
        }
    }

    const handleNewConcept = () => {
        setSelectedConcept(null)
        setDialogOpen(true)
    }

    const handleEditConcept = (concept: PayrollConcept) => {
        setSelectedConcept(concept)
        setDialogOpen(true)
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        setSelectedConcept(null)
    }

    const handleDeleteClick = (concept: PayrollConcept) => {
        setConceptToDelete(concept)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (conceptToDelete) {
            try {
                await payrollConceptService.delete(conceptToDelete.id, customerId)
                loadConcepts()
            } catch (error) {
                console.error('Error deleting concept:', error)
            }
        }
        setDeleteDialogOpen(false)
        setConceptToDelete(null)
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setConceptToDelete(null)
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            📋 Conceptos de Nómina
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            {/* Solo mostrar Inicializar si no hay conceptos */}
                            {concepts.length === 0 && !loading && (
                                <Button variant="outlined" onClick={handleInitialize} startIcon={<Refresh />}>
                                    Inicializar Conceptos
                                </Button>
                            )}
                            <Button variant="contained" startIcon={<Add />} onClick={handleNewConcept}>
                                Nuevo Concepto
                            </Button>
                        </Stack>
                    </Box>

                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                        <Tab label="Todos" />
                        <Tab label="Percepciones" />
                        <Tab label="Deducciones" />
                    </Tabs>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : concepts.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>
                                No hay conceptos registrados
                            </Typography>
                            <Button variant="contained" onClick={handleInitialize} sx={{ mt: 2 }}>
                                Inicializar Conceptos por Defecto
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                        <TableCell><strong>Código</strong></TableCell>
                                        <TableCell><strong>Nombre</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell><strong>SAT</strong></TableCell>
                                        <TableCell><strong>Gravable</strong></TableCell>
                                        <TableCell><strong>IMSS</strong></TableCell>
                                        <TableCell><strong>Sistema</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {concepts.map((concept) => (
                                        <TableRow key={concept.id} hover>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{concept.code}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {concept.name}
                                                </Typography>
                                                {concept.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {concept.description}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={concept.conceptType === 'PERCEPCION' ? 'Percepción' : 'Deducción'}
                                                    color={concept.conceptType === 'PERCEPCION' ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{concept.satCode || '-'}</TableCell>
                                            <TableCell>
                                                {concept.isTaxable ? (
                                                    <CheckCircle color="success" fontSize="small" />
                                                ) : (
                                                    <Cancel color="disabled" fontSize="small" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {concept.isImssSubject ? (
                                                    <CheckCircle color="success" fontSize="small" />
                                                ) : (
                                                    <Cancel color="disabled" fontSize="small" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {concept.isSystemConcept && (
                                                    <Chip label="Sistema" size="small" variant="outlined" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={concept.isActive ? 'Activo' : 'Inactivo'}
                                                    color={concept.isActive ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0} justifyContent="center">
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleEditConcept(concept)}
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {!concept.isSystemConcept && (
                                                        <Tooltip title="Eliminar">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteClick(concept)}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Concept Form Dialog */}
            <ConceptFormDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                onSuccess={loadConcepts}
                concept={selectedConcept}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main' }}>
                    ⚠️ Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas eliminar el concepto{' '}
                        <strong>{conceptToDelete?.name}</strong> ({conceptToDelete?.code})?
                        <br /><br />
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
