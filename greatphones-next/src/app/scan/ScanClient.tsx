'use client'

import { useEffect, useRef, useState } from 'react'

declare const jsQR: ((data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts?: string }) => { data: string } | null) | undefined

export default function ScanClient() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'redirecting' | 'error'>('idle')
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number>(0)
  const jsqrLoaded = useRef(false)
  const scanningRef = useRef(false)

  useEffect(() => {
    if (typeof jsQR !== 'undefined') {
      jsqrLoaded.current = true
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
    script.onload = () => { jsqrLoaded.current = true }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  function pararCamara() {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function iniciarEscanner() {
    setStatus('requesting')
    setError('')

    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      }).catch(function() {
        return navigator.mediaDevices.getUserMedia({ video: true })
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) { pararCamara(); return }
      video.srcObject = stream
      await video.play()
      setStatus('scanning')
      scanningRef.current = true
      loopEscaneo()
    } catch (err: any) {
      if (!jsqrLoaded.current) {
        setError('El escáner no terminó de cargar. Verificá tu conexión a internet.')
      } else if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. En Chrome: tocá el candado 🔒 → "Permisos" → Cámara → "Permitir". En iOS: Ajustes → Privacidad → Cámara → activar.')
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró la cámara en este dispositivo.')
      } else {
        setError('Error al acceder a la cámara: ' + (err.message || 'desconocido'))
      }
      setStatus('error')
    }
  }

  function loopEscaneo() {
    if (!scanningRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) { frameRef.current = requestAnimationFrame(loopEscaneo); return }
    if (video.readyState < 2) { frameRef.current = requestAnimationFrame(loopEscaneo); return }

    const ctx = canvas.getContext('2d')
    if (!ctx) { frameRef.current = requestAnimationFrame(loopEscaneo); return }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    try {
      const code = jsQR!(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
      if (code?.data) {
        const match = code.data.trim().match(/\/inv\/([A-Za-z0-9-]+)/)
        if (match) {
          scanningRef.current = false
          pararCamara()
          setStatus('redirecting')
          window.location.href = '/inv/' + match[1]
          return
        }
      }
    } catch {}

    frameRef.current = requestAnimationFrame(loopEscaneo)
  }

  return (
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
          background: rgba(255,255,255,.15);
          color: #fff;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          pointer-events: auto;
          backdrop-filter: blur(8px);
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

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          display: status === 'scanning' ? 'block' : 'none',
        }}
      />

      {status === 'scanning' && (
        <>
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', fontSize: 20,
            textDecoration: 'none', transition: 'background .2s',
          }} onClick={() => { pararCamara(); setStatus('idle') }}>
            ←
          </div>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{ position: 'relative', width: 260, height: 260 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                border: '2px solid rgba(255,107,44,.7)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,.55)',
              }} />
              <div className="linea-scanner" />
            </div>
            <div style={{ color: '#fff', fontSize: 14, marginTop: 28, textAlign: 'center', opacity: .85 }}>
              Apuntá al código QR del dispositivo
            </div>
            <button className="btn-secundario" onClick={() => { pararCamara(); setStatus('idle') }} style={{ marginTop: 40, pointerEvents: 'auto' }}>
              Cancelar
            </button>
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
          <button className="btn-scanner" onClick={iniciarEscanner}>
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
            <button className="btn-scanner" onClick={iniciarEscanner}>
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
  )
}
