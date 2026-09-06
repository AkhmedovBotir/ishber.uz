const express = require("express");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

router
  .route("/")
  .get(settingsController.getSettings)
  .put(settingsController.updateSettings);

router.post("/test-eskiz", settingsController.testEskizConnection);
router.post("/test-sms", settingsController.sendTestSms);

module.exports = router;
