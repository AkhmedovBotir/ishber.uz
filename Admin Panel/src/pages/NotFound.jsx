/**
 * 404 Not Found Page Component
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Sahifa topilmadi</h2>
          <p className="mt-4 text-lg text-gray-600">
            Kechirasiz, siz qidirayotgan sahifa mavjud emas.
          </p>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Asosiy sahifaga qaytish
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;

