/**
 * Bitta forma savoli uchun tahrirlash maydoni
 */

import CustomSelect from '../common/CustomSelect.jsx';
import ClickableImage from '../common/ClickableImage.jsx';
import { TYPES_WITH_OPTIONS } from '../applicationForms/questionTypes.js';
import { valueToInputString, inputStringToValue } from '../../utils/submissionAnswers.js';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

const FILE_TYPES = ['file', 'image', 'video', 'pdf'];

function FieldWrap({ label, required, error, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error}
    </div>
  );
}

/**
 * @param {{
 *   question: object,
 *   value: unknown,
 *   onChange: (value: unknown) => void,
 *   error?: string,
 * }} props
 */
export default function SubmissionAnswerField({ question, value, onChange, error }) {
  const type = question.type || 'text';
  const qid = String(question._id);
  const label = question.question || 'Savol';
  const options = Array.isArray(question.options) ? question.options : [];
  const placeholder = question.placeholder || '';

  const setFromString = (s) => onChange(inputStringToValue(s, type));

  const fieldError = error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null;

  if (type === 'boolean') {
    const checked = value === true || value === 'true' || value === 'Ha';
    return (
      <FieldWrap label={label} required={question.required} error={fieldError}>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          {checked ? 'Ha' : "Yo'q"}
        </label>
      </FieldWrap>
    );
  }

  if (type === 'textarea') {
    return (
      <FieldWrap label={label} required={question.required} error={fieldError}>
        <textarea
          rows={3}
          value={valueToInputString(value, type)}
          onChange={(e) => setFromString(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      </FieldWrap>
    );
  }

  if (TYPES_WITH_OPTIONS.includes(type)) {
    if (type === 'multiselect' || type === 'checkbox') {
      const selected = Array.isArray(value) ? value.map(String) : [];
      return (
        <FieldWrap label={label} required={question.required} error={fieldError}>
          {!options.length ? (
            <p className="text-xs text-amber-700">Variantlar formada belgilanmagan</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const on = selected.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                      on ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        const next = on ? selected.filter((x) => x !== opt) : [...selected, opt];
                        onChange(next);
                      }}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          )}
        </FieldWrap>
      );
    }

    if (type === 'radio') {
      const current = value != null ? String(value) : '';
      return (
        <FieldWrap label={label} required={question.required} error={fieldError}>
          <div className="space-y-1.5">
            {options.map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name={`q-${qid}`}
                  checked={current === opt}
                  onChange={() => onChange(opt)}
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </FieldWrap>
      );
    }

    return (
      <FieldWrap label={label} required={question.required} error={fieldError}>
        <CustomSelect
          value={value != null ? String(value) : ''}
          onChange={(v) => onChange(v)}
          options={options.map((o) => ({ value: o, label: o }))}
          placeholder={placeholder || 'Tanlang'}
        />
      </FieldWrap>
    );
  }

  if (FILE_TYPES.includes(type)) {
    const str = typeof value === 'string' ? value : '';
    const isData = str.startsWith('data:');
    return (
      <FieldWrap label={label} required={question.required} error={fieldError}>
        {isData && type === 'image' && (
          <div className="mb-2">
            <ClickableImage
              src={str}
              className="max-h-32 max-w-full rounded-lg border border-gray-200 bg-white object-contain shadow-sm transition group-hover:border-blue-300"
            />
          </div>
        )}
        <input
          type="file"
          accept={
            type === 'image'
              ? 'image/*'
              : type === 'video'
                ? 'video/*'
                : type === 'pdf'
                  ? 'application/pdf'
                  : undefined
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(reader.result);
            reader.readAsDataURL(file);
          }}
          className="mb-2 block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
        />
        {!isData && (
          <textarea
            rows={2}
            value={str}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Data URL yoki havola"
            className={`${inputClass} font-mono text-xs`}
          />
        )}
        {isData && (
          <p className="text-[11px] text-gray-500">Joriy fayl saqlangan. Yangi fayl tanlasangiz almashtiriladi.</p>
        )}
      </FieldWrap>
    );
  }

  const htmlType =
    type === 'email'
      ? 'email'
      : type === 'phone'
        ? 'tel'
        : type === 'url'
          ? 'url'
          : type === 'password'
            ? 'password'
            : type === 'number' || type === 'rating' || type === 'range'
              ? 'number'
              : type === 'date'
                ? 'date'
                : type === 'time'
                  ? 'time'
                  : type === 'datetime'
                    ? 'datetime-local'
                    : type === 'month'
                      ? 'month'
                      : type === 'week'
                        ? 'week'
                        : 'text';

  return (
    <FieldWrap label={label} required={question.required} error={fieldError}>
      <input
        type={htmlType}
        value={valueToInputString(value, type === 'datetime' ? 'datetime-local' : type)}
        onChange={(e) => {
          const v = e.target.value;
          if (type === 'number' || type === 'rating' || type === 'range') {
            onChange(v === '' ? null : Number(v));
          } else if (['date', 'time', 'datetime', 'month', 'week'].includes(type)) {
            onChange(inputStringToValue(v, type === 'datetime' ? 'datetime-local' : type));
          } else {
            onChange(v);
          }
        }}
        placeholder={placeholder}
        className={inputClass}
      />
    </FieldWrap>
  );
}
