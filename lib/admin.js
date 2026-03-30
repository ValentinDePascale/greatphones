// =========== ADMIN ===========
function adminLogin(){
  var user=document.getElementById('adUser').value;
  var pass=document.getElementById('adPass').value;
  if(user==='admin'&&pass==='1234'){
    adminLoggedIn=true;
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderDash();
  }else{
    alert('Credenciales incorrectas');
  }
}
function adminLogout(){
  adminLoggedIn=false;
  document.getElementById('adminLogin').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}
function showAdmin(){
  if(!adminLoggedIn){
    document.getElementById('adminLogin').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
  }
}
function adminTab(tab,btn){
  document.querySelectorAll('.atab').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
  document.querySelectorAll('.admin-sec').forEach(function(s){s.classList.remove('act');});
  document.getElementById('as-'+tab).classList.add('act');
}
function renderDash(){
  var totalVentas=SALES_HISTORY.reduce(function(t,s){return t+s.price;},0);
  var prodsVendidos=SALES_HISTORY.reduce(function(t,s){return t+s.sold||1;},0);
  document.getElementById('dashStats').innerHTML='<div class="stat-card"><div class="stat-lbl">Ventas hoy</div><div class="stat-val">$0</div></div><div class="stat-card"><div class="stat-lbl">Pedidos</div><div class="stat-val">0</div></div><div class="stat-card"><div class="stat-lbl">Productos</div><div class="stat-val">'+PRODUCTS.length+'</div></div><div class="stat-card"><div class="stat-lbl">Clientes</div><div class="stat-val">0</div></div>';
}
function switchChart(period,btn){
  document.querySelectorAll('.chart-tab').forEach(function(b){b.classList.remove('act');});
  btn.classList.add('act');
}
