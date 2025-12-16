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
    icon: 'tabler-shopping-cart',
    children: [
      {
        label: 'Cotizaciones',
        href: '/ventas/cotizaciones/list'
      },
      {
        label: 'Pedidos',
        href: '/ventas/pedidos'
      },
      {
        label: 'Facturas',
        href: '/ventas/facturas/list'
      },
      {
        label: 'Productos',
        href: '/ventas/productos/list'
      }
    ]
  },
  {
    label: 'Contabilidad',
    icon: 'tabler-calculator',
    children: [
      {
        label: 'Plan de Cuentas',
        href: '/contabilidad/plan-cuentas'
      },
      {
        label: 'Libro Diario',
        href: '/contabilidad/libro-diario'
      },
      {
        label: 'Estado Resultados',
        href: '/contabilidad/estado-resultados'
      },
      {
        label: 'Balance General',
        href: '/contabilidad/balance-general'
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
