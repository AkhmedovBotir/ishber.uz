/**
 * Server hisoblagan ariza formasi havolasi (GET /vacancies ... applicationFormUrl).
 */

import { useState } from 'react';

const ApplicationFormLinkBlock = ({ url, variant = 'card' }) => {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // eslint-disable-next-line no-alert
      alert("Buferga nusxalab bo'lmadi");
    }
  };

  const isModal = variant === 'modal';

  return (
    <div
      className={
        isModal
          ? 'rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3'
          : 'mx-5 mb-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5'
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
        Nomzodlar uchun havola
      </p>
      <p
        className={`mt-1 font-mono text-emerald-900 break-all ${isModal ? 'text-sm' : 'text-xs'}`}
        title={url}
      >
        {url}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? 'Nusxalandi' : 'Nusxalash'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Ochish
        </a>
      </div>
    </div>
  );
};

export default ApplicationFormLinkBlock;
