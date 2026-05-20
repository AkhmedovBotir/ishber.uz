import { Link } from 'react-router-dom'

/**
 * Google Docs / Forms uslubidagi yuqori panel: oq fon, pastki chiziq, sarlavha.
 */
export default function AppHeader({
  primaryTitle,
  secondary,
  right,
  /** "forma" | "bosh" — chap ikonka rangi */
  variant = 'form',
}) {
  const iconBg =
    variant === 'form'
      ? 'bg-[#673ab7]'
      : 'bg-zinc-800'

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:h-[3.25rem] sm:px-6">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold tracking-tight text-white sm:h-10 sm:w-10 sm:text-xs ${iconBg}`}
          aria-hidden
        >
          i
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-normal leading-snug text-zinc-900 sm:text-[1.25rem]">
            {primaryTitle ?? 'ishber.uz'}
          </h1>
          {secondary ? (
            <p className="truncate text-xs leading-tight text-zinc-500 sm:text-[13px]">
              {secondary}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          {right ?? (
            <Link
              to="/"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Bosh sahifa
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
