/**
 * Navbar — responsive top bar
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSidebar } from '../context/SidebarContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { admin, logout } = useAuth();
  const { isCollapsed, isMobileOpen, isDesktop, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuOpen = isDesktop ? !isCollapsed : isMobileOpen;

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white shadow-sm transition-[left] duration-300 ${
        isCollapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:max-w-xl">
          <button
            type="button"
            onClick={toggleSidebar}
            className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label={menuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={menuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="relative hidden min-w-0 flex-1 sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Qidirish..."
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 sm:inline-flex"
            aria-label="Bildirishnomalar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 hidden h-2 w-2 rounded-full bg-red-500 ring-2 ring-white sm:block" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 sm:gap-3 sm:p-2"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                {(admin?.firstName?.charAt(0) || admin?.username?.charAt(0) || 'A').toUpperCase()}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[140px] truncate text-sm font-medium text-gray-900 lg:max-w-[200px]">
                  {admin?.firstName
                    ? `${admin.firstName} ${admin.lastName || ''}`.trim()
                    : admin?.username || 'Admin'}
                </p>
                <p className="truncate text-xs text-gray-500">@{admin?.username || 'admin'}</p>
              </div>
              <svg
                className={`hidden h-5 w-5 shrink-0 text-gray-400 transition-transform sm:block ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5"
                  role="menu"
                >
                  <div className="py-1">
                    <div className="border-b border-gray-200 px-4 py-3 md:hidden">
                      <p className="text-sm font-medium text-gray-900">
                        {admin?.firstName
                          ? `${admin.firstName} ${admin.lastName || ''}`.trim()
                          : admin?.username || 'Admin'}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {admin?.phoneNumber || `@${admin?.username || ''}`}
                      </p>
                    </div>

                    <div className="hidden border-b border-gray-200 px-4 py-3 md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {admin?.firstName
                          ? `${admin.firstName} ${admin.lastName || ''}`.trim()
                          : admin?.username || 'Admin'}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {admin?.phoneNumber || `@${admin?.username || ''}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Chiqish
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
