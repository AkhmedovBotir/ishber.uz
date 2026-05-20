/**
 * Sidebar Context — desktop collapse + mobile drawer (tablet va kichikroq)
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const DESKTOP_MEDIA = '(min-width: 1024px)';

const SidebarContext = createContext(null);

/**
 * @returns {boolean}
 */
function getIsDesktop() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA);
    const onChange = (e) => {
      setIsDesktop(e.matches);
      if (e.matches) setIsMobileOpen(false);
    };
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isMobileOpen || isDesktop) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileOpen, isDesktop]);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      setIsCollapsed((prev) => !prev);
    } else {
      setIsMobileOpen((prev) => !prev);
    }
  }, [isDesktop]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const value = {
    isCollapsed,
    isMobileOpen,
    isDesktop,
    toggleSidebar,
    closeMobileSidebar,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};
