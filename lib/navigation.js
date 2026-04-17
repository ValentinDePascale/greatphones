// =========== NAVIGATION ===========
var currentUser=null;
var API_URL='http://localhost:3000';
function nav(id){
  if(id==='cuenta'&&!currentUser){openLogin();return;}
  if(id==='admin'&&(!currentUser||currentUser.role!=='ADMIN')){nav('home');return;}
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  var el=document.getElementById('p-'+id);
  if(el)el.classList.add('act');
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='home'){renderHomeRail();renderOfferStrip();}
  if(id==='shop'){
    window.shopFilter='todos';
    renderShopGrid();
    setCN('shop');
    document.querySelectorAll('#filterBar .fchip').forEach(function(c){c.classList.remove('act');});
    document.querySelector('#filterBar .fchip').classList.add('act');
  }
  if(id==='ofertas')renderOfertasGrid();
  if(id==='accesorios')renderAccGrid();
  if(id==='favoritos')renderFavGrid();
  if(id==='servicio')renderRepairGrid();
  if(id==='notebooks')renderNotebookConfig();
  if(id==='mayorista')renderMayorista();
  if(id==='cuenta'){
    renderOrderHistory();
    renderQuotHistory();
  }
  if(id==='admin'){
    window.currentAdminTab='prods';
    renderAdminContent('prods');
  }
  if(id==='home'){renderHomeRail();renderOfferStrip();}
  if(id==='admin-product'){
    if(!window.isEditingProduct){
      document.getElementById('prodId').value='';
      document.getElementById('prodName').value='';
      document.getElementById('prodBrand').value='iPhone';
      document.getElementById('prodSub').value='';
      document.getElementById('prodPrice').value='';
      document.getElementById('prodStock').value='';
      document.getElementById('prodCondition').value='Nuevo';
      document.getElementById('prodType').value='celular';
      document.getElementById('prodColor').value='';
      document.getElementById('prodScreen').value='';
      document.getElementById('prodDiscount').value='0';
      document.getElementById('prodIsOffer').value='false';
      document.getElementById('prodOfferStart').value='';
      document.getElementById('prodOfferEnd').value='';
      document.getElementById('prodImageUrl').value='';
      document.getElementById('prodImages').value='';
      document.getElementById('prodImagePreview').innerHTML='📷';
      document.getElementById('prodAdditionalImages').innerHTML='<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
      window.additionalImages=[];
    }
    window.isEditingProduct=false;
  }
}
function navShop(cat){
  nav('shop');
  if(cat && cat!==''){
    window.shopFilter=cat;
    renderShopGrid();
  }
  setCN('shop');
}
function setCN(id){
  document.querySelectorAll('.cni').forEach(function(b){b.classList.remove('act');});
  var el=document.getElementById('cn-'+id);
  if(el)el.classList.add('act');
}
function openLogin(){
  var overlay=document.getElementById('loginOverlay');
  if(overlay){
    overlay.style.pointerEvents='auto';
    overlay.querySelector('div').style.opacity='1';
    overlay.querySelectorAll('div')[1].style.opacity='1';
    overlay.querySelectorAll('div')[1].style.transform='translate(-50%,-50%) scale(1)';
  }
}
function closeLogin(){
  var overlay=document.getElementById('loginOverlay');
  if(overlay){
    overlay.style.pointerEvents='none';
    overlay.querySelector('div').style.opacity='0';
    overlay.querySelectorAll('div')[1].style.opacity='0';
    overlay.querySelectorAll('div')[1].style.transform='translate(-50%,-50%) scale(.9)';
  }
}
function showSignup(){
  document.getElementById('loginForm').style.display='none';
  document.getElementById('signupForm').style.display='block';
  document.getElementById('loginTitle').textContent='Crear cuenta';
}
function showLogin(){
  document.getElementById('signupForm').style.display='none';
  document.getElementById('loginForm').style.display='block';
  document.getElementById('loginTitle').textContent='Iniciar sesion';
}
function showLoginError(msg){
  var el=document.getElementById('loginError');
  if(el){
    if(!msg){
      el.style.display='none';
    }else{
      el.textContent=msg;
      el.style.display='block';
    }
  }
}
async function doLogin(){
  var email=document.getElementById('loginEmail').value;
  var password=document.getElementById('loginPassword').value;
  if(!email||!password){showLoginError('Ingresa email y password');return;}
  showLoginError('');
  try{
    var res=await fetch(API_URL+'/api/auth/signin',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:password})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    currentUser=data.user;
    closeLogin();
    updateUserUI();
    localStorage.setItem('gp_user',JSON.stringify(currentUser));
    loadUserFavorites();
    initCart();
    loadProducts();
  }catch(e){showLoginError('Error de conexion');}
}
async function doSignup(){
  var name=document.getElementById('signupName').value;
  var email=document.getElementById('signupEmail').value;
  var phone=document.getElementById('signupPhone').value;
  var password=document.getElementById('signupPassword').value;
  var confirmPassword=document.getElementById('signupConfirmPassword').value;
  if(!email){showLoginError('Ingresa tu email');return;}
  if(!password||password.length<6){showLoginError('Password debe tener al menos 6 caracteres');return;}
  if(password!==confirmPassword){showLoginError('Las passwords no coinciden');return;}
  showLoginError('');
  try{
    var res=await fetch(API_URL+'/api/auth/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:name,email:email,phone:phone,password:password})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    currentUser=data.user;
    closeLogin();
    updateUserUI();
    localStorage.setItem('gp_user',JSON.stringify(currentUser));
    loadUserFavorites();
    initCart();
    loadProducts();
  }catch(e){showLoginError('Error de conexion');}
}
function doLogout(){
  currentUser=null;
  localStorage.removeItem('gp_user');
  document.querySelector('button[onclick="nav(\'cuenta\')"]').innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Cuenta</span>';
  var adminLink=document.getElementById('adminLink');
  if(adminLink)adminLink.remove();
  favorites=[];
  saveFavorites();
  updFavBadge();
  Cart=[];
  saveCart();
  initCart();
  nav('home');
}
function updateUserUI(){
  var btn=document.querySelector('button[onclick="nav(\'cuenta\')"]');
  if(btn&&currentUser){
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>'+(currentUser.name||currentUser.email)+'</span>';
  }
  if(currentUser&&currentUser.role==='ADMIN'){
    var topbar=document.querySelector('.tb-right');
    if(topbar){
      var existing=document.getElementById('adminLink');
      if(!existing){
        var a=document.createElement('button');
        a.id='adminLink';
        a.className='tb-pill tb-pill-o';
        a.textContent='Admin';
        a.onclick=function(){nav('admin');};
        topbar.appendChild(a);
      }
    }
  }else{
    var existing=document.getElementById('adminLink');
    if(existing)existing.remove();
  }
  if(document.getElementById('cuentaName')){
    var av=document.getElementById('cuentaAvatar');
    var nm=document.getElementById('cuentaName');
    var em=document.getElementById('cuentaEmail');
    var li=document.getElementById('cuentaLoggedIn');
    if(currentUser){
      var initials=(currentUser.name||'GP').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
      av.textContent=initials;
      nm.textContent=currentUser.name||currentUser.email;
      em.textContent=currentUser.email+(currentUser.phone?' · '+currentUser.phone:'');
      if(li)li.style.display='block';
    }else{
      av.textContent='GP';
      nm.textContent='Guest';
      em.textContent='Inicia sesion para ver tu cuenta';
      if(li)li.style.display='none';
    }
  }
}
document.addEventListener('click',function(e){
  if(!e.target.closest('.nav-search'))document.getElementById('searchDD').classList.remove('open');
});
(function(){
  var saved=localStorage.getItem('gp_user');
  if(saved){
    try{currentUser=JSON.parse(saved);updateUserUI();loadUserFavorites();initCart();}catch(e){}
  }
})();
function notAvailable(){
  console.log('Funcionalidad no disponible - requiere conexion al backend');
}
