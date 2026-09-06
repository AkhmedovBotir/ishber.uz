/**
 * EditMaterialModal — Mavjud o'qitish mavzusini tahrirlash modali
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuillEditor from '../common/QuillEditor.jsx';
import { getMaterialById, updateMaterial } from '../../services/learningMaterialService.js';

const EditMaterialModal = ({
  materialId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [descriptionDelta, setDescriptionDelta] = useState(null);

  // Video
  const [videoType, setVideoType] = useState('none');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState('');

  // Images
  const [images, setImages] = useState([]);

  // Quiz questions
  const [quiz, setQuiz] = useState([]);

  const loadData = useCallback(async () => {
    if (!materialId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMaterialById(materialId);
      if (data) {
        setTitle(data.title || '');
        setDescriptionDelta(data.descriptionDelta || { ops: [] });
        setVideoType(data.videoType || 'none');
        setVideoUrl(data.videoUrl || '');
        setVideoFile(data.videoFile || '');
        setImages(Array.isArray(data.images) ? data.images : []);
        setQuiz(Array.isArray(data.quiz) ? data.quiz : []);
      }
    } catch (err) {
      setError(err?.message || "Mavzu ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [materialId, isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Image Upload
  const handleAddImageFile = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [
          ...prev,
          {
            id: String(Date.now() + Math.random()),
            url: ev.target.result,
            caption: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imgId) => {
    setImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleImageCaptionChange = (imgId, caption) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imgId ? { ...img, caption } : img))
    );
  };

  // Handle Video File
  const handleVideoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setVideoFile(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quiz Helpers
  const handleAddQuestion = () => {
    setQuiz((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        question: '',
        options: ['', ''],
        correctOptionIndex: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    setQuiz((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (qIndex, text) => {
    setQuiz((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], question: text };
      return next;
    });
  };

  const handleAddOption = (qIndex) => {
    setQuiz((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      next[qIndex] = { ...q, options: [...q.options, ''] };
      return next;
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setQuiz((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (q.options.length <= 2) return prev;
      const newOptions = q.options.filter((_, idx) => idx !== optIndex);
      let newCorrect = q.correctOptionIndex;
      if (newCorrect >= newOptions.length) newCorrect = newOptions.length - 1;
      next[qIndex] = { ...q, options: newOptions, correctOptionIndex: newCorrect };
      return next;
    });
  };

  const handleOptionTextChange = (qIndex, optIndex, text) => {
    setQuiz((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      const newOptions = [...q.options];
      newOptions[optIndex] = text;
      next[qIndex] = { ...q, options: newOptions };
      return next;
    });
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    setQuiz((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], correctOptionIndex: optIndex };
      return next;
    });
  };

  const handleExplanationChange = (qIndex, text) => {
    setQuiz((prev) => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], explanation: text };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError("Mavzu nomini kiriting");
      return;
    }

    // Validate quiz questions
    for (let i = 0; i < quiz.length; i++) {
      const q = quiz[i];
      if (!q.question.trim()) {
        setError(`${i + 1}-test savolining matnini kiriting`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`${i + 1}-test savolining ${j + 1}-variantini to'ldiring`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        descriptionDelta,
        videoType,
        videoUrl: videoType === 'url' ? videoUrl.trim() : '',
        videoFile: videoType === 'file' ? videoFile : '',
        images: images.map((img) => ({ url: img.url, caption: img.caption || '' })),
        quiz: quiz.map((q) => ({
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
          explanation: (q.explanation || '').trim(),
        })),
      };

      await updateMaterial(materialId, payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.message || "O'zgarishlarni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] overflow-y-auto"
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
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mavzuni Tahrirlash</h3>
                <p className="text-xs text-gray-500">Mavzu mazmuni, video, rasmlar va test savollarini o‘zgartirish</p>
              </div>
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-3 text-xs text-gray-500">Mavzu ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Mavzu Nomi *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Mavzu nomi"
                      className="w-full rounded-xl border border-gray-300 py-2.5 px-3.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Quill Delta */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Mavzu Matni / Darslik Tavsifi (Delta Format)
                    </label>
                    {descriptionDelta !== null && (
                      <QuillEditor
                        defaultValue={descriptionDelta}
                        onChange={(delta) => setDescriptionDelta(delta)}
                        placeholder="Mavzu mazmuni, dars matni..."
                        minHeight="220px"
                      />
                    )}
                  </div>

                  {/* Video Section */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                      Darslik Videosi
                    </label>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="editVideoType"
                          checked={videoType === 'none'}
                          onChange={() => setVideoType('none')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Video yo‘q
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="editVideoType"
                          checked={videoType === 'url'}
                          onChange={() => setVideoType('url')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Video Havolasi (URL)
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="editVideoType"
                          checked={videoType === 'file'}
                          onChange={() => setVideoType('file')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Video Fayl
                      </label>
                    </div>

                    {videoType === 'url' && (
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full rounded-xl border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
                      />
                    )}

                    {videoType === 'file' && (
                      <div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {videoFile && (
                          <p className="mt-1 text-xs text-emerald-600 font-medium">Video fayl yuklangan ✓</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Images Section */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Rasmlar Galereyasi
                      </label>
                      <label className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Rasm qo‘shish
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAddImageFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mt-3">
                        {images.map((img) => (
                          <div key={img.id || img.url} className="relative group rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                            <img
                              src={img.url}
                              alt="preview"
                              className="h-28 w-full object-cover rounded-lg"
                            />
                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={(e) => handleImageCaptionChange(img.id, e.target.value)}
                              placeholder="Izoh"
                              className="mt-1.5 w-full text-[11px] rounded border border-gray-200 px-1.5 py-1 text-gray-700 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="absolute top-3 right-3 rounded-full bg-red-600 p-1 text-white opacity-90 shadow hover:opacity-100"
                              title="O‘chirish"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Rasmlar yo‘q</p>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                          Mavzu Yuzasidan Test Savollari (Radio format)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        + Test savoli qo‘shish
                      </button>
                    </div>

                    {quiz.length > 0 ? (
                      <div className="space-y-4 mt-3">
                        {quiz.map((q, qIndex) => (
                          <div
                            key={q.id || qIndex}
                            className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {qIndex + 1}
                              </span>
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                                placeholder="Savol matnini kiriting..."
                                className="flex-1 rounded-lg border border-gray-300 py-1.5 px-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIndex)}
                                title="Savolni o‘chirish"
                                className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            {/* Options */}
                            <div className="pl-8 space-y-2">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`edit_correct_option_${qIndex}`}
                                    checked={q.correctOptionIndex === optIndex}
                                    onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-gray-400 w-4">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                                    className={`flex-1 rounded-lg border py-1.5 px-2.5 text-xs text-gray-900 focus:outline-none ${
                                      q.correctOptionIndex === optIndex
                                        ? 'border-emerald-400 bg-emerald-50/50 font-medium'
                                        : 'border-gray-200 bg-gray-50/60'
                                    }`}
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(qIndex, optIndex)}
                                      className="text-gray-400 hover:text-red-600 text-xs px-1"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(qIndex)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  + Variant qo‘shish
                                </button>
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  To‘g‘ri javob: {String.fromCharCode(65 + q.correctOptionIndex)} varianti ✓
                                </span>
                              </div>

                              <div className="pt-2">
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                                  placeholder="Tushuntirish (ixtiyoriy)"
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 px-2.5 text-xs text-gray-600 focus:bg-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-400 italic py-2">Test savollari yo‘q</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/90 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saqlanmoqda...
                  </>
                ) : (
                  'O‘zgarishlarni saqlash'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditMaterialModal;
