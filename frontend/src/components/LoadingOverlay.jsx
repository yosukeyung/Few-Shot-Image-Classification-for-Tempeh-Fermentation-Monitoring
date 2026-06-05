import React, { useEffect, useState } from 'react'
import './LoadingOverlay.css'

export const LoadingOverlay = ({ active = false }) => {
  const [statusIndex, setStatusIndex] = useState(0)
  
  const statusTexts = [
    'ALIGNING SPECIMEN COORDINATES...',
    'ISOLATING FUNGAL MYCELIUM SURFACE...',
    'EXTRACTING RESNET-18 VECTOR EMBEDDING...',
    'COMPUTING LATENT METRIC DISTANCES...',
    'RESOLVING MATURITY DECISION STATE...',
  ]

  useEffect(() => {
    if (!active) {
      setStatusIndex(0)
      return
    }

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusTexts.length)
    }, 1200)

    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div className="loading-overlay">
      {/* Target Framing Box */}
      <div className="loading-hud-box">
        {/* Bounding markers */}
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* Scan lines */}
        <div className="loading-scan-line" />

        {/* Orbiting reticle */}
        <span className="material-symbols-outlined loading-reticle">
          radar
        </span>
      </div>

      {/* Clinical text status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div className="loading-text-status">{statusTexts[statusIndex]}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-outline)', letterSpacing: '0.1em' }}>
          CPU INFERENCE CORE ACTIVE
        </div>
        <div className="loading-progress-bar-container">
          <div className="loading-progress-bar-fill" />
        </div>
      </div>
    </div>
  )
}
export default LoadingOverlay
