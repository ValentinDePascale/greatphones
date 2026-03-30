// =========== FAVORITES ===========
function updFavBadge(){var n=favorites.length;var b=document.getElementById('favBadge');if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}}
function toggleDetFav(){
  if(!currentProd)return;
  toggleFavById(currentProd.id);
  var fb=document.getElementById('detFavBtn');
  var isFav=hasFav(currentProd.id);
  fb.innerHTML=isFav?'♥':'♡';
  fb.classList.toggle('saved',isFav);
}
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  var prods=PRODUCTS.filter(function(p){return hasFav(p.id);});
  if(!prods.length){grid.style.display='none';empty.style.display='block';if(cnt)cnt.textContent='0 guardados';return;}
  empty.style.display='none';grid.style.display='grid';
  if(cnt)cnt.textContent=prods.length+' guardado'+(prods.length!==1?'s':'');
  renderGrid('favGrid',prods);
}
