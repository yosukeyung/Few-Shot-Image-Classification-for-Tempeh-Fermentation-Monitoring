import React from 'react'
import StatusBadge from './StatusBadge'
import './HUDViewport.css'

export const HUDViewport = ({ 
  children, 
  status = 'ready', 
  label = 'specimen analyzer', 
  info = 'fsl-node 2.1', 
  scanning = false,
  aspectRatio = '4 / 3'
}) => {
  return (
    <div className="hud-viewport" style={{ aspectRatio }}>
      {/* Corner bounding frames */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Target Reticle */}
      <div className="hud-crosshair" />

      {/* Dynamic scan line */}
      {scanning && <div className="hud-scanning-line animate-scan" />}

      {/* Status Overlay */}
      <div className="hud-status-tag">
        <StatusBadge 
          status={
            status === 'active' || status === 'live' || status === 'recording' ? 'active' :
            status === 'analyzing' || status === 'processing' ? 'warning' : status
          } 
          label={label} 
        />
      </div>

      {/* Meta Labels */}
      <div className="hud-lens-tag">
        SYS_LENS: {info}
      </div>
      
      <div className="hud-dimension-tag">
        MAG: 4.0X
      </div>

      {/* Content wrapper */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}
export default HUDViewport
