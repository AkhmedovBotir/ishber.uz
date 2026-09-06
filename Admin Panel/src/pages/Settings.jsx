/**
 * Sozlamalar Sahifasi (System Settings Page)
 * Forma URL, Eskiz.uz SMS integratsiyasi, avtomatik xabarnomalar va suhbat sozlamalari
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSystemSettings,
  updateSystemSettings,
  testEskizConnection,
  sendTestSms,
} from '../services/settingsService.js';
import { useModal } from '../context/ModalContext.jsx';

const Settings = () => {
  const { alert: showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form URL Settings
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApplyPath, setFormApplyPath] = useState('vacancies/{vacancyId}/apply');

  // Eskiz SMS Settings
  const [eskizEmail, setEskizEmail] = useState('');
  const [eskizPassword, setEskizPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [eskizFrom, setEskizFrom] = useState('4546');

  // SMS Automation Triggers
  const [smsOnSubmit, setSmsOnSubmit] = useState(true);
  const [smsOnAccept, setSmsOnAccept] = useState(true);
  const [smsOnReject, setSmsOnReject] = useState(true);

  // Interview Settings
  const [reminderOffset, setReminderOffset] = useState(0);
  const [timezone, setTimezone] = useState('Asia/Tashkent');

  // Eskiz Test State
  const [testingEskiz, setTestingEskiz] = useState(false);
  const [eskizTestResult, setEskizTestResult] = useState(null);

  // Test SMS State
  const [testSmsModalOpen, setTestSmsModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Ishber.uz: Tizim sozlamalari orqali test SMS xabari!');
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState(null);

  // Sample ID for live link preview
  const sampleVacancyId = '66d8b2e1f48123456789abcd';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getSystemSettings();
      if (data) {
        setFormBaseUrl(data.applicationFormBaseUrl || '');
        setFormApplyPath(data.applicationFormApplyPath || 'vacancies/{vacancyId}/apply');
        setEskizEmail(data.eskizEmail || '');
        setEskizPassword(data.eskizPassword || '');
        setEskizFrom(data.eskizFrom || '4546');
        setSmsOnSubmit(data.submissionSmsOnSubmit !== false);
        setSmsOnAccept(data.submissionSmsOnAccept !== false);
        setSmsOnReject(data.submissionSmsOnReject !== false);
        setReminderOffset(Number(data.interviewReminderOffsetMinutes) || 0);
        setTimezone(data.interviewTimezone || 'Asia/Tashkent');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Sozlamalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const payload = {
        applicationFormBaseUrl: formBaseUrl.trim(),
        applicationFormApplyPath: formApplyPath.trim(),
        eskizEmail: eskizEmail.trim(),
        eskizPassword: eskizPassword.trim(),
        eskizFrom: eskizFrom.trim() || '4546',
        submissionSmsOnSubmit: smsOnSubmit,
        submissionSmsOnAccept: smsOnAccept,
        submissionSmsOnReject: smsOnReject,
        interviewReminderOffsetMinutes: Number(reminderOffset),
        interviewTimezone: timezone,
      };

      await updateSystemSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage(err?.message || 'Sozlamalarni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEskiz = async () => {
    try {
      setTestingEskiz(true);
      setEskizTestResult(null);
      const res = await testEskizConnection({
        email: eskizEmail.trim(),
        password: eskizPassword.trim(),
      });
      setEskizTestResult({
        success: true,
        message: res?.message || "Eskiz.uz ga muvaffaqiyatli ulandi!",
        user: res?.user,
      });
    } catch (err) {
      setEskizTestResult({
        success: false,
        message: err?.message || "Eskiz.uz bilan ulanish amalga oshmadi",
      });
    } finally {
      setTestingEskiz(false);
    }
  };

  const handleSendTestSms = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    try {
      setSendingTestSms(true);
      setTestSmsResult(null);
      const res = await sendTestSms(testPhone.trim(), testMessage.trim());
      setTestSmsResult({
        success: true,
        message: res?.message || "Test SMS muvaffaqiyatli yuborildi!",
      });
    } catch (err) {
      setTestSmsResult({
        success: false,
        message: err?.message || "SMS yuborishda xatolik yuz berdi",
      });
    } finally {
      setSendingTestSms(false);
    }
  };

  const previewUrl = formBaseUrl.trim()
    ? `${formBaseUrl.trim().replace(/\/$/, '')}/${formApplyPath.replace(/\{vacancyId\}/gi, sampleVacancyId).replace(/^\/+/, '')}`
    : null;

  return (
    <div className="page-shell">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Tizim Sozlamalari</h1>
          <p className="mt-1 text-sm text-gray-600">
            Forma URL havolalari, Eskiz.uz SMS integratsiyasi va xabarnomalar boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yangilash
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sozlamalarni saqlash
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Notifications Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">Barcha sozlamalar muvaffaqiyatli saqlandi!</div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm font-medium">{errorMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Sozlamalar yuklanmoqda...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: PUBLIC APPLICATION FORM URL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Ariza Topshirish Forma Havolasi (Public Form URL)</h2>
                <p className="text-xs text-gray-500">
                  Nomzodlar arizani onlayn to‘ldirishi uchun umumiy forma domeni va yo‘nalishi
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Forma Asosiy Havolasi (Base URL)
                </label>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formBaseUrl}
                      onChange={(e) => setFormBaseUrl(e.target.value)}
                      placeholder="Masalan: https://form.ishber.uz yoki http://localhost:5174"
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-3.5 pr-10 text-sm font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {formBaseUrl && (
                      <button
                        type="button"
                        onClick={() => setFormBaseUrl('')}
                        title="Tozalash"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormBaseUrl('http://localhost:5174')}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Lokal (:5174)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBaseUrl('https://form.ishber.uz')}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Production
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBaseUrl('')}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      O‘chirish (Bo‘shatish)
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Bo‘sh qoldirilsa, vakansiyalarda onlayn forma havolasi o‘chirilgan bo‘ladi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Forma Yo‘nalishi Qolipi (Apply Path Pattern)
                </label>
                <input
                  type="text"
                  value={formApplyPath}
                  onChange={(e) => setFormApplyPath(e.target.value)}
                  placeholder="vacancies/{vacancyId}/apply"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-lg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Standart holatda: <code className="font-mono text-gray-700">vacancies/{'{vacancyId}'}/apply</code>
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vakansiya havolasi namunasi (Live Preview)
                </span>
                {previewUrl ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-xs font-medium text-blue-700 break-all">
                      {previewUrl}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(previewUrl);
                            showAlert({
                              title: 'Nusxalandi',
                              message: 'Ariza topshirish havolasi buferga nusxalandi!',
                              type: 'success',
                            });
                          } catch {
                            showAlert({
                              title: 'Xatolik',
                              message: 'Buferga nusxalashda xatolik yuz berdi',
                              type: 'error',
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Nusxalash
                      </button>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Ochib ko‘rish ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs italic text-gray-400">
                    Havola o‘chirilgan (Vakansiyalarda forma havolasi ko‘rinmaydi)
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* SECTION 2: ESKIZ.UZ SMS INTEGRATION */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Eskiz.uz SMS Gateway Integratsiyasi</h2>
                  <p className="text-xs text-gray-500">
                    Nomzodlarga SMS yuborish uchun Eskiz.uz profilingiz hisob ma'lumotlari
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestEskiz}
                  disabled={testingEskiz || !eskizEmail || !eskizPassword}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-40"
                >
                  {testingEskiz ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      Tekshirilmoqda...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ulanishni tekshirish
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTestSmsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Test SMS yuborish
                </button>
              </div>
            </div>

            {/* Test Connection Result Box */}
            <AnimatePresence>
              {eskizTestResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 rounded-xl border p-4 text-xs ${
                    eskizTestResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {eskizTestResult.success ? (
                      <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{eskizTestResult.message}</p>
                      {eskizTestResult.user && (
                        <div className="mt-2 flex flex-wrap gap-4 text-emerald-800">
                          {eskizTestResult.user.name && <span>Foydalanuvchi: <b>{eskizTestResult.user.name}</b></span>}
                          {eskizTestResult.user.balance !== undefined && <span>Balans: <b>{eskizTestResult.user.balance} SMS</b></span>}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  ESKIZ Email (Login)
                </label>
                <input
                  type="email"
                  value={eskizEmail}
                  onChange={(e) => setEskizEmail(e.target.value)}
                  placeholder="masalan: user@gmail.com"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  ESKIZ Parol (Password)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={eskizPassword}
                    onChange={(e) => setEskizPassword(e.target.value)}
                    placeholder="Eskiz.uz hisob paroli"
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-3.5 pr-10 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  SMS Yuboruvchi Nomi (Header / From)
                </label>
                <input
                  type="text"
                  value={eskizFrom}
                  onChange={(e) => setEskizFrom(e.target.value)}
                  placeholder="4546"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Standart bepul raqam: <code className="font-mono font-medium">4546</code>
                </p>
              </div>
            </div>
          </motion.div>

          {/* SECTION 3: AUTOMATIC SMS TRIGGERS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Avtomatik SMS Xabarnomalar</h2>
                <p className="text-xs text-gray-500">
                  Qaysi holatlarda nomzodlarga avtomatik SMS xabarlar yuborilishini belgilang
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ariza muvaffaqiyatli topshirilganda</p>
                  <p className="text-xs text-gray-500">Nomzod formani to‘ldirib jo‘natganida ariza tartib raqami bilan SMS boradi</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={smsOnSubmit}
                    onChange={(e) => setSmsOnSubmit(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ariza qabul qilinganda (Accepted)</p>
                  <p className="text-xs text-gray-500">HR admin arizani «Qabul qilish» tugmasi orqali tasdiqlaganda nomzodga SMS boradi</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={smsOnAccept}
                    onChange={(e) => setSmsOnAccept(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ariza rad etilganda (Rejected)</p>
                  <p className="text-xs text-gray-500">HR admin arizani bekor qilganda ko‘rsatilgan sabab bilan birga nomzodga SMS boradi</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={smsOnReject}
                    onChange={(e) => setSmsOnReject(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Bottom Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
            </button>
          </div>
        </form>
      )}

      {/* TEST SMS MODAL */}
      <AnimatePresence>
        {testSmsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setTestSmsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-base font-bold text-gray-900">Test SMS Yuborish</h3>
                <button
                  type="button"
                  onClick={() => setTestSmsModalOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSendTestSms} className="p-5 space-y-4">
                {testSmsResult && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs ${
                      testSmsResult.success
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-rose-200 bg-rose-50 text-rose-900'
                    }`}
                  >
                    {testSmsResult.message}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Qabul qiluvchi telefon raqami
                  </label>
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="mt-1.5 w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    SMS Xabar Matni
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-300 py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestSmsModalOpen(false)}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Yopish
                  </button>
                  <button
                    type="submit"
                    disabled={sendingTestSms || !testPhone.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingTestSms ? 'Yuborilmoqda...' : 'Yuborish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
