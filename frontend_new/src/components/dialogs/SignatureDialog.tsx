import React, { useRef, useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
} from "@mui/material";

import SignatureCanvas from "react-signature-canvas";

import axios from "axios";

const SignatureDialog = ({ open, onClose, solicitud_id,onSave }:{open:boolean,onClose:any,solicitud_id:any,onSave:any}) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Limpiar firma del canvas
  const clearSignature = () => {
    if (signatureRef.current) signatureRef.current.clear();
    setError("");
  };

  // Manejar el cambio de pestañas
  const handleTabChange = (event:any, newValue:any) => {
    setActiveTab(newValue);
    setError("");
    setPreviewImage(null);
  };

  // Subir archivo seleccionado
  const handleFileUpload = (event:any) => {
    const file = event.target.files[0];

    if (file) setPreviewImage(URL.createObjectURL(file));

  };

  // Enviar archivo al endpoint
  const sendFileToEndpoint = async (file:any) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("solicitud_id", JSON.stringify({id_solicitud:solicitud_id}));




      try {
        const token = localStorage.getItem('AuthToken')

        console.log('token ', token)

        if (!token) {
          throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
        }

        // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

        const method = 'post' // Actualización o Creación
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/firma-solicitud`

        const response = await axios({
          method: method, // Usa 'put' para actualización o 'post' para creación
          url: apiUrl,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })

        // Procesar la respuesta
        if (response.data) {
          console.log('firma guardado con éxito:', response.data)


          setTimeout(()=>onSave(),500)
          onClose()

          // Aquí puedes redirigir o mostrar un mensaje de éxito
        } else {
          console.error('Error en la respuesta:', response.data.message)
        }




      } catch (error) {
        console.error('Error al enviar los datos:', error)
      }


    };

  // Guardar firma desde el canvas
  const handleSaveCanvas = () => {

    if (signatureRef.current?.isEmpty()) {

      setError("Por favor, firme antes de guardar.");

      return;
    }

    const fileName = `sign-${Math.floor(Date.now() / 1000)}.png`;

    signatureRef.current?.getCanvas().toBlob((blob:any) => {

      if (blob) {
        const file = new File([blob], fileName, { type: "image/png" });

        sendFileToEndpoint(file);

      }
    });
  };

  // Guardar archivo cargado
  const handleSaveUploadedFile = () => {

    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setError("Por favor, cargue un archivo.");

      return;
    }

    sendFileToEndpoint(file);
  };

  // Efecto para manejar la cámara al abrir o cerrar el diálogo
  useEffect(() => {
    if (!open) {
      setError("");
      setPreviewImage(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Subir Firma o Imagen</DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Firma Canvas" />
          <Tab label="Cargar Imagen" />
        </Tabs>
        <Box mt={2}>
          {activeTab === 0 && (
            <div>
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  width: 192,
                  height: 64,
                  className: "signature-canvas",
                  style: { border: "1px solid #ddd", margin: "auto" },
                }}
              />
              <Button onClick={clearSignature}>Limpiar</Button>
              <Button onClick={handleSaveCanvas} disabled={signatureRef.current?.isEmpty()}>
                Agregar Firma
              </Button>
            </div>
          )}
          {activeTab === 1 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
              {previewImage && <img src={previewImage} alt="Previsualización" style={{ maxWidth: "100%", marginTop: 10 }} />}
              <Button onClick={handleSaveUploadedFile} disabled={!previewImage}>
                Agregar Imagen
              </Button>
            </div>
          )}
          {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureDialog;
