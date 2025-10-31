'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import { FormControlLabel } from '@mui/material'

// Component Imports
import DialogCloseButton from '../DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type EditCustomerInfoData = {
  firstName?: string
  lastName?: string
  CustomerName?: string
  billingEmail?: string
  status?: string
  taxId?: string
  contact?: string
  language?: string[]
  country?: string
  useAsBillingAddress?: boolean
}

type EditCustomerInfoProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: EditCustomerInfoData
}

const initialData: EditCustomerInfoProps['data'] = {
  firstName: 'Oliver',
  lastName: 'Queen',
  CustomerName: 'oliverQueen',
  billingEmail: 'oliverQueen@gmail.com',
  status: 'active',
  taxId: 'Tax-8894',
  contact: '+ 1 609 933 4422',
  language: ['English'],
  country: 'US',
  useAsBillingAddress: true
}

const status = ['Status', 'Active', 'Inactive', 'Suspended']

const languages = ['English', 'Spanish', 'French', 'German', 'Hindi']

const countries = ['Select Country', 'France', 'Russia', 'China', 'UK', 'US']

const EditCustomerInfo = ({ open, setOpen, data }: EditCustomerInfoProps) => {
  // States
  const [CustomerData, setCustomerData] = useState<EditCustomerInfoProps['data']>(data || initialData)

  const handleClose = () => {
    setOpen(false)
    setCustomerData(data || initialData)
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth='md'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Information de el cliente
        <Typography component='span' className='flex flex-col text-center'>
          Gestione detalles de el cliente
        </Typography>
      </DialogTitle>
      <form onSubmit={e => e.preventDefault()}>
        <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='First Name'
                placeholder='John'
                value={CustomerData?.firstName}
                onChange={e => setCustomerData({ ...CustomerData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Last Name'
                placeholder='Doe'
                value={CustomerData?.lastName}
                onChange={e => setCustomerData({ ...CustomerData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                label='Customer Name'
                placeholder='JohnDoe'
                value={CustomerData?.CustomerName}
                onChange={e => setCustomerData({ ...CustomerData, CustomerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Billing Email'
                placeholder='johnDoe@email.com'
                value={CustomerData?.billingEmail}
                onChange={e => setCustomerData({ ...CustomerData, billingEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                fullWidth
                label='Status'
                value={CustomerData?.status}
                onChange={e => setCustomerData({ ...CustomerData, status: e.target.value as string })}
              >
                {status.map((status, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : status.toLowerCase().replace(/\s+/g, '-')}>
                    {status}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Tax ID'
                placeholder='Tax-7490'
                value={CustomerData?.taxId}
                onChange={e => setCustomerData({ ...CustomerData, taxId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Contact'
                placeholder='+ 123 456 7890'
                value={CustomerData?.contact}
                onChange={e => setCustomerData({ ...CustomerData, contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                fullWidth
                label='Language'
                value={CustomerData?.language?.map(lang => lang.toLowerCase().replace(/\s+/g, '-')) || []}
                SelectProps={{
                  multiple: true,
                  onChange: e => setCustomerData({ ...CustomerData, language: e.target.value as string[] }),
                  renderValue: selected => (
                    <div className='flex items-center gap-2'>
                      {(selected as string[]).map(value => (
                        <Chip key={value} label={value} className='capitalize' size='small' />
                      ))}
                    </div>
                  )
                }}
              >
                {languages.map((language, index) => (
                  <MenuItem key={index} value={language.toLowerCase().replace(/\s+/g, '-')}>
                    {language}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                fullWidth
                label='Country'
                value={CustomerData?.country?.toLowerCase().replace(/\s+/g, '-')}
                onChange={e => setCustomerData({ ...CustomerData, country: e.target.value as string })}
              >
                {countries.map((country, index) => (
                  <MenuItem key={index} value={index === 0 ? '' : country.toLowerCase().replace(/\s+/g, '-')}>
                    {country}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked={CustomerData?.useAsBillingAddress} />}
                label='Use as a billing address?'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' onClick={handleClose} type='submit'>
            Submit
          </Button>
          <Button variant='tonal' color='secondary' type='reset' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditCustomerInfo
