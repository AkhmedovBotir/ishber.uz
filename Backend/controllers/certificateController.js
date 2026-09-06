const certificateService = require('../services/certificateService');

class CertificateController {
  // ==================== TEMPLATES ====================

  async createTemplate(req, res) {
    try {
      const template = await certificateService.createTemplate(req.body);
      res.status(201).json({
        success: true,
        message: 'Shablon muvaffaqiyatli yaratildi',
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTemplates(req, res) {
    try {
      const templates = await certificateService.getTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTemplateById(req, res) {
    try {
      const template = await certificateService.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Shablon topilmadi' });
      }
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTemplate(req, res) {
    try {
      const template = await certificateService.updateTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Shablon topilmadi' });
      }
      res.json({ success: true, message: 'Shablon yangilandi', data: template });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async setDefaultTemplate(req, res) {
    try {
      const template = await certificateService.setDefaultTemplate(req.params.id);
      res.json({ success: true, message: 'Asosiy shablon deb belgilandi', data: template });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTemplate(req, res) {
    try {
      const result = await certificateService.deleteTemplate(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== ELIGIBLE CANDIDATES ====================

  async getEligibleCandidates(req, res) {
    try {
      const candidates = await certificateService.getEligibleCandidates();
      res.json({ success: true, data: candidates });
    } catch (error) {
      console.error('Error getting eligible candidates:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== ISSUE ====================

  async issueCertificate(req, res) {
    try {
      const adminId = req.admin?._id || req.admin?.id || null;
      const originUrl = req.headers.origin || req.headers.referer;
      const cert = await certificateService.issueCertificate({
        ...req.body,
        adminId,
        originUrl
      });
      res.status(201).json({
        success: true,
        message: 'Sertifikat muvaffaqiyatli taqdim etildi',
        data: cert
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== CERTIFICATES LIST & ACTIONS ====================

  async listCertificates(req, res) {
    try {
      const result = await certificateService.listCertificates(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error listing certificates:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCertificateById(req, res) {
    try {
      const cert = await certificateService.getCertificateById(req.params.id);
      if (!cert) {
        return res.status(404).json({ success: false, message: 'Sertifikat topilmadi' });
      }
      res.json({ success: true, data: cert });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCertificateByNumber(req, res) {
    try {
      const cert = await certificateService.getCertificateByNumber(req.params.certificateNumber);
      if (!cert) {
        return res.status(404).json({ success: false, message: 'Sertifikat topilmadi' });
      }
      res.json({ success: true, data: cert });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async revokeCertificate(req, res) {
    try {
      const { reason } = req.body;
      const cert = await certificateService.revokeCertificate(req.params.id, reason);
      res.json({ success: true, message: 'Sertifikat bekor qilindi', data: cert });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteCertificate(req, res) {
    try {
      await certificateService.deleteCertificate(req.params.id);
      res.json({ success: true, message: "Sertifikat o'chirildi" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== PUBLIC & CANDIDATE ====================

  async verifyCertificate(req, res) {
    try {
      const result = await certificateService.verifyCertificate(req.params.certificateNumber);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCandidateCertificates(req, res) {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Telefon raqam berilishi shart' });
      }
      const certs = await certificateService.getCandidateCertificates(phone);
      res.json({ success: true, data: certs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CertificateController();
