const express = require("express");
const learningMaterialController = require("../controllers/learningMaterialController");

const router = express.Router();

router.get("/vacancy/:vacancyId", learningMaterialController.getMaterialsByVacancy);
router.patch("/reorder", learningMaterialController.reorderMaterials);

router
  .route("/")
  .post(learningMaterialController.createMaterial);

router
  .route("/:id")
  .get(learningMaterialController.getMaterialById)
  .put(learningMaterialController.updateMaterial)
  .delete(learningMaterialController.deleteMaterial);

module.exports = router;
