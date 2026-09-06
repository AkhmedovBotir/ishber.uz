import React from 'react';
import type { EnrolledVacancy } from '../types';
import { Layers, X, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

interface VacancySwitcherModalProps {
  vacancies: EnrolledVacancy[];
  activeVacancyId: string;
  onSelect: (vacancy: EnrolledVacancy) => void;
  onClose: () => void;
}

export const VacancySwitcherModal: React.FC<VacancySwitcherModalProps> = ({
  vacancies,
  activeVacancyId,
  onSelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Siz qabul qilingan vakansiyalar</h3>
              <p className="text-xs text-gray-500">O‘rganmoqchi bo‘lgan o‘quv kursingizni tanlang</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of Vacancies */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {vacancies.map((v) => {
            const isActive = v.vacancyId === activeVacancyId;
            return (
              <div
                key={v.vacancyId}
                onClick={() => {
                  onSelect(v);
                  onClose();
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-gray-900">{v.title}</h4>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        <CheckCircle2 className="h-3 w-3" /> Hozirgi kurs
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {v.department && (
                      <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                        {v.department}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      {v.totalMaterials > 0 ? `${v.totalMaterials} ta dars mavzusi` : 'Darslar tez kunda'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <span>Tanlash</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
