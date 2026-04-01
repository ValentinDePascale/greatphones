// =========== UTILS ===========
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}
function promptLocation(){var v=prompt('A que ciudad enviamos?',document.getElementById('locVal').textContent);if(v&&v.trim())document.getElementById('locVal').textContent=v.trim();}
function toggleFaq(btn){btn.closest('.faq-item').classList.toggle('open');}
function openLightbox(src){document.getElementById('lightboxImg').src=src;document.getElementById('lightbox').style.display='flex';}
function showGiftCard(){notAvailable();}
function buyGiftCard(monto){notAvailable();}
