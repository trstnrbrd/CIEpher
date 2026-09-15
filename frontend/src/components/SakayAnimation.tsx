import sakayVideo from '../assets/prologue/sakay animation.mp4'
import sakayVideoGirl from '../assets/prologue/sakay animation_g.mp4'
import './SakayAnimation.css'

interface SakayAnimationProps {
  // The prologue ending has two versions, one per avatar.
  girl: boolean
  // Called when the video finishes (or the player skips it).
  onFinish: () => void
  // Custom video sources for scenes other than the jeepney ride (e.g. the
  // chapter 1 hallway walk into the university). Defaults to the sakay ride
  // when omitted.
  videoSrc?: string
  videoSrcGirl?: string
}

// Full-screen player for the mission cut-scene videos: the jeepney ride to
// school after the prologue, or the hallway walk into the university after
// chapter 1's gate exercise. Plays automatically and closes on its own when
// the video ends, or when the player hits SKIP.
function SakayAnimation({
  girl,
  onFinish,
  videoSrc,
  videoSrcGirl,
}: SakayAnimationProps) {
  return (
    <div className="sakay-screen">
      <div className="sakay-card">
        <video
          className="sakay-video"
          src={girl ? videoSrcGirl ?? sakayVideoGirl : videoSrc ?? sakayVideo}
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