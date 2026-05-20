/**
 * ApplicationFormModal — Manage the application form (so'rovnoma) for a vacancy.
 * Loads existing form (if any), supports create / update / delete.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createApplicationForm,
  updateApplicationForm,
  deleteApplicationForm,
} from '../../services/applicationFormService.js';
import QuestionEditor from './QuestionEditor.jsx';
import { needsOptions } from './questionTypes.js';

const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const makeBlankQuestion = (order = 1) => ({
  _localId: genId(),
  question: '',
  type: 'text',
  required: true,
  options: [],
  placeholder: '',
  order,
});

const buildInitialFormData = (vacancy, existingForm) => {
  if (existingForm) {
    return {
      nom: existingForm.nom || `${vacancy?.title || ''} so'rovnomasi`,
      status: existingForm.status || 'active',
      questions: (existingForm.questions || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((q) => ({
          _localId: q._id || genId(),
          _id: q._id,
          question: q.question || '',
          type: q.type || 'text',
          required: !!q.required,
          options: Array.isArray(q.options) ? q.options : [],
          placeholder: q.placeholder || '',
          order: q.order || 0,
        })),
    };
  }
  return {
    nom: `${vacancy?.title || ''} so'rovnomasi`.trim(),
    status: 'active',
    questions: [makeBlankQuestion(1)],
  };
};

const ApplicationFormModal = ({
  isOpen,
  onClose,
  vacancy,
  existingForm,
  onSaved,
  onDeleted,
}) => {
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && vacancy) {
      setFormData(buildInitialFormData(vacancy, existingForm));
      setErrors({});
      setServerError(null);
      setConfirmDelete(false);
    }
  }, [isOpen, vacancy, existingForm]);

  const isEdit = !!existingForm?._id;
  const busy = saving || deleting;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError(null);
  };

  // ===== Question handlers =====
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, makeBlankQuestion(prev.questions.length + 1)],
    }));
  };

  const updateQuestion = (idx, updated) => {
    setFormData((prev) => {
      const next = prev.questions.slice();
      next[idx] = updated;
      return { ...prev, questions: next };
    });
    setErrors((prev) => {
      if (!prev.questions) return prev;
      const nextQ = prev.questions.slice();
      nextQ[idx] = {};
      return { ...prev, questions: nextQ };
    });
    setServerError(null);
  };

  const removeQuestion = (idx) => {
    setFormData((prev) => {
      const next = prev.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
      return { ...prev, questions: next };
    });
  };

  const moveQuestion = (idx, dir) => {
    setFormData((prev) => {
      const next = prev.questions.slice();
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, questions: next.map((q, i) => ({ ...q, order: i + 1 })) };
    });
  };

  // ===== Validation =====
  const validate = () => {
    if (!formData) return false;
    const next = {};
    if (!formData.nom.trim()) next.nom = "So'rovnoma nomi kiritilishi shart";

    const qErrors = [];
    let hasQErr = false;

    if (!formData.questions.length) {
      next.questionsTop = "Kamida bitta savol qo'shing";
    }

    formData.questions.forEach((q, i) => {
      const e = {};
      if (!q.question.trim()) {
        e.question = 'Savol matni kerak';
      }
      if (needsOptions(q.type)) {
        if (!Array.isArray(q.options) || q.options.length === 0) {
          e.options = "Kamida bitta variant kiriting";
        }
      }
      if (Object.keys(e).length) {
        e._any = true;
        hasQErr = true;
      }
      qErrors.push(e);
    });

    if (hasQErr) next.questions = qErrors;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    return {
      vacancyId: vacancy._id,
      nom: formData.nom.trim(),
      status: formData.status,
      questions: formData.questions.map((q, i) => {
        const cleaned = {
          question: q.question.trim(),
          type: q.type,
          required: !!q.required,
          order: i + 1,
        };
        if (needsOptions(q.type)) {
          cleaned.options = q.options;
        }
        if (q.placeholder && q.placeholder.trim()) {
          cleaned.placeholder = q.placeholder.trim();
        }
        return cleaned;
      }),
    };
  };

  // ===== Save =====
  const handleSave = async () => {
    setServerError(null);
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = buildPayload();
      let result;
      if (isEdit) {
        // update — vacancyId not needed but harmless
        result = await updateApplicationForm(existingForm._id, payload);
      } else {
        result = await createApplicationForm(payload);
      }
      onSaved?.(result);
      onClose();
    } catch (err) {
      setServerError(err?.message || "So'rovnomani saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setDeleting(true);
      setServerError(null);
      await deleteApplicationForm(existingForm._id);
      onDeleted?.(existingForm._id);
      onClose();
    } catch (err) {
      setServerError(err?.message || "O'chirishda xatolik");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && vacancy && formData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEdit ? "So'rovnomani tahrirlash" : "Yangi so'rovnoma"}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{vacancy.title}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={busy}
                className="ml-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-gray-50">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {serverError}
                </div>
              )}

              {/* Form info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">So'rovnoma nomi</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setField('nom', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nom ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="So'rovnoma nomi"
                  />
                  {errors.nom && <p className="mt-1 text-xs text-red-600">{errors.nom}</p>}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Holat</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formData.status === 'active' ? "Aktiv (ariza qabul qilinadi)" : "Nofaol"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setField('status', formData.status === 'active' ? 'inactive' : 'active')}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={formData.status === 'active'}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Savollar <span className="text-gray-400 font-normal">({formData.questions.length})</span>
                  </h4>
                </div>

                {errors.questionsTop && (
                  <p className="mb-2 text-sm text-red-600">{errors.questionsTop}</p>
                )}

                {formData.questions.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Hali savollar yo'q</p>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Birinchi savolni qo'shish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.questions.map((q, idx) => (
                      <QuestionEditor
                        key={q._localId}
                        index={idx}
                        total={formData.questions.length}
                        question={q}
                        errors={errors.questions ? errors.questions[idx] || {} : {}}
                        onChange={(updated) => updateQuestion(idx, updated)}
                        onRemove={() => removeQuestion(idx)}
                        onMoveUp={() => moveQuestion(idx, -1)}
                        onMoveDown={() => moveQuestion(idx, +1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <div>
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      confirmDelete
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'text-red-600 hover:bg-red-50 border border-red-200'
                    }`}
                  >
                    {deleting
                      ? "O'chirilmoqda..."
                      : confirmDelete
                      ? "Ha, o'chirish"
                      : "So'rovnomani o'chirish"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Savol qo'shish
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : "Yaratish"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationFormModal;
