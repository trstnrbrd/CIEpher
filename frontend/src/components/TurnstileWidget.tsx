import { useEffect, useRef, useState } from 'react'
import { TURNSTILE_SITE_KEY } from '../turnstile'
import './TurnstileWidget.css'

// Cloudflare Turnstile: the "I'm not a robot" check on the Register card.

type Turnstile = {
  render: (box: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Cloudflare's script is loaded once, the first time the widget is shown.
let loading: Promise<Turnstile> | null = null

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error('Turnstile did not start'))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Turnstile could not load'))
    }
    document.head.appendChild(script)
  })
  return loading
}

interface TurnstileWidgetProps {
  // The token once the player passes, or null while there isn't a valid one.
  // A token works once: give the widget a new `key` to start a fresh check.
  onToken: (token: string | null) => void
}

function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const box = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState<boolean>(false)
  // True when the box is too narrow for the wide widget (small phones).
  const [compact, setCompact] = useState<boolean>(false)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let widgetId: string | null = null
    let active = true
    loadTurnstile()
      .then((turnstile) => {
        if (!active || !box.current) return
        // The wide widget needs 300px; small phones get the compact one.
        const small = box.current.clientWidth < 300
        setCompact(small)
        widgetId = turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: small ? 'compact' : 'flexible',
          theme: 'light',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
      if (widgetId) window.turnstile?.remove(widgetId)
      onToken(null)
    }
  }, [onToken])

  if (!TURNSTILE_SITE_KEY) return null
  return (
    <div className="turnstile">
      <div
        ref={box}
        className={compact ? 'turnstile-box is-compact' : 'turnstile-box'}
      />
      {failed && (
        <span className="field-error" role="alert">
          The robot check couldn't load. Check your internet, then reload the
          page.
        </span>
      )}
    </div>
  )
}

export default TurnstileWidget
