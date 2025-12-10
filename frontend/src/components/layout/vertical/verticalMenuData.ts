// Vertical Menu Data
export const verticalMenuData = [
    {
        label: 'Comunicaciones',
        icon: 'chat',
        route: '#',
        roles: ['SUPERADMIN', 'ADMIN', 'USER'],
        children: [
            {
                label: 'Chatbot IA WhatsApp',
                route: '/settings/chatbot',
                roles: ['SUPERADMIN', 'ADMIN']
            },
            {
                label: 'Tipos de Chatbot',
                route: '/settings/chatbot-types/list',
                roles: ['SUPERADMIN']
            },
            {
                label: 'Conversaciones',
                route: '/comunicaciones/conversaciones',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Marqueting',
        icon: 'megaphone',
        route: '#',
        roles: ['SUPERADMIN', 'ADMIN', 'USER'],
        children: [
            {
                label: 'Campañas',
                route: '/marketing/campanas',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            },
            {
                label: 'Terceros',
                route: '/marketing/contacts/list',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Calendario',
        icon: 'calendar',
        route: '/calendar',
        roles: ['SUPERADMIN', 'BIOMEDICAL', 'ADMIN', 'USER']
    },
    {
        label: 'Usuarios y Roles',
        icon: 'users',
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            {
                label: 'Gestión de Usuarios',
                route: '/accounts/user/list',
                roles: ['SUPERADMIN', 'ADMIN']
            }
        ]
    },
    {
        label: 'Ventas',
        route: '/ventas/list',
        roles: ['SUPERADMIN', 'ADMIN', 'USER'],
        icon: 'shopping-cart',
        children: [
            {
                label: 'Categorías',
                route: '/ventas/categorias/list',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            },
            {
                label: 'Productos',
                route: '/ventas/productos/list',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            },
            {
                label: 'Cotizaciones',
                route: '/ventas/cotizaciones/list',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            },
            {
                label: 'Pedidos',
                route: '/ventas/pedidos',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            },
            {
                label: 'Facturas',
                route: '/ventas/facturas/list',
                roles: ['SUPERADMIN', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Administracion',
        icon: 'settings',
        roles: ['SUPERADMIN', 'ADMIN'],
        children: [
            {
                label: 'Clientes',
                route: '/administracion/clientes/list',
                roles: ['SUPERADMIN', 'ADMIN']
            },
            {
                label: 'Tipos de Chatbot',
                route: '/settings/chatbot-types/list',
                roles: ['SUPERADMIN', 'ADMIN']
            }
        ]
    }
]

export default verticalMenuData
