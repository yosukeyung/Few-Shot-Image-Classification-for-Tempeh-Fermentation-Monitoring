import React, { useEffect, useRef, useState } from 'react';
import logoVideo from '../assets/logo.mp4';

const SplashScreen = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [waitingForClick, setWaitingForClick] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleVideoEnd = () => onComplete();
    vid.addEventListener('ended', handleVideoEnd);

    // Try autoplay with audio
    vid.play().catch(() => {
      // Browser blocked autoplay with audio → show click overlay
      setWaitingForClick(true);
    });

    return () => {
      vid.removeEventListener('ended', handleVideoEnd);
    };
  }, [onComplete]);

  const handleUserClick = () => {
    const vid = videoRef.current;
    if (vid) {
      vid.play();
    }
    setWaitingForClick(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Video — NOT muted so audio plays */}
      <video
        ref={videoRef}
        src={logoVideo}
        playsInline
        onEnded={onComplete}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />

      {/* Click-to-start overlay (shown only when browser blocks autoplay with audio) */}
      {waitingForClick && (
        <div
          onClick={handleUserClick}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: '1.5rem',
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: '2rem' }}>▶</span>
          </div>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Click to start
          </p>
        </div>
      )}

      {/* Skip button */}
      {!waitingForClick && (
        <button
          onClick={onComplete}
          style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.6)',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          SKIP
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
