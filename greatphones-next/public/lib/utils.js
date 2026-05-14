// =========== UTILS ===========
function getById(arr,id){for(var i=0;i<arr.length;i++){if(arr[i].id==id)return arr[i];if(String(arr[i].id)===String(id))return arr[i];}return null;}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}
function promptLocation(){var v=prompt('A que ciudad enviamos?',document.getElementById('locVal').textContent);if(v&&v.trim())document.getElementById('locVal').textContent=v.trim();}
function toggleFaq(btn){var card=btn.closest('.faq-item')||btn.closest('.faq-card');if(card)card.classList.toggle('open');}
function openLightbox(src){document.getElementById('lightboxImg').src=src;document.getElementById('lightbox').style.display='flex';}
function showGiftCard(){notAvailable();}
function buyGiftCard(monto){notAvailable();}

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
