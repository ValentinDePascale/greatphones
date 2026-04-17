// =========== SEARCH ===========
function handleSearch(q){
  var dd=document.getElementById('searchDD');
  if(!q.trim()){dd.classList.remove('open');return;}
  var m=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(q.toLowerCase())!==-1||p.brand.toLowerCase().indexOf(q.toLowerCase())!==-1;}).slice(0,5);
  if(!m.length){dd.classList.remove('open');return;}
  dd.innerHTML=m.map(function(p){return '<div class="srdd-item" onclick="openDetail('+p.id+');document.getElementById(\'searchDD\').classList.remove(\'open\')">'+p.ico+' '+p.name+'<span class="srdd-cat">'+fmt(p.price)+'</span></div>';}).join('');
  dd.classList.add('open');
}
function doSearch(){
  var q=document.getElementById('searchInput').value.trim();
  if(!q)return;
  document.getElementById('searchDD').classList.remove('open');
  var m=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(q.toLowerCase())!==-1||p.brand.toLowerCase().indexOf(q.toLowerCase())!==-1||p.sub.toLowerCase().indexOf(q.toLowerCase())!==-1;});
  document.getElementById('srQ').textContent='Resultados: '+q;
  document.getElementById('srCnt').textContent=m.length+' producto'+(m.length!==1?'s':'');
  renderGrid('searchGrid',m);
  nav('search');
}
