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
import { menuService, type MenuItem as MenuItemData } from '@/services/menuService'

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
  const [menuData, setMenuData] = useState<MenuItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])

  // Fetch menu from backend
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Get token from localStorage
        // Try multiple keys for token
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('accessToken') || localStorage.getItem('AuthToken'))
          : null

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

            // Clean roles (remove whitespace, uppercase)
            roles = roles.map(r => r.trim().toUpperCase())
            setUserRoles(roles)

            // Find the specific role we care about for hardcoded logic
            const hasSuperAdmin = roles.some(r => r.includes('SUPERADMIN'))
            const hasManager = roles.some(r => r.includes('MANAGER'))
            const hasAdmin = roles.some(r => r.includes('ADMIN') && !r.includes('SUPERADMIN'))

            if (hasSuperAdmin) {
              setUserRole('SUPERADMIN')
            } else if (hasManager) {
              setUserRole('MANAGER')
            } else if (hasAdmin) {
              setUserRole('ADMIN')
            }
          } catch (e) {
            console.error('Failed to decode token:', e)
          }

          // Fetch menu from new endpoint /api/menu
          const menu = await menuService.getMenu()
          setMenuData(menu)
        } else {
          setMenuData([])
        }
      } catch (err) {
        console.error('Error loading menu from backend:', err)
        setError('Error al cargar menú')
        // Fallback to static menu if available, parsed as MenuItem[]
        // @ts-ignore
        setMenuData(verticalMenuData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Convert backend menu format to component props
  const renderMenuItems = (items: MenuItemData[]) => {
    return items.map((item, index) => {
      // Filter by excludedRoles
      if (item.excludedRoles && item.excludedRoles.length > 0) {
        // If user has ANY of the excluded roles, do not render this item
        const isExcluded = item.excludedRoles.some(excluded =>
          userRoles.some(ur => ur.includes(excluded.toUpperCase()))
        )
        if (isExcluded) return null
      }

      if (item.children && item.children.length > 0) {
        // Render SubMenu if there are children
        const children = renderMenuItems(item.children)
        // If all children are null (filtered out), don't render the parent
        if (children.every(child => child === null)) return null

        return (
          <SubMenu
            key={`${item.label}-${index}`}
            label={item.label}
            icon={item.icon ? <i className={item.icon} /> : undefined}
            suffix={
              item.suffix ? (
                <CustomChip label={item.suffix.label} size='small' color={item.suffix.color as any} />
              ) : undefined
            }
          >
            {children}
          </SubMenu>
        )
      } else {
        // Render MenuItem for leaf nodes
        return (
          <MenuItem
            key={`${item.label}-${index}`}
            href={item.href}
            icon={item.icon ? <i className={item.icon} /> : undefined}
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

        {/* Hardcoded items for ADMIN, SUPERADMIN and MANAGER */}
        {(userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'MANAGER') && (
          <>
            <MenuItem href='/hr/employees' icon={<i className='tabler-users' />}>
              Usuarios
            </MenuItem>
            <MenuItem href='/accounts/roles/list' icon={<i className='tabler-lock' />}>
              Roles
            </MenuItem>

          </>
        )}

        {/* Hardcoded item for SUPERADMIN or MANAGER */}
        {(userRole === 'SUPERADMIN' || userRole === 'MANAGER') && (
          <>
            <MenuItem href='/clientes' icon={<i className='tabler-credit-card' />}>
              Clientes
            </MenuItem>

            <MenuItem href='/administracion/planes' icon={<i className='tabler-credit-card' />}>
              Planes
            </MenuItem>
            <MenuItem href='/administracion/modules' icon={<i className='tabler-box' />}>
              Módulos
            </MenuItem>
            <MenuItem href='/administracion/suscripciones' icon={<i className='tabler-package' />}>
              Suscripciones
            </MenuItem>
            <MenuItem href='/administracion/consumo' icon={<i className='tabler-chart-pie' />}>
              Dashboard Consumo
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
