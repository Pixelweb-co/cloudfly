import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

export const AGENT_TYPES = [
  { 
    value: 'sales', 
    label: 'Ventas', 
    color: '#1976d2', 
    description: 'Enfocado en el cierre de ventas, cotizaciones y catálogo.', 
    icon: ShoppingCartIcon 
  },
  { 
    value: 'support', 
    label: 'Soporte', 
    color: '#2e7d32', 
    description: 'Atención al cliente y resolución de dudas técnicas.', 
    icon: SupportAgentIcon 
  },
  { 
    value: 'booking', 
    label: 'Reservas', 
    color: '#7b1fa2', 
    description: 'Gestión de citas, reservas y disponibilidad.', 
    icon: CalendarMonthIcon 
  },
  { 
    value: 'restaurant', 
    label: 'Restaurante', 
    color: '#e65100', 
    description: 'Toma de pedidos de comida y reserva de mesas.', 
    icon: RestaurantIcon 
  },
  { 
    value: 'custom', 
    label: 'Personalizado', 
    color: '#455a64', 
    description: 'Configuración totalmente abierta para casos únicos.', 
    icon: SettingsSuggestIcon 
  }
];

export const TONES = [
  { value: 'profesional', label: 'Profesional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'entusiasta', label: 'Entusiasta' }
];

export const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

export const ALL_TOOLS = [
  // Catálogo
  { name: 'search_products_semantically', label: 'Búsqueda Semántica', group: 'Catálogo' },
  { name: 'check_products_stock', label: 'Consulta de Stock', group: 'Catálogo' },
  // Contactos
  { name: 'get_contact', label: 'Buscar Contacto', group: 'Contactos' },
  { name: 'manage_contact', label: 'Gestionar Contacto', group: 'Contactos' },
  // Pedidos
  { name: 'create_order', label: 'Crear Pedido', group: 'Pedidos' },
  { name: 'create_quote', label: 'Crear Cotización', group: 'Pedidos' },
  { name: 'convert_quote_to_order', label: 'Convertir Cotización', group: 'Pedidos' },
  { name: 'get_order', label: 'Ver Pedido', group: 'Pedidos' },
  { name: 'modify_order', label: 'Modificar Pedido', group: 'Pedidos' },
  // Pipeline
  { name: 'update_pipeline_stage', label: 'Actualizar Etapa', group: 'Pipeline' },
  { name: 'get_contact_pipeline', label: 'Ver Etapas Disponibles', group: 'Pipeline' },
  { name: 'generate_pipeline_chart', label: 'Gráfico de Pipeline', group: 'Pipeline' }
];

export const TOOLS_BY_TYPE = {
  sales: [
    'search_products_semantically', 'check_products_stock', 
    'get_contact', 'manage_contact', 
    'create_order', 'create_quote', 'convert_quote_to_order',
    'update_pipeline_stage', 'get_contact_pipeline'
  ],
  support: [
    'get_contact', 'manage_contact', 'get_order'
  ],
  booking: [
    'get_contact', 'manage_contact', 'update_pipeline_stage'
  ],
  restaurant: [
    'search_products_semantically', 'check_products_stock', 
    'get_contact', 'create_order'
  ],
  custom: ALL_TOOLS.map(t => t.name)
};

export const DEFAULT_CHATBOT = {
  agent_type: 'sales',
  agent_name: 'Asistente',
  language: 'es',
  tone: 'profesional',
  system_prompt_override: '',
  extra_instructions: '',
  enabled_tools: TOOLS_BY_TYPE.sales,
  max_history: 10,
  max_tool_loops: 5,
  temperature: 0.7,
  is_active: 1
};
