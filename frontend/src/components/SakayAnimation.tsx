import { useEffect, useRef } from 'react'
import sakayVideo from '../assets/prologue/sakay animation.mp4'
import sakayVideoGirl from '../assets/prologue/sakay animation_g.mp4'
import { fadeBgmIn, fadeBgmOut } from '../sound'
import './SakayAnimation.css'

interface SakayAnimationProps {
  // The prologue ending has two versions, one per avatar.
  girl: boolean
  // Called when the video finishes (or the player skips it).
  onFinish: () => void
  // Custom video sources for scenes other than the jeepney ride (e.g. the
  // chapter 1 hallway walk into the university, or chapter 4 pc assignment).
  // Defaults to the sakay ride when omitted.
  videoSrc?: string
  videoSrcGirl?: string
}

// Full-screen player for the mission cut-scene videos: the jeepney ride to
// school after the prologue, the hallway walk into the university after
// chapter 1's gate exercise, or the chapter 4 computer assignment.
// Plays automatically, smoothly ducks BGM volume to 0 during playback,
// restores BGM smoothly when closed, and closes on its own when the video
// ends or when the player hits SKIP.
function SakayAnimation({
  girl,
  onFinish,
  videoSrc,
  videoSrcGirl,
}: SakayAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Smoothly duck BGM to 0 while any cutscene video is playing
    fadeBgmOut(700)

    // Ensure playback starts smoothly
    if (videoRef.current) {
      const playPromise = videoRef.current.play()
      if (playPromise) {
        playPromise.catch(() => {
          // If unmuted autoplay is blocked by browser policy, mute and retry
          if (videoRef.current) {
            videoRef.current.muted = true
            void videoRef.current.play().catch(() => {})
          }
        })
      }
    }

    return () => {
      // Smoothly restore BGM from 0 to 100 when cutscene ends or unmounts
      fadeBgmIn(1000)
    }
  }, [])

  return (
    <div className="sakay-screen">
      <div className="sakay-card">
        <video
          ref={videoRef}
          className="sakay-video"
          src={girl ? videoSrcGirl ?? sakayVideoGirl : videoSrc ?? sakayVideo}
          autoPlay
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