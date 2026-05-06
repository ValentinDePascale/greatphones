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
    var showDelivery=checkoutState.delivery>0||checkoutState.delivery==='andreani';
    deliveryLine.style.display=showDelivery?'flex':'none';
    if(deliveryCostEl){
      if(checkoutState.delivery==='andreani'){deliveryCostEl.textContent='A calcular';}
      else{deliveryCostEl.textContent='+$'+checkoutState.delivery.toLocaleString('es-AR');}
    }
  }
  if(cuotasBox){
    if(checkoutState.cuotas>1){
      cuotasBox.style.display='flex';
      if(cuotasLabel)cuotasLabel.textContent=checkoutState.cuotas+'x sin interes';
      if(cuotasAmount)cuotasAmount.textContent=fmt(Math.round(total/checkoutState.cuotas))+'/mes';
    }else{
      cuotasBox.style.display='none';
    }
  }
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

function openVerification(){
  var errors=validateCheckoutForm();
  if(errors.length>0){
    showToast('Por favor completa: '+errors.join(', '));
    return;
  }
  
  var modal=document.getElementById('verificationModal');
  if(!modal)return;
  
  var itemsContainer=document.getElementById('verifyItems');
  var optionsContainer=document.getElementById('verifyOptions');
  var userContainer=document.getElementById('verifyUser');
  var subtotalEl=document.getElementById('verifySubtotal');
  var totalEl=document.getElementById('verifyTotal');
  var warrantyLine=document.getElementById('verifyWarrantyLine');
  var warrantyCost=document.getElementById('verifyWarrantyCost');
  var deliveryLine=document.getElementById('verifyDeliveryLine');
  var deliveryCost=document.getElementById('verifyDeliveryCost');
  
  var subtotal=cartTotal();
  var deliveryCostVal=checkoutState.delivery==='andreani'?0:(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);
  var total=subtotal+checkoutState.warranty+deliveryCostVal;
  
  itemsContainer.innerHTML=Cart.map(function(item){
    var p=getById(PRODUCTS,item.id);
    if(p){
      var now=new Date();
      var isPromo=p.isOffer&&(!p.offerEnd||new Date(p.offerEnd)>now)&&(!p.offerStart||new Date(p.offerStart)<=now);
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>';
      return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:56px;height:56px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray);margin-bottom:2px">'+p.sub+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
        '</div>'+
        '<div style="font-size:14px;font-weight:700;color:var(--dk);white-space:nowrap">'+fmt(price*item.qty)+'</div>'+
      '</div>';
    }
    var a=getById(window.ACCS,item.id);
    if(!a)return '';
    var img2=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(a.ico||'📦')+'</span>';
    return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
      '<div style="width:56px;height:56px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img2+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
      '</div>'+
      '<div style="font-size:14px;font-weight:700;color:var(--dk);white-space:nowrap">'+fmt(a.price*item.qty)+'</div>'+
    '</div>';
  }).join('');
  
  var warrantyLabel=checkoutState.warranty===0?'90 dias (incluida)':checkoutState.warranty===85000?'+12 meses':checkoutState.warranty===150000?'+24 meses':'90 dias';
  var deliveryLabel=checkoutState.delivery===0?'Retiro en tienda':checkoutState.delivery===5000?'Express':checkoutState.delivery==='andreani'?'Andreani':'Envio 24-48hs';
  
  optionsContainer.innerHTML=
    '<div style="font-size:12px;font-weight:600;color:var(--dk);margin-bottom:10px">Opciones seleccionadas</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px">'+
      '<div><span style="color:var(--gray)">Cuotas:</span><br><strong>'+checkoutState.cuotas+'x sin interes</strong></div>'+
      '<div><span style="color:var(--gray)">Garantia:</span><br><strong>'+warrantyLabel+'</strong></div>'+
      '<div><span style="color:var(--gray)">Entrega:</span><br><strong>'+deliveryLabel+'</strong></div>'+
    '</div>';
  
  if(currentUser){
    var direccion=currentUser.direccion||'';
    var street=document.getElementById('checkout-street').value;
    var number=document.getElementById('checkout-number').value;
    var floor=document.getElementById('checkout-floor').value;
    var zip=document.getElementById('checkout-zip').value;
    var city=document.getElementById('checkout-city').value;
    var province=document.getElementById('checkout-province').value;
    var fullAddress=[street,number,floor,city,province].filter(Boolean).join(', ');
    userContainer.innerHTML=
      '<div style="font-size:12px;font-weight:600;color:var(--dk);margin-bottom:10px">Datos de envio</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">'+
        '<div><span style="color:var(--gray)">Nombre:</span> <strong>'+(currentUser.name||'')+'</strong></div>'+
        '<div><span style="color:var(--gray)">Email:</span> <strong>'+(document.getElementById('checkout-email').value||'')+'</strong></div>'+
        '<div><span style="color:var(--gray)">Telefono:</span> <strong>'+(document.getElementById('checkout-phone').value||'')+'</strong></div>'+
        '<div><span style="color:var(--gray)">DNI/CUIT:</span> <strong>'+(document.getElementById('checkout-document').value||'')+'</strong></div>'+
        '<div style="grid-column:1/-1"><span style="color:var(--gray)">Direccion:</span> <strong>'+(fullAddress||'')+'</strong></div>'+
      '</div>';
  }else{
    var email=document.getElementById('checkout-email').value;
    var phone=document.getElementById('checkout-phone').value;
    var doc=document.getElementById('checkout-document').value;
    var street=document.getElementById('checkout-street').value;
    var number=document.getElementById('checkout-number').value;
    var floor=document.getElementById('checkout-floor').value;
    var zip=document.getElementById('checkout-zip').value;
    var city=document.getElementById('checkout-city').value;
    var province=document.getElementById('checkout-province').value;
    var fullAddress=[street,number,floor,city,province].filter(Boolean).join(', ');
    userContainer.innerHTML=
      '<div style="font-size:12px;font-weight:600;color:var(--dk);margin-bottom:10px">Datos de envio</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">'+
        '<div><span style="color:var(--gray)">Email:</span> <strong>'+email+'</strong></div>'+
        '<div><span style="color:var(--gray)">Telefono:</span> <strong>'+(phone||'')+'</strong></div>'+
        '<div><span style="color:var(--gray)">DNI/CUIT:</span> <strong>'+(doc||'')+'</strong></div>'+
        '<div style="grid-column:1/-1"><span style="color:var(--gray)">Direccion:</span> <strong>'+(fullAddress||'')+'</strong></div>'+
      '</div>';
  }
  
  if(subtotalEl)subtotalEl.textContent=fmt(subtotal);
  if(totalEl)totalEl.textContent=fmt(total);
  
  if(warrantyLine){
    warrantyLine.style.display=checkoutState.warranty>0?'flex':'none';
    if(warrantyCost)warrantyCost.textContent='+$'+checkoutState.warranty.toLocaleString('es-AR');
  }
  if(deliveryLine){
    deliveryLine.style.display=deliveryCostVal>0?'flex':'none';
    if(deliveryCost)deliveryCost.textContent='+$'+deliveryCostVal.toLocaleString('es-AR');
  }
  
  modal.style.display='flex';
  setTimeout(function(){modal.style.opacity='1';modal.querySelector('div:nth-child(2)').style.transform='scale(1)';},10);
}

function closeVerification(){
  var modal=document.getElementById('verificationModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.style.display='none';},300);
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
      var now=new Date();
      var isPromo=p.isOffer&&(!p.offerEnd||new Date(p.offerEnd)>now)&&(!p.offerStart||new Date(p.offerStart)<=now);
      var price=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>';
      var priceHtml=isPromo?
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>'+
        '<div style="font-size:10px;color:var(--gray);text-decoration:line-through">'+fmt(p.price*item.qty)+'</div>'+
        '<div style="font-size:10px;color:var(--red);font-weight:600">-'+p.discount+'%</div>':
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>';
      return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:64px;height:64px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">'+p.sub+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+priceHtml+'</div>'+
      '</div>';
    }
    var a=getById(window.ACCS,item.id);
    if(!a)return '';
    var now2=new Date();
    var isPromo2=a.isOffer&&(!a.offerEnd||new Date(a.offerEnd)>now2)&&(!a.offerStart||new Date(a.offerStart)<=now2);
    var price2=isPromo2?Math.round(a.price-a.price*a.discount/100):a.price;
    var img2=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(a.ico||'📦')+'</span>';
    var priceHtml2=isPromo2?
      '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price2*item.qty)+'</div>'+
      '<div style="font-size:10px;color:var(--gray);text-decoration:line-through">'+fmt(a.price*item.qty)+'</div>'+
      '<div style="font-size:10px;color:var(--red);font-weight:600">-'+a.discount+'%</div>':
      '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price2*item.qty)+'</div>';
    return'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">'+
      '<div style="width:64px;height:64px;background:var(--cream2);border-radius:10px;overflow:hidden;flex-shrink:0">'+img2+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">'+(a.brand||'')+' '+(a.color||'')+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">Cantidad: '+item.qty+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+priceHtml2+'</div>'+
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
  var docInput=document.getElementById('checkout-document');
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

  if(!docInput||!docInput.value){
    errors.push('ingresa DNI o CUIT');
    docInput.style.borderColor='var(--red)';
  }else{
    docInput.style.borderColor='var(--border)';
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
  closeVerification();
  setTimeout(function(){
    var btn=document.getElementById('btn-verify-pay');
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
    var total=subtotal+checkoutState.warranty+(typeof checkoutState.delivery==='number'?checkoutState.delivery:0);

    var warrantyLabel=checkoutState.warranty>0?(checkoutState.warranty===85000?'+12 meses':'+24 meses'):'90 dias';
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
  },350);
}
