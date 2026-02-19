// program untuk menghapus semua data dalam tabel Voter
require('dotenv').config();
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library';
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearTable() {
  console.log("🗑️  Clearing all data from Voter table...\n");
  
  try {
    const result = await prisma.voter.deleteMany({});
    console.log(`✅ Successfully deleted ${result.count} record(s) from the Voter table.`);
    
      // Reset the sequence to start from 1 (find actual sequence name)
      try {
        const seqResult = await pool.query(
          "SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name ILIKE '%voter%id%seq%' ORDER BY sequence_name LIMIT 1"
        );

        if (seqResult.rows.length === 0) {
          console.warn('⚠️  No sequence found for Voter.id. Skipping sequence reset.');
        } else {
          const { sequence_schema, sequence_name } = seqResult.rows[0];
          await pool.query(`ALTER SEQUENCE "${sequence_schema}"."${sequence_name}" RESTART WITH 1`);
          console.log("✅ Successfully reset ID sequence to start from 1.");
        }
      } catch (seqError) {
        console.warn('⚠️  Failed to reset ID sequence:', seqError.message);
      }
  } catch (error) {
    console.error('🔥 Error clearing table:', error.message);
  }
}

clearTable()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
