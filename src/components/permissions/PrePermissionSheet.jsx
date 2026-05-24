/**
 * 시스템 권한 팝업 이전에 띄우는 자체 안내 시트.
 * - 사용자가 "허용"을 누르면 → 실제 시스템 권한 요청을 호출한다.
 * - "나중에"를 누르면 → 시스템 팝업을 띄우지 않고 닫는다.
 */
function PrePermissionSheet({
  open,
  icon,
  title,
  description,
  bullets,
  primaryLabel = '허용하기',
  secondaryLabel = '나중에',
  loading = false,
  onAllow,
  onDismiss,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={loading ? undefined : onDismiss}
        aria-hidden="true"
      />
      <div className="relative z-[1] m-3 w-full max-w-sm rounded-3xl bg-white px-6 py-7 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.4)] sm:m-0">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft,#f4f4f6)] text-2xl">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-mono-700">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-mono-500">{description}</p>
            )}
          </div>
          {bullets?.length > 0 && (
            <ul className="w-full space-y-2 rounded-2xl bg-mono-100/70 px-4 py-3 text-left text-xs leading-relaxed text-mono-600">
              {bullets.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent,#111)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onAllow}
            className="w-full rounded-2xl bg-[var(--accent,#111)] py-3 text-sm font-semibold text-[var(--accent-foreground,#fff)] disabled:opacity-60"
          >
            {loading ? '잠시만요…' : primaryLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onDismiss}
            className="w-full rounded-2xl bg-mono-100 py-3 text-sm font-semibold text-mono-600 disabled:opacity-60"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrePermissionSheet
