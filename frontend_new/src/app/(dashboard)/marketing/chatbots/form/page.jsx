'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import ChatbotForm from '../components/ChatbotForm';
import { getChatbot, createChatbot, updateChatbot } from '@/lib/api/chatbots';

export default function ChatbotFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(!!id);
  const [chatbot, setChatbot] = useState(null);
  const [error, setError] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : 1;

  useEffect(() => {
    if (id) {
      const fetchChatbotData = async () => {
        try {
          const { data, error: apiError } = await getChatbot(token, tenantId);
          if (apiError) throw new Error(apiError);
          setChatbot(data);
        } catch (err) {
          console.error('Error fetching chatbot:', err);
          setError('No se pudo cargar la configuración del chatbot.');
        } finally {
          setLoading(false);
        }
      };
      fetchChatbotData();
    }
  }, [id, token, tenantId]);

  const handleSave = async (formData) => {
    try {
      if (id) {
        const { error: apiError } = await updateChatbot(token, tenantId, id, formData);
        if (apiError) throw new Error(apiError);
      } else {
        const { error: apiError } = await createChatbot(token, tenantId, formData);
        if (apiError) throw new Error(apiError);
      }
      router.push('/marketing/chatbots/list');
    } catch (err) {
      console.error('Error saving chatbot:', err);
      setError('Error al guardar la configuración.');
      throw err;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {id ? 'Editar Chatbot' : 'Configurar Nuevo Chatbot'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personaliza la identidad, el comportamiento y las herramientas de tu asistente virtual.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ChatbotForm 
        initialData={chatbot} 
        onSave={handleSave}
      />
    </Container>
  );
}
