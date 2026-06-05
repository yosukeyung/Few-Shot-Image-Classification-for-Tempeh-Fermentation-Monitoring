import React, { useEffect, useRef, useState } from 'react'
import Button from './Button'
import './CameraCapture.css'

export const CameraCapture = ({ onCapture, onError }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [permissionState, setPermissionState] = useState('prompt') // prompt, granted, denied, error
  const [active, setActive] = useState(false)

  // Start stream on mount
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    stopCamera() // Ensure clean slate
    setPermissionState('prompt')
    
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Prefer rear-facing camera on mobile
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setPermissionState('granted')
      setActive(true)
    } catch (err) {
      console.error('Camera stream access failed:', err)
      setPermissionState('denied')
      if (onError) onError(err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setActive(false)
  }

  const handleCapture = () => {
    if (!videoRef.current || !active) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    
    // Create square crop
    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Center crop
    const startX = (video.videoWidth - size) / 2
    const startY = (video.videoHeight - size) / 2
    
    // Draw mirrored or standard frame
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1) // Match the mirrored feed preview
    
    ctx.drawImage(
      video,
      startX, startY, size, size, // Source box
      0, 0, canvas.width, canvas.height // Destination box
    )

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `captured-specimen-${Date.now()}.jpg`, { type: 'image/jpeg' })
          const previewUrl = URL.createObjectURL(blob)
          onCapture(file, previewUrl)
          stopCamera()
        }
      },
      'image/jpeg',
      0.95
    )
  }

  return (
    <div className="camera-wrapper">
      {permissionState === 'granted' && (
        <>
          <video 
            ref={videoRef} 
            className="camera-feed"
            playsInline
            muted
          />
          <div className="camera-rec-badge">
            <span className="camera-rec-dot" />
            REC LIVE
          </div>
          <div className="camera-controls">
            <Button 
              variant="primary" 
              onClick={handleCapture}
              icon="photo_camera"
              style={{ padding: '0.875rem 2rem', borderRadius: '50px' }}
            >
              CAPTURE SPECIMEN
            </Button>
          </div>
        </>
      )}

      {permissionState === 'denied' && (
        <div className="camera-fallback">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-error)' }}>
            videocam_off
          </span>
          <div style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>Lens Activation Blocked</div>
          <p style={{ fontSize: '0.8rem', maxWidth: '320px', margin: 0 }}>
            Unable to access local video stream. Please verify camera permissions in your browser or switch to the specimen file upload protocol.
          </p>
          <Button variant="secondary" onClick={startCamera} icon="refresh" style={{ marginTop: '0.5rem' }}>
            RETRY CALIBRATION
          </Button>
        </div>
      )}

      {permissionState === 'prompt' && (
        <div className="camera-fallback">
          <span className="material-symbols-outlined animate-orbit" style={{ fontSize: '2.5rem', color: 'var(--color-secondary-fixed)' }}>
            sync
          </span>
          <p style={{ fontSize: '0.85rem' }}>INITIALIZING NEURAL LENS...</p>
        </div>
      )}
    </div>
  )
}
export default CameraCapture
