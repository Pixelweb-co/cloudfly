"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Breadcrumbs, Link, CircularProgress, Alert } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/navigation';
import ChatbotForm from '../components/ChatbotForm';
import { createChatbot, getChatbot, invalidateCache } from '@/lib/api/chatbots';

const useSession = () => ({
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId')
});

export default function NuevoChatbotPage() {
  const router = useRouter();
  const { token, tenantId } = useSession();
  const [checking, setChecking] = useState(true);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    const checkExisting = async () => {
      const { data } = await getChatbot(token, tenantId);
      if (data) {
        setExistingId(data.id);
      }
      setChecking(false);
    };
    checkExisting();
  }, []);

  const handleSave = async (data) => {
    const { error } = await createChatbot(token, tenantId, data);
    if (!error) {
      await invalidateCache(token, tenantId);
      router.push('/marketing/chatbots');
    } else {
      throw new Error(error);
    }
  };

  if (checking) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (existingId) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Ya tienes un chatbot configurado. Serás redirigido a la página de edición...
        </Alert>
        {setTimeout(() => router.push(`/marketing/chatbots/${existingId}/editar`), 2000) && null}
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/dashboard">Dashboard</Link>
        <Link underline="hover" color="inherit" href="/marketing/chatbots">Marketing</Link>
        <Typography color="text.primary">Nuevo chatbot</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight="bold" mb={4}>Nuevo chatbot</Typography>

      <ChatbotForm onSave={handleSave} />
    </Box>
  );
}
