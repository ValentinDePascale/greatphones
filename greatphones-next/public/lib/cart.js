// =========== CART ===========
var Cart=[];
var cartMigrated=false;
function getCartKey(){
  return currentUser?'gp_cart_'+currentUser.id:'gp_cart';
}
function initCart(){
  try{
    var stored=localStorage.getItem(getCartKey());
    if(stored)Cart=JSON.parse(stored);
    else Cart=[];
    // Migrate anonymous cart to user cart if user just logged in
    if(currentUser&&!cartMigrated){
      cartMigrated=true;
      var anonCart=localStorage.getItem('gp_cart');
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
            localStorage.removeItem('gp_cart');
          }
        }catch(e){}
      }
    }
  }catch(e){Cart=[];}
  updCartBadge();
}
function saveCart(){
  try{localStorage.setItem(getCartKey(),JSON.stringify(Cart));}catch(e){}
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
}
function closeCart(){
  var overlay=document.getElementById('cartOverlay');
  if(overlay){
    overlay.style.pointerEvents='none';
    overlay.querySelector('div').style.opacity='0';
    overlay.querySelectorAll('div')[1].style.transform='translateX(100%)';
  }
}
function addToCart(id){
  var p=getById(PRODUCTS,id);
  var a=getById(window.ACCS,id);
  if(!p&&!a)return;
  var existing=Cart.find(function(item){return item.id===id;});
  if(existing){
    existing.qty++;
  }else{
    Cart.push({id:id,qty:1});
  }
  saveCart();
  updCartBadge();
  openCart();
  showToast('Agregado al carrito');
}
function addProdCart(id){
  addToCart(id);
}
function removeFromCart(id){
  Cart=Cart.filter(function(item){return item.id!==id;});
  saveCart();
  updCartBadge();
  renderCartBody();
  if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){
    renderCheckoutSummary();
  }
}
function updateCartQty(id,delta){
  var item=Cart.find(function(item){return item.id===id;});
  if(!item)return;
  item.qty+=delta;
  if(item.qty<=0){
    removeFromCart(id);
  }else{
    saveCart();
    renderCartBody();
    updCartBadge();
    if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){
      renderCheckoutSummary();
    }
  }
}
function cartTotal(){
  return Cart.reduce(function(sum,item){
    var p=getById(PRODUCTS,item.id);
    if(p){
      var price=p.isOffer?Math.round(p.price-p.price*p.discount/100):p.price;
      return sum+(price*item.qty);
    }
    var a=getById(window.ACCS,item.id);
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
    var p=getById(PRODUCTS,item.id);
    if(p){
      var now=new Date();
      var isPromo=p.isOffer&&p.discount>0;
      var finalPrice=isPromo?Math.round(p.price-p.price*p.discount/100):p.price;
      var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>';
      var priceHtml=isPromo?
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice*item.qty)+'</div>'+
        '<div style="font-size:10px;color:var(--gray);text-decoration:line-through">'+fmt(p.price*item.qty)+'</div>'+
        '<div style="font-size:10px;color:var(--red);font-weight:600">-'+p.discount+'%</div>':
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice*item.qty)+'</div>';
      return'<div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--border);align-items:center">'+
        '<div style="width:60px;height:60px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</div>'+
          '<div style="font-size:11px;color:var(--gray);margin-bottom:6px">'+p.sub+'</div>'+
          '<div style="display:flex;align-items:center;gap:8px">'+
            '<button onclick="updateCartQty(\''+p.id+'\',-1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:14px;cursor:pointer">-</button>'+
            '<span style="font-size:13px;font-weight:600;min-width:24px;text-align:center">'+item.qty+'</span>'+
            '<button onclick="updateCartQty(\''+p.id+'\',1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:14px;cursor:pointer">+</button>'+
          '</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          priceHtml+
          '<button onclick="removeFromCart(\''+p.id+'\')" style="font-size:11px;color:var(--red);background:none;border:none;cursor:pointer;margin-top:4px">Eliminar</button>'+
        '</div>'+
      '</div>';
    }
    var a=getById(window.ACCS,item.id);
    if(!a)return '';
    var now2=new Date();
    var isPromo2=a.isOffer&&a.discount>0;
    var finalPrice2=isPromo2?Math.round(a.price-a.price*a.discount/100):a.price;
    var img2=a.imageUrl?'<img src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(a.ico||'📦')+'</span>';
    var priceHtml2=isPromo2?
      '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice2*item.qty)+'</div>'+
      '<div style="font-size:10px;color:var(--gray);text-decoration:line-through">'+fmt(a.price*item.qty)+'</div>'+
      '<div style="font-size:10px;color:var(--red);font-weight:600">-'+a.discount+'%</div>':
      '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(finalPrice2*item.qty)+'</div>';
    return'<div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--border);align-items:center">'+
      '<div style="width:60px;height:60px;background:var(--cream2);border-radius:8px;overflow:hidden;flex-shrink:0">'+img2+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray);margin-bottom:6px">'+(a.brand||'')+' '+(a.color||'')+'</div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<button onclick="updateCartQty(\''+a.id+'\',-1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:14px;cursor:pointer">-</button>'+
          '<span style="font-size:13px;font-weight:600;min-width:24px;text-align:center">'+item.qty+'</span>'+
          '<button onclick="updateCartQty(\''+a.id+'\',1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:14px;cursor:pointer">+</button>'+
        '</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        priceHtml2+
        '<button onclick="removeFromCart(\''+a.id+'\')" style="font-size:11px;color:var(--red);background:none;border:none;cursor:pointer;margin-top:4px">Eliminar</button>'+
      '</div>'+
    '</div>';
  }).join('')+
  '<div style="padding:16px;border-top:1px solid var(--border);background:var(--cream2)">'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">'+
      '<span style="font-size:14px;color:var(--gray)">Total ('+cartItemCount()+' productos)</span>'+
      '<span style="font-size:20px;font-weight:700;font-family:\'Playfair Display\',serif">'+fmt(cartTotal())+'</span>'+
    '</div>'+
    '<button onclick="checkout()" style="width:100%;padding:14px;background:var(--orange);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Finalizar compra</button>'+
    '<button onclick="closeCart()" style="width:100%;margin-top:8px;padding:12px;background:none;color:var(--gray);border:1px solid var(--border);border-radius:12px;font-size:13px;cursor:pointer">Seguir comprando</button>'+
  '</div>';
}
function checkout(){
  openCheckout();
}
function addToCartFromDetail(){
  if(currentProd){
    addToCart(currentProd.id);
  }else if(currentAcc){
    addToCart(currentAcc.id);
  }
}
function buyNow(){
  if(!currentUser){
    showToast('Inicia sesion para continuar con la compra');
    nav('login');
    return;
  }
  if(currentProd){
    addToCart(currentProd.id);
  }else if(currentAcc){
    addToCart(currentAcc.id);
  }
  setTimeout(function(){nav('checkout');},300);
}