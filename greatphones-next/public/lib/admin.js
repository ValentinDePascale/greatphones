// =========== ADMIN ===========
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':window.location.origin);

function adminLogin(){notAvailable();}
function adminLogout(){}
function showAdmin(){nav('admin');}

function adminTab(tab,btn){
  window.currentAdminTab=tab;
  document.querySelectorAll('.fchip[id^="adm-"]').forEach(function(c){c.classList.remove('act');});
  document.querySelectorAll('.atab').forEach(function(c){c.classList.remove('act');});
  document.querySelectorAll('.admin-sec').forEach(function(s){s.classList.remove('act');});
  if(btn)btn.classList.add('act');
  var sec=document.getElementById('as-'+tab);
  if(sec)sec.classList.add('act');
  if(tab==='chat'){
    loadAdminConversations();
    initChatSocket();
  }
  renderAdminContent(tab);
}

function renderAdminContent(tab){
  var content=document.getElementById('adminContent');
  if(!content){
    console.log('adminContent not found');
    content=document.getElementById('adminTabs');
  }
  if(!content){
    console.log('adminTabs not found either');
    return;
  }
  if(tab==='prods'){
    content.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;align-items:center">'+
      '<input type="text" id="prodSearchInput" placeholder="Buscar por nombre, marca..." oninput="loadAdminProducts(this.value,1)" style="flex:1;max-width:300px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
      '<button class="btn btn-o" onclick="nav(\'admin-product\')">+ Nuevo Producto</button>'+
    '</div><div class="adm-list" id="prodList"></div><div id="prodPagination"></div>';
    loadAdminProducts();
  }else if(tab==='acc'){
    content.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;align-items:center">'+
      '<input type="text" id="accSearchInput" placeholder="Buscar por nombre, categoria..." oninput="loadAdminAccessories(this.value,1)" style="flex:1;max-width:300px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
      '<button class="btn btn-o" onclick="nav(\'admin-acc\')">+ Nuevo Accesorio</button>'+
    '</div><div class="adm-list" id="accList"></div><div id="accPagination"></div>';
    loadAdminAccessories();
  }else if(tab==='orders'){
    content.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">'+
      '<button class="ord-btn ord-btn-act" id="btnPendingOrders" onclick="loadPendingOrders()">Pedidos en Espera</button>'+
      '<button class="ord-btn" id="btnAcceptedOrders" onclick="loadAcceptedOrders()">Pedidos Aceptados</button>'+
      '<button class="ord-btn" id="btnHistoryOrders" onclick="loadOrderHistory()">Historial</button>'+
    '</div>'+
    '<div style="margin-bottom:1rem;display:flex;gap:8px;align-items:center">'+
      '<input type="text" id="orderSearchInput" placeholder="Buscar por DNI, email, nombre o código de orden..." oninput="searchOrders(this.value)" style="flex:1;max-width:500px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
    '</div>'+
    '<div class="adm-list" id="orderList"></div><div id="orderPagination"></div>';
    loadPendingOrders();
  }else{
    content.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">SecciÃ³n en desarrollo</div>';
  }
}

function loadAdminProducts(search,page){
  var list=document.getElementById('prodList');
  if(!list)return;
  var url=API_URL+'/api/products?page='+(page||1)+'&limit=20';
  if(search)url+='&search='+encodeURIComponent(search);
  fetch(url).then(function(r){return r.json();}).then(function(res){
    var prods=res.data||res;
    list.innerHTML=prods.map(function(p){
      return'<div class="adm-item"><div class="adm-item-img">'+(p.imageUrl?'<img src="'+p.imageUrl+'">':'<span>📱</span>')+'</div><div class="adm-item-info"><div class="adm-item-name">'+p.name+'</div><div class="adm-item-sub">'+p.brand+' '+p.sub+'</div><div class="adm-item-price">$'+p.price.toLocaleString('es-AR')+'</div></div><div class="adm-item-actions"><button onclick="editProduct(\''+p.id+'\')">✏️</button><button onclick="deleteProduct(\''+p.id+'\')">🗑️</button></div></div>';
    }).join('');
    renderPagination('prodList',res.page,res.totalPages,function(p){loadAdminProducts(search,p);});
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando productos</div>';});
}

function loadAdminAccessories(search,page){
  var list=document.getElementById('accList');
  if(!list)return;
  var url=API_URL+'/api/accessories?page='+(page||1)+'&limit=20';
  if(search)url+='&search='+encodeURIComponent(search);
  fetch(url).then(function(r){return r.json();}).then(function(res){
    var accs=res.data||res;
    list.innerHTML=accs.map(function(a){
      return'<div class="adm-item"><div class="adm-item-img">'+(a.imageUrl?'<img src="'+a.imageUrl+'">':'<span>📦</span>')+'</div><div class="adm-item-info"><div class="adm-item-name">'+a.name+'</div><div class="adm-item-sub">'+a.category+'</div><div class="adm-item-price">$'+a.price.toLocaleString('es-AR')+'</div></div><div class="adm-item-actions"><button onclick="editAccessory(\''+a.id+'\')">✏️</button><button onclick="deleteAccessory(\''+a.id+'\')">🗑️</button></div></div>';
    }).join('');
    renderPagination('accList',res.page,res.totalPages,function(p){loadAdminAccessories(search,p);});
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando accesorios</div>';});
}

// =========== ORDERS ===========
window._currentOrders=[];
window._currentOrderTab='pending';

function setActiveOrderBtn(activeId){
  ['btnPendingOrders','btnAcceptedOrders','btnHistoryOrders'].forEach(function(id){
    var btn=document.getElementById(id);
    if(!btn)return;
    if(id===activeId){
      btn.classList.add('ord-btn-act');
      btn.classList.remove('ord-btn');
    }else{
      btn.classList.add('ord-btn');
      btn.classList.remove('ord-btn-act');
    }
  });
}

function loadPendingOrders(page){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnPendingOrders');
  window._currentOrderTab='pending';
  
  var url=API_URL+'/api/orders?admin=true&status=PENDING&page='+(page||1)+'&limit=20';
  fetch(url).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(res){
    if(res.error){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">'+res.error+'</div>';return;}
    var ords=res.data||res;
    window._currentOrders=ords;
    window._currentOrderPage=res.page||1;
    window._currentOrderTotalPages=res.totalPages||1;
    renderOrdersList(ords);
    renderPagination('orderList',res.page,res.totalPages,function(p){loadPendingOrders(p);});
  }).catch(function(e){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando pedidos: '+e.message+'</div>';});
}

function loadAcceptedOrders(page){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnAcceptedOrders');
  window._currentOrderTab='accepted';
  
  var url=API_URL+'/api/orders?admin=true&status=PROCESSING,SHIPPED&page='+(page||1)+'&limit=20';
  fetch(url).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(res){
    if(res.error){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">'+res.error+'</div>';return;}
    var ords=res.data||res;
    window._currentOrders=ords;
    window._currentOrderPage=res.page||1;
    window._currentOrderTotalPages=res.totalPages||1;
    renderOrdersList(ords);
    renderPagination('orderList',res.page,res.totalPages,function(p){loadAcceptedOrders(p);});
  }).catch(function(e){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando pedidos aceptados: '+e.message+'</div>';});
}

function loadOrderHistory(page){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnHistoryOrders');
  window._currentOrderTab='history';
  
  var url=API_URL+'/api/orders?admin=true&status=DELIVERED,CANCELLED&page='+(page||1)+'&limit=20';
  fetch(url).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(res){
    if(res.error){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">'+res.error+'</div>';return;}
    var ords=res.data||res;
    window._currentOrders=ords;
    window._currentOrderPage=res.page||1;
    window._currentOrderTotalPages=res.totalPages||1;
    renderOrdersList(ords);
    renderPagination('orderList',res.page,res.totalPages,function(p){loadOrderHistory(p);});
  }).catch(function(e){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando historial: '+e.message+'</div>';});
}

function searchOrders(query){
  var list=document.getElementById('orderList');
  if(!list)return;
  if(!query||!query.trim()){
    if(window._currentOrderTab==='pending')loadPendingOrders();
    else if(window._currentOrderTab==='accepted')loadAcceptedOrders();
    else loadOrderHistory();
    return;
  }
  var url=API_URL+'/api/orders?admin=true&search='+encodeURIComponent(query.trim())+'&page=1&limit=20';
  fetch(url).then(function(r){return r.json();}).then(function(res){
    var ords=res.data||res;
    window._currentOrders=ords;
    window._currentOrderPage=res.page||1;
    window._currentOrderTotalPages=res.totalPages||1;
    renderOrdersList(ords);
    renderPagination('orderList',res.page,res.totalPages,function(p){
      fetch(API_URL+'/api/orders?admin=true&search='+encodeURIComponent(query.trim())+'&page='+p+'&limit=20')
        .then(function(r2){return r2.json();}).then(function(res2){
          window._currentOrders=res2.data||res2;
          renderOrdersList(res2.data||res2);
          renderPagination('orderList',res2.page,res2.totalPages,function(p2){searchOrders(query);});
        });
    });
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error buscando pedidos</div>';});
}

function renderPagination(containerId,currentPage,totalPages,onPageChange){
  var containerIdMap={prodList:'prodPagination',accList:'accPagination',orderList:'orderPagination'};
  var container=document.getElementById(containerIdMap[containerId]||'');
  if(!container||totalPages<=1){if(container)container.innerHTML='';return;}
  var html='<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:1rem;padding:1rem">';
  html+='<button onclick="('+onPageChange.toString()+')('+Math.max(1,currentPage-1)+')"'+(currentPage===1?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">←</button>';
  var start=Math.max(1,currentPage-2);
  var end=Math.min(totalPages,currentPage+2);
  if(start>1)html+='<button onclick="('+onPageChange.toString()+')(1)" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">1</button>';
  if(start>2)html+='<span style="padding:6px;color:var(--gray)">...</span>';
  for(var i=start;i<=end;i++){
    if(i===currentPage)html+='<span style="padding:6px 12px;border-radius:6px;background:var(--orange);color:#fff;font-size:13px;font-weight:600">'+i+'</span>';
    else html+='<button onclick="('+onPageChange.toString()+')('+i+')" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">'+i+'</button>';
  }
  if(end<totalPages-1)html+='<span style="padding:6px;color:var(--gray)">...</span>';
  if(end<totalPages)html+='<button onclick="('+onPageChange.toString()+')('+totalPages+')" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">'+totalPages+'</button>';
  html+='<button onclick="('+onPageChange.toString()+')('+Math.min(totalPages,currentPage+1)+')"'+(currentPage===totalPages?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">→</button>';
  html+='</div>';
  container.innerHTML=html;
}

function renderOrdersList(ords){
  var list=document.getElementById('orderList');
  if(!list)return;
  
  if(!ords||ords.length===0){
    var emptyMsg='No hay pedidos';
    var emptyIcon='📦';
    if(window._currentOrderTab==='pending'){
      emptyMsg='No hay pedidos en espera';
      emptyIcon='📦';
    }else if(window._currentOrderTab==='accepted'){
      emptyMsg='No hay pedidos aceptados';
      emptyIcon='🚚';
    }else if(window._currentOrderTab==='history'){
      emptyMsg='No hay pedidos en el historial';
      emptyIcon='📜';
    }
    list.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">'+emptyIcon+'</p><p style="font-size:16px;font-weight:600;margin-bottom:.5rem">'+emptyMsg+'</p><p style="font-size:13px">Los pedidos apareceran aqui cuando los usuarios compren</p></div>';
    return;
  }
  
  list.innerHTML=ords.map(function(o){
    var date=new Date(o.createdAt);
    var dateStr=date.toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});
    var timeStr=date.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    var userName=o.user?o.user.name:'Cliente';
    var userEmail=o.user?o.user.email:(o.clientEmail||'');
    var itemsCount=o.items?o.items.length:0;
    var itemsSummary=o.items?o.items.map(function(i){return i.productName||i.name;}).join(', '):'';
    var deliveryLabel='Retiro en tienda';
    if(o.shippingProvince&&o.shippingProvince!=='Buenos Aires'){
      deliveryLabel='Envio al pais';
    }else if(o.shippingCity==='Bahia Blanca'||o.shippingProvince==='Buenos Aires'){
      deliveryLabel='Envio en Bahia Blanca';
    }
    var statusColor=o.status==='PENDING'?'var(--orange)':o.status==='PROCESSING'?'#3b82f6':o.status==='SHIPPED'?'#8b5cf6':o.status==='DELIVERED'?'var(--green)':'var(--red)';
    var arrepBadge='';
    if(o.arrepStatus==='ARREP_OK'){
      arrepBadge='<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#dcfce7;color:#059669;font-weight:600">ArrepentimientoOk</span>';
    }else if(o.arrepStatus==='ARREP_RECHAZADO'){
      arrepBadge='<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:#fef2f2;color:#dc2626;font-weight:600">Arrepentimiento Rechazado</span>';
    }
    return'<div class="adm-item" onclick="openOrderDetail(\''+o.id+'\')" style="cursor:pointer" onmouseover="this.style.background=\'rgba(255,107,44,.03)\'" onmouseout="this.style.background=\'\'">'+
      '<div class="adm-item-info">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap">'+
          '<span class="adm-item-name">'+o.code+'</span>'+
          '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:'+statusColor+'20;color:'+statusColor+';font-weight:600">'+o.status+'</span>'+
          (arrepBadge?arrepBadge:'')+
        '</div>'+
        '<div class="adm-item-sub">'+userName+' · '+userEmail+'</div>'+
        (o.clientDni?'<div class="adm-item-sub">DNI: '+o.clientDni+'</div>':'')+
        '<div class="adm-item-sub">'+itemsCount+' producto(s): '+itemsSummary.substring(0,60)+(itemsSummary.length>60?'...':'')+'</div>'+
        '<div class="adm-item-sub">'+deliveryLabel+' · '+dateStr+' '+timeStr+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div class="adm-item-price">$'+o.total.toLocaleString('es-AR')+'</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-top:2px">Click para ver detalle</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function openOrderDetail(orderId){
  fetch(API_URL+'/api/orders?admin=true&page=1&limit=100').then(function(r){return r.json();}).then(function(res){
    var ords=res.data||res;
    var order=ords.find(function(o){return o.id===orderId;});
    if(!order){showToast('Pedido no encontrado');return;}
    showOrderModal(order);
  }).catch(function(e){showToast('Error cargando pedido: '+e.message);});
}

function showOrderModal(order){
  var existing=document.getElementById('orderDetailModal');
  if(existing)existing.remove();
  
  var date=new Date(order.createdAt);
  var dateStr=date.toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  var userName=order.user?order.user.name:'Cliente';
  var userEmail=order.user?order.user.email:(order.clientEmail||'');
  var userPhone=order.user?order.user.phone:(order.clientPhone||'');
  var userDni=order.clientDni||'';
  
  var deliveryLabel='Retiro en tienda';
  var deliveryAddress='';
  if(order.shippingProvince&&order.shippingProvince!=='Buenos Aires'){
    deliveryLabel='Envio al pais';
    deliveryAddress=[order.shippingStreet,order.shippingNumber,order.shippingFloor,order.shippingCity,order.shippingProvince,order.shippingZip].filter(Boolean).join(', ');
  }else if(order.shippingCity==='Bahia Blanca'||order.shippingProvince==='Buenos Aires'){
    deliveryLabel='Envio en Bahia Blanca';
    deliveryAddress=[order.shippingStreet,order.shippingNumber,order.shippingFloor,order.shippingCity,order.shippingProvince,order.shippingZip].filter(Boolean).join(', ');
  }
  
  var itemsHtml=(order.items||[]).map(function(item){
    var img=item.productImage?'<img src="'+item.productImage+'" style="width:48px;height:48px;object-fit:cover;border-radius:8px">':'<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">📱</div>';
    return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
      img+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:600">'+(item.productName||item.name)+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">'+(item.productBrand||'')+' '+(item.productSub||'')+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.quantity+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:14px;font-weight:600">$'+(item.price*item.quantity).toLocaleString('es-AR')+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">$'+item.price.toLocaleString('es-AR')+' c/u</div>'+
      '</div>'+
    '</div>';
  }).join('');
  
  var paymentLabel='Pago en 1 cuota';
  if(order.cuotas&&order.cuotas>1){
    paymentLabel='Pago en '+order.cuotas+' cuotas';
  }
  if(order.payment){
    paymentLabel=order.payment;
  }
  
  var warrantyLabel='Sin garantia';
  if(order.warranty){
    warrantyLabel='Garantia: '+order.warranty;
    if(order.warrantyCost&&order.warrantyCost>0){
      warrantyLabel+=' (+$'+order.warrantyCost.toLocaleString('es-AR')+')';
    }
  }
  
  var actionBtn='';
  if(order.status==='PENDING'){
    actionBtn='<button onclick="acceptOrder(\''+order.id+'\')" style="width:100%;padding:14px;background:var(--orange);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:1rem">Aceptar pedido</button>';
  }else if(order.status==='PROCESSING'){
    actionBtn='<div style="margin-top:1rem">'+
      '<button onclick="shipOrder(\''+order.id+'\')" style="width:100%;padding:14px;background:#8b5cf6;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">Marcar como enviado</button>'+
      '<button onclick="finalizeOrder(\''+order.id+'\')" style="width:100%;padding:14px;background:var(--green);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Finalizar pedido</button>'+
    '</div>';
  }else if(order.status==='SHIPPED'){
    actionBtn='<button onclick="finalizeOrder(\''+order.id+'\')" style="width:100%;padding:14px;background:var(--green);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:1rem">Finalizar pedido</button>';
  }
  
  var modal=document.createElement('div');
  modal.id='orderDetailModal';
  modal.style.cssText='display:flex;position:fixed;inset:0;z-index:900;align-items:center;justify-content:center;opacity:0;transition:opacity .3s';
  modal.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeOrderDetail()"></div>'+
    '<div style="position:relative;background:#fff;border-radius:20px;width:min(700px,95%);max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.35);transform:scale(.9);transition:transform .3s">'+
      '<div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:10;border-radius:20px 20px 0 0">'+
        '<div>'+
          '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:20px;font-weight:700">'+order.code+'</h3>'+
          '<p style="font-size:12px;color:var(--gray)">'+dateStr+'</p>'+
        '</div>'+
        '<button onclick="closeOrderDetail()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray);width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%" onmouseover="this.style.background=\'var(--cream2)\'" onmouseout="this.style.background=\'none\'">×</button>'+
      '</div>'+
      '<div style="padding:1.5rem 2rem">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">'+
          '<div style="background:var(--cream2);border-radius:12px;padding:1rem">'+
            '<div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Cliente</div>'+
            '<div style="font-size:14px;font-weight:600">'+userName+'</div>'+
            '<div style="font-size:12px;color:var(--gray)">'+userEmail+'</div>'+
            (userPhone?'<div style="font-size:12px;color:var(--gray)">'+userPhone+'</div>':'')+
            (userDni?'<div style="font-size:12px;color:var(--gray)">DNI: '+userDni+'</div>':'')+
          '</div>'+
          '<div style="background:var(--cream2);border-radius:12px;padding:1rem">'+
            '<div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Envio</div>'+
            '<div style="font-size:14px;font-weight:600">'+deliveryLabel+'</div>'+
            (deliveryAddress?'<div style="font-size:12px;color:var(--gray);margin-top:4px">'+deliveryAddress+'</div>':'')+
            (order.trackingNumber?'<div style="font-size:12px;color:#8b5cf6;margin-top:6px;font-weight:600">Tracking: '+order.trackingNumber+'</div>':'')+
            (order.shippedAt?'<div style="font-size:11px;color:var(--gray);margin-top:2px">Enviado el '+new Date(order.shippedAt).toLocaleDateString('es-AR')+'</div>':'')+
          '</div>'+
        '</div>'+
        '<div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Productos</div>'+
        '<div style="border:1px solid var(--border);border-radius:12px;padding:0 1rem">'+itemsHtml+'</div>'+
        '<div style="margin-top:1.5rem;border-top:2px solid var(--dk);padding-top:1rem">'+
          '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray);margin-bottom:6px">'+
            '<span>Subtotal</span><span>$'+order.subtotal.toLocaleString('es-AR')+'</span>'+
          '</div>'+
          (order.warrantyCost>0?'<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray);margin-bottom:6px"><span>Garantia</span><span>+$'+order.warrantyCost.toLocaleString('es-AR')+'</span></div>':'')+
          (order.deliveryCost>0?'<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray);margin-bottom:6px"><span>Envio</span><span>+$'+order.deliveryCost.toLocaleString('es-AR')+'</span></div>':'')+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">'+
            '<span style="font-size:16px;font-weight:700">Total</span>'+
            '<span style="font-size:22px;font-weight:700;font-family:\'Playfair Display\',serif;color:var(--orange)">$'+order.total.toLocaleString('es-AR')+'</span>'+
          '</div>'+
          (order.cuotas>1?'<div style="text-align:right;font-size:12px;color:var(--green);margin-top:4px">'+order.cuotas+'x sin interes de $'+Math.round(order.total/order.cuotas).toLocaleString('es-AR')+'</div>':'')+
          '<div style="margin-top:12px;padding:10px;background:var(--cream2);border-radius:8px">'+
            '<div style="font-size:12px;color:var(--gray)"><strong>Metodo de pago:</strong> '+paymentLabel+'</div>'+
            '<div style="font-size:12px;color:var(--gray);margin-top:4px">'+warrantyLabel+'</div>'+
          '</div>'+
        '</div>'+
        (order.arrepStatus==='ARREP_OK'?'<div style="margin-top:1rem;padding:12px;background:#f0fdf4;border-radius:10px;border-left:4px solid var(--green)">'+
          '<div style="font-size:12px;font-weight:600;color:#059669;margin-bottom:4px">Arrepentimiento aceptado</div>'+
          '<div style="font-size:11px;color:#6b7280">Devolucion procesada segun Ley 24.240. Reembolso total incluido.</div>'+
        '</div>':'')+
        (order.arrepStatus==='ARREP_RECHAZADO'?'<div style="margin-top:1rem;padding:12px;background:#fef2f2;border-radius:10px;border-left:4px solid var(--red)">'+
          '<div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:6px">Arrepentimiento rechazado</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:4px">'+
            ((order.arrepReason||'').split(';').filter(Boolean).map(function(r){
              var clean=r.trim();
              if(clean.indexOf('Comentario:')!==-1)return'';
              return'<span style="display:inline-block;padding:3px 8px;background:#fef2f2;color:#dc2626;border-radius:5px;font-size:10px;font-weight:500">'+clean+'</span>';
            }).join(''))+
          '</div>'+
          (((order.arrepReason||'').split(';').filter(Boolean).find(function(r){return r.indexOf('Comentario:')!==-1})||'').split('Comentario:')[1]?'<div style="font-size:11px;color:var(--gray);margin-top:6px;padding-top:6px;border-top:1px solid #fecaca"><strong>Comentario:</strong> '+((order.arrepReason||'').split(';').filter(Boolean).find(function(r){return r.indexOf('Comentario:')!==-1})||'').split('Comentario:')[1].trim()+'</div>':'')+
        '</div>':'')+
        actionBtn+
      '</div>'+
    '</div>';
  
  document.body.appendChild(modal);
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
  },10);
}

function closeOrderDetail(){
  var modal=document.getElementById('orderDetailModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.remove();},300);
}

function acceptOrder(orderId){
  if(!confirm('¿Confirmas que aceptas este pedido?')){
    return;
  }
  
  fetch(API_URL+'/api/orders?id='+orderId,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status:'PROCESSING'})
  }).then(function(r){return r.json();}).then(function(){
    showToast('Pedido aceptado');
    closeOrderDetail();
    loadPendingOrders();
  }).catch(function(){showToast('Error aceptando pedido');});
}

function finalizeOrder(orderId){
  if(!confirm('¿Confirmas que el cliente recibio los productos? Esta accion marcara el pedido como finalizado.')){
    return;
  }
  
  fetch(API_URL+'/api/orders?id='+orderId,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status:'DELIVERED'})
  }).then(function(r){return r.json();}).then(function(){
    showToast('Pedido finalizado correctamente');
    closeOrderDetail();
    loadAcceptedOrders();
  }).catch(function(){showToast('Error finalizando pedido');});
}

function shipOrder(orderId){
  var existing=document.getElementById('shipOrderModal');
  if(existing)existing.remove();
  
  var modal=document.createElement('div');
  modal.id='shipOrderModal';
  modal.style.cssText='display:flex;position:fixed;inset:0;z-index:950;align-items:center;justify-content:center;opacity:0;transition:opacity .3s';
  modal.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeShipOrderModal()"></div>'+
    '<div style="position:relative;background:#fff;border-radius:20px;width:min(450px,95%);box-shadow:0 25px 80px rgba(0,0,0,.35);transform:scale(.9);transition:transform .3s">'+
      '<div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border)">'+
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:#8b5cf6">Marcar como enviado</h3>'+
        '<p style="font-size:12px;color:var(--gray);margin-top:4px">Ingresa el numero de tracking del envio</p>'+
      '</div>'+
      '<div style="padding:1.5rem 2rem">'+
        '<label style="font-size:12px;font-weight:600;color:var(--gray);display:block;margin-bottom:6px">Numero de tracking</label>'+
        '<input type="text" id="shipTrackingInput" placeholder="Ej: AR123456789AR" style="width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;box-sizing:border-box;outline:none" onfocus="this.style.borderColor=\'#8b5cf6\'">'+
        '<div style="display:flex;gap:10px;margin-top:1.25rem">'+
          '<button onclick="closeShipOrderModal()" style="flex:1;padding:12px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">Cancelar</button>'+
          '<button onclick="confirmShipOrder(\''+orderId+'\')" style="flex:1;padding:12px;background:#8b5cf6;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Enviar</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  
  document.body.appendChild(modal);
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
    var input=document.getElementById('shipTrackingInput');
    if(input)input.focus();
  },10);
}

function closeShipOrderModal(){
  var modal=document.getElementById('shipOrderModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.remove();},300);
}

function confirmShipOrder(orderId){
  var tracking=document.getElementById('shipTrackingInput').value.trim();
  if(!tracking){
    alert('Ingresa un numero de tracking');
    return;
  }
  
  fetch(API_URL+'/api/orders?id='+orderId,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status:'SHIPPED',trackingNumber:tracking})
  }).then(function(r){return r.json();}).then(function(){
    showToast('Pedido marcado como enviado');
    closeShipOrderModal();
    closeOrderDetail();
    loadAcceptedOrders();
  }).catch(function(){showToast('Error marcando como enviado');});
}

function updateOrderStatus(orderId,status){
  fetch(API_URL+'/api/orders?id='+orderId,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status:status})
  }).then(function(r){return r.json();}).then(function(){
    showToast('Estado actualizado a '+status);
    if(window._currentOrderTab==='pending'){
      loadPendingOrders();
    }else if(window._currentOrderTab==='accepted'){
      loadAcceptedOrders();
    }else{
      loadOrderHistory();
    }
  }).catch(function(){showToast('Error actualizando estado');});
}

// =========== ARREPENTIMIENTOS ===========
window._allArreps=[];

function setArrepBtnActive(activeId){
  ['arrepBtnPendientes','arrepBtnAceptados','arrepBtnRechazados'].forEach(function(id){
    var btn=document.getElementById(id);
    if(!btn)return;
    if(id===activeId){
      btn.classList.add('ord-btn-act');
      btn.classList.remove('ord-btn');
    }else{
      btn.classList.add('ord-btn');
      btn.classList.remove('ord-btn-act');
    }
  });
}

function loadArrepPendientes(){
  setArrepBtnActive('arrepBtnPendientes');
  fetch(API_URL+'/api/arrepentimiento').then(function(r){return r.json();}).then(function(list){
    window._allArreps=list;
    var pendientes=list.filter(function(a){return a.estado==='PENDIENTE';});
    renderArrepList(pendientes,'pendientes');
  }).catch(function(){document.getElementById('arrepList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando</div>';});
}

function loadArrepAceptados(){
  setArrepBtnActive('arrepBtnAceptados');
  fetch(API_URL+'/api/arrepentimiento').then(function(r){return r.json();}).then(function(list){
    window._allArreps=list;
    var aceptados=list.filter(function(a){return a.estado==='APROBADO';});
    renderArrepList(aceptados,'aceptados');
  }).catch(function(){document.getElementById('arrepList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando</div>';});
}

function loadArrepRechazados(){
  setArrepBtnActive('arrepBtnRechazados');
  fetch(API_URL+'/api/arrepentimiento').then(function(r){return r.json();}).then(function(list){
    window._allArreps=list;
    var rechazados=list.filter(function(a){return a.estado==='RECHAZADO';});
    renderArrepList(rechazados,'rechazados');
  }).catch(function(){document.getElementById('arrepList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando</div>';});
}

function renderArrepList(list,tab){
  var el=document.getElementById('arrepList');
  if(!el)return;
  
  if(!list||list.length===0){
    var msgs={
      pendientes:{icon:'📋',title:'No hay arrepentimientos pendientes',sub:'Las solicitudes apareceran aqui cuando los clientes las envien'},
      aceptados:{icon:'✅',title:'No hay arrepentimientos aceptados',sub:'Los arrepentimientos aceptados apareceran aqui'},
      rechazados:{icon:'❌',title:'No hay arrepentimientos rechazados',sub:'Los arrepentimientos rechazados apareceran aqui'}
    };
    var m=msgs[tab]||{icon:'📋',title:'No hay datos',sub:''};
    el.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">'+m.icon+'</p><p style="font-size:16px;font-weight:600;margin-bottom:.5rem">'+m.title+'</p><p style="font-size:13px">'+m.sub+'</p></div>';
    return;
  }
  
  el.innerHTML=list.map(function(a){
    var dateStr=new Date(a.createdAt).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});
    var addr='';
    if(a.orderShipping){
      var parts=[a.orderShipping.street,a.orderShipping.number,a.orderShipping.city,a.orderShipping.province].filter(Boolean);
      addr=parts.join(', ');
    }
    
    var html='<div style="background:#fff;border-radius:12px;padding:16px;border:1px solid var(--border);margin-bottom:10px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
        '<div>'+
          '<div style="font-size:14px;font-weight:700">'+a.email+'</div>'+
          '<div style="font-size:12px;color:var(--gray)">DNI: '+(a.orderDni||'-')+' · Tel: '+(a.telefono||a.orderPhone||'-')+'</div>'+
        '</div>'+
        '<span style="padding:4px 12px;border-radius:12px;background:var(--orange);color:#fff;font-size:11px;font-weight:600">'+a.estado+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">'+
        '<div style="background:var(--cream2);border-radius:8px;padding:10px">'+
          '<div style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;margin-bottom:4px">Orden</div>'+
          '<div style="font-size:13px;font-weight:600">'+(a.orderCode||a.orderId)+'</div>'+
          '<div style="font-size:13px;color:var(--orange);font-weight:700">$'+(a.orderTotal||0).toLocaleString('es-AR')+'</div>'+
        '</div>'+
        '<div style="background:var(--cream2);border-radius:8px;padding:10px">'+
          '<div style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;margin-bottom:4px">Direccion de devolucion</div>'+
          '<div style="font-size:12px">'+(addr||'Retiro en tienda')+'</div>'+
        '</div>'+
      '</div>'+
      (a.motivo?'<div style="font-size:12px;margin-bottom:10px;padding:10px;background:var(--cream2);border-radius:8px"><strong>Motivo:</strong> '+a.motivo+'</div>':'')+
      '<div style="font-size:11px;color:var(--gray);margin-bottom:10px">Solicitado: '+dateStr+'</div>';
    
    if(tab==='pendientes'){
      html+='<div style="display:flex;gap:8px">'+
        '<button class="ord-btn ord-btn-act" onclick="acceptArrep(\''+a.id+'\')" style="flex:1">Aceptar arrepentimiento</button>'+
        '<button class="ord-btn" onclick="rejectArrep(\''+a.id+'\')" style="flex:1;border-color:var(--red);color:var(--red)">Rechazar</button>'+
      '</div>';
    }else if(tab==='aceptados'){
      html+='<div style="padding:10px;background:#f0fdf4;border-radius:8px;border-left:4px solid var(--green)">'+
        '<div style="font-size:12px;font-weight:600;color:#059669">Arrepentimiento aceptado - Devolucion procesada</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-top:4px">Reembolso total segun Ley 24.240</div>'+
      '</div>';
    }else if(tab==='rechazados'){
      var reasonsText=a.reason||'';
      var reasonsParts=reasonsText.split(';').filter(Boolean);
      var comment='';
      var lastPart=reasonsParts[reasonsParts.length-1];
      if(lastPart&&lastPart.indexOf('Comentario:')!==-1){
        comment=lastPart.split('Comentario:')[1].trim();
        reasonsParts.pop();
      }
      var reasonsHtml=reasonsParts.map(function(r){
        return'<span style="display:inline-block;padding:4px 10px;background:#fef2f2;color:#dc2626;border-radius:6px;font-size:11px;font-weight:500;margin:2px">'+r.trim()+'</span>';
      }).join('');
      html+='<div style="padding:10px;background:#fef2f2;border-radius:8px;border-left:4px solid var(--red)">'+
        '<div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:8px">Arrepentimiento rechazado</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">'+reasonsHtml+'</div>'+
        (comment?'<div style="font-size:11px;color:var(--gray);padding-top:6px;border-top:1px solid #fecaca"><strong>Comentario:</strong> '+comment+'</div>':'')+
      '</div>';
    }
    
    html+='</div>';
    return html;
  }).join('');
}

function acceptArrep(id){
  if(!confirm('¿Confirmas que aceptas este arrepentimiento?\n\nSe cancelara la orden y se notificara al cliente con instrucciones de devolucion.\nReembolso total segun Ley 24.240.')){
    return;
  }
  
  fetch(API_URL+'/api/arrepentimiento?id='+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({estado:'APROBADO'})
  }).then(function(r){return r.json();}).then(function(data){
    if(data.success){
      showToast('Arrepentimiento aceptado');
      loadArrepPendientes();
    }else{
      showToast('Error: '+data.message);
    }
  }).catch(function(){showToast('Error de conexion');});
}

function rejectArrep(id){
  var existing=document.getElementById('rejectArrepModal');
  if(existing)existing.remove();
  
  var modal=document.createElement('div');
  modal.id='rejectArrepModal';
  modal.style.cssText='display:flex;position:fixed;inset:0;z-index:900;align-items:center;justify-content:center;opacity:0;transition:opacity .3s';
  modal.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeRejectArrepModal()"></div>'+
    '<div style="position:relative;background:#fff;border-radius:20px;width:min(500px,95%);max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.35);transform:scale(.9);transition:transform .3s">'+
      '<div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border)">'+
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--red)">Rechazar arrepentimiento</h3>'+
        '<p style="font-size:12px;color:var(--gray);margin-top:4px">Selecciona los motivos del rechazo</p>'+
      '</div>'+
      '<div style="padding:1.5rem 2rem">'+
        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1rem">'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Plazo de 10 dias habiles vencido" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Plazo de 10 dias habiles vencido</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Producto danado por el consumidor" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Producto danado por el consumidor</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Producto sin empaque original" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Producto sin empaque original</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Producto usado o con senales de uso" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Producto usado o con senales de uso</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Producto personalizado o perecedero" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Producto personalizado o perecedero</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="arrep-reason-cb" value="Falta documentacion o comprobante de compra" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px">Falta documentacion o comprobante de compra</span>'+
          '</label>'+
        '</div>'+
        '<div style="margin-bottom:1rem">'+
          '<label style="font-size:12px;font-weight:600;color:var(--gray);display:block;margin-bottom:6px">Comentario adicional (opcional)</label>'+
          '<textarea id="arrepRejectComment" rows="3" placeholder="Agrega detalles adicionales sobre el rechazo..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;resize:vertical;box-sizing:border-box;outline:none;font-family:inherit"></textarea>'+
        '</div>'+
        '<div style="display:flex;gap:10px">'+
          '<button onclick="closeRejectArrepModal()" style="flex:1;padding:12px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">Cancelar</button>'+
          '<button onclick="confirmRejectArrep(\''+id+'\')" style="flex:1;padding:12px;background:var(--red);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Rechazar</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  
  document.body.appendChild(modal);
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
  },10);
}

function closeRejectArrepModal(){
  var modal=document.getElementById('rejectArrepModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.remove();},300);
}

function confirmRejectArrep(id){
  var cbs=document.querySelectorAll('.arrep-reason-cb:checked');
  var reasons=[];
  cbs.forEach(function(cb){reasons.push(cb.value);});
  
  var commentEl=document.getElementById('arrepRejectComment');
  var comment=commentEl?commentEl.value.trim():'';
  
  if(reasons.length===0&&comment===''){
    alert('Selecciona al menos un motivo o agrega un comentario');
    return;
  }
  
  var reasonText=reasons.join('; ');
  if(comment){
    reasonText=reasonText?(reasonText+' | Comentario: '+comment):comment;
  }
  
  fetch(API_URL+'/api/arrepentimiento?id='+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({estado:'RECHAZADO',rejectReason:reasonText})
  }).then(function(r){return r.json();}).then(function(data){
    if(data.success){
      showToast('Arrepentimiento rechazado');
      closeRejectArrepModal();
      loadArrepPendientes();
    }else{
      showToast('Error: '+data.message);
    }
  }).catch(function(){showToast('Error de conexion');});
}

// =========== ACCESSORY FUNCTIONS ===========
window.accAdditionalImages=[];

function handleAccImageDrop(e){
  e.preventDefault();
  var files=e.dataTransfer.files;
  if(files.length>0)uploadAccImageFile(files[0]);
}

function uploadAccImage(input){
  if(input.files&&input.files[0])uploadAccImageFile(input.files[0]);
}

function uploadAccImageFile(file){
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      document.getElementById('accImageUrl').value=data.url;
      document.getElementById('accImagePreview').innerHTML='<img src="'+data.url+'" style="width:100%;height:100%;object-fit:cover">';
    }
  }).catch(function(){alert('Error uploading image');});
}

function uploadAccAdditionalImages(input){
  if(input.files){
    Array.from(input.files).forEach(function(file){
      var formData=new FormData();
      formData.append('file',file);
      fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
        if(data.url){
          window.accAdditionalImages.push(data.url);
          renderAccAdditionalImagesList();
        }
      });
    });
  }
}

function removeAccImage(btn,url){
  var idx=window.accAdditionalImages.indexOf(url);
  if(idx>-1)window.accAdditionalImages.splice(idx,1);
  btn.parentElement.remove();
  if(!window.accAdditionalImages.length){
    var container=document.getElementById('accAdditionalImages');
    if(container&&!document.getElementById('addAccImgPlaceholder')){
      container.innerHTML='<div id="addAccImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
    }
  }
}

function saveAccessory(){
  var id=document.getElementById('accId').value;
  var data={};
  
  data.name=document.getElementById('accName').value;
  data.price=parseInt(document.getElementById('accPrice').value)||0;
  data.stock=parseInt(document.getElementById('accStock').value)||0;
  data.category=document.getElementById('accCategory').value;
  data.brand=document.getElementById('accBrand').value;
  data.description=document.getElementById('accDescription').value;
  data.color=document.getElementById('accColor').value;
  data.ico=document.getElementById('accIco').value;
  data.imageUrl=document.getElementById('accImageUrl').value;
  data.images=window.accAdditionalImages||[];
  data.compatibleModels=document.getElementById('accCompatibleModels').value||null;
  
  if(!data.name||!data.price){
    alert('Nombre y precio son requeridos');
    return;
  }
  
  var method=id?'PUT':'POST';
  var endpoint=id?'/api/accessories?id='+id:'/api/accessories';
  
  fetch(API_URL+endpoint,{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).then(function(r){
    if(!r.ok)throw new Error('Error '+r.status);
    return r.json();
  }).then(function(result){
    if(result.error||result.success===false)throw new Error(result.message||'Error de validación');
    showToast(id?'Accesorio actualizado':'Accesorio creado');
    resetAccessoryForm();
    loadAccessories();
    nav('admin');
    renderAdminContent('acc');
  }).catch(function(e){alert('Error: '+e.message);});
}

function editAccessory(id){
  window.isEditingAcc=true;
  var accFromMemory=getById(window.ACCS||[],id);
  fetch(API_URL+'/api/accessories?id='+id).then(function(r){
    if(!r.ok)throw new Error('Network error');
    return r.json();
  }).then(function(a){
    if(!a)throw new Error('No data');
    fillAccForm(a);
  }).catch(function(){
    if(accFromMemory){
      fillAccForm(accFromMemory);
    }else{
      alert('Error cargando accesorio');
      window.isEditingAcc=false;
      return;
    }
  });
}
function fillAccForm(a){
  document.getElementById('accId').value=a.id;
  document.getElementById('accName').value=a.name||'';
  document.getElementById('accPrice').value=a.price||'';
  document.getElementById('accStock').value=a.stock||0;
  document.getElementById('accCategory').value=a.category||'Cargadores';
  document.getElementById('accBrand').value=a.brand||'';
  document.getElementById('accDescription').value=a.description||'';
  document.getElementById('accColor').value=a.color||'';
  document.getElementById('accIco').value=a.ico||'\uD83D\uDCE6';
  document.getElementById('accImageUrl').value=a.imageUrl||'';
  document.getElementById('accCompatibleModels').value=a.compatibleModels||'';
  window.accAdditionalImages=Array.isArray(a.images)?a.images.slice():[];
  if(a.imageUrl){
    document.getElementById('accImagePreview').innerHTML='<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">';
  }
  document.getElementById('accFormTitle').textContent='Editar Accesorio';
  document.getElementById('accFormSubtitle').textContent=a.name;
  window.isEditingAcc=true;
  renderAccAdditionalImagesList();
  nav('admin-acc');
}

function renderAccAdditionalImagesList(){
  var container=document.getElementById('accAdditionalImages');
  if(!container)return;
  container.innerHTML='';
  if(!window.accAdditionalImages.length){
    container.innerHTML='<div id="addAccImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
    return;
  }
  window.accAdditionalImages.forEach(function(url){
    var div=document.createElement('div');
    div.style.cssText='width:60px;height:60px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0';
    div.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover"><button onclick="removeAccImage(this,\''+url+'\')" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:12px">\u00D7</button>';
    container.appendChild(div);
  });
}

function deleteAccessory(id){
  var a=getById(window.ACCS||[],id);
  var aname=a?a.name:'este accesorio';
  var modal=document.getElementById('deleteAccessoryModal');
  if(!modal){
    var m=document.createElement('div');
    m.id='deleteAccessoryModal';
    m.style.cssText='display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease';
    m.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)" onclick="closeDeleteAccessoryModal()"></div>'+
      '<div style="position:relative;background:#fff;border-radius:20px;width:min(400px,90%);padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;transform:scale(.95);transition:transform .3s ease">'+
      '<div style="width:64px;height:64px;background:linear-gradient(135deg,#fee2e2,#fecaca);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">'+
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>'+
      '</div>'+
      '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:.5rem;color:var(--dk)">Eliminar accesorio</h3>'+
      '<p style="font-size:13px;color:var(--gray);margin-bottom:1.5rem;line-height:1.5">Estas por eliminar <strong style="color:var(--dk)" id="deleteAccessoryName">'+aname+'</strong>. Esta accion no se puede deshacer.</p>'+
      '<div style="display:flex;gap:10px">'+
      '<button onclick="closeDeleteAccessoryModal()" style="flex:1;padding:12px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s">Cancelar</button>'+
      '<button id="btnConfirmDeleteAccessory" style="flex:1;padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 4px 12px rgba(239,68,68,.3)">Eliminar</button>'+
      '</div>'+
      '</div>';
    document.body.appendChild(m);
    modal=m;
  }
  document.getElementById('deleteAccessoryName').textContent=aname;
  document.getElementById('btnConfirmDeleteAccessory').onclick=function(){
    closeDeleteAccessoryModal();
    fetch(API_URL+'/api/accessories?id='+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(){
      showToast('Accesorio eliminado');
      loadAccessories();
      loadAdminAccessories();
    }).catch(function(){showToast('Error eliminando');});
  };
  modal.style.display='flex';
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
  },10);
}
function closeDeleteAccessoryModal(){
  var modal=document.getElementById('deleteAccessoryModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.95)';
  setTimeout(function(){modal.style.display='none';},300);
}

function resetAccessoryForm(){
  document.getElementById('accId').value='';
  document.getElementById('accName').value='';
  document.getElementById('accPrice').value='';
  document.getElementById('accStock').value='';
  document.getElementById('accCategory').value='Cargadores';
  document.getElementById('accBrand').value='';
  document.getElementById('accDescription').value='';
  document.getElementById('accColor').value='';
  document.getElementById('accIco').value='📦';
  document.getElementById('accImageUrl').value='';
  document.getElementById('accImages').value='';
  document.getElementById('accCompatibleModels').value='';
  document.getElementById('accImagePreview').innerHTML='📦';
  document.getElementById('accAdditionalImages').innerHTML='<div id="addAccImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
  document.getElementById('accFormTitle').textContent='Agregar Accesorio';
  document.getElementById('accFormSubtitle').textContent='Completa los datos del nuevo accesorio';
  window.accAdditionalImages=[];
}

// =========== PRODUCT FUNCTIONS ===========
function editProduct(id){
  fetch(API_URL+'/api/products?id='+id).then(function(r){return r.json();}).then(function(p){
    if(p){
      document.getElementById('prodId').value=p.id;
      document.getElementById('prodName').value=p.name;
      document.getElementById('prodPrice').value=p.price;
      document.getElementById('prodStock').value=p.stock;
      document.getElementById('prodBrand').value=p.brand;
      document.getElementById('prodDescription').value=p.description||p.sub||'';
      document.getElementById('prodCondition').value=p.condition;
      document.getElementById('prodType').value=p.type;
      document.getElementById('prodColor').value=p.color;
      document.getElementById('prodImageUrl').value=p.imageUrl;
      window.additionalImages=p.images||[];
      if(p.imageUrl){
        document.getElementById('prodImagePreview').innerHTML='<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">';
      }
      renderAdditionalProductImages();
      nav('admin-product');
    }
  });
}

function duplicateProduct(id){
  var p=getById(PRODUCTS,id);
  if(!p){showToast('Producto no encontrado');return;}
  var dupName=p.name+' (copia)';
  fetch(API_URL+'/api/products',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name:dupName,
      price:p.price,
      stock:p.stock,
      brand:p.brand,
      description:p.description||p.sub||'',
      condition:p.condition,
      type:p.type,
      color:p.color,
      imageUrl:p.imageUrl,
      images:p.images||[],
      isOffer:p.isOffer||false,
      discount:p.discount||0,
    })
  }).then(function(r){return r.json();}).then(function(newP){
    showToast('Producto duplicado: '+dupName);
    loadProducts();
  }).catch(function(){showToast('Error duplicando producto');});
}

function deleteProduct(id){
  var p=getById(PRODUCTS,id);
  var pname=p?p.name:'este producto';
  var modal=document.getElementById('deleteProductModal');
  if(!modal){
    var m=document.createElement('div');
    m.id='deleteProductModal';
    m.style.cssText='display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease';
    m.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)" onclick="closeDeleteProductModal()"></div>'+
      '<div style="position:relative;background:#fff;border-radius:20px;width:min(400px,90%);padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center;transform:scale(.95);transition:transform .3s ease">'+
      '<div style="width:64px;height:64px;background:linear-gradient(135deg,#fee2e2,#fecaca);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">'+
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>'+
      '</div>'+
      '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:.5rem;color:var(--dk)">Eliminar producto</h3>'+
      '<p style="font-size:13px;color:var(--gray);margin-bottom:1.5rem;line-height:1.5">Estas por eliminar <strong style="color:var(--dk)" id="deleteProductName">'+pname+'</strong>. Esta accion no se puede deshacer.</p>'+
      '<div style="display:flex;gap:10px">'+
      '<button onclick="closeDeleteProductModal()" style="flex:1;padding:12px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s">Cancelar</button>'+
      '<button id="btnConfirmDeleteProduct" style="flex:1;padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 4px 12px rgba(239,68,68,.3)">Eliminar</button>'+
      '</div>'+
      '</div>';
    document.body.appendChild(m);
    modal=m;
  }
  document.getElementById('deleteProductName').textContent=pname;
  document.getElementById('btnConfirmDeleteProduct').onclick=function(){
    closeDeleteProductModal();
    fetch(API_URL+'/api/products?id='+id,{method:'DELETE'}).then(function(r){
      if(!r.ok)throw new Error('Error '+r.status);
      return r.json();
    }).then(function(){
      showToast('Producto eliminado: '+pname);
      loadProducts();
      loadAdminProducts();
    }).catch(function(e){showToast('Error eliminando: '+e.message);});
  };
  modal.style.display='flex';
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
  },10);
}
function closeDeleteProductModal(){
  var modal=document.getElementById('deleteProductModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.95)';
  setTimeout(function(){modal.style.display='none';},300);
}

function renderDash(){notAvailable();}
function switchChart(period,btn){notAvailable();}