'use client'
import React, { useEffect, useState, SyntheticEvent } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  InputLabel,
  Select,
  FormControl,
  Typography,
  Divider,
  Tab,
  Tabs,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Chip
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import dotenv from "dotenv";

import type { CustomersType, DaneCode } from '@/types/customers'
import { daneService } from '@/services/daneService'

// Opciones de tipo de negocio
const BUSINESS_TYPE_OPTIONS = [
  { value: 'VENTAS', label: '🛒 Ventas', description: 'Venta de productos físicos o digitales' },
  { value: 'AGENDAMIENTO', label: '📅 Agendamiento', description: 'Servicios con citas o reservas' },
  { value: 'SUSCRIPCION', label: '🔄 Suscripción', description: 'Modelo de suscripción recurrente' },
  { value: 'MIXTO', label: '🎯 Mixto', description: 'Combinación de varios tipos' }
]

// Opciones DIAN
const TIPO_DOCUMENTO_DIAN_OPTIONS = [
  { value: '13', label: 'Cédula de ciudadanía' },
  { value: '31', label: 'NIT' },
  { value: '22', label: 'Cédula dejería' },
  { value: '41', label: 'Pasaporte' },
  { value: '42', label: 'Documento de identificación extranjero' },
  { value: '50', label: 'NIT de otro país' },
  { value: '91', label: 'NUIP' }
]

const REGIMEN_FISCAL_OPTIONS = [
  { value: '48', label: 'Responsable del impuesto sobre las ventas - IVA' },
  { value: '49', label: 'No responsable de IVA' },
  { value: '04', label: 'Régimen Simple de Tributación' },
  { value: '05', label: 'Régimen Ordinario' }
]

const RESPONSABILIDADES_FISCALES_OPTIONS = [
  { value: 'R-99-PN', label: 'R-99-PN (No responsable)' },
  { value: 'O-13', label: 'O-13 (Gran contribuyente)' },
  { value: 'O-15', label: 'O-15 (Autorretenedor)' },
  { value: 'O-23', label: 'O-23 (Agente de retención IVA)' },
  { value: 'O-47', label: 'O-47 (Régimen Simple)' }
]

// Esquema de validación
const schema = yup.object().shape({
  // --- BÁSICOS ---
  name: yup.string().required('El nombre es obligatorio'),
  nit: yup.string().required('El NIT es obligatorio'),
  phone: yup.string().required('El teléfono es obligatorio'),
  email: yup.string().email('Email inválido').required('Email es obligatorio'),
  address: yup.string().required('Dirección es obligatoria'),
  contact: yup.string().required('El contacto es obligatorio'),
  position: yup.string().required('El cargo es obligatorio'),
  type: yup.string().required('El tipo es obligatorio'),
  status: yup.string().required('El estado es obligatorio'),
  businessType: yup.string().optional(),
  businessDescription: yup.string().optional(),

  // Contrato
  fechaInicio: yup.string().required('La fecha inicial es obligatoria'),
  fechaFinal: yup.string().required('La fecha final es obligatoria'),
  descripcionContrato: yup.string().optional(),

  // --- DIAN ---
  esEmisorFE: yup.boolean().optional(),
  esEmisorPrincipal: yup.boolean().optional(),

  tipoDocumentoDian: yup.string().when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Tipo doc DIAN es requerido para emisores'),
    otherwise: (schema) => schema.optional()
  }),
  digitoVerificacion: yup.string().when(['esEmisorFE', 'tipoDocumentoDian'], {
    is: (esEmisor: boolean, tipo: string) => esEmisor && tipo === '31',
    then: (schema) => schema.required('DV requerido para NIT'),
    otherwise: (schema) => schema.optional()
  }),
  razonSocial: yup.string().when(['esEmisorFE', 'tipoDocumentoDian'], {
    is: (esEmisor: boolean, tipo: string) => esEmisor && tipo === '31',
    then: (schema) => schema.required('Razón social requerida para NIT'),
    otherwise: (schema) => schema.optional()
  }),
  nombreComercial: yup.string().optional(),

  regimenFiscal: yup.string().when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Régimen fiscal requerido'),
    otherwise: (schema) => schema.optional()
  }),
  responsabilidadesFiscales: yup.string().when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Resp. fiscales requeridas'),
    otherwise: (schema) => schema.optional()
  }),

  codigoDaneDepartamento: yup.string().when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Departamento requerido'),
    otherwise: (schema) => schema.optional()
  }),
  codigoDaneCiudad: yup.string().when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Ciudad requerida'),
    otherwise: (schema) => schema.optional()
  }),

  emailFacturacionDian: yup.string().email('Email inválido').when('esEmisorFE', {
    is: true,
    then: (schema) => schema.required('Email facturación requerido'),
    otherwise: (schema) => schema.optional()
  })
})

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ClienteForm = ({
  open,
  onClose,
  setOpen,
  rowSelect
}: {
  open: boolean
  onClose: () => void
  setOpen: () => void
  rowSelect: CustomersType
}) => {
  const [id, setId] = useState<any>(null)
  const [tabValue, setTabValue] = useState(0)

  // State para DANE
  const [departamentos, setDepartamentos] = useState<DaneCode[]>([])
  const [ciudades, setCiudades] = useState<DaneCode[]>([])
  const [loadingDane, setLoadingDane] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      nit: '',
      phone: '',
      email: '',
      address: '',
      contact: '',
      position: '',
      type: '',
      businessType: '',
      businessDescription: '',
      fechaInicio: '',
      fechaFinal: '',
      descripcionContrato: '',
      status: '1',
      // DIAN
      esEmisorFE: false,
      esEmisorPrincipal: false,
      tipoDocumentoDian: '',
      digitoVerificacion: '',
      razonSocial: '',
      nombreComercial: '',
      responsabilidadesFiscales: '',
      regimenFiscal: '',
      codigoDaneDepartamento: '',
      codigoDaneCiudad: '',
      emailFacturacionDian: '',
      sitioWeb: ''
    }
  })

  // Watchers
  const watchDepartamento = watch('codigoDaneDepartamento')
  const watchEsEmisorFE = watch('esEmisorFE')
  const watchNit = watch('nit')

  // Cargar departamentos al inicio
  useEffect(() => {
    const loadDepartamentos = async () => {
      try {
        const data = await daneService.getDepartamentos()
        setDepartamentos(data)
      } catch (error) {
        console.error('Error cargando departamentos:', error)
      }
    }
    loadDepartamentos()
  }, [])

  // Cargar ciudades cuando cambia departamento
  useEffect(() => {
    const loadCiudades = async () => {
      if (!watchDepartamento) {
        setCiudades([])
        return
      }
      setLoadingDane(true)
      try {
        const data = await daneService.getCiudadesByDepartamento(watchDepartamento)
        setCiudades(data)
      } catch (error) {
        console.error('Error cargando ciudades:', error)
      } finally {
        setLoadingDane(false)
      }
    }
    loadCiudades()
  }, [watchDepartamento])

  // Calcular Dígito Verificación simple
  useEffect(() => {
    if (watchNit && watchEsEmisorFE) {
      // Algoritmo simple o placeholder. 
      // Se podría implementar el algoritmo MOD 11 real aquí
      // Por ahora dejamos que el usuario lo ingrese o lo pre-calculamos dummy
    }
  }, [watchNit, watchEsEmisorFE])

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('AuthToken')
      if (!token) throw new Error('Token no disponible')

      const method = id ? 'put' : 'post'
      const apiUrl = id ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${id}` : `${process.env.NEXT_PUBLIC_API_URL}/customers`

      // Preparar payload, añadir nombres de depto/ciudad si están seleccionados
      const depto = departamentos.find(d => d.codigo === data.codigoDaneDepartamento)
      const ciudad = ciudades.find(c => c.codigo === data.codigoDaneCiudad)

      const payload = {
        ...data,
        departamentoDian: depto?.nombre,
        ciudadDian: ciudad?.nombre,
        paisCodigo: 'CO',
        paisNombre: 'Colombia'
      }

      const response = await axios({
        method: method,
        url: apiUrl,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data || response.status === 200) {
        onClose()
        reset()
      }
    } catch (error) {
      console.error('Error al enviar:', error)
    }
  }

  // Cargar datos al editar
  useEffect(() => {
    if (rowSelect.id) {
      setId(rowSelect.id)
      // Mapear campos básicos
      setValue('name', rowSelect.name || '')
      setValue('nit', rowSelect.nit || '')
      setValue('phone', rowSelect.phone || '')
      setValue('email', rowSelect.email || '')
      setValue('address', rowSelect.address || '')
      setValue('contact', rowSelect.contact || '')
      setValue('position', rowSelect.position || '')
      setValue('type', rowSelect.type || '')
      setValue('status', typeof rowSelect.status === 'boolean' ? (rowSelect.status ? '1' : '0') : rowSelect.status || '1')
      setValue('businessType', rowSelect.businessType || '')
      setValue('businessDescription', rowSelect.businessDescription || '')
      // Contrato
      setValue('fechaInicio', rowSelect.contrato?.fechaInicio || '')
      setValue('fechaFinal', rowSelect.contrato?.fechaFinal || '')
      setValue('descripcionContrato', rowSelect.contrato?.descripcionContrato || '')

      // DIAN Mapping
      setValue('esEmisorFE', rowSelect.esEmisorFE || false)
      setValue('esEmisorPrincipal', rowSelect.esEmisorPrincipal || false)
      setValue('tipoDocumentoDian', rowSelect.tipoDocumentoDian || '')
      setValue('digitoVerificacion', rowSelect.digitoVerificacion || '')
      setValue('razonSocial', rowSelect.razonSocial || '')
      setValue('nombreComercial', rowSelect.nombreComercial || '')
      setValue('responsabilidadesFiscales', rowSelect.responsabilidadesFiscales || '')
      setValue('regimenFiscal', rowSelect.regimenFiscal || '')
      setValue('codigoDaneDepartamento', rowSelect.codigoDaneDepartamento || '')
      setValue('codigoDaneCiudad', rowSelect.codigoDaneCiudad || '')
      setValue('emailFacturacionDian', rowSelect.emailFacturacionDian || '')
      setValue('sitioWeb', rowSelect.sitioWeb || '')
    } else {
      setId(null)
      reset()
      setTabValue(0)
    }
  }, [rowSelect, setValue, reset])

  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>
        {id ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
            <Tab label="Datos Básicos" />
            <Tab label="Información DIAN / FE" />
          </Tabs>
        </Box>

        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>

          {/* TAB 1: BÁSICOS */}
          <CustomTabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Nombre' error={!!errors.name} helperText={errors.name?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='nit'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='NIT / Identificación' error={!!errors.nit} helperText={errors.nit?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Teléfono' error={!!errors.phone} helperText={errors.phone?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Email' type='email' error={!!errors.email} helperText={errors.email?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Tipo</InputLabel>
                      <Select {...field} label="Tipo">
                        <MenuItem value='1'>Externa</MenuItem>
                        <MenuItem value='0'>Interna</MenuItem>
                      </Select>
                      <FormHelperText>{errors.type?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Estado</InputLabel>
                      <Select {...field} label="Estado">
                        <MenuItem value='1'>Activo</MenuItem>
                        <MenuItem value='0'>Inactivo</MenuItem>
                      </Select>
                      <FormHelperText>{errors.status?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Dirección Física' multiline rows={2} error={!!errors.address} helperText={errors.address?.message} />
                  )}
                />
              </Grid>

              {/* Contrato Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Contrato</Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='fechaInicio'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='date' label='Fecha Inicio' InputLabelProps={{ shrink: true }} error={!!errors.fechaInicio} helperText={errors.fechaInicio?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='fechaFinal'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type='date' label='Fecha Final' InputLabelProps={{ shrink: true }} error={!!errors.fechaFinal} helperText={errors.fechaFinal?.message} />
                  )}
                />
              </Grid>

              {/* Contacto & Cargo */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name='contact'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Nombre Contacto' error={!!errors.contact} helperText={errors.contact?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='position'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Cargo Contacto' error={!!errors.position} helperText={errors.position?.message} />
                  )}
                />
              </Grid>

              {/* Business Type */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name='businessType'
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Negocio</InputLabel>
                      <Select {...field} label="Tipo de Negocio">
                        <MenuItem value=''>Ninguno</MenuItem>
                        {BUSINESS_TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* TAB 2: DIAN */}
          <CustomTabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ bgcolor: 'primary.lighter', p: 2, borderRadius: 1, mb: 2 }}>
                  <Controller
                    name='esEmisorFE'
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label={<Typography fontWeight="bold">Habilitar Facturación Electrónica DIAN</Typography>}
                      />
                    )}
                  />
                  <Controller
                    name='esEmisorPrincipal'
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} disabled={!watchEsEmisorFE} />}
                        label="Es Emisor Principal (Tenant Master)"
                      />
                    )}
                  />
                </Box>
              </Grid>

              {watchEsEmisorFE && (
                <>
                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Identificación Tributaria</Typography></Grid>
                  <Grid item xs={12} sm={8}>
                    <Controller
                      name='tipoDocumentoDian'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.tipoDocumentoDian}>
                          <InputLabel>Tipo Documento DIAN</InputLabel>
                          <Select {...field} label="Tipo Documento DIAN">
                            {TIPO_DOCUMENTO_DIAN_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                          <FormHelperText>{errors.tipoDocumentoDian?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name='digitoVerificacion'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='DV'
                          error={!!errors.digitoVerificacion}
                          helperText={errors.digitoVerificacion?.message}
                          inputProps={{ maxLength: 1 }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Razón Social y Nombres</Typography></Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='razonSocial'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Razón Social (Legal)' error={!!errors.razonSocial} helperText={errors.razonSocial?.message} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='nombreComercial'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Nombre Comercial' />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Ubicación Geográfica (DANE)</Typography></Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='codigoDaneDepartamento'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.codigoDaneDepartamento}>
                          <InputLabel>Departamento</InputLabel>
                          <Select {...field} label="Departamento">
                            {departamentos.map(d => <MenuItem key={d.codigo} value={d.codigo}>{d.nombre}</MenuItem>)}
                          </Select>
                          <FormHelperText>{errors.codigoDaneDepartamento?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='codigoDaneCiudad'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.codigoDaneCiudad} disabled={!watchDepartamento || loadingDane}>
                          <InputLabel>Ciudad</InputLabel>
                          <Select {...field} label="Ciudad">
                            {ciudades.map(c => <MenuItem key={c.codigo} value={c.codigo}>{c.nombre}</MenuItem>)}
                          </Select>
                          <FormHelperText>{errors.codigoDaneCiudad?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}><Controller name='address' control={control} render={({ field }) => <TextField {...field} disabled fullWidth label="Dirección Confirmada" value={watch('address')} />} /></Grid>

                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Responsabilidades Fiscales</Typography></Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='regimenFiscal'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.regimenFiscal}>
                          <InputLabel>Régimen Fiscal</InputLabel>
                          <Select {...field} label="Régimen Fiscal">
                            {REGIMEN_FISCAL_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                          <FormHelperText>{errors.regimenFiscal?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='responsabilidadesFiscales'
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.responsabilidadesFiscales}>
                          <InputLabel>Responsabilidades</InputLabel>
                          <Select {...field} label="Responsabilidades">
                            {RESPONSABILIDADES_FISCALES_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                          <FormHelperText>{errors.responsabilidadesFiscales?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Datos Facturación</Typography></Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='emailFacturacionDian'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Email Facturación Electrónica' error={!!errors.emailFacturacionDian} helperText={errors.emailFacturacionDian?.message} />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='sitioWeb'
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label='Sitio Web' />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CustomTabPanel>

        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cancelar
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit(onSubmit)}>
          Guardar Cliente
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ClienteForm
