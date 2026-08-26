// =========== SELL / TASACION ===========
var sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},fallas:{},finalPrice:0,accepted:false};

// =========== PRECIOS DE TOMA (fuente de la tasacion) ===========
// Los precios de /sell dependen de los "precios de toma" (priceTradeIn) del
// panel de admin. Cada fila tiene el modelo con su almacenamiento embebido,
// ej: "iPhone 14 128 GB" -> impecable + descuentos por falla.
var FALLA_KEYS=['bateria','pantalla','camara','microfono','parlante','tapa','marco','pin'];
var FALLA_LABELS={bateria:'Batería',pantalla:'Pantalla',camara:'Cámara',microfono:'Micrófono',parlante:'Parlante',tapa:'Tapa trasera',marco:'Marco',pin:'Bandeja SIM / PIN'};
var _gpStorageTokens=['1 TB','512 GB','256 GB','128 GB','64 GB'];
var _gpModels=null;

function gpSplitModelo(modelo){
  var s=String(modelo||'').trim();
  for(var i=0;i<_gpStorageTokens.length;i++){
    var tok=_gpStorageTokens[i];
    var idx=s.lastIndexOf(' '+tok);
    if(idx!==-1){
      return {base:s.substring(0,idx).trim(),storage:s.substring(idx+1).trim()};
    }
  }
  return {base:s,storage:''};
}
function gpStorageSort(s){
  var txt=String(s||'');
  var n=parseInt(txt)||0;
  return txt.indexOf('T')!==-1?n*1024:n;
}
function gpBuildModels(){
  if(_gpModels)return _gpModels;
  var map={};
  (window.PRECIOS_TOMA||[]).forEach(function(row){
    var sp=gpSplitModelo(row.modelo);
    if(!sp.base)return;
    if(!map[sp.base])map[sp.base]={base:sp.base,storages:[]};
    map[sp.base].storages.push({storage:sp.storage,row:row});
  });
  var out=Object.keys(map).map(function(base){
    var st=map[base].storages;
    st.sort(function(a,b){return gpStorageSort(a.storage)-gpStorageSort(b.storage);});
    var minImpecable=st.reduce(function(m,s){return (m===null||s.row.impecable<m)?s.row.impecable:m;},null);
    return {base:base,storages:st,minImpecable:minImpecable};
  });
  out.sort(function(a,b){return a.base.localeCompare(b.base);});
  _gpModels=out;
  return out;
}
function gpCurrentRow(){
  if(!sv.model||!sv.storage)return null;
  var key=sv.model+' '+sv.storage;
  return (window.PRECIOS_TOMA_BY_MODELO&&window.PRECIOS_TOMA_BY_MODELO[key])||null;
}
function gpResetFallaUI(){
  var map={bateria:'xFallaBateria',pantalla:'xFallaPantalla',camara:'xFallaCamara',microfono:'xFallaMicrofono',parlante:'xFallaParlante',tapa:'xFallaTapa',marco:'xFallaMarco',pin:'xFallaPin'};
  FALLA_KEYS.forEach(function(k){
    var el=document.getElementById(map[k]);
    if(el)el.checked=false;
    var lbl=document.getElementById('ff-'+k);
    if(lbl)lbl.textContent='--';
  });
}
function gpLoadPrecios(){
  if(window._gpPreciosLoading)return;
  window._gpPreciosLoading=true;
  fetch(API_URL+'/api/precios/toma',{credentials:'include'})
    .then(function(r){return r.json();})
    .then(function(d){
      window.PRECIOS_TOMA=Array.isArray(d)?d:[];
      window.PRECIOS_TOMA_BY_MODELO={};
      (window.PRECIOS_TOMA||[]).forEach(function(row){window.PRECIOS_TOMA_BY_MODELO[row.modelo]=row;});
      _gpModels=null;
      window._gpPreciosLoading=false;
      if(document.getElementById('svModelGrid')){renderModelGrid();renderStorGrid();svShowPreview();}
    })
    .catch(function(){window._gpPreciosLoading=false;});
}

function svBtnSuccess(btn){
  if(!btn)return;
  btn.classList.remove('sv-success');
  void btn.offsetWidth;
  btn.classList.add('sv-success');
  setTimeout(function(){btn.classList.remove('sv-success');},700);
  try{
    var cartBadge=document.querySelector('[id*="cartBadge"],[id*="CartBadge"],[class*="cart-badge"]');
    if(!cartBadge)cartBadge=document.querySelector('button[onclick*="openCart"],button[onclick*="toggleCart"]');
    var cartIcon=cartBadge||document.querySelector('header svg, header [class*="cart"]');
    if(!cartIcon)return;
    var br=btn.getBoundingClientRect();
    var cr=cartIcon.getBoundingClientRect();
    var dot=document.createElement('div');
    dot.className='pcard-add-dot';
    dot.style.cssText='position:fixed;left:'+(br.left+br.width/2-4)+'px;top:'+(br.top+br.height/2-4)+'px;width:8px;height:8px;border-radius:50%;background:var(--orange);box-shadow:0 0 12px rgba(255,107,44,.8);z-index:9999;pointer-events:none;transition:all .65s cubic-bezier(.5,-.5,.7,1.4)';
    document.body.appendChild(dot);
    var dx=cr.left+cr.width/2-(br.left+br.width/2);
    var dy=cr.top+cr.height/2-(br.top+br.height/2);
    requestAnimationFrame(function(){
      dot.style.transform='translate('+dx+'px,'+dy+'px) scale(.4)';
      dot.style.opacity='0';
    });
    setTimeout(function(){if(dot.parentNode)dot.parentNode.removeChild(dot);},700);
  }catch(e){}
}

function checkSellLogin(){
  if(!currentUser){
    if(typeof showAlert==='function'){
      showAlert('Inicia sesion','Necesitas iniciar sesion para cotizar tu equipo','info').then(function(){
        nav('login');
      });
    }else{
      alert('Necesitas iniciar sesion para cotizar tu equipo');
      nav('login');
    }
    return false;
  }
  return true;
}

var svPhotos={frente:null,dorso:null,bordes:null,bateria:null};
var svDniFrente=null;
var svDniDorso=null;

function handleSvPhotoSelectNew(input,slot){
  if(input.files&&input.files[0])uploadSvPhotoNew(input.files[0],slot);
}

function uploadSvPhotoNew(file,slot){
  if(!file||!file.type.startsWith('image/'))return;
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      svPhotos[slot]=data.url;
      renderSvPhotoSlot(slot);
      svChkPhotos();
    }
  }).catch(function(e){console.error('Error uploading photo:',e);});
}

function renderSvPhotoSlot(slot){
  var id='svSlot'+slot.charAt(0).toUpperCase()+slot.slice(1);
  var slotEl=document.getElementById(id);if(!slotEl)return;
  var preview=slotEl.querySelector('.sv-photo-preview');
  if(svPhotos[slot]){
    slotEl.classList.add('filled');
    if(preview){preview.style.display='block';preview.innerHTML='<img src="'+svPhotos[slot]+'" alt="'+slot+'"><button class="sv-photo-remove" onclick="event.stopPropagation();removeSvPhotoNew(\''+slot+'\')">x</button>';}
  }else{
    slotEl.classList.remove('filled');
    if(preview){preview.style.display='none';preview.innerHTML='';}
  }
}

function removeSvPhotoNew(slot){
  svPhotos[slot]=null;
  renderSvPhotoSlot(slot);
  svChkPhotos();
}

function handleSvPhotoSelect(input){
  if(input.files&&input.files[0])uploadSvPhoto(input.files[0]);
}

function handleSvPhotoDrop(e){
  e.preventDefault();
  var files=e.dataTransfer.files;
  if(files.length>0)uploadSvPhoto(files[0]);
}

function uploadSvPhoto(file){
  if(!file||!file.type.startsWith('image/'))return;
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      // find first empty slot
      for(var k in svPhotos){if(!svPhotos[k]){svPhotos[k]=data.url;renderSvPhotoSlot(k);return;}}
    }
  }).catch(function(e){console.error('Error uploading photo:',e);});
}

function removeSvPhoto(url){
  for(var k in svPhotos){if(svPhotos[k]===url){svPhotos[k]=null;renderSvPhotoSlot(k);break;}}
}

function renderSvPhotoPreview(){
  // legacy - no-op, per-slot rendering handles this
}

function handleSvDniPhotoSelect(input,side){
  if(input.files&&input.files[0])uploadSvDniPhoto(input.files[0],side);
}

function uploadSvDniPhoto(file,side){
  if(!file||!file.type.startsWith('image/'))return;
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      if(side==='frente'){svDniFrente=data.url;svChkDniFrente();}
      else{svDniDorso=data.url;svChkDniDorso();}
      renderSvDniPreview(side,data.url);
    }
  }).catch(function(e){console.error('Error uploading DNI photo:',e);});
}

function removeSvDniPhoto(side){
  if(side==='frente'){svDniFrente=null;renderSvDniPreview('frente',null);svChkDniFrente();}
  else{svDniDorso=null;renderSvDniPreview('dorso',null);svChkDniDorso();}
}

function renderSvDniPreview(side,url){
  var frame=document.getElementById('svDni'+(side==='frente'?'Frente':'Dorso')+'Frame');
  var preview=document.getElementById('svDni'+(side==='frente'?'Frente':'Dorso')+'Preview');
  if(url){
    if(frame)frame.style.display='none';
    if(preview){
      preview.style.display='block';
      preview.innerHTML='<img src="'+url+'" alt="DNI '+side+'"><button class="sv-dni-remove" onclick="event.stopPropagation();removeSvDniPhoto(\''+side+'\')">x</button>';
    }
  }else{
    if(frame)frame.style.display='flex';
    if(preview){preview.style.display='none';preview.innerHTML='';}
  }
}

function svStep(n){
  for(var i=0;i<=8;i++){var el=document.getElementById('svS'+i);if(el)el.className=(i===n)?'':'hidden';}
  var bars=document.querySelectorAll('#svBar .sv-bar');
  bars.forEach(function(b,i){b.className='sv-bar'+(i<n?' done':i===n?' cur':'');});
  if(n===0)renderModelGrid();
  if(n===2)svChkPhotos();
  if(n===3){svFillUserData();svChkPersonalData();}
  if(n===7){svRenderPrice();svBuildSum();svFillDecl();}
}

function filterModels(query){
  var cards=document.querySelectorAll('.model-card');
  var q=query.toLowerCase().trim();
  cards.forEach(function(c){
    var name=c.querySelector('.model-name').textContent.toLowerCase();
    c.style.display=(q===''||name.indexOf(q)!==-1)?'':'none';
  });
}

function renderModelGrid(){
  var grid=document.getElementById('svModelGrid');
  if(!grid)return;
  var models=gpBuildModels();
  if(!models.length){
    grid.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--gray);font-size:12px">Cargando precios de toma...</div>';
    return;
  }
  var html='';
  var appleLogo='<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>';
  models.forEach(function(m){
    var isSelected=sv.model===m.base;
    html+='<div class="model-card'+(isSelected?' act':'')+'" data-model="'+m.base+'" onclick="svSelectModel(\''+m.base.replace(/'/g,"\\'")+'\')">'+
      '<div class="model-ico">'+appleLogo+'</div>'+
      '<div class="model-name">'+m.base+'</div>'+
      '<div class="model-price">'+(m.minImpecable?'Desde '+fmt(m.minImpecable):'Consultar')+'</div>'+
    '</div>';
  });
  grid.innerHTML=html;
}

function svSelectModel(model){
  sv.model=model;sv.storage='';
  sv.fallas={};
  gpResetFallaUI();
  document.querySelectorAll('.model-card').forEach(function(c){c.classList.remove('act');});
  document.querySelectorAll('.model-card').forEach(function(c){
    if(c.getAttribute('data-model')===model)c.classList.add('act');
  });
  svShowPreview();
  renderStorGrid();
}

function renderStorGrid(){
  var grid=document.getElementById('svStorGrid');
  if(!grid)return;
  var models=gpBuildModels();
  var entry=null;
  for(var i=0;i<models.length;i++){if(models[i].base===sv.model){entry=models[i];break;}}
  if(!entry){grid.innerHTML='';return;}
  var html='';
  entry.storages.forEach(function(s){
    var isSelected=sv.storage===s.storage;
    html+='<div class="stor-card'+(isSelected?' act':'')+'" onclick="svSelectStorage(\''+s.storage.replace(/'/g,"\\'")+'\')">'+
      '<div class="stor-name">'+s.storage+'</div>'+
      '<div class="stor-price">'+fmt(s.row.impecable)+'</div>'+
    '</div>';
  });
  grid.innerHTML=html;
}

function svSelectStorage(stor){
  sv.storage=stor;
  sv.fallas={};
  gpResetFallaUI();
  document.querySelectorAll('.stor-card').forEach(function(c){c.classList.remove('act');});
  document.querySelectorAll('.stor-card').forEach(function(c){
    if(c.querySelector('.stor-name').textContent===stor)c.classList.add('act');
  });
  svShowPreview();
}

function svShowPreview(){
  var el=document.getElementById('svPreview');
  if(!el)return;
  var row=gpCurrentRow();
  var price=row?fmt(row.impecable):'Selecciona modelo y almacenamiento';
  el.textContent=sv.model&&sv.storage?price:'Selecciona modelo y almacenamiento';
  var btn=document.getElementById('svN0');
  if(btn)btn.disabled=!(sv.model&&sv.storage);
}

function svUpdFalla(){
  var row=gpCurrentRow();
  var map={bateria:'xFallaBateria',pantalla:'xFallaPantalla',camara:'xFallaCamara',microfono:'xFallaMicrofono',parlante:'xFallaParlante',tapa:'xFallaTapa',marco:'xFallaMarco',pin:'xFallaPin'};
  FALLA_KEYS.forEach(function(k){
    var el=document.getElementById(map[k]);
    if(!el)return;
    sv.fallas[k]=el.checked;
    var lbl=document.getElementById('ff-'+k);
    if(lbl)lbl.textContent=el.checked&&row?('-'+fmt(row[k]||0)):'--';
  });
  svRecalc();
}

function svUpdExt(){
  var labels={pant:{id:'ci-pant',txt:'+6%'},bat:{id:'ci-bat',txt:'+5%'},icloud:{id:'ci-icloud',txt:'+8%'},caja:{id:'ci-caja',txt:'+3%'},acc:{id:'ci-acc',txt:'+3%'}};
  Object.keys(labels).forEach(function(k){
    var chk=document.getElementById('x'+k.charAt(0).toUpperCase()+k.slice(1));
    var lbl=document.getElementById(labels[k].id);
    if(lbl)lbl.textContent=chk&&chk.checked?labels[k].txt:'--';
    sv.extras[k]=chk?chk.checked:false;
  });
}

function svRecalc(){
  var row=gpCurrentRow();
  if(!row){sv.finalPrice=0;return;}
  var base=row.impecable||0;
  var fallaDiscount=0;
  FALLA_KEYS.forEach(function(k){if(sv.fallas&&sv.fallas[k])fallaDiscount+=(row[k]||0);});
  var extBonus=0;
  Object.keys(COTIZ_EXT).forEach(function(k){if(sv.extras&&sv.extras[k])extBonus+=COTIZ_EXT[k];});
  sv.finalPrice=Math.round(Math.max(0,base-fallaDiscount)*(1+extBonus));
}

function svRenderPrice(){
  svRecalc();
  var el=document.getElementById('svPriceBig');
  var rng=document.getElementById('svPriceRange');
  if(el)el.textContent=fmt(sv.finalPrice);
  if(rng)rng.textContent='Rango: '+fmt(Math.round(sv.finalPrice*0.9))+' - '+fmt(Math.round(sv.finalPrice*1.05));
}

function svFillUserData(){
  if(currentUser){
    var nombre=document.getElementById('svNombre');
    if(nombre&&!nombre.value)nombre.value=currentUser.name||'';
    var email=document.getElementById('svEmail');
    if(email&&!email.value)email.value=currentUser.email||'';
    var tel=document.getElementById('svTel');
    if(tel&&!tel.value)tel.value=currentUser.phone||'';
    var dni=document.getElementById('svDni');
    if(dni&&!dni.value)dni.value=currentUser.dni||'';
    var ciudad=document.getElementById('svCiudad');
    if(ciudad&&!ciudad.value)ciudad.value=currentUser.ciudad||'';
    var cp=document.getElementById('svCp');
    if(cp&&!cp.value)cp.value=currentUser.cp||'';
    var provincia=document.getElementById('svProvincia');
    if(provincia&&!provincia.value)provincia.value=currentUser.provincia||'';
  }
}

function svChkDniFrente(){
  var btn=document.getElementById('svN4');
  if(btn)btn.disabled=!svDniFrente;
}
function svChkDniDorso(){
  var btn=document.getElementById('svN5');
  if(btn)btn.disabled=!svDniDorso;
}
function svChkPhotos(){
  var allDone=svPhotos.frente&&svPhotos.dorso&&svPhotos.bordes&&svPhotos.bateria;
  var btn=document.getElementById('svN2');
  if(btn)btn.disabled=!allDone;
}
function svChkPersonalData(){
  var nombre=document.getElementById('svNombre');
  var dni=document.getElementById('svDni');
  var tel=document.getElementById('svTel');
  var email=document.getElementById('svEmail');
  var ciudad=document.getElementById('svCiudad');
  var cp=document.getElementById('svCp');
  var provincia=document.getElementById('svProvincia');
  var ok=nombre&&nombre.value.trim()&&dni&&dni.value.trim()&&tel&&tel.value.trim()&&email&&email.value.trim()&&ciudad&&ciudad.value.trim()&&cp&&cp.value.trim()&&provincia&&provincia.value;
  var btn=document.getElementById('svN3');
  if(btn)btn.disabled=!ok;
}

function svEnvio(tipo,el){sv.envio=tipo;document.querySelectorAll('.eopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');svChkShip();}
function svCobro(tipo,el){
  sv.cobro=tipo;document.querySelectorAll('.vopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');
  var cbu=document.getElementById('svCBU');var alias=document.getElementById('svAlias');
  if(cbu)cbu.className=tipo==='transfer'?'':'hidden';if(alias)alias.className=tipo==='mp'?'':'hidden';svChkShip();
}
function svChkShip(){
  var ok=sv.envio&&sv.cobro;
  if(sv.cobro==='transfer'){var cbu=document.getElementById('svCBUInput');if(cbu&&cbu.value.trim().length<1)ok=false;}
  if(sv.cobro==='mp'){var alias=document.getElementById('svAliasInput');if(alias&&alias.value.trim().length<1)ok=false;}
  var btn=document.getElementById('svN6');
  if(btn)btn.disabled=!ok;
}

function svBuildSum(){
  var envioNames={presencial:'Presencial en tienda',andreani:'Andreani prepaga',internacional:'Internacional DHL/FedEx',propio:'Correo propio'};
  var cobroNames={saldo:'Saldo GP (+5% bonus)',transfer:'Transferencia bancaria',mp:'Mercado Pago',efectivo:'Efectivo en sucursal'};
  var el=document.getElementById('svSum');
  if(!el)return;
  var rows=[
    {k:'Equipo',v:'iPhone '+sv.model},
    {k:'Almacenamiento',v:sv.storage},
    {k:'Estado',v:FALLA_KEYS.some(function(f){return sv.fallas[f];}) ? FALLA_KEYS.filter(function(f){return sv.fallas[f];}).map(function(f){return FALLA_LABELS[f];}).join(', ') : 'Impecable'},
    {k:'Precio estimado',v:fmt(sv.finalPrice||0)},
    {k:'Envio',v:envioNames[sv.envio]||sv.envio},
    {k:'Cobro',v:cobroNames[sv.cobro]||sv.cobro}
  ];
  el.innerHTML=rows.map(function(r){return'<div class="sum-row"><span class="sum-k">'+r.k+'</span><span class="sum-v">'+r.v+'</span></div>';}).join('');
}

function svFillDecl(){
  var nombre=(document.getElementById('svNombre')||{}).value||'el cliente';
  var nameEl=document.getElementById('svDeclName');
  if(nameEl)nameEl.textContent=nombre;
  var dateEl=document.getElementById('svDeclDate');
  if(dateEl)dateEl.textContent=new Date().toLocaleDateString('es-AR');
}

function svToggleAccept(el){
  sv.accepted=el.checked;
  var btn=document.getElementById('svN7');
  if(btn)btn.disabled=!sv.accepted;
}

function svSubmit(){
  if(!checkSellLogin())return;

  var btn=document.getElementById('svN7');
  if(btn){
    btn.disabled=true;
    btn.textContent='Enviando...';
  }

  var nombre=document.getElementById('svNombre').value.trim();
  var dni=document.getElementById('svDni').value.trim();
  var tel=document.getElementById('svTel').value.trim();
  var ciudad=document.getElementById('svCiudad').value.trim();
  var cp=document.getElementById('svCp').value.trim();
  var provincia=document.getElementById('svProvincia').value.trim();

  var extrasSelected=Object.keys(sv.extras).filter(function(k){return sv.extras[k];});

  var row=gpCurrentRow();
  var quoteData={
    userId:currentUser.id,
    device:'iPhone '+sv.model,
    storage:sv.storage,
    condition:sv.cond,
    basePrice:row?(row.impecable||0):0,
    finalPrice:sv.finalPrice,
    bonus:sv.cobro==='saldo'?Math.round(sv.finalPrice*0.05):0,
    envio:sv.envio,
    payment:sv.cobro,
    clientName:nombre,
    clientDni:dni,
    clientPhone:tel,
    clientCity:ciudad,
    clientCp:cp,
    clientProvince:provincia,
    photos:Object.values(svPhotos).filter(Boolean),
    dniPhotos:[svDniFrente,svDniDorso].filter(function(u){return u;}),
    extras:extrasSelected,
  };

  fetch(API_URL+'/api/quotes',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(quoteData)
  }).then(function(r){
    if(!r.ok)throw new Error('Error '+r.status);
    return r.json();
  }).then(function(result){
    if(result.success){
      svRenderConfirm(result.quote);
      svStep(8);
    }else{
      throw new Error(result.error||'Error al enviar');
    }
  }).catch(function(e){
    if(typeof showErrorToast==='function'){
      showErrorToast('Error',e.message||'No se pudo enviar la cotizacion');
    }else{
      alert('Error: '+e.message);
    }
    if(btn){btn.disabled=false;btn.textContent='ENVIAR COTIZACION';}
  });
}

function svRenderConfirm(quote){
  var msg=document.getElementById('svConfMsg');
  if(msg){
    msg.innerHTML='<strong>Codigo: '+escapeHtml(quote.code)+'</strong><br>Tu cotizacion fue enviada correctamente.<br>Un asesor la revisara y te contactara para coordinar la inspeccion del dispositivo.<br><br><em>El precio estimado es orientativo. Hasta no comprobar fisicamente el estado del dispositivo, no se realizara ningun pago.</em>';
  }
  var track=document.getElementById('svTrack');
  if(track){
    track.innerHTML=
      '<div class="track-step done"><span class="track-ico">&#9989;</span><div class="track-t">Enviada</div><div class="track-s">Tu cotizacion fue recibida</div></div>'+
      '<div class="track-step"><span class="track-ico">&#128269;</span><div class="track-t">En revision</div><div class="track-s">Un asesor revisara tu cotizacion</div></div>'+
      '<div class="track-step"><span class="track-ico">&#128230;</span><div class="track-t">Inspeccion</div><div class="track-s">Verificamos el estado del equipo</div></div>'+
      '<div class="track-step"><span class="track-ico">&#128184;</span><div class="track-t">Pago</div><div class="track-s">Recibis el dinero acordado</div></div>';
  }
}

function svReset(){
  sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},fallas:{},finalPrice:0,accepted:false};
  svStep(0);
  ['xPant','xBat','xIcloud','xCaja','xAcc'].forEach(function(id){var el=document.getElementById(id);if(el)el.checked=false;});
  FALLA_KEYS.forEach(function(k){var el=document.getElementById('xFalla'+k.charAt(0).toUpperCase()+k.slice(1));if(el)el.checked=false;});
  svUpdExt();
  svUpdFalla();
  svPhotos={frente:null,dorso:null,bordes:null,bateria:null};
  svDniFrente=null;svDniDorso=null;
  for(var pk in svPhotos){renderSvPhotoSlot(pk);}
  ['Frente','Dorso'].forEach(function(side){renderSvDniPreview(side.toLowerCase(),null);});
  ['svN0','svN1','svN2','svN3','svN4','svN5','svN6','svN7'].forEach(function(id){var el=document.getElementById(id);if(el)el.disabled=true;});
  var searchEl=document.getElementById('svModelSearch');if(searchEl)searchEl.value='';
  ['svNombre','svDni','svTel','svEmail','svCiudad','svCp'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var provincia=document.getElementById('svProvincia');if(provincia)provincia.value='';
  var cbu=document.getElementById('svCBU');if(cbu)cbu.className='hidden';
  var alias=document.getElementById('svAlias');if(alias)alias.className='hidden';
  document.querySelectorAll('.eopt,.vopt').forEach(function(e){e.classList.remove('act');});
  var chk=document.getElementById('svAccept');if(chk)chk.checked=false;
}

// Cargar precios de toma apenas se inicia el flujo de /sell.
gpLoadPrecios();
