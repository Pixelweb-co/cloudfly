// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getSystemMode, getMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

type Props = ChildrenType

const Layout = async ({ children }: Props) => {
  // Vars
  const direction = 'ltr'
  const systemMode = getSystemMode()
  const mode = getMode()
  const settingsCookie = getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} systemMode={systemMode} settingsCookie={settingsCookie}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
