import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  X
} from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary';
}

export interface AlertOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface PromptOptions {
  title?: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalState {
  mode: 'confirm' | 'alert' | 'prompt';
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  onConfirm: (val?: any) => void;
  onCancel?: () => void;
}

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        mode: 'confirm',
        title: options.title || 'Tasdiqlash',
        message: options.message || 'Haqiqatan ham ushbu amalni bajarmoqchimisiz?',
        confirmText: options.confirmText || 'Ha, tasdiqlash',
        cancelText: options.cancelText || 'Bekor qilish',
        type: options.type || 'primary',
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

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        mode: 'alert',
        title: options.title || 'Ma’lumot',
        message: options.message || '',
        confirmText: options.confirmText || 'Tushunarli',
        type: options.type || 'info',
        onConfirm: () => {
          setModalState(null);
          resolve();
        },
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalState({
        mode: 'prompt',
        title: options.title || 'Ma’lumot kiritish',
        message: options.message || '',
        placeholder: options.placeholder || '',
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || 'Saqlash',
        cancelText: options.cancelText || 'Bekor qilish',
        required: options.required || false,
        onConfirm: (val: string) => {
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
      {modalState && <GlobalModalDialog modal={modalState} onClose={closeModal} />}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

const GlobalModalDialog: React.FC<{ modal: ModalState; onClose: () => void }> = ({ modal, onClose }) => {
  const [inputValue, setInputValue] = useState(modal.defaultValue || '');
  const [inputError, setInputError] = useState('');

  const getIcon = () => {
    if (modal.mode === 'prompt') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
          <HelpCircle className="h-6 w-6" />
        </div>
      );
    }
    if (modal.type === 'danger' || modal.type === 'error') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
      );
    }
    if (modal.type === 'warning') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
      );
    }
    if (modal.type === 'success') {
      return (
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      );
    }
    return (
      <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
        <Info className="h-6 w-6" />
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
    return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/20';
  };

  const handlePromptSubmit = (e?: React.FormEvent) => {
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
          onClick={modal.onCancel || (() => modal.onConfirm()) || onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
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
            onClick={modal.mode === 'prompt' ? handlePromptSubmit : () => modal.onConfirm()}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {modal.confirmText || 'Tasdiqlash'}
          </button>
        </div>
      </div>
    </div>
  );
};
