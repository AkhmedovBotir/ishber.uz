/**
 * Nomzod arizalari — vakansiya bo'yicha ro'yxat va bitta ariza boshqaruvi
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllVacancies } from '../services/vacancyService.js';
import {
  getAllSubmissions,
  getSubmissionsByVacancy,
  patchSubmissionCandidate,
} from '../services/applicationSubmissionService.js';
import CustomSelect from '../components/common/CustomSelect.jsx';
import SubmissionDetailModal from '../components/submissions/SubmissionDetailModal.jsx';
import SubmissionEditModal from '../components/submissions/SubmissionEditModal.jsx';
import { formatUzDateTime } from '../utils/uzDateFormat.js';
import { useModal } from '../context/ModalContext.jsx';

const iconBtnClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:opacity-30';

function ActionIconButton({ title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={iconBtnClass}
    >
      {children}
    </button>
  );
}

const STATUS_UZ = {
  pending: { label: "Kutilmoqda", className: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Qabul qilingan', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rad etilgan', className: 'bg-red-100 text-red-800' },
};

const ApplicationSubmissions = () => {
  const { alert: showAlert } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedVacancyId = searchParams.get('vacancyId') || '';
  const paramSearch = searchParams.get('search') || '';
  const paramStatus = searchParams.get('status') || '';

  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [vacanciesError, setVacanciesError] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);

  const [search, setSearch] = useState(paramSearch);
  const [statusFilter, setStatusFilter] = useState(paramStatus);

  const [detailId, setDetailId] = useState(null);
  const [detailFocus, setDetailFocus] = useState(null);
  const [editId, setEditId] = useState(null);

  const openDetail = (id, focus = null) => {
    setEditId(null);
    setDetailId(id);
    setDetailFocus(focus);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailFocus(null);
  };

  const openEdit = (id) => {
    setDetailId(null);
    setDetailFocus(null);
    setEditId(id);
  };

  const closeEdit = () => setEditId(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setVacanciesLoading(true);
        setVacanciesError(null);
        const data = await getAllVacancies();
        if (!cancelled) setVacancies(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setVacanciesError(e?.message || 'Vakansiyalar yuklanmadi');
      } finally {
        if (!cancelled) setVacanciesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vacancyOptions = useMemo(
    () => [
      { value: '', label: 'Barcha arizalar (Barcha vakansiyalar)', group: 'Umumiy' },
      ...vacancies.map((v) => ({
        value: v._id,
        label: v.title || v._id,
        group: 'Vakansiyalar',
      })),
    ],
    [vacancies]
  );

  const statusOptions = [
    { value: '', label: 'Barcha holatlar', group: 'Ariza holati' },
    { value: 'pending', label: 'Kutilmoqda', group: 'Ariza holati' },
    { value: 'accepted', label: 'Qabul qilingan', group: 'Ariza holati' },
    { value: 'rejected', label: 'Rad etilgan', group: 'Ariza holati' },
  ];

  const selectedVacancy = useMemo(
    () => vacancies.find((v) => v._id === selectedVacancyId) || null,
    [vacancies, selectedVacancyId]
  );

  const loadSubmissions = useCallback(async () => {
    setSubLoading(true);
    setSubError(null);
    try {
      let data;
      if (selectedVacancyId) {
        data = await getSubmissionsByVacancy(selectedVacancyId);
      } else {
        data = await getAllSubmissions();
      }
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      setSubmissions([]);
      setSubError(e?.message || 'Arizalar yuklanmadi');
    } finally {
      setSubLoading(false);
    }
  }, [selectedVacancyId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleVacancyChange = (id) => {
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set('vacancyId', id);
    } else {
      nextParams.delete('vacancyId');
    }
    setSearchParams(nextParams);
  };

  const handleToggleCandidate = async (submissionId, isCandidate) => {
    try {
      await patchSubmissionCandidate(submissionId, isCandidate);
      await loadSubmissions();
    } catch (e) {
      showAlert({
        title: 'Xatolik',
        message: e?.message || 'Nomzod holatini o‘zgartirishda xatolik',
        type: 'error',
      });
    }
  };

  const displayNumber = (s) => s.displayNumber ?? s.submissionNumber ?? s._id?.slice(-8) ?? '—';

  // Filtered submissions (search + status)
  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (q) {
        const phoneMatch = (s.applicantPhone || '').toLowerCase().includes(q);
        const numMatch = (displayNumber(s) || '').toLowerCase().includes(q);
        const vacMatch = (s.vacancyTitle || '').toLowerCase().includes(q);
        if (!phoneMatch && !numMatch && !vacMatch) return false;
      }
      if (statusFilter && statusFilter !== 'all' && (s.status || 'pending') !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [submissions, search, statusFilter]);

  return (
    <div className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Nomzod arizalari</h1>
          <p className="mt-1 text-sm text-gray-600">
            {selectedVacancy
              ? `«${selectedVacancy.title}» vakansiyasi bo‘yicha topshirilgan arizalar`
              : 'Barcha vakansiyalar bo‘yicha topshirilgan umumiy arizalar ro‘yxati'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={selectedVacancyId ? `/dashboard/candidates?vacancyId=${selectedVacancyId}` : '/dashboard/candidates'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Nomzodlar sahifasida ko‘rish
          </Link>
          <Link
            to="/dashboard/vacancies"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vakansiyalar
          </Link>
        </div>
      </motion.div>

      {/* Filter toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Vacancy selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Vakansiya
            </label>
            {vacanciesLoading ? (
              <p className="text-sm text-gray-500">Vakansiyalar yuklanmoqda...</p>
            ) : vacanciesError ? (
              <p className="text-sm text-red-600">{vacanciesError}</p>
            ) : (
              <CustomSelect
                value={selectedVacancyId || ''}
                onChange={handleVacancyChange}
                options={vacancyOptions}
                placeholder="Barcha arizalar (Barcha vakansiyalar)"
              />
            )}
          </div>

          {/* Search input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Qidiruv
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Telefon yoki raqam bo‘yicha..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Holat
            </label>
            <CustomSelect
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Barcha holatlar"
            />
          </div>
        </div>
      </motion.div>

      {subLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Arizalar yuklanmoqda...</p>
          </div>
        </div>
      ) : subError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{subError}</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">
            {submissions.length === 0 ? "Hozircha arizalar yo'q" : "Filtrlarga mos ariza topilmadi"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {submissions.length === 0
              ? (selectedVacancy ? `«${selectedVacancy.title}» uchun hali ariza kelib tushmagan.` : 'Tizimda hali hech qanday ariza topshirilmagan.')
              : 'Qidiruv so‘rovi yoki tanlangan holat bo‘yicha ariza topilmadi.'}
          </p>
          {submissions.length > 0 && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                handleVacancyChange('');
              }}
              className="mt-4 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="table-scroll">
            <table className="table-scroll-inner min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th-cell">№</th>
                  <th className="th-cell">Vakansiya</th>
                  <th className="th-cell">Holat</th>
                  <th className="th-cell">Telefon</th>
                  <th className="th-cell hidden md:table-cell">Sana</th>
                  <th className="th-cell min-w-[10rem] text-right sm:min-w-[12rem]">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((s) => {
                  const st = (s.status || 'pending').toLowerCase();
                  const su = STATUS_UZ[st] || {
                    label: s.status || '—',
                    className: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={s._id} className="hover:bg-gray-50/80">
                      <td className="td-cell font-mono font-medium text-gray-900">{displayNumber(s)}</td>
                      <td className="td-cell font-medium text-gray-800">
                        {s.vacancyTitle || selectedVacancy?.title || 'Vakansiya'}
                      </td>
                      <td className="td-cell">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${su.className}`}>
                          {su.label}
                        </span>
                      </td>
                      <td className="td-cell font-mono text-gray-800">{s.applicantPhone || '—'}</td>
                      <td className="td-cell hidden text-gray-600 md:table-cell">{formatUzDateTime(s.createdAt)}</td>
                      <td className="td-cell py-2 sm:py-4">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {s.isCandidate ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCandidate(s._id, false)}
                              title="Nomzodlikdan chiqarish"
                              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Nomzod ✓
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCandidate(s._id, true)}
                              title="Nomzodlar safiga o‘tkazish"
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              + Nomzod
                            </button>
                          )}
                          <Link
                            to={`/dashboard/candidates?submissionId=${s._id}&search=${encodeURIComponent(s.applicantPhone || '')}`}
                            title="Nomzodlar sahifasida ochish"
                            aria-label="Nomzodlar sahifasida ochish"
                            className={iconBtnClass}
                          >
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </Link>
                          <ActionIconButton
                            title="Tahrirlash"
                            onClick={() => openEdit(s._id)}
                          >
                            <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </ActionIconButton>
                          <ActionIconButton
                            title="Batafsil"
                            onClick={() => openDetail(s._id, null)}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </ActionIconButton>
                          {st === 'pending' && (
                            <>
                              <ActionIconButton
                                title="Qabul qilish"
                                onClick={() => openDetail(s._id, 'status')}
                              >
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </ActionIconButton>
                              <ActionIconButton
                                title="Rad etish"
                                onClick={() => openDetail(s._id, 'reject')}
                              >
                                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </ActionIconButton>
                              <ActionIconButton
                                title="Aloqaga chiqildi"
                                onClick={() => openDetail(s._id, 'contact')}
                              >
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </ActionIconButton>
                            </>
                          )}
                          <ActionIconButton
                            title="Aloqa yozuvi"
                            onClick={() => openDetail(s._id, 'note')}
                          >
                            <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </ActionIconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Jami: {filteredSubmissions.length} ta ariza
          </div>
        </motion.div>
      )}

      <SubmissionDetailModal
        submissionId={detailId}
        isOpen={!!detailId}
        onClose={closeDetail}
        onUpdated={loadSubmissions}
        initialFocus={detailFocus}
        fallbackVacancyId={selectedVacancyId || null}
        onEdit={openEdit}
      />

      <SubmissionEditModal
        submissionId={editId}
        isOpen={!!editId}
        onClose={closeEdit}
        onSaved={loadSubmissions}
        fallbackVacancyId={selectedVacancyId || null}
      />
    </div>
  );
};

export default ApplicationSubmissions;
