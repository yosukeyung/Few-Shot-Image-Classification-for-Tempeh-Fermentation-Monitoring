import React, { useState } from 'react'
import SideNavBar from './SideNavBar'
import './AppLayout.css'

export const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="app-layout bg-hex-grid">
      {/* Mobile Top Bar Header */}
      <header className="app-header">
        <button 
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-on-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
            {sidebarOpen ? 'close' : 'menu'}
          </span>
        </button>

        <a href="/dashboard" className="app-mobile-brand">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '1.25rem' }}>
            biotech
          </span>
          TEMPE.AI
        </a>

        {/* Placeholder spacer for center balance */}
        <div style={{ width: '24px' }}></div>
      </header>

      {/* Overlay for closing mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
        />
      )}

      {/* Sidebar - gets extra class on mobile when open */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'mobile-open' : ''}`} onClick={closeSidebar}>
        <SideNavBar />
      </div>

      {/* Main content viewport */}
      <main className="app-main animate-fade-in">
        {children}
      </main>

      <style>{`
        /* Scoped style integration for responsive wrapper */
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
          }
          .sidebar-wrapper.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
export default AppLayout
