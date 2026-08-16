import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// Logger en modo JSON plano. Para salida bonita en desarrollo instalar
// pino-pretty aparte (`pnpm add -D pino-pretty`) y exportar LOG_PRETTY=true.
// NOTA: nunca referenciar 'pino-pretty' de forma estática para que el bundler
// no falle cuando la dep no está instalada.
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: ['password', 'email', 'dni', 'phone', 'token', 'secret'],
    censor: '[REDACTED]',
  },
})

export function createRequestLogger(requestId?: string) {
  const bindings: Record<string, unknown> = {}
  if (requestId) bindings.requestId = requestId
  return bindings.requestId ? logger.child(bindings) : logger
}
