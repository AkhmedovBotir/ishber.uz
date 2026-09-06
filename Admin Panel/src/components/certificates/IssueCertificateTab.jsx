import React, { useState, useEffect } from 'react';
import { getEligibleCandidates, issueCertificate } from '../../services/certificateService';
import { CertificateCanvas, downloadLosslessCertificate } from './CertificateCanvas';
import { useModal } from '../../context/ModalContext';

export const IssueCertificateTab = ({ templates = [], onCertificateIssued = () => {} }) => {
  const { alert: showAlert } = useModal();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'issued' | 'not_issued'

  // Modal state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customIssueDate, setCustomIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuing, setIssuing] = useState(false);
  const [issuedResult, setIssuedResult] = useState(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await getEligibleCandidates();
      if (res.success) {
        setCandidates(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Filter default template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const def = templates.find((t) => t.isDefault) || templates[0];
      if (def) setSelectedTemplateId(def._id);
    }
  }, [templates, selectedTemplateId]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      c.candidatePhone.includes(search) ||
      (c.vacancyTitle && c.vacancyTitle.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'issued') return c.isIssued;
    if (filterStatus === 'not_issued') return !c.isIssued;
    return true;
  });

  const handleOpenIssueModal = (candidate) => {
    setSelectedCandidate(candidate);
    setIssuedResult(null);
    setCustomIssueDate(new Date().toISOString().split('T')[0]);
    const def = templates.find((t) => t.isDefault) || templates[0];
    if (def) setSelectedTemplateId(def._id);
  };

  const handleIssue = async () => {
    if (!selectedCandidate) return;
    if (!selectedTemplateId) {
      showAlert('Iltimos, sertifikat shablonini tanlang!', { title: 'Xatolik' });
      return;
    }

    try {
      setIssuing(true);
      const payload = {
        templateId: selectedTemplateId,
        candidateName: selectedCandidate.candidateName,
        candidatePhone: selectedCandidate.candidatePhone,
        vacancyId: selectedCandidate.vacancyId,
        vacancyTitle: selectedCandidate.vacancyTitle,
        finalExamSubmissionId: selectedCandidate.submissionId,
        issueDate: customIssueDate
      };

      const res = await issueCertificate(payload);
      if (res.success) {
        setIssuedResult(res.data);
        fetchCandidates();
        onCertificateIssued();
        showAlert(
          `${selectedCandidate.candidateName} nomzodiga sertifikat muvaffaqiyatli taqdim etildi!`,
          { title: 'Muvaffaqiyatli!' }
        );
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Sertifikat berishda xatolik yuz berdi', { title: 'Xatolik' });
    } finally {
      setIssuing(false);
    }
  };

  const currentTemplate = templates.find((t) => t._id === selectedTemplateId) || templates[0];

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Nomzod ismi, telefon raqami yoki vakansiya bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Holat:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">Barchasi ({candidates.length})</option>
            <option value="not_issued">
              Sertifikat berilmagan ({candidates.filter((c) => !c.isIssued).length})
            </option>
            <option value="issued">
              Sertifikat berilgan ({candidates.filter((c) => c.isIssued).length})
            </option>
          </select>

          <button
            type="button"
            onClick={fetchCandidates}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-600 transition cursor-pointer shadow-xs"
            title="Yangilash"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-sm font-medium text-gray-600">Qabul qilingan nomzodlar yuklanmoqda...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <div className="text-4xl">🎓</div>
            <p className="text-base font-bold text-gray-900">Hech qanday nomzod topilmadi</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Yakuniy nazorat ishini topshirib qabul qilingan (`accepted`) nomzodlar shu yerda paydo bo'ladi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4">Nomzod Ism-Familiyasi</th>
                  <th className="px-5 py-4">Telefon</th>
                  <th className="px-5 py-4">Vakansiya</th>
                  <th className="px-5 py-4">Yakuniy Ball</th>
                  <th className="px-5 py-4">Qabul qilingan sana</th>
                  <th className="px-5 py-4">Sertifikat holati</th>
                  <th className="px-5 py-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((c) => (
                  <tr key={c.submissionId} className="hover:bg-gray-50/70 transition">
                    <td className="px-5 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {c.candidateName.charAt(0).toUpperCase()}
                        </div>
                        {c.candidateName}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-700">{c.candidatePhone}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {c.vacancyTitle}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-emerald-600">{c.score} ball</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(c.acceptedAt).toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {c.isIssued ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span>✓</span> Berilgan ({c.certificateNumber})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <span>⏳</span> Berilmagan
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenIssueModal(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs ${
                          c.isIssued
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                        }`}
                      >
                        {c.isIssued ? '👁️ Ko\'rish / Yangilash' : '🎓 Sertifikat berish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issuing & Live Preview Modal (Clean Light Theme) */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-5xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl text-lg">🎓</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Nomzodga sertifikat taqdim etish
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCandidate.candidateName} • {selectedCandidate.vacancyTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Top controls: Select Template & Issue Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Sertifikat shablonini tanlang:
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.isDefault ? '(Asosiy shablon)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Berilgan sana:
                  </label>
                  <input
                    type="date"
                    value={customIssueDate}
                    onChange={(e) => setCustomIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live Certificate Preview with Auto-fitted text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold">Jonli ko'rinish (Real vaqtdagi moslashuv)</span>
                  <span className="font-mono font-bold text-blue-600">
                    Sertifikat raqami: {issuedResult?.certificateNumber || selectedCandidate.certificateNumber || 'ISH-2026-XXXXX'}
                  </span>
                </div>
                <div className="p-3 sm:p-5 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
                  <div className="w-full max-w-3xl">
                    <CertificateCanvas
                      template={currentTemplate}
                      candidateName={selectedCandidate.candidateName}
                      vacancyTitle={selectedCandidate.vacancyTitle}
                      certificateNumber={issuedResult?.certificateNumber || selectedCandidate.certificateNumber || 'ISH-2026-PREV1'}
                      issueDate={customIssueDate}
                      qrUrl={
                        issuedResult?.qrVerificationUrl ||
                        `https://ishber.uz/verify/${selectedCandidate.certificateNumber || 'ISH-2026-PREV1'}`
                      }
                      mode="preview"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
              <div>
                {(issuedResult || selectedCandidate.isIssued) && (
                  <button
                    type="button"
                    onClick={() =>
                      downloadLosslessCertificate(
                        issuedResult || {
                          templateId: currentTemplate,
                          candidateName: selectedCandidate.candidateName,
                          vacancyTitle: selectedCandidate.vacancyTitle,
                          certificateNumber: selectedCandidate.certificateNumber,
                          issueDate: customIssueDate,
                          qrVerificationUrl: `https://ishber.uz/verify/${selectedCandidate.certificateNumber}`
                        },
                        `Sertifikat_${selectedCandidate.candidateName.replace(/\s+/g, '_')}.png`
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    📥 Yuqori sifatda (Lossless PNG) yuklab olish
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  disabled={issuing}
                  onClick={handleIssue}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {issuing ? 'Berilmoqda...' : '🎓 Sertifikatni rasmiylashtirish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
