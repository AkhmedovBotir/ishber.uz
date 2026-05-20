/**
 * Ariza javoblaridan ismni aniqlash: forma savoli matni (lotin + kirill) va `answers`.
 */

/**
 * Savol "ism" haqida ekanini taxminiy aniqlash (lotin / kirill / inglizcha).
 * @param {string} questionText
 */
export function questionLooksLikeNameField(questionText) {
  if (!questionText || typeof questionText !== 'string') return false;
  const raw = questionText.trim();
  const lower = raw.toLowerCase();
  const n = lower.replace(/[ʼʻ‚'`’]/g, "'");

  // Latin: ismingiz, ism nima?, to'liq ism, FIO, name …
  if (/ismingiz|ismiz|isming\b/.test(n)) return true;
  if (/\bto'liq\s+ism\b|\btoliq\s+ism\b|\btoʻliq\s+ism\b/.test(n)) return true;
  if (/(^|[\s,.:(«"“])ism\b/.test(n)) return true;
  if (/\bfio\b|\bf\.?\s*i\.?\s*o\.?\b/.test(n)) return true;
  if (/\bfull\s*name\b|\bfirst\s*name\b|\blast\s*name\b/.test(n)) return true;
  if (/\byour\s+name\b/.test(n)) return true;
  if (/\bwhat(?:'s|\s+is)\s+your\s+name\b/.test(n)) return true;

  // Kirill: исмингиз, имя, фио, тўлиқ исм …
  if (/исмингиз|исмиз|исминг\b/i.test(raw)) return true;
  if (/тўлиқ\s*исм|тулиқ\s*исм/i.test(raw)) return true;
  if (/имя|фио|ф\.?\s*и\.?\s*о\.?/i.test(raw)) return true;
  if (/(^|[\s,.:(«"„])исм\b/i.test(raw)) return true;

  return false;
}

function stringifyNameAnswer(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const s = value.trim();
    return s;
  }
  return '';
}

/**
 * @param {object} submission — `answers` massiv yoki obyekt
 * @param {Array<{ _id: string, question?: string, order?: number }>} questions — forma `questions`
 * @returns {string}
 */
export function extractNameFromSubmission(submission, questions) {
  if (!submission || typeof submission !== 'object') return '';
  if (!Array.isArray(questions) || questions.length === 0) return '';

  const sorted = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));
  const qById = new Map(sorted.map((q) => [String(q._id), q]));

  const matchAnswer = (questionId, value) => {
    const q = qById.get(String(questionId));
    if (!q || !questionLooksLikeNameField(q.question || '')) return '';
    return stringifyNameAnswer(value);
  };

  const { answers } = submission;
  if (answers == null) return '';

  if (Array.isArray(answers)) {
    for (const row of answers) {
      if (!row || typeof row !== 'object') continue;
      const qid = row.questionId ?? row.question_id;
      const val = row.value ?? row.answer;
      const name = matchAnswer(qid, val);
      if (name) return name;
    }
    return '';
  }

  if (typeof answers === 'object') {
    for (const q of sorted) {
      if (!questionLooksLikeNameField(q.question || '')) continue;
      const name = stringifyNameAnswer(answers[String(q._id)]);
      if (name) return name;
    }
  }

  return '';
}
