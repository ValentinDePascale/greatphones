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
  _lastMsgDate=null;
  if(!msgs||msgs.length===0){
    list.innerHTML='<div style="text-align:center;padding:2rem 1rem;color:var(--gray)"><div style="width:64px;height:64px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:28px">\u{1F4AC}</div><p style="font-size:14px;font-family:\'Playfair Display\',Georgia,serif;font-weight:600;color:var(--dk);margin-bottom:.4rem">Hola! Como podemos ayudarte?</p><p style="font-size:12px">Escribe tu consulta y te responderemos a la brevedad</p></div>';
    return;
  }
  var html='';
  msgs.forEach(function(m){
    var msgDate=new Date(m.createdAt);
    var dateStr=msgDate.toDateString();
    if(dateStr!==_lastMsgDate){
      html+='<div style="text-align:center;padding:8px 0 12px;position:relative"><span style="font-size:10px;font-weight:600;color:var(--gray);background:var(--cream);padding:3px 14px;border-radius:10px;letter-spacing:.3px;text-transform:uppercase">'+formatDate(msgDate)+'</span></div>';
      _lastMsgDate=dateStr;
    }
    var isMine=currentUser&&m.from===currentUser.id;
    var time=formatTime(msgDate);
    var content='';
    if(m.imageUrl){
      content='<img src="'+m.imageUrl+'" style="max-width:220px;border-radius:10px;display:block;cursor:pointer" onclick="openLightbox(\''+m.imageUrl+'\')">';
      if(m.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+m.imageCaption+'</p>';
    }else{
      content='<p style="margin:0;line-height:1.5">'+escapeHtml(m.text||'')+'</p>';
    }
    html+='<div class="msg-wrap'+(isMine?' mine':'')+'" data-msg-id="'+(m.id||'')+'">'+
      '<div class="msg-bubble">'+
        content+
        '<div class="msg-time">'+time+'</div>'+
      '</div>'+
    '</div>';
  });
  list.innerHTML=html;
}

function appendMessageToChat(msg){
  var list=document.getElementById('chatMsgList');
  if(!list)return;
  if(msg.id){
    var existing=list.querySelector('[data-msg-id="'+msg.id+'"]');
    if(existing)return;
  }
  var msgDate=new Date(msg.createdAt);
  var dateStr=msgDate.toDateString();
  if(dateStr!==_lastMsgDate){
    list.insertAdjacentHTML('beforeend','<div style="text-align:center;padding:8px 0 12px;position:relative;animation:fadeIn .3s ease"><span style="font-size:10px;font-weight:600;color:var(--gray);background:var(--cream);padding:3px 14px;border-radius:10px;letter-spacing:.3px;text-transform:uppercase">'+formatDate(msgDate)+'</span></div>');
    _lastMsgDate=dateStr;
  }
  var isMine=currentUser&&msg.from===currentUser.id;
  var time=formatTime(msgDate);
  var content='';
  if(msg.imageUrl){
    content='<img src="'+msg.imageUrl+'" style="max-width:220px;border-radius:10px;display:block;cursor:pointer" onclick="openLightbox(\''+msg.imageUrl+'\')">';
    if(msg.imageCaption)content+='<p style="margin-top:6px;font-size:13px">'+msg.imageCaption+'</p>';
  }else{
    content='<p style="margin:0;line-height:1.5">'+escapeHtml(msg.text||'')+'</p>';
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
function formatDate(d){
  var today=new Date();var yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
  var dd=String(d.getDate()).padStart(2,'0');var mm=String(d.getMonth()+1).padStart(2,'0');var yyyy=d.getFullYear();
  if(d.toDateString()===today.toDateString())return'Hoy';
  if(d.toDateString()===yesterday.toDateString())return'Ayer';
  return dd+'/'+mm+'/'+yyyy;
}
var _lastMsgDate=null;

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
      var userDni=(c.user&&c.user.dni)?c.user.dni.toLowerCase():'';
      var lastMsg=(c.messages&&c.messages[0])?(c.messages[0].text||'').toLowerCase():'';
      return userName.indexOf(q)!==-1||userEmail.indexOf(q)!==-1||userDni.indexOf(q)!==-1||lastMsg.indexOf(q)!==-1;
    });
  }
  renderAdminConvList(filtered);
}

function searchAdminConvs(query){
  _adminConvSearchQuery=query;
  filterAndRenderAdminConvs(window._adminConvs||[]);
}

function getInitials(name){
  if(!name)return'?';
  var parts=name.trim().split(/\s+/);
  if(parts.length>=2)return(parts[0][0]+parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}
var avatarGradients=['linear-gradient(135deg,#FF6B2C,#e55a1a)','linear-gradient(135deg,#2563eb,#1d4ed8)','linear-gradient(135deg,#059669,#047857)','linear-gradient(135deg,#7c3aed,#6d28d9)','linear-gradient(135deg,#d97706,#b45309)','linear-gradient(135deg,#dc2626,#b91c1c)','linear-gradient(135deg,#0891b2,#0e7490)','linear-gradient(135deg,#db2777,#be185d)'];
function getAvatarGrad(name){
  if(!name)return avatarGradients[0];
  var hash=0;
  for(var i=0;i<name.length;i++){hash=name.charCodeAt(i)+((hash<<5)-hash);}
  return avatarGradients[Math.abs(hash)%avatarGradients.length];
}

function renderAdminConvList(convs){
  var list=document.getElementById('adminConvList');
  var count=document.getElementById('adminConvCount');
  if(!list)return;
  if(!convs||convs.length===0){
    list.innerHTML='<div style="text-align:center;padding:3rem 1.5rem;color:var(--gray)"><div style="width:56px;height:56px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:24px">\u{1F4AC}</div><p style="font-size:14px;font-weight:600;color:var(--dk);margin-bottom:4px">Sin conversaciones</p><p style="font-size:12px;line-height:1.5">No hay chats disponibles.<br>Cuando un cliente inicie uno, aparecerá aquí.</p></div>';
    if(count)count.textContent='0';
    return;
  }
  if(count)count.textContent=convs.length;
  list.innerHTML=convs.map(function(c){
    var lastMsg=c.messages&&c.messages[0]?c.messages[0].text||'\u{1F4F7} Imagen':''; 
    var time=c.lastMsgAt?timeAgo(new Date(c.lastMsgAt)):'';
    var unreadCount=c.unreadByAdmin||0;
    var userName=c.user?c.user.name:'Cliente';
    var userEmail=c.user?c.user.email:'';
    var initials=getInitials(userName);
    var grad=getAvatarGrad(userName);
    var isActive=c.id===adminActiveConvId;
    var status=c.status||'OPEN';
    var statusColors={OPEN:'#059669',CLOSED:'var(--gray)',RESOLVED:'#2563eb'};
    var statusLabels={OPEN:'Abierta',CLOSED:'Cerrada',RESOLVED:'Resuelta'};
    var statusColor=statusColors[status]||'var(--gray)';
    var statusLabel=statusLabels[status]||status;
    return '<div onclick="openAdminConv(\''+c.id+'\')" style="cursor:pointer;padding:14px 18px;display:flex;gap:12px;align-items:flex-start;transition:all .15s;background:'+(isActive?'rgba(255,107,44,.07)':'transparent')+';border-left:3px solid '+(isActive?'var(--orange)':'transparent')+';position:relative" onmouseover="this.style.background=\''+(isActive?'rgba(255,107,44,.07)':'rgba(255,107,44,.04)')+'\'" onmouseout="this.style.background=\''+(isActive?'rgba(255,107,44,.07)':'transparent')+'\'">'+
      '<div style="width:40px;height:40px;min-width:40px;border-radius:50%;background:'+grad+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,.1)">'+initials+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
          '<span style="font-size:13px;font-weight:600;color:var(--dk)">'+userName+'</span>'+
          '<div style="display:flex;align-items:center;gap:6px">'+
            (time?'<span style="font-size:10px;color:var(--gray)">'+time+'</span>':'')+
            (unreadCount>0?'<span style="background:var(--orange);color:#fff;font-size:9px;font-weight:700;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:9px;padding:0 5px;box-sizing:border-box">'+(unreadCount>99?'99+':unreadCount)+'</span>':'')+
          '</div>'+
        '</div>'+
        (userEmail?'<div style="font-size:10px;color:var(--gray);margin-bottom:4px">'+userEmail+'</div>':'')+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<span style="font-size:11px;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">'+(lastMsg||'Sin mensajes')+'</span>'+
          '<span style="width:5px;height:5px;border-radius:50%;background:'+statusColor+';flex-shrink:0"></span>'+
          '<span style="font-size:9px;color:'+statusColor+';font-weight:500;text-transform:uppercase;letter-spacing:.3px">'+statusLabel+'</span>'+
        '</div>'+
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
  
  var conv=window._adminConvs?window._adminConvs.find(function(c){return c.id===id;}):null;
  var userName=conv&&conv.user?conv.user.name:'Cliente';
  var userEmail=conv&&conv.user?conv.user.email:'';
  var userDni=conv&&conv.user?conv.user.dni:'';
  var initials=getInitials(userName);
  var grad=getAvatarGrad(userName);
  
  var avatarEl=document.getElementById('adminChatAvatar');
  if(avatarEl){
    avatarEl.style.display='flex';
    avatarEl.style.background=grad;
    avatarEl.textContent=initials;
  }
  var nameEl=document.getElementById('adminChatName');
  if(nameEl)nameEl.textContent=userName;
  var subEl=document.getElementById('adminChatSub');
  if(subEl){
    var subParts=[];
    if(userEmail)subParts.push(userEmail);
    if(userDni)subParts.push('DNI: '+userDni);
    subEl.textContent=subParts.join(' · ')||'Cliente';
  }
  var closeBtn=document.getElementById('adminCloseConvBtn');
  if(closeBtn)closeBtn.style.display='inline-flex';
  var deleteBtn=document.getElementById('adminDeleteConvBtn');
  if(deleteBtn)deleteBtn.style.display='inline-flex';
}

var quickReplyIcons=['\u2705','\u{1F68A}','\u{1F6E1}','\u{1F3ED}','\u23F3','\u2764'];
var cannedReplies=[
  {label:'Confirmado',text:'Tu pedido ha sido confirmado y estamos preparandolo. Te avisaremos cuando este listo para envio.'},
  {label:'Enviado',text:'Tu pedido fue enviado! Te compartiremos el numero de tracking para que puedas seguirlo.'},
  {label:'Garantía',text:'Tu compra tiene garantia de 90 dias segun Ley 24.240. Si tenes algun problema, contactanos.'},
  {label:'Retiro',text:'Tu pedido esta listo para retiro en nuestro local: Zelarrayan 179, Bahia Blanca. Horario: Lun a Vie 10-19hs.'},
  {label:'Demora',text:'Estamos teniendo una leve demora en tu pedido. Te agradecemos la paciencia y te avisaremos apenas este listo.'},
  {label:'Gracias',text:'Gracias por tu compra! Si tenes alguna consulta no dudes en escribirnos. Estamos para ayudarte.'},
];

function renderQuickReplies(){
  var container=document.getElementById('quickReplies');
  if(!container)return;
  container.style.display='flex';
  container.innerHTML=cannedReplies.map(function(r,i){
    var ico=quickReplyIcons[i]||'\u{1F4AC}';
    return '<button onclick="useQuickReply('+i+')" title="'+r.text+'" style="padding:5px 12px 5px 10px;font-size:11px;font-weight:500;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:20px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:4px;white-space:nowrap" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.background=\'rgba(255,107,44,.08)\';this.style.color=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--cream2)\';this.style.color=\'var(--dk)\'"><span style="font-size:13px">'+ico+'</span> '+r.label+'</button>';
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
  if(!id)return;
  showConfirm(
    'Eliminar conversación',
    '¿Estás seguro de que querés eliminar esta conversación? Esta acción no se puede deshacer.',
    { confirmText: 'Eliminar', confirmClass: 'danger' }
  ).then(function(confirmed){
    if(!confirmed) return;
    fetch(API_URL+'/api/admin/conversations',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-User-Id':currentUser.id},
      body:JSON.stringify({conversationId:id,action:'delete'})
    })
    .then(function(r){return r.json();})
    .then(function(){
      showSuccessToast('Conversación eliminada', 'El chat y sus mensajes fueron eliminados.');
      adminActiveConvId=null;
      userConvId=null;
      resetAdminChatHeader();
      loadAdminConversations();
      var list=document.getElementById('chatMsgList');
      if(list)list.innerHTML='';
    })
    .catch(function(e){console.error('Error deleting conversation:',e);showErrorToast('Error', 'No se pudo eliminar la conversación');});
  });
}

function resetAdminChatHeader(){
  var avatarEl=document.getElementById('adminChatAvatar');
  if(avatarEl)avatarEl.style.display='none';
  var nameEl=document.getElementById('adminChatName');
  if(nameEl)nameEl.textContent='Seleccioná una conversación';
  var subEl=document.getElementById('adminChatSub');
  if(subEl)subEl.textContent='';
  var closeBtn=document.getElementById('adminCloseConvBtn');
  if(closeBtn)closeBtn.style.display='none';
  var deleteBtn=document.getElementById('adminDeleteConvBtn');
  if(deleteBtn)deleteBtn.style.display='none';
}

function closeAdminConv(id){
  if(!id)return;
  fetch(API_URL+'/api/admin/conversations',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-User-Id':currentUser.id},
    body:JSON.stringify({conversationId:id,action:'close'})
  })
  .then(function(r){return r.json();})
  .then(function(){
    showSuccessToast('Conversación cerrada','El chat se ha marcado como cerrado.');
    adminActiveConvId=null;
    userConvId=null;
    resetAdminChatHeader();
    loadAdminConversations();
    var list=document.getElementById('chatMsgList');
    if(list)list.innerHTML='';
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
