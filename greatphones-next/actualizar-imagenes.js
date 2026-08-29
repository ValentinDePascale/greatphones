/**
 * Script para actualizar las imágenes de iPhones en la BD
 * Ejecutar desde: cd greatphones-next && node ../actualizar-imagenes.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const IMAGENES = {
  'iPhone 8': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwOCUyMHdoaXRlJTIwYmFja2dyb3VuZCUyMHByb2R1Y3QlMjBwaG90b3xlbnwwfHx8fDE3ODc5NzExNDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 8 Plus': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwOCUyMFBsdXMlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone X': 'https://images.unsplash.com/photo-1561654791-00316c79efa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwWCUyMHdoaXRlJTIwYmFja2dyb3VuZCUyMHByb2R1Y3QlMjBwaG90b3xlbnwwfHx8fDE3ODc5NzExNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone XS': 'https://images.unsplash.com/photo-1561654791-00316c79efa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwWFMlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone XS Max': 'https://images.unsplash.com/photo-1628097400131-3dd85a96854c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwWFMlMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone XR': 'https://images.unsplash.com/photo-1552257320-fd7788389c8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwWFIlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 11': 'https://images.unsplash.com/photo-1592832122594-c0c6bad718b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTElMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 11 Pro': 'https://images.unsplash.com/photo-1592832122594-c0c6bad718b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTElMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 11 Pro Max': 'https://images.unsplash.com/photo-1600262606369-acb8a2cf69fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTElMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 12': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTIlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 12 mini': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTIlMjBtaW5pJTIwd2hpdGUlMjBiYWNrZ3JvdW5kJTIwcHJvZHVjdCUyMHBob3RvfGVufDB8fHx8MTc4Nzk3MTE1OHww&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 12 Pro': 'https://images.unsplash.com/photo-1611791483156-41ff881d633c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTIlMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 12 Pro Max': 'https://images.unsplash.com/photo-1759588071781-2c3ba9128497?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTIlMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 13': 'https://images.unsplash.com/photo-1652721367098-0ecad4cc0370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTMlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTYzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 13 mini': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTMlMjBtaW5pJTIwd2hpdGUlMjBiYWNrZ3JvdW5kJTIwcHJvZHVjdCUyMHBob3RvfGVufDB8fHx8MTc4Nzk3MTE2NHww&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 13 Pro': 'https://images.unsplash.com/photo-1652721367098-0ecad4cc0370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTMlMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 13 Pro Max': 'https://images.unsplash.com/photo-1641460232841-e283da213de6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTMlMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 14': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTQlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 14 Plus': 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTQlMjBQbHVzJTIwd2hpdGUlMjBiYWNrZ3JvdW5kJTIwcHJvZHVjdCUyMHBob3RvfGVufDB8fHx8MTc4Nzk3MTE3MHww&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 14 Pro': 'https://images.unsplash.com/photo-1664478546384-d57ffe74a78c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTQlMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTcyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 14 Pro Max': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTQlMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTczfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 15': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTUlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 15 Plus': 'https://images.unsplash.com/photo-1705041053314-2c1eb71473dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTUlMjBQbHVzJTIwd2hpdGUlMjBiYWNrZ3JvdW5kJTIwcHJvZHVjdCUyMHBob3RvfGVufDB8fHx8MTc4Nzk3MTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 15 Pro': 'https://images.unsplash.com/photo-1716882173326-04d822f142a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTUlMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTc4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 15 Pro Max': 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTUlMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 16': 'https://images.unsplash.com/photo-1693822845595-862bacc31cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTYlMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTgxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 16 Plus': 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTYlMjBQbHVzJTIwd2hpdGUlMjBiYWNrZ3JvdW5kJTIwcHJvZHVjdCUyMHBob3RvfGVufDB8fHx8MTc4Nzk3MTE4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 16 Pro': 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTYlMjBQcm8lMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'iPhone 16 Pro Max': 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMDQ3ODk4fDB8MXxzZWFyY2h8MXx8aVBob25lJTIwMTYlMjBQcm8lMjBNYXglMjB3aGl0ZSUyMGJhY2tncm91bmQlMjBwcm9kdWN0JTIwcGhvdG98ZW58MHx8fHwxNzg3OTcxMTg1fDA&ixlib=rb-4.1.0&q=80&w=1080'
};

async function actualizarImagenes() {
  console.log('[INICIANDO] Actualización de imágenes de iPhones...\n');

  let actualizados = 0;
  let errores = 0;

  for (const [modelo, imageUrl] of Object.entries(IMAGENES)) {
    try {
      const resultado = await prisma.priceList.updateMany({
        where: { modelo, category: 'CELULAR' },
        data: { imageUrl }
      });

      if (resultado.count > 0) {
        console.log(`[OK] ${modelo} - ${resultado.count} registro(s) actualizado(s)`);
        actualizados += resultado.count;
      } else {
        console.log(`[NO ENCONTRADO] ${modelo}`);
      }
    } catch (error) {
      console.error(`[ERROR] ${modelo}: ${error.message}`);
      errores++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESUMEN:`);
  console.log(`- Total actualizados: ${actualizados}`);
  console.log(`- Errores: ${errores}`);
  console.log(`- Modelos procesados: ${Object.keys(IMAGENES).length}`);
  console.log('='.repeat(60) + '\n');

  await prisma.$disconnect();
}

actualizarImagenes().catch(err => {
  console.error('[ERROR FATAL]', err);
  process.exit(1);
});
