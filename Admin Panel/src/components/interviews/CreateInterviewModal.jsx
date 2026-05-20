/**
 * Yangi nomzod suhbati — POST /api/interviews
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createInterview } from '../../services/interviewService.js';
import { getSubmissionsByVacancy } from '../../services/applicationSubmissionService.js';
import { getApplicationFormByVacancyId } from '../../services/applicationFormService.js';
import { extractNameFromSubmission } from '../../utils/nameFromSubmission.js';
import CustomSelect from '../common/CustomSelect.jsx';
import PlacePickerMap from './PlacePickerMap.jsx';

const ADDRESS_MODES = [
  { value: 'text', label: 'Matn (manzil)' },
  { value: 'url', label: 'Havola (URL)' },
  { value: 'place', label: 'Joy (nom / xarita)' },
];

/** Ariza obyektidan nomzod ismi: API maydonlari + forma savollaridan "ism" javobi */
function submissionCandidateName(s, formQuestions = []) {
  if (!s || typeof s !== 'object') return '';
  const pick = (v) => (typeof v === 'string' ? v.trim() : '');
  return (
    pick(s.applicantName) ||
    pick(s.applicantFullName) ||
    pick(s.candidateName) ||
    pick(s.fullName) ||
    pick(s.name) ||
    pick(s.contactName) ||
    pick(s.displayName) ||
    pick(s.applicant?.name) ||
    pick(s.applicant?.fullName) ||
    extractNameFromSubmission(s, formQuestions) ||
    ''
  );
}

const emptyForm = () => ({
  candidateName: '',
  candidatePhone: '',
  vacancyId: '',
  applicationSubmissionId: '',
  topic: '',
  interviewerName: '',
  addressMode: 'text',
  addressText: '',
  placeLabel: '',
  coordLat: '',
  coordLng: '',
  scheduledAtLocal: '',
});

function buildPayload(state) {
  const {
    candidateName,
    candidatePhone,
    vacancyId,
    applicationSubmissionId,
    topic,
    interviewerName,
    addressMode,
    addressText,
    placeLabel,
    coordLat,
    coordLng,
    scheduledAtLocal,
  } = state;

  const scheduledAt =
    scheduledAtLocal.trim() === ''
      ? ''
      : new Date(scheduledAtLocal).toISOString();

  const payload = {
    candidateName: candidateName.trim(),
    candidatePhone: candidatePhone.trim(),
    vacancyId,
    topic: topic.trim(),
    interviewerName: interviewerName.trim(),
    addressMode,
    scheduledAt,
  };

  if (applicationSubmissionId) {
    payload.applicationSubmissionId = applicationSubmissionId;
  }

  if (addressMode === 'text' || addressMode === 'url') {
    payload.addressText = addressText.trim();
  } else {
    const pl = placeLabel.trim();
    const at = addressText.trim();
    if (pl) payload.placeLabel = pl;
    if (at) payload.addressText = at;
    const lat = coordLat.trim() === '' ? NaN : Number(coordLat);
    const lng = coordLng.trim() === '' ? NaN : Number(coordLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      payload.coordinates = { lat, lng };
    }
  }

  return payload;
}

function validate(state) {
  if (!state.candidateName.trim()) return 'Nomzod ismini kiriting';
  if (!state.candidatePhone.trim()) return 'Telefon raqamini kiriting';
  if (!state.vacancyId) return 'Vakansiyani tanlang';
  if (!state.topic.trim()) return 'Mavzuni kiriting';
  if (!state.interviewerName.trim()) return 'Suhbat oluvchi ismini kiriting';
  if (!state.scheduledAtLocal.trim()) return 'Sana va vaqtni tanlang';

  if (state.addressMode === 'text' || state.addressMode === 'url') {
    if (!state.addressText.trim()) {
      return state.addressMode === 'url' ? 'Havolani kiriting' : 'Manzil matnini kiriting';
    }
  } else {
    if (!state.placeLabel.trim() && !state.addressText.trim()) {
      return 'Joy nomi yoki manzil matnidan kamida bittasini kiriting';
    }
  }

  const d = new Date(state.scheduledAtLocal);
  if (Number.isNaN(d.getTime())) return 'Sana-vaqt noto‘g‘ri';
  return null;
}

const CreateInterviewModal = ({ isOpen, onClose, vacancies, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [submissions, setSubmissions] = useState([]);
  const [applicationQuestions, setApplicationQuestions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const vacancyOptions = useMemo(
    () =>
      vacancies.map((v) => ({
        value: v._id,
        label: v.title || v._id,
        group: 'Vakansiyalar',
      })),
    [vacancies]
  );

  const submissionOptions = useMemo(
    () =>
      submissions.map((s) => {
        const num = s.displayNumber ?? s.submissionNumber ?? s._id?.slice(-6);
        const phone = s.applicantPhone || '—';
        const nm = submissionCandidateName(s, applicationQuestions);
        const label = nm ? `${num} — ${nm} — ${phone}` : `${num} — ${phone}`;
        return { value: s._id, label, group: 'Arizalar' };
      }),
    [submissions, applicationQuestions]
  );

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyForm());
    setSubmissions([]);
    setApplicationQuestions([]);
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !form.vacancyId) {
      setSubmissions([]);
      setApplicationQuestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSubLoading(true);
      try {
        const [data, formRes] = await Promise.all([
          getSubmissionsByVacancy(form.vacancyId),
          getApplicationFormByVacancyId(form.vacancyId).catch(() => null),
        ]);
        if (!cancelled) {
          setSubmissions(Array.isArray(data) ? data : []);
          setApplicationQuestions(Array.isArray(formRes?.questions) ? formRes.questions : []);
        }
      } catch {
        if (!cancelled) {
          setSubmissions([]);
          setApplicationQuestions([]);
        }
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, form.vacancyId]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePlaceMapChange = useCallback(({ lat, lng, label }) => {
    setForm((prev) => {
      const next = {
        ...prev,
        coordLat: Number(lat.toFixed(7)).toString(),
        coordLng: Number(lng.toFixed(7)).toString(),
      };
      if (label && !prev.placeLabel.trim()) {
        const line = label.split(',')[0]?.trim() || label;
        next.placeLabel = line.length > 100 ? `${line.slice(0, 97)}…` : line;
      }
      return next;
    });
    setError(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(form);
      await createInterview(payload);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Saqlanmadi');
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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-interview-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            <div className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-6">
              <h2 id="create-interview-title" className="text-lg font-semibold text-gray-900">
                Yangi suhbat
              </h2>
              <p className="mt-1 text-xs text-gray-500">POST /api/interviews — nomzod va vaqt rejalashtirish</p>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Vakansiya *</label>
                  <CustomSelect
                    value={form.vacancyId}
                    onChange={(id) => {
                      setForm((prev) => ({
                        ...prev,
                        vacancyId: id,
                        applicationSubmissionId: '',
                      }));
                      setError(null);
                    }}
                    options={vacancyOptions}
                    placeholder="Tanlang"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Ariza (ixtiyoriy)</label>
                  <CustomSelect
                    value={form.applicationSubmissionId}
                    onChange={(id) => {
                      setForm((prev) => {
                        const next = { ...prev, applicationSubmissionId: id };
                        if (!id) return next;
                        const sub = submissions.find((x) => x._id === id);
                        if (sub) {
                          const nm = submissionCandidateName(sub, applicationQuestions);
                          if (nm) next.candidateName = nm;
                          if (sub.applicantPhone) next.candidatePhone = String(sub.applicantPhone).trim();
                        }
                        return next;
                      });
                      setError(null);
                    }}
                    options={submissionOptions}
                    placeholder={subLoading ? 'Arizalar yuklanmoqda...' : 'Ariza bog‘lamasangiz ham bo‘ladi'}
                    disabled={!form.vacancyId || subLoading}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nomzod ismi *</label>
                    <input
                      type="text"
                      value={form.candidateName}
                      onChange={(e) => setField('candidateName', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      placeholder="Masalan: Ali Valiyev"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Telefon *</label>
                    <input
                      type="text"
                      value={form.candidatePhone}
                      onChange={(e) => setField('candidatePhone', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      placeholder="+998901112233"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mavzu *</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setField('topic', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    placeholder="Masalan: Texnik suhbat"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Suhbat oluvchi *</label>
                  <input
                    type="text"
                    value={form.interviewerName}
                    onChange={(e) => setField('interviewerName', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Manzil turi *</label>
                  <CustomSelect
                    value={form.addressMode}
                    onChange={(v) => setField('addressMode', v)}
                    options={ADDRESS_MODES}
                    placeholder="Tanlang"
                  />
                </div>

                {(form.addressMode === 'text' || form.addressMode === 'url') && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {form.addressMode === 'url' ? 'Havola *' : 'Manzil matni *'}
                    </label>
                    <textarea
                      rows={form.addressMode === 'url' ? 2 : 3}
                      value={form.addressText}
                      onChange={(e) => setField('addressText', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      placeholder={form.addressMode === 'url' ? 'https://maps.google.com/...' : 'Ofis manzili...'}
                    />
                  </div>
                )}

                {form.addressMode === 'place' && (
                  <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                    <p className="text-xs text-gray-600">Joy nomi yoki matndan kamida bittasi majburiy.</p>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Joy nomi</label>
                      <input
                        type="text"
                        value={form.placeLabel}
                        onChange={(e) => setField('placeLabel', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Masalan: Ishber ofisi"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Qo‘shimcha matn</label>
                      <input
                        type="text"
                        value={form.addressText}
                        onChange={(e) => setField('addressText', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Xarita va qidiruv</label>
                      <PlacePickerMap latStr={form.coordLat} lngStr={form.coordLng} onChange={handlePlaceMapChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Kenglik (ixtiyoriy)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={form.coordLat}
                          onChange={(e) => setField('coordLat', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
                          placeholder="41.3111"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Uzunlik (ixtiyoriy)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={form.coordLng}
                          onChange={(e) => setField('coordLng', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
                          placeholder="69.2797"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Sana va vaqt *</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAtLocal}
                    onChange={(e) => setField('scheduledAtLocal', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">Brauzer vaqtingiz bo‘yicha; serverga ISO 8601 yuboriladi.</p>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Rejalashtirish'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateInterviewModal;
