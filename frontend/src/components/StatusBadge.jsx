import React from 'react'

export const StatusBadge = ({ status = 'online', label, className = '' }) => {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
      case 'ready':
      case 'success':
      case 'day_2':
        return {
          bg: 'rgba(161, 212, 148, 0.1)',
          border: 'rgba(161, 212, 148, 0.2)',
          dot: 'var(--color-primary)'
        }
      case 'warning':
      case 'pending':
      case 'day_1':
        return {
          bg: 'rgba(255, 208, 67, 0.1)',
          border: 'rgba(255, 208, 67, 0.2)',
          dot: '#ffd043'
        }
      case 'offline':
      case 'disabled':
        return {
          bg: 'rgba(140, 147, 135, 0.1)',
          border: 'rgba(140, 147, 135, 0.2)',
          dot: 'var(--color-outline)'
        }
      case 'error':
      case 'danger':
      case 'day_0':
      default:
        return {
          bg: 'rgba(255, 180, 171, 0.1)',
          border: 'rgba(255, 180, 171, 0.2)',
          dot: 'var(--color-error)'
        }
    }
  }

  const colors = getColors()

  return (
    <div 
      className={`mono-tag ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.dot,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        textTransform: 'uppercase'
      }}
    >
      <span 
        className="animate-pulse-glow" 
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.dot,
          boxShadow: `0 0 8px ${colors.dot}`,
          display: 'inline-block'
        }}
      />
      {label || status}
    </div>
  )
}
export default StatusBadge
