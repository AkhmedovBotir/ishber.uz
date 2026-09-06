/**
 * Nomzodlar Sahifasi (Candidates Page)
 * Aynan nomzod qilib olib o'tilganlar ro'yxati, filtrlash,
 * suhbat belgilash va arizalarni to'liq boshqarish.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllVacancies } from '../services/vacancyService.js';
import { getAllApplicationForms } from '../services/applicationFormService.js';
import { getAllSubmissions, patchSubmissionCandidate } from '../services/applicationSubmissionService.js';
import { getInterviews } from '../services/interviewService.js';
import { extractCandidateName, getCandidateInitials } from '../utils/candidateHelper.js';
import { formatUzDate, formatUzDateTime } from '../utils/uzDateFormat.js';
import CustomSelect from '../components/common/CustomSelect.jsx';
import SubmissionDetailModal from '../components/submissions/SubmissionDetailModal.jsx';
import CreateInterviewModal from '../components/interviews/CreateInterviewModal.jsx';
import InterviewDetailModal from '../components/interviews/InterviewDetailModal.jsx';
import { useModal } from '../context/ModalContext.jsx';

const STATUS_BADGES = {
  pending: { label: 'Kutilmoqda', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted: { label: 'Qabul qilingan', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rad etilgan', className: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const INTERVIEW_STATUS_BADGES = {
  scheduled: { label: 'Suhbat rejalashtirilgan', className: 'bg-sky-100 text-sky-800' },
  completed: { label: 'Suhbat o‘tkazilgan', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Suhbat bekor qilingan', className: 'bg-zinc-100 text-zinc-700' },
  no_show: { label: 'Suhbatga kelmadi', className: 'bg-rose-100 text-rose-800' },
};

const Candidates = () => {
  const { alert: showAlert, confirm: showConfirm } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramVacancyId = searchParams.get('vacancyId') || '';
  const paramStatus = searchParams.get('status') || '';
  const paramSearch = searchParams.get('search') || '';
  const paramSubmissionId = searchParams.get('submissionId') || '';

  const [vacancies, setVacancies] = useState([]);
  const [formsMap, setFormsMap] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(paramSearch);
  const [selectedVacancy, setSelectedVacancy] = useState(paramVacancyId);
  const [statusFilter, setStatusFilter] = useState(paramStatus);
  const [interviewFilter, setInterviewFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [detailSubmissionId, setDetailSubmissionId] = useState(paramSubmissionId || null);
  const [interviewTargetCandidate, setInterviewTargetCandidate] = useState(null);
  const [detailInterviewId, setDetailInterviewId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vacRes, formsRes, subRes, intRes] = await Promise.all([
        getAllVacancies().catch(() => []),
        getAllApplicationForms().catch(() => []),
        getAllSubmissions({ isCandidate: true, includeAnswers: true }).catch(() => []),
        getInterviews().catch(() => []),
      ]);

      setVacancies(Array.isArray(vacRes) ? vacRes : []);

      const fMap = {};
      if (Array.isArray(formsRes)) {
        formsRes.forEach((f) => {
          if (f?.vacancyId) fMap[String(f.vacancyId)] = f;
        });
      }
      setFormsMap(fMap);

      setSubmissions(Array.isArray(subRes) ? subRes : []);
      setInterviews(Array.isArray(intRes) ? intRes : (intRes?.interviews || []));
    } catch (err) {
      setError(err?.message || 'Ma’lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL sync
  useEffect(() => {
    if (paramSearch && paramSearch !== search) setSearch(paramSearch);
    if (paramVacancyId && paramVacancyId !== selectedVacancy) setSelectedVacancy(paramVacancyId);
    if (paramStatus && paramStatus !== statusFilter) setStatusFilter(paramStatus);
    if (paramSubmissionId) setDetailSubmissionId(paramSubmissionId);
  }, [paramSearch, paramVacancyId, paramStatus, paramSubmissionId]);

  // Interviews index by applicationSubmissionId
  const interviewBySubId = useMemo(() => {
    const map = new Map();
    interviews.forEach((i) => {
      if (i.applicationSubmissionId) {
        map.set(String(i.applicationSubmissionId), i);
      }
    });
    return map;
  }, [interviews]);

  // Vacancy map
  const vacMap = useMemo(() => {
    return new Map(vacancies.map((v) => [String(v._id), v.title]));
  }, [vacancies]);

  // Enriched Candidates List: ONLY items that have isCandidate === true
  const candidateList = useMemo(() => {
    return submissions
      .filter((sub) => sub.isCandidate === true)
      .map((sub) => {
        const vId = String(sub.vacancyId || '');
        const form = formsMap[vId] || null;
        const candidateName = extractCandidateName(sub, form);
        const linkedInterview = interviewBySubId.get(String(sub._id)) || null;
        const vacancyTitle = vacMap.get(vId) || sub.vacancyTitle || 'Vakansiya';

        return {
          ...sub,
          vacancyTitle,
          candidateName,
          initials: getCandidateInitials(candidateName),
          interview: linkedInterview,
        };
      });
  }, [submissions, vacMap, formsMap, interviewBySubId]);

  // Filtered List
  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();

    return candidateList.filter((c) => {
      // Search query
      if (q) {
        const nameMatch = (c.candidateName || '').toLowerCase().includes(q);
        const phoneMatch = (c.applicantPhone || '').toLowerCase().includes(q);
        const vacMatch = (c.vacancyTitle || '').toLowerCase().includes(q);
        const numMatch = (c.displayNumber || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !vacMatch && !numMatch) return false;
      }

      // Vacancy filter
      if (selectedVacancy && String(c.vacancyId) !== String(selectedVacancy)) {
        return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Interview filter
      if (interviewFilter === 'has_interview' && !c.interview) return false;
      if (interviewFilter === 'no_interview' && c.interview) return false;
      if (interviewFilter === 'scheduled' && c.interview?.status !== 'scheduled') return false;
      if (interviewFilter === 'completed' && c.interview?.status !== 'completed') return false;

      return true;
    });
  }, [candidateList, search, selectedVacancy, statusFilter, interviewFilter]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = candidateList.length;
    const pending = candidateList.filter((c) => c.status === 'pending').length;
    const accepted = candidateList.filter((c) => c.status === 'accepted').length;
    const scheduled = candidateList.filter((c) => c.interview && c.interview.status === 'scheduled').length;
    return { total, pending, accepted, scheduled };
  }, [candidateList]);

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

  const statusOptions = [
    { value: '', label: 'Barcha holatlar', group: 'Ariza holati' },
    { value: 'pending', label: 'Kutilmoqda', group: 'Ariza holati' },
    { value: 'accepted', label: 'Qabul qilingan', group: 'Ariza holati' },
    { value: 'rejected', label: 'Rad etilgan', group: 'Ariza holati' },
  ];

  const interviewOptions = [
    { value: 'all', label: 'Barcha suhbatlar', group: 'Suhbat' },
    { value: 'has_interview', label: 'Suhbati borlar', group: 'Suhbat' },
    { value: 'no_interview', label: 'Suhbat belgilanmaganlar', group: 'Suhbat' },
    { value: 'scheduled', label: 'Rejalashtirilgan suhbatlar', group: 'Suhbat' },
    { value: 'completed', label: 'O‘tkazilgan suhbatlar', group: 'Suhbat' },
  ];

  const copyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenScheduleInterview = (candidate) => {
    setInterviewTargetCandidate({
      _id: candidate._id,
      vacancyId: candidate.vacancyId,
      vacancyTitle: candidate.vacancyTitle,
      candidateName: candidate.candidateName,
      applicantPhone: candidate.applicantPhone,
    });
  };

  const handleRemoveFromCandidates = async (candidateId) => {
    const isConfirmed = await showConfirm({
      title: 'Nomzodlar safidan chiqarish',
      message: 'Rostdan ham ushbu nomzodni "Nomzodlar" ro‘yxatidan chiqarmoqchimisiz? (Arizalar bo‘limida ariza saqlanib qoladi)',
      confirmText: 'Ha, chiqarilsin',
      cancelText: 'Bekor qilish',
      type: 'warning',
    });

    if (!isConfirmed) return;

    try {
      await patchSubmissionCandidate(candidateId, false);
      await loadData();
      showAlert({
        title: 'Muvaffaqiyatli',
        message: 'Nomzod ro‘yxatdan chiqarildi',
        type: 'success',
      });
    } catch (e) {
      showAlert({
        title: 'Xatolik',
        message: e?.message || 'Xatolik yuz berdi',
        type: 'error',
      });
    }
  };

  return (
    <div className="page-shell">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Nomzodlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Arizalardan tanlab olingan nomzodlar profili va ularning suhbatlari
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/submissions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Arizalar ro‘yxati
          </Link>

          <Link
            to="/dashboard/interviews"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Suhbatlar taqvimi
          </Link>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Jami nomzodlar</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Kutilayotgan nomzodlar</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Qabul qilingan</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.accepted}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-600">Rejalashtirilgan suhbat</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.scheduled}</p>
        </motion.div>
      </div>

      {/* Search & Filter Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search input */}
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
              placeholder="Ism, telefon yoki raqam..."
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

          {/* Vacancy selector */}
          <CustomSelect
            options={vacancyOptions}
            value={selectedVacancy}
            onChange={(val) => setSelectedVacancy(val)}
            placeholder="Vakansiya bo‘yicha"
            className="w-full"
          />

          {/* Status selector */}
          <CustomSelect
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Ariza holati"
            className="w-full"
          />

          {/* Interview status selector */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CustomSelect
                options={interviewOptions}
                value={interviewFilter}
                onChange={(val) => setInterviewFilter(val)}
                placeholder="Suhbat holati"
                className="w-full"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                title="Kartochka ko‘rinishi"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-md p-2 transition ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                title="Jadval ko‘rinishi"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Nomzodlar ma’lumotlari yuklanmoqda...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Qayta yuklash
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCandidates.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {candidateList.length === 0
              ? 'Hozircha nomzodlar ro‘yxati bo‘sh'
              : 'Filtrlarga mos nomzodlar topilmadi'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            {candidateList.length === 0
              ? '«Nomzod arizalari» sahifasidagi arizalarni «+ Nomzod» tugmasi orqali nomzodlar safiga o‘tkazishingiz mumkin.'
              : 'Qidiruv so‘rovi yoki tanlangan filterlar bo‘yicha mos nomzod topilmadi.'}
          </p>
          {candidateList.length === 0 ? (
            <Link
              to="/dashboard/submissions"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Arizalar ro‘yxatiga o‘tish
            </Link>
          ) : (
            <button
              onClick={() => {
                setSearch('');
                setSelectedVacancy('');
                setStatusFilter('');
                setInterviewFilter('all');
              }}
              className="mt-4 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}

      {/* Content: Grid View */}
      {!loading && !error && filteredCandidates.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCandidates.map((candidate) => {
            const statusConfig = STATUS_BADGES[candidate.status] || STATUS_BADGES.pending;
            const interview = candidate.interview;
            const hasInterview = Boolean(interview);

            return (
              <motion.div
                key={candidate._id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  {/* Top row: Avatar + Name + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white shadow-sm">
                        {candidate.initials}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                          {candidate.candidateName}
                        </h3>
                        <span className="inline-block text-xs font-mono font-medium text-gray-500">
                          Nomzod #{candidate.displayNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCandidates(candidate._id)}
                        title="Nomzodlikdan chiqarish"
                        className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Vacancy Info */}
                  <div className="mt-3.5 flex items-center gap-1.5 text-xs text-gray-600">
                    <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-gray-900 truncate">
                      {candidate.vacancyTitle || 'Vakansiya'}
                    </span>
                  </div>

                  {/* Phone & Date */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-gray-700">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {candidate.applicantPhone ? (
                        <>
                          <a
                            href={`tel:${candidate.applicantPhone}`}
                            className="font-medium hover:text-blue-600 hover:underline"
                          >
                            {candidate.applicantPhone}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyPhone(candidate.applicantPhone)}
                            title="Nusxalash"
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            {copiedPhone === candidate.applicantPhone ? (
                              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">Telefon yo‘q</span>
                      )}
                    </div>

                    <span className="text-gray-400">
                      {candidate.createdAt ? formatUzDate(candidate.createdAt) : ''}
                    </span>
                  </div>

                  {/* Interview Status Box */}
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Suhbat:</span>
                      {hasInterview ? (
                        <span className={`font-medium ${INTERVIEW_STATUS_BADGES[interview.status]?.className || 'text-gray-700'}`}>
                          {INTERVIEW_STATUS_BADGES[interview.status]?.label || interview.status}
                        </span>
                      ) : (
                        <span className="text-gray-400">Belgilanmagan</span>
                      )}
                    </div>

                    {hasInterview && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-600">
                        <span>{interview.scheduledAt ? formatUzDateTime(interview.scheduledAt) : ''}</span>
                        {interview.rating ? (
                          <span className="font-semibold text-amber-600">★ {interview.rating}/5</span>
                        ) : interview.passed === true ? (
                          <span className="font-semibold text-emerald-600">O‘tdi ✓</span>
                        ) : interview.passed === false ? (
                          <span className="font-semibold text-rose-600">O‘tmadi ✗</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setDetailSubmissionId(candidate._id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Nomzod anketasi
                  </button>

                  {hasInterview ? (
                    <button
                      type="button"
                      onClick={() => setDetailInterviewId(interview._id)}
                      className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                      title="Suhbat natijasini ko‘rish"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleInterview(candidate)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      title="Suhbat rejalashtirish"
                    >
                      <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Suhbat
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Content: Table View */}
      {!loading && !error && filteredCandidates.length > 0 && viewMode === 'table' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Nomzod</th>
                  <th className="px-4 py-3.5">Vakansiya</th>
                  <th className="px-4 py-3.5">Telefon</th>
                  <th className="px-4 py-3.5">Ariza holati</th>
                  <th className="px-4 py-3.5">Suhbat</th>
                  <th className="px-4 py-3.5">Sana</th>
                  <th className="px-4 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCandidates.map((c) => {
                  const statusConfig = STATUS_BADGES[c.status] || STATUS_BADGES.pending;
                  const interview = c.interview;

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/80 transition">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                            {c.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.candidateName}</p>
                            <span className="text-xs font-mono text-gray-500">#{c.displayNumber}</span>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-gray-800">
                        {c.vacancyTitle}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-gray-700">
                        {c.applicantPhone ? (
                          <a href={`tel:${c.applicantPhone}`} className="hover:text-blue-600 hover:underline">
                            {c.applicantPhone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        {interview ? (
                          <div>
                            <span className={`font-medium ${INTERVIEW_STATUS_BADGES[interview.status]?.className || 'text-gray-700'}`}>
                              {INTERVIEW_STATUS_BADGES[interview.status]?.label || interview.status}
                            </span>
                            <div className="text-[11px] text-gray-500">
                              {interview.scheduledAt ? formatUzDateTime(interview.scheduledAt) : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Belgilanmagan</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500">
                        {c.createdAt ? formatUzDate(c.createdAt) : '—'}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailSubmissionId(c._id)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Nomzod anketasi"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {interview ? (
                            <button
                              type="button"
                              onClick={() => setDetailInterviewId(interview._id)}
                              className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50"
                              title="Suhbat natijasi"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleInterview(c)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              title="Suhbat belgilash"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCandidates(c._id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Nomzodlikdan chiqarish"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submissionId={detailSubmissionId}
        isOpen={Boolean(detailSubmissionId)}
        onClose={() => setDetailSubmissionId(null)}
        onUpdated={loadData}
      />

      {/* Create Interview Modal */}
      <CreateInterviewModal
        isOpen={Boolean(interviewTargetCandidate)}
        onClose={() => setInterviewTargetCandidate(null)}
        vacancies={vacancies}
        initialSubmission={interviewTargetCandidate}
        onCreated={() => {
          setInterviewTargetCandidate(null);
          loadData();
        }}
      />

      {/* Interview Detail Modal */}
      <InterviewDetailModal
        interviewId={detailInterviewId}
        isOpen={Boolean(detailInterviewId)}
        onClose={() => setDetailInterviewId(null)}
        onUpdated={loadData}
      />
    </div>
  );
};

export default Candidates;
