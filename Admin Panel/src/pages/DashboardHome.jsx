/**
 * Dashboard Home Page Component
 * Main dashboard view with SMS sender + admin info
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import SendFormLinkWidget from '../components/dashboard/SendFormLinkWidget.jsx';
import { formatUzDateWithWeekday } from '../utils/uzDateFormat.js';

const DashboardHome = () => {
  const { admin } = useAuth();

  const fullName = admin?.firstName
    ? `${admin.firstName} ${admin.lastName || ''}`.trim()
    : (admin?.username || 'Admin');

  return (
    <div className="page-shell">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Xush kelibsiz, {fullName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Bugun: {formatUzDateWithWeekday(new Date())}
        </p>
      </motion.div>

      {/* SMS Send Widget — main feature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-6"
      >
        <SendFormLinkWidget />
      </motion.div>

      {/* Bottom info row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin ma'lumotlari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Ism familiya</label>
              <p className="text-lg font-semibold text-gray-900">
                {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Username</label>
              <p className="text-lg font-semibold text-gray-900">@{admin?.username || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Telefon raqam</label>
              <p className="text-lg font-semibold text-gray-900 font-mono">{admin?.phoneNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Admin ID</label>
              <p className="text-sm font-mono text-gray-600 break-all">{admin?._id || '-'}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tezkor amallar</h2>
          <div className="space-y-3">
            <Link
              to="/dashboard/vacancies"
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Vakansiyalar</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/dashboard/admins"
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Adminlar</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;
