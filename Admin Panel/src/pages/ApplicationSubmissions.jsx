/**
 * Nomzod arizalari — vakansiya bo'yicha ro'yxat va bitta ariza boshqaruvi
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllVacancies } from '../services/vacancyService.js';
import { getSubmissionsByVacancy } from '../services/applicationSubmissionService.js';
import CustomSelect from '../components/common/CustomSelect.jsx';
import SubmissionDetailModal from '../components/submissions/SubmissionDetailModal.jsx';
import SubmissionEditModal from '../components/submissions/SubmissionEditModal.jsx';
import { formatUzDateTime } from '../utils/uzDateFormat.js';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedVacancyId = searchParams.get('vacancyId') || '';

  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [vacanciesError, setVacanciesError] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);

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
    () =>
      vacancies.map((v) => ({
        value: v._id,
        label: v.title || v._id,
        group: 'Vakansiyalar',
      })),
    [vacancies]
  );

  const selectedVacancy = useMemo(
    () => vacancies.find((v) => v._id === selectedVacancyId) || null,
    [vacancies, selectedVacancyId]
  );

  const loadSubmissions = useCallback(async () => {
    if (!selectedVacancyId) {
      setSubmissions([]);
      return;
    }
    setSubLoading(true);
    setSubError(null);
    try {
      const data = await getSubmissionsByVacancy(selectedVacancyId);
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
    if (id) {
      setSearchParams({ vacancyId: id });
    } else {
      setSearchParams({});
    }
  };

  const displayNumber = (s) => s.displayNumber ?? s.submissionNumber ?? s._id?.slice(-8) ?? '—';

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
            Vakansiya tanlang — topshirilgan arizalar, holat, SMS va aloqa jurnali
          </p>
        </div>
        <Link
          to="/dashboard/vacancies"
          className="inline-flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vakansiyalarga qaytish
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <label className="mb-2 block text-sm font-medium text-gray-700">Vakansiya</label>
        {vacanciesLoading ? (
          <p className="text-sm text-gray-500">Vakansiyalar yuklanmoqda...</p>
        ) : vacanciesError ? (
          <p className="text-sm text-red-600">{vacanciesError}</p>
        ) : (
          <div className="max-w-xl">
            <CustomSelect
              value={selectedVacancyId || ''}
              onChange={handleVacancyChange}
              options={vacancyOptions}
              placeholder="Vakansiyani tanlang"
            />
          </div>
        )}
        {selectedVacancy && (
          <p className="mt-3 text-xs text-gray-500">
            Tanlangan: <span className="font-medium text-gray-800">{selectedVacancy.title}</span>
          </p>
        )}
      </motion.div>

      {!selectedVacancyId ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          <p className="text-sm">{"Arizalarni ko'rish uchun yuqoridan vakansiya tanlang."}</p>
        </div>
      ) : subLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Arizalar yuklanmoqda...</p>
          </div>
        </div>
      ) : subError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{subError}</div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-600">{"Bu vakansiya uchun hali ariza yo'q."}</p>
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
                  <th className="th-cell">Holat</th>
                  <th className="th-cell">Telefon</th>
                  <th className="th-cell hidden md:table-cell">Sana</th>
                  <th className="th-cell min-w-[10rem] text-right sm:min-w-[12rem]">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((s) => {
                  const st = (s.status || 'pending').toLowerCase();
                  const su = STATUS_UZ[st] || {
                    label: s.status || '—',
                    className: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={s._id} className="hover:bg-gray-50/80">
                      <td className="td-cell font-mono font-medium text-gray-900">{displayNumber(s)}</td>
                      <td className="td-cell">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${su.className}`}>
                          {su.label}
                        </span>
                      </td>
                      <td className="td-cell font-mono text-gray-800">{s.applicantPhone || '—'}</td>
                      <td className="td-cell hidden text-gray-600 md:table-cell">{formatUzDateTime(s.createdAt)}</td>
                      <td className="td-cell py-2 sm:py-4">
                        <div className="flex flex-wrap items-center justify-end gap-0.5">
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
            Jami: {submissions.length} ta ariza
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
