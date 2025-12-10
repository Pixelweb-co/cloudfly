'use client'
// MUI Imports

import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

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

// Menu data import
import verticalMenuData from './verticalMenuData.json'
import { userMethods } from '@/utils/userMethods'

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

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Render menu items dynamically
  const renderMenuItems = (menuData: any[]) => {
    return menuData.map((item, index) => {
      if (
        item.children &&
        item.children.length > 0 &&
        item.roles.filter((role: any) => userMethods.isRole(role)).length > 0
      ) {
        // Render SubMenu if there are children
        return (
          <SubMenu
            key={index}
            label={item.label}
            icon={<i className={`tabler-${item.icon}`} />}
            suffix={item.suffix && <CustomChip label={item.suffix} size='small' color='error' />}
          >
            {renderMenuItems(item.children)}
          </SubMenu>
        )
      } else {
        // Render MenuItem for leaf nodes
        return (
          item.roles.filter((role: any) => userMethods.isRole(role)).length > 0 && (
            <MenuItem key={index} href={item.route} icon={<i className={`tabler-${item.icon}`} />}>
              {item.label}
            </MenuItem>
          )
        )
      }
    })
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
        <MenuItem href='/home' icon={<i className='tabler-info-circle' />} >
          Dashboard
        </MenuItem>

        {renderMenuItems(verticalMenuData)}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
