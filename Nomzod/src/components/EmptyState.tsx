import React, { useState } from 'react';
import type { CandidateProfile } from '../types';
import { Clock, RefreshCw, AlertCircle, PhoneCall } from 'lucide-react';

interface EmptyStateProps {
  profile: CandidateProfile;
  onRefresh: () => Promise<void>;
  onChangePhone: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ profile, onRefresh, onChangePhone }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl p-8 sm:p-12 overflow-hidden relative">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
          {profile.foundApplication ? (
            <Clock className="h-10 w-10 animate-pulse" />
          ) : (
            <AlertCircle className="h-10 w-10" />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {profile.foundApplication
            ? 'Arizangiz ko‘rib chiqilmoqda'
            : 'Nomzodlik topilmadi'}
        </h2>

        <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
          {profile.foundApplication
            ? 'Sizning arizangiz tizimda mavjud, ammo adminlarimiz tomonidan hali nomzodlar o‘quv safiga tasdiqlanmagan. Tasdiqlanishi bilan barcha dars va test materiallari shu yerda paydo bo‘ladi.'
            : 'Ushbu telefon raqami bilan tizimda tasdiqlangan nomzod topilmadi. Iltimos, arizada kiritgan telefon raqamingizni tekshiring.'}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs text-gray-700">
          <span>Kiritilgan raqam:</span>
          <span className="font-bold text-gray-900">{profile.phone}</span>
        </div>

        {/* Steps or Next Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900">HR Ko‘rib chiqishi</p>
              <p className="text-xs text-blue-700 mt-0.5">
                HR mutaxassis arizani tekshirib, sizni nomzod qilib tasdiqlaydi.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900">O‘qish va Sinov</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Tasdiqlangach dars videolari, matnlar va testlar avtomatik ochiladi.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Holatni qayta tekshirish</span>
          </button>

          <button
            type="button"
            onClick={onChangePhone}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition"
          >
            <PhoneCall className="h-4 w-4 text-gray-500" />
            <span>Boshqa raqam kiritish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
