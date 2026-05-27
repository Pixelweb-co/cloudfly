'use client'

import { useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-hot-toast'

import CustomTextField from '@core/components/mui/TextField'
import { companyService } from '@/services/companies/companyService'
import type { CompanyDTO, CompanyCreateRequest } from '@/types/companies'

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  company?: CompanyDTO
  refreshData: () => void
}

const schema = yup.object().shape({
  name: yup.string().required('El nombre es requerido'),
  nit: yup.string().required('El NIT es requerido'),
  address: yup.string(),
  phone: yup.string(),
  status: yup.boolean(),
  isPrincipal: yup.boolean()
})

const CompanyForm = ({ open, setOpen, company, refreshData }: Props) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CompanyCreateRequest>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      nit: '',
      address: '',
      phone: '',
      status: true,
      isPrincipal: false
    }
  })

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        nit: company.nit,
        address: company.address || '',
        phone: company.phone || '',
        status: company.status,
        isPrincipal: company.isPrincipal
      })
    } else {
      reset({
        name: '',
        nit: '',
        address: '',
        phone: '',
        status: true,
        isPrincipal: false
      })
    }
  }, [company, reset, open])

  const onSubmit = async (data: CompanyCreateRequest) => {
    try {
      if (company) {
        await companyService.updateCompany(company.id, data)
        toast.success('Compañía actualizada exitosamente')
      } else {
        await companyService.createCompany(data)
        toast.success('Compañía creada exitosamente')
      }
      setOpen(false)
      refreshData()
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('Error al guardar compañía')
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{company ? 'Editar Compañía' : 'Nueva Compañía'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={5} className='pt-2'>
            <Grid item xs={12}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Nombre de la Compañía'
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='nit'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='NIT / Identificación'
                    error={!!errors.nit}
                    helperText={errors.nit?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Teléfono'
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='address'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Dirección'
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name='status'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                    label='Activa'
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name='isPrincipal'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                    label='Compañía Principal'
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color='secondary'>Cancelar</Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CompanyForm
