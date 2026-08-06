// =========== CHECKOUT ===========
var checkoutState={cuotas:1,warranty:0,delivery:0,shippingCalculated:false};
var _selectedPaymentMethod=null;

function selCheckoutCuota(btn,cuotas){
  checkoutState.cuotas=cuotas;
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b){
    var isSelected=b===btn;
    // Button base
    b.style.background=isSelected?'var(--green)':'#fff';
    b.style.borderColor=isSelected?'var(--green)':'var(--border)';
    // Icon circle
    var iconDiv=b.children[0];
    if(iconDiv){
      iconDiv.style.background=isSelected?'rgba(255,255,255,.2)':'var(--cream2)';
      var numSpan=iconDiv.children[0];
      if(numSpan)numSpan.style.color=isSelected?'#fff':'var(--dk)';
    }
    // Text content
    var textWrap=b.children[1];
    if(textWrap){
      var titleRow=textWrap.children[0];
      if(titleRow)titleRow.style.color=isSelected?'#fff':'var(--dk)';
      var subtitle=textWrap.children[1];
      if(subtitle)subtitle.style.color=isSelected?'rgba(255,255,255,.8)':'var(--gray)';
      // Badge inside title
      var badge=titleRow?titleRow.children[0]:null;
      if(badge&&badge.tagName==='SPAN'){
        if(isSelected){
          badge.style.background='rgba(255,255,255,.3)';
          badge.style.color='#fff';
          badge.style.padding='4px 10px';
        }else{
          badge.style.background='none';
          badge.style.color=badge.textContent.includes('INTERES')?'var(--green)':'var(--orange)';
          badge.style.padding='4px 10px';
        }
      }
    }
    // Arrow icon
    var arrow=b.children[2];
    if(arrow){
      arrow.style.display=isSelected?'none':'block';
      if(!isSelected)arrow.style.stroke='var(--gray)';
    }
  });
  updateCheckoutTotal();
  updateCuotasMonthly();
}

function updateCuotasMonthly(){
  var subtotal=cartTotal();
  var total=subtotal+checkoutState.warranty+(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b){
    var cuota=parseInt(b.getAttribute('data-cuota'));
    var subtitle=b.querySelector('.cuota-monthly');
    if(!subtitle)return;
    if(cuota===1){
      subtitle.textContent='Abonás todo de una';
    }else{
      var monthly=Math.round(total/cuota);
      subtitle.textContent='$'+monthly.toLocaleString('es-AR')+'/mes × '+cuota+' cuotas';
    }
  });
}

function selCheckoutWarranty(btn,amount){
  checkoutState.warranty=amount;
  document.querySelectorAll('#checkout-warranty .warranty-btn').forEach(function(b){
    b.style.border='2px solid var(--border)';
  });
  btn.style.border='2px solid var(--green)';
  updateCheckoutTotal();
}

function selCheckoutDelivery(btn,amount){
  checkoutState.delivery=amount==='enviopack'?'enviopack':amount;
  checkoutState.selectedCarrier=null;
  checkoutState.selectedService=null;
  document.querySelectorAll('#checkout-delivery .delivery-btn').forEach(function(b){
    b.style.border='2px solid var(--border)';
  });
  btn.style.border='2px solid var(--green)';
  if(amount!=='enviopack'){
    var optBox=document.getElementById('enviopack-options');
    if(optBox)optBox.style.display='none';
  }
  updateCheckoutTotal();
}

function calcEnvioPackShipping(){
  var btn=document.getElementById('btn-calc-shipping');
  var priceEl=document.getElementById('enviopack-price');
  var optBox=document.getElementById('enviopack-options');
  var province=document.getElementById('checkout-province').value;
  var zip=document.getElementById('checkout-zip').value;

  if(!province){
    showToast('Selecciona una provincia primero');
    return;
  }

  if(btn){
    btn.disabled=true;
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Calculando...';
  }

  fetch(API_URL+'/api/shipping/enviopack',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      cpOrigen:'8000',
      cpDestino:zip||'',
      peso:1,
      largo:20,
      ancho:20,
      alto:20,
      valor:50000
    })
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.error)throw new Error(data.error);
    var options=data.options||[];
    if(options.length===0)throw new Error('No hay opciones de envío disponibles');
    renderEnvioPackOptions(options);
    if(priceEl)priceEl.textContent=options.length+' opciones';
    if(btn){
      btn.innerHTML='✓ '+options.length+' opciones';
      btn.style.background='rgba(45,90,39,.1)';
      btn.style.borderColor='var(--green)';
      btn.style.color='var(--green)';
    }
    var provSelect=document.getElementById('checkout-province');
    if(provSelect){
      provSelect.disabled=true;
      provSelect.style.opacity='0.6';
      provSelect.style.cursor='not-allowed';
    }
  })
  .catch(function(e){
    console.error('Envío Pack error:',e);
    if(priceEl)priceEl.textContent='Error';
    if(btn){
      btn.disabled=false;
      btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Reintentar';
    }
    showToast('Error al calcular: '+e.message);
  });
}

function getCarrierLogo(carrier){
  var c=carrier.toLowerCase();
  if(c.indexOf('andreani')!==-1)return'<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#003DA5"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="DM Sans,sans-serif">A</text></svg>';
  if(c.indexOf('oca')!==-1)return'<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#E31937"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="DM Sans,sans-serif">OCA</text></svg>';
  if(c.indexOf('correo')!==-1)return'<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#004B87"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="DM Sans,sans-serif">CA</text></svg>';
  if(c.indexOf('moto')!==-1)return'<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#FF6B00"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="DM Sans,sans-serif">M</text></svg>';
  return'<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="var(--gray)"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="DM Sans,sans-serif">📦</text></svg>';
}

function renderEnvioPackOptions(options){
  var optBox=document.getElementById('enviopack-options');
  if(!optBox)return;

  var cheapest=options.reduce(function(min,o){return o.costo<min.costo?o:min;},options[0]);
  var fastest=options.reduce(function(min,o){
    var d1=parseInt(o.diasEstimados)||5;
    var d2=parseInt(min.diasEstimados)||5;
    return d1<d2?o:min;
  },options[0]);

  optBox.innerHTML='<div style="font-size:12px;font-weight:600;color:var(--dk);margin-bottom:8px">Elige una opción de envío:</div>'+
    options.map(function(opt){
      var badge='';
      if(opt===cheapest&&opt===fastest)badge='<span style="background:var(--green);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600">Mejor opción</span>';
      else if(opt===cheapest)badge='<span style="background:rgba(45,90,39,.1);color:var(--green);font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600">Más económico</span>';
      else if(opt===fastest)badge='<span style="background:rgba(255,107,44,.1);color:var(--orange);font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600">Más rápido</span>';

      return'<div class="ep-option" onclick="selectEnvioPackOption(this,'+JSON.stringify(opt).replace(/"/g,'&quot;')+
        ')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:#fff;border:2px solid var(--border);cursor:pointer;transition:all .15s;margin-bottom:6px">'+
        getCarrierLogo(opt.carrier)+
        '<div style="flex:1;min-width:0">'+
          '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;font-weight:600;color:var(--dk)">'+opt.carrier+'</span><span style="font-size:11px;color:var(--gray)">· '+opt.service+'</span></div>'+
          '<div style="font-size:11px;color:var(--gray);margin-top:2px">'+opt.diasEstimados+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:15px;font-weight:700;color:var(--orange)">$'+opt.costo.toLocaleString('es-AR')+'</div>'+
          badge+
        '</div>'+
      '</div>';
    }).join('');

  optBox.style.display='block';
}

function selectEnvioPackOption(el,opt){
  document.querySelectorAll('.ep-option').forEach(function(o){
    o.style.border='2px solid var(--border)';
    o.style.background='#fff';
  });
  el.style.border='2px solid var(--orange)';
  el.style.background='rgba(255,107,44,.04)';

  checkoutState.delivery=opt.costo;
  checkoutState.shippingCalculated=true;
  checkoutState.selectedCarrier=opt.carrier;
  checkoutState.selectedService=opt.service;

  var priceEl=document.getElementById('enviopack-price');
  if(priceEl)priceEl.textContent='+$'+opt.costo.toLocaleString('es-AR');

  updateCheckoutTotal();
}

function updateCheckoutTotal(){
  var subtotal=cartTotal();
  var deliveryCost=checkoutState.delivery==='enviopack'?0:(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  var total=subtotal+checkoutState.warranty+deliveryCost;
  var subtotalEl=document.getElementById('checkout-subtotal');
  var totalEl=document.getElementById('checkout-total');
  var warrantyLine=document.getElementById('checkout-warranty-line');
  var warrantyCost=document.getElementById('checkout-warranty-cost');
  var deliveryLine=document.getElementById('checkout-delivery-line');
  var deliveryCostEl=document.getElementById('checkout-delivery-cost');
  var cuotasLabel=document.getElementById('checkout-cuotas-label');
  var cuotasAmount=document.getElementById('checkout-cuotas-amount');
  var cuotasBox=document.getElementById('checkout-cuotas-box');
  var couponLine=document.getElementById('checkout-coupon-line');
  var couponCost=document.getElementById('checkout-coupon-cost');
  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  var couponTotal=typeof CPN!=='undefined'&&CPN.applied?CPN.applied.reduce(function(s,c){return s+c.amount},0):0;
  var displayTotal=couponTotal>0?total-couponTotal:total;
  if(totalEl)totalEl.textContent=fmt(displayTotal);
  if(couponLine&&couponCost){
    if(couponTotal>0){
      couponLine.style.display='flex';
      couponCost.textContent='-$'+couponTotal.toLocaleString('es-AR');
    }else{
      couponLine.style.display='none';
    }
  }
  if(warrantyLine){
    warrantyLine.style.display=checkoutState.warranty>0?'flex':'none';
    if(warrantyCost)warrantyCost.textContent='+$'+checkoutState.warranty.toLocaleString('es-AR');
  }
  if(deliveryLine){
    var showDelivery=deliveryCost>0;
    deliveryLine.style.display=showDelivery?'flex':'none';
    if(deliveryCostEl){
      if(checkoutState.delivery==='enviopack'){deliveryCostEl.textContent='A calcular';}
      else{deliveryCostEl.textContent='+$'+deliveryCost.toLocaleString('es-AR');}
    }
  }
  if(cuotasBox){
    if(checkoutState.cuotas>1){
      cuotasBox.style.display='flex';
      if(cuotasLabel)cuotasLabel.textContent=checkoutState.cuotas+'x sin interés';
      if(cuotasAmount)cuotasAmount.innerHTML='$'+Math.round(total/checkoutState.cuotas).toLocaleString('es-AR')+'<span style="font-size:10px;font-weight:500;color:var(--gray)">/mes</span>';
      var sidebarTotal=document.getElementById('checkout-cuotas-sidebar-total');
      if(sidebarTotal)sidebarTotal.textContent='Total: $'+total.toLocaleString('es-AR');
    }else{
      cuotasBox.style.display='none';
    }
  }
  var btn=document.getElementById('btn-final-pay');
  if(btn){
    if(Cart.length===0){
      btn.disabled=true;
      btn.style.opacity='0.5';
    }else{
      btn.disabled=false;
      btn.style.opacity='1';
    }
  }
  updateCuotasMonthly();
}

function resetCheckoutSelections(){
  checkoutState={cuotas:1,warranty:0,delivery:0,shippingCalculated:false,selectedCarrier:null,selectedService:null};
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b,i){
    var isSelected=i===0;
    b.style.background=isSelected?'var(--green)':'#fff';
    b.style.borderColor=isSelected?'var(--green)':'var(--border)';
    var iconDiv=b.children[0];
    if(iconDiv){
      iconDiv.style.background=isSelected?'rgba(255,255,255,.2)':'var(--cream2)';
      var numSpan=iconDiv.children[0];
      if(numSpan)numSpan.style.color=isSelected?'#fff':'var(--dk)';
    }
    var textWrap=b.children[1];
    if(textWrap){
      var titleRow=textWrap.children[0];
      if(titleRow)titleRow.style.color=isSelected?'#fff':'var(--dk)';
      var subtitle=textWrap.children[1];
      if(subtitle)subtitle.style.color=isSelected?'rgba(255,255,255,.8)':'var(--gray)';
      var badge=titleRow?titleRow.children[0]:null;
      if(badge&&badge.tagName==='SPAN'){
        if(isSelected){
          badge.style.background='rgba(255,255,255,.3)';
          badge.style.color='#fff';
        }else{
          badge.style.background='none';
          badge.style.color=badge.textContent.includes('INTERES')?'var(--green)':'var(--orange)';
        }
      }
    }
    var arrow=b.children[2];
    if(arrow){
      arrow.style.display=isSelected?'none':'block';
      if(!isSelected)arrow.style.stroke='var(--gray)';
    }
  });
  document.querySelectorAll('#checkout-warranty .warranty-btn').forEach(function(b,i){
    b.style.border=i===0?'2px solid var(--green)':'2px solid var(--border)';
  });
  document.querySelectorAll('#checkout-delivery .delivery-btn').forEach(function(b,i){
    b.style.border=i===0?'2px solid var(--green)':'2px solid var(--border)';
  });
  var provSelect=document.getElementById('checkout-province');
  if(provSelect){
    provSelect.disabled=false;
    provSelect.style.opacity='1';
    provSelect.style.cursor='pointer';
  }
  var optBox=document.getElementById('enviopack-options');
  if(optBox)optBox.style.display='none';
  var priceEl=document.getElementById('enviopack-price');
  if(priceEl)priceEl.textContent='Calcular';
  var btn=document.getElementById('btn-calc-shipping');
  if(btn){
    btn.disabled=false;
    btn.style.background='var(--cream)';
    btn.style.borderColor='var(--border)';
    btn.style.color='var(--dk)';
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Calcular envío';
  }
  updateCheckoutTotal();
}

function prefillCheckoutFields(){
  if(!currentUser)return;
  var direccion=currentUser.direccion||'';
  var direccionMatch=direccion.match(/^(.+?)\s+(\d+)$/);
  var streetValue='';
  var numberValue='';
  if(direccionMatch){
    streetValue=direccionMatch[1]||'';
    numberValue=direccionMatch[2]||'';
  }else{
    streetValue=direccion;
  }
  var mappings={
    'checkout-email':currentUser.email,
    'checkout-phone':currentUser.phone,
    'checkout-document':currentUser.dni,
    'checkout-street':streetValue,
    'checkout-number':numberValue,
    'checkout-floor':currentUser.piso,
    'checkout-zip':currentUser.cp,
    'checkout-city':currentUser.ciudad,
    'checkout-province':currentUser.provincia
  };
  for(var key in mappings){
    var el=document.getElementById(key);
    if(el&&mappings[key]){
      el.value=mappings[key];
    }
  }
}

function openCheckout(){
  if(Cart.length===0){
    showToast('El carrito está vacío');
    return;
  }
  if(!currentUser){
    showToast('Inicia sesión para continuar con la compra');
    closeCart();
    nav('login');
    return;
  }
  closeCart();
  nav('checkout');
  setTimeout(function(){
    resetCheckoutSelections();
    prefillCheckoutFields();
    renderCheckoutSummary();
    showCheckoutStep(1);
    if(typeof cpnUpdateCheckoutCard==='function'){
      CPN.applied=[];
      CPN.discountTotal=0;
      cpnUpdateCheckoutCard();
    }
  },100);
}

function showCheckoutStep(step){
  var steps=document.querySelectorAll('.checkout-step');
  var contents=document.querySelectorAll('.checkout-step-content');
  steps.forEach(function(s,i){
    var num=i+1;
    var circle=s.querySelector('div');
    var label=s.querySelector('span');
    if(num<step){
      circle.style.background='var(--green)';
      circle.style.color='#fff';
      circle.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>';
      label.style.color='var(--green)';
      label.style.fontWeight='600';
    }else if(num===step){
      circle.style.background='var(--orange)';
      circle.style.color='#fff';
      circle.textContent=num;
      label.style.color='var(--dk)';
      label.style.fontWeight='600';
    }else{
      circle.style.background='var(--cream2)';
      circle.style.color='var(--gray)';
      circle.textContent=num;
      label.style.color='var(--gray)';
      label.style.fontWeight='500';
    }
  });
  contents.forEach(function(c){
    var s=parseInt(c.getAttribute('data-step'));
    c.style.display=s===step?'block':'none';
  });
  if(step===3)renderCheckoutSummaryStep();
  if(step===4){
    if(typeof updateCuotasMonthly==='function')updateCuotasMonthly();
    if(typeof cpnUpdateCheckoutCard==='function')cpnUpdateCheckoutCard();
    var preorderSection=document.getElementById('preorder-agreement-section');
    if(preorderSection){
      var hasPreorder=Cart.some(function(item){return item.isPreorder;});
      preorderSection.style.display=hasPreorder?'block':'none';
      if(hasPreorder){
        var chk=document.getElementById('preorder-agreement');
        if(chk)chk.checked=false;
        var btn=document.getElementById('btn-final-pay');
        if(btn){btn.disabled=true;btn.style.opacity='0.5';}
      }else{
        var btn2=document.getElementById('btn-final-pay');
        if(btn2){btn2.disabled=false;btn2.style.opacity='1';}
      }
    }
  }
}

function validateStep1(){
  var fields={
    'checkout-email':{label:'Email',test:function(v){return v&&v.includes('@');}},
    'checkout-phone':{label:'Teléfono',test:function(v){return v&&v.trim().length>0;}},
    'checkout-document':{label:'DNI o CUIT',test:function(v){return v&&v.trim().length>0;}},
    'checkout-street':{label:'Calle',test:function(v){return v&&v.trim().length>0;}},
    'checkout-number':{label:'Número',test:function(v){return v&&v.trim().length>0;}},
    'checkout-zip':{label:'Código Postal',test:function(v){return v&&v.trim().length>0;}},
    'checkout-city':{label:'Ciudad',test:function(v){return v&&v.trim().length>0;}},
    'checkout-province':{label:'Provincia',test:function(v){return v&&v!=='';}},
  };
  var errors=[];
  for(var id in fields){
    var el=document.getElementById(id);
    var val=el?el.value:'';
    if(!fields[id].test(val)){
      errors.push(fields[id].label);
      if(el)el.style.borderColor='var(--red)';
    }else{
      if(el)el.style.borderColor='var(--border)';
    }
  }
  return errors;
}

function checkoutNextStep(targetStep){
  if(targetStep===2){
    var errors=validateStep1();
    if(errors.length>0){
      showToast('Completá: '+errors.join(', '));
      return;
    }
    showCheckoutStep(2);
  }else if(targetStep===3){
    showCheckoutStep(3);
  }else if(targetStep===4){
    renderCheckoutSummaryStep();
    showCheckoutStep(4);
  }
}

function checkoutPrevStep(targetStep){
  showCheckoutStep(targetStep);
}

function selectPaymentMethod(method, el){
  _selectedPaymentMethod=method;
  var cards=document.querySelectorAll('.payment-method-card');
  cards.forEach(function(card,i){
    card.style.borderColor='var(--border)';
    card.style.background='none';
  });
  var target=el||(window.event?window.event.currentTarget:null);
  if(target){
    target.style.borderColor='var(--orange)';
    target.style.background='rgba(255,107,44,.05)';
  }
  if(method==='coupons'){
    cpnOpenModal();
  }
  if(method==='efectivo'){
    showToast('Vas a pagar en efectivo. Vas a recibir un cupón de pago por email para abonar en cualquier sucursal de Pago Fácil o Rapi Pago.');
  }
}

function submitOrder(){
  var total=cartTotal()+checkoutState.warranty+(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  var hasCoupons=CPN.applied.length>0;
  var couponTotal=CPN.applied.reduce(function(s,c){return s+c.amount},0);
  var remaining=total-couponTotal;

  if(!_selectedPaymentMethod&&!(hasCoupons&&remaining<=0)){
    showToast('Seleccioná un método de pago');
    return;
  }
  if(hasCoupons&&remaining>0&&(!_selectedPaymentMethod||_selectedPaymentMethod==='coupons')){
    showToast('Seleccioná otro método de pago para el saldo restante');
    return;
  }

  var hasPreorder=Cart.some(function(item){return item.isPreorder;});
  if(hasPreorder){
    var agreement=document.getElementById('preorder-agreement');
    if(!agreement||!agreement.checked){
      showToast('Debe aceptar los términos de preventa para continuar');
      return;
    }
  }

  var btn=document.getElementById('btn-final-pay');
  if(btn){
    btn.disabled=true;
    btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Procesando...';
  }

  var items=Cart.map(function(item){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId)||getById(PREORDER_PRODUCTS,lookupId);
    if(p){
      var price=isOfferValid(p)?Math.round(p.price-p.price*p.discount/100):p.price;
      return{id:p.id,name:p.name,sub:p.sub,imageUrl:p.imageUrl,price:price,quantity:item.qty,isPreorder:!!item.isPreorder,availableFrom:item.availableFrom||null};
    }
    var a=getById(window.ACCS,lookupId);
    if(a){
      return{id:a.id,name:a.name,sub:(a.brand||'')+' '+(a.color||''),imageUrl:a.imageUrl,price:a.price,quantity:item.qty};
    }
    return null;
  }).filter(function(i){return i;});

  var subtotal=cartTotal();
  var warrantyLabel=checkoutState.warranty>0?(checkoutState.warranty===85000?'+12 meses cobertura completa':'+24 meses'):'12 meses';
  var deliveryLabel=checkoutState.delivery===0?'Retiro en tienda':(checkoutState.delivery===5000?'Express':'Envío 24-48hs');
  if(checkoutState.delivery==='enviopack')deliveryLabel='Envío Pack';
  if(checkoutState.selectedCarrier)deliveryLabel=checkoutState.selectedCarrier;

  var actualPaymentMethod = (hasCoupons && remaining <= 0) ? 'coupons' : (_selectedPaymentMethod || 'mercadopago');

  var payload={
    items:items,
    email:document.getElementById('checkout-email').value,
    phone:document.getElementById('checkout-phone').value||'',
    street:document.getElementById('checkout-street').value,
    number:document.getElementById('checkout-number').value,
    floor:document.getElementById('checkout-floor').value||'',
    zip:document.getElementById('checkout-zip').value,
    city:document.getElementById('checkout-city').value,
    province:document.getElementById('checkout-province').value,
    document:document.getElementById('checkout-document').value,
    warranty:warrantyLabel,
    delivery:deliveryLabel,
    cuotas:checkoutState.cuotas,
    subtotal:subtotal,
    warrantyCost:checkoutState.warranty,
    deliveryCost:typeof checkoutState.delivery==='number'?checkoutState.delivery:0,
    total:total,
    paymentMethod:actualPaymentMethod,
    carrier:checkoutState.selectedCarrier||null,
    carrierService:checkoutState.selectedService||null,
    coupons:hasCoupons?CPN.applied.map(function(c){return c.id}):[],
    agreedToTerms: hasPreorder
  };

  if(hasCoupons)payload.couponDiscount=couponTotal;

  fetch(API_URL+'/api/checkout',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  })
  .then(function(response){return response.json();})
  .then(function(data){
    console.log('Checkout response:', data);
    if(data.error)throw new Error(data.error);
    Cart=[];
    saveCart();
    updCartBadge();
    CPN.applied=[];
    CPN.discountTotal=0;
    if(data.redirectUrl){
      window.location.href=data.redirectUrl;
    }else if(data.initPoint){
      window.location.href=data.initPoint;
    }else{
      showToast('¡Compra realizada con éxito!');
      setTimeout(function(){window.location.href='/'},1500);
    }
  })
  .catch(function(error){
    console.error('Checkout error:',error);
    showToast('Error: '+error.message);
    if(btn){
      btn.disabled=false;
      btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Pagar ahora';
    }
  });
}

function renderCheckoutSummaryStep(){
  var container=document.getElementById('checkout-summary-items');
  if(!container)return;
  if(Cart.length===0){
    container.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p style="font-size:36px;margin-bottom:.5rem">🛒</p><p style="font-size:14px">No hay productos en el carrito</p></div>';
    return;
  }
  container.innerHTML=Cart.map(function(item, idx){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId)||getById(PREORDER_PRODUCTS,lookupId);
    if(p){
      var isPromo=isOfferValid(p);
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:22px">📱</span>';
      return'<div class="checkout-item" style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:52px;height:52px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">x'+item.qty+' · '+fmt(price)+'</div>'+
        '</div>'+
        '<div style="font-size:13px;font-weight:700;white-space:nowrap">'+fmt(price*item.qty)+'</div>'+
      '</div>';
    }else{
      sumCouponLine.style.display='none';
    }
  }).join('');
}

function closeCheckout(){
  nav('shop');
}

function renderCheckoutSummary(){
  var itemsContainer=document.getElementById('checkout-items');
  var subtotalEl=document.getElementById('checkout-subtotal');
  var totalEl=document.getElementById('checkout-total');

  if(!itemsContainer)return;

  if(Cart.length===0){
    itemsContainer.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p style="font-size:36px;margin-bottom:.5rem">🛒</p><p style="font-size:14px">No hay productos en el carrito</p></div>';
    if(subtotalEl)subtotalEl.textContent='$0';
    if(totalEl)totalEl.textContent='$0';
    return;
  }

  var productsLoaded=PRODUCTS.length>0;
  var accsLoaded=window.ACCS&&window.ACCS.length>0;
  if(!productsLoaded||!accsLoaded){
    renderCheckoutItems(Cart);
    updateCheckoutTotal();
    return;
  }

  var validItems=Cart.filter(function(item){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId)||getById(PREORDER_PRODUCTS,lookupId);
    var a=getById(window.ACCS,lookupId);
    return p||a;
  });

  if(validItems.length<Cart.length){
    var removed=Cart.length-validItems.length;
    Cart=validItems;
    saveCart();
    updCartBadge();
    showToast(removed+' producto(s) eliminado(s) del carrito');
  }

  if(Cart.length===0){
    itemsContainer.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p style="font-size:36px;margin-bottom:.5rem">🛒</p><p style="font-size:14px">No hay productos en el carrito</p></div>';
    if(subtotalEl)subtotalEl.textContent='$0';
    if(totalEl)totalEl.textContent='$0';
    return;
  }

  renderCheckoutItems(Cart);
}

function renderCheckoutItems(items){
  var itemsContainer=document.getElementById('checkout-items');
  var subtotalEl=document.getElementById('checkout-subtotal');
  var totalEl=document.getElementById('checkout-total');
  if(!itemsContainer)return;

  var subtotal=cartTotal();

  var html=items.map(function(item, idx){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId)||getById(PREORDER_PRODUCTS,lookupId);
    if(p){
      var isPromo=isOfferValid(p);
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:22px">📱</span>';
      var priceHtml=isPromo?
        '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>'+
        '<div style="font-size:9px;color:var(--gray);text-decoration:line-through">'+fmt(p.price*item.qty)+'</div>'+
        '<div style="font-size:9px;color:var(--red);font-weight:600">-'+p.discount+'%</div>':
        '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>';
      return'<div class="checkout-item" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:center">'+
        '<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:10px;color:var(--gray)">Cant: '+item.qty+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+priceHtml+'</div>'+
      '</div>';
    }
    var a=getById(window.ACCS,lookupId);
    if(!a)return '';
    var img2=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:22px">📦</span>';
    return'<div class="checkout-item" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:center">'+
      '<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img2+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:10px;color:var(--gray)">Cant: '+item.qty+'</div>'+
      '</div>'+
      '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(a.price*item.qty)+'</div>'+
    '</div>';
  }).join('');
  itemsContainer.innerHTML=html;

  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(subtotal);
  updateCheckoutTotal();
}

function togPreorderAgreement(){
  var chk=document.getElementById('preorder-agreement');
  if(!chk)return;
  var btn=document.getElementById('btn-final-pay');
  if(!btn)return;
  if(chk.checked){
    btn.disabled=false;
    btn.style.opacity='1';
  }else{
    btn.disabled=true;
    btn.style.opacity='0.5';
  }
}

function checkout(){
  if(Cart.length===0){
    showToast('El carrito está vacío');
    return;
  }
  openCheckout();
}

function fmt(n){return'$'+n.toLocaleString('es-AR');}
