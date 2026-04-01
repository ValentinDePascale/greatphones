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
  }).catch(function(){console.log('Error loading products');});
}

function renderGrid(gid,prods){
  var grid=document.getElementById(gid);
  if(!grid)return;
  if(!prods.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray);font-size:12px">No hay productos.</div>';return;}
  grid.innerHTML=prods.map(function(p){
    var finalPrice=p.isOffer?Math.round(p.price*(1-p.discount/100)):p.price;
    var cuota=Math.round(finalPrice/12);
    return '<div class="pcard" onclick="openDetail(\''+p.id+'\')">'+
      '<div class="pcard-img">'+
      p.ico+
      (p.condition==='Nuevo'?'<span class="pcard-bdg bdg-new">Nuevo</span>':'<span class="pcard-bdg bdg-used">'+p.condition+'</span>')+
      (p.isOffer?'<span class="pcard-bdg bdg-disc">-'+p.discount+'%</span>':'')+
      '</div>'+
      '<div class="pcard-body">'+
      '<div class="pcard-name">'+p.name+'</div>'+
      '<div class="pcard-sub">'+p.sub+'</div>'+
      '<div><span class="pcard-price">'+fmt(finalPrice)+'</span>'+(p.isOffer?'<span class="pcard-old">'+fmt(p.price)+'</span>':'')+'</div>'+
      '<div class="pcard-cuota">12x '+fmt(cuota)+' sin interes</div>'+
      (p.stock<=2&&p.stock>0?'<div class="pcard-stock">&#9888; Solo '+p.stock+' en stock</div>':'')+
      '</div>'+
      '<button class="pcard-add" onclick="event.stopPropagation();notAvailable()">+ Agregar al carrito</button>'+
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
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  if(empty)empty.style.display='block';if(grid)grid.style.display='none';
  if(cnt)cnt.textContent='0 guardados';
  if(empty)empty.innerHTML='<div style="text-align:center;padding:3rem 1rem"><div style="font-size:44px;margin-bottom:.875rem">&#9825;</div><div style="font-family:\'Playfair Display\',Georgia,serif;font-size:19px;margin-bottom:.4rem">Funcionalidad no disponible</div><p style="font-size:11px;color:var(--gray);line-height:1.6">Conectate al backend para guardar favoritos.</p></div>';
}
function openDetail(id){
  currentProd=getById(PRODUCTS,id);
  if(!currentProd)return;
  document.getElementById('detIco').innerHTML=currentProd.ico;
  document.getElementById('detName').textContent=currentProd.name;
  document.getElementById('detMeta').textContent=currentProd.sub+(currentProd.battery?(' — Bateria '+currentProd.battery+'%'):'');
  document.getElementById('detPrice').textContent=fmt(currentProd.price);
  document.getElementById('detScore').textContent=currentProd.score;
  document.getElementById('detTotal').textContent=fmt(currentProd.price);
  detWMult=0;detDExtra=0;
  var fb=document.getElementById('detFavBtn');
  if(fb){fb.innerHTML='♡';fb.classList.remove('saved');}
  nav('detail');
}
function selCuota(el,n){
  document.querySelectorAll('.cb-chip').forEach(function(c){c.classList.remove('act');});
  el.classList.add('act');
  selCuotas=n;
  updDetTotal();
}
function selOpt(el,type,val){
  var list=el.parentElement;
  list.querySelectorAll('.opt-row').forEach(function(r){r.classList.remove('act');});
  el.classList.add('act');
  if(type==='w')detWMult=val;
  if(type==='d')detDExtra=val;
  updDetTotal();
}
function updDetTotal(){
  if(!currentProd)return;
  var total=currentProd.price*(1+detWMult)+detDExtra;
  document.getElementById('detTotal').textContent=fmt(total);
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
  var data={
    name:document.getElementById('prodName').value,
    brand:document.getElementById('prodBrand').value,
    sub:document.getElementById('prodSub').value,
    price:parseInt(document.getElementById('prodPrice').value)||0,
    stock:parseInt(document.getElementById('prodStock').value)||0,
    condition:document.getElementById('prodCondition').value,
    type:document.getElementById('prodType').value,
    color:document.getElementById('prodColor').value,
    screen:parseFloat(document.getElementById('prodScreen').value)||null,
    discount:parseInt(document.getElementById('prodDiscount').value)||0,
    isOffer:document.getElementById('prodIsOffer').value==='true',
    ico:'📱'
  };
  if(!data.name||!data.price){
    alert('Nombre y precio son requeridos');
    return;
  }
  var prodId=document.getElementById('prodId').value;
  var method=prodId?'PUT':'POST';
  var url=prodId?API_URL+'/api/products/'+prodId:API_URL+'/api/products';
  fetch(url,{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).then(function(r){return r.json();}).then(function(p){
    nav('admin');
    loadProducts();
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
  nav('admin-product');
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
  if(confirmed&&pendingDeleteId){
    fetch(API_URL+'/api/products/'+pendingDeleteId,{method:'DELETE'}).then(function(){
      loadProducts();
    }).catch(function(){alert('Error eliminando producto');});
  }
  closeConfirm();
}
function renderAdminContent(tab){
  var el=document.getElementById('adminContent');
  if(!el)return;
  if(tab==='prods'){
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="font-size:16px">Productos ('+PRODUCTS.length+')</h3><button class="btn btn-o btn-sm" onclick="nav(\'admin-product\')">+ Agregar producto</button></div>'+
      '<div style="display:grid;gap:8px">'+
      PRODUCTS.map(function(p){var lowStock=p.stock<=2;return'<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border-radius:8px;border:1px solid '+(lowStock?'var(--red)':'var(--border)')+'"><div style="font-size:24px">'+p.ico+'</div><div style="flex:1"><div style="font-weight:600">'+p.name+'</div><div style="font-size:11px;color:var(--gray)">'+p.sub+(lowStock?' <span style="color:var(--red);font-weight:600">⚠ Stock bajo</span>':'')+'</div></div><div style="text-align:right"><div style="font-weight:600">'+fmt(p.price)+'</div><div style="font-size:11px;color:var(--gray)">Stock: '+p.stock+'</div></div><div style="display:flex;gap:8px"><button class="btn btn-g btn-sm" onclick="editProduct(\''+p.id+'\')">Editar</button><button class="btn btn-o btn-sm" onclick="deleteProduct(\''+p.id+'\')">Eliminar</button></div></div>';}).join('')+
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
  renderAdminContent('stock');
  showToast('Cambios revertidos');
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
