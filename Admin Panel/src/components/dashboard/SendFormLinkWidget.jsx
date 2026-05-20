/**
 * SendFormLinkWidget — Dashboard widget for sending application form
 * link to a candidate's phone via SMS.
 *
 * Flow:
 *   1) Phone number input
 *   2) Choose vacancy (only those with active forms)
 *   3) Success screen with form URL + SMS info
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAllVacancies } from '../../services/vacancyService.js';
import {
  getAllApplicationForms,
  sendApplicationFormSmsLink,
} from '../../services/applicationFormService.js';

const PHONE_RE = /^\+998\d{9}$/;

const StepBadge = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2 min-w-0">
    <div
      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
        done
          ? 'bg-green-500 text-white'
          : active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-500'
      }`}
    >
      {done ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        n
      )}
    </div>
    <span
      className={`text-xs font-medium truncate ${
        active || done ? 'text-gray-900' : 'text-gray-500'
      }`}
    >
      {label}
    </span>
  </div>
);

const StepConnector = ({ done }) => (
  <div className={`flex-1 h-0.5 mx-2 transition-colors ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
);

const SendFormLinkWidget = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('+998');
  const [phoneError, setPhoneError] = useState(null);

  const [vacancies, setVacancies] = useState([]);
  const [forms, setForms] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  const [selectedVacancyId, setSelectedVacancyId] = useState(null);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load vacancies & forms once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingData(true);
        setDataError(null);
        const [vData, fData] = await Promise.all([
          getAllVacancies().catch(() => []),
          getAllApplicationForms().catch(() => []),
        ]);
        if (cancelled) return;
        setVacancies(Array.isArray(vData) ? vData : []);
        const map = {};
        (Array.isArray(fData) ? fData : []).forEach((f) => {
          if (f && f.vacancyId) map[f.vacancyId] = f;
        });
        setForms(map);
      } catch (err) {
        if (!cancelled) setDataError(err?.message || "Ma'lumotlarni yuklab bo'lmadi");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const eligibleVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      const f = forms[v._id];
      return f && f.status === 'active';
    });
  }, [vacancies, forms]);

  // ===== Step navigation =====
  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    setPhoneError(null);
    setServerError(null);
  };

  const handlePhoneNext = () => {
    if (!PHONE_RE.test(phone.trim())) {
      setPhoneError('Format: +998XXXXXXXXX (9 ta raqam)');
      return;
    }
    setStep(2);
  };

  const handleBackToPhone = () => {
    setStep(1);
    setSelectedVacancyId(null);
    setServerError(null);
  };

  const handleSend = async () => {
    if (!selectedVacancyId) {
      setServerError("Vakansiyani tanlang");
      return;
    }
    try {
      setSending(true);
      setServerError(null);
      const data = await sendApplicationFormSmsLink({
        phone: phone.trim(),
        vacancyId: selectedVacancyId,
      });
      setResult(data);
      setStep(3);
    } catch (err) {
      setServerError(err?.message || "SMS yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPhone('+998');
    setPhoneError(null);
    setSelectedVacancyId(null);
    setServerError(null);
    setResult(null);
    setCopied(false);
  };

  const handleCopyUrl = async () => {
    if (!result?.formUrl) return;
    try {
      await navigator.clipboard.writeText(result.formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // ignore
    }
  };

  const selectedVacancy = vacancies.find((v) => v._id === selectedVacancyId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-sm flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">So'rovnoma yuborish</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Kandidatga ariza havolasini SMS orqali yuboring
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-5 flex items-center">
          <StepBadge n={1} label="Telefon" active={step >= 1} done={step > 1} />
          <StepConnector done={step > 1} />
          <StepBadge n={2} label="Vakansiya" active={step >= 2} done={step > 2} />
          <StepConnector done={step > 2} />
          <StepBadge n={3} label="Yuborildi" active={step >= 3} />
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* ===== STEP 1: PHONE ===== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kandidatning telefon raqami
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePhoneNext();
                  }
                }}
                placeholder="+998901112233"
                autoFocus
                className={`w-full px-4 py-3 border rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  phoneError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {phoneError ? (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Format: +998XXXXXXXXX (mas: +998901234567)
                </p>
              )}

              <div className="mt-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handlePhoneNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                >
                  Davom etish
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 2: VACANCY ===== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Phone summary */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Yuboriladi:</p>
                    <p className="text-sm font-mono font-medium text-gray-900 truncate">{phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white border border-gray-200 rounded-lg transition-colors flex-shrink-0"
                >
                  O'zgartirish
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vakansiyani tanlang{' '}
                <span className="text-gray-400 font-normal">
                  (faqat aktiv so'rovnomali vakansiyalar)
                </span>
              </label>

              {serverError && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {serverError}
                </div>
              )}

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Yuklanmoqda...</p>
                  </div>
                </div>
              ) : dataError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {dataError}
                </div>
              ) : eligibleVacancies.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                  <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    Aktiv so'rovnomali vakansiyalar topilmadi
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Avval vakansiyaga so'rovnoma qo'shing
                  </p>
                  <Link
                    to="/dashboard/vacancies"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Vakansiyalarga o'tish
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {eligibleVacancies.map((v) => {
                    const form = forms[v._id];
                    const isSelected = selectedVacancyId === v._id;
                    const isClosed = v.isOpen === false;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => setSelectedVacancyId(v._id)}
                        className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 pr-6">
                          {v.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.salary}</p>
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-700 rounded">
                            {form?.questions?.length || 0} ta savol
                          </span>
                          {isClosed && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded">
                              Yopiq
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Orqaga
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !selectedVacancyId || eligibleVacancies.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      SMS yuborish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 3: SUCCESS ===== */}
          {step === 3 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.05 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100"
                >
                  <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  SMS muvaffaqiyatli yuborildi
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Kandidat tez orada havolani oladi
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Telefon raqam</p>
                    <p className="mt-0.5 text-sm font-mono font-medium text-gray-900 truncate">
                      {phone}
                    </p>
                  </div>
                </div>

                {selectedVacancy && (
                  <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Vakansiya</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">
                        {selectedVacancy.title}
                      </p>
                    </div>
                  </div>
                )}

                {result.formUrl && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">So'rovnoma havolasi</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={result.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-blue-600 hover:text-blue-700 truncate font-mono"
                      >
                        {result.formUrl}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                          copied
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {copied ? 'Nusxalandi' : 'Nusxalash'}
                      </button>
                    </div>
                  </div>
                )}

                {result.sms && (
                  <div className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">SMS holati</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 truncate">
                        {result.sms.status || (result.sms.success ? 'sent' : 'failed')}
                      </p>
                    </div>
                    {result.sms.messageId && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Message ID</p>
                        <p className="mt-0.5 text-xs font-mono text-gray-700 truncate max-w-[140px]">
                          {result.sms.messageId}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yangi yuborish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SendFormLinkWidget;
