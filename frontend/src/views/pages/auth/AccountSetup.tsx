'use client'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'

// Styled Component Imports
import AuthIllustrationWrapperCustomer from './AuthIllustrationWrapperCustomer'
import FormEmploye from '@/views/apps/customers/form/page'
import FormCustomer from '@/views/apps/customers/form/page'

const AccountSetup = () => {
  return (
    <AuthIllustrationWrapperCustomer>
      <Card className='flex flex-col sm:is-[750px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Información de el negocio</Typography>
            <Typography>Proporciona la informacion para crear tu empresa: </Typography>
          </div>

          <FormCustomer />
        </CardContent>
      </Card>
    </AuthIllustrationWrapperCustomer>
  )
}

export default AccountSetup
