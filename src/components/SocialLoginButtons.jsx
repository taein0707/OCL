function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

const baseButtonClass =
  'flex min-h-[56px] w-full items-center justify-center gap-3 rounded-[22px] border px-5 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-50'

function SocialLoginButtons({ onGoogle, onApple, onEmail, disabled }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onGoogle}
        className={`${baseButtonClass} border-mono-300 bg-white text-ink shadow-[0_18px_34px_-26px_rgba(0,0,0,0.2)] hover:bg-mono-50 active:translate-y-[1px]`}
      >
        <GoogleLogo />
        <span>Google로 로그인</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onApple}
        className={`${baseButtonClass} border-mono-900 bg-mono-900 text-white shadow-[0_22px_40px_-28px_rgba(0,0,0,0.85)] hover:bg-black active:translate-y-[1px]`}
      >
        <AppleLogo />
        <span>Apple로 로그인</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onEmail}
        className={`${baseButtonClass} border-mono-300 bg-mono-100 text-ink shadow-[0_16px_30px_-24px_rgba(0,0,0,0.14)] hover:bg-mono-200 active:translate-y-[1px]`}
      >
        <span>이메일로 로그인</span>
      </button>
    </div>
  )
}

export default SocialLoginButtons
