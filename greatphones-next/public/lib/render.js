// =========== RENDER ===========
var API_URL=window.API_URL||(window.location.hostname==='localhost'?'http://localhost:3000':window.location.origin);
var PRODUCTS=[];
var currentProd=null;
var currentAcc=null;

// Magnetic hover for category cards
window.svMagnetic=function(e,el){
  var r=el.getBoundingClientRect();
  var x=e.clientX-r.left-r.width/2;
  var y=e.clientY-r.top-r.height/2;
  el.style.transform='translate('+(x*0.2)+'px,'+(y*0.2)+'px)';
};
window.svMagneticReset=function(el){
  el.style.transform='';
};
var detWMult=0,detDExtra=0,selCuotas=1;

function fmt(n){return'$'+n.toLocaleString('es-AR');}
function getById(arr,id){for(var i=0;i<arr.length;i++){if(arr[i].id==id)return arr[i];if(String(arr[i].id)===String(id))return arr[i];}return null;}

var detailBackTarget='shop';
var _accImages=[];

function goBackFromDetail(){nav(detailBackTarget);}

function buildSpecsForProduct(p){
  var specs=[];
  var type=(p.type||'').toLowerCase();
  var cond=p.condition||'';
  if(type==='celular'||type==='tablet'){
    if(cond==='Nuevo'){specs.push({ico:'\u2728',label:'Estado',val:'Nuevo',color:'var(--green)'});}
    else if(cond){specs.push({ico:'\u{1F4CB}',label:'Estado',val:cond,color:'var(--orange)'});}
    if(p.battery){var batPct=p.battery;var batColor=batPct>=90?'var(--green)':batPct>=75?'var(--orange)':'var(--red)';specs.push({ico:'\u{1F50B}',label:'Bateria',val:batPct+'%',color:batColor});}
    if(p.color)specs.push({ico:'\u{1F3A8}',label:'Color',val:p.color});
    if(p.ram)specs.push({ico:'\u26A1',label:'RAM',val:p.ram});
    if(p.storage)specs.push({ico:'\u{1F4BE}',label:'Almacenamiento',val:p.storage});
  }else if(type==='laptop'||type==='desktop'){
    if(p.processor)specs.push({ico:'\u{1F527}',label:'Procesador',val:p.processor});
    else if(p.sub){var cpuMatch=p.sub.match(/(M\d|Intel|AMD|Core\s*[i]\w+)/i);if(cpuMatch)specs.push({ico:'\u{1F527}',label:'Procesador',val:cpuMatch[0]});}
    if(p.storage)specs.push({ico:'\u{1F4BE}',label:'Almacenamiento',val:p.storage});
    if(p.ram)specs.push({ico:'\u26A1',label:'RAM',val:p.ram});
    if(p.screen)specs.push({ico:'\u{1F5A5}',label:'Pantalla',val:p.screen+'"'});
  }
  if(p.stock!==undefined){var stockColor=p.stock>5?'var(--green)':p.stock>0?'var(--orange)':'var(--red)';specs.push({ico:'\u{1F4E6}',label:'Stock',val:p.stock>0?p.stock+' disponibles':'Agotado',color:stockColor});}
  return specs;
}

function renderSpecsGrid(specs){
  var el=document.getElementById('detSpecs');if(!el)return;
  if(!specs.length){el.style.display='none';return;}
  el.style.display='grid';
  el.innerHTML=specs.map(function(s){
    return '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px">'+
      '<div style="width:40px;height:40px;border-radius:10px;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+s.ico+'</div>'+
      '<div><div style="font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">'+s.label+'</div>'+
      '<div style="font-size:15px;font-weight:700;color:var(--dk)'+(s.color?';color:'+s.color:'')+'">'+s.val+'</div></div></div>';
  }).join('');
}

function renderDetBadges(p,extraCond){
  var el=document.getElementById('detBadges');if(!el)return;
  var type=(p.type||'').toLowerCase();
  var badges=[];
  // Discount badge
  var isPromo=p.isOffer&&p.discount>0;
  if(isPromo){
    badges.push({ico:'\uD83C\uDFF7',text:p.discount+'% OFF',color:'var(--red)',bg:'rgba(192,57,43,.1)'});
  }
  badges.push({ico:'\u2713',text:'90 Dias Garantia',color:'var(--green)',bg:'rgba(45,90,39,.1)'});
  badges.push({ico:'\u2713',text:'Cable + funda gratis',color:'var(--green)',bg:'rgba(45,90,39,.1)'});
  badges.push({ico:'\u2713',text:'Dev. 7 dias',color:'var(--green)',bg:'rgba(45,90,39,.1)'});
  if(type==='celular')badges.splice(2,0,{ico:'\u2713',text:'IMEI Verificado',color:'var(--green)',bg:'rgba(45,90,39,.1)'});
  if(extraCond)badges.unshift({ico:'\uD83D\uDCF1',text:extraCond,color:'var(--green)',bg:'rgba(45,90,39,.1)'});
  el.innerHTML=badges.map(function(b){
    var c=b.color||'var(--green)';
    var bg=b.bg||'rgba(45,90,39,.1)';
    return '<div style="display:flex;align-items:center;gap:6px;background:'+bg+';padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;color:'+c+'">'+b.ico+' '+b.text+'</div>';
  }).join('');
}

function addToCartAcc(id,triggerEl){
  var a=getById(window.ACCS,id);if(!a)return;
  var existing=Cart.find(function(item){return item.id===id;});
  if(existing){existing.qty++;}else{Cart.push({id:id,qty:1});}
  saveCart();updCartBadge();
  if(triggerEl&&typeof svBtnSuccess==='function')svBtnSuccess(triggerEl);
  openCart();showToast('Agregado al carrito');
}
var _loadingBarEl=null;
function showLoadingBar(){
  if(!_loadingBarEl){
    _loadingBarEl=document.createElement('div');
    _loadingBarEl.id='loadingBar';
    _loadingBarEl.style.width='0%';
    document.body.appendChild(_loadingBarEl);
  }
  _loadingBarEl.style.width='0%';
  _loadingBarEl.style.display='block';
  requestAnimationFrame(function(){_loadingBarEl.style.width='60%';});
}
function hideLoadingBar(){
  if(_loadingBarEl){
    _loadingBarEl.style.width='100%';
    setTimeout(function(){_loadingBarEl.style.display='none';_loadingBarEl.style.width='0%';},300);
  }
}

function renderSkeletonGrid(gid,count){
  var grid=document.getElementById(gid);
  if(!grid)return;
  var html='';
  for(var i=0;i<count;i++){
    html+='<div class="skeleton skeleton-card" style="aspect-ratio:auto">'+
      '<div class="skeleton skeleton-img"></div>'+
      '<div class="skeleton skeleton-line" style="width:80%"></div>'+
      '<div class="skeleton skeleton-line-sm"></div>'+
      '<div class="skeleton skeleton-line" style="width:50%"></div>'+
      '<div class="skeleton skeleton-btn"></div>'+
      '</div>';
  }
  grid.innerHTML=html;
}

function loadProducts(){
  var useCache=!!window._productsLoaded;
  if(!useCache){
    renderSkeletonGrid('homeRail',4);
    renderSkeletonGrid('shopGrid',8);
    renderSkeletonGrid('ofertasGrid',4);
    renderSkeletonGrid('featuredGrid',4);
    showLoadingBar();
  }
  return cachedFetch(API_URL+'/api/products',null,60000).then(function(res){
    PRODUCTS=res.data||res;
    window._productsLoaded=true;
    if(useCache)return; // Skip re-renders for background cache refresh
    hideLoadingBar();
    if(window.checkPendingDetail)window.checkPendingDetail();
    renderHomeRail();
    renderOfferStrip();
    renderShopGrid();
    renderOfertasGrid();
    renderFeaturedGrid();
    if(document.getElementById('p-favoritos').classList.contains('act')){renderFavGrid();}
    if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){renderCheckoutSummary();}
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
  }).catch(function(e){hideLoadingBar();console.error('Error loading products:',e);if(typeof showErrorToast==='function')showErrorToast('Error','No se pudieron cargar los productos');});
}

function loadAccessories(){
  var useCache=!!window._accLoaded;
  if(!useCache)renderSkeletonGrid('accGrid',8);
  cachedFetch(API_URL+'/api/accessories',null,60000).then(function(res){
    window.ACCS=res.data||res;
    window._accLoaded=true;
    if(useCache)return;
    if(document.getElementById('accGrid'))renderAccGrid();
    if(document.getElementById('p-favoritos').classList.contains('act')){renderFavGrid();}
    if(document.getElementById('p-checkout')&&document.getElementById('p-checkout').classList.contains('act')){renderCheckoutSummary();}
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
  }).catch(function(e){console.error('Error loading accessories:',e);if(typeof showErrorToast==='function')showErrorToast('Error','No se pudieron cargar los accesorios');});
}

function loadDashboard(){
  if(!currentUser||currentUser.role!=='ADMIN')return;
  if(window._dashRefreshInterval)clearInterval(window._dashRefreshInterval);
  fetch(API_URL+'/api/admin/dashboard',{
    headers:{'X-User-Id':currentUser.id}
  }).then(function(r){
    if(!r.ok)throw new Error('Error '+r.status);
    return r.json();
  }).then(function(d){
    window._dashData=d;
    renderDashStats();
    renderDashRecentOrders(d);
    renderDashTopProducts(d);
    renderDashStockAlerts(d);
    renderDashPaymentBreakdown(d);
    renderDashCharts();
  }).catch(function(e){
    console.error('Dashboard error:',e);if(typeof showErrorToast==='function')showErrorToast('Error','No se pudo cargar el dashboard');
  });
  window._dashRefreshInterval=setInterval(function(){
    fetch(API_URL+'/api/admin/dashboard',{
      headers:{'X-User-Id':currentUser.id}
    }).then(function(r){return r.json();}).then(function(d){
      window._dashData=d;
      renderDashStats();
      renderDashRecentOrders(d);
      renderDashTopProducts(d);
      renderDashStockAlerts(d);
      renderDashPaymentBreakdown(d);
      renderDashCharts();
    }).catch(function(e){console.error('Dashboard refresh error:',e);});
  },300000);
}

function setDashView(view){
  window.dashView=view;
  var btnM=document.getElementById('dashTabMensual');
  var btnA=document.getElementById('dashTabAnual');
  var sel=document.getElementById('dashMonthSelect');
  if(!btnM||!btnA||!sel)return;
  
  if(view==='mensual'){
    btnM.style.background='var(--orange)';btnM.style.color='#fff';
    btnA.style.background='transparent';btnA.style.color='var(--gray)';
    sel.style.display='';
  }else{
    btnA.style.background='var(--orange)';btnA.style.color='#fff';
    btnM.style.background='transparent';btnM.style.color='var(--gray)';
    sel.style.display='none';
  }
  renderDashStats();
}

function updateDashMonth(month){
  window.dashMonth=parseInt(month);
  renderDashStats();
}

function renderDashStats(){
  if(!window._dashData)return;
  var d=window._dashData;
  var stats;
  var isMensual=window.dashView==='mensual';
  
  if(isMensual){
    stats=d.monthlyStats[window.dashMonth];
    var months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    document.getElementById('kpi-revenue-label').textContent='Ingresos ('+months[window.dashMonth]+')';
    document.getElementById('kpi-orders-label').textContent='Pedidos ('+months[window.dashMonth]+')';
    document.getElementById('kpi-ticket-label').textContent='Ticket Promedio ('+months[window.dashMonth]+')';
    document.getElementById('kpi-users-label').textContent='Nuevos Usuarios ('+months[window.dashMonth]+')';
    document.getElementById('kpi-profit-label').textContent='Ganancia ('+months[window.dashMonth]+')';
    
    // Show change indicators for mensual
    document.getElementById('kpi-revenue-change-container').style.display='';
    document.getElementById('kpi-orders-change-container').style.display='';
    document.getElementById('kpi-ticket-change-container').style.display='';
    document.getElementById('kpi-users-change-container').style.display='';
    
    // Calculate changes vs previous month
    var prevMonth=window.dashMonth>0?window.dashMonth-1:11;
    var prevStats=d.monthlyStats[prevMonth];
    var revChange=prevStats.revenue>0?Math.round(((stats.revenue-prevStats.revenue)/prevStats.revenue)*100):0;
    var ordChange=prevStats.orders>0?Math.round(((stats.orders-prevStats.orders)/prevStats.orders)*100):0;
    var tickChange=prevStats.avgTicket>0?Math.round(((stats.avgTicket-prevStats.avgTicket)/prevStats.avgTicket)*100):0;
    var usrChange=prevStats.newUsers>0?Math.round(((stats.newUsers-prevStats.newUsers)/prevStats.newUsers)*100):0;
    
    document.getElementById('kpi-revenue-change').textContent=(revChange>=0?'+':'')+revChange+'% vs mes ant.';
    document.getElementById('kpi-orders-change').textContent=(ordChange>=0?'+':'')+ordChange+'% vs mes ant.';
    document.getElementById('kpi-ticket-change').textContent=(tickChange>=0?'+':'')+tickChange+'% vs mes ant.';
    document.getElementById('kpi-users-change').textContent=(usrChange>=0?'+':'')+usrChange+'% vs mes ant.';
  }else{
    stats=d.annualStats;
    var year=new Date().getFullYear();
    document.getElementById('kpi-revenue-label').textContent='Ingresos Totales ('+year+')';
    document.getElementById('kpi-orders-label').textContent='Pedidos Totales ('+year+')';
    document.getElementById('kpi-ticket-label').textContent='Ticket Promedio ('+year+')';
    document.getElementById('kpi-users-label').textContent='Nuevos Usuarios ('+year+')';
    document.getElementById('kpi-profit-label').textContent='Ganancia Total ('+year+')';
    
    // Hide change indicators for anual
    document.getElementById('kpi-revenue-change-container').style.display='none';
    document.getElementById('kpi-orders-change-container').style.display='none';
    document.getElementById('kpi-ticket-change-container').style.display='none';
    document.getElementById('kpi-users-change-container').style.display='none';
  }
  
  // Update values
  document.getElementById('kpi-revenue').textContent=fmt(stats.revenue);
  document.getElementById('kpi-orders').textContent=stats.orders;
  document.getElementById('kpi-ticket').textContent=fmt(stats.avgTicket);
  document.getElementById('kpi-users').textContent=stats.newUsers;
  var profit=stats.profit||0;
  document.getElementById('kpi-profit').textContent=fmt(profit);
  var profitUsd=window.dolarRate>0?Math.round(profit/window.dolarRate):0;
  document.getElementById('kpi-profit-usd').textContent=profitUsd>0?('US$ '+profitUsd.toLocaleString('es-AR')):'US$ 0';
}

function renderDashRecentOrders(d){
  var statusColors={PENDING:'var(--orange)',PROCESSING:'var(--blue)',SHIPPED:'#8b5cf6',DELIVERED:'var(--green)',CANCELLED:'var(--red)'};
  var statusLabels={PENDING:'Pendiente',PROCESSING:'Procesando',SHIPPED:'Enviado',DELIVERED:'Entregado',CANCELLED:'Cancelado'};
  var ordersTbody=document.getElementById('dashboard-recent-orders');
  if(ordersTbody){
    if(!d.recentOrders.length){
      ordersTbody.innerHTML='<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--gray)">No hay pedidos</td></tr>';
    }else{
       ordersTbody.innerHTML=d.recentOrders.map(function(o){
        var sc=statusColors[o.status]||'var(--gray)';
        var sl=statusLabels[o.status]||o.status;
        var profit=o.profit||0;
        var methodColor='var(--gray)';
        if(o.payment==='Efectivo')methodColor='var(--green)';
        else if(o.payment==='Transferencia')methodColor='var(--orange)';
        else if(o.payment==='wallet')methodColor='#8b5cf6';
        return'<tr style="border-bottom:1px solid var(--border)">'+
          '<td style="padding:10px 14px;font-size:12px;font-weight:600">'+o.id+'</td>'+
          '<td style="padding:10px 14px;font-size:12px">'+escapeHtml(o.client||'')+'</td>'+
          '<td style="padding:10px 14px;font-size:12px;font-weight:600">'+fmt(o.total)+'</td>'+
          '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:var(--green)">'+fmt(profit)+'</td>'+
          '<td style="padding:10px 14px"><span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px;background:'+methodColor+'15;color:'+methodColor+'">'+escapeHtml(o.payment||'—')+'</span></td>'+
          '<td style="padding:10px 14px"><span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px;background:'+sc+';color:#fff">'+sl+'</span></td>'+
        '</tr>';
      }).join('');
    }
  }
}

function renderDashTopProducts(d){
  var topUl=document.getElementById('dashboard-top-products');
  if(topUl){
    if(!d.topProducts.length){
      topUl.innerHTML='<li style="padding:16px;text-align:center;color:var(--gray)">Sin datos</li>';
    }else{
      topUl.innerHTML=d.topProducts.map(function(p,i){
        var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(p.ico||'\uD83D\uDCF1')+'</span>';
        return'<li style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;transition:background .15s" onmouseover="this.style.background=\'var(--cream2)\'" onmouseout="this.style.background=\'transparent\'">'+
          '<div style="width:44px;height:44px;border-radius:8px;background:var(--cream2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">'+imgHtml+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<h4 style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</h4>'+
            '<p style="font-size:11px;color:var(--gray)">'+(p.sub||p.brand||'')+'</p>'+
          '</div>'+
          '<div style="text-align:right">'+
            '<div style="font-size:14px;font-weight:700">'+p.sold+'</div>'+
            '<div style="font-size:10px;color:var(--gray)">uds.</div>'+
          '</div>'+
        '</li>';
      }).join('');
    }
  }
}

function renderDashPaymentBreakdown(d){
  var box=document.getElementById('dashboard-payment-breakdown');
  if(!box)return;
  var data=d.paymentBreakdown||[];
  if(!data.length){
    box.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--gray);font-size:13px">Sin datos de pagos este año</div>';
    return;
  }
  var maxRev=Math.max.apply(null,data.map(function(x){return x.revenue||0;}).concat([1]));
  var colors={'Efectivo':'var(--green)','Transferencia':'var(--orange)','wallet':'#8b5cf6','Mercado Pago':'#009ee3','Sin especificar':'var(--gray)'};
  box.innerHTML=data.map(function(x){
    var color=colors[x.method]||'var(--orange)';
    var pct=Math.round(((x.revenue||0)/maxRev)*100);
    var usd=window.dolarRate>0?Math.round((x.revenue||0)/window.dolarRate):0;
    return '<div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:12px;font-weight:600;color:var(--dk)">'+escapeHtml(x.method)+'</span>'+
          '<span style="font-size:10px;color:var(--gray);background:var(--cream2);padding:2px 8px;border-radius:10px">'+x.count+' ventas</span>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:13px;font-weight:800;color:'+color+'">'+fmt(x.revenue||0)+'</div>'+
          '<div style="font-size:10px;color:var(--green)">Ganancia: '+fmt(x.profit||0)+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="height:8px;background:var(--cream2);border-radius:6px;overflow:hidden">'+
        '<div style="height:100%;border-radius:6px;background:'+color+';width:'+pct+'%"></div>'+
      '</div>'+
      (usd>0?'<div style="font-size:10px;color:var(--orange);margin-top:3px">US$ '+usd.toLocaleString('es-AR')+'</div>':'')+
    '</div>';
  }).join('');
}

function renderDashStockAlerts(d){
  var stockUl=document.getElementById('dashboard-stock-alerts');
  if(stockUl){
    if(!d.lowStock.length){
      stockUl.innerHTML='<li style="padding:16px;text-align:center;color:var(--green)">Todo el stock OK \u2705</li>';
    }else{
      stockUl.innerHTML=d.lowStock.map(function(p){
        var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+(p.ico||'\uD83D\uDCF1')+'</span>';
        return'<li style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;transition:background .15s" onmouseover="this.style.background=\'rgba(239,68,68,.05)\'" onmouseout="this.style.background=\'transparent\'">'+
          '<div style="width:40px;height:40px;border-radius:8px;background:var(--cream2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">'+imgHtml+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<h4 style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.name+'</h4>'+
            '<p style="font-size:11px;color:var(--gray)">'+(p.brand||'')+' <span style="color:var(--orange)">['+p.type+']</span></p>'+
          '</div>'+
          '<div style="text-align:right">'+
            '<div style="font-size:16px;font-weight:800;color:'+((p.stock===0)?'var(--red)':'var(--orange)')+'">'+p.stock+'</div>'+
            '<div style="font-size:10px;color:var(--gray)">stock</div>'+
          '</div>'+
        '</li>';
      }).join('');
    }
  }
}

function renderDashCharts(){
  if(!window._dashData||!window.Chart)return;
  var d=window._dashData;
  
  // Revenue chart
  var revenueCanvas=document.getElementById('revenueChart');
  if(revenueCanvas&&window._revenueChart)window._revenueChart.destroy();
  if(revenueCanvas){
    var months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var revenueData=d.monthlyStats?d.monthlyStats.map(function(s){return s.revenue;}):[];
    window._revenueChart=new window.Chart(revenueCanvas,{
      type:'bar',
      data:{
        labels:months,
        datasets:[{
          label:'Ingresos',
          data:revenueData,
          backgroundColor:'rgba(255,107,44,0.7)',
          borderColor:'rgba(255,107,44,1)',
          borderWidth:1,
          borderRadius:6,
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true,ticks:{callback:function(v){return'$'+(v/1000)+'k';}},grid:{color:'rgba(0,0,0,0.05)'}},
          x:{grid:{display:false}}
        }
      }
    });
  }
  
  // Status chart
  var statusCanvas=document.getElementById('statusChart');
  if(statusCanvas&&window._statusChart)window._statusChart.destroy();
  if(statusCanvas&&d.orderStatuses){
    var statusLabels={'PENDING':'Pendiente','PROCESSING':'En proceso','SHIPPED':'Enviado','DELIVERED':'Entregado','CANCELLED':'Cancelado'};
    var statusColors={'PENDING':'#f59e0b','PROCESSING':'#3b82f6','SHIPPED':'#8b5cf6','DELIVERED':'#22c55e','CANCELLED':'#ef4444'};
    var statusData=d.orderStatuses||[];
    window._statusChart=new window.Chart(statusCanvas,{
      type:'doughnut',
      data:{
        labels:statusData.map(function(s){return statusLabels[s.status]||s.status;}),
        datasets:[{
          data:statusData.map(function(s){return s.count;}),
          backgroundColor:statusData.map(function(s){return statusColors[s.status]||'#94a3b8';}),
          borderWidth:0,
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{position:'bottom',labels:{padding:12,usePointStyle:true,pointStyle:'circle',font:{size:11}}}
        }
      }
    });
  }
  
  // Brand chart
  var brandCanvas=document.getElementById('brandChart');
  if(brandCanvas&&window._brandChart)window._brandChart.destroy();
  if(brandCanvas&&d.brandSales){
    var brandColors={'Apple':'#555','Samsung':'#1428a0','Motorola':'#0068ff','Xiaomi':'#ff6900','iPad':'#888','MacBook':'#666'};
    window._brandChart=new window.Chart(brandCanvas,{
      type:'bar',
      data:{
        labels:d.brandSales.map(function(b){return b.brand;}),
        datasets:[{
          label:'Ventas',
          data:d.brandSales.map(function(b){return b.count;}),
          backgroundColor:d.brandSales.map(function(b){return brandColors[b.brand]||'#94a3b8';}),
          borderRadius:6,
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        indexAxis:'y',
        plugins:{legend:{display:false}},
        scales:{
          x:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}},
          y:{grid:{display:false}}
        }
      }
    });
  }
}

function renderGrid(gid,prods){
  var grid=document.getElementById(gid);
  if(!grid)return;
  var firstRender=!grid.dataset.svRevealed;
  if(firstRender)grid.classList.add('pgrid-reveal');else grid.classList.remove('pgrid-reveal');
  if(!prods.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem">'+
      '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom:1rem;opacity:.3"><circle cx="28" cy="28" r="16" stroke="currentColor" stroke-width="2"/><path d="M40 40l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 28h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'+
      '<p style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:700;color:var(--dk);margin-bottom:.5rem">No encontramos resultados</p>'+
      '<p style="font-size:13px;color:var(--gray);margin-bottom:1rem">Intenta con otro termino de busqueda o explora nuestras categorias.</p>'+
      '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:1rem">'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:8px 16px;color:var(--dk);border-color:var(--border)" onclick="navShop(\'iPhone\')">iPhone</button>'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:8px 16px;color:var(--dk);border-color:var(--border)" onclick="navShop(\'Samsung\')">Samsung</button>'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:8px 16px;color:var(--dk);border-color:var(--border)" onclick="nav(\'accesorios\')">Accesorios</button>'+
        '<button class="btn btn-ghost" style="font-size:12px;padding:8px 16px;color:var(--dk);border-color:var(--border)" onclick="navShop(\'ofertas\')">Ofertas</button>'+
      '</div>'+
      '<button class="btn btn-o" style="font-size:13px;padding:10px 24px" onclick="nav(\'shop\')">Ver todo el catalogo</button>'+
      '</div>';
    return;
  }
  var now=new Date();
  grid.innerHTML=prods.map(function(p){
    if(p.isGroup){
      var isOutOfStock=p.stock===0;
      var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'"><span style="font-size:72px;display:none;align-items:center;justify-content:center;width:100%;height:100%">'+(p.ico||'\u{1F4F1}')+'</span>':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+p.ico+'</span>';
      var badge=isOutOfStock?'<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>':(p.discount>0?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">Hasta -'+p.discount+'% OFF</div>':(p.condition==='Nuevo'?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">\u{1F525} Nuevo</div>':''));
      var isFav=isFavorite(p.id);
      return '<article class="pcard pcard-group" onclick="openDetail(\''+p.id+'\')" style="cursor:pointer">'+
        '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
        badge+
        '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')">'+(isFav?'\u2665':'\u2661')+'</button>'+
        imgHtml+
        '<div style="position:absolute;bottom:16px;right:16px;background:var(--orange);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;z-index:2;box-shadow:0 2px 8px rgba(255,107,44,.4)">'+p.variantCount+' var.</div>'+
        '</div>'+
        '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
        '<div>'+
        '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:4px">'+p.name+'</h3>'+
        '<p class="pcard-sub" style="font-size:12px;color:var(--gray);margin-bottom:4px">'+p.brand+'</p>'+
        '</div>'+
        '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
        '<div class="pcard-price" style="font-size:22px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">Desde '+fmt(p.price)+(p.discount>0?' <span style="background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;vertical-align:middle">-'+p.discount+'%</span>':'')+'</div>'+
        '<div style="font-size:12px;color:var(--gray);font-weight:500">'+p.sub+'</div>'+
        '</div>'+
        '<button class="pcard-add" onclick="event.stopPropagation();openDetail(\''+p.id+'\')" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">Ver variantes</button>'+
        '</div>'+
        '</article>';
    }
    var isPromoActive=p.isOffer&&p.discount>0;
    var finalPrice=isPromoActive?Math.round(p.price-p.price*p.discount/100):p.price;
    var cuota=Math.round(finalPrice/12);
    var isOutOfStock=p.stock===0;
    var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'"><span style="font-size:72px;display:none;align-items:center;justify-content:center;width:100%;height:100%">'+(p.ico||'\u{1F4F1}')+'</span>':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+p.ico+'</span>';
    var badge=isOutOfStock?'<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>':(isPromoActive?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">-'+p.discount+'% OFF</div>':(p.condition==='Nuevo'?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">\u{1F525} Nuevo</div>':(p.condition&&p.condition!=='Nuevo'?'<div style="position:absolute;top:16px;left:16px;background:rgba(0,0,0,.8);color:#fff;font-size:10px;font-weight:600;padding:5px 12px;border-radius:16px;z-index:2">'+p.condition+'</div>':'')));
    var isFav=isFavorite(p.id);
    return '<article class="pcard'+(isOutOfStock?' pcard-out-of-stock':'')+'"'+(isOutOfStock?'':' onclick="openDetail(\''+p.id+'\')"')+' style="cursor:'+((isOutOfStock?'default':'pointer'))+'">'+
      '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
      badge+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')">'+(isFav?'\u2665':'\u2661')+'</button>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+p.name+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+p.sub+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      (isPromoActive?'<div style="display:flex;align-items:center;gap:8px"><span class="pcard-old" style="font-size:13px;color:var(--gray);text-decoration:line-through">'+fmt(p.price)+'</span><span style="background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;flex-shrink:0">-'+p.discount+'%</span></div>':'')+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
      '<div class="pcard-cuota" style="font-size:13px;color:var(--green);font-weight:600">\u{1F4B3} 12x '+fmt(cuota)+' sin inter\u00E9s</div>'+
      (p.stock<=5&&p.stock>0?'<div class="pcard-stock" style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--red);background:rgba(239,68,68,.1);padding:8px 12px;border-radius:10px;font-weight:600">\u{1F525} Solo '+p.stock+' disponibles</div>':'')+
      '</div>'+
      (isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+p.id+'\',this)" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">\u{1F6D2} Agregar al carrito</button>')+
      '</div>'+
      '</article>';
  }).join('');
}
function renderHomeRail(){
  var rail=document.getElementById('homeRail');
  if(!rail)return;
  var sorted=PRODUCTS.slice().sort(function(a,b){
    var stockA=a.stock>0?0:1;
    var stockB=b.stock>0?0:1;
    if(stockA!==stockB)return stockA-stockB;
    return new Date(b.createdAt||0)-new Date(a.createdAt||0);
  });
  var items=sorted.slice(0,8);
  var now=new Date();
  rail.innerHTML=items.map(function(p){
    var isPromoActive=p.isOffer&&p.discount>0;
    var finalPrice=isPromoActive?Math.round(p.price-p.price*p.discount/100):p.price;
    var isOutOfStock=p.stock===0;
    var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'"><span style="font-size:72px;display:none;align-items:center;justify-content:center;width:100%;height:100%">'+(p.ico||'\u{1F4F1}')+'</span>':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+p.ico+'</span>';
    var badge;
    if(isOutOfStock){
      badge='<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>';
    }else if(isPromoActive){
      badge='<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">-'+p.discount+'% OFF</div>';
    }else if(p.condition==='Nuevo'){
      badge='<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">'+'\uD83D\uDD25 Nuevo</div>';
    }else if(p.condition&&p.condition!=='Nuevo'){
      badge='<div style="position:absolute;top:16px;left:16px;background:rgba(0,0,0,.8);color:#fff;font-size:10px;font-weight:600;padding:5px 12px;border-radius:16px;z-index:2">'+p.condition+'</div>';
    }else{
      badge='';
    }
    var isFav=isFavorite(p.id);
    var cardClass='pcard'+(isOutOfStock?' pcard-out-of-stock':'');
    var cardStyle='cursor:'+(isOutOfStock?'default':'pointer');
    var imgWrapStyle='position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'');
    var bodyStyle='padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'');
    var favBg=isFav?'background:#fff0ec;color:var(--orange)':'';
    var favIcon=isFav?'\u2665':'\u2661';
    var priceHtml=isPromoActive?'<span style="font-size:13px;color:var(--gray);text-decoration:line-through">'+fmt(p.price)+'</span>':'';
    var discBadge=isPromoActive?'<span style="background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;flex-shrink:0">-'+p.discount+'%</span>':'';
    var actionHtml=isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+p.id+'\',this)" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">'+'\uD83D\uDED2 Agregar al carrito</button>';
    var onclick=isOutOfStock?'':' onclick="openDetail(\''+p.id+'\')"';
    return '<article class="'+cardClass+'"'+onclick+' style="'+cardStyle+'">'+
      '<div style="'+imgWrapStyle+'">'+
      badge+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')">'+favIcon+'</button>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="'+bodyStyle+'">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+(p.name||p.brand)+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+(p.sub||p.brand||'')+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      (priceHtml?'<div style="display:flex;align-items:center;gap:8px">'+priceHtml+discBadge+'</div>':'')+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
      '</div>'+
      actionHtml+
      '</div>'+
      '</article>';
  }).join('');
}
function renderOfferStrip(){
  var strip=document.getElementById('offerStrip');
  if(!strip)return;
  var now=new Date();
  var offers=PRODUCTS.filter(function(p){
    return p.isOffer&&p.discount>0;
  });
  if(!offers.length){strip.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:rgba(255,255,255,.4);font-size:12px">No hay ofertas activas por ahora</div>';return;}
  strip.innerHTML=offers.map(function(p){
    var fp=Math.round(p.price*(1-p.discount/100));
    var cuota=Math.round(fp/12);
    var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s"><span style="font-size:72px;display:none;align-items:center;justify-content:center;width:100%;height:100%">'+(p.ico||'\u{1F4F1}')+'</span>':'<span style="font-size:72px">'+p.ico+'</span>';
    var isFav=favorites.indexOf(p.id)!==-1;
    return '<article class="pcard" onclick="openDetail(\''+p.id+'\')" style="cursor:pointer">'+
      '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)">'+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+p.id+'\')">'+(isFav?'\u2665':'\u2661')+'</button>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="padding:0 20px 20px">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+p.name+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+p.sub+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      '<div style="display:flex;align-items:center;gap:8px"><span class="pcard-old" style="font-size:13px;color:var(--gray);text-decoration:line-through">'+fmt(p.price)+'</span><span style="background:var(--red);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;flex-shrink:0">-'+p.discount+'%</span></div>'+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(fp)+'</div>'+
      '<div class="pcard-cuota" style="font-size:13px;color:var(--green);font-weight:600">💳 12x '+fmt(cuota)+' sin interés</div>'+
      '</div>'+
      '<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+p.id+'\',this)" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">🛒 Agregar al carrito</button>'+
      '</div>'+
      '</article>';
  }).join('');
  if(!strip.dataset.svRevealed){strip.classList.add('pgrid-reveal');strip.dataset.svRevealed='1';}else{strip.classList.remove('pgrid-reveal');}
}
function renderShopGrid(){
  var grid=document.getElementById('shopGrid');
  var count=document.getElementById('shopCount');
  if(!grid)return;
  var prods=PRODUCTS.slice();
  if(!window.shopFilter)window.shopFilter='todos';
  if(window.shopFilter!=='todos')prods=prods.filter(function(p){return p.brand&&p.brand.toLowerCase()===window.shopFilter.toLowerCase();});
  if(window.shopFilter==='fav'){
    prods=prods.filter(function(p){return favorites.indexOf(p.id)!==-1;});
  }
  if(filterState.conditions.length>0){
    prods=prods.filter(function(p){return filterState.conditions.indexOf(p.condition)!==-1;});
  }
  if(filterState.storage.length>0){
    prods=prods.filter(function(p){return filterState.storage.some(function(s){return (p.storage&&p.storage.indexOf(s)!==-1)||(p.sub&&p.sub.indexOf(s)!==-1);});});
  }
  if(filterState.ram.length>0){
    prods=prods.filter(function(p){return p.ram&&filterState.ram.indexOf(p.ram)!==-1;});
  }
  if(filterState.batteryMin>0){
    prods=prods.filter(function(p){return p.battery&&p.battery>=filterState.batteryMin;});
  }
  if(filterState.priceMin){
    prods=prods.filter(function(p){return p.price>=filterState.priceMin;});
  }
  if(filterState.priceMax){
    prods=prods.filter(function(p){return p.price<=filterState.priceMax;});
  }
  if(filterState.hideNoStock){
    prods=prods.filter(function(p){return p.stock>0;});
  }
  // Group by modelGroup
  var groups={};
  var standalone=[];
  prods.forEach(function(p){
    if(p.modelGroup){
      if(!groups[p.modelGroup])groups[p.modelGroup]=[];
      groups[p.modelGroup].push(p);
    }else{
      standalone.push(p);
    }
  });
  var displayList=[];
  Object.keys(groups).forEach(function(key){
    var variants=groups[key];
    if(variants.length<=1){
      displayList.push(variants[0]);
      return;
    }
    variants.sort(function(a,b){return a.price-b.price;});
    var cheapest=variants[0];
    var inStock=variants.some(function(v){return v.stock>0;});
    var newestDate=variants.reduce(function(max,v){
      var d=new Date(v.createdAt||0);
      return d>max?d:max;
    },new Date(0));
    var maxDiscount=variants.reduce(function(max,v){return Math.max(max,v.discount||0);},0);
    var maxBattery=variants.reduce(function(max,v){return Math.max(max,v.battery||0);},0);
    displayList.push({
      id:cheapest.id,
      isGroup:true,
      modelGroup:key,
      brand:cheapest.brand,
      name:key,
      sub:variants.length+' '+(variants.length===1?'variante':'variantes'),
      price:cheapest.price,
      imageUrl:cheapest.imageUrl,
      ico:cheapest.ico,
      stock:inStock?variants.reduce(function(s,v){return s+v.stock;},0):0,
      createdAt:newestDate.toISOString(),
      discount:maxDiscount,
      battery:maxBattery,
      condition:cheapest.condition,
      variantCount:variants.length
    });
  });
  displayList=displayList.concat(standalone);
  // Sort display list
  if(currentSort==='asc'){
    displayList.sort(function(a,b){return a.price-b.price;});
  }else if(currentSort==='desc'){
    displayList.sort(function(a,b){return b.price-a.price;});
  }else if(currentSort==='new'){
    displayList.sort(function(a,b){return new Date(b.createdAt||0)-new Date(a.createdAt||0);});
  }else if(currentSort==='disc'){
    displayList.sort(function(a,b){return (b.discount||0)-(a.discount||0);});
  }else if(currentSort==='bat'){
    displayList.sort(function(a,b){return (b.battery||0)-(a.battery||0);});
  }else{
    displayList.sort(function(a,b){
      var stockA=a.stock>0?0:1;
      var stockB=b.stock>0?0:1;
      if(stockA!==stockB)return stockA-stockB;
      return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    });
  }
  if(count)count.textContent=displayList.length+' productos';
  renderGrid('shopGrid',displayList);
  var sg=document.getElementById('shopGrid');if(sg)sg.dataset.svRevealed='1';
}
function renderOfertasGrid(){
  var grid=document.getElementById('ofertasGrid');
  if(!grid)return;
  var offers=PRODUCTS.filter(function(p){return p.isOffer;});
  var accOffers=(window.ACCS||[]).filter(function(a){return a.isOffer;});
  var allOffers=offers.concat(accOffers);
  renderGrid('ofertasGrid',allOffers);
  var og=document.getElementById('ofertasGrid');if(og)og.dataset.svRevealed='1';
}
function renderRepairGrid(){
  var grid=document.getElementById('repairGrid');
  if(!grid)return;
  grid.innerHTML=REPAIRS.map(function(r){
    return '<div class="repair-card"><div class="rc-ico">'+r.ico+'</div><div class="rc-t">'+r.name+'</div><div class="rc-d">'+r.range+'</div></div>';
  }).join('');
}
function renderAccGrid(){
  var grid=document.getElementById('accGrid');
  if(!grid)return;
  var accs=(window.ACCS||[]).slice();
  if(!window.accFilter)window.accFilter='todos';
  if(window.accFilter!=='todos')accs=accs.filter(function(a){return a.category===window.accFilter;});
  if(currentAccSort==='asc'){
    accs.sort(function(a,b){return a.price-b.price;});
  }else if(currentAccSort==='desc'){
    accs.sort(function(a,b){return b.price-a.price;});
  }else if(currentAccSort==='new'){
    accs.sort(function(a,b){return new Date(b.createdAt||0)-new Date(a.createdAt||0);});
  }else{
    accs.sort(function(a,b){
      var stockA=a.stock>0?0:1;
      var stockB=b.stock>0?0:1;
      if(stockA!==stockB)return stockA-stockB;
      return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    });
  }
  grid.innerHTML=accs.map(function(a){
    var now=new Date();
    var isPromoActive=a.isOffer&&a.discount>0;
    var finalPrice=isPromoActive?Math.round(a.price-a.price*a.discount/100):a.price;
    var isOutOfStock=a.stock===0;
    var imgHtml=a.imageUrl?'<img loading="lazy" src="'+a.imageUrl+'" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="object-fit:cover;width:100%;height:100%;transition:transform .5s'+(isOutOfStock?';filter:grayscale(100%) opacity(.6)':'')+'"><span style="font-size:72px;display:none;align-items:center;justify-content:center;width:100%;height:100%">'+(a.ico||'\u{1F4E6}')+'</span>':'<span style="font-size:72px'+(isOutOfStock?';filter:grayscale(100%) opacity(.5)':'')+'">'+(a.ico||'\u{1F4E6}')+'</span>';
    var badge=isOutOfStock?'<div style="position:absolute;top:16px;left:16px;background:rgba(100,100,100,.85);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2">Agotado</div>':(isPromoActive?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--red) 0%,#cc0000 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,0,0,.4)">-'+a.discount+'% OFF</div>':(a.category?'<div style="position:absolute;top:16px;left:16px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;z-index:2;box-shadow:0 4px 12px rgba(255,107,44,.4)">'+a.category+'</div>':''));
    var isFav=isFavorite(a.id);
    return '<article class="pcard'+(isOutOfStock?' pcard-out-of-stock':'')+'"'+(isOutOfStock?'':' onclick="openAccDetail(\''+a.id+'\')"')+' style="cursor:'+((isOutOfStock?'default':'pointer'))+'">'+
      '<div style="position:relative;aspect-ratio:1/1;background:linear-gradient(180deg,var(--cream) 0%,#fff 100%);overflow:hidden;margin:20px;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,.05)'+(isOutOfStock?';opacity:.6':'')+'">'+
      badge+
      '<button class="pcard-fav '+(isFav?'on':'')+'" onclick="event.stopPropagation();toggleFavFromCard(\''+a.id+'\')">'+(isFav?'\u2665':'\u2661')+'</button>'+
      imgHtml+
      '</div>'+
      '<div class="pcard-body" style="padding:0 20px 20px'+(isOutOfStock?';opacity:.6':'')+'">'+
      '<div>'+
      '<h3 class="pcard-name" style="font-size:16px;font-weight:700;color:var(--dk);line-height:1.3;margin-bottom:6px">'+(a.name||a.brand)+'</h3>'+
      '<p class="pcard-sub" style="font-size:13px;color:var(--gray);margin-bottom:8px">'+(a.brand||a.description||'')+'</p>'+
      '</div>'+
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px">'+
      (isPromoActive?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:600;color:var(--gray);text-decoration:line-through">'+fmt(a.price)+'</span><span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;background:var(--red);color:#fff">-'+a.discount+'%</span></div>':'')+
      '<div class="pcard-price" style="font-size:28px;font-weight:800;color:var(--orange);font-family:\'Playfair Display\',Georgia,serif">'+fmt(finalPrice)+'</div>'+
      '</div>'+
      (isOutOfStock?'<div style="width:100%;background:var(--gray);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;text-align:center;margin-top:16px;cursor:default">Agotado</div>':'<button class="pcard-add" onclick="event.stopPropagation();addToCart(\''+a.id+'\',this)" style="width:100%;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;padding:14px;border-radius:12px;border:none;cursor:pointer;margin-top:16px;transition:all .25s;box-shadow:0 6px 20px rgba(255,107,44,.4)">🛒 Agregar al carrito</button>')+
      '</div>'+
      '</article>';
  }).join('');
  if(!grid.dataset.svRevealed){grid.classList.add('pgrid-reveal');grid.dataset.svRevealed='1';}else{grid.classList.remove('pgrid-reveal');}
}
function openAccDetail(id){
  detailBackTarget='accesorios';
  currentAcc=getById(window.ACCS,id);if(!currentAcc)return;
  var now=new Date();
  var isPromoActive=currentAcc.isOffer&&currentAcc.discount>0;
  var finalPrice=isPromoActive?Math.round(currentAcc.price*(1-currentAcc.discount/100)):currentAcc.price;
  var cuota12=Math.round(finalPrice/12);

  var brandEl=document.getElementById('detBrand');if(brandEl)brandEl.textContent=currentAcc.brand||'Accesorio';
  var typeEl=document.getElementById('detType');if(typeEl)typeEl.textContent=currentAcc.category||'';
  var name2El=document.getElementById('detName2');if(name2El)name2El.textContent=currentAcc.name;
  var nameEl=document.getElementById('detName');if(nameEl)nameEl.textContent=currentAcc.name;
  var priceEl=document.getElementById('detPrice');if(priceEl)priceEl.textContent=fmt(finalPrice);
  var totalEl=document.getElementById('detTotal');if(totalEl)totalEl.textContent=fmt(finalPrice);
  var oldEl=document.getElementById('detOld');
  if(isPromoActive&&currentAcc.discount){if(oldEl){oldEl.textContent=fmt(currentAcc.price);oldEl.style.display='inline';}}
  else{if(oldEl)oldEl.style.display='none';}
  var cuotaInfo=document.getElementById('detCuotaInfo');var cuotaText=document.getElementById('detCuotaText');
  if(cuotaText)cuotaText.textContent='12x '+fmt(cuota12)+' sin interes';if(cuotaInfo)cuotaInfo.style.display='inline-block';
  var descEl=document.getElementById('detDesc');
  if(descEl){var descParts=[];if(currentAcc.brand)descParts.push(currentAcc.brand);if(currentAcc.description)descParts.push(currentAcc.description);if(descParts.length){descEl.textContent=descParts.join(' \u2014 ');descEl.style.display='block';}else{descEl.style.display='none';}}

  var accSpecs=[];
  if(currentAcc.compatibleModels)accSpecs.push({ico:'\u{1F4F1}',label:'Compatible con',val:currentAcc.compatibleModels});
  if(currentAcc.color)accSpecs.push({ico:'\u{1F3A8}',label:'Color',val:currentAcc.color});
  if(currentAcc.stock!==undefined){var stockColor=currentAcc.stock>5?'var(--green)':currentAcc.stock>0?'var(--orange)':'var(--red)';accSpecs.push({ico:'\u{1F4E6}',label:'Stock',val:currentAcc.stock>0?currentAcc.stock+' disponibles':'Agotado',color:stockColor});}
  renderSpecsGrid(accSpecs);
  var badgesEl=document.getElementById('detBadges');
  if(badgesEl)badgesEl.innerHTML='<div style="display:flex;align-items:center;gap:6px;background:rgba(45,90,39,.1);padding:8px 12px;border-radius:8px;font-size:11px;font-weight:600;color:var(--green)">\u2713 Garantia incluida</div>';

  var addCartBtn=document.getElementById('detAddCart');var buyNowBtn=document.getElementById('detBuyNow');
  if(addCartBtn){addCartBtn.style.display='';addCartBtn.onclick=function(){addToCartAcc(currentAcc.id,addCartBtn);};}
  if(buyNowBtn){buyNowBtn.style.display='';buyNowBtn.onclick=function(){if(typeof svBtnSuccess==='function')svBtnSuccess(buyNowBtn);addToCartAcc(currentAcc.id);setTimeout(function(){nav('checkout');},400);};}

  _accImages=[];
  if(currentAcc.imageUrl)_accImages.push(currentAcc.imageUrl);
  if(currentAcc.images&&currentAcc.images.length)_accImages=_accImages.concat(currentAcc.images);
  var mainImg=document.getElementById('detImgMain');var thumbsContainer=document.getElementById('detThumbnails');
  if(mainImg){var ico=currentAcc.ico||'\u{1F4E6}';
    if(_accImages.length){
      var accImgUrl=_accImages[0];
      mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFavorite(currentAcc.id)?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFavorite(currentAcc.id)?'\u2665':'\u2661')+'</button>'+
        '<div style="position:relative;width:100%;height:100%;overflow:hidden;cursor:zoom-in" onclick="openLightbox(\''+accImgUrl+'\')" onmousemove="handleImageZoom(event,this)" onmouseleave="resetImageZoom(this)">'+
          '<img loading="lazy" src="'+accImgUrl+'" style="width:100%;height:100%;object-fit:contain;transition:transform .2s ease;pointer-events:none" id="detZoomImg">'+
          '<div style="position:absolute;bottom:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.1)">'+
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dk)" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'+
          '</div>'+
        '</div>';
    }
    else{mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFavorite(currentAcc.id)?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFavorite(currentAcc.id)?'\u2665':'\u2661')+'</button><span style="font-size:80px">'+ico+'</span>';}
  }
  if(thumbsContainer){
    if(_accImages.length>1){thumbsContainer.style.display='grid';thumbsContainer.innerHTML=_accImages.map(function(src,i){return '<div onclick="switchAccMainImg('+i+')" style="aspect-ratio:1/1;border-radius:10px;overflow:hidden;border:2px solid '+(i===0?'var(--orange)':'var(--border)')+';cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fff"><img loading="lazy" src="'+src+'" style="width:100%;height:100%;object-fit:contain"></div>';}).join('');}
    else{thumbsContainer.style.display='none';}
  }
  detWMult=0;detDExtra=0;selCuotas=1;resetDetailSelections();updDetTotal();nav('detail');
  var fb=document.getElementById('detFavBtn');
  if(fb){if(isFavorite(currentAcc.id)){fb.innerHTML='\u2665';fb.classList.add('saved');}else{fb.innerHTML='\u2661';fb.classList.remove('saved');}}
}
function switchAccMainImg(idx){
  if(!_accImages||!_accImages[idx])return;
  var mainImg=document.getElementById('detImgMain');var thumbsContainer=document.getElementById('detThumbnails');
  var accImgUrl=_accImages[idx];
  if(mainImg)mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFavorite(currentAcc.id)?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFavorite(currentAcc.id)?'\u2665':'\u2661')+'</button>'+
    '<div style="position:relative;width:100%;height:100%;overflow:hidden;cursor:zoom-in" onclick="openLightbox(\''+accImgUrl+'\')" onmousemove="handleImageZoom(event,this)" onmouseleave="resetImageZoom(this)">'+
      '<img loading="lazy" src="'+accImgUrl+'" style="width:100%;height:100%;object-fit:contain;transition:transform .2s ease;pointer-events:none" id="detZoomImg">'+
      '<div style="position:absolute;bottom:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.1)">'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dk)" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'+
      '</div>'+
    '</div>';
  if(thumbsContainer){var thumbs=thumbsContainer.children;for(var i=0;i<thumbs.length;i++){thumbs[i].style.borderColor=i===idx?'var(--orange)':'var(--border)';}}
}
function openDetail(id, variantId){
  var activePage=document.querySelector('.page.act');
  if(activePage){var pid=activePage.id.replace('p-','');if(pid&&pid!=='detail')detailBackTarget=pid;}
  currentProd=getById(PRODUCTS,id);if(!currentProd)return;
  window._detailVariants=[];
  window._selectedVariantIdx=-1;
  window._selectedVariant=null;
  window._variantsLoaded=false;
  window._colorCircleState={selectedColor:null,selectedStorage:null};
  // Collect all product IDs sharing the same modelGroup
  var variantProdIds=[id];
  if(currentProd.modelGroup){
    variantProdIds=[];
    for(var gi=0;gi<PRODUCTS.length;gi++){
      if(PRODUCTS[gi].modelGroup===currentProd.modelGroup)
        variantProdIds.push(PRODUCTS[gi].id);
    }
  }
  var cacheKey=currentProd.modelGroup||id;
  if(!window._variantCache)window._variantCache={};
  if(window._variantCache[cacheKey]&&window._variantCache[cacheKey].length>0){
    window._detailVariants=window._variantCache[cacheKey].filter(function(v){return v.status!=='SOLD';});
    window._variantsLoaded=true;
    renderDetailVariants();
    var isPromoActive=currentProd.isOffer&&currentProd.discount>0;
    // For variant products, use the minimum variant targetPrice
    var basePrice=currentProd.price;
    if(window._detailVariants.length>0){
      var minTarget=Infinity;
      for(var mi=0;mi<window._detailVariants.length;mi++){
        if(window._detailVariants[mi].targetPrice&&window._detailVariants[mi].targetPrice<minTarget){
          minTarget=window._detailVariants[mi].targetPrice;
        }
      }
      if(minTarget<Infinity)basePrice=minTarget;
    }
    var finalPrice=isPromoActive?Math.round(basePrice*(1-currentProd.discount/100)):basePrice;
    var cuota12=Math.round(finalPrice/12);
    var brandEl=document.getElementById('detBrand');if(brandEl)brandEl.textContent=currentProd.brand||'Apple';
    var typeEl=document.getElementById('detType');if(typeEl)typeEl.textContent=currentProd.type||'iPhone';
    var name2El=document.getElementById('detName2');if(name2El)name2El.textContent=currentProd.name;
    var nameEl=document.getElementById('detName');if(nameEl)nameEl.textContent=currentProd.name;
    // Show "Desde" if multiple variants
    var priceLabel=window._detailVariants.length>1?'Desde ':'';
    var priceEl=document.getElementById('detPrice');if(priceEl)priceEl.textContent=priceLabel+fmt(finalPrice);
    var totalEl=document.getElementById('detTotal');if(totalEl)totalEl.textContent=fmt(finalPrice);
    var oldEl=document.getElementById('detOld');
    if(isPromoActive&&currentProd.discount){
      var originalPrice=basePrice;
      if(oldEl){oldEl.textContent=fmt(originalPrice);oldEl.style.display='inline';}
    }else{if(oldEl)oldEl.style.display='none';}
    renderDetailImages();updDetTotal();
    renderDetBadges(currentProd);
    var fb=document.getElementById('detFavBtn');
    if(fb){if(isFavorite(currentProd.id)){fb.innerHTML='\u2665';fb.classList.add('saved');}else{fb.innerHTML='\u2661';fb.classList.remove('saved');}}
    // Select variant AFTER base render so it can override specs/name/badges
    if(variantId){
      for(var vi=0;vi<window._detailVariants.length;vi++){
        if(window._detailVariants[vi].id===variantId||window._detailVariants[vi].imei===variantId){
          selectDetailVariant(vi);break;
        }
      }
    }else if(window._detailVariants.length>0)selectDetailVariant(0);
    nav('detail');
    return;
  }
  // Show loading skeleton immediately
  renderDetailVariants();
  var fetchUrls=variantProdIds.map(function(pid){
    return API_URL+'/api/inventory?productId='+pid+'&limit=50';
  });
  Promise.all(fetchUrls.map(function(url){return fetch(url).then(function(r){return r.json();});})).then(function(results){
    if(currentProd.id!==id)return;
    var items=[];
    results.forEach(function(res){
      var data=res.data||res||[];
      items=items.concat(data);
    });
    var seen={};
    items=items.filter(function(v){
      if(seen[v.id])return false;
      seen[v.id]=true;
      return true;
    });
    if(items.length>0)window._variantCache[cacheKey]=items;
    window._detailVariants=items.filter(function(v){return v.status!=='SOLD';});
    window._variantsLoaded=true;
    renderDetailVariants();
    // Update price to show minimum variant price with discount
    var isPromo=currentProd.isOffer&&currentProd.discount>0;
    var minTarget=Infinity;
    for(var mi=0;mi<window._detailVariants.length;mi++){
      if(window._detailVariants[mi].targetPrice&&window._detailVariants[mi].targetPrice<minTarget){
        minTarget=window._detailVariants[mi].targetPrice;
      }
    }
    if(minTarget<Infinity){
      var finalP=isPromo?Math.round(minTarget*(1-currentProd.discount/100)):minTarget;
      var priceLabel=window._detailVariants.length>1?'Desde ':'';
      var priceEl=document.getElementById('detPrice');if(priceEl)priceEl.textContent=priceLabel+fmt(finalP);
      var totalEl=document.getElementById('detTotal');if(totalEl)totalEl.textContent=fmt(finalP);
      var oldEl=document.getElementById('detOld');
      if(isPromo&&oldEl){oldEl.textContent=fmt(minTarget);oldEl.style.display='inline';}
      var cuota12=Math.round(finalP/12);
      var cuotaText=document.getElementById('detCuotaText');
      if(cuotaText)cuotaText.textContent='12x '+fmt(cuota12)+' sin interes';
    }
    if(variantId){
      for(var vi=0;vi<window._detailVariants.length;vi++){
        if(window._detailVariants[vi].id===variantId||window._detailVariants[vi].imei===variantId){
          selectDetailVariant(vi);
          break;
        }
      }
    }else if(window._detailVariants.length>0){
      selectDetailVariant(0);
    }
  }).catch(function(){
    if(currentProd.id!==id)return;
    window._detailVariants=[];
    window._variantsLoaded=true;
    renderDetailVariants();
  });

  var now=new Date();
  var isPromoActive=currentProd.isOffer&&currentProd.discount>0;
  var finalPrice=isPromoActive?Math.round(currentProd.price*(1-currentProd.discount/100)):currentProd.price;
  var cuota12=Math.round(finalPrice/12);

  var brandEl=document.getElementById('detBrand');if(brandEl)brandEl.textContent=currentProd.brand||'Apple';
  var typeEl=document.getElementById('detType');if(typeEl)typeEl.textContent=currentProd.type||'iPhone';
  var name2El=document.getElementById('detName2');if(name2El)name2El.textContent=currentProd.name;
  var nameEl=document.getElementById('detName');if(nameEl)nameEl.textContent=currentProd.name;
  var priceEl=document.getElementById('detPrice');if(priceEl)priceEl.textContent=fmt(finalPrice);
  var totalEl=document.getElementById('detTotal');if(totalEl)totalEl.textContent=fmt(finalPrice);
  var oldEl=document.getElementById('detOld');
  if(isPromoActive&&currentProd.discount){var originalPrice=currentProd.price;if(oldEl){oldEl.textContent=fmt(originalPrice);oldEl.style.display='inline';}}
  else{if(oldEl)oldEl.style.display='none';}
  var cuotaInfo=document.getElementById('detCuotaInfo');var cuotaText=document.getElementById('detCuotaText');
  if(cuotaText)cuotaText.textContent='12x '+fmt(cuota12)+' sin interes';if(cuotaInfo)cuotaInfo.style.display='inline-block';
  var descEl=document.getElementById('detDesc');
  if(descEl){var descText=currentProd.description||currentProd.sub||'';if(descText){descEl.textContent=descText;descEl.style.display='block';}else{descEl.style.display='none';}}

  renderSpecsGrid(buildSpecsForProduct(currentProd));
  renderDetBadges(currentProd);

  var addCartBtn=document.getElementById('detAddCart');var buyNowBtn=document.getElementById('detBuyNow');
  if(addCartBtn){addCartBtn.style.display='';addCartBtn.onclick=function(){addToCartFromDetail();};}
  if(buyNowBtn){buyNowBtn.style.display='';buyNowBtn.onclick=function(){buyNow();};}
  var consultBtn=document.getElementById('detConsultBtn');
  if(consultBtn)consultBtn.style.display='flex';

  renderDetailImages();updDetTotal();
  renderDetailVariants();
  var fb=document.getElementById('detFavBtn');
  if(fb){if(isFavorite(currentProd.id)){fb.innerHTML='\u2665';fb.classList.add('saved');}else{fb.innerHTML='\u2661';fb.classList.remove('saved');}}
  nav('detail');
}

function resetDetailSelections(){
  document.querySelectorAll('.cuota-btn').forEach(function(c,i){
    if(i===0){c.style.background='var(--green)';c.style.color='#fff';c.style.border='2px solid var(--green)';}
    else{c.style.background='var(--cream2)';c.style.color='var(--dk)';c.style.border='2px solid var(--border)';}
  });
  document.querySelectorAll('.warranty-btn').forEach(function(c,i){
    c.style.border=i===0?'2px solid var(--green)':'2px solid var(--border)';
  });
  document.querySelectorAll('.delivery-btn').forEach(function(c,i){
    c.style.border=i===0?'2px solid var(--green)':'2px solid var(--border)';
  });
}
function renderDetailImages(){
  var allImages=[];
  if(currentProd&&currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd&&currentProd.images)allImages=allImages.concat(currentProd.images);
  var mainImg=document.getElementById('detImgMain');var thumbsContainer=document.getElementById('detThumbnails');
  if(!mainImg)return;
  var isFav=isFavorite(currentProd.id);
  var favBtn='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFav?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFav?'\u2665':'\u2661')+'</button>';
  var prevBtn='<button id="detImgPrev" onclick="prevDetailImage()" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:none;align-items:center;justify-content:center;cursor:pointer;font-size:18px;z-index:10;color:var(--dk);transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.1)">&#8592;</button>';
  var nextBtn='<button id="detImgNext" onclick="nextDetailImage()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:none;align-items:center;justify-content:center;cursor:pointer;font-size:18px;z-index:10;color:var(--dk);transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.1)">&#8594;</button>';
  if(allImages.length===0){mainImg.innerHTML=favBtn+prevBtn+nextBtn+'<span style="font-size:80px">\u{1F4F1}</span>';if(thumbsContainer)thumbsContainer.style.display='none';return;}
  var imgUrl=allImages[0];
  mainImg.innerHTML=favBtn+prevBtn+nextBtn+
    '<div style="position:relative;width:100%;height:100%;overflow:hidden;cursor:zoom-in" onclick="openLightbox(\''+imgUrl+'\')" onmousemove="handleImageZoom(event,this)" onmouseleave="resetImageZoom(this)">'+
      '<img loading="lazy" src="'+imgUrl+'" style="width:100%;height:100%;object-fit:contain;transition:transform .2s ease;pointer-events:none" id="detZoomImg">'+
      '<div style="position:absolute;bottom:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.1)">'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dk)" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'+
      '</div>'+
    '</div>';
  detailCurrentImageIndex=0;
  var showArrows=allImages.length>1;
  var prevEl=document.getElementById('detImgPrev');var nextEl=document.getElementById('detImgNext');
  if(prevEl)prevEl.style.display=showArrows?'flex':'none';
  if(nextEl)nextEl.style.display=showArrows?'flex':'none';
  if(thumbsContainer){
    if(allImages.length>1){thumbsContainer.style.display='grid';thumbsContainer.innerHTML=allImages.map(function(url,i){return '<div onclick="setDetailImage('+i+')" style="aspect-ratio:1/1;border-radius:10px;overflow:hidden;border:2px solid '+(i===0?'var(--orange)':'var(--border)')+';cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fff"><img loading="lazy" src="'+url+'" style="width:100%;height:100%;object-fit:contain"></div>';}).join('');}
    else{thumbsContainer.style.display='none';}
  }
}
function setDetailImage(index){
  var allImages=[];
  if(currentProd&&currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd&&currentProd.images)allImages=allImages.concat(currentProd.images);
  detailCurrentImageIndex=index;
  var mainImg=document.getElementById('detImgMain');var thumbsContainer=document.getElementById('detThumbnails');
  var isFav=isFavorite(currentProd.id);
  var imgUrl=allImages[index];
  if(mainImg)mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFav?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFav?'\u2665':'\u2661')+'</button><button id="detImgPrev" onclick="prevDetailImage()" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:'+(allImages.length>1?'flex':'none')+';align-items:center;justify-content:center;cursor:pointer;font-size:18px;z-index:10;color:var(--dk);transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.1)">&#8592;</button><button id="detImgNext" onclick="nextDetailImage()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);border:1px solid var(--border);display:'+(allImages.length>1?'flex':'none')+';align-items:center;justify-content:center;cursor:pointer;font-size:18px;z-index:10;color:var(--dk);transition:all .15s;box-shadow:0 2px 8px rgba(0,0,0,.1)">&#8594;</button>'+
    '<div style="position:relative;width:100%;height:100%;overflow:hidden;cursor:zoom-in" onclick="openLightbox(\''+imgUrl+'\')" onmousemove="handleImageZoom(event,this)" onmouseleave="resetImageZoom(this)">'+
      '<img loading="lazy" src="'+imgUrl+'" style="width:100%;height:100%;object-fit:contain;transition:transform .2s ease;pointer-events:none" id="detZoomImg">'+
      '<div style="position:absolute;bottom:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.1)">'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dk)" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>'+
      '</div>'+
    '</div>';
  if(thumbsContainer){var thumbs=thumbsContainer.children;for(var i=0;i<thumbs.length;i++){thumbs[i].style.borderColor=i===index?'var(--orange)':'var(--border)';}}
}
function prevDetailImage(){
  var allImages=[];
  if(currentProd&&currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd&&currentProd.images)allImages=allImages.concat(currentProd.images);
  if(allImages.length<=1)return;
  detailCurrentImageIndex=(detailCurrentImageIndex-1+allImages.length)%allImages.length;
  setDetailImage(detailCurrentImageIndex);
}
function nextDetailImage(){
  var allImages=[];
  if(currentProd&&currentProd.imageUrl)allImages.push(currentProd.imageUrl);
  if(currentProd&&currentProd.images)allImages=allImages.concat(currentProd.images);
  if(allImages.length<=1)return;
  detailCurrentImageIndex=(detailCurrentImageIndex+1)%allImages.length;
  setDetailImage(detailCurrentImageIndex);
}
function selectDetailVariant(idx){
  var vars=window._detailVariants||[];
  if(idx<0||idx>=vars.length)return;
  window._selectedVariantIdx=idx;
  window._selectedVariant=vars[idx];
  var v=vars[idx];
  
  // Find the specific product for this variant to check its discount
  var variantProd=null;
  if(v.productId){
    for(var pi=0;pi<PRODUCTS.length;pi++){
      if(PRODUCTS[pi].id===v.productId){variantProd=PRODUCTS[pi];break;}
    }
  }
  // Fallback: search by modelGroup + color/storage match
  if(!variantProd&&currentProd.modelGroup){
    for(var gi=0;gi<PRODUCTS.length;gi++){
      var p=PRODUCTS[gi];
      if(p.modelGroup===currentProd.modelGroup){
        var colorMatch=!v.color||p.color===v.color;
        var storageMatch=!v.storage||p.storage===v.storage;
        if(colorMatch&&storageMatch){variantProd=p;break;}
      }
    }
  }
  
  var isPromo=variantProd&&variantProd.isOffer&&variantProd.discount>0;
  var bestDiscount=isPromo?variantProd.discount:0;
  var basePrice=v.targetPrice||currentProd.price;
  var finalPrice=isPromo?Math.round(basePrice*(1-bestDiscount/100)):basePrice;
  
  console.log('[selectDetailVariant] variantProd:',variantProd?variantProd.id:'N/A','v.productId:',v.productId,'isPromo:',isPromo,'discount:',bestDiscount,'basePrice:',basePrice,'finalPrice:',finalPrice);

  // Update price (remove "Desde" when specific variant selected)
  var priceEl=document.getElementById('detPrice');
  if(priceEl)priceEl.textContent=fmt(finalPrice);
  var totalEl=document.getElementById('detTotal');
  if(totalEl)totalEl.textContent=fmt(finalPrice);
  var oldEl=document.getElementById('detOld');
  if(isPromo&&oldEl){oldEl.textContent=fmt(basePrice);oldEl.style.display='inline';}
  else if(oldEl)oldEl.style.display='none';
  var cuota12=Math.round(finalPrice/12);
  var cuotaText=document.getElementById('detCuotaText');
  if(cuotaText)cuotaText.textContent='12x '+fmt(cuota12)+' sin interes';

  // Update name to reflect variant details
  var suffixParts=[];
  if(v.color)suffixParts.push(v.color);
  if(v.storage)suffixParts.push(v.storage);
  var variantSuffix=suffixParts.length?' ('+suffixParts.join(' / ')+')':'';
  var name2El=document.getElementById('detName2');
  if(name2El)name2El.textContent=currentProd.name+variantSuffix;
  var nameEl=document.getElementById('detName');
  if(nameEl)nameEl.textContent=currentProd.name+variantSuffix;

  // Rebuild specs grid with variant-specific data
  var mergedProd={
    type:v.deviceType||currentProd.type,
    condition:v.cosmeticCondition||currentProd.condition,
    battery:v.batteryHealth,
    color:v.color,
    ram:currentProd.ram,
    storage:v.storage||currentProd.storage,
    stock:currentProd.stock,
    sub:currentProd.sub,
    processor:currentProd.processor,
    screen:currentProd.screen,
    isOffer:isPromo,
    discount:bestDiscount,
    price:finalPrice
  };
  renderSpecsGrid(buildSpecsForProduct(mergedProd));

  // Always render badges with promo info
  if(v.cosmeticCondition||v.functionalCondition){
    var condStr=[v.cosmeticCondition,v.functionalCondition].filter(Boolean).join(' - ');
    renderDetBadges(mergedProd,condStr);
  }else{
    renderDetBadges(mergedProd);
  }

  // Show variant-specific image
  if(v.imageUrl){
    var mainImg=document.getElementById('detImgMain');
    if(mainImg){
      mainImg.innerHTML='<button id="detFavBtn" onclick="toggleDetFav()" class="fav-btn'+(isFavorite(currentProd.id)?' saved':'')+'" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:#fff;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;z-index:10">'+(isFavorite(currentProd.id)?'\u2665':'\u2661')+'</button>'+
        '<div style="position:relative;width:100%;height:100%;overflow:hidden;cursor:zoom-in" onclick="openLightbox(\''+v.imageUrl+'\')">'+
          '<img loading="lazy" src="'+v.imageUrl+'" style="width:100%;height:100%;object-fit:contain">'+
        '</div>';
    }
  }

  // Show condition note
  var descEl=document.getElementById('detDesc');
  if(descEl){
    var note=v.notes||'';
    var condNote='';
    if(v.cosmeticCondition||v.batteryHealth!=null){
      var parts=[];
      if(v.cosmeticCondition)parts.push('Estado: '+v.cosmeticCondition);
      if(v.batteryHealth!=null)parts.push('Batería: '+v.batteryHealth+'%');
      condNote=parts.join(' | ');
    }
    var fullDesc=[escapeHtml(currentProd.description||currentProd.sub||''),escapeHtml(condNote),escapeHtml(note)].filter(Boolean).join('<br>');
    if(fullDesc){descEl.innerHTML=fullDesc;descEl.style.display='block';}else{descEl.style.display='none';}
  }

  // Highlight the selected pill
  renderDetailVariants();
}

function renderDetailVariants(){
  var container=document.getElementById('detVariants');
  var list=document.getElementById('detVariantsList');
  if(!container||!list)return;
  var variants=window._detailVariants||[];
  if(variants.length===0){
    if(!window._variantsLoaded){
      container.style.display='block';
      list.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<div class="skeleton" style="padding:8px 16px;border-radius:10px;min-width:80px;height:36px"></div>'+
        '<div class="skeleton" style="padding:8px 16px;border-radius:10px;min-width:80px;height:36px"></div>'+
        '<div class="skeleton" style="padding:8px 16px;border-radius:10px;min-width:80px;height:36px"></div>'+
        '</div>';
      return;
    }
    container.style.display='none';
    return;
  }
  container.style.display='block';

  // Determine model name for color circle matching
  var modelName='';
  if(currentProd&&currentProd.modelGroup)modelName=currentProd.modelGroup;
  if(!modelName&&currentProd)modelName=currentProd.name;
  var modelColors=window.MODEL_COLORS&&window.MODEL_COLORS[modelName];
  var hexMap=window.COLOR_HEX||{};

  // Use color circles for known iPhone models
  if(modelColors&&modelColors.length&&variants.some(function(v){return v.color;})){
    if(!window._colorCircleState)window._colorCircleState={selectedColor:null,selectedStorage:null};
    var state=window._colorCircleState;

    // Group variants by color
    var colorMap={};
    variants.forEach(function(v){
      if(!v.color)return;
      if(!colorMap[v.color])colorMap[v.color]=[];
      colorMap[v.color].push(v);
    });

    var circlesHtml=modelColors.map(function(c){
      var hex=hexMap[c]||'#ccc';
      var available=!!colorMap[c];
      var isSelected=c===state.selectedColor;
      if(available&&!state.selectedColor)state.selectedColor=c;
      if(!available) {
        return '<div style="width:36px;height:36px;border-radius:50%;background:#ddd;cursor:not-allowed;border:2px solid #ccc;flex-shrink:0;position:relative;opacity:.45" title="'+c+' (no disponible)">'+
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'+
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg></div></div>';
      }
      return '<div onclick="onColorCircleClick(\''+c.replace(/'/g,"\\'")+'\')" style="width:36px;height:36px;border-radius:50%;background:'+hex+';cursor:pointer;border:3px solid '+(isSelected?'var(--orange)':'transparent')+';flex-shrink:0;transition:all .15s;box-shadow:0 2px 6px rgba(0,0,0,.15);transform:'+(isSelected?'scale(1.1)':'scale(1)')+'" title="'+c+'"></div>';
    }).join('');

    // Storage boxes for selected color
    var storageHtml='';
    var storagesForColor=state.selectedColor?colorMap[state.selectedColor]:[];
    if(storagesForColor&&storagesForColor.length){
      if(!state.selectedStorage)state.selectedStorage=storagesForColor[0].storage||'';
      var allStorages=Array.from(new Set(storagesForColor.map(function(v){return v.storage||'—';})));
      // Also get all storages from other colors to gray them out
      var allColorStorages={};
      Object.keys(colorMap).forEach(function(col){
        allColorStorages[col]=Array.from(new Set(colorMap[col].map(function(v){return v.storage||'—';})));
      });
      var validStorages=allColorStorages[state.selectedColor]||[];
      storageHtml='<div style="margin-top:10px"><div style="font-size:11px;font-weight:600;color:var(--gray);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Almacenamiento</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        allStorages.map(function(s){
          var isAvailable=validStorages.indexOf(s)>=0;
          var isSelected=s===state.selectedStorage;
          if(isAvailable){
            return '<div onclick="onStorageBoxClick(\''+s.replace(/'/g,"\\'")+'\')" style="padding:6px 14px;border-radius:8px;border:2px solid '+(isSelected?'var(--orange)':'var(--border)')+';background:'+(isSelected?'var(--orange)':'#fff')+';color:'+(isSelected?'#fff':'var(--dk)')+';font-size:12px;font-weight:'+(isSelected?'700':'500')+';cursor:pointer;transition:all .15s">'+s+'</div>';
          }
          return '<div style="padding:6px 14px;border-radius:8px;border:2px dashed #ddd;background:#f5f5f5;color:#bbb;font-size:12px;cursor:not-allowed" title="No disponible para '+state.selectedColor+'">'+s+'</div>';
        }).join('')+'</div></div>';
    }else if(state.selectedColor&&!storagesForColor){
      storageHtml='<div style="margin-top:8px;font-size:12px;color:var(--gray)">Sin variantes disponibles para este color</div>';
    }

    list.innerHTML='<div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
      circlesHtml+'</div>'+storageHtml+'</div>';

    // Auto-select variant based on selected color+storage
    if(state.selectedColor&&state.selectedStorage){
      var foundIdx=-1;
      for(var vi=0;vi<variants.length;vi++){
        var v=variants[vi];
        if(v.color===state.selectedColor&&(v.storage||'—')===state.selectedStorage){
          foundIdx=vi;break;
        }
      }
      if(foundIdx>=0&&foundIdx!==window._selectedVariantIdx)selectDetailVariant(foundIdx);
      else if(foundIdx<0&&variants.length>0)selectDetailVariant(0);
    }else if(variants.length>0)selectDetailVariant(0);
    return;
  }

  // Fallback: original text pills for non-iPhone products
  list.innerHTML=variants.map(function(v,i){
    var isActive=i===window._selectedVariantIdx;
    var parts=[];
    if(v.color)parts.push(v.color);
    if(v.storage)parts.push(v.storage);
    if(v.cosmeticCondition&&!v.color&&!v.storage)parts.push(v.cosmeticCondition);
    var label=parts.join(' \u00B7 ')||'Variante '+(i+1);
    if(v.targetPrice){
      var variantProd=null;
      if(v.productId){
        for(var pi=0;pi<PRODUCTS.length;pi++){
          if(PRODUCTS[pi].id===v.productId){variantProd=PRODUCTS[pi];break;}
        }
      }
      var isPromo=variantProd&&variantProd.isOffer&&variantProd.discount>0;
      var pillPrice=isPromo?Math.round(v.targetPrice*(1-variantProd.discount/100)):v.targetPrice;
      if(isPromo)label+=' — <span style="text-decoration:line-through;opacity:.5">'+fmt(v.targetPrice)+'</span> <strong>'+fmt(pillPrice)+'</strong>';
      else label+=' — '+fmt(v.targetPrice);
    }
    var clickAttr=variants.length>1?'onclick="selectDetailVariant('+i+')"':'';
    var cursor=variants.length>1?'pointer':'default';
    return '<button '+clickAttr+' style="'+
      'padding:8px 16px;border-radius:10px;border:2px solid '+(isActive?'var(--orange)':'var(--border)')+';'+
      'background:'+(isActive?'var(--orange)':'#fff')+';'+
      'color:'+(isActive?'#fff':'var(--dk)')+';'+
      'font-size:13px;font-weight:'+(isActive?'700':'500')+';'+
      'cursor:'+cursor+';'+
      'transition:all .15s;box-shadow:'+(isActive?'0 2px 8px rgba(255,107,44,.3)':'none')+
      '">'+label+'</button>';
  }).join('');
}

function onColorCircleClick(color){
  if(!window._colorCircleState)return;
  window._colorCircleState.selectedColor=color;
  window._colorCircleState.selectedStorage=null;
  renderDetailVariants();
}

function onStorageBoxClick(storage){
  if(!window._colorCircleState)return;
  window._colorCircleState.selectedStorage=storage;
  renderDetailVariants();
}
function selCuota(el,n){
  document.querySelectorAll('.cuota-btn').forEach(function(c){
    c.style.background='var(--cream2)';
    c.style.color='var(--dk)';
    c.style.border='2px solid var(--border)';
  });
  el.style.background='var(--green)';
  el.style.color='#fff';
  el.style.border='2px solid var(--green)';
  selCuotas=n;
  updDetTotal();
}
function selOpt(el,type,val){
  var list=el.parentElement;
  if(type==='w'){
    list.querySelectorAll('.warranty-btn').forEach(function(r){
      r.style.border='2px solid var(--border)';
    });
    el.style.border='2px solid var(--green)';
    detWMult=val;
  }
  if(type==='d'){
    list.querySelectorAll('.delivery-btn').forEach(function(r){
      r.style.border='2px solid var(--border)';
    });
    el.style.border='2px solid var(--green)';
    detDExtra=val;
  }
  updDetTotal();
}
function updDetTotal(){
  var total=0;
  if(currentProd){
    var now=new Date();
    var isPromo=currentProd.isOffer&&currentProd.discount>0;
    var base=isPromo?Math.round(currentProd.price*(1-currentProd.discount/100)):currentProd.price;
    total=base+detWMult+detDExtra;
  }else if(currentAcc){
    var now2=new Date();
    var isPromo2=currentAcc.isOffer&&currentAcc.discount>0;
    total=isPromo2?Math.round(currentAcc.price*(1-currentAcc.discount/100)):currentAcc.price;
  }
  var totalEl=document.getElementById('detTotal');
  if(totalEl)totalEl.textContent=fmt(total);
}
function filterShop(f,btn){
  window.shopFilter=f;
  if(btn){
    document.querySelectorAll('#p-shop .fchip').forEach(function(c){c.classList.remove('act');});
    btn.classList.add('act');
  }
  renderShopGrid();
  if(f==='todos'){
    var titleEl=document.getElementById('shopTitle');
    if(titleEl)titleEl.textContent='Catálogo';
    var subEl=document.getElementById('shopSub');
    if(subEl)subEl.textContent='Todos los equipos verificados con garantía incluida';
  }
}
var currentSort='rel';
var filterState={conditions:[],storage:[],ram:[],priceMin:null,priceMax:null,hideNoStock:false,batteryMin:0};
function toggleSortMenu(){
  var menu=document.getElementById('sortMenu');
  menu.style.display=menu.style.display==='none'?'block':'none';
}
function setSort(val,btn){
  currentSort=val;
  var label=document.getElementById('sortLabel');
  if(label)label.textContent=btn.textContent;
  document.querySelectorAll('.sort-opt').forEach(function(o){o.classList.remove('act');});
  btn.classList.add('act');
  document.getElementById('sortMenu').style.display='none';
  renderShopGrid();
}
function toggleFilterPanel(){
  var panel=document.getElementById('filterPanel');
  var overlay=document.getElementById('filterOverlay');
  var isOpen=panel.style.display==='block';
  
  var mainnav=document.getElementsByClassName('mainnav')[0];
  var catnav=document.getElementsByClassName('catnav')[0];
  
  if(isOpen){
    panel.style.animation='slideOut .25s ease forwards';
    overlay.style.display='none';
    if(mainnav)mainnav.style.backdropFilter='';
    if(catnav)catnav.style.backdropFilter='';
    setTimeout(function(){panel.style.display='none';panel.style.animation='';},250);
  }else{
    panel.style.display='block';
    panel.style.animation='slideIn .25s ease forwards';
    overlay.style.display='block';
    if(mainnav)mainnav.style.backdropFilter='blur(8px)';
    if(catnav)catnav.style.backdropFilter='blur(8px)';
  }
}
function applyFilters(){
  var state={conditions:[],storage:[],ram:[],priceMin:null,priceMax:null,hideNoStock:false,batteryMin:0};
  if(document.getElementById('chk-nuevo').checked)state.conditions.push('Nuevo');
  if(document.getElementById('chk-impecable').checked)state.conditions.push('Impecable');
  if(document.getElementById('chk-muybueno').checked)state.conditions.push('Muy bueno');
  if(document.getElementById('chk-bueno').checked)state.conditions.push('Bueno');
  document.querySelectorAll('#filterPanel input[type="checkbox"][value]').forEach(function(cb){
    if(cb.checked&&cb.value.match(/GB|TB/))state.storage.push(cb.value);
  });
  if(document.getElementById('ram-4').checked)state.ram.push('4 GB');
  if(document.getElementById('ram-6').checked)state.ram.push('6 GB');
  if(document.getElementById('ram-8').checked)state.ram.push('8 GB');
  if(document.getElementById('ram-12').checked)state.ram.push('12 GB');
  if(document.getElementById('ram-16').checked)state.ram.push('16 GB');
  var pMin=document.getElementById('priceMin');
  var pMax=document.getElementById('priceMax');
  if(pMin&&pMin.value)state.priceMin=parseInt(pMin.value);
  if(pMax&&pMax.value)state.priceMax=parseInt(pMax.value);
  var hideNoStock=document.getElementById('hideNoStock');
  state.hideNoStock=hideNoStock?hideNoStock.checked:false;
  var batMin=document.getElementById('batteryMin');
  state.batteryMin=batMin?parseInt(batMin.value):0;
  filterState=state;
  var count=state.conditions.length+state.storage.length+state.ram.length+(state.priceMin?1:0)+(state.priceMax?1:0)+(state.hideNoStock?1:0)+(state.batteryMin>0?1:0);
  var badge=document.getElementById('filterCount');
  if(badge){
    badge.textContent=count;
    badge.style.display=count>0?'inline':'none';
  }
  renderShopGrid();
  toggleFilterPanel();
}
function clearFilters(){
  document.getElementById('chk-nuevo').checked=false;
  document.getElementById('chk-impecable').checked=false;
  document.getElementById('chk-muybueno').checked=false;
  document.getElementById('chk-bueno').checked=false;
  document.querySelectorAll('#filterPanel input[type="checkbox"][value]').forEach(function(cb){cb.checked=false;});
  document.getElementById('ram-4').checked=false;
  document.getElementById('ram-6').checked=false;
  document.getElementById('ram-8').checked=false;
  document.getElementById('ram-12').checked=false;
  document.getElementById('ram-16').checked=false;
  document.getElementById('priceMin').value='';
  document.getElementById('priceMax').value='';
  document.getElementById('hideNoStock').checked=false;
  document.getElementById('batteryMin').value=0;
  document.getElementById('batteryMinVal').textContent='0%';
  filterState={conditions:[],storage:[],ram:[],priceMin:null,priceMax:null,hideNoStock:false,batteryMin:0};
  document.getElementById('filterCount').style.display='none';
  renderShopGrid();
}
function filtAcc(f,btn){
  accFilter=f;
  document.querySelectorAll('#p-accesorios .fchip').forEach(function(c){c.classList.remove('act');});
  btn.classList.add('act');
  renderAccGrid();
}
var currentAccSort='rel';
function toggleAccSortMenu(){
  var menu=document.getElementById('sortAccMenu');
  menu.style.display=menu.style.display==='none'?'block':'none';
}
function setAccSort(val,btn){
  currentAccSort=val;
  var label=document.getElementById('sortAccLabel');
  if(label)label.textContent=btn.textContent;
  document.querySelectorAll('#sortAccMenu .sort-opt').forEach(function(o){o.classList.remove('act');});
  btn.classList.add('act');
  document.getElementById('sortAccMenu').style.display='none';
  renderAccGrid();
}
function clearAdvF(){
  document.getElementById('af-st').value='';
  document.getElementById('af-cd').value='';
  document.getElementById('af-p1').value='';
  document.getElementById('af-p2').value='';
  renderShopGrid();
}

// =========== ORDER & QUOTE HISTORY ===========
function renderOrderHistory(){
  var list=document.getElementById('orderHistory');
  if(!list)return;
  var user=Storage.get('user');
  if(!user){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Inicia sesion para ver tu historial</div>';return;}
  try{
    cachedFetch(API_URL+'/api/orders?userId='+user.id,null,15000).then(function(ords){
      if(ords.length===0){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">No tenes pedidos</div>';}
      else{list.innerHTML=ords.map(function(o){return'<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">'+(o.items[0]?.product?.name||'Producto')+'</div><div class="oi-s">'+o.code+' · '+new Date(o.createdAt).toLocaleDateString('es-AR')+'</div></div><div><div class="oi-p">$'+o.total.toLocaleString('es-AR')+'</div><span class="oi-bdg">'+o.status+'</span></div></div>';}).join('');}
    }).catch(function(){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando pedidos</div>';});
  }catch(e){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando pedidos</div>';}
}
function renderQuotHistory(){
  var list=document.getElementById('quotHistory');
  if(!list)return;
  var user=Storage.get('user');
  if(!user){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Inicia sesion para ver tus cotizaciones</div>';return;}
  try{
    cachedFetch(API_URL+'/api/quotes?userId='+user.id,null,15000).then(function(qts){
      if(qts.length===0){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">No tenes cotizaciones</div>';}
      else{list.innerHTML=qts.map(function(q){return'<div class="order-item"><div class="oi-ico">📱</div><div style="flex:1"><div class="oi-n">'+q.device+' '+q.storage+'</div><div class="oi-s">'+q.code+' · '+new Date(q.createdAt).toLocaleDateString('es-AR')+'</div></div><div><div class="oi-p">$'+q.finalPrice.toLocaleString('es-AR')+'</div><span class="oi-bdg">'+q.status+'</span></div></div>';}).join('');}
    }).catch(function(){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando cotizaciones</div>';});
  }catch(e){list.innerHTML='<div style="text-align:center;padding:1rem;font-size:12px;color:var(--gray)">Error cargando cotizaciones</div>';}
}

function loadClientQuotes(){
  var list=document.getElementById('clientQuoteList');
  if(!list)return;
  if(!currentUser){
    list.innerHTML='<div style="text-align:center;padding:1.5rem 0;color:var(--gray)"><p style="font-size:13px">Inicia sesión para ver tus cotizaciones</p></div>';
    return;
  }
  list.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--gray)"><div style="display:inline-block;width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin .6s linear infinite"></div></div>';

  cachedFetch(API_URL+'/api/quotes?userId='+currentUser.id+'&page=1&limit=5',null,15000).then(function(res){
    var quotes=res.data||[];
    if(quotes.length===0){
      list.innerHTML='<div style="text-align:center;padding:1.5rem 0;color:var(--gray)">'+
        '<div style="width:50px;height:50px;background:var(--cream3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">'+
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M12 13h.01"/></svg></div>'+
        '<p style="font-size:13px;font-weight:500;margin-bottom:8px">No tenes cotizaciones</p>'+
        '<button onclick="nav(\'sell\')" style="color:var(--green);background:none;border:none;font-size:13px;font-weight:700;cursor:pointer">Solicitar una ahora</button></div>';
      return;
    }
    var statusColors={PENDING:'var(--orange)',APPROVED:'var(--green)',REJECTED:'var(--red)',REVIEWING:'#8b5cf6',COMPLETED:'var(--blue)'};
    var statusLabels={PENDING:'Pendiente',APPROVED:'Aceptada',REJECTED:'Rechazada',REVIEWING:'En revisión',COMPLETED:'Completada'};
    var statusIcons={PENDING:'&#9203;',APPROVED:'&#9989;',REJECTED:'&#10060;',REVIEWING:'&#128269;',COMPLETED:'&#128184;'};
    var html=quotes.map(function(q){
      var sc=statusColors[q.status]||'var(--gray)';
      var sl=statusLabels[q.status]||q.status;
      var si=statusIcons[q.status]||'&#128203;';
      var date=new Date(q.createdAt).toLocaleDateString('es-AR',{day:'numeric',month:'short'});
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--cream2);border-radius:10px;border:1px solid var(--border);margin-bottom:6px;cursor:pointer;transition:all .2s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.background=\'var(--cream3)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--cream2)\'" onclick="openClientQuoteDetail(\''+q.id+'\')">'+
        '<div style="width:36px;height:36px;border-radius:8px;background:'+sc+'18;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">'+si+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:600;font-size:13px;color:var(--dk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+q.device+' '+q.storage+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">'+date+' · '+q.code+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+
          '<div style="font-weight:700;font-size:13px;color:var(--orange)">$'+q.finalPrice.toLocaleString('es-AR')+'</div>'+
          '<div style="font-size:10px;font-weight:600;color:'+sc+';background:'+sc+'18;padding:2px 8px;border-radius:10px;display:inline-block">'+sl+'</div>'+
        '</div>'+
      '</div>';
    }).join('');
    if(res.total>5){
      html+='<div style="text-align:center;margin-top:8px"><button onclick="nav(\'sell\')" style="color:var(--green);background:none;border:none;font-size:12px;font-weight:600;cursor:pointer">Ver todas →</button></div>';
    }
    list.innerHTML=html;
  }).catch(function(){
    list.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--gray);font-size:13px">Error cargando cotizaciones</div>';
  });
}

function openClientQuoteDetail(id){
  fetch(API_URL+'/api/quotes?userId='+currentUser.id+'&page=1&limit=100').then(function(r){return r.json();}).then(function(res){
    var q=(res.data||[]).find(function(x){return x.id===id;});
    if(!q)return;
    
    var existing=document.getElementById('clientQuoteDetailModal');
    if(existing)existing.remove();
    
    var statusColors={PENDING:'var(--orange)',APPROVED:'var(--green)',REJECTED:'var(--red)',REVIEWING:'#8b5cf6',COMPLETED:'var(--blue)'};
    var statusLabels={PENDING:'Pendiente',APPROVED:'Aceptada',REJECTED:'Rechazada',REVIEWING:'En revisión',COMPLETED:'Completada'};
    var sc=statusColors[q.status]||'var(--gray)';
    var sl=statusLabels[q.status]||q.status;
    var date=new Date(q.createdAt).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    
    var extrasLabels={pant:'Pantalla perfecta (+6%)',bat:'Batería 80%+ (+5%)',icloud:'Cuenta libre (+8%)',caja:'Caja original (+3%)',acc:'Accesorios originales (+3%)'};
    var extrasHtml=(q.extras||[]).length>0?(q.extras||[]).map(function(e){return'<span style="font-size:11px;background:var(--cream3);padding:4px 8px;border-radius:6px">'+(extrasLabels[e]||e)+'</span>';}).join(''):'<span style="font-size:12px;color:var(--gray)">Ninguno</span>';
    
    var conditionLabels={excellent:'Excelente',good:'Bueno',fair:'Regular',poor:'Defectuoso'};
    
    var modal=document.createElement('div');
    modal.id='clientQuoteDetailModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';
    modal.onclick=function(e){if(e.target===modal)modal.remove();};
    
    var content='<div style="background:var(--cream2);border-radius:16px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">'+
      '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--cream2);z-index:1;border-radius:16px 16px 0 0">'+
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--dk)">Cotización '+q.code+'</h3>'+
        '<button onclick="document.getElementById(\'clientQuoteDetailModal\').remove()" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--gray);padding:4px 8px;border-radius:6px" onmouseover="this.style.background=\'var(--cream3)\'" onmouseout="this.style.background=\'none\'">&times;</button>'+
      '</div>'+
      '<div style="padding:1.5rem">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;padding:12px;background:var(--cream3);border-radius:10px">'+
          '<div style="width:40px;height:40px;border-radius:8px;background:'+sc+'18;display:flex;align-items:center;justify-content:center;font-size:20px">'+
            (q.status==='PENDING'?'&#9203;':q.status==='APPROVED'?'&#9989;':q.status==='REJECTED'?'&#10060;':q.status==='REVIEWING'?'&#128269;':'&#128184;')+
          '</div>'+
          '<div><div style="font-weight:700;font-size:14px;color:'+sc+'">'+sl+'</div><div style="font-size:11px;color:var(--gray)">'+date+'</div></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem">'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Dispositivo</div><div style="font-weight:600;font-size:13px;color:var(--dk)">'+q.device+'</div></div>'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Almacenamiento</div><div style="font-weight:600;font-size:13px;color:var(--dk)">'+q.storage+'</div></div>'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Condición</div><div style="font-weight:600;font-size:13px;color:var(--dk)">'+(conditionLabels[q.condition]||q.condition)+'</div></div>'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Precio estimado</div><div style="font-weight:700;font-size:16px;color:var(--orange)">$'+q.finalPrice.toLocaleString('es-AR')+'</div></div>'+
        '</div>'+
        '<div style="margin-bottom:1.25rem"><div style="font-size:11px;color:var(--gray);margin-bottom:6px">Extras seleccionados</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+extrasHtml+'</div></div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem;padding-top:1rem;border-top:1px solid var(--border)">'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Envío</div><div style="font-weight:500;font-size:13px;color:var(--dk)">'+(q.envio==='pickup'?'Retiro en tienda':'Correo argentino')+'</div></div>'+
          '<div><div style="font-size:11px;color:var(--gray);margin-bottom:4px">Pago</div><div style="font-weight:500;font-size:13px;color:var(--dk)">'+(q.payment==='transfer'?'Transferencia bancaria':q.payment==='cash'?'Efectivo':'MercadoPago')+'</div></div>'+
        '</div>'+
        '<div style="padding-top:1rem;border-top:1px solid var(--border)">'+
          '<div style="font-size:11px;color:var(--gray);margin-bottom:6px">Datos del cliente</div>'+
          '<div style="font-size:13px;color:var(--dk);line-height:1.8">'+
            '<div><strong>Nombre:</strong> '+(q.clientName||'No especificado')+'</div>'+
            '<div><strong>DNI:</strong> '+(q.clientDni||'No especificado')+'</div>'+
            '<div><strong>Teléfono:</strong> '+(q.clientPhone||'No especificado')+'</div>'+
            (q.clientProvince?'<div><strong>Provincia:</strong> '+q.clientProvince+(q.clientCp?' (CP: '+q.clientCp+')':'')+'</div>':'')+
          '</div>'+
        '</div>'+
        (q.rejectReason?'<div style="margin-top:1.25rem;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px">'+
          '<div style="font-size:11px;color:var(--red);font-weight:600;margin-bottom:4px">Motivo de rechazo</div>'+
          '<div style="font-size:13px;color:var(--dk)">'+q.rejectReason+'</div>'+
        '</div>':'')+
      '</div>'+
    '</div>';
    
    modal.innerHTML=content;
    document.body.appendChild(modal);
  }).catch(function(){
    alert('Error cargando el detalle de la cotización');
  });
}

// =========== INIT ===========
document.addEventListener('DOMContentLoaded',function(){
  loadProducts();
  renderRepairGrid();
  renderAccGrid();
  initSlider();
  startTimer();
  renderNotebookConfig();
});

// =========== SLIDER ===========
var sliderIdx=0,sliderTimer=null;
function initSlider(){
  var nav=document.getElementById('sliderNav');
  if(!nav)return;
  nav.innerHTML='';
  for(var i=0;i<4;i++){
    var d=document.createElement('button');
    d.className='sdot'+(i===0?' act':'');
    d.setAttribute('data-i',i);
    d.onclick=(function(idx){return function(){goSlide(idx);};})(i);
    nav.appendChild(d);
  }
  startSliderTimer();
}
function goSlide(idx){
  sliderIdx=(idx+4)%4;
  var track=document.getElementById('sliderTrack');
  if(track)track.style.transform='translateX(-'+(sliderIdx*25)+'%)';
  document.querySelectorAll('.sdot').forEach(function(d,i){d.className='sdot'+(i===sliderIdx?' act':'');});
}
function sliderNext(){goSlide(sliderIdx+1);}
function sliderPrev(){goSlide(sliderIdx-1);}
function startSliderTimer(){
  if(sliderTimer)clearInterval(sliderTimer);
  sliderTimer=setInterval(function(){
    var track=document.getElementById('sliderTrack');
    if(track)goSlide(sliderIdx+1);
    else{clearInterval(sliderTimer);sliderTimer=null;}
  },4500);
}

// =========== FEATURED GRID ===========
function renderFeaturedGrid(){
  var grid=document.getElementById('featuredGrid');
  if(!grid)return;
  var sorted=PRODUCTS.slice().sort(function(a,b){
    var stockA=a.stock>0?0:1;
    var stockB=b.stock>0?0:1;
    if(stockA!==stockB)return stockA-stockB;
    return new Date(b.createdAt||0)-new Date(a.createdAt||0);
  });
  renderGrid('featuredGrid',sorted.slice(0,4));
}

// =========== TIMER ===========
var _timerInterval=null;
function startTimer(){
  if(_timerInterval)clearInterval(_timerInterval);
  var end=new Date();
  end.setHours(23,59,59,0);
  function tick(){
    var now=new Date();
    var diff=Math.max(0,Math.floor((end-now)/1000));
    var h=Math.floor(diff/3600);
    var m=Math.floor((diff%3600)/60);
    var s=diff%60;
    var el=document.getElementById('timerEl');
    if(el)el.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    else{clearInterval(_timerInterval);_timerInterval=null;}
  }
  tick();
  _timerInterval=setInterval(tick,1000);
}

// =========== NOTEBOOK CONFIG ===========
function renderNotebookConfig(){
  var nbBase=document.getElementById('nbBaseOpts');
  if(nbBase){
    nbBase.innerHTML=NB_DATA.bases.map(function(nb,i){
      return '<div class="nb-opt" onclick="selectNbBase(this,'+i+')"><div><div class="nb-opt-name">'+nb.ico+' '+nb.name+'</div><div class="nb-opt-desc">'+nb.desc+'</div></div><div class="nb-opt-price">'+fmt(nb.price)+'</div><div class="nb-opt-chk"></div></div>';
    }).join('');
  }
}
function selectNbBase(el,idx){
  document.querySelectorAll('#nbBaseOpts .nb-opt').forEach(function(o){o.classList.remove('act');});
  el.classList.add('act');
}

// =========== MAYORISTA ===========
function renderMayorista(){
  var el=document.getElementById('mayoristaContent');
  if(el)el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)"><p>Programa mayorista no disponible</p><p style="font-size:11px">Contactanos por WhatsApp para ser mayorista</p></div>';
}

// =========== ADMIN ===========
function adminTab(tab,btn){
  // Reset all sidebar nav items
  document.querySelectorAll('.admin-nav-item').forEach(function(b){b.classList.remove('act');});
  // Reset old tab buttons (for backwards compatibility)
  document.querySelectorAll('.atab').forEach(function(c){c.classList.remove('act');});
  document.querySelectorAll('.admin-sec').forEach(function(s){s.classList.remove('act');});
  
  // Activate clicked item
  btn.classList.add('act');
  
  // Update topbar title
  var titles={
    dashboard:'Dashboard',
    prods:'Productos',
    inventory:'Inventario',
    acc:'Accesorios',
    stock:'Stock',
    promos:'Promociones',
    orders:'Pedidos',
    arrep:'Arrepentimientos',
    chat:'Chat',
    quotes:'Cotizaciones',
    instore:'Venta en Tienda'
  };
  var titleEl=document.getElementById('adminPageTitle');
  if(titleEl&&titles[tab])titleEl.textContent=titles[tab];
  
  // Activate section (for old admin panel)
  var sec=document.getElementById('as-'+tab);
  if(sec)sec.classList.add('act');
  
  // Load chat if needed
  if(tab==='chat'){loadAdminConversations();initChatSocket();initChatSound();}
  
  // Render content
  renderAdminContent(tab);
  
  // Close mobile sidebar on navigation
  closeMobileSidebar();
}

function toggleAdminTheme(){
  var layout=document.querySelector('.admin-layout');
  if(!layout)return;
  
  var isLight=layout.classList.contains('admin-theme-light');
  
  if(isLight){
    layout.classList.remove('admin-theme-light');
    localStorage.setItem('adminTheme','dark');
    document.getElementById('themeIcon').textContent='dark_mode';
    document.getElementById('themeLabel').textContent='Tema claro';
  }else{
    layout.classList.add('admin-theme-light');
    localStorage.setItem('adminTheme','light');
    document.getElementById('themeIcon').textContent='light_mode';
    document.getElementById('themeLabel').textContent='Tema oscuro';
  }
}

function loadAdminTheme(){
  var theme=localStorage.getItem('adminTheme');
  var layout=document.querySelector('.admin-layout');
  if(!layout)return;
  
  if(theme==='light'){
    layout.classList.add('admin-theme-light');
    document.getElementById('themeIcon').textContent='light_mode';
    document.getElementById('themeLabel').textContent='Tema oscuro';
  }
}
function toggleMobileSidebar(){
  var sidebar=document.querySelector('.admin-sidebar');
  var backdrop=document.querySelector('.admin-sidebar-backdrop');
  if(!sidebar)return;
  var isOpen=sidebar.classList.contains('open');
  sidebar.classList.toggle('open');
  if(backdrop)backdrop.classList.toggle('active');
  document.body.style.overflow=isOpen?'':'hidden';
}
function closeMobileSidebar(){
  var sidebar=document.querySelector('.admin-sidebar');
  var backdrop=document.querySelector('.admin-sidebar-backdrop');
  if(!sidebar)return;
  sidebar.classList.remove('open');
  if(backdrop)backdrop.classList.remove('active');
  document.body.style.overflow='';
}
function formatPriceInput(el){
  var val=el.value.replace(/[^0-9]/g,'');
  el.value=val;
}
function updateProductFields(){
  var type=document.getElementById('prodType').value;
  var batteryField=document.getElementById('prodBatteryField');
  var processorField=document.getElementById('prodProcessorField');
  if(type==='laptop'||type==='desktop'){
    if(batteryField)batteryField.style.display='none';
    if(processorField)processorField.style.display='block';
  }else{
    if(batteryField)batteryField.style.display='block';
    if(processorField)processorField.style.display='none';
  }
}
window.selectAdminColor=function(color,el){
  window._adminColorCircleSelected=color;
  document.querySelectorAll('#adminColorContainer > div').forEach(function(d){d.style.borderColor='transparent';d.style.transform='scale(1)';});
  el.style.borderColor='var(--orange)';
  el.style.transform='scale(1.1)';
};
function saveProduct(){
  var prodId=document.getElementById('prodId').value;
  var isEdit=!!prodId;
  var originalProduct=isEdit?getById(PRODUCTS,prodId):null;
  function getAdditionalImages(){
    try{
      return JSON.parse(document.getElementById('prodImages').value)||[];
    }catch(e){
      return [];
    }
  }
  var brandSel=document.getElementById('prodBrand');
  var brandOther=document.getElementById('prodBrandOther');
  var data={
    name:document.getElementById('prodName').value.trim(),
    brand: brandSel.value==='__other__'?(brandOther?brandOther.value.trim():''):brandSel.value,
    sub:document.getElementById('prodDescription').value.trim().substring(0,60)||null,
    description:document.getElementById('prodDescription').value.trim()||null,
    price:parseInt(document.getElementById('prodPrice').value.replace(/[^0-9]/g,''))||0,
    stock:parseInt(document.getElementById('prodStock').value)||0,
    condition:document.getElementById('prodCondition').value||'Nuevo',
    type:document.getElementById('prodType').value||'celular',
    color:window._adminColorCircleSelected||document.getElementById('prodColor').value.trim(),
    screen:parseFloat(document.getElementById('prodScreen').value)||null,
    storage:document.getElementById('prodStorage').value||null,
    ram:document.getElementById('prodRam').value||null,
    battery:document.getElementById('prodType').value==='laptop'||document.getElementById('prodType').value==='desktop'?null:(parseInt(document.getElementById('prodBattery').value)||null),
    processor:document.getElementById('prodType').value==='laptop'||document.getElementById('prodType').value==='desktop'?(document.getElementById('prodProcessor').value.trim()||null):null,
    imei:document.getElementById('prodImei').value.trim()||null,
    imageUrl:document.getElementById('prodImageUrl').value.trim()||null,
    images:getAdditionalImages(),
    ico:originalProduct?originalProduct.ico:'\uD83D\uDCF1',
    cost:0
  };
  if(!data.name||!data.price){
    showAlert('Campos requeridos', 'Nombre y precio son requeridos', 'warning');
    return;
  }
  console.log('Saving product:', {isEdit:isEdit, prodId:prodId, data:data});
  var method=isEdit?'PUT':'POST';
  var url=isEdit?API_URL+'/api/products/'+prodId:API_URL+'/api/products';
  fetch(url,{
    method:method,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).then(function(r){
    if(!r.ok)throw new Error('Error '+r.status);
    return r.json();
  }).then(function(result){
    if(result.error||result.success===false){
      var errMsg=result.message||'Error de validación';
      if(result.errors){
        errMsg+='\n'+Object.entries(result.errors).map(function(e){return e[0]+': '+e[1];}).join('\n');
      }
      throw new Error(errMsg);
    }
    nav('admin');
    loadProducts();
    showSuccessToast(isEdit?'Producto actualizado':'Producto agregado', 'Los cambios han sido guardados');
  }).catch(function(e){showErrorToast('Error', e.message || 'No se pudo guardar el producto');});
}
function editProduct(id){
  var p=getById(PRODUCTS,id);
  if(!p)return;
  document.getElementById('prodId').value=p.id;
  document.getElementById('prodName').value=p.name||'';
  // Dynamically populate brand select with all existing brands
  var brandSel=document.getElementById('prodBrand');
  var brands=getUniqueBrands();
  var currentBrand=p.brand||'';
  var brandOpts='<option value="">Seleccioná marca...</option>'+brands.map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('')+'<option value="__other__">Otra...</option>';
  brandSel.innerHTML=brandOpts;
  var otherInput=document.getElementById('prodBrandOther');
  if(!otherInput){
    otherInput=document.createElement('input');
    otherInput.className='inp-f';
    otherInput.id='prodBrandOther';
    otherInput.placeholder='Escribí la marca';
    otherInput.style.display='none';
    otherInput.style.marginTop='6px';
    brandSel.parentNode.appendChild(otherInput);
  }
  if(brands.indexOf(currentBrand)!==-1){
    brandSel.value=currentBrand;
    otherInput.style.display='none';
  }else if(currentBrand){
    brandSel.value='__other__';
    otherInput.value=currentBrand;
    otherInput.style.display='block';
  }else{
    brandSel.value='';
    otherInput.style.display='none';
  }
  brandSel.onchange=function(){
    if(brandSel.value==='__other__'){otherInput.style.display='block';otherInput.focus();}
    else{otherInput.style.display='none';}
  };
  document.getElementById('prodDescription').value=p.description||'';
  document.getElementById('prodPrice').value=p.price||'';
  document.getElementById('prodStock').value=p.stock||'';
  document.getElementById('prodCondition').value=p.condition||'Nuevo';
  document.getElementById('prodType').value=p.type||'celular';
  document.getElementById('prodColor').value=p.color||'';
  // Color circles for iPhone models in admin edit
  var prodModelName=p.modelGroup||p.name||'';
  var prodColors=window.MODEL_COLORS&&window.MODEL_COLORS[prodModelName];
  var colorField=document.getElementById('prodColor');
  var colorContainer=document.getElementById('adminColorContainer');
  if(!colorContainer){
    colorContainer=document.createElement('div');
    colorContainer.id='adminColorContainer';
    colorContainer.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:6px';
    colorField.parentNode.appendChild(colorContainer);
  }
  if(prodColors&&prodColors.length){
    colorField.style.display='none';
    colorContainer.style.display='flex';
    var hexMap=window.COLOR_HEX||{};
    window._adminColorCircleSelected=p.color||'';
    colorContainer.innerHTML=prodColors.map(function(c){
      var hex=hexMap[c]||'#ccc';
      var isSelected=c===p.color;
      return '<div onclick="selectAdminColor(\''+c.replace(/'/g,"\\'")+'\',this)" style="width:32px;height:32px;border-radius:50%;background:'+hex+';cursor:pointer;border:3px solid '+(isSelected?'var(--orange)':'transparent')+';transition:all .15s;box-shadow:0 2px 6px rgba(0,0,0,.12);flex-shrink:0" title="'+c+'"></div>'
    }).join('');
  }else{
    colorField.style.display='';
    colorContainer.style.display='none';
  }
  document.getElementById('prodScreen').value=p.screen||'';
  document.getElementById('prodStorage').value=p.storage||'';
  document.getElementById('prodRam').value=p.ram||'';
  document.getElementById('prodBattery').value=p.battery||'';
  document.getElementById('prodProcessor').value=p.processor||'';
  document.getElementById('prodImei').value=p.imei||'';
  updateProductFields();
  
  document.getElementById('prodImageUrl').value=p.imageUrl||'';
  if(p.imageUrl){
    document.getElementById('prodImagePreview').innerHTML='<img loading="lazy" src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
  }else{
    document.getElementById('prodImagePreview').innerHTML='📷';
  }
  window.additionalImages=p.images||[];
  document.getElementById('prodImages').value=JSON.stringify(window.additionalImages);
  var container=document.getElementById('prodAdditionalImages');
  if(window.additionalImages.length>0){
    container.innerHTML='';
    window.additionalImages.forEach(function(url,i){
      renderAdditionalImage(url,i);
    });
  }else{
    container.innerHTML='<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>';
  }
  isEditingProduct=true;
  nav('admin-product');
  // Fetch variants for this product on demand
  var vs=document.getElementById('variantsSection');
  var vl=document.getElementById('variantsList');
  if(vs&&vl){
    vs.style.display='block';
    vl.innerHTML='<div style="text-align:center;padding:10px;color:var(--gray);font-size:12px">Cargando variantes...</div>';
    fetch(API_URL+'/api/inventory?productId='+p.id+'&limit=50').then(function(r){return r.json();}).then(function(res){
      var vc=res.data||res||[];
      if(vc.length>0){
        vl.innerHTML=vc.map(function(v){
          var statusColor=v.status==='SOLD'?'var(--red)':v.status==='IN_REPAIR'?'var(--orange)':v.status==='RESERVED'?'var(--blue,#3B82F6)':v.status==='ON_HOLD'?'#A855F7':'var(--green)';
          var statusLabel=v.status==='IN_STOCK'?'En stock':v.status==='SOLD'?'Vendido':v.status==='IN_REPAIR'?'Reparación':v.status==='RESERVED'?'Reservado':v.status==='ON_HOLD'?'Espera':v.status;
          var qrBtn='';
          if(v.qrCode){
            qrBtn='<button onclick="downloadQrCode(\''+v.qrCode+'\',\''+v.code+'\')" title="Descargar QR" style="padding:6px 10px;border:none;border-radius:8px;background:#1A1A2E;color:#fff;cursor:pointer;font-size:10px;font-weight:700;letter-spacing:.5px;display:inline-flex;align-items:center;gap:4px;flex-shrink:0;text-transform:uppercase">⬇ QR</button>';
          }
        }).join('');
      }else{
        vl.innerHTML='<div style="font-size:12px;color:var(--gray);padding:10px;text-align:center">Sin variantes. Agregá IMEIs para este producto.</div>';
      }
    }).catch(function(){
      vl.innerHTML='<div style="font-size:12px;color:var(--red);padding:10px;text-align:center">Error al cargar variantes</div>';
    });
  }
}
window.downloadProductQr=function(productId){
  fetch(API_URL+'/api/inventory?productId='+productId+'&limit=5').then(function(r){return r.json();}).then(function(res){
    var items=res.data||res;
    if(!items||items.length===0){showInfoToast('Sin QR','Este producto no tiene variantes con QR');return;}
    var item=items[0];
    if(item.qrCode){
      showQrDownloadModal(item.qrCode,item.code,item.brand+' '+item.modelName);
    }else{
      showInfoToast('Sin QR','La variante de este producto no tiene código QR generado');
    }
  }).catch(function(){showErrorToast('Error','No se pudo obtener el QR del producto');});
};
window.downloadQrCode=function(qrDataUrl,code){
  var link=document.createElement('a');
  link.href=qrDataUrl;
  link.download='qr-'+code+'.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
window.showQrDownloadModal=function(qrDataUrl,code,label){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  overlay.innerHTML='<div style="background:#fff;border-radius:20px;padding:32px;max-width:360px;width:90%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.3);position:relative">'+
    '<button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:none;background:var(--cream2);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--gray)">✕</button>'+
    '<div style="font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:4px">QR del dispositivo</div>'+
    '<div style="font-size:12px;color:#888;margin-bottom:20px">'+(label||code)+'</div>'+
    '<div style="background:#F5F0EB;border-radius:16px;padding:20px;display:inline-block;margin-bottom:20px">'+
      '<img src="'+qrDataUrl+'" alt="QR" style="width:200px;height:200px;display:block">'+
    '</div>'+
    '<div style="font-size:11px;color:var(--gray);margin-bottom:16px">Código: <strong style="color:#FF6B2C">'+code+'</strong></div>'+
    '<button onclick="downloadQrCode(\''+qrDataUrl+'\',\''+code+'\')" style="width:100%;padding:14px;background:#1A1A2E;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">⬇ Descargar QR</button>'+
    '<div style="font-size:10px;color:#ccc;margin-top:12px">Imprimí y pegá en la caja del dispositivo</div>'+
  '</div>';
  document.body.appendChild(overlay);
};
function getUniqueBrands(){
  var brands={};
  (PRODUCTS||[]).forEach(function(p){if(p.brand)brands[p.brand]=true;});
  return Object.keys(brands).sort();
}
function uploadProductImage(input){
  var file=input.files[0];
  if(!file)return;
  validateImageFile(file, function(ok){
    if(!ok)return;
    var preview=document.getElementById('prodImagePreview');
    preview.innerHTML='<span style="font-size:12px">Subiendo...</span>';
    var formData=new FormData();
    formData.append('file',file);
    fetch(API_URL+'/api/upload',{
    method:'POST',
    body:formData
  }).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      document.getElementById('prodImageUrl').value=data.url;
      preview.innerHTML='<img loading="lazy" src="'+data.url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    }else{
      preview.innerHTML='📷';
      showErrorToast('Error', 'No se pudo subir la imagen');
    }
  }).catch(function(){
    preview.innerHTML='📷';
    showErrorToast('Error', 'No se pudo subir la imagen');
  });
  });
}
function handleImageDrop(event){
  var file=event.dataTransfer.files[0];
  if(!file||!file.type.startsWith('image/')){
    showWarningToast('Formato inválido', 'Por favor arrastra una imagen');
    return;
  }
  var preview=document.getElementById('prodImagePreview');
  preview.innerHTML='<span style="font-size:12px">Subiendo...</span>';
  var formData=new FormData();
  formData.append('file',file);
  fetch(API_URL+'/api/upload',{
    method:'POST',
    body:formData
  }).then(function(r){return r.json();}).then(function(data){
    if(data.url){
      document.getElementById('prodImageUrl').value=data.url;
      preview.innerHTML='<img loading="lazy" src="'+data.url+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px">';
    }else{
      preview.innerHTML='📷';
      showErrorToast('Error', 'No se pudo subir la imagen');
    }
  }).catch(function(){
    preview.innerHTML='📷';
    showErrorToast('Error', 'No se pudo subir la imagen');
  });
}
var additionalImages=[];
function uploadAdditionalImages(input){
  var files=input.files;
  if(!files||files.length===0)return;
  Array.from(files).forEach(function(file){
    validateImageFile(file, function(ok){
      if(!ok)return;
      var container=document.getElementById('prodAdditionalImages');
      var placeholder=document.getElementById('addImgPlaceholder');
      if(placeholder)placeholder.remove();
      var formData=new FormData();
      formData.append('file',file);
      fetch(API_URL+'/api/upload',{
      method:'POST',
      body:formData
    }).then(function(r){return r.json();}).then(function(data){
      if(data.url){
        additionalImages.push(data.url);
        document.getElementById('prodImages').value=JSON.stringify(additionalImages);
        renderAdditionalImage(data.url,additionalImages.length-1);
      }
    }).catch(function(e){console.error('Error uploading image:',e);if(typeof showErrorToast==='function')showErrorToast('Error','No se pudo subir la imagen');});
    });
  });
  input.value='';
}
function renderAdditionalImage(url,index){
  var container=document.getElementById('prodAdditionalImages');
  var div=document.createElement('div');
  div.style.cssText='position:relative;width:60px;height:60px;flex-shrink:0';
  div.innerHTML='<img loading="lazy" src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px"><button onclick="removeAdditionalImage('+index+')" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:var(--red);color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;line-height:1">×</button>';
  container.appendChild(div);
}
function removeAdditionalImage(index){
  additionalImages.splice(index,1);
  document.getElementById('prodImages').value=JSON.stringify(additionalImages);
  var container=document.getElementById('prodAdditionalImages');
  container.innerHTML=additionalImages.length===0?'<div id="addImgPlaceholder" style="color:var(--gray);font-size:11px;padding:10px">Arrastra imagenes adicionales aqui</div>':'';
  additionalImages.forEach(function(url,i){
    renderAdditionalImage(url,i);
  });
}
var pendingDeleteId=null;
function closeConfirm(){
  document.getElementById('confirmOverlay').style.display='none';
  pendingDeleteId=null;
}
function confirmAction(confirmed){
  if(window.confirmCallback){window.confirmCallback(confirmed);}
  if(confirmed&&pendingDeleteId){var p=getById(PRODUCTS,pendingDeleteId);var pname=p?p.name:'este producto';
    fetch(API_URL+'/api/products/'+pendingDeleteId,{method:'DELETE'}).then(function(r){if(!r.ok)throw new Error('Error del servidor');loadProducts();showSuccessToast('Producto eliminado', pname);}).catch(function(e){showErrorToast('Error',e.message||'No se pudo eliminar el producto');});}
  closeConfirm();
}
function showAddProductByImeiModal(){
  showImeiProductModal(null);
}
function showImeiProductModal(existingProductId){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px';
  overlay.onclick=function(e){if(e.target===overlay)closeModal();};

  var modal=document.createElement('div');
  modal.style.cssText='background:#fff;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3);position:relative';
  modal.onclick=function(e){e.stopPropagation();};
  if(!existingProductId)modal.scrollTop=0;

  var loadingProduct=false, imeiData=null;

  var brandOptions=getUniqueBrands().map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('');
  var html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="font-size:20px;font-weight:700;color:var(--dk)">'+(existingProductId?'Agregar variante':'Nuevo producto por IMEI')+'</h3><button onclick="document.getElementById(\'imeiModalOverlay\').remove()" style="width:32px;height:32px;border-radius:8px;border:none;background:var(--cream2);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--gray)">✕</button></div>'+
    '<div style="margin-bottom:16px"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;color:var(--gray)">IMEI del dispositivo</label>'+
    '<div style="display:flex;gap:8px"><input type="text" id="imeiInput" maxlength="15" placeholder="Ingresá o escaneá el IMEI de 15 dígitos" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')" style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none">'+
    '<button id="imeiLookupBtn" onclick="lookupImei()" style="padding:10px 20px;background:var(--orange);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">Buscar</button>'+
    '<button onclick="startImeiScanner()" title="Escaneá el código QR" style="width:44px;height:44px;border-radius:10px;background:var(--cream2);border:1.5px solid var(--border);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center">📷</button></div>'+
    '<div id="imeiError" style="display:none;font-size:12px;color:var(--red);margin-top:6px"></div></div>'+
    '<div id="imeiResult" style="display:none"></div>'+
    '<div id="imeiForm" style="display:none">'+
      '<div id="imeiFormFields" style="display:grid;gap:14px;margin-top:16px">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Marca</label><select class="imei-fld" id="if-brand" onchange="toggleImeiBrandOther()"><option value="">Seleccioná marca...</option>'+brandOptions+'<option value="__other__">Otra...</option></select><input class="imei-fld" id="if-brand-other" placeholder="Escribí la marca" style="display:none;margin-top:6px"></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Modelo</label><input class="imei-fld" id="if-modelName"></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Almacenamiento</label><select class="imei-fld" id="if-storage"><option value="">—</option><option value="64 GB">64 GB</option><option value="128 GB">128 GB</option><option value="256 GB">256 GB</option><option value="512 GB">512 GB</option><option value="1 TB">1 TB</option></select></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Color</label><input class="imei-fld" id="if-color" placeholder="Ej: Graphite" style="display:none"><div id="imeiColorContainer" style="display:none;min-height:36px"></div></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">RAM</label><select class="imei-fld" id="if-ram"><option value="">—</option><option value="4 GB">4 GB</option><option value="6 GB">6 GB</option><option value="8 GB">8 GB</option><option value="12 GB">12 GB</option><option value="16 GB">16 GB</option></select></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Tipo</label><select class="imei-fld" id="if-type"><option value="celular">Celular</option><option value="laptop">Laptop</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Condición</label><select class="imei-fld" id="if-condition"><option value="Nuevo">Nuevo</option><option value="Impecable">Impecable</option><option value="Muy bueno">Muy bueno</option><option value="Bueno">Bueno</option></select></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Pantalla</label><select class="imei-fld" id="if-screen"><option value="">—</option><option value="4.7">4.7"</option><option value="5.4">5.4"</option><option value="5.8">5.8"</option><option value="6.1">6.1"</option><option value="6.3">6.3"</option><option value="6.5">6.5"</option><option value="6.7">6.7"</option><option value="6.9">6.9"</option><option value="7.6">7.6"</option><option value="13.3">13.3"</option><option value="14">14"</option><option value="15.6">15.6"</option><option value="16">16"</option></select></div>'+
        '</div>'+
        '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px">'+
          '<div style="font-size:12px;font-weight:600;color:var(--gray);margin-bottom:10px">📸 Imagen del producto</div>'+
          '<div style="display:flex;gap:12px;align-items:start">'+
            '<div id="imeiImgPreview" style="width:100px;height:100px;border-radius:10px;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-size:36px;border:2px dashed var(--border);flex-shrink:0;overflow:hidden">📷</div>'+
            '<div><label style="display:inline-block;padding:8px 16px;background:var(--orange);color:#fff;border-radius:8px;font-size:12px;cursor:pointer">Subir imagen<input type="file" accept="image/*" style="display:none" onchange="uploadImeiProductImage(this)"></label>'+
            '<input type="hidden" id="imeiImgUrl"></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:14px">'+
        '<div style="font-size:12px;font-weight:600;color:var(--gray);margin-bottom:10px">💰 Datos del negocio</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Precio de venta *</label><input class="imei-fld" id="if-price" type="text" placeholder="Ej: 950000" oninput="formatPriceInput(this)"></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Precio de compra</label><input class="imei-fld" id="if-cost" type="text" placeholder="Ej: 720000" oninput="formatPriceInput(this)"></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Batería (%)</label><input class="imei-fld" id="if-battery" type="number" min="0" max="100" placeholder="89"></div>'+
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Proveedor / Comprado a</label><input class="imei-fld" id="if-purchasedFrom" placeholder="Ej: iShop BA"></div>'+
        '</div>'+
        '<div style="margin-top:12px"><label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--gray)">Notas / Estado funcional</label><textarea class="imei-fld" id="if-notes" placeholder="Ej: Pantalla rayada, funciona perfecto" style="height:60px;resize:none"></textarea></div>'+
      '</div>'+
      '<div style="display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">'+
        '<button id="imeiSaveBtn" onclick="saveImeiProduct(\''+(existingProductId||'')+'\')" style="flex:1;padding:12px;background:var(--orange);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Guardar producto</button>'+
        '<button onclick="document.getElementById(\'imeiModalOverlay\').remove()" style="padding:12px 24px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:10px;font-size:14px;cursor:pointer">Cancelar</button>'+
      '</div>'+
    '</div>';

  modal.innerHTML=html;
  overlay.id='imeiModalOverlay';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Add input styles
  var style=document.createElement('style');
  style.textContent='.imei-fld{width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;background:#fff}.imei-fld:focus{border-color:var(--orange)}';
  document.head.appendChild(style);

  window.toggleImeiBrandOther=function(){
    var sel=document.getElementById('if-brand');
    var other=document.getElementById('if-brand-other');
    if(sel.value==='__other__'){
      other.style.display='block';
      other.focus();
    }else{
      other.style.display='none';
    }
  };

  // If editing existing product, pre-fill and skip IMEI step
  if(existingProductId){
    var p=getById(PRODUCTS,existingProductId);
    if(p){
      document.getElementById('imeiInput').value='';
      document.getElementById('imeiInput').disabled=true;
      document.getElementById('imeiLookupBtn').style.display='none';
      var brandSel=document.getElementById('if-brand');
      if(brandSel.querySelector('option[value="'+p.brand+'"]')){
        brandSel.value=p.brand||'';
      }else{
        brandSel.value='__other__';
        document.getElementById('if-brand-other').value=p.brand||'';
        document.getElementById('if-brand-other').style.display='block';
      }
      document.getElementById('if-modelName').value=p.name||'';
      document.getElementById('if-storage').value=p.storage||'';
      document.getElementById('if-color').value=p.color||'';
      document.getElementById('if-ram').value=p.ram||'';
      document.getElementById('if-screen').value=p.screen||'';
      document.getElementById('if-type').value=p.type||'celular';
      document.getElementById('if-condition').value=p.condition||'Impecable';
      document.getElementById('if-price').value=p.price||'';
      document.getElementById('if-cost').value=p.cost||'';
      document.getElementById('if-battery').value=p.battery||'';
      document.getElementById('imeiResult').style.display='block';
      document.getElementById('imeiResult').innerHTML='<div style="padding:10px 14px;background:var(--cream2);border-radius:8px;font-size:13px;color:var(--gray)">📱 Agregando variante a <strong>'+p.name+'</strong></div>';
      document.getElementById('imeiForm').style.display='block';
    }
  }

  // Global helper functions for this modal
  window.renderImeiColorSwatches=function(modelName,preselectColor){
    var container=document.getElementById('imeiColorContainer');
    if(!container)return;
    var colors=(window.MODEL_COLORS&&window.MODEL_COLORS[modelName])||[];
    var hexMap=window.COLOR_HEX||{};
    if(!colors.length){container.style.display='none';return;}
    container.style.display='flex';
    container.style.gap='8px';
    container.style.flexWrap='wrap';
    container.innerHTML=colors.map(function(c){
      var hex=hexMap[c]||'#ccc';
      var isSelected=c===preselectColor;
      return '<div onclick="selectImeiColor(\''+c.replace(/'/g,"\\'")+'\',this)" style="width:32px;height:32px;border-radius:50%;background:'+hex+';cursor:pointer;border:3px solid '+(isSelected?'var(--orange)':'transparent')+';transition:all .15s;box-shadow:0 2px 6px rgba(0,0,0,.12);flex-shrink:0" title="'+c+'"></div>'
    }).join('');
    if(preselectColor)window._imeiSelectedColor=preselectColor;
  };
  window.selectImeiColor=function(color,el){
    window._imeiSelectedColor=color;
    document.querySelectorAll('#imeiColorContainer > div').forEach(function(d){d.style.borderColor='transparent';});
    el.style.borderColor='var(--orange)';
  };
  window.lookupImei=function(){
    var input=document.getElementById('imeiInput');
    var imei=input.value.trim();
    if(imei.length!==15){
      document.getElementById('imeiError').style.display='block';
      document.getElementById('imeiError').textContent='El IMEI debe tener exactamente 15 dígitos';
      return;
    }
    document.getElementById('imeiError').style.display='none';
    var btn=document.getElementById('imeiLookupBtn');
    btn.textContent='Buscando...';
    btn.disabled=true;

    fetch(API_URL+'/api/inventory/lookup-imei',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({imei:imei})
    }).then(function(r){return r.json();}).then(function(data){
      btn.textContent='Buscar';
      btn.disabled=false;
      if(data.error){
        document.getElementById('imeiError').style.display='block';
        document.getElementById('imeiError').textContent=data.error;
        document.getElementById('imeiForm').style.display='block';
        return;
      }
      imeiData=data;
      var brandSel=document.getElementById('if-brand');
      if(brandSel.querySelector('option[value="'+data.brand+'"]')){
        brandSel.value=data.brand||'';
      }else{
        brandSel.value='__other__';
        document.getElementById('if-brand-other').value=data.brand||'';
        document.getElementById('if-brand-other').style.display='block';
      }
      document.getElementById('if-modelName').value=data.modelName||'';
      document.getElementById('if-storage').value=data.storage||'';
      document.getElementById('if-color').value=data.color||'';
      document.getElementById('if-ram').value=data.ram||'';
      document.getElementById('if-screen').value=data.screen||'';
      document.getElementById('if-type').value=data.deviceType||'celular';
      if(data.imageUrl){
        document.getElementById('imeiImgPreview').innerHTML='<img loading="lazy" src="'+data.imageUrl+'" style="width:100%;height:100%;object-fit:cover">';
      }
      document.getElementById('imeiResult').style.display='block';
      document.getElementById('imeiResult').innerHTML='<div style="padding:10px 14px;background:rgba(34,197,94,.1);border-radius:8px;font-size:13px;color:var(--green)">✅ Datos obtenidos del IMEI. Revisá y editá si es necesario.</div>';

      // Color circles for iPhone models
      window._imeiSelectedColor=null;
      var imeiModel=data.modelName||'';
      var isIphone=window.SELL_MODELS&&window.SELL_MODELS['iPhone']&&window.SELL_MODELS['iPhone'].indexOf(imeiModel)>=0;
      var modelColors=isIphone&&window.MODEL_COLORS&&window.MODEL_COLORS[imeiModel];
      if(modelColors&&modelColors.length){
        document.getElementById('if-color').style.display='none';
        renderImeiColorSwatches(imeiModel,data.color);
        document.getElementById('imeiColorContainer').style.display='flex';
      }else{
        document.getElementById('if-color').style.display='';
        document.getElementById('imeiColorContainer').style.display='none';
      }

      document.getElementById('imeiForm').style.display='block';
      document.getElementById('imeiInput').disabled=true;
      btn.style.display='none';
      var m=document.getElementById('imeiModalOverlay');if(m)m.querySelector('[style*="overflow-y:auto"]').scrollTop=0;
    }).catch(function(){
      btn.textContent='Buscar';
      btn.disabled=false;
      document.getElementById('imeiError').style.display='block';
      document.getElementById('imeiError').textContent='Error al consultar el IMEI. Completá los datos manualmente.';
      document.getElementById('imeiForm').style.display='block';
    });
  };

  window.abrirScannerQR=function(opts){
    opts=opts||{};
    var onDetected=opts.onDetected||function(){};
    var mode=opts.mode||'qr';
    var isBarcode=mode==='barcode';
    var frameW=isBarcode?360:260;
    var frameH=isBarcode?200:260;
    var texto=isBarcode?'Apuntá al código de barras del dispositivo':'Apuntá al código QR del dispositivo';
    var overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML=
      '<video id="qrScannerVideo" playsinline muted style="position:absolute;width:100%;height:100%;object-fit:cover"></video>'+
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">'+
        '<div style="position:relative;width:'+frameW+'px;height:'+frameH+'px">'+
          '<div style="position:absolute;inset:0;border-radius:'+(isBarcode?12:20)+'px;border:2px solid rgba(255,107,44,.7);box-shadow:0 0 0 9999px rgba(0,0,0,.55)"></div>'+
          '<div class="qrscan-line" style="position:absolute;left:16px;right:16px;height:2px;background:#FF6B2C;box-shadow:0 0 16px #FF6B2C;border-radius:2px;animation:qrscanMove 2s ease-in-out infinite"></div>'+
        '</div>'+
        '<div style="color:#fff;font-size:14px;margin-top:28px;text-align:center;opacity:.85">'+texto+'</div>'+
        '<div id="qrStatusText" style="color:rgba(255,255,255,.5);font-size:12px;margin-top:8px"></div>'+
      '</div>'+
      '<button id="qrScannerCancel" style="position:absolute;bottom:48px;left:50%;transform:translateX(-50%);padding:12px 28px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;pointer-events:auto;backdrop-filter:blur(8px);z-index:10">Cancelar</button>'+
      '<button id="qrScannerBack" style="position:absolute;top:16px;left:16px;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:20px;cursor:pointer;pointer-events:auto;z-index:10;display:flex;align-items:center;justify-content:center">←</button>'+
      '<canvas id="qrScannerCanvas" style="display:none"></canvas>'+
      '<style>@keyframes qrscanMove{0%{top:24px}50%{top:calc(100% - 24px)}100%{top:24px}}</style>';
    document.body.appendChild(overlay);

    var video=document.getElementById('qrScannerVideo');
    var canvas=document.getElementById('qrScannerCanvas');
    var statusEl=document.getElementById('qrStatusText');
    var detenido=false;

    function limpiar(){
      if(detenido)return;
      detenido=true;
      if(window.Quagga){try{Quagga.stop();}catch(e){}}
      if(html5QrCode){try{html5QrCode.stop().catch(function(){/* cleanup, ignore errors */});}catch(e){}}
      if(video.srcObject){video.srcObject.getTracks().forEach(function(t){t.stop();});}
      overlay.remove();
    }

    document.getElementById('qrScannerCancel').onclick=limpiar;
    document.getElementById('qrScannerBack').onclick=limpiar;

    // ---- Barcode detection setup ----
    var barcodeDetector=null;
    var usandoQuagga=false;
    var detectando=false;
    var ultimaDetect=0;
    var ultimoImei='';
    var imeiCount=0;

    function initBarcodeDetector(){
      if(!window.BarcodeDetector)return false;
      try{
        barcodeDetector=new BarcodeDetector({formats:['code_128','code_39','ean_13','ean_8','upc_a']});
        return true;
      }catch(e){
        var list=['code_128','ean_13','code_39','ean_8','upc_a'];
        for(var i=0;i<list.length;i++){
          try{barcodeDetector=new BarcodeDetector({formats:[list[i]]});return true;}catch(e2){}
        }
        return false;
      }
    }

    // ---- Luhn validation para IMEI ----
    function luhnValido(n){
      var s=0,a=false;
      for(var i=n.length-1;i>=0;i--){
        var v=parseInt(n[i],10);
        if(a){v*=2;if(v>9)v-=9;}
        s+=v;a=!a;
      }
      return s%10===0;
    }

    function procesarDigitos(raw){
      var d=raw.replace(/[^0-9]/g,'');
      var len=d.length;
      if(len>=14&&len<=16){
        var imei=d.substring(0,15);
        if(imei===ultimoImei){
          imeiCount++;
          if(imeiCount<2){
            if(statusEl)statusEl.textContent='Verificando... ('+imeiCount+'/2)';
            return false;
          }
        }else{
          ultimoImei=imei;
          imeiCount=1;
        }
        if(luhnValido(imei)){
          limpiar();onDetected({type:'imei',imei:imei,raw:raw});return true;
        }
        if(len===14){
          for(var cd=0;cd<=9;cd++){
            var test=d+cd;
            if(luhnValido(test)){limpiar();onDetected({type:'imei',imei:test,raw:raw});return true;}
          }
        }
        if(statusEl)statusEl.textContent='Leyendo... '+d;
      }
      return false;
    }

    // ---- Quagga (fallback obsoleto, ya no se usa) ----
    function escanearQuagga(){
      if(detenido||!window.Quagga)return;
      if(statusEl)statusEl.textContent='Alineá el código de barras';
      usandoQuagga=true;
      video.style.display='none';
      Quagga.init({
        inputStream:{name:"Live",type:"LiveStream",target:overlay,
          constraints:{width:{min:640,ideal:1280},height:{min:480,ideal:720},facingMode:"environment"}
        },
        decoder:{readers:["code_128_reader","code_39_reader","ean_reader"]},
        locator:{patchSize:"medium"},
        frequency:5,
        debug:false
      },function(err){
        if(detenido)return;
        if(err){
          if(statusEl)statusEl.textContent='Error al iniciar escáner';
          return;
        }
        Quagga.start();
      });
      Quagga.onDetected(function(result){
        if(detenido)return;
        procesarDigitos(result.codeResult.code);
      });
    }

    // ---- Html5Qrcode (fallback principal para iOS/Safari) ----
    var html5QrCode=null;
    function escanearHtml5Qrcode(){
      if(detenido)return;
      if(statusEl)statusEl.textContent='Cargando escáner...';
      if(window.Html5Qrcode){
        iniciarHtml5Qrcode();
        return;
      }
      var sc=document.createElement('script');
      sc.src='https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      sc.onload=function(){
        if(detenido)return;
        iniciarHtml5Qrcode();
      };
      sc.onerror=function(){
        showErrorToast('Error','No se pudo cargar el escáner');
        limpiar();
      };
      document.head.appendChild(sc);
    }
    function iniciarHtml5Qrcode(){
      if(detenido)return;
      video.style.display='none';
      var frame=overlay.querySelector('div[style*="pointer-events:none"]');
      if(frame)frame.style.display='none';
      var readerDiv=document.getElementById('html5qr-reader');
      if(!readerDiv){
        readerDiv=document.createElement('div');
        readerDiv.id='html5qr-reader';
        readerDiv.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
        overlay.insertBefore(readerDiv,overlay.firstChild);
      }
      html5QrCode=new Html5Qrcode('html5qr-reader');
      var config={
        fps:20,
        qrbox:{width:320,height:180},
        aspectRatio:1.777,
      };
      html5QrCode.start(
        {facingMode:'environment'},
        config,
        function(decodedText){
          if(detenido)return;
          procesarDigitos(decodedText);
        },
        function(errorMessage){}
      ).catch(function(err){
        if(statusEl)statusEl.textContent='Error: '+err;
        // fallback: intentar sin qrbox
        html5QrCode.start({facingMode:'environment'},{fps:20},function(t){procesarDigitos(t);},function(){}).catch(function(e2){
          if(statusEl)statusEl.textContent='Error: '+e2;
        });
      });
    }

    // ---- Main scan loop ----
    function escanear(){
      if(detenido)return;
      if(video.readyState<2){requestAnimationFrame(escanear);return;}

      if(barcodeDetector){
        var ahora=Date.now();
        if(!detectando&&ahora-ultimaDetect>200){
          ultimaDetect=ahora;
          detectando=true;
          barcodeDetector.detect(video).then(function(barcodes){
            detectando=false;
            if(detenido)return;
            for(var i=0;i<barcodes.length;i++){
              if(procesarDigitos(barcodes[i].rawValue))return;
            }
            if(statusEl&&barcodes.length===0)statusEl.textContent='Buscando código de barras...';
          }).catch(function(){detectando=false;});
        }
        requestAnimationFrame(escanear);
        return;
      }

      if(!usandoQuagga){
        var ctx=canvas.getContext('2d');
        if(!ctx){requestAnimationFrame(escanear);return;}
        canvas.width=video.videoWidth;
        canvas.height=video.videoHeight;
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        try{
          var code=jsQR(imageData.data,imageData.width,imageData.height,{inversionAttempts:'dontInvert'});
          if(code&&code.data){
            var data=code.data.trim();
            var match=data.match(/\/inv\/([A-Za-z0-9-]+)/);
            if(match){limpiar();onDetected({type:'code',code:match[1],raw:data});return;}
            var d=data.replace(/[^0-9]/g,'');
            if(d.length>=14&&d.length<=16&&procesarDigitos(data))return;
          }
        }catch(e){}
      }
      requestAnimationFrame(escanear);
    }

    function iniciarCamara(){
      var constraints=isBarcode
        ? {video:{width:{min:1280,ideal:1920,max:2560},height:{min:720,ideal:1080,max:1440},facingMode:{exact:'environment'},focusMode:'continuous'}}
        : {video:{facingMode:{ideal:'environment'}}};
      navigator.mediaDevices.getUserMedia(constraints).then(function(s){
        video.srcObject=s;video.play();escanear();
      }).catch(function(){
        var fallback=isBarcode
          ? {video:{width:{min:1280,ideal:1920},height:{min:720,ideal:1080},facingMode:'environment'}}
          : {video:{facingMode:'environment'}};
        return navigator.mediaDevices.getUserMedia(fallback).then(function(s){
          video.srcObject=s;video.play();escanear();
        });
      }).catch(function(err){
        showErrorToast('Error','No se pudo acceder a la cámara: '+(err.message||''));
        limpiar();
      });
    }

    // ---- Script loading and start ----
    if(isBarcode){
      var tieneNativo=initBarcodeDetector();
      if(tieneNativo){
        if(statusEl)statusEl.textContent='Escáner listo';
        iniciarCamara();
      }else{
        escanearHtml5Qrcode();
      }
    }else{
      if(typeof jsQR==='undefined'){
        var sc=document.createElement('script');
        sc.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        sc.onload=iniciarCamara;
        document.head.appendChild(sc);
      }else{
        iniciarCamara();
      }
    }
  };

  window.startImeiScanner=function(){
    window.abrirScannerQR({
      mode:'barcode',
      onDetected:function(res){
        if(res.type==='imei'){
          var imei=res.imei;
          // Show confirmation before accepting
          var confirmDiv=document.createElement('div');
          confirmDiv.id='imeiConfirmOverlay';
          confirmDiv.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:1rem';
          confirmDiv.innerHTML='<div style="background:#fff;border-radius:16px;max-width:360px;width:100%;padding:2rem;text-align:center">'+
            '<div style="font-size:40px;margin-bottom:12px">📱</div>'+
            '<h3 style="font-size:16px;font-weight:700;margin-bottom:8px">IMEI detectado</h3>'+
            '<p style="font-size:13px;color:var(--gray);margin-bottom:16px">Verificá que el número sea correcto:</p>'+
            '<div id="imeiConfirmNumber" style="font-size:28px;font-weight:800;letter-spacing:3px;color:var(--dk);background:var(--cream2);padding:12px;border-radius:10px;margin-bottom:20px;font-family:monospace">'+imei+'</div>'+
            '<div style="display:flex;gap:8px">'+
              '<button onclick="document.getElementById(\'imeiConfirmOverlay\').remove()" style="flex:1;padding:12px;background:var(--cream2);border:1px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:var(--gray)">Reintentar</button>'+
              '<button id="imeiConfirmBtn" style="flex:1;padding:12px;background:var(--orange);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">✓ Correcto</button>'+
            '</div>'+
          '</div>';
          document.body.appendChild(confirmDiv);
          document.getElementById('imeiConfirmBtn').onclick=function(){
            document.getElementById('imeiConfirmOverlay').remove();
            window._confirmarImei(imei);
          };
        }
      }
    });
  };
  window._confirmarImei=function(imei){
    document.getElementById('imeiInput').value=imei;
    document.getElementById('imeiInput').disabled=true;
    window.lookupImei();
  };

  window.uploadImeiProductImage=function(input){
    var file=input.files[0];
    if(!file)return;
    var preview=document.getElementById('imeiImgPreview');
    preview.innerHTML='<span style="font-size:12px;color:var(--gray)">Subiendo...</span>';
    var fd=new FormData();
    fd.append('file',file);
    fetch(API_URL+'/api/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(data){
      if(data.url){
        document.getElementById('imeiImgUrl').value=data.url;
        preview.innerHTML='<img loading="lazy" src="'+data.url+'" style="width:100%;height:100%;object-fit:cover">';
      }else{
        preview.innerHTML='📷';
        showErrorToast('Error','No se pudo subir la imagen');
      }
    }).catch(function(){
      preview.innerHTML='📷';
      showErrorToast('Error','No se pudo subir la imagen');
    });
  };

  window.saveImeiProduct=function(existingId){
    var imei=document.getElementById('imeiInput').value.trim();
    var brandSel=document.getElementById('if-brand');
    var brand=brandSel.value==='__other__'?document.getElementById('if-brand-other').value.trim():brandSel.value;
    var modelName=document.getElementById('if-modelName').value.trim();
    if(!modelName&&!existingId){
      showErrorToast('Error','El nombre del modelo es requerido');
      return;
    }
    var price=parseInt((document.getElementById('if-price').value||'0').replace(/[^0-9]/g,''))||0;
    if(!price&&!existingId){
      showErrorToast('Error','El precio de venta es requerido');
      return;
    }

    var btn=document.getElementById('imeiSaveBtn');
    btn.textContent='Guardando...';
    btn.disabled=true;

    var screenVal=document.getElementById('if-screen').value;
    var productData={
      name: modelName || document.getElementById('if-modelName').value,
      brand: brand || 'Otro',
      sub: [document.getElementById('if-storage').value,window._imeiSelectedColor||document.getElementById('if-color').value].filter(Boolean).join(' / '),
      price: price,
      cost: parseInt((document.getElementById('if-cost').value||'0').replace(/[^0-9]/g,''))||0,
      condition: document.getElementById('if-condition').value,
      type: document.getElementById('if-type').value,
      storage: document.getElementById('if-storage').value || null,
      color: window._imeiSelectedColor||document.getElementById('if-color').value || null,
      ram: document.getElementById('if-ram').value || null,
      screen: screenVal?parseFloat(screenVal):null,
      battery: parseInt(document.getElementById('if-battery').value)||null,
      imageUrl: document.getElementById('imeiImgUrl').value || null,
      ico: '📱',
      stock: 1,
    };

    if(existingId){
      // Create inventory item (backend handles stock increment)
      fetch(API_URL+'/api/inventory',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          imei: imei,
          brand: brand,
          modelName: productData.name,
          storage: productData.storage,
          color: productData.color,
          ram: productData.ram,
          screen: productData.screen,
          deviceType: productData.type,
          imageUrl: document.getElementById('imeiImgUrl').value||null,
          productId: existingId,
          purchasePrice: productData.cost,
          cosmeticCondition: productData.condition,
          batteryHealth: productData.battery,
          targetPrice: productData.price,
          createdById: (Storage.get('user')||{}).id||'unknown'
        })
      }).then(function(res){
        if(!res.ok)return res.json().then(function(e){throw new Error(e.error||'Error del servidor');});
        showSuccessToast('Variante agregada','Se agregó el IMEI al producto');
        invalidateCache('/api/products');window._productsLoaded=false;loadProducts().then(function(){
          document.getElementById('imeiModalOverlay').remove();
        });
      }).catch(function(err){
        btn.textContent='Guardar producto';
        btn.disabled=false;
        showErrorToast('Error',err.message||'No se pudo guardar');
      });
    }else{
      // Create via inventory endpoint (creates product + inventory item)
      fetch(API_URL+'/api/inventory',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          imei: imei,
          brand: brand,
          modelName: productData.name,
          storage: productData.storage,
          color: productData.color,
          ram: productData.ram,
          screen: productData.screen,
          deviceType: productData.type,
          imageUrl: document.getElementById('imeiImgUrl').value||null,
          purchasePrice: productData.cost,
          cosmeticCondition: productData.condition,
          batteryHealth: productData.battery,
          targetPrice: productData.price,
          createdById: (Storage.get('user')||{}).id||'unknown'
        })
      }).then(function(res){
        if(!res.ok)return res.json().then(function(e){throw new Error(e.error||'Error del servidor');});
        return res.json().then(function(created){
          showSuccessToast('Producto creado','Se creó el producto con IMEI');
          if(created&&created.qrCode){
            showQrDownloadModal(created.qrCode, created.code, created.brand+' '+created.modelName);
          }
          invalidateCache('/api/products');window._productsLoaded=false;loadProducts().then(function(){
            document.getElementById('imeiModalOverlay').remove();
          });
        });
      }).catch(function(err){
        btn.textContent='Guardar producto';
        btn.disabled=false;
        showErrorToast('Error',err.message||'No se pudo crear');
      });
    }
  };
}

function renderAdminContent(tab){
  if(!tab)tab='prods';
  var el=document.getElementById('adminContent');
  if(!el)return;
  window.currentAdminTab=tab;
  if(tab!=='chats'){window.adminActiveConvId=null;}
  if(tab!=='dashboard'&&window._dashRefreshInterval){
    clearInterval(window._dashRefreshInterval);
    window._dashRefreshInterval=null;
  }
  
  if(tab==='acc'&&(!window.ACCS||window.ACCS.length===0)){
    loadAccessories();
  }
  
  // Reset tab buttons
  document.querySelectorAll('#adm-prods,#adm-acc,#adm-stock,#adm-promos,#adm-orders,#adm-arrep,#adm-dashboard,#adm-chat,#adm-quotes,#adm-instore').forEach(function(b){b.classList.remove('act');});
  var activeBtn=document.getElementById('adm-'+tab);
  if(activeBtn)activeBtn.classList.add('act');
  if(tab==='dashboard'){
    var months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var monthOptions=months.map(function(m,i){return'<option value="'+i+'"'+(i===new Date().getMonth()?' selected':'')+'>'+m+'</option>';}).join('');
    
    el.innerHTML='<div id="dashboard-view">'+
      '<header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:12px" class="dash-header">'+
        '<h1 style="font-size:24px;font-weight:700;color:var(--dk)">Dashboard</h1>'+
        '<div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border);border-radius:10px;padding:4px" class="dash-header-actions">'+
          '<button id="dashTabMensual" onclick="setDashView(\'mensual\')" style="padding:8px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:var(--orange);color:#fff">Mensual</button>'+
          '<button id="dashTabAnual" onclick="setDashView(\'anual\')" style="padding:8px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--gray)">Anual</button>'+
          '<select id="dashMonthSelect" onchange="updateDashMonth(this.value)" style="padding:8px 12px;border:none;border-left:1px solid var(--border);border-radius:0 8px 8px 0;font-size:13px;font-weight:600;color:var(--dk);background:transparent;outline:none;cursor:pointer">'+monthOptions+'</select>'+
        '</div>'+
      '</header>'+
      
      '<!-- KPI Cards -->'+
      '<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:2rem" class="dash-kpis">'+
        '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">'+
            '<h3 style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px" id="kpi-revenue-label">Ingresos</h3>'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(34,197,94,.1);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDCB5</div>'+
          '</div>'+
          '<div style="font-size:28px;font-weight:800;color:var(--dk);margin-bottom:6px" id="kpi-revenue">$0</div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--green);display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.1);padding:4px 8px;border-radius:6px" id="kpi-revenue-change-container"><span id="kpi-revenue-change">--</span></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">'+
            '<h3 style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px" id="kpi-orders-label">Pedidos</h3>'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(255,107,44,.1);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDED2</div>'+
          '</div>'+
          '<div style="font-size:28px;font-weight:800;color:var(--dk);margin-bottom:6px" id="kpi-orders">0</div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--green);display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.1);padding:4px 8px;border-radius:6px" id="kpi-orders-change-container"><span id="kpi-orders-change">--</span></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">'+
            '<h3 style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px" id="kpi-ticket-label">Ticket Promedio</h3>'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(59,130,246,.1);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDCCB</div>'+
          '</div>'+
          '<div style="font-size:28px;font-weight:800;color:var(--dk);margin-bottom:6px" id="kpi-ticket">$0</div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--green);display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.1);padding:4px 8px;border-radius:6px" id="kpi-ticket-change-container"><span id="kpi-ticket-change">--</span></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">'+
            '<h3 style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px" id="kpi-users-label">Nuevos Usuarios</h3>'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(168,85,247,.1);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDC64</div>'+
          '</div>'+
          '<div style="font-size:28px;font-weight:800;color:var(--dk);margin-bottom:6px" id="kpi-users">0</div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--green);display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.1);padding:4px 8px;border-radius:6px" id="kpi-users-change-container"><span id="kpi-users-change">--</span></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--border)">'+
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">'+
            '<h3 style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px" id="kpi-profit-label">Ganancia</h3>'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(45,90,39,.1);display:flex;align-items:center;justify-content:center;font-size:18px">\uD83D\uDCC8</div>'+
          '</div>'+
          '<div style="font-size:28px;font-weight:800;color:var(--green);margin-bottom:6px" id="kpi-profit">$0</div>'+
          '<div style="font-size:12px;font-weight:600;color:var(--gray);display:inline-flex;align-items:center;gap:4px" id="kpi-profit-usd">US$ 0</div>'+
        '</div>'+
      '</section>'+
      
      '<!-- Recent Orders & Top Products -->'+
      '<section style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:2rem" class="dash-row">'+
        '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);overflow:hidden">'+
          '<div style="padding:16px;border-bottom:1px solid var(--border);background:var(--cream2);display:flex;justify-content:space-between;align-items:center">'+
            '<h2 style="font-size:16px;font-weight:700">Ultimos Pedidos</h2>'+
          '</div>'+
          '<table style="width:100%;border-collapse:collapse">'+
            '<thead><tr style="border-bottom:1px solid var(--border)">'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">ID</th>'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">Cliente</th>'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">Monto</th>'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">Ganancia</th>'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">Método</th>'+
              '<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase">Estado</th>'+
            '</tr></thead>'+
            '<tbody id="dashboard-recent-orders"></tbody>'+
          '</table>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:16px">'+
          '<h2 style="font-size:16px;font-weight:700;margin-bottom:12px">Ingresos Mensuales</h2>'+
          '<div style="position:relative;height:280px"><canvas id="revenueChart"></canvas></div>'+
        '</div>'+
      '</section>'+
      
      '<!-- Payment breakdown -->'+
      '<section style="margin-bottom:2rem">'+
        '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:16px">'+
          '<h2 style="font-size:16px;font-weight:700;margin-bottom:16px">Ventas por Método de Pago</h2>'+
          '<div id="dashboard-payment-breakdown" style="display:flex;flex-direction:column;gap:12px"></div>'+
        '</div>'+
      '</section>'+
      
      '<!-- Charts Row -->'+
      '<section style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px" class="dash-charts-row">'+
        '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:16px">'+
          '<h2 style="font-size:16px;font-weight:700;margin-bottom:12px">Pedidos por Estado</h2>'+
          '<div style="position:relative;height:260px"><canvas id="statusChart"></canvas></div>'+
        '</div>'+
        '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:16px">'+
          '<h2 style="font-size:16px;font-weight:700;margin-bottom:12px">Ventas por Marca</h2>'+
          '<div style="position:relative;height:260px"><canvas id="brandChart"></canvas></div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:16px">'+
          '<div style="background:#fff;border-radius:12px;padding:16px;border:1px solid var(--border)">'+
            '<h2 style="font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)">Productos mas vendidos</h2>'+
            '<ul id="dashboard-top-products" style="list-style:none;padding:0;margin:0"></ul>'+
          '</div>'+
          '<div style="background:#fff;border-radius:12px;padding:16px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.03)">'+
            '<h2 style="font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(239,68,68,.2);display:flex;align-items:center;gap:8px">\u26A0\uFE0F Alertas de Stock</h2>'+
            '<ul id="dashboard-stock-alerts" style="list-style:none;padding:0;margin:0"></ul>'+
          '</div>'+
        '</div>'+
      '</section>'+
    '</div>';
    
    // Init state
    window.dashView='mensual';
    window.dashMonth=new Date().getMonth();
    loadDashboard();
    return;
  }
  if(tab==='prods'){
    var dolarVal=window.dolarRate||'';
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">'+
        '<h3 style="font-size:16px" id="adm-prods-title">Productos ('+PRODUCTS.length+')</h3>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
          '<input type="text" id="adminProdSearch" placeholder="🔍 Buscar por nombre..." oninput="renderAdminProductsFiltered(this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none;min-width:200px">'+
          '<button class="btn btn-g btn-sm" onclick="exportProductLog()">📥 Exportar Excel</button>'+
          '<button class="btn btn-o btn-sm" onclick="showAddProductByImeiModal()">+ Agregar producto</button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:1rem;flex-wrap:wrap">'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap" id="adm-prods-quickfilters">'+
          '<button class="ord-btn" onclick="setAdmProdFilter(\'all\',this)">Todos</button>'+
          '<button class="ord-btn" onclick="setAdmProdFilter(\'offer\',this)">Ofertas</button>'+
          '<button class="ord-btn" onclick="setAdmProdFilter(\'nostock\',this)">Sin stock</button>'+
          '<button class="ord-btn" onclick="setAdmProdFilter(\'low\',this)">Stock bajo</button>'+
        '</div>'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Ordenar por</label>'+
          '<select id="admProdsSort" onchange="renderAdminProductsFiltered(document.getElementById(\'adminProdSearch\').value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff">'+
            '<option value="name">Nombre</option>'+
            '<option value="price">Precio venta</option>'+
            '<option value="cost">Costo</option>'+
            '<option value="profit">Ganancia</option>'+
            '<option value="stock">Stock</option>'+
          '</select></div>'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Cotización USD</label>'+
          '<input type="number" id="adminDolarRate" value="'+dolarVal+'" placeholder="Ej: 1200" oninput="window.dolarRate=parseFloat(this.value)||0;localStorage.setItem(\'dolarRate\',this.value);renderAdminProductsFiltered(document.getElementById(\'adminProdSearch\').value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;width:120px;outline:none"></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px" class="admin-prods-grid" id="admin-prods-grid"></div>'+
      '<script>renderAdminProductsFiltered("");</'+'script>';
  }else if(tab==='stock'){
    var allBrands=[...new Set(PRODUCTS.map(function(p){return p.brand;}).filter(function(b){return b;}))];
    var accBrands=[...new Set((window.ACCS||[]).map(function(a){return a.brand;}).filter(function(b){return b;}))];
    var allBrandsSet=new Set(allBrands.concat(accBrands));
    var brandsHtml=Array.from(allBrandsSet).map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('');
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:12px" class="stock-filters">'+
      '<h3 style="font-size:16px">Gestion de Stock</h3>'+
      '<div style="display:flex;gap:12px;align-items:center" class="stock-actions">'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Tipo</label><select id="stockFilterType" onchange="window._stockPage=1;renderStockList()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="todos">Todos</option><option value="productos">Productos</option><option value="accesorios">Accesorios</option></select></div>'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Marca</label><select id="stockFilterBrand" onchange="window._stockPage=1;renderStockList()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff"><option value="">Todas</option>'+brandsHtml+'</select></div>'+
        '<div style="display:flex;gap:8px;align-items:flex-end"><button onclick="undoAllStock()" class="btn btn-g btn-sm">Deshacer</button><button onclick="saveAllStock()" class="btn btn-o btn-sm">Guardar</button></div>'+
      '</div>'+
    '</div>'+
    '<div style="display:grid;gap:8px" id="stockList"></div>'+
    '<div id="stockPagination"></div>';
    window._stockPage=1;
    window._stockLimit=20;
    renderStockList();
  }else if(tab==='promos'){
    var brands=[...new Set(PRODUCTS.map(function(p){return p.brand;}).filter(function(b){return b;}))];
    var accBrands=[...new Set((window.ACCS||[]).map(function(a){return a.brand;}).filter(function(b){return b;}))];
    var allBrandsSet=new Set(brands.concat(accBrands));
    var allBrands=Array.from(allBrandsSet);
    var brandsHtml=allBrands.map(function(b){return'<option value="'+b+'">'+b+'</option>';}).join('');
    el.innerHTML='<div style="margin-bottom:2rem">'+
      '<h3 style="font-size:24px;font-family:\'Playfair Display\',Georgia,serif;margin-bottom:.5rem">Crear Promoción</h3>'+
      '<p style="font-size:13px;color:var(--gray);margin-bottom:1.5rem">Diseña ofertas exclusivas para tu colección.</p>'+
      
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:1rem;background:#fff;padding:20px;border-radius:12px;border:1px solid var(--border)" class="promo-filters">'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Tipo</label><select class="sel-f" id="promoItemType" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="todos">Todos</option><option value="productos">Productos</option><option value="accesorios">Accesorios</option></select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Marca</label><select class="sel-f" id="promoBrand" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="">Todas las Marcas</option>'+brandsHtml+'</select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Categoría</label><select class="sel-f" id="promoType" onchange="renderPromoProducts()" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><option value="">Todas</option></select></div>'+
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">% Descuento</label><div style="position:relative"><input class="inp-f" id="promoDiscount" type="number" placeholder="0" min="0" max="100" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px"><span style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--orange)">%</span></div></div>'+
      '</div>'+
      
      '<div style="margin-bottom:1rem">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem" class="promo-select-actions">'+
          '<h4 style="font-size:18px;font-weight:600">Seleccionar Productos</h4>'+
          '<div style="display:flex;gap:8px">'+
            '<button onclick="selectAllPromo(true)" style="background:var(--green);color:#fff;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;border:none;cursor:pointer">Seleccionar todos</button>'+
            '<button onclick="selectAllPromo(false)" style="background:var(--cream2);color:var(--dk);padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid var(--border);cursor:pointer">Deseleccionar todos</button>'+
          '</div>'+
        '</div>'+
        '<div id="promoProductList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px" class="promo-prods-grid"></div>'+
      '</div>'+
      
      '<button onclick="applyPromo()" style="width:100%;background:var(--orange);color:#fff;padding:16px;border-radius:12px;font-size:14px;font-weight:700;border:none;cursor:pointer;margin-top:1rem">Publicar Promoción</button>'+
      
      '<div style="margin-top:3rem;border-top:1px solid var(--border);padding-top:2rem">'+
        '<h3 style="font-size:24px;font-family:\'Playfair Display\',Georgia,serif;margin-bottom:.5rem">Administrar Promociones Activas</h3>'+
        '<div style="height:4px;width:80px;background:var(--orange);border-radius:2px;margin-bottom:1.5rem"></div>'+
        '<div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border)">'+
          '<table style="width:100%;text-align:left;border-collapse:collapse">'+
            '<tbody id="activePromosTable">'+
            '</tbody>'+
          '</table>'+
        '</div>'+
        '<button onclick="deleteSelectedPromos()" style="width:100%;margin-top:12px;padding:14px;background:var(--red);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Eliminar promoción</button>'+
      '</div>'+
    '</div>';
    renderPromoProducts();
    renderActivePromos();
  }else if(tab==='orders'){
    var content=document.getElementById('adminContent');
    if(content){
      content.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center" class="ord-tabs">'+
        '<button class="ord-btn ord-btn-act" id="btnPendingOrders" onclick="loadPendingOrders()">Pedidos en Espera</button>'+
        '<button class="ord-btn" id="btnAcceptedOrders" onclick="loadAcceptedOrders()">Pedidos Aceptados</button>'+
        '<button class="ord-btn" id="btnHistoryOrders" onclick="loadOrderHistory()">Historial</button>'+
      '</div>'+
      '<div style="margin-bottom:1rem;display:flex;gap:8px;align-items:center">'+
        '<input type="text" id="orderSearchInput" placeholder="Buscar por DNI, email, nombre o código de orden..." oninput="searchOrders(this.value)" style="flex:1;max-width:500px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
      '</div>'+
      '<div class="adm-list" id="orderList"></div><div id="orderPagination"></div>';
      if(typeof loadPendingOrders==='function'){
        loadPendingOrders();
      }else{
        document.getElementById('orderList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">Cargando pedidos...</div>';
      }
    }
  }else if(tab==='acc'){
    var accs=window.ACCS||[];
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">'+
        '<h3 style="font-size:16px" id="adm-acc-title">Accesorios ('+accs.length+')</h3>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
          '<input type="text" id="adminAccSearch" placeholder="🔍 Buscar accesorio..." oninput="renderAdminAccFiltered(this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none;min-width:200px">'+
          '<button class="btn btn-o btn-sm" onclick="window.isEditingAcc=false;nav(\'admin-acc\')">+ Agregar accesorio</button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:1rem;flex-wrap:wrap">'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap" id="adm-acc-quickfilters">'+
          '<button class="ord-btn" onclick="setAdmAccFilter(\'all\',this)">Todos</button>'+
          '<button class="ord-btn" onclick="setAdmAccFilter(\'offer\',this)">Ofertas</button>'+
          '<button class="ord-btn" onclick="setAdmAccFilter(\'nostock\',this)">Sin stock</button>'+
          '<button class="ord-btn" onclick="setAdmAccFilter(\'low\',this)">Stock bajo</button>'+
        '</div>'+
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Ordenar por</label>'+
          '<select id="admAccSort" onchange="renderAdminAccFiltered(document.getElementById(\'adminAccSearch\').value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff">'+
            '<option value="name">Nombre</option>'+
            '<option value="price">Precio venta</option>'+
            '<option value="stock">Stock</option>'+
          '</select></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px" class="admin-prods-grid" id="admin-acc-grid"></div>'+
      '<script>renderAdminAccFiltered("");</'+'script>';
  }else if(tab==='arrep'){
    el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap" class="ord-tabs">'+
      '<button class="ord-btn ord-btn-act" id="arrepBtnPendientes" onclick="loadArrepPendientes()">Pendientes</button>'+
      '<button class="ord-btn" id="arrepBtnAceptados" onclick="loadArrepAceptados()">Aceptados</button>'+
      '<button class="ord-btn" id="arrepBtnRechazados" onclick="loadArrepRechazados()">Rechazados</button>'+
    '</div>'+
    '<div class="adm-list" id="arrepList">Cargando...</div>';
    loadArrepPendientes();
  }else if(tab==='chat'){
    el.innerHTML='<div style="display:flex;gap:0;height:calc(100vh - 140px);background:#fff;border-radius:12px;border:1px solid var(--border);overflow:hidden" class="admin-chat-wrap">'+
      '<div style="width:280px;border-right:1px solid var(--border);overflow-y:auto" class="chat-conv-side">'+
        '<div style="padding:14px;border-bottom:1px solid var(--border)"><h3 style="font-size:15px;font-weight:700">Conversaciones</h3></div>'+
        '<div id="adminConvList"></div>'+
      '</div>'+
      '<div style="flex:1;display:flex;flex-direction:column;background:var(--cream)" class="chat-msg-area">'+
        '<div id="adminChatHeader" style="padding:14px;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'+
          '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">'+
            '<button class="chat-back-btn" onclick="closeMobileChat()" style="display:none;padding:4px;background:transparent;border:none;cursor:pointer;font-size:20px;color:var(--gray);margin-right:4px;line-height:1">←</button>'+
            '<span id="adminChatName" style="font-size:13px;font-weight:600;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Seleccioná una conversación</span>'+
            '<span id="adminOnlineDot" style="width:6px;height:6px;border-radius:50%;background:var(--green);display:none;flex-shrink:0" title="En línea"></span>'+
          '</div>'+
          '<div style="display:flex;gap:4px;flex-shrink:0">'+
            '<button onclick="openMsgSearch()" id="adminMsgSearchBtn" title="Buscar en mensajes (Ctrl+F)" style="display:none;padding:5px 8px;font-size:11px;background:transparent;color:var(--gray);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.color=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--gray)\'">🔍</button>'+
            '<button onclick="openManageReplies()" id="adminManageRepliesBtn" title="Gestionar respuestas rápidas (Ctrl+Shift+R)" style="display:none;padding:5px 8px;font-size:11px;background:transparent;color:var(--gray);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.color=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--gray)\'">⚡</button>'+
            '<button onclick="openCreateQuoteFromChat()" id="adminQuoteBtn" title="Crear cotización desde el chat" style="display:none;padding:5px 8px;font-size:11px;background:transparent;color:var(--gray);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.color=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--gray)\'">💲</button>'+
            '<button onclick="exportConversation()" id="adminExportBtn" title="Exportar conversación (Ctrl+Shift+E)" style="display:none;padding:5px 8px;font-size:11px;background:transparent;color:var(--gray);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor=\'var(--orange)\';this.style.color=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--gray)\'">📥</button>'+
            '<button id="adminAssignConvBtn" style="display:none;padding:5px 10px;font-size:10px;background:var(--green);color:#fff;border:none;border-radius:6px;cursor:pointer">Asignar</button>'+
            '<button id="adminCloseConvBtn" style="display:none;padding:5px 10px;font-size:10px;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer">Cerrar</button>'+
          '</div>'+
        '</div>'+
        '<div id="msgSearchBar" style="display:none;padding:8px 14px;background:var(--cream2);border-bottom:1px solid var(--border)">'+
          '<div style="display:flex;gap:6px;align-items:center">'+
            '<input id="msgSearchInput" type="text" placeholder="Buscar en mensajes..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;background:#fff" onkeydown="if(event.key===\'Enter\')searchInMessages(this.value)" oninput="if(!this.value)searchInMessages(\'\')">'+
            '<button onclick="searchInMessages(document.getElementById(\'msgSearchInput\').value)" style="padding:6px 10px;background:var(--orange);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">Buscar</button>'+
            '<button onclick="closeMsgSearch()" style="padding:6px 8px;background:transparent;color:var(--gray);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:11px">✕</button>'+
          '</div>'+
        '</div>'+
        '<div class="msg-list" id="chatMsgList" style="flex:1;overflow-y:auto;padding:14px"></div>'+
        '<div id="typingIndicator" style="padding:4px 14px;font-size:11px;color:var(--gray);display:none"></div>'+
        '<div id="quickReplies" style="padding:6px 14px;background:#fff;display:none;flex-wrap:wrap;gap:4px;border-top:1px solid var(--border)"></div>'+
        '<div class="wa-chat-input-bar">'+
          '<button class="wa-attach-btn" onclick="openProductSearch()" id="adminProductBtn" title="Compartir producto">'+
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>'+
          '</button>'+
          '<div class="wa-input-wrap">'+
            '<textarea id="adminChatInput" rows="1" placeholder="Escribí un mensaje..." onkeydown="adminChatKeydown(event)" oninput="autoResizeChatInput(this);handleAdminTyping();toggleSendBtn()"></textarea>'+
          '</div>'+
          '<button class="wa-send-btn" id="adminSendBtn" onclick="sendAdminMessage()" title="Enviar">'+
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>'+
          '</button>'+
        '</div>'+
      '</div>'+
    '</div>';
    loadAdminConversations();
    initChatSocket();
  }else if(tab==='quotes'){
    el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">'+
      '<button class="ord-btn ord-btn-act" id="quoteBtnAll" onclick="loadQuotes(\'all\')">Todas</button>'+
      '<button class="ord-btn" id="quoteBtnPending" onclick="loadQuotes(\'PENDING\')">Pendientes</button>'+
      '<button class="ord-btn" id="quoteBtnApproved" onclick="loadQuotes(\'APPROVED\')">Aceptadas</button>'+
      '<button class="ord-btn" id="quoteBtnRejected" onclick="loadQuotes(\'REJECTED\')">Rechazadas</button>'+
      '<input type="text" id="quoteSearchInput" placeholder="Buscar por nombre, telefono o codigo..." oninput="searchQuotes(this.value)" style="flex:1;max-width:400px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">'+
    '</div>'+
    '<div class="adm-list" id="quoteList"></div><div id="quotePagination"></div>';
    loadQuotes('all');
  }else if(tab==='inventory'){
    el.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">📋</p><p style="font-size:16px;font-weight:600;margin-bottom:8px">El inventario ahora se gestiona desde Productos</p><p style="font-size:13px;margin-bottom:1.5rem">Agregá y administrá los IMEIs desde la sección de productos</p><button class="btn btn-o" onclick="adminTab(\'prods\',document.getElementById(\'adm-prods\'))">Ir a Productos</button></div>';
  }else if(tab==='instore'){
    el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap" class="instore-tabs">'+
      '<button class="ord-btn" id="instoreTabVenta" onclick="renderInStoreSale()">Nueva Venta</button>'+
      '<button class="ord-btn" id="instoreTabPre" onclick="renderPreOrders()">Preeventas</button>'+
      '<button class="ord-btn" id="instoreTabHist" onclick="loadInStoreHistory()">Historial</button>'+
    '</div>'+
    '<div id="instore-subview"></div>';
    renderInStoreSale();
  }
}

// =========== ADMIN PRODUCT CARDS (search + filters + full info) ===========
window.admProdFilter='all';
function setAdmProdFilter(type,btn){
  window.admProdFilter=type;
  document.querySelectorAll('#adm-prods-quickfilters .ord-btn').forEach(function(b){b.classList.remove('ord-btn-act');});
  if(btn)btn.classList.add('ord-btn-act');
  renderAdminProductsFiltered(document.getElementById('adminProdSearch').value);
}
function renderAdminProductsFiltered(q){
  var grid=document.getElementById('admin-prods-grid');
  if(!grid)return;
  q=(q||'').toLowerCase().trim();
  var sort=document.getElementById('admProdsSort')?document.getElementById('admProdsSort').value:'name';
  var list=PRODUCTS.filter(function(p){
    var matchesQ=!q||(p.name||'').toLowerCase().indexOf(q)>=0||(p.sub||'').toLowerCase().indexOf(q)>=0||(p.brand||'').toLowerCase().indexOf(q)>=0;
    if(!matchesQ)return false;
    if(window.admProdFilter==='offer')return !!p.isOffer;
    if(window.admProdFilter==='nostock')return p.stock<=0;
    if(window.admProdFilter==='low')return p.stock>0&&p.stock<=3;
    return true;
  });
  list.sort(function(a,b){
    if(sort==='price')return a.price-b.price;
    if(sort==='cost')return a.cost-b.cost;
    if(sort==='profit')return (a.price-a.cost)-(b.price-b.cost);
    if(sort==='stock')return a.stock-b.stock;
    return (a.name||'').localeCompare(b.name||'');
  });
  var title=document.getElementById('adm-prods-title');
  if(title)title.textContent='Productos ('+list.length+(q?' / '+PRODUCTS.length:'')+')';
  if(!list.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:40px;margin-bottom:.5rem">🔍</div><p>No se encontraron productos</p></div>';
    return;
  }
  grid.innerHTML=list.map(function(p){return renderAdminProductCard(p);}).join('');
}

function renderAdminProductCard(p){
  var lowStock=p.stock<=0;
  var stockColor=lowStock?'var(--red)':(p.stock<=3?'var(--orange)':'var(--green)');
  var profit=p.price-(p.cost||0);
  var usd=window.dolarRate>0?Math.round(p.price/window.dolarRate):0;
  var imgHtml=p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:32px">📱</span>';
  var badgeHtml='';
  if(p.isOffer){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(192,57,43,.12);color:var(--red)">OFERTA'+(p.discount?(' -'+p.discount+'%'):'')+'</span>';}
  if(lowStock){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(192,57,43,.12);color:var(--red)">SIN STOCK</span>';}
  else if(p.stock<=3){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(255,107,44,.12);color:var(--orange)">STOCK BAJO</span>';}
  return '<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid '+(lowStock?'var(--red)':'var(--border)')+';transition:all .2s" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(0,0,0,.12)\'" onmouseout="this.style.boxShadow=\'none\'">'+
    '<div style="height:120px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative">'+imgHtml+
      (badgeHtml?'<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;max-width:90%">'+badgeHtml+'</div>':'')+
    '</div>'+
    '<div style="padding:11px;display:flex;flex-direction:column">'+
      '<div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(p.name||'')+'</div>'+
      '<div style="font-size:10px;color:var(--gray);margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p.sub||'')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'+
        '<div style="background:var(--cream2);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">Venta</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--orange)">'+fmt(p.price)+'</div>'+
        '</div>'+
        '<div style="background:var(--cream2);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">Costo</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--dk)">'+fmt(p.cost||0)+'</div>'+
        '</div>'+
        '<div style="background:rgba(45,90,39,.08);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">Ganancia</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--green)">'+fmt(profit)+'</div>'+
        '</div>'+
        '<div style="background:rgba(255,107,44,.08);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">USD</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--orange)">'+(usd>0?('US$ '+usd.toLocaleString('es-AR')):'—')+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(0,0,0,.03);border-radius:8px;margin-bottom:10px">'+
        '<span style="font-size:10px;color:var(--gray)">Stock:</span>'+
        '<span style="font-size:13px;font-weight:800;color:'+stockColor+'">'+p.stock+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:4px;margin-top:auto;flex-wrap:wrap">'+
        '<button class="btn btn-g btn-sm" style="flex:1;min-width:0;font-size:10px;padding:6px 4px" onclick="editProduct(\''+p.id+'\')">Editar</button>'+
        '<button class="btn btn-o btn-sm" style="flex:1;min-width:0;font-size:10px;padding:6px 4px" onclick="duplicateProduct(\''+p.id+'\')">Duplicar</button>'+
        '<button class="btn btn-o btn-sm" style="flex:1;min-width:0;font-size:10px;padding:6px 4px" onclick="deleteProduct(\''+p.id+'\')">Eliminar</button>'+
        '<button class="btn btn-sm" style="flex:1;min-width:0;font-size:10px;padding:6px 4px;background:#1A1A2E;color:#fff" onclick="downloadProductQr(\''+p.id+'\')">⬇ QR</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

// =========== ADMIN ACCESSORY CARDS (search + filters + full info) ===========
window.admAccFilter='all';
function setAdmAccFilter(type,btn){
  window.admAccFilter=type;
  document.querySelectorAll('#adm-acc-quickfilters .ord-btn').forEach(function(b){b.classList.remove('ord-btn-act');});
  if(btn)btn.classList.add('ord-btn-act');
  renderAdminAccFiltered(document.getElementById('adminAccSearch').value);
}
function renderAdminAccFiltered(q){
  var grid=document.getElementById('admin-acc-grid');
  if(!grid)return;
  q=(q||'').toLowerCase().trim();
  var sort=document.getElementById('admAccSort')?document.getElementById('admAccSort').value:'name';
  var list=(window.ACCS||[]).filter(function(a){
    var matchesQ=!q||(a.name||'').toLowerCase().indexOf(q)>=0||(a.category||'').toLowerCase().indexOf(q)>=0||(a.brand||'').toLowerCase().indexOf(q)>=0;
    if(!matchesQ)return false;
    if(window.admAccFilter==='offer')return !!a.isOffer;
    if(window.admAccFilter==='nostock')return a.stock<=0;
    if(window.admAccFilter==='low')return a.stock>0&&a.stock<=3;
    return true;
  });
  list.sort(function(a,b){
    if(sort==='price')return a.price-b.price;
    if(sort==='stock')return a.stock-b.stock;
    return (a.name||'').localeCompare(b.name||'');
  });
  var title=document.getElementById('adm-acc-title');
  if(title)title.textContent='Accesorios ('+list.length+(q?' / '+(window.ACCS||[]).length:'')+')';
  if(!list.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:40px;margin-bottom:.5rem">🔍</div><p>No se encontraron accesorios</p></div>';
    return;
  }
  grid.innerHTML=list.map(function(a){return renderAdminAccCard(a);}).join('');
}

function renderAdminAccCard(a){
  var lowStock=a.stock<=0;
  var stockColor=lowStock?'var(--red)':(a.stock<=3?'var(--orange)':'var(--green)');
  var usd=window.dolarRate>0?Math.round(a.price/window.dolarRate):0;
  var imgHtml=a.imageUrl?'<img loading="lazy" src="'+a.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:32px">'+(a.ico||'📦')+'</span>';
  var badgeHtml='';
  if(a.isOffer){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(192,57,43,.12);color:var(--red)">OFERTA'+(a.discount?(' -'+a.discount+'%'):'')+'</span>';}
  if(lowStock){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(192,57,43,.12);color:var(--red)">SIN STOCK</span>';}
  else if(a.stock<=3){badgeHtml+='<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(255,107,44,.12);color:var(--orange)">STOCK BAJO</span>';}
  return '<div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid '+(lowStock?'var(--red)':'var(--border)')+';transition:all .2s" onmouseover="this.style.boxShadow=\'0 6px 20px rgba(0,0,0,.12)\'" onmouseout="this.style.boxShadow=\'none\'">'+
    '<div style="height:120px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative">'+imgHtml+
      (badgeHtml?'<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;max-width:90%">'+badgeHtml+'</div>':'')+
    '</div>'+
    '<div style="padding:11px;display:flex;flex-direction:column">'+
      '<div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(a.name||'')+'</div>'+
      '<div style="font-size:10px;color:var(--gray);margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(a.category||'')+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'+
        '<div style="background:var(--cream2);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">Venta</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--orange)">'+fmt(a.price)+'</div>'+
        '</div>'+
        '<div style="background:rgba(255,107,44,.08);border-radius:8px;padding:7px">'+
          '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray);margin-bottom:2px">USD</div>'+
          '<div style="font-size:14px;font-weight:800;color:var(--orange)">'+(usd>0?('US$ '+usd.toLocaleString('es-AR')):'—')+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(0,0,0,.03);border-radius:8px;margin-bottom:10px">'+
        '<span style="font-size:10px;color:var(--gray)">Stock:</span>'+
        '<span style="font-size:13px;font-weight:800;color:'+stockColor+'">'+a.stock+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:6px;margin-top:auto">'+
        '<button class="btn btn-g btn-sm" style="flex:1" onclick="editAccessory(\''+a.id+'\')">Editar</button>'+
        '<button class="btn btn-o btn-sm" style="flex:1" onclick="deleteAccessory(\''+a.id+'\')">Eliminar</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function updateStock(id){
  var newStock=parseInt(document.getElementById('stock-'+id).value)||0;
  var p=getById(PRODUCTS,id);
  if(!p)return;
  fetch(API_URL+'/api/products/'+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({stock:newStock})
  }).then(function(){
    loadProducts();
  }).catch(function(){showErrorToast('Error', 'No se pudo actualizar el stock');});
}
function adjustStock(id,delta){
  var input=document.getElementById('stock-'+id);
  var newVal=Math.max(0,parseInt(input.value)+delta);
  input.value=newVal;
}
function saveAllStock(){
  var inputs=document.querySelectorAll('[id^="stock-"]');
  var promises=[];
  inputs.forEach(function(input){
    var id=input.id.replace('stock-','');
    var newStock=parseInt(input.value)||0;
    var original=parseInt(input.getAttribute('data-original'));
    if(newStock!==original){
      var isAcc=id.startsWith('acc-');
      var realId=isAcc?id.replace('acc-',''):id;
      var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
      promises.push(fetch(API_URL+endpoint,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({stock:newStock})
      }));
    }
  });
  Promise.all(promises).then(function(){
    inputs.forEach(function(input){
      var id=input.id.replace('stock-','');
      var newStock=parseInt(input.value)||0;
      var isAcc=id.startsWith('acc-');
      var realId=isAcc?id.replace('acc-',''):id;
      var p=getById(PRODUCTS,realId);
      if(p)p.stock=newStock;
      var a=getById(window.ACCS,realId);
      if(a)a.stock=newStock;
      input.setAttribute('data-original',input.value);
    });
    renderStockList();
    showSuccessToast('Stock guardado', 'Los cambios han sido guardados correctamente');
  }).catch(function(){showErrorToast('Error', 'No se pudo guardar el stock');});
}
function undoAllStock(){
  var inputs=document.querySelectorAll('[id^="stock-"]');
  inputs.forEach(function(input){
    input.value=input.getAttribute('data-original');
  });
  showInfoToast('Cambios revertidos', 'Se han deshecho los cambios');
}
function renderStockList(){
  var list=document.getElementById('stockList');
  if(!list)return;
  var filterType=document.getElementById('stockFilterType')?document.getElementById('stockFilterType').value:'todos';
  var filterBrand=document.getElementById('stockFilterBrand')?document.getElementById('stockFilterBrand').value:'';
  var items=[];
  if(filterType==='todos'||filterType==='productos'){
    PRODUCTS.forEach(function(p){
      if(filterBrand&&p.brand!==filterBrand)return;
      items.push({id:p.id,name:p.name,sub:p.sub||'',stock:p.stock,type:'producto',ico:p.ico||'📱',brand:p.brand});
    });
  }
  if(filterType==='todos'||filterType==='accesorios'){
    (window.ACCS||[]).forEach(function(a){
      if(filterBrand&&a.brand!==filterBrand)return;
      items.push({id:a.id,name:a.name,sub:a.category||'',stock:a.stock,type:'accesorio',ico:a.ico||'📦',brand:a.brand});
    });
  }
  var page=window._stockPage||1;
  var limit=window._stockLimit||20;
  var totalPages=Math.ceil(items.length/limit);
  var start=(page-1)*limit;
  var end=start+limit;
  var pageItems=items.slice(start,end);
  list.innerHTML=pageItems.map(function(item){
    var lowStock=item.stock<=2;
    var medStock=item.stock>2&&item.stock<=5;
    var statusText=lowStock?'⚠ Stock critico':medStock?'⚠ Stock bajo':'';
    var stockId=item.type==='accesorio'?'acc-'+item.id:item.id;
    return'<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fff;border-radius:8px;border:1px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+'">'+
      '<div style="font-size:24px">'+item.ico+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-weight:600">'+item.name+'</div>'+
        '<div style="font-size:11px;color:var(--gray)">'+item.sub+' <span style="color:var(--orange);font-weight:500">['+item.type+']</span></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;min-width:120px">'+
        '<button onclick="adjustStock(\''+stockId+'\',-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">-</button>'+
        '<input type="number" id="stock-'+stockId+'" data-original="'+item.stock+'" value="'+item.stock+'" min="0" style="width:50px;padding:6px;border:1.5px solid '+(lowStock?'var(--red)':medStock?'var(--orange)':'var(--border)')+';border-radius:var(--rsm);font-size:14px;text-align:center;font-weight:600'+(lowStock?';color:var(--red)':medStock?';color:var(--orange)':'')+'">'+
        '<button onclick="adjustStock(\''+stockId+'\',1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:16px;cursor:pointer">+</button>'+
      '</div>'+
      '<div style="font-size:11px;font-weight:600;color:'+(lowStock?'var(--red)':medStock?'var(--orange)':'transparent')+'">'+statusText+'</div>'+
    '</div>';
  }).join('');
  var pagContainer=document.getElementById('stockPagination');
  if(pagContainer){
    if(totalPages<=1){pagContainer.innerHTML='';return;}
    var html='<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:1rem;padding:1rem" class="admin-pagination">';
    html+='<button onclick="window._stockPage=Math.max(1,window._stockPage-1);renderStockList();"'+(page===1?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">←</button>';
    var s=Math.max(1,page-2);
    var e=Math.min(totalPages,page+2);
    if(s>1)html+='<button onclick="window._stockPage=1;renderStockList();" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">1</button>';
    if(s>2)html+='<span style="padding:6px;color:var(--gray)">...</span>';
    for(var i=s;i<=e;i++){
      if(i===page)html+='<span style="padding:6px 12px;border-radius:6px;background:var(--orange);color:#fff;font-size:13px;font-weight:600">'+i+'</span>';
      else html+='<button onclick="window._stockPage='+i+';renderStockList();" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">'+i+'</button>';
    }
    if(e<totalPages-1)html+='<span style="padding:6px;color:var(--gray)">...</span>';
    if(e<totalPages)html+='<button onclick="window._stockPage='+totalPages+';renderStockList();" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">'+totalPages+'</button>';
    html+='<button onclick="window._stockPage=Math.min('+totalPages+',window._stockPage+1);renderStockList();"'+(page===totalPages?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer">→</button>';
    html+='</div>';
    pagContainer.innerHTML=html;
  }
}
function renderPromoProducts(){
  var brand=document.getElementById('promoBrand').value;
  var typeFilter=document.getElementById('promoType').value;
  var itemType=document.getElementById('promoItemType')?document.getElementById('promoItemType').value:'todos';
  var list=document.getElementById('promoProductList');
  if(!list)return;
  var items=[];
  if(itemType==='todos'||itemType==='productos'){
    PRODUCTS.forEach(function(p){
      if(brand&&p.brand!==brand)return;
      if(typeFilter&&p.type!==typeFilter)return;
      items.push({id:p.id,name:p.name,brand:p.brand,price:p.price,isOffer:p.isOffer,discount:p.discount,imageUrl:p.imageUrl,type:'producto',ico:p.ico||'📱'});
    });
  }
  if(itemType==='todos'||itemType==='accesorios'){
    (window.ACCS||[]).forEach(function(a){
      if(brand&&a.brand!==brand)return;
      if(typeFilter&&a.category!==typeFilter)return;
      items.push({id:a.id,name:a.name,brand:a.brand,price:a.price,isOffer:a.isOffer,discount:a.discount,imageUrl:a.imageUrl,type:'accesorio',ico:a.ico||'📦'});
    });
  }
  list.innerHTML=items.map(function(item){
    var chkId=item.type==='accesorio'?'promo-chk-acc-'+item.id:'promo-chk-'+item.id;
    var isSelected=document.getElementById(chkId)?.checked;
    return'<div style="background:#fff;border-radius:12px;padding:10px;border:1px solid '+(isSelected?'var(--orange)':'var(--border)')+';cursor:pointer;transition:all .2s;position:relative'+(isSelected?';box-shadow:0 2px 8px rgba(255,107,44,0.2)':'')+'" onclick="togglePromoProduct(\''+item.id+'\')">'+
      '<div style="position:absolute;top:6px;right:6px;z-index:10">'+
        '<input type="checkbox" id="'+chkId+'" '+(isSelected?'checked':'')+' style="width:16px;height:16px;border-radius:4px;border:2px solid var(--border);cursor:pointer" onclick="event.stopPropagation()">'+
      '</div>'+
      '<div style="aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:8px;background:var(--cream2);display:flex;align-items:center;justify-content:center">'+
        (item.imageUrl?'<img loading="lazy" src="'+item.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:28px">'+item.ico+'</span>')+
      '</div>'+
      '<div style="margin-bottom:2px">'+
        '<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--orange)">'+item.brand+' <span style="color:var(--gray);font-weight:400">['+item.type+']</span></div>'+
        '<div style="font-size:11px;font-weight:600;color:var(--dk);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+item.name+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:4px">'+
        '<span style="font-size:12px;font-weight:700;color:var(--dk)">'+fmt(item.price)+'</span>'+
        (item.isOffer?'<span style="font-size:9px;color:var(--red);font-weight:700;background:rgba(255,0,0,0.05);padding:2px 6px;border-radius:8px">-'+item.discount+'%</span>':'')+
      '</div>'+
      '</div>';
  }).join('');
  var rail=document.getElementById('homeRail');if(rail&&!rail.dataset.svRevealed){rail.classList.add('pgrid-reveal');rail.dataset.svRevealed='1';}else if(rail){rail.classList.remove('pgrid-reveal');}
}
function togglePromoProduct(id){
  var isAcc=getById(window.ACCS||[],id)?true:false;
  var chkId=isAcc?'promo-chk-acc-'+id:'promo-chk-'+id;
  var chk=document.getElementById(chkId);
  if(chk)chk.checked=!chk.checked;
  renderPromoProducts();
}
function selectAllPromo(selectAll){
  var brand=document.getElementById('promoBrand').value;
  var type=document.getElementById('promoType').value;
  var itemType=document.getElementById('promoItemType')?document.getElementById('promoItemType').value:'todos';
  if(itemType==='todos'||itemType==='productos'){
    var filtered=PRODUCTS.filter(function(p){
      return(!brand||p.brand===brand)&&(!type||p.type===type);
    });
    filtered.forEach(function(p){
      var chk=document.getElementById('promo-chk-'+p.id);
      if(chk)chk.checked=selectAll;
    });
  }
  if(itemType==='todos'||itemType==='accesorios'){
    var filteredAcc=(window.ACCS||[]).filter(function(a){
      return(!brand||a.brand===brand)&&(!type||a.category===type);
    });
    filteredAcc.forEach(function(a){
      var chk=document.getElementById('promo-chk-acc-'+a.id);
      if(chk)chk.checked=selectAll;
    });
  }
  renderPromoProducts();
}
function applyPromo(){
  var discount=parseInt(document.getElementById('promoDiscount').value)||0;
  if(discount<=0){showAlert('Descuento inválido', 'Ingresa un descuento mayor a 0', 'warning');return;}
  var checkboxes=document.querySelectorAll('[id^="promo-chk-"]:checked');
  if(checkboxes.length===0){showAlert('Selección requerida', 'Selecciona al menos un producto', 'warning');return;}
  var promises=[];
  var prodCount=0,accCount=0;
  checkboxes.forEach(function(chk){
    var rawId=chk.id.replace('promo-chk-','');
    var isAcc=rawId.startsWith('acc-');
    var realId=isAcc?rawId.replace('acc-',''):rawId;
    var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
    if(isAcc)accCount++;else prodCount++;
    promises.push(fetch(API_URL+endpoint,{
      method:'PUT',
      headers:{'Content-Type':'application/json','X-User-Id': currentUser.id},
      body:JSON.stringify({discount:discount,isOffer:discount>0})
    }));
  });
  Promise.all(promises).then(function(){
    loadProducts();
    loadAccessories();
    var msg='Promo aplicada';
    if(prodCount>0&&accCount>0)msg+=' a '+prodCount+' producto(s) y '+accCount+' accesorio(s)';
    else if(prodCount>0)msg+=' a '+prodCount+' producto(s)';
    else if(accCount>0)msg+=' a '+accCount+' accesorio(s)';
    showSuccessToast('Promoción aplicada', msg);
  }).catch(function(){showErrorToast('Error', 'No se pudo aplicar la promoción');});
}
function renderActivePromos(){
  var tbody=document.getElementById('activePromosTable');
  var filterType=document.getElementById('activePromoFilterType')?.value||'todos';
  var filterBrand=document.getElementById('activePromoFilterBrand')?.value||'';
  var filterStatus=document.getElementById('promoFilterStatus')?.value||'';
  if(!tbody)return;
  var now=new Date();
  var allOffers=[];
  if(filterType==='todos'||filterType==='productos'){
    PRODUCTS.filter(function(p){return p.isOffer&&p.discount>0;}).forEach(function(p){
      allOffers.push({id:p.id,name:p.name,sub:p.sub,brand:p.brand,discount:p.discount,imageUrl:p.imageUrl,type:'producto',ico:p.ico||'\uD83D\uDCF1'});
    });
  }
  if(filterType==='todos'||filterType==='accesorios'){
    (window.ACCS||[]).filter(function(a){return a.isOffer&&a.discount>0;}).forEach(function(a){
      allOffers.push({id:a.id,name:a.name,sub:a.category||'',brand:a.brand,discount:a.discount,imageUrl:a.imageUrl,type:'accesorio',ico:a.ico||'\uD83D\uDCE6'});
    });
  }
  var offers=allOffers.filter(function(p){
    if(filterBrand&&p.brand!==filterBrand)return false;
    return true;
  });
  
  var brands=[...new Set(allOffers.map(function(p){return p.brand;}).filter(function(b){return b;}))];
  
  tbody.innerHTML='<tr>'+
    '<td colspan="5" style="padding:16px;background:var(--cream2);border-bottom:1px solid var(--border)">'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
        '<select id="activePromoFilterType" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="todos" '+(filterType==='todos'?'selected':'')+'>Todos</option>'+
          '<option value="productos" '+(filterType==='productos'?'selected':'')+'>Productos</option>'+
          '<option value="accesorios" '+(filterType==='accesorios'?'selected':'')+'>Accesorios</option>'+
        '</select>'+
        '<select id="activePromoFilterBrand" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="" '+(filterBrand===''?'selected':'')+'>Todas las marcas</option>'+brands.map(function(b){return'<option value="'+b+'" '+(filterBrand===b?'selected':'')+'>'+b+'</option>';}).join('')+
        '</select>'+
        '<select id="promoFilterStatus" onchange="renderActivePromos()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">'+
          '<option value="" '+(filterStatus===''?'selected':'')+'>Todos los estados</option>'+
          '<option value="activa" '+(filterStatus==='activa'?'selected':'')+'>Activas</option>'+
          '<option value="programada" '+(filterStatus==='programada'?'selected':'')+'>Programadas</option>'+
        '</select>'+
        '<button onclick="toggleSelectAllPromos(true)" style="padding:8px 16px;background:var(--green);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Seleccionar todas</button>'+
        '<button onclick="toggleSelectAllPromos(false)" style="padding:8px 16px;background:var(--cream2);color:var(--dk);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Deseleccionar todas</button>'+
      '</div>'+
    '</td>'+
  '</tr>';
  
  if(offers.length===0){
    tbody.innerHTML+='<tr><td colspan="5" style="padding:32px;text-align:center;color:var(--gray)">No hay promociones activas</td></tr>';
    return;
  }
  tbody.innerHTML+=offers.map(function(p){
    var chkVal=p.type==='accesorio'?'acc-'+p.id:p.id;
    return'<tr onclick="togglePromoRow(\''+chkVal+'\')" style="border-top:1px solid var(--border);cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--cream)\'" onmouseout="this.style.background=\'transparent\'">'+
      '<td style="padding:12px;width:40px">'+
        '<input type="checkbox" class="promo-del-chk" value="'+chkVal+'" style="width:18px;height:18px;cursor:pointer" onclick="event.stopPropagation()">'+
      '</td>'+
      '<td style="padding:12px">'+
        '<div style="display:flex;align-items:center;gap:10px">'+
          '<div style="width:48px;height:48px;background:var(--cream2);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center">'+
            (p.imageUrl?'<img loading="lazy" src="'+p.imageUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:24px">'+p.ico+'</span>')+
          '</div>'+
          '<div><div style="font-weight:600;font-size:13px">'+p.name+'</div><div style="font-size:10px;color:var(--gray)">'+p.sub+' <span style="color:var(--orange);font-weight:600">['+p.type+']</span></div></div>'+
        '</div>'+
      '</td>'+
      '<td style="padding:12px"><span style="font-size:10px;font-weight:600;background:var(--cream2);padding:4px 10px;border-radius:20px">'+p.brand+'</span></td>'+
      '<td style="padding:12px"><span style="font-size:14px;font-weight:700;color:var(--orange)">-'+p.discount+'%</span></td>'+
      '<td style="padding:12px">'+
        '<div style="font-size:10px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:currentColor"></span>ACTIVA</div>'+
      '</td>'+
    '</tr>';
  }).join('');
}
function removePromo(id){
  var isAcc=id.startsWith('acc-');
  var realId=isAcc?id.replace('acc-',''):id;
  var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
  fetch(API_URL+endpoint,{
    method:'PUT',
    headers:{'Content-Type':'application/json','X-User-Id': currentUser.id},
    body:JSON.stringify({discount:0,isOffer:false})
  }).then(function(){
    loadProducts();
    loadAccessories();
    renderActivePromos();
    showSuccessToast('Promoción eliminada', 'La promoción ha sido eliminada');
  }).catch(function(){showErrorToast('Error', 'No se pudo eliminar la promoción');});
}
var promoDeleteIds=[];
function deleteSelectedPromos(){
  var checkboxes=document.querySelectorAll('.promo-del-chk:checked');
  if(checkboxes.length===0){showAlert('Selección requerida', 'Selecciona al menos una promoción', 'warning');return;}
  showConfirm(
    'Eliminar promociones',
    '¿Eliminar '+checkboxes.length+' promoción(es)? Esta acción no se puede deshacer.',
    { confirmText: 'Eliminar', confirmClass: 'danger' }
  ).then(function(confirmed){
    if(!confirmed)return;
    promoDeleteIds=Array.from(checkboxes).map(function(chk){return chk.value;});
    var promises=[];
    promoDeleteIds.forEach(function(rawId){
      var isAcc=rawId.startsWith('acc-');
      var realId=isAcc?rawId.replace('acc-',''):rawId;
      var endpoint=isAcc?'/api/accessories?id='+realId:'/api/products/'+realId;
      promises.push(fetch(API_URL+endpoint,{
        method:'PUT',
        headers:{'Content-Type':'application/json','X-User-Id': currentUser.id},
        body:JSON.stringify({discount:0,isOffer:false})
      }));
    });
    Promise.all(promises).then(function(){
      loadProducts();
      loadAccessories();
      renderActivePromos();
      showSuccessToast('Promociones eliminadas', promoDeleteIds.length+' promoción(es) eliminada(s)');
    }).catch(function(){showErrorToast('Error', 'No se pudieron eliminar las promociones');});
    promoDeleteIds=[];
  });
}
function toggleSelectAllPromos(selectAll){
  var checkboxes=document.querySelectorAll('.promo-del-chk');
  checkboxes.forEach(function(chk){chk.checked=selectAll;});
}
function togglePromoRow(id){
  var chk=document.querySelector('.promo-del-chk[value="'+id+'"]');
  if(chk)chk.checked=!chk.checked;
}
function showToast(msg,type){
  // Support both render.js (msg,type) and admin-ui.js ({title,message,type}) signatures
  if(typeof msg==='object'&&msg!==null){
    type=msg.type||type;
    msg=msg.message||msg.title||'';
  }
  var existing=document.getElementById('toast');
  if(existing)existing.remove();
  var toast=document.createElement('div');
  toast.id='toast';
  var colors={success:'var(--green)',error:'var(--red)',warning:'var(--orange)',info:'var(--blue)'};
  var icons={success:'\u2705',error:'\u274C',warning:'\u26A0\uFE0F',info:'\u2139\uFE0F'};
  var c=colors[type]||'var(--dk)';
  var i=icons[type]||'';
  toast.innerHTML=(i?'<span style="margin-right:8px">'+i+'</span>':'')+'<span>'+msg+'</span>';
  toast.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:'+c+';color:#fff;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px;animation:fadeInUp .3s ease;max-width:90vw;text-align:center;backdrop-filter:blur(8px)';
  document.body.appendChild(toast);
  setTimeout(function(){toast.style.animation='fadeOutDown .3s ease';setTimeout(function(){toast.remove();},300);},3000);
}

// =========== QUOTES (COTIZACIONES) ===========
var _allQuotes=[];
var _quotePage=1;
var _quoteLimit=20;
var _quoteStatus='all';
var _quoteSearch='';

function loadQuotes(status){
  _quoteStatus=status||'all';
  _quotePage=1;
  
  document.querySelectorAll('#quoteBtnAll,#quoteBtnPending,#quoteBtnApproved,#quoteBtnRejected').forEach(function(b){b.classList.remove('ord-btn-act');});
  if(status==='all')document.getElementById('quoteBtnAll').classList.add('ord-btn-act');
  else if(status==='PENDING')document.getElementById('quoteBtnPending').classList.add('ord-btn-act');
  else if(status==='APPROVED')document.getElementById('quoteBtnApproved').classList.add('ord-btn-act');
  else if(status==='REJECTED')document.getElementById('quoteBtnRejected').classList.add('ord-btn-act');
  
  var url=API_URL+'/api/quotes?page='+_quotePage+'&limit='+_quoteLimit;
  if(status!=='all')url+='&status='+status;
  if(_quoteSearch)url+='&search='+encodeURIComponent(_quoteSearch);
  
  fetch(url).then(function(r){return r.json();}).then(function(res){
    _allQuotes=res.data||[];
    renderQuotesList(res);
  }).catch(function(){
    document.getElementById('quoteList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--gray)">Error cargando cotizaciones</div>';
  });
}

function searchQuotes(val){
  _quoteSearch=val;
  _quotePage=1;
  loadQuotes(_quoteStatus);
}

function renderQuotesList(res){
  var list=document.getElementById('quoteList');
  if(!list)return;
  
  if(!_allQuotes||_allQuotes.length===0){
    list.innerHTML='<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:48px;margin-bottom:1rem">&#128203;</div><div style="font-size:14px;font-weight:600;margin-bottom:.5rem">No hay cotizaciones</div><div style="font-size:12px">Las cotizaciones apareceran aqui cuando los usuarios las envien</div></div>';
    return;
  }
  
  var statusColors={PENDING:'var(--orange)',APPROVED:'var(--green)',REJECTED:'var(--red)',REVIEWING:'#8b5cf6',COMPLETED:'var(--blue)'};
  var statusLabels={PENDING:'Pendiente',APPROVED:'Aceptada',REJECTED:'Rechazada',REVIEWING:'En revisión',COMPLETED:'Completada'};
  
  var html=_allQuotes.map(function(q){
    var sc=statusColors[q.status]||'var(--gray)';
    var sl=statusLabels[q.status]||q.status;
    var date=new Date(q.createdAt).toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'});
    var phone=q.clientPhone||'';
    return '<div class="gp-card" style="--gp-accent:'+sc+'">'+
      '<div class="gp-card-head">'+
        '<div style="min-width:0">'+
          '<div class="gp-card-title" style="font-family:inherit;font-size:15px">'+q.device+'</div>'+
          '<div class="gp-card-sub">'+(q.clientName||'Sin nombre')+' · '+date+'</div>'+
        '</div>'+
        '<span class="gp-pill" style="--gp-pill-bg:'+sc+';--gp-pill-fg:#fff"><span class="gp-dot"></span>'+sl+'</span>'+
      '</div>'+
      '<div class="gp-fields">'+
        (q.clientDni?'<div class="gp-field"><div class="gp-field-label">DNI</div><div class="gp-field-value">'+q.clientDni+'</div></div>':'')+
        (phone?'<div class="gp-field"><div class="gp-field-label">Teléfono</div><div class="gp-field-value">'+phone+'</div></div>':'')+
        (q.clientCity?'<div class="gp-field"><div class="gp-field-label">Ciudad</div><div class="gp-field-value">'+q.clientCity+'</div></div>':'')+
        (q.storage?'<div class="gp-field"><div class="gp-field-label">Almacenamiento</div><div class="gp-field-value">'+q.storage+'</div></div>':'')+
        (q.condition?'<div class="gp-field"><div class="gp-field-label">Estado</div><div class="gp-field-value">'+q.condition+'</div></div>':'')+
      '</div>'+
      '<div class="gp-card-foot">'+
        '<div><span class="gp-total-label">Precio cotizado</span><span class="gp-total-value">$'+(q.finalPrice||0).toLocaleString('es-AR')+'</span></div>'+
        '<div class="gp-actions">'+
          '<button class="gp-btn gp-btn-ghost" onclick="openQuoteDetail(\''+q.id+'\')">Ver cotización →</button>'+
          '<button class="gp-btn gp-btn-danger" onclick="deleteQuote(\''+q.id+'\')" title="Eliminar">🗑</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
  
  list.innerHTML=html;
  
  var pagContainer=document.getElementById('quotePagination');
  if(pagContainer){
    var totalPages=res.totalPages||1;
    if(totalPages<=1){pagContainer.innerHTML='';return;}
    var phtml='<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:1rem;padding:1rem">';
    phtml+='<button onclick="_quotePage=Math.max(1,_quotePage-1);loadQuotes(_quoteStatus);"'+(_quotePage===1?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--admin-surface);color:var(--admin-text);font-size:13px;cursor:pointer">&#8592;</button>';
    for(var i=1;i<=totalPages;i++){
      if(i===_quotePage)phtml+='<span style="padding:6px 12px;border-radius:6px;background:var(--orange);color:#fff;font-size:13px;font-weight:600">'+i+'</span>';
      else phtml+='<button onclick="_quotePage='+i+';loadQuotes(_quoteStatus);" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--admin-surface);color:var(--admin-text);font-size:13px;cursor:pointer">'+i+'</button>';
    }
    phtml+='<button onclick="_quotePage=Math.min('+totalPages+',_quotePage+1);loadQuotes(_quoteStatus);"'+(_quotePage===totalPages?' disabled style="opacity:.4;cursor:not-allowed"':'')+' style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--admin-surface);color:var(--admin-text);font-size:13px;cursor:pointer">&#8594;</button>';
    phtml+='</div>';
    pagContainer.innerHTML=phtml;
  }
}

function openQuoteDetail(id){
  var q=_allQuotes.find(function(x){return x.id===id;});
  if(!q)return;
  
  var existing=document.getElementById('quoteDetailModal');
  if(existing)existing.remove();
  
  var statusColors={PENDING:'var(--orange)',APPROVED:'var(--green)',REJECTED:'var(--red)',REVIEWING:'#8b5cf6',COMPLETED:'var(--blue)'};
  var statusLabels={PENDING:'Pendiente',APPROVED:'Aceptada',REJECTED:'Rechazada',REVIEWING:'En revision',COMPLETED:'Completada'};
  var date=new Date(q.createdAt).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  
  var extrasLabels={pant:'Pantalla perfecta (+6%)',bat:'Bateria 80%+ (+5%)',icloud:'Cuenta libre (+8%)',caja:'Caja original (+3%)',acc:'Accesorios originales (+3%)'};
  var extrasHtml=(q.extras||[]).length>0?(q.extras||[]).map(function(e){return'<span style="font-size:11px;background:var(--admin-surface-hover);padding:4px 8px;border-radius:6px">'+(extrasLabels[e]||e)+'</span>';}).join(''):'<span style="font-size:11px;color:var(--admin-text-muted)">Ninguno</span>';
  
  var photosHtml=(q.photos||[]).length>0?q.photos.map(function(p){return'<img loading="lazy" src="'+p+'" onclick="openLightbox(\''+p+'\')" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid var(--admin-border);cursor:pointer">';}).join(''):'<span style="font-size:12px;color:var(--admin-text-muted)">No se adjuntaron fotos</span>';
  
  var modal=document.createElement('div');
  modal.id='quoteDetailModal';
  modal.style.cssText='display:flex;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s';
  modal.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeQuoteDetail()"></div>'+
    '<div style="position:relative;background:var(--admin-surface);border:1px solid var(--admin-border);border-radius:16px;width:min(600px,95%);max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.35);transform:scale(.9);transition:transform .3s">'+
      '<div style="padding:20px 24px;border-bottom:1px solid var(--admin-border);display:flex;align-items:center;justify-content:space-between">'+
        '<div><h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--admin-text)">Cotizacion '+q.code+'</h3><p style="font-size:12px;color:var(--admin-text-muted);margin-top:4px">'+date+'</p></div>'+
        '<button onclick="closeQuoteDetail()" style="background:none;border:none;color:var(--admin-text-muted);cursor:pointer;font-size:24px;padding:4px">&times;</button>'+
      '</div>'+
      '<div style="padding:24px">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">'+
          '<div style="background:var(--admin-surface-hover);border-radius:10px;padding:14px">'+
            '<div style="font-size:10px;color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Dispositivo</div>'+
            '<div style="font-size:14px;font-weight:600;color:var(--admin-text)">'+q.device+'</div>'+
            '<div style="font-size:12px;color:var(--admin-text-muted);margin-top:4px">'+q.storage+' &middot; '+q.condition+'</div>'+
          '</div>'+
          '<div style="background:var(--admin-surface-hover);border-radius:10px;padding:14px">'+
            '<div style="font-size:10px;color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Precio estimado</div>'+
            '<div style="font-size:20px;font-weight:700;color:var(--orange)">$'+(q.finalPrice||0).toLocaleString('es-AR')+'</div>'+
            '<div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px">Base: $'+(q.basePrice||0).toLocaleString('es-AR')+'</div>'+
          '</div>'+
        '</div>'+
        
        '<div style="margin-bottom:20px">'+
          '<div style="font-size:12px;font-weight:600;color:var(--admin-text);margin-bottom:8px">Extras</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:6px">'+extrasHtml+'</div>'+
        '</div>'+
        
        '<div style="margin-bottom:20px">'+
          '<div style="font-size:12px;font-weight:600;color:var(--admin-text);margin-bottom:8px">Datos del cliente</div>'+
          '<div style="background:var(--admin-surface-hover);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">Nombre</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.clientName||'-')+'</div></div>'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">DNI</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.clientDni||'-')+'</div></div>'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">Telefono</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.clientPhone||'-')+'</div></div>'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">Ciudad</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.clientCity||'-')+'</div></div>'+
          '</div>'+
        '</div>'+
        
        '<div style="margin-bottom:20px">'+
          '<div style="font-size:12px;font-weight:600;color:var(--admin-text);margin-bottom:8px">Fotos del dispositivo</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+photosHtml+'</div>'+
        '</div>'+
        
        '<div style="margin-bottom:20px">'+
          '<div style="font-size:12px;font-weight:600;color:var(--admin-text);margin-bottom:8px">Envio y cobro</div>'+
          '<div style="background:var(--admin-surface-hover);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">Envio</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.envio||'-')+'</div></div>'+
            '<div><span style="font-size:10px;color:var(--admin-text-muted)">Cobro</span><div style="font-size:13px;font-weight:500;color:var(--admin-text)">'+(q.payment||'-')+'</div></div>'+
          '</div>'+
        '</div>'+
        
        '<div style="display:flex;gap:12px;padding-top:16px;border-top:1px solid var(--admin-border)">'+
          '<button onclick="rejectQuote(\''+q.id+'\')" style="flex:1;padding:12px;background:var(--red);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Rechazar</button>'+
          '<button onclick="approveQuote(\''+q.id+'\')" style="flex:1;padding:12px;background:var(--green);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Aceptar</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  
  var target=document.querySelector('.admin-main')||document.querySelector('.admin-layout')||document.body;
  target.appendChild(modal);
  setTimeout(function(){modal.style.opacity='1';modal.querySelector('div:nth-child(2)').style.transform='scale(1)';},10);
}
function closeQuoteDetail(){
  var modal=document.getElementById('quoteDetailModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.remove();},300);
}

function approveQuote(id){
  showConfirm('Aceptar cotizacion','¿Confirmas que aceptas esta cotizacion? Se notificara al cliente.',{confirmText:'Aceptar',confirmClass:'primary'}).then(function(confirmed){
    if(!confirmed)return;
    fetch(API_URL+'/api/quotes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,status:'APPROVED'})}).then(function(r){return r.json();}).then(function(){
      showSuccessToast('Cotizacion aceptada','El cliente sera notificado');
      closeQuoteDetail();
      loadQuotes(_quoteStatus);
    }).catch(function(){showErrorToast('Error','No se pudo aceptar la cotizacion');});
  });
}

function rejectQuote(id){
  var existing=document.getElementById('rejectQuoteModal');
  if(existing)existing.remove();
  
  var modal=document.createElement('div');
  modal.id='rejectQuoteModal';
  modal.style.cssText='display:flex;position:fixed;inset:0;z-index:10000;align-items:center;justify-content:center;opacity:0;transition:opacity .3s';
  modal.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)" onclick="closeRejectQuoteModal()"></div>'+
    '<div style="position:relative;background:var(--admin-surface);border:1px solid var(--admin-border);border-radius:16px;width:min(450px,95%);box-shadow:0 25px 80px rgba(0,0,0,.35);transform:scale(.9);transition:transform .3s">'+
      '<div style="padding:20px 24px;border-bottom:1px solid var(--admin-border)">'+
        '<h3 style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--red)">Rechazar cotizacion</h3>'+
        '<p style="font-size:12px;color:var(--admin-text-muted);margin-top:4px">Selecciona el motivo del rechazo</p>'+
      '</div>'+
      '<div style="padding:24px">'+
        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1rem">'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--admin-surface-hover);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="quote-reason-cb" value="El dispositivo no coincide con la descripcion" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px;color:var(--admin-text)">El dispositivo no coincide con la descripcion</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--admin-surface-hover);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="quote-reason-cb" value="No se puede verificar la propiedad" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px;color:var(--admin-text)">No se puede verificar la propiedad</span>'+
          '</label>'+
          '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--admin-surface-hover);border-radius:8px;cursor:pointer">'+
            '<input type="checkbox" class="quote-reason-cb" value="Modelo no aceptado" style="margin-top:2px;accent-color:var(--red);width:18px;height:18px">'+
            '<span style="font-size:13px;color:var(--admin-text)">Modelo no aceptado</span>'+
          '</label>'+
        '</div>'+
        '<textarea id="quoteRejectComment" placeholder="Otro motivo (opcional)" style="width:100%;padding:10px 12px;border:1px solid var(--admin-border);border-radius:8px;background:var(--admin-surface-hover);color:var(--admin-text);font-size:13px;resize:none;height:60px;outline:none"></textarea>'+
        '<div style="display:flex;gap:12px;margin-top:1rem">'+
          '<button onclick="closeRejectQuoteModal()" style="flex:1;padding:12px;background:var(--admin-surface-hover);color:var(--admin-text);border:1px solid var(--admin-border);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>'+
          '<button onclick="confirmRejectQuote(\''+id+'\')" style="flex:1;padding:12px;background:var(--red);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Rechazar</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  
  var target=document.querySelector('.admin-main')||document.querySelector('.admin-layout')||document.body;
  target.appendChild(modal);
  setTimeout(function(){modal.style.opacity='1';modal.querySelector('div:nth-child(2)').style.transform='scale(1)';},10);
}
function closeRejectQuoteModal(){
  var modal=document.getElementById('rejectQuoteModal');
  if(!modal)return;
  modal.style.opacity='0';
  modal.querySelector('div:nth-child(2)').style.transform='scale(.9)';
  setTimeout(function(){modal.remove();},300);
}

function confirmRejectQuote(id){
  var cbs=document.querySelectorAll('.quote-reason-cb:checked');
  var reasons=[];
  cbs.forEach(function(cb){reasons.push(cb.value);});
  var commentEl=document.getElementById('quoteRejectComment');
  var comment=commentEl?commentEl.value.trim():'';
  var reasonText=reasons.join('; ')+(comment?(reasons.length>0?' | ':'')+comment:'');
  
  fetch(API_URL+'/api/quotes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,status:'REJECTED',rejectReason:reasonText})}).then(function(r){return r.json();}).then(function(){
    showSuccessToast('Cotizacion rechazada','El cliente sera notificado');
    closeRejectQuoteModal();
    closeQuoteDetail();
    loadQuotes(_quoteStatus);
  }).catch(function(){showErrorToast('Error','No se pudo rechazar la cotizacion');});
}

function deleteQuote(id){
  if(!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.'))return;
  
  fetch(API_URL+'/api/quotes?id='+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(res){
    if(res.success){
      showSuccessToast('Cotización eliminada','Se eliminó correctamente');
      loadQuotes(_quoteStatus);
    }else{
      showErrorToast('Error','No se pudo eliminar la cotización');
    }
  }).catch(function(){showErrorToast('Error','No se pudo eliminar la cotización');});
}
