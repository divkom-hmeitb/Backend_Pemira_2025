// broadcast.js
require('dotenv').config(); // Wajib di baris paling atas
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library';
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runBroadcast() {
  console.log("🚀 Mencoba menghubungkan ke database CockroachDB...");
  
  try {
    // 1. Validasi file JSON
    if (!fs.existsSync('./Voters.json')) {
      throw new Error("File Voters.json tidak ditemukan!");
    }
    const rawData = fs.readFileSync('./Voters.json');
    const dptList = JSON.parse(rawData);

    // Load email template
    let emailTemplate = '';
    if (fs.existsSync('./email-template.html')) {
      emailTemplate = fs.readFileSync('./email-template.html', 'utf8');
    }

    console.log(`📡 Memulai broadcast untuk ${dptList.length} mahasiswa HME...`);

    // Konfigurasi SMTP (Gunakan App Password 16 digit kamu)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const generateToken = (length = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let token = '';
      for (let i = 0; i < length; i += 1) {
        token += chars[Math.floor(Math.random() * chars.length)];
      }
      return token;
    };

    for (const student of dptList) {
      const token = generateToken();

      try {
        // 2. Simpan ke Database
        await prisma.voter.upsert({
          where: { nim: student.nim },
          update: { token: token },
          create: {
            nim: student.nim,
            name: student.name,
            token: token,
            isVoteCakahim: false,
            isVoteCasenat: false,
          },
        });

        // 3. Kirim Email
        let emailHtml = emailTemplate || `
            <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px;">
              <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,.08)">
                <div style="background:#0b5ed7; color:#fff; padding:20px 24px;">
                  <h2 style="margin:0; font-size:20px;">Pemira HME ITB 2026</h2>
                  <p style="margin:6px 0 0; font-size:14px; opacity:.9;">Token Voting Resmi</p>
                </div>
                <div style="padding:24px; color:#1f2937;">
                  <p style="margin:0 0 12px; font-size:16px;">Halo <strong>${student.name}</strong>,</p>
                  <p style="margin:0 0 16px; font-size:14px; line-height:1.6;">
                    Berikut token voting Pemira HME ITB 2026 Anda. Simpan token ini dengan baik dan jangan dibagikan ke siapa pun. Masukan Token ini di halaman login saat proses voting nanti.
                  </p>
                  <div style="background:#f0f4ff; border:1px dashed #0b5ed7; padding:16px; text-align:center; border-radius:10px;">
                    <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">TOKEN ANDA</div>
                    <div style="font-size:24px; letter-spacing:4px; font-weight:700; color:#0b5ed7;">${token}</div>
                  </div>
                  <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">
                    Jika Anda merasa bukan anggota HME ITB, abaikan email ini.
                  </p>
                </div>
                <div style="padding:12px 24px; background:#f9fafb; font-size:12px; color:#9ca3af; text-align:center;">
                  Panitia Pemira HME ITB • 2026
                </div>
              </div>
            </div>
          `;
        
        // Replace template variables
        emailHtml = emailHtml
          .replace(/{{NAMA_PENERIMA}}/g, student.name)
          .replace(/{{TOKEN}}/g, token);

        await transporter.sendMail({
          from: `"Panitia Pemira HME ITB" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: '[PENTING] Token Voting Pemira HME ITB 2026',
          html: emailHtml
        });

        console.log(`✅ Sukses: ${student.nim}`);
      } catch (err) {
        console.error(`❌ Gagal di NIM ${student.nim}:`, err.message);
      }
    }
    console.log("✨ Selesai!");
  } catch (error) {
    console.error('🔥 Error Fatal:', error.message);
  }
}

runBroadcast()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });