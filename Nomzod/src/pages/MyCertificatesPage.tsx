import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidateCertificates } from '../services/api';
import { CandidateCertificateCanvas, downloadLosslessCandidateCertificate } from '../components/CandidateCertificateCanvas';
import { Award, Download, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const MyCertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const phone = localStorage.getItem('nomzod_phone') || '';
  const candidateName = localStorage.getItem('nomzod_name') || 'Nomzod';

  useEffect(() => {
    if (!phone) {
      navigate('/login');
      return;
    }

    const loadCertificates = async () => {
      try {
        setLoading(true);
        const data = await getCandidateCertificates(phone);
        setCertificates(data || []);
        if (data && data.length > 0) {
          setSelectedCert(data[0]);
        }
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [phone, navigate]);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
              title="Orqaga"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-600" /> Rasmiy Natijalar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Mening Sertifikatlarim
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Ishber tizimi orqali muvaffaqiyatli yakunlagan o‘quv kurslaringiz va sertifikatlaringiz
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs sm:text-sm transition flex items-center gap-2"
        >
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-200 shadow-xs">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <p className="text-sm font-medium">Sertifikatlaringiz yuklanmoqda...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto text-2xl">
            🎓
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Sizda hozircha berilgan sertifikatlar mavjud emas
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Sertifikat olish uchun o‘zingiz qabul qilingan vakansiya bo‘yicha barcha darslarni o‘rganib, testlarni bajaring va Yakuniy Imtihonni muvaffaqiyatli topshiring.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 transition"
            >
              📚 Darslarni boshlash
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Certificates List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1">
              Topshirilgan sertifikatlar ({certificates.length})
            </h2>

            <div className="space-y-3">
              {certificates.map((cert) => {
                const isSelected = selectedCert?._id === cert._id;
                return (
                  <div
                    key={cert._id}
                    onClick={() => setSelectedCert(cert)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {cert.certificateNumber}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="h-3 w-3" /> Haqiqiy
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {cert.vacancyTitle || 'Malaka sertifikati'}
                    </h3>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                      <span>Berilgan sana:</span>
                      <span className="font-medium text-gray-700">
                        {new Date(cert.issueDate).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Main Preview & Download (8 cols) */}
          {selectedCert && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedCert.vacancyTitle || 'Sertifikat'}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      Sertifikat raqami: {selectedCert.certificateNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      downloadLosslessCandidateCertificate(
                        selectedCert,
                        `Sertifikat_${(candidateName || selectedCert.candidateName).replace(/\s+/g, '_')}_${selectedCert.certificateNumber}.png`
                      )
                    }
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Yuqori sifatda (Lossless PNG) yuklab olish</span>
                  </button>
                </div>

                {/* Live Canvas Vector Preview */}
                <div className="p-2 sm:p-4 bg-slate-950 rounded-2xl border border-gray-200 shadow-inner flex items-center justify-center">
                  <div className="w-full">
                    <CandidateCertificateCanvas
                      template={selectedCert.templateSnapshot || selectedCert.templateId}
                      candidateName={selectedCert.candidateName || candidateName}
                      vacancyTitle={selectedCert.vacancyTitle}
                      certificateNumber={selectedCert.certificateNumber}
                      issueDate={selectedCert.issueDate}
                      qrUrl={selectedCert.qrVerificationUrl}
                    />
                  </div>
                </div>

                {/* Verification Notice Bar */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      Ushbu sertifikat rasmiy QR-kod bilan himoyalangan va har qanday vaqtda onlayn tekshirilishi mumkin.
                    </span>
                  </div>

                  <a
                    href={selectedCert.qrVerificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-blue-700 hover:text-blue-900 whitespace-nowrap"
                  >
                    Haqiqiyligini tekshirish ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCertificatesPage;
