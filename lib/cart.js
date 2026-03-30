// =========== CART ===========
function openCart(){document.getElementById('cartOverlay').classList.remove('hidden');renderCartBody();}
function closeCart(){document.getElementById('cartOverlay').classList.add('hidden');}
function addToCart(){
  if(!currentProd)return;
  var existing=Cart.find(function(x){return x.id===currentProd.id;});
  if(existing){existing.qty=(existing.qty||1)+1;}else{Cart.push({id:currentProd.id,qty:1,name:currentProd.name,price:currentProd.price,ico:currentProd.ico,sub:currentProd.sub});}
  updCartBadge();
  renderCartBody();
}
function removeFromCart(idx){Cart.splice(idx,1);updCartBadge();renderCartBody();}
function cartTotal(){return Cart.reduce(function(t,i){return t+(i.price*(i.qty||1));},0);}
function updCartBadge(){
  var n=Cart.reduce(function(t,i){return t+(i.qty||1);},0);
  var b=document.getElementById('cartBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function renderCartBody(){
  var body=document.getElementById('cartBody');
  if(!body)return;
  if(!Cart.length){body.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">Tu carrito esta vacio</div>';return;}
  body.innerHTML=Cart.map(function(item,idx){return '<div class="cart-item"><div class="ci-img">'+item.ico+'</div><div class="ci-body"><div class="ci-name">'+item.name+'</div><div class="ci-sub">'+(item.sub||'')+'</div><div class="ci-price">'+fmt(item.price*(item.qty||1))+'</div></div><button class="ci-rm" onclick="removeFromCart('+idx+')">×</button></div>';}).join('')+'<div class="cart-footer"><div class="cart-total-row"><span class="cart-total-l">Total</span><span class="cart-total-v">'+fmt(cartTotal())+'</span></div></div>';
}
