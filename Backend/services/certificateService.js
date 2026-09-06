const CertificateTemplate = require('../models/CertificateTemplate');
const Certificate = require('../models/Certificate');
const { FinalExamSubmission } = require('../models/FinalExamSubmission');
const { Vacancy } = require('../models/Vacancy');

class CertificateService {
  // ==================== TEMPLATES ====================

  async createTemplate(data) {
    if (data.isDefault) {
      await CertificateTemplate.updateMany({}, { isDefault: false });
    } else {
      const count = await CertificateTemplate.countDocuments();
      if (count === 0) {
        data.isDefault = true;
      }
    }
    const template = new CertificateTemplate(data);
    return await template.save();
  }

  async getTemplates() {
    return await CertificateTemplate.find().sort({ isDefault: -1, createdAt: -1 });
  }

  async getTemplateById(id) {
    return await CertificateTemplate.findById(id);
  }

  async getDefaultTemplate() {
    let template = await CertificateTemplate.findOne({ isDefault: true, isActive: true });
    if (!template) {
      template = await CertificateTemplate.findOne({ isActive: true }).sort({ createdAt: -1 });
    }
    return template;
  }

  async updateTemplate(id, data) {
    if (data.isDefault) {
      await CertificateTemplate.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    return await CertificateTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async setDefaultTemplate(id) {
    await CertificateTemplate.updateMany({}, { isDefault: false });
    return await CertificateTemplate.findByIdAndUpdate(id, { isDefault: true }, { new: true });
  }

  async deleteTemplate(id) {
    const template = await CertificateTemplate.findById(id);
    if (!template) {
      throw new Error('Shablon topilmadi');
    }
    if (template.isDefault) {
      const another = await CertificateTemplate.findOne({ _id: { $ne: id } });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }
    await CertificateTemplate.findByIdAndDelete(id);
    return { message: "Shablon o'chirildi" };
  }

  // ==================== ELIGIBLE CANDIDATES ====================

  async getEligibleCandidates() {
    const submissions = await FinalExamSubmission.find({ status: 'accepted' })
      .populate('vacancyId', 'title experience')
      .sort({ updatedAt: -1 });

    const issuedCerts = await Certificate.find({ status: 'active' }).select(
      'finalExamSubmissionId candidatePhone vacancyId certificateNumber createdAt'
    );
    const issuedMap = new Map();
    issuedCerts.forEach((c) => {
      if (c.finalExamSubmissionId) {
        issuedMap.set(c.finalExamSubmissionId.toString(), c);
      }
      if (c.candidatePhone && c.vacancyId) {
        issuedMap.set(`${c.candidatePhone}_${c.vacancyId.toString()}`, c);
      }
    });

    return submissions.map((sub) => {
      const vIdStr = sub.vacancyId?._id ? sub.vacancyId._id.toString() : (sub.vacancyId?.toString() || '');
      const issued =
        issuedMap.get(sub._id.toString()) ||
        issuedMap.get(`${sub.applicantPhone}_${vIdStr}`);

      return {
        submissionId: sub._id,
        candidateName: sub.candidateName || 'Nomzod',
        candidatePhone: sub.applicantPhone,
        vacancyId: sub.vacancyId?._id || sub.vacancyId,
        vacancyTitle: sub.vacancyId?.title || 'Umumiy vakansiya',
        score: sub.autoScore || 0,
        acceptedAt: sub.reviewedAt || sub.updatedAt,
        isIssued: !!issued,
        certificateNumber: issued ? issued.certificateNumber : null,
        certificateId: issued ? issued._id : null
      };
    });
  }

  // ==================== ISSUE CERTIFICATE ====================

  async issueCertificate({
    templateId,
    candidateName,
    candidatePhone,
    vacancyId,
    vacancyTitle,
    finalExamSubmissionId,
    issueDate,
    adminId,
    originUrl
  }) {
    if (!candidateName || !candidatePhone) {
      throw new Error('Nomzod ismi va telefon raqami kiritilishi shart');
    }

    let template;
    if (templateId) {
      template = await CertificateTemplate.findById(templateId);
    }
    if (!template) {
      template = await this.getDefaultTemplate();
    }
    if (!template) {
      throw new Error('Hech qanday sertifikat shabloni topilmadi. Oldin shablon yarating!');
    }

    const year = new Date().getFullYear();
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const certificateNumber = `ISH-${year}-${randomCode}`;

    const baseUrl = originUrl || process.env.CLIENT_URL || process.env.NOMZOD_URL || 'http://localhost:5174';
    const qrVerificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${certificateNumber}`;

    const templateSnapshot = {
      backgroundImageUrl: template.backgroundImageUrl,
      originalWidth: template.originalWidth || 1920,
      originalHeight: template.originalHeight || 1080,
      elements: template.elements
    };

    let vTitle = vacancyTitle;
    if (!vTitle && vacancyId) {
      const v = await Vacancy.findById(vacancyId);
      if (v) vTitle = v.title;
    }

    const certificate = new Certificate({
      certificateNumber,
      templateId: template._id,
      candidateName,
      candidatePhone,
      vacancyId: vacancyId || null,
      vacancyTitle: vTitle || '',
      finalExamSubmissionId: finalExamSubmissionId || null,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      qrVerificationUrl,
      templateSnapshot,
      issuedBy: adminId || null
    });

    return await certificate.save();
  }

  // ==================== CERTIFICATES LIST & ACTIONS ====================

  async listCertificates({ search, vacancyId, status, page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;
    if (vacancyId) query.vacancyId = vacancyId;
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { candidatePhone: { $regex: search, $options: 'i' } },
        { certificateNumber: { $regex: search, $options: 'i' } },
        { vacancyTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Certificate.countDocuments(query);
    const certificates = await Certificate.find(query)
      .populate('templateId', 'name backgroundImageUrl')
      .populate('issuedBy', 'fullName email username')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return {
      certificates,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  async getCertificateById(id) {
    return await Certificate.findById(id).populate('templateId').populate('issuedBy', 'fullName email');
  }

  async getCertificateByNumber(certificateNumber) {
    return await Certificate.findOne({ certificateNumber: certificateNumber.trim() })
      .populate('templateId')
      .populate('issuedBy', 'fullName email');
  }

  async revokeCertificate(id, reason) {
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      throw new Error('Sertifikat topilmadi');
    }
    certificate.status = 'revoked';
    certificate.revokeReason = reason || 'Bekor qilingan';
    return await certificate.save();
  }

  async deleteCertificate(id) {
    return await Certificate.findByIdAndDelete(id);
  }

  // ==================== CANDIDATE & PUBLIC APIS ====================

  async getCandidateCertificates(phone) {
    if (!phone) return [];
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return await Certificate.find({
      $or: [
        { candidatePhone: phone },
        { candidatePhone: cleanPhone },
        { candidatePhone: { $regex: cleanPhone.slice(-9), $options: 'i' } }
      ],
      status: 'active'
    }).sort({ createdAt: -1 });
  }

  async verifyCertificate(certificateNumber) {
    const cert = await Certificate.findOne({ certificateNumber: certificateNumber.trim() });
    if (!cert) {
      return { isValid: false, message: 'Bunday raqamli sertifikat topilmadi!' };
    }
    if (cert.status === 'revoked') {
      return {
        isValid: false,
        status: 'revoked',
        message: 'Ushbu sertifikat bekor qilingan!',
        revokeReason: cert.revokeReason,
        certificate: {
          certificateNumber: cert.certificateNumber,
          candidateName: cert.candidateName,
          vacancyTitle: cert.vacancyTitle,
          issueDate: cert.issueDate
        }
      };
    }

    return {
      isValid: true,
      status: 'active',
      certificate: cert
    };
  }
}

module.exports = new CertificateService();
