// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/home',
    icon: 'tabler-smart-home'
  },
  {
    label: 'Ventas',
    href: '/ventas',
    icon: 'tabler-info-circle'
  },
  {
    label: 'Nomina',
    href: '/nomina',
    icon: 'tabler-info-circle'
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: 'tabler-info-circle'
  }
]

export default horizontalMenuData
