"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Avatar, Chip, 
  IconButton, Skeleton, Stack, Alert, Divider, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getChatbot, updateChatbot, invalidateCache } from '@/lib/api/chatbots';
import { AGENT_TYPES } from '../constants';

export default function ChatbotsPage() {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();
  
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session?.user as any)?.customerId || 1;
  
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChatbot = async () => {
    setLoading(true);
    const { data, error } = await getChatbot(token, tenantId);
    if (error) setError(error);
    else setChatbot(data);
    setLoading(false);
  };

  useEffect(() => {
    if (token && tenantId) {
      fetchChatbot();
    }
  }, [token, tenantId]);

  const handleToggleActive = async () => {
    if (!chatbot) return;
    const newStatus = chatbot.is_active === 1 ? 0 : 1;
    
    // Update UI optimistically
    setChatbot({ ...chatbot, is_active: newStatus });
    
    const { error } = await updateChatbot(token, tenantId, chatbot.id, { is_active: newStatus });
    if (error) {
      setError("Error al cambiar el estado del chatbot");
      setChatbot(chatbot); // Rollback
    } else {
      await invalidateCache(token, tenantId);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Chatbots</Typography>
          <Typography variant="body2" color="text.secondary">
            Configura el asistente virtual de tu empresa
          </Typography>
        </Box>
        {!chatbot && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/marketing/chatbots/form')}
            sx={{ borderRadius: 2 }}
          >
            Nuevo chatbot
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!chatbot ? (
        <Card sx={{ textAlign: 'center', p: 8, borderRadius: 4, border: '2px dashed #ddd', bgcolor: 'transparent' }}>
          <SmartToyIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aún no tienes un chatbot configurado
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2, borderRadius: 2 }}
            onClick={() => router.push('/marketing/chatbots/form')}
          >
            Configurar ahora
          </Button>
        </Card>
      ) : (
        <Card sx={{ maxWidth: 500, borderRadius: 3, boxShadow: theme.shadows[4] }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Avatar 
                sx={{ 
                  bgcolor: AGENT_TYPES.find(t => t.value === chatbot.agent_type)?.color || theme.palette.primary.main,
                  width: 56, height: 56, fontSize: '1.5rem'
                }}
              >
                {chatbot.agent_name.charAt(0).toUpperCase()}
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="h6">{chatbot.agent_name}</Typography>
                <Stack direction="row" spacing={1} mt={0.5}>
                  <Chip 
                    label={chatbot.is_active === 1 ? "Activo" : "Inactivo"} 
                    size="small" 
                    color={chatbot.is_active === 1 ? "success" : "default"} 
                  />
                  <Chip 
                    label={AGENT_TYPES.find(t => t.value === chatbot.agent_type)?.label || chatbot.agent_type} 
                    size="small" 
                    variant="outlined"
                    sx={{ borderColor: AGENT_TYPES.find(t => t.value === chatbot.agent_type)?.color }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              {chatbot.language.toUpperCase()} | {chatbot.tone.charAt(0).toUpperCase() + chatbot.tone.slice(1)} | Temperatura: {chatbot.temperature.toFixed(1)}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Herramientas activas:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {chatbot.enabled_tools.slice(0, 4).map(tool => (
                <Chip key={tool} label={tool} size="small" variant="outlined" />
              ))}
              {chatbot.enabled_tools.length > 4 && (
                <Chip label={`+${chatbot.enabled_tools.length - 4} más`} size="small" />
              )}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={3}>
              <IconButton 
                onClick={() => router.push(`/marketing/chatbots/form?id=${chatbot.id}`)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                onClick={handleToggleActive}
                color={chatbot.is_active === 1 ? "success" : "default"}
              >
                <PowerSettingsNewIcon />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
