import React, { useState, useEffect, useCallback } from 'react';
import { listExamSubmissions, reviewExamSubmission } from '../../services/finalExamService.js';
import { formatUzDateTime } from '../../utils/uzDateFormat.js';
import { useModal } from '../../context/ModalContext.jsx';

export default function FinalExamSubmissionsList({ vacancyId }) {
  const { alert: showAlert, confirm: showConfirm } = useModal();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  // Reject with note modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (vacancyId) params.vacancyId = vacancyId;
      if (statusFilter) params.status = statusFilter;

      const data = await listExamSubmissions(params);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Topshiriqlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [vacancyId, statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleAccept = async (subId) => {
    const isConfirmed = await showConfirm({
      title: 'Yakuniy ishni qabul qilish',
      message: 'Ushbu nomzodning yakuniy nazorat ishini qabul qilib, muvaffaqiyatli tasdiqlaysizmi?',
      confirmText: 'Ha, qabul qilish',
      cancelText: 'Bekor qilish',
      type: 'primary',
    });

    if (!isConfirmed) return;

    try {
      setReviewing(true);
      await reviewExamSubmission(subId, 'accepted', 'Yakuniy nazorat ishi muvaffaqiyatli qabul qilindi.');
      setSelectedSubmission(null);
      await loadSubmissions();
      showAlert({
        title: 'Muvaffaqiyatli',
        message: 'Nomzodning yakuniy ishi qabul qilindi',
        type: 'success',
      });
    } catch (err) {
      showAlert({
        title: 'Xatolik',
        message: err?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    } finally {
      setReviewing(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectionNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionNote.trim()) {
      showAlert({
        title: 'Izoh talab qilinadi',
        message: 'Iltimos, bekor qilish sababini (izoh) yozing!',
        type: 'warning',
      });
      return;
    }
    if (!selectedSubmission) return;

    try {
      setReviewing(true);
      await reviewExamSubmission(selectedSubmission._id, 'rejected', rejectionNote.trim());
      setRejectModalOpen(false);
      setSelectedSubmission(null);
      await loadSubmissions();
      showAlert({
        title: 'Muvaffaqiyatli',
        message: 'Nomzodning yakuniy ishi bekor qilindi',
        type: 'info',
      });
    } catch (err) {
      showAlert({
        title: 'Xatolik',
        message: err?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    } finally {
      setReviewing(false);
    }
  };

  const STATUS_BADGES = {
    submitted: { label: 'Kutilmoqda', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    accepted: { label: 'Qabul qilingan', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    rejected: { label: 'Bekor qilingan', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Holat:</span>
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === '' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Barchasi ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'submitted' ? 'bg-white text-amber-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Kutilayotganlar
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'accepted' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Qabul qilinganlar
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'rejected' ? 'bg-white text-rose-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Bekor qilinganlar
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSubmissions}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          Yangilash
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-500 font-medium">Topshiriqlar yuklanmoqda...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && submissions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Topshirilgan yakuniy ishlar mavjud emas</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Nomzodlar darslarni yakunlab, imtihonni topshirganda ularning javoblari shu yerda paydo bo‘ladi.
          </p>
        </div>
      )}

      {/* Submissions Table */}
      {!loading && !error && submissions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Nomzod</th>
                  <th className="px-4 py-3.5">Vakansiya</th>
                  <th className="px-4 py-3.5">Telefon</th>
                  <th className="px-4 py-3.5">Avto-Ball</th>
                  <th className="px-4 py-3.5">Yozma javoblar</th>
                  <th className="px-4 py-3.5">Holat</th>
                  <th className="px-4 py-3.5">Sana</th>
                  <th className="px-4 py-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {submissions.map((sub) => {
                  const statusConfig = STATUS_BADGES[sub.status] || STATUS_BADGES.submitted;
                  return (
                    <tr key={sub._id} className="hover:bg-gray-50/80 transition">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {sub.candidateName || 'Nomzod'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {sub.vacancyTitle}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-600">
                        {sub.applicantPhone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-bold text-blue-600 text-xs px-2 py-0.5 rounded-md bg-blue-50">
                          {sub.autoScore}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {sub.textAnswersCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                            {sub.textAnswersCount} ta yozma javob
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-[11px]">
                        {sub.createdAt ? formatUzDateTime(sub.createdAt) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <span>Ko‘rib chiqish</span>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedSubmission.candidateName} — Yakuniy Nazorat Ishi
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGES[selectedSubmission.status]?.className}`}>
                    {STATUS_BADGES[selectedSubmission.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Telefon: <span className="font-mono text-gray-800">{selectedSubmission.applicantPhone}</span> | Vakansiya: <span className="font-semibold text-gray-800">{selectedSubmission.vacancyTitle}</span> | Avto-ball: <span className="font-bold text-blue-600">{selectedSubmission.autoScore}%</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Answers List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedSubmission.adminNote && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Admin Izohi: </span>
                  {selectedSubmission.adminNote}
                </div>
              )}

              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Nomzodning topshirgan javoblari
              </h4>

              {(selectedSubmission.answers || []).map((ans, aIdx) => (
                <div
                  key={aIdx}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-bold shrink-0">
                      {aIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {ans.questionText}
                      </p>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">
                        {ans.type === 'radio' ? 'Radio test' : ans.type === 'checkbox' ? 'Ko‘p tanlovli test' : 'Ochiq yozma savol'}
                      </span>
                    </div>

                    {ans.isCorrect === true && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                        To‘g‘ri ✓
                      </span>
                    )}
                    {ans.isCorrect === false && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                        Noto‘g‘ri ✗
                      </span>
                    )}
                  </div>

                  {/* Radio / Checkbox variantlar */}
                  {ans.type === 'radio' && (
                    <div className="pl-8 space-y-1">
                      {ans.options?.map((opt, optIdx) => {
                        const isChosen = ans.selectedOption === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                              isChosen
                                ? ans.isCorrect
                                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 font-medium border border-rose-300'
                                : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            <span>{isChosen ? '🔘' : '⚪'}</span>
                            <span>{opt}</span>
                            {isChosen && <span className="text-[10px] font-bold ml-auto">(Nomzod javobi)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {ans.type === 'checkbox' && (
                    <div className="pl-8 space-y-1">
                      {ans.options?.map((opt, optIdx) => {
                        const isChosen = Array.isArray(ans.selectedOptions) && ans.selectedOptions.includes(optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                              isChosen
                                ? 'bg-indigo-100 text-indigo-900 font-semibold border border-indigo-300'
                                : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                          >
                            <span>{isChosen ? '☑️' : '◻️'}</span>
                            <span>{opt}</span>
                            {isChosen && <span className="text-[10px] font-bold ml-auto">(Belgilangan)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Open-Ended Answer */}
                  {ans.type === 'text' && (
                    <div className="pl-8 pt-1">
                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
                        <span className="font-bold block text-purple-900 mb-1">✍️ Nomzodning yozma javobi:</span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {ans.textValue || <span className="italic text-gray-400">Javob yozilmagan</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer: Action buttons */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Yopish
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={handleOpenRejectModal}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  Bekor qilish (Rad etish)
                </button>

                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleAccept(selectedSubmission._id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  Qabul qilish (Tasdiqlash)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION NOTE MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Yakuniy nazorat ishini bekor qilish
            </h3>
            <p className="text-xs text-gray-500">
              Nomzodga nega rad etilganligini tushuntiruvchi sabab yoki izoh (note) yozing. Ushbu izoh nomzodning portalida ko‘rinadi.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bekor qilish sababi (majburiy)
              </label>
              <textarea
                rows={4}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Masalan: 3-savoldagi yozma javob yetarlicha to‘liq emas, darslarni qayta o‘rganib topshiring..."
                autoFocus
                className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Orqaga
              </button>
              <button
                type="button"
                disabled={!rejectionNote.trim() || reviewing}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {reviewing ? 'Saqlanmoqda...' : 'Bekor qilishni tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
