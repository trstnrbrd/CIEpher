import { useState, type InputHTMLAttributes } from 'react'
import './PasswordInput.css'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// A pixel eye on a 16x16 grid: [x, y, width, height] for each block.
const EYE: [number, number, number, number][] = [
  [5, 4, 6, 1],
  [3, 5, 2, 1],
  [11, 5, 2, 1],
  [2, 6, 1, 1],
  [13, 6, 1, 1],
  [1, 7, 1, 2],
  [14, 7, 1, 2],
  [2, 9, 1, 1],
  [13, 9, 1, 1],
  [3, 10, 2, 1],
  [11, 10, 2, 1],
  [5, 11, 6, 1],
  // the pupil
  [7, 6, 2, 1],
  [6, 7, 4, 2],
  [7, 9, 2, 1],
]

// A diagonal line across the eye, drawn while the password is visible.
const SLASH: [number, number, number, number][] = Array.from(
  { length: 13 },
  (_, i) => [i + 1, 13 - i, 2, 1],
)

// A password box with an eye button that shows or hides what's typed. It
// keeps each form's own input style: pass the usual className.
function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        // Phones would capitalize or "fix" a password once it's visible.
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        // Keep the cursor in the box, so the player can keep typing.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
      >
        <svg
          viewBox="0 0 16 16"
          width="20"
          height="20"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {EYE.map(([x, y, w, h]) => (
            <rect
              key={`eye-${x}-${y}`}
              x={x}
              y={y}
              width={w}
              height={h}
              fill="currentColor"
            />
          ))}
          {visible &&
            SLASH.map(([x, y, w, h]) => (
              <rect
                key={`slash-${x}-${y}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="currentColor"
              />
            ))}
        </svg>
      </button>
    </div>
  )
}

export default PasswordInput
