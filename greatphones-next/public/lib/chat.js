// =========== CHAT SIMPLIFICADO ===========
var chatSocket=null;
var userConvId=null;
var typingTimeout=null;
var chatPollInterval=null;
var notifPollInterval=null;

function initChatSocket(){
  if(!currentUser||!window.ChatSocket)return;
  try{
    chatSocket=window.ChatSocket('http://localhost:3001',{
      auth:{userId:currentUser.id}
    });
    chatSocket.on('connect',function(){
      console.log('[Chat] Connected');
      if(userConvId)chatSocket.emit('joinConversation',userConvId);
    });
    chatSocket.on('newMessage',function(msg){
      if(msg.conversationId===userConvId){
        appendMessageToChat(msg);
        scrollToBottom();
        appendPanelMessage(msg);
        scrollPanelBottom();
      }else{
        if(typeof showToast==='function')showToast('Tienes un nuevo mensaje del administrador');
        updateMsgBadge();
      }
    });
    chatSocket.on('userTyping',function(data){
      showTypingIndicator(data.userName);
      showPanelTyping(data.userName);
    });
    chatSocket.on('userStoppedTyping',function(){
      hideTypingIndicator();
      hidePanelTyping();
    });
    chatSocket.on('disconnect',function(){
      console.log('[Chat] Disconnected');
    });
  }catch(e){
    console.log('[Chat] Socket not available, using polling');
    startChatPolling();
  }
  startChatNotifPolling();
}

function startChatPolling(){
  if(chatPollInterval)clearInterval(chatPollInterval);
  chatPollInterval=setInterval(function(){
    if(userConvId)loadPanelMessages(userConvId,false);
  },3000);
}

function stopChatPolling(){
  if(chatPollInterval){clearInterval(chatPollInterval);chatPollInterval=null;}
}

function openUserChat(){
  if(!currentUser){openLogin();return;}
  initChatSocket();
  getUserConversation();
}

function getUserConversation(){
  fetch(API_URL+'/api/conversations?userId='+currentUser.id)
    .then(function(r){return r.json();})
    .then(function(convs){
      if(convs&&convs.length>0){
        userConvId=convs[0].id;
        loadPanelMessages(userConvId,true);
        markAsRead(userConvId);
        if(chatSocket)chatSocket.emit('joinConversation',userConvId);
      }else{
        createDefaultConversation();
      }
    })
    .catch(function(e){console.error('Error loading conversation:',e);});
}

function createDefaultConversation(){
  fetch(API_URL+'/api/conversations',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      userId:currentUser.id,
      type:'GENERIC',
      subject:'Chat con Great Phones',
      firstMessage:''
    })
  })
  .then(function(r){return r.json();})
  .then(function(conv){
    userConvId=conv.id;
    var list=document.getElementById('panelMsgList');
    if(list){
      list.innerHTML='<div style="text-align:center;padding:2rem 1rem;color:var(--gray)"><div style="width:64px;height:64px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:28px">\u{1F4AC}</div><p style="font-size:14px;font-family:\'Playfair Display\',Georgia,serif;font-weight:600;color:var(--dk);margin-bottom:.4rem">Hola! Como podemos ayudarte?</p><p style="font-size:12px">Escribe tu consulta y te responderemos a la brevedad</p></div>';
    }
    if(chatSocket)chatSocket.emit('joinConversation',userConvId);
  })
  .catch(function(e){console.error('Error creating conversation:',e);});
}

function loadMessages(convId,scrollBottom){
  fetch(API_URL+'/api/conversations/'+convId+'/messages?limit=50')
    .then(function(r){return r.json();})
    .then(function(msgs){
      renderMsgs(msgs);
      if(scrollBottom)setTimeout(scrollToBottom,100);
    })
    .catch(function(e){console.error('Error loading messages:',e);});
}

function renderMsgs(msgs){
  var list=document.getElementById('chatMsgList');
  if(!list)return;
  if(!msgs||msgs.length===0){
    list.innerHTML='<div style="text-align:center;padding:2rem 1rem;color:var(--gray)"><div style="width:64px;height:64px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:28px">\u{1F4AC}</div><p style="font-size:14px;font-family:\'Playfair Display\',Georgia,serif;font-weight:600;color:var(--dk);margin-bottom:.4rem">Hola! Como podemos ayudarte?</p><p style="font-size:12px">Escribe tu consulta y te responderemos a la brevedad</p></div>';
    return;
  }
  list.innerHTML=msgs.map(function(m){
    var isMine=currentUser&&m.from===currentUser.id;
    var time=formatTime(new Date(m.createdAt));
    var content='';
    if(m.imageUrl){
      content='<img src="'+m.imageUrl+'" class="msg-img" onclick="openLightbox(\''+m.imageUrl+'\')">';
      if(m.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+m.imageCaption+'</p>';
    }else{
      content='<p style="margin:0">'+escapeHtml(m.text||'')+'</p>';
    }
    return '<div class="msg-wrap'+(isMine?' mine':'')+'">'+
      '<div class="msg-bubble">'+
        content+
        '<div class="msg-time">'+time+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function appendMessageToChat(msg){
  var list=document.getElementById('chatMsgList');
  if(!list)return;
  var isMine=currentUser&&msg.from===currentUser.id;
  var time=formatTime(new Date(msg.createdAt));
  var content='';
  if(msg.imageUrl){
    content='<img src="'+msg.imageUrl+'" class="msg-img" onclick="openLightbox(\''+msg.imageUrl+'\')">';
    if(msg.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+msg.imageCaption+'</p>';
  }else{
    content='<p style="margin:0">'+escapeHtml(msg.text||'')+'</p>';
  }
  var html='<div class="msg-wrap'+(isMine?' mine':'')+'" style="animation:msgIn .3s ease">'+
    '<div class="msg-bubble">'+
      content+
      '<div class="msg-time">'+time+'</div>'+
    '</div>'+
  '</div>';
  list.insertAdjacentHTML('beforeend',html);
}

function sendMessage(){
  var input=document.getElementById('chatInput');
  if(!input||!input.value.trim()||!userConvId)return;
  var text=input.value.trim();
  input.value='';
  hideTypingIndicator();
  if(chatSocket)chatSocket.emit('stopTyping',{conversationId:userConvId});
  
  fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:currentUser.id,text:text})
  })
  .then(function(r){return r.json();})
  .then(function(msg){
    appendMessageToChat(msg);
    scrollToBottom();
    if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
  })
  .catch(function(e){console.error('Error sending message:',e);});
}

function sendChatImg(input){
  var file=input.files[0];
  if(!file||!userConvId)return;
  var formData=new FormData();
  formData.append('file',file);
  formData.append('upload_preset','greatphones');
  
  fetch('https://api.cloudinary.com/v1_1/dck24mtpw/image/upload',{
    method:'POST',
    body:formData
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.secure_url){
      fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:currentUser.id,imageUrl:data.secure_url,imageCaption:file.name})
      })
      .then(function(r){return r.json();})
      .then(function(msg){
        appendMessageToChat(msg);
        scrollToBottom();
        if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
      });
    }
  })
  .catch(function(e){console.error('Error uploading image:',e);});
  input.value='';
}

function markAsRead(convId){
  if(!currentUser)return;
  fetch(API_URL+'/api/conversations/'+convId+'/read',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({readerId:currentUser.id})
  }).catch(function(e){});
  if(chatSocket)chatSocket.emit('markRead',{conversationId:convId});
}

function showTypingIndicator(userName){
  var el=document.getElementById('typingIndicator');
  if(el){
    el.innerHTML='<span style="font-size:12px;color:var(--gray);font-style:italic">'+(userName||'Great Phones')+' est\u00E1 escribiendo...</span>';
    el.style.display='block';
  }
}

function hideTypingIndicator(){
  var el=document.getElementById('typingIndicator');
  if(el)el.style.display='none';
}

function handleTyping(){
  if(!userConvId||!currentUser)return;
  if(chatSocket)chatSocket.emit('typing',{conversationId:userConvId,userName:currentUser.name});
  if(typingTimeout)clearTimeout(typingTimeout);
  typingTimeout=setTimeout(function(){
    if(chatSocket)chatSocket.emit('stopTyping',{conversationId:userConvId});
  },3000);
}

function scrollToBottom(){
  var list=document.getElementById('chatMsgList');
  if(list)list.scrollTop=list.scrollHeight;
}

function formatTime(d){
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function timeAgo(d){
  var now=new Date();
  var diff=Math.floor((now-d)/1000);
  if(diff<60)return'Ahora';
  if(diff<3600)return Math.floor(diff/60)+'min';
  if(diff<86400)return Math.floor(diff/3600)+'h';
  return Math.floor(diff/86400)+'d';
}

function escapeHtml(text){
  var div=document.createElement('div');
  div.textContent=text;
  return div.innerHTML;
}

// =========== ADMIN CHAT ===========
var adminActiveConvId=null;
function loadAdminConversations(){
  if(!currentUser||currentUser.role!=='ADMIN')return;
  fetch(API_URL+'/api/admin/conversations',{
    headers:{'X-User-Id':currentUser.id}
  })
    .then(function(r){return r.json();})
    .then(function(data){
      if(!Array.isArray(data)){console.error('Invalid admin conversations response:',data);return;}
      window._adminConvs=data;
      renderAdminConvList(data);
    })
    .catch(function(e){console.error('Error loading admin conversations:',e);});
}

function renderAdminConvList(convs){
  var list=document.getElementById('adminConvList');
  if(!list)return;
  if(!convs||convs.length===0){
    list.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">\u{1F4AC}</p><p style="font-size:14px">No hay conversaciones</p></div>';
    return;
  }
  list.innerHTML=convs.map(function(c){
    var lastMsg=c.messages&&c.messages[0]?c.messages[0].text||'\u{1F4F7}':''; 
    var time=c.lastMsgAt?timeAgo(new Date(c.lastMsgAt)):'Sin mensajes';
    var unreadCount=c.unreadByAdmin||0;
    var unreadBadge=unreadCount>0?'<span style="background:var(--orange);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">'+unreadCount+'</span>':'';
    var isActive=c.id===adminActiveConvId;
    return '<div class="conv-item'+(isActive?' act-conv':'')+'" onclick="openAdminConv(\''+c.id+'\')" style="cursor:pointer;padding:14px 16px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:center;transition:background .15s;background:'+(isActive?'rgba(255,107,44,.05)':'')+'" onmouseover="this.style.background=\'rgba(255,107,44,.05)\'" onmouseout="this.style.background=\''+(isActive?'rgba(255,107,44,.05)':'')+'\'">'+
      '<div style="width:44px;height:44px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">\u{1F464}</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">'+
          '<span style="font-size:13px;font-weight:600;color:var(--dk)">'+(c.user?c.user.name:'Cliente')+'</span>'+
          unreadBadge+
        '</div>'+
        '<div style="font-size:12px;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">'+lastMsg+'</div>'+
        '<div style="font-size:10px;color:var(--gray);margin-top:2px">'+time+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function openAdminConv(id){
  adminActiveConvId=id;
  userConvId=id;
  loadMessages(id,true);
  markAsRead(id);
  if(chatSocket)chatSocket.emit('joinConversation',id);
  renderAdminConvList(window._adminConvs);
  
  var header=document.getElementById('adminChatHeader');
  if(header){
    var conv=window._adminConvs?window._adminConvs.find(function(c){return c.id===id;}):null;
    var userName=conv&&conv.user?conv.user.name:'Cliente';
    header.innerHTML='<span style="font-size:14px;font-weight:600">'+userName+'</span>'+
      '<div style="display:flex;gap:6px">'+
        '<button onclick="closeAdminConv(\''+id+'\')" style="padding:5px 10px;font-size:10px;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer">Cerrar</button>'+
      '</div>';
  }
}

function closeAdminConv(id){
  fetch(API_URL+'/api/admin/conversations',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-User-Id':currentUser.id},
    body:JSON.stringify({conversationId:id,action:'close'})
  })
  .then(function(r){return r.json();})
  .then(function(){
    showToast('Conversaci\u00F3n cerrada');
    adminActiveConvId=null;
    loadAdminConversations();
  })
  .catch(function(e){console.error('Error closing conversation:',e);});
}

function sendAdminMessage(){
  var input=document.getElementById('adminChatInput');
  if(!input||!input.value.trim()||!userConvId)return;
  var text=input.value.trim();
  input.value='';
  
  fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:currentUser.id,text:text})
  })
  .then(function(r){return r.json();})
  .then(function(msg){
    appendMessageToChat(msg);
    scrollToBottom();
    if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
  })
  .catch(function(e){console.error('Error sending admin message:',e);});
}

// =========== PANEL CHAT ===========
function sendPanelMessage(){
  var input=document.getElementById('panelChatInput');
  if(!input||!input.value.trim()||!userConvId)return;
  var text=input.value.trim();
  input.value='';
  hidePanelTyping();
  if(chatSocket)chatSocket.emit('stopTyping',{conversationId:userConvId});

  fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:currentUser.id,text:text})
  })
  .then(function(r){return r.json();})
  .then(function(msg){
    appendPanelMessage(msg);
    scrollPanelBottom();
    if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
  })
  .catch(function(e){console.error('Error sending panel message:',e);});
}

function sendPanelImg(input){
  var file=input.files[0];
  if(!file||!userConvId)return;
  var formData=new FormData();
  formData.append('file',file);
  formData.append('upload_preset','greatphones');

  fetch('https://api.cloudinary.com/v1_1/dck24mtpw/image/upload',{
    method:'POST',
    body:formData
  })
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.secure_url){
      fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:currentUser.id,imageUrl:data.secure_url,imageCaption:file.name})
      })
      .then(function(r){return r.json();})
      .then(function(msg){
        appendPanelMessage(msg);
        scrollPanelBottom();
        if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
      });
    }
  })
  .catch(function(e){console.error('Error uploading panel image:',e);});
  input.value='';
}

function appendPanelMessage(msg){
  var list=document.getElementById('panelMsgList');
  if(!list)return;
  var isMine=currentUser&&msg.from===currentUser.id;
  var time=formatTime(new Date(msg.createdAt));
  var content='';
  if(msg.imageUrl){
    content='<img src="'+msg.imageUrl+'" class="msg-img" onclick="openLightbox(\''+msg.imageUrl+'\')">';
    if(msg.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+msg.imageCaption+'</p>';
  }else{
    content='<p style="margin:0">'+escapeHtml(msg.text||'')+'</p>';
  }
  var html='<div class="msg-wrap'+(isMine?' mine':'')+'" style="animation:msgIn .3s ease">'+
    '<div class="msg-bubble">'+
      content+
      '<div class="msg-time">'+time+'</div>'+
    '</div>'+
  '</div>';
  list.insertAdjacentHTML('beforeend',html);
}

function scrollPanelBottom(){
  var list=document.getElementById('panelMsgList');
  if(list)list.scrollTop=list.scrollHeight;
}

function showPanelTyping(userName){
  var el=document.getElementById('panelTyping');
  if(el){
    el.innerHTML='<span style="font-size:12px;color:var(--gray);font-style:italic">'+(userName||'Great Phones')+' est\u00E1 escribiendo...</span>';
    el.style.display='block';
  }
}

function hidePanelTyping(){
  var el=document.getElementById('panelTyping');
  if(el)el.style.display='none';
}

function handlePanelTyping(){
  if(!userConvId||!currentUser)return;
  if(chatSocket)chatSocket.emit('typing',{conversationId:userConvId,userName:currentUser.name});
  if(typingTimeout)clearTimeout(typingTimeout);
  typingTimeout=setTimeout(function(){
    if(chatSocket)chatSocket.emit('stopTyping',{conversationId:userConvId});
  },3000);
}

function loadPanelMessages(convId,scrollBottom){
  fetch(API_URL+'/api/conversations/'+convId+'/messages?limit=50')
    .then(function(r){return r.json();})
    .then(function(msgs){
      renderPanelMsgs(msgs);
      if(scrollBottom)setTimeout(scrollPanelBottom,100);
    })
    .catch(function(e){console.error('Error loading panel messages:',e);});
}

function renderPanelMsgs(msgs){
  var list=document.getElementById('panelMsgList');
  if(!list)return;
  if(!msgs||msgs.length===0){
    list.innerHTML='<div style="text-align:center;padding:2rem 1rem;color:var(--gray)"><div style="width:64px;height:64px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:28px">\u{1F4AC}</div><p style="font-size:14px;font-family:\'Playfair Display\',Georgia,serif;font-weight:600;color:var(--dk);margin-bottom:.4rem">Hola! Como podemos ayudarte?</p><p style="font-size:12px">Escribe tu consulta y te responderemos a la brevedad</p></div>';
    return;
  }
  list.innerHTML=msgs.map(function(m){
    var isMine=currentUser&&m.from===currentUser.id;
    var time=formatTime(new Date(m.createdAt));
    var content='';
    if(m.imageUrl){
      content='<img src="'+m.imageUrl+'" class="msg-img" onclick="openLightbox(\''+m.imageUrl+'\')">';
      if(m.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+m.imageCaption+'</p>';
    }else{
      content='<p style="margin:0">'+escapeHtml(m.text||'')+'</p>';
    }
    return '<div class="msg-wrap'+(isMine?' mine':'')+'">'+
      '<div class="msg-bubble">'+
        content+
        '<div class="msg-time">'+time+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function startChatNotifPolling(){
  if(notifPollInterval)clearInterval(notifPollInterval);
  notifPollInterval=setInterval(function(){
    updateMsgBadge();
  },10000);
}

function stopChatNotifPolling(){
  if(notifPollInterval){clearInterval(notifPollInterval);notifPollInterval=null;}
}

function updateMsgBadge(){
  if(!currentUser)return;
  fetch(API_URL+'/api/conversations?userId='+currentUser.id+'&status=OPEN')
    .then(function(r){return r.json();})
    .then(function(convs){
      var totalUnread=0;
      convs.forEach(function(c){
        totalUnread+=(c.unreadByUser||0);
      });
      var badge=document.getElementById('msgBadge');
      if(badge){
        if(totalUnread>0){
          badge.textContent=totalUnread>99?'99+':totalUnread;
          badge.style.display='flex';
        }else{
          badge.style.display='none';
        }
      }
    })
    .catch(function(e){});
}
