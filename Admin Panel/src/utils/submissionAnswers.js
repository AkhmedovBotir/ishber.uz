/**
 * Ariza javoblarini tahrirlash uchun parse / payload
 */

/** @param {unknown} id */
export function normalizeId(id) {
  if (id == null || id === '') return null;
  if (typeof id === 'string') {
    const s = id.trim();
    return s || null;
  }
  if (typeof id === 'object') {
    const o = id;
    if (typeof o.$oid === 'string') return o.$oid;
    if (o._id != null) return normalizeId(o._id);
    if (typeof o.toString === 'function') {
      const s = o.toString();
      if (/^[a-f0-9]{24}$/i.test(s)) return s;
    }
  }
  const s = String(id);
  return s === '[object Object]' ? null : s;
}

/** @param {unknown} row */
export function unwrapAnswerValue(row) {
  if (row == null) return row;
  if (typeof row !== 'object' || Array.isArray(row)) return row;
  if ('value' in row) return row.value;
  if ('answer' in row) return row.answer;
  if ('response' in row) return row.response;
  if ('text' in row) return row.text;
  return row;
}

/**
 * @param {object} row
 * @param {Array<object>} sortedQuestions
 * @param {number} index
 */
function resolveQuestionIdFromRow(row, sortedQuestions, index) {
  let qid =
    normalizeId(row.questionId) ??
    normalizeId(row.question_id) ??
    normalizeId(row.question?._id);

  if (!qid && typeof row.question === 'string') {
    const text = row.question.trim();
    const match = sortedQuestions.find((q) => (q.question || '').trim() === text);
    if (match?._id) qid = normalizeId(match._id);
  }

  if (!qid && typeof row.questionText === 'string') {
    const text = row.questionText.trim();
    const match = sortedQuestions.find((q) => (q.question || '').trim() === text);
    if (match?._id) qid = normalizeId(match._id);
  }

  if (!qid && sortedQuestions[index]?._id) {
    qid = normalizeId(sortedQuestions[index]._id);
  }

  return qid;
}

/** @param {unknown[]} answers */
function extractOrderedAnswerValues(answers) {
  return answers.map((row) => {
    if (row != null && typeof row === 'object' && !Array.isArray(row)) {
      return unwrapAnswerValue(row);
    }
    return row;
  });
}

/**
 * Javoblar eski questionId bilan saqlangan bo‘lsa, joriy forma savollariga tartib bo‘yicha biriktirish.
 * @param {Record<string, unknown>} map
 * @param {Array<object>} sorted
 * @param {unknown[]} orderedValues
 */
function reconcileValueMapWithForm(map, sorted, orderedValues) {
  if (!sorted.length || !orderedValues.length) return map;

  const idSet = new Set(sorted.map((q) => normalizeId(q._id)).filter(Boolean));
  const mapKeys = Object.keys(map).map((k) => normalizeId(k)).filter(Boolean);
  const hasOverlap = idSet.size > 0 && mapKeys.some((k) => idSet.has(k));

  const matchedCount = sorted.filter((q) => {
    const id = normalizeId(q._id);
    return id && !isEmptyAnswer(map[id]);
  }).length;

  if (matchedCount === sorted.length) return map;

  if (!hasOverlap || matchedCount === 0) {
    const next = {};
    sorted.forEach((q, i) => {
      const id = normalizeId(q._id);
      if (id && orderedValues[i] !== undefined) next[id] = orderedValues[i];
    });
    if (Object.keys(next).length > 0) return next;
  }

  applyOrderFallback(map, sorted, orderedValues);
  return map;
}

/**
 * @param {unknown} answers
 * @param {Array<object>} [sortedQuestions]
 */
export function answersToValueMap(answers, sortedQuestions = []) {
  const map = {};
  if (answers == null) return map;

  const sorted = Array.isArray(sortedQuestions) ? sortedQuestions : [];

  if (Array.isArray(answers)) {
    const orderedValues = extractOrderedAnswerValues(answers);
    answers.forEach((row, i) => {
      if (row != null && typeof row === 'object' && !Array.isArray(row)) {
        const qid = resolveQuestionIdFromRow(row, sorted, i);
        if (!qid) return;
        map[qid] = orderedValues[i];
        return;
      }
      const qid = sorted[i]?._id ? normalizeId(sorted[i]._id) : null;
      if (qid) map[qid] = orderedValues[i];
    });
    return reconcileValueMapWithForm(map, sorted, orderedValues);
  }

  if (typeof answers === 'object') {
    const entries = Object.entries(answers);
    const idSet = new Set(sorted.map((q) => normalizeId(q._id)).filter(Boolean));
    const orderedValues = entries.map(([, v]) => unwrapAnswerValue(v));

    for (const [k, v] of entries) {
      const key = normalizeId(k);
      if (!key) continue;
      map[key] = unwrapAnswerValue(v);

      if (idSet.size) {
        const lower = key.toLowerCase();
        for (const fid of idSet) {
          if (fid.toLowerCase() === lower && fid !== key) {
            map[fid] = unwrapAnswerValue(v);
          }
        }
      }
    }

    return reconcileValueMapWithForm(map, sorted, orderedValues);
  }

  return map;
}

function isEmptyAnswer(v) {
  return (
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0)
  );
}

/**
 * ID mos kelmasa, tartib bo‘yicha javoblarni biriktirish (forma yangilanganda)
 * @param {Record<string, unknown>} map
 * @param {Array<object>} sorted
 * @param {unknown[]} orderedValues
 */
function applyOrderFallback(map, sorted, orderedValues) {
  if (!sorted.length || !orderedValues.length) return;

  const matchedCount = sorted.filter((q) => {
    const id = normalizeId(q._id);
    return id && !isEmptyAnswer(map[id]);
  }).length;

  if (matchedCount === sorted.length) return;

  if (matchedCount === 0 && orderedValues.length === sorted.length) {
    sorted.forEach((q, i) => {
      const id = normalizeId(q._id);
      if (id && orderedValues[i] !== undefined) map[id] = orderedValues[i];
    });
    return;
  }

  const unmatchedQuestions = sorted.filter((q) => {
    const id = normalizeId(q._id);
    return id && isEmptyAnswer(map[id]);
  });

  if (!unmatchedQuestions.length) return;

  const usedValues = new Set(
    Object.values(map).filter((v) => !isEmptyAnswer(v))
  );

  const leftover = orderedValues.filter((v) => !isEmptyAnswer(v) && !usedValues.has(v));

  if (leftover.length !== unmatchedQuestions.length) return;

  unmatchedQuestions.forEach((q, i) => {
    const id = normalizeId(q._id);
    if (id && leftover[i] !== undefined) map[id] = leftover[i];
  });
}

/**
 * Tahrirlash modali uchun to‘liq valueMap
 * @param {object} submission
 * @param {object|null|undefined} form
 */
export function buildEditValueMap(submission, form) {
  const sorted = getSortedFormQuestions(form);
  let answers = submission?.answers ?? submission?.formAnswers ?? submission?.responses;

  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch {
      answers = null;
    }
  }

  const map = answersToValueMap(answers, sorted);

  for (const q of sorted) {
    const key = normalizeId(q._id);
    if (!key || map[key] !== undefined) continue;
    map[key] = q.type === 'checkbox' || q.type === 'multiselect' ? [] : '';
  }

  return { map, sorted };
}

/** @param {object|null|undefined} form */
export function getSortedFormQuestions(form) {
  const list = Array.isArray(form?.questions) ? form.questions : [];
  return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** @param {string|number} id */
function shortIdHint(id) {
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

/** @param {unknown} answers */
function parseAnswersInput(answers) {
  if (answers == null) return null;
  if (typeof answers === 'string') {
    try {
      return JSON.parse(answers);
    } catch {
      return null;
    }
  }
  return answers;
}

/** @param {object} row */
function embeddedQuestionLabel(row) {
  return (
    (typeof row.question === 'string' && row.question.trim()) ||
    (typeof row.questionText === 'string' && row.questionText.trim()) ||
    (typeof row.question?.question === 'string' && row.question.question.trim()) ||
    (typeof row.label === 'string' && row.label.trim()) ||
    (typeof row.title === 'string' && row.title.trim()) ||
    ''
  );
}

/**
 * @param {Array<object>} sorted
 * @param {unknown} qid
 * @param {number} index
 */
function lookupQuestionMeta(sorted, qid, index) {
  const nid = normalizeId(qid);
  if (nid) {
    for (const q of sorted) {
      const qk = normalizeId(q._id);
      if (qk && (qk === nid || qk.toLowerCase() === nid.toLowerCase())) {
        const text = typeof q.question === 'string' ? q.question.trim() : '';
        return {
          label: text || `Savol (${shortIdHint(qk)})`,
          questionType: typeof q.type === 'string' ? q.type : '',
          sortOrder: typeof q.order === 'number' ? q.order : index,
        };
      }
    }
  }

  const byOrder = sorted[index];
  if (byOrder) {
    const qk = normalizeId(byOrder._id);
    const text = typeof byOrder.question === 'string' ? byOrder.question.trim() : '';
    return {
      label: text || (qk ? `Savol (${shortIdHint(qk)})` : `Javob ${index + 1}`),
      questionType: typeof byOrder.type === 'string' ? byOrder.type : '',
      sortOrder: typeof byOrder.order === 'number' ? byOrder.order : index,
    };
  }

  return {
    label: nid ? `Savol (${shortIdHint(nid)})` : `Javob ${index + 1}`,
    questionType: '',
    sortOrder: index,
  };
}

/**
 * Ariza javoblarini ko‘rsatish qatorlari (tafsilot modali)
 * @param {unknown} answers
 * @param {object|null|undefined} form
 * @returns {Array<{ key: string|number, label: string, raw: unknown, questionType: string, sortOrder: number }>}
 */
export function buildAnswerDisplayRows(answers, form) {
  const sorted = getSortedFormQuestions(form);
  const parsed = parseAnswersInput(answers);
  if (parsed == null) return [];

  const idSet = new Set(sorted.map((q) => normalizeId(q._id)).filter(Boolean));

  if (Array.isArray(parsed) && sorted.length) {
    const orderedValues = extractOrderedAnswerValues(parsed);
    const hasOverlap = parsed.some((row) => {
      if (row == null || typeof row !== 'object' || Array.isArray(row)) return false;
      const qid =
        normalizeId(row.questionId) ??
        normalizeId(row.question_id) ??
        normalizeId(row.question?._id);
      return qid != null && idSet.has(qid);
    });

    if (!hasOverlap && orderedValues.length === sorted.length) {
      return sorted.map((q, i) => {
        const key = normalizeId(q._id) || i;
        return {
          key,
          label: (q.question || '').trim() || `Savol ${i + 1}`,
          raw: orderedValues[i],
          questionType: typeof q.type === 'string' ? q.type : '',
          sortOrder: typeof q.order === 'number' ? q.order : i,
        };
      });
    }

    return parsed
      .map((row, i) => {
        if (row != null && typeof row === 'object' && !Array.isArray(row)) {
          const qid =
            normalizeId(row.questionId) ??
            normalizeId(row.question_id) ??
            normalizeId(row.question?._id);
          const fromItem = embeddedQuestionLabel(row);
          const meta = lookupQuestionMeta(sorted, qid, i);
          return {
            key: row._id || qid || i,
            label: fromItem || meta.label,
            raw: unwrapAnswerValue(row),
            questionType:
              (typeof row.questionType === 'string' && row.questionType) ||
              (typeof row.type === 'string' && row.type) ||
              (typeof row.question === 'object' && row.question?.type) ||
              meta.questionType,
            sortOrder: meta.sortOrder,
          };
        }
        const meta = lookupQuestionMeta(sorted, null, i);
        return {
          key: i,
          label: meta.label,
          raw: row,
          questionType: meta.questionType,
          sortOrder: meta.sortOrder,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  if (typeof parsed === 'object') {
    const entries = Object.entries(parsed);
    const keys = entries.map(([k]) => normalizeId(k));
    const hasOverlap = keys.some((k) => k && idSet.has(k));

    if (!hasOverlap && entries.length === sorted.length) {
      return sorted.map((q, i) => ({
        key: normalizeId(q._id) || i,
        label: (q.question || '').trim() || `Savol ${i + 1}`,
        raw: unwrapAnswerValue(entries[i][1]),
        questionType: typeof q.type === 'string' ? q.type : '',
        sortOrder: typeof q.order === 'number' ? q.order : i,
      }));
    }

    return entries
      .map(([k, v], i) => {
        const meta = lookupQuestionMeta(sorted, k, i);
        return {
          key: k,
          label: meta.label,
          raw: unwrapAnswerValue(v),
          questionType: meta.questionType,
          sortOrder: meta.sortOrder,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return [];
}

/**
 * @param {Array<{ _id: string }>} questions
 * @param {Record<string, unknown>} valueMap
 */
export function buildPatchAnswersPayload(questions, valueMap) {
  return questions
    .filter((q) => q?._id)
    .map((q) => {
      const id = normalizeId(q._id);
      return {
        questionId: id,
        value: id ? valueMap[id] : undefined,
      };
    });
}

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * @param {unknown} raw
 * @param {string} type
 */
export function valueToInputString(raw, type) {
  if (raw == null) return '';
  if (type === 'boolean') {
    if (typeof raw === 'boolean') return raw ? 'true' : 'false';
    if (raw === 'Ha' || raw === 'true' || raw === '1') return 'true';
    return 'false';
  }
  if (Array.isArray(raw)) return raw.map(String).join(', ');
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return '';
    }
  }
  if (typeof raw !== 'string') return String(raw);

  const s = raw.trim();
  if (!s) return '';

  const dateTypes = ['date', 'time', 'datetime', 'datetime-local', 'month', 'week'];
  if (!dateTypes.includes(type)) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  if (type === 'date') return d.toISOString().slice(0, 10);
  if (type === 'month') return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  if (type === 'week') {
    const one = new Date(d);
    const day = one.getDay() || 7;
    one.setDate(one.getDate() + 4 - day);
    const yearStart = new Date(one.getFullYear(), 0, 1);
    const week = Math.ceil(((one - yearStart) / 86400000 + 1) / 7);
    return `${one.getFullYear()}-W${pad2(week)}`;
  }
  if (type === 'time') return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (type === 'datetime' || type === 'datetime-local') {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  return s;
}

/**
 * @param {string} input
 * @param {string} type
 */
export function inputStringToValue(input, type) {
  const s = typeof input === 'string' ? input.trim() : '';

  if (type === 'boolean') return s === 'true' || s === 'Ha' || s === '1';

  if (type === 'number' || type === 'rating' || type === 'range') {
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : s;
  }

  if (type === 'multiselect' || type === 'checkbox') {
    if (!s) return [];
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  const dateTypes = ['date', 'time', 'datetime', 'datetime-local', 'month', 'week'];
  if (dateTypes.includes(type) && s) {
    if (type === 'date' || type === 'month' || type === 'week') return s;
    if (type === 'time') return s;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return s;
  }

  return s;
}

/**
 * @param {Array<object>} questions
 * @param {Record<string, unknown>} valueMap
 */
export function validateSubmissionAnswers(questions, valueMap) {
  const errors = {};
  for (const q of questions) {
    const id = normalizeId(q._id);
    if (!id || !q.required) continue;
    const v = valueMap[id];
    const empty =
      v == null ||
      v === '' ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'string' && !v.trim());
    if (empty) {
      errors[id] = 'Majburiy savol';
    }
  }
  return errors;
}

/** @param {string} phone */
export function normalizePhoneInput(phone) {
  return typeof phone === 'string' ? phone.trim() : '';
}
