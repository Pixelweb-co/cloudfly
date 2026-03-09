'use client'

// Next Imports
// import Link from 'next/link'

// Third-party Imports
import clsx from 'classnames'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  return (
    <div
      className={clsx(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
      aria-hidden='true'
    >
      {/* Contenido del footer oculto por solicitud */}
    </div>
  )
}

export default FooterContent
