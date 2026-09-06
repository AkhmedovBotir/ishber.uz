const mongoose = require("mongoose");
const { FinalExam } = require("../models/FinalExam");
const { FinalExamSubmission } = require("../models/FinalExamSubmission");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");

function validateObjectId(id, name = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Noto'g'ri ${name}`);
  }
}

function extractPhoneDigits(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

/**
 * Vakansiya uchun yakuniy nazorat testini olish
 */
async function getExamByVacancy(vacancyId, isPublic = false) {
  validateObjectId(vacancyId, "vakansiya ID");

  const vacancy = await Vacancy.findById(vacancyId).select("title department").lean();
  if (!vacancy) {
    throw new HttpError(404, "Vakansiya topilmadi");
  }

  let exam = await FinalExam.findOne({ vacancyId }).lean();
  if (!exam) {
    // Agar hali yaratilmagan bo'lsa, bo'sh shablon qaytaramiz
    return {
      vacancyId: String(vacancy._id),
      vacancyTitle: vacancy.title,
      title: "Yakuniy Nazorat Ishi",
      description: "Vakansiya bo‘yicha o‘zlashtirgan bilimlaringizni sinash uchun yakuniy test",
      passingScore: 70,
      questions: [],
      isPublished: true,
      exists: false,
    };
  }

  if (isPublic) {
    // Ommaviy talaba uchun to'g'ri javoblarni yashiramiz
    const sanitizedQuestions = (exam.questions || []).map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options || [],
    }));

    return {
      _id: String(exam._id),
      vacancyId: String(vacancy._id),
      vacancyTitle: vacancy.title,
      title: exam.title,
      description: exam.description,
      passingScore: exam.passingScore,
      questions: sanitizedQuestions,
      isPublished: exam.isPublished,
      exists: true,
    };
  }

  return {
    ...exam,
    vacancyTitle: vacancy.title,
    exists: true,
  };
}

/**
 * Vakansiya uchun yakuniy nazorat testini saqlash / yangilash (Admin)
 */
async function saveExamForVacancy(vacancyId, payload) {
  validateObjectId(vacancyId, "vakansiya ID");

  const { title, description, passingScore, questions, isPublished } = payload || {};

  const cleanQuestions = Array.isArray(questions)
    ? questions.map((q, idx) => {
        const type = ["radio", "checkbox", "text"].includes(q.type) ? q.type : "radio";
        const questionText = (q.question || "").trim();
        if (!questionText) {
          throw new HttpError(400, `${idx + 1}-savol matni kiritilishi shart`);
        }

        let options = [];
        let correctOptionIndex = 0;
        let correctOptionIndices = [];

        if (type === "radio" || type === "checkbox") {
          options = Array.isArray(q.options)
            ? q.options.map((opt) => String(opt || "").trim()).filter(Boolean)
            : [];
          if (options.length < 2) {
            throw new HttpError(400, `«${questionText}» savoli uchun kamida 2 ta variant bo‘lishi kerak`);
          }

          if (type === "radio") {
            correctOptionIndex = typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0;
            if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
              correctOptionIndex = 0;
            }
          } else if (type === "checkbox") {
            correctOptionIndices = Array.isArray(q.correctOptionIndices)
              ? q.correctOptionIndices.filter((i) => typeof i === "number" && i >= 0 && i < options.length)
              : [0];
            if (correctOptionIndices.length === 0) correctOptionIndices = [0];
          }
        }

        return {
          id: q.id || new mongoose.Types.ObjectId().toString(),
          type,
          question: questionText,
          options,
          correctOptionIndex,
          correctOptionIndices,
          explanation: (q.explanation || "").trim(),
        };
      })
    : [];

  const updateDoc = {
    title: (title || "Yakuniy Nazorat Ishi").trim(),
    description: (description || "").trim(),
    passingScore: typeof passingScore === "number" ? Math.min(100, Math.max(0, passingScore)) : 70,
    questions: cleanQuestions,
    isPublished: isPublished !== false,
  };

  const exam = await FinalExam.findOneAndUpdate(
    { vacancyId },
    { $set: updateDoc },
    { new: true, upsert: true }
  ).lean();

  return getExamByVacancy(vacancyId, false);
}

/**
 * Nomzod yakuniy nazorat testini topshirishi (Public Candidate)
 */
async function submitCandidateExam(vacancyId, payload) {
  validateObjectId(vacancyId, "vakansiya ID");

  const { phone, candidateName, answers } = payload || {};
  if (!phone || typeof phone !== "string") {
    throw new HttpError(400, "Telefon raqam kiritilishi shart");
  }

  const digits = extractPhoneDigits(phone);
  if (!digits || digits.length < 9) {
    throw new HttpError(400, "Noto'g'ri telefon raqam");
  }

  const exam = await FinalExam.findOne({ vacancyId }).lean();
  if (!exam || !Array.isArray(exam.questions) || exam.questions.length === 0) {
    throw new HttpError(400, "Ushbu vakansiya uchun yakuniy test mavjud emas");
  }

  const answerMap = new Map();
  if (Array.isArray(answers)) {
    answers.forEach((ans) => {
      if (ans && ans.questionId) {
        answerMap.set(String(ans.questionId), ans);
      }
    });
  }

  let autoCalculableCount = 0;
  let correctCount = 0;

  const processedAnswers = exam.questions.map((q) => {
    const userAns = answerMap.get(String(q.id)) || {};
    let isCorrect = null;

    if (q.type === "radio") {
      autoCalculableCount++;
      const sel = typeof userAns.selectedOption === "number" ? userAns.selectedOption : null;
      isCorrect = sel !== null && sel === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        type: "radio",
        questionText: q.question,
        options: q.options || [],
        selectedOption: sel,
        selectedOptions: [],
        textValue: "",
        isCorrect,
      };
    } else if (q.type === "checkbox") {
      autoCalculableCount++;
      const selArr = Array.isArray(userAns.selectedOptions) ? userAns.selectedOptions : [];
      const correctArr = Array.isArray(q.correctOptionIndices) ? q.correctOptionIndices : [];
      // To'liq mos kelishi kerak
      const match =
        selArr.length === correctArr.length &&
        selArr.every((v) => correctArr.includes(v));
      isCorrect = match;
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        type: "checkbox",
        questionText: q.question,
        options: q.options || [],
        selectedOption: null,
        selectedOptions: selArr,
        textValue: "",
        isCorrect,
      };
    } else {
      // Text ochiq savol - admin qo'lda tekshiradi
      return {
        questionId: q.id,
        type: "text",
        questionText: q.question,
        options: [],
        selectedOption: null,
        selectedOptions: [],
        textValue: typeof userAns.textValue === "string" ? userAns.textValue.trim() : "",
        isCorrect: null,
      };
    }
  });

  const autoScore =
    autoCalculableCount > 0
      ? Math.round((correctCount / autoCalculableCount) * 100)
      : 100;

  // Saqlash yoki yangilash
  const submission = await FinalExamSubmission.create({
    vacancyId,
    applicantPhone: phone.trim(),
    candidateName: (candidateName || "Nomzod").trim(),
    answers: processedAnswers,
    autoScore,
    status: "submitted",
    adminNote: "",
  });

  return {
    success: true,
    submissionId: String(submission._id),
    status: submission.status,
    autoScore: submission.autoScore,
    message: "Yakuniy nazorat ishingiz muvaffaqiyatli qabul qilindi va tekshiruvga yuborildi!",
  };
}

/**
 * Nomzodning yakuniy topshirig'i holatini olish (Public Candidate)
 */
async function getCandidateExamStatus(vacancyId, phone) {
  validateObjectId(vacancyId, "vakansiya ID");
  if (!phone) {
    throw new HttpError(400, "Telefon raqam kiritilishi shart");
  }

  const digits = extractPhoneDigits(phone);
  const allSubmissions = await FinalExamSubmission.find({ vacancyId }).sort({ createdAt: -1 }).lean();
  const matched = allSubmissions.filter((s) => extractPhoneDigits(s.applicantPhone) === digits);

  if (matched.length === 0) {
    return {
      hasSubmitted: false,
      status: null,
      submission: null,
    };
  }

  const latest = matched[0];
  return {
    hasSubmitted: true,
    status: latest.status,
    autoScore: latest.autoScore,
    adminNote: latest.adminNote || "",
    submittedAt: latest.createdAt,
    reviewedAt: latest.reviewedAt,
  };
}

/**
 * Admin uchun barcha topshirilgan yakuniy nazorat ishlarini olish
 */
async function listSubmissions(options = {}) {
  const filter = {};
  if (options.vacancyId) {
    validateObjectId(options.vacancyId, "vakansiya ID");
    filter.vacancyId = options.vacancyId;
  }
  if (options.status && ["submitted", "accepted", "rejected"].includes(options.status)) {
    filter.status = options.status;
  }

  const list = await FinalExamSubmission.find(filter)
    .sort({ createdAt: -1 })
    .populate("reviewedBy", "name username email")
    .lean();

  const vacancyIds = [...new Set(list.map((s) => String(s.vacancyId)).filter(Boolean))];
  const vacancies = await Vacancy.find({ _id: { $in: vacancyIds } }).select("title department").lean();
  const vacMap = new Map(vacancies.map((v) => [String(v._id), v]));

  return list.map((s) => {
    const vac = vacMap.get(String(s.vacancyId));
    const textAnswersCount = (s.answers || []).filter((a) => a.type === "text").length;

    return {
      ...s,
      vacancyTitle: vac?.title || "Vakansiya",
      department: vac?.department || "",
      textAnswersCount,
    };
  });
}

/**
 * Bitta topshirilgan ishni batafsil olish (Admin)
 */
async function getSubmissionById(id) {
  validateObjectId(id, "topshiriq ID");

  const sub = await FinalExamSubmission.findById(id)
    .populate("reviewedBy", "name username email")
    .lean();

  if (!sub) {
    throw new HttpError(404, "Topshiriq topilmadi");
  }

  const vac = await Vacancy.findById(sub.vacancyId).select("title department").lean();

  return {
    ...sub,
    vacancyTitle: vac?.title || "Vakansiya",
    department: vac?.department || "",
  };
}

/**
 * Admin nomzodning yakuniy nazorat ishini tekshirib qabul/bekor qilishi
 */
async function reviewSubmission(id, body, adminId) {
  validateObjectId(id, "topshiriq ID");

  const { status, adminNote } = body || {};
  if (!["accepted", "rejected"].includes(status)) {
    throw new HttpError(400, "Holat faqat 'accepted' yoki 'rejected' bo‘lishi mumkin");
  }

  if (status === "rejected") {
    const note = (adminNote || "").trim();
    if (!note) {
      throw new HttpError(400, "Bekor qilish uchun izoh (note) kiritish majburiy!");
    }
  }

  const sub = await FinalExamSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Topshiriq topilmadi");
  }

  sub.status = status;
  sub.adminNote = (adminNote || "").trim();
  sub.reviewedBy = adminId || null;
  sub.reviewedAt = new Date();

  await sub.save();

  return getSubmissionById(id);
}

module.exports = {
  getExamByVacancy,
  saveExamForVacancy,
  submitCandidateExam,
  getCandidateExamStatus,
  listSubmissions,
  getSubmissionById,
  reviewSubmission,
};
