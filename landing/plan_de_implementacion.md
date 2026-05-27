# Plan de Implementación: Actualización de Landing Page CloudFly

## Objetivo
Renovar la página principal (`index.html`) para incluir una descripción comercial sólida de CloudFly, crear un menú desplegable de "Nuestros Servicios" y desarrollar páginas individuales para cada servicio manteniendo el diseño y los colores de la marca.

## Fases de Implementación

### Fase 1: Actualización de Estilos (CSS)
1. Modificar `styles.css` para soportar menús desplegables (`.dropdown`, `.dropdown-content`).
2. Asegurar que el diseño sea responsivo y se mantenga alineado con la paleta de colores de CloudFly (Primary: `#7367F0`, Accent: `#FF4D8D`).

### Fase 2: Rediseño de `index.html`
1. Reemplazar el `index.html` actual.
2. Incorporar el nuevo menú desplegable "Nuestros Servicios" en la barra de navegación.
3. Actualizar los textos hero y descriptivos basándose en el enfoque de "Carta Comercial" y "Ficha de Producto" (enfocado en ventas 24/7, automatización con IA, CRM, omnicanalidad).

### Fase 3: Creación de Páginas de Servicios
Clonar la estructura base de `index.html` para generar una landing page específica para cada servicio, adaptando el título, descripción e iconos:
- Diseño Web (`diseno-web.html`)
- Desarrollo de Aplicaciones a la Medida (`desarrollo-aplicaciones.html`)
- Consultoría (`consultoria.html`)
- Hosting (VPS, Compartido) (`hosting.html`)
- Soporte WordPress (`soporte-wordpress.html`)
- Estrategia Digital (`estrategia-digital.html`)
- Desarrollo Móvil (`desarrollo-movil.html`)

### Fase 4: Validación y Pruebas
1. Verificar que los enlaces del menú desplegable funcionen correctamente en todas las páginas.
2. Comprobar la correcta visualización en dispositivos móviles y escritorio.
3. Asegurar que los íconos Lucide se carguen correctamente.
