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
    content.innerHTML='<div class="adm-list-header"><button class="btn btn-o" onclick="nav(\'admin-product\')">+ Nuevo Producto</button></div><div class="adm-list" id="prodList"></div>';
    loadAdminProducts();
  }else if(tab==='acc'){
    content.innerHTML='<div class="adm-list-header"><button class="btn btn-o" onclick="nav(\'admin-acc\')">+ Nuevo Accesorio</button></div><div class="adm-list" id="accList"></div>';
    loadAdminAccessories();
  }else if(tab==='orders'){
    content.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">'+
      '<button class="ord-btn ord-btn-act" id="btnPendingOrders" onclick="loadPendingOrders()">Pedidos en Espera</button>'+
      '<button class="ord-btn" id="btnAcceptedOrders" onclick="loadAcceptedOrders()">Pedidos Aceptados</button>'+
      '<button class="ord-btn" id="btnHistoryOrders" onclick="loadOrderHistory()">Historial</button>'+
    '</div>'+
    '<div style="margin-bottom:1rem">'+
      '<input type="text" id="orderDniFilter" placeholder="Buscar por DNI..." oninput="filterOrdersByDni()" style="width:100%;max-width:300px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
    '</div>'+
    '<div class="adm-list" id="orderList"></div>';
    loadPendingOrders();
  }else{
    content.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">SecciÃ³n en desarrollo</div>';
  }
}

function loadAdminProducts(){
  var list=document.getElementById('prodList');
  if(!list)return;
  fetch(API_URL+'/api/products').then(function(r){return r.json();}).then(function(prods){
    list.innerHTML=prods.map(function(p){
      return'<div class="adm-item"><div class="adm-item-img">'+(p.imageUrl?'<img src="'+p.imageUrl+'">':'<span>📱</span>')+'</div><div class="adm-item-info"><div class="adm-item-name">'+p.name+'</div><div class="adm-item-sub">'+p.brand+' '+p.sub+'</div><div class="adm-item-price">$'+p.price.toLocaleString('es-AR')+'</div></div><div class="adm-item-actions"><button onclick="editProduct(\''+p.id+'\')">✏️</button><button onclick="deleteProduct(\''+p.id+'\')">🗑️</button></div></div>';
    }).join('');
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando productos</div>';});
}

function loadAdminAccessories(){
  var list=document.getElementById('accList');
  if(!list)return;
  fetch(API_URL+'/api/accessories').then(function(r){return r.json();}).then(function(accs){
    list.innerHTML=accs.map(function(a){
      return'<div class="adm-item"><div class="adm-item-img">'+(a.imageUrl?'<img src="'+a.imageUrl+'">':'<span>📦</span>')+'</div><div class="adm-item-info"><div class="adm-item-name">'+a.name+'</div><div class="adm-item-sub">'+a.category+'</div><div class="adm-item-price">$'+a.price.toLocaleString('es-AR')+'</div></div><div class="adm-item-actions"><button onclick="editAccessory(\''+a.id+'\')">✏️</button><button onclick="deleteAccessory(\''+a.id+'\')">🗑️</button></div></div>';
    }).join('');
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

function loadPendingOrders(){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnPendingOrders');
  window._currentOrderTab='pending';
  
  fetch(API_URL+'/api/orders?admin=true&status=PENDING').then(function(r){return r.json();}).then(function(ords){
    window._currentOrders=ords;
    renderOrdersList(ords);
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando pedidos</div>';});
}

function loadAcceptedOrders(){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnAcceptedOrders');
  window._currentOrderTab='accepted';
  
  fetch(API_URL+'/api/orders?admin=true&status=PROCESSING,SHIPPED').then(function(r){return r.json();}).then(function(ords){
    window._currentOrders=ords;
    renderOrdersList(ords);
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando pedidos aceptados</div>';});
}

function loadOrderHistory(){
  var list=document.getElementById('orderList');
  if(!list)return;
  setActiveOrderBtn('btnHistoryOrders');
  window._currentOrderTab='history';
  
  fetch(API_URL+'/api/orders?admin=true&status=DELIVERED,CANCELLED').then(function(r){return r.json();}).then(function(ords){
    window._currentOrders=ords;
    renderOrdersList(ords);
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando historial</div>';});
}

function filterOrdersByDni(){
  var input=document.getElementById('orderDniFilter');
  if(!input)return;
  var dni=input.value.trim();
  var list=document.getElementById('orderList');
  if(!list)return;
  
  if(!dni){
    renderOrdersList(window._currentOrders);
    return;
  }
  
  var filtered=window._currentOrders.filter(function(o){
    return o.clientDni&&o.clientDni.indexOf(dni)!==-1;
  });
  
  if(filtered.length===0){
    list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p style="font-size:14px;font-weight:600;margin-bottom:.5rem">No se encontraron pedidos con DNI "'+dni+'"</p></div>';
    return;
  }
  
  renderOrdersList(filtered);
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
    return'<div class="adm-item" onclick="openOrderDetail(\''+o.id+'\')" style="cursor:pointer" onmouseover="this.style.background=\'rgba(255,107,44,.03)\'" onmouseout="this.style.background=\'\'">'+
      '<div class="adm-item-info" style="flex:1">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
          '<span style="font-size:14px;font-weight:700;color:var(--dk)">'+o.code+'</span>'+
          '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:'+statusColor+'20;color:'+statusColor+';font-weight:600">'+o.status+'</span>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--gray);margin-bottom:2px">'+userName+' · '+userEmail+'</div>'+
        (o.clientDni?'<div style="font-size:11px;color:var(--gray);margin-bottom:2px">DNI: '+o.clientDni+'</div>':'')+
        '<div style="font-size:11px;color:var(--gray);margin-bottom:2px">'+itemsCount+' producto(s): '+itemsSummary.substring(0,60)+(itemsSummary.length>60?'...':'')+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">'+deliveryLabel+' · '+dateStr+' '+timeStr+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:16px;font-weight:700;color:var(--orange);font-family:\'Playfair Display\',serif">$'+o.total.toLocaleString('es-AR')+'</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-top:2px">Click para ver detalle</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function openOrderDetail(orderId){
  fetch(API_URL+'/api/orders?admin=true').then(function(r){return r.json();}).then(function(ords){
    var order=ords.find(function(o){return o.id===orderId;});
    if(!order){showToast('Pedido no encontrado');return;}
    showOrderModal(order);
  }).catch(function(){showToast('Error cargando pedido');});
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
  }else if(order.status==='PROCESSING'||order.status==='SHIPPED'){
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