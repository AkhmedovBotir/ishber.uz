const mongoose = require("mongoose");
const { ApplicationSubmission } = require("../models/ApplicationSubmission");
const { ApplicationForm } = require("../models/ApplicationForm");
const { Vacancy } = require("../models/Vacancy");
const { LearningMaterial } = require("../models/LearningMaterial");
const { HttpError } = require("../utils/HttpError");

/**
 * Telefon raqamidan faqat raqamlarni ajratib olish va oxirgi 9 ta raqamni olish
 */
function extractPhoneDigits(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 9) {
    return digits.slice(-9); // oxirgi 9 raqam: masalan 901234567
  }
  return digits;
}

/**
 * Nomzod ism-familiyasini javoblar orasidan topish
 */
function findCandidateFullName(submissions, formsMap) {
  for (const sub of submissions) {
    const form = formsMap.get(String(sub.vacancyId)) || null;
    const questions = form?.questions || [];
    const questionMap = new Map();
    questions.forEach((q) => {
      if (q && q._id) questionMap.set(String(q._id), q);
    });

    const answers = sub.answers || [];
    let firstName = "";
    let lastName = "";
    let fullName = "";

    for (const ans of answers) {
      if (!ans) continue;
      const val = typeof ans.value === "string" ? ans.value.trim() : "";
      if (!val || val.length < 2 || val.length > 80) continue;

      const qId = String(ans.questionId || ans.question_id || "");
      const qFromForm = questionMap.get(qId);
      const qText = (qFromForm?.question || ans.questionText || "").trim();

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

    // Matnli oddiy javobni tekshirish (telefon, email bo'lmagan)
    for (const ans of answers) {
      const val = typeof ans.value === "string" ? ans.value.trim() : "";
      if (
        val &&
        !/^\+?\d[\d\s\-()]{7,}$/.test(val) &&
        val.length >= 2 &&
        val.length <= 40 &&
        !val.includes("@") &&
        !val.startsWith("http")
      ) {
        return val;
      }
    }
  }

  return "";
}

/**
 * Telefon raqami bo'yicha nomzodlikni tekshirish
 */
async function checkCandidateByPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new HttpError(400, "Telefon raqam kiritilishi shart");
  }

  const digits = extractPhoneDigits(rawPhone);
  if (!digits || digits.length < 9) {
    throw new HttpError(400, "Telefon raqam kamida 9 ta raqamdan iborat bo'lishi kerak");
  }

  // Telefon raqami bo'yicha barcha arizalarni qidirish (oxirgi 9 raqamiga qarab)
  const allSubmissions = await ApplicationSubmission.find({}).lean();
  const matchedSubmissions = allSubmissions.filter((sub) => {
    const subDigits = extractPhoneDigits(sub.applicantPhone);
    return subDigits === digits;
  });

  if (matchedSubmissions.length === 0) {
    return {
      isCandidate: false,
      foundApplication: false,
      phone: rawPhone,
      fullName: "",
      needsName: false,
      vacancies: [],
      message: "Ushbu telefon raqam bilan ariza topilmadi.",
    };
  }

  // Nomzod sifatida belgilangan arizalarni ajratish
  const candidateSubmissions = matchedSubmissions.filter((sub) => sub.isCandidate === true);

  // Tegishli shakllarni olish
  const vacancyIds = [...new Set(matchedSubmissions.map((s) => String(s.vacancyId)).filter(Boolean))];
  const forms = await ApplicationForm.find({ vacancyId: { $in: vacancyIds } }).lean();
  const formsMap = new Map(forms.map((f) => [String(f.vacancyId), f]));

  // Ism-familiyani aniqlash
  const fullName = findCandidateFullName(matchedSubmissions, formsMap);
  const needsName = !fullName || fullName.length < 2;

  if (candidateSubmissions.length === 0) {
    return {
      isCandidate: false,
      foundApplication: true,
      phone: rawPhone,
      fullName: fullName || "",
      needsName,
      vacancies: [],
      message: "Sizning arizangiz ko'rib chiqilmoqda yoki hali nomzodlar ro'yxatiga qabul qilinmagansiz.",
    };
  }

  // Nomzod qabul qilingan barcha vakansiyalarni to'plash (1, 2 yoki 3+ ta bo'lishi mumkin)
  const candidateVacIds = [...new Set(candidateSubmissions.map((s) => String(s.vacancyId)))];
  const vacancies = await Vacancy.find({ _id: { $in: candidateVacIds } }).lean();
  const vacMap = new Map(vacancies.map((v) => [String(v._id), v]));

  // Har bir vakansiyadagi materiallar sonini hisoblash
  const materialCounts = await LearningMaterial.aggregate([
    {
      $match: {
        vacancyId: { $in: candidateVacIds.map((id) => new mongoose.Types.ObjectId(id)) },
        isPublished: { $ne: false },
      },
    },
    { $group: { _id: "$vacancyId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(materialCounts.map((m) => [String(m._id), m.count]));

  const enrolledVacancies = candidateSubmissions.map((sub) => {
    const vId = String(sub.vacancyId);
    const vac = vacMap.get(vId);
    return {
      vacancyId: vId,
      submissionId: String(sub._id),
      submissionNumber: sub.submissionNumber || null,
      status: sub.status || "pending",
      title: vac?.title || "Vakansiya",
      department: vac?.department || "",
      location: vac?.location || "",
      promotedAt: sub.candidatePromotedAt || sub.updatedAt || sub.createdAt,
      totalMaterials: countMap.get(vId) || 0,
    };
  });

  return {
    isCandidate: true,
    foundApplication: true,
    phone: rawPhone,
    fullName: fullName || "",
    needsName,
    vacancies: enrolledVacancies,
    message: "Xush kelibsiz! Siz quyidagi vakansiya(lar) bo'yicha nomzod sifatida qabul qilingansiz.",
  };
}

/**
 * Nomzod ism-familiyasini saqlash / yangilash
 */
async function updateCandidateName(rawPhone, fullName) {
  if (!rawPhone || !fullName || !fullName.trim()) {
    throw new HttpError(400, "Telefon raqam va ism-familiya kiritilishi shart");
  }

  const digits = extractPhoneDigits(rawPhone);
  if (!digits || digits.length < 9) {
    throw new HttpError(400, "Noto'g'ri telefon raqam");
  }

  const cleanName = fullName.trim();

  // Telefon raqamiga mos keluvchi arizalarni topish
  const allSubmissions = await ApplicationSubmission.find({});
  const matched = allSubmissions.filter((sub) => extractPhoneDigits(sub.applicantPhone) === digits);

  if (matched.length === 0) {
    throw new HttpError(404, "Ushbu telefon raqam bo'yicha ariza topilmadi");
  }

  // Har bir arizada ism javobini yangilash yoki qo'shish
  for (const sub of matched) {
    if (!Array.isArray(sub.answers)) {
      sub.answers = [];
    }

    const form = await ApplicationForm.findById(sub.applicationFormId).lean();
    let nameQuestionId = null;
    if (form && Array.isArray(form.questions)) {
      const q = form.questions.find((item) =>
        /f\.?i\.?sh|fio|full\s*name|ism|familiya/i.test(item.question || "")
      );
      if (q) nameQuestionId = q._id;
    }

    if (!nameQuestionId) {
      nameQuestionId = new mongoose.Types.ObjectId();
    }

    const existingAnsIndex = sub.answers.findIndex(
      (a) => String(a.questionId) === String(nameQuestionId)
    );

    if (existingAnsIndex >= 0) {
      sub.answers[existingAnsIndex].value = cleanName;
    } else {
      sub.answers.push({
        questionId: nameQuestionId,
        value: cleanName,
      });
    }

    await sub.save();
  }

  return checkCandidateByPhone(rawPhone);
}

/**
 * Vakansiyadagi barcha e'lon qilingan o'quv materiallarini olish
 */
async function getVacancyMaterials(vacancyId) {
  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    throw new HttpError(400, "Noto'g'ri vakansiya ID");
  }

  const vacancy = await Vacancy.findById(vacancyId).select("title department descriptionDelta location").lean();
  if (!vacancy) {
    throw new HttpError(404, "Vakansiya topilmadi");
  }

  const materials = await LearningMaterial.find({
    vacancyId,
    isPublished: { $ne: false },
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return {
    vacancy: {
      _id: vacancy._id,
      title: vacancy.title,
      department: vacancy.department,
      location: vacancy.location,
    },
    materials: materials.map((m, index) => ({
      _id: m._id,
      title: m.title,
      order: m.order != null ? m.order : index,
      descriptionDelta: m.descriptionDelta || { ops: [] },
      videoType: m.videoType || "none",
      videoUrl: m.videoUrl || "",
      videoFile: m.videoFile || "",
      images: m.images || [],
      quiz: m.quiz || [],
      createdAt: m.createdAt,
    })),
  };
}

module.exports = {
  checkCandidateByPhone,
  updateCandidateName,
  getVacancyMaterials,
};
