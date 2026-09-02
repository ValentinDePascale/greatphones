'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

type Status = 'idle' | 'requesting' | 'scanning' | 'redirecting' | 'error'
type Facing = 'environment' | 'user'

declare global {
  interface Window {
    Html5Qrcode?: any
    Html5QrcodeSupportedFormats?: Record<string, number>
  }
}

export default function ScanClient() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [facing, setFacing] = useState<Facing>('environment')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Ref espejo del estado para evitar closures obsoletos dentro de callbacks async
  const facingRef = useRef<Facing>('environment')

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  async function stopScanner() {
    const s = scannerRef.current
    if (s) {
      try { await s.stop() } catch { /* ignore */ }
      try { await s.clear() } catch { /* ignore */ }
      scannerRef.current = null
    }
  }

  // Arranca la cámara pidiendo explícitamente el facing deseado con "exact"
  // (el navegador resuelve cuál cámara física corresponde a trasera/frontal
  // según el hardware — no depende de enumerar dispositivos ni de sus labels,
  // que es lo que fallaba antes). Si el dispositivo no tiene esa cámara exacta
  // (p.ej. una notebook con una sola webcam), reintenta sin "exact".
  async function intentarStart(constraint: MediaTrackConstraints) {
    const scanner = new window.Html5Qrcode('qr-scanner-container', { verbose: false })
    scannerRef.current = scanner
    await scanner.start(
      constraint,
      {
        fps: 20,
        qrbox: 260,
        aspectRatio: 1.0,
      },
      (decodedText: string) => {
        const match = decodedText.trim().match(/\/inv\/([A-Za-z0-9-]+)/)
        if (match) {
          stopScanner()
          setStatus('redirecting')
          window.location.href = '/inv/' + match[1]
        }
      },
      () => { /* ignore per-frame errors */ }
    )

    // En algunos Android el <video> que crea html5-qrcode queda con un frame
    // negro congelado si no se fuerzan estos atributos y un play() explícito.
    // Si sigue en 0x0 después de eso, tratamos el intento como fallido para
    // que el caller (iniciarEscanner) pueda reintentar.
    const video = containerRef.current?.querySelector('video')
    if (video) {
      video.setAttribute('playsinline', 'true')
      video.setAttribute('autoplay', 'true')
      video.muted = true
      try { await video.play() } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 700))
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Cámara negra (videoWidth 0)')
      }
    }
  }

  async function iniciarEscanner(facingArg?: Facing) {
    setStatus('requesting')
    setError('')

    if (!window.Html5Qrcode || !window.Html5QrcodeSupportedFormats) {
      setError('El escáner no terminó de cargar. Verificá tu conexión a internet.')
      setStatus('error')
      return
    }

    if (!containerRef.current) return

    const targetFacing = facingArg ?? facingRef.current

    try {
      try {
        await intentarStart({ facingMode: { exact: targetFacing } })
      } catch {
        // El dispositivo no tiene una cámara exacta con ese facing (p.ej. una
        // sola webcam): reintentar sin "exact" para que el navegador use la
        // que tenga disponible.
        await stopScanner()
        await intentarStart({ facingMode: targetFacing })
      }
      setStatus('scanning')
      facingRef.current = targetFacing
      setFacing(targetFacing)
    } catch (err: any) {
      console.error('Error al iniciar el escaner QR:', err)
      if (err?.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. En Chrome: tocá el candado 🔒 → "Permisos" → Cámara → "Permitir". En iOS: Ajustes → Privacidad → Cámara → activar.')
      } else if (err?.name === 'NotFoundError') {
        setError('No se encontró la cámara en este dispositivo.')
      } else if (err?.name === 'NotReadableError') {
        setError('La cámara está siendo usada por otra aplicación o pestaña. Cerrala e intentá de nuevo.')
      } else if (err?.name === 'OverconstrainedError') {
        setError('El dispositivo no tiene una cámara compatible con lo solicitado.')
      } else if (
        typeof window !== 'undefined' &&
        window.isSecureContext === false
      ) {
        setError('El escáner requiere una conexión segura (HTTPS).')
      } else {
        const detail =
          typeof err === 'string'
            ? err
            : err?.message || (err ? JSON.stringify(err) : 'desconocido')
        setError('Error al acceder a la cámara: ' + detail)
      }
      setStatus('error')
    }
  }

  async function cambiarCamara() {
    await stopScanner()
    const next: Facing = facingRef.current === 'environment' ? 'user' : 'environment'
    await iniciarEscanner(next)
  }

  return (
    <>
      <Script
        src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
        strategy="afterInteractive"
      />

      <div style={{
        minHeight: '100dvh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .linea-scanner {
            position: absolute;
            left: 16px;
            right: 16px;
            height: 2px;
            background: #FF6B2C;
            box-shadow: 0 0 16px #FF6B2C, 0 0 32px rgba(255,107,44,.4);
            animation: moverLinea 2s ease-in-out infinite;
            border-radius: 2px;
          }
          @keyframes moverLinea {
            0% { top: 24px; }
            50% { top: calc(100% - 24px); }
            100% { top: 24px; }
          }
          .btn-scanner {
            padding: 16px 40px;
            background: linear-gradient(135deg, #FF6B2C 0%, #E55A1A 100%);
            color: #fff;
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all .2s;
            box-shadow: 0 6px 20px rgba(255,107,44,.35);
            display: inline-flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
          }
          .btn-scanner:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,107,44,.45); }
          .btn-scanner:active { transform: translateY(0); }
          .btn-scanner:disabled { opacity: .5; cursor: default; transform: none; }
          .btn-secundario {
            padding: 12px 28px;
            background: rgba(20,20,20,.75);
            color: #fff;
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            pointer-events: auto;
            transition: background .2s;
          }
          .btn-secundario:hover { background: rgba(255,255,255,.25); }
          .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin .6s linear infinite;
            display: inline-block;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <div
          id="qr-scanner-container"
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: status === 'scanning' || status === 'requesting' ? 'block' : 'none',
          }}
        />

        {status === 'scanning' && (
          <>
            <div style={{
              position: 'absolute', top: 16, left: 16, zIndex: 10,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,.65)',
              border: '1px solid rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 20,
              textDecoration: 'none', transition: 'background .2s',
            }} onClick={() => { stopScanner(); setStatus('idle') }}>
              ←
            </div>
            <div style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,.65)',
              border: '1px solid rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 18,
              transition: 'background .2s',
            }} onClick={cambiarCamara} title="Cambiar cámara">
              🔄
            </div>
            {/* Overlay armado con franjas solidas (en vez de un box-shadow con
                spread gigante) porque ese truco hace que algunos GPUs de
                Android fallen al componer la capa del <video> y la dejen negra. */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,.55)' }} />
              <div style={{ flex: '0 0 260px', display: 'flex' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,.55)' }} />
                <div style={{ position: 'relative', width: 260, height: 260, flex: '0 0 260px' }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 20,
                    border: '2px solid rgba(255,107,44,.7)',
                  }} />
                  <div className="linea-scanner" />
                </div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,.55)' }} />
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: '#fff', fontSize: 14, marginTop: 28, textAlign: 'center', opacity: .85 }}>
                  Apuntá al código QR del dispositivo
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 40, pointerEvents: 'auto', flexDirection: 'column', alignItems: 'center' }}>
                  <button className="btn-secundario" onClick={() => { stopScanner(); setStatus('idle') }}>
                    Cancelar
                  </button>
                  <button className="btn-secundario" onClick={cambiarCamara} style={{ fontSize: 13 }}>
                    🔄 Cambiar a cámara {facing === 'environment' ? 'frontal' : 'trasera'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {status === 'idle' && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2rem',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,.1)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 4 }}>
              Great Phones
            </div>
            <div style={{ fontSize: 48, margin: '16px 0 20px' }}>📷</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
              Escanear QR
            </h1>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.5 }}>
              Escaneá el código QR del dispositivo para abrir su ficha rápida
            </p>
            <button className="btn-scanner" onClick={() => iniciarEscanner()}>
              📷 Iniciar escáner
            </button>
            <a href="/" onClick={(e) => { e.preventDefault(); window.history.back() }} style={{
              display: 'block', marginTop: 20, fontSize: 13, color: '#888',
              textDecoration: 'none', fontWeight: 500, cursor: 'pointer',
            }}>
              ← Volver
            </a>
          </div>
        )}

        {status === 'requesting' && (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16 }}>Solicitando acceso a la cámara…</div>
          </div>
        )}

        {status === 'redirecting' && (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16 }}>QR detectado — redirigiendo…</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '2rem',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,.1)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
              Error de cámara
            </h2>
            <p style={{
              fontSize: 13, color: '#EF4444', marginBottom: 24, lineHeight: 1.5,
              padding: 12, background: 'rgba(239,68,68,.08)', borderRadius: 10,
            }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-scanner" onClick={() => iniciarEscanner()}>
                Reintentar
              </button>
              <button onClick={() => { setStatus('idle'); setError('') }} style={{
                padding: '12px 24px', background: '#EDE6DD', color: '#1A1A2E',
                border: '1px solid #E2DCD3', borderRadius: 12, fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}>
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
