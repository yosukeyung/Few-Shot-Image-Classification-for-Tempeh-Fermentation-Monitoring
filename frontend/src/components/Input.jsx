import React from 'react'

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error = '',
  icon = null,
  className = '',
  name,
  disabled = false
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <span 
            className="material-symbols-outlined" 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-outline)',
              fontSize: '1.25rem',
              pointerEvents: 'none'
            }}
          >
            {icon}
          </span>
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="form-input"
          style={{
            width: '100%',
            paddingLeft: icon ? '2.75rem' : '1rem',
            borderColor: error ? 'var(--color-error)' : undefined,
            boxShadow: error ? '0 0 10px rgba(255, 180, 171, 0.15)' : undefined
          }}
        />
      </div>
      {error && (
        <span 
          style={{ 
            color: 'var(--color-error)', 
            fontSize: '0.75rem', 
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem' 
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
export default Input
