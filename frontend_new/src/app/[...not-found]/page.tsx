// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import NotFound from '@views/NotFound'

// Util Imports
import { getServerMode, getSystemMode, getMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

const NotFoundPage = () => {
  // Vars
  const direction = 'ltr'
  const mode = getMode()
  const systemMode = getSystemMode()
  const settingsCookie = getSettingsFromCookie()
  const serverMode = getServerMode()

  return (
    <Providers direction={direction} mode={mode} systemMode={systemMode} settingsCookie={settingsCookie}>
      <BlankLayout systemMode={systemMode}>
        <NotFound mode={serverMode} />
      </BlankLayout>
    </Providers>
  )
}

export default NotFoundPage
