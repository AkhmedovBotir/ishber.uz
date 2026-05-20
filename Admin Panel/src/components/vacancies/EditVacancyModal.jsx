/**
 * Edit Vacancy Modal
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateVacancy } from '../../services/vacancyService.js';
import QuillEditor from '../common/QuillEditor.jsx';
import SkillsInput from '../common/SkillsInput.jsx';

const EMPTY_DELTA = { ops: [{ insert: '\n' }] };

const isDeltaEmpty = (delta) => {
  if (!delta || !Array.isArray(delta.ops)) return true;
  const text = delta.ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('')
    .trim();
  return text.length === 0;
};

const EditVacancyModal = ({ isOpen, onClose, vacancy, onUpdated }) => {
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (vacancy && isOpen) {
      setFormData({
        title: vacancy.title || '',
        experience: vacancy.experience || '',
        minAge: vacancy.minAge ?? 18,
        maxAge: vacancy.maxAge ?? 50,
        salary: vacancy.salary || '',
        isOpen: vacancy.isOpen !== false,
        descriptionDelta: vacancy.descriptionDelta || EMPTY_DELTA,
        responsibilitiesDelta: vacancy.responsibilitiesDelta || EMPTY_DELTA,
        advantagesDelta: vacancy.advantagesDelta || EMPTY_DELTA,
        skills: Array.isArray(vacancy.skills) ? [...vacancy.skills] : [],
      });
      setErrors({});
      setServerError(null);
    }
  }, [vacancy, isOpen]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const num = value === '' ? '' : Number(value);
    setField(name, num);
  };

  const validate = () => {
    if (!formData) return false;
    const next = {};
    if (!formData.title.trim()) next.title = 'Vakansiya nomi kiritilishi shart';
    if (!formData.experience.trim()) next.experience = 'Tajriba kiritilishi shart';
    if (formData.minAge === '' || Number.isNaN(formData.minAge)) next.minAge = "Min yosh shart";
    if (formData.maxAge === '' || Number.isNaN(formData.maxAge)) next.maxAge = "Max yosh shart";
    if (
      typeof formData.minAge === 'number' &&
      typeof formData.maxAge === 'number' &&
      formData.minAge > formData.maxAge
    ) {
      next.maxAge = "Max yosh min yoshdan kichik bo'lishi mumkin emas";
    }
    if (typeof formData.minAge === 'number' && formData.minAge < 14) next.minAge = 'Min yosh 14 dan kam emas';
    if (!formData.salary.trim()) next.salary = 'Ish haqi kiritilishi shart';
    if (isDeltaEmpty(formData.descriptionDelta)) next.descriptionDelta = "Tavsif kiritilishi shart";
    if (isDeltaEmpty(formData.responsibilitiesDelta)) next.responsibilitiesDelta = "Majburiyatlar kiritilishi shart";
    if (isDeltaEmpty(formData.advantagesDelta)) next.advantagesDelta = "Afzalliklar kiritilishi shart";
    if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
      next.skills = "Kamida 1 ta ko'nikma kiriting";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      const updated = await updateVacancy(vacancy._id, {
        title: formData.title.trim(),
        experience: formData.experience.trim(),
        minAge: Number(formData.minAge),
        maxAge: Number(formData.maxAge),
        salary: formData.salary.trim(),
        isOpen: !!formData.isOpen,
        descriptionDelta: formData.descriptionDelta,
        responsibilitiesDelta: formData.responsibilitiesDelta,
        advantagesDelta: formData.advantagesDelta,
        skills: formData.skills,
      });
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setServerError(err?.message || 'Vakansiyani yangilashda xatolik');
    } finally {
      setSubmitting(false);
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vakansiyani tahrirlash</h3>
                <p className="text-sm text-gray-500 mt-0.5">{vacancy.title}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {serverError}
                </div>
              )}

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Holat</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.isOpen ? "Ariza qabul qilinmoqda" : "Vakansiya yopilgan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setField('isOpen', !formData.isOpen)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.isOpen ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={formData.isOpen}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isOpen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vakansiya nomi</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tajriba</label>
                  <input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.experience ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.experience && <p className="mt-1 text-xs text-red-600">{errors.experience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ish haqi</label>
                  <input
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.salary ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.salary && <p className="mt-1 text-xs text-red-600">{errors.salary}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min yosh</label>
                  <input
                    name="minAge"
                    type="number"
                    min="14"
                    value={formData.minAge}
                    onChange={handleNumberChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.minAge ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.minAge && <p className="mt-1 text-xs text-red-600">{errors.minAge}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max yosh</label>
                  <input
                    name="maxAge"
                    type="number"
                    min="14"
                    value={formData.maxAge}
                    onChange={handleNumberChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.maxAge ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.maxAge && <p className="mt-1 text-xs text-red-600">{errors.maxAge}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ko'nikmalar</label>
                <SkillsInput
                  value={formData.skills}
                  onChange={(skills) => setField('skills', skills)}
                  placeholder="JavaScript, React, Git..."
                />
                {errors.skills && <p className="mt-1 text-xs text-red-600">{errors.skills}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
                <QuillEditor
                  key={`desc-${vacancy._id}`}
                  defaultValue={formData.descriptionDelta}
                  onChange={(d) => setField('descriptionDelta', d)}
                />
                {errors.descriptionDelta && <p className="mt-1 text-xs text-red-600">{errors.descriptionDelta}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Majburiyatlar</label>
                <QuillEditor
                  key={`resp-${vacancy._id}`}
                  defaultValue={formData.responsibilitiesDelta}
                  onChange={(d) => setField('responsibilitiesDelta', d)}
                />
                {errors.responsibilitiesDelta && <p className="mt-1 text-xs text-red-600">{errors.responsibilitiesDelta}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Afzalliklar</label>
                <QuillEditor
                  key={`adv-${vacancy._id}`}
                  defaultValue={formData.advantagesDelta}
                  onChange={(d) => setField('advantagesDelta', d)}
                />
                {errors.advantagesDelta && <p className="mt-1 text-xs text-red-600">{errors.advantagesDelta}</p>}
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditVacancyModal;
