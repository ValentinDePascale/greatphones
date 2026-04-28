// =========== ADMIN ===========
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':'https://greatphones.onrender.com');

function adminLogin(){notAvailable();}
function adminLogout(){}
function showAdmin(){nav('admin');}

function adminTab(tab,btn){
  window.currentAdminTab=tab;
  document.querySelectorAll('.fchip[id^="adm-"]').forEach(function(c){c.classList.remove('act');});
  if(btn)btn.classList.add('act');
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
          document.getElementById('accImages').value=JSON.stringify(window.accAdditionalImages);
          renderAccAdditionalImage(data.url);
        }
      });
    });
  }
}

function renderAccAdditionalImage(url){
  var container=document.getElementById('accAdditionalImages');
  var placeholder=document.getElementById('addAccImgPlaceholder');
  if(placeholder)placeholder.style.display='none';
  var div=document.createElement('div');
  div.style.cssText='width:60px;height:60px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0';
  div.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover"><button onclick="this.parentElement.remove()" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:12px">×</button>';
  container.appendChild(div);
}

function saveAccessory(){
  var id=document.getElementById('accId').value;
  var name=document.getElementById('accName').value;
  var price=parseInt(document.getElementById('accPrice').value);
  var stock=parseInt(document.getElementById('accStock').value)||0;
  var category=document.getElementById('accCategory').value;
  var brand=document.getElementById('accBrand').value;
  var description=document.getElementById('accDescription').value;
  var color=document.getElementById('accColor').value;
  var ico=document.getElementById('accIco').value;
  var imageUrl=document.getElementById('accImageUrl').value;
  var images=window.accAdditionalImages||[];
  
  if(!name||!price){
    alert('Nombre y precio son requeridos');
    return;
  }
  
  var method=id?'PUT':'POST';
  var endpoint=id?'/api/accessories?id='+id:'/api/accessories';
  
  fetch(API_URL+endpoint,{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,price,stock,category,brand,description,color,ico,imageUrl,images})
  }).then(function(r){return r.json();}).then(function(data){
    alert(id?'Accesorio actualizado':'Accesorio creado');
    resetAccessoryForm();
    nav('admin');
    adminTab('acc');
  }).catch(function(e){alert('Error: '+e.message);});
}

function editAccessory(id){
  fetch(API_URL+'/api/accessories?id='+id).then(function(r){return r.json();}).then(function(a){
    if(a){
      document.getElementById('accId').value=a.id;
      document.getElementById('accName').value=a.name;
      document.getElementById('accPrice').value=a.price;
      document.getElementById('accStock').value=a.stock;
      document.getElementById('accCategory').value=a.category;
      document.getElementById('accBrand').value=a.brand||'';
      document.getElementById('accDescription').value=a.description||'';
      document.getElementById('accColor').value=a.color||'';
      document.getElementById('accIco').value=a.ico||'';
      document.getElementById('accImageUrl').value=a.imageUrl||'';
      window.accAdditionalImages=a.images||[];
      if(a.imageUrl){
        document.getElementById('accImagePreview').innerHTML='<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">';
      }
      renderAccAdditionalImagesList();
      nav('admin-acc');
    }
  });
}

function renderAccAdditionalImagesList(){
  var container=document.getElementById('accAdditionalImages');
  container.innerHTML='';
  window.accAdditionalImages.forEach(function(url){
    var div=document.createElement('div');
    div.style.cssText='width:60px;height:60px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0';
    div.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover"><button onclick="this.parentElement.remove()" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:12px">×</button>';
    container.appendChild(div);
  });
}

function deleteAccessory(id){
  if(!confirm('Eliminar accesorio?'))return;
  fetch(API_URL+'/api/accessories?id='+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(){
    alert('Eliminado');
    loadAdminAccessories();
  }).catch(function(){alert('Error eliminando');});
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
  document.getElementById('accIco').value='';
  document.getElementById('accImageUrl').value='';
  document.getElementById('accImages').value='';
  document.getElementById('accImagePreview').innerHTML='📷';
  document.getElementById('accAdditionalImages').innerHTML='<div id="addAccImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
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
      document.getElementById('prodSub').value=p.sub;
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
  if(!confirm('Eliminar producto?'))return;
  fetch(API_URL+'/api/products?id='+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(){
    alert('Eliminado');
    loadAdminProducts();
  }).catch(function(){alert('Error eliminando');});
}

function renderDash(){notAvailable();}
function switchChart(period,btn){notAvailable();}