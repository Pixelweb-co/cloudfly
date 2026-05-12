// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import AddNewAddress from '@components/dialogs/add-edit-address'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Utils
import { userMethods } from '@/utils/userMethods'

const BillingAddress = () => {
  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser

  const firstName = sessionUser?.nombres || sessionUser?.firstName || ''
  const lastName = sessionUser?.apellidos || sessionUser?.lastName || ''
  const email = sessionUser?.email || ''
  const country = sessionUser?.country || 'Colombia'
  const address1 = sessionUser?.address || '-'
  const city = sessionUser?.city || '-'
  const state = sessionUser?.state || '-'
  const zipCode = sessionUser?.zipCode || '-'
  const taxId = sessionUser?.taxId || sessionUser?.nit || '-'
  const contact = sessionUser?.phone || sessionUser?.cellphone || sessionUser?.telefono || '-'

  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Editar Dirección',
    size: 'small',
    startIcon: <i className='tabler-plus' />
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Dirección de Facturación'
          action={
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps}
              dialog={AddNewAddress}
              dialogProps={{ data: { firstName, lastName, email, country, address1, city, state, zipCode, taxId, contact } }}
            />
          }
        />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <table>
                <tbody className='align-top'>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Nombre:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{`${firstName} ${lastName}`.trim() || 'Usuario'}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Email Facturación:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{email || '-'}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        NIT/RUT:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{taxId}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Dirección:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{address1}</Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Grid>
            <Grid item xs={12} md={6}>
              <table>
                <tbody className='align-top'>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Contacto:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{contact}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Ciudad:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{city}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        País:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{country}</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td className='p-1 pis-0 is-[150px]'>
                      <Typography className='font-medium' color='text.primary'>
                        Código Postal:
                      </Typography>
                    </td>
                    <td className='p-1'>
                      <Typography>{zipCode}</Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}

export default BillingAddress
