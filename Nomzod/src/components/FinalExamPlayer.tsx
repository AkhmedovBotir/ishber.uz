import React, { useState, useEffect, useCallback } from 'react';
import type { FinalExamData, FinalExamCandidateStatus } from '../types';
import {
  getCandidateFinalExam,
  submitCandidateFinalExam,
  getCandidateFinalExamStatus,
} from '../services/api';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  Sparkles,
  FileCheck,
  X
} from 'lucide-react';

interface FinalExamPlayerProps {
  vacancyId: string;
  vacancyTitle: string;
  phone: string;
  candidateName: string;
  onBackToCourse: () => void;
}

export const FinalExamPlayer: React.FC<FinalExamPlayerProps> = ({
  vacancyId,
  vacancyTitle,
  phone,
  candidateName,
  onBackToCourse,
}) => {
  const [examData, setExamData] = useState<FinalExamData | null>(null);
  const [examStatus, setExamStatus] = useState<FinalExamCandidateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [radioAnswers, setRadioAnswers] = useState<Record<string, number>>({});
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<string, number[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [exam, status] = await Promise.all([
        getCandidateFinalExam(vacancyId),
        getCandidateFinalExamStatus(vacancyId, phone),
      ]);
      setExamData(exam);
      setExamStatus(status);

      if (status.hasSubmitted && status.status === 'accepted') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Imtihon ma’lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [vacancyId, phone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleCheckbox = (questionId: string, optionIndex: number) => {
    setCheckboxAnswers((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(optionIndex)) {
        return { ...prev, [questionId]: current.filter((i) => i !== optionIndex) };
      } else {
        return { ...prev, [questionId]: [...current, optionIndex] };
      }
    });
  };

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [unansweredList, setUnansweredList] = useState<number[]>([]);

  const handleOpenSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examData || !examData.questions || examData.questions.length === 0) return;

    const unanswered: number[] = [];
    examData.questions.forEach((q, idx) => {
      if (q.type === 'radio' && radioAnswers[q.id] === undefined) {
        unanswered.push(idx + 1);
      } else if (q.type === 'checkbox' && (!checkboxAnswers[q.id] || checkboxAnswers[q.id].length === 0)) {
        unanswered.push(idx + 1);
      } else if (q.type === 'text' && (!textAnswers[q.id] || !textAnswers[q.id].trim())) {
        unanswered.push(idx + 1);
      }
    });

    setUnansweredList(unanswered);
    setConfirmModalOpen(true);
  };

  const handleExecuteSubmit = async () => {
    if (!examData || !examData.questions) return;

    const payloadAnswers = examData.questions.map((q) => {
      if (q.type === 'radio') {
        return {
          questionId: q.id,
          selectedOption: radioAnswers[q.id],
        };
      } else if (q.type === 'checkbox') {
        return {
          questionId: q.id,
          selectedOptions: checkboxAnswers[q.id] || [],
        };
      } else {
        return {
          questionId: q.id,
          textValue: textAnswers[q.id] || '',
        };
      }
    });

    try {
      setSubmitting(true);
      setError(null);
      await submitCandidateFinalExam(vacancyId, {
        phone,
        candidateName,
        answers: payloadAnswers,
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });

      setConfirmModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Topshirishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setExamStatus(null);
    setRadioAnswers({});
    setCheckboxAnswers({});
    setTextAnswers({});
    setConfirmModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16">
        <div className="h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-600">
          Yakuniy nazorat testi yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToCourse}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Darslarga qaytish</span>
        </button>

        <span className="text-xs font-bold text-gray-500">{vacancyTitle}</span>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* SUBMISSION STATUS CARDS (If Already Submitted) */}
      {examStatus && examStatus.hasSubmitted && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center shadow-xl space-y-6">
          {examStatus.status === 'submitted' && (
            <>
              <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
                <Clock className="h-10 w-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 mb-3">
                  Tekshirilmoqda
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Yakuniy nazorat ishingiz qabul qilindi!
                </h2>
                <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Sizning javoblaringiz (jumladan yozma matnli javoblaringiz) admin va HR mutaxassislarimiz tomonidan ko‘rib chiqilmoqda. Natija tasdiqlangach ushbu sahifada ko‘rinadi.
                </p>
              </div>

              {examStatus.autoScore !== undefined && (
                <div className="inline-block p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
                  Test savollari bo‘yicha avtomatik natijangiz: <span className="font-bold text-blue-600 text-sm">{examStatus.autoScore}%</span>
                </div>
              )}
            </>
          )}

          {examStatus.status === 'accepted' && (
            <>
              <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 mb-3">
                  <Sparkles className="h-3 w-3" /> Muvaffaqiyatli Tasdiqlandi
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Tabriklaymiz, {candidateName}!
                </h2>
                <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto leading-relaxed font-medium">
                  Siz «{vacancyTitle}» vakansiyasi bo‘yicha barcha o‘quv darslari va yakuniy nazorat ishidan muvaffaqiyatli o‘tdingiz!
                </p>
              </div>

              {examStatus.adminNote && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 max-w-lg mx-auto text-left">
                  <span className="font-bold block mb-1">HR / Admin Izohi:</span>
                  <p>{examStatus.adminNote}</p>
                </div>
              )}
            </>
          )}

          {examStatus.status === 'rejected' && (
            <>
              <div className="mx-auto h-20 w-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <AlertTriangle className="h-10 w-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 mb-3">
                  Qabul qilinmadi
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Yakuniy nazorat ishi tasdiqlanmadi
                </h2>
                <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Admin tomonidan javoblaringiz ko‘rib chiqildi va quyidagi sababga ko‘ra rad etildi:
                </p>
              </div>

              {examStatus.adminNote && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 max-w-lg mx-auto text-left">
                  <span className="font-bold block text-rose-950 mb-1">Admin Izohi / Sabab:</span>
                  <p>{examStatus.adminNote}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Qaytadan topshirish</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* EXAM QUESTIONS FORM (If not submitted or retaking) */}
      {(!examStatus || !examStatus.hasSubmitted) && examData && (
        <form onSubmit={handleOpenSubmitModal} className="space-y-6">
          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-purple-100">
                  <FileCheck className="h-3 w-3" /> Yakuniy Imtihon
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {examData.title || 'Yakuniy Nazorat Ishi'}
                </h1>
                <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl">
                  {examData.description || 'Barcha darslar yakunlandi. Malakangizni sinash uchun quyidagi savollarga javob bering.'}
                </p>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {examData.questions && examData.questions.length > 0 ? (
            <div className="space-y-4">
              {examData.questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-900 text-white text-xs font-bold shrink-0">
                      {qIdx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            q.type === 'radio'
                              ? 'bg-blue-50 text-blue-700'
                              : q.type === 'checkbox'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {q.type === 'radio'
                            ? '1 ta to‘g‘ri javob'
                            : q.type === 'checkbox'
                            ? 'Bir nechta to‘g‘ri javob'
                            : 'Ochiq yozma savol'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  {/* Radio Choice List */}
                  {q.type === 'radio' && q.options && (
                    <div className="space-y-2 pl-10">
                      {q.options.map((opt, optIdx) => {
                        const isChecked = radioAnswers[q.id] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                              isChecked
                                ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-2 ring-blue-600/20'
                                : 'border-gray-200 bg-gray-50/50 hover:bg-white text-gray-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`radio_${q.id}`}
                              checked={isChecked}
                              onChange={() => setRadioAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkbox Choice List */}
                  {q.type === 'checkbox' && q.options && (
                    <div className="space-y-2 pl-10">
                      {q.options.map((opt, optIdx) => {
                        const isChecked = (checkboxAnswers[q.id] || []).includes(optIdx);
                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                              isChecked
                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-2 ring-indigo-600/20'
                                : 'border-gray-200 bg-gray-50/50 hover:bg-white text-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheckbox(q.id, optIdx)}
                              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Open-Ended Question Input */}
                  {q.type === 'text' && (
                    <div className="pl-10 space-y-1.5">
                      <textarea
                        rows={4}
                        value={textAnswers[q.id] || ''}
                        onChange={(e) => setTextAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="O‘z fikringiz va to‘liq javobingizni shu yerga yozing..."
                        className="w-full p-3.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 bg-gray-50/40 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/15 outline-none transition"
                      />
                      <p className="text-[11px] text-gray-400">
                        Ushbu yozma javob HR va adminlar tomonidan tekshiriladi.
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Action */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Yakuniy Nazorat Ishini Topshirish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
              Ushbu vakansiya uchun hali yakuniy nazorat savollari kiritilmagan.
            </div>
          )}
        </form>
      )}

      {/* CONFIRMATION MODAL DIALOG */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 space-y-4">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {unansweredList.length > 0 ? (
              <>
                <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Barcha savollarga javob berilmadi
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Siz <strong className="text-amber-700 font-bold">{unansweredList.join(', ')}-savollar</strong>ga javob bermadingiz. Shunda ham yakuniy nazorat ishingizni tekshiruvga yuborishni istaysizmi?
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shadow-xs">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Yakuniy nazorat ishini topshirasizmi?
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Siz barcha <strong>{examData?.questions?.length || 0} ta</strong> savolga javob berdingiz. Javoblaringiz HR va admin tekshiruviga yuboriladi.
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition cursor-pointer"
              >
                {unansweredList.length > 0 ? 'Orqaga qaytish' : 'Bekor qilish'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{unansweredList.length > 0 ? 'Baribir topshirish' : 'Ha, topshirilsin'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
