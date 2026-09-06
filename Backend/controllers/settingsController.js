const settingsService = require("../services/settingsService");

async function getSettings(_req, res, next) {
  try {
    const settings = await settingsService.getSettings(true);
    // Mask password slightly for security in response if present, or return as is so admin can edit
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const updated = await settingsService.updateSettings(req.body || {});
    res.json({
      success: true,
      message: "Sozlamalar muvaffaqiyatli saqlandi",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

async function testEskizConnection(req, res, next) {
  try {
    const result = await settingsService.testEskizConnection(req.body);
    res.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Eskiz ulanish xatosi",
    });
  }
}

async function sendTestSms(req, res, next) {
  try {
    const { phone, message } = req.body || {};
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Telefon raqami kiritilmagan",
      });
    }

    const result = await settingsService.sendTestSms(phone, message);
    res.json({
      success: true,
      message: "Test SMS muvaffaqiyatli yuborildi!",
      result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "SMS yuborishda xatolik",
    });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testEskizConnection,
  sendTestSms,
};
