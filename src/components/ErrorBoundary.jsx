import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || '알 수 없는 오류가 발생했습니다.'
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-white px-6 py-10 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-3xl border border-mono-200 bg-white/95 px-6 py-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.32)]">
          <div className="text-3xl">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-mono-700">앱을 불러오지 못했어요</p>
            <p className="mt-1 text-xs leading-relaxed text-mono-500">{message}</p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-2xl bg-[var(--accent,#111)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
