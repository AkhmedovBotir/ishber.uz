import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';

interface PhoneAuthModalProps {
  onCheckPhone: (phone: string) => Promise<void>;
  initialPhone?: string;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({ onCheckPhone, initialPhone = '' }) => {
  const [phone, setPhone] = useState(initialPhone || '+998 ');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format phone number into +998 (XX) XXX-XX-XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (!raw.startsWith('+998')) {
      raw = '+998 ' + raw.replace(/\D/g, '');
    }

    // Extract digits after +998
    const digits = raw.replace(/\D/g, '').slice(3); // skip 998
    let formatted = '+998';

    if (digits.length > 0) {
      formatted += ' (' + digits.slice(0, 2);
    }
    if (digits.length >= 2) {
      formatted += ') ' + digits.slice(2, 5);
    }
    if (digits.length >= 5) {
      formatted += '-' + digits.slice(5, 7);
    }
    if (digits.length >= 7) {
      formatted += '-' + digits.slice(7, 9);
    }

    setPhone(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 12) {
      setError('Iltimos, to‘liq telefon raqamingizni kiriting (+998 XX XXX-XX-XX)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onCheckPhone(phone);
    } catch (err: any) {
      setError(err?.message || 'Nomzodlikni tekshirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Top Header Decor */}
        <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="mx-auto h-16 w-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg mb-4">
            <Phone className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Nomzodlar Portaliga Kirish</h2>
          <p className="mt-2 text-sm text-blue-100/90 max-w-xs mx-auto">
            O‘quv materiallariga kirish uchun arizada ko‘rsatgan telefon raqamingizni kiriting
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <span className="font-bold">•</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Telefon Raqamingiz
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone className="h-5 w-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 (90) 123-45-67"
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 font-mono text-base text-gray-900 bg-gray-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 outline-none transition shadow-xs"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Admin panelda nomzod sifatida tasdiqlangan telefon raqam kiritilishi kerak
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <span>Kirish va Tekshirish</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
