import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onStart: () => void
  loading?: boolean
  dimmed?: boolean
}

function WelcomeScreen({ onStart, loading = false, dimmed = false }: WelcomeScreenProps) {
  return (
    <>
      <div className={`welcome-screen ${dimmed ? 'blurred' : ''}`}>
        <div className="welcome-bg" />
        <div className="welcome-overlay" />

        <div className="cloud-layer">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-5" />
        </div>

        <div className="welcome-content">
          <h1 className="welcome-title welcome-subtitle">WELCOME TO</h1>
          <h1 className="welcome-title welcome-main-title">CIEPHER</h1>
        </div>

        {!loading && (
          <button className="start-button" onClick={onStart}>
            START
          </button>
        )}
      </div>
    </>
  )
}

export default WelcomeScreen