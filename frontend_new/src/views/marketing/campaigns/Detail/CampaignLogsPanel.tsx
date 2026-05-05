'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Typography, Chip, Box, Avatar, Tooltip 
} from '@mui/material'
import { Icon } from '@iconify/react'
import { CampaignSendLog } from '@/types/marketing/campaignTypes'
import { contactService } from '@/services/marketing/contactService'
import { campaignService } from '@/services/marketing/campaignService'
import { Contact } from '@/types/marketing/contactTypes'
import { format } from 'date-fns'

interface Props {
  campaignId: number
}

export default function CampaignLogsPanel({ campaignId }: Props) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await campaignService.getLogs(campaignId)
        setLogs(data || [])
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
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
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{log.contactName || `Contacto #${log.contactId}`}</Typography>
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
