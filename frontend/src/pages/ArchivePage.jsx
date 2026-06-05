import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import './ArchivePage.css'

const PAGE_SIZE = 12

export const ArchivePage = () => {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchRecords = useCallback(async (resetPage = false) => {
    if (!user) return
    setLoading(true)

    try {
      const currentPage = resetPage ? 0 : page

      let query = supabase
        .from('classifications')
        .select('id, specimen_id, prediction, confidence, image_url, created_at', { count: 'exact' })
        .eq('user_id', user.id)

      // Filter by day
      if (filter !== 'all') {
        query = query.eq('prediction', filter)
      }

      // Sort order
      if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
      else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true })
      else if (sortBy === 'confidence') query = query.order('confidence', { ascending: false })

      // Pagination
      query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

      const { data, count, error } = await query
      if (error) throw error

      if (resetPage) {
        setRecords(data || [])
        setPage(0)
      } else {
        setRecords(prev => [...prev, ...(data || [])])
      }

      setTotalCount(count || 0)
      setHasMore((count || 0) > (currentPage + 1) * PAGE_SIZE)
    } catch (err) {
      console.error('Error fetching archive records:', err)
      addToast('Failed to load archive data.', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, filter, sortBy, page])

  useEffect(() => {
    fetchRecords(true)
  }, [filter, sortBy, user])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchRecords(false)
  }

  const handleDelete = async (e, recordId) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Delete this specimen log from your archive?')) return

    setDeletingId(recordId)
    try {
      const { error } = await supabase
        .from('classifications')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      setRecords(prev => prev.filter(r => r.id !== recordId))
      setTotalCount(prev => prev - 1)
      addToast('Specimen record purged from archive.', 'success')
    } catch (err) {
      console.error('Delete error:', err)
      addToast(err.message || 'Failed to delete record.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

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

  const getDayBadgeColors = (prediction) => {
    if (prediction === 'day_2') return 'var(--color-primary)'
    if (prediction === 'day_1') return '#ffd043'
    return 'var(--color-error)'
  }

  return (
    <div className="archive-container">
      {/* HEADER */}
      <div className="archive-header">
        <div>
          <h1 className="h1-text" style={{ fontSize: '1.5rem' }}>Classification Archive</h1>
          <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
            Historical specimen analysis records
          </p>
        </div>
        <div className="mono-tag" style={{ color: 'var(--color-secondary-fixed)', borderColor: 'rgba(99, 247, 255, 0.2)' }}>
          {totalCount} SPECIMENS LOGGED
        </div>
      </div>

      {/* FILTER & SORT CONTROLS */}
      <GlassCard className="archive-controls" hover={false}>
        {/* Filter Pills */}
        <div className="filter-pills">
          {['all', 'day_0', 'day_1', 'day_2'].map(f => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'ALL STAGES' : f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="archive-controls-divider" />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="confidence">Highest Confidence</option>
        </select>
      </GlassCard>

      {/* ARCHIVE GRID */}
      {loading && records.length === 0 ? (
        <div className="archive-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              <div className="shimmer-loading" style={{ height: '200px' }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="shimmer-loading" style={{ height: '14px', borderRadius: 'var(--radius-sm)', width: '60%' }} />
                <div className="shimmer-loading" style={{ height: '14px', borderRadius: 'var(--radius-sm)', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        /* Empty State */
        <GlassCard className="archive-empty" hover={false}>
          <span className="material-symbols-outlined archive-empty-icon">
            folder_open
          </span>
          <div>
            <h3 className="h3-text" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              No Specimens Analyzed Yet
            </h3>
            <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0, maxWidth: '400px' }}>
              Begin your first classification session to build your research archive.
            </p>
          </div>
          <Link to="/classify" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            LAUNCH CLASSIFIER
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
          </Link>
        </GlassCard>
      ) : (
        <>
          <div className="archive-grid">
            {records.map((record, idx) => (
              <Link
                key={record.id}
                to={`/result/${record.id}`}
                className="glass-panel glass-panel-hover archive-card"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Delete overlay button */}
                <button
                  className="archive-delete-btn"
                  onClick={(e) => handleDelete(e, record.id)}
                  title="Delete from archive"
                  disabled={deletingId === record.id}
                >
                  {deletingId === record.id ? (
                    <span className="material-symbols-outlined animate-orbit" style={{ fontSize: '0.875rem' }}>sync</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>delete</span>
                  )}
                </button>

                {/* Image with HUD corners */}
                <div className="archive-card-img-wrapper">
                  <div className="archive-img-corner archive-img-corner-tl" />
                  <div className="archive-img-corner archive-img-corner-tr" />
                  <div className="archive-img-corner archive-img-corner-bl" />
                  <div className="archive-img-corner archive-img-corner-br" />
                  {record.image_url ? (
                    <img
                      src={record.image_url}
                      alt={record.specimen_id}
                      className="archive-card-img"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: record.image_url ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    background: 'var(--color-surface-container-lowest)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--color-outline)', opacity: 0.3 }}>
                      image_not_supported
                    </span>
                  </div>
                </div>

                {/* Card metadata */}
                <div className="archive-card-meta">
                  <div className="archive-card-header">
                    <span className="archive-card-id">{record.specimen_id}</span>
                    <span className="archive-card-confidence">
                      {(record.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusBadge
                      status={record.prediction}
                      label={record.prediction.replace('_', ' ')}
                    />
                    <span className="archive-card-timestamp">
                      {getRelativeTime(record.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="archive-load-more">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                icon="expand_more"
              >
                LOAD MORE SPECIMENS
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ArchivePage
