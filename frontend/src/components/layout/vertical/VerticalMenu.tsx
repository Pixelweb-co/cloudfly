'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { jwtDecode } from 'jwt-decode'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'
import CustomChip from '@/@core/components/mui/Chip'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// RBAC Imports
import type { MenuItem as MenuItemType } from '@/types/rbac'
import { getMenu } from '@/services/rbac/rbacService'

// Fallback static menu (used when backend is unavailable)
import verticalMenuData from '@/data/navigation/verticalMenuData'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  // State for dynamic menu
  const [menuData, setMenuData] = useState<MenuItemType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch menu from backend
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Get token from localStorage using the key defined in AuthManager
        const token = typeof window !== 'undefined' ? localStorage.getItem('AuthToken') : null

        if (token) {
          try {
            const decoded: any = jwtDecode(token)

            // Extract role/authorities from various potential claims
            const rawClaims = decoded.role || decoded.roles || decoded.authorities

            let roles: string[] = []

            if (Array.isArray(rawClaims)) {
              roles = rawClaims
            } else if (typeof rawClaims === 'string') {
              // Handle comma-separated string (e.g. "DELETE,READ,ROLE_SUPERADMIN,WRITE")
              roles = rawClaims.split(',')
            }

            // Find the specific role we care about
            const hasSuperAdmin = roles.some(r => r.toUpperCase().includes('SUPERADMIN'))
            const hasAdmin = roles.some(r => r.toUpperCase().includes('ADMIN') && !r.toUpperCase().includes('SUPERADMIN'))

            if (hasSuperAdmin) {
              setUserRole('SUPERADMIN')
            } else if (hasAdmin) {
              setUserRole('ADMIN')
            }
          } catch (e) {
            console.error('Failed to decode token:', e)
          }

          const menu = await getMenu(token)
          console.log("menu", menu)
          setMenuData(menu)
        } else {
          // If no token, maybe we should redirect or show empty
          setMenuData([])
        }
      } catch (err) {
        console.error('Error loading menu from backend:', err)
        setError('Error al cargar menú')

        // Fallback to static menu
        setMenuData(verticalMenuData() as unknown as MenuItemType[])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Convert backend menu format to component props
  const renderMenuItems = (items: MenuItemType[]) => {
    return items.map((item, index) => {
      // Handle section headers
      if (item.isSection) {
        return null // Menu sections can be handled differently
      }

      if (item.children && item.children.length > 0) {
        // Render SubMenu if there are children
        return (
          <SubMenu
            key={`${item.label}-${index}`}
            label={item.label}
            icon={item.icon ? <i className={item.icon} /> : undefined}
            suffix={item.suffix ? <CustomChip label={item.suffix} size='small' color='error' /> : undefined}
          >
            {renderMenuItems(item.children)}
          </SubMenu>
        )
      } else {
        // Render MenuItem for leaf nodes
        return (
          <MenuItem
            key={`${item.label}-${index}`}
            href={item.href}
            icon={item.icon ? <i className={item.icon} /> : undefined}
            disabled={item.disabled}
            {...(item.exactMatch === false && item.activeUrl
              ? { exactMatch: false, activeUrl: item.activeUrl }
              : { exactMatch: true })}
          >
            {item.label}
          </MenuItem>
        )
      }
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
        <CircularProgress size={30} />
      </Box>
    )
  }

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false)
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true)
        })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {/* Render dynamic menu from backend */}
        {renderMenuItems(menuData)}

        {/* Hardcoded items for ADMIN and SUPERADMIN */}
        {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
          <>
            <MenuItem href='/hr/employees' icon={<i className='tabler-users' />}>
              Usuarios
            </MenuItem>
            <MenuItem href='/settings/roles/list' icon={<i className='tabler-lock' />}>
              Roles
            </MenuItem>

          </>
        )}

        {/* Hardcoded item for SUPERADMIN */}
        {userRole === 'SUPERADMIN' && (

          <>
            <MenuItem href='/settings/menu' icon={<i className='tabler-layout-sidebar' />}>
              Gestor del Menú
            </MenuItem>
            <MenuItem href='/administracion/planes' icon={<i className='tabler-credit-card' />}>
              Planes
            </MenuItem>
            <MenuItem href='/administracion/modules' icon={<i className='tabler-box' />}>
              Módulos
            </MenuItem>
          </>
        )}

        {/* Show error message if menu failed to load */}
        {error && (
          <MenuItem disabled icon={<i className='tabler-alert-circle' />}>
            {error}
          </MenuItem>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
