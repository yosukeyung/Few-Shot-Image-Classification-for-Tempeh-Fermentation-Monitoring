import React, { useEffect, useState } from 'react'

export const ConfidenceRing = ({ percentage = 0, size = 120, strokeWidth = 8, color = 'var(--color-secondary-fixed)' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    // Animate progress ring on load
    const progressOffset = circumference - (percentage * circumference)
    const timeout = setTimeout(() => {
      setOffset(progressOffset)
    }, 100)
    return () => clearTimeout(timeout)
  }, [percentage, circumference])

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.03)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated Progress Circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 4px ${color})`
          }}
        />
      </svg>
      {/* Inner Centered Percentage Text */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1
      }}>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          color: 'var(--color-on-surface)' 
        }}>
          {(percentage * 100).toFixed(0)}%
        </span>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.55rem', 
          color: 'var(--color-outline)',
          marginTop: '0.25rem',
          letterSpacing: '0.05em'
        }}>
          CONFIDENCE
        </span>
      </div>
    </div>
  )
}
export default ConfidenceRing
