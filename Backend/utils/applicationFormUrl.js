/**
 * Public form app URL for a vacancy (production: https://form.ishber.uz).
 * Path template may include `{vacancyId}` (case-insensitive).
 */
function buildApplicationFormUrl(vacancyId) {
  const base = (process.env.APPLICATION_FORM_BASE_URL || "https://form.ishber.uz").replace(/\/$/, "");
  const pathTemplate = process.env.APPLICATION_FORM_APPLY_PATH || "vacancies/{vacancyId}/apply";
  const path = pathTemplate
    .replace(/\{vacancyId\}/gi, String(vacancyId))
    .replace(/^\/+/, "");
  return `${base}/${path}`;
}

module.exports = { buildApplicationFormUrl };
