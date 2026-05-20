/**
 * Nomzod suhbatlari — ro‘yxat, filter, yangi suhbat, batafsil
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllVacancies } from '../services/vacancyService.js';
import { getInterviews } from '../services/interviewService.js';
import CustomSelect from '../components/common/CustomSelect.jsx';
import CreateInterviewModal from '../components/interviews/CreateInterviewModal.jsx';
import InterviewDetailModal from '../components/interviews/InterviewDetailModal.jsx';
import { formatUzDateTime } from '../utils/uzDateFormat.js';

const STATUS_FILTER = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'scheduled', label: 'Rejalashtirilgan' },
  { value: 'completed', label: 'Yakunlangan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
  { value: 'no_show', label: 'Kelmay qoldi' },
];

const STATUS_ROW = {
  scheduled: { label: 'Rejalashtirilgan', className: 'bg-sky-100 text-sky-900' },
  completed: { label: 'Yakunlangan', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Bekor qilingan', className: 'bg-gray-200 text-gray-800' },
  no_show: { label: 'Kelmay qoldi', className: 'bg-red-100 text-red-800' },
};

function normalizeInterviewsList(data) {
  if (Array.isArray(data)) return data;
  if (data?.interviews && Array.isArray(data.interviews)) return data.interviews;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

const Interviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const vacancyId = searchParams.get('vacancyId') || '';
  const status = searchParams.get('status') || '';

  const [vacancies, setVacancies] = useState([]);
  const [vacLoading, setVacLoading] = useState(true);
  const [vacError, setVacError] = useState(null);

  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setVacLoading(true);
        setVacError(null);
        const data = await getAllVacancies();
        if (!cancelled) setVacancies(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setVacError(e?.message || 'Vakansiyalar yuklanmadi');
      } finally {
        if (!cancelled) setVacLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vacancyOptions = useMemo(
    () => [
      { value: '', label: 'Barcha vakansiyalar', group: 'Filter' },
      ...vacancies.map((v) => ({
        value: v._id,
        label: v.title || v._id,
        group: 'Vakansiyalar',
      })),
    ],
    [vacancies]
  );

  const statusOptions = useMemo(
    () =>
      STATUS_FILTER.map((s) => ({
        value: s.value,
        label: s.label,
        group: 'Holat',
      })),
    []
  );

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const query = {};
      if (vacancyId) query.vacancyId = vacancyId;
      if (status) query.status = status;
      const data = await getInterviews(query);
      setRows(normalizeInterviewsList(data));
    } catch (e) {
      setRows([]);
      setListError(e?.message || 'Suhbatlar yuklanmadi');
    } finally {
      setListLoading(false);
    }
  }, [vacancyId, status]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const setVacancyFilter = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('vacancyId', id);
    else next.delete('vacancyId');
    setSearchParams(next);
  };

  const setStatusFilter = (s) => {
    const next = new URLSearchParams(searchParams);
    if (s) next.set('status', s);
    else next.delete('status');
    setSearchParams(next);
  };

  return (
    <div className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Nomzod suhbatlari</h1>
          <p className="mt-1 text-sm text-gray-600">
            Reja, manzil, eslatma SMS va suhbat natijasi — Interviews API
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/submissions"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Arizalar
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={vacLoading || !!vacError}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Yangi suhbat
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Vakansiya</label>
          {vacLoading ? (
            <p className="text-sm text-gray-500">Yuklanmoqda...</p>
          ) : vacError ? (
            <p className="text-sm text-red-600">{vacError}</p>
          ) : (
            <CustomSelect value={vacancyId} onChange={setVacancyFilter} options={vacancyOptions} placeholder="Filter" />
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Holat</label>
          <CustomSelect value={status} onChange={setStatusFilter} options={statusOptions} placeholder="Holat" />
        </div>
      </motion.div>

      {listLoading ? (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Suhbatlar yuklanmoqda...</p>
          </div>
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{listError}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          <p className="text-sm">{"Hozircha suhbat yo'q yoki filter bo'sh."}</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Birinchi suhbatni rejalashtirish
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="table-scroll">
            <table className="table-scroll-inner min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th-cell">Nomzod</th>
                  <th className="th-cell hidden md:table-cell">Vakansiya</th>
                  <th className="th-cell hidden lg:table-cell">Mavzu</th>
                  <th className="th-cell hidden sm:table-cell">Vaqt</th>
                  <th className="th-cell">Holat</th>
                  <th className="th-cell min-w-[8rem] text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const st = (row.status || 'scheduled').toLowerCase();
                  const su = STATUS_ROW[st] || {
                    label: row.status || '—',
                    className: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={row._id} className="hover:bg-gray-50/80">
                      <td className="td-cell">
                        <p className="font-medium text-gray-900">{row.candidateName || '—'}</p>
                        <p className="font-mono text-xs text-gray-500">{row.candidatePhone || ''}</p>
                        <p className="mt-0.5 text-xs text-gray-500 sm:hidden">{formatUzDateTime(row.scheduledAt)}</p>
                      </td>
                      <td className="td-cell hidden max-w-[12rem] truncate md:table-cell" title={row.vacancyTitle || row.vacancyId}>
                        {row.vacancyTitle || row.vacancyId || '—'}
                      </td>
                      <td className="td-cell hidden max-w-[10rem] truncate lg:table-cell" title={row.topic}>
                        {row.topic || '—'}
                      </td>
                      <td className="td-cell hidden whitespace-nowrap text-gray-600 sm:table-cell">{formatUzDateTime(row.scheduledAt)}</td>
                      <td className="td-cell">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${su.className}`}>
                          {su.label}
                        </span>
                        {row.reminderSmsSent ? (
                          <span className="ml-1 text-[10px] font-medium text-emerald-600" title="Eslatma SMS">
                            SMS ✓
                          </span>
                        ) : null}
                      </td>
                      <td className="td-cell text-right">
                        <button
                          type="button"
                          onClick={() => setDetailId(row._id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Batafsil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Jami: {rows.length} ta
          </div>
        </motion.div>
      )}

      <CreateInterviewModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        vacancies={vacancies}
        onCreated={loadList}
      />

      <InterviewDetailModal
        interviewId={detailId}
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        onUpdated={loadList}
      />
    </div>
  );
};

export default Interviews;
