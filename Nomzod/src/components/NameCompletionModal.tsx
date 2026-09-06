import React, { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';

interface NameCompletionModalProps {
  onSaveName: (fullName: string) => Promise<void>;
  currentPhone: string;
}

export const NameCompletionModal: React.FC<NameCompletionModalProps> = ({ onSaveName, currentPhone }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Iltimos, ism va familiyangizni to‘liq kiriting');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSaveName(full);
    } catch (err: any) {
      setError(err?.message || 'Ism-familiyani saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-6 text-white text-center">
          <div className="mx-auto h-14 w-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg mb-3">
            <User className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ma’lumotlarni to‘ldirish</h2>
          <p className="mt-1 text-xs text-indigo-100 max-w-xs mx-auto">
            Sizning nomzodlik profilingiz uchun ism va familiyangizni kiriting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
            Telefon: <span className="font-bold text-gray-800">{currentPhone}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Ismingiz
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Masalan: Ali"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Familiyangiz
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Masalan: Valiyev"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Saqlash va O‘qishni Boshlash</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
