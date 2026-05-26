// =========== CHAT SIMPLIFICADO ===========
var chatSocket=null;
var userConvId=null;
var typingTimeout=null;
var chatPollInterval=null;
var notifPollInterval=null;
var socketConnected=false;

function initChatSocket(){
  if(!currentUser||!window.io){
    console.log('[Chat] Socket client not available, using polling');
    startChatPolling();
    return;
  }
  try{
    var socketUrl=window.location.hostname==='localhost'?'http://localhost:3001':window.location.origin;
    console.log('[Chat] Connecting to:', socketUrl);
    chatSocket=window.io(socketUrl,{
      auth:{userId:currentUser.id},
      reconnection:true,
      reconnectionAttempts:5,
      reconnectionDelay:1000,
      timeout:10000
    });
    chatSocket.on('connect',function(){
      socketConnected=true;
      console.log('[Chat] Connected to socket server');
      if(userConvId)chatSocket.emit('joinConversation',userConvId);
      stopChatPolling();
    });
    chatSocket.on('connect_error',function(err){
      socketConnected=false;
      console.error('[Chat] Connection error:', err.message);
      startChatPolling();
    });
    chatSocket.on('disconnect',function(reason){
      socketConnected=false;
      console.log('[Chat] Disconnected:', reason);
      startChatPolling();
    });
    chatSocket.on('reconnect',function(attempt){
      socketConnected=true;
      console.log('[Chat] Reconnected after', attempt, 'attempts');
      if(userConvId)chatSocket.emit('joinConversation',userConvId);
      stopChatPolling();
    });
    chatSocket.on('newMessage',function(msg){
      console.log('[Chat] Received newMessage:', msg);
      console.log('[Chat] userConvId:', userConvId, 'msg.conversationId:', msg.conversationId);
      if(msg.conversationId===userConvId){
        console.log('[Chat] Appending message to chat');
        appendMessageToChat(msg);
        scrollToBottom();
        appendPanelMessage(msg);
        scrollPanelBottom();
      }else{
        console.log('[Chat] Message for different conversation, updating badge');
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
  }catch(e){
    console.error('[Chat] Socket init error:', e);
    startChatPolling();
  }
  startChatNotifPolling();
}

var chatPollDelay=3000;
var chatPollMaxDelay=30000;

function startChatPolling(){
  if(chatPollInterval)clearInterval(chatPollInterval);
  chatPollInterval=setInterval(function(){
    if(userConvId)loadPanelMessages(userConvId,false);
    chatPollDelay=Math.min(chatPollDelay*1.5,chatPollMaxDelay);
  },chatPollDelay);
}

function stopChatPolling(){
  if(chatPollInterval){clearInterval(chatPollInterval);chatPollInterval=null;}
  chatPollDelay=3000;
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
    return '<div class="msg-wrap'+(isMine?' mine':'')+'" data-msg-id="'+(m.id||'')+'">'+
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
  if(msg.id){
    var existing=list.querySelector('[data-msg-id="'+msg.id+'"]');
    if(existing)return;
  }
  var isMine=currentUser&&msg.from===currentUser.id;
  var time=formatTime(new Date(msg.createdAt));
  var content='';
  if(msg.imageUrl){
    content='<img src="'+msg.imageUrl+'" class="msg-img" onclick="openLightbox(\''+msg.imageUrl+'\')">';
    if(msg.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+msg.imageCaption+'</p>';
  }else{
    content='<p style="margin:0">'+escapeHtml(msg.text||'')+'</p>';
  }
  var html='<div class="msg-wrap'+(isMine?' mine':'')+'" data-msg-id="'+(msg.id||'')+'" style="animation:msgIn .3s ease">'+
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
    checkAndShowAutoReply();
  })
  .catch(function(e){console.error('Error sending message:',e);});
}

function checkAndShowAutoReply(){
  if(window._autoReplyShown)return;
  fetch(API_URL+'/api/conversations/'+userConvId+'/messages?limit=10')
    .then(function(r){return r.json();})
    .then(function(msgs){
      if(!window._autoReplyShown&&msgs&&msgs.length>=1){
        var userMsgCount=0;
        var hasAdminMsg=false;
        for(var i=0;i<msgs.length;i++){
          if(msgs[i].from===currentUser.id){
            userMsgCount++;
          }else if(msgs[i].from!=='system'){
            hasAdminMsg=true;
            break;
          }
        }
        console.log('[AutoReply] userMsgCount:',userMsgCount,'hasAdminMsg:',hasAdminMsg);
        if(!hasAdminMsg&&userMsgCount<=2){
          console.log('[AutoReply] Showing auto reply');
          window._autoReplyShown=true;
          setTimeout(showAutoReply,300);
        }else{
          console.log('[AutoReply] Not showing - hasAdminMsg:',hasAdminMsg,'userMsgCount:',userMsgCount);
        }
      }
    })
    .catch(function(e){console.error('[AutoReply] Error checking messages:',e);});
}

var faqOptions=[
  {id:'horarios',label:'Horarios de atencion',answer:'Nuestro horario de atencion es de Lunes a Viernes de 10:00 a 19:00hs y Sabados de 10:00 a 14:00hs. Estamos en Zelarrayan 179, Bahia Blanca.'},
  {id:'garantia',label:'Garantia de productos',answer:'Todos nuestros productos tienen garantia de 90 dias segun Ley 24.240. Si tenes algun problema, contactanos y lo resolvemos.'},
  {id:'envios',label:'Informacion sobre envios',answer:'Realizamos envios a todo el pais. El tiempo de entrega es de 3 a 7 dias habiles. Tambien podes retirar en nuestro local en Zelarrayan 179, Bahia Blanca.'},
  {id:'pagos',label:'Medios de pago',answer:'Aceptamos Mercado Pago, tarjetas de credito/debito y efectivo. Podes pagar en hasta 12 cuotas sin interes.'},
  {id:'devoluciones',label:'Devoluciones y arrepentimientos',answer:'Tenes 10 dias habiles desde la recepcion para ejercer tu derecho de arrepentimiento segun Ley 24.240. El reembolso se procesa en 10 dias habiles.'},
];

function showAutoReply(){
  console.log('[AutoReply] Rendering to chatMsgList');
  var list=document.getElementById('chatMsgList');
  if(!list){console.log('[AutoReply] chatMsgList not found');return;}
  
  var faqButtonsHtml=faqOptions.map(function(faq){
    return '<button onclick="handleFaqClick(\''+faq.id+'\')" style="display:block;width:100%;padding:10px 14px;margin-bottom:6px;background:#fff;border:1.5px solid var(--border);border-radius:10px;font-size:12px;font-weight:600;color:var(--dk);cursor:pointer;text-align:left;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.background=\'rgba(255,107,44,.05)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'#fff\'">'+faq.label+'</button>';
  }).join('');
  
  var html='<div class="msg-wrap" style="animation:msgIn .3s ease">'+
    '<div class="msg-bubble" style="background:#fff;border:1.5px solid var(--border);max-width:100%">'+
      '<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--dk)">Hola! Gracias por ponerte en contacto con <span style="color:var(--orange)">Great Phones</span></p>'+
      '<p style="margin:0 0 12px;font-size:12px;color:var(--gray)">Selecciona una opcion o escribinos tu consulta:</p>'+
      '<div id="faqButtons">'+faqButtonsHtml+'</div>'+
      '<button onclick="requestAdvisor()" style="width:100%;padding:10px 14px;margin-top:8px;background:var(--orange);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s" onmouseover="this.style.background=\'#e55a1a\'" onmouseout="this.style.background=\'var(--orange)\'">Hablar con un Asesor</button>'+
      '<div class="msg-time">'+formatTime(new Date())+'</div>'+
    '</div>'+
  '</div>';
  
  list.insertAdjacentHTML('beforeend',html);
  scrollToBottom();
  showPanelAutoReply();
}

function showPanelAutoReply(){
  console.log('[AutoReply] Rendering to panelMsgList');
  var list=document.getElementById('panelMsgList');
  if(!list){console.log('[AutoReply] panelMsgList not found');return;}
  
  var faqButtonsHtml=faqOptions.map(function(faq){
    return '<button onclick="handleFaqClick(\''+faq.id+'\')" style="display:block;width:100%;padding:8px 12px;margin-bottom:4px;background:#fff;border:1.5px solid var(--border);border-radius:8px;font-size:11px;font-weight:600;color:var(--dk);cursor:pointer;text-align:left;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.background=\'rgba(255,107,44,.05)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'#fff\'">'+faq.label+'</button>';
  }).join('');
  
  var html='<div class="msg-wrap" style="animation:msgIn .3s ease">'+
    '<div class="msg-bubble" style="background:#fff;border:1.5px solid var(--border);max-width:100%">'+
      '<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:var(--dk)">Hola! Gracias por contactarnos</p>'+
      '<p style="margin:0 0 8px;font-size:11px;color:var(--gray)">Selecciona una opcion:</p>'+
      '<div id="panelFaqButtons">'+faqButtonsHtml+'</div>'+
      '<button onclick="requestAdvisor()" style="width:100%;padding:8px 12px;margin-top:6px;background:var(--orange);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">Hablar con un Asesor</button>'+
    '</div>'+
  '</div>';
  
  list.insertAdjacentHTML('beforeend',html);
  scrollPanelBottom();
}

function handleFaqClick(faqId){
  var faq=faqOptions.find(function(f){return f.id===faqId;});
  if(!faq)return;
  
  var list=document.getElementById('chatMsgList');
  if(list){
    var html='<div class="msg-wrap mine" style="animation:msgIn .3s ease">'+
      '<div class="msg-bubble">'+
        '<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:var(--orange)">'+faq.label+'</p>'+
        '<p style="margin:0">'+faq.answer+'</p>'+
        '<div class="msg-time">'+formatTime(new Date())+'</div>'+
      '</div>'+
    '</div>';
    list.insertAdjacentHTML('beforeend',html);
    scrollToBottom();
  }
  
  var panelList=document.getElementById('panelMsgList');
  if(panelList){
    var panelHtml='<div class="msg-wrap mine" style="animation:msgIn .3s ease">'+
      '<div class="msg-bubble">'+
        '<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:var(--orange)">'+faq.label+'</p>'+
        '<p style="margin:0;font-size:12px">'+faq.answer+'</p>'+
      '</div>'+
    '</div>';
    panelList.insertAdjacentHTML('beforeend',panelHtml);
    scrollPanelBottom();
  }
  
  var faqContainer=document.getElementById('faqButtons');
  if(faqContainer){
    var btns=faqContainer.querySelectorAll('button');
    btns.forEach(function(btn){
      btn.disabled=true;
      btn.style.opacity='0.5';
      btn.style.cursor='not-allowed';
    });
  }
  var panelFaqContainer=document.getElementById('panelFaqButtons');
  if(panelFaqContainer){
    var pBtns=panelFaqContainer.parentElement.querySelectorAll('button');
    pBtns.forEach(function(btn){
      btn.disabled=true;
      btn.style.opacity='0.5';
      btn.style.cursor='not-allowed';
    });
  }
}

function requestAdvisor(){
  var list=document.getElementById('chatMsgList');
  if(list){
    var html='<div class="msg-wrap" style="animation:msgIn .3s ease">'+
      '<div class="msg-bubble" style="background:#f0fdf4;border:1.5px solid #22c55e;max-width:100%">'+
        '<p style="margin:0;font-size:13px;color:#059669;font-weight:600">Entendido!</p>'+
        '<p style="margin:8px 0 0;font-size:12px;color:#166534">En unos momentos alguien del personal se pondra en contacto contigo.</p>'+
        '<div class="msg-time">'+formatTime(new Date())+'</div>'+
      '</div>'+
    '</div>';
    list.insertAdjacentHTML('beforeend',html);
    scrollToBottom();
  }
  
  var panelList=document.getElementById('panelMsgList');
  if(panelList){
    var panelHtml='<div class="msg-wrap" style="animation:msgIn .3s ease">'+
      '<div class="msg-bubble" style="background:#f0fdf4;border:1.5px solid #22c55e;max-width:100%">'+
        '<p style="margin:0;font-size:12px;color:#059669;font-weight:600">Entendido!</p>'+
        '<p style="margin:6px 0 0;font-size:11px;color:#166534">Alguien se pondra en contacto contigo pronto.</p>'+
      '</div>'+
    '</div>';
    panelList.insertAdjacentHTML('beforeend',panelHtml);
    scrollPanelBottom();
  }
  
  fetch(API_URL+'/api/conversations/'+userConvId+'/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId:'system',text:'El usuario solicito hablar con un asesor.',isAutoReply:true})
  })
  .then(function(r){return r.json();})
  .then(function(msg){
    if(chatSocket)chatSocket.emit('messageSent',{conversationId:userConvId,message:msg});
  })
  .catch(function(){});
  
  var faqContainer=document.getElementById('faqButtons');
  if(faqContainer){
    var btns=faqContainer.querySelectorAll('button');
    btns.forEach(function(btn){
      btn.disabled=true;
      btn.style.opacity='0.5';
      btn.style.cursor='not-allowed';
    });
  }
  var panelFaqContainer=document.getElementById('panelFaqButtons');
  if(panelFaqContainer){
    var pBtns=panelFaqContainer.parentElement.querySelectorAll('button');
    pBtns.forEach(function(btn){
      btn.disabled=true;
      btn.style.opacity='0.5';
      btn.style.cursor='not-allowed';
    });
  }
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
        checkAndShowAutoReply();
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
var _adminConvSearchQuery='';
function loadAdminConversations(){
  if(!currentUser||currentUser.role!=='ADMIN')return;
  fetch(API_URL+'/api/admin/conversations',{
    headers:{'X-User-Id':currentUser.id}
  })
    .then(function(r){return r.json();})
    .then(function(data){
      if(!Array.isArray(data)){console.error('Invalid admin conversations response:',data);return;}
      window._adminConvs=data;
      filterAndRenderAdminConvs(data);
    })
    .catch(function(e){console.error('Error loading admin conversations:',e);});
}

function filterAndRenderAdminConvs(convs){
  if(!convs)return;
  var filtered=convs;
  if(_adminConvSearchQuery&&_adminConvSearchQuery.trim()){
    var q=_adminConvSearchQuery.trim().toLowerCase();
    filtered=convs.filter(function(c){
      var userName=(c.user&&c.user.name)?c.user.name.toLowerCase():'';
      var userEmail=(c.user&&c.user.email)?c.user.email.toLowerCase():'';
      var lastMsg=(c.messages&&c.messages[0])?(c.messages[0].text||'').toLowerCase():'';
      return userName.indexOf(q)!==-1||userEmail.indexOf(q)!==-1||lastMsg.indexOf(q)!==-1;
    });
  }
  renderAdminConvList(filtered);
}

function searchAdminConvs(query){
  _adminConvSearchQuery=query;
  filterAndRenderAdminConvs(window._adminConvs||[]);
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
  renderQuickReplies();
  loadAdminConversations();
  
  var header=document.getElementById('adminChatHeader');
  if(header){
    var conv=window._adminConvs?window._adminConvs.find(function(c){return c.id===id;}):null;
    var userName=conv&&conv.user?conv.user.name:'Cliente';
    header.innerHTML='<span style="font-size:14px;font-weight:600">'+userName+'</span>'+
      '<div style="display:flex;gap:6px">'+
        '<button onclick="deleteAdminConv(\''+id+'\')" style="padding:5px 10px;font-size:10px;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer">Borrar conversaci\u00F3n</button>'+
      '</div>';
  }
}

var cannedReplies=[
  {label:'Pedido confirmado',text:'Tu pedido ha sido confirmado y estamos preparandolo. Te avisaremos cuando este listo para envio.'},
  {label:'Enviado',text:'Tu pedido fue enviado! Te compartiremos el numero de tracking para que puedas seguirlo.'},
  {label:'Garantia',text:'Tu compra tiene garantia de 90 dias segun Ley 24.240. Si tenes algun problema, contactanos.'},
  {label:'Retiro en tienda',text:'Tu pedido esta listo para retiro en nuestro local: Zelarrayan 179, Bahia Blanca. Horario: Lun a Vie 10-19hs.'},
  {label:'Demora',text:'Estamos teniendo una leve demora en tu pedido. Te agradecemos la paciencia y te avisaremos apenas este listo.'},
  {label:'Gracias',text:'Gracias por tu compra! Si tenes alguna consulta no dudes en escribirnos. Estamos para ayudarte.'},
];

function renderQuickReplies(){
  var container=document.getElementById('quickReplies');
  if(!container)return;
  container.style.display='flex';
  container.innerHTML='<span style="font-size:10px;color:var(--gray);width:100%;margin-bottom:2px">Respuestas rapidas:</span>'+
    cannedReplies.map(function(r,i){
      return '<button onclick="useQuickReply('+i+')" style="padding:4px 10px;font-size:11px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.background=\'rgba(255,107,44,.05)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--cream2)\'">'+r.label+'</button>';
    }).join('');
}

function useQuickReply(index){
  var reply=cannedReplies[index];
  if(!reply)return;
  var input=document.getElementById('adminChatInput');
  if(input){
    input.value=reply.text;
    input.focus();
  }
}

function deleteAdminConv(id){
  if(!confirm('\u00BFEstas seguro de que queres eliminar esta conversaci\u00F3n? Esta acci\u00F3n no se puede deshacer.')){
    return;
  }
  fetch(API_URL+'/api/admin/conversations',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-User-Id':currentUser.id},
    body:JSON.stringify({conversationId:id,action:'delete'})
  })
  .then(function(r){return r.json();})
  .then(function(){
    showToast('Conversaci\u00F3n eliminada');
    adminActiveConvId=null;
    userConvId=null;
    loadAdminConversations();
    var header=document.getElementById('adminChatHeader');
    if(header){
      header.innerHTML='<span style="font-size:14px;font-weight:600;color:var(--gray)">Seleccion\u00E1 una conversaci\u00F3n</span>';
    }
    var list=document.getElementById('chatMsgList');
    if(list)list.innerHTML='';
  })
  .catch(function(e){console.error('Error deleting conversation:',e);showToast('Error eliminando conversaci\u00F3n');});
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
    checkAndShowAutoReply();
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
        checkAndShowAutoReply();
      });
    }
  })
  .catch(function(e){console.error('Error uploading panel image:',e);});
  input.value='';
}

function appendPanelMessage(msg){
  var list=document.getElementById('panelMsgList');
  if(!list)return;
  if(msg.id){
    var existing=list.querySelector('[data-msg-id="'+msg.id+'"]');
    if(existing)return;
  }
  var isMine=currentUser&&msg.from===currentUser.id;
  var time=formatTime(new Date(msg.createdAt));
  var content='';
  if(msg.imageUrl){
    content='<img src="'+msg.imageUrl+'" class="msg-img" onclick="openLightbox(\''+msg.imageUrl+'\')">';
    if(msg.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+msg.imageCaption+'</p>';
  }else{
    content='<p style="margin:0">'+escapeHtml(msg.text||'')+'</p>';
  }
  var html='<div class="msg-wrap'+(isMine?' mine':'')+'" data-msg-id="'+(msg.id||'')+'" style="animation:msgIn .3s ease">'+
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
    return '<div class="msg-wrap'+(isMine?' mine':'')+'" data-msg-id="'+(m.id||'')+'">'+
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
