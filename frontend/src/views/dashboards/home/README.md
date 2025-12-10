# Dashboard Home - CloudFly

Dashboard principal del sistema CloudFly Marketing AI Pro.

## 📁 Componentes

### `index.tsx`
Componente principal que organiza el layout del dashboard en un grid responsive.

### `WelcomeBanner.tsx`
- Banner de bienvenida con gradiente
- Saludo personalizado al usuario
- Fecha y hora en tiempo real
- Quick Actions (Nueva Venta, Producto, Cliente, Reportes)
- Diseño glassmorphism

### `StatsCards.tsx`
4 tarjetas de estadísticas principales:
1. **Ventas Hoy** - Monto total con % de cambio
2. **Clientes Activos** - Cantidad con tendencia
3. **Productos** - Inventario con alertas de stock bajo
4. **Chatbot IA** - Estado y conversaciones activas

### `SalesChart.tsx`
- Gráfico de líneas con Recharts
- Muestra Ventas y Órdenes
- Filtros: 7 días, 30 días, Año
- Tooltips interactivos
- Formato de moneda colombiana

### `RecentActivity.tsx`
Feed de actividad reciente:
- Ventas completadas
- Nuevos clientes
- Actividad del chatbot
- Alertas de inventario
- Cotizaciones enviadas

### `TopProducts.tsx`
- Top 5 productos más vendidos
- Barras de progreso visuales
- Indicadores de tendencia (up/down/stable)
- Ranking numerado

### `ActiveConversations.tsx`
- Conversaciones de WhatsApp activas
- Badges de mensajes no leídos
- Estados: Activa, Pendiente, Resuelta
- Botón de acción para ver todas

## 🎨 Características de Diseño

- **Responsive**: Mobile-first con breakpoints MD y SM
- **Glassmorphism**: Efectos de glass en botones y cards
- **Gradientes**: Colores corporativos de CloudFly
- **Animaciones**: Hover effects, transitions suaves
- **Iconos**: Material UI Icons consistentes
- **Tooltips**: Info adicional en hover

## 🔌 Integración con API

Todos los componentes tienen funciones `fetch*()` preparadas para conectar con el backend:

```typescript
// Ejemplo de integración
const fetchStats = async () => {
  try {
    const response = await fetch('/api/dashboard/stats')
    const data = await response.json()
    setStats(data)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}
```

## 📊 Endpoints Necesarios

El dashboard requiere los siguientes endpoints del backend:

1. `GET /api/dashboard/stats` - Estadísticas generales
2. `GET /api/dashboard/sales?period=7d|30d|year` - Datos del gráfico
3. `GET /api/dashboard/activity?limit=5` - Actividad reciente
4. `GET /api/dashboard/top-products?period=week` - Productos top
5. `GET /api/dashboard/conversations?status=active&limit=4` - Conversaciones WhatsApp

## 🚀 Uso

```typescript
// En tu router principal
import HomeDashboard from '@/views/dashboards/home'

// Ruta
{
  path: '/home',
  element: <HomeDashboard />
}
```

## 📱 Responsive Breakpoints

- **Mobile** (xs): Stack vertical completo
- **Tablet** (sm, md): Grid 2 columnas
- **Desktop** (lg, xl): Layout completo con sidebar

## 🎯 Quick Actions Links

- Nueva Venta → `/apps/pos`
- Agregar Producto → `/productos/nuevo`
- Nuevo Cliente → `/clientes/nuevo`
- Ver Reportes → `/reportes`

## ⚡ Performance

- Lazy loading de componentes pesados
- Memoización de cálculos
- Debounce en actualizaciones en tiempo real
- Skeleton loaders (ready para implementar)

## 🔄 Estado y Updates

Para updates en tiempo real, integrar WebSockets:

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://api.cloudfly.com.co/ws')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // Update stats, activities, etc.
  }
  
  return () => ws.close()
}, [])
```

## 📝 TODOs

- [ ] Conectar todos los componentes al backend real
- [ ] Implementar WebSocket para updates en tiempo real
- [ ] Agregar skeleton loaders
- [ ] Implementar error boundaries
- [ ] Agregar tests unitarios
- [ ] Optimizar re-renders con React.memo
- [ ] Implementar modo offline/cache
- [ ] Agregar export de datos (PDF/Excel)

---

**CloudFly Marketing AI Pro** © 2025
