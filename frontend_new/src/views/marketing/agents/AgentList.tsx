'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { agentService } from '@/services/marketing/agentService'
import { 
    Grid, Card, CardContent, Typography, Box, Button, Chip, 
    IconButton, CircularProgress, Alert, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, Divider 
} from '@mui/material'

const AgentManagementPage = () => {
    const { data: session } = useSession()
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Dialog state
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchTemplates = async (token: string) => {
        try {
            setLoading(true)
            const data = await agentService.getTemplates(token)
            setTemplates(data)
        } catch (err) {
            console.error(err)
            setError('Error al cargar las plantillas de agentes.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user?.accessToken) {
            fetchTemplates((session.user as any).accessToken as string)
        } else if (session === null) {
            setLoading(false)
        }
    }, [session])

    const handleEdit = (template: any) => {
        setSelectedTemplate(template)
        setOpenDialog(true)
    }

    const handleSave = async () => {
        if (!session?.user?.accessToken || !selectedTemplate) return
        try {
            setIsSaving(true)
            await agentService.createTemplate(selectedTemplate, (session.user as any).accessToken)
            setOpenDialog(false)
            fetchTemplates()
        } catch (err) {
            console.error(err)
            alert('Error al guardar la plantilla.')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress /></Box>

    return (
        <Box>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant='h4' sx={{ mb: 1, fontWeight: 600 }}>Gestión de Agentes Globales</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Configura las especialidades de IA disponibles para todas las empresas de la plataforma.
                    </Typography>
                </Box>
                <Button 
                    variant='contained' 
                    startIcon={<i className='tabler-plus' />}
                    onClick={() => { setSelectedTemplate({ name: '', code: '', basePrompt: '' }); setOpenDialog(true); }}
                >
                    Nueva Plantilla
                </Button>
            </Box>

            {error && <Alert severity='error' sx={{ mb: 6 }}>{error}</Alert>}

            <Grid container spacing={6}>
                {templates.map(template => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card sx={{ height: '100%', position: 'relative', border: 1, borderColor: 'divider' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex' }}>
                                        <i className='tabler-robot text-2xl' />
                                    </Box>
                                    <Chip label={template.code} size='small' variant='tonal' color='info' />
                                </Box>
                                <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>{template.name}</Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 4, minHeight: 60 }}>
                                    {template.basePrompt.substring(0, 100)}...
                                </Typography>
                                <Divider sx={{ mb: 4 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton size='small' onClick={() => handleEdit(template)}>
                                        <i className='tabler-edit text-xl' />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Template Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
                <DialogTitle>
                    {selectedTemplate?.id ? 'Editar Plantilla de Agente' : 'Nueva Plantilla de Agente'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label='Nombre del Agente' 
                                value={selectedTemplate?.name || ''} 
                                onChange={e => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                                placeholder='Ej: Ventas, Soporte'
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label='Código Identificador' 
                                value={selectedTemplate?.code || ''} 
                                onChange={e => setSelectedTemplate({...selectedTemplate, code: e.target.value.toUpperCase()})}
                                placeholder='Ej: VENTAS'
                                disabled={!!selectedTemplate?.id}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                multiline 
                                rows={6} 
                                label='Prompt Base (Especialidad)' 
                                value={selectedTemplate?.basePrompt || ''} 
                                onChange={e => setSelectedTemplate({...selectedTemplate, basePrompt: e.target.value})}
                                placeholder='Describe la especialidad y reglas base de este agente...'
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ pb: 4, px: 4 }}>
                    <Button variant='outlined' color='secondary' onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant='contained' onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default AgentManagementPage
