/**
 * Vacancies Page
 * CRUD interface for managing job vacancies
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllVacancies, getVacancyById, updateVacancy } from '../services/vacancyService.js';
import { getAllApplicationForms } from '../services/applicationFormService.js';
import CreateVacancyModal from '../components/vacancies/CreateVacancyModal.jsx';
import EditVacancyModal from '../components/vacancies/EditVacancyModal.jsx';
import ViewVacancyModal from '../components/vacancies/ViewVacancyModal.jsx';
import DeleteVacancyModal from '../components/vacancies/DeleteVacancyModal.jsx';
import ApplicationFormModal from '../components/applicationForms/ApplicationFormModal.jsx';
import ApplicationFormLinkBlock from '../components/vacancies/ApplicationFormLinkBlock.jsx';
import { formatUzDate } from '../utils/uzDateFormat.js';

const deltaToPlainText = (delta) => {
  if (!delta || !Array.isArray(delta.ops)) return '';
  return delta.ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

const Vacancies = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingIds, setTogglingIds] = useState(() => new Set());
  const [forms, setForms] = useState({});
  const [formModalVacancy, setFormModalVacancy] = useState(null);

  const loadVacancies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllVacancies();
      setVacancies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Vakansiyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async () => {
    try {
      const data = await getAllApplicationForms();
      const map = {};
      if (Array.isArray(data)) {
        data.forEach((f) => {
          if (f && f.vacancyId) map[f.vacancyId] = f;
        });
      }
      setForms(map);
    } catch (err) {
      // Silent — forms are optional, vacancies should still render
      // eslint-disable-next-line no-console
      console.warn("So'rovnomalarni yuklab bo'lmadi:", err?.message);
    }
  };

  useEffect(() => {
    loadVacancies();
    loadForms();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vacancies;
    return vacancies.filter((v) => {
      const skills = (v.skills || []).join(' ').toLowerCase();
      return (
        (v.title || '').toLowerCase().includes(q) ||
        (v.experience || '').toLowerCase().includes(q) ||
        (v.salary || '').toLowerCase().includes(q) ||
        skills.includes(q)
      );
    });
  }, [vacancies, search]);

  const handleCreated = (created) => {
    if (created && created._id) {
      setVacancies((prev) => [created, ...prev]);
    } else {
      loadVacancies();
    }
  };

  const handleUpdated = (updated) => {
    if (!updated || !updated._id) return loadVacancies();
    setVacancies((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
  };

  const handleDeleted = (deletedId) => {
    setVacancies((prev) => prev.filter((v) => v._id !== deletedId));
    // Also drop any form associated with this vacancy
    setForms((prev) => {
      if (!prev[deletedId]) return prev;
      const next = { ...prev };
      delete next[deletedId];
      return next;
    });
  };

  const mergeVacancyFromApi = async (vacancyId) => {
    if (!vacancyId) return;
    try {
      const fresh = await getVacancyById(vacancyId);
      if (fresh?._id) {
        setVacancies((prev) => prev.map((v) => (v._id === fresh._id ? fresh : v)));
      }
    } catch {
      // ignore — list still valid without refreshed URL fields
    }
  };

  const handleFormSaved = (form) => {
    const vacancyId = form?.vacancyId;
    if (form && vacancyId) {
      setForms((prev) => ({ ...prev, [vacancyId]: form }));
    }
    mergeVacancyFromApi(vacancyId || formModalVacancy?._id);
  };

  const handleFormDeleted = () => {
    const vid = formModalVacancy?._id;
    if (vid) {
      setForms((prev) => {
        const next = { ...prev };
        delete next[vid];
        return next;
      });
      mergeVacancyFromApi(vid);
    }
  };

  const handleToggleStatus = async (vacancy) => {
    if (!vacancy?._id) return;
    if (togglingIds.has(vacancy._id)) return;

    const newStatus = !vacancy.isOpen;

    // Mark as toggling + optimistic update
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.add(vacancy._id);
      return next;
    });
    setVacancies((prev) =>
      prev.map((v) => (v._id === vacancy._id ? { ...v, isOpen: newStatus } : v))
    );

    try {
      const updated = await updateVacancy(vacancy._id, { isOpen: newStatus });
      if (updated && updated._id) {
        setVacancies((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
      }
    } catch (err) {
      // Revert on error
      setVacancies((prev) =>
        prev.map((v) => (v._id === vacancy._id ? { ...v, isOpen: !newStatus } : v))
      );
      // eslint-disable-next-line no-alert
      alert(err?.message || 'Statusni yangilab bo\'lmadi');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(vacancy._id);
        return next;
      });
    }
  };

  return (
    <div className="page-shell">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Vakansiyalar</h1>
          <p className="mt-1 text-sm text-gray-600">Ish o'rinlarini boshqarish</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi vakansiya
        </button>
      </motion.div>

      {/* Search & Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nomi, tajriba, ish haqi yoki ko'nikma bo'yicha..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          Jami: <span className="font-semibold text-gray-900">{filtered.length}</span> ta vakansiya
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Xatolik</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={loadVacancies}
              className="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              Qayta urinish
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-20 px-6">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            {search ? 'Hech narsa topilmadi' : "Hozircha vakansiyalar yo'q"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {search ? "Boshqa kalit so'z bilan urinib ko'ring" : "Birinchi vakansiyani qo'shing"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v, idx) => {
            const desc = deltaToPlainText(v.descriptionDelta);
            const isOpen = v.isOpen !== false; // default to open if undefined
            const isToggling = togglingIds.has(v._id);
            const vacancyForm = forms[v._id];
            const hasForm = !!vacancyForm;
            const questionsCount = vacancyForm?.questions?.length || 0;
            const applyLinkActive = v.applicationFormAvailable === true && !!v.applicationFormUrl;
            return (
              <motion.div
                key={v._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className={`relative bg-white rounded-xl shadow-sm border transition-all flex flex-col overflow-hidden ${
                  isOpen
                    ? 'border-gray-200 hover:shadow-md hover:border-blue-200'
                    : 'border-gray-200 hover:shadow-md opacity-90'
                }`}
              >
                {/* Status toggle in top-right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(v);
                  }}
                  disabled={isToggling}
                  title={isOpen ? "Yopish uchun bosing" : "Ochish uchun bosing"}
                  className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                    isOpen
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                >
                  {isToggling ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  )}
                  {isOpen ? 'Ochiq' : 'Yopiq'}
                </button>

                <button
                  type="button"
                  onClick={() => setViewTarget(v)}
                  className="flex-1 text-left px-5 pt-5 pb-3"
                >
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 pr-20">{v.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {v.experience}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {v.minAge}-{v.maxAge}
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {v.salary}
                  </div>

                  {desc && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{desc}</p>
                  )}

                  {Array.isArray(v.skills) && v.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {v.skills.slice(0, 5).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                          {s}
                        </span>
                      ))}
                      {v.skills.length > 5 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          +{v.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Application form button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormModalVacancy(v);
                  }}
                  className={`group mx-5 mb-3 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    hasForm
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      : 'border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasForm ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span className="truncate">
                      {hasForm
                        ? `So'rovnoma: ${questionsCount} ta savol`
                        : "So'rovnoma qo'shish"}
                    </span>
                    {applyLinkActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded uppercase tracking-wide flex-shrink-0">
                        Havola faol
                      </span>
                    )}
                    {hasForm && vacancyForm.status === 'inactive' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 text-gray-600 rounded uppercase tracking-wide flex-shrink-0">
                        Nofaol
                      </span>
                    )}
                  </span>
                  <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <ApplicationFormLinkBlock url={v.applicationFormUrl} variant="card" />

                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500">{formatUzDate(v.createdAt)}</span>
                  <div className="inline-flex items-center gap-1">
                    <Link
                      to={`/dashboard/submissions?vacancyId=${encodeURIComponent(v._id)}`}
                      title="Nomzod arizalari"
                      className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setViewTarget(v)}
                      title="Ko'rish"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditTarget(v)}
                      title="Tahrirlash"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(v)}
                      title="O'chirish"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateVacancyModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <ViewVacancyModal
        isOpen={!!viewTarget}
        vacancy={viewTarget}
        onClose={() => setViewTarget(null)}
      />
      <EditVacancyModal
        isOpen={!!editTarget}
        vacancy={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdated}
      />
      <DeleteVacancyModal
        isOpen={!!deleteTarget}
        vacancy={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
      <ApplicationFormModal
        isOpen={!!formModalVacancy}
        vacancy={formModalVacancy}
        existingForm={formModalVacancy ? forms[formModalVacancy._id] : null}
        onClose={() => setFormModalVacancy(null)}
        onSaved={handleFormSaved}
        onDeleted={handleFormDeleted}
      />
    </div>
  );
};

export default Vacancies;
