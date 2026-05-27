import { useState, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Cropper from 'react-easy-crop'
import { axiosInstance } from '@/utils/axiosInstance'

type Point = { x: number; y: number }
type Area = { width: number; height: number; x: number; y: number }

interface AvatarUploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (avatarId: number, url: string) => void
}

const AvatarUploadDialog = ({ open, onClose, onUpload }: AvatarUploadDialogProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => setImageSrc(reader.result as string))
      reader.readAsDataURL(file)
    }
  }

  const createCroppedImage = async (imageSrc: string, crop: Area): Promise<Blob> => {
    const image = new Image()
    image.src = imageSrc
    await new Promise(resolve => (image.onload = resolve))

    const canvas = document.createElement('canvas')
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')

    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
      }, 'image/jpeg')
    })
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      setUploading(true)
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels)
      
      const formData = new FormData()
      formData.append('files', croppedBlob, 'avatar.jpg')
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '1' : '1'
      formData.append('tenantId', tenantId)

      const response = await axiosInstance.post('/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const data = response.data as Array<{ id: number; url: string }>
      if (data && data.length > 0) {
        onUpload(data[0].id, data[0].url)
        handleClose()
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setImageSrc(null)
    setZoom(1)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Subir Foto de Perfil</DialogTitle>
      <DialogContent>
        {!imageSrc ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
            <Typography variant="body1" className="mb-4">Selecciona o toma una foto</Typography>
            <Button variant="contained" component="label">
              Elegir Archivo
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </Button>
          </div>
        ) : (
          <div className="relative h-64 w-full bg-gray-100">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
        )}
        {imageSrc && (
          <div className="mt-4">
            <Typography variant="overline">Zoom</Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e, zoom) => setZoom(Number(zoom))}
            />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!imageSrc || uploading} variant="contained">
          {uploading ? 'Subiendo...' : 'Guardar y Recortar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AvatarUploadDialog
