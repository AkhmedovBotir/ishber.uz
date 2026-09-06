import React from 'react';
import type { CandidateProfile, EnrolledVacancy } from '../types';
import { BookOpen, Award, ArrowRight, Sparkles, Building2, MapPin, CheckCircle } from 'lucide-react';

interface VacanciesDashboardProps {
  profile: CandidateProfile;
  onSelectVacancy: (vacancy: EnrolledVacancy) => void;
}

export const VacanciesDashboard: React.FC<VacanciesDashboardProps> = ({ profile, onSelectVacancy }) => {
  const getProgress = (vacancyId: string) => {
    try {
      const saved = localStorage.getItem(`nomzod_completed_${vacancyId}`);
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return Object.values(parsed).filter(Boolean).length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-10 shadow-xl mb-8">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Nomzodlar O‘quv Platformasi</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Assalomu alaykum, {profile.fullName || 'Nomzod'}!
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Siz muvaffaqiyatli tarzda nomzodlar safiga qabul qilindingiz. O‘quv materiallari, video darslar va testlarni o‘rganish uchun quyidagi vakansiyangizni tanlang:
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Siz qabul qilingan vakansiyalar</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Jami {profile.vacancies.length} ta yo‘nalish bo‘yicha o‘quv kursi mavjud
          </p>
        </div>
      </div>

      {/* Vacancies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profile.vacancies.map((vacancy, idx) => {
          const completedCount = getProgress(vacancy.vacancyId);
          const totalCount = vacancy.totalMaterials || 0;
          const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isStarted = completedCount > 0;

          return (
            <div
              key={vacancy.vacancyId || idx}
              className="group relative flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition duration-300">
                    <BookOpen className="h-6 w-6" />
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="h-3.5 w-3.5" /> Qabul qilingan
                  </span>
                </div>

                {/* Title & Department */}
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                  {vacancy.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  {vacancy.department && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span>{vacancy.department}</span>
                    </div>
                  )}
                  {vacancy.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{vacancy.location}</span>
                    </div>
                  )}
                </div>

                {/* Materials Count & Progress */}
                <div className="mt-5 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-blue-500" />
                      {totalCount > 0 ? `${totalCount} ta dars mavzusi` : 'Darslar tayyorlanmoqda'}
                    </span>
                    {totalCount > 0 && (
                      <span className="text-blue-600 font-bold">{progressPct}%</span>
                    )}
                  </div>

                  {totalCount > 0 && (
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onSelectVacancy(vacancy)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
                >
                  <span>{isStarted ? 'Darslarni davom ettirish' : 'O‘quv kursiga kirish'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
