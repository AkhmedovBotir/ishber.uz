/**
 * Nomzod ma'lumotlarini (ism-familiya, telefon, initsiallar)
 * so'rovnoma javoblaridan ajratib olish yordamchisi
 */

/**
 * @param {object} submission
 * @param {object|null} [form]
 * @returns {string}
 */
export function extractCandidateName(submission, form = null) {
  if (!submission) return 'Nomzod';

  const answers = submission.answers || submission.formAnswers || [];
  const formQuestions = form?.questions || [];
  const questionMap = new Map();
  if (Array.isArray(formQuestions)) {
    formQuestions.forEach((q) => {
      if (q && q._id) {
        questionMap.set(String(q._id), q);
      }
    });
  }

  // 1-bosqich: Ism / Familiya kalit so'zlari bo'yicha aniq qidirish
  if (Array.isArray(answers) && answers.length > 0) {
    let firstName = '';
    let lastName = '';
    let fullName = '';

    for (const ans of answers) {
      if (!ans) continue;
      const val = typeof ans.value === 'string' ? ans.value.trim() : (typeof ans === 'string' ? ans.trim() : '');
      if (!val || val.length < 2 || val.length > 80) continue;

      const qId = String(ans.questionId || ans.question_id || ans.question?._id || '');
      const qFromForm = questionMap.get(qId);
      const qText = (
        ans.questionText ||
        ans.question?.question ||
        (typeof ans.question === 'string' ? ans.question : '') ||
        qFromForm?.question ||
        ''
      ).trim();

      if (qText) {
        if (/f\.?i\.?sh|fio|full\s*name|ism\s*va\s*familiya/i.test(qText)) {
          fullName = val;
          break;
        }
        if (/familiya/i.test(qText) && !lastName) {
          lastName = val;
        } else if (/ism/i.test(qText) && !firstName) {
          firstName = val;
        }
      }
    }

    if (fullName) return fullName;
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();

    // 2-bosqich: Agar savol matni orqali topilmasa, matnli birinchi javob
    for (const ans of answers) {
      const val = typeof ans.value === 'string' ? ans.value.trim() : '';
      if (val && !/^\+?\d[\d\s\-()]{7,}$/.test(val) && val.length >= 2 && val.length <= 40 && !val.includes('@') && !val.startsWith('http')) {
        return val;
      }
    }
  }

  // Fallback: Nomzod #1234
  const num = submission.displayNumber || submission.submissionNumber || (submission._id ? String(submission._id).slice(-4) : '');
  return num ? `Nomzod #${num}` : 'Nomzod';
}

/**
 * Nomzod initsiallarini olish (masalan: "Ali Valiyev" -> "AV")
 * @param {string} name
 * @returns {string}
 */
export function getCandidateInitials(name) {
  if (!name || typeof name !== 'string') return 'N';
  const clean = name.replace(/^Nomzod\s*#?/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
