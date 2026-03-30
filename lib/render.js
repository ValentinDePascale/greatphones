// =========== DATA ===========
var PRODUCTS=[
  {id:0,ico:'📱',name:'iPhone 15 Pro',brand:'iPhone',sub:'256 GB Titanio',cond:'Impecable',cls:'b-imp',price:1150000,cost:950000,bat:94,stock:3,score:94,offer:false,discount:0,color:'Titanio',screen:6.1,type:'celular',sold:14},
  {id:1,ico:'💻',name:'MacBook Air M2',brand:'MacBook',sub:'256 GB Midnight',cond:'Impecable',cls:'b-imp',price:2100000,cost:1750000,bat:97,stock:2,score:97,offer:false,discount:0,color:'Midnight',screen:13.6,type:'laptop',sold:8},
  {id:2,ico:'📱',name:'iPhone 14',brand:'iPhone',sub:'128 GB Azul',cond:'Muy bueno',cls:'b-mb',price:680000,cost:520000,bat:85,stock:5,score:85,offer:true,discount:12,color:'Azul',screen:6.1,type:'celular',sold:22},
  {id:3,ico:'🌌',name:'Galaxy S24 Ultra',brand:'Samsung',sub:'512 GB Phantom',cond:'Nuevo',cls:'b-new',price:1420000,cost:1180000,bat:100,stock:4,score:98,offer:false,discount:0,color:'Phantom',screen:6.8,type:'celular',sold:6},
  {id:4,ico:'🖥',name:'iPad Pro M4',brand:'iPad',sub:'256 GB Silver',cond:'Nuevo',cls:'b-new',price:1850000,cost:1530000,bat:100,stock:2,score:99,offer:false,discount:0,color:'Silver',screen:11,type:'tablet',sold:4},
  {id:5,ico:'📱',name:'iPhone 13 Pro',brand:'iPhone',sub:'256 GB Sierra Blue',cond:'Muy bueno',cls:'b-mb',price:520000,cost:390000,bat:81,stock:3,score:81,offer:true,discount:15,color:'Sierra Blue',screen:6.1,type:'celular',sold:31},
  {id:6,ico:'📱',name:'iPhone 12 Pro',brand:'iPhone',sub:'256 GB Grafito',cond:'Bueno',cls:'b-mb',price:310000,cost:220000,bat:78,stock:6,score:72,offer:false,discount:0,color:'Grafito',screen:6.1,type:'celular',sold:18},
  {id:7,ico:'🗼',name:'iMac 24 M3',brand:'iMac',sub:'256 GB Azul',cond:'Nuevo',cls:'b-new',price:2800000,cost:2350000,bat:100,stock:1,score:99,offer:false,discount:0,color:'Azul',screen:24,type:'desktop',sold:2},
  {id:8,ico:'📱',name:'iPhone 16 Pro',brand:'iPhone',sub:'256 GB Desert Titanium',cond:'Nuevo',cls:'b-new',price:1650000,cost:1380000,bat:100,stock:2,score:100,offer:false,discount:0,color:'Desert Titanium',screen:6.3,type:'celular',sold:9},
  {id:9,ico:'🌌',name:'Galaxy S23+',brand:'Samsung',sub:'256 GB Phantom',cond:'Impecable',cls:'b-imp',price:580000,cost:440000,bat:91,stock:4,score:91,offer:true,discount:10,color:'Phantom',screen:6.6,type:'celular',sold:12},
  {id:10,ico:'👨‍💻',name:'Moto Edge 50 Pro',brand:'Motorola',sub:'256 GB Negro',cond:'Nuevo',cls:'b-new',price:350000,cost:275000,bat:100,stock:6,score:95,offer:false,discount:0,color:'Negro',screen:6.7,type:'celular',sold:7},
  {id:11,ico:'🔴',name:'Xiaomi 13T',brand:'Xiaomi',sub:'256 GB Alpine Blue',cond:'Muy bueno',cls:'b-mb',price:280000,cost:210000,bat:87,stock:5,score:87,offer:false,discount:0,color:'Alpine Blue',screen:6.67,type:'celular',sold:5}
];
var REPAIRS=[
  {id:0,ico:'📱',t:'Pantalla rota',d:'iPhone, Samsung',price:120000},
  {id:1,ico:'🔋',t:'Cambio de bateria',d:'Bateria original',price:65000},
  {id:2,ico:'📷',t:'Reparacion camara',d:'Trasera o delantero',price:85000},
  {id:3,ico:'🔊',t:'Altavoz',d:'Sin sonido',price:55000},
  {id:4,ico:'🔌',t:'Conector carga',d:'Lightning, USB-C',price:70000}
];
var ACCS=[
  {id:0,ico:'🔌',name:'Cargador USB-C 30W',sub:'Carga rapida',price:22000,cat:'cargadores'},
  {id:1,ico:'🔌',name:'Cargador MagSafe 15W',sub:'Original Apple',price:38000,cat:'cargadores'},
  {id:2,ico:'🧣',name:'AirPods Pro 2da gen',sub:'Cancelacion ruido',price:280000,cat:'auriculares'},
  {id:3,ico:'🧣',name:'JBL Tune 720BT',sub:'Over-ear Pure Bass',price:120000,cat:'auriculares'},
  {id:4,ico:'🔊',name:'JBL Flip 7',sub:'Portatil 20hs',price:165000,cat:'parlantes'},
  {id:5,ico:'🔊',name:'JBL Charge 5',sub:'Resistente agua',price:235000,cat:'parlantes'},
  {id:6,ico:'🛡',name:'Funda MagSafe clara',sub:'iPhone proteccion',price:14000,cat:'fundas'},
  {id:7,ico:'🛡',name:'Funda silicona Apple',sub:'Todos colores',price:28000,cat:'fundas'}
];
var SELL_MODELS={
  iPhone:['iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15','iPhone 16'],
  iPad:['iPad Air M2','iPad Pro 11 M4'],
  MacBook:['MacBook Air M2','MacBook Air M3'],
  Samsung:['Galaxy S23','Galaxy S24'],
  Motorola:['Moto G54','Edge 50 Pro'],
  Xiaomi:['Redmi Note 13','Xiaomi 13T']
};
var COTIZ_BASE={
  'iPhone 11':78000,'iPhone 12':142000,'iPhone 13':245000,'iPhone 14':380000,'iPhone 15':615000,'iPhone 16':895000,
  'iPad Air M2':280000,'iPad Pro 11 M4':520000,'MacBook Air M2':615000,'MacBook Air M3':775000,
  'Galaxy S23':220000,'Galaxy S24':380000,'Moto G54':35000,'Edge 50 Pro':145000,'Redmi Note 13':58000,'Xiaomi 13T':115000
};
var GUARANTEES=[
  {client:'Martina Garcia',equipo:'iPhone 15 Pro',tipo:'90 dias',vence:'2025-06-15',estado:'Activa'},
  {client:'Carlos Ruiz',equipo:'MacBook Air M2',tipo:'12 meses',vence:'2026-03-18',estado:'Activa'}
];
var NOTIFICATIONS=[
  {id:0,type:'offer',title:'iPhone 16 Pro - NUEVO',text:'Stock limitado.',time:'Hace 1h',read:false},
  {id:1,type:'loyalty',title:'5% descuento',text:'Por tu historial.',time:'Hace 3h',read:false}
];
var CONVERSATIONS=[
  {id:'c1',cn:'Martina Garcia',ini:'MG',subj:'Compra iPhone 15 Pro',type:'compra',unread:1,msgs:[
    {from:'admin',txt:'Hola Martina! Tu equipo fue procesado.',img:null,ts:'10:30'},
    {from:'client',txt:'Perfecto!',img:null,ts:'10:45'}
  ]}
];

// =========== STATE ===========
var favorites=[], Cart=[], currentProd=null;
var detWMult=0, detDExtra=0, selCuotas=1;
var shopFilter='todos', accFilter='todos';
var adminLoggedIn=false;
var sv={cat:'iPhone',model:'',storage:'',cond:'',condMult:1,envio:'',cobro:'',price:0};

// =========== RENDER ===========
function renderGrid(gid,prods){
  var grid=document.getElementById(gid);
  if(!grid)return;
  if(!prods.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray);font-size:12px">No hay productos.</div>';return;}
  grid.innerHTML=prods.map(function(p){
    var isFav=hasFav(p.id);
    return '<div class="sgcard" onclick="openDetail('+p.id+')">' +
      '<div class="sgcard-img">'+p.ico+'<span class="bdg '+p.cls+'" style="position:absolute;top:6px;left:6px">'+p.cond+'</span>'+(p.offer?'<span class="bdg b-red" style="position:absolute;bottom:6px;left:6px">-'+p.discount+'%</span>':'')+'</div>' +
      '<div class="sgcard-body"><div class="sgcard-name">'+p.name+'</div><div class="sgcard-sub">'+p.sub+'</div><div class="sgcard-btm"><span class="sgcard-price">'+fmt(p.price)+'</span></div></div></div>';
  }).join('');
}
function renderHomeRail(){
  var rail=document.getElementById('homeRail');
  if(!rail)return;
  rail.innerHTML=PRODUCTS.slice(0,6).map(function(p){
    return '<div class="pcard" onclick="openDetail('+p.id+')"><div class="pcard-img">'+p.ico+'</div><div class="pcard-body"><div class="pcard-name">'+p.name+'</div><div class="pcard-sub">'+p.sub+'</div><div class="pcard-price">'+fmt(p.price)+'</div></div></div>';
  }).join('');
}
function renderOfferStrip(){
  var strip=document.getElementById('offerStrip');
  if(!strip)return;
  var offers=PRODUCTS.filter(function(p){return p.offer;});
  strip.innerHTML=offers.map(function(p){
    var oldP=Math.round(p.price/(1-p.discount/100));
    return '<div class="oc" onclick="openDetail('+p.id+')"><div class="oc-img">'+p.ico+'<span class="oc-disc">-'+p.discount+'%</span></div><div class="oc-body"><div class="oc-name">'+p.name+'</div><div class="oc-old">'+fmt(oldP)+'</div><div class="oc-price">'+fmt(p.price)+'</div></div></div>';
  }).join('');
}
function renderShopGrid(){
  var grid=document.getElementById('shopGrid');
  var count=document.getElementById('shopCount');
  if(!grid)return;
  var prods=PRODUCTS;
  if(shopFilter!=='todos'){
    if(shopFilter==='fav')prods=PRODUCTS.filter(function(p){return hasFav(p.id);});
    else prods=PRODUCTS.filter(function(p){return p.brand===shopFilter;});
  }
  if(count)count.textContent=prods.length+' productos';
  renderGrid('shopGrid',prods);
}
function renderOfertasGrid(){
  var grid=document.getElementById('ofertasGrid');
  if(!grid)return;
  var offers=PRODUCTS.filter(function(p){return p.offer;});
  renderGrid('ofertasGrid',offers);
}
function renderRepairGrid(){
  var grid=document.getElementById('repairGrid');
  if(!grid)return;
  grid.innerHTML=REPAIRS.map(function(r){
    return '<div class="repair-card"><div class="rc-ico">'+r.ico+'</div><div class="rc-t">'+r.t+'</div><div class="rc-d">'+r.d+'</div><div class="rc-price">'+fmt(r.price)+'</div></div>';
  }).join('');
}
function renderAccGrid(){
  var grid=document.getElementById('accGrid');
  if(!grid)return;
  var accs=ACCS;
  if(accFilter!=='todos')accs=ACCS.filter(function(a){return a.cat===accFilter;});
  grid.innerHTML=accs.map(function(a){
    return '<div class="acc-card"><div class="acc-img">'+a.ico+'</div><div class="acc-body"><div class="acc-name">'+a.name+'</div><div class="acc-sub">'+a.sub+'</div><div class="acc-price">'+fmt(a.price)+'</div></div><button class="acc-add">Agregar</button></div>';
  }).join('');
}
function renderFavGrid(){
  var grid=document.getElementById('favGrid'),empty=document.getElementById('favEmpty'),cnt=document.getElementById('favCount');
  var prods=PRODUCTS.filter(function(p){return hasFav(p.id);});
  if(!prods.length){if(grid)grid.style.display='none';if(empty)empty.style.display='block';if(cnt)cnt.textContent='0 guardados';return;}
  if(empty)empty.style.display='none';if(grid)grid.style.display='grid';
  if(cnt)cnt.textContent=prods.length+' guardado'+(prods.length!==1?'s':'');
  renderGrid('favGrid',prods);
}
function openDetail(id){
  currentProd=getById(PRODUCTS,id);
  if(!currentProd)return;
  document.getElementById('detIco').innerHTML=currentProd.ico;
  document.getElementById('detName').textContent=currentProd.name;
  document.getElementById('detMeta').textContent=currentProd.sub+' — Bateria '+currentProd.bat+'%';
  document.getElementById('detPrice').textContent=fmt(currentProd.price);
  document.getElementById('detScore').textContent=currentProd.score;
  document.getElementById('detTotal').textContent=fmt(currentProd.price);
  detWMult=0;detDExtra=0;
  var fb=document.getElementById('detFavBtn');
  var isFav=hasFav(currentProd.id);
  fb.innerHTML=isFav?'♥':'♡';
  fb.classList.toggle('saved',isFav);
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
function toggleAdvFilters(){
  var el=document.getElementById('advFilters');
  var arrow=document.getElementById('afArrow');
  el.classList.toggle('open');
  if(arrow)arrow.style.transform=el.classList.contains('open')?'rotate(180deg)':'';
}
function clearAdvF(){
  document.getElementById('af-st').value='';
  document.getElementById('af-cd').value='';
  document.getElementById('af-p1').value='';
  document.getElementById('af-p2').value='';
  renderShopGrid();
}
function renderDash(){
  var stats=document.getElementById('dashStats');
  if(stats)stats.innerHTML='<div class="stat-card"><div class="stat-lbl">Ventas hoy</div><div class="stat-val">$0</div></div><div class="stat-card"><div class="stat-lbl">Pedidos</div><div class="stat-val">0</div></div><div class="stat-card"><div class="stat-lbl">Productos</div><div class="stat-val">'+PRODUCTS.length+'</div></div><div class="stat-card"><div class="stat-lbl">Clientes</div><div class="stat-val">0</div></div>';
}
function renderOrderHistory(){
  var list=document.getElementById('orderHistory');
  if(list)list.innerHTML='<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">iPhone 15 Pro</div><div class="oi-s">GP-2025-0001 · 15 mar</div></div><div><div class="oi-p">$1.150.000</div><span class="oi-bdg b-ok">Entregado</span></div></div>';
}
function renderQuotHistory(){
  var list=document.getElementById('quotHistory');
  if(list)list.innerHTML='<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">iPhone 13 Pro</div><div class="oi-s">Cotizacion · 10 mar</div></div><div><div class="oi-p">$520.000</div><span class="oi-bdg b-ok">Aprobada</span></div></div>';
}

// =========== INIT ===========
document.addEventListener('DOMContentLoaded',function(){
  renderHomeRail();
  renderOfferStrip();
  renderShopGrid();
  renderOfertasGrid();
  renderRepairGrid();
  renderAccGrid();
  renderDash();
  renderOrderHistory();
  renderQuotHistory();
  renderClientConvList();
});
