'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import ChatbotForm from '../components/ChatbotForm';
import { chatbotApi } from '@/lib/api/chatbots';

export default function ChatbotFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(!!id);
  const [chatbot, setChatbot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchChatbot = async () => {
        try {
          const tenantId = 1; // En una app real, esto vendría del auth context
          const data = await chatbotApi.getChatbot(tenantId);
          setChatbot(data);
        } catch (err) {
          console.error('Error fetching chatbot:', err);
          setError('No se pudo cargar la configuración del chatbot.');
        } finally {
          setLoading(false);
        }
      };
      fetchChatbot();
    }
  }, [id]);

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
        isEdit={!!id} 
        onSuccess={() => router.push('/marketing/chatbots/list')}
      />
    </Container>
  );
}
