'use client'

import { useState, useEffect } from 'react'
import {
  Grid, Card, CardContent, CardHeader, Typography, Box, Button, Chip,
  IconButton, CircularProgress, Alert, LinearProgress, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Accordion, AccordionSummary, AccordionDetails, Stack, Divider
} from '@mui/material'
import {
  Database, Play, RefreshCw, ChevronDown, Key, Link2, Hash,
  Table2, Eye, FileSearch, CheckCircle2, AlertCircle, Clock
} from 'lucide-react'

interface TableDiscovery {
  name: string
  engine: string
  rows: number
  columns: number
  primaryKeys: string[]
  foreignKeys: number
  indexes: number
}

interface DiscoveryResult {
  tables: TableDiscovery[]
  views: number
  procedures: number
  totalColumns: number
  totalIndexes: number
  totalForeignKeys: number
  duration: number
  completedAt: string
}

const DiscoveryTab = () => {
  const [discovering, setDiscovering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  // Simulated discovery data
  const mockTables: TableDiscovery[] = [
    { name: 'customers', engine: 'InnoDB', rows: 1247, columns: 12, primaryKeys: ['id'], foreignKeys: 2, indexes: 4 },
    { name: 'companies', engine: 'InnoDB', rows: 89, columns: 15, primaryKeys: ['id'], foreignKeys: 1, indexes: 3 },
    { name: 'products', engine: 'InnoDB', rows: 3456, columns: 18, primaryKeys: ['id'], foreignKeys: 3, indexes: 6 },
    { name: 'services', engine: 'InnoDB', rows: 567, columns: 14, primaryKeys: ['id'], foreignKeys: 2, indexes: 4 },
    { name: 'campaigns', engine: 'InnoDB', rows: 234, columns: 16, primaryKeys: ['id'], foreignKeys: 4, indexes: 5 },
    { name: 'social_accounts', engine: 'InnoDB', rows: 123, columns: 11, primaryKeys: ['id'], foreignKeys: 2, indexes: 3 },
    { name: 'subscriptions', engine: 'InnoDB', rows: 89, columns: 10, primaryKeys: ['id'], foreignKeys: 2, indexes: 3 },
    { name: 'users', engine: 'InnoDB', rows: 456, columns: 13, primaryKeys: ['id'], foreignKeys: 2, indexes: 5 },
    { name: 'orders', engine: 'InnoDB', rows: 7890, columns: 15, primaryKeys: ['id'], foreignKeys: 3, indexes: 6 },
    { name: 'invoices', engine: 'InnoDB', rows: 5670, columns: 14, primaryKeys: ['id'], foreignKeys: 3, indexes: 5 },
    { name: 'contacts', engine: 'InnoDB', rows: 8901, columns: 16, primaryKeys: ['id'], foreignKeys: 4, indexes: 7 },
    { name: 'pipelines', engine: 'InnoDB', rows: 45, columns: 9, primaryKeys: ['id'], foreignKeys: 1, indexes: 2 },
    { name: 'pipeline_stages', engine: 'InnoDB', rows: 180, columns: 8, primaryKeys: ['id'], foreignKeys: 1, indexes: 3 },
    { name: 'channels', engine: 'InnoDB', rows: 67, columns: 12, primaryKeys: ['id'], foreignKeys: 2, indexes: 3 },
    { name: 'sending_lists', engine: 'InnoDB', rows: 34, columns: 8, primaryKeys: ['id'], foreignKeys: 1, indexes: 2 },
    { name: 'tags', engine: 'InnoDB', rows: 234, columns: 6, primaryKeys: ['id'], foreignKeys: 0, indexes: 2 },
    { name: 'analytics_events', engine: 'InnoDB', rows: 125000, columns: 11, primaryKeys: ['id'], foreignKeys: 3, indexes: 5 },
    { name: 'notifications', engine: 'InnoDB', rows: 45000, columns: 10, primaryKeys: ['id'], foreignKeys: 2, indexes: 4 },
  ]

  const handleDiscover = async () => {
    setDiscovering(true)
    setProgress(0)
    setError(null)

    // Simulate progressive discovery
    const steps = [
      { progress: 10, message: 'Conectando a MySQL...' },
      { progress: 25, message: 'Consultando INFORMATION_SCHEMA.TABLES...' },
      { progress: 40, message: 'Descubriendo columnas y tipos...' },
      { progress: 55, message: 'Analizando foreign keys...' },
      { progress: 70, message: 'Inspeccionando índices...' },
      { progress: 85, message: 'Descubriendo vistas y procedimientos...' },
      { progress: 95, message: 'Construyendo Knowledge Graph...' },
      { progress: 100, message: 'Descubrimiento completado' }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 400))
      setProgress(step.progress)
    }

    setResult({
      tables: mockTables,
      views: 3,
      procedures: 5,
      totalColumns: mockTables.reduce((sum, t) => sum + t.columns, 0),
      totalIndexes: mockTables.reduce((sum, t) => sum + t.indexes, 0),
      totalForeignKeys: mockTables.reduce((sum, t) => sum + t.foreignKeys, 0),
      duration: 3.2,
      completedAt: new Date().toISOString()
    })
    setDiscovering(false)
  }

  const totalRows = result?.tables.reduce((sum, t) => sum + t.rows, 0) || 0

  return (
    <Box>
      {/* Action Bar */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Database size={24} className='text-primary' />
            Schema Discovery Agent
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Inspecciona dinámicamente el esquema MySQL sin asumir nombres de tablas.
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={discovering ? <CircularProgress size={18} color='inherit' /> : <Play size={18} />}
          onClick={handleDiscover}
          disabled={discovering}
        >
          {discovering ? 'Descubriendo...' : 'Iniciar Descubrimiento'}
        </Button>
      </Box>

      {discovering && (
        <Box sx={{ mb: 4 }}>
          <LinearProgress variant='determinate' value={progress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            {progress}% completado
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {result && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {result.tables.length}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Tablas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, color: 'info.main' }}>
                    {result.totalColumns}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Columnas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, color: 'success.main' }}>
                    {result.totalForeignKeys}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Foreign Keys</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant='h3' sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {totalRows.toLocaleString()}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>Filas Totales</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Discovery Info */}
          <Paper sx={{ mb: 4, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction='row' spacing={3} alignItems='center' flexWrap='wrap'>
              <Chip icon={<Clock size={14} />} label={`${result.duration}s`} size='small' variant='tonal' />
              <Chip icon={<Eye size={14} />} label={`${result.views} vistas`} size='small' variant='tonal' color='info' />
              <Chip icon={<FileSearch size={14} />} label={`${result.procedures} procedimientos`} size='small' variant='tonal' color='secondary' />
              <Chip
                icon={<CheckCircle2 size={14} />}
                label='Completado'
                size='small'
                variant='tonal'
                color='success'
              />
            </Stack>
          </Paper>

          {/* Tables Detail */}
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
            Tablas Descubiertas
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tabla</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Motor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>Filas</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>Columnas</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='center'>PK</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='center'>FK</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='center'>Índices</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.tables.map((table) => (
                  <TableRow
                    key={table.name}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      borderLeft: table.foreignKeys > 0 ? '3px solid' : 'none',
                      borderLeftColor: 'success.main'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Table2 size={16} className='text-primary' />
                        <Typography sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {table.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={table.engine} size='small' variant='outlined' />
                    </TableCell>
                    <TableCell align='right'>
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        {table.rows.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Chip label={table.columns} size='small' variant='tonal' />
                    </TableCell>
                    <TableCell align='center'>
                      <Tooltip title={`PK: ${table.primaryKeys.join(', ')}`}>
                        <Chip
                          icon={<Key size={12} />}
                          label={table.primaryKeys.length}
                          size='small'
                          variant='tonal'
                          color='primary'
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        icon={<Link2 size={12} />}
                        label={table.foreignKeys}
                        size='small'
                        variant='tonal'
                        color={table.foreignKeys > 0 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        icon={<Hash size={12} />}
                        label={table.indexes}
                        size='small'
                        variant='tonal'
                        color='info'
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!result && !discovering && (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
          <Database size={48} className='text-muted-foreground' style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
            Sin datos de descubrimiento
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Ejecute el descubrimiento para inspeccionar el esquema de la base de datos.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default DiscoveryTab
