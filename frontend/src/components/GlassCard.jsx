import React from 'react'

export const GlassCard = ({ children, className = '', hover = true, style = {} }) => {
  return (
    <div 
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
export default GlassCard
