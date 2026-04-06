// =========== RENDER ===========
var API_URL='http://localhost:3000';
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

function renderGrid(gid,prods){
  var grid=document.getElementById(gid);
  if(!grid)return;
  if(!prods.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray);font-size:12px">No hay productos.</div>';return;}
  var now=new Date();
  grid.innerHTML=prods.map(function(p){
    var isPromoActive=p.isOffer&&(!p.offerEnd||new Date(p.offerEnd)>now)&&(!p.offerStart||new Date(p.offerStart)<=now);
    var finalPrice=isPromoActive?Math.round(p.price*(1-p.discount/100)):p.price;
    var cuota=Math.round(finalPrice/12);
    var imgHtml=p.imageUrl?'<img src="'+p.imageUrl+'">':'<span>📱</span>';
    var badges=(p.condition==='Nuevo'?'<span class="pcard-bdg bdg-new">Nuevo</span>':(p.condition&&p.condition!=='Nuevo'?'<span class="pcard-bdg bdg-used">'+p.condition+'</span>':''))+
      (isPromoActive?'<span class="pcard-bdg bdg-disc">-'+p.discount+'%</span>':'');
    var isFav=isFavorite(p.id);
    return '<div class="pcard" onclick="openDetail(\''+p.id+'\')">'+
      '<div class="pcard-img">'+
      imgHtml+
      '</div>'+
      badges+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;z-index:2'+(isFav?'background:#fff0ec;border-color:rgba(255,107,44,.35);color:var(--orange)':'')+'">'+(isFav?'♥':'♡')+'</button>'+
      '<div class="pcard-body">'+
      '<div class="pcard-name">'+p.name+'</div>'+
      '<div class="pcard-sub">'+p.sub+'</div>'+
      '<div><span class="pcard-price">'+fmt(finalPrice)+'</span>'+(isPromoActive?'<span class="pcard-old">'+fmt(p.price)+'</span>':'')+'</div>'+
      '<div class="pcard-cuota">12x '+fmt(cuota)+' sin interes</div>'+
      (p.stock<=2&&p.stock>0?'<div class="pcard-stock">&#9888; Solo '+p.stock+' en stock</div>':'')+
      '</div>'+
      '<button class="pcard-add" onclick="event.stopPropagation();notAvailable()" style="margin-top:auto">+ Agregar al carrito</button>'+
      '</div>';
  }).join('');
}
function renderHomeRail(){
  var rail=document.getElementById('homeRail');
  if(!rail)return;
  var sorted=PRODUCTS.slice().sort(function(a,b){return b.sold-a.sold;});
  renderGrid('homeRail',sorted.slice(0,6));
}
function renderOfferStrip(){
  var strip=document.getElementById('offerStrip');
  if(!strip)return;
  var offers=PRODUCTS.filter(function(p){return p.isOffer;});
  strip.innerHTML=offers.map(function(p){
    var fp=Math.round(p.price*(1-p.discount/100));
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
  var prods=PRODUCTS;
  if(shopFilter!=='todos')prods=PRODUCTS.filter(function(p){return p.brand===shopFilter;});
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
  var accs=ACCS;
  if(accFilter!=='todos')accs=ACCS.filter(function(a){return a.cat===accFilter;});
  grid.innerHTML=accs.map(function(a){
    return '<div class="acc-card"><div class="acc-img">'+a.ico+'</div><div class="acc-body"><div class="acc-name">'+a.name+'</div><div class="acc-sub">'+a.sub+'</div><div class="acc-price">'+fmt(a.price)+'</div></div><button class="acc-add" onclick="notAvailable()">Agregar</button></div>';
  }).join('');
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
  document.getElementById('detName').textContent=currentProd.name;
  document.getElementById('detMeta').textContent=currentProd.sub+(currentProd.battery?(' — Batería '+currentProd.battery+'%'):'');
  var now=new Date();
  var isPromoActive=currentProd.isOffer&&(!currentProd.offerEnd||new Date(currentProd.offerEnd)>now)&&(!currentProd.offerStart||new Date(currentProd.offerStart)<=now);
  var finalPrice=isPromoActive?Math.round(currentProd.price*(1-currentProd.discount/100)):currentProd.price;
  document.getElementById('detPrice').innerHTML=fmt(finalPrice);
  document.getElementById('detTotal').innerHTML=fmt(finalPrice);
  var oldPrice=document.getElementById('detOld');
  if(isPromoActive&&currentProd.discount){
    var originalPrice=Math.round(currentProd.price/(1-currentProd.discount/100));
    oldPrice.innerHTML=fmt(originalPrice);
    oldPrice.classList.remove('hidden');
  }else{
    oldPrice.classList.add('hidden');
  }
  detWMult=0;detDExtra=0;selCuotas=1;
  resetDetailSelections();
  var fb=document.getElementById('detFavBtn');
  if(fb){
    if(isFavorite(currentProd.id)){fb.innerHTML='♥';fb.classList.add('saved');}
    else{fb.innerHTML='♡';fb.classList.remove('saved');}
  }
  renderDetailImages();
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
  if(currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd.images)allImages=allImages.concat(currentProd.images);
  var mainImg=document.getElementById('detImgMain');
  var thumbsContainer=document.getElementById('detThumbnails');
  if(allImages.length===0){
    mainImg.innerHTML='<span style="font-size:90px">📱</span>';
    thumbsContainer.style.display='none';
    return;
  }
  mainImg.style.display='flex';
  detailCurrentImageIndex=0;
  mainImg.innerHTML=getDetailImageHtml(allImages,0);
  if(allImages.length>1){
    thumbsContainer.style.display='grid';
    thumbsContainer.innerHTML=allImages.map(function(url,i){
      return'<img src="'+url+'" onclick="setDetailImage('+i+')"'+(i===0?' class="act"':'')+'>';
    }).join('');
  }else{
    thumbsContainer.style.display='none';
  }
}
function getDetailImageHtml(allImages,index){
  var prev=index>0?index-1:allImages.length-1;
  var next=index<allImages.length-1?index+1:0;
  return'<div style="position:relative;width:100%;height:100%">'+
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
  shopFilter=f;
  document.querySelectorAll('#filterBar .fchip').forEach(function(c){c.classList.remove('act');});
  btn.classList.add('act');
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
    discount:getField(document.getElementById('prodDiscount').value,originalProduct?originalProduct.discount:true),
    isOffer:document.getElementById('prodIsOffer').value==='true',
    offerStart:document.getElementById('prodOfferStart').value||null,
    offerEnd:document.getElementById('prodOfferEnd').value||null,
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
  document.getElementById('prodDiscount').value=p.discount||0;
  document.getElementById('prodIsOffer').value=p.isOffer?'true':'false';
  document.getElementById('prodOfferStart').value=p.offerStart?new Date(p.offerStart).toISOString().slice(0,16):'';
  document.getElementById('prodOfferEnd').value=p.offerEnd?new Date(p.offerEnd).toISOString().slice(0,16):'';
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
  if(confirmed&&pendingDeleteId){var p=getById(PRODUCTS,pendingDeleteId);var pname=p?p.name:'este producto';
    fetch(API_URL+'/api/products/'+pendingDeleteId,{method:'DELETE'}).then(function(){loadProducts();showToast('Eliminado: '+pname);}).catch(function(){alert('Error eliminando producto');});}
  closeConfirm();
}
function renderAdminContent(tab){
  var el=document.getElementById('adminContent');
  if(!el)return;
  window.currentAdminTab=tab;
  if(tab==='prods'){
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Productos ('+PRODUCTS.length+')</h3><button class="btn btn-o btn-sm" onclick="window.isEditingProduct=false;nav(\'admin-product\')">+ Agregar producto</button></div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">'+
      PRODUCTS.map(function(p){
        var lowStock=p.stock<=2;
        var imgHtml=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:32px">📱</span>';
        return '<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid '+(lowStock?'var(--red)':'var(--border)')+';transition:all .2s" onmouseover="this.style.borderColor=\'var(--orange)\'" onmouseout="this.style.borderColor=\''+(lowStock?'var(--red)':'var(--border)')+'\'">'+
          '<div style="height:120px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden">'+imgHtml+'</div>'+
          '<div style="padding:10px">'+
            '<div style="font-weight:600;font-size:12px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
            '<div style="font-size:10px;color:var(--gray);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.sub+'</div>'+
            '<div style="display:flex;justify-content:space-between;align-items:center">'+
              '<span style="font-weight:700;color:var(--orange);font-size:13px">'+fmt(p.price)+'</span>'+
              '<span style="font-size:10px;color:'+(lowStock?'var(--red)':'var(--gray)')+'">'+(lowStock?'⚠ '+p.stock:p.stock+' en stock')+'</span>'+
            '</div>'+
            (p.isOffer?'<div style="font-size:10px;color:var(--red);margin-top:4px">Oferta: -'+p.discount+'%</div>':'')+'<div style="display:flex;gap:6px;margin-top:10px">'+
              '<button class="btn btn-g btn-sm" style="flex:1" onclick="editProduct(\''+p.id+'\')">Editar</button>'+
              '<button class="btn btn-o btn-sm" style="flex:1" onclick="deleteProduct(\''+p.id+'\')">Eliminar</button>'+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('')+
      '</div>';
  }else if(tab==='stock'){
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Gestion de Stock</h3><div style="display:flex;gap:8px"><button onclick="undoAllStock()" class="btn btn-g btn-sm">Deshacer todo</button><button onclick="saveAllStock()" class="btn btn-o btn-sm">Guardar cambios</button></div></div>'+
      '<div style="display:grid;gap:8px">'+
      PRODUCTS.map(function(p){
        var lowStock=p.stock<=2;
        var medStock=p.stock>2&&p.stock<=5;
        var statusText=lowStock?'⚠ Stock critico':medStock?'⚠ Stock bajo':'';
        return'<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border-radius:8px;border:1px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+'"><div style="font-size:24px">'+p.ico+'</div><div style="flex:1"><div style="font-weight:600">'+p.name+'</div><div style="font-size:11px;color:var(--gray)">'+p.sub+'</div></div><div style="display:flex;align-items:center;gap:6px;min-width:120px"><button onclick="adjustStock(\''+p.id+'\',-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">-</button><input type="number" id="stock-'+p.id+'" data-original="'+p.stock+'" value="'+p.stock+'" min="0" style="width:50px;padding:6px;border:1.5px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+';border-radius:var(--rsm);font-size:14px;text-align:center;font-weight:600'+(lowStock?';color:var(--red)':medStock?';color:var(--orange)':'')+'"><button onclick="adjustStock(\''+p.id+'\',1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">+</button></div><div style="font-size:11px;font-weight:600;color:'+(lowStock?'var(--red)':medStock?'var(--orange)':'transparent')+'">'+statusText+'</div></div>';}).join('')+
      '</div>';
  }else if(tab==='promos'){
    var brands=[...new Set(PRODUCTS.map(function(p){return p.brand;}).filter(function(b){return b;}))];
    var types=[...new Set(PRODUCTS.map(function(p){return p.type;}).filter(function(t){return t;}))];
    el.innerHTML='<div style="margin-bottom:1.5rem"><h3 style="font-size:16px;margin-bottom:1rem">Crear Promoción</h3>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:1rem;background:#fff;padding:16px;border-radius:12px;border:1px solid var(--border)">'+
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Marca</label><select class="sel-f" id="promoBrand" onchange="renderPromoProducts()"><option value="">Todas</option>'+brands.map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('')+'</select></div>'+
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Tipo</label><select class="sel-f" id="promoType" onchange="renderPromoProducts()"><option value="">Todos</option>'+types.map(function(t){return'<option value="'+t+'">'+t+'</option>';}).join('')+'</select></div>'+
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">% Descuento</label><input class="inp-f" id="promoDiscount" type="number" placeholder="10" min="0" max="100"></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1rem;background:#fff;padding:16px;border-radius:12px;border:1px solid var(--border)">'+
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Inicio</label><input class="inp-f" id="promoStart" type="datetime-local"></div>'+
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Fin</label><input class="inp-f" id="promoEnd" type="datetime-local"></div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:1rem"><button onclick="selectAllPromo(true)" class="btn btn-g btn-sm">Seleccionar todos</button><button onclick="selectAllPromo(false)" class="btn btn-g btn-sm">Deseleccionar todos</button></div>'+
      '<div id="promoProductList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px"></div>'+
      '<button onclick="applyPromo()" class="btn btn-o" style="margin-top:1rem;width:100%">Aplicar promoción</button></div>';
    renderPromoProducts();
  }else if(tab==='orders'){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Pedidos</p><p style="font-size:12px">Proximamente podras ver y gestionar pedidos</p></div>';
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
      promises.push(fetch(API_URL+'/api/products/'+id,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({stock:newStock})
      }));
    }
  });
  if(promises.length===0){
    showToast('No hay cambios para guardar');
    return;
  }
  Promise.all(promises).then(function(){
    inputs.forEach(function(input){
      var id=input.id.replace('stock-','');
      var newStock=parseInt(input.value)||0;
      var p=getById(PRODUCTS,id);
      if(p)p.stock=newStock;
      input.setAttribute('data-original',input.value);
    });
    renderAdminContent('stock');
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
function renderPromoProducts(){
  var brand=document.getElementById('promoBrand').value;
  var type=document.getElementById('promoType').value;
  var list=document.getElementById('promoProductList');
  if(!list)return;
  var filtered=PRODUCTS.filter(function(p){
    return(!brand||p.brand===brand)&&(!type||p.type===type);
  });
  list.innerHTML=filtered.map(function(p){
    var isSelected=document.getElementById('promo-chk-'+p.id)?.checked;
    return'<div style="background:#fff;border-radius:12px;padding:12px;border:1px solid '+(isSelected?'var(--orange)':'var(--border)')+';cursor:pointer" onclick="togglePromoProduct(\''+p.id+'\')">'+
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">'+
        '<input type="checkbox" id="promo-chk-'+p.id+'" '+(isSelected?'checked':'')+' onclick="event.stopPropagation()">'+
        '<span style="font-size:20px">'+(p.imageUrl?'<img src="'+p.imageUrl+'" style="width:32px;height:32px;object-fit:cover;border-radius:6px">':'📱')+'</span>'+
        '<div style="flex:1;overflow:hidden"><div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div><div style="font-size:9px;color:var(--gray)">'+p.sub+'</div></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--orange);font-weight:700">'+fmt(p.price)+'</span>'+(p.isOffer?'<span style="color:var(--red)">-'+p.discount+'%</span>':'')+'</div>'+
    '</div>';
  }).join('');
}
function togglePromoProduct(id){
  var chk=document.getElementById('promo-chk-'+id);
  if(chk)chk.checked=!chk.checked;
  renderPromoProducts();
}
function selectAllPromo(selectAll){
  var brand=document.getElementById('promoBrand').value;
  var type=document.getElementById('promoType').value;
  var filtered=PRODUCTS.filter(function(p){
    return(!brand||p.brand===brand)&&(!type||p.type===type);
  });
  filtered.forEach(function(p){
    var chk=document.getElementById('promo-chk-'+p.id);
    if(chk)chk.checked=selectAll;
  });
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
  checkboxes.forEach(function(chk){
    var id=chk.id.replace('promo-chk-','');
    promises.push(fetch(API_URL+'/api/products/'+id,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({discount:discount,isOffer:discount>0,offerStart:start||null,offerEnd:end||null})
    }));
  });
  Promise.all(promises).then(function(){
    loadProducts();
    showToast('Promo aplicada a '+checkboxes.length+' productos');
  }).catch(function(){alert('Error aplicando promoción');});
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
