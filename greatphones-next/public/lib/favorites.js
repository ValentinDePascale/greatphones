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
  renderAccGrid();
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
    grid.style.display='none';empty.style.display='block';
    empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">&#9825;</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Sin favoritos</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Agrega productos a favoritos haciendo click en el corazón.</p></div>';
    if(cnt)cnt.textContent='0 guardados';
  }else{
    grid.style.display='grid';empty.style.display='none';
    grid.style.gridTemplateColumns='repeat(auto-fill,minmax(180px,1fr))';
    grid.style.gap='12px';
    grid.innerHTML=allFavs.map(function(item){
      var isProd=!!item.price&&item.brand;
      var isAcc=!isProd||(item.category&&!item.condition);
      if(isAcc){
        var now=new Date();
        var isPromo=item.isOffer&&(!item.offerEnd||new Date(item.offerEnd)>now)&&(!item.offerStart||new Date(item.offerStart)<=now);
        var finalPrice=isPromo?Math.round(item.price-item.price*item.discount/100):item.price;
        var cuota=Math.round(finalPrice/12);
        var imgHtml=item.imageUrl?'<img src="'+item.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:36px">'+(item.ico||'\u{1F4E6}')+'</span>';
        var isFav=isFavorite(item.id);
        var clickHandlerAcc='openAccDetail(\''+item.id+'\')';
        var favStyleAcc=isFav?'background:#fff0ec;border-color:rgba(255,107,44,.35);color:var(--orange)':'';
        return '<div class="pcard" onclick="'+clickHandlerAcc+'" style="position:relative">'+
          '<div class="pcard-img" style="position:relative">'+imgHtml+
          (isPromo?'<span style="position:absolute;top:8px;left:8px;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;z-index:3;line-height:1">-'+item.discount+'%</span>':'')+
          '</div>'+
          '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+item.id+'\')" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;z-index:2;'+favStyleAcc+'">'+(isFav?'\u2665':'\u2661')+'</button>'+
          '<div class="pcard-body">'+
          '<div class="pcard-name">'+item.name+'</div>'+
          '<div class="pcard-sub">'+(item.brand||item.category||'')+'</div>'+
          '<div style="display:flex;flex-direction:column;gap:2px"><span class="pcard-price">'+fmt(finalPrice)+'</span>'+(isPromo?'<span class="pcard-old" style="font-size:12px">'+fmt(item.price)+'</span>':'')+'</div>'+
          '<div class="pcard-cuota">12x '+fmt(cuota)+' sin interes</div>'+
          '</div>'+
          '<button class="pcard-add" onclick="event.stopPropagation();addToCartAcc(\''+item.id+'\')" style="margin-top:auto">+ Agregar al carrito</button>'+
          '</div>';
      }else{
        var now2=new Date();
        var isPromo2=item.isOffer&&(!item.offerEnd||new Date(item.offerEnd)>now2)&&(!item.offerStart||new Date(item.offerStart)<=now2);
        var finalPrice2=isPromo2?Math.round(item.price-item.price*item.discount/100):item.price;
        var cuota2=Math.round(finalPrice2/12);
        var imgHtml2=item.imageUrl?'<img src="'+item.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:36px">\u{1F4F1}</span>';
        var isFav2=isFavorite(item.id);
        var isOutOfStock=item.stock===0;
        var clickHandler=isOutOfStock?'':'openDetail(\''+item.id+'\')';
        var opacityStyle=isOutOfStock?' style="opacity:.6"':'';
        var favStyle2=isFav2?'background:#fff0ec;border-color:rgba(255,107,44,.35);color:var(--orange)':'';
        return '<div class="pcard'+(isOutOfStock?' ocard-out':'')+'" onclick="'+clickHandler+'"'+opacityStyle+'>'+
          '<div class="pcard-img" style="position:relative">'+imgHtml2+
          (isPromo2?'<span style="position:absolute;top:8px;left:8px;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;z-index:3;line-height:1">-'+item.discount+'%</span>':'')+
          (isOutOfStock?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="font-size:14px;font-weight:700;color:#fff;background:var(--red);padding:4px 12px;border-radius:6px">Agotado</span></div>':'')+
          '</div>'+
          '<button class="pcard-fav '+(isFav2?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+item.id+'\')" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;z-index:2;'+favStyle2+'">'+(isFav2?'\u2665':'\u2661')+'</button>'+
          '<div class="pcard-body">'+
          '<div class="pcard-name">'+item.name+'</div>'+
          '<div class="pcard-sub">'+item.sub+'</div>'+
          '<div style="display:flex;flex-direction:column;gap:2px"><span class="pcard-price">'+fmt(finalPrice2)+'</span>'+(isPromo2?'<span class="pcard-old" style="font-size:12px">'+fmt(item.price)+'</span>':'')+'</div>'+
          '<div class="pcard-cuota">12x '+fmt(cuota2)+' sin interes</div>'+
          '</div>'+
          (isOutOfStock?'':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+item.id+'\')" style="margin-top:auto">+ Agregar al carrito</button>')+
          '</div>';
      }
    }).join('');
    if(cnt)cnt.textContent=allFavs.length+' guardados';
  }
}
