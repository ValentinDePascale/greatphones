// =========== CHAT ===========
var activeConvId=0;
function renderClientConvList(){
  var list=document.getElementById('clientConvList');
  if(!list)return;
  list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Chat no disponible - conecta al backend</div>';
}
function openConv(id){notAvailable();}
function renderMsgs(msgs){
  var list=document.getElementById('chatMsgList');
  if(!list)return;
  list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">Chat no disponible</div>';
}
function sendChatMsg(){notAvailable();}
function sendChatImg(input){notAvailable();}
function openConvByType(type){notAvailable();}
