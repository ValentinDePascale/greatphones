import { z } from 'zod'

// === HELPER PARA FORMATEAR ERRORES ===
export function formatZodError(error: z.ZodError) {
  const formattedErrors: Record<string, string> = {}
  const issues = error.issues || []
  issues.forEach((err: any) => {
    const field = err.path.join('.')
    formattedErrors[field] = err.message
  })

  return {
    success: false,
    message: 'Error de validación',
    errors: formattedErrors,
    rawIssues: issues.map((e: any) => ({ path: e.path, message: e.message, code: e.code }))
  }
}

// === PRODUCTS ===
export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  brand: z.string().optional(),
  sub: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0).default(0),
  condition: z.enum(['Nuevo', 'Impecable', 'Muy bueno', 'Bueno', 'Usado']).optional().or(z.literal('')),
  type: z.enum(['celular', 'laptop', 'tablet', 'desktop']).optional().or(z.literal('')),
  color: z.string().optional(),
  screen: z.number().optional(),
  storage: z.string().nullable().optional(),
  ram: z.string().nullable().optional(),
  battery: z.number().int().min(0).max(100).nullable().optional(),
  processor: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  images: z.array(z.string()).default([]),
  cost: z.number().int().optional().default(0),
  isOffer: z.boolean().optional(),
  discount: z.number().int().min(0).max(100).optional(),
  offerStart: z.string().datetime().optional(),
  offerEnd: z.string().datetime().optional(),
})

export const ProductQuerySchema = z.object({
  brand: z.string().optional(),
  offer: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
})

export const ProductUpdateSchema = ProductCreateSchema.partial()

// === ACCESSORIES ===
export const AccessoryCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  brand: z.string().optional(),
  category: z.string().min(1, 'Categoría requerida'),
  price: z.number().int().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0).default(0),
  compareAtPrice: z.number().int().positive().optional(),
  color: z.string().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  compatibleModels: z.string().nullable().optional(),
  ico: z.string().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  discount: z.number().int().min(0).max(100).nullable().optional(),
  isOffer: z.boolean().optional(),
  offerStart: z.string().datetime().nullable().optional(),
  offerEnd: z.string().datetime().nullable().optional(),
})

export const AccessoryQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
})

export const AccessoryUpdateSchema = AccessoryCreateSchema.partial()

// === ORDERS ===
export const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
})

export const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Al menos un producto requerido'),
  userId: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'Teléfono inválido'),
  document: z.string().min(7, 'DNI/CUIT requerido'),
  street: z.string().min(1, 'Dirección requerida'),
  number: z.string().min(1, 'Número requerido'),
  floor: z.string().optional(),
  zip: z.string().min(4, 'Código postal requerido'),
  city: z.string().min(1, 'Ciudad requerida'),
  province: z.string().min(1, 'Provincia requerida'),
  warranty: z.boolean().optional(),
  cuotas: z.number().int().min(1).max(12).optional(),
  subtotal: z.number().int().positive(),
  total: z.number().int().positive(),
  notes: z.string().optional(),
})

export const OrderQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional(),
  userId: z.string().optional(),
})

// === USERS ===
export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  direccion: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
})

// === CHECKOUT ===
export const CheckoutSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Carrito vacío'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  document: z.string().min(7, 'DNI/CUIT requerido'),
  street: z.string().min(1, 'Dirección requerida'),
  number: z.string().min(1, 'Número requerido'),
  floor: z.string().optional(),
  zip: z.string().min(4, 'Código postal requerido'),
  city: z.string().min(1, 'Ciudad requerida'),
  province: z.string().min(1, 'Provincia requerida'),
  warranty: z.string().optional().default('90 dias'),
  delivery: z.string().optional().default('Retiro en tienda'),
  cuotas: z.number().int().min(1).max(24).optional().default(1),
  subtotal: z.number().int().positive(),
  warrantyCost: z.number().int().min(0).optional().default(0),
  deliveryCost: z.number().int().min(0).optional().default(0),
  total: z.number().int().positive(),
})

// === AUTH ===
export const SignupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'Nombre requerido').optional(),
  phone: z.string().optional(),
  dni: z.string().optional(),
  provincia: z.string().optional(),
  ciudad: z.string().optional(),
  verified: z.boolean().optional(),
})

export const SigninSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
})

// === QUOTES ===
export const QuoteCreateSchema = z.object({
  device: z.string().min(1, 'Dispositivo requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  condition: z.enum(['Nuevo', 'Perfecto', 'Bueno', 'Regular', 'Malo']).optional(),
  storage: z.string().optional(),
  battery: z.string().optional(),
  hasCharger: z.boolean().optional(),
  hasBox: z.boolean().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  name: z.string().optional(),
})

// === ARREPENTIMIENTO ===
export const ArrepentimientoSchema = z.object({
  orderId: z.string().min(1, 'Order ID requerido'),
  email: z.string().email('Email inválido'),
  motivo: z.string().min(10, 'Motivo requerido (mínimo 10 caracteres)'),
})

// === EXPORTACIÓN DE TIPOS ===
export type ProductCreatePayload = z.infer<typeof ProductCreateSchema>
export type ProductUpdatePayload = z.infer<typeof ProductUpdateSchema>
export type ProductQueryPayload = z.infer<typeof ProductQuerySchema>

export type AccessoryCreatePayload = z.infer<typeof AccessoryCreateSchema>
export type AccessoryUpdatePayload = z.infer<typeof AccessoryUpdateSchema>
export type AccessoryQueryPayload = z.infer<typeof AccessoryQuerySchema>

export type OrderItemPayload = z.infer<typeof OrderItemSchema>
export type OrderCreatePayload = z.infer<typeof OrderCreateSchema>
export type OrderQueryPayload = z.infer<typeof OrderQuerySchema>

export type UserUpdatePayload = z.infer<typeof UserUpdateSchema>

export type CheckoutPayload = z.infer<typeof CheckoutSchema>

export type SignupPayload = z.infer<typeof SignupSchema>
export type SigninPayload = z.infer<typeof SigninSchema>

export type QuoteCreatePayload = z.infer<typeof QuoteCreateSchema>

export type ArrepentimientoPayload = z.infer<typeof ArrepentimientoSchema>

// === CHAT ===
export const CreateConversationSchema = z.object({
  type: z.enum(['COMPRA', 'COTIZACION', 'SERVICIO', 'REPARACION', 'GENERIC']),
  subject: z.string().min(1, 'Asunto requerido').max(200),
  firstMessage: z.string().max(2000).optional()
})

export const SendMessageSchema = z.object({
  text: z.string().min(1, 'Mensaje requerido').max(2000).optional(),
  imageUrl: z.string().url().optional(),
  imageCaption: z.string().max(500).optional()
}).refine(data => data.text || data.imageUrl, {
  message: 'Se requiere texto o imagen'
})

export const MarkReadSchema = z.object({
  conversationId: z.string()
})

export const AssignConversationSchema = z.object({
  conversationId: z.string(),
  adminId: z.string()
})

export type CreateConversationPayload = z.infer<typeof CreateConversationSchema>
export type SendMessagePayload = z.infer<typeof SendMessageSchema>
export type MarkReadPayload = z.infer<typeof MarkReadSchema>
export type AssignConversationPayload = z.infer<typeof AssignConversationSchema>