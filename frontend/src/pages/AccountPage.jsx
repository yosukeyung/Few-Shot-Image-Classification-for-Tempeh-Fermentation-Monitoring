import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import Input from '../components/Input'
import Button from '../components/Button'
import './AccountPage.css'

export const AccountPage = () => {
  const { user, profile, updateProfile, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const isLight = document.body.classList.contains('light-theme')
    setDarkMode(!isLight)
  }, [])

  const handleThemeToggle = (e) => {
    const isDark = e.target.checked
    setDarkMode(isDark)
    if (isDark) {
      document.body.classList.remove('light-theme')
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.add('light-theme')
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setInstitution(profile.institution || '')
    }
  }, [profile])

  // Get initials for avatar
  const getInitials = () => {
    if (!profile?.full_name) return 'RE'
    return profile.full_name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Generate a consistent researcher ID from user UUID
  const getResearcherId = () => {
    if (!user?.id) return 'RE-0000-0000'
    const shortId = user.id.replace(/-/g, '').substring(0, 8).toUpperCase()
    return `RE-${shortId.substring(0, 4)}-${shortId.substring(4, 8)}`
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      addToast('Full name is required for profile update.', 'warning')
      return
    }

    setSavingProfile(true)
    try {
      await updateProfile({ full_name: fullName.trim(), institution: institution.trim() })
      addToast('Researcher profile updated successfully.', 'success')
    } catch (err) {
      addToast(err.message || 'Profile update failed.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }



  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.warn('Supabase signOut failed, performing local redirection:', err)
    } finally {
      addToast('Session terminated. Returning to platform home.', 'info')
      navigate('/')
    }
  }

  return (
    <div className="account-container">
      {/* HEADER */}
      <div>
        <h1 className="h1-text" style={{ fontSize: '1.5rem' }}>Researcher Profile</h1>
        <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
          Manage identity, preferences, and security credentials
        </p>
      </div>

      <div className="account-grid">
        {/* LEFT COL: Identity Card */}
        <GlassCard className="identity-card" hover={false}>
          {/* Avatar with orbital rings */}
          <div className="avatar-orbit-wrapper">
            <div className="avatar-ring" />
            <div className="avatar-ring-inner" />
            <div className="avatar-circle">{getInitials()}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <h2 className="h2-text" style={{ fontSize: '1.25rem' }}>
              {profile?.full_name || 'Researcher'}
            </h2>
            <span className="researcher-id">{getResearcherId()}</span>
          </div>

          <StatusBadge status="active" label="ACTIVE SESSION" />

          <div className="identity-divider" />

          {/* System Preferences */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-outline)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'left' }}>
              SYSTEM PREFERENCES
            </span>

            <div className="toggle-row">
              <span className="toggle-label">Dark Mode</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={handleThemeToggle} 
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="identity-divider" />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 180, 171, 0.05)',
              border: '1px solid rgba(255, 180, 171, 0.15)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 180, 171, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 180, 171, 0.05)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
            TERMINATE SESSION
          </button>
        </GlassCard>

        {/* RIGHT COL: Forms */}
        <GlassCard className="profile-form-card" hover={false}>
          {/* Profile Section */}
          <form onSubmit={handleUpdateProfile} className="profile-section">
            <span className="profile-section-title">
              Researcher Identity Protocol
            </span>

            <div className="profile-form-row">
              <Input
                label="Full Name"
                placeholder="Dr. Alexander Wright"
                icon="badge"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={savingProfile}
              />
              <Input
                label="Research Institution"
                placeholder="Computational Biology Institute"
                icon="apartment"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                disabled={savingProfile}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" loading={savingProfile} icon="save">
                UPDATE PROFILE
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

export default AccountPage
