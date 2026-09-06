import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState(null);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const confirm = useCallback((options, extraOptions = {}) => {
    const config = typeof options === 'string'
      ? { message: options, ...extraOptions }
      : (options || {});

    const {
      title = 'Tasdiqlash',
      message = 'Haqiqatan ham bu amalni bajarmoqchimisiz?',
      confirmText = 'Ha, tasdiqlash',
      cancelText = 'Bekor qilish',
      type = 'danger',
    } = config;

    return new Promise((resolve) => {
      setModalState({
        mode: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setModalState(null);
          resolve(true);
        },
        onCancel: () => {
          setModalState(null);
          resolve(false);
        },
      });
    });
  }, []);

  const alert = useCallback((options, extraOptions = {}) => {
    const config = typeof options === 'string'
      ? { message: options, ...extraOptions }
      : (options || {});

    const {
      title = 'Ma’lumot',
      message = '',
      confirmText = 'Tushunarli',
      type = 'info',
    } = config;

    return new Promise((resolve) => {
      setModalState({
        mode: 'alert',
        title,
        message,
        confirmText,
        type,
        onConfirm: () => {
          setModalState(null);
          resolve();
        },
      });
    });
  }, []);


  const prompt = useCallback(({
    title = 'Ma’lumot kiritish',
    message = '',
    placeholder = '',
    defaultValue = '',
    confirmText = 'Saqlash',
    cancelText = 'Bekor qilish',
    required = false,
  }) => {
    return new Promise((resolve) => {
      setModalState({
        mode: 'prompt',
        title,
        message,
        placeholder,
        defaultValue,
        confirmText,
        cancelText,
        required,
        value: defaultValue,
        onConfirm: (val) => {
          setModalState(null);
          resolve(val);
        },
        onCancel: () => {
          setModalState(null);
          resolve(null);
        },
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, alert, prompt, closeModal }}>
      {children}
      {modalState && <GlobalModalContent modal={modalState} onClose={closeModal} />}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

const GlobalModalContent = ({ modal, onClose }) => {
  const [inputValue, setInputValue] = useState(modal.defaultValue || '');
  const [inputError, setInputError] = useState('');

  const getIcon = () => {
    if (modal.mode === 'prompt') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    if (modal.type === 'danger' || modal.type === 'error') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (modal.type === 'warning') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (modal.type === 'success') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const getConfirmButtonClasses = () => {
    if (modal.type === 'danger' || modal.type === 'error') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
    }
    if (modal.type === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
    }
    if (modal.type === 'success') {
      return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';
  };

  const handlePromptSubmit = (e) => {
    e?.preventDefault();
    if (modal.required && !inputValue.trim()) {
      setInputError('Ushbu maydon to‘ldirilishi shart');
      return;
    }
    modal.onConfirm(inputValue);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={modal.onCancel || modal.onConfirm || onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
              {modal.title}
            </h3>
            {modal.message && (
              <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed break-words whitespace-pre-line">
                {modal.message}
              </p>
            )}
          </div>
        </div>

        {/* Prompt Input Form */}
        {modal.mode === 'prompt' && (
          <form onSubmit={handlePromptSubmit} className="pt-2 space-y-2">
            <textarea
              rows={3}
              autoFocus
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder={modal.placeholder || 'Matn kiriting...'}
              className={`w-full p-3 rounded-2xl border text-xs sm:text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 transition ${
                inputError
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/15'
              }`}
            />
            {inputError && (
              <p className="text-xs text-rose-600 font-medium">{inputError}</p>
            )}
          </form>
        )}

        {/* Action Footer */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          {modal.mode !== 'alert' && (
            <button
              type="button"
              onClick={modal.onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition cursor-pointer"
            >
              {modal.cancelText || 'Bekor qilish'}
            </button>
          )}

          <button
            type="button"
            onClick={modal.mode === 'prompt' ? handlePromptSubmit : modal.onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {modal.confirmText || 'Tasdiqlash'}
          </button>
        </div>
      </div>
    </div>
  );
};
