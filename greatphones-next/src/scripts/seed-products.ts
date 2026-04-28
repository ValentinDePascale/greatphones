import 'dotenv/config'
import { prisma } from '../lib/prisma'

const products = [
  {name:'iPhone 15 Pro',ico:'📱',brand:'iPhone',sub:'256 GB Titanio Natural',condition:'Nuevo',price:1320000,cost:980000,battery:91,stock:3,score:97,color:'Titanio Natural',screen:6.1,type:'celular',imei:'354821093847561',sold:34},
  {name:'MacBook Air M2',ico:'💻',brand:'MacBook',sub:'8 GB RAM / 256 GB SSD',condition:'Nuevo',price:1850000,cost:1400000,battery:null,stock:2,score:99,color:'Midnight',screen:13.6,type:'laptop',imei:'FVFXQ2BQ3C',sold:18},
  {name:'iPhone 14',ico:'📱',brand:'iPhone',sub:'128 GB Azul',condition:'Usado',price:890000,cost:650000,battery:86,stock:5,score:88,color:'Azul',screen:6.1,type:'celular',imei:'354821093847562',sold:51},
  {name:'Galaxy S24 Ultra',ico:'🌌',brand:'Samsung',sub:'256 GB Titanio Negro',condition:'Nuevo',price:1580000,cost:1200000,battery:null,stock:1,score:96,color:'Titanio Negro',screen:6.8,type:'celular',imei:'354821093847563',sold:12},
  {name:'iPad Pro M4',ico:'🖥',brand:'iPad',sub:'11" 256 GB WiFi',condition:'Nuevo',price:1420000,cost:1080000,battery:null,stock:2,score:98,color:'Plata',screen:11,type:'tablet',imei:'DMPRX2BQ1A',sold:9},
  {name:'iPhone 13 Pro',ico:'📱',brand:'iPhone',sub:'256 GB Graphite',condition:'Usado',price:980000,cost:720000,battery:89,stock:4,score:92,color:'Graphite',screen:6.1,type:'celular',imei:'354821093847565',sold:67},
  {name:'iPhone 12 Pro',ico:'📱',brand:'iPhone',sub:'128 GB Pacific Blue',condition:'Usado',price:680000,cost:490000,battery:84,stock:6,score:82,color:'Pacific Blue',screen:6.1,type:'celular',imei:'354821093847566',sold:43},
  {name:'iMac 24" M3',ico:'🗼',brand:'Mac',sub:'8 GB RAM / 256 GB SSD',condition:'Nuevo',price:2680000,cost:2100000,battery:null,stock:1,score:99,color:'Azul',screen:24,type:'desktop',imei:'FVFXQ2BQ3D',sold:4},
  {name:'iPhone 16 Pro',ico:'📱',brand:'iPhone',sub:'256 GB Titanio Desierto',condition:'Nuevo',price:1680000,cost:1280000,battery:null,stock:2,score:99,color:'Titanio Desierto',screen:6.3,type:'celular',imei:'354821093847568',sold:8},
  {name:'Galaxy S23+',ico:'🌌',brand:'Samsung',sub:'256 GB Cream',condition:'Usado',price:780000,cost:570000,battery:87,stock:3,score:85,color:'Cream',screen:6.6,type:'celular',imei:'354821093847569',sold:29},
  {name:'Moto Edge 50 Pro',ico:'👨‍💻',brand:'Motorola',sub:'256 GB Black Beauty',condition:'Nuevo',price:520000,cost:380000,battery:null,stock:4,score:78,color:'Black Beauty',screen:6.7,type:'celular',imei:'354821093847570',sold:15},
  {name:'Xiaomi 13T',ico:'🔴',brand:'Xiaomi',sub:'256 GB Alpine Blue',condition:'Nuevo',price:480000,cost:340000,battery:null,stock:5,score:75,color:'Alpine Blue',screen:6.67,type:'celular',imei:'354821093847571',sold:21}
]

async function main() {
  for (const p of products) {
    const created = await prisma.product.create({
      data: p
    })
    console.log('Created:', created.name)
  }
  console.log('All products created!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())