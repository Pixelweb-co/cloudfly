// Next Imports
import type { Metadata } from 'next'

import RegisterV2 from '@/views/pages/auth/RegisterV2'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Crea tu cuenta'
}

const RegisterPage = () => {
  // Vars
  const mode = getServerMode()

  return <RegisterV2 mode={mode} />
}

export default RegisterPage
