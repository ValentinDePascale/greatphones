// =========== RENDER ===========
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':'https://greatphones.onrender.com');
var PRODUCTS=[];
var currentProd=null;
var detWMult=0,detDExtra=0,selCuotas=1;

function fmt(n){return'$'+n.toLocaleString('es-AR');}
function getById(arr,id){for(var i=0;i<arr.length;i++)if(arr[i].id===id)return arr[i];return null;}

function loadProducts(){
  fetch(API_URL+'/api/products').then(function(r){return r.json();}).then(function(data){
    PRODUCTS=data;
    renderHomeRail();
    renderOfferStrip();
    renderShopGrid();
    renderOfertasGrid();
    renderFeaturedGrid();
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
  }).catch(function(){console.log('Error loading products');});
}

function loadAccessories(){
  fetch(API_URL+'/api/accessories').then(function(r){return r.json();}).then(function(data){
    window.ACCS=data;
    if(document.getElementById('accGrid'))renderAccGrid();
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
  }).catch(function(){console.log('Error loading accessories');});
}

function renderGrid(gid,prods){
  var grid=document.getElementById(gid);
  if(!grid)return;
  if(!prods.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray);font-size:12px">No hay productos.</div>';return;}
  var now=new Date();
  grid.innerHTML=prods.map(function(p){
    var isPromoActive=p.isOffer&&(!p.offerEnd||new Date(p.offerEnd)>now)&&(!p.offerStart||new Date(p.offerStart)<=now);
    var finalPrice=isPromoActive?Math.round(p.price-p.price*p.discount/100):p.price;
    var cuota=Math.round(finalPrice/12);
    var isOutOfStock=p.stock===0;
    var imgHtml=p.imageUrl?'<img src="'+p.imageUrl+'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'">':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+p.ico+'</span>';
    var badge=isOutOfStock?'<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>':(p.condition==='Nuevo'?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">🔥 Nuevo</div>':(p.condition&&p.condition!=='Nuevo'?'<div style="position:absolute;top:16px;left:16px;background:rgba(0,0,0,.8);color:#fff;font-size:10px;font-weight:600;padding:5px 12px;border-radius:16px;z-index:2">'+p.condition+'</div>':''));
    var isFav=isFavorite(p.id);
    return '<article class="pcard'+(isOutOfStock?' pcard-out-of-stock':'')+'"'+(isOutOfStock?'':' onclick="openDetail(\''+p.id+'\')"')+' style="cursor:'+((isOutOfStock?'default':'pointer'))+'">'+
      '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
      badge+
      '<div style="position:absolute;top:16px;right:16px;z-index:3">'+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.95);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;z-index:2;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:all .25s"'+(isFav?'background:#fff0ec;color:var(--orange)':'')+'>'+(isFav?'♥':'♡')+'</button>'+
      '</div>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+p.name+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+p.sub+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      (isPromoActive?'<div style="display:flex;align-items:center;gap:10px"><span class="pcard-old" style="font-size:14px;color:var(--gray);text-decoration:line-through">'+fmt(p.price)+'</span><span style="font-size:11px;font-weight:800;padding:4px 10px;border-radius:12px;background:var(--red);color:#fff">'+p.discount+'% OFF</span></div>':'')+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
      '<div class="pcard-cuota" style="font-size:13px;color:var(--green);font-weight:600">💳 12x '+fmt(cuota)+' sin interés</div>'+
      (p.stock<=5&&p.stock>0?'<div class="pcard-stock" style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--red);background:rgba(239,68,68,.1);padding:8px 12px;border-radius:10px;font-weight:600">🔥 Solo '+p.stock+' disponibles</div>':'')+
      '</div>'+
      (isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+p.id+'\')" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">🛒 Agregar al carrito</button>')+
      '</div>'+
      '</article>';
  }).join('');
}
function renderHomeRail(){
  var rail=document.getElementById('homeRail');
  if(!rail)return;
  var sorted=PRODUCTS.slice().sort(function(a,b){return b.sold-a.sold;});
  renderGrid('homeRail',sorted.slice(0,4));
}
function renderOfferStrip(){
  var strip=document.getElementById('offerStrip');
  if(!strip)return;
  var offers=PRODUCTS.filter(function(p){return p.isOffer;});
  strip.innerHTML=offers.map(function(p){
    var fp=Math.round(p.price-p.price*p.discount/100);
    return '<div class="ocard" onclick="openDetail(\''+p.id+'\')">'+
      '<div class="ocard-img"><span style="font-size:40px">'+p.ico+'</span><span class="ocard-disc">-'+p.discount+'%</span></div>'+
      '<div class="ocard-body"><div class="ocard-name">'+p.name+'</div><div class="ocard-old">'+fmt(p.price)+'</div><div class="ocard-price">'+fmt(fp)+'</div></div>'+
      '</div>';
  }).join('');
}
function renderShopGrid(){
  var grid=document.getElementById('shopGrid');
  var count=document.getElementById('shopCount');
  if(!grid)return;
  var prods=PRODUCTS.slice();
  if(!window.shopFilter)window.shopFilter='todos';
  if(window.shopFilter!=='todos')prods=prods.filter(function(p){return p.brand===window.shopFilter;});
  if(window.shopFilter==='fav'){
    prods=prods.filter(function(p){return favorites.indexOf(p.id)!==-1;});
  }
  if(filterState.conditions.length>0){
    prods=prods.filter(function(p){return filterState.conditions.indexOf(p.condition)!==-1||(p.condition==='Usado'&&filterState.conditions.indexOf('Usado')!==-1);});
  }
  if(filterState.storage.length>0){
    prods=prods.filter(function(p){return filterState.storage.some(function(s){return p.sub&&p.sub.indexOf(s)!==-1;});});
  }
  if(filterState.priceMin){
    prods=prods.filter(function(p){return p.price>=filterState.priceMin;});
  }
  if(filterState.priceMax){
    prods=prods.filter(function(p){return p.price<=filterState.priceMax;});
  }
  if(filterState.hideNoStock){
    prods=prods.filter(function(p){return p.stock>0;});
  }
  if(currentSort==='asc'){
    prods.sort(function(a,b){return a.price-b.price;});
  }else if(currentSort==='desc'){
    prods.sort(function(a,b){return b.price-a.price;});
  }else if(currentSort==='new'){
    prods.sort(function(a,b){return new Date(b.createdAt||0)-new Date(a.createdAt||0);});
  }else if(currentSort==='disc'){
    prods.sort(function(a,b){return (b.discount||0)-(a.discount||0);});
  }else if(currentSort==='bat'){
    prods.sort(function(a,b){return (b.battery||0)-(a.battery||0);});
  }else{
    prods.sort(function(a,b){return b.sold-a.sold;});
  }
  var count=document.getElementById('shopCount');
  if(count)count.textContent=prods.length+' productos';
  renderGrid('shopGrid',prods);
}
function renderOfertasGrid(){
  var grid=document.getElementById('ofertasGrid');
  if(!grid)return;
  var offers=PRODUCTS.filter(function(p){return p.isOffer;});
  renderGrid('ofertasGrid',offers);
}
function renderRepairGrid(){
  var grid=document.getElementById('repairGrid');
  if(!grid)return;
  grid.innerHTML=REPAIRS.map(function(r){
    return '<div class="repair-card"><div class="rc-ico">'+r.ico+'</div><div class="rc-t">'+r.name+'</div><div class="rc-d">'+r.range+'</div></div>';
  }).join('');
}
function renderAccGrid(){
  var grid=document.getElementById('accGrid');
  if(!grid)return;
  var accs=window.ACCS||[];
  if(!window.accFilter)window.accFilter='todos';
  if(window.accFilter!=='todos')accs=accs.filter(function(a){return a.category===window.accFilter;});
  grid.innerHTML=accs.map(function(a){
    var now=new Date();
    var isPromoActive=a.isOffer&&(!a.offerEnd||new Date(a.offerEnd)>now)&&(!a.offerStart||new Date(a.offerStart)<=now);
    var finalPrice=isPromoActive?Math.round(a.price-a.price*a.discount/100):a.price;
    var isOutOfStock=a.stock===0;
    var imgHtml=a.imageUrl?'<img src="'+a.imageUrl+'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'">':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+(a.ico||'📦')+'</span>';
    var badge=isOutOfStock?'<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>':(isPromoActive?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">-'+a.discount+'% OFF</div>':(a.category?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">'+a.category+'</div>':''));
    var isFav=isFavorite(a.id);
    return '<article class="pcard'+(isOutOfStock?' pcard-out-of-stock':'')+'"'+(isOutOfStock?'':' onclick="openAccDetail(\''+a.id+'\')"')+' style="cursor:'+((isOutOfStock?'default':'pointer'))+'">'+
      '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
      badge+
      '<div style="position:absolute;top:16px;right:16px;z-index:3">'+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+a.id+'\')" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.95);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;z-index:2;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:all .25s"'+(isFav?'background:#fff0ec;color:var(--orange)':'')+'>'+(isFav?'♥':'♡')+'</button>'+
      '</div>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+(a.name||a.brand)+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+(a.brand||a.description||'')+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      (isPromoActive?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--gray);text-decoration:line-through">'+fmt(a.price)+'</span><span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;background:var(--red);color:#fff">-'+a.discount+'%</span></div>':'')+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
      '</div>'+
      (isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+a.id+'\')" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">🛒 Agregar al carrito</button>')+
      '</div>'+
      '</article>';
  }).join('');
}
function openAccDetail(id){
  var a=getById(window.ACCS,id);
  if(!a)return;
  currentAcc=a;
  var detName=document.getElementById('detName');
  var detMeta=document.getElementById('detMeta');
  var detPrice=document.getElementById('detPrice');
  var detTotal=document.getElementById('detTotal');
  var imgWrap=document.getElementById('detImgWrap');
  var now=new Date();
  var isPromoActive=a.isOffer&&(!a.offerEnd||new Date(a.offerEnd)>now)&&(!a.offerStart||new Date(a.offerStart)<=now);
  var finalPrice=isPromoActive?Math.round(a.price-a.price*a.discount/100):a.price;
  if(detName)detName.textContent=a.name;
  if(detMeta)detMeta.textContent=(a.brand||'')+' '+(a.description||'');
  if(detPrice)detPrice.innerHTML=fmt(finalPrice);
  if(detTotal)detTotal.innerHTML=fmt(finalPrice);
  var oldPrice=document.getElementById('detOld');
  var detPriceWrap=document.getElementById('detPriceWrap');
  if(isPromoActive&&a.discount){
    if(detPriceWrap)detPriceWrap.innerHTML='<span style="font-family:\'Playfair Display\',Georgia,serif;font-size:32px;font-weight:700;color:var(--orange)">'+fmt(finalPrice)+'</span><span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:5px;background:var(--red);color:#fff;margin-left:8px">-'+a.discount+'%</span>';
    if(oldPrice)oldPrice.innerHTML=fmt(a.price);
    if(oldPrice)oldPrice.classList.remove('hidden');
  }else{
    if(detPriceWrap)detPriceWrap.innerHTML=fmt(finalPrice);
    if(oldPrice)oldPrice.classList.add('hidden');
  }
  if(imgWrap)imgWrap.innerHTML=a.imageUrl?'<img src="'+a.imageUrl+'">':(a.ico?'<span style="font-size:80px">'+a.ico+'</span>':'<span style="font-size:80px">📦</span>');
  nav('detail');
}
function openDetail(id){
  currentProd=getById(PRODUCTS,id);
  if(!currentProd)return;
  var brandEl=document.getElementById('detBrand');
  if(brandEl)brandEl.textContent=currentProd.brand||'Apple';
  var typeEl=document.getElementById('detType');
  if(typeEl)typeEl.textContent=currentProd.type||'iPhone';
  var name2El=document.getElementById('detName2');
  if(name2El)name2El.textContent=currentProd.name;
  var detName=document.getElementById('detName');
  if(detName)detName.textContent=currentProd.name;
  var detMeta=document.getElementById('detMeta');
  if(detMeta)detMeta.textContent=currentProd.sub+(currentProd.battery?(' — Batería '+currentProd.battery+'%'):'');
  var now=new Date();
  var isPromoActive=currentProd.isOffer&&(!currentProd.offerEnd||new Date(currentProd.offerEnd)>now)&&(!currentProd.offerStart||new Date(currentProd.offerStart)<=now);
  var finalPrice=isPromoActive?Math.round(currentProd.price-currentProd.price*currentProd.discount/100):currentProd.price;
  var detPrice=document.getElementById('detPrice');
  var detTotal=document.getElementById('detTotal');
  if(detPrice)detPrice.innerHTML=fmt(finalPrice);
  if(detTotal)detTotal.innerHTML=fmt(finalPrice);
  var oldPrice=document.getElementById('detOld');
  var detPriceWrap=document.getElementById('detPriceWrap');
  if(isPromoActive&&currentProd.discount){
    var originalPrice=currentProd.price;
    if(detPriceWrap)detPriceWrap.innerHTML='<span style="font-family:\'Playfair Display\',Georgia,serif;font-size:32px;font-weight:700;color:var(--orange)">'+fmt(finalPrice)+'</span><span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:5px;background:var(--red);color:#fff;margin-left:8px">-'+currentProd.discount+'%</span>';
    if(oldPrice)oldPrice.innerHTML=fmt(originalPrice);
    if(oldPrice)oldPrice.classList.remove('hidden');
  }else{
    if(detPriceWrap)detPriceWrap.innerHTML=fmt(finalPrice);
    if(oldPrice)oldPrice.classList.add('hidden');
  }
  detWMult=0;detDExtra=0;selCuotas=1;
  resetDetailSelections();
  renderDetailImages();
  var fb=document.getElementById('detFavBtn');
  if(fb){
    if(isFavorite(currentProd.id)){fb.innerHTML='♥';fb.style.color='var(--red)';fb.classList.add('saved');}
    else{fb.innerHTML='♡';fb.style.color='var(--gray)';fb.classList.remove('saved');}
  }
  nav('detail');
}



function resetDetailSelections(){
  document.querySelectorAll('.cuota-btn').forEach(function(c,i){
    if(i===0){
      c.style.background='var(--green)';
      c.style.color='#fff';
      c.style.border='2px solid var(--green)';
    }else{
      c.style.background='var(--cream2)';
      c.style.color='var(--dk)';
      c.style.border='2px solid var(--border)';
    }
  });
  document.querySelectorAll('.warranty-btn').forEach(function(c,i){
    if(i===0){
      c.style.border='2px solid var(--green)';
    }else{
      c.style.border='2px solid var(--border)';
    }
  });
  document.querySelectorAll('.delivery-btn').forEach(function(c,i){
    if(i===0){
      c.style.border='2px solid var(--green)';
    }else{
      c.style.border='2px solid var(--border)';
    }
  });
}
var detailCurrentImageIndex=0;
function renderDetailImages(){
  var allImages=[];
  if(currentProd&&currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd&&currentProd.images)allImages=allImages.concat(currentProd.images);
  var mainImg=document.getElementById('detImgMain');
  var thumbsContainer=document.getElementById('detThumbnails');
  if(allImages.length===0){
    if(!currentProd)return;
    var isFav=isFavorite(currentProd.id);
    if(mainImg)mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" style="position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;z-index:100;color:'+(isFav?'var(--red)':'var(--gray)')+'">'+(isFav?'♥':'♡')+'</button><span style="font-size:90px">📱</span>';
    if(thumbsContainer)thumbsContainer.style.display='none';
    return;
  }
  if(mainImg)mainImg.style.display='flex';
  detailCurrentImageIndex=0;
  if(mainImg)mainImg.innerHTML=getDetailImageHtml(allImages,0);
  if(allImages.length>1){
    if(thumbsContainer)thumbsContainer.style.display='grid';
    if(thumbsContainer)thumbsContainer.innerHTML=allImages.map(function(url,i){
      return'<img src="'+url+'" onclick="setDetailImage('+i+')"'+(i===0?' class="act"':'')+'>';
    }).join('');
  }else{
    if(thumbsContainer)thumbsContainer.style.display='none';
  }
}
function getDetailImageHtml(allImages,index){
  var prev=index>0?index-1:allImages.length-1;
  var next=index<allImages.length-1?index+1:0;
  var isFav=isFavorite(currentProd.id);
  return'<div style="position:relative;width:100%;height:100%">'+
    '<button id="detFavBtn" onclick="toggleDetFav()" style="position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;z-index:100;color:'+(isFav?'var(--red)':'var(--gray)')+'">'+(isFav?'♥':'♡')+'</button>'+
    '<img src="'+allImages[index]+'" style="width:100%;height:100%;object-fit:contain">'+
    (allImages.length>1?'<button onclick="event.stopPropagation();setDetailImage('+prev+')" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;background:rgba(255,255,255,0.9);border:1px solid var(--border);border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">&#8592;</button><button onclick="event.stopPropagation();setDetailImage('+next+')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;background:rgba(255,255,255,0.9);border:1px solid var(--border);border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">&#8594;</button>':'')+
  '</div>';
}
function setDetailImage(index){
  var allImages=[];
  if(currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd.images)allImages=allImages.concat(currentProd.images);
  detailCurrentImageIndex=index;
  document.getElementById('detImgMain').innerHTML=getDetailImageHtml(allImages,index);
  document.querySelectorAll('.det-thumbnails img').forEach(function(img,i){
    img.classList.toggle('act',i===index);
  });
}
function selCuota(el,n){
  document.querySelectorAll('.cuota-btn').forEach(function(c){
    c.style.background='var(--cream2)';
    c.style.color='var(--dk)';
    c.style.border='2px solid var(--border)';
  });
  el.style.background='var(--green)';
  el.style.color='#fff';
  el.style.border='2px solid var(--green)';
  selCuotas=n;
  updDetTotal();
}
function selOpt(el,type,val){
  var list=el.parentElement;
  if(type==='w'){
    list.querySelectorAll('.warranty-btn').forEach(function(r){
      r.style.border='2px solid var(--border)';
    });
    el.style.border='2px solid var(--green)';
    detWMult=val;
  }
  if(type==='d'){
    list.querySelectorAll('.delivery-btn').forEach(function(r){
      r.style.border='2px solid var(--border)';
    });
    el.style.border='2px solid var(--green)';
    detDExtra=val;
  }
  updDetTotal();
}
function updDetTotal(){
  if(!currentProd)return;
  var total=currentProd.price+detWMult+detDExtra;
  document.getElementById('detTotal').innerHTML=fmt(total);
}
function filterShop(f,btn){
  window.shopFilter=f;
  if(btn){
    document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('act');});
    btn.classList.add('act');
  }
  renderShopGrid();
  if(f==='todos'){
    var titleEl=document.getElementById('shopTitle');
    if(titleEl)titleEl.textContent='Catálogo';
    var subEl=document.getElementById('shopSub');
    if(subEl)subEl.textContent='Todos los equipos verificados con garantía incluida';
  }
}
var currentSort='rel';
var filterState={conditions:[],storage:[],priceMin:null,priceMax:null,hideNoStock:false};
function toggleSortMenu(){
  var menu=document.getElementById('sortMenu');
  menu.style.display=menu.style.display==='none'?'block':'none';
}
function setSort(val,btn){
  currentSort=val;
  var label=document.getElementById('sortLabel');
  if(label)label.textContent=btn.textContent;
  document.querySelectorAll('.sort-opt').forEach(function(o){o.classList.remove('act');});
  btn.classList.add('act');
  document.getElementById('sortMenu').style.display='none';
  renderShopGrid();
}
function toggleFilterPanel(){
  var panel=document.getElementById('filterPanel');
  var overlay=document.getElementById('filterOverlay');
  var isOpen=panel.style.display==='block';
  
  var mainnav=document.getElementsByClassName('mainnav')[0];
  var catnav=document.getElementsByClassName('catnav')[0];
  
  if(isOpen){
    panel.style.animation='slideOut .25s ease forwards';
    overlay.style.display='none';
    if(mainnav)mainnav.style.backdropFilter='';
    if(catnav)catnav.style.backdropFilter='';
    setTimeout(function(){panel.style.display='none';panel.style.animation='';},250);
  }else{
    panel.style.display='block';
    panel.style.animation='slideIn .25s ease forwards';
    overlay.style.display='block';
    if(mainnav)mainnav.style.backdropFilter='blur(8px)';
    if(catnav)catnav.style.backdropFilter='blur(8px)';
  }
}
function applyFilters(){
  var state={conditions:[],storage:[],priceMin:null,priceMax:null,hideNoStock:false};
  if(document.getElementById('chk-new').checked)state.conditions.push('Nuevo');
  if(document.getElementById('chk-usado').checked)state.conditions.push('Usado');
  document.querySelectorAll('#filterPanel input[type="checkbox"][value]').forEach(function(cb){
    if(cb.checked&&cb.value.match(/GB|TB/))state.storage.push(cb.value);
  });
  var pMin=document.getElementById('priceMin');
  var pMax=document.getElementById('priceMax');
  if(pMin&&pMin.value)state.priceMin=parseInt(pMin.value);
  if(pMax&&pMax.value)state.priceMax=parseInt(pMax.value);
  var hideNoStock=document.getElementById('hideNoStock');
  state.hideNoStock=hideNoStock?hideNoStock.checked:false;
  filterState=state;
  var count=state.conditions.length+state.storage.length+(state.priceMin?1:0)+(state.priceMax?1:0)+(state.hideNoStock?1:0);
  var badge=document.getElementById('filterCount');
  if(badge){
    badge.textContent=count;
    badge.style.display=count>0?'inline':'none';
  }
  renderShopGrid();
  toggleFilterPanel();
}
function clearFilters(){
  document.getElementById('chk-new').checked=false;
  document.getElementById('chk-usado').checked=false;
  document.querySelectorAll('#filterPanel input[type="checkbox"][value]').forEach(function(cb){cb.checked=false;});
  document.getElementById('priceMin').value='';
  document.getElementById('priceMax').value='';
  document.getElementById('hideNoStock').checked=false;
  filterState={conditions:[],storage:[],priceMin:null,priceMax:null,hideNoStock:false};
  document.getElementById('filterCount').style.display='none';
  renderShopGrid();
}
function filtAcc(f,btn){
  accFilter=f;
  document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('act');});
  btn.classList.add('act');
  renderAccGrid();
}
function clearAdvF(){
  document.getElementById('af-st').value='';
  document.getElementById('af-cd').value='';
  document.getElementById('af-p1').value='';
  document.getElementById('af-p2').value='';
  renderShopGrid();
}

// =========== ORDER & QUOTE HISTORY ===========
function renderOrderHistory(){
  var list=document.getElementById('orderHistory');
  if(!list)return;
  var user=localStorage.getItem('gp_user');
  if(!user){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Inicia sesion para ver tu historial</div>';return;}
  try{
    var u=JSON.parse(user);
    fetch(API_URL+'/api/orders?userId='+u.id).then(function(r){return r.json();}).then(function(ords){
      if(ords.length===0){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">No tenes pedidos</div>';}
      else{list.innerHTML=ords.map(function(o){return'<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">'+(o.items[0]?.product?.name||'Producto')+'</div><div class="oi-s">'+o.code+' · '+new Date(o.createdAt).toLocaleDateString('es-AR')+'</div></div><div><div class="oi-p">$'+o.total.toLocaleString('es-AR')+'</div><span class="oi-bdg">'+o.status+'</span></div></div>';}).join('');}
    }).catch(function(){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando pedidos</div>';});
  }catch(e){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando pedidos</div>';}
}
function renderQuotHistory(){
  var list=document.getElementById('quotHistory');
  if(!list)return;
  var user=localStorage.getItem('gp_user');
  if(!user){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Inicia sesion para ver tus cotizaciones</div>';return;}
  try{
    var u=JSON.parse(user);
    fetch(API_URL+'/api/quotes?userId='+u.id).then(function(r){return r.json();}).then(function(qts){
      if(qts.length===0){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">No tenes cotizaciones</div>';}
      else{list.innerHTML=qts.map(function(q){return'<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">'+q.device+' '+q.storage+'</div><div class="oi-s">'+q.code+' · '+new Date(q.createdAt).toLocaleDateString('es-AR')+'</div></div><div><div class="oi-p">$'+q.finalPrice.toLocaleString('es-AR')+'</div><span class="oi-bdg">'+q.status+'</span></div></div>';}).join('');}
    }).catch(function(){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando cotizaciones</div>';});
  }catch(e){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando cotizaciones</div>';}
}

// =========== INIT ===========
document.addEventListener('DOMContentLoaded',function(){
  loadProducts();
  renderRepairGrid();
  renderAccGrid();
  initSlider();
  startTimer();
  renderNotebookConfig();
});

// =========== SLIDER ===========
var sliderIdx=0,sliderTimer=null;
function initSlider(){
  var nav=document.getElementById('sliderNav');
  if(!nav)return;
  nav.innerHTML='';
  for(var i=0;i<4;i++){
    var d=document.createElement('button');
    d.className='sdot'+(i===0?' act':'');
    d.setAttribute('data-i',i);
    d.onclick=(function(idx){return function(){goSlide(idx);};})(i);
    nav.appendChild(d);
  }
  startSliderTimer();
}
function goSlide(idx){
  sliderIdx=(idx+4)%4;
  var track=document.getElementById('sliderTrack');
  if(track)track.style.transform='translateX(-'+(sliderIdx*25)+'%)';
  document.querySelectorAll('.sdot').forEach(function(d,i){d.className='sdot'+(i===sliderIdx?' act':'');});
}
function sliderNext(){goSlide(sliderIdx+1);}
function sliderPrev(){goSlide(sliderIdx-1);}
function startSliderTimer(){
  if(sliderTimer)clearInterval(sliderTimer);
  sliderTimer=setInterval(function(){goSlide(sliderIdx+1);},4500);
}

// =========== FEATURED GRID ===========
function renderFeaturedGrid(){
  var grid=document.getElementById('featuredGrid');
  if(!grid)return;
  renderGrid('featuredGrid',PRODUCTS.slice(0,5));
}

// =========== TIMER ===========
function startTimer(){
  var end=new Date();
  end.setHours(23,59,59,0);
  function tick(){
    var now=new Date();
    var diff=Math.max(0,Math.floor((end-now)/1000));
    var h=Math.floor(diff/3600);
    var m=Math.floor((diff%3600)/60);
    var s=diff%60;
    var el=document.getElementById('timerEl');
    if(el)el.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick,1000);
}

// =========== NOTEBOOK CONFIG ===========
function renderNotebookConfig(){
  var nbBase=document.getElementById('nbBaseOpts');
  if(nbBase){
    nbBase.innerHTML=NB_DATA.bases.map(function(nb,i){
      return '<div class="nb-opt" onclick="selectNbBase(this,'+i+')"><div><div class="nb-opt-name">'+nb.ico+' '+nb.name+'</div><div class="nb-opt-desc">'+nb.desc+'</div></div><div class="nb-opt-price">'+fmt(nb.price)+'</div><div class="nb-opt-chk"></div></div>';
    }).join('');
  }
}
function selectNbBase(el,idx){
  document.querySelectorAll('#nbBaseOpts .nb-opt').forEach(function(o){o.classList.remove('act');});
  el.classList.add('act');
}

// =========== MAYORISTA ===========
function renderMayorista(){
  var el=document.getElementById('mayoristaContent');
  if(el)el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Programa mayorista no disponible</p><p style="font-size:11px">Contactanos por WhatsApp para ser mayorista</p></div>';
}

// =========== ADMIN ===========
function adminTab(tab,btn){
  document.querySelectorAll('#adm-prods,#adm-stock,#adm-orders,#adm-users').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  renderAdminContent(tab);
}
function saveProduct(){
  var prodId=document.getElementById('prodId').value;
  var isEdit=!!prodId;
  var originalProduct=isEdit?getById(PRODUCTS,prodId):null;
  if(isEdit&&originalProduct){
    originalProduct=JSON.parse(JSON.stringify(originalProduct));
  }
  function getField(value,original,isNumeric){
    if(isNumeric){
      var newVal=parseInt(value)||0;
      return newVal||(original||0);
    }
    return value.trim()||original||'';
  }
  var data={
    name:getField(document.getElementById('prodName').value,originalProduct?originalProduct.name:null),
    brand:getField(document.getElementById('prodBrand').value,originalProduct?originalProduct.brand:null),
    sub:getField(document.getElementById('prodSub').value,originalProduct?originalProduct.sub:null),
    price:getField(document.getElementById('prodPrice').value,originalProduct?originalProduct.price:true),
    stock:getField(document.getElementById('prodStock').value,originalProduct?originalProduct.stock:true),
    condition:getField(document.getElementById('prodCondition').value,originalProduct?originalProduct.condition:null),
    type:getField(document.getElementById('prodType').value,originalProduct?originalProduct.type:null),
    color:getField(document.getElementById('prodColor').value,originalProduct?originalProduct.color:null),
    screen:getField(document.getElementById('prodScreen').value,originalProduct?originalProduct.screen:true),
    imageUrl:getField(document.getElementById('prodImageUrl').value,originalProduct?originalProduct.imageUrl:null),
    images:getAdditionalImages(),
    ico:originalProduct?originalProduct.ico:'📱'
  };
  function getAdditionalImages(){
    try{
      return JSON.parse(document.getElementById('prodImages').value)||[];
    }catch(e){
      return [];
    }
  }
  if(!data.name||!data.price){
    alert('Nombre y precio son requeridos');
    return;
  }
  console.log('Saving product:', {isEdit:isEdit, prodId:prodId, data:data});
  var method=isEdit?'PUT':'POST';
  var url=isEdit?API_URL+'/api/products/'+prodId:API_URL+'/api/products';
  fetch(url,{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).then(function(r){return r.json();}).then(function(p){
    nav('admin');
    loadProducts();
    showToast(isEdit?'Producto actualizado':'Producto agregado');
  }).catch(function(){alert('Error guardando producto');});
}
function editProduct(id){
  var p=getById(PRODUCTS,id);
  if(!p)return;
  document.getElementById('prodId').value=p.id;
  document.getElementById('prodName').value=p.name||'';
  document.getElementById('prodBrand').value=p.brand||'iPhone';
  document.getElementById('prodSub').value=p.sub||'';
  document.getElementById('prodPrice').value=p.price||'';
  document.getElementById('prodStock').value=p.stock||'';
  document.getElementById('prodCondition').value=p.condition||'Nuevo';
  document.getElementById('prodType').value=p.type||'celular';
  document.getElementById('prodColor').value=p.color||'';
  document.getElementById('prodScreen').value=p.screen||'';
  
  document.getElementById('prodImageUrl').value=p.imageUrl||'';
  if(p.imageUrl){
    document.getElementById('prodImagePreview').innerHTML='<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
  }else{
    document.getElementById('prodImagePreview').innerHTML='📷';
  }
  window.additionalImages=p.images||[];
  document.getElementById('prodImages').value=JSON.stringify(window.additionalImages);
  var container=document.getElementById('prodAdditionalImages');
  if(window.additionalImages.length>0){
    container.innerHTML='';
    window.additionalImages.forEach(function(url,i){
      renderAdditionalImage(url,i);
    });
  }else{
    container.innerHTML='<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
  }
  isEditingProduct=true;
  nav('admin-product');
}
function uploadProductImage(input){
  var file=input.files[0];
  if(!file)return;
  var preview=document.getElementById('prodImagePreview');
  preview.innerHTML='<span style="font-size:12px">Subiendo...</span>';
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{
    method:'POST',
    body:formData
  }).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      document.getElementById('prodImageUrl').value=data.url;
      preview.innerHTML='<img src="'+data.url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    }else{
      preview.innerHTML='📷';
      alert('Error subiendo imagen');
    }
  }).catch(function(){
    preview.innerHTML='📷';
    alert('Error subiendo imagen');
  });
}
function handleImageDrop(event){
  var file=event.dataTransfer.files[0];
  if(!file||!file.type.startsWith('image/')){
    alert('Por favor arrastra una imagen');
    return;
  }
  var preview=document.getElementById('prodImagePreview');
  preview.innerHTML='<span style="font-size:12px">Subiendo...</span>';
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{
    method:'POST',
    body:formData
  }).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      document.getElementById('prodImageUrl').value=data.url;
      preview.innerHTML='<img src="'+data.url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    }else{
      preview.innerHTML='📷';
      alert('Error subiendo imagen');
    }
  }).catch(function(){
    preview.innerHTML='📷';
    alert('Error subiendo imagen');
  });
}
var additionalImages=[];
function uploadAdditionalImages(input){
  var files=input.files;
  if(!files||files.length===0)return;
  Array.from(files).forEach(function(file){
    if(!file.type.startsWith('image/'))return;
    var container=document.getElementById('prodAdditionalImages');
    var placeholder=document.getElementById('addImgPlaceholder');
    if(placeholder)placeholder.remove();
    var formData=new FormData();
    formData.append('file',file);
    fetch(API_URL+'/api/upload',{
      method:'POST',
      body:formData
    }).then(function(r){return r.json();}).then(function(data){
      if(data.url){
        additionalImages.push(data.url);
        document.getElementById('prodImages').value=JSON.stringify(additionalImages);
        renderAdditionalImage(data.url,additionalImages.length-1);
      }
    }).catch(function(){console.log('Error uploading image');});
  });
  input.value='';
}
function renderAdditionalImage(url,index){
  var container=document.getElementById('prodAdditionalImages');
  var div=document.createElement('div');
  div.style.cssText='position:relative;width:60px;height:60px;flex-shrink:0';
  div.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px"><button onclick="removeAdditionalImage('+index+')" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:var(--red);color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;line-height:1">×</button>';
  container.appendChild(div);
}
function removeAdditionalImage(index){
  additionalImages.splice(index,1);
  document.getElementById('prodImages').value=JSON.stringify(additionalImages);
  var container=document.getElementById('prodAdditionalImages');
  container.innerHTML=additionalImages.length===0?'<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>':'';
  additionalImages.forEach(function(url,i){
    renderAdditionalImage(url,i);
  });
}
var pendingDeleteId=null;
function deleteProduct(id){
  pendingDeleteId=id;
  document.getElementById('confirmTitle').textContent='Eliminar producto';
  document.getElementById('confirmMsg').textContent='Estas seguro de eliminar este producto? Esta accion no se puede deshacer.';
  document.getElementById('confirmOverlay').style.display='flex';
}
function closeConfirm(){
  document.getElementById('confirmOverlay').style.display='none';
  pendingDeleteId=null;
}
function confirmAction(confirmed){
  if(window.confirmCallback){window.confirmCallback(confirmed);}
  if(confirmed&&pendingDeleteId){var p=getById(PRODUCTS,pendingDeleteId);var pname=p?p.name:'este producto';
    fetch(API_URL+'/api/products/'+pendingDeleteId,{method:'DELETE'}).then(function(){loadProducts();showToast('Eliminado: '+pname);}).catch(function(){alert('Error eliminando producto');});}
  closeConfirm();
}
function renderAdminContent(tab){
  if(!tab)tab='prods';
  var el=document.getElementById('adminContent');
  if(!el)return;
  window.currentAdminTab=tab;
  
  if(tab==='acc'&&(!window.ACCS||window.ACCS.length===0)){
    loadAccessories();
  }
  
  // Reset tab buttons
  document.querySelectorAll('#adm-prods,#adm-acc,#adm-stock,#adm-promos,#adm-orders,#adm-arrep,#adm-users').forEach(function(b){b.classList.remove('act');});
  var activeBtn=document.getElementById('adm-'+tab);
  if(activeBtn)activeBtn.classList.add('act');
  if(tab==='prods'){
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Productos ('+PRODUCTS.length+')</h3><button class="btn btn-o btn-sm" onclick="window.isEditingProduct=false;nav(\'admin-product\')">+ Agregar producto</button></div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">'+
      PRODUCTS.map(function(p){
        var lowStock=p.stock<=2;
        var imgHtml=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:32px">📱</span>';
        return '<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid '+(lowStock?'var(--red)':'var(--border)')+';transition:all .2s" onmouseover="this.style.borderColor=\'var(--orange)\'" onmouseout="this.style.borderColor=\''+(lowStock?'var(--red)':'var(--border)')+'\'">'+
          '<div style="height:120px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden">'+imgHtml+'</div>'+
'<div style="padding:10px;display:flex;flex-direction:column;min-height:150px">'+
             '<div style="font-weight:600;font-size:12px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
             '<div style="font-size:10px;color:var(--gray);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p.sub||'')+'</div>'+
             '<div style="display:flex;justify-content:space-between;align-items:center">'+
               '<span style="font-weight:700;color:var(--orange);font-size:13px">'+fmt(p.price)+'</span>'+
               '<span style="font-size:10px;color:'+(lowStock?'var(--red)':'var(--gray)')+'">'+(lowStock?'⚠ '+p.stock:p.stock+' en stock')+'</span>'+
             '</div>'+
             (p.isOffer?'<div style="font-size:10px;color:var(--red);margin-top:4px">Oferta: -'+p.discount+'%</div>':'')+
             '<div style="display:flex;gap:6px;margin-top:auto;padding-top:8px">'+
               '<button class="btn btn-g btn-sm" style="flex:1" onclick="editProduct(\''+p.id+'\')">Editar</button>'+
               '<button class="btn btn-o btn-sm" style="flex:1" onclick="deleteProduct(\''+p.id+'\')">Eliminar</button>'+
             '</div>'+
           '</div>'+
        '</div>';
      }).join('')+
      '</div>';
  }else if(tab==='stock'){
    var allBrands=[...new Set(PRODUCTS.map(function(p){return p.brand;}).filter(function(b){return b;}))];
    var accBrands=[...new Set((window.ACCS||[]).map(function(a){return a.brand;}).filter(function(b){return b;}))];
    var allBrandsSet=new Set(allBrands.concat(accBrands));
    var brandsHtml=Array.from(allBrandsSet).map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('');
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:12px">'+
      '<h3 style="font-size:16px">Gestion de Stock</h3>'+
      '<div style="display:flex;gap:12px;align-items:center">'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Tipo</label><select id="stockFilterType" onchange="renderStockList()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="todos">Todos</option><option value="productos">Productos</option><option value="accesorios">Accesorios</option></select></div>'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Marca</label><select id="stockFilterBrand" onchange="renderStockList()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="">Todas</option>'+brandsHtml+'</select></div>'+
        '<div style="display:flex;gap:8px;align-items:flex-end"><button onclick="undoAllStock()" class="btn btn-g btn-sm">Deshacer</button><button onclick="saveAllStock()" class="btn btn-o btn-sm">Guardar</button></div>'+
      '</div>'+
    '</div>'+
    '<div style="display:grid;gap:8px" id="stockList"></div>';
    renderStockList();
  }else if(tab==='promos'){
    var brands=[...new Set(PRODUCTS.map(function(p){return p.brand;}).filter(function(b){return b;}))];
    var accBrands=[...new Set((window.ACCS||[]).map(function(a){return a.brand;}).filter(function(b){return b;}))];
    var allBrandsSet=new Set(brands.concat(accBrands));
    var allBrands=Array.from(allBrandsSet);
    var brandsHtml=allBrands.map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('');
    el.innerHTML='<div style="margin-bottom:2rem">'+
      '<h3 style="font-size:24px;font-family:\'Playfair Display\',Georgia,serif;margin-bottom:.5rem">Crear Promoción</h3>'+
      '<p style="font-size:13px;color:var(--gray);margin-bottom:1.5rem">Diseña ofertas exclusivas para tu colección.</p>'+
      
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:1rem;background:#fff;padding:20px;border-radius:12px;border:1px solid var(--border)">'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Tipo</label><select class="sel-f" id="promoItemType" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="todos">Todos</option><option value="productos">Productos</option><option value="accesorios">Accesorios</option></select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Marca</label><select class="sel-f" id="promoBrand" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="">Todas las Marcas</option>'+brandsHtml+'</select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Categoría</label><select class="sel-f" id="promoType" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="">Todas</option></select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">% Descuento</label><div style="position:relative"><input class="inp-f" id="promoDiscount" type="number" placeholder="0" min="0" max="100" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><span style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--orange)">%</span></div></div>'+
      '</div>'+
      
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:1rem;background:#fff;padding:20px;border-radius:12px;border:1px solid var(--border)">'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Inicio</label><input class="inp-f" id="promoStart" type="datetime-local" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Fin</label><input class="inp-f" id="promoEnd" type="datetime-local" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"></div>'+
      '</div>'+
      
      '<div style="margin-bottom:1rem">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">'+
          '<h4 style="font-size:18px;font-weight:600">Seleccionar Productos</h4>'+
          '<div style="display:flex;gap:8px">'+
            '<button onclick="selectAllPromo(true)" style="background:var(--green);color:#fff;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;border:none;cursor:pointer">Seleccionar todos</button>'+
            '<button onclick="selectAllPromo(false)" style="background:var(--cream2);color:var(--dk);padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid var(--border);cursor:pointer">Deseleccionar todos</button>'+
          '</div>'+
        '</div>'+
        '<div id="promoProductList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px"></div>'+
      '</div>'+
      
      '<button onclick="applyPromo()" style="width:100%;background:var(--orange);color:#fff;padding:16px;border-radius:12px;font-size:14px;font-weight:700;border:none;cursor:pointer;margin-top:1rem">Publicar Promoción</button>'+
      
      '<div style="margin-top:3rem;border-top:1px solid var(--border);padding-top:2rem">'+
        '<h3 style="font-size:24px;font-family:\'Playfair Display\',Georgia,serif;margin-bottom:.5rem">Administrar Promociones Activas</h3>'+
        '<div style="height:4px;width:80px;background:var(--orange);border-radius:2px;margin-bottom:1.5rem"></div>'+
        '<div style="display:flex;gap:12px;margin-bottom:1rem;align-items:flex-end">'+
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Tipo</label><select id="activePromoFilterType" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="todos">Todos</option><option value="productos">Productos</option><option value="accesorios">Accesorios</option></select></div>'+
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Marca</label><select id="activePromoFilterBrand" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="">Todas</option>'+brandsHtml+'</select></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border)">'+
          '<table style="width:100%;text-align:left;border-collapse:collapse">'+
            '<tbody id="activePromosTable">'+
            '</tbody>'+
          '</table>'+
        '</div>'+
        '<button onclick="deleteSelectedPromos()" style="width:100%;margin-top:12px;padding:14px;background:var(--red);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Eliminar promoción</button>'+
      '</div>'+
    '</div>';
    renderPromoProducts();
    renderActivePromos();
  }else if(tab==='orders'){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Pedidos</p><p style="font-size:12px">Proximamente podras ver y gestionar pedidos</p></div>';
  }else if(tab==='acc'){
    var accs=window.ACCS||[];
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Accesorios ('+accs.length+')</h3><button class="btn btn-o btn-sm" onclick="window.isEditingAcc=false;nav(\'admin-acc\')">+ Agregar accesorio</button></div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">'+
      accs.map(function(a){
        var imgHtml=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:32px">'+(a.ico||'📦')+'</span>';
        return '<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid var(--border);transition:all .2s" onmouseover="this.style.borderColor=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+
          '<div style="height:120px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden">'+imgHtml+'</div>'+
          '<div style="padding:10px;display:flex;flex-direction:column;min-height:120px">'+
            '<div style="font-weight:600;font-size:12px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
            '<div style="font-size:10px;color:var(--gray);margin-bottom:8px">'+a.category+'</div>'+
            '<div style="display:flex;justify-content:space-between;align-items:center">'+
              '<span style="font-weight:700;color:var(--orange);font-size:13px">'+fmt(a.price)+'</span>'+
              '<span style="font-size:10px;color:var(--gray)">'+a.stock+' en stock</span>'+
            '</div>'+
            '<div style="display:flex;gap:6px;margin-top:auto;padding-top:8px">'+
              '<button class="btn btn-g btn-sm" style="flex:1" onclick="editAccessory(\''+a.id+'\')">Editar</button>'+
              '<button class="btn btn-o btn-sm" style="flex:1" onclick="deleteAccessory(\''+a.id+'\')">Eliminar</button>'+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('')+
      '</div>';
  }else if(tab==='arrep'){
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Arrepentimientos</h3></div><div class="adm-list" id="arrepList">Cargando...</div>';
    fetch(API_URL+'/api/arrepentimiento').then(function(r){return r.json();}).then(function(list){
      var html=list.length===0?'<div style="text-align:center;padding:2rem;color:var(--gray)">No hay arrepentimientos</div>':
        list.map(function(a){
          var estadoColor=a.estado==='PENDIENTE'?'var(--orange)':a.estado==='APROBADO'?'var(--green)':'var(--red)';
          return'<div style="background:#fff;border-radius:12px;padding:14px;border:1px solid var(--border);margin-bottom:10px">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'+
              '<span style="font-weight:600">'+a.email+'</span>'+
              '<span style="padding:4px 10px;border-radius:12px;background:'+estadoColor+';color:#fff;font-size:11px;font-weight:600">'+a.estado+'</span>'+
            '</div>'+
            '<div style="font-size:12px;color:var(--gray);margin-bottom:6px">Orden: '+a.orderId+'</div>'+
            '<div style="font-size:12px;color:var(--gray);margin-bottom:8px">Teléfono: '+(a.telefono||'-')+'</div>'+
            (a.motivo?'<div style="font-size:12px;margin-bottom:8px;padding:8px;background:var(--cream2);border-radius:8px">Motivo: '+a.motivo+'</div>':'')+
            '<div style="font-size:11px;color:var(--gray)">'+new Date(a.createdAt).toLocaleDateString('es-AR')+'</div>'+
            '<div style="display:flex;gap:8px;margin-top:10px">'+
              '<button class="btn btn-o btn-sm" onclick="updateArrep(\''+a.id+'\',\'APROBADO\')">Aprobar</button>'+
              '<button class="btn btn-g btn-sm" onclick="updateArrep(\''+a.id+'\',\'RECHAZADO\')">Rechazar</button>'+
            '</div>'+
          '</div>';
        }).join('');
      document.getElementById('arrepList').innerHTML=html;
    }).catch(function(){document.getElementById('arrepList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando</div>';});
  }else if(tab==='users'){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Usuarios</p><p style="font-size:12px">Proximamente podras gestionar usuarios</p></div>';
  }
}
function updateStock(id){
  var newStock=parseInt(document.getElementById('stock-'+id).value)||0;
  var p=getById(PRODUCTS,id);
  if(!p)return;
  fetch(API_URL+'/api/products/'+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({stock:newStock})
  }).then(function(){
    loadProducts();
  }).catch(function(){alert('Error actualizando stock');});
}
function adjustStock(id,delta){
  var input=document.getElementById('stock-'+id);
  var newVal=Math.max(0,parseInt(input.value)+delta);
  input.value=newVal;
}
function saveAllStock(){
  var inputs=document.querySelectorAll('[id^="stock-"]');
  var promises=[];
  inputs.forEach(function(input){
    var id=input.id.replace('stock-','');
    var newStock=parseInt(input.value)||0;
    var original=parseInt(input.getAttribute('data-original'));
    if(newStock!==original){
      var isAcc=id.startsWith('acc-');
      var realId=isAcc?id.replace('acc-',''):id;
      var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
      promises.push(fetch(API_URL+endpoint,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({stock:newStock})
      }));
    }
  });
  Promise.all(promises).then(function(){
    inputs.forEach(function(input){
      var id=input.id.replace('stock-','');
      var newStock=parseInt(input.value)||0;
      var isAcc=id.startsWith('acc-');
      var realId=isAcc?id.replace('acc-',''):id;
      var p=getById(PRODUCTS,realId);
      if(p)p.stock=newStock;
      var a=getById(window.ACCS,realId);
      if(a)a.stock=newStock;
      input.setAttribute('data-original',input.value);
    });
    renderStockList();
    showToast('Stock guardado correctamente');
  }).catch(function(){alert('Error guardando stock');});
}
function undoAllStock(){
  var inputs=document.querySelectorAll('[id^="stock-"]');
  inputs.forEach(function(input){
    input.value=input.getAttribute('data-original');
  });
  showToast('Cambios revertidos');
}
function renderStockList(){
  var list=document.getElementById('stockList');
  if(!list)return;
  var filterType=document.getElementById('stockFilterType')?document.getElementById('stockFilterType').value:'todos';
  var filterBrand=document.getElementById('stockFilterBrand')?document.getElementById('stockFilterBrand').value:'';
  var items=[];
  if(filterType==='todos'||filterType==='productos'){
    PRODUCTS.forEach(function(p){
      if(filterBrand&&p.brand!==filterBrand)return;
      items.push({id:p.id,name:p.name,sub:p.sub||'',stock:p.stock,type:'producto',ico:p.ico||'📱',brand:p.brand});
    });
  }
  if(filterType==='todos'||filterType==='accesorios'){
    (window.ACCS||[]).forEach(function(a){
      if(filterBrand&&a.brand!==filterBrand)return;
      items.push({id:a.id,name:a.name,sub:a.category||'',stock:a.stock,type:'accesorio',ico:a.ico||'📦',brand:a.brand});
    });
  }
  list.innerHTML=items.map(function(item){
    var lowStock=item.stock<=2;
    var medStock=item.stock>2&&item.stock<=5;
    var statusText=lowStock?'⚠ Stock critico':medStock?'⚠ Stock bajo':'';
    var stockId=item.type==='accesorio'?'acc-'+item.id:item.id;
    return'<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border-radius:8px;border:1px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+'">'+
      '<div style="font-size:24px">'+item.ico+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-weight:600">'+item.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">'+item.sub+' <span style="color:var(--orange);font-weight:500">['+item.type+']</span></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;min-width:120px">'+
        '<button onclick="adjustStock(\''+stockId+'\',-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">-</button>'+
        '<input type="number" id="stock-'+stockId+'" data-original="'+item.stock+'" value="'+item.stock+'" min="0" style="width:50px;padding:6px;border:1.5px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+';border-radius:var(--rsm);font-size:14px;text-align:center;font-weight:600'+(lowStock?';color:var(--red)':medStock?';color:var(--orange)':'')+'">'+
        '<button onclick="adjustStock(\''+stockId+'\',1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">+</button>'+
      '</div>'+
      '<div style="font-size:11px;font-weight:600;color:'+(lowStock?'var(--red)':medStock?'var(--orange)':'transparent')+'">'+statusText+'</div>'+
    '</div>';
  }).join('');
}
function renderPromoProducts(){
  var brand=document.getElementById('promoBrand').value;
  var typeFilter=document.getElementById('promoType').value;
  var itemType=document.getElementById('promoItemType')?document.getElementById('promoItemType').value:'todos';
  var list=document.getElementById('promoProductList');
  if(!list)return;
  var items=[];
  if(itemType==='todos'||itemType==='productos'){
    PRODUCTS.forEach(function(p){
      if(brand&&p.brand!==brand)return;
      if(typeFilter&&p.type!==typeFilter)return;
      items.push({id:p.id,name:p.name,brand:p.brand,price:p.price,isOffer:p.isOffer,discount:p.discount,imageUrl:p.imageUrl,type:'producto',ico:p.ico||'📱'});
    });
  }
  if(itemType==='todos'||itemType==='accesorios'){
    (window.ACCS||[]).forEach(function(a){
      if(brand&&a.brand!==brand)return;
      if(typeFilter&&a.category!==typeFilter)return;
      items.push({id:a.id,name:a.name,brand:a.brand,price:a.price,isOffer:a.isOffer,discount:a.discount,imageUrl:a.imageUrl,type:'accesorio',ico:a.ico||'📦'});
    });
  }
  list.innerHTML=items.map(function(item){
    var chkId=item.type==='accesorio'?'promo-chk-acc-'+item.id:'promo-chk-'+item.id;
    var isSelected=document.getElementById(chkId)?.checked;
    return'<div style="background:#fff;border-radius:12px;padding:10px;border:1px solid '+(isSelected?'var(--orange)':'var(--border)')+';cursor:pointer;transition:all .2s;position:relative'+(isSelected?';box-shadow:0 2px 8px rgba(255,107,44,0.2)':'')+'" onclick="togglePromoProduct(\''+item.id+'\')">'+
      '<div style="position:absolute;top:6px;right:6px;z-index:10">'+
        '<input type="checkbox" id="'+chkId+'" '+(isSelected?'checked':'')+' style="width:16px;height:16px;border-radius:4px;border:2px solid var(--border);cursor:pointer" onclick="event.stopPropagation()">'+
      '</div>'+
      '<div style="aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:8px;background:var(--cream2);display:flex;align-items:center;justify-content:center">'+
        (item.imageUrl?'<img src="'+item.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:28px">'+item.ico+'</span>')+
      '</div>'+
      '<div style="margin-bottom:2px">'+
        '<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--orange)">'+item.brand+' <span style="color:var(--gray);font-weight:400">['+item.type+']</span></div>'+
        '<div style="font-size:11px;font-weight:600;color:var(--dk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+item.name+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:4px">'+
        '<span style="font-size:12px;font-weight:700;color:var(--dk)">'+fmt(item.price)+'</span>'+
        (item.isOffer?'<span style="font-size:9px;color:var(--red);font-weight:700;background:rgba(255,0,0,0.05);padding:2px 6px;border-radius:8px">-'+item.discount+'%</span>':'')+
      '</div>'+
    '</div>';
  }).join('');
}
function togglePromoProduct(id){
  var isAcc=getById(window.ACCS||[],id)?true:false;
  var chkId=isAcc?'promo-chk-acc-'+id:'promo-chk-'+id;
  var chk=document.getElementById(chkId);
  if(chk)chk.checked=!chk.checked;
  renderPromoProducts();
}
function selectAllPromo(selectAll){
  var brand=document.getElementById('promoBrand').value;
  var type=document.getElementById('promoType').value;
  var itemType=document.getElementById('promoItemType')?document.getElementById('promoItemType').value:'todos';
  if(itemType==='todos'||itemType==='productos'){
    var filtered=PRODUCTS.filter(function(p){
      return(!brand||p.brand===brand)&&(!type||p.type===type);
    });
    filtered.forEach(function(p){
      var chk=document.getElementById('promo-chk-'+p.id);
      if(chk)chk.checked=selectAll;
    });
  }
  if(itemType==='todos'||itemType==='accesorios'){
    var filteredAcc=(window.ACCS||[]).filter(function(a){
      return(!brand||a.brand===brand)&&(!type||a.category===type);
    });
    filteredAcc.forEach(function(a){
      var chk=document.getElementById('promo-chk-acc-'+a.id);
      if(chk)chk.checked=selectAll;
    });
  }
  renderPromoProducts();
}
function applyPromo(){
  var discount=parseInt(document.getElementById('promoDiscount').value)||0;
  var start=document.getElementById('promoStart').value;
  var end=document.getElementById('promoEnd').value;
  if(discount<=0){alert('Ingresa un descuento mayor a 0');return;}
  var checkboxes=document.querySelectorAll('[id^="promo-chk-"]:checked');
  if(checkboxes.length===0){alert('Selecciona al menos un producto');return;}
  var promises=[];
  var prodCount=0,accCount=0;
  checkboxes.forEach(function(chk){
    var rawId=chk.id.replace('promo-chk-','');
    var isAcc=rawId.startsWith('acc-');
    var realId=isAcc?rawId.replace('acc-',''):rawId;
    var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
    if(isAcc)accCount++;else prodCount++;
    promises.push(fetch(API_URL+endpoint,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({discount:discount,isOffer:discount>0,offerStart:start||null,offerEnd:end||null})
    }));
  });
  Promise.all(promises).then(function(){
    loadProducts();
    loadAccessories();
    var msg='Promo aplicada';
    if(prodCount>0&&accCount>0)msg+=' a '+prodCount+' producto(s) y '+accCount+' accesorio(s)';
    else if(prodCount>0)msg+=' a '+prodCount+' producto(s)';
    else if(accCount>0)msg+=' a '+accCount+' accesorio(s)';
    showToast(msg);
  }).catch(function(){alert('Error aplicando promoción');});
}
function renderActivePromos(){
  var tbody=document.getElementById('activePromosTable');
  var filterBrand=document.getElementById('promoFilterBrand')?.value||'';
  var filterStatus=document.getElementById('promoFilterStatus')?.value||'';
  var filterType=document.getElementById('promoFilterType')?.value||'todos';
  if(!tbody)return;
  var now=new Date();
  var allOffers=[];
  if(filterType==='todos'||filterType==='productos'){
    PRODUCTS.filter(function(p){return p.isOffer&&p.discount>0;}).forEach(function(p){
      allOffers.push({id:p.id,name:p.name,sub:p.sub,brand:p.brand,discount:p.discount,offerStart:p.offerStart,offerEnd:p.offerEnd,imageUrl:p.imageUrl,type:'producto',ico:p.ico||'📱'});
    });
  }
  if(filterType==='todos'||filterType==='accesorios'){
    (window.ACCS||[]).filter(function(a){return a.isOffer&&a.discount>0;}).forEach(function(a){
      allOffers.push({id:a.id,name:a.name,sub:a.category||'',brand:a.brand,discount:a.discount,offerStart:a.offerStart,offerEnd:a.offerEnd,imageUrl:a.imageUrl,type:'accesorio',ico:a.ico||'📦'});
    });
  }
  var offers=allOffers.filter(function(p){
    var endDate=p.offerEnd?new Date(p.offerEnd):null;
    var isActive=!endDate||endDate>now;
    if(filterBrand&&p.brand!==filterBrand)return false;
    if(filterStatus==='activa'&&!isActive)return false;
    if(filterStatus==='programada'&&isActive)return false;
    return true;
  });
  
  var brands=[...new Set(allOffers.map(function(p){return p.brand;}).filter(function(b){return b;}))];
  
  tbody.innerHTML='<tr>'+
    '<td colspan="6" style="padding:16px;background:var(--cream2);border-bottom:1px solid var(--border)">'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
        '<select id="promoFilterType" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="todos" '+(filterType==='todos'?'selected':'')+'>Todos</option>'+
          '<option value="productos" '+(filterType==='productos'?'selected':'')+'>Productos</option>'+
          '<option value="accesorios" '+(filterType==='accesorios'?'selected':'')+'>Accesorios</option>'+
        '</select>'+
        '<select id="promoFilterBrand" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="" '+(filterBrand===''?'selected':'')+'>Todas las marcas</option>'+brands.map(function(b){return'<option value="'+b+'" '+(filterBrand===b?'selected':'')+'>'+b+'</option>';}).join('')+
        '</select>'+
        '<select id="promoFilterStatus" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="" '+(filterStatus===''?'selected':'')+'>Todos los estados</option>'+
          '<option value="activa" '+(filterStatus==='activa'?'selected':'')+'>Activas</option>'+
          '<option value="programada" '+(filterStatus==='programada'?'selected':'')+'>Programadas</option>'+
        '</select>'+
        '<button onclick="toggleSelectAllPromos(true)" style="padding:8px 16px;background:var(--green);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Seleccionar todas</button>'+
        '<button onclick="toggleSelectAllPromos(false)" style="padding:8px 16px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Deseleccionar todas</button>'+
      '</div>'+
    '</td>'+
  '</tr>';
  
  if(offers.length===0){
    tbody.innerHTML+='<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--gray)">No hay promociones activas</td></tr>';
    return;
  }
  tbody.innerHTML+=offers.map(function(p){
    var endDateVal=p.offerEnd?new Date(p.offerEnd):null;
    var isActive=!endDateVal||endDateVal>now;
    var startDate=p.offerStart?new Date(p.offerStart).toLocaleDateString('es-AR'):'—';
    var endDate=p.offerEnd?new Date(p.offerEnd).toLocaleDateString('es-AR'):'—';
    var chkVal=p.type==='accesorio'?'acc-'+p.id:p.id;
    return'<tr onclick="togglePromoRow(\''+chkVal+'\')" style="border-top:1px solid var(--border);cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--cream)\'" onmouseout="this.style.background=\'transparent\'">'+
      '<td style="padding:12px;width:40px">'+
        '<input type="checkbox" class="promo-del-chk" value="'+chkVal+'" style="width:18px;height:18px;cursor:pointer" onclick="event.stopPropagation()">'+
      '</td>'+
      '<td style="padding:12px">'+
        '<div style="display:flex;align-items:center;gap:10px">'+
          '<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center">'+
            (p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+p.ico+'</span>')+
          '</div>'+
          '<div><div style="font-weight:600;font-size:13px">'+p.name+'</div><div style="font-size:10px;color:var(--gray)">'+p.sub+' <span style="color:var(--orange);font-weight:600">['+p.type+']</span></div></div>'+
        '</div>'+
      '</td>'+
      '<td style="padding:12px"><span style="font-size:10px;font-weight:600;background:var(--cream2);padding:4px 10px;border-radius:20px">'+p.brand+'</span></td>'+
      '<td style="padding:12px"><span style="font-size:14px;font-weight:700;color:var(--orange)">-'+p.discount+'%</span></td>'+
      '<td style="padding:12px">'+
        '<div style="font-size:11px;font-weight:500">'+startDate+' — '+endDate+'</div>'+
        '<div style="font-size:10px;font-weight:700;color:'+(isActive?'var(--green)':'var(--gray)')+';display:flex;align-items:center;gap:4px;margin-top:2px"><span style="width:6px;height:6px;border-radius:50%;background:currentColor"></span>'+(isActive?'ACTIVA':'PROGRAMADA')+'</div>'+
      '</td>'+
    '</tr>';
  }).join('');
}
function removePromo(id){
  var isAcc=id.startsWith('acc-');
  var realId=isAcc?id.replace('acc-',''):id;
  var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
  fetch(API_URL+endpoint,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({discount:0,isOffer:false,offerStart:null,offerEnd:null})
  }).then(function(){
    loadProducts();
    loadAccessories();
    renderActivePromos();
    showToast('Promoción eliminada');
  }).catch(function(){alert('Error eliminando promoción');});
}
var promoDeleteIds=[];
function deleteSelectedPromos(){
  var checkboxes=document.querySelectorAll('.promo-del-chk:checked');
  if(checkboxes.length===0){alert('Selecciona al menos una promoción');return;}
  promoDeleteIds=Array.from(checkboxes).map(function(chk){return chk.value;});
  var overlay=document.getElementById('confirmOverlay');
  document.getElementById('confirmTitle').textContent='Eliminar promoción';
  document.getElementById('confirmMsg').textContent='¿Eliminar '+checkboxes.length+' promoción(es)? Esta acción no se puede deshacer.';
  overlay.style.display='flex';
  window.confirmCallback=function(confirmed){
    if(confirmed&&promoDeleteIds.length>0){
      var promises=[];
      promoDeleteIds.forEach(function(rawId){
        var isAcc=rawId.startsWith('acc-');
        var realId=isAcc?rawId.replace('acc-',''):rawId;
        var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
        promises.push(fetch(API_URL+endpoint,{
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({discount:0,isOffer:false,offerStart:null,offerEnd:null})
        }));
      });
      Promise.all(promises).then(function(){
        loadProducts();
        loadAccessories();
        renderActivePromos();
        showToast(promoDeleteIds.length+' promoción(es) eliminada(s)');
      }).catch(function(){alert('Error eliminando promociones');});
    }
    promoDeleteIds=[];
  };
}
function toggleSelectAllPromos(selectAll){
  var checkboxes=document.querySelectorAll('.promo-del-chk');
  checkboxes.forEach(function(chk){chk.checked=selectAll;});
}
function togglePromoRow(id){
  var chk=document.querySelector('.promo-del-chk[value="'+id+'"]');
  if(chk)chk.checked=!chk.checked;
}
function showToast(msg){
  var existing=document.getElementById('toast');
  if(existing)existing.remove();
  var toast=document.createElement('div');
  toast.id='toast';
  toast.textContent=msg;
  toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--dk);color:#fff;padding:12px 24px;border-radius:var(--rsm);font-size:14px;font-weight:500;z-index:1000;animation:fadeInUp .3s ease';
  document.body.appendChild(toast);
  setTimeout(function(){toast.style.animation='fadeOutDown .3s ease';setTimeout(function(){toast.remove();},300);},2500);
}
