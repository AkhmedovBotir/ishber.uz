/**
 * ViewMaterialModal — O'quv mavzusini to'liq ko'rish va interaktiv testni sinash modali
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuillEditor from '../common/QuillEditor.jsx';
import { getMaterialById } from '../../services/learningMaterialService.js';

function renderVideoEmbed(videoType, videoUrl, videoFile) {
  if (videoType === 'file' && videoFile) {
    return (
      <div className="overflow-hidden rounded-xl bg-black shadow-md">
        <video src={videoFile} controls className="w-full max-h-[380px]" />
      </div>
    );
  }

  if (videoType === 'url' && videoUrl) {
    // YouTube detection
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md">
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title="Video player"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Vimeo detection
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            title="Vimeo player"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Generic HTML5 video url (mp4, etc.)
    return (
      <div className="overflow-hidden rounded-xl bg-black shadow-md">
        <video src={videoUrl} controls className="w-full max-h-[380px]" />
      </div>
    );
  }

  return null;
}

const ViewMaterialModal = ({
  materialId,
  isOpen,
  onClose,
  onEditRequest,
}) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interactive Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIndex]: optIndex }
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Active zoomed image
  const [activeImageZoom, setActiveImageZoom] = useState(null);

  useEffect(() => {
    if (!materialId || !isOpen) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedAnswers({});
        setQuizSubmitted(false);
        const data = await getMaterialById(materialId);
        setMaterial(data);
      } catch (err) {
        setError(err?.message || 'Material ma’lumotlari yuklanmadi');
      } finally {
        setLoading(false);
      }
    })();
  }, [materialId, isOpen]);

  const handleSelectQuizAnswer = (qIndex, optIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const calculateScore = () => {
    if (!material?.quiz || material.quiz.length === 0) return 0;
    let correctCount = 0;
    material.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const videoElement = material
    ? renderVideoEmbed(material.videoType, material.videoUrl, material.videoFile)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="my-8 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                    {material ? `${material.order + 1}-Mavzu` : 'Mavzu'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    ID: {material?._id?.slice(-6) || ''}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-gray-900 line-clamp-1">
                  {material?.title || 'Mavzu ko‘rinishi'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {onEditRequest && material && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditRequest(material._id);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Tahrirlash
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-3 text-xs text-gray-500">Mavzu yuklanmoqda...</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {!loading && material && (
                <>
                  {/* Video Player */}
                  {videoElement && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Mavzu Videosi
                      </h4>
                      {videoElement}
                    </div>
                  )}

                  {/* Text Description (Delta format rendered) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Darslik Matni
                    </h4>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <QuillEditor
                        defaultValue={material.descriptionDelta}
                        readOnly={true}
                        minHeight="140px"
                      />
                    </div>
                  </div>

                  {/* Images Gallery */}
                  {Array.isArray(material.images) && material.images.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Rasmlar ({material.images.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {material.images.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            onClick={() => setActiveImageZoom(img.url)}
                            className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <img
                              src={img.url}
                              alt={img.caption || `Rasm ${idx + 1}`}
                              className="h-32 w-full object-cover transition group-hover:scale-105"
                            />
                            {img.caption && (
                              <p className="p-2 text-center text-[11px] text-gray-600 truncate font-medium">
                                {img.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quiz / Test Section */}
                  {Array.isArray(material.quiz) && material.quiz.length > 0 && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-indigo-950">
                            Mavzu bo‘yicha bilimni sinash ({material.quiz.length} ta savol)
                          </h4>
                          <p className="text-xs text-gray-500">
                            Har bir savol uchun bitta to‘g‘ri javobni tanlang va «Tekshirish» tugmasini bosing
                          </p>
                        </div>

                        {quizSubmitted && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                              Natija: {calculateScore()} / {material.quiz.length}
                            </span>
                            <button
                              type="button"
                              onClick={handleQuizReset}
                              className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                            >
                              Qayta yechish
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {material.quiz.map((q, qIndex) => {
                          const userChoice = selectedAnswers[qIndex];
                          const hasAnswered = userChoice !== undefined;
                          const isCorrect = userChoice === q.correctOptionIndex;

                          return (
                            <div
                              key={q.id || qIndex}
                              className={`rounded-xl border p-4 transition ${
                                quizSubmitted
                                  ? isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/40'
                                    : 'border-rose-300 bg-rose-50/40'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                  {qIndex + 1}
                                </span>
                                <p className="text-sm font-semibold text-gray-900 pt-0.5">
                                  {q.question}
                                </p>
                              </div>

                              <div className="mt-3 pl-8 space-y-2">
                                {q.options.map((opt, optIndex) => {
                                  const isSelected = userChoice === optIndex;
                                  const isRightAnswer = q.correctOptionIndex === optIndex;

                                  let optClass = 'border-gray-200 hover:bg-gray-50 bg-white text-gray-700';
                                  if (isSelected && !quizSubmitted) {
                                    optClass = 'border-indigo-500 bg-indigo-50 text-indigo-900 font-medium';
                                  } else if (quizSubmitted) {
                                    if (isRightAnswer) {
                                      optClass = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 font-bold';
                                    } else if (isSelected && !isRightAnswer) {
                                      optClass = 'border-rose-400 bg-rose-100/70 text-rose-900 line-through';
                                    }
                                  }

                                  return (
                                    <label
                                      key={optIndex}
                                      onClick={() => handleSelectQuizAnswer(qIndex, optIndex)}
                                      className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs transition cursor-pointer ${optClass}`}
                                    >
                                      <input
                                        type="radio"
                                        name={`quiz_view_${qIndex}`}
                                        checked={isSelected}
                                        disabled={quizSubmitted}
                                        onChange={() => handleSelectQuizAnswer(qIndex, optIndex)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span className="font-bold text-gray-400">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <span className="flex-1">{opt}</span>
                                      {quizSubmitted && isRightAnswer && (
                                        <span className="text-xs font-bold text-emerald-700">✓ To‘g‘ri</span>
                                      )}
                                      {quizSubmitted && isSelected && !isRightAnswer && (
                                        <span className="text-xs font-bold text-rose-700">✗ Noto‘g‘ri</span>
                                      )}
                                    </label>
                                  );
                                })}

                                {quizSubmitted && q.explanation && (
                                  <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                                    <span className="font-bold">Tushuntirish: </span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!quizSubmitted && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(selectedAnswers).length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
                          >
                            Natijalarni tekshirish
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end border-t border-gray-100 bg-gray-50/90 px-6 py-3.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Yopish
              </button>
            </div>
          </motion.div>

          {/* Full Image Zoom Modal */}
          {activeImageZoom && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
              onClick={() => setActiveImageZoom(null)}
            >
              <div className="relative max-w-3xl max-h-[90vh]">
                <img
                  src={activeImageZoom}
                  alt="Zoom"
                  className="max-h-[85vh] w-auto rounded-xl shadow-2xl object-contain"
                />
                <button
                  type="button"
                  onClick={() => setActiveImageZoom(null)}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewMaterialModal;
