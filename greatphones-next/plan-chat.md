# Plan: Real-Time Chat System (Socket.io) - SIMPLIFICADO

## Resumen

Chat simplificado: **un solo canal de comunicación** entre cada usuario y Great Phones.

- **Usuarios**: Un solo chat con "Great Phones" en `/chats`. Se crea automáticamente al abrir el chat por primera vez.
- **Admin**: Ve lista de todos los usuarios que escribieron, puede responder y cerrar conversaciones desde el panel admin.
- **Sin** crear conversaciones desde productos.
- **Sin** lista de conversaciones para usuarios.

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Next.js App Router (puerto 3000)               │
│  ├─ REST API routes (conversations, messages)   │
│  └─ Serve static (public/index.html)            │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│  Socket.io Server (puerto 3001)                 │
│  ├─ WebSocket connections                       │
│  ├─ Room management (por conversation)          │
│  └─ Emit events (newMessage, typing, read)      │
└─────────────────────────────────────────────────┘
```

---

## Flujo de Usuario

1. Usuario hace click en botón "Chat" en la navegación o widget flotante
2. Si no tiene conversación → se crea automáticamente "Chat con Great Phones"
3. Si ya tiene → se cargan los mensajes existentes
4. Usuario escribe mensajes en tiempo real
5. Admin ve el mensaje y puede responder

---

## Flujo de Admin

1. Admin va a Panel Admin → tab "Chat"
2. Ve lista de todos los usuarios que escribieron (con último mensaje y tiempo)
3. Click en un usuario → abre el chat con ese usuario
4. Puede responder mensajes en tiempo real
5. Puede cerrar la conversación

---

## Archivos Modificados

| Archivo | Cambios |
|---|---|
| `prisma/schema.prisma` | Campos status, adminId, closedAt en Conversation; fromUserId, status en Message |
| `socket-server/index.js` | Servidor Socket.io con rooms por conversación |
| `src/app/api/conversations/route.ts` | GET/POST conversaciones |
| `src/app/api/conversations/[id]/route.ts` | GET detalle conversación |
| `src/app/api/conversations/[id]/messages/route.ts` | GET/POST mensajes |
| `src/app/api/conversations/[id]/read/route.ts` | POST marcar leído |
| `src/app/api/admin/conversations/route.ts` | GET/POST admin conversaciones |
| `src/lib/validations.ts` | Schemas CreateConversation, SendMessage, MarkRead, AssignConversation |
| `public/lib/chat.js` | Reescrito completo: openUserChat, getUserConversation, sendMessage, admin functions |
| `public/lib/admin.js` | Eliminadas funciones duplicadas de chat (ahora en chat.js) |
| `public/lib/navigation.js` | 'chats' reemplaza 'mensajes'/'chat' |
| `public/index.html` | Página #p-chats única, botón chat en nav, widget flotante, admin chat section |
| `public/styles/globals.css` | Animación msgIn |
| `public/styles/admin.css` | Admin chat section flex layout |
| `package.json` | socket.io, concurrently, scripts dev |

---

## Cómo Usar

### Desarrollo
```bash
npm run dev
```
Esto inicia Next.js (puerto 3000) + Socket.io server (puerto 3001) simultáneamente.

### Para usuarios
- Botón "💬 Chat" en la navegación principal
- Widget flotante en esquina inferior derecha
- URL: `/chats`

### Para admin
- Panel Admin → tab "Chat"
- Lista de usuarios que escribieron
- Click en usuario para responder

---

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/conversations?userId=X` | Listar conversaciones de un usuario |
| POST | `/api/conversations` | Crear nueva conversación |
| GET | `/api/conversations/[id]` | Detalle de conversación |
| GET | `/api/conversations/[id]/messages` | Obtener mensajes |
| POST | `/api/conversations/[id]/messages` | Enviar mensaje |
| POST | `/api/conversations/[id]/read` | Marcar como leído |
| GET | `/api/admin/conversations` | Listar todas (admin) |
| POST | `/api/admin/conversations` | Asignar/cerrar (admin) |

---

## Socket.io Events

| Evento | Dirección | Descripción |
|---|---|---|
| `joinConversation` | Client → Server | Unirse a room de conversación |
| `leaveConversation` | Client → Server | Salir de room |
| `newMessage` | Server → Client | Nuevo mensaje recibido |
| `typing` | Client → Server | Usuario está escribiendo |
| `userTyping` | Server → Client | Otro usuario está escribiendo |
| `stopTyping` | Client → Server | Dejó de escribir |
| `userStoppedTyping` | Server → Client | Otro dejó de escribir |
| `markRead` | Client → Server | Marcar mensajes como leídos |
| `messagesRead` | Server → Client | Mensajes marcados como leídos |
| `messageSent` | Client → Server | Notificar mensaje enviado |
