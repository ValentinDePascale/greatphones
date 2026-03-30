// =========== UTILS ===========
function fmt(n){return '$'+Math.round(n).toLocaleString('es-AR');}
function hasFav(id){for(var i=0;i<favorites.length;i++){if(favorites[i]===id)return true;}return false;}
function toggleFavById(id){if(hasFav(id)){favorites=favorites.filter(function(x){return x!==id;});}else{favorites.push(id);}updFavBadge();}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}
function promptLocation(){var v=prompt('A que ciudad enviamos?',document.getElementById('locVal').textContent);if(v&&v.trim())document.getElementById('locVal').textContent=v.trim();}
function toggleFaq(btn){btn.closest('.faq-item').classList.toggle('open');}
function selCoOpt(el){document.querySelectorAll('#retiroPanel .coopt').forEach(function(b){b.classList.remove('act');});el.classList.add('act');}
function selPlan(el){document.querySelectorAll('.plan-card').forEach(function(c){c.classList.remove('feat');});el.classList.add('feat');}
function openLightbox(src){document.getElementById('lightboxImg').src=src;document.getElementById('lightbox').style.display='flex';}
function getById(arr,id){for(var i=0;i<arr.length;i++){if(arr[i].id===id)return arr[i];}return null;}
