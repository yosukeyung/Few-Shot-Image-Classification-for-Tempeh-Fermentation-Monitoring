import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './SideNavBar.css'

export const SideNavBar = () => {
  const { profile, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.warn('Supabase signOut failed, performing local redirection:', err)
    } finally {
      addToast('Session terminated. Secure connection closed.', 'info')
      navigate('/')
    }
  }

  // Get researcher initials
  const getInitials = () => {
    if (!profile?.full_name) return 'RE'
    return profile.full_name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <Link to="/dashboard" className="sidebar-brand">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          biotech
        </span>
        TEMPE.AI
      </Link>

      {/* Researcher profile info */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar-wrapper">
          <div className="sidebar-avatar">
            <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {getInitials()}
            </span>
          </div>
          <div className="sidebar-status-dot"></div>
        </div>
        <div className="sidebar-profile-info">
          <span className="sidebar-profile-name" title={profile?.full_name || 'Researcher'}>
            {profile?.full_name || 'Researcher'}
          </span>
          <span className="sidebar-profile-role">Active Session</span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="sidebar-nav">
        <Link to="/" className="sidebar-link">
          <span className="material-symbols-outlined sidebar-link-icon">home</span>
          Landing Page
        </Link>
        
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined sidebar-link-icon">dashboard</span>
          Dashboard
        </NavLink>
        
        <NavLink to="/classify" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined sidebar-link-icon">biotech</span>
          Classifier
        </NavLink>
        
        <NavLink to="/archive" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined sidebar-link-icon">history</span>
          Archive
        </NavLink>
        
        <NavLink to="/account" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined sidebar-link-icon">settings</span>
          Profile
        </NavLink>
      </nav>

      {/* Logout button at bottom */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <span className="material-symbols-outlined sidebar-link-icon">logout</span>
          Terminate Session
        </button>
      </div>
    </aside>
  )
}
export default SideNavBar
