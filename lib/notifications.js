// =========== NOTIFICATIONS ===========
function toggleNotif(e){
  e.stopPropagation();
  var panel=document.getElementById('notifPanel');
  if(panel)panel.classList.toggle('open');
  renderNotifPanel();
}
function renderNotifPanel(){
  var list=document.getElementById('notifList');
  if(!list)return;
  list.innerHTML='<div style="padding:1rem;font-size:11px;color:var(--gray);text-align:center">Funcionalidad no disponible</div>';
}
function markNotif(id){notAvailable();}
function clearNotifs(){notAvailable();}
function updNotifBadge(){
  var b=document.getElementById('notifBadge');
  if(b){b.textContent='0';b.classList.add('hidden');}
}
