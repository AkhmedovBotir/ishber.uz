const learningMaterialService = require("../services/learningMaterialService");

async function getMaterialsByVacancy(req, res, next) {
  try {
    const list = await learningMaterialService.getMaterialsByVacancy(req.params.vacancyId);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getMaterialById(req, res, next) {
  try {
    const material = await learningMaterialService.getMaterialById(req.params.id);
    res.json(material);
  } catch (err) {
    next(err);
  }
}

async function createMaterial(req, res, next) {
  try {
    const created = await learningMaterialService.createMaterial(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function updateMaterial(req, res, next) {
  try {
    const updated = await learningMaterialService.updateMaterial(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteMaterial(req, res, next) {
  try {
    const result = await learningMaterialService.deleteMaterial(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function reorderMaterials(req, res, next) {
  try {
    const { vacancyId, orderedIds } = req.body || {};
    const updatedList = await learningMaterialService.reorderMaterials(vacancyId, orderedIds);
    res.json(updatedList);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMaterialsByVacancy,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
};
