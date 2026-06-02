// =========== SELL / TASACION ===========
var sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},finalPrice:0};

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

var svPhotos=[];

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
  if(svPhotos.length>=3){
    if(typeof showWarningToast==='function')showWarningToast('Limite alcanzado','Maximo 3 fotos');
    return;
  }
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{method:'POST',body:formData}).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      svPhotos.push(data.url);
      renderSvPhotoPreview();
    }
  }).catch(function(){});
}

function removeSvPhoto(url){
  var idx=svPhotos.indexOf(url);
  if(idx>-1)svPhotos.splice(idx,1);
  renderSvPhotoPreview();
}

function renderSvPhotoPreview(){
  var container=document.getElementById('svPhotoPreview');
  if(!container)return;
  if(svPhotos.length===0){container.innerHTML='';container.style.display='none';return;}
  container.style.display='flex';
  container.innerHTML=svPhotos.map(function(url){
    return '<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">'+
      '<img src="'+url+'" style="width:100%;height:100%;object-fit:cover">'+
      '<button onclick="removeSvPhoto(\''+url+'\')" style="position:absolute;top:4px;right:4px;width:20px;height:20px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;font-size:14px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center">&times;</button>'+
    '</div>';
  }).join('');
}

function svStep(n){
  for(var i=0;i<=4;i++){var el=document.getElementById('svS'+i);if(el)el.className=(i===n)?'':'hidden';}
  var bars=document.querySelectorAll('#svBar .sv-bar');
  bars.forEach(function(b,i){b.className='sv-bar'+(i<n?' done':i===n?' cur':'');});
  if(n===0)renderModelGrid();
  if(n===1)renderStorGrid();
  if(n===3){svRenderPrice();svBuildSum();svSetupSig();}
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
  var models=SELL_MODELS['iPhone']||[];
  var html='';
  models.forEach(function(m){
    var base=COTIZ_BASE[m]||0;
    var isSelected=sv.model===m;
    html+='<div class="model-card'+(isSelected?' act':'')+'" data-model="'+m+'" onclick="svSelectModel(\''+m+'\')">'+
      '<div class="model-ico">&#128241;</div>'+
      '<div class="model-name">'+m+'</div>'+
      '<div class="model-price">'+(base?fmt(base):'Consultar')+'</div>'+
    '</div>';
  });
  grid.innerHTML=html;
}

function svSelectModel(model){
  sv.model=model;
  sv.storage='';
  document.querySelectorAll('.model-card').forEach(function(c){c.classList.remove('act');});
  var cards=document.querySelectorAll('.model-card');
  cards.forEach(function(c){
    if(c.getAttribute('data-model')===model)c.classList.add('act');
  });
  var btn=document.getElementById('svN0');
  if(btn)btn.disabled=false;
  svShowPreview();
}

function renderStorGrid(){
  var grid=document.getElementById('svStorGrid');
  if(!grid)return;
  var storages=['16 GB','32 GB','64 GB','128 GB','256 GB','512 GB','1 TB'];
  var html='';
  storages.forEach(function(s){
    var isSelected=sv.storage===s;
    var mult=SMULT[s]||1;
    var base=COTIZ_BASE[sv.model]||0;
    var price=Math.round(base*mult);
    html+='<div class="stor-card'+(isSelected?' act':'')+'" onclick="svSelectStorage(\''+s+'\')">'+
      '<div class="stor-name">'+s+'</div>'+
      '<div class="stor-price">'+(price?fmt(price):'--')+'</div>'+
    '</div>';
  });
  grid.innerHTML=html;
}

function svSelectStorage(stor){
  sv.storage=stor;
  document.querySelectorAll('.stor-card').forEach(function(c){c.classList.remove('act');});
  var cards=document.querySelectorAll('.stor-card');
  cards.forEach(function(c){
    if(c.querySelector('.stor-name').textContent===stor)c.classList.add('act');
  });
  var btn=document.getElementById('svN1');
  if(btn)btn.disabled=false;
  svShowPreview();
}

function svShowPreview(){
  var el=document.getElementById('svPreview');
  if(!el)return;
  var base=COTIZ_BASE[sv.model]||0;
  var mult=SMULT[sv.storage]||1;
  el.textContent=base?fmt(Math.round(base*mult)):'Selecciona modelo';
}

function svCond(cond,mult,el){
  sv.cond=cond;sv.condMult=mult;
  document.querySelectorAll('.cond-card').forEach(function(c){c.classList.remove('act');});
  if(el)el.classList.add('act');svRecalc();
  var btn=document.getElementById('svN2');
  if(btn)btn.disabled=false;
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
  var base=COTIZ_BASE[sv.model]||0;
  var mult=SMULT[sv.storage]||1;
  var extBonus=0;
  Object.keys(COTIZ_EXT).forEach(function(k){if(sv.extras&&sv.extras[k])extBonus+=COTIZ_EXT[k];});
  sv.finalPrice=Math.round(base*mult*sv.condMult*(1+extBonus));
}

function svRenderPrice(){
  svRecalc();
  var el=document.getElementById('svPriceBig');
  var rng=document.getElementById('svPriceRange');
  if(el)el.textContent=fmt(sv.finalPrice);
  if(rng)rng.textContent='Rango: '+fmt(Math.round(sv.finalPrice*0.9))+' - '+fmt(Math.round(sv.finalPrice*1.05));
}

function svEnvio(tipo,el){sv.envio=tipo;document.querySelectorAll('.eopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');svChkFinal();}
function svCobro(tipo,el){
  sv.cobro=tipo;document.querySelectorAll('.vopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');
  var cbu=document.getElementById('svCBU');var alias=document.getElementById('svAlias');
  if(cbu)cbu.className=tipo==='transfer'?'':'hidden';if(alias)alias.className=tipo==='mp'?'':'hidden';svChkFinal();
}
function svChkFinal(){
  var fieldsOk=['svNombre','svDni','svTel','svEmail'].every(function(id){var el=document.getElementById(id);return el&&el.value.trim().length>1;});
  var sigWrap=document.getElementById('sigWrap');
  var sigDone=sigWrap&&sigWrap.classList.contains('signed');
  var btn=document.getElementById('svN3');
  if(btn)btn.disabled=!(sv.envio&&sv.cobro&&fieldsOk&&sigDone);
}

function svBuildSum(){
  var envioNames={presencial:'Presencial en tienda',andreani:'Andreani prepaga',internacional:'Internacional DHL/FedEx',propio:'Correo propio'};
  var cobroNames={saldo:'Saldo GP (+5% bonus)',transfer:'Transferencia bancaria',mp:'Mercado Pago',efectivo:'Efectivo en sucursal'};
  var el=document.getElementById('svSum');
  if(!el)return;
  var rows=[{k:'Equipo',v:'iPhone '+sv.model},{k:'Almacenamiento',v:sv.storage},{k:'Estado',v:sv.cond},{k:'Precio estimado',v:fmt(sv.finalPrice||0)},{k:'Envio',v:envioNames[sv.envio]||sv.envio},{k:'Cobro',v:cobroNames[sv.cobro]||sv.cobro}];
  el.innerHTML=rows.map(function(r){return'<div class="sum-row"><span class="sum-k">'+r.k+'</span><span class="sum-v">'+r.v+'</span></div>';}).join('');
}

function svSetupSig(){
  var legal=document.getElementById('svLegal');
  var nombre=(document.getElementById('svNombre')||{}).value||'el cliente';
  if(legal)legal.innerHTML='Yo, <strong>'+nombre+'</strong>, declaro que el equipo es de mi propiedad y no tiene ninguna deuda o bloqueo pendiente. Acepto los terminos y condiciones de tasacion de Great Phones Bahia Blanca. Fecha: '+new Date().toLocaleDateString('es-AR');
  var canvas=document.getElementById('sigCanvas');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var signed=false,drawing=false;
  function getPos(e,c){var r=c.getBoundingClientRect();var src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*(c.width/r.width),y:(src.clientY-r.top)*(c.height/r.height)};}
  function start(e){drawing=true;var p=getPos(e,canvas);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();}
  function move(e){if(!drawing)return;var p=getPos(e,canvas);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#1A1208';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();e.preventDefault();signed=true;document.getElementById('sigWrap').className='sig-wrap signed';document.getElementById('sigStatus').textContent='Firma capturada';svChkFinal();}
  function end(){drawing=false;}
  canvas.onmousedown=start;canvas.onmousemove=move;canvas.onmouseup=end;canvas.ontouchstart=start;canvas.ontouchmove=move;canvas.ontouchend=end;
}

function clearSig(){
  var canvas=document.getElementById('sigCanvas');
  if(canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  document.getElementById('sigWrap').className='sig-wrap';
  document.getElementById('sigStatus').textContent='Traza tu firma arriba';
  svChkFinal();
}

function svSubmit(){
  if(!checkSellLogin())return;

  var btn=document.getElementById('svN3');
  if(btn){
    btn.disabled=true;
    btn.textContent='Enviando...';
  }

  var nombre=document.getElementById('svNombre').value.trim();
  var dni=document.getElementById('svDni').value.trim();
  var tel=document.getElementById('svTel').value.trim();
  var ciudad=document.getElementById('svCiudad').value.trim();
  var sigCanvas=document.getElementById('sigCanvas');
  var sigData=sigCanvas?sigCanvas.toDataURL():'';

  var extrasSelected=Object.keys(sv.extras).filter(function(k){return sv.extras[k];});

  var quoteData={
    userId:currentUser.id,
    device:'iPhone '+sv.model,
    storage:sv.storage,
    condition:sv.cond,
    basePrice:Math.round((COTIZ_BASE[sv.model]||0)*(SMULT[sv.storage]||1)),
    finalPrice:sv.finalPrice,
    bonus:sv.cobro==='saldo'?Math.round(sv.finalPrice*0.05):0,
    envio:sv.envio,
    payment:sv.cobro,
    clientName:nombre,
    clientDni:dni,
    clientPhone:tel,
    clientCity:ciudad,
    signature:sigData,
    photos:svPhotos,
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
      svStep(4);
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
    msg.innerHTML='<strong>Codigo: '+quote.code+'</strong><br>Tu cotizacion fue enviada correctamente.<br>Un asesor la revisara y te contactara para coordinar la inspeccion del dispositivo.<br><br><em>El precio estimado es orientativo. Hasta no comprobar fisicamente el estado del dispositivo, no se realizara ningun pago.</em>';
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
  sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},finalPrice:0};
  svStep(0);
  ['xPant','xBat','xIcloud','xCaja','xAcc'].forEach(function(id){var el=document.getElementById(id);if(el)el.checked=false;});
  svUpdExt();
  svPhotos=[];
  renderSvPhotoPreview();
  ['svN0','svN1','svN2','svN3'].forEach(function(id){var el=document.getElementById(id);if(el)el.disabled=true;});
  var searchEl=document.getElementById('svModelSearch');if(searchEl)searchEl.value='';
  ['svNombre','svDni','svTel','svEmail','svCiudad'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var cbu=document.getElementById('svCBU');if(cbu)cbu.className='hidden';
  var alias=document.getElementById('svAlias');if(alias)alias.className='hidden';
  document.querySelectorAll('.eopt,.vopt').forEach(function(e){e.classList.remove('act');});
  clearSig();
}
