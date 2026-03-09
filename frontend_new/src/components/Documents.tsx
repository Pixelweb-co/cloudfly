import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Grid,
  TextField,
  Typography,
} from '@mui/material';

import axios from 'axios';
import dotenv from "dotenv";

import ConfirmationDialog from './dialogs/ConfirmationDialog';
import { userMethods } from '@/utils/userMethods';

interface DocumentsProps {
  product_id: any;
}

const Documents: React.FC<DocumentsProps> = ({ product_id }) => {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState<string>('');
  const [isReport, setIsReport] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reportDocuments, setReportDocuments] = useState<any[]>([]);
  const [normalDocuments, setNormalDocuments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [canMarkAsReport, setCanMarkAsReport] = useState(false);

  const router = useRouter();

  // Función para separar documentos en reportes y no reportes
  const separateDocuments = (docs: any[]) => {
    if (!Array.isArray(docs)) {
      console.error('separateDocuments recibió datos inválidos:', docs);
      return;
    }
    console.log('Separando documentos:', docs);
    
    const reports = docs.filter(doc => {
      console.log('Documento siendo evaluado:', doc, 'report value:', doc.report);
      return doc.report === true;
    });
    const normal = docs.filter(doc => doc.report === false);
    
    console.log('Reportes encontrados:', reports.length, 'documentos');
    console.log('Documentos normales:', normal.length, 'documentos');
    
    setReportDocuments(reports);
    setNormalDocuments(normal);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };




  useEffect(() => {
    const fetchOptions = async () => {
      console.log('fetchOptions')

      try {
        const token = localStorage.getItem('AuthToken')

        if (!token) {
          throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
        }

        const [documentsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/document/list/${product_id}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          })
        ])

        console.log('Documentos recibidos del backend:', documentsRes.data);
        
        setDocuments(documentsRes.data);
        separateDocuments(documentsRes.data);

        return true
      } catch (error) {
        console.error('Error al obtener datos:', error)
      }
    }

    fetchOptions()

  }, [])

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor, selecciona un archivo.');
      return;
    }

    const formData = new FormData();
    
    console.log('Preparando datos para enviar:', {
      file: file.name,
      tag,
      isReport,
      product_id
    });

    formData.append('file', file);
    formData.append('tag', tag);
    formData.append('report', isReport.toString());
    formData.append('product_id', String(product_id));
    
    // Debug para ver qué se está enviando
    console.log('Enviando al backend:', {
      file: file,
      tag: tag,
      report: isReport,
      product_id: product_id
    });

    try {

      const token = localStorage.getItem('AuthToken')

      console.log('token ', token)

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const method = 'post'; // Crear documento
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/document`; // Ruta de la API

      const response = await axios({
        method: method,
        url: apiUrl,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Respuesta del backend:', response.data);
      console.log('Valor de report enviado:', formData.get('report'));

      alert('Archivo cargado exitosamente');

      setDocuments(response.data);
      separateDocuments(response.data);

      // Resetear el estado después de la carga
      setFile(null);
      setTag('');
      setIsReport(false);
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      alert('Hubo un error al cargar el archivo.');
    }
  };

  const handleDeleteConfirm = async(document_name:string) => {

    console.log('Eliminar documento tr',document_name)
    setName(document_name)
    setOpen(true)

  }

  const handleDelete = async (document_name:string) => {

    // eslint-disable-next-line no-console
    console.info('api.',document_name)

    if(document_name ){

      try {

      const token = localStorage.getItem('AuthToken');

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.');
      }

      // Llamada a la API para eliminar el documento
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/document/${name}`;

      await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Eliminar el documento del estado local después de la confirmación
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.name !== name)
      );
      setOpen(false)

    } catch (error) {
      console.error('Error al eliminar el documento:', error);

    }

  }
  }

  return (
    <>
      {/* Card para subir documentos */}
      <Card>
        <CardHeader title="Agregar Documentos" />
        <CardContent>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            {/* Input para cargar archivos */}
            <input
              type="file"
              onChange={handleFileChange}
              className="btn"
              style={{ marginRight: '16px' }}
            />

            {/* Campo de etiqueta */}
            <TextField
              placeholder="Etiqueta"
              size="small"
              sx={{ flexGrow: 1, mr: 2 }}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />

            {/* Checkbox para reporte */}
            <Checkbox
              checked={isReport}
              onChange={(e) => setIsReport(e.target.checked)}
            />
            <Typography variant="body2" sx={{ mr: 2 }}>
              Reporte
            </Typography>

            {/* Botón para cargar */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!file || !tag}
            >
              Cargar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Card para reportes */}
      <Card sx={{ mb: 4, mt:4 }}>
        <CardHeader title="Documentos de Reporte" />
        <CardContent>
          <Grid container spacing={2}>
            {reportDocuments.map((document) => (
              <Grid item xs={3} key={document.id}>
                
                <Chip
                  label={document.tag}
                  color='success'
                  variant='tonal'
                  onClick={() => {
                    window.open(`${process.env.NEXT_PUBLIC_API_URL}/document/${document.name}`, '_blank');
                  }}
                  onDelete={() => (userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL') || userMethods.isRole('ADMIN')) ? handleDeleteConfirm(document.name) : null }
                  deleteIcon={<i className='tabler-trash-x' />}
                  title={document.name}
                />
              </Grid>
            ))}
            {reportDocuments.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  No hay reportes disponibles
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Card para documentos normales */}
      <Card>
        <CardHeader title="Documentos" />
        <CardContent>
          <Grid container spacing={2}>
            {normalDocuments.map((document) => (
              <Grid item xs={3} key={document.id}>
                <Chip
                  label={document.tag}
                  color='primary'
                  variant='tonal'
                  onClick={() => {
                    window.open(`${process.env.NEXT_PUBLIC_API_URL}/document/${document.name}`, '_blank');
                  }}
                  onDelete={() => handleDeleteConfirm(document.name)}
                  deleteIcon={<i className='tabler-trash-x' />}
                  title={document.name}
                />
              </Grid>
            ))}
            {normalDocuments.length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  No hay documentos disponibles
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <ConfirmationDialog
        entitYName='Documento'
        open={open}
        setOpen={setOpen}
        name={name}
        onConfirmation={(dv:string) => {
          console.log('Documento eliminado desde c',dv)
          handleDelete(dv)
          setOpen(false)
        }}
      />
    </>
  );
};

export default Documents;
