import React, { useState, useEffect, useMemo } from 'react';
import type { CourseData } from '../types';
import { resolveMediaUrl } from '../services/api';
import { DeltaRenderer } from '../utils/deltaRenderer';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Search,
  Maximize2,
  X,
  RotateCcw,
  Check,
  Video,
  Menu,
  ArrowLeft,
  PanelLeftClose,
  GraduationCap,
  Lock,
  AlertCircle
} from 'lucide-react';

interface CoursePlayerProps {
  courseData: CourseData;
  candidateName: string;
  onBackToDashboard: () => void;
  onOpenFinalExam: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({
  courseData,
  candidateName,
  onBackToDashboard,
  onOpenFinalExam,
}) => {
  const materials = useMemo(() => {
    return [...(courseData.materials || [])].sort((a, b) => a.order - b.order);
  }, [courseData.materials]);

  const [activeLessonId, setActiveLessonId] = useState<string>(
    materials.length > 0 ? materials[0]._id : ''
  );

  // Offcanvas (Drawer) open state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lesson search
  const [searchTerm, setSearchTerm] = useState('');

  // Warning toast message for locked lessons
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Completed lessons storage in localStorage keyed by vacancyId
  const storageKey = `nomzod_completed_${courseData.vacancy._id}`;
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active quiz answers and submitted status
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Lightbox modal for image zoom
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // Active material
  const activeMaterial = useMemo(() => {
    return materials.find((m) => m._id === activeLessonId) || materials[0] || null;
  }, [materials, activeLessonId]);

  const activeIndex = useMemo(() => {
    return materials.findIndex((m) => m._id === activeLessonId);
  }, [materials, activeLessonId]);

  // Check if a specific lesson index is unlocked
  const isLessonUnlocked = (idx: number) => {
    if (idx <= 0) return true;
    const prevMaterial = materials[idx - 1];
    return Boolean(prevMaterial && completedLessons[prevMaterial._id]);
  };

  // Clear warning after 4s
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Save completed lessons to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedLessons));
    } catch (e) {
      console.error(e);
    }
  }, [completedLessons, storageKey]);

  // Reset quiz when switching active lesson
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLessonId]);

  // Track quiz passed state per lesson
  const quizStorageKey = `nomzod_quiz_passed_${courseData.vacancy._id}`;
  const [quizPassedLessons, setQuizPassedLessons] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(quizStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save quiz passed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(quizStorageKey, JSON.stringify(quizPassedLessons));
    } catch (e) {
      console.error(e);
    }
  }, [quizPassedLessons, quizStorageKey]);

  // Mark lesson completed toggle with quiz validation
  const toggleLessonComplete = (lessonId: string) => {
    const targetMaterial = materials.find((m) => m._id === lessonId);
    if (targetMaterial && targetMaterial.quiz && targetMaterial.quiz.length > 0 && !quizPassedLessons[lessonId]) {
      setWarningMessage("⚠️ Ushbu darsda test mavjud! Avval test savollariga javob bering va tekshiring.");
      return;
    }

    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: !prev[lessonId] };
      if (!prev[lessonId]) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
      return next;
    });
  };

  // Progress stats
  const totalCount = materials.length;
  const completedCount = materials.filter((m) => completedLessons[m._id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  // Safe handler to open final exam only if 100% completed
  const handleOpenFinalExamSafe = () => {
    if (!isAllCompleted) {
      setWarningMessage(`🔒 Yakuniy imtihon qulflangan! Avval barcha darslar (${completedCount}/${totalCount}) va ularning testlarini to‘liq topshiring.`);
      return;
    }
    onOpenFinalExam();
  };


  // Filtered materials for drawer search
  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    const q = searchTerm.toLowerCase();
    return materials.filter((m) => m.title.toLowerCase().includes(q));
  }, [materials, searchTerm]);

  // Handle lesson click with lock check
  const handleSelectLesson = (materialId: string, idx: number) => {
    if (!isLessonUnlocked(idx)) {
      setWarningMessage(`Dars #${idx + 1} qulflangan! Avval oldingi darsni yakunlashingiz kerak.`);
      return;
    }
    setActiveLessonId(materialId);
    setDrawerOpen(false);
    setWarningMessage(null);
  };

  // Next / Previous navigation
  const handlePrevLesson = () => {
    if (activeIndex > 0) {
      setActiveLessonId(materials[activeIndex - 1]._id);
      setWarningMessage(null);
    }
  };

  const handleNextLesson = () => {
    if (activeIndex < materials.length - 1) {
      const nextIdx = activeIndex + 1;
      if (!isLessonUnlocked(nextIdx)) {
        setWarningMessage("Keyingi dars hali qulflangan. Avval ushbu darsni «Tugatildi deb belgilash» tugmasini bosing!");
        return;
      }
      setActiveLessonId(materials[nextIdx]._id);
      setWarningMessage(null);
    }
  };

  // Parse Video URL (YouTube, Vimeo, or direct)
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?autoplay=0&rel=0` : url;
      }
      if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1]?.split('?')[0];
        return v ? `https://www.youtube.com/embed/${v}?autoplay=0&rel=0` : url;
      }
      if (url.includes('vimeo.com/')) {
        const v = url.split('vimeo.com/')[1]?.split('?')[0];
        return v ? `https://player.vimeo.com/video/${v}` : url;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Quiz submission evaluation
  const handleQuizSubmit = () => {
    if (!activeMaterial || !activeMaterial.quiz || activeMaterial.quiz.length === 0) return;

    setQuizSubmitted(true);

    let correctCount = 0;
    activeMaterial.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / activeMaterial.quiz.length) * 100);

    // Save quiz passed state
    setQuizPassedLessons((prev) => ({ ...prev, [activeMaterial._id]: true }));

    if (scorePct >= 60) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setCompletedLessons((prev) => ({ ...prev, [activeMaterial._id]: true }));
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  if (materials.length === 0) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 text-center">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Barcha vakansiyalarga qaytish</span>
        </button>

        <div className="bg-white rounded-3xl border border-gray-200 p-12 shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{courseData.vacancy.title}</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto text-sm">
            Ushbu vakansiya bo‘yicha hozircha o‘quv materiallari tayyorlanmoqda. Tez orada darslar yuklanadi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#f8fafc]">
      {/* SUB-HEADER TOOLBAR (With Responsive Hamburger Button) */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Side: Hamburger Drawer Toggle (Mobile/Responsive only) & Back Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex lg:hidden items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 transition text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              title="Dars mavzulari ro‘yxatini ochish"
            >
              <Menu className="h-4 w-4 text-blue-600" />
              <span>Darslar ({completedCount}/{totalCount})</span>
            </button>

            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition text-xs sm:text-sm font-medium cursor-pointer"
              title="Bosh sahifaga qaytish"
            >
              <ArrowLeft className="h-4 w-4 text-gray-500" />
              <span className="hidden sm:inline">Vakansiyalar</span>
            </button>
          </div>

          {/* Right Side: Course Title & Overall Progress Badge & Final Exam Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleOpenFinalExamSafe}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isAllCompleted
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/25 hover:from-purple-700 hover:to-indigo-700 ring-2 ring-purple-500/20'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200/80 cursor-not-allowed'
              }`}
              title={isAllCompleted ? "Yakuniy imtihonni topshirish" : "Barcha darslar va testlarni tugatgandan so'ng ochiladi"}
            >
              {isAllCompleted ? (
                <GraduationCap className="h-4 w-4 text-purple-200" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span>Yakuniy Imtihon</span>
              {isAllCompleted ? (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] uppercase font-mono">
                  Ochiq
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-500 text-[10px] font-mono">
                  Qulflangan 🔒
                </span>
              )}
            </button>


            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-gray-700">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING WARNING TOAST */}
      {warningMessage && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md border border-slate-700">
            <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        </div>
      )}

      {/* LEFT OFFCANVAS BACKDROP (Mobile/Responsive only) */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
        />
      )}

      {/* TWO-COLUMN LAYOUT: DOCKED SIDEBAR ON DESKTOP, OFF-CANVAS ON MOBILE */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex items-start">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-84 sm:w-96 bg-white border-r border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:static lg:z-10 lg:translate-x-0 lg:w-80 xl:w-96 lg:h-[calc(100vh-8.5rem)] lg:sticky lg:top-32 lg:my-6 lg:ml-4 xl:ml-6 lg:rounded-3xl lg:border lg:border-gray-200/80 lg:shadow-xs lg:shrink-0 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  <BookOpen className="h-3 w-3" /> Kurs Mavzulari
                </span>
                <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                  {courseData.vacancy.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition lg:hidden"
                title="Yopish"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

          {/* Progress Status Bar */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-500" /> Umumiy natijangiz
              </span>
              <span className="text-blue-600 font-bold">{progressPercent}%</span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] text-gray-500 text-right">
              {completedCount} / {totalCount} ta mavzu o‘rganildi
            </p>
          </div>

          {/* Search Input */}
          <div className="mt-3 relative">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dars mavzusini qidirish..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Lessons List Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredMaterials.map((material) => {
            const originalIndex = materials.findIndex((m) => m._id === material._id);
            const isUnlocked = isLessonUnlocked(originalIndex);
            const isActive = material._id === activeLessonId;
            const isCompleted = Boolean(completedLessons[material._id]);
            const hasVideo = material.videoType !== 'none';
            const hasImages = material.images && material.images.length > 0;
            const hasQuiz = material.quiz && material.quiz.length > 0;

            return (
              <div
                key={material._id}
                onClick={() => handleSelectLesson(material._id, originalIndex)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !isUnlocked
                    ? 'opacity-60 bg-gray-50/70 border-gray-200/60 hover:bg-gray-100/50 cursor-not-allowed'
                    : isActive
                    ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 bg-white'
                }`}
              >
                {/* Lock / Checkbox / Completion Icon */}
                {!isUnlocked ? (
                  <div className="mt-0.5 text-gray-400 shrink-0" title="Dars qulflangan">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLessonComplete(material._id);
                    }}
                    className="mt-0.5 text-gray-400 hover:text-emerald-600 transition shrink-0"
                    title={isCompleted ? "Tugatilgan dars" : "Tugatildi deb belgilash"}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="h-4.5 w-4.5" />
                    )}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 text-[11px] text-gray-400 font-mono">
                    <span>Mavzu #{originalIndex + 1}</span>
                    {!isUnlocked ? (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                        Qulflangan 🔒
                      </span>
                    ) : isCompleted ? (
                      <span className="text-emerald-600 font-bold text-[10px]">Tugatildi ✓</span>
                    ) : null}
                  </div>
                  <h4
                    className={`text-xs sm:text-sm font-semibold mt-0.5 line-clamp-2 ${
                      !isUnlocked
                        ? 'text-gray-500'
                        : isActive
                        ? 'text-blue-900 font-bold'
                        : isCompleted
                        ? 'text-gray-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {material.title}
                  </h4>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                    {hasVideo && (
                      <span className="flex items-center gap-0.5 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md font-medium">
                        <Video className="h-3 w-3" /> Video dars
                      </span>
                    )}
                    {hasImages && (
                      <span className="flex items-center gap-0.5 text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md font-medium">
                        <ImageIcon className="h-3 w-3" /> {material.images.length} rasm
                      </span>
                    )}
                    {hasQuiz && (
                      <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                        <HelpCircle className="h-3 w-3" /> Test ({material.quiz.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer with Yakuniy Imtihon Direct CTA */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              handleOpenFinalExamSafe();
            }}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs shadow-md transition ${
              isAllCompleted
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 hover:bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isAllCompleted ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>Yakuniy Nazorat Testi {isAllCompleted ? '' : '(Qulflangan)'}</span>
          </button>


          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Nomzod: {candidateName || 'Nomzod'}</span>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Vakansiyalar
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA: FULL WIDTH BEAUTIFUL IMMERSIVE CLASSROOM */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {activeMaterial && (
          <>
            {/* Top Lesson Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {activeIndex + 1}-Dars
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Jami {materials.length} ta darsdan
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {activeMaterial.title}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLessonComplete(activeMaterial._id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer ${
                    completedLessons[activeMaterial._id]
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {completedLessons[activeMaterial._id] ? 'Tugatildi ✓' : 'Tugatildi deb belgilash'}
                  </span>
                </button>
              </div>

              {/* VIDEO SECTION */}
              {activeMaterial.videoType !== 'none' && (
                <div className="mt-6 rounded-2xl overflow-hidden bg-black shadow-lg border border-gray-800">
                  {activeMaterial.videoType === 'url' && activeMaterial.videoUrl && (
                    <div className="relative aspect-video w-full">
                      <iframe
                        src={getEmbedVideoUrl(activeMaterial.videoUrl)}
                        title={activeMaterial.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    </div>
                  )}

                  {activeMaterial.videoType === 'file' && activeMaterial.videoFile && (
                    <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                      <video
                        src={resolveMediaUrl(activeMaterial.videoFile)}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DELTA LESSON TEXT CONTENT */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Dars Matni va Tavsifi</span>
                </div>

                <DeltaRenderer delta={activeMaterial.descriptionDelta} />
              </div>

              {/* IMAGES GALLERY */}
              {activeMaterial.images && activeMaterial.images.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                    <ImageIcon className="h-4 w-4 text-sky-600" />
                    <span>Mavzuga oid rasmlar ({activeMaterial.images.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeMaterial.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(img)}
                        className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition"
                      >
                        <img
                          src={resolveMediaUrl(img.url)}
                          alt={img.caption || `Rasm ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                          <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        {img.caption && (
                          <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent text-white text-xs truncate">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUIZ / TEST SECTION */}
            {activeMaterial.quiz && activeMaterial.quiz.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Mavzu yuzasidan test</h3>
                      <p className="text-xs text-gray-500">
                        O‘zlashtirishingizni tekshirish uchun {activeMaterial.quiz.length} ta savolga javob bering
                      </p>
                    </div>
                  </div>

                  {quizSubmitted && (
                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Qaytadan topshirish</span>
                    </button>
                  )}
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {activeMaterial.quiz.map((q, qIdx) => {
                    const selectedOpt = quizAnswers[qIdx];
                    const isAnswered = selectedOpt !== undefined;
                    const isCorrect = isAnswered && selectedOpt === q.correctOptionIndex;

                    return (
                      <div
                        key={qIdx}
                        className={`p-5 rounded-2xl border transition-all ${
                          quizSubmitted
                            ? isCorrect
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : 'border-rose-200 bg-rose-50/40'
                            : 'border-gray-200/80 bg-gray-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-bold shrink-0">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-gray-900 pt-1 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        {/* Options Radio List */}
                        <div className="mt-4 space-y-2 pl-10">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            const isTargetCorrect = optIdx === q.correctOptionIndex;

                            let optClasses = 'border-gray-200 bg-white hover:border-gray-300 text-gray-800';
                            if (quizSubmitted) {
                              if (isTargetCorrect) {
                                optClasses = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                              } else if (isSelected && !isTargetCorrect) {
                                optClasses = 'border-rose-500 bg-rose-100/70 text-rose-900 font-medium ring-2 ring-rose-500/20';
                              }
                            } else if (isSelected) {
                              optClasses = 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-2 ring-blue-600/20';
                            }

                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${optClasses}`}
                              >
                                <input
                                  type="radio"
                                  name={`quiz_q_${qIdx}`}
                                  checked={isSelected}
                                  disabled={quizSubmitted}
                                  onChange={() => {
                                    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="flex-1">{opt}</span>
                                {quizSubmitted && isTargetCorrect && (
                                  <span className="text-emerald-700 font-bold text-xs">To‘g‘ri javob ✓</span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {quizSubmitted && q.explanation && (
                          <div className="mt-3.5 pl-10 text-xs text-gray-600 bg-white/70 p-3 rounded-xl border border-gray-200/60">
                            <span className="font-bold text-gray-800">Izoh: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quiz Action */}
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                        <Sparkles className="h-4 w-4" />
                        <span>
                          Natija:{' '}
                          {
                            activeMaterial.quiz.filter(
                              (q, idx) => quizAnswers[idx] === q.correctOptionIndex
                            ).length
                          }{' '}
                          / {activeMaterial.quiz.length} ta to‘g‘ri
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Tabriklaymiz, dars muvaffaqiyatli yakunlandi!
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length === 0}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs shadow-md shadow-amber-500/25 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Testni Tekshirish</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* FINAL EXAM COMPLETION CTA CARD */}
            {isAllCompleted && (
              <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 shadow-xl space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-purple-100">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Barcha darslar yakunlandi!
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                      Yakuniy Nazorat Testini Topshiring
                    </h3>
                    <p className="text-xs sm:text-sm text-purple-100/90 max-w-lg">
                      Siz kurs mavzularini to‘liq o‘rgangansiz. Endi o‘z bilimlaringizni sinash va vakansiyaga qabul qilinish uchun yakuniy test va amaliy savollarga javob bering.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenFinalExam}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-sm shadow-xl transition shrink-0 cursor-pointer"
                  >
                    <GraduationCap className="h-5 w-5 text-purple-700" />
                    <span>Imtihonni Boshlash</span>
                  </button>
                </div>
              </div>
            )}

            {/* BOTTOM NAVIGATION FOOTER */}
            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrevLesson}
                disabled={activeIndex <= 0}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Oldingi dars</span>
              </button>

              <div className="flex items-center gap-2">
                {activeIndex === materials.length - 1 && (
                  <button
                    type="button"
                    onClick={handleOpenFinalExamSafe}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                      isAllCompleted
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isAllCompleted ? (
                      <GraduationCap className="h-4 w-4" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span>Yakuniy Imtihon</span>
                  </button>
                )}


                <button
                  type="button"
                  onClick={handleNextLesson}
                  disabled={activeIndex >= materials.length - 1}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <span>Keyingi dars</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      </div>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <X className="h-7 w-7" />
          </button>
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={resolveMediaUrl(lightboxImage.url)}
              alt={lightboxImage.caption || 'Kattalashtirilgan rasm'}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            {lightboxImage.caption && (
              <p className="mt-3 text-sm text-gray-200 text-center font-medium">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
