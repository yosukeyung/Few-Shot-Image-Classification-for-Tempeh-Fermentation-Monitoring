import React from 'react'

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  loading = false, 
  type = 'button',
  className = '',
  icon = null
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${loading ? 'shimmer-loading' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-orbit" style={{ fontSize: '1rem' }}>
            sync
          </span>
          PROCESSING...
        </>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}
export default Button
