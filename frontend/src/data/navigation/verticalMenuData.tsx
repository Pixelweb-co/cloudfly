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
    label: 'Recursos Humanos',
    icon: 'tabler-users',
    children: [
      // Dashboard de Nómina
      {
        label: 'Dashboard',
        href: '/hr/dashboard',
        icon: 'tabler-chart-pie'
      },
      // Gestión de Personal
      {
        label: 'Empleados',
        href: '/hr/employees',
        icon: 'tabler-user-circle'
      },
      {
        label: 'Conceptos de Nómina',
        href: '/hr/concepts',
        icon: 'tabler-list-details'
      },
      // Periodos de Nómina
      {
        label: 'Periodos de Nómina',
        href: '/hr/periods',
        icon: 'tabler-calendar-stats'
      },
      // Emisión (futuro - Nómina Electrónica)
      {
        label: 'Emisión',
        href: '/hr/emission',
        icon: 'tabler-send',
        suffix: {
          label: 'Próx.',
          color: 'warning'
        }
      },
      // Configuración
      {
        label: 'Configuración',
        href: '/hr/config',
        icon: 'tabler-settings'
      }
    ]
  },
  {
    label: 'Usuarios y Roles',
    icon: 'tabler-shield-lock',
    children: [
      {
        label: 'Gestión de Usuarios',
        href: '/accounts/user/list'
      },
      {
        label: 'Roles y Permisos',
        href: '/settings/roles/list'
      }
    ]
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: 'tabler-info-circle'
  }
]

export default verticalMenuData
