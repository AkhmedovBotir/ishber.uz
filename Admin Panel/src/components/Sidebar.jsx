/**
 * Sidebar — desktop: doimiy; planshet/telefon: hamburger orqali drawer
 */

import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../context/SidebarContext.jsx';

const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Adminlar',
    path: '/dashboard/admins',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Vakansiyalar',
    path: '/dashboard/vacancies',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Nomzod arizalari',
    path: '/dashboard/submissions',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Suhbatlar',
    path: '/dashboard/interviews',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const { isCollapsed, isMobileOpen, isDesktop, closeMobileSidebar } = useSidebar();

  const showLabels = !isDesktop || !isCollapsed;

  return (
    <>
      <AnimatePresence>
        {!isDesktop && isMobileOpen && (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl transition-[transform,width] duration-300 ease-out w-64 max-w-[min(100vw,18rem)]
          ${!isDesktop && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isDesktop && isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        aria-hidden={!isDesktop && !isMobileOpen}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-blue-700/50 ${showLabels ? 'justify-between px-4 sm:px-6' : 'justify-center px-3'}`}>
          {showLabels ? (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">HR Admin</h2>
                <p className="truncate text-xs text-blue-200">Management System</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}

          {!isDesktop && (
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="shrink-0 rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Menyuni yopish"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `group flex items-center rounded-lg py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                } ${showLabels ? 'gap-3 px-4' : 'justify-center px-3'}`
              }
              title={!showLabels ? item.name : undefined}
            >
              <motion.span
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center ${showLabels ? 'gap-3' : ''}`}
              >
                {item.icon}
                {showLabels && <span className="truncate">{item.name}</span>}
              </motion.span>
            </NavLink>
          ))}
        </nav>

        {showLabels && (
          <div className="shrink-0 border-t border-blue-700/50 p-4">
            <motion.div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-blue-200">Version 1.0.0</p>
              <p className="mt-1 text-xs text-blue-300">© 2026 HR Admin</p>
            </motion.div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
