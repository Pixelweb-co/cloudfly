// Component Imports
import LoginV2 from '@/views/pages/auth/LoginV2'
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated'

// Util Imports
import { getServerMode } from '@core/utils/serverHelpers'

const LoginPage = () => {
  const mode = getServerMode()

  return (
    <>
      <RedirectIfAuthenticated />
      <LoginV2 mode={mode} />
    </>
  )
}

export default LoginPage
