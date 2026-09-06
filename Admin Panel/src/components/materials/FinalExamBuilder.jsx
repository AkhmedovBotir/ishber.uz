import React, { useState, useEffect } from 'react';
import { getFinalExamByVacancy, saveFinalExamForVacancy } from '../../services/finalExamService.js';
import { useModal } from '../../context/ModalContext.jsx';

export default function FinalExamBuilder({ vacancyId, vacancyTitle }) {
  const { alert: showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [title, setTitle] = useState('Yakuniy Nazorat Ishi');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!vacancyId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const data = await getFinalExamByVacancy(vacancyId);
        if (data) {
          setTitle(data.title || 'Yakuniy Nazorat Ishi');
          setDescription(data.description || '');
          setPassingScore(typeof data.passingScore === 'number' ? data.passingScore : 70);
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch (err) {
        setError(err?.message || 'Yakuniy test ma’lumotlarini yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    })();
  }, [vacancyId]);

  const addQuestion = (type = 'radio') => {
    const newQ = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type,
      question: '',
      options: type === 'text' ? [] : ['', ''],
      correctOptionIndex: 0,
      correctOptionIndices: [0],
      explanation: '',
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = (qIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      q.options = [...(q.options || []), ''];
      copy[qIndex] = q;
      return copy;
    });
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const options = [...(q.options || [])];
      options[optIndex] = value;
      q.options = options;
      copy[qIndex] = q;
      return copy;
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      if (q.options.length <= 2) {
        showAlert({
          title: 'Variantlar soni yetarli emas',
          message: 'Kamida 2 ta variant bo‘lishi kerak',
          type: 'warning',
        });
        return prev;
      }
      q.options = q.options.filter((_, i) => i !== optIndex);
      if (q.correctOptionIndex >= q.options.length) {
        q.correctOptionIndex = 0;
      }
      if (Array.isArray(q.correctOptionIndices)) {
        q.correctOptionIndices = q.correctOptionIndices.filter((i) => i !== optIndex).map((i) => (i > optIndex ? i - 1 : i));
        if (q.correctOptionIndices.length === 0) q.correctOptionIndices = [0];
      }
      copy[qIndex] = q;
      return copy;
    });
  };

  const toggleCheckboxCorrect = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      let indices = Array.isArray(q.correctOptionIndices) ? [...q.correctOptionIndices] : [];
      if (indices.includes(optIndex)) {
        if (indices.length === 1) {
          showAlert({
            title: 'Kamida 1 ta to‘g‘ri javob',
            message: 'Kamida 1 ta to‘g‘ri javob tanlangan bo‘lishi kerak',
            type: 'warning',
          });
          return prev;
        }
        indices = indices.filter((i) => i !== optIndex);
      } else {
        indices.push(optIndex);
      }
      q.correctOptionIndices = indices;
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showAlert({
        title: 'Maydon to‘ldirilmagan',
        message: 'Test sarlavhasi kiritilishi shart',
        type: 'warning',
      });
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showAlert({
          title: 'Savol matni kiritilmagan',
          message: `${i + 1}-savol matni kiritilmagan`,
          type: 'warning',
        });
        return;
      }
      if (q.type === 'radio' || q.type === 'checkbox') {
        const cleanOpts = (q.options || []).map((o) => o.trim()).filter(Boolean);
        if (cleanOpts.length < 2) {
          showAlert({
            title: 'Variantlar yetarli emas',
            message: `${i + 1}-savolda kamida 2 ta to‘ldirilgan variant bo‘lishi kerak`,
            type: 'warning',
          });
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await saveFinalExamForVacancy(vacancyId, {
        title: title.trim(),
        description: description.trim(),
        passingScore: Number(passingScore) || 70,
        questions,
      });
      setSuccess('Yakuniy nazorat testi muvaffaqiyatli saqlandi!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-500 font-medium">Test yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              «{vacancyTitle || 'Vakansiya'}» uchun Yakuniy Nazorat Ishi
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Darslarni to‘liq tugatgan nomzodlar ushbu imtihonni topshirishadi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">O‘tish bali (%):</span>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="w-20 rounded-xl border border-gray-300 px-3 py-1.5 text-center text-xs font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Imtihon Sarlavhasi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Yakuniy Nazorat Ishi"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Qo‘shimcha tavsif yoki yo‘riqnoma
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nomzodlar uchun tushuntirish..."
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-gray-900">
            Savollar ro‘yxati ({questions.length} ta)
          </h4>

          {/* Add Question Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addQuestion('radio')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              <span className="font-bold">+</span> 🔘 Radio (1 ta to‘g‘ri)
            </button>
            <button
              type="button"
              onClick={() => addQuestion('checkbox')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <span className="font-bold">+</span> ☑️ Checkbox (Ko‘p to‘g‘ri)
            </button>
            <button
              type="button"
              onClick={() => addQuestion('text')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
            >
              <span className="font-bold">+</span> ✍️ Text (Ochiq yozma)
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm font-semibold text-gray-700">Hozircha savollar kiritilmagan</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Yuqoridagi tugmalar orqali Radio, Checkbox yoki Ochiq yozma savollarni qo‘shing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-bold">
                      {qIdx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        q.type === 'radio'
                          ? 'bg-blue-100 text-blue-800'
                          : q.type === 'checkbox'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {q.type === 'radio'
                        ? '🔘 Radio (Bitta to‘g‘ri variant)'
                        : q.type === 'checkbox'
                        ? '☑️ Checkbox (Bir nechta to‘g‘ri variant)'
                        : '✍️ Text (Ochiq yozma savol)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-gray-400 hover:text-red-600 transition p-1"
                    title="Savolni o‘chirish"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Question Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Savol matni
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                    placeholder="Savol matnini kiriting..."
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* TEXT SAVOL TUSHUNTIRISHI */}
                {q.type === 'text' && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                    <span className="font-bold text-sm">ℹ️</span>
                    <div>
                      <p className="font-semibold">Ochiq yozma savol haqida:</p>
                      <p className="text-purple-700 mt-0.5">
                        Ushbu savol turi uchun to‘g‘ri javob oldindan kiritilmaydi. Nomzod o‘zining batafsil yozma javobini kiritadi va siz «Topshirilgan ishlar» sahifasida uni tekshirib, qabul yoki bekor qilasiz.
                      </p>
                    </div>
                  </div>
                )}

                {/* RADIO VA CHECKBOX VARIANTLARI */}
                {(q.type === 'radio' || q.type === 'checkbox') && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700">
                        Variantlar ({q.type === 'radio' ? 'To‘g‘ri javobni tanlang' : 'Barcha to‘g‘ri javoblarni belgilang'})
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        + Variant qo‘shish
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const isRadioChecked = q.correctOptionIndex === optIdx;
                        const isCheckboxChecked = Array.isArray(q.correctOptionIndices) && q.correctOptionIndices.includes(optIdx);

                        return (
                          <div key={optIdx} className="flex items-center gap-2">
                            {q.type === 'radio' ? (
                              <input
                                type="radio"
                                name={`radio_q_${qIdx}`}
                                checked={isRadioChecked}
                                onChange={() => updateQuestion(qIdx, 'correctOptionIndex', optIdx)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                title="To‘g‘ri javob sifatida belgilash"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isCheckboxChecked}
                                onChange={() => toggleCheckboxCorrect(qIdx, optIdx)}
                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                title="To‘g‘ri javob sifatida belgilash"
                              />
                            )}

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                              placeholder={`Variant #${optIdx + 1}`}
                              className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                            />

                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIdx, optIdx)}
                                className="text-gray-400 hover:text-red-600 transition p-1"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional Explanation */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    To‘g‘ri javob izohi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                    placeholder="Nomzodga to‘g‘ri javob sababini ko‘rsatish..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none bg-gray-50"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saqlanmoqda...</span>
            </>
          ) : (
            <span>Yakuniy Nazorat Testini Saqlash</span>
          )}
        </button>
      </div>
    </form>
  );
}
