// =========== FAVORITES ===========
var favorites=[];
function updFavBadge(){
  var n=favorites.length;
  var b=document.getElementById('favBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function toggleDetFav(){
  notAvailable();
}
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  empty.style.display='block';grid.style.display='none';
  empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">&#9825;</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Funcionalidad no disponible</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Conectate al backend para guardar favoritos.</p></div>';
}
