/**
 * QuestionEditor — Single question editor card.
 * Renders the appropriate inputs depending on the question type.
 */

import { QUESTION_TYPES, needsOptions, acceptsPlaceholder } from './questionTypes.js';
import SkillsInput from '../common/SkillsInput.jsx';
import CustomSelect from '../common/CustomSelect.jsx';

const QuestionEditor = ({
  index,
  total,
  question,
  errors = {},
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const update = (patch) => onChange({ ...question, ...patch });

  return (
    <div className={`bg-white border rounded-xl p-4 ${errors._any ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex-shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-[180px]">
          <CustomSelect
            value={question.type}
            onChange={(val) => update({ type: val })}
            options={QUESTION_TYPES}
            placeholder="Savol turi"
          />
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer select-none px-2 py-1.5 hover:bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={!!question.required}
            onChange={(e) => update({ required: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          Majburiy
        </label>

        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Yuqoriga"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Pastga"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="O'chirish"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question text */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Savol matni</label>
        <input
          type="text"
          value={question.question || ''}
          onChange={(e) => update({ question: e.target.value })}
          placeholder="Savolingizni kiriting..."
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.question ? 'border-red-300' : 'border-gray-300'}`}
        />
        {errors.question && <p className="mt-1 text-xs text-red-600">{errors.question}</p>}
      </div>

      {/* Options (for select / multiselect / radio / checkbox) */}
      {needsOptions(question.type) && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Variantlar <span className="text-gray-400">(Enter bilan qo'shing)</span>
          </label>
          <SkillsInput
            value={Array.isArray(question.options) ? question.options : []}
            onChange={(options) => update({ options })}
            placeholder="Variant kiriting va Enter bosing"
          />
          {errors.options && <p className="mt-1 text-xs text-red-600">{errors.options}</p>}
        </div>
      )}

      {/* Placeholder (for text-like fields) */}
      {acceptsPlaceholder(question.type) && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
          <input
            type="text"
            value={question.placeholder || ''}
            onChange={(e) => update({ placeholder: e.target.value })}
            placeholder="Hint matn (ixtiyoriy)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
