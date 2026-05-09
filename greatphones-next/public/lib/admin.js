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
    content.innerHTML='<div class="adm-list" id="orderList"></div>';
    loadAdminOrders();
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

function loadAdminOrders(){
  var list=document.getElementById('orderList');
  if(!list)return;
  fetch(API_URL+'/api/orders').then(function(r){return r.json();}).then(function(ords){
    list.innerHTML=ords.slice(0,50).map(function(o){
      return'<div class="adm-item"><div class="adm-item-info"><div class="adm-item-name">'+o.code+'</div><div class="adm-item-sub">'+o.clientEmail+'</div></div><div class="adm-item-price">$'+o.total.toLocaleString('es-AR')+'</div><span class="adm-item-status">'+o.status+'</span></div>';
    }).join('');
  }).catch(function(){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando pedidos</div>';});
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