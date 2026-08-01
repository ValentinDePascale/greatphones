import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }),
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
