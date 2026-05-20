/**
 * Rasm — bosilganda to‘liq ekran lightbox
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const thumbClass =
  'max-h-72 max-w-full rounded-lg border border-gray-200 bg-white object-contain shadow-sm transition group-hover:border-blue-300 group-hover:shadow-md';

/**
 * @param {{
 *   src: string,
 *   alt?: string,
 *   className?: string,
 *   caption?: import('react').ReactNode,
 * }} props
 */
export default function ClickableImage({ src, alt = '', className = thumbClass, caption }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block max-w-full cursor-zoom-in rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="Rasmni to‘liq ekranda ko‘rish"
      >
        <img src={src} alt={alt} className={className} draggable={false} />
        <span className="mt-1.5 block text-xs text-gray-500 group-hover:text-blue-600">
          Kattalashtirish uchun bosing
        </span>
      </button>
      {caption}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Rasm ko‘rinishi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 sm:p-8"
                onClick={close}
              >
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Yopish"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <motion.img
                  src={src}
                  alt={alt}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[100dvh] max-w-[100vw] object-contain"
                  draggable={false}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
