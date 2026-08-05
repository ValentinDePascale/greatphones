// =========== WARRANTY ===========

var EXTEND_PLANS=[
  {id:'12m',label:'12 meses cobertura completa',months:12,price:85000,desc:'Cobertura total por 12 meses adicionales'},
  {id:'24m',label:'24 meses',months:24,price:150000,desc:'Cobertura total por 24 meses adicionales'}
];

function garChk(){
  var code=document.getElementById('garCodigo');
  var imei=document.getElementById('garImei');
  var btn=document.getElementById('garVerBtn');
  if(!code||!btn)return;
  var codeOk=code.value.trim().length>=5;
  var imeiOk=imei&&imei.value.trim().length===15;
  btn.disabled=!(codeOk&&imeiOk);
}

async function garVerificar(){
  var code=document.getElementById('garCodigo');
  var imei=document.getElementById('garImei');
  var btn=document.getElementById('garVerBtn');
  var resultDiv=document.getElementById('garResult');
  if(!code||!btn)return;

  var codeVal=code.value.trim();
  var imeiVal=imei?imei.value.trim():'';
  if(codeVal.length<5||imeiVal.length!==15)return;

  btn.disabled=true;
  btn.innerHTML='<span style="display:inline-flex;align-items:center;gap:6px"><span class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></span> Verificando...</span>';

  try{
    var url='/api/warranty?code='+encodeURIComponent(codeVal)+'&imei='+encodeURIComponent(imeiVal);
    var res=await fetch(url);
    var data=await res.json();
    if(!res.ok){
      renderGarError(data.error||'No se encontró la orden');
      return;
    }
    renderGarantiaResult(data);
  }catch(e){
    renderGarError('Error de conexión. Intentá nuevamente.');
  }finally{
    btn.disabled=false;
    btn.innerHTML='Verificar compra';
  }
}

function renderGarError(msg){
  var div=document.getElementById('garResult');
  if(!div)return;
  div.style.display='block';
  div.innerHTML='<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);padding:1.25rem;margin-top:1.5rem">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:20px">&#10060;</span>'+
      '<span style="font-size:13px;font-weight:700;color:#991B1B">Error</span>'+
    '</div>'+
    '<div style="font-size:12px;color:#991B1B;line-height:1.6">'+msg+'</div>'+
  '</div>';
}

function renderGarSuccess(msg){
  var div=document.getElementById('garResult');
  if(!div)return;
  div.style.display='block';
  div.innerHTML='<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--r);padding:1.25rem;margin-top:1.5rem">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:20px">&#9989;</span>'+
      '<span style="font-size:13px;font-weight:700;color:#166534">'+msg+'</span>'+
    '</div>'+
  '</div>';
}

function renderGarantiaResult(data){
  var div=document.getElementById('garResult');
  if(!div)return;
  div.style.display='block';

  var info=data.warrantyInfo;
  var isActive=info.isActive;
  var statusColor=isActive?'#16A34A':'#DC2626';
  var statusBg=isActive?'rgba(22,163,74,.08)':'rgba(220,38,38,.08)';
  var statusBorder=isActive?'rgba(22,163,74,.2)':'rgba(220,38,38,.2)';
  var statusText=isActive?'Garantía activa':'Garantía vencida';
  var statusIcon=isActive?'&#9989;':'&#10060;';

  var expiresDate=new Date(info.expiresAt);
  var expiresStr=expiresDate.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});

  var createdDate=new Date(data.createdAt);
  var createdStr=createdDate.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});

  var extendInfo=data.extendInfo||null;
  var hasExtend=extendInfo&&extendInfo.active;

  var html='<div style="background:#fff;border:1px solid var(--border);border-radius:var(--rlg);padding:1.5rem;margin-top:1.5rem">'+
    // Status badge
    '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:'+statusBg+';border:1px solid '+statusBorder+';margin-bottom:1rem">'+
      '<span style="font-size:14px">'+statusIcon+'</span>'+
      '<span style="font-size:12px;font-weight:700;color:'+statusColor+'">'+statusText+'</span>'+
    '</div>'+

    // Order code
    '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">Código de compra</div>'+
    '<div style="font-size:15px;font-weight:700;color:var(--dk);margin-bottom:16px;font-family:monospace">'+data.orderCode+'</div>'+

    // Warranty details grid
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'+
      '<div style="background:var(--cream);border-radius:10px;padding:12px">'+
        '<div style="font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Tipo de garantía</div>'+
        '<div style="font-size:13px;font-weight:600;color:var(--dk)">'+info.type+'</div>'+
      '</div>'+
      '<div style="background:var(--cream);border-radius:10px;padding:12px">'+
        '<div style="font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">'+(isActive?'Días restantes':'Días vencidos')+'</div>'+
        '<div style="font-size:13px;font-weight:600;color:'+statusColor+'">'+(isActive?info.daysRemaining+' días':'Vencida')+'</div>'+
      '</div>'+
      '<div style="background:var(--cream);border-radius:10px;padding:12px">'+
        '<div style="font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Fecha de compra</div>'+
        '<div style="font-size:13px;font-weight:600;color:var(--dk)">'+createdStr+'</div>'+
      '</div>'+
      '<div style="background:var(--cream);border-radius:10px;padding:12px">'+
        '<div style="font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Vencimiento</div>'+
        '<div style="font-size:13px;font-weight:600;color:'+(isActive?'var(--dk)':'var(--red)')+'">'+expiresStr+'</div>'+
      '</div>'+
    '</div>';

  // Show if already extended
  if(hasExtend){
    html+='<div style="background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.15);border-radius:10px;padding:12px;margin-bottom:16px">'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:18px">&#128737;</span>'+
        '<div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--green)">Tenes garantía extendida activa</div>'+
          '<div style="font-size:11px;color:var(--gray);margin-top:2px">'+extendInfo.type+' &middot; Vence '+extendInfo.expiresStr+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }

  // Products
  if(data.items&&data.items.length>0){
    html+='<div style="font-size:11px;font-weight:700;color:var(--dk);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Productos de tu compra</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">';
    data.items.forEach(function(item){
      html+='<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--cream);border-radius:10px">'+
        (item.imageUrl?'<img src="'+item.imageUrl+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover">':'<div style="width:40px;height:40px;border-radius:8px;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:18px">&#128241;</div>')+
        '<div style="flex:1">'+
          '<div style="font-size:12px;font-weight:600;color:var(--dk)">'+(item.brand?item.brand+' ':'')+item.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">x'+item.quantity+'</div>'+
        '</div>'+
        '<div style="font-size:12px;font-weight:700;color:var(--dk)">$'+item.price.toLocaleString('es-AR')+'</div>'+
      '</div>';
    });
    html+='</div>';
  }

  // Extension plans
  if(info.canExtend&&isActive&&!hasExtend){
    html+='<div style="background:rgba(45,90,39,.06);border:1px solid rgba(45,90,39,.15);border-radius:10px;padding:12px;margin-bottom:12px;text-align:center">'+
      '<div style="font-size:12px;color:var(--green);line-height:1.6;margin-bottom:12px">'+
        '<strong>&#128737; Extendé tu garantía</strong><br>'+
        'Todavía estás dentro de los 12 meses de tu compra. Elegí el plan que prefieras:'+
      '</div>'+
      '<div style="display:flex;gap:10px">'+
        EXTEND_PLANS.map(function(p){
          var cuota=Math.round(p.price/12);
          return '<div style="flex:1;background:#fff;border:2px solid var(--border);border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--green)\'" onmouseout="this.style.borderColor=\'var(--border)\'" onclick="garConfirmExtend(\''+p.id+'\')">'+
            '<div style="font-size:13px;font-weight:700;color:var(--dk);margin-bottom:4px">'+p.label+'</div>'+
            '<div style="font-size:18px;font-weight:800;color:var(--orange);margin-bottom:4px">$'+p.price.toLocaleString('es-AR')+'</div>'+
            '<div style="font-size:10px;color:var(--green)">12x $'+cuota.toLocaleString('es-AR')+' sin interés</div>'+
            '<div style="font-size:9px;color:var(--gray);margin-top:4px">'+p.desc+'</div>'+
          '</div>';
        }).join('')+
      '</div>'+
    '</div>';
  }else if(!isActive){
    html+='<div style="background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.15);border-radius:10px;padding:12px">'+
      '<div style="font-size:12px;color:var(--red);line-height:1.6">'+
        '<strong>Tu garantía ha vencido.</strong> Si tenés algún problema con tu equipo, contactanos por chat y te ayudamos.'+
      '</div>'+
    '</div>';
  }

  html+='</div>';
  div.innerHTML=html;
}

function garConfirmExtend(planId){
  var plan=EXTEND_PLANS.find(function(p){return p.id===planId;});
  if(!plan)return;
  if(!confirm('¿Confirmás la compra de Garantía Extendida '+plan.label+' por $'+plan.price.toLocaleString('es-AR')+'?'))return;

  var code=document.getElementById('garCodigo');
  var imei=document.getElementById('garImei');
  if(!code||!imei)return;

  fetch('/api/warranty/preference',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      code:code.value.trim(),
      imei:imei.value.trim(),
      plan:planId
    })
  }).then(function(r){return r.json();}).then(function(data){
    if(data.error||!data.initPoint)throw new Error(data.error||'Error al crear el pago');
    window.location.href=data.initPoint;
  }).catch(function(e){
    renderGarError(e.message||'Error al procesar el pago. Intentá nuevamente.');
  });
}
