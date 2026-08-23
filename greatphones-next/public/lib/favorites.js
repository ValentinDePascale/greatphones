var favorites=[];
function getFavKey(){
  return currentUser?'fav_'+currentUser.id:'favorites';
}
function initFavorites(){
  try{
    var stored=Storage.get(getFavKey());
    if(stored)favorites=stored;
  }catch(e){favorites=[];}
  updFavBadge();
}
function saveFavorites(){
  try{Storage.set(getFavKey(),favorites);}catch(e){}
}
function loadUserFavorites(){
  if(currentUser){
    cachedFetch(API_URL+'/api/favorites?userId='+currentUser.id,null,15000)
      .then(function(data){
        if(Array.isArray(data)){
          favorites=data.map(function(p){return p.id;});
          saveFavorites();
          updFavBadge();
          renderHomeRail();renderShopGrid();renderOfertasGrid();renderFeaturedGrid();renderAccGrid();
        }
      })
      .catch(function(){
        var stored=Storage.get(getFavKey());
        favorites=stored||[];
        updFavBadge();
      });
  }else{
    try{
      var stored=Storage.get(getFavKey());
      favorites=stored||[];
    }catch(e){favorites=[];}
    updFavBadge();
  }
}
function syncFavToAPI(productId,isFav){
  if(!currentUser)return;
  var method=isFav?'POST':'DELETE';
  fetch(API_URL+'/api/favorites',{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:currentUser.id,productId:productId})
  }).catch(function(){
    var idx=favorites.indexOf(productId);
    if(isFav&&idx===-1)favorites.push(productId);
    else if(!isFav&&idx!==-1)favorites.splice(idx,1);
    saveFavorites();
    updFavBadge();
  });
}
function updFavBadge(){
  var n=favorites.length;
  var b=document.getElementById('favBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function toggleDetFav(){
  // En preventa, _selectedVariant es una variante real (con su propio id).
  // Guardamos el favorito de ESA variante, no del producto base.
  var targetId=window._selectedVariant&&window._selectedVariant.productId
    ?window._selectedVariant.productId
    :(window._selectedVariant&&window._selectedVariant.id&&window._isPreorderDetail
      ?window._selectedVariant.id
      :(currentProd?currentProd.id:(currentAcc?currentAcc.id:null)));
  if(!targetId)return;
  var idx=favorites.indexOf(targetId);
  var fb=document.getElementById('detFavBtn');
  var isNowFav=idx===-1;
  if(isNowFav){
    favorites.push(targetId);
    if(fb){fb.innerHTML='\u2665';fb.classList.add('saved');fb.classList.remove('anim');fb.offsetHeight;fb.classList.add('anim');}
  }else{
    favorites.splice(idx,1);
    if(fb){fb.innerHTML='\u2661';fb.classList.remove('saved','anim');}
  }
  saveFavorites();
  updFavBadge();
  syncFavToAPI(targetId,isNowFav);
  updateFavHearts(targetId,isNowFav);
  if(document.getElementById('p-favoritos')&&document.getElementById('p-favoritos').classList.contains('act'))renderFavGrid();
}
function isFavorite(id){
  return favorites.indexOf(id)!==-1;
}
function toggleFavFromCard(id){
  var idx=favorites.indexOf(id);
  var isNowFav=idx===-1;
  if(isNowFav){favorites.push(id);}else{favorites.splice(idx,1);}
  saveFavorites();updFavBadge();
  syncFavToAPI(id,isNowFav);
  updateFavHearts(id,isNowFav);
  if(document.getElementById('p-favoritos')&&document.getElementById('p-favoritos').classList.contains('act'))renderFavGrid();
}

function favHeartSvg(isFav){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="'+(isFav?'var(--red)':'none')+'" stroke="'+(isFav?'var(--red)':'currentColor')+'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
}
function updateFavHearts(id,isNowFav){
  var btns=document.querySelectorAll('.pcard-fav');
  for(var i=0;i<btns.length;i++){
    var btn=btns[i];
    var onclickAttr=btn.getAttribute('onclick');
    if(onclickAttr&&onclickAttr.indexOf("'"+id+"'")!==-1){
      btn.classList.toggle('on',isNowFav);
      btn.innerHTML=favHeartSvg(isNowFav);
      if(isNowFav){btn.style.animation='none';btn.offsetHeight;btn.style.animation='favPop 0.3s ease';}
      else{btn.style.animation='';}
    }
  }
}
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  var favProducts=PRODUCTS.filter(function(p){return favorites.indexOf(p.id)!==-1;});
  var favAccs=(window.ACCS||[]).filter(function(a){return favorites.indexOf(a.id)!==-1;});
  var allFavs=favProducts.concat(favAccs);
  if(allFavs.length===0){
    grid.style.display='none';empty.style.display='block';
    var trending=PRODUCTS.filter(function(p){return p.stock>0&&p.sold>0;}).sort(function(a,b){return b.sold-a.sold;}).slice(0,4);
    var trendHtml=trending.map(function(p){
      var base=typeof displayBasePrice==='function'?displayBasePrice(p):p.price;
      var fp=(typeof isOfferValid==='function'&&isOfferValid(p))?Math.round(base-base*p.discount/100):base;
      return '<div style="display:flex;gap:10px;align-items:center;padding:10px;background:var(--cream2);border-radius:12px;cursor:pointer" onclick="openDetail(\''+p.id+'\')">'+
        '<div style="width:44px;height:44px;background:#fff;border-radius:8px;overflow:hidden;flex-shrink:0">'+(p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:20px">'+(p.ico||'📱')+'</span>')+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div><div style="font-size:11px;color:var(--orange);font-weight:700">'+fmt(fp)+'</div></div>'+
        '</div>';
    }).join('');
    empty.innerHTML='<div style="text-align:center;padding:3rem 1rem">'+
      '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom:1rem;opacity:.3"><path d="M32 56S8 40 8 24a12 12 0 0120-8.5A12 12 0 0148 24c0 16-16 32-16 32z" stroke="currentColor" stroke-width="2"/></svg>'+
      '<p style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:700;color:var(--dk);margin-bottom:.5rem">Aun no tenes favoritos</p>'+
      '<p style="font-size:13px;color:var(--gray);line-height:1.6;margin-bottom:1.5rem">Toca el corazon ♡ en cualquier producto para guardarlo aqui y encontrarlo facilmente despues.</p>'+
      '<button class="btn btn-o" style="margin-bottom:1.5rem" onclick="nav(\'shop\')">Explorar catalogo</button>'+
      (trending.length?'<div style="text-align:left;margin-top:1rem"><p style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem">Productos que te pueden interesar</p><div style="display:grid;gap:8px">'+trendHtml+'</div></div>':'')+
      '</div>';
    if(cnt)cnt.textContent='0 guardados';
  }else{
    grid.style.display='grid';empty.style.display='none';
    // Delegamos a renderGrid para que las cards (incluidas preventas) luzcan
    // igual que en el catálogo: badge, batería, marca APPLE, "Disponible", Reservar.
    if(typeof renderGrid==='function'){
      renderGrid('favGrid', allFavs);
    }else{
      grid.style.display='none';
    }
    if(cnt)cnt.textContent=allFavs.length+' guardados';
  }
  if(window.GPAnim&&window.GPAnim.refresh)window.GPAnim.refresh();
}
