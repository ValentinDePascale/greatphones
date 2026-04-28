// =========== FAVORITES ===========
var favorites=[];
function getFavKey(){
  return currentUser?'gp_fav_'+currentUser.id:'gp_favorites';
}
function initFavorites(){
  try{
    var stored=localStorage.getItem(getFavKey());
    if(stored)favorites=JSON.parse(stored);
  }catch(e){favorites=[];}
  updFavBadge();
}
function saveFavorites(){
  try{localStorage.setItem(getFavKey(),JSON.stringify(favorites));}catch(e){}
}
function loadUserFavorites(){
  try{
    var stored=localStorage.getItem(getFavKey());
    favorites=stored?JSON.parse(stored):[];
  }catch(e){favorites=[];}
  updFavBadge();
}
function updFavBadge(){
  var n=favorites.length;
  var b=document.getElementById('favBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function toggleDetFav(){
  if(!currentProd)return;
  var idx=favorites.indexOf(currentProd.id);
  var fb=document.getElementById('detFavBtn');
  if(idx===-1){
    favorites.push(currentProd.id);
    if(fb){fb.innerHTML='♥';fb.style.color='var(--red)';fb.classList.add('saved');fb.style.animation='none';fb.offsetHeight;fb.style.animation='favPop 0.3s ease';}
  }else{
    favorites.splice(idx,1);
    if(fb){fb.innerHTML='♡';fb.style.color='var(--gray)';fb.classList.remove('saved');}
  }
  saveFavorites();
  updFavBadge();
  renderHomeRail();
  renderShopGrid();
  renderOfertasGrid();
  renderFeaturedGrid();
  if(document.getElementById('p-favoritos').classList.contains('act')){
    renderFavGrid();
  }
}
function isFavorite(id){
  return favorites.indexOf(id)!==-1;
}
function toggleFavFromCard(id,btn){
  var idx=favorites.indexOf(id);
  if(!btn)btn=event.currentTarget;
  if(idx===-1){
    favorites.push(id);
    if(btn){btn.classList.remove('anim');void btn.offsetWidth;btn.classList.add('anim');}
  }else{
    favorites.splice(idx,1);
    if(btn){btn.classList.remove('anim');}
  }
  saveFavorites();
  updFavBadge();
  renderHomeRail();
  renderShopGrid();
  renderOfertasGrid();
  renderFeaturedGrid();
  if(typeof renderAccGrid==='function')renderAccGrid();
  if(document.getElementById('p-favoritos').classList.contains('act')){
    renderFavGrid();
  }
}
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  var favProducts=PRODUCTS.filter(function(p){return favorites.indexOf(p.id)!==-1;});
  if(favProducts.length===0){
    empty.style.display='block';grid.style.display='none';
    empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">&#9825;</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Sin favoritos</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Agrega productos a favoritos haciendo click en el corazón.</p></div>';
    if(cnt)cnt.textContent='0 guardados';
  }else{
    empty.style.display='none';grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(auto-fill,minmax(220px,1fr))';
    grid.style.gap='20px';
    grid.style.maxWidth='1200px';
    grid.style.margin='0 auto';
    renderGrid('favGrid',favProducts);
    if(cnt)cnt.textContent=favProducts.length+' guardados';
  }
}
