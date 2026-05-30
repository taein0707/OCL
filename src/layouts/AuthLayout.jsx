import { useMobileKeyboardOpen } from '../hooks/useMobileKeyboardOpen.js'

function AuthLayout({ children }) {
  const keyboardOpen = useMobileKeyboardOpen()

  return (
    <div className={`auth-screen-shell ${keyboardOpen ? 'auth-screen-shell-keyboard' : ''}`}>
      <div className="auth-screen-inner w-full">{children}</div>
    </div>
  )
}

export default AuthLayout
