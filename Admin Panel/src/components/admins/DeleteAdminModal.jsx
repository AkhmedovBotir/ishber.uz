/**
 * Delete Admin Modal
 * Confirmation dialog for deleting an admin
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteAdmin } from '../../services/adminService.js';

const DeleteAdminModal = ({ isOpen, onClose, admin, onDeleted }) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleClose = () => {
    if (submitting) return;
    setServerError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!admin) return;
    try {
      setSubmitting(true);
      setServerError(null);
      await deleteAdmin(admin._id);
      onDeleted?.(admin._id);
      onClose();
    } catch (err) {
      setServerError(err?.message || "O'chirishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && admin && (
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
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Adminni o'chirish</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      {admin.firstName} {admin.lastName}
                    </span>{' '}
                    (@{admin.username}) ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                  </p>
                </div>
              </div>

              {serverError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {serverError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAdminModal;
