// =========== CHAT ===========
function renderClientConvList(){
  var list=document.getElementById('clientConvList');
  if(!list)return;
  list.innerHTML=CONVERSATIONS.map(function(c){return '<div class="conv-item'+(c.unread>0?' act-conv':'')+'" onclick="openConv(\''+c.id+'\')"><div class="conv-av">'+c.ini+'</div><div style="flex:1;min-width:0"><div class="conv-name">'+c.cn+'</div><div class="conv-last">'+c.subj+'</div></div>'+(c.unread>0?'<div class="conv-unread">'+c.unread+'</div>':'')+'</div>';}).join('');
}
function openConv(id){
  var conv=CONVERSATIONS.find(function(c){return c.id===id;});
  if(!conv)return;
  activeConvId=id;
  document.getElementById('chatTitle').textContent=conv.cn;
  document.getElementById('chatSub').textContent=conv.subj;
  document.getElementById('chatAv').textContent=conv.ini;
  renderMsgs(conv.msgs);
  nav('chat');
}
function renderMsgs(msgs){
  var list=document.getElementById('chatMsgList');
  if(!list)return;
  list.innerHTML=msgs.map(function(m){return '<div class="msg-wrap'+(m.from==='client'?' mine':'')+'"><div class="msg-av-sm'+(m.from==='admin'?' adm':'')+'">'+(m.from==='admin'?'GP':'Yo')+'</div><div class="bubble '+(m.from==='client'?'mine':'other')+'">'+(m.img?'<img src="'+m.img+'" class="msg-img" onclick="openLightbox(this.src)"><div style="font-size:9px;color:var(--gray);margin-top:2px">'+m.imgCap+'</div>':m.txt)+'<span class="msg-ts">'+m.ts+'</span></div></div>';}).join('');
}
function sendChatMsg(){
  var inp=document.getElementById('chatInp');
  var txt=inp.value.trim();
  if(!txt||!activeConvId)return;
  var conv=CONVERSATIONS.find(function(c){return c.id===activeConvId});
  if(!conv)return;
  conv.msgs.push({from:'client',txt:txt,img:null,ts:new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})});
  inp.value='';
  renderMsgs(conv.msgs);
}
function sendChatImg(input){
  if(!input.files[0]||!activeConvId)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var conv=CONVERSATIONS.find(function(c){return c.id===activeConvId});
    if(!conv)return;
    conv.msgs.push({from:'client',txt:'',img:e.target.result,imgCap:'Foto enviada',ts:new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})});
    renderMsgs(conv.msgs);
  };
  reader.readAsDataURL(input.files[0]);
}
function openConvByType(type){
  var conv=CONVERSATIONS.find(function(c){return c.type===type;});
  if(conv)openConv(conv.id);
}
