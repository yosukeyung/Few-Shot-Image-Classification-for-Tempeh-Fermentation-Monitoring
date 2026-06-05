import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { checkHealth } from '../lib/api'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import './DashboardPage.css'

export const DashboardPage = () => {
  const { profile, user } = useAuth()
  
  // Dashboard states
  const [totalClassifications, setTotalClassifications] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState([
    { label: 'Mon', count: 0 },
    { label: 'Tue', count: 0 },
    { label: 'Wed', count: 0 },
    { label: 'Thu', count: 0 },
    { label: 'Fri', count: 0 },
    { label: 'Sat', count: 0 },
    { label: 'Sun', count: 0 },
  ])

  useEffect(() => {
    if (!user) return

    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch total classifications count
        const { count, error: countError } = await supabase
          .from('classifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          
        if (countError) throw countError
        setTotalClassifications(count || 0)

        // 2. Fetch recent activity (latest 4)
        const { data: recent, error: recentError } = await supabase
          .from('classifications')
          .select('id, specimen_id, prediction, confidence, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4)

        if (recentError) throw recentError
        setRecentActivity(recent || [])

        // 3. Process weekly stats chart data
        const { data: allHistory, error: historyError } = await supabase
          .from('classifications')
          .select('created_at')
          .eq('user_id', user.id)

        if (historyError) throw historyError
        
        if (allHistory && allHistory.length > 0) {
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const tempStats = [
            { label: 'Mon', count: 0 },
            { label: 'Tue', count: 0 },
            { label: 'Wed', count: 0 },
            { label: 'Thu', count: 0 },
            { label: 'Fri', count: 0 },
            { label: 'Sat', count: 0 },
            { label: 'Sun', count: 0 },
          ]
          
          allHistory.forEach(item => {
            const date = new Date(item.created_at)
            const dayName = daysOfWeek[date.getDay()]
            const matchIndex = tempStats.findIndex(s => s.label === dayName)
            if (matchIndex !== -1) {
              tempStats[matchIndex].count += 1
            }
          })
          setWeeklyStats(tempStats)
        }

        // 4. Ping API Server
        const health = await checkHealth()
        setApiStatus(health.status === 'online' ? 'online' : 'offline')
        
      } catch (err) {
        console.error('Error loading dashboard statistics:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Get relative time (e.g. "2 hours ago")
  const getRelativeTime = (isoString) => {
    const date = new Date(isoString)
    const diffMs = new Date() - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Find max weekly count to calculate bar height percentages
  const maxWeeklyCount = Math.max(...weeklyStats.map(s => s.count), 1)

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-welcome">Welcome back, {profile?.full_name?.split(' ')[0] || 'Researcher'}.</h1>
          <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
            Biochemical lens ready for visual specimen classification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <StatusBadge status={apiStatus === 'online' ? 'online' : apiStatus === 'checking' ? 'warning' : 'offline'} label={`Neural Engine: ${apiStatus}`} />
        </div>
      </div>

      {/* DASHBOARD BENTO GRID */}
      <div className="dashboard-grid">
        {/* ROW 1: Launch Classifier & Mini Metrics */}
        
        {/* Main CTA: START ENGINE */}
        <GlassCard className="dashboard-engine-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 5 }}>
            <div className="mono-tag" style={{ width: 'max-content' }}>
              SYSTEM STATUS: CALIBRATED
            </div>
            <h2 className="h2-text" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
              Maturity Classification Lens
            </h2>
            <p className="body-md" style={{ color: 'var(--color-outline)', maxWidth: '480px', margin: 0 }}>
              Initiate the neural engine to classify specimen culture fermentation. Supports WebRTC live camera capture or high-resolution upload.
            </p>
          </div>
          <div style={{ zIndex: 5 }}>
            <Link to="/classify" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              START ENGINE
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </Link>
          </div>
        </GlassCard>

        {/* Small Metric: Total Runs */}
        <GlassCard className="dashboard-metric-card">
          <div className="dashboard-metric-header">
            <span className="dashboard-metric-title">TOTAL ANALYSES</span>
            <span className="material-symbols-outlined dashboard-metric-icon">query_stats</span>
          </div>
          <div className="dashboard-metric-value">
            {loading ? '---' : totalClassifications}
          </div>
        </GlassCard>

        {/* ROW 2: Activity logs & Weekly Chart (now Row 2 starts directly) */}

        {/* Recent Classifications */}
        <GlassCard className="dashboard-activity-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 className="h3-text" style={{ fontSize: '1.1rem' }}>Specimen Log</h3>
            <p className="body-md" style={{ color: 'var(--color-outline)', fontSize: '0.8rem', margin: 0 }}>
              Latest analysis sessions completed on this terminal.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="shimmer-loading" style={{ height: '50px', borderRadius: 'var(--radius-md)' }} />
              <div className="shimmer-loading" style={{ height: '50px', borderRadius: 'var(--radius-md)' }} />
              <div className="shimmer-loading" style={{ height: '50px', borderRadius: 'var(--radius-md)' }} />
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
              color: 'var(--color-outline)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textAlign: 'center',
              height: '100%'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.3 }}>
                folder_open
              </span>
              NO SPECIMENS RECORDED YET
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <Link key={activity.id} to={`/result/${activity.id}`} className="activity-item">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span className="activity-specimen">{activity.specimen_id}</span>
                    <span className="activity-time">{getRelativeTime(activity.created_at)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge 
                      status={activity.prediction} 
                      label={activity.prediction.replace('_', ' ')} 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }} 
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-secondary-fixed)' }}>
                      {(activity.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Weekly Trend Bar Chart */}
        <GlassCard className="dashboard-trend-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 className="h3-text" style={{ fontSize: '1.1rem' }}>Maturity Logging Activity</h3>
            <p className="body-md" style={{ color: 'var(--color-outline)', fontSize: '0.8rem', margin: 0 }}>
              Analysis counts processed per weekday.
            </p>
          </div>

          <div className="chart-container">
            {weeklyStats.map((stat, i) => (
              <div key={i} className="chart-bar-wrapper">
                <div 
                  className="chart-bar" 
                  style={{ height: `${(stat.count / maxWeeklyCount) * 80 + 5}px` }}
                >
                  <span className="chart-bar-value">{stat.count}</span>
                </div>
                <span className="chart-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
export default DashboardPage
