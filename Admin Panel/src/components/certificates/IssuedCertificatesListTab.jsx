import React, { useState, useEffect } from 'react';
import { listCertificates, revokeCertificate, deleteCertificate } from '../../services/certificateService';
import { CertificateCanvas, downloadLosslessCertificate } from './CertificateCanvas';
import { useModal } from '../../context/ModalContext';

export const IssuedCertificatesListTab = () => {
  const { alert: showAlert, confirm: showConfirm } = useModal();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Preview modal
  const [previewCert, setPreviewCert] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await listCertificates(params);
      if (res.success) {
        setCertificates(res.data.certificates || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCertificates();
  };

  const handleRevoke = async (cert) => {
    const ok = await showConfirm(
      `Rostdan ham № ${cert.certificateNumber} (${cert.candidateName}) sertifikatini bekor qilmoqchimisiz?`,
      {
        title: 'Sertifikatni bekor qilish',
        confirmText: 'Ha, bekor qilinsin',
        cancelText: 'Ortga',
        danger: true
      }
    );
    if (ok) {
      try {
        await revokeCertificate(cert._id, 'Admin tomonidan bekor qilindi');
        fetchCertificates();
        showAlert('Sertifikat muvaffaqiyatli bekor qilindi', { title: 'Bajarildi' });
      } catch (err) {
        showAlert(err.message, { title: 'Xatolik' });
      }
    }
  };

  const handleDelete = async (cert) => {
    const ok = await showConfirm(
      `№ ${cert.certificateNumber} sertifikatini bazadan butunlay o'chirib tashlamoqchimisiz?`,
      {
        title: "Sertifikatni o'chirish",
        confirmText: "O'chirish",
        cancelText: 'Bekor qilish',
        danger: true
      }
    );
    if (ok) {
      try {
        await deleteCertificate(cert._id);
        fetchCertificates();
      } catch (err) {
        showAlert(err.message, { title: 'Xatolik' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Sertifikat raqami, ism yoki telefon bo'yicha izlash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Qidirish
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">Barcha holatlar</option>
            <option value="active">Faol sertifikatlar</option>
            <option value="revoked">Bekor qilinganlar</option>
          </select>

          <button
            type="button"
            onClick={fetchCertificates}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-600 transition cursor-pointer shadow-xs"
            title="Yangilash"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-sm font-medium text-gray-600">Berilgan sertifikatlar ro'yxati yuklanmoqda...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <div className="text-4xl">📜</div>
            <p className="text-base font-bold text-gray-900">Hozircha hech qanday sertifikat berilmagan</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              "Sertifikat berish" bo'limi orqali nomzodlarga sertifikat taqdim etishingiz mumkin.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4">Sertifikat №</th>
                    <th className="px-5 py-4">Nomzod</th>
                    <th className="px-5 py-4">Telefon</th>
                    <th className="px-5 py-4">Vakansiya</th>
                    <th className="px-5 py-4">Berilgan sana</th>
                    <th className="px-5 py-4">Holat</th>
                    <th className="px-5 py-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-blue-700">
                        {cert.certificateNumber}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {cert.candidateName.charAt(0).toUpperCase()}
                          </div>
                          {cert.candidateName}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-700">{cert.candidatePhone}</td>
                      <td className="px-5 py-4">
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {cert.vacancyTitle || 'Umumiy'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(cert.issueDate).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {cert.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span>●</span> Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <span>✕</span> Bekor qilingan
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                            title="Ko'rish"
                          >
                            👁️
                          </button>

                          {/* Download lossless PNG Button */}
                          <button
                            type="button"
                            onClick={() =>
                              downloadLosslessCertificate(
                                cert,
                                `Sertifikat_${cert.candidateName.replace(/\s+/g, '_')}_${cert.certificateNumber}.png`
                              )
                            }
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                            title="Yuqori sifatda (Lossless PNG) yuklab olish"
                          >
                            📥
                          </button>

                          {/* Revoke */}
                          {cert.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(cert)}
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                              title="Bekor qilish"
                            >
                              🚫
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(cert)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="O'chirish"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
              <span>
                Jami: <strong className="text-gray-900">{total}</strong> ta sertifikat
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition cursor-pointer"
                >
                  ◀ Oldingi
                </button>
                <span className="px-2 font-mono font-bold text-gray-800">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition cursor-pointer"
                >
                  Keyingi ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl text-lg">📜</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Sertifikat № {previewCert.certificateNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {previewCert.candidateName} • {previewCert.vacancyTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="p-3 sm:p-5 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
                <div className="w-full">
                  <CertificateCanvas
                    template={previewCert.templateSnapshot || previewCert.templateId}
                    candidateName={previewCert.candidateName}
                    vacancyTitle={previewCert.vacancyTitle}
                    certificateNumber={previewCert.certificateNumber}
                    issueDate={previewCert.issueDate}
                    qrUrl={previewCert.qrVerificationUrl}
                    mode="preview"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-500">QR-tekshiruv manzili: </span>
                  <a
                    href={previewCert.qrVerificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono font-bold"
                  >
                    {previewCert.qrVerificationUrl}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadLosslessCertificate(
                      previewCert,
                      `Sertifikat_${previewCert.candidateName.replace(/\s+/g, '_')}_${previewCert.certificateNumber}.png`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  📥 Yuqori sifatda yuklab olish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
