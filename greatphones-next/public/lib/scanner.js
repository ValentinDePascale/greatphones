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
      '<div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,.6);padding:10px 16px;border-radius:10px;backdrop-filter:blur(8px);font-family:system-ui;max-width:90vw;text-align:center;z-index:2">' +
        '<div id="gp-scanner-status">' + hintFor(mode) + '</div>' +
      '</div>' +
      '<button id="gp-scanner-cancel" style="position:absolute;bottom:48px;left:50%;transform:translateX(-50%);padding:12px 28px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);font-family:system-ui;z-index:2">Cancelar</button>';
    document.body.appendChild(overlay);
    return overlay;
  }

  async function ensureBackCameraId() {
    // Preflight: pedir permiso y dejar que el browser abra la trasera una vez.
    // Se cierra al instante; sirve para que enumerateDevices devuelva labels
    // y deviceIds sin mostrar la frontal al usuario.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      stream.getTracks().forEach(t => t.stop())
    } catch (e) { console.warn('[gp-scanner] preflight env failed', e) }
    try {
      const cams = await navigator.mediaDevices.enumerateDevices()
      const video = cams.filter(d => d.kind === 'videoinput')
      if (!video.length) return null
      if (video.length === 1) return video[0].deviceId
      const labeled = video.filter(d => d.label)
      const back = labeled.find(d => /back|rear|environment/i.test(d.label))
      if (back) return back.deviceId
      const front = labeled.find(d => /front|user|selfie/i.test(d.label))
      if (front) {
        const other = video.find(d => d.deviceId !== front.deviceId)
        if (other) return other.deviceId
      }
      // En Android el último suele ser la trasera
      return video[video.length - 1].deviceId
    } catch (e) { console.warn('[gp-scanner] enumerateDevices failed', e) }
    return null
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

    const scanner = new window.Html5Qrcode('gp-scanner-reader', {
      formatsToSupport: formats,
      verbose: false,
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

    const buildCfg = (withFacing) => ({
      fps: isBarcode ? 20 : 15,
      qrbox: qrboxFn,
      disableFlip: false,
      ...(withFacing ? {
        videoConstraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      } : {}),
    })

    try {
      const camId = await ensureBackCameraId()
      if (camId) {
        try {
          await tryStart(camId, buildCfg(false))
        } catch (e) {
          console.warn('[gp-scanner] deviceId start failed, facingMode env', e)
          try { await scanner.stop().catch(()=>{}) } catch {}
          try { await scanner.clear().catch(()=>{}) } catch {}
          await tryStart({ facingMode: 'environment' }, buildCfg(true))
        }
      } else {
        await tryStart({ facingMode: 'environment' }, buildCfg(true))
      }
      return { stop }
    } catch (err) {
      const msg = (err && (err.message || err.name)) || String(err)
      if (statusEl) statusEl.textContent = '⚠️ ' + msg
      console.error('[gp-scanner] start error:', err)
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
