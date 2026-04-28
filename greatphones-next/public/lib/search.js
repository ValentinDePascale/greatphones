// =========== SEARCH ===========
function handleSearch(q){
  var dd=document.getElementById('searchDD');
  if(!q.trim()){dd.classList.remove('open');return;}
  var m=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(q.toLowerCase())!==-1||p.brand.toLowerCase().indexOf(q.toLowerCase())!==-1;}).slice(0,5);
  if(!m.length){dd.classList.remove('open');return;}
  dd.innerHTML=m.map(function(p){return '<div class="srdd-item" onclick="openDetail(\''+p.id+'\');document.getElementById(\'searchDD\').classList.remove(\'open\')">'+p.ico+' '+p.name+'<span class="srdd-cat">'+fmt(p.price)+'</span></div>';}).join('');
  dd.classList.add('open');
}
function doSearch(){
  var q=document.getElementById('searchInput').value.trim();
  if(!q)return;
  document.getElementById('searchDD').classList.remove('open');
  var m=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(q.toLowerCase())!==-1||p.brand.toLowerCase().indexOf(q.toLowerCase())!==-1||p.sub.toLowerCase().indexOf(q.toLowerCase())!==-1;});
  renderGrid('shopGrid',m);
  var titleEl=document.getElementById('shopTitle');
  if(titleEl)titleEl.textContent='Resultados: '+q;
  var subEl=document.getElementById('shopSub');
  if(subEl)subEl.textContent=m.length+' producto'+(m.length!==1?'s':'');
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  document.getElementById('p-shop').classList.add('act');
  setCN('shop');
  window.scrollTo({top:0,behavior:'smooth'});
  window.history.pushState({page:'shop'},'','shop');
}
