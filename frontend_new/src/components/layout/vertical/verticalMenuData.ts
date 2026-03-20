// Vertical Menu Data
export const verticalMenuData = [
    {
        label: 'Comunicaciones',
        icon: 'chat',
        route: '#',
        roles: ['MANAGER', 'ADMIN', 'USER'],
        children: [
            {
                label: 'Chatbot IA WhatsApp',
                route: '/settings/chatbot',
                roles: ['MANAGER', 'ADMIN']
            },
            {
                label: 'Tipos de Chatbot',
                route: '/settings/chatbot-types/list',
                roles: ['MANAGER']
            },
            {
                label: 'Conversaciones',
                route: '/comunicaciones/conversaciones',
                roles: ['MANAGER', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Marketing',
        icon: 'megaphone',
        route: '#',
        roles: ['MANAGER', 'ADMIN', 'USER'],
        children: [
            {
                label: 'Campañas',
                route: '/marketing/campanas',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Canales',
                route: '/marketing/canales',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Contactos',
                route: '/marketing/contacts/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Pipelines (Lista)',
                route: '/marketing/pipelines/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Pipelines (Kanban)',
                route: '/marketing/pipelines/kanban',
                roles: ['MANAGER', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Calendario',
        icon: 'calendar',
        route: '/calendar',
        roles: ['MANAGER', 'BIOMEDICAL', 'ADMIN', 'USER']
    },
    {
        label: 'Usuarios y Roles',
        icon: 'users',
        roles: ['MANAGER', 'ADMIN'],
        children: [
            {
                label: 'Gestión de Usuarios',
                route: '/accounts/user/list',
                roles: ['MANAGER', 'ADMIN']
            }
        ]
    },
    {
        label: 'Ventas',
        route: '/ventas/list',
        roles: ['MANAGER', 'ADMIN', 'USER'],
        icon: 'shopping-cart',
        children: [
            {
                label: 'Categorías',
                route: '/ventas/categorias/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Productos',
                route: '/ventas/productos/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Cotizaciones',
                route: '/ventas/cotizaciones/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Pedidos',
                route: '/ventas/pedidos',
                roles: ['MANAGER', 'ADMIN', 'USER']
            },
            {
                label: 'Facturas',
                route: '/ventas/facturas/list',
                roles: ['MANAGER', 'ADMIN', 'USER']
            }
        ]
    },
    {
        label: 'Administracion',
        icon: 'settings',
        roles: ['MANAGER', 'ADMIN'],
        children: [
            {
                label: 'Clientes',
                route: '/administracion/clientes/list',
                roles: ['MANAGER', 'ADMIN']
            },
            {
                label: 'Tipos de Chatbot',
                route: '/settings/chatbot-types/list',
                roles: ['MANAGER', 'ADMIN']
            },
            {
                label: 'Compañías',
                route: '/administracion/companies',
                roles: ['MANAGER', 'ADMIN']
            }
        ]
    }
]

export default verticalMenuData
