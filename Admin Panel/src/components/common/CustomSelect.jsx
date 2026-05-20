/**
 * CustomSelect — styled dropdown with optional grouped options.
 * Renders the dropdown via React portal so it's never clipped by parent overflow.
 * Auto-flips above the trigger if there's not enough space below.
 *
 * Props:
 *  - value: current selected value
 *  - onChange(value)
 *  - options: array of { value, label, group? }
 *  - placeholder: shown when no value
 *  - disabled: boolean
 *  - className: extra class on the trigger button
 *  - error: boolean (red border)
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const DROPDOWN_MAX_HEIGHT = 288; // px (matches Tailwind max-h-72)

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Tanlang',
  disabled = false,
  className = '',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const groups = useMemo(() => {
    const map = {};
    const order = [];
    options.forEach((opt) => {
      const g = opt.group || '';
      if (!(g in map)) {
        map[g] = [];
        order.push(g);
      }
      map[g].push(opt);
    });
    return order.map((g) => ({ name: g, items: map[g] }));
  }, [options]);

  const selected = options.find((o) => o.value === value);
  const hasGroups = groups.length > 1 || (groups.length === 1 && groups[0].name !== '');

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < Math.min(DROPDOWN_MAX_HEIGHT, 200) && spaceAbove > spaceBelow;

    setPosition({
      top: openUp
        ? Math.max(8, rect.top - Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove) - 4)
        : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
      maxHeight: openUp ? Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove) : Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow),
    });
  };

  // Reposition while open
  useEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Outside click + Esc
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleMouseDown = (e) => {
      if (
        triggerRef.current && triggerRef.current.contains(e.target)
      ) return;
      if (
        panelRef.current && panelRef.current.contains(e.target)
      ) return;
      setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
          error ? 'border-red-300' : isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        } ${className}`}
      >
        <span className={`truncate text-left ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight || DROPDOWN_MAX_HEIGHT,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1"
          >
            {hasGroups
              ? groups.map((g) => (
                  <div key={g.name || '_'}>
                    {g.name && (
                      <div className="sticky top-0 px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        {g.name}
                      </div>
                    )}
                    {g.items.map((opt) => {
                      const active = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {active && (
                            <svg className="w-4 h-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              : options.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {active && (
                        <svg className="w-4 h-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
          </div>,
          document.body
        )}
    </>
  );
};

export default CustomSelect;
