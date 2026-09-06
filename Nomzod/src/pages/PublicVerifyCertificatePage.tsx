import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyCertificate } from '../services/api';
import { CandidateCertificateCanvas, downloadLosslessCandidateCertificate } from '../components/CandidateCertificateCanvas';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Download, ArrowLeft } from 'lucide-react';

export const PublicVerifyCertificatePage: React.FC = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<{
    isValid: boolean;
    status?: string;
    message?: string;
    revokeReason?: string;
    certificate?: any;
  } | null>(null);

  useEffect(() => {
    if (!certificateNumber) return;

    const verify = async () => {
      try {
        setLoading(true);
        const data = await verifyCertificate(certificateNumber);
        setResult(data);
      } catch (err) {
        console.error('Verification error:', err);
        setResult({ isValid: false, message: 'Tekshirish jarayonida xatolik yuz berdi' });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [certificateNumber]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full space-y-6">
        {/* Top bar with back to home */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ishber Portaliga qaytish</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Rasmiy Sertifikat Tekshiruvi</span>
          </div>
        </div>

        {/* Verification Result Card */}
        {loading ? (
          <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-sm text-slate-400 font-medium">Sertifikat haqiqiyligi tekshirilmoqda...</p>
          </div>
        ) : !result || !result.isValid ? (
          <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl border border-red-500/30 text-center space-y-4">
            {result?.status === 'revoked' ? (
              <>
                <div className="h-16 w-16 bg-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Sertifikat Bekor Qilingan!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  № <strong className="font-mono text-amber-400">{certificateNumber}</strong> raqamli sertifikat admin tomonidan bekor qilingan.
                </p>
                {result.revokeReason && (
                  <div className="p-3 bg-slate-950/80 rounded-xl text-xs text-slate-400 border border-slate-800">
                    Bekor qilish sababi: {result.revokeReason}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-red-500/20 text-red-400 rounded-3xl flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Sertifikat Topilmadi!</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  № <strong className="font-mono text-indigo-400">{certificateNumber}</strong> raqami ostida hech qanday rasmiy sertifikat ro‘yxatdan o‘tmagan.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-500/5">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Rasmiy Sertifikat Tasdiqlandi</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300">
                      FAOL
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    № {result.certificate.certificateNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  downloadLosslessCandidateCertificate(
                    result.certificate,
                    `Sertifikat_${result.certificate.candidateName.replace(/\s+/g, '_')}_${result.certificate.certificateNumber}.png`
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <Download className="h-4 w-4" />
                <span>Lossless PNG yuklab olish</span>
              </button>
            </div>

            {/* Candidate & Vacancy Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Nomzod
                </span>
                <span className="text-base font-bold text-white">
                  {result.certificate.candidateName}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Yo‘nalish / Vakansiya
                </span>
                <span className="text-base font-bold text-indigo-300">
                  {result.certificate.vacancyTitle || 'Maxsus tayyorgarlik'}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Berilgan sana
                </span>
                <span className="text-base font-bold text-slate-200">
                  {new Date(result.certificate.issueDate).toLocaleDateString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* High Resolution Vector Certificate Rendering */}
            <div className="p-2 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <CandidateCertificateCanvas
                template={result.certificate.templateSnapshot || result.certificate.templateId}
                candidateName={result.certificate.candidateName}
                vacancyTitle={result.certificate.vacancyTitle}
                certificateNumber={result.certificate.certificateNumber}
                issueDate={result.certificate.issueDate}
                qrUrl={result.certificate.qrVerificationUrl}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVerifyCertificatePage;
