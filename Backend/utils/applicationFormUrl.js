const { getCachedSettingsSync } = require("../services/settingsService");

/**
 * Public form app URL for a vacancy (production: https://form.ishber.uz).
 * Path template may include `{vacancyId}` (case-insensitive).
 */
function buildApplicationFormUrl(vacancyId) {
  const settings = getCachedSettingsSync();
  const rawBase = settings?.applicationFormBaseUrl || process.env.APPLICATION_FORM_BASE_URL || "http://localhost:5174";
  
  if (!rawBase || rawBase.trim() === "") {
    return null;
  }

  const base = rawBase.replace(/\/$/, "");
  const pathTemplate = settings?.applicationFormApplyPath || process.env.APPLICATION_FORM_APPLY_PATH || "vacancies/{vacancyId}/apply";
  const path = pathTemplate
    .replace(/\{vacancyId\}/gi, String(vacancyId))
    .replace(/^\/+/, "");
  return `${base}/${path}`;
}

module.exports = { buildApplicationFormUrl };
