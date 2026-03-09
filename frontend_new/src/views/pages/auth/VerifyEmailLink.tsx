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

const VerifyEmailLink = () => {
  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Verificacion de cuenta </Typography>
            <Typography>Ahora puedes acceder a tu cuenta</Typography>
          </div>
          <Link href='/login' passHref>
            <Button fullWidth variant='contained' className='mbe-6'>
              Acceder
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default VerifyEmailLink
