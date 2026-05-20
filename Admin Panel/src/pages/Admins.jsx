/**
 * Admins Page
 * CRUD interface for managing admin users
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllAdmins } from '../services/adminService.js';
import { useAuth } from '../context/AuthContext.jsx';
import CreateAdminModal from '../components/admins/CreateAdminModal.jsx';
import EditAdminModal from '../components/admins/EditAdminModal.jsx';
import DeleteAdminModal from '../components/admins/DeleteAdminModal.jsx';
import { formatUzDate } from '../utils/uzDateFormat.js';

const Admins = () => {
  const { admin: currentAdmin, updateAdmin: updateCurrentAdmin } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Adminlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => {
      const fullName = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.phoneNumber || '').toLowerCase().includes(q)
      );
    });
  }, [admins, search]);

  const handleCreated = (created) => {
    if (created && created._id) {
      setAdmins((prev) => [created, ...prev]);
    } else {
      loadAdmins();
    }
  };

  const handleUpdated = (updated) => {
    if (!updated || !updated._id) return loadAdmins();
    setAdmins((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    if (currentAdmin && currentAdmin._id === updated._id) {
      updateCurrentAdmin(updated);
    }
  };

  const handleDeleted = (deletedId) => {
    setAdmins((prev) => prev.filter((a) => a._id !== deletedId));
  };

  const getInitials = (a) => {
    const f = (a.firstName || '').charAt(0);
    const l = (a.lastName || '').charAt(0);
    const fallback = (a.username || 'A').charAt(0);
    return ((f + l) || fallback).toUpperCase();
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
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Adminlar</h1>
          <p className="mt-1 text-sm text-gray-600">Tizim adminlarini boshqarish</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi admin
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
            placeholder="Ism, username yoki telefon bo'yicha qidirish..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          Jami: <span className="font-semibold text-gray-900">{filtered.length}</span> ta admin
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-sm text-gray-600">Yuklanmoqda...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Xatolik</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={loadAdmins}
                className="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-gray-900">
              {search ? 'Hech narsa topilmadi' : 'Hozircha adminlar yo\'q'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Boshqa kalit so\'z bilan urinib ko\'ring' : 'Birinchi adminni qo\'shing'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table-scroll-inner w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="th-cell">Admin</th>
                  <th className="th-cell hidden sm:table-cell">Username</th>
                  <th className="th-cell hidden md:table-cell">Telefon</th>
                  <th className="th-cell hidden lg:table-cell">Yaratilgan</th>
                  <th className="th-cell text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => {
                  const isMe = currentAdmin && currentAdmin._id === a._id;
                  return (
                    <tr key={a._id} className="transition-colors hover:bg-gray-50">
                      <td className="td-cell whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(a)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {a.firstName} {a.lastName}
                              </p>
                              {isMe && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                  Siz
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 sm:hidden">@{a.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td-cell hidden whitespace-nowrap sm:table-cell">
                        @{a.username}
                      </td>
                      <td className="td-cell hidden whitespace-nowrap font-mono md:table-cell">
                        {a.phoneNumber || '-'}
                      </td>
                      <td className="td-cell hidden whitespace-nowrap text-gray-500 lg:table-cell">
                        {formatUzDate(a.createdAt)}
                      </td>
                      <td className="td-cell whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setEditTarget(a)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(a)}
                            disabled={isMe}
                            title={isMe ? "O'zingizni o'chira olmaysiz" : "O'chirish"}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
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
        )}
      </motion.div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <EditAdminModal
        isOpen={!!editTarget}
        admin={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdated}
      />
      <DeleteAdminModal
        isOpen={!!deleteTarget}
        admin={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

export default Admins;
