(() => {
  'use strict';

  const FORMAT_KEYS = {
    CODE_128: 'CODE_128',
    CODE_39: 'CODE_39',
    CODE_93: 'CODE_93',
    ITF: 'ITF',
    CODABAR: 'CODABAR',
    EAN_13: 'EAN_13',
    EAN_8: 'EAN_8',
    UPC_A: 'UPC_A',
    UPC_E: 'UPC_E',
    QR_CODE: 'QR_CODE',
  };
  const ALL_1D = ['CODE_128', 'CODE_39', 'CODE_93', 'ITF', 'CODABAR', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E'];
  const ALL_QR = ['QR_CODE'];

  function luhnValido(s) {
    let sum = 0;
    let alt = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let v = parseInt(s[i], 10);
      if (alt) { v *= 2; if (v > 9) v -= 9; }
      sum += v;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function classify(decoded) {
    const digits = decoded.replace(/\D/g, '');
    if (digits.length === 15 && luhnValido(digits)) {
      return { type: 'imei', value: digits };
    }
    if (digits.length === 14) {
      for (let cd = 0; cd <= 9; cd++) {
        const cand = digits + String(cd);
        if (luhnValido(cand)) return { type: 'imei', value: cand };
      }
    }
    const m = decoded.trim().match(/^\/inv\/([A-Za-z0-9-]+)$/);
    if (m) return { type: 'code', value: m[1] };
    return { type: 'text', value: decoded };
  }

  function resolveFormats(mode) {
    const HF = window.Html5QrcodeSupportedFormats || {};
    const list = [];
    if (mode === 'barcode' || mode === 'both') {
      for (const k of ALL_1D) {
        if (HF[FORMAT_KEYS[k]] !== undefined) list.push(HF[FORMAT_KEYS[k]]);
      }
    }
    if (mode === 'qr' || mode === 'both') {
      if (HF[FORMAT_KEYS.QR_CODE] !== undefined) list.push(HF[FORMAT_KEYS.QR_CODE]);
    }
    return list;
  }

  function hintFor(mode) {
    if (mode === 'barcode') return 'Apuntá al código de barras del dispositivo';
    if (mode === 'qr') return 'Apuntá al código QR del dispositivo';
    return 'Apuntá al código QR o de barras';
  }

  function createOverlay(mode) {
    const overlay = document.createElement('div');
    overlay.id = 'gp-scanner-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden';
    overlay.innerHTML =
      '<div id="gp-scanner-reader" style="position:absolute;inset:0;width:100%;height:100%;background:#000"></div>' +
      '<div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,.7);padding:10px 16px;border-radius:10px;font-family:system-ui;max-width:90vw;text-align:center;z-index:2">' +
        '<div id="gp-scanner-status">' + hintFor(mode) + '</div>' +
      '</div>' +
      '<button id="gp-scanner-switch" title="Cambiar cámara" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:18px;cursor:pointer;z-index:2">🔄</button>' +
      '<button id="gp-scanner-cancel" style="position:absolute;bottom:48px;left:50%;transform:translateX(-50%);padding:12px 28px;background:rgba(20,20,20,.75);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:system-ui;z-index:2">Cancelar</button>';
    document.body.appendChild(overlay);
    return overlay;
  }

  async function openScanner(opts) {
    opts = opts || {};
    const onDetected = opts.onDetected;
    const mode = opts.mode === 'barcode' ? 'barcode'
              : opts.mode === 'qr' ? 'qr'
              : 'both';

    if (!window.Html5Qrcode) {
      throw new Error('html5-qrcode no está cargado. Verificá tu conexión e intentá de nuevo.');
    }
    if (!window.Html5QrcodeSupportedFormats) {
      throw new Error('Tu navegador no soporta los formatos requeridos para el escáner.');
    }

    const formats = resolveFormats(mode);
    const overlay = createOverlay(mode);
    const statusEl = document.getElementById('gp-scanner-status');
    const cancelBtn = document.getElementById('gp-scanner-cancel');
    const switchBtn = document.getElementById('gp-scanner-switch');

    const scanner = new window.Html5Qrcode('gp-scanner-reader', {
      formatsToSupport: formats,
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });

    let stopped = false;
    const stop = async () => {
      if (stopped) return;
      stopped = true;
      try { await scanner.stop(); } catch (e) { }
      try { await scanner.clear(); } catch (e) { }
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    cancelBtn.onclick = stop;

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      const isHttpLan = /^192\.168\.\d+\.\d+$/.test(location.hostname) || /^10\.\d+\.\d+\.\d+$/.test(location.hostname)
      if (isHttpLan || location.protocol === 'http:') {
        throw new Error('La cámara requiere HTTPS. Abrí la app por el túnel https (ngrok / trycloudflare) o por https://greatphones.onrender.com — http en LAN no permite cámara en el celu.')
      }
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu navegador no soporta cámara (mediaDevices no disponible). Usa Chrome actualizado por https.')
    }

    const isBarcode = mode === 'barcode'
    let currentFacing = 'environment'
    const qrboxFn = (vw, vh) => {
      if (isBarcode) {
        // Scanline ancha y no muy alta para códigos de barras 1D
        return { width: Math.max(240, vw - 32), height: Math.min(190, Math.round(vh * 0.4)) }
      }
      const min = Math.min(vw, vh)
      return { width: Math.max(200, min - 32), height: Math.max(200, min - 32) }
    }
    const tryStart = async (camConfig, cfg) => {
      await scanner.start(camConfig, cfg,
        (decodedText) => {
          if (stopped) return
          const result = classify(decodedText)
          if (statusEl) statusEl.textContent = '✓ Detectado — procesando…'
          const finish = () => {
            if (typeof onDetected === 'function') {
              try { onDetected({ type: result.type, value: result.value, raw: decodedText }) } catch (e) { console.error('[gp-scanner] onDetected error:', e) }
            }
          }
          stop().then(finish)
        },
        () => {}
      )
      const v = overlay.querySelector('video')
      if (v) {
        v.style.objectFit = 'cover'
        v.style.width = '100%'
        v.style.height = '100%'
        v.setAttribute('playsinline', 'true')
        v.setAttribute('autoplay', 'true')
        v.muted = true
        try { await v.play() } catch (e) {}
        await new Promise(r => setTimeout(r, 700))
        if (v.videoWidth === 0 || v.videoHeight === 0) throw new Error('Cámara negra (videoWidth 0)')
      }
      if (statusEl) statusEl.textContent = hintFor(mode) + (isBarcode ? ' — acercá hasta que ocupe todo el ancho del rectángulo' : ' — enfocá el código')
    }

    const buildCfg = (facing) => ({
      fps: isBarcode ? 20 : 15,
      qrbox: qrboxFn,
      disableFlip: false,
      videoConstraints: {
        facingMode: facing,
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
      },
    })

    // Pide explícitamente el facing deseado con "exact" (el navegador resuelve
    // qué cámara física corresponde a trasera/frontal según el hardware). Si
    // el dispositivo no tiene esa cámara exacta, reintenta sin "exact".
    const startFacing = async (facing) => {
      try {
        await tryStart({ facingMode: { exact: facing } }, buildCfg({ exact: facing }))
      } catch (e) {
        try { await scanner.stop().catch(() => {}) } catch {}
        try { await scanner.clear().catch(() => {}) } catch {}
        await tryStart({ facingMode: facing }, buildCfg(facing))
      }
      currentFacing = facing
    }

    let switching = false
    const switchCamera = async () => {
      if (stopped || switching) return
      switching = true
      if (statusEl) statusEl.textContent = 'Cambiando de cámara…'
      try {
        try { await scanner.stop() } catch (e) {}
        try { await scanner.clear() } catch (e) {}
        const next = currentFacing === 'environment' ? 'user' : 'environment'
        await startFacing(next)
      } catch (e) {
        console.error('[gp-scanner] switchCamera falló', e)
        if (statusEl) statusEl.textContent = '⚠️ No se pudo cambiar de cámara'
      } finally {
        switching = false
      }
    }
    if (switchBtn) switchBtn.onclick = switchCamera

    try {
      await startFacing('environment')
      return { stop }
    } catch (err) {
      const msg = (err && (err.message || err.name)) || String(err)
      if (statusEl) statusEl.textContent = '⚠️ ' + msg
      console.error('[gp-scanner] start error final:', err)
      setTimeout(stop, 3500)
      throw err
    }
  }

  window.gpScanner = { open: openScanner };

  window.abrirScannerQR = function (opts) {
    opts = opts || {};
    const mode = opts.mode === 'barcode' ? 'barcode'
              : opts.mode === 'qr' ? 'qr'
              : 'both';
    return openScanner({ mode, onDetected: opts.onDetected }).catch((err) => {
      console.error('[abrirScannerQR]', err);
    });
  };
})();
