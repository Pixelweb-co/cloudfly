'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Typography, Chip, Box, Avatar, Tooltip 
} from '@mui/material'
import { Icon } from '@iconify/react'
import { CampaignSendLog } from '@/types/marketing/campaignTypes'
import { contactService } from '@/services/marketing/contactService'
import { Contact } from '@/types/marketing/contactTypes'
import { format } from 'date-fns'

interface Props {
  campaignId: number
}

export default function CampaignLogsPanel({ campaignId }: Props) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch from logs service: /api/v1/marketing/campaigns/{id}/logs
    // Mocking some data for the UI structure
    const mockLogs = [
      { id: 1, contactName: 'Juan Perez', destination: '3001234567', status: 'DELIVERED', sentAt: new Date().toISOString() },
      { id: 2, contactName: 'Maria Garcia', destination: 'maria@example.com', status: 'READ', sentAt: new Date().toISOString() },
      { id: 3, contactName: 'Carlos Ruiz', destination: '3119876543', status: 'FAILED', errorMessage: 'Invalid number format' }
    ]
    setLogs(mockLogs)
    setLoading(false)
  }, [campaignId])

  const getStatusChip = (status: string) => {
    const colors: any = {
      PENDING: 'secondary',
      SENT: 'primary',
      DELIVERED: 'success',
      READ: 'info',
      FAILED: 'error',
      SKIPPED: 'warning'
    }
    return <Chip label={status} size='tiny' color={colors[status] || 'default'} variant='tonal' />
  }

  return (
    <Card>
      <CardHeader 
        title='Registro de Envíos (Logs)' 
        avatar={<Icon icon='tabler:history' fontSize='1.5rem' />}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Contacto</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha/Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{log.contactName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{log.destination}</Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(log.status)}</TableCell>
                  <TableCell>
                    {log.status === 'FAILED' ? (
                      <Tooltip title={log.errorMessage}>
                        <Typography variant='caption' color='error' sx={{ cursor: 'help' }}>Ver error</Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant='caption'>
                        {log.sentAt ? format(new Date(log.sentAt), 'HH:mm:ss') : '-'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

import { LinearProgress } from '@mui/material'
