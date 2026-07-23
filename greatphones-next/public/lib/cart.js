// =========== CART ===========
var Cart=[];
var cartMigrated=false;
var _lastRemovedItem=null;
var _undoTimeout=null;
function getCartKey(){
  return currentUser?'cart_'+currentUser.id:'cart';
}
function initCart(){
  try{
    var stored=Storage.get(getCartKey());
    if(stored)Cart=stored;
    else Cart=[];
    if(currentUser&&!cartMigrated){
      cartMigrated=true;
      var anonCart=Storage.getRaw('gp_cart');
      if(anonCart){
        try{
          var anonItems=JSON.parse(anonCart);
          if(anonItems&&anonItems.length>0){
            anonItems.forEach(function(item){
              var exists=Cart.find(function(c){return c.id===item.id;});
              if(exists){exists.qty+=item.qty;}
              else{Cart.push(item);}
            });
            saveCart();
            Storage.removeRaw('gp_cart');
          }
        }catch(e){}
      }
    }
  }catch(e){Cart=[];}
  updCartBadge();
  window.addEventListener('storage',function(e){
    if(e.key===Storage.get(getCartKey())){
      try{
        var newCart=e.newValue?JSON.parse(e.newValue):[];
        if(JSON.stringify(newCart)!==JSON.stringify(Cart)){
          Cart=newCart;
          updCartBadge();
          if(document.getElementById('cartPanel')&&document.getElementById('cartPanel').style.display==='block'){
            renderCartBody();
          }
        }
      }catch(ex){}
    }
  });
}
function saveCart(){
  try{Storage.set(getCartKey(),Cart);}catch(e){}
  updCartBadge();
}
function openCart(){
  var overlay=document.getElementById('cartOverlay');
  if(overlay){
    overlay.style.pointerEvents='auto';
    overlay.querySelector('div').style.opacity='1';
    overlay.querySelectorAll('div')[1].style.transform='none';
  }
  renderCartBody();
  setTimeout(function(){
    var items=document.querySelectorAll('#cartBody .cart-item');
    for(var i=0;i<items.length;i++)items[i].classList.add('ci-enter');
  },30);
}
function closeCart(){
  var overlay=document.getElementById('cartOverlay');
  if(overlay){
    overlay.style.pointerEvents='none';
    overlay.querySelector('div').style.opacity='0';
    overlay.querySelectorAll('div')[1].style.transform='translateX(100%)';
  }
}
function addToCart(id,triggerEl,variant){
  var p=getById(PRODUCTS,variant?variant.productId||id:id);
  var a=getById(window.ACCS,id);
  if(!p&&!a)return;
  var itemId=variant?id+'::'+variant.imei:id;
  var stock=variant?1:(p?p.stock:(a?a.stock:0));
  var existing=Cart.find(function(item){return item.id===itemId;});
  var currentQty=existing?existing.qty:0;
  if(currentQty>=stock){
    showToast('Solo hay '+stock+' disponible'+(stock>1?'s':''));
    return;
  }
  if(existing){
    existing.qty++;
  }else{
    var entry={id:itemId,productId:id,qty:1};
    if(variant){
      entry.variantId=variant.imei;
      var cleanName=[p.brand||'',p.modelGroup||p.name,variant.color,variant.storage].filter(Boolean).join(' ');
      var variantPrice=variant.targetPrice;
      if(p&&p.isOffer&&p.discount>0&&variantPrice>0){
        variantPrice=Math.round(variantPrice*(1-p.discount/100));
      }
      entry.variantInfo={
        color:variant.color,
        storage:variant.storage,
        ram:variant.ram,
        condition:variant.cosmeticCondition,
        price:variantPrice,
        image:variant.imageUrl,
        name:cleanName
      };
    }
    Cart.push(entry);
  }
  saveCart();
  updCartBadge();
  if(triggerEl&&typeof svBtnSuccess==='function')svBtnSuccess(triggerEl);
  openCart();
  showToast('Agregado al carrito');
}
function addProdCart(id, variant){
  addToCart(id, null, variant);
}
function removeFromCart(id, animate){
  var item=Cart.find(function(i){return i.id===id;});
  if(!item)return;
  _lastRemovedItem={id:id,item:JSON.parse(JSON.stringify(item)),index:Cart.indexOf(item)};
  var el=document.querySelector('[data-cart-id="'+id+'"]');
  if(el&&animate!==false){
    el.classList.add('ci-leave');
    var self=this;
    setTimeout(function(){
      Cart=Cart.filter(function(i){return i.id!==id;});
      saveCart();
      updCartBadge();
      renderCartBody();
      if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act'))renderCheckoutSummary();
    },230);
  }else{
    Cart=Cart.filter(function(i){return i.id!==id;});
    saveCart();
    updCartBadge();
    renderCartBody();
    if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act'))renderCheckoutSummary();
  }
  showUndoRemove();
}
function showUndoRemove(){
  if(_undoTimeout)clearTimeout(_undoTimeout);
  var existingToast=document.getElementById('toast');
  if(existingToast)existingToast.remove();
  var toast=document.querySelector('.toast-container');
  if(!toast){
    toast=document.createElement('div');
    toast.className='toast-container';
    toast.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center';
    document.body.appendChild(toast);
  }
  var undoEl=document.createElement('div');
  undoEl.style.cssText='background:var(--dk);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:fadeIn .2s ease';
  undoEl.innerHTML='<span>Producto eliminado</span><button onclick="undoRemove()" style="background:var(--orange);color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Deshacer</button>';
  toast.appendChild(undoEl);
  _undoTimeout=setTimeout(function(){
    if(undoEl.parentNode)undoEl.parentNode.removeChild(undoEl);
    _lastRemovedItem=null;
  },5000);
}
function undoRemove(){
  if(!_lastRemovedItem)return;
  if(_undoTimeout)clearTimeout(_undoTimeout);
  var toast=document.querySelector('.toast-container');
  if(toast)toast.innerHTML='';
  _lastRemovedItem.item.qty=1;
  Cart.splice(_lastRemovedItem.index,0,_lastRemovedItem.item);
  saveCart();
  updCartBadge();
  renderCartBody();
  if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){
    renderCheckoutSummary();
  }
  showToast('Producto restaurado');
  _lastRemovedItem=null;
}
function updateCartQty(id,delta){
  var item=Cart.find(function(item){return item.id===id;});
  if(!item)return;
  var pid=item.productId||id;
  var p=getById(PRODUCTS,pid);
  var a=getById(window.ACCS,pid);
  var stock=item.variantInfo?1:(p?p.stock:(a?a.stock:0));
  item.qty+=delta;
  if(item.qty<=0){
    removeFromCart(id);
  }else if(item.qty>stock){
    item.qty=stock;
    showToast('Solo hay '+stock+' disponibles');
    saveCart();
    renderCartBody();
    updCartBadge();
  }else{
    saveCart();
    renderCartBody();
    updCartBadge();
    var qtyId=id.replace(/::/g,'_');
    var qtySpan=document.querySelector('.cart-qty-'+qtyId);
    if(qtySpan){
      qtySpan.style.transition='transform .15s ease';
      qtySpan.style.transform='scale(1.3)';
      setTimeout(function(){qtySpan.style.transform='scale(1)';},150);
    }
    var totalEl=document.getElementById('cartTotalVal');
    if(totalEl)totalEl.classList.add('cart-total-pop');
    if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){
      renderCheckoutSummary();
    }
  }
}
function cartTotal(){
  return Cart.reduce(function(sum,item){
    if(item.variantInfo&&item.variantInfo.price>0){
      return sum+(item.variantInfo.price*item.qty);
    }
    var pid=item.productId||item.id;
    var p=getById(PRODUCTS,pid);
    if(p){
      var price=p.isOffer?Math.round(p.price-p.price*p.discount/100):p.price;
      return sum+(price*item.qty);
    }
    var a=getById(window.ACCS,item.productId||item.id);
    if(a){
      var now=new Date();
      var isPromo=a.isOffer&&a.discount>0;
      var price=isPromo?Math.round(a.price-a.price*a.discount/100):a.price;
      return sum+(price*item.qty);
    }
    return sum;
  },0);
}
function cartItemCount(){
  return Cart.reduce(function(sum,item){return sum+item.qty;},0);
}
function updCartBadge(){
  var n=cartItemCount();
  var b=document.getElementById('cartBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function fmt(n){return'$'+n.toLocaleString('es-AR');}
function ciHtml(item, aid, p, a, img, sub, displayName, finalPrice, isPromo){
  var qtyId=(aid||item.id).replace(/::/g,'_');
  var priceHtml=isPromo?
    '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice*item.qty)+'</div>'+
    '<div style="font-size:10px;color:var(--gray);text-decoration:line-through">'+fmt(((a||p).price)*item.qty)+'</div>'+
    '<div style="font-size:10px;color:var(--red);font-weight:600">-'+(a||p).discount+'%</div>':
    '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice*item.qty)+'</div>';
  var maxReached=(p||a).stock>0&&item.qty>=(p||a).stock;
  var stockWarning=(p||a).stock<=5&&(p||a).stock>0?'<div style="font-size:10px;color:var(--red);margin-top:4px">Solo '+(p||a).stock+' disp.</div>':'';
  return '<div data-cart-id="'+aid+'" class="cart-item">'+
    '<div style="width:60px;height:60px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+displayName+'</div>'+
      '<div style="font-size:11px;color:var(--gray);margin-bottom:6px">'+(sub||'')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<button onclick="updateCartQty(\''+aid+'\',-1)" class="cart-qty-btn">−</button>'+
        '<span class="cart-qty-'+qtyId+'" style="font-size:13px;font-weight:600;min-width:24px;text-align:center">'+item.qty+'</span>'+
        '<button onclick="updateCartQty(\''+aid+'\',1)" class="cart-qty-btn'+(maxReached?' maxed':'')+'">+</button>'+
      '</div>'+
      stockWarning+
    '</div>'+
    '<div style="text-align:right">'+
      priceHtml+
      '<button onclick="removeFromCart(\''+aid+'\')" class="cart-remove-btn">Eliminar</button>'+
    '</div>'+
  '</div>';
}

function renderCartBody(){
  var body=document.getElementById('cartBody');
  if(!body)return;
  if(Cart.length===0){
    var popular=PRODUCTS.filter(function(p){return p.stock>0;}).slice(0,4);
    var popHtml=popular.map(function(p){
      var fp=p.isOffer&&p.discount>0?Math.round(p.price-p.price*p.discount/100):p.price;
      return '<div style="display:flex;gap:10px;align-items:center;padding:10px;background:var(--cream2);border-radius:12px;cursor:pointer" onclick="closeCart();openDetail(\''+p.id+'\')">'+
        '<div style="width:44px;height:44px;background:#fff;border-radius:8px;overflow:hidden;flex-shrink:0">'+(p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:20px">'+(p.ico||'📱')+'</span>')+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div><div style="font-size:11px;color:var(--orange);font-weight:700">'+fmt(fp)+'</div></div>'+
        '</div>';
    }).join('');
    body.innerHTML='<div style="text-align:center;padding:2rem 1.5rem;color:var(--gray)">'+
      '<svg width="80" height="80" viewBox="0 0 80 80" fill="none" style="margin-bottom:1rem;opacity:.4"><rect x="12" y="20" width="56" height="44" rx="8" stroke="currentColor" stroke-width="2"/><path d="M24 20V16a16 16 0 0132 0v4" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="42" r="4" fill="currentColor" opacity=".3"/><circle cx="48" cy="42" r="4" fill="currentColor" opacity=".3"/></svg>'+
      '<p style="font-family:\'Playfair Display\',serif;font-size:20px;font-weight:700;color:var(--dk);margin-bottom:.5rem">Tu carrito esta vacio</p>'+
      '<p style="font-size:13px;line-height:1.6;margin-bottom:1.5rem">Explora nuestro catalogo y encuentra lo que necesitas.<br>Envio gratis a Bahia Blanca en compras mayores a $50.000.</p>'+
      '<button class="btn btn-o" style="margin-bottom:1.5rem" onclick="closeCart();nav(\'shop\')">Ver catalogo</button>'+
      (popular.length?'<div style="text-align:left;margin-top:1rem"><p style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem">Productos populares</p><div style="display:grid;gap:8px">'+popHtml+'</div></div>':'')+
      '</div>';
    return;
  }
  body.innerHTML=Cart.map(function(item){
    var pid=item.productId||item.id;
    var p=getById(PRODUCTS,pid);
    if(p){
      var now=new Date();
      var isPromo=p.isOffer&&p.discount>0;
      var variant=item.variantInfo;
      var variantPrice=variant&&variant.price>0?variant.price:null;
      var finalPrice=variantPrice||(isPromo?Math.round(p.price-p.price*p.discount/100):p.price);
      var img=variant&&variant.image?'<img src="'+variant.image+'" style="width:100%;height:100%;object-fit:cover">':(p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>');
      var sub=variant?[variant.color,variant.storage,variant.condition].filter(Boolean).join(' · '):p.sub;
      var displayName=variant&&variant.name?variant.name:p.name;
      return ciHtml(item, item.id, p, null, img, sub, displayName, finalPrice, isPromo);
    }
    var a=getById(window.ACCS,item.productId||item.id);
    if(!a)return '';
    var isPromo2=a.isOffer&&a.discount>0;
    var finalPrice2=isPromo2?Math.round(a.price-a.price*a.discount/100):a.price;
    var img2=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(a.ico||'📦')+'</span>';
    return ciHtml(item, a.id, null, a, img2, (a.brand||'')+' '+(a.color||''), a.name, finalPrice2, isPromo2);
  }).join('')+
  '<div style="padding:16px;border-top:1px solid var(--border);background:var(--cream2)">'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">'+
      '<span id="cartTotalLabel" style="font-size:14px;color:var(--gray)">Total ('+cartItemCount()+' productos)</span>'+
      '<span id="cartTotalVal" style="font-size:20px;font-weight:700;font-family:\'Playfair Display\',serif">'+fmt(cartTotal())+'</span>'+
    '</div>'+
    '<button onclick="checkout()" data-testid="btn-cart-checkout" style="width:100%;padding:14px;background:var(--orange);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Finalizar compra</button>'+
    '<button onclick="closeCart()" style="width:100%;margin-top:8px;padding:12px;background:none;color:var(--gray);border:1px solid var(--border);border-radius:12px;font-size:13px;cursor:pointer">Seguir comprando</button>'+
  '</div>';
  setTimeout(function(){
    var items=document.querySelectorAll('#cartBody .cart-item');
    for(var i=0;i<items.length;i++)items[i].classList.add('ci-enter');
  },30);
}
function checkout(){
  openCheckout();
}
function addToCartFromDetail(){
  var btn=document.getElementById('detAddCart');
  if(currentProd){
    var v=window._selectedVariant;
    if(v){
      addToCart(v.productId||currentProd.id,btn,v);
    }else{
      addToCart(currentProd.id,btn);
    }
  }else if(currentAcc){
    addToCart(currentAcc.id,btn);
  }
}
function buyNow(){
  if(!currentUser){
    showToast('Inicia sesion para continuar con la compra');
    nav('login');
    return;
  }
  var btn=document.getElementById('detBuyNow');
  if(btn&&typeof svBtnSuccess==='function')svBtnSuccess(btn);
  if(currentProd){
    var v=window._selectedVariant;
    if(v){
      addToCart(v.productId||currentProd.id,btn,v);
    }else{
      addToCart(currentProd.id,btn);
    }
  }else if(currentAcc){
    addToCart(currentAcc.id,btn);
  }
  setTimeout(function(){nav('checkout');},400);
}