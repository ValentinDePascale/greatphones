interface ErrorLog {
  timestamp: string
  message: string
  stack?: string
  url: string
  userAgent: string
  isDev: boolean
  source: 'client' | 'server'
}

class ErrorLogger {
  private queue: ErrorLog[] = []
  private isClient = typeof window !== 'undefined'

  log(error: Error | string, source: 'client' | 'server' = 'client') {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: this.isClient ? window.location.href : 'N/A',
      userAgent: this.isClient ? navigator.userAgent : 'N/A',
      isDev: process.env.NODE_ENV === 'development',
      source,
    }

    console.error('[ErrorLogger]', errorLog)
    this.queue.push(errorLog)

    // En producción, enviar a server
    if (process.env.NODE_ENV === 'production' && this.isClient) {
      this.sendToServer(errorLog).catch(err => console.error('Failed to send error log:', err))
    }

    // Mantener límite en memoria
    if (this.queue.length > 50) {
      this.queue.shift()
    }
  }

  private async sendToServer(errorLog: ErrorLog) {
    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      })
    } catch (err) {
      console.error('Failed to send error to server:', err)
    }
  }

  getLogs() {
    return this.queue
  }

  clear() {
    this.queue = []
  }
}

export const errorLogger = new ErrorLogger()
