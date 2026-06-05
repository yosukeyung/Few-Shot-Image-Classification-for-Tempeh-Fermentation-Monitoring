import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const TopNavBar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('')
      return
    }

    const sections = ['problem', 'technology', 'how-it-works', 'about']
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -50% 0px', // accounting for header height and screen mid-point
      threshold: 0
    }

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    
    // Add small delay to ensure elements are mounted in DOM
    const timer = setTimeout(() => {
      sections.forEach(id => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [location.pathname])

  const handleScroll = (elementId) => {
    setMobileMenuOpen(false)
    // If not on home page, navigate home first
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: elementId } })
      return
    }

    const element = document.getElementById(elementId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--header-height)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 3rem',
          background: 'rgba(14, 20, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99, 247, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
        }}
      >
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
            gap: '0.5rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            biotech
          </span>
          TEMPE.AI
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-desktop-links">
          <button 
            onClick={() => handleScroll('problem')}
            className={`nav-link ${activeSection === 'problem' ? 'active' : ''}`}
          >
            Problem
          </button>
          <button 
            onClick={() => handleScroll('technology')}
            className={`nav-link ${activeSection === 'technology' ? 'active' : ''}`}
          >
            Technology
          </button>
          <button 
            onClick={() => handleScroll('how-it-works')}
            className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
          >
            Protocol
          </button>
          <button 
            onClick={() => handleScroll('about')}
            className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
          >
            About
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="nav-desktop-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              DASHBOARD
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                arrow_forward
              </span>
            </Link>
          ) : (
            <>
              <Link 
                to="/auth" 
                state={{ tab: 'login' }}
                style={{
                  color: 'var(--color-on-surface-variant)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-secondary-fixed)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-on-surface-variant)'}
              >
                Login
              </Link>
              <Link to="/auth" state={{ tab: 'register' }} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                REGISTER
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Icon */}
        <button 
          onClick={toggleMobileMenu}
          className="nav-mobile-toggle"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-on-surface)',
            cursor: 'pointer',
            display: 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            top: 'var(--header-height)',
            left: '1rem',
            right: '1rem',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0
          }}
        >
          <button 
            onClick={() => handleScroll('problem')}
            className={`nav-link ${activeSection === 'problem' ? 'active' : ''}`}
            style={{ textAlign: 'left', width: '100%' }}
          >
            Problem
          </button>
          <button 
            onClick={() => handleScroll('technology')}
            className={`nav-link ${activeSection === 'technology' ? 'active' : ''}`}
            style={{ textAlign: 'left', width: '100%' }}
          >
            Technology
          </button>
          <button 
            onClick={() => handleScroll('how-it-works')}
            className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
            style={{ textAlign: 'left', width: '100%' }}
          >
            Protocol
          </button>
          <button 
            onClick={() => handleScroll('about')}
            className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
            style={{ textAlign: 'left', width: '100%' }}
          >
            About
          </button>
          <hr style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
                DASHBOARD
              </Link>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  state={{ tab: 'login' }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary" 
                  style={{ width: '100%' }}
                >
                  LOGIN
                </Link>
                <Link 
                  to="/auth" 
                  state={{ tab: 'register' }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSS overrides for desktop vs mobile layouts + glowing link animations */}
      <style>{`
        .nav-link {
          background: none;
          border: none;
          color: var(--color-on-surface-variant);
          font-family: var(--font-body);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          padding: 0.5rem 0;
          position: relative;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--color-secondary-fixed) !important;
          text-shadow: 0 0 8px rgba(99, 247, 255, 0.4);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-secondary-fixed);
          box-shadow: 0 0 8px var(--color-secondary-fixed);
          transition: width var(--transition-fast);
          border-radius: 2px;
        }
        .nav-link.active::after {
          width: 100%;
        }
        @media (max-width: 768px) {
          .nav-desktop-links, .nav-desktop-actions {
            display: none !important;
          }
          .nav-mobile-toggle {
            display: block !important;
          }
          .nav-link::after {
            display: none; /* remove underline indicator on mobile dropdown */
          }
        }
      `}</style>
    </>
  )
}
export default TopNavBar
