// React Imports
import { useState } from 'react'

// MUI Imports
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Axios (ajusta si usas otro)
import axiosInstance from '@/utils/axiosInterceptor'

type FileProp = File & {
  name: string
  type: string
  size: number
}

type UploaderProps = {
  tenantId: number | string
  onUploaded?: (ids: number[]) => void // callback con los ids creados
}

const Uploader = ({ tenantId, onUploaded }: UploaderProps) => {
  // States
  const [files, setFiles] = useState<FileProp[]>([])
  const [uploading, setUploading] = useState(false)

  // Hooks
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      setFiles(acceptedFiles.map(file => Object.assign(file)))
    }
  })

  const renderFilePreview = (file: FileProp) => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file)} />
    } else {
      return <i className='tabler-file-description' />
    }
  }

  const handleRemoveFile = (file: FileProp) => {
    const filtered = files.filter(i => i.name !== file.name)
    setFiles(filtered)
  }

  const fileList = files.map(file => (
    <ListItem key={file.name} sx={{ width: '100%' }}>
      <div className='file-details flex'>
        <div className='file-preview mr-2'>{renderFilePreview(file)}</div>
        <div>
          <Typography className='file-name'>{file.name}</Typography>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file)}>
        <i className='tabler-x text-xl' />
      </IconButton>
    </ListItem>
  ))

  const handleRemoveAllFiles = () => {
    setFiles([])
  }

  const handleUpload = async () => {
    if (!files.length) return
    if (!tenantId) {
      console.error('tenantId es obligatorio para subir archivos')
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()

      files.forEach(file => {
        formData.append('files', file) // nombre igual que en @RequestParam("files")
      })

      formData.append('tenantId', String(tenantId))

      const response = await axiosInstance.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // backend devuelve List<MediaResponseDTO>
      const data = response.data as Array<{ id: number }>

      const ids = data.map(item => item.id)

      console.log('Ids creados en media:', ids)

      if (onUploaded) {
        onUploaded(ids)
      }

      // si quieres limpiar la lista después de subir:
      setFiles([])
    } catch (error) {
      console.error('Error al subir archivos:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <div className='flex items-center flex-col'>
          <Avatar variant='rounded' className='bs-12 is-12 mbe-9'>
            <i className='tabler-upload' />
          </Avatar>
          <Typography variant='h4' className='mbe-2.5'>
            Arrastre sus archivos aqui o haga click para subir
          </Typography>
          <Typography>
            Arrastre sus archivos aqui o haga click para{' '}
            <a href='/' onClick={e => e.preventDefault()} className='text-textPrimary no-underline'>
              Buscar
            </a>{' '}
            manualmente
          </Typography>
        </div>
      </div>
      {files.length ? (
        <>
          <List>{fileList}</List>
          <div className='buttons'>
            <Button color='error' variant='outlined' onClick={handleRemoveAllFiles} disabled={uploading}>
              Remover todos los archivos
            </Button>
            <Button
              variant='contained'
              sx={{ marginLeft: 2 }}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </div>
        </>
      ) : null}
    </>
  )
}

export default Uploader
