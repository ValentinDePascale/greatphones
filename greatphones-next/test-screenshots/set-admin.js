const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
(async () => {
  const user = await prisma.user.update({
    where: { email: 'admin@greatphones.com.ar' },
    data: { role: 'ADMIN', verified: true }
  });
  console.log('Updated:', user.email, 'role:', user.role);
  await prisma.$disconnect();
})();
