const express = require('express');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

// Template routes
router
  .route('/templates')
  .get(certificateController.getTemplates)
  .post(certificateController.createTemplate);

router
  .route('/templates/:id')
  .get(certificateController.getTemplateById)
  .put(certificateController.updateTemplate)
  .delete(certificateController.deleteTemplate);

router.patch('/templates/:id/default', certificateController.setDefaultTemplate);

// Eligible candidates
router.get('/eligible-candidates', certificateController.getEligibleCandidates);

// Issuing
router.post('/issue', certificateController.issueCertificate);

// Certificates management
router
  .route('/')
  .get(certificateController.listCertificates);

router
  .route('/:id')
  .get(certificateController.getCertificateById)
  .delete(certificateController.deleteCertificate);

router.patch('/:id/revoke', certificateController.revokeCertificate);

module.exports = router;
