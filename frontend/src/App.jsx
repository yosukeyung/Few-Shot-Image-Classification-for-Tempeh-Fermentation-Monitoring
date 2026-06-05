import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AuthGuard from './components/AuthGuard'
import AppLayout from './components/AppLayout'
import SplashScreen from './components/SplashScreen'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ClassifierPage from './pages/ClassifierPage'
import ResultPage from './pages/ResultPage'
import ArchivePage from './pages/ArchivePage'
import AccountPage from './pages/AccountPage'

// Toast CSS
import './components/Toast.css'

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('splashShown') ? false : true;
  });

  const handleSplashEnd = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashEnd} />;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes — wrapped with AppLayout (sidebar) */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/classify"
            element={
              <AuthGuard>
                <AppLayout>
                  <ClassifierPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/result/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <ResultPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/archive"
            element={
              <AuthGuard>
                <AppLayout>
                  <ArchivePage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/account"
            element={
              <AuthGuard>
                <AppLayout>
                  <AccountPage />
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
