import { NextResponse } from 'next/server'

interface ErrorLog {
  timestamp: string
  message: string
  stack?: string
  url: string
  userAgent: string
  isDev: boolean
  source: 'client' | 'server'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ErrorLog

    // Registrar el error en console
    console.error('[Client Error Log]', {
      type: 'CLIENT_ERROR',
      message: body.message,
      url: body.url,
      source: body.source,
      isDev: body.isDev,
      timestamp: body.timestamp,
      stack: body.stack,
    })

    // En producción, podrías enviar esto a un servicio de monitoreo
    // como Sentry, DataDog, Rollbar, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Enviar a servicio de monitoreo
      // await sendToMonitoringService(body)
    }

    return NextResponse.json({ status: 'logged' }, { status: 200 })
  } catch (error) {
    console.error('[Error Logging Error]', error)
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
