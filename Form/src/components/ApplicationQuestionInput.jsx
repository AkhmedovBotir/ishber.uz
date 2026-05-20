import { useEffect, useRef, useState } from 'react'
import {
  formatUzPhoneNational,
  parseUzPhoneNational,
  toE164UzPhone,
  UZ_PHONE_INPUT_MASK,
} from '../lib/uzPhone.js'

const labelCls =
  'mb-1.5 block text-sm font-medium text-zinc-800 [text-wrap:balance]'

const fieldCls =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'

const fieldTriggerCls =
  `${fieldCls} flex cursor-pointer items-center justify-between gap-2 text-left`

const hintCls = 'mt-1.5 text-xs leading-relaxed text-zinc-500'

const listPanelCls =
  'absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg'

function IconEye({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function RequiredMark({ required }) {
  if (!required) return null
  return (
    <span className="ml-0.5 text-red-600" aria-hidden="true">
      *
    </span>
  )
}

function PhoneField({ id, title, required, value, onChange }) {
  const national = parseUzPhoneNational(value)
  const display = formatUzPhoneNational(national)

  const handleChange = (e) => {
    const next = parseUzPhoneNational(e.target.value)
    onChange(next.length ? toE164UzPhone(next) : '')
  }

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <div className="flex rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-600/15">
        <span
          className="inline-flex shrink-0 items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-700"
          aria-hidden
        >
          +998
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          className={`${fieldCls} min-w-0 flex-1 rounded-l-none rounded-r-md border-l-0 tracking-wide placeholder:text-zinc-400 focus:ring-0`}
          placeholder={UZ_PHONE_INPUT_MASK}
          value={display}
          onChange={handleChange}
          aria-describedby={`${id}-hint`}
          maxLength={14}
        />
      </div>
      <p id={`${id}-hint`} className={hintCls}>
        Mobil raqamni 9 ta raqam bilan kiriting — masalan,{' '}
        <span className="font-medium text-zinc-600">90 123 45 67</span>.
      </p>
    </div>
  )
}

function PasswordField({
  id,
  title,
  required,
  value,
  onChange,
  placeholder,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${fieldCls} pr-11`}
          placeholder={placeholder || ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
        >
          {visible ? (
            <IconEyeOff className="size-5" />
          ) : (
            <IconEye className="size-5" />
          )}
        </button>
      </div>
    </div>
  )
}

/** JSON arizada yuborish uchun yuqori chegara (server limitiga yaqin bo‘lishi mumkin) */
const MAX_FILE_DATA_URL_BYTES = 35 * 1024 * 1024

function isLikelyHttpUrl(s) {
  return /^https?:\/\//i.test(String(s).trim())
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error || new Error('O‘qish xatosi'))
    fr.readAsDataURL(file)
  })
}

const fileInputCls =
  'block w-full cursor-pointer text-sm text-zinc-700 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white file:shadow-sm hover:file:bg-blue-700'

function DashedMediaShell({ children }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-3 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white sm:p-4">
      {children}
    </div>
  )
}

function ImageStorageField({ id, title, required, value, onChange }) {
  const [broken, setBroken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [pickNonce, setPickNonce] = useState(0)
  const v = String(value ?? '').trim()
  const showPreview = isLikelyHttpUrl(v) || v.startsWith('data:image')

  useEffect(() => {
    setBroken(false)
  }, [v])

  const bumpPickInput = () => setPickNonce((n) => n + 1)

  return (
    <div>
      <label htmlFor={`${id}-file`} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <DashedMediaShell>
        <input
          key={pickNonce}
          id={`${id}-file`}
          type="file"
          accept="image/*"
          disabled={busy}
          className={fileInputCls}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            setErr(null)
            if (!f) return
            if (f.size > MAX_FILE_DATA_URL_BYTES) {
              setErr(
                `Fayl juda katta (maks. ~${Math.round(MAX_FILE_DATA_URL_BYTES / (1024 * 1024))} MB). Boshqa fayl tanlang.`,
              )
              bumpPickInput()
              return
            }
            setBusy(true)
            try {
              const dataUrl = await readFileAsDataUrl(f)
              onChange(dataUrl)
            } catch {
              setErr('Faylni o‘qib bo‘lmadi — qayta urinib ko‘ring.')
            } finally {
              setBusy(false)
            }
          }}
        />
        {busy && (
          <p className="mt-2 text-xs text-zinc-500">Rasm o‘qilmoqda…</p>
        )}
        {err && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {err}
          </p>
        )}
        {v && (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
            onClick={() => {
              setErr(null)
              onChange('')
              bumpPickInput()
            }}
          >
            Tanlovni bekor qilish
          </button>
        )}
      </DashedMediaShell>
      <p className={hintCls}>
        Rasmni shu yerdan tanlang — pastda oldindan ko‘rinish chiqadi.
      </p>
      {showPreview && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
          {broken ? (
            <p className="py-14 text-center text-sm text-zinc-500">
              Rasmni ko‘rsatib bo‘lmadi — boshqa fayl tanlang.
            </p>
          ) : (
            <img
              src={v}
              alt=""
              className="mx-auto max-h-96 w-full bg-zinc-50 object-contain"
              onError={() => setBroken(true)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function VideoStorageField({ id, title, required, value, onChange }) {
  const [nativeErr, setNativeErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [pickNonce, setPickNonce] = useState(0)
  const v = String(value ?? '').trim()
  const showNative = v.startsWith('data:video')

  const bumpPickInput = () => setPickNonce((n) => n + 1)

  useEffect(() => {
    setNativeErr(false)
  }, [v])

  return (
    <div>
      <label htmlFor={`${id}-file`} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <DashedMediaShell>
        <input
          key={pickNonce}
          id={`${id}-file`}
          type="file"
          accept="video/*"
          disabled={busy}
          className={fileInputCls}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            setErr(null)
            if (!f) return
            if (f.size > MAX_FILE_DATA_URL_BYTES) {
              setErr(
                `Video juda katta (maks. ~${Math.round(MAX_FILE_DATA_URL_BYTES / (1024 * 1024))} MB). Kichikroq fayl tanlang.`,
              )
              bumpPickInput()
              return
            }
            setBusy(true)
            try {
              const dataUrl = await readFileAsDataUrl(f)
              onChange(dataUrl)
            } catch {
              setErr('Videoni o‘qib bo‘lmadi — qayta urinib ko‘ring.')
            } finally {
              setBusy(false)
            }
          }}
        />
        {busy && (
          <p className="mt-2 text-xs text-zinc-500">Video o‘qilmoqda…</p>
        )}
        {err && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {err}
          </p>
        )}
        {v && (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
            onClick={() => {
              setErr(null)
              onChange('')
              bumpPickInput()
            }}
          >
            Tanlovni bekor qilish
          </button>
        )}
      </DashedMediaShell>
      <p className={hintCls}>
        Videoni shu yerdan tanlang — pastda oldindan ko‘rinish chiqadi.
      </p>
      {v && showNative && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-md">
          {nativeErr ? (
            <p className="py-12 text-center text-sm text-zinc-400">
              Videoni brauzerda ochib bo‘lmadi — boshqa format yoki fayl
              tanlang.
            </p>
          ) : (
            <video
              src={v}
              controls
              playsInline
              className="max-h-[22rem] w-full"
              onError={() => setNativeErr(true)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function IconPdfBadge() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-bold leading-tight tracking-wide text-white shadow-inner">
      PDF
    </div>
  )
}

function PdfStorageField({ id, title, required, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [pickNonce, setPickNonce] = useState(0)
  const v = String(value ?? '').trim()
  const show = isLikelyHttpUrl(v) || v.startsWith('data:application/pdf')
  const bumpPickInput = () => setPickNonce((n) => n + 1)
  const displayRef =
    v.startsWith('data:application/pdf') ? 'Mahalliy PDF fayl' : v

  return (
    <div>
      <label htmlFor={`${id}-file`} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <DashedMediaShell>
        <input
          key={pickNonce}
          id={`${id}-file`}
          type="file"
          accept=".pdf,application/pdf"
          disabled={busy}
          className={fileInputCls}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            setErr(null)
            if (!f) return
            if (f.size > MAX_FILE_DATA_URL_BYTES) {
              setErr(
                `PDF juda katta (maks. ~${Math.round(MAX_FILE_DATA_URL_BYTES / (1024 * 1024))} MB). Boshqa fayl tanlang.`,
              )
              bumpPickInput()
              return
            }
            setBusy(true)
            try {
              const dataUrl = await readFileAsDataUrl(f)
              onChange(dataUrl)
            } catch {
              setErr('PDF ni o‘qib bo‘lmadi — qayta urinib ko‘ring.')
            } finally {
              setBusy(false)
            }
          }}
        />
        {busy && (
          <p className="mt-2 text-xs text-zinc-500">PDF o‘qilmoqda…</p>
        )}
        {err && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {err}
          </p>
        )}
        {v && (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
            onClick={() => {
              setErr(null)
              onChange('')
              bumpPickInput()
            }}
          >
            Tanlovni bekor qilish
          </button>
        )}
      </DashedMediaShell>
      <p className={hintCls}>
        PDF faylni shu yerdan tanlang — pastda oldindan ko‘rinish chiqadi.
      </p>
      {show && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
          <div className="flex flex-col gap-3 border-b border-zinc-100 bg-gradient-to-r from-red-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconPdfBadge />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">PDF hujjat</p>
                <p className="truncate text-xs text-zinc-500">{displayRef}</p>
              </div>
            </div>
            <a
              href={v}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
            >
              Yangi oynada ochish
            </a>
          </div>
          <div className="bg-zinc-100 p-2">
            <iframe
              title="PDF"
              src={v}
              className="h-[min(28rem,70vh)] w-full rounded-lg border border-zinc-200 bg-white"
            />
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Baʼzi serverlar PDF ni iframe da ochishga ruxsat bermaydi — shunda
              yuqoridagi tugmadan foydalaning.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function GenericFileStorageField({ id, title, required, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [pickNonce, setPickNonce] = useState(0)
  const bumpPickInput = () => setPickNonce((n) => n + 1)
  const v = String(value ?? '').trim()

  return (
    <div>
      <label htmlFor={`${id}-file`} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <DashedMediaShell>
        <input
          key={pickNonce}
          id={`${id}-file`}
          type="file"
          disabled={busy}
          className={fileInputCls}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            setErr(null)
            if (!f) return
            if (f.size > MAX_FILE_DATA_URL_BYTES) {
              setErr(
                `Fayl juda katta (maks. ~${Math.round(MAX_FILE_DATA_URL_BYTES / (1024 * 1024))} MB). Boshqa fayl tanlang.`,
              )
              bumpPickInput()
              return
            }
            setBusy(true)
            try {
              onChange(await readFileAsDataUrl(f))
            } catch {
              setErr('Faylni o‘qib bo‘lmadi — qayta urinib ko‘ring.')
            } finally {
              setBusy(false)
            }
          }}
        />
        {busy && (
          <p className="mt-2 text-xs text-zinc-500">Fayl o‘qilmoqda…</p>
        )}
        {err && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {err}
          </p>
        )}
        {v && (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
            onClick={() => {
              setErr(null)
              onChange('')
              bumpPickInput()
            }}
          >
            Tanlovni bekor qilish
          </button>
        )}
      </DashedMediaShell>
      <p className={hintCls}>
        Faylni shu yerdan tanlang.
      </p>
    </div>
  )
}

function CustomSelectDropdown({
  id,
  title,
  required,
  options,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = value ?? ''

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <label id={`${id}-label`} htmlFor={id} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
        className={fieldTriggerCls}
      >
        <span
          className={
            selected ? 'truncate text-zinc-900' : 'truncate text-zinc-500'
          }
        >
          {selected || '— tanlang —'}
        </span>
        <span
          className={`inline-block shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <ul role="listbox" className={listPanelCls}>
          {!required && (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={!selected}
                className="w-full px-3 py-2.5 text-left text-sm text-zinc-500 hover:bg-zinc-50"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                — tanlang —
              </button>
            </li>
          )}
          {options.map((opt) => (
            <li key={opt} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected === opt}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 ${
                  selected === opt
                    ? 'bg-blue-50 font-medium text-blue-900'
                    : 'text-zinc-900'
                }`}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RatingStars({ id, value, onChange, required }) {
  const current =
    typeof value === 'number' && Number.isFinite(value) && value >= 1
      ? value
      : 0

  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-legend`}
      className="flex flex-wrap items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = current >= star
        return (
          <button
            key={star}
            type="button"
            aria-checked={active}
            role="radio"
            aria-label={`${star} yulduz`}
            className={`rounded-md px-1.5 py-0.5 text-2xl leading-none transition ${
              active ? 'text-amber-500' : 'text-zinc-300 hover:text-zinc-400'
            }`}
            onClick={() => onChange(star)}
          >
            ★
          </button>
        )
      })}
      {!required && current >= 1 && (
        <button
          type="button"
          className="ml-2 text-xs text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          onClick={() => onChange('')}
        >
          Tozalash
        </button>
      )}
    </div>
  )
}

function MultiselectCheckboxDropdown({
  id,
  title,
  required,
  options,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const arr = Array.isArray(value) ? value : []

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (opt) => {
    if (arr.includes(opt)) onChange(arr.filter((x) => x !== opt))
    else onChange([...arr, opt])
  }

  const summary =
    arr.length === 0
      ? '— variantlarni tanlang —'
      : arr.length <= 2
        ? arr.join(', ')
        : `${arr.length} ta tanlangan`

  return (
    <div ref={rootRef} className="relative">
      <label id={`${id}-label`} htmlFor={id} className={labelCls}>
        {title}
        <RequiredMark required={required} />
      </label>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((v) => !v)}
        className={fieldTriggerCls}
      >
        <span
          className={
            arr.length ? 'truncate text-zinc-900' : 'truncate text-zinc-500'
          }
        >
          {summary}
        </span>
        <span
          className={`inline-block shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <ul role="listbox" aria-multiselectable="true" className={listPanelCls}>
          {options.map((opt) => (
            <li key={opt} role="presentation">
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-900 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={arr.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="size-4 shrink-0 rounded border-zinc-300 text-blue-600 accent-blue-600"
                />
                <span className="select-none">{opt}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ApplicationQuestionInput({ question, value, onChange }) {
  const { _id, question: title, type, required, options = [], placeholder } = question
  const id = `q-${_id}`
  const set = (next) => onChange(next)

  const choiceLabel = 'flex cursor-pointer items-center gap-2 text-sm text-zinc-800'

  switch (type) {
    case 'textarea':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <textarea
            id={id}
            rows={4}
            className={fieldCls}
            placeholder={placeholder || ''}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'select':
      return (
        <CustomSelectDropdown
          id={id}
          title={title}
          required={required}
          options={options}
          value={value}
          onChange={set}
        />
      )

    case 'radio':
      return (
        <fieldset>
          <legend id={`${id}-legend`} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </legend>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <label key={opt} className={choiceLabel}>
                <input
                  type="radio"
                  name={id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => set(opt)}
                  className="size-4 border-zinc-300 text-blue-600 accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      )

    case 'multiselect':
      return (
        <MultiselectCheckboxDropdown
          id={id}
          title={title}
          required={required}
          options={options}
          value={value}
          onChange={set}
        />
      )

    case 'checkbox': {
      const arr = Array.isArray(value) ? value : []
      const toggle = (opt) => {
        if (arr.includes(opt)) set(arr.filter((x) => x !== opt))
        else set([...arr, opt])
      }
      return (
        <fieldset>
          <legend id={`${id}-legend`} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </legend>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <label key={opt} className={choiceLabel}>
                <input
                  type="checkbox"
                  checked={arr.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="size-4 rounded border-zinc-300 text-blue-600 accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      )
    }

    case 'boolean':
      return (
        <fieldset>
          <legend id={`${id}-legend`} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
            {!required && (
              <label className={choiceLabel}>
                <input
                  type="radio"
                  name={id}
                  checked={value !== true && value !== false}
                  onChange={() => set(undefined)}
                  className="size-4 border-zinc-300 text-blue-600 accent-blue-600"
                />
                Javob bermaslik
              </label>
            )}
            <label className={choiceLabel}>
              <input
                type="radio"
                name={id}
                checked={value === true}
                onChange={() => set(true)}
                className="size-4 border-zinc-300 text-blue-600 accent-blue-600"
              />
              Ha
            </label>
            <label className={choiceLabel}>
              <input
                type="radio"
                name={id}
                checked={value === false}
                onChange={() => set(false)}
                className="size-4 border-zinc-300 text-blue-600 accent-blue-600"
              />
              Yo‘q
            </label>
          </div>
        </fieldset>
      )

    case 'number':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="number"
            className={fieldCls}
            placeholder={placeholder || ''}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'rating':
      return (
        <fieldset>
          <legend id={`${id}-legend`} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </legend>
          <RatingStars id={id} value={value} onChange={set} required={required} />
          <p className={hintCls}>1 dan 5 gacha yulduzcha baholash.</p>
        </fieldset>
      )

    case 'range': {
      const num = value === '' ? null : Number(value)
      const sliderVal = Number.isFinite(num) ? num : 0

      if (!required && value === '') {
        return (
          <div>
            <label className={labelCls}>
              {title}
              <RequiredMark required={required} />
            </label>
            <p className={`${hintCls} mb-3`}>
              Ixtiyoriy. Diapazon 0–100. Ishtirok etish uchun tugmani bosing.
            </p>
            <button
              type="button"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
              onClick={() => set(50)}
            >
              Qiymat tanlash
            </button>
          </div>
        )
      }

      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id={id}
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderVal}
              onChange={(e) => set(Number(e.target.value))}
              className="w-full flex-1 accent-blue-600"
            />
            <span className="w-12 text-center font-mono text-sm tabular-nums text-zinc-700">
              {sliderVal}
            </span>
          </div>
          <p className={hintCls}>0 dan 100 gacha.</p>
        </div>
      )
    }

    case 'date':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="date"
            className={fieldCls}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'time':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="time"
            className={fieldCls}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'datetime':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="datetime-local"
            className={fieldCls}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
          <p className={hintCls}>
            Sana va vaqtni tanlang — yuborishda server talab qiladigan formatga
            moslanadi.
          </p>
        </div>
      )

    case 'month':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="month"
            className={fieldCls}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'week':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="week"
            className={fieldCls}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'image':
      return (
        <ImageStorageField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
        />
      )

    case 'video':
      return (
        <VideoStorageField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
        />
      )

    case 'pdf':
      return (
        <PdfStorageField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
        />
      )

    case 'file':
      return (
        <GenericFileStorageField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
        />
      )

    case 'email':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            className={fieldCls}
            placeholder={placeholder || 'email@example.com'}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'url':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="url"
            inputMode="url"
            className={fieldCls}
            placeholder={placeholder || 'https://...'}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    case 'password':
      return (
        <PasswordField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
          placeholder={placeholder}
        />
      )

    case 'phone':
      return (
        <PhoneField
          id={id}
          title={title}
          required={required}
          value={value}
          onChange={set}
        />
      )

    case 'text':
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="text"
            className={fieldCls}
            placeholder={placeholder || ''}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      )

    default:
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {title}
            <RequiredMark required={required} />
          </label>
          <input
            id={id}
            type="text"
            className={fieldCls}
            placeholder={placeholder || ''}
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
          />
          <p className={hintCls}>
            Noma’lum savol turi: <code className="text-zinc-600">{type}</code>{' '}
            — matn sifatida kiritiladi.
          </p>
        </div>
      )
  }
}
