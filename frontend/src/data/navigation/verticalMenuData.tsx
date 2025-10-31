// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/home',
    icon: 'tabler-smart-home'
  },
  {
    label: 'Ventas',
    href: '/ventas',
    icon: 'tabler-info-circle',
    children:[
      {
      label: 'Pedidos',
      href: '/ventas',
      icon: 'tabler-info-circle',
      }
    ]
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

export default verticalMenuData
