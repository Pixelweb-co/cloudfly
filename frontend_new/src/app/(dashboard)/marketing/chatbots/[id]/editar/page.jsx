"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Breadcrumbs, Link, CircularProgress, 
  Alert, Snackbar, Button, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions 
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter, useParams } from 'next/navigation';
import ChatbotForm from '../../components/ChatbotForm';
import { getChatbot, updateChatbot, deleteChatbot, invalidateCache } from '@/lib/api/chatbots';

const useSession = () => ({
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId')
});

export default function EditarChatbotPage() {
  const router = useRouter();
  const { id } = useParams();
  const { token, tenantId } = useSession();
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchData = async () => {
    const { data, error } = await getChatbot(token, tenantId);
    if (error) setError(error);
    else setChatbot(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data) => {
    const { error } = await updateChatbot(token, tenantId, id, data);
    if (!error) {
      await invalidateCache(token, tenantId);
      setShowSuccess(true);
    } else {
      throw new Error(error);
    }
  };

  const handleDelete = async () => {
    const { error } = await deleteChatbot(token, tenantId, id);
    if (!error) {
      await invalidateCache(token, tenantId);
      router.push('/marketing/chatbots');
    } else {
      setError(error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chatbot && !loading) {
    return <Alert severity="error">Chatbot no encontrado.</Alert>;
  }

  return (
    <Box p={3}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/dashboard">Dashboard</Link>
        <Link underline="hover" color="inherit" href="/marketing/chatbots">Marketing</Link>
        <Typography color="text.primary">Editar chatbot</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Editar chatbot</Typography>
        <Button 
          startIcon={<DeleteIcon />} 
          color="error" 
          onClick={() => setShowDeleteDialog(true)}
        >
          Eliminar chatbot
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ChatbotForm initialData={chatbot} onSave={handleSave} />

      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000} 
        onClose={() => setShowSuccess(false)}
        message="Cambios guardados correctamente"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>¿Eliminar chatbot?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción no se puede deshacer. El asistente virtual dejará de funcionar inmediatamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
