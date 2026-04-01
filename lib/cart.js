// =========== CART ===========
var Cart=[];
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
function addToCart(){
  notAvailable();
}
function addProdCart(id){
  notAvailable();
}
function removeFromCart(idx){
  notAvailable();
}
function cartTotal(){return 0;}
function updCartBadge(){
  var n=Cart.length;
  var b=document.getElementById('cartBadge');
  if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}
}
function renderCartBody(){
  var body=document.getElementById('cartBody');
  if(!body)return;
  body.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Carrito no disponible</p><p style="font-size:11px">Conectate al backend para usar el carrito</p></div>';
}
