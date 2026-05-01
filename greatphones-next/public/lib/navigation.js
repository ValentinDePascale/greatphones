// =========== NAVIGATION ===========
var currentUser=null;
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':'https://greatphones.onrender.com');
var pendingSignupData=null;

// =========== ARREPENTIMIENTO (Resolución 424/2020) ===========
function openArrepentimiento(){
  var modal=document.getElementById('arrepentimientoModal');
  if(modal){
    modal.style.display='flex';
    setTimeout(function(){modal.style.opacity='1';modal.querySelector('[style*="transform"]').style.transform='scale(1)';},10);
  }
}

function closeArrepentimiento(){
  var modal=document.getElementById('arrepentimientoModal');
  if(modal){
    modal.style.opacity='0';
    modal.querySelector('[style*="transform"]').style.transform='scale(.9)';
    setTimeout(function(){modal.style.display='none';},300);
  }
  document.getElementById('formArrepentimiento').reset();
}

async function submitArrepentimiento(event){
  event.preventDefault();
  var orden=document.getElementById('arrepOrden').value.trim();
  var email=document.getElementById('arrepEmail').value.trim();
  var telefono=document.getElementById('arrepTelefono').value.trim();
  var motivo=document.getElementById('arrepMotivo').value.trim();
  var confirm=document.getElementById('arrepConfirm').checked;
  if(!orden||!email||!confirm){alert('Por favor completá los campos obligatorios');return;}
  
  var btn=event.target.querySelector('button[type="submit"]');
  var originalText=btn.textContent;
  btn.textContent='Enviando...';
  btn.disabled=true;
  
  try{
    var res=await fetch(API_URL+'/api/arrepentimiento',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({orderId:orden,email:email,telefono:telefono,motivo:motivo})
    });
    var data=await res.json();
    btn.textContent=originalText;
    btn.disabled=false;
    
    if(data.success){
      closeArrepentimiento();
      showSuccessModal('Tu solicitud ha sido registrada','Gracias por contactarnos. Te enviaremos un email con el número de trámite: <strong>'+data.tramite?.substring(0,12)+'...</strong><br><br>Según la Resolución 424/2020, procesaremos tu solicitud en un máximo de 3 días hábiles.');
    }else{
      showSuccessModal('Error',data.message||'Error al procesar la solicitud','error');
    }
  }catch(e){
    btn.textContent=originalText;
    btn.disabled=false;
    showSuccessModal('Error de conexión','Intentalo más tarde.','error');
  }
}

function showSuccessModal(title,message,type){
  var existing=document.getElementById('successModal');
  if(existing)existing.remove();
  
  var overlay=document.createElement('div');
  overlay.id='successModal';
  overlay.style.cssText='position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);animation:fadeIn .3s ease';
  
  var bgColor=type==='error'?'#FEF2F2':'#F0FDF4';
  var borderColor=type==='error'?'#FECACA':'#BBF7D0';
  var iconColor=type==='error'?'#DC2626':'#16A34A';
  var icon=type==='error'
    ?'<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    :'<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>';
  
  overlay.innerHTML='<div style="background:'+bgColor+';border-radius:24px;padding:2.5rem;text-align:center;max-width:420px;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:scaleIn .3s ease">'+
    '<div style="margin-bottom:1rem">'+icon+'</div>'+
    '<h2 style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;margin-bottom:.5rem;color:#129344">'+title+'</h2>'+
    '<p style="font-size:14px;color:#64748B;line-height:1.6;margin-bottom:1.5rem">'+message+'</p>'+
    '<button onclick="document.getElementById(\'successModal\').remove()" style="padding:14px 32px;background:var(--orange);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer">Aceptar</button>'+
  '</div>';
  
  document.body.appendChild(overlay);
}

// =========== BROWSER HISTORY ===========
var currentPage='home';
window.historyData={
  home:'home',shop:'shop',cuenta:'cuenta',ofertas:'ofertas',
  accesorios:'accesorios',servicio:'servicio',mayorista:'mayorista',
  garantias:'garantias',notebooks:'notebooks',compare:'compare',
  favoritos:'favoritos',mensajes:'mensajes','edit-profile':'edit-profile',
  terminos:'terminos','privacidad':'privacidad'
};

// Save current page to history
function saveToHistory(page){
  if(page===currentPage)return;
  window.history.pushState({page:page},'',window.historyData[page]||page);
  currentPage=page;
}

// Handle browser back/forward
window.onpopstate=function(event){
  var page=event.state&&event.state.page;
  if(page){
    nav(page,false);
  }
};

// Initialize history on page load
window.addEventListener('DOMContentLoaded',function(){
  var path=window.location.pathname.replace(/^\//,'').replace(/\/$/,'');
  if(path&&window.historyData[path]){
    nav(path,false);
  }else if(path){
    nav('home',false);
  }
});

// Also initialize on load
window.addEventListener('load',function(){
  var path=window.location.pathname.replace(/^\//,'').replace(/\/$/,'');
  if(path&&window.historyData[path]){
    currentPage=path;
  }
});

function togglePassword(inputId,toggleIconId){
  var input=document.getElementById(inputId);
  var icon=document.getElementById(toggleIconId);
  if(input.type==='password'){
    input.type='text';
    icon.src='/icons/eye-closed.svg';
  }else{
    input.type='password';
    icon.src='/icons/eye-open.svg';
  }
}

function checkPasswordStrength(){
  var pwd=document.getElementById('regPassword').value;
  var el=document.getElementById('passwordStrength');
  if(!pwd){
    el.innerHTML='';
    document.getElementById('passwordMissing').innerHTML='';
    return;
  }
  var passed=0;
  if(pwd.length>=8)passed++;
  if(/[A-Z]/.test(pwd))passed++;
  if(/[a-z]/.test(pwd))passed++;
  if(/[0-9]/.test(pwd))passed++;
  var colors=['#e74c3c','#e74c3c','#f39c12','#f1c40f','#27ae60'];
  var texts=['Muy débil','Débil','Regular','Buena','Fuerte'];
  el.innerHTML=texts[passed];
  el.style.color=colors[passed];
}

function checkPasswordRequirements(){
  var pwd=document.getElementById('regPassword').value;
  var reqs=[
    {id:'req-length',ok:pwd.length>=8},
    {id:'req-upper',ok:/[A-Z]/.test(pwd)},
    {id:'req-lower',ok:/[a-z]/.test(pwd)},
    {id:'req-number',ok:/[0-9]/.test(pwd)}
  ];
  reqs.forEach(function(r){
    var el=document.getElementById(r.id);
    el.style.color=r.ok?'var(--green)':'var(--gray)';
    el.style.fontWeight=r.ok?'700':'400';
  });
}
function checkPasswordStrength2(){
  var pwd=document.getElementById('signupPassword').value;
  var el=document.getElementById('passwordStrength2');
  if(!pwd){
    el.innerHTML='';
    document.getElementById('passwordMissing2').innerHTML='';
    return;
  }
  var passed=0;
  if(pwd.length>=8)passed++;
  if(/[A-Z]/.test(pwd))passed++;
  if(/[a-z]/.test(pwd))passed++;
  if(/[0-9]/.test(pwd))passed++;
  var colors=['#e74c3c','#e74c3c','#f39c12','#f1c40f','#27ae60'];
  var texts=['Muy débil','Débil','Regular','Buena','Fuerte'];
  el.innerHTML=texts[passed];
  el.style.color=colors[passed];
}

function showSignupStep1(){
  document.getElementById('signupStep1').style.display='block';
  document.getElementById('signupStep2').style.display='none';
}

async function initiateSignup(){
  var name=document.getElementById('signupName').value.trim();
  var lastname=document.getElementById('signupLastname').value.trim();
  var email=document.getElementById('signupEmail').value.trim();
  var phone=document.getElementById('signupPhone').value.trim();
  var password=document.getElementById('signupPassword').value;
  var confirmPassword=document.getElementById('signupConfirmPassword').value;
  
  if(!name||!lastname){showLoginError('Ingresa tu nombre y apellido');return;}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showLoginError('Email inválido');return;}
  if(!password||password.length<6){showLoginError('Password debe tener al menos 6 caracteres');return;}
  if(password!==confirmPassword){showLoginError('Las passwords no coinciden');return;}
  
  pendingSignupData={name:name+' '+lastname,email:email,phone:phone,password:password};
  
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:email})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    
    document.getElementById('verifyEmailDisplay').textContent=email;
    document.getElementById('signupStep1').style.display='none';
    document.getElementById('signupStep2').style.display='block';
    document.getElementById('v1').value='';
    document.getElementById('v2').value='';
    document.getElementById('v3').value='';
    document.getElementById('v4').value='';
    document.getElementById('v5').value='';
    document.getElementById('v6').value='';
    document.getElementById('v1').focus();
    document.getElementById('codeTimer').style.color='var(--orange)';
    startCodeTimer(600);
    showLoginError('');
  }catch(e){console.log('[CLIENT] Error:', e);showLoginError('Error de conexión');}
}

async function verifyAndCompleteSignup(){
  var code=document.getElementById('v1').value+document.getElementById('v2').value+document.getElementById('v3').value+document.getElementById('v4').value+document.getElementById('v5').value+document.getElementById('v6').value;
  if(!code||code.length!==6){showLoginError('Ingresa el código de 6 dígitos');return;}
  
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'verify',email:pendingSignupData.email,code:code})
    });
    var data=await res.json();
    if(data.error){showLoginError(data.error);return;}
    
    var res2=await fetch(API_URL+'/api/auth/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(pendingSignupData)
    });
    var data2=await res2.json();
    if(data2.error){showLoginError(data2.error);return;}
    
    currentUser=data2.user;
    closeLogin();
    updateUserUI();
    localStorage.setItem('gp_user',JSON.stringify(currentUser));
    loadUserFavorites();
    initCart();
    loadProducts();
    pendingSignupData=null;
  }catch(e){showLoginError('Error de conexión');}
}
function nav(id,pushHistory){
  if(pushHistory===undefined)pushHistory=true;
  if(id==='cuenta'&&!currentUser){openLogin();return;}
  if(id==='admin'&&(!currentUser||currentUser.role!=='ADMIN')){nav('home');return;}
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  var el=document.getElementById('p-'+id);
  if(el)el.classList.add('act');
  if(id==='terminos'||id==='privacidad'){
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
  }else{
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(pushHistory){
    window.history.pushState({page:id},'',window.historyData[id]||id);
  }
  currentPage=id;
  if(id==='home'){renderHomeRail();renderOfferStrip();}
  if(id==='register'){closeLogin();}
  if(id==='shop'){
    window.shopFilter='todos';
    renderShopGrid();
    setCN('shop');
    var titleEl=document.getElementById('shopTitle');
    if(titleEl)titleEl.textContent='Catálogo';
    var subEl=document.getElementById('shopSub');
    if(subEl)subEl.textContent='Todos los equipos verificados con garantia incluida';
  }
  if(id==='checkout'){
    renderCheckoutSummary();
    prefillCheckoutFields();
  }
  if(id==='ofertas')renderOfertasGrid();
  if(id==='accesorios')loadAccessories();
  if(id==='favoritos')renderFavGrid();
  if(id==='servicio')renderRepairGrid();
  if(id==='notebooks')renderNotebookConfig();
  if(id==='mayorista')renderMayorista();
  if(id==='cuenta'){
    renderOrderHistory();
    renderQuotHistory();
  }
  if(id==='edit-profile'){loadEditProfile();}
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
      document.getElementById('prodStorage').value='';
      document.getElementById('prodRam').value='';
      document.getElementById('prodBattery').value='';
      
      document.getElementById('prodImageUrl').value='';
      document.getElementById('prodImages').value='';
      document.getElementById('prodImagePreview').innerHTML='📷';
      document.getElementById('prodAdditionalImages').innerHTML='<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
      window.additionalImages=[];
    }
    window.isEditingProduct=false;
  }
  if(id==='admin-acc'){
    if(!window.isEditingAcc){
      document.getElementById('accId').value='';
      document.getElementById('accName').value='';
      document.getElementById('accBrand').value='';
      document.getElementById('accPrice').value='';
      document.getElementById('accStock').value='';
      document.getElementById('accCategory').value='Cargadores';
      document.getElementById('accColor').value='';
      document.getElementById('accIco').value='📦';
      document.getElementById('accImageUrl').value='';
      document.getElementById('accDescription').value='';
      document.getElementById('accCompatibleModels').value='';
      document.getElementById('accImagePreview').innerHTML='📦';
      document.getElementById('accAdditionalImages').innerHTML='<div id="addAccImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
      document.getElementById('accFormTitle').textContent='Agregar Accesorio';
      document.getElementById('accFormSubtitle').textContent='Completa los datos del nuevo accesorio';
      window.accAdditionalImages=[];
    }
    window.isEditingAcc=false;
  }
}
function navShop(cat){
  if(cat==='ofertas'){
    nav('ofertas');
    renderOfertasGrid();
  }else{
    nav('shop');
    if(cat && cat!==''){
      window.shopFilter=cat;
      renderShopGrid();
    }
  }
  setCN(cat==='ofertas'?'ofertas':'shop');
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
  closeLogin();
  resetSignupFlow();
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  document.getElementById('p-register').classList.add('act');
  window.scrollTo({top:0,behavior:'smooth'});
}
function openLoginFromRegister(){
  nav('home');
  openLogin();
}

function resetSignupFlow(){
  pendingSignupData=null;
  showSignupStep1();
}

function showLogin(){
  document.getElementById('signupForm').style.display='none';
  document.getElementById('loginForm').style.display='block';
  document.getElementById('loginTitle').textContent='Iniciar sesion';
}
function showSignupFormInOverlay(){
  var overlay=document.getElementById('loginOverlay');
  if(overlay){
    overlay.style.pointerEvents='auto';
    overlay.querySelector('div').style.opacity='1';
    overlay.querySelectorAll('div')[1].style.opacity='1';
    overlay.querySelectorAll('div')[1].style.transform='translate(-50%,-50%) scale(1)';
  }
  document.getElementById('loginForm').style.display='none';
  document.getElementById('signupForm').style.display='block';
  document.getElementById('loginTitle').textContent='Crear cuenta';
  resetSignupFlow();
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
  var lastname=document.getElementById('signupLastname').value;
  var email=pendingEmail;
  var phone=document.getElementById('signupPhone').value;
  var password=document.getElementById('signupPassword').value;
  var confirmPassword=document.getElementById('signupConfirmPassword').value;
  var fullName=name+' '+lastname;
  if(!emailVerified){showLoginError('Primero verificá tu email');return;}
  if(!fullName.trim()){showLoginError('Ingresa tu nombre');return;}
  if(!password||password.length<6){showLoginError('Password debe tener al menos 6 caracteres');return;}
  if(password!==confirmPassword){showLoginError('Las passwords no coinciden');return;}
  showLoginError('');
  try{
    var res=await fetch(API_URL+'/api/auth/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:fullName,email:email,phone:phone,password:password})
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
  showToast('Esta funcionalidad estar\u00E1 disponible pronto','info');
}
async function doRegister(){
  var nameEl=document.getElementById('regName');
  var lastnameEl=document.getElementById('regLastname');
  var emailEl=document.getElementById('regEmail');
  var passwordEl=document.getElementById('regPassword');
  var confirmEl=document.getElementById('regConfirmPassword');
  var tycEl=document.getElementById('regTyC');
  
  if(!nameEl||!lastnameEl||!emailEl||!passwordEl){
    alert('El formulario de registro no está cargado');return;}
  
  var name=nameEl.value.trim();
  var lastname=lastnameEl.value.trim();
  var email=emailEl.value.trim();
  var password=passwordEl.value;
  var confirmPassword=confirmEl?confirmEl.value:'';
  var tyc=tycEl?tycEl.checked:false;
  if(!name||!lastname||!email||!password){alert('Completá los campos obligatorios');return;}
  if(!tyc){alert('Debés aceptar los Términos y Condiciones para registrarte');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert('Email inválido');return;}
  var passed=0;
  if(password.length>=8)passed++;
  if(/[A-Z]/.test(password))passed++;
  if(/[a-z]/.test(password))passed++;
  if(/[0-9]/.test(password))passed++;
  document.getElementById('passwordMissing').innerHTML='';
  if(passed<4){
    var msgs=[];
    if(password.length<8)msgs.push('mínimo 8 caracteres');
    if(!/[A-Z]/.test(password))msgs.push('una mayúscula');
    if(!/[a-z]/.test(password))msgs.push('una minúscula');
    if(!/[0-9]/.test(password))msgs.push('un número');
    document.getElementById('passwordMissing').innerHTML='Faltan: '+msgs.join(', ');
    document.getElementById('regPassword').focus();
    return;
  }
  if(password!==confirmPassword){alert('Las contraseñas no coinciden');return;}
  
  var phoneEl=document.getElementById('regPhone');
  var dniEl=document.getElementById('regDni');
  var provEl=document.getElementById('regProvincia');
  var cityEl=document.getElementById('regCiudad');
  
  pendingSignupData={
    name:name+' '+lastname,
    email:email,
    phone:phoneEl?phoneEl.value.trim():'',
    dni:dniEl?dniEl.value.trim():'',
    provincia:provEl?provEl.value.trim():'',
    ciudad:cityEl?cityEl.value.trim():'',
    password:password
  };
  
  try{
    var res=await fetch(API_URL+'/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'send',email:email})
    });
    var data=await res.json();
    if(data.error){alert(data.error);return;}
    
    document.getElementById('pageVerifyEmail').textContent=email;
    document.getElementById('pageVerifyEmail').style.display='inline';
    document.getElementById('registerFormStep1').style.display='none';
    document.getElementById('pageVerifyStep').style.display='block';
    document.getElementById('pv1').focus();
    document.getElementById('pageCodeTimer').style.color='var(--orange)';
    startPageTimer(600);
  }catch(e){alert('Error de conexión');}
}

function showPageRegisterStep(){
  document.getElementById('pageVerifyStep').style.display='none';
  document.getElementById('registerFormStep1').style.display='block';
  if(pageTimerInterval)clearInterval(pageTimerInterval);
}

function verifyAndCompleteRegister(){
  var code=document.getElementById('pv1').value+document.getElementById('pv2').value+document.getElementById('pv3').value+document.getElementById('pv4').value+document.getElementById('pv5').value+document.getElementById('pv6').value;
  if(!code||code.length!==6){alert('Ingresa el código de 6 dígitos');return;}
  
  var email=pendingSignupData.email;
  fetch(API_URL+'/api/auth/verify-email',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'verify',email:email,code:code})
  }).then(function(res){return res.json();}).then(function(data){
    if(data.error){alert(data.error);return;}
    
    fetch(API_URL+'/api/auth/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(pendingSignupData)
    }).then(function(r){return r.json();}).then(function(data2){
      if(data2.error){alert(data2.error);return;}
      
      currentUser=data2.user;
      localStorage.setItem('gp_user',JSON.stringify(currentUser));
      updateUserUI();
      loadUserFavorites();
      initCart();
      nav('home');
      showToast('Cuenta creada, bienvenido '+pendingSignupData.name);
      pendingSignupData=null;
    }).catch(function(){alert('Error de conexión');});
  }).catch(function(){alert('Error de conexión');});
}

var pageTimerInterval=null;
function startPageTimer(duration){
  var timerEl=document.getElementById('pageCodeTimer');
  if(!timerEl)return;
  if(pageTimerInterval)clearInterval(pageTimerInterval);
  var timeLeft=duration||600;
  pageTimerInterval=setInterval(function(){
    timeLeft--;
    var mins=Math.floor(timeLeft/60);
    var secs=timeLeft%60;
    timerEl.textContent=(mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
    if(timeLeft<=0){
      clearInterval(pageTimerInterval);
      timerEl.textContent='Expirado';
      timerEl.style.color='var(--red)';
    }
  },1000);
}

function moveToNext(current,nextId){
  if(current.value.length>=1){
    var next=document.getElementById(nextId);
    if(next)next.focus();
  }
}
function moveBack(event,prevId){
  if(event.key==='Backspace'&&!event.target.value){
    var prev=document.getElementById(prevId);
    if(prev)prev.focus();
  }
}
var codeTimerInterval=null;
function startCodeTimer(duration){
  var timerEl=document.getElementById('codeTimer');
  if(!timerEl)return;
  if(codeTimerInterval)clearInterval(codeTimerInterval);
  var timeLeft=duration||600;
  codeTimerInterval=setInterval(function(){
    timeLeft--;
    var mins=Math.floor(timeLeft/60);
    var secs=timeLeft%60;
    timerEl.textContent=(mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
    if(timeLeft<=0){
      clearInterval(codeTimerInterval);
      timerEl.textContent='Expirado';
      timerEl.style.color='var(--red)';
    }
  },1000);
}

function setCatAct(el){
  document.querySelectorAll('.cat-item').forEach(function(c){c.classList.remove('act');});
  if(el)el.classList.add('act');
}

function switchEditProfileTab(tab){
  document.getElementById('epTabPersonal').classList.remove('act');
  document.getElementById('epTabFacturacion').classList.remove('act');
  document.getElementById('epPersonalContent').style.display='none';
  document.getElementById('epFacturacionContent').style.display='none';
  if(tab==='personal'){
    document.getElementById('epTabPersonal').classList.add('act');
    document.getElementById('epPersonalContent').style.display='block';
  }else{
    document.getElementById('epTabFacturacion').classList.add('act');
    document.getElementById('epFacturacionContent').style.display='block';
  }
}

function loadEditProfile(){
  if(!currentUser)return;
  var nameEl=document.getElementById('editProfileName');
  if(!nameEl)return;
  var nameParts=currentUser.name?currentUser.name.split(' '):['',''];
  var firstName=nameParts[0];
  var lastName=nameParts.slice(1).join(' ');
  nameEl.value=firstName;
  document.getElementById('editProfileLastname').value=lastName;
  document.getElementById('editProfilePhone').value=currentUser.phone||'';
  document.getElementById('editProfileEmail').value=currentUser.email||'';
  document.getElementById('editProfileDni').value=currentUser.dni||'';
  document.getElementById('editProfileFactPhone').value=currentUser.phone||'';
  var fullDireccion=currentUser.direccion||'';
  var direccionMatch=fullDireccion.match(/^(.+?)\s+(\d+)$/);
  if(direccionMatch){
    document.getElementById('editProfileCalle').value=direccionMatch[1]||'';
    document.getElementById('editProfileNumero').value=direccionMatch[2]||'';
  }else{
    document.getElementById('editProfileCalle').value=fullDireccion;
    document.getElementById('editProfileNumero').value='';
  }
  document.getElementById('editProfilePiso').value=currentUser.piso||'';
  document.getElementById('editProfileCp').value=currentUser.cp||'';
  document.getElementById('editProfileProvincia').value=currentUser.provincia||'';
  document.getElementById('editProfileCiudad').value=currentUser.ciudad||'';
  if(currentUser.avatar){
    document.getElementById('editProfileAvatar').innerHTML='<img src="'+currentUser.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  }else{
    var initials=(firstName?firstName[0]:'')+(lastName?lastName[0]:'');
    document.getElementById('editProfileAvatar').textContent=initials.toUpperCase()||'GP';
  }
}

async function saveEditProfile(){
  if(!currentUser)return;
  var name=document.getElementById('editProfileName').value.trim();
  var lastname=document.getElementById('editProfileLastname').value.trim();
  var phone=document.getElementById('editProfilePhone').value.trim();
  var dni=document.getElementById('editProfileDni').value.trim();
  var factPhone=document.getElementById('editProfileFactPhone').value.trim();
  var calle=document.getElementById('editProfileCalle').value.trim();
  var numero=document.getElementById('editProfileNumero').value.trim();
  var piso=document.getElementById('editProfilePiso').value.trim();
  var cp=document.getElementById('editProfileCp').value.trim();
  var provincia=document.getElementById('editProfileProvincia').value;
  var ciudad=document.getElementById('editProfileCiudad').value.trim();
  var fullName=name+' '+lastname;
  var direccion=calle+(numero?' '+numero:'');
  try{
    var res=await fetch(API_URL+'/api/auth/update',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:currentUser.id,name:fullName,phone:phone,dni:dni,direccion:direccion,piso:piso,cp:cp,provincia:provincia,ciudad:ciudad,avatar:currentUser.avatar})
    });
    var data=await res.json();
    if(data.error){alert(data.error);return;}
    currentUser.name=fullName;
    currentUser.phone=phone;
    currentUser.dni=dni;
    currentUser.direccion=direccion;
    currentUser.cp=cp;
    currentUser.provincia=provincia;
    currentUser.ciudad=ciudad;
    if(data.user&&data.user.avatar)currentUser.avatar=data.user.avatar;
    localStorage.setItem('gp_user',JSON.stringify(currentUser));
    updateUserUI();
    document.getElementById('cuentaName').textContent=fullName;
    showToast('Perfil actualizado');
    nav('cuenta');
  }catch(e){alert('Error de conexión');}
}

function confirmDeleteAccount(){
  if(!currentUser)return;
  var overlay=document.getElementById('confirmOverlay');
  var check=document.getElementById('deleteConfirmCheck');
  var btn=document.getElementById('confirmDeleteBtn');
  if(check)check.checked=false;
  if(btn){
    btn.disabled=true;
    btn.style.background='var(--gray2)';
    btn.style.cursor='not-allowed';
  }
  overlay.style.display='flex';
  setTimeout(function(){overlay.style.opacity='1';overlay.querySelector('[style*="transform"]').style.transform='scale(1)';},10);
  overlay.querySelector('div').style.opacity='1';
}

function closeConfirm(){
  var overlay=document.getElementById('confirmOverlay');
  if(overlay){
    overlay.style.opacity='0';
    overlay.querySelector('[style*="transform"]').style.transform='scale(.9)';
    setTimeout(function(){overlay.style.display='none';},300);
  }
}

function confirmAction(confirmed){
  closeConfirm();
  if(!confirmed)return;
  deleteAccount();
}

function deleteUserAccount(){
  closeConfirm();
  deleteAccount();
}

async function deleteAccount(){
  console.log('[DELETE] Starting delete for currentUser:',currentUser);
  if(!currentUser){
    alert('No hay sesión activa');
    return;
  }
  var userId=currentUser.id;
  console.log('[DELETE] User ID:',userId,'API URL:',API_URL+'/api/auth/delete?userId='+userId);
  try{
    var res=await fetch(API_URL+'/api/auth/delete?userId='+userId,{method:'DELETE'});
    console.log('[DELETE] Response status:',res.status);
    var data=await res.json();
    console.log('[DELETE] Response data:',data);
    if(data.error){alert(data.error);return;}
    localStorage.removeItem('gp_user');
    currentUser=null;
    updateUserUI();
    initCart();
    loadUserFavorites();
    nav('home');
    showToast('Cuenta eliminada permanentemente');
  }catch(e){console.error('[DELETE] Error:',e);alert('Error de conexión: '+e.message);}
}
