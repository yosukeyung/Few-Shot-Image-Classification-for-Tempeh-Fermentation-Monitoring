import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import reasoningData from '../data/reasoning'
import GlassCard from '../components/GlassCard'
import HUDViewport from '../components/HUDViewport'
import StatusBadge from '../components/StatusBadge'
import ConfidenceRing from '../components/ConfidenceRing'
import ProgressBar from '../components/ProgressBar'
import Button from '../components/Button'
import './ResultPage.css'

export const ResultPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  // States
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('classifications')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setRecord(data)
      } catch (err) {
        console.error('Error fetching classification details:', err)
        addToast('Failed to load specimen analysis records.', 'error')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRecord()
    }
  }, [id, navigate, addToast])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this specimen log from your archive?')) return
    
    setDeleting(true)
    try {
      // 1. Delete database row
      const { error } = await supabase
        .from('classifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Note: Optionally we could delete the storage file if needed, but since it's a demo, deleting the DB row is sufficient.
      
      addToast('Specimen log deleted successfully.', 'success')
      navigate('/archive')
    } catch (err) {
      console.error('Error deleting record:', err)
      addToast(err.message || 'Failed to delete record.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: 'var(--color-secondary-fixed)',
        fontFamily: 'var(--font-mono)'
      }}>
        <span className="material-symbols-outlined animate-orbit" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          sync
        </span>
        RECONSTRUCTING ANALYSIS REPORT...
      </div>
    )
  }

  if (!record) return null

  // Resolve predicted stage reasoning data
  const predictionKey = record.prediction.toLowerCase()
  const stageInfo = reasoningData[predictionKey] || {
    title: 'Unknown Specimen Stage',
    badge: 'UNKNOWN',
    status: 'UNKNOWN ANALYSIS STATUS',
    statusType: 'error',
    description: 'No matching mycological facts are registered for this predicted output.',
    morphology: [],
    biochemicals: [],
    assessment: { statusText: 'UNKNOWN', statusType: 'danger', details: 'No assessments available.', action: 'Seek laboratory assistance.' }
  }

  // Format date
  const formattedDate = new Date(record.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // Set colors according to prediction stage
  const getStageColor = () => {
    if (predictionKey === 'day_2') return 'var(--color-primary)'
    if (predictionKey === 'day_1') return '#ffd043'
    return 'var(--color-error)'
  }

  // Extract individual probabilities, handle fallback if null
  const probabilities = record.confidences || {
    day_0: predictionKey === 'day_0' ? record.confidence : (1 - record.confidence) / 2,
    day_1: predictionKey === 'day_1' ? record.confidence : (1 - record.confidence) / 2,
    day_2: predictionKey === 'day_2' ? record.confidence : (1 - record.confidence) / 2
  }

  return (
    <div className="result-container animate-fade-in">
      {/* HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="mono-tag" style={{ color: getStageColor(), borderColor: `${getStageColor()}40` }}>
              {stageInfo.badge} IDENTIFIED
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-outline)' }}>
              REPORT ID: {record.specimen_id}
            </span>
          </div>
          <h1 className="h1-text" style={{ fontSize: '1.5rem', marginTop: '0.375rem' }}>
            Specimen Diagnostics Complete
          </h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-outline)' }}>
          TIMESTAMP: {formattedDate}
        </div>
      </div>

      {/* ROW 1: Image Viewport & Primary Confidence Metrics */}
      <div className="result-grid">
        {/* Specimen image viewer */}
        <GlassCard className="result-image-panel" hover={false}>
          <span className="mono-tag">LENS OUTPUT SPECTRA</span>
          <HUDViewport 
            status={predictionKey} 
            label={`VALIDATED: ${record.prediction.replace('_', ' ')}`}
            info={record.specimen_id}
            aspectRatio="16 / 9"
          >
            <img 
              src={record.image_url} 
              alt="Specimen evaluation print" 
              className="result-specimen-img" 
            />
          </HUDViewport>
        </GlassCard>

        {/* Confidence breakdown stats */}
        <GlassCard className="result-metrics-panel" hover={false}>
          <div>
            <span className="mono-tag" style={{ marginBottom: '1.5rem', display: 'block', width: 'max-content' }}>
              PROBABILISTIC ANALYSIS
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0 2rem 0' }}>
              <ConfidenceRing 
                percentage={record.confidence} 
                size={140} 
                strokeWidth={10} 
                color={getStageColor()} 
              />
            </div>
          </div>
          
          {/* Class Distributions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <ProgressBar label="Day 0: Unfermented" percentage={probabilities.day_0 || 0} color="var(--color-error)" />
            <ProgressBar label="Day 1: Intermediate" percentage={probabilities.day_1 || 0} color="#ffd043" />
            <ProgressBar label="Day 2: Mature Cake" percentage={probabilities.day_2 || 0} color="var(--color-primary)" />
          </div>
        </GlassCard>
      </div>

      {/* ROW 2: Biological & Chemical Diagnostics */}
      <GlassCard className="result-reasoning-panel" hover={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className="mono-tag" style={{ width: 'max-content' }}>🧬 BIOLOGICAL DIAGNOSTIC REPORT</span>
          <h2 className="h2-text" style={{ fontSize: '1.25rem', marginTop: '0.5rem', textTransform: 'capitalize' }}>
            {stageInfo.title}
          </h2>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem', margin: 0 }}>
            {stageInfo.description}
          </p>
        </div>

        <div className="reasoning-subgrid">
          {/* Morphological facts card */}
          <div className="reasoning-list-card">
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-secondary-fixed)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Morphological Characteristics
            </h4>
            <ul className="reasoning-list">
              {stageInfo.morphology.map((text, idx) => (
                <li key={idx} className="reasoning-list-item">
                  <span className="material-symbols-outlined reasoning-list-icon">adjust</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Biochemical facts card */}
          <div className="reasoning-list-card">
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-secondary-fixed)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Biochemical Indicators
            </h4>
            <ul className="reasoning-list">
              {stageInfo.biochemicals.map((text, idx) => (
                <li key={idx} className="reasoning-list-item">
                  <span className="material-symbols-outlined reasoning-list-icon">science</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Safety & Consumbality assessment container */}
        <div className={`assessment-box assessment-${stageInfo.assessment.statusType}`}>
          <div className="assessment-title-row">
            <span className="material-symbols-outlined assessment-title-icon" style={{
              color: stageInfo.assessment.statusType === 'success' ? 'var(--color-primary)' :
                     stageInfo.assessment.statusType === 'warning' ? '#ffd043' : 'var(--color-error)'
            }}>
              {stageInfo.assessment.statusType === 'success' ? 'verified_user' : 'warning'}
            </span>
            <span className="assessment-title-text" style={{
              color: stageInfo.assessment.statusType === 'success' ? 'var(--color-primary)' :
                     stageInfo.assessment.statusType === 'warning' ? '#ffd043' : 'var(--color-error)'
            }}>
              ASSESSMENT: {stageInfo.assessment.statusText}
            </span>
          </div>

          <p className="assessment-desc">
            {stageInfo.assessment.details}
          </p>

          <div className="assessment-action-card">
            <span className="assessment-action-label">RECOM_PROTOCOL</span>
            <span className="assessment-action-desc">
              {stageInfo.assessment.action}
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="action-row">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="danger" onClick={handleDelete} loading={deleting} icon="delete">
              DELETE LOG
            </Button>
            <Button variant="secondary" onClick={handlePrint} icon="print">
              PRINT SUMMARY
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/classify" className="btn btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>biotech</span>
              NEW SPECIMEN
            </Link>
            <Link to="/dashboard" className="btn btn-primary">
              RETURN TO CONSOLE
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
export default ResultPage
