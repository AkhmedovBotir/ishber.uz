/**
 * Bitta suhbat — GET/PATCH, vaqt, natija, holat
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInterviewById, patchInterview } from '../../services/interviewService.js';
import { formatUzDateTime } from '../../utils/uzDateFormat.js';

const STATUS_UZ = {
  scheduled: { label: 'Rejalashtirilgan', className: 'bg-sky-100 text-sky-900' },
  completed: { label: 'Yakunlangan', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Bekor qilingan', className: 'bg-gray-200 text-gray-800' },
  no_show: { label: 'Kelmay qoldi', className: 'bg-red-100 text-red-800' },
};

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAddress(row) {
  if (!row) return '—';
  const parts = [];
  if (row.placeLabel) parts.push(row.placeLabel);
  if (row.addressText) parts.push(row.addressText);
  if (row.coordinates && typeof row.coordinates.lat === 'number') {
    parts.push(`${row.coordinates.lat}, ${row.coordinates.lng}`);
  }
  if (parts.length) return parts.join(' · ');
  return row.addressMode || '—';
}

const InterviewDetailModal = ({ interviewId, isOpen, onClose, onUpdated }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);

  const [scheduleLocal, setScheduleLocal] = useState('');
  const [rating, setRating] = useState('');
  const [passedSel, setPassedSel] = useState('');
  const [rescheduleRequested, setRescheduleRequested] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [markEvaluated, setMarkEvaluated] = useState(false);

  const load = useCallback(async () => {
    if (!interviewId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInterviewById(interviewId);
      setData(res);
      setScheduleLocal(toDatetimeLocalValue(res.scheduledAt));
      setRating(res.rating != null ? String(res.rating) : '');
      if (res.passed === true) setPassedSel('true');
      else if (res.passed === false) setPassedSel('false');
      else setPassedSel('');
      setRescheduleRequested(!!res.rescheduleRequested);
      setAdminNotes(typeof res.adminNotes === 'string' ? res.adminNotes : '');
      setMarkEvaluated(false);
    } catch (e) {
      setError(e?.message || 'Yuklashda xatolik');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [interviewId, isOpen]);

  useEffect(() => {
    if (isOpen && interviewId) load();
  }, [isOpen, interviewId, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const refresh = async () => {
    await load();
    onUpdated?.();
  };

  const statusKey = (data?.status || 'scheduled').toLowerCase();
  const statusUi = STATUS_UZ[statusKey] || {
    label: data?.status || '—',
    className: 'bg-gray-100 text-gray-700',
  };
  const isScheduled = statusKey === 'scheduled';

  const handleSaveSchedule = async () => {
    if (!data?._id || !scheduleLocal.trim()) return;
    setActing(true);
    setError(null);
    try {
      await patchInterview(data._id, {
        scheduledAt: new Date(scheduleLocal).toISOString(),
      });
      await refresh();
    } catch (e) {
      setError(e?.message || 'Vaqt saqlanmadi');
    } finally {
      setActing(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!data?._id) return;
    const body = {
      adminNotes: adminNotes.trim(),
      rescheduleRequested,
    };
    if (rating !== '' && rating !== '0') {
      const n = Number(rating);
      if (n >= 1 && n <= 5) body.rating = n;
    }
    if (passedSel === 'true' || passedSel === 'false') {
      body.passed = passedSel === 'true';
    }
    if (markEvaluated) body.markEvaluated = true;

    setActing(true);
    setError(null);
    try {
      await patchInterview(data._id, body);
      await refresh();
    } catch (e) {
      setError(e?.message || 'Natija saqlanmadi');
    } finally {
      setActing(false);
    }
  };

  const handleSetStatus = async (status) => {
    if (!data?._id) return;
    setActing(true);
    setError(null);
    try {
      await patchInterview(data._id, { status });
      await refresh();
    } catch (e) {
      setError(e?.message || 'Holat yangilanmadi');
    } finally {
      setActing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-detail-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id="interview-detail-title" className="text-lg font-semibold text-gray-900">
                  Suhbat
                </h2>
                {data && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusUi.className}`}>
                      {statusUi.label}
                    </span>
                    {data.reminderSmsSent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        Eslatma SMS yuborilgan
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Yopish"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
              {error && !loading && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loading && data && (
                <div className="space-y-6">
                  <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nomzod</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{data.candidateName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Telefon</p>
                      <p className="mt-1 font-mono text-sm text-gray-900">{data.candidatePhone || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Vakansiya</p>
                      <p className="mt-1 text-sm text-gray-900">{data.vacancyTitle || data.vacancyId || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mavzu</p>
                      <p className="mt-1 text-sm text-gray-900">{data.topic || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Suhbat oluvchi</p>
                      <p className="mt-1 text-sm text-gray-900">{data.interviewerName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reja vaqti</p>
                      <p className="mt-1 text-sm text-gray-900">{formatUzDateTime(data.scheduledAt)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Manzil</p>
                      <p className="mt-1 text-sm text-gray-800">{formatAddress(data)}</p>
                      <p className="mt-1 text-xs text-gray-500">Turi: {data.addressMode || '—'}</p>
                    </div>
                    {data.evaluatedAt && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Baholangan</p>
                        <p className="mt-1 text-sm text-gray-900">{formatUzDateTime(data.evaluatedAt)}</p>
                      </div>
                    )}
                  </div>

                  {isScheduled && (
                    <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                      <h3 className="text-sm font-semibold text-gray-900">Vaqt / qayta reja</h3>
                      <p className="mt-1 text-xs text-gray-600">
                        Yangilansa, eslatma SMS qayta yuborilishi uchun serverda belgi tiklanadi.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-xs text-gray-600">Yangi vaqt</label>
                          <input
                            type="datetime-local"
                            value={scheduleLocal}
                            onChange={(e) => setScheduleLocal(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={acting || !scheduleLocal.trim()}
                          onClick={handleSaveSchedule}
                          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Vaqt saqlash
                        </button>
                      </div>
                    </section>
                  )}

                  <section className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Natija va izoh</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Baholash (1–5)</label>
                        <select
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Tanlanmagan</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={String(n)}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">O‘tdi / o‘tmadi</label>
                        <select
                          value={passedSel}
                          onChange={(e) => setPassedSel(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Tanlanmagan</option>
                          <option value="true">O‘tdi</option>
                          <option value="false">O‘tmadi</option>
                        </select>
                      </div>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={rescheduleRequested}
                        onChange={(e) => setRescheduleRequested(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      Qayta suhbat so‘raldi
                    </label>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs text-gray-600">Admin izohi</label>
                      <textarea
                        rows={3}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Suhbat haqida qisqa yozuv..."
                      />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={markEvaluated}
                        onChange={(e) => setMarkEvaluated(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      Baholandi (evaluatedAt; kerak bo‘lsa holat completed)
                    </label>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={handleSaveEvaluation}
                      className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Natijani saqlash
                    </button>
                  </section>

                  <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Holat</h3>
                    <p className="mt-1 text-xs text-gray-600">
                      Bekor qilish yoki kelmay qoldi — PATCH orqali.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {statusKey !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => handleSetStatus('cancelled')}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          Bekor qilish
                        </button>
                      )}
                      {statusKey === 'scheduled' && (
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => handleSetStatus('no_show')}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-800 hover:bg-red-50 disabled:opacity-50"
                        >
                          Kelmay qoldi
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Yopish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterviewDetailModal;
