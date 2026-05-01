"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Switch, Select, MenuItem, FormControl, 
  InputLabel, Slider, Card, CardContent, Grid, Avatar, Stack, 
  Button, Divider, Collapse, Alert, Checkbox, FormControlLabel,
  Tooltip, LinearProgress, Fade, useTheme, FormGroup
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AGENT_TYPES, TONES, LANGUAGES, ALL_TOOLS, TOOLS_BY_TYPE, DEFAULT_CHATBOT } from '../constants';

export default function ChatbotForm({ initialData = null, onSave }) {
  const theme = useTheme();
  const [formData, setFormData] = useState(initialData || DEFAULT_CHATBOT);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const selectedAgentType = AGENT_TYPES.find(t => t.value === formData.agent_type);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-fill tools if agent_type changes and no initialData (or if user wants)
      if (name === 'agent_type') {
        updated.enabled_tools = TOOLS_BY_TYPE[value] || [];
      }
      
      return updated;
    });
  };

  const handleToolToggle = (toolName) => {
    setFormData(prev => {
      const tools = [...prev.enabled_tools];
      if (tools.includes(toolName)) {
        return { ...prev, enabled_tools: tools.filter(t => t !== toolName) };
      } else {
        return { ...prev, enabled_tools: [...tools, toolName] };
      }
    });
  };

  const handleGroupToggle = (groupName, isChecked) => {
    const groupTools = ALL_TOOLS.filter(t => t.group === groupName).map(t => t.name);
    setFormData(prev => {
      let tools = [...prev.enabled_tools];
      if (isChecked) {
        // Add all in group
        tools = Array.from(new Set([...tools, ...groupTools]));
      } else {
        // Remove all in group
        tools = tools.filter(t => !groupTools.includes(t));
      }
      return { ...prev, enabled_tools: tools };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_CHATBOT);
  };

  // Groups of tools
  const groups = Array.from(new Set(ALL_TOOLS.map(t => t.group)));

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -8, left: 0, right: 0, borderRadius: 1 }} />}
      
      <Stack spacing={3}>
        {/* SECCIÓN 1 — Identidad */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={3}>Identidad del Agente</Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 80, height: 80, fontSize: '2rem',
                    bgcolor: selectedAgentType?.color || theme.palette.primary.main,
                    boxShadow: theme.shadows[2]
                  }}
                >
                  {formData.agent_name.charAt(0).toUpperCase()}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={10}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField 
                      label="Nombre del chatbot"
                      name="agent_name"
                      value={formData.agent_name}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ maxLength: 100 }}
                      required
                    />
                    <FormControlLabel
                      control={<Switch checked={formData.is_active === 1} onChange={handleChange} name="is_active" />}
                      label={formData.is_active === 1 ? "Activo" : "Inactivo"}
                    />
                  </Stack>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Agente</InputLabel>
                    <Select
                      name="agent_type"
                      value={formData.agent_type}
                      onChange={handleChange}
                      label="Tipo de Agente"
                    >
                      {AGENT_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: type.color, mr: 1.5 }} />
                            <Box>
                              <Typography variant="body1">{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Idioma</InputLabel>
                  <Select name="language" value={formData.language} onChange={handleChange} label="Idioma">
                    {LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tono de voz</InputLabel>
                  <Select name="tone" value={formData.tone} onChange={handleChange} label="Tono de voz">
                    {TONES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* SECCIÓN 2 — Comportamiento */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={3}>Comportamiento y Límites</Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" gutterBottom display="flex" justifyContent="space-between">
                  Temperatura 
                  <Chip label={formData.temperature.toFixed(1)} size="small" variant="outlined" color="primary" />
                </Typography>
                <Slider 
                  value={formData.temperature}
                  onChange={(e, v) => setFormData({...formData, temperature: v})}
                  min={0} max={1} step={0.1}
                  marks={[{value: 0, label: 'Preciso'}, {value: 0.5, label: 'Balanceado'}, {value: 1, label: 'Creativo'}]}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Tooltip title="Mensajes del historial que el agente recuerda">
                  <Typography variant="body2" gutterBottom>Historial (máx. mensajes)</Typography>
                </Tooltip>
                <Slider 
                  value={formData.max_history}
                  onChange={(e, v) => setFormData({...formData, max_history: v})}
                  min={5} max={30} step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Tooltip title="Máximo de herramientas encadenadas por turno">
                  <Typography variant="body2" gutterBottom>Loops de herramientas</Typography>
                </Tooltip>
                <Slider 
                  value={formData.max_tool_loops}
                  onChange={(e, v) => setFormData({...formData, max_tool_loops: v})}
                  min={1} max={10} step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* SECCIÓN 3 — Prompt */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1}>
              <Button 
                endIcon={<ExpandMoreIcon sx={{ transform: showPrompt ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
                onClick={() => setShowPrompt(!showPrompt)}
                sx={{ justifyContent: 'space-between', color: 'text.primary' }}
              >
                Personalización Avanzada del Prompt de Sistema
              </Button>
              <Collapse in={showPrompt}>
                <Box mt={2}>
                  <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
                    Reemplaza el template base del tipo seleccionado. Úsalo solo si sabes lo que haces.
                  </Alert>
                  <TextField 
                    name="system_prompt_override"
                    value={formData.system_prompt_override}
                    onChange={handleChange}
                    multiline rows={8}
                    fullWidth
                    placeholder="Escribe aquí el system prompt completo..."
                    sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.9rem' } }}
                  />
                </Box>
              </Collapse>
              
              <Divider sx={{ my: 1 }} />
              
              <Button 
                endIcon={<ExpandMoreIcon sx={{ transform: showExtra ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
                onClick={() => setShowExtra(!showExtra)}
                sx={{ justifyContent: 'space-between', color: 'text.primary' }}
              >
                Instrucciones Adicionales
              </Button>
              <Collapse in={showExtra}>
                <Box mt={2}>
                  <TextField 
                    name="extra_instructions"
                    value={formData.extra_instructions}
                    onChange={handleChange}
                    multiline rows={4}
                    fullWidth
                    helperText="Se añade al final del prompt base sin reemplazarlo."
                    placeholder="Ej: 'Siempre termina tus frases con una carita feliz'..."
                  />
                </Box>
              </Collapse>
            </Stack>
          </CardContent>
        </Card>

        {/* SECCIÓN 4 — Herramientas */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Herramientas Habilitadas</Typography>
              <Chip label={`${formData.enabled_tools.length} de ${ALL_TOOLS.length} activas`} variant="outlined" />
            </Box>
            
            <Grid container spacing={2}>
              {groups.map(group => {
                const groupTools = ALL_TOOLS.filter(t => t.group === group);
                const isAllSelected = groupTools.every(t => formData.enabled_tools.includes(t.name));
                const isSomeSelected = groupTools.some(t => formData.enabled_tools.includes(t.name)) && !isAllSelected;
                
                return (
                  <Grid item xs={12} md={6} key={group}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            indeterminate={isSomeSelected}
                            checked={isAllSelected}
                            onChange={(e) => handleGroupToggle(group, e.target.checked)}
                          />
                        }
                        label={<Typography variant="subtitle2">{group}</Typography>}
                      />
                      <Divider sx={{ my: 1 }} />
                      <FormGroup>
                        <Grid container>
                          {groupTools.map(tool => (
                            <Grid item xs={6} key={tool.name}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    size="small"
                                    checked={formData.enabled_tools.includes(tool.name)}
                                    onChange={() => handleToolToggle(tool.name)}
                                  />
                                }
                                label={<Typography variant="caption">{tool.label}</Typography>}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* BOTONES */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          {!initialData && (
            <Button startIcon={<RestartAltIcon />} onClick={resetForm}>
              Restablecer
            </Button>
          )}
          <Button 
            type="submit"
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {initialData ? 'Guardar cambios' : 'Crear chatbot'}
          </Button>
        </Stack>

        <Fade in={success}>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Chatbot guardado correctamente
          </Alert>
        </Fade>
      </Stack>
    </Box>
  );
}
