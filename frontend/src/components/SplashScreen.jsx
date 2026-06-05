import React, { useEffect, useRef, useState } from 'react';
import logoVideo from '../assets/logo.mp4';

const SplashScreen = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true); // Start muted for guaranteed autoplay

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleVideoEnd = () => onComplete();
    vid.addEventListener('ended', handleVideoEnd);

    // Start muted → browser will allow autoplay
    vid.muted = true;
    vid.play().then(() => {
      // Once playing, try to unmute for audio
      vid.muted = false;
      setIsMuted(false);
    }).catch(() => {
      // Still muted but video plays — that's fine
    });

    return () => {
      vid.removeEventListener('ended', handleVideoEnd);
    };
  }, [onComplete]);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
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

      {/* Mute/unmute icon — small, unobtrusive, bottom-left */}
      <button
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2rem',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Skip button */}
      <button
        onClick={onComplete}
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)',
          padding: '0.4rem 1rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        SKIP
      </button>
    </div>
  );
};

export default SplashScreen;
