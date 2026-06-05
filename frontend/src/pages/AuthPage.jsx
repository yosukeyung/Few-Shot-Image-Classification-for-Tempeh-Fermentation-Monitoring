import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GlassCard from '../components/GlassCard'
import Input from '../components/Input'
import Button from '../components/Button'
import heroMycelium from '../assets/hero-mycelium.png'
import './AuthPage.css'

export const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // State
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation errors
  const [errors, setErrors] = useState({})

  // Set tab based on state passed via navigation
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location])

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    setErrors({})
    setPassword('')
    setConfirmPassword('')
  }

  const validate = () => {
    const err = {}
    if (!email) {
      err.email = 'Email address is required.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      err.email = 'Invalid email address syntax.'
    }

    if (!password) {
      err.password = 'Security password is required.'
    } else if (password.length < 6) {
      err.password = 'Password must be at least 6 characters.'
    }

    if (activeTab === 'register') {
      if (!fullName) {
        err.fullName = 'Full identity name is required.'
      }
      if (password !== confirmPassword) {
        err.confirmPassword = 'Security passwords do not match.'
      }
    }

    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (activeTab === 'login') {
        await signIn(email, password)
        addToast('Authorization successful. Secure token established.', 'success')
        navigate('/dashboard')
      } else {
        await signUp(email, password, fullName)
        addToast('Registration complete. Verification code sent if required.', 'success')
        // Automatically switch to login tab or sign in directly
        addToast('Profile created. Establishing session...', 'info')
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err) {
      addToast(err.message || 'Authorization protocol failure.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-viewport bg-hex-grid">
      {/* LEFT COLUMN: Visual Panel */}
      <div className="auth-visual-panel">
        <div 
          className="auth-visual-bg" 
          style={{ backgroundImage: `url(${heroMycelium})` }}
        />
        <div className="auth-visual-orb" />
        
        {/* Brand */}
        <Link 
          to="/" 
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 10
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            biotech
          </span>
          TEMPE.AI
        </Link>

        {/* HUD clinical visualization */}
        <div className="auth-visual-content">
          <div className="mono-tag" style={{ width: 'max-content' }}>
            <span className="material-symbols-outlined animate-pulse-glow" style={{ fontSize: '10px' }}>
              security
            </span>
            SECURE LINK PORT: ESTABLISHED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h2 className="h2-text" style={{ fontSize: '1.5rem', margin: 0 }}>
              Access Mycology Labs
            </h2>
            <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
              Authorized personal only. All classification transactions are encrypted and audited for biological safety logs.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mono-tag" style={{ width: 'max-content', opacity: 0.7, zIndex: 10 }}>
          IP SECURE / PORT 443 ENCRYPTED
        </div>
      </div>

      {/* RIGHT COLUMN: Form Panel */}
      <div className="auth-form-panel">
        <GlassCard className="auth-card" hover={false}>
          {/* Tab Selector */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              LOGIN
            </button>
            <button 
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              REGISTER
            </button>
          </div>

          <h3 className="h3-text" style={{ marginBottom: '1.5rem', fontSize: '1.15rem' }}>
            {activeTab === 'login' ? 'Researcher Login Portal' : 'Register Researcher ID'}
          </h3>

          <form className="auth-form" onSubmit={handleSubmit}>
            {activeTab === 'register' && (
              <Input
                label="Full Identity Name"
                placeholder="Dr. Alexander Wright"
                icon="badge"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                required
                disabled={loading}
              />
            )}

            <Input
              label="Researcher Email Address"
              placeholder="name@institute.edu"
              icon="mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              disabled={loading}
            />

            <div className="form-group" style={{ position: 'relative' }}>
              <Input
                label="Security Password"
                placeholder="••••••••"
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                style={{ top: label => label ? '72%' : '70%' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {activeTab === 'register' && (
              <Input
                label="Confirm Security Password"
                placeholder="••••••••"
                icon="lock_clock"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
                disabled={loading}
              />
            )}

            <div style={{ marginTop: '0.5rem' }}>
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading}
                style={{ width: '100%', padding: '0.85rem 0' }}
              >
                {activeTab === 'login' ? 'AUTHORIZE ACCESS' : 'CREATE PROTOCOL ACCESS'}
              </Button>
            </div>
          </form>

          {/* Quick exit */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link 
              to="/" 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-outline)',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--color-secondary-fixed)'}
              onMouseLeave={e => e.target.style.color = 'var(--color-outline)'}
            >
              &larr; Return to Public Platform
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
export default AuthPage
