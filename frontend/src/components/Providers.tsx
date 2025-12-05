'use client'

// Type Imports
import type { ChildrenType, Direction, SystemMode } from '@core/types'
import type { Settings } from '@core/contexts/settingsContext'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { NextAuthProvider } from '@/contexts/nextAuthProvider'

type Props = ChildrenType & {
  direction: Direction
  mode?: string
  settingsCookie?: Settings
  systemMode?: SystemMode
}

const Providers = (props: Props) => {
  // Props
  const { children, direction, mode, settingsCookie, systemMode } = props

  return (
    <NextAuthProvider>
      <VerticalNavProvider>
        <SettingsProvider settingsCookie={settingsCookie ?? null} mode={mode}>
          <ThemeProvider direction={direction} systemMode={systemMode}>
            {children}
          </ThemeProvider>
        </SettingsProvider>
      </VerticalNavProvider>
    </NextAuthProvider>
  )
}

export default Providers
