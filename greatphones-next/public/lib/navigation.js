// =========== NAVIGATION ===========
var currentUser=null;
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':window.location.origin);
function nav(id){
  ['homeRail','offerStrip','shopGrid','ofertasGrid','accGrid'].forEach(function(gid){var g=document.getElementById(gid);if(g)delete g.dataset.svRevealed;});
  var _cf=document.querySelector('.cat-flex');if(_cf)_cf.classList.remove('cat-reveal');
  var _hidden=['servicio','notebooks','mayorista'];
  if(_hidden.indexOf(id)!==-1){nav('home');return;}
  if(id==='cuenta'&&!currentUser){openLogin();return;}
  if(id==='checkout'&&!currentUser){nav('login');return;}
  if(id==='admin'&&(!currentUser||currentUser.role!=='ADMIN')){nav('home');return;}
  if(id==='chats'&&currentUser&&currentUser.role==='ADMIN'){nav('admin');return;}
  var chatBtn=document.getElementById('chatWidgetBtn');
  if(chatBtn)chatBtn.style.display=(id==='admin')?'none':'';
  if(id==='sell'){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
    var el=document.getElementById('p-'+id);
    if(el)el.classList.add('act');
    window.scrollTo({top:0,behavior:'smooth'});
    if(typeof svStep==='function')svStep(0);
  }else{
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
    var el=document.getElementById('p-'+id);
    if(el)el.classList.add('act');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(id==='admin'&&typeof loadAdminTheme==='function'){loadAdminTheme();}
  if(id==='cuenta'||id==='checkout'||id==='admin'||id==='terminos'||id==='privacidad'||id==='edit-profile'){
    document.querySelectorAll('.cni').forEach(function(b){b.classList.remove('act');});
  }
  if(id==='terminos'||id==='privacidad'){
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(id==='home'){renderHomeRail();renderOfferStrip();setCN('home');var cf=document.querySelector('.cat-flex');if(cf){cf.classList.remove('cat-reveal');void cf.offsetWidth;cf.classList.add('cat-reveal');}}
  if(id==='register'){
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
    document.getElementById('p-register').classList.add('act');
    window.scrollTo({top:0,behavior:'smooth'});
    document.getElementById('registerFormStep1').style.display='block';
    document.getElementById('pageVerifyStep').style.display='none';
    if(registerCodeTimer)clearInterval(registerCodeTimer);
    registerTempData=null;
    var signupStep1=document.getElementById('signupStep1');
    var signupStep2=document.getElementById('signupStep2');
    if(signupStep1)signupStep1.style.display='block';
    if(signupStep2)signupStep2.style.display='none';
    return;
  }
  if(id==='login'){
    var saved=Storage.get('remember');
    if(saved){
      try{
        var emailEl=document.getElementById('loginEmail');
        var passEl=document.getElementById('loginPassword');
        var remEl=document.getElementById('loginRemember');
        if(emailEl)emailEl.value=saved.email||'';
        if(passEl)passEl.value=saved.password||'';
        if(remEl)remEl.checked=true;
      }catch(e){}
    }
  }
  if(id==='shop'){
    window.shopFilter='todos';
    renderShopGrid();
    setCN('shop');
    document.querySelectorAll('#filterBar .fchip').forEach(function(c){c.classList.remove('act');});
    var firstFchip=document.querySelector('#filterBar .fchip');
    if(firstFchip)firstFchip.classList.add('act');
  }
  if(id==='ofertas'){renderOfertasGrid();setCN('ofertas');}
  if(id==='compare'){setCN('compare');}
  if(id==='accesorios'){renderAccGrid();setCN('accesorios');}
  if(id==='favoritos')renderFavGrid();
  if(id==='chats'){
    if(!chatPanelOpen)toggleChatPanel();
    return;
  }
  if(id==='servicio')renderRepairGrid();
  if(id==='notebooks')renderNotebookConfig();
  if(id==='mayorista')renderMayorista();
  if(id==='cuenta'){
    renderOrderHistory();
    loadClientQuotes();
    if(typeof cpnRenderCuentaSection==='function')cpnRenderCuentaSection('ACTIVE');
    if(typeof getWallet==='function'){
      getWallet().then(function(w){
        var amt=document.getElementById('cuBalanceAmount');
        if(amt)amt.innerHTML='$<span id="cuentaSaldo" style="font-family:\'Playfair Display\',Georgia,serif;font-size:52px;font-weight:700;letter-spacing:-2px">'+(w.balance||0).toLocaleString('es-AR')+'</span>';
        if(typeof cpnRenderLegacyWallet==='function')cpnRenderLegacyWallet(w.balance);
      }).catch(function(){
        var amt=document.getElementById('cuBalanceAmount');
        if(amt)amt.innerHTML='<span class="cu-balance-amount-error">$ —</span><button class="cu-btn cu-btn-retry" style="margin-left:12px;font-size:12px;padding:6px 14px" onclick="location.reload()">Reintentar</button>';
      });
    }
    if(typeof renderRedeemSection==='function')renderRedeemSection('walletRedeemSection');
  }
  if(id==='admin'){
    var hashTab=location.hash.replace('#','');
    if(hashTab&&['dashboard','prods','acc','stock','promos','orders','arrep','chat','quotes','instore','preventa'].indexOf(hashTab)!==-1){
      window.currentAdminTab=hashTab;
      var btn=document.getElementById('adm-'+hashTab);
      if(btn&&typeof adminTab==='function'){adminTab(hashTab,btn);}else{renderAdminContent(hashTab);}
    }else{
      window.currentAdminTab='prods';
      renderAdminContent('prods');
    }
  }
  if(id==='home'){renderHomeRail();renderOfferStrip();var cf=document.querySelector('.cat-flex');if(cf){cf.classList.remove('cat-reveal');void cf.offsetWidth;cf.classList.add('cat-reveal');}}
  if(id==='admin-product'){
    if(!window.isEditingProduct){
      document.getElementById('prodId').value='';
      document.getElementById('prodName').value='';
      document.getElementById('prodBrand').value='iPhone';
      document.getElementById('prodDescription').value='';
      document.getElementById('prodPrice').value='';
      document.getElementById('prodBuyPrice').value='';
      document.getElementById('prodStock').value='';
      document.getElementById('prodCondition').value='Nuevo';
      document.getElementById('prodType').value='celular';
      document.getElementById('prodColor').value='';
      document.getElementById('prodScreen').value='';
      document.getElementById('prodStorage').value='';
      document.getElementById('prodRam').value='';
      document.getElementById('prodBattery').value='';
      document.getElementById('prodProcessor').value='';
      updateProductFields();
      document.getElementById('prodImageUrl').value='';
      document.getElementById('prodImages').value='';
      document.getElementById('prodImagePreview').innerHTML='📷';
      document.getElementById('prodAdditionalImages').innerHTML='<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
      window.additionalImages=[];
      // Reset header for new product
      var h1=document.querySelector('#p-admin-product .sh-hdr h1');
      var hp=document.querySelector('#p-admin-product .sh-hdr p');
      if(h1)h1.textContent='Agregar Producto';
      if(hp)hp.textContent='Completa los datos del nuevo producto';
      // Hide iPhone model select
      var iphoneSel=document.getElementById('prodIphoneModel');
      if(iphoneSel)iphoneSel.style.display='none';
    }
    window.isEditingProduct=false;
  }
  if(id==='checkout'){
    renderCheckoutSummary();
    resetCheckoutSelections();
    prefillCheckoutFields();
    var verModal=document.getElementById('verificationModal');
    if(verModal&&verModal.style.display==='flex')closeVerification();
  }
  var urlMap={home:'',shop:'shop',sell:'sell',detail:'detail',favoritos:'favoritos',accesorios:'accesorios',garantias:'garantias',ofertas:'ofertas',chats:'chats',admin:'admin',cuenta:'cuenta',checkout:'checkout',terminos:'terminos',privacidad:'privacidad','edit-profile':'edit-profile','admin-product':'admin-product',login:'login',register:'register','forgot-password':'forgot-password','reset-password':'reset-password','track-order':'track-order',compare:'compare'};
  if(urlMap[id]!==undefined){
    var path=urlMap[id];
    if(id==='detail'&&window.currentProd)path='detail/'+window.currentProd.id;
    var currentPath=window.location.pathname.replace(/^\//,'');
    if(currentPath!==path){
      var stateData={page:id};
      if(id==='detail'&&window.currentProd)stateData.productId=window.currentProd.id;
      try{window.history.pushState(stateData,'',path?'/'+path:'/');}catch(e){}
    }
  }
  updateChatWidget();
}
function navShop(cat){
  if(cat==='ofertas'){
    nav('ofertas');
    setCN('ofertas');
  }else{
    nav('shop');
    if(cat && cat!==''){
      window.shopFilter=cat;
      renderShopGrid();
    }
    setCN('shop');
  }
}
function setCN(id){
  document.querySelectorAll('.cni').forEach(function(b){b.classList.remove('act');});
  var el=document.getElementById('cn-'+id);
  if(el)el.classList.add('act');
}
function openLogin(){
  nav('login');
}
function closeLogin(){
  nav('home');
}
function showSignup(){
  closeLogin();
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  document.getElementById('p-register').classList.add('act');
  window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('registerFormStep1').style.display='block';
  document.getElementById('pageVerifyStep').style.display='none';
  if(registerCodeTimer)clearInterval(registerCodeTimer);
  registerTempData=null;
  var signupStep1=document.getElementById('signupStep1');
  var signupStep2=document.getElementById('signupStep2');
  if(signupStep1)signupStep1.style.display='block';
  if(signupStep2)signupStep2.style.display='none';
  if(signupCodeTimer)clearInterval(signupCodeTimer);
  signupTempData=null;
}
function openLoginFromRegister(){
  nav('home');
  openLogin();
}
function showLogin(){
  document.getElementById('signupForm').style.display='none';
  document.getElementById('loginForm').style.display='block';
  document.getElementById('loginTitle').textContent='Iniciar sesion';
  var signupStep1=document.getElementById('signupStep1');
  var signupStep2=document.getElementById('signupStep2');
  if(signupStep1)signupStep1.style.display='block';
  if(signupStep2)signupStep2.style.display='none';
  if(signupCodeTimer)clearInterval(signupCodeTimer);
  signupTempData=null;
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
  var remember=document.getElementById('loginRemember');
  if(!email||!password){showLoginError('Ingresa email y contraseña');return;}
  showLoginError('');
  try{
    var res=await fetch(API_URL+'/api/auth/signin',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:password})
    });
    var data=await res.json();
    if(data.error){
      if(data.needsVerification){
        registerTempData={email:email,password:password};
        nav('register');
        showPageRegisterStep2(email);
        return;
      }
      showLoginError(data.error);return;
    }
    currentUser=data.user;
    updateUserUI();
    Storage.set('user',currentUser);
    if(remember&&remember.checked){
      Storage.set('remember',{email:email});
    }else{
      Storage.remove('remember');
    }
    loadUserFavorites();
    initCart();
    loadProducts();
    nav('home');
  }catch(e){showLoginError('Error de conexion');}
}
async function doSignup(){
  initiateSignup();
}
async function sendForgotCode(){
  var email=document.getElementById('forgotEmail').value.trim();
  var errEl=document.getElementById('forgotError');
  var sucEl=document.getElementById('forgotSuccess');
  errEl.style.display='none';sucEl.style.display='none';
  if(!email){errEl.textContent='Ingresa tu email';errEl.style.display='block';return;}
  try{
    var res=await fetch(API_URL+'/api/auth/forgot-password',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email})
    });
    var data=await res.json();
    if(data.error){errEl.textContent=data.error;errEl.style.display='block';return;}
    sucEl.textContent='Codigo enviado. Revisa tu email.';sucEl.style.display='block';
    document.getElementById('resetEmail').value=email;
    setTimeout(function(){nav('reset-password');},1500);
  }catch(e){errEl.textContent='Error de conexion';errEl.style.display='block';}
}
async function doResetPassword(){
  var email=document.getElementById('resetEmail').value.trim();
  var code=document.getElementById('resetCode').value.trim();
  var newPassword=document.getElementById('resetNewPassword').value;
  var errEl=document.getElementById('resetError');
  var sucEl=document.getElementById('resetSuccess');
  errEl.style.display='none';sucEl.style.display='none';
  if(!code||!newPassword){errEl.textContent='Completa todos los campos';errEl.style.display='block';return;}
  if(newPassword.length<6){errEl.textContent='La contraseña debe tener al menos 6 caracteres';errEl.style.display='block';return;}
  try{
    var res=await fetch(API_URL+'/api/auth/reset-password',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,code:code,newPassword:newPassword})
    });
    var data=await res.json();
    if(data.error){errEl.textContent=data.error;errEl.style.display='block';return;}
    sucEl.textContent='Contraseña actualizada! Redirigiendo...';sucEl.style.display='block';
    setTimeout(function(){nav('login');},2000);
  }catch(e){errEl.textContent='Error de conexion';errEl.style.display='block';}
}
function doLogout(){
  currentUser=null;
  Storage.remove('user');
  Storage.remove('remember');
  fetch(API_URL+'/api/auth/logout',{method:'POST'}).catch(function(){});
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
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span></span>';
    btn.querySelector('span').textContent=currentUser.name||currentUser.email;
  }
  var chatBtn=document.getElementById('chatNavBtn');
  if(chatBtn){
    if(currentUser&&currentUser.role==='ADMIN'){chatBtn.style.display='none';}
    else{chatBtn.style.display='';}
  }
  // Chat widget visibility
  updateChatWidget();
  // Scanner buttons: only for admins
  var navScanBtn=document.getElementById('navScanBtn');
  var cnScanBtn=document.getElementById('cn-scan');
  if(currentUser&&currentUser.role==='ADMIN'){
    if(navScanBtn)navScanBtn.style.display='';
    if(cnScanBtn)cnScanBtn.style.display='';
  }else{
    if(navScanBtn)navScanBtn.style.display='none';
    if(cnScanBtn)cnScanBtn.style.display='none';
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
  if(currentUser){
    if(typeof updateNotifBadge==='function')updateNotifBadge();
    if(typeof startNotifPolling==='function')startNotifPolling();
    if(typeof updateMsgBadge==='function')updateMsgBadge();
    if(typeof startChatNotifPolling==='function')startChatNotifPolling();
  }else{
    if(typeof stopNotifPolling==='function')stopNotifPolling();
    if(typeof stopChatNotifPolling==='function')stopChatNotifPolling();
  }
}
function updateChatWidget(){
  var wrap=document.getElementById('chatWidgetWrap');
  if(!wrap)return;
  var activePage=document.querySelector('.page.act');
  if(activePage&&activePage.id==='p-chats'){wrap.style.display='none';return;}
  if(window.chatPanelOpen){wrap.style.display='none';return;}
  wrap.style.display='flex';
}
document.addEventListener('click',function(e){
  if(!e.target.closest('.nav-search'))document.getElementById('searchDD').classList.remove('open');
  if(!e.target.closest('.notif-wrap'))closeNotifPanel();
});
(function(){
  var saved=Storage.get('user');
  if(saved){
    try{currentUser=saved;updateUserUI();loadUserFavorites();}catch(e){}
  }
  checkGoogleSession();
})();

function checkGoogleSession(){
  fetch('/api/auth/session').then(function(r){return r.json();}).then(function(session){
    if(session&&session.user&&session.user.email){
      fetch(API_URL+'/api/auth/me',{credentials:'include'}).then(function(r){return r.json();}).then(function(data){
        if(data.user){
          currentUser=data.user;
          Storage.set('user',currentUser);
          updateUserUI();
          loadUserFavorites();
          initCart();
          loadProducts();
          if(window.location.pathname==='/login')nav('home');
          if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){
            renderCheckoutSummary();
            resetCheckoutSelections();
            prefillCheckoutFields();
          }
        }
      }).catch(function(e){console.error('Error loading user session:',e);});
    }
  }).catch(function(e){console.error('Error loading checkout:',e);});
}
function notAvailable(){
  console.log('Funcionalidad no disponible - requiere conexion al backend');
}
var registerTempData=null;
var registerCodeTimer=null;
var signupTempData=null;
var signupCodeTimer=null;
async function initiateSignup(){
  var name=document.getElementById('signupName').value;
  var lastname=document.getElementById('signupLastname').value;
  var email=document.getElementById('signupEmail').value;
  var phone=document.getElementById('signupPhone').value;
  var password=document.getElementById('signupPassword').value;
  var confirmPassword=document.getElementById('signupConfirmPassword').value;
  var fullName=name+' '+lastname;
  if(!email){showLoginError('Ingresa tu email');return;}
  if(!password||password.length<6){showLoginError('Password debe tener al menos 6 caracteres');return;}
  if(password!==confirmPassword){showLoginError('Las passwords no coinciden');return;}
  showLoginError('');
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:email})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    signupTempData={name:fullName,email:email,phone:phone,password:password};
    document.getElementById('signupStep1').style.display='none';
    document.getElementById('signupStep2').style.display='block';
    var emailDisplay=document.getElementById('verifyEmailDisplay');
    if(emailDisplay)emailDisplay.textContent=email;
    startSignupTimer(300);
  }catch(e){showLoginError('Error de conexion');}
}
function showSignupStep1(){
  document.getElementById('signupStep1').style.display='block';
  document.getElementById('signupStep2').style.display='none';
  if(signupCodeTimer)clearInterval(signupCodeTimer);
}
function startSignupTimer(seconds){
  if(signupCodeTimer)clearInterval(signupCodeTimer);
  var remaining=seconds;
  var timerEl=document.getElementById('codeTimer');
  var resendBtn=document.querySelector('#signupStep2 button[onclick="resendSignupCode()"]');
  if(resendBtn){resendBtn.style.opacity='.4';resendBtn.style.pointerEvents='none';resendBtn.textContent='Reenviar en 05:00';}
  signupCodeTimer=setInterval(function(){
    remaining--;
    var m=Math.floor(remaining/60);
    var s=remaining%60;
    var timeStr=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    if(timerEl)timerEl.textContent=timeStr;
    if(resendBtn)resendBtn.textContent='Reenviar en '+timeStr;
    if(remaining<=0){
      clearInterval(signupCodeTimer);
      if(timerEl)timerEl.textContent='00:00';
      if(resendBtn){resendBtn.style.opacity='1';resendBtn.style.pointerEvents='auto';resendBtn.textContent='Reenviar codigo';}
    }
  },1000);
}
async function verifyAndCompleteSignup(){
  var code='';
  for(var i=1;i<=6;i++){var el=document.getElementById('v'+i);if(el)code+=el.value;}
  if(code.length!==6){showLoginError('Ingresa el codigo completo');return;}
  if(!signupTempData){showLoginError('Error: datos no encontrados');return;}
  try{
    var verifyRes=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify',email:signupTempData.email,code:code})
    });
    var verifyData=await verifyRes.json();
    if(verifyData.error){showLoginError(verifyData.error);return;}
    var signupRes=await fetch(API_URL+'/api/auth/signup',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...signupTempData,verified:true})
    });
    var signupData=await signupRes.json();
    if(signupData.error){showLoginError(signupData.error);return;}
    currentUser=signupData.user;
    closeLogin();updateUserUI();
    Storage.set('user',currentUser);
    loadUserFavorites();initCart();loadProducts();
    showToast('Cuenta creada, bienvenido '+(currentUser.name||''));
    if(signupCodeTimer)clearInterval(signupCodeTimer);
    signupTempData=null;
  }catch(e){showLoginError('Error de conexion');}
}
async function resendSignupCode(){
  if(!signupTempData||!signupTempData.email){showLoginError('Error: email no encontrado');return;}
  if(signupCodeTimer){showLoginError('Espera a que termine el contador');return;}
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:signupTempData.email})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    showLoginError('');
    showToast('Codigo reenviado correctamente');
    startSignupTimer(300);
    for(var i=1;i<=6;i++){var el=document.getElementById('v'+i);if(el)el.value='';}
    document.getElementById('v1').focus();
  }catch(e){showLoginError('Error de conexion');}
}
async function doRegister(){
  var name=document.getElementById('regName').value;
  var lastname=document.getElementById('regLastname').value;
  var email=document.getElementById('regEmail').value;
  var phoneEl=document.getElementById('regPhone');
  var phone=phoneEl?phoneEl.value:'';
  var password=document.getElementById('regPassword').value;
  var confirmPassword=document.getElementById('regConfirmPassword').value;
  var tyC=document.getElementById('regTyC');
  var fullName=name+' '+lastname;
  if(!name||!lastname||!email||!password){showToast('Completa los campos obligatorios');return;}
  if(password.length<6){showToast('La contraseña debe tener al menos 6 caracteres');return;}
  if(password!==confirmPassword){showToast('Las contraseñas no coinciden');return;}
  if(tyC&&!tyC.checked){showToast('Debes aceptar los Terminos y Condiciones');return;}
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:email})
    });
    var data=await res.json();
    if(data.error){showToast(data.error);return;}
    registerTempData={name:fullName,email:email,phone:phone,password:password};
    showPageRegisterStep2(email);
  }catch(e){showToast('Error de conexion');}
}
function showPageRegisterStep2(email){
  document.getElementById('registerFormStep1').style.display='none';
  document.getElementById('pageVerifyStep').style.display='block';
  var emailSpan=document.getElementById('pageVerifyEmail');
  if(emailSpan)emailSpan.textContent=email;
  startCodeTimer(300);
}
function showPageRegisterStep(){
  document.getElementById('registerFormStep1').style.display='block';
  document.getElementById('pageVerifyStep').style.display='none';
  if(registerCodeTimer)clearInterval(registerCodeTimer);
}
function startCodeTimer(seconds){
  if(registerCodeTimer)clearInterval(registerCodeTimer);
  var remaining=seconds;
  var timerEl=document.getElementById('pageCodeTimer');
  var resendBtn=document.querySelector('#pageVerifyStep button[onclick="resendVerificationCode()"]');
  if(resendBtn){resendBtn.style.opacity='.4';resendBtn.style.pointerEvents='none';resendBtn.textContent='Reenviar en 05:00';}
  registerCodeTimer=setInterval(function(){
    remaining--;
    var m=Math.floor(remaining/60);
    var s=remaining%60;
    var timeStr=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    if(timerEl)timerEl.textContent=timeStr;
    if(resendBtn)resendBtn.textContent='Reenviar en '+timeStr;
    if(remaining<=0){
      clearInterval(registerCodeTimer);
      if(timerEl)timerEl.textContent='00:00';
      if(resendBtn){resendBtn.style.opacity='1';resendBtn.style.pointerEvents='auto';resendBtn.textContent='Reenviar codigo';}
    }
  },1000);
}
function moveToNext(current,nextId){
  if(current.value.length===1){
    var next=document.getElementById(nextId);
    if(next)next.focus();
  }
}
function moveBack(e,currentId){
  if(e.key==='Backspace'&&!e.target.value){
    var prev=document.getElementById(currentId);
    if(prev){prev.focus();e.preventDefault();}
  }
}
async function resendVerificationCode(){
  if(!registerTempData||!registerTempData.email){showToast('Error: email no encontrado');return;}
  if(registerCodeTimer){showToast('Espera a que termine el contador');return;}
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:registerTempData.email})
    });
    var data=await res.json();
    if(data.error){showToast(data.error);return;}
    showToast('Codigo reenviado correctamente');
    startCodeTimer(300);
    for(var i=1;i<=6;i++){var el=document.getElementById('pv'+i);if(el)el.value='';}
    document.getElementById('pv1').focus();
  }catch(e){showToast('Error de conexion');}
}
async function verifyAndCompleteRegister(){
  var code='';
  for(var i=1;i<=6;i++){
    var el=document.getElementById('pv'+i);
    if(el)code+=el.value;
  }
  if(code.length!==6){showToast('Ingresa el codigo completo');return;}
  if(!registerTempData){showToast('Error: datos de registro no encontrados');return;}
  try{
    var verifyRes=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify',email:registerTempData.email,code:code})
    });
    var verifyData=await verifyRes.json();
    if(verifyData.error){showToast(verifyData.error);return;}
    if(registerTempData.name){
      var signupRes=await fetch(API_URL+'/api/auth/signup',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...registerTempData,verified:true})
      });
      var signupData=await signupRes.json();
      if(signupData.error){showToast(signupData.error);return;}
      currentUser=signupData.user;
    }else{
      var signinRes=await fetch(API_URL+'/api/auth/signin',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:registerTempData.email,password:registerTempData.password})
      });
      var signinData=await signinRes.json();
      if(signinData.error){showToast(signinData.error);return;}
      currentUser=signinData.user;
    }
    Storage.set('user',currentUser);
    updateUserUI();
    loadUserFavorites();
    initCart();
    showToast('Cuenta creada, bienvenido '+(currentUser.name||''));
    if(registerCodeTimer)clearInterval(registerCodeTimer);
    registerTempData=null;
    nav('home');
  }catch(e){showToast('Error de conexion');}
}
function openArrepentimiento(){
  var modal=document.getElementById('arrepentimientoModal');
  if(!modal)return;
  modal.style.display='flex';
  requestAnimationFrame(function(){modal.style.opacity='1';modal.querySelector('div:nth-child(2)').style.transform='scale(1)';});
}
function closeArrepentimiento(){
  var modal=document.getElementById('arrepentimientoModal');
  if(!modal)return;
  modal.style.opacity='0';modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.style.display='none';},300);
}
function submitArrepentimiento(e){
  e.preventDefault();
  var orden=document.getElementById('arrepOrden').value;
  var email=document.getElementById('arrepEmail').value;
  var telefono=document.getElementById('arrepTelefono').value;
  var motivo=document.getElementById('arrepMotivo').value;
  if(!orden||!email){showToast('Completá los campos obligatorios');return;}
  fetch(API_URL+'/api/arrepentimiento',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orden:orden,email:email,telefono:telefono,motivo:motivo})
  }).then(function(r){return r.json();}).then(function(data){
    if(data.error){showToast('Error: '+data.error);return;}
    showToast('Solicitud enviada correctamente');
    closeArrepentimiento();
    document.getElementById('formArrepentimiento').reset();
  }).catch(function(){showToast('Error de conexión');});
}
function openArrepModal(id){
  var modal=document.getElementById('arrepModal');
  if(!modal)return;
  modal.style.display='flex';
  requestAnimationFrame(function(){modal.style.opacity='1';modal.querySelector('div:nth-child(2)').style.transform='scale(1)';});
  if(id){
    fetch(API_URL+'/api/arrepentimiento/'+id).then(function(r){return r.json();}).then(function(a){
      document.getElementById('arrepId').value=a.id;
      document.getElementById('arrepDetailId').textContent=a.id;
      document.getElementById('arrepDetailFecha').textContent=new Date(a.createdAt).toLocaleDateString('es-AR');
      document.getElementById('arrepDetailOrden').textContent=a.orden;
      document.getElementById('arrepDetailEmail').textContent=a.email;
      document.getElementById('arrepDetailTelefono').textContent=a.telefono||'—';
      document.getElementById('arrepDetailMotivo').textContent=a.motivo||'—';
      document.getElementById('arrepDetailStatus').textContent=a.status;
    }).catch(function(){showToast('Error cargando datos');});
  }
}
function closeArrepModal(){
  var modal=document.getElementById('arrepModal');
  if(!modal)return;
  modal.style.opacity='0';modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.style.display='none';},300);
}
function loadEditProfile(){
  if(!currentUser)return;
  var nameEl=document.getElementById('editProfileName');
  var lastnameEl=document.getElementById('editProfileLastname');
  var emailEl=document.getElementById('editProfileEmail');
  var dniEl=document.getElementById('editProfileDni');
  var factPhoneEl=document.getElementById('editProfileFactPhone');
  var calleEl=document.getElementById('editProfileCalle');
  var numeroEl=document.getElementById('editProfileNumero');
  var pisoEl=document.getElementById('editProfilePiso');
  var cpEl=document.getElementById('editProfileCp');
  var ciudadEl=document.getElementById('editProfileCiudad');
  var provinciaEl=document.getElementById('editProfileProvincia');
  var avatarEl=document.getElementById('editProfileAvatar');
  if(nameEl)nameEl.value=(currentUser.name||'').split(' ')[0]||'';
  if(lastnameEl)lastnameEl.value=(currentUser.name||'').split(' ').slice(1).join(' ')||'';
  if(emailEl)emailEl.value=currentUser.email||'';
  if(dniEl)dniEl.value=currentUser.dni||'';
  if(factPhoneEl)factPhoneEl.value=currentUser.phone||'';
  var dirParts=(currentUser.direccion||'').split(' ');
  if(calleEl)calleEl.value=dirParts.slice(0,-1).join(' ')||'';
  if(numeroEl)numeroEl.value=dirParts[dirParts.length-1]||'';
  if(pisoEl)pisoEl.value=currentUser.piso||'';
  if(cpEl)cpEl.value=currentUser.cp||'';
  if(ciudadEl)ciudadEl.value=currentUser.ciudad||'';
  if(provinciaEl)provinciaEl.value=currentUser.provincia||'';
  if(avatarEl&&currentUser.name){
    var initials=(currentUser.name||'').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    avatarEl.textContent=initials||'GP';
  }
}
function switchEditProfileTab(tab){
  var personalTab=document.getElementById('epTabPersonal');
  var factTab=document.getElementById('epTabFacturacion');
  var personalContent=document.getElementById('epPersonalContent');
  var factContent=document.getElementById('epFacturacionContent');
  if(tab==='personal'){
    if(personalTab)personalTab.classList.add('act');
    if(factTab)factTab.classList.remove('act');
    if(personalContent)personalContent.style.display='block';
    if(factContent)factContent.style.display='none';
  }else{
    if(personalTab)personalTab.classList.remove('act');
    if(factTab)factTab.classList.add('act');
    if(personalContent)personalContent.style.display='none';
    if(factContent)factContent.style.display='block';
  }
}
function saveEditProfile(){
  if(!currentUser)return;
  var nameEl=document.getElementById('editProfileName');
  var lastnameEl=document.getElementById('editProfileLastname');
  var factPhoneEl=document.getElementById('editProfileFactPhone');
  var dniEl=document.getElementById('editProfileDni');
  var calleEl=document.getElementById('editProfileCalle');
  var numeroEl=document.getElementById('editProfileNumero');
  var pisoEl=document.getElementById('editProfilePiso');
  var cpEl=document.getElementById('editProfileCp');
  var ciudadEl=document.getElementById('editProfileCiudad');
  var provinciaEl=document.getElementById('editProfileProvincia');
  var fullName=(nameEl?nameEl.value:'')+' '+(lastnameEl?lastnameEl.value:'');
  var direccion=(calleEl?calleEl.value:'')+' '+(numeroEl?numeroEl.value:'').trim();
  var payload={
    userId:currentUser.id,
    name:fullName.trim(),
    phone:factPhoneEl?factPhoneEl.value:currentUser.phone,
    dni:dniEl?dniEl.value:currentUser.dni,
    direccion:direccion.trim()||undefined,
    piso:pisoEl?pisoEl.value:currentUser.piso,
    cp:cpEl?cpEl.value:currentUser.cp,
    ciudad:ciudadEl?ciudadEl.value:currentUser.ciudad,
    provincia:provinciaEl?provinciaEl.value:currentUser.provincia
  };
  fetch(API_URL+'/api/auth/update',{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  }).then(function(r){return r.json();}).then(function(data){
    if(data.error){showToast('Error: '+data.error);return;}
    currentUser=data.user;
    Storage.set('user',currentUser);
    updateUserUI();
    showToast('Perfil actualizado correctamente');
  }).catch(function(){showToast('Error de conexion');});
}
function confirmDeleteAccount(){
  var modal=document.getElementById('deleteAccountModal');
  if(!modal){
    var m=document.createElement('div');
    m.id='deleteAccountModal';
    m.style.cssText='display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease';
    m.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeDeleteAccountModal()"></div>'+
      '<div style="position:relative;background:#fff;border-radius:24px;width:min(440px,90%);padding:2.5rem;box-shadow:0 25px 80px rgba(0,0,0,.35);text-align:center;transform:scale(.9);transition:transform .3s ease">'+
      '<div style="width:72px;height:72px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;box-shadow:0 8px 24px rgba(239,68,68,.3)">'+
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>'+
      '</div>'+
      '<h2 style="font-family:\'Playfair Display\',Georgia,serif;font-size:24px;font-weight:700;margin-bottom:.75rem;color:var(--dk)">Eliminar cuenta</h2>'+
      '<p style="font-size:14px;color:var(--gray);margin-bottom:1.5rem;line-height:1.6">Esta accion <strong style="color:var(--red)">no se puede deshacer</strong>. Perderas todos tus datos, compras y favoritos.</p>'+
      '<label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;margin-bottom:1.75rem;text-align:left;padding:14px;background:rgba(239,68,68,.06);border-radius:14px;border:1px solid rgba(239,68,68,.15)" onclick="event.stopPropagation()">'+
      '<input type="checkbox" id="deleteAccountConfirm" style="width:20px;height:20px;margin-top:2px;accent-color:var(--red);cursor:pointer;flex-shrink:0">'+
      '<span style="font-size:13px;color:var(--dk);line-height:1.4">Confirmo que quiero eliminar mi cuenta de forma permanente y entiendo que no podre recuperar mis datos.</span>'+
      '</label>'+
      '<div style="display:flex;gap:10px">'+
      '<button onclick="closeDeleteAccountModal()" style="flex:1;padding:14px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s">Cancelar</button>'+
      '<button id="btnExecuteDelete" onclick="executeDeleteAccount()" style="flex:1;padding:14px;background:var(--red);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;opacity:.4;pointer-events:none;transition:all .15s">Eliminar cuenta</button>'+
      '</div>'+
      '</div>';
    document.body.appendChild(m);
    modal=m;
    m.querySelector('#deleteAccountConfirm').addEventListener('change',function(){
      var btn=document.getElementById('btnExecuteDelete');
      if(btn){
        if(this.checked){btn.style.opacity='1';btn.style.pointerEvents='auto';}
        else{btn.style.opacity='.4';btn.style.pointerEvents='none';}
      }
    });
  }
  modal.style.display='flex';
  modal.offsetHeight;
  setTimeout(function(){
    modal.style.opacity='1';
    modal.querySelector('div:nth-child(2)').style.transform='scale(1)';
  },10);
}
function closeDeleteAccountModal(){
  var modal=document.getElementById('deleteAccountModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  var cb=document.getElementById('deleteAccountConfirm');
  if(cb)cb.checked=false;
  var btn=document.getElementById('btnExecuteDelete');
  if(btn){btn.style.opacity='.4';btn.style.pointerEvents='none';}
  setTimeout(function(){modal.style.display='none';},300);
}
function executeDeleteAccount(){
  var cb=document.getElementById('deleteAccountConfirm');
  if(!cb||!cb.checked){showToast('Debes confirmar la eliminacion');return;}
  closeDeleteAccountModal();
  if(!currentUser)return;
  fetch(API_URL+'/api/auth/delete?userId='+currentUser.id,{
    method:'DELETE',
    headers:{'Content-Type':'application/json'}
  }).then(function(r){return r.json();}).then(function(data){
    if(data.error){showToast('Error: '+data.error);return;}
    showToast('Cuenta eliminada');
    doLogout();
  }).catch(function(){showToast('Error de conexion');});
}
function togglePassword(inputId,btn){
  var input=document.getElementById(inputId);
  if(!input)return;
  if(input.type==='password'){
    input.type='text';
    if(btn)btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  }else{
    input.type='password';
    if(btn)btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}
function checkPasswordStrength(){
  var pw=document.getElementById('regPassword');
  var el=document.getElementById('passwordStrength');
  var missing=document.getElementById('passwordMissing');
  if(!pw)return;
  var val=pw.value;
  if(!val.length){if(el)el.textContent='';if(missing)missing.textContent='';return;}
  var strength=0;
  if(val.length>=6)strength++;
  if(val.length>=10)strength++;
  if(/[A-Z]/.test(val))strength++;
  if(/[0-9]/.test(val))strength++;
  if(/[^A-Za-z0-9]/.test(val))strength++;
  var levels=[
    {label:'Muy debil',color:'var(--red)'},
    {label:'Debil',color:'var(--red)'},
    {label:'Regular',color:'var(--orange)'},
    {label:'Buena',color:'var(--green)'},
    {label:'Fuerte',color:'var(--green)'}
  ];
  var lvl=levels[Math.min(strength,4)];
  if(el){el.textContent=lvl.label;el.style.color=lvl.color;}
  if(missing){
    var missingText=[];
    if(val.length<6)missingText.push('minimo 6 caracteres');
    if(!/[A-Z]/.test(val))missingText.push('una mayuscula');
    if(!/[0-9]/.test(val))missingText.push('un numero');
    missing.textContent=missingText.length?'Falta: '+missingText.join(', '):'';
  }
}
function checkPasswordStrength2(){
  var pw=document.getElementById('signupPassword');
  var el=document.getElementById('passwordStrength2');
  var missing=document.getElementById('passwordMissing2');
  if(!pw)return;
  var val=pw.value;
  if(!val.length){if(el)el.textContent='';if(missing)missing.textContent='';return;}
  var strength=0;
  if(val.length>=6)strength++;
  if(val.length>=10)strength++;
  if(/[A-Z]/.test(val))strength++;
  if(/[0-9]/.test(val))strength++;
  if(/[^A-Za-z0-9]/.test(val))strength++;
  var levels=[
    {label:'Muy debil',color:'var(--red)'},
    {label:'Debil',color:'var(--red)'},
    {label:'Regular',color:'var(--orange)'},
    {label:'Buena',color:'var(--green)'},
    {label:'Fuerte',color:'var(--green)'}
  ];
  var lvl=levels[Math.min(strength,4)];
  if(el){el.textContent=lvl.label;el.style.color=lvl.color;}
  if(missing){
    var missingText=[];
    if(val.length<6)missingText.push('minimo 6 caracteres');
    if(!/[A-Z]/.test(val))missingText.push('una mayuscula');
    if(!/[0-9]/.test(val))missingText.push('un numero');
    missing.textContent=missingText.length?'Falta: '+missingText.join(', '):'';
  }
}
async function loadOrderTracking(){
  var code=document.getElementById('trackCode').value.trim();
  var email=document.getElementById('trackEmail').value.trim();
  var errEl=document.getElementById('trackError');
  var resultEl=document.getElementById('trackResult');
  errEl.style.display='none';resultEl.style.display='none';
  if(!code||!email){errEl.textContent='Completa codigo y email';errEl.style.display='block';return;}
  try{
    var res=await fetch(API_URL+'/api/orders/track?code='+encodeURIComponent(code)+'&email='+encodeURIComponent(email));
    var data=await res.json();
    if(data.error){errEl.textContent=data.error;errEl.style.display='block';return;}
    document.getElementById('trackOrderCode').textContent='Orden '+data.code;
    document.getElementById('trackOrderDate').textContent=new Date(data.createdAt).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});
    var statusEl=document.getElementById('trackOrderStatus');
    statusEl.textContent=data.statusLabel;
    var statusColors={PENDING:'background:#fef3c7;color:#92400e',PROCESSING:'background:#dbeafe;color:#1e40af',SHIPPED:'background:#d1fae5;color:#065f46',DELIVERED:'background:#d1fae5;color:#065f46',CANCELLED:'background:#fee2e2;color:#991b1b'};
    statusEl.style.cssText='padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;'+(statusColors[data.status]||'');
    var steps=[{key:'PENDING',label:'Pedido recibido'},{key:'PROCESSING',label:'Preparando'},{key:'SHIPPED',label:'En camino'},{key:'DELIVERED',label:'Entregado'}];
    var timeline=document.getElementById('trackTimeline');
    timeline.innerHTML=steps.map(function(s,i){
      var done=i<=data.currentStep&&data.status!=='CANCELLED';
      var active=i===data.currentStep&&data.status!=='CANCELLED';
      var cancelled=data.status==='CANCELLED'&&i===0;
      var color=cancelled?'var(--red)':done?'var(--green)':active?'var(--orange)':'var(--border)';
      var dotBg=cancelled?'rgba(192,57,43,.1)':done?'rgba(5,150,105,.1)':active?'rgba(255,107,44,.1)':'var(--cream2)';
      return '<div style="display:flex;align-items:center;gap:12px;padding:8px 0">'+
        '<div style="width:32px;height:32px;border-radius:50%;background:'+dotBg+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<div style="width:12px;height:12px;border-radius:50%;background:'+color+'"></div></div>'+
        '<div><div style="font-size:13px;font-weight:600;color:'+color+'">'+s.label+'</div></div>'+
        (i<steps.length-1?'<div style="flex:1;height:2px;background:'+color+';opacity:0.3;margin-left:16px"></div>':'')+
        '</div>';
    }).join('');
    if(data.status==='CANCELLED'){
      timeline.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:8px 0">'+
        '<div style="width:32px;height:32px;border-radius:50%;background:rgba(192,57,43,.1);display:flex;align-items:center;justify-content:center"><div style="width:12px;height:12px;border-radius:50%;background:var(--red)"></div></div>'+
        '<div><div style="font-size:13px;font-weight:600;color:var(--red)">Pedido cancelado</div></div></div>';
    }
    var itemsEl=document.getElementById('trackItems');
    itemsEl.innerHTML=data.items.map(function(item){
      return '<div style="display:flex;align-items:center;gap:12px;padding:8px 0">'+
        '<div style="width:48px;height:48px;border-radius:10px;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+(item.ico||'📦')+'</div>'+
        '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--dk)">'+item.name+'</div><div style="font-size:12px;color:var(--gray)">x'+item.quantity+'</div></div>'+
        '<div style="font-size:13px;font-weight:600;color:var(--dk)">$'+item.price.toLocaleString('es-AR')+'</div></div>';
    }).join('');
    document.getElementById('trackShipping').textContent=data.shippingAddress||'Retiro en tienda';
    document.getElementById('trackTotal').textContent='$'+data.total.toLocaleString('es-AR');

    if(data.carrier||data.trackingNumber){
      var shipEl=document.getElementById('trackShipping');
      var carrierHtml='<div style="margin-top:8px;padding:10px 12px;background:var(--cream);border-radius:8px;border-left:3px solid var(--orange)">';
      if(data.carrier)carrierHtml+='<div style="font-size:12px;color:var(--gray)">Correo: <strong style="color:var(--dk)">'+data.carrier+'</strong>'+(data.carrierService?' · '+data.carrierService:'')+'</div>';
      if(data.trackingNumber)carrierHtml+='<div style="font-size:12px;color:var(--gray);margin-top:4px">Tracking: <strong style="color:var(--dk)">'+data.trackingNumber+'</strong></div>';
      if(data.trackingUrl)carrierHtml+='<a href="'+data.trackingUrl+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:11px;color:var(--orange);font-weight:600;text-decoration:none">Seguir en el sitio del correo →</a>';
      carrierHtml+='</div>';
      shipEl.insertAdjacentHTML('afterend',carrierHtml);
    }

    resultEl.style.display='block';
  }catch(e){errEl.textContent='Error de conexion';errEl.style.display='block';}
}
window.addEventListener('popstate',function(e){
  if(e.state&&e.state.page){
    if(e.state.page==='edit-profile'){nav('edit-profile');loadEditProfile();}
    else if(e.state.page==='detail'&&e.state.productId){openDetail(e.state.productId);}
    else if(e.state.page==='admin'&&e.state.tab){
      var btn=document.getElementById('adm-'+e.state.tab);
      if(btn&&typeof adminTab==='function'){adminTab(e.state.tab,btn);}else{nav('admin');}
    }
    else{nav(e.state.page);}
  }else{
    var hashTab=location.hash.replace('#','');
    if(hashTab&&typeof adminTab==='function'&&document.getElementById('adm-'+hashTab)){
      nav('admin');
    }else{
      nav('home');
    }
  }
});
var pendingDetailId=null;
function handleInitialRoute(){
  var path=window.location.pathname.replace(/^\//,'').replace(/\/$/,'');
  if(!path||path==='index.html'){return;}
  if(path==='shop'){nav('shop');return;}
  if(path==='ofertas'){nav('ofertas');return;}
  if(path==='favoritos'){nav('favoritos');return;}
  if(path==='accesorios'){nav('accesorios');return;}
  if(path==='garantias'){nav('garantias');return;}
  if(path==='compare'){nav('compare');return;}
  if(path==='chats'){nav('chats');return;}
  if(path==='admin'){nav('admin');return;}
  if(path==='cuenta'){nav('cuenta');return;}
  if(path==='checkout'){nav('checkout');return;}
  if(path==='terminos'){nav('terminos');return;}
  if(path==='privacidad'){nav('privacidad');return;}
  if(path==='login'){nav('login');return;}
  if(path==='register'){nav('register');return;}
  if(path==='sell'){nav('sell');return;}
  if(path.indexOf('detail/')===0){
    pendingDetailId=path.replace('detail/','');
    return;
  }
}
function checkPendingDetail(){
  if(pendingDetailId&&PRODUCTS.length>0){
    var p=PRODUCTS.find(function(x){return x.id===pendingDetailId;});
    if(p){openDetail(pendingDetailId);pendingDetailId=null;}
  }
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var cart=document.getElementById('cartPanel');
    if(cart&&cart.style.display==='block'){closeCart();return;}
    var searchDrop=document.getElementById('searchDropdown');
    if(searchDrop&&searchDrop.style.display!=='none'&&searchDrop.style.display!==''){searchDrop.style.display='none';return;}
    var modal=document.querySelector('.modal-overlay[style*="display: flex"]');
    if(modal){modal.style.display='none';return;}
    var notifPanel=document.getElementById('notifPanel');
    if(notifPanel&&notifPanel.style.display==='block'){notifPanel.style.display='none';return;}
  }
});
