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
  var item=currentProd||currentAcc;
  if(!item)return;
  var idx=favorites.indexOf(item.id);
  var fb=document.getElementById('detFavBtn');
  if(idx===-1){
    favorites.push(item.id);
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
  if(typeof renderAccGrid==='function')renderAccGrid();
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
  var favAccs=(window.ACCS||[]).filter(function(a){return favorites.indexOf(a.id)!==-1;});
  var allFavs=favProducts.concat(favAccs);
  if(allFavs.length===0){
    empty.style.display='block';grid.style.display='none';
    empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">\u2661</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Sin favoritos</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Agrega productos o accesorios a favoritos haciendo click en el coraz\u00F3n.</p></div>';
    if(cnt)cnt.textContent='0 guardados';
  }else{
    empty.style.display='none';grid.style.display='grid';
    grid.style.gridTemplateColumns='repeat(auto-fill,minmax(220px,1fr))';
    grid.style.gap='20px';
    grid.style.maxWidth='1200px';
    grid.style.margin='0 auto';
    var now=new Date();
    grid.innerHTML=allFavs.map(function(item){
      var isAcc=!item.sub&&item.category;
      var isPromoActive=item.isOffer&&(!item.offerEnd||new Date(item.offerEnd)>now)&&(!item.offerStart||new Date(item.offerStart)<=now);
      var finalPrice=isPromoActive?Math.round(item.price-item.price*item.discount/100):item.price;
      var isOutOfStock=item.stock===0;
      var imgHtml=item.imageUrl?'<img src="'+item.imageUrl+'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'">':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+(item.ico||'\uD83D\uDCF1')+'</span>';
      var badge;
      if(isOutOfStock){
        badge='<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>';
      }else if(isPromoActive){
        badge='<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">-'+item.discount+'% OFF</div>';
      }else if(item.condition==='Nuevo'){
        badge='<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">'+'\uD83D\uDD25 Nuevo</div>';
      }else if(item.condition&&item.condition!=='Nuevo'){
        badge='<div style="position:absolute;top:16px;left:16px;background:rgba(0,0,0,.8);color:#fff;font-size:10px;font-weight:600;padding:5px 12px;border-radius:16px;z-index:2">'+item.condition+'</div>';
      }else if(item.category){
        badge='<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">'+item.category+'</div>';
      }else{
        badge='';
      }
      var onclick=isOutOfStock?'':' onclick="'+(isAcc?'openAccDetail':'openDetail')+'(\''+item.id+'\')"';
      return '<article class="pcard'+(isOutOfStock?' pcard-out-of-stock':'')+'"'+onclick+' style="cursor:'+((isOutOfStock?'default':'pointer'))+'">'+
        '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
        badge+
        '<button class="pcard-fav on" onclick="event.stopPropagation();toggleFavFromCard(\''+item.id+'\')">\u2665</button>'+
        imgHtml+
        '</div>'+
        '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
        '<div>'+
        '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+(item.name||item.brand)+'</h3>'+
        '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+(item.sub||item.brand||item.description||'')+'</p>'+
        '</div>'+
        '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
        (isPromoActive?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--gray);text-decoration:line-through">'+fmt(item.price)+'</span><span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;background:var(--red);color:#fff">-'+item.discount+'%</span></div>':'')+
        '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
        '</div>'+
        (isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+item.id+'\')" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">'+'\uD83D\uDED2 Agregar al carrito</button>')+
        '</div>'+
        '</article>';
    }).join('');
    if(cnt)cnt.textContent=allFavs.length+' guardados';
  }
}
