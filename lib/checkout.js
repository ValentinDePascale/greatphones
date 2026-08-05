// =========== CHECKOUT ===========
var checkoutState={cuotas:1,warranty:0,delivery:0};

function selCheckoutCuota(btn,cuotas){
  checkoutState.cuotas=cuotas;
  document.querySelectorAll('#checkout-cuotas .cuota-btn').forEach(function(b){
    b.style.background='var(--cream2)';b.style.color='var(--dk)';b.style.border='2px solid var(--border)';
  });
  btn.style.background='var(--green)';btn.style.color='#fff';btn.style.border='2px solid var(--green)';
  updateCheckoutTotal();
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
    if(priceEl)priceEl.textContent='+$'+cost.toLocaleString('es-AR');
    if(btn){
      btn.innerHTML='✓ Actualizado';
      btn.style.background='rgba(45,90,39,.1)';
      btn.style.borderColor='var(--green)';
      btn.style.color='var(--green)';
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
  var deliveryCost=checkoutState.delivery==='andreani'?0:checkoutState.delivery;
  var total=subtotal+checkoutState.warranty+deliveryCost;
  var subtotalEl=document.getElementById('checkout-subtotal');
  var totalEl=document.getElementById('checkout-total');
  var warrantyLine=document.getElementById('checkout-warranty-line');
  var warrantyCost=document.getElementById('checkout-warranty-cost');
  var deliveryLine=document.getElementById('checkout-delivery-line');
  var deliveryCostEl=document.getElementById('checkout-delivery-cost');
  var cuotasText=document.getElementById('checkout-cuotas-text');
  var cuotasAmount=document.getElementById('checkout-cuotas-amount');
  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(total);
  if(warrantyLine){
    warrantyLine.style.display=checkoutState.warranty>0?'flex':'none';
    if(warrantyCost)warrantyCost.textContent='+$'+checkoutState.warranty.toLocaleString('es-AR');
  }
  if(deliveryLine){
    var showDelivery=checkoutState.delivery>0||checkoutState.delivery==='andreani';
    deliveryLine.style.display=showDelivery?'flex':'none';
    if(deliveryCostEl){
      if(checkoutState.delivery==='andreani'){
        deliveryCostEl.textContent='A calcular';
      }else{
        deliveryCostEl.textContent='+$'+checkoutState.delivery.toLocaleString('es-AR');
      }
    }
  }
  if(cuotasText)cuotasText.textContent=checkoutState.cuotas+'x sin interes';
  if(cuotasAmount)cuotasAmount.textContent=fmt(Math.round(total/checkoutState.cuotas))+'/mes';
}

function resetCheckoutSelections(){
  checkoutState={cuotas:1,warranty:0,delivery:0};
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
    showToast('El carrito esta vacio');
    return;
  }
  closeCart();
  nav('checkout');
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
    itemsContainer.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">🛒</p><p style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:.5rem">No hay productos en el carrito</p><button class="btn btn-o" onclick="nav(\'shop\')">Volver al catalogo</button></div>';
    if(subtotalEl)subtotalEl.textContent='$0';
    if(totalEl)totalEl.textContent='$0';
    return;
  }

  var validItems=Cart.filter(function(item){
    var p=getById(PRODUCTS,item.id);
    var a=getById(window.ACCS,item.id);
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
    itemsContainer.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">🛒</p><p style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:.5rem">No hay productos en el carrito</p><button class="btn btn-o" onclick="nav(\'shop\')">Volver al catalogo</button></div>';
    if(subtotalEl)subtotalEl.textContent='$0';
    if(totalEl)totalEl.textContent='$0';
    return;
  }

  var subtotal=cartTotal();

  itemsContainer.innerHTML=Cart.map(function(item){
    var p=getById(PRODUCTS,item.id);
    if(p){
      var price=p.isOffer?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>';
      return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:64px;height:64px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">'+p.sub+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
        '</div>'+
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>'+
      '</div>';
    }
    var a=getById(window.ACCS,item.id);
    if(!a)return '';
    var img=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(a.ico||'📦')+'</span>';
    return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
      '<div style="width:64px;height:64px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">'+(a.brand||'')+' '+(a.color||'')+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
      '</div>'+
      '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(a.price*item.qty)+'</div>'+
    '</div>';
  }).join('');

  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(subtotal);
  updateCheckoutTotal();
}

function checkout(){
  if(Cart.length===0){
    showToast('El carrito esta vacio');
    return;
  }
  openCheckout();
}

function validateCheckoutForm(){
  var email=document.getElementById('checkout-email');
  var document=document.getElementById('checkout-document');
  var street=document.getElementById('checkout-street');
  var number=document.getElementById('checkout-number');
  var zip=document.getElementById('checkout-zip');
  var city=document.getElementById('checkout-city');
  var province=document.getElementById('checkout-province');

  var errors=[];

  if(!email||!email.value||!email.value.includes('@')){
    errors.push('ingresa un email valido');
    email.style.borderColor='var(--red)';
  }else{
    email.style.borderColor='var(--border)';
  }

  if(!document||!document.value){
    errors.push('ingresa DNI o CUIT');
    document.style.borderColor='var(--red)';
  }else{
    document.style.borderColor='var(--border)';
  }

  if(!street||!street.value){
    errors.push('ingresa la calle');
    street.style.borderColor='var(--red)';
  }else{
    street.style.borderColor='var(--border)';
  }

  if(!number||!number.value){
    errors.push('ingresa el numero');
    number.style.borderColor='var(--red)';
  }else{
    number.style.borderColor='var(--border)';
  }

  if(!zip||!zip.value){
    errors.push('ingresa el codigo postal');
    zip.style.borderColor='var(--red)';
  }else{
    zip.style.borderColor='var(--border)';
  }

  if(!city||!city.value){
    errors.push('ingresa la ciudad');
    city.style.borderColor='var(--red)';
  }else{
    city.style.borderColor='var(--border)';
  }

  if(!province||!province.value){
    errors.push('selecciona la provincia');
    province.style.borderColor='var(--red)';
  }else{
    province.style.borderColor='var(--border)';
  }

  return errors;
}

function submitCheckout(){
  var errors=validateCheckoutForm();
  if(errors.length>0){
    showToast('Por favor completa: '+errors.join(', '));
    return;
  }

  var btn=document.getElementById('btn-checkout');
  if(btn){
    btn.disabled=true;
    btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Procesando...';
    btn.style.opacity='0.7';
  }

  var items=Cart.map(function(item){
    var p=getById(PRODUCTS,item.id);
    if(p){
      var price=p.isOffer?Math.round(p.price-p.price*p.discount/100):p.price;
      return{
        id:p.id,
        name:p.name,
        sub:p.sub,
        imageUrl:p.imageUrl,
        price:price,
        quantity:item.qty
      };
    }
    var a=getById(window.ACCS,item.id);
    if(a){
      return{
        id:a.id,
        name:a.name,
        sub:(a.brand||'')+' '+(a.color||''),
        imageUrl:a.imageUrl,
        price:a.price,
        quantity:item.qty
      };
    }
    return null;
  }).filter(function(i){return i;});

  var subtotal=cartTotal();
  var total=subtotal+checkoutState.warranty+checkoutState.delivery;

  var warrantyLabel=checkoutState.warranty>0?(checkoutState.warranty===85000?'+12 meses cobertura completa':'+24 meses'):'12 meses';
  var deliveryLabel=checkoutState.delivery===0?'Retiro en tienda':(checkoutState.delivery===5000?'Express':'Envio 24-48hs');
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
    total:total
  };

  fetch(API_URL+'/api/checkout',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  })
  .then(function(response){return response.json();})
  .then(function(data){
    console.log('Checkout response:', data);
    if(data.error){
      throw new Error(data.error);
    }
    if(data.initPoint){
      Cart=[];
      saveCart();
      updCartBadge();
      window.location.href=data.initPoint;
    }else{
      throw new Error('No se recibio link de pago');
    }
  })
  .catch(function(error){
    console.error('Checkout error:',error);
    showToast('Error: '+error.message);
    if(btn){
      btn.disabled=false;
      btn.innerHTML='Pagar con Mercado Pago <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      btn.style.opacity='1';
    }
  });
}
