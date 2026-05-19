// =========== SEARCH ===========
function handleSearch(q){
  var dd=document.getElementById('searchDD');
  if(!q.trim()){dd.classList.remove('open');dd.innerHTML='';return;}
  var ql=q.toLowerCase();
  var mProd=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(ql)!==-1||p.brand.toLowerCase().indexOf(ql)!==-1||(p.sub||'').toLowerCase().indexOf(ql)!==-1;});
  var mAcc=(window.ACCS||[]).filter(function(a){return a.name.toLowerCase().indexOf(ql)!==-1||(a.brand||'').toLowerCase().indexOf(ql)!==-1||(a.category||'').toLowerCase().indexOf(ql)!==-1;});
  var m=mProd.concat(mAcc).slice(0,5);
  if(!m.length){
    dd.innerHTML='<div style="padding:16px;text-align:center;color:var(--gray);font-size:13px"><p style="margin-bottom:8px">No se encontraron resultados para "<strong>'+q+'</strong>"</p><button class="btn btn-ghost" style="font-size:11px;padding:6px 12px" onclick="doSearch();document.getElementById(\'searchDD\').classList.remove(\'open\')">Ver todos los resultados</button></div>';
    dd.classList.add('open');
    return;
  }
  dd.innerHTML=m.map(function(item){
    var isAcc=!!item.category&&!item.condition;
    var clickAction=isAcc?'openAccDetail(\''+item.id+'\')':'openDetail(\''+item.id+'\')';
    var price=fmt(item.price);
    var tag=isAcc?'<span class="srdd-cat" style="color:var(--green)">Accesorio</span>':'<span class="srdd-cat">'+price+'</span>';
    return '<div class="srdd-item" onclick="'+clickAction+';document.getElementById(\'searchDD\').classList.remove(\'open\')">'+(item.ico||'\u{1F4E6}')+' '+item.name+tag+'</div>';
  }).join('');
  dd.classList.add('open');
}
function doSearch(){
  var q=document.getElementById('searchInput').value.trim();
  if(!q)return;
  document.getElementById('searchDD').classList.remove('open');
  var ql=q.toLowerCase();
  var mProd=PRODUCTS.filter(function(p){return p.name.toLowerCase().indexOf(ql)!==-1||p.brand.toLowerCase().indexOf(ql)!==-1||(p.sub||'').toLowerCase().indexOf(ql)!==-1;});
  var mAcc=(window.ACCS||[]).filter(function(a){return a.name.toLowerCase().indexOf(ql)!==-1||(a.brand||'').toLowerCase().indexOf(ql)!==-1||(a.category||'').toLowerCase().indexOf(ql)!==-1||(a.description||'').toLowerCase().indexOf(ql)!==-1;});
  var allResults=mProd.concat(mAcc);
  renderGrid('shopGrid',allResults);
  var titleEl=document.getElementById('shopTitle');
  if(titleEl)titleEl.textContent='Resultados: '+q;
  var subEl=document.getElementById('shopSub');
  if(subEl)subEl.textContent=allResults.length+' resultado'+(allResults.length!==1?'s':'');
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('act');});
  document.getElementById('p-shop').classList.add('act');
  setCN('shop');
  window.scrollTo({top:0,behavior:'smooth'});
  window.history.pushState({page:'shop'},'','shop');
}
