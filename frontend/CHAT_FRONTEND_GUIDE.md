# 🎯 IMPLEMENTACIÓN FRONTEND - Módulo de Chat Omnicanal

## ✅ COMPLETADO

### Base del Sistema:
1. ✅ Tipos TypeScript (`chatTypes.ts`)
2. ✅ Socket Context Provider (`SocketContext.tsx`)
3. ✅ Hook de Mensajes (`useChatMessages.ts`)
4. ✅ Hook de Contactos (`useContactList.ts`)

---

## 📋 PENDIENTE - Componentes UI

### 1. Agregar al Menú (`verticalMenuData.json`)
```json
{
  "label": "Conversaciones",
  "route": "/comunicaciones/conversaciones",
  "icon": "chat",
  "roles": ["SUPERADMIN", "ADMIN", "USER"]
}
```

### 2. Página Principal (`/app/(dashboard)/comunicaciones/conversaciones/page.tsx`)
```tsx
'use client'

import { SocketProvider } from '@/contexts/SocketContext'
import ConversationsView from '@/views/apps/comunicaciones/conversaciones'

export default function ConversationsPage() {
  return (
    <SocketProvider>
      <ConversationsView />
    </SocketProvider>
  )
}
```

### 3. Vista Principal (`/views/apps/comunicaciones/conversaciones/index.tsx`)
```tsx
'use client'

import { useState } from 'react'
import { Card, Tabs, Tab, Box } from '@mui/material'
import KanbanBoard from './KanbanBoard'

export default function ConversationsView() {
  const [currentTab, setCurrentTab] = useState('WHATSAPP')

  return (
    <Card>
      <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)}>
        <Tab label="WhatsApp" value="WHATSAPP" />
        <Tab label="Facebook" value="FACEBOOK_MESSENGER" />
        <Tab label="Instagram" value="INSTAGRAM_DM" />
      </Tabs>
      
      <Box sx={{ p: 3 }}>
        <KanbanBoard platform={currentTab} />
      </Box>
    </Card>
  )
}
```

### 4. Kanban Board (`KanbanBoard.tsx`)
- Tres columnas: LEAD, POTENTIAL, CLIENT
- Usa `useContactList(platform)`
- Muestra ContactCard por cada contacto
- Implementa drag & drop con `react-beautiful-dnd`

### 5. Contact Card (`ContactCard.tsx`)
- Muestra: avatar, nombre, último mensaje, hora, unread count
- onClick: abre ChatWindow
- Draggable para cambiar de columna

### 6. Chat Window (`ChatWindow.tsx`)
- Modal/Drawer a la derecha
- Usa `useChatMessages({ conversationId })`
- Componentes hijos:
  - `MessageList.tsx`: Lista de mensajes con scroll
  - `MessageBubble.tsx`: Burbujas INBOUND/OUTBOUND
  - `MessageInput.tsx`: Input con botón enviar
  - `TypingIndicator.tsx`: "Usuario está escribiendo..."

---

## 🎨 ESTRUCTURA RECOMENDADA

```
frontend/src/
├── app/(dashboard)/comunicaciones/conversaciones/
│   └── page.tsx
├── views/apps/comunicaciones/conversaciones/
│   ├── index.tsx
│   ├── KanbanBoard.tsx
│   ├── ContactColumn.tsx
│   ├── ContactCard.tsx
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   └── TypingIndicator.tsx
├── contexts/
│   └── SocketContext.tsx ✅
├── hooks/
│   ├── useChatMessages.ts ✅
│   └── useContactList.ts ✅
└── types/apps/
    └── chatTypes.ts ✅
```

---

## 🔧 INSTALACIÓN DE DEPENDENCIAS

```bash
cd frontend
npm install socket.io-client@^4.6.1 date-fns@^2.30.0 react-beautiful-dnd@^13.1.1
npm install --save-dev @types/react-beautiful-dnd
```

---

## 🚀 EJEMPLO: MessageBubble.tsx

```tsx
import { Box, Typography, Avatar } from '@mui/material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Message } from '@/types/apps/chatTypes'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isInbound = message.direction === 'INBOUND'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isInbound ? 'flex-start' : 'flex-end',
        mb: 2
      }}
    >
      {isInbound && message.displayName && (
        <Avatar sx={{ mr: 1 }}>{message.displayName[0]}</Avatar>
      )}
      
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: isInbound ? 'grey.100' : 'primary.main',
          color: isInbound ? 'text.primary' : 'white',
          borderRadius: 2,
          p: 2
        }}
      >
        <Typography variant="body1">{message.body}</Typography>
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.7 }}>
          {format(new Date(message.sentAt), 'HH:mm', { locale: es })}
          {!isInbound && message.status === 'READ' && ' ✓✓'}
        </Typography>
      </Box>
    </Box>
  )
}
```

---

## 🎯 PRÓXIMOS PASOS

1. **Agregar al menú** vertical
2. **Crear página** de conversaciones con SocketProvider
3. **Implementar KanbanBoard** con 3 columnas
4. **Crear ContactCard** con click handler
5. **Implementar ChatWindow** con MessageList
6. **Agregar MessageInput** con envío real
7. **Testear** con datos reales

---

## 🔐 VARIABLES DE ENTORNO

Agregar en `.env.local`:
```
NEXT_PUBLIC_CHAT_SOCKET_URL=https://chat.cloudfly.com.co
```

---

## 📝 NOTAS IMPORTANTES

1. El `SocketProvider` debe envolver toda la aplicación o al menos la sección de conversaciones
2. Los mensajes se actualizan en tiempo real automáticamente
3. El drag & drop requiere `react-beautiful-dnd`
4. Los sonidos de notificación son opcionales
5. Implementar paginación en MessageList para conversaciones largas

---

## 🐛 DEBUGGING

- Usa `console.log` en `SocketContext` para ver eventos
- Verifica que el token JWT esté en localStorage
- Revisa que `chat.cloudfly.com.co` esté accesible
- Comprueba los logs del microservicio Socket.IO

---

## ✨ FEATURES OPCIONALES

- Upload de archivos con Drag & Drop
- Mensajes de voz
- Emojis con `emoji-picker-react`
- Búsqueda de mensajes
- Filtros por fecha
- Notificaciones del navegador
- Badge en el menú con count de no leídos

---

¡El sistema está casi listo! Solo falta implementar los componentes UI.
