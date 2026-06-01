// =========== NOTIFICATIONS ===========
var _notifOpen=false;
var _notifUnreadCount=0;
var _notifPollInterval=null;

function toggleNotif(e){
  e.stopPropagation();
  _notifOpen=!_notifOpen;
  var panel=document.getElementById('notifPanel');
  if(panel){
    if(_notifOpen){
      panel.classList.add('open');
      renderNotifPanel();
    }else{
      panel.classList.remove('open');
    }
  }
}

function closeNotifPanel(){
  _notifOpen=false;
  var panel=document.getElementById('notifPanel');
  if(panel)panel.classList.remove('open');
}

function renderNotifPanel(){
  var list=document.getElementById('notifList');
  if(!list)return;
  if(!currentUser){
    list.innerHTML='<div style="padding:1rem;font-size:12px;color:var(--gray);text-align:center">Inicia sesion para ver tus notificaciones</div>';
    return;
  }
  list.innerHTML='<div style="padding:2rem;text-align:center"><div style="width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto"></div></div>';
  
  fetch(API_URL+'/api/notifications?userId='+currentUser.id+'&limit=20')
    .then(function(r){return r.json();})
    .then(function(notifs){
      if(!notifs||notifs.length===0){
        list.innerHTML='<div style="padding:2rem;text-align:center;color:var(--gray)"><p style="font-size:24px;margin-bottom:.5rem">🔔</p><p style="font-size:13px;font-weight:600">No tienes notificaciones</p><p style="font-size:11px;margin-top:4px">Las notificaciones apareceran aqui</p></div>';
        return;
      }
      list.innerHTML=notifs.map(function(n){
        var icon='🔔';
        if(n.type==='MESSAGE')icon='💬';
        else if(n.type==='ORDER')icon='📦';
        else if(n.type==='OFFER')icon='🏷️';
        else if(n.type==='PROMO')icon='🎉';
        else if(n.type==='LOYALTY')icon='⭐';
        var timeAgoStr=getTimeAgo(new Date(n.createdAt));
        var bg=n.read?'':'background:rgba(255,107,44,.04);';
        var clickAction='';
        if(n.type==='MESSAGE'&&n.conversationId){
          clickAction='onclick="openNotifConv(\''+n.conversationId+'\')" style="cursor:pointer;"';
        }
        return'<div '+clickAction+' style="padding:12px 16px;border-bottom:1px solid var(--border);'+bg+'transition:background .15s" onmouseover="this.style.background=\'rgba(255,107,44,.06)\'" onmouseout="this.style.background=\''+(n.read?'':'rgba(255,107,44,.04)')+'\'">'+
          '<div style="display:flex;gap:10px;align-items:flex-start">'+
            '<span style="font-size:18px;flex-shrink:0">'+icon+'</span>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:13px;font-weight:'+(n.read?'500':'600')+';color:var(--dk)">'+n.title+'</div>'+
              '<div style="font-size:12px;color:var(--gray);margin-top:2px">'+n.text+'</div>'+
              '<div style="font-size:10px;color:var(--gray);margin-top:4px">'+timeAgoStr+'</div>'+
            '</div>'+
            (!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--orange);flex-shrink:0;margin-top:4px"></div>':'')+
          '</div>'+
        '</div>';
      }).join('');
    })
    .catch(function(){
      list.innerHTML='<div style="padding:1rem;font-size:12px;color:var(--red);text-align:center">Error cargando notificaciones</div>';
    });
}

function openNotifConv(convId){
  closeNotifPanel();
  if(currentUser&&currentUser.role==='ADMIN'){
    nav('chats');
    setTimeout(function(){
      if(typeof openAdminConv==='function')openAdminConv(convId);
    },300);
  }else{
    nav('chats');
    setTimeout(function(){
      if(typeof openUserChat==='function')openUserChat(convId);
    },300);
  }
}

function markNotifAsRead(notifId){
  if(!currentUser||!notifId)return;
  fetch(API_URL+'/api/notifications/'+notifId+'/read',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({})
  }).catch(function(){});
}

function clearNotifs(){
  if(!currentUser)return;
  fetch(API_URL+'/api/notifications/read-all',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:currentUser.id})
  }).then(function(){
    renderNotifPanel();
    updateNotifBadge();
  }).catch(function(){});
}

function deleteAllNotifs(){
  if(!currentUser)return;
  showConfirm(
    'Eliminar notificaciones',
    '¿Eliminar todas las notificaciones?',
    { confirmText: 'Eliminar', confirmClass: 'danger' }
  ).then(function(confirmed){
    if(!confirmed)return;
    fetch(API_URL+'/api/notifications/clear-all',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:currentUser.id})
    }).then(function(){
      renderNotifPanel();
      updateNotifBadge();
      showSuccessToast('Notificaciones eliminadas', 'Todas las notificaciones han sido eliminadas');
    }).catch(function(){showErrorToast('Error', 'No se pudieron eliminar las notificaciones');});
  });
}

function updateNotifBadge(){
  if(!currentUser)return;
  fetch(API_URL+'/api/notifications?userId='+currentUser.id+'&unread=true&countOnly=true')
    .then(function(r){return r.json();})
    .then(function(data){
      _notifUnreadCount=data.count||0;
      var badge=document.getElementById('notifBadge');
      if(badge){
        if(_notifUnreadCount>0){
          badge.textContent=_notifUnreadCount>99?'99+':_notifUnreadCount;
          badge.classList.remove('hidden');
        }else{
          badge.classList.add('hidden');
        }
      }
    })
    .catch(function(){});
}

function startNotifPolling(){
  if(_notifPollInterval)clearInterval(_notifPollInterval);
  _notifPollInterval=setInterval(function(){
    if(currentUser)updateNotifBadge();
  },30000);
}

function stopNotifPolling(){
  if(_notifPollInterval){clearInterval(_notifPollInterval);_notifPollInterval=null;}
}

function getTimeAgo(date){
  var now=new Date();
  var diff=Math.floor((now-date)/1000);
  if(diff<60)return'Ahora';
  if(diff<3600)return Math.floor(diff/60)+' min';
  if(diff<86400)return Math.floor(diff/3600)+' h';
  return Math.floor(diff/86400)+' d';
}
