// =========== NAVIGATION ===========
function nav(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  var el=document.getElementById('p-'+id);
  if(el)el.classList.add('act');
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='home'){renderHomeRail();renderOfferStrip();}
  if(id==='shop')renderShopGrid();
  if(id==='ofertas')renderOfertasGrid();
  if(id==='accesorios')renderAccGrid();
  if(id==='favoritos')renderFavGrid();
  if(id==='servicio')renderRepairGrid();
  if(id==='cuenta'){renderOrderHistory();renderQuotHistory();}
  if(id==='admin')showAdmin();
  if(id==='mensajes')renderClientConvList();
  var np=document.getElementById('notifPanel');
  if(np)np.classList.remove('open');
}
function setCN(id){
  document.querySelectorAll('.cni').forEach(function(b){b.classList.remove('act');});
  var el=document.getElementById('cn-'+id);
  if(el)el.classList.add('act');
}
document.addEventListener('click',function(e){
  if(!e.target.closest('.nav-search'))document.getElementById('searchDD').classList.remove('open');
  if(!e.target.closest('.notif-wrap')){var np=document.getElementById('notifPanel');if(np)np.classList.remove('open');}
});
