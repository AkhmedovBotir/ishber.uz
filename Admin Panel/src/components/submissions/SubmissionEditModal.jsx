/**
 * Ariza tahrirlash — telefon va forma javoblari (PATCH /application-submissions/:id)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSubmissionById,
  patchSubmission,
} from '../../services/applicationSubmissionService.js';
import {
  loadApplicationFormForSubmission,
  getFormDisplayName,
} from '../../utils/submissionFormResolve.js';
import {
  buildEditValueMap,
  buildPatchAnswersPayload,
  validateSubmissionAnswers,
  normalizePhoneInput,
  normalizeId,
} from '../../utils/submissionAnswers.js';
import SubmissionAnswerField from './SubmissionAnswerField.jsx';

/**
 * @param {{
 *   submissionId: string | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSaved?: () => void,
 *   fallbackVacancyId?: string | null,
 * }} props
 */
const SubmissionEditModal = ({
  submissionId,
  isOpen,
  onClose,
  onSaved,
  fallbackVacancyId = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [displayNum, setDisplayNum] = useState('—');
  const [vacancyTitle, setVacancyTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [phone, setPhone] = useState('');
  const [questions, setQuestions] = useState([]);
  const [valueMap, setValueMap] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const initialPhoneRef = useRef('');
  const initialAnswersRef = useRef({});

  const reset = () => {
    setLoadError(null);
    setSaveError(null);
    setFieldErrors({});
    setPhone('');
    setQuestions([]);
    setValueMap({});
    initialPhoneRef.current = '';
    initialAnswersRef.current = {};
  };

  const load = useCallback(async () => {
    if (!submissionId || !isOpen) return;
    setLoading(true);
    setLoadError(null);
    reset();
    try {
      const res = await getSubmissionById(submissionId);
      const form = await loadApplicationFormForSubmission(res, { fallbackVacancyId });
      const { map, sorted } = buildEditValueMap(res, form);

      const ph = normalizePhoneInput(res?.applicantPhone || '');
      setDisplayNum(res?.displayNumber ?? res?.submissionNumber ?? res?._id?.slice(-8) ?? '—');
      setVacancyTitle(res?.vacancyTitle || '—');
      setFormName(getFormDisplayName(form, res));
      setPhone(ph);
      setQuestions(sorted);
      setValueMap(map);
      initialPhoneRef.current = ph;
      initialAnswersRef.current = JSON.parse(JSON.stringify(map));
    } catch (e) {
      setLoadError(e?.message || 'Yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [submissionId, isOpen, fallbackVacancyId]);

  useEffect(() => {
    if (isOpen && submissionId) load();
  }, [isOpen, submissionId, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, saving]);

  const answersChanged = useMemo(() => {
    try {
      return JSON.stringify(valueMap) !== JSON.stringify(initialAnswersRef.current);
    } catch {
      return true;
    }
  }, [valueMap]);

  const phoneChanged = phone.trim() !== initialPhoneRef.current;

  const setAnswer = (questionId, value) => {
    const key = normalizeId(questionId) || String(questionId);
    setValueMap((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionId || saving) return;

    if (!phoneChanged && !answersChanged) {
      setSaveError('O‘zgarish kiritilmadi');
      return;
    }

    const body = {};

    if (phoneChanged) {
      const ph = normalizePhoneInput(phone);
      if (!ph) {
        setSaveError('Telefon raqamini kiriting yoki o‘zgartirmang');
        return;
      }
      body.applicantPhone = ph;
    }

    if (answersChanged) {
      const validation = validateSubmissionAnswers(questions, valueMap);
      if (Object.keys(validation).length > 0) {
        setFieldErrors(validation);
        setSaveError('Majburiy savollarni to‘ldiring');
        return;
      }
      body.answers = buildPatchAnswersPayload(questions, valueMap);
    }

    setSaving(true);
    setSaveError(null);
    try {
      await patchSubmission(submissionId, body);
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'Saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={saving ? undefined : onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-edit-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(ev) => ev.stopPropagation()}
            className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/90 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id="submission-edit-title" className="text-lg font-semibold text-gray-900">
                  Ariza №{displayNum} — tahrirlash
                </h2>
                <p className="mt-1 truncate text-sm text-gray-600">{vacancyTitle}</p>
                {formName && <p className="mt-0.5 text-sm font-medium text-gray-800">{formName}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="shrink-0 rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Yopish"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-1 justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : loadError ? (
              <div className="flex-1 px-4 py-8 sm:px-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {loadError}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
                  {saveError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {saveError}
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-gray-500">
                    Telefon yoki forma javoblarini yangilang. Javoblar o‘zgartirilsa, barcha savollar to‘liq
                    yuboriladi (qisman emas).
                  </p>

                  <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                    <label htmlFor="edit-applicant-phone" className="block text-sm font-medium text-gray-900">
                      Telefon (SMS)
                    </label>
                    <input
                      id="edit-applicant-phone"
                      type="tel"
                      value={phone}
                      onChange={(ev) => {
                        setPhone(ev.target.value);
                        setSaveError(null);
                      }}
                      placeholder="+998901112233"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </section>

                  {questions.length > 0 ? (
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">Forma javoblari</h3>
                      {questions.map((q) => {
                        const qid = normalizeId(q._id) || String(q._id);
                        return (
                          <SubmissionAnswerField
                            key={qid}
                            question={q}
                            value={valueMap[qid]}
                            onChange={(v) => setAnswer(q._id, v)}
                            error={fieldErrors[qid]}
                          />
                        );
                      })}
                    </section>
                  ) : (
                    <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      So‘rovnoma topilmadi — faqat telefonni yangilash mumkin.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:px-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionEditModal;
