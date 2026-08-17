// =========== UTILS ===========
var IMG_MAX_SIZE = 5 * 1024 * 1024
var IMG_MAX_DIM = 2000

function validateImageFile(file, cb) {
  if (!file.type.startsWith('image/')) {
    if (typeof showErrorToast === 'function') showErrorToast('Error', 'Solo se permiten imágenes')
    else alert('Solo se permiten imágenes')
    if (cb) cb(false)
    return false
  }
  if (file.size > IMG_MAX_SIZE) {
    if (typeof showErrorToast === 'function') showErrorToast('Error', 'La imagen es muy grande. Máximo 5MB')
    else alert('La imagen es muy grande. Máximo 5MB')
    if (cb) cb(false)
    return false
  }
  var img = new Image()
  var url = URL.createObjectURL(file)
  img.onload = function() {
    URL.revokeObjectURL(url)
    if (img.width > IMG_MAX_DIM || img.height > IMG_MAX_DIM) {
      if (typeof showErrorToast === 'function') showErrorToast('Error', 'La imagen es demasiado grande. Máximo ' + IMG_MAX_DIM + 'x' + IMG_MAX_DIM + 'px')
      else alert('La imagen es demasiado grande. Máximo ' + IMG_MAX_DIM + 'x' + IMG_MAX_DIM + 'px')
      if (cb) cb(false)
      return
    }
    if (cb) cb(true)
  }
  img.onerror = function() {
    URL.revokeObjectURL(url)
    if (typeof showErrorToast === 'function') showErrorToast('Error', 'No se pudo leer la imagen')
    if (cb) cb(false)
  }
  img.src = url
  return true
}

function escapeHtml(text){
  var div=document.createElement('div');
  div.textContent=text;
  return div.innerHTML;
}
function esc(text){return escapeHtml(text);}
function jsStr(text){return String(text==null?'':text).replace(/\\/g,'\\\\').replace(/'/g,"\\x27").replace(/"/g,"\\x22");}
function getById(arr,id){for(var i=0;i<arr.length;i++){if(arr[i].id==id)return arr[i];if(String(arr[i].id)===String(id))return arr[i];}return null;}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}
function promptLocation(){var v=prompt('A que ciudad enviamos?',document.getElementById('locVal').textContent);if(v&&v.trim())document.getElementById('locVal').textContent=v.trim();}
function toggleFaq(btn){var card=btn.closest('.faq-item')||btn.closest('.faq-card');if(card)card.classList.toggle('open');}
function openLightbox(src){document.getElementById('lightboxImg').src=src;document.getElementById('lightbox').style.display='flex';}
function handleImageZoom(e,container){
  var rect=container.getBoundingClientRect();
  var x=((e.clientX-rect.left)/rect.width)*100;
  var y=((e.clientY-rect.top)/rect.height)*100;
  var img=container.querySelector('img');
  if(img){img.style.transformOrigin=x+'% '+y+'%';img.style.transform='scale(1.8)';}
}
function resetImageZoom(container){
  var img=container.querySelector('img');
  if(img){img.style.transform='scale(1)';}
}


// =========== DRAG TO SCROLL (CAROUSEL) ===========
var _dragState={isDown:false,startX:0,scrollLeft:0};
function startDrag(e,el){
  _dragState.isDown=true;
  el.classList.add('dragging');
  _dragState.startX=e.pageX||e.touches[0].pageX;
  _dragState.scrollLeft=el.scrollLeft;
}
function doDrag(e,el){
  if(!_dragState.isDown)return;
  e.preventDefault();
  var x=e.pageX||e.touches[0].pageX;
  var walk=(x-_dragState.startX)*1.5;
  el.scrollLeft=_dragState.scrollLeft-walk;
}
function endDrag(){
  _dragState.isDown=false;
  document.querySelectorAll('.carousel.dragging').forEach(function(el){el.classList.remove('dragging');});
}

// =========== PUBLIC CONFIRM / TOAST HELPERS ===========
// En las páginas públicas admin-ui.js no se carga (se elimina en spa-pages.ts),
// así que estos helpers viven acá. Si admin-ui.js carga después (panel admin),
// sus versiones (con modal/toast del admin) reemplazan a estas.
(function(){
  function showPublicModal(title, message, options) {
    return new Promise(function(resolve){
      var opts = options || {};
      var existing = document.getElementById('pubConfirmModal');
      if (existing) existing.remove();
      var overlay = document.createElement('div');
      overlay.id = 'pubConfirmModal';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center';
      var confirmText = opts.confirmText || 'Confirmar';
      var cancelText = opts.cancelText || 'Cancelar';
      var danger = opts.confirmClass === 'danger';
      overlay.innerHTML =
        '<div style="position:absolute;inset:0;background:rgba(0,0,0,.5)" onclick="document.getElementById(\'pubConfirmModal\').remove()"></div>' +
        '<div style="position:relative;background:#fff;border-radius:18px;width:min(400px,92vw);padding:1.5rem;box-shadow:0 20px 60px rgba(0,0,0,.3);z-index:1">' +
          '<div style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--dk);margin-bottom:8px">' + (title || 'Confirmar') + '</div>' +
          '<p style="font-size:13px;color:var(--gray);margin-bottom:1.25rem;line-height:1.5">' + (message || '') + '</p>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end">' +
            '<button class="m-btn-cancel" style="padding:11px 18px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">' + cancelText + '</button>' +
            '<button class="m-btn-ok" style="padding:11px 18px;border:none;border-radius:10px;background:' + (danger ? 'var(--red)' : 'var(--orange)') + ';color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">' + confirmText + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      var okBtn = overlay.querySelector('.m-btn-ok');
      var cancelBtn = overlay.querySelector('.m-btn-cancel');
      function done(val) {
        if (overlay.parentNode) overlay.remove();
        resolve(val);
      }
      okBtn.onclick = function(){ done(true); };
      cancelBtn.onclick = function(){ done(false); };
      setTimeout(function(){ if (okBtn) okBtn.focus(); }, 50);
    });
  }
  // Solo definir si aún no existen (admin-ui.js puede definirlas después).
  if (typeof window.showConfirm !== 'function') {
    window.showConfirm = function(title, message, options) { return showPublicModal(title, message, options); };
  }
  if (typeof window.showSuccessToast !== 'function') {
    window.showSuccessToast = function(title, message) {
      if (typeof showToast === 'function') showToast({ title: title, message: message, type: 'success' });
      else alert(title + '\n' + message);
    };
  }
  if (typeof window.showErrorToast !== 'function') {
    window.showErrorToast = function(title, message) {
      if (typeof showToast === 'function') showToast({ title: title, message: message, type: 'error' });
      else alert(title + '\n' + message);
    };
  }
  if (typeof window.showWarningToast !== 'function') {
    window.showWarningToast = function(title, message) {
      if (typeof showToast === 'function') showToast({ title: title, message: message, type: 'warning' });
      else alert(title + '\n' + message);
    };
  }
  if (typeof window.showInfoToast !== 'function') {
    window.showInfoToast = function(title, message) {
      if (typeof showToast === 'function') showToast({ title: title, message: message, type: 'info' });
      else alert(title + '\n' + message);
    };
  }
})();
