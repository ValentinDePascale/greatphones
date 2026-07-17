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
