// =========== SELL / COTIZ ===========
function svStep(n){
  document.querySelectorAll('[id^="svS"]').forEach(function(el){el.classList.add('hidden');});
  document.getElementById('svS'+n).classList.remove('hidden');
  var bars=document.querySelectorAll('.sb');
  bars.forEach(function(b,i){b.className='sb'+(i<n?' dn':i===n?' cur':'');});
}
function svCat(cat,btn){
  sv.cat=cat;
  document.querySelectorAll('.csbtn').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  var sel=document.getElementById('svMod');
  sel.innerHTML='<option value="">Selecciona el modelo</option>'+(SELL_MODELS[cat]||[]).map(function(m){return '<option value="'+m+'">'+m+'</option>';}).join('');
}
function svCond(cond,mult,btn){
  sv.cond=cond;
  sv.condMult=mult;
  document.querySelectorAll('.cond-card').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  svRecalc();
}
function svChk1(){
  var mod=document.getElementById('svMod').value;
  var stor=document.getElementById('svStor').value;
  document.getElementById('svN1').disabled=!(mod&&stor);
}
function svChk3(){document.getElementById('svN3').disabled=!(sv.envio&&sv.cobro);}
function svChk4(){
  var nom=document.getElementById('svNombre').value.trim();
  var dni=document.getElementById('svDni').value.trim();
  var tel=document.getElementById('svTel').value.trim();
  document.getElementById('svN4').disabled=!(nom&&dni&&tel);
}
function svRecalc(){
  var base=COTIZ_BASE[document.getElementById('svMod').value]||0;
  var storMult=SMULT[document.getElementById('svStor').value]||1;
  var condMult=sv.condMult||1;
  var total=base*storMult*condMult;
  sv.price=Math.round(total);
  document.getElementById('svPriceBig').textContent=fmt(sv.price);
  document.getElementById('svPriceRange').textContent='Precio estimado. Sujeto a revision.';
}
function svShowPreview(){
  var base=COTIZ_BASE[document.getElementById('svMod').value]||0;
  var storMult=SMULT[document.getElementById('svStor').value]||1;
  document.getElementById('svPreview').textContent=fmt(Math.round(base*storMult));
}
function svEnvio(env,btn){
  sv.envio=env;
  document.querySelectorAll('.eopt').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  svChk3();
}
function svCobro(cob,btn){
  sv.cobro=cob;
  document.querySelectorAll('.vopt').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  document.getElementById('svCBU').classList.toggle('hidden',cob!=='transfer');
  document.getElementById('svAlias').classList.toggle('hidden',cob!=='mp');
  svChk3();
}
function svUpdExt(){
  var p=document.getElementById('xPant').checked?COTIZ_EXT.pant:0;
  var b=document.getElementById('xBat').checked?COTIZ_EXT.bat:0;
  var i=document.getElementById('xIcloud').checked?COTIZ_EXT.icloud:0;
  var c=document.getElementById('xCaja').checked?COTIZ_EXT.caja:0;
  var a=document.getElementById('xAcc').checked?COTIZ_EXT.acc:0;
  document.getElementById('ci-pant').textContent=p>0?'+$'+fmt(Math.round(sv.price*p)):'--';
  document.getElementById('ci-bat').textContent=b>0?'+$'+fmt(Math.round(sv.price*b)):'--';
  document.getElementById('ci-icloud').textContent=i>0?'-$'+fmt(Math.round(sv.price*i)):'--';
  document.getElementById('ci-caja').textContent=c>0?'+$'+fmt(Math.round(sv.price*c)):'--';
  document.getElementById('ci-acc').textContent=a>0?'+$'+fmt(Math.round(sv.price*a)):'--';
}
function svReset(){sv={cat:'iPhone',model:'',storage:'',cond:'',condMult:1,envio:'',cobro:'',price:0};svStep(0);}
