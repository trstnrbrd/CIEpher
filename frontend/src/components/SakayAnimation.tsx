import sakayVideo from '../assets/prologue/sakay animation.mp4'
import './SakayAnimation.css'

interface SakayAnimationProps {
  // Called when the video finishes (or the player skips it).
  onFinish: () => void
}

// Full-screen player for the "sakay" animation that plays after the last
// prologue puzzle: the jeepney ride to school. Plays automatically and
// closes on its own when the video ends, or when the player hits SKIP.
function SakayAnimation({ onFinish }: SakayAnimationProps) {
  return (
    <div className="sakay-screen">
      <div className="sakay-card">
        <video
          className="sakay-video"
          src={sakayVideo}
          autoPlay
          muted
          playsInline
          controls
          onEnded={onFinish}
        />
        <button
          type="button"
          className="pixel-button sakay-skip"
          onClick={onFinish}
        >
          SKIP
        </button>
      </div>
    </div>
  )
}

export default SakayAnimation