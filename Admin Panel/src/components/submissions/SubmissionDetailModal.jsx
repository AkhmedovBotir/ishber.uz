/**
 * Bitta ariza — tafsilot, javoblar, aloqa jurnali, holat amallari
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSubmissionById,
  patchSubmissionStatus,
  patchSubmissionContact,
  postSubmissionContactNote,
} from '../../services/applicationSubmissionService.js';
import { formatUzDateTime } from '../../utils/uzDateFormat.js';
import {
  loadApplicationFormForSubmission,
  getFormDisplayName,
} from '../../utils/submissionFormResolve.js';
import { buildAnswerDisplayRows } from '../../utils/submissionAnswers.js';
import AnswerValueDisplay from './AnswerValueDisplay.jsx';

const STATUS_UZ = {
  pending: { label: "Kutilmoqda", className: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Qabul qilingan', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rad etilgan', className: 'bg-red-100 text-red-800' },
};

/**
 * @param {{
 *   submissionId: string | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onUpdated?: () => void,
 *   initialFocus?: 'answers' | 'log' | 'status' | 'reject' | 'contact' | 'note' | null,
 *   fallbackVacancyId?: string | null,
 *   onEdit?: (submissionId: string) => void,
 * }} props
 */
const SubmissionDetailModal = ({
  submissionId,
  isOpen,
  onClose,
  onUpdated,
  initialFocus = null,
  fallbackVacancyId = null,
  onEdit,
}) => {
  const [data, setData] = useState(null);
  const [applicationForm, setApplicationForm] = useState(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sendSmsAccept, setSendSmsAccept] = useState(true);
  const [sendSmsReject, setSendSmsReject] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [acting, setActing] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [noteOutcome, setNoteOutcome] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const scrollLockRef = useRef(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    if (!submissionId || !isOpen) return;
    setLoading(true);
    setLoadError(null);
    setApplicationForm(null);
    setFormDisplayName('');
    try {
      const res = await getSubmissionById(submissionId);
      let form = null;
      let formNom = '';
      try {
        form = await loadApplicationFormForSubmission(res, { fallbackVacancyId });
        if (form) formNom = getFormDisplayName(form, res);
      } catch {
        /* forma topilmasa ham ariza ko‘rsatiladi */
      }
      setApplicationForm(form);
      setFormDisplayName(formNom);
      setData(res);
    } catch (e) {
      setLoadError(e?.message || 'Yuklashda xatolik');
      setData(null);
      setApplicationForm(null);
      setFormDisplayName('');
    } finally {
      setLoading(false);
    }
  }, [submissionId, isOpen, fallbackVacancyId]);

  useEffect(() => {
    if (isOpen && submissionId) {
      setSendSmsAccept(true);
      setSendSmsReject(true);
      setRejectionReason('');
      setActionError(null);
      setNoteText('');
      setNoteOutcome('');
      load();
    }
  }, [isOpen, submissionId, load]);

  useEffect(() => {
    scrollLockRef.current = false;
  }, [isOpen, submissionId, initialFocus]);

  useEffect(() => {
    if (!isOpen || loading || !data || !initialFocus || scrollLockRef.current) return;
    const idMap = {
      answers: 'submission-section-answers',
      log: 'submission-section-log',
      status: 'submission-section-status',
      reject: 'submission-section-reject',
      contact: 'submission-section-contact',
      note: 'submission-section-note',
    };
    const domId = idMap[initialFocus];
    if (!domId) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(domId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrollLockRef.current = true;
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [isOpen, loading, data, initialFocus]);

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

  const displayNum = data?.displayNumber ?? data?.submissionNumber ?? data?._id?.slice(-8) ?? '—';
  const statusKey = (data?.status || 'pending').toLowerCase();
  const statusUi = STATUS_UZ[statusKey] || {
    label: data?.status || '—',
    className: 'bg-gray-100 text-gray-700',
  };
  const isPending = statusKey === 'pending';

  const handleAccept = async () => {
    if (!data?._id) return;
    setActionError(null);
    setActing(true);
    try {
      await patchSubmissionStatus(data._id, { status: 'accepted', sendSms: sendSmsAccept });
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Xatolik');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!data?._id) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setActionError("Bekor qilish sababini kiriting");
      return;
    }
    setActionError(null);
    setActing(true);
    try {
      await patchSubmissionStatus(data._id, {
        status: 'rejected',
        rejectionReason: reason,
        sendSms: sendSmsReject,
      });
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Xatolik');
    } finally {
      setActing(false);
    }
  };

  const handleContacted = async () => {
    if (!data?._id) return;
    setActionError(null);
    setActing(true);
    try {
      await patchSubmissionContact(data._id);
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Xatolik');
    } finally {
      setActing(false);
    }
  };

  const handleAddNote = async () => {
    if (!data?._id) return;
    const text = noteText.trim();
    if (!text) {
      setActionError('Aloqa yozuvi matnini kiriting');
      return;
    }
    setActionError(null);
    setNoteSaving(true);
    try {
      await postSubmissionContactNote(data._id, {
        text,
        outcome: noteOutcome.trim() || undefined,
      });
      setNoteText('');
      setNoteOutcome('');
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Yozuv saqlanmadi');
    } finally {
      setNoteSaving(false);
    }
  };

  const answersRows = buildAnswerDisplayRows(data?.answers, applicationForm);
  const log = Array.isArray(data?.contactLog) ? data.contactLog : [];

  const scrollTo = (section) => {
    const idMap = {
      answers: 'submission-section-answers',
      log: 'submission-section-log',
      status: 'submission-section-status',
      reject: 'submission-section-reject',
      contact: 'submission-section-contact',
      note: 'submission-section-note',
    };
    const el = document.getElementById(idMap[section]);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:items-center sm:p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-gray-200/80 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/90 px-4 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="submission-modal-title" className="text-lg font-semibold text-gray-900">
                    Ariza №{displayNum}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusUi.className}`}>
                    {statusUi.label}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-600">{data?.vacancyTitle || '—'}</p>
                {formDisplayName && (
                  <p className="mt-1 text-sm font-medium text-gray-800">{formDisplayName}</p>
                )}
                {data?._id && (
                  <p className="mt-1 font-mono text-[10px] text-gray-400 break-all sm:text-xs" title={data._id}>
                    Ariza ID: {data._id}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="Yopish"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!loading && data && (
              <div className="flex shrink-0 flex-wrap gap-1 border-b border-gray-100 bg-gray-50/90 px-3 py-2 sm:px-5">
                <button
                  type="button"
                  onClick={() => scrollTo('answers')}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  Javoblar
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo('log')}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  Aloqa jurnali
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo('note')}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  Yangi yozuv
                </button>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => scrollTo('status')}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-white hover:shadow-sm"
                  >
                    Holat
                  </button>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {loading && (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
              {loadError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {loadError}
                </div>
              )}
              {actionError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              {!loading && data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Telefon</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {data.applicantPhone || "— (SMS uchun telefon yo'q)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Aloqaga chiqilgan
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {data.contactedAt ? formatUzDateTime(data.contactedAt) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Yuborilgan</p>
                      <p className="mt-1 text-sm text-gray-900">{formatUzDateTime(data.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Yangilangan</p>
                      <p className="mt-1 text-sm text-gray-900">{formatUzDateTime(data.updatedAt)}</p>
                    </div>
                  </div>

                  <section id="submission-section-answers" className="scroll-mt-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Forma javoblari</h4>
                    {answersRows.length > 0 ? (
                      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {answersRows.map((row) => (
                          <div key={row.key} className="px-4 py-4 sm:px-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{row.label}</p>
                            <div className="mt-2 min-w-0">
                              <AnswerValueDisplay raw={row.raw} questionType={row.questionType} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        {"Javoblar yo'q"}
                      </p>
                    )}
                  </section>

                  <section id="submission-section-log" className="scroll-mt-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900">Aloqa jurnali</h4>
                    {log.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        Yozuvlar yo'q
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {log.map((entry) => (
                          <li
                            key={entry._id || `${entry.createdAt}-${entry.text}`}
                            className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm"
                          >
                            <p className="text-xs text-gray-500">{formatUzDateTime(entry.createdAt)}</p>
                            {entry.outcome && (
                              <p className="mt-1 text-xs font-semibold text-blue-700">{entry.outcome}</p>
                            )}
                            <p className="mt-1 text-gray-800">{entry.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div id="submission-section-note" className="mt-4 space-y-2 scroll-mt-4 rounded-xl border border-gray-200 bg-gray-50/90 p-4">
                      <label className="block text-xs font-medium text-gray-600">Yangi yozuv</label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={2}
                        placeholder="Masalan: Qo'ng'iroq qildim..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <input
                        type="text"
                        value={noteOutcome}
                        onChange={(e) => setNoteOutcome(e.target.value)}
                        placeholder="Natija (ixtiyoriy), masalan: 2-bosqichga qoldi"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={noteSaving || acting}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {noteSaving ? 'Saqlanmoqda...' : "Yozuvni qo'shish"}
                      </button>
                    </div>
                  </section>

                  {isPending && (
                    <section
                      id="submission-section-status"
                      className="scroll-mt-4 space-y-4 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-4 sm:p-5"
                    >
                      <p className="text-sm font-semibold text-gray-900">Holatni yangilash</p>
                      <p className="text-xs leading-relaxed text-gray-600">
                        Faqat <strong>kutilmoqda</strong> holatdan qabul yoki rad qilish mumkin. SMS yuborishni
                        o'chirib, faqat holatni yangilash mumkin.
                      </p>

                      <div className="flex flex-wrap items-end gap-4 border-t border-blue-100/80 pt-4">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={sendSmsAccept}
                            onChange={(e) => setSendSmsAccept(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          Qabul qilishda SMS
                        </label>
                        <button
                          type="button"
                          onClick={handleAccept}
                          disabled={acting}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Qabul qilish
                        </button>
                      </div>

                      <div className="space-y-2 border-t border-blue-100/80 pt-4" id="submission-section-reject">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={sendSmsReject}
                            onChange={(e) => setSendSmsReject(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          Rad etishda SMS
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={2}
                          placeholder="Bekor qilish sababi (majburiy)..."
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={acting}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Rad etish
                        </button>
                      </div>

                      <div className="border-t border-blue-100/80 pt-4" id="submission-section-contact">
                        <button
                          type="button"
                          onClick={handleContacted}
                          disabled={acting}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          Aloqaga chiqildi (SMS yuborilmaydi)
                        </button>
                      </div>
                    </section>
                  )}

                  {!isPending && (
                    <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      {"Bu ariza allaqachon yakunlangan. Holatni o'zgartirib bo'lmaydi."}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              {onEdit && data?._id && (
                <button
                  type="button"
                  onClick={() => onEdit(data._id)}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-800 shadow-sm hover:bg-blue-100 sm:w-auto"
                >
                  Tahrirlash
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 sm:w-auto"
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

export default SubmissionDetailModal;
