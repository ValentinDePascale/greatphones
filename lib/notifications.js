// =========== NOTIFICATIONS ===========
function toggleNotif(e){e.stopPropagation();document.getElementById('notifPanel').classList.toggle('open');renderNotifPanel();}
function renderNotifPanel(){
  var list=document.getElementById('notifList');
  if(!NOTIFICATIONS.length){list.innerHTML='<div style="padding:1rem;font-size:11px;color:var(--gray);text-align:center">Sin notificaciones</div>';return;}
  var imap={offer:'ni-offer',loyalty:'ni-loyalty',order:'ni-order',promo:'ni-offer'};
  var emap={offer:'🔥',loyalty:'⭐',order:'📦',promo:'🎁'};
  list.innerHTML=NOTIFICATIONS.map(function(n){
    return '<div class="notif-item'+(n.read?'':' unread')+'" onclick="markNotif('+n.id+')">'+
      '<div class="ni-ico '+(imap[n.type]||'ni-offer')+'">'+(emap[n.type]||'🔥')+'</div>'+
      '<div class="ni-body"><div class="ni-t">'+n.title+'</div><div class="ni-s">'+n.text+'</div><div class="ni-time">'+n.time+'</div></div>'+
      (n.read?'':'<div class="ni-dot"></div>')+
      '</div>';
  }).join('');
}
function markNotif(id){for(var i=0;i<NOTIFICATIONS.length;i++){if(NOTIFICATIONS[i].id===id){NOTIFICATIONS[i].read=true;break;}}updNotifBadge();renderNotifPanel();}
function clearNotifs(){NOTIFICATIONS.forEach(function(n){n.read=true;});updNotifBadge();renderNotifPanel();}
function updNotifBadge(){var n=NOTIFICATIONS.filter(function(x){return!x.read;}).length;var b=document.getElementById('notifBadge');if(b){b.textContent=n;if(n>0)b.classList.remove('hidden');else b.classList.add('hidden');}}
