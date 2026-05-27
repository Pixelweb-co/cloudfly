// Third-party Imports

import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import PlanName from '@components/layout/shared/PlanName'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import CustomerName from '../horizontal/CustomerName'

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* <ModeDropdown /> */}
        <CustomerName />
      </div>
      <div className='flex items-center gap-4'>
        <PlanName />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
