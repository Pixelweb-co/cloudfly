'use client'

// Next Imports
// import Link from 'next/link'

// Third-party Imports
import clsx from 'classnames'

// Hook Imports
// import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Eliminado: const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={clsx(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
      aria-hidden='true'
    >
      {/* Contenido del footer oculto por solicitud */}
    </div>
  )
}

export default FooterContent
