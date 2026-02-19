// program untuk melihat semua data dalam tabel Voter
require('dotenv').config();
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library';
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function viewTable() {
  console.log("📊 Fetching data from Voter table...\n");
  
  try {
    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (voters.length === 0) {
      console.log("❌ No data found in the table.");
      return;
    }

    console.log(`✅ Found ${voters.length} voter(s):\n`);
    console.log("=".repeat(120));
    
    voters.forEach((voter, index) => {
      console.log(`\n[${index + 1}] ID: ${voter.id}`);
      console.log(`    NIM          : ${voter.nim}`);
      console.log(`    Name         : ${voter.name}`);
      console.log(`    Token        : ${voter.token}`);
      console.log(`    Vote Kahim   : ${voter.isVoteCakahim ? '✓ Sudah' : '✗ Belum'}`);
      console.log(`    Vote Senator : ${voter.isVoteCasenat ? '✓ Sudah' : '✗ Belum'}`);
      console.log(`    Pilihan Ketua Himpunan : ${voter.kahimChoice || '-'}`);
      console.log(`    Pilihan Senator : ${voter.senatorChoice || '-'}`);
      console.log(`    Cloudinary URL: ${voter.cloudinaryUrl || '-'}`);
      console.log(`    Voted Date   : ${voter.votedDate || '-'}`);
      console.log(`    Voted Time   : ${voter.votedTime || '-'}`);
      console.log(`    Created At   : ${voter.createdAt.toLocaleString('id-ID')}`);
    });
    
    console.log("\n" + "=".repeat(120));
  } catch (error) {
    console.error('🔥 Error fetching data:', error.message);
  }
}

viewTable()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
