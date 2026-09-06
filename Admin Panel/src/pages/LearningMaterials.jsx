/**
 * O'qitish Materiallari (Learning Materials) Sahifasi
 * 3 ta asosiy Tab:
 * 1. O'quv mavzulari (Darslar CRUD)
 * 2. Yakuniy Nazorat Testi (Radio, Checkbox, Text savollar konstruktori)
 * 3. Topshirilgan Ishlar (Nomzodlar topshirgan ishlari va qabul/bekor qilish)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllVacancies } from '../services/vacancyService.js';
import {
  getMaterialsByVacancy,
  deleteMaterial,
  reorderMaterials,
} from '../services/learningMaterialService.js';
import CustomSelect from '../components/common/CustomSelect.jsx';
import CreateMaterialModal from '../components/materials/CreateMaterialModal.jsx';
import EditMaterialModal from '../components/materials/EditMaterialModal.jsx';
import ViewMaterialModal from '../components/materials/ViewMaterialModal.jsx';
import FinalExamBuilder from '../components/materials/FinalExamBuilder.jsx';
import FinalExamSubmissionsList from '../components/materials/FinalExamSubmissionsList.jsx';
import { useModal } from '../context/ModalContext.jsx';

const LearningMaterials = () => {
  const { alert: showAlert, confirm: showConfirm } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramVacancyId = searchParams.get('vacancyId') || '';
  const paramTab = searchParams.get('tab') || 'materials'; // 'materials' | 'exam' | 'submissions'

  const [activeTab, setActiveTab] = useState(paramTab);
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState(paramVacancyId);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMaterialId, setEditMaterialId] = useState(null);
  const [viewMaterialId, setViewMaterialId] = useState(null);

  // Load vacancies on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllVacancies();
        const vacs = Array.isArray(data) ? data : [];
        setVacancies(vacs);
        if (vacs.length > 0 && !selectedVacancyId) {
          const firstId = vacs[0]._id;
          setSelectedVacancyId(firstId);
          setSearchParams({ vacancyId: firstId, tab: activeTab });
        }
      } catch (err) {
        setError(err?.message || 'Vakansiyalarni yuklashda xatolik');
      }
    })();
  }, []);

  const loadMaterials = useCallback(async () => {
    if (!selectedVacancyId) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMaterialsByVacancy(selectedVacancyId);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Materiallarni yuklashda xatolik');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVacancyId]);

  useEffect(() => {
    if (activeTab === 'materials') {
      loadMaterials();
    }
  }, [loadMaterials, activeTab]);

  const handleVacancyChange = (vId) => {
    setSelectedVacancyId(vId);
    setSearchParams({ vacancyId: vId, tab: activeTab });
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ vacancyId: selectedVacancyId, tab: tabKey });
  };

  const vacancyOptions = useMemo(
    () =>
      vacancies.map((v) => ({
        value: v._id,
        label: v.title || v._id,
      })),
    [vacancies]
  );

  const selectedVacancy = useMemo(
    () => vacancies.find((v) => v._id === selectedVacancyId) || null,
    [vacancies, selectedVacancyId]
  );

  // Reorder: Move item up or down
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= materials.length) return;

    const newMaterials = [...materials];
    const [moved] = newMaterials.splice(index, 1);
    newMaterials.splice(targetIndex, 0, moved);

    setMaterials(newMaterials);

    try {
      setReordering(true);
      const orderedIds = newMaterials.map((m) => m._id);
      await reorderMaterials(selectedVacancyId, orderedIds);
    } catch (err) {
      showAlert({
        title: 'Xatolik',
        message: err?.message || 'Tartibni saqlashda xatolik',
        type: 'error',
      });
      loadMaterials();
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async (materialId, materialTitle) => {
    const isConfirmed = await showConfirm({
      title: 'Mavzuni o‘chirish',
      message: `Rostdan ham «${materialTitle}» mavzusini o‘chirmoqchimisiz? Ushbu amalni ortga qaytarib bo‘lmaydi.`,
      confirmText: 'Ha, o‘chirilsin',
      cancelText: 'Bekor qilish',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await deleteMaterial(materialId);
      await loadMaterials();
      showAlert({
        title: 'Muvaffaqiyatli',
        message: 'Mavzu o‘chirildi',
        type: 'success',
      });
    } catch (err) {
      showAlert({
        title: 'Xatolik',
        message: err?.message || 'Mavzuni o‘chirishda xatolik',
        type: 'error',
      });
    }
  };

  // Filtered materials by search
  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => (m.title || '').toLowerCase().includes(q));
  }, [materials, search]);

  return (
    <div className="page-shell">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">O‘qitish va Nazorat Markazi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Darsliklar, yakuniy nazorat testlari va nomzodlar topshirgan ishlarini baholash
          </p>
        </div>

        {activeTab === 'materials' && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            disabled={!selectedVacancyId}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yangi mavzu qo‘shish
          </button>
        )}
      </motion.div>

      {/* Vacancy Selector Bar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Vakansiyani tanlang
          </label>
          <CustomSelect
            options={vacancyOptions}
            value={selectedVacancyId}
            onChange={handleVacancyChange}
            placeholder="Vakansiyani tanlang"
          />
        </div>

        {selectedVacancy && (
          <div className="text-xs text-gray-500 sm:text-right">
            <span>Tanlangan yo‘nalish: </span>
            <span className="font-bold text-gray-900">{selectedVacancy.title}</span>
            {selectedVacancy.department && (
              <span className="block text-gray-400 font-medium">{selectedVacancy.department}</span>
            )}
          </div>
        )}
      </div>

      {/* TAB NAVIGATION */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange('materials')}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <span>📚 O‘quv mavzulari</span>
          {materials.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
              {materials.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('exam')}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition ${
            activeTab === 'exam'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <span>📝 Yakuniy Nazorat Testi</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('submissions')}
          className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <span>📥 Topshirilgan Ishlar (Tekshirish)</span>
        </button>
      </div>

      {/* TAB 1: O'QUV MAVZULARI (MATERIALS CRUD) */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {materials.length > 0 && (
            <div className="mb-4">
              <div className="relative max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mavzular orasidan qidirish..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-gray-500">Mavzular yuklanmoqda...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadMaterials}
                className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Qayta yuklash
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredMaterials.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">
                {materials.length === 0
                  ? 'Ushbu vakansiya uchun hali o‘quv mavzulari qo‘shilmagan'
                  : 'Qidiruvga mos mavzular topilmadi'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                {materials.length === 0
                  ? 'Nomzodlarni o‘qitish uchun darslik matnlari, video va radio test savollari bilan mavzular yarating.'
                  : 'Qidiruv so‘zini o‘zgartiring yoki tozalang.'}
              </p>
              {materials.length === 0 && (
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Birinchi mavzuni qo‘shish
                </button>
              )}
            </div>
          )}

          {/* Materials List */}
          {!loading && !error && filteredMaterials.length > 0 && (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredMaterials.map((m, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === filteredMaterials.length - 1;
                  const hasVideo = m.videoType && m.videoType !== 'none';
                  const imageCount = Array.isArray(m.images) ? m.images.length : 0;
                  const quizCount = Array.isArray(m.quiz) ? m.quiz.length : 0;

                  return (
                    <motion.div
                      key={m._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* Left: Reorder controls + Topic info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0 pt-1 sm:pt-0">
                          <button
                            type="button"
                            disabled={isFirst || reordering}
                            onClick={() => handleMove(idx, 'up')}
                            title="Yuqoriga surish"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-20 transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={isLast || reordering}
                            onClick={() => handleMove(idx, 'down')}
                            title="Pastga surish"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-20 transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-sm text-blue-700">
                          #{idx + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                            {m.title}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            {hasVideo && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Video
                              </span>
                            )}

                            {imageCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {imageCount} ta rasm
                              </span>
                            )}

                            {quizCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                {quizCount} ta test savoli
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">Test yo‘q</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2 shrink-0 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => setViewMaterialId(m._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ko‘rish & Test
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditMaterialId(m._id)}
                          className="rounded-xl border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                          title="Tahrirlash"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(m._id, m.title)}
                          className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50 transition"
                          title="O‘chirish"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: YAKUNIY NAZORAT TESTI KONSTRUKTORI */}
      {activeTab === 'exam' && selectedVacancyId && (
        <FinalExamBuilder
          vacancyId={selectedVacancyId}
          vacancyTitle={selectedVacancy?.title}
        />
      )}

      {/* TAB 3: TOPSHIRILGAN YAKUNIY ISHLAR JURNALI */}
      {activeTab === 'submissions' && (
        <FinalExamSubmissionsList
          vacancyId={selectedVacancyId}
        />
      )}

      {/* Modals */}
      <CreateMaterialModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={loadMaterials}
        vacancies={vacancies}
        initialVacancyId={selectedVacancyId}
      />

      <EditMaterialModal
        materialId={editMaterialId}
        isOpen={!!editMaterialId}
        onClose={() => setEditMaterialId(null)}
        onSaved={loadMaterials}
      />

      <ViewMaterialModal
        materialId={viewMaterialId}
        isOpen={!!viewMaterialId}
        onClose={() => setViewMaterialId(null)}
        onEditRequest={(id) => setEditMaterialId(id)}
      />
    </div>
  );
};

export default LearningMaterials;
