/**
 * Forma javobi qiymati — matn, ro'yxat, data URL (rasm/video/pdf) va boshqalar
 */

import {
  formatAnswerDisplayValue,
  looksLikeIsoDateString,
} from '../../utils/submissionAnswerFormat.js';
import ClickableImage from '../common/ClickableImage.jsx';

const formatPrimitive = (val, questionType) => {
  if (val == null) return '—';
  if (typeof val === 'boolean') return val ? 'Ha' : "Yo'q";
  if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  if (typeof val === 'string' && looksLikeIsoDateString(val)) {
    return formatAnswerDisplayValue(val, questionType);
  }
  return null;
};

const isHttpUrl = (s) => /^https?:\/\//i.test(String(s).trim());

/** @param {string} dataUrl */
function parseDataUrlHeader(dataUrl) {
  const s = dataUrl.trim();
  if (!s.startsWith('data:')) return null;
  const comma = s.indexOf(',');
  if (comma <= 5) return null;
  const header = s.slice(5, comma);
  const mime = header.split(';')[0].trim().toLowerCase();
  const isBase64 = /;base64/i.test(header);
  return { mime, header, isBase64, href: s };
}

function decodeDataUrlBody(dataUrl, isBase64) {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return '';
  const body = dataUrl.slice(comma + 1);
  if (isBase64) {
    try {
      const bin = atob(body);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
      return '';
    }
  }
  try {
    return decodeURIComponent(body);
  } catch {
    return body;
  }
}

/** @param {string} mime */
function downloadNameForMime(mime) {
  const map = {
    'application/zip': 'fayl',
    'application/x-zip-compressed': 'fayl',
    'application/x-rar-compressed': 'fayl',
    'application/vnd.rar': 'fayl',
    'application/octet-stream': 'fayl.bin',
    'application/msword': 'hujjat.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'hujjat.docx',
    'application/vnd.ms-excel': 'jadval.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'jadval.xlsx',
    'application/vnd.ms-powerpoint': 'taqdimot.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'taqdimot.pptx',
  };
  if (map[mime]) return map[mime];
  const sub = mime.split('/')[1];
  if (!sub) return 'fayl.bin';
  const safe = sub.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 24);
  return safe ? `fayl.${safe}` : 'fayl.bin';
}

/** @param {string} mime */
function mimeDescriptionUz(mime) {
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') return 'Fayl';
  if (mime.includes('rar')) return 'Fayl';
  if (mime === 'application/octet-stream') return 'Fayl (binary)';
  if (mime.includes('word') || mime === 'application/msword') return 'Word hujjati';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel jadvali';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint';
  if (mime.startsWith('text/')) return 'Matn fayli';
  return 'Fayl';
}

/** @param {{ href: string, mime: string, approxKb: number }} props */
function BinaryDataUrlCard({ href, mime, approxKb }) {
  const name = downloadNameForMime(mime);
  const desc = mimeDescriptionUz(mime);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{desc}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">{mime}</p>
          <p className="mt-1 text-xs text-slate-600">Taxminan {approxKb} KB</p>
        </div>
        <svg className="h-10 w-10 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <a
        href={href}
        download={name}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Yuklab olish
      </a>
      <p className="text-[11px] leading-relaxed text-slate-500">
        {"Ma'lumot brauzerda fayl sifatida saqlanadi. Katta fayllarda biroz kutishingiz mumkin."}
      </p>
    </div>
  );
}

/** @param {{ raw: unknown, questionType?: string }} props */
export default function AnswerValueDisplay({ raw, questionType = '' }) {
  const prim = formatPrimitive(raw, questionType);
  if (prim !== null) {
    return <p className="whitespace-pre-wrap break-words text-sm text-gray-900">{prim}</p>;
  }

  if (Array.isArray(raw)) {
    if (!raw.length) return <span className="text-sm text-gray-400">—</span>;
    return (
      <ul className="list-inside list-disc space-y-0.5 text-sm text-gray-900">
        {raw.map((item, i) => (
          <li key={i} className="break-words">
            {typeof item === 'object' && item !== null ? (
              <AnswerValueDisplay raw={item} questionType={questionType} />
            ) : (
              formatAnswerDisplayValue(item, questionType)
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof raw === 'object' && raw !== null) {
    const o = raw;
    const url = o.url ?? o.href ?? o.fileUrl;
    if (typeof url === 'string' && isHttpUrl(url)) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm font-medium text-blue-600 hover:underline"
        >
          {url}
        </a>
      );
    }
    return (
      <pre className="max-h-52 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-800">
        {JSON.stringify(raw, null, 2)}
      </pre>
    );
  }

  const s = String(raw);
  const trimmed = s.trim();

  if (trimmed.startsWith('data:image/')) {
    return <ClickableImage src={trimmed} />;
  }

  if (trimmed.startsWith('data:video/')) {
    return (
      <div className="space-y-2">
        <video
          src={trimmed}
          controls
          playsInline
          className="max-h-72 w-full rounded-lg border border-gray-200 bg-black shadow-sm"
        />
        <p className="text-xs text-gray-500">Video (data URL)</p>
      </div>
    );
  }

  if (trimmed.startsWith('data:audio/')) {
    return (
      <div className="space-y-2">
        <audio src={trimmed} controls className="w-full" />
        <p className="text-xs text-gray-500">Audio (data URL)</p>
      </div>
    );
  }

  if (trimmed.startsWith('data:application/pdf') || trimmed.startsWith('data:application%2Fpdf')) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner">
          <iframe title="PDF" src={trimmed} className="h-64 w-full bg-white" />
        </div>
        <a
          href={trimmed}
          download="hujjat.pdf"
          className="inline-flex text-xs font-medium text-blue-600 hover:underline"
        >
          PDF ni yuklab olish
        </a>
      </div>
    );
  }

  if (trimmed.startsWith('data:')) {
    const parsed = parseDataUrlHeader(trimmed);
    const approxKb = Math.max(1, Math.round(trimmed.length / 1024));

    if (parsed?.mime?.startsWith('text/')) {
      const preview = decodeDataUrlBody(trimmed, parsed.isBase64);
      const short = preview.length > 1200 ? `${preview.slice(0, 1200)}…` : preview || '—';
      return (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
          <p className="text-xs font-medium text-slate-700">{mimeDescriptionUz(parsed.mime)}</p>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">
            {short}
          </pre>
          <a
            href={trimmed}
            download={downloadNameForMime(parsed.mime)}
            className="inline-flex text-xs font-medium text-blue-600 hover:underline"
          >
            .txt sifatida yuklab olish
          </a>
        </div>
      );
    }

    if (
      parsed &&
      parsed.mime.startsWith('application/') &&
      parsed.mime !== 'application/pdf' &&
      parsed.mime !== 'application/x-pdf'
    ) {
      return <BinaryDataUrlCard href={trimmed} mime={parsed.mime} approxKb={approxKb} />;
    }

    if (parsed && (parsed.mime.startsWith('font/') || parsed.mime === 'binary/octet-stream')) {
      return <BinaryDataUrlCard href={trimmed} mime={parsed.mime} approxKb={approxKb} />;
    }

    const head = trimmed.slice(0, 96);
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
        <p className="text-xs font-medium text-amber-900">{"Data URL (noma'lum tur)"}</p>
        <p className="font-mono text-[10px] leading-snug text-amber-950/80 break-all">{head}…</p>
        <a
          href={trimmed}
          download="fayl.dat"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Yuklab olish
        </a>
      </div>
    );
  }

  if (isHttpUrl(trimmed)) {
    if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(trimmed) || questionType === 'image') {
      return (
        <ClickableImage
          src={trimmed}
          caption={
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-blue-600 hover:underline"
            >
              Havolani yangi oynada ochish
            </a>
          }
        />
      );
    }
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm font-medium text-blue-600 hover:underline"
      >
        {trimmed}
      </a>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm text-gray-900">
      {formatAnswerDisplayValue(s, questionType)}
    </p>
  );
}
