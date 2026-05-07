# Plan: Real-Time Chat System (Socket.io)

## Resumen

El codebase ya tiene **modelos de Prisma** para `Conversation` y `Message`, **CSS completo** para la UI de chat, y **stubs JS** en `chat.js`. Lo que falta es la infraestructura real-time y las API routes.

---

## Arquitectura Propuesta

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

**¿Por qué servidor separado?** Next.js App Router no soporta WebSocket nativo en Route Handlers. Socket.io necesita un servidor HTTP persistente.

---

## Fase 1: Schema de Prisma (mejoras)

**Archivo:** `prisma/schema.prisma`

Los modelos ya existen pero necesitan mejoras:

```prisma
// Agregar al modelo Conversation:
status      ConvStatus @default(OPEN)
adminId     String?
admin       User?      @relation("AdminConversations", fields: [adminId], references: [id])
closedAt    DateTime?

// Agregar al modelo Message:
fromUserId  String?
fromUser    User?      @relation(fields: [fromUserId], references: [id])
status      MsgStatus  @default(SENT)

// Nuevos enums:
enum ConvStatus { OPEN, CLOSED, ARCHIVED }
enum MsgStatus { SENT, DELIVERED, READ }
```

**Acciones:**
1. Editar `schema.prisma`
2. `npx prisma db push`
3. `npx prisma generate`

---

## Fase 2: Servidor Socket.io

**Archivo nuevo:** `socket-server/index.js`

```javascript
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  // Usuario se une a rooms de sus conversaciones
  socket.on('join', (conversationId) => {
    socket.join(conversationId);
  });
  
  // Enviar mensaje
  socket.on('sendMessage', async (data) => {
    // Guardar en DB via fetch a API REST
    // Emitir a todos en la room
    io.to(data.conversationId).emit('newMessage', savedMessage);
  });
  
  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('userTyping', data);
  });
  
  // Marcar como leído
  socket.on('markRead', (data) => {
    io.to(data.conversationId).emit('messagesRead', data);
  });
});

server.listen(3001);
```

**Dependencias nuevas:**
```bash
npm install socket.io
npm install -D @types/socket.io
```

**Package.json script:**
```json
"dev:chat": "node socket-server/index.js"
"dev": "concurrently \"next dev\" \"node socket-server/index.js\""
```

---

## Fase 3: API Routes REST

### 3.1 Crear conversación
**Archivo:** `src/app/api/conversations/route.ts`

| Método | Acción |
|---|---|
| `POST` | Crear nueva conversación (cliente inicia) |
| `GET` | Listar conversaciones del usuario (con paginación) |

**Validación Zod:**
```typescript
const CreateConversationSchema = z.object({
  type: z.enum(['COMPRA', 'COTIZACION', 'SERVICIO', 'REPARACION', 'GENERIC']),
  subject: z.string().min(1).max(200),
  firstMessage: z.string().min(1).max(2000)
});
```

### 3.2 Mensajes de una conversación
**Archivo:** `src/app/api/conversations/[id]/messages/route.ts`

| Método | Acción |
|---|---|
| `GET` | Obtener mensajes (paginados, últimos 50 primero) |
| `POST` | Enviar nuevo mensaje |

**Validación Zod:**
```typescript
const SendMessageSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().optional(),
  imageCaption: z.string().max(500).optional()
}).refine(data => data.text || data.imageUrl, {
  message: 'Se requiere texto o imagen'
});
```

### 3.3 Marcar como leído
**Archivo:** `src/app/api/conversations/[id]/read/route.ts`

| Método | Acción |
|---|---|
| `POST` | Marcar todos los mensajes no leídos como leídos |

### 3.4 Admin: listar todas las conversaciones
**Archivo:** `src/app/api/admin/conversations/route.ts`

| Método | Acción |
|---|---|
| `GET` | Listar todas las conversaciones (admin) |
| `POST` | Asignar conversación a admin |

### 3.5 SSE para notificaciones en tiempo real
**Archivo:** `src/app/api/chat/stream/route.ts`

Endpoint SSE que el frontend puede usar como fallback:
```typescript
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Escuchar eventos de Socket.io y emitir como SSE
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

## Fase 4: Frontend - Vanilla JS

**Archivo:** `public/lib/chat.js` (reemplazar stubs)

### 4.1 Conexión Socket.io
```javascript
var chatSocket = null;
function initChatSocket() {
  if (!currentUser) return;
  chatSocket = io('http://localhost:3001');
  
  chatSocket.on('connect', function() {
    loadConversations();
  });
  
  chatSocket.on('newMessage', function(msg) {
    handleNewMessage(msg);
  });
  
  chatSocket.on('userTyping', function(data) {
    showTypingIndicator(data.userId);
  });
}
```

### 4.2 Funciones principales

| Función | Descripción |
|---|---|
| `loadConversations()` | GET `/api/conversations`, renderizar lista |
| `openConversation(id)` | GET mensajes, unirse a room Socket.io, renderizar chat |
| `sendMessage(text, imageUrl)` | POST `/api/conversations/[id]/messages` + emit Socket.io |
| `markAsRead(conversationId)` | POST `/api/conversations/[id]/read` |
| `showTypingIndicator(userId)` | Mostrar "escribiendo..." en el chat |
| `handleNewMessage(msg)` | Agregar mensaje al DOM, scroll al fondo |

### 4.3 Integración con navegación
En `navigation.js`, agregar:
```javascript
if (id === 'mensajes') {
  loadConversations();
  initChatSocket();
}
if (id === 'chat') {
  // Abrir conversación específica
}
```

### 4.4 Widget flotante (opcional pero recomendado)
Agregar un botón flotante en la esquina inferior derecha:
```html
<button id="chatWidget" onclick="openChatWidget()" style="position:fixed;bottom:24px;right:24px;...">
  💬
</button>
```

---

## Fase 5: Panel Admin

**Archivo:** `public/lib/admin.js` (agregar funciones)

| Función | Descripción |
|---|---|
| `loadAdminConversations()` | GET `/api/admin/conversations`, listar todas |
| `assignConversation(conversationId)` | POST asignar a admin logueado |
| `closeConversation(conversationId)` | POST cerrar conversación |

El CSS ya existe en `admin.css` (líneas 306-348).

---

## Fase 6: Validaciones Zod

**Archivo:** `src/lib/validations.ts`

Agregar schemas para chat:
```typescript
export const CreateConversationSchema = z.object({ ... });
export const SendMessageSchema = z.object({ ... });
export const MarkReadSchema = z.object({ conversationId: z.string() });
```

---

## Orden de Implementación

| # | Tarea | Archivos | Estimado |
|---|---|---|---|
| 1 | Mejorar schema Prisma + migrar | `schema.prisma` | 10 min |
| 2 | Instalar socket.io + configurar servidor | `package.json`, `socket-server/index.js` | 20 min |
| 3 | API: crear conversación | `api/conversations/route.ts` | 15 min |
| 4 | API: mensajes CRUD | `api/conversations/[id]/messages/route.ts` | 20 min |
| 5 | API: marcar leído | `api/conversations/[id]/read/route.ts` | 10 min |
| 6 | API: admin conversaciones | `api/admin/conversations/route.ts` | 15 min |
| 7 | Validaciones Zod | `validations.ts` | 10 min |
| 8 | Frontend: conexión Socket.io | `chat.js` | 20 min |
| 9 | Frontend: renderizar conversaciones | `chat.js` | 20 min |
| 10 | Frontend: enviar/recibir mensajes | `chat.js` | 25 min |
| 11 | Frontend: typing indicators | `chat.js` | 10 min |
| 12 | Frontend: widget flotante | `index.html`, `chat.js` | 15 min |
| 13 | Panel admin | `admin.js` | 20 min |
| 14 | Testing + fixes | - | 30 min |

**Total estimado: ~4 horas**

---

## Consideraciones de Producción

| Aspecto | Solución |
|---|---|
| **Deploy** | Socket.io server en Render/Railway separado del Next.js |
| **Auth en WebSocket** | Token JWT en query param al conectar |
| **Rate limiting** | Middleware en API routes + limit en Socket.io |
| **Imágenes** | Subir a Cloudinary antes de enviar mensaje |
| **Notificaciones push** | Web Push API para mensajes cuando el usuario no está en la página |
| **Escalabilidad** | Socket.io con Redis adapter para múltiples instancias |

---

## Preguntas Pendientes

1. ¿El chat es solo texto o también con imágenes? (El schema ya soporta `imageUrl`)
2. ¿Los clientes pueden iniciar conversación desde cualquier página o solo desde el carrito/checkout?
3. ¿Se quieren notificaciones push cuando llega un mensaje nuevo?
4. ¿El servidor Socket.io se deploya en el mismo servidor que Next.js o separado?
