// =========== CHECKOUT ===========
var checkoutState={cuotas:1,warranty:0,delivery:0,shippingCalculated:false};
var _selectedPaymentMethod=null;

function selCheckoutCuota(btn,cuotas){
  checkoutState.cuotas=cuotas;
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b){
    b.style.background='var(--cream2)';b.style.color='var(--dk)';b.style.border='2px solid var(--border)';
  });
  btn.style.background='var(--green)';btn.style.color='#fff';btn.style.border='2px solid var(--green)';
  updateCheckoutTotal();
  updateCuotaDetail();
}

function updateCuotaDetail(){
  var detail=document.getElementById('checkout-cuotas-detail');
  var label=document.getElementById('pago-cuotas-label');
  var amount=document.getElementById('pago-cuotas-amount');
  if(!detail)return;
  if(checkoutState.cuotas>1){
    var subtotal=cartTotal();
    var total=subtotal+checkoutState.warranty+(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
    detail.style.display='flex';
    if(label)label.textContent=checkoutState.cuotas+'x sin interés';
    if(amount)amount.textContent='$'+Math.round(total/checkoutState.cuotas).toLocaleString('es-AR')+'/mes';
  }else{
    detail.style.display='none';
  }
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
  checkoutState.delivery=amount==='andreani'?'andreani':amount;
  document.querySelectorAll('#checkout-delivery .delivery-btn').forEach(function(b){
    b.style.border='2px solid var(--border)';
  });
  btn.style.border='2px solid var(--green)';
  updateCheckoutTotal();
}

function calcAndreaniShipping(){
  var btn=document.getElementById('btn-calc-shipping');
  var priceEl=document.getElementById('andreani-price');
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

  fetch(API_URL+'/api/shipping/andreani',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      originZip:'8000',
      originCity:'Bahia Blanca',
      originProvince:'Buenos Aires',
      destZip:zip||'',
      destCity:document.getElementById('checkout-city').value||'',
      destProvince:province,
      weight:1
    })
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.error)throw new Error(data.error);
    var cost=data.cost||0;
    checkoutState.delivery=cost;
    checkoutState.shippingCalculated=true;
    if(priceEl)priceEl.textContent='+$'+cost.toLocaleString('es-AR');
    if(btn){
      btn.innerHTML='✓ Actualizado';
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
    updateCheckoutTotal();
  })
  .catch(function(e){
    console.error('Andreani error:',e);
    if(priceEl)priceEl.textContent='Error';
    if(btn){
      btn.disabled=false;
      btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Reintentar';
    }
    showToast('Error al calcular: '+e.message);
  });
}

function updateCheckoutTotal(){
  var subtotal=cartTotal();
  var deliveryCost=checkoutState.delivery==='andreani'?0:(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
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
  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(total);
  if(warrantyLine){
    warrantyLine.style.display=checkoutState.warranty>0?'flex':'none';
    if(warrantyCost)warrantyCost.textContent='+$'+checkoutState.warranty.toLocaleString('es-AR');
  }
  if(deliveryLine){
    var showDelivery=deliveryCost>0;
    deliveryLine.style.display=showDelivery?'flex':'none';
    if(deliveryCostEl){
      if(checkoutState.delivery==='andreani'){deliveryCostEl.textContent='A calcular';}
      else{deliveryCostEl.textContent='+$'+deliveryCost.toLocaleString('es-AR');}
    }
  }
  if(cuotasBox){
    if(checkoutState.cuotas>1){
      cuotasBox.style.display='flex';
      if(cuotasLabel)cuotasLabel.textContent=checkoutState.cuotas+'x sin interés';
      if(cuotasAmount)cuotasAmount.textContent='$'+Math.round(total/checkoutState.cuotas).toLocaleString('es-AR')+'/mes';
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
}

function resetCheckoutSelections(){
  checkoutState={cuotas:1,warranty:0,delivery:0,shippingCalculated:false};
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b,i){
    if(i===0){b.style.background='var(--green)';b.style.color='#fff';b.style.border='2px solid var(--green)';}
    else{b.style.background='var(--cream2)';b.style.color='var(--dk)';b.style.border='2px solid var(--border)';}
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
  if(step===4)updateCuotaDetail();
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

function selectPaymentMethod(method){
  _selectedPaymentMethod=method;
  var cards=document.querySelectorAll('.payment-method-card');
  cards.forEach(function(card,i){
    card.style.borderColor='var(--border)';
    card.style.background='none';
  });
  event.currentTarget.style.borderColor='var(--orange)';
  event.currentTarget.style.background='rgba(255,107,44,.05)';
}

function submitOrder(){
  if(!_selectedPaymentMethod){
    showToast('Seleccioná un método de pago');
    return;
  }
  var btn=document.getElementById('btn-final-pay');
  if(btn){
    btn.disabled=true;
    btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Procesando...';
  }

  var items=Cart.map(function(item){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId);
    if(p){
      var price=p.isOffer?Math.round(p.price-p.price*p.discount/100):p.price;
      return{id:p.id,name:p.name,sub:p.sub,imageUrl:p.imageUrl,price:price,quantity:item.qty};
    }
    var a=getById(window.ACCS,lookupId);
    if(a){
      return{id:a.id,name:a.name,sub:(a.brand||'')+' '+(a.color||''),imageUrl:a.imageUrl,price:a.price,quantity:item.qty};
    }
    return null;
  }).filter(function(i){return i;});

  var subtotal=cartTotal();
  var total=subtotal+checkoutState.warranty+(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  var warrantyLabel=checkoutState.warranty>0?(checkoutState.warranty===85000?'+12 meses':'+24 meses'):'90 días';
  var deliveryLabel=checkoutState.delivery===0?'Retiro en tienda':(checkoutState.delivery===5000?'Express':'Envío 24-48hs');
  if(checkoutState.delivery==='andreani')deliveryLabel='Andreani';

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
    paymentMethod:_selectedPaymentMethod||'mercadopago'
  };

  fetch(API_URL+'/api/checkout',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  })
  .then(function(response){return response.json();})
  .then(function(data){
    console.log('Checkout response:', data);
    if(data.error)throw new Error(data.error);
    if(data.initPoint){
      Cart=[];
      saveCart();
      updCartBadge();
      window.location.href=data.initPoint;
    }else{
      throw new Error('No se recibió link de pago');
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
  container.innerHTML=Cart.map(function(item){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId);
    if(p){
      var isPromo=p.isOffer&&p.discount>0;
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:22px">📱</span>';
      return'<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:52px;height:52px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">Cant: '+item.qty+'</div>'+
        '</div>'+
        '<div style="font-size:14px;font-weight:700;color:var(--dk);white-space:nowrap">'+fmt(price*item.qty)+'</div>'+
      '</div>';
    }
    return '';
  }).join('');

  var subtotal=cartTotal();
  var deliveryCost=checkoutState.delivery==='andreani'?0:(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  var total=subtotal+checkoutState.warranty+deliveryCost;
  var warrantyLabel=checkoutState.warranty===0?'90 días (incluida)':checkoutState.warranty===85000?'+12 meses':'+24 meses';
  var deliveryLabel=checkoutState.delivery===0?'Retiro en tienda':checkoutState.delivery===5000?'Express':'Envío 24-48hs';
  if(checkoutState.delivery==='andreani')deliveryLabel='Andreani';

  var sumWarranty=document.getElementById('sum-warranty');
  if(sumWarranty)sumWarranty.textContent=warrantyLabel;
  var sumDelivery=document.getElementById('sum-delivery');
  if(sumDelivery)sumDelivery.textContent=deliveryLabel;
  var sumSubtotal=document.getElementById('sum-subtotal');
  if(sumSubtotal)sumSubtotal.textContent=fmt(subtotal);
  var sumTotal=document.getElementById('sum-total');
  if(sumTotal)sumTotal.textContent=fmt(total);
  var sumWarrantyLine=document.getElementById('sum-warranty-line');
  var sumWarrantyCost=document.getElementById('sum-warranty-cost');
  if(sumWarrantyLine){
    sumWarrantyLine.style.display=checkoutState.warranty>0?'flex':'none';
    if(sumWarrantyCost)sumWarrantyCost.textContent='+$'+checkoutState.warranty.toLocaleString('es-AR');
  }
  var sumDeliveryLine=document.getElementById('sum-delivery-line');
  var sumDeliveryCost=document.getElementById('sum-delivery-cost');
  if(sumDeliveryLine){
    sumDeliveryLine.style.display=deliveryCost>0?'flex':'none';
    if(sumDeliveryCost)sumDeliveryCost.textContent='+$'+deliveryCost.toLocaleString('es-AR');
  }
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
    var p=getById(PRODUCTS,lookupId);
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

  itemsContainer.innerHTML=items.map(function(item){
    var lookupId=item.productId||item.id;
    var p=getById(PRODUCTS,lookupId);
    if(p){
      var isPromo=p.isOffer&&p.discount>0;
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:22px">📱</span>';
      var priceHtml=isPromo?
        '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>'+
        '<div style="font-size:9px;color:var(--gray);text-decoration:line-through">'+fmt(p.price*item.qty)+'</div>'+
        '<div style="font-size:9px;color:var(--red);font-weight:600">-'+p.discount+'%</div>':
        '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>';
      return'<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:center">'+
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
    return'<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:center">'+
      '<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img2+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:10px;color:var(--gray)">Cant: '+item.qty+'</div>'+
      '</div>'+
      '<div style="font-size:13px;font-weight:700;color:var(--dk)">'+fmt(a.price*item.qty)+'</div>'+
    '</div>';
  }).join('');

  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(subtotal);
  updateCheckoutTotal();
}

function checkout(){
  if(Cart.length===0){
    showToast('El carrito está vacío');
    return;
  }
  openCheckout();
}

function fmt(n){return'$'+n.toLocaleString('es-AR');}
