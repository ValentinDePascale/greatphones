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
  var targetId=window._selectedVariant&&window._selectedVariant.productId?window._selectedVariant.productId:(currentProd?currentProd.id:(currentAcc?currentAcc.id:null));
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

function updateFavHearts(id,isNowFav){
  var btns=document.querySelectorAll('.pcard-fav');
  for(var i=0;i<btns.length;i++){
    var btn=btns[i];
    var onclickAttr=btn.getAttribute('onclick');
    if(onclickAttr&&onclickAttr.indexOf("'"+id+"'")!==-1){
      if(isNowFav){btn.classList.add('on');btn.innerHTML='\u2665';btn.style.animation='none';btn.offsetHeight;btn.style.animation='favPop 0.3s ease';}
      else{btn.classList.remove('on');btn.innerHTML='\u2661';}
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
      var fp=p.isOffer&&p.discount>0?Math.round(p.price-p.price*p.discount/100):p.price;
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
    grid.style.gridTemplateColumns='repeat(auto-fill,minmax(180px,1fr))';
    grid.style.gap='12px';
    grid.innerHTML=allFavs.map(function(item){
      var isProd=!!item.price&&item.brand;
      var isAcc=!isProd||(item.category&&!item.condition);
      if(isAcc){
        var isPromo=item.isOffer&&item.discount>0;
        var finalPrice=isPromo?Math.round(item.price-item.price*item.discount/100):item.price;
        var cuota=Math.round(finalPrice/12);
        var imgHtml=item.imageUrl?'<img src="'+item.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:36px">'+(item.ico||'\u{1F4E6}')+'</span>';
        var isFav=isFavorite(item.id);
        var favStyleAcc=isFav?'background:#fff0ec;border-color:rgba(255,107,44,.35);color:var(--orange)':'';
        return '<div class="pcard" onclick="openAccDetail(\''+item.id+'\')" style="position:relative">'+
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
        var isPromo2=item.isOffer&&item.discount>0;
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
