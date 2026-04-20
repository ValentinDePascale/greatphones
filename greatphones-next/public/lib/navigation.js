// =========== NAVIGATION ===========
var currentUser=null;
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':'https://greatphones.onrender.com');
var pendingSignupData=null;

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
function nav(id){
  if(id==='cuenta'&&!currentUser){openLogin();return;}
  if(id==='admin'&&(!currentUser||currentUser.role!=='ADMIN')){nav('home');return;}
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  var el=document.getElementById('p-'+id);
  if(el)el.classList.add('act');
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='home'){renderHomeRail();renderOfferStrip();}
  if(id==='register'){closeLogin();}
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
  console.log('Funcionalidad no disponible - requiere conexion al backend');
}
async function doRegister(){
  var name=document.getElementById('regName').value.trim();
  var lastname=document.getElementById('regLastname').value.trim();
  var email=document.getElementById('regEmail').value.trim();
  var phone=document.getElementById('regPhone').value.trim();
  var dni=document.getElementById('regDni').value.trim();
  var provincia=document.getElementById('regProvincia').value.trim();
  var ciudad=document.getElementById('regCiudad').value.trim();
  var password=document.getElementById('regPassword').value;
  var confirmPassword=document.getElementById('regConfirmPassword').value;
  if(!name||!lastname||!email||!password){alert('Completá los campos obligatorios');return;}
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
  
  pendingSignupData={name:name+' '+lastname,email:email,phone:phone,dni:dni,provincia:provincia,ciudad:ciudad,password:password};
  
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
