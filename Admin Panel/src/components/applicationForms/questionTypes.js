/**
 * Question type definitions and helpers
 * Backend API bilan mos: text … range, file, image, video, pdf va hokazo.
 */

export const QUESTION_TYPES = [
  { value: 'text', label: 'Matn (qisqa)', group: 'Matnli' },
  { value: 'textarea', label: 'Matn (uzun)', group: 'Matnli' },
  { value: 'email', label: 'Email', group: 'Matnli' },
  { value: 'phone', label: 'Telefon', group: 'Matnli' },
  { value: 'url', label: 'Havola (URL)', group: 'Matnli' },
  { value: 'password', label: 'Parol', group: 'Matnli' },
  { value: 'number', label: 'Raqam', group: 'Raqamli' },
  { value: 'rating', label: 'Reyting', group: 'Raqamli' },
  { value: 'range', label: 'Diapazon (slayder)', group: 'Raqamli' },
  { value: 'date', label: 'Sana', group: 'Sana / vaqt' },
  { value: 'time', label: 'Vaqt', group: 'Sana / vaqt' },
  { value: 'datetime', label: 'Sana va vaqt', group: 'Sana / vaqt' },
  { value: 'month', label: 'Oy', group: 'Sana / vaqt' },
  { value: 'week', label: 'Hafta', group: 'Sana / vaqt' },
  { value: 'select', label: 'Dropdown (bitta tanlov)', group: 'Tanlov' },
  { value: 'multiselect', label: "Dropdown (ko'p tanlov)", group: 'Tanlov' },
  { value: 'radio', label: 'Radio (bitta)', group: 'Tanlov' },
  { value: 'checkbox', label: "Checkbox (ko'p)", group: 'Tanlov' },
  { value: 'file', label: 'Fayl yuklash', group: 'Fayl va media' },
  { value: 'image', label: 'Rasm yuklash', group: 'Fayl va media' },
  { value: 'video', label: 'Video yuklash', group: 'Fayl va media' },
  { value: 'pdf', label: 'PDF yuklash', group: 'Fayl va media' },
  { value: 'boolean', label: "Ha / Yo'q", group: 'Boshqa' },
];

export const TYPES_WITH_OPTIONS = ['select', 'multiselect', 'radio', 'checkbox'];
export const TYPES_WITH_PLACEHOLDER = [
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'password',
  'date',
  'time',
  'datetime',
  'month',
  'week',
  'rating',
  'range',
  'file',
  'image',
  'video',
  'pdf',
];

export const needsOptions = (type) => TYPES_WITH_OPTIONS.includes(type);
export const acceptsPlaceholder = (type) => TYPES_WITH_PLACEHOLDER.includes(type);

export const getTypeLabel = (type) => {
  const found = QUESTION_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};
