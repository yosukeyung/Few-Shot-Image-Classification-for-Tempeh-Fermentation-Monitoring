import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-secondary-fixed)',
        fontFamily: 'var(--font-mono)'
      }}>
        <div className="shimmer-loading" style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid rgba(99, 247, 255, 0.2)',
          borderTopColor: 'var(--color-secondary-fixed)',
          animation: 'orbit 1s linear infinite'
        }}></div>
        <div style={{ marginTop: '1.5rem', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
          VERIFYING ACCESS PROTOCOL...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}
export default AuthGuard
