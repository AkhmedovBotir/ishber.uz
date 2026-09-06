/**
 * Non-Destructive Database Migration & Health Check Script
 * Bu skript ma'lumotlar bazasidagi mavjud ma'lumotlarga UMUMAN teginmaydi va o'chirmaydi.
 * Faqatgina yangi modellar (Sertifikatlar, Shablonlar) uchun indekslarni tekshiradi
 * va agar shablon mavjud bo'lmasa, dastlabki namuna shablonni xavfsiz yaratadi.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');

// Import models
const { Admin } = require('../models/Admin');
const { Vacancy } = require('../models/Vacancy');
const { ApplicationForm } = require('../models/ApplicationForm');
const { ApplicationSubmission } = require('../models/ApplicationSubmission');
const { Interview } = require('../models/Interview');
const { SystemSettings } = require('../models/SystemSettings');
const { LearningMaterial } = require('../models/LearningMaterial');
const { FinalExam } = require('../models/FinalExam');
const { FinalExamSubmission } = require('../models/FinalExamSubmission');
const CertificateTemplate = require('../models/CertificateTemplate');
const Certificate = require('../models/Certificate');

async function runSafeMigration() {
  console.log('----------------------------------------------------');
  console.log('🚀 Xavfsiz migratsiya va bazani tekshirish boshlandi...');
  console.log('----------------------------------------------------');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI .env faylida topilmadi!');
    process.exit(1);
  }

  try {
    await connectDb(uri);
    console.log('✅ MongoDB ma\'lumotlar bazasiga muvaffaqiyatli ulandi.');

    // 1. Mavjud ma'lumotlarni hisoblash (Verification)
    console.log('\n📊 Mavjud ma\'lumotlar holati:');
    const adminCount = await Admin.countDocuments();
    const vacancyCount = await Vacancy.countDocuments();
    const formCount = await ApplicationForm.countDocuments();
    const submissionCount = await ApplicationSubmission.countDocuments();
    const interviewCount = await Interview.countDocuments();
    const materialCount = await LearningMaterial.countDocuments();
    const finalExamCount = await FinalExam.countDocuments();
    const finalSubCount = await FinalExamSubmission.countDocuments();
    const templateCount = await CertificateTemplate.countDocuments();
    const certCount = await Certificate.countDocuments();

    console.log(` - Adminlar: ${adminCount} ta`);
    console.log(` - Vakansiyalar: ${vacancyCount} ta`);
    console.log(` - Ariza formalari: ${formCount} ta`);
    console.log(` - Nomzod arizalari: ${submissionCount} ta`);
    console.log(` - Suhbatlar: ${interviewCount} ta`);
    console.log(` - O'quv materiallari: ${materialCount} ta`);
    console.log(` - Yakuniy imtihonlar: ${finalExamCount} ta`);
    console.log(` - Yakuniy imtihon topshirganlar: ${finalSubCount} ta`);
    console.log(` - Sertifikat shablonlari: ${templateCount} ta`);
    console.log(` - Berilgan sertifikatlar: ${certCount} ta`);

    // 2. Yangi indekslarni xavfsiz yaratish (Hech qanday ma'lumot o'chirilmaydi)
    console.log('\n🔧 Indekslarni xavfsiz sinxronlash (createIndexes)...');
    await CertificateTemplate.createIndexes();
    await Certificate.createIndexes();
    await FinalExamSubmission.createIndexes();
    console.log('✅ Barcha yangi indekslar muvaffaqiyatli yaratildi.');

    // 3. Agar sertifikat shabloni umuman mavjud bo'lmasa, dastlabki namuna shablonni xavfsiz yaratish
    if (templateCount === 0) {
      console.log('\n🎨 Baza bo\'sh bo\'lgani sababli dastlabki namuna sertifikat shabloni yaratilmoqda...');
      const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f8fafc"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ca8a04"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#bg)"/>
        <rect x="40" y="40" width="1840" height="1000" fill="none" stroke="url(#gold)" stroke-width="4" rx="20"/>
        <rect x="55" y="55" width="1810" height="970" fill="none" stroke="#e2e8f0" stroke-width="1.5" rx="16"/>
        <circle cx="960" cy="140" r="45" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
        <path d="M960 115 L967 130 L984 132 L971 144 L975 161 L960 152 L945 161 L949 144 L936 132 L953 130 Z" fill="#ca8a04"/>
        <text x="960" y="240" font-family="'Cinzel', serif" font-size="38" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="4">SERTIFIKAT</text>
        <text x="960" y="280" font-family="'Montserrat', sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle" letter-spacing="6">MALAKA VA NATIJA TASDIQNOMASI</text>
        <text x="960" y="370" font-family="'Inter', sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Ushbu sertifikat muvaffaqiyatli topshirilganligi uchun berildi:</text>
        <line x1="400" y1="520" x2="1520" y2="520" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="960" y="560" font-family="'Inter', sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Quyidagi yo'nalish / vakansiya bo'yicha yakuniy sinovdan a'lo o'tdi:</text>
        <line x1="300" y1="910" x2="650" y2="910" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="475" y="940" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#475569" text-anchor="middle">Kompaniya Rahbari / HR</text>
      </svg>`;

      const sampleDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleSvg)}`;

      await CertificateTemplate.create({
        name: 'Klassik Oltin Standart',
        description: 'Rasmiy Ishber sertifikati shabloni',
        backgroundImageUrl: sampleDataUrl,
        originalWidth: 1920,
        originalHeight: 1080,
        isDefault: true,
        elements: {
          name: {
            x: 15,
            y: 40,
            width: 70,
            height: 12,
            fontFamily: 'Great Vibes',
            fontSize: 56,
            fontWeight: 'normal',
            color: '#0f172a',
            textAlign: 'center',
            uppercase: false,
            visible: true
          },
          vacancy: {
            x: 15,
            y: 56,
            width: 70,
            height: 8,
            fontFamily: 'Montserrat',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#334155',
            textAlign: 'center',
            uppercase: true,
            visible: true
          },
          qr: {
            x: 74,
            y: 72,
            width: 16,
            height: 16,
            visible: true
          },
          date: {
            x: 10,
            y: 82,
            width: 28,
            height: 6,
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: '500',
            color: '#475569',
            textAlign: 'center',
            visible: true
          },
          certificateNumber: {
            x: 35,
            y: 90,
            width: 30,
            height: 5,
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '600',
            color: '#64748b',
            textAlign: 'center',
            uppercase: true,
            visible: true
          }
        }
      });
      console.log('✅ Namuna shablon muvaffaqiyatli saqlandi.');
    } else {
      console.log(`\nℹ️ Bazada ${templateCount} ta shablon mavjud, shablonlarga tegilmadi.`);
    }

    console.log('\n----------------------------------------------------');
    console.log('🎉 Migratsiya muvaffaqiyatli yakunlandi!');
    console.log('🔒 Serverdagi barcha ma\'lumotlar 100% to\'liq va xavfsiz saqlanmoqda.');
    console.log('----------------------------------------------------\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migratsiya jarayonida xatolik:', error);
    process.exit(1);
  }
}

runSafeMigration();
