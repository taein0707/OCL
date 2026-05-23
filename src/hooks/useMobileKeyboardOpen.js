import { useEffect, useState } from 'react'

function isTextField(target) {
  return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function useMobileKeyboardOpen() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.visualViewport) return

    let focused = false
    const baselineHeight = window.visualViewport.height

    const update = () => {
      const viewport = window.visualViewport
      const mobile = window.innerWidth < 768
      const shrink = baselineHeight - viewport.height
      setKeyboardOpen(mobile && focused && shrink > 140)
    }

    const handleFocusIn = (event) => {
      focused = isTextField(event.target)
      update()
    }

    const handleFocusOut = () => {
      focused = false
      setTimeout(update, 50)
    }

    window.visualViewport.addEventListener('resize', update)
    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      window.visualViewport.removeEventListener('resize', update)
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return keyboardOpen
}
