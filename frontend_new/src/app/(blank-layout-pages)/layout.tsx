// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import Customizer from '@core/components/customizer'

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
      <Customizer dir={direction} />
    </Providers>
  )
}

export default Layout
