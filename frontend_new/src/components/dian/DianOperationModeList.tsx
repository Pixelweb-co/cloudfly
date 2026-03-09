'use client'

/**
 * Componente: Tabla de Modos de Operación DIAN
 */

import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Tooltip,
    Typography,
    Box
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { DianOperationMode } from '@/types/dian'
import { DocumentTypeLabels, EnvironmentLabels } from '@/types/dian'

interface Props {
    modes: DianOperationMode[]
    onEdit: (mode: DianOperationMode) => void
    onDelete: (id: number) => void
}

export default function DianOperationModeList({ modes, onEdit, onDelete }: Props) {
    if (modes.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No hay modos de operación configurados
                </Typography>
            </Box>
        )
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Tipo Documento</strong></TableCell>
                        <TableCell><strong>Ambiente</strong></TableCell>
                        <TableCell><strong>Software ID</strong></TableCell>
                        <TableCell><strong>PIN</strong></TableCell>
                        <TableCell><strong>Test Set ID</strong></TableCell>
                        <TableCell align="center"><strong>Certificación</strong></TableCell>
                        <TableCell align="center"><strong>Estado</strong></TableCell>
                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {modes.map((mode) => (
                        <TableRow key={mode.id} hover>
                            <TableCell>{DocumentTypeLabels[mode.documentType]}</TableCell>
                            <TableCell>
                                <Chip
                                    label={EnvironmentLabels[mode.environment]}
                                    color={mode.environment === 'PRODUCTION' ? 'error' : 'info'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                    {mode.softwareId}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                    {'*'.repeat(mode.pin.length)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                    {mode.testSetId || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                {mode.certificationProcess ? (
                                    <Chip label="En proceso" color="warning" size="small" />
                                ) : (
                                    <Typography variant="body2">-</Typography>
                                )}
                            </TableCell>
                            <TableCell align="center">
                                <Chip
                                    label={mode.active ? 'Activo' : 'Inactivo'}
                                    color={mode.active ? 'success' : 'default'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell align="center">
                                <Tooltip title="Editar">
                                    <IconButton size="small" color="primary" onClick={() => onEdit(mode)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            if (window.confirm('¿Está seguro de eliminar este modo de operación?')) {
                                                onDelete(mode.id)
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
