import React, { useState, useRef } from 'react';
import { CertificateCanvas, FONT_OPTIONS } from './CertificateCanvas';
import { useModal } from '../../context/ModalContext';

export const CertificateTemplateEditor = ({
  initialData = null,
  onSave,
  onCancel
}) => {
  const { alert: showAlert } = useModal();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(initialData?.name || 'Yangi Sertifikat Shabloni');
  const [description, setDescription] = useState(initialData?.description || '');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialData?.backgroundImageUrl || '');
  const [originalWidth, setOriginalWidth] = useState(initialData?.originalWidth || 1920);
  const [originalHeight, setOriginalHeight] = useState(initialData?.originalHeight || 1080);
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);

  const [elements, setElements] = useState(
    initialData?.elements || {
      name: {
        x: 15,
        y: 40,
        width: 70,
        height: 12,
        fontFamily: 'Great Vibes',
        fontSize: 56,
        fontWeight: 'normal',
        color: '#0f172a',
        textAlign: 'center',
        uppercase: false,
        visible: true
      },
      vacancy: {
        x: 15,
        y: 56,
        width: 70,
        height: 8,
        fontFamily: 'Montserrat',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#334155',
        textAlign: 'center',
        uppercase: true,
        visible: true
      },
      qr: {
        x: 74,
        y: 72,
        width: 16,
        height: 16,
        visible: true
      },
      date: {
        x: 10,
        y: 82,
        width: 28,
        height: 6,
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '500',
        color: '#475569',
        textAlign: 'center',
        uppercase: false,
        visible: true
      },
      certificateNumber: {
        x: 35,
        y: 90,
        width: 30,
        height: 5,
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        uppercase: true,
        visible: true
      }
    }
  );

  const [selectedElementKey, setSelectedElementKey] = useState('name');
  const [testCandidateName, setTestCandidateName] = useState('Rustamov Botir Olimovich');
  const [testVacancyTitle, setTestVacancyTitle] = useState('Full-Stack Dasturchi');
  const [saving, setSaving] = useState(false);

  // Handle local background image upload losslessly
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        setBackgroundImageUrl(dataUrl);
        setOriginalWidth(img.naturalWidth || 1920);
        setOriginalHeight(img.naturalHeight || 1080);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateElement = (key, updates) => {
    setElements((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...updates
      }
    }));
  };

  const currentElement = elements[selectedElementKey] || {};

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      showAlert('Iltimos, shablon nomini kiriting!', { title: 'Xatolik', type: 'error' });
      return;
    }
    if (!backgroundImageUrl) {
      showAlert('Iltimos, sertifikat fon rasmini yuklang!', { title: 'Xatolik', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: cleanName,
        description,
        backgroundImageUrl,
        originalWidth,
        originalHeight,
        elements,
        isDefault
      };
      await onSave(payload);
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Shablonni saqlashda xatolik yuz berdi', { title: 'Xatolik', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const ELEMENT_LABELS = {
    name: '👤 Ism-Familiya joyi',
    vacancy: '💼 Vakansiya / Lavozim joyi',
    qr: '📱 QR-kod joyi',
    date: '📅 Berilgan sana joyi',
    certificateNumber: '🔢 Sertifikat raqami joyi'
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl text-lg">🎨</span>
              {initialData ? 'Shablonni tahrirlash' : 'Yangi sertifikat shabloni yaratish'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Fon rasmini yuklang va matn/QR elementlarni sichqoncha yordamida kerakli joyga joylashtiring
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Saqlanmoqda...
                </>
              ) : (
                <>💾 Shablonni saqlash</>
              )}
            </button>
          </div>
        </div>

        {/* Primary Settings in Top Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-gray-100">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Shablon nomi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Oltin premium sertifikat"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Tavsif (ixtiyoriy)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qisqacha izoh..."
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <label className="w-full flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-gray-800">Asosiy shablon</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Two Columns) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Canvas (8 cols) */}
        <div className="xl:col-span-8 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Interaktiv muharrir</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md font-mono font-medium">
                  {originalWidth} x {originalHeight} px (Lossless)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  📁 Fon rasmini yuklash / almashtirish
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Canvas Container */}
            <div className="p-3 sm:p-5 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center overflow-auto max-h-[75vh]">
              <div className="w-full max-w-4xl">
                <CertificateCanvas
                  template={{
                    backgroundImageUrl,
                    originalWidth,
                    originalHeight,
                    elements
                  }}
                  candidateName={testCandidateName}
                  vacancyTitle={testVacancyTitle}
                  certificateNumber="ISH-2026-DEMO1"
                  issueDate={new Date().toISOString()}
                  mode="editor"
                  selectedElement={selectedElementKey}
                  onSelectElement={setSelectedElementKey}
                  onUpdateElement={handleUpdateElement}
                />
              </div>
            </div>

            {/* Helper tip */}
            <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">
                <strong>Qulaylik:</strong> Elementlarni sichqoncha bilan ushlab istalgan joyga siljiting yoki burchagidan tortib o'lchamini o'zgartiring. Ism va vakansiya uzun bo'lsa ham avtomatik qutiga moslashadi (hech qachon chegaradan chiqib ketmaydi)!
              </p>
            </div>
          </div>

          {/* Test text simulator */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🧪</span> Sinov matnlari (Tekshirib ko'rish uchun)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sinov Ism-Familiyasi:</label>
                <input
                  type="text"
                  value={testCandidateName}
                  onChange={(e) => setTestCandidateName(e.target.value)}
                  placeholder="Masalan: Abdullayev Jamshidbek Muhammadovich"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Sinov Vakansiyasi:</label>
                <input
                  type="text"
                  value={testVacancyTitle}
                  onChange={(e) => setTestVacancyTitle(e.target.value)}
                  placeholder="Masalan: Senior Frontend Engineer"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Element Inspector (4 cols) */}
        <div className="xl:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>🎯</span> Elementni tanlash va sozlash
            </h3>

            {/* Element selection chips */}
            <div className="grid grid-cols-1 gap-1.5">
              {Object.keys(ELEMENT_LABELS).map((key) => {
                const isSelected = selectedElementKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedElementKey(key)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{ELEMENT_LABELS[key]}</span>
                    {isSelected && <span className="text-xs">✏️ Tanlangan</span>}
                  </button>
                );
              })}
            </div>

            {/* Element properties */}
            {currentElement && (
              <div className="pt-3 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase">
                    {ELEMENT_LABELS[selectedElementKey]}
                  </span>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentElement.visible !== false}
                      onChange={(e) =>
                        handleUpdateElement(selectedElementKey, { visible: e.target.checked })
                      }
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                    />
                    Ko'rinadigan
                  </label>
                </div>

                {/* Font selector (for text elements) */}
                {selectedElementKey !== 'qr' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Shrift (Font Family):
                      </label>
                      <select
                        value={currentElement.fontFamily || 'Inter'}
                        onChange={(e) =>
                          handleUpdateElement(selectedElementKey, { fontFamily: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Asosiy o'lcham (px):
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="120"
                          value={currentElement.fontSize || 36}
                          onChange={(e) =>
                            handleUpdateElement(selectedElementKey, {
                              fontSize: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Matn rangi:
                        </label>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 border border-gray-300 rounded-xl">
                          <input
                            type="color"
                            value={currentElement.color || '#000000'}
                            onChange={(e) =>
                              handleUpdateElement(selectedElementKey, { color: e.target.value })
                            }
                            className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-xs text-gray-700 font-mono">
                            {currentElement.color || '#000000'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Qalinligi:
                        </label>
                        <select
                          value={currentElement.fontWeight || 'normal'}
                          onChange={(e) =>
                            handleUpdateElement(selectedElementKey, { fontWeight: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none"
                        >
                          <option value="normal">Oddiy (Normal)</option>
                          <option value="500">O'rtacha (Medium)</option>
                          <option value="600">Yarim qalin (Semi-Bold)</option>
                          <option value="bold">Qalin (Bold)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Tekislash:
                        </label>
                        <select
                          value={currentElement.textAlign || 'center'}
                          onChange={(e) =>
                            handleUpdateElement(selectedElementKey, { textAlign: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none"
                        >
                          <option value="left">Chapga</option>
                          <option value="center">Markazga</option>
                          <option value="right">O'ngga</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentElement.uppercase || false}
                          onChange={(e) =>
                            handleUpdateElement(selectedElementKey, { uppercase: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                        />
                        Bosh harflarda yozish (UPPERCASE)
                      </label>
                    </div>
                  </>
                )}

                {/* Bounding box fine-tuning */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    Chegara qutisi o'lchamlari (% da)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-500">X (Chapdan):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={currentElement.x ?? 15}
                        onChange={(e) =>
                          handleUpdateElement(selectedElementKey, { x: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Y (Yuqoridan):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={currentElement.y ?? 40}
                        onChange={(e) =>
                          handleUpdateElement(selectedElementKey, { y: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Kengligi (Width):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="100"
                        value={currentElement.width ?? 70}
                        onChange={(e) =>
                          handleUpdateElement(selectedElementKey, { width: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500">Balandligi (Height):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="3"
                        max="100"
                        value={currentElement.height ?? 12}
                        onChange={(e) =>
                          handleUpdateElement(selectedElementKey, { height: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
