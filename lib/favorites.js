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
  var targetId=currentProd?currentProd.id:(currentAcc?currentAcc.id:null);
  if(!targetId)return;
  var idx=favorites.indexOf(targetId);
  var fb=document.getElementById('detFavBtn');
  if(idx===-1){
    favorites.push(targetId);
    if(fb){fb.innerHTML='\u2665';fb.style.color='var(--red)';fb.classList.add('saved');fb.style.animation='none';fb.offsetHeight;fb.style.animation='favPop 0.3s ease';}
  }else{
    favorites.splice(idx,1);
    if(fb){fb.innerHTML='\u2661';fb.style.color='var(--gray)';fb.classList.remove('saved');}
  }
  saveFavorites();
  updFavBadge();
  renderHomeRail();
  renderShopGrid();
  renderOfertasGrid();
  renderFeaturedGrid();
  renderAccGrid();
  if(document.getElementById('p-favoritos').classList.contains('act')){
    renderFavGrid();
  }
}
function isFavorite(id){
  return favorites.indexOf(id)!==-1;
}
function toggleFavFromCard(id){
  var idx=favorites.indexOf(id);
  if(idx===-1){
    favorites.push(id);
  }else{
    favorites.splice(idx,1);
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
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  var favProducts=PRODUCTS.filter(function(p){return favorites.indexOf(p.id)!==-1;});
  if(favProducts.length===0){
    empty.style.display='block';grid.style.display='none';
    empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">&#9825;</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Sin favoritos</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Agrega productos a favoritos haciendo click en el corazón.</p></div>';
    if(cnt)cnt.textContent='0 guardados';
  }else{
    empty.style.display='none';grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(auto-fill,minmax(180px,1fr))';
    grid.style.gap='12px';
    renderGrid('favGrid',favProducts);
    if(cnt)cnt.textContent=favProducts.length+' guardados';
  }
}
