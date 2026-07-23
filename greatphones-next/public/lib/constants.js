// =========== CONSTANTS ===========
var PRODUCTS = [
  {id:0,ico:'&#128241;',name:'iPhone 15 Pro',brand:'iPhone',sub:'256 GB Titanio Natural',cond:'Impecable',cls:'celular',price:1320000,cost:980000,bat:91,stock:3,score:97,offer:false,disc:0,color:'Titanio Natural',screen:'6.1',type:'celular',imei:'354821093847561',sold:34,cpu:'A17 Pro',ram:'8 GB',cam:'48MP'},
  {id:1,ico:'&#128187;',name:'MacBook Air M2',brand:'MacBook',sub:'8 GB RAM / 256 GB SSD',cond:'Nuevo',cls:'laptop',price:1850000,cost:1400000,bat:0,stock:2,score:99,offer:false,disc:0,color:'Midnight',screen:'13.6',type:'laptop',imei:'FVFXQ2BQ3C',sold:18,cpu:'M2',ram:'8 GB',cam:'1080p FaceTime'},
  {id:2,ico:'&#128241;',name:'iPhone 14',brand:'iPhone',sub:'128 GB Azul',cond:'Muy bueno',cls:'celular',price:890000,cost:650000,bat:86,stock:5,score:88,offer:true,disc:12,color:'Azul',screen:'6.1',type:'celular',imei:'354821093847562',sold:51,cpu:'A15 Bionic',ram:'6 GB',cam:'12MP'},
  {id:3,ico:'&#127756;',name:'Galaxy S24 Ultra',brand:'Samsung',sub:'256 GB Titanio Negro',cond:'Nuevo',cls:'celular',price:1580000,cost:1200000,bat:0,stock:1,score:96,offer:false,disc:0,color:'Titanio Negro',screen:'6.8',type:'celular',imei:'354821093847563',sold:12,cpu:'Snapdragon 8 Gen 3',ram:'12 GB',cam:'200MP'},
  {id:4,ico:'&#11035;',name:'iPad Pro M4',brand:'iPad',sub:'11" 256 GB WiFi',cond:'Nuevo',cls:'tablet',price:1420000,cost:1080000,bat:0,stock:2,score:98,offer:false,disc:0,color:'Plata',screen:'11',type:'tablet',imei:'DMPRX2BQ1A',sold:9,cpu:'M4',ram:'8 GB',cam:'12MP'},
  {id:5,ico:'&#128241;',name:'iPhone 13 Pro',brand:'iPhone',sub:'256 GB Graphite',cond:'Impecable',cls:'celular',price:980000,cost:720000,bat:89,stock:4,score:92,offer:true,disc:15,color:'Graphite',screen:'6.1',type:'celular',imei:'354821093847565',sold:67,cpu:'A15 Bionic',ram:'6 GB',cam:'12MP ProRAW'},
  {id:6,ico:'&#128241;',name:'iPhone 12 Pro',brand:'iPhone',sub:'128 GB Pacific Blue',cond:'Muy bueno',cls:'celular',price:680000,cost:490000,bat:84,stock:6,score:82,offer:false,disc:0,color:'Pacific Blue',screen:'6.1',type:'celular',imei:'354821093847566',sold:43,cpu:'A14 Bionic',ram:'6 GB',cam:'12MP'},
  {id:7,ico:'&#128421;',name:'iMac 24" M3',brand:'MacBook',sub:'8 GB RAM / 256 GB SSD',cond:'Nuevo',cls:'desktop',price:2680000,cost:2100000,bat:0,stock:1,score:99,offer:false,disc:0,color:'Azul',screen:'24',type:'desktop',imei:'FVFXQ2BQ3D',sold:4,cpu:'M3',ram:'8 GB',cam:'12MP Center Stage'},
  {id:8,ico:'&#128241;',name:'iPhone 16 Pro',brand:'iPhone',sub:'256 GB Titanio Desierto',cond:'Nuevo',cls:'celular',price:1680000,cost:1280000,bat:0,stock:2,score:99,offer:false,disc:0,color:'Titanio Desierto',screen:'6.3',type:'celular',imei:'354821093847568',sold:8,cpu:'A18 Pro',ram:'8 GB',cam:'48MP'},
  {id:9,ico:'&#127756;',name:'Galaxy S23+',brand:'Samsung',sub:'256 GB Cream',cond:'Muy bueno',cls:'celular',price:780000,cost:570000,bat:87,stock:3,score:85,offer:true,disc:10,color:'Cream',screen:'6.6',type:'celular',imei:'354821093847569',sold:29,cpu:'Snapdragon 8 Gen 2',ram:'8 GB',cam:'50MP'},
  {id:10,ico:'&#12349;',name:'Moto Edge 50 Pro',brand:'Motorola',sub:'256 GB Black Beauty',cond:'Nuevo',cls:'celular',price:520000,cost:380000,bat:0,stock:4,score:78,offer:false,disc:0,color:'Black Beauty',screen:'6.7',type:'celular',imei:'354821093847570',sold:15,cpu:'Snapdragon 7 Gen 3',ram:'12 GB',cam:'50MP'},
  {id:11,ico:'&#128308;',name:'Xiaomi 13T',brand:'Xiaomi',sub:'256 GB Alpine Blue',cond:'Nuevo',cls:'celular',price:480000,cost:340000,bat:0,stock:5,score:75,offer:false,disc:0,color:'Alpine Blue',screen:'6.67',type:'celular',imei:'354821093847571',sold:21,cpu:'Dimensity 8200 Ultra',ram:'8 GB',cam:'50MP'}
];

var REPAIRS = [
  {ico:'&#128241;',name:'Pantalla iPhone',range:'$45.000 - $180.000'},
  {ico:'&#128267;',name:'Bateria iPhone',range:'$28.000 - $65.000'},
  {ico:'&#128241;',name:'Pantalla Samsung',range:'$40.000 - $150.000'},
  {ico:'&#128267;',name:'Bateria Samsung',range:'$25.000 - $55.000'},
  {ico:'&#128260;',name:'Conector de carga',range:'$22.000 - $48.000'},
  {ico:'&#127908;',name:'Microfono / Speaker',range:'$18.000 - $42.000'},
  {ico:'&#128247;',name:'Camara trasera',range:'$55.000 - $220.000'},
  {ico:'&#9881;',name:'Placa madre',range:'Consultar'},
  {ico:'&#128187;',name:'Pantalla MacBook',range:'$120.000 - $380.000'},
  {ico:'&#128267;',name:'Bateria MacBook',range:'$85.000 - $180.000'},
  {ico:'&#11035;',name:'Pantalla iPad',range:'$65.000 - $200.000'},
  {ico:'&#128268;',name:'Puerto USB-C / Lightning',range:'$20.000 - $45.000'}
];

var SELL_MODELS = {
  'iPhone':['iPhone 6','iPhone 6s','iPhone 6s Plus','iPhone 7','iPhone 7 Plus','iPhone 8','iPhone 8 Plus','iPhone X','iPhone XR','iPhone XS','iPhone XS Max','iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max','iPhone 12','iPhone 12 mini','iPhone 12 Pro','iPhone 12 Pro Max','iPhone 13','iPhone 13 mini','iPhone 13 Pro','iPhone 13 Pro Max','iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max'],
  'iPad':['iPad mini 5','iPad mini 6','iPad 9','iPad 10','iPad Air 4','iPad Air 5','iPad Air M2','iPad Pro 11 M1','iPad Pro 11 M2','iPad Pro 11 M4','iPad Pro 12.9 M1','iPad Pro 12.9 M2','iPad Pro 13 M4'],
  'MacBook':['MacBook Air 2019','MacBook Air M1','MacBook Air M2','MacBook Air M3','MacBook Pro 13 M1','MacBook Pro 14 M2','MacBook Pro 14 M3','MacBook Pro 16 M2','MacBook Pro 16 M3'],
  'Samsung':['Galaxy S21','Galaxy S21+','Galaxy S21 Ultra','Galaxy S22','Galaxy S22+','Galaxy S22 Ultra','Galaxy S23','Galaxy S23+','Galaxy S23 Ultra','Galaxy S24','Galaxy S24+','Galaxy S24 Ultra','Galaxy A52','Galaxy A53','Galaxy A54','Galaxy A55','Galaxy Z Flip 5','Galaxy Z Fold 5'],
  'Motorola':['Moto G 5G','Moto G Play','Moto G Power','Moto G Stylus','Moto Edge 30','Moto Edge 40','Moto Edge 50 Pro','Moto Edge 50 Ultra'],
  'Xiaomi':['Redmi Note 11','Redmi Note 12','Redmi Note 13','Xiaomi 12','Xiaomi 12T','Xiaomi 13','Xiaomi 13T','Xiaomi 14']
};

var COTIZ_BASE = {
  'iPhone 6':4500,'iPhone 6s':7000,'iPhone 6s Plus':8500,
  'iPhone 7':11000,'iPhone 7 Plus':14000,
  'iPhone 8':18000,'iPhone 8 Plus':22000,
  'iPhone X':36000,'iPhone XR':46000,'iPhone XS':50000,'iPhone XS Max':58000,
  'iPhone 11':76000,'iPhone 11 Pro':112000,'iPhone 11 Pro Max':128000,
  'iPhone 12':138000,'iPhone 12 mini':115000,'iPhone 12 Pro':185000,'iPhone 12 Pro Max':210000,
  'iPhone 13':242000,'iPhone 13 mini':198000,'iPhone 13 Pro':332000,'iPhone 13 Pro Max':365000,
  'iPhone 14':376000,'iPhone 14 Plus':420000,'iPhone 14 Pro':512000,'iPhone 14 Pro Max':565000,
  'iPhone 15':612000,'iPhone 15 Plus':668000,'iPhone 15 Pro':772000,'iPhone 15 Pro Max':838000,
  'iPhone 16':892000,'iPhone 16 Plus':960000,'iPhone 16 Pro':1142000,'iPhone 16 Pro Max':1248000,
  'iPad mini 5':55000,'iPad mini 6':120000,'iPad 9':65000,'iPad 10':110000,
  'iPad Air 4':130000,'iPad Air 5':180000,'iPad Air M2':240000,
  'iPad Pro 11 M1':220000,'iPad Pro 11 M2':290000,'iPad Pro 11 M4':420000,
  'iPad Pro 12.9 M1':280000,'iPad Pro 12.9 M2':350000,'iPad Pro 13 M4':520000,
  'MacBook Air 2019':180000,'MacBook Air M1':520000,'MacBook Air M2':780000,'MacBook Air M3':950000,
  'MacBook Pro 13 M1':680000,'MacBook Pro 14 M2':980000,'MacBook Pro 14 M3':1200000,
  'MacBook Pro 16 M2':1350000,'MacBook Pro 16 M3':1580000,
  'Galaxy S21':95000,'Galaxy S21+':120000,'Galaxy S21 Ultra':145000,
  'Galaxy S22':155000,'Galaxy S22+':175000,'Galaxy S22 Ultra':210000,
  'Galaxy S23':235000,'Galaxy S23+':265000,'Galaxy S23 Ultra':320000,
  'Galaxy S24':350000,'Galaxy S24+':420000,'Galaxy S24 Ultra':520000,
  'Galaxy A52':48000,'Galaxy A53':62000,'Galaxy A54':78000,'Galaxy A55':95000,
  'Galaxy Z Flip 5':380000,'Galaxy Z Fold 5':680000,
  'Moto G 5G':28000,'Moto G Play':18000,'Moto G Power':24000,'Moto G Stylus':35000,
  'Moto Edge 30':55000,'Moto Edge 40':85000,'Moto Edge 50 Pro':145000,'Moto Edge 50 Ultra':185000,
  'Redmi Note 11':38000,'Redmi Note 12':55000,'Redmi Note 13':72000,
  'Xiaomi 12':120000,'Xiaomi 12T':135000,'Xiaomi 13':175000,'Xiaomi 13T':210000,'Xiaomi 14':280000
};

var COTIZ_COND = {Impecable:1.0,'Muy bueno':0.82,Bueno:0.65,'Con danos':0.42};
var COTIZ_EXT = {pant:0.06,bat:0.05,icloud:0.08,caja:0.03,acc:0.03};
var SMULT = {
  '16 GB':0.75,'32 GB':0.80,'64 GB':0.85,'128 GB':0.92,'256 GB':1.0,'512 GB':1.12,'1 TB':1.25
};

var MODEL_STORAGES = {
  'iPhone 6':         ['16 GB','32 GB','64 GB','128 GB'],
  'iPhone 6s':        ['16 GB','32 GB','64 GB','128 GB'],
  'iPhone 6s Plus':   ['16 GB','32 GB','64 GB','128 GB'],
  'iPhone 7':         ['32 GB','128 GB','256 GB'],
  'iPhone 7 Plus':    ['32 GB','128 GB','256 GB'],
  'iPhone 8':         ['64 GB','256 GB'],
  'iPhone 8 Plus':    ['64 GB','256 GB'],
  'iPhone X':         ['64 GB','256 GB'],
  'iPhone XR':        ['64 GB','128 GB','256 GB'],
  'iPhone XS':        ['64 GB','256 GB','512 GB'],
  'iPhone XS Max':    ['64 GB','256 GB','512 GB'],
  'iPhone 11':        ['64 GB','128 GB','256 GB'],
  'iPhone 11 Pro':    ['64 GB','256 GB','512 GB'],
  'iPhone 11 Pro Max':['64 GB','256 GB','512 GB'],
  'iPhone 12':        ['64 GB','128 GB','256 GB'],
  'iPhone 12 mini':   ['64 GB','128 GB','256 GB'],
  'iPhone 12 Pro':    ['128 GB','256 GB','512 GB'],
  'iPhone 12 Pro Max':['128 GB','256 GB','512 GB'],
  'iPhone 13':        ['128 GB','256 GB','512 GB'],
  'iPhone 13 mini':   ['128 GB','256 GB','512 GB'],
  'iPhone 13 Pro':    ['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 13 Pro Max':['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 14':        ['128 GB','256 GB','512 GB'],
  'iPhone 14 Plus':   ['128 GB','256 GB','512 GB'],
  'iPhone 14 Pro':    ['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 14 Pro Max':['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 15':        ['128 GB','256 GB','512 GB'],
  'iPhone 15 Plus':   ['128 GB','256 GB','512 GB'],
  'iPhone 15 Pro':    ['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 15 Pro Max':['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 16':        ['128 GB','256 GB','512 GB'],
  'iPhone 16 Plus':   ['128 GB','256 GB','512 GB'],
  'iPhone 16 Pro':    ['128 GB','256 GB','512 GB','1 TB'],
  'iPhone 16 Pro Max':['128 GB','256 GB','512 GB','1 TB'],
  'iPad mini 5':      ['64 GB','256 GB'],
  'iPad mini 6':      ['64 GB','256 GB'],
  'iPad 9':           ['64 GB','256 GB'],
  'iPad 10':          ['64 GB','256 GB'],
  'iPad Air 4':       ['64 GB','256 GB'],
  'iPad Air 5':       ['64 GB','256 GB'],
  'iPad Air M2':      ['128 GB','256 GB','512 GB','1 TB'],
  'iPad Pro 11 M1':   ['128 GB','256 GB','512 GB','1 TB','2 TB'],
  'iPad Pro 11 M2':   ['128 GB','256 GB','512 GB','1 TB','2 TB'],
  'iPad Pro 11 M4':   ['256 GB','512 GB','1 TB','2 TB'],
  'iPad Pro 12.9 M1': ['128 GB','256 GB','512 GB','1 TB','2 TB'],
  'iPad Pro 12.9 M2': ['128 GB','256 GB','512 GB','1 TB','2 TB'],
  'iPad Pro 13 M4':   ['256 GB','512 GB','1 TB','2 TB'],
  'MacBook Air 2019': ['128 GB','256 GB','512 GB','1 TB'],
  'MacBook Air M1':   ['256 GB','512 GB','1 TB'],
  'MacBook Air M2':   ['256 GB','512 GB','1 TB','2 TB'],
  'MacBook Air M3':   ['256 GB','512 GB','1 TB','2 TB'],
  'MacBook Pro 13 M1':['256 GB','512 GB','1 TB','2 TB'],
  'MacBook Pro 14 M2':['512 GB','1 TB','2 TB'],
  'MacBook Pro 14 M3':['512 GB','1 TB','2 TB'],
  'MacBook Pro 16 M2':['512 GB','1 TB','2 TB'],
  'MacBook Pro 16 M3':['512 GB','1 TB','2 TB'],
  'Galaxy S21':       ['128 GB','256 GB'],
  'Galaxy S21+':      ['128 GB','256 GB'],
  'Galaxy S21 Ultra': ['128 GB','256 GB','512 GB'],
  'Galaxy S22':       ['128 GB','256 GB'],
  'Galaxy S22+':      ['128 GB','256 GB'],
  'Galaxy S22 Ultra': ['128 GB','256 GB','512 GB','1 TB'],
  'Galaxy S23':       ['128 GB','256 GB'],
  'Galaxy S23+':      ['128 GB','256 GB'],
  'Galaxy S23 Ultra': ['256 GB','512 GB','1 TB'],
  'Galaxy S24':       ['128 GB','256 GB'],
  'Galaxy S24+':      ['256 GB','512 GB'],
  'Galaxy S24 Ultra': ['256 GB','512 GB','1 TB'],
  'Galaxy A52':       ['128 GB','256 GB'],
  'Galaxy A53':       ['128 GB','256 GB'],
  'Galaxy A54':       ['128 GB','256 GB'],
  'Galaxy A55':       ['128 GB','256 GB'],
  'Galaxy Z Flip 5':  ['256 GB','512 GB'],
  'Galaxy Z Fold 5':  ['256 GB','512 GB','1 TB'],
  'Moto G 5G':        ['64 GB','128 GB','256 GB'],
  'Moto G Play':      ['32 GB','64 GB'],
  'Moto G Power':     ['64 GB','128 GB'],
  'Moto G Stylus':    ['64 GB','128 GB','256 GB'],
  'Moto Edge 30':     ['128 GB','256 GB'],
  'Moto Edge 40':     ['128 GB','256 GB'],
  'Moto Edge 50 Pro': ['256 GB','512 GB'],
  'Moto Edge 50 Ultra':['256 GB','512 GB'],
  'Redmi Note 11':    ['64 GB','128 GB','256 GB'],
  'Redmi Note 12':    ['128 GB','256 GB'],
  'Redmi Note 13':    ['128 GB','256 GB','512 GB'],
  'Xiaomi 12':        ['128 GB','256 GB'],
  'Xiaomi 12T':       ['128 GB','256 GB'],
  'Xiaomi 13':        ['128 GB','256 GB','512 GB'],
  'Xiaomi 13T':       ['128 GB','256 GB'],
  'Xiaomi 14':        ['256 GB','512 GB'],
};

var NB_DATA = {
  bases:[
    {name:'Notebook Basica',ico:'&#128187;',desc:'Intel Core / AMD Ryzen entry',price:380000},
    {name:'Notebook Pro',ico:'&#128187;',desc:'Performance para trabajo y diseño',price:620000},
    {name:'Notebook Gaming',ico:'&#127918;',desc:'GPU dedicada, pantalla 144Hz',price:950000},
    {name:'PC Escritorio',ico:'&#128421;',desc:'Armado a medida, torre completa',price:480000}
  ],
  cpus:[
    {name:'Intel Core i3',desc:'Doble nucleo, tareas basicas',price:0},
    {name:'Intel Core i5',desc:'Cuad nucleo, multitarea fluida',price:85000},
    {name:'Intel Core i7',desc:'8 nucleos, edicion y diseño',price:180000},
    {name:'Intel Core i9',desc:'16 nucleos, maxima potencia',price:320000},
    {name:'AMD Ryzen 5',desc:'6 nucleos, excelente precio-perf.',price:75000},
    {name:'AMD Ryzen 7',desc:'8 nucleos, gaming y contenido',price:165000}
  ],
  rams:[
    {name:'8 GB DDR5',price:0},
    {name:'16 GB DDR5',price:45000},
    {name:'32 GB DDR5',price:110000},
    {name:'64 GB DDR5',price:240000}
  ],
  storages:[
    {name:'256 GB SSD NVMe',price:0},
    {name:'512 GB SSD NVMe',price:38000},
    {name:'1 TB SSD NVMe',price:85000},
    {name:'2 TB SSD NVMe',price:165000},
    {name:'1 TB HDD + 256 SSD',price:30000}
  ],
  extras:[
    {name:'GPU RTX 3050',price:250000,multi:false},
    {name:'GPU RTX 4060',price:420000,multi:false},
    {name:'Windows 11 Pro',price:65000,multi:true},
    {name:'Kit trabajo (mouse+pad)',price:28000,multi:true},
    {name:'Garantia extendida 24m',price:55000,multi:true}
  ]
};

var ACCS = [
  {id:0,ico:'&#128268;',name:'Cargador USB-C 30W',sub:'Carga rapida certificada',price:22000,cat:'cargadores'},
  {id:1,ico:'&#128268;',name:'Cargador MagSafe 15W',sub:'Original Apple',price:38000,cat:'cargadores'},
  {id:2,ico:'&#128268;',name:'Cargador Anker 65W GaN',sub:'Triple puerto, ultra compacto',price:52000,cat:'cargadores'},
  {id:3,ico:'&#127911;',name:'AirPods Pro 2da Gen',sub:'ANC + Modo Transparencia',price:280000,cat:'auriculares'},
  {id:4,ico:'&#127911;',name:'JBL Tune 720BT',sub:'Over-ear Pure Bass 76hs',price:120000,cat:'auriculares'},
  {id:5,ico:'&#127911;',name:'EarPods USB-C',sub:'Original Apple',price:28000,cat:'auriculares'},
  {id:6,ico:'&#128266;',name:'JBL Flip 7',sub:'Portatil 20hs IP68',price:165000,cat:'parlantes'},
  {id:7,ico:'&#128266;',name:'JBL Charge 5',sub:'Resistente al agua 20hs',price:235000,cat:'parlantes'},
  {id:8,ico:'&#128266;',name:'JBL Go 4',sub:'Ultra compacto IP67',price:68000,cat:'parlantes'},
  {id:9,ico:'&#128737;',name:'Funda MagSafe transparente',sub:'Todos los modelos iPhone',price:14000,cat:'fundas'},
  {id:10,ico:'&#128737;',name:'Vidrio templado 9H',sub:'iPhone y Samsung',price:8500,cat:'fundas'},
  {id:11,ico:'&#128737;',name:'Funda silicona Apple',sub:'Todos los modelos',price:28000,cat:'fundas'},
  {id:12,ico:'&#128279;',name:'Cable USB-C trenzado 2m',sub:'Carga rapida + datos',price:9500,cat:'cables'},
  {id:13,ico:'&#128279;',name:'Cable MagSafe 1m',sub:'Original Apple',price:16000,cat:'cables'}
];

var shopFilter='todos';
var accFilter='todos';
var sliderIdx=0;
var sliderTimer=null;
var currentProd=null;
