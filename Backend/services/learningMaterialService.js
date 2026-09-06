const mongoose = require("mongoose");
const { LearningMaterial } = require("../models/LearningMaterial");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");

function validateObjectId(id, name = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Noto'g'ri ${name}`);
  }
}

async function getMaterialsByVacancy(vacancyId) {
  validateObjectId(vacancyId, "vakansiya ID");
  return LearningMaterial.find({ vacancyId }).sort({ order: 1, createdAt: 1 }).lean();
}

async function getMaterialById(id) {
  validateObjectId(id, "material ID");
  const material = await LearningMaterial.findById(id).lean();
  if (!material) {
    throw new HttpError(404, "O'qitish materiali topilmadi");
  }
  return material;
}

async function createMaterial(payload) {
  const { vacancyId, title } = payload || {};
  if (!vacancyId) {
    throw new HttpError(400, "Vakansiya tanlanishi shart");
  }
  validateObjectId(vacancyId, "vakansiya ID");

  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) {
    throw new HttpError(404, "Tanlangan vakansiya topilmadi");
  }

  if (!title || !title.trim()) {
    throw new HttpError(400, "Mavzu nomi kiritilishi shart");
  }

  // Find max order for this vacancy
  const lastMaterial = await LearningMaterial.findOne({ vacancyId })
    .sort({ order: -1 })
    .select("order")
    .lean();
  const nextOrder = lastMaterial && typeof lastMaterial.order === "number" ? lastMaterial.order + 1 : 0;

  return LearningMaterial.create({
    vacancyId,
    title: title.trim(),
    order: nextOrder,
    descriptionDelta: payload.descriptionDelta || { ops: [] },
    videoType: payload.videoType || "none",
    videoUrl: payload.videoUrl || "",
    videoFile: payload.videoFile || "",
    images: Array.isArray(payload.images) ? payload.images : [],
    quiz: Array.isArray(payload.quiz) ? payload.quiz : [],
    isPublished: payload.isPublished !== false,
  });
}

async function updateMaterial(id, payload) {
  validateObjectId(id, "material ID");
  const existing = await LearningMaterial.findById(id);
  if (!existing) {
    throw new HttpError(404, "O'qitish materiali topilmadi");
  }

  if (payload.title !== undefined) {
    if (!payload.title.trim()) {
      throw new HttpError(400, "Mavzu nomi bo'sh bo'lishi mumkin emas");
    }
    existing.title = payload.title.trim();
  }

  if (payload.descriptionDelta !== undefined) {
    existing.descriptionDelta = payload.descriptionDelta;
  }
  if (payload.videoType !== undefined) {
    existing.videoType = payload.videoType;
  }
  if (payload.videoUrl !== undefined) {
    existing.videoUrl = payload.videoUrl;
  }
  if (payload.videoFile !== undefined) {
    existing.videoFile = payload.videoFile;
  }
  if (payload.images !== undefined) {
    existing.images = Array.isArray(payload.images) ? payload.images : [];
  }
  if (payload.quiz !== undefined) {
    existing.quiz = Array.isArray(payload.quiz) ? payload.quiz : [];
  }
  if (payload.isPublished !== undefined) {
    existing.isPublished = Boolean(payload.isPublished);
  }
  if (payload.order !== undefined && typeof payload.order === "number") {
    existing.order = payload.order;
  }

  await existing.save();
  return existing.toObject();
}

async function deleteMaterial(id) {
  validateObjectId(id, "material ID");
  const existing = await LearningMaterial.findByIdAndDelete(id);
  if (!existing) {
    throw new HttpError(404, "O'qitish materiali topilmadi");
  }
  return { success: true, message: "Mavzu o'chirildi" };
}

async function reorderMaterials(vacancyId, orderedIds) {
  validateObjectId(vacancyId, "vakansiya ID");
  if (!Array.isArray(orderedIds)) {
    throw new HttpError(400, "orderedIds massiv bo'lishi kerak");
  }

  const bulkOps = orderedIds.map((id, index) => {
    validateObjectId(id, "mavzu ID");
    return {
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id), vacancyId },
        update: { $set: { order: index } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await LearningMaterial.bulkWrite(bulkOps);
  }

  return getMaterialsByVacancy(vacancyId);
}

module.exports = {
  getMaterialsByVacancy,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
};
