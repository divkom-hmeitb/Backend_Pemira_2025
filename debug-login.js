require('dotenv').config();
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library';
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const voter = await prisma.voter.findFirst({
      where: { nim: '13223010', token: 'ZHWRMK' }
    });
    console.log('VOTER', voter);
  } catch (error) {
    console.error('ERROR', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
