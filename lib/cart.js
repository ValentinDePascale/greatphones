// =========== CART ===========
var Cart=[];
function getCartKey(){
  return currentUser?'gp_cart_'+currentUser.id:'gp_cart';
}
function initCart(){
  try{
    var stored=localStorage.getItem(getCartKey());
    if(stored)Cart=JSON.parse(stored);
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
  if(!p)return;
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
  renderCartBody();
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
  }
}
function cartTotal(){
  return Cart.reduce(function(sum,item){
    var p=getById(PRODUCTS,item.id);
    if(!p)return sum;
    var price=p.isOffer?Math.round(p.price*(1-p.discount/100)):p.price;
    return sum+(price*item.qty);
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
    body.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">🛒</p><p style="font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:.5rem">Carrito vacio</p><p style="font-size:12px">Agrega productos paraverlos aqui</p><button class="btn btn-o" style="margin-top:1rem" onclick="closeCart();nav(\'shop\')">Ver catalogo</button></div>';
    return;
  }
  body.innerHTML=Cart.map(function(item){
    var p=getById(PRODUCTS,item.id);
    if(!p)return '';
    var price=p.isOffer?Math.round(p.price*(1-p.discount/100)):p.price;
    var img=p.imageUrl?'<img src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">📱</span>';
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
        '<div style="font-size:14px;font-weight:700;color:var(--dk)">'+fmt(price*item.qty)+'</div>'+
        '<button onclick="removeFromCart(\''+p.id+'\')" style="font-size:11px;color:var(--red);background:none;border:none;cursor:pointer;margin-top:4px">Eliminar</button>'+
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
  if(Cart.length===0){
    showToast('El carrito esta vacio');
    return;
  }
  openCheckout();
}