/**
 * View Vacancy Modal — read-only details view
 */

import { motion, AnimatePresence } from 'framer-motion';
import QuillEditor from '../common/QuillEditor.jsx';
import { formatUzDateTime } from '../../utils/uzDateFormat.js';
import ApplicationFormLinkBlock from './ApplicationFormLinkBlock.jsx';

const InfoRow = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`mt-1 text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
  </div>
);

const ViewVacancyModal = ({ isOpen, onClose, vacancy }) => {
  return (
    <AnimatePresence>
      {isOpen && vacancy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{vacancy.title}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      vacancy.isOpen !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        vacancy.isOpen !== false ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                    {vacancy.isOpen !== false ? 'Ochiq' : 'Yopiq'}
                  </span>
                  {vacancy.applicationFormAvailable === true && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ariza havolasi faol
                    </span>
                  )}
                  {vacancy.applicationFormAvailable === false && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      Ariza havolasi yo'q
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{vacancy._id}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoRow label="Tajriba" value={vacancy.experience} />
                <InfoRow label="Yosh" value={`${vacancy.minAge ?? '-'} - ${vacancy.maxAge ?? '-'}`} />
                <InfoRow label="Ish haqi" value={vacancy.salary} />
                <InfoRow label="Yaratilgan" value={formatUzDateTime(vacancy.createdAt)} />
              </div>

              <ApplicationFormLinkBlock url={vacancy.applicationFormUrl} variant="modal" />
              {vacancy.applicationFormAvailable === false && !vacancy.applicationFormUrl && (
                <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                  Faol ariza formasi yo'q — nomzod havolasi server tomonidan berilmaydi. So'rovnoma statusi{' '}
                  <span className="font-medium text-gray-700">active</span> bo'lganda havola paydo bo'ladi.
                </p>
              )}

              {vacancy.skills && vacancy.skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ko'nikmalar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vacancy.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tavsif</p>
                <QuillEditor
                  key={`view-desc-${vacancy._id}`}
                  defaultValue={vacancy.descriptionDelta}
                  readOnly
                  minHeight="80px"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Majburiyatlar</p>
                <QuillEditor
                  key={`view-resp-${vacancy._id}`}
                  defaultValue={vacancy.responsibilitiesDelta}
                  readOnly
                  minHeight="80px"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Afzalliklar</p>
                <QuillEditor
                  key={`view-adv-${vacancy._id}`}
                  defaultValue={vacancy.advantagesDelta}
                  readOnly
                  minHeight="80px"
                />
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yopish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewVacancyModal;
