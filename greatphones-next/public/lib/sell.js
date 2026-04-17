// =========== SELL / TASACION ===========
var sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},finalPrice:0};
function svStep(n){
  for(var i=0;i<=6;i++){var el=document.getElementById('svS'+i);if(el)el.className=(i===n)?'':'hidden';}
  var bars=document.querySelectorAll('#svBar .sv-bar');
  bars.forEach(function(b,i){b.className='sv-bar'+(i<n?' done':i===n?' cur':'');});
  if(n===3)svRenderPrice();
  if(n===4)svBuildSum();
  if(n===5)svSetupSig();
}
function svCat(cat,el){
  sv.cat=cat;
  document.querySelectorAll('.csbtn').forEach(function(b){b.classList.remove('act');});
  if(el)el.classList.add('act');
  var sel=document.getElementById('svMod');
  if(!sel)return;
  var models=SELL_MODELS[cat]||[];
  sel.innerHTML='<option value="">Selecciona el modelo</option>'+models.map(function(m){return'<option>'+m+'</option>';}).join('');
  sv.model='';sv.storage='';svChk1();
}
function svChk1(){
  sv.model=(document.getElementById('svMod')||{}).value||'';
  sv.storage=(document.getElementById('svStor')||{}).value||'';
  var btn=document.getElementById('svN1');
  if(btn)btn.disabled=!(sv.model&&sv.storage);
  if(sv.model&&sv.storage)svShowPreview();
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
function svEnvio(tipo,el){sv.envio=tipo;document.querySelectorAll('.eopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');svChk3();}
function svCobro(tipo,el){
  sv.cobro=tipo;document.querySelectorAll('.vopt').forEach(function(e){e.classList.remove('act');});if(el)el.classList.add('act');
  var cbu=document.getElementById('svCBU');var alias=document.getElementById('svAlias');
  if(cbu)cbu.className=tipo==='transfer'?'':'hidden';if(alias)alias.className=tipo==='mp'?'':'hidden';svChk3();
}
function svChk3(){var btn=document.getElementById('svN3');if(btn)btn.disabled=!(sv.envio&&sv.cobro);}
function svChk4(){var fields=['svNombre','svDni','svTel','svEmail'];var ok=fields.every(function(id){var el=document.getElementById(id);return el&&el.value.trim().length>1;});var btn=document.getElementById('svN4');if(btn)btn.disabled=!ok;}
function svBuildSum(){
  var envioNames={presencial:'Presencial en tienda',andreani:'Andreani prepaga',internacional:'Internacional DHL/FedEx',propio:'Correo propio'};
  var cobroNames={saldo:'Saldo GP (+5% bonus)',transfer:'Transferencia bancaria',mp:'Mercado Pago',efectivo:'Efectivo en sucursal'};
  var el=document.getElementById('svSum');
  if(!el)return;
  var rows=[{k:'Equipo',v:sv.cat+' '+sv.model},{k:'Almacenamiento',v:sv.storage},{k:'Estado',v:sv.cond},{k:'Precio estimado',v:fmt(sv.finalPrice||0)},{k:'Envio',v:envioNames[sv.envio]||sv.envio},{k:'Cobro',v:cobroNames[sv.cobro]||sv.cobro}];
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
  function move(e){if(!drawing)return;var p=getPos(e,canvas);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#1A1208';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();e.preventDefault();signed=true;document.getElementById('sigWrap').className='sig-wrap signed';document.getElementById('sigStatus').textContent='Firma capturada';var btn=document.getElementById('svN5');if(btn)btn.disabled=false;}
  function end(){drawing=false;}
  canvas.onmousedown=start;canvas.onmousemove=move;canvas.onmouseup=end;canvas.ontouchstart=start;canvas.ontouchmove=move;canvas.ontouchend=end;
}
function clearSig(){
  var canvas=document.getElementById('sigCanvas');
  if(!canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  document.getElementById('sigWrap').className='sig-wrap';
  document.getElementById('sigStatus').textContent='Traza tu firma arriba';
  var btn=document.getElementById('svN5');
  if(btn)btn.disabled=true;
}
function svRenderConfirm(){
  var msg=document.getElementById('svConfMsg');
  if(msg)msg.textContent='Funcionalidad de envío no disponible. Por favor contactanos por WhatsApp para completar tu venta.';
  var track=document.getElementById('svTrack');
  if(track)track.innerHTML='<div style="text-align:center;padding:1rem;color:var(--gray);font-size:12px">Conectate al backend para enviar la cotizacion</div>';
}
function svReset(){
  sv={cat:'iPhone',model:'',storage:'',cond:'Impecable',condMult:1.0,envio:'',cobro:'',extras:{},finalPrice:0};
  svStep(0);
  var mod=document.getElementById('svMod');
  if(mod){mod.innerHTML='<option value="">Selecciona el modelo</option>';SELL_MODELS['iPhone'].forEach(function(m){var o=document.createElement('option');o.textContent=m;mod.appendChild(o);});}
  ['xPant','xBat','xIcloud','xCaja','xAcc'].forEach(function(id){var el=document.getElementById(id);if(el)el.checked=false;});
  svUpdExt();
}
