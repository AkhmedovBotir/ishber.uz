import React from 'react';
import type { CandidateProfile, EnrolledVacancy } from '../types';
import { BookOpen, LogOut, Layers, Sparkles, LayoutGrid } from 'lucide-react';

interface NavbarProps {
  profile: CandidateProfile | null;
  selectedVacancy: EnrolledVacancy | null;
  onGoToDashboard: () => void;
  onGoToCertificates: () => void;
  onOpenVacancyModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  selectedVacancy,
  onGoToDashboard,
  onGoToCertificates,
  onOpenVacancyModal,
  onLogout,
}) => {

  const getInitials = (name: string) => {
    if (!name) return 'N';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const vacancies = profile?.vacancies || [];
  const hasMultiple = vacancies.length > 1;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div
            onClick={onGoToDashboard}
            className="flex items-center gap-3 cursor-pointer group"
            title="Bosh sahifaga qaytish"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Ishber LMS
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Sparkles className="h-3 w-3" /> Nomzod Portali
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">Onlayn o‘qitish va malaka oshirish tizimi</p>
            </div>
          </div>

          {/* Center: Vacancy Info / Switcher (if inside a course) */}
          {selectedVacancy && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToDashboard}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition"
                title="Barcha vakansiyalar ro‘yxatiga qaytish"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-gray-500" />
                <span>Barcha vakansiyalar</span>
              </button>

              {hasMultiple && (
                <button
                  type="button"
                  onClick={onOpenVacancyModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 transition text-xs font-medium"
                >
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span className="max-w-[140px] sm:max-w-[200px] truncate">{selectedVacancy.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200/60 text-blue-800 font-bold">
                    {vacancies.length} ta
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Right: Candidate Profile, Certificates & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {profile && (
              <button
                type="button"
                onClick={onGoToCertificates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 transition text-xs font-semibold cursor-pointer shadow-xs"
                title="Mening sertifikatlarim"
              >
                <span className="text-sm">🎓</span>
                <span className="hidden sm:inline">Sertifikatlarim</span>
              </button>
            )}

            {profile && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-xs">
                  {getInitials(profile.fullName || profile.phone)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {profile.fullName || 'Nomzod'}
                  </p>
                  <p className="text-xs font-mono text-gray-500">{profile.phone}</p>
                </div>
              </div>
            )}


            <button
              type="button"
              onClick={onLogout}
              title="Chiqish / Boshqa raqam"
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
