'use client'


// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'


// Component Imports
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'


// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'
import { userMethods } from '@/utils/userMethods'

const VerifyEmailV1 = () => {

  const userLogin = userMethods.getUserLogin();

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Verifica tu cuenta ✉️</Typography>
            <Typography>
            {userLogin.nombres} un enlace de activacion se ha enviado a el correo electronico:{' '}
              <span className='font-medium text-textPrimary'>{userLogin.email}</span> Por favor haz click en el enlace
              para activar tu cuenta.
            </Typography>
          </div>
          <Link href='/login' passHref>
            <Button fullWidth variant='contained' className='mbe-6'>
              Acceder
            </Button>
          </Link>
          {/* <div className='flex justify-center items-center flex-wrap gap-2'>
            <Typography>No llego el correo electronico?</Typography>
            <Typography color='primary' component={Link}>
              Reenviar
            </Typography>
          </div> */}
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default VerifyEmailV1
