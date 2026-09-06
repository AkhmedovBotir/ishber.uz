import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate
} from '../services/certificateService';
import { CertificateCanvas } from '../components/certificates/CertificateCanvas';
import { CertificateTemplateEditor } from '../components/certificates/CertificateTemplateEditor';
import { IssueCertificateTab } from '../components/certificates/IssueCertificateTab';
import { IssuedCertificatesListTab } from '../components/certificates/IssuedCertificatesListTab';
import { useModal } from '../context/ModalContext';

export const Certificates = () => {
  const { alert: showAlert, confirm: showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'issue' | 'issued'
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateData, setEditingTemplateData] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await getTemplates();
      if (res.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNewTemplate = () => {
    setEditingTemplateData(null);
    setIsEditingTemplate(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateData(template);
    setIsEditingTemplate(true);
  };

  const handleSaveTemplate = async (payload) => {
    try {
      if (editingTemplateData) {
        await updateTemplate(editingTemplateData._id, payload);
        showAlert('Sertifikat shabloni muvaffaqiyatli yangilandi.', {
          title: 'Muvaffaqiyatli!'
        });
      } else {
        await createTemplate(payload);
        showAlert('Yangi sertifikat shabloni muvaffaqiyatli yaratildi.', {
          title: 'Muvaffaqiyatli!'
        });
      }
      setIsEditingTemplate(false);
      setEditingTemplateData(null);
      fetchTemplates();
    } catch (err) {
      throw err;
    }
  };

  const handleSetDefault = async (template) => {
    try {
      await setDefaultTemplate(template._id);
      fetchTemplates();
    } catch (err) {
      showAlert(err.message || 'Xatolik yuz berdi', { title: 'Xatolik' });
    }
  };

  const handleDeleteTemplate = async (template) => {
    const ok = await showConfirm(
      `Rostdan ham "${template.name}" shablonini o'chirib tashlamoqchimisiz?`,
      {
        title: "Shablonni o'chirish",
        confirmText: "O'chirish",
        cancelText: 'Bekor qilish',
        danger: true
      }
    );
    if (ok) {
      try {
        await deleteTemplate(template._id);
        fetchTemplates();
      } catch (err) {
        showAlert(err.message, { title: 'Xatolik' });
      }
    }
  };

  // Helper to create a ready-to-use elegant sample template if none exists
  const handleCreateSampleTemplate = async () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ca8a04"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#a16207"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg)"/>
      <rect x="40" y="40" width="1840" height="1000" fill="none" stroke="url(#gold)" stroke-width="4" rx="20"/>
      <rect x="55" y="55" width="1810" height="970" fill="none" stroke="#e2e8f0" stroke-width="1.5" rx="16"/>
      
      <!-- Top header decorative badge & title -->
      <circle cx="960" cy="140" r="45" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
      <path d="M960 115 L967 130 L984 132 L971 144 L975 161 L960 152 L945 161 L949 144 L936 132 L953 130 Z" fill="#ca8a04"/>
      <text x="960" y="240" font-family="'Cinzel', serif" font-size="38" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="4">SERTIFIKAT</text>
      <text x="960" y="280" font-family="'Montserrat', sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle" letter-spacing="6">MALAKA VA NATIJA TASDIQNOMASI</text>
      <text x="960" y="370" font-family="'Inter', sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Ushbu sertifikat muvaffaqiyatli topshirilganligi uchun berildi:</text>
      <line x1="400" y1="520" x2="1520" y2="520" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="960" y="560" font-family="'Inter', sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Quyidagi yo'nalish / vakansiya bo'yicha yakuniy sinovdan a'lo o'tdi:</text>
      
      <!-- Signature line -->
      <line x1="300" y1="910" x2="650" y2="910" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="475" y="940" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#475569" text-anchor="middle">Kompaniya Rahbari / HR</text>
    </svg>`;

    const sampleDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleSvg)}`;

    const payload = {
      name: 'Klassik Oltin Standart',
      description: 'Rasmiy Ishber sertifikati shabloni',
      backgroundImageUrl: sampleDataUrl,
      originalWidth: 1920,
      originalHeight: 1080,
      isDefault: true,
      elements: {
        name: {
          x: 20,
          y: 40,
          width: 60,
          height: 10,
          fontFamily: 'Great Vibes',
          fontSize: 64,
          fontWeight: 'normal',
          color: '#0f172a',
          textAlign: 'center',
          uppercase: false,
          visible: true
        },
        vacancy: {
          x: 20,
          y: 58,
          width: 60,
          height: 7,
          fontFamily: 'Montserrat',
          fontSize: 26,
          fontWeight: 'bold',
          color: '#1e293b',
          textAlign: 'center',
          uppercase: true,
          visible: true
        },
        qr: {
          x: 82,
          y: 76,
          width: 13,
          height: 13,
          visible: true
        },
        date: {
          x: 18,
          y: 84,
          width: 25,
          height: 5,
          fontFamily: 'Inter',
          fontSize: 18,
          fontWeight: '500',
          color: '#475569',
          textAlign: 'center',
          uppercase: false,
          visible: true
        },
        certificateNumber: {
          x: 40,
          y: 92,
          width: 20,
          height: 4,
          fontFamily: 'Inter',
          fontSize: 15,
          fontWeight: '600',
          color: '#64748b',
          textAlign: 'center',
          uppercase: true,
          visible: true
        }
      }
    };

    try {
      await createTemplate(payload);
      fetchTemplates();
      showAlert('Namuna sertifikat shabloni muvaffaqiyatli yaratildi.', { title: 'Tayyor!' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-shell space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl shadow-xs">
              🎓
            </span>
            Sertifikatlar boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sertifikat shablonlari, nomzodlarga sertifikat berish va berilgan sertifikatlar nazorati
          </p>
        </div>

        {/* Top actions if on templates tab */}
        {!isEditingTemplate && activeTab === 'templates' && (
          <div className="flex items-center gap-2.5">
            {templates.length === 0 && (
              <button
                type="button"
                onClick={handleCreateSampleTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold shadow-xs transition"
              >
                <span>✨ Namuna shablon</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCreateNewTemplate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition"
            >
              <span>➕ Yangi shablon</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation (Clean Light Theme) */}
      {!isEditingTemplate && (
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition cursor-pointer ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <span>🎨 Shablonlar</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === 'templates'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('issue')}
            className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition cursor-pointer ${
              activeTab === 'issue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <span>🎓 Sertifikat berish</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('issued')}
            className={`flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition cursor-pointer ${
              activeTab === 'issued'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <span>📜 Berilgan sertifikatlar</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isEditingTemplate ? (
        <CertificateTemplateEditor
          initialData={editingTemplateData}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setIsEditingTemplate(false);
            setEditingTemplateData(null);
          }}
        />
      ) : (
        <>
          {/* TAB 1: Shablonlar */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              {loading ? (
                <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <p className="text-sm font-medium text-gray-600">Shablonlar yuklanmoqda...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-12 sm:p-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4 max-w-2xl mx-auto">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                    🎨
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Hozircha hech qanday shablon mavjud emas
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Sertifikat fon rasmini yuklab yangi shablon yarating yoki tayyor namuna shablondan foydalaning.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCreateSampleTemplate}
                      className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                    >
                      ✨ Namuna shablon yuklash
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewTemplate}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      ➕ Yangi shablon yaratish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((tpl) => (
                    <div
                      key={tpl._id}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm flex flex-col ${
                        tpl.isDefault
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Live Canvas Preview thumbnail */}
                      <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                        <CertificateCanvas
                          template={tpl}
                          candidateName="Ism Familiya"
                          vacancyTitle="Vakansiya Nomi"
                          certificateNumber="ISH-2026-0001"
                          mode="preview"
                          className="shadow-sm"
                        />
                      </div>

                      {/* Info & Actions */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {tpl.name}
                            </h3>
                            {tpl.isDefault ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                ⭐ Asosiy
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(tpl)}
                                className="text-[11px] text-gray-500 hover:text-blue-600 font-medium transition cursor-pointer"
                                title="Asosiy qilib belgilash"
                              >
                                ☆ Asosiy qilish
                              </button>
                            )}
                          </div>
                          {tpl.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{tpl.description}</p>
                          )}
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                            <span>
                              {tpl.originalWidth}x{tpl.originalHeight}px
                            </span>
                            <span>•</span>
                            <span>Shrift: {tpl.elements?.name?.fontFamily || 'Great Vibes'}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleEditTemplate(tpl)}
                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            ✏️ Tahrirlash
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="O'chirish"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Sertifikat Berish */}
          {activeTab === 'issue' && (
            <IssueCertificateTab
              templates={templates}
              onCertificateIssued={() => {
                fetchTemplates();
              }}
            />
          )}

          {/* TAB 3: Berilgan Sertifikatlar */}
          {activeTab === 'issued' && <IssuedCertificatesListTab />}
        </>
      )}
    </div>
  );
};

export default Certificates;
