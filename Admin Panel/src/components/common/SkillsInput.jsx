/**
 * SkillsInput — chip-style input for tags/skills.
 * Press Enter or comma to add a tag, click X (or Backspace on empty input) to remove.
 *
 * Props:
 *  - value: string[]
 *  - onChange(skills: string[])
 *  - placeholder
 */

import { useState } from 'react';

const SkillsInput = ({ value = [], onChange, placeholder }) => {
  const [draft, setDraft] = useState('');

  const addSkill = (raw) => {
    const skill = raw.trim();
    if (!skill) return;
    const exists = value.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...value, skill]);
    setDraft('');
  };

  const removeAt = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) addSkill(draft);
  };

  return (
    <div className="w-full min-h-[42px] px-2 py-1.5 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors flex flex-wrap items-center gap-1.5">
      {value.map((skill, idx) => (
        <span
          key={`${skill}-${idx}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
        >
          {skill}
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="hover:text-blue-900 transition-colors"
            aria-label={`Remove ${skill}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] px-1 py-0.5 text-sm bg-transparent outline-none placeholder-gray-400"
      />
    </div>
  );
};

export default SkillsInput;
