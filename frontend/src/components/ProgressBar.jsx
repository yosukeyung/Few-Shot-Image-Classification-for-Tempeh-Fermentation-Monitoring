import React from 'react'

export const ProgressBar = ({ label, percentage = 0, color = 'var(--color-primary)' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-on-surface)', fontWeight: 500 }}>
          {(percentage * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{
        height: '6px',
        backgroundColor: 'var(--color-surface-container-high)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        width: '100%',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: color,
          width: `${percentage * 100}%`,
          borderRadius: 'var(--radius-full)',
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
      </div>
    </div>
  )
}
export default ProgressBar
