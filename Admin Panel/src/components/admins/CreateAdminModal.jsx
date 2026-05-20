/**
 * Create Admin Modal
 * Form for creating a new admin user
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAdmin } from '../../services/adminService.js';

const initialForm = {
  firstName: '',
  lastName: '',
  phoneNumber: '+998',
  username: '',
  password: '',
};

const CreateAdminModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const reset = () => {
    setFormData(initialForm);
    setErrors({});
    setServerError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError(null);
  };

  const validate = () => {
    const next = {};
    if (!formData.firstName.trim()) next.firstName = 'Ism kiritilishi shart';
    if (!formData.lastName.trim()) next.lastName = 'Familiya kiritilishi shart';
    if (!formData.phoneNumber.trim()) {
      next.phoneNumber = 'Telefon raqam kiritilishi shart';
    } else if (!/^\+998\d{9}$/.test(formData.phoneNumber.trim())) {
      next.phoneNumber = "Format: +998XXXXXXXXX (9 ta raqam)";
    }
    if (!formData.username.trim()) {
      next.username = 'Username kiritilishi shart';
    } else if (formData.username.trim().length < 3) {
      next.username = 'Username kamida 3 ta belgi';
    }
    if (!formData.password) {
      next.password = 'Parol kiritilishi shart';
    } else if (formData.password.length < 6) {
      next.password = 'Parol kamida 6 ta belgi';
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
      const created = await createAdmin({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        username: formData.username.trim(),
        password: formData.password,
      });
      reset();
      onCreated?.(created);
      onClose();
    } catch (err) {
      setServerError(err?.message || "Admin yaratishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Yangi admin qo'shish</h3>
                <p className="text-sm text-gray-500 mt-0.5">Tizim uchun yangi admin yarating</p>
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

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Ali"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Valiyev"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="+998901112233"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.username ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="ali_admin"
                />
                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="StrongPass123"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateAdminModal;
